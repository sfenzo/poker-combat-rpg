import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HandResult } from '../state/gameStore';

interface Props {
  result: HandResult;
  onDismiss: () => void;
}

export default function HandResultBanner({ result, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 1800);
    return () => clearTimeout(timer);
  }, [result]);

  const isPlayer = result.isPlayerHand;

  return (
    <View style={styles.overlay}>
      <View style={[styles.banner, isPlayer ? styles.playerBanner : styles.enemyBanner]}>
        <Text style={styles.handName}>{result.handDisplayName}</Text>
        {result.damage > 0 && (
          <Text style={styles.damage}>
            {isPlayer ? '⚔️' : '💀'} {result.damage} DMG
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    // pointerEvents: 'none' handled via prop on the View is deprecated —
    // using position absolute overlay without blocking is fine here since
    // it auto-dismisses and blocks input intentionally during display.
  },
  banner: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  playerBanner: {
    backgroundColor: '#1A3A1A',
    borderColor: '#44AA44',
  },
  enemyBanner: {
    backgroundColor: '#3A1A1A',
    borderColor: '#AA4444',
  },
  handName: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  damage: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
});
