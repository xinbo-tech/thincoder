/**
 * config-watch.test.mjs — 第 21 批（B5 外部 config.json 写盘感知）机器验收。
 * 设计权威：`docs/design/SETTINGS.md` §2.6（契约 · 用例 T-S1~T-S6 · AC-S1~S2）；
 * 批次档 `thincoder/docs/batches/2026-09-11-VSC-INDEX-PERCEPTION.md` §2。
 *
 * 手法：真模块 `src/extension/config-watch.mjs` + vscode mock 的 watcher 捕获面
 * （`workspace.fileSystemWatchers`——注册形状可断言；事件由 `watcher._fire` 驱动，
 * dispose 后 _fire 为 no-op，与真实宿主语义同）。去抖用短值（10–20ms），全程 tmp 沙箱
 * config 路径（`_setConfigPathForTest`）。
 */
import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import files from "./files.mjs"
import { startConfigWatch } from "../src/extension/config-watch.mjs"
import { RelativePattern } from "vscode"
import { _setConfigPathForTest, loadRaw, saveRaw, onConfigSelfWrite } from "../src/config-io.mjs"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const watchers = () => vscode.workspace.fileSystemWatchers
const lastWatcher = () => watchers().at(-1)

let _tmp
let _cfg

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-cfgwatch-"))
  _cfg = join(_tmp, "config.json")
})
beforeEach(() => {
  watchers().length = 0
  _setConfigPathForTest(_cfg)
})
after(() => {
  _setConfigPathForTest(null)
  try { rmSync(_tmp, { recursive: true, force: true }) } catch { /* ignore */ }
})

test("T-S1 注册形状（F6/AC-S1）：以（config 目录基座 + config.json）注册；三类监听全注册", () => {
  const w = startConfigWatch({ onChange: () => {}, configPath: _cfg, debounceMs: 10 })
  const reg = lastWatcher()
  assert.ok(reg, "watcher 已注册（修前红：全仓零 createFileSystemWatcher）")
  assert.ok(reg.pattern instanceof RelativePattern, "以 RelativePattern 注册（Uri 基座——工作区外路径覆盖）")
  assert.equal(reg.pattern.pattern, "config.json")
  assert.equal(reg.pattern.base.fsPath, _tmp, "基座 = config 所在目录")
  assert.deepEqual(Object.values(reg._listeners).map((l) => l.length), [1, 1, 1], "change / create / delete 三类各一监听")
  assert.equal(typeof w.noteSelfWrite, "function", "契约形状 { dispose, noteSelfWrite }")
  assert.ok(files.includes("test/config-watch.test.mjs"), "本档已登记 test/files.mjs")
  w.dispose()
})

test("T-S2 事件→推送（F6/AC-S1）：三次事件合并为一次 onChange（去抖）", async () => {
  writeFileSync(_cfg, JSON.stringify({ a: 1 }))
  let n = 0
  const w = startConfigWatch({ onChange: () => { n++ }, configPath: _cfg, debounceMs: 20 })
  writeFileSync(_cfg, JSON.stringify({ a: 2, b: 2 })) // 外部写（元组已变）
  const reg = lastWatcher()
  reg._fire("change"); reg._fire("change"); reg._fire("change")
  await sleep(70)
  assert.equal(n, 1, "去抖后恰一次")
  w.dispose()
})

test("T-S3 自写抑制（N5/AC-S2）：saveRaw 自写成功 → 事件零推送；冲突放弃路径零回调", async () => {
  writeFileSync(_cfg, JSON.stringify({ v: 1 }))
  let n = 0
  const w = startConfigWatch({ onChange: () => { n++ }, configPath: _cfg, debounceMs: 20 })
  const raw = loadRaw()
  raw.marker = "self"
  assert.equal(saveRaw(raw), undefined, "写成功（无冲突对象）")
  lastWatcher()._fire("change")
  await sleep(70)
  assert.equal(n, 0, "自写 → 基线已随 saveRaw 刷新 → 事件到达零推送（不抖动面板）")

  // 冲突放弃路径（无写即无自写）：loadRaw 记基线 → 外部改 → saveRaw 放弃 → 零自写回调
  const probes = []
  const unsub = onConfigSelfWrite(() => probes.push(1))
  loadRaw()
  writeFileSync(_cfg, JSON.stringify({ v: 3, ext: true })) // 外部写
  const r2 = saveRaw({ v: 4, marker: "clash" })
  unsub()
  assert.deepEqual(r2, { ok: false, reason: "mtime-conflict" }, "冲突 → 放弃不写")
  assert.equal(probes.length, 0, "放弃路径零自写回调")
  lastWatcher()._fire("change")
  await sleep(70)
  assert.equal(n, 1, "外部写真实变化 → 推送一次（基线未被放弃路径刷新）")
  w.dispose()
})

