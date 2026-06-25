import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, MessageSquare, FileSearch, FilePen, Gavel, Clock, Scale } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import BrandLogo from './BrandLogo.jsx'

const itemsFor = (t) => [
  { to: '/',          icon: Home,         label: t('navHome') },
  { to: '/chat',      icon: MessageSquare,label: t('navChat') },
  { to: '/scanner',   icon: FileSearch,   label: t('navScanner') },
  { to: '/drafter',   icon: FilePen,      label: t('navDrafter') },
  { to: '/courtroom', icon: Gavel,        label: t('navCourtroom') },
  { to: '/inheritance', icon: Scale,      label: t('navInheritance') },
  { to: '/history',   icon: Clock,        label: t('navHistory') },
]

export default function Sidebar() {
  const { t, isUrdu } = useLanguage()
  const { user } = useAuth()

  return (
    <aside className="sticky top-0 h-screen flex flex-col backdrop-blur-2xl chrome-sidebar">
      <div className="px-6 pt-7 pb-6">
        <div className={`flex items-center gap-3 ${isUrdu ? 'flex-row-reverse' : ''}`}>
          <BrandLogo size={44} />
          <div
            className={`leading-none text-cream-100 tracking-tightest ${
              isUrdu ? 'font-urdu text-[24px]' : 'text-[22px] font-medium'
            }`}
          >
            {t('appName')}
          </div>
        </div>
      </div>

      <div className="h-px mx-6"
           style={{ background: 'linear-gradient(90deg, transparent, var(--line-2), transparent)' }} />

      <nav className="px-3 py-5 flex flex-col gap-0.5">
        <div className={`px-4 mb-2 ${isUrdu ? 'urdu text-[12px] text-accent-400' : 'kicker'}`}>{t('sidebarNav')}</div>
        {itemsFor(t).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors
               ${isActive ? 'text-cream-100' : 'text-cream-300 hover:text-cream-100'}
               ${isUrdu ? 'flex-row-reverse text-right' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-white/[0.05] border border-white/[0.08]"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  />
                )}
                <Icon size={15} className={`relative shrink-0 transition-colors ${isActive ? 'text-accent-400' : 'text-cream-300 group-hover:text-cream-100'}`} />
                <span className={`relative ${isUrdu ? 'urdu text-[15px] mr-auto' : 'text-[13.5px] tracking-crisp'}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="mt-auto p-4">
          <div className={`surface rounded-xl p-4 ${isUrdu ? 'urdu' : ''}`}>
            <div className={isUrdu ? 'text-[11px] text-accent-400 mb-2' : 'kicker mb-2'}>
              {t('signedInAs')}
            </div>
            <div className={`text-[14px] text-cream-100 ${isUrdu ? 'urdu' : ''}`}>{user.full_name}</div>
            <div className="text-[11.5px] text-cream-400 mt-0.5 mono break-all">{user.email}</div>
          </div>
        </div>
      )}
    </aside>
  )
}

