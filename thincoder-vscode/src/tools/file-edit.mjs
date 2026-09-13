/**
 * file-edit.mjs — edit tool + hashline_edit re-export（2026-09-05 module-split：file.mjs 552 > 500
 * 硬限——read/write 留在 file.mjs；本文件 verbatim 迁入 edit 语义族（similarLinesBlock/
 * findWhitespaceVariant/EDIT_MUTEX_TEXT/WHITESPACE_VARIANT_NOTE + editTool +
 * hashlineEditTool）——语义零变；file.mjs re-export（消费方 import 面不变）。
 * 2026-09-08 阶段 2 后 file-edit.mjs 跨 500 硬帽——hashlineEditTool 迁出至
 * hashline-edit.mjs（re-export——file.mjs/index.mjs 消费面不变）。
 * 头注释/import 面沿用 file.mjs（shared.mjs + edit-diff.mjs）。
 * 2026-09-08 EDIT-TOOL-IMPROVEMENT.md（D1-D4）：edit 加 line/startLine/endLine
 * 按行号改（逻辑在 edit-line-params.mjs 子模块——500 硬帽拆分，评审 #4）+
 * old_string 模糊匹配（逻辑在 edit-fuzzy-match.mjs 子模块——同帽拆分）+
 * 零重叠→替换即删（edit-diff.mjs D3）。
 */

import { readFile, writeFile } from "node:fs/promises"
import { DESC, resolvePath, getOpenDoc, applyEditorEdit, applyEditorRangeEdit, normalizeEOL, lfOffsetToRaw, detectFileEol, findCandidates, refreshMarkdownPreview } from "./shared.mjs"
import { applyRegion, EMPTY_NEW_REASON } from "./edit-diff.mjs"
import { hasLineParams, computeLineEdit, executeLineEdit, LINE_MUTEX_TEXT } from "./edit-line-params.mjs"
import { findFuzzyMatch, fuzzyAmbiguousBlock, FUZZY_MATCH_NOTE } from "./edit-fuzzy-match.mjs"

