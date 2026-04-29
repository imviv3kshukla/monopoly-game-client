// components/AnimatedDice.tsx — bouncy dice with rolling animation

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
      <Die value={values[1]} rolling={rolling} delay={150} />
      {!rolling && <Text style={styles.sumText}>= {values[0] + values[1]}</Text>}
    </View>
  );
}

function Die({ value, rolling, delay }: { value: number; rolling: boolean; delay: number }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [displayValue, setDisplayValue] = useState(value);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (rolling) {
      // Cycle through random faces while rolling
      intervalRef.current = setInterval(() => {
        setDisplayValue(Math.ceil(Math.random() * 6));
      }, 80);

      // Animate spin and bounce
      Animated.parallel([
        Animated.sequence([
          Animated.timing(rotation, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            delay,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.3,
            duration: 200,
            delay,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Stop spinning, show real value
      setTimeout(() => {
        clearInterval(intervalRef.current);
        setDisplayValue(value);
        rotation.setValue(0);
      }, 600 + delay);
    } else {
      setDisplayValue(value);
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [rolling, value, delay]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  return (
    <Animated.View style={[styles.die, { transform: [{ rotate }, { scale }] }]}>
      <Text style={styles.dieFace}>{FACES[displayValue - 1]}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  die: {
    width: 56,
    height: 56,
    backgroundColor: Colors.cream,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  dieFace: {
    fontSize: 36,
    color: Colors.bgDark,
  },
  sumText: {
    color: Colors.goldLight,
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});
