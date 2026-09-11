/**
 * verify-redesign.test.mjs — verifyTool gate semantics (VERIFY-REDESIGN.md).
 *
 * 2026-09-11 TEST-LIFECYCLE 扫① 削段：原 T-V9（guard 文案负向锚）删 + T-V10 裁为正向参数名
 * 驻留锚（旧词组不复现类锚退役——现行守卫行为由集成场景 ① 与 T-V1~V6 覆盖）。
 *
 * Covers T-V1..V6 of the design test table (VS Code side; T-V7 dual-end
 * consistency is a cross-repo behavior asserted by the parent's full run):
 *   T-V1 passed            → 放行
 *   T-V2 failed            → 打回, _verifyPassed=false
 *   T-V3 skipped + reason  → 放行
 *   T-V4 skipped w/o reason→ 打回 (空跳过不允许)
 *   T-V5 doc-only change   → 快路径跳过 (放行)
 *   T-V6 rejection message → lists changed files + points at AGENTS.md
 * Plus guard rails: a missing declaration rejects; an explicit failed on a
 * doc-only change is respected.
 *
 * verify imports "vscode" → test/vscode-mock (getDiagnostics → []) — no real
 * diagnostics, deterministic. Changed files are non-JS (skips the soft node
 * --check hint) and live in an os.tmpdir temp dir (not a git repo → resolved
 * via _touchedFiles only).
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { verifyTool } from "../src/agent-tools/verify.mjs"

const __here = dirname(fileURLToPath(import.meta.url))

/** Build a throwaway agent + ctx with one changed source file already written. */
function makeCtx(changedRel) {
  const cwd = mkdtempSync(join(tmpdir(), "verify-redesign-"))
  const files = [join(cwd, ...changedRel)]
  for (const f of files) {
    mkdirSync(dirname(f), { recursive: true })
    writeFileSync(f, "export const x = 1\n")
  }
  const agent = {
    _touchedFiles: files,
    _tasks: [],
    _verifiedThisRun: false,
    _verifyPassed: undefined,
  }
  return { ctx: { agent, cwd }, cwd }
}

function cleanup(ctx) {
  try { rmSync(ctx.cwd, { recursive: true, force: true }) } catch { /* ignore */ }
}

async function run(changedRel, verification) {
  const { ctx, cwd } = makeCtx(changedRel)
  try {
    const out = await verifyTool.execute({ verification }, ctx)
    return { out, passed: ctx.agent._verifyPassed, verified: ctx.agent._verifiedThisRun }
  } finally {
    cleanup({ cwd })
  }
}

const SRC = ["src", "util.ts"] // non-JS, under src/ → a code change, not doc-only

test("T-V1 passed → 放行", async () => {
  const { passed, verified, out } = await run(SRC, { status: "passed" })
  assert.equal(verified, true)
  assert.equal(passed, true)
  assert.match(out, /Verification passed/)
})

test("T-V2 failed → 打回 (_verifyPassed=false)", async () => {
  const { passed, verified, out } = await run(SRC, { status: "failed" })
  assert.equal(verified, true)
  assert.equal(passed, false)
  assert.match(out, /NOT VERIFIED/)
})

test("T-V3 skipped + reason → 放行", async () => {
  const { passed, out } = await run(SRC, { status: "skipped", summary: "项目无自动化测试" })
  assert.equal(passed, true)
  assert.match(out, /skipped with reason/)
  assert.match(out, /项目无自动化测试/)
})

test("T-V4 skipped without reason → 打回 (空跳过不允许)", async () => {
  const { passed, out } = await run(SRC, { status: "skipped" })
  assert.equal(passed, false)
  assert.match(out, /NOT VERIFIED/)
  // whitespace-only summary is still empty
  const ws = await run(SRC, { status: "skipped", summary: "   " })
  assert.equal(ws.passed, false)
})

