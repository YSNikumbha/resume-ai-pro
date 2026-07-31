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
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
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

export default FormInput
