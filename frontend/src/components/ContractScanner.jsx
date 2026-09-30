import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, FileText, ShieldAlert, Loader2, X, AlertTriangle, CheckCircle2, ScanSearch } from 'lucide-react'
import { Scanner } from '../lib/api.js'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { useToast } from '../hooks/useToast.jsx'

export default function ContractScanner() {
  const { t, lang, isUrdu } = useLanguage()
  const toast = useToast()
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const onPickFile = useCallback((f) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are supported.')
      return
    }
    setFile(f); setResult(null)
  }, [toast])

  async function scan() {
    if (!file) return
    setBusy(true)
    try {
      const r = await Scanner.upload(file, lang)
      setResult(r)
      toast.success('Scan complete')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Scan failed')
    } finally {
      setBusy(false)
    }
  }

  function reset() { setFile(null); setResult(null) }

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      {/* Drop zone */}
      <div className={`glass rounded-2xl p-6 ${isUrdu ? 'urdu' : ''}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center text-ink-900">
            <ScanSearch size={18}/>
          </div>
          <div>
            <div className="display text-xl gold-text italic">Contract Scrutiny</div>
            <div className="text-xs text-parchment-100/60">{t('scanDrop')}</div>
          </div>
        </div>

        {!file && (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); onPickFile(e.dataTransfer.files?.[0]) }}
            className={`block cursor-pointer rounded-2xl border-2 border-dashed transition
              ${dragOver ? 'border-gold-400 bg-gold-400/10' : 'border-white/15 hover:border-gold-400/50 hover:bg-white/[0.02]'}
              p-10 text-center`}
          >
            <FileUp size={28} className="mx-auto mb-3 text-gold-300"/>
            <div className="text-sm text-parchment-100/85">{t('scanDrop')}</div>
            <div className="text-xs text-parchment-100/45 mt-1">{t('scanOr')}</div>
            <input
              ref={inputRef}
              type="file" accept="application/pdf"
              className="hidden"
              onChange={e => onPickFile(e.target.files?.[0])}
            />
          </label>
        )}

        {file && (
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gold-300"/>
                <div>
                  <div className="text-sm text-parchment-50 line-clamp-1">{file.name}</div>
                  <div className="text-[10px] text-parchment-100/45">{(file.size/1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button onClick={reset} className="text-parchment-100/60 hover:text-parchment-50"><X size={16}/></button>
            </div>

            {/* Animated scanning visualization */}
            <div className="relative h-44 bg-ink-950/70 overflow-hidden">
              <pre className="absolute inset-0 p-4 text-[10px] text-parchment-100/45 font-mono whitespace-pre-wrap leading-relaxed select-none">
{'CONTRACT TERMS\n--------------\nLorem ipsum dolor sit amet, consectetur adipiscing elit. The TENANT agrees to pay LANDLORD\nthe sum of PKR 50,000 per month. Late payments shall incur a 10% per day penalty. The\nLANDLORD reserves the right to enter the premises without notice. The TENANT waives all\nrights under the West Pakistan Urban Rent Restriction Ordinance 1959. Disputes shall be\nresolved exclusively by LANDLORD\'s nominated arbitrator. In the event of dispute, TENANT\nshall pay all legal fees of LANDLORD regardless of outcome...'}
              </pre>
              {busy && (
                <motion.div
                  className="absolute left-0 right-0 h-12 bg-gradient-to-b from-gold-400/0 via-gold-400/30 to-gold-400/0 animate-scanline"
                  style={{ filter: 'blur(2px)' }}
                />
              )}
              {busy && (
                <div className="absolute inset-0 bg-ink-950/40 flex items-center justify-center gap-2 text-gold-200 text-sm">
                  <Loader2 size={16} className="animate-spin"/> Analysing clauses...
                </div>
              )}
            </div>

            <div className="p-4 flex gap-2">
              <button onClick={scan} disabled={busy} className="btn-primary flex-1">
                {busy ? <Loader2 size={14} className="animate-spin"/> : <ShieldAlert size={14}/>}
                {busy ? 'Scanning…' : 'Scan for red flags'}
              </button>
              <button onClick={reset} className="btn-ghost">Change</button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className={`min-h-[420px] ${isUrdu ? 'urdu' : ''}`}>
        <AnimatePresence mode="wait">
          {!result && !busy && <EmptyResults key="empty"/>}
          {busy && <SkeletonResults key="loading"/>}
          {result && <Results key="result" data={result}/>}
        </AnimatePresence>
      </div>
    </div>
  )
}

function EmptyResults() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="glass rounded-2xl p-8 text-center text-parchment-100/45 text-sm h-full flex flex-col items-center justify-center"
    >
      <ShieldAlert size={32} className="text-parchment-100/30 mb-3"/>
      Upload a contract on the left to see red flags here.
    </motion.div>
  )
}

function SkeletonResults() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="glass rounded-2xl p-6 space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 rounded-xl shimmer"/>
      ))}
    </motion.div>
  )
}

const severityStyles = {
  critical: 'border-red-400/50 bg-red-500/10 text-red-100',
  high:     'border-red-400/40 bg-red-500/5 text-red-100',
  medium:   'border-amber-400/40 bg-amber-400/5 text-amber-100',
  low:      'border-sky-400/40 bg-sky-400/5 text-sky-100',
}

function Results({ data }) {
  const { t } = useLanguage()
  const a = data.analysis || {}
  const flags = a.red_flags || []
  const recs  = a.recommendations || []
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="glass rounded-2xl p-5 flex items-center gap-5">
        <RiskGauge value={a.risk_score ?? 0}/>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-parchment-100/60 mb-1">{t('summary')}</div>
          <div className="text-sm text-parchment-50">{a.summary || '...'}</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-gold-300">
          <AlertTriangle size={14}/> {t('redFlags')} <span className="text-parchment-100/45">· {flags.length}</span>
        </div>
        <div className="space-y-3">
          {flags.length === 0 && <div className="text-sm text-emerald-200 flex items-center gap-2"><CheckCircle2 size={14}/> No red flags detected.</div>}
          {flags.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-4 ${severityStyles[f.severity] || severityStyles.medium}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="chip-gold uppercase tracking-wider text-[10px]">{f.severity || 'medium'}</span>
                {f.law && <span className="text-[10px] text-parchment-100/80">{f.law}</span>}
              </div>
              <blockquote className="italic text-sm text-parchment-50 border-l-2 border-current/40 ps-3 mb-2">
                "{f.clause}"
              </blockquote>
              <div className="text-xs text-parchment-100/85/90">{f.why}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {recs.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-gold-300 mb-2">{t('recommendations')}</div>
          <ul className="list-disc ms-5 space-y-1 text-sm text-parchment-100/85">
            {recs.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </motion.div>
  )
}

function RiskGauge({ value }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  const color =
    v >= 70 ? '#F87171' :
    v >= 40 ? '#FACC15' :
              '#34D399'
  return (
    <div className="relative w-20 h-20">
      <svg viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none"/>
        <motion.circle
          cx="50" cy="50" r="40"
          stroke={color} strokeWidth="10" strokeLinecap="round" fill="none"
          strokeDasharray={2 * Math.PI * 40}
          initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - v/100) }}
          transition={{ duration: 1 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}77)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-display text-xl" style={{ color }}>{v}</div>
    </div>
  )
}
