import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Home, MessageSquare, FileSearch, FilePen, Gavel, Clock, Scale,
  Sun, Moon, Languages, LogIn, LogOut, UserPlus, Search, CornerDownLeft, ArrowUp, ArrowDown,
} from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import { useAuth } from '../hooks/useAuth.jsx'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const nav = useNavigate()
  const { t, lang, setLang, isUrdu } = useLanguage()
  const { isDark, toggle } = useTheme()
  const { user, logout } = useAuth()

  // Global hotkey: Cmd/Ctrl + K
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
      // Quick nav: Cmd/Ctrl + 1..4
      if ((e.metaKey || e.ctrlKey) && ['1','2','3','4'].includes(e.key)) {
        e.preventDefault()
        const map = { '1': '/chat', '2': '/scanner', '3': '/drafter', '4': '/courtroom' }
        nav(map[e.key])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nav])

  useEffect(() => {
    if (open) {
      setQuery(''); setActive(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const commands = useMemo(() => {
    const go = (to) => () => { nav(to); setOpen(false) }
    const base = [
      { id: 'home',    icon: Home,         label: t('navHome'),      hint: '',   run: go('/') },
      { id: 'chat',    icon: MessageSquare,label: t('navChat'),      hint: 'Ctrl 1', run: go('/chat') },
      { id: 'scan',    icon: FileSearch,   label: t('navScanner'),   hint: 'Ctrl 2', run: go('/scanner') },
      { id: 'draft',   icon: FilePen,      label: t('navDrafter'),   hint: 'Ctrl 3', run: go('/drafter') },
      { id: 'court',   icon: Gavel,        label: t('navCourtroom'), hint: 'Ctrl 4', run: go('/courtroom') },
      { id: 'wirasat', icon: Scale,        label: t('navInheritance'),hint: '',  run: go('/inheritance') },
      { id: 'history', icon: Clock,        label: t('navHistory'),   hint: '',   run: go('/history') },
      { id: 'theme',   icon: isDark ? Sun : Moon,
        label: isDark ? (isUrdu ? 'لائٹ موڈ' : 'Switch to light mode')
                      : (isUrdu ? 'ڈارک موڈ' : 'Switch to dark mode'),
        hint: '', run: () => { toggle(); setOpen(false) } },
      { id: 'lang',    icon: Languages,
        label: lang === 'en' ? 'اردو میں بدلیں' : 'Switch to English',
        hint: '', run: () => { setLang(lang === 'en' ? 'ur' : 'en'); setOpen(false) } },
    ]
    if (user) {
      base.push({ id: 'logout', icon: LogOut, label: t('logout'), hint: '', run: () => { logout(); setOpen(false) } })
    } else {
      base.push({ id: 'login',  icon: LogIn,    label: t('login'),  hint: '', run: go('/login') })
      base.push({ id: 'signup', icon: UserPlus, label: t('signup'), hint: '', run: go('/signup') })
    }
    return base
  }, [t, nav, isDark, toggle, lang, setLang, user, logout, isUrdu])

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(c => c.label.toLowerCase().includes(q) || c.id.includes(q))
  }, [commands, query])

  useEffect(() => { setActive(0) }, [query])

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); filtered[active]?.run() }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center pt-[14vh] px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="relative w-full max-w-xl surface-elevated rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Search */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
              <Search size={16} className="text-cream-400"/>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={isUrdu ? 'کمانڈ تلاش کریں یا صفحہ کھولیں…' : 'Search commands or jump to a page…'}
                className={`flex-1 bg-transparent outline-none text-cream-100 text-[15px] placeholder:text-cream-400 ${isUrdu ? 'urdu text-right' : ''}`}
              />
              <kbd className="mono text-[10px] text-cream-400 px-1.5 py-0.5 rounded border border-white/10">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-cream-400 text-sm">
                  {isUrdu ? 'کچھ نہیں ملا' : 'No matching commands'}
                </div>
              )}
              {filtered.map((c, i) => {
                const Icon = c.icon
                const isActive = i === active
                return (
                  <button
                    key={c.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={c.run}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition
                      ${isActive ? 'bg-accent-500/[0.12] text-cream-100' : 'text-cream-300 hover:text-cream-100'}
                      ${isUrdu ? 'flex-row-reverse text-right' : ''}`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border
                      ${isActive ? 'bg-accent-500/20 border-accent-500/40 text-accent-400' : 'bg-white/[0.04] border-white/[0.08] text-cream-300'}`}>
                      <Icon size={14}/>
                    </span>
                    <span className={`flex-1 text-[14px] ${isUrdu ? 'urdu' : ''}`}>{c.label}</span>
                    {c.hint && <kbd className="mono text-[10px] text-cream-400 px-1.5 py-0.5 rounded border border-white/10">{c.hint}</kbd>}
                    {isActive && <CornerDownLeft size={13} className="text-accent-400"/>}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className={`flex items-center gap-4 px-4 py-2.5 border-t border-white/[0.06] mono text-[10px] uppercase tracking-caps text-cream-400 ${isUrdu ? 'flex-row-reverse' : ''}`}>
              <span className="flex items-center gap-1"><ArrowUp size={10}/><ArrowDown size={10}/> {isUrdu ? 'منتخب کریں' : 'navigate'}</span>
              <span className="flex items-center gap-1"><CornerDownLeft size={10}/> {isUrdu ? 'کھولیں' : 'open'}</span>
              <span className="ml-auto flex items-center gap-1 text-accent-400">⌘K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
