import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, ExternalLink, X, ZoomIn } from 'lucide-react'

function ImageLightbox({ src, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ background: 'rgba(3,11,24,0.92)', backdropFilter: 'blur(18px)' }}
    >
      <motion.div
        className="relative max-w-[92vw] max-h-[92vh] flex flex-col items-center gap-3"
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt=""
          className="max-w-full max-h-[82vh] rounded-2xl object-contain shadow-elevated"
        />
        <div className="flex items-center gap-2">
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 glass rounded-xl px-4 py-2 text-xs text-cyber-muted hover:text-white transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open original
          </a>
          <button
            onClick={onClose}
            className="flex items-center gap-2 glass rounded-xl px-4 py-2 text-xs text-cyber-muted hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ImageCard({ src, index }) {
  const [lightbox, setLightbox] = useState(false)
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (error) return null

  return (
    <>
      <motion.button
        onClick={() => setLightbox(true)}
        className="group relative w-full overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] hover:border-white/20 transition-border duration-200 block"
        initial={{ opacity: 0, y: 12 }}
        animate={loaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.97 }}
        style={{ transition: 'border-color 0.2s' }}
      >
        {/* Natural-height image — no max-h, no object-cover → true Pinterest variable heights */}
        <img
          src={src}
          alt=""
          loading="lazy"
          className="w-full h-auto block"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />

        {/* Hover overlay */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          style={{ background: 'linear-gradient(to top, rgba(3,11,24,0.75) 0%, rgba(3,11,24,0.3) 60%, transparent 100%)' }}
        >
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,212,255,0.18)', border: '1px solid rgba(0,212,255,0.4)', backdropFilter: 'blur(6px)' }}
          >
            <ZoomIn className="h-4 w-4 text-cyber-cyan" />
          </div>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {lightbox && <ImageLightbox src={src} onClose={() => setLightbox(false)} />}
      </AnimatePresence>
    </>
  )
}

export default function MediaPanel({ media, siteTheme }) {
  const images = media?.images || []
  const accent = media?.theme?.accent || siteTheme?.accent

  if (!images.length) {
    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
        <Image className="h-8 w-8 text-cyber-cyan/40" />
        <p className="text-cyber-muted text-sm">No images found. Images from crawled pages will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4" style={{ color: accent || '#00D4FF' }} />
          <p className="text-sm font-heading font-semibold text-white">{images.length} Pins</p>
        </div>
      </div>

      {/* Pinterest masonry: CSS columns, natural-height images, break-inside-avoid */}
      <div
        style={{
          columns: '4',
          columnGap: '0.75rem',
        }}
        className="pinterest-grid"
      >
        <style>{`
          @media (min-width: 480px)  { .pinterest-grid { columns: 3; } }
          @media (min-width: 768px)  { .pinterest-grid { columns: 4; } }
          @media (min-width: 1280px) { .pinterest-grid { columns: 5; } }
        `}</style>
        {images.map((src, i) => (
          <div key={i} className="break-inside-avoid mb-3">
            <ImageCard src={src} index={i} />
          </div>
        ))}
      </div>
    </div>
  )
}
