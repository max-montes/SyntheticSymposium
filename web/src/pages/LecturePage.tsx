import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import { fetchLecture, generateAudio, type Lecture } from '../api/client'

export default function LecturePage() {
  const { id } = useParams<{ id: string }>()
  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingAudio, setGeneratingAudio] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchLecture(id)
      .then(setLecture)
      .finally(() => setLoading(false))
  }, [id])

  const handleGenerateAudio = async () => {
    if (!lecture) return
    setGeneratingAudio(true)
    try {
      const updated = await generateAudio(lecture.id)
      setLecture(updated)
    } catch (err) {
      console.error('Audio generation failed:', err)
    } finally {
      setGeneratingAudio(false)
    }
  }

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

      {lecture.audio_url ? (
        <div className="bg-navy/5 rounded-xl p-4">
          <audio controls className="w-full" src={lecture.audio_url}>
            Your browser does not support audio playback.
          </audio>
        </div>
      ) : lecture.status === 'ready' && (
        <div className="bg-navy/5 rounded-xl p-4 text-center">
          <button
            onClick={handleGenerateAudio}
            disabled={generatingAudio}
            className="px-6 py-3 bg-navy text-white rounded-lg font-sans font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
          >
            {generatingAudio ? 'Generating Audio…' : '🔊 Generate Audio'}
          </button>
          {generatingAudio && (
            <p className="text-sm text-ink/50 mt-2 font-sans">
              This may take a minute for longer lectures…
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gold/20 p-8">
        <h2 className="text-lg font-bold mb-4">Transcript</h2>
        <div className="prose prose-lg max-w-none leading-relaxed">
          {lecture.transcript ? <Markdown>{lecture.transcript}</Markdown> : 'No transcript available.'}
        </div>
      </div>

      <Link to="/courses" className="inline-block text-navy font-sans text-sm hover:text-gold transition-colors">
        ← Back to courses
      </Link>
    </div>
  )
}
