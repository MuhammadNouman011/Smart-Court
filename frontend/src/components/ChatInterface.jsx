import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, User2, AlertOctagon, Sparkles, FileText, BookOpen, ArrowDown,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Chat } from '../lib/api.js'
import { useLanguage, categoryName } from '../hooks/useLanguage.jsx'
import { useToast } from '../hooks/useToast.jsx'
import CaseStrengthMeter from './CaseStrengthMeter.jsx'
import VoiceInput from './VoiceInput.jsx'
import BrandLogo from './BrandLogo.jsx'

const CATEGORY_TONE = {
  Labour:   'chip-accent',
  Tenant:   'chip-accent',
  Family:   'chip',
  Criminal: 'chip-rose',
  Consumer: 'chip-amber',
  General:  'chip',
}

const caseNumber = () => {
  const y = new Date().getFullYear()
  return `ADL/${y}/${Math.floor(1000 + Math.random() * 8999)}`
}

export default function ChatInterface() {
  const { t, lang, isUrdu } = useLanguage()
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sid, setSid] = useState(null)
  const [busy, setBusy] = useState(false)
  const [caseNo] = useState(caseNumber)
  const [showScrollHint, setShowScrollHint] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    // While streaming the last assistant message, follow it but show a "scroll to bottom" hint if the user scrolled up.
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
      setShowScrollHint(!atBottom && busy)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [busy])

  async function send(text) {
    const msg = (text ?? draft).trim()
    if (!msg || busy) return
    setDraft('')

    setMessages(arr => [...arr, { role: 'user', content: msg, ts: Date.now(), language: lang }, {
      role: 'assistant', content: '', streaming: true, ts: Date.now(), meta: null, raw: '',
    }])
    setBusy(true)

    let raw = ''; let meta = null; let category = null; let language = lang

    const extractExplanation = (jsonText) => {
      const m = jsonText.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*?)(?:"|$)/)
      if (!m) return null
      return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    }
    const updateAssistant = (patch) => {
      setMessages(arr => {
        const i = arr.length - 1
        const last = arr[i]
        if (!last || last.role !== 'assistant') return arr
        const c = arr.slice()
        c[i] = { ...last, ...patch }
        return c
      })
    }

    try {
      await Chat.stream(
        { message: msg, session_id: sid, language: lang },
        {
          onSession: ({ session_id }) => setSid(session_id),
          onMeta: (m) => {
            meta = m; category = m.category; language = m.language
            updateAssistant({ meta: { category, language, sources: m.sources } })
          },
          onChunk: (piece) => {
            raw += piece
            const partial = extractExplanation(raw)
            updateAssistant(partial != null ? { content: partial, raw, language } : { raw, language })
            const el = scrollRef.current
            if (el) {
              const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
              if (atBottom) el.scrollTo({ top: el.scrollHeight })
            }
          },
          onFinal: (final) => {
            updateAssistant({
              content: final.answer || extractExplanation(raw) || raw,
              streaming: false,
              meta: {
                ...(meta || {}),
                category: category || final.category,
                language: language || final.language,
                answer: final.answer,
                citations: final.citations,
                action_plan: final.action_plan,
                case_strength: final.case_strength,
                warning: final.warning,
                sources: meta?.sources || [],
              },
              language,
            })
          },
          onError: (errMsg) => {
            toast.error(errMsg)
            updateAssistant({ content: errMsg, error: true, streaming: false })
          },
        }
      )
    } catch (err) {
      toast.error(err?.message || 'Stream failed')
      updateAssistant({ content: err?.message || 'Stream failed', error: true, streaming: false })
    } finally {
      setBusy(false)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const lastMeta = [...messages].reverse().find(m => m.role === 'assistant' && m.meta)?.meta

  return (
    <div className="grid lg:grid-cols-[1fr_336px] gap-6">
      {/* ─────── Conversation panel ─────── */}
      <section className="relative surface-elevated rounded-2xl flex flex-col h-[calc(100vh-220px)] min-h-[560px] overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.06] bg-ink-900/40 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70"/>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70"/>
              <span className="w-2.5 h-2.5 rounded-full bg-accent-500/70"/>
            </div>
            <div className={isUrdu ? 'text-[12px] text-accent-400 urdu' : 'kicker'}>
              {t('caseFile')} · <span className="text-cream-200">{caseNo}</span>
              {lastMeta?.category && (
                <span className={`ml-2 text-accent-400 ${isUrdu ? '' : 'normal-case tracking-normal'}`}>
                  · {categoryName(lastMeta.category, t)}
                </span>
              )}
            </div>
          </div>
          <span className={busy ? 'live-pill' : 'chip chip-accent'}>
            {busy ? t('statusWriting') : t('statusReady')}
          </span>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-7 space-y-6">
          {messages.length === 0 && <Welcome onPick={(q) => send(q)} />}
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <MessageRow key={i} m={m} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {/* Scroll-to-bottom floating btn */}
        <AnimatePresence>
          {showScrollHint && (
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
              className="absolute right-7 bottom-24 z-10 px-3 py-2 rounded-full bg-ink-700/90 border border-white/10 mono text-[11px] text-cream-100 flex items-center gap-2 backdrop-blur hover:bg-ink-600/90"
            >
              <ArrowDown size={12}/> {t('follow')}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Composer */}
        <div className="border-t border-white/[0.06] p-4 bg-ink-900/40">
          <div className="flex items-end gap-2.5">
            <VoiceInput onTranscribed={(txt) => send(txt)} language={lang} />
            <div className="flex-1 relative">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={onKey}
                rows={1}
                placeholder={isUrdu ? 'اپنا مسئلہ یہاں لکھیں…' : 'Describe your legal matter…'}
                className={`input resize-none max-h-44 pr-14 ${isUrdu ? 'urdu text-[15px]' : ''}`}
              />
              <span className="absolute right-3 bottom-3 mono text-[10px] text-cream-400 pointer-events-none">
                {draft.length ? `${draft.length}` : '↵'}
              </span>
            </div>
            <button onClick={() => send()} disabled={busy || !draft.trim()} className="btn-primary">
              <Send size={13}/> {t('send')}
            </button>
          </div>
          <div className={`mt-2.5 flex items-center justify-between text-[10px] text-cream-400 ${isUrdu ? 'urdu text-[11px]' : 'mono uppercase tracking-caps'}`}>
            <span>{t('composerHint')}</span>
            <span className="flex items-center gap-1.5">
              <Sparkles size={10} className="text-accent-400"/>
              {busy ? t('statusWriting') : t('statusReady')}
            </span>
          </div>
        </div>
      </section>

      <Dossier last={lastMeta} />
    </div>
  )
}

/* ─────────── Empty state ─────────── */
function Welcome({ onPick }) {
  const { t, isUrdu } = useLanguage()
  const examples = isUrdu
    ? [
        { c: 'Tenant',   q: 'مالک مکان دو دن میں گھر خالی کرنے کا کہہ رہا ہے، میرے کیا حقوق ہیں؟' },
        { c: 'Labour',   q: 'مجھے نوکری سے بغیر نوٹس کے نکال دیا گیا، کیا کروں؟' },
        { c: 'Consumer', q: 'ایک دکاندار نے ناقص موبائل بیچا اور رقم واپس نہیں کر رہا' },
        { c: 'Family',   q: 'خلع کے لیے کن کاغذات کی ضرورت ہوتی ہے؟' },
      ]
    : [
        { c: 'Tenant',   q: 'My landlord is evicting me in 2 days. What are my rights?' },
        { c: 'Labour',   q: 'I was fired without notice. What can I do under labour law?' },
        { c: 'Consumer', q: 'A shop sold me a defective phone and refuses a refund.' },
        { c: 'Family',   q: 'What documents do I need to file for khula?' },
      ]

  return (
    <div className={`py-10 ${isUrdu ? 'urdu text-right' : ''}`}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className={isUrdu ? 'urdu text-[12px] text-accent-400 mb-3' : 'kicker mb-3'}>{t('placeYourMatter')}</div>
        <h2 className={`text-[40px] font-medium tracking-tightest text-cream-100 max-w-xl leading-[1.05] text-balance ${isUrdu ? 'urdu' : ''}`}>
          {t('welcomeHeading')}
        </h2>
        <p className={`text-[15px] text-cream-300 mt-3 max-w-lg leading-relaxed ${isUrdu ? 'urdu text-[16px]' : 'reader'}`}>
          {t('welcomeDesc')}
        </p>
      </motion.div>

      <div className="mt-9 grid sm:grid-cols-2 gap-2.5">
        {examples.map((ex, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i + 0.1, duration: 0.35 }}
            onClick={() => onPick?.(ex.q)}
            className="group text-left p-4 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:border-accent-500/30 hover:bg-accent-500/[0.04] transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`chip ${CATEGORY_TONE[ex.c] || 'chip'}`}>{categoryName(ex.c, t)}</span>
              <span className={`text-[10px] text-cream-400 group-hover:text-accent-400 transition
                ${isUrdu ? 'urdu' : 'mono uppercase tracking-caps'}`}>
                {t('tryIt')} →
              </span>
            </div>
            <p className={`text-[13.5px] text-cream-100 leading-relaxed ${isUrdu ? 'urdu text-[15px]' : ''}`}>
              {ex.q}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

/* ─────────── A single message row ─────────── */
function MessageRow({ m, index }) {
  const { t, isUrdu } = useLanguage()
  const isUser = m.role === 'user'
  const isRtl  = m.language === 'ur' || /[؀-ۿ]/.test(m.content || '')
  const empty  = m.role === 'assistant' && !m.content && m.streaming

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
      className="grid grid-cols-[36px_1fr] gap-4"
    >
      <Avatar role={m.role}/>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[13px] font-medium text-cream-100 ${isUrdu ? 'urdu text-[14px]' : ''}`}>
            {isUser ? t('youLabel') : t('aiLabel')}
          </span>
          {!isUser && m.meta?.category && (
            <span className={`chip ${CATEGORY_TONE[m.meta.category] || 'chip'}`}>
              {categoryName(m.meta.category, t)}
            </span>
          )}
          {m.streaming && !empty && (
            <span className="ml-auto live-pill">{t('statusWriting')}</span>
          )}
        </div>

        {empty
          ? <Thinking/>
          : m.error
            ? (
                <div className="surface rounded-xl p-4 border-rose-500/40 reader text-[13.5px] text-rose-200 flex items-start gap-2">
                  <AlertOctagon size={14} className="mt-0.5 text-rose-400 shrink-0"/>
                  {m.content}
                </div>
              )
            : isUser
              ? (
                  <div className={`reader text-[15px] text-cream-100 leading-[1.7] whitespace-pre-wrap ${isRtl ? 'urdu text-[16px]' : ''}`}>
                    {m.content}
                  </div>
                )
              : (
                  <div className={`prose-court ${isRtl ? 'urdu' : ''}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    {m.streaming && <span className="cursor" aria-hidden/>}
                  </div>
                )}

        {!isUser && m.meta?.action_plan?.length > 0 && (
          <ActionPlan plan={m.meta.action_plan} isRtl={isRtl} />
        )}
      </div>
    </motion.div>
  )
}

function Avatar({ role }) {
  if (role === 'user') {
    return (
      <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-cream-300">
        <User2 size={15}/>
      </div>
    )
  }
  return <BrandLogo size={36} halo animate={false} className="rounded-xl" />
}

function Thinking() {
  const { t, isUrdu } = useLanguage()
  return (
    <div className="flex items-center gap-3 text-cream-300">
      <span className="inline-flex gap-1">
        <span className="dot"/><span className="dot"/><span className="dot"/>
      </span>
      <span className={isUrdu ? 'urdu text-[14px]' : 'reader text-[13.5px]'}>{t('readingStatutes')}</span>
    </div>
  )
}

function ActionPlan({ plan, isRtl }) {
  const { t, isUrdu } = useLanguage()
  return (
    <div className={`mt-4 surface rounded-xl p-5 ${isRtl ? 'urdu' : ''}`}>
      <div className={`flex items-center gap-2 mb-3 ${isUrdu ? 'urdu text-[12px] text-accent-400' : 'kicker'}`}>
        <BookOpen size={11} className="text-accent-400" />
        {t('actionPlan')}
      </div>
      <ol className="space-y-2.5">
        {plan.map((p, i) => (
          <li key={i} className="flex items-start gap-3.5">
            <span className="mono text-[10.5px] text-accent-400 pt-1.5 w-5 shrink-0">
              {String(i+1).padStart(2,'0')}
            </span>
            <span className="reader text-[14px] text-cream-100 leading-[1.6] flex-1">{p}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ─────────── Right rail Dossier ─────────── */
function Dossier({ last }) {
  const { t, isUrdu } = useLanguage()
  const labelCls = isUrdu ? 'urdu text-[12px] text-accent-400 mb-3' : 'kicker mb-3'

  return (
    <aside className="space-y-3 sticky top-24 h-fit">
      {/* Case strength */}
      <div className="surface rounded-2xl p-5">
        <CaseStrengthMeter value={last?.case_strength ?? 0} label={t('caseStrength')} />
        {last?.category && (
          <div className={`mt-4 flex ${isUrdu ? 'justify-end' : ''}`}>
            <span className={`chip ${CATEGORY_TONE[last.category] || 'chip'}`}>
              {categoryName(last.category, t)}
            </span>
          </div>
        )}
      </div>

      {/* Citations */}
      <div className="surface rounded-2xl p-5">
        <div className={`${labelCls} flex items-center gap-2`}>
          <FileText size={11} className="text-accent-400"/> {t('citations')}
        </div>
        {last?.citations?.length
          ? <ul className="space-y-1.5">
              {last.citations.map((c, i) => (
                <li key={i} className="flex items-start gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-accent-400 mt-0.5">§</span>
                  <span className={`text-[11.5px] text-cream-200 leading-snug break-words ${isUrdu ? 'urdu text-[13px]' : 'mono'}`}>{c}</span>
                </li>
              ))}
            </ul>
          : <p className={`text-[12.5px] text-cream-400 ${isUrdu ? 'urdu' : 'reader'}`}>{t('noCitations')}</p>}
      </div>

      {/* Sources */}
      <div className="surface rounded-2xl p-5">
        <div className={labelCls}>{t('sources')}</div>
        {last?.sources?.length
          ? <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {last.sources.map((s, i) => (
                <div key={i} className={`p-3 rounded-md bg-white/[0.02] border border-white/[0.05] ${s.language === 'ur' ? 'urdu' : ''}`}>
                  <div className={`text-[10.5px] text-accent-400 mb-1 ${s.language === 'ur' ? 'urdu' : 'mono uppercase tracking-caps'}`}>{s.title}</div>
                  <p className="text-[12px] text-cream-200/85 leading-snug">{s.text?.slice(0, 180)}…</p>
                </div>
              ))}
            </div>
          : <p className={`text-[12.5px] text-cream-400 ${isUrdu ? 'urdu' : 'reader'}`}>{t('noSources')}</p>}
      </div>

      {/* Disclaimer */}
      {last?.warning && (
        <div className="surface rounded-2xl p-4 border-amber-500/25 flex items-start gap-3">
          <AlertOctagon size={14} className="text-amber-400 mt-0.5 shrink-0"/>
          <div>
            <div className={isUrdu ? 'urdu text-[12px] text-amber-400 mb-1' : 'kicker mb-1 text-amber-400'}>
              {t('warning')}
            </div>
            <div className={`text-[12.5px] text-cream-200 ${isUrdu ? 'urdu' : 'reader'}`}>{last.warning}</div>
          </div>
        </div>
      )}
    </aside>
  )
}
