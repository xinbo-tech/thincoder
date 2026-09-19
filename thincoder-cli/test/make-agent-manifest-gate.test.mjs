/**
 * make-agent-manifest-gate.test.mjs — M1 装配钩子模式门（台账 #30）CLI 面用例组：
 * 直调 `attachManifest`（装配钩子单一落点——CLI 装配期 ① 与 `bin` 重估点 ② 共用）。
 *
 * 设计单源 = docs/core/design/MANIFEST.md §2.2（两端装配钩子 / 模式门）· §3.1 AC-14–AC-17 ·
 * §3.2 T23–T29（含 T24b · T24c · T28b · T28c · T28d）+ AC-16 接线锁（`bin/thincoder.mjs` 源码序）。
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

test("T26 工程模式 + 非仓 cwd（根不可解析）→ throw「工程模式启动拒绝」且不自动建档", (t) => {
  const dir = mkPlain(t)
  const agent = agentWith(true)
  assert.throws(() => attachManifest(agent, { cwd: dir }), /工程模式启动拒绝/)
  assert.equal(existsSync(manifestPathOf(dir)), false, "不自动建档")
})

test("T27 工程模式 + 档非法 → throw fail-closed（非法 JSON / 非法枚举各一）", (t) => {
  const dirBadJson = mkRepo(t)
  writeFileSync(manifestPathOf(dirBadJson), "{ this is not valid json")
  assert.throws(() => attachManifest(agentWith(true), { cwd: dirBadJson }), /fail-closed/)

  const dirBadEnum = mkRepo(t)
  writeFileSync(manifestPathOf(dirBadEnum), JSON.stringify({ ...DEFAULT_MANIFEST, phase: "nope" }))
  assert.throws(() => attachManifest(agentWith(true), { cwd: dirBadEnum }), /fail-closed/)
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
  // ③ 非仓 → 按 AC-15③ 处置（拒且不建档）
  const dirPlain = mkPlain(t)
  assert.throws(
    () => attachManifest(agentWith(false), { cwd: dirPlain, slotData: { engineering: true } }),
    /工程模式启动拒绝/,
  )
  assert.equal(existsSync(manifestPathOf(dirPlain)), false, "拒后不自动建档")
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
