// Minesweeper core logic — pure ES module, zero dependencies.
// The board lives in flat arrays indexed by r * width + c.
// Mine positions are drawn lazily on the first reveal, so the first
// click is always safe (classic rule). Pass a seed for reproducible boards.

export const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

// Deterministic PRNG (mulberry32, 32-bit state).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Minesweeper {
  constructor({ width = 9, height = 9, mines = 10, seed, mineLayout } = {}) {
    if (!Number.isInteger(width) || width < 2 || width > 100) {
      throw new Error(`width must be an integer in [2, 100], got ${width}`);
    }
    if (!Number.isInteger(height) || height < 2 || height > 100) {
      throw new Error(`height must be an integer in [2, 100], got ${height}`);
    }
    if (mineLayout === undefined && (!Number.isInteger(mines) || mines < 0 || mines >= width * height)) {
      throw new Error(`mines must be an integer in [0, ${width * height - 1}], got ${mines}`);
    }

    this.width = width;
    this.height = height;
    this.seed = Number.isInteger(seed) ? seed >>> 0 : (Math.random() * 0x100000000) >>> 0;
    this.rng = mulberry32(this.seed);

    const n = width * height;
    this.mines = new Uint8Array(n);
    this.revealed = new Uint8Array(n);
    this.flagged = new Uint8Array(n);
    this.questioned = new Uint8Array(n);
    this.adj = new Uint8Array(n);

    this.firstMove = true;
    this.state = 'playing'; // 'playing' | 'won' | 'lost'
    this.revealedCount = 0;
    this.flagCount = 0;
    this.startedAt = 0; // Date.now() at first reveal

    if (mineLayout !== undefined) {
      // Explicit layout (tests, custom boards). Overrides the mine count.
      if (!Array.isArray(mineLayout) || mineLayout.some((i) => !Number.isInteger(i) || i < 0 || i >= n)) {
        throw new Error('mineLayout must be an array of flat cell indices in [0, n)');
      }
      if (new Set(mineLayout).size !== mineLayout.length) {
        throw new Error('mineLayout must not contain duplicate indices');
      }
      this.mineCount = mineLayout.length;
      for (const i of mineLayout) this.mines[i] = 1;
      this._computeAdj();
      this.firstMove = false;
    } else {
      this.mineCount = mines;
    }
  }

  get size() { return this.width * this.height; }
  get safeCount() { return this.size - this.mineCount; }
  get minesLeft() { return this.mineCount - this.flagCount; }
  get over() { return this.state !== 'playing'; }

  inBounds(r, c) {
    return Number.isInteger(r) && Number.isInteger(c)
      && r >= 0 && r < this.height && c >= 0 && c < this.width;
  }

  neighbors(r, c) {
    const out = [];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < this.height && nc >= 0 && nc < this.width) out.push([nr, nc]);
    }
    return out;
  }

  _computeAdj() {
    for (let i = 0; i < this.size; i++) {
      if (this.mines[i]) continue;
      const r = Math.floor(i / this.width);
      const c = i % this.width;
      let n = 0;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < this.height && nc >= 0 && nc < this.width && this.mines[nr * this.width + nc]) n++;
      }
      this.adj[i] = n;
    }
  }

  // Fisher–Yates over candidate cells, excluding the safe first-click zone.
  // First-click opens a zero region (the cell + its 8 neighbors are kept
  // mine-free); on boards too small for that it degrades to cell-only.
  _placeMines(safeR, safeC) {
    const safeZone = new Set();
    safeZone.add(safeR * this.width + safeC);
    for (const [dr, dc] of DIRS) {
      const nr = safeR + dr;
      const nc = safeC + dc;
      if (this.inBounds(nr, nc)) safeZone.add(nr * this.width + nc);
    }
    const all = [];
    const outside = [];
    for (let i = 0; i < this.size; i++) {
      const r = Math.floor(i / this.width);
      const c = i % this.width;
      if (r === safeR && c === safeC) continue;
      all.push(i);
      if (!safeZone.has(i)) outside.push(i);
    }
    const pool = outside.length >= this.mineCount ? outside : all;
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (let k = 0; k < this.mineCount; k++) this.mines[pool[k]] = 1;
    this._computeAdj();
  }

  reveal(r, c) {
    if (!this.inBounds(r, c) || this.over) return;
    const i = r * this.width + c;
    if (this.revealed[i] || this.flagged[i]) return;
    if (this.firstMove) {
      this._placeMines(r, c);
      this.firstMove = false;
      this.startedAt = Date.now();
    }
    this._reveal(r, c);
  }

  // Iterative flood fill — no recursion, safe for 100×100 empty boards.
  _reveal(r, c) {
    if (this.over) return;
    const stack = [[r, c]];
    while (stack.length > 0) {
      const [cr, cc] = stack.pop();
      const i = cr * this.width + cc;
      if (this.revealed[i] || this.flagged[i]) continue;
      this.revealed[i] = 1;
      this.questioned[i] = 0; // revealing a question-marked cell clears the mark
      this.revealedCount++;
      if (this.mines[i]) {
        this.state = 'lost';
        this._revealAllMines();
        return;
      }
      if (this.revealedCount === this.safeCount) {
        this.state = 'won';
        return;
      }
      if (this.adj[i] === 0) {
        for (const [nr, nc] of this.neighbors(cr, cc)) stack.push([nr, nc]);
      }
    }
  }

  _revealAllMines() {
    for (let i = 0; i < this.size; i++) {
      if (this.mines[i]) this.revealed[i] = 1;
    }
  }

  // Cycle cell marks: none → flag → question → none. Question marks do not
  // block reveal and do not count as flags.
  toggleFlag(r, c) {
    if (!this.inBounds(r, c) || this.over) return;
    const i = r * this.width + c;
    if (this.revealed[i]) return;
    if (this.flagged[i]) {
      this.flagged[i] = 0;
      this.flagCount--;
      this.questioned[i] = 1;
    } else if (this.questioned[i]) {
      this.questioned[i] = 0;
    } else {
      this.flagged[i] = 1;
      this.flagCount++;
    }
  }

  // Chord: reveal all unflagged neighbors when the flag count matches the number.
  chord(r, c) {
    if (!this.inBounds(r, c) || this.over) return;
    const i = r * this.width + c;
    if (!this.revealed[i] || this.adj[i] === 0) return;
    let flags = 0;
    const targets = [];
    for (const [nr, nc] of this.neighbors(r, c)) {
      const ni = nr * this.width + nc;
      if (this.flagged[ni]) flags++;
      else if (!this.revealed[ni]) targets.push([nr, nc]);
    }
    if (flags !== this.adj[i]) return;
    for (const [nr, nc] of targets) this._reveal(nr, nc);
  }
}
