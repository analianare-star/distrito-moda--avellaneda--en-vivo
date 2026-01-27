/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './firebase.ts',
    './constants.ts',
    './types.ts',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dm: {
          crimson: '#FF1F6A',
          dark: '#1F1A1C',
          light: '#E6DED5',
          bg: '#FFFFFF',
          alert: '#FF3B3B',
          finished: '#6B6B6B',
        },
      },
      fontFamily: {
        serif: ['"Sora"', 'sans-serif'],
        sans: ['"Manrope"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function ({ addUtilities }) {
      addUtilities({
        '.no-scrollbar::-webkit-scrollbar': {
          display: 'none',
        },
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
      });
    },
  ],
};
