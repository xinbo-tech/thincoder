/**
 * egress.mjs — 出站闸代理（sandbox/RUNNER.md §4.2；KD-SV-75 载体）：node std（`node:http`+`node:net`+`node:dns`）自持代理——
 * CONNECT 隧道（HTTPS）+ 绝对 URI 转发（HTTP）；监听 proxyPort。
 * - **准入** = 源 IP 白名单（本机登记的盒网段——IP → 工作区映射；其余拒——不做开放代理）；
 * - **求值** = ① 域名（CONNECT host ∥ HTTP Host）精确 + 单层左通配（求值序同控制面：显式 deny 恒先——`rules.mjs` 单源）；
 *   ② 命中 allow ⇒ 解析（全地址）⇒ 每个解析 IP 过 CIDR 闸（恒拒/deny 命中 ⇒ 拒）⇒ **以已校验 IP 建连（PIN——不重解析）**，
 *   SNI/Host 携原域名（不 MITM——盒自身 TLS 端到端）；③ 未命中 ⇒ **待批挂起**（登记 + 裁定经 poll 下发；缺省 60s ⇒ 拒）。
 * - IP 目标（绝对 URI 直发代理面——工具受 HTTP_PROXY 驱动）：按 CIDR 规则同序求值（与网络层同规则同裁——
 *   防「经代理绕过 FORWARD 链」；设计句「直连 IP 目标不经代理」按「代理不引入域名面」读——实施判定，批档在册）。
 */
import { lookup } from "node:dns/promises"
import { Agent, createServer, request as httpRequest } from "node:http"
import { connect as netConnect, isIP } from "node:net"

import { HARD_DENY_CIDRS, cidrMatch, rankOfRule, ruleMatches } from "../rules.mjs"

export const DEFAULT_PENDING_TIMEOUT_SECONDS = 60
export const CONNECT_STATUS_LINE = "HTTP/1.1 200 Connection Established\r\n\r\n"

const normalizeAddr = (address) => (typeof address === "string" ? address.replace(/^::ffff:/, "") : "")

/** 规则序（控制面已排；防御性重排——同 rank ⇒ priority ⇒ id）。 */
export function sortEgressRules(rules) {
  return [...(rules ?? [])].sort((a, b) => rankOfRule(a) - rankOfRule(b) || (a.priority ?? 0) - (b.priority ?? 0) || a.id - b.id)
}

/** 域名求值（纯函数——单源求值序）：首命中即裁定；无命中 ⇒ `pending`（待批挂起）。 */
export function evaluateDomainRules(rules, host, { port = null, protocol = "tcp" } = {}) {
  for (const rule of sortEgressRules(rules)) {
    if (rule.kind !== "domain") continue
    if (!ruleMatches(rule, { host, port, protocol })) continue
    return { action: rule.action === "allow" ? "allow" : "deny", rule, reason: rule.action === "allow" ? "domain_allow" : "domain_deny" }
  }
  return { action: "pending", rule: null, reason: "domain_no_match" }
}

/** IP 目标求值（纯函数——恒拒 ⇒ 首命中规则 ⇒ 默认拒；与网络层 FORWARD 同序同裁）。 */
export function evaluateCidrTarget(rules, ip, { port = null, protocol = "tcp" } = {}) {
  if (HARD_DENY_CIDRS.some((cidr) => cidrMatch(cidr, ip))) return { action: "deny", rule: null, reason: "hard_deny" }
  for (const rule of sortEgressRules(rules)) {
    if (rule.kind !== "cidr") continue
    if (!ruleMatches(rule, { ip, port, protocol })) continue
    return { action: rule.action === "allow" ? "allow" : "deny", rule, reason: rule.action === "allow" ? "ip_allow" : "ip_deny" }
  }
  return { action: "deny", rule: null, reason: "ip_no_match" }
}

/** CIDR 闸（域名路径第二闸——解析 IP 逐项；恒拒/deny 命中 ⇒ 拒；无条目 ⇒ 不拦）。 */
export function cidrGate(rules, ips, { port = null, protocol = "tcp" } = {}) {
  for (const ip of ips) {
    if (HARD_DENY_CIDRS.some((cidr) => cidrMatch(cidr, ip))) return { action: "deny", reason: "hard_deny", ip }
  }
  for (const ip of ips) {
    for (const rule of sortEgressRules(rules)) {
      if (rule.kind !== "cidr") continue
      if (!ruleMatches(rule, { ip, port, protocol })) continue
      if (rule.action === "deny") return { action: "deny", reason: "ip_deny", rule, ip }
      break
    }
  }
  return { action: "allow", reason: "domain_allow" }
}

