// components/Board.tsx — 10x10 game board with smooth pawn movement

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Easing } from 'react-native';
import { getGridPos, getSide, BoardSpace } from '../constants/board';
import { Colors, CITY_PHOTOS, TILE_ICONS } from '../constants/theme';
import { Player, Property } from '../store/gameStore';

const { width: screenW } = Dimensions.get('window');
const BOARD_SIZE = Math.min(screenW - 16, 720);
const CORNER = BOARD_SIZE * 0.13;
const SIDE = (BOARD_SIZE - CORNER * 2) / 8; // 8 non-corner tiles per side
const TOKEN_WIDTH = 15;
const TOKEN_HEIGHT = 20;

interface Props {
  spaces: BoardSpace[];
  players: Player[];
  properties: Record<number, Property>;
  onTilePress: (space: BoardSpace) => void;
  onMoveComplete?: (playerId: string) => void;
  rolling?: boolean;
}

export function Board({ spaces, players, properties, onTilePress, onMoveComplete, rolling }: Props) {
  const [displayPositions, setDisplayPositions] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    players.forEach(p => { init[p.id] = p.position; });
    return init;
  });

  const prevPositionsRef = useRef<Record<string, number>>({});
  const onMoveCompleteRef = useRef(onMoveComplete);
  const isMountedRef = useRef(true);
  // Holds moves received while dice are still rolling; flushed when rolling stops
  const pendingMovesRef = useRef<{ playerId: string; from: number; to: number }[]>([]);
  const totalTiles = spaces.length;
  const tokenSlots = buildTokenSlots(players, displayPositions);

  useEffect(() => { onMoveCompleteRef.current = onMoveComplete; }, [onMoveComplete]);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const startAnimation = useCallback((playerId: string, from: number, to: number) => {
    if (totalTiles <= 0) return;
    const forwardSteps = (to - from + totalTiles) % totalTiles;

    if (forwardSteps === 0 || forwardSteps > 12) {
      setDisplayPositions(dp => ({ ...dp, [playerId]: to }));
      setTimeout(() => {
        if (isMountedRef.current) onMoveCompleteRef.current?.(playerId);
      }, 150);
      return;
    }

    const steps: number[] = [];
    let pos = from;
    for (let i = 0; i < forwardSteps; i++) {
      pos = (pos + 1) % totalTiles;
      steps.push(pos);
    }

    let idx = 0;
    const tick = () => {
      if (!isMountedRef.current) return;
      if (idx >= steps.length) { onMoveCompleteRef.current?.(playerId); return; }
      setDisplayPositions(dp => ({ ...dp, [playerId]: steps[idx] }));
      idx++;
      setTimeout(tick, 430);
    };
    tick();
  }, [totalTiles]);

  // Record position changes; buffer them while dice are rolling
  const posKey = players.map(p => `${p.id}:${p.position}`).join(',');
  useEffect(() => {
    players.forEach(player => {
      if (player.bankrupt) {
        prevPositionsRef.current[player.id] = player.position;
        return;
      }
      const prev = prevPositionsRef.current[player.id];
      if (prev === undefined) {
        prevPositionsRef.current[player.id] = player.position;
        setDisplayPositions(dp => ({ ...dp, [player.id]: player.position }));
        return;
      }
      if (prev === player.position) return;

      prevPositionsRef.current[player.id] = player.position;

      if (rolling) {
        // Dice still spinning — store the move, start it when rolling stops
        pendingMovesRef.current = pendingMovesRef.current.filter(m => m.playerId !== player.id);
        pendingMovesRef.current.push({ playerId: player.id, from: prev, to: player.position });
      } else {
        startAnimation(player.id, prev, player.position);
      }
    });
  }, [posKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // When dice stop rolling, pause so player reads the result, then start pawn movement
  useEffect(() => {
    if (rolling) return;
    const moves = [...pendingMovesRef.current];
    if (moves.length === 0) return;
    const t = setTimeout(() => {
      pendingMovesRef.current = [];
      moves.forEach(m => startAnimation(m.playerId, m.from, m.to));
    }, 700); // 700ms pause: player sees the dice result before pawn moves
    return () => clearTimeout(t);
  }, [rolling, startAnimation]);

  return (
    <View style={[styles.boardOuter, { width: BOARD_SIZE + 12, height: BOARD_SIZE + 12 }]}>
      <View style={[styles.boardWrapper, { width: BOARD_SIZE + 6, height: BOARD_SIZE + 6 }]}>
        <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
          {spaces.map(sp => (
            <Tile
              key={sp.id}
              space={sp}
              property={properties[sp.id]}
              players={players}
              onPress={() => onTilePress(sp)}
            />
          ))}
          <CenterPanel />
          <View style={styles.tokenLayer} pointerEvents="none">
            {players.filter(p => !p.bankrupt).map(player => (
              <SmoothPawnToken
                key={player.id}
                player={player}
                position={displayPositions[player.id] ?? player.position}
                slot={tokenSlots[player.id] ?? 0}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Tile ────────────────────────────────────────────────────────────────────

function Tile({ space, property, players, onPress }: {
  space: BoardSpace;
  property?: Property;
  players: Player[];
  onPress: () => void;
}) {
  const [row, col] = getGridPos(space.id);
  const side = getSide(space.id);
  const pos = getPosition(row, col);
  const dim = getDimensions(side);

  const owner = property ? players.find(p => p.id === property.ownerId) : null;
  const colorBar = space.color ? Colors.prop[space.color as keyof typeof Colors.prop] : null;

  if (side === 'corner') {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.tile, styles.corner, pos, dim]} activeOpacity={0.7}>
        <CornerContent space={space} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tile, pos, dim, (side === 'left' || side === 'right') ? styles.tileVertical : null]}
      activeOpacity={0.7}
    >
      {owner && <View style={[styles.ownerDot, { backgroundColor: owner.color }]} />}

      {colorBar && side === 'bottom' && <View style={[styles.colorBand, { backgroundColor: colorBar }]} />}
      {colorBar && side === 'top' && <View style={[styles.colorBand, { backgroundColor: colorBar, order: 99 } as any]} />}
      {colorBar && side === 'left' && <View style={[styles.colorBandSide, { backgroundColor: colorBar }]} />}
      {colorBar && side === 'right' && <View style={[styles.colorBandSide, { backgroundColor: colorBar, right: undefined, left: 0 } as any]} />}

      <TileContent space={space} side={side} />

      {property && property.houses > 0 && (
        <View style={styles.housesRow}>
          {property.houses < 5
            ? Array.from({ length: property.houses }).map((_, i) => <Text key={i} style={styles.houseDot}>🏠</Text>)
            : <Text style={styles.hotelDot}>🏨</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Tile content ────────────────────────────────────────────────────────────

function TileContent({ space, side }: { space: BoardSpace; side: string }) {
  const photo = CITY_PHOTOS[space.name];
  const icon = getIcon(space);
  const isVertical = side === 'left' || side === 'right';

  return (
    <View style={[styles.tileContent, isVertical && styles.tileContentVertical]}>
      {photo ? <Text style={styles.cityEmoji}>{photo.emoji}</Text>
             : icon ? <Text style={styles.tileIcon}>{icon}</Text> : null}
      <Text style={styles.tileName} numberOfLines={2}>{space.name}</Text>
      {(space.price ?? 0) > 0 && (
        <Text style={styles.tilePrice}>
          ₹{((space.price ?? 0) / 1000).toFixed((space.price ?? 0) % 1000 ? 1 : 0)}k
        </Text>
      )}
    </View>
  );
}

function CornerContent({ space }: { space: BoardSpace }) {
  const config: Record<string, { icon: string; lines: string[] }> = {
    start:      { icon: '🏁', lines: ['START', '+₹1,500'] },
    jail:       { icon: '⛓️', lines: ['JAIL', 'Visiting'] },
    club:       { icon: '🎉', lines: ['CLUB', 'Pay₹1.5k'] },
    rest_house: { icon: '🏨', lines: ['REST', 'HOUSE'] },
  };
  const c = config[space.type];
  if (!c) return null;
  return (
    <View style={styles.cornerContent}>
      <Text style={styles.cornerIcon}>{c.icon}</Text>
      <Text style={styles.cornerLine1}>{c.lines[0]}</Text>
      <Text style={styles.cornerLine2}>{c.lines[1]}</Text>
    </View>
  );
}

// ─── Smooth pawn overlay ──────────────────────────────────────────────────────

function SmoothPawnToken({ player, position, slot }: { player: Player; position: number; slot: number }) {
  const target = getPawnTarget(position, slot);
  const xy = useRef(new Animated.ValueXY(target)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const hopY = useRef(new Animated.Value(0)).current;
  const firstMoveRef = useRef(true);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (firstMoveRef.current) {
      firstMoveRef.current = false;
      xy.setValue(target);
      return;
    }

    Animated.parallel([
      Animated.timing(xy, {
        toValue: target,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(hopY, { toValue: -9, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(hopY, { toValue: 0, friction: 4, tension: 180, useNativeDriver: true }),
      ]),
    ]).start();
  }, [target.x, target.y]);

  return (
    <Animated.View
      style={[
        styles.smoothPawn,
        {
          left: xy.x,
          top: xy.y,
          transform: [{ translateY: hopY }, { scale }],
          shadowColor: player.color,
        },
      ]}
    >
      <View style={[styles.pawnCrown, { backgroundColor: player.color }]}>
        <View style={styles.pawnCrownShine} />
      </View>
      <View style={[styles.pawnHead, { backgroundColor: player.color }]}>
        <View style={styles.pawnSpecular} />
        <View style={styles.pawnInnerGlow} />
      </View>
      <View style={[styles.pawnNeck, { backgroundColor: player.color }]} />
      <View style={[styles.pawnBody, { backgroundColor: player.color }]} />
      <View style={[styles.pawnBase, { backgroundColor: player.color }]} />
      <View style={[styles.pawnHalo, { backgroundColor: player.color }]} />
      <View style={styles.pawnFootShadow} />
    </Animated.View>
  );
}

// ─── Board center panel ───────────────────────────────────────────────────────

function CenterPanel() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 40000, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 3000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.25, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.center, { left: CORNER, top: CORNER, width: SIDE * 8, height: SIDE * 8 }]}>
      <Animated.View style={[styles.spinRing, { transform: [{ rotate }] }]} />
      <Animated.View style={[styles.centerGlow, { opacity: glowAnim }]} />

      <Text style={styles.centerEyebrow}>✦ THE INDIAN ✦</Text>
      <View style={styles.centerDivider} />
      <Text style={styles.centerTitle}>BUSINESS</Text>
      <View style={styles.centerDivider} />
      <Text style={styles.centerSub}>Property Trading Game</Text>

      <View style={styles.colorLegend}>
        {Object.entries(Colors.prop).map(([key, val]) => (
          <View key={key} style={[styles.legendDot, { backgroundColor: val }]} />
        ))}
      </View>
      <Text style={styles.centerNote}>Tap any tile{'\n'}for details</Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIcon(space: BoardSpace): string {
  switch (space.type) {
    case 'chance':    return '❓';
    case 'community': return '💌';
    case 'tax':       return '💸';
    case 'transport':
    case 'utility':   return TILE_ICONS[space.name] || '';
    default:          return '';
  }
}

function getPosition(row: number, col: number): { left: number; top: number } {
  const left = col === 1 ? 0 : col === 10 ? BOARD_SIZE - CORNER : CORNER + (col - 2) * SIDE;
  const top  = row === 1 ? 0 : row === 10 ? BOARD_SIZE - CORNER : CORNER + (row - 2) * SIDE;
  return { left, top };
}

function getDimensions(side: 'corner' | 'bottom' | 'left' | 'top' | 'right'): { width: number; height: number } {
  if (side === 'corner') return { width: CORNER, height: CORNER };
  if (side === 'bottom' || side === 'top') return { width: SIDE, height: CORNER };
  return { width: CORNER, height: SIDE };
}

function getTileCenter(id: number): { x: number; y: number } {
  const [row, col] = getGridPos(id);
  const side = getSide(id);
  const pos = getPosition(row, col);
  const dim = getDimensions(side);
  return {
    x: pos.left + dim.width / 2,
    y: pos.top + dim.height / 2,
  };
}

function getPawnTarget(position: number, slot: number): { x: number; y: number } {
  const center = getTileCenter(position);
  const offset = getPawnOffset(slot);
  return {
    x: center.x - TOKEN_WIDTH / 2 + offset.x,
    y: center.y - TOKEN_HEIGHT / 2 + offset.y,
  };
}

function getPawnOffset(slot: number): { x: number; y: number } {
  const offsets = [
    { x: -7, y: -6 },
    { x: 7, y: -6 },
    { x: -7, y: 7 },
    { x: 7, y: 7 },
  ];
  return offsets[slot % offsets.length];
}

function buildTokenSlots(players: Player[], displayPositions: Record<string, number>): Record<string, number> {
  const slots: Record<string, number> = {};
  const countsByPosition: Record<number, number> = {};
  players.forEach(player => {
    if (player.bankrupt) return;
    const position = displayPositions[player.id] ?? player.position;
    const currentCount = countsByPosition[position] ?? 0;
    slots[player.id] = currentCount;
    countsByPosition[position] = currentCount + 1;
  });
  return slots;
}

const styles = StyleSheet.create({
  boardOuter: {
    alignSelf: 'center', borderRadius: 8, padding: 3,
    backgroundColor: '#160a00',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 18 },
    shadowOpacity: 0.8, shadowRadius: 24, elevation: 22,
  },
  boardWrapper: {
    borderRadius: 5, padding: 3,
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  board: { backgroundColor: Colors.cream, position: 'relative', alignSelf: 'center' },
  tokenLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },

  tile: {
    position: 'absolute', backgroundColor: Colors.parchment,
    borderWidth: 0.5, borderColor: 'rgba(139,108,11,0.25)',
    overflow: 'hidden', alignItems: 'center',
  },
  tileVertical: { flexDirection: 'row' },
  tileContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  tileContentVertical: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  cityEmoji: { fontSize: 16, marginBottom: 1 },
  tileIcon:  { fontSize: 14, marginBottom: 1 },
  tileName: { fontSize: 7, color: '#1c1917', textAlign: 'center', fontWeight: '700', paddingHorizontal: 1 },
  tilePrice: { fontSize: 7, color: Colors.gold, fontWeight: '800', marginTop: 1 },

  colorBand:     { width: '100%', height: 14 },
  colorBandSide: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 14 },
  ownerDot: {
    position: 'absolute', top: 15, right: 2,
    width: 7, height: 7, borderRadius: 3.5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', zIndex: 10,
  },

  housesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingVertical: 1, gap: 1 },
  houseDot: { fontSize: 7 },
  hotelDot: { fontSize: 11 },

  corner: { backgroundColor: Colors.parchment },
  cornerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  cornerIcon:  { fontSize: 20, marginBottom: 2 },
  cornerLine1: { fontSize: 8, fontWeight: '900', color: '#1c1917' },
  cornerLine2: { fontSize: 7, color: Colors.gold, fontWeight: '700', marginTop: 1 },

  // Smooth chess pawn token
  smoothPawn: {
    position: 'absolute',
    width: TOKEN_WIDTH,
    height: TOKEN_HEIGHT,
    alignItems: 'center',
    zIndex: 80,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.75,
    shadowRadius: 7,
    elevation: 14,
  },
  pawnHalo: {
    position: 'absolute',
    bottom: -1,
    width: 17,
    height: 6,
    borderRadius: 10,
    opacity: 0.14,
  },
  pawnCrown: {
    width: 6,
    height: 3,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginBottom: -1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    overflow: 'hidden',
    zIndex: 2,
  },
  pawnCrownShine: {
    position: 'absolute',
    top: 0,
    left: 1,
    right: 1,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  pawnHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.62)',
    borderLeftColor: 'rgba(255,255,255,0.42)',
    borderRightColor: 'rgba(0,0,0,0.2)',
    borderBottomColor: 'rgba(0,0,0,0.35)',
    zIndex: 2,
  },
  pawnSpecular: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  pawnInnerGlow: {
    position: 'absolute',
    left: 3,
    right: 3,
    bottom: 2,
    height: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pawnNeck: {
    width: 5,
    height: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.22)',
    marginTop: -1,
  },
  pawnBody: {
    width: 12,
    height: 6,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.35)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.22)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.2)',
  },
  pawnBase: {
    width: 15,
    height: 4,
    borderRadius: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.38)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.5)',
  },
  pawnFootShadow: {
    position: 'absolute',
    bottom: -2,
    width: 15,
    height: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.22)',
    zIndex: -1,
  },

  // Center panel
  center: {
    position: 'absolute', backgroundColor: '#080618',
    alignItems: 'center', justifyContent: 'center',
    padding: 12, overflow: 'hidden',
  },
  spinRing: {
    position: 'absolute',
    width: SIDE * 7, height: SIDE * 7, borderRadius: SIDE * 3.5,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.12)',
    borderStyle: 'dashed',
  },
  centerGlow: {
    position: 'absolute',
    width: SIDE * 4.5, height: SIDE * 4.5, borderRadius: SIDE * 2.25,
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: SIDE * 2,
  },
  centerEyebrow: { color: 'rgba(245,158,11,0.65)', fontSize: 9, letterSpacing: 4, fontWeight: '700' },
  centerDivider: { width: 80, height: 1.5, backgroundColor: Colors.gold, marginVertical: 5, opacity: 0.5 },
  centerTitle: {
    color: Colors.goldLight,
    fontSize: BOARD_SIZE < 350 ? 22 : 28,
    letterSpacing: 5, fontWeight: '900',
    textShadowColor: Colors.gold, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },
  centerSub: { color: 'rgba(245,158,11,0.5)', fontSize: 9, fontStyle: 'italic', letterSpacing: 2 },
  colorLegend: { flexDirection: 'row', gap: 3, marginTop: 14 },
  legendDot: { width: 18, height: 7, borderRadius: 2 },
  centerNote: { color: 'rgba(245,158,11,0.35)', fontSize: 9, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
});
