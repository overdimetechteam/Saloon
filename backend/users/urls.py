from django.urls import path
from .views import (
    RegisterView, LoginView,
    NotificationListView, NotificationUnreadCountView,
    NotificationMarkAllReadView, NotificationMarkOneReadView,
    UserProfileView,
    AdminCustomerListView, AdminCustomerDetailView,
)

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/unread-count/', NotificationUnreadCountView.as_view(), name='notif-unread'),
    path('notifications/mark-read/', NotificationMarkAllReadView.as_view(), name='notif-mark-all'),
    path('notifications/<int:pk>/read/', NotificationMarkOneReadView.as_view(), name='notif-mark-one'),
    path('admin/customers/', AdminCustomerListView.as_view(), name='admin-customers'),
    path('admin/customers/<int:pk>/', AdminCustomerDetailView.as_view(), name='admin-customer-detail'),
]
