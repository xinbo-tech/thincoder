/**
 * providers.mjs — provider 族四通道：`provider:list` / `provider:save` / `provider:remove` /
 * `provider:verify`（批档 §2.4 契约）。
 *
 * 纪律（§2.3 写面条款）：配置读写**只**经核 `config-io.mjs`（`resolveProviders` 读 /
 * `addProviderEntry`·`removeProviderEntry` 变更子 / `writeConfigAtomic` 唯一写盘执行体）；
 * 端侧**零自写盘**。预设展开（`presetToEntry`）住核——端侧只传预设**名**。
 * 密钥纪律（§2.3）：`provider:list` **只回遮罩后值**（端侧遮罩单点 = `settings.mjs` `maskKey`；
 * 判据 = 核导出 `isSensitiveKey`），明文 key 零下发。
 * R8 增（「桌面处理流 · VSC 对齐」批 —— provider 流程族上提）：**判据面**单源 = 核
 * `thincoder-core/provider-flows.mjs`（上提源 = VSC `provider-flows.mjs`，纯搬 + 转口）——本档消费
 * `customFieldsError`（自定形必填步序 + 协议域三值）与 `probeAdmission`（探针 + 失败分档「读账优先」），
 * 端侧零判据副本；本档 = **四通道壳**（载荷形判 ∕ 端侧拒码词法 / 激活写 / 回执形）——**reason 词法零改**
 * （R8 裁定①：核流英文串逐字入双语 UI 会造新端差 ⇒ 端码直传沿旧）。
 * R7 增：`TestProxy` 出口（`settings:env` 的 `{ testProxy }` 支转口 —— 复用核 `proxyFetch` 探针面，
 * **零第二探针**；判据 ∕ 分档 ∕ 超时沿 VSC `testProxyConnection` 同形）。
 *
 * B10 W2 增四出口 + 行面三键（parity-b10-ui §2.6 S1 ∕ S2 ∕ S3 ∕ S5 ∕ S7）：S1 `provider:setKey` ∕ `delKey` ·
 * S5 `provider:setProxy`（`true` 写 ∕ `false` 删键，沿 VSC `handleSetProviderProxy`）· S2 `provider:models`
 * （暂存值不落盘 ∕ 不入账）· S3 写径后 fire-and-forget 探 + 行补 `proxy` ∕ `available?` ∕ `unavailableReason?` · S7 转发 `desc`。
 * **S3 分档增（#673 · 2026-09-29）**：行面增 `failure` 分档键（票面「消（补做——欠做，非能力缺失）」第三件——
 * 渲染面 `hostBusy` ⇒ 「宿主繁忙」+ 抑制失败句）；两探径失败支经 `loop-sampler.mjs` `overrideAdmissionIfHostBusy`
 * 以宿主证据覆盖落账分类（`reason` 逐字不动——核 `deps.hostBusyOverride` 缝同判）。
 * **三端对齐批（2026-10-07 · 台账 #1027–#1029 · KD-75 ④⑤）**：① `provider:save` 载荷 + `proxy`（勾选 ⇒ `true`）
 * ⇒ 核 `addProviderEntry` 同批落条（仅真值落键）；② `provider:models` 探针目标收敛为核 `probeTargetOf` 同判定
 * （逐渠判定组成式唯一式：条目 `proxy` ∧ 代理 `uri` 在案 ⇒ `proxy.uri`；未勾 ∥ 缺省 ⇒ 直连）——
 * 原全局 `proxy.web` 旗取用退场（web 旗活消费面唯一 = 核 `proxy.mjs` 的 web 工具链 —— `docs/core/design/PROXY.md` §4）。
 * **2026-10-09 清除批（台账 #1122）**：渠道单值模型退场 —— `provider:save` 的 `model` ∕ `active` 参与缺省补写支
 * 一并退场（`defaultModel` 写入面 = 视图出口 ∥ 会话选定写回）；`provider:list` 行去 `model` 键、顶层增
 * `defaultModel`（渲染面两读数「复合串直读」的载荷载体）；预设面投影去 `model`；自定形必填步 = baseURL → format。
 */
