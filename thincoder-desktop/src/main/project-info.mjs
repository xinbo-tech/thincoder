/**
 * project-info.mjs — 项目级信息两通道（`ledger:read` / `batch:status`）：**项目一份、不随会话走**
 * （通道载荷一律**不携会话 `key`**——`docs/desktop/design/IPC.md` §1 键面）。
 *
 * 台账读 = 核 `buildScan`（`thincoder-core/ledger.mjs:118`）——**动态 import**（W8 契约②：
 * `ledger-db.mjs` 静态 import `node:sqlite` ⇒ 消费侧禁静态 import）；端侧**不直读核内表**，
 * 只取三计数 + 阈值读数（行集不下发——批档 §2.10 项 1）。
 * 项目相位 = 核 `readManifest(cwd)` 回执 `manifest.phase`（`thincoder-core/manifest.mjs:334`；
 * **无顶层 `phase`**——批档 §2.10 项 2）——非 ENOENT 读错**上抛**（`:342`）⇒ invoke 拒绝直传（不吞）。
 * **歧义锚（#831）**：`buildScan` 链 `solveProjectRoot` 抛「项目不可解析」（容器根多候选）⇒ 本档**不吞**——
 * invoke 拒绝直传（诚实拒）；两域界限明写：锚不可解析 ⇒ 拒（本条）∥ cwd 可解析而库缺 ⇒ 三计数 0 空读（上段）。
 *
 * **台账刷新面（R8 · 桌面功能对位批「台账周期刷新 + L2 明细」——推解 `docs/desktop/design/UI.md`
 * open 行）**：`pushLedgerLines` = 开项目成功链起（`ipc.mjs` `session:resume` 成功径）——
 * **消费核拍面** `startLedgerSurface`（`thincoder-core/ledger-surface.mjs:29`：首拍 `setImmediate`
 * ∕ 周期 `REFRESH_MS`（核 `ledger.mjs:32` = 120000）∕ `dispose`）；**端零第二扫描实现**
 * （族扫描 ∕ 判活 ∕ 标记归约全在核——KD-T2；扫描失败 = 核面尽力自吞，与 VSC `refreshLedger`
 * 同口径 N1；出站失败 = 本档 `console.error`，零静默）。两条出站面共用通道 `ev:ledger`：
 *   ① `detailLines`（R8 · 状态行 tooltip 载波）：核 `detailScans` ∕ `formatDetailLine` 直取
 *      （VSC `src/extension/ledger-surface.mjs:58` 对位——除该两件外仅 compose 核族扫描导出，
 *      零本地扫描实现；行文本核产逐字、端零行构造）；每拍重算、同值零出站；空集照出（清 tooltip
 *      —— 禁假造）。
 *   ② `marker`（状态行段 11 常驻标记载波）：核状态位转发（`{ text, warn }` ∕ `null`
 *      —— `text` = 核 `formatMarker` 逐字、`warn` = 核判位（老化 > 0 ∨ 死执行者 > 0）——端零重算）；
 *      首拍必携（含 null——清旧项目残影）· 同值零出站（投影 ∕ 比较 = `ledgerMarkerOf` ∕ `sameLedgerMarker`）。
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

/** 台账机制状态位载体（核 `runLedgerScan` 写 `state.ledger` 标记位——本端**只作转发载体**：拍尾经
 *  `ledgerMarkerOf` 投影出站 `ev:ledger` `marker` 键（状态行段 11 消费）；端零重算 ∕ 零判位）。
 *  核拍面 `processing` 避让门（`ledger-surface.mjs:35`）本端无该态 ⇒ 恒不触发（与 VSC 同形——登记）。 */
const LEDGER_STATE = { ledger: null }

/** 台账状态位出站投影（纯函数 —— 用例缝）：核拍面写的 `state.ledger`（`{ marker, warn, scannedAt }` ——
 *  `ledger-surface.mjs:22`）⇒ 出站值 `{ text, warn }` ∕ `null`：`text` = 核 `formatMarker` 逐字（端零构造）；
 *  未扫 ∕ 无当前项目（`marker` 空）⇒ `null`（出站 `null` = 清渲染面残影 —— 段 11 在场判据 = `text` 非空串）。 */
