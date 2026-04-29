// components/AnimatedDice.tsx — real dot faces with 3D surface shading

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '../constants/theme';

// [col_idx, row_idx] for each dot on a face (0=left/top, 1=center, 2=right/bottom)
const DOT_CONFIGS: [number, number][][] = [
  [],
  [[1, 1]],
  [[2, 0], [0, 2]],
  [[2, 0], [1, 1], [0, 2]],
  [[0, 0], [2, 0], [0, 2], [2, 2]],
  [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
];

// Dot top-left positions within the 66×66 face container
const DOT_GRID = [5, 27, 49];

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
      intervalRef.current = setInterval(() => {
        setDisplayValue(Math.ceil(Math.random() * 6));
      }, 75);

      Animated.parallel([
        Animated.timing(rotation, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.4, duration: 220, delay, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 3, tension: 80, useNativeDriver: true }),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(shakeX, { toValue: 6, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -6, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
          ]),
          { iterations: 5 }
        ),
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

  const dots = DOT_CONFIGS[displayValue] || [];

  return (
    <View style={styles.dieWrapper}>
      <Animated.View style={[styles.dieGlow, { opacity: glowOpacity }]} />
      <Animated.View
        style={[
          styles.die,
          { transform: [{ rotate }, { scale }, { translateX: shakeX }] },
        ]}
      >
        {/* Top surface highlight */}
        <View style={styles.dieHighlight} pointerEvents="none" />
        {/* Bottom shadow */}
        <View style={styles.dieShadowOverlay} pointerEvents="none" />
        {/* Dot face */}
        <View style={styles.dieFaceContainer}>
          {dots.map(([col, row], i) => (
            <View
              key={i}
              style={[styles.dot, { left: DOT_GRID[col], top: DOT_GRID[row] }]}
            >
              <View style={styles.dotHighlight} />
            </View>
          ))}
        </View>
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
    backgroundColor: '#f9f4e8',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.gold,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 12,
    overflow: 'hidden',
  },

  // 3D surface overlays (absolute, non-interactive)
  dieHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '48%',
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  dieShadowOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '28%',
    backgroundColor: 'rgba(0,0,0,0.10)',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },

  // Dot face
  dieFaceContainer: {
    width: 66, height: 66,
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    width: 12, height: 12,
    borderRadius: 6,
    backgroundColor: '#2c1810',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.45,
    shadowRadius: 1,
    elevation: 2,
    overflow: 'hidden',
  },
  dotHighlight: {
    position: 'absolute',
    top: 1.5, left: 1.5,
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.38)',
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 12,
    elevation: 8,
  },
  sumText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
