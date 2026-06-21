/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Oswald', 'Impact', 'sans-serif'],
      },
      colors: {
        'brand-green': '#0a2d1d',
        'brand-gold': '#fbbf24',
        poker: {
          green: '#1a4731',
          felt: '#1b5e3b',
          gold: '#d4af37',
          dark: '#0d2818',
        }
      },
      fontSize: {
        'xxs': '0.65rem',
      },
      boxShadow: {
        'card': '0 4px 16px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)',
        'card-hover': '0 14px 35px rgba(0,0,0,0.35), 0 5px 15px rgba(0,0,0,0.2)',
        'gold-glow': '0 0 20px rgba(251,191,36,0.3)',
      }
    },
  },
  plugins: [],
}
