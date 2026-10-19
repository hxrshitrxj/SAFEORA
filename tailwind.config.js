/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          950: "#060913",
          900: "#0a0f1d",
          850: "#0e1529",
          800: "#131d38",
          700: "#1d2c52",
          600: "#2a3e72",
        },
        cyber: {
          cyan: "#00f2fe",
          blue: "#4facfe",
          violet: "#7928ca",
          amber: "#f59e0b",
          red: "#ef4444",
          emerald: "#10b981",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
