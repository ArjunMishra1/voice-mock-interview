import requests
import uuid
import edge_tts
import asyncio
import os
from app.core.config import settings

async def edge_tts_voice(text: str) -> str:
    # Ensure audio directory exists
    os.makedirs("audio", exist_ok=True)
    audio_file = f"audio/audio_{uuid.uuid4()}.mp3"
    communicate = edge_tts.Communicate(text, voice="en-US-AriaNeural")
    await communicate.save(audio_file)
    return audio_file.replace("audio/", "")  # Return just the filename for /audio/ route

async def text_to_speech(text: str) -> str:
    if settings.TTS_PROVIDER == "edge":
        return await edge_tts_voice(text)
    return await elevenlabs_tts(text)
