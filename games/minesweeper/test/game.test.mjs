// Core logic tests — node:test, zero dependencies.

import test from 'node:test';
import assert from 'node:assert/strict';
import { Minesweeper, mulberry32 } from '../src/game.mjs';

test('constructor defaults', () => {
  const g = new Minesweeper();
  assert.equal(g.width, 9);
  assert.equal(g.height, 9);
  assert.equal(g.mineCount, 10);
  assert.equal(g.state, 'playing');
  assert.equal(g.firstMove, true);
  assert.equal(g.startedAt, 0);
  assert.equal(g.minesLeft, 10);
});

test('constructor validation', () => {
  assert.throws(() => new Minesweeper({ width: 1 }));
  assert.throws(() => new Minesweeper({ width: 101 }));
  assert.throws(() => new Minesweeper({ width: 9.5 }));
  assert.throws(() => new Minesweeper({ height: 0 }));
  assert.throws(() => new Minesweeper({ mines: -1 }));
  assert.throws(() => new Minesweeper({ mines: 81 })); // == width*height
  assert.throws(() => new Minesweeper({ mines: 2.5 }));
  // boundary: mines = width*height - 1 is allowed
  assert.equal(new Minesweeper({ width: 3, height: 3, mines: 8 }).mineCount, 8);
});

test('mulberry32 is deterministic, bounded and seed-sensitive', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  const c = mulberry32(43);
  for (let i = 0; i < 100; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
  assert.notEqual(mulberry32(1)(), mulberry32(2)());
});

test('first reveal places mines: count, safety, determinism', () => {
  const g1 = new Minesweeper({ width: 9, height: 9, mines: 10, seed: 7 });
  assert.equal(g1.mines.reduce((s, m) => s + m, 0), 0, 'no mines before first reveal');
  g1.reveal(0, 0);
  assert.equal(g1.mines.reduce((s, m) => s + m, 0), 10);
  assert.equal(g1.mines[0], 0, 'first-click cell must be safe');
  assert.equal(g1.state, 'playing');

  // same seed → identical layout; different seed → different layout
  const g2 = new Minesweeper({ width: 9, height: 9, mines: 10, seed: 7 });
  g2.reveal(0, 0);
  assert.deepEqual(g2.mines, g1.mines);
  assert.deepEqual(g2.adj, g1.adj);
  const g3 = new Minesweeper({ width: 9, height: 9, mines: 10, seed: 8 });
  g3.reveal(0, 0);
  assert.notDeepEqual(g3.mines, g1.mines);
});

test('adjacency numbers match brute force', () => {
  function bruteAdj(game) {
    const out = new Uint8Array(game.width * game.height);
    for (let r = 0; r < game.height; r++) {
      for (let c = 0; c < game.width; c++) {
        if (game.mines[r * game.width + c]) continue;
        let n = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < game.height && nc >= 0 && nc < game.width && game.mines[nr * game.width + nc]) n++;
          }
        }
        out[r * game.width + c] = n;
      }
    }
    return out;
  }
  for (const seed of [1, 2, 3, 99]) {
    const g = new Minesweeper({ width: 7, height: 5, mines: 8, seed });
    g.reveal(0, 0);
    assert.deepEqual(g.adj, bruteAdj(g), `seed ${seed}`);
  }
});

test('flood fill opens empty regions', () => {
  // 5×5, single mine at (0,0): revealing a far corner floods everything else.
  const g = new Minesweeper({ width: 5, height: 5, mineLayout: [0] });
  g.reveal(4, 4);
  assert.equal(g.revealedCount, 24);
  assert.equal(g.state, 'won', 'all safe cells revealed → win');
  assert.equal(g.revealed[0], 0);
});

test('flood fill is iterative (no stack overflow on 100×100)', () => {
  const g = new Minesweeper({ width: 100, height: 100, mineLayout: [0] });
  g.reveal(50, 50);
  assert.equal(g.revealedCount, 9999);
  assert.equal(g.state, 'won');
});

test('revealing a mine loses and reveals all mines', () => {
  const g = new Minesweeper({ width: 5, height: 5, mineLayout: [3, 17] });
  g.reveal(0, 1); // safe
  assert.equal(g.state, 'playing');
  g.reveal(0, 3); // index 3 is a mine
  assert.equal(g.state, 'lost');
  const revealedMines = [...g.mines].filter((m, i) => m && g.revealed[i]).length;
  assert.equal(revealedMines, 2, 'all mines revealed on loss');
});

test('no-op after game over', () => {
  const g = new Minesweeper({ width: 3, height: 3, mineLayout: [0] });
  g.reveal(0, 0);
  assert.equal(g.state, 'lost');
  g.reveal(1, 1);
  g.toggleFlag(1, 1);
  g.chord(1, 1);
  assert.equal(g.state, 'lost');
  assert.equal(g.flagCount, 0);
  assert.equal(g.revealedCount, 1);
});

test('win when all safe cells revealed', () => {
  const g = new Minesweeper({ width: 3, height: 3, mineLayout: [0] });
  for (const i of [1, 2, 3, 4, 5, 6, 7, 8]) {
    g.reveal(Math.floor(i / 3), i % 3);
    if (g.state !== 'playing') break;
  }
  assert.equal(g.state, 'won');
  assert.equal(g.revealedCount, 8);
});

