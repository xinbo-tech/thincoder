/**
 * agent/digest-account.mjs — 消化账务单件（AGENT-LOOP-ASYNC-POOL.md §6.31 · 批 digest-accounting ·
 * 台账 #930）：投递 ≠ 销账——报告不许无声消失。
 *
 * 三角色（§6.31.2）：**投递**（注入但留容器）∥ **见账**（消化轮收尾逐条机检账目覆盖）∥
 * **销账**（覆盖才离容器 + 释放 report）。本档承载：常量（`DA_RETRY_LIMIT`）/ 回合分类
 * （`isDigestRound`）/ 投递门控（`shouldDeliverEntry`）/ 账目合同（`coversDigestId` 解析 ∥
 * `digestAccountRequirement` 要求行）/ 见账 pass（`accountDigestRound`——销账 ∥ 重投标记 ∥
 * 升级）/ 读面（`unsettledRows` · `unsettledRow` · `unsettledCount`）/ 落痕清位 ∕ 取件助手
 * （`armAccountRound` · `harvestAccountOutput`）。
 *
 * 载体（§6.31.2）：`_daSession`（会话标记——挂起会话置 / 复位，`agent/suspension.mjs`）与
 * `_unsettledDigests`（升级账本——经 `async-settle.mjs` 写助手）；账目态挂条目字段
 * （`_daDelivered` / `_daRetry` / `_daFailures`）。**fallback 面**（无 `_daSession`——headless /
 * 直连 `runAgent`）零账目动作（不销账 / 不重投 / 不升级）：缺省条逐字沿用取尽语义（先离容后注入）；
 * 已投递未销账条同判据跳过且留容器（§6.31 出口缝② · 父侧裁定 2026-10-05）。
 *
 * 边界（§6.31.12）：不做处理质量机检（只保「不许无声」）；升级账本无 TTL（会话期面——
 * 中止清、idle 存续）。
 */
import { logEvent } from "../log.mjs"
import { pushReal } from "../context.mjs"
import { carrierField, releaseSettledEntry, appendUnsettledDigest } from "../agent-tools/async-settle.mjs"
import { DIGEST_ACCOUNT_DOMAIN } from "./helpers.mjs"

/** 同条重投上限（§6.31.5 KD-DA4）：重投 ≤ DA_RETRY_LIMIT ⇒ 总投递 ≤ 3 次；超限 ⇒ 升级。 */
export const DA_RETRY_LIMIT = 2

/**
 * 回合分类单点（§6.31.2）：账目只属**消化轮**（autoTurn ∧ 非上行唤醒轮 ∧ 非 timer 轮）——
 * timer / 上行轮投递不销账、不重投（其账目在后续消化轮）。
 */
export function isDigestRound(opts) {
  return opts?.autoTurn === true && opts?.upstreamTurn !== true && opts?.timerTurn !== true
}

/**
 * 投递门控（§6.31.4 单点谓词）：
 * - `!_daDelivered` ⇒ 投（首次投递——任意回合，沿既有「user + auto」面）；
 * - `_daRetry` ∧ 本回合 = 消化轮 ⇒ 投（重投经消化轮回路）；
 * - 其余 ⇒ 跳过（防重复注入）。
 */
export function shouldDeliverEntry(entry, digestRound) {
  if (entry?._daDelivered !== true) return true
  return entry._daRetry === true && digestRound === true
}

/** 账目要求行（§6.31.3）：核常量（helpers.mjs）+ 未销账 id 清单动态拼（`<ids>` 占位替换）。 */
export function digestAccountRequirement(ids) {
  return DIGEST_ACCOUNT_DOMAIN.replace("<ids>", ids.map((id) => `#${id}`).join(", "))
}

/**
 * 账目覆盖机检（§6.31.3）：输出文本内**存在一行**同时含标记 `[digest-ack` 与 `#<id>`
 * （id 词界 = 后随非数字）⇒ 该条覆盖；disposition / 要点 / 原因**不参与机检**。
 * 无标记 / 无 id / 部分覆盖各按本条判（零工具轮可满足——纯文本判据）。
 * 注：行内扫**全部**出现位（长 id 首现不吻合不弃行——如 id=1 行内先见 `#12` 后见 `#1`）。
 */
export function coversDigestId(output, id) {
  const key = `#${id}`
  for (const line of String(output ?? "").split(/\r?\n/)) {
    const marker = line.indexOf("[digest-ack")
    if (marker < 0) continue
    for (let from = marker; ;) {
      const at = line.indexOf(key, from)
      if (at < 0) break
      const after = line[at + key.length]
      if (after === undefined || !/[0-9]/.test(after)) return true
      from = at + 1 // 词界不吻合 ⇒ 续扫下一出现位（同长 id 前缀不吞后随正例）
    }
  }
  return false
}

/**
 * 见账 pass（§6.31.5——消化轮收尾 `finalizeAgentTurn` 单点调用；调用方已判 `isDigestRound ∧
 * `_daSession` ∧ 非会话停止径）：
 * - 投递账 = pending ∩ `_daDelivered`；覆盖 ⇒ 离容器（splice）+ `releaseSettledEntry`（含 report 释放）；
 * - 未覆盖 ⇒ `_daFailures += 1`；≤ `DA_RETRY_LIMIT` ⇒ `_daRetry = true`（下轮重投）；超限 ⇒ **升级**
 *   （离容器 + 入 `_unsettledDigests` + 恰一条提醒（pushReal）+ 恰一条 `ev:unsettled`）。
 * 缺痕（output == null——抛错 / 撞帽 / 未收口）⇒ 全条未覆盖（安全方向——假阴可重投；假阳是事故本相）。
 */
