// components/PlayerCard.tsx — colorful player card with money change animation

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/theme';
import { Player } from '../store/gameStore';

interface Props {
  player: Player;
  isActive: boolean;
  isMe: boolean;
  propertyCount: number;
}

export function PlayerCard({ player, isActive, isMe, propertyCount }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const moneyAnim = useRef(new Animated.Value(0)).current;
  const prevMoney = useRef(player.money);

  // Pulse + glow when active turn
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isActive]);

  // Flash money when it changes
  useEffect(() => {
    if (player.money !== prevMoney.current) {
      const isGain = player.money > prevMoney.current;
      Animated.sequence([
        Animated.timing(moneyAnim, { toValue: isGain ? 1 : -1, duration: 280, useNativeDriver: false }),
        Animated.timing(moneyAnim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ]).start();
      prevMoney.current = player.money;
    }
  }, [player.money]);

  const moneyColor = moneyAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [Colors.danger, Colors.goldLight, Colors.success],
  });

  const borderColor = isActive ? player.color : player.color + '40';

  return (
    <Animated.View
      style={[
        styles.card,
        { borderColor, transform: [{ scale: pulseAnim }] },
        player.bankrupt && styles.cardBankrupt,
      ]}
    >
      {/* Colored header strip */}
      <View style={[styles.colorStrip, { backgroundColor: player.color }]}>
        <Text style={styles.token}>{player.token}</Text>
        {isActive && (
          <Animated.View style={[styles.activeBadge, { opacity: glowAnim }]}>
            <Text style={styles.activeBadgeText}>TURN</Text>
          </Animated.View>
        )}
      </View>

      {/* Card body */}
      <View style={styles.body}>
        <Text style={[styles.name, { color: player.color }]} numberOfLines={1}>
          {player.name}{isMe && ' (You)'}
        </Text>

        <View style={styles.statsRow}>
          <Text style={styles.statChip}>🏠 {propertyCount}</Text>
          {player.inJail && <Text style={styles.jailChip}>⛓️ Jail</Text>}
        </View>

        <Animated.Text style={[styles.money, { color: moneyColor }]}>
          ₹{player.money.toLocaleString()}
        </Animated.Text>
      </View>

      {player.bankrupt && (
        <View style={styles.bankruptOverlay}>
          <Text style={styles.bankruptText}>💀 BANKRUPT</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    minWidth: 130,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: Colors.bgPanel,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  cardBankrupt: { opacity: 0.4 },

  colorStrip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  token: { fontSize: 22 },

  activeBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 1,
  },

  body: { padding: 10, gap: 6 },
  name: { fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },

  statsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  statChip: {
    fontSize: 11, color: Colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  jailChip: {
    fontSize: 11, color: Colors.danger,
    backgroundColor: 'rgba(248,113,113,0.12)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },

  money: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },

  bankruptOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(248,113,113,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  bankruptText: { color: Colors.danger, fontWeight: '800', fontSize: 13 },
});
