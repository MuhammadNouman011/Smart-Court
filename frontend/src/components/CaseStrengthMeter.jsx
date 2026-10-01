import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { useTheme } from '../hooks/useTheme.jsx'

/** Counts up to `target` over `ms` milliseconds. */
function useCountUp(target, ms = 900) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf, start
    const from = 0
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min(1, (ts - start) / ms)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return n
}

/**
 * Case-strength meter — clean editorial style.
 *   ┌──────────────────┐
 *   │ 78               │ ← big number
 *   │ STRONG           │ ← verdict label
 *   │ ▓▓▓▓▓▓▓░░░       │ ← thin gradient bar
 *   │ 0    50    100   │ ← scale ticks
 *   └──────────────────┘
 *
 * Props:
 *   value: 0-100
 *   label: optional caption above (eg "Case strength")
 *   compact: tighter spacing for tight panels
 */
export default function CaseStrengthMeter({ value = 0, label = '', compact = false }) {
  const { t, isUrdu } = useLanguage()
  const { isDark } = useTheme()
  const safe = Math.max(0, Math.min(100, Math.round(value || 0)))
  const shown = useCountUp(safe, 950)

  // Verdict band (light theme uses deeper shades so the number stays readable on white)
  const band =
    safe >= 81 ? { key: 'verystrong', en: 'Very strong', ur: 'بہت مضبوط', color: isDark ? '#10B981' : '#047857', bg: 'rgba(16,185,129,0.10)' }
  : safe >= 66 ? { key: 'solid',      en: 'Solid',       ur: 'مستحکم',     color: isDark ? '#34D399' : '#059669', bg: 'rgba(52,211,153,0.10)' }
  : safe >= 46 ? { key: 'mixed',      en: 'Mixed',       ur: 'مخلوط',      color: isDark ? '#FBBF24' : '#B45309', bg: 'rgba(251,191,36,0.10)' }
  : safe >= 26 ? { key: 'weak',       en: 'Weak',        ur: 'کمزور',      color: isDark ? '#FB923C' : '#C2410C', bg: 'rgba(251,146,60,0.10)' }
  :              { key: 'fatal',      en: 'Fatally weak',ur: 'انتہائی کمزور', color: isDark ? '#F43F5E' : '#BE123C', bg: 'rgba(244,63,94,0.10)' }

  return (
    <div className={`w-full ${isUrdu ? 'urdu' : ''}`}>
      {label && (
        <div className={`mb-2 ${isUrdu ? 'text-[12px] text-accent-400' : 'kicker'}`}>{label}</div>
      )}

      {/* Big number + label */}
      <div className={`flex items-baseline gap-3 ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <div
          className="font-medium tracking-tightest leading-none tabular-nums"
          style={{ color: band.color, fontSize: compact ? 44 : 56, fontFamily: 'Geist, sans-serif' }}
        >
          {shown}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${isUrdu ? 'urdu' : ''}`}
            style={{ color: band.color, background: band.bg, border: `1px solid ${band.color}33` }}
          >
            {isUrdu ? band.ur : band.en}
          </div>
          <div className={`mt-1 text-[10.5px] text-cream-400 ${isUrdu ? 'urdu' : 'mono uppercase tracking-caps'}`}>
            {isUrdu ? 'فیصد' : 'percentile'}
          </div>
        </div>
      </div>

      {/* Bar */}
      <div className={`mt-3 ${compact ? '' : 'mt-4'}`}>
        <div className="relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${safe}%` }}
            transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${band.color}55, ${band.color})`,
              boxShadow: `0 0 12px ${band.color}55`,
            }}
          />
          {/* tick at 33 / 66 */}
          <span className="absolute top-1/2 left-[33%] -translate-y-1/2 w-px h-2 bg-white/15"/>
          <span className="absolute top-1/2 left-[66%] -translate-y-1/2 w-px h-2 bg-white/15"/>
        </div>
        <div className={`mt-1.5 flex items-center justify-between text-[10px] text-cream-400 ${isUrdu ? 'urdu flex-row-reverse' : 'mono uppercase tracking-caps'}`}>
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>
    </div>
  )
}
