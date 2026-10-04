/**
 * ledger-tools.mjs — 台账**统一入口** `ledger`（action 分派）+ 五旧名弃用壳 + 工具层参数守卫。
 * 自 `ledger-cmd.mjs` 拆出（2026-09-28 守卫族微修批 · 台账 #473）；2026-10-05 统一入口批
 * （台账 #923）合五工具为一：模型面恰一名 `ledger`（两变体同名单对象、schema 窄化——
 * 全量 = depth-0 五 action ∥ 只读 = depth>0 二 action）；旧五名 = code 面弃用壳（不入任何装配面）。
 * 守卫 = **声明派生**（设计档 §3.2 / §11.3：判序① 入参归一 → ② 入口级 action 判（消费 action）→
 * ③ 余键喂该 action 伪工具对象走 P2–P6——声明源 = 前身旧工具 `parameters` 逐字；helper `assertToolArgs`
 * 零改）；判于核函数之前 ⇒ 非法入参零写、零库动作、零 SQLite 原文外泄。
 * 接线：族出口 = `ledger.mjs`（re-export——消费面 agent/family-tools.mjs；旧读二装配面已清零）；
 * 消费侧一律动态 import（`ledger-db.mjs` 静态 import node:sqlite ⇒ W8 契约②）。
 */
import { ledgerAdd, ledgerClose, ledgerCount, ledgerQuery, ledgerUpdate } from "./ledger-cmd.mjs"
import { DESC } from "./tools/shared.mjs" // #15 描述外置：文本单点 = tool-docs/ledger.md（DESC 单解析面）

/** 工具 cwd 供值面（缺省 → 当前项目根）。 */
const cwdOf = (ctx) => ctx?.agent?.cwd ?? ctx?.cwd ?? process.cwd()

// ── 工具层参数守卫（设计档 §3.2 · 2026-09-27 快车道修复 · Gitee #IKIQGK / 台账 #472） ──

/** 值预览（P1–P5 文案的 `<预览>`——设计档 §3.2）：`JSON.stringify`，超 80 字符截断加 `…`
 *  （`undefined` 无 JSON 形 ⇒ 取文本形）。 */
const argPreview = (v) => {
  const s = JSON.stringify(v) ?? String(v)
  return s.length > 80 ? `${s.slice(0, 80)}…` : s
}

/** 枚举取值域文本（P3 / P5 文案同源）。 */
const enumText = (values) => `{${values.join(", ")}}`

/** P3 后缀（声明派生）：枚举字段带取值域 / 非枚举必填串带「非空字符串」/ 数字字段仅「必填」。 */
const requiredSuffix = (spec) => (spec.enum ? `；取值 ∈ ${enumText(spec.enum)}` : spec.type === "string" ? "；非空字符串" : "")

/**
 * 工具层参数守卫（设计档 §3.2 · Gitee #IKIQGK / 台账 #472）：判序 P1–P6，文案逐字 = §3.2 模板；
 * 消费工具自身 `parameters` 声明派生（`required` / `type` / `enum`——枚举 / 必填 / 类型不在守卫内复写）；
 * 只判不改（零缺省填充 / 零类型转换 / 零文本改写），返回入参对象（唯一归一 = 判序① 的缺省 / `null`
 * ⇒ `{}`）。非法 ⇒ throw——判于核函数之前（零写、零库动作）。
 */
