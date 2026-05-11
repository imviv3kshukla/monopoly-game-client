// app/rules.tsx — Rules screen accessible from anywhere

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, router } from 'expo-router';
import { RULES } from '../constants/rules';

export default function RulesScreen() {
  const [expanded, setExpanded] = useState<string | null>('objective');

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.sky} pointerEvents="none">
        <View style={[styles.cloud, styles.cloudA]} />
        <View style={[styles.cloud, styles.cloudB]} />
        <View style={styles.sunbeamA} />
        <View style={styles.sunbeamB} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GAME RULES</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.intro}>
          Welcome to <Text style={styles.bold}>BUSINESS</Text> — the Indian Property Trading Game!
          Tap any section below to expand and read more.
        </Text>

        {RULES.map(rule => (
          <RuleCard
            key={rule.id}
            rule={rule}
            isExpanded={expanded === rule.id}
            onPress={() => setExpanded(expanded === rule.id ? null : rule.id)}
          />
        ))}

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 STRATEGY TIPS</Text>
          <Text style={styles.tipText}>• Buy properties early — you'll need them!</Text>
          <Text style={styles.tipText}>• Try to complete color sets — rent doubles!</Text>
          <Text style={styles.tipText}>• Save cash for rent emergencies.</Text>
          <Text style={styles.tipText}>• Orange & Red properties are landed on most often.</Text>
          <Text style={styles.tipText}>• Build evenly across your color set.</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function RuleCard({ rule, isExpanded, onPress }: any) {
  return (
    <TouchableOpacity style={styles.ruleCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.ruleHeader}>
        <Text style={styles.ruleIcon}>{rule.icon}</Text>
        <Text style={styles.ruleTitle}>{rule.title}</Text>
        <Text style={styles.ruleChevron}>{isExpanded ? '▼' : '▶'}</Text>
      </View>
      {isExpanded && (
        <View style={styles.ruleContent}>
          {rule.content.map((line: string, i: number) => (
            <View key={i} style={styles.ruleLine}>
              <Text style={styles.ruleBullet}>•</Text>
              <Text style={styles.ruleText}>{line}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1687ff' },
  sky: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#1687ff',
  },
  cloud: {
    position: 'absolute',
    height: 54,
    borderRadius: 32,
    backgroundColor: '#fff',
    shadowColor: '#bfdbfe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
  },
  cloudA: { top: 72, left: 22, width: 136 },
  cloudB: { top: 110, right: -28, width: 132 },
  sunbeamA: {
    position: 'absolute',
    top: -52,
    right: 40,
    width: 28,
    height: 220,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '28deg' }],
  },
  sunbeamB: {
    position: 'absolute',
    top: -60,
    right: 92,
    width: 18,
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ rotate: '28deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7,5,16,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  backText: { color: '#fff', fontSize: 34, lineHeight: 36, fontWeight: '900' },
  headerTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: '#7e22ce',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 44 },

  intro: {
    color: '#172554',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    fontWeight: '700',
  },
  bold: { color: '#7e22ce', fontWeight: '900', fontStyle: 'normal' },

  ruleCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.72)',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  ruleIcon: { fontSize: 24 },
  ruleTitle: {
    color: '#172554',
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
  },
  ruleChevron: { color: '#2563eb', fontSize: 12, fontWeight: '900' },

  ruleContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(37,99,235,0.16)',
    paddingTop: 10,
  },
  ruleLine: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  ruleBullet: { color: '#f59e0b', fontSize: 14 },
  ruleText: { color: '#1e3a8a', fontSize: 13, lineHeight: 20, flex: 1, fontWeight: '700' },

  tipsCard: {
    backgroundColor: 'rgba(254,243,199,0.96)',
    borderColor: '#facc15',
    borderWidth: 3,
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  tipsTitle: {
    color: '#ca8a04',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
  },
  tipText: { color: '#172554', fontSize: 13, lineHeight: 22, fontWeight: '700' },
});
