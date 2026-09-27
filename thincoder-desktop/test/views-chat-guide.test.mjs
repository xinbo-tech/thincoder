/**
 * views-chat-guide.test.mjs — U151 引导面用例（批 B 追加轮；形态单源 = `docs/desktop/design/UI.md` §1 批 B 追加注 ·
 * `docs/desktop/design/RENDERER.md` §1.1「帧尾态刷」）。判据面 = `renderer/views/chat-guide.mjs` 三件：判据 `guideOf`
 * （四值纯函数 · 零 DOM）/ 构树 `guideNode`（纯描述符 —— 动作控件在场 ⟺ 句柄在场）/ 帧尾态刷 `syncGuide`
 * （本档**唯一** DOM 面 —— 缺席零动作 / 码同零写 / 码异原位换 / 判据空 ⇒ 摘）。分档 = 面不变、只换宿主档
 * （沿 `views-chat-frame.test.mjs` 拆档先例）：帧面判据留宿主两档，引导三件直测住本档。
 * 词面判据沿宿主表注入缝（`initDict({ locale, host })`）：哨兵值 ⇒ 断言即证「文案经 `t()` 消费」，不引字面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { build } from "../renderer/dom.mjs"
import { HOST_DICT, initDict } from "../renderer/i18n.mjs"
import { guideNode, guideOf, syncGuide } from "../renderer/views/chat-guide.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"

/** 词面哨兵（全表逐键给值 —— 缺值走缺省句 ⇒ 哨兵面失真，断言即假绿）。 */
function setupDict(ctx) {
  const host = Object.fromEntries(Object.keys(HOST_DICT.en).map((key) => [key, `⟦${key}⟧`]))
  initDict({ locale: "en", host })
  ctx.after(() => initDict({}))
}

/** 三码词键闭集（闭集内断言 —— 表外码由构树面另判）。 */
const WORDS = { "no-project": "chat.guide.noProject", "no-session": "chat.guide.noSession", "no-message": "chat.empty.hint" }
/** 两码句柄齐（在场面）· 控件词键（左列既有键）。 */
const handlers = { onOpenDir: () => {}, onNewSession: () => {} }
const ACTION_WORDS = { "no-project": "rail.action.openDir", "no-session": "rail.action.newSession" }

