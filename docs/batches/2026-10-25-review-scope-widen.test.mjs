/**
 * 2026-10-25-review-scope-widen.test.mjs —— 本批单测档（U1–U10；判据正文 = `docs/core/design/ADVISOR-GUARDS.md` §12，
 * 用例表 = 批档 §2 §6）。**收口即删**（单测档用毕即删——读数入批档 §5）。
 *
 * 三面：① `resolveReviewDocPaths` 单规则（相对形按会话项目根 / 绝对形照用 / 受理 = 项目内现存 `.md`）·
 * ② 范围拒发文案（`criterion=scope-not-doc` + 拒因三值只作 `reason=` + 锚态 + 期望形两句）·
 * ③ 冻结窗同源（`inflightDesignReviewConflict` 消费同一 `resolved`）。
 * 夹具 = 临时项目（`mkdtempSync` + 最小 `PROJECT-MANIFEST.json`）；零网络、零模型调用、零真实仓写入。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"

import { resolveReviewDocPaths } from "../../thincoder-core/agent-tools/review-facts.mjs"
import { inflightDesignReviewConflict } from "../../thincoder-core/agent-tools/advisor-settle.mjs"
import { owningProject } from "../../thincoder-core/manifest-discovery.mjs"
import { advisorTool } from "../../thincoder-core/agent-tools/advisor.mjs"

/** 最小项目档（夹具只用到「目录里有没有这份档」——内容取真档同形，留给他日读面）。 */
const MANIFEST = JSON.stringify({
  version: "0.0.0-test",
  phase: "test",
  docRoot: {
    requirements: "docs/core/requirements",
    specs: "docs/core/specs",
    design: "docs/core/design",
    modules: "docs/core/modules",
    batches: "docs/batches",
  },
  codePaths: ["thincoder-core"],
  index: { publicRepos: [] },
}, null, 2)

/** 临时夹具：`root` + `write(rel)`（写文件、返回绝对路径）+ `project(rel)`（建项目、返回项目根绝对路径）。 */
function fixture(t, prefix = "tc-unit-scope-") {
  const root = mkdtempSync(join(tmpdir(), prefix))
  const write = (rel, text = "# fixture\n") => {
    const p = join(root, rel)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, text)
    return p
  }
  const project = (rel) => {
    write(join(rel, "PROJECT-MANIFEST.json"), MANIFEST)
    return resolve(root, rel)
  }
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return { root, write, project }
}

test("U1 仓根级 `.md`（项目根直挂）按项目根受理", (t) => {
  const f = fixture(t)
  const root = f.project(".")
  const abs = f.write("METHODOLOGY.md", "# methodology\n")
  const { resolved, invalid } = resolveReviewDocPaths(["METHODOLOGY.md"], root)
  assert.equal(invalid.length, 0, `仓根级文档必须受理，实际 invalid=${JSON.stringify(invalid)}`)
  assert.deepEqual([...resolved], [["METHODOLOGY.md", abs]])
})

test("U2 子目录锚仍按项目根解析（不是子目录）", (t) => {
  const f = fixture(t)
  const root = f.project(".")
  const want = f.write("docs/a.md")
  const sub = join(root, "thincoder-core", "agent-tools")
  mkdirSync(sub, { recursive: true })
  const { resolved, invalid } = resolveReviewDocPaths(["docs/a.md"], sub)
  assert.equal(invalid.length, 0)
  assert.deepEqual([...resolved.values()], [want], "基面 = 会话项目根，不是 cwd")
})

test("U3 绝对形照用：另一项目内的 `.md` 照受理（零根试探、零拼接）", (t) => {
  const a = fixture(t, "tc-unit-a-")
  const b = fixture(t, "tc-unit-b-")
  const aRoot = a.project(".")
  b.project(".")
  const abs = b.write("docs/x.md")
  const { resolved, invalid } = resolveReviewDocPaths([abs], aRoot)
  assert.equal(invalid.length, 0)
  assert.deepEqual([...resolved], [[abs, abs]])
})

test("U4 相对形越根（`..`）⇒ outside-project", (t) => {
  const f = fixture(t)
  const outside = f.write("outside.md", "# outside\n")
  const root = f.project("project")
  const { resolved, invalid } = resolveReviewDocPaths(["../outside.md"], root)
  assert.equal(resolved.size, 0, "越根不受理——即便目标真实存在")
  assert.equal(invalid.length, 1)
  assert.equal(invalid[0].reason, "outside-project")
  assert.equal(invalid[0].resolved, outside, "文案载解析后绝对路径")
})

