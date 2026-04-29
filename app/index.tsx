// app/index.tsx — Lobby: create or join a room

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Animated, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGameStore } from '../store/gameStore';
import { connectToRoom } from '../services/socket';
import { Colors } from '../constants/theme';

const API = 'http://192.168.29.233:8080/api';
// CHANGE THE IP ABOVE TO YOUR MAC'S IP

const { width: screenW, height: screenH } = Dimensions.get('window');

// ─── Background animated orb ──────────────────────────────────────────────────
function Orb({
  color, size, x, y, duration, startDelay = 0,
}: {
  color: string; size: number; x: number; y: number; duration: number; startDelay?: number;
}) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.35, duration, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.45, duration, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 0.8, duration, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.12, duration, useNativeDriver: true }),
          ]),
        ])
      ).start();
    }, startDelay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute', left: x, top: y,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color, opacity, transform: [{ scale }],
      }}
    />
  );
}

// ─── Floating dice that drifts upward and fades out ──────────────────────────
function FloatingDice({ emoji, x, y, delay }: { emoji: string; x: number; y: number; delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.timing(progress, { toValue: 1, duration: 5500, useNativeDriver: true })
      ).start();
    }, delay);
    return () => { clearTimeout(timer); progress.stopAnimation(); };
  }, []);

  const opacity = progress.interpolate({
    inputRange: [0, 0.08, 0.70, 1],
    outputRange: [0, 0.65, 0.5, 0],
  });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -220] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '200deg'] });

  return (
    <Animated.Text
      style={{
        position: 'absolute', left: x, top: y, fontSize: 30,
        opacity, transform: [{ translateY }, { rotate }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function LobbyScreen() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession, setGameState } = useGameStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const titleScale = useRef(new Animated.Value(0.85)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.spring(titleScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.35, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
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
    } catch {
      Alert.alert('Connection failed', 'Make sure the server is running and your IP is correct in the code.');
    }
    setLoading(false);
  }

  async function joinRoom() {
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
    } catch {
      Alert.alert('Connection failed', 'Could not reach the server.');
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      {/* ── Background orbs ── */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Orb color="#7c3aed" size={380} x={-130} y={-120} duration={5000} />
        <Orb color="#f59e0b" size={220} x={screenW - 130} y={screenH * 0.25} duration={7000} startDelay={900} />
        <Orb color="#ec4899" size={300} x={screenW / 2 - 150} y={screenH * 0.6} duration={6000} startDelay={1800} />
      </View>

      {/* ── Floating dice ── */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <FloatingDice emoji="⚄" x={35} y={screenH * 0.55} delay={0} />
        <FloatingDice emoji="⚅" x={screenW - 65} y={screenH * 0.45} delay={1600} />
        <FloatingDice emoji="⚂" x={screenW / 2 - 15} y={screenH * 0.62} delay={3200} />
      </View>

      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero ── */}
          <Animated.View style={[styles.hero, {
            opacity: fadeAnim,
            transform: [{ scale: titleScale }],
          }]}>
            <Text style={styles.eyebrow}>✦ THE INDIAN ✦</Text>

            {/* Glow behind title */}
            <Animated.View style={[styles.titleGlow, { opacity: glowAnim }]} />
            <Text style={styles.title}>BUSINESS</Text>

            <View style={styles.heroDivider} />
            <Text style={styles.subtitle}>Property Trading Game</Text>

            <View style={styles.diceRow}>
              <Text style={styles.heroDice}>⚄</Text>
              <Text style={styles.heroDice}>⚅</Text>
            </View>
          </Animated.View>

          {/* ── Card ── */}
          <Animated.View style={[styles.card, {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }]}>
            {/* Gold accent top bar */}
            <View style={styles.cardTopBar} />

            <View style={styles.cardBody}>
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
                activeOpacity={0.82}
              >
                <View style={styles.btnShine} />
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
                style={[styles.btnPurple, loading && styles.btnDisabled]}
                onPress={joinRoom}
                disabled={loading}
                activeOpacity={0.82}
              >
                <View style={styles.btnShine} />
                <Text style={styles.btnPurpleText}>→  JOIN ROOM</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <TouchableOpacity style={styles.rulesBtn} onPress={() => router.push('/rules')}>
            <Text style={styles.rulesBtnText}>📖  How to Play</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>v1.0 · Multiplayer Edition</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    padding: 20, paddingVertical: 44, gap: 22,
  },

  // Hero
  hero: { alignItems: 'center', marginBottom: 4 },
  eyebrow: {
    color: Colors.gold, fontSize: 12, letterSpacing: 7,
    fontWeight: '700', marginBottom: 14,
  },
  titleGlow: {
    position: 'absolute',
    width: 280, height: 90, top: 20,
    backgroundColor: Colors.gold,
    borderRadius: 45,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
    elevation: 0,
  },
  title: {
    fontSize: 62, color: Colors.goldLight, fontWeight: '900', letterSpacing: 10,
    textShadowColor: Colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  heroDivider: {
    width: 200, height: 2, backgroundColor: Colors.gold,
    marginVertical: 12, opacity: 0.65, borderRadius: 1,
  },
  subtitle: {
    color: Colors.textSecondary, fontStyle: 'italic',
    fontSize: 13, letterSpacing: 3,
  },
  diceRow: { flexDirection: 'row', gap: 18, marginTop: 18 },
  heroDice: {
    fontSize: 38, color: Colors.gold,
    textShadowColor: Colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },

  // Card
  card: {
    width: '100%', maxWidth: 430, borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(14,11,34,0.97)',
    borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.28)',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25, shadowRadius: 28, elevation: 14,
  },
  cardTopBar: {
    height: 5, width: '100%',
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9, shadowRadius: 10,
  },
  cardBody: { padding: 26, gap: 16 },

  label: { color: Colors.gold, fontSize: 11, letterSpacing: 2.5, fontWeight: '800', marginTop: 2 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.2)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 15,
    color: Colors.textPrimary, fontSize: 16,
  },
  codeInput: {
    textAlign: 'center', letterSpacing: 10,
    fontSize: 24, fontWeight: '800', color: Colors.goldLight,
  },

  btnGold: {
    backgroundColor: Colors.gold, borderRadius: 13, paddingVertical: 17,
    alignItems: 'center', overflow: 'hidden', position: 'relative',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  btnPurple: {
    backgroundColor: Colors.electric, borderRadius: 13, paddingVertical: 17,
    alignItems: 'center', overflow: 'hidden', position: 'relative',
    shadowColor: Colors.electric,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  btnShine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  btnDisabled: { opacity: 0.5 },
  btnGoldText: { color: Colors.bgDark, fontWeight: '800', fontSize: 15, letterSpacing: 1.5 },
  btnPurpleText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 1.5 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(245,158,11,0.18)' },
  dividerText: { color: Colors.textMuted, fontSize: 10, letterSpacing: 2.5, fontWeight: '600' },

  rulesBtn: {
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: 13,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.28)',
  },
  rulesBtnText: { color: Colors.goldLight, fontSize: 15, fontWeight: '700', letterSpacing: 1 },

  footer: { color: Colors.textMuted, fontSize: 11, letterSpacing: 1.5, marginTop: 4 },
});
