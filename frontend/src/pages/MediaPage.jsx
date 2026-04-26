import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Globe, Image, ExternalLink, X, Palette, RefreshCw, LayoutGrid } from 'lucide-react'
import { loadMedia, loadSessions } from '../services/api'
import { useSEO } from '../hooks/useSEO'

// ── Lightbox ──────────────────────────────────────────────────────────────

function Lightbox({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(3,11,24,0.92)', backdropFilter: 'blur(16px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.88, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="relative"
        >
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 h-8 w-8 rounded-full glass flex items-center justify-center text-cyber-muted hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <img
            src={src}
            alt=""
            className="max-w-[98vw] max-h-[95vh] rounded-2xl object-contain shadow-elevated"
          />
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 glass rounded-xl px-4 py-2 text-xs text-cyber-muted hover:text-white transition-colors whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            Open original
          </a>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Image card (Pinterest style) ──────────────────────────────────────────

function ImageCard({ img, idx }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  // Support both {url, page_url} dict and legacy string
  const src = typeof img === 'string' ? img : img.url
  const pageUrl = typeof img === 'object' ? img.page_url : ''

  if (error) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 0.93 }}
        transition={{ delay: Math.min(idx * 0.04, 0.8), duration: 0.35 }}
        className="break-inside-avoid mb-2.5 group relative overflow-hidden rounded-2xl cursor-pointer"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        onClick={() => setLightbox(true)}
      >
        <img
          src={src}
          alt=""
          loading="lazy"
          className="w-full block object-cover transition-transform duration-500 group-hover:scale-105"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-white/80">
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[10px]">View</span>
            </div>
            {pageUrl && <span className="text-[9px] text-white/50 truncate max-w-[140px]">{pageUrl.replace(/^https?:\/\//, '')}</span>}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-cyan/0 via-cyber-cyan/5 to-cyber-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </motion.div>
      {lightbox && <Lightbox src={src} onClose={() => setLightbox(false)} />}
    </>
  )
}

// ── Color swatch ──────────────────────────────────────────────────────────

function ColorSwatch({ color }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(color).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <motion.button
      onClick={copy}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.95 }}
      title={copied ? 'Copied!' : color}
      className="flex flex-col items-center gap-1.5 group"
    >
      <div
        className="h-12 w-12 rounded-2xl border border-white/10 shadow-surface"
        style={{ backgroundColor: color }}
      />
      <span className="text-[9px] font-mono text-cyber-muted group-hover:text-white transition-colors">
        {copied ? '✓ Copied' : color.length > 7 ? color.slice(0, 7) : color}
      </span>
    </motion.button>
  )
}

// ── Skeleton grid ─────────────────────────────────────────────────────────

function SkeletonGrid() {
  const heights = [160, 220, 140, 200, 180, 160, 240, 150, 190]
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-2.5">
      {heights.map((h, i) => (
        <div
          key={i}
          className="break-inside-avoid mb-2.5 shimmer rounded-2xl"
          style={{ height: h }}
        />
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const { sessionId } = useParams()
  const [images, setImages] = useState([])
  const [theme, setTheme] = useState(null)
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cols, setCols] = useState(4)

  async function fetchAll() {
    setLoading(true)
    setError('')
    try {
      const [med, sessions] = await Promise.allSettled([
        loadMedia(sessionId),
        loadSessions(),
      ])
      if (med.status === 'fulfilled') {
        setImages(med.value.images || [])
        setTheme(med.value.theme || null)
      } else throw med.reason
      if (sessions.status === 'fulfilled') {
        const match = (sessions.value.sessions || []).find((s) => s.session_id === sessionId)
        if (match) setMeta(match)
      }
    } catch (e) {
      setError(e.message || 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [sessionId])

  const palette = theme?.palette || []
  const accent = theme?.accent || meta?.theme?.accent

  useSEO({
    title: meta?.title ? `${meta.title} — Media` : 'Media',
    image: meta?.theme?.og_image || null,
    url: `/media/${sessionId}`,
  })

  return (
    <div className="min-h-screen bg-cyber-bg bg-grid text-white">

      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
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
            <span className="font-heading font-semibold text-sm text-white truncate">{meta?.title || 'Media'}</span>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {!loading && images.length > 0 && (
              <span className="rounded-full px-3 py-1 text-[11px] border border-cyber-green/25 bg-cyber-green/8 text-cyber-green font-medium">
                {images.length} images
              </span>
            )}
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

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {error ? (
          <div className="glass rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
            <Image className="h-8 w-8 text-cyber-cyan/30" />
            <p className="text-cyber-muted text-sm">{error}</p>
            <button onClick={fetchAll} className="text-xs text-cyber-cyan hover:text-white transition-colors">Retry</button>
          </div>
        ) : (
          <>
            {/* OG image hero */}
            {!loading && theme?.og_image && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl overflow-hidden relative"
                style={{ border: `1px solid ${accent || '#00D4FF'}25` }}
              >
                <img
                  src={theme.og_image}
                  alt=""
                  className="w-full max-h-64 object-cover"
                  onError={(e) => e.target.closest('div').style.display = 'none'}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cyber-bg/80 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  {theme.favicon && (
                    <img src={theme.favicon} alt="" className="h-6 w-6 rounded" onError={(e) => e.target.style.display = 'none'} />
                  )}
                  <span className="text-xs font-medium text-white/80">OG Image</span>
                </div>
              </motion.div>
            )}

            {/* Color palette */}
            {!loading && palette.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="h-4 w-4" style={{ color: accent || '#00D4FF' }} />
                  <h2 className="font-heading font-semibold text-sm text-white">Site Color Palette</h2>
                  <span className="text-[11px] text-cyber-muted">{palette.length} colors</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {palette.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.05, type: 'spring' }}
                    >
                      <ColorSwatch color={c} />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Pinterest masonry grid */}
            {loading ? (
              <SkeletonGrid />
            ) : images.length > 0 ? (
              <section>
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-cyber-muted" />
                    <h2 className="font-heading font-semibold text-sm text-white">Image Gallery</h2>
                    <span className="text-[11px] text-cyber-muted">{images.length} images</span>
                  </div>
                  {/* Grid size selector */}
                  <div className="flex items-center gap-1.5">
                    <LayoutGrid className="h-3.5 w-3.5 text-cyber-muted" />
                    <span className="text-[11px] text-cyber-muted mr-1">Grid</span>
                    {[2, 3, 4, 5, 6].map(n => (
                      <button
                        key={n}
                        onClick={() => setCols(n)}
                        className={[
                          'h-7 w-7 rounded-lg text-xs font-mono font-semibold transition-all',
                          cols === n
                            ? 'bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan'
                            : 'glass text-cyber-muted hover:text-white hover:border-white/20',
                        ].join(' ')}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ columns: cols, columnGap: '0.625rem' }}>
                  {images.map((img, i) => (
                    <ImageCard key={i} img={img} idx={i} />
                  ))}
                </div>
              </section>
            ) : (
              <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                <Image className="h-8 w-8 text-cyber-cyan/30" />
                <p className="text-cyber-muted text-sm">No images found in this session.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
