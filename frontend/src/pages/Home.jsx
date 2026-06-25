import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight, MessageSquare, FileSearch, FilePen, Gavel, Mic, ShieldCheck, Scale,
} from 'lucide-react'
import { useLanguage, severityName } from '../hooks/useLanguage.jsx'

export default function Home() {
  const { t, isUrdu } = useLanguage()

  return (
    <div className={`relative ${isUrdu ? 'urdu' : ''}`}>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl">
        <AnimatedMesh />
        <div className="relative pt-10 pb-14 px-1">
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-balance max-w-[18ch]"
            style={{
              fontFamily: isUrdu ? '"Noto Nastaliq Urdu", serif' : 'Geist, sans-serif',
              fontSize: isUrdu ? 'clamp(36px, 4.8vw, 64px)' : 'clamp(44px, 5.6vw, 76px)',
              fontWeight: 500,
              letterSpacing: isUrdu ? '0' : '-0.035em',
              lineHeight: isUrdu ? 1.55 : 1.05,
              direction: isUrdu ? 'rtl' : 'ltr',
              wordBreak: 'normal',
              overflowWrap: 'normal',
              hyphens: 'none',
            }}
          >
            <span className="text-cream-100">{t('heroLine1')} </span>
            <span className="display-italic gold-text whitespace-nowrap">{t('heroLineSov')}</span>
            <span className="text-cream-100"> {t('heroLine2')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className={`reader text-[18px] text-cream-300 mt-7 max-w-2xl leading-[1.65] ${isUrdu ? 'urdu text-[19px]' : ''}`}
          >
            {t('heroDesc')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link to="/chat" className="btn-primary group">
              {t('cta')}
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
            </Link>
            <Link to="/courtroom" className="btn-ghost">
              <Gavel size={13} /> {t('secondaryCta')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* LIVE PREVIEW */}
      <motion.section
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="relative"
      >
        <ConversationPreview />
      </motion.section>

      {/* BENTO FEATURES */}
      <motion.section
        className="mt-20"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-end justify-between mb-7">
          <div className={isUrdu ? 'text-right' : ''}>
            <div className={isUrdu ? 'text-[12px] text-accent-400 mb-2 urdu' : 'eyebrow mb-2'}>{t('chapterIntro')}</div>
            <h2 className={`text-[40px] font-medium tracking-tightest text-cream-100 ${isUrdu ? 'urdu' : ''}`}>
              {t('chapterIntroSub')}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 auto-rows-[minmax(180px,auto)]">
          <BentoCard
            to="/chat" icon={MessageSquare}
            title={t('fInquiry')} tag={t('cap01')}
            className="col-span-12 lg:col-span-7 lg:row-span-2"
            big isUrdu={isUrdu}
          >
            <p className={`text-[15px] text-cream-300 leading-[1.65] ${isUrdu ? 'urdu text-[16px]' : 'reader'}`}>
              {t('fInquiryDesc')}
            </p>
          </BentoCard>

          <BentoCard
            to="/scanner" icon={FileSearch}
            title={t('fScanner')} tag={t('cap02')}
            className="col-span-12 sm:col-span-6 lg:col-span-5"
            isUrdu={isUrdu}
          >
            <p className={`text-[14px] text-cream-300 ${isUrdu ? 'urdu text-[15px]' : 'reader'}`}>
              {t('fScannerDesc')}
            </p>
            <RedFlagPreview isUrdu={isUrdu} />
          </BentoCard>

          <BentoCard
            to="/drafter" icon={FilePen}
            title={t('fDrafter')} tag={t('cap03')}
            className="col-span-12 sm:col-span-6 lg:col-span-5"
            isUrdu={isUrdu}
          >
            <p className={`text-[14px] text-cream-300 ${isUrdu ? 'urdu text-[15px]' : 'reader'}`}>
              {t('fDrafterDesc')}
            </p>
          </BentoCard>

          <BentoCard
            to="/courtroom" icon={Gavel}
            title={t('fCourtroom')} tag={t('cap04')}
            className="col-span-12 sm:col-span-6 lg:col-span-7"
            accent isUrdu={isUrdu}
          >
            <p className={`text-[14px] text-cream-300 ${isUrdu ? 'urdu text-[15px]' : 'reader'}`}>
              {t('fCourtroomDesc')}
            </p>
          </BentoCard>

          {/* Wirasat — the standout new feature */}
          <BentoCard
            to="/inheritance" icon={Scale}
            title={t('fInheritance')} tag={t('cap05')}
            className="col-span-12 sm:col-span-6 lg:col-span-5"
            isUrdu={isUrdu}
          >
            <p className={`text-[14px] text-cream-300 ${isUrdu ? 'urdu text-[15px]' : 'reader'}`}>
              {t('fInheritanceDesc')}
            </p>
            <MiniDonut />
          </BentoCard>

          <BentoCard
            to="/chat" icon={Mic}
            title={t('fVoice')} tag={t('cap00')}
            className="col-span-12 sm:col-span-6 lg:col-span-4"
            isUrdu={isUrdu}
          >
            <p className={`text-[14px] text-cream-300 ${isUrdu ? 'urdu text-[15px]' : 'reader'}`}>
              {t('fVoiceDesc')}
            </p>
            <Waveform />
          </BentoCard>

          <BentoCard
            icon={ShieldCheck}
            title={t('fPrivacy')} tag={t('capPrivacy')}
            className="col-span-12 sm:col-span-6 lg:col-span-8"
            inactive isUrdu={isUrdu}
          >
            <p className={`text-[14px] text-cream-300 ${isUrdu ? 'urdu text-[15px]' : 'reader'}`}>
              {t('fPrivacyDesc')}
            </p>
          </BentoCard>
        </div>
      </motion.section>

      {/* FINAL CTA */}
      <motion.section
        className="mt-24 mb-4"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative surface-elevated rounded-3xl p-12 text-center overflow-hidden">
          <div className="absolute inset-0 -z-0 opacity-50">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]"
                 style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.4), transparent)' }} />
          </div>
          <div className="relative">
            <div className={isUrdu ? 'text-[12px] text-accent-400 mb-4 urdu' : 'eyebrow mb-4'}>{t('begin')}</div>
            <h3 className={`text-[44px] font-medium tracking-tightest text-cream-100 mb-4 text-balance ${isUrdu ? 'urdu' : ''}`}>
              {t('finalCtaHeading')}{' '}
              <span className="display-italic gold-text">{t('finalCtaItalic')}</span>
            </h3>
            <p className={`text-[16px] text-cream-300 mb-7 max-w-xl mx-auto ${isUrdu ? 'urdu text-[17px]' : 'reader'}`}>
              {t('finalCtaSub')}
            </p>
            <Link to="/chat" className="btn-primary">
              {t('finalCtaButton')} <ArrowUpRight size={14}/>
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

function AnimatedMesh() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        aria-hidden
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.35), transparent 70%)' }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(20,184,166,0.22), transparent 70%)' }}
        animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

