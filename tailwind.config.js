/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a", // Azul oscuro
        card: "#1e293b",       // Azul intermedio
        accent: "#3b82f6",     // Azul brillante
      },
    },
  },
  plugins: [],
}
