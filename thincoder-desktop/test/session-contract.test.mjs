/**
 * session-contract.test.mjs — E-3 / E-1 用例（批档 §2.5 U14–U19 + U37 / U38 · `docs/desktop/design/IPC.md` §2 会话面 / 会话族注）：
 * 端壳形态（源零算法副本 + 端名已声明）/ 本端记录往返（`.manifest.desktop`）/ 端间不互写 /
 * 跨端接续 / 沙箱缝随动 / `createdBy` 三态（截图判据③ · T-DSK3）/ 白名单二十八项定序（U37）/ 会话族读面三态（U38）/
 * 会话族五通道往返（U57）。
 * 沙箱：逐用例 `mkdtemp` + 核沙箱缝 `_setSessionsDirForTest`（缝在核，端壳零副本）；用例后复位。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { sessionEnd } from "@thincoder/core/session-slots.mjs"
import {
  endMarkerPath as coreEndMarkerPath, readEndMarker as coreReadEndMarker,
  writeEndMarker as coreWriteEndMarker,
} from "@thincoder/core/session-slots.mjs"
import {
  END, _resetSessionsDirForTest, _setSessionsDirForTest, claimSlot, listSlots, loadManifest,
  newSlotData, readEndMarker, renameSlot, resumeSlot, saveManifest, sessionPath, sessionsDir, slotDigest,
  slotPath, writeEndMarker, writeSessionFile,
} from "../src/main/session-slots.mjs"
import {
  createSession, deleteSession, renameSession, resumeSession, switchSession,
} from "../src/main/session-actions.mjs"
import { ROW_FIELDS, listSessions } from "../src/main/sessions.mjs"

const hashOf = (p) => createHash("sha256").update(readFileSync(p)).digest("hex")

/** 沙箱：sessions 根指向 tmp；返回 { dir, cwd }（cwd = 真目录，供族面用）。 */
function sandbox(t, tag = "proj") {
  const dir = mkdtempSync(join(tmpdir(), "desktop-contract-"))
  const cwd = join(dir, tag)
  mkdirSync(cwd, { recursive: true })
  _setSessionsDirForTest(dir)
  t.after(() => { _resetSessionsDirForTest(); rmSync(dir, { recursive: true, force: true }) })
  return { dir, cwd }
}

// ─── U14 端壳形态（源零算法副本 + 端名声明）─────────────────────

