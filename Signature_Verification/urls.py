from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.shortcuts import render

def home(request):
    try:
        return render(request, 'index.html')
    except Exception as e:
        return HttpResponse(f"Template Error: {str(e)}")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('', home,name='index'),
]