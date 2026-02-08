import uuid

from pydantic import BaseModel


class ThinkerBase(BaseModel):
    name: str
    era: str
    birth_year: int | None = None
    death_year: int | None = None
    nationality: str = ""
    bio: str = ""
    personality_traits: str = ""
    speaking_style: str = ""
    system_prompt: str = ""
    voice_id: str | None = None
    image_url: str | None = None
    discipline_id: uuid.UUID | None = None


class ThinkerCreate(ThinkerBase):
    pass


class ThinkerUpdate(BaseModel):
    name: str | None = None
    era: str | None = None
    birth_year: int | None = None
    death_year: int | None = None
    nationality: str | None = None
    bio: str | None = None
    personality_traits: str | None = None
    speaking_style: str | None = None
    system_prompt: str | None = None
    voice_id: str | None = None
    image_url: str | None = None
    discipline_id: uuid.UUID | None = None


class ThinkerResponse(ThinkerBase):
    id: uuid.UUID

    model_config = {"from_attributes": True}
