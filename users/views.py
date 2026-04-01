import random
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import logout
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
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from .predictor import preprocess, compute_similarity

SECRET_KEY = settings.SECRET_KEY
otp_storage = {}


def generate_token(user):
    payload = {
        'id': user.id,
        'loginid': user.loginid,
        'exp': datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


# ── Template views ────────────────────────────────────────────────────────────

def index_view(request):
    return render(request, 'index.html')


def UserRegisterFormView(request):
    if request.method == 'POST':
        try:
            user = UserRegistrationModel(
                name=request.POST.get('name', ''),
                loginid=request.POST.get('loginid', ''),
                password=request.POST.get('password', ''),
                mobile=request.POST.get('mobile', ''),
                email=request.POST.get('email', ''),
                locality=request.POST.get('locality', ''),
                address=request.POST.get('address', ''),
                city=request.POST.get('city', ''),
                state=request.POST.get('state', ''),
                status='waiting',
            )
            user.save()
            messages.success(request, 'Registration successful! Please wait for admin activation.')
            return redirect('UserLogin')
        except Exception as e:
            messages.error(request, f'Registration failed: {str(e)}')
    return render(request, 'UserRegistrations.html')


def UserLoginCheck(request):
    if request.method == 'POST':
        loginid = request.POST.get('loginid', '')
        password = request.POST.get('pswd', '')
        try:
            user = UserRegistrationModel.objects.get(loginid=loginid, password=password)
            if user.status != 'activated':
                messages.error(request, 'Account not activated. Contact admin.')
                return render(request, 'UserLogin.html')
            request.session['loginid'] = user.loginid
            request.session['user_id'] = user.id
            request.session['name'] = user.name
            return redirect('UserHome')
        except UserRegistrationModel.DoesNotExist:
            messages.error(request, 'Invalid login ID or password.')
    return render(request, 'UserLogin.html')


def UserHome(request):
    if 'loginid' not in request.session:
        return redirect('UserLogin')
    return render(request, 'users/UserHomePage.html', {'name': request.session.get('name', '')})


def logout_view(request):
    request.session.flush()
    return redirect('index')


def PredictView(request):
    if 'loginid' not in request.session:
        return redirect('UserLogin')

    result = None
    if request.method == 'POST':
        try:
            img1_file = request.FILES.get('image1')
            img2_file = request.FILES.get('image2')
            if not img1_file or not img2_file:
                messages.error(request, 'Please upload both images.')
            else:
                img1 = preprocess(img1_file)
                img2 = preprocess(img2_file)
                result = compute_similarity(img1, img2)
        except Exception as e:
            messages.error(request, f'Prediction error: {str(e)}')

    return render(request, 'users/prediction.html', {'result': result})


def forgot_password(request):
    if request.method == 'POST':
        email = request.POST.get('email', '')
        if UserRegistrationModel.objects.filter(email=email).exists():
            otp = random.randint(100000, 999999)
            otp_storage[email] = otp
            try:
                send_mail('Password Reset OTP', f'Your OTP is: {otp}',
                          settings.DEFAULT_FROM_EMAIL, [email])
            except Exception:
                pass
            request.session['reset_email'] = email
            return redirect('verify_otp')
        messages.error(request, 'Email not found.')
    return render(request, 'users/forgot_password.html')


def verify_otp(request):
    if request.method == 'POST':
        otp = request.POST.get('otp', '')
        email = request.session.get('reset_email', '')
        if otp_storage.get(email) and str(otp_storage[email]) == otp:
            return redirect('reset_password')
        messages.error(request, 'Invalid OTP.')
    return render(request, 'users/verify_otp.html')


def reset_password_view(request):
    if request.method == 'POST':
        email = request.session.get('reset_email', '')
        new_password = request.POST.get('new_password', '')
        try:
            user = UserRegistrationModel.objects.get(email=email)
            user.password = new_password
            user.save()
            otp_storage.pop(email, None)
            messages.success(request, 'Password reset successful.')
            return redirect('UserLogin')
        except UserRegistrationModel.DoesNotExist:
            messages.error(request, 'User not found.')
    return render(request, 'users/reset_password.html')


# ── DRF API views ─────────────────────────────────────────────────────────────

class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Registered successfully'}, status=201)
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
            user = UserRegistrationModel.objects.get(loginid=loginid, password=password)
        except UserRegistrationModel.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=401)

        if user.status != 'activated':
            return Response({'error': 'Account not activated'}, status=403)

        return Response({'token': generate_token(user), 'user': {'id': user.id, 'name': user.name, 'loginid': user.loginid}})


class PredictionView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            img1_file = request.FILES.get('image1')
            img2_file = request.FILES.get('image2')

            if not img1_file or not img2_file:
                return Response({'error': 'Both images required'}, status=400)

            img1 = preprocess(img1_file)
            img2 = preprocess(img2_file)
            result = compute_similarity(img1, img2)

            return Response(result, status=200)
        except Exception as e:
            return Response({'error': f'Prediction failed: {str(e)}'}, status=500)
