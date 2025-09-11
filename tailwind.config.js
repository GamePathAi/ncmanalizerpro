/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Adicionar configuração para produção
  safelist: [
    // Classes que podem estar sendo removidas incorretamente
    'bg-gradient-to-br',
    'from-blue-50',
    'to-indigo-100',
    'shadow-sm',
    'shadow-lg',
    'hover:bg-blue-700',
    'hover:bg-green-700',
    'transition-colors'
  ]
}