// components/AnimatedDice.tsx — bold bouncy dice with rolling shake animation

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '../constants/theme';

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

interface Props {
  values: [number, number];
  rolling: boolean;
}

export function AnimatedDice({ values, rolling }: Props) {
  return (
    <View style={styles.row}>
      <Die value={values[0]} rolling={rolling} delay={0} />
      <View style={styles.vsContainer}>
        <Text style={styles.plusText}>+</Text>
      </View>
      <Die value={values[1]} rolling={rolling} delay={120} />
      {!rolling && (
        <View style={styles.sumBadge}>
          <Text style={styles.sumText}>{values[0] + values[1]}</Text>
        </View>
      )}
    </View>
  );
}

function Die({ value, rolling, delay }: { value: number; rolling: boolean; delay: number }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(value);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (rolling) {
      // Cycle through random faces
      intervalRef.current = setInterval(() => {
        setDisplayValue(Math.ceil(Math.random() * 6));
      }, 75);

      // Spin + scale up
      Animated.parallel([
        Animated.sequence([
          Animated.timing(rotation, {
            toValue: 1,
            duration: 650,
            easing: Easing.out(Easing.cubic),
            delay,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.4, duration: 220, delay, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 3, tension: 80, useNativeDriver: true }),
        ]),
        // Shake left-right
        Animated.loop(
          Animated.sequence([
            Animated.timing(shakeX, { toValue: 6, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -6, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
          ]),
          { iterations: 5 }
        ),
        // Glow pulse while rolling
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.4, duration: 200, useNativeDriver: true }),
          ])
        ),
      ]).start();

      setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayValue(value);
        rotation.setValue(0);
        glowAnim.setValue(0);
        shakeX.setValue(0);
      }, 650 + delay);
    } else {
      setDisplayValue(value);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [rolling, value, delay]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 0.7],
  });

  return (
    <View style={styles.dieWrapper}>
      {/* Glow behind the die */}
      <Animated.View style={[styles.dieGlow, { opacity: glowOpacity }]} />
      <Animated.View
        style={[
          styles.die,
          { transform: [{ rotate }, { scale }, { translateX: shakeX }] },
        ]}
      >
        <Text style={styles.dieFace}>{FACES[displayValue - 1]}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  dieWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieGlow: {
    position: 'absolute',
    width: 88, height: 88,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 0,
  },
  die: {
    width: 76,
    height: 76,
    backgroundColor: Colors.cream,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  dieFace: {
    fontSize: 44,
    color: Colors.bgDark,
  },

  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  plusText: {
    color: Colors.textMuted,
    fontSize: 20,
    fontWeight: '300',
  },

  sumBadge: {
    backgroundColor: Colors.electric,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 4,
    shadowColor: Colors.electric,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  sumText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
