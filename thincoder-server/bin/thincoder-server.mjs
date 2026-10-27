#!/usr/bin/env node
/**
 * thincoder-server.mjs — 服务入口（ops/OPS.md §4）：argv（`--config`）→ 配置加载/校验 → 开库/迁移 →
 * 首启引导（种子导入 ∥ 注册表构建——§1）→ **保留清理（用量 + 审计事件——启动一次 + 24h 周期——`metering/METERING.md` §1 ∥
 * `accounts/ACCOUNTS.md` §2.1）** → 路由注册（含系统面 ∥ 控制台数据面——`gateway/API.md` §2.3 ∥ §2.4）→ 监听（`node:http`；`tls.enabled` 时 `node:https`）→ 就绪日志（含 `version`——§5.4(g)）；
 * **沙盒执行面装配（盒 ticker 30s——`sandbox/EXECUTION.md` §3）**；**内置 TLS 终止（`tls` 段——`gateway/PUBLICNET.md` §2）：
 * 启动期读证书 ∥ `SIGHUP` 热换证 ∥ HTTP→HTTPS 重定向监听（308）**；**匿名入口 IP 限流（`rateLimits` 段——判点 = `gateway/server.mjs`）
 * 与安全事件审计（`security_event` 四 kind——`security_event` 行写入面 = 本处）**；SIGINT/SIGTERM ⇒
 * 优雅停机（清周期定时器（更新循环 ∥ 保留清理 ∥ 盒 ticker——§4 同法） ∥ 停收新连 ∥ 关库）；更新循环接线（自检/自升——§5.4(a)(c)：
 * 自升成功亦走停机路径——`signal: "self-update"`）。
 *
 * 本档 = 装配面（配置 ∥ 库 ∥ 首启引导 ∥ 各域注册行 + 系统面 + 控制台数据面）——D1 骨架 + D2 账号/计量面 + D3 聊天链
 * （bootstrap + gateway ∥ accounts ∥ metering 注册行）+ D4 webui 静态面（`public/` 直发——路由优先）+ D5 更新面。
 */
import { realpathSync } from "node:fs"
import { pathToFileURL } from "node:url"

import { loadConfig } from "../src/ops/config.mjs"
import { createLogger } from "../src/ops/log.mjs"
import { createUpdater, readPackageVersion } from "../src/ops/update.mjs"
import { openDatabase } from "../src/store/db.mjs"
import { createGatewayServer, createRedirectServer, createRouteTable, loadTlsMaterial } from "../src/gateway/server.mjs"
import { createIpLimiter, rateLimitRules } from "../src/gateway/limits.mjs"
import { registerGatewayRoutes } from "../src/gateway/routes.mjs"
import { registerProviderAdminRoutes } from "../src/gateway/provider-admin.mjs"
import { registerSystemRoutes } from "../src/gateway/system.mjs"
import { registerEmbeddingAdminRoutes } from "../src/gateway/embedding-admin.mjs"
import { registerConfigAdminRoutes } from "../src/gateway/config-admin.mjs"
import { registerOverviewRoutes } from "../src/gateway/overview.mjs"
import { registerProxyAdminRoutes } from "../src/gateway/proxy-admin.mjs"
import { registerSandboxRoutes } from "../src/sandbox/routes.mjs"
import { createTerminalHub } from "../src/sandbox/terminal-routes.mjs"
import { createHostExec, TICK_INTERVAL_MS, tickBoxes } from "../src/sandbox/box.mjs"
import { registerRegistryCredRoutes } from "../src/sandbox/registry-cred-routes.mjs"
import { registerImageSourceRoutes } from "../src/sandbox/image-source-routes.mjs"
import { registerChatRoutes } from "../src/agent/chat-routes.mjs"
import { closeMcpConnections } from "../src/mcp/face.mjs"
import { registerMcpRoutes } from "../src/mcp/routes.mjs"
import { registerMemberFaceRoutes } from "../src/agent/member-routes.mjs"
import { registerProjectRoutes } from "../src/project/routes.mjs"
import { registerProjectAdminRoutes } from "../src/project/admin-routes.mjs"
import { registerProjectWebhookRoutes } from "../src/project/webhooks.mjs"
import { registerLedgerRoutes } from "../src/ledger/routes.mjs"
import { registerClientLedgerRoutes } from "../src/ledger/client-routes.mjs"
import { createSyncScheduler } from "../src/project/sync.mjs"
import { ensureBootstrap, findMemberByUsername } from "../src/accounts/members.mjs"
import { createLoginGuard } from "../src/accounts/login-guard.mjs"
import { pruneAuditEvents, recordAudit } from "../src/accounts/audit.mjs"
import { registerAccountRoutes } from "../src/accounts/routes.mjs"
import { registerAdminRoutes } from "../src/accounts/routes-admin.mjs"
import { registerClientRoutes } from "../src/client/routes.mjs"
import { registerMeteringRoutes } from "../src/metering/routes.mjs"
import { USAGE_PRUNE_INTERVAL_MS, pruneUsage } from "../src/metering/usage.mjs"
import { createStaticSite } from "../src/webui/static.mjs"

