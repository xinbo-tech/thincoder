#!/usr/bin/env node
/**
 * cli.mjs — 运维 CLI（ops/OPS.md §3——八命令）：member add/list/quota/passwd ∥ key issue/revoke/list ∥ usage reconcile。
 * 直开库（不经 HTTP）——服务器本机兜底；与页面同库同语义（KD-SV-7 ∥ accounts/ACCOUNTS.md §3）。
 * 审计：改动类四命令（member add ∥ member passwd ∥ key issue ∥ key revoke）各记一条审计事件
 * （`actor = "cli"`——ACCOUNTS.md §2.1；直开库同一连接内写入）。
 *
 * 运行：node src/ops/cli.mjs --config <配置档> <命令>
 * （配置用于定位库——db 相对 = 配置档所在目录；配置校验照常 fail-closed；输出走 stdout，错误走 stderr + 非零退出。）
 */
import { realpathSync } from "node:fs"
import { pathToFileURL } from "node:url"

import { recordAudit } from "../accounts/audit.mjs"
import { findKeysByHint, getKeyById, issueKey, listKeys, revokeKey } from "../accounts/keys.mjs"
import { createMember, findMemberById, findMemberByName, generateTempPassword, listMembers, mergeMemberModelQuotas, parseModelQuotas, setMemberPassword } from "../accounts/members.mjs"
import { revokeMemberSessions } from "../accounts/session.mjs"
import { reconcileUsage } from "../metering/aggregates.mjs"
import { monthlyTokensByMember } from "../metering/usage.mjs"
import { openDatabase } from "../store/db.mjs"
import { loadConfig } from "./config.mjs"

export const USAGE = [
  "用法：node src/ops/cli.mjs --config <配置档> <命令>",
  "  member add <name> [--username <u>] [--role admin|user] [--password <pw>]   # 建成员（缺省 username = name ∥ user；无 --password ⇒ 生成临时密码打印一次）",
  "  member list                           # 成员 + 角色 + 分模型覆盖数 + 本月已用",
  "  member quota <name> <model> <N|none>  # 设分模型覆盖（model = 对外标识；none = 删覆盖）",
  "  member passwd <name> [--password <pw>]  # 重置密码（本机兜底；无 --password ⇒ 生成打印一次）",
  "  key issue <member>                    # 签发——全文只打印一次（+ key id）",
  "  key revoke <id|hint>                  # 吊销（立即生效）",
  "  key list [--member <m>]               # 提示形清单（无明文）",
  "  usage reconcile [--month YYYY-MM] [--fix]  # 派生两表对账重算（vs 明细；--fix = 覆写）",
].join("\n")

const OPTION_NAMES = ["config", "username", "role", "password", "member", "month"]
const FLAG_NAMES = ["fix"] // 布尔开关（裸出现 = true；不吃后续位置参数）

/** argv 解析：`--名 值` ∥ `--名=值` ∥ 开关（`--fix`）；其余 = 位置参数（`<group> <action> ...`）。 */
export function parseCliArgs(argv) {
  const options = {}
  const positional = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith("--")) {
      positional.push(arg)
      continue
    }
    const eq = arg.indexOf("=")
    const name = eq >= 0 ? arg.slice(2, eq) : arg.slice(2)
    if (FLAG_NAMES.includes(name)) {
      options[name] = eq >= 0 ? arg.slice(eq + 1) : true
      continue
    }
    if (!OPTION_NAMES.includes(name)) throw new Error(`未知参数：--${name}\n${USAGE}`)
    const value = eq >= 0 ? arg.slice(eq + 1) : i + 1 < argv.length && !argv[i + 1].startsWith("--") ? argv[++i] : null
    if (value === null) throw new Error(`参数缺值：--${name}（值以「--」开头时用 --${name}=<值> 形式）`)
    options[name] = value
  }
  const [group, action, ...rest] = positional
  return { configPath: options.config ?? null, group: group ?? null, action: action ?? null, positional: rest, options }
}

function requireMemberByName(db, name) {
  if (!name) throw new Error("缺少成员 <name>（寻址用展示名——见 member list）")
  const member = findMemberByName(db, name)
  if (!member) throw new Error(`成员不存在：${name}`)
  return member
}

