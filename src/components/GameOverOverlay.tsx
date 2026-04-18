import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  type: 'victory' | 'defeat';
  enemyName: string;
  onPlayAgain: () => void;
}

export default function GameOverOverlay({ type, enemyName, onPlayAgain }: Props) {
  const isVictory = type === 'victory';

  return (
    <View style={styles.overlay}>
      <View style={[styles.panel, isVictory ? styles.victoryPanel : styles.defeatPanel]}>
        <Text style={[styles.title, isVictory ? styles.victoryTitle : styles.defeatTitle]}>
          {isVictory ? '⚔️ VICTORY!' : '💀 DEFEAT'}
        </Text>
        <Text style={styles.subtitle}>
          {isVictory ? `You defeated ${enemyName}!` : 'You have been defeated...'}
        </Text>
        <TouchableOpacity style={styles.btn} onPress={onPlayAgain} activeOpacity={0.8}>
          <Text style={styles.btnText}>PLAY AGAIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  panel: {
    width: 260,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  victoryPanel: {
    backgroundColor: '#1A2E1A',
    borderColor: '#44CC44',
  },
  defeatPanel: {
    backgroundColor: '#2E1A1A',
    borderColor: '#CC4444',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  victoryTitle: { color: '#FFD700' },
  defeatTitle: { color: '#FF4444' },
  subtitle: {
    color: '#CCC',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  btn: {
    backgroundColor: '#444',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#888',
  },
  btnText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
