from django.contrib import admin
from .models import Salon, SalonCalendar


@admin.register(Salon)
class SalonAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'status', 'address_city', 'created_at']
    list_filter = ['status']
    search_fields = ['name', 'business_reg_number']
    actions = ['approve', 'reject']

    def approve(self, request, queryset):
        queryset.update(status='active')
    approve.short_description = 'Approve selected salons'

    def reject(self, request, queryset):
        queryset.update(status='inactive')
    reject.short_description = 'Reject selected salons'


@admin.register(SalonCalendar)
class SalonCalendarAdmin(admin.ModelAdmin):
    list_display = ['salon', 'slot_duration_minutes']
