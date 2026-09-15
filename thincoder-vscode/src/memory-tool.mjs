/**
 * memory-tool.mjs — the merged `memory` agent tool (MEMORY.md §6 six · five actions).
 *
 * W8（`docs/batches/2026-09-15-vsc-core-wiring.md` §2 · 2026-09-15）：存储 / 检索已归一核面
 * （`@thincoder/core/memory.mjs`——sqlite；端壳文件制镜像 `src/memory.mjs` 随本单元删除）。
 * **工具面（五动作 · layer 参数 · 无 team 层）仍是本端自持**；执行器与输出契约取自核工具
 * 生成器（`memoryTools`——MEMORY.md §6.6.4「两端同文」单一契约，不再留第二实现）。
 * 核面经动态 `import()` 载入（`execute()` 内）——端壳静态闭包不得到达 `node:sqlite`
 * （护栏契约见 `embed-config.mjs` 头注）。
 *
 * layer terminology (2026-09-08 — 用户裁定统一成 layer)：模型可见面（参数 / schema /
 * 描述 / 结果行 / 输出与错误串）只出现 layer 一个词；无 team 层——收到 team 明确拒绝并
 * 指引 CLI（值域 personal / project）。
 */

import { loadMemoryFace, memoryFor, projectMemoryDir } from "./embed-config.mjs"

// ─── tools ────────────────────────────────────────────────────

/** §3 merged memory tool — five actions on the personal/project layers (this extension has
 *  no team layer and rejects team with CLI guidance). The tool surface speaks `layer`
 *  end-to-end (param/schema/description/rows/outputs); search/list are read-only actions
 *  (isReadonlyAction — execute-tools.mjs: plan mode passes, no permission ask,
 *  readonly-parallel batches); put/delete/clear keep their side-effect gates —
 *  confirm:true is the batch-delete/clear tool-level gate (direct-delete ruling:
 *  the confirm parameter IS the gate, no second human step). */
const MEMORY_ACTIONS = ["search", "put", "list", "delete", "clear"]
const VSC_LAYERS = ["personal", "project"]
const MEMORY_TOOL_DESCRIPTION =
  "Manage long-term memory in ONE tool — the action parameter picks the operation:\n" +
  "- search — find knowledge saved in previous sessions (query, optional layer/limit); every result row starts with a [layer] tag and carries the entry id — 会话消息历史不在 memory——用 read_history\n" +
  "- put — save a piece of knowledge for future sessions (type: rule = coding standards, knowledge = project facts, decision = architecture decisions, pattern = debugging/workflow patterns; title/content/tags; layer defaults to personal)\n" +
  "- list — inventory what memory holds: optional layer/type/keyword filters, limit default 50; one row per entry: [layer] id [type] title (date); a truncated list notes the full count\n" +
  "- delete — SINGLE: {id, layer} deletes one entry by the id shown in search/list output — layer is OPTIONAL: pass it to verify the entry really lives in that layer (a mismatch is refused — protection against deleting the wrong entry); omit it to route by where the id actually lives. BATCH (no id): {layer + type and/or keyword} deletes every matching entry in that layer — a call without confirm:true is refused and returns the count plus a preview (re-send with confirm:true to execute); a layer-wide wipe without filters is refused on every layer\n" +
  "- clear — {layer: \"personal\", confirm: true} wipes ALL personal memory entries. clear is personal-only: a missing layer or a project layer is refused (use delete batch filters on shared layers)\n" +
  "layer = the memory tier an entry lives in: personal (private) or project (shared via this repo's .thincoder/memory/). The [layer] tag on search/list result rows and delete's layer parameter are the same concept — pass a result row's [layer] into delete, or omit layer and delete auto-routes by the id's actual location.\n" +
  "Save bugs, conventions, and preferences here — they persist across sessions. For project-level task tracking use checklist; for reusable project instructions use skill."

/** team layer refusal — this end has no team layer (MEMORY.md §6.6「layer 值域按端」). */
const teamRefusal = (action) => `Error: memory ${action}: VS Code memory has no team layer — team memory is managed by the CLI`

export const memoryTool = {
  name: "memory",
  description: MEMORY_TOOL_DESCRIPTION,
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: MEMORY_ACTIONS, description: "Operation to run (required)" },
      layer: { type: "string", enum: VSC_LAYERS, description: "Which layer the entry lives in: personal (private) or project (shared via this repo's .thincoder/memory/); team is managed by the CLI. put defaults to personal; search/list cover every layer when omitted; delete single: optional (omitted = auto-route by where the id actually lives); delete batch & clear: required (clear accepts only personal)" },
      type: { type: "string", enum: ["rule", "knowledge", "decision", "pattern"], description: "Entry type: put = what to save; list/delete batch = filter by type" },
      title: { type: "string", description: "put: short title" },
      content: { type: "string", description: "put: full content to remember" },
      tags: { type: "string", description: "put: space-separated tags" },
      query: { type: "string", description: "search: natural-language query" },
      keyword: { type: "string", description: "list/delete batch: filter matching title/content" },
      id: { type: "string", description: "delete single: the entry id from put/search/list output" },
      limit: { type: "number", description: "Max rows: list 50 by default, search 5 by default" },
      confirm: { type: "boolean", description: "delete batch/clear: must be true — without it the tool refuses" },
    },
    required: ["action"],
  },
  readonly: false,
  // §3 action-level classification (execute-tools.mjs reads this): search/list are read-only
  isReadonlyAction(args) {
    const action = args?.action
    return action === "search" || action === "list"
  },
  /** Execute on the core face: the handle is created lazily (guard-checked, dynamic import);
   *  the core tool generator supplies the executors + the shared output contract. Errors are
   *  returned as `Error: …` strings (the tool-result contract of this end). */
  async execute(args, ctx) {
    const action = String(args?.action ?? "")
    if (!MEMORY_ACTIONS.includes(action)) {
      return `Error: memory: unknown action "${action}" — expected one of: ${MEMORY_ACTIONS.join("/")}`
    }
    // team is never registered on this end — refuse with CLI guidance before any core call
    if (args?.layer === "team") return teamRefusal(action)
    const cwd = ctx?.cwd ?? null
    const memory = await memoryFor(cwd)
    if (!memory) {
      return "Error: memory is unavailable on this host — the memory face is disabled (unsupported host runtime)"
    }
    const { memoryTools } = await loadMemoryFace()
    const tools = memoryTools(memory, { cwd, projectDir: projectMemoryDir(cwd ?? process.cwd()), author: "unknown", team: null })
    // 按名取（核侧数组顺序变化 = 静默取错工具面——不依赖位置）
    const tool = tools.find((t) => t?.name === "memory") ?? tools[0]
    try {
      return await tool.execute(args)
    } catch (e) {
      return `Error: ${e?.message ?? e}`
    }
  },
}
