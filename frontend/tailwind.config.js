/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f4',
          100: '#fde6e9',
          200: '#fbd0d9',
          300: '#f7a9b8',
          400: '#f27793',
          500: '#e84c70',
          600: '#d42d5c',
          700: '#b2204c',
          800: '#951d45',
          900: '#7f1c40',
        },
      },
    },
  },
  plugins: [],
}
