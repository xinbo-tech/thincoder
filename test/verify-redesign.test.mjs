/**
 * verify-redesign.test.mjs — verify 重构（VERIFY-REDESIGN.md）T-V1..V6 自验用例。
 * T-V7（双端一致）为跨端行为断言，由 VS Code 并行实现侧对拍，本文件不重复。
 *
 * 测试用真实临时目录（os.tmpdir）模拟一次 run：通过 ctx.agent._touchedFiles 提供
 * 改动文件（绝对路径，非 git repo → 不依赖 git diff），断言 verifyTool.execute 的
 * _verifyPassed 判定与打回引导内容。verify 不再跑任何测试命令——各放行用例顺带
 * 断言输出不含自动测试痕迹（npm test / Related tests / full suite）。
 *
 * 扫① 削段注（2026-09-11 TEST-LIFECYCLE——设计档 TESTING.md §7.3 点名档）：T-V9 删 4 条旧句负向锚
 * （留 2 正句）；T-V10 删 3 旧语义串 ×2 档（→ 收归 test/doc-consistency.test.mjs T76——留
 * verification.status 正锚）。覆盖依据：T-V1~V6 行为面 + 集成 ①（工具流 verify 关口）。
 */
import { test } from "node:test"
import assert from "node:assert"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { verifyTool } from "../src/agent-tools/verify.mjs"

const __here = dirname(fileURLToPath(import.meta.url))

/** mkdtemp 项目 + 写文件 + 一个最小 ctx（agent.cwd=该项目根，无 tasks）。 */
function makeProject(fileMap) {
  const dir = mkdtempSync(join(tmpdir(), "verify-redesign-"))
  for (const [rel, content] of Object.entries(fileMap)) {
    const p = join(dir, rel)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, content)
  }
  const ctx = { agent: { cwd: dir, _touchedFiles: [], tasks: [], _verifyPassed: undefined } }
  const touch = (rel) => ctx.agent._touchedFiles.push(join(dir, rel))
  return { dir, ctx, touch }
}

function cleanup(t, dir) {
  t.after(() => { try { rmSync(dir, { recursive: true, force: true }) } catch {} })
}

// 一个会通过 doc-only 快路径判断的源码项目（非 doc、非 src/ 下的 .mjs）。
const SRC_FILES = {
  "lib/math.mjs": "export const add = (a, b) => a + b\n",
  "lib/str.mjs": "export const up = (s) => s.toUpperCase()\n",
}

test("T-V1 声明 passed → 放行（_verifyPassed=true）", async (t) => {
  const { dir, ctx, touch } = makeProject(SRC_FILES)
  cleanup(t, dir)
  touch("lib/math.mjs")
  const out = await verifyTool.execute({ verification: { status: "passed" } }, ctx)
  assert.strictEqual(ctx.agent._verifyPassed, true)
  assert.match(out, /Verification declared passed/)
  // verify 不再自动跑任何项目测试（D-V4）
  assert.doesNotMatch(out, /npm test/)
  assert.doesNotMatch(out, /Related tests/)
  assert.doesNotMatch(out, /full suite/)
})

test("T-V2 声明 failed → 打回（_verifyPassed=false）", async (t) => {
  const { dir, ctx, touch } = makeProject(SRC_FILES)
  cleanup(t, dir)
  touch("lib/math.mjs")
  const out = await verifyTool.execute({ verification: { status: "failed" } }, ctx)
  assert.strictEqual(ctx.agent._verifyPassed, false)
  assert.match(out, /VERIFY BLOCKED/)
})

test("T-V3 声明 skipped + summary 理由 → 放行", async (t) => {
  const { dir, ctx, touch } = makeProject(SRC_FILES)
  cleanup(t, dir)
  touch("lib/math.mjs")
  const reason = "project has no automated tests — verified by manual review"
  const out = await verifyTool.execute({ verification: { status: "skipped", summary: reason } }, ctx)
  assert.strictEqual(ctx.agent._verifyPassed, true)
  assert.match(out, new RegExp(reason))
})

