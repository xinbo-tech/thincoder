/**
 * provider-admin.mjs — 渠道管理流 + 级联清理出档（structure-split-2 · 2026-09-29）：自
 * `model-picker.mjs` 迁出〔probeChannelFlow ∥ addProviderFlow ∥ removeProviderFlow ∥
 * setKeyFlow ∥ setProviderKey ∥ setModelContextFlow + cascadeRemoveProvider〕——
 * 结构拆分零语义（面不变 ∕ 判据不变，只换宿主档）；切点 ∕ 缝单源 = 批档
 * `docs/batches/2026-09-29-structure-split-2.md` §2.2-A。
 *
 * 装配 = `createProviderAdmin(ctx)`（ctx = `{ agent, showPicker, askQuestion, pushLine, persistRaw,
 * maskKey, confirmDelete, C }`）→ `{ addProviderFlow, removeProviderFlow, setKeyFlow, setProviderKey,
 * setModelContextFlow }`；`cascadeRemoveProvider` 模块级导出（宿主 `model-picker.mjs` 尾同名再出口——
 * 历史导出面零改）。零环：本档不 import 主档（宿主 → 本档单向）。
 * 语义（迁出原文照录）：渠道管理流 = provider 级 config 写——M9 配置阶段准入探一次 `/models`（不阻断保存）
 * ∥ F-4 (IKCDMR)：removeProviderFlow 级联清理悬挂引用（consultModels ∕ subagentModels ∕ advisor.provider）。
 * 2026-10-07 三端对齐批（#1027）：添加流两支 +走 proxy 问句（写同一键 `providers[].proxy`）；
 * 三端探针目标构造收敛核 `probeTargetOf`（③′）。
 * 2026-10-23（`PROVIDER.md` §6.15 写面 · R31）：旧键 `providers[].context`（K）的编辑流退役
 * （本端不再写旧键）；同批替代 = `setModelContextFlow`——按模型写 `providers[].modelContext`，
 * 单位仍是 K（输入 ∥ 存储 ∥ 提示 ∥ 回显四处同口径；端侧零 ×1024——唯一乘点在核）。
 */
import { PROVIDER_PRESETS as PRESETS, resolveCompactThreshold } from "@thincoder/core/config.mjs"
import { hasKey } from "@thincoder/core/model-ref.mjs"
import { normalizeModelKey, positiveInt } from "@thincoder/core/model-context.mjs"
import { formatDeclaredContextK } from "@thincoder/core/model-specs.mjs"
import { loadRaw } from "@thincoder/core/config-io.mjs"
import { probeTargetOf } from "@thincoder/core/provider-flows.mjs"
import { probeChannelModels, getProviderModels, modelListFailureText } from "./model-catalog.mjs"

/** 派生条目隐藏判据（TEAM.md §2.4 ∥ PROVIDER.md §6.25）：`derived === true` ∧ 无 key ⇒ 列表/候选面
 *  隐藏（四消费面各一处过滤——CLI 模型候选 ∥ CLI provider-admin ∥ VSC ∥ 桌面）；登录态（有 key）在场。
 *  「持 key」判据单源 = 核 `model-ref.mjs` `hasKey`（PROVIDER.md §6.22——trim 非空）。 */
export function isDerivedProviderHidden(provider) {
  return provider?.derived === true && !hasKey(provider)
}

