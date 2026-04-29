// app/game/[roomId].tsx
// The main game screen — shows board, players, dice, controls

import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Alert
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useGameStore } from '../../store/gameStore';
import {
  sendRoll, sendBuy, sendSkipBuy, sendEndTurn, sendPayJail
} from '../../services/socket';

export default function GameScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { gameState, myPlayerId, isMyTurn, currentPlayer, myPlayer } = useGameStore();

  const myTurn = isMyTurn();
  const current = currentPlayer();
  const me = myPlayer();

  // Show buy modal when server sends pendingAction = "BUY"
  useEffect(() => {
    if (gameState?.pendingAction === 'BUY' && myTurn) {
      Alert.alert(
        '🏠 Buy Property?',
        gameState.pendingMessage ?? '',
        [
          { text: 'Buy', onPress: () => sendBuy(roomId, myPlayerId!) },
          { text: 'Skip', onPress: () => sendSkipBuy(roomId, myPlayerId!), style: 'cancel' },
        ]
      );
    }
  }, [gameState?.pendingAction]);

  if (!gameState) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Connecting to game...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Players Row ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersRow}>
        {gameState.players.map((p, i) => (
          <PlayerCard
            key={p.id}
            player={p}
            isActive={i === gameState.currentPlayerIndex}
            isMe={p.id === myPlayerId}
          />
        ))}
      </ScrollView>

      {/* ── Dice Display ── */}
      <View style={styles.diceRow}>
        <DieBox value={gameState.lastDice[0]} />
        <DieBox value={gameState.lastDice[1]} />
        <Text style={styles.diceSum}>= {gameState.lastDice[0] + gameState.lastDice[1]}</Text>
      </View>

      {/* ── Game Log ── */}
      <ScrollView style={styles.log} nestedScrollEnabled>
        {gameState.log.slice(0, 10).map((line, i) => (
          <Text key={i} style={[styles.logLine, i === 0 && styles.logLatest]}>
            ▸ {line}
          </Text>
        ))}
      </ScrollView>

      {/* ── Controls (only shown on your turn) ── */}
      {myTurn && !me?.bankrupt && (
        <View style={styles.controls}>
          {gameState.status === 'PLAYING' && !gameState.pendingAction && (
            <>
              <ActionButton
                label="🎲 Roll Dice"
                color="#d4a017"
                onPress={() => sendRoll(roomId, myPlayerId!)}
              />
              {me?.inJail && (
                <ActionButton
                  label="⛓️ Pay ₹500 Bail"
                  color="#555"
                  onPress={() => sendPayJail(roomId, myPlayerId!)}
                />
              )}
              <ActionButton
                label="End Turn →"
                color="#333"
                onPress={() => sendEndTurn(roomId, myPlayerId!)}
              />
            </>
          )}
        </View>
      )}

      {!myTurn && current && (
        <View style={styles.waitingBanner}>
          <Text style={styles.waitingText}>
            {current.token} {current.name}'s turn...
          </Text>
        </View>
      )}

      {gameState.status === 'FINISHED' && (
        <WinnerBanner winnerId={gameState.winnerId} players={gameState.players} />
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlayerCard({ player, isActive, isMe }: {
  player: any; isActive: boolean; isMe: boolean;
}) {
  return (
    <View style={[styles.playerCard, isActive && styles.playerCardActive, player.bankrupt && styles.playerCardBankrupt]}>
      <Text style={styles.playerToken}>{player.token}</Text>
      <Text style={[styles.playerName, { color: player.color }]}>
        {player.name}{isMe ? ' (You)' : ''}
      </Text>
      <Text style={styles.playerMoney}>₹{player.money.toLocaleString()}</Text>
      {player.inJail && <Text style={styles.jailBadge}>⛓️ Jail</Text>}
      {player.bankrupt && <Text style={styles.bankruptBadge}>💀 Out</Text>}
    </View>
  );
}

function DieBox({ value }: { value: number }) {
  const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
  return (
    <View style={styles.die}>
      <Text style={styles.dieFace}>{faces[value - 1]}</Text>
    </View>
  );
}

function ActionButton({ label, color, onPress }: {
  label: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.actionBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function WinnerBanner({ winnerId, players }: { winnerId: string | null; players: any[] }) {
  const winner = players.find(p => p.id === winnerId);
  return (
    <View style={styles.winnerOverlay}>
      <Text style={styles.winnerTrophy}>🏆</Text>
      <Text style={styles.winnerTitle}>GAME OVER!</Text>
      <Text style={styles.winnerName}>{winner?.token} {winner?.name} WINS!</Text>
      <Text style={styles.winnerMoney}>₹{winner?.money.toLocaleString()}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e0b1a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0e0b1a' },
  loadingText: { color: '#d4a017', fontSize: 18 },

  playersRow: { paddingHorizontal: 12, paddingTop: 10, flexGrow: 0 },
  playerCard: {
    backgroundColor: '#1a1330', borderRadius: 10, padding: 10,
    marginRight: 10, minWidth: 110, borderWidth: 1.5, borderColor: '#333'
  },
  playerCardActive: { borderColor: '#d4a017' },
  playerCardBankrupt: { opacity: 0.4 },
  playerToken: { fontSize: 22 },
  playerName: { fontWeight: 'bold', fontSize: 13, marginTop: 2 },
  playerMoney: { color: '#f5d060', fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  jailBadge: { fontSize: 11, color: '#e74c3c', marginTop: 2 },
  bankruptBadge: { fontSize: 11, color: '#e74c3c', marginTop: 2 },

  diceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 12 },
  die: { width: 52, height: 52, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  dieFace: { fontSize: 32 },
  diceSum: { color: '#f5d060', fontSize: 20, fontWeight: 'bold' },

  log: { flex: 1, marginHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 10 },
  logLine: { color: '#999', fontSize: 12, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  logLatest: { color: '#f5d060', fontWeight: 'bold' },

  controls: { padding: 12, gap: 8 },
  actionBtn: { borderRadius: 8, padding: 14, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  waitingBanner: { padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', margin: 12, borderRadius: 8 },
  waitingText: { color: '#888', fontSize: 14 },

  winnerOverlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center', justifyContent: 'center', gap: 10
  },
  winnerTrophy: { fontSize: 64 },
  winnerTitle: { color: '#f5d060', fontSize: 36, fontWeight: 'bold', letterSpacing: 4 },
  winnerName: { color: '#fff', fontSize: 22 },
  winnerMoney: { color: '#d4a017', fontSize: 18 },
});
