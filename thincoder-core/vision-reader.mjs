/**
 * vision-reader.mjs — 非多模态降级读图跑者（上提核件 —— parity-b4 W0 · 2026-09-29）。
 *
 * 上提源 = VSC `thincoder-vscode/src/extension/vision-channel.mjs:14`（`findVisionChannel` 逐字）
 * + `image-handler.mjs:70-95`（`runVisionReader` 逐字）；VSC 自持跑者 ∕ 渠道副本已随迁移轮（parity-b4）删。
 * 消费面 = VSC `image-handler.mjs`（已改指本档）· 桌面 `src/main/attachments.mjs`
 * （降级适配器缺省 = 本档 —— `visionReader` 缝的核默认实现）。
 *
 * `findVisionChannel`（纯函数）：渠道表 ⇒ 视觉读图渠道 —— 判定源随 2026-10-09 清除批退场（渠道不携
 * 模型——R3 零读写）；判定源重定在途（台账）；现行为恒 `null` ⇒ 消费方走既有「无视觉渠道」可读
 * 报错径（F-IDG-2——不静默丢图）。
 *
 * `runVisionReader`：一次性 depth-1 只读 explore 子代理读图返回文本描述。
 *  渠道 = 视觉渠道（`resolveProviders()` 现读；`findVisionChannel` 判源退场 ⇒ 现恒无渠道）；provider = 核 `resolveChildProvider`（`<渠道>:<模型>`）；
 *  工具 = 按**该渠道模型**装配的只读族（`read_image` 随 multimodal 注册 —— 主模型非视觉时其工具表
 *  本无该件，故按子代理模型重装，不沿用主代理工具表）；`config ∕ memory` = 主代理同源。
 *  失败径全 `null`（原样兜底，不静默丢）：无渠道 ∕ 渠道未知 ∕ 渠道无 key（spawn 期失败回落）∕
 *  spawn 失败 ∕ 超时 ∕ 空返；外部 `signal` 已停 ⇒ 快速失败，否则桥接内部控制器。
 *
 *  W8 契约②（2026-09-29 断链）：`agent.mjs` ∕ `agent-tools/subagent-async.mjs` 静态链达 `node:sqlite`
 *  （`agent.mjs` → `agent/setup.mjs` → `memory.mjs` → `memory/schema.mjs`）⇒ 两端一律**函数体内动态 import**
 *  （约定源 = `ledger.mjs:16`；实例 = `tools/index.mjs:63`）；本档静态边只留闭包净件（`config-io.mjs` ∕
 *  `tools/index.mjs`）。
 */
import { resolveProviders } from "./config-io.mjs"
import { assembleBuiltinTools } from "./tools/index.mjs"

/** 读图墙钟上限（VSC `image-handler.mjs:70` 同值——一次性子代理的成功径上限）。 */
export const VISION_READ_TIMEOUT_MS = 60_000

/** 找可跑视觉读图的渠道：`{ provider, model }` ∥ `null`。
 *  判定源随 2026-10-09 清除批退场（渠道不携模型——R3 零读写）；判定源重定在途（台账）。
 *  现行为恒 `null` ⇒ 消费方走既有「无视觉渠道」可读报错径（F-IDG-2——不静默丢图）。 */
export function findVisionChannel(providers, currentName = "") {
  return null
}

/** 降级读图跑者（缝契约 = `visionReader({ paths, signal }) ⇒ { ok: true, description }` ∥ `null`
 *  ——见 `attachments.mjs` `downgradeNonVisionImages`）。 */
export async function runVisionReader({ paths, providerName, cwd, parentAgent, signal }) {
  // 取消缝（VSC A12 同款）：已停 ⇒ 快速失败（不复用 60s 超时路径）；否则桥接内部 controller。
  if (signal?.aborted) return null
  let providers = []
  try { providers = resolveProviders().providers } catch { return null }
  const vc = findVisionChannel(providers, providerName)
  if (!vc) return null
  let provider = null
  try {
    const { resolveChildProvider } = await import("./agent-tools/subagent-async.mjs") // 动态 import（该链静态达 node:sqlite——W8 契约②）
    provider = resolveChildProvider(parentAgent, `${vc.provider}:${vc.model}`)
  } catch { return null }
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), VISION_READ_TIMEOUT_MS)
  const onAbort = () => ac.abort()
  if (signal) signal.addEventListener("abort", onAbort, { once: true })
  try {
    const { createAgent, runAgent, readonlyToolNames, excludeSubagentTools } = await import("./agent.mjs") // 动态 import（agent 链静态达 node:sqlite——W8 契约②）
    const builtins = await assembleBuiltinTools({ memory: parentAgent?.memory, cwd, model: vc.model })
    const allowed = readonlyToolNames(builtins)
    const tools = excludeSubagentTools(builtins.filter((t) => allowed.has(t.name)))
    const child = createAgent({ provider, tools, config: parentAgent?.config, cwd, memory: parentAgent?.memory, role: "explore" })
    const task = paths.map((f) => `用 read_image 读 ${f} 返回图像内容描述`).join("\n")
    const desc = await runAgent(child, task, {}, { depth: 1, maxTurns: 10, signal: ac.signal })
    return typeof desc === "string" && desc.trim() ? { ok: true, description: desc.trim() } : null
  } catch { return null } finally {
    clearTimeout(timer)
    if (signal) signal.removeEventListener("abort", onAbort)
  }
}