export const USAGE = "用法：thincoder-server --config <配置档>"

/** argv 解析：`--config <档>` 必填（并列形式 `--config=<档>`）；未知参数 ⇒ 抛。 */
export function parseArgs(argv) {
  let configPath = null
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--config") configPath = argv[++i] ?? null
    else if (arg.startsWith("--config=")) configPath = arg.slice("--config=".length)
    else throw new Error(`未知参数：${arg}\n${USAGE}`)
  }
  if (!configPath) throw new Error(`缺少 --config\n${USAGE}`)
  return { configPath }
}

/** 优雅停机：停收新连（空闲连接即断）⇒ 在途请求完成后关库；`graceMs` 超时 ⇒ 强制断连（防流式长连无限拖停）。 */
export function closeApp({ server, db, log, graceMs = 10000 }) {
  return new Promise((resolve) => {
    let timer = null
    server.close(() => {
      if (timer) clearTimeout(timer)
      try {
        db.close()
      } catch (e) {
        log?.warn("db_close_failed", { message: e.message })
      }
      resolve()
    })
    server.closeIdleConnections()
    timer = setTimeout(() => {
      log?.warn("shutdown_forced", { graceMs })
      server.closeAllConnections()
    }, graceMs)
    timer.unref()
  })
}

/** 路由族表（OPS.md §4.1 A1——族表驱动）：装配面按本表循环注册，一族一行；每族必带 `probe`（`{ method, path }`
 *  = 该族注册函数**自己**册内的一条端点——装配后逐族在路由表中命中，两两不重）。新增 ∥ 删除路由族 ⇒ 本表加/删一行
 *  （集合面计数由装配回归档的写死常量兜底：表缩水 ⇒ 该档红）。族间依赖经 `deps` 传递（Gateway 族产出的
 *  `providerRuntime`、`serverRef` ∥ `updater` 惰性取——注册序只看本表行序）。 */
