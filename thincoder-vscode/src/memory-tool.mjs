/**
 * memory-tool.mjs — the merged `memory` agent tool (MEMORY.md §6 six · five actions).
 *
 * W8（`docs/batches/2026-09-15-vsc-core-wiring.md` §2 · 2026-09-15）：存储 / 检索已归一核面
 * （`@thincoder/core/memory.mjs`——sqlite；端壳文件制镜像 `src/memory.mjs` 随本单元删除）。
 * **工具面（五动作 · layer 参数 · 无 team 层）曾为本端自持**；执行器 / 输出契约 / **描述 ∕ 参数面
 * （I9 · #677）** 均取核工具生成器（`memoryTools`——MEMORY.md §6.6.4「两端同文」单一契约，
 * 不再留第二实现）——描述 ∕ 参数面 = 装配期动态注入（`wireMemoryFace`，见下），端面只留
 * layer 值域守卫（enum 收窄 personal|project + team 拒回——MEMORY.md §6.9）。
 * 核面经动态 `import()` 载入（`execute()` 内）——端壳静态闭包不得到达 `node:sqlite`
 * （护栏契约见 `embed-config.mjs` 头注）。
 *
 * layer terminology (2026-09-08 — 用户裁定统一成 layer)：模型可见面（参数 / schema /
 * 描述 / 结果行 / 输出与错误串）只出现 layer 一个词；无 team 层——收到 team 明确拒绝并
 * 指引 CLI（值域 personal / project）。
 */

import { loadMemoryFace, memoryFor, projectMemoryDir } from "./embed-config.mjs"
import { DESC } from "@thincoder/core/tools/shared.mjs" // 描述单源（核 `memoryTools` 同加载器 ∕ 同档——端零自持描述字面）

// ─── tools ────────────────────────────────────────────────────

const MEMORY_ACTIONS = ["search", "put", "list", "delete", "clear"]
const VSC_LAYERS = ["personal", "project"]

/** team layer refusal — this end has no team layer (MEMORY.md §6.6「layer 值域按端」). */
const teamRefusal = (action) => `Error: memory ${action}: VS Code memory has no team layer — team memory is managed by the CLI`

/** 核参数面注入（I9）：装配缝（`buildToolTable`）把核生成器工具面交给本档——端零自持描述字面；
 *  端唯一收窄 = layer 值域（enum ⇒ `VSC_LAYERS`；team 由 `execute` 拒回）。 */
export function wireMemoryFace(face) {
  if (!face?.parameters) return
  const p = face.parameters
  memoryTool.parameters = { ...p, properties: { ...p.properties, layer: { ...p.properties.layer, enum: VSC_LAYERS } } }
}

export const memoryTool = {
  name: "memory",
  description: DESC("memory"), // 核单源（`tool-docs/memory.md`——与核 `memoryTools` 同文）
  // 占位骨架（装配期由 `wireMemoryFace` 换核面；本档零自持描述字面）
  parameters: { type: "object", properties: { action: { type: "string", enum: MEMORY_ACTIONS } }, required: ["action"] },
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
