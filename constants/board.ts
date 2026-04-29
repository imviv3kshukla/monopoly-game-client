// constants/board.ts — board data + rules text (36 tiles: 8 non-corner per side)

export interface BoardSpace {
  id: number;
  name: string;
  type: 'go' | 'property' | 'railroad' | 'utility' | 'tax' | 'chance' | 'community' | 'jail' | 'gotojail' | 'freeparking';
  color?: string;
  price?: number;
  rent?: number[];
  houseCost?: number;
  taxAmount?: number;
}

// 36 tiles total: corners at 0, 9, 18, 27 — 8 non-corner tiles per side
// Removed: 1 Community Chest per side (bottom/left/right) + 1 Chance from top
export const BOARD: BoardSpace[] = [
  // ── Bottom side (GO → Jail) ──────────────────────────────────────────────
  { id: 0,  name: 'GO',          type: 'go' },
  { id: 1,  name: 'Pune',        type: 'property',  color: 'brown',    price: 600,  rent: [20,100,300,900,1600,2500],      houseCost: 500 },
  { id: 2,  name: 'Bangalore',   type: 'property',  color: 'brown',    price: 600,  rent: [40,200,600,1800,3200,4500],     houseCost: 500 },
  { id: 3,  name: 'Income Tax',  type: 'tax',       taxAmount: 2000 },
  { id: 4,  name: 'Howrah Rly',  type: 'railroad',  price: 2000 },
  { id: 5,  name: 'Chennai',     type: 'property',  color: 'lightblue',price: 1000, rent: [60,300,900,2700,4000,5500],     houseCost: 500 },
  { id: 6,  name: 'Chance',      type: 'chance' },
  { id: 7,  name: 'Hyderabad',   type: 'property',  color: 'lightblue',price: 1000, rent: [60,300,900,2700,4000,5500],     houseCost: 500 },
  { id: 8,  name: 'Kolkata',     type: 'property',  color: 'lightblue',price: 1200, rent: [80,400,1000,3000,4500,6000],    houseCost: 500 },

  // ── Left side (Jail → Free Parking) ─────────────────────────────────────
  { id: 9,  name: 'Jail',        type: 'jail' },
  { id: 10, name: 'Ahmedabad',   type: 'property',  color: 'pink',     price: 1400, rent: [100,500,1500,4500,6250,7500],   houseCost: 1000 },
  { id: 11, name: 'Electric Co.',type: 'utility',   price: 1500 },
  { id: 12, name: 'Jaipur',      type: 'property',  color: 'pink',     price: 1400, rent: [100,500,1500,4500,6250,7500],   houseCost: 1000 },
  { id: 13, name: 'Lucknow',     type: 'property',  color: 'pink',     price: 1600, rent: [120,600,1800,5000,7000,9000],   houseCost: 1000 },
  { id: 14, name: 'Central Rly', type: 'railroad',  price: 2000 },
  { id: 15, name: 'Surat',       type: 'property',  color: 'orange',   price: 1800, rent: [140,700,2000,5500,7500,9500],   houseCost: 1000 },
  { id: 16, name: 'Kanpur',      type: 'property',  color: 'orange',   price: 1800, rent: [140,700,2000,5500,7500,9500],   houseCost: 1000 },
  { id: 17, name: 'Nagpur',      type: 'property',  color: 'orange',   price: 2000, rent: [160,800,2200,6000,8000,10000],  houseCost: 1000 },

  // ── Top side (Free Parking → Go To Jail) ────────────────────────────────
  { id: 18, name: 'Free Parking',type: 'freeparking' },
  { id: 19, name: 'Mumbai (W)',  type: 'property',  color: 'red',      price: 2200, rent: [180,900,2500,7000,8750,10500],  houseCost: 1500 },
  { id: 20, name: 'Mumbai (C)',  type: 'property',  color: 'red',      price: 2200, rent: [180,900,2500,7000,8750,10500],  houseCost: 1500 },
  { id: 21, name: 'Mumbai (E)',  type: 'property',  color: 'red',      price: 2400, rent: [200,1000,3000,7500,9250,11000], houseCost: 1500 },
  { id: 22, name: 'Western Rly', type: 'railroad',  price: 2000 },
  { id: 23, name: 'Delhi (N)',   type: 'property',  color: 'yellow',   price: 2600, rent: [220,1100,3300,8000,9750,11500], houseCost: 1500 },
  { id: 24, name: 'Delhi (S)',   type: 'property',  color: 'yellow',   price: 2600, rent: [220,1100,3300,8000,9750,11500], houseCost: 1500 },
  { id: 25, name: 'Water Works', type: 'utility',   price: 1500 },
  { id: 26, name: 'Delhi (E)',   type: 'property',  color: 'yellow',   price: 2800, rent: [240,1200,3600,8500,10250,12000],houseCost: 1500 },

  // ── Right side (Go To Jail → GO) ────────────────────────────────────────
  { id: 27, name: 'Go To Jail',  type: 'gotojail' },
  { id: 28, name: 'Mysore',      type: 'property',  color: 'green',    price: 3000, rent: [260,1300,3900,9000,11000,12750], houseCost: 2000 },
  { id: 29, name: 'Bhopal',      type: 'property',  color: 'green',    price: 3000, rent: [260,1300,3900,9000,11000,12750], houseCost: 2000 },
  { id: 30, name: 'Indore',      type: 'property',  color: 'green',    price: 3200, rent: [280,1500,4500,10000,12000,14000],houseCost: 2000 },
  { id: 31, name: 'Southern Rly',type: 'railroad',  price: 2000 },
  { id: 32, name: 'Chance',      type: 'chance' },
  { id: 33, name: 'Shimla',      type: 'property',  color: 'darkblue', price: 3500, rent: [350,1750,5000,11000,13000,15000],houseCost: 2000 },
  { id: 34, name: 'Luxury Tax',  type: 'tax',       taxAmount: 1000 },
  { id: 35, name: 'Manali',      type: 'property',  color: 'darkblue', price: 4000, rent: [500,2000,6000,14000,17000,20000],houseCost: 2000 },
];

// Grid position [row, col] in a 10×10 grid (corners at 0,9,18,27)
export function getGridPos(id: number): [number, number] {
  if (id === 0)  return [10, 10]; // GO
  if (id <= 8)   return [10, 10 - id]; // bottom: [10,9]→[10,2]
  if (id === 9)  return [10, 1];  // Jail
  if (id <= 17)  return [19 - id, 1]; // left: [9,1]→[2,1]
  if (id === 18) return [1, 1];   // Free Parking
  if (id <= 26)  return [1, id - 17]; // top: [1,2]→[1,9]
  if (id === 27) return [1, 10];  // Go To Jail
  return [id - 26, 10]; // right: [2,10]→[9,10]
}

export function getSide(id: number): 'corner' | 'bottom' | 'left' | 'top' | 'right' {
  if ([0, 9, 18, 27].includes(id)) return 'corner';
  if (id >= 1  && id <= 8)  return 'bottom';
  if (id >= 10 && id <= 17) return 'left';
  if (id >= 19 && id <= 26) return 'top';
  return 'right'; // 28–35
}
