def preprocess(image_file):
    import cv2
    import numpy as np

    try:
        # ✅ FIX 1: reset pointer
        image_file.seek(0)

        # ✅ FIX 2: read safely
        file_bytes = np.frombuffer(image_file.read(), np.uint8)

        # Decode image
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if image is None:
            raise ValueError("Invalid image format or corrupted file")

        # Resize
        image = cv2.resize(image, (300, 150))

        # Grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Threshold
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)

        return thresh

    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {str(e)}")

def compute_similarity(img1, img2):
    import numpy as np
    import cv2
    from skimage.metrics import structural_similarity as ssim

    try:
        # Resize images to same size
        img1 = cv2.resize(img1, (300, 150))
        img2 = cv2.resize(img2, (300, 150))

        # Convert to grayscale
        if len(img1.shape) == 3:
            img1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
        if len(img2.shape) == 3:
            img2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

        # -----------------------------
        # 1. SSIM (Structural Similarity)
        # -----------------------------
        score, _ = ssim(img1, img2, full=True)
        ssim_score = float(score)  # 0 to 1

        # -----------------------------
        # 2. MSE (Mean Squared Error)
        # -----------------------------
        mse = np.mean((img1.astype("float") - img2.astype("float")) ** 2)

        # Normalize distance
        distance = mse / (255.0 * 255.0)

        # -----------------------------
        # 3. Similarity %
        # -----------------------------
        similarity = ssim_score * 100

        # -----------------------------
        # 4. Confidence Score
        # -----------------------------
        confidence = similarity - (distance * 50)

        # -----------------------------
        # 🔥 FINAL DECISION (FIXED)
        # -----------------------------
        if similarity >= 80 and distance < 0.10:
            result = "MATCH  ✅"
        else:
            result = "NOT MATCH  ❌"

        return {
            "result": result,
            "similarity": round(similarity, 2),
            "distance": round(distance, 4),
            "confidence": round(confidence, 2),
            "metrics": {
                "ssim": round(ssim_score, 4),
                "mse": round(float(mse), 4),
            }
        }

    except Exception as e:
        return {
            "result": "ERROR",
            "similarity": 0,
            "distance": 0,
            "confidence": 0,
            "metrics": {},
            "error": str(e)
        }