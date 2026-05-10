// constants/board.ts — board data for Little Business (36 tiles, 9 per side)

export interface BoardSpace {
  id: number;
  name: string;
  type: 'start' | 'property' | 'transport' | 'utility' | 'tax'
      | 'chance' | 'community' | 'jail' | 'club' | 'rest_house';
  color?: string;
  price?: number;
  rent?: number[];
  houseCost?: number;
  taxAmount?: number;
}

// 36 tiles total: corners at 0, 8, 17, 26 — 7 non-corner tiles per side
export const BOARD: BoardSpace[] = [
  // Bottom row (right to left from START): 0-8
  { id: 0,  name: 'START',       type: 'start' },
  { id: 1,  name: 'Cochin',      type: 'property',  color: 'red',    price: 3000, rent: [400, 2200, 3500, 5000, 6500, 6500],   houseCost: 4500 },
  { id: 2,  name: 'Patna',       type: 'property',  color: 'blue',   price: 2000, rent: [100, 1000, 1600, 2500, 3500, 3500],   houseCost: 3000 },
  { id: 3,  name: 'Indore',      type: 'property',  color: 'blue',   price: 1500, rent: [200, 1500, 2700, 4500, 5500, 5500],   houseCost: 2000 },
  { id: 4,  name: 'Income Tax',  type: 'tax',       taxAmount: 2000 },
  { id: 5,  name: 'Roadways',    type: 'transport', price: 3500 },
  { id: 6,  name: 'Chance',      type: 'chance' },
  { id: 7,  name: 'Pune',        type: 'property',  color: 'green',  price: 3000, rent: [200, 900, 1600, 2500, 4500, 4500],    houseCost: 3000 },
  { id: 8,  name: 'JAIL',        type: 'jail' },

  // Left column (bottom to top): 9-16
  { id: 9,  name: 'Kolkata',     type: 'property',  color: 'green',  price: 4000, rent: [400, 1500, 3000, 4200, 5000, 5000],   houseCost: 3500 },
  { id: 10, name: 'Electricity', type: 'utility',   price: 3500 },
  { id: 11, name: 'Ahmedabad',   type: 'property',  color: 'green',  price: 3500, rent: [200, 1500, 2500, 3500, 4500, 4500],   houseCost: 3000 },
  { id: 12, name: 'Internet',    type: 'utility',   price: 6000 },
  { id: 13, name: 'Hyderabad',   type: 'property',  color: 'yellow', price: 3500, rent: [200, 1200, 2600, 3500, 5000, 5000],   houseCost: 3000 },
  { id: 14, name: 'Community Chest', type: 'community' },
  { id: 15, name: 'Goa',         type: 'property',  color: 'yellow', price: 4000, rent: [700, 2300, 4300, 5500, 7500, 7500],   houseCost: 5000 },
  { id: 16, name: 'Amritsar',    type: 'property',  color: 'yellow', price: 4500, rent: [300, 1400, 2800, 4000, 5500, 5500],   houseCost: 4500 },
  { id: 17, name: 'CLUB',        type: 'club' },

  // Top row (left to right): 18-25
  { id: 18, name: 'Bangalore',   type: 'property',  color: 'yellow', price: 5000, rent: [900, 3500, 5000, 6500, 7500, 7500],   houseCost: 4500 },
  { id: 19, name: 'Chance',      type: 'chance' },
  { id: 20, name: 'Chennai',     type: 'property',  color: 'yellow', price: 7000, rent: [200, 1500, 3000, 4500, 5500, 5500],   houseCost: 4500 },
  { id: 21, name: 'Waterways',   type: 'transport', price: 3000 },
  { id: 22, name: 'Delhi',       type: 'property',  color: 'green',  price: 6000, rent: [500, 1500, 2700, 4500, 5500, 5500],   houseCost: 4000 },
  { id: 23, name: 'Mumbai',      type: 'property',  color: 'green',  price: 9000, rent: [900, 3500, 5000, 7000, 8500, 8500],   houseCost: 3500 },
  { id: 24, name: 'Airways',     type: 'transport', price: 11000 },
  { id: 25, name: 'Wealth Tax',  type: 'tax',       taxAmount: 1500 },
  { id: 26, name: 'REST_HOUSE',  type: 'rest_house' },

  // Right column (top to bottom): 27-35
  { id: 27, name: 'Shimla',      type: 'property',  color: 'red',    price: 3500, rent: [500, 1200, 2500, 4500, 6500, 6500],   houseCost: 3000 },
  { id: 28, name: 'Ladakh',      type: 'property',  color: 'red',    price: 6500, rent: [800, 3300, 4500, 5500, 7500, 7500],   houseCost: 6000 },
  { id: 29, name: 'Darjeeling',  type: 'property',  color: 'red',    price: 2500, rent: [300, 1200, 2500, 4000, 6000, 6000],   houseCost: 7500 },
  { id: 30, name: 'Community Chest', type: 'community' },
  { id: 31, name: 'Chandigarh',  type: 'property',  color: 'red',    price: 4000, rent: [300, 1200, 3000, 4500, 6000, 6000],   houseCost: 5000 },
  { id: 32, name: 'Railways',    type: 'transport', price: 9500 },
  { id: 33, name: 'Jaipur',      type: 'property',  color: 'blue',   price: 3000, rent: [200, 800, 1600, 2300, 4500, 4500],    houseCost: 2500 },
  { id: 34, name: 'Kanpur',      type: 'property',  color: 'blue',   price: 4000, rent: [400, 1500, 3000, 4500, 5500, 5500],   houseCost: 4500 },
  { id: 35, name: 'Agra',        type: 'property',  color: 'blue',   price: 6500, rent: [100, 600, 1500, 2500, 4500, 4500],    houseCost: 2000 },
];

// Grid position [row, col] in a 10×10 grid
// Corners: 0=BR(START), 8=BL(JAIL), 17=TL(CLUB), 26=TR(REST_HOUSE)
export function getGridPos(id: number): [number, number] {
  if (id === 0)   return [10, 10];           // bottom-right (START)
  if (id <= 7)    return [10, 10 - id];      // bottom row going left
  if (id === 8)   return [10, 1];            // bottom-left (JAIL)
  if (id <= 16)   return [10 - (id - 8), 1]; // left column going up
  if (id === 17)  return [1, 1];             // top-left (CLUB)
  if (id <= 25)   return [1, 1 + (id - 17)]; // top row going right
  if (id === 26)  return [1, 10];            // top-right (REST_HOUSE)
  return [1 + (id - 26), 10];               // right column going down
}

export function getSide(id: number): 'corner' | 'bottom' | 'left' | 'top' | 'right' {
  if ([0, 8, 17, 26].includes(id)) return 'corner';
  if (id >= 1 && id <= 7)  return 'bottom';
  if (id >= 9 && id <= 16) return 'left';
  if (id >= 18 && id <= 25) return 'top';
  return 'right'; // 27–35
}
