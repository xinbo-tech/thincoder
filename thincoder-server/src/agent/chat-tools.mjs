/**
 * chat-tools.mjs — 管理面工具面七件（`agent/ADMIN-AGENT.md` §12 ∥ KD-SV-90；admin-agent-chat 批——台账 #1254）：
 * `members`（六动词）∥ `providers`（五）∥ `models`（五）∥ `usage`（summary ∥ rows）∥ `audit`（query）∥ `runners`（list ∥ add ∥ remove）
 * ∥ `docker`（十动词——**绑定 = 注册节点**；未在册 ⇒ 工具级错误回灌）。
 *
 * 口径（KD-SV-90）：**进程内直取域件**（零 HTTP 回环——KD-SV-82 延续）；**写链与控制台路由同函数**（provider 写面 = `gateway/provider-admin.mjs`
 * 共享写函数 ∥ 成员重置链 = `accounts/members.mjs` 的 `resetMemberPassword` ∥ 节点删除链 = `sandbox/registry.mjs` 的 `deleteRunnerChain`——
 * 两调用点单源）；每次动作落审计行 = **驱动层**职责（`chat.mjs` 逐调用一条 `agent_event`/`chat_call`——本档不写审计，零双记 KD-SV-91）；
 * 工具结果形 = `{ ok, … }`（结构化；错误 ⇒ `ok: false` + 人话 `message`——回灌模型自纠，**回合不停**）。
 * 密钥面：provider 回显走 `maskApiKey`（明文不出）；`exec`（SSH）**不入 chat**（凭据 = 任务表单专有——KD-SV-84 面不破）。
 */
import { queryAudit } from "../accounts/audit.mjs"
import { getKeyById, revokeKey } from "../accounts/keys.mjs"
import {
  createMember, findMemberById, findMemberByName, findMemberByUsername, listMembers, mergeMemberModelDisables, mergeMemberModelQuotas,
  parseModelDisables, parseModelQuotas, resetMemberPassword,
} from "../accounts/members.mjs"
import { addProviderEntry, discoverProviderModels, maskApiKey, removeProviderEntry, updateProviderEntry } from "../gateway/provider-admin.mjs"
import { proxyFetch } from "../gateway/proxy.mjs"
import { listProviderEntries, modelEntriesOf } from "../gateway/providers.mjs"
import { usageSummary } from "../metering/report.mjs"
import { queryUsage } from "../metering/usage.mjs"
import { clientForRunner, normalizeDockerAddress, selfCheckDocker } from "../sandbox/docker.mjs"
import { deleteRunnerChain, insertRunner, listRunners, normalizeRunnerName, runnerRowOr404, sandboxPublicBase } from "../sandbox/registry.mjs"
import { DOCKER_OPS, assertDockerOp, runDockerOp } from "./docker-ops.mjs"

/** 工具名全集（七件——§12 表；断言面）。 */
export const CHAT_TOOL_NAMES = Object.freeze(["members", "providers", "models", "usage", "audit", "runners", "docker"])

/** 各工具动词集（§12 逐行——参数校验先于动作；断言面）。 */
export const CHAT_TOOL_OPS = Object.freeze({
  members: Object.freeze(["list", "create", "reset_password", "revoke_key", "set_quota", "set_disables"]),
  providers: Object.freeze(["list", "add", "update", "remove", "discover"]),
  models: Object.freeze(["list", "enable", "disable", "settings", "alias"]),
  usage: Object.freeze(["summary", "rows"]),
  audit: Object.freeze(["query"]),
  runners: Object.freeze(["list", "add", "remove"]),
})

/** 用法面限制（§12）：`usage.rows` limit ≤ 100（控制台账为 ≤500——工具面收窄）。 */
export const TOOL_USAGE_LIMIT_MAX = 100

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function requireText(value, field, max = 200) {
  const text = typeof value === "string" ? value.trim() : ""
  if (text === "") throw new Error(`${field}必填`)
  if (text.length > max) throw new Error(`${field}超长（≤ ${max}）`)
  return text
}

