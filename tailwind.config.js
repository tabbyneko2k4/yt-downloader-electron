/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./mini.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kawaii: {
          pink: {
            50: '#fdf2f8',
            100: '#fce7f3',
            200: '#fbcfe8',
            300: '#f472b6',
            400: '#f472b6',
            500: '#ec4899',
            600: '#db2777',
            700: '#be185d',
          },
          blue: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0284c7',
            600: '#0369a1',
            700: '#075985',
          },
          cyan: '#06b6d4',
          purple: '#c084fc',
          darkBg: '#0b0f19',
          lightBg: '#f8fafc',
          cardDark: 'rgba(17, 24, 39, 0.75)',
          cardLight: 'rgba(255, 255, 255, 0.85)',
        }
      },
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'kawaii-glow': '0 0 25px rgba(56, 189, 248, 0.25)',
        'pink-glow': '0 0 25px rgba(236, 72, 153, 0.25)',
        'cyber-glow': '0 0 35px rgba(192, 132, 252, 0.2)',
        'light-glow': '0 10px 30px -5px rgba(56, 189, 248, 0.15), 0 4px 12px rgba(236, 72, 153, 0.1)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translate3d(0, 12px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.015)' },
        },
        floatBg: {
          '0%, 100%': { transform: 'translate3d(0, 0px, 0) rotate(0deg)' },
          '50%': { transform: 'translate3d(0, -6px, 0) rotate(1.5deg)' },
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float': 'floatBg 6s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
