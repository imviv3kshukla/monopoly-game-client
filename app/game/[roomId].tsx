// app/game/[roomId].tsx — Main game screen

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Modal, Alert, useWindowDimensions, Platform, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useGameStore } from '../../store/gameStore';
import {
  connectToRoom, sendRoll, sendBuy, sendSkipBuy, sendBuildHouse,
  sendEndTurn, sendPayJail, sendStartGame, sendEndGame,
} from '../../services/socket';
import { API_BASE_URL } from '../../services/config';
import { Board } from '../../components/Board';
import { AnimatedDice } from '../../components/AnimatedDice';
import { PlayerCard } from '../../components/PlayerCard';
import { PropertyModal } from '../../components/PropertyModal';
import { Colors } from '../../constants/theme';
import { BoardSpace } from '../../constants/board';
import { fetchBoardSpaces } from '../../services/board';

type CardReveal = {
  type: 'CHANCE' | 'COMMUNITY';
  text: string;
  raw: string;
  playerName?: string;
};

export default function GameScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { gameState, myPlayerId, isMyTurn, currentPlayer, myPlayer, boardSpaces, setBoardSpaces } = useGameStore();
  const [selectedSpace, setSelectedSpace] = useState<BoardSpace | null>(null);
  const [rolling, setRolling] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showCardModal, setShowCardModal] = useState<CardReveal | null>(null);
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
  // Track whether the local player has already rolled this turn
  const [hasRolledThisTurn, setHasRolledThisTurn] = useState(false);

  const me = myPlayer();
  const myTurn = isMyTurn();
  const current = currentPlayer();
  const { width } = useWindowDimensions();
  const isWideLayout = Platform.OS === 'web' && width >= 760;
  const webSidebarWidth = width < 960 ? 300 : 392;
  const webBoardPadding = width < 960 ? 14 : 28;

  // Timer ref for auto-end-turn
  const autoEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear auto-end timer on unmount
  useEffect(() => () => {
    if (autoEndTimer.current) clearTimeout(autoEndTimer.current);
  }, []);

  useEffect(() => {
    if (gameState || !roomId) return;
    let cancelled = false;
    async function rejoinFromSession() {
      const session = await useGameStore.getState().loadSession();
      if (!session || session.roomId !== roomId) {
        router.replace('/');
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/rooms/${session.roomId}/rejoin/${session.playerId}`);
        if (!res.ok) {
          await useGameStore.getState().clearSession();
          router.replace('/');
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        useGameStore.getState().setGameState(data.state);
        connectToRoom(session.roomId, session.playerId);
      } catch {
        if (!cancelled) router.replace('/');
      }
    }
    rejoinFromSession();
    return () => { cancelled = true; };
  }, [gameState, roomId]);

  // Reset roll state when turn changes (new player's turn begins)
  useEffect(() => {
    setHasRolledThisTurn(false);
    if (autoEndTimer.current) { clearTimeout(autoEndTimer.current); autoEndTimer.current = null; }
  }, [gameState?.currentPlayerIndex]);

  const lastShownCardRef = useRef<string | null>(null);

  // Show chance/community card popup when a drawn card appears in the server log.
  useEffect(() => {
    const reveal = getCardReveal(gameState);
    if (!reveal) return;

    const key = `${reveal.type}:${reveal.raw}`;
    if (lastShownCardRef.current === key) return;
    lastShownCardRef.current = key;

    setShowCardModal(reveal);
    const timeout = setTimeout(() => setShowCardModal(null), 5200);
    return () => clearTimeout(timeout);
  }, [gameState?.log[0], gameState?.pendingMessage]);

  // Stop dice rolling animation after server responds
  useEffect(() => {
    if (rolling) {
      const t = setTimeout(() => setRolling(false), 1700); // matches 1400ms anim + 120ms die2 delay + buffer
      return () => clearTimeout(t);
    }
  }, [gameState?.lastDice]);

  useEffect(() => {
    if (boardSpaces.length > 0) return;
    let cancelled = false;
    fetchBoardSpaces()
      .then(spaces => {
        if (!cancelled) setBoardSpaces(spaces);
      })
      .catch(error => {
        console.error('Failed to load board definition', error);
      });
    return () => { cancelled = true; };
  }, [boardSpaces.length, setBoardSpaces]);

  // ── scheduleAutoEnd: clears any existing timer, starts a 2.5s countdown to sendEndTurn
  const scheduleAutoEnd = useCallback(() => {
    if (autoEndTimer.current) clearTimeout(autoEndTimer.current);
    autoEndTimer.current = setTimeout(() => {
      // Read fresh state from Zustand to avoid stale closures
      const { gameState: gs, myPlayerId: pid, isMyTurn: checkMyTurn } = useGameStore.getState();
      if (!checkMyTurn() || !gs || gs.pendingAction !== null) return;
      sendEndTurn(roomId!, pid!);
      autoEndTimer.current = null;
    }, 2500);
  }, [roomId]);

  // ── After dice animation stops, start auto-end countdown (covers no-movement cases like jail)
  useEffect(() => {
    if (rolling || !hasRolledThisTurn || !myTurn) return;
    scheduleAutoEnd();
  }, [rolling]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Also reschedule when pendingAction clears (e.g. CARD resolved) during my turn
  useEffect(() => {
    if (!myTurn || !hasRolledThisTurn || gameState?.pendingAction !== null) return;
    scheduleAutoEnd();
  }, [gameState?.pendingAction]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRoll = () => {
    setRolling(true);
    setHasRolledThisTurn(true);
    sendRoll(roomId!, myPlayerId!);
  };

  const handleEndGame = () => {
    if (Platform.OS === 'web') {
      setShowEndGameConfirm(true);
      return;
    }

    Alert.alert(
      'End Game',
      'Are you sure? This will end the game and compute final scores for all players.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Game', style: 'destructive', onPress: () => sendEndGame(roomId!, myPlayerId!) },
      ]
    );
  };

  // ── Called by Board when a player's step animation finishes at their final tile
  const handleMoveComplete = useCallback((playerId: string) => {
    if (playerId !== myPlayerId) return;

    // Read fresh state — avoids stale closure issues with async animations
      const { gameState: gs, myPlayerId: pid, isMyTurn: checkMyTurn, boardSpaces: freshBoardSpaces } = useGameStore.getState();
      if (!checkMyTurn() || !gs) return;

    if (gs.pendingAction === 'BUY') {
      // Cancel auto-end, let player decide to buy or skip
      if (autoEndTimer.current) { clearTimeout(autoEndTimer.current); autoEndTimer.current = null; }
      const mePlayer = gs.players.find(p => p.id === pid);
      if (mePlayer) setSelectedSpace(freshBoardSpaces.find(space => space.id === mePlayer.position) ?? null);
    } else {
      // Re-start the auto-end timer from the end of animation (gives 2.5s to view result)
      scheduleAutoEnd();
    }
  }, [myPlayerId, scheduleAutoEnd]);

  if (!gameState) return <LoadingScreen />;

  const propertyOnSelected = selectedSpace ? gameState.properties[selectedSpace.id] : undefined;
  const isOwnerMe = propertyOnSelected?.ownerId === myPlayerId;
  const ownsColorSet = selectedSpace?.color
    ? boardSpaces.filter(s => s.color === selectedSpace.color)
        .every(s => gameState.properties[s.id]?.ownerId === myPlayerId)
    : false;
  const showBuyButtons = gameState.pendingAction === 'BUY' && myTurn && selectedSpace?.id === me?.position;

  if (gameState.status === 'WAITING') {
    return <WaitingRoom roomId={roomId!} state={gameState} myPlayerId={myPlayerId!} />;
  }

  if (boardSpaces.length === 0) return <LoadingScreen />;

  const playerCards = gameState.players.map((p, i) => {
    const propCount = Object.values(gameState.properties).filter(pr => pr.ownerId === p.id).length;
    return (
      <PlayerCard
        key={p.id}
        player={p}
        isActive={i === gameState.currentPlayerIndex}
        isMe={p.id === myPlayerId}
        propertyCount={propCount}
      />
    );
  });

  const controls = myTurn && !me?.bankrupt && !hasRolledThisTurn ? (
    <View style={styles.controls}>
      {gameState.pendingAction === null && (
        <ActionButton label="🎲  ROLL DICE" variant="gold" onPress={handleRoll} disabled={rolling} />
      )}
      {me?.inJail && gameState.pendingAction === null && (
        <ActionButton
          label="⛓️  Pay ₹500 Bail"
          variant="danger"
          onPress={() => sendPayJail(roomId!, myPlayerId!)}
        />
      )}
    </View>
  ) : null;

  const autoEndHint = myTurn && hasRolledThisTurn && !rolling && gameState.pendingAction === null && !selectedSpace ? (
    <View style={styles.autoEndHint}>
      <Text style={styles.autoEndHintText}>⏱  Turn ending automatically...</Text>
    </View>
  ) : null;
  const canRollNow = myTurn && !me?.bankrupt && !hasRolledThisTurn && gameState.pendingAction === null && !rolling;

  const board = (
    <Board
      spaces={boardSpaces}
      players={gameState.players}
      properties={gameState.properties}
      onTilePress={setSelectedSpace}
      onMoveComplete={handleMoveComplete}
      rolling={rolling}
      focusedPlayerId={current?.id ?? myPlayerId}
      cinematicCamera={true}
    />
  );
  const fullBoardSize = 732;
  const webBoardScale = isWideLayout
    ? Math.min(0.76, Math.max(0.58, (width - 520) / fullBoardSize))
    : Math.min(1, Math.max(0.46, (width - webSidebarWidth - webBoardPadding * 2) / fullBoardSize));
  const webBoard = (
    <View style={[styles.webBoardScaleBox, {
      width: fullBoardSize * webBoardScale,
      height: fullBoardSize * webBoardScale,
    }]}>
      <View style={[styles.webBoardScaleInner, { transform: [{ scale: webBoardScale }] }]}>
        {board}
      </View>
    </View>
  );

  const gameLog = (
    <View style={styles.logPanel}>
      {gameState.log.slice(0, 15).map((line, i) => (
        <View key={i} style={styles.logLineRow}>
          <View style={[styles.logBullet, i === 0 && styles.logBulletActive]} />
          <Text style={[styles.logLine, i === 0 && styles.logLineLatest]} numberOfLines={2}>{line}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {isWideLayout ? (
        <DesktopGameScene
          roomId={roomId!}
          board={webBoard}
          gameState={gameState}
          myPlayerId={myPlayerId!}
          myTurn={myTurn}
          hasRolled={hasRolledThisTurn}
          rolling={rolling}
          canRoll={canRollNow}
          current={current}
          latestLog={gameState.log[0] || 'Game started!'}
          playerCards={playerCards}
          onRoll={handleRoll}
          onRules={() => router.push('/rules')}
          onHome={() => router.replace('/')}
          onEndGame={handleEndGame}
        />
      ) : (
        <MobileGameScene
          roomId={roomId!}
          board={board}
          gameState={gameState}
          myPlayerId={myPlayerId!}
          myTurn={myTurn}
          hasRolled={hasRolledThisTurn}
          rolling={rolling}
          canRoll={canRollNow}
          current={current}
          latestLog={gameState.log[0] || 'Game started!'}
          showLog={showLog}
          onToggleLog={() => setShowLog(!showLog)}
          gameLog={gameLog}
          onRoll={handleRoll}
          onRules={() => router.push('/rules')}
          onHome={() => router.replace('/')}
          onEndGame={handleEndGame}
        />
      )}

      {/* ── Property Modal ── */}
      <PropertyModal
        visible={selectedSpace !== null}
        space={selectedSpace}
        property={propertyOnSelected}
        players={gameState.players}
        myMoney={me?.money || 0}
        canBuyOrBuild={myTurn}
        isOwnerMe={isOwnerMe}
        ownsColorSet={ownsColorSet}
        pendingBuy={!!showBuyButtons}
        onBuy={() => {
          if (autoEndTimer.current) { clearTimeout(autoEndTimer.current); autoEndTimer.current = null; }
          sendBuy(roomId!, myPlayerId!);
          setSelectedSpace(null);
          // Auto-end after buy — give server 700ms to process then end turn
          autoEndTimer.current = setTimeout(() => sendEndTurn(roomId!, myPlayerId!), 700);
        }}
        onSkipBuy={() => {
          if (autoEndTimer.current) { clearTimeout(autoEndTimer.current); autoEndTimer.current = null; }
          sendSkipBuy(roomId!, myPlayerId!);
          setSelectedSpace(null);
          autoEndTimer.current = setTimeout(() => sendEndTurn(roomId!, myPlayerId!), 700);
        }}
        onBuild={(id) => { sendBuildHouse(roomId!, myPlayerId!, id); setSelectedSpace(null); }}
        onClose={() => setSelectedSpace(null)}
      />

      {/* ── Card Drawn Modal ── */}
      <CardDrawnModal card={showCardModal} onClose={() => setShowCardModal(null)} />

      <EndGameConfirmModal
        visible={showEndGameConfirm}
        onCancel={() => setShowEndGameConfirm(false)}
        onConfirm={() => {
          setShowEndGameConfirm(false);
          sendEndGame(roomId!, myPlayerId!);
        }}
      />

      {/* ── Game Over ── */}
      <GameOverModal />
    </SafeAreaView>
  );
}

// ─── Turn Banner ──────────────────────────────────────────────────────────────

function TurnBanner({ isMyTurn, hasRolled, current }: {
  isMyTurn: boolean; hasRolled: boolean; current: any;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isMyTurn && !hasRolled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isMyTurn, hasRolled]);

  if (isMyTurn && !hasRolled) {
    return (
      <Animated.View style={[styles.turnBannerMine, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.turnBannerShimmer} pointerEvents="none" />
        <Text style={styles.turnBannerStar}>✨</Text>
        <Text style={styles.turnBannerTextMine}>YOUR TURN!</Text>
        <Text style={styles.turnBannerStar}>✨</Text>
      </Animated.View>
    );
  }

  if (isMyTurn && hasRolled) {
    return (
      <View style={styles.turnBannerRolled}>
        <Text style={styles.turnBannerTextRolled}>🎲  Dice rolled — moving...</Text>
      </View>
    );
  }

  return (
    <View style={styles.turnBannerWait}>
      <Text style={styles.turnBannerTextWait}>
        {current?.token}  {current?.name}'s turn...
      </Text>
    </View>
  );
}

function MobileGameScene({
  roomId,
  board,
  gameState,
  myPlayerId,
  myTurn,
  hasRolled,
  rolling,
  canRoll,
  current,
  latestLog,
  showLog,
  onToggleLog,
  gameLog,
  onRoll,
  onRules,
  onHome,
  onEndGame,
}: {
  roomId: string;
  board: React.ReactNode;
  gameState: any;
  myPlayerId: string;
  myTurn: boolean;
  hasRolled: boolean;
  rolling: boolean;
  canRoll: boolean;
  current: any;
  latestLog: string;
  showLog: boolean;
  onToggleLog: () => void;
  gameLog: React.ReactNode;
  onRoll: () => void;
  onRules: () => void;
  onHome: () => void;
  onEndGame: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const boardScale = Math.min(1.08, Math.max(0.86, width / 390));
  const actionWord = rolling ? 'ROLL!' : myTurn && !hasRolled ? 'ROLL!' : hasRolled ? 'MOVE!' : 'WAIT!';
  const dockRaised = height < 740;

  return (
    <View style={styles.mobileScene}>
      <View style={styles.mobileSkyGlow} pointerEvents="none" />
      <View style={styles.mobilePark} pointerEvents="none">
        <View style={styles.mobileParkOval} />
        <View style={styles.mobileRoadOne} />
        <View style={styles.mobileRoadTwo} />
        <View style={styles.mobileBuildingA} />
        <View style={styles.mobileBuildingB} />
      </View>

      <View style={styles.mobileTopHud}>
        <TouchableOpacity onPress={onHome} style={styles.mobileIconBtn}>
          <Text style={styles.mobileIconText}>⌂</Text>
        </TouchableOpacity>
        <View style={styles.mobileRoomPill}>
          <Text style={styles.mobileRoomLabel}>ROOM</Text>
          <Text style={styles.mobileRoomCode}>{roomId}</Text>
        </View>
        <TouchableOpacity onPress={onRules} style={styles.mobileIconBtn}>
          <Text style={styles.mobileIconText}>📖</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mobilePlayersDock}>
        {gameState.players.slice(0, 4).map((player: any, index: number) => (
          <MobilePlayerChip
            key={player.id}
            player={player}
            isMe={player.id === myPlayerId}
            isActive={index === gameState.currentPlayerIndex}
          />
        ))}
      </View>

      <View style={styles.mobileActionRibbon} pointerEvents="none">
        <View style={styles.mobileRibbonWingLeft} />
        <View style={styles.mobileRibbonMain}>
          <Text style={styles.mobileRibbonText}>{actionWord}</Text>
        </View>
        <View style={styles.mobileRibbonWingRight} />
      </View>

      <View style={[styles.mobileBoardScene, { transform: [{ scale: boardScale }] }]}>
        <View style={styles.mobileBoardShadow} />
        <View style={styles.mobileBoardTilt}>{board}</View>
      </View>

      <View style={styles.mobileSparkles} pointerEvents="none">
        <Text style={[styles.mobileSparkle, styles.mobileSparkleA]}>✦</Text>
        <Text style={[styles.mobileSparkle, styles.mobileSparkleB]}>✧</Text>
        <Text style={[styles.mobileSparkle, styles.mobileSparkleC]}>✦</Text>
      </View>

      <View style={[styles.mobileBottomDock, dockRaised && styles.mobileBottomDockCompact]}>
        <View style={styles.mobileDiceFloat}>
          <AnimatedDice values={gameState.lastDice} rolling={rolling} />
        </View>
        <View style={styles.mobileDockBar}>
          <TouchableOpacity style={styles.mobileDockIconBtn} onPress={onToggleLog}>
            <Text style={styles.mobileDockIconText}>📜</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mobileGoButton, !canRoll && styles.mobileGoButtonDisabled]}
            onPress={onRoll}
            disabled={!canRoll}
            activeOpacity={0.86}
          >
            <View style={styles.mobileGoShine} pointerEvents="none" />
            <Text style={styles.mobileGoText}>GO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mobileDockIconBtn} onPress={onEndGame}>
            <Text style={styles.mobileDockIconText}>⛔</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.mobileStatusLine}>
          <Text style={styles.mobileStatusText} numberOfLines={1}>
            {myTurn ? latestLog : `${current?.token ?? ''} ${current?.name ?? 'Opponent'} turn`}
          </Text>
        </View>
        {showLog && <View style={styles.mobileLogSheet}>{gameLog}</View>}
      </View>
    </View>
  );
}

function MobilePlayerChip({ player, isMe, isActive }: { player: any; isMe: boolean; isActive: boolean }) {
  return (
    <View style={[styles.mobilePlayerChip, isActive && { borderColor: player.color, shadowColor: player.color }]}>
      <View style={[styles.mobilePlayerAvatar, { backgroundColor: player.color }]}>
        <Text style={styles.mobilePlayerToken}>{player.token}</Text>
      </View>
      <View style={styles.mobilePlayerCopy}>
        <Text style={styles.mobilePlayerName} numberOfLines={1}>{isMe ? 'You' : player.name}</Text>
        <Text style={styles.mobilePlayerMoney} numberOfLines={1}>₹{player.money.toLocaleString()}</Text>
      </View>
      {isActive && <View style={styles.mobileTurnDot} />}
    </View>
  );
}

function DesktopGameScene({
  roomId,
  board,
  gameState,
  myPlayerId,
  myTurn,
  hasRolled,
  rolling,
  canRoll,
  current,
  latestLog,
  playerCards,
  onRoll,
  onRules,
  onHome,
  onEndGame,
}: {
  roomId: string;
  board: React.ReactNode;
  gameState: any;
  myPlayerId: string;
  myTurn: boolean;
  hasRolled: boolean;
  rolling: boolean;
  canRoll: boolean;
  current: any;
  latestLog: string;
  playerCards: React.ReactNode;
  onRoll: () => void;
  onRules: () => void;
  onHome: () => void;
  onEndGame: () => void;
}) {
  const actionWord = rolling ? 'ROLL!' : myTurn && !hasRolled ? 'ROLL!' : hasRolled ? 'MOVE!' : 'WAIT!';
  const [inspectView, setInspectView] = useState(false);
  const viewAnim = useRef(new Animated.Value(0)).current;
  const historyPan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const historyPanRef = useRef({ x: 0, y: 0 });
  const historyPanResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => {
      historyPan.stopAnimation((value) => {
        historyPanRef.current = value;
        historyPan.setOffset(value);
        historyPan.setValue({ x: 0, y: 0 });
      });
    },
    onPanResponderMove: Animated.event([null, { dx: historyPan.x, dy: historyPan.y }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (_, gesture) => {
      const next = {
        x: Math.max(-20, Math.min(760, historyPanRef.current.x + gesture.dx)),
        y: Math.max(-520, Math.min(80, historyPanRef.current.y + gesture.dy)),
      };
      historyPan.flattenOffset();
      historyPanRef.current = next;
      Animated.spring(historyPan, {
        toValue: next,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }).start();
    },
  })).current;

  useEffect(() => {
    Animated.spring(viewAnim, {
      toValue: inspectView ? 1 : 0,
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [inspectView, viewAnim]);

  const boardRotateX = viewAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['27deg', '12deg'],
  });
  const boardScale = viewAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.94],
  });
  const boardLift = viewAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, -26],
  });

  return (
    <View style={styles.desktopScene}>
      <View style={styles.desktopSkyGlow} pointerEvents="none" />
      <View style={styles.desktopParkLayer} pointerEvents="none">
        <View style={styles.desktopParkOval} />
        <View style={styles.desktopRoadOne} />
        <View style={styles.desktopRoadTwo} />
        <View style={styles.desktopBuildingOne} />
        <View style={styles.desktopBuildingTwo} />
      </View>

      <View style={styles.desktopTopHud}>
        <TouchableOpacity onPress={onHome} style={styles.mobileIconBtn}>
          <Text style={styles.mobileIconText}>⌂</Text>
        </TouchableOpacity>
        <View style={styles.desktopRoomPill}>
          <Text style={styles.mobileRoomLabel}>ROOM</Text>
          <Text style={styles.mobileRoomCode}>{roomId}</Text>
        </View>
        <TouchableOpacity onPress={onRules} style={styles.mobileIconBtn}>
          <Text style={styles.mobileIconText}>📖</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.desktopActionRibbon} pointerEvents="none">
        <View style={styles.mobileRibbonWingLeft} />
        <View style={[styles.mobileRibbonMain, styles.desktopRibbonMain]}>
          <Text style={styles.mobileRibbonText}>{actionWord}</Text>
        </View>
        <View style={styles.mobileRibbonWingRight} />
      </View>

      <View style={styles.desktopShell}>
        <View style={styles.desktopBoardPane}>
          <Animated.View
            style={[
              styles.desktopBoardTilt,
              {
                transform: [
                  { perspective: 1100 },
                  { rotateX: boardRotateX },
                  { rotateZ: '-3deg' },
                  { translateY: boardLift },
                  { scale: boardScale },
                ],
              },
            ]}
          >
            {board}
          </Animated.View>
          <View style={styles.desktopStatusLine}>
            <Text style={styles.mobileStatusText} numberOfLines={1}>
              {myTurn ? latestLog : `${current?.token ?? ''} ${current?.name ?? 'Opponent'} turn`}
            </Text>
          </View>
        </View>

        <View style={styles.desktopFloatingControl}>
          <View style={styles.webBrandRow}>
            <View style={styles.webLogo}>
              <Text style={styles.webLogoText}>IB</Text>
            </View>
            <View style={styles.webBrandCopy}>
              <Text style={styles.webTitle}>Indian Business</Text>
              <Text style={styles.webSubtitle}>Property Trading Game</Text>
            </View>
          </View>
          <View style={styles.desktopCompactDice}>
            <AnimatedDice values={gameState.lastDice} rolling={rolling} />
          </View>
          <TouchableOpacity
            style={[styles.desktopGoButton, !canRoll && styles.desktopGoButtonDisabled]}
            onPress={onRoll}
            disabled={!canRoll}
          >
            <View style={styles.mobileGoShine} pointerEvents="none" />
            <Text style={styles.desktopGoText}>GO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.desktopViewButton} onPress={() => setInspectView(v => !v)}>
            <Text style={styles.desktopViewButtonText}>{inspectView ? 'CINEMATIC VIEW' : 'READ TILE VIEW'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.desktopPlayersStrip}>
          {gameState.players.slice(0, 4).map((player: any, index: number) => (
            <MobilePlayerChip
              key={player.id}
              player={player}
              isMe={player.id === myPlayerId}
              isActive={index === gameState.currentPlayerIndex}
            />
          ))}
        </View>

        <Animated.View style={[styles.desktopHistoryCard, { transform: historyPan.getTranslateTransform() }]}>
          <View style={styles.desktopHistoryHandle} {...historyPanResponder.panHandlers}>
            <Text style={styles.webSectionTitle}>Game History</Text>
            <Text style={styles.webSectionMeta}>{gameState.log.length}</Text>
          </View>
          <ScrollView style={styles.desktopHistoryScroll} showsVerticalScrollIndicator>
            {gameState.log.slice(0, 30).map((line: string, i: number) => (
              <View key={i} style={styles.logLineRow}>
                <View style={[styles.logBullet, i === 0 && styles.logBulletActive]} />
                <Text style={[styles.logLine, i === 0 && styles.logLineLatest]}>{line}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        <TouchableOpacity style={styles.desktopEndButton} onPress={onEndGame}>
          <Text style={styles.endGameText}>⛔  End Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingScreen() {
  const pulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.waitingCloudA} />
      <View style={styles.waitingCloudB} />
      <Animated.Text style={[styles.loadingTitle, { opacity: pulse }]}>BUSINESS</Animated.Text>
      <Text style={styles.loadingText}>Connecting to game...</Text>
    </View>
  );
}

function WaitingRoom({ roomId, state, myPlayerId }: any) {
  const isHost = state.players[0]?.id === myPlayerId;
  const canStart = state.players.length >= 2;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.waitingRoot} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.waitingSky} pointerEvents="none">
        <View style={styles.waitingSunbeamA} />
        <View style={styles.waitingSunbeamB} />
        <View style={styles.waitingCloudA} />
        <View style={styles.waitingCloudB} />
        <View style={styles.waitingCloudC} />
        <View style={styles.waitingBottomCloud} />
      </View>
      <ScrollView contentContainerStyle={styles.waitingScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.waitingHero}>
          <Text style={styles.waitingTitle}>BUSINESS</Text>
          <Text style={styles.waitingTitleShadow}>BUSINESS</Text>
          <View style={styles.waitingBoardMini}>
            <View style={[styles.waitingMiniTile, styles.waitingMiniTileA]} />
            <View style={[styles.waitingMiniTile, styles.waitingMiniTileB]} />
            <View style={[styles.waitingMiniTile, styles.waitingMiniTileC]} />
            <View style={styles.waitingMiniDice}>
              <View style={styles.waitingMiniDotA} />
              <View style={styles.waitingMiniDotB} />
              <View style={styles.waitingMiniDotC} />
            </View>
          </View>
        </View>

        <View style={styles.codeBox}>
          <Text style={styles.codeBoxLabel}>ROOM CODE</Text>
          <Text style={styles.codeBoxCode}>{roomId}</Text>
          <Text style={styles.codeBoxHint}>Share this with friends</Text>
        </View>

        <Text style={styles.waitingPlayersHeader}>PLAYERS {state.players.length}/4</Text>
        <View style={styles.waitingPlayers}>
          {state.players.map((p: any, i: number) => (
            <View key={p.id} style={[styles.waitingPlayer, { borderColor: p.color + '60' }]}>
              <View style={[styles.waitingPlayerAvatar, { backgroundColor: p.color }]}>
                <Text style={styles.waitingPlayerToken}>{p.token}</Text>
              </View>
              <Text style={[styles.waitingPlayerName, { color: p.color }]}>
                {p.name}{p.id === myPlayerId && '  (You)'}{i === 0 && '  👑'}
              </Text>
              <View style={[styles.readyBadge, { backgroundColor: p.color }]}>
                <Text style={styles.readyText}>READY</Text>
              </View>
            </View>
          ))}
          {Array.from({ length: 4 - state.players.length }).map((_, i) => (
            <Animated.View key={`empty${i}`} style={[styles.waitingPlayerEmpty, { opacity: dotAnim }]}>
              <Text style={styles.waitingEmptyText}>Waiting for player...</Text>
            </Animated.View>
          ))}
        </View>

        {isHost ? (
          <TouchableOpacity
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            disabled={!canStart}
            onPress={() => sendStartGame(roomId, myPlayerId)}
            activeOpacity={0.85}
          >
            <View style={styles.btnShine} />
            <Text style={styles.startBtnText}>
              {canStart ? '▶  START GAME' : 'Need at least 2 players'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingHintBox}>
            <Text style={styles.waitingHint}>⏳  Waiting for {state.players[0]?.name} to start...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ label, variant, onPress, disabled }: {
  label: string; variant: 'gold' | 'purple' | 'danger'; onPress: () => void; disabled?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true }).start();
  const bgMap   = { gold: Colors.gold, purple: Colors.electric, danger: '#ef4444' };
  const textMap = { gold: Colors.bgDark, purple: '#fff', danger: '#fff' };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: bgMap[variant] }, disabled && styles.actionBtnDisabled]}
        onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
        disabled={disabled} activeOpacity={1}
      >
        <View style={styles.btnShine} />
        <Text style={[styles.actionBtnText, { color: textMap[variant] }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function getCardReveal(gameState: any): CardReveal | null {
  if (!gameState) return null;

  if (gameState.pendingAction === 'CARD' && gameState.pendingMessage) {
    const current = gameState.players?.[gameState.currentPlayerIndex];
    const recentLanding = findRecentCardLanding(gameState.log ?? []);
    return {
      type: recentLanding?.type ?? 'CHANCE',
      text: cleanCardText(gameState.pendingMessage, current?.name),
      raw: gameState.pendingMessage,
      playerName: current?.name,
    };
  }

  const logs: string[] = gameState.log ?? [];
  const recentLanding = findRecentCardLanding(logs);
  if (!recentLanding || recentLanding.index !== 1) return null;

  const raw = logs[0];
  if (!raw || isNonCardLog(raw)) return null;

  return {
    type: recentLanding.type,
    text: cleanCardText(raw, recentLanding.playerName),
    raw,
    playerName: recentLanding.playerName,
  };
}

function findRecentCardLanding(logs: string[]): { type: 'CHANCE' | 'COMMUNITY'; index: number; playerName?: string } | null {
  const maxLookback = Math.min(logs.length, 4);
  for (let i = 0; i < maxLookback; i++) {
    const line = logs[i] ?? '';
    const chance = line.match(/^(.*?) landed on Chance\b/i);
    if (chance) return { type: 'CHANCE', index: i, playerName: chance[1]?.trim() };
    const community = line.match(/^(.*?) landed on Community Chest\b/i);
    if (community) return { type: 'COMMUNITY', index: i, playerName: community[1]?.trim() };
  }
  return null;
}

function cleanCardText(raw: string, playerName?: string): string {
  let text = raw.replace(/^(Chance|Community)( Chest)?:\s*/i, '').trim();
  if (playerName) {
    text = text.replace(new RegExp(`^${escapeRegExp(playerName)}\\s*:?\\s*`, 'i'), '').trim();
  }
  return text.replace(/\s+/g, ' ');
}

function isNonCardLog(line: string): boolean {
  return /^Buy\b| rolled | landed on | bought | built | joined the game|Game started|turn|passed START/i.test(line);
}

function getCardAction(text: string): { ribbon: string; label: string; amount?: string } {
  const amountMatch = text.match(/₹\s?[\d,]+/);
  const amount = amountMatch?.[0].replace(/\s/g, '');
  if (/collect|refund|pays you|dividend|interest|bonus|maturity|matured|birthday/i.test(text)) {
    return { ribbon: 'WIN!', label: 'COLLECT', amount };
  }
  if (/pay|fees|premium|repair|loss|tax|club/i.test(text)) {
    return { ribbon: 'PAY!', label: 'PAY', amount };
  }
  if (/jail|club|advance|start/i.test(text)) {
    return { ribbon: 'MOVE!', label: 'MOVE' };
  }
  return { ribbon: 'CARD!', label: 'DRAW' };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function CardDrawnModal({ card, onClose }: { card: CardReveal | null; onClose: () => void }) {
  const popAnim = useRef(new Animated.Value(0.86)).current;
  const glowAnim = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    if (!card) return;
    popAnim.setValue(0.86);
    glowAnim.setValue(0.25);
    Animated.parallel([
      Animated.spring(popAnim, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.9, duration: 900, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, [card, glowAnim, popAnim]);

  if (!card) return null;

  const isChance = card.type === 'CHANCE';
  const accent = isChance ? '#facc15' : '#38bdf8';
  const darkAccent = isChance ? '#d97706' : '#0369a1';
  const action = getCardAction(card.text);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.cardModalOverlay}>
        <View style={styles.cardModalBackdropBoard} pointerEvents="none" />
        <View style={styles.cardModalSparkles} pointerEvents="none">
          <Text style={[styles.cardModalSparkle, styles.cardModalSparkleA]}>✦</Text>
          <Text style={[styles.cardModalSparkle, styles.cardModalSparkleB]}>✧</Text>
          <Text style={[styles.cardModalSparkle, styles.cardModalSparkleC]}>✦</Text>
        </View>

        <View style={styles.cardRibbon} pointerEvents="none">
          <View style={styles.cardRibbonWingLeft} />
          <View style={styles.cardRibbonMain}>
            <Text style={styles.cardRibbonText}>{action.ribbon}</Text>
          </View>
          <View style={styles.cardRibbonWingRight} />
        </View>

        <Animated.View
          style={[
            styles.cardModal,
            {
              borderColor: accent,
              shadowColor: accent,
              transform: [{ scale: popAnim }],
            },
          ]}
        >
          <Animated.View style={[styles.cardModalGlow, { opacity: glowAnim, backgroundColor: accent }]} />
          <View style={[styles.cardModalHeader, { backgroundColor: isChance ? '#fff7ed' : '#e0f2fe' }]}>
            <Text style={[styles.cardModalTitle, { color: darkAccent }]}>
              {isChance ? 'CHANCE' : 'COMMUNITY CHEST'}
            </Text>
          </View>

          <View style={styles.cardModalBody}>
            <View style={[styles.cardMascot, { backgroundColor: isChance ? '#fef3c7' : '#dbeafe' }]}>
              <Text style={styles.cardMascotHat}>{isChance ? '🎩' : '💌'}</Text>
              <Text style={styles.cardMascotFace}>{isChance ? '💰' : '🏦'}</Text>
            </View>
            <View style={styles.cardModalCopy}>
              <Text style={[styles.cardActionLabel, { color: darkAccent }]}>{action.label}</Text>
              {action.amount ? (
                <Text style={[styles.cardActionAmount, { color: darkAccent }]}>{action.amount}</Text>
              ) : null}
              <Text style={styles.cardModalText}>{card.text}</Text>
              {card.playerName ? (
                <Text style={styles.cardModalPlayer}>Drawn by {card.playerName}</Text>
              ) : null}
            </View>
          </View>
        </Animated.View>

        <TouchableOpacity style={styles.cardModalClose} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.cardModalCloseText}>OK</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function GameOverModal() {
  const { gameState } = useGameStore();
  const pulse = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!gameState || gameState.status !== 'FINISHED') return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.95, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [gameState?.status, pulse]);

  if (!gameState || gameState.status !== 'FINISHED') return null;

  const summaries = gameState.finalSummaries;
  const rankBadges = ['🥇', '🥈', '🥉', '4️⃣'];
  const winner = summaries
    ? summaries.find(s => s.rank === 1)
    : gameState.players.find(p => p.id === gameState.winnerId);

  return (
    <View style={styles.gameOverOverlay}>
      <ScrollView contentContainerStyle={styles.gameOverScroll} showsVerticalScrollIndicator={false}>
        <Animated.Text style={[styles.trophy, { transform: [{ scale: pulse }] }]}>🏆</Animated.Text>
        <Text style={styles.gameOverTitle}>GAME OVER!</Text>
        {winner && (
          <>
            <Text style={styles.gameOverWinner}>{winner.token}  {winner.name}</Text>
            <Text style={styles.gameOverSub}>WINS THE GAME!</Text>
          </>
        )}

        {summaries && summaries.length > 0 ? (
          <View style={styles.summaryTable}>
            <Text style={styles.summaryHeader}>FINAL STANDINGS</Text>
            {[...summaries].sort((a, b) => a.rank - b.rank).map((s) => (
              <View key={s.playerId} style={[styles.summaryRow, s.bankrupt && styles.summaryRowBankrupt]}>
                <Text style={styles.summaryRank}>{rankBadges[s.rank - 1] ?? `${s.rank}`}</Text>
                <View style={[styles.summaryColorDot, { backgroundColor: s.color }]} />
                <View style={styles.summaryInfo}>
                  <Text style={[styles.summaryName, s.bankrupt && styles.summaryNameBankrupt]}>
                    {s.token} {s.name}
                  </Text>
                  <Text style={styles.summarySub}>
                    💵 ₹{s.cash.toLocaleString()}  🏠 ₹{s.propertyValue.toLocaleString()}
                  </Text>
                </View>
                <Text style={[styles.summaryTotal, s.bankrupt && styles.summaryTotalBankrupt]}>
                  {s.bankrupt ? '💀' : `₹${s.totalWorth.toLocaleString()}`}
                </Text>
              </View>
            ))}
          </View>
        ) : winner && (
          <Text style={styles.gameOverMoney}>
            ₹{(winner as any).money?.toLocaleString?.() ?? '—'}
          </Text>
        )}

        <TouchableOpacity
          style={styles.gameOverBtn}
          onPress={() => useGameStore.getState().clearSession().then(() => router.replace('/'))}
        >
          <View style={styles.btnShine} />
          <Text style={styles.gameOverBtnText}>Back to Lobby</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function EndGameConfirmModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmEyebrow}>END GAME</Text>
          <Text style={styles.confirmTitle}>Finish this game?</Text>
          <Text style={styles.confirmMessage}>
            Final scores will be computed for all players and the winner will be shown.
          </Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity style={[styles.confirmBtn, styles.confirmCancelBtn]} onPress={onCancel}>
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, styles.confirmEndBtn]} onPress={onConfirm}>
              <Text style={styles.confirmEndText}>End Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  scroll: { paddingHorizontal: 12, paddingBottom: 50, gap: 14 },

  mobileScene: {
    flex: 1,
    backgroundColor: '#7ed957',
    overflow: 'hidden',
    userSelect: 'none' as any,
  },
  mobileSkyGlow: {
    position: 'absolute',
    top: -130,
    left: -60,
    right: -60,
    height: 330,
    borderBottomLeftRadius: 220,
    borderBottomRightRadius: 220,
    backgroundColor: 'rgba(125,211,252,0.58)',
  },
  mobilePark: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  mobileParkOval: {
    display: 'none',
  },
  mobileRoadOne: {
    display: 'none',
  },
  mobileRoadTwo: {
    display: 'none',
  },
  mobileBuildingA: {
    display: 'none',
  },
  mobileBuildingB: {
    display: 'none',
  },
  mobileTopHud: {
    position: 'absolute',
    top: 10,
    left: 14,
    right: 14,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(7,5,16,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  mobileIconText: { fontSize: 18 },
  mobileRoomPill: {
    minWidth: 116,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(7,5,16,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  mobileRoomLabel: { color: 'rgba(255,255,255,0.54)', fontSize: 8, letterSpacing: 2.5, fontWeight: '800' },
  mobileRoomCode: { color: '#fff7ed', fontSize: 15, fontWeight: '900', letterSpacing: 3 },
  mobilePlayersDock: {
    position: 'absolute',
    top: 62,
    left: 10,
    right: 10,
    zIndex: 35,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  mobilePlayerChip: {
    minWidth: 112,
    maxWidth: 156,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingLeft: 7,
    paddingRight: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(7,5,16,0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },
  mobilePlayerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  mobilePlayerToken: { fontSize: 18 },
  mobilePlayerCopy: { flex: 1, minWidth: 0 },
  mobilePlayerName: { color: '#fff', fontSize: 12, fontWeight: '900' },
  mobilePlayerMoney: { color: Colors.goldLight, fontSize: 12, fontWeight: '900', marginTop: 1 },
  mobileTurnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  mobileActionRibbon: {
    position: 'absolute',
    top: 126,
    left: 24,
    right: 24,
    height: 76,
    zIndex: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileRibbonMain: {
    minWidth: 210,
    height: 58,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef2b14',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.32)',
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#7f1d1d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 14,
  },
  mobileRibbonWingLeft: {
    position: 'absolute',
    left: 22,
    bottom: 9,
    width: 92,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#b91c1c',
    transform: [{ rotate: '-14deg' }],
  },
  mobileRibbonWingRight: {
    position: 'absolute',
    right: 22,
    bottom: 9,
    width: 92,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#b91c1c',
    transform: [{ rotate: '14deg' }],
  },
  mobileRibbonText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: '#7f1d1d',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 0,
  },
  mobileBoardScene: {
    position: 'absolute',
    left: -4,
    right: -4,
    top: 154,
    zIndex: 10,
    alignItems: 'center',
  },
  mobileBoardShadow: {
    position: 'absolute',
    top: 90,
    width: 360,
    height: 420,
    borderRadius: 180,
    backgroundColor: 'rgba(15,23,42,0.34)',
    transform: [{ scaleX: 1.14 }],
  },
  mobileBoardTilt: {
    transform: [
      { perspective: 900 },
      { rotateX: '48deg' },
      { rotateZ: '-7deg' },
      { translateY: -36 },
    ],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 18,
  },
  mobileSparkles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 24,
  },
  mobileSparkle: {
    position: 'absolute',
    color: '#fff7ad',
    fontSize: 24,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  mobileSparkleA: { top: 230, left: 42 },
  mobileSparkleB: { top: 290, right: 36 },
  mobileSparkleC: { bottom: 210, left: 74 },
  mobileBottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 18,
  },
  mobileBottomDockCompact: { paddingBottom: 10 },
  mobileDiceFloat: {
    marginBottom: -20,
    transform: [{ scale: 0.72 }],
    zIndex: 2,
  },
  mobileDockBar: {
    width: '100%',
    minHeight: 86,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: '#fff7d6',
    borderWidth: 2,
    borderColor: 'rgba(245,158,11,0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 18,
  },
  mobileDockIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3b0',
    borderWidth: 1,
    borderColor: 'rgba(161,98,7,0.22)',
  },
  mobileDockIconText: { fontSize: 21 },
  mobileGoButton: {
    width: 104,
    height: 78,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef3b22',
    borderWidth: 4,
    borderColor: '#fff9c2',
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#991b1b',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.45,
    shadowRadius: 11,
    elevation: 20,
    overflow: 'hidden',
  },
  mobileGoButtonDisabled: {
    backgroundColor: '#bda06b',
    opacity: 0.72,
  },
  mobileGoShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  mobileGoText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: '#7f1d1d',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  mobileStatusLine: {
    width: '92%',
    marginTop: 8,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(7,5,16,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mobileStatusText: {
    color: Colors.goldPale,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  mobileLogSheet: {
    width: '100%',
    maxHeight: 190,
    marginTop: 8,
  },

  desktopScene: {
    flex: 1,
    backgroundColor: '#84d85a',
    overflow: 'hidden',
    userSelect: 'none' as any,
  },
  desktopSkyGlow: {
    position: 'absolute',
    top: -220,
    left: -120,
    right: -120,
    height: 520,
    borderBottomLeftRadius: 420,
    borderBottomRightRadius: 420,
    backgroundColor: 'rgba(125,211,252,0.55)',
  },
  desktopParkLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  desktopParkOval: {
    display: 'none',
  },
  desktopRoadOne: {
    display: 'none',
  },
  desktopRoadTwo: {
    display: 'none',
  },
  desktopBuildingOne: {
    display: 'none',
  },
  desktopBuildingTwo: {
    display: 'none',
  },
  desktopTopHud: {
    position: 'absolute',
    top: 18,
    left: 24,
    right: 24,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  desktopRoomPill: {
    minWidth: 150,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(7,5,16,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  desktopActionRibbon: {
    position: 'absolute',
    top: 70,
    left: '44%',
    width: 330,
    height: 86,
    zIndex: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopRibbonMain: {
    minWidth: 232,
    height: 58,
  },
  desktopShell: {
    flex: 1,
    paddingTop: 92,
    paddingLeft: 18,
    paddingRight: 18,
    paddingBottom: 82,
  },
  desktopSidePanel: {
    width: 360,
    flexShrink: 0,
    borderRadius: 24,
    backgroundColor: 'rgba(7,5,16,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  desktopSideContent: {
    padding: 18,
    gap: 14,
    paddingBottom: 22,
  },
  desktopTurnPanel: {
    borderRadius: 18,
    padding: 14,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  desktopGoButton: {
    alignSelf: 'center',
    width: 120,
    height: 82,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef3b22',
    borderWidth: 4,
    borderColor: '#fff9c2',
    shadowColor: '#991b1b',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.45,
    shadowRadius: 11,
    elevation: 18,
    overflow: 'hidden',
  },
  desktopGoButtonDisabled: {
    backgroundColor: '#bda06b',
    opacity: 0.72,
  },
  desktopGoText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: '#7f1d1d',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  desktopBoardPane: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  desktopBoardHalo: {
    display: 'none',
  },
  desktopBoardTilt: {
    marginTop: 22,
  },
  desktopStatusLine: {
    position: 'absolute',
    left: '50%',
    bottom: 68,
    width: 560,
    maxWidth: '44%',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(7,5,16,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34,
    shadowRadius: 12,
    transform: [{ translateX: -280 }],
  },
  desktopFloatingControl: {
    position: 'absolute',
    top: 96,
    left: 22,
    width: 300,
    borderRadius: 22,
    padding: 14,
    gap: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(7,5,16,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  desktopCompactDice: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    transform: [{ scale: 0.82 }],
  },
  desktopViewButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,247,237,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  desktopViewButtonText: {
    color: Colors.goldLight,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  desktopPlayersStrip: {
    position: 'absolute',
    top: 92,
    right: 22,
    maxWidth: 460,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  desktopHistoryCard: {
    position: 'absolute',
    left: 22,
    bottom: 18,
    width: 380,
    maxHeight: 250,
    borderRadius: 18,
    padding: 12,
    gap: 10,
    backgroundColor: 'rgba(7,5,16,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  desktopHistoryHandle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    cursor: 'grab' as any,
  },
  desktopHistoryScroll: {
    maxHeight: 188,
  },
  desktopEndButton: {
    position: 'absolute',
    right: 22,
    bottom: 18,
    width: 160,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.32)',
    backgroundColor: 'rgba(7,5,16,0.76)',
  },

  webShell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#070510',
  },
  webSidebar: {
    width: 392,
    flexShrink: 0,
    backgroundColor: '#0b0718',
    borderRightWidth: 1,
    borderRightColor: 'rgba(245,158,11,0.18)',
  },
  webSidebarContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 28,
  },
  webBoardPane: {
    flex: 1,
    backgroundColor: '#0a0716',
  },
  webBoardContent: {
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  webBoardScaleBox: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  webBoardScaleInner: {
    width: 732,
    height: 732,
    transformOrigin: 'top left',
  },
  webBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  webLogo: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  webLogoText: {
    color: Colors.bgDark,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  webBrandCopy: { flex: 1 },
  webTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
  },
  webSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  webRoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  webSmallBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webSmallBtnText: { fontSize: 18 },
  webRoomBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.22)',
  },
  webPanel: {
    backgroundColor: Colors.bgPanel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.14)',
    padding: 14,
    gap: 12,
  },
  webDiceBox: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  webSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webSectionTitle: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  webSectionMeta: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  webPlayersList: {
    gap: 10,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1687ff',
    gap: 10,
    overflow: 'hidden',
  },
  loadingTitle: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 0,
    textShadowColor: '#7e22ce',
    textShadowOffset: { width: 0, height: 7 },
    textShadowRadius: 0,
  },
  loadingText: { color: '#dbeafe', fontSize: 14, fontWeight: '800' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: Colors.bgPanel,
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,158,11,0.15)',
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  iconBtnText: { fontSize: 20 },
  roomBadge: { alignItems: 'center' },
  roomBadgeLabel: { color: Colors.textMuted, fontSize: 9, letterSpacing: 3, fontWeight: '700' },
  roomBadgeCode: { color: Colors.goldLight, fontSize: 18, fontWeight: '900', letterSpacing: 4 },

  playersRow: { paddingHorizontal: 2, paddingVertical: 6, gap: 10 },

  // Turn banners
  turnBannerMine: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.success, borderRadius: 14,
    paddingVertical: 14, gap: 10, overflow: 'hidden',
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 16, elevation: 8,
  },
  turnBannerShimmer: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  turnBannerStar: { fontSize: 20 },
  turnBannerTextMine: { color: Colors.bgDark, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  turnBannerRolled: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  turnBannerTextRolled: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
  turnBannerWait: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  turnBannerTextWait: { color: Colors.electricLight, fontSize: 14, fontWeight: '600' },

  diceSection: { alignItems: 'center', paddingVertical: 12 },

  controls: { gap: 10 },
  actionBtn: {
    borderRadius: 14, paddingVertical: 18, alignItems: 'center',
    overflow: 'hidden', position: 'relative',
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 7,
  },
  actionBtnDisabled: { opacity: 0.45 },
  actionBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 1.5 },
  btnShine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  autoEndHint: {
    alignItems: 'center', paddingVertical: 10,
    backgroundColor: 'rgba(90,77,122,0.3)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
  },
  autoEndHintText: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic' },

  logToggle: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgPanel, padding: 14, borderRadius: 12,
    gap: 10, borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)',
  },
  logDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gold },
  latestLog: { flex: 1, color: Colors.goldPale, fontSize: 13 },
  logChevron: { color: Colors.gold, fontSize: 13, fontWeight: '700' },
  logPanel: {
    backgroundColor: Colors.bgPanel, padding: 14, borderRadius: 12, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  logLineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  logBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted, marginTop: 5 },
  logBulletActive: { backgroundColor: Colors.gold },
  logLine: { flex: 1, color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  logLineLatest: { color: Colors.goldLight, fontWeight: '700' },

  // Waiting room
  waitingRoot: { flex: 1, backgroundColor: '#1687ff' },
  waitingSky: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#1687ff',
  },
  waitingSunbeamA: {
    position: 'absolute',
    top: -60,
    right: 58,
    width: 30,
    height: 240,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '28deg' }],
  },
  waitingSunbeamB: {
    position: 'absolute',
    top: -72,
    right: 112,
    width: 20,
    height: 210,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ rotate: '28deg' }],
  },
  waitingCloudA: {
    position: 'absolute',
    top: 48,
    left: 26,
    width: 142,
    height: 54,
    borderRadius: 32,
    backgroundColor: '#fff',
    shadowColor: '#bfdbfe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
  },
  waitingCloudB: {
    position: 'absolute',
    top: 82,
    right: -28,
    width: 138,
    height: 54,
    borderRadius: 32,
    backgroundColor: '#fff',
    shadowColor: '#bfdbfe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
  },
  waitingCloudC: {
    position: 'absolute',
    top: 308,
    left: -20,
    width: 126,
    height: 52,
    borderRadius: 32,
    backgroundColor: '#fff',
    shadowColor: '#bfdbfe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 0,
  },
  waitingBottomCloud: {
    position: 'absolute',
    left: -60,
    right: -60,
    bottom: -58,
    height: 122,
    borderRadius: 80,
    backgroundColor: 'rgba(219,234,254,0.86)',
  },
  waitingScroll: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 28,
  },
  waitingHero: {
    alignItems: 'center',
    minHeight: 170,
    justifyContent: 'center',
  },
  waitingTitle: {
    zIndex: 2,
    color: '#fff',
    fontSize: 50,
    lineHeight: 56,
    fontWeight: '900',
    letterSpacing: 0,
    textShadowColor: '#7e22ce',
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 0,
  },
  waitingTitleShadow: {
    position: 'absolute',
    top: 52,
    color: '#d946ef',
    fontSize: 50,
    lineHeight: 56,
    fontWeight: '900',
    letterSpacing: 0,
  },
  waitingBoardMini: {
    width: 174,
    height: 92,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    borderWidth: 4,
    borderColor: '#fff',
    transform: [{ perspective: 600 }, { rotateX: '56deg' }, { rotateZ: '-5deg' }],
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  waitingMiniTile: {
    position: 'absolute',
    width: 46,
    height: 32,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  waitingMiniTileA: { left: 14, bottom: 12, backgroundColor: '#22c55e' },
  waitingMiniTileB: { right: 16, bottom: 12, backgroundColor: '#ef4444' },
  waitingMiniTileC: { left: 64, top: 14, backgroundColor: '#facc15' },
  waitingMiniDice: {
    position: 'absolute',
    right: 56,
    bottom: -18,
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fde047',
    borderWidth: 3,
    borderColor: '#fff7ad',
  },
  waitingMiniDotA: { position: 'absolute', left: 9, top: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: '#1f2937' },
  waitingMiniDotB: { position: 'absolute', right: 9, top: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: '#1f2937' },
  waitingMiniDotC: { position: 'absolute', left: 19, bottom: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: '#1f2937' },
  codeBox: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.7)',
    gap: 4,
    width: '100%',
    maxWidth: 390,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  codeBoxLabel: { color: '#1d4ed8', fontSize: 11, letterSpacing: 3, fontWeight: '900' },
  codeBoxCode: { color: '#172554', fontSize: 42, lineHeight: 48, fontWeight: '900', letterSpacing: 8 },
  codeBoxHint: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  waitingPlayersHeader: { color: '#fff', fontSize: 13, letterSpacing: 3, fontWeight: '900', marginTop: 4, textShadowColor: '#1d4ed8', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 0 },
  waitingPlayers: { gap: 10, width: '100%', maxWidth: 420 },
  waitingPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 18,
    padding: 12,
    gap: 12,
    borderWidth: 3,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  waitingPlayerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.82)',
  },
  waitingPlayerToken: { fontSize: 22 },
  waitingPlayerName: { flex: 1, fontSize: 16, fontWeight: '900' },
  readyBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  readyText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  waitingPlayerEmpty: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.78)',
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: 15,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  waitingEmptyText: { color: '#eff6ff', fontSize: 13, fontWeight: '800' },
  startBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    maxWidth: 420,
    marginTop: 8,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.82)',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.42,
    shadowRadius: 0,
  },
  startBtnDisabled: { backgroundColor: '#facc15', shadowColor: '#ca8a04', opacity: 0.82 },
  startBtnText: { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.24)', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 0 },
  waitingHintBox: {
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18, padding: 14, marginTop: 8,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.72)', width: '100%', maxWidth: 420,
  },
  waitingHint: { color: '#1d4ed8', fontSize: 14, fontWeight: '900', textAlign: 'center' },

  // Card modal
  cardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 30,
    overflow: 'hidden',
  },
  cardModalBackdropBoard: {
    position: 'absolute',
    left: '-12%',
    right: '-12%',
    bottom: '-10%',
    height: '58%',
    borderRadius: 34,
    backgroundColor: 'rgba(246,230,161,0.34)',
    borderWidth: 9,
    borderColor: 'rgba(255,247,237,0.36)',
    transform: [{ perspective: 900 }, { rotateX: '54deg' }, { rotateZ: '-11deg' }],
  },
  cardModalSparkles: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  cardModalSparkle: {
    position: 'absolute',
    color: '#fff7ad',
    fontSize: 28,
    textShadowColor: '#fef08a',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  cardModalSparkleA: { top: '30%', left: '18%' },
  cardModalSparkleB: { top: '43%', right: '16%', fontSize: 34 },
  cardModalSparkleC: { bottom: '24%', left: '48%', fontSize: 24 },
  cardRibbon: {
    position: 'absolute',
    top: 72,
    width: 360,
    maxWidth: '86%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  cardRibbonMain: {
    minWidth: 220,
    height: 66,
    borderRadius: 8,
    backgroundColor: '#ef2b19',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#991b1b',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    transform: [{ rotate: '-2deg' }],
  },
  cardRibbonWingLeft: {
    position: 'absolute',
    left: 8,
    top: 54,
    width: 98,
    height: 38,
    borderRadius: 5,
    backgroundColor: '#b91c1c',
    transform: [{ rotate: '-13deg' }],
  },
  cardRibbonWingRight: {
    position: 'absolute',
    right: 8,
    top: 54,
    width: 98,
    height: 38,
    borderRadius: 5,
    backgroundColor: '#b91c1c',
    transform: [{ rotate: '13deg' }],
  },
  cardRibbonText: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: '#7f1d1d',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  cardModal: {
    marginTop: 80,
    borderRadius: 16,
    maxWidth: 720,
    width: '92%',
    minHeight: 260,
    backgroundColor: '#fffaf0',
    borderWidth: 4,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 28,
    elevation: 26,
    zIndex: 3,
  },
  cardModalGlow: {
    position: 'absolute',
    left: -18,
    right: -18,
    top: -18,
    bottom: -18,
  },
  cardModalHeader: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120,53,15,0.14)',
  },
  cardModalTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cardModalBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  cardMascot: {
    width: 160,
    height: 150,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(120,53,15,0.18)',
  },
  cardMascotHat: { fontSize: 56, marginBottom: -4 },
  cardMascotFace: { fontSize: 54 },
  cardModalCopy: {
    flex: 1,
    alignItems: 'flex-start',
  },
  cardActionLabel: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardActionAmount: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.14)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 0,
  },
  cardModalText: {
    marginTop: 10,
    fontSize: 18,
    color: '#1c1917',
    lineHeight: 26,
    fontWeight: '800',
  },
  cardModalPlayer: {
    marginTop: 14,
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardModalClose: {
    marginTop: 18,
    minWidth: 122,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(7,5,16,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    zIndex: 5,
  },
  cardModalCloseText: {
    color: '#fff7ed',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Confirmation modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,4,21,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 22,
    gap: 12,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 18,
  },
  confirmEyebrow: {
    color: Colors.danger,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  confirmTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
  },
  confirmMessage: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  confirmEndBtn: {
    backgroundColor: Colors.danger,
  },
  confirmCancelText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  confirmEndText: {
    color: Colors.bgDark,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Game over
  gameOverOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(6,4,21,0.96)',
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  trophy: { fontSize: 80 },
  gameOverTitle: {
    color: Colors.goldLight, fontSize: 38, fontWeight: '900', letterSpacing: 4,
    textShadowColor: Colors.gold, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  gameOverWinner: { color: Colors.textPrimary, fontSize: 26, fontWeight: '800' },
  gameOverSub: { color: Colors.gold, fontSize: 16, letterSpacing: 3, fontWeight: '700' },
  gameOverMoney: { color: Colors.success, fontSize: 22, fontWeight: '800', marginTop: 4 },
  gameOverBtn: {
    backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 40, marginTop: 24,
    overflow: 'hidden', position: 'relative',
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  gameOverBtnText: { color: Colors.bgDark, fontWeight: '800', fontSize: 15, letterSpacing: 2 },

  // End game button
  endGameRow: {
    alignItems: 'center', paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
    backgroundColor: 'rgba(248,113,113,0.07)',
  },
  endGameText: { color: Colors.danger, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },

  // Game over leaderboard
  gameOverScroll: {
    alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20, gap: 14,
  },
  summaryTable: {
    width: '100%', maxWidth: 400, gap: 8, marginTop: 8,
  },
  summaryHeader: {
    color: Colors.gold, fontSize: 11, letterSpacing: 3, fontWeight: '800',
    textAlign: 'center', marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, padding: 12, gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryRowBankrupt: { opacity: 0.45 },
  summaryRank: { fontSize: 22, width: 30, textAlign: 'center' },
  summaryColorDot: { width: 10, height: 10, borderRadius: 5 },
  summaryInfo: { flex: 1 },
  summaryName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  summaryNameBankrupt: { color: Colors.textMuted },
  summarySub: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  summaryTotal: { color: Colors.success, fontSize: 14, fontWeight: '800' },
  summaryTotalBankrupt: { color: Colors.textMuted },
});
