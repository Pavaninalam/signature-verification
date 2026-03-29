"""
admins/urls.py
URL patterns for all admin API endpoints.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('login/',                          views.AdminLoginView.as_view(),      name='admin-login'),
    path('users/',                          views.RegisteredUsersView.as_view(), name='admin-users'),
    path('users/<int:user_id>/activate/',   views.ActivateUserView.as_view(),    name='admin-activate-user'),
    path('users/<int:user_id>/delete/',     views.DeleteUserView.as_view(),      name='admin-delete-user'),
]
