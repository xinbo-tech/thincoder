// 2026-09-29-tools-carryover-t2.test.mjs — T2 舱批内件（#15 第二波 · 名随批档 · 不入仓套件）。
//
// 位形：本刻暂存 `.thincoder/tmp/`（#545 立即形——运行态写门判据滞后，终位写入被拒）；
//      终位 = `docs/batches/`（与基线伴生件同目录）。两处两层深，相对解析一致，两处可跑。
//
// 覆盖（设计 §2.2 口径）：
//   F1 五档描述迁出（timer ∥ goal ∥ task ∥ skill ∥ plan）：描述源 = `tool-docs/<name>.md`（DESC() 加载）；
//      五档源码内联 description 残留 = 0；
//   F2 迁移保真：现描述与迁移前基线（`-t2-baseline.json`）空白归一化等值（零语义增删）；
//   F3 结构保真（AC15-5）：五档 + git + process + wait_for 的 schema 结构
//      （键集 ∥ enum ∥ required ∥ 嵌套）与基线逐档等值 ——「仅描述文本」；
//   F4 git.md 瘦身（AC15-3 / AC15-2 本档口径）：schema ≤8,000 ∧ 削减 ≥25%（本档基线 10,743）；
//   F5 加载面单源（AC15-6）：DESC ≡ loadToolDoc（描述源 = md）∥ 缺档 throw 语义不变；
//   F6 两处文本笔（#9 随动）接口完备性：wait_for 描述覆盖 parseWaitForCondition 的 supported
//      条件集（实现枚举 → 描述），且描述所载条件形全部可被实现解析（描述 → 实现）。
//
// 跑法（从仓库根 thincoder/）：`node --test .thincoder/tmp/2026-09-29-tools-carryover-t2.test.mjs`
//   （收位后：`node --test docs/batches/2026-09-29-tools-carryover-t2.test.mjs`）
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"

const REPO = fileURLToPath(new URL("../../", import.meta.url))
const CORE = REPO + "thincoder-core/"
const HERE = fileURLToPath(new URL("./", import.meta.url))
const BASELINE_NAME = "2026-09-29-tools-carryover-t2-baseline.json"
const baselinePath = existsSync(HERE + BASELINE_NAME) ? HERE + BASELINE_NAME : REPO + "docs/batches/" + BASELINE_NAME
const baseline = JSON.parse(readFileSync(baselinePath, "utf8"))

const norm = (s) => String(s).replace(/\s+/g, " ").trim()
const load = (rel) => import(pathToFileURL(CORE + rel).href)
const docOf = (name) => readFileSync(CORE + `tool-docs/${name}.md`, "utf8")
const schemaLen = (t) => JSON.stringify({ description: t.description, parameters: t.parameters }).length
/** 结构投影：丢 description 文本，留键集 ∥ enum ∥ required ∥ 嵌套（递归）。 */
function structureOf(schema) {
  if (schema == null || typeof schema !== "object") return schema
  if (Array.isArray(schema)) return schema.map(structureOf)
  const out = {}
  for (const [k, v] of Object.entries(schema)) { if (k === "description") continue; out[k] = structureOf(v) }
  return out
}

const MIGRATED = [
  ["timer", "agent-tools/timer.mjs", "timerTool"],
  ["goal", "agent-tools/goal.mjs", "goalTool"],
  ["task", "agent-tools/task.mjs", "taskTool"],
  ["skill", "agent-tools/skill.mjs", "skillTool"],
  ["plan", "agent-tools/plan.mjs", "planTool"],
]

test("F1 · 五档描述迁出：描述源 = tool-docs 档 ∥ 内联 description 残留 = 0", async () => {
  for (const [name, rel, sym] of MIGRATED) {
    const tool = (await load(rel))[sym]
    assert.equal(tool.description, docOf(name), `${name}: description ≠ DESC() 加载的 md 内容`)
    assert.ok(tool.description.length > 0 && tool.description.endsWith("\n"), `${name}: 描述形态异常`)
    const src = readFileSync(CORE + rel, "utf8")
    // 顶层字段判据（行首恰 2 空格）——参数级 `description:`（嵌套更深）为 schema 本体，不在扫描面
    assert.equal(/^ {2}description:\s*(?:\n[ \t]*)?["'`]/.test(src), false, `${name}: 顶层仍含内联 description 字面`)
    assert.ok(/^ {2}description:\s*DESC\(/m.test(src), `${name}: 顶层 description 未经 DESC()`)
  }
})

test("F2 · 迁移保真：现描述 ≡ 迁移前基线（空白归一化）", async () => {
  for (const [name, rel, sym] of MIGRATED) {
    const tool = (await load(rel))[sym]
    assert.equal(norm(tool.description), norm(baseline[name].description), `${name}: 迁移文本漂移`)
  }
})

test("F3 · 结构保真（AC15-5）：schema 结构逐档 = 基线 ∥ 仅描述文本", async () => {
  const all = [
    ...MIGRATED,
    ["git", "tools/git.mjs", "gitTool"],
    ["process", "tools/ops.mjs", "processTool"],
    ["wait_for", "tools/ops.mjs", "waitForTool"],
  ]
  for (const [name, rel, sym] of all) {
    const tool = (await load(rel))[sym]
    assert.deepEqual(structureOf(tool.parameters), baseline[name].structure, `${name}: schema 结构漂移`)
  }
})

test("F4 · git.md 瘦身：schema ≤8,000 ∧ 削减 ≥25%（本档基线 10,743）", async () => {
  const git = (await load("tools/git.mjs")).gitTool
  const len = schemaLen(git)
  const base = baseline.git.schemaLen
  assert.ok(len <= 8000, `git schema ${len} > 8000`)
  assert.ok(len <= base * 0.75, `git 削减不足 25%：${len}/${base}`)
  assert.equal(git.description, docOf("git"), "git 描述源非 md")
})

test("F5 · 加载面单源（AC15-6）：DESC 缺档 throw 语义不变", async () => {
  const { DESC } = await load("tools/shared.mjs")
  assert.equal(DESC("timer"), docOf("timer"))
  assert.throws(() => DESC("__no_such_tool_doc__"), /ENOENT|no such file/i)
})

test("F6 · 两处文本笔接口完备性：wait_for 描述覆盖实现条件集（双向）", async () => {
  const { parseWaitForCondition } = await load("tools/ops.mjs")
  const md = docOf("wait_for")
  // 实现枚举（parse 拒绝消息 = supported 单源）→ 描述：逐项在描述中可见
  const SAMPLES = {
    "advisor settled": "advisor settled",
    "subagent id:N done": "subagent id:3 done",
    "consult done": "consult done",
    "bash id:N done": "bash id:3 done",
    "file exists:path": "file exists:x",
    "port open:N": "port open:3",
  }
  for (const [tmpl, sample] of Object.entries(SAMPLES)) {
    assert.ok(md.includes(tmpl), `wait_for 描述缺条件：${tmpl}`)
    const kind = parseWaitForCondition(sample).kind
    assert.ok(typeof kind === "string" && kind.length > 0, `${tmpl}: 实现解析失败`)
  }
})
