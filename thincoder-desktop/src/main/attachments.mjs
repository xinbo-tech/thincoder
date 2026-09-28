/**
 * attachments.mjs — 回合附件主进程半（批 B ⑧ · 单源 = `docs/desktop/design/IPC.md` §2「附件注」项 1–6；
 * R5 上提舱 —— 解析 ∕ 落盘管线 ∕ 配额 ∕ 非多模态判据改核件消费，本档只留端侧三面）：
 *  ① 受理（项 1）：`images` = 逐项 `{ name, mime, dataURL }`；缺省 / 非数组 / 空数组 ⇒ **无附件径**
 *     （零落盘零注入，文本原样）。
 *  ② 落盘（项 2）：核 `savePastedImages`（`@thincoder/core/attachments.mjs`）—— 临时件
 *     `<cwd>/.thincoder/tmp/paste-<ts>-<i>.<ext>` 落盘 ⇒ 返**绝对路径数组**交核；fs 写面由本档注入
 *     （`node:fs` 同名面）。判据面（栅格四型 ∕ 15MB ∕ 条 ∕ 30MB ∕ 轮 ∕ 弃项）全在核件——本档零副本。
 *  ③ 交核（项 2）：`appendImagePointer`（核 `agent/setup-reminders.mjs:248`）尾附 `[Attached images: …]`
 *     指引，模型经 `read_image` 看图；核侧非多模态**抛错**（:251）—— 故项 4 的门在交核**之前**定局
 *     ⇒ 本档出口零核错抛出。
 *  ④ 阈与弃（项 3）：单件超阈 / 合计超阈溢出 / 落盘失败弃 —— **皆不阻断发送**（核件判据）；
 *     弃项经回执 `degraded:"partial"` 浮出（零静默）。
 *  ⑤ 非视觉门（项 4 · **档位处置留端**）：核 `isNonVisionModel(model)` 判真 ⇒ **不落盘不注入**，
 *     用户消息文本尾追加一行说明（词键面 = **渲染面词表** `renderer/i18n.mjs` —— 与输入区提示行同词，
 *     主进程侧零第二词表；VSC 对位面 = 视觉渠道子代理读图降级 —— 核件已承其判据与跑者，本端处置面本轮零改）。
 *  ⑥ 清理（项 6）：宿主回合尾结算点调 `cleanupTurn(paths)` 清**本回合**落盘件；失败 `console.error`。
 *
 * 纪律：零 electron / 零模块态（诊断 = `console.error` 一处）；`cwd` 由宿主注入（**非** `process.cwd()`，
 * 与装配取值面同源）；本档出口零抛（附件面不许把回合驱动带崩）。
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { isNonVisionModel, savePastedImages } from "@thincoder/core/attachments.mjs"
import { appendImagePointer } from "@thincoder/core/agent/setup-reminders.mjs"
import { normalizeLocale } from "@thincoder/core/i18n.mjs"
// 词面单源：渲染面词表（词键面 = 渲染面词表 —— 与输入区提示行同词；零第二词表）。
import { FALLBACK_LOCALE, HOST_DICT } from "../../renderer/i18n.mjs"

/** 非视觉说明词键（渲染面词表同名键 —— 回执码 `non-vision` 那一行的词）。 */
export const NON_VISION_KEY = "composer.attach.nonvision"

/** fs 写面注入（核 `savePastedImages` 缝 —— `node:fs` 同名面；本档唯一 fs 写接线点）。 */
const FS_SEAM = { mkdirSync, writeFileSync }

/** 词面读数（项 4）：语言经**核归一**（`zh-CN` ⇒ `zh`；缺 / 空 / 未知 ⇒ 缺省）—— 与 `config:read` 出口
 *  同源；解析序 = 当前语言 → 缺省语言 → 键名自身（与渲染面 `t()` 同终态：缺键可见，不静默变空串）。 */
function noticeText(locale) {
  const table = HOST_DICT[normalizeLocale(locale)] ?? HOST_DICT[FALLBACK_LOCALE] ?? {}
  const hit = table[NON_VISION_KEY] ?? HOST_DICT[FALLBACK_LOCALE]?.[NON_VISION_KEY]
  return typeof hit === "string" ? hit : NON_VISION_KEY
}

/** 尾附一行（正文空 ⇒ 说明独占 —— 先例同形 = VSC `image-handler.mjs:126`）。 */
function appendLine(text, line) {
  return text.trim() ? `${text}\n\n${line}` : line
}

/**
 * 回合装配（宿主 `msg:send` 起跑前调 —— **出口零抛**）⇒ `{ text, paths, degraded }`：
 *  `text` = 交核的文本（可能带尾附指引 / 非视觉说明）· `paths` = 本回合落盘件（交宿主供回合尾清理）·
 *  `degraded` = `null`（全收 / 无附件）∥ `"non-vision"`（项 4）∥ `"partial"`（项 3 —— **含全弃**）。
 *  判决序：无附件（项 1）→ 非视觉（项 4，**先于**阈判定：不落盘 ⇒ 无弃项概念）→ 受理与阈（项 2/3，核件）。
 */
export function prepareTurnAttachments(text, images, { cwd, model, locale } = {}) {
  const body = typeof text === "string" ? text : ""
  const list = Array.isArray(images) ? images : []
  if (list.length === 0) return { text: body, paths: [], degraded: null }
  if (isNonVisionModel(model)) {
    return { text: appendLine(body, noticeText(locale)), paths: [], degraded: "non-vision" }
  }
  const { paths, dropped } = savePastedImages(list.map((item) => item?.dataURL), cwd, { fs: FS_SEAM })
  const msg = { role: "user", content: body }
  if (paths.length > 0) appendImagePointer(msg, paths, model, { depth: 0 }) // 判据与核同函数同输入 ⇒ 零分歧
  return { text: msg.content, paths, degraded: dropped > 0 ? "partial" : null }
}

/** 回合尾清理（项 6 —— 宿主三径结算点调）：逐件删**本回合**落盘件；`force` 吞「已不在」（目的已达），
 *  余失败 `console.error`（容忍 —— 不阻断结算）。不删目录（他回合件可能在内）。 */
export function cleanupTurn(paths) {
  if (!Array.isArray(paths)) return
  for (const file of paths) {
    try { rmSync(file, { force: true }) }
    catch (error) { console.error(`[attachments] temp cleanup failed: ${file}`, error) }
  }
}
