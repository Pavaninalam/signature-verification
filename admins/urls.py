from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.admin_login_view, name='AdminLogin'),
    path('home/', views.admin_home_view, name='AdminHome'),
    path('users/', views.viewUsers, name='viewUsers'),
    path('activate/<int:user_id>/', views.activateUser, name='activateUser'),
    path('delete/<int:user_id>/', views.deleteUser, name='deleteUser'),
]