test("T-V4 声明 skipped 无 summary → 打回（空跳过不允许）", async (t) => {
  const { dir, ctx, touch } = makeProject(SRC_FILES)
  cleanup(t, dir)
  touch("lib/math.mjs")
  const out = await verifyTool.execute({ verification: { status: "skipped" } }, ctx)
  assert.strictEqual(ctx.agent._verifyPassed, false)
  assert.match(out, /empty skip is not allowed/)
})

test("T-V5 doc-only 改动 → 快路径放行", async (t) => {
  const { dir, ctx, touch } = makeProject({ "README.md": "# docs\n", "guide/docs.md": "notes\n" })
  cleanup(t, dir)
  touch("README.md")
  touch("guide/docs.md")
  const out = await verifyTool.execute({}, ctx)
  assert.strictEqual(ctx.agent._verifyPassed, true)
  assert.match(out, /Documentation-only changes/)
})

test("T-V6 打回消息含改动源文件 + 引 AGENTS.md 验证方式", async (t) => {
  const { dir, ctx, touch } = makeProject(SRC_FILES)
  cleanup(t, dir)
  touch("lib/math.mjs")
  touch("lib/str.mjs")
  // 空跳过是最干净的打回触发（含 D-V3 引导段）
  const out = await verifyTool.execute({ verification: { status: "skipped" } }, ctx)
  assert.strictEqual(ctx.agent._verifyPassed, false)
  assert.match(out, /math\.mjs/)
  assert.match(out, /str\.mjs/)
  assert.match(out, /AGENTS\.md/)
  assert.match(out, /does not run commands for you/)
})

test("T-V6b 未声明 verification → 打回并要求声明", async (t) => {
  const { dir, ctx, touch } = makeProject(SRC_FILES)
  cleanup(t, dir)
  touch("lib/math.mjs")
  const out = await verifyTool.execute({}, ctx)
  assert.strictEqual(ctx.agent._verifyPassed, false)
  assert.match(out, /no verification status was declared/)
})

// ── 相 2（VERIFY-REDESIGN.md T-V8..V11）──

test("T-V8 doc-only 改动 + 显式 failed → 打回（G10，双端同）", async (t) => {
  const { dir, ctx, touch } = makeProject({ "README.md": "# docs\n" })
  cleanup(t, dir)
  touch("README.md")
  const out = await verifyTool.execute({ verification: { status: "failed" } }, ctx)
  assert.strictEqual(ctx.agent._verifyPassed, false)
  assert.match(out, /VERIFY BLOCKED/)
})

test("T-V9 guard 文案声明式（G1-G4——扫① 裁后：正句留 2 / 旧句负向锚删 4）", async () => {
  const guard = readFileSync(join(__here, "..", "src", "agent", "completion.mjs"), "utf8")
  // 首个闸：declaring the outcome（模型可见文案契约——正句）
  assert.match(guard, /declaring the outcome/)
  // 失败重试：was not passed（正句）
  assert.match(guard, /verify was not passed/)
  // 旧句负向锚（4 条）已删——扫① 判定：旧语义早退役，守卫行为由 T-V1~V6 + 集成 ①（工具流
  // verify 关口）覆盖（2026-09-11 TEST-LIFECYCLE——设计档 TESTING.md §7.3 点名档）。
})

test("T-V10 prompts 声明式 verify 语义在位（G5-G9——扫① 裁后：正锚留 2；旧语义负向锚收归接收档）", async () => {
  // 旧名单 [eng-coder, engineering-sub, system, discipline, main] 的新宿主映射（施工①迁移映射表）：
  // eng-coder/engineering-sub → persona-eng-coder；system/discipline/main 的写码执行收尾 → discipline-normal。
  const files = ["persona-eng-coder.md", "discipline-normal.md"]
  for (const f of files) {
    const src = readFileSync(join(__here, "..", "src", "prompts", f), "utf8")
    // 声明式引导在位（verification.status 声明参数——模型可见契约）
    assert.match(src, /verification\.status/, `${f}: declarative phrasing present`)
  }
  // 三旧语义串 ×2 档的负向锚 → 收归 test/doc-consistency.test.mjs T76 防回潮族（扫① 2026-09-11）。
})
