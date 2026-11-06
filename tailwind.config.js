/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tesla: {
          dark: '#0a0b0e',
          card: '#16181f',
          border: '#272a37',
          accent: '#3e6ae1',
          red: '#e82127',
          green: '#10b981',
          muted: '#8e92a4',
        }
      },
      minHeight: {
        'touch': '56px',
      },
      minWidth: {
        'touch': '56px',
      }
    },
  },
  plugins: [],
}
