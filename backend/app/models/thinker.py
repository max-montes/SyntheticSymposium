import uuid

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Thinker(Base):
    __tablename__ = "thinkers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    era: Mapped[str] = mapped_column(String(100), nullable=False)
    birth_year: Mapped[int | None] = mapped_column(nullable=True)
    death_year: Mapped[int | None] = mapped_column(nullable=True)
    nationality: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    bio: Mapped[str] = mapped_column(Text, nullable=False, default="")
    personality_traits: Mapped[str] = mapped_column(Text, nullable=False, default="")
    speaking_style: Mapped[str] = mapped_column(Text, nullable=False, default="")
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False, default="")
    voice_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    discipline_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    courses: Mapped[list["Course"]] = relationship(back_populates="thinker")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Thinker(name='{self.name}', era='{self.era}')>"