function assertToolArgs(tool, args) {
  const name = tool.name
  const decl = tool.parameters ?? {}
  const props = decl.properties ?? {}
  const fields = Object.keys(props)
  // P1：入参缺省 / `null` ⇒ 视作 `{}`；非对象（数组 / 标量）⇒ 拒
  if (args == null) args = {}
  else if (typeof args !== "object" || Array.isArray(args)) throw new Error(`${name}：参数须为对象（收到 ${argPreview(args)}）`)
  // P2：未知键 ⇒ 拒（判序先于缺参——typo 键先给可用参数集）
  const unknown = Object.keys(args).filter((k) => !Object.hasOwn(props, k))
  if (unknown.length > 0) throw new Error(`${name}：未知参数：${unknown.join(" / ")}（可用参数 = ${fields.join(" / ")}）`)
  // P3–P6：逐字段（声明序）——缺失（必填；显式 `null` 同判）→ 类型 / 枚举 → `title` 空串 / 全空白
  for (const field of fields) {
    const spec = props[field]
    const value = args[field]
    const required = (decl.required ?? []).includes(field)
    if (value === undefined || value === null) {
      if (required) throw new Error(`${name}：${field} 缺失（必填${requiredSuffix(spec)}）`)
      continue // 可空字段 `null` ⇒ 放行（≡ 略去——与 `patch.x ?? 行值` 既有语义同源）
    }
    if (spec.enum) {
      if (!spec.enum.includes(value)) throw new Error(`${name}：${field} 非法：${argPreview(value)}（取值 ∈ ${enumText(spec.enum)}）`)
    } else if (spec.type === "string" && typeof value !== "string") {
      throw new Error(`${name}：${field} 非法：${argPreview(value)}（应为字符串）`)
    } else if (spec.type === "number" && typeof value !== "number") {
      throw new Error(`${name}：${field} 非法：${argPreview(value)}（应为数字）`)
    }
    if (field === "title" && typeof value === "string" && value.trim() === "") {
      throw new Error(`${name}：${field} 为空（${required ? "必填；" : ""}非空字符串）`)
    }
  }
  return args
}

// ── 统一入口（设计档 §11.2 / §11.3） ─────────────────────────────────────────

/** action 枚举（全量 / 只读两变体；顺序 = 文档与按钮序）。 */
const FULL_ACTIONS = ["add", "update", "close", "query", "count"]
const READ_ACTIONS = ["query", "count"]

/** cwd 参数描述（五前身声明同文——文本单点）。 */
const CWD_DESC = "项目根目录——台账按项目根关联存储于用户数据目录（工作树外、不进 git）。相对路径按当前工作目录解析；查/写别的项目请给绝对路径。缺省 = 当前会话项目根"

/** 各 action 声明条目（= 前身旧工具 `parameters` 逐字；伪工具对象守卫 + 弃用壳共用单源）。 */
const ACTION_SPECS = {
  add: {
    type: "object",
    required: ["kind", "title"],
    properties: {
      cwd: { type: "string", description: CWD_DESC },
      kind: { type: "string", enum: ["requirement", "tech_todo"], description: "类别" },
      title: { type: "string", description: "条目标题" },
      board: { type: "string", description: "归属板块（需求档文档名，可空）" },
      req_doc: { type: "string", description: "需求档指针（可空）" },
      task_book: { type: "string", description: "任务书指针（可空；在途 / 待核销必填——咬合 CHECK）" },
      evidence: { type: "string", description: "最小证据行（可空）" },
      trigger: { type: "string", enum: ["归批", "条件", "认账不排期"], description: "技术待办触发（可空）" },
    },
    additionalProperties: false,
  },
  update: {
    type: "object",
    required: ["id"],
    properties: {
      cwd: { type: "string", description: CWD_DESC },
      id: { type: "number", description: "条目 id" },
      status: { type: "string", enum: ["待讨论", "待设计", "在途", "待核销", "已核销", "已废弃"], description: "目标状态（六态之一，缺省 = 不变）" },
      title: { type: "string", description: "标题（缺省 = 不变）" },
      board: { type: "string", description: "归属板块（缺省 = 不变）" },
      req_doc: { type: "string", description: "需求档指针（缺省 = 不变）" },
      task_book: { type: "string", description: "任务书指针（缺省 = 不变）" },
      evidence: { type: "string", description: "证据（缺省 = 不变）" },
      trigger: { type: "string", enum: ["归批", "条件", "认账不排期"], description: "触发（缺省 = 不变）" },
      executor: { type: "string", description: "执行者 sessionId（可选——接手改写归属用；缺省 = 按状态迁移语义：进在途自动写本会话 / 出在途自动清空 / 其余不变）" },
    },
    additionalProperties: false,
  },
  close: {
    type: "object",
    required: ["id", "status"],
    properties: {
      cwd: { type: "string", description: CWD_DESC },
      id: { type: "number", description: "条目 id" },
      status: { type: "string", enum: ["已核销", "已废弃"], description: "目标态（勾销 / 追认核销 / 撤回）" },
    },
    additionalProperties: false,
  },
  query: {
    type: "object",
    properties: {
      cwd: { type: "string", description: CWD_DESC },
      status: { type: "string", enum: ["待讨论", "待设计", "在途", "待核销", "已核销", "已废弃"], description: "按状态过滤（六态之一，缺省 = 不过滤）" },
      kind: { type: "string", enum: ["requirement", "tech_todo"], description: "按类别过滤" },
      board: { type: "string", description: "按归属板块过滤（需求档文档名）" },
    },
    additionalProperties: false,
  },
  count: {
    type: "object",
    properties: { cwd: { type: "string", description: CWD_DESC } },
    additionalProperties: false,
  },
}

