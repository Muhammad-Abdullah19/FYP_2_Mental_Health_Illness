import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials

from api.routes_auth import router as auth_router
from api.routes_chat import router as chat_router

load_dotenv()

# ---------------------------------------------------------------------------
# Firebase Admin SDK initialisation
# ---------------------------------------------------------------------------
_firebase_initialized = False

def init_firebase():
    global _firebase_initialized
    if _firebase_initialized or firebase_admin._apps:
        return
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        print("✅ Firebase Admin SDK initialised from credentials file.")
    else:
        # Fallback: use Application Default Credentials (useful on Cloud Run / Render)
        firebase_admin.initialize_app()
        _firebase_initialized = True
        print("✅ Firebase Admin SDK initialised with Application Default Credentials.")

init_firebase()

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Noor-e-Shifa API",
    description="Backend for the Urdu Voice-Based Mental Health Support Companion",
    version="1.0.0",
)

# Allow the Vite dev server (localhost:3000 / 5173) and production Vercel URL
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    os.getenv("FRONTEND_URL", "https://noor-e-shifa.vercel.app"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "message": "Noor-e-Shifa API is running 🌿",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
