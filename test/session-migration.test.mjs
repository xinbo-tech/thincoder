/**
 * session-migration.test.mjs — legacy short-hash session migration
 *
 * Historical hash algorithms (all sha1, none normalized the drive letter):
 *   - CLI:      sha1(cwd).slice(0, 12)
 *   - VS Code:  sha1(cwd).slice(0, 16)
 * The current algorithm is sha1(normalizeCwd(cwd)) (40 chars). On Windows the drive
 * letter case differs between the raw cwd and the normalized one, so a migration
 * that only looks at `fullHash.slice(0, 12)` finds NOTHING — every candidate from
 * every historical algorithm must be tried (regression for the reported bug:
 * "12→40 hash change left users unable to reach their sessions").
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdtempSync, rmSync, existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { configDir } from "../src/config.mjs"
import { sessionPath } from "../src/session.mjs"

function legacyHash(cwd, len) {
  return createHash("sha1").update(cwd).digest("hex").slice(0, len)
}

/** Sessions dir for the real config; migration writes there (tmp cwd → unique hash, cleaned after). */
const SESSIONS = join(configDir, "sessions")

function writeLegacySession(shortHash, content = { history: [{ role: "user", content: "legacy hello" }] }) {
  const base = join(SESSIONS, `${shortHash}.json`)
  mkdirSync(SESSIONS, { recursive: true })
  writeFileSync(base, JSON.stringify({ version: 2, cwd: "x", title: "", history: content.history, contextHistory: content.history }))
  writeFileSync(`${base}.1`, JSON.stringify({ version: 2, cwd: "x", title: "", history: content.history, contextHistory: content.history }))
  writeFileSync(`${base}.manifest`, JSON.stringify({ active: 1, slots: {} }))
}

function cleanupHashFiles(base40) {
  for (const suffix of ["", ".manifest", ".1"]) {
    try { rmSync(base40 + suffix, { force: true }) } catch {}
  }
}

test("migrates a legacy 12-char hash written with a LOWERCASE drive letter (Windows scenario)", () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-migrate-"))
  // Simulate the old CLI's cwd: same path but the drive letter lowercased
  const winCwd = process.platform === "win32"
    ? dir.replace(/^([A-Z]):/, (_, d) => d.toLowerCase() + ":")
    : dir
  const raw12 = legacyHash(winCwd, 12)
  assert.notEqual(raw12, legacyHash(dir, 12), "lowercase drive letter changes the hash prefix")
  writeLegacySession(raw12)
  try {
    const base40 = sessionPath(dir) // current algorithm (normalized, 40 chars)
    assert.ok(existsSync(base40), "migrated base exists")
    assert.ok(existsSync(`${base40}.1`), "slot migrated")
    assert.ok(existsSync(`${base40}.manifest`), "manifest migrated")
    assert.ok(!existsSync(join(SESSIONS, `${raw12}.json`)), "legacy 12-char file renamed away")
    const slot = JSON.parse(readFileSync(`${base40}.1`, "utf8"))
    assert.equal(slot.history[0].content, "legacy hello", "content preserved")
  } finally {
    cleanupHashFiles(sessionPath(dir))
    rmSync(dir, { recursive: true, force: true })
  }
})

test("migrates a legacy 16-char hash (VS Code's historical algorithm) too", () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-migrate16-"))
  const raw16 = legacyHash(dir, 16)
  writeLegacySession(raw16)
  try {
    const base40 = sessionPath(dir)
    assert.ok(existsSync(base40), "16-char legacy migrated to 40-char")
    assert.ok(!existsSync(join(SESSIONS, `${raw16}.json`)), "16-char file renamed away")
  } finally {
    cleanupHashFiles(sessionPath(dir))
    rmSync(dir, { recursive: true, force: true })
  }
})

test("migration is idempotent — no-op when nothing legacy exists, no crash on re-access", () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-migrate-idem-"))
  try {
    const base40 = sessionPath(dir)
    assert.ok(!existsSync(base40), "nothing created for an untouched cwd")
    // Second access (after a session was saved) must not throw or rename anything
    const again = sessionPath(dir)
    assert.equal(again, base40)
  } finally {
    cleanupHashFiles(sessionPath(dir))
    rmSync(dir, { recursive: true, force: true })
  }
})
