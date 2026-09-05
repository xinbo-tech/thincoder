/**
 * prompt-overlays.mjs — prompt overlay 载荷（2026-09-05 module-split：agent.mjs
 * 530 > 500 硬限——explore/coder/plan/eng-coder/consult 角色 overlay 的读取与导出
 * verbatim 迁入；agent.mjs re-export 保 import 面（subagent-actions.mjs /
 * setup.mjs 动态 import 零改）。byte-stable：prompts/*.md 文件内容一次性读取。
 */

import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Prompt files (byte-stable, loaded once)
let _EXPLORE, _CODER, _PLAN, _ENG_CODER, _CONSULT_BASE
try { _EXPLORE = readFileSync(join(__dirname, "prompts", "explore.md"), "utf8") } catch { _EXPLORE = "" }
try { _CODER = readFileSync(join(__dirname, "prompts", "coder.md"), "utf8") } catch { _CODER = "" }
try { _PLAN = readFileSync(join(__dirname, "prompts", "plan.md"), "utf8") } catch { _PLAN = "" }
try { _ENG_CODER = readFileSync(join(__dirname, "prompts", "eng-coder.md"), "utf8") } catch { _ENG_CODER = "" }
try { _CONSULT_BASE = readFileSync(join(__dirname, "prompts", "consult-base.md"), "utf8") } catch { _CONSULT_BASE = "" }
export const EXPLORE_OVERLAY = _EXPLORE
export const CODER_OVERLAY = _CODER
export const PLAN_OVERLAY = _PLAN
export const ENG_CODER_OVERLAY = _ENG_CODER
export const CONSULT_BASE = _CONSULT_BASE
