/**
 * settings.mjs — 主侧设置族处理体：`config:write`（仅语言面）/ `model:list`（逐模型档位投影）/
 * **`model:catalog`（全渠扇出候选面 —— 模型菜单全渠扇出批 · 2026-09-29）** /
 * `settings:agent`（agent 参数族读 + 写 + 档位意图级写 + **consult ∕ advisor 行面读数**〔R7〕）——
 * 外加两道端侧单点：配置档存在性读数 `isConfigured()` 与密钥遮罩 `maskKey()`（**R7 起住
 * `settings-values.mjs`，本档同名 re-export**）；另出 `deepEqual` 供档位投影复用（同判据单点）；
 * **R2 增 `indexStatus()`**（`index:status` 回执 —— 索引状态读数装配：计数转口 `index-status.mjs`
 * 〔核只读出口〕+ `hasEmbedder` 配置面判据）；**R7 增 `modelsFace()`**（consult ∕ advisor 行面读数
 * —— 随 `settings:agent` 回执出）。
 * **R7 拆出两族处理体**（先拆后改 —— 300 行层拆分）：env 族（proxy ∕ shell 读写 + TestProxy 转口）
 * = `settings-env.mjs`；tools 族（embedding ∕ websearch key 读写）= `settings-tools.mjs`。
 *
 * 纪律（批档 §2.3/§2.5）：
 * - **写面唯一执行体** = 核 `writeConfigAtomic`（`thincoder-core/config-io.mjs:59`，
 *   内含 mtime 冲突护栏 → 回执 `{ ok:false, reason:"mtime-conflict" }` + `.bak-{ts}`）；
 *   端侧**零自写盘**（不 fs.writeFile）。
 * - **畸形档不吞**：核 `loadRaw` 抛 ⇒ 本档零 catch ⇒ invoke 拒绝直传（渲染面落 error 档）。
 * - **不复刻核算法**：值校验 / 类型表 / 敏感判据一律走核导出面
 *   （`isSensitiveKey` / `_checkKnownKeyValue`），端侧不另立白名单、不另立类型副本。
 * - `settings:agent` **不经 agent 工具**（主进程直读写配置——批档 §2.3 写面条款）。
 * - **端侧零族别自判**（`docs/desktop/design/PROJECT.md` §2 KD-18）：`model:list` 逐项
 *   `{ id, effortEnum, thinkOff }` 两判据直取核**导出面**（`specForModel` / `thinkOffPath`）——
 *   端侧零解析模型名、零族别表副本。
 * - **档位写径（批 B · ⑥）**：意图级载荷 `{ tier: { provider, model, level } }` ⇒ 先清不相容记号、
 *   再按档落形（`auto` 删两键 / `off` 落 `thinkOffShape(spec)` + 删 `reasoningEffort` / member 仅当
 *   `thinking` deep-equal `thinkOffShape(spec)` 时删 + 置 level）；写面 = 渠道条目级默认两键；
 *   两拒码（`bad-level` / `unknown-provider`）皆**零写**——判据与拒码序单源 =
 *   `docs/desktop/design/IPC.md` §2「档位控件注」。
 */
import { loadConfig } from "@thincoder/core/config.mjs"
import { _configPath, resolveProviders, writeConfigAtomic } from "@thincoder/core/config-io.mjs"
import { SUPPORTED_LOCALES, normalizeLocale, projectDictionary } from "@thincoder/core/i18n.mjs"
import { channelUnavailableMessage, probeChannelModels } from "@thincoder/core/provider/list-models.mjs"
import { probeTargetOf } from "@thincoder/core/provider-flows.mjs"
import { specForModel } from "@thincoder/core/model-specs.mjs"
import { thinkOffPath, thinkOffShape, applyAdvisorEffort } from "@thincoder/core/think-off.mjs"
import { _checkKnownKeyValue } from "@thincoder/core/agent-tools/settings.mjs"
import { readIndexCounts } from "./index-status.mjs"
// 值面 ∕ 遮罩族（R7 先拆后改拆出 —— 导出面零改：本档同名 re-export）。
import { SLOT_AUTHORITY_PATHS, agentFields, deepEqual, deleteKeyPath, isConfigured, setKeyPath } from "./settings-values.mjs"
export { MASK, deepEqual, isConfigured, maskKey } from "./settings-values.mjs"

