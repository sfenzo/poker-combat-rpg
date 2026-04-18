import { create } from 'zustand';
import {
  Card,
  createDeck,
  shuffleDeck,
  drawCards,
  CENTER_CELLS,
  PLACEMENT_PAIRS,
  getOppositeCell,
  getHandCells,
} from '../constants/gameConstants';
import { DamageTable, DEFAULT_DAMAGE_TABLE } from '../game/damageTable';
import { evaluateHand, isValidPlay, EvaluatedHand } from '../game/handEvaluator';
import { findBestAiMove, hasAnyValidMove, GridCell, AiMove } from '../game/aiLogic';

export interface Enemy {
  id: string;
  name: string;
  maxHP: number;
  currentHP: number;
  armor: number;
  handCardCount: number;
  damageTable: DamageTable;
  ability: string | null;
}

export interface HandResult {
  handName: string;
  handDisplayName: string;
  damage: number;
  cells: Array<[number, number]>;
  isPlayerHand: boolean;
}

export type GamePhase =
  | 'dealing'
  | 'playerTurn'
  | 'enemyTurn'
  | 'handResult'
  | 'victory'
  | 'defeat';

export interface BattleState {
  grid: GridCell[][];
  gridOwner: ('player' | 'enemy' | 'center' | null)[][];

  playerHand: Card[];
  enemyHand: Card[];
  drawPile: Card[];

  playerHP: number;
  playerMaxHP: number;
  playerArmor: number;
  enemyHP: number;
  enemyMaxHP: number;
  enemyArmor: number;

  currentRound: number;
  currentTurn: number;
  maxTurnsPerRound: number;
  isPlayerTurn: boolean;

  wildCharge: number;
  wildReady: boolean;

  selectedCards: Card[];
  pendingPlacement: { card: Card; row: number; col: number } | null;

  lastHandResult: HandResult | null;
  phase: GamePhase;
  currentEnemy: Enemy;
}

interface BattleActions {
  initBattle: (enemy: Enemy) => void;
  toggleSelectCard: (card: Card) => void;
  placeAtCell: (row: number, col: number) => void;
  playerPass: () => void;
  dismissHandResult: () => void;
  runEnemyTurn: () => void;
  startNewRound: () => void;
}

function makeEmptyGrid(): GridCell[][] {
  return Array.from({ length: 5 }, () => Array(5).fill(null));
}

function makeEmptyOwner(): ('player' | 'enemy' | 'center' | null)[][] {
  return Array.from({ length: 5 }, () => Array(5).fill(null));
}

function dealCenterCards(
  deck: Card[],
): { grid: GridCell[][]; owner: ('player' | 'enemy' | 'center' | null)[][]; remaining: Card[] } {
  const grid = makeEmptyGrid();
  const owner = makeEmptyOwner();
  let remaining = [...deck];

  let idx = 0;
  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= 3; c++) {
      const key = `${r},${c}`;
      if (CENTER_CELLS.has(key)) {
        grid[r][c] = remaining[idx++];
        owner[r][c] = 'center';
      }
    }
  }
  return { grid, owner, remaining: remaining.slice(9) };
}

export const PROTOTYPE_ENEMIES: Enemy[] = [
  {
    id: 'ulfr_pup',
    name: 'ULFR PUP',
    maxHP: 5,
    currentHP: 5,
    armor: 0,
    handCardCount: 4,
    damageTable: DEFAULT_DAMAGE_TABLE,
    ability: null,
  },
  {
    id: 'ulfr',
    name: 'ULFR',
    maxHP: 10,
    currentHP: 10,
    armor: 0,
    handCardCount: 4,
    damageTable: DEFAULT_DAMAGE_TABLE,
    ability: null,
  },
  {
    id: 'mauler_bear',
    name: 'MAULER BEAR',
    maxHP: 8,
    currentHP: 8,
    armor: 0,
    handCardCount: 4,
    damageTable: DEFAULT_DAMAGE_TABLE,
    ability: null,
  },
];

function applyDamage(hp: number, armor: number, damage: number): { hp: number; armor: number } {
  const absorbed = Math.min(armor, damage);
  return { hp: Math.max(0, hp - (damage - absorbed)), armor: Math.max(0, armor - absorbed) };
}

