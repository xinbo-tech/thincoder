/**
 * agent/tool-table.mjs — 工具表装配装饰面（2026-09-29 parity-b1 · 批档 §2.2 行 12 ∕ §2.3 件 1
 * 「工具表」行 + 父侧 2026-09-29 裁定①）。结构沿用 #365 拆分（`MANIFEST.md` §2.3 拆分注 行 29）：
 *   ① 端装饰体 `vscSubagentFace`——经 `opts.toolDecorate` 供核 `assembleFamilyTools({ decorate })`
 *      （替换核 `filteredSubagent` ⇒ **端侧自带 role 面**：role enum ∕ suffix ∕ escalate 候选池
 *      文案 = 取核拷贝（核 `family-tools.mjs:46-56/:69-74`）；端特有面 = panel 动作剔除（VSC 无面板
 *      镜像）· C-5 终态回声 · 动作级谓词 `isReadonlyAction/isControlAction`（核 dispatch 分类面消费）。
 *   ② `buildToolTable` —— **基础集**装配（`baseSet` → `agent.tools`；家族段由核 `prepareRun` 追加
 *      ——§2.3 件 1「装配取核」）。旧拷贝项 `withPool` ∕ `modeRoleField` ∕ 家族段装配 ∕
 *      `toolSchemas`/`toolByName` 随归核退役（withPool 形态差 = 工具级行 → 核 action 级
 *      candidates 行，随取核登记；C-5 终态回声读面见 `vscStatusTerminalEcho` 头注）。
 * W8 契约②（端壳静态闭包零 `node:sqlite`）：核 `agent-tools.mjs` / `agent/family-tools.mjs` /
 * `ledger.mjs` / 端 `panel-mcp.mjs` 四类面仍走**动态** import()（见各段内注）。
 */
import { loadConsultPool } from "../extension/presets.mjs"
import { readImageTool } from "../tools.mjs"
import { wireMemoryFace } from "../memory-tool.mjs"
import { specForModel } from "../specs.mjs"
// 子代面排除集（核单源——TOOLS.md §6.16；核 `agent/helpers.mjs` 静态安全——W8 扫描实测）
import { SUBAGENT_TOOL_EXCLUSIONS } from "@thincoder/core/agent/helpers.mjs"

/**
 * VSC subagent 工具面装饰（原 W13 端侧装饰 + 本批 role 面取核合并——**装饰体单点**）。
 * 面清单：
 *   ① `modeRoleField` 等价 role 面（取核拷贝——核 `family-tools.mjs:46-56`）：模式互斥 role enum +
 *      suffix（工程模式 advertises eng-coder/eng-designer；普通模式 advertises coder）。
 *   ② #99（CORE-UNIFICATION §2.13.4 / AGENT-LOOP-SUBAGENT.md §6.7.2 AC-P4）：核登记册的工具面含 `panel`
 *      动作（CLI TUI 面板镜像），VSC 载荷面不存在 ⇒ **装配层剔除**（端侧过滤、零核改动）——
 *      action enum 去项 + 描述去 panel 段 + view/freeze 两参数（仅 panel 消费）移除。
 *   ③ 动作级分类（`isReadonlyAction` status/observe · `isControlAction` cancel/send）——端旧消费者
 *      （已删 `execute-tools` ∕ `tool-gates`）随取核退役；**E1 已落**（2026-09-29 parity-b1 P4-II：核
 *      `dispatch-gates.mjs` 两谓词 + `dispatch.mjs` 两门禁位消费——钩子优先；本面 = 核分类的端装饰供体）。
 *   ④ escalate 候选池（取核拷贝——核 `family-tools.mjs:69-74` 同位同文案；非工程模式 + 池非空才挂）。
 *   ⑤ C-5 终态回显（AGENT-LOOP-ASYNC-POOL.md §6.20）：核 `status` 不读墓碑（未命中即 unknown），
 *      端契约要求 discarded/cancelled/consumed/failed 四态回显 ⇒ 装配面接管 `execute`（仅在核
 *      输出为 unknown-错误时查核墓碑单点 `tombstoneOf` 补回显——其余输出原样透传）。
 * @param {object} tool 核 `subagentTool`（动态取用）
 * @param {{engineering?: boolean, consultModels?: object[]}} [opts]
 */
