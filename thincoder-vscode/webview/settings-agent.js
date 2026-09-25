/**
 * settings-agent.js — agent + consult/advisor cards (split out of settings.js):
 * card HTML, CHANGE-TO-SAVE payload building and binding.
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"
import { SS, effortSelectView, effortPayloadValue } from "./settings-state.js"
import { readConsultRowsFromDom, collectConsultRows, mountModelMenus, bindConsultRows } from "./settings-models.js"

/** Agent card HTML (run parameters + subagent model assignments). */
export function agentCardHtml() {
  let html = ""
  // ─── Agent card (run parameters + subagent model assignments) ───
  const as = SS.agentSettings || {}
  html += `<section class="settings-card"><h4 class="settings-card-title">${t("settings.agentSection")}</h4><div class="settings-card-body">`
  html += `<div class="key-field"><label title="${t("settings.maxTurnsHelp")}">${t("settings.maxTurns")}</label><input id="ag-maxturns" type="number" min="1" value="${as.maxTurns ?? 200}"></div>`
  html += `<div class="key-field"><label title="${t("settings.subagentTurnsHelp")}">${t("settings.subagentTurns")}</label><input id="ag-subturns" type="number" min="1" value="${as.subagentTurns ?? 100}"></div>`
  // §11.1/§11.2（R14/R13——POOL-CONFIG-UNIFIED 2026-09-09）：并发池三域容量
  // （eng-coder/other/advisor——默认 4/4/4——面板逐键回退 ?? 4）
  const pool = as.poolLimits || {}
  html += `<div class="key-field"><label title="${t("settings.poolEngHelp")}">${t("settings.poolEng")}</label><input id="ag-pool-engcoder" type="number" min="1" value="${pool.engCoder ?? 4}"></div>`
  html += `<div class="key-field"><label title="${t("settings.poolOtherHelp")}">${t("settings.poolOther")}</label><input id="ag-pool-other" type="number" min="1" value="${pool.other ?? 4}"></div>`
  html += `<div class="key-field"><label title="${t("settings.poolAdvisorHelp")}">${t("settings.poolAdvisor")}</label><input id="ag-pool-advisor" type="number" min="1" value="${pool.advisor ?? 4}"></div>`
  html += `<div class="key-field"><label title="${t("settings.compactThresholdHelp")}">${t("settings.compactThreshold")}</label><input id="ag-compact" type="number" min="0" placeholder="auto" value="${as.compactThreshold ?? ""}"></div>`
  html += `<label class="switch" title="${t("settings.verifyGuardHelp")}"><input type="checkbox" id="ag-verifyguard" ${as.verifyGuard ? "checked" : ""}> ${t("settings.verifyGuard")}</label>`
  html += `<div class="settings-subtitle">${t("settings.submodelSection")}</div>`
  html += `<div class="key-field"><label title="${t("settings.submodelHelp")}">${t("settings.submodelGlobal")}</label><span id="submodel-slot-global" class="submodel-slot" data-value="${escHtml(as.subagentModel || "")}"></span></div>`
  html += `${["explore", "plan", "coder", "eng-coder", "eng-designer"].map((role) => `
    <div class="key-field"><label title="${t("settings.submodelHelp")}">${role}</label><span id="submodel-slot-${role}" class="submodel-slot" data-value="${escHtml(as.subagentModels?.[role] || "")}"></span></div>`).join("")}`
  html += `</div></section>`
  return html
}

