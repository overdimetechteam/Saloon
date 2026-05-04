from django.urls import path
from .views import (
    BookingListCreateView, BookingDetailView,
    BookingConfirmView, BookingRejectView,
    BookingSelectSlotView, BookingCancelView,
    SalonBookingListView, SalonPendingBookingsView,
)

urlpatterns = [
    path('bookings/', BookingListCreateView.as_view(), name='booking-list'),
    path('bookings/<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('bookings/<int:pk>/confirm/', BookingConfirmView.as_view(), name='booking-confirm'),
    path('bookings/<int:pk>/reject/', BookingRejectView.as_view(), name='booking-reject'),
    path('bookings/<int:pk>/select-slot/', BookingSelectSlotView.as_view(), name='booking-select-slot'),
    path('bookings/<int:pk>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path('salons/<int:salon_pk>/bookings/', SalonBookingListView.as_view(), name='salon-bookings'),
    path('salons/<int:salon_pk>/bookings/pending/', SalonPendingBookingsView.as_view(), name='salon-pending-bookings'),
]
