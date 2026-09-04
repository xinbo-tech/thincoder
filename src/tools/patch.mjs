import {
  DESC,
  autoSyntaxCheck,
  resolveInCwd,
  normalizeEOL,
  detectFileEol,
  majorityEol
} from "./shared.mjs";
import { markDirty } from "./file.mjs";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, lstat, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { relative, dirname } from "node:path";

/**
 * Parse a unified diff: returns [{ path, isNew, hunks: [{ ops: [{type:" "|"-"|"+", text}] }] }]
 * Consume hunk lines by the line counts in the @@ header — LLMs often strip context blank lines to pure empty lines,
 * so we use counts rather than first characters to determine hunk boundaries.
 * D15.6: a bare "@@" header (no coordinates) is accepted — the hunk body runs until the next hunk/file header
 * ("@@" / "--- " / "+++ " / "diff " / "index "), purely located by its ops.
 */
/**
 * P15.10（2026-09-05 用户裁定——「符合模型直觉」）：文件头判定——
 * 完整头（`--- x` 后随 `+++ `）任意老路径形态均认（git 规范）；
 * 容缺头（`+++ b/<path>` 配对行省略——模型单文件补丁自然形态）仅认 a//b/ 前缀——
 * newPath 推导 = oldPath；`/dev/null` 容缺仍拒（新文件名从 --- 侧不可推导——parsePatch 内特报）；
 * 其他 `--- x` = 普通删行内容（行首标记 - + 内容 `-- x`）——不是文件头——hunk 体不得误断。
 */
function isFileHeader(line, nextLine) {
  if (!line.startsWith("--- ")) return false
  if (nextLine?.startsWith("+++ ")) return true
  return /^[ab]\//.test(line.slice(4).trim())
}

function parsePatch(patch) {
  // Patch text often comes from CRLF terminals/model output; trailing \r mixed into hunk content breaks context matching, strip uniformly
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
      // P15.10：容缺头——`--- a/<path>`（或 b/ 前缀）后直接跟 hunk = 对同路径的修改。
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
        // D15.6 (TOOLS.md §15)：坐标裸 "@@" 头——hunk 完全靠操作行定位。
        // 无行数可用：操作行以 " " / "-" / "+" 开头（空行宽容为上下文行），
        // 直到下一个 hunk 头 / 文件头 "@@"/"--- "/"+++ "/"diff "/"index " 为止。
        if (!/^@@(?: @@)?\s*$/.test(line)) {
          throw new Error(`Malformed patch: bad hunk header "${line}" (need @@ -old,count +new,count @@ or bare @@)`)
        }
        const hunk = { ops: [] }
        i++
        while (i < lines.length) {
          const hl = lines[i]
          if (hl.startsWith("@") || isFileHeader(hl, lines[i + 1]) || hl.startsWith("+++ ") || hl.startsWith("diff ") || hl.startsWith("index ")) break
          if (hl.startsWith("\\")) { i++; continue } // "\ No newline at end of file"
          // 宽容空行=上下文行——但 patch 文本末尾（或 hunk 之间/文件头之前）的 "" 是
          // 分隔产物而非内容：仅当后继仍是操作行时才当作上下文消费。
          // 复评 #1（2026-09-04）：文件头 "--- "/"+++ " 以 -/+ 开头会被 op 前缀判定误收——
          // 文件头前的分隔空行不得吞成幽灵上下文行（会把 - 锚序列尾部拼上 ""——跨文件
          // 零上下文 hunk 因此误报 not-found）。
          const next = lines[i + 1]
          if (hl === "" && (next == null || !/^[ +\-\\]/.test(next) || isFileHeader(next, lines[i + 2]) || next.startsWith("+++ "))) break
          const tag = hl === "" ? " " : hl[0]
          if (tag !== " " && tag !== "-" && tag !== "+") break // metadata / file section end
          hunk.ops.push({ type: tag, text: hl === "" ? "" : hl.slice(1) })
          i++
        }
        if (hunk.ops.length === 0) throw new Error(`Malformed patch: empty coordinate-less hunk "${line.trim()}"`)
        const ctxCount = hunk.ops.filter((o) => o.type === " ").length
        // §15.3 (TOOLS.md D15.10.1——2026-09-04)：context<2 且含 ≥1 个 - 行 → 接受——定位锚 = hunk 内
        // 匹配行序列（空格上下文行 + - 行——按出现序）连续——唯一匹配即应用（applyHunks 既有锚匹配域——
        // 多匹配 / not-found 语义不变）。0 上下文与 1 上下文同待遇（评审 #4a）。
        // 纯 +（无 - 锚）且 context<2 仍拒——插入位置不可判——报错引导加锚（NF15.8c）。
        const removedCount = hunk.ops.filter((o) => o.type === "-").length
        if (ctxCount < 2 && removedCount === 0) {
          throw new Error(
            `Coordinate-less hunk ${cur.hunks.length + 1} in ${cur.path} has ${ctxCount} context line(s) — add more context lines`,
          )
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
        const tag = hl === "" ? " " : hl[0] // pure blank line: treat leniently as context line
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
    i++ // skip diff --git / index / blank lines and other metadata
  }
  // P15.10：容缺/完整空段头（头后无任何 hunk）过滤——不虚报 touchedPaths、不触发无谓 read+write
  const withHunks = files.filter((f) => f.hunks.length > 0)
  if (withHunks.length === 0) throw new Error("No file changes found in patch (need --- / +++ headers)")
  return withHunks
}