export const useGameStore = create<BattleState & BattleActions>((set, get) => ({
  grid: makeEmptyGrid(),
  gridOwner: makeEmptyOwner(),
  playerHand: [],
  enemyHand: [],
  drawPile: [],
  playerHP: 24,
  playerMaxHP: 24,
  playerArmor: 0,
  enemyHP: 5,
  enemyMaxHP: 5,
  enemyArmor: 0,
  currentRound: 1,
  currentTurn: 1,
  maxTurnsPerRound: 10,
  isPlayerTurn: true,
  wildCharge: 0,
  wildReady: false,
  selectedCards: [],
  pendingPlacement: null,
  lastHandResult: null,
  phase: 'dealing',
  currentEnemy: PROTOTYPE_ENEMIES[0],

  initBattle: (enemy) => {
    const deck = shuffleDeck(createDeck());
    const { grid, owner, remaining } = dealCenterCards(deck);
    const { drawn: playerHand, remaining: r2 } = drawCards(remaining, 4);
    const { drawn: enemyHand, remaining: drawPile } = drawCards(r2, enemy.handCardCount);

    set({
      grid,
      gridOwner: owner,
      playerHand,
      enemyHand,
      drawPile,
      playerHP: 24,
      playerMaxHP: 24,
      playerArmor: 0,
      enemyHP: enemy.maxHP,
      enemyMaxHP: enemy.maxHP,
      enemyArmor: enemy.armor,
      currentRound: 1,
      currentTurn: 1,
      isPlayerTurn: true,
      wildCharge: 0,
      wildReady: false,
      selectedCards: [],
      pendingPlacement: null,
      lastHandResult: null,
      phase: 'playerTurn',
      currentEnemy: { ...enemy },
    });
  },

  toggleSelectCard: (card) => {
    const { phase, selectedCards, pendingPlacement } = get();
    if (phase !== 'playerTurn') return;

    // If we have a pending placement (first card already placed), select the second card
    if (pendingPlacement) {
      // Select a card to place at the opposite cell
      const { grid, gridOwner, drawPile, playerHand, currentEnemy } = get();
      const opp = getOppositeCell(pendingPlacement.row, pendingPlacement.col);
      if (!opp) return;
      const [or, oc] = opp;

      // Place both cards
      const newGrid = grid.map(r => [...r]);
      const newOwner = gridOwner.map(r => [...r]);
      newGrid[pendingPlacement.row][pendingPlacement.col] = pendingPlacement.card;
      newOwner[pendingPlacement.row][pendingPlacement.col] = 'player';
      newGrid[or][oc] = card;
      newOwner[or][oc] = 'player';

      // Evaluate hand
      const cells = getHandCells(pendingPlacement.row, pendingPlacement.col, or, oc);
      const fiveCards = cells.map(([r, c]) => newGrid[r][c]).filter(Boolean) as Card[];

      if (fiveCards.length !== 5) return;

      const result = evaluateHand(fiveCards, currentEnemy.damageTable);

      if (!isValidPlay(result)) {
        // Invalid — undo pending placement, reset
        set({ pendingPlacement: null, selectedCards: [] });
        return;
      }

      // Valid — remove both cards from hand
      const newHand = playerHand.filter(c => c.id !== pendingPlacement.card.id && c.id !== card.id);

      // Apply damage
      const { hp: newEnemyHP, armor: newEnemyArmor } = applyDamage(
        get().enemyHP, get().enemyArmor, result.damage
      );

      const newWildCharge = Math.min(100, get().wildCharge + 25);

      const handResult: HandResult = {
        handName: result.handName,
        handDisplayName: result.handDisplayName,
        damage: result.damage,
        cells,
        isPlayerHand: true,
      };

      if (newEnemyHP <= 0) {
        set({
          grid: newGrid,
          gridOwner: newOwner,
          playerHand: newHand,
          enemyHP: 0,
          enemyArmor: newEnemyArmor,
          wildCharge: newWildCharge,
          wildReady: newWildCharge >= 100,
          selectedCards: [],
          pendingPlacement: null,
          lastHandResult: handResult,
          phase: 'victory',
        });
        return;
      }

      set({
        grid: newGrid,
        gridOwner: newOwner,
        playerHand: newHand,
        enemyHP: newEnemyHP,
        enemyArmor: newEnemyArmor,
        wildCharge: newWildCharge,
        wildReady: newWildCharge >= 100,
        selectedCards: [],
        pendingPlacement: null,
        lastHandResult: handResult,
        phase: 'handResult',
      });
      return;
    }

    // No pending placement — selecting cards for placement
    const alreadySelected = selectedCards.find(c => c.id === card.id);
    if (alreadySelected) {
      set({ selectedCards: selectedCards.filter(c => c.id !== card.id) });
    } else if (selectedCards.length < 2) {
      set({ selectedCards: [...selectedCards, card] });
    } else {
      // Replace the first selected card
      set({ selectedCards: [selectedCards[1], card] });
    }
  },

  placeAtCell: (row, col) => {
    const { phase, grid, gridOwner, selectedCards, pendingPlacement, playerHand, currentEnemy } = get();
    if (phase !== 'playerTurn') return;

    if (grid[row][col] !== null) return; // cell occupied

    if (pendingPlacement) {
      // Second placement — must be the opposite cell
      const opp = getOppositeCell(pendingPlacement.row, pendingPlacement.col);
      if (!opp || opp[0] !== row || opp[1] !== col) return;

      // Place the pending card + whichever card is selected second
      const secondCard = selectedCards[0];
      if (!secondCard) return;

      const newGrid = grid.map(r => [...r]);
      const newOwner = gridOwner.map(r => [...r]);
      newGrid[pendingPlacement.row][pendingPlacement.col] = pendingPlacement.card;
      newOwner[pendingPlacement.row][pendingPlacement.col] = 'player';
      newGrid[row][col] = secondCard;
      newOwner[row][col] = 'player';

      const cells = getHandCells(pendingPlacement.row, pendingPlacement.col, row, col);
      const fiveCards = cells.map(([r, c]) => newGrid[r][c]).filter(Boolean) as Card[];

      if (fiveCards.length !== 5) { set({ pendingPlacement: null, selectedCards: [] }); return; }

      const result = evaluateHand(fiveCards, currentEnemy.damageTable);
      if (!isValidPlay(result)) { set({ pendingPlacement: null, selectedCards: [] }); return; }

      const newHand = playerHand.filter(c => c.id !== pendingPlacement.card.id && c.id !== secondCard.id);
      const { hp: newEnemyHP, armor: newEnemyArmor } = applyDamage(get().enemyHP, get().enemyArmor, result.damage);
      const newWildCharge = Math.min(100, get().wildCharge + 25);
      const handResult: HandResult = { handName: result.handName, handDisplayName: result.handDisplayName, damage: result.damage, cells, isPlayerHand: true };

      if (newEnemyHP <= 0) {
        set({ grid: newGrid, gridOwner: newOwner, playerHand: newHand, enemyHP: 0, enemyArmor: newEnemyArmor, wildCharge: newWildCharge, wildReady: newWildCharge >= 100, selectedCards: [], pendingPlacement: null, lastHandResult: handResult, phase: 'victory' });
        return;
      }

      set({ grid: newGrid, gridOwner: newOwner, playerHand: newHand, enemyHP: newEnemyHP, enemyArmor: newEnemyArmor, wildCharge: newWildCharge, wildReady: newWildCharge >= 100, selectedCards: [], pendingPlacement: null, lastHandResult: handResult, phase: 'handResult' });
      return;
    }

    // First placement — need 1 selected card
    if (selectedCards.length === 0) return;

    const card = selectedCards[0];

    // Validate: row,col must be a valid placement endpoint
    const opp = getOppositeCell(row, col);
    if (!opp) return;

    set({
      pendingPlacement: { card, row, col },
      selectedCards: selectedCards.filter(c => c.id !== card.id),
    });
  },

  playerPass: () => {
    const { phase, drawPile } = get();
    if (phase !== 'playerTurn') return;

    const deck = drawPile.length >= 4 ? drawPile : shuffleDeck([...drawPile, ...createDeck()]);
    const { drawn, remaining } = drawCards(deck, 4);

    // Player passes → enemy gets their turn (same turn number; increments after enemy)
    set({
      playerHand: drawn,
      drawPile: remaining,
      selectedCards: [],
      pendingPlacement: null,
      phase: 'enemyTurn',
    });
  },

  dismissHandResult: () => {
    const { currentTurn, maxTurnsPerRound, lastHandResult } = get();

    if (lastHandResult?.isPlayerHand) {
      // Player played → enemy takes their turn (same turn number)
      set({ phase: 'enemyTurn', lastHandResult: null });
    } else {
      // Enemy played → turn ends, player goes next
      const nextTurn = currentTurn + 1;
      if (nextTurn > maxTurnsPerRound) {
        get().startNewRound();
      } else {
        set({ phase: 'playerTurn', currentTurn: nextTurn, lastHandResult: null });
      }
    }
  },

  runEnemyTurn: () => {
    const { grid, enemyHand, currentEnemy, drawPile, currentTurn, maxTurnsPerRound } = get();
    const move = findBestAiMove(grid, enemyHand, currentEnemy.damageTable);

    if (!move) {
      // Enemy must pass — redraw hand
      const deck = drawPile.length >= currentEnemy.handCardCount
        ? drawPile
        : shuffleDeck([...drawPile, ...createDeck()]);
      const { drawn, remaining } = drawCards(deck, currentEnemy.handCardCount);

      const nextTurn = currentTurn + 1;
      if (nextTurn > maxTurnsPerRound) {
        set({ enemyHand: drawn, drawPile: remaining });
        get().startNewRound();
      } else {
        set({ enemyHand: drawn, drawPile: remaining, phase: 'playerTurn', currentTurn: nextTurn });
      }
      return;
    }

    const newGrid = grid.map(r => [...r]);
    const newOwner = get().gridOwner.map(r => [...r]);
    newGrid[move.pos1[0]][move.pos1[1]] = move.card1;
    newOwner[move.pos1[0]][move.pos1[1]] = 'enemy';
    newGrid[move.pos2[0]][move.pos2[1]] = move.card2;
    newOwner[move.pos2[0]][move.pos2[1]] = 'enemy';

    const newEnemyHand = enemyHand.filter(c => c.id !== move.card1.id && c.id !== move.card2.id);
    const cells = getHandCells(move.pos1[0], move.pos1[1], move.pos2[0], move.pos2[1]);

    const { hp: newPlayerHP, armor: newPlayerArmor } = applyDamage(get().playerHP, get().playerArmor, move.damage);

    const handResult: HandResult = {
      handName: move.handName,
      handDisplayName: move.handName,
      damage: move.damage,
      cells,
      isPlayerHand: false,
    };

    if (newPlayerHP <= 0) {
      set({ grid: newGrid, gridOwner: newOwner, enemyHand: newEnemyHand, playerHP: 0, playerArmor: newPlayerArmor, lastHandResult: handResult, phase: 'defeat' });
      return;
    }

    set({
      grid: newGrid,
      gridOwner: newOwner,
      enemyHand: newEnemyHand,
      playerHP: newPlayerHP,
      playerArmor: newPlayerArmor,
      lastHandResult: handResult,
      phase: 'handResult',
    });
  },

  startNewRound: () => {
    const { currentRound, currentEnemy, drawPile, playerHand } = get();
    let deck = drawPile.length < 9 + 4 + currentEnemy.handCardCount
      ? shuffleDeck(createDeck())
      : drawPile;

    const { grid, owner, remaining } = dealCenterCards(deck);
    const { drawn: newPlayerHand, remaining: r2 } = drawCards(remaining, 4);
    const { drawn: newEnemyHand, remaining: newDraw } = drawCards(r2, currentEnemy.handCardCount);

    set({
      grid,
      gridOwner: owner,
      playerHand: newPlayerHand,
      enemyHand: newEnemyHand,
      drawPile: newDraw,
      currentRound: currentRound + 1,
      currentTurn: 1,
      isPlayerTurn: true,
      selectedCards: [],
      pendingPlacement: null,
      lastHandResult: null,
      phase: 'playerTurn',
    });
  },
}));
