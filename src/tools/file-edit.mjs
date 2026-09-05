/**
 * file-edit.mjs — edit + hashline_edit tools（2026-09-05 module-split：file.mjs 552 > 500
 * 硬限——read/write 留在 file.mjs；本文件 verbatim 迁入 edit 语义族（similarLinesBlock/
 * findWhitespaceVariant/EDIT_MUTEX_TEXT/WHITESPACE_VARIANT_NOTE + editTool +
 * hashlineEditTool）——语义零变；file.mjs re-export（消费方 import 面不变）。
 * 头注释/import 面沿用 file.mjs（shared.mjs + edit-diff.mjs）。
 */

import { readFile, writeFile } from "node:fs/promises"
import { resolvePath, getOpenDoc, applyEditorEdit, applyEditorRangeEdit, normalizeEOL, stripBom, lfOffsetToRaw, detectFileEol, joinWithEol, findCandidates, FFFD_WARNING, gitDiffOne, hashLine, refreshMarkdownPreview } from "./shared.mjs"
import { applyRegion, EMPTY_NEW_REASON } from "./edit-diff.mjs"

/**
 * F3/§14.1 — similar-lines candidate block for a not-found old_string (§14 F3, extended
 * to the batch channel by §14.1 D14.1.1 — CLI parity: the CLI's shared computeEditEntry
 * appends candidates on every not-found, single form and batch alike).
 * Scoring: LCS line-level, top 3, score ≥ 0.5 (findCandidates); multi-line old_string
 * scores only its first line (header marks it). Zero candidates → "" (whole block
 * omitted — the searched:/grep lines stay). Appended AFTER the searched line — the
 * "Error:"/searched prefixes stay untouched (N-14.1a).
 */
function similarLinesBlock(lines, oldString) {
  const cands = findCandidates(lines, oldString)
  if (cands.length === 0) return ""
  const header = oldString.includes("\n")
    ? `\n  similar lines (old_string line 1: "${oldString.split("\n")[0].slice(0, 80)}"):`
    : "\n  similar lines:"
  return header + "\n" + cands.map((c) => `    L${c.line}: ${c.preview} (${Math.round(c.score * 100)}%)`).join("\n")
}

/**
 * P15.11（2026-09-05 用户裁定——CLI edit-diff findWhitespaceVariant 同构镜像）：
 * old_string 逐字 not-found 时——若文件中存在**唯一**窗口：行数与 old 相同、逐行 trim()
 * 相等（内容零差异——差异仅前导/尾随空白——EOL 已在 normalize 域消除）→ 返回 actual
 * （文件窗口原文）；多窗口/old 含尾换行 → null（歧义不猜）。
 */
function findWhitespaceVariant(content, old) {
  if (old.endsWith("\n")) return null
  const oldLines = old.split("\n")
  const fileLines = content.split("\n")
  const m = oldLines.length
  if (m === 0 || fileLines.length < m) return null
  const trimmed = oldLines.map((l) => l.trim())
  let hit = null
  for (let i = 0; i + m <= fileLines.length; i++) {
    let same = true
    for (let j = 0; j < m; j++) {
      if (fileLines[i + j].trim() !== trimmed[j]) { same = false; break }
    }
    if (!same) continue
    const actual = fileLines.slice(i, i + m).join("\n")
    if (actual === old) continue
    if (hit) return null
    hit = { actual }
  }
  return hit
}

/** P15.11 note 文案（各端成功消息追加——与 CLI edit-diff WHITESPACE_VARIANT_NOTE 同句） */
const WHITESPACE_VARIANT_NOTE = "applied to the unique whitespace-only match (content identical, leading/trailing whitespace differs from your old_string)"

// D15.3#9 修订（2026-09-05 用户裁定——CLI edit-diff EDIT_ARGS_MUTEX 同句）：edits 只与顶层
// old_string/new_string 互斥——顶层 path/filePath 合法（无自带 path 条目的默认）。
const EDIT_MUTEX_TEXT = "edits array is mutually exclusive with top-level old_string/new_string — a top-level path is allowed (default for entries without their own path); provide each change's old_string/new_string inside its edits entry"

