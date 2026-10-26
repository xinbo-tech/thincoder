/**
 * stats.mjs — proportion intervals and the two-sample test. Pure functions, no dependencies.
 *
 * What is computed and why:
 *   - a single proportion per verdict cell gets the Wilson score interval: with small samples the
 *     normal approximation is not usable, and Wilson keeps a sensible interval at 0 / 1 counts;
 *   - the difference between two cells gets the Newcombe hybrid score interval (Wilson-based):
 *     cells are unpaired and the sample is small, which is exactly its case;
 *   - the p value is Fisher's exact test (two-sided): the tables are 2×2 and the counts are small.
 *
 * Nothing here decides anything: these are readings. Whether a difference counts as "worth
 * acting on" belongs to the person running the batch, not to this file.
 */

/** Two-sided 95% normal quantile. */
export const Z_95 = 1.959963984540054

const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value))

/** Wilson score interval for `count` successes in `n` trials; null when `n` is 0. */
export function wilson(count, n, z = Z_95) {
  if (!Number.isFinite(n) || n <= 0) return null
  if (!Number.isFinite(count) || count < 0 || count > n) throw new Error(`wilson: count ${count} outside 0..${n}`)
  const p = count / n
  const z2 = z * z
  const denom = 1 + z2 / n
  const center = (p + z2 / (2 * n)) / denom
  const half = (z / denom) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))
  return [clamp(center - half, 0, 1), clamp(center + half, 0, 1)]
}

/** Newcombe hybrid score interval for `p1 - p2`; null when either sample is empty. */
export function newcombe(count1, n1, count2, n2, z = Z_95) {
  const first = wilson(count1, n1, z)
  const second = wilson(count2, n2, z)
  if (!first || !second) return null
  const p1 = count1 / n1
  const p2 = count2 / n2
  const difference = p1 - p2
  const low = difference - Math.sqrt((p1 - first[0]) ** 2 + (second[1] - p2) ** 2)
  const high = difference + Math.sqrt((first[1] - p1) ** 2 + (p2 - second[0]) ** 2)
  return [clamp(low, -1, 1), clamp(high, -1, 1)]
}

// ── Fisher's exact test (two-sided) ──────────────────────────────────────────

const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
]

/** log Γ(z) — Lanczos approximation, enough precision for binomial coefficients of small tables. */
function logGamma(z) {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
  const x = z - 1
  let a = 0.99999999999980993
  for (let i = 0; i < LANCZOS.length; i += 1) a += LANCZOS[i] / (x + i + 1)
  const t = x + LANCZOS.length - 0.5
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}

/** log C(n, k); -Infinity outside 0..n. */
function logChoose(n, k) {
  if (k < 0 || k > n) return -Infinity
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1)
}

/**
 * Two-sided Fisher exact p for the 2×2 table [[count1, n1-count1], [count2, n2-count2]].
 * The two-sided p sums the tables whose probability does not exceed the observed one.
 * Null when either sample is empty (there is nothing to compare).
 */
export function fisherExact(count1, n1, count2, n2) {
  if (!Number.isFinite(n1) || !Number.isFinite(n2) || n1 <= 0 || n2 <= 0) return null
  if (count1 < 0 || count1 > n1 || count2 < 0 || count2 > n2) {
    throw new Error(`fisherExact: counts outside their samples (${count1}/${n1} · ${count2}/${n2})`)
  }
  const row1 = n1
  const row2 = n2
  const col1 = count1 + count2
  const total = n1 + n2
  const logP = (x) => logChoose(row1, x) + logChoose(row2, col1 - x) - logChoose(total, col1)
  const observed = Math.exp(logP(count1))
  const tol = 1e-7
  let p = 0
  for (let x = Math.max(0, col1 - row2); x <= Math.min(row1, col1); x += 1) {
    const candidate = Math.exp(logP(x))
    if (candidate <= observed * (1 + tol)) p += candidate
  }
  return Math.min(1, p)
}
