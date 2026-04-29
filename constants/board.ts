// constants/board.ts — board data + rules text

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

export const BOARD: BoardSpace[] = [
  { id: 0,  name: 'GO', type: 'go' },
  { id: 1,  name: 'Pune',         type: 'property',  color: 'brown',     price: 600,  rent: [20,100,300,900,1600,2500],     houseCost: 500 },
  { id: 2,  name: 'Community Chest', type: 'community' },
  { id: 3,  name: 'Bangalore',    type: 'property',  color: 'brown',     price: 600,  rent: [40,200,600,1800,3200,4500],    houseCost: 500 },
  { id: 4,  name: 'Income Tax',   type: 'tax',       taxAmount: 2000 },
  { id: 5,  name: 'Howrah Rly',   type: 'railroad',  price: 2000 },
  { id: 6,  name: 'Chennai',      type: 'property',  color: 'lightblue', price: 1000, rent: [60,300,900,2700,4000,5500],    houseCost: 500 },
  { id: 7,  name: 'Chance',       type: 'chance' },
  { id: 8,  name: 'Hyderabad',    type: 'property',  color: 'lightblue', price: 1000, rent: [60,300,900,2700,4000,5500],    houseCost: 500 },
  { id: 9,  name: 'Kolkata',      type: 'property',  color: 'lightblue', price: 1200, rent: [80,400,1000,3000,4500,6000],   houseCost: 500 },
  { id: 10, name: 'Jail',         type: 'jail' },
  { id: 11, name: 'Ahmedabad',    type: 'property',  color: 'pink',      price: 1400, rent: [100,500,1500,4500,6250,7500],  houseCost: 1000 },
  { id: 12, name: 'Electric Co.', type: 'utility',   price: 1500 },
  { id: 13, name: 'Jaipur',       type: 'property',  color: 'pink',      price: 1400, rent: [100,500,1500,4500,6250,7500],  houseCost: 1000 },
  { id: 14, name: 'Lucknow',      type: 'property',  color: 'pink',      price: 1600, rent: [120,600,1800,5000,7000,9000],  houseCost: 1000 },
  { id: 15, name: 'Central Rly',  type: 'railroad',  price: 2000 },
  { id: 16, name: 'Surat',        type: 'property',  color: 'orange',    price: 1800, rent: [140,700,2000,5500,7500,9500],  houseCost: 1000 },
  { id: 17, name: 'Community Chest', type: 'community' },
  { id: 18, name: 'Kanpur',       type: 'property',  color: 'orange',    price: 1800, rent: [140,700,2000,5500,7500,9500],  houseCost: 1000 },
  { id: 19, name: 'Nagpur',       type: 'property',  color: 'orange',    price: 2000, rent: [160,800,2200,6000,8000,10000], houseCost: 1000 },
  { id: 20, name: 'Free Parking', type: 'freeparking' },
  { id: 21, name: 'Mumbai (W)',   type: 'property',  color: 'red',       price: 2200, rent: [180,900,2500,7000,8750,10500], houseCost: 1500 },
  { id: 22, name: 'Chance',       type: 'chance' },
  { id: 23, name: 'Mumbai (C)',   type: 'property',  color: 'red',       price: 2200, rent: [180,900,2500,7000,8750,10500], houseCost: 1500 },
  { id: 24, name: 'Mumbai (E)',   type: 'property',  color: 'red',       price: 2400, rent: [200,1000,3000,7500,9250,11000],houseCost: 1500 },
  { id: 25, name: 'Western Rly',  type: 'railroad',  price: 2000 },
  { id: 26, name: 'Delhi (N)',    type: 'property',  color: 'yellow',    price: 2600, rent: [220,1100,3300,8000,9750,11500],houseCost: 1500 },
  { id: 27, name: 'Delhi (S)',    type: 'property',  color: 'yellow',    price: 2600, rent: [220,1100,3300,8000,9750,11500],houseCost: 1500 },
  { id: 28, name: 'Water Works',  type: 'utility',   price: 1500 },
  { id: 29, name: 'Delhi (E)',    type: 'property',  color: 'yellow',    price: 2800, rent: [240,1200,3600,8500,10250,12000], houseCost: 1500 },
  { id: 30, name: 'Go To Jail',   type: 'gotojail' },
  { id: 31, name: 'Mysore',       type: 'property',  color: 'green',     price: 3000, rent: [260,1300,3900,9000,11000,12750], houseCost: 2000 },
  { id: 32, name: 'Bhopal',       type: 'property',  color: 'green',     price: 3000, rent: [260,1300,3900,9000,11000,12750], houseCost: 2000 },
  { id: 33, name: 'Community Chest', type: 'community' },
  { id: 34, name: 'Indore',       type: 'property',  color: 'green',     price: 3200, rent: [280,1500,4500,10000,12000,14000],houseCost: 2000 },
  { id: 35, name: 'Southern Rly', type: 'railroad',  price: 2000 },
  { id: 36, name: 'Chance',       type: 'chance' },
  { id: 37, name: 'Shimla',       type: 'property',  color: 'darkblue',  price: 3500, rent: [350,1750,5000,11000,13000,15000],houseCost: 2000 },
  { id: 38, name: 'Luxury Tax',   type: 'tax',       taxAmount: 1000 },
  { id: 39, name: 'Manali',       type: 'property',  color: 'darkblue',  price: 4000, rent: [500,2000,6000,14000,17000,20000],houseCost: 2000 },
];

// Get the grid position [row, col] for any space ID (1-indexed in 11x11)
export function getGridPos(id: number): [number, number] {
  if (id === 0)  return [11, 11];
  if (id <= 9)   return [11, 11 - id];
  if (id === 10) return [11, 1];
  if (id <= 19)  return [11 - (id - 10), 1];
  if (id === 20) return [1, 1];
  if (id <= 29)  return [1, 1 + (id - 20)];
  if (id === 30) return [1, 11];
  return [1 + (id - 30), 11];
}

export function getSide(id: number): 'corner' | 'bottom' | 'left' | 'top' | 'right' {
  if ([0, 10, 20, 30].includes(id)) return 'corner';
  if (id >= 1 && id <= 9) return 'bottom';
  if (id >= 11 && id <= 19) return 'left';
  if (id >= 21 && id <= 29) return 'top';
  return 'right';
}
