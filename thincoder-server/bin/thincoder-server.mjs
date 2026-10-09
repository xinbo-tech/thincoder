#!/usr/bin/env node
/**
 * thincoder-server.mjs — 服务入口（ops/OPS.md §4）：argv（`--config`）→ 配置加载/校验 → 开库/迁移 →
 * 首启引导（种子导入 ∥ 注册表构建——§1）→ **保留清理（用量 + 审计事件——启动一次 + 24h 周期——`metering/METERING.md` §1 ∥
 * `accounts/ACCOUNTS.md` §2.1）** → 路由注册（含系统面 ∥ 控制台数据面——`gateway/API.md` §2.3 ∥ §2.4）→ `node:http` 监听 → 就绪日志（含 `version`——§5.4(g)）；SIGINT/SIGTERM ⇒
 * 优雅停机（清周期定时器（更新循环 ∥ 保留清理同法——§4） ∥ 停收新连 ∥ 关库）；更新循环接线（自检/自升——§5.4(a)(c)：
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
import { createGatewayServer, createRouteTable } from "../src/gateway/server.mjs"
import { registerGatewayRoutes } from "../src/gateway/routes.mjs"
import { registerProviderAdminRoutes } from "../src/gateway/provider-admin.mjs"
import { registerSystemRoutes } from "../src/gateway/system.mjs"
import { registerEmbeddingAdminRoutes } from "../src/gateway/embedding-admin.mjs"
import { registerConfigAdminRoutes } from "../src/gateway/config-admin.mjs"
import { registerOverviewRoutes } from "../src/gateway/overview.mjs"
import { ensureBootstrap, findMemberByUsername } from "../src/accounts/members.mjs"
import { createLoginGuard } from "../src/accounts/login-guard.mjs"
import { pruneAuditEvents, recordAudit } from "../src/accounts/audit.mjs"
import { registerAccountRoutes } from "../src/accounts/routes.mjs"
import { registerAdminRoutes } from "../src/accounts/routes-admin.mjs"
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

/** 入口主流程：装配 → 监听 → 信号接线 + 更新循环；启动失败 ⇒ 明确报错 + 非零退出（fail-closed）。
 *  `update` = 更新器覆盖参数（批内件替身——缺省 `{}` ⇒ 生产行为不变；§5.4(c) 注入口径）。 */
export async function run(argv = process.argv.slice(2), log = createLogger(), { update = {} } = {}) {
  let db = null
  let app = null
  let updater = null
  let pruneTimer = null
  let stopping = false
  /** 优雅停机：清周期定时器（更新循环 ∥ 保留清理同法——§4；自升成功亦走本路径）⇒ 停收新连 ⇒ 关库。 */
  const stop = (signal) => {
    if (stopping) return
    stopping = true
    updater?.stop()
    if (pruneTimer) {
      clearInterval(pruneTimer)
      pruneTimer = null
    }
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
    // D3 面：/v1/chat/completions ∥ /v1/models（团队 key 鉴权）；provider 运行时引导（种子导入 → 构建——OPS §1）
    const providerRuntime = registerGatewayRoutes(routes, { db, config, log })
    registerProviderAdminRoutes(routes, { db, config, runtime: providerRuntime, log }) // provider 管理面（同实例——换表两族同见）
    registerAccountRoutes(routes, { db, guard: loginGuard }) // D2 面：login ∥ logout ∥ me ∥ me/password ∥ me/keys/rotate
    registerAdminRoutes(routes, { db, guard: loginGuard })   // D2 面：members 列表/建 ∥ 吊销 ∥ 重置
    registerMeteringRoutes(routes, { db }) // D2 面：用量查询 ∥ 设额度
    // 系统面（gateway/API.md §2.3——首版完备化①③）：/healthz 探活 ∥ /api/system（惰性状态访问器——更新器在其后创建；embedding.model = 配置真值——地址不下发）
    registerSystemRoutes(routes, { db, version, getUpdateStatus: () => updater?.getStatus() ?? null, embedding: config.embedding })
    // 控制台数据面（gateway/API.md §2.4——功能点 15①③）：/api/overview（总览——与报表同源）∥ /api/admin/embedding（+test——配置真值 ∥ 探活/试跑）
    registerOverviewRoutes(routes, { db })
    registerEmbeddingAdminRoutes(routes, { db, config, log })
    registerConfigAdminRoutes(routes, { db, configPath: configFile, log }) // 配置面（§2.4——文件面读写；生效 = 重启——KD-SV-56）
    // D4 面：webui 静态面（`public/` 直发——注册路由优先；`/v1/*` ∥ `/api/*` 不走静态面）
    const server = createGatewayServer({ config, routes, log, staticSite: createStaticSite() })
    app = { server, db }
    await new Promise((resolve, reject) => {
      server.once("error", reject)
      server.listen(config.port, config.host, resolve)
    })
    log.info("ready", { host: config.host, port: config.port, db: config.db, routes: routes.size, version })
    updater = createUpdater({ config, log, version, onSelfUpdate: () => stop("self-update"), ...update })
    updater.start() // 启动即检一次 + 周期（档位 = config.autoUpdate——false ⇒ 零检查）
  } catch (e) {
    try {
      app?.server?.close() // 监听已起（后置装配失败）⇒ 一并回收——防「能收连接但库已关」半挂态
    } catch {
      /* 启动失败路径的清理——原始错误优先 */
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
