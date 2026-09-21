/**
 * make-agent-manifest-gate.test.mjs — M1 装配钩子模式门（台账 #30）CLI 面用例组：
 * 直调 `attachManifest`（装配钩子单一落点——CLI 装配期 ① 与 `bin` 重估点 ② 共用）。
 *
 * 设计单源 = docs/core/design/MANIFEST.md §2.2（两端装配钩子 / 模式门）· §3.1 AC-14–AC-17 ·
 * §3.2 T23–T29（含 T24b · T24c · T28b · T28c · T28d）+ AC-16 接线锁（`bin/thincoder.mjs` 源码序）。
 * 2026-09-21（#188）：入口面**非 fatal**（启动零拒绝——KD-M1-25 / M1-29）——T26 / T27 / T28③
 * 收正为「不抛 + `_projectView`」；新增建档三格 / 零建档两格（T49 / T50）。
 * 夹具：tmp 仓（`.git`）/ tmp 非仓 / 档三态（合法 · 缺 · 非法）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { attachManifest } from "../src/cli/make-agent.mjs"
import { DEFAULT_MANIFEST, MANIFEST_REL } from "@thincoder/core/manifest.mjs"

/** 合法档逐字 = `initManifest` 落盘形态（writeManifest: JSON.stringify(…, 2) + "\n"）。 */
const LEGAL_JSON = JSON.stringify(DEFAULT_MANIFEST, null, 2) + "\n"

function mkDir(t, prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  t.after(() => { try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ } })
  return dir
}
/** tmp 仓（.git 判据——resolveProjectRoot 锚自身仓） */
const mkRepo = (t) => { const d = mkDir(t, "tc-mg-repo-"); mkdirSync(join(d, ".git"), { recursive: true }); return d }
/** tmp 非仓（空目录——根不可解析） */
const mkPlain = (t) => mkDir(t, "tc-mg-plain-")
const manifestPathOf = (dir) => join(dir, MANIFEST_REL)
const writeLegalManifest = (dir) => writeFileSync(manifestPathOf(dir), LEGAL_JSON)
const readManifestText = (dir) => readFileSync(manifestPathOf(dir), "utf8")
/** 最小 agent 载体（钩子只读 agent.config / 写 agent.manifest）。 */
const agentWith = (engineering) => ({ config: { agent: { engineering } } })

// ── AC-14 / T23–T24c：普通会话（四格矩阵）——装配钩子零 manifest I/O ─────────────────

test("T23 普通会话 + 非仓 cwd ∧ 无档 → 不抛、不附着、不建档", (t) => {
  const dir = mkPlain(t)
  const agent = agentWith(false)
  assert.doesNotThrow(() => attachManifest(agent, { cwd: dir }))
  assert.equal(agent.manifest, null, "agent.manifest === null")
  assert.equal(existsSync(manifestPathOf(dir)), false, "PROJECT-MANIFEST.json 不存在")
})

test("T24 普通会话 + 仓内有合法档 → 不附着、档未被改", (t) => {
  const dir = mkRepo(t)
  writeLegalManifest(dir)
  const agent = agentWith(false)
  attachManifest(agent, { cwd: dir })
  assert.equal(agent.manifest, null, "不附着（普通会话不读）")
  assert.equal(readManifestText(dir), LEGAL_JSON, "档未被改")
})

test("T24b 普通会话 + 仓内无档 → 不建档（#30 第二症状直测）", (t) => {
  const dir = mkRepo(t)
  const agent = agentWith(false)
  attachManifest(agent, { cwd: dir })
  assert.equal(agent.manifest, null, "不附着")
  assert.equal(existsSync(manifestPathOf(dir)), false, "不建档")
})

test("T24c 普通会话 + 非仓 cwd 有档 → 不抛、不附着、档内容不变", (t) => {
  const dir = mkPlain(t)
  writeLegalManifest(dir)
  const agent = agentWith(false)
  assert.doesNotThrow(() => attachManifest(agent, { cwd: dir }))
  assert.equal(agent.manifest, null, "不附着")
  assert.equal(readManifestText(dir), LEGAL_JSON, "档内容不变")
})

