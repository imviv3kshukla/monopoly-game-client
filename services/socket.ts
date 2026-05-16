// services/socket.ts
// Manages the single STOMP WebSocket connection to the Spring Boot server

import { Client } from '@stomp/stompjs';
import { useGameStore } from '../store/gameStore';
import { API_BASE_URL, WS_URL } from './config';

let client: Client | null = null;
const pendingMessages: Array<{ destination: string; body: object }> = [];

export function connectToRoom(roomId: string, playerId: string) {
  if (client?.active) client.deactivate();

  client = new Client({
    brokerURL: WS_URL,

    // Called once WebSocket connects
    onConnect: () => {
      console.log('✅ Connected to game server');

      // Subscribe to room updates — server broadcasts here after every action
      client!.subscribe(`/topic/room.${roomId}`, (message) => {
        const gameState = JSON.parse(message.body);
        // Push new state into our Zustand store → UI re-renders automatically
        useGameStore.getState().setGameState(gameState);
      });

      while (pendingMessages.length) {
        const next = pendingMessages.shift();
        if (next) publish(next.destination, next.body);
      }
    },

    onDisconnect: () => console.log('❌ Disconnected'),
    onStompError: (frame) => console.error('STOMP error', frame),
    reconnectDelay: 3000, // auto-reconnect after 3 seconds
  });

  client.activate();
}

// ── Action senders ────────────────────────────────────────────────────────────
// Each function sends a message to the server. Server processes and broadcasts back.

export function sendRoll(roomId: string, playerId: string) {
  send(`/app/room.${roomId}.roll`, { playerId });
}

export function sendBuy(roomId: string, playerId: string) {
  send(`/app/room.${roomId}.buy`, { playerId });
}

export function sendSkipBuy(roomId: string, playerId: string) {
  send(`/app/room.${roomId}.skipBuy`, { playerId });
}

export function sendBuildHouse(roomId: string, playerId: string, spaceId: number) {
  send(`/app/room.${roomId}.build`, { playerId, spaceId });
}

export function sendEndTurn(roomId: string, playerId: string) {
  send(`/app/room.${roomId}.endTurn`, { playerId });
}

export function sendEndGame(roomId: string, playerId: string) {
  send(`/app/room.${roomId}.endGame`, { playerId });
}

export function sendPayJail(roomId: string, playerId: string) {
  send(`/app/room.${roomId}.payJail`, { playerId });
}

export function sendAddBot(roomId: string, playerId: string, botType: 'QUICK' | 'SMART') {
  send(`/app/room.${roomId}.addBot`, { playerId, botType });
}

function send(destination: string, body: object) {
  if (!client?.connected) {
    pendingMessages.push({ destination, body });
    return;
  }
  publish(destination, body);
}

function publish(destination: string, body: object) {
  if (!client?.connected) {
    pendingMessages.push({ destination, body });
    return;
  }
  client.publish({
    destination,
    body: JSON.stringify(body),
  });
}

export function disconnect() {
  client?.deactivate();
  client = null;
}

export async function sendStartGame(roomId: string, playerId: string) {
  try {
    await fetch(`${API_BASE_URL}/rooms/${roomId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    });
  } catch (e) {
    console.error('Failed to start game', e);
  }
}
