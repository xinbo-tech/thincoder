/**
 * 2026-09-29-tools-carryover-t3.test.mjs — 批次本地件 · 舱 T3（#15 第二波）
 *   面：`eng` ∥ `recent_changes` ∥ `batch` 三档描述外置（tool-docs）＋ `edit.md` ∥ `execute.md` 瘦身。
 * 不进仓套件；复跑 = 仓根 `node --test <本档>`。
 * **落位 = #545 立即形**：终位（`docs/batches/2026-09-29-tools-carryover-t3.test.mjs`）子写者被写门
 * fail-closed 拒（跨批批档写门——运行进程未载放宽版判据）⇒ 暂存 `.thincoder/tmp/`，由父侧收位
 * （暂存位与终位两层深一致、cwd 恒为仓根 ⇒ 命令形态不变）。
 *
 * 腿面（设计 §2.2 测试面：schema 结构 diff 断言 ∥ 外置覆盖率扫描）：
 * - T1 外置覆盖率：三档 description = `tool-docs/<name>.md`（逐字节）∥ 源码零内联残留（哨兵 = 描述首 60 字符）；
 * - T1b 覆盖强度：三档描述**中段**哨兵零残留（防「前缀未命中、改写副本漏网」）∥ 白名单在册——唯一内联长描述 =
 *      过渡别名 `batchSegmentTool`（逐字冻结于 `batch.mjs`；撤除判据 = BATCH-RECORD §4.14；非生产挂载面）；
 * - T2 schema 结构 diff：五档结构（参数键集 ∥ required ∥ enum ∥ 参数 JSON）与批前基线一致——
 *      三档描述逐字节零变（迁出 = 保真）；`edit` ∥ `execute` 参数面零变、描述面仅瘦身（严格变小）；
 * - T3 参数单源：`edit.md` ∥ `execute.md` 内嵌「Parameters:」段已去（参数语义单源 = schema properties，零丢失）；
 * - T4 加载面单源：`DESC()` / `loadToolDoc` 缺档语义（throw）零变。
 *
 * 基线（BASELINE）= 舱 T3 动笔前实读（2026-09-29）——本笔改动的对照面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join, dirname, resolve as pathResolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { createHash } from "node:crypto"

const REPO = pathResolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
const mod = (p) => import(pathToFileURL(join(REPO, p)).href)
const sha16 = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16)
const docOf = (name) => readFileSync(join(REPO, "thincoder-core", "tool-docs", `${name}.md`), "utf8")

const { engTool } = await mod("thincoder-core/agent-tools/eng.mjs")
const { recentChangesTool } = await mod("thincoder-core/agent-tools/recent-changes.mjs")
const { batchTool } = await mod("thincoder-core/agent-tools/batch.mjs")
const { editTool } = await mod("thincoder-core/tools/file.mjs")
const { executeTool } = await mod("thincoder-core/tools/execute.mjs")

/** 批前基线（as-of 2026-09-29 · 舱 T3 动笔前实读）。 */
const BASELINE = {
  eng: { descSha: "3700741bbbc70ff4", paramsSha: "5a88c9383b3c371b", descChars: 294, keys: ["action"], required: ["action"], enums: { action: ["enter", "exit"] } },
  recent_changes: { descSha: "18ee7e9996a8d20b", paramsSha: "8243f0af367f188a", descChars: 357, keys: [], required: null, enums: {} },
  batch: {
    descSha: "652ae10215811fba", paramsSha: "f2a59f2e858b7562", descChars: 1842,
    keys: ["action", "path", "segment", "text", "value", "note", "topic", "source", "date", "prev"],
    required: ["action"], enums: { action: ["create", "append", "status", "close"] },
  },
  edit: {
    descSha: "fcfefc32da8663b3", paramsSha: "37037c70b8cbddeb", descChars: 4894,
    keys: ["path", "old_string", "new_string", "line", "startLine", "endLine", "replace_all", "edits"],
    required: [], enums: {},
  },
  execute: {
    descSha: "bd9eb05e1733f6cc", paramsSha: "81988dd884461a7a", descChars: 2515,
    keys: ["code", "scriptFile", "nodeArgs", "workdir", "filter", "timeoutMs"],
    required: [], enums: {},
  },
}
const TOOLS = { eng: engTool, recent_changes: recentChangesTool, batch: batchTool(null), edit: editTool, execute: executeTool }
const SOURCES = {
  eng: readFileSync(join(REPO, "thincoder-core/agent-tools/eng.mjs"), "utf8"),
  recent_changes: readFileSync(join(REPO, "thincoder-core/agent-tools/recent-changes.mjs"), "utf8"),
  batch: readFileSync(join(REPO, "thincoder-core/agent-tools/batch.mjs"), "utf8"),
}
const structureOf = (t) => ({
  keys: Object.keys(t.parameters?.properties ?? {}),
  required: t.parameters?.required ?? null,
  enums: Object.fromEntries(Object.entries(t.parameters?.properties ?? {}).filter(([, v]) => v?.enum).map(([k, v]) => [k, v.enum])),
})