// ── AC-15 / T25–T27：工程模式四态（同今日——无门语义零改） ─────────────────────────

test("T25 工程模式：仓内合法档 → 附着（①）；仓内缺档 → 建档 = DEFAULT_MANIFEST（②）", (t) => {
  const dirWith = mkRepo(t)
  writeLegalManifest(dirWith)
  const a1 = agentWith(true)
  attachManifest(a1, { cwd: dirWith })
  assert.ok(a1.manifest, "合法档 → 附着")
  assert.equal(a1.manifest.phase, DEFAULT_MANIFEST.phase, "附着内容 = 档内容")

  const dirNo = mkRepo(t)
  const a2 = agentWith(true)
  attachManifest(a2, { cwd: dirNo })
  assert.ok(a2.manifest, "缺档 + 根可解析 → 附着（初始化后）")
  assert.equal(readManifestText(dirNo), LEGAL_JSON, "建档内容 = DEFAULT_MANIFEST（写门 writer:'main'）")
})

test("T26 工程模式 + 非仓 cwd（梯⑤ 无项目）→ 不抛；锚处轻动作建档 + 附着；`_projectView.created === true`", (t) => {
  const dir = mkPlain(t)
  const agent = agentWith(true)
  assert.doesNotThrow(() => attachManifest(agent, { cwd: dir }), "启动零拒绝（KD-M1-25）")
  assert.ok(agent.manifest, "梯⑤ ⇒ 建档 + 附着（会话照常起）")
  assert.equal(readManifestText(dir), LEGAL_JSON, "档落会话锚（内容 = DEFAULT_MANIFEST；git 非前提）")
  assert.equal(agent._projectView.state, "ok", "解析结果记 agent._projectView")
  assert.equal(agent._projectView.root, dir, "根 = 会话锚")
  assert.equal(agent._projectView.created, true, "建档标记（T26 断言面）")
})

test("T27 工程模式 + 档非法 → 不抛（fail-closed 退为报明）；`_projectView.state='invalid'`；档未被改", (t) => {
  for (const [name, text] of [["非法 JSON", "{ this is not valid json"], ["非法枚举", JSON.stringify({ ...DEFAULT_MANIFEST, phase: "nope" })]]) {
    const dir = mkRepo(t)
    writeFileSync(manifestPathOf(dir), text)
    const agent = agentWith(true)
    assert.doesNotThrow(() => attachManifest(agent, { cwd: dir }), `${name}：不抛（KD-M1-25）`)
    assert.equal(agent.manifest, null, `${name}：不附着`)
    assert.equal(agent._projectView.state, "invalid", `${name}：报明状态`)
    assert.equal(agent._projectView.created, false, `${name}：零建档`)
    assert.equal(readManifestText(dir), text, `${name}：档未被改 / 未被覆盖`)
  }
})

// ── AC-16 / T28–T28d：判据值 = 会话权威值（槽优先 + config 回退） ────────────────────

test("T28 装配期判据取槽值：槽真 config 假 → 按槽判（仓内合法档 → 附着；缺档 → 建档；非仓 → 拒）", (t) => {
  // ① 仓内合法档 → 装配期即附着
  const dir = mkRepo(t)
  writeLegalManifest(dir)
  const agent = agentWith(false)
  attachManifest(agent, { cwd: dir, slotData: { engineering: true } })
  assert.ok(agent.manifest, "槽值优先——装配期即附着（config 假不生效）")
  // ② 缺档 → 按 AC-15② 处置（建档）
  const dirNo = mkRepo(t)
  attachManifest(agentWith(false), { cwd: dirNo, slotData: { engineering: true } })
  assert.equal(readManifestText(dirNo), LEGAL_JSON, "槽真 ⇒ 走工程模式初始化分支")
  // ③ 非仓（梯⑤ 无项目）⇒ 按 AC-15② 处置（轻动作建档 + 附着——启动零拒绝）
  const dirPlain = mkPlain(t)
  const a3 = agentWith(false)
  assert.doesNotThrow(() => attachManifest(a3, { cwd: dirPlain, slotData: { engineering: true } }), "槽真 ⇒ 不抛")
  assert.equal(readManifestText(dirPlain), LEGAL_JSON, "槽真 ⇒ 走建档流（梯⑤ 落点 = 锚）")
  assert.ok(a3.manifest, "附着（槽值优先）")
})

