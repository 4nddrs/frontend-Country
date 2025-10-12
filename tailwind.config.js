/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#2a180fff",
        card: "#1e293b",
        accent: "#3b82f6",
        'sidebar-bg': "#070f24",
        'sidebar-surface': "#0d1a3a",
        'sidebar-pill': "#142449",
        'sidebar-glow': "#1ed4be",
        'sidebar-muted': "#8ca4c2",
        'sidebar-icon': "#7f9bff",
        'sidebar-active': "#1fa5ff",
        'sidebar-active-green': "#49c088",
      },
      backgroundImage: {
        'purple-gradient':
          'radial-gradient(circle at 20% 20%, rgba(127, 58, 161, 0.55) 0%, transparent 55%), radial-gradient(circle at 80% 15%, rgba(15, 8, 59, 0.6) 0%, transparent 60%), radial-gradient(circle at 50% 80%, rgba(84, 22, 181, 0.45) 0%, transparent 55%), linear-gradient(135deg, #0C0516 0%, #0F083B 35%, #5416B5 70%, #7F3AA1 100%)',
        'sidebar-gradient':
          'linear-gradient(180deg, rgba(14, 28, 60, 0.95) 0%, rgba(11, 21, 46, 0.98) 45%, rgba(7, 12, 28, 0.98) 100%)',
        'sidebar-glow':
          'radial-gradient(circle at 15% 15%, rgba(0, 102, 255, 0.55) 0%, transparent 55%), radial-gradient(circle at 85% 25%, rgba(0, 180, 255, 0.4) 0%, transparent 60%), radial-gradient(circle at 50% 100%, rgba(0, 255, 255, 0.35) 0%, transparent 70%)',
      },
      boxShadow: {
        'sidebar-inner': '0 12px 28px rgba(10, 30, 80, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'sidebar-pill': '0 12px 26px rgba(31, 165, 255, 0.22)',
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
