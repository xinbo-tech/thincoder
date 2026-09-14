/**
 * sync-cancel.test.mjs — SYNC-CANCEL.md（L52——2026-09-09 评审采纳版）测试用例表 1:1：
 * 1. cancelSyncChild（live abort + 幂等 + 无 key/stopped error——subagent-async.mjs）
 * 2. classifySyncAbort 三分支（含挂起场景——ctx.signal 未 abort 而 baseSignal aborted）
 * 3. 折叠报告形态（merge/STOPPED_MARK/_capturedOutput/designId 后缀）
 * 4. controller 链（base abort → ctrl 链式——嵌套递归——+ finally 三路径注销）
 * 5. 端到端（慢测/人工——不入快层——文件尾注）
 * 确定性单元（async-settle.test.mjs 风格——纯单元无 io/无 LLM/无真实子代理）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  classifySyncAbort, armSyncChildAbort, buildSyncStoppedReport,
} from "@thincoder/core/agent-tools/subagent.mjs"
import {
  cancelSyncChild, mergeChildMutations,
} from "@thincoder/core/agent-tools/subagent-async.mjs"
import { STOPPED_MARK } from "@thincoder/core/agent/spawn-child.mjs"

/** 最小 parent agent（registry/guard 记账面——mergeChildMutations 读写）。 */
function mkParent(over = {}) {
  return {
    _syncChildAborts: new Map(),
    _touchedFiles: [],
    _mutatedThisRun: false,
    _calledAdvisorThisRun: false,
    _verifiedThisRun: false,
    _verifyPassed: undefined,
    _advisorSession: null,
    ...over,
  }
}

/** 信号辅助：真 AbortController.signal 或 { aborted: boolean } 桩均可（纯函数只读 aborted）。 */
const sig = (aborted = false) => ({ aborted })

test("cancelSyncChild 组 1：live abort + 幂等 + 无 key/stopped error（SYNC-CANCEL §3）", () => {
  // live：registry 有未 stopped 条目 → abort + stopped=true → {id,status:"cancelled"}
  const ctrl = new AbortController()
  const parent = mkParent()
  parent._syncChildAborts.set("coder#1", { ctrl, stopped: false })
  const r1 = cancelSyncChild(parent, "coder#1")
  assert.deepEqual(r1, { id: "coder#1", status: "cancelled" })
  assert.equal(ctrl.signal.aborted, true)
  assert.equal(parent._syncChildAborts.get("coder#1").stopped, true)
  // stopped 后再调 → error（stop 在途/已完成——"stop no longer applies"——无副作用重复 abort）
  const r2 = cancelSyncChild(parent, "coder#1")
  assert.equal(r2.status, "error")
  assert.match(r2.error, /no live stop control.*stop no longer applies/)
  // 无 key（registry miss——未注册/已注销）→ error
  const r3 = cancelSyncChild(parent, "coder#9")
  assert.equal(r3.status, "error")
  assert.match(r3.error, /has finished or stop no longer applies/)
  // registry 未初始化（agent 无 _syncChildAborts）→ error（同 miss——可选链安全）
  const r4 = cancelSyncChild(mkParent({ _syncChildAborts: undefined }), "coder#1")
  assert.equal(r4.status, "error")
  // 幂等：成功 cancel 只触发一次 abort——再 abort 无效果（AbortController 语义）——
  // 二次调用走 stopped error 分支（上文 r2）——entry 保持 stopped 不再重复 abort
  assert.equal(parent._syncChildAborts.get("coder#1").stopped, true)
})

