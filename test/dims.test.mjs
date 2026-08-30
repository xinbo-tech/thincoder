/**
 * dims.mjs 单测（2026-08-30 会诊 P0：采样可信度 + 恢复通道）。
 * sampler 注入——不依赖真实终端。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { makeDimsState } from "../src/tui/dims.mjs"
import fs from "node:fs"
import path from "node:path"

test("dims: sane 采样替换缓存；falsy 保持上次好值", () => {
  let s = { cols: 280, rows: 70 }
  const d = makeDimsState({ cols: 80, rows: 24 }, () => s)
  assert.equal(d.get().cols, 80, "初始 seed")
  s = { cols: 280, rows: 70 }
  d.refresh()
  assert.equal(d.get().cols, 280, "有效采样立即替换（增长）")
  s = { cols: undefined, rows: undefined }
  d.refresh()
  assert.equal(d.get().cols, 280, "falsy 保持上次好值")
})

test("dims: 非对称接受——变小需两次连续确认，变大立即提交", () => {
  let s = { cols: 280, rows: 70 }
  const d = makeDimsState({ cols: 280, rows: 70 }, () => s)
  // stale-small（ConPTY 输出活动期）：单次采样不提交
  s = { cols: 80, rows: 24 }
  d.refresh()
  assert.equal(d.get().cols, 280, "变小首次 sighting 不提交")
  d.refresh()
  assert.equal(d.get().cols, 80, "连续第二次确认后提交")
  // 恢复（stale 窗口结束）：变大立即提交
  s = { cols: 280, rows: 70 }
  d.refresh()
  assert.equal(d.get().cols, 280, "变大立即提交（恢复通道）")
})

test("dims: 变小确认被中断（回到原值）则清除 pending", () => {
  let s = { cols: 280, rows: 70 }
  const d = makeDimsState({ cols: 280, rows: 70 }, () => s)
  s = { cols: 80, rows: 24 }
  d.refresh() // pendingShrink 记下 80
  s = { cols: 280, rows: 70 }
  d.refresh() // 回到 280 → pending 清除
  s = { cols: 80, rows: 24 }
  d.refresh()
  assert.equal(d.get().cols, 280, "pending 被打断后需重新两连")
  d.refresh()
  assert.equal(d.get().cols, 80, "重新两连确认后提交")
})

test("dims: onChange 回调在提交时触发", () => {
  let s = { cols: 280, rows: 70 }
  const changes = []
  const d = makeDimsState({ cols: 280, rows: 70 }, () => s, (dims) => changes.push(dims))
  s = { cols: 320, rows: 80 }
  d.refresh()
  assert.equal(changes.length, 1, "增长触发 onChange")
  s = { cols: 80, rows: 24 }
  d.refresh()
  assert.equal(changes.length, 1, "变小首次不触发")
  d.refresh()
  assert.equal(changes.length, 2, "变小确认后触发")
})

test("dims 守卫: src/tui 内 refresh() 只允许出现在 index.mjs（事件钩子），渲染/交互路径必须 get()", () => {
  const dir = path.join(import.meta.dirname, "../src/tui")
  const offenders = []
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".mjs") || f === "dims.mjs") continue
    const c = fs.readFileSync(path.join(dir, f), "utf8")
    // ① refresh() 越界：只有 index.mjs（seed/resize/重试/看门狗）与 agent-turn.mjs（turn finally 输出停止采样）允许
    if (f !== "index.mjs" && f !== "agent-turn.mjs" && /\.refresh\(\)/.test(c)) offenders.push(f + " (refresh)")
    // ② 完全绕过 dims 的裸读：行上既无 state.dims 也非 fallback（get() ?? …）形态
    const srcLines = c.split("\n")
    for (const [i, line] of srcLines.entries()) {
      if (!/process\.stdout\.(columns|rows)/.test(line)) continue
      if (line.trim().startsWith("//")) continue // 注释
      if (line.includes("startup")) continue // index seed
      if (line.includes("state.dims")) continue // dims 主源 + fallback 同行
      // fallback 续行：前 3 行内出现 dims 主源（const d = … get()）即视为同源
      const prev3 = srcLines.slice(Math.max(0, i - 3), i).join("\n")
      if (prev3.includes("state.dims") && prev3.includes(".get()")) continue
      offenders.push(`${f}:${i + 1} (裸读)`)
    }
  }
  assert.deepEqual(offenders, [], "dims.refresh()/裸读越界: " + offenders.join(", "))
})
