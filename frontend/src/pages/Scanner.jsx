import ContractScanner from '../components/ContractScanner.jsx'
import { useLanguage } from '../hooks/useLanguage.jsx'

export default function Scanner() {
  const { isUrdu } = useLanguage()
  return (
    <div className="space-y-6">
      <header className={isUrdu ? 'urdu' : ''}>
        <div className="eyebrow mb-2">02 · Scanner</div>
        <h1 className="text-[42px] font-medium tracking-tightest text-cream-100">
          {isUrdu ? 'معاہدے میں خطرے کی شقیں' : 'Find unfair contract clauses'}
        </h1>
        <p className="reader text-[14.5px] text-cream-300 mt-2 max-w-2xl">
          {isUrdu
            ? 'اپنا کرایہ نامہ، ملازمت کا معاہدہ، یا کوئی بھی پی ڈی ایف اپ لوڈ کریں۔'
            : 'Upload any PDF contract. Smart Court highlights every red flag with the specific Pakistani statute it bumps against.'}
        </p>
      </header>
      <ContractScanner/>
    </div>
  )
}
