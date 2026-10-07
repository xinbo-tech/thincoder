/**
 * 2026-10-07-ledger-tool.test.mjs — 台账工具面改造批 · 批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根（thincoder/）：
 *   node --test docs/batches/2026-10-07-ledger-tool.test.mjs
 *
 * 腿（设计档 LEDGER.md §13.6 用例表 + DESIGN-TOKEN-SETTLEMENT.md §10 用例面）：
 *   ① 一跳核销 U-LT1–4（含向后兼容缺参路径）∥ ② trigger 过滤 U-LT5–6
 *   ③ 点火入边扩面 U-LT7–8 ∥ ④ aged 逐行 U-LT9–10（含导出零涉）
 *   ⑤ design-slots / 批量 consume U-SL1–9（清点只读零写 ∥ 批列派生 ∥ 批量恰一 / 幂等 ∥
 *      选择器 ∥ 拒面 ∥ 失败回滚 ∥ 不复活 ∥ 多槽隔离 ∥ 门外拒）
 * 夹具：台账 = `_setLedgerDirForTest` 临时目录 + PROJECT-MANIFEST.json 项目（同 #923 批先例）；
 * 槽面 = `_setSessionsDirForTest` 临时会话目录 + `_slot` 直钉槽 1（不碰真实用户目录）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { randomUUID } from "node:crypto"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const toolsMod = await mod("thincoder-core/ledger-tools.mjs")
const cmdMod = await mod("thincoder-core/ledger-cmd.mjs")
const dbMod = await mod("thincoder-core/ledger-db.mjs")
const readMod = await mod("thincoder-core/ledger-read.mjs")
const sessionSlots = await mod("thincoder-core/session-slots.mjs")
const subagentMod = await mod("thincoder-core/agent-tools/subagent.mjs")
const spawnMod = await mod("thincoder-core/agent-tools/subagent-spawn.mjs")
const gatesMod = await mod("thincoder-core/agent/dispatch-gates.mjs")

const DAY = 86400000
const created = []
const tmpBase = (tag) => { const d = mkdtempSync(join(tmpdir(), `lt-${tag}-`)); created.push(d); return d }
test.after(() => { for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true }) })

dbMod._setLedgerDirForTest(join(tmpBase("ledger-root"), "ledger"))
test.after(() => dbMod._resetLedgerDirForTest())
const sessionsDir = tmpBase("sessions")
mkdirSync(sessionsDir, { recursive: true })
sessionSlots._setSessionsDirForTest(sessionsDir)
test.after(() => sessionSlots._resetSessionsDirForTest())

/** 项目夹具（PROJECT-MANIFEST.json 在场 ⇒ 归属解析确定；docs/batches/task.md = 写门指针靶）。 */
function mkProject(base, name) {
  const dir = join(base, name)
  mkdirSync(join(dir, "docs", "batches"), { recursive: true })
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  writeFileSync(join(dir, "docs", "batches", "task.md"), "# 任务书夹具\n\n## §1 占位\n")
  return dir
}
const call = (tool, args, cwd) => tool.execute(args, { cwd })
const rowOf = (cwd, id) => cmdMod.ledgerQuery({ cwd }).find((r) => r.id === id)
/** 拒面读数（消息子串 / 正则）：拒 = throw 且消息匹配。 */
async function refusal(p, re) {
  let msg = null
  try { await p } catch (e) { msg = String(e?.message ?? e) }
  assert.notEqual(msg, null, "应拒（throw）")
  assert.match(msg, re)
}

