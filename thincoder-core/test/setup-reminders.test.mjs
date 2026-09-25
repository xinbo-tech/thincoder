/**
 * setup-reminders.test.mjs — 提醒面单点（#113 VSC 侧并入）。
 *
 * 行为面：`pushInjections`（机器行专用注入——单条/数组/非法条目静默跳过/同文去重/
 * transient 标记）· `appendImagePointer`（粘贴图指引——depth>0 no-op / 空图 no-op /
 * 非多模态模型可见报错 / 多模态模型追加指引）· `envStateLine` 形态（回归锚）·
 * `manifestStateLine` / pushManifestStateReminder`（#28 情境行——AC-N1–AC-N6 · T8–T14；
 * #34 值变检测（mtime 门控重读）——AC-N7–AC-N7d · T32–T36）· 2026-09-21（#188）：
 * `manifestReportLine` 四态逐字 + 状态选行（AC-25——T46 / T47）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { envStateLine, pushInjections, appendImagePointer, manifestStateLine, manifestReportLine, pushManifestStateReminder } from "../agent/setup-reminders.mjs"
import { DEFAULT_MANIFEST } from "../manifest.mjs"

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
  assert.equal(manifestStateLine({ phase: "initial-dev" }), "[System reminder: project state: phase: initial-dev (rigor: light).]")
  assert.equal(manifestStateLine({ phase: "production" }), "[System reminder: project state: phase: production (rigor: strict).]")
  assert.equal(manifestStateLine({ phase: "custom" }), "[System reminder: project state: phase: custom.]", "未知 phase → 只出值、不编判据（无标签）")
  const agent = engAgent()
  assert.equal(pushManifestStateReminder(agent, { depth: 0 }), true)
  assert.deepEqual(agent.history.map((m) => m.content), ["[System reminder: project state: phase: initial-dev (rigor: light).]"], "落线恰一行")
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
  agent.history.push({ role: "user", content: "[System reminder: project state: phase: initial-dev (rigor: light).]", transient: true })
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

test("AC-N5/T12/T13 门控：depth≠0 / 非工程模式 / 无锚 → false 且零注入", () => {
  const deep = engAgent()
  const normal = engAgent()
  normal.config.agent.engineering = false
  // 门控第三腿（本批收正——KD-M1-27）：判据 = **无锚**（`agent.cwd` 缺失——零 I/O / 零报明）；
  // 「`agent.manifest` 缺失」自本批起不再是门（有锚时状态判定轴会解析出值/报明行——§2.6 ③'）。
  const noAnchor = { ...engAgent(), cwd: undefined, manifest: null }
  const noConfig = { manifest: { phase: "initial-dev" }, history: [] }
  assert.equal(pushManifestStateReminder(deep, { depth: 1 }), false, "depth:1 拒（仅 depth-0）")
  assert.equal(pushManifestStateReminder(normal, { depth: 0 }), false, "非工程模式拒")
  assert.equal(pushManifestStateReminder(noAnchor, { depth: 0 }), false, "无锚拒（零 I/O / 零报明——无既往好值 ⇒ 零注入）")
  assert.equal(pushManifestStateReminder(noConfig, { depth: 0 }), false, "无 config → 拒（可选链降级不抛）")
  for (const a of [deep, normal, noAnchor, noConfig]) assert.equal(a.history.length, 0, "零注入")
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
const lineOf = (phase, rigor) => `[System reminder: project state: phase: ${phase} (rigor: ${rigor}).]`

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

// ═══ #188 状态选行（`docs/core/design/MANIFEST.md` §2.6 条 1b / KD-M1-26——AC-25）：T46 / T47 ═══

/** 四态夹具（真判据——tmp 自建 `.git` / 数据档）：梯⑤ 空目录 / 两带档子仓（带档级歧义）/
 *  两裸仓（裸仓级歧义）/ 裸仓缺档 / 档非法。返回 = 各态锚目录。 */
