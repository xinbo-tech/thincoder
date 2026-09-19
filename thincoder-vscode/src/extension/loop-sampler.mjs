/**
 * loop-sampler.mjs — 扩展宿主事件循环采样器（F-W19 · `docs/vsc/design/SETTINGS.md` §2.12）。
 *
 * 唯一职责：给出「宿主此刻是否忙」的**证据判定**（`hostBusy()`）——采样器每
 * `SAMPLE_INTERVAL_MS` 记一次拍，相邻两拍间隔（lag）≥ `BUSY_LAG_MS` ⇒ 宿主事件循环
 * 被长任务占住（探针超时多半非渠道故障，不是渠道的错）。
 * 兼作延迟重试闸（调用方在 `hostBusy()` 为真时不加压——见 `settings.mjs` 探针窗驱动）。
 *
 * 落账粒度 = **lag 观测**（`{ at, lag }`，`at` = 观测时刻），不是采样时刻表——被冻期间
 * 无拍可记，唯一证据就是解冻后第一拍的间隔；若按采样时刻裁剪，这条证据会被同一拍裁掉
 * （判据永不成立）⇒ 忙证据以自身 `at` 计窗：`now − WINDOW_MS ≤ at ≤ now` 内存在
 * `lag ≥ BUSY_LAG_MS` ⇒ 忙，滚出窗即失效（旧忙态不粘滞）。
 *
 * 纪律：`hostBusy()` 纯内存、零 exec、零 I/O（不得自身成为阻塞源）；采样器起停幂等
 * （activate / deactivate 各一次）；未启动 ⇒ `hostBusy()` 恒 false（fail-open——无证据不判忙）。
 */

import { classifyProbeFailure, recordAdmission } from "@thincoder/core/provider/list-models.mjs"

/** 采样间隔（ms）——窗口精度 = 本值；纯 `Date.now()` 读数，不产生 I/O。 */
export const SAMPLE_INTERVAL_MS = 100
/** 窗口长度（ms）——`hostBusy()` 只认最近本窗口内的 lag 观测（旧忙态不粘滞）。 */
export const WINDOW_MS = 1000
/** 忙阈值（ms）——窗口内 lag ≥ 本值 ⇒ 宿主事件循环被占（§2.12 判据）。 */
export const BUSY_LAG_MS = 1000

let _timer = null
let _last = 0
const _lags = [] // 窗内忙证据（{ at, lag }，升序；只记 ≥ BUSY_LAG_MS 的拍——常态拍零增长）

// 测试缝（先例 `_setProbeImplForTest`）：时钟可注入——伪时钟下用例零真实等待。
let _nowFn = null
const _now = () => (_nowFn ?? Date.now)()

/** 启动采样（幂等——已在跑则零动作）。 */
export function startSampler() {
  if (_timer) return
  _lags.length = 0
  _last = _now()
  _timer = setInterval(() => {
    const now = _now()
    const lag = now - _last
    _last = now
    if (lag >= BUSY_LAG_MS) _lags.push({ at: now, lag })
    while (_lags.length > 0 && now - _lags[0].at > WINDOW_MS) _lags.shift()
  }, SAMPLE_INTERVAL_MS)
  // 宿主事件循环里的采样器不得拖住退出（unref：扩展 deactivate 后进程可正常结束）。
  if (typeof _timer?.unref === "function") _timer.unref()
}

/** 停止采样（幂等）——清忙证据（无证据 ⇒ `hostBusy()` 回 false）。 */
export function stopSampler() {
  if (_timer) clearInterval(_timer)
  _timer = null
  _lags.length = 0
}

/** 宿主此刻是否忙（§2.12：窗口内存在 lag ≥ `BUSY_LAG_MS`）。纯内存零 I/O。 */
export function hostBusy() {
  const now = _now()
  return _lags.some((r) => now - r.at >= 0 && now - r.at <= WINDOW_MS)
}

/** 端侧探针失败分类装配（`SETTINGS.md` §2.12 · `PROVIDER.md` §6.16 M8/M9 补）：
 *  宿主忙 = **证据**覆盖 ⇒ `hostBusy`（非渠道故障——展示面不得误判渠道）；
 *  否则取核分类（`timeout` / `malformed`——分类单源在核 `classifyProbeFailure`）。 */
export function probeFailureOf(error) {
  return hostBusy() ? "hostBusy" : classifyProbeFailure(error)
}

/** 核探针已落账失败（raw 分类）后按宿主证据覆盖（`reason` 逐字不动——`channelUnavailableMessage` 零改）。
 *  返回 true = 已覆盖落账。 */
export function overrideAdmissionIfHostBusy(name, reason) {
  if (!hostBusy()) return false
  recordAdmission(name, { ok: false, reason, failure: "hostBusy" })
  return true
}

/** 测试缝：注入时钟（`{ nowFn }`）或复位（`null`）。 */
export function _setLoopSamplerForTest(seam) {
  _nowFn = seam?.nowFn ?? null
}
