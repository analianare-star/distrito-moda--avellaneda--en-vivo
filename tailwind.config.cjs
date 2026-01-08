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
          crimson: '#ED1650',
          dark: '#6A5E56',
          light: '#C1B5AB',
          bg: '#FFFFFF',
          alert: '#D32F2F',
          finished: '#999999',
        },
      },
      fontFamily: {
        serif: ['"Bodoni Moda"', 'serif'],
        sans: ['"Roboto Condensed"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/line-clamp')],
};