/** Consult & Advisor card HTML. */
export function consultAdvisorCardHtml() {
  let html = ""
  // ─── Consult & Advisor card ───
  const as = SS.agentSettings || {}
  const adv = as.advisor || {}
  html += `<section class="settings-card"><h4 class="settings-card-title">${t("settings.consultAdvisorSection")}</h4><div class="settings-card-body">`
  html += `<div class="settings-subtitle" title="${t("settings.consultHelp")}">${t("settings.consultSection")}</div>`
  html += `<div id="consult-rows">`
  const liveRows = readConsultRowsFromDom()
  const consultRows = liveRows.length > 0 ? liveRows
    : (Array.isArray(as.consultModels) ? as.consultModels : [])
  for (const cm of consultRows) {
    const effortView = effortSelectView(cm?.model, cm?.effort)
    html += `<div class="key-field consult-row" data-provider="${escHtml(cm?.provider || "")}" data-model="${escHtml(cm?.model || "")}">`
    html += `<span class="consult-model-slot"></span>`
    html += effortView ? `<select class="consult-effort">${effortView.levels.map((e) => `<option value="${escHtml(e)}" ${effortView.selected === e ? "selected" : ""}>${escHtml(e)}</option>`).join("")}</select>` : ""
    html += `<button class="consult-del" title="${t("settings.consultRemove")}">✕</button></div>`
  }
  html += `</div>`
  html += `<div id="consult-status" class="consult-status">${Array.isArray(as.consultModels) && as.consultModels.length > 0 ? t("settings.consultActive", { n: as.consultModels.length }) : t("settings.consultInactive")}</div>`
  html += `<div id="agent-saved-badge" class="agent-saved-badge"></div>`
  html += `<button id="consult-add" class="key-btn" style="margin-top:4px">${t("settings.consultAdd")}</button>`
  html += `<div class="settings-subtitle">${t("settings.advisorSection")}</div>`
  html += `<label class="switch" title="${t("settings.advisorGuardHelp")}"><input type="checkbox" id="adv-guard" ${adv.guard === true ? "checked" : ""}> ${t("settings.advisorGuard")}</label>`
  const advProvider = adv.provider || ""
  html += `<div class="key-field"><label title="${t("settings.advisorProviderHelp")}">${t("settings.advisorProvider")}</label><span id="adv-model-slot" class="adv-model-slot" data-provider="${escHtml(advProvider)}" data-model="${escHtml(adv.model || "")}"></span></div>`
  {
    const advEffortView = effortSelectView(adv.model, adv.effort)
    if (advEffortView) html += `<div class="key-field"><label title="${t("settings.advisorEffortHelp")}">${t("settings.advisorEffort")}</label><select id="adv-effort">${advEffortView.levels.map((e) => `<option value="${escHtml(e)}" ${advEffortView.selected === e ? "selected" : ""}>${escHtml(e)}</option>`).join("")}</select></div>`
  }
  html += `<div class="settings-subtitle">${t("settings.consultBudgetSection")}</div>`
  html += `<div class="key-field"><label title="${t("settings.consultTurnsHelp")}">${t("settings.consultTurns")}</label><input id="consult-turns" type="number" min="1" value="${as.consultTurns ?? 40}"></div>`
  html += `<div class="key-field"><label title="${t("settings.consultTimeoutHelp")}">${t("settings.consultTimeout")}</label><input id="consult-timeout" type="number" min="1" value="${Math.round((as.consultTimeoutMs ?? 600000) / 60000)}"></div>`
  html += `</div></section>`
  return html
}

/** Bind the agent/consult/advisor controls: CHANGE-TO-SAVE (no submit button), then
 *  mount model-menu triggers into their slots + wire consult interactions. */
