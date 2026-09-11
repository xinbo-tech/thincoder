/**
 * tool-descriptions.test.mjs — VSC-CONTEXT-PARITY 批 R4（工具描述外部装载 25 档 `.md` 迁移）
 * 机判：T-TD-1 ~ T-TD-4。设计权威 = VSC 仓 `docs/design/TOOLS.md` §12（D-TD1/D-TD2/D-TD3 +
 * §12.5 用例表 + §12.6 AC-TD-1/AC-TD-2）；需求 = `TOOLS（CLI 仓）` F7 / N9。
 *
 * 口径：T-TD-1 行为面（工具表 description === .md 内容，逐字）；T-TD-2 文件面（25 档在位 +
 * read.md 路由段）；T-TD-3 全量源码面（接线文件零内联残留——**全量扫描，非抽样**）；
 * T-TD-4 打包面（.vscodeignore 无 `*.md` 排除）。
 * 接线文件清单 = §12.3 D-TD2 落点（实现自扫更正：`edit` 宿主 = `file-edit.mjs`，非 file.mjs）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { builtinTools } from "../src/tools/index.mjs"
import { readImageTool } from "../src/tools/read_image.mjs"

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
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
const toolByName = new Map(builtinTools.map((t) => [t.name, t]))

test("T-TD-1 正常：25 个迁移面描述 = DESC(name) 读出（与 .md 内容逐字相等——含 Routing/Notes 段锚句）", () => {
  for (const name of MIGRATED) {
    const tool = name === "read_image" ? readImageTool : toolByName.get(name)
    assert.ok(tool, `${name}: 工具表缺失`)
    assert.equal(tool.description, readFileSync(join(TOOLS_DIR, `${name}.md`), "utf8"), `${name}: description ≠ ${name}.md 原文（DESC 装载面漂移）`)
  }
  // Routing/Notes 段锚句（迁移面抽样锚——描述体仍载路由与反模式段）
  assert.ok(toolByName.get("read").description.includes("**Routing:**"), "read.md: Routing 段缺失")
  assert.ok(toolByName.get("bash").description.includes("**Route to a dedicated tool instead of bash:**"), "bash.md: 路由段缺失")
  assert.ok(toolByName.get("edit").description.includes("**Batch multiple edits into ONE call"), "edit.md: Notes 段缺失")
})

test("T-TD-2 边界：src/tools/*.md 25 档在位；read.md 含 Routing 段与 repo_outline/code_search/lsp 指向句", () => {
  for (const name of MIGRATED) assert.ok(existsSync(join(TOOLS_DIR, `${name}.md`)), `${name}.md 缺失`)
  const readMd = readFileSync(join(TOOLS_DIR, "read.md"), "utf8")
  assert.ok(readMd.includes("**Routing:**"), "read.md: Routing 段缺失")
  for (const ref of ["`repo_outline`", "`code_search`"]) {
    assert.ok(readMd.includes(ref), `read.md: 指向句缺失 ${ref}`)
  }
  assert.match(readMd, /`lsp[\s`]/, "read.md: lsp 指向句缺失")
})

test("T-TD-3 错误（全量扫描）：17 档接线文件对 25 工具的内联描述块零残留", () => {
  assert.equal(WIRING_FILES.length, 17, "接线文件清单 = D-TD2 落点（edit 宿主 = file-edit.mjs）")
  let descHits = 0
  for (const f of WIRING_FILES) {
    const lines = readFileSync(join(TOOLS_DIR, f), "utf8").split("\n")
    const toolLevel = lines.filter((l) => /^  description:/.test(l))
    for (const l of toolLevel) {
      assert.ok(l.trim().startsWith("description: DESC("), `${f}: 工具级 description 非 DESC 装载（内联残留）: ${l.trim().slice(0, 60)}`)
      descHits++
    }
    assert.ok(!/^\s+description:\s*"/.test(lines.join("\n")), `${f}: 存在内联字符串 description 残留`)
  }
  assert.equal(descHits, 25, `工具级 description 命中数 = 25（实 ${descHits}）`)
})

test("T-TD-4 边界（打包面）：.vscodeignore 无 `*.md` 排除模式", () => {
  const ignore = read(".vscodeignore")
  for (const line of ignore.split("\n")) {
    const p = line.trim()
    if (!p || p.startsWith("#")) continue
    assert.ok(!/(^|\/)\*\.md$/.test(p), `.vscodeignore 含 *.md 排除模式: ${p}`)
    assert.ok(p !== "src/**" && p !== "src" && p !== "src/tools", `.vscodeignore 排除源树: ${p}`)
  }
})
