import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield } from 'lucide-react'

const SECTIONS = [
  {
    title: 'Information We Collect',
    body: 'We collect the URLs you submit for analysis, session identifiers, and usage data such as questions asked and features used. No account creation or personal identification is required to use Web Intelligence.',
  },
  {
    title: 'How We Use Your Data',
    body: 'Submitted URLs are processed to extract and index page content for question-answering and insight generation. Session data is stored temporarily and associated with a randomly generated session ID — not your identity. We do not sell or share your data with third parties.',
  },
  {
    title: 'Cookies & Local Storage',
    body: 'We use browser localStorage and IndexedDB to cache session artifacts (insights, sources, media) so they load instantly on return visits. A cookie-consent preference is stored locally. No third-party tracking or advertising cookies are used.',
  },
  {
    title: 'Data Retention',
    body: 'Server-side session data is retained for a limited period to allow artifact retrieval. Cached data in your browser persists until you clear it or delete the session. You can remove all sessions via the session dropdown in the header.',
  },
  {
    title: 'Third-Party Services',
    body: 'Web Intelligence may use AI model providers (such as Google Gemini or local Ollama models) to generate answers and insights. Content you submit may be sent to these providers to fulfil your requests. Refer to the respective provider\'s privacy policy for their data practices.',
  },
  {
    title: 'Your Rights',
    body: 'You may delete individual sessions or clear all session data at any time using the controls in the application. If you have questions about your data, contact us at the address listed below.',
  },
  {
    title: 'Contact',
    body: 'For privacy-related enquiries, reach out via the project repository or the contact details provided on the Web Intelligence platform.',
  },
]

export default function PrivacyModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(10, 22, 40, 0.97)',
              border: '1px solid rgba(0, 212, 255, 0.18)',
              boxShadow: '0 0 60px rgba(0, 212, 255, 0.08), 0 24px 64px rgba(0, 0, 0, 0.7)',
            }}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0, 212, 255, 0.12)', border: '1px solid rgba(0, 212, 255, 0.2)' }}
                >
                  <Shield className="h-4 w-4 text-cyber-cyan" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-white text-[15px] leading-tight">Privacy Policy</h2>
                  <p className="text-[11px] text-cyber-muted mt-0.5">Last updated {new Date().getFullYear()}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-cyber-muted hover:text-white hover:bg-white/8 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <p className="text-[13px] text-slate-400 leading-6">
                Web Intelligence ("we", "our", "us") is committed to protecting your privacy. This policy explains
                what data we collect, how we use it, and your rights regarding that data.
              </p>

              {SECTIONS.map(({ title, body }) => (
                <div key={title}>
                  <h3 className="font-heading font-semibold text-white text-[13px] mb-1.5">{title}</h3>
                  <p className="text-[13px] text-slate-400 leading-6">{body}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-white/8 flex justify-end">
              <button
                onClick={onClose}
                className="analyze-btn rounded-xl px-5 py-2 text-sm font-heading font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
