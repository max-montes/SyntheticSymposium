"""Test native-language voices speaking English for accent effect."""
import azure.cognitiveservices.speech as speechsdk
from app.config import settings

cfg = speechsdk.SpeechConfig(
    subscription=settings.azure_speech_key,
    region=settings.azure_speech_region,
)
cfg.set_speech_synthesis_output_format(
    speechsdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3
)
synth = speechsdk.SpeechSynthesizer(speech_config=cfg, audio_config=None)

tests = {
    "socrates-greek": ("el-GR-NestorasNeural", "-5%", "0%",
        "Ah, my friend, you ask about the Allegory of the Cave and the nature of reality. "
        "Let us proceed, not by giving answers, but by asking questions."),
    "einstein-german": ("de-DE-ConradNeural", "-5%", "0%",
        "Now, imagine you are traveling on a beam of light. "
        "What would the world look like from your perspective? This is where it gets interesting."),
    "nietzsche-german": ("de-DE-KillianNeural", "+5%", "0%",
        "God is dead. And we have killed him. "
        "How shall we comfort ourselves, the murderers of all murderers?"),
    "dostoevsky-russian": ("ru-RU-DmitryNeural", "-10%", "0%",
        "The soul of another is a dark forest. "
        "Pain and suffering are always inevitable for a large intelligence and a deep heart."),
}

for name, (voice, rate, pitch, text) in tests.items():
    prosody_attrs = []
    if rate != "0%":
        prosody_attrs.append(f'rate="{rate}"')
    if pitch != "0%":
        prosody_attrs.append(f'pitch="{pitch}"')
    prosody = f'<prosody {" ".join(prosody_attrs)}>' if prosody_attrs else ""
    prosody_end = "</prosody>" if prosody_attrs else ""

    ssml = f"""<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="{voice}">
    {prosody}{text}{prosody_end}
  </voice>
</speak>"""

    result = synth.speak_ssml_async(ssml).get()
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        with open(f"audio/test-{name}.mp3", "wb") as f:
            f.write(result.audio_data)
        dur = result.audio_duration.total_seconds() if result.audio_duration else 0
        print(f"{name}: OK {dur:.1f}s")
    else:
        d = result.cancellation_details
        print(f"{name}: FAIL - {d.error_details[:80]}")
