/**
 * more-file.mjs — Additional file tools: insert_after, apply_patch, ls, delete
 */

import { readFile, writeFile, rename, unlink, mkdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { join, dirname } from "node:path"
import { DESC, resolvePath, formatSize, getOpenDoc, applyEditorEdit, applyEditorRangeEdit, refreshMarkdownPreview, normalizeEOL, detectFileEol, majorityEol, joinWithEol } from "./shared.mjs"

export const insertAfterTool = {
  name: "insert_after",
  description: DESC("insert_after"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path" },
      content: { type: "string", description: "Text to insert" },
      after_line: { type: "number", description: "Line number (1-based)" },
      after_regex: { type: "string", description: "Regex to match the line" },
    },
    required: ["path", "content"],
  },
  async execute({ path, content, after_line, after_regex }, ctx) {
    const abs = resolvePath(path, ctx.cwd)
    const doc = getOpenDoc(abs)
    const text = doc ? doc.getText() : await readFile(abs, "utf8")
    const fileEol = detectFileEol(text)
    // EOL-safe disk write-back (review R9#2): joinWithEol detects the file's real
    // line endings from the raw text; per-line \r is stripped before the join.
    // Normalize first so CRLF lines carry no trailing \r — a bare `$` regex anchor
    // otherwise never matches a CRLF line.
    const lines = normalizeEOL(text).split("\n")

    let target
    if (after_line != null) {
      target = after_line - 1
    } else if (after_regex) {
      const re = new RegExp(after_regex)
      const matches = []
      for (let i = 0; i < lines.length; i++) {
        if (re.test(lines[i])) matches.push(i)
      }
      if (matches.length === 0) return `Error: regex "${after_regex}" matched no lines in ${path}`
      if (matches.length > 1) return `Error: regex "${after_regex}" matched ${matches.length} lines (${matches.map((i) => i + 1).join(", ")}) — add more context`
      target = matches[0]
    } else {
      return "Error: either after_line or after_regex is required"
    }

    if (target < 0 || target >= lines.length) return `Error: line ${target + 1} out of range (file has ${lines.length} lines)`

    if (doc) {
      // Open in editor — insert via WorkspaceEdit at the line position
      if (doc.isDirty) return `Error: File has unsaved changes in the editor: ${abs}. Save or discard before allowing automated edits.`
      const insertLine = target + 1 // line number to insert AFTER
      const lineCount = doc.lineCount
      if (insertLine >= lineCount) {
        // Append at end
        const lastLine = doc.lineAt(lineCount - 1)
        await applyEditorRangeEdit(doc, lastLine.lineNumber, lastLine.text.length, lastLine.lineNumber, lastLine.text.length, fileEol + normalizeEOL(content))
      } else {
        // Insert between lines — insert at start of the next line with a newline suffix
        const nextLine = doc.lineAt(insertLine)
        await applyEditorRangeEdit(doc, nextLine.lineNumber, 0, nextLine.lineNumber, 0, normalizeEOL(content) + fileEol)
      }
      return `Inserted after line ${target + 1} in ${path} (via editor)`
    }

    // Not open — write to disk (original EOL style, same rule as edit/apply_patch)
    lines.splice(target + 1, 0, normalizeEOL(content))
    await writeFile(abs, joinWithEol(lines.map((l) => l.replace(/\r$/, "")), text), "utf8")
    refreshMarkdownPreview(abs)
    return `Inserted after line ${target + 1} in ${path}`
  },
}

