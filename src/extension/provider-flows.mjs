/**
 * provider-flows.mjs — provider add/remove/active/key management (CLI flow parity).
 *
 * Two entry paths share the same pure persistence functions:
 *  1. QuickPick flows (addProviderFlow / removeProviderFlow / setKeyFlow) — the model
 *     dropdown's shortcut entries; VS Code QuickPick/InputBox stand in for the CLI picker.
 *  2. Settings panel messages (addProvider / removeProvider / setProviderProxy) — the
 *     panel posts a payload straight to the pure functions (no UI round-trip on the host).
 *
 * Persistence semantics are identical to the CLI (config.json providers[] + activeProvider).
 */

import * as vscode from "vscode"
import { PROVIDER_PRESETS, presetToEntry, resolveProviders, persistRaw, conflictError, setProviderKey } from "../config-io.mjs"

const FORMATS = ["openai", "anthropic", "google"]

// ─── Pure persistence (no UI) — return an error string, or null on success ───

/** Add a provider entry. payload: { preset?: name, custom?: { name, baseURL, model, format }, key? } */
export function addProviderEntry({ preset, custom, key } = {}) {
  let providers
  try {
    ({ providers } = resolveProviders())
  } catch (e) {
    return e.message
  }
  const existing = new Set(providers.map((p) => p.name))

  let entry
  if (preset) {
    if (!PROVIDER_PRESETS[preset]) return `Unknown preset: ${preset}`
    if (existing.has(preset)) return `Provider "${preset}" already exists`
    entry = presetToEntry(preset)
  } else if (custom) {
    const name = (custom.name || "").trim()
    if (!name) return "Provider name is required"
    if (existing.has(name) || PROVIDER_PRESETS[name]) return `Name "${name}" is already in use`
    const baseURL = (custom.baseURL || "").trim().replace(/\/+$/, "")
    if (!baseURL) return "Base URL is required"
    const model = (custom.model || "").trim()
    if (!model) return "Model is required"
    const format = (custom.format || "openai").trim()
    if (!FORMATS.includes(format)) return `Unknown API format: ${format} (expected ${FORMATS.join("/")})`
    entry = { name, baseURL, model }
    if (format !== "openai") entry.format = format
  } else {
    return "Add provider needs a preset or a custom config"
  }

  const r = persistRaw((raw) => { (raw.providers ??= []).push(entry) })
  const err = conflictError(r)
  if (err) return err // F5b：config 被并发方改过——放弃 + 提示重试（决策① A）
  const k = (key || "").trim()
  if (k) setProviderKey(entry.name, k)
  return null
}

/** Remove a provider entry. The active provider is protected (CLI parity). */
export function removeProviderEntry(name) {
  let providers, activeProvider
  try {
    ({ providers, activeProvider } = resolveProviders())
  } catch (e) {
    return e.message
  }
  if (!providers.some((p) => p.name === name)) return `No provider named "${name}"`
  if (name === activeProvider) return "The active provider cannot be removed — switch active first"
  const r = persistRaw((raw) => { raw.providers = (raw.providers ?? []).filter((p) => p?.name !== name) })
  return conflictError(r) // F5b：冲突 → 错误串提示（调用方 providerError 通道展示）
}

// ─── QuickPick flows (model dropdown shortcuts) ───

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
    .map(([name, p]) => ({ label: name, description: p.desc, detail: p.model, kind: "preset", name }))
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
    candidates.map((p) => ({ label: p.name, description: p.model })),
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
}
