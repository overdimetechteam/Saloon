from django.db import models
from django.conf import settings


class Salon(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    name = models.CharField(max_length=255)
    business_reg_number = models.CharField(max_length=100, unique=True)
    address_street = models.CharField(max_length=255)
    address_city = models.CharField(max_length=100)
    address_district = models.CharField(max_length=100)
    address_postal = models.CharField(max_length=20)
    contact_number = models.CharField(max_length=20)
    email = models.EmailField()
    operating_hours = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='salons',
        limit_choices_to={'role': 'salon_owner'},
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class SalonCalendar(models.Model):
    salon = models.OneToOneField(Salon, on_delete=models.CASCADE, related_name='calendar')
    slot_duration_minutes = models.PositiveIntegerField(default=30)
    blocked_dates = models.JSONField(default=list)

    def __str__(self):
        return f"Calendar for {self.salon.name}"


class SalonStaff(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='staff')
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} @ {self.salon.name}"
