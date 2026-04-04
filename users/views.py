"""
users/views.py
"""

import os
import random
import jwt

from datetime import datetime, timedelta

from django.shortcuts import render, redirect
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

from .models import UserRegistrationModel
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    ForgotPasswordSerializer,
    VerifyOTPSerializer,
    ResetPasswordSerializer,
    SignatureSerializer,
)

from .training import simulate_training
from .predictor import preprocess, compute_similarity


# ================= JWT =================

SECRET_KEY = settings.SECRET_KEY
JWT_EXPIRY_HRS = 24


def generate_token(user):
    payload = {
        'id': user.id,
        'loginid': user.loginid,
        'name': user.name,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HRS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def decode_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except:
        return None


# ================= OTP =================

otp_storage = {}


# ================= IMAGE SAVE =================

def save_uploaded_image(image_file, name):
    save_path = os.path.join(settings.MEDIA_ROOT, name)
    image_file.seek(0)

    with open(save_path, 'wb') as f:
        for chunk in image_file.chunks():
            f.write(chunk)

    return f"{settings.MEDIA_URL}{name}"


# ================= API VIEWS =================

class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Registration successful'}, status=201)
        return Response(serializer.errors, status=400)


class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        loginid = serializer.validated_data['loginid']
        password = serializer.validated_data['password']

        try:
            user = UserRegistrationModel.objects.get(loginid=loginid)
        except:
            return Response({'error': 'Invalid credentials'}, status=401)

        if user.password != password:
            return Response({'error': 'Invalid credentials'}, status=401)

        if user.status != 'activated':
            return Response({'error': 'Account not activated'}, status=403)

        return Response({
            'token': generate_token(user),
            'user': {'id': user.id, 'name': user.name}
        })


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        email = serializer.validated_data['email']

        if not UserRegistrationModel.objects.filter(email=email).exists():
            return Response({'error': 'Email not found'}, status=404)

        otp = random.randint(100000, 999999)
        otp_storage[email] = otp

        try:
            send_mail("OTP", f"Your OTP: {otp}",
                      settings.DEFAULT_FROM_EMAIL, [email])
        except:
            pass

        return Response({'message': 'OTP sent'})


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']

        if str(otp_storage.get(email)) == str(otp):
            return Response({'message': 'OTP verified'})
        return Response({'error': 'Invalid OTP'}, status=400)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        email = serializer.validated_data['email']
        new_pass = serializer.validated_data['new_password']

        try:
            user = UserRegistrationModel.objects.get(email=email)
            user.password = new_pass
            user.save()
            otp_storage.pop(email, None)
            return Response({'message': 'Password reset successful'})
        except:
            return Response({'error': 'User not found'}, status=404)


class PredictionView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request):

        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return Response({'error': 'Login required'}, status=401)

        if decode_token(auth.split(' ')[1]) is None:
            return Response({'error': 'Invalid token'}, status=401)

        try:
            img1_file = request.FILES.get('image1')
            img2_file = request.FILES.get('image2')

            if not img1_file or not img2_file:
                return Response({'error': 'Upload both images'}, status=400)

            img1_file.seek(0)
            img2_file.seek(0)

            img1 = preprocess(img1_file)
            img2 = preprocess(img2_file)

            sim = compute_similarity(img1, img2)
            loss = round(float(sim['distance']) ** 2, 6)

            return Response({
                'result': sim['result'],
                'similarity': float(sim['similarity']),
                'distance': float(sim['distance']),
                'confidence': float(sim['confidence']),
                'loss': float(loss),
                'metrics': {
                    'ssim': float(sim['metrics']['ssim']),
                    'mse': float(sim['metrics']['mse'])
                }
            })

        except Exception as e:
            return Response({'error': str(e)}, status=500)


class SimulateTrainingView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            ctx = simulate_training()
            return Response(ctx)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ================= TEMPLATE VIEWS =================

def index_view(request):
    return render(request, 'index.html')


def UserRegisterFormView(request):
    return render(request, 'UserRegistrations.html')


def UserLoginCheck(request):
    return render(request, 'UserLogin.html')


def UserHome(request):
    return render(request, 'users/UserHomePage.html')


def logout_view(request):
    request.session.flush()
    return redirect('index')


def PredictView(request):
    if 'loginid' not in request.session:
        return redirect('UserLogin')

    context = {}

    if request.method == 'POST':
        try:
            img1_file = request.FILES.get('image1')
            img2_file = request.FILES.get('image2')

            if not img1_file or not img2_file:
                messages.error(request, 'Please upload both images.')
                return render(request, 'users/prediction.html')

            # Reset file pointers
            img1_file.seek(0)
            img2_file.seek(0)

            # Validate format
            if not img1_file.name.lower().endswith(('.png', '.jpg', '.jpeg')):
                messages.error(request, 'Upload JPG/PNG images only')
                return render(request, 'users/prediction.html')

            # Preprocess
            img1 = preprocess(img1_file)
            img2 = preprocess(img2_file)

            # Compute similarity
            sim = compute_similarity(img1, img2)

            loss = round(float(sim['distance']) ** 2, 6)

            context.update({
                'result': sim['result'],
                'similarity': round(float(sim['similarity']), 2),
                'distance': round(float(sim['distance']), 6),
                'confidence': round(float(sim['confidence']), 2),
                'loss': loss,
                'metrics': sim['metrics'],
            })

        except Exception as e:
            messages.error(request, f'Error: {str(e)}')

    return render(request, 'users/prediction.html', context)

def TrainView(request):
    context = {}
    if request.method == 'POST':
        try:
            ctx = simulate_training()
            context.update(ctx)
        except Exception as e:
            messages.error(request, str(e))
    return render(request, 'users/train_result.html', context)


# ================= FORGOT PASSWORD TEMPLATE =================

def forgot_password(request):
    return render(request, 'users/forgot_password.html')


def verify_otp(request):
    return render(request, 'users/verify_otp.html')


def reset_password_view(request):
    return render(request, 'users/reset_password.html')