export function parsePatch(patch) {
  // Patch text often comes from CRLF terminals/model output; strip uniformly.
  const lines = patch.replace(/\r(?=\n|$)/g, "").split("\n")
  const files = []
  let cur = null
  let i = 0
  const stripPrefix = (p) => p.replace(/^[ab]\//, "")
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith("--- ")) {
      const oldPath = line.slice(4).trim()
      const plus = lines[i + 1]
      if (plus?.startsWith("+++ ")) {
        const newPath = plus.slice(4).trim()
        if (newPath === "/dev/null") throw new Error("Deleting files via patch is not supported — use the delete tool")
        cur = { path: stripPrefix(newPath), isNew: oldPath === "/dev/null", hunks: [] }
        files.push(cur)
        i += 2
        continue
      }
      // P15.10（2026-09-05 用户裁定——「符合模型直觉」——CLI patch.mjs 同构）：容缺头——
      // `+++ b/<path>` 配对行省略——`--- a/<path>`（或 b/ 前缀）后直接跟 hunk = 对同路径的修改。
      if (/^[ab]\//.test(oldPath)) {
        cur = { path: stripPrefix(oldPath), isNew: false, hunks: [] }
        files.push(cur)
        i += 1
        continue
      }
      if (oldPath === "/dev/null") {
        throw new Error(`"--- /dev/null" needs a "+++ b/<path>" line naming the new file — the --- side does not carry the file name`)
      }
      throw new Error(`Malformed patch: expected "+++" line after "${line}"`)
    }
    if (line.startsWith("@@")) {
      if (!cur) throw new Error("Malformed patch: hunk header before any file header")
      const m = line.match(/^@@ -\d+(?:,(\d+))? \+\d+(?:,(\d+))? @@/)
      if (!m) {
        // APPLY-PATCH.md §2/§3（宽容格式——无坐标 hunk）：bare "@@" without coordinates — the
        // hunk is located by its matching-line sequence（空格上下文行 + - 行——applyHunks 锚
        // 匹配域——唯一匹配即应用）。零上下文/1 上下文含 - 锚形态由 APPLY-PATCH.md §2 放宽
        // （锚序列唯一匹配即应用——context<2 且无 - 锚仍拒——纯 + 插入位置不可判——与 CLI
        // patch.mjs 同语义）。
        // hunk.ops keeps the standard shape so applyHunks works unchanged; coordless is marked
        // for anchor reporting.
        if (!/^@@\s*$/.test(line)) throw new Error(`Malformed patch: bad hunk header "${line}"`)
        const hunk = { ops: [], coordless: true }
        i++
        let contextCount = 0
        while (i < lines.length) {
          const hl = lines[i]
          // Hunk boundaries: next @@ header, or a next-file "--- " header.
          // An empty line is the trailing split artifact, never a body line
          // (diff lines always carry a tag char) — stop there too.
          // isFileHeader（P15.10——2026-09-05）：完整头（后随 +++）与容缺头（a//b/ 前缀）
          // 都断；其他 "--- x" = 普通删行内容（行首标记 - + 内容 "-- x"）——不得误断 hunk 体。
          if (hl === "" || hl.startsWith("@@") || isFileHeader(hl, lines[i + 1])) break
          if (hl.startsWith("\\")) { i++; continue } // "\ No newline at end of file"
          const tag = hl === "" ? " " : hl[0]
          const text = hl === "" ? "" : hl.slice(1)
          if (tag === " ") { hunk.ops.push({ type: " ", text }); contextCount++ }
          else if (tag === "-") hunk.ops.push({ type: "-", text })
          else if (tag === "+") hunk.ops.push({ type: "+", text })
          else throw new Error(`Malformed patch: unexpected line "${hl.slice(0, 60)}" inside hunk`)
          i++
        }
        // APPLY-PATCH.md §2（宽容格式——无坐标 hunk 放宽，2026-09-04）：context<2 且含 ≥1
        // 个 - 行 → 接受——定位锚 = hunk 内匹配行序列（空格上下文行 + - 行——按出现序）连续
        // ——唯一匹配即应用（applyHunks 既有锚匹配域——多匹配 / not-found 语义不变）。0 上下文
        // 与 1 上下文同待遇（评审 #4a）。
        const removedCount = hunk.ops.filter((o) => o.type === "-").length
        if (contextCount < 2 && removedCount === 0) {
          throw new Error(`Malformed patch: hunk "@@" without coordinates needs at least 2 context lines — add more context lines`)
        }
        cur.hunks.push(hunk)
        continue
      }
      let oldNeed = m[1] == null ? 1 : Number(m[1])
      let newNeed = m[2] == null ? 1 : Number(m[2])
      const hunk = { ops: [] }
      i++
      while (oldNeed > 0 || newNeed > 0) {
        if (i >= lines.length) throw new Error("Malformed patch: hunk truncated (line counts in @@ header not satisfied)")
        const hl = lines[i]
        if (hl.startsWith("\\")) { i++; continue } // "\ No newline at end of file"
        const tag = hl === "" ? " " : hl[0]
        const text = hl === "" ? "" : hl.slice(1)
        if (tag === " ") { hunk.ops.push({ type: " ", text }); oldNeed--; newNeed-- }
        else if (tag === "-") { hunk.ops.push({ type: "-", text }); oldNeed-- }
        else if (tag === "+") { hunk.ops.push({ type: "+", text }); newNeed-- }
        else throw new Error(`Malformed patch: unexpected line "${hl.slice(0, 60)}" inside hunk`)
        i++
      }
      cur.hunks.push(hunk)
      continue
    }
    i++
  }
  // P15.10：空段头（头后无任何 hunk）过滤——不虚报 touchedPaths、不触发无谓读
  const withHunks = files.filter((f) => f.hunks.length > 0)
  if (withHunks.length === 0) throw new Error("No file changes found in patch (need --- / +++ headers)")
  return withHunks
}

