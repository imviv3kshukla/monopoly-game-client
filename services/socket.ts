// services/socket.ts
// Manages the single STOMP WebSocket connection to the Spring Boot server

import { Client } from '@stomp/stompjs';
import { useGameStore } from '../store/gameStore';

const SERVER_URL = 'ws://192.168.29.233:8080/ws/websocket';
// Change to your server IP. In dev, use your computer's local IP e.g. ws://192.168.1.5:8080/ws/websocket

let client: Client | null = null;

export function connectToRoom(roomId: string, playerId: string) {
  if (client?.active) client.deactivate();

  client = new Client({
    brokerURL: SERVER_URL,

    // Called once WebSocket connects
    onConnect: () => {
      console.log('✅ Connected to game server');

      // Subscribe to room updates — server broadcasts here after every action
      client!.subscribe(`/topic/room.${roomId}`, (message) => {
        const gameState = JSON.parse(message.body);
        // Push new state into our Zustand store → UI re-renders automatically
        useGameStore.getState().setGameState(gameState);
      });
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

export function sendPayJail(roomId: string, playerId: string) {
  send(`/app/room.${roomId}.payJail`, { playerId });
}

function send(destination: string, body: object) {
  if (!client?.active) {
    console.error('Not connected!');
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
