// components/PropertyModal.tsx — colorful property detail modal

import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import { Colors, CITY_PHOTOS } from '../constants/theme';
import { BoardSpace } from '../constants/board';
import { Player, Property } from '../store/gameStore';

interface Props {
  visible: boolean;
  space: BoardSpace | null;
  property?: Property;
  players: Player[];
  myMoney: number;
  canBuyOrBuild: boolean;
  isOwnerMe: boolean;
  ownsColorSet: boolean;
  pendingBuy: boolean;
  onBuy: () => void;
  onSkipBuy: () => void;
  onBuild: (id: number) => void;
  onClose: () => void;
}

export function PropertyModal({
  visible, space, property, players, myMoney,
  isOwnerMe, ownsColorSet, pendingBuy,
  onBuy, onSkipBuy, onBuild, onClose,
}: Props) {
  if (!space) return null;

  const owner = property ? players.find(p => p.id === property.ownerId) : null;
  const photo = CITY_PHOTOS[space.name];
  const colorBar = space.color ? Colors.prop[space.color as keyof typeof Colors.prop] : null;
  const canBuyNow = pendingBuy && myMoney >= (space.price || 0);
  const canBuildHouse = isOwnerMe && ownsColorSet && property && property.houses < 5 &&
                        myMoney >= (space.houseCost || 0) && space.type === 'property';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={pendingBuy ? undefined : onClose}>
        <Pressable style={styles.modal}>
          {/* Translucent city/landmark backdrop */}
          {photo && (
            <View style={styles.cityBackdrop} pointerEvents="none">
              <Text style={styles.cityBackdropEmoji}>{photo.emoji}</Text>
            </View>
          )}
          {colorBar && (
            <View style={[styles.colorWash, { backgroundColor: colorBar }]} pointerEvents="none" />
          )}
          {/* Destination scene header */}
          <View style={[styles.colorBand, { backgroundColor: colorBar || Colors.electric }]}>
            {/* Bottom depth shadow */}
            <View style={styles.colorBandDepth} />
            {/* Top shine */}
            <View style={styles.colorBandShine} />
            {/* Ambient scene emoji — decorative corners */}
            {photo?.scene[0] && <Text style={styles.sceneEmojiTL}>{photo.scene[0]}</Text>}
            {photo?.scene[1] && <Text style={styles.sceneEmojiTR}>{photo.scene[1]}</Text>}
            {photo?.scene[2] && <Text style={styles.sceneEmojiBR}>{photo.scene[2]}</Text>}
            {/* Main landmark emoji — large and centred */}
            <Text style={styles.bandEmoji}>{photo ? photo.emoji : getDefaultEmoji(space)}</Text>
            {/* Landmark name tag at bottom */}
            {photo && (
              <View style={styles.landmarkTag}>
                <Text style={styles.landmarkText}>{photo.landmark}</Text>
              </View>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{space.name}</Text>
                {photo && <Text style={styles.subtitle}>{photo.landmark}</Text>}
                {!photo && <Text style={styles.subtitle}>{getSubtitle(space)}</Text>}
              </View>
              {colorBar && (
                <View style={[styles.colorChip, { backgroundColor: colorBar + '30', borderColor: colorBar }]}>
                  <View style={[styles.colorChipDot, { backgroundColor: colorBar }]} />
                </View>
              )}
            </View>

            {/* Details */}
            {space.type === 'property'   && <PropertyDetails space={space} />}
            {space.type === 'railroad'   && <RailroadDetails />}
            {space.type === 'utility'    && <UtilityDetails />}
            {space.type === 'tax'        && <TaxDetails space={space} />}
            {(space.type === 'chance' || space.type === 'community') && <CardDetails space={space} />}
            {(['jail', 'gotojail', 'go', 'freeparking'] as const).includes(space.type as any) &&
              <CornerDetails space={space} />}

            {/* Owner status */}
            {owner ? (
              <View style={[styles.ownerInfo, { borderColor: owner.color + '60' }]}>
                <View style={[styles.ownerColorBar, { backgroundColor: owner.color }]} />
                <View style={styles.ownerBody}>
                  <Text style={styles.ownerLabel}>OWNED BY</Text>
                  <View style={styles.ownerRow}>
                    <Text style={styles.ownerToken}>{owner.token}</Text>
                    <Text style={[styles.ownerName, { color: owner.color }]}>{owner.name}</Text>
                  </View>
                  {property && property.houses > 0 && (
                    <Text style={styles.houseStatus}>
                      {property.houses < 5
                        ? `${'🏠'.repeat(property.houses)}  ${property.houses} house${property.houses > 1 ? 's' : ''}`
                        : '🏨  Hotel'}
                    </Text>
                  )}
                </View>
              </View>
            ) : (space.price && space.type !== 'tax' && space.type !== 'chance' && space.type !== 'community') ? (
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>✨  AVAILABLE FOR PURCHASE</Text>
              </View>
            ) : null}

            {/* Action buttons */}
            <View style={styles.btnRow}>
              {pendingBuy && canBuyNow && (
                <TouchableOpacity style={[styles.btn, styles.btnGold]} onPress={onBuy} activeOpacity={0.85}>
                  <View style={styles.btnShine} />
                  <Text style={styles.btnGoldText}>BUY  ₹{space.price?.toLocaleString()}</Text>
                </TouchableOpacity>
              )}
              {pendingBuy && (
                <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onSkipBuy} activeOpacity={0.85}>
                  <Text style={styles.btnOutlineText}>SKIP</Text>
                </TouchableOpacity>
              )}
              {canBuildHouse && (
                <TouchableOpacity style={[styles.btn, styles.btnGold]} onPress={() => onBuild(space.id)} activeOpacity={0.85}>
                  <View style={styles.btnShine} />
                  <Text style={styles.btnGoldText}>
                    BUILD {property!.houses < 4 ? 'HOUSE' : 'HOTEL'}  ₹{space.houseCost?.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              )}
              {!pendingBuy && (
                <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onClose} activeOpacity={0.85}>
                  <Text style={styles.btnOutlineText}>CLOSE</Text>
                </TouchableOpacity>
              )}
            </View>

            {pendingBuy && !canBuyNow && (
              <View style={styles.warningBox}>
                <Text style={styles.warning}>⚠  Not enough money  (₹{myMoney.toLocaleString()} available)</Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Detail sections ──────────────────────────────────────────────────────────

function PropertyDetails({ space }: { space: BoardSpace }) {
  const r = space.rent!;
  return (
    <View style={styles.detailsSection}>
      <DetailRow label="Price" value={`₹${space.price?.toLocaleString()}`} highlight />
      <View style={styles.divider} />
      <Text style={styles.detailsTitle}>RENT SCHEDULE</Text>
      <DetailRow label="Base rent" value={`₹${r[0].toLocaleString()}`} />
      <DetailRow label="Color set bonus" value={`₹${(r[0] * 2).toLocaleString()}`} subtle />
      <DetailRow label="🏠 1 House" value={`₹${r[1].toLocaleString()}`} />
      <DetailRow label="🏠🏠 2 Houses" value={`₹${r[2].toLocaleString()}`} />
      <DetailRow label="🏠🏠🏠 3 Houses" value={`₹${r[3].toLocaleString()}`} />
      <DetailRow label="🏠🏠🏠🏠 4 Houses" value={`₹${r[4].toLocaleString()}`} />
      <DetailRow label="🏨 Hotel" value={`₹${r[5].toLocaleString()}`} />
      <View style={styles.divider} />
      <DetailRow label="House / Hotel cost" value={`₹${space.houseCost?.toLocaleString()}`} />
    </View>
  );
}

function RailroadDetails() {
  return (
    <View style={styles.detailsSection}>
      <DetailRow label="Price" value="₹2,000" highlight />
      <View style={styles.divider} />
      <Text style={styles.detailsTitle}>RENT (BY RAILWAYS OWNED)</Text>
      <DetailRow label="🚂 1 Railway" value="₹2,000" />
      <DetailRow label="🚂🚂 2 Railways" value="₹4,000" />
      <DetailRow label="🚂🚂🚂 3 Railways" value="₹8,000" />
      <DetailRow label="🚂🚂🚂🚂 All 4" value="₹16,000" />
    </View>
  );
}

function UtilityDetails() {
  return (
    <View style={styles.detailsSection}>
      <DetailRow label="Price" value="₹1,500" highlight />
      <View style={styles.divider} />
      <Text style={styles.detailsTitle}>RENT</Text>
      <DetailRow label="1 utility owned" value="4× dice roll" />
      <DetailRow label="Both utilities owned" value="10× dice roll" />
      <Text style={styles.note}>💡 Roll 8, own both? Pay ₹80!</Text>
    </View>
  );
}

function TaxDetails({ space }: { space: BoardSpace }) {
  return (
    <View style={styles.detailsSection}>
      <Text style={styles.bigStatement}>Pay ₹{space.taxAmount?.toLocaleString()}</Text>
      <Text style={styles.note}>
        {space.name === 'Income Tax'
          ? 'Income tax goes directly to the bank.'
          : 'A flat luxury tax. Goes to the bank.'}
      </Text>
    </View>
  );
}

function CardDetails({ space }: { space: BoardSpace }) {
  const isChance = space.type === 'chance';
  return (
    <View style={styles.detailsSection}>
      <Text style={styles.bigStatement}>{isChance ? '❓ Chance Card' : '💌 Community Chest'}</Text>
      <Text style={styles.note}>
        {isChance
          ? 'Draw a card — advance to a city, go to jail, pay tax, or earn rewards!'
          : 'Draw a card — receive money, pay fees, or other surprises!'}
      </Text>
    </View>
  );
}

function CornerDetails({ space }: { space: BoardSpace }) {
  const text: Record<string, string> = {
    go:          'Pass GO and collect ₹2,000 salary every time!',
    jail:        'Just visiting? No penalty! If sent here, roll doubles to escape or pay ₹500 bail.',
    gotojail:    'Land here → Go directly to Jail! Do not pass GO, do not collect ₹2,000.',
    freeparking: 'A safe haven — nothing happens here. Relax and plan your next move.',
  };
  return (
    <View style={styles.detailsSection}>
      <Text style={styles.note}>{text[space.type]}</Text>
    </View>
  );
}

function DetailRow({ label, value, highlight, subtle }: {
  label: string; value: string; highlight?: boolean; subtle?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, subtle && styles.rowLabelSubtle]}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  );
}

function getSubtitle(space: BoardSpace): string {
  switch (space.type) {
    case 'railroad': return 'Indian Railways';
    case 'utility':  return space.id === 11 ? 'Power Distribution' : 'Water Supply';
    default:         return '';
  }
}

function getDefaultEmoji(space: BoardSpace): string {
  switch (space.type) {
    case 'chance':    return '❓';
    case 'community': return '💌';
    case 'tax':       return '💸';
    case 'railroad':  return '🚂';
    case 'utility':   return space.id === 11 ? '⚡' : '💧';
    case 'go':        return '🏁';
    case 'jail':      return '⛓️';
    case 'gotojail':  return '🚔';
    case 'freeparking': return '🅿️';
    default:          return '🏛️';
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(6,4,21,0.88)',
    alignItems: 'center', justifyContent: 'flex-end',
    padding: 0,
  },
  modal: {
    backgroundColor: Colors.bgPanel,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    width: '100%', maxHeight: '88%',
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    borderBottomWidth: 0,
  },

  colorBand: {
    height: 148, width: '100%',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', position: 'relative',
  },
  colorBandDepth: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  colorBandShine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '42%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  bandEmoji: { fontSize: 80, zIndex: 1 },

  // Ambient scene emoji — float in corners at low opacity
  sceneEmojiTL: {
    position: 'absolute', top: 10, left: 14,
    fontSize: 32, opacity: 0.45,
  },
  sceneEmojiTR: {
    position: 'absolute', top: 12, right: 18,
    fontSize: 28, opacity: 0.38,
  },
  sceneEmojiBR: {
    position: 'absolute', bottom: 28, right: 20,
    fontSize: 26, opacity: 0.32,
  },

  // Landmark name pill at bottom of the band
  landmarkTag: {
    position: 'absolute', bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.38)',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20,
  },
  landmarkText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  content: { padding: 20, paddingBottom: 36, gap: 16 },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: Colors.goldLight, fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic', marginTop: 3 },
  colorChip: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  colorChipDot: { width: 12, height: 12, borderRadius: 6 },

  detailsSection: { gap: 4 },
  detailsTitle: {
    color: Colors.gold, fontSize: 10, letterSpacing: 2.5,
    fontWeight: '800', marginTop: 4, marginBottom: 2,
  },
  divider: { height: 1, backgroundColor: 'rgba(245,158,11,0.2)', marginVertical: 6 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: Colors.textPrimary, fontSize: 13 },
  rowLabelSubtle: { color: Colors.textSecondary, fontStyle: 'italic' },
  rowValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  rowValueHighlight: { color: Colors.goldLight, fontWeight: '900', fontSize: 16 },

  bigStatement: {
    color: Colors.goldLight, fontSize: 24, fontWeight: '800',
    textAlign: 'center', marginVertical: 10,
  },
  note: {
    color: Colors.textSecondary, fontSize: 13, textAlign: 'center',
    fontStyle: 'italic', lineHeight: 21, marginVertical: 4,
  },

  ownerInfo: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1.5, flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  ownerColorBar: { width: 5 },
  ownerBody: { flex: 1, padding: 12, gap: 4 },
  ownerLabel: { color: Colors.textMuted, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ownerToken: { fontSize: 20 },
  ownerName: { fontSize: 16, fontWeight: '800' },
  houseStatus: { color: Colors.success, fontSize: 13, fontWeight: '600' },

  availableBadge: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderWidth: 1.5, borderColor: Colors.success,
    borderRadius: 10, padding: 12, alignItems: 'center',
  },
  availableText: { color: Colors.success, fontSize: 12, letterSpacing: 1.5, fontWeight: '800' },

  btnRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 16, borderRadius: 13, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  btnGold: {
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10,
  },
  btnGoldText: { color: Colors.bgDark, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  btnOutline: {
    borderWidth: 2, borderColor: Colors.gold, backgroundColor: 'transparent',
  },
  btnOutlineText: { color: Colors.gold, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  btnShine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  warningBox: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
  },
  warning: { color: Colors.danger, fontSize: 12, textAlign: 'center', fontWeight: '600' },

  cityBackdrop: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: '100%', height: '100%',
    alignItems: 'flex-end', justifyContent: 'flex-end',
    overflow: 'hidden',
    zIndex: 0,
  },
  cityBackdropEmoji: {
    fontSize: 210,
    opacity: 0.065,
    marginBottom: -20,
    marginRight: -30,
  },
  colorWash: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.04,
    zIndex: 0,
  },
});
