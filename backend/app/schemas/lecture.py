import uuid
from datetime import datetime

from pydantic import BaseModel


class LectureBase(BaseModel):
    title: str
    sequence_number: int = 1
    course_id: uuid.UUID


class LectureCreate(LectureBase):
    pass


class LectureGenerateRequest(BaseModel):
    title: str
    topic: str
    course_id: uuid.UUID


class LectureResponse(LectureBase):
    id: uuid.UUID
    transcript: str
    audio_url: str | None = None
    status: str
    duration_seconds: int | None = None
    created_at: datetime
    updated_at: datetime
    # Enriched fields (populated by router)
    thinker_name: str | None = None
    thinker_image_url: str | None = None
    course_title: str | None = None

    model_config = {"from_attributes": True}
