import type { GameState, MoveError } from './game.js';

export type RendererError = MoveError | 'invalid_input';

export interface Renderer {
  render(state: GameState): void;
  showError(code: RendererError): void;
  showGoodbye(): void;
}

const ERROR_MESSAGES: Record<RendererError, string> = {
  invalid_input: 'Enter a square number from 1 to 9, or q to quit.',
  invalid_position: 'Choose a square number from 1 to 9.',
  occupied: 'That square is already taken. Choose an empty square.',
  game_over: 'This game is already over.',
};

export function createCliRenderer(
  output: { write(text: string): unknown } = process.stdout,
): Renderer {
  return {
    render(state) {
      const cells = state.board.map((cell, index) => cell ?? String(index + 1));
      const rows = [0, 3, 6].map((start) => (
        ` ${cells.slice(start, start + 3).join(' | ')} `
      ));

      let status;
      if (state.status === 'won') {
        status = `Player ${state.winner} wins!`;
      } else if (state.status === 'draw') {
        status = "It's a draw!";
      } else {
        status = `Player ${state.currentPlayer}'s turn. Choose a square (1-9), or q to quit.`;
      }

      output.write(`\n${rows.join('\n---+---+---\n')}\n\n${status}\n`);
    },

    showError(code) {
      output.write(`${ERROR_MESSAGES[code] ?? 'Unable to make that move.'}\n`);
    },

    showGoodbye() {
      output.write('Game ended. Goodbye!\n');
    },
  };
}
