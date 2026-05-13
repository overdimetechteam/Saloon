from rest_framework import serializers
from .models import Service, SalonService


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'category', 'description', 'default_duration_minutes', 'default_price', 'is_active', 'is_private']


class SalonServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_category = serializers.CharField(source='service.category', read_only=True)
    service_is_private = serializers.BooleanField(source='service.is_private', read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    effective_duration = serializers.IntegerField(read_only=True)

    class Meta:
        model = SalonService
        fields = [
            'id', 'salon', 'service', 'service_name', 'service_category', 'service_is_private',
            'custom_price', 'custom_duration', 'is_price_starting_from', 'home_visit_available',
            'description', 'is_active', 'effective_price', 'effective_duration',
        ]
        read_only_fields = ['salon']


class SalonServiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalonService
        fields = ['service', 'custom_price', 'custom_duration', 'is_price_starting_from', 'description', 'is_active']


class SalonServiceUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalonService
        fields = ['custom_price', 'custom_duration', 'is_price_starting_from', 'home_visit_available', 'description']
