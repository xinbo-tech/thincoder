/**
 * cmd-eng.test.mjs — PORTABILITY 批（FR10–FR15 · CLI 面）面① `/eng` + 文案契约
 * 用例表 T-18 / T-19（PO-11）；#41 增补 T-20–T-22（先判后翻 / 拒翻零标签 / OFF 恒放行——
 * docs/core/design/MANIFEST.md §2.8 F2/F3 · AC-20 · 批档 §2.3 AC-C）。
 *
 * 断言对象 = src/tui/cmd-eng.mjs（/eng 无**已退役概念前提**切换——FR11 收正口径 = 不要
 * 求方法论文档 / 文档树；项目根锚（带档目录——git 非前提）= E2 既有入口前提）。构造手法：ctx 直驱
 * （slash-commands 的调用形态）+ sessions 目录隔离缝；showPicker 传"会炸的探针"——
 * 旧门禁若复活（要求 METHODOLOGY.md）即红。
 * 夹具（#41 / #188）：`tmp` = 带档目录（锚）；拒翻格 = 容器 + ≥2 带档子仓（歧义）；
 * 梯⑤（空目录）本批起走**建档 + 放行**（T53——可拒面收窄）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { handleEngCommand } from "../src/tui/cmd-eng.mjs"
import { ENG_OFF_REMINDER } from "@thincoder/core/agent.mjs"
import { planTool } from "@thincoder/core/agent-tools/plan.mjs"
import { newSession, loadSlotFile } from "@thincoder/core/session.mjs"
import { slotPath, writeSessionFile } from "@thincoder/core/session-slots.mjs"
import { MANIFEST_REL, DEFAULT_MANIFEST } from "@thincoder/core/manifest.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "@thincoder/core/session-slots.mjs"

let tmp, sessionsDir
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "portability-eng-")) // 空项目：无 METHODOLOGY.md / 无 docs 树
  // #41：ON 判据锚 = 仓根（.git——E2 既有入口前提）；非锚格另行建纯目录。
  mkdirSync(join(tmp, ".git"), { recursive: true })
  sessionsDir = mkdtempSync(join(tmpdir(), "portability-eng-sess-"))
  _setSessionsDirForTest(sessionsDir)
})
afterEach(() => {
  _resetSessionsDirForTest()
  rmSync(tmp, { recursive: true, force: true })
  rmSync(sessionsDir, { recursive: true, force: true })
})

/** ctx 直驱（showPicker = 探针：被调用即抛——"不弹窗"的机械证明）。 */
function ctxFor(agent, lines) {
  return {
    agent,
    pushLine: (t) => lines.push(String(t)),
    pushLabel: (l, t) => lines.push(`${l} ${t}`),
    showPicker: async () => { throw new Error("picker must not open (no prerequisite dialog)") },
  }
}
const engAgent = (over = {}) => ({
  cwd: tmp, config: { agent: {} }, _advisorRuns: new Map(), _pendingReminders: [], ...over,
})

test("T-18 正常：空项目（无 METHODOLOGY.md）→ 不弹窗、不崩；Engineering mode: ON", async () => {
  const lines = []
  const agent = engAgent()
  await handleEngCommand(ctxFor(agent, lines))
  assert.equal(agent.config.agent.engineering, true, "无已退役概念前提切换成功")
  assert.ok(agent.manifest, "ON 准 ⇒ 附着（缺档格就地建档——AC-20②）")
  assert.ok(lines.some((l) => l.includes("Engineering mode: ON")), "ON 提示行在场")
  assert.ok(lines.some((l) => l.includes("design-before-code enforced")), "新提示文案在场（去 strictly following）")
  assert.ok(!lines.some((l) => l.includes("strictly following")), "旧提示文案零残留")
  assert.ok(!lines.some((l) => l.includes("METHODOLOGY")), "METHODOLOGY 文案零残留")
  assert.ok(!lines.some((l) => l.includes("Created METHODOLOGY.md")), "模板创建分支已删")
})

