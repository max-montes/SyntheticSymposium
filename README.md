# Synthetic Symposium

An AI-powered educational platform where history's greatest minds lecture as themselves.

Einstein teaches general relativity. Nietzsche lectures on master-slave morality. Feynman explains quantum mechanics. Each lecture is generated as a transcript in the thinker's authentic voice and style, then converted to audio.

## Tech Stack

- **Backend:** Python 3.12+ / FastAPI
- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Database:** PostgreSQL + SQLAlchemy + Alembic
- **AI:** GitHub Models API (GPT-4.1, Claude, Gemini)
- **TTS:** ElevenLabs / Open-source alternatives

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose
- GitHub PAT with `models:read` scope

### Setup

1. **Start the database:**
   ```bash
   docker compose up -d
   ```

2. **Backend:**
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   pip install -e ".[dev]"
   alembic upgrade head
   uvicorn app.main:app --reload
   ```

3. **Frontend:**
   ```bash
   cd web
   npm install
   npm run dev
   ```

4. **Configure environment:**
   ```bash
   cp backend/.env.example backend/.env
   # Add your GitHub PAT and other keys
   ```

## API Documentation

Once the backend is running, visit: http://localhost:8000/docs

## Project Status

Early development — personal learning project.

## License

MIT
