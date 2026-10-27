/**
 * chat-env.mjs — 环境块装配（`agent/ADMIN-AGENT.md` §14.1 ∥ KD-SV-112；admin-agent-awareness 批——台账 #1310）：
 * 四块 = ① 时空 ∥ ② 所在/身份 ∥ ③ 所管现况一行（三活体——每回合现读、**尾位瞬态**：不落库、不进回放）∥
 * ④ 能力与边界（`CHAT_LIMITS_BLOCK` 静态段 + 活体面 = 当回合 `tools.schemas`——装配归 `chat.mjs`）。
 *
 * 行形逐字 = §14.1 表；`[System reminder: ` 族前缀 = 三端同形标记（① 与核 `thincoder-core/agent/setup.mjs` `pushEnvStateReminder`/`pushPeerReminder` 同文）。
 * **块级降级**（KD-SV-112③）：该块任一读失败 ⇒ **整行略去**（无半真值上屏），其余行照常、回合不阻断（不抛、不 notice）。
 * 取值源（§14.1）：① `now()`（注入面）∥ ② `process`/`os` 直读 + 版本 = `readPackageVersion()`（`ops/update.mjs` 单源）
 * ∥ ③ 域件进程内直取（`listRunners` ∥ `modelEntriesOf(listProviderEntries(db))` ∥ `listMembers`——读数级）。
 * 部署身份探针**非抛**（§14.1）：容器 ∨ systemd 服务 ∨ 独立进程——三判据读取异常 ⇒ 按「独立进程」落值（降级唯块级）。
 */
import { existsSync } from "node:fs"
import { hostname } from "node:os"
import { listMembers } from "../accounts/members.mjs"
import { listProviderEntries, modelEntriesOf } from "../gateway/providers.mjs"
import { readPackageVersion } from "../ops/update.mjs"
import { listRunners } from "../sandbox/registry.mjs"

/** 族前缀（三端同形——行形判别面）。 */
export const ENV_LINE_PREFIX = "[System reminder: "

/** 第四块静态段（§14.1 ④——工具族清单 ∥ 限额 ∥ 边界；活体面 = 当回合 `tools.schemas`——能力清单的真体现）。
 *  对位约束：每件注册工具名须以独立 token 在场（§14.2 八件——server-wake-face 批：`read_history` 入册 ∥ `bash.async` 在册 ∥
 *  timer 空闲唤醒在册）。 */
export const CHAT_LIMITS_BLOCK = [
  "# 能力与边界",
  "工具族：环境族 = get_current_time（时间）∥ process（进程 list ∥ kill）∥ timer（提醒）∥ ls ∥ read ∥ grep（文件读取族）∥ bash（命令）∥ read_history（本会话历史查询——只读）；管理族 = members ∥ providers ∥ models ∥ usage ∥ audit ∥ runners ∥ docker ∥ exec（在已注册主机上跑一条命令——凭据在「主机凭据」弹窗录入）∥ mcp（MCP 服务器清单：list ∥ add ∥ update ∥ remove ∥ probe；已配服务器的工具随回合并入——可直接调用）。",
  "限额：bash 超时缺省 120000 ms（可加大——无上限）；bash async（后台任务）可用（帽 4——回执即工具结果，结算摘要随下一轮送达）；单次工具结果对模型可见 ≤4000 字（超长自行收窄：read 用 offset/limit ∥ grep 带 glob ∥ bash 用 filter）。",
  "边界：无路径围栏（工作目录 = server 进程 cwd）；无文件编辑族工具（写入仍可经 bash 抵达）；命令非零退出不是工具失败（退出码在输出文本内）；timer 到期且会话空闲 ⇒ 自唤醒一轮投递；read_history 作用域 = 本会话（path 不可用）。",
].join("\n")

/** 部署身份（§14.1——判据明列；探针非抛）。 */
export function deployIdentity(env = process.env, { exists = existsSync } = {}) {
  try {
    if (exists("/.dockerenv") || exists("/run/.containerenv")) return "容器"
    if (typeof env?.INVOCATION_ID === "string" && env.INVOCATION_ID.trim() !== "") return "systemd 服务"
  } catch {
    /* 探针异常 ⇒ 按「独立进程」落值（§14.1——②行无字段级略去，降级唯块级） */
  }
  return "独立进程"
}

/** ① 时空行（逐字 = 核同文——本地时间 sv-SE ∥ IANA 时区）。 */
export function timeLine({ now = Date.now } = {}) {
  const local = new Date(now()).toLocaleString("sv-SE")
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "local"
  return `${ENV_LINE_PREFIX}current time is ${local} (local; timezone ${tz})].`
}

/** ② 所在/身份行（逐字 = §14.1 表；`reasoning` 未设 ⇒ 「未设」）。 */
export function identityLine({ version, deploy, host, platform, arch, node, pid, cwd, model, reasoning = null }) {
  return `${ENV_LINE_PREFIX}env: thincoder-server ${version}（${deploy}）∥ host: ${host} ∥ platform: ${platform} ${arch} ∥ node: ${node} ∥ pid: ${pid} ∥ cwd: ${cwd} ∥ model: ${model} ∥ reasoning: ${reasoning ?? "未设"}].`
}

/** ③ 所管现况行（逐字 = §14.1 表；注册态分布——在线性/容器数走工具按需探，§14.1 父侧裁）。 */
export function stateLine({ runners = [], providers = [], members = [] } = {}) {
  const active = runners.filter((row) => row.status === "active").length
  const disabled = runners.filter((row) => row.status === "disabled").length
  const models = providers.reduce((sum, entry) => sum + modelEntriesOf(entry.models).length, 0)
  return `${ENV_LINE_PREFIX}管理面现况：注册节点 ${runners.length}（active ${active} ∥ disabled ${disabled}）∥ 服务模型 ${models} ∥ 成员 ${members.length}].`
}

/**
 * 三活体行装配（§14.1——块级降级：逐块 try，失败者整行略去、余行照常、绝不抛）。
 * 出 = 行文数组（0..3 行；序 = ① ② ③——timer 到期行另经 `chat-env-tools.mjs` 随组同落）。
 */
export function buildEnvLines({ db, model = null, reasoning = null, cwd = null, now = Date.now, env = process.env, version = null } = {}) {
  const lines = []
  try {
    lines.push(timeLine({ now }))
  } catch {
    /* 块级降级（①） */
  }
  try {
    lines.push(identityLine({
      version: version ?? readPackageVersion(),
      deploy: deployIdentity(env),
      host: hostname(),
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      pid: process.pid,
      cwd,
      model,
      reasoning,
    }))
  } catch {
    /* 块级降级（②） */
  }
  try {
    lines.push(stateLine({ runners: listRunners(db), providers: listProviderEntries(db), members: listMembers(db) }))
  } catch {
    /* 块级降级（③） */
  }
  return lines
}