test("classifySyncAbort 组 2：三分支（含挂起场景——ctx.signal 未 abort 而 base aborted）", () => {
  // ① 整回合停：ctx.signal aborted（err 任意——现状保留分支）
  assert.equal(classifySyncAbort(sig(true), sig(false), { aborted: false }, Object.assign(new Error("x"), { name: "AbortError" })), "base")
  // ① 挂起场景（R2）：ctx.signal 未 abort 而 baseSignal（_sessionSignal）aborted——
  // digest 自身 Ctrl+C 不误伤；会话 Stop 逐链中止必须归 base——err 形态任意
  assert.equal(classifySyncAbort(sig(false), sig(true), { aborted: false }, new Error("boom")), "base")
  assert.equal(classifySyncAbort(sig(false), sig(true), { aborted: true }, Object.assign(new Error("x"), { name: "AbortError" })), "base")
  // ① base === ctx.signal 场景（无 _sessionSignal）——ctx aborted 即 base aborted
  assert.equal(classifySyncAbort(sig(true), sig(true), { aborted: true }, Object.assign(new Error("x"), { name: "AbortError" })), "base")
  // ② targeted：AbortError + 自属 ctrl aborted + base/ctx 未 abort → 折叠
  assert.equal(classifySyncAbort(sig(false), sig(false), { aborted: true }, Object.assign(new Error("x"), { name: "AbortError" })), "targeted")
  // ② 缺 err AbortError（ctrl aborted 但错误非 AbortError——非中止来源）→ 不折叠
  assert.equal(classifySyncAbort(sig(false), sig(false), { aborted: true }, new Error("boom")), "error")
  // ③ 其他错误：无任何 aborted（含 AbortError 但无信号命中——兜底 ③ 现状）
  assert.equal(classifySyncAbort(sig(false), sig(false), { aborted: false }, new Error("boom")), "error")
  assert.equal(classifySyncAbort(sig(false), sig(false), { aborted: false }, Object.assign(new Error("x"), { name: "AbortError" })), "error")
  // null 信号（headless 无 ctx.signal / 无 base）安全
  assert.equal(classifySyncAbort(null, null, null, new Error("boom")), "error")
  assert.equal(classifySyncAbort(null, null, { aborted: true }, Object.assign(new Error("x"), { name: "AbortError" })), "targeted")
  assert.equal(classifySyncAbort(null, sig(true), null, new Error("boom")), "base")
})

test("折叠报告组 3：STOPPED_MARK + partial 警示 + _capturedOutput + eng-coder designId 后缀 + merge（SYNC-CANCEL §2 ②——AC3）", () => {
  // 报告形态（仿 onDeclined partial）：含 STOPPED_MARK 公共锚 + partial 警示句 +
  // captured output 原文
  const out = "some streamed child output\nline2"
  const report = buildSyncStoppedReport("coder", out, undefined)
  assert.ok(report.includes(STOPPED_MARK), "报告必含 STOPPED_MARK 公共锚")
  assert.ok(report.startsWith("Subagent (coder) stopped by user — work may be partial; review recent_changes before deciding next steps."))
  assert.ok(report.includes(`Partial output: ${out}`))
  // 非 eng-coder：无 designId 后缀
  assert.ok(!report.includes("designId:"))
  // eng-coder：designId 后缀（fix round 同 slot 重 spawn 语义——runChildPipeline 同款）
  const er = buildSyncStoppedReport("eng-coder", out, "abc123")
  assert.ok(er.includes(STOPPED_MARK))
  assert.ok(er.includes(`Partial output: ${out}`))
  assert.match(er, /designId: abc123 — reuse it \(with the same designToken\) when re-spawning this eng-coder\.$/)
  // eng-coder 单设计会话（designId 省略）：同款单设计占位文案
  const es = buildSyncStoppedReport("eng-coder", "", undefined)
  assert.match(es, /designId: \(single-design session — designId optional\)/)
  // 空 capturedOutput：Partial output 空串（不吞行）
  assert.ok(buildSyncStoppedReport("coder", "", undefined).includes("\nPartial output: "))
  // merge（折叠路径的 guard 语义——escalate runner 先例镜像）：eng-coder 子代理已写
  // 文件 → mergeChildMutations 传播父 guard 记账（父 _touchedFiles/verify 失效）
  const child = { _mutatedThisRun: true, _touchedFiles: ["C:\\x\\a.mjs", "C:\\x\\b.mjs"] }
  const parent = mkParent()
  parent._touchedFiles.push("C:\\x\\a.mjs") // 已有 a——merge 去重
  parent._verifiedThisRun = true
  parent._verifyPassed = true
  parent._calledAdvisorThisRun = true
  assert.equal(mergeChildMutations(parent, child), true)
  assert.equal(parent._mutatedThisRun, true)
  assert.deepEqual(parent._touchedFiles, ["C:\\x\\a.mjs", "C:\\x\\b.mjs"]) // a 不重复
  assert.equal(parent._verifiedThisRun, false)   // 既有 verify/advisor 状态失效
  assert.equal(parent._verifyPassed, undefined)
  assert.equal(parent._calledAdvisorThisRun, false)
  assert.equal(parent._advisorSession, null)
  // 未实际写文件（guard 内——_mutatedThisRun 空claim）→ 不传播（merge 返回 false）
  const liar = { _mutatedThisRun: true, _touchedFiles: [] }
  const p2 = mkParent()
  assert.equal(mergeChildMutations(p2, liar), false)
  assert.equal(p2._mutatedThisRun, false)
})

