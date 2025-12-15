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
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad7ac',
          300: '#f6ba77',
          400: '#f19340',
          500: '#ed7519',
          600: '#de5b0f',
          700: '#b8440f',
          800: '#933714',
          900: '#773014',
        }
      }
    },
  },
  plugins: [],
}
