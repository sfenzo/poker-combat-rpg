import { Card, PLACEMENT_PAIRS, getHandCells } from '../constants/gameConstants';
import { DamageTable } from './damageTable';
import { evaluateHand, isValidPlay } from './handEvaluator';

export type GridCell = Card | null;

export interface AiMove {
  card1: Card;
  card2: Card;
  pos1: [number, number];
  pos2: [number, number];
  handName: string;
  damage: number;
}

export function findBestAiMove(
  grid: GridCell[][],
  hand: Card[],
  damageTable: DamageTable,
): AiMove | null {
  let best: AiMove | null = null;
  let bestDamage = -1;

  for (const [posA, posB] of PLACEMENT_PAIRS) {
    const [r1, c1] = posA;
    const [r2, c2] = posB;

    // Both slots must be empty
    if (grid[r1][c1] !== null || grid[r2][c2] !== null) continue;

    const handCells = getHandCells(r1, c1, r2, c2);

    // Check all pairs of cards from hand
    for (let i = 0; i < hand.length; i++) {
      for (let j = 0; j < hand.length; j++) {
        if (i === j) continue;

        const tempGrid: GridCell[][] = grid.map(row => [...row]);
        tempGrid[r1][c1] = hand[i];
        tempGrid[r2][c2] = hand[j];

        const fiveCards = handCells.map(([r, c]) => tempGrid[r][c]).filter(Boolean) as Card[];
        if (fiveCards.length !== 5) continue;

        const result = evaluateHand(fiveCards, damageTable);
        if (!isValidPlay(result)) continue;

        if (result.damage > bestDamage) {
          bestDamage = result.damage;
          best = {
            card1: hand[i],
            card2: hand[j],
            pos1: posA,
            pos2: posB,
            handName: result.handDisplayName,
            damage: result.damage,
          };
        }
      }
    }
  }

  return best;
}

export function hasAnyValidMove(grid: GridCell[][], hand: Card[], damageTable: DamageTable): boolean {
  return findBestAiMove(grid, hand, damageTable) !== null;
}
