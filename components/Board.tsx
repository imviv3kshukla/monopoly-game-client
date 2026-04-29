// components/Board.tsx — 11×11 game board with step-by-step token animation

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { BOARD, getGridPos, getSide, BoardSpace } from '../constants/board';
import { Colors, CITY_PHOTOS } from '../constants/theme';
import { Player, Property } from '../store/gameStore';

const { width: screenW } = Dimensions.get('window');
const BOARD_SIZE = Math.min(screenW - 16, 720);
const CORNER = BOARD_SIZE * 0.13;
const SIDE = (BOARD_SIZE - CORNER * 2) / 9;
const TOTAL_TILES = 40;

interface Props {
  players: Player[];
  properties: Record<number, Property>;
  onTilePress: (space: BoardSpace) => void;
  onMoveComplete?: (playerId: string) => void;
}

export function Board({ players, properties, onTilePress, onMoveComplete }: Props) {
  // Tracks what position each player's token is VISUALLY displayed at (may differ during animation)
  const [displayPositions, setDisplayPositions] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    players.forEach(p => { init[p.id] = p.position; });
    return init;
  });

  const prevPositionsRef = useRef<Record<string, number>>({});
  const onMoveCompleteRef = useRef(onMoveComplete);
  const isMountedRef = useRef(true);

  useEffect(() => { onMoveCompleteRef.current = onMoveComplete; }, [onMoveComplete]);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  // Track position changes and animate
  const posKey = players.map(p => `${p.id}:${p.position}`).join(',');
  useEffect(() => {
    players.forEach(player => {
      if (player.bankrupt) {
        prevPositionsRef.current[player.id] = player.position;
        return;
      }

      const prev = prevPositionsRef.current[player.id];

      // First time seeing this player — just set position, no animation
      if (prev === undefined) {
        prevPositionsRef.current[player.id] = player.position;
        setDisplayPositions(dp => ({ ...dp, [player.id]: player.position }));
        return;
      }

      if (prev === player.position) return; // No change

      prevPositionsRef.current[player.id] = player.position;

      const from = prev;
      const to = player.position;
      const forwardSteps = (to - from + TOTAL_TILES) % TOTAL_TILES;

      // Teleport (jail, chance card, etc.) — skip animation for > 12 steps
      if (forwardSteps === 0 || forwardSteps > 12) {
        setDisplayPositions(dp => ({ ...dp, [player.id]: to }));
        setTimeout(() => {
          if (isMountedRef.current) onMoveCompleteRef.current?.(player.id);
        }, 150);
        return;
      }

      // Step-by-step animation through each tile
      const steps: number[] = [];
      let pos = from;
      for (let i = 0; i < forwardSteps; i++) {
        pos = (pos + 1) % TOTAL_TILES;
        steps.push(pos);
      }

      let idx = 0;
      const tick = () => {
        if (!isMountedRef.current) return;
        if (idx >= steps.length) {
          onMoveCompleteRef.current?.(player.id);
          return;
        }
        setDisplayPositions(dp => ({ ...dp, [player.id]: steps[idx] }));
        idx++;
        setTimeout(tick, 350);
      };
      tick();
    });
  }, [posKey]);

  return (
    <View style={[styles.boardOuter, { width: BOARD_SIZE + 12, height: BOARD_SIZE + 12 }]}>
      <View style={[styles.boardWrapper, { width: BOARD_SIZE + 6, height: BOARD_SIZE + 6 }]}>
        <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
          {BOARD.map(sp => (
            <Tile
              key={sp.id}
              space={sp}
              property={properties[sp.id]}
              players={players}
              displayPositions={displayPositions}
              onPress={() => onTilePress(sp)}
            />
          ))}
          <CenterPanel />
        </View>
      </View>
    </View>
  );
}

// ─── Tile ────────────────────────────────────────────────────────────────────

function Tile({ space, property, players, displayPositions, onPress }: {
  space: BoardSpace;
  property?: Property;
  players: Player[];
  displayPositions: Record<string, number>;
  onPress: () => void;
}) {
  const [row, col] = getGridPos(space.id);
  const side = getSide(space.id);
  const pos = getPosition(row, col);
  const dim = getDimensions(side);

  const owner = property ? players.find(p => p.id === property.ownerId) : null;
  // Use displayPositions (animation state) not player.position (server state)
  const tokensHere = players.filter(p => !p.bankrupt && (displayPositions[p.id] ?? p.position) === space.id);
  const colorBar = space.color ? Colors.prop[space.color as keyof typeof Colors.prop] : null;

  if (side === 'corner') {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.tile, styles.corner, pos, dim]} activeOpacity={0.7}>
        <CornerContent space={space} />
        <TokenStack players={tokensHere} displayPositions={displayPositions} />
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

      <TokenStack players={tokensHere} displayPositions={displayPositions} />
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
      {space.price && (
        <Text style={styles.tilePrice}>₹{(space.price / 1000).toFixed(space.price % 1000 ? 1 : 0)}k</Text>
      )}
    </View>
  );
}

