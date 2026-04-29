// constants/theme.ts — central design tokens

export const Colors = {
  // Brand
  bgDark: '#0a0612',
  bgPanel: '#16102a',
  bgPanelLight: '#1f1838',
  gold: '#d4a017',
  goldLight: '#f5d060',
  goldPale: '#fce9b6',
  cream: '#f8f2e4',
  parchment: '#ede3cc',

  // Text
  textPrimary: '#f8f2e4',
  textSecondary: '#a89a7d',
  textMuted: '#6b5d4a',

  // Status
  success: '#2ecc71',
  danger: '#e74c3c',
  warning: '#f39c12',
  info: '#3498db',

  // Property colors
  prop: {
    brown: '#8B4513',
    lightblue: '#5dade2',
    pink: '#e91e8c',
    orange: '#e67e22',
    red: '#e74c3c',
    yellow: '#f1c40f',
    green: '#27ae60',
    darkblue: '#1565c0',
  },

  // Player tokens
  playerColors: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'],
};

export const PLAYER_TOKENS = ['🔴', '🔵', '🟢', '🟡'];

// Photos for each city — using emoji + landmark icons
export const CITY_PHOTOS: Record<string, { emoji: string; landmark: string }> = {
  Pune:        { emoji: '🏛️', landmark: 'Shaniwar Wada' },
  Bangalore:   { emoji: '🌆', landmark: 'Tech Capital' },
  Chennai:     { emoji: '🌊', landmark: 'Marina Beach' },
  Hyderabad:   { emoji: '🕌', landmark: 'Charminar' },
  Kolkata:     { emoji: '🌉', landmark: 'Howrah Bridge' },
  Ahmedabad:   { emoji: '🏯', landmark: 'Sabarmati' },
  Jaipur:      { emoji: '🏰', landmark: 'Hawa Mahal' },
  Lucknow:     { emoji: '🕌', landmark: 'Bara Imambara' },
  Surat:       { emoji: '💎', landmark: 'Diamond City' },
  Kanpur:      { emoji: '🏭', landmark: 'Industrial Hub' },
  Nagpur:      { emoji: '🍊', landmark: 'Orange City' },
  'Mumbai (W)': { emoji: '🌅', landmark: 'Marine Drive' },
  'Mumbai (C)': { emoji: '🚉', landmark: 'CST Station' },
  'Mumbai (E)': { emoji: '🏙️', landmark: 'Bandra' },
  'Delhi (N)': { emoji: '🏛️', landmark: 'Red Fort' },
  'Delhi (S)': { emoji: '🏯', landmark: 'Qutub Minar' },
  'Delhi (E)': { emoji: '🚪', landmark: 'India Gate' },
  Mysore:      { emoji: '🏯', landmark: 'Mysore Palace' },
  Bhopal:      { emoji: '🌊', landmark: 'Upper Lake' },
  Indore:      { emoji: '🏛️', landmark: 'Rajwada' },
  Shimla:      { emoji: '⛰️', landmark: 'The Mall' },
  Manali:      { emoji: '🏔️', landmark: 'Solang Valley' },
};
