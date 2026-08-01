export function getJobMatchScoreMeta(score) {
  if (!Number.isFinite(score)) {
    return {
      label: 'Pending',
      color: '#64748b',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
    }
  }

  if (score < 40) {
    return {
      label: 'Low match',
      color: '#dc2626',
      bg: 'bg-red-50',
      text: 'text-red-700',
    }
  }

  if (score < 60) {
    return {
      label: 'Partial match',
      color: '#ca8a04',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
    }
  }

  if (score < 75) {
    return {
      label: 'Good match',
      color: '#2563eb',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    }
  }

  if (score < 90) {
    return {
      label: 'Strong match',
      color: '#059669',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
    }
  }

  return {
    label: 'Excellent match',
    color: '#0f766e',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
  }
}

export function getSectionStatusClasses(status) {
  if (status === 'STRONG') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (status === 'PARTIAL') {
    return 'bg-blue-50 text-blue-700'
  }

  if (status === 'WEAK') {
    return 'bg-amber-50 text-amber-700'
  }

  return 'bg-slate-100 text-slate-700'
}
