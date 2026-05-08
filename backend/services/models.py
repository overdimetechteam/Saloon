from django.db import models
from salons.models import Salon


class Service(models.Model):
    CATEGORY_CHOICES = [
        ('Hair', 'Hair'),
        ('Nails', 'Nails'),
        ('Skin', 'Skin'),
        ('Makeup', 'Makeup'),
    ]

    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    default_duration_minutes = models.PositiveIntegerField()
    default_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    is_private = models.BooleanField(default=False)
    owner_salon = models.ForeignKey(
        Salon,
        null=True, blank=True,
        on_delete=models.CASCADE,
        related_name='custom_services',
    )

    def __str__(self):
        return f"{self.name} ({self.category})"


class SalonService(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='salon_services')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='salon_services')
    custom_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    custom_duration = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('salon', 'service')

    def __str__(self):
        return f"{self.salon.name} — {self.service.name}"

    @property
    def effective_price(self):
        return self.custom_price if self.custom_price is not None else self.service.default_price

    @property
    def effective_duration(self):
        return self.custom_duration if self.custom_duration is not None else self.service.default_duration_minutes
