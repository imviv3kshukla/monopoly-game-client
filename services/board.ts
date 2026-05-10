// services/board.ts
// Fetches the canonical board definition from the backend.

import { BoardSpace } from '../constants/board';
import { BACKEND_BASE_URL } from './config';

type BackendBoardSpace = Omit<BoardSpace, 'type'> & {
  type: string;
};

export async function fetchBoardSpaces(): Promise<BoardSpace[]> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/board`);
  if (!res.ok) {
    throw new Error(`Failed to load board: ${res.status}`);
  }
  const spaces = await res.json() as BackendBoardSpace[];
  return spaces
    .map(normalizeBoardSpace)
    .sort((a, b) => a.id - b.id);
}

function normalizeBoardSpace(space: BackendBoardSpace): BoardSpace {
  return {
    ...space,
    type: space.type.toLowerCase() as BoardSpace['type'],
    color: space.color ?? undefined,
    rent: space.rent ?? undefined,
  };
}
