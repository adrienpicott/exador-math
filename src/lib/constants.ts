export const DIFFICULTY_CONFIG = {
  facile: {
    name: 'Facile',
    color: 'bg-green-100 text-green-800 border-green-300',
    points: 1,
    icon: '🟢'
  },
  moyen: {
    name: 'Moyen',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    points: 2,
    icon: '🟡'
  },
  difficile: {
    name: 'Difficile',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    points: 3,
    icon: '🟠'
  },
  expert: {
    name: 'Expert',
    color: 'bg-red-100 text-red-800 border-red-300',
    points: 5,
    icon: '🔴'
  },
  piege: {
    name: 'Piège',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    points: 8,
    icon: '⚡'
  }
} as const

export const CONTINENTS = [
  { 
    id: 'arithmia', 
    name: 'Arithmia', 
    description: 'Le continent des nombres et opérations',
    color: 'bg-blue-500'
  },
  { 
    id: 'algebria', 
    name: 'Algebria', 
    description: 'Le royaume des équations et expressions',
    color: 'bg-green-500'
  },
  { 
    id: 'geometria', 
    name: 'Geometria', 
    description: 'Le monde des formes et mesures',
    color: 'bg-purple-500'
  },
  { 
    id: 'analysia', 
    name: 'Analysia', 
    description: 'Le territoire des fonctions',
    color: 'bg-orange-500'
  },
  { 
    id: 'probabilia', 
    name: 'Probabilia', 
    description: 'L\'univers du hasard et des statistiques',
    color: 'bg-red-500'
  }
] as const

export const LEVEL_CONFIG = {
  1: { name: 'Apprenti Explorateur', xp_required: 0, icon: '🌱' },
  2: { name: 'Novice Aventurier', xp_required: 100, icon: '⭐' },
  3: { name: 'Chercheur Curieux', xp_required: 250, icon: '🔍' },
  4: { name: 'Découvreur Audacieux', xp_required: 500, icon: '🗺️' },
  5: { name: 'Explorateur Sage', xp_required: 1000, icon: '🧭' },
  6: { name: 'Maître Navigateur', xp_required: 2000, icon: '⛵' },
  7: { name: 'Champion des Continents', xp_required: 4000, icon: '🏆' },
  8: { name: 'Légende d\'Exador', xp_required: 8000, icon: '👑' },
  9: { name: 'Gardien des Mystères', xp_required: 15000, icon: '💎' },
  10: { name: 'Maître Suprême', xp_required: 25000, icon: '🌟' }
} as const

export const TIMER_OPTIONS = [
  { value: 10, label: '10 secondes' },
  { value: 20, label: '20 secondes' },
  { value: 30, label: '30 secondes' },
  { value: 45, label: '45 secondes' },
  { value: 60, label: '1 minute' },
  { value: 0, label: 'Illimité' }
] as const