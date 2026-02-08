const API_BASE = '/api'

export interface Thinker {
  id: string
  name: string
  era: string
  birth_year: number | null
  death_year: number | null
  nationality: string
  bio: string
  personality_traits: string
  speaking_style: string
  image_url: string | null
  discipline_id: string | null
}

export interface Course {
  id: string
  title: string
  description: string
  difficulty_level: string
  num_lectures: number
  thinker_id: string
}

export interface Lecture {
  id: string
  title: string
  sequence_number: number
  transcript: string
  audio_url: string | null
  status: string
  duration_seconds: number | null
  course_id: string
  created_at: string
  updated_at: string
}

export async function fetchThinkers(): Promise<Thinker[]> {
  const res = await fetch(`${API_BASE}/thinkers/`)
  if (!res.ok) throw new Error('Failed to fetch thinkers')
  return res.json()
}

export async function fetchThinker(id: string): Promise<Thinker> {
  const res = await fetch(`${API_BASE}/thinkers/${id}`)
  if (!res.ok) throw new Error('Failed to fetch thinker')
  return res.json()
}

export async function fetchCourses(thinkerId?: string): Promise<Course[]> {
  const params = thinkerId ? `?thinker_id=${thinkerId}` : ''
  const res = await fetch(`${API_BASE}/courses/${params}`)
  if (!res.ok) throw new Error('Failed to fetch courses')
  return res.json()
}

export async function fetchCourse(id: string): Promise<Course> {
  const res = await fetch(`${API_BASE}/courses/${id}`)
  if (!res.ok) throw new Error('Failed to fetch course')
  return res.json()
}

export async function createCourse(data: {
  title: string
  description: string
  thinker_id: string
  difficulty_level?: string
  num_lectures?: number
}): Promise<Course> {
  const res = await fetch(`${API_BASE}/courses/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create course')
  return res.json()
}

export async function fetchLectures(courseId: string): Promise<Lecture[]> {
  const res = await fetch(`${API_BASE}/lectures/?course_id=${courseId}`)
  if (!res.ok) throw new Error('Failed to fetch lectures')
  return res.json()
}

export async function fetchLecture(id: string): Promise<Lecture> {
  const res = await fetch(`${API_BASE}/lectures/${id}`)
  if (!res.ok) throw new Error('Failed to fetch lecture')
  return res.json()
}

export async function generateLecture(courseId: string, topic: string): Promise<Lecture> {
  const res = await fetch(`${API_BASE}/lectures/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_id: courseId, topic }),
  })
  if (!res.ok) throw new Error('Failed to generate lecture')
  return res.json()
}

export async function generateAudio(lectureId: string): Promise<Lecture> {
  const res = await fetch(`${API_BASE}/lectures/${lectureId}/generate-audio`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to generate audio')
  return res.json()
}
