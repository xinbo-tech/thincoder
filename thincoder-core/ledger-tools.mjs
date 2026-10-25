/**
 * ledger-tools.mjs — 台账**统一入口** `ledger`（action 分派）+ 五旧名弃用壳 + 工具层参数守卫。
 * 自 `ledger-cmd.mjs` 拆出（2026-09-28 守卫族微修批 · 台账 #473）；2026-10-05 统一入口批
 * （台账 #923）合五工具为一：模型面恰一名 `ledger`（两变体同名单对象、schema 窄化——
 * 全量 = depth-0 五 action ∥ 只读 = depth>0 二 action）；旧五名 = code 面弃用壳（不入任何装配面）。
 * 守卫 = **声明派生**（设计档 §3.2 / §11.3：判序① 入参归一 → ② 入口级 action 判（消费 action）→
 * ③ 余键喂该 action 伪工具对象走 P2–P6——声明源 = 前身旧工具 `parameters` 逐字；helper `assertToolArgs`
 * 机制沿用，「零改」面破例 = #1006 批增布尔分支（§13.9））；判于核函数之前 ⇒ 非法入参零写、零库动作、
 * 零 SQLite 原文外泄。
 * 接线：族出口 = `ledger.mjs`（re-export——消费面 agent/family-tools.mjs；旧读二装配面已清零）；
 * 消费侧一律动态 import（`ledger-db.mjs` 静态 import node:sqlite ⇒ W8 契约②）。
 */
import { isAbsolute, dirname, join } from "node:path"
import { ledgerAdd, ledgerClose, ledgerCloseBatch, ledgerCount, ledgerQuery, ledgerUpdate, ledgerUpdateBatch } from "./ledger-cmd.mjs"
import { resolveLedgerRoot } from "./ledger-db.mjs"
import { DESC } from "./tools/shared.mjs" // #15 描述外置：文本单点 = tool-docs/ledger.md（DESC 单解析面）

/** 指针值 → 文件路径（剥 `§N` 段号；空值跳过）。 */
const ptrPath = (v) => {
  if (typeof v !== "string") return null
  const p = v.split("§")[0].trim()
  return p || null
}

/** 工具 cwd 供值面：**起点 = 动作目标路径**（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:72`
 *  「参数按用点解析——动作作用于哪个项目的路径，就取那个项目的档」）。
 *  指针（`task_book` ∥ `req_doc` ∥ `batch`）在场 ⇒ 取该文件所在目录为起点（文件 = 其所在目录）；
 *  无指针的动作（`query` ∥ `count` ∥ 首次建行）才回退会话锚。项目根由核 `resolveLedgerRoot` 推导。 */
const cwdOf = (ctx, ...ptrs) => {
  for (const raw of ptrs) {
    const p = ptrPath(raw)
    if (!p) continue
    const anchor = ctx?.agent?.cwd ?? ctx?.cwd ?? process.cwd()
    return dirname(isAbsolute(p) ? p : join(anchor, p))
  }
  return ctx?.agent?.cwd ?? ctx?.cwd ?? process.cwd()
}

/** 根推导**报明面**（设计档 §3.8「报明形态」）：向下发现（`basis === 'descendant'`——容器锚收敛序）⇒
 *  对象形回执增 `root` 键；祖先支（自明路径）⇒ `null`（展开零键——回执逐字零改）。供值面 = 核同一
 *  单源 `resolveLedgerRoot`（工具层零自算根；单实现、多调用点）。 */
const reportedRoot = (cwd) => {
  const derived = resolveLedgerRoot(cwd)
  return derived && derived.basis === "descendant" ? { root: derived.root } : null
}

// ── 工具层参数守卫（设计档 §3.2 · 2026-09-27 快车道修复 · Gitee #IKIQGK / 台账 #472） ──

/** 值预览（P1–P5 文案的 `<预览>`——设计档 §3.2）：`JSON.stringify`，超 80 字符截断加 `…`
 *  （`undefined` 无 JSON 形 ⇒ 取文本形）。 */
