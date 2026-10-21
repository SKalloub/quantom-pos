/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quantum: {
          red: '#E52328',
          dark: '#2B2B2B',
          darker: '#1F1F1F',
          gray: '#3A3A3A',
          bg: '#F4F5F7',
        }
      }
    },
  },
  plugins: [],
}