function reportFixture() {
  const base = mkdtempSync(join(tmpdir(), "manifest-report-"))
  const dir = (rel) => { const d = join(base, rel); mkdirSync(d, { recursive: true }); return d }
  const doc = (rel) => { const d = dir(rel); writeFileSync(join(d, DATA_FILE), JSON.stringify(DEFAULT_MANIFEST), "utf8"); return d }
  const bare = (rel) => { const d = dir(rel); mkdirSync(join(d, ".git")); return d }
  doc("two/alpha")
  doc("two/zed")
  bare("bare-two/x")
  bare("bare-two/y")
  bare("bare-one")
  const bad = bare("bad")
  writeFileSync(join(bad, DATA_FILE), "{ not json", "utf8")
  return {
    base,
    noProject: dir("empty"),
    ambiguousManifest: join(base, "two"),
    ambiguousGit: join(base, "bare-two"),
    missing: join(base, "bare-one"),
    invalid: bad,
    ok: doc("good"),
  }
}

/** 报明行期望（逐字构造——判据 = §2.6 条 1b 逐字）。 */
const reportLine = (body) => `[System reminder: project state: ${body}]`

test("T46 报明行四态逐字（纯函数）：no-project / ambiguous 两变体 / missing / invalid；ok 态无报明行", () => {
  const f = reportFixture()
  try {
    assert.equal(
      manifestReportLine({ state: "no-project", cwd: f.noProject }),
      reportLine(`none — no project at ${f.noProject} (no manifest on the ancestor chain, none below). Parameters fall back to defaults. Create PROJECT-MANIFEST.json here to land a project (git optional).`),
      "no-project 行逐字",
    )
    assert.equal(
      manifestReportLine({ state: "ambiguous", cwd: f.ambiguousManifest, candidates: [join(f.ambiguousManifest, "alpha"), join(f.ambiguousManifest, "zed")], matched: "manifest" }),
      reportLine(`ambiguous — 2 candidate marker directories under ${f.ambiguousManifest}: ${join(f.ambiguousManifest, "alpha")}、${join(f.ambiguousManifest, "zed")} — target the intended one explicitly (the mechanism never picks).`),
      "ambiguous 带档级变体逐字（marker directories）",
    )
    assert.equal(
      manifestReportLine({ state: "ambiguous", cwd: f.ambiguousGit, candidates: [join(f.ambiguousGit, "x"), join(f.ambiguousGit, "y")], matched: "git" }),
      reportLine(`ambiguous — 2 candidate repositories under ${f.ambiguousGit} (none carries PROJECT-MANIFEST.json): ${join(f.ambiguousGit, "x")}、${join(f.ambiguousGit, "y")} — target the intended one explicitly (the mechanism never picks).`),
      "ambiguous 裸仓级变体逐字（repositories … none carries）",
    )
    assert.equal(
      manifestReportLine({ state: "missing", root: f.missing }),
      reportLine(`missing — the resolved project root ${f.missing} has no PROJECT-MANIFEST.json; project parameters fall back to defaults until the file is generated.`),
      "missing 行逐字",
    )
    assert.equal(
      manifestReportLine({ state: "invalid", path: join(f.invalid, DATA_FILE), errors: ["e1", "e2"] }),
      reportLine(`invalid — ${join(f.invalid, DATA_FILE)} is not a usable declaration: e1；e2; project parameters fall back to defaults until fixed.`),
      "invalid 行逐字（errors 逐条「；」连接）",
    )
    assert.equal(manifestReportLine({ state: "ok", cwd: f.noProject }), null, "ok 态无报明行（相位行归 manifestStateLine）")
  } finally { rmSync(f.base, { recursive: true, force: true }) }
})

