import pandas as pd
import joblib
import os
import re

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report


def clean_text(text):
    """Basic text cleaning for better ML performance"""
    if text is None:
        return ""
    text = str(text).lower()
    text = re.sub(r"\s+", " ", text)   # remove extra spaces/newlines
    text = text.strip()
    return text


# ✅ Load dataset
DATA_PATH = os.path.join("dataset", "fake_job_postings.csv")
df = pd.read_csv(DATA_PATH)

# ✅ Fill missing values
df = df.fillna("")

# ✅ Ensure required columns exist (safe production code)
required_cols = ["title", "company_profile", "description", "requirements", "benefits", "fraudulent"]
missing_cols = [c for c in required_cols if c not in df.columns]

if missing_cols:
    raise ValueError(f"❌ Missing required columns in dataset: {missing_cols}")

# ✅ Create combined text column (and clean it)
df["text"] = (
    df["title"] + " " +
    df["company_profile"] + " " +
    df["description"] + " " +
    df["requirements"] + " " +
    df["benefits"]
).apply(clean_text)

# ✅ Features and Target
X = df["text"]
y = df["fraudulent"]

# ✅ Train test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# ✅ TF-IDF Vectorizer
vectorizer = TfidfVectorizer(
    stop_words="english",
    max_features=8000,      # ✅ slightly higher for better vocab
    ngram_range=(1, 2)      # ✅ adds bigrams -> improves detection
)

X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# ✅ Model (balanced improves fake detection)
model = LogisticRegression(
    max_iter=2000,
    class_weight="balanced"
)

model.fit(X_train_vec, y_train)

# ✅ Evaluation
y_pred = model.predict(X_test_vec)
acc = accuracy_score(y_test, y_pred)

print("\n✅ Model trained successfully!")
print(f"✅ Accuracy: {acc * 100:.2f}%")

print("\n✅ Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\n✅ Classification Report:")
print(classification_report(y_test, y_pred))

# ✅ Save model + vectorizer
os.makedirs("models", exist_ok=True)

joblib.dump(model, os.path.join("models", "fake_job_model.pkl"))
joblib.dump(vectorizer, os.path.join("models", "vectorizer.pkl"))

# ✅ Save metadata (useful for report/viva)
metadata = {
    "model": "LogisticRegression(class_weight=balanced)",
    "vectorizer": "TF-IDF (1,2) ngrams max_features=8000",
    "accuracy": round(acc * 100, 2),
    "dataset_path": DATA_PATH
}

joblib.dump(metadata, os.path.join("models", "metadata.pkl"))

print("\n✅ Saved:")
print("   - models/fake_job_model.pkl")
print("   - models/vectorizer.pkl")
print("   - models/metadata.pkl")
