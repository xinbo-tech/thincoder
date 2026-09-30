/**
 * 2026-09-29-structure-split-round.test.mjs — 越线档结构轮（台账 #536）批次本地件（结构不变量 + 缝实证）。
 * 腿集（设计 = 批档 `docs/batches/2026-09-29-structure-split-round.md` §2.8 测试面）：
 *   A 行数上界（拆后四档 ≤300 顾问线）· B 移动块逐字（纯移动：新档 ⊇ 原块 / 本档净差 = 保位注一行 /
 *   接线面迁出 + 缝面在场）· C 缝 identity（七名再出口 ≡ `session-wire.mjs` 直导出同引用 + `app.mjs` 零改）
 *   · D 零重复选择器（迁出族唯一定义面 = `session-list.css`，跨档零副本）· E 级联序（index.html 位次）。
 * 基线件 = 同目录 `2026-09-29-structure-split-round.baseline.json`（搬前冻结 —— 实施轮起手生成）。
 * 复跑（仓根）：
 *   node --import ./thincoder-desktop/test/rc-resolve.mjs --test .thincoder/tmp/2026-09-29-structure-split-round.test.mjs
 * （`/rc/` 解析钩子须预载 —— C 腿 dynamic import 渲染档；沿 wave-a 件先例。收位 = 父侧——跨批次档写门
 * ⇒ 本波住 `.thincoder/tmp/`。）
 */
