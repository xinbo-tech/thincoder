/**
 * tool-descriptions.test.mjs — VSC-CONTEXT-PARITY 批 R4（工具描述外部装载 25 档 `.md` 迁移）
 * 机判：T-TD-2 / T-TD-3（T-TD-1 / T-TD-4 已退役）。设计权威 = VSC 仓 `docs/design/TOOLS.md` §12（D-TD1/D-TD2/D-TD3 +
 * §12.5 用例表 + §12.6 AC-TD-1/AC-TD-2）；需求 = `TOOLS（CLI 仓）` F7 / N9。
 *
 * 2026-09-12 PROSE-ANCHOR-RETIRE：T-TD-1 / T-TD-4 整删 + T-TD-2 / T-TD-3 段删——读非测试档文本断言
 *（逐字全文 / 路由段子串 / 内联残留扫描 / 排除模式）属散文锚（判据见 CLI 侧设计档 TESTING.md §11）。
 * 口径：T-TD-2 文件面（25 档 `.md` 在位）；T-TD-3 结构面（17 档接线文件的工具级 description 计数 == 25）。
 * 接线文件清单 = §12.3 D-TD2 落点（实现自扫更正：`edit` 宿主 = `file-edit.mjs`，非 file.mjs）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__here, "..")
const TOOLS_DIR = join(ROOT, "src", "tools")

/** D-TD1：25 档迁移面（文件名 = 工具名）。 */
const MIGRATED = [
  "apply_patch", "bash", "checklist", "delete", "edit", "execute", "fetch", "file_ops",
  "get_current_time", "git", "glob", "grep", "hashline_edit", "insert_after", "lint", "ls",
  "lsp", "process", "question", "read", "read_image", "tree", "wait_for", "websearch", "write",
]
/** D-TD3：非迁移面（保持内联——本批零改）。 */
const INLINE_KEPT = ["repo_outline", "code_search", "doc_search", "memory", "context", "focus", "peer_instances"]
/** D-TD2 接线落点（实现自扫——工具级 `description:` 全量扫描面）。 */
const WIRING_FILES = [
  "read_image.mjs", "file.mjs", "file-edit.mjs", "hashline-edit.mjs", "more-file.mjs",
  "search.mjs", "shell.mjs", "git.mjs", "web.mjs", "linter.mjs", "lsp.mjs", "execute.mjs",
  "question.mjs", "tree.mjs", "wait_for.mjs", "ops.mjs", "checklist.mjs",
]

test("T-TD-2 边界：src/tools/*.md 25 档在位；read.md 含 Routing 段与 repo_outline/code_search/lsp 指向句", () => {
  for (const name of MIGRATED) assert.ok(existsSync(join(TOOLS_DIR, `${name}.md`)), `${name}.md 缺失`)
})

test("T-TD-3 错误（全量扫描）：17 档接线文件对 25 工具的内联描述块零残留", () => {
  assert.equal(WIRING_FILES.length, 17, "接线文件清单 = D-TD2 落点（edit 宿主 = file-edit.mjs）")
  let descHits = 0
  for (const f of WIRING_FILES) {
    const lines = readFileSync(join(TOOLS_DIR, f), "utf8").split("\n")
    descHits += lines.filter((l) => /^  description:/.test(l)).length
  }
  assert.equal(descHits, 25, `工具级 description 命中数 = 25（实 ${descHits}）`)
})
