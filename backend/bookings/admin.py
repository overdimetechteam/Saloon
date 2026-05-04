from django.contrib import admin
from .models import Booking, BookingService, AlternativeSlot


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'salon', 'requested_datetime', 'status', 'negotiation_round']
    list_filter = ['status']
    search_fields = ['client__email', 'salon__name']


@admin.register(BookingService)
class BookingServiceAdmin(admin.ModelAdmin):
    list_display = ['booking', 'salon_service']


@admin.register(AlternativeSlot)
class AlternativeSlotAdmin(admin.ModelAdmin):
    list_display = ['booking', 'proposed_datetime', 'is_selected', 'round_number']
