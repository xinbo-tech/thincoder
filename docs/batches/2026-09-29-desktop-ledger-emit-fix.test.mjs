/**
 * 2026-09-29-desktop-ledger-emit-fix.test.mjs — 桌面台账出站修复批（`sessionResume` 缺 await · 台账 #666）· **批次本地件**
 * （落位沿 #545 现行法：批内件住 `docs/batches/` · 不登记常驻套件 · 随批留存；格式先例 = `2026-09-29-desktop-config-read-receipt.test.mjs`）。
 * 运行（自 `thincoder/` 根）：`node --test docs/batches/2026-09-29-desktop-ledger-emit-fix.test.mjs`
 *
 * 射程 = 「同步消费 async 回执」类接线回归（批档 §2.2 修法 ∕ §2.5 用例表 ∕ §2.11 现行值）：
 *   `sessionResume`（`thincoder-desktop/src/main/ipc.mjs`）对 async `resumeSession`（真签名 = `session-actions.mjs:75`）
 *   缺 `await` ⇒ `receipt` = Promise ⇒ 两守卫（`scheduleSessionGC` ∕ `pushLedgerLines` 出站）恒不点火
 *   —— 段 11 台账恒缺之根因（守卫静默失效）。
 *
 * 形态 = 源码抽取 + `node:vm` 沙箱真跑产品源文本（注入替身；断言面 = 行为读数，非文本扫描——防假绿）。
 *   抽取锚 = `indexOf("function sessionResume(")` + 前置回扫（命中点前缀 `async ` ⇒ 前置补回——修后态可编译；
 *   无前缀 ⇒ 原样——修前 ∕ 变异态）：两态块皆可编译并跑断言。避 `electron` 静态导入（`ipc.mjs:39`）。
 *
 * 用例（R1–R7）与两态期望（批档 §2.11 收正②——修前红集 = R1 ∕ R4 ∕ R5（守卫敏感：计数断言抛）；
 * R2 ∕ R3 ∕ R7 两态皆绿语义锁；R6 = 变异腿：live 源未落 await ⇒ 变异未命中即红）：
 *   R1 正常径  两 hook 各恰 1 次 ∧ 回执信封形不变                     修前红（守卫判在 Promise 上 ⇒ 0 次）
 *   R2 后台面  `pushLedgerLines` 永不 settle ⇒ 回执仍即刻 settle      两态皆绿（`void` 语义锁——改 await 即红）
 *   R3 错误径  `ok:false` ⇒ 两 hook 0 次 ∧ 失败信封原样               两态皆绿
 *   R4 边界    `slot:null` ⇒ GC 1 次 ∧ 出站 0 次                      修前红
 *   R5 边界    `ledgerEmit:null` ⇒ 出站 0 次 ∧ GC 1 次                修前红
 *   R6 变异腿  live 源去 await 变异必命中 ∧ 变异源下守卫敏感断言体必抛  修前红（源内无 await ⇒ 未命中）
 *   R7 拒绝径  `resumeSession` reject ⇒ 同因直传（不吞）∧ 两 hook 0 次  两态皆绿（fail-loud）
 */
import assert from "node:assert/strict"
import { test } from "node:test"
import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import vm from "node:vm"

const here = dirname(fileURLToPath(import.meta.url)) // 终位 = thincoder/docs/batches
const SRC = join(here, "../..", "thincoder-desktop", "src", "main", "ipc.mjs")
const src = await readFile(SRC, "utf8")

const ANCHOR = "function sessionResume("
const ENVELOPE = { ok: true, reason: null, cwd: "/p", slot: 7 }

/** 抽取 `sessionResume` 函数块（锚 + 前置回扫 + 花括号配平；修前 ∕ 修后 ∕ 变异三态皆可编译）。 */
const extractSessionResume = (text) => {
  const idx = text.indexOf(ANCHOR)
  assert.notEqual(idx, -1, `抽取锚未命中：源内无 \`${ANCHOR}\``)
  const prefix = text.slice(0, idx).endsWith("async ") ? "async " : ""
  const open = text.indexOf("{", idx)
  assert.notEqual(open, -1, "抽取锚后无函数体 `{`")
  let depth = 0
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1
    else if (text[i] === "}") {
      depth -= 1
      if (depth === 0) return `${prefix}${text.slice(idx, i + 1)}`
    }
  }
  assert.fail("sessionResume 函数块花括号不配平")
}

/**
 * 装配：真跑产品源文本（vm 沙箱 · 注入替身）。替身 `resumeSession` 恒 Promise 返回（镜像真签名 async
 * ——守卫敏感性之前提，批档 §2.11 收正②）。
 */