/**
 * `config:write(payload)` ⇒ `{ ok, reason:null, locale, dict, configured }` ∥ `{ ok:false, reason }`。
 * 写面**仅** `locale`（键白名单一条；值域 = 核 `SUPPORTED_LOCALES` = `en`/`zh`——批档 §2.4）；
 * 未知键 / 非单键 / 非对象 ⇒ `invalid-key`，值域外 ⇒ `invalid-value`；写失败 ⇒ 核回执 reason 直传
 * （`mtime-conflict`）。
 * 成功**同回带**语言字典 + 配置档读数（免二跳第二轮 `config:read`、零新事件通道——§2.11 项 1）；
 * 字典 = 核 `projectDictionary(locale)`（**项目层**字典——宿主层键由渲染面 `HOST_DICT` 自持）。
 */
export function configWrite(payload) {
  const patch = payload?.patch
  const keys = patch && typeof patch === "object" && !Array.isArray(patch) ? Object.keys(patch) : []
  if (keys.length !== 1 || keys[0] !== "locale") return { ok: false, reason: "invalid-key" }
  const raw = patch.locale
  if (typeof raw !== "string" || !SUPPORTED_LOCALES.includes(raw)) return { ok: false, reason: "invalid-value" }
  const locale = normalizeLocale(raw)
  const w = writeConfigAtomic(_configPath(), (disk) => { disk.locale = locale })
  if (!w.ok) return { ok: false, reason: w.reason }
  return { ok: true, reason: null, locale, dict: projectDictionary(locale), configured: isConfigured() }
}

/* ─── models 行面（consult ∕ advisor —— `settings:agent` 回执增键 · R7）────────────────────── */

/** consult ∕ advisor 行面读数（R7 —— models 段）：consult 池逐行
 *  `{ provider, model, effort, effortEnum }`（`effortEnum` = 核 `specForModel(model).reasoningEffortEnum`
 *  **离线投影**（零探针——同 VSC `agentSettings().effortEnums` 口径）；`effort` 非串 ⇒ null）；
 *  advisor = 两键（缺 / 空 ⇒ null）。行数 ≤5（核 `sanitizeConsultModels` 同口径）。
 *  消费面 = 渲染面 models 段（行面 ∕ 增行表单）；写面经 `settings:agent` `{ patch }` 径（本档零新通道）。 */
export function modelsFace(config) {
  const consult = (Array.isArray(config?.agent?.consultModels) ? config.agent.consultModels : [])
    .filter((m) => m && typeof m.provider === "string" && m.provider !== "" && typeof m.model === "string" && m.model !== "")
    .slice(0, 5)
    .map((m) => ({
      provider: m.provider,
      model: m.model,
      effort: typeof m.effort === "string" ? m.effort : null,
      effortEnum: specForModel(m.model).reasoningEffortEnum ?? [],
    }))
  const adv = config?.agent?.advisor ?? {}
  return {
    consult,
    advisor: {
      provider: typeof adv.provider === "string" && adv.provider !== "" ? adv.provider : null,
      model: typeof adv.model === "string" && adv.model !== "" ? adv.model : null,
    },
  }
}

/**
 * 逐模型档位投影（`docs/desktop/design/PROJECT.md` §2 KD-18 端侧零族别自判）：`{ id, effortEnum,
 * thinkOff }` 三键闭集逐项——两判据单源 = 核 `specForModel(id).reasoningEffortEnum`
 * （`thincoder-core/model-specs.mjs:287`）与 `thinkOffPath(spec)`（`thincoder-core/think-off.mjs:22`）。
 * 未声明枚举 ⇒ `[]`（键恒在，渲染面免守卫——先例 = VSC 空枚举零渲染）；未登记模型 ⇒ 空枚举 +
 * 默认规格判据（核 `DEFAULT_SPEC` 非 effort 族 ⇒ off 可达）。
 */
const modelEntry = (id) => {
  const spec = specForModel(id)
  return { id, effortEnum: spec.reasoningEffortEnum ?? [], thinkOff: thinkOffPath(spec) }
}

/** 渠条目持密钥判据（全渠扇出前的**渠滤**单点）—— 对位 VSC `isProviderConfigured` 的 `resolveKey` 口径
 *  （`presets.mjs:97-99`：key **非空白**）；纯空白 key 边缘档与 `provider:list` 行面 `hasKey`（`length > 0`）
 *  不同判 —— 本批渠滤以 VSC 对位为准。 */
const hasKeyOf = (entry) => typeof entry?.apiKey === "string" && entry.apiKey.trim() !== ""

/**
 * `model:catalog`（无载荷）⇒ `{ ok:true, models:[{ provider, id, effortEnum, thinkOff }], unavailable:[{ provider, reason }] }`
 * —— **全渠扇出**（模型菜单全渠扇出批）：逐 `hasKey` 渠（配置序）`Promise.allSettled` 并发探一次
 * `GET /models`（核单源 `probeChannelModels` + `probeTargetOf` —— 代理 ∕ 落账同径），逐模型经 `modelEntry`
 * 投影 + 渠名注入。失败渠 ⇒ **零行** + `unavailable` 项（`reason` = 核 `channelUnavailableMessage`
 * 长句**原文逐字**——非闭集码，供显示；分支面另有落账 `failure`）；探通零模型渠 ⇒ 零行 ∧ 不落
 * `unavailable`；无已配渠 ⇒ 两键空表。整档不可读（核 `loadRaw` 抛）⇒ 零 catch 直传（畸形档不吞）。
 * 序 = 渠（配置序 —— `allSettled` 保序）× 渠内（核 `listModels` 已排序）。
 */
export async function modelCatalog() {
  const configured = resolveProviders().providers.filter((p) => hasKeyOf(p))
  const settled = await Promise.allSettled(
    configured.map((entry) => probeChannelModels(entry.name, probeTargetOf(entry))),
  )
  const models = []
  const unavailable = []
  configured.forEach((entry, index) => {
    const outcome = settled[index]
    // 探针语义 = 绝不抛出（核单源）；rejected 只可能来自注入缝 —— 仍落诊断项，不假成功。
    const result = outcome.status === "fulfilled" ? outcome.value : { ok: false, error: channelUnavailableMessage(outcome.reason) }
    if (result?.ok === true) {
      for (const id of Array.isArray(result.models) ? result.models : []) models.push({ provider: entry.name, ...modelEntry(id) })
    } else {
      unavailable.push({ provider: entry.name, reason: result?.error })
    }
  })
  return { ok: true, models, unavailable }
}

/**
 * `model:list(payload)` ⇒ `{ ok, models }` ∥ `{ ok:false, models:[], reason }`——`payload.provider`
 * = provider **名**；`models` = 该渠探针结果逐项经 `modelEntry` 投影为 `{ id, effortEnum, thinkOff }`
 * （候选面 = 元素形；渲染面零自判）。**探针径对齐**（全渠扇出批 · U1）：核 `probeChannelModels` +
 * `probeTargetOf` —— 与 `model:catalog` 单源同径（过代理 ∕ 落账），**回执行逐字零变**。
 * 失败 reason = 探针回携的核 `channelUnavailableMessage` 长句（状态码 / 错误摘要的中文直传）；
 * 渠道不存在（无该 provider）⇒ 同面构造错误后直传（端侧零自写文案分支以外的话术）。
 */
export async function modelList(payload) {
  const name = String(payload?.provider ?? "").trim()
  const provider = resolveProviders().providers.find((p) => p.name === name)
  if (!provider) {
    return { ok: false, models: [], reason: channelUnavailableMessage(new Error(`provider not found: ${name}`)) }
  }
  const probe = await probeChannelModels(name, probeTargetOf(provider))
  if (probe.ok !== true) return { ok: false, models: [], reason: probe.error }
  return { ok: true, models: (Array.isArray(probe.models) ? probe.models : []).map((id) => modelEntry(id)) }
}
/** 写内新鲜读发现渠道条目已消失（跨进程改档微窗口）的**本档私记号**——外层捕 ⇒ `unknown-provider`
 *  回执（零写）；拒码闭集不因该窗口泄入核 / 端错误串。 */
