/**
 * memory/file-list.mjs — 项目文件清单面（自 `memory/code-sync.mjs` 迁出 · 2026-10-01 core 拆分批 #755 ∥ #786）。
 * 内容 = `indexExtensions`（内置扩展名表 ∪ 项目声明并集）∥ `listProjectFiles`（git 列面 + 非 git walk
 * 回退 + unlisted 计数；`index.excludePaths` §6.14 面① 双径过滤：git 列面筛行 ∥ walk 剪枝）——迁出块逐字。
 * 原档 `memory/code-sync.mjs` 经 `export { … } from` 转口保名（消费面 / 批内件 import 面零改）。
 */
import { CODE_EXTS, DOC_EXTS } from "./schema.mjs"
import { walkProjectFiles, isSkippedRelPath, extensionOf, createUnlistedTally, MAX_WALK_FILES } from "./file-walk.mjs"
import { loadProjectDeclaration, isExcludedRelPath } from "../conventions.mjs"
import { logEvent } from "../log.mjs"

/**
 * Index extension sets = built-in tables ∪ project declaration
 * (`PROJECT-MANIFEST.json` → index.codeExtensions / index.docExtensions;
 * PORTABILITY PO-9/§3.7 — a project may declare extensions this product does not
 * ship a default for). Declaration only ADDS (union), never removes.
 */
export function indexExtensions(dir) {
  const conv = loadProjectDeclaration(dir)
  return {
    code: new Set([...CODE_EXTS, ...conv.index.codeExtensions]),
    doc: new Set([...DOC_EXTS, ...conv.index.docExtensions]),
  }
}

/**
 * List project files matching the given extensions.
 * Preferred source = git (`git ls-files --cached --others --exclude-standard`:
 * tracked + untracked-not-ignored, .gitignore respected). Projects WITHOUT git
 * fall back to a filesystem walk (PORTABILITY FR15/P8) — before, the index was
 * silently empty there. The walk cannot honour .gitignore (no git → no such
 * concept) and skips the shared SKIP_DIRS/dot-directory set instead.
 * Returns { entries, unlisted }: `entries` = { abs, rel } pairs (rel relative to
 * dir); `unlisted` = files whose extension is in NO index list (count + sample),
 * the visible signal behind "my .xyz files are not searchable" (PORTABILITY PO-9).
 * Declared `index.excludePaths` (§6.14 面①) filters BOTH paths — git listing filters the
 * line set; the walk prunes excluded subtrees during traversal (no expansion, no budget).
 * `truncated` = the non-git walk hit its file cap (capped trees are logged, never
 * silently indexed-partial). opts.maxFiles = the walk cap (test seam).
 */
export async function listProjectFiles(dir, exts, { maxFiles } = {}) {
  const { execFile: _execFile } = await import("node:child_process")
  const { join: joinPath } = await import("node:path")
  const { code, doc } = indexExtensions(dir)
  const decl = loadProjectDeclaration(dir)
  const excluded = (rel) => isExcludedRelPath(rel, decl, dir)
  const tally = createUnlistedTally(new Set([...code, ...doc]))

  const files = []
  const finish = (truncated = false) => ({ entries: files, unlisted: tally.result(), truncated })

  // Git listing when available; a non-git project falls through to the walk.
  let gitTop
  try {
    gitTop = (await new Promise((resolve, reject) => {
      _execFile("git", ["rev-parse", "--show-toplevel"], { cwd: dir, encoding: "utf8", timeout: 5000, windowsHide: true },
        (err, stdout) => { if (err) reject(err); else resolve(stdout.trim()) })
    })).replace(/\\/g, "/")
  } catch {
    // Not a git repo → filesystem walk (FR15: the index must still be usable).
    const walked = await walkProjectFiles(dir, exts, { knownExts: new Set([...code, ...doc]), isExcluded: excluded, ...(maxFiles !== undefined ? { maxFiles } : {}) })
    files.push(...walked.files)
    // The walk's cap must stay visible end-to-end (file-walk.mjs: "never silently
    // dropped") — a capped listing says so in the log, not only in a discarded flag.
    if (walked.truncated) {
      logEvent("index:truncated", { dir, files: walked.files.length, maxFiles: maxFiles ?? MAX_WALK_FILES })
    }
    return { entries: files, unlisted: walked.unlisted, truncated: walked.truncated }
  }

  try {
    const raw = await new Promise((resolve, reject) => {
      _execFile("git", ["ls-files", "--cached", "--others", "--exclude-standard"],
        { cwd: dir, encoding: "utf8", timeout: 15000, windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
        (err, stdout) => { if (err) reject(err); else resolve(stdout) })
    })
    for (const line of raw.trim().split("\n")) {
      const p = line.trim()
      if (!p) continue
      const rel = p.replace(/\\/g, "/")
      if (isSkippedRelPath(rel) || excluded(rel)) continue
      const ext = extensionOf(rel)
      if (!ext || !exts.has(ext)) { tally.note(rel); continue }
      files.push({ abs: joinPath(dir, rel), rel })
    }
  } catch { /* ls-files failed */ }

  return finish()
}
