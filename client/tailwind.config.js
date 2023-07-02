/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        pulse: 'pulse 2s ease-out infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { fontSize: '16px' },
          '50%': { fontSize: '18px', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}