/** createProviderAdmin(ctx) → { addProviderFlow, removeProviderFlow, setKeyFlow, setProviderKey, setModelContextFlow } */
export function createProviderAdmin(ctx) {
  const { agent, showPicker, askQuestion, pushLine, persistRaw, maskKey, confirmDelete, C } = ctx

  // ═══ 渠道管理流（provider 级 config 写——语义不变——与 /model 会话选择分离）═══

  /** M9 配置阶段准入探：探通 → 清标记；探不通 → 会话内存标「不可用」+ 明示原因（绝不落 config；
   *  不阻断保存——条目已保存，仅标注）。 */
  async function probeChannelFlow(cfg, label) {
    const r = await probeChannelModels(probeTargetOf(cfg)) // 探针目标构造收敛核判据（③′——三端同判定；执行体零改）
    if (r.ok) {
      delete cfg._unavailable
      pushLine(`${label}: /models 可用（${r.list.length} 个模型可候选）`, C.tool)
    } else {
      cfg._unavailable = true
      pushLine(`${label} 不可用 — ${r.message}`, C.error)
    }
    return r
  }

  async function addProviderFlow() {
    const entries = [
      { type: "header", text: "Select a preset provider" },
      ...Object.entries(PRESETS).filter(([name]) => !agent.providers.some((p) => p.name === name))
        .map(([name, p]) => ({ type: "item", text: `${name.padEnd(10)} ${p.desc ?? ""}`, name, kind: "preset" })),
      { type: "header", text: "Other" },
      { type: "item", text: "Custom (manual config)", name: "__custom__", kind: "custom" },
    ]
    const se = await showPicker("Add Provider", entries)
    if (!se) return // Esc → 返回上级（openModelPicker 循环会重开主菜单）
    if (se.kind === "custom") {
      const name = await askQuestion("Enter provider name:")
      if (!name) return
      if (agent.providers.some((p) => p.name === name)) return
      const baseURL = (await askQuestion("Enter baseURL:")).replace(/\/+$/, "")
      if (!baseURL) return
      const format = await showPicker("API format", [
        { type: "item", text: "openai", name: "openai" },
        { type: "item", text: "anthropic", name: "anthropic" },
        { type: "item", text: "google", name: "google" },
      ])
      if (!format) return // Esc/取消 → 中止流程
      const cfg = { name, baseURL } // 2026-10-09 清除批：渠道条目不携 `model`（表单不设 model 输入件）
      if (format.name === "anthropic" || format.name === "google") cfg.format = format.name
      else if (format.name !== "openai") return // 防御：未知格式（理论不可达——picker 枚举）
      await persistRaw((raw) => { raw.providers ??= []; raw.providers.push(cfg) }) // D-F5a 先盘后存
      agent.providers.push(cfg)
      const key = await askQuestion(`Enter API key for ${name} (skip if none):`)
      if (key) await setProviderKey(name, key, { probe: false }) // 探统一在流尾（M9——精确一次）
      // #1027 走 proxy 问句（key 后、流尾探针前——写同一键 providers[].proxy；No/Esc ⇒ 零键零写）
      const route = await showPicker("Route this provider's model requests through the proxy", [
        { type: "item", text: "No (direct)", name: "no" },
        { type: "item", text: "Yes (proxy)", name: "yes" },
      ])
      if (route?.name === "yes") {
        await persistRaw((raw) => { // D-F5a 先盘后存（代理单键补丁——不取内存 providers 整数组）
          raw.providers ??= []
          const t = raw.providers.find((p) => p?.name === name)
          if (t) t.proxy = true
        })
        cfg.proxy = true // 会话内存镜像（cfg = agent.providers 内同一对象）
      }
      await probeChannelFlow(cfg, name) // M9 准入探（加渠道配置写入面；保存已落——不阻断）
      return
    }
    const preset = PRESETS[se.name]
    if (!preset || agent.providers.some((p) => p.name === se.name)) return
    const cfg = { name: se.name, baseURL: preset.baseURL } // 2026-10-09 清除批：渠道条目不携 `model`（零播种）
    if (preset.thinking) cfg.thinking = preset.thinking
    if (preset.reasoningEffort) cfg.reasoningEffort = preset.reasoningEffort
    if (preset.maxTokens) cfg.maxTokens = preset.maxTokens
    if (preset.chatPath) cfg.chatPath = preset.chatPath
    if (preset.format) cfg.format = preset.format
    await persistRaw((raw) => { raw.providers ??= []; raw.providers.push(cfg) }) // D-F5a 先盘后存
    agent.providers.push(cfg)
    const key = await askQuestion(`Enter API key for ${se.name} (skip if none):`)
    if (key) await setProviderKey(se.name, key, { probe: false }) // 探统一在流尾（M9——精确一次）
    // #1027 走 proxy 问句（key 后、流尾探针前——写同一键 providers[].proxy；No/Esc ⇒ 零键零写）
    const route = await showPicker("Route this provider's model requests through the proxy", [
      { type: "item", text: "No (direct)", name: "no" },
      { type: "item", text: "Yes (proxy)", name: "yes" },
    ])
    if (route?.name === "yes") {
      await persistRaw((raw) => { // D-F5a 先盘后存（代理单键补丁——不取内存 providers 整数组）
        raw.providers ??= []
        const t = raw.providers.find((p) => p?.name === se.name)
        if (t) t.proxy = true
      })
      cfg.proxy = true // 会话内存镜像（cfg = agent.providers 内同一对象）
    }
    await probeChannelFlow(cfg, se.name) // M9 准入探（加渠道配置写入面；保存已落——不阻断）
  }

  async function removeProviderFlow() {
    const candidates = agent.providers.filter((p) => p.name !== agent.activeProvider && !isDerivedProviderHidden(p)) // 派生无 key ⇒ 隐藏（TEAM.md §2.4）
    if (!candidates.length) return
    const se = await showPicker("Remove Provider", [
      { type: "header", text: "Select provider to remove" },
      ...candidates.map((p) => ({ type: "item", text: `${p.name} (${p.baseURL})`, name: p.name })),
    ])
    if (!se) return
    if (!(await confirmDelete(`Remove provider ${se.name}?`))) return
    await persistRaw((raw) => {
      raw.providers ??= []
      const idx = raw.providers.findIndex((p) => p?.name === se.name)
      if (idx !== -1) raw.providers.splice(idx, 1)
      // F-4 级联（IKCDMR——AC-4）：同盘清 consultModels/subagentModels/advisor.provider 悬挂引用
      cascadeRemoveProvider(raw, se.name)
    })
    agent.providers.splice(agent.providers.findIndex((p) => p.name === se.name), 1)
    // 会话内存镜像同清（agent.config = loadConfig 产物——consult/escalate 同会话读
    // agent.config.agent.*；merged.advisor 为 agent.advisor 的提升拷贝——双处清理）
    if (agent.config) {
      cascadeRemoveProvider(agent.config, se.name)
      if (agent.config.advisor?.provider === se.name) delete agent.config.advisor.provider
    }
  }

  async function setKeyFlow() {
    const se = await showPicker("Configure API Key", [
      { type: "header", text: "Select provider" },
      ...agent.providers.filter((p) => !isDerivedProviderHidden(p)).map((p) => ({ type: "item", text: `${p.name} ${p.apiKey ? `(has key: ${maskKey(p.apiKey)})` : "(no key)"}`, name: p.name })),
    ])
    if (!se) return
    const key = await askQuestion(`Enter API key for ${se.name}:`)
    if (key) await setProviderKey(se.name, key)
  }

  /** 设 API key（可以来自渠道管理流 / 加渠道流内的 key 步）：写盘 + 内存镜像；
   *  M9：设 key 属配置写入面——默认探一次 `/models`（不阻断——key 已保存）；
   *  加渠道流内调用传 `{ probe: false }`（探由该流尾部统一执行——精确一次）。 */
  async function setProviderKey(name, key, { probe = true } = {}) {
    const target = agent.providers.find((p) => p.name === name)
    if (!target) return
    await persistRaw((raw) => {
      raw.providers ??= []
      const t = raw.providers.find((p) => p?.name === name)
      if (t) t.apiKey = key
    })
    target.apiKey = key
    if (name === agent.activeProvider) agent.provider.apiKey = key
    if (probe) await probeChannelFlow(target, name)
  }

  /** 写面第 2 步：候选 = 该渠道 `/v1/models` 的 id（`model-catalog.mjs` 会话缓存——与 `/model`
   *  选模型同源，零新增拉取面）。**该渠无候选 ∥ 探测失败 ⇒ 该步换文本输入模型 id**（不区分
   *  两者——都只能手填）；探测失败时另明示失败信息。可达时只从候选行选（不设手填行——避免两套
   *  输入面）。返回模型 id 或 null（取消）。 */
  async function pickContextModel(providerConfig) {
    let models = []
    let failure = null
    try {
      models = await getProviderModels(providerConfig)
    } catch (error) {
      failure = modelListFailureText(error)
    }
    if (models.length) {
      const me = await showPicker(`${providerConfig.name} models`, [
        { type: "header", text: "Select model" },
        ...[...new Set(models)].map((id) => ({ type: "item", text: id, name: id })),
      ])
      return me?.name || null
    }
    if (failure) pushLine(failure, C.error) // 探测失败：先明示失败信息（文案本体 = M8 长句）
    pushLine("No candidates (type the model ID)", C.warn) // 登记文案（`settings.providers.contextNoCandidates`）
    const typed = (await askQuestion(`Model id for ${providerConfig.name} (empty to cancel):`))?.trim() ?? ""
    return typed || null
  }

  /** /model 管理：模型上下文窗口编辑流（`PROVIDER.md` §6.15「写面：`modelContext` 编辑」——三端
   *  同形：选渠道 → 选模型 → 输 K 值 → 落盘 + 回显 K）。替代退役的旧键编辑流（R31①②：本端不再写
   *  `providers[].context`）。
   *
   *  **单位 = K**（128 = 128K）：输入 ∥ 存储 ∥ 提示 ∥ 回显四处同口径；本档**一次都不乘 1024**——
   *  唯一乘点在核 `model-specs.mjs` 的 L1∥L2 合流点（端侧自乘 = 下一次单位事故）。
   *  值校验 = 先 parse 再判：`Number(String(v).trim())` 后过核 `positiveInt`（交互输入是字符串，
   *  直接喂谓词会全量拒绝）。
   *  清除语义：空输入 = 清除该模型的键（归一相等的多条一并删除——R29⑤）；**有已声明值先过一道确认**（默认 Cancel）——CLI 自由文本态
   *  Esc 与空回车同返 `""`（`key-modes.mjs`），不确认就是拿取消手势当删除；无声明 ⇒ 空操作。
   *  键处理 = 末段尺子（核 `normalizeModelKey`）：归一后相等的既有键就改它（不新增第二种拼写），
   *  否则用模型 id 原样作键；命中多条（归一后相等 = 同一模型）⇒ 一并改写为同一新值（R29⑤）。
   *  **不预填任何非声明值**：提示里的 current 只取该模型的已声明 K——列表值 ∥ 静态表值都不进输入框
   *  （一次回车就会把参考值固化成人工声明）。
   *  读面回显 = 已声明值（R31④ / W-9 / W-11）：渠道行展示核出词串（逐条 `模型: <核出词>`，
   *  单条即 `<核出词>`，无声明 `Not declared`）——**不取 `providerSpec(p).context`**：渠道条目不携模型，
   *  该值只能落 L5 的 125K（把声明的 128 显示成 125K = 错读数，设计「读面回显」明令禁止）。 */
  async function setModelContextFlow() {
    const se = await showPicker("Set Context Window", [
      { type: "header", text: "Select provider" },
      ...agent.providers.filter((p) => !isDerivedProviderHidden(p)).map((p) => ({
        type: "item",
        text: `${p.name} (ctx ${declaredContextText(p)}) (declared: ${declaredContextOf(p).length || "none"})`,
        name: p.name,
      })),
    ])
    if (!se?.name) return // Esc
    const target = agent.providers.find((p) => p.name === se.name)
    if (!target) return

    const model = await pickContextModel(target)
    if (!model) return // Esc ∥ 空输入 ⇒ 中止（盘上零变）

    const matches = matchingContextKeys(target.modelContext, model)
    const declaredK = matches.length > 0 ? positiveInt(target.modelContext[matches[0]]) : null
    const current = declaredK !== null ? formatDeclaredContextK(declaredK) : "Not declared"
    const input = (await askQuestion(
      `Context window for ${se.name}:${model} in K (current: ${current} — e.g. 128 = 128K; empty to clear):`
    ))?.trim() ?? ""
    let nextK // undefined = 清除请求（下面按有无已声明值分流）
    if (input !== "") {
      const n = positiveInt(Number(input))
      if (n === null) {
        pushLine(`Invalid context: "${input}" — must be a positive integer in K (e.g. 128 = 128K)`, C.error)
        return // 盘上零变
      }
      nextK = n
    } else {
      // 清除判据 = 「键存在即算」（设计 §6.15「清除语义」）——**含值非法的条目**：装载归一会把
      // 非法值从内存镜像清掉（`config.mjs` 归一），盘面原文仍在 ⇒ 只看内存会让这类条目永远删不掉。
      // 盘面原文 = `loadRaw()`（只读；写仍走 persistRaw——D-F5a）。
      const clearKeys = diskDeclaredKeys(se.name, model) ?? matches
      if (clearKeys.length === 0) {
        // 无已声明值：空输入 = 空操作——不留假收据（`Context cleared` 在这里是句谎）
        pushLine(`Nothing to clear for ${model}`, C.text)
        return
      }
      // 有已声明值：删一个声明值 = 破坏动作——先确认，默认 Cancel（Esc 回到这里 ⇒ 盘上零变）。
      // 确认行带当前值：不带值用户不知道自己删的是多少（值非法 ⇒ current 段回 `Not declared`）。
      const confirmed = await confirmDelete(
        `Clear context for ${se.name}:${model} (currently ${current})?`
      )
      if (!confirmed) return // Cancel / Esc ⇒ 盘上零变
    }

    // D-F5a 先盘后存：磁盘 fresh raw 上单键补丁（不取内存 providers 整数组）；键仍在盘面重判一次
    // （对端的并发改写优先——盘面命中就沿盘面拼写；命中多条 = 同一模型的多种写法 ⇒ 一并改写 ∥ 一并删除，R29⑤）。
    let diskMissing = false
    let diskNothing = false
    let diskKeys = [] // 盘面命中的全部拼写（空 ⇒ 写面用模型 id 原样作新键）
    await persistRaw((raw) => {
      raw.providers ??= []
      const t = raw.providers.find((p) => p?.name === se.name)
      if (!t) { diskMissing = true; return }
      diskKeys = matchingContextKeys(t.modelContext, model)
      if (nextK === undefined) {
        // 清除：盘面已无该键（对端刚删）⇒ 不出假收据（下面回 Nothing to clear）
        if (diskKeys.length === 0) { diskNothing = true; return }
        for (const key of diskKeys) applyModelContext(t, key, undefined) // 删键；对象空 ⇒ 连 modelContext 一起删
        return
      }
      for (const key of (diskKeys.length ? diskKeys : [model])) applyModelContext(t, key, nextK)
    })
    if (diskMissing) {
      pushLine(`Provider "${se.name}" no longer exists in the config file — nothing saved`, C.error)
      return
    }
    if (diskNothing) {
      for (const key of matches) applyModelContext(target, key, undefined) // 内存镜像对齐盘面（不留 ghost）
      pushLine(`Nothing to clear for ${model}`, C.text)
      return
    }

    // 内存镜像就地改键（`agent.provider = { ...target }` 是浅拷贝——改同一对象 ∥ 指同一表，整替换会失配）；
    // 盘面拼写与内存不同时先清旧拼写——内存镜像与盘面一一对应，不留 ghost 键
    for (const key of matches) if (!diskKeys.includes(key)) applyModelContext(target, key, undefined)
    for (const key of (diskKeys.length ? diskKeys : [model])) applyModelContext(target, key, nextK)
    if (se.name === agent.activeProvider && agent.provider) {
      if (target.modelContext === undefined) delete agent.provider.modelContext
      else agent.provider.modelContext = target.modelContext
      // §6.17：窗口覆盖后 auto 派生线跟手——只刷新显示面 compactThresholdResolved，显式键永不被改写
      if (agent.config?.agent?.compactThresholdAuto) {
        agent.config.agent.compactThresholdResolved = resolveCompactThreshold(null, agent.provider).value
      }
    }
    // 回显串 = 核出词（`128K` / `1M`）——不同时给 token 数（两个数并排又把人绕回单位问题）
    pushLine(nextK === undefined
      ? `Context cleared for ${model}`
      : `Context saved: ${se.name}:${model} = ${formatDeclaredContextK(nextK)}`, C.tool)
  }

  return { addProviderFlow, removeProviderFlow, setKeyFlow, setProviderKey, setModelContextFlow }
}