import assert from "node:assert/strict"
import { test } from "node:test"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url)) // <仓根>/.thincoder/tmp
const root = join(here, "..", "..")
const rel = (p) => join(root, p)
const contentLines = (text) => {
  const parts = text.split("\n")
  if (parts.length && parts[parts.length - 1] === "") parts.pop()
  return parts
}
const lines = (p) => contentLines(readFileSync(rel(p), "utf8"))
const out = (label, value) => console.log(`[读数] ${label}: ${value}`)
const countIn = (text, tok) => (text.match(new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![A-Za-z0-9_-])", "g")) ?? []).length

const baseline = JSON.parse(readFileSync(rel("docs/batches/2026-09-29-structure-split-round.baseline.json"), "utf8"))
const CHROME = "thincoder-desktop/renderer/chrome.css"
const LIST = "thincoder-desktop/renderer/session-list.css"
const MOUNT = "thincoder-desktop/renderer/mount-sessions.mjs"
const WIRE = "thincoder-desktop/renderer/session-wire.mjs"
const SEVEN = ["activateSession", "backfill", "confirmRename", "createSession", "deleteSession", "refreshRail", "resumeOpened"]
const NINE = ["SESSION_SLOT", ...SEVEN, "mountSessionBar"]
const MOVED_TOKENS = [".session-dropdown", ".session-item", ".session-item-title", ".session-item-meta", ".session-item-badge", ".session-empty", ".session-ledger-notice", ".session-rename", ".session-delete", ".session-rename-input", ".session-cancel", ".session-confirm"]
const RETAINED_TOKENS = [".session-new", ".session-bar", ".session-arrow", ".auto-confirm"]

// ─── A 行数上界 ────────────────────────────────────────────────────────────

test("A 行数上界：拆后四档 ≤300（顾问线，内容行数口径）", () => {
  const readings = { [CHROME]: lines(CHROME).length, [LIST]: lines(LIST).length, [MOUNT]: lines(MOUNT).length, [WIRE]: lines(WIRE).length }
  for (const [file, n] of Object.entries(readings)) assert.ok(n <= 300, `${file} = ${n} 应 ≤300`)
  out("A 行数", Object.entries(readings).map(([f, n]) => `${f.split("/").pop()} ${n}`).join(" · "))
})

// ─── B 移动块逐字（纯移动） ────────────────────────────────────────────────

test("B1 迁出块逐字：session-list.css = 头注 + 块1 + 块2（原序 · 块间仅空行 · 块后零残余）", () => {
  const b1 = baseline.chrome.block1
  const b2 = baseline.chrome.block2
  const list = lines(LIST)
  const at1 = list.indexOf(b1[0])
  const at2 = list.indexOf(b2[0])
  assert.ok(at1 >= 0, "块1 首行在场")
  assert.ok(at2 >= 0, "块2 首行在场")
  assert.deepEqual(list.slice(at1, at1 + b1.length), b1, "块1 逐字（127 行）")
  assert.deepEqual(list.slice(at2, at2 + b2.length), b2, "块2 逐字（37 行）")
  assert.ok(at1 < at2, "原序（块1 在块2 前）")
  assert.ok(at1 <= 12, `块1 前 = 头注（读数 ${at1} 行 ≤12）`)
  assert.ok(list.slice(at1 + b1.length, at2).every((l) => l.trim() === ""), "块1 ∕ 块2 之间仅空行")
  assert.ok(list.slice(at2 + b2.length).every((l) => l.trim() === ""), "块2 后零残余")
  out("B1", `头注 ${at1} 行 · 块1 ${b1.length} 行 @ :${at1 + 1} · 块2 ${b2.length} 行 @ :${at2 + 1}`)
})

test("B2 本档净差 = 保位注一行（落原块1 切点位）：chrome.css = 原档 − 块1 − 块2 + 1 注行", () => {
  const expected = [...baseline.chrome.before, ...baseline.chrome.mid, ...baseline.chrome.after]
  const chrome = lines(CHROME)
  assert.equal(chrome.length, expected.length + 1, "净差 = +1（保位注）")
  const idx = chrome.findIndex((l, i) => l !== expected[i])
  assert.equal(idx, baseline.chrome.before.length, `注行落点 = 原块1 切点位（:${baseline.chrome.before.length + 1}）`)
  assert.deepEqual([...chrome.slice(0, idx), ...chrome.slice(idx + 1)], expected, "余行与原文逐行一致")
  out("B2", `注行 @ :${idx + 1} = ${JSON.stringify(chrome[idx].slice(0, 72))}… · 本档 ${chrome.length} 行`)
})

test("B3 接线面迁出逐字 + 缝面：session-wire.mjs ⊇ 原 :244-406；主档同段清零 / 留档面 / 再出口在场", () => {
  const b = baseline.mount.block
  const wire = lines(WIRE)
  const at = wire.indexOf(b[0])
  assert.ok(at >= 0, "块首行（会话族接线段注）在场")
  assert.deepEqual(wire.slice(at, at + b.length), b, "块逐字（163 行）")
  const mountText = lines(MOUNT).join("\n")
  assert.ok(!mountText.includes(b[0]), "主档该段清零（段注不在场）")
  assert.ok(!mountText.includes("function takeover("), "主档 takeover 清零")
  assert.ok(!mountText.includes("host.invoke("), "主档 host 调用清零")
  for (const s of ["export function mountSessionBar", "function wireFace", "function showDeleteConfirm", "export const SESSION_SLOT", "function submitRename", "function bindOutsideClose", "const FACE = new WeakMap()"]) {
    assert.ok(mountText.includes(s), `留档面在场：${s}`)
  }
  assert.ok(mountText.includes('from "./session-wire.mjs"'), "缝（同名再出口源）在场")
  for (const n of SEVEN) assert.match(mountText, new RegExp(`\\b${n}\\b`), `再出口名在场：${n}`)
  out("B3", `块 ${b.length} 行 @ ${WIRE.split("/").pop()}:${at + 1} · 主档 ${lines(MOUNT).length} 行 · 缝七名在场`)
})

// ─── C 缝 identity ────────────────────────────────────────────────────────

test("C 缝 identity：七名再出口 ≡ session-wire 直导出（同引用）+ app.mjs 九名零改", async () => {
  globalThis.thincoder = { invoke: async () => ({ ok: false }) } // 窄桥桩（模块级读取先于 —— 沿 wave-a 件先例）
  globalThis.document = { createElement: () => ({ id: "", className: "", classList: { add() {} }, appendChild() {} }), getElementById: () => null, body: { appendChild() {} } }
  const mountMod = await import(pathToFileURL(rel(MOUNT)).href)
  const wireMod = await import(pathToFileURL(rel(WIRE)).href)
  for (const n of SEVEN) assert.equal(mountMod[n], wireMod[n], `identity（同引用）：${n}`)
  for (const n of NINE) assert.ok(["function", "string"].includes(typeof mountMod[n]), `九名在场：${n}`)
  const app = lines("thincoder-desktop/renderer/app.mjs").join("\n")
  assert.ok(app.includes('} from "./mount-sessions.mjs"'), "app.mjs 导入面仍指主档（零改）")
  for (const n of NINE) assert.match(app, new RegExp(`\\b${n}\\b`), `app.mjs 消费名在场：${n}`)
  out("C", `七名 identity（同引用）✓ · 九名导出在场 ✓ · app.mjs 零改 ✓`)
})

// ─── D 零重复选择器 ────────────────────────────────────────────────────────

test("D 零重复选择器：迁出族唯一定义面 = session-list.css（跨档零副本）+ 留档族零动", () => {
  const chromeText = lines(CHROME).join("\n")
  const listText = lines(LIST).join("\n")
  const walkCss = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walkCss(join(dir, e.name)) : (e.name.endsWith(".css") ? [join(dir, e.name)] : []))
  const others = walkCss(rel("thincoder-desktop/renderer")).filter((f) => !f.endsWith("chrome.css") && !f.endsWith("session-list.css"))
  const othersText = others.map((f) => readFileSync(f, "utf8")).join("\n")
  const noComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, " ") // 规则面（剥注释）
  const moved = baseline.chrome.movedTokenCounts
  const retained = baseline.chrome.retainedTokenCounts
  for (const t of MOVED_TOKENS) {
    assert.equal(countIn(noComments(chromeText), t), 0, `${t} 主档规则面零（剥注释后）`)
    assert.equal(countIn(chromeText, t), retained[t], `${t} 主档保留面计数 = 派生冻结值（${retained[t]}）`)
    assert.equal(countIn(listText, t), moved[t], `${t} 新档计数 = 迁出块派生值（${moved[t]}）`)
    assert.equal(countIn(othersText, t), baseline.othersCssTokenCounts[t], `${t} 他档零副本`)
  }
  for (const t of RETAINED_TOKENS) {
    assert.equal(countIn(chromeText, t), baseline.chrome.tokenCounts[t], `${t} 留档计数零动`)
    assert.equal(countIn(noComments(listText), t), 0, `${t} 新档规则面零（剥注释后）`)
  }
  out("D", `迁出 ${MOVED_TOKENS.length} 族规则面唯一定义面 ✓ · 跨 ${others.length} 他档零副本 ✓ · 留档 ${RETAINED_TOKENS.length} 族零动 ✓`)
})

// ─── E 级联序 ────────────────────────────────────────────────────────────

test("E 级联序：index.html link 位次 = chrome.css 之后 ∕ skin.css 之前", () => {
  const html = lines("thincoder-desktop/renderer/index.html")
  const atChrome = html.findIndex((l) => l.includes('href="./chrome.css"'))
  const atList = html.findIndex((l) => l.includes('href="./session-list.css"'))
  const atSkin = html.findIndex((l) => l.includes('href="./skin.css"'))
  assert.ok(atChrome >= 0, "chrome.css link 在场")
  assert.equal(atList, atChrome + 1, "session-list.css link 紧随 chrome.css")
  assert.equal(atSkin, atList + 1, "skin.css 紧随 session-list.css")
  out("E", `index.html :${atChrome + 1} chrome → :${atList + 1} session-list → :${atSkin + 1} skin`)
})
