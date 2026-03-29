"""
users/views.py
Django REST Framework API views.
Prediction is handled by users/predictor.py.
"""
import os
import random

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

        loginid  = serializer.validated_data['loginid']
        password = serializer.validated_data['password']

        try:
            user = UserRegistrationModel.objects.get(loginid=loginid, password=password)
        except UserRegistrationModel.DoesNotExist:
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
