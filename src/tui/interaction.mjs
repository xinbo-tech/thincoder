import { ansi, C } from "./ansi.mjs"
import { detectDanger } from "../tools/shared.mjs"

/** Interaction primitives: permission approval + question input.
 *  Extracted from index.mjs, receives closure dependencies via createInteraction(ctx).
 *  ctx: { agent, state, pushLine, pushLabel, render, summarize } */

/** Sentinel appended to question option lists — selecting it switches to free-text
 *  answer mode (the user supplements/corrects the AI's preset choices). */
export const QUESTION_CUSTOM = "\u0001custom-answer"

export function createInteraction(ctx) {
  const { agent, state, pushLine, pushLabel, render, summarize } = ctx

  /** Key info for permission request (customized by tool), returns array of lines. name may have subagent prefix ("coder/bash"), use base name to match */
  function formatPermission(name, args) {
    const cap = (s, n = 3000) => (s.length > n ? `${s.slice(0, n)}…(${s.length} chars total)` : s)
    const base = name.includes("/") ? name.split("/").pop() : name
    if (base === "bash") {
      // 危险命令标注(只提示不拦截):给人看的红色警告,帮审批决策
      const danger = detectDanger(args.command ?? "")
      const lines = []
      if (danger) lines.push(`${C.error}⚠️ Dangerous: ${danger}${ansi.reset}`)
      return [...lines, ...cap(args.command ?? "").split("\n")]
    }
    if (base === "write") {
      // approving file writes must show what's being written: path + content preview
      return [`${args.path} (write ${(args.content ?? "").length} chars)`, ...cap(args.content ?? "", 3000).split("\n")]
    }
    if (base === "edit") {
      // simple diff: - old content / + new content
      return [
        `${args.path}`,
        ...cap(args.old_string ?? "", 500).split("\n").map((l) => `- ${l}`),
        "  ↓",
        ...cap(args.new_string ?? "", 500).split("\n").map((l) => `+ ${l}`),
      ]
    }
    if (base === "apply_patch") {
      // patches are readable diffs themselves, preview directly
      return cap(args.patch ?? "", 1500).split("\n")
    }
    if (base === "delete") return [`${args.path}${args.force ? " (force: also delete tracked files)" : ""}`]
    if (base === "subagent") return cap(args.task ?? "", 500).split("\n")
    if (base === "memory") {
      // §6 action-routed preview (D-M5): put shows content, batch delete/clear show gate args
      const action = String(args.action ?? "")
      if (action === "put") return [`[${args.type ?? ""}] ${args.title ?? ""}`, ...cap(args.content ?? "", 500).split("\n")]
      if (action === "delete") return args.id
        ? [`delete single: ${args.id} (scope ${args.scope})`]
        : [`batch delete scope=${args.scope} type=${args.type ?? ""} keyword=${args.keyword ?? ""}`, `confirm=${args.confirm}`]
      if (action === "clear") return [`clear personal memory`, `scope=${args.scope} confirm=${args.confirm}`]
      return [cap(summarize(args), 300)]
    }
    return [cap(summarize(args), 300)]
  }

  function askPermission(name, args) {
    // auto mode: fully authorized, no more prompts
    if (agent.autoApprove) {
      const argSummary = summarize(args)
      pushLine(`  [auto] ${name}${argSummary ? ` ${argSummary}` : ""}`, C.warn)
      return Promise.resolve(true)
    }
    // store preview content in permissionPreview, rendered above input box next to "Allow?" prompt
    state.permissionPreview = formatPermission(name, args)
    return new Promise((resolve) => {
      state.permission = { name, args, resolve }
      state.status = `Waiting: ${name}`
      render()
    })
  }

  /** Batch permission ask (AGENT-LOOP.md §16 D-B1): one merged prompt covering N
   *  non-readonly tools from the same toolCalls array — approve all / one by one /
   *  deny. Verdicts resolve as "approveAll" | "oneByOne" | "deny". */
  const BATCH_PREVIEW_LINES_PER_TOOL = 8
  function askBatchPermission({ tools, count }) {
    if (agent.autoApprove) {
      pushLine(`  [auto] ${count} tools: ${tools.map((t) => t.name).join(", ")}`, C.warn)
      return Promise.resolve("approveAll")
    }
    const names = [...new Set(tools.map((t) => t.name))]
    const label = `${count} tools need permission: ${names.join(", ")}`
    // Preview: one compact block per tool (name header + first N formatted lines)
    state.permissionPreview = [
      label,
      ...tools.flatMap((t) => {
        const lines = formatPermission(t.name, t.args)
        const shown = lines.slice(0, BATCH_PREVIEW_LINES_PER_TOOL)
        return [` ${t.name}:`, ...shown.map((l) => `  ${l}`), ...(lines.length > shown.length ? [`  … (${lines.length - shown.length} more lines)`] : [])]
      }),
    ]
    return new Promise((resolve) => {
      state.permission = { name: label, args: {}, resolve, batch: { tools, count } }
      state.status = `Waiting: ${label}`
      render()
    })
  }

  function askQuestion(text, options = []) {
    // only one question at a time: question is a read-only tool on a parallel channel,
    // a second concurrent one is rejected directly; otherwise the later one overwrites
    // state.question and the first Promise hangs forever (agent deadlock)
    if (state.question) {
      return Promise.resolve("(error: another question is pending; ask one at a time and wait for the answer)")
    }
    if (!options.length) {
      // free text: open input mode for user typing, Enter to submit
      // q.cursor 装配（TUI-INPUT-BOX.md §7.2/§7.5 #10b）：answer 存 codepoint 数组（同
      // state.input 语义——emoji 不劈半），进入自由文本态即 cursor = answer.length（= 0）。
      pushLabel(`❯ Question`, ansi.bold + C.tool)
      for (const line of text.split("\n")) pushLine(`  ${line}`, C.text)
      return new Promise((resolve) => {
        state.question = { text, options: [], answer: [], cursor: 0, resolve }
        state.status = "Waiting for answer..."
        render()
      })
    }
    // options mode: show list in input box, arrow keys to select, Enter to confirm.
    // A "custom answer" sentinel is appended so the user can always type their own
    // answer instead of picking a preset — the AI's options are never exhaustive.
    pushLabel(`❯ Question`, ansi.bold + C.tool)
    for (const line of text.split("\n")) pushLine(`  ${line}`, C.text)
    return new Promise((resolve) => {
      state.question = { text, options: [...options, QUESTION_CUSTOM], selected: 0, resolve }
      state.status = "Waiting for choice..."
      render()
    })
  }

  return { askPermission, askQuestion, formatPermission, askBatchPermission }
}
