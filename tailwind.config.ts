import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2751FF",
          red: "#FF3B52",
        },
      },
      boxShadow: {
        card: "0 10px 30px rgba(15, 23, 42, .07)",
        pill: "inset 0 -2px rgba(0,0,0,.08), 0 2px 6px rgba(15,23,42,.06)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
