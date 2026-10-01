import { motion } from 'framer-motion'
import { useLanguage } from '../hooks/useLanguage.jsx'

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage()

  return (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-ink-900/60 p-1 backdrop-blur-md">
      {[
        { code: 'en', label: 'EN' },
        { code: 'ur', label: 'اردو', font: 'font-urdu' },
      ].map(({ code, label, font }) => {
        const active = lang === code
        return (
          <button
            key={code}
            onClick={() => setLang(code)}
            aria-pressed={active}
            className={`relative px-4 py-1.5 rounded-full text-[12px] transition-colors
              ${active ? 'text-[#0A0A0B] font-medium' : 'text-cream-300 hover:text-cream-100'}`}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: 'linear-gradient(180deg, #6EE7B7 0%, #10B981 100%)',
                         boxShadow: '0 4px 14px -4px rgba(16,185,129,0.55)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              />
            )}
            <span className={`relative ${font || ''}`}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
