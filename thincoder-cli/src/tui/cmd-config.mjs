import { ansi, C } from "./ansi.mjs"
import { probeChannelModels, dedupeModels } from "./model-catalog.mjs"
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

/** 并发池三键当前值读取（POOL-CONFIG-UNIFIED F-3——2026-09-09）：配置值合法（≥1 整数）
 *  读配置——非法/缺省回退 DEFAULTS（agent.poolLimits 三键——/config 并发池子菜单/
 *  主菜单/view 三面共用同一读取——config-pool.test.mjs 单测面）。 */
export function poolCur(pl, defaults) {
  return (k) => (Number.isInteger(pl?.[k]) && pl[k] >= 1 ? pl[k] : defaults.agent.poolLimits[k])
}

/** Effort 菜单档位构造（#16 双 `none` 去重——枚举自带 `none` 的族如 qwen3.8-flash 时原来出两行）：
 *  `none` 恒为首项且唯一，其余档序保持（`filter` 保序）。语义面零改——`none` = 清档，
 *  消费点 `:205`/`:232` 只认 `=== "none"`；空枚举在 `pickEffort` 处已早退 null、不经本函数。
 *  Exported for unit tests (`cmd-config-effort.test.mjs`). */
export function effortMenuLevels(enumList) {
  return ["none", ...(enumList ?? []).filter((l) => l !== "none")]
}

