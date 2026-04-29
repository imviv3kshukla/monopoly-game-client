// app/rules.tsx — Rules screen accessible from anywhere

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, router } from 'expo-router';
import { RULES } from '../constants/rules';
import { Colors } from '../constants/theme';

export default function RulesScreen() {
  const [expanded, setExpanded] = useState<string | null>('objective');

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📖 GAME RULES</Text>
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
  container: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgPanel,
    backgroundColor: Colors.bgPanel,
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  backText: { color: Colors.gold, fontSize: 16, fontWeight: '600' },
  headerTitle: {
    color: Colors.goldLight,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  intro: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  bold: { color: Colors.goldLight, fontWeight: 'bold', fontStyle: 'normal' },

  ruleCard: {
    backgroundColor: Colors.bgPanel,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2d2547',
    overflow: 'hidden',
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  ruleIcon: { fontSize: 24 },
  ruleTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  ruleChevron: { color: Colors.gold, fontSize: 12 },

  ruleContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,160,23,0.15)',
    paddingTop: 10,
  },
  ruleLine: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  ruleBullet: { color: Colors.gold, fontSize: 14 },
  ruleText: { color: Colors.textPrimary, fontSize: 13, lineHeight: 20, flex: 1 },

  tipsCard: {
    backgroundColor: 'rgba(212,160,23,0.08)',
    borderColor: Colors.gold,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  tipsTitle: {
    color: Colors.goldLight,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  tipText: { color: Colors.textPrimary, fontSize: 13, lineHeight: 22 },
});
