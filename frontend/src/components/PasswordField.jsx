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
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <button
          type="button"
          onClick={onToggleVisibility}
          className="text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
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
        className={`h-12 w-full rounded-lg border bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 ${
          error ? 'border-red-300' : 'border-slate-200'
        }`}
      />
      {error ? (
        <p id={describedBy} className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default PasswordField
