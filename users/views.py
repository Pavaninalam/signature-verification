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


# ---------------- REGISTER ----------------
class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Registered successfully'}, status=201)
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
            img1_file = request.FILES.get('image1')
            img2_file = request.FILES.get('image2')

            if not img1_file or not img2_file:
                return Response({'error': 'Both images required'}, status=400)

            img1 = preprocess(img1_file)
            img2 = preprocess(img2_file)

            result = compute_similarity(img1, img2)

            return Response(result, status=200)

        except Exception as e:
            return Response(
                {'error': f'Prediction failed: {str(e)}'},
                status=500
            )


# ---------------- TRAIN ----------------
class SimulateTrainingView(APIView):
    def post(self, request):
        return Response({
            "trained": True,
            "accuracy": 95
        })