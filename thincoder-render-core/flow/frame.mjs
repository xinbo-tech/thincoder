/**
 * frame.mjs — 帧合并件（**更新纪律收核** —— 单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-9 ·
 * 批 = `docs/batches/2026-09-29-render-perf.md` · 台账 #609）：脏标记 ∕ 帧合并 ∕ 应用器契约。
 *
 * 端侧触发源（宿主事件 ∕ store 变更）⇒ `mark(keys)` 置脏 + 单飞排一帧；帧时刻统一 `apply(dirtyKeys)`；
 * 帧间 ≥ `FRAME_MIN_MS`（跳帧重排 —— 脏集非空则继续排队）；`flush()` = 同步尾帧（顺序保真点：回底 ∕
 * 测试 ∕ 探针确定性）。**触发源留端**（核不订阅宿主事件）；帧语义逐行对位 `createStreamRenderer`
 * （`flow/stream.mjs:36-92`）——两件分工 = 单目标流式缝合（VSC 流式档现行）∥ 多面脏键集合并（桌面六面）。
 *
 * 应用器契约（`deps.apply(dirtyKeys)` —— 单源 = KD-RC-9）：
 *   ① 每键面每帧至多绘一次（增量更新为默认——尾块就地 ∕ O(1) 追加 ∕ 面内差分；整面重挂仅判据命中）
 *   ② 布局节俭（禁逐 chunk 强制布局——读数仅帧内、按档裁剪）
 *   ③ 帧尾动作（滚动 ∕ 钉底 ∕ gating）落面尾段、每帧至多一次
 *   ④ 每 chunk 同步成本禁 ∝ 累计文本
 *   ⑤ `apply` 抛错语义——脏集于调用前快照并清空（apply 内新 `mark` ⇒ 落下一帧；抛错帧不重试同脏集）·
 *      异常不吞（直抛）· 单飞标记 `try/finally` 复位 ⇒ 帧链不断（抛错后后续 `mark` 照常起帧）。
 */

/** 帧最小间隔（与核 `STREAM_RENDER_MIN_MS` 同值同意 —— 反逐 chunk 重绘；源档常量）。 */
export const FRAME_MIN_MS = 50

/** 建帧合并器（注入面 `deps = { apply(dirtyKeys), raf?, now?, minMs? }` —— 平 node 直测缝；`raf` 缺省 =
 *  浏览器原生 `requestAnimationFrame`）。返回：
 *  - `mark(keys)`：脏键集并入（O(1)/键）+ 单飞排一帧（**挂起中重 `mark` 零重挂**）
 *  - `flush()`：同步尾帧（脏集调用前快照并清空；空集零调 `apply`） */
export function createFrameMerge(deps = {}) {
  const raf = deps.raf ?? ((cb) => requestAnimationFrame(cb))
  const now = deps.now ?? Date.now
  const minMs = deps.minMs ?? FRAME_MIN_MS
  let _scheduled = false // 单飞标记（挂起中 ⇒ 重 mark 零重挂）
  let _dirtyKeys = new Set() // 脏键集（插入序 = apply 入参序）
  let _lastRender = 0

  /** 出帧：脏集**调用前快照并清空**（apply 内新 `mark` ⇒ 落下一帧；抛错帧不重试同脏集）。 */
  function fire() {
    if (_dirtyKeys.size === 0) return
    const keys = [..._dirtyKeys]
    _dirtyKeys.clear()
    deps.apply?.(keys)
  }

  function schedule() {
    if (_scheduled) return
    _scheduled = true
    raf(() => {
      try {
        const at = now()
        if (at - _lastRender >= minMs) {
          _lastRender = at
          fire()
        }
        // 否则 = 距上一帧 < FRAME_MIN_MS：跳帧不绘（脏集保留 —— finally 之后重排）
      } finally {
        _scheduled = false // 单飞复位（try/finally —— apply 抛错直抛后帧链仍可续）
        // 重排下一帧：① 跳帧（脏集未绘）② **apply 内新 `mark`**（本次快照后新增的脏键）—— 含抛错径（帧链不断）
        if (_dirtyKeys.size > 0) schedule()
      }
    })
  }

  return {
    flush() { fire() },
    mark(keys) {
      if (keys === null || keys === undefined) return
      for (const key of keys) _dirtyKeys.add(key)
      schedule()
    },
  }
}
