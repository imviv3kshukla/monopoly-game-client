// components/Board.tsx — the main 11x11 game board with city tiles & animated tokens

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { BOARD, getGridPos, getSide, BoardSpace } from '../constants/board';
import { Colors, CITY_PHOTOS } from '../constants/theme';
import { Player, Property } from '../store/gameStore';

const { width: screenW } = Dimensions.get('window');
const BOARD_SIZE = Math.min(screenW - 24, 720);
const CORNER = BOARD_SIZE * 0.13;
const SIDE = (BOARD_SIZE - CORNER * 2) / 9;

interface Props {
  players: Player[];
  properties: Record<number, Property>;
  onTilePress: (space: BoardSpace) => void;
}

export function Board({ players, properties, onTilePress }: Props) {
  return (
    <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
      {BOARD.map(sp => (
        <Tile
          key={sp.id}
          space={sp}
          property={properties[sp.id]}
          players={players}
          onPress={() => onTilePress(sp)}
        />
      ))}
      <CenterPanel />
    </View>
  );
}

function Tile({ space, property, players, onPress }: {
  space: BoardSpace;
  property?: Property;
  players: Player[];
  onPress: () => void;
}) {
  const [row, col] = getGridPos(space.id);
  const side = getSide(space.id);

  // Position calculations using absolute positioning instead of grid
  const pos = getPosition(row, col);
  const dim = getDimensions(side);

  const owner = property ? players.find(p => p.id === property.ownerId) : null;
  const tokensHere = players.filter(p => !p.bankrupt && p.position === space.id);
  const colorBar = space.color ? Colors.prop[space.color as keyof typeof Colors.prop] : null;

  // Render corners differently
  if (side === 'corner') {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.tile, styles.corner, pos, dim]}
        activeOpacity={0.7}
      >
        <CornerContent space={space} />
        <TokenStack players={tokensHere} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tile, pos, dim, side === 'left' || side === 'right' ? styles.tileVertical : null]}
      activeOpacity={0.7}
    >
      {/* Owner indicator dot */}
      {owner && (
        <View style={[styles.ownerDot, { backgroundColor: owner.color }]} />
      )}

      {/* Color band — bottom for bottom row, top for top row */}
      {colorBar && side === 'bottom' && (
        <View style={[styles.colorBand, { backgroundColor: colorBar }]} />
      )}
      {colorBar && side === 'top' && (
        <View style={[styles.colorBand, { backgroundColor: colorBar, order: 99 } as any]} />
      )}
      {colorBar && side === 'left' && (
        <View style={[styles.colorBandSide, { backgroundColor: colorBar }]} />
      )}
      {colorBar && side === 'right' && (
        <View style={[styles.colorBandSide, { backgroundColor: colorBar, right: undefined, left: 0 } as any]} />
      )}

      <TileContent space={space} side={side} />

      {/* Houses/Hotel */}
      {property && property.houses > 0 && (
        <View style={styles.housesRow}>
          {property.houses < 5 ? (
            Array.from({ length: property.houses }).map((_, i) => (
              <Text key={i} style={styles.houseDot}>🏠</Text>
            ))
          ) : (
            <Text style={styles.hotelDot}>🏨</Text>
          )}
        </View>
      )}

      {/* Player tokens */}
      <TokenStack players={tokensHere} />
    </TouchableOpacity>
  );
}

function TileContent({ space, side }: { space: BoardSpace; side: string }) {
  const photo = CITY_PHOTOS[space.name];
  const icon = getIcon(space);
  const isVertical = side === 'left' || side === 'right';

  return (
    <View style={[styles.tileContent, isVertical && styles.tileContentVertical]}>
      {photo ? (
        <Text style={styles.cityEmoji}>{photo.emoji}</Text>
      ) : icon ? (
        <Text style={styles.tileIcon}>{icon}</Text>
      ) : null}
      <Text style={styles.tileName} numberOfLines={2}>
        {space.name}
      </Text>
      {space.price && (
        <Text style={styles.tilePrice}>₹{(space.price / 1000).toFixed(space.price % 1000 ? 1 : 0)}k</Text>
      )}
    </View>
  );
}