test("T28b 槽假 config 真 + 非仓 cwd → 不抛、不附着（评审轮 1 🔴 直测）", (t) => {
  const dir = mkPlain(t)
  const agent = agentWith(true)
  assert.doesNotThrow(() => attachManifest(agent, { cwd: dir, slotData: { engineering: false } }))
  assert.equal(agent.manifest, null, "按槽判（config 真不生效）")
  assert.equal(existsSync(manifestPathOf(dir)), false, "零 manifest I/O")
})

test("T28c 槽假 config 真 + 仓内无档 → 不建档", (t) => {
  const dir = mkRepo(t)
  const agent = agentWith(true)
  attachManifest(agent, { cwd: dir, slotData: { engineering: false } })
  assert.equal(agent.manifest, null, "按槽判")
  assert.equal(existsSync(manifestPathOf(dir)), false, "不建档")
})

test("T28d 重估点幂等（值同 ⇒ 无副作用）", (t) => {
  const dir = mkRepo(t)
  writeLegalManifest(dir)
  const agent = agentWith(true)
  attachManifest(agent, { cwd: dir, slotData: { engineering: true } })
  const attached = agent.manifest
  // 重估点 = bin 的 `attachManifest(agent)` 直呼（cwd 缺省 = 会话 cwd）——chdir 复刻真实调用形态
  const prev = process.cwd()
  process.chdir(dir)
  try { attachManifest(agent) } finally { process.chdir(prev) }
  assert.deepEqual(agent.manifest, attached, "重估后 agent.manifest 不变")
  assert.equal(readManifestText(dir), LEGAL_JSON, "零新写（档字节不变）")
})

// ── AC-27 / T49–T50：建档三格（轻动作）· 零建档两格 + 零自动 git ──────────────────────

test("T49 建档三格（轻动作）：梯② 锚 = 裸仓 / 梯④ 容器 + 恰一裸仓 / 梯⑤ 空目录", (t) => {
  // ② 锚 = 裸仓（`.git` 无档 ⇒ 建档机会）
  const r2 = mkRepo(t)
  const a2 = agentWith(true)
  attachManifest(a2, { cwd: r2 })
  assert.equal(readManifestText(r2), LEGAL_JSON, "②档落锚（= 裸仓根，非错层）")
  assert.equal(a2._projectView.created, true)
  assert.equal(a2._projectView.state, "ok", "建档后快照归位（_projectView = projectView 返回面 + created——§2.2 钩子段）")
  assert.equal(a2._projectView.root, r2)
  // ④ 容器 + 恰一裸仓 ⇒ 档落裸仓
  const c4 = mkPlain(t)
  const bare4 = join(c4, "bare")
  mkdirSync(join(bare4, ".git"), { recursive: true })
  const a4 = agentWith(true)
  attachManifest(a4, { cwd: c4 })
  assert.equal(readManifestText(bare4), LEGAL_JSON, "④档落裸仓根")
  assert.equal(existsSync(manifestPathOf(c4)), false, "容器处零建档")
  assert.equal(a4._projectView.root, bare4, "根 = 命中的裸仓（非容器）")
  // ⑤ 空目录 ⇒ 档落会话锚
  const r5 = mkPlain(t)
  const a5 = agentWith(true)
  attachManifest(a5, { cwd: r5 })
  assert.equal(readManifestText(r5), LEGAL_JSON, "⑤档落会话锚")
  assert.equal(a5._projectView.root, r5)
})

