/**
 * history-window.test.mjs — SESSION-RESTORE-PARITY ① historyWindow 直驱组（extension 层纯函数）。
 * docs/design/SESSION-RESTORE-PARITY.md §1（规则 1-6 + C/A/B/E/F/G/H——AC-C/A/B/E/F/H 锁）。
 * 手法：直驱核面 `@thincoder/core/history-window.mjs`（窗口算法单源——W6 起本端
 * `../src/extension/history-window.mjs` = 端壳转口 re-export）；fixture = 真实形状混排（pushReal 打点 ts / role 键 /
 * tool_calls{id,function:{name,arguments}} /
 * tool{tool_call_id,name,content}——老文件 timestamp 键 / 更老缺失）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { historyWindow, HISTORY_PAGE_SIZE, isRealUserMsg } from "@thincoder/core/history-window.mjs"

// ─── fixture 构建器（真实形状）────────────────────

const u = (content, ts) => ({ role: "user", content, ...(ts !== undefined ? { ts } : {}) })
const r = (text = "working directory snapshot: …") => ({ role: "user", content: `[System reminder: ${text}]` })
const a = (content, extra = {}) => ({ role: "assistant", content: content ?? null, ...extra })
const call = (id, name, args = "{}") => ({ id, type: "function", function: { name, arguments: args } })
const tool = (id, content, name = "bash") => ({ role: "tool", tool_call_id: id, content, name })

/** 抽取 assistant 消息的 turnStart 序列（与 user/tool 无关——矩阵断言用）。 */
const turnStarts = (msgs) => msgs.filter((m) => m.kind === "assistant").map((m) => m.turnStart)

// ─── H：页大小锁（评审 #3——首窗对齐 CLI 200）─────

test("H：HISTORY_PAGE_SIZE === 200（评审 #3 定论——首窗对齐 CLI INITIAL_HISTORY_MESSAGES）", () => {
  assert.equal(HISTORY_PAGE_SIZE, 200)
})

// ─── 序列组 turnStart 矩阵（A——规则 5：可见前驱）──

test("A turnStart 矩阵：可见前驱语义——无前驱/user 前驱 true；assistant/被消费 tool 前驱 false；reminder 夹帧间不重置", () => {
  const rows = [
    { name: "首条即 assistant（无可见前驱）", h: [a("x")], want: [true] },
    { name: "user 后 assistant", h: [u("q"), a("x")], want: [true] },
    { name: "assistant 连发（多 LLM 调用回合延续——只标一次）", h: [u("q"), a("x"), a("y")], want: [true, false] },
    { name: "纯工具回合（帧后 tool 条目被消费不可见——可见前驱仍是帧）", h: [u("q"), a(null, { tool_calls: [call("c1", "bash")] }), tool("c1", "r"), a("y")], want: [true, false] },
    { name: "reminder 夹 user/assistant 间（跳过不重置——可见前驱 = user）", h: [u("q"), r(), a("y")], want: [true] },
    { name: "reminder 夹两 assistant 间（回合延续——不重置）", h: [u("q"), a("x"), r(), a("y")], want: [true, false] },
    { name: "reminder 打头——assistant 无可见前驱", h: [r(), a("x")], want: [true] },
  ]
  for (const row of rows) {
    const { messages } = historyWindow(row.h, null)
    assert.deepEqual(turnStarts(messages), row.want, `turnStart ${row.name}`)
  }
})

// ─── C：机器提醒剔除（规则 1）──────────────────

test("C：reminder/空白 user 剔除——输出零 [System reminder:；非 string 内容 skip", () => {
  const { messages } = historyWindow([u("real", 5), r("x"), u(""), u("   "), a("ok")], null)
  assert.deepEqual(messages.map((m) => m.text), ["real", "ok"], "仅真实 user + assistant")
  assert.ok(messages.every((m) => typeof m.text !== "string" || !m.text.startsWith("[System reminder:")), "零 reminder 文本")
  // 多模态（content 数组）user 也 skip——规则 1 非 string 态
  const mm = historyWindow([u("real"), { role: "user", content: [{ type: "text", text: "img note" }] }], null)
  assert.deepEqual(mm.messages.map((m) => m.kind), ["user"], "多模态 user skip")
  // isRealUserMsg 自身对空串返回 true（复用须叠加 trim 判——谓词精确化）
  assert.equal(isRealUserMsg({ role: "user", content: "" }), true)
  assert.equal(isRealUserMsg({ role: "user", content: "   " }), true)
  assert.equal(isRealUserMsg({ role: "user", content: "[System reminder: t]" }), false)
})

// ─── B：配对（规则 3/4——tool_call_id 次序 + 跨窗口）─

