import numpy as np
import cv2
from PIL import Image

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

import jwt
from datetime import datetime, timedelta
from django.conf import settings

# JWT
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


# ===============================
# ✅ PREDICTION VIEW (FINAL FIX)
# ===============================
class PredictionView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request):

        # 🔐 Auth check
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return Response({'error': 'Login required'}, status=401)

        payload = decode_token(auth.split(' ')[1])
        if payload is None:
            return Response({'error': 'Session expired'}, status=401)

        try:
            # ✅ Read images directly (NO FILE SAVE)
            img1 = Image.open(request.FILES['image1']).convert('L')
            img2 = Image.open(request.FILES['image2']).convert('L')

            img1 = np.array(img1)
            img2 = np.array(img2)

            # ✅ Resize
            img1 = cv2.resize(img1, (300, 150))
            img2 = cv2.resize(img2, (300, 150))

            # ✅ Threshold
            _, img1 = cv2.threshold(img1, 127, 255, cv2.THRESH_BINARY)
            _, img2 = cv2.threshold(img2, 127, 255, cv2.THRESH_BINARY)

            # ✅ Difference
            diff = cv2.absdiff(img1, img2)
            score = np.sum(diff) / (300 * 150)

            # ✅ Result
            if score < 50:
                result = "Matched ✅"
            else:
                result = "Not Matched ❌"

            return Response({
                "result": result,
                "score": float(score)
            }, status=200)

        except Exception as e:
            return Response({
                "error": f"Prediction failed: {str(e)}"
            }, status=500)