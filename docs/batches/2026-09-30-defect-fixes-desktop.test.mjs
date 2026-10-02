/**
 * 2026-09-30-defect-fixes-desktop.test.mjs — 缺陷修复批（#699）桌面面批内单测件。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑（仓根）= `node --test docs/batches/2026-09-30-defect-fixes-desktop.test.mjs`。
 * 判据面 = 批档 §2 条 4 验收腿（化石计数句收正 · 零语义）+ D4「计数基准写定（自证可核）」。
 *   ① 两档源文本含新句（定稿限域文本）；② 旧句「设置族十二项」两档零命中 ∥ 旧「转口三档模块」零命中。
 *   ③ 计数自证：ipc-relays 注释下恰 19 导出口；preload 白名单设置族 8+2+1+6+1+1+1 = 20（真体 require 读
 *      CHANNELS —— 平 node 零装配，沿该档头注「无 window ⇒ 零装配、不触 electron」）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

const ROOT = process.cwd()
const text = (rel) => readFileSync(join(ROOT, rel), "utf8")
const RELAYS = "thincoder-desktop/src/main/ipc-relays.mjs"
const PRELOAD = "thincoder-desktop/src/preload/preload.cjs"

test("① 两档新句在场 ∥ 旧句零残留（#699 化石收正）", () => {
  const relays = text(RELAYS)
  const preload = text(PRELOAD)
  assert.ok(
    relays.includes("转口群十九项处理体（本块设置族十六 ∕ 配置写一 ∕ 台账相位两）：转口四档模块，本档零算法副本"),
    "ipc-relays:34 新句在场（定稿限域文本）",
  )
  assert.ok(
    preload.includes("设置族二十项（provider / model / agent 参数 / MCP / env / tools / 配置写（语言））"),
    "preload.cjs:11 新句在场",
  )
  assert.equal(relays.includes("设置族十二项"), false, "旧句「设置族十二项」零命中（ipc-relays）")
  assert.equal(preload.includes("设置族十二项"), false, "旧句「设置族十二项」零命中（preload）")
  assert.equal(relays.includes("转口三档模块"), false, "旧句「转口三档模块」零命中（ipc-relays）")
})

test("② 计数基准自证：注释下 19 导出口 ∥ 白名单设置族 = 20（8+2+1+6+1+1+1）", () => {
  const relays = text(RELAYS)
  const marker = "转口群十九项处理体（本块设置族十六 ∕ 配置写一 ∕ 台账相位两）"
  const idx = relays.indexOf(marker)
  assert.ok(idx >= 0, "计数注释在档")
  const below = relays.slice(idx)
  assert.equal((below.match(/^export function/gm) ?? []).length, 19, "注释下恰 19 导出口（计数句自证）")

  const require_ = createRequire(import.meta.url)
  const { CHANNELS } = require_(join(ROOT, PRELOAD))
  const count = (prefix) => CHANNELS.filter((c) => String(c).startsWith(prefix)).length
  assert.equal(count("provider:"), 8, "provider 八")
  assert.equal(count("model:"), 2, "model 两（list ∕ catalog）")
  assert.equal(CHANNELS.includes("settings:agent"), true, "agent 参数一")
  assert.equal(count("mcp:"), 6, "MCP 六（list ∕ save ∕ remove ∕ tools ∕ update ∕ reconnect）")
  assert.equal(CHANNELS.includes("settings:env"), true, "env 一")
  assert.equal(CHANNELS.includes("settings:tools"), true, "tools 一")
  assert.equal(CHANNELS.includes("config:write"), true, "配置写一")
  const settings = count("provider:") + count("model:") + 1 + count("mcp:")
    + (CHANNELS.includes("settings:env") ? 1 : 0) + (CHANNELS.includes("settings:tools") ? 1 : 0)
    + (CHANNELS.includes("config:write") ? 1 : 0)
  assert.equal(settings, 20, "设置族计数基准 = 20")
  assert.equal(CHANNELS.includes("ledger:read") && CHANNELS.includes("batch:status"), true, "项目级信息两项（台账 ∕ 相位）核算为真")
})
