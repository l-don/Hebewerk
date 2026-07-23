/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Patrick Hand"', 'cursive', 'sans-serif'],
        body: ['"Kalam"', 'cursive', 'sans-serif'],
        sans: ['"Kalam"', 'cursive', 'sans-serif'],
        display: ['"Patrick Hand"', 'cursive', 'sans-serif'],
        mono: ['"Kalam"', 'monospace'],
      },
      colors: {
        paper: {
          DEFAULT: '#F6F4EB',
          light: '#FAF8F2',
          card: '#FFFFFF',
          dark: '#EFECE6',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          subtle: '#2D3748',
          muted: '#718096',
          light: '#A0AEC0',
        },
        highlight: {
          yellow: '#FEF08A',
          yellowDark: '#FDE047',
          amber: '#F59E0B',
        },
        'forge-amber': '#d97706',
        'forge-gold': '#f59e0b',
        'steel-cyan': '#0284c7',
        iron: {
          950: '#F6F4EB',
          900: '#FAF8F2',
          850: '#FFFFFF',
          800: '#E5E7EB',
          700: '#CBD5E1',
          600: '#94A3B8',
          500: '#64748B',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
