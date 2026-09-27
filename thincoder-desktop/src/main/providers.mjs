/**
 * providers.mjs — provider 族四通道：`provider:list` / `provider:save` / `provider:remove` /
 * `provider:verify`（批档 §2.4 契约）。
 *
 * 纪律（§2.3 写面条款）：配置读写**只**经核 `config-io.mjs`（`resolveProviders` 读 /
 * `addProviderEntry`·`removeProviderEntry` 变更子 / `writeConfigAtomic` 唯一写盘执行体）；
 * 端侧**零自写盘**。预设展开（`presetToEntry`）住核——端侧只传预设**名**。
 * 密钥纪律（§2.3）：`provider:list` **只回遮罩后值**（端侧遮罩单点 = `settings.mjs` `maskKey`；
 * 判据 = 核导出 `isSensitiveKey`），明文 key 零下发。
 * 批 B 增：逐行 `effort` = 渠道条目**档位现值投影**（离线——零探针；判据单源 = 核 `thinkOffShape`，
 * 沿 `docs/desktop/design/IPC.md` §2「档位控件注」）。
 */
import { PROVIDER_PRESETS, loadConfig, parseModelRef } from "@thincoder/core/config.mjs"
import {
  _configPath, addProviderEntry, removeProviderEntry, resolveProviders, writeConfigAtomic,
} from "@thincoder/core/config-io.mjs"
import { specForModel } from "@thincoder/core/model-specs.mjs"
import { thinkOffShape } from "@thincoder/core/think-off.mjs"
import { admissionOf, classifyProbeFailure, probeChannelModels } from "@thincoder/core/provider/list-models.mjs"
import { deepEqual, maskKey } from "./settings.mjs"

/** 形表（端侧形判）：两形 = 预设形 / 自定形；自定形协议域 = 核三协议。 */
const SHAPES = ["preset", "custom"]
const FORMATS = ["openai", "anthropic", "google"]

/** 条目是否持密钥（空串 = 无——核 `apiKey` 缺省空串）。 */
function hasKeyOf(entry) {
  return typeof entry?.apiKey === "string" && entry.apiKey.length > 0
}

/**
 * 预设候选面（端侧零表 · KD-10）：逐条取自核表 `PROVIDER_PRESETS`（`thincoder-core/config-presets.mjs:16`）
 * ——只转发三字段 `{ name, baseURL, model }`（展示名 `desc` **不转发**：词面归视图批 `t()` / 档面自持）。
 */
function presetChoices() {
  return Object.entries(PROVIDER_PRESETS).map(([name, preset]) => ({
    name,
    baseURL: preset.baseURL,
    model: preset.model,
  }))
}

/**
 * 渠道条目**档位现值投影**（离线——零探针；`docs/desktop/design/IPC.md` §2「档位控件注」现值条）：
 * `reasoningEffort` 为串 ⇒ 该串（`"none"` ⇒ `"off"`——其语义由 `"off"` 承载）；否则 `thinking`
 * 键在场且值 deep-equal `thinkOffShape(spec)` ⇒ `"off"`；否则 ⇒ `"auto"`。
 * 表外现值（含空串）**照字面出**（不吞 · 零改写——自成一选项归视图面）；判据与写面同源 = 核
 * `thinkOffShape` 与端侧 `deepEqual`（零族别副本）。`model` = spec 绑定模型（活动行 = `defaultModel`
 * 模型段——写面同源，保「写后投影恒等」；余行 = 条目自身 `model`；缺 ⇒ 核默认规格）。
 */
export function effortOf(entry, model) {
  const re = entry?.reasoningEffort
  if (typeof re === "string") return re === "none" ? "off" : re
  if (entry && "thinking" in entry && deepEqual(entry.thinking, thinkOffShape(specForModel(model)))) return "off"
  return "auto"
}

/**
 * `provider:list` ⇒ `{ ok, presets:[{ name, baseURL, model }], providers:[{ name, shape, baseURL, model?, hasKey, maskedKey, active, effort }], active }`。
 * `presets` = 核预设表投影（21 条 · 序 = 核表声明序——供设置面渠道段与首启向导第一步选预设，
 * 消费面无第二份表）；`shape` = 名在核预设表 ⇒ `preset`，否则 `custom`；
 * `active` 单源 = 核 `resolveProviders().activeProvider`
 * （= `defaultModel` 的 provider 段 ⇒ 命中行同时 `provider.active` 与顶层 `active` 双读一致）。
 * 畸形档不吞：核 `loadRaw` 抛 ⇒ 本档零 catch ⇒ invoke 拒绝直传。
 */
