// constants/theme.ts — central design tokens

export const Colors = {
  // Backgrounds
  bgDark: '#060415',
  bgPanel: '#0e0b22',
  bgPanelLight: '#1a1438',
  bgGlass: 'rgba(255,255,255,0.06)',

  // Gold brand
  gold: '#f59e0b',
  goldLight: '#fbbf24',
  goldPale: '#fde68a',

  // Vivid accents
  electric: '#7c3aed',
  electricLight: '#a78bfa',
  cyan: '#22d3ee',
  cyanLight: '#67e8f9',
  pink: '#f472b6',
  pinkDeep: '#ec4899',

  // Board surfaces
  cream: '#fefce8',
  parchment: '#fef3c7',

  // Text
  textPrimary: '#f0e6ff',
  textSecondary: '#9d8ec0',
  textMuted: '#5b4d7a',

  // Status
  success: '#4ade80',
  danger: '#f87171',
  warning: '#fbbf24',
  info: '#38bdf8',

  // Property group colors — more saturated
  prop: {
    brown: '#b45309',
    lightblue: '#0891b2',
    pink: '#db2777',
    orange: '#ea580c',
    red: '#dc2626',
    yellow: '#ca8a04',
    green: '#16a34a',
    darkblue: '#1d4ed8',
  },

  // Player token colors — vivid
  playerColors: ['#f87171', '#60a5fa', '#4ade80', '#fbbf24'],
};

export const PLAYER_TOKENS = ['🔴', '🔵', '🟢', '🟡'];

// Photos for each city — using emoji + landmark icons
export const CITY_PHOTOS: Record<string, { emoji: string; landmark: string }> = {
  Pune:         { emoji: '🏛️', landmark: 'Shaniwar Wada' },
  Bangalore:    { emoji: '🌆', landmark: 'Tech Capital' },
  Chennai:      { emoji: '🌊', landmark: 'Marina Beach' },
  Hyderabad:    { emoji: '🕌', landmark: 'Charminar' },
  Kolkata:      { emoji: '🌉', landmark: 'Howrah Bridge' },
  Ahmedabad:    { emoji: '🏯', landmark: 'Sabarmati' },
  Jaipur:       { emoji: '🏰', landmark: 'Hawa Mahal' },
  Lucknow:      { emoji: '🕌', landmark: 'Bara Imambara' },
  Surat:        { emoji: '💎', landmark: 'Diamond City' },
  Kanpur:       { emoji: '🏭', landmark: 'Industrial Hub' },
  Nagpur:       { emoji: '🍊', landmark: 'Orange City' },
  'Mumbai (W)': { emoji: '🌅', landmark: 'Marine Drive' },
  'Mumbai (C)': { emoji: '🚉', landmark: 'CST Station' },
  'Mumbai (E)': { emoji: '🏙️', landmark: 'Bandra' },
  'Delhi (N)':  { emoji: '🏛️', landmark: 'Red Fort' },
  'Delhi (S)':  { emoji: '🏯', landmark: 'Qutub Minar' },
  'Delhi (E)':  { emoji: '🚪', landmark: 'India Gate' },
  Mysore:       { emoji: '🏯', landmark: 'Mysore Palace' },
  Bhopal:       { emoji: '🌊', landmark: 'Upper Lake' },
  Indore:       { emoji: '🏛️', landmark: 'Rajwada' },
  Shimla:       { emoji: '⛰️', landmark: 'The Mall' },
  Manali:       { emoji: '🏔️', landmark: 'Solang Valley' },
};
