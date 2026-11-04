from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path, re_path
from django.views.static import serve
from portal.views import api_documentation_view, health

urlpatterns = [
    re_path(r"^api/health/?$", health),
    re_path(r"^apidocument/?$", api_documentation_view),
    re_path(r"^apidocuments/?$", api_documentation_view),
    re_path(r"^api/docs/?$", api_documentation_view),
    re_path(r"^uploads/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    path("api/", include("portal.urls")),
]

if settings.MEDIA_URL and settings.MEDIA_ROOT:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
