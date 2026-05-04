from django.urls import path
from .views import (
    SalonRegisterView, SalonListView, SalonDetailView,
    SalonApproveView, SalonRejectView, PendingSalonsView,
    AllSalonsAdminView, AvailableSlotsView, MySalonView,
)

urlpatterns = [
    path('salons/register/', SalonRegisterView.as_view(), name='salon-register'),
    path('salons/', SalonListView.as_view(), name='salon-list'),
    path('salons/<int:pk>/', SalonDetailView.as_view(), name='salon-detail'),
    path('salons/<int:pk>/approve/', SalonApproveView.as_view(), name='salon-approve'),
    path('salons/<int:pk>/reject/', SalonRejectView.as_view(), name='salon-reject'),
    path('salons/<int:pk>/calendar/available-slots/', AvailableSlotsView.as_view(), name='salon-slots'),
    path('admin/salons/pending/', PendingSalonsView.as_view(), name='admin-pending-salons'),
    path('admin/salons/', AllSalonsAdminView.as_view(), name='admin-all-salons'),
    path('owner/salon/', MySalonView.as_view(), name='my-salon'),
]
