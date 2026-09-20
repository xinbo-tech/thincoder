/**
 * image-handler.mjs — pasted-image handling: save dataURLs to temp files +
 * IMAGE-DOWNGRADE-VISION F-1 降级读图跑者（routeUserTurn 贴图降级链的 runner——评审 #6
 * seam：visionReader 参数注入 mock、本实现为 ?? 默认——panel-messages 预算内只留触发）。
 *
 * Plan B (GitHub thincoder#3, 2026-08-29): the webview sends dataURLs with
 * `userMessage`; the EXTENSION saves each to <cwd>/.thincoder/tmp/paste-*.<ext>
 * and passes the absolute paths as runOpts.images. setupAgentRun appends an
 * "[Attached images: ...]" pointer to the user message text; the model then
 * calls the read_image tool, whose multimodal path (execute-tools.mjs) injects
 * the image part into the payload. Pasted images no longer ride inline in the
 * request — they flow through the same reliable tool path as read_image.
 *
 * Cleanup: files land in .thincoder/tmp/, which offloadToolResult
 * (src/agent/run-helpers.mjs) sweeps by mtime (TMP_RETENTION_MS) on every
 * offload write — paste-* files are covered by that sweep, no name filter.
 */

import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { resolveProviders } from "@thincoder/core/config-io.mjs"
import { providerFromConfig } from "./presets.mjs"
import { findVisionChannel } from "./vision-channel.mjs"
import { runAgent } from "../agent.mjs"

/** dataURL → { ext, buffer } | null. Raster mime types only; oversized (>15 MB, aligned with
 *  read_image's MAX_IMAGE_BYTES) returns null so a giant paste is skipped at save time
 *  instead of failing later inside the read_image tool call. */
function parseDataUrl(dataUrl) {
  const m = typeof dataUrl === "string" ? dataUrl.match(/^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/) : null
  if (!m) return null
  const ext = m[1] === "jpeg" ? "jpg" : m[1]
  const buffer = Buffer.from(m[2], "base64")
  if (buffer.length === 0) return null // empty payload — nothing to write
  if (buffer.length > 15 * 1024 * 1024) return null // oversized — read_image would reject it anyway
  return { ext, buffer }
}

/**
 * Save pasted data-URL images to <cwd>/.thincoder/tmp/paste-<id>-<i>.<ext>.
 * Invalid entries (non-dataURL, empty payload) are skipped; write failures are
 * skipped; returns the absolute paths that actually landed on disk ([] when none).
 */
export function savePastedImages(dataUrls, cwd) {
  if (!Array.isArray(dataUrls) || dataUrls.length === 0) return []
  const parsed = dataUrls.map(parseDataUrl).filter(Boolean)
  if (parsed.length === 0) return [] // all-invalid input — no directory, no files
  const tmpDir = join(cwd, ".thincoder", "tmp")
  try { mkdirSync(tmpDir, { recursive: true }) } catch { return [] }
  const paths = []
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6) // run id — offloadToolResult naming parity
  for (let i = 0; i < parsed.length; i++) {
    const fpath = join(tmpDir, `paste-${id}-${i}.${parsed[i].ext}`)
    try { writeFileSync(fpath, parsed[i].buffer) } catch { continue }
    paths.push(fpath)
  }
  return paths
}

// ─── F-1 降级读图跑者（IMAGE-DOWNGRADE-VISION——2026-09-09——评审 #6 seam 的 ?? 默认实现）───
// 非视觉主模型贴图 → 视觉渠道一次性子代理（runAgent 换渠道——depth-1 read-only explore——
// 复用现有 read_image 注册门：渠道模型 multimodal 才有该工具）读图返回文本描述。
// 返回 null = 不降级（无视觉渠道 / 渠道无 key / spawn 失败 / 超时 / 空返回）——调用方回落
// 现路径（图片保留下发——主回合 setup appendImagePointer 报现错——可读不静默丢）。
export const VISION_READ_TIMEOUT_MS = 60_000
export async function runVisionReader({ paths, providerName, cwd, signal, engState }) {
  // A12（群 A 批）：宿主取消缝——窗内 Stop（⏹）经外部 signal 传入；已停 → 快速失败
  // （不复用 60s 超时路径）；否则桥接内部 controller（下面 ac）。缺省（不传）= 现状。
  if (signal?.aborted) return null
  let providers = []
  try { providers = resolveProviders().providers } catch { return null }
  const vc = findVisionChannel(providers, providerName)
  if (!vc) return null
  let p = null
  try { p = providerFromConfig(vc.provider) } catch { return null }
  if (!p) return null // 渠道无 key——spawn 前置即失败
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), VISION_READ_TIMEOUT_MS)
  // A12（群 A 批）取消桥接：外部 signal abort → 内部 controller abort（既有 catch → null
  // 返回形态复用——零新形态）；缺省 = 现状（向后兼容）。
  if (signal) signal.addEventListener("abort", () => ac.abort(), { once: true })
  try {
    const task = paths.map((f) => `用 read_image 读 ${f} 返回图像内容描述`).join("\n")
    // ENG-PLAN-EXCLUSION（FR31 · 端差面②/KD9）：携 `engState`（工程真值同源——调用点已由
    // `agentSettings` 槽权威面取位）⇒ 该旁路 depth-1 子代理装配与主面同口径（工程模式 plan
    // 不入表）；缺省（不传）= 现状（向后兼容——既有直调面零改）。
    const desc = await runAgent({ ...p, model: vc.model }, cwd, task, {}, ac.signal, true, { depth: 1, role: "explore", maxTurns: 10, ...(engState ? { engState } : {}) })
    return typeof desc === "string" && desc.trim() ? { ok: true, description: desc.trim() } : null
  } catch { return null } finally { clearTimeout(timer) }
}
