"""
users/views.py
DRF API views + template-based web UI views.
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
import base64
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile

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


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# OTP
# ---------------------------------------------------------------------------

otp_storage = {}


# ---------------------------------------------------------------------------
# IMAGE SAVE
# ---------------------------------------------------------------------------

def save_uploaded_image(image_file, name):
    path = os.path.join(settings.MEDIA_ROOT, name)
    image_file.seek(0)

    with open(path, 'wb') as f:
        for chunk in image_file.chunks():
            f.write(chunk)

    return f"{settings.MEDIA_URL}{name}"


# ---------------------------------------------------------------------------
# API VIEWS
# ---------------------------------------------------------------------------

class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = UserRegistrationSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response({'message': 'Registered successfully'}, status=201)
        return Response(s.errors, status=400)


class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = UserLoginSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)

        loginid = s.validated_data['loginid']
        password = s.validated_data['password']

        try:
            user = UserRegistrationModel.objects.get(loginid=loginid)
        except:
            return Response({'error': 'Invalid credentials'}, status=401)

        if user.password != password:
            return Response({'error': 'Invalid credentials'}, status=401)

        if user.status != 'activated':
            return Response({'error': 'Not activated'}, status=403)

        return Response({
            'token': generate_token(user),
            'user': {'id': user.id, 'name': user.name}
        })


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = ForgotPasswordSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)

        email = s.validated_data['email']

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
        s = VerifyOTPSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)

        email = s.validated_data['email']
        otp = s.validated_data['otp']

        if str(otp_storage.get(email)) == str(otp):
            return Response({'message': 'Verified'})
        return Response({'error': 'Invalid OTP'}, status=400)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = ResetPasswordSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)

        email = s.validated_data['email']
        new_pass = s.validated_data['new_password']

        try:
            user = UserRegistrationModel.objects.get(email=email)
            user.password = new_pass
            user.save()
            otp_storage.pop(email, None)
            return Response({'message': 'Password reset success'})
        except:
            return Response({'error': 'User not found'}, status=404)



def PredictView(request):
    context = {}
    if request.method == 'POST':
        try:
            # --- Desktop / Web ---
            img1 = request.FILES.get('image1')
            img2 = request.FILES.get('image2')

            # --- Mobile (base64) fallback ---
            if not img1 and not img2:
                img1_base64 = request.POST.get('image1_base64')
                img2_base64 = request.POST.get('image2_base64')

                if img1_base64 and img2_base64:
                    img1 = InMemoryUploadedFile(
                        BytesIO(base64.b64decode(img1_base64)),
                        None, 'image1.png', 'image/png', len(base64.b64decode(img1_base64)), None
                    )
                    img2 = InMemoryUploadedFile(
                        BytesIO(base64.b64decode(img2_base64)),
                        None, 'image2.png', 'image/png', len(base64.b64decode(img2_base64)), None
                    )
                else:
                    messages.error(request, "Upload both images")
                    return render(request, 'users/prediction.html')

            # Reset pointer
            img1.seek(0)
            img2.seek(0)

            # Compute similarity
            result = compute_similarity(preprocess(img1), preprocess(img2))

            context = {
                'result_text': result.get('result', 'ERROR'),
                'similarity': result.get('similarity', 0),
                'distance': result.get('distance', 0),
                'confidence': result.get('confidence', 0),
                'loss': round(result.get('distance', 0)**2, 6),
                'metrics': result.get('metrics', {}),
            }

        except Exception as e:
            messages.error(request, f"Prediction failed: {str(e)}")

    return render(request, 'users/prediction.html', context)


class SimulateTrainingView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            ctx = simulate_training()
            return Response(ctx)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ---------------------------------------------------------------------------
# TEMPLATE VIEWS
# ---------------------------------------------------------------------------

def index_view(request):
    return render(request, 'index.html')


def UserRegisterFormView(request):
    if request.method == 'POST':
        try:
            loginid = request.POST.get('loginid')

            if UserRegistrationModel.objects.filter(loginid=loginid).exists():
                messages.error(request, "Already exists")
                return render(request, 'UserRegistrations.html')

            UserRegistrationModel.objects.create(
                name=request.POST.get('name'),
                loginid=loginid,
                password=request.POST.get('password'),
                email=request.POST.get('email'),
                status='waiting'
            )

            messages.success(request, "Registered")
            return redirect('UserLogin')

        except Exception as e:
            messages.error(request, str(e))

    return render(request, 'UserRegistrations.html')


def UserLoginCheck(request):
    if request.method == 'POST':
        loginid = request.POST.get('loginid')
        password = request.POST.get('pswd')

        try:
            user = UserRegistrationModel.objects.get(loginid=loginid)

            if user.password != password:
                raise Exception()

            if user.status != 'activated':
                messages.error(request, "Not activated")
                return render(request, 'UserLogin.html')

            request.session['loginid'] = user.loginid
            return redirect('UserHome')

        except:
            messages.error(request, "Invalid login")

    return render(request, 'UserLogin.html')


def UserHome(request):
    if 'loginid' not in request.session:
        return redirect('UserLogin')
    return render(request, 'users/UserHomePage.html')


def logout_view(request):
    request.session.flush()
    return redirect('index')


def PredictView(request):
    context = {}
    if request.method == 'POST':
        try:
            img1 = request.FILES.get('image1')
            img2 = request.FILES.get('image2')

            if not img1 or not img2:
                messages.error(request, "Upload both images")
                return render(request, 'users/prediction.html')

            img1.seek(0)
            img2.seek(0)

            result = compute_similarity(preprocess(img1), preprocess(img2))

            # 👇 Unpack dict into template-friendly variables
            context = {
                'result_text': result.get('result', 'ERROR'),
                'similarity': result.get('similarity', 0),
                'distance': result.get('distance', 0),
                'confidence': result.get('confidence', 0),
                'loss': round(result.get('distance', 0)**2, 6),
                'metrics': result.get('metrics', {}),
            }

        except Exception as e:
            messages.error(request, f"Prediction failed: {str(e)}")

    return render(request, 'users/prediction.html', context)

def TrainView(request):
    context = {}

    if request.method == 'POST':
        try:
            context = simulate_training()
        except Exception as e:
            messages.error(request, str(e))

    return render(request, 'users/train_result.html', context)


# ---------------- FORGOT PASSWORD TEMPLATE ----------------

def forgot_password(request):
    if request.method == 'POST':
        email = request.POST.get('email')

        if UserRegistrationModel.objects.filter(email=email).exists():
            otp = random.randint(100000, 999999)
            otp_storage[email] = otp

            try:
                send_mail(
                    'Password Reset OTP',
                    f'Your OTP is: {otp}',
                    settings.DEFAULT_FROM_EMAIL,
                    [email]
                )
            except:
                pass

            request.session['reset_email'] = email
            return redirect('verify_otp')

        messages.error(request, 'Email not found')

    return render(request, 'users/forgot_password.html')


def verify_otp(request):
    if request.method == 'POST':
        otp = request.POST.get('otp')
        email = request.session.get('reset_email')

        if str(otp_storage.get(email)) == str(otp):
            return redirect('reset_password')

        messages.error(request, 'Invalid OTP')

    return render(request, 'users/verify_otp.html')


def reset_password_view(request):
    if request.method == 'POST':
        email = request.session.get('reset_email')
        new_password = request.POST.get('new_password')

        try:
            user = UserRegistrationModel.objects.get(email=email)
            user.password = new_password
            user.save()

            otp_storage.pop(email, None)

            messages.success(request, 'Password reset successful')
            return redirect('UserLogin')

        except:
            messages.error(request, 'User not found')

    return render(request, 'users/reset_password.html')