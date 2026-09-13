/**
 * embed-config.mjs — shared embedding config (used by chat-panel, code tools, memory tools)
 *
 * Config source: ~/.thincoder/config.json (shared with CLI) — env vars are NOT a key source.
 * (Legacy VS Code SecretStorage keys are migrated into config.json by migrate-settings.mjs)
 */

import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"
import { createEmbedder } from "./embedding.mjs"

let _embedder = null
let _tried = false

/** Get or create the embedder. Returns null if not configured. */
export function getEmbedder() {
  if (_tried) return _embedder
  _tried = true

  // 1) CLI config
  const configPath = join(homedir(), ".thincoder", "config.json")
  try {
    if (existsSync(configPath)) {
      const cfg = JSON.parse(readFileSync(configPath, "utf8"))
      if (cfg.embedding?.apiKey && cfg.embedding?.baseURL && cfg.embedding?.model) {
        _embedder = createEmbedder(cfg.embedding)
        return _embedder
      }
    }
  } catch {}

  return _embedder
}

/**
 * Set embedder from VSCode SecretStorage (called by ChatPanel after resolving key).
 * Also calls getEmbedder() first to check CLI/env as fallback.
 */
export function setVSCodeEmbedder({ baseURL, model, apiKey }) {
  if (apiKey && baseURL && model) {
    try { _embedder = createEmbedder({ baseURL, model, apiKey }) } catch {}
  }
  _tried = true
}

/** Reset cache (after config changes) */
export function resetEmbedder() {
  _embedder = null
  _tried = false
}
