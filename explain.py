"""
explain.py — Explainability for the baseline acne severity classifier.

Uses LIME (Local Interpretable Model-agnostic Explanations) to highlight
which image regions (superpixels) most influenced a prediction — the same
technique used in the reference paper's Tri-Layer XAI framework, applied
here to our Random Forest baseline since it doesn't have internal
gradients for Grad-CAM.

Run:
    python explain.py path/to/image.jpg
Produces: <image_name>_lime_explanation.png
"""

import sys

import cv2
import joblib
import numpy as np
from lime import lime_image
from skimage.segmentation import mark_boundaries

from features import (
    color_histogram_features,
    edge_texture_features,
    lbp_texture_features,
    redness_features,
    IMG_SIZE,
)

LABEL_NAMES = {0: "Clear", 1: "Mild", 2: "Moderate", 3: "Severe"}

# Absolute path to the shared trained models (loaded from the original derma Ai folder)
MODEL_PATH  = r"C:\Users\KIIT0001\OneDrive\Desktop\derma Ai\acne_severity_model.joblib"
SCALER_PATH = r"C:\Users\KIIT0001\OneDrive\Desktop\derma Ai\feature_scaler.joblib"


def features_from_array(img_rgb: np.ndarray) -> np.ndarray:
    """Same feature pipeline as features.extract_features, but starting
    from an in-memory RGB array (LIME feeds us perturbed image arrays
    rather than file paths)."""
    img = cv2.resize(img_rgb, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)
    img = cv2.GaussianBlur(img, (3, 3), 0)
    feats = np.concatenate([
        color_histogram_features(img),
        lbp_texture_features(img),
        redness_features(img),
        edge_texture_features(img),
    ])
    return feats.astype(np.float32)


def load_model():
    import os
    m_path = MODEL_PATH if os.path.exists(MODEL_PATH) else "acne_severity_model.joblib"
    s_path = SCALER_PATH if os.path.exists(SCALER_PATH) else "feature_scaler.joblib"
    clf    = joblib.load(m_path)
    scaler = joblib.load(s_path)
    return clf, scaler


def explain_image(image_path: str, out_path: str | None = None):
    clf, scaler = load_model()

    img_bgr = cv2.imread(image_path)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_rgb = cv2.resize(img_rgb, (256, 256))  # LIME works on this display resolution

    def predict_fn(images: np.ndarray) -> np.ndarray:
        feats = np.vstack([features_from_array(im) for im in images])
        feats_s = scaler.transform(feats)
        return clf.predict_proba(feats_s)

    explainer = lime_image.LimeImageExplainer()
    explanation = explainer.explain_instance(
        img_rgb,
        predict_fn,
        top_labels=1,
        hide_color=0,
        num_samples=300,  # kept modest for CPU speed; raise for higher-fidelity explanations
    )

    pred_probs = predict_fn(np.array([img_rgb]))[0]
    pred_label = int(np.argmax(pred_probs))

    temp, mask = explanation.get_image_and_mask(
        pred_label, positive_only=True, num_features=8, hide_rest=False
    )
    overlay = mark_boundaries(temp / 255.0, mask)

    out_path = out_path or (image_path.rsplit(".", 1)[0] + "_lime_explanation.png")
    cv2.imwrite(out_path, cv2.cvtColor((overlay * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))

    print(f"Prediction: {LABEL_NAMES[pred_label]}  (confidence {pred_probs[pred_label]*100:.1f}%)")
    print("Class probabilities:")
    for i, p in enumerate(pred_probs):
        print(f"  {LABEL_NAMES[i]:10s} {p*100:5.1f}%")
    print(f"Saved explanation image to: {out_path}")
    return pred_label, pred_probs, out_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python explain.py path/to/image.jpg")
        sys.exit(1)
    explain_image(sys.argv[1])
