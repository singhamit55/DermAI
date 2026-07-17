import zipfile
import os

def main():
    zip_path = os.path.join("__pycache__", "dataset", "archive.zip")
    if not os.path.exists(zip_path):
        print(f"Error: {zip_path} not found.")
        return
        
    print(f"Extracting {zip_path} to current directory...")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(".")
        print("✓ Extraction completed successfully!")
    except Exception as e:
        print(f"Error during extraction: {e}")

if __name__ == "__main__":
    main()
