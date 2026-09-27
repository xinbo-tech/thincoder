/**
 * attach.mjs — 输入区附件面（批 B ⑧ · 形态单源 = `docs/desktop/design/UI.md` §1 输入区行「批 B 注」项 2 ·
 *   载荷 / 上限 / 降级面 = `docs/desktop/design/IPC.md` §2「附件注」）：
 *   ① 采集 = `paste` 取剪贴板图像项（`kind === "file"` ∧ `type` 前缀 `image/`）；非图内容**零动作且不吞事件**
 *      ⇒ 文本照粘贴。`FileReader` 转 `dataURL` —— 本档**唯一 IO 点**（零落盘：图面数据随 `msg:send` 入主进程）；
 *   ② 构树 = 输入区上方附件条（根锚 `data-attachments` · 住 `[data-slot="composer"]` 内）：逐项 = 缩略图
 *      （`img[src=dataURL]`）+ 文件名（**有给才落** —— 无名粘贴不造串）+ 移除控件（`data-action="attach:remove"`
 *      携 `data-attachment-id` · 可及名 = 词键）；**空 ⇒ `null`**（零节点 —— 禁假造空位）；
 *   ③ 出口 = `toImages` 恰形投影 `{ name, mime, dataURL }` 逐项（`id` = 端侧锚位，**不出面**）；
 *   ④ 降级提示行 = 回执 `degraded` 闭集两值（`non-vision` / `partial`）；表外码 ⇒ `null`（不猜、不造串）。
 * 上限与弃项判据（单 15MB / 合计 30MB）归**主进程**——渲染面零预筛：采集照收、回执照示。
 * 纪律：零 `node:` / 零裸包（渲染面静态闭包判据）；面向用户文案全经 `t()`；本档零 DOM（构树只产描述符）。
 */
import { t } from "./i18n.mjs"
import { wire, withKey } from "./views/chat-tool.mjs"

/** 降级码闭集（回执 `degraded` 两值 —— 单源 = `docs/desktop/design/IPC.md` §2「附件注」项 3 / 项 4）。 */
export const DEGRADED_WORD = Object.freeze({
  "non-vision": "composer.attach.nonvision",
  partial: "composer.attach.partial",
})

const hasText = (value) => typeof value === "string" && value.length > 0

/** 降级码受理判据（闭集 ∧ 有词 ⇒ 原码 ∥ 余 ⇒ `null` —— 记录面与提示行同源一处）。 */
export function degradedCode(value) {
  return typeof DEGRADED_WORD[value] === "string" ? value : null
}

/** 剪贴板单项判据（文件项 ∧ `image/` 前缀 ⇒ `{ file, name, mime }` ∥ 余 ⇒ `null`）。 */
function imageItem(item) {
  if (item?.kind !== "file" || typeof item.getAsFile !== "function") return null
  const file = item.getAsFile()
  if (file === null || file === undefined) return null
  const mime = typeof file.type === "string" ? file.type : ""
  if (!mime.startsWith("image/")) return null
  return { file, name: typeof file.name === "string" ? file.name : "", mime }
}

/** 采集面（纯函数 · 零 IO）：`paste` 事件的剪贴板图像项 ⇒ 逐项 `{ file, name, mime }`（序同剪贴板）。 */
export function pasteImages(event) {
  const items = event?.clipboardData?.items
  if (items === null || items === undefined || typeof items.length !== "number") return []
  const out = []
  for (let index = 0; index < items.length; index += 1) {
    const picked = imageItem(items[index])
    if (picked !== null) out.push(picked)
  }
  return out
}

/** 文件读面（`File` ⇒ `dataURL`）：环境缺 `FileReader` ⇒ **拒绝**（采集面响亮弃项，零静默）。 */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader !== "function") {
      reject(new Error("FileReader unavailable"))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "")
    reader.onerror = () => reject(reader.error ?? new Error("read failed"))
    reader.readAsDataURL(file)
  })
}

/** 采集出口（素逻辑薄壳 · 无注入面 —— 平 node 直测以环境桩代 `FileReader`）：逐项读，**读失败 ∥ 空读 ⇒ 弃该项
 *  + 一行诊断**（零静默丢图；配对项 = 读毕才入列 ⇒ 并发粘贴不互覆盖；无图像项 ⇒ 零动作；**采集面自身
 *  抛错 ⇒ 零图 + 一行诊断** —— 本函数零拒绝面）。 */
export async function collectImages(event) {
  const out = []
  let picked = []
  try {
    picked = pasteImages(event)
  } catch (error) {
    console.error("[attach] paste: clipboard read failed:", error)
    return out
  }
  for (const { file, name, mime } of picked) {
    try {
      const dataURL = await fileToDataURL(file)
      if (hasText(dataURL)) out.push({ name, mime, dataURL })
      else console.error(`[attach] paste: empty read for ${mime}`)
    } catch (error) {
      console.error("[attach] paste: image read failed:", error)
    }
  }
  return out
}

/** 载荷投影（恰形 · 通道见 `docs/desktop/design/IPC.md` §2）：条目 ⇒ `{ name, mime, dataURL }` 逐项（`id` 不出面）。 */
export function toImages(attachments) {
  const list = Array.isArray(attachments) ? attachments : []
  return list
    .filter((entry) => hasText(entry?.dataURL))
    .map((entry) => ({
      name: typeof entry.name === "string" ? entry.name : "",
      mime: typeof entry.mime === "string" ? entry.mime : "",
      dataURL: entry.dataURL,
    }))
}

/** 单条目（描述符）：缩略图（有给才落）+ 文件名（有给才落）+ 移除控件（`wire` 两态 —— 零隐藏，锚恒在）。 */
function itemNode(entry, handlers) {
  const id = entry?.id ?? ""
  const children = []
  if (hasText(entry?.dataURL)) {
    children.push({ tag: "img", props: { class: "composer-attach-thumb", src: entry.dataURL, alt: "" }, children: [] })
  }
  if (hasText(entry?.name)) {
    children.push({ tag: "span", props: { class: "composer-attach-name" }, children: [entry.name] })
  }
  children.push({
    tag: "button",
    props: wire(
      {
        class: "composer-attach-remove", "data-action": "attach:remove", "data-attachment-id": id,
        "aria-label": t("composer.attach.remove"),
      },
      withKey(handlers?.onRemoveAttachment, id),
    ),
    children: [],
  })
  return { tag: "div", props: { class: "composer-attach" }, children }
}

/** 附件条构树（描述符 · 零 DOM）：**空 ∥ 非数组 ⇒ `null`**（调用方按空位跳过 —— 零节点）。 */
export function attachmentBar(attachments, handlers = {}) {
  const list = Array.isArray(attachments) ? attachments : []
  if (list.length === 0) return null
  return {
    tag: "div",
    props: { class: "composer-attachments", "data-attachments": "" },
    children: list.map((entry) => itemNode(entry, handlers)),
  }
}

/** 降级提示行构树（闭集表外 ∥ 缺 ⇒ `null`）：锚 `data-notice="attach-degraded"` · 码字面住 `data-degraded`。 */
export function degradedNotice(code) {
  const word = DEGRADED_WORD[code]
  if (typeof word !== "string") return null
  return {
    tag: "div",
    props: { class: "composer-notice", "data-notice": "attach-degraded", "data-degraded": code },
    children: [t(word)],
  }
}
