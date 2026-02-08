import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.course import Course
from app.models.lecture import Lecture
from app.schemas.lecture import LectureGenerateRequest, LectureResponse
from app.services.lecture_generator import generate_lecture_transcript

router = APIRouter(prefix="/api/lectures", tags=["lectures"])


@router.get("/", response_model=list[LectureResponse])
async def list_lectures(
    course_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db)
):
    query = select(Lecture).order_by(Lecture.sequence_number)
    if course_id:
        query = query.where(Lecture.course_id == course_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{lecture_id}", response_model=LectureResponse)
async def get_lecture(lecture_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    lecture = await db.get(Lecture, lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


@router.post("/generate", response_model=LectureResponse, status_code=201)
async def generate_lecture(
    data: LectureGenerateRequest, db: AsyncSession = Depends(get_db)
):
    """Generate a new lecture transcript using AI."""
    result = await db.execute(
        select(Course)
        .options(selectinload(Course.thinker), selectinload(Course.lectures))
        .where(Course.id == data.course_id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    thinker = course.thinker
    next_seq = len(course.lectures) + 1

    lecture = Lecture(
        title=data.topic,
        sequence_number=next_seq,
        course_id=course.id,
        status="generating",
    )
    db.add(lecture)
    await db.flush()

    try:
        transcript = await generate_lecture_transcript(
            thinker_name=thinker.name,
            system_prompt=thinker.system_prompt,
            topic=data.topic,
            speaking_style=thinker.speaking_style,
        )
        lecture.transcript = transcript
        lecture.status = "ready"
    except Exception as e:
        lecture.status = "error"
        lecture.transcript = f"Generation failed: {str(e)}"

    await db.flush()
    await db.refresh(lecture)
    return lecture
