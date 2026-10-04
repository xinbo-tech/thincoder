// 工具路径基面根治批（#921）· 批内单元测试件（§2.3 测试面 ①-⑥）
// 跑法：仓根 `node --test docs/batches/2026-10-04-tool-path-baseline.test.mjs`
// 覆盖：E1 解析四腿红绿 ∥ E2 文案两形 ∥ E4 冻结窗探针 ∥ E5 回归（light-round-7 套件 + batch-paths 既有 + REVIEW_ROOT_KEYS 键集）∥ AC-4 grep
import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { resolveReviewDocPaths, REVIEW_ROOT_KEYS } from "../../thincoder-core/agent-tools/review-facts.mjs"
import { advisorTool } from "../../thincoder-core/agent-tools/advisor.mjs"
import { launchAsyncAdvisor } from "../../thincoder-core/agent-tools/advisor-async.mjs"
import { inflightDesignReviewConflict } from "../../thincoder-core/agent-tools/advisor-settle.mjs"
import { REVIEW_ROOT_KEYS as WG_KEYS, resolveReviewRootsFor } from "../../thincoder-core/agent/write-gate.mjs"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder）
const norm = (p) => p.replace(/[\\/]/g, "/") // 比较面归一（win32 反斜杠面不破断言）
const samePath = (a, b) => norm(a) === norm(b)

/** 夹具：工作区根（无 manifest——tmp 下）+ 子仓（manifest docRoot.design = docs/core/design——非默认布局，
 *  防 DEFAULT_MANIFEST 兜底腿误中）；返回 { ws, repo, doc }。 */
function mkWorkspace({ repos = 1, writeDoc = true } = {}) {
  const ws = mkdtempSync(join(tmpdir(), "tpb-ws-"))
  const made = []
  for (let i = 0; i < repos; i++) {
    const repo = join(ws, `repo-${i}`)
    mkdirSync(join(repo, "docs", "core", "design"), { recursive: true })
    writeFileSync(join(repo, "PROJECT-MANIFEST.json"), JSON.stringify({
      version: 1, phase: "initial-dev",
      docRoot: { requirements: "docs/requirements", specs: "docs/requirements/specs", design: "docs/core/design", modules: "docs/core/design/modules", batches: "docs/batches" },
    }, null, 2))
    if (writeDoc) writeFileSync(join(repo, "docs", "core", "design", "spec.md"), `# spec ${i}\n`)
    made.push(repo)
  }
  return { ws, repo: made[0], repoB: made[1] ?? null, doc: join(made[0], "docs", "core", "design", "spec.md"), cleanup: () => rmSync(ws, { recursive: true, force: true }) }
}

test("腿③-红绿对：裸形相对串——旧码拒（取证读）→ 新码归一受理落子仓 docRoot", async () => {
  const fx = mkWorkspace({ repos: 1 })
  try {
    // 单源四腿直读（绿面本体）：resolved = 子仓绝对路径
    const { resolved, invalid, ambiguous } = resolveReviewDocPaths(["docs/core/design/spec.md"], fx.ws)
    assert.equal(invalid.length, 0)
    assert.equal(ambiguous, null)
    assert.equal(norm(resolved.get("docs/core/design/spec.md")), norm(fx.doc))
    // 工具面集成（绿）：旧码同夹具拒（红取证 = .thincoder/tmp 探针实跑在案）；新码判定过 →
    // 续走实例解析/token（纯函数面——零 LLM 零网络）→ async ack
    const agent = { cwd: fx.ws }
    const ack = await advisorTool.execute({ type: "design", documents: ["docs/core/design/spec.md"] }, { agent, depth: 0 })
    const parsed = JSON.parse(ack)
    assert.equal(parsed.status, "running")
    assert.equal(typeof parsed.id, "string")
  } finally { fx.cleanup() }
})

test("腿③-绝对形零变：绝对路径受理面与旧 normAbs 逐字等价；锚外绝对形照拒", async () => {
  const fx = mkWorkspace({ repos: 1 })
  try {
    const abs = norm(fx.doc)
    const r1 = resolveReviewDocPaths([fx.doc], fx.ws)
    assert.equal(norm(r1.resolved.get(fx.doc)), abs)
    const r2 = resolveReviewDocPaths([join(fx.ws, "outside.md")], fx.ws)
    assert.equal(r2.invalid.length, 1)
    assert.deepEqual(r2.invalid[0].attempted, []) // 绝对形不进腿③——无候选可试
  } finally { fx.cleanup() }
})