// ── ① 一跳核销（U-LT1–4） ───────────────────────────────────────────────────
const legClose = (() => {
  const P = mkProject(tmpBase("close"), "proj-close")
  const add = (row) => cmdMod.ledgerAdd({ cwd: P, row })
  const to = (id, status) => cmdMod.ledgerUpdate({ cwd: P, id, patch: { status }, executorSessionId: null })
  const r1 = add({ kind: "requirement", title: "追认一跳" }); to(r1, "待设计")
  const r2 = add({ kind: "requirement", title: "勾销携证据" }); to(r2, "待设计")
  cmdMod.ledgerUpdate({ cwd: P, id: r2, patch: { status: "在途", task_book: "docs/batches/task.md§1" }, executorSessionId: "s-burn" })
  to(r2, "待核销")
  const r3 = add({ kind: "requirement", title: "缺证据" })
  const r4 = add({ kind: "requirement", title: "行值证据", evidence: "既有行值" }); to(r4, "待设计")
  const r5 = add({ kind: "requirement", title: "无证据行" })
  return { P, r1, r2, r3, r4, r5 }
})()

test("U-LT1 · 追认核销一跳：close 携 evidence（行 待设计）", async () => {
  const out = await call(toolsMod.ledgerTool, { action: "close", id: legClose.r1, status: "已核销", evidence: "一跳证据" }, legClose.P)
  assert.deepEqual(JSON.parse(out), { id: legClose.r1, status: "已核销" })
  const row = rowOf(legClose.P, legClose.r1)
  assert.equal(row.status, "已核销")
  assert.equal(row.evidence, "一跳证据")
})

test("U-LT2 · 追认缺证据（无参 / 全空白）⇒ 拒——文案逐字、行不变", async () => {
  for (const args of [
    { action: "close", id: legClose.r3, status: "已核销" },
    { action: "close", id: legClose.r3, status: "已核销", evidence: "   " },
  ]) {
    await assert.rejects(call(toolsMod.ledgerTool, args, legClose.P),
      { message: "ledgerClose：追认核销须带 evidence（现态 待讨论）" })
  }
  const row = rowOf(legClose.P, legClose.r3)
  assert.equal(row.status, "待讨论")
  assert.equal(row.evidence, null)
})

test("U-LT3 · 勾销携 evidence（待核销 → 已核销）：写入落行（内容不判）", async () => {
  const out = await call(toolsMod.ledgerTool, { action: "close", id: legClose.r2, status: "已核销", evidence: "勾销证据 任意串" }, legClose.P)
  assert.deepEqual(JSON.parse(out), { id: legClose.r2, status: "已核销" })
  assert.equal(rowOf(legClose.P, legClose.r2).evidence, "勾销证据 任意串")
})

test("U-LT4 · 向后兼容：close 不带 evidence = 既有行为（判行值）", async () => {
  const out = await call(toolsMod.ledgerTool, { action: "close", id: legClose.r4, status: "已核销" }, legClose.P)
  assert.deepEqual(JSON.parse(out), { id: legClose.r4, status: "已核销" })
  assert.equal(rowOf(legClose.P, legClose.r4).evidence, "既有行值", "行值已备 ⇒ 放行且行值不变")
  await assert.rejects(call(toolsMod.ledgerTool, { action: "close", id: legClose.r5, status: "已核销" }, legClose.P),
    { message: "ledgerClose：追认核销须带 evidence（现态 待讨论）" })
})

// ── ② trigger 过滤（U-LT5–6） ───────────────────────────────────────────────
const legTrigger = (() => {
  const P = mkProject(tmpBase("trigger"), "proj-trigger")
  const ids = {}
  for (const [key, trigger] of [["a", "归批"], ["b", "条件"], ["c", "认账不排期"], ["d", null]]) {
    ids[key] = cmdMod.ledgerAdd({ cwd: P, row: { kind: "tech_todo", title: `t-${key}`, ...(trigger ? { trigger } : {}) } })
  }
  return { P, ids }
})()

