import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useGameStore } from '../state/gameStore';
import { hasAnyValidMove } from '../game/aiLogic';
import EnemyArea from '../components/EnemyArea';
import PlayerArea from '../components/PlayerArea';
import BattleBoard from '../components/BattleBoard';
import HandResultBanner from '../components/HandResultBanner';
import GameOverOverlay from '../components/GameOverOverlay';

interface Props {
  onVictory: (turnWonOn: number) => void;
  onDefeat: () => void;
  onRevive: () => void;
}

export default function BattleScreen({ onVictory, onDefeat, onRevive }: Props) {
  const {
    grid, gridOwner, playerHand, enemyHand,
    playerHP, playerMaxHP, playerArmor,
    enemyHP, enemyMaxHP, enemyArmor,
    currentRound, currentTurn, maxTurnsPerRound,
    wildCharge, wildReady,
    selectedCards, pendingPlacement, lastHandResult,
    phase, currentEnemy, turnWonOn,
    toggleSelectCard, placeAtCell, playerPass, dismissHandResult, runEnemyTurn,
  } = useGameStore();

  const enemyTurnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase === 'enemyTurn') {
      enemyTurnTimerRef.current = setTimeout(() => {
        runEnemyTurn();
      }, 1200);
    }
    return () => {
      if (enemyTurnTimerRef.current) clearTimeout(enemyTurnTimerRef.current);
    };
  }, [phase]);

  // Notify parent when game ends
  useEffect(() => {
    if (phase === 'victory') onVictory(turnWonOn);
  }, [phase]);

  useEffect(() => {
    if (phase === 'defeat') onDefeat();
  }, [phase]);

  const enemy = { ...currentEnemy, currentHP: enemyHP, maxHP: enemyMaxHP, armor: enemyArmor };
  const activePlayerTurn = phase === 'playerTurn';

  // PASS only enabled when player genuinely can't make any valid hand
  const canPass = activePlayerTurn && !hasAnyValidMove(grid, playerHand, currentEnemy.damageTable);

  const isGameOver = phase === 'victory' || phase === 'defeat';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <EnemyArea
          enemy={enemy}
          enemyHand={enemyHand}
          isEnemyTurn={phase === 'enemyTurn'}
        />

        <View style={styles.turnBanner}>
          <Text style={styles.turnText}>
            ROUND {currentRound}{'  '}TURN {currentTurn}/{maxTurnsPerRound}
          </Text>
          {phase === 'enemyTurn' && (
            <Text style={styles.enemyThinkingText}>Enemy is thinking...</Text>
          )}
        </View>

        <View style={styles.boardContainer}>
          <BattleBoard
            grid={grid}
            gridOwner={gridOwner}
            selectedCards={selectedCards}
            pendingPlacement={pendingPlacement}
            lastHandResult={lastHandResult}
            isPlayerTurn={activePlayerTurn}
            canPass={canPass}
            wildCharge={wildCharge}
            wildReady={wildReady}
            onCellPress={placeAtCell}
            onPass={playerPass}
            onWild={() => {}}
          />

          {phase === 'handResult' && lastHandResult && (
            <HandResultBanner
              result={lastHandResult}
              onDismiss={dismissHandResult}
            />
          )}
        </View>

        <PlayerArea
          playerHP={playerHP}
          playerMaxHP={playerMaxHP}
          playerArmor={playerArmor}
          hand={playerHand}
          selectedCards={selectedCards}
          isPlayerTurn={activePlayerTurn}
          onCardPress={toggleSelectCard}
        />

        {activePlayerTurn && (
          <View style={styles.instructionStrip}>
            {selectedCards.length === 0 && !pendingPlacement && (
              <Text style={styles.instructionText}>Tap a card to select it</Text>
            )}
            {selectedCards.length >= 1 && !pendingPlacement && (
              <Text style={styles.instructionText}>Tap a glowing cell to place it</Text>
            )}
            {pendingPlacement && (
              <Text style={styles.instructionText}>Now tap the opposite endpoint to complete the hand</Text>
            )}
          </View>
        )}

        {isGameOver && (
          <GameOverOverlay
            type={phase as 'victory' | 'defeat'}
            enemyName={currentEnemy.name}
            onRevive={onRevive}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0D0D1A' },
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  turnBanner: {
    backgroundColor: '#2A2A40',
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  turnText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  enemyThinkingText: {
    color: '#FF8800',
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
  boardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  instructionStrip: {
    backgroundColor: '#1A1A30',
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  instructionText: {
    color: '#AAAACC',
    fontSize: 11,
    fontStyle: 'italic',
  },
});
