/**
 * project-info.mjs — 项目级信息两通道（`ledger:read` / `batch:status`）：**项目一份、不随会话走**
 * （通道载荷一律**不携会话 `key`**——`docs/desktop/design/IPC.md` §1 键面）。
 *
 * 台账读 = 核 `buildScan`（`thincoder-core/ledger.mjs:114`）——**动态 import**（W8 契约②：
 * `ledger-db.mjs` 静态 import `node:sqlite` ⇒ 消费侧禁静态 import）；端侧**不直读核内表**，
 * 只取三计数 + 阈值读数（行集不下发——批档 §2.10 项 1）。
 * 项目相位 = 核 `readManifest(cwd)` 回执 `manifest.phase`（`thincoder-core/manifest.mjs:334`；
 * **无顶层 `phase`**——批档 §2.10 项 2）——非 ENOENT 读错**上抛**（`:342`）⇒ invoke 拒绝直传（不吞）。
 *
 * **台账行出站（「对齐第三批」· KD-38 —— `docs/desktop/design/UI.md` §1 本批注项 12）**：`pushLedgerLines` ——
 * 核 `runLedgerScan` 直取（启动拍 = 变化行 + 明细行）⇒ 行集 `{ text, warn }` 逐字经 `ev:ledger` 出站
 * （`docs/desktop/design/IPC.md` §1 该行）；**落点 = `session:resume` 成功径**（`ipc.mjs` 挂调用 —— 会话键
 * 天然在手；渲染面 `resumeOpened` 仅 `openDir` 一条触发径 ⇒ 每次开项目恰一次，无需第二判据；周期刷新不在本批）。
 */
import { readManifest } from "@thincoder/core/manifest.mjs"
import { currentCwd } from "./projects.mjs"

/** 载荷 cwd 缺省 = 主进程当前项目内存态（`projects.mjs` 单源）。 */
function cwdOf(payload) {
  return payload?.cwd ?? currentCwd() ?? null
}

/**
 * `ledger:read(payload)` ⇒ `{ ok, counts:{ pool, tech, aged }, thresholdReached }` ∥
 * `{ ok:false, reason:"no-project" }`——**无 `rows`**（行集不下发）。
 * 未开项目（无 cwd）= `no-project`；有 cwd 而无台账库 ⇒ 核 `openLedger` 回 null ⇒ 行集空 ⇒
 * 三计数全 0 + `thresholdReached:false` 且 `ok:true`（「未发现台账」是合法读数，非错误）。
 */
export async function ledgerRead(payload) {
  const cwd = cwdOf(payload)
  if (!cwd) return { ok: false, reason: "no-project" }
  const { buildScan } = await import("@thincoder/core/ledger.mjs")
  const scan = buildScan({ cwd })
  return {
    ok: true,
    counts: { pool: scan.pool, tech: scan.tech, aged: scan.aged },
    thresholdReached: scan.thresholdReached,
  }
}

/** 台账机制状态位载体（核 `runLedgerScan` 写 `state.ledger` 标记位——本端只作载体，不消费该标记）。 */
const LEDGER_STATE = { ledger: null }

/** 行色表（核面缝值 `colors`）：核按 `warn` 位逐行取色 ⇒ 两值 = 位哨兵（`pushLine(text, warn)` 得真布尔）。 */
const LINE_COLORS = Object.freeze({ warn: true, dim: false })

/**
 * 台账行出站（「对齐第三批」· KD-38）：`runLedgerScan({ startup: true })` ⇒ 行集 `{ text, warn }` 逐字
 * 经 `ev:ledger` 出站（载荷 `{ key, lines }` —— `docs/desktop/design/IPC.md` §1 该行；端侧零行构造）。
 * 触发 = 开项目成功链一次（`ipc.mjs` `session:resume` 成功径挂调用）；**零行 ⇒ 零出站**（对位 VSC：无行不投）。
 * 失败面 = `console.error` 后零出站（零静默；可见面尽力不崩 —— 核件同口径 N1）；**扫描与出站两段各自自吞**
 * （出站抛亦不向调用面泄 —— 调用点为 `void` 后台面）。
 * `notifyFile` = 去重档注入面（生产缺省 = 核 `NOTIFY_FILE`——跨端共享档；测试注入 tmp 档）；
 * 消费面 = 动态 import（W8 契约②：静态链带 `node:sqlite` —— 与上行 `ledgerRead` 同判据）。
 * 返回投递行数（0 = 零行 / 扫描失败 / 入参不合）。
 */
export async function pushLedgerLines({ cwd, key, post, notifyFile } = {}) {
  if (typeof cwd !== "string" || cwd === "" || typeof post !== "function") return 0
  const lines = []
  try {
    const { runLedgerScan } = await import("@thincoder/core/ledger-surface.mjs")
    await runLedgerScan({
      state: LEDGER_STATE,
      anchor: cwd,
      ...(typeof notifyFile === "string" && notifyFile !== "" ? { notifyFile } : {}),
      startup: true,
      colors: LINE_COLORS,
      pushLine: (text, warn) => { lines.push({ text, warn: warn === true }) },
    })
  } catch (error) {
    console.error("[project-info] ledger scan failed:", error)
    return 0
  }
  if (lines.length === 0) return 0
  try {
    post("ev:ledger", { key, lines })
  } catch (error) {
    console.error("[project-info] ledger emit failed:", error) // 出站抛自吞（零静默）—— 调用点 `void` ⇒ 不落未处理拒绝（`main.mjs` `unhandledRejection ⇒ fatal`）
    return 0
  }
  return lines.length
}

/**
 * `batch:status(payload)` ⇒ `{ ok, phase }` ∥ `{ ok:false, reason }`——`reason` = `missing` ∥
 * `invalid`（整档缺 / 不可解析，两分不合并——核回执直传）；相位值域 = `initial-dev` /
 * `production`。非 ENOENT 读错由核上抛（本档零 catch ⇒ invoke 拒绝直传）。
 */
export function batchStatus(payload) {
  const cwd = cwdOf(payload)
  if (!cwd) return { ok: false, reason: "missing" }
  const r = readManifest(cwd)
  if (!r.ok) return { ok: false, reason: r.reason }
  return { ok: true, phase: r.manifest?.phase ?? null }
}