import { PROVIDER_PRESETS, loadConfig } from "@thincoder/core/config.mjs"
import {
  _configPath, addProviderEntry, removeProviderEntry, removeProviderKeyFromConfig,
  resolveProviders, setProviderKey, writeConfigAtomic,
} from "@thincoder/core/config-io.mjs"
import { customFieldsError, probeAdmission, probeTargetOf } from "@thincoder/core/provider-flows.mjs"
import { admissionOf, probeChannelModels } from "@thincoder/core/provider/list-models.mjs"
import { proxyFetch } from "@thincoder/core/proxy.mjs"
import { maskKey } from "./settings.mjs"
// provider 态投影（#841 —— `provider:save` 设置写回执携 `providerState`：三回执族载荷单源，零第二实现）。
import { providerStateOf } from "./session-slots.mjs"
// S3 宿主忙证据面（#673）：主进程事件循环采样器（port 源 = VSC `src/extension/loop-sampler.mjs`）。
import { overrideAdmissionIfHostBusy } from "./loop-sampler.mjs"

/** 形表（端侧形判）：两形 = 预设形 / 自定形；自定形协议域 = 核 `FORMATS`（三协议单源 —— R8 起经
 *  `customFieldsError` 消费，本档不再自持值域副本）。 */
const SHAPES = ["preset", "custom"]

/** 条目是否持密钥（空串 = 无——核 `apiKey` 缺省空串）。 */
function hasKeyOf(entry) {
  return typeof entry?.apiKey === "string" && entry.apiKey.length > 0
}

/**
 * 预设候选面（端侧零表 · KD-10）：逐条取自核表 `PROVIDER_PRESETS`（`thincoder-core/config-presets.mjs:16`）
 * ——转发三字段 `{ name, desc, baseURL }`（**S7 增 `desc`**：候选项标签 `name — desc` 串形归渲染面；
 * 值直取核表 ⇒ 端侧零表、零自持文案；`model` 键随 2026-10-09 清除批退场 —— 核表零该键）。
 */
function presetChoices() {
  return Object.entries(PROVIDER_PRESETS).map(([name, preset]) => ({
    name,
    desc: preset.desc,
    baseURL: preset.baseURL,
  }))
}

/**
 * `provider:list` ⇒ `{ ok, presets:[{ name, desc, baseURL }], providers:[{ name, shape, baseURL, hasKey, maskedKey, active, proxy, available?, unavailableReason? }], active, defaultModel }`。
 * **2026-10-09 清除批**：行去 `model` 键（渠道条目不携模型）；顶层增 `defaultModel`（核 `loadConfig` 单源
 * 直取 —— 渲染面「激活渠道 ∥ 当前模型」两读数由该复合串直读；缺 ∕ 非串 ⇒ `null`）。
 * `presets` = 核预设表投影（24 条 · 序 = 核表声明序——供设置面渠道段与首启向导第一步选预设，
 * 消费面无第二份表）；`shape` = 名在核预设表 ⇒ `preset`，否则 `custom`；
 * `active` 单源 = 核 `resolveProviders().activeProvider`
 * （= `defaultModel` 的 provider 段 ⇒ 命中行同时 `provider.active` 与顶层 `active` 双读一致）。
 * **S5 增**：逐行 `proxy` = 渠级代理位（布尔投影）；**S3 增**：逐行 `available` ∕ `unavailableReason` **读核落账**
 * （`admissionOf` —— 最近一次落账；**未落账 ⇒ 两键缺席** —— 禁假造；`unavailableReason` = 核失败句逐字）。
 * 畸形档不吞：核 `loadRaw` 抛 ⇒ 本档零 catch ⇒ invoke 拒绝直传。
 */
