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
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from .models import CustomUser, Notification
from .serializers import RegisterSerializer, UserSerializer, NotificationSerializer


# ── Email helpers ──────────────────────────────────────────────────────────────

def _email_html(heading, preheader, body_html, cta_url, cta_label, footnote):
    """
    Table-based HTML email layout. Uses solid colours (no CSS gradients),
    no special Unicode characters, and a proper preheader — all of which
    reduce the likelihood of the message being classified as spam.
    """
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <title>{heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <!--[if !mso]><!-->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f3f4f6">{preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <!--<![endif]-->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6">
    <tr>
      <td style="padding:32px 16px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb">
          <!-- Header -->
          <tr>
            <td style="background-color:#0D9488;padding:28px 32px;text-align:center">
              <p style="margin:0;font-size:20px;color:#ffffff;font-weight:700;font-family:Arial,Helvetica,sans-serif;letter-spacing:-0.01em">BookMyStyle</p>
              <p style="margin:5px 0 0;font-size:11px;color:rgba(255,255,255,0.85);letter-spacing:0.12em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif">Beauty and Wellness</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px">
              <h1 style="margin:0 0 16px;font-size:20px;color:#111827;font-weight:700;font-family:Arial,Helvetica,sans-serif;line-height:1.3">{heading}</h1>
              {body_html}
              <!-- Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0">
                <tr>
                  <td style="background-color:#0D9488;border-radius:6px;text-align:center">
                    <a href="{cta_url}" target="_blank" style="display:block;padding:13px 32px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,Helvetica,sans-serif;white-space:nowrap">{cta_label}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footnote -->
          <tr>
            <td style="padding:0 32px 24px">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;font-family:Arial,Helvetica,sans-serif">{footnote}</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;font-family:Arial,Helvetica,sans-serif">This link is valid for 24 hours.</p>
            </td>
          </tr>
          <!-- Fallback URL -->
          <tr>
            <td style="padding:16px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb">
              <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif">If the button above does not work, open this link in your browser:</p>
              <p style="margin:0;font-size:11px;color:#0D9488;word-break:break-word;font-family:Arial,Helvetica,sans-serif">{cta_url}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
              <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif">BookMyStyle - Beauty and Wellness Platform</p>
              <p style="margin:0;font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif">Colombo, Sri Lanka</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>"""


def _send_transactional(subject, plain_text, html, to_email):
    """Send a transactional email using EmailMultiAlternatives for full header control."""
    msg = EmailMultiAlternatives(
        subject=subject,
        body=plain_text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
        reply_to=[settings.DEFAULT_FROM_EMAIL],
    )
    msg.attach_alternative(html, 'text/html')
    msg.extra_headers = {
        'X-Mailer': 'BookMyStyle',
        'X-Priority': '3',
        'Precedence': 'bulk',
    }
    msg.send(fail_silently=False)


def _send_verification_email(user):
    uid   = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    url   = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
    name  = user.full_name or 'there'

    html = _email_html(
        heading=f"Hi {name}, please confirm your email",
        preheader="You are one step away from accessing BookMyStyle. Confirm your email address to complete your registration.",
        body_html=f"""
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif">
            Thank you for creating a BookMyStyle account. To complete your registration, please confirm
            your email address by clicking the button below.
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0;font-family:Arial,Helvetica,sans-serif">
            This is a one-time step to help keep your account secure.
          </p>""",
        cta_url=url,
        cta_label="Confirm Email Address",
        footnote="You are receiving this message because someone used this email address to register for a BookMyStyle account. If that was not you, no action is required and your address will not be used.",
    )

    plain_text = f"""Hi {name},

Thank you for creating a BookMyStyle account.

To complete your registration, please open the link below in your browser:

{url}

This link will expire in 24 hours.

If you did not create a BookMyStyle account, you can disregard this message. No changes will be made to any account.

BookMyStyle - Beauty and Wellness Platform
Colombo, Sri Lanka
"""

    _send_transactional(
        subject=f"Please confirm your email address - BookMyStyle",
        plain_text=plain_text,
        html=html,
        to_email=user.email,
    )


def _send_password_reset_email(user, reset_url):
    name = user.full_name or 'there'

    html = _email_html(
        heading="Reset your BookMyStyle password",
        preheader="We received a request to reset the password on your BookMyStyle account.",
        body_html="""
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif">
            We received a request to reset the password on your BookMyStyle account.
            Click the button below to choose a new password.
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0;font-family:Arial,Helvetica,sans-serif">
            If you did not make this request, you can safely disregard this message.
            Your password will not be changed.
          </p>""",
        cta_url=reset_url,
        cta_label="Reset My Password",
        footnote="For your security, this link will expire in 24 hours. If you did not request a password reset, no action is needed.",
    )

    plain_text = f"""Hi {name},

We received a request to reset the password on your BookMyStyle account.

To set a new password, open the link below in your browser:

{reset_url}

This link will expire in 24 hours.

If you did not request a password reset, you can disregard this message. Your password will remain unchanged.

BookMyStyle - Beauty and Wellness Platform
Colombo, Sri Lanka
"""

    _send_transactional(
        subject="Password reset request - BookMyStyle",
        plain_text=plain_text,
        html=html,
        to_email=user.email,
    )


# ── Auth views ─────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes   = [RegisterThrottle]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()

        # Handle duplicate email before the serializer runs so we can give
        # a meaningful response instead of a raw validation error.
        existing = CustomUser.objects.filter(email__iexact=email).first()
        if existing:
            if not existing.email_verified and existing.role == 'client':
                # Account exists but was never verified — resend the link.
                email_sent = True
                try:
                    _send_verification_email(existing)
                except Exception as e:
                    logger.error('Verification resend failed for %s: %s', email, e)
                    email_sent = False
                return Response({
                    'message': (
                        'This email is already registered but not yet verified. '
                        'We\'ve resent the verification link — check your inbox.'
                        if email_sent else
                        'This email is already registered but not yet verified. '
                        'Please use the resend option to get a new link.'
                    ),
                    'requires_verification': True,
                    'email_sent': email_sent,
                    'already_exists': True,
                }, status=status.HTTP_200_OK)
            # Already fully registered and verified.
            return Response(
                {'email': ['An account with this email already exists. Please log in.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
            # Welcome email now that the account is fully active
            try:
                from utils.email import send_bms_email
                name = user.full_name or 'there'
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
                send_bms_email(
                    subject='Welcome to BookMyStyle — you\'re all set!',
                    to_email=user.email,
                    heading=f'Welcome, {name}!',
                    preheader='Your BookMyStyle account is verified and ready to use.',
                    body_html=f'''
                      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif">
                        Your email has been verified and your BookMyStyle account is fully active.
                        You can now discover and book appointments at the finest salons across Sri Lanka.
                      </p>
                      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0;font-family:Arial,Helvetica,sans-serif">
                        Explore top-rated salons, manage your bookings, and enjoy exclusive offers — all in one place.
                      </p>''',
                    cta_url=f'{frontend_url}/explore',
                    cta_label='Explore Salons',
                    plain_text=f'Hi {name},\n\nWelcome to BookMyStyle! Your account is now active.\n\nExplore salons at {frontend_url}/explore\n\nBookMyStyle Team',
                )
            except Exception as e:
                logger.error('Welcome email failed for %s: %s', user.email, e)
            return Response({'message': 'Email verified successfully. You can now log in.'})
        except Exception:
            return Response({'detail': 'Invalid verification link.'}, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes   = [ResetThrottle]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        try:
            # Use filter (not get) so duplicates don't crash with MultipleObjectsReturned.
            # Among duplicates, always prefer the unverified account to resend to.
            qs = CustomUser.objects.filter(email__iexact=email)
            user = qs.filter(email_verified=False, role='client').first() \
                or qs.filter(role='client').first()
            if not user:
                return Response({'message': 'If that email is registered and unverified, a new link has been sent.'})
            if user.email_verified:
                return Response({'message': 'This email is already verified. You can log in.'})
            _send_verification_email(user)
            return Response({'message': 'Verification email sent! Check your inbox (and spam folder).'})
        except Exception as e:
            logger.error('Resend verification failed for %s: %s', email, e)
            return Response(
                {'detail': 'Could not send the verification email. Please try again later.'},
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
        for b in bookings_qs.select_related('salon', 'staff_member').prefetch_related('booking_services__salon_service__service').order_by('-created_at')[:15]:
            services = [bs.salon_service.service.name for bs in b.booking_services.all()]
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
        try:
            from utils.email import send_bms_email
            name = user.full_name or 'there'
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            if not user.is_active:
                send_bms_email(
                    subject='Your BookMyStyle account has been deactivated',
                    to_email=user.email,
                    heading='Account Deactivated',
                    preheader='Your BookMyStyle account has been temporarily deactivated by our team.',
                    body_html=f'''
                      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif">
                        Hi {name}, your BookMyStyle account has been temporarily deactivated by our support team.
                      </p>
                      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0;font-family:Arial,Helvetica,sans-serif">
                        If you believe this is a mistake, please contact us at
                        <a href="mailto:support@bookmystyle.lk" style="color:#0D9488">support@bookmystyle.lk</a> and we will look into it promptly.
                      </p>''',
                    plain_text=f'Hi {name},\n\nYour BookMyStyle account has been deactivated. Contact support@bookmystyle.lk if you believe this is an error.\n\nBookMyStyle Team',
                )
            else:
                send_bms_email(
                    subject='Your BookMyStyle account has been reactivated',
                    to_email=user.email,
                    heading='Account Reactivated',
                    preheader='Good news — your BookMyStyle account is active again.',
                    body_html=f'''
                      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif">
                        Hi {name}, your BookMyStyle account has been reactivated. You can now log in and continue booking appointments.
                      </p>''',
                    cta_url=f'{frontend_url}/login',
                    cta_label='Log In',
                    plain_text=f'Hi {name},\n\nYour BookMyStyle account is reactivated. Log in at {frontend_url}/login\n\nBookMyStyle Team',
                )
        except Exception as e:
            logger.error('Account status email failed for %s: %s', user.email, e)
        return Response({'id': user.id, 'is_active': user.is_active})

    def delete(self, request, pk):
        """Permanently delete a customer account (admin only)."""
        from users.permissions import IsSystemAdmin
        if not IsSystemAdmin().has_permission(request, self):
            return Response({'detail': 'Forbidden.'}, status=403)

        user = get_object_or_404(CustomUser, pk=pk, role='client')
        try:
            from utils.email import send_bms_email
            name = user.full_name or 'there'
            send_bms_email(
                subject='Your BookMyStyle account has been removed',
                to_email=user.email,
                heading='Account Removed',
                preheader='Your BookMyStyle account has been permanently removed.',
                body_html=f'''
                  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif">
                    Hi {name}, your BookMyStyle account has been permanently removed from our platform.
                  </p>
                  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0;font-family:Arial,Helvetica,sans-serif">
                    All your personal data has been deleted. If you have questions, contact us at
                    <a href="mailto:support@bookmystyle.lk" style="color:#0D9488">support@bookmystyle.lk</a>.
                  </p>''',
                plain_text=f'Hi {name},\n\nYour BookMyStyle account has been permanently removed. Contact support@bookmystyle.lk with any questions.\n\nBookMyStyle Team',
            )
        except Exception as e:
            logger.error('Account removal email failed for %s: %s', user.email, e)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