test("U151: 引导三件（判据四值 / 构树两向 + 表外零树 / 帧尾态刷四径 · 假根）", (ctx) => {
  setupDict(ctx)

  // ① 判据四值（纯函数 —— 无非串 / 空串假造：`cwd` 非空串才认 no-session）
  assert.equal(guideOf({ live: true, cwd: "/p", visible: 3 }), null, "有会话 ∧ 可见块 > 0 ⇒ 不在场（flow 帧）")
  assert.equal(guideOf({ live: true, cwd: "/p", visible: 0 }), "no-message", "有会话 ∧ 可见块 0 ⇒ no-message")
  assert.equal(guideOf({ live: false, cwd: "/p", visible: 0 }), "no-session", "无会话 ∧ cwd 非空 ⇒ no-session")
  assert.equal(guideOf({ live: false, cwd: "", visible: 0 }), "no-project", "无会话 ∧ cwd 空串 ⇒ no-project")
  assert.equal(guideOf({ live: false }), "no-project", "无会话 ∧ cwd 缺 ⇒ no-project")
  assert.equal(guideOf({ live: false, cwd: 7 }), "no-project", "cwd 非串 ⇒ no-project（禁假造）")
  assert.equal(guideOf({ live: true, cwd: "/p", visible: 0 }) === guideOf({ live: false, cwd: "/p" }), false, "有会话 ⇒ 判据只随可见块（不落 no-session）")

  // ② 构树两向之一：表外码 / 非串 ⇒ `null`（零假树 —— 缺省面不造码）
  for (const code of ["x", "", "no-messages", null, undefined, 7]) {
    assert.equal(guideNode({ guide: code }), null, `表外码 ${String(code)} ⇒ null`)
  }
  assert.equal(guideNode(), null, "模型缺位 ⇒ null")

  // ③ 三码树：根锚两件 · 子序 = 文案 → [控件?] · 控件词 = 左列既有键
  for (const code of ["no-project", "no-session", "no-message"]) {
    const node = guideNode({ guide: code }, handlers)
    assert.deepEqual(node.props, { class: "chat-empty", "data-guide": code }, `${code} 根锚两件`)
    assert.equal(node.children[0], `⟦${WORDS[code]}⟧`, `${code} 文案经 t()（哨兵键）`)
    assert.equal(node.tag, "div", `${code} 根 div`)
  }
  const project = guideNode({ guide: "no-project" }, handlers)
  assert.deepEqual(project.children[1].props, { class: "chat-backfill", "data-action": "project:open", onClick: handlers.onOpenDir }, "no-project 控件 = project:open（句柄直传）")
  assert.deepEqual(project.children[1].children, [`⟦${ACTION_WORDS["no-project"]}⟧`], "控件词 = 左列既有键")
  const session = guideNode({ guide: "no-session" }, handlers)
  assert.deepEqual(session.children[1].props, { class: "chat-backfill", "data-action": "session:create", onClick: handlers.onNewSession }, "no-session 控件 = session:create")
  assert.deepEqual(session.children[1].children, [`⟦${ACTION_WORDS["no-session"]}⟧`], "控件词 = 左列既有键")
  assert.equal(guideNode({ guide: "no-message" }, handlers).children.length, 1, "no-message ⇒ 零控件（句柄齐亦零）")

  // ④ 构树两向之二：句柄缺 ⇒ 退纯文案（零假按钮 —— 两码逐码）
  for (const code of ["no-project", "no-session"]) {
    assert.equal(guideNode({ guide: code }, {}).children.length, 1, `${code} 无句柄 ⇒ 纯文案`)
    assert.equal(guideNode({ guide: code }).children.length, 1, `${code} 无 handlers 实参 ⇒ 纯文案`)
  }
  assert.equal(guideNode({ guide: "no-project" }, { onOpenDir: "x" }).children.length, 1, "句柄非函数 ⇒ 零假按钮")
  assert.equal(guideNode({ guide: "no-project" }, { onNewSession: () => {} }).children.length, 1, "仅他码句柄在场 ⇒ 纯文案（逐码取键）")
  assert.equal(guideNode({ guide: "no-session" }, { onNewSession: () => {} }).children.length, 2, "本码句柄在场 ⇒ 恰一枚控件")

  // ⑤ 帧尾态刷（假根 —— 只摘不插 + 幂等）
  assert.equal(selfCheck(), true, "假 DOM 载体自检（选择器闭集 / 锚缺抛 / 写计三档）")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const root = fake.element("div")
  root.setAttribute("data-slot", "flow")
  const quiet = fake.mark()
  syncGuide(root, { guide: "no-project" }, handlers)
  assert.deepEqual(fake.delta(quiet), { structural: 0, text: 0, attr: 0 }, "节点缺席 ⇒ 零动作（不插第二个 —— 建树归重挂面）")
  syncGuide(null, { guide: "no-project" }, handlers)
  assert.deepEqual(fake.delta(quiet), { structural: 0, text: 0, attr: 0 }, "根缺位 ⇒ 零动作零抛")

  const first = build(guideNode({ guide: "no-project" }, handlers))
  root.append(first)
  const same = fake.mark()
  syncGuide(root, { guide: "no-project" }, handlers)
  assert.deepEqual(fake.delta(same), { structural: 0, text: 0, attr: 0 }, "码同 ⇒ 零 DOM 写")
  assert.equal(root.children[0], first, "码同 ⇒ 节点引用不变")

  const swapped = fake.mark()
  syncGuide(root, { guide: "no-session" }, handlers)
  assert.equal(fake.delta(swapped).structural > 0, true, "码异 ⇒ 有写（建树 + `replaceWith` 同计 —— 幂等面看零写两臂；写数不入判）")
  const next = root.children[0]
  assert.notEqual(next, first, "码异 ⇒ 换节点")
  assert.equal(next.getAttribute("data-guide"), "no-session", "新码落位")
  assert.equal(next.querySelector('[data-action="session:create"]') !== null, true, "新码控件随换")
  assert.equal(root.children.length, 1, "换后恰一枚（不叠加）")

  const gone = fake.mark()
  syncGuide(root, { guide: null }, handlers)
  assert.deepEqual(fake.delta(gone), { structural: 1, text: 0, attr: 0 }, "判据空 ⇒ 摘（恰一次结构写）")
  assert.equal(root.children.length, 0, "节点离场（零残留）")
  const empty = fake.mark()
  syncGuide(root, { guide: "no-project" }, handlers)
  assert.deepEqual(fake.delta(empty), { structural: 0, text: 0, attr: 0 }, "摘后不复插（帧尾只摘不插）")

  root.append(build(guideNode({ guide: "no-project" }, handlers)))
  syncGuide(root, { guide: "x" }, handlers)
  assert.equal(root.children.length, 0, "表外码 ⇒ 同判据空（摘净 —— 不落未知码节点）")
})
