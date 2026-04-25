import { useState } from 'react'
import { ExternalLink, FileText, Hash, Info } from 'lucide-react'

function SourceCard({ source }) {
  let host = source.url
  try { host = new URL(source.url).hostname.replace(/^www\./, '') } catch {}
  const href = source.anchor_url || source.url
  return (
    <div className="glass rounded-2xl p-4 space-y-3 hover-glow transition-all animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-cyber-cyan hover:text-white transition-colors group"
          >
            <span className="truncate">{source.title || host}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
          <p className="text-[10px] font-mono text-cyber-muted truncate mt-0.5">{host}</p>
        </div>
        {source.section_title && source.section_title !== source.title && (
          <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold border border-cyber-cyan/25 bg-cyber-cyan/8 text-cyber-cyan">
            {source.section_title}
          </span>
        )}
      </div>

      {source.text && (
        <p className="text-xs text-slate-400 leading-6 line-clamp-3 border-t border-white/5 pt-3">
          {source.text}
        </p>
      )}
    </div>
  )
}

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-cyber-muted hover:text-cyber-cyan transition-colors"
        aria-label="More info"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {show && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
          style={{ width: 240 }}
        >
          <div
            className="rounded-xl px-3 py-2 text-[11px] text-slate-300 leading-5"
            style={{
              background: 'rgba(10,22,40,0.97)',
              border: '1px solid rgba(0,212,255,0.22)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {text}
          </div>
          <div
            className="mx-auto"
            style={{
              width: 0, height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid rgba(0,212,255,0.22)',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function SourcesPanel({ sources }) {
  if (!sources?.length) {
    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
        <FileText className="h-8 w-8 text-cyber-cyan/40" />
        <p className="text-cyber-muted text-sm">No sources available. Process a URL first.</p>
      </div>
    )
  }

  // Group by URL
  const byUrl = {}
  for (const s of sources) {
    if (!byUrl[s.url]) byUrl[s.url] = []
    byUrl[s.url].push(s)
  }

  const sourceCount = Object.keys(byUrl).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Hash className="h-4 w-4 text-cyber-cyan" />
        <p className="text-sm font-heading font-semibold text-white">
          {sources.length} extracted chunks from {sourceCount} source{sourceCount !== 1 ? 's' : ''}
        </p>
        <InfoTooltip text="Only main content sections are extracted. Navigation, footers, ads, and script content are excluded to focus on meaningful page content." />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sources.map((source, idx) => (
          <SourceCard key={`${source.url}-${idx}`} source={source} />
        ))}
      </div>
    </div>
  )
}
