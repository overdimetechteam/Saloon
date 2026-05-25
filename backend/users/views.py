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
from .models import CustomUser, Notification
from .serializers import RegisterSerializer, UserSerializer, NotificationSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
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
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        try:
            user = CustomUser.objects.get(email=email)
            uid   = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            # TODO: send_mail(user.email, subject, reset_url) once email is configured
            # For development, the reset link is logged to the console:
            reset_url = f"{request.scheme}://{request.get_host().replace('8000', '5173')}/reset-password?uid={uid}&token={token}"
            print(f"\n[DEV] Password reset link for {email}:\n{reset_url}\n")
        except CustomUser.DoesNotExist:
            pass
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
