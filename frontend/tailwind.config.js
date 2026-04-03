/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        usv: {
          blue: '#1a3a5c',
          light: '#2c5f8a',
        }
      }
    },
  },
  plugins: [],
}
