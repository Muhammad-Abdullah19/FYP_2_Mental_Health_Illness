"""
routes_auth.py
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import Optional
from firebase_admin import auth, firestore
from datetime import datetime

router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class TokenRequest(BaseModel):
    id_token: str


class UserProfile(BaseModel):
    uid: str
    email: str
    display_name: Optional[str] = None
    created_at: Optional[str] = None
    sessions_count: int = 0


# ---------------------------------------------------------------------------
# Helper: get Firestore client
# ---------------------------------------------------------------------------
def get_db():
    return firestore.client()


# ---------------------------------------------------------------------------
# Helper: verify Firebase ID token
# Imported by routes_chat.py as a dependency
# ---------------------------------------------------------------------------
async def get_current_user(authorization: str = Header(...)):
    """
    Reads Authorization: Bearer <token> header and verifies it.
    Used as Depends(get_current_user) in protected routes.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header. Format: Bearer <token>"
        )

    id_token = authorization.split("Bearer ")[1]

    try:
        decoded = auth.verify_id_token(id_token)
        return decoded
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token expired. Please login again."
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token. Please login again."
        )
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Authentication error: {str(e)}"
        )


# ---------------------------------------------------------------------------
# POST /auth/verify
# Called by frontend after Firebase login to sync with backend
# ---------------------------------------------------------------------------
@router.post("/verify")
async def verify_token(request: TokenRequest):
    try:
        decoded = auth.verify_id_token(request.id_token)
        uid = decoded["uid"]
        email = decoded.get("email", "")

        # Sync user to Firestore
        try:
            db = get_db()
            user_ref = db.collection("users").document(uid)
            user_doc = user_ref.get()

            if not user_doc.exists:
                user_ref.set({
                    "uid": uid,
                    "email": email,
                    "display_name": decoded.get("name", ""),
                    "created_at": datetime.utcnow().isoformat(),
                    "sessions_count": 0,
                })
                print(f"✅ New user created in Firestore: {email}")
            else:
                print(f"✅ Existing user verified: {email}")

        except Exception as db_error:
            # Firestore not blocking auth
            print(f"⚠️  Firestore warning (non-blocking): {db_error}")

        return {
            "status": "success",
            "uid": uid,
            "email": email
        }

    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token has expired.")
    except auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Token verification failed: {str(e)}"
        )


# ---------------------------------------------------------------------------
# GET /auth/me  (Protected)
# Returns the current logged in user profile
# ---------------------------------------------------------------------------
@router.get("/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid")
    email = current_user.get("email", "")

    try:
        db = get_db()
        user_doc = db.collection("users").document(uid).get()
        if user_doc.exists:
            data = user_doc.to_dict()
            return UserProfile(
                uid=data.get("uid", uid),
                email=data.get("email", email),
                display_name=data.get("display_name"),
                created_at=data.get("created_at"),
                sessions_count=data.get("sessions_count", 0)
            )
    except Exception as e:
        print(f"⚠️  Firestore warning: {e}")

    # Fallback if Firestore not available
    return UserProfile(uid=uid, email=email)
