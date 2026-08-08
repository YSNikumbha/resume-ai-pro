export function getJobMatchScoreMeta(score) {
  if (!Number.isFinite(score)) {
    return {
      label: 'Pending',
      color: '#64748b',
      bg: 'border border-slate-500/20 bg-slate-500/10',
      text: 'text-slate-300',
    }
  }

  if (score < 40) {
    return {
      label: 'Low match',
      color: '#ef4444',
      bg: 'border border-red-400/30 bg-red-500/10',
      text: 'text-red-200',
    }
  }

  if (score < 60) {
    return {
      label: 'Partial match',
      color: '#f59e0b',
      bg: 'border border-amber-400/30 bg-amber-500/10',
      text: 'text-amber-200',
    }
  }

  if (score < 75) {
    return {
      label: 'Good match',
      color: '#22d3ee',
      bg: 'border border-cyan-300/30 bg-cyan-300/10',
      text: 'text-cyan-100',
    }
  }

  if (score < 90) {
    return {
      label: 'Strong match',
      color: '#22c55e',
      bg: 'border border-emerald-400/30 bg-emerald-500/10',
      text: 'text-emerald-100',
    }
  }

  return {
    label: 'Excellent match',
    color: '#22c55e',
    bg: 'border border-emerald-400/30 bg-emerald-500/10',
    text: 'text-emerald-100',
  }
}

export function getSectionStatusClasses(status) {
  if (status === 'STRONG') {
    return 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
  }

  if (status === 'PARTIAL') {
    return 'border border-cyan-300/30 bg-cyan-300/10 text-cyan-100'
  }

  if (status === 'WEAK') {
    return 'border border-amber-400/30 bg-amber-500/10 text-amber-200'
  }

  return 'border border-slate-500/20 bg-slate-500/10 text-slate-300'
}
