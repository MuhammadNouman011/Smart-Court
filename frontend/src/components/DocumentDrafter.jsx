import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FilePen, Sparkles, Download, Loader2, FileText } from 'lucide-react'
import { Documents } from '../lib/api.js'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { useToast } from '../hooks/useToast.jsx'

const FIELD_SETS = {
  fir: [
    { key: 'complainant_name', label: 'Complainant name', placeholder: 'Ahmed Ali Khan' },
    { key: 'complainant_cnic', label: 'CNIC' },
    { key: 'complainant_address', label: 'Address' },
    { key: 'station', label: 'Police station / district' },
    { key: 'incident_date', label: 'Date of incident' },
    { key: 'incident_time', label: 'Time of incident' },
    { key: 'incident_location', label: 'Place of incident' },
    { key: 'accused', label: 'Accused / suspect(s)' },
    { key: 'narrative', label: 'What happened (in your own words)', textarea: true },
  ],
  legal_notice: [
    { key: 'sender', label: 'Sender name & address' },
    { key: 'recipient', label: 'Recipient name & address' },
    { key: 'subject', label: 'Subject of dispute' },
    { key: 'facts', label: 'Material facts', textarea: true },
    { key: 'demand', label: 'Specific demand / remedy sought', textarea: true },
    { key: 'deadline_days', label: 'Deadline (days)', placeholder: '15' },
  ],
  affidavit: [
    { key: 'deponent_name', label: 'Deponent name' },
    { key: 'deponent_cnic', label: 'Deponent CNIC' },
    { key: 'deponent_father', label: "Father's name" },
    { key: 'deponent_address', label: 'Address' },
    { key: 'subject', label: 'Subject of affidavit' },
    { key: 'statements', label: 'Statements to swear (each on a new line)', textarea: true },
    { key: 'place', label: 'Place' },
    { key: 'date', label: 'Date' },
  ],
  complaint_letter: [
    { key: 'sender', label: 'Sender name & contact' },
    { key: 'authority', label: 'Authority to address (e.g., Consumer Court Lahore)' },
    { key: 'against', label: 'Complaint against (vendor, person, dept.)' },
    { key: 'facts', label: 'Facts', textarea: true },
    { key: 'damages', label: 'Damages suffered (financial / other)', textarea: true },
    { key: 'remedy', label: 'Remedy requested', textarea: true },
  ],
}

export default function DocumentDrafter() {
  const { t, lang, isUrdu } = useLanguage()
  const toast = useToast()
  const [types, setTypes] = useState([])
  const [docType, setDocType] = useState('fir')
  const [fields, setFields] = useState({})
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  useEffect(() => {
    Documents.types().then(setTypes).catch(() => {
      setTypes(Object.keys(FIELD_SETS).map(k => ({ id: k, label: labelFor(k) })))
    })
  }, [])

  useEffect(() => { setFields({}); setDraft('') }, [docType])

  const spec = FIELD_SETS[docType] || []
  const currentLabel = useMemo(() => types.find(x => x.id === docType)?.label || labelFor(docType), [types, docType])

  async function generate() {
    setBusy(true)
    try {
      const r = await Documents.draft({ doc_type: docType, language: lang, fields })
      setDraft(r.text || '')
      toast.success(`Draft ready (${r.label})`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Generation failed')
    } finally {
      setBusy(false)
    }
  }

  async function download(format) {
    if (!draft) return
    setPdfBusy(true)
    try {
      const blob = format === 'docx'
        ? await Documents.docx({ title: currentLabel, body: draft })
        : await Documents.pdf({  title: currentLabel, body: draft })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentLabel.replace(/\s+/g, '_')}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(`Could not export ${format.toUpperCase()}`)
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      {/* Left — form */}
      <div className={`glass rounded-2xl p-6 ${isUrdu ? 'urdu' : ''}`}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center text-ink-900">
            <FilePen size={18}/>
          </div>
          <div>
            <div className="display text-xl gold-text italic">{t('drafter')}</div>
            <div className="text-xs text-parchment-100/60">Fill the form. Smart Court drafts the rest.</div>
          </div>
        </div>

        <label className="label">{t('docType')}</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {(types.length ? types : Object.keys(FIELD_SETS).map(k => ({ id: k, label: labelFor(k) }))).map(opt => (
            <button
              key={opt.id}
              onClick={() => setDocType(opt.id)}
              className={`relative rounded-xl p-3 text-left text-xs border transition
                ${docType === opt.id
                  ? 'border-gold-400/60 bg-gold-400/10 text-gold-100'
                  : 'border-white/10 text-parchment-100/80 hover:border-white/20 hover:bg-white/[0.04]'}`}
            >
              <FileText size={14} className="mb-1.5 opacity-70"/>
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {spec.map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              {f.textarea
                ? <textarea
                    value={fields[f.key] || ''}
                    onChange={e => setFields(s => ({ ...s, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    rows={4}
                    className={`input resize-none ${isUrdu ? 'urdu' : ''}`}
                  />
                : <input
                    value={fields[f.key] || ''}
                    onChange={e => setFields(s => ({ ...s, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className={`input ${isUrdu ? 'urdu' : ''}`}
                  />}
            </div>
          ))}
        </div>

        <button onClick={generate} disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
          {busy ? 'Drafting…' : t('drafterCta')}
        </button>
      </div>

      {/* Right — preview */}
      <div className={`glass rounded-2xl overflow-hidden flex flex-col min-h-[520px] h-[calc(100vh-220px)] ${isUrdu ? 'urdu' : ''}`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-gold-300"/>
            <div className="text-xs uppercase tracking-[0.2em] text-parchment-100/60">{t('livePreview')} · {currentLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => download('docx')} disabled={!draft || pdfBusy} className="btn-ghost text-xs">
              {pdfBusy ? <Loader2 size={13} className="animate-spin"/> : <Download size={13}/>}
              {t('downloadDocx')}
            </button>
            <button onClick={() => download('pdf')} disabled={!draft || pdfBusy} className="btn-primary text-xs">
              {pdfBusy ? <Loader2 size={13} className="animate-spin"/> : <Download size={13}/>}
              {t('downloadPdf')}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[radial-gradient(800px_400px_at_50%_-10%,rgba(201,168,76,0.06),transparent_60%)]">
          <AnimatePresence mode="wait">
            {busy && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-3 rounded-full shimmer" style={{ width: `${60 + Math.random()*40}%` }}/>
                ))}
              </motion.div>
            )}
            {!busy && draft && (
              <motion.pre
                key="ready"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="whitespace-pre-wrap font-serif text-sm text-parchment-50 leading-relaxed"
              >
                {draft}
              </motion.pre>
            )}
            {!busy && !draft && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-parchment-100/45 text-sm py-16">
                Fill the form and press <span className="text-gold-200">Generate draft</span> to see your document here.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function labelFor(k) {
  return ({
    fir: 'FIR Application',
    legal_notice: 'Legal Notice',
    affidavit: 'Affidavit',
    complaint_letter: 'Complaint Letter',
  })[k] || k
}