export function ledgerMarkerOf(ledger) {
  const text = ledger !== null && typeof ledger === "object" && typeof ledger.marker === "string" && ledger.marker !== ""
    ? ledger.marker
    : null
  if (text === null) return null
  return { text, warn: ledger.warn === true }
}

/** 状态位同值判据（纯函数 —— 用例缝）：`text` 逐字 + `warn` 真值同判（两 `null` 同值）。 */
export function sameLedgerMarker(a, b) {
  if (a === null || b === null) return a === b
  return a.text === b.text && (a.warn === true) === (b.warn === true)
}

/** 当前刷新面句柄（模块级单例——开项目链重锚：先撤旧后立新）。 */
let _refresh = null

/** 撤当前刷新面（重锚 ∕ 生命周期收尾；幂等——无面 ⇒ 零动作）。 */
export function stopLedgerRefresh() {
  _refresh?.dispose?.()
  _refresh = null
}

/** L2 明细行集（VSC `ledger-surface.mjs:58` 对位）：核 `discoverFamily` ∕ `buildScan` ∕
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
 * 台账刷新面（R8 · 消费核拍面）：`pushLedgerLines({ cwd, key, post })` ⇒ 起核
 * `startLedgerSurface`（返回拍面句柄 `{ dispose }` ∥ `null`）。入参不合（非 cwd ∕ 非 post）⇒ `null`
 * 零动作；重复调用 = **重锚**（先撤旧后立新——开项目链可多次）。
 * 出站两键：`detailLines`（本档明细行集——状态行 tooltip 载波）· `marker`（核状态位——状态行段 11
 * 常驻标记载波）；两键皆无变化 ⇒ 零出站。调用点（`ipc.mjs`）挂**拒绝处理器**（#686 —— `.catch` 落
 * `console.error`，零未处理拒绝逃逸）。
 */
export async function pushLedgerLines({ cwd, key, post } = {}) {
  if (typeof cwd !== "string" || cwd === "" || typeof post !== "function") return null
  stopLedgerRefresh() // 重锚：先撤旧后立新
  let startLedgerSurface
  try {
    ({ startLedgerSurface } = await import("@thincoder/core/ledger-surface.mjs"))
  } catch (error) {
    console.error("[project-info] ledger surface unavailable:", error)
    return null
  }
  let lastDetail = null // 上拍明细行集（同值零出站）
  let lastMarker // 上拍状态位（`undefined` = 本锚期未出 ⇒ 首拍必携；同值零出站）
  let flushing = false // 拍重叠防衛（明细拍含判活探束——慢拍在飞 ⇒ 跳本拍出站，下拍重试）
  /** 拍尾（核 `render` 回调）：明细行集 + 状态位一并出站（两键皆无变化 ⇒ 零出站——对位 VSC 同值零推）。 */
  const flush = async () => {
    if (flushing) return
    flushing = true
    try {
      let detailLines = null
      try {
        detailLines = await ledgerDetailLines(cwd)
      } catch (error) {
        console.error("[project-info] ledger detail scan failed:", error) // 明细面失败 ⇒ 本拍零明细出站（状态位照出）
      }
      const payload = {}
      if (detailLines !== null) {
        const same = lastDetail !== null && detailLines.length === lastDetail.length
          && detailLines.every((text, index) => text === lastDetail[index])
        if (!same) { payload.detailLines = detailLines; lastDetail = detailLines }
      }
      // 状态位（状态行 ⇒ CLI 补漏批增）：首拍必携（含 null——清旧项目残影）· 同值零出站
      const marker = ledgerMarkerOf(LEDGER_STATE.ledger)
      if (lastMarker === undefined || !sameLedgerMarker(lastMarker, marker)) {
        payload.marker = marker
        lastMarker = marker
      }
      if (payload.detailLines === undefined && payload.marker === undefined) return
      try { post("ev:ledger", { key, ...payload }) } catch (error) {
        console.error("[project-info] ledger emit failed:", error) // 出站抛自吞（零静默）；回执级失败（整体拒绝）⇒ 调用点 `.catch` 兜底（#686）
      }
    } finally { flushing = false }
  }
  const surface = startLedgerSurface({
    state: LEDGER_STATE,
    anchor: cwd,
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
