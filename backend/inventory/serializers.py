from rest_framework import serializers
from .models import Product, GRN, GRNItem, Sale, SaleItem, StockAdjustment, ProductImage, CosmeticOrder, CosmeticOrderItem


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'sort_order', 'created_at']
        read_only_fields = ['created_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class ProductSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()
    images = ProductImageSerializer(many=True, read_only=True)
    first_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'salon', 'name', 'brand', 'sku', 'category', 'subcategory',
            'shade_variant', 'size', 'unit_of_measure', 'cost_price', 'selling_price',
            'reorder_level', 'current_stock', 'supplier', 'manufacturing_date',
            'expiry_date', 'pao', 'barcode', 'country_of_origin', 'certifications',
            'skin_type', 'notes', 'is_active', 'status', 'images', 'first_image_url',
        ]
        read_only_fields = ['salon', 'current_stock', 'status']

    def get_first_image_url(self, obj):
        request = self.context.get('request')
        first = obj.images.first()
        if first and first.image and request:
            return request.build_absolute_uri(first.image.url)
        return None


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


class CosmeticOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CosmeticOrderItem
        fields = ['id', 'product', 'product_name', 'product_sku', 'quantity', 'unit_price', 'variant_note']


class CosmeticOrderSerializer(serializers.ModelSerializer):
    items = CosmeticOrderItemSerializer(many=True)

    class Meta:
        model = CosmeticOrder
        fields = [
            'id', 'salon', 'client', 'client_name', 'client_email', 'client_phone',
            'delivery_type', 'delivery_address', 'delivery_city', 'delivery_postal',
            'payment_method', 'gift_wrap', 'gift_message', 'promo_code',
            'subtotal', 'tax', 'delivery_fee', 'gift_fee', 'discount', 'total',
            'notes', 'status', 'created_at', 'items',
        ]
        read_only_fields = ['salon', 'client', 'subtotal', 'tax', 'delivery_fee', 'gift_fee', 'discount', 'total', 'status', 'created_at']

    def create(self, validated_data):
        from decimal import Decimal
        from datetime import date
        from salons.models import Offer

        items_data = validated_data.pop('items')
        salon = validated_data['salon']

        TAX_RATE = Decimal('0.15')
        DELIVERY_FEE = Decimal('350')
        GIFT_FEE = Decimal('150')

        subtotal = Decimal('0')
        for item in items_data:
            product = item.get('product')
            if product:
                if product.current_stock < item['quantity']:
                    raise serializers.ValidationError(
                        f'Insufficient stock for {product.name}: available {product.current_stock}'
                    )
            subtotal += item['unit_price'] * item['quantity']

        tax = (subtotal * TAX_RATE).quantize(Decimal('0.01'))
        delivery_fee = DELIVERY_FEE if validated_data.get('delivery_type') == 'delivery' else Decimal('0')
        gift_fee = GIFT_FEE if validated_data.get('gift_wrap') else Decimal('0')

        discount = Decimal('0')
        promo_code = validated_data.get('promo_code', '').strip()
        if promo_code:
            today = date.today()
            offer = Offer.objects.filter(
                salon=salon,
                title__iexact=promo_code,
                is_active=True,
                start_date__lte=today,
                end_date__gte=today,
            ).first()
            if offer:
                if offer.discount_type == 'percentage':
                    discount = (subtotal * offer.discount_value / 100).quantize(Decimal('0.01'))
                else:
                    discount = min(offer.discount_value, subtotal)

        total = subtotal + tax + delivery_fee + gift_fee - discount

        order = CosmeticOrder.objects.create(
            **validated_data,
            subtotal=subtotal,
            tax=tax,
            delivery_fee=delivery_fee,
            gift_fee=gift_fee,
            discount=discount,
            total=total,
        )

        for item in items_data:
            product = item.get('product')
            CosmeticOrderItem.objects.create(
                order=order,
                product_name=item.get('product_name', product.name if product else ''),
                product_sku=item.get('product_sku', product.sku if product else ''),
                **{k: v for k, v in item.items() if k not in ('product_name', 'product_sku')},
            )
            if product:
                product.current_stock -= item['quantity']
                product.save()

        return order
