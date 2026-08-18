/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          300: '#64748b', // original 500
          400: '#475569', // original 600
          500: '#334155', // original 700
          600: '#1e293b', // original 800
        },
        gray: {
          300: '#6b7280', // original 500
          400: '#4b5563', // original 600
          500: '#374151', // original 700
          600: '#1f2937', // original 800
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