test("T50 零建档两格（歧义 / 档非法）+ 机制零 `git init`（源码面）", (t) => {
  // ① 歧义（≥2 带档候选）⇒ 不建档 / 不猜 + 报明
  const c = mkPlain(t)
  for (const n of ["alpha", "zed"]) {
    const d = join(c, n)
    mkdirSync(join(d, ".git"), { recursive: true })
    writeFileSync(join(d, MANIFEST_REL), LEGAL_JSON)
  }
  const a1 = agentWith(true)
  assert.doesNotThrow(() => attachManifest(a1, { cwd: c }), "歧义不抛（非 fatal）")
  assert.equal(a1.manifest, null, "不附着")
  assert.equal(a1._projectView.state, "ambiguous")
  assert.equal(a1._projectView.candidates.length, 2, "候选全列")
  assert.equal(existsSync(manifestPathOf(c)), false, "锚处零建档")
  for (const n of ["alpha", "zed"]) assert.equal(readManifestText(join(c, n)), LEGAL_JSON, "候选档未被改（不建 / 不猜）")
  // ② 档非法 ⇒ 零建档（不覆盖坏档）
  const bad = mkRepo(t)
  writeFileSync(manifestPathOf(bad), "{ broken")
  const a2 = agentWith(true)
  assert.doesNotThrow(() => attachManifest(a2, { cwd: bad }))
  assert.equal(a2._projectView.state, "invalid")
  assert.equal(readManifestText(bad), "{ broken", "坏档未被覆盖")
  // 源码面（AC-27）：机制零 `git init` 调用面（三档 + 本批拆出的工具表档）
  for (const rel of ["../src/cli/make-agent.mjs", "../../thincoder-core/manifest.mjs", "../../thincoder-vscode/src/agent/setup.mjs", "../../thincoder-vscode/src/agent/setup-tooltable.mjs"]) {
    const src = readFileSync(new URL(rel, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")
    assert.equal(/\bgit\s+init\b/.test(src), false, `${rel}：无 git init 调用面（git init = 可选增强）`)
  }
})

// ── AC-17 / T29：翻转清陈旧 ─────────────────────────────────────────────────────────

test("T29 翻转清陈旧：工程模式已附着 → 置普通 → 重调后 agent.manifest === null", (t) => {
  const dir = mkRepo(t)
  writeLegalManifest(dir)
  const agent = agentWith(true)
  attachManifest(agent, { cwd: dir })
  assert.ok(agent.manifest, "工程模式先附着")
  agent.config.agent.engineering = false
  attachManifest(agent)
  assert.equal(agent.manifest, null, "翻转后清陈旧")
})

// ── AC-16 接线锁：bin/thincoder.mjs 源码序（槽值来源先于装配；重估点在 applySession 后） ──

test("AC-16 接线锁：resumeSlot 前移（slotData 进装配）+ attachManifest(agent) 在 applySession 之后", () => {
  const src = readFileSync(new URL("../bin/thincoder.mjs", import.meta.url), "utf8")
  const iResume = src.indexOf("resumeSlot(process.cwd())")
  const iAssemble = src.indexOf("await assembleAgent({ slotData: data })")
  const iApply = src.indexOf("applySession(agent, data, { slot })")
  const iReestimate = src.indexOf("attachManifest(agent)")
  assert.ok(iResume >= 0, "TUI 分支 resumeSlot 调用在场")
  assert.ok(iAssemble >= 0, "装配调用带 slotData 形参（装配期判据来源）")
  assert.ok(iApply >= 0, "启动恢复块 applySession 调用在场")
  assert.ok(iReestimate >= 0, "重估点 attachManifest(agent) 调用在场")
  assert.ok(iResume < iAssemble, "resumeSlot 先于 assembleAgent（判据来源前置——KD-M1-15）")
  assert.ok(iApply < iReestimate, "重估点在 applySession 之后（KD-M1-13 取值点②）")
})
