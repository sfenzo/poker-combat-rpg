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
    <View style={styles.overlay} pointerEvents="none">
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
  },
  banner: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  playerBanner: {
    backgroundColor: '#1A3A1A',
    borderWidth: 2,
    borderColor: '#44AA44',
  },
  enemyBanner: {
    backgroundColor: '#3A1A1A',
    borderWidth: 2,
    borderColor: '#AA4444',
  },
  handName: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  damage: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
});
