const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-7 w-7 border-2',
  lg: 'h-11 w-11 border-[3px]',
}

function LoadingSpinner({ fullScreen = false, label = 'Loading', size = 'md' }) {
  const spinner = (
    <span className="inline-flex items-center justify-center gap-3" role="status">
      <span
        aria-hidden="true"
        className={`${sizes[size]} animate-spin rounded-full border-slate-700 border-t-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.22)]`}
      />
      {label ? (
        <span className="text-sm font-semibold text-slate-300">{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </span>
  )

  if (fullScreen) {
    return (
      <div className="ai-page grid min-h-screen place-items-center px-6">
        <div className="glass-card px-6 py-5">{spinner}</div>
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner
