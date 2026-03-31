from PIL import Image
import numpy as np
import cv2
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
from .serializers import *

# ================= JWT =================
SECRET_KEY = settings.SECRET_KEY

def generate_token(user):
    payload = {
        'id': user.id,
        'loginid': user.loginid,
        'name': user.name,
        'exp': datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def decode_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except:
        return None

# ================= REGISTER =================
class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Registered successfully"}, status=201)
        return Response(serializer.errors, status=400)

# ================= LOGIN =================
class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        loginid = request.data.get("loginid")
        password = request.data.get("password")

        try:
            user = UserRegistrationModel.objects.get(loginid=loginid, password=password)
        except:
            return Response({"error": "Invalid credentials"}, status=401)

        if user.status != "activated":
            return Response({"error": "Not activated"}, status=403)

        token = generate_token(user)

        return Response({
            "token": token,
            "user": {"name": user.name, "loginid": user.loginid}
        })

# ================= OTP =================
otp_storage = {}

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not UserRegistrationModel.objects.filter(email=email).exists():
            return Response({"error": "Email not found"}, status=404)

        otp = random.randint(100000, 999999)
        otp_storage[email] = otp

        try:
            send_mail("OTP", f"Your OTP: {otp}", settings.DEFAULT_FROM_EMAIL, [email])
        except:
            pass

        return Response({"message": "OTP sent"})

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        if str(otp_storage.get(email)) == str(otp):
            return Response({"message": "OTP verified"})
        return Response({"error": "Invalid OTP"}, status=400)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        new_password = request.data.get("new_password")

        try:
            user = UserRegistrationModel.objects.get(email=email)
            user.password = new_password
            user.save()
            return Response({"message": "Password reset success"})
        except:
            return Response({"error": "User not found"}, status=404)

# ================= PREDICTION (FINAL FIX) =================
class PredictionView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request):

        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return Response({"error": "Login required"}, status=401)

        payload = decode_token(auth.split(" ")[1])
        if payload is None:
            return Response({"error": "Session expired"}, status=401)

        try:
            img1 = Image.open(request.FILES['image1']).convert('L')
            img2 = Image.open(request.FILES['image2']).convert('L')

            img1 = np.array(img1)
            img2 = np.array(img2)

            img1 = cv2.resize(img1, (300, 150))
            img2 = cv2.resize(img2, (300, 150))

            _, img1 = cv2.threshold(img1, 127, 255, cv2.THRESH_BINARY)
            _, img2 = cv2.threshold(img2, 127, 127, cv2.THRESH_BINARY)

            diff = cv2.absdiff(img1, img2)
            score = np.sum(diff) / (300 * 150)

            result = "Matched ✅" if score < 50 else "Not Matched ❌"

            return Response({
                "result": result,
                "score": float(score)
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)
            from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    SignatureSerializer
)

from .models import UserRegistrationModel
from .predictor import preprocess, compute_similarity

import jwt
from datetime import datetime, timedelta
from django.conf import settings

# ---------------- JWT ----------------
SECRET_KEY = settings.SECRET_KEY

def generate_token(user):
    payload = {
        'id': user.id,
        'loginid': user.loginid,
        'exp': datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def decode_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except:
        return None


# ---------------- REGISTER ----------------
class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Registered'}, status=201)
        return Response(serializer.errors, status=400)


# ---------------- LOGIN ----------------
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
        except:
            return Response({'error': 'Invalid credentials'}, status=401)

        return Response({
            'token': generate_token(user)
        })


# ---------------- PREDICT ----------------
class PredictionView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            img1_file = request.FILES['image1']
            img2_file = request.FILES['image2']

            img1 = preprocess(img1_file)
            img2 = preprocess(img2_file)

            result = compute_similarity(img1, img2)

            return Response(result, status=200)

        except Exception as e:
            return Response(
                {'error': f'Prediction failed: {str(e)}'},
                status=500
            )


# ---------------- TRAIN (DUMMY) ----------------
class SimulateTrainingView(APIView):
    def post(self, request):
        return Response({
            "trained": True,
            "accuracy": 95
        })