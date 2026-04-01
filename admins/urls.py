from django.urls import path
from . import views

urlpatterns = [
    # DRF API endpoints (used by React frontend)
    path('login/',                        views.AdminLoginView.as_view(),      name='api-admin-login'),
    path('users/',                        views.RegisteredUsersView.as_view(), name='api-admin-users'),
    path('users/<int:user_id>/activate/', views.ActivateUserView.as_view(),    name='api-admin-activate'),
    path('users/<int:user_id>/delete/',   views.DeleteUserView.as_view(),      name='api-admin-delete'),
]
