import uuid
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
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    unit_of_measure = models.CharField(max_length=50)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    reorder_level = models.PositiveIntegerField(default=0)
    current_stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

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
