// components/PropertyModal.tsx — beautiful property detail modal

import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
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
  canBuyOrBuild, isOwnerMe, ownsColorSet, pendingBuy,
  onBuy, onSkipBuy, onBuild, onClose,
}: Props) {
  if (!space) return null;

  const owner = property ? players.find(p => p.id === property.ownerId) : null;
  const photo = CITY_PHOTOS[space.name];
  const colorBar = space.color ? Colors.prop[space.color as keyof typeof Colors.prop] : '#444';
  const canBuyNow = pendingBuy && myMoney >= (space.price || 0);
  const canBuildHouse = isOwnerMe && ownsColorSet && property && property.houses < 5 &&
                        myMoney >= (space.houseCost || 0) && space.type === 'property';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={pendingBuy ? undefined : onClose}>
        <Pressable style={styles.modal}>
          {/* Color band header */}
          <View style={[styles.colorBand, { backgroundColor: colorBar }]} />

          <View style={styles.content}>
            {/* Photo header */}
            <View style={styles.photoHeader}>
              {photo && <Text style={styles.photoEmoji}>{photo.emoji}</Text>}
              <View style={styles.titleSection}>
                <Text style={styles.title}>{space.name}</Text>
                {photo && <Text style={styles.subtitle}>{photo.landmark}</Text>}
                {!photo && <Text style={styles.subtitle}>{getSubtitle(space)}</Text>}
              </View>
            </View>

            {/* Info section */}
            {space.type === 'property' && <PropertyDetails space={space} />}
            {space.type === 'railroad' && <RailroadDetails />}
            {space.type === 'utility' && <UtilityDetails />}
            {space.type === 'tax' && <TaxDetails space={space} />}
            {(space.type === 'chance' || space.type === 'community') && <CardDetails space={space} />}
            {(space.type === 'jail' || space.type === 'gotojail' || space.type === 'go' || space.type === 'freeparking') &&
              <CornerDetails space={space} />}

            {/* Owner status */}
            {owner ? (
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerLabel}>OWNED BY</Text>
                <View style={styles.ownerRow}>
                  <View style={[styles.ownerDot, { backgroundColor: owner.color }]} />
                  <Text style={styles.ownerName}>{owner.token} {owner.name}</Text>
                </View>
                {property && property.houses > 0 && (
                  <Text style={styles.houseStatus}>
                    {property.houses < 5 ? `${'🏠'.repeat(property.houses)} ${property.houses} house${property.houses > 1 ? 's' : ''}` : '🏨 Hotel'}
                  </Text>
                )}
              </View>
            ) : (space.price && space.type !== 'tax' && space.type !== 'chance' && space.type !== 'community') ? (
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>✨ AVAILABLE FOR PURCHASE</Text>
              </View>
            ) : null}

            {/* Action buttons */}
            <View style={styles.btnRow}>
              {pendingBuy && canBuyNow && (
                <TouchableOpacity style={[styles.btn, styles.btnGold]} onPress={onBuy}>
                  <Text style={styles.btnGoldText}>BUY ₹{space.price?.toLocaleString()}</Text>
                </TouchableOpacity>
              )}
              {pendingBuy && (
                <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onSkipBuy}>
                  <Text style={styles.btnOutlineText}>SKIP</Text>
                </TouchableOpacity>
              )}
              {canBuildHouse && (
                <TouchableOpacity
                  style={[styles.btn, styles.btnGold]}
                  onPress={() => onBuild(space.id)}
                >
                  <Text style={styles.btnGoldText}>
                    BUILD {property!.houses < 4 ? 'HOUSE' : 'HOTEL'} ₹{space.houseCost?.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              )}
              {!pendingBuy && (
                <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onClose}>
                  <Text style={styles.btnOutlineText}>CLOSE</Text>
                </TouchableOpacity>
              )}
            </View>

            {pendingBuy && !canBuyNow && (
              <Text style={styles.warning}>⚠ Not enough money</Text>
            )}
          </View>
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
      <Text style={styles.detailsTitle}>RENT</Text>
      <DetailRow label="Base rent" value={`₹${r[0].toLocaleString()}`} />
      <DetailRow label="With color set" value={`₹${(r[0] * 2).toLocaleString()}`} subtle />
      <DetailRow label="🏠 1 House" value={`₹${r[1].toLocaleString()}`} />
      <DetailRow label="🏠🏠 2 Houses" value={`₹${r[2].toLocaleString()}`} />
      <DetailRow label="🏠🏠🏠 3 Houses" value={`₹${r[3].toLocaleString()}`} />
      <DetailRow label="🏠🏠🏠🏠 4 Houses" value={`₹${r[4].toLocaleString()}`} />
      <DetailRow label="🏨 Hotel" value={`₹${r[5].toLocaleString()}`} />
      <View style={styles.divider} />
      <DetailRow label="House cost" value={`₹${space.houseCost?.toLocaleString()}`} />
    </View>
  );
}

