from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from users import views as user_views
from admins import views as admin_views

def health_check(request):
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('django-admin/', admin.site.urls),

    path('api/health/', health_check, name='health'),

    path('api/users/', include('users.urls')),
    path('api/admins/', include('admins.urls')),

    path('', user_views.index_view, name='index'),
    path('register/', user_views.UserRegisterFormView, name='UserRegisterForm'),
    path('login/', user_views.UserLoginCheck, name='UserLogin'),
    path('logout/', user_views.logout_view, name='logout'),
    path('home/', user_views.UserHome, name='UserHome'),
    path('predict/', user_views.PredictView, name='predict'),
    path('forgot-password/', user_views.forgot_password, name='forgot_password'),
    path('verify-otp/', user_views.verify_otp, name='verify_otp'),
    path('reset-password/', user_views.reset_password_view, name='reset_password'),

    path('admin/login/', admin_views.admin_login_view, name='AdminLogin'),
    path('admin/home/', admin_views.admin_home_view, name='AdminHome'),
    path('admin/users/', admin_views.view_users, name='viewUsers'),
    path('admin/activate/<int:user_id>/', admin_views.activate_user, name='activateUser'),
    path('admin/delete/<int:user_id>/', admin_views.delete_user, name='deleteUser'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
