/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        poker: {
          green: '#1a4731',
          gold: '#d4af37',
        }
      }
    },
  },
  plugins: [],
}
