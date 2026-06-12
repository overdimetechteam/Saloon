from django.urls import path
from .views import InitiatePaymentView, NotifyView, PaymentStatusView

urlpatterns = [
    path('initiate/',         InitiatePaymentView.as_view(), name='payment-initiate'),
    path('notify/',           NotifyView.as_view(),          name='payment-notify'),
    path('status/<str:order_id>/', PaymentStatusView.as_view(), name='payment-status'),
]