test("U-LT5 · query{ trigger } 三枚举逐一（核心 ∥ 工具路）；缺省不过滤", async () => {
  for (const [trigger, id] of [["归批", legTrigger.ids.a], ["条件", legTrigger.ids.b], ["认账不排期", legTrigger.ids.c]]) {
    assert.deepEqual(cmdMod.ledgerQuery({ cwd: legTrigger.P, trigger }).map((r) => r.id), [id], `核心路 trigger=${trigger}`)
    const out = await call(toolsMod.ledgerTool, { action: "query", trigger }, legTrigger.P)
    assert.deepEqual(JSON.parse(out).map((r) => r.id), [id], `工具路 trigger=${trigger}`)
  }
  assert.deepEqual(cmdMod.ledgerQuery({ cwd: legTrigger.P }).map((r) => r.id), Object.values(legTrigger.ids), "缺省不过滤（四行全出）")
})

test("U-LT6 · query{ trigger: 'bogus' } ⇒ P5 拒（读面过滤非法值）", async () => {
  await assert.rejects(call(toolsMod.ledgerTool, { action: "query", trigger: "bogus" }, legTrigger.P),
    { message: 'ledger(query)：trigger 非法："bogus"（取值 ∈ {归批, 条件, 认账不排期}）' })
})

// ── ③ 点火入边扩面（U-LT7–8） ───────────────────────────────────────────────
const legExec = (() => {
  const P = mkProject(tmpBase("exec"), "proj-exec")
  return { P, add: (title) => cmdMod.ledgerAdd({ cwd: P, row: { kind: "tech_todo", title } }) }
})()

test("U-LT7 · 点火写：update{ status:待设计 } 落本会话；待设计 → 在途 保持 / 更新", async () => {
  const id = legExec.add("点火边")
  await call(toolsMod.ledgerTool, { action: "update", id, status: "待设计" }, legExec.P)
  assert.equal(rowOf(legExec.P, id).executor, sessionSlots.getSessionId(), "点火边（待讨论 → 待设计）= 工具层 getSessionId 供值")
  cmdMod.ledgerUpdate({ cwd: legExec.P, id, patch: { status: "在途", task_book: "docs/batches/task.md§1" }, executorSessionId: "s-impl" })
  assert.equal(rowOf(legExec.P, id).executor, "s-impl", "待设计 → 在途：更新为本会话")
  const id2 = legExec.add("保持行")
  cmdMod.ledgerUpdate({ cwd: legExec.P, id: id2, patch: { status: "待设计" }, executorSessionId: "s-keep" })
  cmdMod.ledgerUpdate({ cwd: legExec.P, id: id2, patch: { status: "在途", task_book: "docs/batches/task.md§1" }, executorSessionId: null })
  assert.equal(rowOf(legExec.P, id2).executor, "s-keep", "executorSessionId 缺省 ⇒ 行现值兜底（保持）")
})

test("U-LT8 · 优先级与零变面：patch 显式 > sessionId；出边清空；撤回清空；核销两源零触碰", async () => {
  const a = legExec.add("patch 显式")
  cmdMod.ledgerUpdate({ cwd: legExec.P, id: a, patch: { status: "待设计", executor: "X" }, executorSessionId: "S" })
  assert.equal(rowOf(legExec.P, a).executor, "X", "patch 显式 > sessionId")
  cmdMod.ledgerUpdate({ cwd: legExec.P, id: a, patch: { status: "在途", task_book: "docs/batches/task.md§1" }, executorSessionId: "Y" })
  cmdMod.ledgerUpdate({ cwd: legExec.P, id: a, patch: { status: "待核销" }, executorSessionId: "Z" })
  assert.equal(rowOf(legExec.P, a).executor, null, "出边（在途 → 待核销）无条件 NULL")
  cmdMod.ledgerUpdate({ cwd: legExec.P, id: a, patch: { executor: "K" } })
  cmdMod.ledgerClose({ cwd: legExec.P, id: a, status: "已废弃" })
  assert.equal(rowOf(legExec.P, a).executor, null, "撤回（任意态 → 已废弃）清空")
  const b = legExec.add("追认保留")
  cmdMod.ledgerUpdate({ cwd: legExec.P, id: b, patch: { status: "待设计" }, executorSessionId: "s-ignite" })
  cmdMod.ledgerClose({ cwd: legExec.P, id: b, status: "已核销", evidence: "e" })
  assert.equal(rowOf(legExec.P, b).executor, "s-ignite", "核销自待设计保留点火 executor（如实痕迹）")
  const c = legExec.add("勾销零触")
  cmdMod.ledgerUpdate({ cwd: legExec.P, id: c, patch: { status: "待设计" }, executorSessionId: "s3" })
  cmdMod.ledgerUpdate({ cwd: legExec.P, id: c, patch: { status: "在途", task_book: "docs/batches/task.md§1" }, executorSessionId: "s4" })
  cmdMod.ledgerUpdate({ cwd: legExec.P, id: c, patch: { status: "待核销" }, executorSessionId: "s5" })
  cmdMod.ledgerUpdate({ cwd: legExec.P, id: c, patch: { executor: "K2" } })
  cmdMod.ledgerClose({ cwd: legExec.P, id: c, status: "已核销" })
  assert.equal(rowOf(legExec.P, c).executor, "K2", "勾销零触碰（非在途出边）")
})

