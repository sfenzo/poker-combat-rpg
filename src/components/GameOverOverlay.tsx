import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  type: 'victory' | 'defeat';
  enemyName: string;
  onRevive: () => void;
}

export default function GameOverOverlay({ type, enemyName, onRevive }: Props) {
  const isVictory = type === 'victory';

  return (
    <View style={styles.overlay}>
      <View style={[styles.bannerFrame, isVictory ? styles.victoryFrame : styles.defeatFrame]}>
        <Text style={[styles.bannerText, isVictory ? styles.victoryText : styles.defeatText]}>
          {isVictory ? 'VICTORY' : 'DEFEAT'}
        </Text>
        {isVictory && (
          <Text style={styles.subText}>You defeated {enemyName}!</Text>
        )}
      </View>

      {!isVictory && (
        <View style={styles.reviveSection}>
          <Text style={styles.revivePrompt}>Don't give up yet!</Text>
          <TouchableOpacity style={styles.reviveBtn} onPress={onRevive} activeOpacity={0.8}>
            <Text style={styles.reviveBtnText}>REVIVE FREE!</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    gap: 20,
  },
  bannerFrame: {
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 8,
    borderWidth: 3,
    alignItems: 'center',
  },
  victoryFrame: {
    backgroundColor: '#3A2800',
    borderColor: '#FFD700',
  },
  defeatFrame: {
    backgroundColor: '#2A0000',
    borderColor: '#AA2222',
  },
  bannerText: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 4,
  },
  victoryText: { color: '#FFD700' },
  defeatText: { color: '#FF4444' },
  subText: {
    color: '#CCCCCC',
    fontSize: 13,
    marginTop: 6,
    fontStyle: 'italic',
  },
  reviveSection: {
    alignItems: 'center',
    gap: 10,
  },
  revivePrompt: {
    color: '#CCCCCC',
    fontSize: 14,
    fontStyle: 'italic',
  },
  reviveBtn: {
    backgroundColor: '#22AA22',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#44FF44',
  },
  reviveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
