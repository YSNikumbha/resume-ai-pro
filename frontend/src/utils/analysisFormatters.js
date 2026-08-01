export function getScoreMeta(score) {
  if (!Number.isFinite(score)) {
    return {
      label: 'Pending',
      color: '#64748b',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
    }
  }

  if (score < 50) {
    return {
      label: 'Needs improvement',
      color: '#dc2626',
      bg: 'bg-red-50',
      text: 'text-red-700',
    }
  }

  if (score < 70) {
    return {
      label: 'Fair',
      color: '#ca8a04',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
    }
  }

  if (score < 85) {
    return {
      label: 'Good',
      color: '#2563eb',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    }
  }

  return {
    label: 'Excellent',
    color: '#059669',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  }
}

export function getStatusClasses(status) {
  if (status === 'COMPLETED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'FAILED') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  return 'border-amber-200 bg-amber-50 text-amber-700'
}
