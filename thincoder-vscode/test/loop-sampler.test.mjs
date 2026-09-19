/**
 * loop-sampler.test.mjs — F-W19 宿主忙采样器机器验收（判据权威 = `docs/vsc/design/SETTINGS.md` §2.12；
 * 批档 = `docs/batches/2026-09-18-init-block.md` §2.3/§2.4）。
 *
 * 判据面：常量 100/1000/1000 · 窗口起止（证据滚出即失效——旧忙态不粘滞）· 阈值边界（999 不忙 / 1000 忙）·
 * 起停幂等（单定时器；停后无观测）· 未启动恒 false（fail-open——无证据不判忙）· 注入缝复位 ·
 * 端侧装配 `probeFailureOf` / `overrideAdmissionIfHostBusy`（`reason` 逐字 · `ts` 统一盖）·
 * 零 exec / 零 I/O（静态扫描——观测者不得自身成为阻塞源）+ 扩展挂点（activate 启 / deactivate 停）。
 *
 * 手法：`_setLoopSamplerForTest({ nowFn })` 伪时钟 ⇒ 判定面零真实等待；真实计时器只用于
 * 「让拍发生」（每拍静止 140ms ≥ 1 个采样间隔——伪时钟静止 ⇒ 该拍读取的是我推进的间隔）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { admissionOf, _resetAdmissionForTest } from "@thincoder/core/provider/list-models.mjs"
import {
  SAMPLE_INTERVAL_MS, WINDOW_MS, BUSY_LAG_MS,
  startSampler, stopSampler, hostBusy, probeFailureOf, overrideAdmissionIfHostBusy,
  _setLoopSamplerForTest,
} from "../src/extension/loop-sampler.mjs"

const here = (rel) => new URL(rel, import.meta.url)
const clock = { t: 1_000_000_000 }
const setClock = () => _setLoopSamplerForTest({ nowFn: () => clock.t })
/** 让 ≥ 1 个采样拍发生（伪时钟静止 ⇒ 该拍 lag = 0，不产生忙证据）。 */
const tick = () => new Promise((r) => setTimeout(r, 140))
/** 轮询直至判据成立（伪时钟推进后下一拍即生效——拍间隔 100ms）。 */
async function until(fn, ms = 600) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) { if (fn()) return true; await new Promise((r) => setTimeout(r, 20)) }
  return fn()
}

beforeEach(() => { stopSampler(); _resetAdmissionForTest(); clock.t = 1_000_000_000 })
afterEach(() => { stopSampler(); _setLoopSamplerForTest(null); _resetAdmissionForTest() })

test("LS-1 常量（设计值 100/1000/1000）+ 未启动 ⇒ hostBusy() 恒 false（fail-open）", () => {
  assert.equal(SAMPLE_INTERVAL_MS, 100, "采样间隔")
  assert.equal(WINDOW_MS, 1000, "判定窗口")
  assert.equal(BUSY_LAG_MS, 1000, "忙阈值（窗内 lag ≥ 本值）")
  setClock()
  clock.t += 60_000
  assert.equal(hostBusy(), false, "未启动零观测 ⇒ 不判忙（采样器缺失不误报宿主忙）")
})

test("LS-2 窗口起止：常态拍不判忙 → 5s 冻结拍判忙 → 证据滚出窗口（1001ms）即失效", async () => {
  setClock()
  startSampler()
  clock.t += 50
  await tick()
  assert.equal(hostBusy(), false, "常态拍（lag 50 < 阈值）零证据")
  clock.t += 5000
  assert.equal(await until(() => hostBusy()), true, "事件循环被占 5s ⇒ 解冻首拍 lag ≥ 阈值 ⇒ 忙")
  clock.t += WINDOW_MS + 1
  assert.equal(hostBusy(), false, "忙证据以自身观测时刻计窗——滚出窗口即失效（旧忙态不粘滞）")
})

test("LS-3 阈值边界：窗内 lag 999 不判忙 / lag 1000 判忙（含边界）", async () => {
  setClock()
  startSampler()
  clock.t += BUSY_LAG_MS - 1
  await tick()
  assert.equal(hostBusy(), false, "lag 999 < 1000 ⇒ 不判忙")
  clock.t += BUSY_LAG_MS
  assert.equal(await until(() => hostBusy()), true, "lag 1000 ⇒ 判忙（≥ 含边界）")
})

