// Board renderer shared by the interactive TUI and scripted mode.

const RESET = '\x1b[0m';
const NUM_COLOR = ['', 34, 32, 31, 35, 33, 36, 97, 90]; // classic colors for 1..8
const CELL = {
  empty: '  ',
  unrevealed: '· ',
  flag: '⚑ ',
  question: '? ',
  mine: '* ',
};

function colorize(text, code) {
  return code ? `\x1b[${code}m${text}${RESET}` : text;
}

function visibleLen(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}

function cellText(game, i, color) {
  if (game.revealed[i]) {
    if (game.mines[i]) return color ? colorize(CELL.mine, 31) : CELL.mine;
    const n = game.adj[i];
    return n === 0 ? CELL.empty : color ? colorize(` ${n}`, NUM_COLOR[n]) : ` ${n}`;
  }
  // On a win the only unrevealed cells are mines — show them flagged.
  if (game.flagged[i] || (game.state === 'won' && game.mines[i])) {
    return color ? colorize(CELL.flag, 33) : CELL.flag;
  }
  if (game.questioned[i]) {
    return color ? colorize(CELL.question, 90) : CELL.question;
  }
  return color ? colorize(CELL.unrevealed, 90) : CELL.unrevealed;
}

export function renderBoard(game, { cursor = null, color = true, time = null } = {}) {
  const w = game.width;
  const timeStr = time === null || game.startedAt === 0 ? '--' : `${time}s`;
  const header = ` ${game.width}×${game.height} · mines ${game.mineCount} · flags ${game.flagCount} · left ${Math.max(0, game.minesLeft)} · time ${timeStr} `;
  const inner = Math.max(2 * w, visibleLen(header));
  const fit = (s) => s + ' '.repeat(inner - visibleLen(s));

  const lines = [`┌${'─'.repeat(inner)}┐`];
  lines.push(`│${fit(header)}│`);
  for (let r = 0; r < game.height; r++) {
    let cells = '';
    for (let c = 0; c < w; c++) {
      const i = r * w + c;
      const text = cellText(game, i, color);
      const isCursor = color && cursor !== null && cursor[0] === r && cursor[1] === c;
      cells += isCursor ? `\x1b[7m${text}${RESET}` : text;
    }
    lines.push(`│${cells}${' '.repeat(inner - 2 * w)}│`);
  }
  lines.push(`├${'─'.repeat(inner)}┤`);
  const status = game.state === 'won' ? (color ? colorize('WON!', 32) : 'WON!')
    : game.state === 'lost' ? (color ? colorize('LOST — BOOM!', 31) : 'LOST — BOOM!')
    : (color ? colorize('PLAYING', 90) : 'PLAYING');
  lines.push(`│${fit(` ${status} `)}│`);
  lines.push(`└${'─'.repeat(inner)}┘`);
  return lines;
}