test("U14: 端壳源零算法副本 ∧ END / sessionEnd 声明为 desktop", () => {
  const src = readFileSync(new URL("../src/main/session-slots.mjs", import.meta.url), "utf8")
  assert.ok(!/(?:from|import)\s*\(?\s*["']node:fs/.test(src), "端壳零 node:fs* 导入（含 node:fs/promises；读写全走核）")
  assert.ok(!src.includes("JSON.parse"), "端壳零就地解析（全走核）")
  assert.equal(END, "desktop", "端常量")
  assert.equal(sessionEnd(), "desktop", "端名 = 模块求值期已声明（载入序不变量 · 批档 §2.4（a））")
})

// ─── U15 本端记录往返 ─────────────────────────────────────────

test("U15: writeEndMarker → readEndMarker 往返（路径 {manifest}.desktop）", (t) => {
  const { cwd } = sandbox(t)
  const marker = coreEndMarkerPath(cwd, "desktop")
  assert.ok(marker.endsWith(".manifest.desktop"), `本端记录路径后缀（实 ${marker}）`)
  assert.equal(marker, coreEndMarkerPath(cwd, "desktop"), "端壳路径与核显式端参同址（绑定转口单源）")

  writeEndMarker(cwd, 2)
  const rec = readEndMarker(cwd)
  assert.equal(rec?.slot, 2, "槽号读回")
  assert.equal(typeof rec?.updatedAt, "number", "updatedAt 落档")
  assert.equal(readEndMarker(cwd).slot, 2, "幂等读数")
})

// ─── U16 端间不互写（本端记录 = 本端单写者文件）─────────────────

test("U16: 端间不互写（写本端不改另端文件、另端读数不变）", (t) => {
  const { cwd } = sandbox(t)
  coreWriteEndMarker(cwd, 3, "vscode") // 另端记录（显式端参）
  writeEndMarker(cwd, 1) // 本端记录

  assert.equal(coreReadEndMarker(cwd, "vscode")?.slot, 3, "另端记录自身读数")
  assert.equal(readEndMarker(cwd)?.slot, 1, "本端记录自身读数")
  assert.notEqual(coreEndMarkerPath(cwd, "vscode"), coreEndMarkerPath(cwd, "desktop"), "两文件不同址")

  const other = coreEndMarkerPath(cwd, "vscode")
  const before = hashOf(other)
  writeEndMarker(cwd, 4)
  assert.equal(hashOf(other), before, "写本端记录 ⇒ 另端文件哈希不变")
  assert.equal(coreReadEndMarker(cwd, "vscode")?.slot, 3, "另端读数不变")
  assert.equal(readEndMarker(cwd)?.slot, 4, "本端新值生效")
})

// ─── U17 跨端接续（T-DSK12）────────────────────────────────────

test("U17: 另端落槽 ⇒ 本端 resumeSlot 接续同槽且零改写", async (t) => {
  const { cwd } = sandbox(t)
  const fixture = { ...newSlotData(cwd), history: [{ role: "user", content: "跨端接续夹具" }] }
  writeSessionFile(slotPath(cwd, 1), fixture) // 另端槽数据
  const m = loadManifest(cwd)
  m.slots["1"] = slotDigest(fixture) // 另端 manifest 条目
  saveManifest(cwd, m)
  claimSlot(cwd, 1, loadManifest(cwd)) // 另端认领（active = 1）
  coreWriteEndMarker(cwd, 1, "vscode") // 另端记录

  const slotFile = slotPath(cwd, 1)
  const marker = coreEndMarkerPath(cwd, "vscode")
  const before = { slot: hashOf(slotFile), marker: hashOf(marker) }

  const { slot, data } = await resumeSlot(cwd) // 本端（桌面端）恢复
  assert.equal(slot, 1, "接续另端槽 1（判据单源 = 核 resumeSlot）")
  assert.deepEqual(data, fixture, "数据等值（本端零改写）")
  assert.equal(hashOf(slotFile), before.slot, "另端槽数据文件哈希不变")
  assert.equal(hashOf(marker), before.marker, "另端记录哈希不变")
  assert.equal(readEndMarker(cwd)?.slot, 1, "本端记录已落（写的是本端文件）")
})

// ─── U18 沙箱缝覆盖 ───────────────────────────────────────────

test("U18: 沙箱缝覆盖（sessionPath / sessionsDir 同根随动 · 可复位）", (t) => {
  const { dir, cwd } = sandbox(t)
  const path = sessionPath(cwd)
  assert.ok(path.startsWith(dir), `sessionPath 落沙箱根下（实 ${path}）`)
  assert.equal(sessionsDir(), dir, "sessionsDir = 沙箱根（核 sessionPath 反推 · 零副本）")
  _resetSessionsDirForTest()
  assert.notEqual(sessionsDir(), dir, "复位后随核缺省根（缝可逆）")
})

// ─── U19 createdBy 三态（判据③ · T-DSK3）───────────────────────

test("U19: createdBy 三态（新建 desktop / 老槽 \"\" / 认领后仍 \"\"）", (t) => {
  const { cwd } = sandbox(t)
  const fresh = newSlotData(cwd) // ① 本端物化（端名已声明 ⇒ 不误标 cli）
  assert.equal(fresh.createdBy, "desktop", "本端新建槽 createdBy = desktop")
  const legacy = { ...newSlotData(cwd), history: [{ role: "user", content: "老会话" }] }
  delete legacy.createdBy // ② 老槽：无 createdBy 键
  writeSessionFile(slotPath(cwd, 1), fresh)
  writeSessionFile(slotPath(cwd, 2), legacy)

  const m = loadManifest(cwd)
  m.slots["1"] = slotDigest(fresh)
  m.slots["2"] = slotDigest(legacy)
  saveManifest(cwd, m)
  const rowOf = (n) => listSlots(cwd).find((r) => r.slot === n)
  assert.equal(rowOf(1).createdBy, "desktop", "新建行创建端有值")
  assert.equal(rowOf(2).createdBy, "", "老槽行 = 空串（缺键 ⇒ 未知，禁回填）")

  claimSlot(cwd, 2, loadManifest(cwd)) // ③ 本端认领老槽
  assert.equal(rowOf(2).createdBy, "", "认领后仍为空串（禁以占用端冒充创建端）")
  assert.equal(rowOf(2).isActive, true, "认领翻 active（判据面确已生效——非空断言）")
})

// ─── U37 白名单定序（E-1 · 批档 §2.4（b））──────────────────────

test("U37: preload 白名单二十八项定序 ∧ 冻结", () => {
  const preload = createRequire(import.meta.url)(fileURLToPath(new URL("../src/preload/preload.cjs", import.meta.url)))
  assert.deepEqual(
    [...preload.CHANNELS],
    [
      "config:read", "project:open", "project:recent", "sessions:list",
      "session:create", "session:switch", "session:rename", "session:delete", "session:resume",
      "approval:respond", "history:page", "msg:send", "msg:interrupt",
      "provider:list", "provider:save", "provider:remove", "provider:verify",
      "model:list", "settings:agent", "mcp:list", "mcp:save", "mcp:remove",
      "config:write", "ledger:read", "batch:status", "question:respond", "session:prefs", "subagent:stop",
    ],
    "二十八项 + 定序（既有十三项段不动；末十五项 = 设置族十 + 项目级信息二 + 作答响应一 + 会话级偏好一 + 子 agent 停止出口一）",
  )
  assert.ok(Object.isFrozen(preload.CHANNELS), "冻结（运行期不可改）")
})

// ─── U38 sessions:list 三态（主进程读面 · 批档 §2.13 第 9 条）──────

test("U38: sessions:list 三态（main/sessions.mjs + 白名单）", (t) => {
  const { dir, cwd } = sandbox(t)
  assert.deepEqual(listSessions(null), { cwd: null, rows: [] }, "未打开项目 ⇒ { cwd:null, rows:[] }（非错误）")
  assert.deepEqual(listSessions(""), { cwd: null, rows: [] }, "空串同判（cwd 空）")

  const fixtures = [
    [1, { ...newSlotData(cwd), createdBy: "cli", title: "CLI 夹具", activeProvider: "p1", activeModel: "m1" }],
    [2, { ...newSlotData(cwd), createdBy: "vscode" }],
    [3, { ...newSlotData(cwd), createdBy: "desktop", activeProvider: "p2" }],
    [4, { ...newSlotData(cwd) }],
  ]
  delete fixtures[3][1].createdBy // 老槽：无 createdBy 键（未知——禁回填）
  const manifest = loadManifest(cwd)
  for (const [n, data] of fixtures) {
    writeSessionFile(slotPath(cwd, n), data)
    manifest.slots[String(n)] = slotDigest(data)
  }
  saveManifest(cwd, manifest)

  const res = listSessions(cwd)
  assert.equal(res.cwd, cwd, "cwd = 输入（主进程当前项目内存态）")
  assert.equal(res.rows.length, 4, "行数 = 槽数")
  const bySlot = new Map(res.rows.map((row) => [row.slot, row]))
  for (const row of res.rows) {
    assert.deepEqual(Object.keys(row).sort(), [...ROW_FIELDS].sort(), "字段闭集 = 2.4（e）+ R3c `provider`（date / updatedDate / firstMessage 不载）")
    assert.equal(typeof row.updatedAt, "number", "updatedAt = 机器读数（非本地化显示串）")
    assert.equal(typeof row.messageCount, "number", "messageCount 读数")
    assert.equal(row.isActive, false, "本批不认领活动槽 ⇒ 零 isActive")
    assert.equal(typeof row.provider, "string", "provider 读数 = 串（老槽 / 无活动模型 ⇒ 空串）")
  }
  assert.equal(bySlot.get(1)?.title, "CLI 夹具", "标题直通（零改写）")
  assert.equal(bySlot.get(2)?.title, "", "无标题 ⇒ 空串原样出（缺省词归渲染面）")
  assert.deepEqual(
    [1, 2, 3, 4].map((n) => bySlot.get(n)?.createdBy),
    ["cli", "vscode", "desktop", ""],
    "createdBy 三值 ∧ 缺键 ⇒ \"\"（禁回填）",
  )
  // R3c · D18（T-DSK34 行投影两向）：`provider` = 核 `activeProvider` 投影 —— 复合串逐字 / 裸渠道名 / 老槽空串
  assert.deepEqual(
    [1, 2, 3, 4].map((n) => bySlot.get(n)?.provider),
    ["p1:m1", "", "p2", ""],
    "provider = 槽投影 `activeProvider` 逐字（含活动模型 ⇒ 复合串 p:m · 无 ⇒ 裸渠道名 · 老槽 / 无键 ⇒ \"\"）",
  )

  const fresh = join(dir, "fresh")
  mkdirSync(fresh, { recursive: true })
  assert.deepEqual(listSessions(fresh), { cwd: fresh, rows: [] }, "有项目无槽 ⇒ cwd 保留 + rows 空（渲染面读作 empty）")

  const preload = createRequire(import.meta.url)(fileURLToPath(new URL("../src/preload/preload.cjs", import.meta.url)))
  assert.ok([...preload.CHANNELS].includes("sessions:list"), "白名单含本通道（注册面逐项 fail-closed）")
})

// ─── U57 五通道往返（动作层 · 批档 §2.4（b）/ 验收①）──────────────

test("U57: 五通道往返（信封形 ∧ 成功槽面可回读 ∧ 负例档 ∧ 另端 marker 零触碰）", async (t) => {
  const { cwd } = sandbox(t)
  const SHAPE = ["cwd", "ok", "reason", "slot"]
  const reasons = []
  const envelope = (res, tag) => {
    assert.deepEqual(Object.keys(res).sort(), SHAPE, `${tag}：信封键闭集（ok / reason / cwd / slot）`)
    reasons.push(res.reason)
    return res
  }

  // 另端记录预置（另端 marker 零触碰 = 本档贯穿断言 —— NF1）
  coreWriteEndMarker(cwd, 7, "cli")
  coreWriteEndMarker(cwd, 8, "vscode")
  const otherEnds = ["cli", "vscode"].map((end) => ({ end, path: coreEndMarkerPath(cwd, end) }))
  const othersBefore = otherEnds.map(({ path }) => hashOf(path))

  // ① session:create —— 恒 ok（新槽号）
  const created = envelope(await createSession(cwd), "create")
  assert.deepEqual(created, { ok: true, reason: null, cwd, slot: 1 }, "create ⇒ ok + 新槽号 1 + cwd 回代入参")
  assert.equal(readEndMarker(cwd)?.slot, 1, "create ⇒ 本端记录落新槽号（槽面可回读）")
  assert.equal(listSlots(cwd).some((r) => r.slot === 1), true, "新槽在清单内（读面单源）")

  // ② session:switch —— 在册槽 ok ∧ 非整数 / 不在册两负例同档
  assert.deepEqual(envelope(switchSession(cwd, 1), "switch"), { ok: true, reason: null, cwd, slot: 1 }, "switch 在册槽 ⇒ ok（信封槽号取数归一）")
  assert.deepEqual(envelope(switchSession(cwd, 9), "switch-缺槽"), { ok: false, reason: "slot-missing", cwd, slot: null }, "不在册槽 ⇒ slot-missing")
  assert.equal(envelope(switchSession(cwd, "abc"), "switch-非整数").reason, "slot-missing", "非整数槽 ⇒ slot-missing（零端层预校验 —— 判据单源 = 核）")

  // ③ session:rename —— 成功往返 ∧ 四闭集 reason
  assert.deepEqual(envelope(renameSession(cwd, 1, "往返标题"), "rename"), { ok: true, reason: null, cwd, slot: 1 }, "rename 成功 ⇒ ok + 槽号")
  assert.equal(listSlots(cwd).find((r) => r.slot === 1)?.title, "往返标题", "标题可回读（槽面往返成立）")
  assert.equal(envelope(renameSession(null, 1, "x"), "rename-cwd空").reason, "no-project", "cwd 空 ⇒ no-project")
  assert.equal(envelope(renameSession(cwd, "x", "t"), "rename-非整数").reason, "invalid-slot", "非整数槽 ⇒ invalid-slot（核闭集直传）")
  assert.equal(envelope(renameSession(cwd, 5, "t"), "rename-无文件").reason, "file-missing", "槽文件缺失 ⇒ file-missing")
  writeFileSync(slotPath(cwd, 3), "{ 坏档", "utf8")
  assert.equal(envelope(renameSession(cwd, 3, "t"), "rename-坏档").reason, "parse-failure", "解析失败 ⇒ parse-failure")
  let tick = 0
  const conflict = renameSlot(cwd, 1, "冲突标题", () => ({ mtimeMs: (tick += 1) }))
  assert.deepEqual(conflict, { ok: false, reason: "mtime-conflict" }, "mtime 变 ⇒ mtime-conflict（第 4 参缝只经端壳 re-export 可达）")
  reasons.push(conflict.reason)
  assert.equal(renameSlot.length, 3, "动作层只传 3 参（第 4 参 = 缺省缝）")
  assert.equal(listSlots(cwd).find((r) => r.slot === 1)?.title, "往返标题", "冲突放弃 ⇒ 标题保持原值（并发内容不丢）")

  // ④ session:delete —— 成立 / 不成立
  assert.deepEqual(envelope(deleteSession(cwd, 1), "delete"), { ok: true, reason: null, cwd, slot: 1 }, "delete 在册槽 ⇒ ok")
  assert.equal(listSlots(cwd).some((r) => r.slot === 1), false, "删除 ⇒ 清单条目消失（槽面可回读）")
  assert.equal(envelope(deleteSession(cwd, 9), "delete-缺槽").reason, "slot-missing", "不在册槽 ⇒ slot-missing")

  // ⑤ session:resume —— 恒 ok（空清单 ⇒ 兜底 allocateFresh）；cwd 空 ⇒ no-project
  const resumed = envelope(await resumeSession(cwd), "resume")
  assert.equal(resumed.ok, true, "resume 恒 ok（核判据 ①②③ 恒落一槽）")
  assert.equal(Number.isInteger(resumed.slot) && resumed.slot >= 1, true, `resume ⇒ 整数槽号（实 ${resumed.slot}）`)
  assert.equal(readEndMarker(cwd)?.slot, resumed.slot, "resume ⇒ 本端记录落该槽（槽面可回读）")
  assert.equal(loadManifest(cwd).active, resumed.slot, "resume ⇒ 核清单认领点 = 该槽（认领可回读）")
  // 注：兜底 allocateFresh 只落认领点 / 本端记录（槽数据物化随核起会话）—— 读面行归 `sessions:list`，
  // 不在无数据槽上断言行存在（非本批判据面）。
  assert.equal(envelope(await resumeSession(null), "resume-cwd空").reason, "no-project", "cwd 空 ⇒ no-project（零写）")

  // 负例 reason 面 = 六值闭集（零端层第二词表）
  assert.deepEqual(
    [...new Set(reasons)].filter((reason) => reason !== null).sort(),
    ["file-missing", "invalid-slot", "mtime-conflict", "no-project", "parse-failure", "slot-missing"],
    "reason 面全在闭集内 ∧ 六档皆已触达",
  )

  // 另端 marker 零触碰（五通道全跑完后）
  otherEnds.forEach(({ end, path }, index) => {
    assert.equal(hashOf(path), othersBefore[index], `${end} marker 哈希不变（另端文件零触碰）`)
    assert.equal(coreReadEndMarker(cwd, end)?.slot, index === 0 ? 7 : 8, `${end} marker 读数不变`)
  })
  assert.notEqual(coreEndMarkerPath(cwd, "desktop"), coreEndMarkerPath(cwd, "cli"), "本端记录与另端不同址")
})
