/**
 * rules.mjs — 出站规则单源与待批队列（sandbox/SANDBOX.md §4/§6；端点 = gateway/API.md §2.5/§2.6）：
 * 规则校验（两类形 ∥ 通配单层左 ∥ 端口/协议/优先级）∥ 增删改 + 审计（`sandbox_rule`——detail.action + 规则原文）∥
 * 修订号（`rulesRev`——进程内单调软状态：重启复位后「不等即全量」，runner 侧无漏配）∥ 求值序（参照实现——单源，
 * runner 侧强制同序）∥ 待批队列（挂起登记 ∥ 同 host 去重 hits++ ∥ 三态裁定 ∥ 超时懒惰结算 ∥ 三次批准建议）。
 *
 * 求值序（§4 冲突序）：① 内置恒拒（`127.0.0.0/8` ∥ `169.254.0.0/16`——非行、不可改）② 显式 deny（admin/approval）
 * ③ 显式 allow ④ 种子 deny（source='default'）⑤ 种子 allow ⑥ 默认拒（无允许条目）。即：显式 deny 恒先于 allow；
 * 种子 deny ≺ 显式 allow（U2——显式 allow 可开 RFC1918/服务器网段）。`priority` = 同 rank 内排序（可读性 + 未来扩展）。
 * 两闸次序（域名路径）：域名命中 allow ⇒ 解析（全地址）⇒ 每个解析 IP 仍过 CIDR 闸（**禁单/deny 命中 ⇒ 拒**——防
 * 「白名单域名 + 内网解析」绕过；无 CIDR 条目 ⇒ 不拦——域名规则自身即允许面）。
 *
 * 待批下发 = poll 拉取（§6：裁定经 poll 下发 ≤1s 级）；「已下发」簿记在 runner-api 进程内存（重启 ⇒ 至多重发一次；
 * 裁定按 id 匹配——重发幂等）。超时（缺省 60s——设置项 `pendingTimeoutSeconds`）⇒ 拒：懒惰结算（读面/裁定时顺手扫）。
 * rulesRev 变更点 = 本档规则增删改 ∥ 待批 remember ∥ join 动态网段（runner-api）∥ settings 写入（routes）——后两者调 `bumpRulesRev`。
 */
import { HttpError } from "../gateway/errors.mjs"
import { recordAudit } from "../accounts/audit.mjs"
import { getSettings } from "./registry.mjs"

export const RULE_KINDS = Object.freeze(["cidr", "domain"])
export const RULE_ACTIONS = Object.freeze(["allow", "deny"])
export const RULE_SOURCES = Object.freeze(["default", "admin", "approval"])

/** 内置恒拒 CIDR（U2——非行、不可改；规则表零承载）。 */
export const HARD_DENY_CIDRS = Object.freeze(["127.0.0.0/8", "169.254.0.0/16"])

/** 待批三态裁定取值（`POST .../pending/:id/resolve`）。 */
export const PENDING_DECISIONS = Object.freeze(["once", "remember", "deny"])

/** 裁定下发窗口（重发界——挂起窗 ≤60s，窗口取远大于它的 10 分钟）。 */
export const RECENT_RESOLUTION_MS = 10 * 60 * 1000

/** 三次批准建议门槛（§6——approve-once 计数由史派生）。 */
export const SUGGEST_APPROVALS = 3

const NOTE_MAX = 200
const HOST_MAX = 253
const PRIORITY_MAX = 100000

/** 修订号（进程内单调——软状态；变更点见档头）。 */
let rulesRev = 0

export function getRulesRev() {
  return rulesRev
}

export function bumpRulesRev() {
  rulesRev += 1
  return rulesRev
}

// ── IPv4/CIDR 纯函数（校验 + 匹配——IPv4 单栈；v1 不做 IPv6）────────────────────

/** IPv4 文本 ⇒ 32 位整数（非法 ⇒ null；拒前导零形）。 */
export function parseIpv4(text) {
  if (typeof text !== "string") return null
  const parts = text.trim().split(".")
  if (parts.length !== 4) return null
  let value = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    if (part.length > 1 && part.startsWith("0")) return null
    const octet = Number(part)
    if (octet > 255) return null
    value = value * 256 + octet
  }
  return value
}

