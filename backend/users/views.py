from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
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

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user.role == 'client':
                try:
                    _send_verification_email(user)
                except Exception as e:
                    print(f"[EMAIL ERROR] {e}")
                return Response(
                    {'message': 'Account created. Please check your email to verify your account.', 'requires_verification': True},
                    status=status.HTTP_201_CREATED,
                )
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

    def post(self, request):
        email    = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.email_verified and user.role == 'client':
            return Response(
                {'detail': 'Please verify your email before logging in.', 'code': 'email_not_verified'},
                status=status.HTTP_403_FORBIDDEN,
            )
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

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

    def post(self, request):
        email = request.data.get('email', '').strip()
        try:
            user = CustomUser.objects.get(email=email)
            if not user.email_verified:
                _send_verification_email(user)
        except CustomUser.DoesNotExist:
            pass
        except Exception as e:
            print(f"[EMAIL ERROR] {e}")
        return Response({'message': 'If that email is registered and unverified, a new link has been sent.'})


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

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
        if not password or len(password) < 6:
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
