from django.contrib import admin
from .models import Product, GRN, GRNItem, Sale, SaleItem, StockAdjustment


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'salon', 'category', 'current_stock', 'reorder_level', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'brand']


class GRNItemInline(admin.TabularInline):
    model = GRNItem
    extra = 1


@admin.register(GRN)
class GRNAdmin(admin.ModelAdmin):
    list_display = ['reference_number', 'salon', 'supplier_name', 'status', 'created_at']
    list_filter = ['status']
    inlines = [GRNItemInline]


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 1


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['id', 'salon', 'sold_by', 'created_at']
    inlines = [SaleItemInline]


@admin.register(StockAdjustment)
class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'salon', 'product', 'quantity_change', 'reason', 'adjusted_by', 'adjusted_at']
    list_filter = ['reason']
