from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
import logging

from .models import Booking, BookingService, AlternativeSlot
from .serializers import BookingSerializer, BookingCreateSerializer
from salons.models import Salon, SalonStaff
from services.models import SalonService
from users.permissions import IsSystemAdmin, IsSalonOwner, IsClient

logger = logging.getLogger(__name__)

TAKEN_STATUSES = ['pending', 'confirmed', 'rescheduled', 'awaiting_client']


def _is_slot_taken(salon, requested_dt, exclude_booking=None, staff_member=None):
    if staff_member:
        qs = Booking.objects.filter(
            staff_member=staff_member,
            requested_datetime=requested_dt,
            status__in=TAKEN_STATUSES,
        )
    else:
        qs = Booking.objects.filter(salon=salon, requested_datetime=requested_dt, status__in=TAKEN_STATUSES)
    if exclude_booking:
        qs = qs.exclude(pk=exclude_booking.pk)
    return qs.exists()


class BookingListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'client':
            bookings = Booking.objects.filter(client=request.user).order_by('-created_at')
        elif request.user.role == 'salon_owner':
            salons = Salon.objects.filter(owner=request.user)
            bookings = Booking.objects.filter(salon__in=salons).order_by('-created_at')
        else:
            bookings = Booking.objects.all().order_by('-created_at')
        return Response(BookingSerializer(bookings, many=True).data)

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        salon = get_object_or_404(Salon, pk=data['salon'], status='active')
        requested_dt = data['requested_datetime']

        staff_member = None
        staff_member_id = data.get('staff_member_id')
        if staff_member_id:
            staff_member = get_object_or_404(SalonStaff, pk=staff_member_id, salon=salon, is_active=True)

        if _is_slot_taken(salon, requested_dt, staff_member=staff_member):
            return Response({'detail': 'Slot already taken'}, status=status.HTTP_409_CONFLICT)

        booking = Booking.objects.create(
            client=request.user,
            salon=salon,
            staff_member=staff_member,
            requested_datetime=requested_dt,
            notes=data.get('notes', ''),
            status='pending',
        )
        for ss_id in data['salon_service_ids']:
            BookingService.objects.create(
                booking=booking,
                salon_service_id=ss_id,
            )

        logger.info(f"New booking #{booking.pk} created by {request.user.email}")
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class SalonBookingListView(APIView):
    permission_classes = [IsAuthenticated]

    def _check_salon_access(self, request, salon):
        if request.user.role == 'salon_owner' and salon.owner_id != request.user.id:
            return False
        if request.user.role == 'client':
            return False
        return True

    def get(self, request, salon_pk):
        salon = get_object_or_404(Salon, pk=salon_pk)
        if not self._check_salon_access(request, salon):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        bookings = Booking.objects.filter(salon=salon).order_by('-created_at')
        status_filter = request.query_params.get('status')
        if status_filter:
            bookings = bookings.filter(status=status_filter)
        return Response(BookingSerializer(bookings, many=True).data)


class SalonPendingBookingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, salon_pk):
        salon = get_object_or_404(Salon, pk=salon_pk)
        if request.user.role == 'salon_owner' and salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        bookings = Booking.objects.filter(salon=salon, status='pending').order_by('-created_at')
        return Response(BookingSerializer(bookings, many=True).data)


class BookingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if request.user.role == 'client' and booking.client_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'salon_owner' and booking.salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        return Response(BookingSerializer(booking).data)


class BookingConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if request.user.role == 'salon_owner' and booking.salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'client':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if booking.status not in ('pending', 'rescheduled'):
            return Response({'detail': f"Cannot confirm booking in status '{booking.status}'"}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = 'confirmed'
        booking.save()
        logger.info(f"Booking #{booking.pk} confirmed")
        return Response(BookingSerializer(booking).data)


class BookingRejectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if request.user.role == 'salon_owner' and booking.salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'client':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        proposed = request.data.get('proposed_slots', [])
        if len(proposed) != 3:
            return Response({'detail': 'Exactly 3 proposed slots required'}, status=status.HTTP_400_BAD_REQUEST)

        from django.utils.dateparse import parse_datetime
        slot_datetimes = []
        for s in proposed:
            dt = parse_datetime(s) if isinstance(s, str) else parse_datetime(s.get('datetime', ''))
            if dt is None:
                return Response({'detail': f'Invalid datetime: {s}'}, status=status.HTTP_400_BAD_REQUEST)
            if _is_slot_taken(booking.salon, dt, exclude_booking=booking):
                return Response({'detail': f'Proposed slot {dt} is already taken'}, status=status.HTTP_409_CONFLICT)
            slot_datetimes.append(dt)

        booking.negotiation_round += 1
        if booking.negotiation_round >= 5:
            booking.status = 'flagged'
        else:
            booking.status = 'awaiting_client'
        booking.save()

        round_num = booking.negotiation_round
        for dt in slot_datetimes:
            AlternativeSlot.objects.create(
                booking=booking,
                proposed_datetime=dt,
                round_number=round_num,
            )

        logger.info(f"Booking #{booking.pk} rejected, {len(slot_datetimes)} alt slots proposed (round {round_num})")
        return Response(BookingSerializer(booking).data)


class BookingSelectSlotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if booking.client_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if booking.status != 'awaiting_client':
            return Response({'detail': 'Booking is not awaiting client selection'}, status=status.HTTP_400_BAD_REQUEST)

        slot_id = request.data.get('slot_id')
        slot = get_object_or_404(AlternativeSlot, pk=slot_id, booking=booking)

        booking.requested_datetime = slot.proposed_datetime
        booking.status = 'rescheduled'
        booking.save()

        slot.is_selected = True
        slot.save()

        logger.info(f"Booking #{booking.pk} rescheduled to {slot.proposed_datetime}")
        return Response(BookingSerializer(booking).data)


class BookingCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if request.user.role == 'client' and booking.client_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'salon_owner' and booking.salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if booking.status in ('cancelled', 'completed'):
            return Response({'detail': 'Cannot cancel this booking'}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = 'cancelled'
        booking.save()
        logger.info(f"Booking #{booking.pk} cancelled by {request.user.email}")
        return Response(BookingSerializer(booking).data)
