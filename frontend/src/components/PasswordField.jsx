function PasswordField({
  autoComplete,
  error,
  id,
  label,
  onChange,
  onToggleVisibility,
  placeholder,
  showPassword,
  value,
}) {
  const describedBy = error ? `${id}-error` : undefined

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label htmlFor={id} className="ai-label mb-0">
          {label}
        </label>
        <button
          type="button"
          onClick={onToggleVisibility}
          className="rounded-full border border-slate-700/70 px-3 py-1 text-xs font-bold text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
      <input
        id={id}
        name={id}
        type={showPassword ? 'text' : 'password'}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        onChange={onChange}
        className={`ai-input ${
          error ? '!border-red-400/70 !shadow-[0_0_0_4px_rgba(239,68,68,0.12)]' : ''
        }`}
      />
      {error ? (
        <p id={describedBy} className="mt-2 text-sm font-semibold text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default PasswordField