export function providerList() {
  const { providers, activeProvider } = resolveProviders()
  // spec 绑定模型：`defaultModel` 复合串（核 `parseModelRef` 单源解析）——活动行取模型段，余行取自身 `model`。
  const ref = parseModelRef(loadConfig()?.defaultModel ?? null, providers)
  return {
    ok: true,
    presets: presetChoices(),
    active: activeProvider ?? null,
    providers: providers.map((p) => {
      const hasKey = hasKeyOf(p)
      return {
        name: p.name,
        shape: PROVIDER_PRESETS[p.name] ? "preset" : "custom",
        baseURL: p.baseURL ?? "",
        ...(typeof p.model === "string" && p.model ? { model: p.model } : {}),
        hasKey,
        maskedKey: hasKey ? maskKey(`providers.${p.name}.apiKey`, p.apiKey) : null,
        active: p.name === activeProvider,
        effort: effortOf(p, ref.ok && ref.provider.name === p.name ? ref.model : p.model),
      }
    }),
  }
}

/**
 * `provider:save(payload)` ⇒ `{ ok:true, reason:null }` ∥ `{ ok:false, reason }`。
 * 载荷 `{ name, shape:"preset"|"custom", preset?, baseURL?, model?, key?, format?, active? }`；
 * `reason` = 核 `addProviderEntry` 错误串**直传**（预设名不存在 / 重名 / 激活渠道保护…）∥ 端侧形判
 * `invalid-shape`（形不在两形 / custom 缺 `baseURL`·`model` / `format` 出三协议）。
 * `active:true` ⇒ 同批追加写 `defaultModel = "<name>:<model>"`（核无「置激活」子 ⇒ 端侧经唯一写盘执行体
 * 落该键；模型缺失 ⇒ `invalid-shape`，零激活改写）。
 * 校验失败**零写盘**（核变更子内部生效前不落盘）。
 */
export function providerSave(payload) {
  const name = String(payload?.name ?? "").trim()
  const shape = payload?.shape
  if (!name || !SHAPES.includes(shape)) return { ok: false, reason: "invalid-shape" }
  const key = typeof payload?.key === "string" && payload.key ? payload.key : undefined
  let err
  if (shape === "preset") {
    err = addProviderEntry({ preset: name, key })
  } else {
    const baseURL = String(payload?.baseURL ?? "").trim()
    const model = String(payload?.model ?? "").trim()
    const format = payload?.format ?? "openai"
    if (!baseURL || !model || !FORMATS.includes(format)) return { ok: false, reason: "invalid-shape" }
    err = addProviderEntry({ custom: { name, baseURL, model, format }, key })
  }
  if (err) return { ok: false, reason: err }
  if (payload?.active === true) {
    const entry = resolveProviders().providers.find((p) => p.name === name)
    const model = typeof entry?.model === "string" ? entry.model : ""
    if (!model) return { ok: false, reason: "invalid-shape" }
    const w = writeConfigAtomic(_configPath(), (disk) => { disk.defaultModel = `${name}:${model}` })
    if (!w.ok) return { ok: false, reason: w.reason }
  }
  return { ok: true, reason: null }
}

/** `provider:remove(payload)` ⇒ `{ ok:true, reason:null }` ∥ `{ ok:false, reason }`（核错误串直传——
 *  激活渠道保护文案由核 `config-io.mjs:270` 出）。条目撤除即在同一对象内带走其 `apiKey`（密钥随条目落删）。 */
export function providerRemove(payload) {
  const name = String(payload?.name ?? "").trim()
  if (!name) return { ok: false, reason: "invalid-shape" }
  const err = removeProviderEntry(name)
  return err ? { ok: false, reason: err } : { ok: true, reason: null }
}

/**
 * `provider:verify(payload)` ⇒ `{ ok:true, models }` ∥ `{ ok:false, reason }`——`reason` 闭集
 * `timeout` / `malformed` / `unavailable`。
 * 真探一次 = 核 `probeChannelModels(name, provider)`（`list-models.mjs:152`，**绝不抛**；已自带超时
 * 预算）；分档读核落账 `admissionOf(name).failure`（核在 `probeChannelModels` 内已按
 * `classifyProbeFailure` 落账——端侧零再分类副本；测试缝注入的探针未落账时回落同函数现算）。
 * `unavailable` = 渠道不存在（核无此面——端侧判定）。**探不通仍可保存**（本通道只回报，不拦写）。
 */
export async function providerVerify(payload) {
  const name = String(payload?.name ?? "").trim()
  const provider = resolveProviders().providers.find((p) => p.name === name)
  if (!provider) return { ok: false, reason: "unavailable" }
  const probe = await probeChannelModels(name, provider)
  if (probe.ok) return { ok: true, models: probe.models ?? [] }
  const failure = admissionOf(name)?.failure ?? classifyProbeFailure({ message: probe.error })
  return { ok: false, reason: failure === "timeout" ? "timeout" : "malformed" }
}
