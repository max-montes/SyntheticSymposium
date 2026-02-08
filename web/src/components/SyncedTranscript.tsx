import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { TimingsData } from '../api/client'

const SYNC_OFFSET_MS = 0
// Pause gap (ms) that separates one phrase from the next
const PHRASE_GAP_MS = 80

interface Props {
  timingsData: TimingsData
  audioRef: React.RefObject<HTMLAudioElement | null>
}

interface Phrase {
  startIdx: number  // first word index (global)
  endIdx: number    // last word index (global), inclusive
  startMs: number   // audio start time of phrase
}

function tokenize(text: string): { text: string; isWord: boolean }[] {
  const tokens: { text: string; isWord: boolean }[] = []
  const regex = /(\S+)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, match.index), isWord: false })
    }
    tokens.push({ text: match[1], isWord: true })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), isWord: false })
  }
  return tokens
}

export default function SyncedTranscript({ timingsData, audioRef }: Props) {
  const [activePhraseIdx, setActivePhraseIdx] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const activePhraseRef = useRef<HTMLSpanElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number>(0)

  const { p: paragraphs, w: wordTimings } = timingsData

  // Group words into phrases separated by natural pauses
  const phrases: Phrase[] = useMemo(() => {
    if (wordTimings.length === 0) return []
    const groups: Phrase[] = []
    let groupStart = 0
    for (let i = 1; i < wordTimings.length; i++) {
      const gap = wordTimings[i].s - wordTimings[i - 1].e
      if (gap > PHRASE_GAP_MS || wordTimings[i].p !== wordTimings[i - 1].p) {
        groups.push({ startIdx: groupStart, endIdx: i - 1, startMs: wordTimings[groupStart].s })
        groupStart = i
      }
    }
    groups.push({ startIdx: groupStart, endIdx: wordTimings.length - 1, startMs: wordTimings[groupStart].s })

    // Merge orphan phrases (1-2 words) into the previous phrase
    // unless they cross a paragraph boundary
    const merged: Phrase[] = [groups[0]]
    for (let i = 1; i < groups.length; i++) {
      const prev = merged[merged.length - 1]
      const curr = groups[i]
      const currSize = curr.endIdx - curr.startIdx + 1
      const samePara = wordTimings[prev.endIdx].p === wordTimings[curr.startIdx].p
      if (currSize <= 2 && samePara) {
        prev.endIdx = curr.endIdx
      } else {
        merged.push(curr)
      }
    }
    return merged
  }, [wordTimings])

  // Map each global word index → phrase index for fast lookup
  const wordToPhrase = useMemo(() => {
    const map = new Int32Array(wordTimings.length)
    for (let pi = 0; pi < phrases.length; pi++) {
      for (let wi = phrases[pi].startIdx; wi <= phrases[pi].endIdx; wi++) {
        map[wi] = pi
      }
    }
    return map
  }, [phrases, wordTimings.length])

  // Build paragraph rendering data
  const paragraphData = useMemo(() => {
    const paraWordCounts: number[] = new Array(paragraphs.length).fill(0)
    for (const wt of wordTimings) {
      if (wt.p < paraWordCounts.length) paraWordCounts[wt.p]++
    }
    const paraStartIdx: number[] = []
    let cumulative = 0
    for (let i = 0; i < paragraphs.length; i++) {
      paraStartIdx.push(cumulative)
      cumulative += paraWordCounts[i]
    }
    return paragraphs.map((text, pIdx) => {
      const trimmed = text.trim()
      const wordCount = trimmed.split(/\s+/).length
      // Detect section headings: short text, no period at end, <10 words
      const isHeading = wordCount < 10 && !trimmed.endsWith('.') && trimmed.length > 0
      // Strip surrounding quotes from headings (LLM often wraps them)
      const displayText = isHeading ? text.replace(/"/g, '') : text
      const tokens = tokenize(displayText)
      return { tokens, startIdx: paraStartIdx[pIdx], wordCount: paraWordCounts[pIdx], isHeading }
    })
  }, [paragraphs, wordTimings])

  const updateHighlight = useCallback(() => {
    const audio = audioRef.current
    if (!audio || audio.paused) {
      rafRef.current = 0
      return
    }

    const currentMs = audio.currentTime * 1000 - SYNC_OFFSET_MS
    // Binary search for active phrase
    let lo = 0, hi = phrases.length - 1, idx = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (phrases[mid].startMs <= currentMs) {
        idx = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    if (idx >= 0) {
      setActivePhraseIdx(idx)
    }

    rafRef.current = requestAnimationFrame(updateHighlight)
  }, [audioRef, phrases])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlay = () => {
      setIsPlaying(true)
      rafRef.current = requestAnimationFrame(updateHighlight)
    }
    const onPause = () => {
      setIsPlaying(false)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    const onSeeked = () => {
      updateHighlight()
      if (!audio.paused) {
        rafRef.current = requestAnimationFrame(updateHighlight)
      }
    }
    const onEnded = () => {
      setIsPlaying(false)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('seeked', onSeeked)
    audio.addEventListener('ended', onEnded)

    if (!audio.paused) {
      setIsPlaying(true)
      rafRef.current = requestAnimationFrame(updateHighlight)
    }

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('seeked', onSeeked)
      audio.removeEventListener('ended', onEnded)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [audioRef, updateHighlight])

  // Auto-scroll active phrase into view
  useEffect(() => {
    if (activePhraseRef.current && containerRef.current && isPlaying) {
      const container = containerRef.current
      const el = activePhraseRef.current
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()

      const isVisible = elRect.top >= containerRect.top && elRect.bottom <= containerRect.bottom
      if (!isVisible) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [activePhraseIdx, isPlaying])

  const handleWordClick = (globalIdx: number) => {
    const audio = audioRef.current
    if (!audio || globalIdx >= wordTimings.length) return
    audio.currentTime = (wordTimings[globalIdx].s + SYNC_OFFSET_MS) / 1000
    setActivePhraseIdx(wordToPhrase[globalIdx])
  }

  return (
    <div ref={containerRef} className="max-h-[60vh] overflow-y-auto scroll-smooth pr-2">
      {paragraphData.map(({ tokens, startIdx, isHeading }, pIdx) => {
        let wordCounter = 0
        return (
          <p key={pIdx} className={isHeading ? 'mb-4 mt-8 leading-relaxed font-serif text-xl font-bold' : 'mb-4 leading-relaxed font-serif text-lg'}>
            {tokens.map((token, tIdx) => {
              if (!token.isWord) {
                return <span key={tIdx}>{token.text}</span>
              }
              const globalIdx = startIdx + wordCounter
              wordCounter++
              const phraseIdx = globalIdx < wordToPhrase.length ? wordToPhrase[globalIdx] : -1
              const isActive = phraseIdx === activePhraseIdx
              const isPast = phraseIdx < activePhraseIdx
              // Attach ref to first word of the active phrase for auto-scroll
              const isFirstOfActive = isActive && globalIdx === phrases[activePhraseIdx]?.startIdx
              return (
                <span
                  key={tIdx}
                  ref={isFirstOfActive ? activePhraseRef : null}
                  onClick={() => handleWordClick(globalIdx)}
                  className={`
                    cursor-pointer rounded-sm transition-colors duration-200
                    ${isActive
                      ? 'bg-gold/20 text-gold'
                      : isPast && isPlaying
                        ? 'opacity-50'
                        : ''
                    }
                  `}
                >
                  {token.text}
                </span>
              )
            })}
          </p>
        )
      })}
    </div>
  )
}
