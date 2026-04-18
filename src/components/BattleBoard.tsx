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

function getCellType(row: number, col: number): 'center' | 'valid' | 'inner' {
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
  const { width, height } = useWindowDimensions();
  // Board fills available space — constrained to square
  const maxBoard = Math.min(width - 56, height * 0.52, 340);
  const boardSize = Math.floor(maxBoard);
  const cellSize = Math.floor(boardSize / 5);
  const cardFits = cellSize - 6;

  const highlightedCells = new Set<string>();
  if (lastHandResult) {
    lastHandResult.cells.forEach(([r, c]) => highlightedCells.add(`${r},${c}`));
  }

  const validTapTargets = new Set<string>();
  if (isPlayerTurn && !lastHandResult) {
    if (pendingPlacement) {
      const opp = getOppositeCell(pendingPlacement.row, pendingPlacement.col);
      if (opp) validTapTargets.add(`${opp[0]},${opp[1]}`);
    } else if (selectedCards.length > 0) {
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
      <View style={[styles.board, { width: boardSize, height: boardSize }]}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r},${c}`;
            const cellType = getCellType(r, c);
            const isHighlighted = highlightedCells.has(key);
            const isValidTarget = validTapTargets.has(key);
            const isPending = pendingPlacement?.row === r && pendingPlacement?.col === c;
            const owner = gridOwner[r][c];

            // Center border: cells at the edge of the 3×3
            const isCenterEdgeTop = r === 1 && c >= 1 && c <= 3;
            const isCenterEdgeBottom = r === 3 && c >= 1 && c <= 3;
            const isCenterEdgeLeft = c === 1 && r >= 1 && r <= 3;
            const isCenterEdgeRight = c === 3 && r >= 1 && r <= 3;

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
                  isCenterEdgeTop && styles.centerBorderTop,
                  isCenterEdgeBottom && styles.centerBorderBottom,
                  isCenterEdgeLeft && styles.centerBorderLeft,
                  isCenterEdgeRight && styles.centerBorderRight,
                  isValidTarget && styles.cellValidTarget,
                  isPending && styles.cellPending,
                  isHighlighted && styles.cellHighlighted,
                ]}
                onPress={() => canTap && onCellPress(r, c)}
                activeOpacity={canTap ? 0.6 : 1}
                disabled={!canTap}
              >
                {isPending && pendingPlacement ? (
                  <CardComponent card={pendingPlacement.card} state="selected" size={cardFits > 50 ? 'md' : 'sm'} />
                ) : cell ? (
                  <CardComponent card={cell} state={cardState} size={cardFits > 50 ? 'md' : 'sm'} />
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
          style={[styles.sideBtn, styles.wildBtn, (!wildReady || !isPlayerTurn) && styles.sideBtnDisabled]}
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
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#4A5A25',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2D3A10',
    overflow: 'hidden',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellCenter: {
    backgroundColor: '#6B7C3A',
  },
  // Gold border around center 3×3 edges
  centerBorderTop: {
    borderTopWidth: 2,
    borderTopColor: '#B8962E',
  },
  centerBorderBottom: {
    borderBottomWidth: 2,
    borderBottomColor: '#B8962E',
  },
  centerBorderLeft: {
    borderLeftWidth: 2,
    borderLeftColor: '#B8962E',
  },
  centerBorderRight: {
    borderRightWidth: 2,
    borderRightColor: '#B8962E',
  },
  cellValidTarget: {
    backgroundColor: 'rgba(80,200,80,0.22)',
  },
  cellPending: {
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  cellHighlighted: {
    backgroundColor: 'rgba(180,100,255,0.28)',
  },
  validDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(80,255,80,0.85)',
  },
  sideButtons: {
    marginLeft: 8,
    gap: 8,
  },
  sideBtn: {
    backgroundColor: '#3A4A18',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6A8A30',
    alignItems: 'center',
    minWidth: 44,
  },
  sideBtnDisabled: {
    opacity: 0.35,
  },
  wildBtn: {
    backgroundColor: '#6A3E00',
    borderColor: '#CC8800',
  },
  sideBtnText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
