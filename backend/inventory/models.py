import uuid
from datetime import date, timedelta
from django.db import models
from django.conf import settings
from salons.models import Salon


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('Hair Care', 'Hair Care'),
        ('Skin Care', 'Skin Care'),
        ('Nail Care', 'Nail Care'),
        ('Other', 'Other'),
    ]

    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    brand = models.CharField(max_length=255, blank=True)
    sku = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    subcategory = models.CharField(max_length=100, blank=True)
    shade_variant = models.CharField(max_length=100, blank=True)
    size = models.CharField(max_length=50, blank=True)
    unit_of_measure = models.CharField(max_length=50)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    reorder_level = models.PositiveIntegerField(default=0)
    current_stock = models.IntegerField(default=0)
    supplier = models.CharField(max_length=255, blank=True)
    manufacturing_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    pao = models.CharField(max_length=50, blank=True)
    barcode = models.CharField(max_length=100, blank=True)
    country_of_origin = models.CharField(max_length=100, blank=True)
    certifications = models.TextField(blank=True)
    skin_type = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    @property
    def status(self):
        if self.current_stock == 0:
            return 'out_of_stock'
        if self.current_stock <= self.reorder_level:
            return 'low_stock'
        if self.expiry_date and self.expiry_date <= date.today() + timedelta(days=90):
            return 'expiring_soon'
        return 'active'

    def __str__(self):
        return f"{self.name} ({self.salon.name})"


class GRN(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
    ]

    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='grns')
    reference_number = models.CharField(max_length=50, unique=True)
    supplier_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.reference_number:
            self.reference_number = f"GRN-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.reference_number


class GRNItem(models.Model):
    grn = models.ForeignKey(GRN, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity_received = models.PositiveIntegerField()
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.grn.reference_number} — {self.product.name} x{self.quantity_received}"


class Sale(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='sales')
    sold_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sale #{self.pk} @ {self.salon.name}"


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Sale #{self.sale_id} — {self.product.name} x{self.quantity}"


class StockAdjustment(models.Model):
    REASON_CHOICES = [
        ('damaged', 'Damaged'),
        ('wastage', 'Wastage'),
        ('theft', 'Theft'),
        ('stocktake', 'Stocktake'),
        ('promotional', 'Promotional'),
    ]

    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='adjustments')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity_change = models.IntegerField()
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    notes = models.TextField(blank=True)
    adjusted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    adjusted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Adjustment #{self.pk} — {self.product.name} ({self.quantity_change:+d})"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_images/')
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'created_at']

    def __str__(self):
        return f"Image for {self.product.name} (#{self.pk})"


class CosmeticOrder(models.Model):
    DELIVERY_CHOICES = [('pickup', 'Pickup'), ('delivery', 'Delivery')]
    PAYMENT_CHOICES = [('cash', 'Cash on Delivery'), ('card', 'Card'), ('online', 'Online Transfer')]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='cosmetic_orders')
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='cosmetic_orders')
    client_name = models.CharField(max_length=255)
    client_email = models.EmailField()
    client_phone = models.CharField(max_length=30)
    delivery_type = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='pickup')
    delivery_address = models.TextField(blank=True)
    delivery_city = models.CharField(max_length=100, blank=True)
    delivery_postal = models.CharField(max_length=20, blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='cash')
    gift_wrap = models.BooleanField(default=False)
    gift_message = models.TextField(blank=True)
    promo_code = models.CharField(max_length=100, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gift_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.pk} — {self.salon.name} ({self.client_name})"


class CosmeticOrderItem(models.Model):
    order = models.ForeignKey(CosmeticOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=100, blank=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    variant_note = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"OrderItem #{self.pk} — {self.product_name} x{self.quantity}"
