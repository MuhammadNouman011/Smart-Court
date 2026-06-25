import { motion } from 'framer-motion'

/**
 * Animated donut chart with draw-in segments + hover highlight.
 *
 * Props:
 *   data: [{ label, percent, color }]
 *   size, thickness
 *   activeIndex: highlighted segment (or null)
 *   onHover(index|null)
 *   center: ReactNode shown in the middle
 */
export default function DonutChart({
  data = [], size = 230, thickness = 26, activeIndex = null, onHover = () => {}, center,
}) {
  const radius = (size - thickness - 8) / 2
  const circ = 2 * Math.PI * radius
  let acc = 0

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness}
        />
        {data.map((d, i) => {
          const len = (d.percent / 100) * circ
          const dashoffset = -((acc / 100) * circ)
          acc += d.percent
          const active = activeIndex === i
          return (
            <motion.circle
              key={d.label + i}
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={active ? thickness + 6 : thickness}
              strokeLinecap="butt"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={dashoffset}
              initial={{ strokeDasharray: `0 ${circ}` }}
              animate={{ strokeDasharray: `${len} ${circ - len}` }}
              transition={{ duration: 0.85, delay: 0.15 + i * 0.12, ease: [0.2, 0.7, 0.2, 1] }}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
              style={{
                cursor: 'pointer',
                transition: 'stroke-width 0.22s ease, opacity 0.22s ease',
                opacity: activeIndex === null || active ? 1 : 0.4,
                filter: active ? `drop-shadow(0 0 8px ${d.color}88)` : 'none',
              }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {center}
      </div>
    </div>
  )
}
