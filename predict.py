"""
predict.py — Classify a single acne image with the trained baseline model.

Run:
    python predict.py path/to/photo.jpg
"""

import sys

import joblib
import numpy as np

from features import extract_features

LABEL_NAMES = {0: "Clear", 1: "Mild", 2: "Moderate", 3: "Severe"}

# Absolute paths to the shared trained models
MODEL_PATH  = r"C:\Users\KIIT0001\OneDrive\Desktop\derma Ai\acne_severity_model.joblib"
SCALER_PATH = r"C:\Users\KIIT0001\OneDrive\Desktop\derma Ai\feature_scaler.joblib"


def predict(image_path: str):
    import os
    m_path = MODEL_PATH if os.path.exists(MODEL_PATH) else "acne_severity_model.joblib"
    s_path = SCALER_PATH if os.path.exists(SCALER_PATH) else "feature_scaler.joblib"
    clf    = joblib.load(m_path)
    scaler = joblib.load(s_path)

    feats   = extract_features(image_path).reshape(1, -1)
    feats_s = scaler.transform(feats)
    probs   = clf.predict_proba(feats_s)[0]
    pred    = int(np.argmax(probs))

    print(f"Predicted severity: {LABEL_NAMES[pred]}")
    print("Class probabilities:")
    for i, p in enumerate(probs):
        bar = "#" * int(p * 40)
        print(f"  {LABEL_NAMES[i]:10s} {p*100:5.1f}%  {bar}")
    return pred, probs


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py path/to/photo.jpg")
        sys.exit(1)
    predict(sys.argv[1])
