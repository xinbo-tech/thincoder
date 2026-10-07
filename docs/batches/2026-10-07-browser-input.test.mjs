/**
 * 2026-10-07-browser-input.test.mjs — 批内件单测·输入面（T16–T22 · 实施轮 · 先红后绿）。
 * 判据表 = 批档 `docs/batches/2026-10-07-browser-input.md` §2 ∥ 设计档 `docs/core/design/BROWSER-TOOL.md`
 * §7（T16–T22）∥ §8（U24–U40）；机制单源 = 设计档 §2.2（动作契约）∥ §2.7（输入基建）∥ §2.8（键面）。
 * 测试台（假传输 ∥ 假页 ∥ 装缝）= `docs/batches/2026-10-07-browser-input.harness.mjs`（拆位见设计档 §5）。
 * 跑法（仓根 `thincoder/`）：node --test docs/batches/2026-10-07-browser-input.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { BROWSER_ACTIONS, browserTool } from "../../thincoder-core/tools/browser.mjs"
import { CORE, callsOf, downKey, fakePage, keyEvents, mouseEvents, run, withPage } from "./2026-10-07-browser-input.harness.mjs"
import { TOUCH_TAP_GAP_MS } from "../../thincoder-core/browser/input.mjs"

// ── T16 schema ∥ 结构面（F-BT9 面 ∥ §5 DAG）──────────────────────────────────
test("T16 schema：十六动作枚举 + 新参数面 + 动作模块不 import session（§2.1/§5）", () => {
  assert.deepEqual(BROWSER_ACTIONS, [
    "navigate", "snapshot", "click", "type", "evaluate", "wait", "screenshot", "close",
    "press", "hover", "wheel", "mouse", "drag", "touch", "insert", "clipboard",
  ])
  assert.deepEqual(browserTool.parameters.properties.action.enum, BROWSER_ACTIONS)
  const dict = {
    key: "string", phase: "string", button: "string", gesture: "string", op: "string", ime: "string",
    from: "string", to: "string", modifiers: "array", repeat: "number", x: "number", y: "number",
    double: "boolean", deltaX: "number", deltaY: "number", steps: "number", html5: "boolean", scale: "number",
  }
  for (const [key, type] of Object.entries(dict)) {
    assert.equal(browserTool.parameters.properties[key]?.type, type, `参数 ${key}`)
  }
  // DAG 单向（§5）：动作模块不 import session.mjs
  for (const f of ["actions", "input", "input-actions", "clipboard"]) {
    const src = readFileSync(join(CORE, "browser", `${f}.mjs`), "utf8")
    assert.ok(!/(?:import|from)\s*\(?["'][^"']*session\.mjs/.test(src), `${f}.mjs 不 import session.mjs`)
  }
})

// ── T17 键序列 ∥ 聚焦（F-BT9 / U25–U28 / U49）───────────────────────────────
test("T17 press：命名键 ∥ 字符 ∥ 修饰 ∥ down-up ∥ repeat ∥ 聚焦失败（U25–U27/U49）", async () => {
  await withPage(fakePage({}), async (fix) => {
    await run("navigate", { url: "http://a.test/" })

    // 命名键：Enter = keyDown(text \r) + keyUp
    assert.equal(await run("press", { key: "Enter" }), "[press] Enter")
    let ks = keyEvents(fix)
    assert.equal(ks.length, 2)
    assert.equal(ks[0].type, "keyDown")
    assert.equal(ks[0].code, "Enter")
    assert.equal(ks[0].windowsVirtualKeyCode, 13)
    assert.equal(ks[0].text, "\r")
    assert.equal(ks[1].type, "keyUp")

    fix.calls.length = 0
    assert.equal(await run("press", { key: "a" }), "[press] a")
    ks = keyEvents(fix)
    assert.deepEqual([ks[0].key, ks[0].code, ks[0].windowsVirtualKeyCode, ks[0].text, ks[0].modifiers], ["a", "KeyA", 65, "a", 0])

    fix.calls.length = 0
    assert.equal(await run("press", { key: "A" }), "[press] A")
    ks = keyEvents(fix)
    assert.deepEqual([ks[0].key, ks[0].text, ks[0].modifiers, ks[0].code], ["A", "A", 8, "KeyA"], "大写自动置 Shift 位")

    fix.calls.length = 0
    assert.equal(await run("press", { key: "!" }), "[press] !")
    ks = keyEvents(fix)
    assert.deepEqual([ks[0].key, ks[0].text, ks[0].modifiers, ks[0].code, ks[0].windowsVirtualKeyCode], ["!", "!", 8, "Digit1", 49])

    // 修饰组合：修饰按下 → 主键 → 主键抬起 → 修饰抬起（中间键面保持）
    fix.calls.length = 0
    assert.equal(await run("press", { key: "a", modifiers: ["Control"] }), "[press] Control+a")
    ks = keyEvents(fix)
    assert.equal(ks.length, 4)
    assert.deepEqual(ks.map((p) => [p.key, p.type]), [["Control", "rawKeyDown"], ["a", "rawKeyDown"], ["a", "keyUp"], ["Control", "keyUp"]])
    assert.deepEqual(ks.map((p) => p.modifiers), [2, 2, 2, 0], "修饰位逐事件演进")
    assert.ok(!("text" in ks[1]), "非 Shift 修饰 ⇒ 不发文本")

    // down / up 分离
    fix.calls.length = 0
    assert.equal(await run("press", { key: "x", phase: "down" }), "[press] x (down)")
    assert.equal(keyEvents(fix).length, 1)
    fix.calls.length = 0
    assert.equal(await run("press", { key: "x", phase: "up" }), "[press] x (up)")
    assert.deepEqual(keyEvents(fix).map((p) => p.type), ["keyUp"])

    // repeat：down + autoRepeat×3 + up
    fix.calls.length = 0
    assert.equal(await run("press", { key: "a", repeat: 3 }), "[press] a ×3")
    ks = keyEvents(fix)
    assert.equal(ks.length, 5)
    assert.deepEqual(ks.map((p) => p.autoRepeat === true), [false, true, true, true, false])

    // 携 ref：先聚焦 + 回执带目标
    fix.calls.length = 0
    assert.equal(await run("press", { key: "Enter", ref: "e3" }), '[press] Enter → e3 "Go"')
    assert.match(String(callsOf(fix, "Runtime.evaluate")[0].params.expression), /thincoder-browser:focus/)
    assert.equal(keyEvents(fix).length, 2)

    // U49：不可聚焦 ⇒ 拒（不静默错投；不发键）
    fix.page.focus = { found: true, focused: false }
    fix.calls.length = 0
    const bad = await run("press", { key: "Enter", ref: "e2" })
    assert.match(bad, /^Error: ref e2 "Name" is not focusable — keys would go to another element/)
    assert.equal(keyEvents(fix).length, 0)
  })
})

// ── T18 鼠标序列 ∥ wheel 参（U30–U32）────────────────────────────────────────
test("T18 mouse / wheel：序列逐形 + 参数面（U30–U32）", async () => {
  await withPage(fakePage({}), async (fix) => {
    await run("navigate", { url: "http://a.test/" })
    fix.calls.length = 0
    assert.equal(await run("mouse", { ref: "e3" }), '[mouse] left click e3 "Go"')
    let ms = mouseEvents(fix)
    assert.deepEqual(ms.map((p) => p.type), ["mouseMoved", "mousePressed", "mouseReleased"])
    assert.deepEqual([ms[1].button, ms[1].buttons, ms[1].clickCount], ["left", 1, 1])
    assert.deepEqual([ms[2].buttons, ms[2].clickCount], [0, 1])

    fix.calls.length = 0
    assert.equal(await run("mouse", { x: 10, y: 20, double: true }), "[mouse] left doubleClick 10,20")
    ms = mouseEvents(fix)
    assert.deepEqual(ms.filter((p) => p.type === "mousePressed").map((p) => p.clickCount), [1, 2], "clickCount 序列 1、2")
    assert.deepEqual(ms.filter((p) => p.type === "mouseReleased").map((p) => p.clickCount), [1, 2])

    fix.calls.length = 0
    assert.equal(await run("mouse", { x: 5, y: 6, button: "right", phase: "down" }), "[mouse] right down 5,6")
    ms = mouseEvents(fix)
    assert.deepEqual(ms.map((p) => p.type), ["mouseMoved", "mousePressed"])
    assert.deepEqual([ms[1].button, ms[1].buttons], ["right", 2])

    fix.calls.length = 0
    assert.equal(await run("mouse", { x: 5, y: 6, phase: "up" }), "[mouse] left up 5,6")
    assert.deepEqual(mouseEvents(fix).map((p) => p.type), ["mouseReleased"])

    // wheel：缺省落点 = 视口中心；回执 = 卷动后 window 读数
    fix.calls.length = 0
    assert.equal(await run("wheel", { deltaY: 600 }), "[wheel] Δ(0,600) at 720,450 — window (0,300)")
    const wheelParams = mouseEvents(fix).find((p) => p.type === "mouseWheel")
    assert.deepEqual([wheelParams.deltaX, wheelParams.deltaY, wheelParams.pointerType], [0, 600, "mouse"])
    fix.calls.length = 0
    assert.match(await run("wheel", { deltaX: 200, deltaY: 0, ref: "e1" }), /^\[wheel\] Δ\(200,0\) at 121,340 — window \(0,300\)$/, "回执坐标取整")
  })
})

// ── T19 坐标解析 ∥ 几何标记（F-BT14 / U47 / U48）────────────────────────────
test("T19 几何：geo/inViewport/[outside] ∥ point/focus 表达式（U47/U48）", async () => {
  const page = fakePage({
    elements: [
      { tag: "button", role: "button", name: "In", selector: "#in", disabled: false, geo: { x: 10, y: 20, w: 100, h: 30 }, inViewport: true },
      { tag: "button", role: "button", name: "Out", selector: "#out", disabled: false, geo: { x: 10, y: 3000, w: 100, h: 30 }, inViewport: false },
    ],
  })
  await withPage(page, async (fix) => {
    const snap = await run("snapshot")
    assert.match(snap, /^e1 button "In" \[new\]$/m, "在屏行零几何后缀（旧文法零动）")
    assert.match(snap, /^e2 button "Out" \[new\] \[outside\]$/m, "视口外 ⇒ [outside]")
    assert.match(await run("snapshot"), /^e1 button "In"$/m, "复用后亦无后缀")

    // ref 寻址 ⇒ pointExpression（滚动到视 + 中心点）驱动指针
    fix.calls.length = 0
    assert.equal(await run("hover", { ref: "e2" }), '[hover] e2 "Out"')
    assert.match(String(callsOf(fix, "Runtime.evaluate")[0].params.expression), /thincoder-browser:point/)
    assert.deepEqual(mouseEvents(fix)[0] && [mouseEvents(fix)[0].x, mouseEvents(fix)[0].y], [120.5, 340.25])

    // 坐标直读：不寻址、不滚动
    fix.calls.length = 0
    assert.equal(await run("hover", { x: 7, y: 8 }), "[hover] 7,8")
    assert.equal(callsOf(fix, "Runtime.evaluate").length, 0)
    assert.deepEqual([mouseEvents(fix)[0].x, mouseEvents(fix)[0].y], [7, 8])

    // ref 失效 ∥ tag 不一致 ⇒ 同 click stale 句式
    page.point = { found: false }
    const stale = await run("hover", { ref: "e1" })
    assert.match(stale, /^Error: ref e1 is stale \(was "In"\) — run snapshot again\n\[page\] /)
    page.point = { found: false, tag: "span" }
    assert.match(await run("hover", { ref: "e1" }), /^Error: ref e1 is stale/)
  })
})

// ── T20 drag（F-BT11 / U34 / U35）───────────────────────────────────────────
test("T20 drag：鼠标序列（按下→移动×steps→抬起）∥ html5 拦截链（U34/U35）", async () => {
  const page = fakePage({
    elements: [
      { tag: "div", role: "other", name: "Card", selector: "#card", disabled: false },
      { tag: "div", role: "other", name: "Slot", selector: "#slot", disabled: false },
    ],
    points: { "#card": { found: true, x: 50, y: 60 }, "#slot": { found: true, x: 500, y: 60 } },
  })
  await withPage(page, async (fix) => {
    await run("navigate", { url: "http://a.test/" }) // 引用表先立（drag 目标 = e1/e2）
    fix.calls.length = 0
    assert.equal(await run("drag", { from: "e1", to: "e2", steps: 3 }), '[drag] e1 "Card" → e2 "Slot"')
    let ms = mouseEvents(fix)
    assert.deepEqual(ms.map((p) => p.type), ["mouseMoved", "mousePressed", "mouseMoved", "mouseMoved", "mouseMoved", "mouseReleased"])
    assert.deepEqual([ms[1].x, ms[1].y, ms[1].buttons], [50, 60, 1])
    assert.deepEqual([ms[5].x, ms[5].y, ms[5].buttons], [500, 60, 0], "末步落于 to 后抬起")
    assert.ok(Math.abs(ms[3].x - 350) < 0.001, "中间步插值")

    // html5 分支：拦截链（setInterceptDrags → dragIntercepted → 三连 → 抬起 → 解除拦截）
    fix.calls.length = 0
    const r = await run("drag", { from: "#nope,0", to: "e2", html5: true })
    assert.match(r, /^Error: drag from must be an element ref \(e<N>\) or "x,y"$/m)
    fix.calls.length = 0
    assert.equal(await run("drag", { from: "10,20", to: "e2", html5: true }), '[drag] 10,20 → e2 "Slot" (html5)')
    const seq = fix.calls.map((c) => (c.method === "Input.dispatchDragEvent" ? `drag:${c.params.type}` : c.method))
    const interceptIdx = seq.indexOf("Input.setInterceptDrags")
    assert.ok(interceptIdx >= 0 && interceptIdx < seq.indexOf("Input.dispatchMouseEvent"), "先开拦截再驱动指针")
    assert.deepEqual(seq.filter((s) => s.startsWith("drag:")), ["drag:dragEnter", "drag:dragOver", "drag:drop"])
    assert.ok(seq.lastIndexOf("Input.dispatchMouseEvent") > seq.indexOf("drag:drop"), "drop 后抬起")
    assert.equal(callsOf(fix, "Input.setInterceptDrags").length, 2, "开 + 关")
    assert.equal(callsOf(fix, "Input.setInterceptDrags")[0].params.enabled, true)
    assert.equal(callsOf(fix, "Input.setInterceptDrags")[1].params.enabled, false)
    const drop = callsOf(fix, "Input.dispatchDragEvent").find((c) => c.params.type === "drop")
    assert.deepEqual(drop.params.data, page.dragData, "DragData 原样回投")

    // 无拦截事件 ⇒ 明示拒（不悬挂）
    page.dragEmitted = true // 已发射过 ⇒ 本轮不再发
    delete page.interceptArmed
    const failed = await run("drag", { from: "10,20", to: "e2", html5: true })
    assert.match(failed, /^Error: .*html5 drag was not intercepted/)
  })
})

// ── T21 触屏三手势（F-BT12 / U36–U38）───────────────────────────────────────
test("T21 touch：tap / doubleTap / pinch / swipe（U36–U38）", async () => {
  await withPage(fakePage({}), async (fix) => {
    await run("navigate", { url: "http://a.test/" })
    fix.calls.length = 0
    assert.equal(await run("touch", { gesture: "tap", ref: "e3" }), '[touch] tap e3 "Go"')
    let ts = callsOf(fix, "Input.dispatchTouchEvent").map((c) => c.params)
    assert.deepEqual(ts.map((t) => t.type), ["touchStart", "touchEnd"], "显式序列（全链 click——KD-14 收正）")
    assert.deepEqual(ts[0].touchPoints[0], { x: 121, y: 340, radiusX: 0.5, radiusY: 0.5, force: 0.5, id: 1 })

    fix.calls.length = 0
    const t0 = Date.now()
    assert.equal(await run("touch", { gesture: "doubleTap", x: 1, y: 2 }), "[touch] doubleTap 1,2")
    const elapsed = Date.now() - t0
    ts = callsOf(fix, "Input.dispatchTouchEvent").map((c) => c.params)
    assert.deepEqual(ts.map((t) => t.type), ["touchStart", "touchEnd", "touchStart", "touchEnd"], "两轮序列（双击计数由浏览器管）")
    assert.ok(elapsed >= TOUCH_TAP_GAP_MS - 10, `两轮间隔 ≥${TOUCH_TAP_GAP_MS}ms 量级（实测 ${elapsed}ms）`)

    fix.calls.length = 0
    assert.equal(await run("touch", { gesture: "pinch", x: 1, y: 2, scale: 2 }), "[touch] pinch ×2 at 1,2")
    assert.equal(callsOf(fix, "Input.synthesizePinchGesture")[0].params.scaleFactor, 2)

    fix.calls.length = 0
    assert.equal(await run("touch", { gesture: "pinch", ref: "e3", scale: 3 }), "[touch] pinch ×3 at 121,340", "携 ref 亦落坐标形（§2.2 模板）")

    fix.calls.length = 0
    assert.equal(await run("touch", { gesture: "swipe", from: "0,0", to: "0,200", steps: 2 }), "[touch] swipe 0,0 → 0,200")
    const touches = callsOf(fix, "Input.dispatchTouchEvent").map((c) => c.params)
    assert.deepEqual(touches.map((t) => t.type), ["touchStart", "touchMove", "touchMove", "touchEnd"])
    assert.deepEqual(touches[0].touchPoints[0], { x: 0, y: 0, radiusX: 0.5, radiusY: 0.5, force: 0.5, id: 1 })
    assert.deepEqual([touches[3].touchPoints[0].x, touches[3].touchPoints[0].y], [0, 200])
  })
})

// ── T22 insert ∥ IME（F-BT13 / U39 / U40）───────────────────────────────────
test("T22 insert：insertText ∥ ime 组合 + 提交（U39/U40）", async () => {
  await withPage(fakePage({}), async (fix) => {
    await run("navigate", { url: "http://a.test/" })
    fix.calls.length = 0
    assert.equal(await run("insert", { ref: "e2", text: "hello 😀" }), '[insert] e2 "Name" ← 8 chars')
    assert.deepEqual(callsOf(fix, "Input.insertText")[0].params, { text: "hello 😀" })
    assert.match(String(callsOf(fix, "Runtime.evaluate")[0].params.expression), /thincoder-browser:focus/)

    fix.calls.length = 0
    assert.equal(await run("insert", { text: "abc" }), "[insert] (focused) ← 3 chars")
    assert.equal(callsOf(fix, "Runtime.evaluate").length, 0, "无 ref ⇒ 不改焦点")

    fix.calls.length = 0
    assert.equal(await run("insert", { ref: "e2", text: "终文", ime: "zhong" }), '[insert] e2 "Name" ← 2 chars (ime)')
    assert.deepEqual(callsOf(fix, "Input.imeSetComposition")[0].params, { text: "zhong", selectionStart: 5, selectionEnd: 5 })
    const order = fix.calls.filter((c) => c.method.startsWith("Input.ime") || c.method === "Input.insertText").map((c) => c.method)
    assert.deepEqual(order, ["Input.imeSetComposition", "Input.insertText"], "先组合后提交")
  })
})
