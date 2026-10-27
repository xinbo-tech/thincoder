/**
 * agent/digest-account.mjs — 消化账务单件（AGENT-LOOP-ASYNC-POOL.md §6.31 · 批 digest-accounting ·
 * 台账 #930；批 digest-retry-amplify · 台账 #1850：投递恒一次）：投递 ≠ 销账——报告不许无声消失。
 *
 * 三角色（§6.31.2）：**投递**（注入但留容器——每条恒一次）/ **见账**（消化轮收尾逐条机检账目覆盖）/
 * **销账**（覆盖才离容器 + 释放 report；未覆盖计一个未签收轮，达 `DA_MISS_LIMIT` ⇒ 升级）。本档承载：
 * 常量（`DA_MISS_LIMIT`）/ 回合分类（`isDigestRound`）/ 投递门控（`shouldDeliverEntry`）/ 账目合同
 * （`coversDigestId` 解析 ∥ `digestAccountRequirement` 要求行）/ 见账 pass（`accountDigestRound`——
 * 销账 ∥ 未签收轮 ∥ 升级四步含终局披露）/ 读面（`unsettledRows` · `unsettledRow` · `unsettledCount`）/
 * 落痕清位 ∕ 取件助手（`armAccountRound` · `harvestAccountOutput`）。
 *
 * 载体（§6.31.2）：`_daSession`（会话标记——挂起会话置 / 复位，`agent/suspension.mjs`）与
 * `_unsettledDigests`（升级账本——经 `async-settle.mjs` 写助手）；账目态挂条目字段
 * （`_daDelivered` / `_daMissRounds`）。**fallback 面**（无 `_daSession`——headless /
 * 直连 `runAgent`）零账目动作（不销账 / 不计未签收轮 / 不升级）：缺省条逐字沿用取尽语义（先离容后注入）；
 * 已投递未销账条同判据跳过且留容器（§6.31 出口缝② · 父侧裁定 2026-10-05）。
 *
 * 边界（§6.31.12）：不做处理质量机检（只保「不许无声」）；升级账本无 TTL（会话期面——
 * 中止清、idle 存续）。
 */
import { logEvent, errText } from "../log.mjs"
import { pushReal } from "../context.mjs"
import { carrierField, releaseSettledEntry, appendUnsettledDigest } from "../agent-tools/async-settle.mjs"
import { DIGEST_ACCOUNT_DOMAIN } from "./helpers.mjs"

/** 同条未签收上限（§6.31.5 KD-DA11）：积满 DA_MISS_LIMIT 个未签收消化轮 ⇒ 升级（离容器 + 账本 + 提醒 + 终局披露一次）。
 *  依据 = 「连空 3 轮仍须在容器、第 4 轮补签仍能销账」的**下界**（N = 4——无额外余量；可复算；不取观测值——
 *  修前观测受「总投递 ≤3」删失）。 */
export const DA_MISS_LIMIT = 4

/**
 * 回合分类单点（§6.31.2）：账目只属**消化轮**（autoTurn ∧ 非上行唤醒轮 ∧ 非 timer 轮）——
 * timer / 上行轮投递不销账（其账目在后续消化轮）。
 */
export function isDigestRound(opts) {
  return opts?.autoTurn === true && opts?.upstreamTurn !== true && opts?.timerTurn !== true
}

/**
 * 投递门控（§6.31.4 单点谓词 · 批 digest-retry-amplify 收为单门）：`!_daDelivered` ∧ 本回合 = 系统轮
 * （`autoTurn`）⇒ 投（首次投递——**用户回合零投递**）；`_daDelivered` 已置 ⇒ 恒跳过（**每条只投一次**——
 * 重投回路退场，§6.31.5 KD-DA4）。注入抛错 ⇒ `_daDelivered` 未置 ⇒ 下一系统轮重试注入
 * （注入失败的再试，不属投递回路）。
 * 注：`autoTurn` 判据由调用方（`run-start.mjs` 会话态支）传入；回退面（非会话态支）不经本谓词。
 */
