// 2026-10-01-light-round-4.test.mjs — 轻通道轮四批内件（读数腿 · 源读面 V1 ∥ V3 ∥ V5 ∥ V7–V11）
// 判据面 = 批档 §2 D 表（两块合卷）：V1/V3/V5（首块）∥ V7–V11（增量块）；V2/V4/V6/V12 = 真机腿（§6 父侧探针）。
// 只读源档（theme.css ∥ chat.css ∥ core.css）断言声明值——零文档锚、零文案锚（纯结构面）。
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const R = (p) => readFileSync(new URL(`../../thincoder-desktop/renderer/${p}`, import.meta.url), "utf8")
const theme = R("theme.css")
const chat = R("chat.css")
const core = R("core.css")

test("V1 · theme.css --lh = 1.3（逐字）", () => {
  assert.match(theme, /--lh:\s*1\.3\s*;/)
})

test("V7 · theme.css --fs = 12px（逐字）", () => {
  assert.match(theme, /--fs:\s*12px\s*;/)
})

test("V8 · theme.css --bg-raised 暗值 = #14171c（值对第二值位）", () => {
  assert.match(theme, /--bg-raised:\s*light-dark\(#ffffff,\s*#14171c\)/)
})

test("值面传导 · body 经 var(--fs)/var(--lh)（单一投入口）", () => {
  assert.match(theme, /font:\s*var\(--fs\)\/var\(--lh\)\s+var\(--font\)/)
})

test("V3 · chat.css margin-top: 8px ≥ 五处（全族归一定档）", () => {
  const hits = chat.match(/margin-top:\s*8px/g) ?? []
  assert.ok(hits.length >= 5, `margin-top: 8px count = ${hits.length} (< 5)`)
})

test("V5 · 工具族纵向内距 = 0（头 ∥ 变更行 ∥ 文件行 ∥ 结果区）", () => {
  assert.match(chat, /\.tool-head\s*\{[^}]*padding:\s*0\s+10px/s, ".tool-head 上下内距归零")
  assert.match(chat, /\.tool-changes\s*\{[^}]*margin-top:\s*0/s, ".tool-changes 上距归零")
  assert.match(chat, /\.tool-changes\s*\{[^}]*padding:\s*0\s+10px/s, ".tool-changes 上下内距归零")
  assert.match(chat, /\.tool-file\s*\{[^}]*margin-top:\s*0/s, ".tool-file 上距归零")
  assert.match(chat, /\.tool-result\s*\{[^}]*padding:\s*0\s+10px/s, ".tool-result 上下内距归零")
})

test("V9 · 工具头两态箭头（▸ ∥ :has 展开 ▼）", () => {
  assert.match(chat, /::before\s*\{\s*content:\s*"▸"/, "折叠态 ▸")
  assert.match(chat, /\.block-tool:has\(>\s*\.tool-result\)[^{]*\{[^}]*content:\s*"▼"/s, "展开态 ▼（:has 选择器）")
})

test("V10 · 流线两处同值（2px solid var(--fg-muted) ∥ margin-left: 13px）", () => {
  for (const [name, src] of [["chat.css(.tool-result)", chat], ["core.css(.reasoning-content)", core]]) {
    assert.match(src, /border-left:\s*2px solid var\(--fg-muted\)/, `${name} 线值 2px`)
    assert.match(src, /margin-left:\s*13px/, `${name} 线位 13px`)
  }
})

test("V11 · 推理块底色撤 ∥ 自绘两态箭头", () => {
  const m = core.match(/\.reasoning-block\s*\{([^}]*)\}/s)
  assert.ok(m, ".reasoning-block 规则在场")
  const decl = m[1].replace(/\/\*[\s\S]*?\*\//g, "") // 去注释（退役注在盘 = 合法）——只断声明面
  assert.ok(!/background/.test(decl), ".reasoning-block 声明面零 background（底色撤）")
  assert.match(core, /\.reasoning-summary\s*\{[^}]*list-style:\s*none/s, "原生 marker 退位")
  assert.match(core, /\.reasoning-summary::before\s*\{\s*content:\s*"▸"/, "折叠态 ▸（自绘）")
  assert.match(core, /\.reasoning-block\[open\][^{]*\{[^}]*content:\s*"▼"/s, "展开态 ▼（自绘）")
})

test("V10b · 推理展开体左留白 = 10px（线旁不贴）", () => {
  assert.match(core, /\.reasoning-content[^{]*\{[^}]*padding-left:\s*10px/s)
})
