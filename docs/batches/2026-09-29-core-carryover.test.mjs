/**
 * 2026-09-29-core-carryover.test.mjs — core-carryover 批内件（#638 ∥ #641 ∥ #645；判据单源 = 批档
 * `docs/batches/2026-09-29-core-carryover.md` §2 各 AC 组——逐条对照 AC 编号）。
 * 落位：`.thincoder/tmp/` 暂存位（与终位 `docs/batches/` 同深 ⇒ 相对 import 一致）；
 * 终位 = `docs/batches/2026-09-29-core-carryover.test.mjs`（父侧移档）。
 * 覆盖（三组）：
 *   ① #638 fixtures（AC-638-1..5）：adoption 边界归一（非串 `activeModel` 三型 ⇒ 回退渠道模型 ∕
 *      串值 ∕ 空串径零回归）· 读数面（`sessionReading` 非串零抛 ∧ = `entry.model` 直算同值）·
 *      查表全性（`specForModel` ∕ `providerSpec` ∕ `historyPercent` ∕ `contextUsage` ∕ `compressIfNeeded`
 *      非串零抛）· 同类面 `resolveEnableThinking` 非串零抛 + 串值判据逐字回归 ·
 *      命名三面串值基线（`agent-host.mjs:148` 端侧经 `historyPercent` 同函数承判——跨端码面不单测）。
 *   ② #641（AC-641-1 ∕ -2 ∕ -4 核内半幅）：四符号 `thincoder-core/**` 零命中（机扫）· 缺省回执逐字
 *      （`Edited` ∕ `Deleted` + 写入点上下文——拆缝前同形）· git 工具缺省径直派发（init ∕ status ∕
 *      非仓 fail-closed——零审批门）· 第三缝 `setWaitForConditionSource` 在位（保留重分类）。
 *      （AC-641-3 = 设计档三落点——设计档舱面；符号清单半幅见本档 641-1。）
 *   ③ #645（AC-645-1 ∕ -2 ∕ -4 ∕ -5 ∕ -6）：校验放行面（number ∕ boolean 扩 ∕ string 维持拒 ∕
 *      既有面零回归）· 核工具写形归一（`null` ⇒ 盘删键 + 内存回填 `DEFAULTS`；数值 ∕ 形状表 ∕
 *      object 类 ∕ 未知键四径）。**AC-645-3（桌面主侧）由跨批锁 B6b 承判**——他批档面，本批交接父侧改判
 *      （`docs/batches/2026-09-29-enddiff-clearance.test.mjs` B6b 臂——改判块见批档 §5）。
 * 跑法（仓根）：node --test .thincoder/tmp/2026-09-29-core-carryover.test.mjs（暂存位——现盘）
 *             node --test docs/batches/2026-09-29-core-carryover.test.mjs（终位——父侧移档后；同深 ⇒ 相对 import 一致）
 * 读数走 stderr（同 enddiff 批内件「运行器面」注——stdout 帧竞争对策）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { specForModel, providerSpec } from "../../thincoder-core/model-specs.mjs"
import { historyPercent, contextUsage } from "../../thincoder-core/token-window.mjs"
import { compressIfNeeded } from "../../thincoder-core/context.mjs"
import { resolveEnableThinking, DEFAULTS } from "../../thincoder-core/config.mjs"
import { applySession, sessionReading } from "../../thincoder-core/session-lifecycle.mjs"
import { composeEditReceipt } from "../../thincoder-core/tools/edit-diff.mjs"
import { gitTool } from "../../thincoder-core/tools/git.mjs"
import * as ops from "../../thincoder-core/tools/ops.mjs"
import { settingsTool, _checkKnownKeyValue } from "../../thincoder-core/agent-tools/settings.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const out = (label, value) => process.stderr.write(`[读数] ${label}: ${value}\n`)

// ─── ① #638 fixtures ─────────────────────────────────────────────────────────

const mkAdoptAgent = () => ({ history: [], config: { agent: {} }, tasks: [], providers: [{ name: "p", model: "m" }] })

test("638-1 adoption 归一：非串 ⇒ 回退渠道模型（串值 ∕ 空串径零回归）", () => {
  const cases = [
    [42, "number 脏载"], [true, "boolean 脏载"], [{}, "object 脏载"],
    ["", "空串 ⇒ 回退（既有 `||` 语义）"], ["m2", "串值径零回归"],
  ]
  for (const [activeModel, label] of cases) {
    const agent = mkAdoptAgent()
    applySession(agent, { activeProvider: "p", activeModel })
    const expect = activeModel === "m2" ? "m2" : "m"
    assert.equal(agent.provider.model, expect, `${label}：provider.model`)
    assert.equal(agent.activeModel, expect, `${label}：activeModel`)
  }
  out("638-1", "非串三型 ⇒ 回退 m · 空串 ⇒ 回退 · 串值 m2")
})

test("638-2 读数面：非串 activeModel 零抛 ∧ = entry.model 直算同值", () => {
  const history = [{ role: "user", content: "u".repeat(6000) }, { role: "assistant", content: "a".repeat(6000) }]
  const providers = [{ name: "p", model: "m" }]
  const got = sessionReading({ activeProvider: "p", activeModel: 42, history }, { providers, fallback: { model: "f" } })
  assert.equal(typeof got, "number", "非串 ⇒ 返回数字（零抛）")
  assert.ok(got > 0, "夹具非平凡（>0——回退确实生效而非空算）")
  assert.equal(got, historyPercent(history, providers[0]), "= 以 entry.model 直算同值")
  assert.equal(sessionReading({ activeProvider: "p", activeModel: "m", history }, { providers, fallback: { model: "f" } }), got, "串值径同值（零回归）")
  out("638-2", `reading=${got}`)
})

test("638-3 查表全性：非串 model 全链零抛（未登记 ⇒ DEFAULT_SPEC）", async () => {
  assert.deepEqual(specForModel(42), { context: 128000, maxOutput: 32000 }, "specForModel(42) = DEFAULT_SPEC")
  assert.equal(providerSpec({ model: true }).context, 128000, "providerSpec({model:true}) ⇒ 默认规格")
  assert.equal(typeof historyPercent([], { model: {} }), "number", "historyPercent([], {model:{}}) 零抛")
  assert.equal(contextUsage({ provider: { model: 42 }, config: { agent: {} }, history: [] }, {}).window, 128000, "contextUsage({model:42}) 零抛")
  assert.equal(await compressIfNeeded({ provider: { model: 42 }, config: { agent: {} }, history: [] }, 0, {}, {}), false, "compressIfNeeded 零抛（tokens ≤ threshold 早退）")
  out("638-3", "五落点非串零抛（128K 默认）")
})

test("638-4 ∕ -5 同类面与非串零抛 · 串值判据逐字回归", () => {
  assert.equal(resolveEnableThinking({ model: 42, baseURL: "https://dashscope.aliyuncs.com/x" }, {}), undefined, "非串 model 零抛（未登记 ⇒ undefined）")
  const bailian = "https://dashscope.aliyuncs.com/compatible-mode/v1"
  assert.equal(resolveEnableThinking({ model: "qwen3-max", baseURL: bailian, thinking: null }, {}), false, "串值径：qwen + 百炼 + thinking:null ⇒ false（零回归）")
  assert.equal(resolveEnableThinking({ model: "qwen3-coder-plus", baseURL: bailian, thinking: null }, {}), undefined, "qwen3-coder 线排除（零回归）")
  assert.equal(resolveEnableThinking({ model: "qwen3-max", baseURL: "https://api.example.com/x", thinking: null }, {}), undefined, "非百炼主机 ⇒ undefined（零回归）")
  assert.equal(providerSpec({ model: "glm-4.6" }).context, 128000, "命名三面串值基线（providerSpec 串值零回归）")
  out("638-4/5", "非串 undefined · 串值判据零回归")
})

// ─── ② #641 缺省径 + 符号零命中 ───────────────────────────────────────────────

const CORE = join(ROOT, "thincoder-core")
const walkMjs = (dir, acc = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walkMjs(p, acc)
    else if (name.endsWith(".mjs")) acc.push(p)
  }
  return acc
}

test("641-1 ∕ -4 两缝四符号核面零命中 ∧ 第三缝在位（保留重分类）", () => {
  const names = ["configureEditReceipt", "resetEditReceipt", "configureGitApproval", "resetGitApproval"]
  const files = walkMjs(CORE)
  const hits = []
  for (const file of files) {
    const text = readFileSync(file, "utf8")
    for (const n of names) if (text.includes(n)) hits.push(`${file.slice(ROOT.length + 1)}#${n}`)
  }
  assert.deepEqual(hits, [], "两缝四符号（含注释面）核面零残")
  assert.equal(typeof ops.setWaitForConditionSource, "function", "第三缝在位（测试缝——保留重分类）")
  assert.equal(typeof ops.setWaitForConditionSource(() => {}), "undefined", "第三缝调用面零抛（坏形归 null——生产径不变）")
  ops.setWaitForConditionSource(null) // 收尾：复位缺省（缺省 = 生产径）
  out("641-1/4", `核心档数=${files.length} · 四符号命中=0 · ops 缝在位`)
})

test("641-2 缺省径：回执逐字 + git 直派发（零审批门）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "core-carryover-641-"))
  const f = join(dir, "receipt.txt")
  writeFileSync(f, "l1\nl2\nl3\nl4\nl5\nl6\nl7\nl8\n")
  const edited = await composeEditReceipt({ abs: f, path: "receipt.txt", writeLine: 4, base: "Edited receipt.txt: replaced 1 occurrence(s)", deleted: false, occurrences: 1, note: null })
  assert.equal(edited, "Edited receipt.txt: replaced 1 occurrence(s)\ncontext (L1-L7):\n  L1\tl1\n  L2\tl2\n  L3\tl3\n→ L4\tl4\n  L5\tl5\n  L6\tl6\n  L7\tl7", "缺省回执逐字（base + 写入点上下文——拆缝前同形）")
  const deleted = await composeEditReceipt({ abs: f, path: "receipt.txt", writeLine: 4, base: "Deleted L4 of receipt.txt", deleted: true, occurrences: 1, note: null })
  assert.ok(deleted.startsWith("Deleted L4 of receipt.txt\ncontext (L1-L7):"), "删行径首行逐字")

  const repo = mkdtempSync(join(tmpdir(), "core-carryover-git-"))
  const initOut = await gitTool.execute({ action: "init" }, { cwd: repo })
  assert.ok(typeof initOut === "string" && existsSync(join(repo, ".git")), "git 直派发（零门——init 真执行；判副作用，免 git 本地化文案依赖）")
  assert.equal(await gitTool.execute({ action: "status" }, { cwd: repo }), "(clean — no changes)", "status 缺省径")
  writeFileSync(join(repo, "a.txt"), "hello\n")
  assert.equal(await gitTool.execute({ action: "status" }, { cwd: repo }), "Untracked (1):\na.txt", "缺省径执行结果同改前")
  const noRepo = mkdtempSync(join(tmpdir(), "core-carryover-norepo-"))
  await assert.rejects(() => gitTool.execute({ action: "log", count: 1 }, { cwd: noRepo }), /git log/, "非仓 fail-closed（零静默；命令前缀 = 本仓构造，免 git 本地化 stderr）")
  out("641-2", "回执逐字 · git init ∕ status ∕ 非仓三径同形")
})

// ─── ③ #645 校验 + 写形 ──────────────────────────────────────────────────────

test("645-1 放行面：number ∕ boolean 类 null 放行 · string 类维持拒 · 既有面零回归", () => {
  for (const p of ["agent.maxTurns", "traces.enabled", "agent.poolLimits", "defaultModel"]) {
    assert.doesNotThrow(() => _checkKnownKeyValue(p, null), `${p} null ⇒ 放行`)
  }
  assert.throws(() => _checkKnownKeyValue("memory.dbPath", null), /expects string/, "string 类维持拒（消费面无未设态）")
  assert.throws(() => _checkKnownKeyValue("agent.maxTurns", "x"), /expects number/, "非 null 值类型面零改")
  assert.throws(() => _checkKnownKeyValue("traces.enabled", 1), /expects boolean/, "非 null 值类型面零改")
  out("645-1", "放行 4 键 · 拒 string · 非 null 类型面零改")
})

test("645-2 ∕ -4..6 写形归一：null ⇒ 盘删键 + 内存回填默认（四径）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "core-carryover-645-"))
  const cfg = join(dir, "config.json")
  const seed = { agent: { maxTurns: 12, subagentModel: "openai:o3", _probe_unknown: "x", poolLimits: { engCoder: 6, other: 4, advisor: 4 } } }
  writeFileSync(cfg, JSON.stringify(seed))
  const tool = settingsTool({ configPath: cfg })
  const config = structuredClone(seed)
  const ctx = { agent: { config } }
  const disk = () => JSON.parse(readFileSync(cfg, "utf8"))

  const rNum = await tool.execute({ action: "set", key: "agent.maxTurns", value: "null" }, ctx)
  assert.equal("maxTurns" in disk().agent, false, "数值键：盘删键")
  assert.equal(config.agent.maxTurns, 200, "数值键：内存回填 DEFAULTS（200）")
  assert.match(String(rNum), /key removed/, "回执第三形（键已删除——回退默认）")

  await tool.execute({ action: "set", key: "agent.subagentModel", value: "null" }, ctx)
  assert.equal("subagentModel" in disk().agent, false, "形状表键：盘删键")
  assert.equal(config.agent.subagentModel, null, "形状表键：回填默认 null（与今日同形）")

  await tool.execute({ action: "set", key: "agent.poolLimits", value: "null" }, ctx)
  assert.equal("poolLimits" in disk().agent, false, "object 类：盘删键")
  assert.deepEqual(config.agent.poolLimits, DEFAULTS.agent.poolLimits, "object 类：内存回填 DEFAULTS")

  await tool.execute({ action: "set", key: "agent._probe_unknown", value: "null" }, ctx)
  assert.equal("_probe_unknown" in disk().agent, false, "未知键：盘删键")
  assert.equal("_probe_unknown" in config.agent, false, "未知键：内存同删（零回填）")

  const rVal = await tool.execute({ action: "set", key: "agent.maxTurns", value: "12" }, ctx)
  assert.equal(disk().agent.maxTurns, 12, "非 null 写径零回归（存量值照写）")
  assert.match(String(rVal), /persisted \+ hot-applied/, "非 null 回执形零改")
  out("645-2/4/5/6", "四径删键 + 回填（200 ∕ null ∕ DEFAULTS ∕ 未知同删）")
})
