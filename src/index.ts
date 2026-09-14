import { createInterface } from 'node:readline';
import { applyMove, createGame } from './game.js';
import { createCliRenderer } from './renderer.js';

const renderer = createCliRenderer();
let game = createGame();
const input = createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
  terminal: false,
});

try {
  renderer.render(game);

  for await (const line of input) {
    const choice = line.trim();
    if (choice.toLowerCase() === 'q') break;

    if (!/^[1-9]$/.test(choice)) {
      renderer.showError('invalid_input');
      continue;
    }

    const result = applyMove(game, Number(choice) - 1);
    if (!result.ok) {
      renderer.showError(result.error);
      continue;
    }

    game = result.state;
    renderer.render(game);
    if (game.status !== 'playing') break;
  }

  if (game.status === 'playing') renderer.showGoodbye();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Unable to run the game: ${message}\n`);
  process.exitCode = 1;
} finally {
  input.close();
}
