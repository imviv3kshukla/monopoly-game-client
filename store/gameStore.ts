// store/gameStore.ts
// Central state management using Zustand
// Think of this as the "brain" of your app — all screens read from here

import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  token: string;       // emoji
  color: string;       // hex
  money: number;
  position: number;    // 0-39
  inJail: boolean;
  jailTurns: number;
  bankrupt: boolean;
  doublesCount: number;
}

export interface Property {
  spaceId: number;
  ownerId: string;
  houses: number;       // 0-4 = houses, 5 = hotel
}

export interface GameState {
  roomId: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: Player[];
  properties: Record<number, Property>;  // spaceId -> Property
  currentPlayerIndex: number;
  lastDice: [number, number];
  log: string[];
  pendingAction: 'BUY' | 'CARD' | null;
  pendingMessage: string | null;
  winnerId: string | null;
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface Store {
  // Session info (your player)
  myPlayerId: string | null;
  myRoomId: string | null;
  setSession: (playerId: string, roomId: string) => void;

  // Game state from server
  gameState: GameState | null;
  setGameState: (state: GameState) => void;

  // Derived helpers
  myPlayer: () => Player | null;
  isMyTurn: () => boolean;
  currentPlayer: () => Player | null;
}

export const useGameStore = create<Store>((set, get) => ({
  myPlayerId: null,
  myRoomId: null,

  setSession: (playerId, roomId) => set({ myPlayerId: playerId, myRoomId: roomId }),

  gameState: null,
  setGameState: (state) => set({ gameState: state }),

  // Returns your own Player object
  myPlayer: () => {
    const { myPlayerId, gameState } = get();
    return gameState?.players.find(p => p.id === myPlayerId) ?? null;
  },

  // True if it's currently your turn
  isMyTurn: () => {
    const { myPlayerId, gameState } = get();
    if (!gameState) return false;
    const current = gameState.players[gameState.currentPlayerIndex];
    return current?.id === myPlayerId;
  },

  // The player whose turn it is right now
  currentPlayer: () => {
    const { gameState } = get();
    if (!gameState) return null;
    return gameState.players[gameState.currentPlayerIndex] ?? null;
  },
}));
