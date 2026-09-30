/**
 * provider-admin.mjs — 渠道管理四流 + 级联清理出档（structure-split-2 · 2026-09-29）：自
 * `model-picker.mjs` 迁出〔原 `:309-471`（probeChannelFlow ∥ addProviderFlow ∥ removeProviderFlow ∥
 * setKeyFlow ∥ setProviderKey ∥ setContextFlow）+ `:476-499`（cascadeRemoveProvider）〕——
 * 结构拆分零语义（面不变 ∕ 判据不变，只换宿主档）；切点 ∕ 缝单源 = 批档
 * `docs/batches/2026-09-29-structure-split-2.md` §2.2-A。
 *
 * 装配 = `createProviderAdmin(ctx)`（ctx = `{ agent, showPicker, askQuestion, pushLine, persistRaw,
 * maskKey, confirmDelete, C, fmtContextK, defaultModelLabel }`——后两名 = 主档纯 helper，ctx 注入
 * 同 `maskKey` 先例）→ `{ addProviderFlow, removeProviderFlow, setKeyFlow, setProviderKey,
 * setContextFlow }`；`cascadeRemoveProvider` 模块级导出（宿主 `model-picker.mjs` 尾同名再出口——
 * 历史导出面零改）。零环：本档不 import 主档（宿主 → 本档单向）。
 * 语义（迁出原文照录）：四流 = provider 级 config 写——M9 配置阶段准入探一次 `/models`（不阻断保存）
 * ∥ F-4 (IKCDMR)：removeProviderFlow 级联清理悬挂引用（consultModels ∕ subagentModels ∕ advisor.provider）。
 */
import { PROVIDER_PRESETS as PRESETS, providerSpec } from "@thincoder/core/config.mjs"
import { probeChannelModels } from "./model-catalog.mjs"

