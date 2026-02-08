import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchThinkers, type Thinker } from '../api/client'
import ThinkerAvatar from '../components/ThinkerAvatar'

const TAGLINES: Record<string, string> = {
  'Ada Lovelace': 'Pioneer of computing & the first programmer',
  'Alan Turing': 'Father of computer science & codebreaker',
  'Albert Einstein': 'Architect of relativity & modern physics',
  'Carl Sagan': 'Astronomer & cosmic storyteller',
  'Friedrich Nietzsche': 'Philosopher of will, power & morality',
  'Fyodor Dostoevsky': 'Novelist of the human soul & suffering',
  'Ludwig Wittgenstein': 'Philosopher of language & logic',
  'Nikola Tesla': 'Inventor of AC power & electrical visionary',
  'Richard Feynman': 'Nobel physicist & master explainer',
  'Siddhartha Gautama': 'The Buddha — teacher of liberation',
  'Simone de Beauvoir': 'Existentialist feminist & philosopher',
  'Socrates': 'Father of Western philosophy',
}

export default function HomePage() {
  const [thinkers, setThinkers] = useState<Thinker[]>([])

  useEffect(() => {
    fetchThinkers().then(setThinkers).catch(() => {})
  }, [])

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section
        className="-mx-4 -mt-8 px-4 py-20 text-center space-y-6"
        style={{
          background: 'linear-gradient(135deg, var(--color-hero-gradient-from), var(--color-hero-gradient-to))',
        }}
      >
        <h1 className="text-5xl md:text-6xl font-bold leading-tight text-nav-text">
          Learn from History's
          <br />
          <span className="text-gold">Greatest Minds</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto font-sans leading-relaxed text-nav-text opacity-75">
          AI-powered lectures delivered by the thinkers themselves.
          Einstein on relativity. Nietzsche on morality. Feynman on quantum mechanics.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="#faculty"
            className="bg-gold px-8 py-3 rounded-lg font-sans font-semibold hover:opacity-90 transition-opacity shadow-md"
            style={{ color: 'var(--color-btn-text)' }}
          >
            Meet the Faculty
          </a>
          <Link
            to="/courses"
            className="border-2 border-gold text-gold px-8 py-3 rounded-lg font-sans font-semibold hover:bg-gold/10 transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      </section>

      {/* Faculty */}
      <section id="faculty">
        <h2 className="text-3xl font-bold text-center mb-2">The Faculty</h2>
        <p className="text-center text-muted font-sans mb-8">Twelve of history's most influential minds, ready to teach</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {thinkers.map((t) => (
            <Link
              key={t.id}
              to={`/thinkers/${t.id}`}
              className="bg-surface rounded-xl p-5 border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:bg-card-hover group"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-4 mb-3">
                <ThinkerAvatar name={t.name} imageUrl={t.image_url} />
                <div>
                  <h3 className="text-lg font-bold group-hover:text-gold transition-colors">{t.name}</h3>
                  <p className="text-gold font-sans text-xs font-medium">{t.era}</p>
                </div>
              </div>
              <p className="text-muted font-sans text-sm">{TAGLINES[t.name] || t.era}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-surface rounded-2xl p-10 border" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-3xl font-bold text-center mb-2">How It Works</h2>
        <p className="text-center text-muted font-sans mb-8">Three steps to learn from history's greatest</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-sans">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
              <span className="text-2xl">🎓</span>
            </div>
            <h3 className="text-lg font-bold">Choose a Thinker</h3>
            <p className="text-muted text-sm">Pick from history's most brilliant minds across every discipline.</p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
              <span className="text-2xl">📜</span>
            </div>
            <h3 className="text-lg font-bold">Generate a Lecture</h3>
            <p className="text-muted text-sm">AI creates an authentic lecture in the thinker's own voice and style.</p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
              <span className="text-2xl">🎧</span>
            </div>
            <h3 className="text-lg font-bold">Listen & Learn</h3>
            <p className="text-muted text-sm">Read the transcript or listen to the audio — like attending their class.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
