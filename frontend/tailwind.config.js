/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // RR Ice Brand Colors - Brun/Beige Elegant Theme
        coffee: {
          50: '#f8f6f3',
          100: '#ede8e0',
          200: '#d9cec0',
          300: '#c4b09a',
          400: '#b39476',
          500: '#a67c5d',
          600: '#8f6a4f',
          700: '#765643',
          800: '#62493a',
          900: '#523e32',
          950: '#2d201a',
        },
        cream: {
          50: '#fdfcfb',
          100: '#faf7f2',
          200: '#f5ede3',
          300: '#ede0cd',
          400: '#e3ccad',
          500: '#d4b18a',
          600: '#c49668',
          700: '#b07d4f',
          800: '#8f6544',
          900: '#74523a',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Lora', 'serif'],
      },
      boxShadow: {
        // Light mode — layered, soft
        'soft': '0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.03)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 6px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 12px 28px rgba(0,0,0,0.06)',
        'premium': '0 8px 24px rgba(0,0,0,0.1), 0 20px 48px rgba(0,0,0,0.05)',
        // Dark mode — deeper, richer
        'dark-soft': '0 1px 2px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.15)',
        'dark-card': '0 2px 4px rgba(0,0,0,0.3), 0 6px 16px rgba(0,0,0,0.2)',
        'dark-card-hover': '0 4px 12px rgba(0,0,0,0.4), 0 12px 28px rgba(0,0,0,0.3)',
        'dark-premium': '0 8px 24px rgba(0,0,0,0.5), 0 20px 48px rgba(0,0,0,0.25)',
        // Accent glows — very subtle
        'glow-gold': '0 0 20px rgba(196,150,104,0.1), 0 0 40px rgba(196,150,104,0.05)',
      },
      keyframes: {
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        menuReveal: {
          from: { opacity: '0', transform: 'translateY(24px) scale(0.96)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        menuLine: {
          from: { width: '0%' },
          to: { width: '100%' },
        },
        heroFadeUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        heroScale: {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'fadeIn': 'fadeIn 0.3s ease-out',
        'slideUp': 'slideUp 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'menu-reveal': 'menuReveal 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'menu-line': 'menuLine 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'hero-scale': 'heroScale 1s cubic-bezier(0.16,1,0.3,1) forwards',
        'hero-fade-up': 'heroFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
      },
    },
  },
  plugins: [],
};
