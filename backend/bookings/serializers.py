from rest_framework import serializers
from .models import Booking, BookingService, AlternativeSlot
from services.models import SalonService


class AlternativeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlternativeSlot
        fields = ['id', 'proposed_datetime', 'is_selected', 'round_number']


class BookingServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='salon_service.service.name', read_only=True)

    class Meta:
        model = BookingService
        fields = ['id', 'salon_service', 'service_name']


class BookingSerializer(serializers.ModelSerializer):
    booking_services = BookingServiceSerializer(many=True, read_only=True)
    alternative_slots = AlternativeSlotSerializer(many=True, read_only=True)
    client_email = serializers.EmailField(source='client.email', read_only=True)
    salon_name = serializers.CharField(source='salon.name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'client', 'client_email', 'salon', 'salon_name',
            'requested_datetime', 'status', 'negotiation_round', 'notes',
            'created_at', 'updated_at', 'booking_services', 'alternative_slots',
        ]
        read_only_fields = ['client', 'status', 'negotiation_round', 'created_at', 'updated_at']


class BookingCreateSerializer(serializers.Serializer):
    salon = serializers.IntegerField()
    requested_datetime = serializers.DateTimeField()
    salon_service_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_salon_service_ids(self, value):
        salon_id = self.initial_data.get('salon')
        qs = SalonService.objects.filter(id__in=value, salon_id=salon_id, is_active=True)
        if qs.count() != len(value):
            raise serializers.ValidationError('One or more salon services are invalid.')
        return value
