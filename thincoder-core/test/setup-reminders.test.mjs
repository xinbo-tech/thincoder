/**
 * setup-reminders.test.mjs — 提醒面单点（#113 VSC 侧并入）。
 *
 * 行为面：`pushInjections`（机器行专用注入——单条/数组/非法条目静默跳过/同文去重/
 * transient 标记）· `appendImagePointer`（粘贴图指引——depth>0 no-op / 空图 no-op /
 * 非多模态模型可见报错 / 多模态模型追加指引）· `envStateLine` 形态（回归锚）·
 * `manifestStateLine` / `pushManifestStateReminder`（#28 情境行——AC-N1–AC-N6 · T8–T14；
 * #34 值变检测（mtime 门控重读）——AC-N7–AC-N7d · T32–T36）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { envStateLine, pushInjections, appendImagePointer, manifestStateLine, pushManifestStateReminder } from "../agent/setup-reminders.mjs"

test("envStateLine：形态锚（mode / model / slot / resumed 四字段）", () => {
  const line = envStateLine({ mode: "eng", model: "kimi-k3", slot: 3, resumed: true })
  assert.match(line, /^\[System reminder: env: /)
  assert.ok(line.includes("mode: eng"))
  assert.ok(line.includes("model: kimi-k3"))
  assert.ok(line.includes("slot: 3"))
  assert.ok(line.includes("resumed: yes"))
  assert.ok(envStateLine({ mode: "normal", model: "m", slot: null, resumed: false }).includes("resumed: no"))
})

test("#113 pushInjections：单条 / 数组 / 非法条目跳过 / transient 标记", () => {
  const history = []
  pushInjections(history, { content: "one" })
  pushInjections(history, [{ content: "two" }, { content: "three" }])
  pushInjections(history, [null, {}, { content: 42 }, "raw-string"])
  assert.deepEqual(history.map((m) => m.content), ["one", "two", "three"])
  assert.ok(history.every((m) => m.transient === true && m.role === "user"))
  pushInjections(history, null)
  pushInjections(history, undefined)
  assert.equal(history.length, 3, "空输入 no-op")
})

test("#113 pushInjections：同文去重（幂等注入）——已有等文消息则跳过该条", () => {
  const history = [{ role: "user", content: "ctx-A" }]
  pushInjections(history, [{ content: "ctx-A" }, { content: "ctx-B" }])
  assert.deepEqual(history.map((m) => m.content), ["ctx-A", "ctx-B"], "重复 ctx-A 跳过、ctx-B 注入")
  pushInjections(history, { content: "ctx-B" })
  assert.equal(history.length, 2, "再次幂等")
})

test("#113 appendImagePointer：depth>0 / 空图 / 消息缺失 ⇒ no-op；非多模态 ⇒ 抛错；多模态 ⇒ 追加指引", () => {
  // no-op 面
  const m1 = { content: "hi" }
  appendImagePointer(m1, ["a.png"], "kimi-k3", { depth: 1 })
  assert.equal(m1.content, "hi", "depth>0 不追加")
  appendImagePointer(m1, [], "kimi-k3", { depth: 0 })
  assert.equal(m1.content, "hi", "空图不追加")
  appendImagePointer(null, ["a.png"], "kimi-k3", { depth: 0 })
  // 非多模态 ⇒ 可见报错（不静默丢）
  assert.throws(
    () => appendImagePointer({ content: "hi" }, ["a.png"], "deepseek-v4-pro", { depth: 0 }),
    /does not support pasted images/,
  )
  // 多模态 ⇒ 指引追加到真实用户消息尾
  const m2 = { content: "look at this" }
  appendImagePointer(m2, ["C:/tmp/paste-1.png", "C:/tmp/paste-2.png"], "kimi-k3", { depth: 0 })
  assert.match(m2.content, /look at this\n\n\[Attached images: C:\/tmp\/paste-1\.png \| C:\/tmp\/paste-2\.png\] — use the read_image tool to view them before answering\.$/)
  assert.equal(typeof m2.content, "string", "content 保持字符串形态（非 parts 数组）")
})

// ═══ #28 情境行（`docs/core/design/MANIFEST.md` §2.6——AC-N1–AC-N6 · 用例 T8–T14）═══════

/** 最小 depth-0 agent 夹具（工程模式 + manifest + 机器/人读双线）。 */
const engAgent = (manifest = { phase: "initial-dev" }) =>
  ({ config: { agent: { engineering: true } }, manifest, history: [], _fullHistory: [] })
