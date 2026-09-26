/**
 * info-row.mjs — 项目级信息行（左列底行 —— `docs/desktop/design/UI.md` §1 项目级信息行 · 批档 §2.13）：
 * 三读数（`counts.pool` / `counts.tech` / `counts.aged`）+ 超阈标（`thresholdReached`）+ 相位（`phase`）+
 * 右端设置入口（**锚名逐字** `settings:open`）。
 * **读数供给未落 ⇒ 零节点**（禁假造）：非数 / 缺片 ⇒ 该读数不进树；行整体态 = `ready`（有任一读数或相位）·
 * `error`（供给失败 —— 核错误串直传）· `none`（未扫描 —— 词表提示）。
 * 只读面：行内零写入口（台账 / 批档写面归 CLI——本行只呈现）；相位词表闭集、表外码原样直传。
 * 纪律：零 DOM（唯一构造点 = `dom.mjs` `build`）；文案一律经 `t()`；零裸包 / 零 `store.mjs` import。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"
import { reasonWord, syncHostProps } from "./settings.mjs"

/** 相位词表（`batch:status` 值域 = `initial-dev` / `production`；表外原样直传 —— 同失败面口径）。 */
export const PHASE_WORD = Object.freeze({
  "initial-dev": "info.phase.initialDev",
  production: "info.phase.production",
})

/** 读数族闭集（序固定 —— 行内节点序单源）。 */
const READS = Object.freeze(["pool", "tech", "aged"])

/** 非负整数读数：数为值、非数 ⇒ `null`（零节点 —— 禁假造）。 */
const countOf = (value) => (Number.isFinite(value) && value >= 0 ? value : null)

/** 相位词：表内出词、表外原样；缺 ⇒ `null`（零节点）。 */
function phaseWord(phase) {
  if (typeof phase !== "string" || !phase) return null
  const key = Object.hasOwn(PHASE_WORD, phase) ? PHASE_WORD[phase] : null
  return key === null ? phase : t(key)
}

/** 行模型（纯 · 零 DOM）：三读数 + 超阈标 + 相位 + 失败串 + 入口开合态（现态直读 —— 零推导）。 */
export function infoModel(state) {
  const info = state?.projectInfo ?? null
  const counts = info?.counts !== null && typeof info?.counts === "object" ? info.counts : null
  const readings = counts === null
    ? []
    : READS.map((name) => ({ name, value: countOf(counts[name]) })).filter((r) => r.value !== null)
  const phase = phaseWord(info?.phase)
  const notice = reasonWord(info?.notice)
  return {
    state: readings.length > 0 || phase !== null ? "ready" : notice !== null ? "error" : "none",
    readings,
    threshold: info?.thresholdReached === true,
    phase,
    notice,
    open: state?.settings?.open === true,
  }
}

/** 读数节点：标词 + 值（两片 —— 值 = 现态直读）。 */
function infoReadNode(reading) {
  return {
    tag: "span",
    props: { class: "info-read", "data-read": reading.name },
    children: [
      { tag: "span", props: { class: "info-read-label" }, children: [t(`info.read.${reading.name}`)] },
      { tag: "span", props: { class: "info-read-value" }, children: [String(reading.value)] },
    ],
  }
}

/** 超阈标（真 ⇒ 在场；假 / 非真 ⇒ 零节点 —— 禁假造）。 */
function infoThresholdNode() {
  return { tag: "span", props: { class: "info-threshold", "data-read": "threshold" }, children: [t("info.threshold")] }
}

/** 相位节点（词表闭集；表外码原样）。 */
function infoPhaseNode(phase) {
  return {
    tag: "span",
    props: { class: "info-phase", "data-read": "phase" },
    children: [
      { tag: "span", props: { class: "info-read-label" }, children: [t("info.phase")] },
      { tag: "span", props: { class: "info-read-value" }, children: [phase] },
    ],
  }
}

/** 设置入口（锚名逐字 `settings:open` —— 只开不关：关锚在面板内）。 */
function infoEntryNode(model, handlers) {
  const onClick = typeof handlers?.onOpenSettings === "function" ? handlers.onOpenSettings : undefined
  return {
    tag: "button",
    props: wire({
      class: "info-entry",
      type: "button",
      "data-action": "settings:open",
      "aria-expanded": model.open ? "true" : "false",
      "aria-label": t("settings.title"),
    }, onClick),
    children: [t("settings.title")],
  }
}

/** 失败面节点（核错误串直传 —— 表内码出词）；无串 ⇒ `null`（零节点）。 */
function noticeNode(model) {
  if (model.notice === null) return null
  return { tag: "span", props: { class: "info-notice", "data-notice": "" }, children: [model.notice] }
}

/** 行树（纯构树 · 零 DOM）：根 = 描述符（props 复制到宿主 —— `mountInfo`）。
 *  `ready` 分支同挂失败面（批档 §2.13：读数到手 ∧ 另一读失败 ⇒ 读数照旧、失败串并列 —— 零信息遮蔽）。 */
export function infoTree(model, handlers = {}) {
  const body = []
  if (model.state === "ready") {
    body.push(...model.readings.map(infoReadNode))
    if (model.threshold) body.push(infoThresholdNode())
    if (model.phase !== null) body.push(infoPhaseNode(model.phase))
    body.push(noticeNode(model))
  } else if (model.state === "error") {
    body.push(noticeNode(model))
  } else {
    body.push({ tag: "span", props: { class: "info-state", "data-state-word": "" }, children: [t("info.state.none")] })
  }
  return {
    tag: "div",
    props: { "data-info": "", "data-state": model.state, class: "info" },
    children: [{ tag: "span", props: { class: "info-title" }, children: [t("info.title")] },
      ...body, infoEntryNode(model, handlers)],
  }
}

/** 薄挂载：props 应收进宿主（`syncHostProps` —— `data-slot` 等骨架属性保留 + 前任所加属性摘除）+ `clear` + `append`；容器缺位 ⇒ 空转。 */
export function mountInfo(root, state, handlers = {}) {
  const model = infoModel(state)
  if (!root || typeof root.setAttribute !== "function") return model
  const tree = build(infoTree(model, handlers))
  syncHostProps(root, tree)
  clear(root)
  for (const child of [...tree.childNodes]) root.append(child)
  return model
}
