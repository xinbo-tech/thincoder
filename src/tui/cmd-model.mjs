import { C } from "./ansi.mjs"
import { parseModelRef } from "../config.mjs"

/** /model command: open the session model picker, or switch the SESSION model directly via
 *  `/model <provider>:<model>` (MODEL-MERGE-SESSION——裁定③：裸 provider 拒——显式 p:m；
 *  候选硬约束：model 必须是该渠道 models[] 成员——候选外拒 F-1——selectModel 内复核）。
 *  /model 是会话级操作（写槽——不写 config）——config 默认模型走 /config → 默认模型。
 *  ctx: { agent, openModelPicker, selectModel, pushLine } */
export async function handleModelCommand(ctx, args = []) {
  const raw = args[0]?.trim()
  if (!raw) {
    ctx.openModelPicker().catch((e) => ctx.pushLine(`[error] ${e.message}`, C.error))
    return
  }
  // 严格双段复合解析（parseModelRef——裸 provider / 未知 provider / models[] 外 → ok:false）
  const parsed = parseModelRef(raw, ctx.agent.providers)
  if (!parsed.ok) {
    ctx.pushLine(`[error] ${parsed.reason}`, C.error)
    ctx.pushLine(`/model 用法: /model provider:model（会话级——config 默认走 /config → 默认模型）`, C.dim)
    return
  }
  await ctx.selectModel({ provider: parsed.provider.name, model: parsed.model }).catch((e) => ctx.pushLine(`[error] ${e.message}`, C.error))
}