/**
 * EDIT.md §5（not-found 引导——similar-lines 候选块；单形态与批量通道共用——CLI parity:
 * the CLI's shared computeEditEntry appends candidates on every not-found, single form
 * and batch alike).
 * Scoring: LCS line-level, top 3, score ≥ 0.5 (findCandidates); multi-line old_string
 * scores only its first line (header marks it). Zero candidates → "" (whole block
 * omitted — the searched:/grep lines stay). Appended AFTER the searched line — the
 * "Error:"/searched prefixes stay untouched.
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

// D2（EDIT-TOOL-IMPROVEMENT.md，2026-09-08）——old_string 模糊匹配逻辑在
// edit-fuzzy-match.mjs 子模块（findFuzzyMatch / fuzzyAmbiguousBlock / FUZZY_MATCH_NOTE
// ——500 行硬帽拆分；normalize 契约/歧义规则见该模块头注释）。

// EDIT.md §5（互斥——2026-09-05 用户裁定，CLI edit-diff 同句）：edits 只与顶层
// old_string/new_string/line/startLine/endLine 互斥——顶层 path/filePath 合法（无自带 path 条目的默认）。
const EDIT_MUTEX_TEXT = "edits array is mutually exclusive with top-level old_string/new_string/line/startLine/endLine — a top-level path is allowed (default for entries without their own path); provide each change's targeting (old_string, or line / startLine+endLine) and new_string inside its edits entry"
export const editTool = {
  name: "edit",
  description: DESC("edit"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path (single form: required; with the edits array: optional top-level default for entries without their own path) (alias: filePath)" },
      filePath: { type: "string", description: "Alias for path" },
      old_string: { type: "string", description: "Text to replace — exact match first, then unique whitespace-only variant, then fuzzy (≥90% lines identical after trimming, tab→space indent and quote normalization; unique hit applied, multiple hits error with candidates). Mutually exclusive with line/startLine/endLine." },
      new_string: { type: "string", description: "Replacement text — content-based edits require it (an explicit empty string is an error); with line-based targeting (line/startLine/endLine) give it to replace the line/range, or OMIT it to delete (an explicit empty string is an error — omission is the delete signal)" },
      line: { type: "integer", description: "1-based line number — replace that single line with new_string, or OMIT new_string to DELETE it; mutually exclusive with old_string and startLine/endLine" },
      startLine: { type: "integer", description: "1-based first line of the range to replace with new_string (inclusive — requires endLine; mutually exclusive with old_string); OMIT new_string to DELETE the range" },
      endLine: { type: "integer", description: "1-based last line of the range to replace with new_string (inclusive — requires startLine; mutually exclusive with old_string); OMIT new_string to DELETE the range" },
      replace_all: { type: "boolean", description: "Replace every occurrence literally (default false) — content-based edits only" },
      edits: {
        type: "array",
        description:
          "Batch form — multiple edits in ONE call, atomic (any failure writes nothing; same-file entries apply serially, each based on the previous result). Use it for multiple changes to the same file AND for independent changes across multiple files — prefer one batched call over N single edits. A top-level path (or filePath) is allowed — it defaults entries without their own path (entry paths win). Mutually exclusive with top-level old_string/new_string/line/startLine/endLine — provide each change's targeting (old_string, or line / startLine+endLine) inside its edits entry; new_string replaces when given, and line-targeted entries may omit it to DELETE the line/range.",
        items: {
          type: "object",
          properties: {
            path: { type: "string" },
            old_string: { type: "string" },
            new_string: { type: "string" },
            line: { type: "integer" },
            startLine: { type: "integer" },
            endLine: { type: "integer" },
            replace_all: { type: "boolean" },
          },
          oneOf: [
            // 内容条目：old_string + new_string 必填（内容形态 new 空串/省略均拒——EDIT.md §5）
            { required: ["old_string", "new_string"] },
            // 行号条目（单行）：line 定位——new_string optional（省略 = 删行——EDIT.md §8.1）
            { required: ["line"] },
            // 行号条目（范围）：startLine + endLine 定位——new_string optional（省略 = 删范围）
            { required: ["startLine", "endLine"] },
          ],
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
        return "Error: edits must be a non-empty array of {path, old_string | line/startLine+endLine, new_string?}"
      }
      if (args.old_string !== undefined || args.new_string !== undefined || hasLineParams(args)) {
        return "Error: " + EDIT_MUTEX_TEXT
      }
      // 原子：先全量检查（所有文件的替换都可执行）——任一失败全不写。
      // 2026-09-01 缺陷修复（EDIT.md §5——edits 数组同文件多条串行规则）：同一 path 的多条编辑
      // 按序**串行累积应用**——第 n 条基于前 n-1 条已应用后的累积内容做匹配与替换
      // （原实现每条都基于盘上/文档原始内容计算、应用循环后置，同文件后者覆盖前者 →
      // 除最后一条外全部静默丢失）；跨 path 条目互不影响（并行原子语义不变）。
      const groups = new Map() // abs → 每文件一条流水线（LF 域累积 text + 对应 raw 域快照）
      for (const e of args.edits) {
        // #1（2026-09-02 评审修复）：批量形态类型校验补齐——非字符串 old_string/new_string
        // （含缺省 undefined）之前在 normalizeEOL 抛 TypeError 而非错误消息；逐条返回与
        // 单条路径形态同款的诊断消息（单条形态有 typeof 校验，批量形态缺）。
        // 8.4（EDIT.md——批量行号补 VSC）：条目二形态——old_string（内容）或
        // line/startLine+endLine（行号——8.1 删行形态：省略 new_string = 删行）。
        if (!e || typeof e !== "object") return "Error: each edit must be an object with {old_string, new_string} or {line / startLine+endLine, new_string?} — path optional (per entry or top-level)"
        // 2026-09-05 用户裁定（CLI parity）：条目 path 优先；缺省回退顶层 path/filePath
        const p = e.path || args.path || args.filePath
        if (!p) return "Error: each edit must have a path — give each entry its own path or pass a top-level path"
        const lineBased = hasLineParams(e)
        if (lineBased) {
          if (e.old_string !== undefined) return `Error: edit for ${p}: ${LINE_MUTEX_TEXT}`
          if (e.replace_all) return `Error: edit for ${p}: replace_all does not apply to line-based edits (line numbers target exactly one region)`
          // new_string optional（省略 = 删行——8.1）；显式空串/非字符串在 computeLineEdit 校验
          if (e.new_string !== undefined && e.new_string !== "" && typeof e.new_string !== "string") {
            return `Error: edit for ${p}: new_string must be a string (got ${typeof e.new_string})`
          }
        } else {
          if (!e.old_string) return `Error: edit for ${p}: old_string must not be empty`
          if (typeof e.old_string !== "string") return `Error: edit for ${p}: old_string must be a string`
          if (typeof e.new_string !== "string") return `Error: edit for ${p}: new_string must be a string`
        }
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
          // 8.4（EDIT.md——批量行号补 VSC）：行号条目——对累积态 g.text 直接定位（串行累积——
          // 行号引用前序条目已应用后的内容）；省略 new_string = 删行（8.1——返回 Deleted 文本）
          if (hasLineParams(e)) {
            const r = computeLineEdit({ text: g.text, line: e.line, startLine: e.startLine, endLine: e.endLine, newString: e.new_string, path: g.path })
            if (!r.ok) return `Error: edit aborted (atomic — no files written): ${r.reason}`
            prepared.push({ g, kind: "line", newText: r.newText, deleted: r.deleted, replacedLines: r.replacedLines, firstLine: r.firstLine })
            g.text = r.newText
            if (g.doc) g.rawReplaceAll = true // 全量写回——raw 镜像不再推进，后续条目统一全量语义
            continue
          }
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
            // D2（EDIT-TOOL-IMPROVEMENT.md）：唯一模糊命中 → 自动落点；多命中报错附候选（评审 #2 歧义规则）
            const fuzzy = findFuzzyMatch(g.text, oldS)
            if (fuzzy?.ambiguous) {
              return `Error: edit aborted (atomic — no files written): old_string fuzzy-matches ${fuzzy.ambiguous.length} regions in ${g.path} — ambiguous; add more context to make it unique` +
                fuzzyAmbiguousBlock(g.text, fuzzy.ambiguous)
            }
            if (fuzzy?.hit) { oldS = fuzzy.hit.actual; count = 1; note = FUZZY_MATCH_NOTE }
          }
          if (count === 0) {
            // EDIT.md §5（not-found 引导）：批量通道镜像单形态候选块——candidates 接在 searched
            // 行之后，零候选 → 整块省略。
            return `Error: edit aborted (atomic — no files written): old_string not found in ${g.path}\n` +
              `  searched: "${oldS.slice(0, 100).split("\n")[0]}${oldS.length > 100 ? "…" : ""}" — use grep to locate the actual content` +
              similarLinesBlock(g.text.split("\n"), oldS)
          }
          if (!e.replace_all && count > 1) {
            return `Error: edit aborted (atomic — no files written): old_string matches ${count} times in ${g.path}; ` +
              `provide more context or set replace_all`
          }
          // EDIT.md §4/§5（分支 0 单行替换 + 内容形态空 new_string 显式错）：批量每条目在
          // edit-diff.mjs 跑区域判定（applyRegion = 分支 0 就地替换 + applyPatchLines
          // LCS diff——replace_all 字面逐处替换，永不落分支 0）。
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
            // EDIT.md §4（判定序）：newApplied = applyRegion 判定结果（分支 0 单行×单行就地替换 ===
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
        if (p.kind === "line") {
          // 行号条目写回（8.4）：全量文本（LF 域累积结果——行号条目不经 oldS 匹配，直接应用）
          const out = p.g.fileEol === "\r\n" ? normalizeEOL(p.newText).replace(/\n/g, "\r\n") : p.newText
          const msg = p.deleted
            ? `Deleted ${p.replacedLines === 1 ? `line ${p.firstLine}` : `lines ${p.firstLine}-${p.firstLine + p.replacedLines - 1}`} of ${p.g.path}`
            : `Replaced ${p.replacedLines} line(s) at L${p.firstLine} in ${p.g.path}`
          if (p.g.doc) {
            await applyEditorEdit(p.g.doc, out)
            results.push(`${msg} (via editor)`)
          } else {
            await writeFile(p.g.abs, out, "utf8")
            refreshMarkdownPreview(p.g.abs)
            results.push(msg)
          }
          continue
        }
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
    // D1（EDIT-TOOL-IMPROVEMENT.md，2026-09-08）：按行号改——line/startLine/endLine
    // 与 old_string 互斥；定位/替换逻辑在 edit-line-params.mjs 子模块（拆分边界 评审 #4）。
    if (hasLineParams(args)) {
      if (old_string !== undefined) return "Error: " + LINE_MUTEX_TEXT
      if (replace_all) return "Error: replace_all does not apply to line/startLine/endLine edits (line-numbered replacement targets exactly one region)" // 真值判定——replace_all:false 与缺省同义（CLI edit-diff validateEditEntry 同句）
      if (new_string !== undefined && new_string !== "" && typeof new_string !== "string") return "Error: new_string must be a string (got " + typeof new_string + ")"
      // new_string optional：省略 = 删行（8.1 删行形态）；显式空串 = 显式错误（computeLineEdit 内矩阵判定）
      return await executeLineEdit({ path, line: args.line, startLine: args.startLine, endLine: args.endLine, newString: new_string, cwd: ctx.cwd })
    }
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
      // D2（EDIT-TOOL-IMPROVEMENT.md）：唯一模糊命中 → 自动落点；多命中报错附候选（评审 #2 歧义规则）
      const fuzzy = findFuzzyMatch(text, old_string)
      if (fuzzy?.ambiguous) {
        return `Error: old_string fuzzy-matches ${fuzzy.ambiguous.length} regions in ${path} — ambiguous; add more context to make it unique` +
          fuzzyAmbiguousBlock(text, fuzzy.ambiguous)
      }
      if (fuzzy?.hit) { old_string = fuzzy.hit.actual; count = 1; note = FUZZY_MATCH_NOTE }
    }
    if (count === 0) {
      // Helpful diagnosis instead of a bare miss: line ending mismatch vs genuinely absent
      const crlfCount = rawText.split(old_string.replace(/\n/g, "\r\n")).length - 1
      if (crlfCount > 0) return `Error: old_string not found with LF line endings, but matches ${crlfCount} time(s) with CRLF — internal normalization failed (report this)`
      // Similarity candidates (LCS, line-level, top 3, score ≥ 0.5) — turns the
      // "not found" black box into a pointer at the most likely intended line.
      // Multi-line old_string: only its first line is scored (marked accordingly). CLI parity.
      const candText = similarLinesBlock(text.split("\n"), old_string)
      // EDIT.md §5（not-found 引导——2026-09-04）：not found 结果补 grep 定位建议（英文逐字——
      // 与 CLI edit-batch/file.mjs 同句）——模型失败后先 grep 定位实际内容，不盲目重试。
      const preview = old_string.slice(0, 100).split("\n")[0]
      const searched = `  searched: "${preview}${old_string.length > 100 ? "…" : ""}" — use grep to locate the actual content`
      return `Error: old_string not found in ${path}\n${searched}${candText}`
    }
    if (!replace_all && count > 1) {
      return `Error: old_string matches ${count} times in ${path} — set replace_all=true or add more context to make it unique`
    }
    // EDIT.md §4/§5（分支 0 + 空 new_string 矩阵——内容形态显式错）：empty new_string
    // (pure deletion intent) is an explicit error — deletion keeps the context lines in
    // BOTH old and new (never silent); the region judgment lives in edit-diff.mjs
    // (applyRegion = 分支 0 single-line in-place replace + applyPatchLines LCS diff —
    // replace_all = literal per-occurrence swap, never branch 0 — the diff rules do not apply).
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

// hashline_edit（2026-09-08 module-split：file-edit.mjs 500 行硬帽——阶段 2 跨帽后 verbatim
// 迁至 hashline-edit.mjs——re-export 保 file.mjs/index.mjs 消费面不变）
export { hashlineEditTool } from "./hashline-edit.mjs"
