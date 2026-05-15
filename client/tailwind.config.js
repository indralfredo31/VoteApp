/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0F1117',
        surface: '#1A1D27',
        'surface-light': '#252836',
        primary: '#2D6A4F',
        'primary-light': '#52B788',
        accent: '#D4A574',
        'text-primary': '#FFFFFF',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
        error: '#E63946',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'float-slow': 'floatSlow 20s ease-in-out infinite',
        'float-medium': 'floatMedium 15s ease-in-out infinite',
        'float-fast': 'floatFast 12s ease-in-out infinite',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(80px, 60px) scale(1.1)' },
          '50%': { transform: 'translate(40px, 120px) scale(0.9)' },
          '75%': { transform: 'translate(-40px, 60px) scale(1.05)' },
        },
        floatMedium: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '33%': { transform: 'translate(-60px, 80px) rotate(120deg)' },
          '66%': { transform: 'translate(60px, -40px) rotate(240deg)' },
        },
        floatFast: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-100px, -60px) scale(0.85)' },
        },
      },
    },
  },
  plugins: [],
}