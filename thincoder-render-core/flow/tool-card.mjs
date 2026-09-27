/**
 * tool-card.mjs — 工具卡构件面（核化 `webview/ui.js` 的活卡三面——判定表 §3 行 51「拆」）：
 * 建卡（`addTool`）/ 结算（`finishToolCard`）/ 历史卡（`buildToolHistory`）+ 文件链接包裹
 * （`linkifyPaths`——§4 行 12「核 linkify」；桌面不消费 = KD-RC-5）。
 *
 * 非逐字登记（两处）：① 源档两次取时（`ui.js:208` dataset 与 `:239` ref）收成单次
 * `startedAt = now()`（`now` 可注入 = 测试缝；差 ≤ 数 ms，语义等价）；② `window.NodeFilter`
 * 直用（源档同形；`links` 缺省早退 ⇒ 无 DOM 夹具亦可安全 import）。
 *
 * 留端 = `ctx` 装配面：`_toolRefs` 簿记 / `currentBlock.appendChild` / `finishTool` 的
 * 查找与回落 / `hadToolResult` / scrollDown。摘要字面单源 = `tool-summary.mjs`（R1 核件）。
 * 端注入面：`deps = { emit?, t, now? }`——t 缺省 = 核 i18n `t`。
 */
import { esc } from "../md.mjs"
import { capText, isToolFailure } from "../lib.mjs"
import { formatToolSummary } from "../tool-summary.mjs"
import { t as coreT } from "../i18n.mjs"

/** Wrap verified file paths in clickable spans (text-node level — never inside
 *  attributes). One link per text node is enough; paths repeat across output.
 *  （承 `ui.js:247-276` 逐字；`links` = `[{ raw, path, line? }]`——来源端。） */
export function linkifyPaths(bodyEl, links) {
  if (!links?.length) return
  const NF = window.NodeFilter
  const walker = document.createTreeWalker(bodyEl, NF.SHOW_TEXT)
  const nodes = []
  let n
  while ((n = walker.nextNode())) nodes.push(n)
  for (const node of nodes) {
    const text = node.nodeValue
    let idx = -1, hit = null
    for (const l of links) {
      const i = text.indexOf(l.raw)
      if (i >= 0 && (idx < 0 || i < idx)) { idx = i; hit = l }
    }
    if (!hit) continue
    const frag = document.createDocumentFragment()
    if (idx > 0) frag.appendChild(document.createTextNode(text.slice(0, idx)))
    const span = document.createElement("span")
    span.className = "file-link"
    span.textContent = hit.raw
    span.dataset.path = hit.path
    if (hit.line) span.dataset.line = String(hit.line)
    span.setAttribute("role", "link")
    span.tabIndex = 0
    frag.appendChild(span)
    const rest = text.slice(idx + hit.raw.length)
    if (rest) frag.appendChild(document.createTextNode(rest))
    node.parentNode.replaceChild(frag, node)
  }
}

/** 建工具卡（承 `ui.js:203-243` `addTool` 的 DOM 面；`roundTag`（X2，可选）= advisor 轮次标签
 *  ——非空才加一格 span）。返回 `{ el, ref }`：`el` = 卡元素（调用方 append 到 currentBlock），
 *  `ref` = 结算面簿记 `{ h, b, name, id, startTime, done:false }`（`done` = 已结算唯一写点）。 */
export function renderToolCard({ name, args, id, roundTag, t = coreT, now = Date.now } = {}) {
  const startedAt = now()
  const c = document.createElement("div")
  c.className = "tool-call"
  c.dataset.startTime = String(startedAt)

  const h = document.createElement("div")
  h.className = "tool-call-header"
  h.tabIndex = 0
  h.setAttribute("role", "button")
  h.setAttribute("aria-expanded", "false")
  h.innerHTML =
    `<span class="tool-call-icon"></span>` +
    `<span class="tool-call-name">${esc(name)}</span>` +
    (roundTag ? `<span class="tool-call-round">${esc(roundTag)}</span>` : "") +
    `<span class="tool-call-args" title="${esc(args)}">${esc(args.slice(0, 80))}</span>` +
    `<span class="tool-call-status">${t("tool.running")}</span>`

  const b = document.createElement("div")
  b.className = "tool-call-body"
  b.setAttribute("role", "region")
  b.setAttribute("aria-label", `Output of ${name}`)
  b.textContent = t("tool.initial")

  h.addEventListener("click", () => {
    h.querySelector(".tool-call-icon").classList.toggle("open")
    b.classList.toggle("open")
    h.setAttribute("aria-expanded", String(b.classList.contains("open")))
  })

  c.appendChild(h)
  c.appendChild(b)
  c.dataset.toolId = id || name  // fallback: findable via DOM query even if _toolRefs cleared
  const ref = { h, b, name, id: id || name, startTime: startedAt, done: false }
  return { el: c, ref }
}

