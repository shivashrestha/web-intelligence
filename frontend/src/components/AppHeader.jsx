import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Globe, Clock, ChevronDown, ChevronRight, Trash2, Search, Loader2, Sparkles, SmilePlus} from 'lucide-react'
import logo from '../../logo.png'

function SessionRow({ session, onClick, onDelete }) {
  const domain = (session.urls || []).map((u) => {
    try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u }
  })[0] || 'session'

  const favicon = session.theme?.favicon
  const accent = session.theme?.accent

  return (
    <motion.div
      className="group flex items-center rounded-xl border border-white/5 bg-white/[0.03]"
      whileHover={{ scale: 1.015, backgroundColor: 'rgba(255,255,255,0.055)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
    >
      <button onClick={onClick} className="flex-1 text-left px-3 py-2.5 min-w-0">
        <div className="flex items-center gap-2">
          {favicon ? (
            <img src={favicon} alt="" className="h-4 w-4 rounded shrink-0" onError={(e) => e.target.style.display = 'none'} />
          ) : (
            <div
              className="h-4 w-4 rounded shrink-0 flex items-center justify-center"
              style={{ backgroundColor: accent ? `${accent}22` : 'rgba(0,212,255,0.1)', border: `1px solid ${accent || '#00D4FF'}33` }}
            >
              <Globe className="h-2.5 w-2.5" style={{ color: accent || '#00D4FF' }} />
            </div>
          )}
          <span className="text-sm font-medium text-white truncate">{session.title || domain}</span>
          <motion.div
            className="shrink-0 opacity-0 group-hover:opacity-100"
            initial={false}
            animate={{ x: 0 }}
            whileHover={{ x: 2 }}
          >
            <ChevronRight className="h-3.5 w-3.5 text-cyber-cyan" />
          </motion.div>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-cyber-muted pl-6">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="truncate">{domain}</span>
        </div>
      </button>
      <motion.button
        onClick={(e) => { e.stopPropagation(); onDelete(session.session_id) }}
        className="mr-2 opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-cyber-muted hover:text-red-400 hover:bg-red-500/10"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Delete session"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </motion.button>
    </motion.div>
  )
}

export default function AppHeader({
  url, onUrlChange, onProcess, processing,
  sessions, onLoadSession, onDeleteSession, onClearSessions,
  error, siteTheme, onCollaborateClick, onReset,
}) {
  const [sessionsOpen, setSessionsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!sessionsOpen) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSessionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sessionsOpen])

  const accent = siteTheme?.accent || null
  const accentStyle = accent ? { '--btn-accent': accent } : {}

  function handleSubmit(e) {
    e.preventDefault()
    onProcess()
  }

  return (
    <header className="shrink-0 z-40 relative">
      <div className="glass border-b border-white/8">
        <div className="flex items-center gap-3 px-5 h-[78px]">

          {/* Brand */}
          <button
            onClick={onReset}
            className="flex items-center gap-2.5 shrink-0 rounded-xl px-1 py-1 hover:opacity-80 transition-opacity"
          >
            <img src={logo} alt="Web Intelligence" className="h-20 w-20 object-contain shrink-0" />
            <div className="hidden lg:block text-left">
              <h1 className="font-heading font-bold text-white text-[14px] leading-tight">Web Intelligence</h1>
              <p className="text-[10px] text-slate-500">Website analyst</p>
            </div>
          </button>

          <div className="h-5 w-px bg-white/8 shrink-0" />

          {/* Centered URL form — grows to fill available space */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex items-center gap-2 max-w-2xl mx-auto"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <input
                ref={inputRef}
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="Enter a website URL to analyze…"
                disabled={processing}
                className="input-url w-full rounded-xl pl-10 pr-4 py-3 text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!url.trim() || processing}
              className="analyze-btn shrink-0 rounded-xl px-5 py-3 text-sm font-semibold font-heading flex items-center gap-2 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={accentStyle}
            >
              {processing
                ? <><Loader2 className="h-4 w-4 animate-spin" /><span className="hidden sm:inline">Analyzing…</span></>
                : <><span>Analyze</span></>
              }
            </button>
          </form>

          {/* Collaborate button — icon-only on mobile, full on sm+ */}
          <motion.button
            onClick={onCollaborateClick}
            className="shrink-0 flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-[13px] font-heading font-semibold text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,255,0.18) 0%, rgba(139,92,246,0.22) 100%)',
              border: '1px solid rgba(139,92,246,0.4)',
              boxShadow: '0 0 14px rgba(139,92,246,0.18), 0 0 28px rgba(0,212,255,0.08)',
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 22px rgba(139,92,246,0.35), 0 0 40px rgba(0,212,255,0.15)',
              borderColor: 'rgba(139,92,246,0.65)',
            }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'flex' }}
            >
              <SmilePlus className="h-3.5 w-3.5" style={{ color: '#00D4FF' }} />
            </motion.span>
            <span
              className="hidden sm:inline"
              style={{
                background: 'linear-gradient(90deg, #00D4FF, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >Collaborate</span>
          </motion.button>

          {/* Sessions dropdown */}
          {sessions.length > 0 && (
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setSessionsOpen((v) => !v)}
                className={[
                  'flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm glass transition-all',
                  sessionsOpen ? 'text-cyber-cyan border-cyber-cyan/30' : 'text-cyber-muted hover:text-white',
                ].join(' ')}
              >
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs font-medium hidden sm:inline">{sessions.length}</span>
                <ChevronDown className={['h-3 w-3 transition-transform duration-200', sessionsOpen ? 'rotate-180' : ''].join(' ')} />
              </button>

              {sessionsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] glass-elevated rounded-2xl shadow-elevated animate-fade-in overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-cyber-muted">Recent Sessions</p>
                    <button
                      onClick={() => { onClearSessions(); setSessionsOpen(false) }}
                      className="text-[10px] text-cyber-muted hover:text-red-400 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                    {sessions.slice(0, 8).map((s) => (
                      <SessionRow
                        key={s.session_id}
                        session={s}
                        onClick={() => { onLoadSession(s); setSessionsOpen(false) }}
                        onDelete={(sid) => {
                          onDeleteSession(sid)
                          if (sessions.length <= 1) setSessionsOpen(false)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error bar */}
        {error && (
          <div className="border-t border-red-500/20 bg-red-500/5 px-4 py-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}
      </div>
    </header>
  )
}
