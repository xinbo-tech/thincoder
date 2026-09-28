#!/usr/bin/env node
/**
 * main.mjs — Electron 主进程入口（`docs/desktop/design/SHELL.md` §1 / §2）：旗标 → 单实例锁 → 下限自检 → 协议 → 通道 → 窗口 → 冒烟读数。
 * 启动序**单线**（批档 §2.4）：`--smoke` 解析 → `requestSingleInstanceLock()` → 非主实例分支（不开窗）→ 下限自检
 * （调用点先于协议 / 窗口注册——U4）→ `registerAppScheme()`（ready 前）→ `await app.whenReady()` → `serveAppProtocol()`
 * → `registerIpcHandlers()` → `createWindow()` → 加载完 → 冒烟读回 → 单行 JSON → `app.exit(0)`；常态（无 `--smoke`）= 窗口常驻。
 * **桌面空闲唤醒批**：通知装配注入三行（`Notification` 构造 ∕ 焦态 ∕ 聚焦——闭包读 `win`；策略面住 `notify.mjs`）。
 * stdout 只许一行 JSON（读数面；日志与栈一律 stderr）——`process.stdout.write` 仅本档一处。
 */
import { app, Notification } from "electron"
import { hostFloorMet, MIN_NODE, sqliteAvailable } from "./host-floor.mjs"
import { protocolStats, registerAppScheme, serveAppProtocol } from "./protocol.mjs"
import { ipcStats, setAgentHost, setLedgerEmit } from "./ipc.mjs"
import { registerIpcHandlers } from "./ipc-registry.mjs" // #28 拆点：表 ∕ 注册序出档（处理体本体住 `ipc.mjs`）
import { createAgentHost } from "./agent-host.mjs"
import { currentCwd } from "./projects.mjs"
// 会话维护线（R1 · 桌面功能对位批）：启动拍供面（GC ∕ 索引两枚延迟拍 —— 处理体同档）。
import { scheduleSessionMaintenancePasses } from "./session-maintenance.mjs"
// 台账刷新面收尾（R8 —— 拍面随开项目链重锚；窗口关 = 退出径同点——`stopLedgerRefresh` 幂等、核 interval 已 unref）。
import { stopLedgerRefresh } from "./project-info.mjs"
import { NEGATIVE_PROBE_COUNT, createWindow, probesSatisfied, runSmoke } from "./window.mjs"
// config 写盘感知（R8 · 桌面功能对位批 · C3）：核件 `config-watch` 桌面壳（`node:fs.watch` 源 + 自写抑制）。
import { startConfigWatch } from "./config-watch.mjs"
// 提示锚取值表（R4 · 桌面功能对位批 · #519）：核缝供值面（`prompt-files.mjs` `configurePromptInjections`）。
import { configurePromptInjections } from "@thincoder/core/prompt-files.mjs"
import { DESKTOP_PROMPT_INJECTIONS } from "./prompt-injections.mjs"

// 提示锚注册：**进程入口、任何装配之前**一次性（先例 = CLI `bin/thincoder.mjs:32` ∕ VSC `extension.mjs:92`）——
// 调用期应用（工具表装配晚于本行）⇒ 无导入序要求；漏配 ⇒ 锚字面静默进模型工具描述。
configurePromptInjections(DESKTOP_PROMPT_INJECTIONS)

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
  // 出站面（webContents 发送单点）：宿主 emit 与台账行出站共用（建窗晚于注入 ⇒ 闭包读 `win`；建窗前零事件 ⇒ 丢弃）。
  const emit = (channel, payload) => {
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
  }
  // 宿主装配（出站 emit 注入）——先于通道注册（处理体取宿主）。
  setAgentHost(createAgentHost({
    emit,
    projects: { currentCwd },
    // 完成提示面（KD-35）平台装配 —— 策略面 ∕ 平台面分家（策略 = `notify.mjs`：失焦门 + 两档合句；本处只落平台三件）：
    // 落子 = `Notification`（`title` 缺省 ⇒ 零携）+ 点击 ⇒ `reveal`；焦态源 = `win.isFocused()`（失焦门）。
    // 无窗口（建窗前 ∥ 已销毁）视为「已聚焦」⇒ 门闭合（无窗口可聚焦 / 可 reveal ⇒ 零通知——never noise）。
    notify: ({ title, body, reveal }) => {
      const toast = new Notification({ ...(title ? { title } : {}), body })
      if (typeof reveal === "function") toast.on("click", reveal)
      toast.show()
    },
    focused: () => !win || win.isDestroyed() || win.isFocused(),
    reveal: () => { if (win && !win.isDestroyed()) { win.show(); win.focus() } },
  }))
  // 台账行出站面（「对齐第三批」KD-38）：`session:resume` 成功径挂调用（`ipc.mjs`）——项目级自产事件，非会话回调。
  setLedgerEmit(emit)
  registerIpcHandlers()
  win = createWindow(recordError)
  // config 热更感知（R8 · C3——核 `config-watch.mjs` 桌面消费）：外部写盘（手编 ∕ CLI 端）⇒ 去抖 + 元组真变
  // ⇒ `ev:config`（宿主自产推送；渲染面设置面复读）；自写抑制 = 核 `onConfigSelfWrite`（核件缺省内接——端零自持，
  // 自身写盘不抖动）。生命周期随窗口：窗口 closed ⇒ 撤监视（单窗应用 = 退出径同点）。
  const configWatch = startConfigWatch({ onChange: () => emit("ev:config", { at: Date.now() }) })
  win.on("closed", () => { configWatch.dispose(); stopLedgerRefresh() }) // 生命周期随窗口：两长活面（监视 + 台账拍面）同点收尾
  // 启动拍（R1 · 会话维护 · KD-T4② 端层显式点火）：窗口起后两枚延迟拍（核侧 3s 启动窗外；异步非阻塞、
  // 失败静默 —— 索引 = 派生品）。GC 拍须项目 cwd：开机未开项目 ⇒ 此处零动作，由恢复入口（`ipc.mjs`
  // `session:resume` 成功径）同款点火；索引拍 = 全根扫描（无需 cwd），此处恒点火（核内每进程一次去重）。
  void scheduleSessionMaintenancePasses({ cwd: currentCwd() })
  if (!SMOKE) return // 常态启动 = 窗口常驻（不取读数、不退出）

  const reading = await runSmoke(win, recordError)
  const ok =
    floorMet && sqlite && reading.loaded && reading.protocol.served > 0 && reading.protocol.blocked >= NEGATIVE_PROBE_COUNT && // 负探针枚数派生自探针表（#471⑥）——计数与逐探针读数双证
    reading.boot === "ok" && errors.length === 0 && probesSatisfied(reading.protocol.probes)
  if (!ok) {
    recordError(`smoke not ok: loaded=${reading.loaded} served=${reading.protocol.served} blocked=${reading.protocol.blocked} boot=${reading.boot}`)
  }
  report({ window: reading.loaded, floorMet, sqlite, protocol: reading.protocol, boot: reading.boot, ok }, ok ? EXIT.OK : EXIT.FATAL)
}

process.on("uncaughtException", fatal)
process.on("unhandledRejection", fatal)
main().catch(fatal)
