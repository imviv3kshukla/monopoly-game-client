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

  // Property group colors (4 groups: red, yellow, green, blue)
  prop: {
    red:    '#dc2626',
    yellow: '#ca8a04',
    green:  '#16a34a',
    blue:   '#1d4ed8',
  },

  // Player token colors — vivid
  playerColors: ['#f87171', '#60a5fa', '#4ade80', '#fbbf24'],
};

export const PLAYER_TOKENS = ['🔴', '🔵', '🟢', '🟡'];

// Landmark icons for transport, utility, and city tiles
export const TILE_ICONS: Record<string, string> = {
  // Transports
  Roadways:    '🚌',
  Railways:    '🚂',
  Waterways:   '🚢',
  Airways:     '✈️',
  // Utilities
  Electricity: '💡',
  Internet:    '🌐',
  // Cities (landmark emoji)
  Mumbai:      '🌅',
  Delhi:       '🏛️',
  Bangalore:   '🌆',
  Chennai:     '🌊',
  Pune:        '🏯',
  Kolkata:     '🌉',
  Ahmedabad:   '🕌',
  Hyderabad:   '🕌',
  Goa:         '🏖️',
  Amritsar:    '🛕',
  Jaipur:      '🏰',
  Indore:      '🏛️',
  Patna:       '🏛️',
  Kanpur:      '🏭',
  Agra:        '🕌',
  Cochin:      '⛵',
  Chandigarh:  '🌳',
  Shimla:      '⛰️',
  Ladakh:      '🏔️',
  Darjeeling:  '🍃',
};

// City visual data — main landmark emoji + ambient scene elements for modal backdrop
export const CITY_PHOTOS: Record<string, { emoji: string; landmark: string; scene: string[] }> = {
  Cochin:      { emoji: '⛵', landmark: 'Fort Kochi',          scene: ['🌊', '🏖️', '⚓'] },
  Patna:       { emoji: '🏛️', landmark: 'Golghar',             scene: ['🌊', '📜', '🌿'] },
  Indore:      { emoji: '🏛️', landmark: 'Rajwada Palace',      scene: ['👑', '🌸', '⚜️'] },
  Pune:        { emoji: '🏛️', landmark: 'Shaniwar Wada',       scene: ['🌸', '⚔️', '🎓'] },
  Kolkata:     { emoji: '🌉', landmark: 'Howrah Bridge',        scene: ['🎪', '🌸', '🎭'] },
  Ahmedabad:   { emoji: '🕌', landmark: 'Sabarmati Ashram',     scene: ['🕊️', '🌿', '🏮'] },
  Delhi:       { emoji: '🏛️', landmark: 'India Gate',           scene: ['🕯️', '🌟', '🚩'] },
  Mumbai:      { emoji: '🌅', landmark: 'Marine Drive',         scene: ['🌊', '🏙️', '🌃'] },
  Jaipur:      { emoji: '🏰', landmark: 'Hawa Mahal',           scene: ['🐪', '🌅', '💫'] },
  Kanpur:      { emoji: '🏭', landmark: 'Industrial Hub',       scene: ['⚙️', '🔧', '💪'] },
  Agra:        { emoji: '🕌', landmark: 'Taj Mahal',            scene: ['🌹', '🌙', '✨'] },
  Chandigarh:  { emoji: '🌳', landmark: 'Rock Garden',          scene: ['🌺', '🦋', '💐'] },
  Shimla:      { emoji: '⛰️', landmark: 'The Mall Road',        scene: ['❄️', '🌲', '🚂'] },
  Ladakh:      { emoji: '🏔️', landmark: 'Pangong Lake',         scene: ['❄️', '🌨️', '🦅'] },
  Darjeeling:  { emoji: '🍃', landmark: 'Tiger Hill',           scene: ['☁️', '🚂', '🌄'] },
  Hyderabad:   { emoji: '🕌', landmark: 'Charminar',            scene: ['💎', '🌙', '🎭'] },
  Goa:         { emoji: '🏖️', landmark: 'Baga Beach',           scene: ['🌴', '🌊', '🎵'] },
  Amritsar:    { emoji: '🛕', landmark: 'Golden Temple',        scene: ['✨', '🌅', '🙏'] },
  Bangalore:   { emoji: '🌆', landmark: 'Tech Capital',         scene: ['💻', '🌺', '🌃'] },
  Chennai:     { emoji: '🌊', landmark: 'Marina Beach',         scene: ['🐚', '🏖️', '🌅'] },
};
