from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView

from salons.models import Salon
from users.permissions import IsSalonOwner, IsSalonOwnerOfSalon
from .models import StaffMember
from .permissions import IsEmployeeOfSalon
from .serializers import (
    StaffMemberPublicSerializer,
    StaffMemberOwnerSerializer,
    StaffMemberSelfSerializer,
    StaffMemberCreateSerializer,
    StaffResetCredentialsSerializer,
)


class SalonTeamPublicView(generics.ListAPIView):
    """GET /api/salons/<salon_id>/team/ — public, no auth required."""
    serializer_class = StaffMemberPublicSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return StaffMember.objects.filter(
            salon_id=self.kwargs['salon_id'], is_active=True
        ).select_related('salon')


class SalonStaffListCreate(APIView):
    """
    GET  /api/salons/<salon_id>/staff/  — owner lists all staff
    POST /api/salons/<salon_id>/staff/  — owner creates staff + login
    """
    permission_classes = [IsAuthenticated, IsSalonOwner]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_salon(self, salon_id, owner):
        try:
            return Salon.objects.get(pk=salon_id, owner=owner)
        except Salon.DoesNotExist:
            return None

    def get(self, request, salon_id):
        salon = self._get_salon(salon_id, request.user)
        if salon is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        qs = StaffMember.objects.filter(salon=salon).select_related('user')
        return Response(StaffMemberOwnerSerializer(qs, many=True, context={'request': request}).data)

    def post(self, request, salon_id):
        salon = self._get_salon(salon_id, request.user)
        if salon is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        ser = StaffMemberCreateSerializer(data=request.data, context={'salon': salon, 'request': request})
        ser.is_valid(raise_exception=True)
        staff = ser.save()
        return Response(
            StaffMemberOwnerSerializer(staff, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class SalonStaffDetail(APIView):
    """
    GET    /api/salons/<salon_id>/staff/<pk>/  — owner detail
    PATCH  /api/salons/<salon_id>/staff/<pk>/  — owner edits (name/role/bio/phone/is_active)
    DELETE /api/salons/<salon_id>/staff/<pk>/  — owner soft-deletes
    """
    permission_classes = [IsAuthenticated, IsSalonOwner]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_staff(self, salon_id, pk, owner):
        try:
            return StaffMember.objects.select_related('user').get(
                pk=pk, salon_id=salon_id, salon__owner=owner
            )
        except StaffMember.DoesNotExist:
            return None

    def get(self, request, salon_id, pk):
        staff = self._get_staff(salon_id, pk, request.user)
        if staff is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(StaffMemberOwnerSerializer(staff, context={'request': request}).data)

    def patch(self, request, salon_id, pk):
        staff = self._get_staff(salon_id, pk, request.user)
        if staff is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        ser = StaffMemberOwnerSerializer(staff, data=request.data, partial=True, context={'request': request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    def delete(self, request, salon_id, pk):
        staff = self._get_staff(salon_id, pk, request.user)
        if staff is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        staff.is_active = False
        staff.save(update_fields=['is_active'])
        if staff.user:
            staff.user.is_active = False
            staff.user.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class SalonStaffResetCredentials(APIView):
    """PATCH /api/salons/<salon_id>/staff/<pk>/reset-credentials/"""
    permission_classes = [IsAuthenticated, IsSalonOwner]

    def patch(self, request, salon_id, pk):
        try:
            staff = StaffMember.objects.select_related('user').get(
                pk=pk, salon_id=salon_id, salon__owner=request.user
            )
        except StaffMember.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not staff.user:
            return Response({'detail': 'This staff member has no login account.'}, status=status.HTTP_400_BAD_REQUEST)

        ser = StaffResetCredentialsSerializer(data=request.data, context={'staff': staff})
        ser.is_valid(raise_exception=True)

        user = staff.user
        if ser.validated_data.get('login_email'):
            user.email = ser.validated_data['login_email']
        if ser.validated_data.get('password'):
            user.set_password(ser.validated_data['password'])
        user.save()
        return Response({'detail': 'Credentials updated.'})


class EmployeeProfileView(APIView):
    """
    GET   /api/employee/profile/  — employee reads their own profile
    PATCH /api/employee/profile/  — employee updates bio/phone/photo
    """
    permission_classes = [IsAuthenticated, IsEmployeeOfSalon]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_staff(self, user):
        try:
            return StaffMember.objects.get(user=user, is_active=True)
        except StaffMember.DoesNotExist:
            return None

    def get(self, request):
        staff = self._get_staff(request.user)
        if staff is None:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(StaffMemberSelfSerializer(staff, context={'request': request}).data)

    def patch(self, request):
        staff = self._get_staff(request.user)
        if staff is None:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        ser = StaffMemberSelfSerializer(staff, data=request.data, partial=True, context={'request': request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)