export function accountDigestRound(carrier) {
  const pending = carrierField(carrier, "_pendingAsyncResults")
  if (!Array.isArray(pending)) return { covered: 0, retried: 0, unsettled: 0 }
  const output = harvestAccountOutput(carrier)
  const covered = []
  const retried = []
  const upgraded = []
  for (const entry of [...pending]) {
    if (entry?._daDelivered !== true) continue
    if (output != null && coversDigestId(output, entry.id)) { covered.push(entry); continue }
    entry._daFailures = (entry._daFailures ?? 0) + 1
    if (entry._daFailures <= DA_RETRY_LIMIT) { entry._daRetry = true; retried.push(entry) }
    else upgraded.push(entry)
  }
  for (const entry of covered) {
    const i = pending.indexOf(entry)
    if (i >= 0) pending.splice(i, 1)
    releaseSettledEntry(entry)
  }
  for (const entry of upgraded) {
    const i = pending.indexOf(entry)
    if (i >= 0) pending.splice(i, 1)
    appendUnsettledDigest(carrier, {
      id: String(entry.id),
      role: entry.role ?? "subagent",
      failures: entry._daFailures,
      report: entry.report ?? null,
      at: Date.now(),
    })
  }
  // 升级：恰一条提醒（机器线 + 人读线——`pushReal`）+ 恰一条留痕（同点；字段单源 = LOGGING.md §6.2）。
  // 注：`ids` 以 join 串落盘——`logEvent` 只收标量（数组字段会被静默丢弃——先例 `ev:discarded`）。
  if (upgraded.length > 0) {
    const ids = upgraded.map((entry) => String(entry.id))
    pushReal(carrier, { role: "user", content: unsettledReminder(upgraded.length, ids) })
    logEvent("ev:unsettled", { n: upgraded.length, ids: ids.join(", ") })
  }
  return { covered: covered.length, retried: retried.length, unsettled: upgraded.length }
}

/** 升级提醒行（§6.31.5——逐字 = 父侧定稿：含 n / 轮数（= 重投上限 + 1）/ id 清单与接手指引）。 */
export function unsettledReminder(n, ids) {
  return `[System reminder: ${n} background report(s) were delivered but never accounted after ${DA_RETRY_LIMIT + 1} digest rounds — automatic re-delivery has stopped and they are marked UNSETTLED: ${ids.map((id) => `#${id}`).join(", ")}. Their content was delivered in this conversation; process them there or re-spawn the work. Readable via subagent action:'status'.]`
}

/**
 * 读面（§6.31.6——status 段 ∥ 端面残余行共用单点）：行 = `{ id, role, state, attempts }`；
 * state ∈ `awaiting-digest`（在途未投递 ∥ 已投递未判）/ `retrying`（判过未覆盖）/
 * `unsettled`（已升级——随携 `preview` ≤400 字符）。
 */
export function unsettledRows(carrier) {
  const rows = []
  const pending = carrierField(carrier, "_pendingAsyncResults")
  for (const entry of Array.isArray(pending) ? pending : []) {
    const failures = entry?._daFailures ?? 0
    rows.push({
      id: String(entry.id),
      role: entry.role ?? "subagent",
      state: failures > 0 ? "retrying" : "awaiting-digest",
      attempts: failures,
    })
  }
  const ledger = carrierField(carrier, "_unsettledDigests")
  for (const u of Array.isArray(ledger) ? ledger : []) {
    rows.push({
      id: String(u.id),
      role: u.role ?? "subagent",
      state: "unsettled",
      attempts: u.failures ?? 0,
      preview: String(u.report ?? "").slice(0, 400),
    })
  }
  return rows
}

/** 单查 id 同解析（§6.31.6 单查序第三 / 四站）：命中 pending / 升级账本 ⇒ 行形同上；未命中 ⇒ null。 */
export function unsettledRow(carrier, id) {
  const key = String(id)
  return unsettledRows(carrier).find((row) => row.id === key) ?? null
}

/** 端面残余行判据（§6.31.6）：pending 中 `_daFailures > 0` 条数（升级条已离容器——由升级提醒承载）。 */
export function unsettledCount(carrier) {
  const pending = carrierField(carrier, "_pendingAsyncResults")
  let n = 0
  for (const entry of Array.isArray(pending) ? pending : []) if ((entry?._daFailures ?? 0) > 0) n += 1
  return n
}

/** 落痕清位（§6.31.5——`run-start.mjs` 会话态起跑即清；fallback 零动作）：父字段 ∥ history 双清。
 *  注：核内写点落**父字段**（`turn-loop.mjs` 的 `agent._lastRunOutput`——逐轮追加，本批 #939
 *  收正；抗 `history` 整体替换——`context.mjs` `applyCompression`）；`history` 级为兼容读形
 *  （`harvestAccountOutput` 回退分支）——该痕不属跨 run 字段集，§6.31.5 边界句。 */
export function armAccountRound(carrier) {
  if (!carrier || typeof carrier !== "object") return
  carrier._lastRunOutput = null
  if (carrier.history && typeof carrier.history === "object") carrier.history._lastRunOutput = null
}

/** 落痕取件（§6.31.5——载体吸收读：父字段优先 / 回退 `history`）；读值 = 本 run 多轮累积文本（#939）；
 *  缺痕（本 run 零输出落痕——零模型轮 / 起跑即断）⇒ null。 */
export function harvestAccountOutput(carrier) {
  const own = carrier?._lastRunOutput
  if (own !== undefined && own !== null) return own
  return carrier?.history?._lastRunOutput ?? null
}
