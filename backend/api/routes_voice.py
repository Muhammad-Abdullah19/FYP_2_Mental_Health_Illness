"""
routes_voice.py
---------------
Handles voice/audio upload and transcription endpoint.
"""
"""
routes_voice.py
"""

from fastapi.responses import JSONResponse
import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form(default="ur")
):
    logger.info("="*50)
    logger.info("NEW TRANSCRIPTION REQUEST RECEIVED")
    logger.info(f"File: {audio.filename}")
    logger.info(f"Content-Type: {audio.content_type}")
    logger.info(f"Language: {language}")
    logger.info("="*50)

    try:
        audio_bytes = await audio.read()
        logger.info(f"Audio size: {len(audio_bytes)/1024:.1f} KB")

        if len(audio_bytes) == 0:
            logger.error("Audio file is empty")
            raise HTTPException(
                status_code=400,
                detail="Audio file is empty."
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to read audio: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    try:
        from ml_models.whisper_transcriber import transcribe_audio
        result = transcribe_audio(audio_bytes, language=language)
        logger.info(f"Transcription result: {result}")

        if not result["text"]:
            return JSONResponse(content={
                "text": "",
                "language": language,
                "duration": result.get("duration", 0),
                "segments": [],
                "warning": "No speech detected."
            })

        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Transcription failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def voice_status():
    try:
        from ml_models.whisper_transcriber import model
        return {
            "status": "ready",
            "model": "faster-whisper-base",
            "device": "cpu",
            "languages": ["ur", "en"]
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}
