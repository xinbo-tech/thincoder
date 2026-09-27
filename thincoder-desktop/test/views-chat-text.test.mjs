/**
 * views-chat-text.test.mjs — 对话流**文本面**用例族（R3c · D19 · `docs/render-core/design/RENDER-CORE.md` §7 C7 ·
 * `docs/desktop/design/PROJECT.md` §7 T-DSK35；新增用例族 —— 名实施批定）：
 * U172 = 核 Markdown 树 / HTML 面（围栏块 ⇒ `pre.code-block` · 转义闸 · 推理块折叠 · 文件链接零节点）；
 * U173 = 代码块复制钮挂点（核件 `attachCopyButtons` 落点 · 假根 —— 点按出口链）。
 * 拆档理由 = 档行预算（`docs/desktop/design/PROJECT.md` §4.1「300 行 = 主动拆分层」—— `views-chat.test.mjs`
 * 本体面 + 本族并入必越层；面不变、判据不变，只换宿主档）。
 * 纪律：U172 走纯构树（零 DOM）；U173 走假根（`test/fake-dom.mjs` —— 描述符 → 节点那一段机检）。
 * 词面判据沿宿主表注入缝（`initDict({ host, dict })`）：哨兵值 ⇒ 断言即证「文案经 `t()` 消费」，不引字面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { HOST_DICT, initDict, t } from "../renderer/i18n.mjs"
import { chatModel, chatTree, mountChat, settleFrame } from "../renderer/views/chat.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"

/** 词面哨兵：插值键保留占位方言 ⇒ 断言同时钉「键 + 参数入词」。 */
const HOST_TEMPLATE = {
  "chat.pill.new": "⟦new:${n}⟧",
  "chat.summary.older": "⟦older:${n}⟧",
  "chat.tool.changes": "⟦chg:${files}+${add}-${del}⟧",
  "chat.tool.duration": "⟦dur:${seconds}⟧",
}
/** 核域键哨兵（词形单源 = 核 i18n —— 消费面断言，非本端新键）：状态词五 + 推理块摘要词 + 复制面两键。 */
const CORE_WORD = ["sub.queued", "sub.running", "sub.done", "sub.stopped", "sub.error", "status.thinking", "msg.copy", "msg.copied"]

function setupDict(ctx) {
  const host = Object.fromEntries(Object.keys(HOST_DICT.en).map((key) => [key, HOST_TEMPLATE[key] ?? `⟦${key}⟧`]))
  initDict({ locale: "en", host, dict: Object.fromEntries(CORE_WORD.map((key) => [key, `⟦${key}⟧`])) })
  ctx.after(() => initDict({}))
}

/** 帧态夹具（只给判据消费的键）：`activeSession` 非空 ⇒ 有会话。 */
const state = (over = {}) => ({
  activeSession: "s1",
  blocks: [],
  history: { hasOlder: false, inFlight: false, page: null },
  following: true,
  pendingNew: 0,
  locale: "en",
  ...over,
})
const user = (over = {}) => ({ kind: "user", text: "问题", ...over })

/** 树遍历（深度优先 · 保序）：节点集 / 叶文本集共用 —— `asText` 切换收集面（`null` 空位不入）。 */
function walk(tree, asText) {
  const out = []
  const visit = (child) => {
    if (child === null || child === undefined) return
    if (typeof child === "object" && typeof child.tag === "string") {
      if (!asText) out.push(child)
      for (const kid of Array.isArray(child.children) ? child.children : [child.children]) visit(kid)
      return
    }
    if (asText) out.push(String(child))
  }
  visit(tree)
  return out
}

const texts = (tree) => walk(tree, true)
/** 属性在场筛选（DFS 序 · 值不约束）。 */
const withAttr = (tree, name) => walk(tree, false).filter((node) => node.props?.[name] !== undefined)

// ─── U172 C7 / T-DSK35 核 Markdown 面（树 / HTML 面）──────────────

