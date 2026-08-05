/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // toggled by ThemeContext based on user setting (system/light/dark)
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Heading / Brand / Title -> Rajdhani ONLY, everywhere, both themes
        display: ["Rajdhani", "sans-serif"],
        // Body text + buttons -> Inter ONLY
        body: ["Inter", "sans-serif"],
      },
      colors: {
        // Backgrounds & surfaces
        bg: {
          DEFAULT: "#F7FAF9", // light mode background
          dark: "#0A0F0D", // dark mode background
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#131A17",
        },
        border: {
          DEFAULT: "#E3E9E7",
          dark: "#1E2B26",
        },
        // Brand / heading color — single source of truth per theme
        brand: {
          DEFAULT: "#00A86B", // light mode heading/brand color
          dark: "#00E68C", // dark mode heading/brand color
        },
        // Secondary accent (hover states, highlights, links)
        accent: {
          DEFAULT: "#00785A",
          dark: "#0FFCBE",
        },
        // Body text
        text: {
          DEFAULT: "#0B1210",
          dark: "#F5FFF9",
        },
        muted: {
          DEFAULT: "#5B6D67",
          dark: "#8FA69C",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
