from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.admin_login_view, name='AdminLogin'),
    path('home/', views.admin_home_view, name='AdminHome'),

    path('users/', views.view_users, name='viewUsers'),

    # ✅ FIX ADDED HERE
    path('home/userDetails/', views.view_users, name='userDetails'),

    path('activate/<int:user_id>/', views.activate_user, name='activateUser'),
    path('delete/<int:user_id>/', views.delete_user, name='deleteUser'),
]