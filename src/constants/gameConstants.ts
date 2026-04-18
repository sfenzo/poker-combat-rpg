export type Suit = 'spades' | 'clubs' | 'hearts' | 'diamonds';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'JOKER';

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit | null;
  isJoker: boolean;
}

export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUITS: Suit[] = ['spades', 'clubs', 'hearts', 'diamonds'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  clubs: '♣',
  hearts: '♥',
  diamonds: '♦',
};

export const RED_SUITS: Suit[] = ['hearts', 'diamonds'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${rank}_${suit}`, rank, suit, isJoker: false });
    }
  }
  deck.push({ id: 'joker_1', rank: 'JOKER', suit: null, isJoker: true });
  deck.push({ id: 'joker_2', rank: 'JOKER', suit: null, isJoker: true });
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function drawCards(deck: Card[], n: number): { drawn: Card[]; remaining: Card[] } {
  const drawn = deck.slice(0, n);
  const remaining = deck.slice(n);
  return { drawn, remaining };
}

// Valid outer-ring placement positions (row, col) — 0-indexed
export const VALID_PLACEMENT_CELLS = new Set([
  '0,0', '0,1', '0,2', '0,3', '0,4',
  '1,0', '1,4',
  '2,0', '2,4',
  '3,0', '3,4',
  '4,0', '4,1', '4,2', '4,3', '4,4',
]);

// Center 3×3 cells
export const CENTER_CELLS = new Set([
  '1,1', '1,2', '1,3',
  '2,1', '2,2', '2,3',
  '3,1', '3,2', '3,3',
]);

// Opposite-side pairs for valid hand formation
export const PLACEMENT_PAIRS: Array<[[number, number], [number, number]]> = [
  [[1, 0], [1, 4]],
  [[2, 0], [2, 4]],
  [[3, 0], [3, 4]],
  [[0, 1], [4, 1]],
  [[0, 2], [4, 2]],
  [[0, 3], [4, 3]],
  [[0, 0], [4, 4]],
  [[0, 4], [4, 0]],
];

export function getOppositeCell(row: number, col: number): [number, number] | null {
  for (const [a, b] of PLACEMENT_PAIRS) {
    if (a[0] === row && a[1] === col) return b;
    if (b[0] === row && b[1] === col) return a;
  }
  return null;
}

export function getHandCells(row1: number, col1: number, row2: number, col2: number): Array<[number, number]> {
  if (row1 === row2) {
    return [[row1, 0], [row1, 1], [row1, 2], [row1, 3], [row1, 4]];
  }
  if (col1 === col2) {
    return [[0, col1], [1, col1], [2, col1], [3, col1], [4, col1]];
  }
  // Diagonal — TL-BR if row === col, else TR-BL
  if (row1 === col1) {
    return [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]];
  }
  return [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0]];
}
