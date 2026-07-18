Live Link :-  https://agent-6a5baeb93ab28bd43c5224d4--dermai-amit.netlify.app

link in short:--https://bit.ly/4fIx2li



# 🩺 DermAI: Clinical Vision

![DermAI Banner](https://img.shields.io/badge/Status-Active-success.svg)
![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Backend-Flask-black.svg)
![Frontend](https://img.shields.io/badge/Frontend-Vanilla_JS-yellow.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

> **Created & Designed by Amit Singh**

DermAI is an advanced, premium-grade clinical intelligence web application designed to detect and grade acne using state-of-the-art Deep Learning (EfficientNet-B0) and make the AI's decision-making process clinically interpretable using a powerful Tri-Layer XAI (Explainable AI) framework.

## ✨ Key Features

* **Real-time Acne Detection:** Upload an image or use your webcam to receive instant, accurate acne severity grading powered by an EfficientNet-B0 Convolutional Neural Network.
* **Tri-Layer XAI Framework:** Opens the "black box" of AI for clinicians using:
  * **Grad-CAM:** Heatmaps showing which spatial regions the CNN focused on.
  * **LIME:** Superpixel segmentation explaining local feature importance.
  * **SHAP:** Game-theoretic value distribution to identify global model drivers.
* **Intelligent AI Assistant:** Integrated with Groq's lightning-fast inference API, allowing users to converse with **LLaMA 3.3 70B**, **Mixtral 8x7B**, and **GPT-4o** for personalized skincare routines and dermatological insights.
* **Stunning UI/UX:** A highly responsive, glassmorphism-inspired interface with fluid micro-animations, designed from scratch using vanilla HTML, CSS, and JavaScript. 
* **Daily Routine & History:** Automatically tracks scan history and generates dynamically structured daily skin routines based on your analysis results.

## 🛠️ Technology Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (No heavy frameworks, highly optimized).
* **Backend:** Python, Flask, Flask-CORS.
* **Machine Learning:** PyTorch, Torchvision (EfficientNet-B0).
* **Explainable AI (XAI):** Captum (Integrated Gradients/Grad-CAM), LIME, SHAP.
* **LLM Integration:** Groq API, OpenAI API.

## 🚀 Getting Started

### Prerequisites
Make sure you have Python 3.8+ installed on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/dermai-clinical-vision.git
cd dermai-clinical-vision
```

### 2. Install Backend Dependencies
```bash
pip install -r requirements.txt
```
*(Note: If `requirements.txt` is not present, you will need `flask`, `flask-cors`, `torch`, `torchvision`, `captum`, `lime`, `shap`, `Pillow`, `numpy`)*

### 3. Start the Flask API
```bash
python app.py
```
The backend will launch at `http://127.0.0.1:5000`.

### 4. Launch the Frontend
Because the frontend is built in Vanilla JS, no build steps (like Webpack or npm) are required. Simply open `index.html` in your favorite modern web browser!
*Tip: Using a local server like VSCode's "Live Server" extension is recommended for the best experience.*

## 🌐 Preparing for Deployment
If you intend to deploy this app to production (e.g., Vercel + Render):
1. **Update API Base:** Open `app.js` and change `const API_BASE = "http://127.0.0.1:5000/api";` to point to your live deployed Python backend URL.
2. **CORS Configuration:** Ensure `Flask-CORS` in `app.py` allows requests from your live frontend domain.

## 📄 License
This project is licensed under the MIT License.

---
*Disclaimer: DermAI is a research and educational tool. It is not a substitute for professional medical advice, diagnosis, or treatment.*