function optionalText(value, field, max = 2000) {
  if (value === undefined || value === null || value === "") return null
  const text = typeof value === "string" ? value : String(value)
  if (text.length > max) throw new Error(`${field}超长（≤ ${max}）`)
  return text
}

/**
 * 装配七工具（§12）：`db` = openDatabase 产物 ∥ `runtime` = gateway 注册行引导的**同一实例**（provider 写面换表——与路由同见）
 * ∥ `guard` = 登录守卫（重置链清计——装配面注入）∥ `fetchImpl` = Docker 传输注入面（批内件替身）
 * ∥ `discoverFetchImpl` = 上游探针出口（缺省 = `proxyFetch`——与控制台 discover 同出口，代理旗判定不丢；测试替身走此参）。
 * `invoke(name, args)` 出 = **结果对象**（各动词自带字段，至少 `{ ok }`；失败 ⇒ `{ ok:false, message }`——不抛，交模型自纠）。
 * `summary` 面：docker 等结果自带则沿用，余由驱动层派生（`chat.summaryOfResult`——掩蔽 + 截断）。
 */
export function createChatTools({ db, runtime = null, config = {}, env = process.env, fetchImpl = fetch, discoverFetchImpl = proxyFetch, guard = null, log = null } = {}) {
  if (!db) throw new Error("createChatTools：缺少 db（openDatabase 产物）")
  const providerCtx = { db, runtime, config, env, fetchImpl: discoverFetchImpl, log }
  const publicBase = sandboxPublicBase(config) // 删除链续放置载荷与控制台同源（§12「与控制台同函数同效」）

  /** 成员寻址（id ∥ 用户名 ∥ 展示名——§3 寻址口径）。 */
  function resolveMember(raw, field = "member") {
    if (raw === undefined || raw === null || raw === "") throw new Error(`${field}必填（成员 id ∥ 用户名 ∥ 展示名）`)
    if (typeof raw === "number" || /^\d+$/.test(String(raw))) {
      const hit = findMemberById(db, Number(raw))
      if (hit) return hit
    }
    return findMemberByUsername(db, String(raw)) ?? findMemberByName(db, String(raw)) ?? (() => { throw new Error(`成员不存在：${String(raw)}`) })()
  }

  /** 节点寻址（注册节点名 ∥ 地址——§12 docker 行「绑定 = 注册节点」；未在册 ⇒ 工具级错误）。 */
  function resolveNode(raw) {
    const value = requireText(raw, "host（注册节点名 ∥ 地址）", 300)
    let row = db.prepare("SELECT * FROM sandbox_runners WHERE name = ? OR address = ?").get(value, value)
    if (!row) {
      try {
        row = db.prepare("SELECT * FROM sandbox_runners WHERE address = ?").get(normalizeDockerAddress(value))
      } catch {
        row = null
      }
    }
    if (!row) throw new Error(`节点未在册：${value}（先 runners.add 登记，或用 runners.list 查已登记节点）`)
    return row
  }

  /** provider 条目定位（id ∥ 名——§12 providers/models 两工具共用）。 */
  function resolveProvider(raw, field = "provider") {
    if (raw === undefined || raw === null || raw === "") throw new Error(`${field}必填（provider id ∥ 名）`)
    const entries = listProviderEntries(db)
    const hit = entries.find((entry) => entry.id === Number(raw)) ?? entries.find((entry) => entry.name === String(raw))
    if (!hit) throw new Error(`provider 不存在：${String(raw)}（先 providers.list 查在册）`)
    return hit
  }

  /** 开放模型定位（上游名 ∥ 别名——§12 models 行；未开放 ⇒ 工具级错误）。 */
  function locateModel(entries, providerName, ref) {
    const target = requireText(ref, "model（上游模型名 ∥ 别名）", 200)
    for (const { name, alias } of modelEntriesOf(entries.models)) {
      if (name === target || alias === target) return name
    }
    throw new Error(`模型不在该 provider 的开放清单：${providerName}/${target}（先 models.list 查在册）`)
  }

  /** 成员过滤取值（使用量/审计两工具——同控制台口径：全数字 ⇒ id；否则按用户名/展示名；未命中 ⇒ -1 空集哨兵）。 */
  function memberFilterOf(raw) {
    if (raw === undefined || raw === null || raw === "") return null
    if (/^\d+$/.test(String(raw))) return Number(raw)
    const hit = findMemberByUsername(db, String(raw)) ?? findMemberByName(db, String(raw))
    return hit ? hit.id : -1
  }

  function timeOf(raw, field) {
    if (raw === undefined || raw === null || raw === "") return null
    const value = Number(raw)
    if (!Number.isFinite(value)) throw new Error(`${field} 非法：${String(raw)}（unix ms）`)
    return value
  }

  function endpointOf(raw) {
    if (raw === undefined || raw === null || raw === "") return null
    if (raw === "chat" || raw === "embeddings") return raw
    throw new Error(`endpoint 非法：${String(raw)}（chat ∥ embeddings）`)
  }

  // ── ① members（六动词——§12 行）──────────────────────────────────────────────
  async function membersOp(op, args) {
    switch (op) {
      case "list": {
        const members = listMembers(db).map((member) => ({
          id: member.id,
          name: member.name,
          username: member.username,
          role: member.role,
          modelQuotas: parseModelQuotas(member.model_quotas_json),
          modelDisables: parseModelDisables(member.model_disabled_json),
        }))
        return { ok: true, summary: `成员 ${members.length} 人`, members }
      }
      case "create": {
        const { member, password } = await createMember(db, { username: args.username, name: args.name ?? null, role: args.role ?? "user" })
        return { ok: true, summary: `已建成员 ${member.name}（${member.role}）`, member: { id: member.id, name: member.name, username: member.username, role: member.role }, tempPassword: password }
      }
      case "reset_password": {
        const member = resolveMember(args.member)
        const tempPassword = await resetMemberPassword(db, member, { guard }) // 重置链单源（改密 + 清计 + 会话吊销——与路由同函数）
        return { ok: true, summary: `已重置 ${member.name} 的密码（旧密即失效；临时密码一次性回显）`, id: member.id, name: member.name, tempPassword }
      }
      case "revoke_key": {
        const member = resolveMember(args.member)
        const keyId = Number(args.keyId ?? args.key)
        const key = Number.isInteger(keyId) ? getKeyById(db, keyId) : null
        if (!key || key.member_id !== member.id) throw new Error(`key 不存在或不属该成员：${String(args.keyId ?? args.key)}（先看成员 key 清单）`)
        revokeKey(db, key.id) // 立即生效；已吊销 ⇒ 幂等（软删纪律）
        return { ok: true, summary: `已吊销 ${member.name} 的 key（${key.key_hint}）`, id: member.id, keyId: key.id, keyHint: key.key_hint }
      }
      case "set_quota": {
        const member = resolveMember(args.member)
        const updated = mergeMemberModelQuotas(db, member.id, args.quotas) // 键级合并（null = 删键；键形/值校验单源）
        return { ok: true, summary: `已更新 ${member.name} 的分模型覆盖`, id: updated.id, modelQuotas: parseModelQuotas(updated.model_quotas_json) }
      }
      case "set_disables": {
        const member = resolveMember(args.member)
        const updated = mergeMemberModelDisables(db, member.id, args.disables) // 键级合并（true = 禁用；null = 删键）
        return { ok: true, summary: `已更新 ${member.name} 的模型禁用集`, id: updated.id, modelDisables: parseModelDisables(updated.model_disabled_json) }
      }
      default:
        return { ok: false, message: `未知 members 动词：${String(op)}（${CHAT_TOOL_OPS.members.join(" ∥ ")}）` }
    }
  }

  // ── ② providers（五动词——写链与控制台同函数）────────────────────────────────
  async function providersOp(op, args) {
    switch (op) {
      case "list": {
        const providers = listProviderEntries(db).map((entry) => ({
          id: entry.id,
          name: entry.name,
          baseURL: entry.baseURL,
          apiKey: maskApiKey(entry.apiKey), // 回显形——明文不出库面（§2.2 同源）
          models: entry.models,
          settings: entry.settings,
          modelMeta: entry.modelMeta,
          proxy: entry.proxy,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        }))
        return { ok: true, summary: `provider ${providers.length} 家`, providers }
      }
      case "add": {
        const { id, entry } = addProviderEntry(providerCtx, {
          name: args.name,
          baseURL: args.baseURL,
          apiKey: args.apiKey ?? "",
          models: args.models ?? [],
          proxy: args.proxy,
          modelMeta: args.modelMeta,
        })
        return { ok: true, summary: `已新增 provider ${entry.name}（#${id}）`, id, name: entry.name }
      }
      case "update": {
        const row = resolveProvider(args.id ?? args.provider)
        const { id, entry } = updateProviderEntry(providerCtx, row.id, {
          name: args.name,
          baseURL: args.baseURL,
          apiKey: args.apiKey,
          models: args.models,
          proxy: args.proxy,
          settings: args.settings,
          modelMeta: args.modelMeta,
        })
        return { ok: true, summary: `已更新 provider ${entry.name}（#${id}）`, id, name: entry.name }
      }
      case "remove": {
        const row = resolveProvider(args.id ?? args.provider)
        const out = removeProviderEntry(providerCtx, row.id)
        return { ok: true, summary: `已删除 provider ${out.name}（#${out.id}）——用量行零触`, id: out.id, name: out.name }
      }
      case "discover": {
        const { models, modelMeta } = await discoverProviderModels(providerCtx, { baseURL: args.baseURL, apiKey: args.apiKey, providerId: args.providerId, proxy: args.proxy })
        return { ok: true, summary: `发现模型 ${models.length} 个（草稿——不落库）`, models, modelMeta }
      }
      default:
        return { ok: false, message: `未知 providers 动词：${String(op)}（${CHAT_TOOL_OPS.providers.join(" ∥ ")}）` }
    }
  }

  // ── ③ models（五动词——读改写走 provider 写链，单源校验）──────────────────────
  function modelsOp(op, args) {
    switch (op) {
      case "list": {
        const rows = []
        for (const entry of listProviderEntries(db)) {
          if (args.provider !== undefined && args.provider !== null && args.provider !== "" && entry.name !== String(args.provider) && entry.id !== Number(args.provider)) continue
          for (const { name, alias } of modelEntriesOf(entry.models)) {
            rows.push({ provider: entry.name, model: name, alias, external: alias ?? `${entry.name}/${name}`, settings: entry.settings?.[name] ?? null })
          }
        }
        return { ok: true, summary: `开放模型 ${rows.length} 个`, models: rows }
      }
      case "enable": {
        const entry = resolveProvider(args.provider)
        const name = requireText(args.model, "model（上游模型名）", 200)
        if (modelEntriesOf(entry.models).some((item) => item.name === name)) {
          return { ok: true, summary: `模型已在开放清单：${entry.name}/${name}`, id: entry.id, models: entry.models }
        }
        const out = updateProviderEntry(providerCtx, entry.id, { models: [...entry.models, name] })
        return { ok: true, summary: `已开放 ${entry.name}/${name}`, id: out.id, models: out.entry.models }
      }
      case "disable": {
        const entry = resolveProvider(args.provider)
        const name = locateModel(entry, entry.name, args.model)
        const rest = entry.models.filter((item) => {
          const parsed = modelEntriesOf([item])[0]
          return !(parsed && parsed.name === name)
        })
        const out = updateProviderEntry(providerCtx, entry.id, { models: rest })
        return { ok: true, summary: `已停开放 ${entry.name}/${name}`, id: out.id, models: out.entry.models }
      }
      case "settings": {
        const entry = resolveProvider(args.provider)
        const name = locateModel(entry, entry.name, args.model)
        const patch = args.settings
        if (!isPlainObject(patch)) throw new Error("settings 须为对象（{ rpm ∥ tpm ∥ costIn ∥ costOut ∥ note ∥ quotaTokens }——值 null = 清该项）")
        const current = isPlainObject(entry.settings?.[name]) ? entry.settings[name] : {}
        const merged = { ...current }
        for (const [key, value] of Object.entries(patch)) {
          if (value === null) delete merged[key]
          else merged[key] = value
        }
        const out = updateProviderEntry(providerCtx, entry.id, { settings: { ...entry.settings, [name]: merged } }) // 子字段级合并（值形校验单源）
        return { ok: true, summary: `已更新 ${entry.name}/${name} 的模型设置`, id: out.id, settings: out.entry.settings?.[name] ?? null }
      }
      case "alias": {
        const entry = resolveProvider(args.provider)
        const name = locateModel(entry, entry.name, args.model)
        const alias = optionalText(args.alias, "alias", 200)
        const next = entry.models.map((item) => {
          const parsed = modelEntriesOf([item])[0]
          if (!parsed || parsed.name !== name) return item
          if (alias === null) return name // 清除别名 ⇒ 回落字符串形（归一无别名）
          if (alias.includes("/")) throw new Error(`别名不可含「/」：${alias}`)
          return { name, alias }
        })
        // 别名全服唯一（含本次）走写链单源校验——撞 ⇒ 400（此处转工具级错误）
        const out = updateProviderEntry(providerCtx, entry.id, { models: next })
        return { ok: true, summary: alias === null ? `已清除 ${entry.name}/${name} 的别名` : `已设别名 ${alias} ⇒ ${entry.name}/${name}`, id: out.id, models: out.entry.models }
      }
      default:
        return { ok: false, message: `未知 models 动词：${String(op)}（${CHAT_TOOL_OPS.models.join(" ∥ ")}）` }
    }
  }

  // ── ④ usage（summary ∥ rows）∥ ⑤ audit（query）∥ ⑥ runners（三动词）──────────
  function usageOp(op, args) {
    const filters = {
      memberId: memberFilterOf(args.member),
      model: args.model === undefined || args.model === null || args.model === "" ? null : String(args.model),
      endpoint: endpointOf(args.endpoint),
      from: timeOf(args.from, "from"),
      to: timeOf(args.to, "to"),
    }
    if (op === "summary") {
      const { totals, byModel, byMember } = usageSummary(db, filters)
      return { ok: true, summary: `聚合读数：请求 ${totals.requests} ∥ 计费 tokens ${totals.totalTokens}`, totals, byModel, byMember }
    }
    if (op === "rows") {
      const raw = args.limit === undefined || args.limit === null || args.limit === "" ? TOOL_USAGE_LIMIT_MAX : Number(args.limit)
      if (!Number.isInteger(raw) || raw < 1) throw new Error(`limit 非法：${String(args.limit)}（正整数 ≤ ${TOOL_USAGE_LIMIT_MAX}）`)
      const limit = Math.min(raw, TOOL_USAGE_LIMIT_MAX)
      const rows = queryUsage(db, { ...filters, limit })
      return { ok: true, summary: `用量明细 ${rows.length} 行（limit ≤ ${TOOL_USAGE_LIMIT_MAX}）`, rows }
    }
    return { ok: false, message: `未知 usage 动词：${String(op)}（${CHAT_TOOL_OPS.usage.join(" ∥ ")}）` }
  }

  function auditOp(op, args) {
    if (op !== "query") return { ok: false, message: `未知 audit 动词：${String(op)}（${CHAT_TOOL_OPS.audit.join(" ∥ ")}）` }
    const limit = args.limit === undefined || args.limit === null || args.limit === "" ? undefined : Number(args.limit)
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) throw new Error(`limit 非法：${String(args.limit)}（正整数 ≤ 500）`)
    const events = queryAudit(db, {
      type: args.type === undefined || args.type === null || args.type === "" ? null : String(args.type), // 枚举校验归 queryAudit（非法 ⇒ 工具级错误）
      memberId: memberFilterOf(args.member),
      from: timeOf(args.from, "from"),
      to: timeOf(args.to, "to"),
      ...(limit === undefined ? {} : { limit }),
    })
    return { ok: true, summary: `审计事件 ${events.length} 行（倒序）`, events }
  }

  async function runnersOp(op, args) {
    switch (op) {
      case "list": {
        const runners = listRunners(db)
        return { ok: true, summary: `注册节点 ${runners.length} 个`, runners }
      }
      case "add": {
        const name = normalizeRunnerName(args.name)
        const address = normalizeDockerAddress(args.address)
        if (db.prepare("SELECT id FROM sandbox_runners WHERE name = ?").get(name)) throw new Error(`节点名已存在：${name}（换一个名字，或先 runners.remove 清理旧登记）`)
        const check = await selfCheckDocker({ address, fetchImpl })
        const row = insertRunner(db, { name, address: check.baseUrl, runtime: check.readings })
        return { ok: true, summary: `已登记节点 ${row.name}（#${row.id} @ ${row.address}）`, runner: { id: row.id, name: row.name, address: row.address, status: row.status, selfCheck: check.readings, createdAt: row.created_at } }
      }
      case "remove": {
        const runner = runnerRowOr404(db, args.id) // 不存在 ⇒ 工具级错误
        const containers = args.containers === undefined || args.containers === null || args.containers === "" ? undefined : args.containers
        const out = await deleteRunnerChain(db, runner, { containers, confirm: args.confirm === true }, { fetchImpl, publicBase })
        return { ok: true, summary: `已删除节点 ${out.name}（保留容器 ${out.kept} ∥ 连删 ${out.removed}）`, id: out.id, name: out.name, kept: out.kept, removed: out.removed }
      }
      default:
        return { ok: false, message: `未知 runners 动词：${String(op)}（${CHAT_TOOL_OPS.runners.join(" ∥ ")}）` }
    }
  }

  /** 工具调用入口（不抛——未知工具/动词/参数不合 ⇒ `{ ok:false, message }`；命令面错误同收）。 */
  async function invoke(name, args = {}) {
    try {
      const params = isPlainObject(args) ? args : {}
      if (!CHAT_TOOL_NAMES.includes(name)) return { ok: false, message: `未知工具：${String(name)}（${CHAT_TOOL_NAMES.join(" ∥ ")}）` }
      if (name === "docker") {
        const op = assertDockerOp(requireText(params.op, "op（Docker 动词）", 40))
        const node = resolveNode(params.host)
        const client = clientForRunner(node, { fetchImpl })
        const out = await runDockerOp({ client, op, args: params.args ?? {} }) // 动词语义单源（任务面同函数）
        const head = `节点 ${node.name}（${node.address}）docker ${op} ⇒ ${out.resultCode}`
        const preview = typeof out.data === "string" ? `；${out.data.slice(0, 200)}` : ""
        return { ok: true, summary: `${head}${preview}`, resultCode: out.resultCode, data: out.data }
      }
      const op = params.op === undefined || params.op === null || params.op === "" ? null : String(params.op)
      if (op === null) return { ok: false, message: `缺 op（${name} 的动词：${(CHAT_TOOL_OPS[name] ?? []).join(" ∥ ")}）` }
      if (name === "members") return await membersOp(op, params)
      if (name === "providers") return await providersOp(op, params)
      if (name === "models") return modelsOp(op, params)
      if (name === "usage") return usageOp(op, params)
      if (name === "audit") return auditOp(op, params)
      if (name === "runners") return await runnersOp(op, params)
      return { ok: false, message: `未知工具：${String(name)}` }
    } catch (e) {
      return { ok: false, message: e?.message ?? String(e) }
    }
  }

  /** 逐件 schema 构造（名 ∥ 描述 ∥ 属性表 ∥ 必填——七件同构；行压义不压）。 */
  const fn = (name, description, properties, required = ["op"]) => ({ type: "function", function: { name, description, parameters: { type: "object", properties, required } } })
  /** 长描述拼接（行宽 ≤300——单行不越线）。 */
  const desc = (...parts) => parts.join("")

  const schemas = [
    fn("members", `成员管理（控制台成员页同函数）。动词：${CHAT_TOOL_OPS.members.join(" ∥ ")}。create ⟮username,name?,role?⟯ 会生成一次性临时密码（请转告用户）；reset_password ⟮member⟯ 改密 + 清登录锁 + 吊销该成员会话；revoke_key ⟮member,keyId⟯；set_quota ⟮member,quotas⟯ ∥ set_disables ⟮member,disables⟯ 为键级合并（null = 删键）。`, {
      op: { type: "string", enum: CHAT_TOOL_OPS.members, description: "动词" },
      member: { type: "string", description: "成员（id ∥ 用户名 ∥ 展示名）" },
      keyId: { type: "number", description: "revoke_key：key id" },
      username: { type: "string", description: "create：登录名" },
      name: { type: "string", description: "create：展示名（缺省 = 登录名）" },
      role: { type: "string", enum: ["admin", "user"], description: "create：角色（缺省 user）" },
      quotas: { type: "object", description: "set_quota：{ \"<对外标识（别名 ∥ provider/model）>\": N|null }" },
      disables: { type: "object", description: "set_disables：{ \"<对外标识>\": true|null }" },
    }),
    fn("providers", desc(
      "provider 管理（控制台 Provider 页同函数——保存即热生效）。动词：", CHAT_TOOL_OPS.providers.join(" ∥ "),
      "。add ⟮name,baseURL,apiKey?,models?,proxy?,modelMeta?⟯；update ⟮id,name?,baseURL?,apiKey?,models?,proxy?,settings?（键级合并）,modelMeta?⟯（缺省 = 不动；apiKey 回显为掩码，明文不回）；",
      "remove ⟮id⟯；discover ⟮baseURL,apiKey?,providerId?,proxy?⟯ 探上游 /models（不落库）。",
    ), {
      op: { type: "string", enum: CHAT_TOOL_OPS.providers, description: "动词" },
      id: { type: "number", description: "provider id（update ∥ remove）" },
      name: { type: "string", description: "provider 名（对外标识前缀）" },
      baseURL: { type: "string", description: "OpenAI 兼容根（如 https://api.example.com/v1）" },
      apiKey: { type: "string", description: "密钥明文 ∥ env:NAME 引用（只入库；回显恒掩码）" },
      models: { type: "array", description: "开放模型清单（字符串 ∥ { name, alias }）", items: { type: ["string", "object"] } },
      proxy: { type: "boolean", description: "上游请求是否走服务器代理串" },
      settings: { type: "object", description: "模型设置映射 { \"<上游模型名>\": { rpm ∥ tpm ∥ costIn ∥ costOut ∥ note ∥ quotaTokens } }" },
      modelMeta: { type: "object", description: "模型元数据留存图（白名单四字段）" },
      providerId: { type: "number", description: "discover：取库内该 provider 的 key/代理旗兜底" },
    }),
    fn("models", desc(
      "服务模型面（控制台服务模型页同函数——保存即热生效）。动词：", CHAT_TOOL_OPS.models.join(" ∥ "),
      "。enable ⟮provider,model⟯ 加开放；disable ⟮provider,model⟯ 减项；settings ⟮provider,model,settings⟯ 子字段级合并（",
      "{ rpm ∥ tpm ∥ costIn ∥ costOut ∥ note ∥ quotaTokens }，值 null = 清该项）；alias ⟮provider,model,alias⟯ 设/清别名（alias 空 = 清除；全服唯一）。",
    ), {
      op: { type: "string", enum: CHAT_TOOL_OPS.models, description: "动词" },
      provider: { type: "string", description: "provider 名 ∥ id" },
      model: { type: "string", description: "模型（enable = 上游模型名；余动词 = 上游名 ∥ 别名）" },
      settings: { type: "object", description: "settings：{ rpm ∥ tpm ∥ costIn ∥ costOut ∥ note ∥ quotaTokens }" },
      alias: { type: "string", description: "alias：别名（空 ∥ null = 清除）" },
    }),
    fn("usage", `用量报表（控制台用量页同源）。动词：${CHAT_TOOL_OPS.usage.join(" ∥ ")}。summary 出 totals/byModel/byMember；rows 出逐行明细（limit ≤ ${TOOL_USAGE_LIMIT_MAX}）。过滤：member（id ∥ 用户名 ∥ 展示名）∥ model（对外标识）∥ endpoint（chat ∥ embeddings）∥ from/to（unix ms）。`, {
      op: { type: "string", enum: CHAT_TOOL_OPS.usage, description: "动词" },
      member: { type: "string", description: "成员过滤" },
      model: { type: "string", description: "模型过滤（对外标识）" },
      endpoint: { type: "string", enum: ["chat", "embeddings"], description: "端点过滤" },
      from: { type: "number", description: "起始时刻（unix ms）" },
      to: { type: "number", description: "结束时刻（unix ms）" },
      limit: { type: "number", description: `rows：行数（≤ ${TOOL_USAGE_LIMIT_MAX}）` },
    }),
    fn("audit", `审计事件查询（控制台审计页同函数，倒序）。动词：${CHAT_TOOL_OPS.audit.join(" ∥ ")}。过滤：type（十三型枚举）∥ member ∥ from/to（unix ms）∥ limit（≤ 500）。`, {
      op: { type: "string", enum: CHAT_TOOL_OPS.audit, description: "动词" },
      type: { type: "string", description: "事件型（如 agent_event ∥ sandbox_event ∥ login_failure ⋯）" },
      member: { type: "string", description: "成员过滤（actor ∥ target）" },
      from: { type: "number", description: "起始时刻（unix ms）" },
      to: { type: "number", description: "结束时刻（unix ms）" },
      limit: { type: "number", description: "行数（≤ 500）" },
    }),
    fn("runners", `运行节点管理（控制台沙盒页运行面同函数）。动词：${CHAT_TOOL_OPS.runners.join(" ∥ ")}。list；add ⟮name,address⟯（连通自检 + 落行）；remove ⟮id,containers?,confirm?⟯——有承载工作区须 confirm:true；节点上有容器须选 containers: "keep"（原样留机）∥ "remove"（逐个强删）。`, {
      op: { type: "string", enum: CHAT_TOOL_OPS.runners, description: "动词" },
      name: { type: "string", description: "add：节点名（≤ 40）" },
      address: { type: "string", description: "add：Docker API 地址（如 10.0.0.5:2375）" },
      id: { type: "number", description: "remove：节点 id" },
      containers: { type: "string", enum: ["keep", "remove"], description: "remove：容器处置" },
      confirm: { type: "boolean", description: "remove：确认丢弃承载工作区绑定" },
    }),
    fn("docker", `对**已注册节点**的 Docker API 执行一个动词（与控制台容器面同一客户端）。动词：${DOCKER_OPS.join(" ∥ ")}。host = 注册节点名 ∥ 地址（未在册 ⇒ 报错——先 runners.list/add）。args 逐动词：{ image, tag } ∥ { name, body } ∥ { id } ∥ { all }。`, {
      host: { type: "string", description: "注册节点（名 ∥ 地址）" },
      op: { type: "string", enum: DOCKER_OPS, description: "Docker 动词" },
      args: { type: "object", description: "动词参数（如 { image, tag } ∥ { name, body } ∥ { id } ∥ { all }）" },
    }, ["host", "op"]),
  ]

  return {
    names: CHAT_TOOL_NAMES,
    ops: CHAT_TOOL_OPS,
    schemas,
    invoke,
  }
}