function RailroadDetails() {
  return (
    <View style={styles.detailsSection}>
      <DetailRow label="Price" value="₹2,000" highlight />
      <View style={styles.divider} />
      <Text style={styles.detailsTitle}>RENT (Based on Railways owned)</Text>
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
        Land here to draw a random card. Could be a reward or a penalty —{'\n'}
        {isChance
          ? 'Move to GO, pay tax, advance to a city, or go to jail!'
          : 'Receive money, pay fees, or other surprises!'}
      </Text>
    </View>
  );
}

function CornerDetails({ space }: { space: BoardSpace }) {
  const text: Record<string, string> = {
    go: 'Pass GO and collect ₹2,000 salary every time!',
    jail: 'Just visiting? No problem! If sent here, roll doubles to escape or pay ₹500 bail.',
    gotojail: 'Land here → Go directly to Jail! Do not pass GO, do not collect ₹2,000.',
    freeparking: 'A safe space! Nothing happens here — relax and plan your next move.',
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
    case 'utility': return space.id === 12 ? 'Power Distribution' : 'Water Supply';
    default: return '';
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: Colors.bgPanel,
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  colorBand: {
    height: 12,
    width: '100%',
  },
  content: { padding: 20 },

  photoHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  photoEmoji: { fontSize: 56 },
  titleSection: { flex: 1 },
  title: { color: Colors.goldLight, fontSize: 22, fontWeight: 'bold', letterSpacing: 1 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic', marginTop: 2 },

  detailsSection: { marginVertical: 8 },
  detailsTitle: { color: Colors.gold, fontSize: 11, letterSpacing: 2, fontWeight: 'bold', marginVertical: 6 },
  divider: { height: 1, backgroundColor: 'rgba(212,160,23,0.25)', marginVertical: 6 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: Colors.textPrimary, fontSize: 13 },
  rowLabelSubtle: { color: Colors.textSecondary, fontStyle: 'italic' },
  rowValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  rowValueHighlight: { color: Colors.goldLight, fontWeight: 'bold', fontSize: 15 },

  bigStatement: {
    color: Colors.goldLight,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
  },
  note: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    marginVertical: 6,
  },

  ownerInfo: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  ownerLabel: { color: Colors.textMuted, fontSize: 10, letterSpacing: 2, fontWeight: 'bold' },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  ownerDot: { width: 12, height: 12, borderRadius: 6 },
  ownerName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  houseStatus: { color: Colors.success, fontSize: 13, marginTop: 6 },

  availableBadge: {
    backgroundColor: 'rgba(46,204,113,0.15)',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  availableText: { color: Colors.success, fontSize: 12, letterSpacing: 1, fontWeight: 'bold' },

  btnRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  btnGold: { backgroundColor: Colors.gold },
  btnGoldText: { color: Colors.bgDark, fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  btnOutline: { borderWidth: 1.5, borderColor: Colors.gold, backgroundColor: 'transparent' },
  btnOutlineText: { color: Colors.gold, fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },

  warning: { color: Colors.danger, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
