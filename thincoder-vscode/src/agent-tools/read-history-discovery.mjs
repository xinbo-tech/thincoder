/**
 * agent-tools/read-history-discovery.mjs — read_history discovery face (§13 R19 "cwd:" listing —
 * READ-HISTORY-SPLIT 2026-09-09: listCwdSessions + helpers slotMeta/tidyCwd/sha1hex moved verbatim
 * from read-history.mjs; kernel node:fs/node:crypto/node:path + session-io.mjs — no core-private
 * refs. Leaf: imported by read-history.mjs only (0 external consumers — no hub re-export).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { join } from "node:path"
import { sessionsDir, normalizeCwd } from "../extension/session-io.mjs"

/** cwd normalization for discovery: drive letter uppercased (normalizeCwd — the shared
 *  sha1 contract with the CLI) + trailing separators stripped (a model-passed "cwd:D:\x\"
 *  must find sessions recorded under "D:\x"). Drive roots ("D:\", "/") are never stripped. */
function tidyCwd(c) {
  let out = normalizeCwd(String(c))
  while (out.length > 3 && (out.endsWith("/") || out.endsWith("\\"))) out = out.slice(0, -1)
  return out
}

/** Slot metadata for one discovery row: manifest digest first (fast path — no file parse
 *  when the digest already carries the summary fields), else lazy-parse the slot file
 *  (old-format digests). Corrupt/unreadable → null (row skipped — explicit path query
 *  surfaces the read error, T-R19.3d). */
function slotMeta(manifestDigest, filePath) {
  if (manifestDigest && typeof manifestDigest === "object" && "ts" in manifestDigest) {
    if (manifestDigest.title !== undefined && manifestDigest.messageCount !== undefined && manifestDigest.updatedAt !== undefined) {
      return {
        title: manifestDigest.title ?? "",
        messageCount: manifestDigest.messageCount,
        updatedAt: typeof manifestDigest.updatedAt === "number" ? manifestDigest.updatedAt : null,
      }
    }
  }
  try {
    const d = JSON.parse(readFileSync(filePath, "utf8"))
    if (!d || typeof d !== "object" || !Array.isArray(d.history)) return null
    return {
      title: d.title ?? "",
      messageCount: d.history.length,
      updatedAt: typeof d.updatedAt === "number" ? d.updatedAt : null,
    }
  } catch {
    return null
  }
}

/** sha1 hex of a cwd string — the shared 40-char hash contract (session-slots.mjs cwdHash). */
function sha1hex(s) {
  return createHash("sha1").update(s).digest("hex")
}

/** §13 discovery face (path = "cwd:<dir>", v1 decision: list ALL slots + time order — no
 *  dead-owner filtering). One row per session FILE found for the cwd hash (manifest-digest
 *  metadata fast path when present; slotSessions claims with no file have nothing to
 *  summarize and are skipped), each with the slot number + FULL file path + title/message
 *  count/updatedAt, newest first — the full path is the addressing field the model needs
 *  for the follow-up deep query (评审 #2).
 *
 *  Hash candidates: the full 40-char hash PLUS the historical short-hash algorithms
 *  (session-slots.mjs migrateHashLength candidate list — CLI 12 / VS Code 16 chars, each
 *  with the lowercased-drive variant). Legacy sessions whose cwd was never re-accessed
 *  since the one-time migration shipped still live under short-hash names — discovery must
 *  see them WITHOUT running the rename migration (NF-R19: session files are read-only
 *  objects — never renamed); an explicit path= query on the listed file works regardless
 *  of its name. */
export function listCwdSessions(cwdValue) {
  if (!cwdValue || !String(cwdValue).trim()) return `Error: invalid path "cwd:" — use "cwd:<directory>" to list that directory's sessions`
  const cwd = tidyCwd(cwdValue)
  if (!existsSync(cwd)) {
    return `Error: no sessions for cwd "${cwdValue}" — directory not found（无该 cwd 会话目录——可改用 path=<完整会话文件路径> 直接查）`
  }
  const fullHash = sha1hex(cwd)
  const lowerDrive = cwd.replace(/^([A-Z]):/, (_, d) => d.toLowerCase() + ":")
  const prefixes = new Set([
    fullHash, // current naming — sessions shared with the CLI
    fullHash.slice(0, 12), fullHash.slice(0, 16), // CLI/VS legacy short hashes (uppercase-drive cwd)
    sha1hex(lowerDrive).slice(0, 12), sha1hex(lowerDrive).slice(0, 16), // …lowercased-drive variants (historical VS Code)
  ])
  const dir = sessionsDir()
  let names = []
  try {
    names = readdirSync(dir)
  } catch { /* sessions dir missing → no sessions at all */ }
  const re = new RegExp(`^(${[...prefixes].join("|")})\\.json\\.(\\d+)$`)
  const files = []
  for (const name of names) {
    const m = re.exec(name)
    if (m) files.push({ slot: Number(m[2]), filePath: join(dir, name) })
  }
  if (files.length === 0) return `(no sessions for cwd "${cwdValue}")`
  // Manifest digests (fast meta path — session-slots 结构既有; read-only parse).
  let digest = null
  try {
    const m = JSON.parse(readFileSync(join(dir, `${fullHash}.json.manifest`), "utf8"))
    digest = m?.slots ?? null
  } catch { digest = null }
  const rows = []
  for (const f of files) {
    const meta = slotMeta(digest?.[f.slot], f.filePath)
    if (!meta) continue // unreadable slot — skip in the listing (explicit path query shows the error)
    const title = String(meta.title ?? "").replace(/[\r\n]+/g, " ").slice(0, 120)
    rows.push({
      slot: f.slot,
      filePath: f.filePath,
      title: title || "(untitled)",
      messageCount: meta.messageCount,
      updatedAt: meta.updatedAt,
    })
  }
  if (rows.length === 0) return `(no sessions for cwd "${cwdValue}")`
  rows.sort((a, b) => (b.updatedAt ?? -Infinity) - (a.updatedAt ?? -Infinity))
  const lines = rows.map(
    (r) => `slot ${r.slot}: ${r.filePath} — title: "${r.title}" — messages: ${r.messageCount} — updatedAt: ${r.updatedAt ?? "unknown"}`
  )
  lines.push("Re-call read_history with path=<a full session-file path above> to search that session's messages.")
  return lines.join("\n")
}
