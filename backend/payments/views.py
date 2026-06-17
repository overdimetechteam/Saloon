import uuid
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Sum, F

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from salons.models import Salon
from .models import Payment, PlatformSettings
from .utils import generate_checkout_hash, verify_notify_hash, _get_payhere_config
from users.permissions import IsSystemAdmin


# ── helpers ──────────────────────────────────────────────────────────────────

def _activate_subscription(payment):
    from subscriptions.models import Subscription, PLANS
    plan_key  = payment.plan
    plan_info = PLANS.get(plan_key)
    if not plan_info or not payment.salon:
        return
    sub, _ = Subscription.objects.get_or_create(salon=payment.salon)
    sub.plan          = plan_key
    sub.status        = 'active'
    sub.billing_name  = payment.user.full_name if payment.user else ''
    sub.billing_email = payment.user.email     if payment.user else ''
    sub.amount_paid   = payment.amount
    sub.transaction_ref = payment.payhere_payment_id or payment.order_id
    sub.expires_at    = timezone.now() + timedelta(days=plan_info['duration_days'])
    sub.save()
    # Disable cosmetics if new plan doesn't support it
    if not plan_info['features'].get('cosmetics', False) and payment.salon.cosmetics_enabled:
        payment.salon.cosmetics_enabled = False
        payment.salon.save(update_fields=['cosmetics_enabled'])


def _confirm_cosmetic_order(payment):
    from inventory.models import CosmeticOrder
    try:
        order = CosmeticOrder.objects.get(pk=payment.cosmetic_order_id)
        order.status = 'confirmed'
        order.save(update_fields=['status'])
    except CosmeticOrder.DoesNotExist:
        pass


# ── views ─────────────────────────────────────────────────────────────────────

class InitiatePaymentView(APIView):
    """
    POST /api/payments/initiate/
    Returns all fields needed to build + submit the PayHere checkout form.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payment_type = request.data.get('type', '')
        merchant_id, _, sandbox = _get_payhere_config()

        if payment_type == 'subscription':
            from subscriptions.models import PLANS
            plan_key = request.data.get('plan', '')
            if plan_key not in PLANS or plan_key == 'free_trial':
                return Response({'detail': 'Invalid plan.'}, status=status.HTTP_400_BAD_REQUEST)

            salon      = Salon.objects.filter(owner=request.user).first()
            if not salon:
                return Response({'detail': 'Salon not found.'}, status=status.HTTP_404_NOT_FOUND)

            plan_info  = PLANS[plan_key]
            amount     = plan_info['price']
            order_id   = f"PH-SUB-{uuid.uuid4().hex[:12].upper()}"
            items_desc = f"{plan_info['name']} Plan - 30 Days"

            Payment.objects.create(
                order_id=order_id,
                payment_type='subscription',
                amount=amount,
                plan=plan_key,
                user=request.user,
                salon=salon,
            )

        elif payment_type == 'cosmetics':
            from inventory.models import CosmeticOrder
            cosmetic_order_id = request.data.get('cosmetic_order_id')
            if not cosmetic_order_id:
                return Response({'detail': 'cosmetic_order_id required.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                cos_order = CosmeticOrder.objects.get(pk=cosmetic_order_id, client=request.user)
            except CosmeticOrder.DoesNotExist:
                return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

            amount     = cos_order.total
            salon      = cos_order.salon
            order_id   = f"PH-COS-{uuid.uuid4().hex[:12].upper()}"
            items_desc = f"Cosmetics Order #{cos_order.id} — {salon.name}"

            Payment.objects.create(
                order_id=order_id,
                payment_type='cosmetics',
                amount=amount,
                user=request.user,
                salon=salon,
                cosmetic_order_id=cos_order.id,
            )

        else:
            return Response({'detail': 'Invalid payment type.'}, status=status.HTTP_400_BAD_REQUEST)

        amount_str   = f"{float(amount):.2f}"
        hash_val     = generate_checkout_hash(merchant_id, order_id, amount_str)
        notify_url   = request.build_absolute_uri('/api/payments/notify/')
        frontend_url = settings.FRONTEND_URL.rstrip('/')

        full_name = (request.user.full_name or '').split()
        first_name = full_name[0] if full_name else ''
        last_name  = ' '.join(full_name[1:]) if len(full_name) > 1 else ''

        return Response({
            'checkout_url': (
                'https://sandbox.payhere.lk/pay/checkout'
                if sandbox else
                'https://www.payhere.lk/pay/checkout'
            ),
            'merchant_id': merchant_id,
            'order_id':    order_id,
            'amount':      amount_str,
            'currency':    'LKR',
            'hash':        hash_val,
            'items':       items_desc,
            'first_name':  first_name,
            'last_name':   last_name,
            'email':       request.user.email or '',
            'phone':       request.data.get('phone', '') or getattr(request.user, 'phone', '') or '',
            'address':     getattr(salon, 'address_street', '') or '',
            'city':        getattr(salon, 'address_city', '') or 'Colombo',
            'country':     'Sri Lanka',
            'notify_url':  notify_url,
            'return_url':  f"{frontend_url}/payment/success",
            'cancel_url':  f"{frontend_url}/payment/cancel",
        })


@method_decorator(csrf_exempt, name='dispatch')
class NotifyView(APIView):
    """
    POST /api/payments/notify/
    PayHere server-to-server callback — no auth, CSRF exempt.
    Verifies the hash then activates subscription or confirms cosmetic order.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        merchant_id      = request.data.get('merchant_id', '')
        order_id         = request.data.get('order_id', '')
        payhere_amount   = request.data.get('payhere_amount', '')
        payhere_currency = request.data.get('payhere_currency', 'LKR')
        status_code      = request.data.get('status_code', '')
        md5sig           = request.data.get('md5sig', '')
        payment_id       = request.data.get('payment_id', '')
        status_message   = request.data.get('status_message', '')

        if not verify_notify_hash(merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig):
            return Response({'detail': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.get(order_id=order_id)
        except Payment.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        payment.payhere_payment_id     = payment_id
        payment.payhere_status_code    = status_code
        payment.payhere_status_message = status_message

        if status_code == '2':       # Success
            payment.status = 'completed'
            payment.save()
            if payment.payment_type == 'subscription':
                _activate_subscription(payment)
            elif payment.payment_type == 'cosmetics':
                _confirm_cosmetic_order(payment)

        elif status_code == '0':     # Pending
            payment.status = 'pending'
            payment.save()

        else:                        # -1 Cancelled, -2 Failed, -3 Chargedback
            payment.status = 'failed' if status_code == '-2' else 'cancelled'
            payment.save()

        return Response({'status': 'ok'})


class PaymentStatusView(APIView):
    """GET /api/payments/status/<order_id>/ — poll payment status from frontend."""
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            payment = Payment.objects.get(order_id=order_id, user=request.user)
        except Payment.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'order_id':     payment.order_id,
            'status':       payment.status,
            'payment_type': payment.payment_type,
            'amount':       str(payment.amount),
            'plan':         payment.plan,
            'cosmetic_order_id': payment.cosmetic_order_id,
        })