// ── ④ aged 逐行（U-LT9–10） ─────────────────────────────────────────────────
const legAged = (() => {
  const P = mkProject(tmpBase("aged"), "proj-aged")
  const ids = []
  for (let i = 1; i <= 8; i++) ids.push(cmdMod.ledgerAdd({ cwd: P, row: { kind: "requirement", title: `r${i}` } }))
  cmdMod.ledgerClose({ cwd: P, id: ids[2], status: "已核销", evidence: "e" })
  const NOW = Date.parse("2026-10-07T00:00:00.000Z")
  const db = dbMod.openLedger(P)
  const iso = (ms) => new Date(ms).toISOString()
  const upd = (id, created, updated) => db.prepare("UPDATE items SET created_at = ?, updated_at = ? WHERE id = ?").run(created ?? null, updated ?? null, id)
  upd(ids[0], null, iso(NOW - 40 * DAY))          // r1 未决 40 天 ⇒ true
  upd(ids[1], null, iso(NOW - 10 * DAY))          // r2 未决 10 天 ⇒ false
  upd(ids[2], null, iso(NOW - 40 * DAY))          // r3 已核销（归档不判）⇒ false
  upd(ids[3], iso(NOW - 40 * DAY), null)          // r4 updated 缺 ⇒ 取 created ⇒ true
  upd(ids[4], null, null)                         // r5 时间戳双缺 ⇒ false
  upd(ids[5], null, "not-a-date")                 // r6 坏时间戳 ⇒ false
  upd(ids[6], null, iso(NOW - 30 * DAY))          // r7 恰 30 天 ⇒ false（> 严于）
  upd(ids[7], null, iso(NOW - 30 * DAY - 60000))  // r8 30 天零一分 ⇒ true
  db.close()
  return { P, ids, NOW }
})()

test("U-LT9 · aged 逐行：判真 / 判假全拍（now 注入）", () => {
  const rows = cmdMod.ledgerQuery({ cwd: legAged.P, now: legAged.NOW })
  const aged = new Map(rows.map((r) => [r.id, r.aged]))
  for (const [i, want] of [[0, true], [1, false], [2, false], [3, true], [4, false], [5, false], [6, false], [7, true]]) {
    assert.equal(aged.get(legAged.ids[i]), want, `r${i + 1} aged=${want}`)
  }
  assert.ok(rows.every((r) => typeof r.aged === "boolean"), "逐行恒携 aged:boolean")
})

test("U-LT10 · 导出零涉：ledgerExport 行集无 aged 键（DATA_COLUMNS 白名单）", () => {
  const rows = readMod.ledgerExport({ cwd: legAged.P }).projects[0].rows
  assert.ok(rows.length >= 8, "导出行集非空")
  assert.equal(rows.some((r) => "aged" in r), false, "aged 不入导出白名单")
  assert.ok(rows.every((r) => typeof r.id === "number" && "status" in r), "行形零变（id + 白名单列）")
})