test("B 配对：并行批乱序完成全配（声明序）+ args 透传 + 无结果 null + 被消费条目不独立产消息", () => {
  // 帧声明 c2,c3——文件序结果 c3 先到、c2 后到（乱序完成）——tools[] 按声明序逐 id 配对
  const h = [
    u("q", 1),
    a(null, { tool_calls: [call("c2", "bash", "{\"cmd\":\"pwd\"}"), call("c3", "grep", "{\"q\":\"x\"}")] }),
    tool("c3", "r3", "grep"),
    tool("c2", "r2", "bash"),
  ]
  const { messages } = historyWindow(h, null)
  assert.deepEqual(messages.map((m) => m.kind), ["user", "assistant"], "被消费 tool 条目不独立产消息")
  const f = messages[1]
  assert.equal(f.turnStart, true, "纯工具回合有 ❯ ThinCoder: 标签（可见前驱 = user——AC-A）")
  assert.equal(f.tools.length, 2)
  assert.equal(f.tools[0].id, "c2")
  assert.equal(f.tools[0].name, "bash")
  assert.equal(f.tools[0].args, "{\"cmd\":\"pwd\"}", "args 原样透传")
  assert.equal(f.tools[0].result, "r2")
  assert.equal(f.tools[1].id, "c3")
  assert.equal(f.tools[1].result, "r3")
  assert.equal(f.tools[1].name, "grep")

  // 无结果 null：帧声明 c1,c2——只有 c1 的结果在文件里（中断回合）
  const h2 = [u("q", 1), a(null, { tool_calls: [call("c1", "bash"), call("c2", "grep")] }), tool("c1", "r1")]
  const { messages: m2 } = historyWindow(h2, null)
  assert.equal(m2[1].tools[0].result, "r1")
  assert.equal(m2[1].tools[1].result, null, "未配调用 result:null")
})

// ─── E：reasoning 透传（规则 6——?? 键兼容）──────

test("E：reasoning_content ?? reasoning——thinking 帧恢复数据透传；纯 reasoning 帧非幽灵", () => {
  const { messages } = historyWindow([a(null, { reasoning_content: "deep think", tool_calls: [call("c1", "bash")] }), tool("c1", "r")], null)
  assert.equal(messages[0].reasoning, "deep think")
  assert.equal(messages[0].text, null, "content null 不丢帧（纯工具/纯 thinking 帧保留）")
  assert.equal(messages[0].tools.length, 1)
  const legacy = historyWindow([a("x", { reasoning: "legacy-think" })], null)
  assert.equal(legacy.messages[0].reasoning, "legacy-think", "老键 reasoning 兼容")
  const prio = historyWindow([a("x", { reasoning: "old", reasoning_content: "new" })], null)
  assert.equal(prio.messages[0].reasoning, "new", "reasoning_content 优先")
  const only = historyWindow([a(null, { reasoning_content: "think-only" })], null)
  assert.equal(only.messages.length, 1, "reasoning-only 帧保留（非幽灵）")
  assert.equal(only.messages[0].reasoning, "think-only")
})

// ─── 幽灵/多模态帧 skip（规则 2/6）─────────────

test("规则 2/6：幽灵帧（空 ∧ 无 tool_calls ∧ 无 reasoning）skip——多模态 assistant 内容不丢帧", () => {
  for (const ghost of [a(""), a("   "), a(null)]) {
    const { messages } = historyWindow([u("q", 1), ghost], null)
    assert.deepEqual(messages.map((m) => m.kind), ["user"], `幽灵帧 skip: ${JSON.stringify(ghost.content)}`)
  }
  const mm = historyWindow([u("q", 1), a([{ type: "text", text: "arr" }], { tool_calls: [call("c1", "bash")] }), tool("c1", "res")], null)
  assert.equal(mm.messages.length, 2, "多模态 assistant 内容帧有 tool_calls → 保留")
  assert.equal(mm.messages[1].text, null, "数组内容不可渲染 → text null（卡渲染）")
  assert.equal(mm.messages[1].tools[0].result, "res")
})

// ─── F：ts/timestamp/缺失三形态 + idx 全局 + hasOlder ─

