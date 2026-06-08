/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fleet: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1E3A8A', // Principal
          700: '#172554',
          800: '#0f172a',
          900: '#020617',
        },
        secondary: '#4B5563', // Secundária
        alert: '#FACC15', // Destaque/Alerta
      }
    },
  },
  plugins: [],
}
