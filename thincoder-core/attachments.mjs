/**
 * attachments.mjs — 回合附件（粘贴图）族：dataURL 解析 ∕ 临时落盘管线 ∕ 非多模态降级
 * （上提核件 —— 处理流批 R5 · 2026-09-28）。
 *
 * 上提源（迁移前坐标）= VSC `thincoder-vscode/src/extension/image-handler.mjs`（`parseDataUrl` :34 ·
 * `savePastedImages` :49 · `downgradeNonVisionImages` :109）；预算语义（合计 30MB ∕ 轮 · 溢出项弃后
 * **继续扫**「其余照发」）与配额单位 = 桌面同档 `thincoder-desktop/src/main/attachments.mjs`
 * （15MB ∕ 条 —— 与核 `read_image` 内闸同值同单位：`tools/file.mjs:26` `MAX_IMAGE_BYTES = 15_000_000`，
 * 接纳面不得宽于该闸）。本档 = 单源（消费面 = 桌面 `src/main/attachments.mjs`；VSC 自持副本已随本批（parity-b4）迁移改指本档）。
 * 指引行（`[Attached images: …]`）不迁 —— 单源 = `agent/setup-reminders.mjs:248` `appendImagePointer`（原位）。
 *
 * 与 VSC 自持副本的在册差异（双写窗口）**收正已毕**（迁移轮 parity-b4 —— 逐条处置见批档 §2.3）：① 阈单位 ∕
 * ② 弃项索引 ∕ ③ 合计预算闸 ∕ ④ 降级成功判据 = **两端同源单值**（收正方向——VSC 侧本地字面 ∕ 过滤后下标 ∕ 无预算 ∕
 * 真值判四面随迁移删；VSC 消费本档 `IMAGE_MAX_BYTES` ∕ 源序命名 ∕ `TURN_MAX_BYTES` ∕ `out.ok !== true`）；
 * ⑤ 清理面 = **保留**（两向皆在册的端侧时序面）：本档不回收（半失败写入的孤儿件无回收面）——桌面 =
 * 逐回合显式清（`cleanupTurn`）· VSC = `offloadToolResult` mtime 扫除兜底（paste-* 在其扫除面内；
 * 其档头在册）。
 *
 * 两面 + 两缝：
 *  ① 落盘管线（`savePastedImages`）：逐项解析 ⇒ 预算判 ⇒ 写 `<cwd>/.thincoder/tmp/paste-<id>-<i>.<ext>`
 *     （懒建目录；建面 ∕ 写面运行时失败 ⇒ 该项弃 + 一次诊断 —— 皆不阻断发送）。**fs 写转注入缝**
 *     （`fs = { mkdirSync, writeFileSync }` —— `node:fs` 同名面；本档零 `node:fs`）。
 *  ② 非多模态降级（`downgradeNonVisionImages`）：判据 = 图非空 ∧ 模型在场 ∧ 非多模态
 *     （`isNonVisionModel`）⇒ 读图；成功 ⇒ 描述注文（`[图片 … 描述: …]`）+ 图清空；
 *     失败 ⇒ 原样兜底（不静默丢）。**视觉子代理 spawn 转注入缝**（`visionReader({ paths, signal })` ——
 *     缺省实现 = 核 `vision-reader.mjs` `runVisionReader`（桌面径直取）；VSC 经宿主包装注入）。
 */
import { join } from "node:path"
import { specForModel } from "./model-specs.mjs"

/** 单项上限 15MB（与 `read_image` 内闸同值同单位 —— `tools/file.mjs:26` `MAX_IMAGE_BYTES = 15_000_000`：
 *  超阈件交核也读不进 ⇒ 接纳面不得宽于该闸）。 */
export const IMAGE_MAX_BYTES = 15_000_000

/** 合计上限 30MB ∕ 轮（超阈的**溢出部分**弃、其余照发 —— 与单项阈同单位）。 */
export const TURN_MAX_BYTES = 30_000_000

/** 栅格四型（捕获组 = `ext` 源 —— dataURL 媒体类型即实际字节的声明；表外类型恒不成附件）。 */
const DATA_URL_RE = /^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/

/** dataURL ⇒ `{ ext, buffer }` ∥ `null`：栅格四型；表外媒体类型 ∕ 空载荷 ∕ 超单项阈 ⇒ `null`
 *  （巨图在落盘时刻即弃 —— 不留给 `read_image` 调用时报错）。 */
export function parseDataUrl(value) {
  const hit = typeof value === "string" ? value.match(DATA_URL_RE) : null
  if (!hit) return null
  const buffer = Buffer.from(hit[2], "base64")
  if (buffer.length === 0 || buffer.length > IMAGE_MAX_BYTES) return null
  return { ext: hit[1] === "jpeg" ? "jpg" : hit[1], buffer }
}

