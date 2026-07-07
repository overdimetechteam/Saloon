from django.db import models
from users.models import CustomUser
from salons.models import Salon
from utils.encryption import EncryptedTextField


class StaffMember(models.Model):
    ROLE_CHOICES = [
        ('stylist',      'Stylist'),
        ('barber',       'Barber'),
        ('colorist',     'Colorist'),
        ('receptionist', 'Receptionist'),
        ('manager',      'Manager'),
        ('other',        'Other'),
    ]

    salon                = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='staff_members')
    user                 = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='staff_profile', null=True, blank=True)
    full_name            = EncryptedTextField()
    role                 = models.CharField(max_length=30, choices=ROLE_CHOICES, default='other')
    bio                  = models.TextField(blank=True)
    photo                = models.ImageField(upload_to='staff_photos/', null=True, blank=True)
    phone                = EncryptedTextField(blank=True, default='')
    specialties          = models.ManyToManyField('services.Service', blank=True, related_name='staff_member_specialties')
    working_days         = models.JSONField(default=list, blank=True)
    home_visit_available = models.BooleanField(default=False)
    is_active            = models.BooleanField(default=True)
    is_online            = models.BooleanField(default=False)
    created_at           = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.full_name} @ {self.salon.name}"