test("T-19 边界：OFF 切换 → 提醒推入 + 令牌语义保持（快照断言）", async () => {
  const lines = []
  const live = "tok-id:2999-01-01"
  const agent = engAgent({ _engDesignTokens: new Map([["did-live", live]]) })
  await handleEngCommand(ctxFor(agent, lines)) // OFF → ON
  assert.equal(agent.config.agent.engineering, true)
  assert.deepEqual([...agent._pendingReminders], [], "ON 不推 OFF 提醒")
  assert.deepEqual([...agent._engDesignTokens], [["did-live", live]], "ON 后 token 原样（有效保留）")
  agent._advisorRuns = new Map([["x", {}]])
  await handleEngCommand(ctxFor(agent, lines)) // ON → OFF
  assert.equal(agent.config.agent.engineering, false)
  assert.deepEqual([...agent._pendingReminders], [ENG_OFF_REMINDER], "OFF 提醒推入")
  assert.deepEqual([...agent._engDesignTokens], [["did-live", live]], "OFF 不清 token（R16）")
  assert.equal(agent._advisorRuns.size, 0, "per-review 实例随模式清空（D-24b）")
  assert.ok(lines.some((l) => l.includes("Engineering mode: OFF")), "OFF 提示行在场")
})

// ─── #41：先判后翻（ON）/ 拒翻零标签 / OFF 恒放行（AC-C · AC-20）───────────────────

/** 非锚 cwd（无 .git ∧ 向下零个带 manifest 子仓 ⇒ 梯⑤ 无项目——**本批起走建档流**（T53））。 */
function mkPlainDir() {
  return mkdtempSync(join(tmpdir(), "portability-eng-plain-"))
}

/** 合法档逐字（= `initManifest` 落盘形态）。 */
const LEGAL_JSON = JSON.stringify(DEFAULT_MANIFEST, null, 2) + "\n"

/** 拒翻夹具（本批收正——`mkPlainDir`（梯⑤）现走建档放行）：容器 + ≥2 带档子仓 ⇒ 歧义（F2 表拒面）。 */
function mkAmbiguousDir() {
  const dir = mkdtempSync(join(tmpdir(), "portability-eng-amb-"))
  for (const n of ["alpha", "zed"]) {
    const d = join(dir, n)
    mkdirSync(join(d, ".git"), { recursive: true })
    writeFileSync(join(d, MANIFEST_REL), LEGAL_JSON)
  }
  return dir
}

test("T-20 错误：歧义（≥2 候选）上 ON ⇒ 拒翻——warn 行 + 零标签 + 零副作用", async () => {
  const amb = mkAmbiguousDir()
  try {
    const lines = []
    const agent = engAgent({ cwd: amb, _advisorRuns: new Map([["x", {}]]), _lastEngState: false })
    await handleEngCommand(ctxFor(agent, lines))
    assert.notEqual(agent.config.agent.engineering, true, "模式未翻（fail-closed 拒翻）")
    assert.equal(agent.manifest ?? null, null, "不附着")
    assert.equal(agent._advisorRuns.size, 1, "_advisorRuns 未重置（先判后翻零副作用）")
    assert.equal(agent._pendingReminders.length, 0, "提醒未入列")
    assert.ok(!lines.some((l) => l.includes("❯ Eng")), "拒时零标签（标签 = 成功回显——防假成功）")
    assert.ok(lines.some((l) => l.includes("Engineering mode not enabled")), "warn 行在场")
    assert.ok(lines.some((l) => l.includes("项目不可解析") && l.includes("(mode unchanged)")), "原因句 = 决策树文案族（KD-M1-28）")
    assert.equal(existsSync(join(amb, MANIFEST_REL)), false, "锚处零建档（不建 / 不猜）")
  } finally { rmSync(amb, { recursive: true, force: true }) }
})

test("T53 正常：梯⑤（无项目）上 ON ⇒ 放行 + 就地建档 + 附着（AC-20②——本批可拒面收窄）", async () => {
  const plain = mkPlainDir()
  try {
    const lines = []
    const agent = engAgent({ cwd: plain })
    await handleEngCommand(ctxFor(agent, lines))
    assert.equal(agent.config.agent.engineering, true, "梯⑤ 不再拒翻（建档即项目落地——git 非前提）")
    assert.ok(agent.manifest, "附着（agent.manifest ← 判据结果）")
    assert.equal(readFileSync(join(plain, MANIFEST_REL), "utf8"), LEGAL_JSON, "档在锚处生成（= DEFAULT_MANIFEST）")
    assert.ok(lines.some((l) => l.includes("❯ Eng")), "标签面正常（准翻回显）")
    assert.ok(lines.some((l) => l.includes("Engineering mode: ON")), "ON 提示行在场")
  } finally { rmSync(plain, { recursive: true, force: true }) }
})

