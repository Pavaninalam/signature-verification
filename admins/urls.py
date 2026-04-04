from django.urls import path
from . import views

urlpatterns = [
    # Template Views (FIXED NAMES)
    path('AdminLogin/', views.admin_login_view, name='AdminLogin'),
    path('AdminHome/', views.admin_home_view, name='AdminHome'),
    path('userDetails/', views.view_users, name='viewUsers'),
    path('activate/<int:user_id>/', views.activate_user, name='activateUser'),
    path('delete/<int:user_id>/', views.delete_user, name='deleteUser'),

    # DRF API endpoints
    path('login/', views.AdminLoginView.as_view(), name='api-admin-login'),
    path('users/', views.RegisteredUsersView.as_view(), name='api-admin-users'),
    path('users/<int:user_id>/activate/', views.ActivateUserView.as_view(), name='api-admin-activate'),
    path('users/<int:user_id>/delete/', views.DeleteUserView.as_view(), name='api-admin-delete'),
]