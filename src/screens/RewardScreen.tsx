import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Enemy } from '../state/gameStore';

interface Props {
  enemy: Enemy;
  turnWonOn: number;
  maxTurnsPerRound: number;
  onAccept: (coins: number) => void;
}

export default function RewardScreen({ enemy, turnWonOn, maxTurnsPerRound, onAccept }: Props) {
  const monsterDrop = enemy.coinDrop;
  const turnBonus = Math.max(0, (maxTurnsPerRound - turnWonOn) - 1);
  const handBonus = 0;
  const total = monsterDrop + turnBonus + handBonus;

  return (
    <View style={styles.screen}>
      <View style={styles.parchment}>
        <View style={styles.titleFrame}>
          <Text style={styles.title}>CONGRATULATIONS!</Text>
        </View>

        <Text style={styles.coinsLabel}>COINS RECEIVED:</Text>
        <Text style={styles.coinsTotal}>🪙 {total}</Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>MONSTER DROP</Text>
          <Text style={styles.rowValue}>🪙 {monsterDrop}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>TURN BONUS</Text>
          <Text style={styles.rowValue}>🪙 {turnBonus}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>HAND BONUS</Text>
          <Text style={styles.rowValue}>🪙 {handBonus}</Text>
        </View>
        <View style={styles.divider} />

        <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(total)} activeOpacity={0.8}>
          <Text style={styles.acceptText}>ACCEPT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parchment: {
    width: 300,
    backgroundColor: '#F5E6C8',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#B8962E',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  titleFrame: {
    backgroundColor: '#3A2800',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 4,
  },
  title: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  coinsLabel: {
    color: '#3A2800',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  coinsTotal: {
    color: '#3A2800',
    fontSize: 32,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: '#B8962E',
    width: '100%',
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  rowLabel: {
    color: '#3A2800',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rowValue: {
    color: '#3A2800',
    fontSize: 13,
    fontWeight: '700',
  },
  acceptBtn: {
    marginTop: 8,
    backgroundColor: '#3A2800',
    borderWidth: 2,
    borderColor: '#B8962E',
    borderRadius: 6,
    paddingHorizontal: 40,
    paddingVertical: 12,
  },
  acceptText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
