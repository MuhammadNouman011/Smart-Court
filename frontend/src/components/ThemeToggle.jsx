import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme.jsx'

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative w-9 h-9 rounded-full border border-white/10 bg-ink-900/60 backdrop-blur-md text-cream-200 hover:text-accent-400 transition-colors flex items-center justify-center"
    >
      <motion.span
        key={isDark ? 'm' : 's'}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {isDark ? <Moon size={14}/> : <Sun size={14}/>}
      </motion.span>
    </button>
  )
}
