#!/usr/bin/env node
/**
 * main.mjs — Electron 主进程入口（`docs/desktop/design/SHELL.md` §1 / §2）：旗标 → 单实例锁 → 下限自检 → 协议 → 通道 → 窗口 → 冒烟读数。
 * 启动序**单线**（批档 §2.4）：`--smoke` 解析 → `requestSingleInstanceLock()` → 非主实例分支（不开窗）→ 下限自检
 * （调用点先于协议 / 窗口注册——U4）→ `registerAppScheme()`（ready 前）→ `await app.whenReady()` → `serveAppProtocol()`
 * → `registerIpcHandlers()` → `createWindow()` → 加载完 → 冒烟读回 → 单行 JSON → `app.exit(0)`；常态（无 `--smoke`）= 窗口常驻。
 * stdout 只许一行 JSON（读数面；日志与栈一律 stderr）——`process.stdout.write` 仅本档一处。
 */
import { app } from "electron"
import { hostFloorMet, MIN_NODE, sqliteAvailable } from "./host-floor.mjs"
import { protocolStats, registerAppScheme, serveAppProtocol } from "./protocol.mjs"
import { ipcStats, registerIpcHandlers, setAgentHost } from "./ipc.mjs"
import { createAgentHost } from "./agent-host.mjs"
import { currentCwd } from "./projects.mjs"
import { createWindow, probesSatisfied, runSmoke } from "./window.mjs"

const SMOKE = process.argv.includes("--smoke")
const TIMEOUT_MS = 20_000
const EXIT = Object.freeze({ OK: 0, FLOOR: 3, TIMEOUT: 4, FATAL: 5 })
const errors = []
const recordError = (message) => errors.push(message)
let reported = false
/** 窗口句柄（出站面取值）：宿主装配早于建窗 ⇒ emit 闭包读本变量（建窗前零事件 ⇒ 丢弃）。 */
let win = null

/** 单行 JSON 读数（字段闭集 = 批档 §2.4 + 收正⑧）：`patch` 覆盖缺省面；超时与异常路径同样走本函数。 */
function report(patch, code) {
  if (reported) return
  reported = true
  const payload = {
    smoke: 1, lock: "primary", window: false, node: process.versions.node, sqlite: false, floorMet: false,
    protocol: { served: protocolStats.served, blocked: protocolStats.blocked, probes: [] },
    boot: "none", configKeys: ipcStats.configKeys, channels: [...ipcStats.channels], errors: [...errors],
    ok: false, ...patch,
  }
  if (SMOKE) process.stdout.write(`${JSON.stringify(payload)}\n`)
  else console.error(`[main] exit ${code}${errors.length ? ` — ${errors[0]}` : ""}`)
  app.exit(code)
}

/** 致命面（未捕获异常 / 未处理拒绝）：记错 + 打 JSON + 退出 5——不以抛栈了事。 */
function fatal(error) {
  recordError(`fatal: ${error?.stack ?? error}`)
  report({}, EXIT.FATAL)
}

async function main() {
  if (SMOKE) {
    setTimeout(() => {
      recordError(`smoke timeout after ${TIMEOUT_MS}ms`)
      report({}, EXIT.TIMEOUT)
    }, TIMEOUT_MS)
  }

  if (!app.requestSingleInstanceLock()) {
    // 非主实例：不开窗 · 零分发（批档 §2.11 收正⑦ / ⑩）——常态第二实例静默退出；`--smoke` 时 JSON 明示。
    return report({ lock: "secondary", window: false, channels: [], ok: true }, EXIT.OK)
  }

  const floorMet = hostFloorMet(process.versions.node) // 纯谓词（零 electron 依赖面 = host-floor.mjs）
  const sqlite = await sqliteAvailable() // 唯一 await：内置模块导入（「不越 ready 前窗」= 未核实——Electron 行为面，本仓无可读面）
  if (!floorMet || !sqlite) {
    recordError(`host floor not met: node ${process.versions.node} (need >= ${MIN_NODE}) · sqlite ${sqlite}`)
    return report({ floorMet, sqlite }, EXIT.FLOOR)
  }

  registerAppScheme() // ready 前 · 仅一次
  await app.whenReady()
  serveAppProtocol()
  // 宿主装配（出站 emit 注入；建窗晚于本行 ⇒ 闭包读 `win`）——先于通道注册（处理体取宿主）。
  setAgentHost(createAgentHost({
    emit: (channel, payload) => {
      if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
    },
    projects: { currentCwd },
  }))
  registerIpcHandlers()
  win = createWindow(recordError)
  if (!SMOKE) return // 常态启动 = 窗口常驻（不取读数、不退出）

  const reading = await runSmoke(win, recordError)
  const ok =
    floorMet && sqlite && reading.loaded && reading.protocol.served > 0 && reading.protocol.blocked >= 5 && // 负探针 5 枚（R1 增 `rcEscape` / `escapeSrc`）——计数与逐探针读数双证
    reading.boot === "ok" && errors.length === 0 && probesSatisfied(reading.protocol.probes)
  if (!ok) {
    recordError(`smoke not ok: loaded=${reading.loaded} served=${reading.protocol.served} blocked=${reading.protocol.blocked} boot=${reading.boot}`)
  }
  report({ window: reading.loaded, floorMet, sqlite, protocol: reading.protocol, boot: reading.boot, ok }, ok ? EXIT.OK : EXIT.FATAL)
}

process.on("uncaughtException", fatal)
process.on("unhandledRejection", fatal)
main().catch(fatal)
