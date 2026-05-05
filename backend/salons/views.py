from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Salon, SalonCalendar, SalonStaff
from .serializers import SalonSerializer, SalonRegisterSerializer, SalonStaffSerializer
from users.permissions import IsSystemAdmin, IsSalonOwner
from bookings.models import Booking


class SalonRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SalonRegisterSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            salon = serializer.save()
            return Response(SalonSerializer(salon).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SalonListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        name = request.query_params.get('name', '')
        salons = Salon.objects.filter(status='active')
        if name:
            salons = salons.filter(name__icontains=name)
        return Response(SalonSerializer(salons, many=True).data)


class SalonDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        return Response(SalonSerializer(salon).data)

    def patch(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role == 'salon_owner' and salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'client':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        serializer = SalonSerializer(salon, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SalonApproveView(APIView):
    permission_classes = [IsSystemAdmin]

    def post(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        salon.status = 'active'
        salon.save()
        return Response(SalonSerializer(salon).data)


class SalonRejectView(APIView):
    permission_classes = [IsSystemAdmin]

    def post(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        salon.status = 'inactive'
        salon.save()
        return Response(SalonSerializer(salon).data)


class PendingSalonsView(APIView):
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        salons = Salon.objects.filter(status='pending')
        return Response(SalonSerializer(salons, many=True).data)


class AllSalonsAdminView(APIView):
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        salons = Salon.objects.all()
        return Response(SalonSerializer(salons, many=True).data)


class MySalonView(APIView):
    """Returns the authenticated salon_owner's salon (any status)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'salon_owner':
            return Response({'detail': 'Not a salon owner'}, status=status.HTTP_403_FORBIDDEN)
        salon = Salon.objects.filter(owner=request.user).first()
        if not salon:
            return Response({'detail': 'No salon registered'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SalonSerializer(salon).data)


class SalonStaffListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        staff = salon.staff.filter(is_active=True).order_by('created_at')
        return Response(SalonStaffSerializer(staff, many=True).data)

    def post(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        serializer = SalonStaffSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(salon=salon)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SalonStaffDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, staff_pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        member = get_object_or_404(SalonStaff, pk=staff_pk, salon=salon)
        serializer = SalonStaffSerializer(member, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, staff_pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        member = get_object_or_404(SalonStaff, pk=staff_pk, salon=salon)
        member.is_active = False
        member.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AvailableSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk, status='active')
        date_str = request.query_params.get('date')
        staff_id = request.query_params.get('staff_id')

        if not date_str:
            return Response({'detail': 'date parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            slot_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'detail': 'Invalid date format, use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            calendar = salon.calendar
        except SalonCalendar.DoesNotExist:
            calendar = SalonCalendar.objects.create(salon=salon)

        if date_str in (calendar.blocked_dates or []):
            return Response({'slots': [], 'blocked': True})

        duration = calendar.slot_duration_minutes
        day_name = slot_date.strftime('%A').lower()
        hours = salon.operating_hours.get(day_name, {})
        open_time = hours.get('open', '09:00')
        close_time = hours.get('close', '17:00')

        open_dt = datetime.strptime(f"{date_str} {open_time}", '%Y-%m-%d %H:%M')
        close_dt = datetime.strptime(f"{date_str} {close_time}", '%Y-%m-%d %H:%M')

        taken_statuses = ['pending', 'confirmed', 'rescheduled', 'awaiting_client']

        if staff_id:
            specific_staff = get_object_or_404(SalonStaff, pk=staff_id, salon=salon, is_active=True)
            taken_datetimes = set(
                Booking.objects.filter(
                    staff_member=specific_staff,
                    requested_datetime__date=slot_date,
                    status__in=taken_statuses,
                ).values_list('requested_datetime', flat=True)
            )
        else:
            taken_datetimes = set(
                Booking.objects.filter(
                    salon=salon,
                    requested_datetime__date=slot_date,
                    status__in=taken_statuses,
                ).values_list('requested_datetime', flat=True)
            )

        slots = []
        current = open_dt
        while current < close_dt:
            aware = timezone.make_aware(current) if timezone.is_naive(current) else current
            is_taken = any(
                abs((t - aware).total_seconds()) < 60
                for t in taken_datetimes
            )
            slots.append({
                'datetime': current.strftime('%Y-%m-%dT%H:%M'),
                'available': not is_taken,
            })
            current += timedelta(minutes=duration)

        return Response({'slots': slots})
