import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HandResult } from '../state/gameStore';

interface Props {
  result: HandResult;
  onDismiss: () => void;
}

export default function HandResultBanner({ result, onDismiss }: Props) {
  const duration = result.isPass ? 1200 : 1800;

  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [result]);

  const isPlayer = result.isPlayerHand;

  if (result.isPass) {
    return (
      <View style={styles.overlay}>
        <View style={styles.passBanner}>
          <Text style={styles.passText}>PASS</Text>
          {!isPlayer && (
            <Text style={styles.passSubText}>Enemy can't make a valid hand!</Text>
          )}
        </View>
      </View>
    );
  }

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
  passBanner: {
    backgroundColor: '#2A2A2A',
    borderColor: '#888888',
    borderWidth: 2,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  passText: {
    color: '#CCCCCC',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 4,
  },
  passSubText: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
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
