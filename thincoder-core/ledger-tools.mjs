/**
 * ledger-tools.mjs — 台账五工具定义（查询二 = 只读全角色 / 写三 = 仅主 agent 装配）+ 工具层参数守卫。
 * 自 `ledger-cmd.mjs` 拆出（2026-09-28 守卫族微修批 · 台账 #473——纯搬移、语义零变；核函数留原档）。
 * 守卫 = **声明派生**（设计档 §3.2：枚举 / 必填 / 类型取自工具自身 `parameters`，不在守卫内复写——
 * D2「声明即校验」）；判于核函数之前 ⇒ 非法入参零写、零库动作、零 SQLite 原文外泄。读面二具同拍
 * （#473：非法过滤参数 ⇒ 拒——不再「静默空集 / 绑原文」）。
 * 接线：族出口 = `ledger.mjs`（re-export——消费面 tools/index.mjs · agent/family-tools.mjs 零改）；
 * 消费侧一律动态 import `ledger.mjs`（ledger-db.mjs 静态 import node:sqlite ⇒ W8 契约②）。
 */
import { ledgerAdd, ledgerClose, ledgerCount, ledgerQuery, ledgerUpdate } from "./ledger-cmd.mjs"
import { DESC } from "./tools/shared.mjs" // #15 描述外置：文本单点 = tool-docs/ledger_*.md（DESC 单解析面）

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

// ── 工具定义（接线：查询 → tools/index.mjs 全角色面；写 → family-tools.mjs depthOnly 分支） ──

export const ledgerQueryTool = {
  name: "ledger_query",
  description: DESC("ledger_query"), // #15 外置：文本单点 = tool-docs/ledger_query.md（两池词表逐字保留）
  parameters: {
    type: "object",
    properties: {
      cwd: { type: "string", description: "项目根目录——台账按项目根关联存储于用户数据目录（工作树外、不进 git）。相对路径按当前工作目录解析；查/写别的项目请给绝对路径。缺省 = 当前会话项目根" },
      status: { type: "string", enum: ["待讨论", "待设计", "在途", "待核销", "已核销", "已废弃"], description: "按状态过滤（六态之一，缺省 = 不过滤）" },
      kind: { type: "string", enum: ["requirement", "tech_todo"], description: "按类别过滤" },
      board: { type: "string", description: "按归属板块过滤（需求档文档名）" },
    },
    additionalProperties: false,
  },
  readonly: true,
  async execute(args, ctx) {
    args = assertToolArgs(ledgerQueryTool, args)
    return JSON.stringify(ledgerQuery({ cwd: args.cwd ?? cwdOf(ctx), status: args.status, kind: args.kind, board: args.board }), null, 2)
  },
}

export const ledgerCountTool = {
  name: "ledger_count",
  description: DESC("ledger_count"), // #15 外置：文本单点 = tool-docs/ledger_count.md
  parameters: {
    type: "object",
    properties: { cwd: { type: "string", description: "项目根目录——台账按项目根关联存储于用户数据目录（工作树外、不进 git）。相对路径按当前工作目录解析；查/写别的项目请给绝对路径。缺省 = 当前会话项目根" } },
    additionalProperties: false,
  },
  readonly: true,
  async execute(args, ctx) {
    args = assertToolArgs(ledgerCountTool, args)
    return JSON.stringify({ count: ledgerCount({ cwd: args.cwd ?? cwdOf(ctx) }) })
  },
}

export const ledgerAddTool = {
  name: "ledger_add",
  description: DESC("ledger_add"), // #15 外置：文本单点 = tool-docs/ledger_add.md（两池词表逐字保留）
  parameters: {
    type: "object",
    required: ["kind", "title"],
    properties: {
      cwd: { type: "string", description: "项目根目录——台账按项目根关联存储于用户数据目录（工作树外、不进 git）。相对路径按当前工作目录解析；查/写别的项目请给绝对路径。缺省 = 当前会话项目根" },
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
  readonly: false,
  async execute(args, ctx) {
    args = assertToolArgs(ledgerAddTool, args)
    const { cwd, ...row } = args
    const id = ledgerAdd({ cwd: cwd ?? cwdOf(ctx), row })
    return JSON.stringify({ id, status: "待讨论" })
  },
}

export const ledgerUpdateTool = {
  name: "ledger_update",
  description: DESC("ledger_update"), // #15 外置：文本单点 = tool-docs/ledger_update.md
  parameters: {
    type: "object",
    required: ["id"],
    properties: {
      cwd: { type: "string", description: "项目根目录——台账按项目根关联存储于用户数据目录（工作树外、不进 git）。相对路径按当前工作目录解析；查/写别的项目请给绝对路径。缺省 = 当前会话项目根" },
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
  readonly: false,
  async execute(args, ctx) {
    args = assertToolArgs(ledgerUpdateTool, args)
    const { cwd, id, ...patch } = args
    let executorSessionId
    if (patch.executor == null) {
      // 显式 `null` ≡ 略去（§3.1 `null` 口径 · #474——与缺省同分支）；动态 import——零新静态边（K-LX1）；
      // 工具层供值，核心函数保持参数注入纯函数
      const { getSessionId } = await import("./session-slots.mjs")
      executorSessionId = getSessionId()
    }
    return JSON.stringify(ledgerUpdate({ cwd: cwd ?? cwdOf(ctx), id, patch, executorSessionId }))
  },
}

export const ledgerCloseTool = {
  name: "ledger_close",
  description: DESC("ledger_close"), // #15 外置：文本单点 = tool-docs/ledger_close.md
  parameters: {
    type: "object",
    required: ["id", "status"],
    properties: {
      cwd: { type: "string", description: "项目根目录——台账按项目根关联存储于用户数据目录（工作树外、不进 git）。相对路径按当前工作目录解析；查/写别的项目请给绝对路径。缺省 = 当前会话项目根" },
      id: { type: "number", description: "条目 id" },
      status: { type: "string", enum: ["已核销", "已废弃"], description: "目标态（勾销 / 追认核销 / 撤回）" },
    },
    additionalProperties: false,
  },
  readonly: false,
  async execute(args, ctx) {
    args = assertToolArgs(ledgerCloseTool, args)
    return JSON.stringify(ledgerClose({ cwd: args.cwd ?? cwdOf(ctx), id: args.id, status: args.status }))
  },
}
