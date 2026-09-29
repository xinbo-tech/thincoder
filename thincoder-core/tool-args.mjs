/**
 * tool-args.mjs — 工具调用参数的可读展示**单源**（B7 1a 上提：体 = CLI
 * `thincoder-cli/src/tui/tool-args.mjs` `describeToolArgs` 现体——覆盖 15+ 工具族，最全）。
 *
 * 消费面：CLI 标题行 ∕ 恢复面（核件同名转口——`toolArgsLines` 留端）· desk
 * `agent-bridge.mjs` 保名转口（`describeToolArgs as summarizeArgs`——回调桥 ∕ 待决门 payload 共用一份口径）·
 * advisor 进度行（端装配层经 `seams.describeArgs` 注入——`advisor/loop.mjs`）。
 * 单源一句话：按工具挑关键参数的可读单行摘要；未知工具回退单行紧凑 JSON。
 *
 * 已登记差额（B7 §2 修正轮 1 ⑨——展示面、非语义差）：默认分支截断 = 本档简版切片（`slice`
 * 码元截断）替代 CLI `render.mjs` `sliceByWidth`（宽度感知 ∕ 全角计宽）⇒ 全角字符截断
 * 续接点可异于 CLI 现端（160 ∕ 80 两档触发）。
 */

/** 单行参数摘要：按工具挑关键字段（卡片头口径），未知工具回退 JSON。 */
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
    case "ls": {
      const p = a.path ? String(a.path) : "."
      return a.filter ? `${p}  (filter: ${String(a.filter)})` : p
    }
    case "websearch": return String(a.query ?? "")
    case "subagent": case "coder": case "explore": case "plan": case "eng-coder": case "eng-designer": {
      const task = String(a.task ?? "").replace(/\s+/g, " ").trim()
      if (task) return task.slice(0, 60) + (task.length > 60 ? "…" : "")
      // action-only 调用（status ∕ observe ∕ send ∕ cancel ∕ escalate ∕ consume-design…）无 task——action 兜底（2.4 批）
      return a.action ? `(${String(a.action)})` : ""
    }
    case "advisor": return String(a.type ?? "review")
    case "read_image": return String(a.path ?? "")
    case "question": return String(a.question ?? "").replace(/\s+/g, " ").trim().slice(0, 60)
    case "memory": {
      // §6 action-routed summary (D-M5): one readable line per action
      const action = String(a.action ?? "")
      if (action === "put") return String(a.title ?? "")
      if (action === "search") return String(a.query ?? "")
      if (action === "list") return [a.layer && `layer ${a.layer}`, a.type && `type ${a.type}`, a.keyword && `kw ${a.keyword}`].filter(Boolean).join(" ")
      if (action === "delete") return a.id ? `id ${a.id}${a.layer ? ` (layer ${a.layer})` : ""}` : `batch ${a.layer ?? ""} ${a.type ? `type ${a.type} ` : ""}${a.keyword ? `kw ${a.keyword}` : ""}`.trim()
      if (action === "clear") return `clear ${a.layer ?? ""}`
      return action || JSON.stringify(a)
    }
    case "lsp": return [a.subcommand, a.uri].filter(Boolean).map(String).join(" ")
    case "repo_outline": return a.path ? String(a.path) : ""
    case "checkpoint": return [a.checkpointAction ?? a.action, a.checkpointId, a.path].filter(Boolean).map(String).join(" ")
    case "git": return [a.action, a.ref, a.name, a.message].filter(Boolean).map(String).join(" ").slice(0, 60)
    default: {
      // MCP 工具 ∕ 未知工具：单行紧凑 JSON（与卡片头原始 JSON 截断口径同族）。硬上限 160：
      // 超大 arguments（如 execute 的千字符 code）绝不进单行头。截断 = 简版切片（见档头差额）。
      const s = JSON.stringify(a)
      return s.length > 160 ? s.slice(0, 156) + "…" : s.length > 80 ? s.slice(0, 78) + "…" : s
    }
  }
}
