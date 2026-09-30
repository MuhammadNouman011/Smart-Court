import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, Users, Loader2, Calculator, Info, Minus, Plus } from 'lucide-react'
import { Inheritance } from '../lib/api.js'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { useToast } from '../hooks/useToast.jsx'
import DonutChart from '../components/DonutChart.jsx'
import CountUp from '../components/CountUp.jsx'

const HEIR_COLORS = [
  '#10B981', '#34D399', '#6EE7B7', '#FBBF24', '#FB923C',
  '#F43F5E', '#60A5FA', '#A78BFA', '#22D3EE', '#A3E635',
]

const HEIR_LABEL_UR = {
  Husband: 'شوہر', Wife: 'بیوی', Mother: 'والدہ', Father: 'والد',
  Son: 'بیٹے', Daughter: 'بیٹیاں', Daughters: 'بیٹیاں',
  'Full brother': 'سگے بھائی', 'Full sister': 'سگی بہنیں',
}

export default function InheritancePage() {
  const { t, isUrdu, lang } = useLanguage()
  const toast = useToast()

  const [spouse, setSpouse]       = useState('none')
  const [wives, setWives]         = useState(1)
  const [sons, setSons]           = useState(0)
  const [daughters, setDaughters] = useState(0)
  const [father, setFather]       = useState(false)
  const [mother, setMother]       = useState(false)
  const [brothers, setBrothers]   = useState(0)
  const [sisters, setSisters]     = useState(0)
  const [estate, setEstate]       = useState('')
  const [busy, setBusy]           = useState(false)
  const [result, setResult]       = useState(null)
  const [hover, setHover]         = useState(null)

  const heirLabel = (h) => (isUrdu ? (HEIR_LABEL_UR[h] || h) : h)

  async function calculate() {
    const anyHeir = spouse !== 'none' || sons || daughters || father || mother || brothers || sisters
    if (!anyHeir) { toast.error(t('wirasatEmpty')); return }
    setBusy(true)
    try {
      const r = await Inheritance.calculate({
        spouse, wives: spouse === 'wife' ? Number(wives) : 0,
        sons: Number(sons), daughters: Number(daughters),
        father, mother,
        full_brothers: Number(brothers), full_sisters: Number(sisters),
        estate_value: estate ? Number(estate) : null,
      })
      setResult(r)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Calculation failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`space-y-6 ${isUrdu ? 'urdu' : ''}`}>
      <header>
        <div className={isUrdu ? 'text-[12px] text-accent-400 mb-2 urdu' : 'eyebrow mb-2'}>
          {t('navInheritance')}
        </div>
        <h1 className={`text-[42px] font-medium tracking-tightest text-cream-100 ${isUrdu ? 'urdu' : ''}`}>
          {t('wirasatTitle')}
        </h1>
        <p className={`text-cream-300 mt-2 max-w-2xl ${isUrdu ? 'urdu text-[16px]' : 'reader text-[14.5px]'}`}>
          {t('wirasatDesc')}
        </p>
      </header>

      <div className="grid lg:grid-cols-[420px_1fr] gap-6 items-start">
        {/* ── Form ── */}
        <div className="surface rounded-2xl p-6 space-y-5">
          <div className={`flex items-center gap-2 ${isUrdu ? 'flex-row-reverse' : ''}`}>
            <Users size={15} className="text-accent-400"/>
            <span className={isUrdu ? 'urdu text-[15px] text-cream-100' : 'text-[14px] font-medium text-cream-100'}>
              {t('whoSurvives')}
            </span>
          </div>

          {/* Spouse */}
          <div>
            <label className="label">{t('spouseLabel')}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[['none', t('spouseNone')], ['husband', t('spouseHusband')], ['wife', t('spouseWife')]].map(([v, lbl]) => (
                <button key={v} onClick={() => setSpouse(v)}
                  className={`px-2 py-2 rounded-lg text-[12px] border transition ${isUrdu ? 'urdu' : ''}
                    ${spouse === v ? 'border-accent-500/50 bg-accent-500/10 text-accent-300' : 'border-white/10 text-cream-300 hover:border-white/20'}`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {spouse === 'wife' && (
            <Stepper label={t('wivesCount')} value={wives} setValue={setWives} min={1} max={4} isUrdu={isUrdu}/>
          )}

          <Stepper label={t('sonsLabel')}      value={sons}      setValue={setSons}      min={0} max={20} isUrdu={isUrdu}/>
          <Stepper label={t('daughtersLabel')} value={daughters} setValue={setDaughters} min={0} max={20} isUrdu={isUrdu}/>

          <div className="grid grid-cols-2 gap-3">
            <Toggle label={t('fatherLabel')} on={father} setOn={setFather} isUrdu={isUrdu}/>
            <Toggle label={t('motherLabel')} on={mother} setOn={setMother} isUrdu={isUrdu}/>
          </div>

          <Stepper label={t('brothersLabel')} value={brothers} setValue={setBrothers} min={0} max={20} isUrdu={isUrdu}/>
          <Stepper label={t('sistersLabel')}  value={sisters}  setValue={setSisters}  min={0} max={20} isUrdu={isUrdu}/>

          <div>
            <label className="label">{t('estateLabel')}</label>
            <input
              type="number" min="0" value={estate}
              onChange={e => setEstate(e.target.value)}
              placeholder="e.g. 5000000"
              className={`input ${isUrdu ? 'text-right' : ''}`}
            />
          </div>

          <button onClick={calculate} disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 size={14} className="animate-spin"/> : <Calculator size={14}/>}
            {t('calculateShares')}
          </button>
        </div>

        {/* ── Results ── */}
        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            {!result && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="surface rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center">
                <Scale size={30} className="text-cream-400 mb-3"/>
                <p className={`text-cream-300 ${isUrdu ? 'urdu text-[15px]' : 'reader text-[14px]'}`}>{t('wirasatEmpty')}</p>
              </motion.div>
            )}

            {result && (
              <motion.div key="res" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">

                {/* Donut + synced legend */}
                <div className="surface rounded-2xl p-6">
                  <div className={`flex items-center justify-between mb-5 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                    <span className={isUrdu ? 'urdu text-[15px] text-cream-100' : 'text-[14px] font-medium text-cream-100'}>
                      {t('sharesResult')}
                    </span>
                    <div className="flex gap-2">
                      {result.awl && <span className="chip chip-amber">{isUrdu ? 'عول' : 'Awl'}</span>}
                      {result.radd && <span className="chip chip-accent">{isUrdu ? 'رد' : 'Radd'}</span>}
                    </div>
                  </div>

                  <div className={`flex flex-col md:flex-row items-center gap-7 ${isUrdu ? 'md:flex-row-reverse' : ''}`}>
                    {/* Donut */}
                    <DonutChart
                      data={result.heirs.map((h, i) => ({
                        label: h.heir, percent: h.group_percent, color: HEIR_COLORS[i % HEIR_COLORS.length],
                      }))}
                      activeIndex={hover}
                      onHover={setHover}
                      center={
                        hover != null ? (
                          <motion.div key={hover} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="text-center">
                            <div className="text-[28px] font-medium tracking-tightest"
                                 style={{ color: HEIR_COLORS[hover % HEIR_COLORS.length] }}>
                              {result.heirs[hover].group_percent}%
                            </div>
                            <div className={`text-[11px] text-cream-300 ${isUrdu ? 'urdu' : ''}`}>
                              {heirLabel(result.heirs[hover].heir)}
                            </div>
                          </motion.div>
                        ) : (
                          <div className="text-center">
                            <div className="text-[26px] font-medium text-cream-100 tracking-tightest">
                              {result.estate_value
                                ? <CountUp value={result.estate_value} format={(v)=>`Rs ${Math.round(v).toLocaleString()}`}/>
                                : <CountUp value={100} suffix="%"/>}
                            </div>
                            <div className={`text-[10px] text-cream-400 mt-0.5 ${isUrdu ? 'urdu' : 'mono uppercase tracking-caps'}`}>
                              {result.estate_value ? (isUrdu ? 'کل ترکہ' : 'total estate') : (isUrdu ? 'کل' : 'distributed')}
                            </div>
                          </div>
                        )
                      }
                    />

                    {/* Legend rows */}
                    <div className="flex-1 w-full space-y-2">
                      {result.heirs.map((h, i) => {
                        const color = HEIR_COLORS[i % HEIR_COLORS.length]
                        const active = hover === i
                        return (
                          <motion.div
                            key={h.heir}
                            initial={{ opacity: 0, x: isUrdu ? 12 : -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07 + 0.25 }}
                            onMouseEnter={() => setHover(i)}
                            onMouseLeave={() => setHover(null)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-default transition
                              ${active ? 'bg-white/[0.05]' : ''} ${isUrdu ? 'flex-row-reverse text-right' : ''}`}
                            style={active ? { boxShadow: `inset ${isUrdu ? '-2px' : '2px'} 0 0 ${color}` } : {}}
                          >
                            <span className="w-3 h-3 rounded-full shrink-0 transition-transform"
                                  style={{ background: color, transform: active ? 'scale(1.35)' : 'scale(1)' }}/>
                            <div className="flex-1 min-w-0">
                              <div className={`flex items-baseline gap-2 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                                <span className={`text-cream-100 ${isUrdu ? 'urdu text-[15px]' : 'text-[14px]'}`}>
                                  {heirLabel(h.heir)}{h.count > 1 ? ` ×${h.count}` : ''}
                                </span>
                                <span className="mono text-[11px] text-cream-400">{h.group_fraction}</span>
                              </div>
                              {h.count > 1 && (
                                <div className="mono text-[10.5px] text-cream-400">
                                  {t('perPerson')}: {h.per_person_percent}%
                                  {h.per_person_amount != null && ` · Rs ${h.per_person_amount.toLocaleString()}`}
                                </div>
                              )}
                            </div>
                            <div className={`shrink-0 ${isUrdu ? 'text-left' : 'text-right'}`}>
                              <div className="text-[16px] font-medium tabular-nums" style={{ color }}>
                                <CountUp value={h.group_percent} decimals={h.group_percent % 1 ? 1 : 0} suffix="%" duration={700 + i*80}/>
                              </div>
                              {h.group_amount != null && (
                                <div className="mono text-[10.5px] text-cream-400">
                                  <CountUp value={h.group_amount} format={(v)=>`Rs ${Math.round(v).toLocaleString()}`} duration={700 + i*80}/>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Basis / citations */}
                <div className="surface rounded-2xl p-5">
                  <div className={isUrdu ? 'urdu text-[12px] text-accent-400 mb-3' : 'kicker mb-3'}>{t('basisLabel')}</div>
                  <ul className="space-y-1.5">
                    {result.heirs.map((h, i) => (
                      <li key={i} className={`flex items-start gap-2 text-[12px] ${isUrdu ? 'flex-row-reverse text-right' : ''}`}>
                        <span className="text-accent-400 shrink-0">§</span>
                        <span className="text-cream-300"><b className="text-cream-100">{heirLabel(h.heir)}:</b> {h.basis}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Notes */}
                {result.notes?.length > 0 && (
                  <div className="surface rounded-2xl p-4 border-amber-500/25 space-y-2">
                    {result.notes.map((n, i) => (
                      <div key={i} className={`flex items-start gap-2 text-[12.5px] text-cream-300 ${isUrdu ? 'flex-row-reverse text-right' : ''}`}>
                        <Info size={13} className="text-amber-400 mt-0.5 shrink-0"/>
                        <span className={isUrdu ? 'urdu' : 'reader'}>{n}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className={`text-[11.5px] text-cream-400 px-1 ${isUrdu ? 'urdu text-right' : 'reader'}`}>
                  {t('wirasatDisclaimer')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function Stepper({ label, value, setValue, min, max, isUrdu }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className={`flex items-center gap-2 ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setValue(Math.max(min, value - 1))}
          className="w-9 h-9 rounded-lg border border-white/10 text-cream-300 hover:border-accent-500/40 hover:text-accent-400 flex items-center justify-center transition disabled:opacity-30"
          disabled={value <= min}>
          <Minus size={14}/>
        </motion.button>
        <div className="flex-1 text-center relative h-7 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={value}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center text-[18px] font-medium text-cream-100 tabular-nums"
            >
              {value}
            </motion.div>
          </AnimatePresence>
        </div>
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setValue(Math.min(max, value + 1))}
          className="w-9 h-9 rounded-lg border border-white/10 text-cream-300 hover:border-accent-500/40 hover:text-accent-400 flex items-center justify-center transition disabled:opacity-30"
          disabled={value >= max}>
          <Plus size={14}/>
        </motion.button>
      </div>
    </div>
  )
}

function Toggle({ label, on, setOn, isUrdu }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOn(!on)}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition ${isUrdu ? 'flex-row-reverse' : ''}
        ${on ? 'border-accent-500/50 bg-accent-500/10' : 'border-white/10 hover:border-white/20'}`}>
      <span className={`text-[12.5px] ${on ? 'text-accent-300' : 'text-cream-300'} ${isUrdu ? 'urdu' : ''}`}>{label}</span>
      <span className={`w-9 h-5 rounded-full p-0.5 flex ${on ? 'bg-accent-500 justify-end' : 'bg-white/10 justify-start'} ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="block w-4 h-4 rounded-full bg-white"/>
      </span>
    </motion.button>
  )
}
