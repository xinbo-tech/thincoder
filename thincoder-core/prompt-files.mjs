/**
 * prompt-files.mjs — the core's SINGLE prompt-face resolution module (CORE-UNIFICATION D-C13).
 *
 * Root = `import.meta.url` (this module's own location) — never cwd / env vars / package-name
 * resolution — so the same code resolves identically in all three delivery states
 * (dev `npm link` / npm install / vsix embed). Callers never do path arithmetic (contract 8).
 *
 * Missing-file semantics are preserved PER CALLER (contract 9 — the B4 readings) and are
 * deliberately NOT unified:
 *   - slot prompts    → silent "" (the assembly layer emits the warning)  [loadSlot]
 *   - advisor prompts → throw (a broken installation must stay visible)   [loadAdvisorPrompt]
 *   - tool docs       → throw (the `DESC()` face has no try)              [loadToolDoc]
 *   - consult base    → loaded through the slot chain (silent); the CONSUME point throws
 *
 * Prompt content lives in `prompts/` (slot prompts) and `tool-docs/` (tool descriptions);
 * both are `files` whitelist entries of the core package (D-C10 — assertion D's object).
 *
 * Injection anchors — `{{inject:<name>}}` — are resolved by the seam at the bottom of this file
 * (CORE-UNIFICATION §2.13.8, U0): the four assembly faces apply it at CALL time; the host end
 * supplies values via `configurePromptInjections`. Unconfigured = identity; missing key = throw.
 */

import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = dirname(fileURLToPath(import.meta.url))

/** Core package-internal `prompts/` directory (slot prompts + advisor prompts). */
export const PROMPTS_DIR = join(ROOT, "prompts")
/** Core package-internal `tool-docs/` directory (tool descriptions). */
export const TOOL_DOCS_DIR = join(ROOT, "tool-docs")

/**
 * Slot prompt (`prompts/<name>`) — missing file ⇒ "" (silent). The caller (the assembly
 * layer) owns the warning: contract 9 keeps 槽位 ⇒ 静默空串 + 装配期警告.
 */
export function loadSlot(name) {
  try { return readFileSync(join(PROMPTS_DIR, name), "utf8") } catch { return "" }
}

/**
 * Advisor prompt (`prompts/<name>`) — missing file ⇒ throw. Hard-loaded: a missing advisor
 * prompt means a broken installation (silently degrading to a lesser prompt would strip the
 * review criteria / approval-signal rules).
 */
export function loadAdvisorPrompt(name) {
  try {
    return readFileSync(join(PROMPTS_DIR, name), "utf8")
  } catch {
    throw new Error(`${name} missing from the installation (prompts/${name}) — reinstall the package or restore the file`)
  }
}

/**
 * Tool description (`tool-docs/<name>.md`) — missing file ⇒ throw (the `DESC()` face reads
 * the file without a try: a silently empty tool description is not acceptable).
 */
export function loadToolDoc(name) {
  return readFileSync(join(TOOL_DOCS_DIR, `${name}.md`), "utf8")
}

/**
 * Consult base — loaded through the slot chain (silent, exactly like `loadSlot`); the
 * CONSUME point throws when the value is empty (contract 9 / B4). It is NOT a separate
 * throw face here.
 */
export function loadConsultBase() {
  return loadSlot("consult-base.md")
}

// ────────────────────────────────────────
// 锚替换原语（核内缝——CORE-UNIFICATION §2.13.8「U0 前置笔」）
// ────────────────────────────────────────
// 替换执行 = 核内单点（本档）；应用 = 四装配面**调用期**（`prompt-overlays.mjs` / `tools/shared.mjs` /
// `advisor.mjs`）；供值 = 端侧 `configurePromptInjections`。核内零端名（契约 5 / 10）。
// 三态（无第四出口）：未配置 ⇒ 恒等（现行行为零变）· 命中 ⇒ 表值替换（空串 = 显式「本端为空」）·
// 缺键 ⇒ **抛错**（fail-loud——配置即声明「本端已接管锚」，静默放行 = 锚字面进模型）。
// 单遍替换（替换值不再展开）；表**多余键 no-op**。

/** 锚文法（与 `test/core-prompt-face.test.mjs` 的合法形断言同源）。 */
const INJECT_ANCHOR_RE = /\{\{inject:([a-z0-9-]+)\}\}/g

/** 本端取值表；null = 未配置（缺省——零替换）。 */
let promptInjections = null

/**
 * 注册本端取值表（**端侧入口装配层**调用一次；核内不调用——缺省不覆盖）。
 * @param {{[anchor: string]: string}|null} map — `{ "<锚名>": "<替换文本>" }`（值可为空串）；
 *   null / undefined ⇒ 撤销注入。表在注册时快照。
 */
export function configurePromptInjections(map) {
  promptInjections = map ? new Map(Object.entries(map)) : null
}

/** 撤销注入（测试与端装配生命周期用——缺省态 = 零替换）。 */
export function resetPromptInjections() { promptInjections = null }

/**
 * 替换原语：扫 `{{inject:<name>}}`——未配置 ⇒ 恒等；命中 ⇒ 表值替换；缺键 ⇒ 抛错（消息含锚名）。
 * 非字符串输入恒等返回（无锚可替换）；单遍（回调式 replace——替换值不进扫描）。
 * @param {string} text
 * @returns {string}
 */
export function applyPromptInjections(text) {
  if (!promptInjections || typeof text !== "string") return text
  return text.replace(INJECT_ANCHOR_RE, (_, name) => {
    if (!promptInjections.has(name)) {
      throw new Error(`prompt injection anchor {{inject:${name}}} has no value in the configured table — every anchor this end ships must be configured (fail-loud)`)
    }
    return promptInjections.get(name)
  })
}
