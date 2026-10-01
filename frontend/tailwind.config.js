const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`
const shades = (name, keys) => Object.fromEntries(keys.map((k) => [k, v(`${name}-${k}`)]))

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // Every palette resolves to a CSS variable (defined per theme in index.css),
      // so all utilities - including opacity (/60) and hover: variants - follow
      // the light/dark toggle automatically.
      colors: {
        ink:       shades('ink',       [950, 900, 800, 700, 600, 500]),
        cream:     shades('cream',     [50, 100, 200, 300, 400]),
        accent:    { ...shades('accent', [200, 300, 400]),
                     50: '#ECFDF5', 100: '#D1FAE5', 500: '#10B981', 600: '#059669', 700: '#047857', 800: '#065F46' },
        rose:      { ...shades('rose', [200, 400]), 500: '#F43F5E', 600: '#E11D48' },
        amber:     shades('amber',     [100, 300, 400, 500]),
        red:       shades('red',       [100, 300, 400, 500]),
        slate:     shades('slate',     [100, 300, 400, 700]),
        sky:       shades('sky',       [100, 400]),
        // Translucent overlays (bg-white/[0.04], border-white/10 ...): white on dark,
        // slate on light. Use bg-[#fff] for a literal white.
        white:     v('overlay'),
        // Legacy aliases (so older files don't error if they sneak through)
        midnight:  { 900: v('ink-900'), 800: v('ink-800'), 700: v('ink-700'), 600: v('ink-600') },
        parchment: shades('parchment', [50, 100, 200]),
        gold:      shades('gold',      [100, 200, 300, 400, 500, 600, 700]),
        emerald:   shades('emerald',   [200, 300, 400, 500, 600]),
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
