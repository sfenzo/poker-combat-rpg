import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Card as CardType, CENTER_CELLS, VALID_PLACEMENT_CELLS, getOppositeCell } from '../constants/gameConstants';
import { GridCell } from '../game/aiLogic';
import { HandResult } from '../state/gameStore';
import CardComponent from './Card';

interface Props {
  grid: GridCell[][];
  gridOwner: ('player' | 'enemy' | 'center' | null)[][];
  selectedCards: CardType[];
  pendingPlacement: { card: CardType; row: number; col: number } | null;
  lastHandResult: HandResult | null;
  isPlayerTurn: boolean;
  wildReady: boolean;
  onCellPress: (row: number, col: number) => void;
  onPass: () => void;
  onWild: () => void;
}

function getCellType(row: number, col: number): 'center' | 'valid' | 'corner' | 'inner' {
  const key = `${row},${col}`;
  if (CENTER_CELLS.has(key)) return 'center';
  if (VALID_PLACEMENT_CELLS.has(key)) return 'valid';
  return 'inner';
}

export default function BattleBoard({
  grid,
  gridOwner,
  selectedCards,
  pendingPlacement,
  lastHandResult,
  isPlayerTurn,
  wildReady,
  onCellPress,
  onPass,
  onWild,
}: Props) {
  const { width } = useWindowDimensions();
  // Board takes up most of the width, leaving room for side buttons
  const boardSize = Math.min(width - 60, 300);
  const cellSize = Math.floor(boardSize / 5);
  const cardSize = cellSize - 6;

  const highlightedCells = new Set<string>();
  if (lastHandResult) {
    lastHandResult.cells.forEach(([r, c]) => highlightedCells.add(`${r},${c}`));
  }

  // Determine valid tap targets for current selection state
  const validTapTargets = new Set<string>();
  if (isPlayerTurn && !lastHandResult) {
    if (pendingPlacement) {
      // Only the opposite cell is valid
      const opp = getOppositeCell(pendingPlacement.row, pendingPlacement.col);
      if (opp) validTapTargets.add(`${opp[0]},${opp[1]}`);
    } else if (selectedCards.length > 0) {
      // All valid empty placement cells
      for (const key of VALID_PLACEMENT_CELLS) {
        const [r, c] = key.split(',').map(Number);
        if (grid[r][c] === null) {
          const opp = getOppositeCell(r, c);
          if (opp && grid[opp[0]][opp[1]] === null) {
            validTapTargets.add(key);
          }
        }
      }
    }
  }

  return (
    <View style={styles.wrapper}>
      {/* Main board grid */}
      <View style={[styles.board, { width: boardSize, height: boardSize }]}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r},${c}`;
            const cellType = getCellType(r, c);
            const isHighlighted = highlightedCells.has(key);
            const isValidTarget = validTapTargets.has(key);
            const isPending = pendingPlacement?.row === r && pendingPlacement?.col === c;
            const owner = gridOwner[r][c];

            let cardState: 'default' | 'selected' | 'highlighted' | 'enemy' | 'center' = 'default';
            if (isHighlighted) cardState = 'highlighted';
            else if (owner === 'enemy') cardState = 'enemy';
            else if (owner === 'center') cardState = 'center';

            const canTap = isPlayerTurn && isValidTarget && !cell && !lastHandResult;

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.cell,
                  { width: cellSize, height: cellSize },
                  cellType === 'center' && styles.cellCenter,
                  isValidTarget && styles.cellValidTarget,
                  isPending && styles.cellPending,
                  isHighlighted && styles.cellHighlighted,
                ]}
                onPress={() => canTap && onCellPress(r, c)}
                activeOpacity={canTap ? 0.6 : 1}
                disabled={!canTap}
              >
                {isPending && pendingPlacement ? (
                  <CardComponent
                    card={pendingPlacement.card}
                    state="selected"
                    size={cardSize > 50 ? 'md' : 'sm'}
                  />
                ) : cell ? (
                  <CardComponent
                    card={cell}
                    state={cardState}
                    size={cardSize > 50 ? 'md' : 'sm'}
                  />
                ) : isValidTarget ? (
                  <View style={styles.validDot} />
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Side buttons */}
      <View style={styles.sideButtons}>
        <TouchableOpacity
          style={[styles.sideBtn, !isPlayerTurn && styles.sideBtnDisabled]}
          onPress={onPass}
          disabled={!isPlayerTurn}
          activeOpacity={0.7}
        >
          <Text style={styles.sideBtnText}>PASS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sideBtn, styles.wildBtn, !wildReady && styles.sideBtnDisabled]}
          onPress={onWild}
          disabled={!wildReady || !isPlayerTurn}
          activeOpacity={0.7}
        >
          <Text style={styles.sideBtnText}>WILD</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#5C6B30',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3D4E1A',
    overflow: 'hidden',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cellCenter: {
    backgroundColor: '#6B7C3A',
  },
  cellValidTarget: {
    backgroundColor: 'rgba(100,200,100,0.25)',
    borderColor: 'rgba(100,200,100,0.6)',
  },
  cellPending: {
    backgroundColor: 'rgba(255,215,0,0.15)',
  },
  cellHighlighted: {
    backgroundColor: 'rgba(180,100,255,0.25)',
  },
  validDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(100,255,100,0.8)',
  },
  sideButtons: {
    marginLeft: 6,
    gap: 8,
  },
  sideBtn: {
    backgroundColor: '#4A5A20',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6A8A30',
    alignItems: 'center',
    minWidth: 46,
  },
  sideBtnDisabled: {
    opacity: 0.4,
  },
  wildBtn: {
    backgroundColor: '#7A4A00',
    borderColor: '#CC8800',
  },
  sideBtnText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
