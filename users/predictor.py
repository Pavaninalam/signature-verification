from PIL import Image
import numpy as np
import cv2
from django.http import JsonResponse

def verify_signature(request):
    if request.method == "POST":
        try:
            # ✅ Read images from request (NO FILE SAVE)
            img1 = Image.open(request.FILES['image1']).convert('L')
            img2 = Image.open(request.FILES['image2']).convert('L')

            img1 = np.array(img1)
            img2 = np.array(img2)

            # ✅ Resize to same size
            img1 = cv2.resize(img1, (300, 150))
            img2 = cv2.resize(img2, (300, 150))

            # ✅ Threshold (binary)
            _, img1 = cv2.threshold(img1, 127, 255, cv2.THRESH_BINARY)
            _, img2 = cv2.threshold(img2, 127, 255, cv2.THRESH_BINARY)

            # ✅ Similarity (simple difference)
            diff = cv2.absdiff(img1, img2)
            score = np.sum(diff) / (300 * 150)

            # ✅ Decision
            if score < 50:
                result = "Matched ✅"
            else:
                result = "Not Matched ❌"

            return JsonResponse({
                "result": result,
                "score": float(score)
            })

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)