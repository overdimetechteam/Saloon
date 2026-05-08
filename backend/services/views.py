from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Service, SalonService
from salons.models import Salon
from .serializers import ServiceSerializer, SalonServiceSerializer, SalonServiceCreateSerializer, SalonServiceUpdateSerializer
from users.permissions import IsSystemAdmin, IsSalonOwner


class ServiceListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsSystemAdmin()]

    def get(self, request):
        services = Service.objects.filter(is_active=True, is_private=False)
        return Response(ServiceSerializer(services, many=True).data)

    def post(self, request):
        serializer = ServiceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ServiceDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsSystemAdmin()]

    def get(self, request, pk):
        service = get_object_or_404(Service, pk=pk)
        return Response(ServiceSerializer(service).data)

    def put(self, request, pk):
        service = get_object_or_404(Service, pk=pk)
        serializer = ServiceSerializer(service, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        service = get_object_or_404(Service, pk=pk)
        serializer = ServiceSerializer(service, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        service = get_object_or_404(Service, pk=pk)
        service.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SalonServiceListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def _get_salon(self, pk):
        return get_object_or_404(Salon, pk=pk)

    def get(self, request, salon_pk):
        salon = self._get_salon(salon_pk)
        qs = SalonService.objects.filter(salon=salon, is_active=True).select_related('service')
        return Response(SalonServiceSerializer(qs, many=True).data)

    def post(self, request, salon_pk):
        salon = self._get_salon(salon_pk)
        if request.user.role == 'salon_owner' and salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        serializer = SalonServiceCreateSerializer(data=request.data)
        if serializer.is_valid():
            ss = serializer.save(salon=salon)
            return Response(SalonServiceSerializer(ss).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SalonServiceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, salon_pk, pk):
        salon = get_object_or_404(Salon, pk=salon_pk)
        if request.user.role == 'salon_owner' and salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        ss = get_object_or_404(SalonService, pk=pk, salon=salon)
        serializer = SalonServiceUpdateSerializer(ss, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(SalonServiceSerializer(ss).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, salon_pk, pk):
        salon = get_object_or_404(Salon, pk=salon_pk)
        if request.user.role == 'salon_owner' and salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        ss = get_object_or_404(SalonService, pk=pk, salon=salon)
        if ss.service.is_private and ss.service.owner_salon_id == salon.id:
            ss.service.delete()
        else:
            ss.is_active = False
            ss.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OwnerCustomServiceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, salon_pk):
        salon = get_object_or_404(Salon, pk=salon_pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        name = request.data.get('name', '').strip()
        category = request.data.get('category', '')
        price = request.data.get('price')
        duration = request.data.get('duration')
        if not name or not category or price is None or duration is None:
            return Response({'detail': 'name, category, price and duration are required.'}, status=status.HTTP_400_BAD_REQUEST)
        service = Service.objects.create(
            name=name,
            category=category,
            default_price=price,
            default_duration_minutes=duration,
            is_private=True,
            owner_salon=salon,
        )
        ss = SalonService.objects.create(salon=salon, service=service)
        return Response(SalonServiceSerializer(ss).data, status=status.HTTP_201_CREATED)
