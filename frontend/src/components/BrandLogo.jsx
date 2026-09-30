import { motion } from 'framer-motion'

/**
 * BrandLogo — the single visual identity of Smart Court.
 * Use it everywhere the AI is "speaking" or branded.
 *
 * Props:
 *   size:    pixel size (default 44)
 *   halo:    show emerald glow behind (default true)
 *   animate: subtle hover tilt (default true). Set false for inline / avatar uses.
 */
export default function BrandLogo({ size = 44, halo = true, animate = true, className = '' }) {
  const Wrap = animate ? motion.div : 'div'
  const wrapProps = animate
    ? {
        whileHover: { scale: 1.06, rotate: -3 },
        transition: { type: 'spring', stiffness: 320, damping: 20 },
      }
    : {}
  const uid = `${Math.random().toString(36).slice(2, 7)}`
  return (
    <Wrap
      {...wrapProps}
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 44 44" width={size} height={size} aria-label="Smart Court" role="img">
        <defs>
          <linearGradient id={`logoBg-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0"    stopColor="#6EE7B7" />
            <stop offset="0.55" stopColor="#10B981" />
            <stop offset="1"    stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Plate */}
        <rect x="1.5" y="1.5" width="41" height="41" rx="12" fill={`url(#logoBg-${uid})`} />
        {/* Top highlight */}
        <rect x="1.5" y="1.5" width="41" height="20" rx="12" fill="white" opacity="0.10" />

        {/* The mark — stylised A doubling as scale */}
        <g stroke="#0A0A0B" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <line x1="11"   y1="30"   x2="33"   y2="30" />
          <path d="M14 30 L22 12 L30 30" />
          <line x1="17.5" y1="23.5" x2="26.5" y2="23.5" />
        </g>
        <circle cx="22" cy="34" r="1.3" fill="#0A0A0B" />
      </svg>

      {halo && (
        <span
          aria-hidden
          className="absolute -inset-1.5 rounded-[18px] bg-accent-500/30 blur-xl -z-10"
        />
      )}
    </Wrap>
  )
}