/** Apply hunks sequentially onto an in-memory line array; any failure throws (caller guarantees nothing is written to disk). Ignores trailing \r when comparing; context lines retain original bytes */
function applyHunks(fileLines, hunks, eol, path) {
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
      const preview = oldSeq.slice(0, 3).join(" ⏎ ")
      throw new Error(`Hunk ${h + 1} in ${path} does not apply — context not found: "${preview}${oldSeq.length > 3 ? "…" : ""}". Read the file first and regenerate the patch from actual content.`)
    }
    if (matches.length > 1) {
      const preview = oldSeq.slice(0, 3).join(" ⏎ ")
      throw new Error(`Hunk ${h + 1} in ${path} matches ${matches.length} locations — add more context lines to make it unique. Anchor: "${preview}${oldSeq.length > 3 ? "…" : ""}"`)
    }
    const pos = matches[0]
    const out = []
    let src = pos
    for (const op of hunks[h].ops) {
      if (op.type === " ") out.push(fileLines[src++]) // preserve original context line (trailing whitespace as-is)
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
      patch: { type: "string", description: "Unified diff. May span multiple files (multiple --- / +++ header pairs — including creating MULTIPLE new files via --- /dev/null); --- / +++ headers per file, @@ -old,count +new,count @@ hunks (a bare @@ header is also accepted — coordinate-less hunks are located by their anchor lines: context lines plus the removed (-) lines, matched as a contiguous sequence — a unique match applies; a zero/one-context hunk is accepted only when it removes (-) at least one line and that anchor sequence is unique, while anchor-free pure-+ (insert) hunks need at least 2 context lines). The +++ b/<path> pair may be omitted for existing files — a lone --- a/<path> (or --- b/<path>) header followed directly by hunks applies to that path (new files still need --- /dev/null + +++ b/<path>)." },
    },
    required: ["patch"],
  },
  readonly: false,
  /** For the agent layer to track touched files (multi-path, replaces single path parameter) */
  touchedPaths(args) {
    try { return parsePatch(args.patch ?? "").map((f) => f.path) } catch { return [] }
  },
  async execute(args, ctx) {
    const files = parsePatch(args.patch ?? "")
    // Read all into memory first for trial: if any hunk fails, abort entirely — never write a partial patch (atomicity)
    const planned = []
    for (const f of files) {
      const abs = resolveInCwd(ctx, f.path)
      if (f.isNew) {
        if (existsSync(abs)) throw new Error(`Cannot create ${f.path}: file already exists`)
        // New file: follow the directory's majority EOL style (default LF).
        const eol = majorityEol(dirname(abs))
        const content = f.hunks.flatMap((h) => h.ops.filter((o) => o.type === "+").map((o) => o.text)).join(eol) + eol
        planned.push({ abs, path: f.path, content, isNew: true })
      } else {
        const original = await readFile(abs, "utf8").catch(() => { throw new Error(`File not found: ${f.path}`) })
        const eol = detectFileEol(original)
        // Apply hunks in the normalized LF domain, then write back joined with the
        // file's ORIGINAL EOL style — join("\n") here used to rewrite CRLF files as LF.
        const lines = normalizeEOL(original).split("\n")
        applyHunks(lines, f.hunks, "\n", f.path)
        planned.push({ abs, path: f.path, content: lines.join(eol), isNew: false })
      }
    }
    // Multi-file write: write all to .tmp first, rename only after all succeed — failure cleans up written .tmp without affecting committed files
    const { rename } = await import("node:fs/promises") // unlink already statically imported
    const written = []
    try {
      for (const p of planned) {
        await mkdir(dirname(p.abs), { recursive: true })
        await writeFile(p.abs + ".thincoder-tmp", p.content, "utf8")
        written.push(p.abs)
      }
      for (const p of planned) {
        await rename(p.abs + ".thincoder-tmp", p.abs)
      }
    } catch (renameError) {
      // rename phase failed: clean up leftover .tmp files
      for (const abs of written) {
        try { await unlink(abs + ".thincoder-tmp") } catch {}
      }
      throw renameError
    }
    const summary = planned.map((p) => `  ${p.isNew ? "created " : "modified"} ${p.path}`).join("\n")
    // Mark every touched file dirty — insert_after must not run on stale line numbers.
    for (const p of planned) markDirty(p.abs)
    const syntaxChecks = await Promise.all(planned.map(async (p) => {
      const r = await autoSyntaxCheck(p.abs)
      return r ? `${p.path}:${r.replace("Syntax: ", "")}` : ""
    }))
    const syntaxResults = syntaxChecks.filter(Boolean).join("\n")
    return `Applied patch to ${planned.length} file(s):\n${summary}${syntaxResults ? "\n\nSyntax checks:\n" + syntaxResults : ""}`
  },
}



