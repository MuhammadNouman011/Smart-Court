/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Modern dark tech: charcoal canvas + emerald accent + cream text.
        ink: {
          950: '#050507',
          900: '#0A0A0B',   // base
          800: '#111114',   // surface
          700: '#18181B',   // panel
          600: '#27272A',
          500: '#3F3F46',
        },
        cream: {
          50:  '#FAFAF9',
          100: '#F4F4F5',   // primary text
          200: '#E4E4E7',
          300: '#A1A1AA',
          400: '#71717A',
        },
        accent: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',   // primary emerald
          600: '#059669',
          700: '#047857',
          800: '#065F46',
        },
        rose: {
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
        },
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
        },
        // Legacy aliases (so older files don't error if they sneak through)
        midnight: { 900: '#0A0A0B', 800: '#111114', 700: '#18181B', 600: '#27272A' },
        parchment: { 50: '#FAFAF9', 100: '#F4F4F5', 200: '#E4E4E7' },
        gold: { 300: '#6EE7B7', 400: '#10B981', 500: '#059669', 600: '#047857', 100: '#D1FAE5', 200: '#A7F3D0', 700: '#065F46' },
        emerald: { 400: '#10B981', 500: '#059669', 600: '#047857' },
      },
      fontFamily: {
        sans:    ['"Geist"', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono:    ['"Geist Mono"', 'ui-monospace', 'monospace'],
        urdu:    ['"Noto Nastaliq Urdu"', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        crisp:    '-0.02em',
        caps:     '0.18em',
      },
      boxShadow: {
        glow:      '0 0 0 1px rgba(16,185,129,0.18), 0 20px 60px -20px rgba(16,185,129,0.35)',
        elevated:  '0 1px 0 0 rgba(255,255,255,0.04), 0 30px 60px -20px rgba(0,0,0,0.7)',
        inset:     'inset 0 1px 0 0 rgba(255,255,255,0.04)',
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.05 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        'radial-emerald': 'radial-gradient(600px circle at var(--mx,50%) var(--my,30%), rgba(16,185,129,0.18), transparent 60%)',
      },
      keyframes: {
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        breathe:  { '0%,100%': { opacity: 0.5, transform: 'scale(1)' }, '50%': { opacity: 1, transform: 'scale(1.03)' } },
        scanline: { '0%': { transform: 'translateY(-10%)' }, '100%': { transform: 'translateY(110%)' } },
        floaty:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        meshDrift:{
          '0%':   { transform: 'translate(0px, 0px) rotate(0deg) scale(1)' },
          '50%':  { transform: 'translate(20px, -20px) rotate(180deg) scale(1.1)' },
          '100%': { transform: 'translate(0px, 0px) rotate(360deg) scale(1)' },
        },
        cursorBlink: { '50%': { opacity: 0 } },
        gridPulse: {
          '0%,100%': { opacity: 0.04 },
          '50%':     { opacity: 0.08 },
        },
      },
      animation: {
        shimmer:    'shimmer 3s linear infinite',
        breathe:    'breathe 4s ease-in-out infinite',
        scanline:   'scanline 1.6s ease-in-out infinite',
        floaty:     'floaty 6s ease-in-out infinite',
        meshDrift:  'meshDrift 22s ease-in-out infinite',
        cursorBlink:'cursorBlink 1.1s steps(2,end) infinite',
        gridPulse:  'gridPulse 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
