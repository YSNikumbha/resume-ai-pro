function FormInput({
  autoComplete,
  error,
  id,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}) {
  const describedBy = error ? `${id}-error` : undefined

  return (
    <div>
      <label htmlFor={id} className="ai-label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
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

export default FormInput
