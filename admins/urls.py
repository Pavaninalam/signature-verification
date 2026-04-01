from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.AdminLoginView, name='AdminLogin'),
    path('home/', views.AdminHomeView, name='AdminHome'),

    path('users/', views.viewUsers, name='viewUsers'),
    path('home/userDetails/', views.viewUsers, name='userDetails'),  # ✅ ADD THIS

    path('activate/<int:user_id>/', views.activateUser, name='activateUser'),
    path('delete/<int:user_id>/', views.deleteUser, name='deleteUser'),
]