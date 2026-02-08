import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.thinker import Thinker
from app.schemas.thinker import ThinkerCreate, ThinkerResponse, ThinkerUpdate

router = APIRouter(prefix="/api/thinkers", tags=["thinkers"])


@router.get("/", response_model=list[ThinkerResponse])
async def list_thinkers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Thinker).order_by(Thinker.name))
    return result.scalars().all()


@router.get("/{thinker_id}", response_model=ThinkerResponse)
async def get_thinker(thinker_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    thinker = await db.get(Thinker, thinker_id)
    if not thinker:
        raise HTTPException(status_code=404, detail="Thinker not found")
    return thinker


@router.post("/", response_model=ThinkerResponse, status_code=201)
async def create_thinker(data: ThinkerCreate, db: AsyncSession = Depends(get_db)):
    thinker = Thinker(**data.model_dump())
    db.add(thinker)
    await db.flush()
    await db.refresh(thinker)
    return thinker


@router.patch("/{thinker_id}", response_model=ThinkerResponse)
async def update_thinker(
    thinker_id: uuid.UUID, data: ThinkerUpdate, db: AsyncSession = Depends(get_db)
):
    thinker = await db.get(Thinker, thinker_id)
    if not thinker:
        raise HTTPException(status_code=404, detail="Thinker not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(thinker, key, value)
    await db.flush()
    await db.refresh(thinker)
    return thinker


@router.delete("/{thinker_id}", status_code=204)
async def delete_thinker(thinker_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    thinker = await db.get(Thinker, thinker_id)
    if not thinker:
        raise HTTPException(status_code=404, detail="Thinker not found")
    await db.delete(thinker)
