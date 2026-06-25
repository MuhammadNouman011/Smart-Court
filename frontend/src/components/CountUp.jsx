import { useEffect, useRef, useState } from 'react'

/**
 * Animated number that eases from 0 → value.
 * Props: value, duration (ms), decimals, prefix, suffix, format (fn)
 */
export default function CountUp({ value = 0, duration = 900, decimals = 0, prefix = '', suffix = '', format }) {
  const [n, setN] = useState(0)
  const ref = useRef()

  useEffect(() => {
    cancelAnimationFrame(ref.current)
    let start
    const from = 0
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min(1, (ts - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setN(from + (value - from) * eased)
      if (p < 1) ref.current = requestAnimationFrame(step)
      else setN(value)
    }
    ref.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(ref.current)
  }, [value, duration])

  const display = format
    ? format(n)
    : n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  return <span className="tabular-nums">{prefix}{display}{suffix}</span>
}
