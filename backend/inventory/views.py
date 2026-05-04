from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Product, GRN, GRNItem, Sale, SaleItem, StockAdjustment
from .serializers import (
    ProductSerializer, GRNSerializer, SaleSerializer, StockAdjustmentSerializer
)
from salons.models import Salon


def _get_salon_for_owner(request, salon_pk):
    salon = get_object_or_404(Salon, pk=salon_pk)
    if request.user.role == 'salon_owner' and salon.owner_id != request.user.id:
        return None, Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    if request.user.role == 'client':
        return None, Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    return salon, None


class ProductListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, salon_pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        products = Product.objects.filter(salon=salon, is_active=True)
        return Response(ProductSerializer(products, many=True).data)

    def post(self, request, salon_pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(salon=salon)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, salon_pk, pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        product = get_object_or_404(Product, pk=pk, salon=salon)
        return Response(ProductSerializer(product).data)

    def put(self, request, salon_pk, pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        product = get_object_or_404(Product, pk=pk, salon=salon)
        serializer = ProductSerializer(product, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, salon_pk, pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        product = get_object_or_404(Product, pk=pk, salon=salon)
        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, salon_pk, pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        product = get_object_or_404(Product, pk=pk, salon=salon)
        product.is_active = False
        product.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GRNListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, salon_pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        grns = GRN.objects.filter(salon=salon).prefetch_related('items').order_by('-created_at')
        return Response(GRNSerializer(grns, many=True).data)

    def post(self, request, salon_pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        serializer = GRNSerializer(data=request.data)
        if serializer.is_valid():
            grn = serializer.save(salon=salon, created_by=request.user)
            return Response(GRNSerializer(grn).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GRNConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, salon_pk, pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        grn = get_object_or_404(GRN, pk=pk, salon=salon)
        if grn.status == 'confirmed':
            return Response({'detail': 'GRN already confirmed'}, status=status.HTTP_400_BAD_REQUEST)
        for item in grn.items.all():
            item.product.current_stock += item.quantity_received
            item.product.save()
        grn.status = 'confirmed'
        grn.save()
        return Response(GRNSerializer(grn).data)


class SaleListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, salon_pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        sales = Sale.objects.filter(salon=salon).prefetch_related('items').order_by('-created_at')
        return Response(SaleSerializer(sales, many=True).data)

    def post(self, request, salon_pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        serializer = SaleSerializer(data=request.data, context={'salon_id': salon.id})
        if serializer.is_valid():
            sale = serializer.save(salon=salon, sold_by=request.user)
            return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockAdjustmentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, salon_pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        adjustments = StockAdjustment.objects.filter(salon=salon).order_by('-adjusted_at')
        return Response(StockAdjustmentSerializer(adjustments, many=True).data)

    def post(self, request, salon_pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        serializer = StockAdjustmentSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.validated_data['product']
            if product.salon_id != salon.id:
                return Response({'detail': 'Product does not belong to this salon'}, status=status.HTTP_400_BAD_REQUEST)
            adjustment = serializer.save(salon=salon, adjusted_by=request.user)
            product.current_stock += adjustment.quantity_change
            product.save()
            return Response(StockAdjustmentSerializer(adjustment).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, salon_pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        products = Product.objects.filter(salon=salon, is_active=True)
        return Response(ProductSerializer(products, many=True).data)


class LowStockReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, salon_pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        from django.db.models import F
        products = Product.objects.filter(salon=salon, is_active=True, current_stock__lte=F('reorder_level'))
        return Response(ProductSerializer(products, many=True).data)


class MovementsReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, salon_pk):
        salon, err = _get_salon_for_owner(request, salon_pk)
        if err:
            return err
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')

        grn_qs = GRN.objects.filter(salon=salon, status='confirmed')
        sale_qs = Sale.objects.filter(salon=salon)
        adj_qs = StockAdjustment.objects.filter(salon=salon)

        if from_date:
            grn_qs = grn_qs.filter(created_at__date__gte=from_date)
            sale_qs = sale_qs.filter(created_at__date__gte=from_date)
            adj_qs = adj_qs.filter(adjusted_at__date__gte=from_date)
        if to_date:
            grn_qs = grn_qs.filter(created_at__date__lte=to_date)
            sale_qs = sale_qs.filter(created_at__date__lte=to_date)
            adj_qs = adj_qs.filter(adjusted_at__date__lte=to_date)

        return Response({
            'grns': GRNSerializer(grn_qs.prefetch_related('items'), many=True).data,
            'sales': SaleSerializer(sale_qs.prefetch_related('items'), many=True).data,
            'adjustments': StockAdjustmentSerializer(adj_qs, many=True).data,
        })
