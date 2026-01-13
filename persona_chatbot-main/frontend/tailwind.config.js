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
      },
      colors: {
        chat: {
          user: {
            text: '#2563eb', // blue-600
            bg: '#f3f4f6', // gray-100
          },
          bot: {
            text: '#7c3aed', // purple-600
            bg: '#eef2ff', // indigo-50
          }
        }
      }
    },
  },
  plugins: []
}