/** createProviderAdmin(ctx) → { addProviderFlow, removeProviderFlow, setKeyFlow, setProviderKey, setContextFlow } */
export function createProviderAdmin(ctx) {
  const { agent, showPicker, askQuestion, pushLine, persistRaw, maskKey, confirmDelete, C, fmtContextK, defaultModelLabel } = ctx

  // ═══ 渠道管理流（provider 级 config 写——语义不变——与 /model 会话选择分离）═══

  /** M9 配置阶段准入探：探通 → 清标记；探不通 → 会话内存标「不可用」+ 明示原因（绝不落 config；
   *  不阻断保存——条目已保存，仅标注）。 */
  async function probeChannelFlow(cfg, label) {
    const r = await probeChannelModels(cfg)
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
        .map(([name, p]) => ({ type: "item", text: `${name.padEnd(10)} ${p.desc ?? ""} (${p.model ?? ""})`, name, kind: "preset" })),
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
      const model = await askQuestion("Enter model name:")
      if (!model) return
      const format = await showPicker("API format", [
        { type: "item", text: "openai", name: "openai" },
        { type: "item", text: "anthropic", name: "anthropic" },
        { type: "item", text: "google", name: "google" },
      ])
      if (!format) return // Esc/取消 → 中止流程
      const cfg = { name, baseURL, model }
      if (format.name === "anthropic" || format.name === "google") cfg.format = format.name
      else if (format.name !== "openai") return // 防御：未知格式（理论不可达——picker 枚举）
      await persistRaw((raw) => { raw.providers ??= []; raw.providers.push(cfg) }) // D-F5a 先盘后存
      agent.providers.push(cfg)
      const key = await askQuestion(`Enter API key for ${name} (skip if none):`)
      if (key) await setProviderKey(name, key, { probe: false }) // 探统一在流尾（M9——精确一次）
      await probeChannelFlow(cfg, name) // M9 准入探（加渠道配置写入面；保存已落——不阻断）
      return
    }
    const preset = PRESETS[se.name]
    if (!preset || agent.providers.some((p) => p.name === se.name)) return
    const cfg = { name: se.name, baseURL: preset.baseURL, model: preset.model }
    if (preset.thinking) cfg.thinking = preset.thinking
    if (preset.reasoningEffort) cfg.reasoningEffort = preset.reasoningEffort
    if (preset.maxTokens) cfg.maxTokens = preset.maxTokens
    if (preset.chatPath) cfg.chatPath = preset.chatPath
    if (preset.format) cfg.format = preset.format
    await persistRaw((raw) => { raw.providers ??= []; raw.providers.push(cfg) }) // D-F5a 先盘后存
    agent.providers.push(cfg)
    const key = await askQuestion(`Enter API key for ${se.name} (skip if none):`)
    if (key) await setProviderKey(se.name, key, { probe: false }) // 探统一在流尾（M9——精确一次）
    await probeChannelFlow(cfg, se.name) // M9 准入探（加渠道配置写入面；保存已落——不阻断）
  }

  async function removeProviderFlow() {
    const candidates = agent.providers.filter((p) => p.name !== agent.activeProvider)
    if (!candidates.length) return
    const se = await showPicker("Remove Provider", [
      { type: "header", text: "Select provider to remove" },
      ...candidates.map((p) => ({ type: "item", text: `${p.name} (${defaultModelLabel(p)})`, name: p.name })),
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
      ...agent.providers.map((p) => ({ type: "item", text: `${p.name} ${p.apiKey ? `(has key: ${maskKey(p.apiKey)})` : "(no key)"}`, name: p.name })),
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

  /** /model provider 管理：context 窗口字段（K 单位）——picker 选 provider + 表单输入。 */
  async function setContextFlow() {
    const se = await showPicker("Set Context Window", [
      { type: "header", text: "Select provider" },
      ...agent.providers.map((p) => ({
        type: "item",
        text: `${p.name} (ctx ${fmtContextK(providerSpec(p).context)})`,
        name: p.name,
      })),
    ])
    if (!se?.name) return // Esc
    const target = agent.providers.find((p) => p.name === se.name)
    if (!target) return
    const current = Number.isInteger(target.context) && target.context > 0 ? target.context : null
    const val = (await askQuestion(
      `Context window for ${se.name} in K units (current: ${current ? `${current}K` : "spec default"} — e.g. 128 = 128K; empty to clear):`
    ))?.trim() ?? ""
    let newCtx // undefined = 清空（回 spec 值）
    if (val !== "") {
      const n = Number(val)
      if (!Number.isInteger(n) || n <= 0) {
        pushLine(`Invalid context: "${val}" — must be a positive integer in K units (e.g. 128 = 128K)`, C.error)
        return
      }
      newCtx = n
    }
    await persistRaw((raw) => {
      raw.providers ??= []
      const t = raw.providers.find((p) => p?.name === se.name)
      if (!t) return
      if (newCtx === undefined) delete t.context
      else t.context = newCtx
    })
    if (newCtx === undefined) delete target.context
    else target.context = newCtx
    if (se.name === agent.activeProvider) {
      if (newCtx === undefined) delete agent.provider.context
      else agent.provider.context = newCtx
      if (agent.config?.agent?.compactThresholdAuto) {
        const { resolveCompactThreshold } = await import("@thincoder/core/config.mjs")
        agent.config.agent.compactThreshold = resolveCompactThreshold(null, agent.provider).value
      }
    }
    pushLine(target.context !== undefined
      ? `ctx = ${target.context}K (${target.context * 1024} tokens)`
      : `context cleared — using model spec (${fmtContextK(providerSpec(target).context)})`, C.tool)
  }

  return { addProviderFlow, removeProviderFlow, setKeyFlow, setProviderKey, setContextFlow }
}

/** F-4 (IKCDMR) 级联清理（删渠道共享写点）：raw/merged config 移除 name 渠道后清悬挂引用——
 *  agent.consultModels 条目 / agent.subagentModels 角色值（=== name 或 "name:…" 前缀——
 *  角色值是 "provider:model" | 裸渠道名 | 裸模型名）/ agent.advisor.provider。
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