const VANISHED = Symbol("vanished-provider")

/** **S11**：advisor 推理档写键（三态写语义经核 `applyAdvisorEffort`——本档只做 spec 解引用）。 */
const ADVISOR_EFFORT_PATH = "agent.advisor.reasoningEffort"

/** advisor 推理档的 spec 取形模型（S11 收正 · 顾问评审 🟡2）：与渲染面候选面同源同序——
 *  `advisor.model` ⇒ 该值；否则 `advisor.provider` 渠条目 `model`；再缺 ⇒ `defaultModel` 模型段；无 ⇒ `""`。
 *  对位核运行期 `resolveAdvisorProvider`（`thincoder-core/advisor/run.mjs:26-56`：cfg.model > 渠道 model > 主 provider model）
 *  —— 判据 = 写后投影恒等 ∕ 族别 off 形真有效（旧式 `advisor.model ?? ""` 在无覆写时落 DEFAULT_SPEC ⇒
 *  effort 族主模型下写 `{type:"disabled"}` ⇒ 核档自注「关思考静默失效」）。 */
function advisorSpecModel(disk) {
  const adv = disk?.agent?.advisor !== null && typeof disk?.agent?.advisor === "object" ? disk.agent.advisor : {}
  if (typeof adv.model === "string" && adv.model.trim()) return adv.model.trim()
  if (typeof adv.provider === "string" && adv.provider !== "") {
    const entry = (Array.isArray(disk.providers) ? disk.providers : []).find((p) => p?.name === adv.provider)
    if (typeof entry?.model === "string" && entry.model.trim()) return entry.model.trim()
  }
  const composite = typeof disk.defaultModel === "string" ? disk.defaultModel : ""
  const at = composite.indexOf(":")
  return at > 0 ? composite.slice(at + 1) : ""
}


/**
 * 档位写径（批 B · ⑥——`docs/desktop/design/IPC.md` §2「档位控件注」逐步落地）。
 * 拒码序 = **形态 → provider 存在 → level 合法**（三拒皆**零写**）：
 * - 形态：`tier` 非对象 / `model` 非非空串 / `level` 缺 ⇒ `invalid-patch`（载荷非三成员形）；
 * - provider 存在：名不在配置（含缺 / 空名——皆无对应条目）⇒ `unknown-provider`；
 * - level：`"auto"` 恒可；`"off"` 与 `"none"` 同径（`"none"` 不作独立档——语义由 `"off"` 承载）
 *   须 `thinkOffPath(spec)` 真；其余须 ∈ `specForModel(model).reasoningEffortEnum` ⇒ 表外（含非串 / 空串）
 *   ⇒ `bad-level`。
 * spec 单源 = 核 `specForModel(model)`；off 形单源 = 核 `thinkOffShape(spec)`（端侧零族别副本——KD-18）。
 * 写面 = 该渠道条目级默认两键（`thinking` / `reasoningEffort`：先清不相容记号，再按档落形）。
 */
function tierAgent(config, tier) {
  const bad = (reason) => ({ ok: false, reason, fields: agentFields(config), models: modelsFace(config) })
  if (tier === null || typeof tier !== "object" || Array.isArray(tier)) return bad("invalid-patch")
  const model = typeof tier.model === "string" ? tier.model.trim() : ""
  if (!model || tier.level === undefined || tier.level === null) return bad("invalid-patch")
  const provider = typeof tier.provider === "string" ? tier.provider.trim() : ""
  if (!resolveProviders().providers.some((p) => p.name === provider)) return bad("unknown-provider")
  const spec = specForModel(model)
  const level = tier.level
  const offish = level === "off" || level === "none"
  const member = typeof level === "string" && !offish && (spec.reasoningEffortEnum ?? []).includes(level)
  if (level !== "auto" && !offish && !member) return bad("bad-level")
  if (offish && !thinkOffPath(spec)) return bad("bad-level")
  const mutate = (disk) => {
    const entry = (Array.isArray(disk.providers) ? disk.providers : []).find((p) => p && p.name === provider)
    if (!entry) throw VANISHED
    if (offish) {
      entry.thinking = thinkOffShape(spec)
      delete entry.reasoningEffort
    } else if (level === "auto") {
      delete entry.thinking
      delete entry.reasoningEffort
    } else {
      if (deepEqual(entry.thinking, thinkOffShape(spec))) delete entry.thinking
      entry.reasoningEffort = level
    }
  }
  let w
  try {
    w = writeConfigAtomic(_configPath(), mutate)
  } catch (error) {
    // 写前检查与写内新鲜读之间的微窗口（跨进程改档）：条目消失 ⇒ 同上拒码，**零写**；其余错一律重抛不吞。
    if (error === VANISHED) return bad("unknown-provider")
    throw error
  }
  if (!w.ok) return { ok: false, reason: w.reason, fields: agentFields(loadConfig()), models: modelsFace(loadConfig()) }
  return { ok: true, reason: null, fields: agentFields(loadConfig()), models: modelsFace(loadConfig()) }
}