/** CIDR 文本 ⇒ `{ base, bits }`（裸 IP = /32）；非法 ⇒ null。 */
export function parseCidr(text) {
  if (typeof text !== "string") return null
  const trimmed = text.trim()
  const slash = trimmed.indexOf("/")
  const address = slash >= 0 ? trimmed.slice(0, slash) : trimmed
  const bits = slash >= 0 ? trimmed.slice(slash + 1) : "32"
  const base = parseIpv4(address)
  if (base === null) return null
  if (!/^\d{1,2}$/.test(bits)) return null
  const width = Number(bits)
  if (width > 32) return null
  return { base, bits: width }
}

/** CIDR 命中判据（含网络掩码归一——`10.0.0.7/8` 形按掩码算）。 */
export function cidrMatch(cidr, ip) {
  const target = typeof ip === "number" ? ip : parseIpv4(ip)
  const parsed = typeof cidr === "string" ? parseCidr(cidr) : cidr
  if (target === null || parsed === null) return false
  if (parsed.bits === 0) return true
  const mask = parsed.bits === 32 ? 0xffffffff : ((0xffffffff << (32 - parsed.bits)) >>> 0)
  return ((target & mask) >>> 0) === ((parsed.base & mask) >>> 0)
}

/** CIDR 目标校验（形：`a.b.c.d` ∥ `a.b.c.d/n`，n = 0..32）——返回归一文本（trim 后原形）。 */
export function validateCidrTarget(raw) {
  const target = typeof raw === "string" ? raw.trim() : ""
  if (target === "") throw new Error("规则目标不可为空（CIDR 形：a.b.c.d ∥ a.b.c.d/n）")
  if (parseCidr(target) === null) throw new Error(`CIDR 形非法：${target}（须 a.b.c.d 或 a.b.c.d/n，n = 0..32）`)
  return target
}

/** 域名目标校验（单层左通配 `*.example.com`；禁裸 `*` ∥ TLD 级 `*.com` ∥ 双通配 ∥ 非左通配 ∥ IP 字面量）。 */
export function validateDomainTarget(raw) {
  const target = typeof raw === "string" ? raw.trim() : ""
  if (target === "") throw new Error("规则目标不可为空（域名形：example.com ∥ *.example.com）")
  if (target.length > HOST_MAX) throw new Error(`域名超长（≤ ${HOST_MAX} 字符；实长 ${target.length}）`)
  if (parseIpv4(target) !== null || parseCidr(target) !== null) throw new Error(`域名规则不收 IP 字面量：${target}（IP 段走 CIDR 规则）`)
  const hasWildcard = target.includes("*")
  let suffix = target
  if (hasWildcard) {
    if (target === "*") throw new Error("禁裸 `*`（通配仅单层左形：*.example.com）")
    if (!target.startsWith("*.")) throw new Error(`通配仅单层左形（*.example.com）：${target}`)
    suffix = target.slice(2)
    if (suffix.includes("*")) throw new Error(`禁双通配：${target}`)
  }
  const labels = suffix.split(".")
  if (labels.length < 2) throw new Error(`禁 TLD 级通配（*.com 类）——通配至少留两级：${target}`)
  for (const label of labels) {
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(label)) throw new Error(`域名标签非法：${target}（段 = ${JSON.stringify(label)}）`)
    if (label.length > 63) throw new Error(`域名标签超长（≤ 63 字符）：${target}`)
  }
  return target
}

/** 域名匹配（精确 ∥ 单层左通配——恰一级子域；大小写不敏感）。 */
export function domainMatch(ruleTarget, host) {
  const pattern = String(ruleTarget).trim().toLowerCase()
  const name = String(host ?? "").trim().toLowerCase()
  if (name === "") return false
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(2)
    if (!name.endsWith(suffix)) return false
    const left = name.slice(0, name.length - suffix.length)
    if (!left.endsWith(".")) return false
    const sub = left.slice(0, -1)
    return sub !== "" && !sub.includes(".") // 恰一级子域
  }
  return name === pattern
}

/** 单条规则 × 查询目标（端口/协议 NULL ⇒ 不限；查询侧无端口而规则限端口 ⇒ 不命中——保守）。 */
export function ruleMatches(rule, { host = null, ip = null, port = null, protocol = null } = {}) {
  if (rule.kind === "domain") {
    if (host === null || !domainMatch(rule.target, host)) return false
  } else if (rule.kind === "cidr") {
    if (ip === null || !cidrMatch(rule.target, ip)) return false
  } else {
    return false
  }
  if (rule.port !== null && rule.port !== undefined && rule.port !== port) return false
  if (rule.protocol !== null && rule.protocol !== undefined && rule.protocol !== protocol) return false
  return true
}

