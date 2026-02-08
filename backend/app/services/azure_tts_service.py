"""Text-to-speech service using Azure AI Speech with SSML accent controls."""

import asyncio
import json
import os
import re
import uuid
from dataclasses import dataclass, field

import azure.cognitiveservices.speech as speechsdk

from app.config import settings

AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "audio")

TICKS_PER_MS = 10_000  # Azure uses 100ns ticks


@dataclass
class VoiceConfig:
    voice_name: str
    rate: str = "0%"        # SSML rate adjustment
    pitch: str = "0%"       # SSML pitch adjustment
    style: str = ""         # Speaking style (if supported by voice)
    lang: str = ""          # Language tag for accent (e.g. "el-GR" for Greek)


# Azure Neural Voice mapping with SSML accent/style controls
AZURE_VOICE_MAP: dict[str, VoiceConfig] = {
    "Socrates": VoiceConfig(
        voice_name="en-US-DavisNeural",
        rate="-15%", pitch="-10%",
        lang="el-GR",  # Greek accent
    ),
    "Albert Einstein": VoiceConfig(
        voice_name="en-US-DavisNeural",
        rate="-5%", pitch="-5%",
        lang="de-DE",  # German accent
    ),
    "Friedrich Nietzsche": VoiceConfig(
        voice_name="en-US-GuyNeural",
        rate="+5%", pitch="-5%",
        lang="de-DE",  # German accent
    ),
    "Richard Feynman": VoiceConfig(
        voice_name="en-US-JasonNeural",
        rate="+10%", pitch="+5%",
    ),
    "Ada Lovelace": VoiceConfig(
        voice_name="en-GB-SoniaNeural",
        rate="-5%",
    ),
    "Nikola Tesla": VoiceConfig(
        voice_name="en-US-DavisNeural",
        rate="-5%",
        lang="sr-RS",  # Serbian accent
    ),
    "Carl Sagan": VoiceConfig(
        voice_name="en-US-BrandonNeural",
        rate="-10%",
    ),
    "Alan Turing": VoiceConfig(
        voice_name="en-GB-RyanNeural",
        rate="-5%",
    ),
    "Ludwig Wittgenstein": VoiceConfig(
        voice_name="en-GB-RyanNeural",
        rate="-10%",
        lang="de-AT",  # Austrian German accent
    ),
    "Fyodor Dostoevsky": VoiceConfig(
        voice_name="en-US-DavisNeural",
        rate="-10%", pitch="-10%",
        lang="ru-RU",  # Russian accent
    ),
    "Siddhartha Gautama": VoiceConfig(
        voice_name="en-IN-PrabhatNeural",
        rate="-15%",
    ),
    "Simone de Beauvoir": VoiceConfig(
        voice_name="en-US-JennyNeural",
        rate="-5%",
        lang="fr-FR",  # French accent
    ),
}

DEFAULT_VOICE = VoiceConfig(voice_name="en-US-GuyNeural")


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


def _build_ssml(text: str, voice_cfg: VoiceConfig) -> str:
    """Build SSML document with voice, rate, pitch, and optional accent."""
    # Escape XML special chars in text
    escaped = (text
               .replace("&", "&amp;")
               .replace("<", "&lt;")
               .replace(">", "&gt;")
               .replace('"', "&quot;")
               .replace("'", "&apos;"))

    # Build prosody attributes
    prosody_attrs = []
    if voice_cfg.rate != "0%":
        prosody_attrs.append(f'rate="{voice_cfg.rate}"')
    if voice_cfg.pitch != "0%":
        prosody_attrs.append(f'pitch="{voice_cfg.pitch}"')
    prosody_open = f'<prosody {" ".join(prosody_attrs)}>' if prosody_attrs else ""
    prosody_close = "</prosody>" if prosody_attrs else ""

    # Wrap with <lang> tag for accent if specified
    if voice_cfg.lang:
        content = f'<lang xml:lang="{voice_cfg.lang}">{prosody_open}{escaped}{prosody_close}</lang>'
    else:
        content = f"{prosody_open}{escaped}{prosody_close}"

    ssml = f"""<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
    xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
  <voice name="{voice_cfg.voice_name}">
    {content}
  </voice>
</speak>"""
    return ssml


@dataclass
class WordBoundaryEvent:
    audio_offset_ms: float
    duration_ms: float
    text: str
    text_offset: int
    word_length: int


@dataclass
class AudioResult:
    url: str
    duration_seconds: int


def get_voice_for_thinker(thinker_name: str) -> VoiceConfig:
    return AZURE_VOICE_MAP.get(thinker_name, DEFAULT_VOICE)


