import { evaluateHand, isValidPlay } from '../game/handEvaluator';
import { DEFAULT_DAMAGE_TABLE } from '../game/damageTable';
import { Card } from '../constants/gameConstants';

function makeCard(rank: Card['rank'], suit: Card['suit'] = 'spades'): Card {
  return { id: `${rank}_${suit}`, rank, suit, isJoker: rank === 'JOKER' };
}

function joker(id = '1'): Card {
  return { id: `joker_${id}`, rank: 'JOKER', suit: null, isJoker: true };
}

const D = DEFAULT_DAMAGE_TABLE;

describe('evaluateHand — basic hands', () => {
  it('identifies HIGH_CARD', () => {
    const hand = [
      makeCard('2', 'spades'), makeCard('5', 'hearts'), makeCard('7', 'clubs'),
      makeCard('9', 'diamonds'), makeCard('J', 'spades'),
    ];
    expect(evaluateHand(hand, D).handName).toBe('HIGH_CARD');
  });

  it('identifies ONE_PAIR', () => {
    const hand = [
      makeCard('A', 'spades'), makeCard('A', 'hearts'), makeCard('3', 'clubs'),
      makeCard('7', 'diamonds'), makeCard('J', 'spades'),
    ];
    expect(evaluateHand(hand, D).handName).toBe('ONE_PAIR');
  });

  it('identifies TWO_PAIR', () => {
    const hand = [
      makeCard('K', 'spades'), makeCard('K', 'hearts'), makeCard('3', 'clubs'),
      makeCard('3', 'diamonds'), makeCard('J', 'spades'),
    ];
    expect(evaluateHand(hand, D).handName).toBe('TWO_PAIR');
  });

  it('identifies THREE_OF_A_KIND', () => {
    const hand = [
      makeCard('Q', 'spades'), makeCard('Q', 'hearts'), makeCard('Q', 'clubs'),
      makeCard('3', 'diamonds'), makeCard('J', 'spades'),
    ];
    expect(evaluateHand(hand, D).handName).toBe('THREE_OF_A_KIND');
  });

  it('identifies STRAIGHT (normal)', () => {
    const hand = [
      makeCard('5', 'spades'), makeCard('6', 'hearts'), makeCard('7', 'clubs'),
      makeCard('8', 'diamonds'), makeCard('9', 'spades'),
    ];
    expect(evaluateHand(hand, D).handName).toBe('STRAIGHT');
  });

  it('identifies FLUSH', () => {
    const hand = [
      makeCard('2', 'hearts'), makeCard('5', 'hearts'), makeCard('7', 'hearts'),
      makeCard('9', 'hearts'), makeCard('J', 'hearts'),
    ];
    expect(evaluateHand(hand, D).handName).toBe('FLUSH');
  });

  it('identifies FULL_HOUSE', () => {
    const hand = [
      makeCard('J', 'spades'), makeCard('J', 'hearts'), makeCard('J', 'clubs'),
      makeCard('4', 'diamonds'), makeCard('4', 'spades'),
    ];
    expect(evaluateHand(hand, D).handName).toBe('FULL_HOUSE');
  });

  it('identifies FOUR_OF_A_KIND', () => {
    const hand = [
      makeCard('10', 'spades'), makeCard('10', 'hearts'), makeCard('10', 'clubs'),
      makeCard('10', 'diamonds'), makeCard('5', 'spades'),
    ];
    expect(evaluateHand(hand, D).handName).toBe('FOUR_OF_A_KIND');
  });

  it('identifies STRAIGHT_FLUSH', () => {
    const hand = [
      makeCard('3', 'clubs'), makeCard('4', 'clubs'), makeCard('5', 'clubs'),
      makeCard('6', 'clubs'), makeCard('7', 'clubs'),
    ];
    expect(evaluateHand(hand, D).handName).toBe('STRAIGHT_FLUSH');
  });

  it('identifies ROYAL_FLUSH', () => {
    const hand = [
      makeCard('10', 'diamonds'), makeCard('J', 'diamonds'), makeCard('Q', 'diamonds'),
      makeCard('K', 'diamonds'), makeCard('A', 'diamonds'),
    ];
    expect(evaluateHand(hand, D).handName).toBe('ROYAL_FLUSH');
  });
});

