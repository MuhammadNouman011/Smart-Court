import CourtroomMode from '../components/CourtroomMode.jsx'
import { useLanguage } from '../hooks/useLanguage.jsx'

export default function Courtroom() {
  const { isUrdu } = useLanguage()
  return (
    <div className={`space-y-6 ${isUrdu ? 'urdu' : ''}`}>
      <header>
        <div className="eyebrow mb-2">04 · Courtroom</div>
        <h1 className="text-[42px] font-medium tracking-tightest text-cream-100">
          {isUrdu ? 'مشقی کمرہ عدالت' : 'Rehearse before an AI judge'}
        </h1>
        <p className="reader text-[14.5px] text-cream-300 mt-2 max-w-2xl">
          {isUrdu
            ? 'حقیقی عدالت میں جانے سے پہلے اپنا مقدمہ اے آئی جج کے سامنے آزمائیں۔'
            : 'Before stepping into a real court, present your case to an AI Pakistani judge. End with a written verdict, strengths, weaknesses, and feedback.'}
        </p>
      </header>
      <CourtroomMode/>
    </div>
  )
}
