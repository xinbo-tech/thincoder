#!/usr/bin/env node
/**
 * main.mjs — Electron 主进程入口（`docs/desktop/design/SHELL.md` §1 / §2）：旗标 → 单实例锁 → 下限自检 → 协议 → 通道 → 窗口 → 冒烟读数。
 * 启动序**单线**（批档 §2.4）：`--smoke` 解析 → `requestSingleInstanceLock()` → 非主实例分支（不开窗；**2026-10-03 轻通道轮起 = 明示原因框 + 主实例唤醒既有窗口**）→ 下限自检
 * （调用点先于协议 / 窗口注册——U4）→ `registerAppScheme()`（ready 前）→ `await app.whenReady()` → `serveAppProtocol()`
 * → `registerIpcHandlers()` → `createWindow()` → 加载完 → 冒烟读回 → 单行 JSON → `app.exit(0)`；常态（无 `--smoke`）= 窗口常驻。
 * **桌面空闲唤醒批**：通知装配注入三行（`Notification` 构造 ∕ 焦态 ∕ 聚焦——闭包读 `win`；策略面住 `notify.mjs`）。
 * **桌面发布·阶段二批（KD-71）**：自动更新装配——`createRequire` 取 `autoUpdater`（CJS 互操作）∥ 注入五缝
 * （`updater` ∥ `notify` ∥ `menuRefresh` ∥ `dialog` ∥ `log`）∥ 延时自检点火（10s 一次——武装门 = `isPackaged ∧ 非 --smoke ∧ updaterMediumOk(...)`；Linux 介质合项 = §2.11.4）；
 * 策略面零 electron 住 `update.mjs`。
 * stdout 只许一行 JSON（读数面；日志与栈一律 stderr）——`process.stdout.write` 仅本档一处。
 */
import { app, dialog, Notification } from "electron"
import { createRequire } from "node:module" // 自动更新（KD-71）：CJS 互操作——`require("electron-updater")` 取 `autoUpdater`
import { hostFloorMet, MIN_NODE, sqliteAvailable } from "./host-floor.mjs"
import { protocolStats, registerAppScheme, serveAppProtocol } from "./protocol.mjs"
import { ipcStats, setAgentHost, setLedgerEmit } from "./ipc.mjs"
import { registerIpcHandlers } from "./ipc-registry.mjs" // #28 拆点：表 ∕ 注册序出档（处理体本体住 `ipc.mjs`）
import { createAgentHost } from "./agent-host.mjs"
import { currentCwd, restoreLastProject } from "./projects.mjs"
// S3 宿主忙证据面（#673）：事件循环采样器 —— ready 起拍 ∕ 窗口关收拍（`hostBusy()` fail-open）。
import { startSampler, stopSampler } from "./loop-sampler.mjs"
// 会话维护线（R1 · 桌面功能对位批）：启动拍供面（GC ∕ 索引两枚延迟拍 —— 处理体同档）。
import { scheduleSessionMaintenancePasses } from "./session-maintenance.mjs"
import { scheduleMemoryMaintenance } from "./memory-maintenance.mjs" // 记忆维护启动拍（自愈轮 §6.14 面⑤-5——惰性转口）
// 堆遥测与冻结取证（KD-53 · 批档 §2.11 D7–D9 · 台账 #694）：策略面出档 `heap-watch.mjs`（零 `electron`
// 顶层 import——四缝合件）；本档 = 装配面（三注入 + `diagnostics.*` 两键消费 + 冻结钩族 + 恢复动作序）。
import { createHeapWatch, mainHeapReading, PING_TIMEOUT_MS } from "./heap-watch.mjs"
import { loadConfig } from "@thincoder/core/config.mjs"
import { normalizeLocale } from "@thincoder/core/i18n.mjs" // 语言归一单源（BCP-47 取基 ∥ 缺 ∕ 空 ∕ 未知 ⇒ en）——第二实例明示框消费
import { onConfigSelfWrite } from "@thincoder/core/config-io.mjs" // 快照门运行期源②（同进程自写——config-watch 按设计抑制自写）
// 台账刷新面收尾（R8 —— 拍面随开项目链重锚；窗口关 = 退出径同点——`stopLedgerRefresh` 幂等、核 interval 已 unref）。
import { stopLedgerRefresh } from "./project-info.mjs"
import {
  NEGATIVE_PROBE_COUNT, createWindow, probesSatisfied, refreshMenu, runSmoke,
  setUpdateFace, updateConfirmDialog, updateResultDialog,
} from "./window.mjs"
import { menuLabels } from "./menu-words.mjs" // 更新面词表现读注入（KD-71——语言随动；值面单源 = 同档）
import { createUpdateFace, updaterMediumOk } from "./update.mjs" // 更新面策略面（零 electron ∕ 零库 import——五缝注入装配于本档）
// config 写盘感知（R8 · 桌面功能对位批 · C3）：核件 `config-watch` 桌面壳（`node:fs.watch` 源 + 自写抑制）。
import { startConfigWatch } from "./config-watch.mjs"
// 提示锚取值表（R4 · 桌面功能对位批 · #519）：核缝供值面（`prompt-files.mjs` `configurePromptInjections`）。
import { configurePromptInjections } from "@thincoder/core/prompt-files.mjs"
import { DESKTOP_PROMPT_INJECTIONS } from "./prompt-injections.mjs"

