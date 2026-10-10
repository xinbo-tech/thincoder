/**
 * netfilter.mjs — 网络层出站强制（sandbox/RUNNER.md §4.1；KD-SV-76 载体）：
 * 每工作区桥链（nft 优先 ∥ iptables 备；**全量重算幂等**——不增量改链）：
 *   FORWARD（盒 → 外）：默认 drop；放行 = ① 回包 established/related ② 内置服务器网关（模型调用生命线——`ip:port`）
 *     ③ 出站闸代理（桥地址:proxyPort——宿主终结面见 INPUT）④ CIDR 规则集（求值序同控制面：内置恒拒 ⇒ 显式 deny ⇒
 *     显式 allow ⇒ 种子 deny ⇒ 种子 allow —— 首命中即裁定，末条 drop）；
 *   INPUT（盒 → runner 宿主面）：仅放行 → proxyPort；其余拒（宿主服务面不可达——探针 P2）。
 * 恒拒（已裁 U2——非行不可改）：`127.0.0.0/8` ∥ `169.254.0.0/16`（链首 drop——先于一切规则与内置允许）。
 * 规则来源 = 控制面全量（poll 随 rulesRev 下发）；变更 ⇒ 全量重算（不重建盒——P11）。
 * 本档 = 链生成（纯函数，批内件直断）+ 应用/自检（`exec` 注入；真机应用 = 收口轮）。
 */
import { lookup } from "node:dns/promises"

import { HARD_DENY_CIDRS, rankOfRule } from "../rules.mjs"

/** 表名（全量重算点——delete table ⇒ `-f` 整表重建）。 */
export const NFT_TABLE = "tc_sandbox"
export const IPT_CHAIN_FWD = "TC_SANDBOX_FWD"
export const IPT_CHAIN_IN = "TC_SANDBOX_IN"

/** 探测（§7 第 3 项）：nft 优先（`list ruleset` 可达 = 具 CAP_NET_ADMIN）∥ iptables 备（`-S` 可达）。 */
export async function detectNetfilter({ exec }) {
  const nft = await exec("nft", ["list", "ruleset"], { timeoutMs: 15000 })
  if (nft.code === 0) return { tool: "nft", ok: true, detail: "nft 在场且可写（list ruleset 可达）" }
  const ipt = await exec("iptables", ["-S"], { timeoutMs: 15000 })
  if (ipt.code === 0) return { tool: "iptables", ok: true, detail: "iptables 备选在场且可写（-S 可达）" }
  return { tool: null, ok: false, detail: "nft/iptables 均不可用（或权限不足——FORWARD/INPUT 需 CAP_NET_ADMIN）" }
}

/** 服务器网关允许项（内置——生命线）：从 `--server` URL 解析（域名 ⇒ 全地址）。 */
export async function serverAllowEntries(serverUrl, { lookupFn = lookup } = {}) {
  let url
  try {
    url = new URL(serverUrl)
  } catch {
    return []
  }
  const port = Number(url.port) || (url.protocol === "https:" ? 443 : 80)
  const entries = []
  try {
    const results = await lookupFn(url.hostname, { all: true })
    for (const item of Array.isArray(results) ? results : [results]) entries.push({ ip: item.address, port })
  } catch {
    return []
  }
  return entries
}

/** CIDR 规则求值序归一（控制面已排；此处防御性重排——同 rank ⇒ priority ⇒ id——单源求值序不变）。 */
export function sortCidrRules(rules) {
  return [...(rules ?? [])]
    .filter((rule) => rule?.kind === "cidr")
    .sort((a, b) => rankOfRule(a) - rankOfRule(b) || (a.priority ?? 0) - (b.priority ?? 0) || a.id - b.id)
}

/** 单条 CIDR 规则的 nft 匹配段（端口/协议 NULL ⇒ 不限）。 */
export function nftRuleLine(rule) {
  const verdict = rule.action === "allow" ? "accept" : "drop"
  let portMatch = ""
  if (rule.port !== null && rule.port !== undefined) {
    if (rule.protocol === "tcp") portMatch = `tcp dport ${rule.port} `
    else if (rule.protocol === "udp") portMatch = `udp dport ${rule.port} `
    else portMatch = `th dport ${rule.port} `
  } else if (rule.protocol === "tcp" || rule.protocol === "udp") {
    portMatch = `meta l4proto ${rule.protocol} `
  }
  return `\t\tip daddr ${rule.target} ${portMatch}${verdict}`
}

/**
 * nft 规则集生成（全量——纯函数）。
 * `workspaces` = `[{ id, subnet, gateway, rules }]`（rules = 控制面全量 CIDR 行）；`serverAllow` = 内置允许 `[{ ip, port }]`。
 */
