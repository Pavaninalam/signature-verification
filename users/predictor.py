# users/predictor.py

import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim

# ------------------------------
# Helper: Convert np types to float
# ------------------------------
def to_float(val):
    if isinstance(val, (np.float32, np.float64, np.int32, np.int64)):
        return float(val)
    return val

def convert_np(obj):
    """Recursively convert NumPy types in dict/list to Python float/int."""
    if isinstance(obj, dict):
        return {k: convert_np(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_np(x) for x in obj]
    else:
        return to_float(obj)

# ------------------------------
# Preprocess image
# ------------------------------
def preprocess(image_file):
    """
    Preprocess uploaded image for signature verification.
    Steps: read, resize, grayscale, threshold.
    """
    try:
        # Reset pointer
        image_file.seek(0)

        # Read bytes safely
        file_bytes = np.frombuffer(image_file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if image is None:
            raise ValueError("Invalid image format or corrupted file")

        # Resize to consistent dimensions
        image = cv2.resize(image, (300, 150))

        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Threshold (invert for black ink)
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)

        return thresh

    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {str(e)}")

# ------------------------------
# Compute similarity between two images
# ------------------------------
def compute_similarity(img1, img2):
    """
    Compare two preprocessed images and return:
    - SSIM, MSE, distance, similarity %, confidence
    - Final decision: MATCH or NOT MATCH
    """
    try:
        # Ensure same size
        img1 = cv2.resize(img1, (300, 150))
        img2 = cv2.resize(img2, (300, 150))

        # Convert to grayscale if needed
        if len(img1.shape) == 3:
            img1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
        if len(img2.shape) == 3:
            img2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

        # 1️⃣ SSIM
        score, _ = ssim(img1, img2, full=True)
        ssim_score = float(score)

        # 2️⃣ MSE
        mse = np.mean((img1.astype("float") - img2.astype("float")) ** 2)

        # 3️⃣ Normalized distance
        distance = mse / (255.0 * 255.0)

        # 4️⃣ Similarity %
        similarity = ssim_score * 100

        # 5️⃣ Confidence score
        confidence = similarity - (distance * 50)

        # 6️⃣ Final decision
        if similarity >= 80 and distance < 0.10:
            result = "MATCH ✅"
        else:
            result = "NOT MATCH ❌"

        # Prepare JSON
        sim_dict = {
            "result": result,
            "similarity": round(similarity, 2),
            "distance": round(distance, 4),
            "confidence": round(confidence, 2),
            "metrics": {
                "ssim": round(ssim_score, 4),
                "mse": round(float(mse), 4),
            }
        }

        # Convert all NumPy types to float
        sim_dict = convert_np(sim_dict)

        return sim_dict

    except Exception as e:
        return {
            "result": "ERROR",
            "similarity": 0,
            "distance": 0,
            "confidence": 0,
            "metrics": {},
            "error": str(e)
        }