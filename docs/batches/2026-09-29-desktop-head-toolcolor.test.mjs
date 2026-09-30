/**
 * 2026-09-29-desktop-head-toolcolor.test.mjs — 批内件（批次本地件惯例：名随批次档 · 住 `docs/batches/` ·
 * 不登记仓套件 · 随批留存）：撤会话头（整行含槽退役 —— 三值归输入区）+ 工具头行色 VSC 逐值 批机检面（T1–T5）。
 *   T1 骨架：`index.html` 零 `session-head` ∧ 余槽四在场（结构不变量）。
 *   T2 模块面：`views/chrome.mjs` 导出集锁（头族全无 ∕ 留守件在 ∕ 状态行三再出口同名）+ `mount-head.mjs`
 *     退役（删档）+ `frame-dispatch.mjs` `FRAME_FACES` = 五面 ∧ 无 `HEAD_KEYS`。
 *   T3 词键：`i18n.mjs` 源面 `head.field.*` 零命中 ∧ `HOST_DICT` 两语零 `head.` 键 ∧ 计数差 = −3（邻位对拍）。
 *   T4 写路存续（「撤面不丢能力」机检腿）：stub 窄桥下 `post("selectModel", …)` ⇒ `session:prefs`
 *     `{ model, provider }`；`post("selectReasoning", …)` ⇒ `{ effort }`（两向映射取实件）。
 *   T5 ② 规则锁（`chat.css` 源面）：段级逐值（name ∕ args ∕ status 两态 ∕ time）+ 整行裸规则三形零残留。
 * 修前红 ∕ 修后绿：T1 ∕ T2 ∕ T3 ∕ T5 四腿于实施前为红（撤面 ∕ 落色未落）；T4 = 存续腿（两态皆绿）。
 * 跑法（cwd `thincoder/`）：`node --test docs/batches/2026-09-29-desktop-head-toolcolor.test.mjs`。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const ROOT = fileURLToPath(new URL("../../", import.meta.url))
const read = (rel) => readFileSync(`${ROOT}${rel}`, "utf8")
const out = (label, value) => console.log(`[读数] ${label}: ${value}`)

// ─── T1 骨架（结构不变量）────────────────────────────────────────────────────

test("T1 骨架：`index.html` 零 `session-head` ∧ 余槽四在场", () => {
  const html = read("thincoder-desktop/renderer/index.html")
  assert.equal((html.match(/session-head/g) ?? []).length, 0, "`session-head` 词面零命中")
  for (const slot of ["session-control", "flow", "composer", "status"]) {
    assert.ok(html.includes(`data-slot="${slot}"`), `余槽在场：${slot}`)
  }
  out("index.html", "session-head 命中 = 0 · 余槽四在场")
})

// ─── T2 模块面（导出集锁 ∕ 退役 ∕ 五面表）────────────────────────────────────

const chrome = await import("../../thincoder-desktop/renderer/views/chrome.mjs")
const dispatch = await import("../../thincoder-desktop/renderer/frame-dispatch.mjs")

test("T2 模块面：`views/chrome.mjs` 导出集锁 ∧ `mount-head.mjs` 退役 ∧ `FRAME_FACES` = 五面 ∧ 无 `HEAD_KEYS`", () => {
  assert.deepEqual(
    Object.keys(chrome).sort(),
    ["BADGE_WORD", "busyOf", "mountStatus", "statusModel", "statusTree", "suspActiveOf"],
    "导出集 = 留守锁集")
  for (const gone of ["headModel", "headTree", "mountHead", "syncHead", "sessionMetaOf"]) {
    assert.equal(gone in chrome, false, `头族导出退场：${gone}`)
  }
  assert.equal(chrome.BADGE_WORD.running, "sub.running", "留守面：BADGE_WORD")
  assert.equal(chrome.busyOf({ tabBadges: { s: ["running"] } }, "s"), true, "留守面：busyOf")
  assert.equal(chrome.suspActiveOf({ susp: { s: { active: true } } }, "s"), true, "留守面：suspActiveOf")
  assert.equal(existsSync(`${ROOT}thincoder-desktop/renderer/mount-head.mjs`), false, "`mount-head.mjs` 已删（退役）")
  assert.deepEqual(dispatch.FRAME_FACES.map(([name]) => name), ["sessionBar", "status", "chat", "pool", "cards"], "五面表")
  assert.equal("HEAD_KEYS" in dispatch, false, "`HEAD_KEYS` 导出退场")
  out("chrome.mjs 导出集", Object.keys(chrome).sort().join(" · "))
  out("FRAME_FACES", dispatch.FRAME_FACES.map(([name]) => name).join(" → "))
})

// ─── T3 词键（两语退场 ∕ 余键零动）──────────────────────────────────────────

test("T3 词键：源面 `head.field.*` 零命中 ∧ 两语零 `head.` 键 ∧ 计数差 = −3", async () => {
  const src = read("thincoder-desktop/renderer/i18n.mjs")
  assert.equal((src.match(/head\.field\./g) ?? []).length, 0, "源面 `head.field.` 零命中")
  const { HOST_DICT } = await import("../../thincoder-desktop/renderer/i18n.mjs")
  const en = Object.keys(HOST_DICT.en)
  const zh = Object.keys(HOST_DICT.zh)
  assert.deepEqual(en.filter((key) => key.startsWith("head.")), [], "en 零 `head.` 键")
  assert.deepEqual(zh.filter((key) => key.startsWith("head.")), [], "zh 零 `head.` 键")
  assert.equal(en.length, zh.length, "两语键集同数")
  // 计数锁：修前实读 295（2026-09-29）⇒ 修后 295 − 3 = 292；他批并发增键时读数须重核（批内件随批留存，复跑先复核）。
  assert.equal(en.length, 292, "计数差 = −3（295 ⇒ 292）")
  const at = en.indexOf("wizard.save")
  assert.ok(at >= 0, "锚键 `wizard.save` 在场")
  assert.deepEqual(en.slice(at + 1, at + 4), ["effort.auto", "effort.off", "status.usage"], "删位邻位对拍（余键零动）")
  out("HOST_DICT 键数 en/zh", `${en.length} / ${zh.length}（修前 295 —— 差 −3）`)
})

// ─── T4 写路存续（「撤面不丢能力」机检腿 · stub 窄桥）────────────────────────

test("T4 写路存续：`selectModel` ⇒ `session:prefs { model, provider }`；`selectReasoning` ⇒ `{ effort }`", async () => {
  const { createComposerWire } = await import("../../thincoder-desktop/renderer/composer-wire.mjs")
  const { effortOf } = await import("../../thincoder-desktop/renderer/composer-sync.mjs")
  const calls = []
  const wire = createComposerWire({
    store: { get: () => ({ activeSession: "s1", sessionMeta: null }), set: () => {} },
    activeKey: () => "s1",
    call: async (channel, payload) => {
      calls.push({ channel, payload })
      return { ok: true, meta: { provider: "p1", model: "m1", effort: "off" } }
    },
    push: () => {}, panelOf: () => null, repaint: () => {}, onLoadingReset: () => {},
    toImages: (images) => images ?? [], degradedCode: () => null, effortOf,
    withUserBlock: (state) => state, setAttachDegraded: (state) => state, applyFlags: (state) => state,
    openSettings: () => {},
  })
  const settle = () => new Promise((resolve) => setTimeout(resolve, 5))
  wire.post("selectModel", { model: "m1", provider: "p1" })
  await settle()
  assert.deepEqual(calls.at(-1), { channel: "session:prefs", payload: { key: "s1", patch: { model: "m1", provider: "p1" } } },
    "selectModel ⇒ 双键同送")
  wire.post("selectReasoning", { reasoning: "none" })
  await settle()
  assert.deepEqual(calls.at(-1), { channel: "session:prefs", payload: { key: "s1", patch: { effort: "off" } } },
    "selectReasoning：none ⇒ off")
  wire.post("selectReasoning", { reasoning: "" })
  await settle()
  assert.deepEqual(calls.at(-1).payload.patch, { effort: "auto" }, "selectReasoning：\"\" ⇒ auto")
  out("写路读数", "selectModel ⇒ { model, provider } · selectReasoning ⇒ { effort }（none ⇒ off ∕ \"\" ⇒ auto）")
})

// ─── T5 ② 规则锁（`chat.css` 源面）──────────────────────────────────────────

test("T5 头行色：段级四值（name ∕ args ∕ status 两态 ∕ time）+ 整行裸规则三形零残留", () => {
  const css = read("thincoder-desktop/renderer/chat.css")
  const ruleBody = (selector) => {
    const at = css.indexOf(selector)
    assert.ok(at >= 0, `规则在场：${selector}`)
    const open = css.indexOf("{", at)
    const close = css.indexOf("}", open)
    return css.slice(open + 1, close)
  }
  const name = ruleBody('.tool-head [data-seg="name"]')
  assert.ok(name.includes("color: var(--accent)"), "name ⇒ accent")
  assert.ok(name.includes("font-weight: 600"), "name 字重 600 存续")
  const args = ruleBody('.tool-head [data-seg="args"]')
  assert.ok(args.includes("color: var(--fg)"), "args ⇒ fg")
  const failed = ruleBody('.tool-head[data-status="error"] [data-seg="status"]')
  assert.ok(failed.includes("#f14c4c"), "error 归 status 段 ⇒ #f14c4c")
  const done = ruleBody('.tool-head[data-status="done"] [data-seg="status"]')
  assert.ok(done.includes("#4ec9b0"), "done 归 status 段 ⇒ #4ec9b0")
  const time = ruleBody('.tool-head [data-seg="time"]')
  assert.ok(time.includes("11px") && time.includes("opacity: 0.6"), "time ⇒ 11px ∕ .6")
  assert.equal((css.match(/\.tool-head\[data-status="(?:error|done|running)"\]\s*\{/g) ?? []).length, 0,
    "整行裸规则三形零残留")
  out("chat.css 头行色", "name=accent · args=fg · status 两态段级 · time=11px/.6 · 整行裸规则 = 0")
})
