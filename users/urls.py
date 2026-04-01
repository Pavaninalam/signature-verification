from django.urls import path
from .views import (
    UserRegisterView, UserLoginView, PredictionView,
    ForgotPasswordView, VerifyOTPView, ResetPasswordView,
    SimulateTrainingView,
)

urlpatterns = [
    path('register/',       UserRegisterView.as_view(),    name='api-user-register'),
    path('login/',          UserLoginView.as_view(),        name='api-user-login'),
    path('predict/',        PredictionView.as_view(),       name='api-predict'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='api-forgot-password'),
    path('verify-otp/',     VerifyOTPView.as_view(),        name='api-verify-otp'),
    path('reset-password/', ResetPasswordView.as_view(),   name='api-reset-password'),
    path('train/',          SimulateTrainingView.as_view(), name='api-train'),
]
