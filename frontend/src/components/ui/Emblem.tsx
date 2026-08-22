function spoke(i: number) {
  const a = (i * Math.PI * 2) / 24
  const n = (v: number) => v.toFixed(2)
  return {
    x1: n(32 + Math.cos(a) * 9.5),
    y1: n(34 + Math.sin(a) * 9.5),
    x2: n(32 + Math.cos(a) * 12.2),
    y2: n(34 + Math.sin(a) * 12.2),
  }
}

const SPOKES = Array.from({ length: 24 }, (_, i) => spoke(i))

export function Emblem({ className = 'h-11 w-11' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#1B2A4A" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="#E8A33D" strokeWidth="1.5" />
      <circle cx="32" cy="34" r="8" fill="none" stroke="#F7F8FA" strokeWidth="1.4" />
      {SPOKES.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#F7F8FA" strokeWidth="1" />
      ))}
      <path d="M18 24c4-7 10-10 14-10s10 3 14 10" fill="none" stroke="#F7F8FA" strokeWidth="1.6" />
      <path d="M20 22c3 2 7 3 12 3s9-1 12-3" fill="none" stroke="#E8A33D" strokeWidth="1.2" />
      <text x="32" y="54" textAnchor="middle" fill="#E8A33D" fontSize="5.2" fontFamily="serif">
        सत्यमेव जयते
      </text>
    </svg>
  )
}
