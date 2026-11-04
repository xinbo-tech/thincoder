/**
 * team-ledger.mjs — 团队台账核工具 `team_ledger`（端侧面单源；`docs/core/design/TEAM-LEDGER.md` §2——三端同 import，
 * 2026-10-13 team-ledger 批）。
 *
 * 面：① 工具声明（五 action——depth-0 全量 ∥ 子代理只读变体；两变体同名单对象、schema 窄化；写三 action 于
 * 只读变体 schema 级不可达——D-TL5）；② 仓标记派生（会话项目根 ⇒ `git rev-parse --show-toplevel` ⇒
 * `git config --get remote.origin.url` ⇒ **原文**上送 ⇒ 服务端归一——KD-SV-144/D-TL3；端侧零归一实现）；
 * ③ 登录态门（`teamStatus().loggedIn` 判据单源——D-TL4；未登录 ⇒ 明示 + **零网络调用**）；④ 传输（直接
 * `fetch` + Bearer `team.token` + 超时——沿 `team.mjs` 现形；零第三方 ∥ 零持久化 ∥ 零缓存回读——需求 ③④）。
 *
 * 接线（`agent/family-tools.mjs` 动态 import——沿 `ledgerTool`/`ledgerReadTool` 同位；`W8 契约②` 同律）。
 * 零 import 本机台账模块（KD-SV-145/D-TL2——上送 = 本工具 + 本机 ledger 两步显式动作，零跨账代码路径）。
 */
import { execFileSync } from "node:child_process"
import { loadConfig } from "./config.mjs"
import { teamStatus } from "./team.mjs"
import { DESC } from "./tools/shared.mjs"

/** 请求超时（同 `team.mjs` `TEAM_FETCH_TIMEOUT_MS` 现值——该常量未导出（`team.mjs` ±0 面），两处同值即口径）。 */
const TEAM_FETCH_TIMEOUT_MS = 15_000

/** action 枚举（全量 / 只读两变体；顺序 = 文档与按钮序）。 */
const FULL_ACTIONS = ["query", "count", "add", "update", "close"]
const READ_ACTIONS = ["query", "count"]

/** 六态（服务端 CHECK 同集——ledger/LEDGER.md §3）。 */
const STATUSES = ["待讨论", "待设计", "在途", "待核销", "已核销", "已废弃"]

/** 工具 cwd 供值面（零进程缺省：`ctx.agent.cwd` > `ctx.cwd`；两者皆无 ⇒ 当场失败，不落 `process.cwd()`）。 */
const cwdOf = (ctx) => ctx?.agent?.cwd ?? ctx?.cwd

// ── 仓标记派生（§2.2） ───────────────────────────────────────────────────────

/** git 读取面（缺省 = 真 git；失败 ⇒ `null`——allowFail 口径）。 */
function realGitRun(cwd, args) {
  try {
    return String(execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 })).trim()
  } catch {
    return null
  }
}

let gitRun = realGitRun

/** 测试注入：假 git 面（缺省 / 传非函数 ⇒ 复位真 git）。 */
export function _setGitRunnerForTest(fn) {
  gitRun = typeof fn === "function" ? fn : realGitRun
}

/** 仓标记派生（§2.2 三步）：会话项目根 ⇒ `rev-parse --show-toplevel` ⇒ `config --get remote.origin.url`；
 *  无 git 仓 ∥ 无 origin ⇒ `null`（**原文**返回——归一在服务端）。出 = origin 原文 ∥ null。 */
export function deriveRepo(cwd) {
  const root = gitRun(cwd, ["rev-parse", "--show-toplevel"])
  if (root === null || root === "") return null
  const url = gitRun(root, ["config", "--get", "remote.origin.url"])
  if (url === null || url === "") return null
  return url
}

/** 派生出词（无仓 / 无 origin ⇒ 明示失败——判于网络前，零请求零写库）。 */
function deriveRepoOrFail(cwd) {
  const repo = deriveRepo(cwd)
  if (repo === null) throw new Error("未检出 git 源（origin）——团队账按 git 源记账")
  return repo
}

// ── 传输（§2.4——沿 teamVerify 现形） ────────────────────────────────────────

/** 请求：`<server>/api/client/ledger*` + `Authorization: Bearer <team.token>` + 超时。出 = JSON 体。
 *  401 ⇒ 「登录已失效」（端侧零清盘——沿 `teamVerify` 三值口径）∥ 网络失败 ⇒ 「服务器不可达」（零缓存回读）
 *  ∥ 其余非 2xx ⇒ 服务端人话透传（400/403/404——错误形零新码）。 */
