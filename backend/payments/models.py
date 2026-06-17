from django.db import models


class PlatformSettings(models.Model):
    """Singleton — always use PlatformSettings.get()"""
    payhere_merchant_id     = models.CharField(max_length=100, blank=True, default='')
    payhere_merchant_secret = models.CharField(max_length=255, blank=True, default='')
    payhere_sandbox         = models.BooleanField(default=True)

    # Admin notification email for new salon registration alerts
    notification_email          = models.EmailField(blank=True, default='')
    notification_email_verified = models.BooleanField(default=False)
    notification_email_token    = models.CharField(max_length=64, blank=True, default='')

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Platform Settings'

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return 'Platform Settings'


class Payment(models.Model):
    PAYMENT_TYPES = [
        ('subscription', 'Subscription'),
        ('cosmetics',    'Cosmetics'),
    ]
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('completed', 'Completed'),
        ('failed',    'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    order_id     = models.CharField(max_length=50, unique=True)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    amount       = models.DecimalField(max_digits=10, decimal_places=2)
    currency     = models.CharField(max_length=3, default='LKR')
    plan         = models.CharField(max_length=30, blank=True)  # subscription plan key

    user  = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True, blank=True)
    salon = models.ForeignKey('salons.Salon',      on_delete=models.SET_NULL, null=True, blank=True)

    # For cosmetics payments — store the order PK to look it up after notify
    cosmetic_order_id = models.IntegerField(null=True, blank=True)

    # PayHere response fields (filled by notify)
    payhere_payment_id    = models.CharField(max_length=100, blank=True)
    payhere_status_code   = models.CharField(max_length=5,   blank=True)
    payhere_status_message = models.CharField(max_length=200, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.order_id} — {self.payment_type} — {self.status}"
