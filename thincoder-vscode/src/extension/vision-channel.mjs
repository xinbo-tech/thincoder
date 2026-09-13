/**
 * vision-channel.mjs — IMAGE-DOWNGRADE-VISION F-1 视觉渠道查找（评审 #2 拆分——config-io 撞
 * 500 行硬限：helper 独立新文件——config-io 零接线（无既有 hub 消费面——本文件被
 * image-handler 跑者直引）。纯 Node——零 vscode/IO 依赖——单测可直跑。
 * 判据与 appendImagePointer / read_image 注册门同源：MODEL_SPECS multimodal
 * （specForModel——../specs.mjs）。MODEL-SELECTION（2026-09-10）：候选清单字段退场——
 * 判据 = 渠道默认单值模型的 spec（`specForModel(p.model).multimodal`）；能力收窄已入档
 * （默认模型非视觉的渠道不再被选中——把常用视觉模型设为该渠道默认模型即恢复）。
 */
import { specForModel } from "../specs.mjs"

/** 找可跑视觉读图的渠道：{ provider, model } | null——优先同名（当前主）渠道的视觉默认模型，
 *  else 全渠道首个视觉默认模型者（"优先同名渠道视觉模型 → 首视觉渠道"）。 */
export function findVisionChannel(providers, currentName = "") {
  const first = []
  for (const p of providers ?? []) {
    const model = typeof p?.model === "string" && p.model && specForModel(p.model).multimodal ? p.model : ""
    if (!model) continue
    if (p.name === currentName) return { provider: p.name, model }
    first.push({ provider: p.name, model })
  }
  return first[0] ?? null
}
