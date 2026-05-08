from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Avg, Sum, F
from datetime import datetime, timedelta
from collections import defaultdict

from .models import Salon, SalonCalendar, SalonStaff, FavouriteSalon
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
        salons = Salon.objects.filter(favourited_by__client=request.user, status='active')
        return Response(SalonSerializer(salons, many=True).data)


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
            is_taken = any(abs((t - aware).total_seconds()) < 60 for t in taken_datetimes)
            slots.append({'datetime': current.strftime('%Y-%m-%dT%H:%M'), 'available': not is_taken})
            current += timedelta(minutes=duration)

        return Response({'slots': slots})
