/**
 * agent/tool-table.mjs — 工具表装配装饰面（2026-09-29 · #365 拆分落形——`setup-tooltable.mjs` 越 300
 * 软线，拆分方案在册 = `docs/core/design/MANIFEST.md` §2.3 拆分注 行 29「行 16 拆入的工具表段
 * （新导出 `buildToolTable`）再拆出邻档」）。纯结构搬移（零语义改动）——段序与原文一致：
 * ① W13 池装配装饰与子代理面（`withPool` / `vscSubagentFace` / 终态回显族 / `modeRoleField`）；
 * ② 工具表装配段（`buildToolTable`——2026-09-21 自 `setup.mjs` 装配段拆入面）。
 * 缝 = re-export（KD-6）：`setup-tooltable.mjs` 再导出既有导出名（`buildToolTable` / `withPool` /
 * `vscSubagentFace` / `modeRoleField`）⇒ 消费档零改。
 * W8 契约②（`test/engine-floor-guard.test.mjs:129`——端壳静态闭包零 `node:sqlite`）：本档静态边
 * = `setup-tooltable.mjs` 既有静态边之子集（无新增边）；核 `agent-tools.mjs` / `agent/family-tools.mjs` /
 * `ledger.mjs` / 端 `panel-mcp.mjs` 四类面仍走**动态** import()（见 `buildToolTable` 段内注）。
 */
import { applyPromptInjections } from "@thincoder/core/prompt-files.mjs"
import { SUBAGENT_TOOL_EXCLUSIONS } from "@thincoder/core/agent/helpers.mjs" // 子代面排除集（核单源——TOOLS.md §6.16）
import { loadConsultPool } from "../extension/presets.mjs"
import { builtinTools, toOpenAISchema, readImageTool } from "../tools.mjs"
import { specForModel } from "../specs.mjs"

/**
 * Decorate a consult-related tool's description with the CURRENT configured candidate
 * pool (provider:model list). Without this the model cannot know which models a consult
 * start / subagent action:'escalate' call can pick from — it would hallucinate
 * provider:model names or never pass `model`. The tool table is assembled per-run from
 * loadRaw(), so the list stays fresh. Description-only: the tool object is cloned
 * shallowly, execute untouched. AGENT-LOOP-SUBAGENT.md §6.7 (2026-09-03): applied to the depth-0 subagentTool
 * too — its escalate action picks from the same pool (the standalone escalate tool was
 * merged in as action:"escalate").
 */
export function withPool(tool) {
  // F-4 (IKCDMR)：运行时读面清洗（loadConsultPool——未知渠道条目过滤 + 一次性警告——
  // CLI loadConfig 同规则）——池描述只列合法候选（防模型照描述点名悬挂条目）。
  const models = loadConsultPool()
  const list = models.map((m) => `${m.provider}:${m.model}${m.effort ? ` (${m.effort})` : ""}`).join(", ")
  if (!list) return tool
  return {
    ...tool,
    description: tool.description + `\nCurrently configured consultants (pool for consult_start / subagent action:'escalate'): ${list}`,
  }
}

/**
 * W13（2026-09-15 · S2 · `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W13）：VSC subagent
 * 工具面装饰（原 `src/agent-tools/subagent.mjs` 的端侧面随镜像删旧迁入本档——同一份装配面，
 * 不另立档；承 W14 `gitTool` 装饰先例）：
 *   ① `modeRoleField`（模式互斥 role enum + suffix）——原档 verbatim 迁入（核 `agent/setup.mjs`
 *      同族逻辑在核内装配面，未导出 ⇒ 端侧装配面自持该面至 W15 收敛）。
 *   ② #99（CORE-UNIFICATION §2.13.4 / AGENT-LOOP-SUBAGENT.md §6.7.2 AC-P4）：核登记册的工具面含 `panel`
 *      动作（CLI TUI 面板镜像），VSC 载荷面不存在 ⇒ **装配层剔除**（端侧过滤、零核改动）——
 *      action enum 去项 + 描述去 panel 段 + view/freeze 两参数（仅 panel 消费）移除。
 *   ③ 动作级分类（`isReadonlyAction` status/observe · `isControlAction` cancel/send）——端审批面
 *      （execute-tools 权限门/批分组 + tool-gates planMode 门）按谓词读；核 subagent 工具无该钩子
 *      （核内零端名/零端概念）⇒ 装饰面承载（逐字同删除档谓词）。
 *   ④ C-5 终态回显（AGENT-LOOP-ASYNC-POOL.md §6.20）：核 `status` 不读墓碑（未命中即 unknown），
 *      端契约要求 discarded/cancelled/consumed/failed 四态回显 ⇒ 装配面接管 `execute`（仅在核
 *      输出为 unknown-错误时查核墓碑单点 `tombstoneOf` 补回显——其余输出原样透传）。
 */
