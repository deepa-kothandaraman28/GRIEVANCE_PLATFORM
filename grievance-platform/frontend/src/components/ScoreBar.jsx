const SEGMENTS = [
  { key: 'performance_component', label: 'Performance (40%)', color: 'bg-teal' },
  { key: 'feedback_component', label: 'Citizen feedback (25%)', color: 'bg-seal' },
  { key: 'proximity_component', label: 'Proximity (20%)', color: 'bg-ink-light' },
  { key: 'workload_component', label: 'Availability (15%)', color: 'bg-amber-300' },
]

export default function ScoreBar({ scores }) {
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink/5">
        {SEGMENTS.map((seg) => (
          <div
            key={seg.key}
            className={seg.color}
            style={{ width: `${scores[seg.key]}%` }}
            title={`${seg.label}: ${scores[seg.key].toFixed(1)}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink/60">
        {SEGMENTS.map((seg) => (
          <span key={seg.key} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${seg.color}`} />
            {seg.label}: {scores[seg.key].toFixed(1)}
          </span>
        ))}
      </div>
    </div>
  )
}
