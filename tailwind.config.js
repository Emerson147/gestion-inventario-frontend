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
        // ===== COLORES PRINCIPALES (Brand) =====
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Indigo-500
          600: '#4f46e5', // Indigo-600 (Principal)
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
          DEFAULT: '#4f46e5',
        },
        
        // ===== NEUTRALES (Conectado a PrimeNG Theme) =====
        surface: {
          0: 'var(--p-surface-0)',     // Blanco puro / Negro puro
          50: 'var(--p-surface-50)',   // Muy claro / Muy oscuro
          100: 'var(--p-surface-100)', // Claro / Oscuro
          200: 'var(--p-surface-200)', // Bordes claros
          300: 'var(--p-surface-300)',
          400: 'var(--p-surface-400)',
          500: 'var(--p-surface-500)', // Medio
          600: 'var(--p-surface-600)',
          700: 'var(--p-surface-700)', // Bordes oscuros
          800: 'var(--p-surface-800)', // Fondos oscuros
          900: 'var(--p-surface-900)', // Muy oscuro / Muy claro
          950: 'var(--p-surface-950)', // Negro intenso
        },
        
        // ===== ALIAS: Slate → Surface (Para compatibilidad) =====
        slate: {
          50: 'var(--p-surface-50)',
          100: 'var(--p-surface-100)',
          200: 'var(--p-surface-200)',
          300: 'var(--p-surface-300)',
          400: 'var(--p-surface-400)',
          500: 'var(--p-surface-500)',
          600: 'var(--p-surface-600)',
          700: 'var(--p-surface-700)',
          800: 'var(--p-surface-800)',
          900: 'var(--p-surface-900)',
          950: 'var(--p-surface-950)',
        },
        
        // ===== COLORES SECUNDARIOS =====
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        
        violet: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        
        // ===== COLORES SEMÁNTICOS =====
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Success principal
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Warning principal
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e', // Danger principal
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Info principal
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    }
  },
  corePlugins: {
    preflight: true,
  },
  plugins: [PrimeUI],
  darkMode: ['class', '.app-dark']
}
