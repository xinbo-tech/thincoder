import { existsSync, readFileSync } from "node:fs"
import { ansi, C } from "./ansi.mjs"
/** Merge an embedding-key save into the raw config, backfilling baseURL/model from defaults.
 *  Keeps existing custom values (Ollama/local embedding); defaults are the single source
 *  (TUI.md §9.3D — NF1). Exported for unit tests. */
export function embeddingPatch(raw, embKey, defaults) {
  const prev = raw?.embedding ?? {}
  return {
    ...prev,
    apiKey: embKey,
    baseURL: prev.baseURL ?? defaults.baseURL,
    model: prev.model ?? defaults.model,
  }
}

/** /config command: view and set agent/embedding/proxy config. */
export async function handleConfigCommand(ctx, args = []) {
  const { agent, pushLine, pushLabel, showPicker, askQuestion, persistRaw, maskKey, pickModelForSlot } = ctx
  const { configPath, DEFAULTS } = await import("../config.mjs")
  const ac = agent.config?.agent ?? {}
  const ec = agent.config?.embedding ?? {}

  // agent.config.proxy 已被 loadConfig 归一化为 { uri, web, model } | undefined
  function proxySummary() {
    const pc = agent.config?.proxy
    if (!pc) return "not configured"
    return `${pc.uri} web:${pc.web ? "on" : "off"} model:${pc.model ? "on" : "off"}`
  }

  async function setEmbedKey() {
    const embKey = await askQuestion("Enter embedding API key (default: SiliconFlow bge-m3):")
    if (!embKey) return false
    agent.config.embedding ??= {}
    agent.config.embedding.apiKey = embKey
    await persistRaw((raw) => { raw.embedding = embeddingPatch(raw, embKey, DEFAULTS.embedding) })
    if (agent.memory) {
      const { createEmbedder } = await import("../embedding.mjs")
      agent.memory.embedder = createEmbedder(agent.config.embedding)
    }
    pushLabel("❯ Config", ansi.bold + C.tool)
    pushLine("Embedding key saved, vector search enabled", C.tool)
    return true
  }

  /** 保存后的公共重载：loadConfig → injectProxy → 恢复 provider 选择。
   *  运行时 /model 切过 provider（未落盘）时保持它，不回滚到磁盘值。 */
  async function reloadConfig() {
    const { loadConfig } = await import("../config.mjs")
    const { injectProxy } = await import("../proxy.mjs")
    const cfg = loadConfig()
    injectProxy(cfg.providersList, cfg)
    const runtimeName = agent.activeProvider
    const runtimeModel = agent.activeModel
    agent.providers = cfg.providersList
    agent.config = cfg
    agent.config.agent ??= {}
    const keep = cfg.providersList.find((p) => p.name === runtimeName)
    if (runtimeName && runtimeName !== cfg.activeProvider && keep) {
      // 运行时选择在新配置里仍存在 → 保持（provider 为注入 proxyUri 后的新对象）
      agent.activeProvider = runtimeName
      agent.activeModel = runtimeModel
      agent.provider = { ...keep }
      if (agent.activeModel) agent.provider.model = agent.activeModel
    } else if (runtimeName && runtimeName === cfg.activeProvider && runtimeModel) {
      // Same provider, runtime had a model override — keep it
      agent.activeProvider = cfg.activeProvider
      agent.activeModel = runtimeModel
      const p = cfg.providersList.find((pr) => pr.name === cfg.activeProvider)
      agent.provider = p ? { ...p } : cfg.provider
      agent.provider.model = runtimeModel
      agent.provider.proxyUri = p?.proxyUri
    } else {
      agent.activeProvider = cfg.activeProvider
      agent.activeModel = cfg.activeModel ?? null
      agent.provider = cfg.provider
      agent.provider.proxyUri = cfg.providersList.find((p) => p.name === cfg.activeProvider)?.proxyUri
    }
  }

  /** 保存 config（mutate 改 raw）→ reloadConfig（provider 代理无需重启即生效） */
  async function saveProxy(mutate) {
    const raw = existsSync(configPath) ? JSON.parse(readFileSync(configPath, "utf8")) : {}
    mutate(raw)
    const { saveConfig } = await import("../config.mjs")
    saveConfig(raw)
    await reloadConfig()
  }

  // ── Proxy sub-menu loop：每轮重建 entries 显示最新状态，defaultIndex 记住上次位置 ──
  async function proxyMenu() {
    let proxyIdx = 0
    for (;;) {
      const pc = agent.config?.proxy // 已归一化 { uri, web, model } | undefined
      const entries = [
        { type: "header", text: `Proxy: ${pc?.uri || "(not set)"}` },
        { type: "item", text: "Set proxy URI…", action: "seturi" },
        { type: "item", text: `Web tools (fetch/websearch): ${!pc || pc.web ? "ON" : "OFF"}`, action: "toggleweb" },
        { type: "item", text: `Model requests (providers with proxy:true): ${pc?.model ? "ON" : "OFF"}`, action: "togglemodel" },
        { type: "item", text: "Test connection", action: "test" },
        { type: "item", text: "Clear proxy", action: "clear" },
      ]
      const c = await showPicker("Proxy", entries, { defaultIndex: proxyIdx })
      if (!c) return // Esc 返回主菜单
      proxyIdx = Math.max(0, entries.filter((e) => e.type === "item").indexOf(c))

      try {
        if (c.action === "seturi") {
          const newUri = await askQuestion("Proxy URI (e.g. http://127.0.0.1:7890):")
          if (!newUri) continue // 空输入不改动
          // web 默认 true、保留原 model 值（对象形态）；旧 string 形态升级为规范对象
          await saveProxy((raw) => {
            raw.proxy = raw.proxy && typeof raw.proxy === "object" && !Array.isArray(raw.proxy)
              ? { ...raw.proxy, uri: newUri }
              : { uri: newUri, web: true, model: false }
          })
          pushLabel("❯ Config", ansi.bold + C.tool)
          pushLine(`proxy.uri = ${newUri}`, C.tool)
        } else if (c.action === "toggleweb" || c.action === "togglemodel") {
          if (!pc) { pushLine("Proxy URI not set — use Set proxy URI… first", C.error); continue }
          const key = c.action === "toggleweb" ? "web" : "model"
          await saveProxy((raw) => { raw.proxy = { ...pc, [key]: !pc[key] } })
          pushLabel("❯ Config", ansi.bold + C.tool)
          pushLine(`proxy.${key} = ${!pc[key] ? "on" : "off"}`, C.tool)
        } else if (c.action === "test") {
          const { proxyFetch, resolveWebProxy } = await import("../proxy.mjs")
          const { UA } = await import("../tools/web.mjs")
          const uri = resolveWebProxy({ agent })
          pushLabel("❯ Config", ansi.bold + C.tool)
          pushLine(`Testing ${uri ? `via proxy ${uri}` : "direct (no proxy)"}...`, C.dim)
          try {
            const res = await Promise.race([
              proxyFetch("https://www.gstatic.com/generate_204", { headers: { "User-Agent": UA } }, uri),
              new Promise((_, reject) => setTimeout(() => reject(new Error("timeout after 5s")), 5000)),
            ])
            if (res.ok) pushLine(`✓ OK (HTTP ${res.status})`, C.tool)
            else pushLine(`✗ HTTP ${res.status}`, C.error)
          } catch (error) {
            pushLine(`✗ ${error.message}`, C.error)
          }
        } else if (c.action === "clear") {
          await saveProxy((raw) => { delete raw.proxy })
          pushLabel("❯ Config", ansi.bold + C.tool)
          pushLine("Proxy cleared", C.tool)
        }
      } catch (error) { pushLine(`Save failed: ${error.message}`, C.error) }
    }
  }

  // Direct args: /config embedkey
  const sub = args[0]?.toLowerCase()
  if (sub === "embedkey") {
    await setEmbedKey()
    return
  }
  if (sub) { pushLine("Usage: /config [embedkey]", C.error); return }

  /** 会诊/飞刀候选池子菜单：列出 / 添加 / 编辑 effort / 删除 consultModels 条目。 */
  async function pickEffort(current, model) {
    const { specForModel } = await import("../config.mjs")
    const enumList = model ? specForModel(model).reasoningEffortEnum : null
    // The model's reasoning-effort enum is HETEROGENEOUS across providers (deepseek:
    // low/high/max; qwen3.8-max: xhigh/medium/low; kimi: 7 levels). A fixed
    // min/low/medium/high/max list made the user pick values that the runtime then
    // silently dropped as out-of-enum (2026-08-17 audit). Show the model's real enum.
    if (!enumList || enumList.length === 0) return null // model has no effort — skip
    const levels = ["none", ...enumList] // "none" = clear the effort
    const entries = levels.map((l) => ({ type: "item", text: l === current ? `${l}  ← current` : l, action: l }))
    const c = await showPicker("Reasoning effort", entries, { defaultIndex: Math.max(0, levels.indexOf(current ?? "none")) })
    return c ? c.action : null // Esc → null (keep unchanged)
  }

  async function consultMenu() {
    let idx = 0
    for (;;) {
      const cm = agent.config?.agent?.consultModels ?? []
      const entries = [
        { type: "header", text: `Consult/escalate pool: ${cm.length} model(s) (max 5)` },
        ...cm.map((m, i) => ({ type: "item", text: `${m.provider}:${m.model}${m.effort ? ` (${m.effort})` : ""}`, action: "edit", index: i })),
        { type: "item", text: cm.length ? "＋ Add model" : "＋ Add model (none yet)", action: "add" },
      ]
      const c = await showPicker("Consult models", entries, { defaultIndex: idx })
      if (!c) return // Esc → 返回主菜单
      if (c.action === "add") {
        if (cm.length >= 5) { pushLine("At most 5 consult models", C.error); continue }
        // BOTH provider and model are pickers (discipline: options, never free-text) —
        // pickModelForSlot reuses /model's provider list + async-fetched model list.
        const picked = await pickModelForSlot()
        if (!picked) continue
        const effort = await pickEffort(null, picked.model)
        const entry = { provider: picked.provider, model: picked.model }
        if (effort && effort !== "none") entry.effort = effort
        const next = [...cm, entry]
        await saveProxy((raw) => { raw.agent ??= {}; raw.agent.consultModels = next })
        pushLabel("❯ Config", ansi.bold + C.tool)
        pushLine(`Added ${entry.provider}:${entry.model}${entry.effort ? ` (${entry.effort})` : ""}`, C.tool)
        idx = 0
      } else if (c.action === "edit") {
        // Per-model sub-menu: change effort or remove.
        const m = cm[c.index]
        const tag = `${m.provider}:${m.model}`
        const subEntries = [
          { type: "header", text: `${tag} — effort: ${m.effort ?? "(none)"}` },
          { type: "item", text: `Change effort (current: ${m.effort ?? "none"})`, action: "effort" },
          { type: "item", text: "Remove", action: "remove" },
        ]
        const s = await showPicker(tag, subEntries, {})
        if (!s) continue
        if (s.action === "remove") {
          const next = cm.filter((_, i) => i !== c.index)
          await saveProxy((raw) => { raw.agent ??= {}; raw.agent.consultModels = next })
          pushLabel("❯ Config", ansi.bold + C.tool)
          pushLine(`Removed ${tag}`, C.tool)
        } else if (s.action === "effort") {
          const effort = await pickEffort(m.effort, m.model)
          if (effort === null) { continue } // Esc 保持
          const next = cm.map((x, i) => {
            if (i !== c.index) return x
            if (effort === "none") { const { effort, ...rest } = x; return rest }
            return { ...x, effort }
          })
          await saveProxy((raw) => { raw.agent ??= {}; raw.agent.consultModels = next })
          pushLabel("❯ Config", ansi.bold + C.tool)
          const after = next[c.index]
          pushLine(`${tag} effort = ${after?.effort ?? "none"}`, C.tool)
        }
        idx = 0
      }
    }
  }

  // ── Main config loop ──
  let running = true
  let mainIdx = 0 // 记住上次选中位置，改完一项回主菜单时恢复
  while (running) {
    const consultCount = (ac.consultModels ?? []).length
    const mainEntries = [
      { type: "header", text: `proxy=${proxySummary()} | maxTurns=${ac.maxTurns ?? 100} | compactThreshold=${ac.compactThreshold ?? 100000} | verifyGuard=${ac.verifyGuard === true ? "on" : "off"} | consult=${consultCount} model(s) | embedding=${agent.memory?.embedder ? "on" : "off"}` },
      { type: "item", text: `agent.maxTurns = ${ac.maxTurns ?? 100}`, action: "agent.maxTurns" },
      { type: "item", text: `agent.subagentTurns = ${ac.subagentTurns ?? 100}`, action: "agent.subagentTurns" },
      { type: "item", text: `agent.compactThreshold = ${ac.compactThreshold ?? 100000}${agent.config?.agent?.compactThresholdAuto ? " (auto)" : ""}`, action: "agent.compactThreshold" },
      { type: "item", text: `agent.verifyGuard = ${ac.verifyGuard === true ? "on" : "off"}`, action: "agent.verifyGuard" },
      { type: "item", text: `agent.consultModels = ${consultCount} model(s)${consultCount ? ` (${(ac.consultModels ?? []).map((m) => m.provider + ":" + m.model).join(", ")})` : ""}`, action: "consult" },
      { type: "item", text: `agent.consultTurns = ${ac.consultTurns ?? 40}`, action: "agent.consultTurns" },
      { type: "item", text: `agent.consultTimeoutMs = ${Math.round((ac.consultTimeoutMs ?? 600000) / 60000)} min`, action: "agent.consultTimeoutMs" },
      { type: "item", text: "Set embedding API key", action: "embedkey" },
      { type: "item", text: `proxy = ${proxySummary()}`, action: "proxy" },
      { type: "item", text: "View full config", action: "view" },
    ]

    const choice = await showPicker("Config", mainEntries, { defaultIndex: mainIdx })
    if (!choice) { running = false; continue } // Esc
    mainIdx = Math.max(0, mainEntries.filter((e) => e.type === "item").indexOf(choice))

    if (choice.action === "view") {
      pushLabel("❯ Config", ansi.bold + C.tool)
      pushLine(`Active: ${agent.activeProvider} / ${agent.provider.model}`, C.dim)
      pushLine(`Key:    ${maskKey(agent.provider.apiKey)}`, C.dim)
      pushLine(`agent.maxTurns: ${ac.maxTurns ?? 100}`, C.dim)
      pushLine(`agent.subagentTurns: ${ac.subagentTurns ?? 100}`, C.dim)
      pushLine(`agent.compactThreshold: ${ac.compactThreshold ?? 100000}${agent.config?.agent?.compactThresholdAuto ? " (auto)" : ""}`, C.dim)
      pushLine(`agent.verifyGuard: ${ac.verifyGuard === true ? "on" : "off"}`, C.dim)
      pushLine(`agent.consultModels: ${(ac.consultModels ?? []).map((m) => `${m.provider}:${m.model}${m.effort ? ` (${m.effort})` : ""}`).join(", ") || "(none)"}`, C.dim)
      pushLine(`agent.consultTurns: ${ac.consultTurns ?? 40}`, C.dim)
      pushLine(`agent.consultTimeoutMs: ${Math.round((ac.consultTimeoutMs ?? 600000) / 60000)} min`, C.dim)
      pushLine(`embedding: ${agent.memory?.embedder ? `enabled (${ec.model ?? ""})` : "disabled (FTS only)"}`, C.dim)
      pushLine(`proxy: ${proxySummary()}`, C.dim)
      pushLine(`Config file: ${configPath}`, C.dim)
      running = false
      continue
    }

    if (choice.action === "proxy") {
      await proxyMenu()
      continue
    }

    if (choice.action === "consult") {
      await consultMenu()
      continue
    }

    if (choice.action === "embedkey") {
      if (await setEmbedKey()) running = false
      continue
    }

    if (choice.action === "agent.verifyGuard") {
      const newVal = ac.verifyGuard !== true
      try {
        await saveProxy((raw) => {
          raw.agent ??= {}
          raw.agent.verifyGuard = newVal
        })
        pushLabel("❯ Config", ansi.bold + C.tool)
        pushLine(`agent.verifyGuard = ${newVal ? "on" : "off"}`, C.tool)
        running = false
      } catch (error) { pushLine(`Save failed: ${error.message}`, C.error) }
      continue
    }

    // Embedding model is fixed (BAAI/bge-m3, SiliconFlow) — no picker; it's over-engineering
    // to expose model choice when the vector index format assumes one embedding space.

    // Numeric config items
    const label = choice.action
    const isTimeout = label === "agent.consultTimeoutMs"
    const current = label === "agent.maxTurns" ? (ac.maxTurns ?? 100)
      : label === "agent.subagentTurns" ? (ac.subagentTurns ?? 100)
      : label === "agent.compactThreshold" ? (ac.compactThreshold ?? 100000)
      : label === "agent.consultTurns" ? (ac.consultTurns ?? 40)
      : isTimeout ? Math.round((ac.consultTimeoutMs ?? 600000) / 60000)
      : ""
    const val = await askQuestion(`${label} (current: ${current}${isTimeout ? " min" : ""}):`)
    if (!val) continue
    try {
      const num = Number(val)
      if (isNaN(num)) { pushLine("Value must be a number", C.error); continue }
      const stored = isTimeout ? Math.round(num * 60000) : num
      await saveProxy((raw) => {
        const keys = label.split(".")
        let obj = raw
        for (let i = 0; i < keys.length - 1; i++) { obj[keys[i]] ??= {}; obj = obj[keys[i]] }
        obj[keys[keys.length - 1]] = stored
      })
      pushLabel("❯ Config", ansi.bold + C.tool)
      pushLine(`${label} = ${isTimeout ? `${val} min (${stored} ms)` : val}`, C.tool)
      pushLine("(restart to apply)", C.dim)
      running = false
    } catch (error) { pushLine(`Save failed: ${error.message}`, C.error) }
  }
}
