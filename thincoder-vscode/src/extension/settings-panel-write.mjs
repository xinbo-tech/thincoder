/**
 * settings-panel-write.mjs — ChatPanel 面板写面（MODEL-MERGE-SESSION 拆分产物）+
 * VSC 端写盘通道（W16：`$schema` 注入缝供值)。
 * 纯 Node——无 vscode import——单测可在 extension host 外运行。
 * 面板写面 = saveAgentSettingsFromPanel（agent.* + defaultModel 顶层单写通道）+
 * saveShellSettingsFromPanel；
 * 写盘通道 = `vscPersistRaw`（核 persistRaw + 本端 `$schema` 指针注入——CORE-UNIFICATION
 * §2.13.3 `opts.schema` 缝；本端直写面统一经此）。
 */
import { persistRaw, conflictError, loadRaw } from "@thincoder/core/config-io.mjs"
import { thinkOffShape } from "@thincoder/core/think-off.mjs"
import { probeTargetFromEntry, sanitizeConsultModels } from "./presets.mjs"
import { probeChannelModels } from "@thincoder/core/provider/list-models.mjs"
import { overrideAdmissionIfHostBusy } from "./loop-sampler.mjs"
import { specForModel } from "../specs.mjs"

/** VSC 端 `$schema` 指针（§2.5 #80 端差——本端写盘注入；CLI 不注入）。 */
export const VSC_CONFIG_SCHEMA = "https://thincoder.dev/schemas/config.json"

/** VSC 端写盘通道：核单一写盘执行体 + 本端 `$schema` 指针注入（CORE-UNIFICATION §2.13.3
 *  `opts.schema` 缝——未注入 ⇒ 无 `$schema` 键；注入 ⇒ 键在场且值 = 注入值）。
 *  本端各直写面（面板写面 / MCP 段 / 迁移写回 / eng 镜像）统一经此。 */
export function vscPersistRaw(mutate) {
  return persistRaw(mutate, { schema: VSC_CONFIG_SCHEMA })
}

/** 单写通道：agent.* 键合并语义 = config-io saveAgentSettings（delete on
 *  undefined/null/""/空对象）——同文件内联执行（defaultModel 顶层 + agent 一次落盘——
 *  防两次写间 mtime 窗）。 */
function applyAgentPatch(raw, patch) {
  raw.agent = raw.agent && typeof raw.agent === "object" ? raw.agent : {}
  for (const [k, v] of Object.entries(patch ?? {})) {
    if (v === undefined || v === null || v === "") delete raw.agent[k]
    else if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) delete raw.agent[k]
    else raw.agent[k] = v
  }
}

/** M9：设默认模型的配置写入面——对复合渠道探一次 `GET /models`（复用 M1 实现）。
 *  本写面为同步契约（调用方不 await）→ 探针 fire-and-forget（内部全捕获，绝不 reject）；
 *  失败结果入准入展示态（providerStatus 行 `不可用` + 失败消息本体）——不阻断写；
 *  失败不缓存——下次配置动作重探。 */
function probeDefaultModelChannel(dm) {
  const value = typeof dm === "string" ? dm.trim() : ""
  const sep = value.indexOf(":")
  if (sep <= 0 || !value.slice(sep + 1)) return
  const name = value.slice(0, sep)
  void (async () => {
    const raw = loadRaw()
    const entry = (Array.isArray(raw.providers) ? raw.providers : []).find((p) => p?.name === name)
    if (!entry) return
    const r = await probeChannelModels(name, probeTargetFromEntry(entry))
    // F-W19（`SETTINGS.md` §2.12）：宿主忙 = 端侧证据 ⇒ 覆盖核落账分类（`reason` 逐字不动）。
    // 写面同步契约零改——探针仍 fire-and-forget（本链已全兜底）。
    if (!r.ok) overrideAdmissionIfHostBusy(name, r.error)
  })().catch(() => { /* 探针绝不阻断写面 */ })
}

/** off 形按族取形（取形 = **单源** `@thincoder/core/think-off.mjs` 的 `thinkOffShape`——`docs/core/design/MODEL-SPECS.md`
 *  §16.2 生产者表第 4 行 / §15.4-2 族别判据；本地零形体，只剩取源一步）：effort 族（`thinkApi === "effort"`）
 *  ⇒ `null`（载荷层 off 门首款要求 `provider.thinking === null`——`{type:"disabled"}` 不开门 ⇒ effort 族关思考静默失效）；
 *  其余（type 族默认 / 自定义开值族）⇒ `{ type: "disabled" }`（达载荷层）。
 *  取形源 = payload 内 `adv.model`（off 档只在 select 已渲染时可达 ⇒ spec 可解；未给名 ⇒ 查表兜底 DEFAULT_SPEC）。 */
