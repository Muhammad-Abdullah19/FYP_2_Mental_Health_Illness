"""
whisper_transcriber.py
----------------------
Handles Urdu speech transcription using Faster-Whisper.
Runs locally on CPU — no GPU required.
"""

from faster_whisper import WhisperModel
import os
import logging
import tempfile

logger = logging.getLogger(__name__)

logger.info("Loading Whisper base model...")
model = WhisperModel("base", device="cpu", compute_type="int8")
logger.info("Whisper base model loaded successfully")


def transcribe_audio(audio_bytes: bytes, language: str = "ur") -> dict:
    logger.info(
        f"Starting transcription — {len(audio_bytes)/1024:.1f}KB — lang: {language}")

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    logger.info(f"Temp file: {tmp_path}")

    try:
        logger.info("Running Whisper...")
        segments, info = model.transcribe(
            tmp_path,
            language=language,
            beam_size=5,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500)
        )

        full_text = ""
        segment_list = []

        for segment in segments:
            logger.info(
                f"Segment [{segment.start:.1f}s-{segment.end:.1f}s]: {segment.text}")
            full_text += segment.text + " "
            segment_list.append({
                "start": round(segment.start, 2),
                "end": round(segment.end, 2),
                "text": segment.text.strip()
            })

        full_text = full_text.strip()
        logger.info(f"Final text: '{full_text}'")
        logger.info(
            f"Language: {info.language}, Duration: {info.duration:.1f}s")

        return {
            "text": full_text,
            "language": info.language,
            "duration": round(info.duration, 2),
            "segments": segment_list
        }

    except Exception as e:
        logger.error(f"Transcription error: {type(e).__name__}: {e}")
        raise

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            logger.info(f"Temp file deleted")
