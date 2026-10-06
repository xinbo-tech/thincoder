#!/usr/bin/env node
/**
 * thincoder-server.mjs — 服务入口（ops/OPS.md §4）：argv（`--config`）→ 配置加载/校验 → 开库/迁移 →
 * 路由注册 → `node:http` 监听 → 就绪日志；SIGINT/SIGTERM ⇒ 优雅停机（停收新连 ∥ 关库）。
 *
 * 本档 = 装配面（配置 ∥ 库 ∥ 首启引导 ∥ 各域注册行）——D1 骨架 + D2 账号/计量面 + D3 聊天链
 * （bootstrap + gateway ∥ accounts ∥ metering 注册行）+ D4 webui 静态面（`public/` 直发——路由优先）。
 */
import { pathToFileURL } from "node:url"

import { loadConfig } from "../src/ops/config.mjs"
import { createLogger } from "../src/ops/log.mjs"
import { openDatabase } from "../src/store/db.mjs"
import { createGatewayServer, createRouteTable } from "../src/gateway/server.mjs"
import { registerGatewayRoutes } from "../src/gateway/routes.mjs"
import { ensureBootstrap } from "../src/accounts/members.mjs"
import { registerAccountRoutes } from "../src/accounts/routes.mjs"
import { registerAdminRoutes } from "../src/accounts/routes-admin.mjs"
import { registerMeteringRoutes } from "../src/metering/routes.mjs"
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

/** 入口主流程：装配 → 监听 → 信号接线；启动失败 ⇒ 明确报错 + 非零退出（fail-closed）。 */
export async function run(argv = process.argv.slice(2), log = createLogger()) {
  let db = null
  let app = null
  try {
    const { configPath } = parseArgs(argv)
    const { config, warnings } = loadConfig(configPath)
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
    const routes = createRouteTable()
    registerGatewayRoutes(routes, { db, config }) // D3 面：/v1/chat/completions ∥ /v1/models（团队 key 鉴权）
    registerAccountRoutes(routes, { db }) // D2 面：login ∥ logout ∥ me ∥ me/password ∥ me/keys/rotate
    registerAdminRoutes(routes, { db })   // D2 面：members 列表/建 ∥ 吊销 ∥ 重置
    registerMeteringRoutes(routes, { db }) // D2 面：用量查询 ∥ 设额度
    // D4 面：webui 静态面（`public/` 直发——注册路由优先；`/v1/*` ∥ `/api/*` 不走静态面）
    const server = createGatewayServer({ config, routes, log, staticSite: createStaticSite() })
    app = { server, db }
    await new Promise((resolve, reject) => {
      server.once("error", reject)
      server.listen(config.port, config.host, resolve)
    })
    log.info("ready", { host: config.host, port: config.port, db: config.db, routes: routes.size })
  } catch (e) {
    try {
      db?.close()
    } catch {
      /* 启动失败路径的清理——原始错误优先 */
    }
    log.error("startup_failed", { message: e.message })
    process.exitCode = 1
    return
  }
  let stopping = false
  const stop = (signal) => {
    if (stopping) return
    stopping = true
    log.info("shutdown", { signal })
    closeApp({ ...app, log }).then(() => {
      log.info("stopped")
      process.exitCode = 0
    })
  }
  process.on("SIGINT", () => stop("SIGINT"))
  process.on("SIGTERM", () => stop("SIGTERM"))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await run()
