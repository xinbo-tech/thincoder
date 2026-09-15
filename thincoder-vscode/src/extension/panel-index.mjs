/**
 * panel-index.mjs — ChatPanel semantic-index + embedder management (split out of
 * chat-panel.mjs), plus the @-file completer. Every function takes the ChatPanel
 * instance as `panel`.
 *
 * W8（`docs/batches/2026-09-15-vsc-core-wiring.md` §2 · 2026-09-15）：索引面归一核面
 * （`~/.thincoder/memory.db` 的 code_chunks / doc_chunks——sqlite）。端壳文件制索引
 * （`src/indexer.mjs` 族 · `.thincoder/index/`）删旧：
 * ① 读数换源 = 核库计数（`COUNT(DISTINCT path)`——CLI `backgroundIndex` 口径同形，按
 *    `origin` 限定本项目）；② 触发换源 = 核 `gitSync` → 回退 `codeSync`+`docSync`（并行）；
 * ③ 模型变更零手动重建——核面 = 失效向量置空 + 检索懒回填（不产无效结果），原
 *    「Rebuild now?」提示与 `mismatch` 载荷退场；④ 取消面 = 核 sync 无中断缝 ⇒
 *    `cancellable: false`（端差收正）；⑤ 旧目录清退 = 告示 + 显式删除动作（零自动删除）。
 */
import * as vscode from "vscode"
import { existsSync, rmSync } from "node:fs"
import { join, relative } from "node:path"
import { getEmbedder as getSharedEmbedder, getMemoryHandle, loadMemoryFace, memoryFor, setVSCodeEmbedder, resetEmbedder } from "../embed-config.mjs"
import { loadEmbeddingConfig, saveEmbeddingConfig as saveEmbeddingConfigToFile } from "../embed-config.mjs"
import { _cwd } from "./panel-messages.mjs"

/** §14 C-12#1/C-15：索引进度 → statusText（webview 状态行段——scan/index/done 三相位；
 *  done 相位由 webview 清段——索引结束回常态）。相位 = 核 sync `onProgress` 原生相位
 *  （`scan` 清单扫描 · `index` 逐文件 i/total〔同步期不产嵌入——原 embed 相位退场〕）。 */
function postIndexProgress(panel, p) {
  panel._panel?.webview.postMessage({ type: "statusText", kind: "index", phase: p.phase, done: p.current ?? p.done ?? null, total: p.total ?? null })
}

/** 核库读数（本项目 origin）——files = code+doc 的 `COUNT(DISTINCT path)`，chunks = 行数。
 *  CLI `backgroundIndex` 同形（`tui/startup.mjs:263-289`）；本端按 origin 限定项目。 */
function readIndexCounts(memory, cwd) {
  const code = memory.db.prepare(`SELECT COUNT(DISTINCT path) AS files, COUNT(*) AS chunks FROM code_chunks WHERE origin = ?`).get(cwd) ?? {}
  const doc = memory.db.prepare(`SELECT COUNT(DISTINCT path) AS files, COUNT(*) AS chunks FROM doc_chunks WHERE origin = ?`).get(cwd) ?? {}
  return { files: (code.files ?? 0) + (doc.files ?? 0), chunks: (code.chunks ?? 0) + (doc.chunks ?? 0) }
}

export function pushIndexStatus(panel) {
    const cwd = _cwd()
    if (!cwd) return
    const embedder = getEmbedder()
    const memory = getMemoryHandle()
    let status = null
    if (memory) {
      try {
        const { files, chunks } = readIndexCounts(memory, cwd)
        status = { built: files > 0, files, chunks, hasEmbedder: !!embedder }
      } catch { status = { built: false, files: 0, chunks: 0, hasEmbedder: !!embedder } }
    }
    panel._panel?.webview.postMessage({ type: "indexStatus", status, hasEmbedder: !!embedder })
  }

