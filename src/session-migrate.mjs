/**
 * session-migrate.mjs — one-time migration of legacy short-hash session files to the
 * full 40-char sha1 hash. Extracted from session.mjs (file-size split).
 */
import { createHash } from "node:crypto"
import { renameSync, existsSync } from "node:fs"
import { join } from "node:path"
import { configDir } from "./config.mjs"

/** One-time migration: rename legacy short-hash session files to the full 40-char hash.
 *  Idempotent; runs on first access per cwd.
 *  Historical hash algorithms (all sha1, none normalized the drive letter):
 *    - CLI:      sha1(cwd).slice(0, 12)      — cwd comes from process.cwd() (uppercase drive on Windows)
 *    - VS Code:  sha1(cwd).slice(0, 16)      — cwd comes from uri.fsPath (LOWERCASE drive on Windows)
 *  Plus the previous migration attempt's assumption (normalized 12 = first 12 of the full hash).
 *  Every combination is tried — a migration that only checks one candidate misses real
 *  legacy files (drive-letter case differs between CLI and VS Code historical paths). */
/** 2026-09-01 advisor 🔵（VS Code 侧已修，CLI 对称补齐）：已迁移/确认无 legacy 的 hash
 *  记录在 Set 中短路——否则每次 sessionPath() 都重跑 5 候选 × 3 existsSync 的系统调用。 */
const migratedHashes = new Set() // full 40-char hash → migration already attempted (found none or done)

export function migrateHashLength(cwd, fullHash) {
  if (migratedHashes.has(fullHash)) return false
  const dir = join(configDir, "sessions")
  const lower = cwd.replace(/^([A-Z]):/, (_, d) => d.toLowerCase() + ":")
  const candidates = [
    createHash("sha1").update(cwd).digest("hex").slice(0, 12),
    createHash("sha1").update(cwd).digest("hex").slice(0, 16),
    createHash("sha1").update(lower).digest("hex").slice(0, 12),
    createHash("sha1").update(lower).digest("hex").slice(0, 16),
    fullHash.slice(0, 12),
  ]
  const newBase = join(dir, `${fullHash}.json`)
  let migrated = false
  for (const short of new Set(candidates)) {
    const legacyBase = join(dir, `${short}.json`)
    if (!existsSync(legacyBase) && !existsSync(`${legacyBase}.manifest`) && !existsSync(`${legacyBase}.1`)) continue
    migrated = true
    try {
      for (const suffix of ["", ".manifest", ...Array.from({ length: 64 }, (_, i) => `.${i + 1}`)]) {
        const from = legacyBase + suffix
        if (existsSync(from) && !existsSync(newBase + suffix)) renameSync(from, newBase + suffix)
      }
    } catch { /* best-effort; leave files in place on failure */ }
  }
  migratedHashes.add(fullHash)
  return migrated
}