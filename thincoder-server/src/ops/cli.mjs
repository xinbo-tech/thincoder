#!/usr/bin/env node
/**
 * cli.mjs — 运维 CLI（ops/OPS.md §3——七命令）：member add/list/quota/passwd ∥ key issue/revoke/list。
 * 直开库（不经 HTTP）——服务器本机兜底；与页面同库同语义（KD-SV-7 ∥ accounts/ACCOUNTS.md §3）。
 *
 * 运行：node src/ops/cli.mjs --config <配置档> <命令>
 * （配置用于定位库——db 相对 = 配置档所在目录；配置校验照常 fail-closed；输出走 stdout，错误走 stderr + 非零退出。）
 */
import { pathToFileURL } from "node:url"

import { findKeysByHint, getKeyById, issueKey, listKeys, revokeKey } from "../accounts/keys.mjs"
import { createMember, findMemberByName, generateTempPassword, listMembers, setMemberPassword, setMemberQuota } from "../accounts/members.mjs"
import { revokeMemberSessions } from "../accounts/session.mjs"
import { monthlyTokensByMember } from "../metering/usage.mjs"
import { openDatabase } from "../store/db.mjs"
import { loadConfig } from "./config.mjs"

export const USAGE = [
  "用法：node src/ops/cli.mjs --config <配置档> <命令>",
  "  member add <name> [--username <u>] [--role admin|user] [--password <pw>]   # 建成员（缺省 username = name ∥ user；无 --password ⇒ 生成临时密码打印一次）",
  "  member list                           # 成员 + 角色 + 额度 + 本月已用",
  "  member quota <name> <N|none>          # 设额度（none = 不限）",
  "  member passwd <name> [--password <pw>]  # 重置密码（本机兜底；无 --password ⇒ 生成打印一次）",
  "  key issue <member>                    # 签发——全文只打印一次（+ key id）",
  "  key revoke <id|hint>                  # 吊销（立即生效）",
  "  key list [--member <m>]               # 提示形清单（无明文）",
].join("\n")

const OPTION_NAMES = ["config", "username", "role", "password", "member"]

/** argv 解析：`--名 值` ∥ `--名=值`；其余 = 位置参数（`<group> <action> ...`）。 */
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
  if (!/^\d+$/.test(value)) throw new Error(`额度非法：${value}（正整数或 none）`)
  return Number(value)
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
    stdout.write(`成员已建：id=${member.id} name=${member.name} username=${member.username} role=${member.role}\n`)
    if (generated) stdout.write(`初始密码（一次性——请立即转达本人）：${password}\n`)
    return 0
  }
  if (action === "list") {
    const used = monthlyTokensByMember(db)
    stdout.write("id\tname\tusername\trole\tquota\tused\n")
    for (const member of listMembers(db)) {
      stdout.write(`${member.id}\t${member.name}\t${member.username}\t${member.role}\t${member.quota_tokens ?? "不限"}\t${used.get(member.id) ?? 0}\n`)
    }
    return 0
  }
  if (action === "quota") {
    const [name, value] = positional
    if (!name || value === undefined) throw new Error("用法：member quota <name> <N|none>")
    const member = requireMemberByName(db, name)
    const quotaTokens = value === "none" ? null : parseQuota(value)
    setMemberQuota(db, member.id, quotaTokens)
    stdout.write(`额度已设：${member.name} ⇒ ${quotaTokens ?? "不限"}\n`)
    return 0
  }
  if (action === "passwd") {
    const member = requireMemberByName(db, positional[0])
    const generated = options.password === undefined || options.password === null
    const password = generated ? generateTempPassword() : options.password
    await setMemberPassword(db, member.id, password)
    revokeMemberSessions(db, member.id) // 重置语义（KD-SV-14 同口径：旧密失效 + 全会话吊销）
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
    stdout.write(`key 已签发：id=${issued.id} member=${member.name}\n${issued.plain}\n（全文仅此一次——此后只显示提示形 ${issued.hint}）\n`)
    return 0
  }
  if (action === "revoke") {
    const ref = positional[0]
    if (!ref) throw new Error("用法：key revoke <id|hint>")
    const key = resolveKeyRef(db, ref)
    const changed = revokeKey(db, key.id)
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await runCli()
}
