/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#050607",
        panel: "#0a0b0d",
        "panel-2": "#101215",
        "panel-3": "#14171c",
        border: "#1a1d23",
        "border-strong": "#2a2d33",
        text: "#e4e4e7",
        muted: "#6b7280",
        "muted-2": "#4a4f57",

        // Bloomberg × Palantir accents
        amber: "#ff8c00",
        "amber-dim": "#cc7000",
        terminal: "#22d36e",
        red: "#ff4d4d",
        blue: "#4aa3ff",
        yellow: "#ffb800",
        cyan: "#22d3ee",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', '"SF Mono"', "ui-monospace", "monospace"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "1.2", letterSpacing: "0.1em" }],
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "flash-up": {
          "0%": { backgroundColor: "rgba(34, 211, 110, 0.25)" },
          "100%": { backgroundColor: "transparent" },
        },
        "flash-down": {
          "0%": { backgroundColor: "rgba(255, 77, 77, 0.25)" },
          "100%": { backgroundColor: "transparent" },
        },
        "ticker-scroll": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(-2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "flash-up": "flash-up 1s ease-out",
        "flash-down": "flash-down 1s ease-out",
        "ticker-scroll": "ticker-scroll 60s linear infinite",
        "fade-in": "fade-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};
