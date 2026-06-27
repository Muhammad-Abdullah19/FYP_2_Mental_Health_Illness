# Noor-e-Shifa — Urdu Voice-Based Mental Health Support Companion

An empathetic, bilingual (Urdu / English) conversational web app that listens to a user's
spoken or typed words, analyses their emotional state, estimates a mental-health condition
and its severity, and responds with supportive guidance combining **Islamic remedies** and
**evidence-based wellness tips**.

> **Important:** Noor-e-Shifa is a **supportive companion, not a medical or diagnostic tool.**
> It does not diagnose, treat, or replace professional care. Users in distress are always
> directed to qualified professionals and crisis helplines.

---

## Table of Contents
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Running the App](#running-the-app)
- [Testing](#testing)
- [Model Performance](#model-performance)
- [Safety Design](#safety-design)
- [Limitations & Future Work](#limitations--future-work)
- [Acknowledgements](#acknowledgements)

---

## Features

- **Voice input** — records Urdu/English speech in the browser and transcribes it locally with
  faster-whisper.
- **Emotion detection** — rule-based detection of the user's primary emotional state.
- **Condition classification** — a trained Random Forest classifies text into
  Depression / Anxiety / Stress with a confidence breakdown.
- **Severity estimation** — a trained XGBoost regressor estimates severity on a 0–100 scale.
- **Crisis safety override** — an always-on, rule-based safety net that detects self-harm
  language (in Urdu, Roman-Urdu, and English) and surfaces crisis helplines, independent of
  the ML models.
- **Supportive responses** — varied, scripted, clinically-reviewed replies with no immediate
  repetition.
- **Islamic + clinical remedies** — condition-matched supplications/verses (with Quran/Hadith
  references) alongside WHO/NIH-aligned wellness tips.
- **Progress dashboard** — saves each session for logged-in users and plots severity over time.
- **Bilingual UI** — full Urdu (RTL) and English support.
- **Mandatory disclaimer** — consent gate clarifying the app is not a medical tool.

---

## System Architecture

```
User speech / text
      │
      ▼
[ Frontend: React + Vite ]
      │  (audio blob or text)
      ▼
[ Backend: FastAPI ]
      │
      ├─► Whisper (faster-whisper)  ──► Urdu/English transcription
      │
      ▼
[ Analysis pipeline ]
      ├─► Emotion detection      (rule-based)
      ├─► Condition classifier   (Random Forest + TF-IDF)
      ├─► Severity regressor     (XGBoost + TF-IDF)
      ├─► Crisis override        (rule-based, always on)
      └─► Response + remedies     (scripted, no-repeat)
      │
      ▼
[ Firebase ]  Auth + Firestore session history
      │
      ▼
[ Dashboard ]  severity-over-time chart
```

---

## Tech Stack

| Layer        | Technology |
|--------------|------------|
| Frontend     | React 19, Vite, React Router, Recharts |
| Backend      | FastAPI, Uvicorn |
| Speech-to-text | faster-whisper (CTranslate2, CPU) |
| ML           | scikit-learn (TF-IDF, Random Forest), XGBoost |
| Auth & DB    | Firebase Authentication, Cloud Firestore |
| Deployment   | Frontend → Vercel · Backend → Render (free tier) |

---

## Project Structure

```
noor-e-shifa/
├── frontend/
│   ├── src/
│   │   ├── components/      # Chatbot, AuthModal, DisclaimerModal, Navbar...
│   │   ├── pages/           # HomePage, DashboardPage, AssessmentPage...
│   │   ├── context/         # LanguageContext (Urdu/English)
│   │   ├── config/          # firebase.js
│   │   └── services/        # api.js
│   ├── package.json
│   └── .env                 # (not committed)
│
└── backend/
    ├── main.py              # FastAPI app + Firebase init
    ├── run_tests.py         # ML pipeline test suite
    ├── requirements.txt
    ├── .env                 # (not committed)
    ├── firebase-service-account.json   # (not committed)
    ├── api/
    │   ├── routes_auth.py
    │   ├── routes_chat.py
    │   ├── routes_voice.py
    │   └── firestore_service.py
    └── ml_models/
        ├── pipeline.py          # master analysis pipeline
        ├── model_loader.py      # loads trained .joblib models
        ├── emotion_detector.py
        ├── responses.py         # scripted replies + referenced remedies
        ├── whisper_transcriber.py
        ├── saved_models/        # trained model artifacts
        │   ├── tfidf_vectorizer.joblib
        │   ├── random_forest.joblib
        │   ├── xgboost_severity.joblib
        │   └── label_encoder.joblib
        └── dataset/
            ├── create_dataset.py
            ├── train_models.py
            └── urdu_mental_health_dataset.csv
```

---

## Setup & Installation

### Prerequisites
- Python 3.12
- Node.js 18+
- ffmpeg installed system-wide and on PATH (required by faster-whisper)
- A Firebase project (Authentication + Firestore enabled)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate      # macOS/Linux
pip install -r requirements.txt
```

Create `backend/.env`:
```
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
FRONTEND_URL=http://localhost:5173
```
Place your Firebase service-account key at `backend/firebase-service-account.json`.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Train the models (first run only)

```bash
cd backend/ml_models/dataset
python create_dataset.py --target 1000
python train_models.py
```
This generates the dataset and saves the four model artifacts into `ml_models/saved_models/`.

---

## Running the App

```bash
# Terminal 1 — backend
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```
Open the frontend dev URL (typically http://localhost:5173).
API docs are available at http://localhost:8000/docs.

---

## Testing

```bash
cd backend
venv\Scripts\activate
python run_tests.py
```
The suite checks condition classification, severity ranges, multilingual handling,
and — most importantly — crisis-override behaviour (both detection and absence of
false alarms).

---

## Model Performance

Measured on a synthetic, curated Urdu/Roman-Urdu/English dataset.

| Model | Metric | Result |
|-------|--------|--------|
| Random Forest (condition) | Accuracy | 95.77% |
| Random Forest (condition) | 5-fold CV | 96.8% ± 2% |
| XGBoost (severity 0–100)  | MAE | 5.82 points |
| Crisis override           | Recall on test phrases | 100% |

> **Honest note:** these figures are on synthetic data where train and test share the same
> sentence templates, so they reflect a **proof-of-concept baseline**, not real-world accuracy.
> Validation on a held-out set of real Urdu text is identified as immediate future work.

---

## Safety Design

- The **crisis override is rule-based and always runs**, on top of the ML models. A
  probabilistic model is never the only safeguard between a user in danger and help.
- Crisis responses are **fixed, not randomised**, and include crisis helpline numbers.
- The pipeline **falls back to rule-based logic** if model files are missing, so the app
  degrades gracefully rather than failing.
- A **mandatory disclaimer** clarifies the app is not a diagnostic or treatment tool.
- Only a short preview of user text is stored; full messages are not persisted.

---

## Limitations & Future Work

- Models are trained on **synthetic data**; real-world validation is pending.
- Condition set is limited to **Depression / Anxiety / Stress**.
- Text-to-speech (spoken replies) and a Rasa-based dialogue manager were scoped but not
  implemented; the current response engine is intentionally scripted for safety.
- Islamic references require verification by a qualified scholar before clinical/public use.
- Future work: real held-out test set, UrduBERT embeddings comparison, expanded condition
  coverage, and clinician review of all content.

---

## Acknowledgements

- Crisis helplines referenced: Umang, Rozan (Pakistan).
- Built as a Final Year Project. Religious content is pending scholar verification; clinical
  guidance is aligned with general WHO/NIH wellness recommendations and is not a substitute
  for professional care.
