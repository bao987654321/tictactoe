import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const entryPoint = fileURLToPath(new URL('../src/index.js', import.meta.url));

function play(input: string): string {
  const result = spawnSync(process.execPath, [entryPoint], {
    input,
    encoding: 'utf8',
    timeout: 5_000,
  });

  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  return result.stdout;
}

test('the CLI completes a piped winning game and ignores input after the win', () => {
  const output = play('1\n4\n2\n5\n3\n9\n');
  assert.match(output, /X wins/i);
  assert.match(output, /X\s*\|\s*X\s*\|\s*X/);
  assert.doesNotMatch(output, /game ended/i);
});

test('the CLI completes a piped draw', () => {
  const output = play('1\n2\n3\n5\n4\n6\n8\n7\n9\n');
  assert.match(output, /draw/i);
  assert.doesNotMatch(output, /game ended/i);
});

test('the CLI recovers from malformed input and occupied squares', () => {
  const invalid = ['', ' ', '0', '10', '-1', '1.0', '01', '1e0', '1 2', 'quit', 'x'];
  const output = play(`${invalid.join('\n')}\n1\n1\n4\n2\n5\n3\n`);
  const errors = output.match(/Enter a square number from 1 to 9, or q to quit\./g);
  assert.equal(errors?.length, invalid.length);
  assert.match(output, /occupied|taken/i);
  assert.match(output, /X wins/i);
});

test('the CLI accepts whitespace and CRLF, and stops at uppercase Q', () => {
  const output = play(' 5 \r\n\tQ\r\n1\r\n');
  assert.match(output, /4\s*\|\s*X\s*\|\s*6/);
  assert.doesNotMatch(output, / O \|/);
  assert.equal(output.match(/Game ended/g)?.length, 1);
});

for (const [name, moves, message] of [
  ['quitting', 'q\n', /Game ended/],
  ['winning', '1\n4\n2\n5\n3\n', /X wins/],
] as const) {
  test(`the CLI exits after ${name} while stdin stays open`, async (t) => {
    const child = spawn(process.execPath, [entryPoint], { timeout: 5_000 });
    t.after(() => child.kill());
    let output = '';
    let errors = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { errors += chunk; });
    const closed = once(child, 'close');
    child.stdin.write(moves);

    const [code, signal] = await closed;
    assert.equal(signal, null, 'CLI should exit without waiting for EOF');
    assert.equal(code, 0, errors);
    assert.equal(errors, '');
    assert.match(output, message);
  });
}

test('the CLI handles EOF, including a final move without a newline', () => {
  assert.match(play(''), /game ended/i);
  const output = play('5');
  assert.match(output, /4\s*\|\s*X\s*\|\s*6/);
  assert.match(output, /game ended/i);
});
