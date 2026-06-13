/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        background: '#0B0F19',
        surface: '#111827',
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#06B6D4',
        success: '#10B981',
        textPrimary: '#FFFFFF',
        textSecondary: '#94A3B8',
        chat: {
          user: {
            text: '#FFFFFF',
            bg: '#6366F1', // primary
          },
          bot: {
            text: '#FFFFFF',
            bg: '#1F2937', // dark gray card
          }
        }
      }
    },
  },
  plugins: []
}