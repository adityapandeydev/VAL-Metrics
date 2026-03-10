/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        valorant: {
          red: "#FF4655",
          emerald: "#00FF87",
          cyan: "#00E5FF",
          dark: "#0F1318",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Outfit"', "monospace"],
      },
    },
  },
  plugins: [],
};
