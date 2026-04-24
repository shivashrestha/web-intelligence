/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        cyber: {
          bg: '#030B18',
          surface: '#0A1628',
          elevated: '#0F1F3A',
          border: 'rgba(0,212,255,0.12)',
          cyan: '#00D4FF',
          purple: '#8B5CF6',
          green: '#10FFA8',
          red: '#FF4D6D',
          muted: '#8892B0',
        },
      },
      backgroundImage: {
        'grid-cyber': `
          linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)
        `,
        'gradient-cyber': 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%)',
        'gradient-surface': 'linear-gradient(180deg, rgba(10,22,40,0.95) 0%, rgba(3,11,24,0.98) 100%)',
      },
      backgroundSize: {
        'grid-60': '60px 60px',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0,212,255,0.35), 0 0 60px rgba(0,212,255,0.1)',
        'glow-purple': '0 0 20px rgba(139,92,246,0.4), 0 0 60px rgba(139,92,246,0.1)',
        'glow-sm': '0 0 8px rgba(0,212,255,0.25)',
        'surface': '0 4px 24px rgba(0,0,0,0.5)',
        'elevated': '0 8px 40px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'progress-indeterminate': 'progressIndeterminate 1.4s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%': { boxShadow: '0 0 5px rgba(0,212,255,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0,212,255,0.6)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        progressIndeterminate: {
          '0%':   { transform: 'translateX(-100%) scaleX(0.3)' },
          '50%':  { transform: 'translateX(0%) scaleX(0.7)' },
          '100%': { transform: 'translateX(100%) scaleX(0.3)' },
        },
      },
    },
  },
  plugins: [],
}