test("LS-4 起停幂等：start×2 ⇒ 单定时器 / stop×2 不抛 / 停后可重启", async () => {
  setClock()
  startSampler()
  startSampler()
  stopSampler()
  clock.t += 60_000
  await tick()
  assert.equal(hostBusy(), false, "start×2 只留单定时器——stop×1 后时钟再跳仍零观测（双定时器则记忙）")
  stopSampler()
  startSampler()
  clock.t += 5000
  assert.equal(await until(() => hostBusy()), true, "停后可重启（不粘死）")
})

test("LS-5 注入缝复位：_setLoopSamplerForTest(null) ⇒ 判定回真实时钟（伪时钟推进不再记忙）", async () => {
  setClock()
  startSampler()
  clock.t += 5000
  assert.equal(await until(() => hostBusy()), true, "伪时钟先判忙")
  _setLoopSamplerForTest(null) // 复位 = null
  stopSampler()
  startSampler()
  clock.t += 60_000 // 复位已生效 ⇒ 本推进不进判定面（未复位则下一拍记 lag 60s ⇒ 判忙——反例面）
  await tick()
  assert.equal(hostBusy(), false, "复位后判定用真实时钟（lag ≈ 采样间隔）——伪时钟推进零效果")
})

test("LS-6 零 exec / 零 I/O：采样器模块静态扫描（观测者不得自身成为阻塞源）", () => {
  const src = readFileSync(here("../src/extension/loop-sampler.mjs"), "utf8")
  for (const bad of ["node:child_process", "node:fs", "node:worker_threads", "execSync(", "execFile(", "spawnSync(", "spawn(", "readFileSync("]) {
    assert.ok(!src.includes(bad), `采样器不得含 ${bad}（零 exec / 零 I/O）`)
  }
  assert.ok(src.includes(".unref()"), "采样定时器 unref（deactivate 后进程可正常结束）")
})

test("LS-7 端侧装配：probeFailureOf（忙证据覆盖核分类）/ overrideAdmissionIfHostBusy（reason 逐字）", async () => {
  setClock()
  assert.equal(probeFailureOf(new Error("boom")), "malformed", "非忙 ⇒ 核分类 malformed")
  assert.equal(probeFailureOf(Object.assign(new Error("x"), { name: "TimeoutError" })), "timeout", "非忙 ⇒ 核分类 timeout")
  assert.equal(overrideAdmissionIfHostBusy("kimi", "R"), false, "非忙不覆盖（核落账保留）")
  assert.equal(admissionOf("kimi"), null, "非忙零落账")
  startSampler()
  clock.t += 5000
  assert.equal(await until(() => hostBusy()), true, "进入忙态")
  assert.equal(probeFailureOf(new Error("boom")), "hostBusy", "忙证据覆盖 ⇒ hostBusy（非渠道故障）")
  assert.equal(overrideAdmissionIfHostBusy("kimi", "R-逐字"), true, "忙 ⇒ 覆盖落账")
  const rec = admissionOf("kimi")
  assert.equal(rec.ok, false)
  assert.equal(rec.failure, "hostBusy")
  assert.equal(rec.reason, "R-逐字", "reason 逐字不动（channelUnavailableMessage 零改）")
  assert.ok(Number.isFinite(rec.ts), "落账统一盖 ts")
})

test("LS-8 扩展挂点：activate 启采样 / deactivate 停采样（结构性）", () => {
  const src = readFileSync(here("../extension.mjs"), "utf8")
  const act = src.indexOf("export async function activate")
  const deact = src.indexOf("export function deactivate")
  assert.ok(act >= 0 && deact > act, "扩展入口形状（activate / deactivate 声明在场且有序）")
  assert.match(src.slice(act, deact), /startSampler\(\)/, "activate 内挂 startSampler()")
  assert.match(src.slice(deact), /stopSampler\(\)/, "deactivate 内挂 stopSampler()")
})
