from rest_framework import serializers
from .models import Product, GRN, GRNItem, Sale, SaleItem, StockAdjustment


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'salon', 'name', 'brand', 'category',
            'unit_of_measure', 'cost_price', 'selling_price',
            'reorder_level', 'current_stock', 'is_active',
        ]
        read_only_fields = ['salon', 'current_stock']


class GRNItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = GRNItem
        fields = ['id', 'product', 'product_name', 'quantity_received', 'unit_cost']


class GRNSerializer(serializers.ModelSerializer):
    items = GRNItemSerializer(many=True)

    class Meta:
        model = GRN
        fields = ['id', 'salon', 'reference_number', 'supplier_name', 'status', 'created_by', 'created_at', 'items']
        read_only_fields = ['salon', 'reference_number', 'status', 'created_by', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        grn = GRN.objects.create(**validated_data)
        for item in items_data:
            GRNItem.objects.create(grn=grn, **item)
        return grn


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    sold_by_email = serializers.EmailField(source='sold_by.email', read_only=True)

    class Meta:
        model = Sale
        fields = ['id', 'salon', 'sold_by', 'sold_by_email', 'created_at', 'items']
        read_only_fields = ['salon', 'sold_by', 'created_at']

    def validate(self, data):
        salon_id = self.context.get('salon_id')
        for item in data.get('items', []):
            product = item['product']
            if product.salon_id != salon_id:
                raise serializers.ValidationError(f'Product {product.id} does not belong to this salon.')
            if product.current_stock < item['quantity']:
                raise serializers.ValidationError(
                    f'Insufficient stock for {product.name}: available {product.current_stock}, requested {item["quantity"]}'
                )
        return data

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        sale = Sale.objects.create(**validated_data)
        for item in items_data:
            product = item['product']
            product.current_stock -= item['quantity']
            product.save()
            SaleItem.objects.create(sale=sale, **item)
        return sale


class StockAdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    adjusted_by_email = serializers.EmailField(source='adjusted_by.email', read_only=True)

    class Meta:
        model = StockAdjustment
        fields = [
            'id', 'salon', 'product', 'product_name',
            'quantity_change', 'reason', 'notes',
            'adjusted_by', 'adjusted_by_email', 'adjusted_at',
        ]
        read_only_fields = ['salon', 'adjusted_by', 'adjusted_at']
