/**
 * history-page.test.mjs — `history:page` 读面（批档 §2.4 U93/U94）。
 * 纪律：真槽文件（共享沙箱 `useSlotSandbox`：tmp sessions 根 + tmp cwd）+ 核窗口单源转口 ⇒
 * **零网 / 零 electron / 零用户目录**（沙箱缝 = 核 `_setSessionsDirForTest`，本档零副本）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadConfig } from "@thincoder/core/config.mjs"
import { _resetConfigPathForTest, _setConfigPathForTest } from "@thincoder/core/config-io.mjs"
import { sessionReading } from "@thincoder/core/session.mjs"
import { pageHistory, slotPath } from "../src/main/session-slots.mjs"
import { useSlotSandbox } from "./slot-sandbox.mjs"

const SRC = readFileSync(new URL("../src/main/session-slots.mjs", import.meta.url), "utf8")
const u = (i) => ({ role: "user", content: `u${i}` })

/** 写槽档（核形：`version` 2 + `cwd` 匹配 + `history` 数组）。 */
function writeSlot(cwd, slot, data) {
  writeFileSync(slotPath(cwd, slot), JSON.stringify({ version: 2, cwd, history: [], ...data }))
}

// ─── U93 页游 + 元信息 + 窗口单源 ──────────────────────────────

