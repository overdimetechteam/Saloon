from rest_framework import serializers
from .models import Salon, SalonCalendar, SalonStaff, Offer, SalonImage
from users.models import CustomUser


class SalonStaffSerializer(serializers.ModelSerializer):
    specialty_ids = serializers.PrimaryKeyRelatedField(
        source='specialties', many=True, read_only=True
    )
    specialty_names = serializers.SerializerMethodField()

    def get_specialty_names(self, obj):
        return [s.name for s in obj.specialties.all()]

    class Meta:
        model = SalonStaff
        fields = [
            'id', 'salon', 'full_name', 'role', 'phone',
            'specialties', 'specialty_ids', 'specialty_names',
            'working_days', 'home_visit_available', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'salon', 'created_at', 'specialty_ids', 'specialty_names']
        extra_kwargs = {
            'specialties': {'write_only': True, 'required': False},
        }


class SalonImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    def get_image_url(self, obj):
        request = self.context.get('request')
        if request and obj.image:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None

    class Meta:
        model = SalonImage
        fields = ['id', 'salon', 'image', 'image_url', 'caption', 'sort_order', 'created_at']
        read_only_fields = ['salon', 'created_at', 'image_url']
        extra_kwargs = {'image': {'write_only': True}}


class SalonCalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalonCalendar
        fields = ['slot_duration_minutes', 'blocked_dates']


class SalonSerializer(serializers.ModelSerializer):
    calendar = SalonCalendarSerializer(read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    logo_url = serializers.SerializerMethodField()

    def get_logo_url(self, obj):
        request = self.context.get('request')
        if obj.logo:
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None

    class Meta:
        model = Salon
        fields = [
            'id', 'name', 'business_reg_number',
            'address_street', 'address_city', 'address_district', 'address_postal',
            'contact_number', 'email', 'operating_hours',
            'status', 'is_suspended', 'home_visit_enabled', 'cosmetics_enabled', 'owner', 'owner_email', 'created_at', 'calendar',
            'logo_url',
        ]
        read_only_fields = ['status', 'owner', 'created_at', 'logo_url']


class OfferSerializer(serializers.ModelSerializer):
    salon_name = serializers.CharField(source='salon.name', read_only=True)

    class Meta:
        model  = Offer
        fields = [
            'id', 'salon', 'salon_name', 'title', 'description',
            'discount_type', 'discount_value',
            'start_date', 'end_date', 'is_active', 'note', 'created_at',
        ]
        read_only_fields = ['salon', 'created_at']


class SalonRegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='owner.email', write_only=True, required=False)
    full_name = serializers.CharField(source='owner.full_name', write_only=True, required=False)
    phone = serializers.CharField(source='owner.phone', write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Salon
        fields = [
            'name', 'business_reg_number',
            'address_street', 'address_city', 'address_district', 'address_postal',
            'contact_number', 'email', 'operating_hours',
            'full_name', 'phone', 'password', 'cosmetics_enabled',
        ]

    def create(self, validated_data):
        owner_data = validated_data.pop('owner', {})
        password = validated_data.pop('password', None)

        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'salon_owner':
            owner = request.user
        else:
            owner = CustomUser.objects.create_user(
                email=owner_data.get('email'),
                full_name=owner_data.get('full_name', ''),
                phone=owner_data.get('phone', ''),
                role='salon_owner',
                password=password,
            )

        salon = Salon.objects.create(owner=owner, **validated_data)
        SalonCalendar.objects.create(salon=salon)
        return salon
