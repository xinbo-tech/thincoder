/**
 * team.mjs — 团队登录机制（TEAM.md §2——三端共用单源：CLI ∥ VSC ∥ 桌面同 import）。
 *
 * 面：登录 ∥ 退出 ∥ 登录态读面 ∥ 活校验（`teamVerify`——只读三值，登录面补全批增）∥ 端标签（自动生成）∥
 * 派生 provider 条目（登录写入 / 退出停用）∥ 服务地址归一 ∥ 失败分类。**写面单源** = 本档（`writeConfigAtomic`
 * 一次 mutate——经 `persistRaw`；端侧零自写盘，三端同源）——`teamVerify` **只读**（零写盘、零状态）。
 *
 * 形（TEAM.md §2.1）：顶层 `team` 段 `{ server, member{username,name}, label, token }`——`token` 在场 ⇔
 * 已登录（权威源；不入 `DEFAULTS`）；派生条目 `{ name:"team", baseURL:"<server>/v1", apiKey:"<token>",
 * derived:true }` —— 登录 upsert（有则更新 ∥ 无则追加 `providers[]` 表尾——不劫持既有回退序）；退出 =
 * 摘 `token` ∥ 摘 `apiKey`（条目与 `derived` 保留——重登自动恢复）。同名手工条目 ⇒ 登录成但不覆盖
 * （D-TM4——返回提示码）。
 *
 * 返回形（B1 批端侧契约——父侧裁定 2026-10-10）：
 *   `teamLogin`  ⇒ `{ ok:true, notice?:"manual-name-conflict" }` ∥ `{ ok:false, reason }`
 *   `teamLogout` ⇒ `{ ok:true, revokeDelivered:boolean }` ∥ `{ ok:false, reason }`
 *   `reason` 取值域：`network`（不可达 ∥ DNS/TLS ∥ 超时 ∥ 非 401/429 应答——服务不符合预期面）∥
 *   `credentials`（401——同措辞）∥ `rate_limited`（429——锁定期）∥ `write_failed`（服务端已应答、本地
 *   写盘失败——mtime 冲突 ∥ 畸形档拒写）。`notice` 携**码**不携文（文本归端侧 i18n）；
 *   `revokeDelivered:false` = 服务端吊销未达（网络失败——本地照清）。
 */
import { hostname } from "node:os"

import { loadConfig } from "./config.mjs"
import { persistRaw } from "./config-io.mjs"
import { sessionEnd } from "./session-slots.mjs"

/** 派生 provider 条目固定名（TEAM.md §2.1 ∥ PROVIDER.md §6.25）。 */
const TEAM_PROVIDER_NAME = "team"

/** 端标签总长上限（= key 名称上限——accounts/ACCOUNTS.md §1.1；自动生成超长 ⇒ 裁剪）。 */
const LABEL_MAX = 40

/** 登录/退出请求超时（毫秒）——超时归 `network` 分类（防悬挂）。 */
const TEAM_FETCH_TIMEOUT_MS = 15_000

/** 登录提示码：同名手工 provider 存在 ⇒ 派生条目未写（不覆盖——D-TM4；端侧就地提示）。 */
export const NOTICE_MANUAL_NAME_CONFLICT = "manual-name-conflict"

/** 写入口根形守卫：`writeConfigAtomic` 不校验根形——数组 ∥ 非对象根会让 mutate 落空（`JSON.stringify` 丢弃
 *  非索引属性——写回原文）⇒ 假「已写」；本档 0 值 = 不产出假成功 ⇒ 拒写（上层归一 `write_failed`）。 */
function assertWritableRoot(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) throw new Error("config 根非对象——拒写")
}

/** 服务地址归一（TEAM.md §2.1 ∥ 用例 E2）：去首尾空白；缺协议补 `http://`；去尾斜杠；尾 `/v1` 去。 */
export function normalizeTeamServer(server) {
  let text = typeof server === "string" ? server.trim() : ""
  if (text === "") return null
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) text = `http://${text}` // 缺协议补 http://
  text = text.replace(/\/+$/, "")     // 去尾斜杠
  text = text.replace(/\/v1$/i, "")   // 尾 `/v1` 去（粘贴 OpenAI 形基址）
  text = text.replace(/\/+$/, "")
  return /^[a-z][a-z0-9+.-]*:\/\/.+/i.test(text) ? text : null // 纯协议（空 host）⇒ 无效
}