/**
 * P15.10（2026-09-05 用户裁定——「符合模型直觉」）：文件头判定——
 * 完整头（`--- x` 后随 `+++ `）任意老路径形态均认（git 规范）；
 * 容缺头（`+++ b/<path>` 配对行省略——模型单文件补丁自然形态）仅认 a//b/ 前缀——
 * newPath 推导 = oldPath；`/dev/null` 容缺仍拒（新文件名从 --- 侧不可推导——parsePatch 内特报）；
 * 其他 `--- x` = 普通删行内容——不是文件头——hunk 体不得误断。
 */
function isFileHeader(line, nextLine) {
  if (!line.startsWith("--- ")) return false
  if (nextLine?.startsWith("+++ ")) return true
  return /^[ab]\//.test(line.slice(4).trim())
}

/** Anchor fragment for coordless-hunk error text (APPLY-PATCH.md §2): the first context
 *  lines that were tried, truncated to 60 chars each, so the model sees what
 *  the hunk was anchored on. */
function hunkAnchor(oldSeq) {
  const first = oldSeq.slice(0, 3).map((l) => l.slice(0, 60))
  return first.join("\n") + (oldSeq.length > 3 ? `\n… ${oldSeq.length} lines` : "")
}

/** Apply hunks sequentially onto a line array, re-scanning each hunk's context
 *  against the ALREADY-mutated lines — earlier hunks shifting line numbers can
 *  never misalign later hunks (the bug the line-number approach had). */
export function applyHunks(fileLines, hunks, eol, path) {
  const cr = eol === "\r\n" ? "\r" : ""
  for (let h = 0; h < hunks.length; h++) {
    const oldSeq = hunks[h].ops.filter((o) => o.type !== "+").map((o) => o.text)
    if (oldSeq.length === 0) throw new Error(`Hunk ${h + 1} in ${path} has no context/removed lines to locate`)
    const matches = []
    for (let pos = 0; pos + oldSeq.length <= fileLines.length; pos++) {
      let ok = true
      for (let j = 0; j < oldSeq.length; j++) {
        if (fileLines[pos + j].replace(/\r$/, "") !== oldSeq[j]) { ok = false; break }
      }
      if (ok) matches.push(pos)
    }
    if (matches.length === 0) {
      const err = `Hunk ${h + 1} in ${path} does not apply — context not found. Read the file first and regenerate the patch.`
      throw new Error(hunks[h].coordless ? `${err}\n  anchor: "${hunkAnchor(oldSeq)}"` : err)
    }
    if (matches.length > 1) {
      const err = `Hunk ${h + 1} in ${path} matches ${matches.length} locations — add more context lines to make it unique`
      throw new Error(hunks[h].coordless ? `${err}\n  anchor: "${hunkAnchor(oldSeq)}"` : err)
    }
    const pos = matches[0]
    const out = []
    let src = pos
    for (const op of hunks[h].ops) {
      if (op.type === " ") out.push(fileLines[src++])
      else if (op.type === "-") src++
      else out.push(op.text + cr)
    }
    fileLines.splice(pos, oldSeq.length, ...out)
  }
}

export const applyPatchTool = {
  name: "apply_patch",
  description: DESC("apply_patch"),
  parameters: {
    type: "object",
    properties: {
      patch: { type: "string", description: "Unified diff" },
    },
    required: ["patch"],
  },
  /** #4（2026-09-02 评审修复）：parsePatch 后返回所有目标路径——之前缺 touchedPaths 时
   *  兜底 `[args?.path]` 取到整段 diff 文本 → join(cwd, patchText) 产生垃圾路径条目，
   *  且工程模式父门禁对任何 patch 判 touchesCode（纯 docs 补丁也被拦，docs 豁免失效）。
   *  照 CLI patch.mjs:112-114。 */
  touchedPaths(args) {
    try { return parsePatch(args.patch ?? "").map((f) => f.path) } catch { return [] }
  },
  async execute({ patch }, ctx) {
    let files
    try { files = parsePatch(patch) } catch (e) { return `Error: ${e.message}` }
    // #3（2026-09-02 评审修复）：两段式原子（CLI patch.mjs "never write a partial patch"
    // parity）——阶段一全量试算：所有文件的读取/门禁（isDirty、已存在、hunk 应用）全部
    // 通过才进入阶段二；任一失败任何文件都不落盘（原实现逐文件写入，文件 2 报错时文件 1
    // 已落盘——模型按错误重试整个 patch 时已改文件导致 old_string 失配死循环）。
    const planned = []
    for (const f of files) {
      const abs = resolvePath(f.path, ctx.cwd)
      const doc = getOpenDoc(abs)
      if (doc?.isDirty) return `Error: File has unsaved changes in the editor: ${abs}. Save or discard first.`
      let content
      if (f.isNew) {
        if (existsSync(abs)) return `Error: Cannot create ${f.path}: file already exists`
        // New file: follow the directory's majority EOL style (default LF). CLI parity.
        const eol = majorityEol(dirname(abs))
        content = f.hunks.flatMap((h) => h.ops.filter((o) => o.type === "+").map((o) => o.text)).join(eol) + eol
      } else {
        let raw = doc ? doc.getText() : null
        if (raw === null) {
          raw = await readFile(abs, "utf8").catch(() => null)
          if (raw === null) return `Error: File not found: ${f.path}`
        }
        const eol = detectFileEol(raw)
        // Apply hunks in the normalized LF domain, then write back joined with the
        // file's ORIGINAL EOL style — join("\n") here used to rewrite CRLF files as LF.
        const lines = normalizeEOL(raw).split("\n")
        applyHunks(lines, f.hunks, "\n", f.path)
        content = lines.join(eol)
      }
      planned.push({ abs, path: f.path, doc, content, isNew: f.isNew })
    }
    // 阶段二：统一写入。编辑器文档走 WorkspaceEdit；磁盘走 .tmp 全量写 + rename
    // （rename 失败 → 清理已写 .tmp，已提交文件保持原状，CLI patch.mjs 同款语义）。
    const tmpWritten = []
    const results = []
    try {
      for (const p of planned) {
        if (p.doc) await applyEditorEdit(p.doc, p.content)
        else {
          await mkdir(dirname(p.abs), { recursive: true })
          await writeFile(p.abs + ".thincoder-tmp", p.content, "utf8")
          tmpWritten.push(p.abs)
        }
      }
      for (const p of planned) {
        if (!p.doc) await rename(p.abs + ".thincoder-tmp", p.abs)
      }
      for (const p of planned) {
        if (!p.doc) refreshMarkdownPreview(p.abs)
        results.push(`Patched ${p.path} (${p.isNew ? "created" : "modified"})`)
      }
    } catch (e) {
      for (const abs of tmpWritten) {
        try { await unlink(abs + ".thincoder-tmp") } catch { /* */ }
      }
      throw e
    }
    return results.join("\n") || "No files patched"
  },
}

