from rest_framework.permissions import BasePermission
from .models import StaffMember


class IsEmployeeOfSalon(BasePermission):
    """Allows access only to authenticated employees belonging to the target salon."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role != 'employee':
            return False
        salon_id = view.kwargs.get('salon_id') or view.kwargs.get('pk')
        if salon_id is None:
            return True
        return StaffMember.objects.filter(
            user=request.user, salon_id=salon_id, is_active=True
        ).exists()
