/**
 * prompts-async-guidance.test.mjs — AGENT-LOOP §7.7/§7.7.1（VSC 端）内容断言：
 * escalate/advisor/spawn 顶层一律异步——提示词与工具描述不引导 depth-0 async:false。
 * fail-when-unchanged 正向断言 + 反向断言（旧同步引导不复发）。
 * 纯文件读取 + 字符串匹配——无 io/网络——快层直跑。
 * 双端对拍：CLI test/prompts-async-guidance.test.mjs（各端独立断言自身文本；AC2 的
 * §14.2 断言在 CLI 侧——设计文档驻 CLI 仓）。
 */
import { test } from "node:test"
import assert from "node:assert"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(join(__here, "..", rel), "utf8")

// main.md escalate 段：从 escalate 工具 bullet 到下一个 bullet（- Terminology）
const vsMain = read("src/prompts/main.md")
const escSeg = vsMain.slice(vsMain.indexOf("- `subagent(action:'escalate', task)`"), vsMain.indexOf("- Terminology:"))

test("AC1/AC4 main.md escalate 段无 async:false 同步引导 + 纯异步正向陈述", () => {
  assert.doesNotMatch(escSeg, /wait for it synchronously/, "escalate 段: 同步句残留")
  assert.doesNotMatch(escSeg, /pass `?async: ?false`? when you must/, "escalate 段: sync 引导残留")
  assert.match(escSeg, /the report arrives automatically/, "escalate 段: 报告自动到（AC4 正向断言）")
  assert.match(escSeg, /never pass `?async: ?false`? at top level/, "escalate 段: 顶层禁 async:false 引导（与 spawn 段一致——AC1）")
})

test("AC3 subagent-spec 描述 Async spawn 段与 §7.5 锚句一致（双句逐字驻留）", () => {
  const desc = read("src/agent-tools/subagent-spec.mjs")
  // 锚句 2（§7.5 :258——顶层一律异步 + depth>0 平台 sync）
  assert.match(desc, /Top-level spawns are ALWAYS async — never pass `async:false` at depth-0 \(the report arrives automatically; if your next step needs it, end the turn and let the digest deliver it\)\. Inside subagents \(depth>0\) spawns are always synchronous \(platform rule\)\./, "Async spawn 段: 锚句 2 缺失")
  // 锚句 1（回合自然收尾——报告自动到）
  assert.match(desc, /After an async spawn the turn winds down normally — nothing expects you to wait for it/, "Async spawn 段: 锚句 1 缺失")
  // 旧引导不复发
  assert.doesNotMatch(desc, /Pass async:false only when you must handle the report synchronously/, "Async spawn 段: 旧同步引导残留")
  assert.doesNotMatch(desc, /use a synchronous spawn instead/, "Async spawn 段: 旧同步备选引导残留")
  assert.doesNotMatch(desc, /async:false is the only way to block/, "Async spawn 段: 旧同步理由残留")
})

test("subagent-spec 描述 escalate 段 + async 参数描述无同步引导", () => {
  const desc = read("src/agent-tools/subagent-spec.mjs")
  assert.doesNotMatch(desc, /pass `async:false` to wait for the report synchronously/, "escalate 段描述: sync 句残留")
  assert.doesNotMatch(desc, /when you must process the report before continuing/, "async 参数描述: sync 引导残留")
})

test("advisor 描述无 async:false 顶层同步引导（§7.7.1 advisor 面复核）", () => {
  const adv = read("src/agent-tools/advisor.mjs")
  assert.doesNotMatch(adv, /Pass async:false for a blocking review/, "advisor 参数描述: sync 引导残留")
})

test("engineering.md advisor 段无 async:false 同步句", () => {
  const eng = read("src/prompts/engineering.md")
  assert.doesNotMatch(eng, /Pass `async:false` only when you must block/, "engineering.md advisor 段: sync 句残留")
})

test("discipline.md escalate 行无 async:false 引导", () => {
  const disc = read("src/prompts/discipline.md")
  assert.doesNotMatch(disc, /async:false waits/, "discipline.md escalate 行: sync 引导残留")
})
