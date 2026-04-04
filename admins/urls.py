from django.urls import path
from . import views

urlpatterns = [
    # API routes (unchanged)
    path('login/', views.AdminLoginView.as_view(), name='api-admin-login'),
    path('users/', views.RegisteredUsersView.as_view(), name='api-admin-users'),
    path('users/<int:user_id>/activate/', views.ActivateUserView.as_view(), name='api-admin-activate'),
    path('users/<int:user_id>/delete/', views.DeleteUserView.as_view(), name='api-admin-delete'),

    # ✅ NEW TEMPLATE ROUTES
    path('AdminHome/', views.AdminHome, name='AdminHome'),
    path('userDetails/', views.userDetails, name='userDetails'),
]