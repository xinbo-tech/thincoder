/**
 * provider-flows.mjs — provider add/remove/active/key management (CLI flow parity).
 *
 * Two entry paths share the same pure persistence functions:
 *  1. QuickPick flows (addProviderFlow / removeProviderFlow / setKeyFlow) — the model
 *     dropdown's shortcut entries; VS Code QuickPick/InputBox stand in for the CLI picker.
 *  2. Settings panel messages (addProvider / removeProvider / setProviderProxy) — the
 *     panel posts a payload straight to the pure functions (no UI round-trip on the host).
 *
 * W16：纯持久化函数（addProviderEntry / removeProviderEntry / setProviderKey / cascadeRemoveProvider）
 * = **核单源**（`@thincoder/core/config-io.mjs`——CORE-UNIFICATION §2.5 #177「纯持久化函数取
 * 一侧 + UI 壳按端注入」）；本档只保留 UI 壳（QuickPick/InputBox）与 M9 准入探。
 * Persistence semantics are identical to the CLI (config.json providers[] with a single
 * `model` default per channel + defaultModel — MODEL-SELECTION（2026-09-10）：候选清单字段
 * `models[]` 已退场——候选面 = 运行期 `/models` 拉取）。
 */

import * as vscode from "vscode"
import { PROVIDER_PRESETS } from "@thincoder/core/config.mjs"
import { addProviderEntry, removeProviderEntry, setProviderKey, resolveProviders } from "@thincoder/core/config-io.mjs"
import { probeTargetFromEntry } from "./presets.mjs"
import { probeChannelModels, channelUnavailableMessage } from "@thincoder/core/provider/list-models.mjs"
import { overrideAdmissionIfHostBusy } from "./loop-sampler.mjs"

// 纯持久化函数面：核单源 re-export（既有调用方 import 面不变——settings.mjs / 测试）。
export { addProviderEntry, removeProviderEntry }

/** M9 渠道准入探（配置写入面）：对目标渠道探一次 `GET /models`。
 *  探通 → 渠道可用（探得候选可直接用）；探不通 → 记录失败展示态（providerStatus 行
 *  `不可用` + 失败消息本体）并返回失败消息供调用方提示。**绝不抛出、绝不阻断任何写**；
 *  失败不缓存——下次配置动作重探。 */
export async function probeProviderAdmission(name) {
  if (!name) return { ok: false, error: "provider name is required" }
  try {
    const { providers } = resolveProviders()
    const entry = providers.find((p) => p.name === name)
    if (!entry) return { ok: false, error: `Unknown provider "${name}"` }
    const r = await probeChannelModels(name, probeTargetFromEntry(entry))
    // F-W19（`SETTINGS.md` §2.12 / `PROVIDER.md` §6.16 M8/M9 补）：核分类只知超时 / 畸形；
    // 宿主忙 = 端侧证据 ⇒ 覆盖落账分类为 `hostBusy`（`reason` 逐字不动；返回面零扩张）。
    if (!r.ok) overrideAdmissionIfHostBusy(name, r.error)
    return r
  } catch (e) {
    return { ok: false, error: channelUnavailableMessage(e) }
  }
}

/** M9：探一次并在失败时界面明示失败消息（消息本体逐字长句）——不阻断已完成的保存。 */
async function reportAdmission(name) {
  const probe = await probeProviderAdmission(name)
  if (!probe.ok) vscode.window.showWarningMessage(probe.error)
  return probe
}

// ─── QuickPick flows (model dropdown shortcuts) ───

const FORMATS = ["openai", "anthropic", "google"]

