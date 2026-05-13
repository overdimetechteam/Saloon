from django.urls import path
from .views import (
    AllCosmeticsView,
    ProductListCreateView, ProductDetailView,
    GRNListCreateView, GRNConfirmView,
    SaleListCreateView,
    StockAdjustmentListCreateView,
    StockReportView, LowStockReportView, MovementsReportView,
)

urlpatterns = [
    path('cosmetics/', AllCosmeticsView.as_view(), name='all-cosmetics'),
    path('salons/<int:salon_pk>/products/', ProductListCreateView.as_view(), name='product-list'),
    path('salons/<int:salon_pk>/products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('salons/<int:salon_pk>/grn/', GRNListCreateView.as_view(), name='grn-list'),
    path('salons/<int:salon_pk>/grn/<int:pk>/confirm/', GRNConfirmView.as_view(), name='grn-confirm'),
    path('salons/<int:salon_pk>/sales/', SaleListCreateView.as_view(), name='sale-list'),
    path('salons/<int:salon_pk>/adjustments/', StockAdjustmentListCreateView.as_view(), name='adjustment-list'),
    path('salons/<int:salon_pk>/reports/stock/', StockReportView.as_view(), name='stock-report'),
    path('salons/<int:salon_pk>/reports/low-stock/', LowStockReportView.as_view(), name='low-stock-report'),
    path('salons/<int:salon_pk>/reports/movements/', MovementsReportView.as_view(), name='movements-report'),
]