const stateLines = (agent) => agent.history.filter((m) => m.content.startsWith("[System reminder: project state: "))

test("AC-N1/T8 情境行逐字：phase 单字段（两合法值 + 未知值）；落线恰一行", () => {
  assert.equal(manifestStateLine({ phase: "initial-dev" }), "[System reminder: project state: phase: initial-dev (discipline: light).]")
  assert.equal(manifestStateLine({ phase: "production" }), "[System reminder: project state: phase: production (discipline: strict).]")
  assert.equal(manifestStateLine({ phase: "custom" }), "[System reminder: project state: phase: custom.]", "未知 phase → 只出值、不编判据（无标签）")
  const agent = engAgent()
  assert.equal(pushManifestStateReminder(agent, { depth: 0 }), true)
  assert.deepEqual(agent.history.map((m) => m.content), ["[System reminder: project state: phase: initial-dev (discipline: light).]"], "落线恰一行")
  assert.equal(agent.history[0].transient, true)
})

test("AC-N2/T9 幂等：同值重调 → false 且 history 长度不变", () => {
  const agent = engAgent()
  assert.equal(pushManifestStateReminder(agent, { depth: 0 }), true, "首推落行")
  const len = agent.history.length
  assert.equal(pushManifestStateReminder(agent, { depth: 0 }), false, "同值重调 → false")
  assert.equal(agent.history.length, len, "零历史变更")
})

test("AC-N3/T10 单活体：值变后该前缀行恰 1 条、旧文零命中、数组引用不变", () => {
  const agent = engAgent()
  const ref = agent.history
  pushManifestStateReminder(agent, { depth: 0 })
  agent.manifest = { phase: "production" }
  assert.equal(pushManifestStateReminder(agent, { depth: 0 }), true, "值变 → 落新行")
  assert.equal(agent.history, ref, "history 数组引用不变（就地 splice）")
  assert.equal(stateLines(agent).length, 1, "该前缀行恰 1 条")
  assert.equal(agent.history.some((m) => m.content.includes("initial-dev")), false, "旧文零命中")
})

test("AC-N3b 会话重建：history 带旧行而 _manifestLine 缺失 → 值变仍单活体", () => {
  const agent = engAgent()
  agent.history.push({ role: "user", content: "[System reminder: project state: phase: initial-dev (discipline: light).]", transient: true })
  agent.manifest = { phase: "production" }
  assert.equal(pushManifestStateReminder(agent, { depth: 0 }), true)
  assert.equal(stateLines(agent).length, 1, "旧行被摘（从 history 认领现存活体）")
})

test("AC-N4/T11 压缩自愈：行被移除（模拟压缩吞咽）后下一回合重推", () => {
  const agent = engAgent()
  pushManifestStateReminder(agent, { depth: 0 })
  agent.history.splice(0, agent.history.length)
  assert.equal(pushManifestStateReminder(agent, { depth: 0 }), true, "重推")
  assert.equal(agent.history.length, 1, "行回来（零触碰 context.mjs 压缩面）")
})

