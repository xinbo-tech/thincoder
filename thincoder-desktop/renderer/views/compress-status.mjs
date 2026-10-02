/**
 * compress-status.mjs — 流内**压缩状态行**（R4 · 桌面功能对位批 —— 单元素四态：start ∕ done ∕ fallback ∕ failed；
 * 单源 = `thincoder-vscode/webview/chat-status.js:17-44`）。
 *
 * 四态词面 = 核字典 `compress.*` 经 `t()` 投影直取（`compress.start` ∕ `compress.starting` ∕ `compress.done` ∕
 * `compress.fallback` ∕ `compress.failed` —— **零新键**，值同源零复制）；缺值回落 `?` ∕ `0.0s`（沿 VSC 同式）。
 * 三件：构树 `compressNode(slice)` · 帧尾态刷 `syncCompress(root, slice, anchor)` · 插点锚 `compressAnchorOf(root)`；
 * 在场 ⟺ 本键 `compress` 切片在场（四态皆在场 —— 元素常驻至首屏页读整置，沿 VSC「session view clears recreate it」）；
 * 文本 ∕ class 等价 ⇒ 零写；换代 ⇒ 原位换（零序跳）；缺席 ⇒ 摘。
 * **定位语义 = 流元素冻结点**（VSC D-C3 append-once）：创建点定位后新内容一律居其下 —— 块插入点不收本行；
 * 族内序 = **压缩行族首**（→ 消化行族 → 到期触发行组 → 停止痕 → 台账行 → 帮助行族；行 = 流元素冻结点 ⇒ 活流按创建时点、族序为重建序）；插点锚单源 = 本档 `compressAnchorOf`（链不收消化行族）；
 * 块节点插点锚 = `renderer/views/chat-chrome.mjs` `blockAnchor`（尾组链 —— 本行不在其上）。
 * 零 DOM 直取（描述符经 `renderer/dom.mjs` `build`）；零 `node:` / 零裸包（渲染面静态闭包判据）。
 */
import { build } from "../dom.mjs"
import { t } from "../i18n.mjs"

/** 数值归一（缺 / 非数 ⇒ `null` —— 渲染面 `?` 兜底；零抛）。 */
function numOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

/** 四态文案（VSC `chat-status.js:26-41` 同式：start 两形〔摘要 N 条 ∕ 无 N〕/ done 两值 / fallback 截断数 / failed 错误串）。 */
export function compressText(slice) {
  if (slice?.status === "start") {
    return numOrNull(slice.messages) === null ? t("compress.starting") : t("compress.start", { n: slice.messages })
  }
  if (slice?.status === "done") {
    const freed = numOrNull(slice.tokensFreed)
    return t("compress.done", {
      tokens: freed === null ? "?" : String(freed),
      seconds: ((numOrNull(slice.elapsedMs) ?? 0) / 1000).toFixed(1),
    })
  }
  if (slice?.status === "fallback") {
    const tails = numOrNull(slice.tailMessages)
    return t("compress.fallback", { n: tails === null ? "?" : String(tails) })
  }
  return t("compress.failed", { error: typeof slice?.error === "string" ? slice.error : "" })
}

/** class 面（VSC 同名类：done ⇒ `compress-done`；fallback ∕ failed ⇒ `compress-failed`——VSC `:37` 同式）。 */
export function compressClass(slice) {
  if (slice?.status === "done") return "compress-status compress-done"
  if (slice?.status === "fallback" || slice?.status === "failed") return "compress-status compress-failed"
  return "compress-status"
}

/** 单元素构树（根锚 `data-compress` —— 非块节点：零 `data-block-id` ⇒ 不占块序 / 不动 `data-blocks` 不变式）。 */
export function compressNode(slice) {
  return { tag: "div", props: { class: compressClass(slice), "data-compress": "" }, children: [compressText(slice)] }
}

/** 帧尾态刷（幂等）：在场 ⟺ 切片在场（非载体 ⇒ 摘）；文本 ∕ class 等价 ⇒ 零写；换代 ⇒ 原位换；缺席 ⇒ 建（插点 = `anchor`）。 */
export function syncCompress(root, slice, anchor = null) {
  if (!root || typeof root.querySelector !== "function") return
  const node = root.querySelector("[data-compress]")
  const live = slice !== null && slice !== undefined
  if (!live) { if (node) node.remove(); return }
  const wantText = compressText(slice)
  const wantClass = compressClass(slice)
  if (node && node.textContent === wantText && node.getAttribute?.("class") === wantClass) return
  const fresh = build(compressNode(slice))
  if (node) { node.replaceWith(fresh); return }
  if (typeof root.insertBefore === "function") root.insertBefore(fresh, anchor)
  else root.append(fresh)
}

/** 插点锚（**族首** —— 压缩行恒居到期触发行组 / 停止痕 / 台账行 / 帮助行族 / 卡节点 / 药丸之前；消化行族不锚 —— 流内落位批收正：
 *  族元素逐轮就地、行创建点 = 流末）。单源 = 本档；**块不在本锚面**（新块随流居本行下 —— 见档头；`blockAnchor` 链不收本行）。 */
export function compressAnchorOf(root) {
  if (typeof root?.querySelector !== "function") return null
  return root.querySelector("[data-timer]") ?? root.querySelector("[data-stopped]") ?? root.querySelector("[data-ledger]")
    ?? root.querySelector("[data-help]") ?? root.querySelector("[data-card]") ?? root.querySelector("[data-pill]")
}
