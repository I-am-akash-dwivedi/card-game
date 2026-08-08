/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Ganjifa lacquer palette — indigo ground, marigold and brass accents,
        // warm chalk for card stock. Deliberately not casino green.
        ink: {
          DEFAULT: "#0E1A2B",
          raised: "#16263D",
          line: "#22374F",
        },
        marigold: "#F2A93B",
        madder: "#C8322F",
        brass: "#C9A227",
        chalk: {
          DEFAULT: "#EDE6D8",
          dim: "#A9A192",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 6px rgba(0,0,0,.35), 0 12px 24px -12px rgba(0,0,0,.55)",
        lifted: "0 8px 18px rgba(0,0,0,.4), 0 24px 48px -18px rgba(0,0,0,.6)",
      },
    },
  },
  plugins: [],
};
