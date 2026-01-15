# 🚀 Fake Job Posting Detector (ML + Web App)

A full-stack **Fake Job Posting Detector** that classifies job posts as **REAL** or **FAKE** using **Machine Learning (TF-IDF + Logistic Regression)**.  
It also highlights **red flag keywords**, provides a **risk level**, includes **URL verification**, keeps a **history of checks**, and generates a **PDF report**.

---

## ✅ Features

### 🔍 Job Scam Detection (ML)
- Detects whether a job post is **FAKE** or **REAL**
- Uses **TF-IDF Vectorization + Logistic Regression**

### 🚩 Red Flag Detection
Detects suspicious patterns like:
- `registration fee`
- `processing fee`
- `no interview`
- `instant joining`
- `whatsapp`, `telegram`
- `earn per day / per week`
- etc.

### ⚠️ Risk Level
Risk level is returned by backend:
- **LOW**
- **MEDIUM**
- **HIGH**

### 🌐 URL / Website Verification
Checks job URL / company website for suspicious patterns such as:
- suspicious domain extensions (`.xyz`, `.top`, `.site`, etc.)
- too many numbers in domain
- `http://` instead of secure `https://`
- scam keywords inside URL

### 🧾 PDF Report Generator
Downloads a detailed report including:
- job details
- final prediction
- model prediction
- confidence score
- red flags list
- warning message (if detected)

### 🕒 History (Last 5 Checks)
- Stores last 5 job predictions in local storage
- Clickable history cards (loads previous result again)

---

## 🏗️ Tech Stack

### Frontend
- React.js
- Axios
- jsPDF
- CSS (modern responsive UI)

### Backend
- Python
- Flask
- Flask-CORS
- Scikit-learn
- Joblib

### Machine Learning Model
- TF-IDF Vectorizer (1-gram + 2-gram)
- Logistic Regression (class_weight balanced)

---

## 📂 Folder Structure

FakeJobDetector/
│
├── backend/
│ ├── app.py
│ ├── utils.py
│ ├── dataset/
│ │ └── fake_job_postings.csv
│ └── models/
│ ├── train_model.py
│ ├── fake_job_model.pkl
│ ├── vectorizer.pkl
│ └── metadata.pkl
│
├── frontend/
│ ├── src/
│ │ ├── App.js
│ │ └── App.css
│ └── package.json
│
└── README.md


---

## ⚙️ Setup Instructions

### ✅ 1) Backend Setup (Flask)
Open terminal:

```bash
cd backend
pip install -r requirements.txt

Run model training:

py models/train_model.py


Start backend server:

py app.py


Backend runs at:
✅ http://127.0.0.1:5000

Health check:
✅ http://127.0.0.1:5000/health

✅ 2) Frontend Setup (React)

Open new terminal:

cd frontend
npm install
npm start


Frontend runs at:
✅ http://localhost:3000

✅ API Endpoint
POST /predict

Request JSON:

{
  "title": "Software Engineer Intern",
  "company": "TechNova Pvt Ltd",
  "description": "Internship role with coding and interview rounds"
}


Response JSON:

{
  "success": true,
  "result": "REAL",
  "model_result": "REAL",
  "confidence": 92.45,
  "red_flags": [],
  "risk_level": "LOW",
  "warning": null
}

🧪 Sample Test Input (FAKE)

Job Title: Data Entry Operator (WFH)
Company: Quick Hiring Solutions
Description:

Work from home job. No interview required. Instant joining.
Earn per week ₹40,000.
Pay registration fee ₹999.
WhatsApp HR to apply. UPI payment accepted.


Expected Output:
✅ FAKE
✅ HIGH Risk
✅ Multiple red flags detected

📌 Future Improvements

Deploy backend on Render / Railway

Deploy frontend on Vercel / Netlify

Add authentication + admin panel

Add job link scraping (LinkedIn/Naukri) for automatic analysis

Improve model with NLP Transformers (BERT)

👨‍💻 Developed By VATSAL PARIKH

⭐ If you like this project

Give it a ⭐ on GitHub and share it 😄🔥


---

If you want, I can also create:
✅ `requirements.txt` best version  
✅ GitHub **project description + tags + demo screenshots section**