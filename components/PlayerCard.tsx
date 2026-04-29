// components/PlayerCard.tsx — beautiful player card with money change animation

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
  const moneyAnim = useRef(new Animated.Value(0)).current;
  const prevMoney = useRef(player.money);

  // Pulse animation when active
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  // Flash money when it changes
  useEffect(() => {
    if (player.money !== prevMoney.current) {
      const isGain = player.money > prevMoney.current;
      Animated.sequence([
        Animated.timing(moneyAnim, { toValue: isGain ? 1 : -1, duration: 300, useNativeDriver: false }),
        Animated.timing(moneyAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ]).start();
      prevMoney.current = player.money;
    }
  }, [player.money]);

  const moneyColor = moneyAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [Colors.danger, Colors.goldLight, Colors.success],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        isActive && styles.cardActive,
        player.bankrupt && styles.cardBankrupt,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      {isActive && <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>TURN</Text></View>}

      <View style={styles.header}>
        <Text style={styles.token}>{player.token}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: player.color }]} numberOfLines={1}>
            {player.name}{isMe && ' (You)'}
          </Text>
          <Text style={styles.subInfo}>
            {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
            {player.inJail && ' · ⛓️ Jail'}
          </Text>
        </View>
      </View>

      <Animated.Text style={[styles.money, { color: moneyColor }]}>
        ₹{player.money.toLocaleString()}
      </Animated.Text>

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
    backgroundColor: Colors.bgPanel,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    minWidth: 140,
    borderWidth: 1.5,
    borderColor: '#2d2547',
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  cardBankrupt: { opacity: 0.4 },

  activeBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Colors.bgDark,
    letterSpacing: 1,
  },

  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  token: { fontSize: 24 },
  name: { fontWeight: 'bold', fontSize: 14 },
  subInfo: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },

  money: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },

  bankruptOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(231,76,60,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankruptText: {
    color: Colors.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
