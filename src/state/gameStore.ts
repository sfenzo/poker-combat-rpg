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
  coinDrop: number;
}

export interface HandResult {
  handName: string;
  handDisplayName: string;
  damage: number;
  cells: Array<[number, number]>;
  isPlayerHand: boolean;
  isPass?: boolean;
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
  turnWonOn: number;

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
  setPlayerHP: (hp: number) => void;
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
    handCardCount: 2,
    damageTable: DEFAULT_DAMAGE_TABLE,
    ability: null,
    coinDrop: 3,
  },
  {
    id: 'ulfr',
    name: 'ULFR',
    maxHP: 10,
    currentHP: 10,
    armor: 0,
    handCardCount: 2,
    damageTable: DEFAULT_DAMAGE_TABLE,
    ability: null,
    coinDrop: 5,
  },
  {
    id: 'mauler_bear',
    name: 'MAULER BEAR',
    maxHP: 8,
    currentHP: 8,
    armor: 0,
    handCardCount: 2,
    damageTable: DEFAULT_DAMAGE_TABLE,
    ability: null,
    coinDrop: 4,
  },
];

function applyDamage(hp: number, armor: number, damage: number): { hp: number; armor: number } {
  const absorbed = Math.min(armor, damage);
  return { hp: Math.max(0, hp - (damage - absorbed)), armor: Math.max(0, armor - absorbed) };
}

