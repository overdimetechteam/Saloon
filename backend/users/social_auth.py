import secrets
import hashlib
import base64
import hmac as hmac_mod
import json
import requests as http
from urllib.parse import quote

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser
from .serializers import UserSerializer


def _issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def _get_or_create_social_user(email, full_name=''):
    email = email.lower().strip()
    try:
        user = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        user = CustomUser.objects.create_user(
            email=email,
            full_name=full_name or email.split('@')[0],
            role='client',
        )
    # Social login = email confirmed by the provider, mark verified
    if not user.email_verified:
        user.email_verified = True
        user.save(update_fields=['email_verified'])
    return user


# ── Google ─────────────────────────────────────────────────────────────────

class GoogleSocialAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'detail': 'access_token is required.'}, status=400)
        try:
            resp = http.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                params={'access_token': access_token},
                timeout=10,
            )
            if resp.status_code != 200:
                return Response({'detail': 'Google token rejected.'}, status=400)
            info = resp.json()
            email = info.get('email')
            full_name = info.get('name', '')
            if not email:
                return Response({'detail': 'No email returned by Google.'}, status=400)
        except Exception as exc:
            return Response({'detail': f'Google auth error: {exc}'}, status=400)

        user = _get_or_create_social_user(email, full_name)
        return Response(_issue_tokens(user))


# ── Apple ──────────────────────────────────────────────────────────────────

class AppleSocialAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        id_token_str = request.data.get('id_token')
        full_name = request.data.get('full_name', '')
        if not id_token_str:
            return Response({'detail': 'id_token is required.'}, status=400)
        try:
            import jwt
            from jwt.algorithms import RSAAlgorithm

            keys_resp = http.get('https://appleid.apple.com/auth/keys', timeout=10)
            keys_data = keys_resp.json()

            header = jwt.get_unverified_header(id_token_str)
            kid = header.get('kid')
            apple_key_json = next(
                (k for k in keys_data.get('keys', []) if k['kid'] == kid), None
            )
            if apple_key_json is None:
                return Response({'detail': 'Apple public key not found.'}, status=400)

            public_key = RSAAlgorithm.from_jwk(apple_key_json)
            payload = jwt.decode(
                id_token_str,
                public_key,
                algorithms=['RS256'],
                audience=settings.APPLE_CLIENT_ID,
            )
            email = payload.get('email')
            if not email:
                return Response({'detail': 'No email in Apple token.'}, status=400)
        except Exception as exc:
            return Response({'detail': f'Apple token invalid: {exc}'}, status=400)

        user = _get_or_create_social_user(email, full_name)
        return Response(_issue_tokens(user))


# ── Twitter / X PKCE helpers ───────────────────────────────────────────────

def _make_state(code_verifier):
    raw = secrets.token_urlsafe(16)
    payload_str = json.dumps({'cv': code_verifier, 'r': raw})
    secret = settings.SECRET_KEY[:32].encode()
    sig = hmac_mod.new(secret, payload_str.encode(), hashlib.sha256).hexdigest()
    combined = f"{payload_str}|{sig}"
    # strip padding so no '=' appears in the URL
    return base64.urlsafe_b64encode(combined.encode()).rstrip(b'=').decode()


def _recover_verifier(opaque_state):
    try:
        padding = '=' * (-len(opaque_state) % 4)
        combined = base64.urlsafe_b64decode(opaque_state + padding).decode()
        payload_str, sig = combined.rsplit('|', 1)
        secret = settings.SECRET_KEY[:32].encode()
        expected = hmac_mod.new(secret, payload_str.encode(), hashlib.sha256).hexdigest()
        if not hmac_mod.compare_digest(sig, expected):
            return None
        return json.loads(payload_str)['cv']
    except Exception:
        return None


class TwitterAuthInitView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        client_id = getattr(settings, 'TWITTER_CLIENT_ID', '')
        redirect_uri = getattr(settings, 'TWITTER_REDIRECT_URI', '')
        if not client_id:
            return Response({'detail': 'Twitter OAuth not configured.'}, status=503)

        code_verifier = secrets.token_urlsafe(64)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).rstrip(b'=').decode()
        state = _make_state(code_verifier)

        auth_url = (
            'https://twitter.com/i/oauth2/authorize'
            f'?response_type=code'
            f'&client_id={quote(client_id, safe="")}'
            f'&redirect_uri={quote(redirect_uri, safe="")}'
            f'&scope=tweet.read%20users.read'
            f'&state={quote(state, safe="")}'
            f'&code_challenge={quote(code_challenge, safe="")}'
            f'&code_challenge_method=S256'
        )
        return Response({'auth_url': auth_url, 'state': state})


class TwitterAuthCallbackView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('code')
        state = request.data.get('state')
        if not code or not state:
            return Response({'detail': 'code and state are required.'}, status=400)

        code_verifier = _recover_verifier(state)
        if not code_verifier:
            return Response({'detail': 'Invalid or tampered state.'}, status=400)

        client_id = getattr(settings, 'TWITTER_CLIENT_ID', '')
        client_secret = getattr(settings, 'TWITTER_CLIENT_SECRET', '')
        redirect_uri = getattr(settings, 'TWITTER_REDIRECT_URI', '')

        try:
            token_resp = http.post(
                'https://api.twitter.com/2/oauth2/token',
                data={
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': redirect_uri,
                    'code_verifier': code_verifier,
                    'client_id': client_id,
                },
                auth=(client_id, client_secret),
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=15,
            )
            token_data = token_resp.json()
            access_token = token_data.get('access_token')
            if not access_token:
                return Response(
                    {'detail': f'Twitter token exchange failed: {token_data.get("error_description", token_data)}'},
                    status=400,
                )
        except Exception as exc:
            return Response({'detail': f'Twitter API error: {exc}'}, status=400)

        try:
            user_resp = http.get(
                'https://api.twitter.com/2/users/me',
                params={'user.fields': 'name,username'},
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10,
            )
            twitter_data = user_resp.json().get('data', {})
            username = twitter_data.get('username') or f'x_{secrets.token_hex(4)}'
            name = twitter_data.get('name', username)
            email = f"{username}@x-oauth.saloon"
        except Exception as exc:
            return Response({'detail': f'Failed to fetch X/Twitter user: {exc}'}, status=400)

        user = _get_or_create_social_user(email, name)
        return Response(_issue_tokens(user))
