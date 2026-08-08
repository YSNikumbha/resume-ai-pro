import { Link } from 'react-router-dom'

function BrandLogo({ to = '/', className = '' }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-3 text-white ${className}`}
      aria-label="ResumeAI Pro home"
    >
      <span className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 text-sm font-black text-white shadow-lg shadow-indigo-950/40">
        AI
      </span>
      <span className="text-lg font-black tracking-normal">ResumeAI Pro</span>
    </Link>
  )
}

export default BrandLogo
