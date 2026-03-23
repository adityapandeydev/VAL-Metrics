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
          obsidian: '#0B0E14',
          dark: '#0F141F',
          card: '#161D2C',
          cardHover: '#1E273A',
          border: '#232D42',
          muted: '#8E9BB4',
        },
      },
      boxShadow: {
        'glow-red': '0 0 25px -5px rgba(255, 70, 85, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(0, 229, 255, 0.35)',
        'glow-gold': '0 0 25px -5px rgba(234, 166, 48, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'tactical-grid': "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}
