import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Card as CardType, CENTER_CELLS, VALID_PLACEMENT_CELLS, getOppositeCell, getHandCells } from '../constants/gameConstants';
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
  canPass: boolean;
  wildCharge: number;
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
  grid, gridOwner, selectedCards, pendingPlacement, lastHandResult,
  isPlayerTurn, canPass, wildCharge, wildReady, onCellPress, onPass, onWild,
}: Props) {
  const { width, height } = useWindowDimensions();
  const maxBoard = Math.min(width - 72, height * 0.52, 340);
  const boardSize = Math.floor(maxBoard);
  const cellSize = Math.floor(boardSize / 5);
  const cardSize = cellSize - 4;

  // Highlighted cells from last hand result
  const highlightedCells = new Set<string>();
  if (lastHandResult && !lastHandResult.isPass) {
    lastHandResult.cells.forEach(([r, c]) => highlightedCells.add(`${r},${c}`));
  }

  // Phase A: card selected, no pending — show all open valid endpoints with white stroke
  const phaseATargets = new Set<string>();
  // Phase B: pending placement set — show the active 5-card line, dim everything else
  const activeLine = new Set<string>();
  let phaseB = false;

  if (isPlayerTurn && !lastHandResult) {
    if (pendingPlacement) {
      phaseB = true;
      const opp = getOppositeCell(pendingPlacement.row, pendingPlacement.col);
      if (opp) {
        const lineCells = getHandCells(pendingPlacement.row, pendingPlacement.col, opp[0], opp[1]);
        lineCells.forEach(([r, c]) => activeLine.add(`${r},${c}`));
      }
    } else if (selectedCards.length > 0) {
      for (const key of VALID_PLACEMENT_CELLS) {
        const [r, c] = key.split(',').map(Number);
        if (grid[r][c] === null) {
          const opp = getOppositeCell(r, c);
          if (opp && grid[opp[0]][opp[1]] === null) {
            phaseATargets.add(key);
          }
        }
      }
    }
  }

  // Wild charge segments (4 bars, each = 25%)
  const wildSegments = [0, 1, 2, 3].map(i => wildCharge >= (i + 1) * 25);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.board, { width: boardSize, height: boardSize }]}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r},${c}`;
            const cellType = getCellType(r, c);
            const isHighlighted = highlightedCells.has(key);
            const isPhaseA = phaseATargets.has(key);
            const isInActiveLine = activeLine.has(key);
            const isPending = pendingPlacement?.row === r && pendingPlacement?.col === c;
            const isDimmed = phaseB && !isInActiveLine;
            const isOppositeTarget = phaseB && isInActiveLine && !cell && !isPending;
            const owner = gridOwner[r][c];

            const isCenterEdgeTop = r === 1 && c >= 1 && c <= 3;
            const isCenterEdgeBottom = r === 3 && c >= 1 && c <= 3;
            const isCenterEdgeLeft = c === 1 && r >= 1 && r <= 3;
            const isCenterEdgeRight = c === 3 && r >= 1 && r <= 3;

            let cardState: 'default' | 'selected' | 'highlighted' | 'enemy' | 'center' = 'default';
            if (isHighlighted) cardState = 'highlighted';
            else if (owner === 'enemy') cardState = 'enemy';
            else if (owner === 'center') cardState = 'center';

            const canTap = isPlayerTurn && !lastHandResult && !cell && !isPending &&
              (isPhaseA || isOppositeTarget);

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
                  isPhaseA && styles.cellPhaseA,
                  isOppositeTarget && styles.cellOppositeTarget,
                  isPending && styles.cellPending,
                  isHighlighted && styles.cellHighlighted,
                  isDimmed && styles.cellDimmed,
                ]}
                onPress={() => canTap && onCellPress(r, c)}
                activeOpacity={canTap ? 0.6 : 1}
                disabled={!canTap}
              >
                {isPending && pendingPlacement ? (
                  <CardComponent card={pendingPlacement.card} state="selected" cardWidth={cardSize} cardHeight={cardSize} />
                ) : cell ? (
                  <CardComponent card={cell} state={cardState} cardWidth={cardSize} cardHeight={cardSize} />
                ) : isPhaseA ? (
                  <View style={styles.phaseADot} />
                ) : isOppositeTarget ? (
                  <View style={styles.oppositeTargetDot} />
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Right side: PASS, wild charge bars, WILD */}
      <View style={styles.sideButtons}>
        <TouchableOpacity
          style={[styles.sideBtn, !canPass && styles.sideBtnDisabled]}
          onPress={onPass}
          disabled={!canPass}
          activeOpacity={0.7}
        >
          <Text style={styles.sideBtnText}>PASS</Text>
        </TouchableOpacity>

        <View style={styles.wildChargeContainer}>
          {wildSegments.map((filled, i) => (
            <View key={i} style={[styles.wildSegment, filled && styles.wildSegmentFilled]} />
          ))}
        </View>

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
  centerBorderTop: { borderTopWidth: 2, borderTopColor: '#B8962E' },
  centerBorderBottom: { borderBottomWidth: 2, borderBottomColor: '#B8962E' },
  centerBorderLeft: { borderLeftWidth: 2, borderLeftColor: '#B8962E' },
  centerBorderRight: { borderRightWidth: 2, borderRightColor: '#B8962E' },
  cellPhaseA: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cellOppositeTarget: {
    borderWidth: 2.5,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.15)',
  },
  cellPending: {
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  cellHighlighted: {
    backgroundColor: 'rgba(180,100,255,0.28)',
  },
  cellDimmed: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  phaseADot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  oppositeTargetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,215,0,0.9)',
  },
  sideButtons: {
    marginLeft: 8,
    alignItems: 'center',
    gap: 6,
  },
  sideBtn: {
    backgroundColor: '#3A4A18',
    paddingVertical: 10,
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
  wildChargeContainer: {
    gap: 3,
    alignItems: 'center',
  },
  wildSegment: {
    width: 30,
    height: 10,
    borderRadius: 3,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  wildSegmentFilled: {
    backgroundColor: '#FF8800',
    borderColor: '#FFAA00',
  },
});
