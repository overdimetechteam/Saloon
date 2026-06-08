from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import (
    RegisterView, LoginView, ForgotPasswordView, ResetPasswordView,
    VerifyEmailView, ResendVerificationView,
)
from users.social_auth import (
    GoogleSocialAuthView,
    AppleSocialAuthView,
    TwitterAuthInitView,
    TwitterAuthCallbackView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('api/auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('api/auth/verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('api/auth/resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
    path('api/auth/social/google/', GoogleSocialAuthView.as_view(), name='social-google'),
    path('api/auth/social/apple/', AppleSocialAuthView.as_view(), name='social-apple'),
    path('api/auth/social/twitter/init/', TwitterAuthInitView.as_view(), name='social-twitter-init'),
    path('api/auth/social/twitter/callback/', TwitterAuthCallbackView.as_view(), name='social-twitter-callback'),
    path('api/', include('salons.urls')),
    path('api/', include('services.urls')),
    path('api/', include('bookings.urls')),
    path('api/', include('inventory.urls')),
    path('api/', include('users.urls')),
    path('api/subscription/', include('subscriptions.urls')),
    path('api/', include('staff.urls')),
] + [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