const build = ({ source = src, resume = null, push = null, ledgerEmit = {}, cwd = "/p" } = {}) => {
  const calls = { gc: [], emit: [] }
  const handler = vm.runInNewContext(`${extractSessionResume(source)}\n;sessionResume`, {
    resumeSession: resume ?? (async () => ({ ...ENVELOPE })),
    currentCwd: () => cwd,
    scheduleSessionGC: (arg) => { calls.gc.push(arg) },
    pushLedgerLines: push ?? (async (arg) => { calls.emit.push(arg) }),
    ledgerEmit,
  })
  return { handler, calls, post: ledgerEmit }
}

/** 守卫敏感断言体（R1 型；R6 变异源下复用）——行为读数：回执信封形 ⊕ 两 hook 调用 ∕ 入参。 */
const assertGuardSensitive = async (handler, calls, post) => {
  const pending = handler()
  assert.equal(typeof pending?.then, "function", "handler 返回值须为 thenable（派遣缝回执链形不变）")
  const receipt = await pending
  assert.deepEqual(receipt, ENVELOPE, `回执信封形不得变（实 = ${JSON.stringify(receipt)}）`)
  assert.equal(calls.gc.length, 1, `scheduleSessionGC 须恰 1 次（实 = ${calls.gc.length}——守卫判在 Promise 上即 0）`)
  assert.deepEqual(calls.gc, ["/p"])
  assert.equal(calls.emit.length, 1, `pushLedgerLines 须恰 1 次（实 = ${calls.emit.length}——守卫判在 Promise 上即 0）`)
  assert.equal(calls.emit[0].cwd, "/p")
  assert.equal(calls.emit[0].key, "7")
  assert.equal(calls.emit[0].post, post)
}

test("R1 · 正常径：两 hook 各恰 1 次（守卫活在真实回执上）∧ 回执信封形不变", async () => {
  const { handler, calls, post } = build()
  await assertGuardSensitive(handler, calls, post)
})

test("R2 · 后台面（void 语义锁）：pushLedgerLines 永不 settle ⇒ 回执仍于 setImmediate 哨兵前 settle", async () => {
  const { handler } = build({ push: () => new Promise(() => {}) })
  let outcome = null
  Promise.resolve(handler()).then(
    (value) => { outcome = { ok: true, value } },
    (reason) => { outcome = { ok: false, reason } },
  )
  await new Promise((resolve) => setImmediate(resolve))
  assert.notEqual(outcome, null, "回执须于哨兵前 settle（若改 await pushLedgerLines ⇒ 永不 settle，红）")
  assert.equal(outcome.ok, true, `回执不得拒绝（实 = ${outcome.reason?.message}）`)
  assert.deepEqual(outcome.value, ENVELOPE)
})

test("R3 · 错误径：ok:false ⇒ 两 hook 0 次 ∧ 失败信封原样返回", async () => {
  const failure = { ok: false, reason: "no-project", cwd: null, slot: null }
  const { handler, calls } = build({ resume: async () => failure })
  const receipt = await handler()
  assert.deepEqual(receipt, failure)
  assert.equal(calls.gc.length, 0)
  assert.equal(calls.emit.length, 0)
})

test("R4 · 边界：slot:null ⇒ GC 1 次 ∧ 出站 0 次（slot != null 门）", async () => {
  const envelope = { ok: true, reason: null, cwd: "/p", slot: null }
  const { handler, calls } = build({ resume: async () => envelope })
  assert.deepEqual(await handler(), envelope)
  assert.deepEqual(calls.gc, ["/p"])
  assert.equal(calls.emit.length, 0)
})

test("R5 · 边界：ledgerEmit 未注入（null）⇒ 出站 0 次 ∧ GC 1 次（GC 不依赖注入面）", async () => {
  const { handler, calls } = build({ ledgerEmit: null })
  assert.deepEqual(await handler(), ENVELOPE)
  assert.deepEqual(calls.gc, ["/p"])
  assert.equal(calls.emit.length, 0)
})

test("R6 · 变异腿（守卫敏感）：live 源去 await 变异必命中 ∧ 变异源下断言体必抛", async () => {
  const mutated = src.replace("await resumeSession(", "resumeSession(")
  assert.ok(mutated !== src, "变异未命中：源内无 `await resumeSession(`——实现未落 await（红）")
  const { handler, calls, post } = build({ source: mutated })
  let threw = null
  try {
    await assertGuardSensitive(handler, calls, post)
  } catch (err) {
    threw = err
  }
  assert.notEqual(threw, null, "守卫敏感断言体在变异源下必须抛（= 修前形态红，脚本化复现）")
  assert.equal(threw?.name, "AssertionError", `须由断言体自身抛错（实 = ${threw?.name}: ${threw?.message}）`)
})

test("R7 · 拒绝径：resumeSession reject ⇒ 同因直传（不吞）∧ 两 hook 0 次", async () => {
  const boom = new Error("resume-boom")
  const { handler, calls } = build({ resume: async () => { throw boom } })
  await assert.rejects(handler(), (err) => err === boom, "拒绝须同因直传（fail-loud——不得吞）")
  assert.equal(calls.gc.length, 0)
  assert.equal(calls.emit.length, 0)
})
