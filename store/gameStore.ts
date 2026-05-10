// store/gameStore.ts — Central state management using Zustand

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlayerSummary {
  playerId: string;
  name: string;
  token: string;
  color: string;
  cash: number;
  propertyValue: number;
  buildingValue: number;
  totalWorth: number;
  propertiesOwned: number;
  housesOwned: number;
  hotelsOwned: number;
  bankrupt: boolean;
  rank: number;
}

export interface Player {
  id: string;
  name: string;
  token: string;       // emoji
  color: string;       // hex
  money: number;
  position: number;    // 0-35
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
  finalSummaries?: PlayerSummary[];
  endReason?: 'BANKRUPTCY' | 'MANUAL';
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface Store {
  // Session info (your player)
  myPlayerId: string | null;
  myRoomId: string | null;
  setSession: (playerId: string, roomId: string) => void;
  clearSession: () => Promise<void>;
  loadSession: () => Promise<{ playerId: string; roomId: string } | null>;

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

  setSession: (playerId, roomId) => {
    // Fire-and-forget — don't block the UI
    AsyncStorage.setItem('myPlayerId', playerId);
    AsyncStorage.setItem('myRoomId', roomId);
    set({ myPlayerId: playerId, myRoomId: roomId });
  },

  clearSession: async () => {
    await AsyncStorage.removeItem('myPlayerId');
    await AsyncStorage.removeItem('myRoomId');
    set({ myPlayerId: null, myRoomId: null, gameState: null });
  },

  loadSession: async () => {
    const playerId = await AsyncStorage.getItem('myPlayerId');
    const roomId = await AsyncStorage.getItem('myRoomId');
    if (playerId && roomId) {
      set({ myPlayerId: playerId, myRoomId: roomId });
      return { playerId, roomId };
    }
    return null;
  },

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
