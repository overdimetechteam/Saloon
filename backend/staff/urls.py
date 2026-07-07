from django.urls import path
from .views import (
    SalonTeamPublicView,
    SalonStaffListCreate,
    SalonStaffDetail,
    SalonStaffResetCredentials,
    EmployeeProfileView,
    EmployeeStatusView,
)

urlpatterns = [
    # Public team view
    path('salons/<int:salon_id>/team/', SalonTeamPublicView.as_view(), name='salon-team-public'),

    # Owner-managed staff profiles (uses staff-members/ to avoid clash with existing salons/<pk>/staff/)
    path('salons/<int:salon_id>/staff-members/', SalonStaffListCreate.as_view(), name='salon-staff-members-list'),
    path('salons/<int:salon_id>/staff-members/<int:pk>/', SalonStaffDetail.as_view(), name='salon-staff-members-detail'),
    path('salons/<int:salon_id>/staff-members/<int:pk>/reset-credentials/', SalonStaffResetCredentials.as_view(), name='salon-staff-members-reset'),

    # Employee self-service
    path('employee/profile/', EmployeeProfileView.as_view(), name='employee-profile'),
    path('employee/status/',  EmployeeStatusView.as_view(),  name='employee-status'),
]
