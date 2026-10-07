/**
 * provider-flows.mjs — provider 删 ∕ 密钥两流程 + 渠道准入探针（**薄壳** —— parity-b4 W1）：
 * 本体核单源 `@thincoder/core/provider-flows.mjs`（流程步序 ∕ 字段校验 ∕ 拒因串 ∕ 探针语义逐字随迁）。
 * 本档只承宿主壳：
 *  ① UI 壳（`vscode.window.*` ⇒ `ui` 注入——QuickPick ∕ InputBox 逐点同旧）；
 *  ② F-W19 宿主忙证据（`loop-sampler.mjs` `overrideAdmissionIfHostBusy` 经核 `deps.hostBusyOverride` 缝注入——
 *     宿主证据语义不变；核零宿主事件循环观测）。
 * 纯持久化函数面 = 核单源 re-export（既有调用方 import 面不变）。
 * 加流程包装（`addProviderFlow`）随添加入口弹窗统一批（#1054）净删——宿主唯一调用点 = `addProvider`
 * 无载荷支（QuickPick 增流程），同批退场；核流程 ∥ CLI 交互面零动（CLI 仍走核 `addProviderFlow`）。
 */
import * as vscode from "vscode"
import {
  removeProviderFlow as coreRemoveProviderFlow,
  setKeyFlow as coreSetKeyFlow, probeProviderAdmission as coreProbeProviderAdmission,
} from "@thincoder/core/provider-flows.mjs"
import { overrideAdmissionIfHostBusy } from "./loop-sampler.mjs"

// 纯持久化函数面：核单源 re-export（既有调用方 import 面不变——settings.mjs / 测试）。
export { addProviderEntry, removeProviderEntry } from "@thincoder/core/config-io.mjs"

/** 宿主 UI 壳（两流程注入件；占位串 ∕ `password` ∕ quickpick 项形随核件）。 */
export const ui = {
  pick: (items, opts) => vscode.window.showQuickPick(items, opts),
  input: (opts) => vscode.window.showInputBox(opts),
  error: (m) => vscode.window.showErrorMessage(m),
  warn: (m) => vscode.window.showWarningMessage(m),
  info: (m) => vscode.window.showInformationMessage(m),
}

/** F-W19 宿主证据缝（`SETTINGS.md` §2.12：宿主忙 ⇒ 落账分类覆盖；`reason` 逐字不动）。 */
const deps = { hostBusyOverride: overrideAdmissionIfHostBusy }

/** 两流程（核件 + 宿主证据缝）：调用形 = `removeProviderFlow(ui, refresh)` ∥ `setKeyFlow(ui, refresh)`。 */
export function removeProviderFlow(host, refresh) { return coreRemoveProviderFlow(host, refresh) }
export function setKeyFlow(host, refresh) { return coreSetKeyFlow(host, refresh, deps) }

/** M9 渠道准入探（配置写入面；返形 `{ ok, models }` ∕ `{ ok, error }` 与旧同——消费面零改）。 */
export function probeProviderAdmission(name) { return coreProbeProviderAdmission(name, deps) }
