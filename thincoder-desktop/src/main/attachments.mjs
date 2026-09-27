/**
 * attachments.mjs — 回合附件主进程半（批 B ⑧ · 单源 = `docs/desktop/design/IPC.md` §2「附件注」项 1–6）：
 *  ① 受理（项 1）：`images` = 逐项 `{ name, mime, dataURL }`；缺省 / 非数组 / 空数组 ⇒ **无附件径**
 *     （零落盘零注入，文本原样）。
 *  ② 落盘（项 2）：`<cwd>/.thincoder/tmp/paste-<ts>-<i>.<ext>` ⇒ 返**绝对路径数组**交核；落盘面全 IO 逐项
 *     就地投降（先例同形 = `thincoder-vscode/src/extension/image-handler.mjs:34-63`）。
 *  ③ 交核（项 2）：`appendImagePointer`（`thincoder-core/agent/setup-reminders.mjs:248`）尾附
 *     `[Attached images: …]` 指引，模型经 `read_image` 看图；核侧非多模态**抛错**（:251）——故项 4 的门
 *     在交核**之前**定局 ⇒ 本档出口零核错抛出。
 *  ④ 阈与弃（项 3）：单项 > 15MB 弃 · 合计超 30MB 的「超出部分」弃 · 落盘失败弃 —— **皆不阻断发送**；
 *     弃项经回执 `degraded:"partial"` 浮出（零静默）。
 *  ⑤ 非视觉降级（项 4）：`specForModel(model).multimodal` 假 ⇒ **不落盘不注入**，用户消息文本尾追加一行
 *     说明（词键面 = **渲染面词表** `renderer/i18n.mjs` —— 与输入区提示行同词，主进程侧零第二词表）。
 *  ⑥ 清理（项 6）：宿主回合尾结算点调 `cleanupTurn(paths)` 清**本回合**落盘件；失败 `console.error`。
 *
 * 纪律：零 electron / 零模块态（诊断 = `console.error` 一处）；`cwd` 由宿主注入（**非** `process.cwd()`，
 * 与装配取值面同源）；本档出口零抛（附件面不许把回合驱动带崩）。
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { appendImagePointer } from "@thincoder/core/agent/setup-reminders.mjs"
import { normalizeLocale } from "@thincoder/core/i18n.mjs"
import { specForModel } from "@thincoder/core/model-specs.mjs"
// 词面单源：渲染面词表（词键面 = 渲染面词表 —— 与输入区提示行同词；零第二词表）。
import { FALLBACK_LOCALE, HOST_DICT } from "../../renderer/i18n.mjs"

/** 单项上限 15MB（核 `read_image` 内闸同值同单位 —— `thincoder-core/tools/file.mjs:26` `MAX_IMAGE_BYTES =
 *  15_000_000`：超阈件交核也读不进 ⇒ 本档接纳面不得宽于该闸）。 */
export const IMAGE_MAX_BYTES = 15_000_000
/** 合计上限 30MB（项 3 —— 超阈部分弃、其余照发；与单项阈同单位）。 */
export const TURN_MAX_BYTES = 30_000_000
/** 非视觉说明词键（渲染面词表同名键 —— 回执码 `non-vision` 那一行的词）。 */
export const NON_VISION_KEY = "composer.attach.nonvision"

/** dataURL ⇒ `{ ext, buffer }` ∥ `null`：栅格四型（png / jpeg / gif / webp）；表外媒体类型 / 空载荷 /
 *  超单项阈 ⇒ null。ext 面取 **dataURL 媒体类型**（= 实际字节的声明 —— 先例同源；载荷 `mime` 字段与它
 *  同源，读它 = 造第二判据）。 */
function parseDataUrl(value) {
  const hit = typeof value === "string" ? value.match(/^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/) : null
  if (!hit) return null
  const buffer = Buffer.from(hit[2], "base64")
  if (buffer.length === 0 || buffer.length > IMAGE_MAX_BYTES) return null
  return { ext: hit[1] === "jpeg" ? "jpg" : hit[1], buffer }
}

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

/** 逐项判决 + 落盘 ⇒ `{ paths, dropped }`（`dropped` = 受理过但未落盘者 · 零静默判据）。
 *  预算式合计面（项 3「超出部分弃」）= `running + size ≤ 30MB` 才收，**溢出项弃后继续扫**（「其余照发」
 *  逐字）；目录**懒建**（零落盘项 ⇒ 零目录 —— 先例「all-invalid ⇒ no directory」）；建面 / 写面失败 ⇒
 *  该项弃 + 一次诊断（不阻断发送）。 */
function writeImages(list, cwd) {
  if (typeof cwd !== "string" || cwd === "") {
    console.error(`[attachments] no project cwd — ${list.length} pasted image(s) dropped`)
    return { paths: [], dropped: list.length }
  }
  const tmpDir = join(cwd, ".thincoder", "tmp")
  const runId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6) // 命名先例 = image-handler.mjs:56
  const paths = []
  let dropped = 0
  let budget = TURN_MAX_BYTES
  let dir = null // `null` = 未试 · `false` = 建失败（一次诊断后逐项弃）· string = 可用目录
  const ensureDir = () => {
    if (dir === null) {
      try { mkdirSync(tmpDir, { recursive: true }); dir = tmpDir }
      catch (error) { dir = false; console.error(`[attachments] tmp dir unavailable: ${tmpDir}`, error) }
    }
    return dir !== false
  }
  for (let i = 0; i < list.length; i += 1) {
    const parsed = parseDataUrl(list[i]?.dataURL)
    if (parsed === null || parsed.buffer.length > budget) { dropped += 1; continue } // 表外 / 超阈 ⇒ 弃，继续扫
    if (!ensureDir()) { dropped += 1; continue }
    const file = join(tmpDir, `paste-${runId}-${i}.${parsed.ext}`)
    try {
      writeFileSync(file, parsed.buffer)
      paths.push(file)
      budget -= parsed.buffer.length
    } catch (error) {
      dropped += 1
      console.error(`[attachments] image write failed: ${file}`, error)
    }
  }
  return { paths, dropped }
}

/**
 * 回合装配（宿主 `msg:send` 起跑前调 —— **出口零抛**）⇒ `{ text, paths, degraded }`：
 *  `text` = 交核的文本（可能带尾附指引 / 非视觉说明）· `paths` = 本回合落盘件（交宿主供回合尾清理）·
 *  `degraded` = `null`（全收 / 无附件）∥ `"non-vision"`（项 4）∥ `"partial"`（项 3 —— **含全弃**）。
 *  判决序：无附件（项 1）→ 非视觉（项 4，**先于**阈判定：不落盘 ⇒ 无弃项概念）→ 受理与阈（项 2/3）。
 */
export function prepareTurnAttachments(text, images, { cwd, model, locale } = {}) {
  const body = typeof text === "string" ? text : ""
  const list = Array.isArray(images) ? images : []
  if (list.length === 0) return { text: body, paths: [], degraded: null }
  if (specForModel(model).multimodal !== true) {
    return { text: appendLine(body, noticeText(locale)), paths: [], degraded: "non-vision" }
  }
  const { paths, dropped } = writeImages(list, cwd)
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
