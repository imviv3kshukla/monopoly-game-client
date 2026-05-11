// app/index.tsx — Lobby: create or join a room

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGameStore } from '../store/gameStore';
import { connectToRoom } from '../services/socket';
import { API_BASE_URL } from '../services/config';

type LobbyMode = 'computer' | 'pass' | 'online' | 'friends';

const MODE_CONFIG: Record<LobbyMode, {
  top: string;
  bottom: string;
  icon: string;
  accent: string;
  shadow: string;
  action: 'create' | 'join' | 'soon';
}> = {
  computer: { top: 'V/S', bottom: 'COMPUTER', icon: '💻', accent: '#e879f9', shadow: '#a21caf', action: 'soon' },
  pass: { top: 'PASS', bottom: 'DEVICE', icon: '🎮', accent: '#22c55e', shadow: '#15803d', action: 'create' },
  online: { top: 'ONLINE', bottom: 'MULTIPLAYER', icon: '🌐', accent: '#38bdf8', shadow: '#0369a1', action: 'create' },
  friends: { top: 'PLAY WITH', bottom: 'FRIENDS', icon: '👥', accent: '#facc15', shadow: '#ea580c', action: 'join' },
};

export default function LobbyScreen() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedMode, setSelectedMode] = useState<LobbyMode>('online');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const { width, height } = useWindowDimensions();
  const { setSession, setGameState } = useGameStore();

  const intro = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const diceSpin = useRef(new Animated.Value(0)).current;
  const cardPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function checkSession() {
      const session = await useGameStore.getState().loadSession();
      if (!session) return;
      try {
        const res = await fetch(`${API_BASE_URL}/rooms/${session.roomId}/rejoin/${session.playerId}`);
        if (res.ok) {
          const data = await res.json();
          useGameStore.getState().setGameState(data.state);
          connectToRoom(session.roomId, session.playerId);
          router.replace(`/game/${session.roomId}`);
        } else {
          await useGameStore.getState().clearSession();
        }
      } catch {
        await useGameStore.getState().clearSession();
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    Animated.spring(intro, { toValue: 1, friction: 8, tension: 65, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(diceSpin, { toValue: 1, duration: 5200, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardPulse, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(cardPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [cardPulse, diceSpin, float, intro]);

  async function createRoom() {
    if (!name.trim()) { Alert.alert('Enter your name first!'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/create`, {
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
      Alert.alert('Connection failed', 'Could not reach the server.');
    }
    setLoading(false);
  }

  async function joinRoom() {
    if (!name.trim()) { Alert.alert('Enter your name!'); return; }
    if (!roomCode.trim()) { Alert.alert('Enter a room code!'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/${roomCode.toUpperCase().trim()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name.trim() }),
      });
      if (!res.ok) {
        Alert.alert('Cannot join', 'Room not found or full!');
        setLoading(false);
        return;
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

  const selected = MODE_CONFIG[selectedMode];
  const isCompact = width < 430 || height < 760;
  const keyboardLayout = inputFocused && width < 760;
  const titleScale = intro.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });
  const translateY = intro.interpolate({ inputRange: [0, 1], outputRange: [28, 0] });
  const boardFloat = float.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });
  const diceRotate = diceSpin.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '348deg'] });

  return (
    <View style={styles.root}>
      <View style={styles.skyPattern} pointerEvents="none">
        <View style={[styles.cloud, styles.cloudA]} />
        <View style={[styles.cloud, styles.cloudB]} />
        <View style={[styles.cloud, styles.cloudC]} />
        <View style={styles.sunbeamA} />
        <View style={styles.sunbeamB} />
        {!keyboardLayout && (
          <>
            <View style={styles.bottomCloudA} />
            <View style={styles.bottomCloudB} />
          </>
        )}
      </View>

      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            isCompact && styles.scrollCompact,
            keyboardLayout && styles.scrollKeyboard,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {keyboardLayout ? (
            <View style={styles.keyboardHeader}>
              <Text style={styles.keyboardTitle}>BUSINESS</Text>
              <Text style={styles.keyboardSubtitle}>{selected.top} {selected.bottom}</Text>
            </View>
          ) : (
            <>
              <Animated.View
                style={[
                  styles.hero,
                  {
                    opacity: intro,
                    transform: [{ translateY }, { scale: titleScale }],
                  },
                ]}
              >
                <Text style={styles.title}>BUSINESS</Text>
                <Text style={styles.titleShadow}>BUSINESS</Text>
              </Animated.View>

              <Animated.View style={[styles.boardArtWrap, { transform: [{ translateY: boardFloat }] }]}>
                <View style={styles.boardArt}>
                  <View style={[styles.boardTile, styles.boardTileGreen]} />
                  <View style={[styles.boardTile, styles.boardTileRed]} />
                  <View style={[styles.boardTile, styles.boardTileBlue]} />
                  <View style={[styles.boardTile, styles.boardTileYellow]} />
                  <View style={styles.cashStack}>
                    <View style={styles.cashNote} />
                    <View style={[styles.cashNote, styles.cashNoteTwo]} />
                  </View>
                  <View style={styles.cityBlock}>
                    <View style={styles.towerA}>
                      <View style={styles.windowRow} />
                      <View style={styles.windowRow} />
                      <View style={styles.windowRow} />
                    </View>
                    <View style={styles.towerB}>
                      <View style={styles.windowRow} />
                      <View style={styles.windowRow} />
                    </View>
                  </View>
                  <Animated.View style={[styles.heroDie, { transform: [{ rotate: diceRotate }] }]}>
                    <View style={styles.dieDotA} />
                    <View style={styles.dieDotB} />
                    <View style={styles.dieDotC} />
                    <View style={styles.dieDotD} />
                    <View style={styles.dieDotE} />
                  </Animated.View>
                </View>
              </Animated.View>

              <View style={styles.modeGrid}>
                {(Object.keys(MODE_CONFIG) as LobbyMode[]).map(mode => (
                  <ModeTile
                    key={mode}
                    mode={mode}
                    selected={mode === selectedMode}
                    onPress={() => setSelectedMode(mode)}
                    pulse={mode === selectedMode ? cardPulse : undefined}
                  />
                ))}
              </View>
            </>
          )}

          <Animated.View style={[
            styles.actionPanel,
            keyboardLayout && styles.actionPanelKeyboard,
            { opacity: intro, transform: keyboardLayout ? [] : [{ translateY }] },
          ]}>
            <View style={styles.nameRow}>
              <TextInput
                style={styles.nameInput}
                placeholder="Your name"
                placeholderTextColor="rgba(30,64,175,0.45)"
                value={name}
                onChangeText={setName}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                maxLength={15}
                returnKeyType={selected.action === 'join' ? 'next' : 'done'}
              />
              <TouchableOpacity style={styles.rulesButton} onPress={() => router.push('/rules')}>
                <Text style={styles.rulesButtonText}>?</Text>
              </TouchableOpacity>
            </View>

            {selected.action === 'join' && (
              <TextInput
                style={styles.roomInput}
                placeholder="ROOM CODE"
                placeholderTextColor="rgba(30,64,175,0.45)"
                value={roomCode}
                onChangeText={setRoomCode}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                autoCapitalize="characters"
                maxLength={6}
                returnKeyType="done"
              />
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: selected.accent, shadowColor: selected.shadow },
                (loading || selected.action === 'soon') && styles.primaryButtonDisabled,
              ]}
              onPress={selected.action === 'join' ? joinRoom : createRoom}
              disabled={loading || selected.action === 'soon'}
              activeOpacity={0.88}
            >
              <View style={styles.primaryButtonShine} />
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {selected.action === 'join'
                    ? 'JOIN ROOM'
                    : selected.action === 'soon'
                      ? 'COMING SOON'
                      : 'CREATE ROOM'}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ModeTile({
  mode,
  selected,
  onPress,
  pulse,
}: {
  mode: LobbyMode;
  selected: boolean;
  onPress: () => void;
  pulse?: Animated.Value;
}) {
  const config = MODE_CONFIG[mode];
  const content = (
    <TouchableOpacity
      style={[
        styles.modeTile,
        {
          borderColor: selected ? '#fff' : 'rgba(255,255,255,0.78)',
          shadowColor: config.shadow,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.modeIconCube, { backgroundColor: config.accent }]}>
        <Text style={styles.modeIcon}>{config.icon}</Text>
      </View>
      <View style={[styles.modeBadge, { borderColor: config.accent }]}>
        <Text style={[styles.modeTop, { color: config.shadow }]}>{config.top}</Text>
        <Text style={[styles.modeBottom, { backgroundColor: config.accent }]}>{config.bottom}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!pulse) return content;
  return <Animated.View style={{ transform: [{ scale: pulse }] }}>{content}</Animated.View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1687ff',
  },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  scrollCompact: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  scrollKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingBottom: 24,
  },
  skyPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1687ff',
  },
  cloud: {
    position: 'absolute',
    height: 56,
    borderRadius: 34,
    backgroundColor: '#fff',
    shadowColor: '#bfdbfe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 0,
  },
  cloudA: { top: 48, left: 28, width: 144 },
  cloudB: { top: 68, right: -24, width: 132 },
  cloudC: { top: 286, left: 18, width: 118 },
  sunbeamA: {
    position: 'absolute',
    top: -40,
    right: 12,
    width: 34,
    height: 230,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '28deg' }],
  },
  sunbeamB: {
    position: 'absolute',
    top: -56,
    right: 72,
    width: 22,
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    transform: [{ rotate: '28deg' }],
  },
  bottomCloudA: {
    position: 'absolute',
    left: -40,
    right: 120,
    bottom: -42,
    height: 100,
    borderRadius: 70,
    backgroundColor: 'rgba(219,234,254,0.8)',
  },
  bottomCloudB: {
    position: 'absolute',
    left: 140,
    right: -60,
    bottom: -28,
    height: 86,
    borderRadius: 70,
    backgroundColor: 'rgba(191,219,254,0.82)',
  },
  hero: {
    alignItems: 'center',
    marginTop: 8,
    height: 118,
    justifyContent: 'center',
  },
  keyboardHeader: {
    width: '100%',
    maxWidth: 430,
    paddingTop: 4,
    paddingBottom: 10,
    alignItems: 'center',
  },
  keyboardTitle: {
    color: '#fff',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: 0,
    textShadowColor: '#7e22ce',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 0,
  },
  keyboardSubtitle: {
    marginTop: 2,
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    zIndex: 2,
    color: '#fff',
    fontSize: 58,
    lineHeight: 64,
    fontWeight: '900',
    letterSpacing: 0,
    textShadowColor: '#7e22ce',
    textShadowOffset: { width: 0, height: 10 },
    textShadowRadius: 0,
  },
  titleShadow: {
    position: 'absolute',
    top: 76,
    color: '#d946ef',
    fontSize: 58,
    lineHeight: 64,
    fontWeight: '900',
    letterSpacing: 0,
    transform: [{ scaleX: 1.03 }],
  },
  boardArtWrap: {
    width: 330,
    height: 178,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  boardArt: {
    width: 292,
    height: 170,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    borderWidth: 5,
    borderColor: '#fff',
    transform: [{ perspective: 700 }, { rotateX: '58deg' }, { rotateZ: '-5deg' }],
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  boardTile: {
    position: 'absolute',
    width: 72,
    height: 54,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  boardTileGreen: { left: 10, bottom: 12, backgroundColor: '#22c55e' },
  boardTileRed: { right: 14, bottom: 18, backgroundColor: '#ef4444' },
  boardTileBlue: { left: 34, top: 16, backgroundColor: '#38bdf8' },
  boardTileYellow: { right: 48, top: 20, backgroundColor: '#facc15' },
  cashStack: {
    position: 'absolute',
    left: 28,
    top: 70,
    width: 82,
    height: 48,
  },
  cashNote: {
    position: 'absolute',
    left: 0,
    top: 8,
    width: 78,
    height: 36,
    borderRadius: 5,
    backgroundColor: '#84cc16',
    borderWidth: 3,
    borderColor: '#dcfce7',
  },
  cashNoteTwo: {
    left: 8,
    top: 0,
    backgroundColor: '#65a30d',
  },
  cityBlock: {
    position: 'absolute',
    left: 106,
    top: 22,
    width: 110,
    height: 92,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  towerA: {
    width: 48,
    height: 88,
    borderRadius: 5,
    padding: 7,
    gap: 8,
    backgroundColor: '#f97316',
    borderWidth: 3,
    borderColor: '#fde68a',
  },
  towerB: {
    width: 45,
    height: 70,
    borderRadius: 5,
    padding: 7,
    gap: 8,
    backgroundColor: '#fb923c',
    borderWidth: 3,
    borderColor: '#fde68a',
  },
  windowRow: {
    height: 10,
    borderRadius: 2,
    backgroundColor: '#7c2d12',
  },
  heroDie: {
    position: 'absolute',
    left: 136,
    bottom: -18,
    width: 74,
    height: 74,
    borderRadius: 15,
    backgroundColor: '#fde047',
    borderWidth: 4,
    borderColor: '#fff7ad',
    shadowColor: '#713f12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.36,
    shadowRadius: 8,
  },
  dieDotA: { position: 'absolute', left: 14, top: 14, width: 10, height: 10, borderRadius: 5, backgroundColor: '#1f2937' },
  dieDotB: { position: 'absolute', right: 14, top: 14, width: 10, height: 10, borderRadius: 5, backgroundColor: '#1f2937' },
  dieDotC: { position: 'absolute', left: 14, bottom: 14, width: 10, height: 10, borderRadius: 5, backgroundColor: '#1f2937' },
  dieDotD: { position: 'absolute', right: 14, bottom: 14, width: 10, height: 10, borderRadius: 5, backgroundColor: '#1f2937' },
  dieDotE: { position: 'absolute', left: 30, top: 30, width: 11, height: 11, borderRadius: 6, backgroundColor: '#1f2937' },
  modeGrid: {
    width: '100%',
    maxWidth: 430,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 8,
  },
  modeTile: {
    width: 150,
    minHeight: 118,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: 18,
    borderWidth: 3,
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 10,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.35,
    shadowRadius: 0,
  },
  modeIconCube: {
    width: 74,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    transform: [{ rotate: '-6deg' }],
    marginBottom: -2,
  },
  modeIcon: {
    fontSize: 30,
  },
  modeBadge: {
    width: 126,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  modeTop: {
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  modeBottom: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  actionPanel: {
    width: '100%',
    maxWidth: 430,
    marginTop: 12,
    borderRadius: 22,
    padding: 14,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  actionPanelKeyboard: {
    marginTop: 0,
    borderRadius: 18,
    padding: 12,
    gap: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nameInput: {
    flex: 1,
    height: 52,
    borderRadius: 15,
    paddingHorizontal: 16,
    color: '#172554',
    fontSize: 17,
    fontWeight: '800',
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  rulesButton: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#fde68a',
  },
  rulesButtonText: {
    color: '#d97706',
    fontSize: 24,
    fontWeight: '900',
  },
  roomInput: {
    height: 52,
    borderRadius: 15,
    paddingHorizontal: 16,
    color: '#172554',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 7,
    textAlign: 'center',
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  primaryButton: {
    height: 58,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.82)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 0,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonShine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '52%',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 0,
  },
});
