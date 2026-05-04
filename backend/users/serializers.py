from rest_framework import serializers
from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = CustomUser
        fields = ['email', 'full_name', 'phone', 'password', 'role']
        extra_kwargs = {'role': {'required': False}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.setdefault('role', 'client')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'full_name', 'phone', 'role']
