# Changelog — Little Business Frontend Sync

All changes made to align the React Native frontend with the refactored Spring Boot backend.

---

## [2026-05-11] Little Business Sync

### Task 1 — Board layout (`constants/board.ts`)

**What changed:** Complete replacement of the 36-tile board with the new "Little Business" layout.

**Why:** The backend refactored from classic Monopoly to the Indian "Little Business" variant. Corners changed:
- `GO` (₹2k) → `START` (₹1,500) at position 0
- `Jail` stays as `JAIL` but moved from position 9 → position 8
- `Free Parking` → `CLUB` (pay ₹1,500) at position 17
- `Go To Jail` → `REST_HOUSE` (safe space) at position 26

Property color groups trimmed from 8 to 4:
- Removed: brown, lightblue, pink, orange, darkblue
- Kept/renamed: `red` (Cochin, Shimla, Ladakh, Darjeeling, Chandigarh), `yellow` (Hyderabad, Goa, Amritsar, Bangalore, Chennai), `green` (Pune, Kolkata, Ahmedabad, Delhi, Mumbai), `blue` (Patna, Indore, Jaipur, Kanpur, Agra)

Transports replaced 4 railways with: Roadways, Railways, Waterways, Airways (different prices). Utilities renamed: `Electricity` (was "Electric Co."), `Internet` (was "Water Works"). Tax renamed: `Wealth Tax` (was "Luxury Tax").

`BoardSpace` type updated: removed `'go' | 'railroad' | 'gotojail' | 'freeparking'`, added `'start' | 'transport' | 'club' | 'rest_house'`.

`getGridPos` and `getSide` updated for new corner positions (0/8/17/26 instead of 0/9/18/27).

---

### Task 2 — Theme (`constants/theme.ts`)

**What changed:**
- `Colors.prop` trimmed from 8 color groups to 4: `red`, `yellow`, `green`, `blue`
- Added `TILE_ICONS` record mapping city/transport/utility names to landmark emojis
- `CITY_PHOTOS` updated: removed old cities (Lucknow, Surat, Nagpur, Mumbai W/C/E, Delhi N/S/E, Mysore, Bhopal, Manali), added new ones (Cochin, Patna, Delhi, Mumbai, Agra, Chandigarh, Ladakh, Darjeeling, Goa, Amritsar)

**Why:** Board uses only 4 property colors now. `TILE_ICONS` is needed by Board.tsx and PropertyModal.tsx to show correct emoji for transport and utility tiles (instead of hardcoded fallbacks keyed by tile ID).

---

### Task 3 — Board component (`components/Board.tsx`)

**What changed:**
- Import `TILE_ICONS` from theme
- `CornerContent` config updated: `go/freeparking/gotojail` → `start/club/rest_house`; corner labels and sub-labels reflect new rules (START +₹1,500, CLUB Pay₹1.5k, REST HOUSE)
- `getIcon()` updated: removed `railroad` case, combined `transport` + `utility` to look up `TILE_ICONS[space.name]`

**Why:** The old corner types (`go`, `gotojail`, `freeparking`) no longer exist in the `BoardSpace` type. Transport tiles now have descriptive names instead of a fixed railway icon.

---

### Task 3b — PropertyModal (`components/PropertyModal.tsx`)

**What changed:**
- `RailroadDetails` → `TransportDetails` — shows price from `space.price` (each transport has a different price), lists 4 rent tiers, and lists all 4 transport names
- `UtilityDetails` — now accepts `space` prop to show the correct price (Electricity ₹3,500, Internet ₹6,000)
- `CornerDetails` — updated text map from `go/jail/gotojail/freeparking` → `start/jail/club/rest_house`
- `TaxDetails` — "luxury tax" → "wealth tax" in description
- `getSubtitle()` — removed `railroad`, added `transport`, `start`, `club`, `rest_house`
- `getDefaultEmoji()` — removed `go/gotojail/freeparking/railroad`, added `start/club/rest_house/transport` (keyed by name)

**Why:** All old type strings from the `BoardSpace` union were removed; using them caused TypeScript errors and wrong UI labels.

---

### Task 4 — Session persistence (`store/gameStore.ts` + `app/index.tsx`)

**What changed:**
- `store/gameStore.ts`: imported `AsyncStorage`; `setSession` now fire-and-forgets `AsyncStorage.setItem`; added `clearSession()` (async, removes both keys, clears gameState); added `loadSession()` (async, reads both keys, returns `{playerId, roomId}`)
- Added `PlayerSummary` interface and `finalSummaries?: PlayerSummary[]` / `endReason?: 'BANKRUPTCY' | 'MANUAL'` to `GameState`
- `app/index.tsx`: added `useEffect` on mount that calls `loadSession()` — if a session exists, attempts `GET /rooms/:roomId/rejoin/:playerId`; on success navigates back to the game; on failure calls `clearSession()`

**Why:** Without this, refreshing the browser or restarting the app loses the player's identity and they can't get back into an active game. The rejoin endpoint was already implemented in the backend.

---

### Task 5 — End game socket action (`services/socket.ts`)

**What changed:** Added `sendEndGame(roomId, playerId)` that publishes to `/app/room.${roomId}.endGame`.

**Why:** The backend added a `/endGame` handler that computes final standings and broadcasts `FINISHED` state with `finalSummaries`. The frontend needed a way to trigger it.

---

### Task 6 — End-game UI (`app/game/[roomId].tsx`)

**What changed:**
- Added `handleEndGame` — shows `Alert.alert` confirmation before calling `sendEndGame`
- Added a small "⛔ End Game" button always visible at the bottom of the game scroll area when `status === 'PLAYING'`
- `GameOverModal` completely rewritten:
  - No longer takes `winner` as a prop; reads `useGameStore()` directly
  - If `finalSummaries` present: shows ranked leaderboard with medal badges (🥇🥈🥉), player color dot, cash + property value breakdown, total worth; bankrupt players are grayed out
  - Falls back to simple winner display if `finalSummaries` is absent (older server)
  - "Back to Lobby" button calls `clearSession()` before navigating to `/`
- New styles: `endGameRow`, `endGameText`, `gameOverScroll`, `summaryTable`, `summaryHeader`, `summaryRow`, `summaryRowBankrupt`, `summaryRank`, `summaryColorDot`, `summaryInfo`, `summaryName`, `summaryNameBankrupt`, `summarySub`, `summaryTotal`, `summaryTotalBankrupt`

**Why:** The old game-over screen only showed the winner's name and money. With the new `finalSummaries` payload from the backend, we can show a full ranked leaderboard. The "End Game" button lets any player trigger a graceful game end (e.g., when everyone agrees the game is decided).

---

### Task 7 — Rules screen (`constants/rules.ts`)

**What changed:**
- "When you pass GO, collect ₹2,000" → "When you pass START, collect ₹1,500"
- Removed "Free Parking" section, added "CLUB" section (pay ₹1,500)
- Added "REST HOUSE" section (safe space)
- "Railways" → "Transports" (Roadways/Railways/Waterways/Airways)
- "Luxury Tax" → "Wealth Tax"
- Chance card examples updated to Indian-themed cards
- Jail: removed "landing on Go To Jail" trigger (no longer a corner)

**Why:** The rules text was still describing classic Monopoly rules. Players reading them in-game would see contradictions with actual game behavior.

---

## Dependencies added

```
@react-native-async-storage/async-storage  (SDK 54 compatible)
```

Install: `npx expo install @react-native-async-storage/async-storage`
