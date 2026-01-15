print("✅ Starting Fake Job Detector Backend...")

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os

from utils import detect_red_flags, calculate_risk_level

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

MODEL_VERSION = "v1.0"

# ✅ Always load using absolute path (deployment safe)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "fake_job_model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "models", "vectorizer.pkl")

try:
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("✅ Model & Vectorizer loaded successfully!")
except Exception as e:
    print("❌ Error loading model/vectorizer:", str(e))
    model = None
    vectorizer = None


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "OK",
        "message": "Backend is running ✅",
        "model_version": MODEL_VERSION,
        "model_loaded": model is not None,
        "vectorizer_loaded": vectorizer is not None
    })


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Fake Job Detector API is running ✅"})


@app.route("/predict", methods=["POST"])
def predict():
    if model is None or vectorizer is None:
        return jsonify({
            "success": False,
            "error": "Model not loaded properly. Please retrain or check .pkl files."
        }), 500

    if not request.is_json:
        return jsonify({
            "success": False,
            "error": "Invalid request. Content-Type must be application/json"
        }), 400

    data = request.get_json()
    if not data:
        return jsonify({
            "success": False,
            "error": "Invalid request. JSON body missing."
        }), 400

    title = str(data.get("title", "")).strip()
    company = str(data.get("company", "")).strip()
    description = str(data.get("description", "")).strip()

    if title == "" or company == "" or description == "":
        return jsonify({
            "success": False,
            "error": "Title, Company and Description are required."
        }), 400

    if len(description) < 25:
        return jsonify({
            "success": False,
            "error": "Job description too short. Please enter at least 25 characters."
        }), 400

    text = f"{title} {company} {description}"

    found_flags = detect_red_flags(text)

    try:
        text_vector = vectorizer.transform([text])
        prediction = model.predict(text_vector)[0]
        prob = model.predict_proba(text_vector)[0].max()

        confidence = round(float(prob) * 100, 2)

        model_result = "FAKE" if prediction == 1 else "REAL"
        risk_level = calculate_risk_level(model_result, confidence, found_flags)

        final_result = model_result
        warning = None

        if len(found_flags) >= 4:
            final_result = "FAKE"
            warning = "Multiple scam indicators found. Classified as FAKE for safety."

        return jsonify({
            "success": True,
            "model_version": MODEL_VERSION,

            "prediction": int(prediction),
            "result": final_result,
            "model_result": model_result,
            "confidence": confidence,

            "red_flags": found_flags,
            "risk_level": risk_level,

            "warning": warning
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Prediction failed.",
            "details": str(e)
        }), 500


# ✅ Production-safe runner
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
