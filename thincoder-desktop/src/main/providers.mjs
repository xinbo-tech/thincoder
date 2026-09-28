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
 * 沿 `docs/desktop/design/IPC.md` §2「档位控件注」现值条）。
 * R8 增（「桌面处理流 · VSC 对齐」批 —— provider 流程族上提）：**判据面**单源 = 核
 * `thincoder-core/provider-flows.mjs`（上提源 = VSC `provider-flows.mjs`，纯搬 + 转口）——本档消费
 * `customFieldsError`（自定形必填步序 + 协议域三值）与 `probeAdmission`（探针 + 失败分档「读账优先」），
 * 端侧零判据副本；本档 = **四通道壳**（载荷形判 ∕ 端侧拒码词法 / 激活写 / 回执形）——**reason 词法零改**
 * （R8 裁定①：核流英文串逐字入双语 UI 会造新端差 ⇒ 端码直传沿旧）。
 * R7 增：`TestProxy` 出口（`settings:env` 的 `{ testProxy }` 支转口 —— 复用核 `proxyFetch` 探针面，
 * **零第二探针**；判据 ∕ 分档 ∕ 超时沿 VSC `testProxyConnection` 同形）。
 */
import { PROVIDER_PRESETS, loadConfig, parseModelRef } from "@thincoder/core/config.mjs"
import {
  _configPath, addProviderEntry, removeProviderEntry, resolveProviders, writeConfigAtomic,
} from "@thincoder/core/config-io.mjs"
import { customFieldsError, probeAdmission } from "@thincoder/core/provider-flows.mjs"
import { proxyFetch } from "@thincoder/core/proxy.mjs"
import { specForModel } from "@thincoder/core/model-specs.mjs"
import { thinkOffShape } from "@thincoder/core/think-off.mjs"
import { deepEqual, maskKey } from "./settings.mjs"

/** 形表（端侧形判）：两形 = 预设形 / 自定形；自定形协议域 = 核 `FORMATS`（三协议单源 —— R8 起经
 *  `customFieldsError` 消费，本档不再自持值域副本）。 */
const SHAPES = ["preset", "custom"]

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
 * `invalid-shape`（形不在两形 / custom 缺 `baseURL`·`model` / `format` 出三协议——**步序判据单源** = 核流程族
 * `customFieldsError`，端码照旧）。
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
    // 自定形必填步序（baseURL → model → format）+ 协议域 = 核流程族判据（R8）——端侧零副本、拒码照旧。
    if (customFieldsError({ baseURL, model, format }) !== null) return { ok: false, reason: "invalid-shape" }
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
 * 真探一次 + 失败分档 = 核流程族 `probeAdmission(name, provider)`（R8 —— **绝不抛**、分档「读账优先 ∕
 * 未落账回落现算」住核，端侧零再分类副本）；reason 映射 `timeout` ⇒ `"timeout"`、其余（含 `hostBusy`）⇒
 * `"malformed"`（端侧闭集，零改）。`unavailable` = 渠道不存在（核无此面——端侧判定）。探不通**仍可保存**
 * （本通道只回报，不拦写）。
 */
export async function providerVerify(payload) {
  const name = String(payload?.name ?? "").trim()
  const provider = resolveProviders().providers.find((p) => p.name === name)
  if (!provider) return { ok: false, reason: "unavailable" }
  const probe = await probeAdmission(name, provider)
  if (probe.ok) return { ok: true, models: probe.models }
  return { ok: false, reason: probe.failure === "timeout" ? "timeout" : "malformed" }
}

/** 代理探针目标（VSC `testProxyConnection` 同址——`thincoder-vscode/src/extension/settings.mjs:291`）。 */
const PROXY_TEST_URL = "https://www.gstatic.com/generate_204"

/**
 * `TestProxy`（`settings:env` 的 `{ testProxy: { uri } }` 支转口 —— R7）⇒ `{ ok:true, status }` ∥
 * `{ ok:false, status }`（连通但非 2xx）∥ `{ ok:false, error }`（形态非法 ∕ 连接失败 ∕ 超时）。
 * 探针面 = 核 `proxyFetch`（**零第二 HTTP 客户端** —— 全端同一条代理链）；空 uri = 直连（VSC 同判据）。
 * 形态前置校验（同 VSC：非法 URI 不探、给可读句）；5s 超时（同 VSC）——超时径 `abort()` 中止底层请求
 * （核 `proxyFetch` 支持 `opts.signal`：`thincoder-core/proxy.mjs:191-200`；关 socket，不留后台在飞）。
 */
export async function testProxy(payload) {
  const uri = typeof payload?.uri === "string" ? payload.uri.trim() : ""
  if (uri) {
    let parsed
    try { parsed = new URL(uri) } catch { return { ok: false, error: `Invalid proxy URI: "${uri}" — expected http://host:port` } }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, error: `Unsupported proxy protocol: "${parsed.protocol}" — use http:// or https://` }
    }
  }
  let timer = null
  const controller = new AbortController()
  try {
    const res = await Promise.race([
      proxyFetch(PROXY_TEST_URL, { headers: { "User-Agent": "ThinCoder" }, signal: controller.signal }, uri || null),
      new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error("timeout after 5s")) }, 5000)
      }),
    ])
    return res.ok ? { ok: true, status: res.status } : { ok: false, status: res.status }
  } catch (e) {
    return { ok: false, error: e?.message ?? String(e) }
  } finally {
    if (timer !== null) clearTimeout(timer)
  }
}
