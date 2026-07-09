import urllib.parse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Avg, Sum, F
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta
from collections import defaultdict

from .models import Salon, SalonCalendar, SalonStaff, FavouriteSalon, Offer, SalonImage, CosmeticsGalleryImage
from .serializers import (
    SalonSerializer, SalonRegisterSerializer, SalonStaffSerializer,
    OfferSerializer, SalonImageSerializer, CosmeticsGalleryImageSerializer,
)
from users.permissions import IsSystemAdmin, IsSalonOwner
from bookings.models import Booking


class SalonRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Support multipart (when files are attached) — json_data carries all text fields
        import json as _json
        raw = request.data.get('json_data')
        data = _json.loads(raw) if raw else request.data

        serializer = SalonRegisterSerializer(data=data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        salon = serializer.save()

        # Attach uploaded logo / cover image if provided
        logo_file  = request.FILES.get('logo')
        cover_file = request.FILES.get('cover_image')
        if logo_file:
            salon.logo = logo_file
        if cover_file:
            salon.cover_image = cover_file
        if logo_file or cover_file:
            fields = ['logo'] * bool(logo_file) + ['cover_image'] * bool(cover_file)
            salon.save(update_fields=fields)

        # Optional: initial custom services from step 4
        from services.models import Service, SalonService
        for svc in data.get('initial_services', []):
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
        offer_data = data.get('initial_offer')
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

        # Create in-app notification for every admin about the new registration
        try:
            from users.models import CustomUser as _CU, Notification as _Notif
            _admins = list(_CU.objects.filter(role='system_admin'))
            for _admin in _admins:
                _Notif.objects.create(
                    recipient=_admin,
                    message=f'New salon registration: "{salon.name}" by {salon.owner.full_name or salon.owner.email} — awaiting approval.',
                    notif_type='new_salon_registration',
                )
        except Exception:
            pass

        # Notify admin notification email if configured and verified
        try:
            from payments.models import PlatformSettings
            ps = PlatformSettings.get()
            if ps.notification_email and ps.notification_email_verified:
                admin_panel_url = f"{settings.FRONTEND_URL}/admin/salons/{salon.pk}"
                send_mail(
                    subject=f'New salon registration: {salon.name}',
                    message='',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[ps.notification_email],
                    html_message=f'''
                        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:36px 28px;background:#fff;border-radius:14px;border:1px solid #e5e7eb;">
                          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                            <div style="width:40px;height:40px;background:linear-gradient(145deg,#0D9488,#14B8A8);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:900;">✦</div>
                            <div>
                              <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#111;">BookMyStyle</div>
                              <div style="font-size:11px;color:#0D9488;text-transform:uppercase;letter-spacing:.1em;">Admin Notification</div>
                            </div>
                          </div>
                          <h2 style="color:#D97706;margin:0 0 10px;font-family:Georgia,serif;">New Salon Registration</h2>
                          <p style="color:#4B5563;line-height:1.65;margin:0 0 20px;">
                            A new salon has just submitted a registration request and is awaiting your review.
                          </p>
                          <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
                            <tr style="border-bottom:1px solid #F3F4F6;">
                              <td style="padding:10px 0;color:#9CA3AF;font-size:13px;width:110px;">Salon Name</td>
                              <td style="padding:10px 0;font-weight:700;color:#111;font-size:13px;">{salon.name}</td>
                            </tr>
                            <tr style="border-bottom:1px solid #F3F4F6;">
                              <td style="padding:10px 0;color:#9CA3AF;font-size:13px;">Owner</td>
                              <td style="padding:10px 0;color:#111;font-size:13px;">{salon.owner.full_name or salon.owner.email}</td>
                            </tr>
                            <tr style="border-bottom:1px solid #F3F4F6;">
                              <td style="padding:10px 0;color:#9CA3AF;font-size:13px;">Contact</td>
                              <td style="padding:10px 0;color:#111;font-size:13px;">{salon.owner.email}</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;color:#9CA3AF;font-size:13px;">Registered</td>
                              <td style="padding:10px 0;color:#111;font-size:13px;">{salon.created_at.strftime("%d %b %Y, %H:%M")}</td>
                            </tr>
                          </table>
                          <a href="{admin_panel_url}"
                             style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#D97706,#F59E0B);color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
                            Review Salon →
                          </a>
                          <p style="color:#9CA3AF;font-size:12px;margin-top:24px;line-height:1.6;">
                            You are receiving this because you configured this address as the admin notification email.
                          </p>
                        </div>
                    ''',
                    fail_silently=True,
                )
        except Exception:
            pass

        # Acknowledgement email to the salon owner
        try:
            from utils.email import send_bms_email
            owner = salon.owner
            name = owner.full_name or 'there'
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            send_bms_email(
                subject=f'We received your application for "{salon.name}" — BookMyStyle',
                to_email=owner.email,
                heading='Application Received',
                preheader='We have received your salon registration. Our team will review it shortly.',
                body_html=f'''
                  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif">
                    Hi {name}, thank you for registering <strong>{salon.name}</strong> on BookMyStyle.
                    Our team will review your application and get back to you within 1–3 business days.
                  </p>
                  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0;font-family:Arial,Helvetica,sans-serif">
                    You will receive an email once your salon is approved or if we need further information.
                  </p>''',
                cta_url=f'{frontend_url}/owner/dashboard',
                cta_label='Go to Owner Dashboard',
                plain_text=f'Hi {name},\n\nThank you for registering {salon.name}. We will review your application and respond within 1-3 business days.\n\nBookMyStyle Team',
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).error('Salon registration ack email failed: %s', e)

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

        owner_email = getattr(salon.owner, 'email', None)
        if owner_email:
            send_mail(
                subject=f'Your salon "{salon.name}" has been approved — BookMyStyle',
                message='',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[owner_email],
                html_message=f'''
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
                      <div style="background:linear-gradient(135deg,#0D9488,#14B8A8);padding:32px;text-align:center;">
                        <div style="font-size:22px;color:#fff;font-weight:900;letter-spacing:-0.02em;">✦ BookMyStyle</div>
                        <div style="color:rgba(255,255,255,.8);font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-top:6px;">Salon Approved</div>
                      </div>
                      <div style="padding:36px;">
                        <h2 style="color:#0D9488;margin:0 0 14px;font-size:22px;font-family:Georgia,serif;">Congratulations — You're Live!</h2>
                        <p style="color:#374151;line-height:1.7;margin:0 0 16px;">
                          Your salon <strong>{salon.name}</strong> has been reviewed and <strong style="color:#0D9488;">approved</strong> by our team.
                          Your profile is now publicly visible and customers can start booking appointments.
                        </p>
                        <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:10px;padding:18px 22px;margin:20px 0;">
                          <p style="margin:0 0 10px;font-weight:700;color:#166534;font-size:14px;">Next steps:</p>
                          <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.8;">
                            <li>Log in to your Owner Dashboard to complete your profile</li>
                            <li>Add your services, pricing &amp; availability</li>
                            <li>Upload photos of your salon</li>
                            <li>Set up your team members</li>
                          </ul>
                        </div>
                        <div style="text-align:center;margin-top:28px;">
                          <a href="{settings.FRONTEND_URL}/owner/login"
                             style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#0D9488,#14B8A8);color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.01em;">
                            Go to Owner Dashboard →
                          </a>
                        </div>
                      </div>
                      <div style="background:#F9FAFB;padding:14px 32px;text-align:center;border-top:1px solid #F3F4F6;">
                        <p style="margin:0;font-size:11px;color:#9CA3AF;">© 2026 BookMyStyle · Beauty &amp; Wellness Platform</p>
                      </div>
                    </div>
                ''',
                fail_silently=True,
            )

        return Response(SalonSerializer(salon).data)


class SalonRejectView(APIView):
    permission_classes = [IsSystemAdmin]

    def post(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        salon.status = 'inactive'
        salon.save()

        owner_email = getattr(salon.owner, 'email', None)
        if owner_email:
            send_mail(
                subject=f'Update on your salon registration — BookMyStyle',
                message='',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[owner_email],
                html_message=f'''
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
                      <div style="background:linear-gradient(135deg,#4B5563,#6B7280);padding:32px;text-align:center;">
                        <div style="font-size:22px;color:#fff;font-weight:900;letter-spacing:-0.02em;">✦ BookMyStyle</div>
                        <div style="color:rgba(255,255,255,.8);font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-top:6px;">Registration Update</div>
                      </div>
                      <div style="padding:36px;">
                        <h2 style="color:#374151;margin:0 0 14px;font-size:22px;font-family:Georgia,serif;">Registration Not Approved</h2>
                        <p style="color:#374151;line-height:1.7;margin:0 0 16px;">
                          Thank you for registering <strong>{salon.name}</strong> on BookMyStyle.
                          After reviewing your application, we were unable to approve your salon at this time.
                        </p>
                        <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:10px;padding:18px 22px;margin:20px 0;">
                          <p style="margin:0;color:#7F1D1D;font-size:14px;line-height:1.7;">
                            If you believe this is an error or would like more information, please contact our support team.
                            You are welcome to re-register once the issue is resolved.
                          </p>
                        </div>
                        <p style="color:#6B7280;font-size:13px;line-height:1.65;margin-top:20px;">
                          We appreciate your interest in BookMyStyle and hope to work with you in the future.
                        </p>
                      </div>
                      <div style="background:#F9FAFB;padding:14px 32px;text-align:center;border-top:1px solid #F3F4F6;">
                        <p style="margin:0;font-size:11px;color:#9CA3AF;">© 2026 BookMyStyle · Beauty &amp; Wellness Platform</p>
                      </div>
                    </div>
                ''',
                fail_silently=True,
            )

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

        owner_email = getattr(salon.owner, 'email', None)
        if owner_email:
            send_mail(
                subject=f'Your salon "{salon.name}" has been reactivated — BookMyStyle',
                message='',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[owner_email],
                html_message=f'''
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
                      <div style="background:linear-gradient(135deg,#0D9488,#14B8A8);padding:32px;text-align:center;">
                        <div style="font-size:22px;color:#fff;font-weight:900;letter-spacing:-0.02em;">✦ BookMyStyle</div>
                        <div style="color:rgba(255,255,255,.8);font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-top:6px;">Salon Reactivated</div>
                      </div>
                      <div style="padding:36px;">
                        <h2 style="color:#0D9488;margin:0 0 14px;font-size:22px;font-family:Georgia,serif;">Your Salon is Active Again</h2>
                        <p style="color:#374151;line-height:1.7;margin:0 0 16px;">
                          Great news! Your salon <strong>{salon.name}</strong> has been <strong style="color:#0D9488;">reactivated</strong>
                          by the platform administrator. Your salon is now visible to customers and can accept new bookings.
                        </p>
                        <div style="text-align:center;margin-top:28px;">
                          <a href="{settings.FRONTEND_URL}/owner/dashboard"
                             style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#0D9488,#14B8A8);color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                            Go to Owner Dashboard →
                          </a>
                        </div>
                      </div>
                      <div style="background:#F9FAFB;padding:14px 32px;text-align:center;border-top:1px solid #F3F4F6;">
                        <p style="margin:0;font-size:11px;color:#9CA3AF;">© 2026 BookMyStyle · Beauty &amp; Wellness Platform</p>
                      </div>
                    </div>
                ''',
                fail_silently=True,
            )

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
        # Email owner before deleting
        try:
            from utils.email import send_bms_email
            owner = salon.owner
            name = owner.full_name or 'there'
            send_bms_email(
                subject=f'Your salon "{salon.name}" has been removed from BookMyStyle',
                to_email=owner.email,
                heading='Salon Removed',
                preheader=f'Your salon {salon.name} has been permanently removed from BookMyStyle.',
                body_html=f'''
                  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif">
                    Hi {name}, your salon <strong>{salon.name}</strong> has been permanently removed from the BookMyStyle platform by our admin team.
                  </p>
                  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0;font-family:Arial,Helvetica,sans-serif">
                    If you believe this is a mistake, please contact us at
                    <a href="mailto:support@bookmystyle.lk" style="color:#0D9488">support@bookmystyle.lk</a>.
                  </p>''',
                plain_text=f'Hi {name},\n\nYour salon "{salon.name}" has been permanently removed from BookMyStyle. Contact support@bookmystyle.lk with any questions.\n\nBookMyStyle Team',
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).error('Salon removal email failed: %s', e)
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

        owner_email = getattr(salon.owner, 'email', None)
        if owner_email:
            if salon.is_suspended:
                send_mail(
                    subject=f'Your salon "{salon.name}" has been temporarily suspended',
                    message='',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[owner_email],
                    html_message=f'''
                        <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px 24px;background:#fff;border-radius:12px;">
                          <h2 style="color:#DC2626;margin:0 0 12px;">Salon Suspended</h2>
                          <p style="color:#374151;line-height:1.6;">
                            Your salon <strong>{salon.name}</strong> has been <strong>temporarily suspended</strong>
                            by the platform administrator.
                          </p>
                          <p style="color:#374151;line-height:1.6;">
                            While suspended, your salon will not appear in search results and customers will
                            not be able to make new bookings. Existing bookings are unaffected.
                          </p>
                          <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:16px 20px;margin:20px 0;">
                            <strong style="color:#DC2626;">What to do next:</strong>
                            <p style="color:#374151;margin:8px 0 0;line-height:1.6;">
                              Log in to your owner portal at <a href="https://saloon-frontend-67z0.onrender.com/owner/login" style="color:#0D9488;">BookMyStyle Owner Portal</a>
                              and submit a re-enable request explaining your situation. The admin will review and
                              reinstate your salon as soon as possible.
                            </p>
                          </div>
                          <p style="color:#6B7280;font-size:13px;margin-top:24px;">
                            If you believe this was done in error, please contact support.
                          </p>
                        </div>
                    ''',
                    fail_silently=True,
                )
            else:
                send_mail(
                    subject=f'Your salon "{salon.name}" has been reinstated',
                    message='',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[owner_email],
                    html_message=f'''
                        <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px 24px;background:#fff;border-radius:12px;">
                          <h2 style="color:#0D9488;margin:0 0 12px;">Salon Reinstated</h2>
                          <p style="color:#374151;line-height:1.6;">
                            Great news! Your salon <strong>{salon.name}</strong> has been <strong>reinstated</strong>
                            by the platform administrator.
                          </p>
                          <p style="color:#374151;line-height:1.6;">
                            Your salon is now visible to customers again and can accept new bookings.
                          </p>
                          <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;padding:16px 20px;margin:20px 0;">
                            <a href="https://saloon-frontend-67z0.onrender.com/owner/dashboard"
                               style="color:#0D9488;font-weight:700;text-decoration:none;">
                              → Go to your Owner Dashboard
                            </a>
                          </div>
                        </div>
                    ''',
                    fail_silently=True,
                )

        return Response(SalonSerializer(salon).data)


class OwnerRequestReactivationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        salon = get_object_or_404(Salon, owner=request.user)
        if not salon.is_suspended:
            return Response({'detail': 'Your salon is not currently suspended.'}, status=status.HTTP_400_BAD_REQUEST)
        reason = request.data.get('reason', '').strip()

        from users.models import CustomUser, Notification
        admins = list(CustomUser.objects.filter(role='system_admin'))
        admin_emails = [a.email for a in admins] or [settings.DEFAULT_FROM_EMAIL]

        owner_name = salon.owner.full_name or salon.owner.email
        notif_msg = (
            f'Re-enable request from "{salon.name}" (owner: {owner_name})'
            + (f': "{reason}"' if reason else '')
        )

        # Create in-app notification for every admin
        for admin in admins:
            Notification.objects.create(
                recipient=admin,
                message=notif_msg,
                notif_type='reactivation_request',
            )

        send_mail(
            subject=f'Re-enable Request: {salon.name} — BookMyStyle',
            message=f'{notif_msg}\n\nReview at {settings.FRONTEND_URL}/admin/salons/{salon.pk}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=admin_emails,
            html_message=f'''
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
                  <div style="background:linear-gradient(135deg,#D97706,#F59E0B);padding:32px;text-align:center;">
                    <div style="font-size:22px;color:#fff;font-weight:900;letter-spacing:-0.02em">✦ BookMyStyle</div>
                    <div style="color:rgba(255,255,255,.8);font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-top:6px">Admin Notification</div>
                  </div>
                  <div style="padding:32px;">
                    <h2 style="color:#92400E;margin:0 0 12px;font-size:20px;">Salon Re-enable Request</h2>
                    <p style="color:#374151;line-height:1.6;">
                      The owner of <strong>{salon.name}</strong> has submitted a request to reinstate their suspended salon.
                    </p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
                      <tr style="background:#F9FAFB;"><td style="padding:10px 14px;color:#6B7280;font-size:13px;width:110px;">Salon</td>
                          <td style="padding:10px 14px;font-weight:600;color:#111;">{salon.name} (#{salon.pk})</td></tr>
                      <tr><td style="padding:10px 14px;color:#6B7280;font-size:13px;">Owner</td>
                          <td style="padding:10px 14px;font-weight:600;color:#111;">{owner_name}</td></tr>
                      <tr style="background:#F9FAFB;"><td style="padding:10px 14px;color:#6B7280;font-size:13px;">Email</td>
                          <td style="padding:10px 14px;color:#111;">{salon.owner.email}</td></tr>
                    </table>
                    {f'<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:14px 18px;margin:16px 0;"><p style="color:#92400E;font-weight:700;margin:0 0 6px;">Owner\'s message:</p><p style="color:#374151;margin:0;line-height:1.6;">{reason}</p></div>' if reason else '<p style="color:#9CA3AF;font-size:13px;">No message provided.</p>'}
                    <div style="text-align:center;margin-top:24px;">
                      <a href="{settings.FRONTEND_URL}/admin/salons/{salon.pk}"
                         style="display:inline-block;padding:13px 32px;background:#0D9488;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                        Review in Admin Panel
                      </a>
                    </div>
                  </div>
                  <div style="background:#F9FAFB;padding:14px 32px;text-align:center;border-top:1px solid #F3F4F6;">
                    <p style="margin:0;font-size:11px;color:#9CA3AF;">© 2026 BookMyStyle · Beauty &amp; Wellness Platform</p>
                  </div>
                </div>
            ''',
            fail_silently=True,
        )
        return Response({'detail': 'Your re-enable request has been submitted. The admin will review it shortly.'})


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

    def patch(self, request):
        if request.user.role != 'salon_owner':
            return Response({'detail': 'Not a salon owner'}, status=status.HTTP_403_FORBIDDEN)
        salon = Salon.objects.filter(owner=request.user).first()
        if not salon:
            return Response({'detail': 'No salon registered'}, status=status.HTTP_404_NOT_FOUND)
        allowed = {
            'name', 'contact_number', 'email',
            'address_street', 'address_city', 'address_district', 'address_postal',
            'operating_hours', 'home_visit_enabled', 'gender_focus', 'facilities',
        }
        data = {k: v for k, v in request.data.items() if k in allowed}
        serializer = SalonSerializer(salon, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(SalonSerializer(salon, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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


class SalonCoverView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        cover_file = request.FILES.get('cover_image')
        if not cover_file:
            return Response({'detail': 'No cover image provided'}, status=status.HTTP_400_BAD_REQUEST)
        if salon.cover_image:
            salon.cover_image.delete(save=False)
        salon.cover_image = cover_file
        salon.save()
        return Response(SalonSerializer(salon, context={'request': request}).data)

    def delete(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if salon.cover_image:
            salon.cover_image.delete(save=False)
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
        from staff.models import StaffMember as SM
        from staff.serializers import StaffMemberPublicSerializer
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
        all_staff = SM.objects.filter(salon=salon, is_active=True)
        available = [m for m in all_staff if day_name in (m.working_days or [])]
        return Response(StaffMemberPublicSerializer(available, many=True, context={'request': request}).data)


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

    def get_permissions(self):
        return [AllowAny()] if self.request.method == 'GET' else [IsAuthenticated()]

    def get(self, request, pk):
        from bookings.models import Review
        from bookings.serializers import ReviewSerializer
        salon = get_object_or_404(Salon, pk=pk)
        reviews = Review.objects.filter(salon=salon).select_related('client').order_by('-created_at')[:20]
        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request, pk):
        from bookings.models import Booking, Review
        from bookings.serializers import ReviewSerializer
        if request.user.role != 'client':
            return Response({'detail': 'Only clients can submit reviews.'}, status=status.HTTP_403_FORBIDDEN)
        salon = get_object_or_404(Salon, pk=pk)
        booking = (
            Booking.objects.filter(salon=salon, client=request.user, status='completed')
            .exclude(review__isnull=False)
            .order_by('-requested_datetime')
            .first()
        )
        if not booking:
            return Response({'detail': 'You need a completed appointment at this salon before leaving a review.'}, status=status.HTTP_400_BAD_REQUEST)
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')
        try:
            rating = int(rating)
            if not 1 <= rating <= 5:
                raise ValueError
        except (TypeError, ValueError):
            return Response({'detail': 'Rating must be a number between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)
        review = Review.objects.create(
            booking=booking, client=request.user, salon=salon,
            rating=rating, comment=comment,
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


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
        from staff.models import StaffMember
        salon = get_object_or_404(Salon, pk=pk, status='active', is_suspended=False)
        date_str  = request.query_params.get('date')
        staff_id  = request.query_params.get('staff_id')
        new_duration = int(request.query_params.get('duration', 0))

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

        slot_dur = calendar.slot_duration_minutes
        if new_duration <= 0:
            new_duration = slot_dur

        day_name   = slot_date.strftime('%A').lower()
        hours      = salon.operating_hours.get(day_name, {})
        open_time  = hours.get('open', '09:00')
        close_time = hours.get('close', '17:00')

        open_dt  = datetime.strptime(f"{date_str} {open_time}", '%Y-%m-%d %H:%M')
        close_dt = datetime.strptime(f"{date_str} {close_time}", '%Y-%m-%d %H:%M')

        taken_statuses = ['pending', 'confirmed', 'rescheduled', 'awaiting_client']

        if staff_id:
            # Duration-aware blocking for a specific professional
            staff_bookings = (
                Booking.objects.filter(
                    staff_member_id=staff_id,
                    requested_datetime__date=slot_date,
                    status__in=taken_statuses,
                ).prefetch_related('booking_services__salon_service')
            )
            booking_intervals = []
            for b in staff_bookings:
                b_start = b.requested_datetime
                b_dur = sum(
                    bs.salon_service.effective_duration
                    for bs in b.booking_services.all()
                ) or slot_dur
                booking_intervals.append((b_start, b_dur))

            slots = []
            current = open_dt
            while current < close_dt:
                aware = timezone.make_aware(current) if timezone.is_naive(current) else current
                # Block if the service duration would extend past closing time.
                if current + timedelta(minutes=new_duration) > close_dt:
                    slots.append({'datetime': current.strftime('%Y-%m-%dT%H:%M'), 'available': False})
                    current += timedelta(minutes=slot_dur)
                    continue
                is_taken = False
                for (b_start, b_dur) in booking_intervals:
                    b_end = b_start + timedelta(minutes=b_dur)
                    # Block slots from booking start through its end (inclusive),
                    # so the slot at the exact finish time is also unavailable.
                    if b_start <= aware <= b_end:
                        is_taken = True
                        break
                slots.append({'datetime': current.strftime('%Y-%m-%dT%H:%M'), 'available': not is_taken})
                current += timedelta(minutes=slot_dur)
        else:
            # General "Any Available" — a slot is free if at least one active staff member
            # has no conflicting booking for the full new_duration window.
            # Falls back to single-capacity logic if the salon has no staff configured.
            active_staff = list(
                StaffMember.objects.filter(salon=salon, is_active=True)
            )

            if not active_staff:
                # No staff configured — treat salon as single-capacity.
                salon_bookings = (
                    Booking.objects.filter(
                        salon=salon,
                        requested_datetime__date=slot_date,
                        status__in=taken_statuses,
                    ).prefetch_related('booking_services__salon_service')
                )
                booking_intervals = []
                for b in salon_bookings:
                    b_start = b.requested_datetime
                    b_dur = sum(
                        bs.salon_service.effective_duration
                        for bs in b.booking_services.all()
                    ) or slot_dur
                    booking_intervals.append((b_start, b_dur))

                slots = []
                current = open_dt
                while current < close_dt:
                    aware = timezone.make_aware(current) if timezone.is_naive(current) else current
                    if current + timedelta(minutes=new_duration) > close_dt:
                        slots.append({'datetime': current.strftime('%Y-%m-%dT%H:%M'), 'available': False})
                        current += timedelta(minutes=slot_dur)
                        continue
                    is_taken = any(
                        b_start <= aware <= b_start + timedelta(minutes=b_dur)
                        for (b_start, b_dur) in booking_intervals
                    )
                    slots.append({'datetime': current.strftime('%Y-%m-%dT%H:%M'), 'available': not is_taken})
                    current += timedelta(minutes=slot_dur)
            else:
                # Build per-staff booking intervals for this date (assigned bookings).
                assigned_bookings = (
                    Booking.objects.filter(
                        salon=salon,
                        staff_member__in=active_staff,
                        requested_datetime__date=slot_date,
                        status__in=taken_statuses,
                    ).prefetch_related('booking_services__salon_service')
                )
                staff_intervals = defaultdict(list)
                for b in assigned_bookings:
                    b_start = b.requested_datetime
                    b_dur = sum(
                        bs.salon_service.effective_duration
                        for bs in b.booking_services.all()
                    ) or slot_dur
                    staff_intervals[b.staff_member_id].append((b_start, b_dur))

                # Also collect unassigned bookings — each one consumes one staff capacity unit.
                unassigned_bookings = (
                    Booking.objects.filter(
                        salon=salon,
                        staff_member__isnull=True,
                        requested_datetime__date=slot_date,
                        status__in=taken_statuses,
                    ).prefetch_related('booking_services__salon_service')
                )
                unassigned_intervals = []
                for b in unassigned_bookings:
                    b_start = b.requested_datetime
                    b_dur = sum(
                        bs.salon_service.effective_duration
                        for bs in b.booking_services.all()
                    ) or slot_dur
                    unassigned_intervals.append((b_start, b_dur))

                total_capacity = len(active_staff)
                slots = []
                current = open_dt
                while current < close_dt:
                    aware = timezone.make_aware(current) if timezone.is_naive(current) else current
                    if current + timedelta(minutes=new_duration) > close_dt:
                        slots.append({'datetime': current.strftime('%Y-%m-%dT%H:%M'), 'available': False})
                        current += timedelta(minutes=slot_dur)
                        continue
                    # Count how many assigned staff are busy at this slot.
                    busy_count = sum(
                        1 for sm in active_staff
                        if any(
                            b_start <= aware <= b_start + timedelta(minutes=b_dur)
                            for (b_start, b_dur) in staff_intervals.get(sm.id, [])
                        )
                    )
                    # Count unassigned bookings covering this slot (each consumes one capacity unit).
                    unassigned_count = sum(
                        1 for (b_start, b_dur) in unassigned_intervals
                        if b_start <= aware <= b_start + timedelta(minutes=b_dur)
                    )
                    any_free = (busy_count + unassigned_count) < total_capacity
                    slots.append({'datetime': current.strftime('%Y-%m-%dT%H:%M'), 'available': any_free})
                    current += timedelta(minutes=slot_dur)

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
        # Salons WITH coordinates that fall within the radius are sorted by distance.
        # Salons WITHOUT coordinates are appended at the end (location unknown).
        distances = {}
        if user_lat and user_lng:
            try:
                lat1 = math.radians(float(user_lat))
                lng1 = math.radians(float(user_lng))
                R    = 6371.0
                km   = min(float(radius_km), 50.0)
                within_radius = []
                no_coords     = []
                for salon in salons:
                    slat, slng = salon.latitude, salon.longitude
                    if slat is None or slng is None:
                        no_coords.append(salon)
                        continue
                    lat2 = math.radians(slat)
                    lng2 = math.radians(slng)
                    dlat = lat2 - lat1
                    dlng = lng2 - lng1
                    a    = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlng/2)**2
                    dist = round(R * 2 * math.asin(math.sqrt(a)), 2)
                    if dist <= km:
                        distances[salon.id] = dist
                        within_radius.append(salon)
                # closest first, then salons whose location is not set
                salons = sorted(within_radius, key=lambda s: distances[s.id]) + no_coords
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


class AdminSalonDetailView(APIView):
    """
    GET /api/admin/salons/<pk>/detail/
    Comprehensive salon detail for the admin dashboard.
    """
    permission_classes = [IsSystemAdmin]

    def get(self, request, pk):
        from subscriptions.models import Subscription, PLANS
        from services.models import SalonService
        from staff.models import StaffMember
        from bookings.models import Booking, BookingService as BS
        from inventory.models import Product, SaleItem
        from payments.models import Payment

        salon = get_object_or_404(Salon, pk=pk)
        owner = salon.owner

        # ── Subscription ──────────────────────────────────────────────────────
        try:
            sub = salon.subscription
            plan_meta = PLANS.get(sub.plan, {})
            subscription_data = {
                'plan':            sub.plan,
                'plan_name':       plan_meta.get('name', sub.plan),
                'plan_color':      plan_meta.get('color', ''),
                'status':          sub.status,
                'is_active':       sub.is_active,
                'expires_at':      sub.expires_at,
                'days_remaining':  sub.days_remaining,
                'amount_paid':     float(sub.amount_paid),
                'transaction_ref': sub.transaction_ref,
                'billing_name':    sub.billing_name,
                'billing_email':   sub.billing_email,
            }
        except Subscription.DoesNotExist:
            subscription_data = None

        # ── Services ──────────────────────────────────────────────────────────
        salon_services_qs = SalonService.objects.filter(salon=salon).select_related('service')
        services_list = [
            {
                'id':       ss.id,
                'name':     ss.service.name,
                'category': ss.service.category,
                'price':    float(ss.effective_price),
                'duration': ss.effective_duration,
                'is_active': ss.is_active,
            }
            for ss in salon_services_qs
        ]

        # ── Staff ─────────────────────────────────────────────────────────────
        staff_qs = StaffMember.objects.filter(salon=salon)
        staff_list = [
            {'id': sm.id, 'name': sm.full_name, 'role': sm.role}
            for sm in staff_qs
        ]

        # ── Cosmetics ─────────────────────────────────────────────────────────
        product_count = Product.objects.filter(salon=salon).count()
        cosmetics_revenue = float(
            SaleItem.objects.filter(sale__salon=salon)
            .aggregate(total=Sum(F('quantity') * F('unit_price')))['total'] or 0
        )
        cosmetics_data = {
            'enabled':             salon.cosmetics_enabled,
            'product_count':       product_count,
            'total_sales_revenue': round(cosmetics_revenue, 2),
        }

        # ── Bookings ──────────────────────────────────────────────────────────
        bookings_qs = Booking.objects.filter(salon=salon)
        total_bookings     = bookings_qs.count()
        completed_bookings = bookings_qs.filter(status='completed')
        pending_bookings   = bookings_qs.filter(status='pending').count()
        cancelled_bookings = bookings_qs.filter(status='cancelled').count()

        # Revenue from completed bookings (sum of service prices minus discounts)
        booking_revenue = 0.0
        for b in completed_bookings.prefetch_related('booking_services__salon_service'):
            svc_total = sum(float(bs.salon_service.effective_price) for bs in b.booking_services.all())
            booking_revenue += max(0.0, svc_total - float(b.discount_amount))

        bookings_data = {
            'total':     total_bookings,
            'completed': completed_bookings.count(),
            'pending':   pending_bookings,
            'cancelled': cancelled_bookings,
            'revenue':   round(booking_revenue, 2),
        }

        # ── Payments ──────────────────────────────────────────────────────────
        payments_qs = Payment.objects.filter(salon=salon).order_by('-created_at')[:20]
        payments_list = [
            {
                'order_id':   p.order_id,
                'type':       p.payment_type,
                'amount':     float(p.amount),
                'status':     p.status,
                'plan':       p.plan,
                'created_at': p.created_at,
            }
            for p in payments_qs
        ]

        return Response({
            'id':                  salon.id,
            'name':                salon.name,
            'status':              salon.status,
            'is_suspended':        salon.is_suspended,
            'owner_email':         owner.email,
            'owner_name':          getattr(owner, 'full_name', '') or '',
            'contact_number':      salon.contact_number,
            'email':               salon.email,
            'address_street':      salon.address_street,
            'address_city':        salon.address_city,
            'address_district':    salon.address_district,
            'address_postal':      salon.address_postal,
            'business_reg_number': salon.business_reg_number,
            'created_at':          salon.created_at,
            'gender_focus':        salon.gender_focus,
            'home_visit_enabled':  salon.home_visit_enabled,
            'cosmetics_enabled':   salon.cosmetics_enabled,
            'facilities':          salon.facilities,
            'subscription':        subscription_data,
            'services':            services_list,
            'services_count':      len(services_list),
            'staff':               staff_list,
            'staff_count':         len(staff_list),
            'cosmetics':           cosmetics_data,
            'bookings':            bookings_data,
            'payments':            payments_list,
        })

    def delete(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        salon_name = salon.name
        salon.delete()
        return Response({'detail': f'Salon "{salon_name}" has been permanently deleted.'}, status=status.HTTP_200_OK)


class CosmeticsGalleryListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        images = salon.cosmetics_gallery.all()
        return Response(CosmeticsGalleryImageSerializer(images, many=True, context={'request': request}).data)

    def post(self, request, pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CosmeticsGalleryImageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(salon=salon)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CosmeticsGalleryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, image_pk):
        salon = get_object_or_404(Salon, pk=pk)
        if request.user.role != 'salon_owner' or salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        image = get_object_or_404(CosmeticsGalleryImage, pk=image_pk, salon=salon)
        image.image.delete(save=False)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