export async function atComplete(panel, query, cwd, seq) {
    try {
      // C1（SESSION-FLOW-C F-C1c——修 H-A）：请求 seq 在 webview 侧自增（autocomplete.js）——
      // host 只回显最新：慢 findFiles 迟到返回时若已有更新请求（seq 前进）→ 丢弃——旧扫描
      // 不覆盖新下拉。webview 防抖已挡连续输入风暴——seq 兜住防抖窗外的乱序返回。无 seq
      // （旧 webview）→ undefined 恒等——行为不变。
      panel._atSeq = seq
      const base = cwd || _cwd() || process.cwd()
      const pattern = query.startsWith("@") ? query.slice(1) : query
      const uris = await vscode.workspace.findFiles(
        `**/${pattern}*`,
        "**/node_modules/**,**/.git/**,**/dist/**",
        20,
      )
      if (panel._atSeq !== seq) return  // 迟到扫描——丢弃（不覆盖新下拉）
      const matches = uris.slice(0, 20).map((u) => {
        // path.relative (not slice) — multi-root workspaces can resolve files OUTSIDE
        // `base`, where slice would corrupt the prefix; cross-drive returns the abs path.
        const rel = relative(base, u.fsPath).replace(/\\/g, "/")
        const parts = rel.split("/")
        return { name: parts[parts.length - 1], path: rel }
      })
      panel._panel?.webview.postMessage({ type: "atResults", matches, seq })
    } catch (e) {
      if (panel._atSeq !== seq) return  // 迟到错误同样不回显（空回显会清掉新下拉）
      console.error("[chat-panel] atComplete failed:", e.message)
      panel._panel?.webview.postMessage({ type: "atResults", matches: [], seq })
    }
  }

export function getEmbedder(_panel) {
    return getSharedEmbedder()
  }

export async function resolveEmbedder(_panel) {
    // Embedding key now lives in the shared config.json (CLI parity); legacy SecretStorage
    // entries were migrated into it by migrateLegacySettings.
    const emb = loadEmbeddingConfig()
    if (emb?.apiKey && emb.baseURL && emb.model) {
      setVSCodeEmbedder(emb)
    }
    return getSharedEmbedder()
  }

export async function saveEmbeddingConfig(panel, { apiKey }) {
    if (apiKey) {
      // Preserve an existing custom embedding endpoint/model (e.g. local Ollama); only
      // default to SiliconFlow when nothing is configured yet.
      const existing = loadEmbeddingConfig() ?? {}
      const baseURL = existing.baseURL || "https://api.siliconflow.cn/v1"
      const model = existing.model || "BAAI/bge-m3"
      saveEmbeddingConfigToFile({ apiKey, baseURL, model })
      resetEmbedder()
      setVSCodeEmbedder({ baseURL, model, apiKey })
    } else {
      // Delete key — remove from shared config.json and reset the cached embedder
      saveEmbeddingConfigToFile({ apiKey: "" })
      resetEmbedder()
    }
    panel._pushSettings()
  }

/** First-build nudge: prompt to build when this project has no core index yet. Model
 *  changes need NO prompt — the core face invalidates the stale vectors and backfills
 *  lazily on the next search（W8 重建 UX：原「Rebuild now?」提示退场）。 */
export async function maybePromptIndex(panel) {
    const cwd = _cwd()
    if (!cwd) return
    const memory = await memoryFor(cwd)
    if (!memory) return
    let built = true
    try { built = readIndexCounts(memory, cwd).files > 0 } catch { return }
    if (built) return

    const answer = await vscode.window.showInformationMessage(
      "Vector search index not built. Build now? (~30s for small projects, longer for large ones)",
      "Build", "Later"
    )
    if (answer === "Build") buildIndex(panel)
  }

/** Build/refresh the project index on the core face: `gitSync` (incremental, when the
 *  commit anchor exists) → full-scan fallback `codeSync` ∥ `docSync` (different tables —
 *  SQLite WAL; CLI `backgroundIndex` 同形). Core sync has no interrupt seam ⇒ the
 *  notification is not cancellable（W8 端差收正）。 */
