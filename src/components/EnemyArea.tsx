import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Enemy } from '../state/gameStore';

interface Props {
  enemy: Enemy;
  handCardCount: number;
  isEnemyTurn: boolean;
}

export default function EnemyArea({ enemy, handCardCount, isEnemyTurn }: Props) {
  const hpAnim = useRef(new Animated.Value(enemy.currentHP / enemy.maxHP)).current;

  useEffect(() => {
    Animated.timing(hpAnim, {
      toValue: Math.max(0, enemy.currentHP / enemy.maxHP),
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [enemy.currentHP]);

  const hpWidth = hpAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, isEnemyTurn && styles.activeTurn]}>
      <View style={styles.statsCol}>
        <View style={styles.hpBarWrapper}>
          <Animated.View style={[styles.hpBar, { width: hpWidth }]} />
          <Text style={styles.hpText}>{enemy.currentHP}/{enemy.maxHP}</Text>
        </View>
        <Text style={styles.armor}>🛡️ {enemy.armor}</Text>

        <View style={styles.handRow}>
          {Array.from({ length: handCardCount }).map((_, i) => (
            <View key={i} style={styles.facedownCard} />
          ))}
        </View>
      </View>

      <View style={styles.portrait}>
        <Text style={styles.portraitEmoji}>🐺</Text>
        <Text style={styles.enemyName}>{enemy.name}</Text>
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
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  activeTurn: {
    borderBottomColor: '#FF6600',
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
  },
  facedownCard: {
    width: 30,
    height: 40,
    backgroundColor: '#5555AA',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3333AA',
  },
  portrait: {
    width: 80,
    alignItems: 'center',
    marginLeft: 8,
  },
  portraitEmoji: {
    fontSize: 44,
  },
  enemyName: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
});
