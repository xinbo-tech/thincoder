/**
 * dims.mjs 单测（2026-08-30 会诊 P0：采样可信度 + 恢复通道；2026-08-31 补 trusted 缩放 settle）。
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

test("dims: trusted(缩放源) 缩小单次事件 + settle 窗口后提交（2026-08-31 拖拽缩放修复）", async () => {
  let s = { cols: 280, rows: 70 }
  const d = makeDimsState({ cols: 280, rows: 70 }, () => s)
  // 拖拽结束单次最终事件（值 80 只出现一次，永不满足"两连确认"）
  s = { cols: 80, rows: 24 }
  d.refresh(true)
  assert.equal(d.get().cols, 280, "首次 sighting 不立即提交（还在 settle 窗口内）")
  await new Promise((r) => setTimeout(r, 420)) // 超过 SHRINK_SETTLE_MS
  d.refresh(true) // resize 后的 settle 复查
  assert.equal(d.get().cols, 80, "settle 窗口后 trusted 缩小提交（即使只 sight 一次）")
})

test("dims: trusted 缩小但期间出现更大值 → 取消，不误提交（2026-08-31）", async () => {
  let s = { cols: 280, rows: 70 }
  const d = makeDimsState({ cols: 280, rows: 70 }, () => s)
  s = { cols: 80, rows: 24 }
  d.refresh(true) // park 80
  s = { cols: 320, rows: 90 }
  d.refresh(true) // 增长立即提交 320，pending 清除
  assert.equal(d.get().cols, 320)
  await new Promise((r) => setTimeout(r, 420))
  s = { cols: 80, rows: 24 }
  d.refresh(true) // 新 park 80，at 刚刚开始
  assert.equal(d.get().cols, 320, "增长后的新缩小未 settle，不提交")
})

test("dims: 非 trusted 缩小 + 时间流逝 → 仍不提交（ConPTY stale 防御不破）", async () => {
  let s = { cols: 280, rows: 70 }
  const d = makeDimsState({ cols: 280, rows: 70 }, () => s)
  s = { cols: 80, rows: 24 }
  d.refresh() // 非 trusted（启动重采样/看门狗）：park 80
  await new Promise((r) => setTimeout(r, 420)) // 时间流逝
  s = { cols: 79, rows: 24 } // 不同值——不会触发两连确认
  d.refresh()
  assert.equal(d.get().cols, 280, "非 trusted 无 settle 路径，缩小保持未提交")
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