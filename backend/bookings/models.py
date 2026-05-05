from django.db import models
from django.conf import settings
from salons.models import Salon
from services.models import SalonService


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('rejected', 'Rejected'),
        ('awaiting_client', 'Awaiting Client'),
        ('rescheduled', 'Rescheduled'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('flagged', 'Flagged'),
    ]

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='bookings')
    staff_member = models.ForeignKey(
        'salons.SalonStaff',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='bookings',
    )
    requested_datetime = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    negotiation_round = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking #{self.pk} — {self.client.email} @ {self.salon.name}"


class BookingService(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='booking_services')
    salon_service = models.ForeignKey(SalonService, on_delete=models.CASCADE)

    def __str__(self):
        return f"Booking #{self.booking_id} — {self.salon_service.service.name}"


class AlternativeSlot(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='alternative_slots')
    proposed_datetime = models.DateTimeField()
    is_selected = models.BooleanField(default=False)
    round_number = models.PositiveIntegerField()

    def __str__(self):
        return f"Slot for Booking #{self.booking_id} round {self.round_number}"
