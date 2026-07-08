from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from urllib.parse import quote
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


# ── Booking confirmation email ─────────────────────────────────────────────────

def _send_booking_confirmation_email(booking):
    client   = booking.client
    salon    = booking.salon
    dt       = booking.requested_datetime
    date_str = dt.strftime('%A, %B %d, %Y')
    time_str = dt.strftime('%I:%M %p')

    services = list(booking.booking_services.select_related('salon_service__service').all())
    subtotal = sum(float(bs.salon_service.effective_price) for bs in services)
    discount = float(booking.discount_amount)
    total    = subtotal - discount

    # Service rows — white text for dark email
    svc_rows = ''.join(
        f'<div style="color:#e2e8f0;font-size:13px;margin:3px 0;text-align:right">&#8226; {bs.salon_service.service.name}</div>'
        for bs in services
    )

    appt_type = 'Home Visit' if booking.home_visit else ('Walk-In' if booking.is_walk_in else 'In-Salon')

    if booking.home_visit:
        type_bg, type_color = 'rgba(251,146,60,0.15)', '#fb923c'
    elif booking.is_walk_in:
        type_bg, type_color = 'rgba(139,92,246,0.15)', '#a78bfa'
    else:
        type_bg, type_color = 'rgba(20,184,166,0.15)', '#14B8A8'

    staff_row = (
        f'<tr><td style="padding:10px 0;color:rgba(255,255,255,0.45);font-size:13px;border-bottom:1px solid #1e3a36">Stylist</td>'
        f'<td style="padding:10px 0;color:#e2e8f0;font-size:13px;font-weight:700;text-align:right;border-bottom:1px solid #1e3a36">{booking.staff_member.full_name}</td></tr>'
    ) if booking.staff_member else ''

    discount_row = (
        f'<tr><td style="padding:6px 0;color:#14B8A8;font-size:13px">Discount ({booking.promo_code.code})</td>'
        f'<td style="padding:6px 0;color:#14B8A8;font-size:13px;font-weight:700;text-align:right">&#8722; LKR {discount:,.0f}</td></tr>'
    ) if discount > 0 else ''

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    backend_url  = getattr(settings, 'BACKEND_URL',  'http://localhost:8000')
    booking_url  = f"{frontend_url}/user/bookings/{booking.pk}"

    # Salon logo for email — absolute URL or fallback initial letter
    if salon.logo:
        salon_logo_html = (
            f'<img src="{backend_url}{salon.logo.url}" alt="{salon.name}" '
            f'width="62" height="62" style="width:62px;height:62px;border-radius:50%;object-fit:cover;display:block;border:2px solid rgba(20,184,166,0.4)">'
        )
    else:
        initial = (salon.name or 'S')[0].upper()
        salon_logo_html = (
            f'<div style="width:62px;height:62px;background:linear-gradient(135deg,#0D9488,#14B8A8);'
            f'border-radius:50%;margin:0 auto;text-align:center;line-height:62px;font-size:26px;'
            f'color:#ffffff;font-weight:800">{initial}</div>'
        )

    if salon.latitude and salon.longitude:
        maps_url = f"https://maps.google.com/?q={salon.latitude},{salon.longitude}"
    else:
        maps_url = f"https://maps.google.com/?q={quote(f'{salon.address_street}, {salon.address_city}, Sri Lanka')}"

    if booking.home_visit and booking.home_visit_address:
        loc_label = 'Your Address (Home Visit)'
        loc_addr  = booking.home_visit_address
        loc_maps  = f"https://maps.google.com/?q={quote(booking.home_visit_address)}"
    else:
        loc_label = salon.name
        loc_addr  = f"{salon.address_street}, {salon.address_city}, {salon.address_district}"
        loc_maps  = maps_url

    # Fully dark email — no white sections so dark-mode clients can't invert anything
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0;padding:0;background:#060e0d;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif" bgcolor="#060e0d">

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#060e0d">
<tr><td align="center" style="padding:32px 16px 52px" bgcolor="#060e0d">

  <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;border-radius:20px;overflow:hidden">

    <!-- ── HEADER ── -->
    <tr>
      <td align="center" bgcolor="#0a2e2a" style="background:linear-gradient(135deg,#061a18 0%,#0a2e2a 40%,#0D9488 100%);padding:32px 40px 28px">
        <div style="font-size:12px;font-weight:700;color:#5eead4;letter-spacing:0.28em;text-transform:uppercase;margin-bottom:5px">&#10022; &nbsp; S A L O O N</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.18em;text-transform:uppercase">BEAUTY &amp; WELLNESS PLATFORM</div>
      </td>
    </tr>

    <!-- ── HERO ── -->
    <tr>
      <td align="center" bgcolor="#0c1f1c" style="background:#0c1f1c;padding:40px 40px 32px">
        <div style="margin:0 auto 20px;width:62px;height:62px">{salon_logo_html}</div>
        <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;margin-bottom:12px">Appointment Confirmed!</div>
        <div style="font-size:15px;color:rgba(255,255,255,0.55);line-height:1.65">
          Hi <span style="color:#ffffff;font-weight:700">{client.full_name or 'there'}</span>, your appointment at
        </div>
        <div style="font-size:22px;font-weight:800;color:#14B8A8;letter-spacing:-0.01em;margin:10px 0 5px">{salon.name}</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.35)">is all set &mdash; we look forward to seeing you!</div>
      </td>
    </tr>

    <!-- ── DATE / TIME ── -->
    <tr>
      <td bgcolor="#0a1a17" style="background:#0a1a17;border-left:3px solid #0D9488;padding:0">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td bgcolor="#0a1a17" style="background:#0a1a17;padding:20px 36px">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:28px;vertical-align:middle;padding-right:16px">&#128197;</td>
                  <td style="vertical-align:middle">
                    <div style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.01em">{date_str}</div>
                    <div style="font-size:14px;color:#14B8A8;font-weight:600;margin-top:5px">&#128336; &nbsp; {time_str}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── CTA BUTTON ── -->
    <tr>
      <td align="center" bgcolor="#0c1f1c" style="background:#0c1f1c;padding:28px 40px">
        <a href="{booking_url}" style="display:inline-block;padding:15px 48px;background:linear-gradient(135deg,#0D9488,#14B8A8);color:#ffffff;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.01em;border:none">
          Manage Your Appointment &nbsp;&#8594;
        </a>
      </td>
    </tr>

    <!-- ── APPOINTMENT DETAILS ── -->
    <tr>
      <td bgcolor="#0f1f1b" style="background:#0f1f1b;padding:24px 40px 20px;border-top:1px solid #1a3530">
        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.28);letter-spacing:0.14em;text-transform:uppercase;margin-bottom:18px">APPOINTMENT DETAILS</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:11px 0;color:rgba(255,255,255,0.45);font-size:13px;border-bottom:1px solid #1a3530;vertical-align:top">Services</td>
            <td style="padding:11px 0;text-align:right;border-bottom:1px solid #1a3530;vertical-align:top">{svc_rows}</td>
          </tr>
          {staff_row}
          <tr>
            <td style="padding:11px 0;color:rgba(255,255,255,0.45);font-size:13px;border-bottom:1px solid #1a3530">Type</td>
            <td style="padding:11px 0;text-align:right;border-bottom:1px solid #1a3530">
              <span style="display:inline-block;padding:4px 14px;background:{type_bg};color:{type_color};border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.05em">{appt_type.upper()}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:11px 0;color:rgba(255,255,255,0.45);font-size:13px;border-bottom:1px solid #1a3530">Status</td>
            <td style="padding:11px 0;text-align:right;border-bottom:1px solid #1a3530">
              <span style="display:inline-block;padding:4px 14px;background:rgba(20,184,166,0.14);color:#14B8A8;border:1px solid rgba(20,184,166,0.28);border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.05em">&#10003; &nbsp;CONFIRMED</span>
            </td>
          </tr>
          <tr>
            <td style="padding:11px 0;color:rgba(255,255,255,0.45);font-size:13px">Booking Ref</td>
            <td style="padding:11px 0;color:#e2e8f0;font-size:14px;font-weight:800;text-align:right;font-family:'Courier New',Courier,monospace;letter-spacing:0.08em">REF&#8209;{booking.pk:06d}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── PRICE SUMMARY ── -->
    <tr>
      <td bgcolor="#091512" style="background:#091512;padding:22px 40px;border-top:1px solid #1a3530">
        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.28);letter-spacing:0.14em;text-transform:uppercase;margin-bottom:18px">PRICE SUMMARY</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:7px 0;color:rgba(255,255,255,0.45);font-size:13px">Subtotal</td>
            <td style="padding:7px 0;color:rgba(255,255,255,0.65);font-size:13px;text-align:right">LKR {subtotal:,.0f}</td>
          </tr>
          {discount_row}
          <tr>
            <td style="padding:14px 0 0;color:#ffffff;font-size:16px;font-weight:800;border-top:1px solid #1a3530">Total</td>
            <td style="padding:14px 0 0;color:#14B8A8;font-size:17px;font-weight:800;text-align:right;border-top:1px solid #1a3530">LKR {total:,.0f}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── LOCATION ── -->
    <tr>
      <td bgcolor="#0f1f1b" style="background:#0f1f1b;padding:24px 40px 28px;border-top:1px solid #1a3530">
        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.28);letter-spacing:0.14em;text-transform:uppercase;margin-bottom:18px">LOCATION</div>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:20px;vertical-align:top;padding-right:14px;padding-top:3px">&#128205;</td>
            <td>
              <div style="font-size:14px;font-weight:700;color:#ffffff;margin-bottom:5px">{loc_label}</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6">{loc_addr}</div>
              <a href="{loc_maps}" style="display:inline-block;margin-top:14px;padding:9px 20px;background:rgba(13,148,136,0.12);border:1px solid rgba(13,148,136,0.35);color:#14B8A8;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700">&#128506; &nbsp; View on Google Maps</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── FOOTER ── -->
    <tr>
      <td align="center" bgcolor="#061210" style="background:linear-gradient(180deg,#091512,#061210);padding:24px 40px;border-top:1px solid #1a3530">
        <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:6px">Questions? Reply to this email or visit your bookings dashboard.</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.2)">&copy; 2026 Saloon &nbsp;&middot;&nbsp; Beauty &amp; Wellness Platform</div>
      </td>
    </tr>

  </table>

