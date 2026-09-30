import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const Ctx = createContext(null)

const ICONS = {
  success: <CheckCircle2 size={18} className="text-emerald-300" />,
  error:   <AlertTriangle size={18} className="text-red-300" />,
  info:    <Info size={18} className="text-gold-300" />,
}

let _id = 0

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const push = useCallback((message, kind = 'info', ms = 3800) => {
    const id = ++_id
    setItems(arr => [...arr, { id, message, kind }])
    setTimeout(() => setItems(arr => arr.filter(t => t.id !== id)), ms)
  }, [])

  const api = {
    success: (m) => push(m, 'success'),
    error:   (m) => push(m, 'error'),
    info:    (m) => push(m, 'info'),
  }

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed z-[60] bottom-6 right-6 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {items.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 24, y: 12 }}
              animate={{ opacity: 1, x: 0,  y: 0 }}
              exit={{ opacity: 0, x: 24, y: 12 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto glass-strong rounded-xl px-4 py-3 flex items-center gap-3 min-w-[260px] max-w-[420px]"
            >
              {ICONS[t.kind]}
              <span className="text-sm text-slate-100 flex-1">{t.message}</span>
              <button
                className="text-slate-400 hover:text-slate-100 transition"
                onClick={() => setItems(arr => arr.filter(x => x.id !== t.id))}
              >
                <X size={14}/>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
