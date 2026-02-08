/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#0a2d1d',
        'brand-gold': '#fbbf24',
        poker: {
          green: '#1a4731',
          gold: '#d4af37',
        }
      },
      fontSize: {
        'xxs': '0.65rem',
      }
    },
  },
  plugins: [],
}