test("T1 外置覆盖率：三档 description = tool-docs 档（逐字节）∥ 内联零残留", () => {
  for (const name of ["eng", "recent_changes", "batch"]) {
    assert.equal(TOOLS[name].description, docOf(name), `${name}: description 与 tool-docs/${name}.md 非同源`)
    const sentinel = TOOLS[name].description.slice(0, 60)
    assert.ok(!SOURCES[name].includes(sentinel), `${name}.mjs 仍内联描述正文（残留）`)
    assert.ok(SOURCES[name].includes(`DESC("${name}")`), `${name}.mjs 未经 DESC() 单一解析面加载`)
  }
})

test("T1b 覆盖强度：三档描述中段哨兵零残留 ∥ 内联白名单 = 仅过渡别名（§4.14）在册", () => {
  // 中段哨兵（避开三档共享的尾部套语——batch 与别名共享同一结尾句，尾段哨兵会假阳）
  const mid = {
    eng: "write a design document, run advisor design review, get user approval",
    recent_changes: "unlike git status which shows all uncommitted changes",
    batch: "omitting it picks the unique in-flight record",
  }
  for (const name of ["eng", "recent_changes", "batch"]) {
    assert.ok(!SOURCES[name].includes(mid[name]), `${name}.mjs 含描述中段副本（内联残留）`)
  }
  // 白名单在册：过渡别名描述（逐字冻结；撤除判据 BATCH-RECORD §4.14）仍在 batch.mjs——防静默消失/漂移
  assert.ok(SOURCES.batch.includes("Append your own section of the batch record"), "别名描述体失位（§4.14 冻结面漂移）")
})

test("T2 schema 结构 diff：五档结构与参数面 = 批前基线；三档描述逐字节零变；edit/execute 仅描述瘦身", () => {
  for (const [name, t] of Object.entries(TOOLS)) {
    assert.deepEqual(structureOf(t), { keys: BASELINE[name].keys, required: BASELINE[name].required, enums: BASELINE[name].enums }, `${name}: schema 结构漂移`)
    assert.equal(sha16(JSON.stringify(t.parameters ?? null)), BASELINE[name].paramsSha, `${name}: parameters 面漂移（行为零变判据）`)
  }
  for (const name of ["eng", "recent_changes", "batch"]) {
    assert.equal(sha16(TOOLS[name].description ?? ""), BASELINE[name].descSha, `${name}: 迁出应逐字节保真——描述已变`)
  }
  for (const name of ["edit", "execute"]) {
    const len = (TOOLS[name].description ?? "").length
    assert.ok(len < BASELINE[name].descChars, `${name}: 描述未瘦身（${len} ≥ 基线 ${BASELINE[name].descChars}）`)
  }
})

test("T3 参数单源：edit/execute 档内「Parameters:」段已去 ∥ 参数键集零丢失", () => {
  for (const name of ["edit", "execute"]) {
    assert.ok(!docOf(name).includes("Parameters:"), `${name}.md 仍含「Parameters:」段（参数回声未去）`)
    const keys = Object.keys(TOOLS[name].parameters?.properties ?? {})
    for (const k of BASELINE[name].keys) assert.ok(keys.includes(k), `${name}: schema 缺参数 ${k}`)
  }
})

test("T4 加载面单源：DESC()/loadToolDoc 缺档语义（throw）零变", async () => {
  const { loadToolDoc } = await mod("thincoder-core/prompt-files.mjs")
  assert.throws(() => loadToolDoc("__t3_no_such_doc__"), /ENOENT|no such file/i)
  const { DESC } = await mod("thincoder-core/tools/shared.mjs")
  assert.equal(DESC("eng"), docOf("eng"), "DESC() 非同源（工具族与 agent-tools 族须同径）")
})
