from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
import logging
import secrets

from .models import Booking, BookingService, AlternativeSlot, Review, Promotion
from .serializers import BookingSerializer, BookingCreateSerializer, ReviewSerializer, PromotionSerializer
from salons.models import Salon
from staff.models import StaffMember
from services.models import SalonService
from users.permissions import IsSystemAdmin, IsSalonOwner, IsClient
from users.utils import send_notification

logger = logging.getLogger(__name__)

TAKEN_STATUSES = ['pending', 'confirmed', 'rescheduled', 'awaiting_client']


def _has_schedule_conflict(staff_member, new_start, new_duration_minutes, exclude_booking=None):
    """Return True if the staff member has any booking that overlaps [new_start, new_start+new_duration)."""
    if not staff_member:
        return False
    new_end = new_start + timedelta(minutes=new_duration_minutes)
    qs = (
        Booking.objects
        .filter(staff_member=staff_member, status__in=TAKEN_STATUSES)
        .prefetch_related('booking_services__salon_service')
    )
    if exclude_booking:
        qs = qs.exclude(pk=exclude_booking.pk)
    for b in qs:
        b_start = b.requested_datetime
        b_dur = sum(bs.salon_service.effective_duration for bs in b.booking_services.all()) or 30
        b_end = b_start + timedelta(minutes=b_dur)
        if b_start < new_end and b_end > new_start:
            return True
    return False


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
            staff_member = get_object_or_404(StaffMember, pk=staff_member_id, salon=salon, is_active=True)

        # Conflict check: calculate new booking's total duration, then check overlap
        service_ids = data.get('salon_service_ids', [])
        service_objs_for_dur = SalonService.objects.filter(id__in=service_ids)
        new_duration = sum(ss.effective_duration for ss in service_objs_for_dur) or 30

        if staff_member and _has_schedule_conflict(staff_member, requested_dt, new_duration):
            return Response({'detail': 'This professional is already booked during that time.'}, status=status.HTTP_409_CONFLICT)
        elif not staff_member and _is_slot_taken(salon, requested_dt):
            return Response({'detail': 'Slot already taken'}, status=status.HTTP_409_CONFLICT)

        promo = None
        discount_amount = 0
        promo_id = data.get('promo_id')
        if promo_id:
            try:
                promo = Promotion.objects.get(pk=promo_id, salon=salon, is_active=True)
                today = timezone.now().date()
                if promo.valid_from <= today <= promo.valid_until and promo.times_used < promo.max_uses:
                    service_objs = SalonService.objects.filter(id__in=data['salon_service_ids'])
                    total = sum(float(ss.effective_price) for ss in service_objs)
                    if promo.discount_type == 'percentage':
                        discount_amount = total * float(promo.discount_value) / 100
                    else:
                        discount_amount = min(float(promo.discount_value), total)
                    promo.times_used += 1
                    promo.save()
                else:
                    promo = None
            except Promotion.DoesNotExist:
                promo = None

        booking = Booking.objects.create(
            client=request.user,
            salon=salon,
            staff_member=staff_member,
            promo_code=promo,
            discount_amount=discount_amount,
            requested_datetime=requested_dt,
            notes=data.get('notes', ''),
            home_visit=data.get('home_visit', False),
            home_visit_address=data.get('home_visit_address', ''),
            status='pending',
        )
        for ss_id in data['salon_service_ids']:
            BookingService.objects.create(booking=booking, salon_service_id=ss_id)

        # Notify salon owner of new booking
        dt_str = booking.requested_datetime.strftime('%b %d at %I:%M %p')
        send_notification(
            salon.owner,
            f"New booking from {request.user.full_name or request.user.email} on {dt_str}.",
            notif_type='booking_confirmed',
            booking_id=booking.pk,
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
        dt_str = booking.requested_datetime.strftime('%b %d at %I:%M %p')
        send_notification(
            booking.client,
            f"Your booking at {booking.salon.name} on {dt_str} has been confirmed! We look forward to seeing you.",
            notif_type='booking_confirmed',
            booking_id=booking.pk,
        )
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

        if booking.negotiation_round >= 5:
            return Response({'detail': 'Maximum negotiation rounds reached. Cannot propose more alternatives.'}, status=status.HTTP_400_BAD_REQUEST)

        booking.negotiation_round += 1
        booking.status = 'awaiting_client'
        booking.save()

        round_num = booking.negotiation_round
        for dt in slot_datetimes:
            AlternativeSlot.objects.create(booking=booking, proposed_datetime=dt, round_number=round_num)

        send_notification(
            booking.client,
            f"Your booking at {booking.salon.name} couldn't be confirmed at your requested time. Please choose from 3 alternative slots.",
            notif_type='booking_awaiting',
            booking_id=booking.pk,
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

        # Notify salon owner that client picked a slot
        dt_str = slot.proposed_datetime.strftime('%b %d at %I:%M %p')
        send_notification(
            booking.salon.owner,
            f"{booking.client.full_name or booking.client.email} accepted the alternative slot on {dt_str} for booking #{booking.pk}.",
            notif_type='booking_confirmed',
            booking_id=booking.pk,
        )

        logger.info(f"Booking #{booking.pk} rescheduled to {slot.proposed_datetime}")
        return Response(BookingSerializer(booking).data)


class BookingRequestMoreSlotsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if booking.client_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if booking.status != 'awaiting_client':
            return Response({'detail': 'Booking is not awaiting client selection'}, status=status.HTTP_400_BAD_REQUEST)
        if booking.negotiation_round >= 5:
            return Response({'detail': 'Maximum negotiation rounds reached. Please select one of the available dates.'}, status=status.HTTP_400_BAD_REQUEST)

        booking.status = 'pending'
        booking.save()

        send_notification(
            booking.salon.owner,
            f"{booking.client.full_name or booking.client.email} couldn't find a suitable time and is requesting more available dates for booking #{booking.pk} (round {booking.negotiation_round}).",
            notif_type='booking_confirmed',
            booking_id=booking.pk,
        )
        logger.info(f"Booking #{booking.pk} — client requested more slots (round {booking.negotiation_round})")
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
        if request.user.role == 'salon_owner':
            send_notification(
                booking.client,
                f"Your booking at {booking.salon.name} has been cancelled by the salon.",
                notif_type='booking_cancelled',
                booking_id=booking.pk,
            )
        elif request.user.role == 'client':
            # Notify owner when client cancels
            dt_str = booking.requested_datetime.strftime('%b %d at %I:%M %p')
            send_notification(
                booking.salon.owner,
                f"Booking #{booking.pk} on {dt_str} was cancelled by the client.",
                notif_type='booking_cancelled',
                booking_id=booking.pk,
            )
        logger.info(f"Booking #{booking.pk} cancelled by {request.user.email}")
        return Response(BookingSerializer(booking).data)


class BookingAssignStaffView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if request.user.role != 'salon_owner' or booking.salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if booking.status not in ('confirmed', 'pending', 'rescheduled', 'awaiting_client'):
            return Response({'detail': 'Cannot assign staff to this booking'}, status=status.HTTP_400_BAD_REQUEST)

        staff_id = request.data.get('staff_id')
        if not staff_id:
            booking.staff_member = None
        else:
            staff = get_object_or_404(StaffMember, pk=staff_id, salon=booking.salon, is_active=True)
            booking.staff_member = staff
        booking.save()
        return Response(BookingSerializer(booking).data)


class WalkInBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, salon_pk):
        salon = get_object_or_404(Salon, pk=salon_pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        client_email = request.data.get('client_email', '').strip().lower()
        client_name = request.data.get('client_name', '').strip()
        client_phone = request.data.get('client_phone', '').strip()
        service_ids = request.data.get('service_ids', [])
        appointment_datetime = request.data.get('appointment_datetime')
        notes = request.data.get('notes', '')
        staff_id = request.data.get('staff_id') or None

        if not client_email:
            return Response({'detail': 'client_email is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not service_ids:
            return Response({'detail': 'At least one service is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not appointment_datetime:
            return Response({'detail': 'appointment_datetime is required'}, status=status.HTTP_400_BAD_REQUEST)

        from django.utils.dateparse import parse_datetime
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            client = User.objects.get(email=client_email)
        except User.DoesNotExist:
            password = secrets.token_urlsafe(12)
            client = User.objects.create_user(
                email=client_email,
                full_name=client_name or client_email.split('@')[0],
                phone=client_phone,
                role='client',
                password=password,
            )

        apt_dt = parse_datetime(appointment_datetime)
        if apt_dt is None:
            return Response({'detail': 'Invalid appointment_datetime format'}, status=status.HTTP_400_BAD_REQUEST)

        service_objs = SalonService.objects.filter(id__in=service_ids, salon=salon, is_active=True)
        if service_objs.count() != len(service_ids):
            return Response({'detail': 'One or more services are invalid'}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve staff member and check for booking conflicts.
        staff_member = None
        if staff_id:
            try:
                staff_member = StaffMember.objects.get(id=staff_id, salon=salon, is_active=True)
            except StaffMember.DoesNotExist:
                return Response({'detail': 'Selected stylist not found or inactive'}, status=status.HTTP_400_BAD_REQUEST)

            total_duration = sum(ss.effective_duration for ss in service_objs) or 30
            apt_end = apt_dt + timedelta(minutes=total_duration)
            taken_statuses = ['pending', 'confirmed', 'rescheduled', 'awaiting_client']
            conflicts = Booking.objects.filter(
                staff_member=staff_member,
                status__in=taken_statuses,
            ).prefetch_related('booking_services__salon_service')
            for existing in conflicts:
                e_start = existing.requested_datetime
                e_dur = sum(
                    bs.salon_service.effective_duration
                    for bs in existing.booking_services.all()
                ) or 30
                e_end = e_start + timedelta(minutes=e_dur)
                if apt_dt < e_end and apt_end > e_start:
                    return Response(
                        {'detail': f'This stylist already has a booking from {e_start.strftime("%H:%M")} to {e_end.strftime("%H:%M")} on that day.'},
                        status=status.HTTP_409_CONFLICT,
                    )

        booking = Booking.objects.create(
            client=client,
            salon=salon,
            requested_datetime=apt_dt,
            status='confirmed',
            notes=notes,
            is_walk_in=True,
            staff_member=staff_member,
        )
        for ss in service_objs:
            BookingService.objects.create(booking=booking, salon_service=ss)

        logger.info(f"Walk-in booking #{booking.pk} created for {client_email}")
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class BookingReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if booking.client_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if booking.status != 'completed':
            return Response({'detail': 'Can only review completed bookings'}, status=status.HTTP_400_BAD_REQUEST)
        if hasattr(booking, 'review') and booking.review is not None:
            return Response({'detail': 'Review already submitted'}, status=status.HTTP_400_BAD_REQUEST)

        rating = request.data.get('rating')
        comment = request.data.get('comment', '')
        try:
            rating = int(rating)
            if not 1 <= rating <= 5:
                raise ValueError
        except (TypeError, ValueError):
            return Response({'detail': 'Rating must be an integer between 1 and 5'}, status=status.HTTP_400_BAD_REQUEST)

        review = Review.objects.create(
            booking=booking,
            client=request.user,
            salon=booking.salon,
            rating=rating,
            comment=comment,
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class BookingRebookView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if booking.client_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if booking.status != 'completed':
            return Response({'detail': 'Can only rebook completed bookings'}, status=status.HTTP_400_BAD_REQUEST)
        service_ids = list(booking.booking_services.values_list('salon_service_id', flat=True))
        return Response({'salon_id': booking.salon_id, 'service_ids': service_ids})


class PromotionValidateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        salon_id = request.data.get('salon_id')
        booking_total = float(request.data.get('booking_total', 0))

        try:
            promo = Promotion.objects.get(code__iexact=code, salon_id=salon_id, is_active=True)
        except Promotion.DoesNotExist:
            return Response({'valid': False, 'message': 'Invalid promo code for this salon.'})

        today = timezone.now().date()
        if today < promo.valid_from or today > promo.valid_until:
            return Response({'valid': False, 'message': 'This promo code has expired.'})
        if promo.times_used >= promo.max_uses:
            return Response({'valid': False, 'message': 'Promo code usage limit reached.'})
        if promo.min_booking_value and booking_total < float(promo.min_booking_value):
            return Response({
                'valid': False,
                'message': f'Minimum booking value of LKR {promo.min_booking_value} required.',
            })

        if promo.discount_type == 'percentage':
            discount = round(booking_total * float(promo.discount_value) / 100, 2)
            label = f"{int(promo.discount_value)}% off"
        else:
            discount = round(min(float(promo.discount_value), booking_total), 2)
            label = f"LKR {int(promo.discount_value)} off"

        return Response({
            'valid': True,
            'promo_id': promo.id,
            'discount_amount': discount,
            'message': f"{label} applied!",
        })


class SalonPromotionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, salon_pk):
        salon = get_object_or_404(Salon, pk=salon_pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        promos = Promotion.objects.filter(salon=salon).order_by('-created_at')
        return Response(PromotionSerializer(promos, many=True).data)

    def post(self, request, salon_pk):
        salon = get_object_or_404(Salon, pk=salon_pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        if isinstance(data.get('code'), str):
            data['code'] = data['code'].strip().upper()
        serializer = PromotionSerializer(data=data)
        if serializer.is_valid():
            promo = serializer.save(salon=salon)
            return Response(PromotionSerializer(promo).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SalonPromotionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, salon_pk, promo_pk):
        salon = get_object_or_404(Salon, pk=salon_pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return None, None, Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        promo = get_object_or_404(Promotion, pk=promo_pk, salon=salon)
        return salon, promo, None

    def get(self, request, salon_pk, promo_pk):
        _, promo, err = self._get(request, salon_pk, promo_pk)
        if err:
            return err
        return Response(PromotionSerializer(promo).data)

    def patch(self, request, salon_pk, promo_pk):
        _, promo, err = self._get(request, salon_pk, promo_pk)
        if err:
            return err
        serializer = PromotionSerializer(promo, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, salon_pk, promo_pk):
        _, promo, err = self._get(request, salon_pk, promo_pk)
        if err:
            return err
        if promo.times_used > 0:
            return Response({'detail': 'Cannot delete a promo code that has been used.'}, status=status.HTTP_400_BAD_REQUEST)
        promo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
