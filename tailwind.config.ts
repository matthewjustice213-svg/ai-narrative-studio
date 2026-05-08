import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#06070b",
        panel: "#10131b",
        panel2: "#161b26",
        cyan: "#38d8ff",
        magenta: "#ff4fd8",
        amber: "#ffb15c"
      }
    }
  },
  plugins: []
} satisfies Config;
