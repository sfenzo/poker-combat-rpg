import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Card } from '../constants/gameConstants';
import CardComponent from './Card';

interface Props {
  playerHP: number;
  playerMaxHP: number;
  playerArmor: number;
  wildCharge: number;
  hand: Card[];
  selectedCards: Card[];
  isPlayerTurn: boolean;
  onCardPress: (card: Card) => void;
}

export default function PlayerArea({
  playerHP,
  playerMaxHP,
  playerArmor,
  wildCharge,
  hand,
  selectedCards,
  isPlayerTurn,
  onCardPress,
}: Props) {
  const hpAnim = useRef(new Animated.Value(playerHP / playerMaxHP)).current;

  useEffect(() => {
    Animated.timing(hpAnim, {
      toValue: Math.max(0, playerHP / playerMaxHP),
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [playerHP]);

  const hpWidth = hpAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, isPlayerTurn && styles.activeTurn]}>
      <View style={styles.portrait}>
        <Text style={styles.portraitEmoji}>🧙‍♀️</Text>
        <Text style={styles.label}>PLAYER</Text>
        <View style={styles.wildBar}>
          <View style={[styles.wildFill, { height: `${wildCharge}%` }]} />
        </View>
        <Text style={styles.wildLabel}>WILD</Text>
      </View>

      <View style={styles.statsCol}>
        <View style={styles.hpBarWrapper}>
          <Animated.View style={[styles.hpBar, { width: hpWidth }]} />
          <Text style={styles.hpText}>{playerHP}/{playerMaxHP}</Text>
        </View>
        <Text style={styles.armor}>🛡️ {playerArmor}</Text>

        <View style={styles.handRow}>
          {hand.map(card => {
            const isSelected = selectedCards.some(c => c.id === card.id);
            return (
              <TouchableOpacity
                key={card.id}
                onPress={() => isPlayerTurn && onCardPress(card)}
                style={[styles.cardWrap, isSelected && styles.cardWrapSelected]}
                activeOpacity={0.7}
              >
                <CardComponent
                  card={card}
                  state={isSelected ? 'selected' : 'default'}
                  size="sm"
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    padding: 8,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#333',
  },
  activeTurn: {
    borderTopColor: '#33AAFF',
  },
  portrait: {
    width: 70,
    alignItems: 'center',
    marginRight: 8,
  },
  portraitEmoji: {
    fontSize: 36,
  },
  label: {
    color: '#AAA',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  wildBar: {
    width: 10,
    height: 30,
    backgroundColor: '#333',
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  wildFill: {
    backgroundColor: '#FF8800',
    width: '100%',
    borderRadius: 3,
  },
  wildLabel: {
    color: '#FF8800',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
  },
  statsCol: {
    flex: 1,
    gap: 4,
  },
  hpBarWrapper: {
    height: 18,
    backgroundColor: '#440000',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  hpBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#CC2200',
    borderRadius: 4,
  },
  hpText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    zIndex: 1,
  },
  armor: {
    color: '#CCC',
    fontSize: 12,
    fontWeight: '600',
  },
  handRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  cardWrap: {
    borderRadius: 6,
  },
  cardWrapSelected: {
    transform: [{ translateY: -4 }],
  },
});