def _synthesize_with_word_boundaries(
    ssml: str,
) -> tuple[bytes, list[WordBoundaryEvent], float]:
    """Run Azure Speech synthesis synchronously, collecting word boundaries.

    Returns (audio_data, word_boundaries, duration_seconds).
    """
    speech_config = speechsdk.SpeechConfig(
        subscription=settings.azure_speech_key,
        region=settings.azure_speech_region,
    )
    speech_config.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3
    )

    # Synthesize to in-memory stream
    synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config,
        audio_config=None,  # No audio output device, get bytes
    )

    boundaries: list[WordBoundaryEvent] = []

    def on_word_boundary(evt):
        boundaries.append(WordBoundaryEvent(
            audio_offset_ms=evt.audio_offset / TICKS_PER_MS,
            duration_ms=evt.duration.total_seconds() * 1000,
            text=evt.text,
            text_offset=evt.text_offset,
            word_length=evt.word_length,
        ))

    synthesizer.synthesis_word_boundary.connect(on_word_boundary)

    result = synthesizer.speak_ssml_async(ssml).get()

    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        audio_data = result.audio_data
        duration_s = len(audio_data) / (16000 * 2)  # rough estimate for 16kHz
        # Better: use audio duration from result if available
        if result.audio_duration:
            duration_s = result.audio_duration.total_seconds()
        return audio_data, boundaries, duration_s
    elif result.reason == speechsdk.ResultReason.Canceled:
        details = result.cancellation_details
        raise RuntimeError(
            f"Azure Speech synthesis canceled: {details.reason}. "
            f"Error: {details.error_details}"
        )
    else:
        raise RuntimeError(f"Azure Speech synthesis failed: {result.reason}")


MAX_CHUNK_CHARS = 5000  # Stay well under Azure's 10-min single-synthesis limit


def _chunk_paragraphs(paragraphs: list[str], max_chars: int = MAX_CHUNK_CHARS) -> list[list[int]]:
    """Group paragraph indices into chunks that stay under max_chars."""
    chunks: list[list[int]] = []
    current: list[int] = []
    current_len = 0
    for i, para in enumerate(paragraphs):
        plen = len(para) + 2  # +2 for \n\n separator
        if current and current_len + plen > max_chars:
            chunks.append(current)
            current = [i]
            current_len = plen
        else:
            current.append(i)
            current_len += plen
    if current:
        chunks.append(current)
    return chunks


def _synthesize_chunk(
    paragraphs: list[str],
    para_indices: list[int],
    voice_cfg: VoiceConfig,
    time_offset_ms: float,
) -> tuple[bytes, list[dict], float]:
    """Synthesize a chunk of paragraphs, returning (audio_bytes, word_timings, duration_ms)."""
    chunk_text = "\n\n".join(paragraphs[i] for i in para_indices)
    ssml = _build_ssml(chunk_text, voice_cfg)
    audio_data, boundaries, duration_s = _synthesize_with_word_boundaries(ssml)

    # Build char ranges within the chunk text
    para_char_ranges: list[tuple[int, int, int]] = []  # (start, end, global_para_idx)
    offset = 0
    for idx in para_indices:
        start = chunk_text.index(paragraphs[idx], offset)
        end = start + len(paragraphs[idx])
        para_char_ranges.append((start, end, idx))
        offset = end

    word_timings: list[dict] = []
    for wb in boundaries:
        para_idx = para_indices[-1]  # default to last
        for pstart, pend, gidx in para_char_ranges:
            if pstart <= wb.text_offset < pend:
                para_idx = gidx
                break

        word_timings.append({
            "s": round(wb.audio_offset_ms + time_offset_ms),
            "e": round(wb.audio_offset_ms + wb.duration_ms + time_offset_ms),
            "p": para_idx,
        })

    return audio_data, word_timings, duration_s * 1000


async def generate_audio(
    transcript: str,
    thinker_name: str,
    lecture_id: str | uuid.UUID,
) -> AudioResult:
    """Generate audio via Azure Speech TTS with SSML accent controls."""
    os.makedirs(AUDIO_DIR, exist_ok=True)

    voice_cfg = get_voice_for_thinker(thinker_name)
    clean_text = strip_markdown(transcript)

    paragraphs = [p.strip() for p in clean_text.split("\n\n") if p.strip()]
    chunks = _chunk_paragraphs(paragraphs)

    all_audio = bytearray()
    all_timings: list[dict] = []
    total_duration_ms = 0.0
    loop = asyncio.get_event_loop()

    for chunk_indices in chunks:
        audio_data, timings, chunk_dur_ms = await loop.run_in_executor(
            None, _synthesize_chunk, paragraphs, chunk_indices, voice_cfg, total_duration_ms
        )
        all_audio.extend(audio_data)
        all_timings.extend(timings)
        total_duration_ms += chunk_dur_ms

    # Write audio file
    filepath = os.path.join(AUDIO_DIR, f"{lecture_id}.mp3")
    with open(filepath, "wb") as f:
        f.write(all_audio)

    # Write word timings JSON
    timings_path = os.path.join(AUDIO_DIR, f"{lecture_id}.json")
    with open(timings_path, "w", encoding="utf-8") as f:
        json.dump({"p": paragraphs, "w": all_timings}, f, ensure_ascii=False)

    return AudioResult(url=f"/audio/{lecture_id}.mp3", duration_seconds=int(total_duration_ms / 1000))
