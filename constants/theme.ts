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

// City visual data — main landmark emoji + ambient scene elements for modal backdrop
export const CITY_PHOTOS: Record<string, { emoji: string; landmark: string; scene: string[] }> = {
  Pune:         { emoji: '🏛️', landmark: 'Shaniwar Wada',    scene: ['🌸','⚔️','🎓'] },
  Bangalore:    { emoji: '🌆', landmark: 'Tech Capital',      scene: ['💻','🌺','🌃'] },
  Chennai:      { emoji: '🌊', landmark: 'Marina Beach',      scene: ['🐚','🏖️','🌅'] },
  Hyderabad:    { emoji: '🕌', landmark: 'Charminar',         scene: ['💎','🌙','🎭'] },
  Kolkata:      { emoji: '🌉', landmark: 'Howrah Bridge',     scene: ['🎪','🌸','🎭'] },
  Ahmedabad:    { emoji: '🏯', landmark: 'Sabarmati Ashram',  scene: ['🕊️','🌿','🏮'] },
  Jaipur:       { emoji: '🏰', landmark: 'Hawa Mahal',        scene: ['🐪','🌅','💫'] },
  Lucknow:      { emoji: '🕌', landmark: 'Bara Imambara',     scene: ['🌙','🌹','✨'] },
  Surat:        { emoji: '💎', landmark: 'Diamond City',      scene: ['💍','⚡','🌟'] },
  Kanpur:       { emoji: '🏭', landmark: 'Industrial Hub',    scene: ['⚙️','🔧','💪'] },
  Nagpur:       { emoji: '🍊', landmark: 'Orange City',       scene: ['🌳','☀️','🏞️'] },
  'Mumbai (W)': { emoji: '🌅', landmark: 'Marine Drive',      scene: ['🌊','🏙️','🌃'] },
  'Mumbai (C)': { emoji: '🚉', landmark: 'CST Station',       scene: ['🎭','🌆','🗺️'] },
  'Mumbai (E)': { emoji: '🏙️', landmark: 'Bandra',            scene: ['🌉','🌊','✨'] },
  'Delhi (N)':  { emoji: '🏛️', landmark: 'Red Fort',          scene: ['🚩','🐘','🎆'] },
  'Delhi (S)':  { emoji: '🏯', landmark: 'Qutub Minar',       scene: ['🌿','📜','🌙'] },
  'Delhi (E)':  { emoji: '🚪', landmark: 'India Gate',         scene: ['🕯️','🌟','⚔️'] },
  Mysore:       { emoji: '🏯', landmark: 'Mysore Palace',     scene: ['🐘','🌺','✨'] },
  Bhopal:       { emoji: '🌊', landmark: 'Upper Lake',         scene: ['🦢','🌿','🌅'] },
  Indore:       { emoji: '🏛️', landmark: 'Rajwada Palace',    scene: ['👑','🌸','⚜️'] },
  Shimla:       { emoji: '⛰️', landmark: 'The Mall Road',     scene: ['❄️','🌲','🚂'] },
  Manali:       { emoji: '🏔️', landmark: 'Solang Valley',     scene: ['❄️','🌨️','🦌'] },
};
