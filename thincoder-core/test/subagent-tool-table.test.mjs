/**
 * subagent-tool-table.test.mjs — 子代面（depth>0）工具表排除 `question`（批 question-tool-filter ·
 * 台账 #289 · 设计 = `docs/core/design/TOOLS.md` §6.16 / D-TO11；用例 A30–A33 · 判据表 = 批档 §2.7）。
 *
 * 判据（单源）= 「角色选择（只读 / 全表）→ 排除谓词」：四个子代装配点同过核 `excludeSubagentTools`
 * （排除集 `SUBAGENT_TOOL_EXCLUSIONS` 住 `agent/helpers.mjs`——`question` 字面零散落各调用点）；
 * 主会话装配面（`assembleBuiltinTools`）零改（`question` 在职 + 机械门保留）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { buildSpawnChild } from "../agent-tools/subagent-spawn.mjs"
import { assembleBuiltinTools } from "../tools/index.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const CORE = resolve(HERE, "..")
const REPO = resolve(CORE, "..") // thincoder/（三包同仓根——`test/model-specs.test.mjs` 先例）

/** 父表夹具：只读面 / 写面 / 交互式主会话工具（`question` 亦标 readonly——排除与只读过滤正交）。 */
const FIXTURE_TOOLS = [
  { name: "read", readonly: true },
  { name: "write" },
  { name: "question", readonly: true },
]
const parentOf = () => ({
  cwd: process.cwd(),
  provider: { name: "p", model: "m" },
  config: { agent: {} },
  tools: [...FIXTURE_TOOLS],
})
const build = (parent, role) =>
  buildSpawnChild(parent, { agent: parent, callbacks: {} }, { task: "t" }, role, false, [], [], null)
const namesOf = (tools) => tools.map((t) => t.name)

test("A30 正常：coder 子表 = 父表 − 深度排除项（非只读过滤；新数组）", () => {
  const parent = parentOf()
  const child = build(parent, "coder").child.tools
  assert.ok(!namesOf(child).includes("question"), "coder 子表零含 `question`（depth>0 排除）")
  assert.ok(namesOf(child).includes("write"), "写面仍在（非只读过滤分支——排除与只读正交）")
  assert.notEqual(child, parent.tools, "恒返新数组（不改父表、不别名）")
  assert.deepEqual(namesOf(parent.tools), ["read", "write", "question"], "父表逐项零改（排除只作用于子表）")
})

test("A31 边界：explore 子表 = 只读面 ∩ 排除项（排除恒在最后一步）", () => {
  const parent = parentOf()
  const child = build(parent, "explore").child.tools
  assert.ok(!namesOf(child).includes("question"), "explore 子表零含 `question`")
  assert.deepEqual(namesOf(child), ["read"], "只读面 = `read`（`question` 虽标 readonly 仍随排除退场）")
})

test("A32 零回归：主会话装配面（depth-0）仍持 `question`", async () => {
  const names = (await assembleBuiltinTools({ memory: {}, cwd: process.cwd(), model: "qwen3.8-max" })).map((t) => t.name)
  assert.ok(names.includes("question"), "`assembleBuiltinTools` 名集含 `question`（主会话面零改）")
})

test("A33 结构：四装配点同过谓词 ∧ `question` 字面单源驻留 helpers.mjs", () => {
  const points = [
    "agent-tools/subagent-spawn.mjs", "agent-tools/subagent-actions.mjs",
    "agent-tools/escalate-async.mjs", "agent-tools/consult.mjs",
  ]
  for (const rel of points) {
    const src = readFileSync(join(CORE, rel), "utf8")
    assert.ok(src.includes("excludeSubagentTools("), `${rel}: 子代装配过核排除谓词`)
    assert.ok(!src.includes('"question"'), `${rel}: 零自持 \`question\` 字面（单源 = agent/helpers.mjs）`)
  }
  const vscSrc = readFileSync(join(REPO, "thincoder-vscode", "src", "agent", "setup-tooltable.mjs"), "utf8")
  assert.ok(vscSrc.includes("SUBAGENT_TOOL_EXCLUSIONS.has("), "VSC 端自持 depth>0 装配面消费核排除集")
  assert.ok(!vscSrc.includes('"question"'), "VSC 装配面零自持 `question` 字面（第二份字面已消）")
  const source = readFileSync(join(CORE, "agent", "helpers.mjs"), "utf8")
  assert.ok(source.includes('SUBAGENT_TOOL_EXCLUSIONS = new Set(["question"])'), "单源驻留 = helpers.mjs（成员与字面同址）")
})
