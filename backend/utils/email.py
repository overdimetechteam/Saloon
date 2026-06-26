import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)

_GREEN = '#0D9488'


def _html(heading, preheader, body_html, cta_url=None, cta_label=None, footnote=''):
    btn = (
        f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0">'
        f'<tr><td style="background-color:{_GREEN};border-radius:6px;text-align:center">'
        f'<a href="{cta_url}" target="_blank" style="display:block;padding:13px 32px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,Helvetica,sans-serif;white-space:nowrap">{cta_label}</a>'
        f'</td></tr></table>'
    ) if cta_url and cta_label else ''

    fallback = (
        f'<tr><td style="padding:16px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb">'
        f'<p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif">If the button does not work, open this link:</p>'
        f'<p style="margin:0;font-size:11px;color:{_GREEN};word-break:break-word;font-family:Arial,Helvetica,sans-serif">{cta_url}</p>'
        f'</td></tr>'
    ) if cta_url else ''

    fn_row = (
        f'<tr><td style="padding:0 32px 20px">'
        f'<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;font-family:Arial,Helvetica,sans-serif">{footnote}</p>'
        f'</td></tr>'
    ) if footnote else ''

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden">{preheader}&nbsp;&zwnj;</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6">
    <tr><td style="padding:32px 16px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%"
             style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb">
        <!-- Header -->
        <tr>
          <td style="background-color:{_GREEN};padding:28px 32px;text-align:center">
            <p style="margin:0;font-size:20px;color:#fff;font-weight:700;font-family:Arial,Helvetica,sans-serif">BookMyStyle</p>
            <p style="margin:5px 0 0;font-size:11px;color:rgba(255,255,255,.85);letter-spacing:.12em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif">Beauty and Wellness</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px">
            <h1 style="margin:0 0 16px;font-size:20px;color:#111827;font-weight:700;font-family:Arial,Helvetica,sans-serif;line-height:1.3">{heading}</h1>
            {body_html}
            {btn}
          </td>
        </tr>
        {fn_row}
        {fallback}
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif">BookMyStyle - Beauty and Wellness Platform</p>
            <p style="margin:0;font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif">Colombo, Sri Lanka</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


def send_bms_email(subject, to_email, heading, preheader, body_html,
                   cta_url=None, cta_label=None, footnote='', plain_text=None):
    """Send a BookMyStyle-branded HTML email. Swallows exceptions and logs them."""
    try:
        html = _html(heading, preheader, body_html, cta_url, cta_label, footnote)
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text or heading,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
            reply_to=[settings.DEFAULT_FROM_EMAIL],
        )
        msg.attach_alternative(html, 'text/html')
        msg.extra_headers = {'X-Mailer': 'BookMyStyle', 'X-Priority': '3', 'Precedence': 'bulk'}
        msg.send(fail_silently=False)
        logger.info('[EMAIL] Sent "%s" to %s', subject, to_email)
    except Exception as exc:
        logger.error('[EMAIL] Failed to send "%s" to %s: %s', subject, to_email, exc)
