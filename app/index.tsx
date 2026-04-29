// app/index.tsx
// Lobby screen — create or join a game room

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert
} from 'react-native';
import { router } from 'expo-router';
import { useGameStore } from '../store/gameStore';
import { connectToRoom } from '../services/socket';

const API = 'http://192.168.29.233:8080/api';

export default function LobbyScreen() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession, setGameState } = useGameStore();

  async function createRoom() {
    if (!name.trim()) { Alert.alert('Enter your name!'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name }),
      });
      const data = await res.json();
      // Save my session info
      setSession(data.playerId, data.roomId);
      setGameState(data.state);
      // Connect to WebSocket room
      connectToRoom(data.roomId, data.playerId);
      // Navigate to game screen
      router.push(`/game/${data.roomId}`);
    } catch (e) {
      Alert.alert('Error', 'Could not create room. Is the server running?');
    }
    setLoading(false);
  }

  async function joinRoom() {
    if (!name.trim()) { Alert.alert('Enter your name!'); return; }
    if (!roomCode.trim()) { Alert.alert('Enter a room code!'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/rooms/${roomCode.toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name }),
      });
      if (!res.ok) { Alert.alert('Room not found or full!'); setLoading(false); return; }
      const data = await res.json();
      setSession(data.playerId, data.roomId);
      setGameState(data.state);
      connectToRoom(data.roomId, data.playerId);
      router.push(`/game/${data.roomId}`);
    } catch (e) {
      Alert.alert('Error', 'Could not join room.');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>BUSINESS</Text>
      <Text style={styles.subtitle}>THE INDIAN PROPERTY GAME</Text>

      <View style={styles.card}>
        <Text style={styles.label}>YOUR NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity style={styles.btnGold} onPress={createRoom} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>🏠 CREATE NEW ROOM</Text>}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR JOIN EXISTING</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.label}>ROOM CODE</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="e.g. AB3K7F"
          placeholderTextColor="#666"
          value={roomCode}
          onChangeText={setRoomCode}
          autoCapitalize="characters"
          maxLength={6}
        />

        <TouchableOpacity style={styles.btnOutline} onPress={joinRoom} disabled={loading}>
          <Text style={[styles.btnText, { color: '#d4a017' }]}>→ JOIN ROOM</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e0b1a', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 48, color: '#f5d060', fontWeight: 'bold', letterSpacing: 8 },
  subtitle: { color: '#777', letterSpacing: 3, fontSize: 12, marginBottom: 32 },

  card: {
    backgroundColor: '#1a1330', borderRadius: 16, padding: 24,
    width: '100%', maxWidth: 380, borderWidth: 1, borderColor: '#c8a040',
    gap: 12,
  },
  label: { color: '#d4a017', fontSize: 11, letterSpacing: 2, fontWeight: 'bold' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: '#444',
    borderRadius: 8, padding: 12, color: '#fff', fontSize: 15
  },
  codeInput: { textAlign: 'center', letterSpacing: 6, fontSize: 18, fontWeight: 'bold' },

  btnGold: { backgroundColor: '#d4a017', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnOutline: { borderWidth: 2, borderColor: '#d4a017', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 14, letterSpacing: 1, color: '#1a0a00' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#333' },
  dividerText: { color: '#555', fontSize: 11, letterSpacing: 1 },
});