// ---------------------------------------------------------------- bash

export const deleteTool = {
  name: "delete",
  description: DESC("delete"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path (relative to cwd or absolute)" },
      force: { type: "boolean", description: "Allow deleting git-tracked files (default false)" },
    },
    required: ["path"],
  },
  readonly: false,
  touchedPaths(args) { return args.path ? [args.path] : [] },
  async execute(args, ctx) {
    const abs = resolveInCwd(ctx, args.path)
    let s
    try {
      s = await lstat(abs)
    } catch {
      throw new Error(`File not found: ${args.path}`)
    }
    if (s.isDirectory()) throw new Error(`"${args.path}" is a directory — use bash to remove directories`)
    // git-tracked files: refuse direct deletion (safety net); untracked: allow
    // Use resolved relative path (normalized forward slashes) to prevent backslash/unusual paths from bypassing ls-files matching
    const rel = relative(ctx.cwd, abs).replace(/\\/g, "/")
    let tracked = false
    try {
      execFileSync("git", ["ls-files", "--error-unmatch", "--", rel], { cwd: ctx.cwd, stdio: "ignore" })
      tracked = true
    } catch {
      // untracked / non-git repo
    }
    if (tracked && !args.force) throw new Error(`"${args.path}" is git-tracked. Set force=true to delete anyway.`)
    await unlink(abs)
    markDirty(abs)
    return `Deleted ${args.path}`
  },
}

// ---------------------------------------------------------------- git_diff