export function buildNftRuleset({ workspaces = [], proxyPort = 3128, serverAllow = [] } = {}) {
  const lines = [`table ip ${NFT_TABLE} {`]
  lines.push("\tchain forward {")
  lines.push("\t\ttype filter hook forward priority -10; policy accept;")
  for (const ws of workspaces) lines.push(`\t\tip saddr ${ws.subnet} jump ws${ws.id}_fwd`)
  lines.push("\t}")
  lines.push("\tchain input {")
  lines.push("\t\ttype filter hook input priority -10; policy accept;")
  for (const ws of workspaces) lines.push(`\t\tip saddr ${ws.subnet} jump ws${ws.id}_in`)
  lines.push("\t}")
  for (const ws of workspaces) {
    lines.push(`\tchain ws${ws.id}_fwd {`)
    lines.push("\t\tct state established,related accept")
    for (const cidr of HARD_DENY_CIDRS) lines.push(`\t\tip daddr ${cidr} drop`) // 恒拒（非行——先于一切）
    for (const entry of serverAllow) lines.push(`\t\tip daddr ${entry.ip} tcp dport ${entry.port} accept`) // 内置生命线
    if (ws.gateway) lines.push(`\t\tip daddr ${ws.gateway} tcp dport ${proxyPort} accept`) // 出站闸代理
    for (const rule of sortCidrRules(ws.rules)) lines.push(nftRuleLine(rule))
    lines.push("\t\tdrop")
    lines.push("\t}")
    lines.push(`\tchain ws${ws.id}_in {`)
    lines.push("\t\tct state established,related accept")
    lines.push(`\t\ttcp dport ${proxyPort} accept`) // 仅放行 → proxyPort
    lines.push("\t\tdrop")
    lines.push("\t}")
  }
  lines.push("}")
  return `${lines.join("\n")}\n`
}

/** 单条 CIDR 规则的 iptables 匹配段（协议 NULL + 端口在场 ⇒ 展开 tcp/udp 两条）。 */
export function iptablesRuleLines(rule, { chain }) {
  const verdict = rule.action === "allow" ? "ACCEPT" : "DROP"
  const head = ["-A", chain, "-d", rule.target]
  const protocols = rule.protocol ? [rule.protocol] : rule.port !== null && rule.port !== undefined ? ["tcp", "udp"] : [null]
  return protocols.map((protocol) => {
    const args = [...head]
    if (protocol) args.push("-p", protocol)
    if (rule.port !== null && rule.port !== undefined) args.push("--dport", String(rule.port))
    args.push("-j", verdict)
    return ["iptables", args]
  })
}

/** iptables 全量命令序（纯函数——`{ commands }`；应用时前后加链确保/清空与跳转重建，见 `applyNetfilter`）。 */
export function buildIptablesCommands({ workspaces = [], proxyPort = 3128, serverAllow = [] } = {}) {
  const commands = []
  for (const ws of workspaces) {
    const fwd = `TC_WS${ws.id}_FWD`
    const ins = `TC_WS${ws.id}_IN`
    commands.push(["iptables", ["-N", fwd]], ["iptables", ["-F", fwd]], ["iptables", ["-N", ins]], ["iptables", ["-F", ins]])
    commands.push(["iptables", ["-A", IPT_CHAIN_FWD, "-s", ws.subnet, "-j", fwd]])
    commands.push(["iptables", ["-A", IPT_CHAIN_IN, "-s", ws.subnet, "-j", ins]])
    commands.push(["iptables", ["-A", fwd, "-m", "conntrack", "--ctstate", "ESTABLISHED,RELATED", "-j", "ACCEPT"]])
    for (const cidr of HARD_DENY_CIDRS) commands.push(["iptables", ["-A", fwd, "-d", cidr, "-j", "DROP"]])
    for (const entry of serverAllow) commands.push(["iptables", ["-A", fwd, "-d", entry.ip, "-p", "tcp", "--dport", String(entry.port), "-j", "ACCEPT"]])
    if (ws.gateway) commands.push(["iptables", ["-A", fwd, "-d", ws.gateway, "-p", "tcp", "--dport", String(proxyPort), "-j", "ACCEPT"]])
    for (const rule of sortCidrRules(ws.rules)) commands.push(...iptablesRuleLines(rule, { chain: fwd }))
    commands.push(["iptables", ["-A", fwd, "-j", "DROP"]])
    commands.push(["iptables", ["-A", ins, "-m", "conntrack", "--ctstate", "ESTABLISHED,RELATED", "-j", "ACCEPT"]])
    commands.push(["iptables", ["-A", ins, "-p", "tcp", "--dport", String(proxyPort), "-j", "ACCEPT"]])
    commands.push(["iptables", ["-A", ins, "-j", "DROP"]])
  }
  return commands
}

