// UI tests: key mapping (pure) and board rendering.

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseKey } from '../src/tui.mjs';
import { renderBoard } from '../src/render.mjs';
import { Minesweeper } from '../src/game.mjs';

const visible = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

test('parseKey maps keys to actions', () => {
  assert.equal(parseKey('\x1b[A'), 'up');
  assert.equal(parseKey('w'), 'up');
  assert.equal(parseKey('W'), 'up');
  assert.equal(parseKey('k'), 'up');
  assert.equal(parseKey('\x1b[B'), 'down');
  assert.equal(parseKey('s'), 'down');
  assert.equal(parseKey('j'), 'down');
  assert.equal(parseKey('\x1b[C'), 'right');
  assert.equal(parseKey('d'), 'right');
  assert.equal(parseKey('l'), 'right');
  assert.equal(parseKey('\x1b[D'), 'left');
  assert.equal(parseKey('a'), 'left');
  assert.equal(parseKey('h'), 'left');
  assert.equal(parseKey(' '), 'reveal');
  assert.equal(parseKey('f'), 'flag');
  assert.equal(parseKey('F'), 'flag');
  assert.equal(parseKey('\r'), 'activate');
  assert.equal(parseKey('\n'), 'activate');
  assert.equal(parseKey('\t'), 'chord');
  assert.equal(parseKey('c'), 'chord');
  assert.equal(parseKey('C'), 'chord');
  assert.equal(parseKey('x'), 'chord');
  assert.equal(parseKey('r'), 'restart');
  assert.equal(parseKey('R'), 'restart');
  assert.equal(parseKey('q'), 'quit');
  assert.equal(parseKey('Q'), 'quit');
  assert.equal(parseKey('\x1b'), 'quit');
  assert.equal(parseKey('\x03'), 'quit'); // Ctrl+C in raw mode
  assert.equal(parseKey('z'), null);
  assert.equal(parseKey(''), null);
});

test('renderBoard: box shape and header', () => {
  const g = new Minesweeper({ width: 3, height: 3, mineLayout: [4] });
  g.reveal(0, 0);
  const lines = renderBoard(g, { color: false });
  assert.equal(lines.length, 8); // top, header, 3 rows, mid, status, bottom
  assert.ok(lines[0].startsWith('┌') && lines[0].endsWith('┐'));
  assert.ok(lines[7].startsWith('└') && lines[7].endsWith('┘'));
  const lens = new Set(lines.map(visible).map((l) => l.length));
  assert.equal(lens.size, 1, 'all lines have the same visible width');
  assert.match(lines[1], /3×3/);
  assert.match(lines[1], /mines 1/);
  assert.match(lines[6], /PLAYING/);
  // (0,0) revealed with adjacent count 1; neighbors still hidden
  assert.ok(lines[2].includes(' 1· · '));
});

test('renderBoard: no ANSI in plain mode even with a cursor', () => {
  const g = new Minesweeper({ width: 3, height: 3, mineLayout: [4] });
  const text = renderBoard(g, { color: false, cursor: [1, 1] }).join('\n');
  assert.ok(!text.includes('\x1b['));
});

test('renderBoard: color mode has ANSI codes and cursor highlight', () => {
  const g = new Minesweeper({ width: 3, height: 3, mineLayout: [4] });
  const text = renderBoard(g, { color: true, cursor: [1, 1] }).join('\n');
  assert.ok(text.includes('\x1b['));
  assert.ok(text.includes('\x1b[7m'), 'cursor cell rendered inverted');
});

test('renderBoard: win shows unrevealed mines as flags', () => {
  const g = new Minesweeper({ width: 3, height: 3, mineLayout: [4] });
  for (const i of [0, 1, 2, 3, 5, 6, 7, 8]) {
    if (g.state === 'playing') g.reveal(Math.floor(i / 3), i % 3);
  }
  assert.equal(g.state, 'won');
  const lines = renderBoard(g, { color: false });
  assert.match(lines[6], /WON/);
  assert.ok(lines[3].includes(' 1⚑  1'), 'center mine rendered as a flag');
});

test('renderBoard: loss shows mines as asterisks', () => {
  const g = new Minesweeper({ width: 3, height: 3, mineLayout: [4] });
  g.reveal(1, 1); // the mine
  assert.equal(g.state, 'lost');
  const lines = renderBoard(g, { color: false });
  assert.match(lines[6], /LOST/);
  assert.ok(lines[3].includes('* '), 'mine rendered as *');
});
