export function getScoreMeta(score) {
  if (!Number.isFinite(score)) {
    return {
      label: 'Pending',
      color: '#64748b',
      bg: 'border border-slate-500/20 bg-slate-500/10',
      text: 'text-slate-300',
    }
  }

  if (score < 50) {
    return {
      label: 'Needs improvement',
      color: '#ef4444',
      bg: 'border border-red-400/30 bg-red-500/10',
      text: 'text-red-200',
    }
  }

  if (score < 70) {
    return {
      label: 'Fair',
      color: '#f59e0b',
      bg: 'border border-amber-400/30 bg-amber-500/10',
      text: 'text-amber-200',
    }
  }

  if (score < 85) {
    return {
      label: 'Good',
      color: '#22d3ee',
      bg: 'border border-cyan-300/30 bg-cyan-300/10',
      text: 'text-cyan-100',
    }
  }

  return {
    label: 'Excellent',
    color: '#22c55e',
    bg: 'border border-emerald-400/30 bg-emerald-500/10',
    text: 'text-emerald-100',
  }
}

export function getStatusClasses(status) {
  if (status === 'COMPLETED') {
    return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
  }

  if (status === 'FAILED') {
    return 'border-red-400/30 bg-red-500/10 text-red-200'
  }

  return 'border-amber-400/30 bg-amber-500/10 text-amber-200'
}