async function request(server, token, method, path, body = null) {
  let res
  try {
    res = await fetch(`${server}${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(body === null ? {} : { "content-type": "application/json" }) },
      ...(body === null ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(TEAM_FETCH_TIMEOUT_MS),
    })
  } catch {
    throw new Error("服务器不可达——团队账不可用（零离线缓存）")
  }
  const text = await res.text().catch(() => "")
  if (res.status === 401) throw new Error("登录已失效——请重新登录")
  let payload = null
  try {
    payload = JSON.parse(text)
  } catch {
    payload = null
  }
  if (!res.ok) {
    const message = payload?.error?.message
    throw new Error(typeof message === "string" && message !== "" ? message : `团队账请求失败（HTTP ${res.status}）`)
  }
  if (payload === null || typeof payload !== "object") throw new Error("团队账响应形非法（非 JSON 对象）——服务不符合预期面")
  return payload
}

// ── 工具层参数守卫（沿 `ledger` 工具面先例——声明派生；判于网络前，非法 ⇒ 零请求） ──

/** 值预览（文案的 `<预览>`）：`JSON.stringify`，超 80 字符截断加 `…`。 */
const argPreview = (v) => {
  const s = JSON.stringify(v) ?? String(v)
  return s.length > 80 ? `${s.slice(0, 80)}…` : s
}

/** 枚举取值域文本。 */
const enumText = (values) => `{${values.join(", ")}}`

/** 参数守卫（P1–P5：入参形 → 未知键 → 缺失（必填）→ 枚举 / 类型——只判不改）。 */
function assertArgs(name, decl, args) {
  const props = decl?.properties ?? {}
  const fields = Object.keys(props)
  if (args == null) args = {}
  else if (typeof args !== "object" || Array.isArray(args)) throw new Error(`${name}：参数须为对象（收到 ${argPreview(args)}）`)
  const unknown = Object.keys(args).filter((key) => !Object.hasOwn(props, key))
  if (unknown.length > 0) throw new Error(`${name}：未知参数：${unknown.join(" / ")}（可用参数 = ${fields.join(" / ")}）`)
  for (const field of fields) {
    const spec = props[field]
    const value = args[field]
    if (value === undefined || value === null) {
      if ((decl.required ?? []).includes(field)) {
        const suffix = spec.enum ? `；取值 ∈ ${enumText(spec.enum)}` : spec.type === "string" ? "；非空字符串" : ""
        throw new Error(`${name}：${field} 缺失（必填${suffix}）`)
      }
      continue
    }
    if (spec.enum) {
      if (!spec.enum.includes(value)) throw new Error(`${name}：${field} 非法：${argPreview(value)}（取值 ∈ ${enumText(spec.enum)}）`)
    } else if (spec.type === "string" && typeof value !== "string") {
      throw new Error(`${name}：${field} 非法：${argPreview(value)}（应为字符串）`)
    } else if (spec.type === "number" && typeof value !== "number") {
      throw new Error(`${name}：${field} 非法：${argPreview(value)}（应为数字）`)
    }
  }
  return args
}

/** 各 action 声明条目（= 参数并集按 action 收窄的单源；schema 与守卫同源）。 */
const SCOPE_DESC = `"repo"（缺省——当前仓，自动派生）∥ "team"（全队跨仓）`
const ACTION_SPECS = {
  query: {
    type: "object",
    properties: {
      scope: { type: "string", enum: ["repo", "team"], description: SCOPE_DESC },
      status: { type: "string", enum: STATUSES, description: "按状态过滤（六态之一，缺省 = 不过滤）" },
      owner: { type: "string", description: "按负责人过滤（用户名精确匹配）" },
    },
    additionalProperties: false,
  },
  count: {
    type: "object",
    properties: {
      scope: { type: "string", enum: ["repo", "team"], description: SCOPE_DESC },
      status: { type: "string", enum: STATUSES, description: "按状态过滤（六态之一，缺省 = 不过滤）" },
      owner: { type: "string", description: "按负责人过滤（用户名精确匹配）" },
    },
    additionalProperties: false,
  },
  add: {
    type: "object",
    required: ["title"],
    properties: {
      title: { type: "string", description: "标题（必填——trim 非空 ∥ ≤200）" },
      detail: { type: "string", description: "正文（可空 ∥ ≤4000）" },
      owner: { type: "string", description: "负责人（缺省 = 自己）" },
    },
    additionalProperties: false,
  },
  update: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "number", description: "条目编号（全局）" },
      title: { type: "string", description: "标题（缺省 = 不变）" },
      detail: { type: "string", description: "正文（缺省 = 不变）" },
      owner: { type: "string", description: "负责人（交接 = 换负责人；缺省 = 不变）" },
      status: { type: "string", enum: STATUSES, description: "目标状态（迁移表合法后继——非法由服务端 400）" },
    },
    additionalProperties: false,
  },
  close: {
    type: "object",
    required: ["id", "status"],
    properties: {
      id: { type: "number", description: "条目编号（全局）" },
      status: { type: "string", enum: ["已核销", "已废弃"], description: "目标态（收口 / 撤回）" },
    },
    additionalProperties: false,
  },
}

/** 并集 schema（`action` 枚举 + 五 action 参数并集；per-action 必填 / 收窄由运行时守卫裁）。 */
const UNION_PARAMETERS = {
  type: "object",
  required: ["action"],
  properties: {
    action: { type: "string", enum: FULL_ACTIONS, description: "" }, // 变体构造时填描述
    scope: { type: "string", enum: ["repo", "team"], description: SCOPE_DESC },
    status: { type: "string", enum: STATUSES, description: "状态（query ∥ count 过滤——六态之一；update 目标态——迁移表合法后继；close ∈ {已核销, 已废弃}）" },
    owner: { type: "string", description: "负责人（query ∥ count 过滤——用户名精确匹配；add ∥ update 设值）" },
    title: { type: "string", description: "标题（add 必填 ∥ update 可改——trim 非空 ∥ ≤200）" },
    detail: { type: "string", description: "正文（add ∥ update——可空 ∥ ≤4000）" },
    id: { type: "number", description: "条目编号（update ∥ close 必填——全局编号）" },
  },
  additionalProperties: false,
}

/** 变体构造（同名单对象、schema 窄化、两形永不同装配——先例 = `ledger` 工具 depth 面变体）。 */
function makeTeamLedgerTool(actions, { readonly = false, writeFace = false } = {}) {
  return {
    name: "team_ledger",
    description: DESC("team_ledger"), // 文本单点 = tool-docs/team_ledger.md（DESC 加载面）
    parameters: {
      ...UNION_PARAMETERS,
      properties: {
        ...UNION_PARAMETERS.properties,
        action: {
          ...UNION_PARAMETERS.properties.action,
          enum: actions,
          description: writeFace ? "操作（五值）：query 查询 / count 计数 / add 新增 / update 更新 / close 收口或撤回——写三仅主 agent 装配面" : "操作（只读二值）：query 查询 / count 计数",
        },
      },
    },
    readonly,
    isReadonlyAction(args) { return READ_ACTIONS.includes(args?.action) },
    async execute(args, ctx) {
      if (args == null) args = {}
      else if (typeof args !== "object" || Array.isArray(args)) throw new Error(`team_ledger：参数须为对象（收到 ${argPreview(args)}）`)
      const { action, ...rest0 } = args
      assertArgs("team_ledger", { properties: { action: { type: "string", enum: actions } }, required: ["action"] }, { action })
      const rest = assertArgs(`team_ledger(${action})`, ACTION_SPECS[action], rest0)
      // 登录态门（D-TL4——判据单源 = teamStatus().loggedIn；未登录 ⇒ 明示 + 零网络调用）
      const status = teamStatus()
      if (!status.loggedIn || status.server === null) throw new Error("未登录——团队账不可用（本机台账照常）；请先登录")
      const token = loadConfig().team?.token // token 取值面（状态读面不下发 token——TEAM.md §2.1）
      const server = status.server
      const cwd = cwdOf(ctx)
      switch (action) {
        case "query": {
          const payload = await request(server, token, "GET", `/api/client/ledger${queryOf(rest, cwd)}`)
          return JSON.stringify(payload, null, 2)
        }
        case "count": {
          const payload = await request(server, token, "GET", `/api/client/ledger${queryOf(rest, cwd)}`)
          return JSON.stringify({ count: payload.total })
        }
        case "add": {
          const repo = deriveRepoOrFail(cwd)
          const payload = await request(server, token, "POST", "/api/client/ledger", { repo, title: rest.title, detail: rest.detail, owner: rest.owner })
          return JSON.stringify(payload, null, 2)
        }
        case "update": {
          const payload = await request(server, token, "PATCH", `/api/client/ledger/${encodeURIComponent(String(rest.id))}`, { title: rest.title, detail: rest.detail, owner: rest.owner, status: rest.status })
          return JSON.stringify(payload, null, 2)
        }
        case "close": {
          const payload = await request(server, token, "POST", `/api/client/ledger/${encodeURIComponent(String(rest.id))}/close`, { status: rest.status })
          return JSON.stringify(payload, null, 2)
        }
        default:
          // 不可达（入口枚举守门已先拒）——fail-loud 兜底（防未来变体增量 drift）
          throw new Error(`team_ledger：action 非法：${argPreview(action)}（取值 ∈ ${enumText(actions)}）`)
      }
    },
  }
}

/** 查询串装配（§2.1）：`scope = "repo"`（缺省）⇒ 派生当前仓（无源 ⇒ 明示失败）∥ `"team"` ⇒ 不带 `repo`。 */
function queryOf(rest, cwd) {
  const params = new URLSearchParams()
  if ((rest.scope ?? "repo") === "repo") params.set("repo", deriveRepoOrFail(cwd))
  if (rest.status != null) params.set("status", rest.status)
  if (rest.owner != null) params.set("owner", rest.owner)
  const text = params.toString()
  return text === "" ? "" : `?${text}`
}

/** 统一入口两变体（同名 `team_ledger`——depth-0 装配全量 ∥ depth>0 各角色段装配只读）。 */
export const teamLedgerTool = makeTeamLedgerTool(FULL_ACTIONS, { writeFace: true })
export const teamLedgerReadTool = makeTeamLedgerTool(READ_ACTIONS, { readonly: true })
