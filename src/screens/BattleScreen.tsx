import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useGameStore, PROTOTYPE_ENEMIES } from '../state/gameStore';
import EnemyArea from '../components/EnemyArea';
import PlayerArea from '../components/PlayerArea';
import BattleBoard from '../components/BattleBoard';
import HandResultBanner from '../components/HandResultBanner';
import GameOverOverlay from '../components/GameOverOverlay';

export default function BattleScreen() {
  const {
    grid,
    gridOwner,
    playerHand,
    enemyHand,
    playerHP,
    playerMaxHP,
    playerArmor,
    enemyHP,
    enemyMaxHP,
    enemyArmor,
    currentRound,
    currentTurn,
    maxTurnsPerRound,
    wildCharge,
    wildReady,
    selectedCards,
    pendingPlacement,
    lastHandResult,
    phase,
    currentEnemy,
    initBattle,
    toggleSelectCard,
    placeAtCell,
    playerPass,
    dismissHandResult,
    runEnemyTurn,
  } = useGameStore();

  const enemyTurnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initBattle(PROTOTYPE_ENEMIES[0]);
  }, []);

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

  const enemy = { ...currentEnemy, currentHP: enemyHP, maxHP: enemyMaxHP, armor: enemyArmor };
  const activePlayerTurn = phase === 'playerTurn';
  const isGameOver = phase === 'victory' || phase === 'defeat';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Enemy area */}
        <EnemyArea
          enemy={enemy}
          handCardCount={enemyHand.length}
          isEnemyTurn={phase === 'enemyTurn'}
        />

        {/* Turn banner */}
        <View style={styles.turnBanner}>
          <Text style={styles.turnText}>
            ROUND {currentRound}{'  '}TURN {currentTurn}/{maxTurnsPerRound}
          </Text>
          {phase === 'enemyTurn' && (
            <Text style={styles.enemyThinkingText}>Enemy is thinking...</Text>
          )}
        </View>

        {/* Battle board */}
        <View style={styles.boardContainer}>
          <BattleBoard
            grid={grid}
            gridOwner={gridOwner}
            selectedCards={selectedCards}
            pendingPlacement={pendingPlacement}
            lastHandResult={lastHandResult}
            isPlayerTurn={activePlayerTurn}
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

        {/* Player area */}
        <PlayerArea
          playerHP={playerHP}
          playerMaxHP={playerMaxHP}
          playerArmor={playerArmor}
          wildCharge={wildCharge}
          hand={playerHand}
          selectedCards={selectedCards}
          isPlayerTurn={activePlayerTurn}
          onCardPress={toggleSelectCard}
        />

        {/* Instruction strip */}
        {activePlayerTurn && (
          <View style={styles.instructionStrip}>
            {selectedCards.length === 0 && !pendingPlacement && (
              <Text style={styles.instructionText}>Tap a card to select it</Text>
            )}
            {selectedCards.length >= 1 && !pendingPlacement && (
              <Text style={styles.instructionText}>Tap a glowing cell, or select a 2nd card first</Text>
            )}
            {pendingPlacement && (
              <Text style={styles.instructionText}>Tap a card to place it on the opposite side</Text>
            )}
          </View>
        )}

        {/* Victory / Defeat overlay — no browser alert */}
        {isGameOver && (
          <GameOverOverlay
            type={phase as 'victory' | 'defeat'}
            enemyName={currentEnemy.name}
            onPlayAgain={() => initBattle(PROTOTYPE_ENEMIES[0])}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
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