/** 并集 schema（§11.2——`action` 枚举 + 五 action 参数并集；per-action 必填由运行时守卫裁）。 */
const UNION_PARAMETERS = {
  type: "object",
  required: ["action"],
  properties: {
    action: { type: "string", enum: FULL_ACTIONS, description: "" }, // 变体构造时填描述
    cwd: { type: "string", description: CWD_DESC },
    kind: { type: "string", enum: ["requirement", "tech_todo"], description: "类别（add 必填 / query 过滤；缺省 = 不过滤）" },
    title: { type: "string", description: "条目标题（add 必填；update 可改——空串 / 全空白 ⇒ 拒）" },
    board: { type: "string", description: "归属板块（需求档文档名；add 可空 / update 缺省 = 不变 / query 过滤）" },
    req_doc: { type: "string", description: "需求档指针（add 可空 / update 缺省 = 不变）" },
    task_book: { type: "string", description: "任务书指针（add 可空 / update 缺省 = 不变；在途 / 待核销必填——咬合 CHECK）" },
    evidence: { type: "string", description: "最小证据行（add 可空 / update 缺省 = 不变；追认核销须非空）" },
    trigger: { type: "string", enum: ["归批", "条件", "认账不排期"], description: "技术待办触发（add / update 可空）" },
    id: { type: "number", description: "条目 id（update / close 必填）" },
    status: { type: "string", enum: ["待讨论", "待设计", "在途", "待核销", "已核销", "已废弃"], description: "状态（close 必填 ∈ {已核销, 已废弃}；update 迁移 / query 过滤——六态之一）" },
    executor: { type: "string", description: "执行者 sessionId（update 可选——接手改写归属；缺省 = 按状态迁移语义）" },
  },
  additionalProperties: false,
}

/** 变体构造（同名单对象、schema 窄化、两形永不同装配——先例 = `subagent` 工具 depth 面变体）：
 *  全量（depth-0 五 action；`writeFace:true` —— `readonly:false` + 动作级分类钩子，写面保持侧效门，
 *  query / count 归只读类 = 旧读二 `readonly:true` 同行为：planMode 放行 / 免审批）∥ 只读（depth>0
 *  二 action；`readonly:true`，写三 schema 级不可达）。形态显式声明（不按 actions 长度推导——增量
 *  变体不改错标文案）。 */
