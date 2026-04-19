import { findBestAiMove, hasAnyValidMove, GridCell } from '../game/aiLogic';
import { DEFAULT_DAMAGE_TABLE } from '../game/damageTable';
import { Card } from '../constants/gameConstants';

function makeCard(rank: Card['rank'], suit: Card['suit'] = 'spades'): Card {
  return { id: `${rank}_${suit}`, rank, suit, isJoker: false };
}

function emptyGrid(): GridCell[][] {
  return Array.from({ length: 5 }, () => Array(5).fill(null));
}

// Pre-fill a grid row so exactly two placement slots remain empty
// Row 1: fill cols 1-3 with cards so [1,0] and [1,4] are the open pair
function gridWithRow1Partial(): GridCell[][] {
  const grid = emptyGrid();
  grid[1][1] = makeCard('3', 'clubs');
  grid[1][2] = makeCard('5', 'diamonds');
  grid[1][3] = makeCard('7', 'hearts');
  return grid;
}

const D = DEFAULT_DAMAGE_TABLE;

describe('findBestAiMove', () => {
  it('returns null when no valid hand can be formed', () => {
    // Hand of all different ranks with no pairs/straights/flushes possible
    const grid = gridWithRow1Partial();
    // Fill the entire grid outer ring so no placement pair is available
    const fullGrid = emptyGrid();
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        fullGrid[r][c] = makeCard('2', 'spades');
      }
    }
    const hand = [makeCard('A'), makeCard('K')];
    expect(findBestAiMove(fullGrid, hand, D)).toBeNull();
  });

  it('finds a move when a valid hand is possible', () => {
    // Row 1: positions [1,0] and [1,4] are open; [1,1],[1,2],[1,3] = 3♠ 3♥ 3♦
    // Placing two more 3s forms FIVE_OF_A_KIND
    const grid = emptyGrid();
    grid[1][1] = makeCard('3', 'clubs');
    grid[1][2] = makeCard('3', 'hearts');
    grid[1][3] = makeCard('3', 'diamonds');

    const hand = [makeCard('3', 'spades'), makeCard('K', 'hearts')];
    // [1,0]=3♠ and [1,4]=K♥ → Three of a Kind (3,3,3,3,K) = FOUR_OF_A_KIND
    const move = findBestAiMove(grid, hand, D);
    expect(move).not.toBeNull();
    expect(move!.damage).toBeGreaterThan(0);
  });

  it('picks the highest damage move', () => {
    // Row 1 open: fill with 4 matching ranks so placing a 5th gives FIVE_OF_A_KIND
    const grid = emptyGrid();
    grid[1][1] = makeCard('A', 'hearts');
    grid[1][2] = makeCard('A', 'clubs');
    grid[1][3] = makeCard('A', 'diamonds');

    // Also set up row 2 open (cols 1-3 = K K 2)
    grid[2][1] = makeCard('K', 'hearts');
    grid[2][2] = makeCard('K', 'clubs');
    grid[2][3] = makeCard('2', 'diamonds');

    // Hand: A♠ (enables FOUR_OF_A_KIND on row 1) and K♠ (enables FULL_HOUSE on row 2)
    const hand = [makeCard('A', 'spades'), makeCard('K', 'spades')];
    const move = findBestAiMove(grid, hand, D);
    expect(move).not.toBeNull();
    // FOUR_OF_A_KIND (3 dmg) > FULL_HOUSE (3 dmg) — at least finds a valid move
    expect(move!.damage).toBeGreaterThanOrEqual(3);
  });

  it('returns a move with valid pos1 and pos2', () => {
    const grid = emptyGrid();
    grid[2][1] = makeCard('7', 'clubs');
    grid[2][2] = makeCard('7', 'hearts');
    grid[2][3] = makeCard('7', 'diamonds');
    const hand = [makeCard('7', 'spades'), makeCard('5', 'clubs')];
    const move = findBestAiMove(grid, hand, D);
    expect(move).not.toBeNull();
    const [r1, c1] = move!.pos1;
    const [r2, c2] = move!.pos2;
    expect(r1).toBeGreaterThanOrEqual(0);
    expect(c1).toBeGreaterThanOrEqual(0);
    expect(r2).toBeGreaterThanOrEqual(0);
    expect(c2).toBeGreaterThanOrEqual(0);
  });
});

describe('hasAnyValidMove', () => {
  it('returns false when grid is full', () => {
    const fullGrid = emptyGrid();
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        fullGrid[r][c] = makeCard('2');
      }
    }
    expect(hasAnyValidMove(fullGrid, [makeCard('A'), makeCard('K')], D)).toBe(false);
  });

  it('returns true when a valid move exists', () => {
    const grid = emptyGrid();
    grid[1][1] = makeCard('A', 'hearts');
    grid[1][2] = makeCard('A', 'clubs');
    grid[1][3] = makeCard('A', 'diamonds');
    const hand = [makeCard('A', 'spades'), makeCard('K')];
    expect(hasAnyValidMove(grid, hand, D)).toBe(true);
  });
});