function advisorOffShape(model) {
  return thinkOffShape(specForModel(model ?? ""))
}

/** Panel persistence: build the agent.* patch from a webview payload (CLI-parity field names).
 *  MODEL-MERGE-SESSION：payload.defaultModel = 顶层 config 键（"provider:model" 复合——
 *  空串/非串删除——新会话起点专用入口）。其余语义 verbatim（单写通道——所有字段经一次
 *  persistRaw——冲突提示同 saveAgentSettings）。 */
export function saveAgentSettingsFromPanel(payload) {
  const patch = {}
  if (payload.maxTurns != null) patch.maxTurns = Number(payload.maxTurns) || undefined
  if (payload.subagentTurns != null) patch.subagentTurns = Number(payload.subagentTurns) || undefined
  // "in payload" guards let explicit undefined (cleared field) flow through as deletion
  if ("subagentModel" in payload) patch.subagentModel = payload.subagentModel || undefined
  if ("subagentModels" in payload) {
    // Per-type overrides: only non-empty values kept; empty object deletes the whole key
    const m = {}
    for (const [role, v] of Object.entries(payload.subagentModels ?? {})) {
      if (v && typeof v === "string" && v.trim()) m[role] = v.trim()
    }
    patch.subagentModels = Object.keys(m).length > 0 ? m : undefined
  }
  if (payload.compactThreshold !== undefined) patch.compactThreshold = payload.compactThreshold === "" ? undefined : (Number(payload.compactThreshold) || undefined)
  if (payload.verifyGuard !== undefined) patch.verifyGuard = !!payload.verifyGuard
  if (payload.engineering !== undefined) patch.engineering = !!payload.engineering
  if (payload.consultTurns != null) patch.consultTurns = Number(payload.consultTurns) || undefined
  if (payload.consultTimeoutMs != null) patch.consultTimeoutMs = Number(payload.consultTimeoutMs) || undefined
  // Consultation models (CONSULTATION.md): array of {provider, model}, ≤5, validated.
  // F-4 (IKCDMR)：写路径清洗对齐 CLI loadConfig 读规则（双端锁步——共享 config）——形状非法/
  // 未知渠道条目在保存时丢弃（面板 consult 行只可能引用已配置渠道——全悬挂保存 = 删键）。
  if (payload.consultModels !== undefined) {
    const arr = Array.isArray(payload.consultModels) ? payload.consultModels : []
    const raw = loadRaw()
    const names = (Array.isArray(raw.providers) ? raw.providers : []).map((p) => p?.name).filter(Boolean)
    const clean = sanitizeConsultModels(arr, names).keep
      .map((m) => ({
        provider: m.provider.trim(),
        model: m.model.trim(),
        ...(typeof m.effort === "string" && m.effort.trim() ? { effort: m.effort.trim() } : { effort: null }),
      }))
    patch.consultModels = clean.length > 0 ? clean : undefined
  }
  // §11.1/§11.2（R14/R13——POOL-CONFIG-UNIFIED 2026-09-09）：并发池三域容量（面板写
  // 同一键）。逐键正整数 ≥1；非法键丢弃（空对象/全非法 → 删整键——运行期回退默认
  // 4/4/4 + 文案）。
  if ("poolLimits" in payload) {
    const pl = {}
    for (const key of ["engCoder", "other", "advisor"]) {
      const v = payload.poolLimits?.[key]
      if (Number.isInteger(v) && v >= 1) pl[key] = v
    }
    patch.poolLimits = Object.keys(pl).length > 0 ? pl : undefined
  }
  if (payload.advisor !== undefined) {
    // Merge semantics (GitHub #3, 2026-08-29): the panel payload only carries the fields
    // the panel owns. A MISSING key backfills from config.json — the CLI may have written
    // advisor.provider/model/thinking/reasoningEffort that must survive a panel save
    // (the old "in"-guard merge treated a missing key as "don't merge", so
    // saveAgentSettings replaced the whole object and silently wiped them). An explicit
    // null / '' / undefined in the payload is a CLEARED field and deletes the key
    // (the webview sends null because postMessage JSON serialization drops undefined
    // keys — "slot missing" and "explicitly cleared" must stay distinguishable on the wire).
    // advisor.enabled is deprecated (2026-08-21) — never written; guard defaults OFF.
    const adv = payload.advisor ?? {}
    const current = loadRaw().agent?.advisor ?? {}
    // Seed from disk: every scalar/plain-object advisor key survives the merge.
    // Arrays (and functions, which JSON files can't have) are never written by either
    // side — don't resurrect them.
    // §15.4-5 null carve-out（只 `thinking` 一键）：该键的 `null` = **有意义值**（NF1 显式 off）——
    // 不穿透种子循环则下一次任意面板保存（恒携 advisor 载荷）就静默删掉 off 形；其余键维持
    // 「null = 清空、不复活」。
    const merged = {}
    for (const [k, v] of Object.entries(current)) {
      if (v === null && k !== "thinking") continue
      if (Array.isArray(v)) continue
      merged[k] = v
    }
    // Payload wins where it speaks (guard / timeoutMs / reasoningEffort / provider / model).
    merged.guard = adv.guard !== undefined ? !!adv.guard : (merged.guard ?? false)
    // timeoutMs passthrough (AGENT-PARAMS-TUNING, P4): the panel has no timeoutMs
    // input — an explicit valid payload value wins, otherwise the hand-written
    // config.json value survives a panel save (never silently dropped, never stored invalid).
    if (typeof adv.timeoutMs === "number" && adv.timeoutMs > 0) merged.timeoutMs = adv.timeoutMs
    if (!Number.isFinite(merged.timeoutMs) || merged.timeoutMs <= 0) delete merged.timeoutMs
    // §15.4-6（台账 #331——死键接线）：写键 = `advisor.reasoningEffort`（单源 = 核读取键
    // `thincoder-core/advisor/run.mjs:48/:64`——as-of 本批实施，与 CLI `/advisor` 菜单同键）。三态：`none` = 关思考 ⇒
    // 族别 off 形（§15.4-2）+ 删键；「—」/ 空 ⇒ 删键（不写档、**不动** thinking）；其余档 = 字面值
    // + 清 `null` 标记（选档 = 要思考；`{type:"disabled"}` 不动——同 CLI `cmd-think.mjs:119-120`）。
    if ("reasoningEffort" in adv) {
      const v = adv.reasoningEffort
      if (v === "none") {
        merged.thinking = advisorOffShape(adv.model)
        delete merged.reasoningEffort
      } else if (typeof v === "string" && v.trim()) {
        merged.reasoningEffort = v.trim()
        if (merged.thinking === null) delete merged.thinking
      } else {
        delete merged.reasoningEffort
      }
    }
    // legacy `advisor.effort`（写而无人读的死键）——保存即删，不迁移值（静默激活历史死值）、不复活。
    delete merged.effort
    for (const key of ["provider", "model"]) {
      if (key in adv) {
        if (typeof adv[key] === "string" && adv[key].trim()) merged[key] = adv[key].trim()
        else delete merged[key] // explicit null / '' / undefined = CLEARED slot
      }
    }
    delete merged.enabled // deprecated 2026-08-21 — never resurrect a stale key
    patch.advisor = merged
  }
  const r = vscPersistRaw((raw) => {
    // defaultModel = 顶层键（F-5 VSC 面板入口——provider:model 复合）
    if ("defaultModel" in payload) {
      const v = payload.defaultModel
      if (typeof v === "string" && v.trim()) raw.defaultModel = v.trim()
      else delete raw.defaultModel
    }
    applyAgentPatch(raw, patch)
  })
  // M9：设默认模型 = 配置写入面——写后探一次 /models（探不通标不可用，不阻断保存）
  if ("defaultModel" in payload) probeDefaultModelChannel(payload.defaultModel)
  return conflictError(r)
}

/** Persist shell setting from the panel. value: string path/command, '' or null = system default.
 *  F5b 冲突提示同 saveAgentSettings。 */
export function saveShellSettingsFromPanel(value) {
  const v = typeof value === "string" ? value.trim() : ""
  const r = vscPersistRaw((raw) => {
    if (!v) delete raw.shell
    else raw.shell = v
  })
  return conflictError(r)
}