export async function buildIndex(panel) {
    const cwd = _cwd()
    if (!cwd) {
      vscode.window.showErrorMessage("No workspace folder open.")
      return
    }
    const memory = await memoryFor(cwd)
    if (!memory) {
      vscode.window.showErrorMessage("ThinCoder: the search index is unavailable on this host — the memory face is disabled (unsupported host runtime).")
      return
    }
    const embedder = getEmbedder()

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Building search index...",
      cancellable: false,
    }, async (progress) => {
      const face = await loadMemoryFace()
      const onProgress = (label) => (p) => {
        if (p.phase === "scan") {
          progress.report({ message: `Scanning ${p.total} files…` })
          postIndexProgress(panel, p)
        } else if (p.phase === "index") {
          progress.report({ message: `${label} ${p.current}/${p.total}` })
          postIndexProgress(panel, p)
        } else if (p.phase === "done") {
          progress.report({ message: "Done" })
          postIndexProgress(panel, p)
        }
      }
      try {
        const gitRes = await face.gitSync(memory, cwd, { onProgress: onProgress("Indexing…") })
        let codeRes = null
        let docRes = null
        if (gitRes === null) {
          // No commit anchor / not a git repo / git unavailable → full scan
          const [code, doc] = await Promise.allSettled([
            face.codeSync(memory, cwd, { onProgress: onProgress("Indexing code…") }),
            face.docSync(memory, cwd, { onProgress: onProgress("Indexing docs…") }),
          ])
          codeRes = code.status === "fulfilled" ? code.value : null
          docRes = doc.status === "fulfilled" ? doc.value : null
        }
        const { files } = readIndexCounts(memory, cwd)
        // VP-9 可见化：未列入扩展名（有则提示行——声明指路；全量回退路径才有计数）。
        // 两 sync 各产一份 tally（同一已知集、同一文件面）——取其一，不双计。
        const unlisted = [codeRes?.unlistedExts, docRes?.unlistedExts].find((u) => u?.count > 0) ?? null
        const hint = unlisted
          ? ` ${unlisted.count} file(s) skipped — extensions not indexed: ${unlisted.exts.map((e) => e.ext).join(", ")}; declare index.codeExtensions in .thincoder/conventions.json to include them.`
          : ""
        vscode.window.showInformationMessage(
          `Index built: ${files} files.` + (embedder ? " Semantic search is now active." : "") + hint
        )
      } catch (e) {
        vscode.window.showErrorMessage(`Index build failed: ${e.message}`)
      }
    })
    // The panel set "Building…" + disabled the button — refresh its index status
    // so the UI recovers without reopening the panel.
    pushIndexStatus(panel)
  }

// ─── 旧索引目录清退（W8 §2「旧目录清退」）────────────────────────────

/** 归一前的文件制派生存根：`{cwd}/.thincoder/index/`（manifest.json + vectors.bin）。
 *  归一后零读取（唯一读写方 = 删除集）——理由：其为派生缓存（全量可重建）但位于用户仓内
 *  （文件树可见 / 可能入 git 状态）⇒「派生缓存」不构成静默删除的授权。 */
export const LEGACY_INDEX_DIR = ".thincoder/index"
const LEGACY_INDEX_ASKED_KEY = "thincoder.legacyIndexRemovalAsked"

/** 告示（升级后首次面板初始化 · 每项目恰一次——memento 去重）：[删除][保留]。
 *  仅 `.thincoder/index/` 子目录在范围；`.thincoder/` 其余（`memory/` · `conventions.json`）
 *  在读面续用——零触碰。 */
export async function maybePromptLegacyIndexRemoval(panel) {
    const cwd = _cwd()
    if (!cwd) return
    if (!existsSync(join(cwd, LEGACY_INDEX_DIR))) return
    const memento = panel?._context?.globalState
    const key = `${LEGACY_INDEX_ASKED_KEY}:${cwd}`
    try { if (await memento?.get(key)) return } catch { /* unreadable memento → ask once this session */ }
    try { await memento?.update(key, true) } catch { /* best effort — the flag is a courtesy, not a gate */ }
    const answer = await vscode.window.showInformationMessage(
      "ThinCoder: the legacy index directory .thincoder/index/ is no longer used — the search index now lives in the shared database. Delete it?",
      "Delete", "Keep"
    )
    if (answer === "Delete") removeLegacyIndexDir(cwd)
  }

/** 唯一删除点（挂告示动作 · 用户显式触发 · 幂等）——递归删 `{cwd}/.thincoder/index/`。
 *  零自动删除路径（全仓调用点唯一——机判见 test/memory-index-face.test.mjs）。 */
export function removeLegacyIndexDir(cwd) {
    try { rmSync(join(cwd, LEGACY_INDEX_DIR), { recursive: true, force: true }) } catch { /* already gone / locked — idempotent */ }
  }