test("腿④-歧义红绿对：双子仓同相对形均可读 ⇒ scope-doc-ambiguous 列全部可读命中；恰一可读 ⇒ 胜；0 可读 ⇒ not-doc", async () => {
  const fx = mkWorkspace({ repos: 2, writeDoc: false })
  try {
    // ① 双可读 ⇒ 歧义（工具面——独立新判据，不混 not-doc）
    writeFileSync(join(fx.repo, "docs", "core", "design", "spec.md"), "# a\n")
    writeFileSync(join(fx.repoB, "docs", "core", "design", "spec.md"), "# b\n")
    const agent = { cwd: fx.ws }
    const out = await advisorTool.execute({ type: "design", documents: ["docs/core/design/spec.md"] }, { agent, depth: 0 })
    assert.ok(out.includes("scope-doc-ambiguous"), "独立判据名在场")
    assert.ok(out.includes(join(fx.repo, "docs", "core", "design", "spec.md")), "命中路径①在列（原生形态）")
    assert.ok(out.includes(join(fx.repoB, "docs", "core", "design", "spec.md")), "命中路径②在列（原生形态）")
    // ② 恰一可读 ⇒ 唯一化受理（单源直读——胜者 = 可读那个）
    rmSync(join(fx.repoB, "docs", "core", "design", "spec.md"))
    const r = resolveReviewDocPaths(["docs/core/design/spec.md"], fx.ws)
    assert.equal(r.ambiguous, null)
    assert.equal(norm(r.resolved.get("docs/core/design/spec.md")), norm(join(fx.repo, "docs", "core", "design", "spec.md")))
    // ③ 双结构命中均不可读 ⇒ not-doc（诊断列全部结构命中）
    rmSync(join(fx.repo, "docs", "core", "design", "spec.md"))
    const r2 = resolveReviewDocPaths(["docs/core/design/spec.md"], fx.ws)
    assert.equal(r2.invalid.length, 1)
    assert.equal(r2.invalid[0].attempted.length, 2, "诊断列全部结构命中")
  } finally { fx.cleanup() }
})

test("E2-B 文案：not-doc 拒串逐项含（解析后绝对路径 ∥ 基面 = 会话 cwd ∥ 候选项目根提示 ∥ 重试指引）；稳定前缀逐字", async () => {
  const fx = mkWorkspace({ repos: 1 })
  try {
    const agent = { cwd: fx.ws }
    const out = await advisorTool.execute({ type: "design", documents: ["docs/elsewhere/missing.md"] }, { agent, depth: 0 })
    assert.ok(out.startsWith("Advisor: design review documents must be documentation files (per the project's conventions). Invalid: "), "稳定前缀逐字")
    assert.ok(out.includes(`resolved against session cwd ${fx.ws}`), "基面句（会话 cwd 原值）")
    assert.ok(out.includes(`docs/elsewhere/missing.md → ${join(fx.ws, "docs", "elsewhere", "missing.md")}`), "逐文档解析后绝对路径（原生形态——normAbs 同族）")
    assert.ok(out.includes(`(candidates: ${fx.repo}`), "候选项目根提示（子仓根在列——原生形态）")
    assert.ok(out.includes("pass project-root-relative"), "重试指引")
    assert.ok(out.includes("criterion=scope-not-doc"), "既有判据本体零变")
  } finally { fx.cleanup() }
})

