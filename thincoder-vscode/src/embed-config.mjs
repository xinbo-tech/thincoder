/**
 * embed-config.mjs — shared core-face handle for the extension shell: the embedder cache
 * and the memory-store handle (W8 · `docs/batches/2026-09-15-vsc-core-wiring.md` §2).
 *
 * Config source: ~/.thincoder/config.json (shared with CLI) — env vars are NOT a key source.
 * (Legacy VS Code SecretStorage keys are migrated into config.json by migrate-settings.mjs)
 *
 * Guard contract（W8 引擎护栏接线契约②——`extension.mjs:47` 消费契约）：核记忆面说
 * `node:sqlite`，故本档**只经动态 `import()`** 载入它——此处（或端壳静态闭包内任何一处）
 * 静态引入 ⇒ 低宿主模块加载期硬失败（`extension.mjs` 加载即败 · `activate()` 未及执行 ·
 * 护栏静默失效）。机判 = `test/engine-floor-guard.test.mjs` 自 `extension.mjs` 静态闭包
 * 扫 `node:sqlite` 可达性 = 0。
 */

import { readFileSync, existsSync } from "node:fs"
import { dirname, isAbsolute, join } from "node:path"
import { homedir } from "node:os"
import { createEmbedder } from "@thincoder/core/embedding.mjs"
import { expandHome } from "@thincoder/core/expand-home.mjs"
import { _configPath, loadRaw } from "./config-io.mjs"

let _embedder = null
let _tried = false

/** Get or create the embedder. Returns null if not configured. */
export function getEmbedder() {
  if (_tried) return _embedder
  _tried = true

  // 1) CLI config
  const configPath = join(homedir(), ".thincoder", "config.json")
  try {
    if (existsSync(configPath)) {
      const cfg = JSON.parse(readFileSync(configPath, "utf8"))
      if (cfg.embedding?.apiKey && cfg.embedding?.baseURL && cfg.embedding?.model) {
        _embedder = createEmbedder(cfg.embedding)
        return _embedder
      }
    }
  } catch {}

  return _embedder
}

/**
 * Set embedder from VSCode SecretStorage (called by ChatPanel after resolving key).
 * Also calls getEmbedder() first to check CLI/env as fallback.
 */
export function setVSCodeEmbedder({ baseURL, model, apiKey }) {
  if (apiKey && baseURL && model) {
    try { _embedder = createEmbedder({ baseURL, model, apiKey }) } catch {}
  }
  _tried = true
}

/** Reset cache (after config changes) */
export function resetEmbedder() {
  _embedder = null
  _tried = false
}

// ─── 核记忆句柄（W8 §2「记忆句柄」——端壳装配面创建持有）────────────────────────

let _memory = null
let _pending = null

// 引擎护栏旗标接线（W8 契约①）：`extension.mjs` 在模块层把 `isMemoryFaceEnabled` 接入
// ——本档不 import 入口（否则 tools/index 读 `memoryTool` 时形成 TDZ 环），门面 = 活访问器，
// 仍在“造记忆面前读”的时序上；未接线（未过 activate 图）⇒ fail-closed。
let _faceGate = null
/** Wire the engine-floor accessor (`isMemoryFaceEnabled` — `extension.mjs:46`). */
export function setMemoryFaceGate(fn) { _faceGate = typeof fn === "function" ? fn : null }

/** true when the floor guard allows the memory face (fail-closed before wiring). */
function memoryFaceEnabled() {
  try { return !!_faceGate?.() } catch { return false }
}

/** Current core memory-store handle — null while the face is off or not created yet.
 *  Sync readers (panel index counts) use this; callers with a cwd use `memoryFor`. */
export function getMemoryHandle() { return _memory }

/** Test seam: drop the cached handle (tests sandbox `dbPath` via `_setConfigPathForTest`). */
export function _resetMemoryHandleForTest() { _memory = null; _pending = null }

/** Load the core memory face — dynamic import is part of the guard contract (header). */
export async function loadMemoryFace() {
  return await import("@thincoder/core/memory.mjs")
}

/** Memory DB path: shared config.json `memory.dbPath` when set (CLI default =
 *  `<configDir>/memory.db` — one DB per machine, both ends), else next to the config file.
 *  `~` 展开 = 核 config 单点同形（`thincoder-core/config.mjs:263`——不展开则 cwd 下落字面 `~` 树、与 CLI 不同库）。 */
export function memoryDbPath() {
  try {
    const p = loadRaw()?.memory?.dbPath
    if (typeof p === "string" && p.trim()) return expandHome(p.trim())
  } catch { /* unreadable config → default below */ }
  return join(dirname(_configPath()), "memory.db")
}

/** Project-layer memory directory for one project root: shared config.json
 *  `memory.projectDir` (core default `.thincoder/memory`), absolute or cwd-relative —
 *  same resolution as the core tool face (`memory/docs.mjs:242`). */
export function projectMemoryDir(cwd) {
  let p = ".thincoder/memory"
  try {
    const v = loadRaw()?.memory?.projectDir
    if (typeof v === "string" && v.trim()) p = v.trim()
  } catch { /* unreadable config → core default */ }
  p = expandHome(p) // 核 config 单点同形（`thincoder-core/config.mjs:264`）
  return isAbsolute(p) ? p : join(cwd ?? process.cwd(), p)
}

/**
 * Create (once) the core memory-store handle. The floor-guard flag is read BEFORE the face
 * is created (contract①): disabled ⇒ no handle is built — consumers stay inert, zero crash.
 * Never throws: a failed creation returns null and is retried on the next call.
 */
export async function ensureMemoryHandle() {
  if (_memory) return _memory
  if (!memoryFaceEnabled()) return null
  if (_pending) return _pending
  _pending = (async () => {
    try {
      const { createMemory } = await loadMemoryFace()
      const memory = createMemory({ dbPath: memoryDbPath() })
      // The embedder follows the shared cache — the core face reads `memory.embedder` at
      // every call, so a getter keeps lazy vector backfill automatic once a key exists.
      Object.defineProperty(memory, "embedder", { get: () => getEmbedder(), configurable: true })
      _memory = memory
      return memory
    } catch (e) {
      console.warn("[thincoder] memory face unavailable:", e?.message ?? e)
      return null
    } finally { _pending = null }
  })()
  return _pending
}

/**
 * The handle scoped to one project root (creates it on first use, guard-checked):
 * ① `codeOrigin` = the core face's per-project filter — code/doc reads only see this
 *    project's rows (`memory/code-sync.mjs` / `memory/docs.mjs` read it at call time);
 * ② first call per project syncs the project-layer markdown dir into `files`
 *    (`syncDir` — CLI startup parity, `cli/make-agent.mjs:52-55`), so on-disk project
 *    entries are searchable instead of list-only.
 * Returns null while the memory face is disabled / creation failed.
 */
export async function memoryFor(cwd) {
  const memory = await ensureMemoryHandle()
  if (!memory) return null
  memory.codeOrigin = cwd ?? null
  const projectDir = cwd ? projectMemoryDir(cwd) : null
  if (projectDir && memory.projectOrigin !== projectDir) {
    memory.projectOrigin = projectDir
    try {
      const { syncDir } = await loadMemoryFace()
      await syncDir(memory, { layer: "project", dir: projectDir })
    } catch { /* unreadable/absent project memory dir → nothing to index */ }
  }
  return memory
}
