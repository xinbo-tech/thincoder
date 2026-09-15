/**
 * migrate-settings.mjs — VS Code glue for the one-time legacy migration.
 * The migration logic itself is pure（W16：核单源 `@thincoder/core/config-migrate.mjs` 的
 * `migrateCore`——依赖面（loadRaw / saveRaw / conflictError / 预设表）由调用方注入，核内契约
 * 见该档头注）；本档只接 VS Code SecretStorage / settings / globalState + 依赖供值。
 */

import * as vscode from "vscode"
import { migrateCore } from "@thincoder/core/config-migrate.mjs"
import { loadRaw, conflictError } from "@thincoder/core/config-io.mjs"
import { PROVIDER_PRESETS, presetToEntry } from "@thincoder/core/config.mjs"
import { vscPersistRaw } from "./settings-panel-write.mjs"

const FLAG_KEY = "thincoder.configMigrated"

/** 核 migrateCore 的 saveRaw 契约：整对象写回（本端写盘通道 = `vscPersistRaw`——含 `$schema`
 *  注入；冲突 → `{ ok:false, reason:"mtime-conflict" }` 透传）。 */
const saveRaw = (raw) => vscPersistRaw((r) => {
  for (const k of Object.keys(r)) delete r[k]
  Object.assign(r, raw)
})

/** Run the one-time migration. Safe to call repeatedly (flag-guarded). */
export async function migrateLegacySettings(context) {
  const cfg = vscode.workspace.getConfiguration("thincoder")
  await migrateCore({
    secrets: {
      get: (key) => context.secrets.get(key),
      delete: (key) => context.secrets.delete(key),
    },
    flags: {
      get: async () => !!context.globalState.get(FLAG_KEY),
      set: async () => { await context.globalState.update(FLAG_KEY, true) },
    },
    legacySettings: cfg.get("providers"),
    clearLegacySettings: async () => { await cfg.update("providers", undefined, vscode.ConfigurationTarget.Global) },
    // 核内单一读写面 + 预设表（W16：核 migrateCore 依赖注入契约）
    loadRaw,
    saveRaw,
    conflictError,
    presets: PROVIDER_PRESETS,
    presetToEntry,
  })
}
