/**
 * migrate-settings.mjs — VS Code glue for the one-time legacy migration.
 * The migration logic itself is pure (config-io.mjs migrateCore) and unit-tested there;
 * this file only wires VS Code SecretStorage / settings / globalState into it.
 */

import * as vscode from "vscode"
import { migrateCore } from "../config-io.mjs"

const FLAG_KEY = "thincoder.configMigrated"

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
  })
}
