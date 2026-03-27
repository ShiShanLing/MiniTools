import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
/** 为顶部分数栏、间距、底部方向键预留的纵向空间（估算，略多留一点防裁切） */
const RESERVED_Y = 260;
const H_PADDING = 24;

function snapBoardSize(availW: number, availH: number): number {
  const raw = Math.min(Math.max(0, availW), Math.max(0, availH));
  const snapped = Math.floor(raw / GRID_SIZE) * GRID_SIZE;
  // 严格按剩余空间取整格，避免棋盘大于可视区域；无可分配宽度时给兜底边长
  return snapped > 0 ? snapped : GRID_SIZE * 8;
}

export default function SnakeGame() {
  const { width: winW, height: winH } = useWindowDimensions();
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  const [boardPx, setBoardPx] = useState(() =>
    snapBoardSize(winW - H_PADDING, winH - RESERVED_Y),
  );

  useEffect(() => {
    setBoardPx(snapBoardSize(winW - H_PADDING, winH - RESERVED_Y));
  }, [winW, winH]);

  const gameLoop = useRef<NodeJS.Timeout | null>(null);

  const onRootLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width < 1 || height < 1) return;
    const availW = width - H_PADDING;
    const availH = height - RESERVED_Y;
    setBoardPx(snapBoardSize(availW, availH));
  }, []);

  const cellSize = boardPx > 0 ? boardPx / GRID_SIZE : 0;

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        setIsPaused(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 10);
        generateFood();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food]);

  const generateFood = () => {
    setFood({
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    });
  };

  useEffect(() => {
    if (!isPaused && !isGameOver) {
      gameLoop.current = setInterval(moveSnake, 150) as any;
    } else {
      if (gameLoop.current) clearInterval(gameLoop.current);
    }
    return () => {
      if (gameLoop.current) clearInterval(gameLoop.current);
    };
  }, [isPaused, isGameOver, moveSnake]);

  const handlePress = (newDir: { x: number; y: number }) => {
    if (newDir.x !== -direction.x || newDir.y !== -direction.y) {
      setDirection(newDir);
    }
    if (isPaused) setIsPaused(false);
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(true);
    generateFood();
  };

  return (
    <ThemedView style={styles.container} onLayout={onRootLayout}>
      <Stack.Screen options={{ title: '贪吃蛇', headerShown: true, headerBackTitle: '游戏' }} />

      <View style={styles.column}>
        <View style={[styles.header, boardPx > 0 && { width: boardPx, maxWidth: '100%' }]}>
          <ThemedText style={styles.scoreText}>分数: {score}</ThemedText>
          <TouchableOpacity onPress={resetGame} hitSlop={12}>
            <MaterialIcons name="refresh" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.boardArea}>
          {boardPx > 0 && cellSize > 0 ? (
            <View style={[styles.board, { width: boardPx, height: boardPx }]}>
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isSnake = snake.some((s) => s.x === x && s.y === y);
                const isFood = food.x === x && food.y === y;
                const isHead = snake[0].x === x && snake[0].y === y;

                return (
                  <View
                    key={i}
                    style={[
                      styles.cell,
                      { width: cellSize, height: cellSize },
                      isSnake && styles.snakeCell,
                      isHead && styles.headCell,
                      isFood && [styles.foodCell, { borderRadius: cellSize / 2 }],
                    ]}
                  />
                );
              })}
              {(isGameOver || isPaused) && (
                <View style={styles.overlay}>
                  <ThemedText style={styles.overlayText}>
                    {isGameOver ? '游戏结束!' : '已暂停'}
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => {
                      if (isGameOver) resetGame();
                      else setIsPaused(false);
                    }}>
                    <ThemedText style={styles.startButtonText}>
                      {isGameOver ? '重新开始' : '继续游戏'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.dirBtn} onPress={() => handlePress({ x: 0, y: -1 })}>
              <MaterialIcons name="arrow-upward" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.dirBtn} onPress={() => handlePress({ x: -1, y: 0 })}>
              <MaterialIcons name="arrow-back" size={32} color="#fff" />
            </TouchableOpacity>
            <View style={{ width: 60 }} />
            <TouchableOpacity style={styles.dirBtn} onPress={() => handlePress({ x: 1, y: 0 })}>
              <MaterialIcons name="arrow-forward" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.dirBtn} onPress={() => handlePress({ x: 0, y: 1 })}>
              <MaterialIcons name="arrow-downward" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    alignSelf: 'stretch',
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  column: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    maxWidth: '100%',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '700',
  },
  boardArea: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    backgroundColor: '#F2F2F7',
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 8,
    overflow: 'hidden',
    alignContent: 'flex-start',
  },
  cell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  snakeCell: {
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  headCell: {
    backgroundColor: '#248A3D',
  },
  foodCell: {
    backgroundColor: '#FF3B30',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  controls: {
    marginTop: 16,
    flexShrink: 0,
    gap: 10,
    paddingBottom: 4,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  dirBtn: {
    width: 56,
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});
