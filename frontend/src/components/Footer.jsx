import { Shield, Cookie } from 'lucide-react'

export default function Footer({ onPrivacyClick, onCookiesClick }) {
  return (
    <div className="shrink-0 border-t border-white/6 bg-cyber-surface/40 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-y-1.5">
      <span className="text-[11px] text-cyber-muted">
        © {new Date().getFullYear()} Web Intelligence. All rights reserved.
      </span>
      <div className="flex items-center gap-5">
        <button
          onClick={onPrivacyClick}
          className="text-[11px] text-cyber-muted hover:text-cyber-cyan transition-colors flex items-center gap-1.5"
        >
          <Shield className="h-3 w-3" />
          Privacy Policy
        </button>
        <button
          onClick={onCookiesClick}
          className="text-[11px] text-cyber-muted hover:text-cyber-cyan transition-colors flex items-center gap-1.5"
        >
          <Cookie className="h-3 w-3" />
          Cookie Settings
        </button>
      </div>
    </div>
  )
}
