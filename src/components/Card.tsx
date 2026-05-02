import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card as CardType, SUIT_SYMBOLS, RED_SUITS } from '../constants/gameConstants';

export type CardState = 'default' | 'selected' | 'highlighted' | 'enemy' | 'center' | 'facedown';

interface Props {
  card: CardType;
  state?: CardState;
  size?: 'sm' | 'md';
  cardWidth?: number;
  cardHeight?: number;
}

export default function Card({ card, state = 'default', size = 'md', cardWidth, cardHeight }: Props) {
  const isSmall = size === 'sm';
  const w = cardWidth ?? (isSmall ? 46 : 56);
  const h = cardHeight ?? (isSmall ? 58 : 68);
  const rankFontSize = Math.max(8, w * 0.22);
  const suitFontSize = Math.max(12, w * 0.38);

  if (state === 'facedown') {
    return <View style={[styles.card, { width: w, height: h }, styles.facedown]} />;
  }

  if (card.isJoker) {
    return (
      <View style={[
        styles.card,
        { width: w, height: h },
        state === 'selected' && styles.selected,
        state === 'highlighted' && styles.highlighted,
      ]}>
        <Text style={[styles.jokerLabel, { fontSize: Math.max(7, w * 0.16) }]}>JOKER</Text>
        <Text style={{ fontSize: suitFontSize }}>🃏</Text>
      </View>
    );
  }

  const isRed = card.suit ? RED_SUITS.includes(card.suit) : false;
  const suitSymbol = card.suit ? SUIT_SYMBOLS[card.suit] : '';
  const rankColor = isRed ? '#CC2200' : '#111111';

  return (
    <View style={[
      styles.card,
      { width: w, height: h },
      state === 'selected' && styles.selected,
      state === 'highlighted' && styles.highlighted,
      state === 'enemy' && styles.enemyCard,
    ]}>
      <Text style={[styles.rankTopLeft, { fontSize: rankFontSize, color: rankColor }]}>
        {card.rank}
      </Text>
      <Text style={[styles.suitCenter, { fontSize: suitFontSize, color: rankColor }]}>
        {suitSymbol}
      </Text>
      <Text style={[styles.rankBottomRight, { fontSize: rankFontSize, color: rankColor }]}>
        {card.rank}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  facedown: {
    backgroundColor: '#5555AA',
    borderColor: '#3333AA',
  },
  selected: {
    borderColor: '#FFD700',
    borderWidth: 2.5,
  },
  highlighted: {
    backgroundColor: '#EDD5FF',
    borderColor: '#9933CC',
    borderWidth: 2,
  },
  enemyCard: {
    borderColor: '#AA3333',
  },
  rankTopLeft: {
    position: 'absolute',
    top: 2,
    left: 3,
    fontWeight: '700',
  },
  rankBottomRight: {
    position: 'absolute',
    bottom: 2,
    right: 3,
    fontWeight: '700',
  },
  suitCenter: {
    fontWeight: '600',
  },
  jokerLabel: {
    fontWeight: '800',
    color: '#7700CC',
    position: 'absolute',
    top: 2,
    left: 1,
  },
});
