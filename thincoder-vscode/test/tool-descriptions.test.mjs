/**
 * tool-descriptions.test.mjs — VSC-CONTEXT-PARITY 批 R4（工具描述外部装载 25 档 `.md` 迁移）
 * 机判：T-TD-2 / T-TD-3（T-TD-1 / T-TD-4 已退役）。设计权威 = VSC 仓 `docs/design/TOOLS.md` §12（D-TD1/D-TD2/D-TD3 +
 * §12.5 用例表 + §12.6 AC-TD-1/AC-TD-2）；需求 = `TOOLS（CLI 仓）` F7 / N9。
 *
 * 2026-09-12 PROSE-ANCHOR-RETIRE：T-TD-1 / T-TD-4 整删 + T-TD-2 / T-TD-3 段删——读非测试档文本断言
 *（逐字全文 / 路由段子串 / 内联残留扫描 / 排除模式）属散文锚（判据见 CLI 侧设计档 TESTING.md §11）。
 * 口径：T-TD-2 文件面（25 档 `.md` 在位）；T-TD-3 结构面（17 档接线文件的工具级 description 计数 == 25）。
 * 接线文件清单 = §12.3 D-TD2 落点（实现自扫更正：`edit` 宿主 = `file-edit.mjs`，非 file.mjs）。
 *
 * W2（2026-09-15 · `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W2）：本端 `src/tools/*.md` 25 档已删 ⇒
 * 承载面 = 核包 `tool-docs/`（单一解析面 `loadToolDoc`——`ASC` 改指核）；T-TD-4' 新增 = 描述面**注入值**
 * （`bash-terminal-face` / `question-ui-face` 两锚的本端值 + 25 档零 `{{inject:` 字面——§2.13.2 / A-K5；
 * 四装配面零字面与 13 锚在场的总面断言 = `test/prompts-async-guidance.test.mjs` 锚面②/④）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"
import { TOOL_DOCS_DIR, configurePromptInjections, resetPromptInjections } from "@thincoder/core/prompt-files.mjs"
import { toOpenAISchema, builtinTools } from "../src/tools/index.mjs"
import { VSC_PROMPT_INJECTIONS } from "../src/prompt-injections.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__here, "..")
const TOOLS_DIR = join(ROOT, "src", "tools")
/** 核工具实现面目录（W14 改判的接线落点——25 工具级 DESC 行的新承载面）。 */
const CORE_TOOLS_DIR = dirname(createRequire(import.meta.url).resolve("@thincoder/core/tools/index.mjs"))

/** D-TD1：25 档迁移面（文件名 = 工具名）——W2 起读核包 `tool-docs/`。 */
const MIGRATED = [
  "apply_patch", "bash", "checklist", "delete", "edit", "execute", "fetch", "file_ops",
  "get_current_time", "git", "glob", "grep", "hashline_edit", "insert_after", "lint", "ls",
  "lsp", "process", "question", "read", "read_image", "tree", "wait_for", "websearch", "write",
]
/** D-TD3：非迁移面（保持内联——本批零改）。 */
const INLINE_KEPT = ["repo_outline", "code_search", "doc_search", "memory", "context", "focus", "peer_instances"]
/** D-TD2 接线落点（W14 改判——工具实现面核单源）：25 工具级 DESC 行现住核 `tools/*.mjs`
 *  （端侧 17 档接线文件中的 16 档已随 W14 删除——`shell.mjs` 保留但描述亦引核 DESC）。 */
const CORE_WIRING_FILES = [
  "bash.mjs", "checklist.mjs", "execute.mjs", "file.mjs", "git.mjs", "linter.mjs", "lsp.mjs",
  "ops.mjs", "patch.mjs", "question.mjs", "search.mjs", "tree.mjs", "web.mjs",
]

test("T-TD-2 边界：核包 tool-docs/ 25 档在位（本端 src/tools/*.md 已删——描述面 = 核单点）", () => {
  for (const name of MIGRATED) assert.ok(existsSync(join(TOOL_DOCS_DIR, `${name}.md`)), `${name}.md 缺失（核包 tool-docs/）`)
  for (const name of MIGRATED) assert.ok(!existsSync(join(TOOLS_DIR, `${name}.md`)), `${name}.md 本端副本未删净`)
})

test("T-TD-3（W14 改判）：25 工具级描述 = 核工具模块 DESC 行（端侧镜像已删）", () => {
  assert.equal(CORE_WIRING_FILES.length, 13, "核接线文件清单 = 13 档（承载 25 工具级 DESC）")
  let descHits = 0
  for (const f of CORE_WIRING_FILES) {
    const lines = readFileSync(join(CORE_TOOLS_DIR, f), "utf8").split("\n")
    descHits += lines.filter((l) => /^  description: DESC\("/.test(l)).length
  }
  assert.equal(descHits, 25, `工具级 DESC 命中数 = 25（实 ${descHits}）`)
})

test("T-TD-4' 描述面注入值：配置态 25 工具描述零锚字面 + 本端两锚值在场（§2.13.2「VSC 列」）", () => {
  try {
    configurePromptInjections(VSC_PROMPT_INJECTIONS)
    const schemas = builtinTools.map(toOpenAISchema)
    for (const s of schemas) assert.ok(!String(s.function.description).includes("{{inject:"), `${s.function.name}: 描述零锚字面`)
    const descOf = (name) => String(schemas.find((s) => s.function.name === name).function.description)
    assert.ok(descOf("bash").includes('terminal: "visible"'), "bash: VSC 终极端参数行在场")
    const avail = descOf("question").match(/Availability/g) ?? []
    assert.equal(avail.length, 1, "question: Availability 行恰一份（替换非追加）")
    assert.ok(descOf("question").includes("inline question card"), "question: 面板措辞在场")
  } finally { resetPromptInjections() }
})
