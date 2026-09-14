import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame } from '../src/game.js';
import type { GameState } from '../src/game.js';
import { createCliRenderer } from '../src/renderer.js';

function captureRenderer() {
  let text = '';
  const output = { write(chunk: string) { text += chunk; } };
  return { renderer: createCliRenderer(output), text: () => text };
}

function state(overrides: Partial<GameState> = {}): GameState {
  return { ...createGame(), ...overrides };
}

test('renderer displays a numbered 3 by 3 board and turn instructions', () => {
  const output = captureRenderer();
  output.renderer.render(state());

  assert.ok(output.text().includes(' 1 | 2 | 3 \n---+---+---\n 4 | 5 | 6 \n---+---+---\n 7 | 8 | 9 '));
  assert.match(output.text(), /Player X's turn/);
  assert.match(output.text(), /1-9/);
  assert.match(output.text(), /q to quit/);
});

test('renderer displays marks while preserving numbers for empty squares', () => {
  const output = captureRenderer();
  output.renderer.render(state({
    board: ['X', null, 'O', null, 'X', null, null, 'O', null],
    currentPlayer: 'O',
  }));

  assert.ok(output.text().includes(' X | 2 | O \n---+---+---\n 4 | X | 6 \n---+---+---\n 7 | O | 9 '));
  assert.match(output.text(), /Player O's turn/);
});

test('renderer announces the winner without prompting for another turn', () => {
  const output = captureRenderer();
  output.renderer.render(state({
    board: ['X', 'X', 'X', 'O', 'O', null, null, null, null],
    currentPlayer: null,
    status: 'won',
    winner: 'X',
    winningLine: [0, 1, 2],
  }));

  assert.match(output.text(), /Player X wins!/);
  assert.doesNotMatch(output.text(), /turn|Choose a square/);
});

test('renderer announces a draw without prompting for another turn', () => {
  const output = captureRenderer();
  output.renderer.render(state({
    board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
    currentPlayer: null,
    status: 'draw',
  }));

  assert.match(output.text(), /draw/i);
  assert.doesNotMatch(output.text(), /turn|Choose a square/);
});

test('renderer explains each supported error and prints a goodbye', () => {
  for (const [code, message] of [
    ['invalid_input', /1 to 9, or q/],
    ['invalid_position', /square number from 1 to 9/],
    ['occupied', /already taken/],
    ['game_over', /already over/],
  ] as const) {
    const output = captureRenderer();
    output.renderer.showError(code);
    assert.match(output.text(), message);
  }

  const output = captureRenderer();
  output.renderer.showGoodbye();
  assert.match(output.text(), /Game ended/);
});
