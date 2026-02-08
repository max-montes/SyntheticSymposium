import uuid

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.db.session import get_db
from app.models.course import Course
from app.models.lecture import Lecture
from app.schemas.lecture import LectureGenerateRequest, LectureResponse
from app.services.lecture_generator import generate_lecture_transcript

router = APIRouter(prefix="/api/lectures", tags=["lectures"])


def _require_admin(x_admin_key: str | None):
    """Validate admin API key."""
    if not settings.admin_api_key or x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Admin access required")


async def _generate_audio_for_lecture(transcript: str, thinker_name: str, lecture_id):
    """Dispatch to the configured TTS provider."""
    if settings.tts_provider == "azure":
        from app.services.azure_tts_service import generate_audio
    elif settings.tts_provider == "openai":
        from app.services.openai_tts_service import generate_audio
    else:
        from app.services.tts_service import generate_audio
    return await generate_audio(transcript, thinker_name, lecture_id)


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
    result = await db.execute(
        select(Lecture)
        .options(selectinload(Lecture.course).selectinload(Course.thinker))
        .where(Lecture.id == lecture_id)
    )
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    resp = LectureResponse.model_validate(lecture)
    if lecture.course:
        resp.course_title = lecture.course.title
        if lecture.course.thinker:
            resp.thinker_name = lecture.course.thinker.name
            resp.thinker_image_url = lecture.course.thinker.image_url
    return resp


@router.post("/generate", response_model=LectureResponse, status_code=201)
async def generate_lecture(
    data: LectureGenerateRequest,
    db: AsyncSession = Depends(get_db),
    x_admin_key: str | None = Header(None),
):
    """Generate a new lecture transcript using AI. Admin only."""
    _require_admin(x_admin_key)
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
        title=data.title,
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


@router.post("/{lecture_id}/generate-audio", response_model=LectureResponse)
async def generate_lecture_audio(
    lecture_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    x_admin_key: str | None = Header(None),
):
    """Generate TTS audio for an existing lecture. Admin only."""
    _require_admin(x_admin_key)
    result = await db.execute(
        select(Lecture)
        .options(selectinload(Lecture.course).selectinload(Course.thinker))
        .where(Lecture.id == lecture_id)
    )
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    if lecture.status != "ready":
        raise HTTPException(status_code=400, detail="Lecture transcript not ready")

    if not lecture.transcript:
        raise HTTPException(status_code=400, detail="Lecture has no transcript")

    thinker_name = lecture.course.thinker.name

    try:
        result = await _generate_audio_for_lecture(
            transcript=lecture.transcript,
            thinker_name=thinker_name,
            lecture_id=lecture.id,
        )
        lecture.audio_url = result.url
        lecture.duration_seconds = result.duration_seconds
        await db.flush()
        await db.refresh(lecture)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Audio generation failed: {str(e)}"
        )

    return lecture
