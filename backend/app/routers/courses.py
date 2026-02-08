import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.course import Course
from app.models.thinker import Thinker  # noqa: F401 — needed for selectinload
from app.schemas.course import CourseCreate, CourseResponse

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("/", response_model=list[CourseResponse])
async def list_courses(
    thinker_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db)
):
    query = select(Course).options(selectinload(Course.thinker)).order_by(Course.title)
    if thinker_id:
        query = query.where(Course.thinker_id == thinker_id)
    result = await db.execute(query)
    courses = result.scalars().all()
    response = []
    for c in courses:
        data = CourseResponse.model_validate(c)
        if c.thinker:
            data.thinker_name = c.thinker.name
        response.append(data)
    return response


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Course)
        .options(selectinload(Course.lectures), selectinload(Course.thinker))
        .where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    data = CourseResponse.model_validate(course)
    if course.thinker:
        data.thinker_name = course.thinker.name
    return data


@router.post("/", response_model=CourseResponse, status_code=201)
async def create_course(data: CourseCreate, db: AsyncSession = Depends(get_db)):
    course = Course(**data.model_dump())
    db.add(course)
    await db.flush()
    await db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=204)
async def delete_course(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.delete(course)
