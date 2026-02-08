"""Text-to-speech service using edge-tts (Microsoft Edge TTS engine)."""

import json
import os
import re
import uuid
from dataclasses import dataclass

import edge_tts

AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "audio")

# Voice mapping: thinker name → edge-tts voice ID
VOICE_MAP: dict[str, str] = {
    "Albert Einstein": "en-US-GuyNeural",
    "Friedrich Nietzsche": "de-DE-ConradNeural",
    "Richard Feynman": "en-US-AndrewNeural",
    "Socrates": "en-GB-RyanNeural",
    "Ada Lovelace": "en-GB-SoniaNeural",
    "Nikola Tesla": "en-US-DavisNeural",
    "Carl Sagan": "en-US-TonyNeural",
    "Alan Turing": "en-GB-ThomasNeural",
    "Ludwig Wittgenstein": "en-GB-RyanNeural",
    "Fyodor Dostoevsky": "en-US-GuyNeural",
    "Siddhartha Gautama": "en-IN-PrabhatNeural",
    "Simone de Beauvoir": "fr-FR-DeniseNeural",
}

DEFAULT_VOICE = "en-US-GuyNeural"

TICKS_PER_MS = 10_000  # 1 tick = 100 nanoseconds


def strip_markdown(text: str) -> str:
    """Remove markdown formatting so TTS reads clean text."""
    text = re.sub(r"#{1,6}\s*", "", text)          # headings
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)   # bold
    text = re.sub(r"\*(.+?)\*", r"\1", text)       # italic
    text = re.sub(r"_(.+?)_", r"\1", text)         # italic underscores
    text = re.sub(r"`(.+?)`", r"\1", text)         # inline code
    text = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", text)  # links
    text = re.sub(r"^[-*+]\s+", "", text, flags=re.MULTILINE)  # list bullets
    text = re.sub(r"^\d+\.\s+", "", text, flags=re.MULTILINE)  # numbered lists
    text = re.sub(r"---+", "", text)               # horizontal rules
    text = re.sub(r"\n{3,}", "\n\n", text)         # excess newlines
    return text.strip()


def estimate_duration_seconds(text: str) -> int:
    """Estimate spoken duration. Average TTS rate is ~150 words/min."""
    word_count = len(text.split())
    return int(word_count / 150 * 60)


def get_voice_for_thinker(thinker_name: str) -> str:
    """Look up the edge-tts voice for a given thinker."""
    return VOICE_MAP.get(thinker_name, DEFAULT_VOICE)


@dataclass
class AudioResult:
    url: str
    duration_seconds: int


async def generate_audio(
    transcript: str,
    thinker_name: str,
    lecture_id: str | uuid.UUID,
) -> AudioResult:
    """Generate an MP3 audio file from a lecture transcript.

    Also generates a word-timing JSON file for transcript sync.
    Returns an AudioResult with the URL path and estimated duration.
    """
    os.makedirs(AUDIO_DIR, exist_ok=True)

    voice = get_voice_for_thinker(thinker_name)
    clean_text = strip_markdown(transcript)

    # Determine paragraph boundaries for word-to-paragraph mapping
    paragraphs = [p.strip() for p in clean_text.split("\n\n") if p.strip()]
    para_word_counts = [len(p.split()) for p in paragraphs]

    communicate = edge_tts.Communicate(clean_text, voice, boundary="WordBoundary")

    audio_chunks: list[bytes] = []
    word_timings: list[dict] = []
    global_word_idx = 0

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            offset_ms = chunk["offset"] // TICKS_PER_MS
            duration_ms = chunk["duration"] // TICKS_PER_MS

            # Determine paragraph index from cumulative word count
            para_idx = 0
            cumulative = 0
            for i, count in enumerate(para_word_counts):
                cumulative += count
                if global_word_idx < cumulative:
                    para_idx = i
                    break

            word_timings.append({
                "s": offset_ms,
                "e": offset_ms + duration_ms,
                "p": para_idx,
            })
            global_word_idx += 1

    # Write audio file
    filepath = os.path.join(AUDIO_DIR, f"{lecture_id}.mp3")
    with open(filepath, "wb") as f:
        for audio_data in audio_chunks:
            f.write(audio_data)

    # Write word timings JSON (includes paragraph text for punctuation)
    timings_path = os.path.join(AUDIO_DIR, f"{lecture_id}.json")
    with open(timings_path, "w", encoding="utf-8") as f:
        json.dump({"p": paragraphs, "w": word_timings}, f, ensure_ascii=False)

    duration = estimate_duration_seconds(clean_text)

    return AudioResult(url=f"/audio/{lecture_id}.mp3", duration_seconds=duration)
