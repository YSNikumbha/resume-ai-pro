const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-7 w-7 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

function LoadingSpinner({ fullScreen = false, label = 'Loading', size = 'md' }) {
  const spinner = (
    <span className="inline-flex items-center justify-center gap-3" role="status">
      <span
        aria-hidden="true"
        className={`${sizes[size]} animate-spin rounded-full border-blue-200 border-t-blue-600`}
      />
      {label ? (
        <span className="text-sm font-medium text-slate-600">{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </span>
  )

  if (fullScreen) {
    return (
      <div className="grid min-h-screen place-items-center bg-blue-50 px-6">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner
