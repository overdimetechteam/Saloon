import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Avg, Count, Sum
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

logger = logging.getLogger(__name__)


class LoginThrottle(AnonRateThrottle):
    scope = 'auth_login'

class RegisterThrottle(AnonRateThrottle):
    scope = 'auth_register'

class ResetThrottle(AnonRateThrottle):
    scope = 'auth_reset'
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from .models import CustomUser, Notification
from .serializers import RegisterSerializer, UserSerializer, NotificationSerializer


# ── Email helpers ──────────────────────────────────────────────────────────────

def _email_html(heading, body_html, cta_url, cta_label, footnote):
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#0D9488,#14B8A8);padding:40px 32px;text-align:center">
      <div style="font-size:26px;color:#fff;font-weight:900;letter-spacing:-0.02em">✦ Saloon</div>
      <div style="color:rgba(255,255,255,.8);font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-top:6px">Beauty &amp; Wellness</div>
    </div>
    <div style="padding:36px 32px">
      <h2 style="margin:0 0 16px;font-size:22px;color:#1a1a2e;font-weight:700">{heading}</h2>
      {body_html}
      <div style="text-align:center;margin:32px 0">
        <a href="{cta_url}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#0D9488,#14B8A8);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">{cta_label}</a>
      </div>
      <p style="color:#9ca3af;font-size:12px;line-height:1.6;text-align:center;margin:0">{footnote}<br>This link expires in 24 hours.</p>
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #f3f4f6">
        <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0">Or copy this URL:<br><span style="color:#0D9488;word-break:break-all">{cta_url}</span></p>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6">
      <p style="margin:0;font-size:11px;color:#9ca3af">© 2026 Saloon · Beauty &amp; Wellness Platform</p>
    </div>
  </div>