test("E4-冻结窗探针：裸形发起的设计评审在飞 ⇒ 写真实子仓路径命中 inflightDesignReviewConflict（docAbs 同源验证）", () => {
  const fx = mkWorkspace({ repos: 1 })
  try {
    const agent = { cwd: fx.ws, history: [], _subAgentCounter: 0 }
    const ctx = {} // buildChildSignal(parent, ctx) → parent._sessionSignal ?? ctx?.signal ?? null = null——零 abort 面
    const ack = launchAsyncAdvisor(agent, ctx, {
      reviewType: "design",
      documents: ["docs/core/design/spec.md"], // 裸形——旧 docAbs 腿 = cwd 拼接（保护洞）
      paths: null, object: null,
      designToken: "t:1", designId: "d1",
      run: { reviewId: "r1", reviewType: "design", designId: "d1", round: 0, priorOutput: null, stale: false, open: true, docSetKey: "[]" },
    })
    assert.equal(ack.error, undefined, "launch 成功（池空——同 scope 守卫过）")
    // 探针封闭：后台评审 promise 已无判读价值——中断其 controller（勿让 runAdvisorReview
    // 挂 promise 跨用例残留）。
    agent._asyncAdvisors.get(String(ack.id))?.controller?.abort?.()
    const hit = inflightDesignReviewConflict(agent, [fx.doc])
    assert.ok(hit, "裸形受理档的真实路径写入命中冻结窗")
    assert.equal(hit.id, String(ack.id))
    assert.equal(norm(hit.path), norm(fx.doc))
  } finally { fx.cleanup() }
})

test("E5-回归①：REVIEW_ROOT_KEYS 键集断言（本体零变 + write-gate 再出口同源）", () => {
  assert.deepEqual(REVIEW_ROOT_KEYS, ["requirements", "specs", "design", "modules", "batches"])
  assert.equal(WG_KEYS, REVIEW_ROOT_KEYS, "write-gate 同名再出口 = 同一常量（指针非副本）")
  // 缺档回退链（本体迁入后语义零变）：无 manifest 目录 ⇒ DEFAULT_MANIFEST.docRoot 布局可解析
  const bare = mkdtempSync(join(tmpdir(), "tpb-bare-"))
  try {
    const roots = resolveReviewRootsFor(bare).map(norm)
    assert.ok(roots.some((r) => r === norm(join(resolve(bare), "docs", "design"))), "回退默认 docRoot.design 在集")
  } finally { rmSync(bare, { recursive: true, force: true }) }
})

test("E5-回归②：light-round-7 套件复跑绿（4+1 用例）∥ batch-paths 既有批内件复跑绿", async () => {
  for (const rel of ["docs/batches/2026-10-02-light-round-7.test.mjs", "docs/batches/2026-10-02-manifest-resolution-fix.test.mjs"]) {
    const { spawnSync } = await import("node:child_process")
    const r = spawnSync(process.execPath, ["--test", rel], { cwd: ROOT, encoding: "utf8" })
    const out = (r.stdout ?? "") + (r.stderr ?? "")
    assert.equal(r.status, 0, `${rel} exit 0`)
    assert.ok(!/fail [1-9]\d*/.test(out), `${rel} 零红`)
  }
})

test("AC-4-grep：七处示例面基面声明句在位；裸形孤例零残留", async () => {
  const { readFile } = await import("node:fs/promises")
  const faces = [
    ["advisor documents 描述", "thincoder-core/agent-tools/advisor.mjs"],
    ["advisor batchDoc 描述", "thincoder-core/agent-tools/advisor.mjs"],
    ["spawn batchDoc 描述", "thincoder-core/agent-tools/subagent.mjs"],
    ["spawn 门拒文案", "thincoder-core/agent-tools/subagent-spawn.mjs"],
    ["tool-docs/advisor.md", "thincoder-core/tool-docs/advisor.md"],
    ["prompts/common.md", "thincoder-core/prompts/common.md"],
    ["prompts/persona-engineering.md :133", "thincoder-core/prompts/persona-engineering.md"],
    ["prompts/persona-engineering.md :179", "thincoder-core/prompts/persona-engineering.md"],
  ]
  for (const [, rel] of faces) {
    const t = await readFile(join(ROOT, rel), "utf8")
    assert.ok(/resolve against the session cwd first, then candidate project roots/.test(t), `${rel} 基面声明句在位`)
  }
  // 裸形孤例零残留：批触及面上不再出现未带仓前缀的 `docs/batches/<batch>-<topic>.md` 示例
  for (const rel of ["thincoder-core/agent-tools/subagent.mjs", "thincoder-core/agent-tools/subagent-spawn.mjs", "thincoder-core/agent-tools/advisor.mjs", "thincoder-core/tool-docs/advisor.md", "thincoder-core/prompts/common.md", "thincoder-core/prompts/persona-engineering.md"]) {
    const t = await readFile(join(ROOT, rel), "utf8")
    assert.ok(!/[^>\/]docs\/batches\/<batch>-<topic>\.md/.test(t), `${rel} 裸形示例零残留`)
  }
})
