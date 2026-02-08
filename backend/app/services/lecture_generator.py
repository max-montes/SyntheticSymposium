import httpx

from app.config import settings


async def generate_lecture_transcript(
    thinker_name: str,
    system_prompt: str,
    topic: str,
    speaking_style: str = "",
) -> str:
    """Generate a lecture transcript using the GitHub Models API."""

    if not system_prompt:
        system_prompt = (
            f"You are {thinker_name}. You are giving a talk to a friend. "
            f"Your tone, style, and demeanor are that of {thinker_name}. "
            f"Your accent matches that of {thinker_name}. "
            f"If your individual accent is not well known, use the accent of your country of origin. "
            f"Speak in first person — use their known mannerisms, vocabulary, and intellectual style. "
            f"Reference your own published works and ideas where relevant, "
            f"and refer to material from your key influences when relevant."
        )

    if speaking_style:
        system_prompt += f"\n\nSpeaking style notes: {speaking_style}"

    user_message = (
        f"Talk to me about the following topic: {topic}\n\n"
        f"Keep it conversational — like you're explaining this to a sharp friend "
        f"over coffee, not reading from a podium. No flowery preambles or "
        f"'ladies and gentlemen' openings. Just dive into the ideas.\n\n"
        f"Your listener is a graduate-level thinker who can handle complexity, "
        f"nuance, and domain-specific terminology. Use precise language where appropriate. "
        f"Trust them to follow rigorous argumentation.\n\n"
        f"Aim for about 2000-3000 words. Structure it naturally with a few key ideas, "
        f"but don't make it feel like a formal outline."
    )

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            settings.github_models_endpoint,
            headers={
                "Authorization": f"Bearer {settings.github_token}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.default_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                "temperature": 0.8,
                "max_tokens": 8192,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
