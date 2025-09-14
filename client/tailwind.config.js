/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    container: { center: true, padding: '1rem' },
    extend: {
      /* New fonts: use `font-serif` for headings, `font-sans` for body */
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'sans-serif',
        ],
        serif: [
          'DM Serif Display',
          'ui-serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'Times',
          'serif',
        ],
        // Optional aliases if you want: `font-display`, `font-body`
        display: ['DM Serif Display', 'ui-serif', 'Georgia', 'serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      colors: {
        brand: {
          50:  '#eef6ff',
          100: '#dbeeff',
          200: '#bfdfff',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Primary (links, CTAs)
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          DEFAULT: '#f59e0b',
          600: '#d97706',
        },
        ink: {
          900: '#0f172a',
          700: '#334155',
          500: '#64748b',
        },
      },

      /* Darker / deeper shadows for cards & elevated surfaces */
      boxShadow: {
        soft: '0 8px 24px rgba(2,6,23,.06)',
        card: '0 12px 32px rgba(2,6,23,.12)',           // darker than before
        'card-strong': '0 18px 48px rgba(2,6,23,.22)',  // much stronger
        'elevated-md': '0 8px 24px rgba(15,23,42,.15)',
        'elevated-lg': '0 16px 40px rgba(15,23,42,.25)',
        focus: '0 0 0 4px rgba(37,99,235,.15)',
      },

      borderRadius: {
        xl2: '1rem',
        pill: '999px',
      },
    },
  },
  plugins: [],
}
