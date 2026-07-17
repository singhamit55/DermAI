"""
train_cnn_efficientnet.py — Reference deep-learning pipeline.

This mirrors the architecture described in the accompanying paper
("Explainable AI for Diagnosing Acne Severity Using Smartphone Images"):

  - Backbone:        EfficientNet-B0, pretrained on ImageNet-1k
  - Head:             Global Average Pooling -> Dropout(0.4) -> Dense(4, softmax)
  - Loss:             Sparse Categorical Cross-Entropy
  - Optimizer:        AdamW, lr=2e-4, weight_decay=1e-2
  - Early stopping:    on validation loss, patience=12 epochs
  - Augmentation:      random rotation (0-30deg), horizontal flip, zoom,
                       color-space normalization, Gaussian noise injection
  - Explainability:    Grad-CAM on the last conv block (see GradCAM class below)

NOTE: This script is provided so you can reproduce the paper's approach directly.
Run it on Google Colab (free GPU) or any machine with a CUDA GPU.

The actually-trained model shipped in this project is the lightweight
handcrafted-feature baseline (train_baseline.py / features.py), which
runs entirely on CPU — see evaluation_report.json for real test numbers.

Run (on a GPU machine):
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
    pip install grad-cam scikit-learn
    python train_cnn_efficientnet.py --data_dir /path/to/acne_1024 --epochs 30
"""

import argparse
import os

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
from PIL import Image

LABEL_NAMES    = {0: "Clear", 1: "Mild", 2: "Moderate", 3: "Severe"}
CLASS_FOLDERS  = {"level0": 0, "level1": 1, "level2": 2, "level3": 3}


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------

class AcneDataset(Dataset):
    """Reads the level0 / level1 / level2 / level3 folder layout from split dirs."""

    def __init__(self, root_dir, transform=None):
        self.samples = []
        for folder, label in CLASS_FOLDERS.items():
            folder_path = os.path.join(root_dir, folder)
            if not os.path.isdir(folder_path):
                continue
            for fname in os.listdir(folder_path):
                if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                    self.samples.append((os.path.join(folder_path, fname), label))
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label


def add_gaussian_noise(tensor, std=0.03):
    """Simulates lower-quality smartphone sensors, per the paper's augmentation pipeline."""
    return tensor + torch.randn_like(tensor) * std


def build_transforms():
    train_tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomRotation(30),
        transforms.RandomHorizontalFlip(),
        transforms.RandomResizedCrop(224, scale=(0.85, 1.0)),
        transforms.ToTensor(),
        transforms.Lambda(add_gaussian_noise),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    eval_tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    return train_tf, eval_tf


# ---------------------------------------------------------------------------
# Model — EfficientNet-B0 + custom head, matching the paper's spec
# ---------------------------------------------------------------------------

class AcneSeverityModel(nn.Module):
    def __init__(self, num_classes=4, dropout=0.4):
        super().__init__()
        weights         = EfficientNet_B0_Weights.IMAGENET1K_V1
        backbone        = efficientnet_b0(weights=weights)
        self.features   = backbone.features               # conv backbone
        self.pool       = nn.AdaptiveAvgPool2d(1)          # Global Average Pooling
        self.dropout    = nn.Dropout(dropout)
        in_features     = backbone.classifier[1].in_features
        self.classifier = nn.Linear(in_features, num_classes)

    def forward(self, x):
        x = self.features(x)
        x = self.pool(x).flatten(1)
        x = self.dropout(x)
        return self.classifier(x)


# ---------------------------------------------------------------------------
# Grad-CAM — matches the paper's global-explanation layer
# ---------------------------------------------------------------------------

class GradCAM:
    """Minimal Grad-CAM targeting the last conv block of EfficientNet-B0."""

    def __init__(self, model: AcneSeverityModel):
        self.model       = model
        self.gradients   = None
        self.activations = None
        target_layer     = model.features[-1]
        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, inp, out):
        self.activations = out.detach()

    def _save_gradient(self, module, grad_in, grad_out):
        self.gradients = grad_out[0].detach()

    def __call__(self, x, class_idx=None):
        self.model.zero_grad()
        logits = self.model(x)
        if class_idx is None:
            class_idx = logits.argmax(dim=1).item()
        score = logits[:, class_idx]
        score.backward()

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        cam     = torch.relu((weights * self.activations).sum(dim=1, keepdim=True))
        cam     = torch.nn.functional.interpolate(cam, size=x.shape[-2:], mode="bilinear", align_corners=False)
        cam     = cam.squeeze().cpu().numpy()
        cam     = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        return cam, class_idx, torch.softmax(logits, dim=1).detach().cpu().numpy()[0]


# ---------------------------------------------------------------------------
# Training loop
# ---------------------------------------------------------------------------

def train(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    train_tf, eval_tf = build_transforms()
    train_set = AcneDataset(os.path.join(args.data_dir, "train"), transform=train_tf)
    val_set   = AcneDataset(os.path.join(args.data_dir, "val"),   transform=eval_tf)
    test_set  = AcneDataset(os.path.join(args.data_dir, "test"),  transform=eval_tf)

    print(f"Dataset splits: train={len(train_set)}, val={len(val_set)}, test={len(test_set)}")

    train_loader = DataLoader(train_set, batch_size=args.batch_size, shuffle=True,  num_workers=2)
    val_loader   = DataLoader(val_set,   batch_size=args.batch_size, num_workers=2)
    test_loader  = DataLoader(test_set,  batch_size=args.batch_size, num_workers=2)

    model     = AcneSeverityModel(num_classes=4, dropout=0.4).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-4, weight_decay=1e-2)

    best_val_loss = float("inf")
    patience, patience_ctr = 12, 0

    for epoch in range(args.epochs):
        model.train()
        total_loss = 0.0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            out  = model(imgs)
            loss = criterion(out, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * imgs.size(0)
        train_loss = total_loss / len(train_set)

        model.eval()
        val_loss, correct = 0.0, 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                out   = model(imgs)
                loss  = criterion(out, labels)
                val_loss += loss.item() * imgs.size(0)
                correct  += (out.argmax(1) == labels).sum().item()
        val_loss /= len(val_set)
        val_acc   = correct / len(val_set)
        print(f"Epoch {epoch+1}/{args.epochs}  train_loss={train_loss:.4f}  val_loss={val_loss:.4f}  val_acc={val_acc*100:.1f}%")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_ctr  = 0
            torch.save(model.state_dict(), "acne_efficientnet_b0.pt")
        else:
            patience_ctr += 1
            if patience_ctr >= patience:
                print("Early stopping triggered.")
                break

    # Final test evaluation
    model.load_state_dict(torch.load("acne_efficientnet_b0.pt"))
    model.eval()
    correct = 0
    with torch.no_grad():
        for imgs, labels in test_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            out      = model(imgs)
            correct += (out.argmax(1) == labels).sum().item()
    print(f"Test accuracy: {correct/len(test_set)*100:.1f}%")
    print("Saved model weights to acne_efficientnet_b0.pt")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train EfficientNet-B0 acne severity classifier")
    parser.add_argument("--data_dir",   required=True, help="Path to the ACNE04 folder (contains train/val/test)")
    parser.add_argument("--epochs",     type=int, default=30)
    parser.add_argument("--batch_size", type=int, default=16)
    args = parser.parse_args()
    train(args)
