import { useEffect } from 'react'
import ChatInterface from '../components/ChatInterface.jsx'
import { useLanguage } from '../hooks/useLanguage.jsx'

export default function Chat() {
  const { t, isUrdu } = useLanguage()

  useEffect(() => {
    function handler(e) {
      const el = document.querySelector('textarea')
      if (el) {
        const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
        set.call(el, e.detail)
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.focus()
      }
    }
    window.addEventListener('smartcourt:example', handler)
    return () => window.removeEventListener('smartcourt:example', handler)
  }, [])

  return (
    <div className="space-y-6">
      <header className={`flex items-end justify-between gap-4 ${isUrdu ? 'urdu' : ''}`}>
        <div>
          <div className="eyebrow mb-2">01 · Inquiry</div>
          <h1 className="text-[42px] font-medium tracking-tightest text-cream-100">
            {isUrdu ? 'اپنا قانونی مسئلہ بیان کیجیے' : 'Ask a legal question'}
          </h1>
          <p className="reader text-[14.5px] text-cream-300 mt-2 max-w-2xl">
            {isUrdu
              ? 'اردو یا انگریزی میں لکھیے یا بولیے۔ پاکستانی قانون کی متعلقہ دفعات تلاش کر کے واضح جواب اور لائحہ عمل ملے گا۔'
              : 'Smart Court retrieves the relevant Pakistani statutes and gives a clear opinion grounded in law, with citations and a step by step action plan.'}
          </p>
        </div>
      </header>
      <ChatInterface/>
    </div>
  )
}
