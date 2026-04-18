import { Card, Rank, Suit, RANKS, SUITS } from '../constants/gameConstants';
import { HandName, DamageTable, HAND_DISPLAY_NAMES, HAND_RANK } from './damageTable';

export interface EvaluatedHand {
  handName: HandName;
  handDisplayName: string;
  damage: number;
}

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14, 'JOKER': 0,
};

function evaluateNonJoker(cards: Card[]): { handName: HandName; rank: number } {
  const vals = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => a - b);
  const suits = cards.map(c => c.suit as Suit);

  const rankCounts = new Map<number, number>();
  for (const v of vals) rankCounts.set(v, (rankCounts.get(v) ?? 0) + 1);
  const counts = [...rankCounts.values()].sort((a, b) => b - a);

  const isFlush = suits.every(s => s === suits[0]);
  const uniqueVals = [...new Set(vals)].sort((a, b) => a - b);

  let isStraight = false;
  if (uniqueVals.length === 5) {
    if (uniqueVals[4] - uniqueVals[0] === 4) isStraight = true;
    // Wheel: A-2-3-4-5
    if (uniqueVals[4] === 14 && uniqueVals[3] === 5 && uniqueVals[0] === 2 &&
        uniqueVals[1] === 3 && uniqueVals[2] === 4) isStraight = true;
  }

  const isRoyal = isFlush && isStraight && uniqueVals[4] === 14 &&
    !(uniqueVals[4] === 14 && uniqueVals[3] === 5); // not wheel

  if (counts[0] === 5) return { handName: 'FIVE_OF_A_KIND', rank: HAND_RANK['FIVE_OF_A_KIND'] };
  if (isRoyal) return { handName: 'ROYAL_FLUSH', rank: HAND_RANK['ROYAL_FLUSH'] };
  if (isFlush && isStraight) return { handName: 'STRAIGHT_FLUSH', rank: HAND_RANK['STRAIGHT_FLUSH'] };
  if (counts[0] === 4) return { handName: 'FOUR_OF_A_KIND', rank: HAND_RANK['FOUR_OF_A_KIND'] };
  if (counts[0] === 3 && counts[1] === 2) return { handName: 'FULL_HOUSE', rank: HAND_RANK['FULL_HOUSE'] };
  if (isFlush) return { handName: 'FLUSH', rank: HAND_RANK['FLUSH'] };
  if (isStraight) return { handName: 'STRAIGHT', rank: HAND_RANK['STRAIGHT'] };
  if (counts[0] === 3) return { handName: 'THREE_OF_A_KIND', rank: HAND_RANK['THREE_OF_A_KIND'] };
  if (counts[0] === 2 && counts[1] === 2) return { handName: 'TWO_PAIR', rank: HAND_RANK['TWO_PAIR'] };
  if (counts[0] === 2) return { handName: 'ONE_PAIR', rank: HAND_RANK['ONE_PAIR'] };
  return { handName: 'HIGH_CARD', rank: HAND_RANK['HIGH_CARD'] };
}

export function evaluateHand(cards: Card[], damageTable: DamageTable): EvaluatedHand {
  if (cards.length !== 5) {
    throw new Error(`evaluateHand requires exactly 5 cards, got ${cards.length}`);
  }

  const jokers = cards.filter(c => c.isJoker);
  const normals = cards.filter(c => !c.isJoker);

  if (jokers.length === 0) {
    const result = evaluateNonJoker(normals);
    return {
      handName: result.handName,
      handDisplayName: HAND_DISPLAY_NAMES[result.handName],
      damage: damageTable[result.handName],
    };
  }

  // Brute-force best substitution for jokers
  let bestRank = 0;
  let bestHandName: HandName = 'HIGH_CARD';

  const tryHand = (hand: Card[]) => {
    const result = evaluateNonJoker(hand);
    if (result.rank > bestRank) {
      bestRank = result.rank;
      bestHandName = result.handName;
    }
  };

  if (jokers.length === 1) {
    for (const rank of RANKS) {
      for (const suit of SUITS) {
        const sub: Card = { id: 'sub', rank, suit, isJoker: false };
        tryHand([...normals, sub]);
      }
    }
  } else {
    // 2 jokers: try all rank×suit pairs for both
    for (const r1 of RANKS) {
      for (const s1 of SUITS) {
        for (const r2 of RANKS) {
          for (const s2 of SUITS) {
            const sub1: Card = { id: 'sub1', rank: r1, suit: s1, isJoker: false };
            const sub2: Card = { id: 'sub2', rank: r2, suit: s2, isJoker: false };
            tryHand([...normals, sub1, sub2]);
          }
        }
      }
    }
  }

  return {
    handName: bestHandName,
    handDisplayName: HAND_DISPLAY_NAMES[bestHandName],
    damage: damageTable[bestHandName],
  };
}

export function isValidPlay(hand: EvaluatedHand): boolean {
  return hand.handName !== 'HIGH_CARD';
}