/** /config command: view and set agent/embedding/proxy config. */
export async function handleConfigCommand(ctx, args = []) {
  const { agent, pushLine, pushLabel, showPicker, askQuestion, persistRaw, maskKey, pickModelForSlot } = ctx
  const { configPath, DEFAULTS } = await import("@thincoder/core/config.mjs")
  let ac = agent.config?.agent ?? {}
  let ec = agent.config?.embedding ?? {}
  let tc = agent.config?.traces ?? {}

  // agent.config.proxy 已被 loadConfig 归一化为 { uri, web, model } | undefined
  function proxySummary() {
    const pc = agent.config?.proxy
    if (!pc) return "not configured"
    return `${pc.uri} web:${pc.web ? "on" : "off"} model:${pc.model ? "on" : "off"}`
  }

  async function setEmbedKey() {
    const embKey = await askQuestion("Enter embedding API key (default: SiliconFlow bge-m3):")
    if (!embKey) return false
    // D-F5b 语义先盘后存（embeddingPatch 在磁盘 fresh raw 上合并——冲突放弃不留 ghost）
    await persistRaw((raw) => { raw.embedding = embeddingPatch(raw, embKey, DEFAULTS.embedding) })
    agent.config.embedding ??= {}
    agent.config.embedding.apiKey = embKey
    if (agent.memory) {
      const { createEmbedder } = await import("@thincoder/core/embedding.mjs")
      agent.memory.embedder = createEmbedder(agent.config.embedding)
    }
    pushLabel("❯ Config", ansi.bold + C.tool)
    pushLine("Embedding key saved, vector search enabled", C.tool)
    return true
  }

  /** 保存后的公共重载：loadConfig → injectProxy → 恢复运行时 provider 选择。
   *  MODEL-MERGE-SESSION 三支改写（cfg 无 active*）：运行时由「会话槽复合仍在 providers 中 →
   *  保持槽值」或「config defaultModel（新会话起点）」决定——不再有渠道默认字段可回退。 */
  async function reloadConfig() {
    const { loadConfig } = await import("@thincoder/core/config.mjs")
    const { injectProxy } = await import("@thincoder/core/proxy.mjs")
    const cfg = loadConfig()
    injectProxy(cfg.providersList, cfg)
    const sessionName = agent.activeProvider
    const sessionModel = agent.activeModel
    agent.providers = cfg.providersList
    agent.config = cfg
    agent.config.agent ??= {}
    const keep = sessionName ? cfg.providersList.find((p) => p.name === sessionName) : null
    if (keep) {
      // 会话 provider 仍存在 → 会话复合优先（槽值——不看 cfg 默认；模型空时落默认复合/渠道默认单值）
      const dm = cfg.provider.name ? cfg.provider : null
      const model = sessionModel ?? (dm && dm.name === sessionName ? dm.model : keep.model ?? "")
      agent.activeProvider = keep.name
      agent.activeModel = model || null
      agent.provider = { ...keep }
      agent.provider.model = model
    } else {
      // 会话 provider 没了（D-S3 静默保留处置）/尚未选 → 采纳 config defaultModel 运行时
      agent.activeProvider = cfg.provider.name ?? ""
      agent.activeModel = cfg.provider.model ?? null
      agent.provider = cfg.provider.name ? { ...cfg.provider } : {}
    }
    // 运行时重建后同步注入结果（cfg.provider 系 loadConfig 内建——injectProxy 后建）
    agent.provider.proxyUri = cfg.providersList.find((p) => p.name === agent.activeProvider)?.proxyUri
    if (agent.config?.agent?.compactThresholdAuto) {
      const { resolveCompactThreshold } = await import("@thincoder/core/config.mjs")
      agent.config.agent.compactThreshold = resolveCompactThreshold(null, agent.provider).value
    }
  }

  /** 保存 config（mutate 改 raw）→ reloadConfig（provider 代理无需重启即生效）。
   *  D-F5b：磁盘新鲜读 → mutate → 写前 mtime 门控（writeConfigAtomic——冲突放弃 +
   *  .bak 留现场）；冲突时先 reloadConfig 采纳磁盘新值再 throw——调用方 try/catch
   *  统一展示 "Save failed: config changed on disk concurrently — retry"。
   *  写链走 ctx.persistRaw（与 TUI 其余 config 写点同源——createConfigHelpers 的
   *  configPath 测试注入缝随之生效；生产 = 同一 writeConfigAtomic 调用）。 */
  async function saveProxy(mutate) {
    let failure = null
    try { await persistRaw(mutate) } catch (e) { failure = e }
    await reloadConfig()
    if (failure) throw failure
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
          const { proxyFetch, resolveWebProxy } = await import("@thincoder/core/proxy.mjs")
          const { UA } = await import("@thincoder/core/tools/web.mjs")
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
    const { specForModel } = await import("@thincoder/core/config.mjs")
    const enumList = model ? specForModel(model).reasoningEffortEnum : null
    // The model's reasoning-effort enum is HETEROGENEOUS across providers (deepseek:
    // low/high/max; qwen3.8-max: xhigh/medium/low; kimi: 7 levels). A fixed
    // min/low/medium/high/max list made the user pick values that the runtime then
    // silently dropped as out-of-enum (2026-08-17 audit). Show the model's real enum.
    if (!enumList || enumList.length === 0) return null // model has no effort — skip
    const levels = effortMenuLevels(enumList) // "none" = clear the effort（自带去重——#16）
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

  // ── 并发池子菜单（agent.poolLimits——读/改三域；保存经 saveProxy
  // 落盘 + reloadConfig 热应用——下个 spawn 生效）──
  async function poolMenu() {
    let poolIdx = 0
    for (;;) {
      const pl = agent.config?.agent?.poolLimits ?? {}
      // 显示回退与默认同源（DEFAULTS.agent.poolLimits——配置 DEFAULTS 与运行时回退常量
      // ASYNC_POOL_LIMITS/ADVISOR_POOL_LIMIT 的耦合由 T-24a4 锚定断言（config-pool.test.mjs）
      // 锁住——防默认值单侧漂移）
      const cur = poolCur(pl, DEFAULTS)
      const entries = [
        { type: "header", text: `Async pools: eng-coder ${cur("engCoder")} / other ${cur("other")} / advisor ${cur("advisor")}（默认 4/4/4——分域互不阻塞——subagent 超限排队/advisor 超限即拒）` },
        { type: "item", text: `eng-coder 池上限 = ${cur("engCoder")}`, action: "engCoder" },
        { type: "item", text: `其他角色池上限 = ${cur("other")}`, action: "other" },
        { type: "item", text: `advisor 评审池上限 = ${cur("advisor")}`, action: "advisor" },
      ]
      const c = await showPicker("并发池（agent.poolLimits）", entries, { defaultIndex: poolIdx })
      if (!c) return // Esc 返回主菜单
      poolIdx = Math.max(0, entries.filter((e) => e.type === "item").indexOf(c))
      const val = await askQuestion(`${c.action} pool limit (current: ${cur(c.action)} — positive integer ≥1):`)
      if (!val) continue // 空输入不改动
      const num = Number(val)
      if (!Number.isInteger(num) || num < 1) { pushLine("Pool limit must be a positive integer (≥1)", C.error); continue }
      // 写盘全对象（三键——未触碰的键带当前值重写——全非法/空输入不改动）
      const next = { engCoder: cur("engCoder"), other: cur("other"), advisor: cur("advisor"), [c.action]: num }
      try {
        await saveProxy((raw) => { raw.agent ??= {}; raw.agent.poolLimits = { engCoder: next.engCoder, other: next.other, advisor: next.advisor } })
        pushLabel("❯ Config", ansi.bold + C.tool)
        pushLine(`agent.poolLimits = { engCoder: ${next.engCoder}, other: ${next.other}, advisor: ${next.advisor} }（下个 spawn 生效——分域互不阻塞）`, C.tool)
      } catch (error) { pushLine(`Save failed: ${error.message}`, C.error) }
    }
  }

  // ── 默认模型子菜单（F-5：config.defaultModel 专用入口——L1 provider → L2 **运行期拉取**候选 →
  // 写 config.defaultModel——saveProxy/writeConfigAtomic 通道——不落会话槽；不加手输行——O1 已裁）──
  async function defaultModelMenu() {
    let idx = 0
    // M9 配置阶段准入：进本子菜单探一次各渠道 `/models`（复用 M1 + 会话缓存）。
    // 探通 → 渠道可用 + 候选直接可用；探不通 → 不缓存不阻断（标「不可用」且不入可选来源）。
    const probes = new Map()
    pushLine("Fetching channel model lists (GET /models)…", C.dim)
    await Promise.all(agent.providers.map(async (p) => {
      const r = await probeChannelModels(p)
      probes.set(p.name, r)
      if (r.ok) delete p._unavailable
      else p._unavailable = true
    }))
    for (;;) {
      const dm = agent.config?.defaultModel ?? null
      const entries = [
        { type: "header", text: `config.defaultModel = ${dm ?? "(not set — 新会话起点未配置)"}` },
        ...agent.providers.map((p) => {
          const r = probes.get(p.name)
          if (!r?.ok) return { type: "item", text: `${p.name.padEnd(10)} 不可用`, action: "provider", provider: p.name, unavailable: true }
          const n = r.list.length
          // M3③：渠道行显示渠道默认模型（单值）+ 探得候选数
          return { type: "item", text: `${p.name.padEnd(10)} ${p.model ?? "(no default model)"} (${n} model${n === 1 ? "" : "s"})`, action: "provider", provider: p.name }
        }),
      ]
      const c = await showPicker("Default Model (新会话起点)", entries, { defaultIndex: idx })
      if (!c) return // Esc → 返回主菜单
      idx = Math.max(0, entries.filter((e) => e.type === "item").indexOf(c))
      if (c.action !== "provider") continue
      const r = probes.get(c.provider)
      if (!r?.ok) {
        // 准入判据：探不通的渠道不作为默认模型的可选来源——明示原因（M8 长句），不阻断菜单
        pushLine(r?.message ?? `${c.provider} 不可用`, C.error)
        continue
      }
      if (r.list.length === 0) { pushLine(`${c.provider}: /models 未返回任何模型`, C.error); continue }
      const me = await showPicker(`${c.provider} models`, [
        { type: "header", text: "选为 config.defaultModel（新会话起点——当前会话槽不受影响）" },
        ...dedupeModels(r.list).map((m) => ({ type: "item", text: m, action: "model", model: m })),
      ])
      if (!me) continue // Esc → 回默认模型菜单
      try {
        await saveProxy((raw) => { raw.defaultModel = `${c.provider}:${me.model}` })
        pushLabel("❯ Config", ansi.bold + C.tool)
        pushLine(`config.defaultModel = ${c.provider}:${me.model}（新会话起点；会话模型不受影响）`, C.tool)
      } catch (error) { pushLine(`Save failed: ${error.message}`, C.error) }
    }
  }

  // ── Main config loop ──
  let running = true
  let mainIdx = 0 // 记住上次选中位置，改完一项回主菜单时恢复
  while (running) {
    // 每轮刷新——保存分支经 reloadConfig 替换了 agent.config 对象——回菜单显示新值
    ac = agent.config?.agent ?? {}
    ec = agent.config?.embedding ?? {}
    tc = agent.config?.traces ?? {}
    const consultCount = (ac.consultModels ?? []).length
    const pl = ac.poolLimits ?? {}
    const cur = poolCur(pl, DEFAULTS)
    const mainEntries = [
      { type: "header", text: `proxy=${proxySummary()} | maxTurns=${ac.maxTurns ?? 200} | compactThreshold=${ac.compactThreshold ?? 100000} | verifyGuard=${ac.verifyGuard === true ? "on" : "off"} | consult=${consultCount} model(s) | embedding=${agent.memory?.embedder ? "on" : "off"} | traces=${tc.enabled === false ? "off" : "on"}` },
      { type: "item", text: `agent.maxTurns = ${ac.maxTurns ?? 200}`, action: "agent.maxTurns" },
      { type: "item", text: `agent.subagentTurns = ${ac.subagentTurns ?? 100}`, action: "agent.subagentTurns" },
      { type: "item", text: `并发池 agent.poolLimits = engCoder ${cur("engCoder")} / other ${cur("other")} / advisor ${cur("advisor")}（async 分域上限）`, action: "pool" },
      { type: "item", text: `agent.compactThreshold = ${ac.compactThreshold ?? 100000}${agent.config?.agent?.compactThresholdAuto ? " (auto)" : ""}`, action: "agent.compactThreshold" },
      { type: "item", text: `config.defaultModel = ${agent.config?.defaultModel ?? "(未设置 — 新会话起点)"}`, action: "defaultModel" },
      { type: "item", text: `agent.verifyGuard = ${ac.verifyGuard === true ? "on" : "off"}`, action: "agent.verifyGuard" },
      { type: "item", text: `traces.enabled = ${tc.enabled === false ? "off" : "on"}（轨迹存档——发布默认关——隐私）`, action: "traces.enabled" },
      { type: "item", text: `traces.retentionHours = ${tc.retentionHours ?? 24} h（超期文件启动时清理）`, action: "traces.retentionHours" },
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
      pushLine(`Session model: ${agent.activeProvider ? `${agent.activeProvider}:${agent.activeModel ?? ""}` : "(none)"}`, C.dim)
      pushLine(`defaultModel (config): ${agent.config?.defaultModel ?? "(not set — 新会话起点)"}`, C.dim)
      pushLine(`Key:    ${maskKey(agent.provider.apiKey)}`, C.dim)
      pushLine(`agent.maxTurns: ${ac.maxTurns ?? 200}`, C.dim)
      pushLine(`agent.subagentTurns: ${ac.subagentTurns ?? 100}`, C.dim)
      pushLine(`agent.compactThreshold: ${ac.compactThreshold ?? 100000}${agent.config?.agent?.compactThresholdAuto ? " (auto)" : ""}`, C.dim)
      pushLine(`agent.verifyGuard: ${ac.verifyGuard === true ? "on" : "off"}`, C.dim)
      pushLine(`traces.enabled: ${tc.enabled === false ? "off" : "on"}（默认 off——发布隐私——本地分析可开）`, C.dim)
      pushLine(`traces.retentionHours: ${tc.retentionHours ?? 24}（超期文件启动清理——D-TR10）`, C.dim)
      pushLine(`agent.consultModels: ${(ac.consultModels ?? []).map((m) => `${m.provider}:${m.model}${m.effort ? ` (${m.effort})` : ""}`).join(", ") || "(none)"}`, C.dim)
      pushLine(`agent.poolLimits: { engCoder: ${cur("engCoder")}, other: ${cur("other")}, advisor: ${cur("advisor")} }（async 分域上限——默认 4/4/4——agent.poolLimits 可配）`, C.dim)
      pushLine(`agent.consultTurns: ${ac.consultTurns ?? 40}`, C.dim)
      pushLine(`agent.consultTimeoutMs: ${Math.round((ac.consultTimeoutMs ?? 600000) / 60000)} min`, C.dim)
      pushLine(`embedding: ${agent.memory?.embedder ? `enabled (${ec.model ?? ""})` : "disabled (FTS only)"}`, C.dim)
      pushLine(`proxy: ${proxySummary()}`, C.dim)
      pushLine(`Config file: ${configPath}`, C.dim)
      continue // 回主菜单（Esc 退出）
    }

    if (choice.action === "proxy") {
      await proxyMenu()
      continue
    }

    if (choice.action === "consult") {
      await consultMenu()
      continue
    }

    if (choice.action === "pool") {
      await poolMenu()
      continue
    }

    if (choice.action === "defaultModel") {
      await defaultModelMenu()
      continue
    }

    if (choice.action === "embedkey") {
      await setEmbedKey() // 保存成功/取消都回主菜单（Esc 退出）
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
      } catch (error) { pushLine(`Save failed: ${error.message}`, C.error) }
      continue // 回主菜单（Esc 退出）
    }

    if (choice.action === "traces.enabled") {
      const newVal = tc.enabled === false // 显式写布尔（默认 off——DEFAULTS 合并后必有值）
      try {
        await saveProxy((raw) => {
          raw.traces = { ...(raw.traces ?? {}), enabled: newVal }
        })
        pushLabel("❯ Config", ansi.bold + C.tool)
        pushLine(`traces.enabled = ${newVal ? "on" : "off"}${newVal ? "（轨迹落盘 ~/.thincoder/traces/——保留 " + (tc.retentionHours ?? 24) + "h）" : ""}`, C.tool)
      } catch (error) { pushLine(`Save failed: ${error.message}`, C.error) }
      continue // 回主菜单（Esc 退出）
    }

    // Embedding model is fixed (BAAI/bge-m3, SiliconFlow) — no picker; it's over-engineering
    // to expose model choice when the vector index format assumes one embedding space.

    // Numeric config items
    const label = choice.action
    const isTimeout = label === "agent.consultTimeoutMs"
    const current = label === "agent.maxTurns" ? (ac.maxTurns ?? 200)
      : label === "agent.subagentTurns" ? (ac.subagentTurns ?? 100)
      : label === "agent.compactThreshold" ? (ac.compactThreshold ?? 100000)
      : label === "agent.consultTurns" ? (ac.consultTurns ?? 40)
      : label === "traces.retentionHours" ? (tc.retentionHours ?? 24)
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
    } catch (error) { pushLine(`Save failed: ${error.message}`, C.error) }
    // 回主菜单（Esc 退出）——数值输入 Enter 空值也已 continue 于此
  }
}
