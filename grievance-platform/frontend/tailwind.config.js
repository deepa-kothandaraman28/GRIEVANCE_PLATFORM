/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1C2541',
          light: '#2C3A5E',
          dark: '#12182E',
        },
        paper: '#F7F5EF',
        teal: {
          DEFAULT: '#1F6F63',
          light: '#2C8C7D',
          dark: '#154E45',
        },
        seal: {
          DEFAULT: '#C97A1E',
          light: '#E0A24E',
        },
        alert: '#B3261E',
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
