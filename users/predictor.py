import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim_metric


def preprocess(image_file):
    """Read uploaded image → grayscale uint8 (300x150) with thresholding."""
    image_file.seek(0)
    file_bytes = np.frombuffer(image_file.read(), np.uint8)
    image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Cannot decode image. Upload a valid PNG or JPG file.")
    image = cv2.resize(image, (300, 150))
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    return gray


def compute_similarity(img1, img2):
    """
    Compare two preprocessed images.

    Returns a dict with:
      result     : "Match" or "No Match"   ← matches frontend check exactly
      similarity : float [0, 1]            ← frontend multiplies by 100 for display
      distance   : float [0, 1]            ← 0 = identical, 1 = completely different
      confidence : "High" / "Medium" / "Low"
      loss       : float (distance squared)
      metrics    : { ssim: float }
    """
    img1 = cv2.resize(img1, (300, 150))
    img2 = cv2.resize(img2, (300, 150))

    if len(img1.shape) == 3:
        img1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    if len(img2.shape) == 3:
        img2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

    # SSIM — range [-1, 1], clamp to [0, 1]
    score, _ = ssim_metric(img1, img2, full=True)
    ssim_score = float(max(0.0, min(1.0, score)))

    # MSE normalised to [0, 1]
    mse = float(np.mean((img1.astype("float32") - img2.astype("float32")) ** 2))
    distance = round(mse / (255.0 ** 2), 6)

    # Similarity in [0, 1] — frontend does `(similarity * 100).toFixed(1)` for display
    similarity = round(ssim_score, 6)

    # Loss
    loss = round(distance ** 2, 6)

    # Decision: SSIM >= 0.75 AND distance < 0.08 → Match
    is_match = ssim_score >= 0.75 and distance < 0.08

    # Confidence
    margin = abs(ssim_score - 0.75)
    if margin >= 0.15:
        confidence = "High"
    elif margin >= 0.07:
        confidence = "Medium"
    else:
        confidence = "Low"

    return {
        "result":     "Match" if is_match else "No Match",
        "similarity": similarity,
        "distance":   distance,
        "confidence": confidence,
        "loss":       loss,
        "metrics": {
            "ssim":            round(ssim_score, 4),
            "model_available": False,
            "model_distance":  None,
        },
    }
