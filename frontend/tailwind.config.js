/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        tactical: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        val: {
          red: '#FF4655',
          redHover: '#E03342',
          gold: '#EAA630',
          cyan: '#00E5FF',
          emerald: '#10B981',
          obsidian: '#070A10',
          dark: '#0B0F17',
          surface: '#111726',
          surfaceHover: '#172036',
          card: '#0E1422',
          cardHover: '#161F33',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(255, 255, 255, 0.18)',
          muted: '#8E9BB4',
          purple: '#A855F7',
          rose: '#F43F5E',
        },
      },
      boxShadow: {
        'glow-red': '0 0 25px -5px rgba(255, 70, 85, 0.45)',
        'glow-cyan': '0 0 25px -5px rgba(0, 229, 255, 0.4)',
        'glow-gold': '0 0 25px -5px rgba(234, 166, 48, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
        'glow-purple': '0 0 25px -5px rgba(168, 85, 247, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        'specular': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      },
      backgroundImage: {
        'tactical-grid': "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        'mesh-dark': "radial-gradient(ellipse 80% 80% at 50% -20%, rgba(0, 229, 255, 0.07), rgba(255, 255, 255, 0))",
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
      }
    },
  },
  plugins: [],
}
