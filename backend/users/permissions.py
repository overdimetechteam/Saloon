from rest_framework.permissions import BasePermission


class IsSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'system_admin')


class IsSalonOwner(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'salon_owner')


class IsClient(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'client')


class IsSalonOwnerOfSalon(BasePermission):
    """Checks that the authenticated salon_owner owns the salon in the URL."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('salon_owner', 'system_admin'))

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'system_admin':
            return True
        salon = getattr(obj, 'salon', obj)
        return salon.owner_id == request.user.id