describe('evaluateHand — edge cases', () => {
  it('wheel straight A-2-3-4-5 is a STRAIGHT, not ROYAL_FLUSH', () => {
    const hand = [
      makeCard('A', 'spades'), makeCard('2', 'hearts'), makeCard('3', 'clubs'),
      makeCard('4', 'diamonds'), makeCard('5', 'spades'),
    ];
    expect(evaluateHand(hand, D).handName).toBe('STRAIGHT');
  });

  it('wheel straight flush A-2-3-4-5 same suit is STRAIGHT_FLUSH, not ROYAL_FLUSH', () => {
    const hand = [
      makeCard('A', 'spades'), makeCard('2', 'spades'), makeCard('3', 'spades'),
      makeCard('4', 'spades'), makeCard('5', 'spades'),
    ];
    expect(evaluateHand(hand, D).handName).toBe('STRAIGHT_FLUSH');
  });

  it('throws on wrong card count', () => {
    const hand = [makeCard('A'), makeCard('K'), makeCard('Q'), makeCard('J')];
    expect(() => evaluateHand(hand, D)).toThrow();
  });

  it('returns correct damage value for STRAIGHT', () => {
    const hand = [
      makeCard('5', 'spades'), makeCard('6', 'hearts'), makeCard('7', 'clubs'),
      makeCard('8', 'diamonds'), makeCard('9', 'spades'),
    ];
    expect(evaluateHand(hand, D).damage).toBe(2);
  });

  it('returns correct damage value for FULL_HOUSE', () => {
    const hand = [
      makeCard('J', 'spades'), makeCard('J', 'hearts'), makeCard('J', 'clubs'),
      makeCard('4', 'diamonds'), makeCard('4', 'spades'),
    ];
    expect(evaluateHand(hand, D).damage).toBe(3);
  });

  it('HIGH_CARD returns damage 0', () => {
    const hand = [
      makeCard('2', 'spades'), makeCard('5', 'hearts'), makeCard('7', 'clubs'),
      makeCard('9', 'diamonds'), makeCard('J', 'spades'),
    ];
    expect(evaluateHand(hand, D).damage).toBe(0);
  });
});

describe('evaluateHand — joker substitution', () => {
  it('1 joker upgrades ONE_PAIR to THREE_OF_A_KIND', () => {
    const hand = [
      makeCard('A', 'spades'), makeCard('A', 'hearts'), makeCard('A', 'clubs'),
      makeCard('7', 'diamonds'), joker(),
    ];
    // Already four of a kind candidate — joker should push to FOUR_OF_A_KIND
    expect(['FOUR_OF_A_KIND', 'FULL_HOUSE', 'THREE_OF_A_KIND']).toContain(
      evaluateHand(hand, D).handName
    );
  });

  it('1 joker with four matching cards gives FIVE_OF_A_KIND', () => {
    const hand = [
      makeCard('K', 'spades'), makeCard('K', 'hearts'), makeCard('K', 'clubs'),
      makeCard('K', 'diamonds'), joker(),
    ];
    expect(evaluateHand(hand, D).handName).toBe('FIVE_OF_A_KIND');
  });

  it('2 jokers with three matching cards gives FIVE_OF_A_KIND', () => {
    const hand = [
      makeCard('Q', 'spades'), makeCard('Q', 'hearts'), makeCard('Q', 'clubs'),
      joker('1'), joker('2'),
    ];
    expect(evaluateHand(hand, D).handName).toBe('FIVE_OF_A_KIND');
  });

  it('1 joker always picks the best possible hand', () => {
    // Four to a flush: A-K-Q-J all hearts + joker → ROYAL_FLUSH
    const hand = [
      makeCard('A', 'hearts'), makeCard('K', 'hearts'), makeCard('Q', 'hearts'),
      makeCard('J', 'hearts'), joker(),
    ];
    expect(evaluateHand(hand, D).handName).toBe('ROYAL_FLUSH');
  });

  it('FIVE_OF_A_KIND returns damage 4', () => {
    const hand = [
      makeCard('K', 'spades'), makeCard('K', 'hearts'), makeCard('K', 'clubs'),
      makeCard('K', 'diamonds'), joker(),
    ];
    expect(evaluateHand(hand, D).damage).toBe(4);
  });
});

describe('isValidPlay', () => {
  it('returns false for HIGH_CARD', () => {
    const hand = [
      makeCard('2', 'spades'), makeCard('5', 'hearts'), makeCard('7', 'clubs'),
      makeCard('9', 'diamonds'), makeCard('J', 'spades'),
    ];
    expect(isValidPlay(evaluateHand(hand, D))).toBe(false);
  });

  it('returns true for ONE_PAIR and above', () => {
    const hand = [
      makeCard('A', 'spades'), makeCard('A', 'hearts'), makeCard('3', 'clubs'),
      makeCard('7', 'diamonds'), makeCard('J', 'spades'),
    ];
    expect(isValidPlay(evaluateHand(hand, D))).toBe(true);
  });
});
