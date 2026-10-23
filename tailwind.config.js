/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  extend: {
      keyframes: {
        blink: {
          '0%': { opacity: '0.2', transform: 'translateY(0px)' },
          '50%': { opacity: '1', transform: 'translateY(-3px)' },
          '100%': { opacity: '0.2', transform: 'translateY(0px)' },
        },
      },
      animation: {
        blink: 'blink 1.4s infinite both',
      },
    },
  plugins: [],
}
