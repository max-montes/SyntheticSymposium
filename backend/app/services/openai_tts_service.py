"""Text-to-speech service using OpenAI TTS + Whisper alignment."""

import json
import os
import re
import uuid
from dataclasses import dataclass

from openai import OpenAI

from app.config import settings

AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "audio")

# OpenAI voice mapping: thinker name → OpenAI voice
# Voices: alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer
OPENAI_VOICE_MAP: dict[str, str] = {
    "Socrates": "ash",               # warm, wise male
    "Albert Einstein": "onyx",        # deep, authoritative male
    "Friedrich Nietzsche": "echo",    # intense, dramatic male
    "Richard Feynman": "coral",       # energetic, conversational
    "Ada Lovelace": "nova",           # warm female
    "Nikola Tesla": "fable",          # expressive, accented male
    "Carl Sagan": "sage",             # calm, contemplative male
    "Alan Turing": "echo",            # precise, British male
    "Ludwig Wittgenstein": "fable",   # philosophical, European
    "Fyodor Dostoevsky": "onyx",      # deep, brooding male
    "Siddhartha Gautama": "alloy",    # calm, neutral
    "Simone de Beauvoir": "shimmer",  # clear, intellectual female
}

DEFAULT_VOICE = "alloy"


def strip_markdown(text: str) -> str:
    """Remove markdown formatting so TTS reads clean text."""
    text = re.sub(r"#{1,6}\s*", "", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"_(.+?)_", r"\1", text)
    text = re.sub(r"`(.+?)`", r"\1", text)
    text = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", text)
    text = re.sub(r"^[-*+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\d+\.\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"---+", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


@dataclass
class AudioResult:
    url: str
    duration_seconds: int


def get_voice_for_thinker(thinker_name: str) -> str:
    return OPENAI_VOICE_MAP.get(thinker_name, DEFAULT_VOICE)


async def generate_audio(
    transcript: str,
    thinker_name: str,
    lecture_id: str | uuid.UUID,
) -> AudioResult:
    """Generate audio via OpenAI TTS, then align with Whisper for word timestamps."""
    os.makedirs(AUDIO_DIR, exist_ok=True)

    voice = get_voice_for_thinker(thinker_name)
    clean_text = strip_markdown(transcript)

    # Determine paragraph boundaries
    paragraphs = [p.strip() for p in clean_text.split("\n\n") if p.strip()]

    client = OpenAI(api_key=settings.openai_api_key)

    # 1. Chunk text into <=4000 char segments, splitting on sentence boundaries
    #    so no chunk ends mid-sentence (avoids unnatural cuts in audio).
    chunks: list[str] = []
    current_chunk = ""
    for para in paragraphs:
        # If adding this paragraph stays under limit, append it
        candidate = (current_chunk + "\n\n" + para).strip() if current_chunk else para
        if len(candidate) <= 4000:
            current_chunk = candidate
            continue

        # Flush current chunk if it has content
        if current_chunk:
            chunks.append(current_chunk)
            current_chunk = ""

        # If a single paragraph fits, use it as-is
        if len(para) <= 4000:
            current_chunk = para
            continue

        # Long paragraph: split on sentence boundaries
        sentences = re.split(r'(?<=[.!?])\s+', para)
        for sentence in sentences:
            candidate = (current_chunk + " " + sentence).strip() if current_chunk else sentence
            if len(candidate) <= 4000:
                current_chunk = candidate
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = sentence
    if current_chunk:
        chunks.append(current_chunk)

    # 2. Generate audio for each chunk with the SAME voice and concatenate
    filepath = os.path.join(AUDIO_DIR, f"{lecture_id}.mp3")
    if len(chunks) == 1:
        response = client.audio.speech.create(
            model="tts-1", voice=voice, input=chunks[0], response_format="mp3",
        )
        response.stream_to_file(filepath)
    else:
        # Generate each chunk with identical model+voice for consistent sound
        chunk_files = []
        for i, chunk in enumerate(chunks):
            chunk_path = os.path.join(AUDIO_DIR, f"{lecture_id}_chunk{i}.mp3")
            response = client.audio.speech.create(
                model="tts-1", voice=voice, input=chunk, response_format="mp3",
            )
            response.stream_to_file(chunk_path)
            chunk_files.append(chunk_path)

        # Concatenate MP3 files (same codec/bitrate from same model = seamless)
        with open(filepath, "wb") as outfile:
            for cf in chunk_files:
                with open(cf, "rb") as infile:
                    outfile.write(infile.read())
                os.remove(cf)

    # 3. Get word-level timestamps via Whisper (also request segments for paragraph mapping)
    with open(filepath, "rb") as audio_file:
        whisper_response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json",
            timestamp_granularities=["word", "segment"],
        )

    # 4. Map Whisper segments to our paragraphs by text similarity,
    #    then assign each word's paragraph based on its segment's time range.

    # Build segment→paragraph mapping using sequential text matching
    segments = whisper_response.segments or []
    seg_to_para: dict[int, int] = {}  # segment_index → paragraph_index
    para_cursor = 0

    for si, seg in enumerate(segments):
        seg_text = re.sub(r'[^\w\s]', '', (seg.get("text", "") if isinstance(seg, dict) else getattr(seg, "text", ""))).lower().split()
        if not seg_text:
            seg_to_para[si] = para_cursor
            continue

        # Find which paragraph this segment best aligns with
        best_para = para_cursor
        best_overlap = 0
        for pi in range(para_cursor, min(para_cursor + 3, len(paragraphs))):
            para_text = set(re.sub(r'[^\w\s]', '', paragraphs[pi]).lower().split())
            overlap = sum(1 for w in seg_text if w in para_text)
            if overlap > best_overlap:
                best_overlap = overlap
                best_para = pi

        seg_to_para[si] = best_para
        para_cursor = best_para

    # Build time→paragraph lookup from segments
    seg_ranges: list[tuple[float, float, int]] = []
    for si, seg in enumerate(segments):
        s = seg.get("start", 0) if isinstance(seg, dict) else getattr(seg, "start", 0)
        e = seg.get("end", 0) if isinstance(seg, dict) else getattr(seg, "end", 0)
        seg_ranges.append((s, e, seg_to_para.get(si, 0)))

    # Assign each Whisper word to a paragraph based on which segment it falls in
    word_timings: list[dict] = []
    last_para_idx = 0  # paragraph index should only increase (monotonic)

    if hasattr(whisper_response, "words") and whisper_response.words:
        for word_info in whisper_response.words:
            start_ms = int(word_info.start * 1000)
            end_ms = int(word_info.end * 1000)
            word_time = word_info.start

            # Find which segment this word belongs to
            para_idx = last_para_idx
            for seg_start, seg_end, seg_para in seg_ranges:
                if word_time >= seg_start - 0.05 and word_time <= seg_end + 0.05:
                    para_idx = seg_para
                    break

            # Never go backwards — prevents chunk-boundary resets
            if para_idx < last_para_idx:
                para_idx = last_para_idx
            last_para_idx = para_idx

            word_timings.append({"s": start_ms, "e": end_ms, "p": para_idx})

    # 5. Write word timings JSON
    timings_path = os.path.join(AUDIO_DIR, f"{lecture_id}.json")
    with open(timings_path, "w", encoding="utf-8") as f:
        json.dump({"p": paragraphs, "w": word_timings}, f, ensure_ascii=False)

    # Calculate duration from last word timing
    duration = 0
    if word_timings:
        duration = word_timings[-1]["e"] // 1000 + 1
    else:
        duration = int(len(clean_text.split()) / 150 * 60)

    return AudioResult(url=f"/audio/{lecture_id}.mp3", duration_seconds=duration)
