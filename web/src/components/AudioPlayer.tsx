import { useEffect, useRef, useState, useCallback } from 'react'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

interface Props {
  src: string
  audioRef: React.RefObject<HTMLAudioElement | null>
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ src, audioRef }: Props) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const progressRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)

  const tick = useCallback(() => {
    const a = audioRef.current
    if (a && !a.paused) {
      setCurrentTime(a.currentTime)
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [audioRef])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return

    const onPlay = () => { setPlaying(true); rafRef.current = requestAnimationFrame(tick) }
    const onPause = () => { setPlaying(false); cancelAnimationFrame(rafRef.current) }
    const onEnded = () => { setPlaying(false); cancelAnimationFrame(rafRef.current) }
    const onLoaded = () => setDuration(a.duration)
    const onTimeUpdate = () => setCurrentTime(a.currentTime)

    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('ended', onEnded)
    a.addEventListener('loadedmetadata', onLoaded)
    a.addEventListener('timeupdate', onTimeUpdate)

    if (a.duration) setDuration(a.duration)

    return () => {
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('loadedmetadata', onLoaded)
      a.removeEventListener('timeupdate', onTimeUpdate)
      cancelAnimationFrame(rafRef.current)
    }
  }, [audioRef, tick])

  const togglePlay = () => {
    const a = audioRef.current
    if (!a) return
    a.paused ? a.play() : a.pause()
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    const bar = progressRef.current
    if (!a || !bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    a.currentTime = pct * duration
    setCurrentTime(a.currentTime)
  }

  const cycleSpeed = () => {
    const a = audioRef.current
    if (!a) return
    const idx = SPEEDS.indexOf(speed)
    const next = SPEEDS[(idx + 1) % SPEEDS.length]
    a.playbackRate = next
    setSpeed(next)
  }

  const skip = (secs: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Math.max(0, Math.min(duration, a.currentTime + secs))
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="card p-4 sticky top-0 z-10 space-y-2">
      {/* Hidden native audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Controls + progress inline */}
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-btn-text)' }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2.5v11l9-5.5z" />
            </svg>
          )}
        </button>

        {/* Skip back */}
        <button
          onClick={() => skip(-15)}
          className="w-14 text-sm font-sans font-bold transition-colors py-1.5 rounded-md shrink-0 text-center"
          style={{
            color: 'var(--color-muted)',
            border: '1px solid var(--color-border)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)'; e.currentTarget.style.borderColor = 'var(--color-accent)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
          aria-label="Skip back 15 seconds"
        >
          −15s
        </button>

        {/* Progress bar + time */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div
            ref={progressRef}
            onClick={seek}
            className="h-2 rounded-full cursor-pointer relative group"
            style={{ backgroundColor: 'var(--color-border)' }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-100"
              style={{ width: `${pct}%`, backgroundColor: 'var(--color-accent)' }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
              style={{
                left: `${pct}%`,
                marginLeft: '-7px',
                backgroundColor: 'var(--color-accent)',
                border: '2px solid var(--color-surface)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs font-sans" style={{ color: 'var(--color-muted)' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>

        {/* Skip forward */}
        <button
          onClick={() => skip(15)}
          className="w-14 text-sm font-sans font-bold transition-colors py-1.5 rounded-md shrink-0 text-center"
          style={{
            color: 'var(--color-muted)',
            border: '1px solid var(--color-border)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)'; e.currentTarget.style.borderColor = 'var(--color-accent)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
          aria-label="Skip forward 15 seconds"
        >
          +15s
        </button>

        {/* Speed */}
        <button
          onClick={cycleSpeed}
          className="px-3 py-1.5 rounded-md text-sm font-sans font-bold transition-colors shrink-0"
          style={{
            backgroundColor: speed !== 1 ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'var(--color-card-hover, var(--color-border))',
            color: speed !== 1 ? 'var(--color-accent)' : 'var(--color-muted)',
          }}
          aria-label={`Playback speed: ${speed}x`}
        >
          {speed}×
        </button>
      </div>
    </div>
  )
}
