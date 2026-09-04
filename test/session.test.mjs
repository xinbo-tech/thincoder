/**
 * SESSION.md §8 — 会话恢复 provider/model 缺失 → 模型重选（2026-09-02 Q1）
 * T1/T1b/T2/T3/T4/T5/T6/T6b 恢复场景断言：
 * - validateProvider（make-agent.mjs）单测：判据 = model/baseURL 缺失（MODEL_SPECS 未知不判）
 * - applySession + validateProvider 链：D-S3 优先级（会话无效+config 有效 → 静默；两者都无效 → 弹）
 * - loadConfig：activeProvider 缺失不再抛错（spawn 隔离 HOME，不碰真实 ~/.thincoder）
 * - T4 headless：thincoder chat + 无效 provider → 可读错误 + 退出码 1
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { execFileSync, spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { slow } from "./slow.mjs"

import { validateProvider } from "../src/cli/make-agent.mjs"
import { applySession } from "../src/session.mjs"

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

const DEEPSEEK = { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-chat", apiKey: "sk-x" }

/** Agent fixture：config activeProvider=deepseek（有效）为默认态 */
function makeAgent(overrides = {}) {
  return {
    provider: { ...DEEPSEEK },
    providers: [{ ...DEEPSEEK }],
    activeProvider: "deepseek",
    activeModel: null,
    config: { agent: {} },
    history: [],
    ...overrides,
  }
}

/** 隔离 HOME 的 config.json 写入（spawn 子进程用，不碰真实 ~/.thincoder） */
function fakeHomeWithConfig(config) {
  const home = mkdtempSync(join(tmpdir(), "thincoder-session-"))
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify(config))
  return home
}

function runInFakeHome(home, script) {
  return execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: projectRoot,
    env: { ...process.env, USERPROFILE: home, HOME: home },
    encoding: "utf8",
  })
}

// ====================================================================
// T1 / T2 — 均无此 provider → _providerInvalid（F1/F2, D-S1）
// ====================================================================

test("T1 会话+config 均无此 provider：applySession 无法修复 → _providerInvalid=true", () => {
  // config.activeProvider="ghost" 不存在 → loadConfig 产出的 runtimeProvider 为空对象
  const agent = makeAgent({ provider: {}, activeProvider: "ghost" })
  validateProvider(agent)
  assert.equal(agent._providerInvalid, true)
  assert.match(agent._providerInvalidReason, /provider 不存在/)

  // 会话恢复也指向 ghost → applySession 静默跳过（if (p) 不成立）→ 复验仍 invalid
  applySession(agent, { history: [], activeProvider: "ghost", activeModel: null })
  validateProvider(agent)
  assert.equal(agent._providerInvalid, true, "两者都无效 → 保持 invalid（TUI 弹重选）")
})

test("T2 config activeProvider 无效（纯配置错误，无会话）→ _providerInvalid=true", () => {
  const agent = makeAgent({ provider: {}, activeProvider: "ghost" })
  validateProvider(agent)
  assert.equal(agent._providerInvalid, true)
  assert.equal(agent._providerInvalidReason, "provider 不存在")
})

// ====================================================================
// T1b / T5 / D-S3 补全 — 会话恢复优先级
// ====================================================================

test("T1b 会话 provider 缺失 + config 有效 → 静默用 config 的 provider，不置位（D-S3）", () => {
  const agent = makeAgent() // config activeProvider=deepseek 有效
  validateProvider(agent)
  assert.equal(agent._providerInvalid, undefined)

  const switched = applySession(agent, { history: [], activeProvider: "ghost", activeModel: null })
  assert.equal(switched, false, "会话 provider 不存在 → 静默保持现状")
  assert.equal(agent.activeProvider, "deepseek", "config 的 provider 保留")
  assert.equal(agent.provider.model, "deepseek-chat")

  validateProvider(agent)
  assert.equal(agent._providerInvalid, undefined, "不弹重选")
})

