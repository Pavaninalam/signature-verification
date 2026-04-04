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

# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------
SECRET_KEY     = settings.SECRET_KEY
JWT_EXPIRY_HRS = 24


def generate_token(user):
    payload = {
        'id':      user.id,
        'loginid': user.loginid,
        'name':    user.name,
        'exp':     datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HRS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def decode_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


# ---------------------------------------------------------------------------
# In-memory OTP store
# ---------------------------------------------------------------------------
otp_storage = {}


# ---------------------------------------------------------------------------
# Image save helper
# ---------------------------------------------------------------------------

def save_uploaded_image(image_file, name):
    save_path = os.path.join(settings.MEDIA_ROOT, name)
    image_file.seek(0)
    with open(save_path, 'wb') as f:
        for chunk in image_file.chunks():
            f.write(chunk)
    return f'{settings.MEDIA_URL}{name}'


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

class UserRegisterView(APIView):
    """POST /api/users/register/"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Registration successful. Please wait for admin activation.'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """POST /api/users/login/"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        loginid  = serializer.validated_data['loginid'].strip()
        password = serializer.validated_data['password']

        try:
            user = UserRegistrationModel.objects.get(loginid=loginid)
        except UserRegistrationModel.DoesNotExist:
            return Response({'error': 'Invalid login ID or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Support both plain-text passwords (legacy) and check directly
        if user.password != password:
            return Response({'error': 'Invalid login ID or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if user.status != 'activated':
            return Response(
                {'error': 'Your account has not been activated yet. Please contact admin.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response({
            'token': generate_token(user),
            'user':  {'id': user.id, 'name': user.name, 'loginid': user.loginid, 'email': user.email},
        }, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    """POST /api/users/forgot-password/"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        if not UserRegistrationModel.objects.filter(email=email).exists():
            return Response({'error': 'No account found with this email address.'}, status=status.HTTP_404_NOT_FOUND)

        otp = random.randint(100000, 999999)
        otp_storage[email] = otp
        try:
            send_mail('Password Reset OTP', f'Your OTP is: {otp}',
                      settings.DEFAULT_FROM_EMAIL, [email])
        except Exception:
            pass  # don't crash if email fails

        return Response({'message': 'OTP sent to your email address.'}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    """POST /api/users/verify-otp/"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email      = serializer.validated_data['email']
        otp_in     = serializer.validated_data['otp']
        stored     = otp_storage.get(email)

        if stored and str(stored) == str(otp_in):
            return Response({'message': 'OTP verified successfully.'}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    """POST /api/users/reset-password/"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email    = serializer.validated_data['email']
        new_pass = serializer.validated_data['new_password']

        try:
            user = UserRegistrationModel.objects.get(email=email)
            user.password = new_pass
            user.save()
            otp_storage.pop(email, None)
            return Response({'message': 'Password reset successful.'}, status=status.HTTP_200_OK)
        except UserRegistrationModel.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class PredictionView(APIView):
    """POST /api/users/predict/"""
    parser_classes     = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request):
        # JWT check — clear error message so frontend can show it properly
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return Response(
                {'error': 'Session expired. Please log in again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        payload = decode_token(auth.split(' ')[1])
        if payload is None:
            return Response(
                {'error': 'Session expired. Please log in again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        # Reject admin tokens on user prediction endpoint
        if payload.get('role') == 'admin':
            return Response(
                {'error': 'Please log in as a user, not admin.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = SignatureSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            img1_file = request.FILES['image1']
            img2_file = request.FILES['image2']

            img1 = preprocess(img1_file)
            img2 = preprocess(img2_file)

            sim  = compute_similarity(img1, img2)
            loss = round(float(sim['distance'] ** 2), 6)

            img1_url = save_uploaded_image(img1_file, 'image1.png')
            img2_url = save_uploaded_image(img2_file, 'image2.png')

            return Response({
                'result':     sim['result'],
                'distance':   sim['distance'],
                'similarity': sim['similarity'],
                'confidence': sim['confidence'],
                'loss':       loss,
                'metrics':    sim['metrics'],
                'img1_url':   img1_url,
                'img2_url':   img2_url,
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Prediction failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SimulateTrainingView(APIView):
    """POST /api/users/train/"""
    permission_classes = [AllowAny]

    def _auth(self, request):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return None
        return decode_token(auth.split(' ')[1])

    def get(self, request):
        if not self._auth(request):
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({'message': 'Send a POST request to start training simulation.'})

    def post(self, request):
        if not self._auth(request):
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            ctx = simulate_training()
            return Response({
                'trained':       ctx['trained'],
                'dataset_paths': ctx['dataset_paths'],
                'accuracy':      ctx['accuracy'],
                'precision':     ctx['precision'],
                'recall':        ctx['recall'],
                'auc':           ctx['auc'],
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Training simulation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── Template-based web UI views ───────────────────────────────────────────────

def index_view(request):
    return render(request, 'index.html')


def UserRegisterFormView(request):
    if request.method == 'POST':
        try:
            loginid = request.POST.get('loginid', '').strip()
            if UserRegistrationModel.objects.filter(loginid=loginid).exists():
                messages.error(request, 'Login ID already taken. Choose another.')
                return render(request, 'UserRegistrations.html')
            user = UserRegistrationModel(
                name=request.POST.get('name', ''),
                loginid=loginid,
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
        loginid  = request.POST.get('loginid', '').strip()
        password = request.POST.get('pswd', '')
        try:
            user = UserRegistrationModel.objects.get(loginid=loginid)
            if user.password != password:
                raise UserRegistrationModel.DoesNotExist
            if user.status != 'activated':
                messages.error(request, 'Account not activated. Contact admin.')
                return render(request, 'UserLogin.html')
            request.session['loginid'] = user.loginid
            request.session['user_id'] = user.id
            request.session['name']    = user.name
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
    if request.method == 'POST':
        try:
            img1_file = request.FILES.get('image1')
            img2_file = request.FILES.get('image2')

        # mobile fix
            if img1_file:
                img1_file.seek(0)
            if img2_file:
                img2_file.seek(0)

            if not img1_file or not img2_file:
                messages.error(request, 'Please upload both images.')
                return render(request, 'users/prediction.html')

        # format check
            if not img1_file.name.lower().endswith(('.png', '.jpg', '.jpeg')):
                messages.error(request, "Upload JPG/PNG images only")
                return render(request, 'users/prediction.html')

            if not img2_file.name.lower().endswith(('.png', '.jpg', '.jpeg
def TrainView(request):
    if 'loginid' not in request.session:
        return redirect('UserLogin')
    context = {}
    if request.method == 'POST':
        try:
            ctx = simulate_training()
            context.update({
                'trained':    ctx['trained'],
                'accuracy':   round(ctx['accuracy'] * 100, 2),
                'precision':  round(ctx['precision'] * 100, 2),
                'recall':     round(ctx['recall'] * 100, 2),
                'auc':        round(ctx['auc'] * 100, 2),
                'graph_url':       ctx.get('graph_url', ''),
                'confusion_url':   ctx.get('confusion_url', ''),
            })
        except Exception as e:
            messages.error(request, f'Training error: {str(e)}')
    return render(request, 'users/train_result.html', context)


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
        otp   = request.POST.get('otp', '')
        email = request.session.get('reset_email', '')
        if otp_storage.get(email) and str(otp_storage[email]) == otp:
            return redirect('reset_password')
        messages.error(request, 'Invalid OTP.')
    return render(request, 'users/verify_otp.html')


def reset_password_view(request):
    if request.method == 'POST':
        email        = request.session.get('reset_email', '')
        new_password = request.POST.get('new_password', '')
        try:
            user          = UserRegistrationModel.objects.get(email=email)
            user.password = new_password
            user.save()
            otp_storage.pop(email, None)
            messages.success(request, 'Password reset successful.')
            return redirect('UserLogin')
        except UserRegistrationModel.DoesNotExist:
            messages.error(request, 'User not found.')
    return render(request, 'users/reset_password.html')
