import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Globe, ExternalLink, FileText, Hash, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react'
import { loadSources, loadSessions } from '../services/api'
import { useSEO } from '../hooks/useSEO'

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

function pathOf(url) {
  try {
    const { pathname } = new URL(url)
    return pathname === '/' ? '' : pathname
  } catch { return '' }
}

function HeadlineCard({ page, chunkCount, idx }) {
  const [expanded, setExpanded] = useState(false)
  const domain = domainOf(page.url)
  const path = pathOf(page.url)
  const excerpt = page.sections?.[0]?.text?.slice(0, 240) || page.raw_text?.slice(0, 240) || ''
  const sectionLabels = [...new Set(
    (page.sections || []).map((s) => s.title).filter(Boolean)
  )].slice(0, 5)

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, type: 'spring', stiffness: 260, damping: 26 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(10,22,40,0.7)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Headline */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Category line */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyber-cyan/70">{domain}</span>
              {chunkCount > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-[10px] text-cyber-muted">{chunkCount} chunk{chunkCount !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>

            {/* Headline title */}
            <a
              href={page.final_url || page.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-1.5"
            >
              <h2 className="font-heading font-bold text-lg text-white leading-snug group-hover:text-cyber-cyan transition-colors line-clamp-2">
                {page.title || domain}
              </h2>
              <ExternalLink className="h-3.5 w-3.5 text-cyber-muted shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            {/* URL path */}
            {path && (
              <p className="font-mono text-[11px] text-cyber-muted mt-1 truncate">{path}</p>
            )}
          </div>
        </div>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm text-slate-400 leading-6 mt-3 line-clamp-3">{excerpt}</p>
        )}
      </div>

      {/* Section tags + expand */}
      <div className="px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {sectionLabels.map((label, i) => (
            <span
              key={i}
              className="rounded-full px-2 py-0.5 text-[10px] border border-white/8 bg-white/[0.03] text-cyber-muted"
            >
              {label}
            </span>
          ))}
        </div>
        {page.sections?.length > 1 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-cyber-muted hover:text-white transition-colors shrink-0"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? 'Less' : `+${page.sections.length - 1} sections`}
          </button>
        )}
      </div>

      {/* Expanded sections */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-white/5 divide-y divide-white/[0.04]"
        >
          {page.sections.slice(1, 12).map((sec, i) => (
            <div key={i} className="px-5 py-3">
              {sec.title && (
                <p className="text-[11px] font-semibold text-cyber-cyan/70 uppercase tracking-wide mb-1">{sec.title}</p>
              )}
              <p className="text-xs text-slate-500 leading-5 line-clamp-2">{sec.text}</p>
            </div>
          ))}
        </motion.div>
      )}
    </motion.article>
  )
}

function SkeletonCard({ idx }) {
  return (
    <motion.div
      className="rounded-2xl glass overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: idx * 0.05 }}
    >
      <div className="px-5 py-4 space-y-3 border-b border-white/5">
        <div className="shimmer h-3 w-24 rounded" />
        <div className="shimmer h-6 w-3/4 rounded-lg" />
        <div className="shimmer h-4 w-full rounded" />
        <div className="shimmer h-4 w-2/3 rounded" />
      </div>
      <div className="px-5 py-3 flex gap-2">
        {[1, 2].map((j) => <div key={j} className="shimmer h-5 w-16 rounded-full" />)}
      </div>
    </motion.div>
  )
}

export default function SourcesPage() {
  const { sessionId } = useParams()
  const [pages, setPages] = useState([])
  const [sourceMap, setSourceMap] = useState({})
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchAll() {
    setLoading(true)
    setError('')
    try {
      const [srcs, sessions] = await Promise.allSettled([
        loadSources(sessionId),
        loadSessions(),
      ])
      if (srcs.status === 'fulfilled') {
        setPages(srcs.value.pages || [])
        setSourceMap(srcs.value.source_map || {})
      } else throw srcs.reason
      if (sessions.status === 'fulfilled') {
        const match = (sessions.value.sessions || []).find((s) => s.session_id === sessionId)
        if (match) setMeta(match)
      }
    } catch (e) {
      setError(e.message || 'Failed to load sources')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [sessionId])

  // Sort pages by chunk count desc
  const sortedPages = [...pages].sort((a, b) => {
    const ca = sourceMap[a.url]?.length || 0
    const cb = sourceMap[b.url]?.length || 0
    return cb - ca
  })

  const totalChunks = Object.values(sourceMap).reduce((s, arr) => s + arr.length, 0)

  useSEO({
    title: meta?.title ? `${meta.title} — Sources` : 'Sources',
    image: meta?.theme?.og_image || null,
    url: `/sources/${sessionId}`,
  })

  return (
    <div className="min-h-screen bg-cyber-bg bg-grid text-white">

      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/8">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-cyber-muted hover:text-white transition-colors text-sm font-medium shrink-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {meta?.theme?.favicon && (
              <img src={meta.theme.favicon} alt="" className="h-5 w-5 rounded shrink-0" onError={(e) => e.target.style.display = 'none'} />
            )}
            {!meta?.theme?.favicon && <Globe className="h-4 w-4 text-cyber-muted shrink-0" />}
            <span className="font-heading font-semibold text-sm text-white truncate">{meta?.title || 'Sources'}</span>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="rounded-full px-3 py-1 text-[11px] border border-cyber-purple/25 bg-cyber-purple/8 text-cyber-purple font-medium">
              Crawled Pages
            </span>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="h-8 w-8 rounded-xl glass flex items-center justify-center text-cyber-muted hover:text-white transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Stats bar */}
        {!loading && !error && (
          <motion.div
            className="flex items-center gap-6 mb-8 pb-6 border-b border-white/6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-cyber-purple" />
              <span className="text-sm text-white font-medium">{sortedPages.length} pages crawled</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyber-cyan" />
              <span className="text-sm text-cyber-muted">{totalChunks} content chunks indexed</span>
            </div>
          </motion.div>
        )}

        {/* Headline-style editorial layout */}
        {error ? (
          <div className="glass rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
            <FileText className="h-8 w-8 text-cyber-cyan/30" />
            <p className="text-cyber-muted text-sm">{error}</p>
            <button onClick={fetchAll} className="text-xs text-cyber-cyan hover:text-white transition-colors">Retry</button>
          </div>
        ) : (
          <div className="space-y-4">
            {loading
              ? Array.from({ length: 5 }, (_, i) => <SkeletonCard key={i} idx={i} />)
              : sortedPages.map((page, idx) => (
                  <HeadlineCard
                    key={page.url}
                    page={page}
                    chunkCount={sourceMap[page.url]?.length || 0}
                    idx={idx}
                  />
                ))
            }
            {!loading && !sortedPages.length && !error && (
              <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                <FileText className="h-8 w-8 text-cyber-cyan/30" />
                <p className="text-cyber-muted text-sm">No sources available for this session.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