test("T-21 错误：仓根档非法 ⇒ 拒翻——fail-closed 原因句 + 零标签", async () => {
  writeFileSync(join(tmp, MANIFEST_REL), "{ this is not valid json")
  const lines = []
  const agent = engAgent()
  await handleEngCommand(ctxFor(agent, lines))
  assert.notEqual(agent.config.agent.engineering, true, "模式未翻")
  assert.ok(!lines.some((l) => l.includes("❯ Eng")), "零标签")
  assert.ok(lines.some((l) => l.includes("fail-closed") && l.includes("(mode unchanged)")), "原因句在场")
})

test("T-22 边界：OFF 方向恒放行（非锚 cwd 亦不拦——F2 表 OFF 行）", async () => {
  const plain = mkPlainDir()
  try {
    const lines = []
    const agent = engAgent({ cwd: plain, config: { agent: { engineering: true } } })
    await handleEngCommand(ctxFor(agent, lines))
    assert.equal(agent.config.agent.engineering, false, "OFF 恒放行（零 manifest I/O）")
    assert.ok(lines.some((l) => l.includes("❯ Eng")), "OFF 走既有成功回显（标签）")
    assert.ok(lines.some((l) => l.includes("Engineering mode: OFF")))
  } finally { rmSync(plain, { recursive: true, force: true }) }
})

// ─── ENG-PLAN-EXCLUSION 批（FR31 ③ / AC14 = T12）：翻转点② `/eng` 清零（内存位 + 槽位）────

test("T12 翻转清零（FR31 ③ / AC14）：planMode=true + 排队 plan 提示语 ⇒ /eng ON 清零（内存位 + 槽位）；OFF 方向零改", async () => {
  // 槽目标：真实分配一个槽并预写 planMode:true（ON 路径槽写面的落点）
  const slot = await newSession(tmp)
  const p = slotPath(tmp, slot)
  const seeded = { ...loadSlotFile(tmp, slot), planMode: true, engineering: false }
  writeSessionFile(p, seeded)

  const lines = []
  const agent = engAgent({
    _pendingReminders: [],
  })
  // 真产出排队提示语（未经文字硬编码——产出面 = plan 工具本体）：EXIT 句（危险项）+ FULL 句
  await planTool.execute({ action: "exit" }, { agent })
  await planTool.execute({ action: "enter" }, { agent })
  agent._planTurnsSinceReminder = 3
  agent._planTurnsSinceSparse = 2
  agent._pendingReminders.push("[System reminder: unrelated]")
  assert.equal(agent.planMode, true, "前置：中途已入 plan 模式（残留半状态）")

  await handleEngCommand(ctxFor(agent, lines))

  assert.equal(agent.config.agent.engineering, true, "ON 翻转照常")
  assert.equal(agent.planMode, false, "内存位清零（FR31 ③）")
  assert.equal(agent._planTurnsSinceReminder, 0, "reminder 计数清零（防旧节奏残留）")
  assert.equal(agent._planTurnsSinceSparse, 0)
  assert.deepEqual(agent._pendingReminders, ["[System reminder: unrelated]"], "未注入的 plan 提示语被摘除、非 plan 项保留")
  assert.ok(lines.some((l) => l.includes("plan mode reset")), "清零提示行在场")
  const disk = JSON.parse(readFileSync(p, "utf8"))
  assert.equal(disk.engineering, true, "槽 engineering 落盘（既有契约）")
  assert.equal(disk.planMode, false, "槽 planMode 收正（T12 槽位判据）")

  // OFF 方向零改（FR31 边界：普通模式零改——离开工程模式不回头动 plan）
  const agent2 = engAgent({ config: { agent: { engineering: true } }, planMode: true, _pendingReminders: [] })
  await handleEngCommand(ctxFor(agent2, []))
  assert.equal(agent2.config.agent.engineering, false)
  assert.equal(agent2.planMode, true, "OFF 不碰 planMode（普通面全带宽）")
})
