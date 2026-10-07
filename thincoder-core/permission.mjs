/**
 * permission.mjs — 权限闸（核内结构归位；CORE-UNIFICATION §2.5 #165「融合：权限闸按核内结构
 * 归位 + 展示面按端注入」）。
 *
 * 来源：
 *  - `summarize` / `formatPermission` / `askPermission` 的**闸语义** = CLI
 *    `thincoder-cli/src/cli/permission.mjs`（逐字随迁；每工具定制化请示文案 + 非交互默认拒绝
 *    的 safety-first 口径）。
 *  - **展示面（④ 端差）** = 按端注入：CLI 用本档默认的 TTY 文本问答；VSC 的面板卡片在装配层
 *    传入自己的 `io.ask`（`askPermission` 的第三参），核内不出现端名分支（契约 5 / 10）。
 *
 * 闸语义（两端同，前提校验成立）：`autoApprove` 每回合快照 + 中途 live 标志的判定在上层
 * dispatch 内；本档只管「问一次 + 拿到布尔」。
 */
import { createInterface } from "node:readline"
import { lastPageUrl } from "./browser/session.mjs"

/** CLI tool arg summary (truncated long JSON) */
export function summarize(toolArgs) {
  const s = JSON.stringify(toolArgs)
  return s.length > 120 ? s.slice(0, 120) + "..." : s
}

/** Permission request key info (per-tool customized). name may include a sub-agent prefix
 *  ("coder/bash") — extract the basename for matching. */
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
    if (action === "delete") return args.id ? `id=${args.id}${args.layer ? ` layer=${args.layer}` : ""}` : `batch delete layer=${args.layer ?? ""} type=${args.type ?? ""} keyword=${args.keyword ?? ""} confirm=${args.confirm}`
    if (action === "clear") return `clear layer=${args.layer ?? ""} confirm=${args.confirm}`
    return cap(summarize(args), 300)
  }
  if (base === "browser") {
    // BROWSER-TOOL.md §3.1/§10.1/§10.5：`<action> ref=<ref> @ <最近页 URL>`；扩展动作逐动作细节（§10.5）
    const action = String(args.action ?? "")
    const detail = (() => {
      const coordText = args.ref ?? `${args.x ?? ""},${args.y ?? ""}`
      if (action === "press") {
        const mods = Array.isArray(args.modifiers) ? args.modifiers.filter((m) => m !== undefined && m !== null && String(m) !== "") : []
        return [...mods, args.key ?? ""].filter((s) => s !== undefined && s !== null && String(s) !== "").join("+") + (args.ref ? ` → ${args.ref}` : "")
      }
      if (action === "clipboard") {
        const op = String(args.op ?? "")
        if (op === "write") return `${op} ${cap(String(args.text ?? ""), 80)}`
        return args.ref ? `${op} ${args.ref}` : op
      }
      if (action === "mouse") return `${args.button ?? "left"} ${args.phase ?? "click"} ${coordText}`
      if (action === "drag") return `${args.from ?? ""} → ${args.to ?? ""}`
      if (action === "touch") {
        const gesture = String(args.gesture ?? "tap")
        if (gesture === "swipe") return `swipe ${args.from ?? ""} → ${args.to ?? ""}`.trim()
        if (gesture === "pinch") return `pinch ×${args.scale ?? ""} ${coordText}`
        return `${gesture} ${coordText}`
      }
      if (action === "wheel") return `Δ(${args.deltaX ?? 0},${args.deltaY ?? 0})`
      if (action === "hover") return String(coordText)
      if (action === "insert") return `${String(args.text ?? "").length} chars${args.ime ? " (ime)" : ""}`
      return null
    })()
    const fallback = args.ref ? `ref=${args.ref}` : String(args.url ?? args.expression ?? "").slice(0, 80)
    const shown = detail ?? fallback
    const at = lastPageUrl() ? ` @ ${lastPageUrl()}` : ""
    return cap(`${action}${shown ? ` ${shown}` : ""}${at}`, 300)
  }
  return cap(summarize(args), 300)
}

/**
 * Permission confirmation. Default channel = interactive y/n on the TTY; non-interactive
 * defaults to deny (safety-first) — the CLI semantics, preserved verbatim.
 *
 * ④ 端差注入点：`io.ask({ name, toolArgs, text })` 返回 `Promise<boolean>`（或不返回 =
 * 未处理 ⇒ 回退默认通道）。VSC 面板卡片在自己的装配层传入；核内零端名分支。
 *
 * @param {string} name
 * @param {object} toolArgs
 * @param {{ask?: Function}} [io]
 * @returns {Promise<boolean>}
 */
export async function askPermission(name, toolArgs, io = {}) {
  const text = formatPermission(name, toolArgs)
  if (typeof io.ask === "function") {
    const answer = await io.ask({ name, toolArgs, text })
    if (answer !== undefined) return Boolean(answer)
  }
  if (!process.stdin.isTTY) {
    console.error(`\n[deny] ${name} (non-interactive, side-effect tools require a TTY)`)
    return false
  }
  const rl = createInterface({ input: process.stdin, output: process.stderr })
  try {
    const answer = await new Promise((resolve) => {
      rl.question(`\n[allow?] ${name}\n${text}\n(y/N) `, resolve)
    })
    return answer.trim().toLowerCase() === "y"
  } finally {
    rl.close()
  }
}
