from rest_framework import serializers
from .models import Booking, BookingService, AlternativeSlot, Review, Promotion
from services.models import SalonService


class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = [
            'id', 'salon', 'code', 'discount_type', 'discount_value',
            'min_booking_value', 'valid_from', 'valid_until',
            'max_uses', 'times_used', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'salon', 'times_used', 'created_at']


class AlternativeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlternativeSlot
        fields = ['id', 'proposed_datetime', 'is_selected', 'round_number']


class BookingServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='salon_service.service.name', read_only=True)

    class Meta:
        model = BookingService
        fields = ['id', 'salon_service', 'service_name']


class ReviewSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.full_name', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'booking', 'client', 'client_name', 'salon', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'client', 'salon', 'booking', 'created_at']


class BookingSerializer(serializers.ModelSerializer):
    booking_services = BookingServiceSerializer(many=True, read_only=True)
    alternative_slots = AlternativeSlotSerializer(many=True, read_only=True)
    client_email = serializers.EmailField(source='client.email', read_only=True)
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    client_phone = serializers.CharField(source='client.phone', read_only=True, default='')
    salon_name = serializers.CharField(source='salon.name', read_only=True)
    staff_member_name = serializers.CharField(source='staff_member.full_name', read_only=True, default=None)
    review = ReviewSerializer(read_only=True)
    has_review = serializers.SerializerMethodField()
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_walk_in = serializers.BooleanField(read_only=True)
    home_visit = serializers.BooleanField(read_only=True)
    home_visit_address = serializers.CharField(read_only=True)

    def get_has_review(self, obj):
        return hasattr(obj, 'review') and obj.review is not None

    class Meta:
        model = Booking
        fields = [
            'id', 'client', 'client_email', 'client_name', 'client_phone',
            'salon', 'salon_name',
            'staff_member', 'staff_member_name',
            'requested_datetime', 'status', 'negotiation_round', 'notes',
            'promo_code', 'discount_amount', 'is_walk_in', 'home_visit', 'home_visit_address',
            'created_at', 'updated_at',
            'booking_services', 'alternative_slots',
            'review', 'has_review',
        ]
        read_only_fields = ['client', 'status', 'negotiation_round', 'created_at', 'updated_at']


class BookingCreateSerializer(serializers.Serializer):
    salon = serializers.IntegerField()
    requested_datetime = serializers.DateTimeField()
    salon_service_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    notes = serializers.CharField(required=False, allow_blank=True)
    staff_member_id = serializers.IntegerField(required=False, allow_null=True)
    promo_id = serializers.IntegerField(required=False, allow_null=True)
    home_visit = serializers.BooleanField(required=False, default=False)
    home_visit_address = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_salon_service_ids(self, value):
        salon_id = self.initial_data.get('salon')
        qs = SalonService.objects.filter(id__in=value, salon_id=salon_id, is_active=True)
        if qs.count() != len(value):
            raise serializers.ValidationError('One or more salon services are invalid.')
        return value
