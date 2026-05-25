from django.urls import path
from .views import (
    BookingListCreateView, BookingDetailView,
    BookingConfirmView, BookingRejectView,
    BookingSelectSlotView, BookingRequestMoreSlotsView, BookingCancelView,
    BookingAssignStaffView,
    SalonBookingListView, SalonPendingBookingsView,
    BookingReviewView, BookingRebookView,
    PromotionValidateView,
    SalonPromotionListCreateView, SalonPromotionDetailView,
    WalkInBookingView,
)

urlpatterns = [
    path('bookings/', BookingListCreateView.as_view(), name='booking-list'),
    path('bookings/<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('bookings/<int:pk>/confirm/', BookingConfirmView.as_view(), name='booking-confirm'),
    path('bookings/<int:pk>/reject/', BookingRejectView.as_view(), name='booking-reject'),
    path('bookings/<int:pk>/select-slot/', BookingSelectSlotView.as_view(), name='booking-select-slot'),
    path('bookings/<int:pk>/request-more-slots/', BookingRequestMoreSlotsView.as_view(), name='booking-request-more-slots'),
    path('bookings/<int:pk>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path('bookings/<int:pk>/assign-staff/', BookingAssignStaffView.as_view(), name='booking-assign-staff'),
    path('bookings/<int:pk>/review/', BookingReviewView.as_view(), name='booking-review'),
    path('bookings/<int:pk>/rebook/', BookingRebookView.as_view(), name='booking-rebook'),
    path('promotions/validate/', PromotionValidateView.as_view(), name='promo-validate'),
    path('salons/<int:salon_pk>/bookings/', SalonBookingListView.as_view(), name='salon-bookings'),
    path('salons/<int:salon_pk>/bookings/pending/', SalonPendingBookingsView.as_view(), name='salon-pending-bookings'),
    path('salons/<int:salon_pk>/bookings/walk-in/', WalkInBookingView.as_view(), name='salon-walkin'),
    path('salons/<int:salon_pk>/promotions/', SalonPromotionListCreateView.as_view(), name='salon-promotions'),
    path('salons/<int:salon_pk>/promotions/<int:promo_pk>/', SalonPromotionDetailView.as_view(), name='salon-promotion-detail'),
]
