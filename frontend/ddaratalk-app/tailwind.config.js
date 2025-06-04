/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#123458',
        'secondary': '#D4C9BE', 
        'light': '#F1EFEC',
        'dark': '#030303',
      }
    },
  },
  plugins: [],
}