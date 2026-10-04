/**
 * 2026-10-04-acp-face-completion.test.mjs — ACP 协议面补全批（#862 结构化子代理事件）
 * 批内单测件（名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-04-acp-face-completion.test.mjs`
 *
 * 射程 = 设计档 `docs/cli/design/ACP-CLIENT.md` §12（通道 ∥ 通告形状 ∥ 状态族 ∥ 文法单源）
 * ‖ 批档 §2 用例表 T-862-1…12（先红后绿）：
 *   T-862-1..2   queued（slot 位次 ⇒ progress.position ‖ wait 原因文 ⇒ detail）
 *   T-862-3..4   turn / approval（轮号对；approval 附工具名）
 *   T-862-5..6   零字段态（async/cancelled；stopped/settled/done——键缺席语义）
 *   T-862-7      嵌套前缀（role/id = 最内段）
 *   T-862-8..10  负向三条（无终止符 ‖ 中段字面 ‖ 无前缀形态）
 *   T-862-11..12 既有面零回归（`[model]` 零发射；内容 chunk 前缀剥照常转发）。
 * 沙箱纪律：HOME ‖ USERPROFILE → 临时目录（一切（动态）import 之前——先例 = 本批前身
 *   `2026-10-04-issue-fix-round2.test.mjs`）。零网络 ‖ 零真实 LLM——直驱
 *   `buildAcpCallbacks` stub（notify 记单 ‖ request 零用）。
 */
