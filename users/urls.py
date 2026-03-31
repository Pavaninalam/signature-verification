from django.urls import path
from .views import UserRegisterView, UserLoginView, PredictionView

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='UserRegister'),
    path('login/', UserLoginView.as_view(), name='UserLogin'),
    path('predict/', PredictionView.as_view(), name='predict'),
    path('login/', admin_login, name='AdminLogin'),
]