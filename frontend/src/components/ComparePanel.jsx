import { ArrowLeftRight, ExternalLink, Info } from 'lucide-react'

function CompareCard({ item }) {
  let host = item.url
  try { host = new URL(item.url).hostname.replace(/^www\./, '') } catch {}
  return (
    <div className="glass rounded-2xl p-5 space-y-4 hover-glow transition-all">
      <div>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-cyber-cyan hover:text-white transition-colors"
        >
          {item.title || host}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <p className="text-[10px] font-mono text-cyber-muted mt-0.5">{host}</p>
      </div>

      {item.summary && (
        <p className="text-sm text-slate-300 leading-7">{item.summary}</p>
      )}

      {item.features?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-cyber-muted">Sections</p>
          <div className="flex flex-wrap gap-1.5">
            {item.features.slice(0, 6).map((f, i) => (
              <span
                key={i}
                className="rounded-full px-2.5 py-1 text-[10px] border border-cyber-purple/20 bg-cyber-purple/5 text-cyber-purple"
              >
                {typeof f === 'string' ? f : f.title || ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ComparePanel({ compare }) {
  if (!compare?.items?.length) {
    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
        <ArrowLeftRight className="h-8 w-8 text-cyber-cyan/40" />
        <p className="text-cyber-muted text-sm">Add multiple URLs and process them to enable comparison.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="h-4 w-4 text-cyber-cyan" />
        <h3 className="font-heading font-semibold text-white text-sm">
          Comparing {compare.items.length} websites
        </h3>
      </div>

      {compare.note && (
        <div className="flex items-start gap-2 rounded-xl border border-cyber-cyan/15 bg-cyber-cyan/5 px-4 py-3">
          <Info className="h-4 w-4 text-cyber-cyan shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">{compare.note}</p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {compare.items.map((item) => (
          <CompareCard key={item.url} item={item} />
        ))}
      </div>
    </div>
  )
}
