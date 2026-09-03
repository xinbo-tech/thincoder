import { createInterface } from "node:readline"

/** CLI tool arg summary (truncated long JSON) */
export function summarize(toolArgs) {
  const s = JSON.stringify(toolArgs)
  return s.length > 120 ? s.slice(0, 120) + "..." : s
}

/** Permission request key info (per-tool customized), aligned with TUI formatPermission. name may include sub-agent prefix ("coder/bash") — extract basename for matching */
export function formatPermission(name, args) {
  const cap = (s, n = 1000) => (s.length > n ? `${s.slice(0, n)}…(共 ${s.length} 字符)` : s)
  const base = name.includes("/") ? name.split("/").pop() : name
  if (base === "bash") return cap(args.command ?? "")
  if (base === "write") return `${args.path}（写入 ${(args.content ?? "").length} 字符）\n${cap(args.content ?? "", 1000)}`
  if (base === "edit") {
    const oldLines = cap(args.old_string ?? "", 500).split("\n").map((l) => `- ${l}`).join("\n")
    const newLines = cap(args.new_string ?? "", 500).split("\n").map((l) => `+ ${l}`).join("\n")
    return `${args.path}\n${oldLines}\n  ↓\n${newLines}`
  }
  if (base === "delete") return `${args.path}${args.force ? "（force：跟踪文件也删）" : ""}`
  if (base === "subagent") return cap(args.task ?? "", 500)
  if (base === "memory") {
    // §6 action-routed preview: put shows content, batch delete/clear show the gate args
    const action = String(args.action ?? "")
    if (action === "put") return `[${args.type ?? ""}] ${args.title ?? ""}\n${cap(args.content ?? "", 500)}`
    if (action === "delete") return args.id ? `id=${args.id} scope=${args.scope}` : `batch delete scope=${args.scope} type=${args.type ?? ""} keyword=${args.keyword ?? ""} confirm=${args.confirm}`
    if (action === "clear") return `clear scope=${args.scope} confirm=${args.confirm}`
    return cap(summarize(args), 300)
  }
  return cap(summarize(args), 300)
}

/** Permission confirmation: interactive y/n on TTY; non-interactive defaults to deny (safety-first) */
export async function askPermission(name, toolArgs) {
  if (!process.stdin.isTTY) {
    console.error(`\n[deny] ${name} (non-interactive, side-effect tools require a TTY)`)
    return false
  }
  const rl = createInterface({ input: process.stdin, output: process.stderr })
  try {
    const answer = await new Promise((resolve) => {
      rl.question(`\n[allow?] ${name}\n${formatPermission(name, toolArgs)}\n(y/N) `, resolve)
    })
    return answer.trim().toLowerCase() === "y"
  } finally {
    rl.close()
  }
}
