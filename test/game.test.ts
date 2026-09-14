import test from 'node:test';
import assert from 'node:assert/strict';
import { applyMove, createGame } from '../src/game.js';
import type { GameState } from '../src/game.js';

const winningCases = [
  { line: [0, 1, 2], opponentMoves: [3, 4, 6] },
  { line: [3, 4, 5], opponentMoves: [0, 1, 6] },
  { line: [6, 7, 8], opponentMoves: [0, 1, 3] },
  { line: [0, 3, 6], opponentMoves: [1, 2, 4] },
  { line: [1, 4, 7], opponentMoves: [0, 2, 3] },
  { line: [2, 5, 8], opponentMoves: [0, 1, 3] },
  { line: [0, 4, 8], opponentMoves: [1, 2, 3] },
  { line: [2, 4, 6], opponentMoves: [0, 1, 3] },
];

function play(positions: number[]): GameState {
  let state = createGame();
  for (const position of positions) {
    assert.equal(state.status, 'playing', 'game must be live before each move');
    const result = applyMove(state, position);
    assert.equal(result.ok, true, `expected move ${position} to succeed`);
    state = result.state;
  }
  return state;
}

test('a new game has an empty board and X starts', () => {
  assert.deepEqual(createGame(), {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    status: 'playing',
    winner: null,
    winningLine: null,
  });
});

test('legal moves place the current mark and alternate players', () => {
  const afterX = applyMove(createGame(), 4).state;
  assert.equal(afterX.board[4], 'X');
  assert.equal(afterX.currentPlayer, 'O');
  assert.equal(afterX.status, 'playing');
  assert.equal(afterX.winner, null);
  assert.equal(afterX.winningLine, null);

  const afterO = applyMove(afterX, 0).state;
  assert.equal(afterO.board[0], 'O');
  assert.equal(afterO.board[4], 'X');
  assert.equal(afterO.currentPlayer, 'X');
});

for (const player of ['X', 'O']) {
  for (const { line, opponentMoves } of winningCases) {
    test(`${player} wins on cells ${line.join(', ')}`, () => {
      const positions = player === 'X'
        ? [line[0], opponentMoves[0], line[1], opponentMoves[1], line[2]]
        : [opponentMoves[0], line[0], opponentMoves[1], line[1], opponentMoves[2], line[2]];
      const state = play(positions);

      assert.equal(state.status, 'won');
      assert.equal(state.winner, player);
      assert.deepEqual(state.winningLine, line);
      assert.equal(state.currentPlayer, null);
    });
  }
}

test('a full board without a winning line is a draw', () => {
  const state = play([0, 1, 2, 4, 3, 5, 7, 6, 8]);
  assert.equal(state.status, 'draw');
  assert.equal(state.currentPlayer, null);
  assert.equal(state.winner, null);
  assert.equal(state.winningLine, null);
  assert.equal(state.board.includes(null), false);
});

test('a winning ninth move takes precedence over a draw', () => {
  const state = play([0, 1, 4, 2, 5, 3, 6, 7, 8]);
  assert.equal(state.board.includes(null), false);
  assert.equal(state.status, 'won');
  assert.equal(state.winner, 'X');
  assert.deepEqual(state.winningLine, [0, 4, 8]);
  assert.equal(state.currentPlayer, null);
});

test('invalid positions and types preserve the original state', () => {
  const state = play([4]);
  Object.freeze(state.board);
  Object.freeze(state);
  const invalidPositions: unknown[] = [
    -1, 9, 10, 1.5, NaN, Infinity, -Infinity,
    '0', '', null, undefined, true, false, {}, [], 1n, Symbol('position'),
  ];

  for (const position of invalidPositions) {
    const result = applyMove(state, position);
    assert.equal(result.ok, false);
    assert.ok(!result.ok);
    assert.equal(result.error, 'invalid_position');
    assert.equal(result.state, state);
  }
  assert.equal(state.currentPlayer, 'O');
});

test('an occupied square preserves the board and current player', () => {
  const state = play([4]);
  Object.freeze(state.board);
  Object.freeze(state);
  const result = applyMove(state, 4);

  assert.deepEqual(result, { ok: false, state, error: 'occupied' });
  assert.equal(result.state, state);
  assert.equal(result.state.board[4], 'X');
  assert.equal(result.state.currentPlayer, 'O');
  assert.equal(applyMove(result.state, 0).state.board[0], 'O');
});

test('won and drawn games reject further moves', () => {
  const states = [
    play([0, 3, 1, 4, 2]),
    play([0, 1, 2, 4, 3, 5, 7, 6, 8]),
  ];

  for (const state of states) {
    Object.freeze(state.board);
    if (state.winningLine) Object.freeze(state.winningLine);
    Object.freeze(state);

    for (const position of [0, 8, -1]) {
      const result = applyMove(state, position);
      assert.deepEqual(result, { ok: false, state, error: 'game_over' });
      assert.equal(result.state, state);
    }
  }
});

test('a successful move creates new state without mutating its input', () => {
  const state = createGame();
  Object.freeze(state.board);
  Object.freeze(state);
  const result = applyMove(state, 0);

  assert.equal(result.ok, true);
  assert.notEqual(result.state, state);
  assert.notEqual(result.state.board, state.board);
  assert.deepEqual(state, createGame());
  assert.equal(result.state.board[0], 'X');
});

test('games and returned winning lines do not share mutable arrays', () => {
  const first = createGame();
  const second = createGame();
  assert.notEqual(first.board, second.board);
  first.board[0] = 'O';
  assert.deepEqual(second.board, Array(9).fill(null));

  const firstWin = play([0, 3, 1, 4, 2]);
  assert.ok(firstWin.winningLine);
  firstWin.winningLine[0] = 8;
  const secondWin = play([0, 3, 1, 4, 2]);
  assert.deepEqual(secondWin.winningLine, [0, 1, 2]);
});
