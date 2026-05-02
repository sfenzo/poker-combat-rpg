import { create } from 'zustand';
import { PROTOTYPE_ENEMIES, Enemy } from './gameStore';

export type NodeState = 'available' | 'defeated' | 'locked';

export interface ZoneNode {
  id: string;
  enemyId: string;
  label: string;
  position: { x: number; y: number }; // percentage of screen (0-1)
  state: NodeState;
  energyCost: number;
}

interface OverworldState {
  energy: number;
  maxEnergy: number;
  coins: number;
  nodes: ZoneNode[];
  playerNodeId: string | null;
  selectedNodeId: string | null;
}

interface OverworldActions {
  moveToNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  defeatNode: (nodeId: string, coinsEarned: number) => void;
  reviveAtNode: (nodeId: string) => void;
  spendEnergy: (amount: number) => void;
}

const INITIAL_NODES: ZoneNode[] = [
  {
    id: 'node_ulfr_pup',
    enemyId: 'ulfr_pup',
    label: 'ULFR PUP',
    position: { x: 0.5, y: 0.72 },
    state: 'available',
    energyCost: 0,
  },
  {
    id: 'node_ulfr',
    enemyId: 'ulfr',
    label: 'ULFR',
    position: { x: 0.35, y: 0.48 },
    state: 'locked',
    energyCost: 1,
  },
  {
    id: 'node_mauler_bear',
    enemyId: 'mauler_bear',
    label: 'MAULER BEAR',
    position: { x: 0.55, y: 0.24 },
    state: 'locked',
    energyCost: 1,
  },
];

export const useOverworldStore = create<OverworldState & OverworldActions>((set, get) => ({
  energy: 10,
  maxEnergy: 10,
  coins: 0,
  nodes: INITIAL_NODES,
  playerNodeId: null,
  selectedNodeId: null,

  moveToNode: (nodeId) => {
    set({ playerNodeId: nodeId, selectedNodeId: null });
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  defeatNode: (nodeId, coinsEarned) => {
    const { nodes, coins } = get();
    const nodeIndex = nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;

    const updatedNodes = nodes.map((n, i) => {
      if (i === nodeIndex) return { ...n, state: 'defeated' as NodeState };
      if (i === nodeIndex + 1) return { ...n, state: 'available' as NodeState };
      return n;
    });

    set({ nodes: updatedNodes, coins: coins + coinsEarned, selectedNodeId: null });
  },

  reviveAtNode: (_nodeId) => {
    // No state change needed — BattleScreen handles HP restore
  },

  spendEnergy: (amount) => {
    const { energy } = get();
    set({ energy: Math.max(0, energy - amount) });
  },
}));

export function getEnemyForNode(node: ZoneNode): Enemy {
  return PROTOTYPE_ENEMIES.find(e => e.id === node.enemyId) ?? PROTOTYPE_ENEMIES[0];
}
