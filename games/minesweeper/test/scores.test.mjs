// Leaderboard tests — use a temp file so the real home-directory
// leaderboard is never touched.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { keyFor, loadScores, recordWin, listScores, saveScores } from '../src/scores.mjs';

function tempFile() {
  const dir = mkdtempSync(path.join(tmpdir(), 'minesweeper-test-'));
  return { dir, file: path.join(dir, 'scores.json') };
}

test('keyFor builds stable keys', () => {
  assert.equal(keyFor(9, 9, 10), '9x9x10');
  assert.equal(keyFor(30, 16, 99), '30x16x99');
});

test('recordWin: first win is a new best', () => {
  const { dir, file } = tempFile();
  const result = recordWin(9, 9, 10, 42, file);
  assert.equal(result.isNewBest, true);
  assert.equal(result.best, 42);
  assert.equal(result.wins, 1);
  assert.deepEqual(loadScores(file)[keyFor(9, 9, 10)], { best: 42, wins: 1 });
  rmSync(dir, { recursive: true, force: true });
});

test('recordWin: slower win keeps the best', () => {
  const { dir, file } = tempFile();
  recordWin(9, 9, 10, 42, file);
  const result = recordWin(9, 9, 10, 55, file);
  assert.equal(result.isNewBest, false);
  assert.equal(result.best, 42);
  assert.equal(result.wins, 2);
  rmSync(dir, { recursive: true, force: true });
});

test('recordWin: faster win breaks the record', () => {
  const { dir, file } = tempFile();
  recordWin(9, 9, 10, 42, file);
  const result = recordWin(9, 9, 10, 30, file);
  assert.equal(result.isNewBest, true);
  assert.equal(result.best, 30);
  assert.equal(result.wins, 2);
  rmSync(dir, { recursive: true, force: true });
});

test('different board sizes keep separate records', () => {
  const { dir, file } = tempFile();
  recordWin(9, 9, 10, 42, file);
  recordWin(16, 16, 40, 200, file);
  const rows = listScores(file);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => r.key), ['9x9x10', '16x16x40'], 'numeric sort');
  rmSync(dir, { recursive: true, force: true });
});

test('loadScores tolerates a missing or corrupt file', () => {
  const { dir, file } = tempFile();
  assert.deepEqual(loadScores(file), {});
  writeFileSync(file, '{{{ not json');
  assert.deepEqual(loadScores(file), {});
  // a corrupt file does not break recording
  const result = recordWin(3, 3, 1, 5, file);
  assert.equal(result.isNewBest, true);
  rmSync(dir, { recursive: true, force: true });
});

test('saveScores round-trips', () => {
  const { dir, file } = tempFile();
  saveScores({ '3x3x1': { best: 5, wins: 1 } }, file);
  assert.deepEqual(loadScores(file), { '3x3x1': { best: 5, wins: 1 } });
  rmSync(dir, { recursive: true, force: true });
});
