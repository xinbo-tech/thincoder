/**
 * stream.mjs — 流式增量渲染的 rAF 降频缝合（核化 `webview/streaming.js:36-79` / `:112` /
 * `:218-231`——判定表 §3 行 47「拆」）。
 *
 * 缝合语义（逐字承源档）：reasoning/token chunk 千级/秒到达，逐 chunk 全量 md() + innerHTML
 * 是 O(n²) 且堵塞主线程（2026-08-16 "Stop won't stop while thinking" 缺陷治本）——rAF 降频
 * 到「一帧一渲 + 帧间 ≥50ms」；子代理块跟滚入同帧脏集。`ctx` / `S` 指针与帧尾滚动 pin 留端
 * （经 `deps` 回调）。
 *
 * 端注入面：`deps = { reasoning?, token?, subScroll?, frameEnd?, raf?, now?, minMs? }`——
 *   `reasoning()` / `token()` 取当前目标 `{ el, raw } | null`（端 ctx 指针，帧内现取——与源档同形）；
 *   `subScroll(blocks)` 逐块应用跟滚；`frameEnd()` = 帧尾（源档 maybeScrollDown + maybeScrollActivity）。
 */
import { md } from "../md.mjs"
import { t as coreT } from "../i18n.mjs"
import { capText, MAX_TOOL_OUTPUT } from "../lib.mjs"

/** 长回复降频：全量 md() 重渲染限到 ≥50ms 一次（源档常量）。 */
export const STREAM_RENDER_MIN_MS = 50

/** 单目标重渲：md 全量重渲，失败回退原文（源档 try/catch 形——两目标同面）。 */
export function paintStreamTarget(el, raw) {
  if (!el) return
  try { el.innerHTML = md(raw) } catch { el.textContent = raw }
}

/** 推理目标重渲（+ 追加滚动到底——源档 `:50` 行为）。 */
export function paintReasoningTarget(el, raw) {
  paintStreamTarget(el, raw)
  if (el) el.scrollTop = el.scrollHeight
}

/** 工具输出 O(1) 追加原语（**更新纪律收核** —— 单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-9；
 *  逻辑自 VSC `webview/chat-messages.js:77-96` toolOutput 支上提，VSC 改指零行为变更；桌面工具卡结果区消费）：
 *   ① 占位清：`deps.initial` 给（非 `undefined`）且现读数恒等 ⇒ 清空（首 chunk 落位）；
 *   ② 追加：`textContent += text`（成本 ∝ 本次 chunk —— 禁 ∝ 累计文本）；
 *   ③ 截断：超 `MAX_TOOL_OUTPUT` ⇒ `capText` 截断（**注字面 = `capText` 缺省注单源**）+ `_capped` 停收
 *      （此后零写 —— 截断态幂等）。
 *  幂等：空串 ∕ 已 `_capped` ⇒ 零写；`el` 缺 ⇒ 直返。返回 `el`（链式 ∕ 读数面）。 */
export function appendToolOutput(el, text, deps = {}) {
  if (!el) return el
  if (deps.initial !== undefined && el.textContent === deps.initial) el.textContent = ""
  if (el._capped === true) return el
  const chunk = typeof text === "string" ? text : ""
  if (chunk === "") return el
  el.textContent += chunk
  if (el.textContent.length > MAX_TOOL_OUTPUT) {
    el.textContent = capText(el.textContent)
    el._capped = true
  }
  return el
}

/** 建流式重渲器（实例态 = 源档模块级四变量：`_renderScheduled` / `_reasoningDirty` /
 *  `_tokenDirty` / `_subScrollDirty` / `_lastStreamRender`）。返回：
 *  - `markReasoning()` / `markToken()` / `markSubScroll(block)`：置脏 + 排队一帧
 *  - `flush()`：同步渲 reasoning + token（回合尾兜底尾帧——源档 flushStreamRender 同面） */
export function createStreamRenderer(deps = {}) {
  const raf = deps.raf ?? ((cb) => requestAnimationFrame(cb))
  const now = deps.now ?? Date.now
  const minMs = deps.minMs ?? STREAM_RENDER_MIN_MS
  let _renderScheduled = false
  let _reasoningDirty = false
  let _tokenDirty = false
  let _subScrollDirty = null // 子代理块跟滚脏集（Set 惰性建——§13 C-LU2；rAF 尾应用后置空）
  let _lastStreamRender = 0

  function paintDirty() {
    if (_reasoningDirty) {
      const r = deps.reasoning?.()
      // 源档同形：目标不在 ⇒ 脏位**不清**（目标回位后下一帧补渲）
      if (r) { paintReasoningTarget(r.el, r.raw); _reasoningDirty = false }
    }
    if (_tokenDirty) {
      const b = deps.token?.()
      if (b) { paintStreamTarget(b.el, b.raw); _tokenDirty = false }
    }
  }

  function schedule() {
    if (_renderScheduled) return
    _renderScheduled = true
    raf(() => {
      _renderScheduled = false
      const at = now()
      if (at - _lastStreamRender < minMs) {
        // 距上次渲染 <50ms：跳过一次，仍有脏内容则继续排队（flush 兜底尾帧）
        if (_tokenDirty || _reasoningDirty || _subScrollDirty) schedule()
        return
      }
      _lastStreamRender = at
      paintDirty()
      if (_subScrollDirty) {
        // 子代理块块级跟滚（§13 C-LU2——逐块应用后置空；让位旗标 = 内容区 _pinFollow）
        const blocks = [..._subScrollDirty]
        _subScrollDirty = null
        deps.subScroll?.(blocks)
      }
      deps.frameEnd?.()
    })
  }

  /** 同步尾帧（回合尾：终帧必须在 finish() 复位气泡指针前画出）。 */
  function flush() {
    paintDirty()
  }

  return {
    flush,
    markReasoning() { _reasoningDirty = true; schedule() },
    markToken() { _tokenDirty = true; schedule() },
    markSubScroll(block) { _subScrollDirty ??= new Set(); _subScrollDirty.add(block); schedule() },
  }
}

/** 给容器内全部代码块挂复制钮（承 `streaming.js:218-231` 逐字；已挂者跳过，2000ms 复位标签）。 */
export function attachCopyButtons(container, deps = {}) {
  if (!container) return
  const t = deps.t ?? coreT
  const blocks = container.querySelectorAll(".code-block")
  for (const block of blocks) {
    if (block.querySelector(".code-copy-btn")) continue // already has one
    const btn = document.createElement("button")
    btn.className = "code-copy-btn"
    btn.textContent = t("msg.copy")
    btn.addEventListener("click", async () => {
      const code = block.querySelector("code")?.textContent || ""
      try { await navigator.clipboard.writeText(code) } catch { /* */ }
      btn.textContent = t("msg.copied")
      btn.classList.add("copied")
      setTimeout(() => { btn.textContent = t("msg.copy"); btn.classList.remove("copied") }, 2000)
    })
    block.appendChild(btn)
  }
}