test("T-S3b 稳态零推送（N5/AC-S2）：基线建立后重复投递「元组未变」事件 → 第二次起零调用", async () => {
  writeFileSync(_cfg, JSON.stringify({ s: 1 }))
  let n = 0
  const w = startConfigWatch({ onChange: () => { n++ }, configPath: _cfg, debounceMs: 10 })
  lastWatcher()._fire("change")
  await sleep(40)
  assert.equal(n, 0, "元组未变 → 零推送")
  lastWatcher()._fire("change"); lastWatcher()._fire("change")
  await sleep(40)
  assert.equal(n, 0, "稳态重复投递零调用")
  w.dispose()
})

test("T-S4 create / delete（F6/AC-S1）：三类事件同走「去抖 → 元组判 → onChange」", async () => {
  const fresh = join(_tmp, "fresh.json")
  let n = 0
  const w = startConfigWatch({ onChange: () => { n++ }, configPath: fresh, debounceMs: 10 })
  lastWatcher()._fire("create")
  await sleep(30)
  assert.equal(n, 0, "create 事件但文件仍缺失（基线 null == 当前 null）→ 零推送")
  writeFileSync(fresh, "{}")
  lastWatcher()._fire("create")
  await sleep(30)
  assert.equal(n, 1, "文件出现（元组异）→ 推送")
  rmSync(fresh, { force: true })
  lastWatcher()._fire("delete")
  await sleep(30)
  assert.equal(n, 2, "删除（元组异 → null）→ 推送")
  w.dispose()
})

test("T-S5 dispose（N5/AC-S2）：挂起定时器清掉 + 释放后事件零推送", async () => {
  writeFileSync(_cfg, JSON.stringify({ d: 1 }))
  let n = 0
  const w = startConfigWatch({ onChange: () => { n++ }, configPath: _cfg, debounceMs: 30 })
  const reg = lastWatcher()
  writeFileSync(_cfg, JSON.stringify({ d: 2, more: 1 }))
  reg._fire("change") // 进入去抖窗（定时器在飞）
  w.dispose()
  assert.equal(reg.disposed, true, "watcher 已释放")
  await sleep(80)
  assert.equal(n, 0, "挂起定时器已清（去抖窗内 dispose → 零推送）")
  reg._fire("change")
  await sleep(40)
  assert.equal(n, 0, "释放后事件零推送")
})

test("T-S6 降级（N6/AC-S2）：宿主 API 缺失或构造抛错 → 返回 no-op，零抛错", () => {
  const real = vscode.workspace.createFileSystemWatcher
  try {
    delete vscode.workspace.createFileSystemWatcher
    const w = startConfigWatch({ onChange: () => { throw new Error("never called") }, configPath: _cfg })
    assert.equal(typeof w.dispose, "function")
    w.dispose()
    w.noteSelfWrite()
    vscode.workspace.createFileSystemWatcher = () => { throw new Error("host refused") }
    const w2 = startConfigWatch({ onChange: () => { throw new Error("never called") }, configPath: _cfg })
    w2.dispose()
    vscode.workspace.createFileSystemWatcher = undefined
    const w3 = startConfigWatch({ onChange: () => {}, configPath: _cfg })
    w3.dispose()
  } finally { vscode.workspace.createFileSystemWatcher = real }
  assert.ok(true, "三形态降级均零抛错（不阻断激活——面板打开拉新的既有路径兜底）")
})
