/**
 * dims.mjs 单测（2026-08-31 简化：删 ConPTY stale 假说防御——双确认/trusted
 * settle/看门狗，见 dims.mjs 头注释的简化记录。保留：sane-gate + falsy 保持 +
 * 任何 sane 采样（含缩小）立即提交 + 采样纪律守卫）。
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
  s = { cols: 10, rows: 5 }
  d.refresh()
  assert.equal(d.get().cols, 280, "sane-gate 以下（falsy/不可用）保持")
})

test("dims: 缩小立即提交（resize 事件 = 真实变更；2026-08-31 简化反转）", () => {
  let s = { cols: 280, rows: 70 }
  const d = makeDimsState({ cols: 280, rows: 70 }, () => s)
  s = { cols: 80, rows: 24 }
  d.refresh()
  assert.equal(d.get().cols, 80, "缩小单次采样即提交（拖拽缩放一次最终事件也生效）")
  s = { cols: 280, rows: 70 }
  d.refresh()
  assert.equal(d.get().cols, 280, "放大同样立即提交（双向一致）")
})

test("dims: onChange 回调在每次提交时触发", () => {
  let s = { cols: 280, rows: 70 }
  const changes = []
  const d = makeDimsState({ cols: 280, rows: 70 }, () => s, (dims) => changes.push(dims))
  s = { cols: 320, rows: 80 }
  d.refresh()
  assert.equal(changes.length, 1, "增长触发 onChange")
  s = { cols: 80, rows: 24 }
  d.refresh()
  assert.equal(changes.length, 2, "缩小立即触发 onChange")
  d.refresh() // 同值重采 → 无变更
  assert.equal(changes.length, 2, "同值重采不触发")
})

test("dims 守卫: src/tui 内 refresh() 只允许出现在 index.mjs（事件钩子），渲染/交互路径必须 get()", () => {
  const dir = path.join(import.meta.dirname, "../src/tui")
  const offenders = []
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".mjs") || f === "dims.mjs") continue
    const c = fs.readFileSync(path.join(dir, f), "utf8")
    // ① refresh() 越界：只有 index.mjs（startup seed / resize）允许
    if (f !== "index.mjs" && /\.refresh\(\)/.test(c)) offenders.push(f + " (refresh)")
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