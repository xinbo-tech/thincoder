#!/usr/bin/env node
// Minesweeper entry point.
// Interactive TUI when stdin is a TTY; scripted move replay otherwise
// (or explicitly with --script). Scripted moves: r ROW COL / f ROW COL / c ROW COL.

import { readFileSync } from 'node:fs';
import { Minesweeper } from './src/game.mjs';
import { renderBoard } from './src/render.mjs';
import { startTui } from './src/tui.mjs';

const PRESETS = {
  beginner: { width: 9, height: 9, mines: 10 },
  intermediate: { width: 16, height: 16, mines: 40 },
  expert: { width: 30, height: 16, mines: 99 },
};

function defaultMines(width, height) {
  return Math.max(1, Math.min(width * height - 1, Math.round(width * height * 0.15)));
}

const USAGE = `Minesweeper — zero-dependency terminal game (pure Node.js).

Usage:
  node main.mjs [preset | width [height [mines]]] [--seed N] [--script file|-] [--help]

Presets:
  beginner (9×9, 10 mines)   intermediate (16×16, 40)   expert (30×16, 99)

Options:
  --seed N        reproducible board
  --script file   replay moves from a file ('-' or omitted = read stdin)

Scripted moves (one per line, 0-based):
  r ROW COL   reveal      f ROW COL   toggle flag      c ROW COL   chord
  Lines starting with # are ignored.

Examples:
  node main.mjs
  node main.mjs expert
  node main.mjs 16 16 40 --seed 42
  echo "r 4 4" | node main.mjs 9 9 10

Exit codes (scripted): 0 won, 1 lost, 2 usage error, 3 game unfinished.`;

function parseArgs(argv) {
  const args = { width: 9, height: 9, mines: 10, seed: undefined, scriptFile: null, help: false, error: null };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--seed') args.seed = Number(argv[++i]);
    else if (a.startsWith('--seed=')) args.seed = Number(a.slice('--seed='.length));
    else if (a === '--script') args.scriptFile = argv[++i] ?? '-';
    else if (a.startsWith('--script=')) args.scriptFile = a.slice('--script='.length) || '-';
    else if (PRESETS[a]) { const p = PRESETS[a]; args.width = p.width; args.height = p.height; args.mines = p.mines; }
    else if (/^\d+$/.test(a)) positional.push(Number(a));
    else { args.error = `unknown argument: ${a}`; break; }
  }
  if (args.error) return args;
  if (positional.length > 3) { args.error = 'too many positional arguments'; return args; }
  if (positional.length >= 1) args.width = positional[0];
  if (positional.length >= 2) args.height = positional[1];
  if (positional.length >= 3) args.mines = positional[2];
  if (positional.length === 1) { args.height = args.width; args.mines = defaultMines(args.width, args.height); }
  if (positional.length === 2) args.mines = defaultMines(args.width, args.height);
  if (args.seed !== undefined && (!Number.isInteger(args.seed) || args.seed < 0)) {
    args.error = '--seed must be a non-negative integer';
  }
  return args;
}

function runScript(game, text) {
  const out = [`seed: ${game.seed}`];
  let result = 'playing';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    const op = parts[0];
    const rr = Number(parts[1]);
    const cc = Number(parts[2]);
    if (parts.length !== 3 || !['r', 'f', 'c'].includes(op) || !Number.isInteger(rr) || !Number.isInteger(cc)) {
      out.push(`invalid move: ${line}`);
      continue;
    }
    if (op === 'r') game.reveal(rr, cc);
    else if (op === 'f') game.toggleFlag(rr, cc);
    else game.chord(rr, cc);
    out.push(`> ${line}   [${game.state}] flags=${game.flagCount} revealed=${game.revealedCount}`);
    out.push(...renderBoard(game, { color: false }));
    if (game.over) { result = game.state; break; }
  }
  return { out, result };
}

async function readStdin() {
  let text = '';
  for await (const chunk of process.stdin) text += chunk;
  return text;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.error) {
    console.error(args.error);
    console.error(USAGE);
    process.exit(2);
  }
  if (args.help) {
    console.log(USAGE);
    return;
  }

  const makeGame = () => new Minesweeper({
    width: args.width,
    height: args.height,
    mines: args.mines,
    seed: args.seed,
  });

  try {
    makeGame();
  } catch (err) {
    console.error(err.message);
    console.error(USAGE);
    process.exit(2);
  }

  if (args.scriptFile !== null || !process.stdin.isTTY) {
    let text;
    try {
      text = args.scriptFile !== null && args.scriptFile !== '-' ? readFileSync(args.scriptFile, 'utf8') : await readStdin();
    } catch (err) {
      console.error(`cannot read script: ${err.message}`);
      process.exit(2);
    }
    const game = makeGame();
    const { out, result } = runScript(game, text);
    console.log(out.join('\n'));
    console.log(`result: ${result}`);
    process.exit(result === 'won' ? 0 : result === 'lost' ? 1 : 3);
  }

  const game = await startTui(makeGame);
  if (game === null) {
    console.error('interactive mode requires a TTY');
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
