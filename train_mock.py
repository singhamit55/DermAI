import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

def main():
    print("Generating synthetic dataset matching the 46-feature DermAI layout...")
    np.random.seed(42)
    n_samples = 400
    n_features = 46
    
    # Generate random features
    X = np.random.normal(0.1, 0.05, (n_samples, n_features))
    y = np.zeros(n_samples, dtype=int)
    
    # 0: Clear, 1: Mild, 2: Moderate, 3: Severe
    for idx in range(n_samples):
        label = idx // 100
        y[idx] = label
        
        # Adjust redness features (index 42: mean_redness, index 43: redness_ratio)
        # to guide the Random Forest classifier
        if label == 0:  # Clear
            X[idx, 42] = np.random.uniform(0.001, 0.01)
            X[idx, 43] = np.random.uniform(0.001, 0.01)
        elif label == 1:  # Mild
            X[idx, 42] = np.random.uniform(0.015, 0.03)
            X[idx, 43] = np.random.uniform(0.015, 0.03)
        elif label == 2:  # Moderate
            X[idx, 42] = np.random.uniform(0.035, 0.065)
            X[idx, 43] = np.random.uniform(0.035, 0.065)
        elif label == 3:  # Severe
            X[idx, 42] = np.random.uniform(0.08, 0.25)
            X[idx, 43] = np.random.uniform(0.08, 0.25)

    print("Fitting feature scaler...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    print("Training Random Forest classifier...")
    clf = RandomForestClassifier(n_estimators=50, random_state=42, class_weight="balanced")
    clf.fit(X_scaled, y)
    
    # Save the model files
    joblib.dump(clf, "acne_severity_model.joblib")
    joblib.dump(scaler, "feature_scaler.joblib")
    print("✓ Successfully generated and saved local model files: acne_severity_model.joblib & feature_scaler.joblib!")

if __name__ == "__main__":
    main()
