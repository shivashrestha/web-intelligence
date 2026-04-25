import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, SmilePlus, Globe, BarChart3, FileText, Image, RotateCcw, Palette, MessageSquare, Info, Zap, ArrowRight } from 'lucide-react'
import logo from '../logo.png'
import { useSEO } from './hooks/useSEO'

import AppHeader from './components/AppHeader'
import Loader from './components/Loader'
import ErrorModal from './components/ErrorModal'
import FeatureBadges from './components/FeatureBadges'
import ChatPanel from './components/ChatPanel'
import InsightPanel from './components/InsightPanel'
import SourcesPanel from './components/SourcesPanel'
import MediaPanel from './components/MediaPanel'
import Footer from './components/Footer'
import PrivacyModal from './components/PrivacyModal'
import CookiesModal, { getCookieConsent, setCookieConsent } from './components/CookiesModal'
import ChatWidget from './components/ChatWidget'
import CollaborateModal from './components/CollaborateModal'

import {
  askQuestion, loadInsights, loadMedia,
  loadSessions, loadSources, processUrls,
  deleteSession, clearAllSessions, loadExampleQueries,
} from './services/api'
import {
  loadLocalSessions, saveLocalSession, removeLocalSession, clearLocalSessions,
  loadCachedArtifacts, saveCachedArtifacts, removeCachedArtifacts, clearAllCachedArtifacts,
} from './services/storage'

const TABS = [
  { id: 'insights', label: 'Insights', Icon: BarChart3 },
  { id: 'qa',       label: 'Q&A',      Icon: MessageSquare },
  { id: 'media',    label: 'Media',    Icon: Image },
  { id: 'sources',  label: 'Sources',  Icon: FileText },
]


function PageCountInfo() {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-flex items-center ml-1">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-cyber-muted hover:text-cyber-cyan transition-colors"
        aria-label="Page count info"
      >
        <Info className="h-3 w-3" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none" style={{ width: 230 }}>
          <div
            className="rounded-xl px-3 py-2 text-[11px] text-slate-300 leading-5"
            style={{
              background: 'rgba(10,22,40,0.97)',
              border: '1px solid rgba(0,212,255,0.22)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            Only main content is extracted. Ads, navigation, footers, and scripts are excluded for quality.
          </div>
          <div className="mx-auto" style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgba(0,212,255,0.22)' }} />
        </div>
      )}
    </div>
  )
}

function SessionBar({ title, sessionId, pageCount, siteTheme, onReset, themeEnabled, onThemeToggle }) {
  const accent = siteTheme?.accent
  const favicon = siteTheme?.favicon
  const hasTheme = !!(siteTheme?.accent || siteTheme?.og_image || siteTheme?.palette?.length)

  return (
    <div className="shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between border-b border-white/6 bg-cyber-surface/60 animate-fade-in">
      <div className="flex items-center gap-3 min-w-0">
        {favicon && (
          <img src={favicon} alt="" className="h-5 w-5 rounded shrink-0" onError={(e) => e.target.style.display = 'none'} />
        )}
        <div className="min-w-0">
          <h2 className="font-heading font-bold text-white text-[15px] truncate leading-tight">{title}</h2>
          <p className="text-[10px] text-cyber-muted mt-0.5">Session · {sessionId.slice(0, 8)}…</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-4">
        {pageCount > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] border"
            style={{
              color: accent || '#00D4FF',
              borderColor: `${accent || '#00D4FF'}33`,
              backgroundColor: `${accent || '#00D4FF'}0d`,
            }}
          >
            {pageCount} page{pageCount !== 1 ? 's' : ''}
            <PageCountInfo />
          </span>
        )}

        <span className="hidden sm:inline-flex rounded-full px-3 py-1 text-[11px] border border-cyber-green/20 bg-cyber-green/5 text-cyber-green">
          Ready
        </span>

        {/* Theme toggle — only shown when extracted theme data exists */}
        {hasTheme && (
          <button
            onClick={onThemeToggle}
            title={themeEnabled ? 'Disable site theme' : 'Mimic site theme'}
            className={[
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] border transition-all duration-300',
              themeEnabled
                ? 'border-current bg-current/10 font-medium'
                : 'border-white/15 bg-white/[0.03] text-cyber-muted hover:text-white hover:border-white/30',
            ].join(' ')}
            style={themeEnabled && accent ? { color: accent, borderColor: `${accent}55`, backgroundColor: `${accent}15` } : undefined}
          >
            <Palette className="h-3 w-3" />
            <span className="hidden sm:inline">Theme</span>
          </button>
        )}

        {/* Reset button */}
        <button
          onClick={onReset}
          title="Reset/clear current session"
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium glass text-cyber-muted hover:text-white hover:border-white/20 transition-all"
        >
          <RotateCcw className="h-3 w-3" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  )
}