export const editTool = {
  name: "edit",
  description:
    "Edit a file as a patch. old_string is the current content of the region to change (must match exactly once); new_string is the desired result of that region. Lines shared by both are kept; lines only in new_string take their position relative to the shared lines (LCS order) — when no line overlaps, new_string is inserted after old_string (old content stays) — except a unique single-line old_string paired with a single-line new_string: that exact line is replaced in place (line count unchanged); for a multi-line replacement, include a shared context line — for adding a new line use insert_after: a unique single-line old/new pair replaces the line in place; multi-line zero-overlap pairs still insert per the diff rules above. replace_all keeps literal replacement of every occurrence — the insert rule does not apply.\n" +
    "Add a line/entry after a known line → insert_after — includes checklist items and doc lines.\n" +
    "Parameters:\n" +
    "- path (required): File path, relative to cwd or absolute (alias: filePath)\n" +
    "- old_string (required): Current content of the region — must match exactly once in the file; for a change that keeps a line, include the unchanged neighbor line in BOTH old_string and new_string\n" +
    "- new_string (required): Desired result of the region — diffed against old_string (shared lines kept; zero overlap → new_string inserted after old_string — a unique single-line old/new pair replaces the line in place)\n" +
    "- replace_all: Replace every occurrence literally (default false) — the insert rule does not apply\n" +
    "- edits: 批量形态（CLI parity）——同文件多处修改 → 一次调用原子完成（同文件条目串行应用，各基于前一条结果）；多文件独立修改 → 同一 `edits` 数组多条目（先全量检查，任一失败全不写）——prefer one batched call over N single edits。与顶层 old_string/new_string 互斥——顶层 path/filePath 合法（无自带 path 条目的默认——条目自带 path 优先）。\n" +
    "- use the most recent read of the file as the source of old_string / line numbers / hashes — re-read after the file changed",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path (single form: required; with the edits array: optional top-level default for entries without their own path) (alias: filePath)" },
      filePath: { type: "string", description: "Alias for path" },
      old_string: { type: "string", description: "Exact text to replace" },
      new_string: { type: "string", description: "Replacement text" },
      replace_all: { type: "boolean", description: "Replace all occurrences" },
      edits: {
        type: "array",
        description:
          "Batch form — multiple edits in ONE call, atomic (any failure writes nothing; same-file entries apply serially, each based on the previous result). Use it for multiple changes to the same file AND for independent changes across multiple files — prefer one batched call over N single edits. A top-level path (or filePath) is allowed — it defaults entries without their own path (entry paths win). Mutually exclusive with top-level old_string/new_string — provide each change's old/new inside its edits entry.",
        items: {
          type: "object",
          properties: {
            path: { type: "string" },
            old_string: { type: "string" },
            new_string: { type: "string" },
            replace_all: { type: "boolean" },
          },
          required: ["old_string", "new_string"],
        },
      },
    },
    required: [],
  },
  // #2（2026-09-02 评审修复）：edits 数组形态的路径感知——之前缺 touchedPaths 时兜底
  // `[args?.path]` 在批量形态下是 `[undefined]`，被 typeof 检查跳过 → 批量编辑的文件
  // 完全未记入 _touchedFiles（verify 文件清单 / lint "最近修改文件" 全漏）。照 CLI
  // file.mjs:239 实现；filePath 别名一并处理（否则 filePath-only 写入绕过工程门禁）。
  touchedPaths(args) {
    // 2026-09-05 用户裁定（CLI parity）：顶层 path/filePath = 批默认——仅当有条目缺 path 时
    // 计入（条目全带 path 时顶层不实际使用——不虚报进 _touchedFiles）
    if (args.edits) {
      const out = args.edits.map((e) => e.path).filter(Boolean)
      const top = args.path || args.filePath
      if (top && args.edits.some((e) => !e.path)) out.push(top)
      return out
    }
    return args.path || args.filePath ? [args.path || args.filePath] : []
  },
  async execute(args, ctx) {
    // 2026-08-31 工具顺手度（CLI ebd70eb parity）：数组形态——一次多文件原子替换
    if (args.edits) {
      if (!Array.isArray(args.edits) || args.edits.length === 0) {
        return "Error: edits must be a non-empty array of {path, old_string, new_string}"
      }
      if (args.old_string !== undefined || args.new_string !== undefined) {
        return "Error: " + EDIT_MUTEX_TEXT
      }
      // 原子：先全量检查（所有文件的替换都可执行）——任一失败全不写。
      // 2026-09-01 缺陷修复（TOOLS.md §9 ②"同文件多条规则"）：同一 path 的多条编辑
      // 按序**串行累积应用**——第 n 条基于前 n-1 条已应用后的累积内容做匹配与替换
      // （原实现每条都基于盘上/文档原始内容计算、应用循环后置，同文件后者覆盖前者 →
      // 除最后一条外全部静默丢失）；跨 path 条目互不影响（并行原子语义不变）。
      const groups = new Map() // abs → 每文件一条流水线（LF 域累积 text + 对应 raw 域快照）
      for (const e of args.edits) {
        // #1（2026-09-02 评审修复）：批量形态类型校验补齐——非字符串 old_string/new_string
        // （含缺省 undefined）之前在 normalizeEOL 抛 TypeError 而非错误消息；逐条返回与
        // 单条路径形态同款的诊断消息（单条形态有 typeof 校验，批量形态缺）。
        if (!e || typeof e !== "object") return "Error: each edit must be an object with {old_string, new_string} — path optional (per entry or top-level)"
        // 2026-09-05 用户裁定（CLI parity）：条目 path 优先；缺省回退顶层 path/filePath
        const p = e.path || args.path || args.filePath
        if (!p) return "Error: each edit must have a path — give each entry its own path or pass a top-level path"
        if (!e.old_string) return `Error: edit for ${p}: old_string must not be empty`
        if (typeof e.old_string !== "string") return `Error: edit for ${p}: old_string must be a string`
        if (typeof e.new_string !== "string") return `Error: edit for ${p}: new_string must be a string`
        const abs = resolvePath(p, ctx.cwd)
        let g = groups.get(abs)
        if (!g) {
          const doc = getOpenDoc(abs)
          const rawText = doc ? doc.getText() : await readFile(abs, "utf8").catch(() => null)
          if (rawText === null) return `Error: edit aborted (atomic — no files written): cannot read ${p}`
          if (doc?.isDirty) return `Error: edit aborted (atomic — no files written): ${p} has unsaved changes in the editor`
          g = { abs, path: p, doc, rawText, fileEol: detectFileEol(rawText), text: normalizeEOL(rawText), edits: [], rawReplaceAll: false }
          groups.set(abs, g)
        }
        g.edits.push(e)
      }
      const prepared = [] // 顺序 = args.edits 顺序（回显按条）；midText/range 冻结该条应用前的累积状态
      for (const g of groups.values()) {
        for (const e of g.edits) {
          let oldS = normalizeEOL(e.old_string)
          const newS = normalizeEOL(e.new_string)
          let note = null
          let count = g.text.split(oldS).length - 1
          if (count === 0) {
            // P15.11（2026-09-05）：唯一空白差异窗口 → 自动落点（内容零差异）——歧义/实质差异仍报错
            const variant = findWhitespaceVariant(g.text, oldS)
            if (variant) { oldS = variant.actual; count = 1; note = WHITESPACE_VARIANT_NOTE }
          }
          if (count === 0) {
            // §14.1 D14.1.1 (2026-09-05): batch channel mirrors the single-form F3 block —
            // candidates appended after the searched line, zero candidates → block omitted.
            return `Error: edit aborted (atomic — no files written): old_string not found in ${g.path}\n` +
              `  searched: "${oldS.slice(0, 100).split("\n")[0]}${oldS.length > 100 ? "…" : ""}" — use grep to locate the actual content` +
              similarLinesBlock(g.text.split("\n"), oldS)
          }
          if (!e.replace_all && count > 1) {
            return `Error: edit aborted (atomic — no files written): old_string matches ${count} times in ${g.path}; ` +
              `provide more context or set replace_all`
          }
          // §15 D15.1 + §15.2 分支 0: empty new_string (pure deletion intent) — explicit
          // error; each batch entry runs the region judgment in edit-diff.mjs
          // (applyRegion = §15.2 分支 0 single-line in-place replace + applyPatchLines
          // LCS diff — replace_all keeps literal per-occurrence swap, never branch 0).
          if (newS === "") return `Error: edit aborted (atomic — no files written): ${EMPTY_NEW_REASON}`
          let newApplied = newS
          if (!e.replace_all) {
            const patch = applyRegion(oldS, newS)
            if (!patch.ok) return `Error: edit aborted (atomic — no files written): ${patch.reason}`
            newApplied = patch.resultText
          }
          const idx = g.text.indexOf(oldS)
          // #1（2026-09-01 交付评审尾巴）：raw 镜像只支持"单处替换"的精确拼接。
          // replace_all 条目（count ≥ 2）原实现只把首处替换拼进 rawText——镜像从此
          // 漂移，后续条目的 lfOffsetToRaw 定位错 → applyEditorRangeEdit 改错位置
          // （静默数据损坏）。修法（方案 ②）：doc 路径下 replace_all 条目不计算
          // range（其应用本就要求走 applyEditorEdit 全量语义）；且从该条起 raw 镜像
          // 不再推进（全量替换无法精确镜像），后续所有条目 range 置 null 统一走
          // 全量语义——midText 域串行累积正确，结果与逐条单独调用完全一致。
          // 注：raw 镜像不同于 fileEol 化重建——fileEol 化会把文件里 lone-\r 的
          // 行内混合 EOL 片段整体翻成 CRLF，破坏 raw 域快照语义（方案 ① 被否）。
          const range = (g.doc && !g.rawReplaceAll && !e.replace_all)
            ? { start: lfOffsetToRaw(g.rawText, idx), end: lfOffsetToRaw(g.rawText, idx + oldS.length) }
            : null
          prepared.push({
            g, midText: g.text, oldS, newS, count, replaceAll: !!e.replace_all,
            note, // P15.11——空白差异自动落点标记（成功消息追加）
            // D15.1/§15.2: newApplied = applyRegion 判定结果（分支 0 单行×单行就地替换 ===
            // newS；LCS 替换 === newS；零重叠插入情形 = oldS+newS）——写入路径必须用
            // newApplied，否则 batch 里的零重叠条目会退化成纯替换（模拟域 g.text 与真实
            // 写入漂移）。
            newApplied,
            // doc range edit 的位置映射基于本条应用前的 raw 域快照——串行累积，不漂移
            range,
          })
          g.text = e.replace_all ? g.text.split(oldS).join(newApplied) : g.text.replace(oldS, () => newApplied)
          if (range) {
            // 精确镜像（本条替换区 LF→raw 逐段拼接）：CRLF 文件里 newApplied 带 LF 时
            // normalize-rebuild 会把混合 EOL 片段全转 CRLF——后续条目的 raw 坐标随之漂移
            g.rawText = g.rawText.slice(0, range.start) +
              (g.fileEol === "\r\n" ? newApplied.replace(/\n/g, "\r\n") : newApplied) +
              g.rawText.slice(range.end)
          } else if (g.doc) {
            g.rawReplaceAll = true // raw 镜像从 replace_all 条目起失效——后续条目不再定位
          }
        }
      }
      // 全部检查通过——逐条应用（每条基于其冻结的累积中间态：最终状态 = 所有条目依序生效）
      const results = []
      for (const p of prepared) {
        if (p.g.doc) {
          // range edit 仅在「单处替换 + raw 镜像有效」时用（精确、最小 WorkspaceEdit）；
          // 其余（replace_all / 镜像失效后的条目，range=null）统一走 applyEditorEdit
          // 全量语义——midText 为该条应用前的串行累积内容，替换后即为目标状态。
          if (p.range) {
            const newText = p.g.fileEol === "\r\n" ? normalizeEOL(p.newApplied).replace(/\n/g, "\r\n") : normalizeEOL(p.newApplied)
            const pos = p.g.doc.positionAt(p.range.start)
            const endPos = p.g.doc.positionAt(p.range.end)
            await applyEditorRangeEdit(p.g.doc, pos.line, pos.character, endPos.line, endPos.character, newText)
          } else {
            const replaced = p.replaceAll ? p.midText.replaceAll(p.oldS, () => p.newS) : p.midText.replace(p.oldS, () => p.newApplied)
            const out = p.g.fileEol === "\r\n" ? normalizeEOL(replaced).replace(/\n/g, "\r\n") : replaced
            await applyEditorEdit(p.g.doc, out)
          }
          results.push(`Replaced ${p.replaceAll ? p.count : 1} occurrence(s) in ${p.g.path} (via editor)${p.note ? ` — ${p.note}` : ""}`)
        } else {
          const replaced = p.replaceAll ? p.midText.replaceAll(p.oldS, () => p.newS) : p.midText.replace(p.oldS, () => p.newApplied)
          const out = p.g.fileEol === "\r\n" ? normalizeEOL(replaced).replace(/\n/g, "\r\n") : replaced
          await writeFile(p.g.abs, out, "utf8")
          refreshMarkdownPreview(p.g.abs)
          results.push(`Replaced ${p.replaceAll ? p.count : 1} occurrence(s) in ${p.g.path}${p.note ? ` — ${p.note}` : ""}`)
        }
      }
      return results.join("\n")
    }

    // 单文件（现状路径）
    let { path, old_string, new_string, replace_all, filePath } = args
    path = path || filePath
    if (typeof path !== "string" || !path) return "Error: path (or filePath) is required and must be a string"
    if (typeof old_string !== "string" || typeof new_string !== "string") return "Error: old_string and new_string must be strings"
    // A model may paste old_string/new_string straight from a raw CRLF read — its
    // `\r\n` would fail the count gate against the LF-normalized text (entry bug,
    // same family). Normalize both at the entry so every downstream check agrees.
    old_string = normalizeEOL(old_string)
    new_string = normalizeEOL(new_string)
    const abs = resolvePath(path, ctx.cwd)
    const doc = getOpenDoc(abs)
    // EOL normalization on BOTH read paths: disk files are often CRLF (Windows) while
    // the model writes LF in old_string — without normalization every edit on a CRLF
    // file fails with "old_string not found". The editor doc path normalizes too
    // (getText returns the buffer as-is). Write-back restores the file's original
    // EOL style so the diff stays clean (no whole-file EOL rewrite).
    const rawText = doc ? doc.getText() : await readFile(abs, "utf8")
    // First-newline rule (CLI parity): the file's first newline decides the EOL
    // style — never count occurrences (mixed files follow the first line).
    const fileEol = detectFileEol(rawText)
    const text = normalizeEOL(rawText)
    let note = null // P15.11——空白差异自动落点标记
    let count = text.split(old_string).length - 1
    if (count === 0) {
      // P15.11（2026-09-05）：唯一空白差异窗口 → 自动落点（内容零差异）——歧义/实质差异仍报错
      const variant = findWhitespaceVariant(text, old_string)
      if (variant) { old_string = variant.actual; count = 1; note = WHITESPACE_VARIANT_NOTE }
    }
    if (count === 0) {
      // Helpful diagnosis instead of a bare miss: line ending mismatch vs genuinely absent
      const crlfCount = rawText.split(old_string.replace(/\n/g, "\r\n")).length - 1
      if (crlfCount > 0) return `Error: old_string not found with LF line endings, but matches ${crlfCount} time(s) with CRLF — internal normalization failed (report this)`
      // Similarity candidates (LCS, line-level, top 3, score ≥ 0.5) — turns the
      // "not found" black box into a pointer at the most likely intended line.
      // Multi-line old_string: only its first line is scored (marked accordingly). CLI parity.
      const candText = similarLinesBlock(text.split("\n"), old_string)
      // §14 D-TF2（B——2026-09-04）：not found 结果补 grep 定位建议（英文逐字——与 CLI edit-batch/file.mjs 同句）——
      // 模型失败后先 grep 定位实际内容，不盲目重试；candidates/CRLF 分支零改（NF-TF）。
      const preview = old_string.slice(0, 100).split("\n")[0]
      const searched = `  searched: "${preview}${old_string.length > 100 ? "…" : ""}" — use grep to locate the actual content`
      return `Error: old_string not found in ${path}\n${searched}${candText}`
    }
    if (!replace_all && count > 1) {
      return `Error: old_string matches ${count} times in ${path} — set replace_all=true or add more context to make it unique`
    }
    // §15 D15.1 + §15.2 分支 0: empty new_string (pure deletion intent) is an explicit
    // error — deletion keeps the context lines in BOTH old and new (never silent); the
    // region judgment lives in edit-diff.mjs (applyRegion = §15.2 分支 0 single-line
    // in-place replace + applyPatchLines LCS diff — replace_all = literal per-occurrence
    // swap, never branch 0 — the insert rule does not apply).
    if (new_string === "") return `Error: ${EMPTY_NEW_REASON}`
    let region = new_string
    if (!replace_all) {
      const patch = applyRegion(old_string, new_string)
      if (!patch.ok) return `Error: ${patch.reason}`
      region = patch.resultText
    }

    if (doc) {
      // Open in editor — apply via WorkspaceEdit
      if (doc.isDirty) return `Error: File has unsaved changes in the editor: ${abs}. Save or discard before allowing automated edits.`
      if (replace_all) {
        // For replace_all, apply the full text replacement. Restore the file's
        // original EOL style — passing the LF-normalized text straight through
        // silently flipped a CRLF file to LF.
        const replaced = text.replaceAll(old_string, () => new_string)
        const out = fileEol === "\r\n" ? normalizeEOL(replaced).replace(/\n/g, "\r\n") : replaced
        await applyEditorEdit(doc, out)
      } else {
        // Find the match position and apply a range edit. `idx` is an LF-domain
        // offset (normalizeEOL dropped each \r) but doc.positionAt expects raw
        // CRLF offsets — map back first or the edit drifts by one char per
        // preceding newline (line 粘连/截断/重复).
        const idx = text.indexOf(old_string)
        if (idx === -1) return `Error: old_string not found in ${path}`
        const start = lfOffsetToRaw(rawText, idx)
        const end = lfOffsetToRaw(rawText, idx + old_string.length)
        const newText = fileEol === "\r\n" ? normalizeEOL(region).replace(/\n/g, "\r\n") : normalizeEOL(region)
        const pos = doc.positionAt(start)
        const endPos = doc.positionAt(end)
        await applyEditorRangeEdit(doc, pos.line, pos.character, endPos.line, endPos.character, newText)
      }
      return `Replaced ${replace_all ? count : 1} occurrence(s) in ${path} (via editor)${note ? ` — ${note}` : ""}`
    }

    // Not open — write to disk. Restore the file's original EOL style.
    const replaced = replace_all ? text.replaceAll(old_string, () => new_string) : text.replace(old_string, () => region)
    // normalizeEOL(replaced) first: new_string may carry \r\n (pasted from a raw CRLF read);
    // without it the \n→\r\n conversion doubles the \r into \r\r\n (review R9#1).
    const out = fileEol === "\r\n" ? normalizeEOL(replaced).replace(/\n/g, "\r\n") : replaced
    await writeFile(abs, out, "utf8")
    refreshMarkdownPreview(abs)
    return `Replaced ${replace_all ? count : 1} occurrence(s) in ${path}${note ? ` — ${note}` : ""}`
  },
}

