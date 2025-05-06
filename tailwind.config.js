/** @type {import('tailwindcss').Config} */

const PrimeUI=require('tailwindcss-primeui');

module.exports = {
  content: [
    "./src/**/*.{html,ts,scss,css}",
    "./index.html"
  ],
  theme: {
    screens: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      '2xl': '1920px'
    }
  },
  plugins: [PrimeUI],
  darkMode: [
    'selector', '[class="app-dark"]'
  ]
}
