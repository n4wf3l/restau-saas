/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // RR Ice Brand Colors - Brun/Beige Elegant Theme
        coffee: {
          50: '#f8f6f3',
          100: '#ede8e0',
          200: '#d9cec0',
          300: '#c4b09a',
          400: '#b39476',
          500: '#a67c5d',
          600: '#8f6a4f',
          700: '#765643',
          800: '#62493a',
          900: '#523e32',
          950: '#2d201a',
        },
        cream: {
          50: '#fdfcfb',
          100: '#faf7f2',
          200: '#f5ede3',
          300: '#ede0cd',
          400: '#e3ccad',
          500: '#d4b18a',
          600: '#c49668',
          700: '#b07d4f',
          800: '#8f6544',
          900: '#74523a',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Lora', 'serif'],
      },
    },
  },
  plugins: [],
};