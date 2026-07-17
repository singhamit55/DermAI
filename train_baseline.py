"""
train_baseline.py — Train and evaluate the acne severity classifier.

Pipeline:
  1. Read the pre-split train/val/test folder structure
     (level0=Clear, level1=Mild, level2=Moderate, level3=Severe).
  2. Extract handcrafted features for every image (features.py).
  3. Train a class-balanced Random Forest.
  4. Report accuracy, per-class precision/recall/F1, and a confusion matrix.
  5. Save the trained model + a feature scaler to disk with joblib.

NOTE: The trained model files (acne_severity_model.joblib, feature_scaler.joblib)
already exist in the 'derma Ai' project folder. Only run this script if you
have the ACNE04 dataset available locally in train/val/test subdirectories.

Run:
    python train_baseline.py
"""

import csv
import json
import os
import time

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.preprocessing import StandardScaler

from features import extract_features, FEATURE_NAMES

LABEL_NAMES = {0: "Clear", 1: "Mild", 2: "Moderate", 3: "Severe"}


def load_dataset(root_dir):
    """Scans the level0 / level1 / level2 / level3 structure and returns paths and labels."""
    paths, labels = [], []
    class_folders = {"level0": 0, "level1": 1, "level2": 2, "level3": 3}
    for folder, label in class_folders.items():
        folder_path = os.path.join(root_dir, folder)
        if not os.path.isdir(folder_path):
            continue
        for fname in os.listdir(folder_path):
            if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                paths.append(os.path.join(folder_path, fname))
                labels.append(label)
    return paths, labels


def build_feature_matrix(paths):
    feats = []
    t0 = time.time()
    for i, p in enumerate(paths):
        feats.append(extract_features(p))
        if (i + 1) % 200 == 0:
            print(f"  extracted {i+1}/{len(paths)} images ({time.time()-t0:.1f}s elapsed)")
    print(f"Feature extraction done: {len(paths)} images in {time.time()-t0:.1f}s")
    return np.vstack(feats)


def main():
    print("Loading pre-split dataset index (train, val, test)...")
    train_paths, train_labels = load_dataset("train")
    val_paths,   val_labels   = load_dataset("val")
    test_paths,  test_labels  = load_dataset("test")

    print(f"Total train images: {len(train_paths)}")
    print(f"Total val images:   {len(val_paths)}")
    print(f"Total test images:  {len(test_paths)}")

    if len(train_paths) == 0 or len(val_paths) == 0:
        raise ValueError(
            "Dataset directories 'train', 'val', or 'test' are empty or missing 'level0-3' subfolders."
        )

    print("Extracting handcrafted features for train...")
    X_train = build_feature_matrix(train_paths)
    y_train = np.array(train_labels)

    print("Extracting handcrafted features for val...")
    X_val = build_feature_matrix(val_paths)
    y_val = np.array(val_labels)

    print("Extracting handcrafted features for test...")
    X_test = build_feature_matrix(test_paths)
    y_test = np.array(test_labels)

    scaler     = StandardScaler()
    X_train_s  = scaler.fit_transform(X_train)
    X_val_s    = scaler.transform(X_val)
    X_test_s   = scaler.transform(X_test)

    print("Training Random Forest classifier (class-balanced)...")
    clf = RandomForestClassifier(
        n_estimators=400,
        max_depth=None,
        min_samples_leaf=2,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42,
    )
    clf.fit(X_train_s, y_train)

    def evaluate(name, X_split, y_split):
        preds  = clf.predict(X_split)
        acc    = accuracy_score(y_split, preds)
        report = classification_report(
            y_split, preds,
            target_names=[LABEL_NAMES[i] for i in sorted(LABEL_NAMES)],
            output_dict=True, zero_division=0,
        )
        cm = confusion_matrix(y_split, preds)
        print(f"\n=== {name} ===")
        print(f"Accuracy: {acc*100:.1f}%")
        print(classification_report(
            y_split, preds,
            target_names=[LABEL_NAMES[i] for i in sorted(LABEL_NAMES)],
            zero_division=0,
        ))
        print("Confusion matrix (rows=true, cols=pred):")
        print(cm)
        return acc, report, cm

    val_acc,  val_report,  val_cm  = evaluate("Validation set",   X_val_s,  y_val)
    test_acc, test_report, test_cm = evaluate("Held-out test set", X_test_s, y_test)

    # Feature importance (global explainability for this model)
    importances = clf.feature_importances_
    top_idx     = np.argsort(importances)[::-1][:10]
    print("\nTop 10 most influential features:")
    for i in top_idx:
        print(f"  {FEATURE_NAMES[i]:15s} importance={importances[i]:.4f}")

    joblib.dump(clf,    "acne_severity_model.joblib")
    joblib.dump(scaler, "feature_scaler.joblib")

    with open("evaluation_report.json", "w") as f:
        json.dump({
            "val_accuracy":              val_acc,
            "test_accuracy":             test_acc,
            "val_classification_report": val_report,
            "test_classification_report": test_report,
            "val_confusion_matrix":      val_cm.tolist(),
            "test_confusion_matrix":     test_cm.tolist(),
            "label_names":               LABEL_NAMES,
            "n_train": len(X_train),
            "n_val":   len(X_val),
            "n_test":  len(X_test),
        }, f, indent=2)

    print("\nSaved: acne_severity_model.joblib, feature_scaler.joblib, evaluation_report.json")


if __name__ == "__main__":
    main()