/** 一次性连接 agent（HTTP 转发径——已校验 IP 的 PIN socket 直用，不池化）。 */
class OneShotAgent extends Agent {
  #socket
  constructor(socket) {
    super({ keepAlive: false })
    this.#socket = socket
  }
  createConnection() {
    return this.#socket
  }
}

/**
 * 建代理。注入口径（批内件替身）：`resolveWorkspace`（准入——缺省全拒）∥ `resolveHost`（DNS）∥ `connectTarget`（PIN 建连——
 * 两径共用：CONNECT 隧道与 HTTP 转发都以**已校验 IP** 拨号）∥ `registerPending`（待批登记——缺省 = 本地超时拒）∥
 * `onActivity`（空闲 TTL 触达）。
 */
export function createEgressProxy({
  proxyPort = 3128,
  bindAddress = "0.0.0.0",
  rules = [],
  log = null,
  now = Date.now,
  resolveWorkspace = null,
  resolveHost = null,
  connectTarget = null,
  registerPending = null,
  onActivity = null,
  pendingTimeoutSeconds = DEFAULT_PENDING_TIMEOUT_SECONDS,
} = {}) {
  let currentRules = [...rules]
  const ephemeralAllows = new Set() // remember 决议的即时放行（规则下发前的窗口；rules 更新 ⇒ 由真实规则接管）
  const pendings = new Map() // id → { id, workspaceId, host, waiters, decision, timer }
  const stats = { allowed: 0, denied: 0, pending: 0, active: 0 }

  const lookupHost = resolveHost ?? (async (host) => (await lookup(host, { all: true })).map((item) => ({ address: item.address, family: item.family })))
  const dial = connectTarget ?? (({ ip, port, timeoutMs = 15000 }) => new Promise((resolve, reject) => {
    const socket = netConnect({ host: ip, port })
    const timer = setTimeout(() => { socket.destroy(); reject(new Error("connect timeout")) }, timeoutMs)
    socket.once("connect", () => { clearTimeout(timer); resolve(socket) })
    socket.once("error", (e) => { clearTimeout(timer); reject(e) })
  }))

  /** 域名经闸（allow ⇒ 解析 ⇒ CIDR 二查 ⇒ 校验后 IP 表）。 */
  async function allowPath(host, port) {
    let resolved
    try {
      resolved = (await lookupHost(host)).filter((item) => item.family === 4)
    } catch (e) {
      // 解析失败 ⇒ fail-closed（不得招——抛出会掀翻调用面；盒侧得 403）
      log?.warn("egress_dns_failed", { host, message: e.message })
      return { ok: false, reason: "dns_failed" }
    }
    const ips = resolved.map((item) => item.address)
    if (ips.length === 0) return { ok: false, reason: "no_ipv4" }
    const gate = cidrGate(currentRules, ips, { port })
    if (gate.action !== "allow") return { ok: false, reason: gate.reason, rule: gate.rule, ip: gate.ip }
    return { ok: true, ips } // PIN：建连只取此表（不再按域名重解析）
  }

  /** 单请求求值（两径共用）：`{ action: "allow", ips } | { action: "deny", reason } | { action: "pending", id, promise }`。 */
  async function adjudicate(workspaceId, host, port) {
    onActivity?.(workspaceId)
    if (ephemeralAllows.has(host.toLowerCase())) {
      const path = await allowPath(host, port)
      return path.ok ? { action: "allow", ips: path.ips } : { action: "deny", reason: path.reason }
    }
    if (isIP(host) === 4) {
      const verdict = evaluateCidrTarget(currentRules, host, { port })
      return verdict.action === "allow" ? { action: "allow", ips: [host] } : { action: "deny", reason: verdict.reason }
    }
    const verdict = evaluateDomainRules(currentRules, host, { port })
    if (verdict.action === "deny") return { action: "deny", reason: verdict.reason }
    if (verdict.action === "allow") {
      const path = await allowPath(host, port)
      return path.ok ? { action: "allow", ips: path.ips } : { action: "deny", reason: path.reason }
    }
    // 未命中 ⇒ 待批挂起（登记 + 上报；裁定经 poll 下发或超时）
    let timeoutSeconds = pendingTimeoutSeconds
    let pendingId = `local-${workspaceId}-${host.toLowerCase()}`
    if (registerPending) {
      try {
        const registered = await registerPending(workspaceId, host)
        if (registered?.id !== undefined && registered?.id !== null) pendingId = String(registered.id)
        if (Number(registered?.timeoutSeconds) > 0) timeoutSeconds = Number(registered.timeoutSeconds)
      } catch (e) {
        log?.warn("pending_register_failed", { workspaceId, host, message: e.message }) // 登记失败 ⇒ 本地窗超时拒（不静默放行）
      }
    }
    const entry = pendings.get(pendingId) ?? { id: pendingId, workspaceId, host, waiters: new Set(), decision: null, timer: null }
    if (entry.decision !== null) {
      // 已裁定/已超时的旧表项 ⇒ 本连接为新一轮（服务器侧同 host 再挂起 ⇒ 新行新 id；本地同 id 则重开）
      if (entry.timer) clearTimeout(entry.timer) // 旧表定时器一并清（防按 id 误删新表项）
      pendings.delete(pendingId)
      return adjudicate(workspaceId, host, port)
    }
    if (entry.timer === null) {
      entry.timer = setTimeout(() => settle(entry, "timeout"), timeoutSeconds * 1000)
      entry.timer.unref?.()
    }
    pendings.set(pendingId, entry)
    stats.pending += 1
    const promise = new Promise((resolve) => entry.waiters.add(resolve))
    return { action: "pending", id: pendingId, promise }
  }

  function settle(entry, decision) {
    if (entry.decision !== null) return
    entry.decision = decision
    if (entry.timer) clearTimeout(entry.timer)
    entry.timer = null
    for (const resolve of entry.waiters) resolve(decision)
    entry.waiters.clear()
    if (decision === "once" || decision === "remember") {
      if (decision === "remember") ephemeralAllows.add(entry.host.toLowerCase())
      stats.allowed += 1
    } else {
      stats.denied += 1
    }
    log?.info("pending_resolved", { id: entry.id, host: entry.host, decision })
    // 表项清理（裁定窗口 = 10 分钟——重发幂等窗内保留；过后未知 id 忽略即可）
    const gc = setTimeout(() => { if (pendings.get(entry.id) === entry) pendings.delete(entry.id) }, 10 * 60 * 1000)
    gc.unref?.()
  }

  /** 裁定入口（poll 下发消费）——未知 id（已超时/非本机）⇒ 忽略。 */
  function resolvePending(resolution = {}) {
    const entry = pendings.get(String(resolution.id))
    if (!entry) return false
    const decision = ["once", "remember", "deny", "timeout"].includes(resolution.decision) ? resolution.decision : "deny"
    settle(entry, decision)
    return true
  }

  function rejectRaw(socket, reason) {
    if (socket.destroyed) return
    socket.end(`HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\nX-TC-Reason: ${encodeReason(reason)}\r\n\r\n`)
  }

  function rejectHttp(res, reason) {
    if (!res.headersSent) {
      res.writeHead(403, { "content-type": "text/plain; charset=utf-8", "x-tc-reason": encodeReason(reason) })
      res.end(`出站闸代理：拒绝（${reason}）\n`)
    } else {
      res.destroy()
    }
  }

  /** 准入（源 IP 白名单）：非盒网段 ⇒ 拒（不做开放代理）并记数。 */
  function admit(req, onReject) {
    const ip = normalizeAddr(req.socket?.remoteAddress)
    const workspaceId = resolveWorkspace ? resolveWorkspace(ip) : null
    if (workspaceId === null) {
      stats.denied += 1
      log?.warn("egress_rejected_source", { ip })
      onReject("source-not-allowed")
      return null
    }
    return workspaceId
  }

  async function openPipe(clientSocket, upstream, head) {
    clientSocket.on("error", () => upstream.destroy())
    upstream.on("error", () => clientSocket.destroy())
    if (head && head.length > 0) upstream.write(head)
    clientSocket.pipe(upstream)
    upstream.pipe(clientSocket)
  }

  /** CONNECT 隧道（HTTPS——不 MITM：盒自身 TLS；SNI 由盒的 ClientHello 携原域名）。 */
  async function handleConnect(req, clientSocket, head) {
    const [hostPart, portText] = splitHostPort(req.url)
    const workspaceId = admit(req, (reason) => rejectRaw(clientSocket, reason))
    if (workspaceId === null) return
    const port = Number(portText) > 0 ? Number(portText) : 443
    const verdict = await adjudicateAsync(workspaceId, hostPart, port, (reason) => rejectRaw(clientSocket, reason))
    if (!verdict) return
    let socket = null
    try {
      for (const ip of verdict.ips) {
        try {
          socket = await dial({ ip, port })
          break
        } catch {
          /* 试下一已校验 IP（不重解析——PIN） */
        }
      }
      if (!socket) throw new Error("全部已校验 IP 建连失败")
      stats.active += 1
      socket.once("close", () => { stats.active -= 1 })
      if (clientSocket.destroyed) {
        socket.destroy()
        return
      }
      clientSocket.write(CONNECT_STATUS_LINE)
      await openPipe(clientSocket, socket, head)
    } catch (e) {
      if (socket) socket.destroy()
      rejectRaw(clientSocket, e.message)
    }
  }

  /** 绝对 URI 转发（HTTP——经典代理语义：请求行携绝对 URI；Host 携原域名）。 */
  async function handleHttp(req, res) {
    let target
    try {
      target = new URL(req.url)
    } catch {
      res.writeHead(400, { "content-type": "text/plain; charset=utf-8" })
      res.end("出站闸代理：请以绝对 URI 或 CONNECT 访问（非开放代理）\n")
      return
    }
    const workspaceId = admit(req, (reason) => rejectHttp(res, reason))
    if (workspaceId === null) return
    const port = Number(target.port) > 0 ? Number(target.port) : target.protocol === "https:" ? 443 : 80
    const verdict = await adjudicateAsync(workspaceId, target.hostname, port, (reason) => rejectHttp(res, reason))
    if (!verdict) return
    let settled = false
    const attempt = async (index) => {
      if (settled) return
      if (index >= verdict.ips.length) {
        settled = true
        rejectHttp(res, "全部已校验 IP 建连失败")
        return
      }
      let socket
      try {
        socket = await dial({ ip: verdict.ips[index], port }) // PIN：以已校验 IP 拨号（不按域名重解析）
      } catch {
        await attempt(index + 1)
        return
      }
      if (settled) {
        socket.destroy()
        return
      }
      const upstream = httpRequest({
        agent: new OneShotAgent(socket),
        host: target.hostname, // Host 头 = 原域名（不 MITM）
        port,
        method: req.method,
        path: `${target.pathname}${target.search}`,
        headers: { ...req.headers, host: target.host },
      })
      upstream.on("response", (upstreamRes) => {
        if (settled) return
        settled = true
        res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers)
        upstreamRes.pipe(res)
      })
      upstream.on("error", () => {
        socket.destroy()
        attempt(index + 1).catch(() => {
          settled = true
          rejectHttp(res, "全部已校验 IP 建连失败")
        })
      })
      req.pipe(upstream)
    }
    await attempt(0)
  }

  /** 求值 + 挂起等待（allow ⇒ `{ ips }`；拒 ⇒ 调 `onReject` 并返 null）。 */
  async function adjudicateAsync(workspaceId, host, port, onReject) {
    const verdict = await adjudicate(workspaceId, host, port)
    if (verdict.action === "allow") {
      stats.allowed += 1
      return { ips: verdict.ips }
    }
    if (verdict.action === "deny") {
      stats.denied += 1
      log?.info("egress_denied", { workspaceId, host, port, reason: verdict.reason })
      onReject(`denied-${verdict.reason}`)
      return null
    }
    const decision = await verdict.promise
    if (decision === "once" || decision === "remember") {
      const path = await allowPath(host, port)
      if (path.ok) return { ips: path.ips }
      onReject(`denied-${path.reason}`)
      return null
    }
    onReject(`pending-${decision}`)
    return null
  }

  const server = createServer()
  server.on("request", (req, res) => { handleHttp(req, res).catch((e) => rejectHttp(res, e?.message ?? "internal")) })
  server.on("connect", (req, socket, head) => { handleConnect(req, socket, head).catch((e) => { if (!socket.destroyed) rejectRaw(socket, e?.message ?? "internal") }) })
  server.on("clientError", (err, socket) => { if (!socket.destroyed) socket.destroy() })

  return {
    server,
    stats,
    pendings,
    listen: () => new Promise((resolve, reject) => {
      server.once("error", reject)
      server.listen(proxyPort, bindAddress, resolve)
    }),
    close: () => new Promise((resolve) => {
      // 在挂起表全量结清（拒——语义同超时）；否则等待者 promise 永不落定（停机面泄漏）
      for (const entry of pendings.values()) {
        if (entry.timer) clearTimeout(entry.timer)
        if (entry.decision === null) settle(entry, "deny")
      }
      server.closeAllConnections?.()
      server.close(() => resolve())
    }),
    /** 规则热换（域名面即生效——不重建盒）；remember 即时放行由真实规则接管（清除暂存）。 */
    updateRules: (next) => {
      currentRules = [...(next ?? [])]
      ephemeralAllows.clear()
    },
    resolvePending,
    /** 当前规则快照（诊断/自检面）。 */
    rulesNow: () => [...currentRules],
  }
}

/** `host:port` 拆解（CONNECT 请求行——IPv6 形不入 v1）。 */
export function splitHostPort(value) {
  const text = String(value ?? "").trim()
  const lastColon = text.lastIndexOf(":")
  if (lastColon < 0) return [text, ""]
  return [text.slice(0, lastColon), text.slice(lastColon + 1)]
}

function encodeReason(reason) {
  return String(reason ?? "denied").replace(/[\r\n]/g, " ").slice(0, 120)
}
