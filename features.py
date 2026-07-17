"""
features.py — Handcrafted image feature extraction for acne severity grading.

This is the lightweight, CPU-friendly baseline used in this project (see
README.md for why). It extracts features that correlate with visual acne
severity without needing a GPU:

  1. Color histogram (HSV)      — captures overall redness/inflammation tone
  2. Local Binary Pattern (LBP) — captures skin texture roughness from lesions
  3. Redness ratio               — proportion of pixels in an inflamed-red range
  4. Edge density (Canny)        — proxy for lesion boundary density
  5. Local contrast / std-dev    — texture variance, higher with more lesions

For the full deep-learning approach (EfficientNet-B0 + Grad-CAM/LIME/SHAP,
matching the reference paper), see train_cnn_efficientnet.py.
"""

import cv2
import numpy as np
from skimage.feature import local_binary_pattern

IMG_SIZE = 160  # resize target — small enough to be fast on CPU, large enough to keep texture signal
LBP_P = 8
LBP_R = 1


def load_and_preprocess(path: str) -> np.ndarray:
    """Load an image, correct color channel order, resize, and light-denoise."""
    img = cv2.imread(path)
    if img is None:
        raise ValueError(f"Could not read image: {path}")
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)
    img = cv2.GaussianBlur(img, (3, 3), 0)  # mirrors the paper's noise-reduction preprocessing step
    return img


def color_histogram_features(img_rgb: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)
    h_hist = cv2.calcHist([hsv], [0], None, [16], [0, 180]).flatten()
    s_hist = cv2.calcHist([hsv], [1], None, [8], [0, 256]).flatten()
    v_hist = cv2.calcHist([hsv], [2], None, [8], [0, 256]).flatten()
    hist = np.concatenate([h_hist, s_hist, v_hist])
    hist = hist / (hist.sum() + 1e-8)
    return hist


def lbp_texture_features(img_rgb: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    lbp = local_binary_pattern(gray, LBP_P, LBP_R, method="uniform")
    n_bins = LBP_P + 2
    hist, _ = np.histogram(lbp, bins=n_bins, range=(0, n_bins))
    hist = hist.astype(np.float64)
    hist = hist / (hist.sum() + 1e-8)
    return hist


def redness_features(img_rgb: np.ndarray) -> np.ndarray:
    r = img_rgb[:, :, 0].astype(np.float32)
    g = img_rgb[:, :, 1].astype(np.float32)
    b = img_rgb[:, :, 2].astype(np.float32)
    redness_map = r - (g + b) / 2.0
    mean_redness = redness_map.mean()
    redness_ratio = (redness_map > 35).mean()  # fraction of clearly inflamed-looking pixels
    return np.array([mean_redness / 255.0, redness_ratio])


def edge_texture_features(img_rgb: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 60, 150)
    edge_density = edges.mean() / 255.0
    local_std = gray.astype(np.float32).std() / 255.0
    return np.array([edge_density, local_std])


def extract_features(path: str) -> np.ndarray:
    """Full feature vector for one image path."""
    img = load_and_preprocess(path)
    feats = np.concatenate([
        color_histogram_features(img),
        lbp_texture_features(img),
        redness_features(img),
        edge_texture_features(img),
    ])
    return feats.astype(np.float32)


FEATURE_NAMES = (
    [f"hue_bin_{i}" for i in range(16)]
    + [f"sat_bin_{i}" for i in range(8)]
    + [f"val_bin_{i}" for i in range(8)]
    + [f"lbp_bin_{i}" for i in range(LBP_P + 2)]
    + ["mean_redness", "redness_ratio", "edge_density", "texture_std"]
)