/** 盘面原文里该模型的既有键（含值非法条目——装载归一把它们从内存镜像清掉了，盘面仍在）。
 *  读不出 ∥ 盘上无此渠道 ⇒ `null`（调用侧落回内存判据；写仍走 persistRaw）。 */
function diskDeclaredKeys(providerName, model) {
  try {
    const raw = loadRaw()
    const provider = Array.isArray(raw?.providers) ? raw.providers.find((p) => p?.name === providerName) : null
    if (!provider || typeof provider !== "object") return null
    return matchingContextKeys(provider.modelContext, model)
  } catch {
    return null // 畸形档：内存判据兜底（persistRaw 会以同一错误浮出）
  }
}

/** `modelContext` 键匹配（写面 `PROVIDER.md` §6.15「键形与查表规则」）：末段 + 小写归一后**相等**
 *  才是同一模型（核 `normalizeModelKey`——不是前缀：`glm-5.3` 不命中 `glm-5.3-flashx`）。
 *  返回全部命中的既有键（>1 = 同一模型的多种写法——写面一并改写 ∥ 清除一并删除，R29⑤）。 */
function matchingContextKeys(table, model) {
  if (!table || typeof table !== "object" || Array.isArray(table)) return []
  const target = normalizeModelKey(model)
  if (!target) return []
  return Object.keys(table).filter((key) => normalizeModelKey(key) === target)
}

