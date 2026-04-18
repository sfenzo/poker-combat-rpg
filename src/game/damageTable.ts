export type HandName =
  | 'HIGH_CARD'
  | 'ONE_PAIR'
  | 'TWO_PAIR'
  | 'THREE_OF_A_KIND'
  | 'STRAIGHT'
  | 'FLUSH'
  | 'FULL_HOUSE'
  | 'FOUR_OF_A_KIND'
  | 'STRAIGHT_FLUSH'
  | 'ROYAL_FLUSH'
  | 'FIVE_OF_A_KIND';

export type DamageTable = Record<HandName, number>;

export const HAND_DISPLAY_NAMES: Record<HandName, string> = {
  HIGH_CARD: 'HIGH CARD',
  ONE_PAIR: 'ONE PAIR',
  TWO_PAIR: 'TWO PAIR',
  THREE_OF_A_KIND: 'THREE OF A KIND',
  STRAIGHT: 'STRAIGHT',
  FLUSH: 'FLUSH',
  FULL_HOUSE: 'FULL HOUSE',
  FOUR_OF_A_KIND: 'FOUR OF A KIND',
  STRAIGHT_FLUSH: 'STRAIGHT FLUSH',
  ROYAL_FLUSH: 'ROYAL FLUSH',
  FIVE_OF_A_KIND: 'FIVE OF A KIND',
};

// Hand rank for comparison (higher = better)
export const HAND_RANK: Record<HandName, number> = {
  HIGH_CARD: 1,
  ONE_PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10,
  FIVE_OF_A_KIND: 11,
};

export const DEFAULT_DAMAGE_TABLE: DamageTable = {
  HIGH_CARD: 0,
  ONE_PAIR: 1,
  TWO_PAIR: 1,
  THREE_OF_A_KIND: 1,
  STRAIGHT: 2,
  FLUSH: 2,
  FULL_HOUSE: 3,
  FOUR_OF_A_KIND: 3,
  STRAIGHT_FLUSH: 4,
  ROYAL_FLUSH: 4,
  FIVE_OF_A_KIND: 4,
};
