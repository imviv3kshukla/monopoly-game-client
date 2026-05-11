// constants/board.ts — shared board types and client-only layout helpers

export interface BoardSpace {
  id: number;
  name: string;
  type: 'start' | 'property' | 'transport' | 'utility' | 'tax'
      | 'chance' | 'community' | 'jail' | 'club' | 'rest_house';
  color?: string;
  price?: number;
  rent?: number[];
  rentByHouses?: number[];
  houseCost?: number;
  taxAmount?: number;
  mortgageValue?: number;
  partnerName?: string;
  rentAlone?: number;
  rentWithPartner?: number;
  diceMultiplierAlone?: number;
  diceMultiplierBoth?: number;
  displayNote?: string;
  imageKey?: string;
}

// Grid position [row, col] in a 10x10 grid.
// Corners follow the backend board layout: 0, 9, 18, 27.
export function getGridPos(id: number): [number, number] {
  if (id === 0)   return [10, 10];           // bottom-right (START)
  if (id <= 8)    return [10, 10 - id];      // bottom row going left
  if (id === 9)   return [10, 1];            // bottom-left (JAIL)
  if (id <= 17)   return [10 - (id - 9), 1]; // left column going up
  if (id === 18)  return [1, 1];             // top-left (CLUB)
  if (id <= 26)   return [1, 1 + (id - 18)]; // top row going right
  if (id === 27)  return [1, 10];            // top-right (REST_HOUSE)
  return [1 + (id - 27), 10];                // right column going down
}

export function getSide(id: number): 'corner' | 'bottom' | 'left' | 'top' | 'right' {
  if ([0, 9, 18, 27].includes(id)) return 'corner';
  if (id >= 1 && id <= 8) return 'bottom';
  if (id >= 10 && id <= 17) return 'left';
  if (id >= 19 && id <= 26) return 'top';
  return 'right'; // 28-35
}
