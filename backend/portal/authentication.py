import time
import uuid
import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import Admin, RevokedToken, Student

# In-memory authentication cache: token -> (PortalUser, payload, expiry_timestamp)
_AUTH_CACHE = {}
_AUTH_CACHE_TTL = 300  # 5 minutes cache per token to avoid redundant database roundtrips


def invalidate_auth_cache(token=None):
    if token:
        _AUTH_CACHE.pop(token, None)
    else:
        _AUTH_CACHE.clear()


def issue_token(user, role):
    return jwt.encode(
        {"id": user.id, "role": role, "jti": uuid.uuid4().hex, "exp": int(time.time()) + 86400},
        settings.SECRET_KEY,
        algorithm="HS256",
    )


class PortalUser:
    def __init__(self, record, role):
        self.record = record
        self.id = record.id
        self.pk = record.pk
        self.role = role
        self.is_authenticated = True


class PortalTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        path = getattr(request, "path", "")
        # Never fail or authenticate on public auth endpoints
        if any(p in path for p in ("/auth/login", "/auth/admin/login", "/auth/student/login", "/auth/student/activate", "/auth/student/password-reset")):
            return None

        header = request.headers.get("Authorization", "")
        token = ""
        if header.startswith("Bearer "):
            token = header[7:].strip()
        if not token:
            return None

        # Instant in-memory cache lookup (0ms latency)
        now = time.time()
        cached = _AUTH_CACHE.get(token)
        if cached and cached[2] > now:
            return cached[0], cached[1]

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            jti = payload.get("jti")
            if not jti or RevokedToken.objects.filter(jti=jti).exists():
                raise AuthenticationFailed("This session has been revoked.")

            model = Admin if payload["role"] in ("admin", "staff") else Student
            user_record = model.objects.get(pk=payload["id"])
            user = PortalUser(user_record, payload["role"])

            # Store in fast cache
            _AUTH_CACHE[token] = (user, payload, now + _AUTH_CACHE_TTL)
            return user, payload
        except (jwt.PyJWTError, KeyError, Admin.DoesNotExist, Student.DoesNotExist) as exc:
            # If the request path is public, return None so anonymous / AllowAny requests proceed
            if any(p in path for p in ("/auth/", "/apidocument", "/health")):
                return None
            raise AuthenticationFailed("Invalid or expired authentication token.") from exc
