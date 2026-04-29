# 🇮🇳 Indian Business — Multiplayer Property Trading Game

A real-time multiplayer Monopoly-style game themed around Indian cities, built with **React Native / Expo** (client) and **Spring Boot** (server). Play with up to 4 friends on iOS, Android, or the web.

---

## Screens

### Lobby
```
┌──────────────────────────────────────┐
│  ✦ THE INDIAN ✦                      │
│     BUSINESS                         │
│  Property Trading Game               │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Enter your name               │  │
│  │  [___________________________] │  │
│  │                                │  │
│  │  Room Code (optional)          │  │
│  │  [___________________________] │  │
│  │                                │  │
│  │  [  🎲  CREATE ROOM  ]         │  │
│  │  [  🚪  JOIN ROOM    ]         │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Game Board (36-tile, 10×10 grid)
```
┌───┬──┬──┬──┬──┬──┬──┬──┬──┬───┐
│GTJ│  │  │  │  │  │  │  │  │FP │  ← Top row (Delhi → Free Parking)
├───┤  │                 │  ├───┤
│   │                       │   │
│   │                       │   │  ← Right col (Manali, Shimla …)
│   │ THE INDIAN BUSINESS   │   │
│   │                       │   │
│   │ Property Trading Game |   │  ← Left col (Surat, Kanpur …)
│   │                       │   │
│   │                       │   │
├───┤                       ├───┤
│JL │  │  │  │  │  │  │  │  │ GO│  ← Bottom row (Kolkata → GO)
└───┴──┴──┴──┴──┴──┴──┴──┴──┴───┘
  FP = Free Parking   GTJ = Go To Jail   JL = Jail
```

### Screens at a glance

| Screen | Description |
|--------|-------------|
| **Lobby** | Create or join a room; animated floating dice + pulsing orbs in background |
| **Waiting Room** | Shows joined players; host starts game |
| **Game Board** | 36-tile board with colour-coded properties, animated chess-pawn tokens, real-dot 3D dice |
| **Property Modal** | Bottom-sheet with landmark scene header, rent table, buy/build buttons |
| **Rules** | Full rulebook with expandable sections |

---

## Features

- **Real-time multiplayer** — up to 4 players via WebSocket (STOMP)
- **Animated dice** — real dot faces (no emoji), 3D surface shading, vigorous shake animation
- **Step-by-step pawn movement** — token hops tile-by-tile after dice stop; buy popup appears only after pawn arrives
- **Chess-pawn tokens** — 3D specular highlight + bevel borders, coloured drop shadow per player
- **Destination scene headers** — property modal shows a 148 px scene banner (landmark emoji + ambient scene elements + landmark name pill)
- **Auto turn-end** — turn ends automatically after movement + any buy/skip action; no "End Turn" button needed
- **Property system** — buy, build houses → hotels, pay rent, collect color-set bonuses
- **Jail mechanics** — Go To Jail space, 3-doubles rule, bail payment, doubles escape
- **Chance & Community Chest** — random card draws with log messages
- **Bankruptcy & winner detection** — player eliminated when money hits 0; last player standing wins
- **Animated player cards** — pulse + glow on active turn, money flash on gain/loss
- **Rules page** — full rulebook viewable in-game

---

## Tech Stack

### Client
| | |
|---|---|
| Framework | React Native 0.81.5 + Expo 54 |
| Language | TypeScript 5.9 |
| Navigation | expo-router 6 |
| State | Zustand 5 |
| WebSocket | @stomp/stompjs 7 |
| Platforms | iOS · Android · Web (mweb) |

### Server
| | |
|---|---|
| Framework | Spring Boot 3.5 |
| Language | Java 17 |
| Transport | WebSocket + STOMP |
| State | In-memory (`ConcurrentHashMap`) |

---

## Project Structure

```
monopoly-game-client/
├── app/
│   ├── _layout.tsx          # Root layout, SafeAreaProvider
│   ├── index.tsx            # Lobby screen (create / join room)
│   ├── rules.tsx            # In-game rulebook
│   └── game/
│       └── [roomId].tsx     # Main game screen
│
├── components/
│   ├── AnimatedDice.tsx     # 3D dice with real dot faces + shake animation
│   ├── Board.tsx            # 36-tile board, pawn animation, centre panel
│   ├── PlayerCard.tsx       # Animated player money/status cards
│   └── PropertyModal.tsx    # Bottom-sheet property detail + buy/build actions
│
├── constants/
│   ├── board.ts             # 36 board spaces, getGridPos(), getSide()
│   ├── theme.ts             # Colours, city landmark + scene data
│   └── rules.ts             # Full game rules content
│
├── store/
│   └── gameStore.ts         # Zustand game state store
│
└── services/
    └── socket.ts            # STOMP WebSocket client + action senders
