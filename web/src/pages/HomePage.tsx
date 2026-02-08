import { Link } from 'react-router-dom'

const FEATURED_THINKERS = [
  { name: 'Albert Einstein', field: 'Physics', era: '1879–1955' },
  { name: 'Friedrich Nietzsche', field: 'Philosophy', era: '1844–1900' },
  { name: 'Richard Feynman', field: 'Physics', era: '1918–1988' },
  { name: 'Marie Curie', field: 'Chemistry & Physics', era: '1867–1934' },
  { name: 'Ada Lovelace', field: 'Computer Science', era: '1815–1852' },
  { name: 'Socrates', field: 'Philosophy', era: '470–399 BC' },
]

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-16 space-y-6">
        <h1 className="text-5xl md:text-6xl font-bold text-navy leading-tight">
          Learn from History's
          <br />
          <span className="text-gold">Greatest Minds</span>
        </h1>
        <p className="text-xl text-ink/70 max-w-2xl mx-auto font-sans leading-relaxed">
          AI-powered lectures delivered by the thinkers themselves.
          Einstein on relativity. Nietzsche on morality. Feynman on quantum mechanics.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            to="/thinkers"
            className="bg-navy text-parchment px-8 py-3 rounded-lg font-sans font-medium hover:bg-navy/90 transition-colors"
          >
            Explore Thinkers
          </Link>
          <Link
            to="/courses"
            className="border-2 border-navy text-navy px-8 py-3 rounded-lg font-sans font-medium hover:bg-navy/5 transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      </section>

      {/* Featured Thinkers */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">The Faculty</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_THINKERS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gold/20"
            >
              <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-navy">
                  {t.name.charAt(0)}
                </span>
              </div>
              <h3 className="text-xl font-bold">{t.name}</h3>
              <p className="text-gold font-sans text-sm font-medium">{t.field}</p>
              <p className="text-ink/50 font-sans text-sm mt-1">{t.era}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white rounded-2xl shadow-md p-10">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-sans">
          <div className="text-center space-y-3">
            <div className="text-4xl">🎓</div>
            <h3 className="text-lg font-bold">Choose a Thinker</h3>
            <p className="text-ink/60">Pick from history's most brilliant minds across every discipline.</p>
          </div>
          <div className="text-center space-y-3">
            <div className="text-4xl">📜</div>
            <h3 className="text-lg font-bold">Generate a Lecture</h3>
            <p className="text-ink/60">AI creates an authentic lecture in the thinker's own voice and style.</p>
          </div>
          <div className="text-center space-y-3">
            <div className="text-4xl">🎧</div>
            <h3 className="text-lg font-bold">Listen & Learn</h3>
            <p className="text-ink/60">Read the transcript or listen to the audio — like attending their class.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