test('zero-mine board wins on first reveal', () => {
  const g = new Minesweeper({ width: 4, height: 4, mines: 0 });
  g.reveal(0, 0);
  assert.equal(g.state, 'won');
  assert.equal(g.revealedCount, 16);
});

test('flag toggling, reveal blocking and minesLeft', () => {
  const g = new Minesweeper({ width: 3, height: 3, mineLayout: [0] });
  assert.equal(g.minesLeft, 1);
  g.toggleFlag(2, 2);
  assert.equal(g.flagged[8], 1);
  assert.equal(g.flagCount, 1);
  assert.equal(g.minesLeft, 0);
  g.reveal(2, 2); // blocked by the flag
  assert.equal(g.revealed[8], 0);
  assert.equal(g.state, 'playing');
  // over-flagging goes negative
  g.toggleFlag(1, 1);
  assert.equal(g.minesLeft, -1);
  g.toggleFlag(1, 2);
  assert.equal(g.minesLeft, -2);
  // unflag and reveal
  g.toggleFlag(2, 2);
  g.toggleFlag(1, 1);
  g.toggleFlag(1, 2);
  assert.equal(g.minesLeft, 1);
  g.reveal(2, 2);
  assert.equal(g.revealed[8], 1);
  assert.equal(g.state, 'won');
  // cannot flag a revealed cell
  g.toggleFlag(2, 2);
  assert.equal(g.flagged[8], 0);
});

test('chord reveals neighbors when flags match', () => {
  // 3×3, mines at indices 0 and 8. Reveal (1,0); flag (0,0); chord (1,0).
  const g = new Minesweeper({ width: 3, height: 3, mineLayout: [0, 8] });
  g.reveal(1, 0);
  assert.equal(g.revealedCount, 1);
  g.toggleFlag(0, 0);
  g.chord(1, 0);
  assert.equal(g.revealed[3], 1); // (0,1)
  assert.equal(g.revealed[4], 1); // (1,1)
  assert.equal(g.revealed[6], 1); // (2,0)
  assert.equal(g.revealed[7], 1); // (2,1)
  assert.equal(g.revealed[0], 0); // the flagged mine stays hidden
  assert.equal(g.state, 'playing');
});

test('chord with a wrong flag loses', () => {
  const g = new Minesweeper({ width: 3, height: 3, mineLayout: [0] });
  g.reveal(1, 0); // adj = 1 (mine at (0,0))
  g.toggleFlag(2, 1); // wrong flag, but count matches → chord opens the mine
  g.chord(1, 0);
  assert.equal(g.state, 'lost');
});

test('chord guards', () => {
  const g = new Minesweeper({ width: 5, height: 5, mineLayout: [0] });
  g.chord(2, 2); // unrevealed → no-op
  assert.equal(g.revealedCount, 0);
  g.reveal(4, 4); // floods everything but (0,0) → wins
  assert.equal(g.state, 'won');
  g.chord(4, 4); // adj 0 → no-op
  g.reveal(0, 0); // game over → no-op
  assert.equal(g.state, 'won');
});

test('out-of-bounds moves are safe no-ops', () => {
  const g = new Minesweeper({ width: 4, height: 4, mineLayout: [0] });
  g.reveal(-1, 0);
  g.reveal(0, 99);
  g.reveal(4, 4);
  g.reveal(1.5, 1);
  g.toggleFlag(-2, -2);
  g.chord(99, 0);
  assert.equal(g.revealedCount, 0);
  assert.equal(g.flagCount, 0);
  assert.equal(g.state, 'playing');
});

test('revealing an already revealed cell is a no-op', () => {
  const g = new Minesweeper({ width: 4, height: 4, mineLayout: [0] });
  g.reveal(3, 3);
  const count = g.revealedCount;
  g.reveal(3, 3);
  assert.equal(g.revealedCount, count);
});

test('mineLayout validation', () => {
  assert.throws(() => new Minesweeper({ width: 3, height: 3, mineLayout: [0, 0] })); // duplicate
  assert.throws(() => new Minesweeper({ width: 3, height: 3, mineLayout: [9] }));   // out of range
  assert.throws(() => new Minesweeper({ width: 3, height: 3, mineLayout: [-1] }));
  assert.throws(() => new Minesweeper({ width: 3, height: 3, mineLayout: '0' }));
});

test('mineLayout boards are ready immediately', () => {
  const g = new Minesweeper({ width: 3, height: 3, mineLayout: [4] });
  assert.equal(g.firstMove, false);
  assert.equal(g.mineCount, 1);
  assert.equal(g.adj[1], 1); // (0,1) touches the center mine
  assert.equal(g.adj[2], 1); // (0,2) touches the center mine
  assert.equal(g.adj[4], 0); // mines carry no number
  g.reveal(0, 0);
  assert.equal(g.state, 'playing');
});

test('startedAt set on first reveal only', () => {
  const g = new Minesweeper({ seed: 5 });
  assert.equal(g.startedAt, 0);
  g.reveal(4, 4);
  assert.ok(g.startedAt > 0);
  assert.ok(g.startedAt <= Date.now());
});
