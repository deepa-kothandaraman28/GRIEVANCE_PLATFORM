export default function StatusTimeline({ history }) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-ink/50">No status updates yet.</p>
  }

  return (
    <ol className="relative border-l-2 border-ink/10 pl-6">
      {history.map((entry, idx) => (
        <li key={entry.id} className="mb-8 last:mb-0">
          <span
            className={`absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 border-paper ${
              idx === history.length - 1 ? 'bg-seal' : 'bg-teal'
            }`}
          />
          <div className="flex flex-wrap items-baseline gap-2">
            <h4 className="font-semibold text-ink">{entry.status}</h4>
            <time className="text-xs text-ink/50">
              {new Date(entry.created_at).toLocaleString()}
            </time>
          </div>
          {entry.remarks && <p className="mt-1 text-sm text-ink/70">{entry.remarks}</p>}
          {entry.proof_path && (
            <a
              href={`/uploads/${entry.proof_path}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm text-teal underline underline-offset-2"
            >
              View attached proof
            </a>
          )}
        </li>
      ))}
    </ol>
  )
}