# ── Admin views ────────────────────────────────────────────────────────────────

class AdminSettingsView(APIView):
    """
    GET  /api/payments/admin/settings/payhere/ — return platform PayHere settings (secret masked)
    PATCH /api/payments/admin/settings/payhere/ — update platform PayHere settings
    """
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        ps = PlatformSettings.get()
        secret = ps.payhere_merchant_secret
        masked_secret = ('*' * (len(secret) - 4) + secret[-4:]) if len(secret) > 4 else ('*' * len(secret))
        return Response({
            'payhere_merchant_id': ps.payhere_merchant_id,
            'payhere_merchant_secret_masked': masked_secret if secret else '',
            'payhere_sandbox': ps.payhere_sandbox,
            'updated_at': ps.updated_at,
        })

    def patch(self, request):
        ps = PlatformSettings.get()
        if 'payhere_merchant_id' in request.data:
            ps.payhere_merchant_id = request.data['payhere_merchant_id']
        if 'payhere_merchant_secret' in request.data:
            ps.payhere_merchant_secret = request.data['payhere_merchant_secret']
        if 'payhere_sandbox' in request.data:
            ps.payhere_sandbox = bool(request.data['payhere_sandbox'])
        ps.save()
        return Response({
            'payhere_merchant_id': ps.payhere_merchant_id,
            'payhere_sandbox': ps.payhere_sandbox,
            'updated_at': ps.updated_at,
            'detail': 'Settings updated.',
        })


class AdminStatsView(APIView):
    """GET /api/payments/admin/stats/ — platform-wide statistics for the admin dashboard."""
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        from subscriptions.models import Subscription, PLANS
        from bookings.models import Booking
        from django.utils.timezone import now

        today = now()
        month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Salon counts
        all_salons = Salon.objects.all()
        total_salons     = all_salons.count()
        active_salons    = all_salons.filter(status='active', is_suspended=False).count()
        pending_salons   = all_salons.filter(status='pending').count()
        suspended_salons = all_salons.filter(is_suspended=True).count()

        # Revenue from completed payments
        completed_payments = Payment.objects.filter(status='completed')
        total_revenue = float(
            completed_payments.aggregate(total=Sum('amount'))['total'] or 0
        )
        revenue_this_month = float(
            completed_payments.filter(created_at__gte=month_start)
            .aggregate(total=Sum('amount'))['total'] or 0
        )

        # Subscription breakdown
        subscription_breakdown = {}
        for plan_key in PLANS.keys():
            subscription_breakdown[plan_key] = Subscription.objects.filter(plan=plan_key, status='active').count()

        # Recent payments (last 10 completed)
        recent_qs = (
            completed_payments
            .select_related('salon', 'user')
            .order_by('-created_at')[:10]
        )
        recent_payments = []
        for p in recent_qs:
            recent_payments.append({
                'order_id':   p.order_id,
                'salon_name': p.salon.name if p.salon else '',
                'plan':       p.plan,
                'amount':     float(p.amount),
                'type':       p.payment_type,
                'date':       p.created_at,
            })

        # Platform-wide booking count
        total_bookings_platform = Booking.objects.count()

        # New salons this month
        new_salons_this_month = Salon.objects.filter(created_at__gte=month_start).count()

        return Response({
            'total_salons':             total_salons,
            'active_salons':            active_salons,
            'pending_salons':           pending_salons,
            'suspended_salons':         suspended_salons,
            'total_revenue':            round(total_revenue, 2),
            'revenue_this_month':       round(revenue_this_month, 2),
            'subscription_breakdown':   subscription_breakdown,
            'recent_payments':          recent_payments,
            'total_bookings_platform':  total_bookings_platform,
            'new_salons_this_month':    new_salons_this_month,
        })