/** 端标签自动生成（D-TM5）：`端名@主机名`（端名 = 进程端名缝——`sessionEnd()`，cli/vscode/desktop）；
 *  总长 ≤40 裁剪。零输入字段（表单无标签项）。 */
export function defaultTeamLabel() {
  let host = ""
  try {
    host = hostname() // os.hostname 失败面兜底（不阻登录）
  } catch {
    host = ""
  }
  return `${sessionEnd()}@${host}`.slice(0, LABEL_MAX)
}

/** 登录态读面（桌面 `team:status` ∥ VSC `teamStatus` 投影源）：`loggedIn` ⇔ `team.token` 在场。 */
export function teamStatus() {
  const team = loadConfig().team
  return {
    loggedIn: Boolean(team?.token),
    server: team?.server ?? null,
    member: team?.member ?? null,
    label: team?.label ?? null,
  }
}

/**
 * 登录态**活校验**（TEAM.md §2.6 ∥ 登录面补全批 · 2026-10-10 · 台账 #1231——本批新增）：`GET <server>/api/client/me`
 * （Bearer = `team.token`）⇒ **三值闭集**：`{ state: "valid" }`（200——token 有效）∥ `{ state: "invalid" }`（401——
 * 被吊销 ∥ 无效）∥ `{ state: "unreachable" }`（网络不可达 ∥ 其他非 401 失败——**不判失效**：离线容忍）。
 * **只读**——零写盘、零状态（调用面持结果）；零周期轮询（触发点制 = 启动一次 ∥ 登/退面开合 ∥ CLI `/team status`）。
 * token ∥ 地址缺席（未登录 ∥ 畸形档）⇒ `unreachable`（无从校验——不假报失效；端侧未登录面零调本函数）。
 */
export async function teamVerify() {
  const team = loadConfig().team
  const token = typeof team?.token === "string" && team.token !== "" ? team.token : null
  const server = typeof team?.server === "string" && team.server !== "" ? team.server : null
  if (token === null || server === null) return { state: "unreachable" }
  let res
  try {
    res = await fetch(`${server}/api/client/me`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TEAM_FETCH_TIMEOUT_MS),
    })
  } catch {
    return { state: "unreachable" } // 不可达 ∥ DNS ∥ TLS ∥ 超时
  }
  await res.text().catch(() => {}) // 回执体零消费面（三值只看状态）
  if (res.status === 200) return { state: "valid" }
  if (res.status === 401) return { state: "invalid" }
  return { state: "unreachable" } // 其余（403 ∥ 404 地址非本服务 ∥ 5xx）⇒ 不判失效
}

/**
 * 登录（TEAM.md §2.2；三端同构）：请求 `POST <server>/api/client/login` ⇒ 成 ⇒ **一次写盘**（`team` 段 +
 * 派生条目 upsert）；败 ⇒ 分类出词、零写盘。`label` 缺省 ⇒ 自动生成（`defaultTeamLabel()`）；显式传入
 * 同口径裁剪 ≤40（服务端 >40 ⇒ 400）。网络面成功但写盘失败 ⇒ `write_failed`（服务端 token 已签发——
 * 可见于 key 列表，本地未落）。
 */
