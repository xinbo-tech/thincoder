/**
 * provider-probe-window.mjs — 渠道准入探针窗口（F-W19 · `SETTINGS.md` §2.12）
 * 自 `settings.mjs` 外提（N-P3 体量拆分——探针窗口族 = 自持状态 + 重试纪律，缝 = re-export）。
 * 职责：面板级探针窗口面 = 在飞去重（同窗并发调用共享同一批）· 失败子集有界重探（≤ 2 拍 +
 * 宿主忙让位）· 窗口终止（关闭 / 重开）；落账（核 `recordAdmission`）与载荷装配（`fullStatus`
 * 的 flush）留在 `settings.mjs`——本档只持窗口状态与探针调度。
 * 依赖指向：`settings.mjs` → 本档（无环——本档不引 `settings.mjs`）。
 */

import { buildProvider, providerLabel } from "./presets.mjs"
import { listModels, channelUnavailableMessage, recordAdmission } from "@thincoder/core/provider/list-models.mjs"
import { specForModel } from "../specs.mjs"
import { hostBusy, probeFailureOf } from "./loop-sampler.mjs"

// ─── 渠道准入探针批次：在飞去重 + 有界重试 + 窗口终止（F-W19 · `SETTINGS.md` §2.12）───
/** 单批延迟重试上限（§2.12 重试纪律「单批延迟重试 ≤ 2 次」）。 */
const PROBE_RETRY_MAX = 2
/** 重试延迟（ms）——设计未给常量：取 2 × 判定窗口（`loop-sampler.mjs` `WINDOW_MS`）
 *  ⇒ 上一拍的忙态证据先滚出窗口，重试拍不撞同一忙窗；同时远小于用户可感的配置阶段尺度。 */
const PROBE_RETRY_DELAY_MS = 2000
// 测试缝（同上）：重试延迟可注入——免用例真等 `PROBE_RETRY_DELAY_MS`（窗尺度）。
let _probeRetryDelayMs = PROBE_RETRY_DELAY_MS
export function _setProbeRetryDelayForTest(ms) { _probeRetryDelayMs = Number.isFinite(ms) ? ms : PROBE_RETRY_DELAY_MS }

/** 面板 → 探针窗口（键 = 面板对象：关闭 / 重开 = 新窗口——§2.12 ③「面板关闭 / 重开」）。 */
const _probeWindows = new Map()

/** 取（或建）面板的探针窗口：在飞去重 + 重试链 + 本窗逐渠道末次结果（`models` / `diag`）。 */
export function _probeWindow(panel) {
  let w = _probeWindows.get(panel)
  if (!w) {
    w = { inFlight: null, retryChain: null, retryTimer: null, wake: null, cancelled: false, models: new Map(), diag: new Map() }
    _probeWindows.set(panel, w)
  }
  return w
}

/** 面板关闭 / 重开 ⇒ 窗口终止（幂等）：撤未发重试定时器 + 解除等待（在途探测结果不再回投）。 */
export function endProbeWindow(panel) {
  const w = _probeWindows.get(panel)
  if (!w) return
  w.cancelled = true
  if (w.retryTimer) { clearTimeout(w.retryTimer); w.retryTimer = null }
  w.wake?.(false)
  _probeWindows.delete(panel)
}

/** 测试缝：清空全部探针窗口（撤定时器——免跨用例串味）。 */
export function _resetProbeWindowsForTest() {
  for (const w of _probeWindows.values()) {
    w.cancelled = true
    if (w.retryTimer) clearTimeout(w.retryTimer)
    w.wake?.(false)
  }
  _probeWindows.clear()
}

/** 单渠道探一次并入窗：探通 = 候选行 + 落账清除（① `recordAdmission(name,{ok:true})`——
 *  记录不再携带 `failure`，`ts` 由核统一盖）；探不通 = 落账分类（`failure` 取端侧装配：
 *  宿主忙证据 ⇒ `hostBusy`，否则核分类 timeout / malformed）+ 该渠道诊断项（`reason` 逐字）。 */
async function _probeChannelInto(w, name) {
  const prov = await buildProvider(name)
  if (!prov) { w.models.set(name, []); return }
  const row = (id) => {
    const spec = specForModel(id)
    const r = spec.reasoningEffortEnum || (spec.thinking ? ["enabled"] : [])
    return { id, label: id, provider: name, group: providerLabel(name), reasoning: r, effortDefault: spec.reasoningEffortDefault || null }
  }
  try {
    const ids = await listModels(prov)
    recordAdmission(name, { ok: true })
    w.models.set(name, ids.map(row))
    w.diag.delete(name)
  } catch (e) {
    const reason = channelUnavailableMessage(e) // M8 逐字长句——零改
    recordAdmission(name, { ok: false, reason, failure: probeFailureOf(e) })
    w.models.set(name, [])
    w.diag.set(name, { provider: name, reason })
  }
}

/** 一次探针批（在飞去重：同窗并发调用**共享同一批**——「同批不叠发探针」§2.12）。 */
export function _probeBatch(w, names) {
  if (w.inFlight) return w.inFlight
  const p = Promise.allSettled(names.map((n) => _probeChannelInto(w, n)))
    .then(() => undefined)
    .finally(() => { if (w.inFlight === p) w.inFlight = null })
  w.inFlight = p
  return p
}

/** 窗口内存活等待（ms）——窗口终止即立即解除（`false`：不发无主探针）。 */
function _delayInWindow(w, ms) {
  return new Promise((resolve) => {
    w.retryTimer = setTimeout(() => { w.retryTimer = null; w.wake = null; resolve(true) }, ms)
    w.wake = () => { w.wake = null; resolve(false) } // 终止路径：定时器由 endProbeWindow 撤
  })
}

/** 失败子集有界重试链（§2.12）：每拍重算失败集（新失败渠道自动并入）· ≤ `PROBE_RETRY_MAX`
 *  探 + 同数让位（宿主忙 ⇒ 让位不探——闸，见 `hostBusy()`；让位有界，不无限让位）·
 *  批次成功 / 窗口终止即止；探针走 `_probeBatch`（在飞去重——不叠发）。链不叠：窗口内至多一条。 */
export function _retryFailed(w, flush) {
  if (w.retryChain) return w.retryChain
  const chain = (async () => {
    let fired = 0
    let deferred = 0
    while (fired < PROBE_RETRY_MAX && deferred < PROBE_RETRY_MAX) {
      const failed = [...w.diag.keys()]
      if (failed.length === 0 || w.cancelled) return // ① 批次成功 / ③ 窗口终止
      if (!(await _delayInWindow(w, _probeRetryDelayMs)) || w.cancelled) return
      if (hostBusy()) { deferred += 1; continue } // 闸：宿主忙不重试（不在忙循环上加压）
      fired += 1
      await _probeBatch(w, failed)
      if (w.cancelled) return
      flush() // ② 准入翻转：载荷 `available: false → true` + 候选面收敛（§2.12 三清除）
    }
    // ② 单批重试 ≤ 2 次用尽 ⇒ 窗口内不再重试（面板重开 = 新窗口）
  })().finally(() => { if (w.retryChain === chain) w.retryChain = null })
  w.retryChain = chain
  return chain
}
