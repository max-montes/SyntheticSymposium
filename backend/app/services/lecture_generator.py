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
            f"You are {thinker_name}. You are giving a university lecture on a topic "
            f"within your area of expertise. Speak in first person as {thinker_name} would — "
            f"use their known mannerisms, vocabulary, and intellectual style. "
            f"Reference your own published works and ideas where relevant. "
            f"The lecture should be engaging, educational, and approximately 2000-3000 words."
        )

    if speaking_style:
        system_prompt += f"\n\nSpeaking style notes: {speaking_style}"

    user_message = (
        f"Please deliver a lecture on the following topic: {topic}\n\n"
        f"Structure it as a real university lecture with an introduction, "
        f"main body with key concepts, and a conclusion. "
        f"Stay in character throughout."
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
                "max_tokens": 4096,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
