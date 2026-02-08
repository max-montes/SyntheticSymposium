/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: 'var(--color-bg)',
        ink: 'var(--color-ink)',
        gold: 'var(--color-accent)',
        burgundy: 'var(--color-danger)',
        navy: 'var(--color-primary)',
        surface: 'var(--color-surface)',
        muted: 'var(--color-muted)',
        link: 'var(--color-link)',
        'nav-bg': 'var(--color-nav-bg)',
        'nav-text': 'var(--color-nav-text)',
        'card-hover': 'var(--color-card-hover)',
        'input-bg': 'var(--color-input-bg)',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: 'var(--color-border)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