// 提示锚注册：**进程入口、任何装配之前**一次性（先例 = CLI `bin/thincoder.mjs:32` ∕ VSC `extension.mjs:92`）——
// 调用期应用（工具表装配晚于本行）⇒ 无导入序要求；漏配 ⇒ 锚字面静默进模型工具描述。
configurePromptInjections(DESKTOP_PROMPT_INJECTIONS)

// 自动更新（KD-71 ∥ §2.8.1 · 桌面发布·阶段二批）：`electron-updater`（6.8.9）= CJS ⇒ `createRequire` 取 `autoUpdater`
// （electron 原语全落本装配面；策略面 `update.mjs` 零 electron ∕ 零本库顶层 import——注入缝形）。
const require = createRequire(import.meta.url)
const { autoUpdater } = require("electron-updater")

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
    // 非主实例（2026-10-03 轻通道轮）：**明示原因**（原生框——从「静默退出」改起）+ 交棒主实例
    // （下方 `second-instance` ⇒ 唤醒既有窗口）；不开窗 · 零分发（原判据保持）。`--smoke` = 纯 JSON（零弹框）。
    if (!SMOKE) {
      // 语言 = 核 `normalizeLocale` 单源（BCP-47 取基 ∥ 缺 ∕ 空 ∕ 未知 ⇒ en——`thincoder-core/i18n.mjs:77-83`；
      // 同 `ipc.mjs` ∥ `menu-words.mjs` 口径）；读抛 = 记错 + en 回落（与下方 `menuLabels("en")` 同向，零静默）。
      let en = true
      try { en = normalizeLocale(loadConfig()?.locale) === "en" } catch (error) { console.error("[main] locale readback failed:", error) }
      dialog.showErrorBox(
        en ? "ThinCoder is already running" : "ThinCoder 已在运行",
        en ? "Tried to bring the running window to the front — if it doesn't appear, it may be on another desktop or display." : "已尝试唤起正在运行的窗口——若未出现，它可能在其他桌面或显示器上。",
      )
    }
    return report({ lock: "secondary", window: false, channels: [], ok: true }, EXIT.OK)
  }
  // 第二实例唤醒（2026-10-03 轻通道轮）：第二实例启动 ⇒ 本实例收 `second-instance` ⇒ 唤起既有窗口
  // （建窗前到达 ⇒ `win` 为 null ⇒ 零动作，建窗后自可达；形状沿通知点击 `reveal` 先例 + `restore`）。
  app.on("second-instance", () => {
    if (win && !win.isDestroyed()) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  })

  const floorMet = hostFloorMet(process.versions.node) // 纯谓词（零 electron 依赖面 = host-floor.mjs）
  const sqlite = await sqliteAvailable() // 唯一 await：内置模块导入（「不越 ready 前窗」= 未核实——Electron 行为面，本仓无可读面）
  if (!floorMet || !sqlite) {
    recordError(`host floor not met: node ${process.versions.node} (need >= ${MIN_NODE}) · sqlite ${sqlite}`)
    return report({ floorMet, sqlite }, EXIT.FLOOR)
  }

  registerAppScheme() // ready 前 · 仅一次
  await app.whenReady()
  serveAppProtocol()
  // S3 宿主忙证据面（#673 · `src/main/loop-sampler.mjs`）：随主进程活——探针失败分档的端侧证据源
  // （`providers.mjs` 失败支经 `overrideAdmissionIfHostBusy` 覆盖落账；`hostBusy()` 纯内存零 I/O）。
  startSampler()
  // 出站面（webContents 发送单点）：宿主 emit 与台账读数出站共用（建窗晚于注入 ⇒ 闭包读 `win`；建窗前零事件 ⇒ 丢弃；#913 收口措辞随正——流尾行组已退役、保留面 = 读数）。
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
  // 台账读数出站面（「对齐第三批」KD-38；#913 收口措辞随正——流尾行组已退役、保留面 = 读数）：`session:resume` 成功径挂调用（`ipc.mjs`）——项目级自产事件，非会话回调。
  setLedgerEmit(emit)
  registerIpcHandlers()
  // 重启自动重开（KD-56 · 台账 #734）：窗口创建前一次恢复 —— 本端记录面回读「上次打开」的项目
  // ⇒ `project:recent` 的 `cwd` 非空 ⇒ 渲染面 boot 既有接续门（`renderer/app.mjs:230`）自动一次
  // `session:resume`（项目 + 会话一条链；渲染面零改）。降级三档同归冷态 —— 见 `projects.mjs`。
  restoreLastProject()
  win = createWindow(recordError)
  // 堆遥测 ∕ 冻结取证装配（KD-53 ∕ §2.11 D7–D9）：`diagnostics.heapWatch` 开机单读（读抛 ⇒ 默认开——
  // 同向）；`diagnostics.heapSnapshot` 取初值后**运行期热读**（采集收网批——两源接线 = 下方 sync ∥
  // config-watch `onChange`；判定形 fail-closed：`=== true` ⇒ 开，读抛 ⇒ 关）；electron 原语全落本处
  // （策略面留 `heap-watch.mjs`）：三注入（`sample` ∕ `snapshot` ∕ `log`）+ 冻结 ∕ 恢复动作原语
  // （`ping` ∕ `killRenderer` ∕ `reload`）。
  let diagnostics = {}
  try { diagnostics = loadConfig()?.diagnostics ?? {} } catch (error) {
    console.error(`[heap] config read failed — defaults applied (heapWatch on / heapSnapshot off): ${error.message}`)
  }
  const heapWatch = createHeapWatch({
    enabled: diagnostics.heapWatch !== false,
    snapshotEnabled: diagnostics.heapSnapshot === true,
    // 采样：主进程自读（node 侧 `mainHeapReading`）+ 子进程逐进程读数（`app.getAppMetrics()`——type ∕ pid ∕ workingSet ∕ cpu）
    sample: () => ({
      main: mainHeapReading(),
      processes: app.getAppMetrics().map((m) => ({
        type: m.type, pid: m.pid,
        workingSetMb: Math.round((m.memory?.workingSetSize ?? 0) / 1024), // Electron 面单位 = KB ⇒ MB
        cpu: m.cpu?.percentCPUUsage ?? null,
      })),
    }),
    // 渲染快照（D8-1 ∕ D8-2 取径共用）：取前 native 预告（通知先例 = 上方 notify 装配）；失败由策略面记 `skipped`
    snapshot: async ({ kind, path }) => {
      try { new Notification({ body: "快照采集中——界面或短暂停顿" }).show() } catch { /* 预告失败不阻断 */ }
      await win.webContents.takeHeapSnapshot(path)
      return { path, kind }
    },
    // ping 兜底（D7）：`executeJavaScript` 竞速超时（先例 = window.mjs 引导位读回）——超时 ⇒ false
    ping: () => Promise.race([
      win.webContents.executeJavaScript("1").then(() => true, () => false),
      new Promise((resolve) => { const t = setTimeout(() => resolve(false), PING_TIMEOUT_MS); t.unref?.() }),
    ]),
    killRenderer: () => win.webContents.forcefullyCrashRenderer(),
    // 恢复 reload（D9）。**实测修正（2026-09-30 · Electron 44 · Windows）**：同 tick `forcefullyCrashRenderer();
    // reload()` 的 reload 会被吞（渲染进程保持 crashed ≥12s——`electron.d.ts:18227` 的「immediately after」
    // 承诺与实测相抵）；可靠序 = `render-process-gone` 事件驱动 reload（实测 ≤3s 换代恢复）。已崩态
    // （事件已过）⇒ 直 reload。诊断实录 = 批档 §5（A1 ∕ A2 ∕ B 三格）。
    reload: () => {
      const contents = win.webContents
      if (contents.isCrashed()) { contents.reload(); return }
      contents.once("render-process-gone", () => { try { contents.reload() } catch { /* 已亡——尽力面 */ } })
    },
    log: (line) => console.error(line),
  })
  win.webContents.on("unresponsive", () => heapWatch.onUnresponsive())
  win.webContents.on("responsive", () => heapWatch.onResponsive())
  win.webContents.on("render-process-gone", (_event, details) => heapWatch.onGone(details))
  // 快照门运行期热读（采集收网批——两源一应用点）：源① = 下方 config-watch `onChange` 同拍；源② = 核
  // `onConfigSelfWrite` 订阅（同进程自写：桌面 agent `settings` 工具——监视面自写抑制挡住源①，须另挂）。
  // 读抛 ⇒ 关 + 告警（fail-closed，零静默）。退订随窗口 `closed`（与 `configWatch.dispose()` 同点）。
  const syncHeapSnapshot = () => {
    let d = {}
    try { d = loadConfig()?.diagnostics ?? {} } catch (error) {
      console.error(`[heap] config read failed — snapshot collection disabled (fail-closed): ${error.message}`)
    }
    heapWatch.setSnapshotEnabled(d.heapSnapshot === true)
  }
  const unsubscribeSelfWrite = onConfigSelfWrite(() => syncHeapSnapshot())
  // config 热更感知（R8 · C3——核 `config-watch.mjs` 桌面消费）：外部写盘（手编 ∕ CLI 端）⇒ 去抖 + 元组真变
  // ⇒ `ev:config`（宿主自产推送；渲染面设置面复读）；自写抑制 = 核 `onConfigSelfWrite`（核件缺省内接——监视面
  // 自身写盘不抖动；端侧同源订阅另见上方源②）。生命周期随窗口：窗口 closed ⇒ 撤监视（单窗应用 = 退出径同点）。
  const configWatch = startConfigWatch({ onChange: () => { emit("ev:config", { at: Date.now() }); syncHeapSnapshot() } }) // 外部写盘：出站推送 + 快照门热读同拍
  win.on("closed", () => { configWatch.dispose(); unsubscribeSelfWrite(); stopLedgerRefresh(); stopSampler(); heapWatch.stop() }) // 生命周期随窗口：五长活面（监视 + 自写订阅 + 台账拍面 + 采样器 + 堆看门狗）同点收尾
  // （更新面（KD-71）不入本列：启动定时器 = 一次性且 `unref`；`autoUpdater` 监听 = 进程寿命面——`autoInstallOnAppQuit` 需其存活至退出径。）
  // 桌面自动更新（KD-71 ∥ §2.8.1 · 桌面发布·阶段二批）：装配面——`autoUpdater`（CJS 取——见上）+ 注入五缝
  // （`updater` ∥ `notify` ∥ `menuRefresh` ∥ `dialog` ∥ `log`）+ 词表现读注入（`menuLabels`——语言随动）；武装门 =
  // `app.isPackaged ∧ 非 --smoke ∧ updaterMediumOk(...)`——Linux 介质合项（仅 AppImage 运行武装：`APPIMAGE` 在；
  // deb 安装零自检 ∥ 零网络 ∥ 零状态机——§2.11.4）；未打包 ⇒ 库自身 `isUpdaterActive()` 返回 false——双保险；
  // `--smoke` 读数面零增字段。
  const updateFace = createUpdateFace({
    enabled: app.isPackaged && !SMOKE && updaterMediumOk({ platform: process.platform, appImageEnv: process.env.APPIMAGE }),
    updater: autoUpdater,
    words: () => {
      try { return menuLabels(loadConfig()?.locale) } catch (error) {
        console.error("[update] menu words readback failed:", error)
        return menuLabels("en")
      }
    },
    // 通知落子（原生 `Notification`；点击 ⇒ 聚焦主窗——**不直接安装**：安装入口唯一 = 菜单项）
    notify: ({ title, body }) => {
      const toast = new Notification({ ...(title ? { title } : {}), body })
      toast.on("click", () => { if (win && !win.isDestroyed()) { win.show(); win.focus() } })
      toast.show()
    },
    menuRefresh: refreshMenu, // 状态迁移 ⇒ 菜单重建（重建点⑥）
    dialog: { confirmRestart: updateConfirmDialog, result: updateResultDialog }, // 更新对话框族（落子 = `window.mjs`）
    log: (line) => console.error(line),
  })
  setUpdateFace(updateFace) // 转口：`onNative("update")` 落子 + 帮助组项 label 读面（`window.mjs` 持有）
  updateFace.scheduleStartupCheck() // 启动自检：ready 后延时 10s 一次/会话（未武装 ⇒ 不点——武装门内判）
  // 启动拍（R1 · 会话维护 · KD-T4② 端层显式点火）：窗口起后两枚延迟拍（核侧 3s 启动窗外；异步非阻塞、
  // 失败静默 —— 索引 = 派生品）。GC 拍须项目 cwd：开机未开项目 ⇒ 此处零动作，由恢复入口（`ipc.mjs`
  // `session:resume` 成功径）同款点火；索引拍 = 全根扫描（无需 cwd），此处恒点火（核内每进程一次去重）。
  void scheduleSessionMaintenancePasses({ cwd: currentCwd() })
  // 记忆维护启动拍（自愈轮 · §6.14 面⑤-5 · 台账 #1096）：与上拍邻位（核侧 3 s 延迟拍、每进程一次、异步非阻塞、失败静默；库不在盘 ⇒ 零动作）。
  void scheduleMemoryMaintenance()
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
