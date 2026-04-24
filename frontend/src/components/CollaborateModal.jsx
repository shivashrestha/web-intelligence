import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Handshake, CheckCircle, Loader } from 'lucide-react'
import { submitCollaborate } from '../services/api'

const INITIAL = { name: '', email: '', linkedin: '', description: '' }

export default function CollaborateModal({ open, onClose }) {
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'error'
  const [serverError, setServerError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address.'
    if (!form.description.trim()) e.description = 'Description is required.'
    else if (form.description.trim().length < 10) e.description = 'At least 10 characters.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setStatus('loading')
    setServerError('')
    try {
      await submitCollaborate({
        name: form.name.trim(),
        email: form.email.trim(),
        linkedin: form.linkedin.trim(),
        description: form.description.trim(),
      })
      setStatus('success')
    } catch (err) {
      setServerError(err.message || 'Submission failed. Please try again.')
      setStatus('error')
    }
  }

  function handleClose() {
    if (status === 'success') {
      setForm(INITIAL)
      setErrors({})
      setStatus('idle')
    }
    setServerError('')
    onClose()
  }

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
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(10, 22, 40, 0.98)',
              border: '1px solid rgba(0, 212, 255, 0.18)',
              boxShadow: '0 0 60px rgba(0, 212, 255, 0.08), 0 24px 64px rgba(0, 0, 0, 0.7)',
            }}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.22)' }}
                >
                  <Handshake className="h-4 w-4 text-cyber-purple" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-white text-[15px] leading-tight">Let's Collaborate</h2>
                  <p className="text-[11px] text-cyber-muted mt-0.5">Freelance · Contribute · Build together</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-cyber-muted hover:text-white hover:bg-white/8 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 20 }}
                >
                  <CheckCircle className="h-14 w-14 text-cyber-green" />
                </motion.div>
                <h3 className="font-heading font-bold text-white text-lg">Message sent!</h3>
                <p className="text-[13px] text-slate-400 leading-6 max-w-xs">
                  Thanks for reaching out. I'll get back to you at <span className="text-cyber-cyan">{form.email}</span> soon.
                </p>
                <button onClick={handleClose} className="analyze-btn rounded-xl px-6 py-2 text-sm font-heading font-semibold mt-2">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="px-6 py-5 space-y-4">
                  <p className="text-[13px] text-slate-400 leading-6">
                    Open to freelance, contributing to your project, business partnerships, or improving Web Intelligence together.
                    Drop your details and I'll reach out.
                  </p>

                  {/* Name + Email row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-cyber-muted mb-1.5">
                        Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                        placeholder="Your name"
                        className="w-full rounded-xl px-3 py-2 text-[13px] input-cyber"
                      />
                      {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-cyber-muted mb-1.5">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl px-3 py-2 text-[13px] input-cyber"
                      />
                      {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-[11px] font-medium text-cyber-muted mb-1.5">LinkedIn <span className="text-cyber-muted/50">(optional)</span></label>
                    <input
                      type="url"
                      value={form.linkedin}
                      onChange={(e) => set('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full rounded-xl px-3 py-2 text-[13px] input-cyber"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[11px] font-medium text-cyber-muted mb-1.5">
                      What would you like to collaborate on? <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => set('description', e.target.value)}
                      placeholder="Describe your project, idea, or how you'd like to work together…"
                      className="w-full rounded-xl px-3 py-2 text-[13px] resize-none input-cyber"
                    />
                    {errors.description && <p className="text-[11px] text-red-400 mt-1">{errors.description}</p>}
                  </div>

                  {serverError && (
                    <p className="text-[12px] text-red-400 rounded-lg px-3 py-2"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {serverError}
                    </p>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-white/8 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl px-4 py-2 text-[13px] font-heading font-medium text-cyber-muted hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="analyze-btn flex items-center gap-2 rounded-xl px-5 py-2 text-[13px] font-heading font-semibold disabled:opacity-60 transition-all"
                  >
                    {status === 'loading' && <Loader className="h-3.5 w-3.5 animate-spin" />}
                    {status === 'loading' ? 'Sending…' : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
