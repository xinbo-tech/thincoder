/**
 * 2026-09-30-crossline-clearance-core.test.mjs — 跨线清零批 · C 舱（核 ∕ 共享面）**批次本地件**
 * （住 `docs/batches/` · 不登记常驻套件 · 随批留存；格式先例 = `2026-09-29-*.test.mjs`）。
 * 运行（自 `thincoder/` 根）：`node --test docs/batches/2026-09-30-crossline-clearance-core.test.mjs`
 *
 * 腿（批档 §2.8 判据腿；本舱 = I10 ∕ I13 ∕ I16b/c——I14 归工程工具面，不在本件）：
 *   T-XL10a  结构机检：两端 import 核单源 ∕ 零第二分支（旧 `instanceof ContinueError` 与 `autoTurn` 续跑支退场）∕ 同源锁（reason = controller `signal.reason` 单源，零回退变体）。
 *   T-XL10b  三格样本对拍（ContinueError ∕ 中止 ∕ 正常）+ AUTO 不自续负锁 + 分派 token ⊆ 判定词表。
 *   T-XL10c  行数预算（§2.8 零越；含 I13 ∕ I16 面同拍）。
 *   T-XL13a  复合名入遮夹具格（修前红 = 明文）+ 负向锁（无害键 `maxTokens` 类不误遮）。
 *   T-XL13b  工具读面逐键：复合名值遮 ∕ 明文零出现 ∕ 无害键原值。
 *   T-XL16b  摘要对拍（直驱两端纯函数·字面逐字承 CLI）：成功面归一 + `verify` 支 + 族样本全等。
 *   T-XL16c  consult ∕ escalate 头词补模型段（样本经态机真形）+ 家族角色零回归。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
const at = (rel) => pathToFileURL(join(ROOT, rel)).href
const contentLines = (text) => { const a = text.split("\n"); if (a.length && a[a.length - 1] === "") a.pop(); return a.length }

const { continueDecision } = await import(at("thincoder-core/agent/continue-decision.mjs"))
const { ContinueError } = await import(at("thincoder-core/agent/helpers.mjs"))
const { isSensitiveKey, settingsTool, MASKED } = await import(at("thincoder-core/agent-tools/settings.mjs"))
const core = await import(at("thincoder-render-core/tool-summary.mjs"))
const cli = await import(at("thincoder-cli/src/tui/tool-summaries.mjs"))

const ENDS = ["thincoder-cli/src/tui/agent-turn.mjs", "thincoder-vscode/src/extension/panel-turn-loop.mjs"]

test("T-XL10a 结构：两端 import 核单源 ∕ 零第二分支（旧类判据与 autoTurn 续跑支退场）∕ 同源锁（reason = controller signal.reason）", () => {
  for (const rel of ENDS) {
    const src = read(rel)
    assert.ok(src.includes('from "@thincoder/core/agent/continue-decision.mjs"'), `${rel} 引核单源`)
    assert.match(src, /continueDecision\([a-zA-Z]+, \{[^}]*autoTurn[^}]*reason[^}]*\}/, `${rel} 接线调用（携 autoTurn ∕ reason）`)
    assert.ok(!/instanceof\s+ContinueError|\.name\s*===\s*"ContinueError"/.test(src), `${rel} 零第二分支：ContinueError 判定式退场`)
    assert.ok(!/if\s*\(\s*autoTurn\s*\)/.test(src), `${rel} 零第二分支：autoTurn 续跑支退场`)
  }
  // 同源锁（#677 修正轮 · 父裁 §1.13①）：中止 reason 判定两端同式 = 回合 controller `signal.reason`
  // 单源（VSC 去抛出物回退、与 CLI 同向；异信号窄边归一为 CLI 形——日后实证命中 ⇒ 二端同改另轮）。
  const cliSrc = read(ENDS[0])
  const vscSrc = read(ENDS[1])
  const line = (src, re) => src.split("\n").find((l) => re.test(l)) ?? ""
  const cliReason = line(cliSrc, /const reason\s*=/)
  const vscReason = line(vscSrc, /const abortReason\s*=/)
  assert.ok(cliReason.includes("state.controller?.signal?.reason"), "CLI reason 源 = controller signal.reason（单源）")
  assert.ok(vscReason.includes("panel._abortController?.signal?.reason"), "VSC reason 源 = controller signal.reason（单源）")
  assert.ok(!cliReason.includes("??") && !vscReason.includes("??"), "两调用点零 `??` 变体（无第二源回退）")
  assert.ok(!/\b(e|error|err)\??\.reason\b/.test(vscSrc), "VSC 零抛出物 `.reason` 回退（整档扫描）")
  assert.ok(!/reason\s*\?\?/.test(cliSrc) && !/reason\s*\?\?/.test(vscSrc), "两端零 `reason ??` 变体（整档扫描）")
})

test("T-XL10b 三格样本对拍：ContinueError ∕ 中止 ∕ 正常（含负锁与词表机检）", () => {
  const abortErr = Object.assign(new Error("aborted"), { name: "AbortError" })
  const cases = [
    [null, {}, "done"],                                                              // 正常完成
    [new ContinueError(7), {}, "ask"],                                               // 撞帽 · 人工档
    [new ContinueError(7), { autoTurn: true }, "cap-stop"],                          // 撞帽 · 无人值守档（D-TC15）
    [new ContinueError(7), { autoTurn: false, autoApprove: true }, "ask"],           // 负锁：AUTO 不自动批准续期（F8）
    [abortErr, {}, "stop"],                                                          // 中止 · 无 reason
    [abortErr, { reason: { interrupt: true } }, "stop"],                             // 中止 · 无 message 注入
    [abortErr, { reason: { interrupt: true, message: "inject" } }, "resume"],        // 中止 · Ctrl+I 续跑
    [new Error("provider down"), {}, "error"],                                       // 其余异常
    [new Error("provider down"), { reason: { abortTrigger: "stop" } }, "stop"],      // CLI 标尺：controller 已停 ⇒ 中止格
  ]
  for (const [err, opts, want] of cases) assert.equal(continueDecision(err, opts), want, `${err?.name ?? "null"} ${JSON.stringify(opts)}`)
  const vocab = new Set(["done", "cap-stop", "ask", "resume", "stop", "error"])
  for (const rel of ENDS) {
    const tokens = [...read(rel).matchAll(/decision === "([a-z-]+)"/g)].map((m) => m[1])
    assert.ok(tokens.length >= 4, `${rel} 分派点在场`)
    for (const t of tokens) assert.ok(vocab.has(t), `${rel} token=${t} ⊆ 判定词表`)
  }
})

test("T-XL10c·13c·16 行数预算（§2.8 预期增量零越）", () => {
  const caps = [
    ["thincoder-core/agent/continue-decision.mjs", 40],            // 新档 ≈40
    ["thincoder-cli/src/tui/agent-turn.mjs", 426],                 // 418 + ≤8
    ["thincoder-vscode/src/extension/panel-turn-loop.mjs", 317],   // 309 + ≤8
    ["thincoder-core/agent-tools/settings.mjs", 303],              // 293 + ≤10（骑线）
    ["thincoder-render-core/tool-summary.mjs", 142],               // 122 + 核件合计 ≤20
    ["thincoder-render-core/subblocks/activity-view.mjs", 205],    // 203 + 核件合计 ≤20
  ]
  for (const [rel, cap] of caps) assert.ok(contentLines(read(rel)) <= cap, `${rel} ≤ ${cap}`)
})

test("T-XL13a 段内复合敏感名入遮（夹具格——修前红=明文）+ 负向锁（无害键不误遮）", () => {
  const masked = [
    "demo.refreshToken", "demo.clientSecret", "demo.privateKey", "demo.accessToken", "demo.bearerToken", "demo.oauthToken",
    "providers.0.apiKey", "mcp.servers.0.headers.Authorization", "demo.token",
  ]
  for (const p of masked) assert.equal(isSensitiveKey(p), true, `${p} 应入遮`)
  const clean = ["demo.maxTokens", "demo.tokenCount", "demo.envTimeout", "demo.headersExtra", "demo.keyboard", "agent.maxTurns", "traces.enabled"]
  for (const p of clean) assert.equal(isSensitiveKey(p), false, `${p} 不误遮`)
})

test("T-XL13b 工具读面逐键：复合名值遮 ∕ 明文零出现 ∕ 无害键原值", async () => {
  const S1 = "sk-SENTINEL-REFRESH", S2 = "sk-SENTINEL-SECRET", S3 = "SENTINEL-PLAIN"
  const config = { demo: { refreshToken: S1, clientSecret: S2, maxTokens: S3 } }
  const tool = settingsTool({ configPath: join(tmpdir(), "crossline-core-settings-probe.json") }) // list/get 零写盘——路径仅占位
  const ctx = { agent: { config } }
  const out = await tool.execute({ action: "list" }, ctx)
  assert.ok(out.includes(`demo.refreshToken = ${MASKED}`) && out.includes(`demo.clientSecret = ${MASKED}`), "复合名值位遮罩")
  assert.ok(!out.includes(S1) && !out.includes(S2), "敏感哨兵零出现")
  assert.ok(out.includes(`demo.maxTokens = ${S3}`), "无害键原值")
  const got = await tool.execute({ action: "get", key: "demo.refreshToken" }, ctx)
  assert.ok(got.includes(MASKED) && !got.includes(S1), "get 值位遮罩")
})

test("T-XL16b 摘要对拍（直驱两端纯函数·字面逐字承 CLI）：成功面归一 + verify 支 + 族样本全等", () => {
  const pairs = [
    ["bash", "[stdout]:\nhello\n\n(exit code 0)"],
    ["bash", "[stdout]:\nboom\n[stderr]:\nERR text\n(exit code 3)"],
    ["bash", "[stdout]:\nfoo\n(killed: timeout 4000ms)"],
    ["bash", "[stdout]:\n(empty)\n(spawn failed)"],
    ["read", "123 lines"],
    ["write", "wrote 456 bytes"],
    ["grep", "a.mjs:1:x\nb.mjs:2:y"],
    ["glob", "a.mjs"],
    ["advisor", "No issues found"],
    ["mystery", "first line\nsecond"],
    ["verify", "Changed files: 2 files changed\n  \u2717 src/a.mjs\n\u2713 Tests passed.\nTask list: 1 done"],
  ]
  for (const [name, text] of pairs) assert.equal(core.formatToolSummary(name, text), cli.formatToolSummary(name, text), `${name} 对拍`)
  assert.equal(core.formatToolSummary("bash", pairs[0][1]), "bash: hello (exit code 0)", "成功面归一（修前 = `bash: hello`）")
  assert.ok(core.formatToolSummary("verify", pairs.at(-1)[1]).startsWith("verify: "), "verify 支落位（修前落默认支）")
  // 口径备注（评审 🔵）：CLI 标尺的状态位提取 = 全文任意位置匹配（`tool-summaries.mjs:63`），本端只认独立成行
  // （设计 `WEBVIEW.md:134`）——「非独立成行状态位」样本两端可不全等（既有残余，非本腿射程；单源登记在 §5）。
  // F-W16 保留形（在册：失败面无信号不读作 `(empty)`）——不入对拍等值集（CLI 侧含 `(empty)`，本端口径在册）
  assert.equal(core.formatToolSummary("bash", "[stdout]:\n(empty)\n(exit code 1)"), "bash: (exit code 1)")
})

test("T-XL16c consult ∕ escalate 头词补模型段（样本经态机真形）+ 家族角色零回归", async () => {
  const prevDoc = globalThis.document
  globalThis.document = {
    createElement: (tag) => ({
      tag, children: [], className: "", textContent: "", dataset: {},
      classList: { add() {}, remove() {} },
      appendChild(c) { this.children.push(c); return c },
    }),
  }
  try {
    const { subBlocksReduce } = await import(at("thincoder-render-core/subblocks/state.mjs"))
    const { refreshBlock } = await import(at("thincoder-render-core/subblocks/activity-view.mjs"))
    const headerOf = (role, model, pool) => {
      const { list } = subBlocksReduce([], { status: "started", role, id: 4, pool, model, startedAt: Date.now() })
      const summary = { children: [], replaceChildren() { this.children = [] }, appendChild(c) { this.children.push(c); return c } }
      const block = { _subMeta: list[0], open: true, isConnected: false, querySelector: (sel) => (sel === "summary" ? summary : null), appendChild() {} }
      refreshBlock(block)
      return summary.children[0].textContent
    }
    assert.ok(headerOf("consult", "glm-5.2", true).includes("[▶ consult#4 · glm-5.2 · "), "consult 头词携模型段")
    assert.ok(headerOf("escalate", "claude-opus-4.1", false).includes("[▶ escalate#4 · claude-opus-4.1 · "), "escalate 头词携模型段")
    assert.ok(headerOf("eng-coder", "glm-5.3", true).includes(" · glm-5.3 · "), "家族角色模型段零回归")
  } finally {
    globalThis.document = prevDoc
  }
})
