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
 * so we use counts rather than first characters to determine hunk boundaries
 */
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
      if (!plus?.startsWith("+++ ")) throw new Error(`Malformed patch: expected "+++" line after "${line}"`)
      const newPath = plus.slice(4).trim()
      if (newPath === "/dev/null") throw new Error("Deleting files via patch is not supported — use the delete tool")
      cur = { path: stripPrefix(newPath), isNew: oldPath === "/dev/null", hunks: [] }
      files.push(cur)
      i += 2
      continue
    }
    if (line.startsWith("@@")) {
      if (!cur) throw new Error("Malformed patch: hunk header before any file header")
      const m = line.match(/^@@ -\d+(?:,(\d+))? \+\d+(?:,(\d+))? @@/)
      if (!m) throw new Error(`Malformed patch: bad hunk header "${line}" (need @@ -old,count +new,count @@)`)
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
  if (files.length === 0) throw new Error("No file changes found in patch (need --- / +++ headers)")
  return files
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
    if (matches.length > 1) throw new Error(`Hunk ${h + 1} in ${path} matches ${matches.length} locations — add more context lines to make it unique`)
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
      patch: { type: "string", description: "Unified diff. May span multiple files (multiple --- / +++ header pairs — including creating MULTIPLE new files via --- /dev/null); --- / +++ headers per file, @@ -old,count +new,count @@ hunks." },
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