function CornerContent({ space }: { space: BoardSpace }) {
  const config: Record<string, { icon: string; lines: string[] }> = {
    go:          { icon: '🏁', lines: ['GO', '+₹2K'] },
    jail:        { icon: '⛓️', lines: ['JAIL', 'Visiting'] },
    freeparking: { icon: '🅿️', lines: ['FREE', 'PARK'] },
    gotojail:    { icon: '🚔', lines: ['GO TO', 'JAIL!'] },
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

// ─── Token stack (renders pawn tokens on a tile) ──────────────────────────────

function TokenStack({ players, displayPositions }: {
  players: Player[];
  displayPositions: Record<string, number>;
}) {
  if (players.length === 0) return null;
  return (
    <View style={styles.tokenStack}>
      {players.map(p => (
        <PawnToken key={p.id} player={p} displayPos={displayPositions[p.id] ?? p.position} />
      ))}
    </View>
  );
}

// ─── Chess-pawn shaped token ──────────────────────────────────────────────────

function PawnToken({ player, displayPos }: { player: Player; displayPos: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  const bounceY = useRef(new Animated.Value(0)).current;
  const isFirstRef = useRef(true);

  // Pop in on mount
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }).start();
  }, []);

  // Bounce on each tile step
  useEffect(() => {
    if (isFirstRef.current) { isFirstRef.current = false; return; }
    bounceY.setValue(-6);
    Animated.spring(bounceY, { toValue: 0, friction: 3, tension: 220, useNativeDriver: true }).start();
  }, [displayPos]);

  const c = player.color;

  return (
    <Animated.View style={[styles.pawnWrapper, {
      transform: [{ scale }, { translateY: bounceY }],
      shadowColor: c,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.8,
      shadowRadius: 5,
      elevation: 6,
    }]}>
      {/* Head with specular dot for sphere illusion */}
      <View style={[styles.pawnHead, { backgroundColor: c }]}>
        <View style={styles.pawnSpecular} />
      </View>
      {/* Neck */}
      <View style={[styles.pawnNeck, { backgroundColor: c }]} />
      {/* Body — bevel: lighter top, darker bottom */}
      <View style={[styles.pawnBody, {
        backgroundColor: c,
        borderTopColor: 'rgba(255,255,255,0.48)',
        borderTopWidth: 1.5,
        borderBottomColor: 'rgba(0,0,0,0.38)',
        borderBottomWidth: 1.5,
        borderLeftColor: 'rgba(255,255,255,0.22)',
        borderLeftWidth: 0.5,
        borderRightColor: 'rgba(0,0,0,0.22)',
        borderRightWidth: 0.5,
      }]} />
      {/* Base — heavier bevel for ground contact */}
      <View style={[styles.pawnBase, {
        backgroundColor: c,
        borderTopColor: 'rgba(255,255,255,0.35)',
        borderTopWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.5)',
        borderBottomWidth: 2,
        borderLeftColor: 'rgba(255,255,255,0.18)',
        borderLeftWidth: 0.5,
        borderRightColor: 'rgba(0,0,0,0.28)',
        borderRightWidth: 0.5,
      }]} />
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
    <View style={[styles.center, { left: CORNER, top: CORNER, width: SIDE * 9, height: SIDE * 9 }]}>
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
    case 'railroad':  return '🚂';
    case 'utility':   return space.id === 12 ? '⚡' : '💧';
    default:          return '';
  }
}

function getPosition(row: number, col: number): { left: number; top: number } {
  const left = col === 1 ? 0 : col === 11 ? BOARD_SIZE - CORNER : CORNER + (col - 2) * SIDE;
  const top  = row === 1 ? 0 : row === 11 ? BOARD_SIZE - CORNER : CORNER + (row - 2) * SIDE;
  return { left, top };
}

function getDimensions(side: 'corner' | 'bottom' | 'left' | 'top' | 'right'): { width: number; height: number } {
  if (side === 'corner') return { width: CORNER, height: CORNER };
  if (side === 'bottom' || side === 'top') return { width: SIDE, height: CORNER };
  return { width: CORNER, height: SIDE };
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

  // Token stack
  tokenStack: {
    position: 'absolute', bottom: 1, left: 1, right: 1,
    flexDirection: 'row', flexWrap: 'wrap', gap: 2,
    justifyContent: 'center', alignItems: 'flex-end',
  },

  // Chess pawn token
  pawnWrapper: { alignItems: 'center' },
  pawnHead: { width: 9, height: 9, borderRadius: 4.5, overflow: 'hidden' },
  pawnSpecular: {
    position: 'absolute', top: 1, left: 1,
    width: 3.5, height: 3.5, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  pawnNeck: { width: 3.5, height: 2.5 },
  pawnBody: { width: 12, height: 5, borderRadius: 2.5 },
  pawnBase: { width: 15, height: 4, borderRadius: 2.5 },

  // Center panel
  center: {
    position: 'absolute', backgroundColor: '#080618',
    alignItems: 'center', justifyContent: 'center',
    padding: 12, overflow: 'hidden',
  },
  spinRing: {
    position: 'absolute',
    width: SIDE * 8, height: SIDE * 8, borderRadius: SIDE * 4,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.12)',
    borderStyle: 'dashed',
  },
  centerGlow: {
    position: 'absolute',
    width: SIDE * 5, height: SIDE * 5, borderRadius: SIDE * 2.5,
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
