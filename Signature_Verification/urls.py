from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def home(request):
    return JsonResponse({"message": "Backend is running ✅"})

urlpatterns = [
    path('', home),  # 👈 ADD THIS
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
]