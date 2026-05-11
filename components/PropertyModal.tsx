// components/PropertyModal.tsx — colorful property detail modal

import React, { useEffect, useRef } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  Pressable, ScrollView, Platform, Animated, Easing, useWindowDimensions,
} from 'react-native';
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
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width >= 760;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 120,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, cardAnim]);

  if (!space) return null;

  const owner = property ? players.find(p => p.id === property.ownerId) : null;
  const photo = CITY_PHOTOS[space.name];
  const colorBar = space.color ? Colors.prop[space.color as keyof typeof Colors.prop] : null;
  const canBuyNow = pendingBuy && myMoney >= (space.price || 0);
  const canBuildHouse = isOwnerMe && ownsColorSet && property && property.houses < 5 &&
                        myMoney >= (space.houseCost || 0) && space.type === 'property';

  return (
    <Modal visible={visible} transparent animationType={isWeb ? 'fade' : 'slide'} onRequestClose={onClose}>
      <Pressable
        style={[styles.overlay, isWeb && styles.overlayWeb]}
        onPress={pendingBuy ? undefined : onClose}
      >
        <Animated.View
          style={[
            styles.modal,
            isWeb && styles.modalWeb,
            isWeb && {
              opacity: cardAnim,
              transform: [
                {
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
                {
                  scale: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable style={styles.modalSurface}>
          {isWeb && !pendingBuy && (
            <TouchableOpacity style={styles.webCloseBtn} onPress={onClose} activeOpacity={0.82}>
              <Text style={styles.webCloseText}>×</Text>
            </TouchableOpacity>
          )}
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
          {isWeb ? (
            <WebTitleDeedHeader space={space} colorBar={colorBar} photo={photo} />
          ) : (
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
          )}

          <ScrollView
            style={isWeb && styles.contentScrollWeb}
            contentContainerStyle={[styles.content, isWeb && styles.contentWeb]}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            {!isWeb && <View style={styles.titleRow}>
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
            </View>}

            {/* Details */}
            {space.type === 'property'   && <PropertyDetails space={space} isWeb={isWeb} />}
            {space.type === 'transport'  && <TransportDetails space={space} isWeb={isWeb} />}
            {space.type === 'utility'    && <UtilityDetails space={space} isWeb={isWeb} />}
            {space.type === 'tax'        && <TaxDetails space={space} isWeb={isWeb} />}
            {(space.type === 'chance' || space.type === 'community') && <CardDetails space={space} isWeb={isWeb} />}
            {(['jail', 'club', 'start', 'rest_house'] as const).includes(space.type as any) &&
              <CornerDetails space={space} isWeb={isWeb} />}

            {isWeb && space.displayNote && space.type !== 'tax' && (
              <View style={styles.deedNoteBox}>
                <Text style={styles.deedNoteText}>{space.displayNote}</Text>
              </View>
            )}

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
            ) : ((space.price ?? 0) > 0 && space.type !== 'tax' && space.type !== 'chance' && space.type !== 'community') ? (
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
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Detail sections ──────────────────────────────────────────────────────────

function PropertyDetails({ space, isWeb }: { space: BoardSpace; isWeb?: boolean }) {
  const r = space.rentByHouses ?? space.rent ?? [];
  return (
    <View style={[styles.detailsSection, isWeb && styles.detailsSectionWeb]}>
      <DetailRow label="Price" value={`₹${space.price?.toLocaleString()}`} highlight isWeb={isWeb} />
      <View style={styles.divider} />
      <Text style={[styles.detailsTitle, isWeb && styles.detailsTitleWeb]}>RENT SCHEDULE</Text>
      <DetailRow label="Rent site only" value={`₹${(r[0] ?? 0).toLocaleString()}`} isWeb={isWeb} />
      <DetailRow label="Rent with 1 House" value={`₹${(r[1] ?? 0).toLocaleString()}`} isWeb={isWeb} />
      <DetailRow label="Rent with 2 Houses" value={`₹${(r[2] ?? 0).toLocaleString()}`} isWeb={isWeb} />
      <DetailRow label="Rent with 3 Houses" value={`₹${(r[3] ?? 0).toLocaleString()}`} isWeb={isWeb} />
      <DetailRow label="Rent with 4 Houses" value={`₹${(r[4] ?? 0).toLocaleString()}`} isWeb={isWeb} />
      <DetailRow label="Rent with Hotel" value={`₹${(r[5] ?? 0).toLocaleString()}`} isWeb={isWeb} />
      <View style={styles.divider} />
      <DetailRow label="Cost of House / Hotel" value={`₹${space.houseCost?.toLocaleString()}`} isWeb={isWeb} />
      {(space.mortgageValue ?? 0) > 0 && (
        <DetailRow label="Bank Mortgage Value" value={`₹${space.mortgageValue?.toLocaleString()}`} highlight isWeb={isWeb} />
      )}
    </View>
  );
}

function TransportDetails({ space, isWeb }: { space: BoardSpace; isWeb?: boolean }) {
  return (
    <View style={[styles.detailsSection, isWeb && styles.detailsSectionWeb]}>
      <DetailRow label="Price" value={`₹${space.price?.toLocaleString()}`} highlight isWeb={isWeb} />
      <View style={styles.divider} />
      <Text style={[styles.detailsTitle, isWeb && styles.detailsTitleWeb]}>RENT</Text>
      <DetailRow label="Rent when owned alone" value={`₹${(space.rentAlone ?? 0).toLocaleString()}`} isWeb={isWeb} />
      {space.partnerName && (
        <DetailRow
          label={`If you also own ${space.partnerName}`}
          value={`₹${(space.rentWithPartner ?? 0).toLocaleString()}`}
          isWeb={isWeb}
        />
      )}
      <View style={styles.divider} />
      {(space.mortgageValue ?? 0) > 0 && (
        <DetailRow label="Bank Mortgage Value" value={`₹${space.mortgageValue?.toLocaleString()}`} highlight isWeb={isWeb} />
      )}
    </View>
  );
}

function UtilityDetails({ space, isWeb }: { space: BoardSpace; isWeb?: boolean }) {
  return (
    <View style={[styles.detailsSection, isWeb && styles.detailsSectionWeb]}>
      <DetailRow label="Price" value={`₹${space.price?.toLocaleString()}`} highlight isWeb={isWeb} />
      <View style={styles.divider} />
      <Text style={[styles.detailsTitle, isWeb && styles.detailsTitleWeb]}>RENT</Text>
      <DetailRow label="If one utility is owned" value={`${space.diceMultiplierAlone ?? 0}x dice roll`} isWeb={isWeb} />
      <DetailRow label="If both utilities are owned" value={`${space.diceMultiplierBoth ?? 0}x dice roll`} isWeb={isWeb} />
      <View style={styles.divider} />
      {(space.mortgageValue ?? 0) > 0 && (
        <DetailRow label="Bank Mortgage Value" value={`₹${space.mortgageValue?.toLocaleString()}`} highlight isWeb={isWeb} />
      )}
    </View>
  );
}

function TaxDetails({ space, isWeb }: { space: BoardSpace; isWeb?: boolean }) {
  return (
    <View style={[styles.detailsSection, isWeb && styles.detailsSectionWeb]}>
      <Text style={[styles.bigStatement, isWeb && styles.bigStatementWeb]}>Pay ₹{space.taxAmount?.toLocaleString()}</Text>
      <Text style={[styles.note, isWeb && styles.noteWeb]}>{space.displayNote ?? 'Tax goes directly to the bank.'}</Text>
    </View>
  );
}

function CardDetails({ space, isWeb }: { space: BoardSpace; isWeb?: boolean }) {
  const isChance = space.type === 'chance';
  return (
    <View style={[styles.detailsSection, isWeb && styles.detailsSectionWeb]}>
      <Text style={[styles.bigStatement, isWeb && styles.bigStatementWeb]}>{isChance ? '❓ Chance Card' : '💌 Community Chest'}</Text>
      <Text style={[styles.note, isWeb && styles.noteWeb]}>
        {isChance
          ? 'Draw a card — advance to a city, go to jail, pay tax, or earn rewards!'
          : 'Draw a card — receive money, pay fees, or other surprises!'}
      </Text>
    </View>
  );
}

function CornerDetails({ space, isWeb }: { space: BoardSpace; isWeb?: boolean }) {
  const text: Record<string, string> = {
    start:      'Pass START and collect ₹1,500 salary every time!',
    jail:       'Just visiting? No penalty! If sent here, roll doubles to escape or pay ₹500 bail.',
    club:       'Land here → pay ₹1,500 to the bank. Everyone pays the house cover charge!',
    rest_house: 'A safe haven — nothing happens here. REST HOUSE is a free space, relax!',
  };
  return (
    <View style={[styles.detailsSection, isWeb && styles.detailsSectionWeb]}>
      <Text style={[styles.note, isWeb && styles.noteWeb]}>{space.displayNote ?? text[space.type] ?? ''}</Text>
    </View>
  );
}

function DetailRow({ label, value, highlight, subtle, isWeb }: {
  label: string; value: string; highlight?: boolean; subtle?: boolean; isWeb?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, subtle && styles.rowLabelSubtle, isWeb && styles.rowLabelWeb]}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight, isWeb && styles.rowValueWeb, highlight && isWeb && styles.rowValueHighlightWeb]}>{value}</Text>
    </View>
  );
}

function getSubtitle(space: BoardSpace): string {
  switch (space.type) {
    case 'transport': return 'Transport Network';
    case 'utility':   return space.name === 'Electricity' ? 'Power Distribution' : 'Internet Provider';
    case 'start':     return 'Collect ₹1,500 salary';
    case 'club':      return 'Pay ₹1,500';
    case 'rest_house':return 'Safe space — no action';
    default:          return '';
  }
}

function getDefaultEmoji(space: BoardSpace): string {
  switch (space.type) {
    case 'chance':     return '❓';
    case 'community':  return '💌';
    case 'tax':        return '💸';
    case 'transport':  return space.name === 'Roadways' ? '🚌'
                            : space.name === 'Railways' ? '🚂'
                            : space.name === 'Waterways' ? '🚢' : '✈️';
    case 'utility':    return space.name === 'Electricity' ? '💡' : '🌐';
    case 'start':      return '🏁';
    case 'jail':       return '⛓️';
    case 'club':       return '🎉';
    case 'rest_house': return '🏨';
    default:           return '🏛️';
  }
}

function WebTitleDeedHeader({ space, colorBar, photo }: {
  space: BoardSpace;
  colorBar: string | null;
  photo?: { emoji: string; landmark: string; scene: string[] };
}) {
  const accent = colorBar || getTypeAccent(space.type);
  return (
    <View style={[styles.deedHeader, { borderColor: accent }]}>
      <View style={[styles.deedTopStrip, { backgroundColor: accent }]}>
        <View style={styles.deedPriceBox}>
          <Text style={styles.deedPriceText} numberOfLines={1}>
            {(space.price ?? 0) > 0 ? `₹ ${space.price?.toLocaleString()}` : getTypeLabel(space)}
          </Text>
        </View>
        <Text style={styles.deedName} numberOfLines={1}>{space.name.replace('_', ' ')}</Text>
      </View>
      <View style={styles.deedImageRow}>
        <View style={[styles.deedImageFrame, { borderColor: accent }]}>
          <Text style={styles.deedImageEmoji}>{photo ? photo.emoji : getDefaultEmoji(space)}</Text>
          <Text style={styles.deedImageLabel} numberOfLines={1}>
            {photo?.landmark ?? formatImageKey(space.imageKey) ?? getSubtitle(space)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function getTypeAccent(type: BoardSpace['type']): string {
  switch (type) {
    case 'transport': return '#27272a';
    case 'utility': return '#0ea5e9';
    case 'tax': return '#a16207';
    case 'chance': return '#ef4444';
    case 'community': return '#7c3aed';
    default: return Colors.gold;
  }
}

function getTypeLabel(space: BoardSpace): string {
  if (space.type === 'tax') return `₹ ${space.taxAmount?.toLocaleString()}`;
  if (space.type === 'chance') return 'CHANCE';
  if (space.type === 'community') return 'CHEST';
  return space.type.replace('_', ' ').toUpperCase();
}

function formatImageKey(imageKey?: string): string | undefined {
  return imageKey?.replace(/-/g, ' ');
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(6,4,21,0.88)',
    alignItems: 'center', justifyContent: 'flex-end',
    padding: 0,
  },
  overlayWeb: {
    justifyContent: 'center',
    padding: 28,
    backgroundColor: 'rgba(6,4,21,0.66)',
  },
  modal: {
    backgroundColor: Colors.bgPanel,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    width: '100%', maxHeight: '88%',
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    borderBottomWidth: 0,
  },
  modalWeb: {
    width: 'min(560px, 94vw)' as any,
    maxWidth: 560,
    maxHeight: '86%',
    borderRadius: 18,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.45,
    shadowRadius: 34,
    elevation: 24,
  },
  modalSurface: {
    overflow: 'hidden',
  },
  webCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6,4,21,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  webCloseText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 27,
    fontWeight: '300',
  },
  deedHeader: {
    backgroundColor: '#f8fafc',
    borderWidth: 8,
    borderBottomWidth: 0,
  },
  deedTopStrip: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10,
  },
  deedPriceBox: {
    minWidth: 112,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 2,
  },
  deedPriceText: {
    color: '#172554',
    fontSize: 18,
    fontWeight: '900',
  },
  deedName: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'right',
    paddingRight: 38,
  },
  deedImageRow: {
    padding: 12,
    alignItems: 'center',
  },
  deedImageFrame: {
    width: '100%',
    height: 116,
    borderWidth: 2,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  deedImageEmoji: {
    fontSize: 54,
    marginBottom: 4,
  },
  deedImageLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  colorBand: {
    height: 148, width: '100%',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', position: 'relative',
  },
  colorBandWeb: {
    height: 112,
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

  contentScrollWeb: {
    maxHeight: 500,
  },
  content: { padding: 20, paddingBottom: 36, gap: 16 },
  contentWeb: {
    padding: 14,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: '#fff7ed',
  },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: Colors.goldLight, fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic', marginTop: 3 },
  colorChip: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  colorChipDot: { width: 12, height: 12, borderRadius: 6 },

  detailsSection: { gap: 3 },
  detailsSectionWeb: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.1)',
    borderRadius: 6,
    padding: 10,
  },
  detailsTitle: {
    color: Colors.gold, fontSize: 10, letterSpacing: 2.5,
    fontWeight: '800', marginTop: 4, marginBottom: 2,
  },
  detailsTitleWeb: {
    color: '#1e3a8a',
    letterSpacing: 1.5,
  },
  divider: { height: 1, backgroundColor: 'rgba(245,158,11,0.2)', marginVertical: 6 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, gap: 14 },
  rowLabel: { color: Colors.textPrimary, fontSize: 13, flex: 1 },
  rowLabelWeb: { color: '#111827', fontWeight: '700' },
  rowLabelSubtle: { color: Colors.textSecondary, fontStyle: 'italic' },
  rowValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  rowValueWeb: { color: '#111827' },
  rowValueHighlight: { color: Colors.goldLight, fontWeight: '900', fontSize: 16 },
  rowValueHighlightWeb: { color: '#1e3a8a' },

  bigStatement: {
    color: Colors.goldLight, fontSize: 24, fontWeight: '800',
    textAlign: 'center', marginVertical: 10,
  },
  bigStatementWeb: {
    color: '#172554',
  },
  note: {
    color: Colors.textSecondary, fontSize: 13, textAlign: 'center',
    fontStyle: 'italic', lineHeight: 21, marginVertical: 4,
  },
  noteWeb: {
    color: '#334155',
  },
  deedNoteBox: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.12)',
    borderRadius: 8,
    padding: 10,
  },
  deedNoteText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    fontWeight: '600',
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
