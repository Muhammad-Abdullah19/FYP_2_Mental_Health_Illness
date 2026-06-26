"""
routes_auth.py
--------------
Handles user registration, login verification, and token validation
using Firebase Authentication as the identity provider.

Flow:
  1. Frontend (AuthModal.jsx) creates a user / signs in directly with
     the Firebase client SDK → gets an ID token.
  2. Frontend sends that ID token to POST /api/auth/verify.
  3. This backend verifies the token with Firebase Admin SDK,
     creates / fetches the Firestore user document, and returns
     a sanitised user profile to the frontend.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
import firebase_admin
from firebase_admin import auth, firestore
from datetime import datetime

router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None


class VerifyTokenRequest(BaseModel):
    id_token: str


class UserProfile(BaseModel):
    uid: str
    email: str
    display_name: Optional[str]
    created_at: Optional[str]
    sessions_count: int = 0


# ---------------------------------------------------------------------------
# Helper: get Firestore client
# ---------------------------------------------------------------------------
def get_db():
    return firestore.client()


# ---------------------------------------------------------------------------
# Helper: verify Firebase ID token from Authorization header
# ---------------------------------------------------------------------------
async def get_current_user(authorization: str = Header(...)):
    """
    Dependency that extracts and verifies the Firebase ID token
    from the 'Authorization: Bearer <token>' header.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header format.")
    id_token = authorization.split("Bearer ")[1]
    try:
        decoded = auth.verify_id_token(id_token)
        return decoded
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")


# ---------------------------------------------------------------------------
# POST /api/auth/register
# Creates a new Firebase user on behalf of the client.
# In production you may do this client-side only; this endpoint is useful
# for server-side user provisioning (e.g. admin-created accounts).
# ---------------------------------------------------------------------------
@router.post("/register", response_model=dict)
async def register(payload: RegisterRequest):
    try:
        user = auth.create_user(
            email=payload.email,
            password=payload.password,
            display_name=payload.display_name or "",
        )
        # Seed a Firestore document for the new user
        db = get_db()
        db.collection("users").document(user.uid).set({
            "uid": user.uid,
            "email": payload.email,
            "display_name": payload.display_name or "",
            "created_at": datetime.utcnow().isoformat(),
            "sessions_count": 0,
        })
        return {"message": "User created successfully.", "uid": user.uid}
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# POST /api/auth/verify
# Verifies a Firebase ID token sent from the frontend and returns the
# user profile stored in Firestore.
# ---------------------------------------------------------------------------
@router.post("/verify", response_model=UserProfile)
async def verify_token(payload: VerifyTokenRequest):
    try:
        decoded = auth.verify_id_token(payload.id_token)
        uid = decoded["uid"]

        db = get_db()
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()

        if not user_doc.exists:
            # First-time sign-in via Google / social provider — create doc
            user_ref.set({
                "uid": uid,
                "email": decoded.get("email", ""),
                "display_name": decoded.get("name", ""),
                "created_at": datetime.utcnow().isoformat(),
                "sessions_count": 0,
            })
            data = user_ref.get().to_dict()
        else:
            data = user_doc.to_dict()

        return UserProfile(
            uid=data["uid"],
            email=data["email"],
            display_name=data.get("display_name"),
            created_at=data.get("created_at"),
            sessions_count=data.get("sessions_count", 0),
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


# ---------------------------------------------------------------------------
# GET /api/auth/me
# Returns the currently authenticated user's profile.
# Requires 'Authorization: Bearer <firebase_id_token>' header.
# ---------------------------------------------------------------------------
@router.get("/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    uid = current_user["uid"]
    db = get_db()
    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found.")
    data = user_doc.to_dict()
    return UserProfile(
        uid=data["uid"],
        email=data["email"],
        display_name=data.get("display_name"),
        created_at=data.get("created_at"),
        sessions_count=data.get("sessions_count", 0),
    )


# ---------------------------------------------------------------------------
# DELETE /api/auth/delete
# Deletes the authenticated user's Firebase account and Firestore data.
# ---------------------------------------------------------------------------
@router.delete("/delete", response_model=dict)
async def delete_account(current_user: dict = Depends(get_current_user)):
    uid = current_user["uid"]
    try:
        auth.delete_user(uid)
        db = get_db()
        db.collection("users").document(uid).delete()
        return {"message": "Account deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
