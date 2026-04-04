"""
users/views.py
DRF API views + template-based web UI views.
"""
import os
import random

from django.shortcuts import render, redirect
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

import jwt
from datetime import datetime, timedelta

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


# ================= SAVE IMAGE =================
def save_uploaded_image(image_file, name):
    path = os.path.join(settings.MEDIA_ROOT, name)
    image_file.seek(0)
    with open(path, 'wb') as f:
        for chunk in image_file.chunks():
            f.write(chunk)
    return f"{settings.MEDIA_URL}{name}"


# ================= API =================

class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Registered successfully"}, status=201)
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

            if user.password != password:
                raise Exception()

            if user.status != "activated":
                return Response({"error": "Not activated"}, status=403)

            return Response({
                "token": generate_token(user),
                "user": {"id": user.id, "name": user.name}
            })

        except:
            return Response({"error": "Invalid login"}, status=401)


class PredictionView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            img1_file = request.FILES.get('image1')
            img2_file = request.FILES.get('image2')

            if not img1_file or not img2_file:
                return Response({"error": "Upload both images"}, status=400)

            # MOBILE FIX
            img1_file.seek(0)
            img2_file.seek(0)

            # FORMAT CHECK
            if not img1_file.name.lower().endswith(('.png', '.jpg', '.jpeg')):
                return Response({"error": "Only JPG/PNG allowed"}, status=400)

            if not img2_file.name.lower().endswith(('.png', '.jpg', '.jpeg')):
                return Response({"error": "Only JPG/PNG allowed"}, status=400)

            img1 = preprocess(img1_file)
            img2 = preprocess(img2_file)

            sim = compute_similarity(img1, img2)

            img1_url = save_uploaded_image(img1_file, "img1.png")
            img2_url = save_uploaded_image(img2_file, "img2.png")

            return Response({
                "result": sim['result'],
                "similarity": sim['similarity'],
                "confidence": sim['confidence'],
                "img1": img1_url,
                "img2": img2_url
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class SimulateTrainingView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            ctx = simulate_training()
            return Response(ctx)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


# ================= TEMPLATE VIEWS =================

def index_view(request):
    return render(request, 'index.html')


def UserRegisterFormView(request):
    if request.method == "POST":
        try:
            loginid = request.POST.get('loginid')

            if UserRegistrationModel.objects.filter(loginid=loginid).exists():
                messages.error(request, "User exists")
                return render(request, 'UserRegistrations.html')

            user = UserRegistrationModel(
                name=request.POST.get('name'),
                loginid=loginid,
                password=request.POST.get('password'),
                email=request.POST.get('email'),
                status='waiting'
            )
            user.save()

            messages.success(request, "Registered successfully")
            return redirect('UserLogin')

        except Exception as e:
            messages.error(request, str(e))

    return render(request, 'UserRegistrations.html')


def UserLogin(request):
    return render(request, 'UserLogin.html')


def UserLoginCheck(request):
    if request.method == "POST":
        try:
            user = UserRegistrationModel.objects.get(
                loginid=request.POST.get('loginid'),
                password=request.POST.get('pswd')
            )

            if user.status != "activated":
                messages.error(request, "Not activated")
                return redirect('UserLogin')

            request.session['loginid'] = user.loginid
            return redirect('UserHome')

        except:
            messages.error(request, "Invalid login")

    return render(request, 'UserLogin.html')


def UserHome(request):
    return render(request, 'users/UserHomePage.html')


def logout_view(request):
    request.session.flush()
    return redirect('index')


def PredictView(request):
    if request.method == "POST":
        try:
            img1 = request.FILES.get('image1')
            img2 = request.FILES.get('image2')

            if not img1 or not img2:
                messages.error(request, "Upload both images")
                return render(request, 'users/prediction.html')

            img1.seek(0)
            img2.seek(0)

            img1_p = preprocess(img1)
            img2_p = preprocess(img2)

            sim = compute_similarity(img1_p, img2_p)

            return render(request, 'users/prediction.html', {
                "result": sim['result'],
                "similarity": sim['similarity']
            })

        except Exception as e:
            messages.error(request, str(e))

    return render(request, 'users/prediction.html')


def TrainView(request):
    context = {}
    if request.method == "POST":
        try:
            ctx = simulate_training()
            context = ctx
        except Exception as e:
            messages.error(request, str(e))

    return render(request, 'users/train_result.html', context)