test("T-V5 doc-only change → 快路径跳过 (放行)", async () => {
  const { passed, out } = await run(["README.md"], { status: "passed" })
  assert.equal(passed, true)
  assert.match(out, /Documentation-only/)
})

test("T-V6 打回消息含改动文件 + 引导 AGENTS.md", async () => {
  const { ctx, cwd } = makeCtx(SRC)
  try {
    const out = await verifyTool.execute({ verification: { status: "failed" } }, ctx)
    // Lists the changed source file (absolute path) and references AGENTS.md
    assert.match(out, /util\.ts/)
    assert.match(out, /AGENTS\.md/)
    assert.match(out, /Changed files:/)
  } finally {
    cleanup({ cwd })
  }
})

test("guard: missing declaration → 打回", async () => {
  const { passed, out } = await run(SRC, undefined)
  assert.equal(passed, false)
  assert.match(out, /NOT VERIFIED/)
  assert.match(out, /AGENTS\.md/)
})

test("guard: invalid status → 打回", async () => {
  const { passed } = await run(SRC, { status: "maybe" })
  assert.equal(passed, false)
})

test("guard: explicit failed on a doc-only change is still respected", async () => {
  const { passed, out } = await run(["README.md"], { status: "failed" })
  assert.equal(passed, false)
  assert.match(out, /NOT VERIFIED/)
})

// ── 相 2（VERIFY-REDESIGN.md T-V8..V11）──

test("T-V8 doc-only 改动 + 显式 failed → 打回（双端同，G10）", async () => {
  const { passed, out } = await run(["README.md"], { status: "failed" })
  assert.equal(passed, false)
  assert.match(out, /NOT VERIFIED/)
})

test("T-V11b G11: rejection report surfaces the node --check syntax hint on changed .js", async () => {
  const { passed, out } = await run(["src", "util.js"], { status: "skipped" }) // no summary → rejected
  assert.equal(passed, false)
  assert.match(out, /NOT VERIFIED/)
  assert.match(out, /Syntax check \(advisory/)
})


test("T-V10 prompts 验声明参数名驻留（G5-G9）——旧 verify 语义负向锚已裁（扫①）", () => {
  // 2026-09-11 TEST-LIFECYCLE 扫① 削段：原三条「旧词组不复现」负向锚删（旧语义已随 PROMPT-SYSTEM
  // 施工③退役多年——行为面由集成 ①（重试提醒）与 T-V1~V6 锁定）；保留正向契约：提示词必须
  // 点名声明参数名（模型据此调用）。
  // 旧名单 [eng-coder, engineering-sub, system, discipline, main] 的新宿主映射（施工①迁移映射表）：
  // eng-coder/engineering-sub → persona-eng-coder；system/discipline/main 的写码执行收尾 → discipline-normal。
  const files = ["persona-eng-coder.md", "discipline-normal.md"]
  for (const f of files) {
    const src = readFileSync(join(__here, "..", "src", "prompts", f), "utf8")
    assert.match(src, /verification\.status/, `${f}: declarative phrasing present`)
  }
})

test("T-V11 goal 门禁：mutated 未 verify → 拦截（G13）", async () => {
  const { goalTool } = await import("../src/agent-tools/goal.mjs")
  const mk = (mutated, verified) => ({
    agent: {
      _goal: { objective: "x", criteria: "c", status: "active", turnsUsed: 0 },
      _mutatedThisRun: mutated,
      _verifiedThisRun: verified,
    },
  })
  // mutated 未 verify → 拦截（对齐 CLI goal.mjs:53）
  const blocked = mk(true, false)
  const bOut = await goalTool.execute({ action: "complete" }, { agent: blocked.agent })
  assert.match(bOut, /verify has not run/)
  assert.equal(blocked.agent._goal.status, "active")
  // verified → 放行
  const passed = mk(true, true)
  const pOut = await goalTool.execute({ action: "complete" }, { agent: passed.agent })
  assert.doesNotMatch(pOut, /verify has not run/)
})
