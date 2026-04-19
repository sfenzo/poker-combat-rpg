import {
  createDeck,
  shuffleDeck,
  drawCards,
  getOppositeCell,
  getHandCells,
  VALID_PLACEMENT_CELLS,
  CENTER_CELLS,
  PLACEMENT_PAIRS,
  Card,
} from '../constants/gameConstants';

describe('createDeck', () => {
  it('produces 54 cards (52 + 2 jokers)', () => {
    expect(createDeck()).toHaveLength(54);
  });

  it('contains exactly 2 jokers', () => {
    const jokers = createDeck().filter(c => c.isJoker);
    expect(jokers).toHaveLength(2);
  });

  it('contains 52 non-joker cards', () => {
    const normals = createDeck().filter(c => !c.isJoker);
    expect(normals).toHaveLength(52);
  });

  it('has unique ids for all cards', () => {
    const deck = createDeck();
    const ids = deck.map(c => c.id);
    expect(new Set(ids).size).toBe(54);
  });

  it('non-joker cards have a non-null suit', () => {
    const normals = createDeck().filter(c => !c.isJoker);
    expect(normals.every(c => c.suit !== null)).toBe(true);
  });

  it('joker cards have null suit', () => {
    const jokers = createDeck().filter(c => c.isJoker);
    expect(jokers.every(c => c.suit === null)).toBe(true);
  });
});

describe('shuffleDeck', () => {
  it('returns a deck of the same length', () => {
    const deck = createDeck();
    expect(shuffleDeck(deck)).toHaveLength(54);
  });

  it('does not mutate the original deck', () => {
    const deck = createDeck();
    const original = [...deck];
    shuffleDeck(deck);
    expect(deck).toEqual(original);
  });

  it('contains the same cards after shuffling', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    const sort = (d: Card[]) => [...d].sort((a, b) => a.id.localeCompare(b.id));
    expect(sort(shuffled)).toEqual(sort(deck));
  });
});

describe('drawCards', () => {
  it('draws the requested number of cards', () => {
    const deck = createDeck();
    const { drawn } = drawCards(deck, 7);
    expect(drawn).toHaveLength(7);
  });

  it('remaining has correct count', () => {
    const deck = createDeck();
    const { remaining } = drawCards(deck, 7);
    expect(remaining).toHaveLength(47);
  });

  it('drawn + remaining accounts for all cards', () => {
    const deck = createDeck();
    const { drawn, remaining } = drawCards(deck, 10);
    expect(drawn.length + remaining.length).toBe(54);
  });

  it('draws from the front of the deck', () => {
    const deck = createDeck();
    const { drawn } = drawCards(deck, 1);
    expect(drawn[0]).toEqual(deck[0]);
  });
});

describe('getOppositeCell', () => {
  it('returns the correct opposite for each pair', () => {
    for (const [[r1, c1], [r2, c2]] of PLACEMENT_PAIRS) {
      expect(getOppositeCell(r1, c1)).toEqual([r2, c2]);
      expect(getOppositeCell(r2, c2)).toEqual([r1, c1]);
    }
  });

  it('returns null for a center cell', () => {
    expect(getOppositeCell(2, 2)).toBeNull();
  });

  it('returns null for an inner cell not in any pair', () => {
    expect(getOppositeCell(1, 1)).toBeNull();
  });
});

describe('getHandCells', () => {
  it('returns 5 cells for a horizontal pair', () => {
    // Row 1: [1,0] <-> [1,4]
    const cells = getHandCells(1, 0, 1, 4);
    expect(cells).toHaveLength(5);
    expect(cells).toEqual([[1,0],[1,1],[1,2],[1,3],[1,4]]);
  });

  it('returns 5 cells for a vertical pair', () => {
    // Col 2: [0,2] <-> [4,2]
    const cells = getHandCells(0, 2, 4, 2);
    expect(cells).toHaveLength(5);
    expect(cells).toEqual([[0,2],[1,2],[2,2],[3,2],[4,2]]);
  });

  it('returns TL-BR diagonal for [0,0] <-> [4,4]', () => {
    const cells = getHandCells(0, 0, 4, 4);
    expect(cells).toEqual([[0,0],[1,1],[2,2],[3,3],[4,4]]);
  });

  it('returns TR-BL diagonal for [0,4] <-> [4,0]', () => {
    const cells = getHandCells(0, 4, 4, 0);
    expect(cells).toEqual([[0,4],[1,3],[2,2],[3,1],[4,0]]);
  });
});

describe('VALID_PLACEMENT_CELLS', () => {
  it('contains all 16 outer-ring cells', () => {
    // Top row (5) + bottom row (5) + left col interior (3) + right col interior (3) = 16
    expect(VALID_PLACEMENT_CELLS.size).toBe(16);
  });

  it('corner [0,0] is valid', () => {
    expect(VALID_PLACEMENT_CELLS.has('0,0')).toBe(true);
  });

  it('center [2,2] is not valid', () => {
    expect(VALID_PLACEMENT_CELLS.has('2,2')).toBe(false);
  });
});

describe('CENTER_CELLS', () => {
  it('contains exactly 9 cells', () => {
    expect(CENTER_CELLS.size).toBe(9);
  });

  it('center [2,2] is included', () => {
    expect(CENTER_CELLS.has('2,2')).toBe(true);
  });

  it('corner [0,0] is not included', () => {
    expect(CENTER_CELLS.has('0,0')).toBe(false);
  });
});
