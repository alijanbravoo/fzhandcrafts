/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          wine: '#6b1d30',
          'wine-dark': '#4e1220',
          'wine-light': '#842039',
          gold: '#ffdead',
          'gold-dim': '#f4bd61',
          'gold-dark': '#dca84e',
          green: '#013428',
          'green-dark': '#002018',
          'green-light': '#1e4b3e',
          sage: '#2D5A47',
          canvas: '#fbf9f6',
          surface: '#ffffff',
          'surface-muted': '#f5f3f0',
          'surface-border': '#eae8e5',
          dark: '#1b1c1a',
          muted: '#717975',
        },
        primary: {
          50: '#f2f8f5',
          100: '#e1efe9',
          200: '#c3dfd3',
          300: '#96c7b4',
          400: '#62a88f',
          500: '#013428',
          600: '#013428',
          700: '#01271e',
          800: '#002018',
          900: '#001510',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        sans: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
