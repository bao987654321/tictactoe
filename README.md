# CLI Tic-Tac-Toe

Two players share a terminal. X starts. Enter `1–9` to choose a square, or `q` to quit. Three in a row wins; a full board without a winner is a draw. Invalid moves preserve your turn.

```text
 1 | 2 | 3
---+---+---
 4 | 5 | 6
---+---+---
 7 | 8 | 9
```

## Run

Requires Node.js 22 or later. TypeScript and Node types are development dependencies; the game has no runtime dependencies.

```sh
npm install
npm start
npm test
npm run typecheck
```

The start and test commands compile TypeScript first. `npm run build` compiles to `dist/`; run the compiled game with `node dist/src/index.js`.

## Structure

- `src/game.ts`: pure game rules; `createGame()` starts a game and `applyMove(game, position)` returns a new state or an error. Positions are zero-based.
- `src/renderer.ts`: all board, prompt, and result formatting. Replace this module to change presentation.
- `src/index.ts`: reads lines, applies moves, and calls the renderer.

Tests are TypeScript too, covering rules, rendering, and complete CLI games, including invalid input, quitting, and EOF. Node's built-in test runner runs the compiled tests. Strict type checking covers both source and tests.
