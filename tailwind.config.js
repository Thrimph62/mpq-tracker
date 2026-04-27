/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        marvel: {
          red:    '#E62429',
          gold:   '#F0A500',
          dark:   '#2A2A45',
          card:   '#32325A',
          border: '#52527A',
          muted:  '#8888AA',
        },
        star: {
          1: '#60A5FA',  // Bleu
          2: '#4ADE80',  // Vert
          3: '#92400E',  // Bronze
          4: '#9CA3AF',  // Gris
          5: '#FACC15',  // Or
          6: '#C084FC',  // Violet
        },
        status: {
          max_champed:  '#C084FC',
          champed:      '#F97316',
          rostered:     '#4ADE80',
          not_rostered: '#9CA3AF',
          not_owned:    '#374151',
        },
        power: {
          Bleu:   '#3B82F6',
          Rouge:  '#EF4444',
          Vert:   '#22C55E',
          Noir:   '#6B7280',
          Jaune:  '#EAB308',
          Violet: '#A855F7',
        }
      },
      fontFamily: {
        marvel: ['"Bebas Neue"', 'Impact', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
