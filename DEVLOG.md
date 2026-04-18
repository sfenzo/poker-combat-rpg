# Poker Combat RPG — Development Log

## Project Overview

**Genre:** Poker / Strategy RPG  
**Platform:** iOS + Android (React Native + Expo)  
**Tech Stack:** Expo SDK 54 · React Native 0.81.5 · TypeScript · Zustand v5  
**Node version:** 24.15.0  
**Architecture:** New Architecture enabled (`newArchEnabled: true`)

---

## Phase 1 — Battle Screen Prototype ✅ COMPLETE

**Date:** 2026-04-18  
**Status:** All 15 checklist items passing · Bundle builds clean · Running on web

### What Was Built

| File | Purpose |
|------|---------|
| `src/constants/gameConstants.ts` | Card types, Suit/Rank enums, deck creation, shuffle, `PLACEMENT_PAIRS`, `getOppositeCell`, `getHandCells` |
| `src/game/damageTable.ts` | `HandName` type, `HAND_DISPLAY_NAMES`, `HAND_RANK`, `DEFAULT_DAMAGE_TABLE` |
| `src/game/handEvaluator.ts` | Full poker hand evaluator — all 11 hand types, Joker brute-force substitution |
| `src/game/aiLogic.ts` | Enemy AI — scans all valid placement pairs, picks highest-damage move |
| `src/state/gameStore.ts` | Zustand store — full battle state + `initBattle`, `toggleSelectCard`, `placeAtCell`, `playerPass`, `dismissHandResult`, `runEnemyTurn`, `startNewRound` |
| `src/components/Card.tsx` | Card display — default / selected / highlighted / facedown / joker states |
| `src/components/BattleBoard.tsx` | 5×5 grid · center 3×3 · valid placement highlighting · PASS + WILD buttons |
| `src/components/EnemyArea.tsx` | Enemy HP bar (animated) · armor · face-down hand · portrait |
| `src/components/PlayerArea.tsx` | Player HP bar (animated) · armor · wild charge meter · tappable hand cards |
| `src/components/HandResultBanner.tsx` | Hand name overlay (auto-dismisses after 1.8s) |
| `src/components/HandArea.tsx` | Stub file (GDD folder structure requirement) |
| `src/screens/BattleScreen.tsx` | Main screen — composes all components, handles enemy AI timer |
| `App.tsx` | Root — `GestureHandlerRootView` wrapping `BattleScreen` |

### Core Game Logic

#### The 5×5 Grid
- 25 cells in a 5-column flex-wrap layout
- **Center 3×3** (rows 1–3, cols 1–3): dealt at round start, shared by both players
- **16 outer cells**: valid placement endpoints for player/enemy hands
- Background: `#5C6B30` (felt green) · center: `#6B7C3A` (lighter green)

#### Valid Hand Directions
```
HORIZONTAL:  [row,0] ↔ [row,4]   for row ∈ {1,2,3}
VERTICAL:    [0,col] ↔ [4,col]   for col ∈ {1,2,3}
DIAGONAL TL-BR: [0,0] ↔ [4,4]
DIAGONAL TR-BL: [0,4] ↔ [4,0]
```
Each hand = 2 placed cards + 3 center cards between them = 5-card poker hand.

#### Placement UX (tap-based)
1. Tap a card in hand → selected (gold border, card lifts up)
2. Green dots appear on all valid empty endpoints with an empty opposite
3. Tap a board cell → card placed, only the opposite cell stays highlighted
4. Tap second card → auto-placed at the opposite cell → hand evaluated

#### Hand Evaluator
- Handles all 11 hand types: High Card → Five of a Kind
- **Joker substitution**: brute-forces all 52 rank×suit combos (1 joker) or 2704 combos (2 jokers) to find the best possible hand
- Ace plays high (A-K-Q-J-10) **and** low (A-2-3-4-5 wheel straight)
- Royal Flush = 10-J-Q-K-A same suit (wheel excluded)

#### Turn Flow
```
Player places cards
  → handResult banner (1.8s)
  → dismiss → enemyTurn (SAME turn number)
  → AI thinks (1.2s delay)
  → AI places cards
  → handResult banner (1.8s)
  → dismiss → playerTurn, turn+1
```
After Turn 10: `startNewRound()` — fresh 5×5 grid, new center deal, new player + enemy hands. HP carries over.

#### PASS mechanic
Player taps PASS → draws 4 new cards → enemy takes their turn.  
Enemy AI returns `null` when no valid move exists → auto-pass → draws new hand → turn increments.

#### Enemy AI
Scans all 8 placement pairs × all hand-card pairs → picks the move with highest damage.  
1.2s artificial delay before placing cards.

#### Damage Table (DEFAULT)
| Hand | Damage |
|------|--------|
| High Card | 0 (invalid play) |
| One Pair | 1 |
| Two Pair | 1 |
| Three of a Kind | 1 |
| Straight | 2 |
| Flush | 2 |
| Full House | 3 |
| Four of a Kind | 3 |
| Straight Flush | 4 |
| Royal Flush | 4 |
| Five of a Kind | 4 |

#### HP Bars
Animated with React Native `Animated.timing` (400ms ease, `useNativeDriver: false`).

### Prototype Enemies
| Enemy | HP | Armor |
|-------|----|-------|
| ULFR PUP | 5 | 0 |
| ULFR | 10 | 0 |
| MAULER BEAR | 8 | 0 |

### Bug Found & Fixed During Build
**`getHandCells` diagonal detection** — both diagonals produced `minRow=0, minCol=0` (indistinguishable). Fixed by checking `row1 === col1` to identify TL-BR vs TR-BL diagonal.

### Testing Checklist Results
- [x] 5×5 grid renders correctly
- [x] Center 3×3 cards dealt face-up at battle start
- [x] Player can select 2 cards from hand
- [x] Valid placement positions highlight when card selected
- [x] Placing cards on opposite sides evaluates correct 5-card hand
- [x] Hand name banner displays correctly
- [x] Correct damage applied to enemy HP
- [x] HP bar animates on damage
- [x] Enemy AI places cards and deals damage back
- [x] Turn counter increments correctly
- [x] PASS button works — player receives 4 new cards
- [x] After 10 turns, Round 2 begins with fresh grid
- [x] Victory triggers when enemy HP reaches 0
- [x] Defeat triggers when player HP reaches 0
- [x] Joker in hand evaluates correctly as wild card

---

## To Run

```bash
cd PokerCombatRPG
npx expo start          # scan QR with Expo Go app
npx expo start --web    # browser preview at localhost:8081
```

---

## Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Battle Screen Prototype | ✅ Complete |
| 2 | Victory / Defeat / Reward screens | ⬜ Next |
| 3 | Overworld map | ⬜ Pending |
| 4 | Health, Energy & Currencies | ⬜ Pending |
| 5 | Wild Card Ability | ⬜ Pending |
| 6 | Main Menu & Navigation | ⬜ Pending |

---

## Dependencies

```json
{
  "expo": "~54.0.33",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "zustand": "^5.0.12"
}
```