</td></tr>
</table>

</body>
</html>"""

    try:
        send_mail(
            subject=f"✓ Booking Confirmed — {salon.name} on {date_str}",
            message=f"Your appointment at {salon.name} on {date_str} at {time_str} is confirmed. Ref: REF-{booking.pk:06d}. Manage: {booking_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[client.email],
            html_message=html,
            fail_silently=False,
        )
        logger.info(f"[EMAIL] Booking confirmation sent to {client.email} for #{booking.pk}")
    except Exception as e:
        logger.error(f"[EMAIL] Booking confirmation FAILED for #{booking.pk} → {client.email}: {e}")


def _send_owner_new_booking_email(booking):
    """Notify the salon owner when a client creates a new booking."""
    owner  = booking.salon.owner
    client = booking.client
    salon  = booking.salon
    dt     = booking.requested_datetime
    date_str = dt.strftime('%A, %B %d, %Y')
    time_str = dt.strftime('%I:%M %p')

    services = list(booking.booking_services.select_related('salon_service__service').all())
    subtotal  = sum(float(bs.salon_service.effective_price) for bs in services)
    discount  = float(booking.discount_amount)
    total     = subtotal - discount

    svc_rows = ''.join(
        f'<tr><td style="padding:8px 0;color:rgba(255,255,255,0.5);font-size:13px;border-bottom:1px solid #1a3530">&#8226; {bs.salon_service.service.name}</td>'
        f'<td style="padding:8px 0;color:#e2e8f0;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #1a3530">LKR {float(bs.salon_service.effective_price):,.0f}</td></tr>'
        for bs in services
    )

    appt_type = 'Home Visit' if booking.home_visit else ('Walk-In' if booking.is_walk_in else 'In-Salon')
    if booking.home_visit:
        type_bg, type_color = 'rgba(251,146,60,0.18)', '#fb923c'
    elif booking.is_walk_in:
        type_bg, type_color = 'rgba(139,92,246,0.18)', '#a78bfa'
    else:
        type_bg, type_color = 'rgba(20,184,166,0.18)', '#14B8A8'

    staff_row = (
        f'<tr><td style="padding:10px 0;color:rgba(255,255,255,0.45);font-size:13px;border-bottom:1px solid #1a3530">Assigned To</td>'
        f'<td style="padding:10px 0;color:#e2e8f0;font-size:13px;font-weight:700;text-align:right;border-bottom:1px solid #1a3530">{booking.staff_member.full_name}</td></tr>'
    ) if booking.staff_member else ''

    discount_row = (
        f'<tr><td style="padding:6px 0;color:#14B8A8;font-size:13px">Discount ({booking.promo_code.code})</td>'
        f'<td style="padding:6px 0;color:#14B8A8;font-size:13px;font-weight:700;text-align:right">&#8722; LKR {discount:,.0f}</td></tr>'
    ) if discount > 0 else ''

    address_row = (
        f'<tr><td style="padding:10px 0;color:rgba(255,255,255,0.45);font-size:13px;border-bottom:1px solid #1a3530">Home Address</td>'
        f'<td style="padding:10px 0;color:#e2e8f0;font-size:13px;text-align:right;border-bottom:1px solid #1a3530">{booking.home_visit_address}</td></tr>'
    ) if booking.home_visit and booking.home_visit_address else ''

    notes_row = (
        f'<tr><td colspan="2" style="padding:12px 16px;background:rgba(255,255,255,0.04);border-radius:8px;color:rgba(255,255,255,0.55);font-size:13px;line-height:1.6;font-style:italic">&#8220;{booking.notes}&#8221;</td></tr>'
    ) if booking.notes else ''

    frontend_url  = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    view_appt_url = f"{frontend_url}/owner/bookings/{booking.pk}"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0;padding:0;background:#080d10;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif" bgcolor="#080d10">

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#080d10">
<tr><td align="center" style="padding:32px 16px 52px" bgcolor="#080d10">

  <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.06)">

    <!-- HEADER -->
    <tr>
      <td align="center" bgcolor="#0a1520" style="background:linear-gradient(135deg,#060e18 0%,#0a1a28 50%,#0a2236 100%);padding:30px 40px 24px">
        <div style="font-size:11px;font-weight:700;color:#60a5fa;letter-spacing:0.26em;text-transform:uppercase;margin-bottom:4px">&#10022; &nbsp; SALOON OWNER PORTAL</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:0.16em;text-transform:uppercase">New Booking Notification</div>
      </td>
    </tr>

    <!-- HERO -->
    <tr>
      <td align="center" bgcolor="#0c1825" style="background:#0c1825;padding:36px 40px 28px">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);border-radius:50%;margin:0 auto 20px;text-align:center;line-height:64px;font-size:28px">&#128197;</div>
        <div style="font-size:11px;font-weight:700;color:#93c5fd;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:10px">NEW APPOINTMENT REQUEST</div>
        <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;margin-bottom:10px">You have a new booking!</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7">
          A client has booked an appointment at<br>
          <span style="color:#60a5fa;font-weight:700;font-size:18px">{salon.name}</span>
        </div>
      </td>
    </tr>

    <!-- DATE / TIME BANNER -->
    <tr>
      <td bgcolor="#0a1a2e" style="background:#0a1a2e;border-left:3px solid #3b82f6;padding:0">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td bgcolor="#0a1a2e" style="background:#0a1a2e;padding:18px 36px">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:26px;vertical-align:middle;padding-right:16px">&#128197;</td>
                  <td style="vertical-align:middle">
                    <div style="font-size:17px;font-weight:800;color:#ffffff">{date_str}</div>
                    <div style="font-size:14px;color:#60a5fa;font-weight:600;margin-top:4px">&#128336; &nbsp; {time_str}</div>
                  </td>
                  <td align="right" style="vertical-align:middle">
                    <span style="display:inline-block;padding:6px 16px;background:{type_bg};color:{type_color};border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.06em">{appt_type.upper()}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CLIENT INFO -->
    <tr>
      <td bgcolor="#0f1e2e" style="background:#0f1e2e;padding:24px 40px 20px;border-top:1px solid #1a2e42">
        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.28);letter-spacing:0.14em;text-transform:uppercase;margin-bottom:16px">CLIENT DETAILS</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:9px 0;color:rgba(255,255,255,0.45);font-size:13px;border-bottom:1px solid #1a2e42">Name</td>
            <td style="padding:9px 0;color:#e2e8f0;font-size:13px;font-weight:700;text-align:right;border-bottom:1px solid #1a2e42">{client.full_name or '—'}</td>
          </tr>
          <tr>
            <td style="padding:9px 0;color:rgba(255,255,255,0.45);font-size:13px;border-bottom:1px solid #1a2e42">Email</td>
            <td style="padding:9px 0;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #1a2e42">
              <a href="mailto:{client.email}" style="color:#60a5fa;text-decoration:none">{client.email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:9px 0;color:rgba(255,255,255,0.45);font-size:13px;border-bottom:1px solid #1a2e42">Phone</td>
            <td style="padding:9px 0;color:#e2e8f0;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #1a2e42">{client.phone or '—'}</td>
          </tr>
          {address_row}
        </table>
      </td>
    </tr>

    <!-- BOOKING DETAILS -->
    <tr>
      <td bgcolor="#091622" style="background:#091622;padding:24px 40px 20px;border-top:1px solid #1a2e42">
        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.28);letter-spacing:0.14em;text-transform:uppercase;margin-bottom:16px">BOOKING DETAILS</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:9px 0;color:rgba(255,255,255,0.45);font-size:13px;border-bottom:1px solid #1a2e42" valign="top">Services</td>
            <td style="padding:9px 0;border-bottom:1px solid #1a2e42">
              <table width="100%" cellpadding="0" cellspacing="0">{svc_rows}</table>
            </td>
          </tr>
          {staff_row}
          <tr>
            <td style="padding:9px 0;color:rgba(255,255,255,0.45);font-size:13px;border-bottom:1px solid #1a2e42">Booking Ref</td>
            <td style="padding:9px 0;color:#e2e8f0;font-size:14px;font-weight:800;text-align:right;border-bottom:1px solid #1a2e42;font-family:'Courier New',Courier,monospace;letter-spacing:0.08em">REF&#8209;{booking.pk:06d}</td>
          </tr>
          <tr>
            <td style="padding:9px 0;color:rgba(255,255,255,0.45);font-size:13px">Status</td>
            <td style="padding:9px 0;text-align:right">
              <span style="display:inline-block;padding:4px 14px;background:rgba(251,191,36,0.14);color:#fbbf24;border:1px solid rgba(251,191,36,0.28);border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.05em">&#9679; &nbsp;PENDING REVIEW</span>
            </td>
          </tr>
        </table>
        {"<table width='100%' cellpadding='0' cellspacing='0' style='margin-top:14px'>" + notes_row + "</table>" if notes_row else ""}
      </td>
    </tr>

    <!-- PRICE SUMMARY -->
    <tr>
      <td bgcolor="#06101a" style="background:#06101a;padding:20px 40px;border-top:1px solid #1a2e42">
        <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.28);letter-spacing:0.14em;text-transform:uppercase;margin-bottom:14px">PRICE SUMMARY</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;color:rgba(255,255,255,0.45);font-size:13px">Subtotal</td>
            <td style="padding:6px 0;color:rgba(255,255,255,0.65);font-size:13px;text-align:right">LKR {subtotal:,.0f}</td>
          </tr>
          {discount_row}
          <tr>
            <td style="padding:13px 0 0;color:#ffffff;font-size:16px;font-weight:800;border-top:1px solid #1a2e42">Total</td>
            <td style="padding:13px 0 0;color:#60a5fa;font-size:17px;font-weight:800;text-align:right;border-top:1px solid #1a2e42">LKR {total:,.0f}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td align="center" bgcolor="#0c1825" style="background:#0c1825;padding:28px 40px 32px;border-top:1px solid #1a2e42">
        <div style="font-size:13px;color:rgba(255,255,255,0.45);margin-bottom:18px">Review and confirm or propose a new time from your dashboard.</div>
        <a href="{view_appt_url}" style="display:inline-block;padding:15px 48px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#ffffff;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.01em">
          View Appointment &nbsp;&#8594;
        </a>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td align="center" bgcolor="#060e18" style="background:#060e18;padding:22px 40px;border-top:1px solid #1a2e42">
        <div style="font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:5px">Saloon Owner Portal &nbsp;&middot;&nbsp; You are receiving this because you own a registered salon.</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.18)">&copy; 2026 Saloon &nbsp;&middot;&nbsp; Beauty &amp; Wellness Platform, Sri Lanka</div>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>"""

    try:
        send_mail(
            subject=f"📅 New Booking — {client.full_name or client.email} on {date_str} | {salon.name}",
            message=f"New booking from {client.full_name or client.email} ({client.email}) at {salon.name} on {date_str} at {time_str}. REF-{booking.pk:06d}. View: {view_appt_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[owner.email],
            html_message=html,
            fail_silently=False,
        )
        logger.info(f"[EMAIL] Owner booking alert sent to {owner.email} for booking #{booking.pk}")
    except Exception as e:
        logger.error(f"[EMAIL] Owner booking alert FAILED for #{booking.pk}: {e}")


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

        if staff_member:
            if _has_schedule_conflict(staff_member, requested_dt, new_duration):
                return Response({'detail': 'This professional is already booked during that time.'}, status=status.HTTP_409_CONFLICT)
        else:
            # "Any Available" — only reject if every active staff member is busy at that time
            active_staff = StaffMember.objects.filter(salon=salon, is_active=True)
            if active_staff.exists():
                any_free = any(
                    not _has_schedule_conflict(sm, requested_dt, new_duration)
                    for sm in active_staff
                )
                if not any_free:
                    return Response(
                        {'detail': 'No staff available at this time. Please choose a different slot.'},
                        status=status.HTTP_409_CONFLICT,
                    )

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

        # Notify salon owner — in-app notification + email
        dt_str = booking.requested_datetime.strftime('%b %d at %I:%M %p')
        send_notification(
            salon.owner,
            f"New booking from {request.user.full_name or request.user.email} on {dt_str}.",
            notif_type='booking_confirmed',
            booking_id=booking.pk,
        )
        try:
            _send_owner_new_booking_email(booking)
        except Exception as e:
            logger.error(f"[EMAIL] Owner notification failed for booking #{booking.pk}: {e}")

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
        _send_booking_confirmation_email(booking)
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
        # Email customer with alternative slots
        try:
            from utils.email import send_bms_email
            client = booking.client
            salon  = booking.salon
            name   = client.full_name or 'there'
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            booking_url  = f'{frontend_url}/bookings/{booking.pk}'
            slots_html = ''.join(
                f'<li style="color:#374151;font-size:14px;line-height:1.8;font-family:Arial,Helvetica,sans-serif">'
                f'{dt.strftime("%A, %B %d, %Y at %I:%M %p")}</li>'
                for dt in slot_datetimes
            )
            send_bms_email(
                subject=f'Action needed: Choose a new time for your booking at {salon.name}',
                to_email=client.email,
                heading='Your booking needs rescheduling',
                preheader=f'{salon.name} has proposed 3 alternative time slots for your appointment.',
                body_html=f'''
                  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif">
                    Hi {name}, your requested time at <strong>{salon.name}</strong> was not available.
                    The salon has proposed these alternative slots — please log in to select one:
                  </p>
                  <ul style="margin:0 0 16px 20px;padding:0">{slots_html}</ul>
                  <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;font-family:Arial,Helvetica,sans-serif">
                    Ref: REF-{booking.pk:06d}
                  </p>''',
                cta_url=booking_url,
                cta_label='Select a Time Slot',
                plain_text=f'Hi {name},\n\nYour booking at {salon.name} needs rescheduling. Log in to select an alternative slot: {booking_url}\n\nBookMyStyle Team',
            )
        except Exception as e:
            logger.error('[EMAIL] Booking rejection email failed for #%s: %s', booking.pk, e)
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

        _send_booking_confirmation_email(booking)
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