/** 非多模态判据（单源 = 规格表 `multimodal` 位）：显式 `true` 之外一切（未声明 ∕ 未知模型 ∕ 模型缺省）
 *  ⇒ `true`。降级判决与本档外「档位处置」（端侧各留其处置面）共用本判据。 */
export function isNonVisionModel(model) {
  return specForModel(model).multimodal !== true
}

/**
 * 落盘管线：dataURL 串列 ⇒ `{ paths, dropped }`（`dropped` = 未落盘者（解析拒 ∕ 超单项阈 ∕ 预算溢出 ∕ 写失败）——零静默判据）。
 * 逐项：解析（表外 ∕ 空载荷 ∕ 超条阈 ⇒ 弃）⇒ 合计预算（`running + size ≤ TURN_MAX_BYTES` 才收，
 * 溢出项弃后**继续扫**）⇒ 写 `<cwd>/.thincoder/tmp/paste-<id>-<i>.<ext>`（`index` = 源序；目录
 * **懒建** —— 零落盘项 ⇒ 零目录）。`fs` = 写面注入缝（`{ mkdirSync(p, {recursive}), writeFileSync(p, buf) }`
 * —— `node:fs` 同名面；缺 ∕ 形违 ⇒ 抛，fail-loud：写面未接线不得静默扮成「全部弃」）。
 * 出口零抛（缝缺除外）：无 cwd ∕ 建面 ∕ 写面失败 ⇒ 相应项弃 + 一次诊断（附件面不把回合驱动带崩）。
 */
export function savePastedImages(dataUrls, cwd, { fs } = {}) {
  const list = Array.isArray(dataUrls) ? dataUrls : []
  if (list.length === 0) return { paths: [], dropped: 0 } // 空表先于缝校验早退（零判据面 —— 缝不检）
  if (typeof fs?.mkdirSync !== "function" || typeof fs?.writeFileSync !== "function") {
    throw new TypeError("savePastedImages: fs seam missing — inject { mkdirSync, writeFileSync } (the write face must not silently drop every image)")
  }
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
      try { fs.mkdirSync(tmpDir, { recursive: true }); dir = tmpDir }
      catch (error) { dir = false; console.error(`[attachments] tmp dir unavailable: ${tmpDir}`, error) }
    }
    return dir !== false
  }
  for (let i = 0; i < list.length; i += 1) {
    const parsed = parseDataUrl(list[i])
    if (parsed === null || parsed.buffer.length > budget) { dropped += 1; continue } // 表外 ∕ 超阈 ⇒ 弃，继续扫
    if (!ensureDir()) { dropped += 1; continue }
    const file = join(tmpDir, `paste-${runId}-${i}.${parsed.ext}`)
    try {
      fs.writeFileSync(file, parsed.buffer)
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
 * 非多模态降级（判据 + 结果成形；读图 = 注入缝）：判据 = `images` 非空 ∧ `model` 在场 ∧
 * `isNonVisionModel(model)`。`visionReader({ paths, signal })` ⇒ `{ ok, description }`（缺省实现 = 核
 * `vision-reader.mjs` `runVisionReader`；注入实现闭包自身上下文）；成功 ⇒ 描述注文（`[图片 <路径表> 描述: <描述>]`，正文空 ⇒ 描述独占）+ `images`
 * 清空；无返回 ∕ `ok` 非真 ∕ 空描述 ∕ 异常 ⇒ 原样兜底（`{ text, images }` 不动 —— 不静默丢）。
 * `visionReader` 缺 ∕ 形违 ⇒ 抛（fail-loud：降级路径未接线不得静默扮成「原样兜底」）；判据未过
 * ⇒ 早退（缝不检、零调用）。返回 `{ text, images, downgraded }`（成功径 `images` = `undefined`）。
 */
export async function downgradeNonVisionImages({ text, images, model, visionReader, signal } = {}) {
  const keep = { text, images, downgraded: false }
  if (!Array.isArray(images) || images.length === 0) return keep // 无图 ⇒ no-op（VSC :110 同判）
  if (!model || !isNonVisionModel(model)) return keep // 多模态主模型 ∕ 模型缺省 ⇒ 不降级
  if (typeof visionReader !== "function") {
    throw new TypeError("downgradeNonVisionImages: visionReader seam missing — inject the one-shot vision-subagent reader")
  }
  let out = null
  try { out = await visionReader({ paths: images, signal }) } catch { out = null }
  if (out?.ok !== true || typeof out.description !== "string" || out.description.trim() === "") return keep
  const marker = `[图片 ${images.join("、")} 描述: ${out.description.trim()}]`
  return { text: text?.trim() ? `${text}\n\n${marker}` : marker, images: undefined, downgraded: true }
}
