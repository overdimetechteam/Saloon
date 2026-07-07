import secrets
import string
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from .models import StaffMember

User = get_user_model()


class StaffMemberPublicSerializer(serializers.ModelSerializer):
    """Read-only public view (used on salon detail page)."""
    photo_url = serializers.SerializerMethodField()
    specialty_ids = serializers.PrimaryKeyRelatedField(
        source='specialties', many=True, read_only=True
    )
    specialty_categories = serializers.SerializerMethodField()

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo:
            return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
        return None

    def get_specialty_categories(self, obj):
        return list({s.category for s in obj.specialties.all()})

    class Meta:
        model = StaffMember
        fields = ['id', 'full_name', 'role', 'bio', 'photo_url', 'working_days', 'home_visit_available', 'specialty_ids', 'specialty_categories']


class StaffMemberOwnerSerializer(serializers.ModelSerializer):
    """Owner sees everything including login email, working days, specialties."""
    photo_url    = serializers.SerializerMethodField()
    photo        = serializers.ImageField(write_only=True, required=False)
    login_email  = serializers.SerializerMethodField()
    specialty_ids = serializers.PrimaryKeyRelatedField(
        source='specialties', many=True, read_only=True
    )
    specialty_names = serializers.SerializerMethodField()

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo:
            return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
        return None

    def get_login_email(self, obj):
        return obj.user.email if obj.user else None

    def get_specialty_names(self, obj):
        return [s.name for s in obj.specialties.all()]

    class Meta:
        model = StaffMember
        fields = [
            'id', 'full_name', 'role', 'bio', 'photo', 'photo_url',
            'phone', 'is_active', 'is_online', 'created_at', 'login_email',
            'working_days', 'home_visit_available',
            'specialties', 'specialty_ids', 'specialty_names',
        ]
        read_only_fields = ['id', 'created_at', 'photo_url', 'login_email',
                            'is_online', 'specialty_ids', 'specialty_names']
        extra_kwargs = {
            'specialties': {'write_only': True, 'required': False},
        }


class StaffMemberSelfSerializer(serializers.ModelSerializer):
    """Employee editing their own profile (no role/salon changes)."""
    photo_url = serializers.SerializerMethodField()
    photo = serializers.ImageField(write_only=True, required=False)

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo:
            return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
        return None

    class Meta:
        model = StaffMember
        fields = ['id', 'full_name', 'role', 'bio', 'phone', 'photo', 'photo_url', 'is_active', 'is_online', 'created_at']
        read_only_fields = ['id', 'role', 'is_active', 'is_online', 'created_at', 'photo_url']


class StaffMemberCreateSerializer(serializers.Serializer):
    """Owner creates a staff member + employee login account atomically.

    password is optional — if omitted a random 8-char password is generated
    and returned as generated_password in the response.
    """
    full_name   = serializers.CharField(max_length=255)
    role        = serializers.ChoiceField(choices=StaffMember.ROLE_CHOICES)
    bio         = serializers.CharField(required=False, allow_blank=True)
    phone       = serializers.CharField(required=False, allow_blank=True)
    login_email = serializers.EmailField()
    password    = serializers.CharField(min_length=6, write_only=True, required=False, allow_blank=True)

    def validate_login_email(self, value):
        # Only block if this email already belongs to an employee account
        if User.objects.filter(email=value, role='employee').exists():
            raise serializers.ValidationError('This email is already used by another staff account.')
        # Also block if the email belongs to a salon owner or admin
        if User.objects.filter(email=value).exclude(role='client').exists():
            raise serializers.ValidationError('This email belongs to an existing owner or admin account.')
        return value

    @staticmethod
    def _make_password():
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(10))

    @transaction.atomic
    def create(self, validated_data):
        salon = self.context['salon']
        raw_password = validated_data.get('password') or ''
        generated = None
        if not raw_password:
            raw_password = self._make_password()
            generated = raw_password
        user = User.objects.create_user(
            email=validated_data['login_email'],
            full_name=validated_data['full_name'],
            phone=validated_data.get('phone', ''),
            role='employee',
            password=raw_password,
        )
        staff = StaffMember.objects.create(
            salon=salon,
            user=user,
            full_name=validated_data['full_name'],
            role=validated_data['role'],
            bio=validated_data.get('bio', ''),
            phone=validated_data.get('phone', ''),
        )
        staff._generated_password = generated
        return staff


class StaffResetCredentialsSerializer(serializers.Serializer):
    """Owner resets an employee's login email/password."""
    login_email = serializers.EmailField(required=False)
    password    = serializers.CharField(min_length=6, write_only=True, required=False)

    def validate_login_email(self, value):
        staff = self.context.get('staff')
        if User.objects.filter(email=value).exclude(pk=staff.user_id).exists():
            raise serializers.ValidationError('Email already in use.')
        return value

    def validate(self, attrs):
        if not attrs.get('login_email') and not attrs.get('password'):
            raise serializers.ValidationError('Provide at least login_email or password.')
        return attrs
