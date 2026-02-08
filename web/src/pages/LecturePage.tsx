import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchLecture, type Lecture } from '../api/client'

export default function LecturePage() {
  const { id } = useParams<{ id: string }>()
  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchLecture(id)
      .then(setLecture)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-center py-12 font-sans">Loading lecture...</p>
  if (!lecture) return <p className="text-center py-12 font-sans text-red-600">Lecture not found</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-sans uppercase text-gold tracking-wider">
          Lecture {lecture.sequence_number}
        </span>
        <h1 className="text-4xl font-bold mt-1">{lecture.title}</h1>
        <div className="flex gap-4 mt-2 text-sm font-sans text-ink/50">
          <span>Status: {lecture.status}</span>
          {lecture.duration_seconds && (
            <span>{Math.round(lecture.duration_seconds / 60)} min</span>
          )}
        </div>
      </div>

      {lecture.audio_url && (
        <div className="bg-navy/5 rounded-xl p-4">
          <audio controls className="w-full" src={lecture.audio_url}>
            Your browser does not support audio playback.
          </audio>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gold/20 p-8">
        <h2 className="text-lg font-bold mb-4">Transcript</h2>
        <div className="prose prose-lg max-w-none whitespace-pre-wrap leading-relaxed">
          {lecture.transcript || 'No transcript available.'}
        </div>
      </div>

      <Link to="/courses" className="inline-block text-navy font-sans text-sm hover:text-gold transition-colors">
        ← Back to courses
      </Link>
    </div>
  )
}
