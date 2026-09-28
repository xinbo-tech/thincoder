/**
 * attach.mjs — 输入区附件面**残余档**（输入面板上提批 `2026-09-28-desktop-input-vsc-align.md` §2.4 Q3 ∕ P5）：
 * 采集 ∕ 栅格门 ∕ 芯片条三面随上提入核（`thincoder-render-core/composer/attach.mjs` —— 该档判据面与本档现物
 * 同源合流），本档只留**载荷与提示两投影**（另半 = 挂件锚，见 `renderer/mount-composer.mjs`）：
 *   ① 归档码闭集 `DEGRADED_WORD` + `degradedCode`——回执 `degraded` 两值（`non-vision` / `partial`）过闸；
 *      表外码 ⇒ `null`（不猜、不造串）；单源 = `docs/desktop/design/IPC.md` §2「附件注」项 3 / 项 4；
 *   ② `toImages`——**载荷投影**（D7 端既有形）：核件面板采集两段（粘贴 ∕ 文件选取）出 `dataURL` 串，
 *      本函数逐项包为 `{ name, mime, dataURL }`（主侧 `prepareTurnAttachments` 零改须此形）；
 *      `mime` = dataURL 媒体类型**同源直取**（非第二判据 —— 载荷 `mime` 字段与它同源，见主侧 `attachments.mjs:36-37`）；
 *      非 dataURL 项 ⇒ 弃项（零假造）；无名粘贴 ⇒ `name: ""`（不造串）；
 *   ③ `degradedNotice`——B22 附件降级提示行构树（保留行 —— 行形不动；载体 = 宿主挂件锚 `data-composer-notices`）。
 * 退场面（列明）：`RASTER_MIME` ∕ `pasteImages` ∕ `pasteRejects` ∕ `collectImages` ∕ `fileToDataURL` ∕
 * `attachmentBar` ∕ `itemNode` ∕ `unsupportedNotice` —— 采集 / 栅格门 / 芯片条归核件；非栅格拒（B9）改核件 toast。
 * 纪律：零 `node:` / 零裸包（渲染面静态闭包判据）；面向用户文案全经 `t()`；本档零 DOM（构树只产描述符）。
 */
import { t } from "./i18n.mjs"

/** 降级码闭集（回执 `degraded` 两值 —— 单源 = `docs/desktop/design/IPC.md` §2「附件注」项 3 / 项 4）。 */
export const DEGRADED_WORD = Object.freeze({
  "non-vision": "composer.attach.nonvision",
  partial: "composer.attach.partial",
})

/** dataURL 头（媒体类型捕获组 —— `mime` 投影源；字面沿主侧 `parseDataUrl` 同族四型）。 */
const DATA_URL = /^data:(image\/[a-z0-9.+-]+);base64,/i

const hasText = (value) => typeof value === "string" && value.length > 0

/** 降级码受理判据（闭集 ∧ 有词 ⇒ 原码 ∥ 余 ⇒ `null` —— 记录面与提示行同源一处）。 */
export function degradedCode(value) {
  return typeof DEGRADED_WORD[value] === "string" ? value : null
}

/** 载荷投影（恰形 · 通道见 `docs/desktop/design/IPC.md` §2）：核件图列（`dataURL` 串列）⇒
 *  `{ name, mime, dataURL }` 逐项（`mime` = 媒体类型直取；非 dataURL 项弃 —— 零假造、零改形）。 */
export function toImages(images) {
  const list = Array.isArray(images) ? images : []
  const out = []
  for (const value of list) {
    const hit = typeof value === "string" ? value.match(DATA_URL) : null
    if (hit === null) continue
    out.push({ name: "", mime: hit[1].toLowerCase(), dataURL: value })
  }
  return out
}

/** 降级提示行构树（B22 保留行 —— 闭集表外 ∥ 缺 ⇒ `null`）：锚 `data-notice="attach-degraded"` · 码字面住
 *  `data-degraded`；行形 ∕ 锚不动（载体 = 宿主挂件锚 `data-composer-notices`）。 */
export function degradedNotice(code) {
  const word = DEGRADED_WORD[code]
  if (typeof word !== "string") return null
  return {
    tag: "div",
    props: { class: "composer-notice", "data-notice": "attach-degraded", "data-degraded": code },
    children: [t(word)],
  }
}
