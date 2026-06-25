/**
 * Decorative components — Jaali lattice, Fleurons, Seals, dividers.
 * These create the unique Mughal-editorial character without any libraries.
 */
import { motion } from 'framer-motion'

/** A Mughal-inspired 8-point star jaali (lattice) pattern, repeated. */
export function JaaliBackground({ className = '', opacity = 0.08, color = '#D4AF37' }) {
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
      style={{ opacity }}
    >
      <defs>
        <pattern id="jaali" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth="0.6" strokeLinejoin="round">
            {/* 8-point star (octagram) */}
            <path d="M60 12 L72 36 L96 36 L78 54 L84 80 L60 66 L36 80 L42 54 L24 36 L48 36 Z" />
            {/* Inner octagon */}
            <path d="M60 28 L74 42 L74 58 L60 72 L46 58 L46 42 Z" />
            {/* Tessellation joiners */}
            <path d="M0 60 L24 60 M96 60 L120 60 M60 0 L60 24 M60 96 L60 120" />
            <circle cx="60" cy="60" r="2.4" fill={color} stroke="none" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#jaali)" />
    </svg>
  )
}

/** A single ornate fleuron used as a section divider. */
export function Fleuron({ size = 22, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      className={className} fill="none"
      stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3 c1.5 2.5 4 4 6 4 c-2 0-4.5 1.5-6 4 c-1.5-2.5-4-4-6-4 c2 0 4.5-1.5 6-4z" />
      <path d="M12 13 c1.5 2.5 4 4 6 4 c-2 0-4.5 1.5-6 4 c-1.5-2.5-4-4-6-4 c2 0 4.5-1.5 6-4z" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** A horizontal "page break" — gold rules with a fleuron in the middle. */
export function Divider({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 my-6 ${className}`} aria-hidden>
      <span className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-gold-400/60" />
      <Fleuron size={18} className="text-gold-400" />
      <span className="flex-1 h-px bg-gradient-to-l from-transparent via-gold-400/40 to-gold-400/60" />
    </div>
  )
}

/** Slim editorial section title: chapter number + label with hairline underline. */
export function SectionTitle({ number, label, kicker, className = '' }) {
  return (
    <div className={`flex items-baseline gap-4 ${className}`}>
      {number !== undefined && (
        <span className="chapter-num">{String(number).padStart(2, '0')}</span>
      )}
      <span className="eyebrow">{label}</span>
      {kicker && <span className="text-[10px] text-parchment-100/40 font-mono ml-auto">{kicker}</span>}
    </div>
  )
}

/**
 * "Court Seal" — a slowly rotating circular wax-seal style emblem,
 * with text around the perimeter and a glyph in the centre.
 */
export function CourtSeal({
  size = 132,
  topText = 'ADALAT · AI',
  bottomText = 'PAKISTAN · پاکستان',
  glyph = '⚖',
  className = '',
}) {
  const r = size / 2
  const radiusTop = r - 14
  const radiusBot = r - 14
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`} width={size} height={size}
        className="animate-spinSlow"
        aria-hidden
      >
        <defs>
          <path id="seal-top" d={`M ${r-radiusTop},${r} a ${radiusTop},${radiusTop} 0 1,1 ${radiusTop*2},0`} />
          <path id="seal-bot" d={`M ${r-radiusBot},${r} a ${radiusBot},${radiusBot} 0 1,0 ${radiusBot*2},0`} />
        </defs>
        <circle cx={r} cy={r} r={r-2} fill="none" stroke="rgba(212,175,55,0.45)" strokeWidth="1.2" />
        <circle cx={r} cy={r} r={r-7} fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth="0.8" />
        <text fontFamily="JetBrains Mono" fontSize="9" letterSpacing="3" fill="#D4AF37">
          <textPath href="#seal-top" startOffset="50%" textAnchor="middle">{topText}</textPath>
        </text>
        <text fontFamily="JetBrains Mono" fontSize="9" letterSpacing="3" fill="#D4AF37">
          <textPath href="#seal-bot" startOffset="50%" textAnchor="middle">{bottomText}</textPath>
        </text>
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-gold-300"
        style={{ fontFamily: 'Fraunces, serif', fontSize: size * 0.35 }}
      >
        {glyph}
      </div>
    </div>
  )
}

/** A small "FILED · 25.05.2026" style stamp tag, slightly skewed. */
export function FiledStamp({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: -10, scale: 0.7 }}
      animate={{ opacity: 1, rotate: -4, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className={`stamp ${className}`}
    >
      {children}
    </motion.div>
  )
}

/** A small numbered "Article §" badge for legal citations. */
export function ArticleBadge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="text-gold-400">§</span>
      <span className="font-mono text-[11px] tracking-wider text-parchment-100/80">{children}</span>
    </span>
  )
}
