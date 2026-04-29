// app/index.tsx — Lobby: create or join a room

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, Animated, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useGameStore } from '../store/gameStore';
import { connectToRoom } from '../services/socket';
import { Colors } from '../constants/theme';

const API = 'http://192.168.29.233:8080/api';
// CHANGE THE IP ABOVE TO YOUR MAC'S IP

export default function LobbyScreen() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession, setGameState } = useGameStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  async function createRoom() {
    if (!name.trim()) { Alert.alert('Enter your name first!'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name.trim() }),
      });
      const data = await res.json();
      setSession(data.playerId, data.roomId);
      setGameState(data.state);
      connectToRoom(data.roomId, data.playerId);
      router.push(`/game/${data.roomId}`);
    } catch (e) {
      Alert.alert('Connection failed', 'Make sure the server is running and your IP is correct in the code.');
    }
    setLoading(false);
  }

  async function joinRoom() {
    console.log('🟡 JOIN ROOM clicked! name:', name, 'code:', roomCode);
    if (!name.trim()) { Alert.alert('Enter your name!'); return; }
    if (!roomCode.trim()) { Alert.alert('Enter a room code!'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/rooms/${roomCode.toUpperCase().trim()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name.trim() }),
      });
      if (!res.ok) {
        Alert.alert('Cannot join', 'Room not found or full!');
        setLoading(false); return;
      }
      const data = await res.json();
      setSession(data.playerId, data.roomId);
      setGameState(data.state);
      connectToRoom(data.roomId, data.playerId);
      router.push(`/game/${data.roomId}`);
    } catch (e) {
      Alert.alert('Connection failed', 'Could not reach the server.');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
          <Text style={styles.eyebrow}>✦ THE INDIAN ✦</Text>
          <Text style={styles.title}>BUSINESS</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>Property Trading Game</Text>
          <View style={styles.diceRow}>
            <Text style={styles.heroDice}>⚄</Text>
            <Text style={styles.heroDice}>⚅</Text>
          </View>
        </Animated.View>

        <View style={styles.card}>
          <Text style={styles.label}>YOUR NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={15}
          />

          <TouchableOpacity
            style={[styles.btnGold, loading && styles.btnDisabled]}
            onPress={createRoom}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.bgDark} />
              : <Text style={styles.btnGoldText}>🏠  CREATE NEW ROOM</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR JOIN EXISTING</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>ROOM CODE</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="ABCDEF"
            placeholderTextColor={Colors.textMuted}
            value={roomCode}
            onChangeText={setRoomCode}
            autoCapitalize="characters"
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.btnOutline, loading && styles.btnDisabled]}
            onPress={joinRoom}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnOutlineText}>→  JOIN ROOM</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.rulesBtn} onPress={() => router.push('/rules')}>
          <Text style={styles.rulesBtnText}>📖  How to Play</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>v1.0 · Multiplayer Edition</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 },

  heroSection: { alignItems: 'center', marginBottom: 8 },
  eyebrow: {
    color: Colors.gold, fontSize: 11, letterSpacing: 6, fontWeight: '600', marginBottom: 8,
  },
  title: {
    fontSize: 56, color: Colors.goldLight, fontWeight: '900', letterSpacing: 8,
    textShadowColor: 'rgba(212,160,23,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  divider: { width: 200, height: 1, backgroundColor: Colors.gold, marginVertical: 8, opacity: 0.6 },
  subtitle: {
    color: Colors.textSecondary, fontStyle: 'italic',
    fontSize: 13, letterSpacing: 3,
  },
  diceRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
  heroDice: { fontSize: 36, color: Colors.gold },

  card: {
    backgroundColor: Colors.bgPanel, borderRadius: 16, padding: 24,
    width: '100%', maxWidth: 400, borderWidth: 1.5, borderColor: Colors.gold, gap: 14,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20,
  },
  label: { color: Colors.gold, fontSize: 11, letterSpacing: 2, fontWeight: 'bold', marginTop: 4 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: '#3a3252',
    borderRadius: 8, padding: 14, color: Colors.textPrimary, fontSize: 15,
  },
  codeInput: { textAlign: 'center', letterSpacing: 8, fontSize: 20, fontWeight: 'bold' },

  btnGold: {
    backgroundColor: Colors.gold, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 6,
  },
  btnDisabled: { opacity: 0.5 },
  btnGoldText: { color: Colors.bgDark, fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  btnOutline: {
    borderWidth: 2, borderColor: Colors.gold, borderRadius: 8, padding: 16,
    alignItems: 'center', backgroundColor: 'transparent',
  },
  btnOutlineText: { color: Colors.gold, fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2d2547' },
  dividerText: { color: Colors.textMuted, fontSize: 10, letterSpacing: 2 },

  rulesBtn: {
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8,
    backgroundColor: 'rgba(212,160,23,0.1)', marginTop: 12,
  },
  rulesBtnText: { color: Colors.goldLight, fontSize: 15, fontWeight: '600', letterSpacing: 1 },

  footer: { color: Colors.textMuted, fontSize: 11, marginTop: 16, letterSpacing: 1 },
});
