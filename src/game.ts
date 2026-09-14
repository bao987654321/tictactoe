export type Player = 'X' | 'O';

export interface GameState {
  board: (Player | null)[];
  currentPlayer: Player | null;
  status: 'playing' | 'won' | 'draw';
  winner: Player | null;
  winningLine: number[] | null;
}

export type MoveError = 'invalid_position' | 'occupied' | 'game_over';

export type MoveResult =
  | { ok: true; state: GameState }
  | { ok: false; state: GameState; error: MoveError };

const WINNING_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createGame(): GameState {
  return {
    board: Array<Player | null>(9).fill(null),
    currentPlayer: 'X',
    status: 'playing',
    winner: null,
    winningLine: null,
  };
}

export function applyMove(state: GameState, position: unknown): MoveResult {
  if (state.status !== 'playing') {
    return { ok: false, state, error: 'game_over' };
  }

  if (
    typeof position !== 'number' ||
    !Number.isInteger(position) ||
    position < 0 ||
    position > 8
  ) {
    return { ok: false, state, error: 'invalid_position' };
  }

  if (state.board[position] !== null) {
    return { ok: false, state, error: 'occupied' };
  }

  const board = [...state.board];
  board[position] = state.currentPlayer;

  const winningLine = WINNING_LINES.find((line) =>
    line.every((index) => board[index] === state.currentPlayer),
  );
  const status = winningLine
    ? 'won'
    : board.every((cell) => cell !== null)
      ? 'draw'
      : 'playing';

  return {
    ok: true,
    state: {
      board,
      currentPlayer:
        status === 'playing' ? (state.currentPlayer === 'X' ? 'O' : 'X') : null,
      status,
      winner: winningLine ? state.currentPlayer : null,
      winningLine: winningLine ? [...winningLine] : null,
    },
  };
}
