/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Countdown-inspired palette
        navyDark:   '#0d1b2a',
        navy:       '#1a2f4e',
        navyMid:    '#1e3a5f',
        navyLight:  '#2c5282',
        // Gold / Yellow (the Countdown panel colour)
        gold:       '#f6c90e',
        goldDark:   '#d4a900',
        goldLight:  '#fde047',
        // Tile colours
        tileBlue:   '#1e3a5f',
        tileBorder: '#2c5282',
        tileActive: '#f6c90e',
        // Text
        textPrimary:   '#f1f5f9',
        textSecondary: '#94a3b8',
        textGold:      '#f6c90e',
        // Status
        correct:    '#22c55e',
        incorrect:  '#ef4444',
        neutral:    '#64748b',
      },
      fontFamily: {
        display: ['Orbitron', 'monospace'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'tile-flip':    'tileFlip 0.4s ease-in-out',
        'tile-pop':     'tilePop 0.15s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
        'fade-in':      'fadeIn 0.3s ease-out',
        'clock-pulse':  'clockPulse 1s ease-in-out infinite',
        'bounce-in':    'bounceIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'shake':        'shake 0.4s ease-in-out',
      },
      keyframes: {
        tileFlip: {
          '0%':   { transform: 'rotateX(0deg)', backgroundColor: '#1e3a5f' },
          '50%':  { transform: 'rotateX(90deg)' },
          '100%': { transform: 'rotateX(0deg)', backgroundColor: '#f6c90e' },
        },
        tilePop: {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        clockPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0.3)', opacity: '0' },
          '50%':  { transform: 'scale(1.05)' },
          '70%':  { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-6px)' },
          '40%':      { transform: 'translateX(6px)' },
          '60%':      { transform: 'translateX(-4px)' },
          '80%':      { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
};