export const ROUTE_FAMILIES = [
  { name: "Gateway", probe: { method: "GET", path: "/v1/models" },
    register: (routes, d) => { d.providerRuntime = registerGatewayRoutes(routes, { db: d.db, config: d.config, log: d.log }) } }, // D3 面：/v1/chat/completions ∥ /v1/models + provider 运行时引导（OPS §1）
  { name: "ProviderAdmin", probe: { method: "GET", path: "/api/admin/providers" },
    register: (routes, d) => registerProviderAdminRoutes(routes, { db: d.db, config: d.config, runtime: d.providerRuntime, log: d.log }) }, // provider 管理面（同实例——换表两族同见）
  { name: "Account", probe: { method: "GET", path: "/api/me" },
    register: (routes, d) => registerAccountRoutes(routes, { db: d.db, guard: d.guard }) }, // D2 面：login ∥ logout ∥ me ∥ me/password ∥ me/keys/rotate
  { name: "Admin", probe: { method: "GET", path: "/api/members" },
    register: (routes, d) => registerAdminRoutes(routes, { db: d.db, guard: d.guard }) }, // D2 面：members 列表/建 ∥ 吊销 ∥ 重置
  { name: "Client", probe: { method: "GET", path: "/api/client/me" },
    register: (routes, d) => registerClientRoutes(routes, { db: d.db, guard: d.guard }) }, // client 域（B1 批；KD-SV-61/62）
  { name: "Metering", probe: { method: "GET", path: "/api/usage" },
    register: (routes, d) => registerMeteringRoutes(routes, { db: d.db }) }, // D2 面：用量查询 ∥ 设额度
  // 系统面（gateway/API.md §2.3——/healthz 探活 ∥ /api/system；embedding.model = 运行时 accessor——#1152）
  { name: "System", probe: { method: "GET", path: "/healthz" },
    register: (routes, d) => registerSystemRoutes(routes, { db: d.db, version: d.version, getUpdateStatus: () => d.getUpdater()?.getStatus() ?? null, embedding: d.config.embedding, providerRuntime: d.providerRuntime }) },
  // 控制台数据面（gateway/API.md §2.4）：/api/overview ∥ /api/admin/embedding（+test）∥ 配置面 ∥ 代理连通测试
  { name: "Overview", probe: { method: "GET", path: "/api/overview" },
    register: (routes, d) => registerOverviewRoutes(routes, { db: d.db }) },
  { name: "EmbeddingAdmin", probe: { method: "GET", path: "/api/admin/embedding" },
    register: (routes, d) => registerEmbeddingAdminRoutes(routes, { db: d.db, config: d.config, log: d.log }) },
  { name: "ConfigAdmin", probe: { method: "GET", path: "/api/admin/config" },
    register: (routes, d) => registerConfigAdminRoutes(routes, { db: d.db, configPath: d.configPath, log: d.log }) }, // 文件面读写；生效 = 重启——KD-SV-56
  { name: "ProxyAdmin", probe: { method: "POST", path: "/api/admin/proxy/test" },
    register: (routes, d) => registerProxyAdminRoutes(routes, { db: d.db, log: d.log }) }, // 真打 ∥ 自含形；零落库零计费——KD-SV-60
  // 沙盒面（§2.5/§2.6——控制台 ∥ 成员面 + runner 通道；无 runner ⇒ 仅沙盒功能面不可用——KD-SV-71）
  { name: "Sandbox", probe: { method: "GET", path: "/api/admin/sandbox/overview" },
    register: (routes, d) => registerSandboxRoutes(routes, { db: d.db, config: d.config, log: d.log }) },
  { name: "RegistryCred", probe: { method: "GET", path: "/api/admin/sandbox/registry-credentials" },
    register: (routes, d) => registerRegistryCredRoutes(routes, { db: d.db, config: d.config }) }, // 私有仓凭据四端点（KD-SV-188）
  { name: "ImageSource", probe: { method: "GET", path: "/api/admin/sandbox/image-sources" },
    register: (routes, d) => registerImageSourceRoutes(routes, { db: d.db }) }, // 镜像源族（sandbox-image-sources 批）
  { name: "Mcp", probe: { method: "GET", path: "/api/admin/mcp" },
    register: (routes, d) => registerMcpRoutes(routes, { db: d.db, config: d.config, log: d.log }) }, // MCP 管理面（server-mcp 批）
  // 管理面 chat（§2.8——selfBaseUrl 惰性读监听地址：listen 后才有值；通配/环回换算归 `chat.mjs` `selfBaseOf`）
  { name: "Chat", probe: { method: "GET", path: "/api/admin/agent/chats" },
    register: (routes, d) => registerChatRoutes(routes, { db: d.db, log: d.log, deps: { runtime: d.providerRuntime, config: d.config, guard: d.guard, cwd: process.cwd(), selfBaseUrl: () => d.getServer()?.address() ?? null } }) },
  { name: "MemberFace", probe: { method: "GET", path: "/api/me/chat/models" },
    register: (routes, d) => registerMemberFaceRoutes(routes, { db: d.db, config: d.config, log: d.log }) }, // 成员面 chat + 工作区写面 + git 凭据 + 盒接入面（§2.11/§2.12）
  // 项目面（§2.9）：成员面六 ∥ 管理面十 ∥ 接收面一（公开——验签门）；调度器单例（三径共锁——手动 ∥ 定时 ∥ 事件）
  { name: "Project", probe: { method: "GET", path: "/api/projects" },
    register: (routes, d) => registerProjectRoutes(routes, { db: d.db }) },
  { name: "ProjectAdmin", probe: { method: "GET", path: "/api/admin/git-sources" },
    register: (routes, d) => registerProjectAdminRoutes(routes, { db: d.db, config: d.config, log: d.log, scheduler: d.projectSync }) },
  { name: "ProjectWebhook", probe: { method: "POST", path: "/api/hooks/git-sources/probe" }, // probe 走 `:id` 参数位（本族唯一路由 = 参数形）
    register: (routes, d) => registerProjectWebhookRoutes(routes, { db: d.db, config: d.config, log: d.log, scheduler: d.projectSync }) },
  // 团队台账域（§2.10——控制台四行 ∥ 端侧四行，同一域模块的薄适配两面）
  { name: "Ledger", probe: { method: "GET", path: "/api/ledger" },
    register: (routes, d) => registerLedgerRoutes(routes, { db: d.db }) },
  { name: "ClientLedger", probe: { method: "GET", path: "/api/client/ledger" },
    register: (routes, d) => registerClientLedgerRoutes(routes, { db: d.db }) },
]