/**
 * `index:status`（无入参）⇒ `{ ok, status }`（R2 · 桌面功能对位批）：状态读数**装配** —— 计数 = 核只读
 * 出口（转口 `index-status.mjs`，**端侧零 SQL ∕ 零表名**）；`hasEmbedder` = 配置面判据（`embedding.apiKey`
 * 在场 —— 同 `thincoder-core/agent/assemble.mjs:76` 装配判据）；`built` = 本项目 code + doc 文件数 > 0（核出口 `indexed`
 * 同源）。**P1 两键（KD-69）**：`dbBytes` ∥ `origins` 随 `counts` 透传（设置面两读行消费）。
 * 无本项目 ⇒ 零计数（读数仍成回执 —— 「未建」态非错误；跨项目读全库不授权）。
 */
export function indexStatus({ dir = null } = {}) {
  const config = loadConfig()
  const counts = readIndexCounts({ dir })
  return {
    ok: true,
    status: {
      built: counts.indexed, files: counts.files, chunks: counts.chunks,
      dbBytes: counts.dbBytes, origins: counts.origins,
      hasEmbedder: Boolean(config.embedding?.apiKey),
    },
  }
}

/**
 * defaultModel 写后探（S3 · M9 同律 —— 先例 = VSC `settings-panel-write.mjs:186` → `:43-57`）：复合串
 * provider 段 ⇒ 对彼渠 fire-and-forget 探一次（探针绝不阻断写面）。**动态解引用**（`providers.mjs` 反向取
 * 本档值面 ⇒ 静态 import 成环；沿 `settings-env.mjs` 转口先例）；空串 ∕ 无模型段 ⇒ 零探。
 * 该点与另两径（加渠道 ∕ 改钥）同探（`probeAfterWrite` —— 核落账 `admissionOf` 供行面读数）。
 */
function probeDefaultModelWrite(value) {
  const dm = typeof value === "string" ? value.trim() : ""
  const sep = dm.indexOf(":")
  if (sep <= 0 || !dm.slice(sep + 1)) return
  const name = dm.slice(0, sep)
  void import("./providers.mjs")
    .then(({ probeAfterWrite }) => probeAfterWrite(name))
    .catch(() => { /* 探针绝不阻断写面 */ })
}