test("T46b 推注入状态选行：各态 cwd 夹具 ⇒ 报明行落线；ok 态 ⇒ 相位行（行族前缀共用单活体）", () => {
  const f = reportFixture()
  const at = (cwd, manifest = null) => ({ cwd, config: { agent: { engineering: true } }, manifest, history: [], _fullHistory: [] })
  try {
    for (const [name, cwd, body] of [
      ["no-project", f.noProject, `none — no project at ${f.noProject} (no manifest on the ancestor chain, none below). Parameters fall back to defaults. Create PROJECT-MANIFEST.json here to land a project (git optional).`],
      ["ambiguous·带档", f.ambiguousManifest, `ambiguous — 2 candidate marker directories under ${f.ambiguousManifest}: ${join(f.ambiguousManifest, "alpha")}、${join(f.ambiguousManifest, "zed")} — target the intended one explicitly (the mechanism never picks).`],
      ["ambiguous·裸仓", f.ambiguousGit, `ambiguous — 2 candidate repositories under ${f.ambiguousGit} (none carries PROJECT-MANIFEST.json): ${join(f.ambiguousGit, "x")}、${join(f.ambiguousGit, "y")} — target the intended one explicitly (the mechanism never picks).`],
      ["missing", f.missing, `missing — the resolved project root ${f.missing} has no PROJECT-MANIFEST.json; project parameters fall back to defaults until the file is generated.`],
      ["invalid（首观）", f.invalid, null],
    ]) {
      const a = at(cwd)
      assert.equal(pushManifestStateReminder(a, { depth: 0 }), true, `${name}：落报明行`)
      const line = a.history[0].content
      assert.ok(line.startsWith("[System reminder: project state: "), `${name}：同族前缀（单活体机制共用）`)
      if (body) assert.equal(line, reportLine(body), `${name}：行文逐字`)
      else assert.match(line, /^\[System reminder: project state: invalid — /)
      assert.equal(a.history[0].transient, true, `${name}：transient 机器行`)
    }
    // ok 态 ⇒ 相位行（AC-N1 断言零改——报明行不干扰）
    const ok = at(f.ok)
    assert.equal(pushManifestStateReminder(ok, { depth: 0 }), true)
    assert.deepEqual(ok.history.map((m) => m.content), [lineOf("initial-dev", "light")], "ok ⇒ 相位行")
    // 相位行 → 报明行换位：行族单活体（旧行被摘、报明行入列）
    const flip = at(f.ok)
    assert.equal(pushManifestStateReminder(flip, { depth: 0 }), true, "ok 态 ⇒ 相位行")
    assert.deepEqual(flip.history.map((m) => m.content), [lineOf("initial-dev", "light")])
    rmSync(join(f.ok, DATA_FILE))
    rmSync(join(f.ok, ".git"), { recursive: true, force: true })
    assert.equal(pushManifestStateReminder(flip, { depth: 0 }), true, "档删 + 无项目 ⇒ 报明行接管")
    assert.equal(flip.history.length, 1, "行族单活体（相位行被摘）")
    assert.match(flip.history[0].content, /^\[System reminder: project state: none — /)
  } finally { rmSync(f.base, { recursive: true, force: true }) }
})

test("T47 首观失败可见 / 有既往好值保守（KD-M1-26）", () => {
  const f = reportFixture()
  const at = (cwd, manifest = null) => ({ cwd, config: { agent: { engineering: true } }, manifest, history: [], _fullHistory: [] })
  try {
    // ① 无既往好值（agent.manifest 未附着）+ 档非法 ⇒ 推 ⇒ 报明行（至少可见一次）
    const cold = at(f.invalid)
    assert.equal(pushManifestStateReminder(cold, { depth: 0 }), true, "①首观即失败 ⇒ 落报明行")
    assert.match(cold.history[0].content, /^\[System reminder: project state: invalid — /)
    assert.ok(cold.history[0].content.includes(join(f.invalid, DATA_FILE)), "行内档路径在册")
    // ② 有既往好值：先推过相位行 ⇒ 档删 / 档非法 ⇒ 行不变（T35 / T36 零改）
    const warmDir = join(f.base, "warm")
    mkdirSync(join(warmDir, ".git"), { recursive: true }) // 梯②（可解析 ⇒ 档删后状态 = missing —— 保守格）
    writeFileSync(join(warmDir, DATA_FILE), JSON.stringify({ ...DEFAULT_MANIFEST, phase: "production" }), "utf8")
    const warm = at(warmDir)
    assert.equal(pushManifestStateReminder(warm, { depth: 0 }), true)
    assert.deepEqual(stateLines(warm).map((m) => m.content), [lineOf("production", "strict")], "②前置：相位行在")
    rmSync(join(warmDir, DATA_FILE))
    assert.equal(pushManifestStateReminder(warm, { depth: 0 }), false, "②档删 ⇒ 保守（不抛、不更新）")
    assert.deepEqual(stateLines(warm).map((m) => m.content), [lineOf("production", "strict")], "行不变（沿用已知好值）")
    writeFileSync(join(warmDir, DATA_FILE), "{ not json", "utf8")
    assert.equal(pushManifestStateReminder(warm, { depth: 0 }), false, "②读回非法 ⇒ 保守（行不变）")
    assert.deepEqual(stateLines(warm).map((m) => m.content), [lineOf("production", "strict")])
  } finally { rmSync(f.base, { recursive: true, force: true }) }
})
