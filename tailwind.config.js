/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#FFF3EC",
          100: "#FFE2D4",
          200: "#FFC3A8",
          300: "#FFA47C",
          400: "#FF8550",
          500: "#FF6B35",
          600: "#E5521C",
          700: "#B33F16",
          800: "#802C0F",
          900: "#4D1908",
        },
        secondary: {
          50: "#E6EEF4",
          100: "#B3CCDE",
          200: "#80AAC8",
          300: "#4D88B2",
          400: "#1A669C",
          500: "#003459",
          600: "#002A47",
          700: "#001F35",
          800: "#001524",
          900: "#000A12",
        },
        training: {
          lsd: "#10B981",
          interval: "#EF4444",
          tempo: "#F59E0B",
          easy: "#3B82F6",
          rest: "#9CA3AF",
          cross: "#8B5CF6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