export function providerList() {
  const { providers, activeProvider } = resolveProviders()
  const defaultModel = loadConfig()?.defaultModel
  return {
    ok: true,
    presets: presetChoices(),
    active: activeProvider ?? null,
    // 2026-10-09 清除批：两读数载荷载体（复合串单源直取；缺 ∕ 非串 ⇒ null —— 禁假造）。
    defaultModel: typeof defaultModel === "string" && defaultModel !== "" ? defaultModel : null,
    providers: providers.map((p) => {
      const hasKey = hasKeyOf(p)
      const admission = admissionOf(p.name) // S3：读账优先（端侧零再分类副本）
      return {
        name: p.name,
        shape: PROVIDER_PRESETS[p.name] ? "preset" : "custom",
        baseURL: p.baseURL ?? "",
        hasKey,
        maskedKey: hasKey ? maskKey(`providers.${p.name}.apiKey`, p.apiKey) : null,
        active: p.name === activeProvider,
        proxy: p.proxy === true, // S5：渠级代理位投影
        ...(admission ? { available: admission.ok === true } : {}),
        ...(admission && admission.ok === false && typeof admission.reason === "string" && admission.reason !== ""
          ? { unavailableReason: admission.reason } : {}),
        // S3 分档键（#673）：失败**分档**（`hostBusy` ⇒ 展示面「宿主繁忙」+ 抑制失败句——渲染面判据）；
        // 未落账 ∕ 非串 ⇒ 键缺席——禁假造。
        ...(admission && admission.ok === false && typeof admission.failure === "string" && admission.failure !== ""
          ? { failure: admission.failure } : {}),
      }
    }),
  }
}

/**
 * 写径后准入探（S3 · M9 同律 —— 先例 = VSC `settings-panel-write.mjs:43-57`）：**fire-and-forget** —— 探针绝不
 * 抛出 ∕ 绝不阻断写；结果经核落账（`probeChannelModels` → `admissionOf`），供 `provider:list` 行面两键读数。
 * 三写径共用：加渠道 ∕ 改钥 ∕ defaultModel 写。渠已不在配置 ⇒ 零探；读档畸形 ⇒ 兜底吞。
 */
export function probeAfterWrite(name) {
  void (async () => {
    const provider = resolveProviders().providers.find((p) => p.name === name)
    if (!provider) return
    const probe = await probeAdmission(name, provider) // 探 + 失败分档 + 落账单源 = 核流程族（内部全捕获，绝不抛）
    // S3（#673）：宿主忙 = 端侧证据 ⇒ 覆盖落账分类为 `hostBusy`（核零宿主观测——`SETTINGS.md` §2.12 同判）。
    if (probe.ok !== true) overrideAdmissionIfHostBusy(name, probe.error)
  })().catch(() => { /* 探针不阻断写面：零落账 ⇒ 行面保持既有读数（禁假造） */ })
}

/**
 * `provider:save(payload)` ⇒ `{ ok:true, reason:null }` ∥ `{ ok:false, reason }`。
 * 载荷 `{ name, shape:"preset"|"custom", preset?, baseURL?, key?, format?, proxy? }`（**2026-10-09 清除批**：
 * `model` ∥ `active` 参退场 —— 渠道单值模型退场；`defaultModel` 写入面 = 视图出口 ∥ 会话选定写回，
 * 单源 = `docs/desktop/design/IPC.md` §2 注 8①）；
 * `proxy`（可选布尔 —— 表单「走 proxy」勾选，KD-75 ④）：`true` ⇒ 条目同批落 `proxy: true`（缺 ∥ 非真 ⇒ 零键）；
 * `reason` = 核 `addProviderEntry` 错误串**直传**（预设名不存在 / 重名 / 激活渠道保护…）∥ 端侧形判
 * `invalid-shape`（形不在两形 / custom 缺 `baseURL` / `format` 出三协议——**步序判据单源** = 核流程族
 * `customFieldsError`，端码照旧）。
 * 校验失败**零写盘**（核变更子内部生效前不落盘）。
 * **#841**：成功回执另携 `providerState`（设置写回执 —— 第三刷新点：设置面修好 `defaultModel` 后
 * 提示行即时退场；投影单源 = `session-slots.mjs` `providerStateOf`，写后核读）。
 */
