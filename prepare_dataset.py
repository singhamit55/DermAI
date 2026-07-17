import os
import shutil
import random

def main():
    source_base = os.path.join("acne_1024")
    categories = {
        "acne0_1024": "level0",
        "acne1_1024": "level1",
        "acne2_1024": "level2",
        "acne3_1024": "level3"
    }

    print("Checking source directories...")
    for src_dir in categories.keys():
        full_src = os.path.join(source_base, src_dir)
        if not os.path.isdir(full_src):
            print(f"Error: Source directory {full_src} does not exist.")
            return

    splits = ["train", "val", "test"]
    subdirs = ["level0", "level1", "level2", "level3"]

    print("Creating directory structure for train, val, and test...")
    for split in splits:
        for subdir in subdirs:
            os.makedirs(os.path.join(split, subdir), exist_ok=True)

    print("Splitting dataset and copying images (80% train, 10% val, 10% test)...")
    random.seed(42)  # For reproducible splits

    for src_dir, target_sub in categories.items():
        full_src = os.path.join(source_base, src_dir)
        images = [f for f in os.listdir(full_src) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
        
        # Shuffle images
        random.shuffle(images)
        
        n_total = len(images)
        n_train = int(n_total * 0.8)
        n_val = int(n_total * 0.1)
        
        train_imgs = images[:n_train]
        val_imgs = images[n_train:n_train + n_val]
        test_imgs = images[n_train + n_val:]

        print(f"  {target_sub}: Total {n_total} images -> Train: {len(train_imgs)}, Val: {len(val_imgs)}, Test: {len(test_imgs)}")

        # Copy files
        for img in train_imgs:
            shutil.copy(os.path.join(full_src, img), os.path.join("train", target_sub, img))
        for img in val_imgs:
            shutil.copy(os.path.join(full_src, img), os.path.join("val", target_sub, img))
        for img in test_imgs:
            shutil.copy(os.path.join(full_src, img), os.path.join("test", target_sub, img))

    print("✓ Dataset prepared successfully! Ready to run python train_baseline.py.")

if __name__ == "__main__":
    main()