/** 已声明条目（只认正整数 K——与 VSC ∥ 桌面行面的过滤同判；非法值装载期已被核剔除）。 */
function declaredContextOf(provider) {
  const table = provider?.modelContext
  if (!table || typeof table !== "object" || Array.isArray(table)) return []
  return Object.entries(table).filter(([, value]) => Number.isInteger(value) && value > 0)
}

/** 渠道行上下文回显串（读面 = 已声明值，R31④ / W-9 / W-9b / W-11，**两端共用**：写面渠道行 ∥ `/model`
 *  L1 渠道行）：逐条 `模型: <核出词>`；单条即 `<核出词>`；无声明 ⇒ `Not declared`。出词一律经核
 *  `formatDeclaredContextK`（K→token 展示换算只在核一处——声明 `1024` 出 `1M`，端侧拼串会出 `1024K`）。
 *  三端同串（VSC ∥ 桌面同形——` · ` 分隔）——**不取 `providerSpec`**（渠道条目无模型 ⇒ 只能落 L5 的
 *  125K，会把声明的 128 显示错）。 */
export function declaredContextText(provider) {
  const entries = declaredContextOf(provider)
  if (entries.length === 0) return "Not declared"
  return entries.length === 1
    ? formatDeclaredContextK(entries[0][1])
    : entries.map(([model, k]) => `${model}: ${formatDeclaredContextK(k)}`).join(" · ")
}