test("controller 链组 4：base abort → ctrl 链式（嵌套递归）+ already-aborted base + finally 三路径注销（SYNC-CANCEL §1——AC2/AC4/R7）", () => {
  // 注册 + 链：armSyncChildAbort 建 registry 条目 { ctrl, stopped:false }
  const parent = mkParent()
  const base = new AbortController()
  const { ctrl, disarm } = armSyncChildAbort(parent, "coder#1", base.signal)
  const entry = parent._syncChildAborts.get("coder#1")
  assert.equal(entry.ctrl, ctrl)
  assert.equal(entry.stopped, false)
  assert.equal(ctrl.signal.aborted, false)
  // base abort → ctrl 链式 abort（整回合停逐链传播——AC2）
  base.abort()
  assert.equal(ctrl.signal.aborted, true)
  // 嵌套递归（AC4/F5）：内层 spawn 以 ctrl.signal 为基——外层 base abort 逐层传播
  const innerParent = mkParent()
  const { ctrl: ctrl2 } = armSyncChildAbort(innerParent, "explore#1", ctrl.signal)
  const base3 = new AbortController()
  const { ctrl: ctrl3 } = armSyncChildAbort(mkParent(), "explore#2", base3.signal)
  base3.abort() // 中间层独立 base——只断自身链
  assert.equal(ctrl2.signal.aborted, true) // 外层 base abort → 内层（经 ctrl1 链）
  assert.equal(ctrl3.signal.aborted, true)
  // already-aborted base → 注册即 aborted（Ctrl+C 在 spawn 装配窗口内已发生的场景）
  const pre = new AbortController()
  pre.abort()
  const { ctrl: ctrl4 } = armSyncChildAbort(mkParent(), "coder#2", pre.signal)
  assert.equal(ctrl4.signal.aborted, true)
  // 无 base（headless——null signal）→ 注册成功 + ctrl 不 abort——⏹ 直连仍可用
  const headless = mkParent()
  const { ctrl: ctrl5, disarm: disarm5 } = armSyncChildAbort(headless, "coder#3", null)
  assert.equal(headless._syncChildAborts.has("coder#3"), true)
  assert.equal(ctrl5.signal.aborted, false)
  // finally 三路径注销（R7）：disarm 幂等删除——成功/折叠/整回合停共用同一 finally
  disarm()
  disarm() // 幂等——二次 no-op 不抛
  disarm5()
  assert.equal(parent._syncChildAborts.has("coder#1"), false)
  assert.equal(headless._syncChildAborts.has("coder#3"), false)
  assert.equal(headless._syncChildAborts.size, 0)
})

/**
 * 组 5 —— 端到端（慢测/人工——不入快层）：
 * 中点 ⏹ → stopped 报告 + 块冻结的完整链路 = TUI + 真实 runAgent（LLM 子代理）——
 * 快层禁 io/LLM（TESTING.md §1）——人工验收步骤：
 *   1. CLI TUI 顶层发起 sync spawn（depth-0 async:false——或 escalate async:false 场景外）
 *      ——面板块头出现 ⏹（sub.async 未置位 + state._agent._syncChildAborts live）；
 *   2. 子代理运行中点鼠标点击 ⏹ → cancelSyncChild → ctrl.abort → 子代理 AbortError 解绕
 *      → catch ②折叠：块立即定格 stopped（⟦ev⟧stopped 直发）+ 父回合继续拿报告
 *      （含 STOPPED_MARK/"work may be partial"/Partial output——eng-coder 另带 designId）；
 *   3. 子代理停在权限模态时 ⏹ → 模态 deny 立即解除（denyModalForOwner）——父回合不阻塞；
 *   4. Ctrl+C/I 整回合停语义不变（catch ① base——registry 清理无残留——跨回合无 ghost ⏹）；
 *   5. headless/测试（无 _agent）sync 块不钉 ⏹（AC6）——panel 纯函数测试覆盖。
 */
