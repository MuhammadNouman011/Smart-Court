import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gavel, Scale, User2, Send, FileSignature, Loader2, ScrollText } from 'lucide-react'
import { Courtroom } from '../lib/api.js'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { useToast } from '../hooks/useToast.jsx'
import CaseStrengthMeter from './CaseStrengthMeter.jsx'
import BrandLogo from './BrandLogo.jsx'

export default function CourtroomMode() {
  const { t, lang, isUrdu } = useLanguage()
  const toast = useToast()

  const [phase, setPhase] = useState('intro') // intro | hearing | verdict
  const [summary, setSummary] = useState('')
  const [sid, setSid] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [verdict, setVerdict] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  async function startHearing() {
    if (summary.trim().length < 10) {
      toast.error('Please describe your case (at least a sentence).')
      return
    }
    setBusy(true)
    try {
      const r = await Courtroom.start(summary, lang)
      setSid(r.session_id)
      setMessages([{ role: 'judge', content: r.opening }])
      setPhase('hearing')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not start hearing')
    } finally {
      setBusy(false)
    }
  }

  async function send() {
    const msg = draft.trim()
    if (!msg || busy) return
    setDraft('')
    setMessages(a => [...a, { role: 'petitioner', content: msg }])
    setBusy(true)
    try {
      const r = await Courtroom.respond(sid, msg, lang)
      setMessages(a => [...a, { role: 'judge', content: r.judge }])
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Judge unavailable')
    } finally {
      setBusy(false)
    }
  }

  async function callVerdict() {
    setBusy(true)
    try {
      const v = await Courtroom.verdict(sid, lang)
      setVerdict(v); setPhase('verdict')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not deliver verdict')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setPhase('intro'); setSummary(''); setMessages([]); setVerdict(null); setSid(null)
  }

  return (
    <div className="relative">
      {/* Dramatic background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-noise opacity-40 mix-blend-overlay"/>
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[60%] h-40 bg-gold-400/10 blur-3xl rounded-full"/>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'intro' && <Intro key="intro" t={t} isUrdu={isUrdu} summary={summary} setSummary={setSummary} onStart={startHearing} busy={busy}/>}
        {phase === 'hearing' && (
          <Hearing
            key="hearing"
            t={t} isUrdu={isUrdu}
            messages={messages} draft={draft} setDraft={setDraft}
            send={send} busy={busy} onVerdict={callVerdict}
            scrollRef={scrollRef}
            onReset={reset}
          />
        )}
        {phase === 'verdict' && <Verdict key="verdict" v={verdict} t={t} isUrdu={isUrdu} onReset={reset}/>}
      </AnimatePresence>
    </div>
  )
}

function Intro({ t, isUrdu, summary, setSummary, onStart, busy }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={`max-w-2xl mx-auto text-center ${isUrdu ? 'urdu text-right' : ''}`}
    >
      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5">
        <div className="absolute inset-0 rounded-full bg-gold-400/20 blur-2xl animate-breathe"/>
        <Gavel size={42} className="text-gold-300 relative animate-floaty"/>
      </div>
      <h2 className="displaytext-4xl gold-text mb-3">{t('courtroomTitle')}</h2>
      <p className="text-parchment-100/60 mb-6">{t('courtroomIntro')}</p>

      <textarea
        value={summary} onChange={e => setSummary(e.target.value)}
        rows={5}
        placeholder={t('summariseCase') + '…'}
        className={`input text-left ${isUrdu ? 'urdu' : ''}`}
      />

      <button onClick={onStart} disabled={busy} className="btn-primary mt-5">
        {busy ? <Loader2 size={14} className="animate-spin"/> : <Gavel size={14}/>}
        {t('presentCase')}
      </button>
    </motion.div>
  )
}

function Hearing({ t, isUrdu, messages, draft, setDraft, send, busy, onVerdict, scrollRef, onReset }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="grid lg:grid-cols-[1fr_280px] gap-6">

      <div className="glass-strong rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[520px]">
        <div className="px-6 py-4 border-b border-gold-400/20 bg-gradient-to-r from-gold-500/10 via-transparent to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size={40} halo animate={false} className="rounded-xl"/>
            <div>
              <div className={`text-base text-gold-200 ${isUrdu ? 'urdu' : 'display'}`}>
                {t('honJustice')} · {t('aiLabel')}
              </div>
              <div className={`text-[11px] text-parchment-100/60 ${isUrdu ? 'urdu' : 'uppercase tracking-[0.3em]'}`}>
                {t('sessionInProgress')}
              </div>
            </div>
          </div>
          <button onClick={onReset} className="btn-ghost text-xs">{t('newCase')}</button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => <CourtBubble key={i} m={m}/>)}
          {busy && (
            <div className="flex items-start gap-3">
              <JudgeAvatar/>
              <div className={`glass rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-parchment-100/60 ${isUrdu ? 'urdu text-[13px]' : ''}`}>
                <span className="dot"/><span className="dot"/><span className="dot"/>
                <span className="ml-2">{t('deliberating')}…</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-4 bg-ink-950/60">
          <div className="flex items-end gap-2">
            <textarea
              value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              rows={1}
              placeholder={t('addressPlaceholder') + '…'}
              className={`input flex-1 resize-none max-h-40 ${isUrdu ? 'urdu' : ''}`}
            />
            <button onClick={send} disabled={busy || !draft.trim()} className="btn-primary">
              <Send size={14}/>
            </button>
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={onVerdict} disabled={busy || messages.length < 3} className="btn-ghost text-xs">
              <FileSignature size={14}/> {t('requestVerdict')}
            </button>
          </div>
        </div>
      </div>

      <aside className="space-y-3 sticky top-24 h-fit">
        <div className={`glass rounded-2xl p-5 ${isUrdu ? 'urdu' : ''}`}>
          <div className={`mb-3 ${isUrdu ? 'text-[12px] text-accent-400' : 'text-[10px] uppercase tracking-[0.3em] text-parchment-100/60'}`}>
            {t('procedure')}
          </div>
          <ol className={`text-xs text-parchment-100/80 space-y-2 list-decimal ms-4 ${isUrdu ? 'text-[14px] me-4 ms-0 leading-loose' : ''}`}>
            <li>{t('procStep1')}</li>
            <li>{t('procStep2')}</li>
            <li>{t('procStep3')}</li>
            <li>{t('procStep4')}</li>
            <li>{t('procStep5')}</li>
          </ol>
        </div>
        <div className={`glass rounded-2xl p-5 text-parchment-100/60 ${isUrdu ? 'urdu text-[14px] leading-loose' : 'text-xs'}`}>
          {t('aboutCourtroomTip')}
        </div>
      </aside>
    </motion.div>
  )
}

function CourtBubble({ m }) {
  const isJudge = m.role === 'judge'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isJudge ? '' : 'flex-row-reverse'}`}
    >
      {isJudge ? <JudgeAvatar/> : (
        <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-parchment-100/80 shrink-0">
          <User2 size={16}/>
        </div>
      )}
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed
        ${isJudge
          ? 'glass-strong border-gold-400/30 text-parchment-50 rounded-tl-sm'
          : 'bg-gradient-to-br from-slate-700/40 to-slate-700/10 border border-white/10 rounded-tr-sm'}
        ${/[؀-ۿ]/.test(m.content) ? 'urdu' : ''}`}>
        {isJudge && <div className="text-[10px] uppercase tracking-[0.3em] text-gold-300 mb-1.5">The Court</div>}
        {m.content}
      </div>
    </motion.div>
  )
}

function JudgeAvatar() {
  return <BrandLogo size={36} halo animate={false} className="rounded-xl" />
}

function Verdict({ v, t, isUrdu, onReset }) {
  if (!v) return null
  const outcomeColor = (v.verdict || '').includes('favour') ? 'text-emerald-300'
    : (v.verdict || '').includes('against') ? 'text-red-300' : 'text-amber-300'
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={`grid lg:grid-cols-[1fr_300px] gap-6 ${isUrdu ? 'urdu' : ''}`}>
      <div className="glass-strong rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <ScrollText size={28} className="text-gold-300"/>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-parchment-100/60">Order of the Court</div>
            <h2 className="displaytext-3xl gold-text">{t('verdict')}</h2>
          </div>
        </div>
        <div className={`text-2xl display${outcomeColor} mb-6`}>{v.verdict}</div>

        <div className="grid md:grid-cols-2 gap-5 mb-6">
          <div className="glass rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-300 mb-2">{t('strengths')}</div>
            <ul className="list-disc ms-5 space-y-1 text-sm text-parchment-100/85">
              {(v.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-red-300 mb-2">{t('weaknesses')}</div>
            <ul className="list-disc ms-5 space-y-1 text-sm text-parchment-100/85">
              {(v.weaknesses || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>

        <div className="glass rounded-xl p-4 mb-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-gold-300 mb-2">{t('feedback')}</div>
          <p className="text-sm text-parchment-100/85 leading-relaxed whitespace-pre-wrap">{v.feedback}</p>
        </div>

        {v.closing_remark && (
          <blockquote className="italic text-parchment-100/80 border-l-2 border-gold-400/50 ps-4">
            "{v.closing_remark}"
          </blockquote>
        )}

        <button onClick={onReset} className="btn-ghost mt-6">{t('newCase')}</button>
      </div>

      <div className="space-y-4 sticky top-24 h-fit">
        <div className="glass rounded-2xl p-6">
          <CaseStrengthMeter value={v.case_strength} label={t('caseStrength')}/>
        </div>
        <div className="glass rounded-2xl p-5 text-xs text-parchment-100/60 leading-relaxed">
          This is a simulated verdict for practice. Real Pakistani courts require formal pleadings, oral arguments and admissible evidence. Use this feedback to build a stronger filing.
        </div>
      </div>
    </motion.div>
  )
}
