from django.db.models.signals import post_save
from django.dispatch import receiver
from salons.models import Salon
from .models import Subscription


@receiver(post_save, sender=Salon)
def create_free_trial(sender, instance, created, **kwargs):
    """Auto-create a Free Trial subscription when a salon is first created."""
    if created:
        Subscription.objects.get_or_create(salon=instance)