export function shouldDeliverEntry(entry, autoTurn) {
  if (entry?._daDelivered === true) return false
  return autoTurn === true
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
 * - 未覆盖（空回合 ∥ 有输出未签收——同判同计）⇒ `_daMissRounds += 1`；< `DA_MISS_LIMIT` ⇒ 条留容器、
 *   **零投递动作**；达上限 ⇒ **升级**（四步固定先后：账本 → 提醒 → 离容器 → 终局披露）。
 * 缺痕（output == null——抛错 / 撞帽 / 未收口 / 整 run 零非空正文）⇒ 按未签收判（与「有输出未签收」同出口）。
 *
 * async（§6.31.5 升级支 ④）：披露复用首投注入器 ⇒ pass 变 async——唯一调用点 = `run-stages.mjs` 的
 * finalize 单点（已 await）。披露逐条 try/catch：判据 = **披露失败不得使报告离开可见面**
 * （账本 + 提醒 + status 面 `preview` 已在披露之前落定，失败降级可见性、留痕不静默）。
 */
export async function accountDigestRound(carrier) {
  const pending = carrierField(carrier, "_pendingAsyncResults")
  if (!Array.isArray(pending)) return { covered: 0, unsettled: 0 }
  const output = harvestAccountOutput(carrier)
  const covered = []
  const upgraded = []
  for (const entry of [...pending]) {
    if (entry?._daDelivered !== true) continue
    if (output != null && coversDigestId(output, entry.id)) { covered.push(entry); continue }
    entry._daMissRounds = (entry._daMissRounds ?? 0) + 1
    if (entry._daMissRounds >= DA_MISS_LIMIT) upgraded.push(entry)
  }
  for (const entry of covered) {
    const i = pending.indexOf(entry)
    if (i >= 0) pending.splice(i, 1)
    releaseSettledEntry(entry)
  }
  if (upgraded.length === 0) return { covered: covered.length, unsettled: 0 }
  // 升级四步固定先后（§6.31.5——纯内存的两面先落、披露最后：披露是本 pass 唯一的 I/O，
  // 抛错会中断余下条目判定并越过 `run-stages.mjs` 的 `_inAutoTurn = false` 与 guard 快照）。
  // ① 入账本（纯内存）：账本记录 = **快照**，只喂 status 面与 `preview`——被注入的对象是原条目（见 ④）。
  for (const entry of upgraded) {
    appendUnsettledDigest(carrier, {
      id: String(entry.id),
      role: entry.role ?? "subagent",
      missRounds: entry._daMissRounds,
      report: entry.report ?? null,
      at: Date.now(),
    })
  }
  // ② 提醒：恰一条（机器线 + 人读线——`pushReal`）+ 恰一条留痕（字段单源 = LOGGING.md §6.2）。
  // 注：`ids` 以 join 串落盘——`logEvent` 只收标量（数组字段会被静默丢弃——先例 `ev:discarded`）。
  {
    const ids = upgraded.map((entry) => String(entry.id))
    pushReal(carrier, { role: "user", content: unsettledReminder(upgraded.length, ids) })
    logEvent("ev:unsettled", { n: upgraded.length, ids: ids.join(", ") })
  }
  // ③ 离容器（纯结构）：至此条目定态「已升级」，不再参与判定 ⇒ 披露结构上至多一次。
  for (const entry of upgraded) {
    const i = pending.indexOf(entry)
    if (i >= 0) pending.splice(i, 1)
  }
  // ④ 终局披露：**按 role 与首投同分流**（consult → `injectConsultResult`；其余 → `injectAsyncResult`——
  // 内部已分派 bg / browser）；不新造第二投递形。注入的对象 = **原条目**（墓碑值
  // `error != null ? "failed" : "consumed"` 与评审族投递水印 `entry.run` 都按原条目字段才成立）。
  const { injectAsyncResult } = await import("../agent-tools/subagent.mjs")
  const { injectConsultResult } = await import("../agent-tools/consult.mjs")
  for (const entry of upgraded) {
    try {
      if (entry.role === "consult") await injectConsultResult(carrier, entry)
      else await injectAsyncResult(carrier, entry)
    } catch (e) {
      // 逐条 continue（形同 `suspension.mjs` 注入循环收口；差异 = 该处首错即 return）——
      // 账本 + 提醒已在 ① ② 落地，单条披露失败不得拦住余下条目，也不得拦住 finalize 的收尾两步。
      logEvent("ev:unsettled-disclose-failed", { id: String(entry.id), err: errText(e, 200) })
    }
  }
  return { covered: covered.length, unsettled: upgraded.length }
}

/** 升级提醒行（§6.31.5——含 n / 轮数（恒 = `DA_MISS_LIMIT`，升级只在第 N 个未签收轮发生）/ id 清单与接手指引）。 */
export function unsettledReminder(n, ids) {
  return `[System reminder: ${n} background report(s) were delivered but never accounted after ${DA_MISS_LIMIT} digest rounds — they are marked UNSETTLED: ${ids.map((id) => `#${id}`).join(", ")}. Their content was delivered once in this conversation and is re-delivered once right below as the final delivery — if that copy is missing, the delivery failed and the full text stays readable via subagent action:'status'. Process it there or re-spawn the work.]`
}

/**
 * 读面（§6.31.6——status 段 ∥ 端面残余行共用单点）：行 = `{ id, role, state, attempts }`；
 * state ∈ `awaiting-digest`（在途未投递 ∥ 已投递未判 = `attempts == 0`）/ `unaccounted`（判过未签收 =
 * `attempts > 0`）/ `unsettled`（已升级——随携 `preview` ≤400 字符）；`attempts` = 未签收轮数 `_daMissRounds`。
 */
export function unsettledRows(carrier) {
  const rows = []
  const pending = carrierField(carrier, "_pendingAsyncResults")
  for (const entry of Array.isArray(pending) ? pending : []) {
    const missRounds = entry?._daMissRounds ?? 0
    rows.push({
      id: String(entry.id),
      role: entry.role ?? "subagent",
      state: missRounds > 0 ? "unaccounted" : "awaiting-digest",
      attempts: missRounds,
    })
  }
  const ledger = carrierField(carrier, "_unsettledDigests")
  for (const u of Array.isArray(ledger) ? ledger : []) {
    rows.push({
      id: String(u.id),
      role: u.role ?? "subagent",
      state: "unsettled",
      attempts: u.missRounds ?? 0,
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

/** 端面残余行判据（§6.31.6）：pending 中 `_daMissRounds > 0` 条数（与状态面 `unaccounted` 同判据；
 *  升级条已离容器——由升级提醒承载）。 */
export function unsettledCount(carrier) {
  const pending = carrierField(carrier, "_pendingAsyncResults")
  let n = 0
  for (const entry of Array.isArray(pending) ? pending : []) if ((entry?._daMissRounds ?? 0) > 0) n += 1
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
 *  缺痕（本 run 零输出落痕——零模型轮 / 起跑即断 / 每轮正文皆空）⇒ null。 */
export function harvestAccountOutput(carrier) {
  const own = carrier?._lastRunOutput
  if (own !== undefined && own !== null) return own
  return carrier?.history?._lastRunOutput ?? null
}