test("AC-N5/T12/T13 门控：depth≠0 / 非工程模式 / manifest 缺失 → false 且零注入", () => {
  const deep = engAgent()
  const normal = engAgent()
  normal.config.agent.engineering = false
  const noManifest = { ...engAgent(), manifest: null }
  const noConfig = { manifest: { phase: "initial-dev" }, history: [] }
  assert.equal(pushManifestStateReminder(deep, { depth: 1 }), false, "depth:1 拒（仅 depth-0）")
  assert.equal(pushManifestStateReminder(normal, { depth: 0 }), false, "非工程模式拒")
  assert.equal(pushManifestStateReminder(noManifest, { depth: 0 }), false, "manifest 缺失拒")
  assert.equal(pushManifestStateReminder(noConfig, { depth: 0 }), false, "无 config → 拒（可选链降级不抛）")
  for (const a of [deep, normal, noManifest, noConfig]) assert.equal(a.history.length, 0, "零注入")
})

test("AC-N6 面纪律：注入行 transient:true / role:user；_fullHistory 零新增", () => {
  const agent = engAgent()
  agent._fullHistory.push({ role: "user", content: "hi" })
  pushManifestStateReminder(agent, { depth: 0 })
  assert.equal(agent.history[0].transient, true, "机器行（持久化层可丢）")
  assert.equal(agent.history[0].role, "user")
  assert.equal(agent._fullHistory.length, 1, "人读线零新增")
})

// ═══ #34 值变重推（盘面驱动——`docs/core/design/MANIFEST.md` §2.6 ③b · KD-M1-17–M1-19）：T32–T36 ═══
// 夹具 = 临时项目根（真 `.git` 判据 + 真数据档 + 真 cwd）；mtime 用 utimesSync 确定性推进。

/** 定死基准 mtime（ms）——避开「同毫秒二次写不被观测」的天然抖动（§2.6 条 3 边界登记）。 */
const T0 = new Date("2026-01-02T03:04:05.000Z").getTime()

/** 写真实数据档（五键齐——`readManifest` ok:true）；给定 mtimeMs 则定死（确定性前提）。 */
function writeDataFile(root, phase, mtimeMs) {
  const p = join(root, "PROJECT-MANIFEST.json")
  writeFileSync(p, JSON.stringify({
    version: 1,
    phase,
    docRoot: {
      requirements: "docs/requirements", specs: "docs/requirements/specs", design: "docs/design",
      modules: "docs/design/modules", batches: "docs/batches",
    },
    promptsLanding: "thincoder-core/prompts",
    checkConfig: { scanDirs: ["docs"], lineWidth: 300, anchors: { domain: "docs", exclude: ["_archive", "batches"] }, exemptions: [] },
  }, null, 2) + "\n")
  if (mtimeMs !== undefined) utimesSync(p, new Date(mtimeMs), new Date(mtimeMs))
  return p
}

/** 临时项目根 + 真实数据档（`.git` 目录 ⇒ 项目根 = 自身）。 */
function makeRoot(phase, mtimeMs) {
  const root = mkdtempSync(join(tmpdir(), "manifest-refresh-"))
  mkdirSync(join(root, ".git"))
  writeDataFile(root, phase, mtimeMs)
  return root
}

/** 带锚工程 agent（真 cwd；内存 manifest = 装配期值——盘面刷新归 ③b）。 */
const diskAgent = (cwd, phase) =>
  ({ cwd, config: { agent: { engineering: true } }, manifest: { phase }, history: [], _fullHistory: [] })

const DATA_FILE = "PROJECT-MANIFEST.json"
const lineOf = (phase, discipline) => `[System reminder: project state: phase: ${phase} (discipline: ${discipline}).]`