export function vscSubagentFace(tool, { engineering = false, consultModels = [] } = {}) {
  const { view, freeze, ...props } = tool.parameters.properties
  const actionProp = props.action
  // ① role 面（取核拷贝）：模式互斥——普通模式 coder ∕ 工程模式 eng-coder（+ eng-designer）
  const subagentRoles = engineering
    ? {
        enum: ["explore", "eng-designer", "eng-coder"],
        description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required.",
        suffix: " In engineering mode, use role='eng-coder' for implementation (coder is disabled) and role='eng-designer' for writing the requirements/design documents.",
      }
    : {
        enum: ["explore", "plan", "coder"],
        description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required.",
        suffix: "",
      }
  // ④ escalate 候选池（取核拷贝）：池装饰挂在 action 属性描述（escalate 工程模式禁用——只对正常模式有意义）
  const action = consultModels.length && !engineering
    ? {
        ...actionProp,
        description: actionProp.description +
          `\nCurrently configured escalate candidates (agent.consultModels pool): ${consultModels.map((m) => `${m.provider}:${m.model}${m.effort ? ` (${m.effort})` : ""}`).join(", ")}`,
      }
    : actionProp
  return {
    ...tool,
    // ① 描述：先剔 panel 行（端面无该动作）**再**附 role suffix——后缀居尾（取核同位）
    description: tool.description.split("\n").filter((l) => !l.startsWith("- action:'panel'")).join("\n") + subagentRoles.suffix,
    parameters: {
      ...tool.parameters,
      properties: {
        ...props,
        role: { ...tool.parameters.properties.role, enum: subagentRoles.enum, description: subagentRoles.description },
        // ② + ④：action 面 = 去 panel（enum + 描述段）+ 候选池行
        action: {
          ...action,
          enum: (actionProp.enum ?? []).filter((a) => a !== "panel"),
          description: action.description.replace(/panel \([^)]*\), ?/, ""),
        },
      },
    },
    async execute(args, ctx) {
      return vscStatusTerminalEcho(args, ctx, await tool.execute(args, ctx))
    },
    isReadonlyAction(args) {
      const act = args?.action
      return act === "status" || act === "observe"
    },
    isControlAction(args) {
      const act = args?.action
      return act === "cancel" || act === "send"
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
 * 工具表**基础集**装配（§2.3 件 1「工具表」行：装配取核——家族段 ∕ `toolSchemas` ∕ `toolByName`
 * 归核 `prepareRun`）。段序沿用原文：① 装饰体 → `opts.toolDecorate` 写回（裁定①）· ② MCP 连接
 * 展开 · ③ 基础集（内置 ± 只读过滤 ∖ 子代排除 + 台账查询两工具 + 多模态 + extraTools）。
 * W8 契约②保持：段内动态 import（核 `agent-tools.mjs` / 核 `ledger.mjs` / 端 `panel-mcp.mjs`）
 * 原样动态——静态引入会经核 agent 栈触达 `node:sqlite`。
 * @param {{depth:number, role:string|null, engineering:boolean, provider:object,
 *   mcpServers:object[]|undefined, builtinTools:object[], opts:object, batchDoc:string|null,
 *   settingsTool:object}} p 段内消费的既有局部
 * @returns {{baseSet:object[], mcpWarnings:string[]}} 基础集（`agent.tools` 绑定值）+ MCP 失败警告
 *   （#823——装配尾 `applyMcpWarnings` 消费；零服务器 / 展开抛 ⇒ `[]`）
 */
export async function buildToolTable({ depth, role, engineering, provider, mcpServers, builtinTools, opts, batchDoc, settingsTool }) {
  // ── ① 端装饰体（裁定①）：`opts.toolDecorate` 写回（先例 = opts.agent ∕ opts.history 写回）——
  // 核 `prepareRun` 透传 `assembleFamilyTools({ decorate })`。子代理段无 subagent ∕ settings 家族位
  // （核 `family-tools.mjs` 仅 depth-0 分支消费 decorate）⇒ 仅 depth 0 需要。
  // 登记册**动态**载入（核 `agent-tools.mjs` 静态图经 consult/subagent 族可达核 agent 栈——W8 契约②）。
  if (depth === 0) {
    const { subagentTool } = await import("@thincoder/core/agent-tools.mjs")
    const pool = loadConsultPool()
    opts.toolDecorate = {
      subagent: vscSubagentFace(subagentTool, { engineering, consultModels: pool }),
      settings: settingsTool, // 端差异面（核默认形态里 settings 住基础集；端侧自持清单无该面 ⇒ decorate 补位）
    }
  }

  // ── ② MCP tools: idempotent connect + expand into NATIVE tools (CLI parity, MCP.md D1/D2).
  // Top level only; failures never block — D-CI7（F-Q11）：警告可见面 = console（采集点）
  // ＋出参 `mcpWarnings` 交装配尾（提醒注入——三端同形；#823）。
  let mcpTools = []
  let mcpWarnings = []
  if (depth === 0 && Array.isArray(mcpServers) && mcpServers.length > 0) {
    try {
      const { connectMcpServersExpanded } = await import("../extension/panel-mcp.mjs")
      const r = await connectMcpServersExpanded(mcpServers)
      mcpTools = r.tools
      mcpWarnings = r.warnings ?? []
    } catch { /* expansion failure is non-fatal — the model just lacks MCP tools this turn（零警告——非致命） */ }
  }

  // M2 台账查询两工具（核 `tools/index.mjs:61` 同法——全角色面）：动态 import——ledger 链静态
  // 达 `node:sqlite`（W8 契约②）；写命令族已随核 `assembleFamilyTools` 在端可达（核装配块）。
  const { ledgerQueryTool, ledgerCountTool } = await import("@thincoder/core/ledger.mjs")

  // I9（#677——memory 描述面收口）：描述 ∕ 参数面核单源注入（端零自持描述字面；端面只留
  // layer 值域守卫）。动态 import：`memory.mjs` 链静态达 `node:sqlite`——W8 契约②，同档纪律。
  const { memoryTools } = await import("@thincoder/core/memory.mjs")
  wireMemoryFace(memoryTools(null, {})[0])

  // ── ③ 基础集：subagent role-based tool filtering —— explore/plan/consult get read-only tools only；
  // depth>0 面另剔 depth-excluded 工具（核单源 `SUBAGENT_TOOL_EXCLUSIONS`——TOOLS.md §6.16）。
  const isReadOnlyRole = depth > 0 && (role === "explore" || role === "plan" || role === "consult")
  const baseTools = [
    ...(isReadOnlyRole ? builtinTools.filter((t) => t.readonly) : builtinTools),
    ledgerQueryTool, ledgerCountTool, // M2 查询两工具（只读——只读角色同放行；恒入基础集）
  ].filter((t) => depth === 0 || !SUBAGENT_TOOL_EXCLUSIONS.has(t.name))
  // L1 契约（VSC-TOOL-TABLE-DUP §2.1A）：`agent.tools` 绑定值 = **基础集**（不含家族段——
  // 核 `assembleFamilyTools` 追加族与端侧 meta 族实测重叠 11 名 ⇒ 入绑定值必致子代装配重名）。
  // 多模态项抽 `mm` 局部（§2.1A 认可消重形态——行为等价）。
  const mm = specForModel(provider.model).multimodal ? [readImageTool] : []
  const baseSet = [
    ...baseTools,
    ...mm,
    ...mcpTools,
    // caller-injected tools (e.g. consult's main_history)——注入方承担「与核追加家族不重名」义务（§2.3F）
    ...(opts.extraTools ?? []),
  ]

  return { baseSet, mcpWarnings }
}