/** 删除旧跳转（幂等面——有界重试；返回执行过的命令数）。 */
async function clearJumps({ exec }) {
  let removed = 0
  for (const [hook, chain] of [["FORWARD", IPT_CHAIN_FWD], ["INPUT", IPT_CHAIN_IN]]) {
    for (let i = 0; i < 10; i++) {
      const res = await exec("iptables", ["-D", hook, "-j", chain], { timeoutMs: 15000 })
      if (res.code !== 0) break
      removed += 1
    }
  }
  return removed
}

/**
 * 应用（全量重算幂等）：
 * - nft：`delete table`（缺 ⇒ 忽略）⇒ `nft -f -`（规则集文本入 stdin）；
 * - iptables：链确保/清空 ⇒ 旧跳转删除 ⇒ 重建 ⇒ 顶插跳转。
 * 返回 `{ ok, tool, detail }`（失败 ⇒ ok: false——调用方按拒跑/降级处置）。
 */
export async function applyNetfilter({ exec, tool, workspaces = [], proxyPort = 3128, serverAllow = [] } = {}) {
  if (tool === "nft") {
    await exec("nft", ["delete", "table", "ip", NFT_TABLE], { timeoutMs: 15000 }) // 缺表 ⇒ 非零（忽略——全量重建）
    const res = await exec("nft", ["-f", "-"], { input: Buffer.from(buildNftRuleset({ workspaces, proxyPort, serverAllow })), timeoutMs: 30000 })
    return { ok: res.code === 0, tool, detail: res.code === 0 ? `nft 全量重算完成（${workspaces.length} 工作区）` : `nft -f 失败：${(res.stderr ?? "").toString("utf8").trim()}` }
  }
  if (tool === "iptables") {
    for (const chain of [IPT_CHAIN_FWD, IPT_CHAIN_IN]) {
      await exec("iptables", ["-N", chain], { timeoutMs: 15000 }) // 已在 ⇒ 非零（忽略）
      await exec("iptables", ["-F", chain], { timeoutMs: 15000 })
    }
    await clearJumps({ exec })
    const commands = buildIptablesCommands({ workspaces, proxyPort, serverAllow })
    for (const [cmd, args] of commands) {
      const res = await exec(cmd, args, { timeoutMs: 15000 })
      // `-N`（建链）在链已存在时返回非零——全量重算幂等面：忽略（同 `:166` 基链口径）；其余命令严判
      if (res.code !== 0 && args[0] !== "-N") return { ok: false, tool, detail: `iptables ${args.join(" ")} 失败（code = ${res.code}）` }
    }
    for (const [hook, chain] of [["FORWARD", IPT_CHAIN_FWD], ["INPUT", IPT_CHAIN_IN]]) {
      const res = await exec("iptables", ["-I", hook, "1", "-j", chain], { timeoutMs: 15000 })
      if (res.code !== 0) return { ok: false, tool, detail: `iptables -I ${hook} 失败（code = ${res.code}）` }
    }
    return { ok: true, tool, detail: `iptables 全量重算完成（${workspaces.length} 工作区）` }
  }
  return { ok: false, tool: null, detail: "无可用网络工具（nft/iptables 皆缺——拒跑）" }
}

/** 自检（§4.1「`nft list ruleset` 可达 ∥ 链计数在场」）：返回 `{ ok, detail, chains }`。 */
export async function selfCheck({ exec, tool }) {
  if (tool === "nft") {
    const res = await exec("nft", ["list", "table", "ip", NFT_TABLE], { timeoutMs: 15000 })
    if (res.code !== 0) return { ok: false, chains: 0, detail: "nft 表不在场（未应用或已清）" }
    const text = (res.stdout ?? "").toString("utf8")
    const chains = (text.match(/^\s*chain\s/gm) ?? []).length
    return { ok: chains >= 2, chains, detail: `链计数 = ${chains}（forward/input + 每工作区两链）` }
  }
  if (tool === "iptables") {
    const res = await exec("iptables", ["-S", IPT_CHAIN_FWD], { timeoutMs: 15000 })
    const lines = (res.stdout ?? "").toString("utf8").split("\n").filter((line) => line.trim() !== "")
    return { ok: res.code === 0 && lines.length > 0, chains: lines.length > 0 ? 1 : 0, detail: `FORWARD 链规则行 = ${lines.length}` }
  }
  return { ok: false, chains: 0, detail: "无可用网络工具" }
}