test("T5 会话 provider 有效：正常恢复 → 行为不变（回归，D-S3）", () => {
  const p1 = { name: "p1", baseURL: "https://p1.example/v1", model: "m1", apiKey: "k" }
  const agent = makeAgent({ provider: { ...p1 }, providers: [{ ...p1 }, { ...DEEPSEEK }], activeProvider: "p1" })
  validateProvider(agent)
  assert.equal(agent._providerInvalid, undefined)

  const switched = applySession(agent, { history: [{ role: "user", content: "hi" }], activeProvider: "deepseek", activeModel: null })
  assert.equal(switched, true, "会话 provider 回切")
  assert.equal(agent.activeProvider, "deepseek")
  assert.equal(agent.provider.model, "deepseek-chat")

  validateProvider(agent)
  assert.equal(agent._providerInvalid, undefined)
})

test("D-S3 补全：config 无效 + 会话有效 → applySession 修复，复验清除标记（不弹重选）", () => {
  const agent = makeAgent({ provider: {}, activeProvider: "ghost" })
  validateProvider(agent)
  assert.equal(agent._providerInvalid, true)

  const switched = applySession(agent, { history: [], activeProvider: "deepseek", activeModel: null })
  assert.equal(switched, true, "会话中的有效 provider 回切")
  assert.equal(agent.activeProvider, "deepseek")

  // bin/thincoder.mjs tui 分支：applySession 后复验（validateProvider 幂等）
  validateProvider(agent)
  assert.equal(agent._providerInvalid, undefined, "修复后清除标记")
  assert.equal(agent._providerInvalidReason, undefined)
})

// ====================================================================
// T6 / T6b — model 判据（评审 #1/#2）
// ====================================================================

test("T6 activeModel 缺失（provider.model 被删）→ invalid 'model 缺失'，弹重选", () => {
  const agent = makeAgent({
    provider: { name: "deepseek", baseURL: "https://api.deepseek.com", model: "", apiKey: "sk-x" },
    providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com", model: "", apiKey: "sk-x" }],
  })
  validateProvider(agent)
  assert.equal(agent._providerInvalid, true)
  assert.equal(agent._providerInvalidReason, "model 缺失")
})

test("T6b 自定义模型（MODEL_SPECS 未知）→ 不判 invalid（评审 #1 回归）", () => {
  const agent = makeAgent({
    provider: { name: "custom", baseURL: "https://my.endpoint.example/v1", model: "my-custom-model", apiKey: "k" },
    providers: [{ name: "custom", baseURL: "https://my.endpoint.example/v1", model: "my-custom-model", apiKey: "k" }],
    activeProvider: "custom",
  })
  validateProvider(agent)
  assert.equal(agent._providerInvalid, undefined, "MODEL_SPECS 成员资格不判无效")
})

test("D-S1 双判据：baseURL 缺失 → invalid '缺少 baseURL'", () => {
  const agent = makeAgent({
    provider: { name: "custom", baseURL: "", model: "m1", apiKey: "k" },
    providers: [{ name: "custom", baseURL: "", model: "m1", apiKey: "k" }],
    activeProvider: "custom",
  })
  validateProvider(agent)
  assert.equal(agent._providerInvalid, true)
  assert.equal(agent._providerInvalidReason, "缺少 baseURL")
})

test("apiKey 缺失 → 不判 invalid（既有 wizard /model 流程处理，非 D-S1 判据）", () => {
  const agent = makeAgent({ provider: { ...DEEPSEEK, apiKey: "" } })
  validateProvider(agent)
  assert.equal(agent._providerInvalid, undefined)
})

// ====================================================================
// T3 — 无可用 provider
// ====================================================================

test("T3 无可用 provider（providers 空）→ invalid 标记（TUI 弹 Add provider…/提示行，不崩溃）", () => {
  const agent = makeAgent({ provider: { name: "default", baseURL: "", model: "" }, providers: [], activeProvider: "" })
  validateProvider(agent)
  assert.equal(agent._providerInvalid, true)
})

// ====================================================================
// T4 — headless（thincoder chat + 无效 provider）
// ====================================================================

