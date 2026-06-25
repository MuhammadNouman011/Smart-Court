import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Upload, Loader2 } from 'lucide-react'
import { Voice } from '../lib/api.js'
import { useToast } from '../hooks/useToast.jsx'
import { useLanguage } from '../hooks/useLanguage.jsx'

/**
 * Voice input — supports both:
 *   1. live mic recording via MediaRecorder (if user grants permission)
 *   2. uploading an existing audio file
 * Either way, the audio is sent to Whisper on the backend.
 */
export default function VoiceInput({ onTranscribed, language }) {
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const toast = useToast()
  const { t } = useLanguage()

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], 'voice.webm', { type: 'audio/webm' })
        await transcribe(file)
        stream.getTracks().forEach(track => track.stop())
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
    } catch (err) {
      toast.error('Microphone access denied or unavailable. Upload an audio file instead.')
    }
  }

  function stopRecording() {
    mediaRef.current?.stop()
    setRecording(false)
  }

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (file) await transcribe(file)
    e.target.value = ''
  }

  async function transcribe(file) {
    setBusy(true)
    try {
      const r = await Voice.transcribe(file, language === 'ur' ? 'ur' : null)
      if (r.text) {
        onTranscribed?.(r.text, r.language)
        toast.success(`Heard you in ${r.language === 'ur' ? 'Urdu' : 'English'}`)
      } else {
        toast.error('Could not understand the audio.')
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Transcription failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={recording ? stopRecording : startRecording}
        disabled={busy}
        whileTap={{ scale: 0.94 }}
        className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full transition
          ${recording
            ? 'bg-red-500/30 border border-red-400 text-red-100'
            : 'bg-white/[0.04] border border-white/10 text-slate-300 hover:text-gold-200 hover:border-gold-400/40'}`}
        title={recording ? t('listening') : t('speak')}
      >
        {busy
          ? <Loader2 size={16} className="animate-spin" />
          : <Mic size={16} />}
        {recording && (
          <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping"/>
        )}
      </motion.button>

      <label
        className="inline-flex items-center justify-center w-10 h-10 rounded-full cursor-pointer
                   bg-white/[0.04] border border-white/10 text-slate-300 hover:text-gold-200 hover:border-gold-400/40"
        title="Upload an audio file"
      >
        <Upload size={14} />
        <input type="file" accept="audio/*" className="hidden" onChange={onFile}/>
      </label>
    </div>
  )
}
