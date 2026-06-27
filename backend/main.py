import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials

from api.routes_auth import router as auth_router
from api.routes_chat import router as chat_router
from api.routes_voice import router as voice_router

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s — %(levelname)s — %(message)s"
)

# ---------------------------------------------------------------------------
# Firebase Admin SDK initialisation
# ---------------------------------------------------------------------------


def init_firebase():
    if firebase_admin._apps:
        return
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK initialised.")
    else:
        print(f"❌ Firebase credentials not found at: {cred_path}")


init_firebase()

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="Noor-e-Shifa API", version="1.0.0")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers — all prefixed with /api
# ---------------------------------------------------------------------------
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(voice_router, prefix="/api/voice", tags=["Voice"])
# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "Noor-e-Shifa API is running 🌿",
        "firebase": "connected" if firebase_admin._apps else "NOT connected",
        "routes": {
            "auth_verify": "POST /api/auth/verify",
            "auth_me": "GET /api/auth/me",
            "chat_message": "POST /api/chat/message",
            "chat_public": "POST /api/chat/message/public",
            "chat_history": "GET /api/chat/history",
            "docs": "GET /docs"
        }
    }