```

---

## Board Layout

36 tiles · 4 corners · 8 non-corner tiles per side

| Corner | Position | Corner | Position |
|--------|----------|--------|----------|
| GO (collect ₹2k) | 0 | Free Parking | 18 |
| Jail (visiting) | 9 | Go To Jail | 27 |

**Property colour groups**

| Colour | Cities | Price range |
|--------|--------|-------------|
| 🟫 Brown | Pune, Bangalore | ₹600 |
| 🔵 Light Blue | Chennai, Hyderabad, Kolkata | ₹1,000 – ₹1,200 |
| 🩷 Pink | Ahmedabad, Jaipur, Lucknow | ₹1,400 – ₹1,600 |
| 🟠 Orange | Surat, Kanpur, Nagpur | ₹1,800 – ₹2,000 |
| 🔴 Red | Mumbai (W/C/E) | ₹2,200 – ₹2,400 |
| 🟡 Yellow | Delhi (N/S/E) | ₹2,600 – ₹2,800 |
| 🟢 Green | Mysore, Bhopal, Indore | ₹3,000 – ₹3,200 |
| 🔷 Dark Blue | Shimla, Manali | ₹3,500 – ₹4,000 |

**Special tiles** — 4 Railways (₹2k), 2 Utilities (₹1.5k), 2 Tax spaces, 2 Chance, 0 Community Chest (removed to fit 8-per-side)

---

## Getting Started

### Prerequisites
- Node.js 18+
- Java 17+
- Expo CLI — `npm install -g expo-cli`

### 1 — Start the backend

```bash
cd monopoly-game
./mvnw spring-boot:run
# Server starts on http://localhost:8080
# WebSocket endpoint: ws://localhost:8080/ws
```

### 2 — Configure the WebSocket URL

Edit `services/socket.ts` and point `brokerURL` to your server:

```ts
// For local dev on a physical device, use your machine's LAN IP
brokerURL: 'ws://192.168.x.x:8080/ws'

// For emulator / web
brokerURL: 'ws://localhost:8080/ws'
```

### 3 — Start the client

```bash
cd monopoly-game-client
npm install
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) or press `w` to open in the browser.

---

## Game Flow

```
Lobby → Create / Join Room
       ↓
Waiting Room (2–4 players, host starts)
       ↓
Game Loop:
  Roll Dice  →  [dice spin ~1.7s]
             →  [dice show result, 0.7s pause]
             →  [pawn hops tile-by-tile, ~550ms/tile]
             →  Land on property?
                  ├── Unowned → Buy / Skip popup
                  ├── Owned   → Pay rent automatically
                  └── Special → Tax / Chance / Jail handled
             →  Turn ends automatically
       ↓
Last player with money wins 🏆
```

---

## Animation Timing Reference

| Event | Duration |
|-------|----------|
| Dice spin | ~1,700 ms |
| Pause after dice stop | 700 ms |
| Pawn hop per tile | 550 ms |
| Max pawn travel (12 tiles) | ~6.6 s |
| Auto-end turn delay | 2,500 ms after movement |

---

## Adding Screenshots

Place screenshots in `assets/screenshots/` and reference them here:

```
assets/screenshots/
├── lobby.png
├── game-board.png
├── property-modal.png
└── waiting-room.png
```

```md
![Lobby](assets/screenshots/lobby.png)
![Game Board](assets/screenshots/game-board.png)
![Property Modal](assets/screenshots/property-modal.png)
```

---

## Contributing

1. Fork the repo
2. Create a feature branch — `git checkout -b feat/your-feature`
3. Commit your changes
4. Open a pull request

---

## License

MIT
