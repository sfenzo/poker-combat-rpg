import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useGameStore, Enemy } from './src/state/gameStore';
import { useOverworldStore } from './src/state/overworldStore';
import OverworldScreen from './src/screens/OverworldScreen';
import BattleScreen from './src/screens/BattleScreen';
import RewardScreen from './src/screens/RewardScreen';

type AppScreen = 'overworld' | 'battle' | 'reward';

interface RewardData {
  enemy: Enemy;
  turnWonOn: number;
  nodeId: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('overworld');
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [rewardData, setRewardData] = useState<RewardData | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);

  const initBattle = useGameStore(s => s.initBattle);
  const playerHP = useGameStore(s => s.playerHP);
  const playerMaxHP = useGameStore(s => s.playerMaxHP);
  const setPlayerHP = useGameStore(s => s.setPlayerHP);
  const maxTurnsPerRound = useGameStore(s => s.maxTurnsPerRound);
  const defeatNode = useOverworldStore(s => s.defeatNode);

  const handleStartBattle = (enemy: Enemy, nodeId: string) => {
    setCurrentEnemy(enemy);
    setCurrentNodeId(nodeId);
    initBattle(enemy);
    setCurrentScreen('battle');
  };

  const handleVictory = (turnWonOn: number) => {
    if (!currentEnemy || !currentNodeId) return;
    setRewardData({ enemy: currentEnemy, turnWonOn, nodeId: currentNodeId });
    setCurrentScreen('reward');
  };

  const handleDefeat = () => {
    // GameOverOverlay is shown inside BattleScreen — no screen transition needed
  };

  const handleRevive = () => {
    // Restore player HP to 50% and reinit battle with same enemy
    if (!currentEnemy) return;
    initBattle(currentEnemy);
    // After reinit, set HP to 50%
    const reviveHP = Math.ceil(playerMaxHP * 0.5);
    setPlayerHP(reviveHP);
  };

  const handleAccept = (coins: number) => {
    if (!rewardData) return;
    defeatNode(rewardData.nodeId, coins);
    setCurrentScreen('overworld');
    setRewardData(null);
    setCurrentEnemy(null);
    setCurrentNodeId(null);
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      {currentScreen === 'overworld' && (
        <OverworldScreen
          onStartBattle={(enemy, nodeId) => handleStartBattle(enemy, nodeId)}
        />
      )}
      {currentScreen === 'battle' && (
        <BattleScreen
          onVictory={handleVictory}
          onDefeat={handleDefeat}
          onRevive={handleRevive}
        />
      )}
      {currentScreen === 'reward' && rewardData && (
        <RewardScreen
          enemy={rewardData.enemy}
          turnWonOn={rewardData.turnWonOn}
          maxTurnsPerRound={maxTurnsPerRound}
          onAccept={handleAccept}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
