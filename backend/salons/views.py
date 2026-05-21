import urllib.parse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Avg, Sum, F
from datetime import datetime, timedelta
from collections import defaultdict

from .models import Salon, SalonCalendar, SalonStaff, FavouriteSalon, Offer, SalonImage
from .serializers import SalonSerializer, SalonRegisterSerializer, SalonStaffSerializer, OfferSerializer, SalonImageSerializer
from users.permissions import IsSystemAdmin, IsSalonOwner
from bookings.models import Booking


class SalonRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SalonRegisterSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        salon = serializer.save()

        # Optional: initial custom services from step 4
        from services.models import Service, SalonService
        for svc in request.data.get('initial_services', []):
            name     = str(svc.get('name', '')).strip()
            category = svc.get('category', 'Hair')
            price    = svc.get('price')
            duration = svc.get('duration')
            if name and price is not None and duration is not None:
                service = Service.objects.create(
                    name=name, category=category,
                    default_price=price, default_duration_minutes=duration,
                    is_private=True, owner_salon=salon,
                )
                SalonService.objects.create(salon=salon, service=service)

        # Optional: initial offer from step 4
        offer_data = request.data.get('initial_offer')
        if offer_data and offer_data.get('title') and offer_data.get('start_date') and offer_data.get('end_date'):
            Offer.objects.create(
                salon=salon,
                title=offer_data.get('title', ''),
                description=offer_data.get('description', ''),
                discount_type=offer_data.get('discount_type', 'percentage'),
                discount_value=offer_data.get('discount_value', 0),
                start_date=offer_data.get('start_date'),
                end_date=offer_data.get('end_date'),
                note=offer_data.get('note', ''),
                is_active=offer_data.get('is_active', True),
            )

        return Response(SalonSerializer(salon).data, status=status.HTTP_201_CREATED)


class SalonListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        name = request.query_params.get('name', '')
        salons = Salon.objects.filter(status='active', is_suspended=False)
        if name:
            salons = salons.filter(name__icontains=name)
        return Response(SalonSerializer(salons, many=True, context={'request': request}).data)


class SalonDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        return Response(SalonSerializer(salon, context={'request': request}).data)

    def patch(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role == 'salon_owner' and salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'client':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        serializer = SalonSerializer(salon, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(SalonSerializer(salon, context={'request': request}).data)
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


class SalonSuspendView(APIView):
    permission_classes = [IsSystemAdmin]

    def post(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if salon.status != 'active':
            return Response({'detail': 'Only active salons can be suspended.'}, status=status.HTTP_400_BAD_REQUEST)
        salon.status = 'inactive'
        salon.save()
        return Response(SalonSerializer(salon).data)


class SalonReactivateView(APIView):
    permission_classes = [IsSystemAdmin]

    def post(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if salon.status == 'active':
            return Response({'detail': 'Salon is already active.'}, status=status.HTTP_400_BAD_REQUEST)
        salon.status = 'active'
        salon.save()
        return Response(SalonSerializer(salon).data)


class SalonRemoveView(APIView):
    permission_classes = [IsSystemAdmin]

    def delete(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        active_statuses = ['pending', 'confirmed', 'rescheduled', 'awaiting_client']
        if Booking.objects.filter(salon=salon, status__in=active_statuses).exists():
            return Response(
                {'detail': 'Cannot remove salon with active bookings. Suspend it first and wait for bookings to resolve.'},
                status=status.HTTP_409_CONFLICT,
            )
        salon.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SalonToggleSuspendView(APIView):
    permission_classes = [IsSystemAdmin]

    def post(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if salon.status != 'active':
            return Response({'detail': 'Only active salons can be suspended/unsuspended.'}, status=status.HTTP_400_BAD_REQUEST)
        salon.is_suspended = not salon.is_suspended
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'salon_owner':
            return Response({'detail': 'Not a salon owner'}, status=status.HTTP_403_FORBIDDEN)
        salon = Salon.objects.filter(owner=request.user).first()
        if not salon:
            return Response({'detail': 'No salon registered'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SalonSerializer(salon, context={'request': request}).data)


class SalonLogoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        logo_file = request.FILES.get('logo')
        if not logo_file:
            return Response({'detail': 'No logo file provided'}, status=status.HTTP_400_BAD_REQUEST)
        if salon.logo:
            salon.logo.delete(save=False)
        salon.logo = logo_file
        salon.save()
        return Response(SalonSerializer(salon, context={'request': request}).data)

    def delete(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if salon.logo:
            salon.logo.delete(save=False)
            salon.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


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
            member = serializer.save(salon=salon)
            specialty_ids = request.data.get('specialties', [])
            if specialty_ids:
                member.specialties.set(specialty_ids)
            return Response(SalonStaffSerializer(member).data, status=status.HTTP_201_CREATED)
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
            member = serializer.save()
            if 'specialties' in request.data:
                member.specialties.set(request.data['specialties'])
            return Response(SalonStaffSerializer(member).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, staff_pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        member = get_object_or_404(SalonStaff, pk=staff_pk, salon=salon)
        member.is_active = False
        member.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AvailableStaffView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role == 'salon_owner' and salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'detail': 'date parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            slot_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'detail': 'Invalid date format, use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        day_name = slot_date.strftime('%A').lower()
        all_staff = salon.staff.filter(is_active=True)
        available = [m for m in all_staff if day_name in (m.working_days or [])]
        return Response(SalonStaffSerializer(available, many=True).data)


class FavouriteSalonView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == 'GET' else [IsAuthenticated()]

    def get(self, request, pk):
        if not request.user.is_authenticated or request.user.role != 'client':
            return Response({'is_favourited': False})
        salon = get_object_or_404(Salon, pk=pk)
        return Response({'is_favourited': FavouriteSalon.objects.filter(client=request.user, salon=salon).exists()})

    def post(self, request, pk):
        if request.user.role != 'client':
            return Response({'detail': 'Only clients can favourite salons'}, status=status.HTTP_403_FORBIDDEN)
        salon = get_object_or_404(Salon, pk=pk)
        fav, created = FavouriteSalon.objects.get_or_create(client=request.user, salon=salon)
        if not created:
            fav.delete()
            return Response({'is_favourited': False})
        return Response({'is_favourited': True})


class ClientFavouritesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'client':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        salons = Salon.objects.filter(favourited_by__client=request.user, status='active', is_suspended=False)
        return Response(SalonSerializer(salons, many=True, context={'request': request}).data)


class SalonReviewListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        from bookings.models import Review
        from bookings.serializers import ReviewSerializer
        salon = get_object_or_404(Salon, pk=pk)
        reviews = Review.objects.filter(salon=salon).select_related('client').order_by('-created_at')[:20]
        return Response(ReviewSerializer(reviews, many=True).data)


class SalonReviewSummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        from bookings.models import Review
        salon = get_object_or_404(Salon, pk=pk)
        reviews = Review.objects.filter(salon=salon)
        total = reviews.count()
        if total == 0:
            return Response({'average_rating': 0, 'total_reviews': 0, 'breakdown': {str(i): 0 for i in range(1, 6)}})
        avg = reviews.aggregate(avg=Avg('rating'))['avg']
        breakdown = {str(i): reviews.filter(rating=i).count() for i in range(1, 6)}
        return Response({
            'average_rating': round(float(avg), 1),
            'total_reviews': total,
            'breakdown': breakdown,
        })


class SalonAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        period = request.query_params.get('period', 'month')
        now = timezone.now()
        if period == 'week':
            start = now - timedelta(days=7)
        elif period == 'year':
            start = now - timedelta(days=365)
        else:
            start = now - timedelta(days=30)

        from bookings.models import BookingService as BS
        from inventory.models import SaleItem

        bookings_qs = Booking.objects.filter(salon=salon, created_at__gte=start)
        completed_qs = bookings_qs.filter(status='completed').prefetch_related('booking_services__salon_service')
        cancelled_count = bookings_qs.filter(status='cancelled').count()
        total_bookings = bookings_qs.count()
        completed_count = completed_qs.count()

        # Revenue from completed bookings
        total_revenue = 0.0
        day_revenue = defaultdict(float)
        for b in completed_qs:
            svc_total = sum(float(bs.salon_service.effective_price) for bs in b.booking_services.all())
            rev = max(0.0, svc_total - float(b.discount_amount))
            total_revenue += rev
            day_revenue[b.created_at.strftime('%Y-%m-%d')] += rev

        cancellation_rate = round(cancelled_count / total_bookings * 100, 1) if total_bookings > 0 else 0.0

        # Top services
        svc_counts = defaultdict(int)
        svc_revenue = defaultdict(float)
        for bs in BS.objects.filter(
            booking__salon=salon, booking__status='completed', booking__created_at__gte=start
        ).select_related('salon_service__service'):
            name = bs.salon_service.service.name
            svc_counts[name] += 1
            svc_revenue[name] += float(bs.salon_service.effective_price)

        top_services = sorted(
            [{'service_name': k, 'count': svc_counts[k], 'revenue': round(svc_revenue[k], 2)} for k in svc_counts],
            key=lambda x: x['count'], reverse=True
        )[:5]

        # Busiest slots by hour
        hour_counts = defaultdict(int)
        for b in bookings_qs.filter(status__in=['confirmed', 'completed']):
            hour_counts[b.requested_datetime.hour] += 1
        busiest_slots = sorted(
            [{'hour': h, 'count': c} for h, c in hour_counts.items()],
            key=lambda x: x['count'], reverse=True
        )[:5]

        revenue_by_day = [{'date': d, 'revenue': round(r, 2)} for d, r in sorted(day_revenue.items())]

        product_sales_revenue = float(
            SaleItem.objects.filter(sale__salon=salon, sale__created_at__gte=start)
            .aggregate(total=Sum(F('quantity') * F('unit_price')))['total'] or 0
        )

        return Response({
            'total_revenue': round(total_revenue, 2),
            'total_bookings': total_bookings,
            'completed_bookings': completed_count,
            'cancelled_bookings': cancelled_count,
            'cancellation_rate': cancellation_rate,
            'top_services': top_services,
            'busiest_slots': busiest_slots,
            'revenue_by_day': revenue_by_day,
            'product_sales_revenue': round(product_sales_revenue, 2),
        })


class SalonOffersView(APIView):
    """Public: list active current offers for a specific salon."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        salon  = get_object_or_404(Salon, pk=pk)
        today  = timezone.now().date()
        offers = Offer.objects.filter(salon=salon, is_active=True, start_date__lte=today, end_date__gte=today)
        return Response(OfferSerializer(offers, many=True).data)


class AllActiveOffersView(APIView):
    """Public: list all currently active offers across all active, non-suspended salons."""
    permission_classes = [AllowAny]

    def get(self, request):
        today  = timezone.now().date()
        offers = Offer.objects.filter(
            is_active=True, start_date__lte=today, end_date__gte=today,
            salon__status='active', salon__is_suspended=False,
        ).select_related('salon').order_by('-created_at')[:20]
        return Response(OfferSerializer(offers, many=True).data)


class OwnerOffersView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_salon(self, request):
        salon = Salon.objects.filter(owner=request.user).first()
        if not salon:
            return None
        return salon

    def get(self, request):
        salon = self._get_salon(request)
        if not salon:
            return Response({'detail': 'No salon found.'}, status=status.HTTP_404_NOT_FOUND)
        offers = Offer.objects.filter(salon=salon).order_by('-created_at')
        return Response(OfferSerializer(offers, many=True).data)

    def post(self, request):
        salon = self._get_salon(request)
        if not salon:
            return Response({'detail': 'No salon found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = OfferSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(salon=salon)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OwnerOfferDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_offer(self, request, pk):
        salon = Salon.objects.filter(owner=request.user).first()
        if not salon:
            return None, None
        return get_object_or_404(Offer, pk=pk, salon=salon), salon

    def patch(self, request, pk):
        offer, salon = self._get_offer(request, pk)
        if not offer:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = OfferSerializer(offer, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        offer, salon = self._get_offer(request, pk)
        if not offer:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        offer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AvailableSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk, status='active', is_suspended=False)
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
            is_taken = any(abs((t - aware).total_seconds()) < 60 for t in taken_datetimes)
            slots.append({'datetime': current.strftime('%Y-%m-%dT%H:%M'), 'available': not is_taken})
            current += timedelta(minutes=duration)

        return Response({'slots': slots})


class SalonImageListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        images = salon.images.all()
        return Response(SalonImageSerializer(images, many=True, context={'request': request}).data)

    def post(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        serializer = SalonImageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(salon=salon)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SalonImageDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, image_pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        image = get_object_or_404(SalonImage, pk=image_pk, salon=salon)
        serializer = SalonImageSerializer(image, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, image_pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        image = get_object_or_404(SalonImage, pk=image_pk, salon=salon)
        image.image.delete(save=False)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class QuickSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        import math
        from services.models import SalonService

        service_id = request.query_params.get('service_id')
        time_str   = request.query_params.get('time')       # HH:MM (24h)
        date_str   = request.query_params.get('date')       # YYYY-MM-DD
        user_lat   = request.query_params.get('lat')
        user_lng   = request.query_params.get('lng')
        radius_km  = request.query_params.get('radius', 10)
        gender     = request.query_params.get('gender', 'any')  # any / male / female

        salons = Salon.objects.filter(status='active', is_suspended=False)

        # — service filter —
        if service_id:
            salon_ids = SalonService.objects.filter(
                service_id=service_id, is_active=True
            ).values_list('salon_id', flat=True)
            salons = salons.filter(id__in=salon_ids)

        # — gender filter —
        if gender == 'male':
            salons = salons.filter(gender_focus__in=['male', 'unisex'])
        elif gender == 'female':
            salons = salons.filter(gender_focus__in=['female', 'unisex'])

        # — date + time availability filter —
        if date_str and time_str:
            try:
                from bookings.models import Booking as _Booking
                slot_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                day_name  = slot_date.strftime('%A').lower()
                req_h, req_m = int(time_str[:2]), int(time_str[3:5])
                req_minutes  = req_h * 60 + req_m
                taken_statuses = ['pending', 'confirmed', 'rescheduled', 'awaiting_client']
                available = []
                for salon in salons:
                    # blocked date check
                    try:
                        cal = salon.calendar
                    except SalonCalendar.DoesNotExist:
                        cal = SalonCalendar.objects.create(salon=salon)
                    if date_str in (cal.blocked_dates or []):
                        continue
                    # operating hours for that day
                    day_hours = salon.operating_hours.get(day_name, {})
                    open_str  = day_hours.get('open')
                    close_str = day_hours.get('close')
                    if not open_str or not close_str:
                        continue  # closed that day
                    open_m  = int(open_str[:2]) * 60 + int(open_str[3:5])
                    close_m = int(close_str[:2]) * 60 + int(close_str[3:5])
                    if req_minutes < open_m or req_minutes >= close_m:
                        continue  # requested time outside opening hours
                    # slot availability: at least one free slot from req_minutes onward
                    duration = cal.slot_duration_minutes or 30
                    taken_times = set(
                        _Booking.objects.filter(
                            salon=salon,
                            requested_datetime__date=slot_date,
                            status__in=taken_statuses,
                        ).values_list('requested_datetime', flat=True)
                    )
                    has_free = False
                    cur_m = req_minutes
                    while cur_m < close_m:
                        slot_dt = datetime.strptime(f"{date_str} {cur_m//60:02d}:{cur_m%60:02d}", '%Y-%m-%d %H:%M')
                        aware   = timezone.make_aware(slot_dt) if timezone.is_naive(slot_dt) else slot_dt
                        if not any(abs((t - aware).total_seconds()) < 60 for t in taken_times):
                            has_free = True
                            break
                        cur_m += duration
                    if has_free:
                        available.append(salon)
                salons = available
            except (ValueError, AttributeError):
                pass
        elif time_str:
            # time-only filter (legacy: uses today's day name)
            try:
                search_minutes = int(time_str[:2]) * 60 + int(time_str[3:5])
                day_name = datetime.now().strftime('%A').lower()
                filtered = []
                for salon in salons:
                    hours = salon.operating_hours.get(day_name, {})
                    if not hours.get('open') or not hours.get('close'):
                        filtered.append(salon)
                        continue
                    open_m  = int(hours['open'][:2])  * 60 + int(hours['open'][3:5])
                    close_m = int(hours['close'][:2]) * 60 + int(hours['close'][3:5])
                    if open_m <= search_minutes < close_m:
                        filtered.append(salon)
                salons = filtered
            except (ValueError, AttributeError):
                pass

        # — radius filter (Haversine) —
        distances = {}
        if user_lat and user_lng:
            try:
                import urllib.request, json as _json
                lat1 = math.radians(float(user_lat))
                lng1 = math.radians(float(user_lng))
                R    = 6371.0
                km   = min(float(radius_km), 50.0)
                nearby = []
                for salon in salons:
                    slat, slng = salon.latitude, salon.longitude
                    # Auto-geocode from address if coordinates not stored yet
                    if slat is None or slng is None:
                        addr_parts = [
                            salon.address_street, salon.address_city,
                            salon.address_district, salon.address_postal,
                        ]
                        addr = ', '.join(p for p in addr_parts if p)
                        try:
                            geo_url = (
                                'https://nominatim.openstreetmap.org/search'
                                f'?format=json&limit=1&q={urllib.parse.quote(addr)}'
                            )
                            req = urllib.request.Request(geo_url, headers={'User-Agent': 'SalonApp/1.0'})
                            with urllib.request.urlopen(req, timeout=4) as resp:
                                geo = _json.loads(resp.read())
                            if geo:
                                slat = float(geo[0]['lat'])
                                slng = float(geo[0]['lon'])
                                # Cache to DB so future requests skip geocoding
                                Salon.objects.filter(pk=salon.pk).update(latitude=slat, longitude=slng)
                        except Exception:
                            pass
                    if slat is None or slng is None:
                        continue
                    lat2 = math.radians(slat)
                    lng2 = math.radians(slng)
                    dlat = lat2 - lat1
                    dlng = lng2 - lng1
                    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlng/2)**2
                    dist = round(R * 2 * math.asin(math.sqrt(a)), 2)
                    if dist <= km:
                        distances[salon.id] = dist
                        nearby.append(salon)
                salons = sorted(nearby, key=lambda s: distances[s.id])
            except (ValueError, TypeError):
                pass

        # — serialise —
        if hasattr(salons, 'select_related'):
            salons = salons.select_related('calendar')
        data = SalonSerializer(salons, many=True, context={'request': request}).data
        if distances:
            for item in data:
                item['distance_km'] = distances.get(item['id'])
        return Response(data)


class AllServicesView(APIView):
    """Return all unique services (global + private) offered by active salons."""
    permission_classes = [AllowAny]

    def get(self, request):
        from services.models import Service, SalonService
        from services.serializers import ServiceSerializer
        service_ids = SalonService.objects.filter(
            is_active=True, salon__status='active', salon__is_suspended=False
        ).values_list('service_id', flat=True).distinct()
        services = Service.objects.filter(id__in=service_ids, is_active=True)
        return Response(ServiceSerializer(services, many=True).data)
