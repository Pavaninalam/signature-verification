from PIL import Image
import numpy as np
import cv2

def preprocess(image_file):
    img = Image.open(image_file).convert('L')
    img = np.array(img)
    img = cv2.resize(img, (300, 150))
    _, img = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)
    return img


def compute_similarity(img1, img2):
    diff = cv2.absdiff(img1, img2)
    score = np.sum(diff) / (300 * 150)

    if score < 50:
        result = "Matched ✅"
    else:
        result = "Not Matched ❌"

    return {
        "result": result,
        "distance": float(score),
        "similarity": float(100 - score),
        "confidence": float(max(0, 100 - score)),
        "metrics": {"diff_score": float(score)}
    }