/**
 * `settings:agent(payload)`：读 `{}` ⇒ `{ ok, fields, models }`；写 `{ patch:{ "<点分路径>": value } }` ∥
 * `{ tier:{ provider, model, level } }`（**二择一**——档位为意图级载荷）⇒ `{ ok, reason, fields, models }`
 * （**写后回读**；`models` = consult ∕ advisor 行面 —— R7 增：段读面随写同拍刷）。
 * **B10 W2 · S3 增**：`patch` 含 `defaultModel` 且写成功 ⇒ **写后探一次**（fire-and-forget ——
 * 不阻断回执；渠道码入核落账供 `provider:list` 行面读数）。
 * **B10 W3（S10 ∕ S11 ∕ S14）**：① `patch` 表**显式清除面**——值 = `null` ⇒ **删键**（沿核
 * `_checkKnownKeyValue`「null = 显式清除」语义；S10 子代理模型槽清空 ∕ S11 中性档两径的落点；
 * 历史口径「patch 表达不了删键」就此消解）；② **slot 权威键拒写**（`agent.advisor.guard` ∕
 * `agent.engineering`——会话槽面键，唯一写面 = `session:flags` 槽写；沿 VSC `agent.engineering` 白名单
 * 删项同裁 + #475 先例）⇒ 拒码 `slot-authority` + **零写**（见 `SLOT_AUTHORITY_PATHS`）；
 * ③ `agent.advisor.reasoningEffort` 三态写语义 = **核单源** `applyAdvisorEffort`（本档只做 spec 解引用 ——
 * 取形模型 = `advisorSpecModel`：与渲染面候选面同源同序，对位核运行期 `resolveAdvisorProvider`）。
 * 三档失败（§2.2 状态面②）：① 值校验拒绝 ⇒ 核 `_checkKnownKeyValue` 抛错 **零写盘**
 * （reason = 核错误串直传）；② mtime 冲突 ⇒ 核回执 `mtime-conflict`（`.bak-{ts}` 已留）；
 * ③ 路径形态非法 ⇒ `invalid-patch`。未知键**放行**（全量域 = 核语义——端侧不另立白名单）。
 * 二择一判定：有效键 = 非 `undefined`/`null`（故 `{}` / `{ patch:null }` 仍为读面）；两有效键同在 ⇒
 * `invalid-patch` ∥ 两皆无 ⇒ 读面；`{ tier }` 径另二拒见 `tierAgent`。
 */
export function settingsAgent(payload) {
  const config = loadConfig()
  const patch = payload?.patch
  const tier = payload?.tier
  const hasPatch = patch !== undefined && patch !== null
  const hasTier = tier !== undefined && tier !== null
  if (hasPatch && hasTier) return { ok: false, reason: "invalid-patch", fields: agentFields(config), models: modelsFace(config) }
  if (hasTier) return tierAgent(config, tier)
  if (!hasPatch) return { ok: true, fields: agentFields(config), models: modelsFace(config) }
  const entries = typeof patch === "object" && !Array.isArray(patch) ? Object.entries(patch) : []
  if (!entries.length) return { ok: false, reason: "invalid-patch", fields: agentFields(config), models: modelsFace(config) }
  // S14a：slot 权威键拒写（零写——先于值校验：键本身合法，拒的是写面归属）
  if (entries.some(([path]) => SLOT_AUTHORITY_PATHS.includes(path))) {
    return { ok: false, reason: "slot-authority", fields: agentFields(config), models: modelsFace(config) }
  }
  for (const [path, value] of entries) {
    try {
      _checkKnownKeyValue(path, value)
    } catch (e) {
      return { ok: false, reason: e?.message ?? String(e), fields: agentFields(config), models: modelsFace(config) }
    }
  }
  const w = writeConfigAtomic(_configPath(), (disk) => {
    for (const [path, value] of entries) {
      if (path === ADVISOR_EFFORT_PATH) continue // S11：三态写（helper 单源）后置——先落同批其余路径
      if (value === null) deleteKeyPath(disk, path) // 显式清除 ⇒ 删键（W3 写链：patch 表清除面）
      else setKeyPath(disk, path, value)
    }
    const effort = entries.find(([path]) => path === ADVISOR_EFFORT_PATH)
    if (effort !== undefined) {
      if (disk.agent === null || typeof disk.agent !== "object" || Array.isArray(disk.agent)) disk.agent = {}
      if (disk.agent.advisor === null || typeof disk.agent.advisor !== "object" || Array.isArray(disk.agent.advisor)) disk.agent.advisor = {}
      applyAdvisorEffort(disk.agent.advisor, effort[1], specForModel(advisorSpecModel(disk)))
    }
  })
  if (w.ok) {
    const dm = entries.find(([path]) => path === "defaultModel") // S3：defaultModel 写径 ⇒ 写后探一次
    if (dm) probeDefaultModelWrite(dm[1])
  }
  if (!w.ok) return { ok: false, reason: w.reason, fields: agentFields(loadConfig()), models: modelsFace(loadConfig()) }
  return { ok: true, reason: null, fields: agentFields(loadConfig()), models: modelsFace(loadConfig()) }
}
