from django.urls import path
from .views import SubscriptionDetailView, SubscribeView, CancelSubscriptionView, PublicPlansView

urlpatterns = [
    path('my/',       SubscriptionDetailView.as_view(),  name='subscription-detail'),
    path('subscribe/', SubscribeView.as_view(),           name='subscribe'),
    path('cancel/',    CancelSubscriptionView.as_view(),  name='cancel-subscription'),
    path('plans/',     PublicPlansView.as_view(),         name='public-plans'),
]
