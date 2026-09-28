/**
 * shared.mjs — 拆壳薄壳（S2 W14 · `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W14）。
 *
 * 通用面（DESC / 编解码 / EOL·hash / runGit / truncate …）**已迁核单源**：
 * `@thincoder/core/tools/shared.mjs`（原 413 行镜像面删除——消费方直引核子路径）。
 * 本档保留 = **端侧缝供值 + VSC 专属 helper**（`CORE-UNIFICATION.md` §2.13.3/§2.13.5
 * 接收档指名）——四缝在档尾模块装配期一次接线：
 *   · `configureWritePath`      ← 编辑器写路径（getOpenDoc / applyEditorEdit——脏缓冲拒写
 *                                 由核内门禁统一判定；写回 = 全文替换 + save + md 预览刷新）
 *   · `configureExecRun`        ← `runInterruptible`（可中断执行器：spawn + abort/timeout 树杀，
 *                                 不阻塞 extension host 事件循环——linter/verify/ops 消费；
 *                                 **R3 改指核件**：实现已上提 `@thincoder/core/tools/exec-run.mjs`，
 *                                 本端零副本——桌面功能对位批 · #523② · KD-T2 纯搬）
 *   · `configureProcessTreeKill`← killProcessTree（树杀：Windows taskkill /T /F / POSIX 组杀）
 *   · `configureTreeResolve`    ← resolvePath 式 cwd 归一（#56 端形态：join 解析，不走 realpath）
 * 未注入面（懒加载/缺省即端形态）在核内缺省径上语义等价，见各缝落点注释。
 */
import { join, isAbsolute } from "node:path"
import * as vscode from "vscode"
import { configureWritePath } from "@thincoder/core/tools/write-path.mjs"
import { configureExecRun, runInterruptible } from "@thincoder/core/tools/exec-run.mjs"
import { configureProcessTreeKill } from "@thincoder/core/tools/execute.mjs"
// 树杀单源（台账 #208② · TOOLS.md §6.14 落位表行 2）：本地副本删除——改用核单源
// `process-tree.mjs`（静态闭包仅 `node:child_process`——engine-floor 守卫契约②零影响；
// 该档已由 `@thincoder/core/tools/execute.mjs` 在同一静态链上引入）。
import { killProcessTree } from "@thincoder/core/tools/process-tree.mjs"
import { configureTreeResolve } from "@thincoder/core/tools/tree.mjs"

/** Maximum buffer size per stream (stdout / stderr) before truncation (bash 端壳面). */
export const MAX_STREAM_BUF = 2_000_000

// ─── 编辑器写路径（configureWritePath 供值）────────────────────────────

/** Get the open TextDocument for a path, or null if not open.
 *  win32 is case-insensitive: `d:\` vs `D:\` used to mismatch and put us on the
 *  disk-write path while the editor held the same file (split-brain). */
export function getOpenDoc(absPath) {
  try {
    const win = process.platform === "win32"
    const key = win ? absPath.toLowerCase() : absPath
    return vscode.workspace.textDocuments.find((d) => (win ? d.uri.fsPath.toLowerCase() : d.uri.fsPath) === key) || null
  } catch { return null }
}

/** Refresh the built-in Markdown preview after writing a .md file — the preview
 *  caches rendered content and can keep showing stale output after agent-side
 *  writes (2026-08-14 user report). No-op for non-markdown paths / when no
 *  preview is open. */
export function refreshMarkdownPreview(absPath) {
  if (!/\.(?:md|markdown|mdown)$/i.test(absPath)) return
  vscode.commands.executeCommand("markdown.preview.refresh").then(undefined, () => { /* no preview open — fine */ })
}

/** Apply a full text replacement to an open document via WorkspaceEdit.
 *  SAVES after applying — without the save the buffer goes dirty while the disk
 *  stays stale: the next edit hits the isDirty guard (locked by our own edit),
 *  and any external write races the user's later save (split-brain data loss). */
export async function applyEditorEdit(doc, fullText) {
  const edit = new vscode.WorkspaceEdit()
  const range = new vscode.Range(0, 0, doc.lineCount, 0)
  edit.replace(doc.uri, range, fullText)
  await vscode.workspace.applyEdit(edit)
  await doc.save()
  refreshMarkdownPreview(doc.uri.fsPath)
}

/** Apply a range replacement to an open document via WorkspaceEdit.
 *  Saves after applying (see applyEditorEdit — unsaved edits self-lock the
 *  isDirty guard and race external writers).
 *
 *  **retired（W14）**——range 径随核全文写回退场（`EDIT-HELPERS.md` §6 `lfOffsetToRaw`
 *  同批退场）：现链上零消费者，保留仅为端壳"现形"登记（任务书 §2 W14 保留面）。
 *  勿再接线——需 range 写回时先改设计（核 `write-path.mjs` 只承载全文写）。 */
export async function applyEditorRangeEdit(doc, startLine, startCol, endLine, endCol, newText) {
  const edit = new vscode.WorkspaceEdit()
  const range = new vscode.Range(startLine, startCol, endLine, endCol)
  edit.replace(doc.uri, range, newText)
  await vscode.workspace.applyEdit(edit)
  await doc.save()
  refreshMarkdownPreview(doc.uri.fsPath)
}

// ─── VSC 专属 helper ───────────────────────────────────────────────

/** Resolve a path relative to cwd or absolute */
export function resolvePath(p, cwd) {
  if (isAbsolute(p)) return p
  return join(cwd, p)
}

// ─── 执行面（configureExecRun / configureProcessTreeKill 供值）──────────

// `runInterruptible`（可中断执行器：spawn + abort/timeout 树杀）**已上提核件**（R3 · 桌面功能对位批 ·
// #523② —— KD-T2 纯搬 + 转口）：单源 = `@thincoder/core/tools/exec-run.mjs`（本档 import 面取用，
// 档尾接线注入 —— 本端零副本）；树杀实现 = `@thincoder/core/tools/process-tree.mjs`（同见 import 面）。

// ─── 端壳缝接线（模块装配期一次；缺省不覆盖 = 核内默认径）──────────────────

configureWritePath({
  openDoc: getOpenDoc,
  isDirty: (doc) => doc?.isDirty === true,
  applyEdit: async (doc, content) => { await applyEditorEdit(doc, content) },
})
configureExecRun({ run: runInterruptible })
configureProcessTreeKill({ killTree: killProcessTree })
configureTreeResolve({ resolve: (ctx, p) => resolvePath(p, ctx.cwd) })
