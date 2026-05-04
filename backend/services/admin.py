from django.contrib import admin
from .models import Service, SalonService


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'default_price', 'default_duration_minutes', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name']


@admin.register(SalonService)
class SalonServiceAdmin(admin.ModelAdmin):
    list_display = ['salon', 'service', 'custom_price', 'is_active']
    list_filter = ['is_active']
