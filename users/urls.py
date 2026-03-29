"""
users/urls.py
URL patterns for all user-facing API endpoints.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('register/',          views.UserRegisterView.as_view(),    name='user-register'),
    path('login/',             views.UserLoginView.as_view(),       name='user-login'),
    path('forgot-password/',   views.ForgotPasswordView.as_view(),  name='forgot-password'),
    path('verify-otp/',        views.VerifyOTPView.as_view(),       name='verify-otp'),
    path('reset-password/',    views.ResetPasswordView.as_view(),   name='reset-password'),

    # ML features
    path('predict/',           views.PredictionView.as_view(),      name='predict'),
    path('train/',             views.SimulateTrainingView.as_view(), name='simulate-train'),
]