import test, { after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const ROOT_URL = new URL("../../", import.meta.url) // 仓根 = 本档上两级（thincoder/）
const SANDBOX_HOME = mkdtempSync(join(tmpdir(), "acp-face-home-"))
process.env.HOME = SANDBOX_HOME
process.env.USERPROFILE = SANDBOX_HOME
after(() => rmSync(SANDBOX_HOME, { recursive: true, force: true }))

const mod = (rel) => import(new URL(rel, ROOT_URL).href)

const RS = "\x1e"
const META_KEY = "thincoder.dev/subagent"

/** 直驱夹具：`buildAcpCallbacks` stub——notify 记单（session/update 全量，序即发射序）。 */
async function harness() {
  const { buildAcpCallbacks } = await mod("thincoder-cli/src/acp/bridge.mjs")
  const notes = []
  const cb = buildAcpCallbacks({
    sessionId: "s1",
    notify: (m, p) => notes.push({ m, p }),
    request: async () => ({}),
  })
  return { cb, notes }
}

const infos = (notes) => notes.filter((n) => n.p.update.sessionUpdate === "session_info_update")
const chunks = (notes) => notes.filter((n) => n.p.update.sessionUpdate === "agent_message_chunk")
const metaOf = (n) => n.p.update._meta[META_KEY]

// ─── T-862-1..2 · queued（slot 位次 ‖ wait 原因文） ───────────────────────────

test("T-862-1 queued·正常：slot 位次 ⇒ 恰一条 session_info_update + progress.position；零 chunk", async () => {
  const { cb, notes } = await harness()
  cb.onToken(`eng-coder#2/⟦ev⟧queued${RS}slot${RS}2${RS}queued${RS}`)
  console.log(`[读数] T-862-1: ${JSON.stringify(notes)}`)
  assert.equal(notes.length, 1, "恰一条通知（零 chunk）")
  assert.equal(notes[0].m, "session/update")
  assert.deepEqual(notes[0].p, {
    sessionId: "s1",
    update: {
      sessionUpdate: "session_info_update",
      _meta: { [META_KEY]: { role: "eng-coder", id: 2, state: "queued", progress: { position: 2 } } },
    },
  })
})

test("T-862-2 queued·正常：wait 原因文 ⇒ detail = 原因文（逐字；kind 不承载）", async () => {
  const { cb, notes } = await harness()
  cb.onToken(`eng-coder#2/⟦ev⟧queued${RS}wait${RS}3${RS}queued${RS}waiting for: plan#7`)
  console.log(`[读数] T-862-2: ${JSON.stringify(notes)}`)
  assert.equal(notes.length, 1, "恰一条通知")
  assert.deepEqual(metaOf(infos(notes)[0]), {
    role: "eng-coder", id: 2, state: "queued",
    progress: { position: 3 }, detail: "waiting for: plan#7",
  })
  assert.equal(chunks(notes).length, 0)
})

// ─── T-862-3..4 · turn / approval（轮号对） ──────────────────────────────────

test("T-862-3 turn·正常：轮号对 ⇒ progress.{turn,maxTurns}", async () => {
  const { cb, notes } = await harness()
  cb.onToken(`eng-coder#2/⟦ev⟧turn${RS}3${RS}100${RS}llm${RS}`)
  console.log(`[读数] T-862-3: ${JSON.stringify(notes)}`)
  assert.equal(notes.length, 1, "恰一条通知")
  assert.deepEqual(metaOf(infos(notes)[0]), {
    role: "eng-coder", id: 2, state: "turn", progress: { turn: 3, maxTurns: 100 },
  })
  assert.equal(chunks(notes).length, 0)
})

test("T-862-4 approval·正常：轮号对 + detail = 工具名", async () => {
  const { cb, notes } = await harness()
  cb.onToken(`eng-coder#2/⟦ev⟧approval${RS}3${RS}100${RS}approval${RS}bash`)
  console.log(`[读数] T-862-4: ${JSON.stringify(notes)}`)
  assert.equal(notes.length, 1, "恰一条通知")
  assert.deepEqual(metaOf(infos(notes)[0]), {
    role: "eng-coder", id: 2, state: "approval", progress: { turn: 3, maxTurns: 100 }, detail: "bash",
  })
  assert.equal(chunks(notes).length, 0)
})

// ─── T-862-5..6 · 零字段态（键缺席语义） ────────────────────────────────────

test("T-862-5 边界：async ‖ cancelled（零字段）⇒ 仅 {role,id,state}——progress/detail 键缺席", async () => {
  const { cb, notes } = await harness()
  cb.onToken(`eng-coder#2/⟦ev⟧async${RS}`)
  cb.onToken(`eng-coder#2/⟦ev⟧cancelled${RS}`)
  const ms = infos(notes).map(metaOf)
  console.log(`[读数] T-862-5: ${JSON.stringify(ms)}`)
  assert.equal(ms.length, 2)
  assert.deepEqual(ms[0], { role: "eng-coder", id: 2, state: "async" })
  assert.deepEqual(ms[1], { role: "eng-coder", id: 2, state: "cancelled" })
  for (const m of ms) {
    assert.deepEqual(Object.keys(m).sort(), ["id", "role", "state"], "键缺席语义（非 null 填充）")
    assert.equal("progress" in m, false)
    assert.equal("detail" in m, false)
  }
  assert.equal(chunks(notes).length, 0)
})

test("T-862-6 边界：stopped ‖ settled ‖ done（0/0/名）⇒ 零 payload 字段；state 逐字", async () => {
  const { cb, notes } = await harness()
  cb.onToken(`eng-coder#2/⟦ev⟧stopped${RS}0${RS}0${RS}stopped${RS}`)
  cb.onToken(`eng-coder#2/⟦ev⟧settled${RS}0${RS}0${RS}settled${RS}`)
  cb.onToken(`eng-coder#2/⟦ev⟧done${RS}0${RS}0${RS}done${RS}`)
  const ms = infos(notes).map(metaOf)
  console.log(`[读数] T-862-6: ${JSON.stringify(ms)}`)
  assert.deepEqual(ms.map((m) => m.state), ["stopped", "settled", "done"])
  for (const m of ms) assert.deepEqual(Object.keys(m).sort(), ["id", "role", "state"])
  assert.equal(chunks(notes).length, 0)
})

// ─── T-862-7 · 嵌套前缀（role/id = 最内段） ─────────────────────────────────

test("T-862-7 边界：嵌套前缀 ⇒ role/id = 最内段（explore#1/eng-coder#2 ⇒ eng-coder/2）", async () => {
  const { cb, notes } = await harness()
  cb.onToken(`explore#1/eng-coder#2/⟦ev⟧done${RS}0${RS}0${RS}done${RS}`)
  console.log(`[读数] T-862-7: ${JSON.stringify(notes)}`)
  assert.equal(notes.length, 1, "恰一条通知")
  assert.deepEqual(metaOf(infos(notes)[0]), { role: "eng-coder", id: 2, state: "done" })
  assert.equal(chunks(notes).length, 0)
})

// ─── T-862-8..10 · 负向三条 ─────────────────────────────────────────────────

test("T-862-8 负向：无终止符 ⟦ev⟧ ⇒ 零结构化；照常转发（现行为零改）", async () => {
  const { cb, notes } = await harness()
  cb.onToken("eng-coder#2/⟦ev⟧async")
  console.log(`[读数] T-862-8: ${JSON.stringify(notes)}`)
  assert.equal(infos(notes).length, 0, "零结构化")
  assert.deepEqual(notes[0].p.update, {
    sessionUpdate: "agent_message_chunk", content: { type: "text", text: "⟦ev⟧async" },
  })
})

test("T-862-9 负向：文本中段 ⟦ev⟧ 字面 ⇒ 照常转发；零结构化", async () => {
  const { cb, notes } = await harness()
  cb.onToken("eng-coder#2/text ⟦ev⟧ x")
  console.log(`[读数] T-862-9: ${JSON.stringify(notes)}`)
  assert.equal(infos(notes).length, 0)
  assert.deepEqual(notes[0].p.update, {
    sessionUpdate: "agent_message_chunk", content: { type: "text", text: "text ⟦ev⟧ x" },
  })
})

test("T-862-10 负向：无前缀形态事件 ⇒ 仅剥离零发射（防御面）", async () => {
  const { cb, notes } = await harness()
  cb.onToken(`⟦ev⟧turn${RS}1${RS}2${RS}llm${RS}`)
  console.log(`[读数] T-862-10: ${JSON.stringify(notes)}`)
  assert.equal(notes.length, 0, "剥离 + 零发射")
})

// ─── T-862-11..12 · 既有面零回归 ────────────────────────────────────────────

test("T-862-11 回归：`[model]` token ⇒ 零发射零 chunk（现行为零改）", async () => {
  const { cb, notes } = await harness()
  cb.onToken("eng-coder#2/[model]m1")
  console.log(`[读数] T-862-11: ${JSON.stringify(notes)}`)
  assert.equal(notes.length, 0)
})

test("T-862-12 回归：内容 chunk ⇒ 前缀剥 + 照常转发（零回归）", async () => {
  const { cb, notes } = await harness()
  cb.onToken("eng-coder#2/hello")
  console.log(`[读数] T-862-12: ${JSON.stringify(notes)}`)
  assert.equal(infos(notes).length, 0)
  assert.deepEqual(notes[0].p.update, {
    sessionUpdate: "agent_message_chunk", content: { type: "text", text: "hello" },
  })
})