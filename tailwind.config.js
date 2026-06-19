/** @type {import('tailwindcss').Config} */
const colorVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: colorVar('--color-gold-50'),
          100: colorVar('--color-gold-100'),
          200: colorVar('--color-gold-200'),
          300: colorVar('--color-gold-300'),
          400: colorVar('--color-gold-400'),
          500: colorVar('--color-gold-500'),
          600: colorVar('--color-gold-600'),
          700: colorVar('--color-gold-700'),
          800: colorVar('--color-gold-800'),
          900: colorVar('--color-gold-900'),
        },
        dark: {
          50: colorVar('--color-dark-50'),
          100: colorVar('--color-dark-100'),
          200: colorVar('--color-dark-200'),
          300: colorVar('--color-dark-300'),
          400: colorVar('--color-dark-400'),
          500: colorVar('--color-dark-500'),
          600: colorVar('--color-dark-600'),
          700: colorVar('--color-dark-700'),
          800: colorVar('--color-dark-800'),
          900: colorVar('--color-dark-900'),
        },
        primary: {
          50: colorVar('--color-primary-50'),
          100: colorVar('--color-primary-100'),
          200: colorVar('--color-primary-200'),
          300: colorVar('--color-primary-300'),
          400: colorVar('--color-primary-400'),
          500: colorVar('--color-primary-500'),
          600: colorVar('--color-primary-600'),
          700: colorVar('--color-primary-700'),
          800: colorVar('--color-primary-800'),
          900: colorVar('--color-primary-900'),
        },
        premium: {
          light: colorVar('--color-gold-200'),
          main: colorVar('--color-gold-400'),
          dark: colorVar('--color-gold-500'),
        },
        pink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f8a5d5',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'ui-serif', 'serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        premium: '0 20px 50px color-mix(in srgb, rgb(var(--color-gold-400)) 18%, transparent)',
        'gold-glow': '0 0 20px color-mix(in srgb, rgb(var(--color-gold-400)) 30%, transparent)',
        'dark-lg': '0 20px 60px rgba(0, 0, 0, 0.28)',
        card: '0 8px 32px rgba(0, 0, 0, 0.16)',
        hover: '0 15px 40px color-mix(in srgb, rgb(var(--color-gold-400)) 22%, transparent)',
      },
      backdrop: {
        glass: 'color-mix(in srgb, rgb(var(--color-dark-800)) 80%, transparent)',
      },
    },
  },
  plugins: [],
}
