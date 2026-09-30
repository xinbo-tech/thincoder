/**
 * image-handler.mjs — 贴图落盘 ∕ 非视觉降级（**薄壳** —— parity-b4 W1）：本体核单源
 * `@thincoder/core/attachments.mjs`（落盘管线 + 降级判决）∕ `@thincoder/core/vision-reader.mjs`（跑者）。
 * 本档只承端侧壳三件：
 *  ① 落盘 fs 注入缝（`node:fs` `{ mkdirSync, writeFileSync }` —— 核缝 fail-loud）+ 写时扫除（核 `cleanupOldToolResults` 复用——见 `savePastedImages` 注）；
 *  ② 降级窗 busy-lock ∕ `visionAbort` 载体（A12——窗内 Stop 定向中止）与返形 `{ text, images, visionAbort }`；
 *  ③ 跑者父面：真父面（`panel._agent`）在场恒用；首回合窗（agent 未建）以核渠道表
 *     （`resolveProviders()` 单源）合成最小父面；记忆句柄 = 宿主单源（`ensureMemoryHandle()`，
 *     禁用 ∕ 建败 ⇒ null ⇒ 跑者原样兜底——不造假面）。
 * 消费面：`savePastedImages` = `panel-messages.mjs` 三处（取 `.paths`）；`downgradeNonVisionImages` =
 * `panel-messages.mjs`（idle 面）∕ `panel-turn-stages.mjs:191/:237`（返形逐行保旧 ⇒ 后两档零改）。
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { savePastedImages as coreSavePastedImages, downgradeNonVisionImages as coreDowngrade, isNonVisionModel } from "@thincoder/core/attachments.mjs"
import { cleanupOldToolResults } from "@thincoder/core/agent/helpers.mjs"
import { runVisionReader } from "@thincoder/core/vision-reader.mjs"
import { resolveProviders } from "@thincoder/core/config-io.mjs"
import { ensureMemoryHandle } from "../embed-config.mjs"

/** 落盘管线（核件 + 端 fs 探针 + 写时扫除）：dataURL 串列 ⇒ `{ paths, dropped }`（调用点消费 `.paths`）。
 *  写时扫除（#735 · 2026-09-30 批 · 机制单源 `PROVIDER.md` §6.18）：落盘前对 `<cwd>/.thincoder/tmp` 发核
 *  `cleanupOldToolResults`（3 天窗单源；fire-and-forget 免 await 窗，失败静默）——闸 = 非空表 ∧ 有效 cwd（同形对位 = 核 `attachments.mjs:71`，改动须同拍）。 */
export function savePastedImages(dataUrls, cwd) {
  if (Array.isArray(dataUrls) && dataUrls.length > 0 && typeof cwd === "string" && cwd !== "") {
    cleanupOldToolResults(join(cwd, ".thincoder", "tmp")).catch(() => { /* 扫除失败不得影响落盘 */ })
  }
  return coreSavePastedImages(dataUrls, cwd, { fs: { mkdirSync, writeFileSync } })
}

/** 核跑者缺省缝：父面（真 ∕ 合成）+ 宿主记忆句柄注入（父面 ∕ 句柄均于调用时活读）。 */
function visionReaderFor(panel, { providerName, cwd }) {
  return async ({ paths, signal }) => {
    const memory = await ensureMemoryHandle()
    const base = panel._agent ?? { config: { providersList: resolveProviders().providers } }
    return runVisionReader({ paths, signal, providerName, cwd, parentAgent: { ...base, memory } })
  }
}

/** 非视觉降级判决（核件 + VSC 窗壳）：判据 ∕ 注文 ∕ 原样兜底全取核；本档保置位序（`_turnState !== "susp"`
 *  ⇒ running）与 `visionAbort` 载体（A12）。`visionReader` = 注入缝（缺省回落生产跑者）。 */
export async function downgradeNonVisionImages(panel, { text, images, providerName, modelOverride, cwd, visionReader = null }) {
  if (!images?.length || !modelOverride || !isNonVisionModel(modelOverride)) return { text, images, visionAbort: null }
  if (panel._turnState !== "susp") panel._publishTurnState?.("running")
  const visionAbort = new AbortController()
  panel._visionAbort = visionAbort
  try {
    const d = await coreDowngrade({
      text, images, model: modelOverride, signal: visionAbort.signal,
      visionReader: visionReader ?? visionReaderFor(panel, { providerName, cwd }),
    })
    return { text: d.text, images: d.images, visionAbort }
  } catch {
    return { text, images, visionAbort } // 缝抛 ∕ 父面构造失败 —— 原样兜底（不静默丢）
  } finally {
    if (panel._visionAbort === visionAbort) panel._visionAbort = null
  }
}