test("U93: 页游（尾 / 中 / 首 / 空历史 / 零消息页）· next = 页首全局 idx · meta 只落非空", () => {
  const s = useSlotSandbox()
  try {
    writeSlot(s.cwd, 1, { history: Array.from({ length: 450 }, (_, i) => u(i)) })
    const tail = pageHistory(s.cwd, { key: "1" })
    assert.equal(tail.ok, true)
    assert.equal(tail.messages.length, 200, "尾页页尺 = 核常量（200）")
    assert.equal(tail.messages[0].idx, 250, "尾页首条 = 250（全局 idx）")
    assert.equal(tail.messages.at(-1).idx, 449)
    assert.equal(tail.hasOlder, true)
    assert.equal(tail.next, 250, "next = 页首全局 idx（更旧一页的 before）")
    const mid = pageHistory(s.cwd, { key: "1", before: 250 })
    assert.equal(mid.messages.length, 200)
    assert.equal(mid.messages[0].idx, 50)
    assert.equal(mid.hasOlder, true)
    assert.equal(mid.next, 50)
    const first = pageHistory(s.cwd, { key: "1", before: 50 })
    assert.equal(first.messages.length, 50)
    assert.equal(first.messages[0].idx, 0)
    assert.equal(first.hasOlder, false)
    assert.equal(first.next, null, "无更旧 ⇒ next = null")
    for (const pg of [tail, mid, first]) {
      assert.equal(pg.next, pg.hasOlder ? pg.messages[0].idx : null, "next 恒 = 页首全局 idx（三页同式）")
    }
    writeSlot(s.cwd, 2, { history: [] })
    const emptyPage = pageHistory(s.cwd, { key: "2" })
    assert.equal(emptyPage.ok, true)
    assert.deepEqual(emptyPage.messages, [])
    assert.equal(emptyPage.hasOlder, false, "空历史 ⇒ 无更旧（核窗口零页短路）")
    assert.equal(emptyPage.next, null)
    writeSlot(s.cwd, 3, { history: [...Array.from({ length: 50 }, (_, i) => u(i)), ...Array.from({ length: 200 }, () => ({ role: "user", content: "" }))] })
    const zero = pageHistory(s.cwd, { key: "3" })
    assert.deepEqual(zero.messages, [], "页内条目全不可视 ⇒ 零消息页（非错误）")
    assert.equal(zero.hasOlder, true)
    assert.equal(zero.next, 50, "零消息页仍推进游标（next > 0 —— 否则前端卡死在页首）")
    writeSlot(s.cwd, 4, { history: [u(0)], activeProvider: "p1", activeModel: "m1", engineering: true, autoApprove: true })
    assert.deepEqual(pageHistory(s.cwd, { key: "4" }).meta, { provider: "p1", model: "m1" },
      "meta 三值命中面（会话头三值 —— 两模式位随状态栏对齐批撤出本投影）")
    assert.deepEqual(pageHistory(s.cwd, { key: "4" }).flags,
      { planMode: false, autoApprove: true, advisorGuard: false, engineering: true },
      "flags = 槽投影四布尔（合并口径兜底面 —— 活值优先面住宿主转口；状态栏对齐批）")
    writeSlot(s.cwd, 5, { history: [u(0)], activeProvider: "", activeModel: "  ", engineering: false, autoApprove: false })
    assert.deepEqual(pageHistory(s.cwd, { key: "5" }).meta, {}, "非串 / 空串 ⇒ 零节点（两布尔槽不再入 meta）")
    assert.deepEqual(pageHistory(s.cwd, { key: "5" }).flags,
      { planMode: false, autoApprove: false, advisorGuard: false, engineering: false },
      "flags 四布尔恒齐（假值照出 —— 零节点判据归显示面，字段缺 / 假同落 false）")
    writeSlot(s.cwd, 6, { history: [u(0)] })
    assert.deepEqual(pageHistory(s.cwd, { key: "6" }).meta, {}, "键缺（老槽）⇒ 零节点（不猜形——UI.md §1 会话头行）；`effort` 不回落配置面")
    assert.deepEqual(pageHistory(s.cwd, { key: "6" }).flags,
      { planMode: false, autoApprove: false, advisorGuard: false, engineering: false }, "老槽缺键 ⇒ 四布尔全假（禁假造）")
    assert.deepEqual(pageHistory(s.cwd, { key: "4", before: 0 }).flags,
      pageHistory(s.cwd, { key: "4" }).flags, "回填读同携 `flags`（与 `seed` 的首屏限定异）")
    // 源面：窗口切分与页尺**单源在核**（端层零副本 —— 自算切片 = 第二口径）
    const body = SRC.slice(SRC.indexOf("export function pageHistory"))
    assert.ok(!/\.slice\(/.test(body), "pageHistory 零自算切片（窗口单源）")
    assert.ok(!/\b200\b/.test(body), "pageHistory 零页尺字面量（页尺 = 核常量）")
    assert.ok(/import \{ HISTORY_PAGE_SIZE, historyWindow \} from "@thincoder\/core\/history-window\.mjs"/.test(SRC), "转口自核档（单源可机检）")
  } finally {
    s.cleanup()
  }
})

// ─── U94 读面 fail-soft ────────────────────────────────────────
test("U94: 读面 fail-soft（坏键 / 槽缺 / 异项目 / 坏档 / 新版档 —— 不抛 · 只出 {ok,reason}）", () => {
  const s = useSlotSandbox()
  try {
    writeSlot(s.cwd, 9, { history: [u(0)] })
    const bad = (r, reason) => {
      assert.deepEqual(Object.keys(r).sort(), ["ok", "reason"], "只出 {ok,reason}（零外泄键）")
      assert.equal(r.ok, false)
      assert.equal(r.reason, reason)
    }
    assert.equal(pageHistory(s.cwd, { key: "9" }).ok, true, "正例在场（防假红）")
    bad(pageHistory(s.cwd, { key: "nope" }), "bad-key")
    bad(pageHistory(s.cwd, { key: 3 }), "bad-key")
    bad(pageHistory(s.cwd, {}), "bad-key")
    bad(pageHistory(s.cwd, undefined), "bad-key")
    bad(pageHistory(s.cwd, { key: "4" }), "slot-missing")
    writeFileSync(slotPath(s.cwd, 5), JSON.stringify({ version: 2, cwd: "/other-project", history: [u(0)] }))
    bad(pageHistory(s.cwd, { key: "5" }), "slot-missing")
    assert.ok(existsSync(slotPath(s.cwd, 5)), "异项目档不动（cwd 先行 —— 零改名零改档）")
    writeFileSync(slotPath(s.cwd, 6), "{not json")
    bad(pageHistory(s.cwd, { key: "6" }), "slot-missing")
    writeFileSync(slotPath(s.cwd, 7), JSON.stringify({ version: 9, cwd: s.cwd, history: [u(0)] }))
    bad(pageHistory(s.cwd, { key: "7" }), "slot-missing")
    assert.ok(existsSync(slotPath(s.cwd, 7)), "新版档保留原样（不降级读）")
    writeFileSync(slotPath(s.cwd, 8), JSON.stringify({ version: 2, cwd: s.cwd, history: {} }))
    bad(pageHistory(s.cwd, { key: "8" }), "slot-missing")
  } finally {
    s.cleanup()
  }
})

// ─── U175 打开态播种面（`seed` · D17 · `docs/desktop/design/IPC.md` §2「打开态播种注」）────────

/** 配置沙箱（读数单源 = 核 `loadConfig` → `providersList` / `provider`）：渠道两枚窄窗（1K / 4K）
 *  + 默认模型指向 p2 ⇒「槽命中 p1」与「回退 p2」两口径读数可分辨（装配入参有牙）。 */
function seedConfigSandbox(t) {
  const dir = mkdtempSync(join(tmpdir(), "tc-desktop-seed-"))
  const path = join(dir, "config.json")
  _setConfigPathForTest(path)
  t.after(() => { _resetConfigPathForTest(); rmSync(dir, { recursive: true, force: true }) })
  return path
}

test("U175: seed —— tasks 直取（非数组 ⇒ []）· usage 有效门（> 0 才在场）· 回填不携 · 坏配置降级", (t) => {
  const s = useSlotSandbox(t)
  const cfgPath = seedConfigSandbox(t)
  const config = { providers: [{ name: "p1", model: "m1", context: 1 }, { name: "p2", model: "m2", context: 4 }], defaultModel: "p2:m2" }
  writeFileSync(cfgPath, JSON.stringify(config))

  const long = (i) => ({ role: "user", content: `u${i} `.repeat(200) })
  const tasks = [{ id: 1, text: "A", status: "done" }, { id: 2, text: "B", status: "pending" }]
  const slot = { history: [long(0), { role: "assistant", content: "ok", reasoning_content: "r" }], tasks, activeProvider: "p1", activeModel: "m1" }
  writeSlot(s.cwd, 1, slot)

  const first = pageHistory(s.cwd, { key: "1" })
  assert.deepEqual(Object.keys(first).sort(), ["flags", "hasOlder", "messages", "meta", "next", "ok", "seed"], "首屏回执含 `seed` + `flags`（既有键集不动）")
  assert.deepEqual(first.seed.tasks, tasks, "tasks = 槽数据直取（逐字）")
  assert.equal(first.seed.usage, sessionReading(slot, { providers: loadConfig().providersList, fallback: loadConfig().provider }), "usage = 核 `sessionReading`（装配入参 = `loadConfig()` 两值）")
  assert.ok(first.seed.usage > 0, "有效门正臂：读数 > 0 才在场")
  assert.notEqual(first.seed.usage, sessionReading(slot, { providers: [], fallback: loadConfig().provider }), "槽渠道命中（≠ 回退口径 ⇒ 入参两值有牙）")

  // 负臂：空史（读数 0）· tasks 缺键 / 非数组
  writeSlot(s.cwd, 2, { history: [] })
  assert.deepEqual(pageHistory(s.cwd, { key: "2" }).seed, { tasks: [] }, "空史 ⇒ usage 键缺席（0 不落）· tasks 缺 ⇒ []（沿核水合口径）")
  writeSlot(s.cwd, 3, { history: [], tasks: "nope" })
  assert.deepEqual(pageHistory(s.cwd, { key: "3" }).seed.tasks, [], "非数组 ⇒ []（沿 `data.tasks ?? []`）")

  // 回填读不携（防以盘上旧值覆盖活切片）
  writeSlot(s.cwd, 4, { history: [long(0), long(1), { role: "assistant", content: "ok" }], tasks, activeProvider: "p1" })
  const back = pageHistory(s.cwd, { key: "4", before: 1 })
  assert.equal("seed" in back, false, "回填读（`before != null`）⇒ 回执无 `seed` 键")
  assert.ok("seed" in pageHistory(s.cwd, { key: "4" }), "首屏读同槽在场（对照臂）")

  // 配置不可读 ⇒ `usage` 键缺席 + `console.error`（零静默；读面 fail-soft）
  const logged = []
  const original = console.error
  console.error = (...args) => logged.push(args.map((part) => String(part)).join(" "))
  t.after(() => { console.error = original })
  writeFileSync(cfgPath, "{not json")
  const bad = pageHistory(s.cwd, { key: "1" })
  assert.equal(bad.ok, true, "读面保持 fail-soft（ok 真）")
  assert.deepEqual(bad.seed, { tasks }, "坏配置 ⇒ usage 缺席 · tasks 照出")
  assert.ok(logged.some((line) => line.includes("opening reading unavailable")), "console.error 在场（不静默）")
})
