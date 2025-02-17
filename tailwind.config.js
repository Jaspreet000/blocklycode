/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4C51BF",
          50: "#E8E9F7",
          100: "#D5D6F1",
          200: "#AFB1E5",
          300: "#898CD9",
          400: "#6367CD",
          500: "#4C51BF",
          600: "#3B3F96",
          700: "#2B2E6E",
          800: "#1B1D45",
          900: "#0C0C1D",
        },
        secondary: {
          DEFAULT: "#48BB78",
          50: "#E9F5EF",
          100: "#D4EBE0",
          200: "#A9D8C1",
          300: "#7EC4A2",
          400: "#53B183",
          500: "#48BB78",
          600: "#38945F",
          700: "#296D46",
          800: "#1A462D",
          900: "#0B1F14",
        },
        background: {
          DEFAULT: "#F7FAFC",
          dark: "#EDF2F7",
        },
      },
      animation: {
        "bounce-slow": "bounce 3s linear infinite",
        "fade-in": "fadeIn 0.5s ease-in",
        "slide-in": "slideIn 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      boxShadow: {
        "inner-lg": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