function ConversationPreview() {
  const { t, isUrdu } = useLanguage()
  const sample = isUrdu
    ? {
        q: 'مالک مکان دو دن میں گھر خالی کرنے کا کہہ رہا ہے، میرے کیا حقوق ہیں؟',
        a: 'مغربی پاکستان شہری کرایہ پابندی آرڈیننس 1959 کی دفعہ 13 کے تحت، مالک مکان صرف مخصوص بنیادوں پر کرایہ دار کو بے دخل کر سکتا ہے۔ بغیر نوٹس بے دخلی غیر قانونی ہے۔ آپ کرایہ کنٹرولر سے رجوع کر سکتے ہیں۔',
      }
    : {
        q: 'My landlord is evicting me in 2 days without notice. What are my rights?',
        a: 'Under Section 13 of the West Pakistan Urban Rent Restriction Ordinance 1959, a landlord can evict a tenant only on specified grounds. Eviction without notice is unlawful. You can apply to the Rent Controller for a stay.',
      }

  return (
    <div className="relative surface-elevated rounded-3xl overflow-hidden">
      <div className="absolute inset-0 opacity-60 pointer-events-none"
           style={{ background: 'radial-gradient(800px 300px at 80% 0%, rgba(16,185,129,0.15), transparent 60%)' }}/>

      <div className="relative flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70"/>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70"/>
          <span className="w-2.5 h-2.5 rounded-full bg-accent-500/70"/>
        </div>
        <span className="live-pill">{t('statusWriting')}</span>
      </div>

      <div className="relative grid lg:grid-cols-[1fr_280px] gap-0">
        <div className={`p-6 lg:p-8 space-y-5 ${isUrdu ? 'urdu' : ''}`}>
          <div>
            <div className={isUrdu ? 'text-[12px] text-accent-400 mb-1 urdu' : 'kicker mb-1'}>{t('fromCitizen')}</div>
            <div className={`text-cream-100 ${isUrdu ? 'text-[16px]' : 'text-[15px]'}`}>{sample.q}</div>
          </div>
          <div>
            <div className={isUrdu ? 'text-[12px] text-accent-400 mb-1 urdu flex items-center gap-2' : 'kicker mb-1 flex items-center gap-2'}>
              {t('aiLabel')} · {t('consideredOpinion')} <span className="live-pill">{t('statusWriting')}</span>
            </div>
            <div className={`text-cream-100 ${isUrdu ? 'urdu text-[16px] leading-[2]' : 'prose-court text-[14.5px]'}`}>
              {sample.a}<span className="cursor"/>
            </div>
          </div>
        </div>

        <div className="hidden lg:block border-l border-white/[0.06] p-6 space-y-5">
          <div>
            <div className={isUrdu ? 'urdu text-[12px] text-accent-400 mb-3' : 'kicker mb-3'}>{t('caseStrength')}</div>
            <div className="flex items-baseline gap-3">
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-5xl font-medium text-accent-400 tracking-tightest leading-none"
              >78</motion.div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-medium text-accent-400 bg-accent-500/10 border border-accent-500/30">
                {isUrdu ? 'مستحکم' : 'Solid'}
              </span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full"
                style={{ background: 'linear-gradient(90deg, rgba(52,211,153,0.4), #34D399)',
                         boxShadow: '0 0 12px rgba(52,211,153,0.35)' }}
                initial={{ width: 0 }} animate={{ width: '78%' }}
                transition={{ duration: 1.4, delay: 0.6 }}
              />
            </div>
            <div className={`mt-1.5 flex items-center justify-between text-[10px] text-cream-400 ${isUrdu ? 'urdu flex-row-reverse' : 'mono uppercase tracking-caps'}`}>
              <span>0</span><span>50</span><span>100</span>
            </div>
          </div>
          <div>
            <div className={isUrdu ? 'urdu text-[12px] text-accent-400 mb-3' : 'kicker mb-3'}>{t('citations')}</div>
            <div className="space-y-2 text-[12px]">
              <CitationRow>WPURRO 1959 § 13</CitationRow>
              <CitationRow>Sindh RPO 1979 § 14</CitationRow>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CitationRow({ children }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
      <span className="text-accent-400">§</span>
      <span className="mono text-cream-200 text-[11px]">{children}</span>
    </div>
  )
}

function BentoCard({ children, to, icon: Icon, title, tag, className = '', big, accent, inactive, isUrdu }) {
  const Wrap = to ? Link : 'div'
  const props = to ? { to } : {}
  return (
    <Wrap
      {...props}
      className={`group relative ${className} surface rounded-2xl p-6 transition
                  hover:border-accent-500/35 ${inactive ? 'pointer-events-none' : ''}
                  ${accent ? 'bg-gradient-to-br from-accent-500/[0.08] via-transparent to-transparent' : ''}`}
      onMouseMove={(e) => {
        if (!to) return
        const r = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
      }}
    >
      <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none bg-radial-emerald" />
      <div className={`relative flex items-start justify-between mb-5 ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-accent-400 group-hover:bg-accent-500/[0.12] transition">
          <Icon size={16} />
        </div>
        <div className={isUrdu ? 'text-[10px] text-cream-400 urdu' : 'mono text-[10px] uppercase tracking-caps text-cream-400'}>{tag}</div>
      </div>
      <div className="relative">
        <div className={`flex items-baseline justify-between mb-2 ${isUrdu ? 'flex-row-reverse' : ''}`}>
          <h3 className={`${big ? 'text-[36px]' : 'text-[24px]'} font-medium tracking-tightest text-cream-100 ${isUrdu ? 'urdu' : ''}`}>
            {title}
          </h3>
          {to && !inactive && (
            <ArrowUpRight size={16} className="text-cream-400 group-hover:text-accent-400 transition" />
          )}
        </div>
        {children}
      </div>
    </Wrap>
  )
}

function RedFlagPreview({ isUrdu }) {
  const { t } = useLanguage()
  const rows = isUrdu
    ? [['خودکار تجدید کا جال', 'critical'], ['بغیر نوٹس بے دخلی', 'high'], ['روزانہ 10٪ جرمانہ', 'medium']]
    : [['Auto-renewal trap', 'critical'], ['No-notice eviction', 'high'], ['Penalty 10% per day', 'medium']]
  return (
    <div className="mt-4 space-y-1.5">
      {rows.map(([label, sev], i) => (
        <div key={label} className={`flex items-center justify-between px-3 py-1.5 rounded-md bg-white/[0.02] border border-white/[0.05] ${isUrdu ? 'flex-row-reverse urdu' : ''}`}>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${
              sev === 'critical' ? 'bg-rose-500' : sev === 'high' ? 'bg-rose-400' : 'bg-amber-400'
            }`}/>
            <span className={`text-[12px] text-cream-200 ${isUrdu ? 'urdu text-[13px]' : ''}`}>{label}</span>
          </div>
          <span className={`text-[10px] text-cream-400 ${isUrdu ? 'urdu text-[11px]' : 'mono uppercase tracking-caps'}`}>{severityName(sev, t)}</span>
        </div>
      ))}
    </div>
  )
}