export function vscSubagentFace(tool) {
  const { view, freeze, ...props } = tool.parameters.properties
  const actionProp = props.action
  return {
    ...tool,
    description: tool.description.split("\n").filter((l) => !l.startsWith("- action:'panel'")).join("\n"),
    parameters: {
      ...tool.parameters,
      properties: {
        ...props,
        action: {
          ...actionProp,
          enum: (actionProp.enum ?? []).filter((a) => a !== "panel"),
          description: actionProp.description.replace(/panel \([^)]*\), ?/, ""),
        },
      },
    },
    async execute(args, ctx) {
      return vscStatusTerminalEcho(args, ctx, await tool.execute(args, ctx))
    },
    isReadonlyAction(args) {
      const action = args?.action
      return action === "status" || action === "observe"
    },
    isControlAction(args) {
      const action = args?.action
      return action === "cancel" || action === "send"
    },
  }
}

/** C-5 终态回显表（墓碑 status → 返回 status + note；未列值不入表——不虚构语义）。
 *  文案 = 删除前端侧同表逐字（§6.20 C-5 四态：discarded/cancelled/consumed→done/failed）。 */
const VSC_TERMINAL_ECHO = {
  discarded: { status: "discarded", note: "discarded by the user's Stop — its report will NOT arrive (partial changes stay unmerged/unaudited; re-spawn if the work is still needed)" },
  cancelled: { status: "cancelled", note: "cancelled — its report will NOT arrive (its work was stopped; partial changes stay unmerged/unaudited)" },
  consumed: { status: "done", note: "delivered — the report was injected into the session" },
  failed: { status: "failed", note: "settled with an error — the error report was injected; nothing is pending" },
}

// W13 ④ C-5 终态回显读面（核墓碑单点）——**动态** import：核 `async-settle.mjs` 静态链可达
// `node:sqlite`（scheduler→subagent-async→核 agent 栈——W8 契约②机判），静态引入会破端壳静态闭包；
// 读点 = `vscStatusTerminalEcho`。

/** C-5 终态回显（两池未命中 → 查墓碑；无记录/未列墓碑值照旧 unknown）。核 `status` 单查
 *  未命中返回 unknown-错误串——本函数仅接管该形态（`status` + 带 id + 输出含 unknown）。 */
async function vscStatusTerminalEcho(args, ctx, out) {
  if (args?.action !== "status") return out
  const id = args?.id
  if (id === undefined || id === null || String(id) === "") return out
  if (typeof out !== "string" || !out.includes("unknown async subagent id")) return out
  const { tombstoneOf } = await import("@thincoder/core/agent-tools/async-settle.mjs") // 动态（W8 契约②）
  const t = tombstoneOf(ctx?.agent, id)
  const echo = t ? VSC_TERMINAL_ECHO[t.status] : null
  if (!echo) return out
  return JSON.stringify({ id, role: t.role, status: echo.status, note: echo.note })
}

/**
 * Mode-dependent subagent role schema field (原 `src/agent-tools/subagent.mjs` verbatim 迁入
 * ——W13；CLI setup.mjs parity）。The role enum is mutually exclusive per mode: normal mode
 * advertises "coder", engineering mode advertises "eng-coder". The schema filter is the FIRST
 * line of defense — the model never sees the disabled role as legal; the runtime throws in
 * execute() stay as the hard gate. Returns { role, suffix }: `role` replaces
 * parameters.properties.role wholesale; `suffix` appends to the tool-level description
 * ("" in normal mode).
 */
