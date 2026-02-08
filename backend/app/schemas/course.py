import uuid

from pydantic import BaseModel


class CourseBase(BaseModel):
    title: str
    description: str = ""
    difficulty_level: str = "introductory"
    num_lectures: int = 5
    thinker_id: uuid.UUID
    discipline_id: uuid.UUID | None = None


class CourseCreate(CourseBase):
    pass


class CourseResponse(CourseBase):
    id: uuid.UUID
    thinker_name: str | None = None

    model_config = {"from_attributes": True}