// ── ⑤ design-slots / 批量 consume（U-SL1–9） ────────────────────────────────
const mkTok = (expiresAt) => `${randomUUID()}:${expiresAt}`
const slotFile = (agent) => JSON.parse(readFileSync(sessionSlots.slotPath(agent.cwd, 1), "utf8"))
/** 槽面夹具：槽文件（权威表）+ 内存 Map 同源写入；`_slot` 直钉槽 1（零认领副作用）。 */
function mkSlotCase(name, tokens, { runs = null, engineering = true } = {}) {
  const cwd = join(tmpBase(name), name)
  mkdirSync(cwd, { recursive: true })
  writeFileSync(sessionSlots.slotPath(cwd, 1), JSON.stringify({ version: 2, cwd, engDesignTokens: tokens }), "utf8")
  const agent = { cwd, _slot: 1, _engDesignTokens: new Map(Object.entries(tokens)), config: { agent: { engineering, engTokenTtlMs: 7 * DAY } } }
  if (runs) agent._advisorRuns = runs
  return { agent, tokens }
}
const slotCall = (args, agent) => subagentMod.subagentTool.execute({ action: "consume-design", ...args }, { agent })

test("U-SL1 · 清点全列：live/expired 双态 + 龄序（最老在前）+ 只读零写", async () => {
  const t = Date.now()
  const { agent } = mkSlotCase("sl1", { sa: mkTok(t + 6 * DAY), sb: mkTok(t + 3600000), sc: mkTok(t - 2 * DAY) })
  const memBefore = [...agent._engDesignTokens.entries()]
  const filePath = sessionSlots.slotPath(agent.cwd, 1)
  const fileBefore = readFileSync(filePath, "utf8")
  const out = await subagentMod.subagentTool.execute({ action: "design-slots" }, { agent })
  const lines = out.split("\n")
  const rows = lines.filter((l) => l.startsWith("- designId="))
  assert.deepEqual(rows.map((l) => /designId=(\S+)/.exec(l)[1]), ["sc", "sb", "sa"], "龄序 = 最老在前（sc 9.0d → sb 7.0d → sa 1.0d）")
  assert.match(rows[0], /status=expired ageDays=9\.0 .*batch=—/, "expired 行全列（含降级标记 batch=—）")
  assert.match(rows[1], /status=live ageDays=7\.0 /, "live 行（sb）")
  assert.match(rows[2], /status=live ageDays=1\.0 /, "live 行（sa）")
  assert.ok(rows.every((l) => /expiresAt=\d{4}-\d{2}-\d{2}T/.test(l)), "expiresAt 精确（ISO）")
  assert.equal(lines.at(-1), "design-slots: 3 slot(s) — 2 live / 1 expired", "计数尾行（总数 ∥ live ∥ expired）")
  assert.deepEqual([...agent._engDesignTokens.entries()], memBefore, "只读零写：内存槽零变")
  assert.equal(readFileSync(filePath, "utf8"), fileBefore, "只读零写：槽文件字节零变")
  assert.equal(gatesMod.isSubagentReadonlyAction("subagent", { action: "design-slots" }), true, "dispatch 分类 = 只读（planMode 放行 / 免审批）")
})

test("U-SL2 · 批列派生：run 命中 ⇒ batches/ 段档 basename；不可得 ⇒ —（零新存储）", async () => {
  const t = Date.now()
  const runs = new Map([["rev-1", {
    reviewId: "rev-1", reviewType: "design", designId: "dRun",
    docSetKey: JSON.stringify([join("C:", "proj", "docs", "batches", "2026-10-07-ledger-tool.md"), join("C:", "proj", "docs", "core", "design", "LEDGER.md")]),
  }]])
  const { agent } = mkSlotCase("sl2", { dRun: mkTok(t + DAY), dOrphan: mkTok(t + 2 * DAY) }, { runs })
  const rows = (await subagentMod.subagentTool.execute({ action: "design-slots" }, { agent })).split("\n")
  assert.match(rows.find((l) => l.includes("designId=dRun")), /batch=2026-10-07-ledger-tool\.md/, "run 命中 ⇒ basename")
  assert.match(rows.find((l) => l.includes("designId=dOrphan")), /batch=—/, "不可得 ⇒ —（如实降级）")
})

