import { createInterface } from "node:readline"
import { configPath, writeConfigAtomic, PROVIDER_PRESETS } from "@thincoder/core/config.mjs"
import { resolveProviders } from "@thincoder/core/config-io.mjs"
import { probeTargetOf } from "@thincoder/core/provider-flows.mjs"
import { probeChannelModels } from "../tui/model-catalog.mjs"

/** First-time setup (TTY chat / distill): ask a few questions to configure a provider, save to disk, return runtime provider. Cancel returns null.
 *  2026-10-09 清除批：渠道条目不携 `model`（单值 `providers[].model` 退场）——模型问句 = 顶层 `defaultModel`
 *  的显式选定（只写 `defaultModel`；返回对象携 `model` = 该选定值——运行时 provider 形，非 config 渠道字段）。 */
export async function setupWizard() {
  // Buffered asker: rl.question loses lines when input is piped/fast-pasted (line arrives before question is registered)
  const rl = createInterface({ input: process.stdin, terminal: false })
  const buffered = []
  let waiter = null
  rl.on("line", (line) => {
    if (waiter) {
      const w = waiter
      waiter = null
      w(line)
    } else {
      buffered.push(line)
    }
  })
  const ask = (q) =>
    new Promise((resolve) => {
      process.stderr.write(q)
      if (buffered.length) resolve(buffered.shift())
      else waiter = resolve
    })
  try {
    const presets = Object.entries(PROVIDER_PRESETS)
    console.error("First time using ThinCoder — let's configure a model provider:")
    presets.forEach(([n, p], i) => console.error(`  ${i + 1}. ${n.padEnd(10)} ${p.desc}`))
    console.error(`  ${presets.length + 1}. Custom endpoint`)
    const choice = Number((await ask(`Pick [1-${presets.length + 1}]: `)).trim())
    let name, baseURL, presetFields = null
    if (choice === presets.length + 1) {
      name = (await ask("Name (e.g. my-openai): ")).trim()
      baseURL = (await ask("baseURL (e.g. https://api.openai.com/v1): ")).trim().replace(/\/+$/, "")
      if (!name || !/^https?:\/\//.test(baseURL)) {
        console.error("Incomplete input or invalid baseURL — cancelled")
        return null
      }
    } else if (choice >= 1 && choice <= presets.length) {
      // 预设全量字段随行（format/thinking/maxTokens…）——探针分派与落盘同源（M9 需要 format）
      presetFields = presets[choice - 1][1]
      name = presets[choice - 1][0]
      baseURL = presetFields.baseURL
    } else {
      console.error("Invalid choice — cancelled")
      return null
    }
    // 2026-10-09 清除批：渠道条目不携模型——模型问句 = **默认模型**（顶层 `defaultModel`）的显式选定
    // （答值不落渠道条目；运行时随下方返回对象携出）。零静默回落 ∥ 零预设播种。
    const model = (await ask("Model (this becomes your default model — e.g. gpt-4o): ")).trim()
    if (!model) {
      console.error("Model cannot be empty — cancelled")
      return null
    }
    const apiKey = (await ask(`API key for ${name}: `)).trim()
    if (!apiKey) {
      console.error("API key cannot be empty — cancelled")
      return null
    }
    const embedKey = (await ask("Optional: embedding API key (SiliconFlow, for vector search; press Enter to skip): ")).trim()
    // #1049 补步（2026-10-08 裁「补步」）：向导末问——「走 proxy」问句（形 ≡ add 流既有问句——
    // `provider-admin.mjs` 两支同语义：答 Yes ⇒ 条目 `proxy: true`；No ∥ 缺省 ⇒ 零 `proxy` 键）。
    // 载体 = 本档唯一输入机制 readline `ask`（y/N——空输入 = 缺省 No）。
    const route = (await ask("Route this provider's model requests through the proxy [y/N]: ")).trim().toLowerCase()
    const useProxy = route === "y" || route === "yes"
    // M9 配置阶段准入（加渠道 = 配置写入面）：探一次 `/models`——探通/探不通都不阻断保存，
    // 仅明示结果（失败文案 = M8 消息本体；无绕过指引）。
    // 探针输入带预设扩展字段（format 决定 M1 分派——claude/gemini 预设必须走自己的拉取分支）。
    // #1048②（2026-10-08）：探针 ≡ 写后运行态——目标 = **合并条目**（既有渠道盘上 `proxy`/`headers` 随行；
    // 下方 upsert 本就保留两键）；目标构造单源 = 核 `probeTargetOf`（判定 ∥ 归一零第二份）。
    const existing = (() => { try { return resolveProviders().providers.find((p) => p.name === name) ?? null } catch { return null } })()
    // 探针条目携答案（#1049——探针 ≡ 写后运行态，同 #1048② 判据；答 Yes ⇒ 目标携 `proxy: true`）
    const probeEntry = { ...existing, ...(presetFields ? { ...presetFields, name, apiKey } : { name, baseURL, apiKey }), ...(useProxy ? { proxy: true } : {}) }
    const probe = await probeChannelModels(probeTargetOf(probeEntry))
    console.error(probe.ok
      ? `✓ ${name}: /models 可用（${probe.list.length} 个模型可候选）`
      : `⚠ ${probe.message}`)
    // D-F5b：磁盘新鲜读 → mutate → mtime 门控写（writeConfigAtomic 收口）；冲突 = 放弃
    // + 提示重试（首配场景另有实例同时写盘——极低概率；不自动合并——决策点① A）
    // MODEL-SELECTION v2：渠道条目不携模型（单值退场——2026-10-09 清除批）+ defaultModel 顶层复合（显式选定）；
    // 预设扩展字段（format/thinking/maxTokens…）随行落盘——与 TUI wizard 近似同构（探针/聊天字段同源），
    // 但 `thinking` 复制语义不同：本文件用 `!== undefined` → kimi/kimi-code 预设的 `thinking: null`
    // **被落盘**；TUI 路径用真值过滤（model-picker.mjs / wizard.mjs）不落该键。
    // `thinking: null`（NF1 = 显式 off）落盘差异已登记待口径统一（父侧）。
    const r = writeConfigAtomic(configPath, (raw) => {
      const providers = raw.providers?.length ? raw.providers : []
      const existing = providers.find((p) => p.name === name)
      const rec = { name, baseURL, apiKey } // 2026-10-09 清除批：渠道条目不携 `model`
      for (const k of ["format", "thinking", "reasoningEffort", "maxTokens", "chatPath"]) {
        if (presetFields?.[k] !== undefined) rec[k] = presetFields[k]
      }
      if (useProxy) rec.proxy = true // #1049 补步：答 Yes ⇒ 随本落盘一次写（No ∥ 缺省 ⇒ 零键零写）
      if (existing) Object.assign(existing, rec) // 渠道老字段（models 候选清单）由 config-migrate 在下次 load 统一清理
      else providers.push(rec)
      raw.providers = providers
      raw.defaultModel = `${name}:${model}` // 显式选定降盘（唯一模型写面之一——渠道条目零 `model`）
      delete raw.activeProvider
      delete raw.activeModel
      if (embedKey) raw.embedding = { ...(raw.embedding ?? {}), apiKey: embedKey }
    })
    if (!r.ok) {
      console.error("config changed on disk concurrently — retry")
      return null
    }
    console.error(`Configured: ${name} (defaultModel = ${name}:${model} — saved to ${configPath})`)
    console.error(embedKey ? "Vector search enabled\n" : "(No embedding key configured: memory search will use text-only FTS. Add embedding.apiKey to config.json to enable vector search later.)\n")
    return { name, baseURL, model, apiKey, defaultModel: `${name}:${model}` }
  } finally {
    rl.close()
  }
}