function parseQuota(value) {
  if (!/^\d+$/.test(value)) throw new Error(`额度非法：${value}（非负整数或 none）`)
  return Number(value)
}

/** 漂移行读数（`usage reconcile` 输出形——键 · 实 ∥ 算）。 */
function formatDrift(drift) {
  const row = (side) => (side === null ? "缺行" : Object.entries(side).map(([key, value]) => `${key}=${value}`).join(" "))
  return `${Object.values(drift.key).join(" · ")}：实 ${row(drift.actual)} ∥ 算 ${row(drift.expected)}`
}

/** `usage` 子命令（OPS §3）：`reconcile [--month YYYY-MM] [--fix]`——派生两表 vs 明细重算（缺省月 = 当本月）。 */
function dispatchUsage(db, action, options, stdout) {
  if (action !== "reconcile") throw new Error(`未知 usage 子命令：${action ?? "（缺）"}\n${USAGE}`)
  const month = options.month ?? null
  if (month !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error(`--month 形非法：${month}（YYYY-MM）`)
  const report = reconcileUsage(db, { month, fix: options.fix === true })
  stdout.write(`对账（${report.month}）：usage_daily 比对 ${report.daily.checked} 键 ∥ 漂移 ${report.daily.drifted.length} 行；quota_counters 比对 ${report.counters.checked} 键 ∥ 漂移 ${report.counters.drifted.length} 行\n`)
  for (const drift of report.daily.drifted) stdout.write(`  - usage_daily ${formatDrift(drift)}\n`)
  for (const drift of report.counters.drifted) stdout.write(`  - quota_counters ${formatDrift(drift)}\n`)
  if (report.fixed) stdout.write("已按重算值覆写（--fix）——复查零漂\n")
  return 0
}

async function dispatchMember(db, action, positional, options, stdout) {
  if (action === "add") {
    const name = positional[0]
    if (!name) throw new Error("用法：member add <name> [--username <u>] [--role admin|user] [--password <pw>]")
    const { member, password, generated } = await createMember(db, {
      username: options.username ?? name,
      name,
      role: options.role ?? "user",
      password: options.password ?? null,
    })
    // 审计（ACCOUNTS §2.1——CLI 口径：actor = "cli" ∥ actor_id NULL）：建成员记录
    recordAudit(db, { type: "member_create", actor: "cli", actorId: null, target: member.name, targetId: member.id, detail: { role: member.role } })
    stdout.write(`成员已建：id=${member.id} name=${member.name} username=${member.username} role=${member.role}\n`)
    if (generated) stdout.write(`初始密码（一次性——请立即转达本人）：${password}\n`)
    return 0
  }
  if (action === "list") {
    const used = monthlyTokensByMember(db)
    stdout.write("id\tname\tusername\trole\tquotas\tused\n")
    for (const member of listMembers(db)) {
      const quotas = Object.keys(parseModelQuotas(member.model_quotas_json)).length // 分模型覆盖数（OPS §3）
      stdout.write(`${member.id}\t${member.name}\t${member.username}\t${member.role}\t${quotas}\t${used.get(member.id) ?? 0}\n`)
    }
    return 0
  }
  if (action === "quota") {
    const [name, model, value] = positional
    if (!name || !model || value === undefined) throw new Error("用法：member quota <name> <model> <N|none>")
    const member = requireMemberByName(db, name)
    const quota = value === "none" ? null : parseQuota(value)
    const updated = mergeMemberModelQuotas(db, member.id, { [model]: quota }) // 键级合并（其余键不动）
    const keys = Object.keys(parseModelQuotas(updated.model_quotas_json)).length
    stdout.write(quota === null ? `覆盖已删：${member.name} ⇒ ${model}（现存 ${keys} 键）\n` : `覆盖已设：${member.name} ⇒ ${model} = ${quota}（现存 ${keys} 键）\n`)
    return 0
  }
  if (action === "passwd") {
    const member = requireMemberByName(db, positional[0])
    const generated = options.password === undefined || options.password === null
    const password = generated ? generateTempPassword() : options.password
    await setMemberPassword(db, member.id, password)
    revokeMemberSessions(db, member.id) // 重置语义（KD-SV-14 同口径：旧密失效 + 全会话吊销）
    recordAudit(db, { type: "password_reset", actor: "cli", actorId: null, target: member.name, targetId: member.id, detail: {} })
    stdout.write(`密码已重置：${member.name}（原会话已全部吊销）\n`)
    if (generated) stdout.write(`临时密码（一次性——请立即转达本人）：${password}\n`)
    return 0
  }
  throw new Error(`未知 member 子命令：${action ?? "（缺）"}\n${USAGE}`)
}

function resolveKeyRef(db, ref) {
  if (/^\d+$/.test(ref)) {
    const key = getKeyById(db, Number(ref))
    if (!key) throw new Error(`key 不存在：${ref}`)
    return key
  }
  const matches = findKeysByHint(db, ref)
  if (matches.length > 1) throw new Error(`提示形不唯一（${matches.length} 行）——请改用 id：${ref}`)
  if (matches.length === 0) throw new Error(`key 不存在：${ref}`)
  return matches[0]
}

function dispatchKey(db, action, positional, options, stdout) {
  if (action === "issue") {
    const member = requireMemberByName(db, positional[0])
    const issued = issueKey(db, member.id)
    recordAudit(db, { type: "key_issue", actor: "cli", actorId: null, target: "", targetId: null, detail: { keyHint: issued.hint } })
    stdout.write(`key 已签发：id=${issued.id} member=${member.name}\n${issued.plain}\n（全文仅此一次——此后只显示提示形 ${issued.hint}）\n`)
    return 0
  }
  if (action === "revoke") {
    const ref = positional[0]
    if (!ref) throw new Error("用法：key revoke <id|hint>")
    const key = resolveKeyRef(db, ref)
    const changed = revokeKey(db, key.id)
    // 审计（§2.1 表——对象 = key 失主）：吊销记录
    const owner = findMemberById(db, key.member_id)
    recordAudit(db, { type: "key_revoke", actor: "cli", actorId: null, target: owner?.name ?? "", targetId: key.member_id, detail: { keyHint: key.key_hint } })
    stdout.write(
      changed
        ? `key 已吊销：id=${key.id} ${key.key_hint}（立即生效）\n`
        : `key 已是吊销态：id=${key.id} ${key.key_hint}\n`,
    )
    return 0
  }
  if (action === "list") {
    const member = options.member ? requireMemberByName(db, options.member) : null
    stdout.write("id\tmember\thint\tstatus\tcreated_at\n")
    for (const key of listKeys(db, { memberId: member?.id ?? null })) {
      stdout.write(`${key.id}\t${key.member_name}\t${key.key_hint}\t${key.status}\t${key.created_at}\n`)
    }
    return 0
  }
  throw new Error(`未知 key 子命令：${action ?? "（缺）"}\n${USAGE}`)
}

async function dispatch(db, { group, action, positional, options }, stdout) {
  if (group === "member") return dispatchMember(db, action, positional, options, stdout)
  if (group === "key") return dispatchKey(db, action, positional, options, stdout)
  if (group === "usage") return dispatchUsage(db, action, options, stdout)
  throw new Error(`未知命令：${[group, action].filter(Boolean).join(" ") || "（缺）"}\n${USAGE}`)
}

/** 入口：解析 → 配置（定位库）→ 开库 → 派发；任何失败 ⇒ stderr + 退出码 1。 */
export async function runCli(argv = process.argv.slice(2), { stdout = process.stdout, stderr = process.stderr } = {}) {
  try {
    const parsed = parseCliArgs(argv)
    if (!parsed.group) {
      stderr.write(`${USAGE}\n`)
      return 1
    }
    const { config } = loadConfig(parsed.configPath)
    const db = openDatabase(config.db)
    try {
      return await dispatch(db, parsed, stdout)
    } finally {
      db.close()
    }
  } catch (e) {
    stderr.write(`错误：${e.message}\n`)
    return 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  process.exitCode = await runCli()
}
