import uuid

from sqlalchemy import ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    difficulty_level: Mapped[str] = mapped_column(
        String(50), nullable=False, default="introductory"
    )
    num_lectures: Mapped[int] = mapped_column(Integer, nullable=False, default=5)

    thinker_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("thinkers.id"), nullable=False
    )
    discipline_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(), ForeignKey("disciplines.id"), nullable=True
    )

    thinker: Mapped["Thinker"] = relationship(back_populates="courses")  # noqa: F821
    lectures: Mapped[list["Lecture"]] = relationship(  # noqa: F821
        back_populates="course", order_by="Lecture.sequence_number"
    )

    def __repr__(self) -> str:
        return f"<Course(title='{self.title}')>"