test("U172: C7 / T-DSK35 —— 核 Markdown 面（围栏块 / 转义闸 / 推理块折叠 / 文件链接零节点）", (ctx) => {
  setupDict(ctx)
  const blocks = [
    { kind: "assistant", id: "a1", text: "```js\nconst a = 1\n```" },
    { kind: "user", id: "u1", text: "<script>alert(1)</script>" },
    { kind: "assistant", id: "a2", text: "见 src/main/app.mjs 的说明" },
    { kind: "reasoning", id: "r1", text: "想" },
  ]
  const tree = chatTree(chatModel(state({ blocks })))
  const faces = withAttr(tree, "data-raw")
  const html = faces.map((node) => node.props.html)
  assert.equal(html[0].includes('pre class="code-block"'), true, "围栏块 ⇒ `pre.code-block`（核 md 围栏切分 —— C7 ①）")
  assert.equal(html[0].includes('class="code-lang"'), true, "语言面在场（`code-lang` —— 围栏语言标注）")
  assert.equal(html[0].includes("<code>"), true, "块内 `code` 面（高亮入口同核）")
  assert.equal(html[0].includes("code-copy-btn"), false, "复制钮不属 md 产出（挂载面核件 `attachCopyButtons` 补 —— U173 / E2E）")
  assert.equal(html[1].includes("<script"), false, "注入样本 ⇒ 零裸标签（转义闸 —— C7 ②）")
  assert.equal(html[1].includes("&lt;script&gt;alert(1)&lt;/script&gt;"), true, "注入样本 ⇒ 字面文本（渲染面零执行面）")
  assert.equal(/file-link/.test(html[2]), false, "文件链接零节点（KD-RC-5 —— 核 `linkifyPaths` 不消费；T-DSK35 ④）")
  assert.equal(html[2].includes("src/main/app.mjs"), true, "文件路径文本原样在场（只是零链接面）")
  const reasoning = withAttr(tree, "data-block-kind").find((node) => node.props["data-block-kind"] === "reasoning")
  const details = reasoning.children[0]
  assert.deepEqual([details.tag, details.props.class, details.props.open], ["details", "reasoning-block", true], "推理块 = 折叠块（核件结构 `details.reasoning-block[open]` —— T-DSK35 ③）")
  assert.deepEqual(texts(details.children[0]), [t("status.thinking")], "summary 词 = 核键 `status.thinking`（词形单源 = 核 i18n；本端零同义键）")
  assert.equal(details.children[1].props.class, "reasoning-content", "内容区 = 核类名 `.reasoning-content`（映射样式住 `renderer/core.css`）")
  assert.equal(details.children[1].props.html.includes("想"), true, "推理内容经核 md（转义闸同文本面）")
  assert.deepEqual(reasoning.children[1].props["data-action"], "chat:copy-block", "块尾复制控件仍在（KD-22 口径不变 —— 与代码块钮两控并存）")
})

// ─── U173 代码块复制钮挂点（核件落点 · 假根）──────────────

test("U173: 代码块复制钮挂点（核件 `attachCopyButtons` —— 挂载 / 帧尾两径补钮 ∧ 幂等 ∧ 点按 ⇒ 代码文本出）", async (ctx) => {
  setupDict(ctx)
  assert.equal(selfCheck(), true, "假 DOM 载体自检（核构件面：类 / 标签选择器 ∧ className / classList / appendChild / innerHTML）")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  // 核件出口链环境：`navigator.clipboard.writeText`（核件按钮点按出口 —— 真环境 = `app://` 安全上下文）
  const written = []
  const previous = Object.getOwnPropertyDescriptor(globalThis.navigator ?? {}, "clipboard")
  Object.defineProperty(globalThis.navigator ?? (globalThis.navigator = {}), "clipboard", {
    configurable: true,
    value: { writeText: (value) => { written.push(value); return Promise.resolve() } },
  })
  ctx.after(() => {
    if (previous === undefined) delete globalThis.navigator.clipboard
    else Object.defineProperty(globalThis.navigator, "clipboard", previous)
  })

  const root = fake.element("div")
  root.setAttribute("data-slot", "flow")
  const first = state({ blocks: [user({ id: "u1", text: "问" })] })
  mountChat(root, first)
  // 手工置一枚**核形**代码块（假面不解析 HTML ⇒ 结构由本测试直接注入；真解析面 = E2E）
  const pre = document.createElement("pre")
  pre.className = "code-block"
  const code = document.createElement("code")
  code.textContent = "const a = 1"
  pre.appendChild(code)
  root.querySelector("[data-raw]").appendChild(pre)

  const model = chatModel(first)
  settleFrame(root, model, null, { evict: 0, prepend: 0, tail: [], ok: true }, "none", {})
  const buttons = root.querySelectorAll(".code-copy-btn")
  assert.equal(buttons.length, 1, "帧尾挂点 ⇒ 代码块补钮恰一枚（核件 `attachCopyButtons`）")
  assert.equal(buttons[0].textContent, "⟦msg.copy⟧", "钮词面 = 核键 `msg.copy`（`deps.t` 注入 = 桌面词表；词形单源 = 核 i18n）")
  settleFrame(root, model, null, { evict: 0, prepend: 0, tail: [], ok: true }, "none", {})
  assert.equal(root.querySelectorAll(".code-copy-btn").length, 1, "再刷 ⇒ 零叠钮（已挂着跳过 —— 帧级幂等）")

  fake.fire(buttons[0], "click", {})
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.deepEqual(written, ["const a = 1"], "点按 ⇒ `clipboard.writeText` 收**代码文本**（块内 `code` 面现读 —— C7/T-DSK35 ①）")
  assert.equal(buttons[0].textContent, "⟦msg.copied⟧", "回执面 = 核键 `msg.copied`（核件自刷）")
  assert.equal(buttons[0].classList.contains("copied"), true, "`copied` state class 在场（核件同源）")
})