class BookingCompleteView(APIView):
    """Salon owner marks a booking as completed — triggers review-request email to client."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if request.user.role not in ('salon_owner', 'system_admin'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'salon_owner' and booking.salon.owner_id != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if booking.status not in ('confirmed', 'pending', 'rescheduled'):
            return Response({'detail': f"Cannot complete booking in status '{booking.status}'"}, status=status.HTTP_400_BAD_REQUEST)

        booking.status = 'completed'
        booking.save()

        send_notification(
            booking.client,
            f"Your appointment at {booking.salon.name} is complete. We hope you loved it — leave a review!",
            notif_type='booking_confirmed',
            booking_id=booking.pk,
        )

        # Review-request email to client
        try:
            from utils.email import send_bms_email
            client  = booking.client
            salon   = booking.salon
            name    = client.full_name or 'there'
            dt_str  = booking.requested_datetime.strftime('%A, %B %d, %Y')
            services = list(booking.booking_services.select_related('salon_service__service').all())
            svc_list = ', '.join(bs.salon_service.service.name for bs in services) if services else 'your appointment'
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            review_url   = f'{frontend_url}/salons/{salon.pk}/reviews'
            send_bms_email(
                subject=f'How was your visit to {salon.name}? Share your experience',
                to_email=client.email,
                heading=f'How was your experience, {name}?',
                preheader=f'Your appointment at {salon.name} on {dt_str} is complete. Tell us what you thought!',
                body_html=f'''
                  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif">
                    Your appointment for <strong>{svc_list}</strong> at <strong>{salon.name}</strong> on {dt_str} is now marked as complete.
                    We hope you had a wonderful experience!
                  </p>
                  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0;font-family:Arial,Helvetica,sans-serif">
                    Your review helps other customers discover great salons. It takes less than a minute.
                  </p>''',
                cta_url=review_url,
                cta_label='Leave a Review',
                plain_text=f'Hi {name},\n\nYour appointment at {salon.name} on {dt_str} is complete. Leave a review at {review_url}\n\nThank you!\nBookMyStyle Team',
            )
        except Exception as e:
            logger.error('[EMAIL] Booking complete email failed for #%s: %s', booking.pk, e)

        logger.info(f"Booking #{booking.pk} marked completed by {request.user.email}")
        return Response(BookingSerializer(booking).data)
