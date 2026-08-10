// Interactive terminal UI: raw-mode keyboard input + full-screen redraw.

import { renderBoard } from './render.mjs';

// Map a raw-mode input chunk to an action (pure, unit-tested).
export function parseKey(chunk) {
  switch (chunk) {
    case '\x1b[A': case 'w': case 'W': case 'k': case 'K': return 'up';
    case '\x1b[B': case 's': case 'S': case 'j': case 'J': return 'down';
    case '\x1b[C': case 'd': case 'D': case 'l': case 'L': return 'right';
    case '\x1b[D': case 'a': case 'A': case 'h': case 'H': return 'left';
    case ' ': return 'reveal';
    case 'f': case 'F': return 'flag';
    case '\r': case '\n': return 'activate'; // reveal, or chord on a number
    case '\t': case 'c': case 'C': case 'x': case 'X': return 'chord';
    case 'r': case 'R': return 'restart';
    case 'q': case 'Q': case '\x1b': case '\x03': return 'quit';
    default: return null;
  }
}

export async function startTui(makeGame) {
  const stdin = process.stdin;
  const out = process.stdout;
  if (!stdin.isTTY || !out.isTTY) return null;

  let game = makeGame();
  let r = Math.floor(game.height / 2);
  let c = Math.floor(game.width / 2);
  let quit = false;

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  function draw() {
    const time = game.startedAt ? Math.floor((Date.now() - game.startedAt) / 1000) : null;
    const lines = renderBoard(game, { cursor: [r, c], color: true, time });
    const footer = `\x1b[90m  arrows/WASD/HJKL move · Space reveal · F flag · Enter chord · R restart · Q quit · seed ${game.seed}\x1b[0m`;
    out.write(`\x1b[2J\x1b[H\x1b[?25l${lines.join('\n')}\n${footer}\n`);
  }

  return new Promise((resolve) => {
    const timer = setInterval(draw, 1000);

    function cleanup() {
      clearInterval(timer);
      out.off('resize', onResize);
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      out.write('\x1b[?25h\n');
    }

    function onData(chunk) {
      switch (parseKey(chunk)) {
        case 'up': r = Math.max(0, r - 1); break;
        case 'down': r = Math.min(game.height - 1, r + 1); break;
        case 'left': c = Math.max(0, c - 1); break;
        case 'right': c = Math.min(game.width - 1, c + 1); break;
        case 'reveal': game.reveal(r, c); break;
        case 'flag': game.toggleFlag(r, c); break;
        case 'chord': game.chord(r, c); break;
        case 'activate':
          if (game.revealed[r * game.width + c]) game.chord(r, c);
          else game.reveal(r, c);
          break;
        case 'restart':
          game = makeGame();
          r = Math.floor(game.height / 2);
          c = Math.floor(game.width / 2);
          break;
        case 'quit':
          quit = true;
          break;
      }
      if (quit) {
        cleanup();
        resolve(game);
        return;
      }
      draw();
    }

    stdin.on('data', onData);
    out.on('resize', onResize);
    // Best-effort raw-mode restore if the process dies abnormally.
    process.once('exit', () => {
      try { stdin.setRawMode(false); } catch { /* ignore */ }
    });
    draw();
  });
}
