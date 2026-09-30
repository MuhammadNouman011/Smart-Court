import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Trash2, MessageSquare, Gavel, FileText, LogIn } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { Sessions } from '../lib/api.js'

const KIND_META = {
  chat:      { icon: MessageSquare, label: { en: 'Q&A',       ur: 'سوال و جواب' } },
  courtroom: { icon: Gavel,         label: { en: 'Courtroom', ur: 'مشقی عدالت' } },
}

function relativeTime(ts, t, lang) {
  const diff = Math.floor((Date.now()/1000 - ts))
  if (diff < 60)      return t('justNow')
  if (diff < 3600)    return `${Math.floor(diff/60)} ${t('minutesAgo')}`
  if (diff < 86400)   return `${Math.floor(diff/3600)} ${t('hoursAgo')}`
  return `${Math.floor(diff/86400)} ${t('daysAgo')}`
}

export default function History() {
  const { t, isUrdu, lang } = useLanguage()
  const { user } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Sessions.list()
      .then(d => setItems(d.sessions || []))
      .catch(() => toast.error('Could not load history'))
      .finally(() => setLoading(false))
  }, [user, toast])

  async function remove(id) {
    if (!confirm('Delete this conversation?')) return
    try {
      await Sessions.delete(id)
      setItems(arr => arr.filter(x => x.id !== id))
    } catch (err) {
      toast.error('Could not delete')
    }
  }

  if (!user) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center ${isUrdu ? 'urdu' : ''}`}>
        <div className="surface-elevated rounded-2xl p-10 text-center max-w-md">
          <Clock size={28} className="mx-auto mb-4 text-accent-400"/>
          <h2 className={`text-[26px] font-medium text-cream-100 tracking-tightest ${isUrdu ? 'urdu' : ''}`}>
            {t('navHistory')}
          </h2>
          <p className={`text-cream-300 mt-2 ${isUrdu ? 'urdu text-[15px]' : 'reader text-[14px]'}`}>
            {isUrdu
              ? 'پرانی گفتگو دیکھنے کے لیے لاگ اِن کریں۔'
              : 'Sign in to view your conversation history.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Link to="/login" className="btn-primary"><LogIn size={13}/> {t('login')}</Link>
            <Link to="/signup" className="btn-ghost">{t('signup')}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isUrdu ? 'urdu' : ''}`}>
      <header>
        <div className={isUrdu ? 'text-[12px] text-accent-400 mb-2 urdu' : 'eyebrow mb-2'}>
          {t('navHistory')}
        </div>
        <h1 className={`text-[42px] font-medium tracking-tightest text-cream-100 ${isUrdu ? 'urdu' : ''}`}>
          {t('historyTitle')}
        </h1>
        <p className={`text-cream-300 mt-2 max-w-2xl ${isUrdu ? 'urdu text-[16px]' : 'reader text-[14.5px]'}`}>
          {t('historyDesc')}
        </p>
      </header>

      {loading
        ? <div className="space-y-2">
            {[...Array(3)].map((_,i) => <div key={i} className="h-20 shimmer rounded-xl"/>)}
          </div>
        : items.length === 0
          ? <div className="surface-elevated rounded-2xl p-10 text-center text-cream-300">
              <FileText size={24} className="mx-auto mb-3 opacity-50"/>
              <p className={isUrdu ? 'urdu text-[15px]' : ''}>{t('historyEmpty')}</p>
            </div>
          : <div className="grid gap-2">
              <AnimatePresence>
                {items.map((s, i) => {
                  const meta = KIND_META[s.kind] || KIND_META.chat
                  const Icon = meta.icon
                  const target = s.kind === 'courtroom' ? `/courtroom` : `/chat`
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25, delay: i*0.03 }}
                      className="group surface rounded-xl p-4 flex items-center gap-4 hover:border-accent-500/30 transition"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-accent-400 shrink-0">
                        <Icon size={15}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="chip chip-accent">{meta.label[lang]}</span>
                          <span className="mono text-[10.5px] text-cream-400">
                            {relativeTime(s.created_at, t, lang)}
                          </span>
                        </div>
                        <div className={`text-cream-100 ${isUrdu ? 'urdu text-[15px]' : 'text-[14px]'} line-clamp-2`}>
                          {s.preview || '(empty conversation)'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => { localStorage.setItem('smartcourt:resume_session', s.id); nav(target) }}
                          className="btn-ghost !px-3 !py-1.5 !text-[12px]"
                        >
                          {t('historyOpen')}
                        </button>
                        <button onClick={() => remove(s.id)}
                                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-cream-400 hover:text-rose-400 hover:border-rose-500/40 transition">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
      }
    </div>
  )
}
