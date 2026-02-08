import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import { fetchLecture, fetchWordTimings, type Lecture, type TimingsData } from '../api/client'
import SyncedTranscript from '../components/SyncedTranscript'
import ThinkerAvatar from '../components/ThinkerAvatar'
import AudioPlayer from '../components/AudioPlayer'

export default function LecturePage() {
  const { id } = useParams<{ id: string }>()
  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [loading, setLoading] = useState(true)
  const [timingsData, setTimingsData] = useState<TimingsData | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!id) return
    fetchLecture(id)
      .then(setLecture)
      .finally(() => setLoading(false))
  }, [id])

  // Load word timings when audio URL is available
  useEffect(() => {
    if (!lecture?.audio_url) return
    fetchWordTimings(lecture.audio_url).then(setTimingsData)
  }, [lecture?.audio_url])

  if (loading) return <p className="text-center py-12 font-sans text-muted">Loading lecture…</p>
  if (!lecture) return <p className="text-center py-12 font-sans text-burgundy">Lecture not found</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="badge">Lecture {lecture.sequence_number}</span>
          {lecture.course_title && (
            <Link to={`/courses/${lecture.course_id}`} className="text-xs font-sans text-muted hover:text-gold transition-colors">
              {lecture.course_title}
            </Link>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">{lecture.title}</h1>
        <div className="flex items-center gap-3 mt-3 text-sm font-sans">
          {lecture.thinker_name && (
            <div className="flex items-center gap-2">
              <ThinkerAvatar name={lecture.thinker_name} imageUrl={lecture.thinker_image_url} size="sm" />
              <span className="text-gold font-medium">{lecture.thinker_name}</span>
            </div>
          )}
          <span className="text-muted">·</span>
          <span className={
            lecture.status === 'ready' ? 'status-ready font-medium' :
            lecture.status === 'generating' ? 'status-generating font-medium' :
            'status-error font-medium'
          }>
            ● {lecture.status}
          </span>
          {lecture.duration_seconds && (
            <span className="text-muted">·  {Math.round(lecture.duration_seconds / 60)} min</span>
          )}
        </div>
      </div>

      {/* Audio Player */}
      {lecture.audio_url && (
        <AudioPlayer src={lecture.audio_url} audioRef={audioRef} />
      )}

      {/* Transcript */}
      <div className="card p-8">
        <p className="text-xs font-sans font-semibold uppercase tracking-wider text-gold mb-4">Transcript</p>
        {timingsData && timingsData.w.length > 0 ? (
          <SyncedTranscript timingsData={timingsData} audioRef={audioRef} />
        ) : (
          <div className="prose prose-lg max-w-none leading-relaxed font-serif">
            {lecture.transcript ? <Markdown>{lecture.transcript}</Markdown> : <p className="text-muted">No transcript available.</p>}
          </div>
        )}
      </div>

      <Link to="/courses" className="back-link">
        ← Back to courses
      </Link>
    </div>
  )
}