const argPreview = (v) => {
  const s = JSON.stringify(v) ?? String(v)
  return s.length > 80 ? `${s.slice(0, 80)}…` : s
}

/** 枚举取值域文本（P3 / P5 文案同源）。 */
const enumText = (values) => `{${values.join(", ")}}`

/** P3 后缀（声明派生）：枚举字段带取值域 / 非枚举必填串带「非空字符串」/ 数字字段仅「必填」
 *  （`domain` = 按形条件判据给出的取值域——`whenPresent.enum` 优先于基本形）。 */
const requiredSuffix = (spec, domain) => (domain ? `；取值 ∈ ${enumText(domain)}` : spec.type === "string" ? "；非空字符串" : "")

/** 值非空字段（P6 字段级：空串 / 全空白 ⇒ 拒——声明面不表达值级判据，与 `title` 同源一处）。 */
const NON_EMPTY_FIELDS = ["title", "resume_when"]

/**
 * 工具层参数守卫（设计档 §3.2 · Gitee #IKIQGK / 台账 #472）：判序 P1–P7，文案逐字 = §3.2 模板；
 * 消费工具自身声明派生（`required` / `type` / `enum` / `oneOfRequired` / `whenPresent`——枚举 / 必填 /
 * 类型 / 组判据不在守卫内复写）；只判不改（零缺省填充 / 零类型转换 / 零文本改写），返回入参对象
 * （唯一归一 = 判序① 的缺省 / `null` ⇒ `{}`）。非法 ⇒ throw——判于核函数之前（零写、零库动作）。
 * 按形条件判据（`whenPresent`）：`when` 字段在本笔入参**在场**（非 `null`）⇒ 该条生效（`required` 按
 * P3 判、`enum` 按 P5 判并取代基本形取值域）；不在场 ⇒ 本条不生效、按基本形判。
 */
function assertToolArgs(tool, args) {
  const name = tool.name
  const decl = tool.parameters ?? {}
  const props = decl.properties ?? {}
  const fields = Object.keys(props)
  // 组判据两键居声明条目顶层（不入 `parameters`——自定义键不随声明交模型 / provider）
  const conditional = tool.whenPresent ?? []
  // P1：入参缺省 / `null` ⇒ 视作 `{}`；非对象（数组 / 标量）⇒ 拒
  if (args == null) args = {}
  else if (typeof args !== "object" || Array.isArray(args)) throw new Error(`${name}：参数须为对象（收到 ${argPreview(args)}）`)
  // P2：未知键 ⇒ 拒（判序先于缺参——typo 键先给可用参数集）
  const unknown = Object.keys(args).filter((k) => !Object.hasOwn(props, k))
  if (unknown.length > 0) throw new Error(`${name}：未知参数：${unknown.join(" / ")}（可用参数 = ${fields.join(" / ")}）`)
  // P3–P6：逐字段（声明序）——缺失（必填；显式 `null` 同判）→ 类型 / 枚举 → 值非空
  for (const field of fields) {
    const spec = props[field]
    const value = args[field]
    const rule = conditional.find((c) => c.field === field && args[c.when] != null)
    const required = rule?.required ?? (decl.required ?? []).includes(field)
    const domain = rule?.enum ?? spec.enum
    if (value === undefined || value === null) {
      if (required) throw new Error(`${name}：${field} 缺失（必填${requiredSuffix(spec, domain)}）`)
      continue // 可空字段 `null` ⇒ 放行（≡ 略去——与 `patch.x ?? 行值` 既有语义同源）
    }
    if (domain) {
      if (!domain.includes(value)) throw new Error(`${name}：${field} 非法：${argPreview(value)}（取值 ∈ ${enumText(domain)}）`)
    } else if (spec.type === "string" && typeof value !== "string") {
      throw new Error(`${name}：${field} 非法：${argPreview(value)}（应为字符串）`)
    } else if (spec.type === "number" && typeof value !== "number") {
      throw new Error(`${name}：${field} 非法：${argPreview(value)}（应为数字）`)
    } else if (spec.type === "boolean" && typeof value !== "boolean") {
      throw new Error(`${name}：${field} 非法：${argPreview(value)}（应为布尔）`)
    }
    if (NON_EMPTY_FIELDS.includes(field) && typeof value === "string" && value.trim() === "") {
      throw new Error(`${name}：${field} 为空（${required ? "必填；" : ""}非空字符串）`)
    }
  }
  // P7：组判据（声明派生 `oneOfRequired`）——组内恰携其一 ⇒ 过；同携 / 双缺 ⇒ 拒
  for (const group of tool.oneOfRequired ?? []) {
    if (group.filter((f) => args[f] != null).length === 1) continue
    const received = Object.fromEntries(group.map((f) => [f, args[f] ?? null]))
    throw new Error(`${name}：${group.join(" ∥ ")} 须恰携其一（收到 ${argPreview(received)}）`)
  }
  return args
}

