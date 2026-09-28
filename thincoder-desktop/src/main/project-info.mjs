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
 * **台账刷新面（R8 · 桌面功能对位批「台账周期刷新 + L2 明细」——推解 `docs/desktop/design/UI.md`
 * open 行）**：`pushLedgerLines` = 开项目成功链起（`ipc.mjs` `session:resume` 成功径）——
 * **消费核拍面** `startLedgerSurface`（`thincoder-core/ledger-surface.mjs:60`：首拍 `setImmediate`
 * ∕ 周期 `REFRESH_MS`（`:73` · 核 `ledger.mjs:32` = 120000）∕ `dispose`）；**端零第二扫描实现**
 * （族扫描 ∕ 变化行 ∕ 送达门 ∕ 记账全在核——KD-T2；扫描失败 = 核面尽力自吞，与 VSC `refreshLedger`
 * 同口径 N1；出站失败 = 本档 `console.error`，零静默）。两条出站面共用通道 `ev:ledger`：
 *   ① `lines`（既有面 · 「对齐第三批」KD-38）：核 `pushLine` 行产逐字（启动拍 = 变化行 + 明细行；
 *      周期拍 = 变化行——有行才出站）。
 *   ② `detailLines`（R8 增 · 状态行 tooltip 载波）：核 `detailScans` ∕ `formatDetailLine` 直取
 *      （VSC `src/extension/ledger-surface.mjs:69` 对位——除该两件外仅 compose 核族扫描导出，
 *      零本地扫描实现；行文本核产逐字、端零行构造）；每拍重算、同值零出站；空集照出（清 tooltip
 *      —— 禁假造）。
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

/** 台账机制状态位载体（核 `runLedgerScan` 写 `state.ledger` 标记位——本端只作载体，不消费该标记）。
 *  核拍面 `processing` 避让门（`ledger-surface.mjs:66`）本端无该态 ⇒ 恒不触发（与 VSC 同形——登记）。 */
const LEDGER_STATE = { ledger: null }

/** 行色表（核面缝值 `colors`）：核按 `warn` 位逐行取色 ⇒ 两值 = 位哨兵（`pushLine(text, warn)` 得真布尔）。 */
const LINE_COLORS = Object.freeze({ warn: true, dim: false })

/** 当前刷新面句柄（模块级单例——开项目链重锚：先撤旧后立新）。 */
let _refresh = null

/** 撤当前刷新面（重锚 ∕ 生命周期收尾；幂等——无面 ⇒ 零动作）。 */
export function stopLedgerRefresh() {
  _refresh?.dispose?.()
  _refresh = null
}

/** L2 明细行集（VSC `ledger-surface.mjs:69` 对位）：核 `discoverFamily` ∕ `buildScan` ∕
 *  `resolveExecutorStates` ∕ `detailScans` ∕ `formatDetailLine` 组合直取——行文本核产逐字
 *  （端零行构造 ∕ 零本地扫描实现）；不可读项目跳过（核面同口径——余者照常）。动态 import 同
 *  `ledgerRead`（W8 契约②）。 */
async function ledgerDetailLines(anchor) {
  const { buildScan, detailScans, discoverFamily, formatDetailLine, resolveExecutorStates } =
    await import("@thincoder/core/ledger.mjs")
  const family = discoverFamily(anchor)
  const scans = []
  for (const project of family.projects) {
    try { scans.push(buildScan({ cwd: project.root })) } catch { /* 台账不可读 → 该项目跳过 */ }
  }
  await resolveExecutorStates(scans) // 判活批量解析（核面同探束 + TTL 缓存）
  const current = family.current ? scans.find((s) => s.root === family.current.root) ?? null : null
  return detailScans(scans, current).map((scan) => formatDetailLine(scan))
}

/**
 * 台账刷新面（R8 · 消费核拍面）：`pushLedgerLines({ cwd, key, post, notifyFile })` ⇒ 起核
 * `startLedgerSurface`（返回拍面句柄 `{ dispose }` ∥ `null`）。入参不合（非 cwd ∕ 非 post）⇒ `null`
 * 零动作；重复调用 = **重锚**（先撤旧后立新——开项目链可多次）。
 * `notifyFile` = 去重档注入面（生产缺省 = 核 `NOTIFY_FILE`——跨端共享档；用例注入 tmp 档）。
 * 出站两键：`lines`（核行产——变化行 ∕ 启动拍含明细行）· `detailLines`（本档明细行集——状态行
 * tooltip 载波）；两键皆无变化 ⇒ 零出站。调用点 `void`（`ipc.mjs`）零消费返回值。
 */
export async function pushLedgerLines({ cwd, key, post, notifyFile } = {}) {
  if (typeof cwd !== "string" || cwd === "" || typeof post !== "function") return null
  stopLedgerRefresh() // 重锚：先撤旧后立新
  let startLedgerSurface
  try {
    ({ startLedgerSurface } = await import("@thincoder/core/ledger-surface.mjs"))
  } catch (error) {
    console.error("[project-info] ledger surface unavailable:", error)
    return null
  }
  const pending = [] // 本拍行缓冲（`pushLine` 收；拍尾出站后清）
  let lastDetail = null // 上拍明细行集（同值零出站）
  let flushing = false // 拍重叠防衛（明细拍含判活探束——慢拍在飞 ⇒ 跳本拍出站，行缓冲留待下拍）
  /** 拍尾（核 `render` 回调）：行缓冲 + 明细行集一并出站（两键皆无变化 ⇒ 零出站——对位 VSC 同值零推）。 */
  const flush = async () => {
    if (flushing) return
    flushing = true
    try {
      const lines = pending.splice(0)
      let detailLines = null
      try {
        detailLines = await ledgerDetailLines(cwd)
      } catch (error) {
        console.error("[project-info] ledger detail scan failed:", error) // 行面照出（明细面失败不拖累）
      }
      const payload = {}
      if (lines.length > 0) payload.lines = lines
      if (detailLines !== null) {
        const same = lastDetail !== null && detailLines.length === lastDetail.length
          && detailLines.every((text, index) => text === lastDetail[index])
        if (!same) { payload.detailLines = detailLines; lastDetail = detailLines }
      }
      if (payload.lines === undefined && payload.detailLines === undefined) return
      try { post("ev:ledger", { key, ...payload }) } catch (error) {
        console.error("[project-info] ledger emit failed:", error) // 出站抛自吞（零静默）—— 调用点 `void` ⇒ 不落未处理拒绝
      }
    } finally { flushing = false }
  }
  const surface = startLedgerSurface({
    state: LEDGER_STATE,
    anchor: cwd,
    ...(typeof notifyFile === "string" && notifyFile !== "" ? { notifyFile } : {}),
    colors: LINE_COLORS,
    pushLine: (text, warn) => { pending.push({ text, warn: warn === true }) },
    render: () => { void flush() },
  })
  _refresh = surface
  return surface
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
