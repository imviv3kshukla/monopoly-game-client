// app/game/[roomId].tsx — Main game screen

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useGameStore } from '../../store/gameStore';
import {
  sendRoll, sendBuy, sendSkipBuy, sendBuildHouse,
  sendEndTurn, sendPayJail, sendStartGame,
} from '../../services/socket';
import { Board } from '../../components/Board';
import { AnimatedDice } from '../../components/AnimatedDice';
import { PlayerCard } from '../../components/PlayerCard';
import { PropertyModal } from '../../components/PropertyModal';
import { Colors } from '../../constants/theme';
import { BoardSpace, BOARD } from '../../constants/board';

export default function GameScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { gameState, myPlayerId, isMyTurn, currentPlayer, myPlayer } = useGameStore();
  const [selectedSpace, setSelectedSpace] = useState<BoardSpace | null>(null);
  const [rolling, setRolling] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showCardModal, setShowCardModal] = useState<string | null>(null);
  // Track whether the local player has already rolled this turn
  const [hasRolledThisTurn, setHasRolledThisTurn] = useState(false);

  const me = myPlayer();
  const myTurn = isMyTurn();
  const current = currentPlayer();

  // Timer ref for auto-end-turn
  const autoEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear auto-end timer on unmount
  useEffect(() => () => {
    if (autoEndTimer.current) clearTimeout(autoEndTimer.current);
  }, []);

  // Reset roll state when turn changes (new player's turn begins)
  useEffect(() => {
    setHasRolledThisTurn(false);
    if (autoEndTimer.current) { clearTimeout(autoEndTimer.current); autoEndTimer.current = null; }
  }, [gameState?.currentPlayerIndex]);

  // Show chance/community card popup immediately from log
  useEffect(() => {
    if (gameState?.log[0]) {
      const latest = gameState.log[0];
      if (latest.startsWith('Chance:') || latest.startsWith('Community:')) {
        setShowCardModal(latest);
        setTimeout(() => setShowCardModal(null), 3500);
      }
    }
  }, [gameState?.log[0]]);

  // Stop dice rolling animation after server responds
  useEffect(() => {
    if (rolling) {
      const t = setTimeout(() => setRolling(false), 850);
      return () => clearTimeout(t);
    }
  }, [gameState?.lastDice]);

  // ── scheduleAutoEnd: clears any existing timer, starts a 2.5s countdown to sendEndTurn
  const scheduleAutoEnd = useCallback(() => {
    if (autoEndTimer.current) clearTimeout(autoEndTimer.current);
    autoEndTimer.current = setTimeout(() => {
      // Read fresh state from Zustand to avoid stale closures
      const { gameState: gs, myPlayerId: pid, isMyTurn: checkMyTurn } = useGameStore.getState();
      if (!checkMyTurn() || !gs || gs.pendingAction !== null) return;
      sendEndTurn(roomId!, pid!);
      autoEndTimer.current = null;
    }, 2500);
  }, [roomId]);

  // ── After dice animation stops, start auto-end countdown (covers no-movement cases like jail)
  useEffect(() => {
    if (rolling || !hasRolledThisTurn || !myTurn) return;
    scheduleAutoEnd();
  }, [rolling]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Also reschedule when pendingAction clears (e.g. CARD resolved) during my turn
  useEffect(() => {
    if (!myTurn || !hasRolledThisTurn || gameState?.pendingAction !== null) return;
    scheduleAutoEnd();
  }, [gameState?.pendingAction]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!gameState) return <LoadingScreen />;

  const propertyOnSelected = selectedSpace ? gameState.properties[selectedSpace.id] : undefined;
  const isOwnerMe = propertyOnSelected?.ownerId === myPlayerId;
  const ownsColorSet = selectedSpace?.color
    ? BOARD.filter(s => s.color === selectedSpace.color)
        .every(s => gameState.properties[s.id]?.ownerId === myPlayerId)
    : false;
  const showBuyButtons = gameState.pendingAction === 'BUY' && myTurn && selectedSpace?.id === me?.position;

  const handleRoll = () => {
    setRolling(true);
    setHasRolledThisTurn(true);
    sendRoll(roomId!, myPlayerId!);
  };

  // ── Called by Board when a player's step animation finishes at their final tile
  const handleMoveComplete = useCallback((playerId: string) => {
    if (playerId !== myPlayerId) return;

    // Read fresh state — avoids stale closure issues with async animations
    const { gameState: gs, myPlayerId: pid, isMyTurn: checkMyTurn } = useGameStore.getState();
    if (!checkMyTurn() || !gs) return;

    if (gs.pendingAction === 'BUY') {
      // Cancel auto-end, let player decide to buy or skip
      if (autoEndTimer.current) { clearTimeout(autoEndTimer.current); autoEndTimer.current = null; }
      const mePlayer = gs.players.find(p => p.id === pid);
      if (mePlayer) setSelectedSpace(BOARD[mePlayer.position]);
    } else {
      // Re-start the auto-end timer from the end of animation (gives 2.5s to view result)
      scheduleAutoEnd();
    }
  }, [myPlayerId, scheduleAutoEnd]);

  if (gameState.status === 'WAITING') {
    return <WaitingRoom roomId={roomId!} state={gameState} myPlayerId={myPlayerId!} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>⌂</Text>
        </TouchableOpacity>
        <View style={styles.roomBadge}>
          <Text style={styles.roomBadgeLabel}>ROOM</Text>
          <Text style={styles.roomBadgeCode}>{roomId}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/rules')} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>📖</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Players ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playersRow}>
          {gameState.players.map((p, i) => {
            const propCount = Object.values(gameState.properties).filter(pr => pr.ownerId === p.id).length;
            return (
              <PlayerCard
                key={p.id}
                player={p}
                isActive={i === gameState.currentPlayerIndex}
                isMe={p.id === myPlayerId}
                propertyCount={propCount}
              />
            );
          })}
        </ScrollView>

        {/* ── Turn Banner ── */}
        <TurnBanner isMyTurn={myTurn} hasRolled={hasRolledThisTurn} current={current} />

        {/* ── Board ── */}
        <Board
          players={gameState.players}
          properties={gameState.properties}
          onTilePress={setSelectedSpace}
          onMoveComplete={handleMoveComplete}
        />

        {/* ── Dice ── */}
        <View style={styles.diceSection}>
          <AnimatedDice values={gameState.lastDice} rolling={rolling} />
        </View>

        {/* ── Action Buttons ── (only shown before rolling) ── */}
        {myTurn && !me?.bankrupt && !hasRolledThisTurn && (
          <View style={styles.controls}>
            {gameState.pendingAction === null && (
              <ActionButton label="🎲  ROLL DICE" variant="gold" onPress={handleRoll} disabled={rolling} />
            )}
            {me?.inJail && gameState.pendingAction === null && (
              <ActionButton
                label="⛓️  Pay ₹500 Bail"
                variant="danger"
                onPress={() => sendPayJail(roomId!, myPlayerId!)}
              />
            )}
            {/* No End Turn button — turn ends automatically after roll + animation */}
          </View>
        )}

        {/* ── Auto-end hint (after rolling) ── */}
        {myTurn && hasRolledThisTurn && !rolling && gameState.pendingAction === null && !selectedSpace && (
          <View style={styles.autoEndHint}>
            <Text style={styles.autoEndHintText}>⏱  Turn ending automatically...</Text>
          </View>
        )}

        {/* ── Log ── */}
        <TouchableOpacity onPress={() => setShowLog(!showLog)} style={styles.logToggle} activeOpacity={0.8}>
          <View style={styles.logDot} />
          <Text style={styles.latestLog} numberOfLines={1}>{gameState.log[0] || 'Game started!'}</Text>
          <Text style={styles.logChevron}>{showLog ? '▼' : '▲'}</Text>
        </TouchableOpacity>

        {showLog && (
          <View style={styles.logPanel}>
            {gameState.log.slice(0, 15).map((line, i) => (
              <View key={i} style={styles.logLineRow}>
                <View style={[styles.logBullet, i === 0 && styles.logBulletActive]} />
                <Text style={[styles.logLine, i === 0 && styles.logLineLatest]} numberOfLines={2}>{line}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Property Modal ── */}
      <PropertyModal
        visible={selectedSpace !== null}
        space={selectedSpace}
        property={propertyOnSelected}
        players={gameState.players}
        myMoney={me?.money || 0}
        canBuyOrBuild={myTurn}
        isOwnerMe={isOwnerMe}
        ownsColorSet={ownsColorSet}
        pendingBuy={!!showBuyButtons}
        onBuy={() => {
          if (autoEndTimer.current) { clearTimeout(autoEndTimer.current); autoEndTimer.current = null; }
          sendBuy(roomId!, myPlayerId!);
          setSelectedSpace(null);
          // Auto-end after buy — give server 700ms to process then end turn
          autoEndTimer.current = setTimeout(() => sendEndTurn(roomId!, myPlayerId!), 700);
        }}
        onSkipBuy={() => {
          if (autoEndTimer.current) { clearTimeout(autoEndTimer.current); autoEndTimer.current = null; }
          sendSkipBuy(roomId!, myPlayerId!);
          setSelectedSpace(null);
          autoEndTimer.current = setTimeout(() => sendEndTurn(roomId!, myPlayerId!), 700);
        }}
        onBuild={(id) => { sendBuildHouse(roomId!, myPlayerId!, id); setSelectedSpace(null); }}
        onClose={() => setSelectedSpace(null)}
      />

      {/* ── Card Drawn Modal ── */}
      <CardDrawnModal text={showCardModal} />

      {/* ── Game Over ── */}
      {gameState.status === 'FINISHED' && (
        <GameOverModal winner={gameState.players.find(p => p.id === gameState.winnerId)} />
      )}
    </SafeAreaView>
  );
}

// ─── Turn Banner ──────────────────────────────────────────────────────────────

function TurnBanner({ isMyTurn, hasRolled, current }: {
  isMyTurn: boolean; hasRolled: boolean; current: any;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isMyTurn && !hasRolled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isMyTurn, hasRolled]);

  if (isMyTurn && !hasRolled) {
    return (
      <Animated.View style={[styles.turnBannerMine, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.turnBannerShimmer} pointerEvents="none" />
        <Text style={styles.turnBannerStar}>✨</Text>
        <Text style={styles.turnBannerTextMine}>YOUR TURN!</Text>
        <Text style={styles.turnBannerStar}>✨</Text>
      </Animated.View>
    );
  }

  if (isMyTurn && hasRolled) {
    return (
      <View style={styles.turnBannerRolled}>
        <Text style={styles.turnBannerTextRolled}>🎲  Dice rolled — moving...</Text>
      </View>
    );
  }

  return (
    <View style={styles.turnBannerWait}>
      <Text style={styles.turnBannerTextWait}>
        {current?.token}  {current?.name}'s turn...
      </Text>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingScreen() {
  const pulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.loadingContainer}>
      <Animated.Text style={[styles.loadingTitle, { opacity: pulse }]}>BUSINESS</Animated.Text>
      <Text style={styles.loadingText}>Connecting to game...</Text>
    </View>
  );
}

function WaitingRoom({ roomId, state, myPlayerId }: any) {
  const isHost = state.players[0]?.id === myPlayerId;
  const canStart = state.players.length >= 2;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.waitingScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.waitingEyebrow}>WAITING ROOM</Text>
        <Text style={styles.waitingTitle}>BUSINESS</Text>

        <View style={styles.codeBox}>
          <Text style={styles.codeBoxLabel}>SHARE THIS CODE</Text>
          <Text style={styles.codeBoxCode}>{roomId}</Text>
          <Text style={styles.codeBoxHint}>Friends can join with this code</Text>
        </View>

        <Text style={styles.waitingPlayersHeader}>PLAYERS ({state.players.length}/4)</Text>
        <View style={styles.waitingPlayers}>
          {state.players.map((p: any, i: number) => (
            <View key={p.id} style={[styles.waitingPlayer, { borderColor: p.color + '60' }]}>
              <View style={[styles.waitingPlayerColorDot, { backgroundColor: p.color }]} />
              <Text style={styles.waitingPlayerToken}>{p.token}</Text>
              <Text style={[styles.waitingPlayerName, { color: p.color }]}>
                {p.name}{p.id === myPlayerId && '  (You)'}{i === 0 && '  👑'}
              </Text>
              <View style={[styles.readyBadge, { backgroundColor: p.color + '25' }]}>
                <Text style={[styles.readyText, { color: p.color }]}>READY</Text>
              </View>
            </View>
          ))}
          {Array.from({ length: 4 - state.players.length }).map((_, i) => (
            <Animated.View key={`empty${i}`} style={[styles.waitingPlayerEmpty, { opacity: dotAnim }]}>
              <Text style={styles.waitingEmptyText}>⏳  Waiting for player...</Text>
            </Animated.View>
          ))}
        </View>

        {isHost ? (
          <TouchableOpacity
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            disabled={!canStart}
            onPress={() => sendStartGame(roomId, myPlayerId)}
            activeOpacity={0.85}
          >
            <View style={styles.btnShine} />
            <Text style={styles.startBtnText}>
              {canStart ? '▶  START GAME' : 'Need at least 2 players'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingHintBox}>
            <Text style={styles.waitingHint}>⏳  Waiting for {state.players[0]?.name} to start...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ label, variant, onPress, disabled }: {
  label: string; variant: 'gold' | 'purple' | 'danger'; onPress: () => void; disabled?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true }).start();
  const bgMap   = { gold: Colors.gold, purple: Colors.electric, danger: '#ef4444' };
  const textMap = { gold: Colors.bgDark, purple: '#fff', danger: '#fff' };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: bgMap[variant] }, disabled && styles.actionBtnDisabled]}
        onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
        disabled={disabled} activeOpacity={1}
      >
        <View style={styles.btnShine} />
        <Text style={[styles.actionBtnText, { color: textMap[variant] }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function CardDrawnModal({ text }: { text: string | null }) {
  if (!text) return null;
  const isChance = text.startsWith('Chance:');
  const cleanText = text.replace(/^(Chance|Community):\s*/, '');
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.cardModalOverlay}>
        <View style={[styles.cardModal, { borderColor: isChance ? '#f59e0b' : '#7c3aed' }]}>
          <Text style={styles.cardModalIcon}>{isChance ? '❓' : '💌'}</Text>
          <Text style={[styles.cardModalTitle, { color: isChance ? '#92400e' : '#4c1d95' }]}>
            {isChance ? 'CHANCE' : 'COMMUNITY CHEST'}
          </Text>
          <View style={[styles.cardModalDivider, { backgroundColor: isChance ? '#f59e0b' : '#7c3aed' }]} />
          <Text style={styles.cardModalText}>{cleanText}</Text>
        </View>
      </View>
    </Modal>
  );
}

function GameOverModal({ winner }: any) {
  if (!winner) return null;
  const pulse = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.95, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.gameOverOverlay}>
      <Animated.Text style={[styles.trophy, { transform: [{ scale: pulse }] }]}>🏆</Animated.Text>
      <Text style={styles.gameOverTitle}>GAME OVER!</Text>
      <Text style={styles.gameOverWinner}>{winner.token}  {winner.name}</Text>
      <Text style={styles.gameOverSub}>WINS THE GAME!</Text>
      <Text style={styles.gameOverMoney}>₹{winner.money.toLocaleString()}</Text>
      <TouchableOpacity style={styles.gameOverBtn} onPress={() => router.replace('/')}>
        <View style={styles.btnShine} />
        <Text style={styles.gameOverBtnText}>Back to Lobby</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  scroll: { paddingHorizontal: 12, paddingBottom: 50, gap: 14 },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgDark, gap: 14 },
  loadingTitle: { color: Colors.goldLight, fontSize: 40, fontWeight: '900', letterSpacing: 8 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: Colors.bgPanel,
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,158,11,0.15)',
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  iconBtnText: { fontSize: 20 },
  roomBadge: { alignItems: 'center' },
  roomBadgeLabel: { color: Colors.textMuted, fontSize: 9, letterSpacing: 3, fontWeight: '700' },
  roomBadgeCode: { color: Colors.goldLight, fontSize: 18, fontWeight: '900', letterSpacing: 4 },

  playersRow: { paddingHorizontal: 2, paddingVertical: 6, gap: 10 },

  // Turn banners
  turnBannerMine: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.success, borderRadius: 14,
    paddingVertical: 14, gap: 10, overflow: 'hidden',
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 16, elevation: 8,
  },
  turnBannerShimmer: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  turnBannerStar: { fontSize: 20 },
  turnBannerTextMine: { color: Colors.bgDark, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  turnBannerRolled: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  turnBannerTextRolled: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
  turnBannerWait: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  turnBannerTextWait: { color: Colors.electricLight, fontSize: 14, fontWeight: '600' },

  diceSection: { alignItems: 'center', paddingVertical: 12 },

  controls: { gap: 10 },
  actionBtn: {
    borderRadius: 14, paddingVertical: 18, alignItems: 'center',
    overflow: 'hidden', position: 'relative',
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 7,
  },
  actionBtnDisabled: { opacity: 0.45 },
  actionBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 1.5 },
  btnShine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  autoEndHint: {
    alignItems: 'center', paddingVertical: 10,
    backgroundColor: 'rgba(90,77,122,0.3)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
  },
  autoEndHintText: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic' },

  logToggle: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgPanel, padding: 14, borderRadius: 12,
    gap: 10, borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)',
  },
  logDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gold },
  latestLog: { flex: 1, color: Colors.goldPale, fontSize: 13 },
  logChevron: { color: Colors.gold, fontSize: 13, fontWeight: '700' },
  logPanel: {
    backgroundColor: Colors.bgPanel, padding: 14, borderRadius: 12, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  logLineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  logBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted, marginTop: 5 },
  logBulletActive: { backgroundColor: Colors.gold },
  logLine: { flex: 1, color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  logLineLatest: { color: Colors.goldLight, fontWeight: '700' },

  // Waiting room
  waitingScroll: { flexGrow: 1, padding: 22, alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 44 },
  waitingEyebrow: { color: Colors.gold, fontSize: 11, letterSpacing: 5, fontWeight: '700' },
  waitingTitle: {
    color: Colors.goldLight, fontSize: 44, fontWeight: '900', letterSpacing: 8,
    textShadowColor: Colors.gold, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18,
  },
  codeBox: {
    backgroundColor: Colors.bgPanel, borderRadius: 16, padding: 22,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.gold,
    gap: 6, width: '100%', maxWidth: 340,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
  },
  codeBoxLabel: { color: Colors.textMuted, fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  codeBoxCode: { color: Colors.goldLight, fontSize: 40, fontWeight: '900', letterSpacing: 8 },
  codeBoxHint: { color: Colors.textSecondary, fontSize: 12, fontStyle: 'italic' },
  waitingPlayersHeader: { color: Colors.gold, fontSize: 12, letterSpacing: 3, fontWeight: '800', marginTop: 4 },
  waitingPlayers: { gap: 10, width: '100%', maxWidth: 380 },
  waitingPlayer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgPanel,
    borderRadius: 14, padding: 14, gap: 12, borderWidth: 1.5,
  },
  waitingPlayerColorDot: { width: 10, height: 10, borderRadius: 5 },
  waitingPlayerToken: { fontSize: 26 },
  waitingPlayerName: { flex: 1, fontSize: 15, fontWeight: '700' },
  readyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  readyText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  waitingPlayerEmpty: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed',
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  waitingEmptyText: { color: Colors.textMuted, fontStyle: 'italic', fontSize: 13 },
  startBtn: {
    backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', overflow: 'hidden', position: 'relative',
    width: '100%', maxWidth: 380, marginTop: 8,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  startBtnDisabled: { opacity: 0.5 },
  startBtnText: { color: Colors.bgDark, fontWeight: '800', fontSize: 16, letterSpacing: 2 },
  waitingHintBox: {
    backgroundColor: 'rgba(124,58,237,0.12)', borderRadius: 12, padding: 14, marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  waitingHint: { color: Colors.electricLight, fontStyle: 'italic', fontSize: 14, textAlign: 'center' },

  // Card modal
  cardModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  cardModal: {
    borderRadius: 20, padding: 30, alignItems: 'center', maxWidth: 380, width: '90%',
    backgroundColor: '#fffbeb', borderWidth: 3,
  },
  cardModalIcon: { fontSize: 54 },
  cardModalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 3, marginTop: 10 },
  cardModalDivider: { width: 70, height: 3, marginVertical: 14, borderRadius: 2 },
  cardModalText: { fontSize: 16, color: '#1c1917', textAlign: 'center', lineHeight: 26, fontWeight: '500' },

  // Game over
  gameOverOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(6,4,21,0.96)',
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  trophy: { fontSize: 80 },
  gameOverTitle: {
    color: Colors.goldLight, fontSize: 38, fontWeight: '900', letterSpacing: 4,
    textShadowColor: Colors.gold, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  gameOverWinner: { color: Colors.textPrimary, fontSize: 26, fontWeight: '800' },
  gameOverSub: { color: Colors.gold, fontSize: 16, letterSpacing: 3, fontWeight: '700' },
  gameOverMoney: { color: Colors.success, fontSize: 22, fontWeight: '800', marginTop: 4 },
  gameOverBtn: {
    backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 40, marginTop: 24,
    overflow: 'hidden', position: 'relative',
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  gameOverBtnText: { color: Colors.bgDark, fontWeight: '800', fontSize: 15, letterSpacing: 2 },
});