export function modeRoleField(engineering) {
  return engineering
    ? {
        role: {
          type: "string",
          enum: ["explore", "eng-designer", "eng-coder"],
          description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required.",
        },
        suffix: "In engineering mode, use role='eng-coder' for implementation (coder is disabled) and role='eng-designer' for design writing.",
      }
    : {
        role: {
          type: "string",
          enum: ["explore", "plan", "coder"],
          description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required.",
        },
        suffix: "",
      }
}

/**
 * 工具表装配（2026-09-21 拆入面——`docs/core/design/MANIFEST.md` §2.3 行 16 / 29：`setup.mjs`
 * 越 500 硬限 ⇒ 装配段**纯结构搬移零语义**迁入 `setup-tooltable.mjs`；2026-09-29 再拆入本档——
 * 同档 §2.3 拆分注 行 29）。段序与原文一致：
 * ① 家族段装配（核单源 `assembleFamilyTools`）· ② MCP 连接展开 · ③ 基础集 · 全表 ·
 * `toolByName` · `toolSchemas` 构建。入参 = 段内消费的既有局部；返回 = 后续段解构收下的四名
 * （`baseSet` 即 `agent.tools` 绑定值；`toolByName` / `toolSchemas` 随 hydrateRun 返回面出）。
 * W8 契约②保持：段内四条动态 import（核 `agent-tools.mjs` / 核 `agent/family-tools.mjs` /
 * 核 `ledger.mjs` / 端 `panel-mcp.mjs`）**原样动态**——静态引入会经核 agent 栈触达 `node:sqlite`。
 * @param {{depth:number, role:string|null, engineering:boolean, provider:object,
 *   mcpServers:object[]|undefined, builtinTools:object[], opts:object, batchDoc:string|null,
 *   settingsTool:object}} p 段内消费的既有局部
 * @returns {{baseSet:object[], tools:object[], toolByName:Map<string,object>, toolSchemas:object[]}}
 */
