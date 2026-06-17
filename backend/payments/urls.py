from django.urls import path
from .views import (
    InitiatePaymentView, NotifyView, PaymentStatusView,
    AdminSettingsView, AdminStatsView,
    AdminNotificationEmailView, VerifyNotificationEmailView,
)

urlpatterns = [
    path('initiate/',                              InitiatePaymentView.as_view(),         name='payment-initiate'),
    path('notify/',                                NotifyView.as_view(),                  name='payment-notify'),
    path('status/<str:order_id>/',                 PaymentStatusView.as_view(),            name='payment-status'),
    path('admin/stats/',                           AdminStatsView.as_view(),               name='admin-stats'),
    path('admin/settings/payhere/',                AdminSettingsView.as_view(),            name='admin-settings-payhere'),
    path('admin/settings/notification-email/',     AdminNotificationEmailView.as_view(),   name='admin-notification-email'),
    path('verify-notification-email/',             VerifyNotificationEmailView.as_view(),  name='verify-notification-email'),
]
