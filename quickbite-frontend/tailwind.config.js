/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff3ef",
          100: "#ffe4da",
          400: "#ff7d55",
          500: "#ff5a36",
          600: "#eb4620",
          700: "#c53616",
        },
        ink: "#14121a",
        muted: "#6b7280",
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(20, 18, 26, 0.06), 0 8px 24px rgba(20, 18, 26, 0.05)",
        glow: "0 10px 24px rgba(255, 90, 54, 0.28)",
      },
    },
  },
  plugins: [],
};