function Waveform() {
  return (
    <div className="mt-5 flex items-center gap-1 h-10">
      {[20, 50, 35, 70, 45, 90, 55, 30, 60, 40, 80, 25, 65, 35, 75, 50].map((h, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full bg-accent-500"
          style={{ height: `${h}%` }}
          animate={{ scaleY: [1, 0.4 + Math.random() * 0.6, 1] }}
          transition={{ duration: 1.2 + i * 0.05, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }}
        />
      ))}
    </div>
  )
}

// Small decorative spinning conic "pie" for the inheritance card
function MiniDonut() {
  return (
    <div className="mt-5 flex items-center gap-3">
      <motion.div
        className="w-12 h-12 rounded-full"
        style={{
          background: 'conic-gradient(#10B981 0 40%, #34D399 40% 65%, #6EE7B7 65% 80%, #FBBF24 80% 100%)',
          WebkitMask: 'radial-gradient(circle 6px at center, transparent 98%, #000 100%)',
          mask: 'radial-gradient(circle 6px at center, transparent 98%, #000 100%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      <div className="flex flex-col gap-1">
        {[['#10B981','40%'],['#34D399','25%'],['#FBBF24','20%']].map(([c,w],i)=>(
          <span key={i} className="h-1.5 rounded-full" style={{ background:c, width: w==='40%'?40:w==='25%'?28:22 }}/>
        ))}
      </div>
    </div>
  )
}