/** 结算工具卡（承 `ui.js:281-327` `finishToolCard`）：耗时 ms / 结果摘要 / 折叠与展开 / 失败色。
 *  `ref` = `renderToolCard` 返回的簿记（DOM-回落路径可只给 `{ h, b, startTime }`）。 */
export function finishToolCard(ref, name, text, links, truncated, deps = {}) {
  const t = deps.t ?? coreT
  const now = deps.now ?? Date.now
  ref.done = true // M1：已结算唯一写点（回合尾清扫只碰 `!done` 卡）
  // 截断超长输出入 DOM（防无界增长），完整结果不保留——摘要已在 header 显示
  ref.b.textContent = capText(text || "")
  // X5（显示面消差批 §2.2）：宿主切片点携事实旗标 ⇒ 正文明示截断（**旗标驱动**——不由长度比较
  // 驱动：恰 64K 与超出同判，`lib.js capText` 的 `<= max` 边界洞不复辟）。
  if (truncated) ref.b.textContent += "\n" + t("tool.truncated")
  linkifyPaths(ref.b, links)
  const ms = now() - (ref.startTime || now())
  const isError = isToolFailure(text) // F-W16：判据单源（lib.js——与恢复卡同读）
  const statusEl = ref.h.querySelector(".tool-call-status")
  if (statusEl) {
    if (isError) {
      statusEl.textContent = `${t("tool.error")} (${ms}ms)`
      statusEl.style.color = "#f14c4c"
    } else {
      statusEl.textContent = `${t("tool.done")} (${ms}ms)`
      statusEl.style.color = "#4ec9b0"
    }
  }
  // CLI parity: completion summary visible in the header（X3/X7：分派字面见 tool-summary.mjs）
  const summary = formatToolSummary(name, text)
  let summaryEl = ref.h.querySelector(".tool-call-summary")
  if (summary || truncated) {
    if (!summaryEl) {
      summaryEl = document.createElement("span")
      summaryEl.className = "tool-call-summary"
      ref.h.appendChild(summaryEl)
    }
    summaryEl.textContent = "→ " + [summary, truncated ? t("tool.truncated") : ""].filter(Boolean).join(" ")
    summaryEl.style.display = ""
  } else if (summaryEl) {
    summaryEl.style.display = "none"
  }
  // Auto-collapse on success: the header already shows the → summary, so a finished
  // card folds up to one line (CLI outputPanel parity). Errors stay EXPANDED — the
  // user must see what failed without an extra click.
  if (isError) {
    ref.b.classList.add("open")
    ref.h.querySelector(".tool-call-icon")?.classList.add("open")
    ref.h.setAttribute("aria-expanded", "true")
  } else {
    ref.b.classList.remove("open")
    ref.h.querySelector(".tool-call-icon")?.classList.remove("open")
    ref.h.setAttribute("aria-expanded", "false")
  }
}

/** 历史工具卡（承 `ui.js:355-388` `buildToolHistory`——从人类行渲染的折叠只读卡；`ctx` 入参未用
 *  ——去参）。`idx` 在场 ⇒ 落 `data-idx`（lazy-load paging 锚）。 */
export function renderToolHistory(name, text, idx) {
  const c = document.createElement("div")
  c.className = "tool-call"
  c.dataset.toolId = "hist-" + (idx ?? name)

  const h = document.createElement("div")
  h.className = "tool-call-header"
  h.tabIndex = 0
  h.setAttribute("role", "button")
  h.setAttribute("aria-expanded", "false")
  if (idx !== undefined) c.dataset.idx = String(idx) // lazy-load paging (minLoadedIdx)
  const summary = formatToolSummary(name, text) // 恢复面同判据（X3/X7 单源——活卡/恢复卡同字面）
  h.innerHTML =
    `<span class="tool-call-icon"></span>` +
    `<span class="tool-call-name">${esc(name)}</span>` +
    `<span class="tool-call-status" style="color:#4ec9b0">${coreT("tool.done")}</span>` +
    (summary ? `<span class="tool-call-summary">→ ${esc(summary)}</span>` : "")

  const b = document.createElement("div")
  b.className = "tool-call-body"
  b.setAttribute("role", "region")
  b.setAttribute("aria-label", `Output of ${name}`)
  b.textContent = text || ""

  h.addEventListener("click", () => {
    h.querySelector(".tool-call-icon").classList.toggle("open")
    b.classList.toggle("open")
    h.setAttribute("aria-expanded", String(b.classList.contains("open")))
  })

  c.appendChild(h)
  c.appendChild(b)
  return c
}
