import DocumentDrafter from '../components/DocumentDrafter.jsx'
import { useLanguage } from '../hooks/useLanguage.jsx'

export default function Drafter() {
  const { isUrdu } = useLanguage()
  return (
    <div className="space-y-6">
      <header className={isUrdu ? 'urdu' : ''}>
        <div className="eyebrow mb-2">03 · Drafter</div>
        <h1 className="text-[42px] font-medium tracking-tightest text-cream-100">
          {isUrdu ? 'دستاویزات لمحوں میں' : 'Court-ready documents'}
        </h1>
        <p className="reader text-[14.5px] text-cream-300 mt-2 max-w-2xl">
          {isUrdu
            ? 'صرف چند تفصیلات لکھیں۔ ایف آئی آر، قانونی نوٹس، حلف نامہ یا شکایتی خط مکمل تیار ہو جائے گا۔'
            : 'Fill a short form. Smart Court drafts a complete FIR application, legal notice, affidavit or complaint letter in formal register, ready to print.'}
        </p>
      </header>
      <DocumentDrafter/>
    </div>
  )
}
