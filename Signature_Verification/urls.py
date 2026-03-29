"""
Signature_Verification/urls.py

Single-server setup: Django serves BOTH the API and the React build.
This means only ONE port (8000) and ONE ngrok tunnel are needed.

URL layout:
  /api/...        → Django REST API
  /admin/         → Django admin panel
  /media/...      → Uploaded files
  /static/...     → Django static files (graphs, etc.)
  /reactstatic/   → React build JS/CSS assets
  /* (everything else) → React build (index.html)
"""
import os
import mimetypes
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, FileResponse, HttpResponseNotFound

REACT_BUILD = os.path.join(settings.BASE_DIR, 'signature-react', 'build')


def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'Django API is running'})


def serve_react_asset(request, path):
    """Serve files from the React build/static folder (JS, CSS, maps)."""
    file_path = os.path.join(REACT_BUILD, 'static', path)
    if os.path.isfile(file_path):
        mime, _ = mimetypes.guess_type(file_path)
        return FileResponse(open(file_path, 'rb'), content_type=mime or 'application/octet-stream')
    return HttpResponseNotFound()


def serve_react(request, path=''):
    """
    Serve React build files.
    - Real files (favicon, manifest, images) → served directly
    - Everything else → index.html (React Router handles routing)
    """
    # Try exact file match in build root
    if path:
        file_path = os.path.join(REACT_BUILD, path)
        if os.path.isfile(file_path):
            mime, _ = mimetypes.guess_type(file_path)
            return FileResponse(open(file_path, 'rb'), content_type=mime or 'application/octet-stream')

    # Fall back to index.html for all React routes
    index_path = os.path.join(REACT_BUILD, 'index.html')
    if os.path.isfile(index_path):
        return FileResponse(open(index_path, 'rb'), content_type='text/html')

    return HttpResponseNotFound(
        'React build not found. Run: cd signature-react && npm run build'
    )


urlpatterns = [
    # Django admin panel
    path('admin/', admin.site.urls),

    # Health check
    path('api/health/', health_check, name='health-check'),

    # User API endpoints  →  /api/users/...
    path('api/users/', include('users.urls')),

    # Admin API endpoints →  /api/admin/...
    path('api/admin/', include('admins.urls')),

    # React build static assets (JS/CSS) — served under /static/
    # Must come BEFORE the catch-all below
    re_path(r'^static/(?P<path>.+)$', serve_react_asset, name='react-static'),

    # React app — catch-all (must be last)
    re_path(r'^(?P<path>.*)$', serve_react, name='react-app'),
]

# Serve uploaded media files
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# Serve Django's own static files (training graphs, etc.) under /django-static/
urlpatterns += static(settings.STATIC_URL, document_root=settings.BASE_DIR / 'static')
