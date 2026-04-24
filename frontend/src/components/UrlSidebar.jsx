import { Plus, Trash2, Globe, Clock, ChevronRight, X } from 'lucide-react'

function UrlItem({ url, onRemove }) {
  let host = url
  try { host = new URL(url).hostname.replace(/^www\./, '') } catch {}
  return (
    <div className="group flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 hover-glow transition-all">
      <div className="flex items-center gap-2 min-w-0">
        <Globe className="h-3.5 w-3.5 text-cyber-cyan shrink-0" />
        <span className="truncate text-xs text-slate-300 font-mono">{host}</span>
      </div>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-cyber-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function SessionItem({ session, onClick, onDelete }) {
  const domains = (session.urls || []).map((u) => {
    try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u }
  })
  return (
    <div className="group relative rounded-xl border border-white/5 bg-white/[0.03] hover-glow transition-all">
      <button
        onClick={onClick}
        className="w-full text-left px-3 py-3 pr-8"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white truncate flex-1">{session.title || 'Knowledge base'}</span>
          <ChevronRight className="h-3.5 w-3.5 text-cyber-muted group-hover:text-cyber-cyan transition-colors shrink-0 mr-5" />
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-cyber-muted">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {domains.slice(0, 2).join(' · ')}{domains.length > 2 ? ` +${domains.length - 2}` : ''}
          </span>
        </div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(session.session_id) }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 rounded-lg p-1 text-cyber-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
        title="Delete session"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function UrlSidebar({
  urls, input, onInputChange, onAddUrl, onRemoveUrl,
  onProcess, onReset, processing, sessions, onLoadSession,
  onDeleteSession, onClearSessions, error,
}) {
  return (
    <aside className="w-full max-w-[320px] shrink-0">
      <div className="sticky top-4 space-y-3">

        {/* Brand + URL controls */}
        <div className="glass rounded-2xl px-5 py-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-cyber flex items-center justify-center shadow-glow-sm shrink-0">
              <span className="text-base font-bold text-white">⬡</span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-white text-[15px] leading-tight">Web Intelligence</h1>
              <p className="text-[10px] text-cyber-muted tracking-wide">AI Website Analyst</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-cyber-muted">Add URL</label>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAddUrl()}
                placeholder="https://example.com"
                className="input-cyber flex-1 rounded-xl px-3 py-2.5 text-sm font-mono"
              />
              <button
                onClick={onAddUrl}
                className="rounded-xl px-3 bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/20 hover:shadow-glow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
            )}

            <div className="space-y-1.5">
              {urls.length === 0 ? (
                <p className="text-xs text-cyber-muted text-center py-3">No URLs added yet</p>
              ) : (
                urls.map((url, idx) => (
                  <UrlItem key={`${url}-${idx}`} url={url} onRemove={() => onRemoveUrl(idx)} />
                ))
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={onProcess}
                disabled={!urls.length || processing}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold font-heading bg-gradient-cyber text-[#030B18] shadow-glow-sm hover:shadow-glow-cyan disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {processing ? 'Processing…' : 'Analyze'}
              </button>
              <button
                onClick={onReset}
                className="rounded-xl px-4 py-2.5 text-sm font-medium glass text-cyber-muted hover:text-white hover:border-white/20 transition-all"
              >
                Reset
              </button>
            </div>
            <p className="text-[10px] text-cyber-muted text-center">Max 10 URLs · Embeddings cached locally</p>
          </div>
        </div>

        {/* Saved sessions */}
        {sessions.length > 0 && (
          <div className="glass rounded-2xl px-4 py-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-cyber-muted">Recent Sessions</p>
              <button
                onClick={onClearSessions}
                className="text-[10px] text-cyber-muted hover:text-red-400 transition-colors px-2 py-0.5 rounded-lg hover:bg-red-500/10"
              >
                Clear all
              </button>
            </div>
            {sessions.slice(0, 5).map((s) => (
              <SessionItem
                key={s.session_id}
                session={s}
                onClick={() => onLoadSession(s)}
                onDelete={onDeleteSession}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
