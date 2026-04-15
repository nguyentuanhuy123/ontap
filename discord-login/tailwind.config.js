/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'discord-bg': '#313338',
        'discord-input': '#1E1F22',
        'discord-blue': '#5865F2',
        'discord-blue-hover': '#4752C4',
        'discord-text-muted': '#B5BAC1',
        'discord-link': '#00A8FC',
      }
    },
  },
  plugins: [],
}

