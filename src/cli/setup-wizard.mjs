import { createInterface } from "node:readline"
import { configPath, writeConfigAtomic, PROVIDER_PRESETS } from "../config.mjs"
import { probeChannelModels } from "../tui/model-catalog.mjs"

/** First-time setup (TTY chat / distill): ask a few questions to configure a provider, save to disk, return runtime provider. Cancel returns null. */
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
    let name, baseURL, model
    if (choice === presets.length + 1) {
      name = (await ask("Name (e.g. my-openai): ")).trim()
      baseURL = (await ask("baseURL (e.g. https://api.openai.com/v1): ")).trim().replace(/\/+$/, "")
      model = (await ask("Model (e.g. gpt-4o): ")).trim()
      if (!name || !/^https?:\/\//.test(baseURL) || !model) {
        console.error("Incomplete input or invalid baseURL — cancelled")
        return null
      }
    } else if (choice >= 1 && choice <= presets.length) {
      name = presets[choice - 1][0]
      baseURL = presets[choice - 1][1].baseURL
      model = presets[choice - 1][1].model
    } else {
      console.error("Invalid choice — cancelled")
      return null
    }
    const apiKey = (await ask(`API key for ${name}: `)).trim()
    if (!apiKey) {
      console.error("API key cannot be empty — cancelled")
      return null
    }
    const embedKey = (await ask("Optional: embedding API key (SiliconFlow, for vector search; press Enter to skip): ")).trim()
    // M9 配置阶段准入（加渠道 = 配置写入面）：探一次 `/models`——探通/探不通都不阻断保存，
    // 仅明示结果（失败文案 = M8 消息本体；无绕过指引）。
    const probe = await probeChannelModels({ name, baseURL, apiKey })
    console.error(probe.ok
      ? `✓ ${name}: /models 可用（${probe.list.length} 个模型可候选）`
      : `⚠ ${probe.message}`)
    // D-F5b：磁盘新鲜读 → mutate → mtime 门控写（writeConfigAtomic 收口）；冲突 = 放弃
    // + 提示重试（首配场景另有实例同时写盘——极低概率；不自动合并——决策点① A）
    // MODEL-SELECTION v2：渠道默认模型 = 单值 `model` + defaultModel 顶层复合
    const r = writeConfigAtomic(configPath, (raw) => {
      const providers = raw.providers?.length ? raw.providers : []
      const existing = providers.find((p) => p.name === name)
      const rec = { name, baseURL, model, apiKey }
      if (existing) Object.assign(existing, rec) // 渠道老字段（models 候选清单）由 config-migrate 在下次 load 统一清理
      else providers.push(rec)
      raw.providers = providers
      raw.defaultModel = `${name}:${model}`
      delete raw.activeProvider
      delete raw.activeModel
      if (embedKey) raw.embedding = { ...(raw.embedding ?? {}), apiKey: embedKey }
    })
    if (!r.ok) {
      console.error("config changed on disk concurrently — retry")
      return null
    }
    console.error(`Configured: ${name} / ${model} (defaultModel = ${name}:${model} — saved to ${configPath})`)
    console.error(embedKey ? "Vector search enabled\n" : "(No embedding key configured: memory search will use text-only FTS. Add embedding.apiKey to config.json to enable vector search later.)\n")
    return { name, baseURL, model, apiKey, defaultModel: `${name}:${model}` }
  } finally {
    rl.close()
  }
}
