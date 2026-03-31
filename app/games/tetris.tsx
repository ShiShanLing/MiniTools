import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const COLS = 10;
const ROWS = 20;

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: '#00D2FF' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#007AFF' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#FF9500' },
  O: { shape: [[1, 1], [1, 1]], color: '#FFD60A' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#34C759' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#AF52DE' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#FF3B30' },
};

const RANDOM_TETROMINOS = 'I J L O S T Z'.split(' ');

/** 半透明圆形控制键（叠在游戏区上） */
const GLASS_BTN = {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: 'rgba(0, 0, 0, 0.38)',
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: 'rgba(255,255,255,0.25)',
};

const SOFT_DROP_ACCEL_DELAY_MS = 320;
const GRAVITY_MS_NORMAL = 800;
const GRAVITY_MS_FAST = 55;
/** 满行闪烁：交替次数 × 间隔后消除 */
const LINE_FLASH_STEPS = 6;
const LINE_FLASH_INTERVAL_MS = 70;

export default function TetrisGame() {
  const insets = useSafeAreaInsets();
  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const [board, setBoard] = useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
  const [currentPiece, setCurrentPiece] = useState<{
    shape: number[][];
    color: string;
    pos: { x: number; y: number };
  } | null>(null);
  const [nextPieceType, setNextPieceType] = useState<string>(
    RANDOM_TETROMINOS[Math.floor(Math.random() * RANDOM_TETROMINOS.length)]
  );
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  /** 长按「下」触发后的快速重力 */
  const [acceleratedDrop, setAcceleratedDrop] = useState(false);
  /** 正在消除的满行行号（闪烁阶段） */
  const [flashingRows, setFlashingRows] = useState<number[] | null>(null);
  /** 闪烁高亮相位 */
  const [lineFlashBright, setLineFlashBright] = useState(true);

  const gameLoop = useRef<ReturnType<typeof setInterval> | null>(null);
  const softDropLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineClearAnimRef = useRef(false);
  const pendingLineClearRef = useRef<{
    mergedBoard: (string | number)[][];
    clearedLines: number;
  } | null>(null);
  const lineFlashIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boardRef = useRef(board);
  const currentPieceRef = useRef(currentPiece);
  boardRef.current = board;
  currentPieceRef.current = currentPiece;

  /** 整屏可用区计算格子：公式不变（仍取宽高上限内的最大正方形格），棋盘比「给 HUD 让位」时更大 */
  const slotW = layout.w > 0 ? layout.w : 0;
  const slotH = layout.h > 0 ? layout.h : 0;

  const cellSize =
    slotW > 0 && slotH > 0
      ? Math.max(8, Math.min(Math.floor(slotW / COLS), Math.floor(slotH / ROWS)))
      : 14;

  const boardWidth = cellSize * COLS;
  const boardHeight = cellSize * ROWS;

  const previewCell = Math.max(10, Math.min(16, Math.floor(cellSize * 0.45)));

  const onGameLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ w: width, h: height });
  };

  const checkCollision = (pos: { x: number; y: number }, shape: number[][]) => {
    const b = boardRef.current;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && b[newY][newX] !== 0)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const spawnPiece = () => {
    const type = nextPieceType as keyof typeof TETROMINOS;
    const piece = TETROMINOS[type];
    const newPiece = {
      shape: piece.shape,
      color: piece.color,
      pos: { x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2), y: 0 },
    };

    setNextPieceType(RANDOM_TETROMINOS[Math.floor(Math.random() * RANDOM_TETROMINOS.length)]);

    if (checkCollision(newPiece.pos, newPiece.shape)) {
      setIsGameOver(true);
      setIsPaused(true);
      currentPieceRef.current = null;
      setCurrentPiece(null);
    } else {
      currentPieceRef.current = newPiece;
      setCurrentPiece(newPiece);
    }
  };

  const applyLineClearAndSpawn = () => {
    const pending = pendingLineClearRef.current;
    pendingLineClearRef.current = null;
    lineClearAnimRef.current = false;
    setFlashingRows(null);
    setLineFlashBright(true);
    if (!pending) return;

    const { mergedBoard, clearedLines } = pending;
    let n = 0;
    const filteredBoard = mergedBoard.filter((row) => {
      const isFull = row.every((cell) => cell !== 0);
      if (isFull) n++;
      return !isFull;
    });
    while (filteredBoard.length < ROWS) {
      filteredBoard.unshift(Array(COLS).fill(0));
    }

    if (clearedLines > 0) {
      setScore((s) => s + [0, 100, 300, 500, 800][clearedLines]);
    }
    boardRef.current = filteredBoard;
    setBoard(filteredBoard);
    spawnPiece();
  };

  const mergePiece = () => {
    const cp = currentPieceRef.current;
    if (!cp) return;

    const newBoard = boardRef.current.map((row) => [...row]);
    cp.shape.forEach((row, sy) => {
      row.forEach((value, sx) => {
        if (value !== 0) {
          const boardY = cp.pos.y + sy;
          const boardX = cp.pos.x + sx;
          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            newBoard[boardY][boardX] = cp.color;
          }
        }
      });
    });

    const fullRowIndices: number[] = [];
    for (let i = 0; i < ROWS; i++) {
      if (newBoard[i].every((cell) => cell !== 0)) fullRowIndices.push(i);
    }

    if (fullRowIndices.length === 0) {
      boardRef.current = newBoard;
      setBoard(newBoard);
      spawnPiece();
      return;
    }

    lineClearAnimRef.current = true;
    pendingLineClearRef.current = {
      mergedBoard: newBoard,
      clearedLines: fullRowIndices.length,
    };
    currentPieceRef.current = null;
    setCurrentPiece(null);
    boardRef.current = newBoard;
    setBoard(newBoard);
    setLineFlashBright(true);
    setFlashingRows(fullRowIndices);
  };

  const move = (dir: { x: number; y: number }) => {
    const piece = currentPieceRef.current;
    if (!piece || isPaused || isGameOver || lineClearAnimRef.current) return;
    const newPos = { x: piece.pos.x + dir.x, y: piece.pos.y + dir.y };
    if (!checkCollision(newPos, piece.shape)) {
      const updated = { ...piece, pos: newPos };
      currentPieceRef.current = updated;
      setCurrentPiece(updated);
    } else if (dir.y > 0) {
      mergePiece();
    }
  };

  const rotate = () => {
    const piece = currentPieceRef.current;
    if (!piece || isPaused || isGameOver || lineClearAnimRef.current) return;
    const newShape = piece.shape[0].map((_, i) => piece.shape.map((row) => row[i]).reverse());
    if (!checkCollision(piece.pos, newShape)) {
      const updated = { ...piece, shape: newShape };
      currentPieceRef.current = updated;
      setCurrentPiece(updated);
    }
  };

  /** 一键落到底；每格硬降 2 分（常见俄罗斯方块规则） */
  const hardDrop = () => {
    const piece = currentPieceRef.current;
    if (!piece || isPaused || isGameOver || lineClearAnimRef.current) return;
    let y = piece.pos.y;
    while (!checkCollision({ x: piece.pos.x, y: y + 1 }, piece.shape)) {
      y += 1;
    }
    const dist = y - piece.pos.y;
    if (dist > 0) {
      setScore((s) => s + dist * 2);
    }
    const landed = { ...piece, pos: { x: piece.pos.x, y } };
    currentPieceRef.current = landed;
    setCurrentPiece(landed);
    mergePiece();
  };

  const onSoftDownPressIn = () => {
    softDropLongPressTimer.current = setTimeout(() => {
      softDropLongPressTimer.current = null;
      setAcceleratedDrop(true);
    }, SOFT_DROP_ACCEL_DELAY_MS);
  };

  const onSoftDownPressOut = () => {
    if (softDropLongPressTimer.current) {
      clearTimeout(softDropLongPressTimer.current);
      softDropLongPressTimer.current = null;
    }
    setAcceleratedDrop(false);
  };

  useEffect(() => {
    return () => {
      if (softDropLongPressTimer.current) {
        clearTimeout(softDropLongPressTimer.current);
        softDropLongPressTimer.current = null;
      }
    };
  }, []);

  /** 重力间隔只随暂停/加速变，不因旋转改 currentPiece 而重置 */
  useEffect(() => {
    if (!isPaused && !isGameOver) {
      const ms = acceleratedDrop ? GRAVITY_MS_FAST : GRAVITY_MS_NORMAL;
      gameLoop.current = setInterval(() => move({ x: 0, y: 1 }), ms);
    } else {
      if (gameLoop.current) clearInterval(gameLoop.current);
    }
    return () => {
      if (gameLoop.current) clearInterval(gameLoop.current);
    };
  }, [isPaused, isGameOver, acceleratedDrop]);

  /** 仅在继续游戏/开局时补子，不依赖 currentPiece，避免旋转、消行闪烁触发 */
  useEffect(() => {
    if (isPaused || isGameOver || lineClearAnimRef.current) return;
    if (!currentPieceRef.current) {
      spawnPiece();
    }
  }, [isPaused, isGameOver]);

  useEffect(() => {
    if (!flashingRows?.length) {
      if (lineFlashIntervalRef.current) {
        clearInterval(lineFlashIntervalRef.current);
        lineFlashIntervalRef.current = null;
      }
      return;
    }
    let step = 0;
    lineFlashIntervalRef.current = setInterval(() => {
      step += 1;
      setLineFlashBright((b) => !b);
      if (step >= LINE_FLASH_STEPS) {
        if (lineFlashIntervalRef.current) {
          clearInterval(lineFlashIntervalRef.current);
          lineFlashIntervalRef.current = null;
        }
        applyLineClearAndSpawn();
      }
    }, LINE_FLASH_INTERVAL_MS);
    return () => {
      if (lineFlashIntervalRef.current) {
        clearInterval(lineFlashIntervalRef.current);
        lineFlashIntervalRef.current = null;
      }
    };
  }, [flashingRows]);

  const resetGame = () => {
    if (lineFlashIntervalRef.current) {
      clearInterval(lineFlashIntervalRef.current);
      lineFlashIntervalRef.current = null;
    }
    lineClearAnimRef.current = false;
    pendingLineClearRef.current = null;
    setFlashingRows(null);
    setLineFlashBright(true);
    const empty = Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(0));
    boardRef.current = empty;
    setBoard(empty);
    currentPieceRef.current = null;
    setCurrentPiece(null);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(true);
    setNextPieceType(RANDOM_TETROMINOS[Math.floor(Math.random() * RANDOM_TETROMINOS.length)]);
  };

  const nextPiece = TETROMINOS[nextPieceType as keyof typeof TETROMINOS];
  const previewPad = 8;
  const previewBoxW = 4 * (previewCell + 2) + previewPad * 2;
  const previewBoxH = 4 * (previewCell + 2) + previewPad * 2;

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen options={{ title: '俄罗斯方块', headerShown: true, headerBackTitle: '🎮 游戏' }} />

      <View style={styles.gameFill} onLayout={onGameLayout}>
        {/* 全屏游戏底 */}
        <View style={[StyleSheet.absoluteFill, styles.gameBackdrop]} />

        {/* 棋盘：相对父级铺满，居中；分数/预览/按键叠在更高 zIndex，不占布局高度 */}
        <View style={styles.boardSlot} pointerEvents="box-none">
          <View style={[styles.board, { width: boardWidth, height: boardHeight }]}>
            {board.map((row, rowY) => (
              <View key={`row-${rowY}`} style={[styles.boardRow, { height: cellSize, width: boardWidth }]}>
                {row.map((cell, colX) => {
                  const isFlashing = flashingRows?.includes(rowY);
                  const flashBg =
                    isFlashing && lineFlashBright ? '#FFFFFF' : isFlashing ? 'rgba(255,255,255,0.2)' : null;
                  return (
                    <View
                      key={`${colX}-${rowY}`}
                      style={[
                        styles.cell,
                        { width: cellSize, height: cellSize },
                        flashBg != null ? { backgroundColor: flashBg } : cell !== 0 && { backgroundColor: cell as string },
                      ]}
                    />
                  );
                })}
              </View>
            ))}
            {currentPiece && (
              <View style={styles.pieceLayer} pointerEvents="none">
                {currentPiece.shape.map((row, sy) =>
                  row.map((value, sx) => {
                    if (value === 0) return null;
                    const gy = currentPiece.pos.y + sy;
                    const gx = currentPiece.pos.x + sx;
                    if (gy >= ROWS || gx < 0 || gx >= COLS) return null;
                    return (
                      <View
                        key={`p-${sx}-${sy}`}
                        style={[
                          styles.cell,
                          {
                            width: cellSize,
                            height: cellSize,
                            backgroundColor: currentPiece.color,
                            position: 'absolute',
                            top: gy * cellSize,
                            left: gx * cellSize,
                          },
                        ]}
                      />
                    );
                  })
                )}
              </View>
            )}

            {(isGameOver || isPaused) && (
              <View style={styles.overlay}>
                <ThemedText style={styles.overlayText}>{isGameOver ? '游戏结束' : '已暂停'}</ThemedText>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => {
                    if (isGameOver) resetGame();
                    else setIsPaused(false);
                  }}
                >
                  <ThemedText style={styles.btnText}>{isGameOver ? '重新开始' : '继续游戏'}</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* 左上：分数（半透明条，不单独占一栏） */}
        <View style={[styles.topBar, { top: Math.max(insets.top, 8) }]} pointerEvents="box-none">
          <View style={styles.scorePill}>
            <ThemedText style={styles.scoreText}>分数 {score}</ThemedText>
            <TouchableOpacity onPress={resetGame} hitSlop={12}>
              <MaterialIcons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 右上：下一块 — 白底 */}
        <View style={[styles.nextWrap, { top: Math.max(insets.top, 8) }]} pointerEvents="none">
          <View style={[styles.nextCard, { width: previewBoxW, minHeight: previewBoxH }]}>
            <ThemedText style={styles.nextLabel}>下一个</ThemedText>
            <View style={styles.previewInner}>
              {nextPiece.shape.map((row, y) => (
                <View key={y} style={styles.previewRow}>
                  {row.map((val, x) => (
                    <View
                      key={x}
                      style={[
                        styles.previewCell,
                        {
                          width: previewCell,
                          height: previewCell,
                          margin: 1,
                        },
                        val !== 0 && { backgroundColor: nextPiece.color },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 底部：旋转/移动叠在盘面上；上键=变形(旋转) */}
        <View
          style={[styles.controlsOverlay, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}
          pointerEvents="box-none"
        >
          <View style={styles.dPadColumn}>
            <TouchableOpacity style={GLASS_BTN} onPress={rotate} activeOpacity={0.65}>
              <MaterialIcons name="rotate-right" size={32} color="#fff" />
            </TouchableOpacity>
            <View style={styles.dPadRow}>
              <TouchableOpacity style={GLASS_BTN} onPress={() => move({ x: -1, y: 0 })} activeOpacity={0.65}>
                <MaterialIcons name="keyboard-arrow-left" size={34} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[GLASS_BTN, acceleratedDrop && styles.glassBtnActive]}
                onPress={() => move({ x: 0, y: 1 })}
                onPressIn={onSoftDownPressIn}
                onPressOut={onSoftDownPressOut}
                activeOpacity={0.65}
              >
                <MaterialIcons name="keyboard-arrow-down" size={34} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={GLASS_BTN} onPress={() => move({ x: 1, y: 0 })} activeOpacity={0.65}>
                <MaterialIcons name="keyboard-arrow-right" size={34} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={GLASS_BTN} onPress={hardDrop} activeOpacity={0.65}>
              <MaterialIcons name="vertical-align-bottom" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  gameFill: {
    flex: 1,
    position: 'relative',
  },
  gameBackdrop: {
    backgroundColor: '#0a0a0b',
    zIndex: 0,
  },
  boardSlot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  board: {
    backgroundColor: '#1C1C1E',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'column',
  },
  boardRow: {
    flexDirection: 'row',
    flexShrink: 0,
  },
  pieceLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  topBar: {
    position: 'absolute',
    left: 12,
    zIndex: 50,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scoreText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  nextWrap: {
    position: 'absolute',
    right: 12,
    zIndex: 50,
  },
  nextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  nextLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#636366',
    marginBottom: 6,
    textAlign: 'center',
  },
  previewInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRow: {
    flexDirection: 'row',
  },
  previewCell: {
    borderRadius: 3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  overlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  dPadColumn: {
    alignItems: 'center',
    gap: 14,
  },
  dPadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  glassBtnActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.45)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