function CornerContent({ space }: { space: BoardSpace }) {
  const config: Record<string, { icon: string; lines: string[] }> = {
    go: { icon: '🏁', lines: ['GO', '+₹2,000'] },
    jail: { icon: '⛓️', lines: ['JAIL', 'Visiting'] },
    freeparking: { icon: '🅿️', lines: ['FREE', 'PARKING'] },
    gotojail: { icon: '🚔', lines: ['GO TO', 'JAIL!'] },
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

function TokenStack({ players }: { players: Player[] }) {
  if (players.length === 0) return null;
  return (
    <View style={styles.tokenStack}>
      {players.map(p => (
        <AnimatedToken key={p.id} player={p} />
      ))}
    </View>
  );
}

function AnimatedToken({ player }: { player: Player }) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [player.position]);

  return (
    <Animated.View
      style={[
        styles.token,
        { backgroundColor: player.color, transform: [{ scale }] },
      ]}
    >
      <Text style={styles.tokenText}>{player.token}</Text>
    </Animated.View>
  );
}

function CenterPanel() {
  return (
    <View style={[styles.center, {
      left: CORNER,
      top: CORNER,
      width: SIDE * 9,
      height: SIDE * 9,
    }]}>
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
    case 'chance': return '❓';
    case 'community': return '💌';
    case 'tax': return '💸';
    case 'railroad': return '🚂';
    case 'utility': return space.id === 12 ? '⚡' : '💧';
    default: return '';
  }
}

function getPosition(row: number, col: number): { left: number; top: number } {
  // Calculate absolute pixel position based on row/col (1-11)
  const left = col === 1 ? 0 : col === 11 ? BOARD_SIZE - CORNER : CORNER + (col - 2) * SIDE;
  const top = row === 1 ? 0 : row === 11 ? BOARD_SIZE - CORNER : CORNER + (row - 2) * SIDE;
  return { left, top };
}

function getDimensions(side: 'corner' | 'bottom' | 'left' | 'top' | 'right'): { width: number; height: number } {
  if (side === 'corner') return { width: CORNER, height: CORNER };
  if (side === 'bottom' || side === 'top') return { width: SIDE, height: CORNER };
  return { width: CORNER, height: SIDE };
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: Colors.cream,
    borderWidth: 3,
    borderColor: Colors.gold,
    position: 'relative',
    alignSelf: 'center',
  },
  tile: {
    position: 'absolute',
    backgroundColor: Colors.parchment,
    borderWidth: 0.5,
    borderColor: 'rgba(139,108,11,0.3)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  tileVertical: {
    flexDirection: 'row',
  },
  tileContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  tileContentVertical: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  tileIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tileName: {
    fontSize: 8,
    color: Colors.bgDark,
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 1,
  },
  tilePrice: {
    fontSize: 7,
    color: Colors.gold,
    fontWeight: 'bold',
    marginTop: 1,
  },
  colorBand: {
    width: '100%',
    height: 12,
  },
  colorBandSide: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 12,
  },
  ownerDot: {
    position: 'absolute',
    top: 14,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    zIndex: 10,
  },
  housesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 1,
    gap: 1,
  },
  houseDot: {
    fontSize: 8,
  },
  hotelDot: {
    fontSize: 12,
  },

  // Corners
  corner: {
    backgroundColor: Colors.parchment,
  },
  cornerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cornerIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  cornerLine1: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.bgDark,
  },
  cornerLine2: {
    fontSize: 7,
    color: Colors.gold,
    marginTop: 1,
  },

  // Tokens
  tokenStack: {
    position: 'absolute',
    bottom: 1,
    left: 1,
    right: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
  },
  token: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  tokenText: {
    fontSize: 8,
  },

  // Center panel
  center: {
    position: 'absolute',
    backgroundColor: '#100a20',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)',
  },
  centerEyebrow: {
    color: 'rgba(212,160,23,0.7)',
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '600',
  },
  centerDivider: {
    width: 100,
    height: 1,
    backgroundColor: Colors.gold,
    marginVertical: 6,
    opacity: 0.5,
  },
  centerTitle: {
    color: Colors.goldLight,
    fontSize: 32,
    letterSpacing: 5,
    fontWeight: '900',
  },
  centerSub: {
    color: 'rgba(212,160,23,0.55)',
    fontSize: 11,
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  colorLegend: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 16,
  },
  legendDot: {
    width: 22,
    height: 8,
    borderRadius: 1,
  },
  centerNote: {
    color: 'rgba(212,160,23,0.4)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