export const hashlineEditTool = {
  name: "hashline_edit",
  readonly: false,
  description:
    "Edit a file using content-hash addressing instead of string matching. More reliable than edit when whitespace or encoding varies — hashes are computed from exact line bytes on disk.\n" +
    "Parameters:\n" +
    "- path (required): File path\n" +
    "- old_hashes (required): Array of SHA256 hashes (12-char hex) identifying lines to replace. Read the file with hashes=true first to obtain these hashes. For a single line, pass [hash]; for a contiguous block, pass [hash1, hash2, ...] in order.\n" +
    "- new_content (required): Replacement text (multi-line ok, \\n separated)\n\n" +
    "Notes:\n" +
    "- The hash of each line is computed as SHA256(line_content).slice(0, 12) — the same algorithm used by read(hashes=true)\n" +
    "- Hashes are position-independent: they identify lines by content, not by line number (which changes after edits)\n" +
    "- If the hash sequence isn't found, the error will include the current file's hashes so you can retry with corrected values\n" +
    "- Prefer this over edit when: 1) the file may have mixed whitespace/encoding, 2) you want to edit a block of lines with a single call\n" +
    "- use the most recent read of the file as the source of old_string / line numbers / hashes — re-read after the file changed\n" +
    "Replacement text replaces the lines identified by the hashes — content not present in new_content is deleted. For a new line after a known line, use insert_after. For a single simple string swap, use edit.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path" },
      old_hashes: { type: "array", items: { type: "string" }, description: "SHA256 hashes (12 chars) of the lines to replace. Read the file with hashes=true first to obtain these hashes. Single line: pass 1 hash; multiple lines: pass the exact sequence of hashes." },
      new_content: { type: "string", description: "Replacement text (can span multiple lines)" },
    },
    required: ["path", "old_hashes", "new_content"],
  },
  touchedPaths(args) { return args.path ? [args.path] : [] },
  async execute({ path, old_hashes, new_content }, ctx) {
    const abs = resolvePath(path, ctx.cwd)
    if (!old_hashes?.length) throw new Error("old_hashes must not be empty — read the file with hashes=true to get line hashes")
    const raw = await readFile(abs, "utf8")
    // Strip the BOM for the hash domain (hashLine never sees it) but remember it —
    // the disk write-back must restore it, while the editor path passes BOM-less
    // text (VS Code re-adds the BOM on save per its file encoding).
    const hadBom = raw.charCodeAt(0) === 0xFEFF
    const text = normalizeEOL(stripBom(raw))
    // Encoding-corruption probe (CLI parity): U+FFFD means the file is not clean
    // UTF-8 — hash addressing may be unreliable. Warn (never block).
    const corrupted = text.includes("\uFFFD")
    const lines = text.split("\n")
    const fileHashes = lines.map((l) => hashLine(l))
    const target = old_hashes

    // Sliding-window match: find all occurrences of the hash sequence.
    const matches = []
    for (let i = 0; i <= fileHashes.length - target.length; i++) {
      let match = true
      for (let j = 0; j < target.length; j++) {
        if (fileHashes[i + j] !== target[j]) { match = false; break }
      }
      if (match) matches.push(i)
    }

    if (matches.length === 0) {
      const maxShow = Math.min(fileHashes.length, 50)
      const hashDump = fileHashes.slice(0, maxShow).map((h, i) => `${h}  L${i + 1}: ${lines[i].slice(0, 80)}`).join("\n")
      const preview = target.join(" ")
      throw new Error(
        `Hash sequence not found in ${path}: ${preview}\n` +
        `The file may have been modified since you last read it. Current hashes (first ${maxShow} lines):\n${hashDump}` +
        `\nfor fresh hashes, re-read the file with hashes=true` +
        (corrupted ? `\n${FFFD_WARNING}` : "")
      )
    }

    if (matches.length > 1) {
      const c = 2
      const detail = matches.map((m) => {
        const start = Math.max(0, m - c)
        const end = Math.min(lines.length, m + target.length + c)
        const preview = lines.slice(start, end).map((l, i) => {
          const ln = start + i + 1
          const marker = m <= ln - 1 && ln - 1 < m + target.length ? ">" : " "
          return `${marker} L${ln}: ${l.slice(0, 80)}`
        }).join("\n")
        return `  Match at line ${m + 1} (${target.length} line(s)):\n${preview}`
      }).join("\n\n")
      throw new Error(
        `Hash sequence matches ${matches.length} positions in ${path} — ambiguous.\n` +
        `Include more surrounding lines (unique-hash lines before/after the target) to disambiguate.\n\n` +
        `All matches with surrounding context:\n\n${detail}`
      )
    }

    const pos = matches[0]
    const newLines = normalizeEOL(new_content).split("\n") // normalize: CRLF in new_content would join into \r\r\n
    lines.splice(pos, target.length, ...newLines)
    // Write back in the file's original EOL style (same rule as edit / apply_patch).
    const updated = joinWithEol(lines, raw)

    // Open in editor → WorkspaceEdit; otherwise write to disk
    const doc = getOpenDoc(abs)
    if (doc) {
      if (doc.isDirty) return `Error: File has unsaved changes in the editor: ${abs}. Save or discard before allowing automated edits.`
      // BOM-less text: the editor re-adds the BOM on save — passing it would double it.
      await applyEditorEdit(doc, updated)
    } else {
      await writeFile(abs, (hadBom ? "\uFEFF" : "") + updated, "utf8")
      refreshMarkdownPreview(abs)
    }
    const diff = gitDiffOne(ctx.cwd, abs)
    return `Edited ${path}: replaced ${target.length} line(s) at L${pos + 1} with ${newLines.length} line(s)${diff ? "\n" + diff : ""}${corrupted ? `\n${FFFD_WARNING}` : ""}`
  },
}
