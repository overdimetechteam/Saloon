from django.db import models
from django.conf import settings
from utils.encryption import EncryptedTextField


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
    contact_number = models.CharField(max_length=30, blank=True, default='')
    email = models.EmailField()
    operating_hours = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_suspended = models.BooleanField(default=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='salons',
        limit_choices_to={'role': 'salon_owner'},
    )
    PALETTE_CHOICES = [('teal', 'Teal'), ('purple', 'Purple'), ('olive', 'Olive')]
    GENDER_CHOICES = [('unisex', 'Unisex'), ('male', 'Male (Barbershop)'), ('female', 'Female (Ladies Salon)')]

    home_visit_enabled = models.BooleanField(default=False)
    cosmetics_enabled = models.BooleanField(default=False)
    color_palette = models.CharField(max_length=20, choices=PALETTE_CHOICES, default='teal')
    gender_focus = models.CharField(max_length=10, choices=GENDER_CHOICES, default='unisex')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    logo = models.FileField(upload_to='salon_logos/', blank=True, null=True)
    cover_image = models.FileField(upload_to='salon_covers/', blank=True, null=True)
    facilities = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class SalonCalendar(models.Model):
    salon = models.OneToOneField(Salon, on_delete=models.CASCADE, related_name='calendar')
    slot_duration_minutes = models.PositiveIntegerField(default=30)
    blocked_dates = models.JSONField(default=list)

    def __str__(self):
        return f"Calendar for {self.salon.name}"


class FavouriteSalon(models.Model):
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favourites',
    )
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='favourited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['client', 'salon']

    def __str__(self):
        return f"{self.client.email} ♥ {self.salon.name}"


class Offer(models.Model):
    DISCOUNT_CHOICES = [('percentage', 'Percentage'), ('fixed', 'Fixed')]
    OFFER_TYPE_CHOICES = [('discount', 'Discount'), ('custom', 'Custom Deal')]

    salon          = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='offers')
    title          = models.CharField(max_length=200)
    description    = models.TextField(blank=True)
    offer_type     = models.CharField(max_length=20, choices=OFFER_TYPE_CHOICES, default='discount')
    discount_type  = models.CharField(max_length=20, choices=DISCOUNT_CHOICES, blank=True, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    custom_terms   = models.TextField(blank=True)
    start_date     = models.DateField()
    end_date       = models.DateField()
    is_active      = models.BooleanField(default=True)
    note           = models.TextField(blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.salon.name} — {self.title}"


class SalonStaff(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='staff')
    full_name = EncryptedTextField()
    role = models.CharField(max_length=100, blank=True)
    phone = EncryptedTextField(blank=True, default='')
    specialties = models.ManyToManyField('services.Service', blank=True, related_name='staff_specialties')
    working_days = models.JSONField(default=list, blank=True)
    home_visit_available = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} @ {self.salon.name}"


class SalonImage(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='images')
    image = models.FileField(upload_to='salon_images/')
    caption = models.CharField(max_length=100, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'created_at']

    def __str__(self):
        return f"Image for {self.salon.name} #{self.pk}"


class CosmeticsGalleryImage(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='cosmetics_gallery')
    image = models.FileField(upload_to='cosmetics_gallery/')
    caption = models.CharField(max_length=150, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'created_at']

    def __str__(self):
        return f"Cosmetics gallery #{self.pk} — {self.salon.name}"