</body></html>"""


def _send_verification_email(user):
    uid   = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    url   = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
    html  = _email_html(
        heading=f"Hi {user.full_name or 'there'}, verify your email",
        body_html='<p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 8px">Thanks for signing up! Click the button below to verify your email address and activate your Saloon account.</p>',
        cta_url=url,
        cta_label="Verify Email Address",
        footnote="If you didn't create a Saloon account, you can safely ignore this email.",
    )
    send_mail(
        subject="Verify your Saloon account",
        message=f"Verify your email: {url}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html,
        fail_silently=False,
    )


def _send_password_reset_email(user, reset_url):
    html = _email_html(
        heading="Reset your password",
        body_html='<p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 8px">We received a request to reset the password for your Saloon account. Click the button below to choose a new password.</p>',
        cta_url=reset_url,
        cta_label="Reset Password",
        footnote="If you didn't request a password reset, you can safely ignore this email.",
    )
    send_mail(
        subject="Reset your Saloon password",
        message=f"Reset your password: {reset_url}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html,
        fail_silently=False,
    )


# ── Auth views ─────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes   = [RegisterThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user.role == 'client':
                email_sent = True
                try:
                    _send_verification_email(user)
                except Exception as e:
                    logger.error('Verification email failed for %s: %s', user.email, e)
                    email_sent = False
                return Response({
                    'message': (
                        'Account created. Please check your email to verify your account.'
                        if email_sent else
                        'Account created, but we could not send the verification email. '
                        'Please use the resend option on the login page.'
                    ),
                    'requires_verification': True,
                    'email_sent': email_sent,
                }, status=status.HTTP_201_CREATED)
            # Non-client roles (employees created internally etc.) — auto-login
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes   = [LoginThrottle]

    def post(self, request):
        email    = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        user = authenticate(request, username=email, password=password)
        if user is None:
            logger.warning('Failed login attempt for email: %s', email)
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.email_verified and user.role == 'client':
            return Response(
                {'detail': 'Please verify your email before logging in.', 'code': 'email_not_verified'},
                status=status.HTTP_403_FORBIDDEN,
            )
        refresh = RefreshToken.for_user(user)
        logger.info('User %s logged in', user.pk)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    throttle_classes   = [ResetThrottle]

    def post(self, request):
        uid   = request.data.get('uid', '')
        token = request.data.get('token', '')
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user    = CustomUser.objects.get(pk=user_id)
            if not default_token_generator.check_token(user, token):
                return Response({'detail': 'Verification link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)
            user.email_verified = True
            user.save(update_fields=['email_verified'])
            return Response({'message': 'Email verified successfully. You can now log in.'})
        except Exception:
            return Response({'detail': 'Invalid verification link.'}, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes   = [ResetThrottle]

    def post(self, request):
        email = request.data.get('email', '').strip()
        try:
            user = CustomUser.objects.get(email=email)
            if user.email_verified:
                return Response({'message': 'This email is already verified. You can log in.'})
            _send_verification_email(user)
            return Response({'message': 'Verification email sent! Check your inbox (and spam folder).'})
        except CustomUser.DoesNotExist:
            # Return same message to avoid email enumeration
            return Response({'message': 'If that email is registered and unverified, a new link has been sent.'})
        except Exception as e:
            logger.error('Resend verification failed for %s: %s', email, e)
            return Response(
                {'detail': 'Could not send verification email. Please check your email address or try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes   = [ResetThrottle]

    def post(self, request):
        email = request.data.get('email', '').strip()
        try:
            user  = CustomUser.objects.get(email=email)
            uid   = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            _send_password_reset_email(user, reset_url)
        except CustomUser.DoesNotExist:
            pass
        except Exception as e:
            print(f"[EMAIL ERROR] {e}")
        return Response({'message': 'If that email is registered, a reset link has been sent.'})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid      = request.data.get('uid', '')
        token    = request.data.get('token', '')
        password = request.data.get('password', '')
        if not password or len(password) < 8:
            return Response({'detail': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user    = CustomUser.objects.get(pk=user_id)
            if not default_token_generator.check_token(user, token):
                return Response({'detail': 'Reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(password)
            user.save()
            return Response({'message': 'Password has been reset successfully. You can now log in.'})
        except Exception:
            return Response({'detail': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """GET own profile / PATCH update full_name and phone."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        allowed = {k: v for k, v in request.data.items() if k in ('full_name', 'phone')}
        serializer = UserSerializer(request.user, data=allowed, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """Blacklists the submitted refresh token so it cannot be reused after logout."""
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass  # already blacklisted or invalid — treat as logged out
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


# ── Notifications ──────────────────────────────────────────────────────────────

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(recipient=request.user)[:50]
        return Response(NotificationSerializer(notifs, many=True).data)


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'count': count})


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'ok'})


class NotificationMarkOneReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        notif = get_object_or_404(Notification, pk=pk, recipient=request.user)
        notif.is_read = True
        notif.save()
        return Response(NotificationSerializer(notif).data)


# ── Admin: Customer management ─────────────────────────────────────────────────

class AdminCustomerListView(APIView):
    """GET /api/users/admin/customers/ — all clients with basic stats."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from users.permissions import IsSystemAdmin
        if not IsSystemAdmin().has_permission(request, self):
            from rest_framework.response import Response as R
            return R({'detail': 'Forbidden.'}, status=403)

        customers = (
            CustomUser.objects
            .filter(role='client')
            .annotate(
                total_bookings=Count('bookings', distinct=True),
                total_reviews=Count('reviews', distinct=True),
                total_orders=Count('cosmetic_orders', distinct=True),
                total_favourites=Count('favourites', distinct=True),
            )
            .order_by('-id')
        )

        data = []
        for u in customers:
            data.append({
                'id':               u.id,
                'full_name':        u.full_name or '',
                'email':            u.email,
                'phone':            u.phone or '',
                'is_active':        u.is_active,
                'email_verified':   u.email_verified,
                'last_login':       u.last_login,
                'total_bookings':   u.total_bookings,
                'total_reviews':    u.total_reviews,
                'total_orders':     u.total_orders,
                'total_favourites': u.total_favourites,
            })
        return Response(data)


class AdminCustomerDetailView(APIView):
    """GET /api/users/admin/customers/<pk>/ — full customer snapshot."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from users.permissions import IsSystemAdmin
        if not IsSystemAdmin().has_permission(request, self):
            return Response({'detail': 'Forbidden.'}, status=403)

        from bookings.models import Booking, Review
        from salons.models import FavouriteSalon
        from inventory.models import CosmeticOrder

        user = get_object_or_404(CustomUser, pk=pk, role='client')

        # Aggregate stats
        bookings_qs = Booking.objects.filter(client=user)
        reviews_qs  = Review.objects.filter(client=user)
        orders_qs   = CosmeticOrder.objects.filter(client=user)
        favs_qs     = FavouriteSalon.objects.filter(client=user).select_related('salon')

        total_bookings     = bookings_qs.count()
        completed_bookings = bookings_qs.filter(status='confirmed').count()
        cancelled_bookings = bookings_qs.filter(status='cancelled').count()
        total_reviews      = reviews_qs.count()
        avg_rating         = reviews_qs.aggregate(avg=Avg('rating'))['avg']
        total_orders       = orders_qs.count()
        total_spent        = float(orders_qs.aggregate(s=Sum('total'))['s'] or 0)

        # Recent bookings (last 15)
        recent_bookings = []
        for b in bookings_qs.select_related('salon', 'staff_member').prefetch_related('booking_services__service').order_by('-created_at')[:15]:
            services = [bs.service.name for bs in b.booking_services.all()]
            recent_bookings.append({
                'id':                b.id,
                'salon_name':        b.salon.name if b.salon else '—',
                'services':          services,
                'status':            b.status,
                'requested_datetime': b.requested_datetime,
                'created_at':        b.created_at,
            })

        # Reviews (last 10)
        recent_reviews = []
        for r in reviews_qs.select_related('salon').order_by('-created_at')[:10]:
            recent_reviews.append({
                'id':         r.id,
                'salon_name': r.salon.name if r.salon else '—',
                'rating':     r.rating,
                'comment':    r.comment or '',
                'created_at': r.created_at,
            })

        # Favourite salons
        favourite_salons = [
            {'id': f.salon.id, 'name': f.salon.name, 'status': f.salon.status}
            for f in favs_qs
        ]

        # Recent cosmetic orders (last 10)
        recent_orders = []
        for o in orders_qs.select_related('salon').order_by('-created_at')[:10]:
            recent_orders.append({
                'id':         o.id,
                'salon_name': o.salon.name if o.salon else '—',
                'total':      float(o.total),
                'status':     o.status,
                'created_at': o.created_at,
            })

        return Response({
            'profile': {
                'id':             user.id,
                'full_name':      user.full_name or '',
                'email':          user.email,
                'phone':          user.phone or '',
                'is_active':      user.is_active,
                'email_verified': user.email_verified,
                'last_login':     user.last_login,
            },
            'stats': {
                'total_bookings':     total_bookings,
                'completed_bookings': completed_bookings,
                'cancelled_bookings': cancelled_bookings,
                'total_reviews':      total_reviews,
                'avg_rating':         round(avg_rating, 1) if avg_rating else None,
                'total_orders':       total_orders,
                'total_spent':        round(total_spent, 2),
                'total_favourites':   favs_qs.count(),
            },
            'recent_bookings':  recent_bookings,
            'reviews':          recent_reviews,
            'favourite_salons': favourite_salons,
            'recent_orders':    recent_orders,
        })

    def patch(self, request, pk):
        """Toggle is_active for a customer account."""
        from users.permissions import IsSystemAdmin
        if not IsSystemAdmin().has_permission(request, self):
            return Response({'detail': 'Forbidden.'}, status=403)

        user = get_object_or_404(CustomUser, pk=pk, role='client')
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response({'id': user.id, 'is_active': user.is_active})