test("U5 项目内代码文件（非 `.md`）⇒ not-doc-file", (t) => {
  const f = fixture(t)
  const root = f.project(".")
  const abs = f.write("src/x.mjs", "export const x = 1\n")
  const { invalid } = resolveReviewDocPaths(["src/x.mjs"], root)
  assert.equal(invalid.length, 1)
  assert.equal(invalid[0].reason, "not-doc-file")
  assert.equal(invalid[0].resolved, abs)
})

test("U6 项目内不存在的 `.md` ⇒ not-doc-file", (t) => {
  const f = fixture(t)
  const root = f.project(".")
  const { invalid } = resolveReviewDocPaths(["nope.md"], root)
  assert.equal(invalid.length, 1)
  assert.equal(invalid[0].reason, "not-doc-file")
  assert.equal(invalid[0].resolved, join(root, "nope.md"))
})

test("U7 workspace 锚 + 相对形 ⇒ no-project-root（文案报锚态 + 期望形）", async (t) => {
  const f = fixture(t, "tc-unit-ws-")
  f.project("p1")
  f.project("p2")
  assert.equal(owningProject(f.root), null, "夹具前置：容器根及其祖先无项目档（否则 workspace 态不成立）")
  const { resolved, invalid } = resolveReviewDocPaths(["docs/a.md"], f.root)
  assert.equal(resolved.size, 0)
  assert.equal(invalid.length, 1)
  assert.equal(invalid[0].reason, "no-project-root")
  assert.equal(invalid[0].resolved, null, "无基面 ⇒ 无解析后路径")

  const agent = { cwd: f.root }
  const receipt = String(await advisorTool.execute(
    { type: "design", documents: ["docs/a.md"] },
    { agent, _toolCallId: "u7" },
  ))
  assert.match(receipt, /criterion=scope-not-doc/, "标识行恒 scope-not-doc（拒因三值不进 criterion 枚举）")
  assert.match(receipt, /reason=no-project-root/)
  assert.match(receipt, /Session anchor is workspace \(/, "文案报锚态")
  assert.match(receipt, /Expected form 1 — project-root-relative:/, "期望形第 1 句（项目根相对例）")
  assert.match(receipt, /Expected form 2 — absolute:/, "期望形第 2 句（绝对路径）")
  assert.equal(agent._advisorRefusals.has("u7"), true, "拒发登记（不置 called）")
})

test("U8 非字符串 / 空白项静默跳过（既有语义零改）", (t) => {
  const f = fixture(t)
  const root = f.project(".")
  f.write("METHODOLOGY.md", "# methodology\n")
  const { resolved, invalid } = resolveReviewDocPaths(["", "   ", null, 42, { a: 1 }, ["x.md"], "METHODOLOGY.md"], root)
  assert.deepEqual([...resolved.keys()], ["METHODOLOGY.md"])
  assert.equal(invalid.length, 0, "垃圾项既不进 resolved 也不进 invalid")
})

test("U9 返回形无 `ambiguous` / `candidates` 键；invalid 项 = {doc, resolved, reason}", (t) => {
  const f = fixture(t)
  const root = f.project(".")
  const out = resolveReviewDocPaths(["nope.md"], root)
  assert.deepEqual(Object.keys(out).sort(), ["invalid", "resolved"])
  assert.equal("ambiguous" in out, false)
  assert.equal("candidates" in out, false)
  assert.deepEqual(Object.keys(out.invalid[0]).sort(), ["doc", "reason", "resolved"])
})

test("U10 冻结窗同源：resolved 值进 docAbs ⇒ inflightDesignReviewConflict 命中", (t) => {
  const f = fixture(t)
  const root = f.project(".")
  const abs = f.write("METHODOLOGY.md", "# methodology\n")
  const docAbs = [...resolveReviewDocPaths(["METHODOLOGY.md"], root).resolved.values()]
  assert.deepEqual(docAbs, [abs], "docAbs 取同一 resolved")
  const agent = {
    cwd: root,
    _asyncAdvisors: new Map([["af1", {
      id: "af1", role: "advisor", reviewType: "design", status: "running",
      cancelled: false, done: false, docAbs,
    }]]),
  }
  const hit = inflightDesignReviewConflict(agent, [abs])
  assert.equal(hit?.id, "af1", "放宽受理的文档在冻结面内")
  assert.equal(hit?.path, abs)
})