/** 内存 ∥ 磁盘共用的单键补丁：`k === undefined` ⇒ 删该键，对象空则连 `modelContext` 键一起删
 *  （不留空对象）；否则就地写该键（**就地**——`agent.provider = { ...target }` 是浅拷贝，
 *  整替换会让引用失配）。 */
function applyModelContext(provider, key, k) {
  if (!provider) return
  if (k === undefined) {
    const table = provider.modelContext
    if (!table || typeof table !== "object" || Array.isArray(table)) return
    delete table[key]
    if (Object.keys(table).length === 0) delete provider.modelContext
    return
  }
  if (!provider.modelContext || typeof provider.modelContext !== "object" || Array.isArray(provider.modelContext)) provider.modelContext = {}
  provider.modelContext[key] = k
}

/** F-4 (IKCDMR) 级联清理（删渠道共享写点）：raw/merged config 移除 name 渠道后清悬挂引用——
 *  agent.consultModels 条目 / agent.subagentModels 角色值（=== name 或 "name:…" 前缀——
 *  角色值是 "provider:model" | 裸渠道名（遗留值——清除批起解析层拒） | 裸模型名）/ agent.advisor.provider。
 *  纯 mutate（removeProviderFlow persistRaw 的 D-F5 新鲜 raw 上调用；agent.config 内存镜像
 *  子树与 raw.agent 同构可复用）。空数组/空对象键删除（规范形态）。 */
export function cascadeRemoveProvider(raw, name) {
  const a = raw?.agent
  if (!a || typeof a !== "object" || Array.isArray(a)) return
  if (Array.isArray(a.consultModels)) {
    const keep = a.consultModels.filter((m) => m?.provider !== name)
    if (keep.length) a.consultModels = keep
    else delete a.consultModels
  }
  if (a.subagentModels && typeof a.subagentModels === "object" && !Array.isArray(a.subagentModels)) {
    for (const role of Object.keys(a.subagentModels)) {
      const v = a.subagentModels[role]
      if (typeof v === "string" && (v === name || v.startsWith(`${name}:`))) delete a.subagentModels[role]
    }
    if (Object.keys(a.subagentModels).length === 0) delete a.subagentModels
  }
  if (a.advisor && typeof a.advisor === "object" && !Array.isArray(a.advisor) && a.advisor.provider === name) {
    delete a.advisor.provider
  }
}