test("T4 headless：thincoder chat + 无效 provider → 可读错误 + 退出码 1，无 UI（F4/D-S4）", () => {
  // cwd 用临时目录（非项目根）：子进程 assembleAgent 不做项目内存索引/规则发现/MCP——
  // 避免全量 suite 并行时给时序敏感的 agent.test.mjs 压缩测试制造负载（实测 T3b 被压翻）
  const home = fakeHomeWithConfig({ providers: [{ ...DEEPSEEK }], activeProvider: "ghost" })
  try {
    let stdout = "", stderr = "", status = 0
    try {
      execFileSync(process.execPath, [join(projectRoot, "bin", "thincoder.mjs"), "chat", "hello"], {
        cwd: home,
        env: { ...process.env, USERPROFILE: home, HOME: home },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      })
    } catch (e) {
      status = e.status
      stderr = e.stderr ?? ""
      stdout = e.stdout ?? ""
    }
    assert.equal(status, 1, "退出码 1")
    assert.match(stderr, /未配置有效 provider/, "可读错误")
    assert.match(stderr, /activeProvider "ghost"/, "指明失效的 provider")
    assert.match(stderr, /TUI 重新选择/, "引导进入 TUI 重选")
    assert.equal(stdout, "", "无 stdout 输出（不弹 UI）")
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test("T4 --auto 场景同：thincoder chat --auto + 无效 provider → 退出码 1", () => {
  const home = fakeHomeWithConfig({ providers: [{ ...DEEPSEEK }], activeProvider: "ghost" })
  try {
    let status = 0
    try {
      execFileSync(process.execPath, [join(projectRoot, "bin", "thincoder.mjs"), "chat", "--auto", "hello"], {
        cwd: home,
        env: { ...process.env, USERPROFILE: home, HOME: home },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      })
    } catch (e) {
      status = e.status
    }
    assert.equal(status, 1, "--auto 场景同：退出码 1")
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

// ====================================================================
// loadConfig — activeProvider 缺失不再抛错（D-S1 前置，根因链修正）
// ====================================================================

test("loadConfig：activeProvider 缺失不再抛错（runtimeProvider 空对象，providers 保留）", () => {
  const home = fakeHomeWithConfig({ providers: [{ ...DEEPSEEK }], activeProvider: "ghost" })
  try {
    const out = runInFakeHome(home, `
import assert from "node:assert/strict"
const { loadConfig } = await import("./src/config.mjs")
const cfg = loadConfig()
assert.equal(cfg.provider.model, undefined, "runtimeProvider 为空对象（无 model）")
assert.equal(cfg.provider.baseURL, undefined, "runtimeProvider 为空对象（无 baseURL）")
assert.equal(cfg.providers.length, 1, "providers 列表保留")
assert.equal(cfg.activeProvider, "ghost", "activeProvider 保留原值（供错误消息/重选使用）")
console.log("loadConfig no-throw OK")
`)
    assert.match(out, /loadConfig no-throw OK/)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test("loadConfig：config.json 不存在（首启）→ provider 为默认空，不抛错（F3 前置）", () => {
  const home = mkdtempSync(join(tmpdir(), "thincoder-session-"))
  try {
    const out = runInFakeHome(home, `
import assert from "node:assert/strict"
const { loadConfig } = await import("./src/config.mjs")
const cfg = loadConfig()
assert.equal(cfg.providers.length, 0)
assert.equal(cfg.provider.model, "", "默认空 provider（model 为空串 → validateProvider 判 invalid → TUI 弹重选）")
assert.equal(cfg.provider.baseURL, "")
console.log("loadConfig empty OK")
`)
    assert.match(out, /loadConfig empty OK/)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})




// ---------------------------------------------------------------- 会话持久化


slow("session: 保存/恢复/新建 往返（基于槽位）", async () => {
  const { saveSession, loadSession, newSession, activePath, sessionPath } = await import("../src/session.mjs")
  const cwd = join(tmpdir(), "thincoder-session-test-" + Date.now())
  const agent = {
    cwd,
    provider: { name: "test", model: "test-model" },
    history: [
      { role: "user", content: "你好" },
      { role: "assistant", content: "在", tool_calls: [{ id: "c1", type: "function", function: { name: "ls", arguments: "{}" } }] },
      { role: "tool", tool_call_id: "c1", content: "src/" },
    ],
    tasks: [{ title: "t", status: "done" }],
    _pendingReminders: ["[System reminder: plan mode is now ON. ...]"],
    _sessionStart: "2026-01-01T00:00:00.000Z",
  }
  agent.history.push({ role: "user", content: "[System reminder: working directory snapshot:\nsrc/]", transient: true })
  // 无会话时 null
  assert.equal(loadSession(cwd), null)
  saveSession(agent)
  // saveSession 直接写入活动槽位
  assert.ok(existsSync(activePath(cwd)))
  const restored = loadSession(cwd)
  assert.equal(restored.history.length, 3)
  assert.equal(restored.history[1].tool_calls[0].function.name, "ls")
  assert.equal(restored.tasks[0].status, "done")
  assert.deepEqual(restored.pendingReminders, ["[System reminder: plan mode is now ON. ...]"])
  assert.equal(restored.sessionStart, "2026-01-01T00:00:00.000Z")
  // display 已废弃：saveSession 不再写入 WYSIWYG 快照（TUI 恢复走 history 懒加载）
  assert.equal(restored.display, undefined)
  // 原子写不残留临时文件——直接探测本槽位的 .tmp 路径（O(1) existsSync）。
  // 不得扫描 ~/.thincoder/sessions/ 全目录：用户机上可达 3 万+文件（含数十 MB 大会话），
  // readdirSync 实测 18s（Defender 干扰放大，2026-08-31 本条 TODO 的真正慢因——不是 saveSession 本身）
  assert.ok(!existsSync(sessionPath(cwd) + ".tmp"), "原子写不残留 .tmp")
  // /new：分配新槽位，切换到空会话
  const newSlot = newSession(cwd)
  assert.ok(newSlot >= 1)
  const afterNew = loadSession(cwd)
  assert.equal(afterNew.history.length, 0)
  // 旧槽位文件仍然存在（内容未丢失）
  assert.ok(existsSync(sessionPath(cwd) + ".1"))
  // 清理
  const { unlinkSync } = await import("node:fs")
  for (let i = 1; i <= 5; i++) {
    try { unlinkSync(sessionPath(cwd) + "." + i) } catch {}
  }
  try { unlinkSync(sessionPath(cwd) + ".manifest") } catch {}
  try { unlinkSync(sessionPath(cwd)) } catch {}
})



test("session: 旧存档的前缀型临时上下文在加载时清理，cwd 不匹配拒绝恢复", async () => {
  const { loadSession, activePath, sessionPath } = await import("../src/session.mjs")
  const cwd = join(tmpdir(), "thincoder-session-legacy-" + Date.now())
  const p = activePath(cwd)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, JSON.stringify({
    version: 2,
    cwd,
    history: [
      { role: "user", content: "[System reminder: working directory snapshot:\nsrc/" },
      { role: "user", content: "真正的需求" },
    ],
    tasks: [],
  }), "utf8")
  const restored = loadSession(cwd)
  assert.equal(restored.history.length, 1)
  assert.equal(restored.history[0].content, "真正的需求")
  // cwd 不匹配 — 写到活动槽位
  writeFileSync(p, JSON.stringify({ version: 2, cwd: "D:\\other-project", history: [], tasks: [] }), "utf8")
  assert.equal(loadSession(cwd), null)
  // 清理
  const { unlinkSync } = await import("node:fs")
  try { unlinkSync(p) } catch {}
  try { unlinkSync(sessionPath(cwd)) } catch {}
  try { unlinkSync(sessionPath(cwd) + ".manifest") } catch {}
  for (let i = 1; i <= 5; i++) {
    try { unlinkSync(sessionPath(cwd) + "." + i) } catch {}
  }
})



test("session: 畸形 display 不影响启动（display 已废弃，loadSession 不再读取）", async () => {
  const { loadSession, activePath, sessionPath } = await import("../src/session.mjs")
  const cwd = join(tmpdir(), "thincoder-session-display-" + Date.now())
  const p = activePath(cwd)
  mkdirSync(dirname(p), { recursive: true })
  // 旧文件里的畸形 display 值：不再被读取/净化，恢复照常
  writeFileSync(p, JSON.stringify({ version: 2, cwd, history: [{ role: "user", content: "hi" }], tasks: [], display: "not-an-array" }), "utf8")
  const restored = loadSession(cwd)
  assert.equal(restored.history.length, 1)
  // display 不再被净化（透传），但恢复完全不依赖它
  assert.equal(restored.display, "not-an-array")
  // 清理
  const { unlinkSync } = await import("node:fs")
  try { unlinkSync(p) } catch {}
  try { unlinkSync(sessionPath(cwd)) } catch {}
  try { unlinkSync(sessionPath(cwd) + ".manifest") } catch {}
  for (let i = 1; i <= 5; i++) {
    try { unlinkSync(sessionPath(cwd) + "." + i) } catch {}
  }
})





test("session: newSession 分配槽位并记录元数据", async () => {
  const { saveSession, newSession, listSlots, sessionPath } = await import("../src/session.mjs")
  const cwd = join(tmpdir(), "thincoder-new-session-" + Date.now())
  const agent = {
    cwd,
    activeProvider: "kimi",
    provider: { name: "kimi", model: "kimi-k3" },
    history: [
      { role: "user", content: "帮我写一个登录页面" },
      { role: "assistant", content: "好的，这是一段 HTML..." },
      { role: "user", content: "加个暗色主题" },
      { role: "assistant", content: "已添加" },
    ],
    tasks: [],
    _pendingReminders: [],
  }
  saveSession(agent, [{ text: "line1", color: "dim" }])
  // 此时已有槽位 1（由 saveSession 创建）
  const slots1 = listSlots(cwd)
  assert.equal(slots1.length, 1)
  assert.equal(slots1[0].turnCount, 2)
  assert.equal(slots1[0].firstMessage, "帮我写一个登录页面")
  // /new 创建槽位 2
  const slot2 = newSession(cwd)
  assert.equal(slot2, 2)
  const slots2 = listSlots(cwd)
  assert.equal(slots2.length, 2)
  // 槽位 2 是活跃的，槽位 1 仍在
  const active = slots2.find((s) => s.isActive)
  assert.equal(active.slot, 2)
  const old = slots2.find((s) => s.slot === 1)
  assert.equal(old.turnCount, 2)
  // manifest 里有 active 指针
  const manifest = JSON.parse(readFileSync(sessionPath(cwd) + ".manifest", "utf8"))
  assert.equal(manifest.active, 2)
  assert.equal(typeof manifest.slots["1"], "object")
  assert.equal(manifest.slots["1"].turnCount, 2)
  // 清理
  const { unlinkSync } = await import("node:fs")
  for (let i = 1; i <= 5; i++) {
    try { unlinkSync(sessionPath(cwd) + "." + i) } catch {}
  }
  try { unlinkSync(sessionPath(cwd) + ".manifest") } catch {}
  try { unlinkSync(sessionPath(cwd)) } catch {}
})



test("session: renameSlot 改标题（槽位文件 + manifest 同步，VS Code 共享）", async () => {
  const { saveSession, renameSlot, listSlots, loadSession, sessionPath } = await import("../src/session.mjs")
  const cwd = join(tmpdir(), "thincoder-rename-slot-" + Date.now())
  const agent = {
    cwd,
    activeProvider: "kimi",
    provider: { name: "kimi", model: "kimi-k3" },
    history: [{ role: "user", content: "帮我写周报" }],
    tasks: [],
    _pendingReminders: [],
    title: "旧标题",
  }
  saveSession(agent, [])

  assert.equal(renameSlot(cwd, 1, "新标题"), true)
  // 槽位文件里的 title 更新
  const data = loadSession(cwd)
  assert.equal(data.title, "新标题")
  // listSlots 的元数据同步更新
  const slots = listSlots(cwd)
  assert.equal(slots[0].title, "新标题")
  // 无效槽位返回 false
  assert.equal(renameSlot(cwd, 99, "不存在"), false)

  // 清理
  const { unlinkSync } = await import("node:fs")
  for (let i = 1; i <= 5; i++) {
    try { unlinkSync(sessionPath(cwd) + "." + i) } catch {}
  }
  try { unlinkSync(sessionPath(cwd) + ".manifest") } catch {}
  try { unlinkSync(sessionPath(cwd)) } catch {}
})




test("session: listSlots 向后兼容旧格式 manifest（数字时间戳）", async () => {
  const { listSlots, sessionPath } = await import("../src/session.mjs")
  const cwd = join(tmpdir(), "thincoder-old-manifest-" + Date.now())
  // 手工写一个槽位文件和旧格式 manifest
  const { writeFileSync: wfs, mkdirSync: ms, unlinkSync } = await import("node:fs")
  ms(dirname(sessionPath(cwd)), { recursive: true })
  const slotFile = sessionPath(cwd) + ".1"
  wfs(slotFile, JSON.stringify({
    version: 2, cwd,
    activeProvider: "claude",
    history: [
      { role: "user", content: "重构 session 模块" },
      { role: "assistant", content: "分析中..." },
      { role: "user", content: "加个测试" },
      { role: "assistant", content: "已添加" },
    ],
    tasks: [],
  }), "utf8")
  // 旧格式：slots 值是数字时间戳
  const oldManifest = { slots: { "1": Date.now() } }
  wfs(sessionPath(cwd) + ".manifest", JSON.stringify(oldManifest), "utf8")
  // listSlots 应能从旧格式 manifest + 槽位文件中提取元数据
  const slots = listSlots(cwd)
  assert.equal(slots.length, 1)
  assert.equal(slots[0].slot, 1)
  assert.equal(slots[0].turnCount, 2)
  assert.equal(slots[0].messageCount, 4)
  assert.equal(slots[0].firstMessage, "重构 session 模块")
  assert.equal(slots[0].activeProvider, "claude")
  // 清理
  unlinkSync(sessionPath(cwd) + ".manifest")
  unlinkSync(slotFile)
  try { unlinkSync(sessionPath(cwd)) } catch {}
})



test("session: switchToSlot 指针切换（无文件拷贝）", async () => {
  const { saveSession, newSession, switchToSlot, sessionPath } = await import("../src/session.mjs")
  const cwd = join(tmpdir(), "thincoder-switch-digest-" + Date.now())
  // 创建会话 A（自动进入槽位 1）
  const agentA = {
    cwd,
    activeProvider: "deepseek",
    provider: { name: "deepseek", model: "deepseek-v4" },
    history: [
      { role: "user", content: "会话A第一条" },
      { role: "assistant", content: "回答A" },
    ],
    tasks: [],
    _pendingReminders: [],
  }
  saveSession(agentA, [{ text: "A", color: "dim" }])
  // /new 创建会话 B（槽位 2）
  newSession(cwd)
  const agentB = {
    cwd,
    activeProvider: "kimi",
    provider: { name: "kimi", model: "kimi-k3" },
    history: [
      { role: "user", content: "会话B第一条" },
      { role: "assistant", content: "回答B" },
    ],
    tasks: [],
    _pendingReminders: [],
  }
  saveSession(agentB, [{ text: "B", color: "dim" }])
  // 切回槽位 1 — 没有文件拷贝，只改 manifest.active
  const restored = switchToSlot(cwd, 1)
  assert.notEqual(restored, null)
  assert.equal(restored.history.length, 2)
  assert.equal(restored.history[0].content, "会话A第一条")
  // 清理
  const { unlinkSync } = await import("node:fs")
  for (let i = 1; i <= 5; i++) {
    try { unlinkSync(sessionPath(cwd) + "." + i) } catch {}
  }
  try { unlinkSync(sessionPath(cwd) + ".manifest") } catch {}
  try { unlinkSync(sessionPath(cwd)) } catch {}
})



test("session: applySession 恢复状态并按名切回 provider", async () => {
  const { applySession } = await import("../src/session.mjs")
  const agent = {
    activeProvider: "deepseek",
    provider: { name: "deepseek", model: "deepseek-v4-pro" },
    providers: [
      { name: "deepseek", model: "deepseek-v4-pro" },
      { name: "kimi", model: "kimi-k3" },
    ],
    history: [],
    tasks: [],
  }
  const data = {
    history: [{ role: "user", content: "hi" }],
    tasks: [{ title: "t", status: "in_progress" }],
    planMode: true,
    autoApprove: true,
    goal: { objective: "g" },
    activeProvider: "kimi",
  }
  const switched = applySession(agent, data)
  assert.equal(switched, true)
  assert.equal(agent.provider.model, "kimi-k3") // 切回上次使用的 provider
  assert.equal(agent.activeProvider, "kimi")
  assert.equal(agent.history.length, 1)
  assert.equal(agent.tasks[0].status, "in_progress")
  assert.equal(agent.planMode, true)
  assert.equal(agent.autoApprove, true) // AUTO 模式随会话恢复，与 history 账本里的 ON 提醒一致
  assert.equal(agent.goal.objective, "g")
})



test("session: applySession 未知 provider 名不回切", async () => {
  const { applySession } = await import("../src/session.mjs")
  const agent = {
    activeProvider: "deepseek",
    provider: { name: "deepseek", model: "deepseek-v4-pro" },
    providers: [{ name: "deepseek", model: "deepseek-v4-pro" }],
    history: [],
    tasks: [],
  }
  const switched = applySession(agent, { history: [], activeProvider: "已被删除的provider" })
  assert.equal(switched, false)
  assert.equal(agent.provider.model, "deepseek-v4-pro") // 保持当前配置
})

