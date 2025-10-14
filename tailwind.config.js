/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
theme: {
  extend: {
    fontFamily: {
      medieval: ['MedievalSharp', 'cursive'],
      pixel: ['"Press Start 2P"', 'cursive'],
    },
    colors: {
      primary: '#3a0ca3',
      secondary: '#7209b7',
      accent: '#f72585',
      dark: '#1a1a2e',
      light: '#f8f9fa',
    },
    backgroundImage: {
      'paper': "url('https://www.transparenttextures.com/patterns/black-paper.png')",
    },
    keyframes: {
      pulse: {
        '0%, 100%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.05)' },
      },
    },
    animation: {
      pulse: 'pulse 1.5s infinite',
    },
  },
}
,
  plugins: [],
}