test("F：timestamp = ts ?? timestamp ?? null 三形态 + idx 全局 + hasOlder", () => {
  const h = [
    { role: "user", content: "ts-form", ts: 1111 },
    { role: "user", content: "timestamp-form", timestamp: 2222 },
    { role: "user", content: "ts-wins", ts: 3333, timestamp: 4444 },
    { role: "user", content: "missing" },
    u("after", 5),
  ]
  const { messages, hasOlder } = historyWindow(h, null)
  assert.equal(messages[0].timestamp, 1111, "ts 形态")
  assert.equal(messages[1].timestamp, 2222, "老文件 timestamp 形态")
  assert.equal(messages[2].timestamp, 3333, "双键并存 ts 优先")
  assert.equal(messages[3].timestamp, null, "缺失形态 → null（webview 不显示时间）")
  assert.equal(hasOlder, false, "窗口从头起 hasOlder:false")
  assert.deepEqual(messages.map((m) => m.idx), [0, 1, 2, 3, 4], "idx = 全局下标")

  const tail = historyWindow(h, null, 3)
  assert.deepEqual(tail.messages.map((m) => m.idx), [2, 3, 4], "pageSize 3 末页 = [2,5)")
  assert.equal(tail.hasOlder, true, "start>0 → hasOlder:true")
  const clamped = historyWindow(h, 1000, 2)
  assert.deepEqual(clamped.messages.map((m) => m.idx), [3, 4], "before 超界钳到 total")
  assert.deepEqual(historyWindow(h, 0, 2).messages, [], "before=0 → 空前页")
  assert.deepEqual(historyWindow([], null), { messages: [], hasOlder: false }, "空历史")
})

// ─── 窗口边界跨页配对 + 孤儿 skip（规则 4——评审 #4 scope 精确化）──

test("B/规则 4：窗口边界跨页配对——尾帧未配调用消费界后紧邻 tool 条目；孤儿判定对全历史（窗口内无主但有主条目 skip——防跨页双显；真孤儿保底落顶层）", () => {
  // 12 条混排 fixture：
  // 0 user / 1 F1(c1) / 2 t(c1 r1) / 3 user / 4 F2(c2,c3) / 5 t(c3 r3) / 6 t(c2 r2) /
  // 7 user / 8 F3(text8+reasoning think8+c4) / 9 t(c4 r9) / 10 t(zzz)——真孤儿 / 11 user
  const h = [
    u("start", 100),
    a(null, { tool_calls: [call("c1", "bash", "{\"cmd\":\"ls\"}")] }),
    tool("c1", "r1"),
    u("three", 700),
    a(null, { tool_calls: [call("c2", "bash"), call("c3", "grep")] }),
    tool("c3", "r3", "grep"),
    tool("c2", "r2"),
    u("seven", 7000),
    a("text8", { reasoning_content: "think8", tool_calls: [call("c4", "bash")] }),
    tool("c4", "r9"),
    tool("zzz", "orphan-body", "weird"),
    u("eleven"),
  ]

  // 全窗 [0,12)：配对内聚 + 消费条目零独立消息 + 真孤儿顶层保底
  const full = historyWindow(h, null)
  assert.deepEqual(full.messages.map((m) => m.idx), [0, 1, 3, 4, 7, 8, 10, 11], "消费条目（2/5/6/9）不产消息；真孤儿(10)保底")
  assert.equal(full.messages[1].tools[0].result, "r1", "F1 结果内聚")
  assert.equal(full.messages[3].tools[0].id, "c2", "tools[] 声明序——c2 先（文件序结果 c3 先到）")
  assert.equal(full.messages[3].tools[0].result, "r2")
  assert.equal(full.messages[3].tools[1].result, "r3")
  assert.equal(full.messages[5].tools[0].result, "r9")
  const orphan = full.messages[6]
  assert.deepEqual(orphan, { kind: "tool", name: "weird", text: "orphan-body", timestamp: null, idx: 10 }, "真孤儿（全历史无主）→ tool 保底消息")

  // 跨页配对：窗口 [4,9) 末帧 F3@8——其结果 t@9 在窗口末界后（界外紧邻）——照样配对入帧
  const cross = historyWindow(h, 9, 5)
  assert.deepEqual(cross.messages.map((m) => m.idx), [4, 7, 8], "[4,9)：F2/u7/F3——t5/t6 随 F2、t9 消费随 F3")
  assert.equal(cross.messages[2].tools[0].result, "r9", "F3 的未配调用消费窗口末界后的紧邻 tool 条目（跨页配对——规则 4）")

  // 孤儿 skip（评审 #4 scope 精确化）：窗口 [5,12)——t5/t6 在窗口内但全历史有主（F2@4 界外）→
  // skip（其帧页渲染——防跨页双显）；t9 有主（F3 在窗口内）→ 消费 skip；真孤儿 t10 → 保底
  const win = historyWindow(h, 12, 7)
  assert.deepEqual(win.messages.map((m) => m.idx), [7, 8, 10, 11], "窗口 [5,12)：界外帧的 t5/t6 跳过不双显")
  assert.deepEqual(win.messages.filter((m) => m.kind === "tool").map((m) => m.idx), [10], "仅真孤儿落顶层")
  assert.equal(win.hasOlder, true, "start>0 hasOlder:true")
})
