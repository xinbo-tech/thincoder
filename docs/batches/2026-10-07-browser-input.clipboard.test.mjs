/**
 * 2026-10-07-browser-input.clipboard.test.mjs — 批内件单测·剪贴板 / 门面面（T23–T26 · 实施轮 · 先红后绿）。
 * 判据表 = 批档 `docs/batches/2026-10-07-browser-input.md` §2 ∥ 设计档 `docs/core/design/BROWSER-TOOL.md`
 * §7（T23–T26）∥ §8（U41–U51）；机制单源 = 设计档 §3.1（门面表）∥ §3.5（剪贴板面）∥ §2.2（校验枚举）。
 * 拆位由来 = 单测档破 500 硬限（设计档 §5：输入面 T16–T22 ∥ 剪贴板 / 门面 T23–T26）。
 * 跑法（仓根 `thincoder/`）：node --test docs/batches/2026-10-07-browser-input.clipboard.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { CLIPBOARD_MAX_CHARS, acceleratorSequence } from "../../thincoder-core/browser/clipboard.mjs"
import { parseTargetSpec, pressSequence, resolveKey, TOUCH_TAP_GAP_MS } from "../../thincoder-core/browser/input.mjs"
import { browserTool } from "../../thincoder-core/tools/browser.mjs"
import { CORE, callsOf, downKey, fakePage, installFake, keyEvents, run, withPage } from "./2026-10-07-browser-input.harness.mjs"

// ── T23 剪贴板四操作 ∥ 授权序列（F-BT15 / U41–U44）──────────────────────────
test("T23 clipboard：write / read / copy / paste + 授权序列（U41–U44）", async () => {
  await withPage(fakePage({}), async (fix) => {
    await run("navigate", { url: "http://a.test/" })
    fix.calls.length = 0
    const wr = await run("clipboard", { op: "write", text: "hello" })
    assert.equal(wr, "[clipboard] write ← 5 chars")
    assert.ok(!wr.includes("hello"), "write 回执不回显文本（N-BT9）")
    const perms = callsOf(fix, "Browser.setPermission").map((c) => c.params)
    assert.deepEqual(perms.map((p) => p.permission.name), ["clipboard-read", "clipboard-write"], "描述符名（PermissionType 名被拒——实测在案）")
    assert.deepEqual([perms[0].setting, perms[0].origin], ["granted", "http://a.test"])
    assert.match(String(callsOf(fix, "Runtime.evaluate").map((c) => c.params.expression).join(" ")), /thincoder-browser:clipboard-write/)

    // read：正文 + 字符数；同 origin 授权缓存（不再重授）
    fix.calls.length = 0
    assert.equal(await run("clipboard", { op: "read" }), "[clipboard] read (11 chars)\nhello world")
    assert.equal(callsOf(fix, "Browser.setPermission").length, 0, "会话内按 origin 缓存")

    // copy / paste：聚焦 + 平台加速键（win32/linux ⇒ Ctrl）
    fix.calls.length = 0
    assert.equal(await run("clipboard", { op: "copy", ref: "e2" }), '[clipboard] copy → e2 "Name"')
    const ks = keyEvents(fix)
    assert.deepEqual(ks.map((p) => [p.key, p.type, p.modifiers]), [["Control", "rawKeyDown", 2], ["c", "rawKeyDown", 2], ["c", "keyUp", 2], ["Control", "keyUp", 0]])
    fix.calls.length = 0
    assert.equal(await run("clipboard", { op: "paste", ref: "e2" }), '[clipboard] paste → e2 "Name"')
    assert.equal(keyEvents(fix).some((p) => p.key === "v"), true)

    // darwin 分支 ⇒ Meta（平台分支——§3.5）
    assert.deepEqual(acceleratorSequence("copy", "darwin").map((c) => c.params.key), ["Meta", "c", "c", "Meta"])
    assert.equal(acceleratorSequence("paste", "darwin").filter((c) => c.params.key === "v")[0].params.modifiers, 4)
  })

  // 回落链：setPermission 拒 ⇒ grantPermissions；两者皆败 ⇒ 明示错（不静默降级）
  await withPage(fakePage({ setPermission: "fail", clipboardText: "x" }), async (fix2) => {
    await run("navigate", { url: "http://a.test/" })
    fix2.calls.length = 0
    assert.equal(await run("clipboard", { op: "read" }), "[clipboard] read (1 chars)\nx")
    assert.equal(callsOf(fix2, "Browser.grantPermissions").length, 1)
    assert.deepEqual(callsOf(fix2, "Browser.grantPermissions")[0].params.permissions, ["clipboardReadWrite", "clipboardSanitizedWrite"])
  })
  await withPage(fakePage({ setPermission: "fail", grantPermissions: "fail" }), async (fix3) => {
    await run("navigate", { url: "http://a.test/" })
    const r = await run("clipboard", { op: "write", text: "z" })
    assert.match(r, /^Error: clipboard permission failed — /)
    assert.equal(callsOf(fix3, "Runtime.evaluate").some((c) => String(c.params.expression).includes("clipboard-write")), false, "授权失败不执行")
  })

  // 无头焦点模拟：hasFocus=false ⇒ 一次性开（会话内缓存）
  await withPage(fakePage({ hasFocus: false }), async (fix4) => {
    await run("navigate", { url: "http://a.test/" })
    assert.equal(await run("clipboard", { op: "write", text: "a" }), "[clipboard] write ← 1 chars")
    await run("clipboard", { op: "read" })
    assert.equal(callsOf(fix4, "Emulation.setFocusEmulationEnabled").length, 1, "会话内一次性")
    assert.equal(callsOf(fix4, "Emulation.setFocusEmulationEnabled")[0].params.enabled, true)
  })
})

// ── T24 剪贴板隐私面（N-BT9 / U46）──────────────────────────────────────────
test("T24 隐私：read 上限截断 ∥ 无落盘路径 ∥ 全量过门（N-BT9/U46）", async () => {
  await withPage(fakePage({ clipboardText: "x".repeat(8100) }), async (fix) => {
    await run("navigate", { url: "http://a.test/" })
    const r = await run("clipboard", { op: "read" })
    assert.match(r, /^\[clipboard\] read \(8100 chars\)\n/)
    assert.match(r, new RegExp(`\\[\\.\\.\\. truncated: 100 chars omitted — clipboard reads are capped at ${CLIPBOARD_MAX_CHARS} chars\\]`))
    assert.equal(r.split("\n")[1].length, 8000, "正文受 8000 字符上限")
  })
  const src = readFileSync(join(CORE, "browser", "clipboard.mjs"), "utf8")
  assert.ok(!src.includes("node:fs") && !src.includes("writeFileSync"), "剪贴板内容不落盘（本档零 fs 面）")
  for (const op of ["read", "write", "copy", "paste"]) {
    assert.equal(browserTool.isReadonlyAction({ action: "clipboard", op }), false, op)
  }
})

// ── T25 门面分类逐动作全表（N-BT7 / §3.1；旧八动作零变）─────────────────────
test("T25 isReadonlyAction：十六动作 + touch 四手势 + clipboard 四操作全表（N-BT7）", () => {
  const f = browserTool.isReadonlyAction
  for (const action of ["navigate", "snapshot", "type", "wait", "screenshot", "close", "hover", "wheel", "insert"]) {
    assert.equal(f({ action }), true, action)
  }
  for (const action of ["click", "evaluate", "press", "mouse", "drag"]) {
    assert.equal(f({ action }), false, action)
  }
  for (const gesture of ["tap", "doubleTap"]) assert.equal(f({ action: "touch", gesture }), false, gesture)
  for (const gesture of ["swipe", "pinch"]) assert.equal(f({ action: "touch", gesture }), true, gesture)
  assert.equal(f({ action: "touch" }), false, "gesture 缺省 = tap ⇒ 过门")
  for (const op of ["read", "write", "copy", "paste"]) assert.equal(f({ action: "clipboard", op }), false, op)
  assert.equal(browserTool.readonly, false, "非工具级只读（钩子接管分类——KD-2）")
})

// ── T26 参数校验（U21/U28/U33/U45 族——§2.2 校验枚举逐句）────────────────────
test("T26 参数校验：新动作校验句逐字 ∥ 未知键 / 手势 / 操作 ⇒ 不执行（U28/U33/U45）", async () => {
  const eq = async (action, args, expected) => assert.equal(await run(action, args), expected, `${action} ${JSON.stringify(args)}`)
  await eq("press", {}, "Error: press requires key")
  await eq("hover", {}, "Error: hover requires ref or x,y")
  await eq("mouse", {}, "Error: mouse requires ref or x,y")
  await eq("wheel", {}, "Error: wheel requires deltaX or deltaY")
  await eq("wheel", { deltaX: 0, deltaY: 0 }, "Error: wheel requires deltaX or deltaY")
  await eq("drag", {}, "Error: drag requires from and to")
  await eq("drag", { from: "e1", to: "junk" }, 'Error: drag to must be an element ref (e<N>) or "x,y"')
  await eq("insert", {}, "Error: insert requires text")
  await eq("clipboard", {}, "Error: clipboard requires op")
  await eq("clipboard", { op: "write" }, "Error: clipboard write requires text")
  await eq("touch", {}, "Error: touch requires ref or x,y")
  await eq("touch", { gesture: "swipe" }, "Error: touch requires from and to")
  await eq("touch", { gesture: "swipe", from: "e1", to: "zz" }, 'Error: touch to must be an element ref (e<N>) or "x,y"')
  await eq("touch", { gesture: "pinch", ref: "e1" }, "Error: touch requires ref or x,y and scale")
  await eq("touch", { gesture: "pinch", scale: 2 }, "Error: touch requires ref or x,y and scale")
  await eq("touch", { gesture: "flick", ref: "e1" }, 'Error: unknown touch gesture "flick" — gestures: tap, doubleTap, swipe, pinch')
  await eq("hover", { ref: "e1", x: 1, y: 2 }, "Error: hover requires exactly one of ref or x,y")
  await eq("wheel", { ref: "e1", x: 1, y: 2, deltaY: 10 }, "Error: wheel requires exactly one of ref or x,y")
  await eq("touch", { ref: "e1", x: 1, y: 2 }, "Error: touch requires exactly one of ref or x,y")
  await eq("clipboard", { op: "peek" }, 'Error: unknown clipboard op "peek" — ops: read, write, copy, paste')

  // 未知键：未起会话先拒（不执行——U28）
  const fix = installFake(fakePage({}))
  try {
    const r = await run("press", { key: "Foo" })
    assert.match(r, /^Error: unknown key "Foo" — keys: Enter, Escape, Tab, /)
    assert.match(r, /Alt, Control, Meta, Shift — or a single US-layout character/)
    assert.equal(fix.opened.length, 0, "未知键不开会话")
    const mod = await run("press", { key: "a", modifiers: ["Ctrl"] })
    assert.match(mod, /^Error: unknown modifier "Ctrl" — modifiers: Alt, Control, Meta, Shift$/)
    assert.equal(fix.opened.length, 0)
  } finally { await fix.restore() }

  // 引擎直调（纯函数面）：目标形解析 + 键解析
  assert.deepEqual(parseTargetSpec("e12"), { kind: "ref", ref: "e12" })
  assert.deepEqual(parseTargetSpec("10, -20.5"), { kind: "point", x: 10, y: -20.5 })
  assert.equal(parseTargetSpec("garbage"), null)
  assert.equal(parseTargetSpec(""), null)
  assert.equal(resolveKey("Space").key, " ")
  assert.equal(resolveKey("F12").vk, 123)
  assert.throws(() => resolveKey("CapsLock"), /^Error: unknown key "CapsLock"/)
  const seq = pressSequence({ key: "a", modifiers: ["shift"] })
  assert.equal(seq.combo, "Shift+a")
  assert.equal(seq.commands.filter((c) => downKey(c.params))[1].params.key, "A", "显式 Shift ⇒ 产出移位形")
})
