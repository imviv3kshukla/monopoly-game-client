// app/game/[roomId].tsx — Main game screen with everything

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Animated, Modal,
} from 'react-native';
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

  const me = myPlayer();
  const myTurn = isMyTurn();
  const current = currentPlayer();

  // Auto-show buy modal when server says pendingAction = "BUY"
  useEffect(() => {
    if (gameState?.pendingAction === 'BUY' && myTurn && me) {
      const sp = BOARD[me.position];
      setSelectedSpace(sp);
    }
  }, [gameState?.pendingAction]);

  // Show card popup when chance/community is drawn
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
      const t = setTimeout(() => setRolling(false), 800);
      return () => clearTimeout(t);
    }
  }, [gameState?.lastDice]);

  if (!gameState) return <LoadingScreen />;

  const propertyOnSelected = selectedSpace ? gameState.properties[selectedSpace.id] : undefined;
  const isOwnerMe = propertyOnSelected?.ownerId === myPlayerId;
  const ownsColorSet = selectedSpace?.color
    ? BOARD.filter(s => s.color === selectedSpace.color)
        .every(s => gameState.properties[s.id]?.ownerId === myPlayerId)
    : false;
  const showBuyButtons = gameState.pendingAction === 'BUY' &&
                         myTurn &&
                         selectedSpace?.id === me?.position;

  const handleRoll = () => {
    setRolling(true);
    sendRoll(roomId!, myPlayerId!);
  };

  // ─── WAITING ROOM ────────────────────────────────────────
  if (gameState.status === 'WAITING') {
    return <WaitingRoom roomId={roomId!} state={gameState} myPlayerId={myPlayerId!} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ─── Top Bar ─── */}
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

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ─── Players Row ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.playersRow}
        >
          {gameState.players.map((p, i) => {
            const propCount = Object.values(gameState.properties)
              .filter(pr => pr.ownerId === p.id).length;
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

        {/* ─── Board ─── */}
        <Board
          players={gameState.players}
          properties={gameState.properties}
          onTilePress={setSelectedSpace}
        />

        {/* ─── Dice ─── */}
        <View style={styles.diceSection}>
          <AnimatedDice values={gameState.lastDice} rolling={rolling} />
        </View>

        {/* ─── Turn Status ─── */}
        <View style={styles.turnStatus}>
          {myTurn ? (
            <Text style={styles.turnTextActive}>✨ It's your turn!</Text>
          ) : (
            <Text style={styles.turnTextWait}>
              ⏳ Waiting for {current?.token} {current?.name}...
            </Text>
          )}
        </View>

        {/* ─── Action Buttons ─── */}
        {myTurn && !me?.bankrupt && (
          <View style={styles.controls}>
            {gameState.pendingAction === null && (
              <ActionButton
                label="🎲  ROLL DICE"
                primary
                onPress={handleRoll}
                disabled={rolling}
              />
            )}
            {me?.inJail && gameState.pendingAction === null && (
              <ActionButton
                label="⛓️  Pay ₹500 Bail"
                onPress={() => sendPayJail(roomId!, myPlayerId!)}
              />
            )}
            {gameState.pendingAction === null && (
              <ActionButton
                label="End Turn  →"
                onPress={() => sendEndTurn(roomId!, myPlayerId!)}
              />
            )}
          </View>
        )}

        {/* ─── Latest Log Line + Toggle ─── */}
        <TouchableOpacity onPress={() => setShowLog(!showLog)} style={styles.logToggle}>
          <Text style={styles.latestLog} numberOfLines={1}>
            ▸ {gameState.log[0] || 'Game just started'}
          </Text>
          <Text style={styles.logChevron}>{showLog ? '▼' : '▲'}</Text>
        </TouchableOpacity>

        {showLog && (
          <View style={styles.logPanel}>
            {gameState.log.slice(0, 15).map((line, i) => (
              <Text
                key={i}
                style={[styles.logLine, i === 0 && styles.logLineLatest]}
              >
                ▸ {line}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ─── Property Modal ─── */}
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
        onBuy={() => { sendBuy(roomId!, myPlayerId!); setSelectedSpace(null); }}
        onSkipBuy={() => { sendSkipBuy(roomId!, myPlayerId!); setSelectedSpace(null); }}
        onBuild={(id) => { sendBuildHouse(roomId!, myPlayerId!, id); setSelectedSpace(null); }}
        onClose={() => setSelectedSpace(null)}
      />

      {/* ─── Card Drawn Modal ─── */}
      <CardDrawnModal text={showCardModal} onClose={() => setShowCardModal(null)} />

      {/* ─── Game Over ─── */}
      {gameState.status === 'FINISHED' && (
        <GameOverModal
          winner={gameState.players.find(p => p.id === gameState.winnerId)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingTitle}>BUSINESS</Text>
      <Text style={styles.loadingText}>Connecting to game...</Text>
    </View>
  );
}

function WaitingRoom({ roomId, state, myPlayerId }: any) {
  const isHost = state.players[0]?.id === myPlayerId;
  const canStart = state.players.length >= 2;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.waitingContainer}>
        <Text style={styles.waitingEyebrow}>WAITING ROOM</Text>
        <Text style={styles.waitingTitle}>BUSINESS</Text>

        <View style={styles.codeBox}>
          <Text style={styles.codeBoxLabel}>SHARE THIS ROOM CODE</Text>
          <Text style={styles.codeBoxCode}>{roomId}</Text>
          <Text style={styles.codeBoxHint}>Friends can join with this code</Text>
        </View>

        <Text style={styles.waitingPlayersHeader}>
          PLAYERS ({state.players.length}/4)
        </Text>

        <View style={styles.waitingPlayers}>
          {state.players.map((p: any, i: number) => (
            <View key={p.id} style={styles.waitingPlayer}>
              <Text style={styles.waitingPlayerToken}>{p.token}</Text>
              <Text style={[styles.waitingPlayerName, { color: p.color }]}>
                {p.name}
                {p.id === myPlayerId && ' (You)'}
                {i === 0 && ' 👑'}
              </Text>
            </View>
          ))}
          {Array.from({ length: 4 - state.players.length }).map((_, i) => (
            <View key={`empty${i}`} style={[styles.waitingPlayer, styles.waitingPlayerEmpty]}>
              <Text style={styles.waitingPlayerEmpty_}>⏳ Waiting for player...</Text>
            </View>
          ))}
        </View>

        {isHost ? (
          <TouchableOpacity
            style={[styles.startBtn, !canStart && { opacity: 0.5 }]}
            disabled={!canStart}
            onPress={() => sendStartGame(roomId, myPlayerId)}
          >
            <Text style={styles.startBtnText}>
              {canStart ? '▶  START GAME' : 'Need at least 2 players'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.waitingHint}>
            Waiting for {state.players[0]?.name} to start the game...
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

function ActionButton({ label, primary, onPress, disabled }: any) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        primary ? styles.actionBtnPrimary : styles.actionBtnSecondary,
        disabled && { opacity: 0.5 },
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={[
        styles.actionBtnText,
        primary ? styles.actionBtnTextPrimary : styles.actionBtnTextSecondary,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function CardDrawnModal({ text, onClose }: { text: string | null; onClose: () => void }) {
  if (!text) return null;
  const isChance = text.startsWith('Chance:');
  const cleanText = text.replace(/^(Chance|Community):\s*/, '');
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.cardModalOverlay}>
        <View style={[styles.cardModal, { backgroundColor: isChance ? '#FFF8E8' : '#F0F5FF' }]}>
          <Text style={styles.cardModalIcon}>{isChance ? '❓' : '💌'}</Text>
          <Text style={styles.cardModalTitle}>
            {isChance ? 'CHANCE' : 'COMMUNITY CHEST'}
          </Text>
          <View style={styles.cardModalDivider} />
          <Text style={styles.cardModalText}>{cleanText}</Text>
        </View>
      </View>
    </Modal>
  );
}

function GameOverModal({ winner }: any) {
  if (!winner) return null;
  return (
    <View style={styles.gameOverOverlay}>
      <Text style={styles.trophy}>🏆</Text>
      <Text style={styles.gameOverTitle}>GAME OVER!</Text>
      <Text style={styles.gameOverWinner}>{winner.token} {winner.name}</Text>
      <Text style={styles.gameOverSub}>WINS THE GAME!</Text>
      <Text style={styles.gameOverMoney}>Final: ₹{winner.money.toLocaleString()}</Text>
      <TouchableOpacity style={styles.gameOverBtn} onPress={() => router.replace('/')}>
        <Text style={styles.gameOverBtnText}>Back to Lobby</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  scroll: { padding: 12, gap: 12, paddingBottom: 40 },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgDark, gap: 12 },
  loadingTitle: { color: Colors.goldLight, fontSize: 36, fontWeight: '900', letterSpacing: 6 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.bgPanel, borderBottomWidth: 1, borderBottomColor: '#2d2547',
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2d2547', alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { fontSize: 18 },
  roomBadge: { alignItems: 'center' },
  roomBadgeLabel: { color: Colors.textMuted, fontSize: 9, letterSpacing: 2, fontWeight: 'bold' },
  roomBadgeCode: { color: Colors.goldLight, fontSize: 16, fontWeight: 'bold', letterSpacing: 3 },

  playersRow: { paddingHorizontal: 4, paddingVertical: 4, gap: 8 },

  diceSection: { alignItems: 'center', paddingVertical: 16, marginVertical: 4 },

  turnStatus: { alignItems: 'center', paddingVertical: 8 },
  turnTextActive: { color: Colors.success, fontSize: 16, fontWeight: 'bold' },
  turnTextWait: { color: Colors.textSecondary, fontSize: 14 },

  controls: { gap: 8 },
  actionBtn: { borderRadius: 10, padding: 16, alignItems: 'center' },
  actionBtnPrimary: {
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 14,
  },
  actionBtnSecondary: { backgroundColor: '#2d2547', borderWidth: 1, borderColor: '#3a3252' },
  actionBtnText: { fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  actionBtnTextPrimary: { color: Colors.bgDark },
  actionBtnTextSecondary: { color: Colors.textPrimary },

  logToggle: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgPanel,
    padding: 12, borderRadius: 8, gap: 10,
  },
  latestLog: { flex: 1, color: Colors.goldPale, fontSize: 13 },
  logChevron: { color: Colors.gold, fontSize: 12 },
  logPanel: {
    backgroundColor: Colors.bgPanel, padding: 12, borderRadius: 8, gap: 6,
  },
  logLine: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  logLineLatest: { color: Colors.goldLight, fontWeight: 'bold' },

  // Waiting room
  waitingContainer: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 16 },
  waitingEyebrow: { color: Colors.gold, fontSize: 11, letterSpacing: 4, fontWeight: 'bold' },
  waitingTitle: { color: Colors.goldLight, fontSize: 40, fontWeight: '900', letterSpacing: 6 },
  codeBox: {
    backgroundColor: Colors.bgPanel, borderRadius: 12, padding: 20, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.gold, gap: 4, marginVertical: 12, minWidth: 280,
  },
  codeBoxLabel: { color: Colors.textMuted, fontSize: 10, letterSpacing: 2, fontWeight: 'bold' },
  codeBoxCode: { color: Colors.goldLight, fontSize: 36, fontWeight: '900', letterSpacing: 6 },
  codeBoxHint: { color: Colors.textSecondary, fontSize: 11, fontStyle: 'italic' },
  waitingPlayersHeader: { color: Colors.gold, fontSize: 12, letterSpacing: 2, fontWeight: 'bold', marginTop: 8 },
  waitingPlayers: { gap: 8, width: '100%', maxWidth: 320 },
  waitingPlayer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgPanel,
    borderRadius: 10, padding: 12, gap: 10, borderWidth: 1, borderColor: '#2d2547',
  },
  waitingPlayerEmpty: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  waitingPlayerToken: { fontSize: 24 },
  waitingPlayerName: { fontSize: 15, fontWeight: '600' },
  waitingPlayerEmpty_: { color: Colors.textMuted, fontStyle: 'italic', fontSize: 13 },
  startBtn: {
    backgroundColor: Colors.gold, borderRadius: 10, padding: 18, alignItems: 'center',
    minWidth: 280, marginTop: 16,
  },
  startBtnText: { color: Colors.bgDark, fontWeight: 'bold', fontSize: 15, letterSpacing: 2 },
  waitingHint: { color: Colors.textSecondary, fontStyle: 'italic', marginTop: 16 },

  // Card drawn modal
  cardModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  cardModal: {
    borderRadius: 16, padding: 28, alignItems: 'center', maxWidth: 380, width: '90%',
    borderWidth: 3, borderColor: '#1a0a00',
  },
  cardModalIcon: { fontSize: 48 },
  cardModalTitle: { fontSize: 18, fontWeight: '900', color: '#1a0a00', letterSpacing: 3, marginTop: 8 },
  cardModalDivider: { width: 60, height: 2, backgroundColor: '#1a0a00', marginVertical: 12 },
  cardModalText: { fontSize: 16, color: '#1a0a00', textAlign: 'center', lineHeight: 24, fontWeight: '500' },

  // Game over
  gameOverOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  trophy: { fontSize: 72 },
  gameOverTitle: { color: Colors.goldLight, fontSize: 36, fontWeight: '900', letterSpacing: 4 },
  gameOverWinner: { color: Colors.textPrimary, fontSize: 28, fontWeight: 'bold' },
  gameOverSub: { color: Colors.gold, fontSize: 16, letterSpacing: 3 },
  gameOverMoney: { color: Colors.textSecondary, fontSize: 16, marginTop: 8 },
  gameOverBtn: { backgroundColor: Colors.gold, borderRadius: 10, padding: 14, paddingHorizontal: 32, marginTop: 20 },
  gameOverBtnText: { color: Colors.bgDark, fontWeight: 'bold', fontSize: 14, letterSpacing: 2 },
});