export async function buildToolTable({ depth, role, engineering, provider, mcpServers, builtinTools, opts, batchDoc, settingsTool }) {
  // ── 工具表装配（W9/W13 → VSC-TOOL-TABLE-DUP §2.3C：装配改调**核家族单源**）：登记册解构面收窄至
  // 装饰所需实例（3 名）；角色分支链（原 `:351-385` depth/role 矩阵）整体退场；两档均**动态**载入
  // （静态引入会经 consult/subagent 族触达 node:sqlite，破 W8 契约②；模块缓存 ⇒ 每轮零成本）。
  // ENG-PLAN-EXCLUSION（2026-09-21 · FR31 ①/KD9）：本块**下移至模式判定后**——入参 `engineering`
  // = 工程模式真值（`applySlotSessionState` 派生：槽优先 → engState → cfg），固定段裁剪（工程模式
  // plan 不入表）与核/CLI 同口径；端壳不二次过滤。
  const { subagentTool, consultStartTool, consultStopTool } = await import("@thincoder/core/agent-tools.mjs") // ← 解构面收窄（装饰所需实例）
  const { assembleFamilyTools } = await import("@thincoder/core/agent/family-tools.mjs") // ← 动态（W8 契约②）
  const pool = loadConsultPool()
  // 端差：`engineering` 补传（核内消费点除 filteredSubagent 外新增**固定段裁剪**——固定段不被
  // `decorate.subagent` 覆盖）；端侧角色 enum 仍由 schema 面 `modeRoleField` 承载。
  const agentTools = await assembleFamilyTools({
    depth, role,
    engineering,
    consultModels: pool,
    batchDoc,
    decorate: {
      subagent: pool.length ? withPool(vscSubagentFace(subagentTool)) : vscSubagentFace(subagentTool),
      consultStart: pool.length ? withPool(consultStartTool) : consultStartTool,
      consultStop: consultStopTool,
      settings: settingsTool,
    },
  })
  // M2 台账查询两工具（核 `tools/index.mjs:61` 同法——全角色面）：动态 import——ledger 链静态
  // 达 `node:sqlite`（W8 契约②）；写命令族已随核 `assembleFamilyTools` 在端可达（上方装配块）。
  const { ledgerQueryTool, ledgerCountTool } = await import("@thincoder/core/ledger.mjs")

  // MCP tools: idempotent connect + expand into NATIVE tools (CLI parity, MCP.md D1/D2).
  // Top level only; failures never block — D-CI7（F-Q11）：警告可见面 = console
  // （端壳 MCP 面 `panel-mcp.mjs` / cli make-agent.mjs 同前缀）；不是 history 注入（CLI 无此
  // 行为）——mcpWarnings 字段保留为采集面。
  let mcpTools = []
  const mcpWarnings = []
  if (depth === 0 && Array.isArray(mcpServers) && mcpServers.length > 0) {
    try {
      const { connectMcpServersExpanded } = await import("../extension/panel-mcp.mjs")
      const r = await connectMcpServersExpanded(mcpServers)
      mcpTools = r.tools
      mcpWarnings.push(...r.warnings)
    } catch { /* expansion failure is non-fatal — the model just lacks MCP tools this turn */ }
  }

  // Subagent role-based tool filtering: explore/plan/consult get read-only tools only.
  // The depth>0 face also drops the depth-excluded tools (core single source `SUBAGENT_TOOL_EXCLUSIONS`
  // — TOOLS.md §6.16): a background subagent (parallel consultants especially) never prompts the user.
  const isReadOnlyRole = depth > 0 && (role === "explore" || role === "plan" || role === "consult")
  const baseTools = [
    ...(isReadOnlyRole ? builtinTools.filter((t) => t.readonly) : builtinTools),
    ledgerQueryTool, ledgerCountTool, // M2 查询两工具（只读——只读角色同放行；恒入基础集）
  ].filter((t) => depth === 0 || !SUBAGENT_TOOL_EXCLUSIONS.has(t.name))
  // L1 契约（VSC-TOOL-TABLE-DUP §2.1A）：`agent.tools` 绑定值 = **基础集**（下方 `baseSet`）
  // ——不含端侧 meta 工具族 `agentTools`（核 `assembleFamilyTools` 追加族与端侧 meta 族实测
  // 重叠 11 名 ⇒ 入绑定值必致子代装配重名）；全表 `tools` 原样保留（端侧 schema / 执行面
  // `toolByName`）。多模态项抽 `mm` 局部（§2.1A 认可消重形态——行为等价）。
  const mm = specForModel(provider.model).multimodal ? [readImageTool] : []
  const baseSet = [
    ...baseTools,
    ...mm,
    ...mcpTools,
    // caller-injected tools (e.g. consult's main_history)——注入方承担「与核追加家族不重名」义务（§2.3F）
    ...(opts.extraTools ?? []),
  ]
  const tools = [
    ...baseTools,
    ...mm,
    ...agentTools,
    ...mcpTools,
    ...(opts.extraTools ?? []), // caller-injected tools (e.g. consult's main_history)
  ]
  const toolByName = new Map(tools.map((t) => [t.name, t]))

  // Tool schemas are built AFTER `engineering` is known: the subagent role enum is
  // mode-dependent (CLI setup.mjs parity) — normal mode must not advertise 'eng-coder'
  // as a legal role. Schema filtering is the first line of defense; the runtime
  // mutual-exclusion throws in subagentTool.execute stay as the hard gate.
  const toolSchemas = tools.map((t) => {
    if (depth === 0 && t.name === "subagent") {
      const { role: roleField, suffix } = modeRoleField(engineering)
      const schema = toOpenAISchema(t)
      // 重组后的描述仍经锚替换原语（§2.13.8 面 3 单出口——本行不得以裸描述覆写注入结果）
      schema.function.description = applyPromptInjections(t.description + (suffix ? "\n" + suffix : ""))
      schema.function.parameters = {
        ...t.parameters,
        properties: { ...t.parameters.properties, role: roleField },
      }
      return schema
    }
    return toOpenAISchema(t)
  })

  return { baseSet, tools, toolByName, toolSchemas }
}
