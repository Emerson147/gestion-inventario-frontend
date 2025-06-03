/** @type {import('tailwindcss').Config} */
const PrimeUI = require('tailwindcss-primeui');

module.exports = {
  content: [
    "./src/**/*.{html,ts,scss,css}",
    "./index.html"
  ],
  important: true,
  theme: {
    screens: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      '2xl': '1920px'
    },
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        'primary-50': 'var(--primary-50)',
        'primary-100': 'var(--primary-100)',
        'primary-200': 'var(--primary-200)',
        'primary-300': 'var(--primary-300)',
        'primary-400': 'var(--primary-400)',
        'primary-500': 'var(--primary-500)',
        'primary-600': 'var(--primary-600)',
        'primary-700': 'var(--primary-700)',
        'primary-800': 'var(--primary-800)',
        'primary-900': 'var(--primary-900)'
      }
    }
  },
  corePlugins: {
    preflight: true,
  },
  plugins: [PrimeUI],
  darkMode: ['class', '[data-theme="dark"]']
}