/** 入口主流程：装配 → 监听 → 信号接线 + 更新循环；启动失败 ⇒ 明确报错 + 非零退出（fail-closed）。
 *  `update` = 更新器覆盖参数（单元测试档替身——缺省 `{}` ⇒ 生产行为不变；§5.4(c) 注入口径）。
 *  `onAssembled` = 装配探针（OPS.md §4.1）：装配完成、主监听之前回调一次探针载荷；缺省不传 ⇒ 生产行为逐字不变。 */
export async function run(argv = process.argv.slice(2), log = createLogger(), { update = {}, onAssembled } = {}) {
  let db = null
  let app = null
  let updater = null
  let pruneTimer = null
  let projectSync = null
  let terminalHub = null
  let boxTicker = null
  let tlsMaterial = null
  let redirectServer = null
  let onHangup = null
  let stopping = false
  let serverRef = null // 自环取数接点（§16.2——chat 路由惰性闭包读；listen 后落真值）
  /** 关一个可能未起/已关的 server（`close()` 对未监听实例会抛——启动失败径与停机共用）。 */
  const closeQuietly = (target) => {
    try {
      target?.close()
    } catch {
      /* 未监听 ∥ 已关——无物可收 */
    }
  }
  /** 优雅停机：清周期定时器（更新循环 ∥ 保留清理同法——§4；自升成功亦走本路径）⇒ 停收新连 ⇒ 关库。 */
  const stop = (signal) => {
    if (stopping) return
    stopping = true
    updater?.stop()
    if (pruneTimer) {
      clearInterval(pruneTimer)
      pruneTimer = null
    }
    if (boxTicker) {
      clearInterval(boxTicker)
      boxTicker = null
    }
    projectSync?.stop()
    terminalHub?.closeAll("server_stop") // 终端在飞会话全收口（升级 socket 不走 HTTP 层自动断——§3 停机行）
    closeQuietly(redirectServer) // 重定向监听同收（308 面不得阻停机）
    redirectServer?.closeIdleConnections?.()
    if (onHangup) {
      process.off("SIGHUP", onHangup) // 同进程重装配（测试）不堆积监听
      onHangup = null
    }
    // 信号监听口径：本件只摘 `SIGHUP`（A7 基线增量判据）；`SIGINT`/`SIGTERM` 监听不摘——装配契约 = 单进程单装配，
    // 同进程重装配（常驻装配回归档）由用例侧按监听器快照差集复原。
    closeMcpConnections({ log }) // MCP 面收口（§2.2——stdio 子进程（POSIX detached）不随父进程自然退出，须显式杀树；核件缺 ⇒ 零会话可关）
    log.info("shutdown", { signal })
    closeApp({ ...app, log }).then(() => {
      log.info("stopped")
      process.exitCode = 0
    })
  }
  try {
    const { configPath } = parseArgs(argv)
    const { config, warnings, configPath: configFile } = loadConfig(configPath)
    for (const warning of warnings) log.warn("config_warning", { message: warning })
    // 内置 TLS（gateway/PUBLICNET.md §2）：启用 ⇒ 启动期读证书 + `createSecureContext` 校验——
    // 读不到 ∥ 非 PEM ∥ 两件不成对 ⇒ 抛 ⇒ catch ⇒ `startup_failed` + 非零退出（fail-closed，不半起）
    if (config.tls?.enabled) tlsMaterial = loadTlsMaterial(config.tls)
    db = openDatabase(config.db)
    const bootstrap = await ensureBootstrap(db, config.bootstrap) // 首启引导（KD-SV-15——幂等）
    if (bootstrap.action === "created") log.info("bootstrap_admin_created", { username: bootstrap.username })
    else if (bootstrap.action === "warning") {
      log.warn("bootstrap_warning", {
        reason: bootstrap.reason,
        message: bootstrap.message ?? "零 admin 且未配置 bootstrap——可用 CLI「member add <name> --role admin」补建",
      })
    }
    // 保留清理（启动一次 + 24h 周期；定时器 unref——不阻停机）：用量（METERING §1）+ 审计事件（ACCOUNTS §2.1——同窗同清）
    pruneUsage(db, { retentionDays: config.usageRetentionDays })
    pruneAuditEvents(db, { retentionDays: config.usageRetentionDays })
    pruneTimer = setInterval(() => {
      try {
        pruneUsage(db, { retentionDays: config.usageRetentionDays })
      } catch (e) {
        log.warn("usage_prune_failed", { message: e.message }) // 周期清理失败不反噬服务（启动一次 = fail-closed）
      }
      try {
        pruneAuditEvents(db, { retentionDays: config.usageRetentionDays })
      } catch (e) {
        log.warn("audit_prune_failed", { message: e.message }) // 同口径（独立捕获——互不拖累）
      }
    }, USAGE_PRUNE_INTERVAL_MS)
    pruneTimer.unref?.()
    const version = readPackageVersion() // 前缀内实际安装版本（升级核对 = 重起读 ready 行——§5.4(g)；系统面同源）
    // 登录防爆破（ACCOUNTS §2——自助/管理两注册面共用同一实例）；锁触发 ⇒ 经 onLock 回调落审计（§2.1——装配接线 = 本处）
    const loginGuard = createLoginGuard({
      log,
      onLock: (info) => recordAudit(db, {
        type: "login_locked",
        actor: info.username, // 提交用户名（名快照——§2.1 表）
        actorId: findMemberByUsername(db, info.username)?.id ?? null, // 成员存在 ⇒ 其 id（同 login_failure 口径）
        target: "",
        targetId: null,
        detail: { ip: info.ip, dimension: info.dimension, retryAfterS: info.retryAfterS },
      }),
    })
    const routes = createRouteTable()
    // 安全事件审计（gateway/PUBLICNET.md §2——`security_event` 四 kind；actor 恒 = `server`）：
    // 审计写失败 ⇒ warn（不反噬服务——限流回调在请求路径上，不得因审计失败而炸）
    const auditSecurity = (detail) => {
      try {
        recordAudit(db, { type: "security_event", actor: "server", detail })
      } catch (e) {
        log.warn("security_audit_failed", { message: e?.message ?? String(e) })
      }
    }
    // 匿入入口限流（gateway/PUBLICNET.md §2——计数引擎 = 既有 `ratelimit.mjs`；阈值 = `rateLimits` 两键）：
    // `rateLimits.enabled: false` ⇒ 不限（limiter 缺位）；超限 ⇒ 审计 `rate_limit_burst`（同 IP 同窗聚合一行）
    const limiter = config.rateLimits?.enabled === false
      ? null
      : createIpLimiter({ rules: rateLimitRules(config.rateLimits), onBurst: (payload) => auditSecurity({ kind: "rate_limit_burst", ...payload }) })
    // 沙盒主机命令面（SSH 逐条——盒 ticker 装配用）
    const hostExec = createHostExec({ config })
    // 项目同步调度器（三径共锁——ProjectAdmin ∥ ProjectWebhook 入参；须先于路由族注册建）
    projectSync = createSyncScheduler({ db, config, log })
    // 路由族装配（OPS.md §4.1 A1——族表驱动）：按 ROUTE_FAMILIES 循环注册，每族一条表行；
    // 族间依赖经 familyDeps 传递（Gateway 族产出的 providerRuntime ∥ serverRef / updater 惰性取——注册序只看表序）。
    const familyDeps = {
      db, config, log, configPath: configFile, guard: loginGuard, version, projectSync,
      providerRuntime: null,
      getUpdater: () => updater,
      getServer: () => serverRef,
    }
    for (const family of ROUTE_FAMILIES) family.register(routes, familyDeps)
    projectSync.start()
    // D4 面：webui 静态面（`public/` 直发——注册路由优先；`/v1/*` ∥ `/api/*` 不走静态面）
    // 容器终端升级路（gateway/API.md §2.5 终端行 ∥ sandbox/SANDBOX.md §3——sandbox-container-terminal 批）：hub 持有在飞会话 + upgrade 挂点接线
    terminalHub = createTerminalHub({ db, config, log }) // config = 连接材料解密所需（TLS 档节点——`sandbox/SANDBOX.md` §3「生效面全谱」含终端；缺它 ⇒ 解密退相对路径）
    const server = createGatewayServer({ config, routes, log, staticSite: createStaticSite(), upgrade: terminalHub.handleUpgrade, tls: tlsMaterial, limits: limiter })
    serverRef = server // 自环取数接点（§16.2——路由注册时惰性闭包，此处落真值）
    app = { server, db }
    // HTTP→HTTPS 重定向监听（仅 `tls.enabled && redirectPort` 在场）：先起重定向面、后起主面——
    // 绑不上（EADDRINUSE ∥ EACCES）⇒ 拒启且 TLS 面不监听（不半起）；308 + `Location` 取配置主机名（不读 Host）
    if (config.tls?.enabled && config.tls.redirectPort !== null) {
      redirectServer = createRedirectServer({ tls: config.tls })
      await new Promise((resolve, reject) => {
        redirectServer.once("error", reject)
        redirectServer.listen(config.tls.redirectPort, config.host, resolve)
      })
      app.redirectServer = redirectServer
    }
    // 盒 ticker（sandbox/EXECUTION.md §3——30s 节拍：空闲/墙钟停 + 周期快照；unref——不阻停机）
    // 置于主监听之前：探针载荷 `timers.box` 须在 onAssembled 时就位（OPS.md §4.1）。
    boxTicker = setInterval(() => void tickBoxes(db, { config, log, host: hostExec }).catch((e) => log.warn("box_tick_failed", { message: e?.message ?? String(e) })), TICK_INTERVAL_MS) // host 注入 = 盒链 host 侧件透传（现无消费点——保留既有口径）
    boxTicker.unref?.()
    // 装配探针（OPS.md §4.1——装配完成、主监听之前回调一次）：载荷 = 装配面事实读数；缺省不传 ⇒ 生产行为逐字不变。
    if (onAssembled) {
      await onAssembled({ routes, server, redirectServer, config, timers: { prune: pruneTimer, box: boxTicker }, families: ROUTE_FAMILIES, terminalHub, stop })
    }
    await new Promise((resolve, reject) => {
      server.once("error", reject)
      server.listen(config.port, config.host, resolve)
    })
    // 证书轮换（SIGHUP）：重读 + `setSecureContext`；失败保留旧上下文继续服务（不因一张坏证把服务打挂）
    onHangup = () => {
      try {
        const next = loadTlsMaterial(config.tls)
        server.setSecureContext({ key: next.key, cert: next.cert })
        tlsMaterial = next
        log.info("cert_reloaded", { certPath: config.tls.certPath, keyPath: config.tls.keyPath })
        auditSecurity({ kind: "cert_reload" })
      } catch (e) {
        log.error("cert_reload_failed", { message: e?.message ?? String(e) })
        auditSecurity({ kind: "cert_reload_failed", reason: e?.message ?? String(e) })
      }
    }
    if (tlsMaterial !== null) process.on("SIGHUP", onHangup)
    log.info("ready", { host: config.host, port: config.port, db: config.db, routes: routes.size, version })
    if (tlsMaterial !== null) log.info("tls_start", { port: config.port, redirectPort: config.tls.redirectPort })
    if (tlsMaterial !== null) auditSecurity({ kind: "tls_start", port: config.port, redirectPort: config.tls.redirectPort })
    // 盒 ticker 已在主监听前装配（探针载荷 timers.box——见上）
    updater = createUpdater({ config, log, version, onSelfUpdate: () => stop("self-update"), ...update })
    updater.start() // 启动即检一次 + 周期（档位 = config.autoUpdate——false ⇒ 零检查）
  } catch (e) {
    closeQuietly(app?.server) // 监听已起（后置装配失败）⇒ 一并回收——防「能收连接但库已关」半挂态
    closeQuietly(redirectServer) // 重定向面同收（后置失败不半起）
    if (onHangup) {
      process.off("SIGHUP", onHangup) // 启动失败径也摘监听（进程内重装配不堆积）
      onHangup = null
    }
    // 失败径与 `stop()` 同口径：周期 ∥ 终端会话 ∥ 更新循环一并收（否则同进程再装配会带活周期指向已关库）
    if (pruneTimer) {
      clearInterval(pruneTimer)
      pruneTimer = null
    }
    projectSync?.stop()
    terminalHub?.closeAll("server_stop")
    updater?.stop()
    if (boxTicker) {
      clearInterval(boxTicker)
      boxTicker = null
    }
    try {
      db?.close()
    } catch {
      /* 启动失败路径的清理——原始错误优先 */
    }
    log.error("startup_failed", { message: e.message })
    process.exitCode = 1
    return
  }
  process.on("SIGINT", () => stop("SIGINT"))
  process.on("SIGTERM", () => stop("SIGTERM"))
}

// 入口判据：argv[1] 先经 realpath 解析再比——npm 全局装（POSIX）bin = 符号链接形：argv[1] 非真身路径，不解析 ⇒ 判据恒假 ⇒ 静默退出 0；不可解析 ⇒ 抛（显式，不静默）。
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) await run()
