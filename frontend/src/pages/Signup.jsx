import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.jsx'
import BrandLogo from '../components/BrandLogo.jsx'

export default function Signup() {
  const { t, isUrdu } = useLanguage()
  const { signup } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!name || !email || !password) return
    setBusy(true)
    try {
      await signup(name, email, password)
      toast.success('Account created')
      nav('/chat')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Sign up failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`min-h-[80vh] flex items-center justify-center ${isUrdu ? 'urdu' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="surface-elevated rounded-2xl p-8 w-full max-w-md"
      >
        <div className={`mb-6 flex items-center gap-3 ${isUrdu ? 'flex-row-reverse' : ''}`}>
          <BrandLogo size={40}/>
          <div className={`text-cream-100 tracking-tightest ${isUrdu ? 'font-urdu text-[22px]' : 'text-[20px] font-medium'}`}>
            {t('appName')}
          </div>
        </div>
        <h1 className={`text-[34px] font-medium tracking-tightest text-cream-100 ${isUrdu ? 'urdu' : ''}`}>
          {t('authSignupTitle')}
        </h1>
        <p className={`text-cream-300 mt-2 ${isUrdu ? 'urdu text-[15px]' : 'reader text-[14px]'}`}>
          {t('authSignupSub')}
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <label className="label">{t('fullName')}</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-400"/>
              <input
                required
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Ahmed Ali"
                className="input pl-9"
                autoComplete="name"
              />
            </div>
          </div>
          <div>
            <label className="label">{t('email')}</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-400"/>
              <input
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input pl-9"
                autoComplete="email"
              />
            </div>
          </div>
          <div>
            <label className="label">{t('password')}</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-400"/>
              <input
                type="password" required minLength={6}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input pl-9"
                autoComplete="new-password"
              />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full mt-2">
            {busy ? <Loader2 size={14} className="animate-spin"/> : <ArrowRight size={14}/>}
            {t('submitSignup')}
          </button>
        </form>

        <div className={`mt-6 text-[13px] text-cream-300 text-center ${isUrdu ? 'urdu' : ''}`}>
          {t('haveAccount')}{' '}
          <Link to="/login" className="text-accent-400 hover:text-accent-300 underline-offset-4 hover:underline">
            {t('signinLink')}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