function safeDrawCards(pile: Card[], n: number): { drawn: Card[]; remaining: Card[] } {
  if (pile.length < n) {
    pile = shuffleDeck([...pile, ...createDeck()]);
  }
  return drawCards(pile, n);
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
  turnWonOn: 0,
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
    // Player draws 4, enemy draws handCardCount (2) initially
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
      turnWonOn: 0,
      wildCharge: 0,
      wildReady: false,
      selectedCards: [],
      pendingPlacement: null,
      lastHandResult: null,
      phase: 'playerTurn',
      currentEnemy: { ...enemy },
    });
  },

  setPlayerHP: (hp) => {
    set({ playerHP: hp });
  },

  toggleSelectCard: (card) => {
    const { phase, selectedCards, pendingPlacement } = get();
    if (phase !== 'playerTurn') return;

    if (pendingPlacement) {
      const { grid, gridOwner, playerHand, currentEnemy, drawPile } = get();
      const opp = getOppositeCell(pendingPlacement.row, pendingPlacement.col);
      if (!opp) return;
      const [or, oc] = opp;

      if (grid[or][oc] !== null) return; // opposite cell occupied

      const newGrid = grid.map(r => [...r]);
      const newOwner = gridOwner.map(r => [...r]);
      newGrid[pendingPlacement.row][pendingPlacement.col] = pendingPlacement.card;
      newOwner[pendingPlacement.row][pendingPlacement.col] = 'player';
      newGrid[or][oc] = card;
      newOwner[or][oc] = 'player';

      const cells = getHandCells(pendingPlacement.row, pendingPlacement.col, or, oc);
      const fiveCards = cells.map(([r, c]) => newGrid[r][c]).filter(Boolean) as Card[];
      if (fiveCards.length !== 5) return;

      const result = evaluateHand(fiveCards, currentEnemy.damageTable);
      if (!isValidPlay(result)) {
        set({ pendingPlacement: null, selectedCards: [] });
        return;
      }

      const newHand = playerHand.filter(c => c.id !== pendingPlacement.card.id && c.id !== card.id);
      const { hp: newEnemyHP, armor: newEnemyArmor } = applyDamage(get().enemyHP, get().enemyArmor, result.damage);
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
          grid: newGrid, gridOwner: newOwner, playerHand: newHand,
          enemyHP: 0, enemyArmor: newEnemyArmor,
          wildCharge: newWildCharge, wildReady: newWildCharge >= 100,
          selectedCards: [], pendingPlacement: null,
          lastHandResult: handResult,
          turnWonOn: get().currentTurn,
          phase: 'victory',
        });
        return;
      }

      // Draw 2 more cards for enemy (2→4) before their turn
      const { drawn: extraEnemyCards, remaining: newDraw } = safeDrawCards(drawPile, get().currentEnemy.handCardCount);

      set({
        grid: newGrid, gridOwner: newOwner, playerHand: newHand,
        enemyHP: newEnemyHP, enemyArmor: newEnemyArmor,
        enemyHand: [...get().enemyHand, ...extraEnemyCards],
        drawPile: newDraw,
        wildCharge: newWildCharge, wildReady: newWildCharge >= 100,
        selectedCards: [], pendingPlacement: null,
        lastHandResult: handResult,
        phase: 'handResult',
      });
      return;
    }

    const alreadySelected = selectedCards.find(c => c.id === card.id);
    if (alreadySelected) {
      set({ selectedCards: selectedCards.filter(c => c.id !== card.id) });
    } else if (selectedCards.length < 2) {
      set({ selectedCards: [...selectedCards, card] });
    } else {
      set({ selectedCards: [selectedCards[1], card] });
    }
  },

  placeAtCell: (row, col) => {
    const { phase, grid, gridOwner, selectedCards, pendingPlacement, playerHand, currentEnemy, drawPile } = get();
    if (phase !== 'playerTurn') return;
    if (grid[row][col] !== null) return;

    if (pendingPlacement) {
      const opp = getOppositeCell(pendingPlacement.row, pendingPlacement.col);
      if (!opp || opp[0] !== row || opp[1] !== col) return;

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
      const handResult: HandResult = {
        handName: result.handName, handDisplayName: result.handDisplayName,
        damage: result.damage, cells, isPlayerHand: true,
      };

      if (newEnemyHP <= 0) {
        set({
          grid: newGrid, gridOwner: newOwner, playerHand: newHand,
          enemyHP: 0, enemyArmor: newEnemyArmor,
          wildCharge: newWildCharge, wildReady: newWildCharge >= 100,
          selectedCards: [], pendingPlacement: null,
          lastHandResult: handResult,
          turnWonOn: get().currentTurn,
          phase: 'victory',
        });
        return;
      }

      const { drawn: extraEnemyCards, remaining: newDraw } = safeDrawCards(drawPile, get().currentEnemy.handCardCount);

      set({
        grid: newGrid, gridOwner: newOwner, playerHand: newHand,
        enemyHP: newEnemyHP, enemyArmor: newEnemyArmor,
        enemyHand: [...get().enemyHand, ...extraEnemyCards],
        drawPile: newDraw,
        wildCharge: newWildCharge, wildReady: newWildCharge >= 100,
        selectedCards: [], pendingPlacement: null,
        lastHandResult: handResult,
        phase: 'handResult',
      });
      return;
    }

    if (selectedCards.length === 0) return;
    const card = selectedCards[0];
    const opp = getOppositeCell(row, col);
    if (!opp) return;

    set({
      pendingPlacement: { card, row, col },
      selectedCards: selectedCards.filter(c => c.id !== card.id),
    });
  },

  playerPass: () => {
    const { phase, drawPile, currentEnemy } = get();
    if (phase !== 'playerTurn') return;

    // Player discards hand and draws 4 fresh cards
    const { drawn: newPlayerHand, remaining: r1 } = safeDrawCards(drawPile, 4);
    // Enemy draws handCardCount more cards (2→4) for their turn
    const { drawn: extraEnemyCards, remaining: newDraw } = safeDrawCards(r1, currentEnemy.handCardCount);

    const passResult: HandResult = {
      handName: 'PASS',
      handDisplayName: 'PASS',
      damage: 0,
      cells: [],
      isPlayerHand: true,
      isPass: true,
    };

    set({
      playerHand: newPlayerHand,
      enemyHand: [...get().enemyHand, ...extraEnemyCards],
      drawPile: newDraw,
      selectedCards: [],
      pendingPlacement: null,
      lastHandResult: passResult,
      phase: 'handResult',
    });
  },

  dismissHandResult: () => {
    const { currentTurn, maxTurnsPerRound, lastHandResult, drawPile, currentEnemy } = get();

    if (lastHandResult?.isPlayerHand) {
      // Player played/passed → enemy's turn
      const nextTurn = currentTurn + 1;
      set({ phase: 'enemyTurn', currentTurn: nextTurn, lastHandResult: null });
    } else {
      // Enemy played/passed → player's turn, draw 2 for player
      const nextTurn = currentTurn + 1;
      if (nextTurn > maxTurnsPerRound) {
        set({ lastHandResult: null });
        get().startNewRound();
      } else {
        const { drawn: extraPlayerCards, remaining: newDraw } = safeDrawCards(drawPile, 2);
        set({
          playerHand: [...get().playerHand, ...extraPlayerCards],
          drawPile: newDraw,
          phase: 'playerTurn',
          currentTurn: nextTurn,
          lastHandResult: null,
        });
      }
    }
  },

  runEnemyTurn: () => {
    const { grid, enemyHand, currentEnemy, drawPile } = get();
    const move = findBestAiMove(grid, enemyHand, currentEnemy.damageTable);

    if (!move) {
      // Enemy passes — discard all cards
      const passResult: HandResult = {
        handName: 'PASS',
        handDisplayName: 'PASS',
        damage: 0,
        cells: [],
        isPlayerHand: false,
        isPass: true,
      };
      set({
        enemyHand: [],
        lastHandResult: passResult,
        phase: 'handResult',
      });
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
      set({
        grid: newGrid, gridOwner: newOwner,
        enemyHand: newEnemyHand,
        playerHP: 0, playerArmor: newPlayerArmor,
        lastHandResult: handResult,
        phase: 'defeat',
      });
      return;
    }

    set({
      grid: newGrid, gridOwner: newOwner,
      enemyHand: newEnemyHand,
      playerHP: newPlayerHP, playerArmor: newPlayerArmor,
      lastHandResult: handResult,
      phase: 'handResult',
    });
  },

  startNewRound: () => {
    const { currentRound, currentEnemy } = get();
    const deck = shuffleDeck(createDeck());
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
