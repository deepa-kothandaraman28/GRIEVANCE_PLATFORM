const STATUS_STYLES = {
  Submitted: 'bg-ink/10 text-ink',
  'Under Review': 'bg-seal/15 text-seal',
  Assigned: 'bg-teal/15 text-teal',
  'In Progress': 'bg-teal/25 text-teal-dark',
  Resolved: 'bg-emerald-100 text-emerald-700',
  Closed: 'bg-ink/80 text-paper',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        STATUS_STYLES[status] || 'bg-ink/10 text-ink'
      }`}
    >
      {status}
    </span>
  )
}