export async function teamLogin({ server = null, username = null, password = null, label = null } = {}) {
  const base = normalizeTeamServer(server)
  if (base === null) return { ok: false, reason: "network" } // 无地址可打（端侧表单门兜底面）
  if (typeof username !== "string" || username === "" || typeof password !== "string" || password === "") {
    return { ok: false, reason: "credentials" } // 凭据不全（端侧表单门兜底面）
  }
  const resolvedLabel = (typeof label === "string" && label.trim() !== "" ? label.trim() : defaultTeamLabel()).slice(0, LABEL_MAX) // 端标签 ≤40 裁剪（显式传入同口径——服务端 >40 ⇒ 400）
  let res
  try {
    res = await fetch(`${base}/api/client/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password, label: resolvedLabel }),
      signal: AbortSignal.timeout(TEAM_FETCH_TIMEOUT_MS),
    })
  } catch {
    return { ok: false, reason: "network" } // 不可达 ∥ DNS ∥ TLS ∥ 超时
  }
  if (!res.ok) {
    await res.text().catch(() => {}) // 错误体零消费面（分类只看状态——零新码）
    if (res.status === 401) return { ok: false, reason: "credentials" }
    if (res.status === 429) return { ok: false, reason: "rate_limited" }
    return { ok: false, reason: "network" } // 404（地址不是本服务）∥ 5xx 等——服务不符合预期面
  }
  let body = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  const token = typeof body?.token === "string" && body.token !== "" ? body.token : null
  if (token === null) return { ok: false, reason: "network" } // 200 而形不符（代理 ∥ 非本服务应答）
  const memberInfo = body?.member !== null && typeof body?.member === "object" ? body.member : null
  const memberUsername = typeof memberInfo?.username === "string" && memberInfo.username !== "" ? memberInfo.username : username
  const memberName = typeof memberInfo?.name === "string" && memberInfo.name !== "" ? memberInfo.name : memberUsername
  let notice = null
  try {
    const result = persistRaw((raw) => {
      assertWritableRoot(raw)
      // 一次 mutate：team 段 + 派生条目（同一次写盘落）
      raw.team = { server: base, member: { username: memberUsername, name: memberName }, label: resolvedLabel, token }
      if (!Array.isArray(raw.providers)) raw.providers = []
      const existing = raw.providers.find((p) => p !== null && typeof p === "object" && p.name === TEAM_PROVIDER_NAME)
      if (existing !== undefined && existing.derived !== true) {
        notice = NOTICE_MANUAL_NAME_CONFLICT // 同名手工条目 ⇒ 不覆盖（D-TM4）——登录仍成
        return
      }
      if (existing !== undefined) {
        existing.baseURL = `${base}/v1`
        existing.apiKey = token
        existing.derived = true
      } else {
        raw.providers.push({ name: TEAM_PROVIDER_NAME, baseURL: `${base}/v1`, apiKey: token, derived: true }) // 表尾追加
      }
    })
    if (result !== null && result.ok === false) return { ok: false, reason: "write_failed" } // mtime 冲突（F5b——不自动合并）
  } catch {
    return { ok: false, reason: "write_failed" } // 畸形档拒写等（writeConfigAtomic fail-closed）
  }
  return notice !== null ? { ok: true, notice } : { ok: true }
}

/**
 * 退出（TEAM.md §2.3）：`POST <server>/api/client/logout`（best-effort——网络失败 ⇒ 仍清本地）⇒ **一次
 * 写盘**：摘 `team.token`（server/member/label 留存）+ 摘派生条目 `apiKey`（条目与 `derived` 保留）。
 * `revokeDelivered:false` = 服务端吊销未达（端侧提示）；401 = token 已失效（视同已送达——照清本地）。
 */
export async function teamLogout() {
  const config = loadConfig()
  const team = config.team
  const token = team?.token ?? null
  const providers = Array.isArray(config.providers) ? config.providers : []
  const derived = providers.find((p) => p !== null && typeof p === "object" && p.name === TEAM_PROVIDER_NAME && p.derived === true)
  const hasDerivedKey = typeof derived?.apiKey === "string" && derived.apiKey !== ""
  let revokeDelivered = true
  if (token !== null) {
    if (team.server === null) {
      revokeDelivered = false // 有 token 无地址 ⇒ 无法吊销（畸形档面）
    } else {
      try {
        const res = await fetch(`${team.server}/api/client/logout`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: "{}",
          signal: AbortSignal.timeout(TEAM_FETCH_TIMEOUT_MS),
        })
        await res.text().catch(() => {})
        revokeDelivered = res.status === 200 || res.status === 401 // 401 = 已失效（端侧视同「已失效」——照清本地）
      } catch {
        revokeDelivered = false // 不可达 ⇒ 本地仍清 + 提示「服务端吊销未达」
      }
    }
  }
  if (token !== null || hasDerivedKey) {
    try {
      const result = persistRaw((raw) => {
        assertWritableRoot(raw)
        const section = raw.team
        if (section !== null && typeof section === "object" && !Array.isArray(section)) delete section.token
        if (Array.isArray(raw.providers)) {
          const entry = raw.providers.find((p) => p !== null && typeof p === "object" && p.name === TEAM_PROVIDER_NAME && p.derived === true)
          if (entry !== undefined) delete entry.apiKey // 条目与 derived 标记保留（重登自动恢复）
        }
      })
      if (result !== null && result.ok === false) return { ok: false, reason: "write_failed" }
    } catch {
      return { ok: false, reason: "write_failed" }
    }
  }
  return { ok: true, revokeDelivered }
}