function makeLedgerTool(actions, { readonly = false, writeFace = false } = {}) {
  const entryTool = { name: "ledger", parameters: { type: "object", required: ["action"], properties: { action: { type: "string", enum: actions } } } }
  return {
    name: "ledger",
    description: DESC("ledger"), // 文本单点 = tool-docs/ledger.md（五档要点合一）
    parameters: {
      ...UNION_PARAMETERS,
      properties: {
        ...UNION_PARAMETERS.properties,
        action: {
          ...UNION_PARAMETERS.properties.action,
          enum: actions,
          description: writeFace
            ? "操作（五值）：add 新增 / update 更新 / close 收口 / query 查询 / count 计数——写三仅主 agent 装配面"
            : "操作（只读二值）：query 查询 / count 计数",
        },
      },
    },
    readonly,
    isReadonlyAction(args) { return READ_ACTIONS.includes(args?.action) },
    async execute(args, ctx) {
      // ① 入参归一（判序①——P1 同式；缺省 / null ⇒ {}）
      if (args == null) args = {}
      else if (typeof args !== "object" || Array.isArray(args)) throw new Error(`ledger：参数须为对象（收到 ${argPreview(args)}）`)
      // ② 入口级 action 判（P3 缺失 / P5 非法——消费 action；取值域 = 本装配面枚举）
      const { action, ...rest0 } = args
      assertToolArgs(entryTool, { action })
      // ③ 余键喂该 action 伪工具对象（声明源 = 前身工具 parameters 逐字——`action` 键不入 P2 域）
      const rest = assertToolArgs({ name: `ledger(${action})`, parameters: ACTION_SPECS[action] }, rest0)
      // ④ 路由既有核函数（包装细节携自原工具 execute 逐字保留：cwd 缺省 / JSON 缩进 / getSessionId 动态 import）
      switch (action) {
        case "add": {
          const { cwd, ...row } = rest
          const id = ledgerAdd({ cwd: cwd ?? cwdOf(ctx), row })
          return JSON.stringify({ id, status: "待讨论" })
        }
        case "update": {
          const { cwd, id, ...patch } = rest
          let executorSessionId
          if (patch.executor == null) {
            // 显式 `null` ≡ 略去（§3.1 `null` 口径 · #474——与缺省同分支）；动态 import——零新静态边（K-LX1）
            const { getSessionId } = await import("./session-slots.mjs")
            executorSessionId = getSessionId()
          }
          return JSON.stringify(ledgerUpdate({ cwd: cwd ?? cwdOf(ctx), id, patch, executorSessionId }))
        }
        case "close":
          return JSON.stringify(ledgerClose({ cwd: rest.cwd ?? cwdOf(ctx), id: rest.id, status: rest.status }))
        case "query":
          return JSON.stringify(ledgerQuery({ cwd: rest.cwd ?? cwdOf(ctx), status: rest.status, kind: rest.kind, board: rest.board }), null, 2)
        case "count":
          return JSON.stringify({ count: ledgerCount({ cwd: rest.cwd ?? cwdOf(ctx) }) })
        default:
          // 不可达（② 枚举守门已先拒）——fail-loud 兜底（防未来变体增量 drift）
          throw new Error(`ledger：action 非法：${argPreview(action)}（取值 ∈ ${enumText(actions)}）`)
      }
    },
  }
}

/** 统一入口两变体（同名 `ledger`——depth-0 装配全量 ∥ depth>0 各角色段装配只读）。 */
export const ledgerTool = makeLedgerTool(FULL_ACTIONS, { writeFace: true })
export const ledgerReadTool = makeLedgerTool(READ_ACTIONS, { readonly: true })

// ── 旧五名弃用壳（设计档 §11.4——code 面保留、不入任何装配面） ────────────────

/** 弃用文案（含旧名 + 统一入口 + 对应 action 指引；execute 抛它 ⇒ 零库动作）。
 *  description 同文静态化——不经 `DESC`（旧五档退场后 DESC 加载必炸；壳面规避）。 */
const deprecatedLine = (old, action) => `${old} 已退役（本名不再装配）——请改用统一入口 ledger：action="${action}"（参数面与原工具相同）。`

const deprecatedShell = (old, action, readonly) => ({
  name: old,
  description: deprecatedLine(old, action),
  parameters: ACTION_SPECS[action],
  readonly,
  async execute() { throw new Error(deprecatedLine(old, action)) },
})

export const ledgerQueryTool = deprecatedShell("ledger_query", "query", true)
export const ledgerCountTool = deprecatedShell("ledger_count", "count", true)
export const ledgerAddTool = deprecatedShell("ledger_add", "add", false)
export const ledgerUpdateTool = deprecatedShell("ledger_update", "update", false)
export const ledgerCloseTool = deprecatedShell("ledger_close", "close", false)