export function providerSave(payload) {
  const name = String(payload?.name ?? "").trim()
  const shape = payload?.shape
  if (!name || !SHAPES.includes(shape)) return { ok: false, reason: "invalid-shape" }
  const key = typeof payload?.key === "string" && payload.key ? payload.key : undefined
  // KD-75 ④：走 proxy 旗随载荷（仅真值落键 —— 判据单源 = 核 `addProviderEntry` `proxy === true`）。
  const proxy = payload?.proxy === true
  let err
  if (shape === "preset") {
    err = addProviderEntry({ preset: name, key, proxy })
  } else {
    const baseURL = String(payload?.baseURL ?? "").trim()
    const format = payload?.format ?? "openai"
    // 自定形必填步序（baseURL → format）+ 协议域 = 核流程族判据（R8）——端侧零副本、拒码照旧。
    if (customFieldsError({ baseURL, format }) !== null) return { ok: false, reason: "invalid-shape" }
    err = addProviderEntry({ custom: { name, baseURL, format }, key, proxy })
  }
  if (err) return { ok: false, reason: err }
  probeAfterWrite(name) // S3：加渠道 = 配置写入面 —— 写后探一次（零阻断）
  return { ok: true, reason: null, providerState: providerStateOf(loadConfig()) }
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
 * `provider:setKey(payload)` ⇒ `{ ok:true, reason:null }` ∥ `{ ok:false, reason }`：载荷 `{ name, key }` —— 渠道
 * 密钥**设 ∕ 改**（S1：VSC `_saveProviderKey` 对位）。写经核 `setProviderKey`；`reason` = `invalid-shape`（名 ∕
 * 钥空）· `unavailable`（条目不在配置 ∕ 回读不中）· 核冲突串直传。成功 ⇒ 写后探（S3）。
 */
export function providerSetKey(payload) {
  const name = String(payload?.name ?? "").trim()
  const key = typeof payload?.key === "string" ? payload.key.trim() : ""
  if (!name || !key) return { ok: false, reason: "invalid-shape" }
  if (!resolveProviders().providers.some((p) => p.name === name)) return { ok: false, reason: "unavailable" }
  const err = setProviderKey(name, key)
  if (err) return { ok: false, reason: err }
  // 写内新鲜读微窗口：条目两查间消失 ⇒ 核子静默空操作 ⇒ **回读核验**（零假成功）
  if (!resolveProviders().providers.some((p) => p.name === name && p.apiKey === key)) return { ok: false, reason: "unavailable" }
  probeAfterWrite(name)
  return { ok: true, reason: null }
}

/**
 * `provider:delKey(payload)` ⇒ 同形信封：载荷 `{ name }` —— 渠道密钥**删**（S1：VSC `deleteProviderKey` 对位；条目
 * 保留）—— 写经核 `removeProviderKeyFromConfig`。**删钥不写后探**：无钥渠探必失败，行面读数由既有落账承载。
 */
export function providerDelKey(payload) {
  const name = String(payload?.name ?? "").trim()
  if (!name) return { ok: false, reason: "invalid-shape" }
  if (!resolveProviders().providers.some((p) => p.name === name)) return { ok: false, reason: "unavailable" }
  const err = removeProviderKeyFromConfig(name)
  if (err) return { ok: false, reason: err }
  // 回读核验（同 `providerSetKey`）：条目消失 ⇒ 零假成功（已无钥条目 = 幂等成功）
  const entry = resolveProviders().providers.find((p) => p.name === name)
  if (entry === undefined || hasKeyOf(entry)) return { ok: false, reason: "unavailable" }
  return { ok: true, reason: null }
}

/**
 * `provider:setProxy(payload)` ⇒ 同形信封：载荷 `{ name, proxy }`（布尔）—— 渠级代理开关（S5）：`true` ⇒ 写
 * `proxy:true`；`false` ⇒ **删键**（沿 VSC `handleSetProviderProxy`）；写经核 `writeConfigAtomic`。
 */
export function providerSetProxy(payload) {
  const name = String(payload?.name ?? "").trim()
  const proxy = payload?.proxy
  if (!name || typeof proxy !== "boolean") return { ok: false, reason: "invalid-shape" }
  if (!resolveProviders().providers.some((p) => p.name === name)) return { ok: false, reason: "unavailable" }
  const w = writeConfigAtomic(_configPath(), (disk) => {
    const entry = (Array.isArray(disk.providers) ? disk.providers : []).find((p) => p?.name === name)
    if (!entry) return
    if (proxy) entry.proxy = true
    else delete entry.proxy
  })
  if (!w.ok) return { ok: false, reason: w.reason }
  const entry = resolveProviders().providers.find((p) => p.name === name) // 回读核验：写内 `!entry` 早退 ⇒ 零假成功
  if (entry === undefined || (entry.proxy === true) !== proxy) return { ok: false, reason: "unavailable" }
  return { ok: true, reason: null }
}

/**
 * `provider:verify(payload)` ⇒ `{ ok:true, models }` ∥ `{ ok:false, reason, failure? }`——`reason` 闭集
 * `timeout` / `malformed` / `unavailable`。
 * 真探一次 + 失败分档 = 核流程族 `probeAdmission(name, provider)`（R8 —— **绝不抛**、分档「读账优先 ∕
 * 未落账回落现算」住核，端侧零再分类副本）；reason 映射 `timeout` ⇒ `"timeout"`、其余（含 `hostBusy`）⇒
 * `"malformed"`（端侧闭集，零改）。**parity-b10 S3 增（#673 · 载荷面契约 = `docs/desktop/design/IPC.md` §2
 * 本行）**：回执另携 `failure` 分档键——宿主忙证据覆盖后**读账**现取（分档同 `provider:list` 行注；未落账 ⇒
 * 回落探时分类）。`unavailable` = 渠道不存在（核无此面——端侧判定）。探不通**仍可保存**
 * （本通道只回报，不拦写）。
 */
export async function providerVerify(payload) {
  const name = String(payload?.name ?? "").trim()
  const provider = resolveProviders().providers.find((p) => p.name === name)
  if (!provider) return { ok: false, reason: "unavailable" }
  const probe = await probeAdmission(name, provider)
  if (probe.ok) return { ok: true, models: probe.models }
  overrideAdmissionIfHostBusy(name, probe.error) // S3（#673）：宿主忙证据覆盖落账（reason 逐字不动）
  const failure = admissionOf(name)?.failure ?? probe.failure // 覆盖后读账现取（分档键——禁假造）
  return { ok: false, reason: probe.failure === "timeout" ? "timeout" : "malformed", failure }
}

/**
 * `provider:models(payload)` ⇒ `{ ok:true, models }` ∥ `{ ok:false, models:[], reason }` —— 「拉取模型」（S2：VSC
 * `testProviderConnection` 对位）。载荷 = **表单暂存值**（**不落盘 ∕ 不入账**）；探面单源 = 核 `probeChannelModels`
 * （零第二探针），**探针目标 = 核 `probeTargetOf` 同判定**（KD-75 ⑤ 缺陷修复并本批：条目 `proxy` ∧ 代理
 * `uri` 在案 ⇒ `proxy.uri`——逐渠独立、无全局闸，2026-10-08；未勾 ∥ 缺省 ⇒ 直连 —— 原全局 `proxy.web` 旗取用退场）。**名传空串** ⇒ 核
 * `recordAdmission` 空名早退 ⇒ 不落账（免污染同名既有渠行面读数 —— S3 行面单源）。探不通 ⇒ `reason` = 核失败句，**不阻断保存**。
 */
export async function providerModels(payload) {
  const baseURL = String(payload?.baseURL ?? "").trim().replace(/\/+$/, "")
  if (!baseURL) return { ok: false, models: [], reason: "invalid-shape" }
  const apiKey = typeof payload?.apiKey === "string" ? payload.apiKey.trim() : ""
  const format = typeof payload?.format === "string" && payload.format !== "" ? payload.format : "openai"
  const target = probeTargetOf({ name: "", baseURL, apiKey, format, proxy: payload?.proxy === true })
  const probe = await probeChannelModels("", target)
  if (probe?.ok !== true) {
    const reason = typeof probe?.error === "string" && probe.error !== "" ? probe.error : "invalid-shape"
    return { ok: false, models: [], reason }
  }
  return { ok: true, models: Array.isArray(probe.models) ? probe.models : [] }
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
