/**
 * tool-args.mjs — 工具调用参数的可读展示（2026-08-30，对齐 vscode 端卡片头的参数可见性）。
 *
 * vscode 端：tool-call 卡片头 = name + args（80 字符截断，悬停看全量）。
 * TUI 端此前：live 标题行 = 原始 JSON 前 80 字符（长路径截半、不可读）；
 * 恢复的历史会话 = `  [tool] name` 完全没有参数（display snapshot 废弃后
 * historyToLines 是恢复的唯一路径，参数可见性随之丢失——用户报告）。
 *
 * 单源 describeToolArgs()：按工具挑关键参数的可读单行摘要（标题行/状态栏共用）；
 * 未知工具回退紧凑 JSON。恢复路径另外输出全量 pretty JSON 作 dim 行
 * （走既有连续 dim 自动折叠——与工具结果的恢复惯例一致；TUI 无悬停，
 * 全量必须落行）。
 */
import { sliceByWidth } from "./render.mjs"

/** 单行参数摘要：按工具挑关键字段（vscode 卡片头对齐），未知工具回退 JSON。 */
export function describeToolArgs(name, args) {
  if (!args || typeof args !== "object") return ""
  const a = args
  switch (name) {
    case "bash": case "cmd-shell": {
      const cmd = String(a.command ?? "").replace(/\s+/g, " ").trim()
      return cmd ? cmd + (a.workdir ? `  (in ${a.workdir})` : "") : ""
    }
    case "read": case "write": case "edit": case "hashline_edit": {
      const p = a.path ? String(a.path) : ""
      const extras = [
        a.offset ? `offset ${a.offset}` : "",
        a.limit ? `limit ${a.limit}` : "",
        name === "edit" && a.old_string ? `old: ${String(a.old_string).replace(/\s+/g, " ").trim().slice(0, 30)}` : "",
      ].filter(Boolean).join(", ")
      return p ? `"${p}"${extras ? " · " + extras : ""}` : extras
    }
    case "grep": case "glob": case "code_search": case "doc_search": case "search": {
      const pat = a.pattern ?? a.query ?? ""
      const p = a.path ? ` in "${a.path}"` : ""
      return `/${String(pat)}/${p}`
    }
    case "websearch": return String(a.query ?? "")
    case "subagent": case "coder": case "explore": case "plan": case "eng-coder": {
      const task = String(a.task ?? "").replace(/\s+/g, " ").trim()
      return task ? task.slice(0, 60) + (task.length > 60 ? "…" : "") : ""
    }
    case "advisor": return String(a.type ?? "review")
    case "question": return String(a.question ?? "").replace(/\s+/g, " ").trim().slice(0, 60)
    case "memory_put": return String(a.title ?? "")
    case "memory_search": return String(a.query ?? "")
    case "lsp": return [a.subcommand, a.uri].filter(Boolean).map(String).join(" ")
    case "repo_outline": return a.path ? String(a.path) : ""
    case "checkpoint": return [a.checkpointAction ?? a.action, a.checkpointId, a.path].filter(Boolean).map(String).join(" ")
    case "git": return [a.action, a.ref, a.name, a.message].filter(Boolean).map(String).join(" ").slice(0, 60)
    default: {
      // MCP 工具 / 未知工具：单行紧凑 JSON（vscode 卡片头同样给原始 JSON 截断）。
      // 硬上限 160：超大 arguments（如 execute 的千字符 code）绝不进单行头。
      const s = JSON.stringify(a)
      return s.length > 160 ? sliceByWidth(s, 156) + "…" : s.length > 80 ? sliceByWidth(s, 78) + "…" : s
    }
  }
}

/** 恢复路径用：全量参数 pretty JSON 的 dim 行（非空才输出）。
 *  与工具结果的恢复惯例一致——完整落行，超长由连续 dim 折叠收纳。 */
export function toolArgsLines(args) {
  if (!args || typeof args !== "object" || Object.keys(args).length === 0) return []
  return JSON.stringify(args, null, 2).split("\n")
}
