import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ScrollView,
} from 'react-native';
import { useOverworldStore, ZoneNode } from '../state/overworldStore';
import { Enemy } from '../state/gameStore';

interface Props {
  onStartBattle: (enemy: Enemy, nodeId: string) => void;
}

const NODE_RADIUS = 28;

export default function OverworldScreen({ onStartBattle }: Props) {
  const { width, height } = useWindowDimensions();
  const {
    energy, maxEnergy, coins, nodes, playerNodeId, selectedNodeId,
    moveToNode, selectNode, spendEnergy,
  } = useOverworldStore();

  const { getEnemyForNode } = require('../state/overworldStore');

  const mapHeight = Math.max(height * 1.1, 600);

  const handleNodeTap = (node: ZoneNode) => {
    if (node.state === 'locked') return;

    if (playerNodeId === node.id) {
      // Second tap — show battle popup
      selectNode(node.id);
    } else {
      // First tap — move player to node
      moveToNode(node.id);
    }
  };

  const handleBattle = (node: ZoneNode) => {
    if (energy < node.energyCost) return;
    spendEnergy(node.energyCost);
    selectNode(null);
    const enemy = getEnemyForNode(node);
    onStartBattle(enemy, node.id);
  };

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.energyBadge}>
          <Text style={styles.energyText}>⚡ {energy}</Text>
          {energy >= maxEnergy && <Text style={styles.fullLabel}> FULL</Text>}
        </View>
        <Text style={styles.coinsBadge}>🪙 {coins}</Text>
      </View>

      {/* Map */}
      <ScrollView
        style={styles.mapScroll}
        contentContainerStyle={[styles.mapContent, { height: mapHeight }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Path lines between nodes */}
        {nodes.map((node, i) => {
          if (i === 0) return null;
          const prev = nodes[i - 1];
          const x1 = prev.position.x * width;
          const y1 = prev.position.y * mapHeight;
          const x2 = node.position.x * width;
          const y2 = node.position.y * mapHeight;
          const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
          const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
          return (
            <View
              key={`path_${i}`}
              style={[
                styles.pathLine,
                {
                  width: length,
                  left: x1,
                  top: y1,
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: '0 50%',
                },
              ]}
            />
          );
        })}

        {/* START label */}
        <View style={[styles.landmark, { left: width * 0.35, top: mapHeight * 0.88 }]}>
          <Text style={styles.landmarkText}>START</Text>
        </View>

        {/* EXIT label */}
        <View style={[styles.landmark, { left: width * 0.4, top: mapHeight * 0.06 }]}>
          <Text style={styles.landmarkText}>EXIT</Text>
        </View>

        {/* Nodes */}
        {nodes.map(node => {
          const cx = node.position.x * width - NODE_RADIUS;
          const cy = node.position.y * mapHeight - NODE_RADIUS;
          const isDefeated = node.state === 'defeated';
          const isLocked = node.state === 'locked';
          const isPlayer = playerNodeId === node.id;
          const isSelected = selectedNodeId === node.id;

          return (
            <TouchableOpacity
              key={node.id}
              style={[
                styles.node,
                { left: cx, top: cy, width: NODE_RADIUS * 2, height: NODE_RADIUS * 2, borderRadius: NODE_RADIUS },
                isDefeated && styles.nodeDefeated,
                isLocked && styles.nodeLocked,
                !isDefeated && !isLocked && styles.nodeAvailable,
                isSelected && styles.nodeSelected,
              ]}
              onPress={() => handleNodeTap(node)}
              disabled={isLocked}
              activeOpacity={0.7}
            >
              <Text style={styles.nodeEmoji}>
                {isDefeated ? '💀' : isLocked ? '🔒' : '👾'}
              </Text>
              {isPlayer && !isDefeated && (
                <View style={styles.playerMarker}>
                  <Text style={styles.playerEmoji}>🧙‍♀️</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Node labels */}
        {nodes.map(node => (
          <View
            key={`label_${node.id}`}
            style={[styles.nodeLabel, {
              left: node.position.x * width - 50,
              top: node.position.y * mapHeight + NODE_RADIUS + 4,
            }]}
          >
            <Text style={[styles.nodeLabelText, node.state === 'locked' && styles.nodeLabelLocked]}>
              {node.label}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Battle popup */}
      {selectedNode && (
        <View style={styles.popupOverlay}>
          <View style={styles.popup}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => selectNode(null)}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.popupEmoji}>👾</Text>
            <Text style={styles.popupName}>{selectedNode.label}</Text>
            <TouchableOpacity
              style={[styles.battleBtn, energy < selectedNode.energyCost && styles.battleBtnDisabled]}
              onPress={() => handleBattle(selectedNode)}
              disabled={energy < selectedNode.energyCost}
              activeOpacity={0.8}
            >
              <Text style={styles.battleBtnText}>BATTLE ⚡ {selectedNode.energyCost}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#2A3A10',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A2A08',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#4A6A18',
  },
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A3A10',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  energyText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '800',
  },
  fullLabel: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600',
  },
  coinsBadge: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '800',
  },
  mapScroll: {
    flex: 1,
  },
  mapContent: {
    position: 'relative',
  },
  pathLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#6A8A30',
    borderRadius: 2,
    opacity: 0.7,
  },
  landmark: {
    position: 'absolute',
    backgroundColor: '#1A2A08',
    borderWidth: 1,
    borderColor: '#6A8A30',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  landmarkText: {
    color: '#AACCAA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  nodeAvailable: {
    backgroundColor: '#4A6A18',
    borderColor: '#FFD700',
  },
  nodeDefeated: {
    backgroundColor: '#2A2A2A',
    borderColor: '#666',
  },
  nodeLocked: {
    backgroundColor: '#1A1A1A',
    borderColor: '#333',
  },
  nodeSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  nodeEmoji: {
    fontSize: 20,
  },
  playerMarker: {
    position: 'absolute',
    top: -28,
    alignItems: 'center',
  },
  playerEmoji: {
    fontSize: 22,
  },
  nodeLabel: {
    position: 'absolute',
    width: 100,
    alignItems: 'center',
  },
  nodeLabelText: {
    color: '#CCDDAA',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  nodeLabelLocked: {
    color: '#666',
  },
  popupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popup: {
    backgroundColor: '#F5E6C8',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#B8962E',
    padding: 24,
    alignItems: 'center',
    width: 240,
    gap: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 12,
  },
  closeBtnText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '700',
  },
  popupEmoji: {
    fontSize: 48,
  },
  popupName: {
    color: '#3A2800',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  battleBtn: {
    backgroundColor: '#3A2800',
    borderWidth: 2,
    borderColor: '#B8962E',
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 4,
  },
  battleBtnDisabled: {
    opacity: 0.4,
  },
  battleBtnText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
