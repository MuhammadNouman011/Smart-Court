import { AnimatePresence, motion } from 'framer-motion'
import { Route, Routes, useLocation, Link } from 'react-router-dom'
import { LogIn, LogOut, UserPlus, User, Command } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import LanguageToggle from './components/LanguageToggle.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import Home from './pages/Home.jsx'
import Chat from './pages/Chat.jsx'
import Scanner from './pages/Scanner.jsx'
import Drafter from './pages/Drafter.jsx'
import Courtroom from './pages/Courtroom.jsx'
import History from './pages/History.jsx'
import InheritancePage from './pages/Inheritance.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import { useLanguage } from './hooks/useLanguage.jsx'
import { useAuth } from './hooks/useAuth.jsx'

export default function App() {
  const location = useLocation()
  const { isUrdu, t } = useLanguage()
  const { user, logout } = useAuth()

  return (
    <>
      <CommandPalette />
      <div className="min-h-full grid grid-cols-[272px_1fr]">
        <Sidebar />

        <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 backdrop-blur-2xl chrome-header">
          <div className="flex items-center justify-between px-10 py-3">
            <div className={`flex items-center gap-3 text-[11.5px] text-cream-300 ${isUrdu ? 'flex-row-reverse' : ''}`}>
              <span className="live-pill">{t('sovereignTagline')}</span>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link to="/history" className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-ink-900/60 text-[12px] text-cream-200 hover:text-accent-400 transition">
                    <User size={12}/> {user.full_name?.split(' ')[0] || user.email}
                  </Link>
                  <button onClick={logout} className="btn-ghost !px-3 !py-1.5 !text-[12px]">
                    <LogOut size={12}/> {t('logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-ghost !px-3 !py-1.5 !text-[12px]">
                    <LogIn size={12}/> {t('login')}
                  </Link>
                  <Link to="/signup" className="btn-primary !px-3 !py-1.5 !text-[12px]">
                    <UserPlus size={12}/> {t('signup')}
                  </Link>
                </div>
              )}
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] mono text-[10px] text-cream-300 hover:text-accent-400 hover:border-accent-500/40 transition"
                title="Command palette (Ctrl K)"
              >
                <Command size={11}/> K
              </button>
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 px-10 py-10 max-w-[1400px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <Routes location={location}>
                <Route path="/"          element={<Home />} />
                <Route path="/chat"      element={<Chat />} />
                <Route path="/scanner"   element={<Scanner />} />
                <Route path="/drafter"   element={<Drafter />} />
                <Route path="/courtroom" element={<Courtroom />} />
                <Route path="/inheritance" element={<InheritancePage />} />
                <Route path="/history"   element={<History />} />
                <Route path="/login"     element={<Login />} />
                <Route path="/signup"    element={<Signup />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
        </div>
      </div>
    </>
  )
}
