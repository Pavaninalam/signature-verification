from django.urls import path
from .views import UserRegisterView, UserLoginView, PredictionView

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='api-user-register'),
    path('login/', UserLoginView.as_view(), name='api-user-login'),
    path('predict/', PredictionView.as_view(), name='api-predict'),
]