// ── 统一入口（设计档 §11.2 / §11.3） ─────────────────────────────────────────

/** action 枚举（全量 / 只读两变体；顺序 = 文档与按钮序）。 */
const FULL_ACTIONS = ["add", "update", "close", "query", "count"]
const READ_ACTIONS = ["query", "count"]

/** cwd 参数描述（五前身声明同文——文本单点）。 */
const CWD_DESC = "本次动作的目标路径——项目根由它推导：沿祖先链最近的项目目录（带 PROJECT-MANIFEST.json 或已有台账库）；容器目录下收敛到子项目。台账按项目根关联存储于用户数据目录（工作树外、不进 git）。相对路径按当前工作目录解析；查/写别的项目请给绝对路径。缺省 = 当前会话锚"

/** 各 action 声明条目（= 前身旧工具 `parameters` 逐字；伪工具对象守卫 + 弃用壳共用单源）。
 *  `parameters` 内的键 = 交模型 / provider 的那一份声明；**组判据两键（`oneOfRequired` / `whenPresent`）
 *  居本条条目顶层、不入 `parameters`**——自定义键不随声明外泄（provider 面零风险），守卫仍只读声明。 */
const ACTION_SPECS = {
  add: {
    parameters: {
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
        resume_when: { type: "string", description: "复启条件句（可空；`trigger=条件` 行的一句话条件 + 可选锚 `@YYYY-MM-DD` ∥ `@事件件名`）——值非空：空串 / 全空白 ⇒ 拒" },
      },
      additionalProperties: false,
    },
  },
  update: {
    parameters: {
      type: "object",
      properties: {
        cwd: { type: "string", description: CWD_DESC },
        id: { type: "number", description: "条目 id（与 batch 恰携其一）" },
        batch: { type: "string", description: "批档指针（与 id 恰携其一）——批级批量：一次结算该批的行；携 status ⇒ 逐行按迁移表重判，不携 status ⇒ 纯字段补丁（status 零写）" },
        status: { type: "string", enum: ["待讨论", "待设计", "在途", "待核销", "已核销", "已废弃"], description: "目标状态（六态之一，缺省 = 不变）" },
        title: { type: "string", description: "标题（缺省 = 不变）" },
        board: { type: "string", description: "归属板块（缺省 = 不变）" },
        req_doc: { type: "string", description: "需求档指针（缺省 = 不变）" },
        task_book: { type: "string", description: "任务书指针（缺省 = 不变）" },
        evidence: { type: "string", description: "证据（缺省 = 不变；传入 = 追加——旧值非空 ⇒ 拼 `旧｜新`（「｜」零空格）、旧空直写；新值全空白 ⇒ 拒；覆盖 = 与 `evidenceReplace: true` 同传）" },
        evidenceReplace: { type: "boolean", description: "覆盖旗（布尔）：与 evidence 同传 = 整段替换（旧文零保留）；缺省 / false = 追加；旗独传（无新文）⇒ 拒" },
        trigger: { type: "string", enum: ["归批", "条件", "认账不排期"], description: "触发（缺省 = 不变）" },
        resume_when: { type: "string", description: "复启条件句（缺省 = 不变；值非空——空串 / 全空白 ⇒ 拒）" },
        executor: { type: "string", description: "执行者 sessionId（可选——接手改写归属用；缺省 = 按状态迁移语义：进入待设计 / 在途自动写本会话；出在途 / 撤回清空）" },
      },
      additionalProperties: false,
    },
    oneOfRequired: [["id", "batch"]],
  },
  close: {
    parameters: {
      type: "object",
      required: ["status"],
      properties: {
        cwd: { type: "string", description: CWD_DESC },
        id: { type: "number", description: "条目 id（与 batch 恰携其一）" },
        batch: { type: "string", description: "批档指针（与 id 恰携其一）——批级批量结算：只销已到 待核销 的行；待讨论 / 待设计 点名跳过（追认核销不入批量面）" },
        status: { type: "string", enum: ["已核销", "已废弃"], description: "目标态（勾销 / 追认核销 / 撤回）——携 batch 时可不给（缺省 = 勾销单值），给了只能是 已核销" },
        evidence: { type: "string", description: "最小证据行（可选；传入 = 追加缺省——旧值非空 ⇒ 拼 `旧｜新`（「｜」零空格）、旧空直写；新值全空白 ⇒ 拒；覆盖 = 与 `evidenceReplace: true` 同传。追认核销面判结果值须非空：缺 / 全空白 ⇒ 拒）" },
        evidenceReplace: { type: "boolean", description: "覆盖旗（布尔）：与 evidence 同传 = 整段替换（旧文零保留）；缺省 / false = 追加；旗独传（无新文）⇒ 拒" },
      },
      additionalProperties: false,
    },
    oneOfRequired: [["id", "batch"]],
    whenPresent: [{ when: "batch", field: "status", required: false, enum: ["已核销"] }],
  },
  query: {
    parameters: {
      type: "object",
      properties: {
        cwd: { type: "string", description: CWD_DESC },
        status: { type: "string", enum: ["待讨论", "待设计", "在途", "待核销", "已核销", "已废弃"], description: "按状态过滤（六态之一，缺省 = 不过滤）" },
        kind: { type: "string", enum: ["requirement", "tech_todo"], description: "按类别过滤" },
        board: { type: "string", description: "按归属板块过滤（需求档文档名）" },
        trigger: { type: "string", enum: ["归批", "条件", "认账不排期"], description: "按技术待办触发过滤（三枚举，缺省 = 不过滤——无触发（NULL）不过滤）" },
        task_book: { type: "string", description: "按任务书指针过滤（原值等值——批→行反查；缺省 = 不过滤）" },
      },
      additionalProperties: false,
    },
  },
  count: {
    parameters: {
      type: "object",
      properties: {
        cwd: { type: "string", description: CWD_DESC },
        task_book: { type: "string", description: "按任务书指针过滤（原值等值）" },
      },
      additionalProperties: false,
    },
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
    evidence: { type: "string", description: "最小证据行（add 可空；update / close 传入 = 追加缺省——旧空直写、旧非空拼 `旧｜新`（「｜」零空格）、新值全空白 ⇒ 拒；覆盖 = 与 `evidenceReplace: true` 同传；update 缺省 = 不变 / close 缺省 = 判行值；追认核销须非空）" },
    evidenceReplace: { type: "boolean", description: "覆盖旗（布尔）：与 evidence 同传 = 整段替换；缺省 / false = 追加；旗独传（无新文）⇒ 拒（update / close）" },
    trigger: { type: "string", enum: ["归批", "条件", "认账不排期"], description: "技术待办触发（add / update 可空 / query 过滤）" },
    resume_when: { type: "string", description: "复启条件句（add / update 可空；值非空——空串 / 全空白 ⇒ 拒；`trigger=条件` 行的一句话条件 + 可选锚 `@YYYY-MM-DD` ∥ `@事件件名`）" },
    id: { type: "number", description: "条目 id（update / close：与 batch 恰携其一）" },
    batch: { type: "string", description: "批档指针（update / close：与 id 恰携其一）——批级批量：一次结算该批的行（update 携 status ⇒ 逐行迁移表重判；不携 status ⇒ 纯字段补丁；close 只销 待核销 行、status 可空）" },
    status: { type: "string", enum: ["待讨论", "待设计", "在途", "待核销", "已核销", "已废弃"], description: "状态（单行 close 必填 ∈ {已核销, 已废弃}；close 携 batch 时可空、给了只能是 已核销；update 迁移 / query 过滤——六态之一）" },
    executor: { type: "string", description: "执行者 sessionId（update 可选——接手改写归属；缺省 = 按状态迁移语义：进入待设计 / 在途自动写本会话；出在途 / 撤回清空）" },
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
      // ③ 余键喂该 action 伪工具对象（声明源 = 前身工具 parameters 逐字——`action` 键不入 P2 域；
      //   组判据两键在条目顶层，与 `parameters` 同送守卫）
      const spec = ACTION_SPECS[action]
      const rest = assertToolArgs({ name: `ledger(${action})`, ...spec }, rest0)
      // ④ 路由既有核函数（包装细节携自原工具 execute 逐字保留：cwd 缺省 / JSON 缩进 / getSessionId 动态 import）
      switch (action) {
        case "add": {
          const { cwd, ...row } = rest
          const target = cwd ?? cwdOf(ctx, row.task_book, row.req_doc)
          const id = ledgerAdd({ cwd: target, row })
          return JSON.stringify({ id, status: "待讨论", ...reportedRoot(target) })
        }
        case "update": {
          const { cwd, id, batch, ...patch } = rest
          const target = cwd ?? cwdOf(ctx, batch, patch.task_book, patch.req_doc)
          let executorSessionId
          if (patch.executor == null) {
            // 显式 `null` ≡ 略去（§3.1 `null` 口径 · #474——与缺省同分支）；动态 import——零新静态边（K-LX1）
            const { getSessionId } = await import("./session-slots.mjs")
            executorSessionId = getSessionId()
          }
          // 批级批量（§3.3）——`batch` 与 `id` 恰携其一（守卫 P7 已先裁）
          if (batch != null) return JSON.stringify({ ...ledgerUpdateBatch({ cwd: target, batch, patch, executorSessionId }), ...reportedRoot(target) })
          return JSON.stringify({ ...ledgerUpdate({ cwd: target, id, patch, executorSessionId }), ...reportedRoot(target) })
        }
        case "close": {
          const target = rest.cwd ?? cwdOf(ctx, rest.batch, rest.task_book)
          // 批级批量结算（§3.3——勾销径）
          if (rest.batch != null) return JSON.stringify({ ...ledgerCloseBatch({ cwd: target, batch: rest.batch, evidence: rest.evidence, evidenceReplace: rest.evidenceReplace }), ...reportedRoot(target) })
          return JSON.stringify({ ...ledgerClose({ cwd: target, id: rest.id, status: rest.status, evidence: rest.evidence, evidenceReplace: rest.evidenceReplace }), ...reportedRoot(target) })
        }
        case "query":
          return JSON.stringify(ledgerQuery({ cwd: rest.cwd ?? cwdOf(ctx, rest.task_book), status: rest.status, kind: rest.kind, board: rest.board, trigger: rest.trigger, task_book: rest.task_book }), null, 2)
        case "count": {
          const target = rest.cwd ?? cwdOf(ctx, rest.task_book)
          return JSON.stringify({ ...ledgerCount({ cwd: target, task_book: rest.task_book }), ...reportedRoot(target) })
        }
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
  parameters: ACTION_SPECS[action].parameters,
  readonly,
  async execute() { throw new Error(deprecatedLine(old, action)) },
})

export const ledgerQueryTool = deprecatedShell("ledger_query", "query", true)
export const ledgerCountTool = deprecatedShell("ledger_count", "count", true)
export const ledgerAddTool = deprecatedShell("ledger_add", "add", false)
export const ledgerUpdateTool = deprecatedShell("ledger_update", "update", false)
export const ledgerCloseTool = deprecatedShell("ledger_close", "close", false)
