from django.contrib import admin as django_admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from users import views as user_views
from admins import views as admin_views


def health_check(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('django-admin/', django_admin.site.urls),

    # Health check
    path('api/health/', health_check, name='health'),

    # DRF API routes (React / Mobile)
    path('api/users/',  include('users.urls')),
    path('api/admins/', include('admins.urls')),

    # ---------------- USER TEMPLATE ROUTES ----------------
    path('',                user_views.index_view,          name='index'),
    path('register/',       user_views.UserRegisterFormView, name='UserRegisterForm'),
    path('login/',          user_views.UserLoginCheck,       name='UserLogin'),
    path('logout/',         user_views.logout_view,          name='logout'),
    path('home/',           user_views.UserHome,             name='UserHome'),
    path('predict/',        user_views.PredictView,          name='predict'),
    path('train/',          user_views.TrainView,            name='train'),

    # ✅ ADD THESE (IMPORTANT FIX)
    path('forgot-password/', user_views.forgot_password,       name='forgot_password'),
    path('verify-otp/',      user_views.verify_otp,            name='verify_otp'),
    path('reset-password/',  user_views.reset_password_view,   name='reset_password'),

    # ---------------- ADMIN TEMPLATE ROUTES ----------------
    path('admin/login/',            admin_views.admin_login_view, name='AdminLogin'),
    path('admin/home/',             admin_views.admin_home_view,  name='AdminHome'),
    path('admin/users/',            admin_views.view_users,       name='viewUsers'),
    path('admin/home/userDetails/', admin_views.view_users,       name='userDetails'),
    path('admin/activate/<int:user_id>/', admin_views.activate_user, name='activateUser'),
    path('admin/delete/<int:user_id>/',   admin_views.delete_user,   name='deleteUser'),
]

# Media files
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)