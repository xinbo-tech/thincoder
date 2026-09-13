/**
 * core-prompt-face.test.mjs — 核内提示词面 / 工具描述面的**结构**机检
 * （CORE-UNIFICATION T-C8「核内 15 + 25 在位」· D-C13 单一解析面 · 契约 10「核档内零端名分支」）。
 *
 * 断言的形态 = **结构面**（档名集合 / 可加载性 / 注入位语法），不是散文锚——读取档内容仅为
 * 枚举，不对任何句子做在场 / 缺席断言（测试纪律「禁止新写散文锚」）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import { loadSlot, loadAdvisorPrompt, loadToolDoc, PROMPTS_DIR, TOOL_DOCS_DIR } from "../prompt-files.mjs"

const md = (dir) => readdirSync(dir).filter((f) => f.endsWith(".md")).sort()

test("prompt slots: 15 files in core (T-C8)", () => {
  const slots = md(PROMPTS_DIR)
  assert.equal(slots.length, 15, `slot prompts: ${slots.join(", ")}`)
})

test("tool docs: 25 files in core (T-C8)", () => {
  const docs = md(TOOL_DOCS_DIR)
  assert.equal(docs.length, 25, `tool docs: ${docs.join(", ")}`)
})

test("every slot / tool doc loads through the single core loader (D-C13)", () => {
  for (const name of md(PROMPTS_DIR)) assert.ok(loadSlot(name).length > 0, `slot ${name} empty`)
  for (const name of md(TOOL_DOCS_DIR)) {
    assert.ok(loadToolDoc(name.replace(/\.md$/, "")).length > 0, `tool doc ${name} empty`)
  }
})

test("the hard-loaded advisor prompts resolve (contract 9)", () => {
  for (const name of ["advisor-round1.md", "advisor-round2.md", "advisor-round3.md", "advisor-design.md"]) {
    assert.ok(loadAdvisorPrompt(name).length > 0, `${name} missing`)
  }
})

test("injection anchors are well-formed (contract 10)", () => {
  // Every `{{inject:…}}` occurrence must match the anchor grammar exactly — a malformed anchor
  // would be shipped verbatim to the model instead of being substituted by the assembly layer.
  const anchor = /^\{\{inject:[a-z0-9-]+\}\}$/
  const scan = (name, text) => (text.match(/\{\{inject:[^}]*\}\}/g) ?? []).filter((a) => !anchor.test(a)).map((a) => `${name}: ${a}`)
  const offenders = [
    ...md(PROMPTS_DIR).flatMap((n) => scan(n, loadSlot(n))),
    ...md(TOOL_DOCS_DIR).flatMap((n) => scan(n, loadToolDoc(n.replace(/\.md$/, "")))),
  ]
  assert.deepEqual(offenders, [], `malformed injection anchors: ${offenders.join(", ")}`)
})
