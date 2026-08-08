const styles = {
  error: 'border-red-400/30 bg-red-500/10 text-red-200',
  info: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
}

function StatusMessage({ children, type = 'error' }) {
  if (!children) {
    return null
  }

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${styles[type]}`}>
      {children}
    </div>
  )
}

export default StatusMessage