/** 规则表归一（校验全字段——创建/修改共用；非法 ⇒ 抛）。 */
export function validateRuleFields(fields) {
  if (fields === null || typeof fields !== "object") throw new Error("规则须为对象")
  const kind = fields.kind
  if (!RULE_KINDS.includes(kind)) throw new Error(`规则类型须为 ${RULE_KINDS.join(" ∥ ")}：${String(kind)}`)
  const action = fields.action
  if (!RULE_ACTIONS.includes(action)) throw new Error(`规则动作须为 ${RULE_ACTIONS.join(" ∥ ")}：${String(action)}`)
  const target = kind === "cidr" ? validateCidrTarget(fields.target) : validateDomainTarget(fields.target)
  let port = null
  if (fields.port !== null && fields.port !== undefined) {
    port = Number(fields.port)
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`端口须为 1..65535 整数或 null：${String(fields.port)}`)
  }
  let protocol = null
  if (fields.protocol !== null && fields.protocol !== undefined && fields.protocol !== "") {
    protocol = String(fields.protocol)
    if (protocol !== "tcp" && protocol !== "udp") throw new Error(`协议须为 tcp ∥ udp ∥ null：${protocol}`)
  }
  const priority = fields.priority === null || fields.priority === undefined ? 0 : Number(fields.priority)
  if (!Number.isInteger(priority) || priority < 0 || priority > PRIORITY_MAX) {
    throw new Error(`优先级须为 0..${PRIORITY_MAX} 整数：${String(fields.priority)}`)
  }
  const note = fields.note === null || fields.note === undefined ? "" : String(fields.note).trim()
  if (note.length > NOTE_MAX) throw new Error(`备注超长（≤ ${NOTE_MAX} 字符；实长 ${note.length}）`)
  return { kind, action, target, port, protocol, priority, note }
}

/** 求值 rank（§4 冲突序——数字小者先）：0 显式 deny ∥ 1 显式 allow ∥ 2 种子 deny ∥ 3 种子 allow。 */
export function rankOfRule(rule) {
  const explicit = rule.source === "admin" || rule.source === "approval"
  if (rule.action === "deny") return explicit ? 0 : 2
  return explicit ? 1 : 3
}

/** 下发/求值序：rank ⇒ priority ⇒ id（首命中即裁定）。 */
export function sortRules(rules) {
  return [...rules].sort((a, b) => rankOfRule(a) - rankOfRule(b) || a.priority - b.priority || a.id - b.id)
}

/** 全量规则（库序）——下发前过 `sortRules`。 */
export function listRules(db) {
  return db.prepare("SELECT * FROM sandbox_rules ORDER BY id").all().map(rowToRule)
}

/**
 * 求值（参照实现——单源求值序；runner 侧按 RUNNER.md §4 强制同序）。
 * 入：`{ host?, ips?, port?, protocol? }`；出：`{ action, reason, rule, ip? }`。
 * - host 在场 ⇒ 域名闸（命中 allow 才继续）⇒ 每个解析 IP 过 CIDR 闸（deny 命中 ⇒ 拒；无条目 ⇒ 不拦）；
 * - 无 host ⇒ 直连 IP 径（网络层语义——默认拒，须命中 allow）。
 */
export function evaluateEgress(rules, { host = null, ips = [], port = null, protocol = null } = {}) {
  const sorted = sortRules(rules)
  for (const ip of ips) {
    if (HARD_DENY_CIDRS.some((cidr) => cidrMatch(cidr, ip))) return { action: "deny", reason: "hard_deny", rule: null, ip }
  }
  if (host !== null) {
    const hit = sorted.find((rule) => rule.kind === "domain" && ruleMatches(rule, { host, port, protocol }))
    if (!hit) return { action: "deny", reason: "domain_no_match", rule: null }
    if (hit.action === "deny") return { action: "deny", reason: "domain_deny", rule: hit }
    for (const ip of ips) {
      const ipHit = sorted.find((rule) => rule.kind === "cidr" && ruleMatches(rule, { ip, port, protocol }))
      if (ipHit && ipHit.action === "deny") return { action: "deny", reason: "ip_deny", rule: ipHit, ip }
    }
    return { action: "allow", reason: "domain_allow", rule: hit }
  }
  if (ips.length === 0) return { action: "deny", reason: "no_target", rule: null }
  for (const ip of ips) {
    const hit = sorted.find((rule) => rule.kind === "cidr" && ruleMatches(rule, { ip, port, protocol }))
    if (!hit) return { action: "deny", reason: "ip_no_match", rule: null, ip }
    if (hit.action === "deny") return { action: "deny", reason: "ip_deny", rule: hit, ip }
  }
  return { action: "allow", reason: "ip_allow", rule: null }
}

