/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdfbf7',
          100: '#f8f2e9',
          200: '#f0e3ce',
          300: '#e5ceac',
          400: '#c49a62',
          500: '#ac834e',
          600: '#ac834e',
          700: '#8e6939',
          800: '#75542b',
          900: '#5c4120',
        },
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#383838',
          700: '#282828',
          800: '#1c1c1c',
          900: '#141414',
          950: '#0e0e0e',
        },
        gold: {
          DEFAULT: '#ac834e',
          light: '#c49a62',
          dark: '#8e6939',
          400: '#ac834e',
          500: '#ac834e',
          600: '#946f3e',
        },
        brand: {
          gold: '#ac834e',
          white: '#ffffff',
          dark: '#0e0e0e',
        },
      },
      fontFamily: {
        'sans': ['"Plus Jakarta Sans"', 'sans-serif'],
        'display': ['"Plus Jakarta Sans"', 'sans-serif'],
        'body': ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '104': '26rem',
        '112': '28rem',
        '128': '32rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'gold-glow': '0 0 25px rgba(172, 131, 78, 0.25)',
        'gold-glow-lg': '0 0 45px rgba(172, 131, 78, 0.35)',
        'gold-glow-sm': '0 0 12px rgba(172, 131, 78, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};