test("U-SL3 · designIds 批量（含未知 id no-op 幂等）；单枚兼容回执逐字", async () => {
  const t = Date.now()
  const { agent } = mkSlotCase("sl3", { dA: mkTok(t + DAY), dB: mkTok(t + 2 * DAY) })
  const out = await slotCall({ designIds: ["dA", "dA", "dB", "dUnknown"] }, agent)
  assert.ok(out.includes("- designId dA — consumed") && out.includes("- designId dB — consumed"), "逐枚行")
  assert.equal(out.split("\n").filter((l) => l.startsWith("- designId dA ")).length, 1, "重复条目去重（一行一 id——计数不虚增）")
  assert.ok(out.includes("- designId dUnknown — no live slot (already consumed or never issued)"), "未知 id = 逐枚 no-op 提示")
  assert.ok(out.includes("consumed 2 design slot(s)"), "计数行 consumed 2")
  assert.deepEqual([...agent._engDesignTokens.keys()], [], "内存槽零残留")
  assert.equal(slotFile(agent).engDesignTokens, undefined, "槽文件清（persist 落盘）")
  const again = await slotCall({ designIds: ["dA", "dB"] }, agent)
  assert.ok(again.includes("consumed 0 design slot(s)") && again.includes("no live slot"), "复跑幂等（no-op）")
  const single = mkSlotCase("sl3b", { dOnly: mkTok(t + DAY) })
  const sOut = await slotCall({ designId: "dOnly" }, single.agent)
  assert.match(sOut, /^design slot consumed — designId dOnly is closed out; a further eng-coder spawn/, "单枚回执现行逐字")
})

test("U-SL4 · expired / olderThanDays 选择器（live 老槽可中；短龄不中）", async () => {
  const t = Date.now()
  const a1 = mkSlotCase("sl4a", { dX: mkTok(t + 6 * DAY), dY: mkTok(t + 3600000), dZ: mkTok(t - 2 * DAY) })
  const out1 = await slotCall({ expired: true }, a1.agent)
  assert.ok(out1.includes("- designId dZ — consumed") && out1.includes("consumed 1 design slot(s)"), "expired ⇒ 恰过期一枚")
  assert.deepEqual([...a1.agent._engDesignTokens.keys()].sort(), ["dX", "dY"], "live 双槽不动")
  const a2 = mkSlotCase("sl4b", { dX: mkTok(t + 6 * DAY), dY: mkTok(t + 3600000), dZ: mkTok(t - 2 * DAY) })
  const out2 = await slotCall({ olderThanDays: 3 }, a2.agent)
  const picked = out2.split("\n").filter((l) => l.startsWith("- ")).map((l) => /designId (\S+) —/.exec(l)[1])
  assert.deepEqual(picked, ["dZ", "dY"], "olderThanDays=3：龄大者在前（dZ 9d → dY 7d）")
  assert.ok(out2.includes("consumed 2 design slot(s)"))
  assert.deepEqual([...a2.agent._engDesignTokens.keys()], ["dX"], "短龄 live 槽保留")
})

