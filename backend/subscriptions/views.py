from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from salons.models import Salon
from .models import Subscription, PLANS



def _get_or_create_sub(salon):
    sub, _ = Subscription.objects.get_or_create(salon=salon)
    return sub


def _sub_data(sub):
    plan_meta = PLANS.get(sub.plan, {})
    return {
        'plan':            sub.plan,
        'plan_name':       plan_meta.get('name', sub.plan),
        'plan_color':      plan_meta.get('color', '#6B7280'),
        'plan_popular':    plan_meta.get('popular', False),
        'status':          sub.status,
        'is_active':       sub.is_active,
        'days_remaining':  sub.days_remaining,
        'expires_at':      sub.expires_at.isoformat() if sub.expires_at else None,
        'started_at':      sub.started_at.isoformat(),
        'billing_name':    sub.billing_name,
        'billing_email':   sub.billing_email,
        'card_last4':      sub.card_last4,
        'amount_paid':     str(sub.amount_paid),
        'transaction_ref': sub.transaction_ref,
        'features':        sub.plan_features,
        'can_use_cosmetics': sub.can_use_cosmetics,
    }


class SubscriptionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        salon = get_object_or_404(Salon, owner=request.user)
        sub = _get_or_create_sub(salon)
        return Response({
            'subscription': _sub_data(sub),
            'plans': {
                key: {
                    'name': val['name'],
                    'tagline': val['tagline'],
                    'price': val['price'],
                    'duration_days': val['duration_days'],
                    'color': val['color'],
                    'popular': val.get('popular', False),
                    'bullets': val['bullets'],
                    'not_included': val['not_included'],
                    'features': val['features'],
                }
                for key, val in PLANS.items()
            },
        })


class SubscribeView(APIView):
    """
    Kept for backward-compat but payment is now handled by /api/payments/initiate/.
    This endpoint is only called by PayHere notify (via payments app internals).
    Direct POST here returns 410 Gone to prevent legacy usage.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(
            {'detail': 'Direct card payment is no longer supported. Use /api/payments/initiate/ to pay via PayHere.'},
            status=status.HTTP_410_GONE,
        )


class CancelSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        salon = get_object_or_404(Salon, owner=request.user)
        try:
            sub = salon.subscription
        except Subscription.DoesNotExist:
            return Response({'detail': 'No subscription found.'}, status=status.HTTP_404_NOT_FOUND)

        if sub.plan == 'free_trial':
            return Response({'detail': 'Free Trial cannot be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        sub.status = 'cancelled'
        sub.save(update_fields=['status'])

        if salon.cosmetics_enabled:
            salon.cosmetics_enabled = False
            salon.save(update_fields=['cosmetics_enabled'])

        return Response({'success': True, 'message': 'Subscription cancelled.'})


class PublicPlansView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            key: {
                'name': val['name'],
                'tagline': val['tagline'],
                'price': val['price'],
                'color': val['color'],
                'popular': val.get('popular', False),
                'bullets': val['bullets'],
            }
            for key, val in PLANS.items()
        })
