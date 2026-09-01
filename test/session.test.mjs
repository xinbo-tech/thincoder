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
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

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