test("AC-N7/T32 值变重推（盘面驱动）：会话内盘上 phase 变（mtime 推进）→ 下回合行 = 新值", () => {
  const root = makeRoot("initial-dev", T0)
  const agent = diskAgent(root, "initial-dev")
  try {
    assert.equal(pushManifestStateReminder(agent, { depth: 0 }), true, "首推落行")
    assert.deepEqual(stateLines(agent).map((m) => m.content), [lineOf("initial-dev", "light")], "首行 = 盘面值")
    writeDataFile(root, "production", T0 + 1000) // 会话内改档（mtime 确定性推进）
    assert.equal(pushManifestStateReminder(agent, { depth: 0 }), true, "值变 → 重推")
    assert.deepEqual(stateLines(agent).map((m) => m.content), [lineOf("production", "strict")],
      "行 = 新值；旧行被摘（单活体）")
    assert.equal(agent.manifest.phase, "production", "采纳进 agent.manifest")
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("AC-N7d/T33 首次观测对齐：缓存未设（首回合 / 会话恢复后）⇒ 读一次对齐盘面值", () => {
  const root = makeRoot("production", T0)
  const agent = diskAgent(root, "initial-dev") // 内存值 ≠ 盘面值（装配期残留）
  try {
    assert.equal(pushManifestStateReminder(agent, { depth: 0 }), true)
    assert.deepEqual(stateLines(agent).map((m) => m.content), [lineOf("production", "strict")], "首推即盘面值")
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("AC-N7b/T34 未变零重读：mtime 未推进（内容变 + mtime 复位）⇒ false 且行不变", () => {
  const root = makeRoot("initial-dev", T0)
  const agent = diskAgent(root, "initial-dev")
  try {
    assert.equal(pushManifestStateReminder(agent, { depth: 0 }), true)
    assert.equal(agent._manifestMtime, T0, "首推对齐缓存 = 档 mtime")
    writeDataFile(root, "production", T0) // 内容变、mtime 复位（未推进）
    assert.equal(pushManifestStateReminder(agent, { depth: 0 }), false, "未变 → 不重读（同文幂等）")
    assert.deepEqual(stateLines(agent).map((m) => m.content), [lineOf("initial-dev", "light")], "行不变")
    assert.equal(agent.manifest.phase, "initial-dev", "沿用内存值（盘上新值未被观测）")
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("AC-N7c/T35 失败退化（stat 失败）：档被删 ⇒ 不抛、不更新、不清零；行不变", () => {
  const root = makeRoot("production", T0)
  const agent = diskAgent(root, "initial-dev")
  try {
    assert.equal(pushManifestStateReminder(agent, { depth: 0 }), true, "首推对齐盘面 = production")
    rmSync(join(root, DATA_FILE))
    assert.equal(pushManifestStateReminder(agent, { depth: 0 }), false, "档删 → 不抛、沿用已知值")
    assert.deepEqual(stateLines(agent).map((m) => m.content), [lineOf("production", "strict")], "行不变（单活体）")
    assert.equal(agent.manifest.phase, "production", "不清零（沿用上次已知好值）")
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("AC-N7c/T36 读回非法 ⇒ 保守（缓存不推进）；修好 ⇒ 自愈（同 mtime 仍重试采纳）", () => {
  const root = makeRoot("initial-dev", T0)
  const agent = diskAgent(root, "initial-dev")
  const file = join(root, DATA_FILE)
  try {
    assert.equal(pushManifestStateReminder(agent, { depth: 0 }), true)
    writeFileSync(file, "{ not json")
    utimesSync(file, new Date(T0 + 1000), new Date(T0 + 1000)) // mtime 推进 ⇒ 进重读路径、读回非法
    assert.equal(pushManifestStateReminder(agent, { depth: 0 }), false, "读回非法 → 保守（不抛、不更新）")
    assert.deepEqual(stateLines(agent).map((m) => m.content), [lineOf("initial-dev", "light")], "沿用旧值、行不变")
    writeDataFile(root, "production", T0 + 1000) // 修好（mtime 停在上次失败的观测值）
    assert.equal(pushManifestStateReminder(agent, { depth: 0 }), true, "自愈：缓存未推进 ⇒ 同 mtime 仍重读采纳")
    assert.deepEqual(stateLines(agent).map((m) => m.content), [lineOf("production", "strict")], "行更新")
  } finally { rmSync(root, { recursive: true, force: true }) }
})
