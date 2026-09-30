export default function TypingDots({ label }) {
  return (
    <div className="inline-flex items-center gap-2 text-slate-400 text-xs">
      <span className="dot"/><span className="dot"/><span className="dot"/>
      {label && <span className="ml-1">{label}</span>}
    </div>
  )
}