export function bindAgentControls() {
  // Agent/Advisor/Consult settings: CHANGE-TO-SAVE (no submit button).
  // Every control mutates → saveAgentSettings immediately (local config write, no debounce).
  const agCard = document.getElementById("ag-maxturns")?.closest(".settings-card")
  const buildAgentPayload = () => {
    const get = (id) => document.getElementById(id)?.value?.trim()
    const chk = (id) => document.getElementById(id)?.checked ?? false
    const compactRaw = get("ag-compact")
    const subModels = {}
    for (const role of ["explore", "plan", "coder", "eng-coder", "eng-designer"]) {
      const v = document.getElementById(`submodel-slot-${role}`)?.dataset.value || ""
      if (v) subModels[role] = v
    }
    const models = collectConsultRows()
    return {
      settings: {
        maxTurns: get("ag-maxturns") || undefined,
        subagentTurns: get("ag-subturns") || undefined,
        // §11.1/§11.2（R14/R13——POOL-CONFIG-UNIFIED 2026-09-09）：并发池三域容量——
        // null（未填/清空）→ 删键（回退默认 4/4/4）
        poolLimits: (() => {
          const eng = get("ag-pool-engcoder")
          const other = get("ag-pool-other")
          const adv = get("ag-pool-advisor")
          const pl = {}
          const n = (v) => { const x = Number(v); return Number.isInteger(x) && x >= 1 ? x : null }
          const en = n(eng)
          const ot = n(other)
          const ad = n(adv)
          if (en !== null) pl.engCoder = en
          if (ot !== null) pl.other = ot
          if (ad !== null) pl.advisor = ad
          return Object.keys(pl).length > 0 ? pl : null
        })(),
        // null (not undefined): postMessage JSON-serializes and DROPS undefined keys — a
        // cleared value must reach the extension as an explicit null to delete it. Same
        // rule for the advisor slots below: config-io now BACKFILLS missing advisor keys
        // from disk (GitHub #3), so a dropped key would silently resurrect the old value.
        subagentModel: document.getElementById("submodel-slot-global")?.dataset.value || null,
        subagentModels: subModels,
        compactThreshold: compactRaw === "" ? "" : (compactRaw || undefined),
        consultTurns: get("consult-turns") || undefined,
        consultTimeoutMs: (() => { const m = get("consult-timeout"); return m ? String(Math.round(Number(m) * 60000)) : undefined })(),
        verifyGuard: chk("ag-verifyguard"),
        advisor: {
          guard: chk("adv-guard"),
          // null (not undefined) for empty slots: JSON serialization drops undefined
          // keys, so "slot missing" and "explicitly cleared" would arrive identical —
          // missing now BACKFILLS from config.json (GitHub #3), only null clears.
          provider: document.getElementById("adv-model-slot")?.dataset.provider || null,
          model: document.getElementById("adv-model-slot")?.dataset.model || null,
          // 落盘归一：「—」（未注册占位）/ `none`（= 关思考）/ 空 ⇒ null（删键不写字面——§14.10）
          effort: effortPayloadValue(document.getElementById("adv-effort")?.value),
        },
        consultModels: models,
      },
    }
  }
  // Direct save on change — the payload writes a few KB to config.json (local IO);
  // change events fire once per completed interaction, so no debounce is needed.
  // The consult-echo race is handled by the shadow merge below, not by timing.
  const autoSaveAgent = () => {
    try {
      const { settings } = buildAgentPayload()
      // Optimistic merge: the shadow IS what we just saved — merge the whole payload so
      // push echoes and later rebuilds never resurrect a value the user just cleared.
      SS.agentSettings = { ...(SS.agentSettings || {}), ...settings }
      window._vscode.postMessage({ type: "saveAgentSettings", settings })
      // The status line renders once at panel build; the panel no longer rebuilds on push
      // (by design) — sync it here so adding the first consult model flips OFF → active.
      const status = document.getElementById("consult-status")
      if (status) {
        const n = settings.consultModels?.length ?? 0
        status.textContent = n > 0 ? t("settings.consultActive", { n }) : t("settings.consultInactive")
      }
      const badge = document.getElementById("agent-saved-badge")
      if (badge) { badge.textContent = t("settings.autoSaved"); badge.classList.add("visible"); setTimeout(() => badge.classList.remove("visible"), 1200) }
    } catch (e) { console.error("[settings] agent auto-save failed:", e) }
  }
  agCard.querySelectorAll("input, select").forEach((el) => el.addEventListener("change", autoSaveAgent))
  // Consult & Advisor is a SEPARATE card since the reorg — its static controls live outside
  // agCard and must be bound explicitly (adv-guard was silently unbound after the
  // split; consult-turns/consult-timeout are new). Consult rows and the advisor model slot
  // already save via fireAgentSave/consult-rows-changed, so only these three need binding here.
  for (const id of ["adv-guard", "consult-turns", "consult-timeout"]) {
    document.getElementById(id)?.addEventListener("change", autoSaveAgent)
  }
  // 交付评审 🔴（GitHub #3 batch, 2026-08-29）：静态渲染的 effort select（adv-effort + 各
  // consult 行的 .consult-effort）由 innerHTML 生成、不在上面任何绑定路径里——只有 model
  // pick 后 refreshAdvisorEffort/refreshRowEffort 替换出的 select 才带监听。用户只改档位
  // 不碰 model → 静默不保存（与当年 adv-guard 同类的 split 断链）。绑定 build 时存在的
  // 全部 effort select；替换件自带监听，这里不会重复。
  document.getElementById("adv-effort")?.addEventListener("change", autoSaveAgent)
  document.querySelectorAll("#consult-rows .consult-effort").forEach((el) => el.addEventListener("change", autoSaveAgent))
  document.getElementById("consult-rows")?.addEventListener("consult-rows-changed", autoSaveAgent)
  // Mount model-menu triggers into their slots + wire consult interactions
  try { mountModelMenus(); bindConsultRows() } catch (e) { console.error("[settings] model-menu mount failed:", e) }
}

export function updateAgentSettings(settings) {
  SS.agentSettings = { ...(SS.agentSettings || {}), ...settings }
}
