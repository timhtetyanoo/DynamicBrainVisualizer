/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {fontFamily: {sans: ['Roboto', 'sans-serif']},
  gridTemplateColumns: {
    'auto-fit': 'repeat(auto-fit, minmax(250px, 1fr))',},
  },
},
  plugins: [],
};