/** Add a provider interactively: pick an unused preset or configure custom manually. */
export async function addProviderFlow(refresh) {
  let providers
  try {
    ({ providers } = resolveProviders())
  } catch (e) {
    vscode.window.showErrorMessage(e.message)
    return
  }
  const existing = new Set(providers.map((p) => p.name))

  const items = Object.entries(PROVIDER_PRESETS)
    .filter(([name]) => !existing.has(name))
    .map(([name, p]) => ({ label: name, description: p.desc, detail: p.model ?? "", kind: "preset", name }))
  items.push({ label: "Custom (manual config)", description: "enter baseURL/model/format", kind: "custom" })

  const sel = await vscode.window.showQuickPick(items, {
    placeHolder: "Add provider — select a preset",
    matchOnDescription: true, matchOnDetail: true,
  })
  if (!sel) return

  if (sel.kind === "custom") {
    const name = (await vscode.window.showInputBox({
      prompt: "Provider name",
      validateInput: (v) => {
        const n = (v || "").trim()
        if (!n) return "Name is required"
        if (existing.has(n) || PROVIDER_PRESETS[n]) return "Name already in use"
        return null
      },
    }))?.trim()
    if (!name) return
    const baseURL = (await vscode.window.showInputBox({
      prompt: `Base URL for ${name}`,
      placeHolder: "https://api.example.com/v1",
    }))?.trim()
    if (!baseURL) return
    const model = (await vscode.window.showInputBox({ prompt: `Model name for ${name}` }))?.trim()
    if (!model) return
    const format = await vscode.window.showQuickPick(
      FORMATS.map((f) => ({ label: f, description: f === "openai" ? "(default)" : f === "anthropic" ? "Messages API" : "streamGenerateContent" })),
      { placeHolder: "API format" },
    )
    if (!format) return
    const err = addProviderEntry({ custom: { name, baseURL, model, format: format.label } })
    if (err) { vscode.window.showErrorMessage(err); return }
    const key = await vscode.window.showInputBox({ prompt: `API key for ${name} (leave empty to skip)`, password: true })
    if (key?.trim()) {
      const kerr = setProviderKey(name, key.trim())
      if (kerr) { vscode.window.showErrorMessage(kerr); return } // F5b：config 并发被改——放弃 + 提示重试
    }
    await refresh?.()
    await reportAdmission(name) // M9：加渠道的配置写入面——探一次 /models（失败标不可用，不阻断保存）
    return
  }

  // Preset: entry auto-filled from PROVIDER_PRESETS, then ask for a key
  const err = addProviderEntry({ preset: sel.name })
  if (err) { vscode.window.showErrorMessage(err); return }
  const key = await vscode.window.showInputBox({ prompt: `API key for ${sel.name} (leave empty to skip)`, password: true })
  if (key?.trim()) {
    const kerr = setProviderKey(sel.name, key.trim())
    if (kerr) { vscode.window.showErrorMessage(kerr); return } // F5b：冲突放弃提示重试
  }
  await refresh?.()
  await reportAdmission(sel.name) // M9：同上
}

/** Remove a provider interactively (active one is not listed, CLI parity). */
export async function removeProviderFlow(refresh) {
  let providers, activeProvider
  try {
    ({ providers, activeProvider } = resolveProviders())
  } catch (e) {
    vscode.window.showErrorMessage(e.message)
    return
  }
  const candidates = providers.filter((p) => p.name !== activeProvider)
  if (candidates.length === 0) {
    vscode.window.showInformationMessage("No removable providers — the active provider is kept.")
    return
  }
  const sel = await vscode.window.showQuickPick(
    candidates.map((p) => ({ label: p.name, description: p.model ?? "" })),
    { placeHolder: "Remove provider" },
  )
  if (!sel) return
  const err = removeProviderEntry(sel.label)
  if (err) vscode.window.showErrorMessage(err)
  else await refresh?.()
}

/** Set / replace an API key for a configured provider. */
export async function setKeyFlow(refresh) {
  let providers
  try {
    ({ providers } = resolveProviders())
  } catch (e) {
    vscode.window.showErrorMessage(e.message)
    return
  }
  if (providers.length === 0) return
  const sel = await vscode.window.showQuickPick(
    providers.map((p) => ({ label: p.name, description: p.apiKey ? "(has key)" : "(no key)" })),
    { placeHolder: "Set API key for provider" },
  )
  if (!sel) return
  const key = await vscode.window.showInputBox({ prompt: `API key for ${sel.label}`, password: true })
  if (key?.trim()) {
    const kerr = setProviderKey(sel.label, key.trim())
    if (kerr) { vscode.window.showErrorMessage(kerr); return } // F5b：config 并发被改——放弃 + 提示重试
    await refresh?.()
  }
  await reportAdmission(sel.label) // M9：设 API key 的配置写入面——探一次 /models（失败标不可用，不阻断保存）
}