// ── Animated hero globe ───────────────────────────────────────────────────
function AnimatedGlobe() {
  return (
    <div className="relative flex items-center justify-center" >
      {/* Outer ambient pulse ring 1 */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 130, height: 130, border: '1px solid rgba(0,212,255,0.18)' }}
        animate={{ scale: [1, 1.7, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Outer ambient pulse ring 2 — offset phase */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 130, height: 130, border: '1px solid rgba(139,92,246,0.15)' }}
        animate={{ scale: [1, 2.0, 1], opacity: [0.35, 0, 0.35] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
      />

      {/* Orbit ring 1 — equatorial ellipse spinning */}
      <motion.div
        className="absolute"
        style={{ width: 120, height: 36, borderRadius: '50%', border: '1px solid rgba(0,212,255,0.22)' }}
        animate={{ rotateZ: [0, 360] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
      />
      {/* Orbit ring 2 — tilted, opposite direction */}
      <motion.div
        className="absolute"
        style={{ width: 115, height: 28, borderRadius: '50%', border: '1px solid rgba(139,92,246,0.18)', rotate: '45deg' }}
        animate={{ rotateZ: [0, -360] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'linear' }}
      />

      {/* Orbiting dot on ring 1 */}
      <motion.div
        className="absolute"
        style={{ width: 120, height: 36 }}
        animate={{ rotateZ: [0, 360] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
      >
        <div style={{
          position: 'absolute', top: -3, left: '50%',
          width: 6, height: 6, borderRadius: '50%',
          background: '#00D4FF', boxShadow: '0 0 6px #00D4FF',
          transform: 'translateX(-50%)',
        }} />
      </motion.div>

      {/* Floating globe icon */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ zIndex: 1 }}
      >
        {/* Outer glow layer */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.3) 0%, rgba(139,92,246,0.3) 100%)',
            filter: 'blur(14px)',
            transform: 'scale(1.2)',
          }}
        />
        {/* Icon box */}
        <div
          className="relative h-20 w-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%)', boxShadow: '0 0 20px rgba(0,212,255,0.35), 0 0 60px rgba(0,212,255,0.1)' }}
        >
          {/* Slow spinning globe icon — z-axis rotation = earth spinning on its axis */}
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          >
            <img src={logo} alt="Web Intelligence" className="h-15 w-15 object-contain" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

// ── RAG flow preview shown on query card hover ────────────────────────────
function RAGFlowPreview({ query }) {
  const label = query.length > 26 ? query.slice(0, 24) + '…' : query
  return (
    <div className="w-full h-full flex flex-col gap-2 p-3 justify-center">
      {/* Query */}
      <motion.div
        className="rounded-lg px-2.5 py-1.5 text-[9px] font-mono"
        style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.22)', color: '#00D4FF' }}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05, duration: 0.3, repeat: Infinity, repeatDelay: 3.5 }}
      >
        ❯ {label}
      </motion.div>

      {/* Searching label */}
      <motion.div
        className="flex items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.25, repeat: Infinity, repeatDelay: 3.5 }}
      >
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="text-[8px] text-cyber-muted tracking-wide">searching pages</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </motion.div>

      {/* Matched page cards */}
      <div className="flex gap-1">
        {[{ w: '91%' }, { w: '78%' }, { w: '63%' }].map((c, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded px-1.5 py-1"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.22)' }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 + i * 0.15, duration: 0.3, repeat: Infinity, repeatDelay: 3.5 }}
          >
            <div className="text-[7px] text-cyber-purple/60 mb-0.5">result {i + 1}</div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-cyber-purple/50"
                initial={{ width: 0 }}
                animate={{ width: c.w }}
                transition={{ delay: 0.7 + i * 0.15, duration: 0.4, repeat: Infinity, repeatDelay: 3.5 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Answer stream */}
      <motion.div
        className="rounded-lg px-2.5 py-2"
        style={{ background: 'rgba(16,255,168,0.05)', border: '1px solid rgba(16,255,168,0.15)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.3, repeat: Infinity, repeatDelay: 3.5 }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[8px] text-cyber-green/80">Answer</span>
          <motion.span
            className="text-[9px] text-cyber-green"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: 1.2 }}
          >▌</motion.span>
        </div>
        {[{ w: '88%' }, { w: '72%' }, { w: '50%' }].map((l, i) => (
          <motion.div
            key={i}
            className="h-1 rounded-full bg-cyber-green/12 mb-1"
            initial={{ width: 0 }}
            animate={{ width: l.w }}
            transition={{ delay: 1.3 + i * 0.22, duration: 0.5, ease: 'easeOut', repeat: Infinity, repeatDelay: 3.5 }}
          />
        ))}
      </motion.div>
    </div>
  )
}

function QueryCard({ query, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.button
        onClick={onClick}
        className="glass rounded-xl px-4 py-4 text-left text-[15px] text-slate-300 hover:text-white transition-all flex items-start gap-3 w-full relative overflow-hidden"
        style={{ border: '1px solid rgba(0,212,255,0.1)' }}
        whileHover={{ scale: 1.025, y: -2, borderColor: 'rgba(0,212,255,0.32)', boxShadow: '0 0 18px rgba(0,212,255,0.1), 0 6px 24px rgba(0,0,0,0.35)' }}
        whileTap={{ scale: 0.975 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      >
        {/* Shimmer sweep on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ x: '-110%' }}
              animate={{ x: '110%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeInOut' }}
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.09) 50%, transparent 100%)' }}
            />
          )}
        </AnimatePresence>

        <motion.div
          className="shrink-0 mt-0.5 relative z-10"
          animate={hovered
            ? { scale: 1.25, rotate: [0, -12, 12, 0] }
            : { scale: [1, 1.2, 1], opacity: [0.75, 1, 0.75] }
          }
          transition={hovered
            ? { duration: 0.35, ease: 'easeInOut' }
            : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <Zap className="h-4 w-4 text-cyber-cyan" />
        </motion.div>

        <span className="leading-6 relative z-10 font-medium flex-1">{query}</span>

        <motion.div
          className="shrink-0 self-center relative z-10 ml-1"
          animate={hovered ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <ArrowRight className="h-3.5 w-3.5 text-cyber-cyan" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="absolute bottom-full mb-2 right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 z-50 pointer-events-none"
            style={{ width: 'min(230px, calc(100vw - 2rem))' }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(8,18,36,0.98)',
                border: '1px solid rgba(0,212,255,0.22)',
                boxShadow: '0 0 40px rgba(0,212,255,0.1), 0 14px 44px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ height: 185, padding: '4px' }}>
                <RAGFlowPreview query={query} />
              </div>
            </div>
            <div className="mx-auto mt-0" style={{
              width: 0, height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(0,212,255,0.22)',
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SectionDivider({ label, color = 'rgba(0,212,255,0.2)', delay = 0 }) {
  return (
    <motion.div
      className="w-full flex items-center gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
    >
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
      {label && (
        <span className="text-[10px] font-semibold tracking-widest uppercase shrink-0" style={{ color }}>
          {label}
        </span>
      )}
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
    </motion.div>
  )
}

function LandingView({ exampleQueries, onQuerySelect }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center px-4 sm:px-8 py-6 animate-fade-in" style={{ gap: '1.75rem' }} >

      {/* ── Section 1 · Hero ─────────────────────────────────────── */}
      <div className="space-y-4" >
        <AnimatedGlobe />

        <motion.h2
          className="font-heading font-bold text-[1.8rem] sm:text-[2.4rem] md:text-[2.6rem] leading-[1.12] text-gradient"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
        >
          Website Analysis &amp; Intelligence
        </motion.h2>

        <motion.p
          className="text-slate-400 text-[0.9rem] leading-[1.85] text-center mx-auto" style={{ maxWidth: '40rem' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.22 }}
        >
          Enter a URL.{' '}
          <span style={{ color: '#00D4FF' }}>The AI crawls it</span>,{' '}
          <span style={{ color: '#8B5CF6' }}>extracts intelligence</span>, and{' '}
          <span style={{ color: '#10FFA8' }}>answers your questions</span>{' '}
          — with{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, #00D4FF, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 500,
            }}
          >source links on every reply</span>.
        </motion.p>
      </div>

      <SectionDivider label="capabilities" color="rgba(0,212,255,0.22)" delay={0.28} />

      {/* ── Section 2 · Feature cards ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.34 }}
      >
        <FeatureBadges />
      </motion.div>

      {/* ── Section 3 · Example queries ──────────────────────────── */}
      {exampleQueries.length > 0 && (
        <>
          <SectionDivider label="questions to get you started" color="rgba(139,92,246,0.3)" delay={0.42} />
          <motion.div
            className="w-full max-w-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.46 }}
            style={{maxWidth:'60rem'}}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {exampleQueries.slice(0, 3).map((q) => (
                <QueryCard key={q} query={q} onClick={() => onQuerySelect(q)} />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}

// ── Root app ──────────────────────────────────────────────────────────────
export default function App() {
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')

  const [sessionId, setSessionId] = useState('')
  const [sessionTitle, setSessionTitle] = useState('')
  const [pageCount, setPageCount] = useState(0)
  const [sessions, setSessions] = useState([])
  const [siteTheme, setSiteTheme] = useState(null)

  const [appState, setAppState] = useState('empty')
  const [processStep, setProcessStep] = useState(0)
  const [processError, setProcessError] = useState('')

  const [activeTab, setActiveTab] = useState('insights')
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [answerLoading, setAnswerLoading] = useState(false)
  const [insights, setInsights] = useState(null)
  const [sources, setSources] = useState([])
  const [media, setMedia] = useState(null)
  const [exampleQueries, setExampleQueries] = useState([])
  const [themeEnabled, setThemeEnabled] = useState(false)
  const [artifactsLoading, setArtifactsLoading] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showCookies, setShowCookies] = useState(false)
  const [showCollaborate, setShowCollaborate] = useState(false)

  const sessionReady = appState === 'ready' && !!sessionId

  useSEO({
    title: sessionReady && sessionTitle ? sessionTitle : null,
    image: siteTheme?.og_image || null,
  })

  // Apply site theme CSS variables only when toggle is ON
  useEffect(() => {
    const root = document.documentElement
    if (themeEnabled && siteTheme?.accent) {
      root.style.setProperty('--site-accent', siteTheme.accent)
      root.style.setProperty('--btn-accent', siteTheme.accent)
    } else {
      root.style.removeProperty('--site-accent')
      root.style.removeProperty('--btn-accent')
    }
    return () => {
      root.style.removeProperty('--site-accent')
      root.style.removeProperty('--btn-accent')
    }
  }, [themeEnabled, siteTheme])

  // Show cookie banner on first visit
  useEffect(() => {
    if (!getCookieConsent()) setShowCookies(true)
  }, [])

  useEffect(() => {
    loadExampleQueries().then((d) => setExampleQueries(d.queries || [])).catch(() => {})
    loadSessions()
      .then((d) => {
        const s = d.sessions || []
        setSessions(s)
        s.forEach(saveLocalSession)
        // Restore last active session (survives navigation to full pages + back)
        const savedId = sessionStorage.getItem('activeSessionId')
        if (savedId) {
          const match = s.find((x) => x.session_id === savedId)
          if (match) loadSession(match)
        }
      })
      .catch(() => {
        const s = loadLocalSessions()
        setSessions(s)
        const savedId = sessionStorage.getItem('activeSessionId')
        if (savedId) {
          const match = s.find((x) => x.session_id === savedId)
          if (match) loadSession(match)
        }
      })
  }, [])

  function resetAll() {
    sessionStorage.removeItem('activeSessionId')
    setUrl('')
    setUrlError('')
    setSessionId('')
    setSessionTitle('')
    setPageCount(0)
    setAppState('empty')
    setProcessError('')
    setSiteTheme(null)
    setThemeEnabled(false)
    setMessages([])
    setInsights(null)
    setSources([])
    setMedia(null)
    setArtifactsLoading(false)
  }

  async function handleDeleteSession(sid) {
    try { await deleteSession(sid) } catch {}
    removeLocalSession(sid)
    removeCachedArtifacts(sid)
    setSessions((prev) => prev.filter((s) => s.session_id !== sid))
    if (sid === sessionId) resetAll()
  }

  async function handleClearSessions() {
    try { await clearAllSessions() } catch {}
    clearLocalSessions()
    clearAllCachedArtifacts()
    setSessions([])
    if (sessionId) resetAll()
  }

  async function refreshArtifacts(sid) {
    // Hydrate from cache instantly — then refresh from API in background
    const cached = loadCachedArtifacts(sid)
    if (cached) {
      if (cached.insights) setInsights(cached.insights)
      if (cached.sources)  { setSources(cached.sources); setPageCount(cached.pageCount || 0) }
      if (cached.media)    { setMedia(cached.media); if (cached.media?.theme) setSiteTheme(cached.media.theme) }
    }

    setArtifactsLoading(true)
    try {
      const [ins, srcs, med] = await Promise.allSettled([
        loadInsights(sid),
        loadSources(sid),
        loadMedia(sid),
      ])

      let nextInsights = cached?.insights || null
      let nextSources  = cached?.sources  || []
      let nextPageCount = cached?.pageCount || 0
      let nextMedia    = cached?.media    || null

      if (ins.status === 'fulfilled') { nextInsights = ins.value; setInsights(ins.value) }
      if (srcs.status === 'fulfilled') {
        const sourceMap = srcs.value?.source_map || {}
        nextSources   = Object.values(sourceMap).flat()
        nextPageCount = Object.keys(sourceMap).length
        setSources(nextSources)
        setPageCount(nextPageCount)
      }
      if (med.status === 'fulfilled') {
        nextMedia = med.value
        setMedia(med.value)
        if (med.value?.theme && Object.keys(med.value.theme).length) setSiteTheme(med.value.theme)
      }

      saveCachedArtifacts(sid, { insights: nextInsights, sources: nextSources, pageCount: nextPageCount, media: nextMedia })
    } finally {
      setArtifactsLoading(false)
    }
  }

  async function handleProcess() {
    let trimmed = url.trim()
    if (!trimmed) return
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed
      setUrl(trimmed)
    }
    setUrlError('')
    setProcessError('')
    setAppState('processing')
    setProcessStep(0)

    const t1 = setTimeout(() => setProcessStep(1), 800)
    const t2 = setTimeout(() => setProcessStep(2), 1800)
    try {
      const res = await processUrls([trimmed])
      clearTimeout(t1); clearTimeout(t2)
      setSessionId(res.session_id)
      setSessionTitle(res.title || 'Knowledge base')
      if (res.page_count) setPageCount(res.page_count)
      if (res.theme && Object.keys(res.theme).length) setSiteTheme(res.theme)
      sessionStorage.setItem('activeSessionId', res.session_id)
      setMessages([])

      // Step 3: pre-fetch insights + media + sources while loader still visible
      setProcessStep(3)
      await refreshArtifacts(res.session_id)

      // All artifacts ready — now reveal the app
      setProcessStep(4)
      setAppState('ready')
      setActiveTab('insights')

      const updated = await loadSessions().catch(() => ({ sessions: [] }))
      const s = updated.sessions || []
      setSessions(s)
      s.forEach(saveLocalSession)
    } catch (e) {
      clearTimeout(t1); clearTimeout(t2)
      setAppState('error')
      setProcessError(e.message || 'Failed to process URL.')
    }
  }

  async function loadSession(session) {
    // Instant reset — clears stale data before new session loads
    setInsights(null)
    setSources([])
    setMedia(null)
    setPageCount(0)
    setMessages([])
    setActiveTab('insights')

    const primaryUrl = (session.urls || [])[0] || ''
    sessionStorage.setItem('activeSessionId', session.session_id)
    setUrl(primaryUrl)
    setSessionId(session.session_id)
    setSessionTitle(session.title || 'Knowledge base')
    setAppState('ready')
    setSiteTheme(session.theme || null)

    await refreshArtifacts(session.session_id)
  }

  async function handleAsk() {
    if (!sessionReady || !question.trim()) return
    const q = question.trim()
    setQuestion('')
    setAnswerLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: q, sources: [] }])
    try {
      const res = await askQuestion(sessionId, q)
      const answer = /couldn't find this information in the crawled content/i.test(res.answer)
        ? "I couldn't find this information in the crawled content."
        : res.answer
      setMessages((prev) => [...prev, { role: 'assistant', content: answer, sources: res.sources || [] }])
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${e.message || 'Failed to get an answer.'}`, sources: [] }])
    } finally {
      setAnswerLoading(false)
    }
  }

  const accent = siteTheme?.accent
  const palette = siteTheme?.palette || []

  // When theme toggle is ON, build a dynamic bg that mimics the site
  const themedBgStyle = (() => {
    if (!themeEnabled || !siteTheme) return undefined
    const a = accent || '#00D4FF'
    const c1 = palette[0] || a
    const c2 = palette[1] || a
    const ogImage = siteTheme.og_image
    const layers = [
      // Tinted grid lines using site accent
      `linear-gradient(${a}09 1px, transparent 1px)`,
      `linear-gradient(90deg, ${a}09 1px, transparent 1px)`,
      // Subtle colour wash from palette
      `linear-gradient(160deg, ${c1}0f 0%, ${c2}08 60%, transparent 100%)`,
    ]
    if (ogImage) {
      // og:image as a very faint ambient layer
      layers.push(`linear-gradient(rgba(3,11,24,0.94), rgba(3,11,24,0.96))`, `url(${ogImage})`)
    }
    return {
      backgroundImage: layers.join(', '),
      backgroundSize: ogImage ? '60px 60px, 60px 60px, 100% 100%, cover, cover' : '60px 60px, 60px 60px, 100% 100%',
      backgroundPosition: ogImage ? '0 0, 0 0, 0 0, center' : '0 0, 0 0, 0 0',
      transition: 'background 0.5s ease',
    }
  })()

  return (
    <div
      className={['h-dvh flex flex-col overflow-hidden bg-cyber-bg', !themeEnabled ? 'bg-grid' : ''].join(' ')}
      style={themedBgStyle}
    >
      {/* Processing overlay — full screen */}
      {appState === 'processing' && (
        <Loader step={processStep} url={url} />
      )}

      <AppHeader
        url={url}
        onUrlChange={setUrl}
        onProcess={handleProcess}
        processing={appState === 'processing'}
        sessions={sessions}
        onLoadSession={loadSession}
        onDeleteSession={handleDeleteSession}
        onClearSessions={handleClearSessions}
        error={urlError}
        siteTheme={themeEnabled ? siteTheme : null}
        onCollaborateClick={() => setShowCollaborate(true)}
        onReset={resetAll}
      />

      <ErrorModal
        error={appState === 'error' ? (processError || 'An unexpected error occurred.') : null}
        onClose={() => { setProcessError(''); setAppState('empty') }}
        onRetry={() => { setProcessError(''); setAppState('empty'); handleProcess() }}
      />

      <PrivacyModal open={showPrivacy} onClose={() => setShowPrivacy(false)} />

      <CookiesModal
        open={showCookies}
        onAccept={() => { setCookieConsent('accepted'); setShowCookies(false) }}
        onDecline={() => { setCookieConsent('declined'); setShowCookies(false) }}
        onPrivacyClick={() => { setShowCookies(false); setShowPrivacy(true) }}
      />

      <CollaborateModal open={showCollaborate} onClose={() => setShowCollaborate(false)} />

      {!sessionReady && appState !== 'processing' && <ChatWidget />}

      <div className="flex-1 overflow-hidden flex flex-col">

        {sessionReady && (
          <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">

            <SessionBar
              title={sessionTitle}
              sessionId={sessionId}
              pageCount={pageCount}
              siteTheme={siteTheme}
              onReset={resetAll}
              themeEnabled={themeEnabled}
              onThemeToggle={() => setThemeEnabled((v) => !v)}
            />

            {/* Sub-header tab bar */}
            <div className="shrink-0 border-b border-white/6 bg-cyber-surface/40">
              <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-none">
                {TABS.map(({ id, label, Icon }) => {
                  const isActive = activeTab === id
                  const locked = artifactsLoading && id !== 'insights'
                  return (
                    <motion.button
                      key={id}
                      onClick={() => !locked && setActiveTab(id)}
                      disabled={locked}
                      className={[
                        'shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium font-heading transition-colors duration-200',
                        isActive ? 'tab-active' : 'text-cyber-muted hover:text-white hover:bg-white/5',
                        locked ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer',
                      ].join(' ')}
                      style={isActive && themeEnabled && accent ? {
                        backgroundColor: `${accent}1a`,
                        borderColor: `${accent}59`,
                        boxShadow: `0 0 12px ${accent}33`,
                        color: accent,
                      } : undefined}
                      whileHover={!locked && !isActive ? { scale: 1.05, y: -1 } : undefined}
                      whileTap={!locked ? { scale: 0.95 } : undefined}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </motion.button>
                  )
                })}
                {artifactsLoading && (
                  <span className="ml-auto text-[10px] text-cyber-muted flex items-center gap-1.5 animate-fade-in">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyber-cyan animate-pulse" />
                    Loading…
                  </span>
                )}
              </div>
              {/* Progress strip */}
              {artifactsLoading && (
                <div className="h-px w-full bg-cyber-cyan/10 overflow-hidden">
                  <div className="h-full bg-cyber-cyan/60 animate-progress-indeterminate" />
                </div>
              )}
            </div>

            {/* Full-width content area */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'insights' && (
                <div className="h-full overflow-y-auto p-4 animate-fade-in">
                  <InsightPanel insights={insights} loading={!insights} siteTheme={themeEnabled ? siteTheme : null} />
                  <Footer onPrivacyClick={() => setShowPrivacy(true)} onCookiesClick={() => setShowCookies(true)} />
                </div>
              )}
              {activeTab === 'qa' && (
                <ChatPanel
                  messages={messages}
                  question={question}
                  onQuestionChange={setQuestion}
                  onAsk={handleAsk}
                  loading={answerLoading}
                  sessionReady={sessionReady}
                  siteTheme={themeEnabled ? siteTheme : null}
                />
              )}
              {activeTab === 'media' && (
                <div className="h-full overflow-y-auto p-4 animate-fade-in">
                  <MediaPanel media={media} siteTheme={siteTheme} />
                  <Footer onPrivacyClick={() => setShowPrivacy(true)} onCookiesClick={() => setShowCookies(true)} />
                </div>
              )}
              {activeTab === 'sources' && (
                <div className="h-full overflow-y-auto p-4 animate-fade-in">
                  <SourcesPanel sources={sources} />
                  <Footer onPrivacyClick={() => setShowPrivacy(true)} onCookiesClick={() => setShowCookies(true)} />
                </div>
              )}
            </div>
          </div>
        )}

        {!sessionReady && appState !== 'processing' && (
          <div className="flex-1 overflow-y-auto">
            <LandingView
              exampleQueries={exampleQueries}
              onQuerySelect={(q) => setQuestion(q)}
            />
            <Footer onPrivacyClick={() => setShowPrivacy(true)} onCookiesClick={() => setShowCookies(true)} />
          </div>
        )}
      </div>
    </div>
  )
}