test("U-SL5 · 拒面：多选择器 / 空清单 / 格式外 ⇒ 拒；多槽缺选择器 ⇒ 现行拒文", async () => {
  const t = Date.now()
  const { agent } = mkSlotCase("sl5", { dA: mkTok(t + DAY), dB: mkTok(t + 2 * DAY) })
  await refusal(slotCall({ designId: "dA", expired: true }, agent), /pass exactly ONE selector.*designId \+ expired/)
  await refusal(slotCall({ designIds: ["dA"], olderThanDays: 2 }, agent), /pass exactly ONE selector/)
  await refusal(slotCall({ designIds: [] }, agent), /designIds must be a non-empty array/)
  await refusal(slotCall({ expired: false }, agent), /expired must be true/)
  await refusal(slotCall({ olderThanDays: "3" }, agent), /olderThanDays must be a non-negative number/)
  await refusal(slotCall({}, agent), /^consume-design: Multiple approved designs in this session \(2\) — pass the designId parameter/)
  assert.equal(agent._engDesignTokens.size, 2, "拒面零写")
})

test("U-SL6 · 落盘失败 ⇒ 整体回滚（批量快照 / 单枚逐字）", async () => {
  const t = Date.now()
  const corrupt = (agent) => {
    const p = sessionSlots.slotPath(agent.cwd, 1)
    writeFileSync(p, "{ corrupted — not json", "utf8")
    agent._slotMtime = { p, mtimeMs: statSync(p).mtimeMs } // 注错链：守卫 mtime 命中 ⇒ persist 复读抛
  }
  const a1 = mkSlotCase("sl6a", { dA: mkTok(t + DAY), dB: mkTok(t + 2 * DAY) })
  corrupt(a1.agent)
  await refusal(slotCall({ designIds: ["dA"] }, a1.agent), /could NOT be durably deleted.*slots are restored in memory/)
  assert.deepEqual([...a1.agent._engDesignTokens.keys()].sort(), ["dA", "dB"], "批量：内存快照整体回滚")
  const a2 = mkSlotCase("sl6b", { dOnly: mkTok(t + DAY) })
  corrupt(a2.agent)
  await refusal(slotCall({ designId: "dOnly" }, a2.agent), /could NOT be durably deleted.*the slot is restored in memory/)
  assert.deepEqual([...a2.agent._engDesignTokens.keys()], ["dOnly"], "单枚：槽回滚")
})

test("U-SL7 · 消费后同 id spawn 机械拒（不复活——槽文件已删）", async () => {
  const t = Date.now()
  const { agent } = mkSlotCase("sl7", { dKill: mkTok(t + DAY), dKeep: mkTok(t + 2 * DAY) })
  assert.ok(spawnMod.resolveDesignSlot(agent, "dKill").token, "消费前：门禁可解析该槽")
  await slotCall({ designIds: ["dKill"] }, agent)
  assert.equal(slotFile(agent).engDesignTokens?.dKill, undefined, "槽文件已删（持久删除）")
  assert.throws(() => spawnMod.resolveDesignSlot(agent, "dKill"), /designId not found/, "消费后 spawn 门禁机械拒（不复活）")
})

test("U-SL8 · 多槽隔离：消费 A 不动 B（内存 + 槽文件同证）", async () => {
  const t = Date.now()
  const { agent, tokens } = mkSlotCase("sl8", { dA: mkTok(t + DAY), dB: mkTok(t + 2 * DAY) })
  await slotCall({ designIds: ["dA"] }, agent)
  assert.deepEqual([...agent._engDesignTokens.keys()], ["dB"], "B 内存在位")
  assert.equal(slotFile(agent).engDesignTokens?.dA, undefined, "A 出槽文件")
  assert.equal(slotFile(agent).engDesignTokens?.dB, tokens.dB, "B 槽文件值逐字保留")
})

test("U-SL9 · 工程模式门外拒（两 action 同门）", async () => {
  const agent = { cwd: tmpBase("sl9"), config: { agent: { engineering: false } } }
  await refusal(subagentMod.subagentTool.execute({ action: "design-slots" }, { agent }), /Engineering mode is not active/)
  await refusal(slotCall({ designId: "x" }, agent), /Engineering mode is not active/)
})
