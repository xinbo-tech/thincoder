/**
 * tools/context.mjs — on-demand IDE context snapshot.
 * The agent calls this tool (instead of everything being auto-injected) to pull the
 * live editor state it actually needs: cursor position, open tabs, hover info at the
 * cursor, error/warning diagnostics, and uncommitted git changes.
 *
 * Deliberately cheap and on-demand — the current-file content is already auto-injected
 * every turn (editor-context.mjs); this tool covers the REST of the IDE state that is
 * too noisy to inject eagerly.
 */
import * as vscode from "vscode"
import { runGit, truncate } from "./shared.mjs"

/** Relative path inside cwd, else the absolute path unchanged. */
function rel(cwd, fsPath) {
  const p = fsPath.replace(/\\/g, "/")
  const c = cwd.replace(/\\/g, "/").replace(/\/$/, "")
  return p.startsWith(c + "/") ? p.slice(c.length + 1) : p
}

export const contextTool = {
  name: "context",
  readonly: true,
  description:
    "Read the live IDE state on demand — what the user is looking at RIGHT NOW in the editor: " +
    "cursor position, open tabs, hover info at the cursor, diagnostics (errors/warnings), and uncommitted " +
    "git changes. You are in the VS Code side panel; prefer this over re-reading files to learn what the " +
    "user is currently looking at or what errors are showing.\n" +
    "Parameters:\n" +
    "- what (optional): which slice to collect — all | cursor | tabs | hover | diagnostics | changes (default all)",
  parameters: {
    type: "object",
    properties: {
      what: {
        type: "string",
        enum: ["all", "cursor", "tabs", "hover", "diagnostics", "changes"],
        description: "Which slice of context to collect (default: all)",
      },
    },
    required: [],
  },

  async execute(args, ctx) {
    const what = args?.what ?? "all"
    const sections = what === "all" ? ["cursor", "tabs", "hover", "diagnostics", "changes"] : [what]
    const parts = []
    for (const s of sections) {
      try {
        const text = await collectSection(s, ctx)
        if (text) parts.push(text)
      } catch (err) {
        parts.push(`## ${s}\n(error: ${err.message})`)
      }
    }
    return parts.join("\n\n") || "(no active editor / no context)"
  },
}

async function collectSection(what, ctx) {
  switch (what) {
    case "cursor": return cursorSection()
    case "tabs": return tabsSection()
    case "hover": return hoverSection()
    case "diagnostics": return diagnosticsSection(ctx)
    case "changes": return changesSection(ctx)
    default: return null
  }
}

function cursorSection() {
  const e = vscode.window.activeTextEditor
  if (!e) return null
  const p = e.selection.active
  const sel = e.selection.isEmpty
    ? ""
    : `，选中 L${e.selection.start.line + 1}-${e.selection.end.line + 1}`
  return `## 光标\n文件: ${e.document.uri.fsPath}\n位置: L${p.line + 1}:${p.character + 1}${sel}`
}

function tabsSection() {
  const tabs = vscode.window.tabGroups.all.flatMap((g) => g.tabs)
  if (!tabs.length) return null
  const lines = tabs.map((t) => {
    const active = t.isActive ? "  ← active" : ""
    const dirty = t.isDirty ? " (modified)" : ""
    return `- ${t.label}${dirty}${active}`
  })
  return `## 打开标签 (${tabs.length})\n${lines.join("\n")}`
}

async function hoverSection() {
  const e = vscode.window.activeTextEditor
  if (!e) return null
  const res = await vscode.commands.executeCommand("vscode.executeHoverProvider", e.document.uri, e.selection.active)
  if (!res?.length) return null
  const parts = []
  for (const h of res) {
    for (const c of h.contents ?? []) {
      if (typeof c === "string") parts.push(c)
      else if (c?.value) parts.push(c.value)
    }
  }
  if (!parts.length) return null
  return `## 光标处 Hover\n${truncate(parts.join("\n"), 1500)}`
}

function diagnosticsSection(ctx) {
  const e = vscode.window.activeTextEditor
  let list = []
  if (e) {
    for (const d of vscode.languages.getDiagnostics(e.document.uri)) list.push({ file: e.document.uri.fsPath, d })
  } else {
    for (const [uri, ds] of vscode.languages.getDiagnostics()) {
      for (const d of ds) list.push({ file: uri.fsPath, d })
    }
  }
  // 只留 error + warning（info/hint 噪音大）
  const errs = list.filter((x) => x.d.severity <= 1)
  if (!errs.length) return null
  const sev = { 0: "ERR", 1: "WARN" }
  const lines = errs.slice(0, 40).map((x) =>
    `${rel(ctx.cwd, x.file)}:L${x.d.range.start.line + 1}: ${sev[x.d.severity] ?? "?"}: ${x.d.message}${x.d.code ? ` [${typeof x.d.code === "object" ? x.d.code.value : x.d.code}]` : ""}`
  )
  const more = errs.length > 40 ? `\n... and ${errs.length - 40} more` : ""
  return `## Diagnostics (${errs.length} error/warning)\n${lines.join("\n")}${more}`
}

function changesSection(ctx) {
  let porcelain
  try {
    porcelain = runGit(ctx.cwd, ["status", "--porcelain"])
  } catch {
    return null // 不在 git 仓库
  }
  const lines = porcelain.split("\n").map((l) => l.replace(/\r/g, "")).filter(Boolean)
  if (!lines.length) return null
  const more = lines.length > 40 ? `\n... and ${lines.length - 40} more` : ""
  return `## 未提交变更 (${lines.length})\n${lines.slice(0, 40).join("\n")}${more}`
}
