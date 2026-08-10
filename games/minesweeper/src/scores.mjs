// Best-time leaderboard, persisted as JSON in the user's home directory.
// Zero dependencies; never throws — a broken/unwritable leaderboard must
// never crash the game.

import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export const defaultScoresFile = () => path.join(homedir(), '.minesweeper-scores.json');

// Board-size key: e.g. "9x9x10". Each difficulty keeps its own record.
export const keyFor = (width, height, mines) => `${width}x${height}x${mines}`;

export function loadScores(file = defaultScoresFile()) {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveScores(scores, file = defaultScoresFile()) {
  writeFileSync(file, JSON.stringify(scores, null, 2) + '\n');
}

// Record a won game. Returns { isNewBest, best, wins }.
export function recordWin(width, height, mines, seconds, file = defaultScoresFile()) {
  const scores = loadScores(file);
  const key = keyFor(width, height, mines);
  const entry = scores[key] ?? { best: null, wins: 0 };
  entry.wins += 1;
  const isNewBest = entry.best === null || seconds < entry.best;
  if (isNewBest) entry.best = seconds;
  scores[key] = entry;
  try {
    saveScores(scores, file);
  } catch {
    // Leaderboard is best-effort only.
  }
  return { isNewBest, best: entry.best, wins: entry.wins };
}

// All records sorted by board size key.
export function listScores(file = defaultScoresFile()) {
  return Object.entries(loadScores(file))
    .map(([key, entry]) => ({ key, best: entry.best, wins: entry.wins }))
    .sort((a, b) => a.key.localeCompare(b.key, 'en', { numeric: true }));
}
