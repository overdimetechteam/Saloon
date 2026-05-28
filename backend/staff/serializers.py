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

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo:
            return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
        return None

    class Meta:
        model = StaffMember
        fields = ['id', 'full_name', 'role', 'bio', 'photo_url', 'working_days', 'home_visit_available', 'specialty_ids']


class StaffMemberOwnerSerializer(serializers.ModelSerializer):
    """Owner sees everything including login email, working days, specialties."""
    photo_url    = serializers.SerializerMethodField()
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
            'id', 'full_name', 'role', 'bio', 'photo_url',
            'phone', 'is_active', 'created_at', 'login_email',
            'working_days', 'home_visit_available',
            'specialties', 'specialty_ids', 'specialty_names',
        ]
        read_only_fields = ['id', 'created_at', 'photo_url', 'login_email',
                            'specialty_ids', 'specialty_names']
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
        fields = ['id', 'full_name', 'role', 'bio', 'phone', 'photo', 'photo_url', 'is_active', 'created_at']
        read_only_fields = ['id', 'role', 'is_active', 'created_at', 'photo_url']


class StaffMemberCreateSerializer(serializers.Serializer):
    """Owner creates a staff member + employee login account atomically."""
    full_name  = serializers.CharField(max_length=255)
    role       = serializers.ChoiceField(choices=StaffMember.ROLE_CHOICES)
    bio        = serializers.CharField(required=False, allow_blank=True)
    phone      = serializers.CharField(required=False, allow_blank=True)
    login_email = serializers.EmailField()
    password   = serializers.CharField(min_length=6, write_only=True)

    def validate_login_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        salon = self.context['salon']
        user = User.objects.create_user(
            email=validated_data['login_email'],
            full_name=validated_data['full_name'],
            phone=validated_data.get('phone', ''),
            role='employee',
            password=validated_data['password'],
        )
        staff = StaffMember.objects.create(
            salon=salon,
            user=user,
            full_name=validated_data['full_name'],
            role=validated_data['role'],
            bio=validated_data.get('bio', ''),
            phone=validated_data.get('phone', ''),
        )
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