export const lsTool = {
  name: "ls",
  readonly: true,
  description: DESC("ls"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory path" },
      filter: { type: "string", description: "Only list entries matching this wildcard (e.g. '*.mjs', '*test*')" },
    },
  },
  async execute({ path, filter }, ctx) {
    const dir = path ? resolvePath(path, ctx.cwd) : ctx.cwd
    const { readdir, stat: fsStat } = await import("node:fs/promises")
    const filterRe = filter ? wildcardToRegex(filter) : null
    try {
      const entries = await readdir(dir, { withFileTypes: true })
      const matched = filterRe ? entries.filter((e) => filterRe.test(e.name)) : entries
      const items = []
      for (const e of matched.slice(0, 500)) {
        const full = join(dir, e.name)
        let size = ""
        try { const s = await fsStat(full); size = s.isDirectory() ? "" : ` (${formatSize(s.size)})` } catch { /* */ }
        items.push(`${e.isDirectory() ? "d" : " "} ${e.name}${size}`)
      }
      if (matched.length > 500) items.push(`... (${matched.length - 500} more entries)`)
      return items.join("\n") || "(empty directory)"
    } catch (e) {
      return `ls error: ${e.message}`
    }
  },
}

function wildcardToRegex(pattern) {
  const re = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".")
  return new RegExp(`^${re}$`, "i")
}

export const deleteTool = {
  name: "delete",
  description: DESC("delete"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path (alias: filePath)" },
      filePath: { type: "string", description: "Alias for path" },
      force: { type: "boolean", description: "Force delete git-tracked files" },
    },
    required: [],
  },
  touchedPaths(args) { return args.path || args.filePath ? [args.path || args.filePath] : [] },
  async execute({ path, force, filePath }, ctx) {
    path = path || filePath
    if (typeof path !== "string" || !path) return "Error: path (or filePath) is required and must be a string"
    const abs = resolvePath(path, ctx.cwd)
    // #5（2026-09-02 评审修复）：同一工具族的 write/edit/hashline/insert_after/apply_patch
    // 全部在改动前检查 getOpenDoc(abs)?.isDirty 并拒绝，唯独 delete 直接 unlink——打开且
    // 脏的文件被删后编辑器缓存丢失。unlink 前同款守卫。
    const doc = getOpenDoc(abs)
    if (doc?.isDirty) return `Error: File has unsaved changes in the editor: ${abs}. Save or discard first.`
    // Check if git-tracked — execFileSync (array args, no shell) so a path with
    // shell metacharacters can't inject.
    try {
      execFileSync("git", ["ls-files", "--error-unmatch", abs.replace(/\\/g, "/")], { cwd: ctx.cwd, encoding: "utf8", timeout: 5000, stdio: "pipe" })
      if (!force) return `Error: ${path} is git-tracked. Set force=true to delete anyway.`
    } catch { /* not git-tracked or not a git repo */ }
    await unlink(abs)
    return `Deleted ${path}`
  },
}
