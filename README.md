# Synthetic Symposium

An AI-powered educational platform where history's greatest minds deliver university lectures as themselves.

Einstein teaches special relativity. Socrates walks you through the Allegory of the Cave. Nietzsche lectures on master-slave morality. Dostoevsky unpacks the Grand Inquisitor. Each lecture is generated as a transcript in the thinker's authentic voice and style, then converted to audio with phrase-level synchronized highlighting.

## Tech Stack

- **Backend:** Python 3.11+ / FastAPI / SQLite / SQLAlchemy
- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS
- **AI:** GitHub Models API (gpt-4o-mini) for transcript generation
- **TTS:** edge-tts (Microsoft Edge TTS) with word-boundary timing data
- **Themes:** Classical, Midnight, Nord, Rosé Pine

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- GitHub PAT with `models:read` scope

### 1. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your GitHub PAT:

```env
GITHUB_TOKEN=ghp_your_github_pat_here
```

### 2. Backend

```bash
cd backend
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate        # Windows (cmd/PowerShell)
# source .venv/bin/activate   # macOS/Linux

pip install -e ".[dev]"

# Run database migrations
alembic upgrade head

# Seed the database with thinkers, courses, and lectures
python scripts/seed.py

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The backend runs at **http://localhost:8000**.

### 3. Frontend

```bash
cd web
npm install
npm run dev
```

The frontend runs at **http://localhost:5173**.

### 4. Generate lecture audio (optional)

Lectures are seeded with transcripts but no audio. To generate audio + word timings for a lecture, use the API:

```bash
curl -X POST http://localhost:8000/api/lectures/{lecture_id}/generate-audio
```

Or generate all lectures from the seed script (audio generation happens automatically when lectures are created via the API).

## API Documentation

Once the backend is running, visit: http://localhost:8000/docs

## Features

- **12 thinkers** across 8 disciplines (Philosophy, Physics, Literature, Mathematics, Computer Science, Astronomy, Engineering, Religion & Spirituality)
- **Authentic voice & style** — each thinker's system prompt captures their mannerisms, vocabulary, and intellectual approach
- **Phrase-level transcript sync** — Spotify-style highlighting that follows audio playback in real time
- **4 themes** — Classical (warm parchment), Midnight (dark blue), Nord (cool frost), Rosé Pine (muted rose)
- **Click-to-seek** — click any phrase in the transcript to jump to that point in the audio

## Project Status

Active development — personal project.

## License

MIT