// ── 规则增删改（审计 `sandbox_rule` + 修订号）─────────────────────────────────

function rowToRule(row) {
  return {
    id: row.id,
    kind: row.kind,
    action: row.action,
    target: row.target,
    port: row.port,
    protocol: row.protocol,
    priority: row.priority,
    note: row.note,
    source: row.source,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

/** 插一行（内部面——`source='approval'` 仅待批 remember 径可达）+ 审计 + 修订号。 */
function insertRule(db, fields, { source, actor, actorId = null, note = null, now = Date.now() } = {}) {
  const info = db
    .prepare(
      `INSERT INTO sandbox_rules (kind, action, target, port, protocol, priority, note, source, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(fields.kind, fields.action, fields.target, fields.port, fields.protocol, fields.priority, note ?? fields.note, source, new Date(now).toISOString(), actor)
  const rule = rowToRule(db.prepare("SELECT * FROM sandbox_rules WHERE id = ?").get(Number(info.lastInsertRowid)))
  recordAudit(db, { type: "sandbox_rule", actor, actorId, target: rule.target, detail: { action: "create", rule } })
  return { rule, rulesRev: bumpRulesRev() }
}

/** 建规则（控制台面）：source 缺省 `admin`；`default` = 采纳「建议入默认单」（并入种子行——可改可删）。 */
export function createRule(db, input, { actor = "", actorId = null, source = null, now = Date.now() } = {}) {
  const fields = validateRuleFields(input)
  const resolved = source ?? input?.source ?? "admin"
  if (!RULE_SOURCES.includes(resolved)) throw new Error(`规则来源非法：${String(resolved)}`)
  if (resolved === "approval") throw new Error("approval 来源仅由待批裁定写入")
  return insertRule(db, fields, { source: resolved, actor, actorId, now })
}

/** 改规则（键级：出现的字段 = 应用）——合并现值后全量校验（库零变 ⇒ 抛在写前）。 */
export function updateRule(db, id, patch, { actor = "", actorId = null, now = Date.now() } = {}) {
  const existing = db.prepare("SELECT * FROM sandbox_rules WHERE id = ?").get(Number(id))
  if (!existing) throw new HttpError("not_found", `规则不存在：${id}`)
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) throw new Error("规则修改须为对象")
  const merged = validateRuleFields({
    kind: patch.kind ?? existing.kind,
    action: patch.action ?? existing.action,
    target: patch.target ?? existing.target,
    port: "port" in patch ? patch.port : existing.port,
    protocol: "protocol" in patch ? patch.protocol : existing.protocol,
    priority: "priority" in patch ? patch.priority : existing.priority,
    note: "note" in patch ? patch.note : existing.note,
  })
  db.prepare("UPDATE sandbox_rules SET kind = ?, action = ?, target = ?, port = ?, protocol = ?, priority = ?, note = ? WHERE id = ?").run(
    merged.kind, merged.action, merged.target, merged.port, merged.protocol, merged.priority, merged.note, existing.id,
  )
  const rule = rowToRule(db.prepare("SELECT * FROM sandbox_rules WHERE id = ?").get(existing.id))
  recordAudit(db, { type: "sandbox_rule", actor, actorId, target: rule.target, detail: { action: "update", rule } })
  return { rule, rulesRev: bumpRulesRev() }
}

/** 删规则（行删——审计记删除前原文）。 */
export function deleteRule(db, id, { actor = "", actorId = null } = {}) {
  const existing = db.prepare("SELECT * FROM sandbox_rules WHERE id = ?").get(Number(id))
  if (!existing) throw new HttpError("not_found", `规则不存在：${id}`)
  db.prepare("DELETE FROM sandbox_rules WHERE id = ?").run(existing.id)
  const rule = rowToRule(existing)
  recordAudit(db, { type: "sandbox_rule", actor, actorId, target: rule.target, detail: { action: "delete", rule } })
  return { rule, rulesRev: bumpRulesRev() }
}

/** 网段 deny 幂等带入（runner 注册——SANDBOX §4「服务器网段 ∥ runner 自身网段 = 注册时自动带入」）：
 *  同 kind/action/target 已在 ⇒ 零动作；否则插入种子 deny 行（source='default'——可改可删）+ 审计（`sandbox_rule`——
 *  `actor = "auto"`，行内 `created_by = 'auto'`——§4「每次增删一行」对自动项同拍）。 */
export function ensureSegmentDeny(db, cidr, { note = "注册动态项", actor = "auto", now = Date.now() } = {}) {
  const parsed = parseCidr(cidr)
  if (parsed === null) return null
  const existing = db.prepare("SELECT id FROM sandbox_rules WHERE kind = 'cidr' AND action = 'deny' AND target = ?").get(cidr)
  if (existing) return null
  const info = db
    .prepare(
      `INSERT INTO sandbox_rules (kind, action, target, port, protocol, priority, note, source, created_at, created_by)
       VALUES ('cidr', 'deny', ?, NULL, NULL, 0, ?, 'default', ?, 'auto')`,
    )
    .run(cidr, note, new Date(now).toISOString())
  const rule = rowToRule(db.prepare("SELECT * FROM sandbox_rules WHERE id = ?").get(Number(info.lastInsertRowid)))
  recordAudit(db, { type: "sandbox_rule", actor, actorId: null, target: rule.target, detail: { action: "create", rule } })
  bumpRulesRev()
  return rule.id
}

// ── 待批队列（§6）────────────────────────────────────────────────────────────

/** 挂起登记（`POST /api/runner/pending`）：同 workspace × host（大小写不敏感）open 行 ⇒ hits++/更新 last_seen_at；
 *  否则新行。返回 `{ id, hits, timeoutSeconds }`（超时值 = 设置项 `pendingTimeoutSeconds`——runner 挂起窗同源）。 */
export function markPending(db, { runnerId, workspaceId, host, now = Date.now() } = {}) {
  const normalized = String(host ?? "").trim()
  if (normalized === "") throw new Error("待批登记缺 host")
  const existing = db
    .prepare("SELECT * FROM sandbox_pending WHERE workspace_id = ? AND lower(host) = lower(?) AND status = 'open' ORDER BY id DESC LIMIT 1")
    .get(workspaceId, normalized)
  if (existing) {
    db.prepare("UPDATE sandbox_pending SET hits = hits + 1, last_seen_at = ? WHERE id = ?").run(now, existing.id)
    return { id: existing.id, hits: existing.hits + 1, timeoutSeconds: getSettings(db).pendingTimeoutSeconds }
  }
  const info = db
    .prepare("INSERT INTO sandbox_pending (runner_id, workspace_id, host, hits, first_seen_at, last_seen_at, status) VALUES (?, ?, ?, 1, ?, ?, 'open')")
    .run(runnerId, workspaceId, normalized, now, now)
  return { id: Number(info.lastInsertRowid), hits: 1, timeoutSeconds: getSettings(db).pendingTimeoutSeconds }
}

/** 超时懒惰结算（§6：超时 ⇒ 拒）：open 且 `first_seen_at` 超窗 ⇒ status='timeout' + 审计（决策 = timeout）。 */
export function sweepPendingTimeouts(db, { now = Date.now(), actor = "system" } = {}) {
  const timeoutS = getSettings(db).pendingTimeoutSeconds
  const cutoff = now - timeoutS * 1000
  const rows = db.prepare("SELECT * FROM sandbox_pending WHERE status = 'open' AND first_seen_at <= ? ORDER BY id").all(cutoff)
  for (const row of rows) {
    db.prepare("UPDATE sandbox_pending SET status = 'timeout', resolved_at = ? WHERE id = ?").run(now, row.id)
    recordAudit(db, {
      type: "sandbox_event",
      actor,
      target: row.host,
      detail: { kind: "approval", decision: "timeout", host: row.host, workspaceId: row.workspace_id, pendingId: row.id },
      ts: now,
    })
  }
  return rows.length
}

/** 裁定（三态——`POST /api/admin/sandbox/pending/:id/resolve`）：once/remember/deny；remember ⇒ 域名 allow 规则入表
 *  （`source='approval'`——即生效）+ `sandbox_rule` 审计；本裁定落 `sandbox_event`（kind=approval）。 */
export function resolvePending(db, id, decision, { actor = "", actorId = null, now = Date.now() } = {}) {
  if (!PENDING_DECISIONS.includes(decision)) throw new Error(`裁定须为 ${PENDING_DECISIONS.join(" ∥ ")}：${String(decision)}`)
  const row = db.prepare("SELECT * FROM sandbox_pending WHERE id = ?").get(Number(id))
  if (!row) throw new HttpError("not_found", `待批不存在：${id}`)
  if (row.status !== "open") throw new HttpError("invalid_request_error", `待批已裁定（status = ${row.status}）——不可重复裁定`)
  const status = decision === "once" ? "approved_once" : decision === "remember" ? "approved_remember" : "denied"
  db.prepare("UPDATE sandbox_pending SET status = ?, resolved_at = ? WHERE id = ?").run(status, now, row.id)
  let created = null
  if (decision === "remember") {
    const fields = validateRuleFields({ kind: "domain", action: "allow", target: row.host, port: null, protocol: null, priority: 0, note: "待批批准记住" })
    created = insertRule(db, fields, { source: "approval", actor, actorId, note: "待批批准记住", now })
  }
  recordAudit(db, {
    type: "sandbox_event",
    actor,
    actorId,
    target: row.host,
    detail: { kind: "approval", decision, host: row.host, workspaceId: row.workspace_id, pendingId: row.id },
    ts: now,
  })
  return { pending: pendingView(row, status, now), rule: created?.rule ?? null, rulesRev: created?.rulesRev ?? getRulesRev() }
}

/** 待下发裁定（poll）：该 runner 已裁定行（近窗）——决策字段由 status 派生（timeout 原样下发 = 拒）。 */
export function pendingResolutions(db, runnerId, { now = Date.now() } = {}) {
  return db
    .prepare("SELECT * FROM sandbox_pending WHERE runner_id = ? AND status <> 'open' AND resolved_at IS NOT NULL AND resolved_at >= ? ORDER BY id")
    .all(runnerId, now - RECENT_RESOLUTION_MS)
    .map((row) => ({ id: row.id, workspaceId: row.workspace_id, host: row.host, decision: decisionOf(row.status) }))
}

/** 三次批准同一域 ⇒ 建议入默认单（史派生；该域已有 allow 条目 ⇒ 不再建议）。 */
export function pendingSuggestions(db, { now = Date.now() } = {}) {
  const counts = db
    .prepare("SELECT lower(host) AS host, COUNT(*) AS approvals FROM sandbox_pending WHERE status = 'approved_once' GROUP BY lower(host) HAVING COUNT(*) >= ? ORDER BY approvals DESC, host")
    .all(SUGGEST_APPROVALS)
  const allows = db.prepare("SELECT lower(target) AS target FROM sandbox_rules WHERE kind = 'domain' AND action = 'allow'").all().map((row) => row.target)
  return counts
    .filter((row) => !allows.includes(row.host) && !allows.includes(`*.${row.host}`))
    .map((row) => ({ host: row.host, approvals: Number(row.approvals) }))
}

/** 待批列表（控制台——实时表：open 在前 ⇒ id 降序）+ 建议行；读面顺手超时结算。 */
export function listPending(db, { now = Date.now() } = {}) {
  sweepPendingTimeouts(db, { now })
  const rows = db
    .prepare("SELECT * FROM sandbox_pending ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, id DESC LIMIT 200")
    .all()
  return { pending: rows.map((row) => pendingView(row, row.status, now)), suggestions: pendingSuggestions(db, { now }) }
}

/** 最近 open 待批（成员面提示——`gateway/API.md` §2.7：`{ host, since }` ∥ null）。 */
export function openPendingOf(db, workspaceId, { now = Date.now() } = {}) {
  sweepPendingTimeouts(db, { now })
  const row = db.prepare("SELECT * FROM sandbox_pending WHERE workspace_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1").get(workspaceId)
  return row ? { host: row.host, since: row.first_seen_at } : null
}

function decisionOf(status) {
  return status === "approved_once" ? "once" : status === "approved_remember" ? "remember" : status === "denied" ? "deny" : "timeout"
}

function pendingView(row, status, now) {
  return {
    id: row.id,
    runnerId: row.runner_id,
    workspaceId: row.workspace_id,
    host: row.host,
    hits: row.hits,
    status,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    resolvedAt: row.resolved_at ?? null,
    ageMs: now - row.first_seen_at,
  }
}
