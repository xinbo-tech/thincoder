/**
 * panel-index.mjs — ChatPanel semantic-index + embedder management (split out of
 * chat-panel.mjs), plus the @-file completer. Every function takes the ChatPanel
 * instance as `panel`.
 */
import * as vscode from "vscode"
import { relative } from "node:path"
import { getEmbedder as getSharedEmbedder, setVSCodeEmbedder, resetEmbedder } from "../embed-config.mjs"
import { loadEmbeddingConfig, saveEmbeddingConfig as saveEmbeddingConfigToFile } from "../config-io.mjs"
import { buildIndex as runBuildIndex, needsRebuild, loadIndexManifest, indexCompat } from "../indexer.mjs"
import { _cwd } from "./panel-messages.mjs"

/** §14 C-12#1/C-15：索引进度 → statusText（webview 状态行段——scan/embed/done 三相位；
 *  done 相位由 webview 清段——索引结束回常态）。 */
function postIndexProgress(panel, p) {
  panel._panel?.webview.postMessage({ type: "statusText", kind: "index", phase: p.phase, done: p.done ?? null, total: p.total ?? null })
}

export function pushIndexStatus(panel) {
    const cwd = _cwd()
    if (!cwd) return
    const embedder = getEmbedder()
    let status = null
    if (embedder) {
      try {
        const manifest = loadIndexManifest(cwd)
        if (manifest) {
          const files = Object.keys(manifest.files).length
          const chunks = Object.values(manifest.files).reduce((sum, f) => sum + f.chunks.length, 0)
          status = { built: true, files, chunks }
          // B1 (MEMORY.md §4.2 契约四): the built index was embedded with another model than the
          // one currently configured — surface both names so the settings row can say why
          // vector search is silent (the score would be meaningless, not merely empty).
          const compat = indexCompat(cwd, embedder)
          if (!compat.compatible) status.mismatch = { indexModel: compat.indexModel, currentModel: compat.currentModel }
        } else {
          status = { built: false }
        }
      } catch { status = { built: false } }
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

export async function maybePromptIndex(panel) {
    const cwd = _cwd()
    if (!cwd) return
    const embedder = getEmbedder()
    if (!embedder) return

    // B1 (MEMORY.md §4.2 契约四): prompt when the index needs a rebuild OR when it was built
    // with another model — the latter is the silent-wrong-results case (score=0 hits are
    // ranked and returned), so it must be visible exactly like a missing index. 不匹配时文案
    // 恒明示两个模型名（needed ∧ 不匹配 的合取分支同样——"not built" 句对已建索引是假陈述）。
    let mismatch = null
    try {
      const { needed } = needsRebuild(cwd)
      const compat = indexCompat(cwd, embedder)
      if (!needed && compat.compatible) return
      if (!compat.compatible) mismatch = compat
    } catch { return }

    const answer = await vscode.window.showInformationMessage(
      mismatch
        ? `Index was built with ${mismatch.indexModel} but the current embedding model is ${mismatch.currentModel}. Rebuild now?`
        : "Vector search index not built. Build now? (~30s for small projects, longer for large ones)",
      "Build", "Later"
    )
    if (answer === "Build") buildIndex(panel)
  }

export async function buildIndex(panel) {
    const cwd = _cwd()
    if (!cwd) {
      vscode.window.showErrorMessage("No workspace folder open.")
      return
    }
    const embedder = await resolveEmbedder()
    if (!embedder) {
      vscode.window.showErrorMessage("No embedding API key configured. Configure embedding.apiKey in ~/.thincoder/config.json")
      return
    }

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Building search index...",
      cancellable: true,
    }, async (progress, token) => {
      const ctrl = new AbortController()
      const sub = token.onCancellationRequested(() => ctrl.abort())
      try {
        const result = await runBuildIndex(cwd, embedder, {
          onProgress: (p) => {
            if (p.phase === "scan") {
              progress.report({ message: `Scanning ${p.total} files…` })
              postIndexProgress(panel, p)
            } else if (p.phase === "chunk") {
              progress.report({ message: `Chunking ${p.total} chunks…` })
            } else if (p.phase === "embed") {
              progress.report({ message: `Embedding chunks ${p.done}/${p.total}` })
              postIndexProgress(panel, p)
            } else if (p.phase === "done") {
              progress.report({ message: "Done" })
              postIndexProgress(panel, p)
            }
          },
          signal: ctrl.signal,
        })
        // VP-9 可见化：未列入扩展名（有则提示行——声明指路；零则原文案不变）。
        const unlisted = result.unlistedExts
        const hint = unlisted?.count > 0
          ? ` ${unlisted.count} file(s) skipped — extensions not indexed: ${unlisted.exts.map((e) => e.ext).join(", ")}; declare index.codeExtensions in .thincoder/conventions.json to include them.`
          : ""
        vscode.window.showInformationMessage(
          `Index built: ${result.files} files, ${result.chunks} chunks. Semantic search is now active.${hint}`
        )
      } catch (e) {
        if (e.name === "AbortError" || token.isCancellationRequested) {
          vscode.window.showWarningMessage("Index build cancelled.")
        } else {
          vscode.window.showErrorMessage(`Index build failed: ${e.message}`)
        }
      } finally {
        sub.dispose()
      }
    })
    // The panel set "Building…" + disabled the button — refresh its index status
    // so the UI recovers without reopening the panel.
    pushIndexStatus(panel)
  }
