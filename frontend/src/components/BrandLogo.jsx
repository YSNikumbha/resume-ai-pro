import { Link } from 'react-router-dom'

function BrandLogo({ to = '/', className = '' }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-3 text-slate-950 ${className}`}
      aria-label="ResumeAI Pro home"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-900/20">
        R
      </span>
      <span className="text-lg font-semibold">ResumeAI Pro</span>
    </Link>
  )
}

export default BrandLogo
