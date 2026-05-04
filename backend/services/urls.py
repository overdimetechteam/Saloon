from django.urls import path
from .views import (
    ServiceListCreateView, ServiceDetailView,
    SalonServiceListCreateView, SalonServiceDetailView,
)

urlpatterns = [
    path('services/', ServiceListCreateView.as_view(), name='service-list'),
    path('services/<int:pk>/', ServiceDetailView.as_view(), name='service-detail'),
    path('salons/<int:salon_pk>/services/', SalonServiceListCreateView.as_view(), name='salon-service-list'),
    path('salons/<int:salon_pk>/services/<int:pk>/', SalonServiceDetailView.as_view(), name='salon-service-detail'),
]
