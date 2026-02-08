import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  fetchCourse,
  fetchLectures,
  generateLecture,
  generateAudio,
  type Course,
  type Lecture,
} from '../api/client'

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)

  const [topic, setTopic] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatingAudioId, setGeneratingAudioId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchCourse(id), fetchLectures(id)])
      .then(([c, l]) => { setCourse(c); setLectures(l) })
      .finally(() => setLoading(false))
  }, [id])

  const handleGenerate = async () => {
    if (!topic.trim() || !course) return
    setGenerating(true)
    try {
      const lecture = await generateLecture(course.id, topic.trim())
      setLectures((prev) => [...prev, lecture])
      setTopic('')
    } catch (err) {
      console.error('Generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateAudio = async (lectureId: string) => {
    setGeneratingAudioId(lectureId)
    try {
      const updated = await generateAudio(lectureId)
      setLectures((prev) => prev.map((l) => (l.id === lectureId ? updated : l)))
    } catch (err) {
      console.error('Audio generation failed:', err)
    } finally {
      setGeneratingAudioId(null)
    }
  }

  if (loading) return <p className="text-center py-12 font-sans">Loading course...</p>
  if (!course) return <p className="text-center py-12 font-sans text-red-600">Course not found</p>

  const readyLectures = lectures.filter((l) => l.status === 'ready')

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-sans uppercase text-gold tracking-wider">
          {course.difficulty_level}
        </span>
        <h1 className="text-4xl font-bold mt-1">{course.title}</h1>
        <p className="text-ink/60 font-sans mt-2">{course.description}</p>
      </div>

      {/* Generate Lecture Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gold/20 p-6">
        <h2 className="text-lg font-bold mb-4">Generate a New Lecture</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter lecture topic, e.g. 'The Nature of Light'"
            className="flex-1 px-4 py-3 border border-ink/20 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
            disabled={generating}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="px-6 py-3 bg-navy text-white rounded-lg font-sans font-medium hover:bg-navy/90 transition-colors disabled:opacity-50 shrink-0"
          >
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </div>
        {generating && (
          <p className="text-sm text-ink/50 mt-3 font-sans">
            ✍️ The thinker is composing their lecture… this may take 30–60 seconds.
          </p>
        )}
      </div>

      {/* Lectures List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Lectures ({readyLectures.length})
        </h2>
        {lectures.length === 0 ? (
          <p className="text-ink/50 font-sans">
            No lectures yet. Generate one above!
          </p>
        ) : (
          <div className="space-y-4">
            {lectures.map((lecture) => (
              <div
                key={lecture.id}
                className="bg-white rounded-xl shadow-sm border border-gold/20 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/lectures/${lecture.id}`}
                      className="text-lg font-bold hover:text-gold transition-colors"
                    >
                      {lecture.sequence_number}. {lecture.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-xs font-sans text-ink/40">
                      <span className={
                        lecture.status === 'ready' ? 'text-green-600' :
                        lecture.status === 'generating' ? 'text-amber-500' :
                        'text-red-500'
                      }>
                        {lecture.status}
                      </span>
                      {lecture.duration_seconds && (
                        <span>{Math.round(lecture.duration_seconds / 60)} min</span>
                      )}
                      {lecture.audio_url ? (
                        <span className="text-green-600">🔊 Audio ready</span>
                      ) : lecture.status === 'ready' && (
                        <button
                          onClick={() => handleGenerateAudio(lecture.id)}
                          disabled={generatingAudioId === lecture.id}
                          className="text-navy hover:text-gold transition-colors underline"
                        >
                          {generatingAudioId === lecture.id ? 'Generating audio…' : 'Generate audio'}
                        </button>
                      )}
                    </div>
                  </div>
                  {lecture.status === 'ready' && (
                    <Link
                      to={`/lectures/${lecture.id}`}
                      className="px-4 py-2 text-sm font-sans text-navy border border-navy/20 rounded-lg hover:bg-navy hover:text-white transition-colors shrink-0"
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link to="/courses" className="inline-block text-navy font-sans text-sm hover:text-gold transition-colors">
        ← Back to courses
      </Link>
    </div>
  )
}
