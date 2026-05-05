import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, FileText, Image, RotateCcw, Palette, Info, MonitorPlay, Maximize2, ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import logo from '../logo.png'
import { useSEO } from './hooks/useSEO'

import LandingView from './components/LandingView'
import AppHeader from './components/AppHeader'
import Loader from './components/Loader'
import ErrorModal from './components/ErrorModal'
import InsightPanel, { buildSlides, downloadSlidesAsPDF, slideVariants, SlideContent, PresentationModal } from './components/InsightPanel'
import QAChatbot from './components/QAChatbot'
import SourcesPanel from './components/SourcesPanel'
import MediaPanel from './components/MediaPanel'
import Footer from './components/Footer'
import PrivacyModal from './components/PrivacyModal'
import CookiesModal, { getCookieConsent, setCookieConsent } from './components/CookiesModal'
import ChatWidget from './components/ChatWidget'
import CollaborateModal from './components/CollaborateModal'

import {
  loadInsights, loadMedia,
  loadSessions, loadSources, processUrls,
  deleteSession, clearAllSessions, loadExampleQueries,
} from './services/api'
import {
  loadLocalSessions, saveLocalSession, removeLocalSession, clearLocalSessions,
  loadCachedArtifacts, saveCachedArtifacts, removeCachedArtifacts, clearAllCachedArtifacts,
} from './services/storage'

const TABS = [
  { id: 'insights', label: 'Insights',     Icon: BarChart3    },
  { id: 'slides',   label: 'Slides',       Icon: MonitorPlay  },
  { id: 'media',    label: 'Media',        Icon: Image        },
  { id: 'sources',  label: 'Sources',      Icon: FileText     },
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
// ── Slides page (embedded tab view) ──────────────────────────────────────
function SlidesPage({ slides, sessionTitle, onFullscreen }) {
  const [current, setCurrent] = useState(0)
  const [dir, setDir]         = useState(1)
  const go   = (idx) => { setDir(idx > current ? 1 : -1); setCurrent(Math.max(0, Math.min(idx, slides.length - 1))) }
  const next = () => { if (current < slides.length - 1) go(current + 1) }
  const prev = () => { if (current > 0) go(current - 1) }

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next()
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [current, slides.length])

  if (!slides.length) return null
  const slide    = slides[current]
  const progress = ((current + 1) / slides.length) * 100

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/6 bg-cyber-surface/30">
        <div className="flex items-center gap-2 min-w-0">
          <MonitorPlay className="h-4 w-4 text-cyber-cyan shrink-0" />
          <span className="text-sm font-semibold text-white truncate max-w-xs">{sessionTitle || 'Presentation'}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-mono tabular-nums">{current + 1}&thinsp;/&thinsp;{slides.length}</span>
          <button
            onClick={() => downloadSlidesAsPDF(slides, { title: sessionTitle })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <FileDown className="h-3.5 w-3.5" /><span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={onFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-white/5 shrink-0">
        <motion.div className="h-full" style={{ background: `linear-gradient(90deg,${slide.color},#8B5CF6)` }}
          animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 180, damping: 28 }} />
      </div>
      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden">
        <motion.div key={slide.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 65% 55% at 50% 50%,${slide.color}0d 0%,transparent 70%)` }} />
        <AnimatePresence custom={dir} mode="wait">
          <motion.div key={current} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 flex items-center justify-center px-6 sm:px-12 py-8">
            <div className="w-full max-w-4xl"><SlideContent slide={slide} /></div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Nav */}
      <div className="flex items-center justify-center gap-4 py-4 border-t border-white/6 shrink-0">
        <button onClick={prev} disabled={current === 0}
          className="h-9 w-9 rounded-xl flex items-center justify-center border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-1.5 items-center">
          {slides.map((s, i) => (
            <motion.button key={i} onClick={() => go(i)}
              animate={{ width: i === current ? 24 : 8, background: i === current ? s.color : 'rgba(255,255,255,0.15)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="h-2 rounded-full cursor-pointer" />
          ))}
        </div>
        <button onClick={next} disabled={current === slides.length - 1}
          className="h-9 w-9 rounded-xl flex items-center justify-center border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
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
  const [insights, setInsights] = useState(null)
  const [sources, setSources] = useState([])
  const [media, setMedia] = useState(null)
  const [exampleQueries, setExampleQueries] = useState([])
  const [themeEnabled, setThemeEnabled] = useState(false)
  const [artifactsLoading, setArtifactsLoading] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showCookies, setShowCookies] = useState(false)
  const [showCollaborate, setShowCollaborate] = useState(false)
  const [showSlidesFullscreen, setShowSlidesFullscreen] = useState(false)

  const slides = useMemo(
    () => insights?.structured ? buildSlides(insights.structured, { title: sessionTitle }) : [],
    [insights, sessionTitle]
  )

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
    setInsights(null)
    setSources([])
    setMedia(null)
    setArtifactsLoading(false)
    setShowSlidesFullscreen(false)
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
                  const locked = (artifactsLoading && id !== 'insights') || (id === 'slides' && !slides.length)
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
                  <InsightPanel insights={insights} loading={!insights} siteTheme={themeEnabled ? siteTheme : null} onSlidesOpen={() => setActiveTab('slides')} />
                  <Footer onPrivacyClick={() => setShowPrivacy(true)} onCookiesClick={() => setShowCookies(true)} />
                </div>
              )}
              {activeTab === 'slides' && slides.length > 0 && (
                <div className="h-full animate-fade-in">
                  <SlidesPage slides={slides} sessionTitle={sessionTitle} onFullscreen={() => setShowSlidesFullscreen(true)} />
                </div>
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
              onQuerySelect={(q) => setUrl(q)}
              logo={logo}
            />
            <Footer onPrivacyClick={() => setShowPrivacy(true)} onCookiesClick={() => setShowCookies(true)} />
          </div>
        )}
      </div>

      {/* Floating Q&A chatbot — visible when a session is active */}
      {sessionReady && <QAChatbot sessionId={sessionId} sessionReady={sessionReady} />}

      {/* Fullscreen presentation — always mounted at root so it survives tab switches */}
      <AnimatePresence>
        {showSlidesFullscreen && slides.length > 0 && (
          <PresentationModal
            slides={slides}
            meta={{ title: sessionTitle }}
            onClose={() => setShowSlidesFullscreen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
