/**
 * test/suite.test.mjs — 题集注册表自检（id 唯一 / 类覆盖 / 隐藏用例 3–5）+ 三数据档 schema
 * + 判据面分层冻结（§2.10.2）+ 题面全量冻结与注记隔离（§5.13 `prompt.1/2`）+ 夹具覆盖（`fixture.1`）。
 * 手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI —— AC-8）。
 */

import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import {
  AXES, CAPABILITY_SELECTOR, CASES, DIMENSIONS, DIM_LABELS, JUDGE_FACE, MANUAL, MANUAL_DIM, MECH_FACE, SUITE_VERSION, casesForDims,
} from "../cases/index.mjs"
import { CODE_ASSERTS } from "../cases/code.mjs"
import { loadRoster, selectEntries } from "../lib/roster.mjs"
import { loadPrices } from "../lib/prices.mjs"
import { loadJudgeConfig } from "../lib/judge.mjs"
import { runCli } from "./fixtures.mjs"

const BENCH_DIR = dirname(dirname(fileURLToPath(import.meta.url)))
const counts = (list, key) => list.reduce((acc, x) => ({ ...acc, [x[key]]: (acc[x[key]] ?? 0) + 1 }), {})

/** 题面正本冻结清单（§5 逐字 · 28 条 = 25 自动例 + 3 人工条；改题须 `SUITE_VERSION + 1`）。 */
const FROZEN_PROMPTS = {
  "reasoning.1": "不使用计算器，计算 7^123 的个位数。只回答一个数字。",
  "reasoning.2": "计算 17^5 与 2^20 的差。只回答整数。",
  "reasoning.3": "9 是质数，请把它分解为两个质因数之积。只输出算式。",
  "code.1": "用 JavaScript 实现函数 `chunkEven(arr, size)`：把数组按 size 切分为多个子数组并返回二维数组；`size` 小于 1 时抛出 `RangeError`。公开例：`chunkEven([1,2,3,4,5], 2) → [[1,2],[3,4],[5]]`。只输出函数代码，不要示例调用与解释。",
  "code.2": "下面的函数在边界输入下行为不正确，请修复并只输出修复后的完整函数代码。\n\n```js\nfunction sumEven(nums){ let t=0; for (let i=1; i<nums.length; i++){ if (nums[i]%2===0 && nums[i]>0) t+=nums[i] } return t }\n```\n\n语义 = 求数组中所有偶数之和。",
  "code.3": "用 JavaScript 实现函数 `parsePairs(text)`：`text` 形如 `\"a=1;b=2\"`，返回 `{a:\"1\", b:\"2\"}`；规则①空串 → `{}`；②重复键 → 后者覆盖；③不含 `=` 的段 → 跳过；④值保持字符串。公开例：`parsePairs(\"a=1;b=2\") → {a:\"1\", b:\"2\"}`。只输出函数代码。",
  "json.1": "只输出一个 JSON 对象（不要代码围栏、不要任何解释）：字段 `name`（字符串）= \"小明\"、`age`（整数）、`tags`（字符串数组，至少 2 个元素）。",
  "json.2": "只输出一个 JSON 对象（不要代码围栏、不要任何解释）：`zip` 必须是字符串 \"100001\"（保持前导零）；`note` 必须为 `null`；`nested.items` 必须是长度 0 的数组；`escaped` 必须等于含一个双引号的字符串 `a\"b`。",
  "json.3": "只输出一个 JSON 对象（不要代码围栏、不要任何解释）：`status` 必须是小写字面 `empty`；`count` 必须是数字 0（不是字符串 \"0\"）；`items` 必须是空数组。这是空快照格式，不要填任何实际数据。",
  "tools.1": "用可用工具查一下当前时间，然后用一句话告诉我。",
  "tools.2": "先用工具查当前时间，再把该时间作为正文，给 alice@example.com 发一封主题为「时间同步」的邮件。",
  "tools.3": "请回答：一年有几个月？",
  "tools.4": "请在同一轮里并行调用两个工具，分别查北京和上海的天气。",
  "instructions.1": "写一段关于「城市夜景」的短文。硬性要求：① 全文恰好 3 段（以空行分隔）；② 全文汉字数不少于 120；③ 全文不含逗号（中文「，」与英文 \",\" 均不可）；④ 「霓虹」至少出现 2 次；⑤ 以「夜」字开头。",
  "instructions.2": "写一条会议变更通知。硬性要求：① 全文恰好 2 句（以「。」分隔）；② 每句汉字数不超过 40；③ 必须含「截止」；④ 全文不含任何阿拉伯数字；⑤ 全文不含「请」字。",
  "instructions.3": "请写一句话。硬性要求：① 必须包含英文大写单词 PASS；② 全文不得包含任何大写字母。",
  "multiturn.1": "帮我给团队发一封会议邀请邮件。",
  "multiturn.2": "我要一句面向开发者的口号，主题是「快」。不要问我问题，直接给 3 个候选。",
  "multiturn.3": "给 team@example.com 发一封主题「发布提醒」的邮件，时间你替我定一个合适的。",
  "longctx.1": "8K 字符长文；埋「服务 atlas 的监听端口是 49152」。问：文中提到的服务 atlas 的监听端口是多少？只回答数字。",
  "longctx.2": "32K 字符长文；埋「服务 beacon 的监听端口是 57318」，另布置近邻数字干扰（57317、57310 等）。问句同上（服务 beacon）。",
  "longctx.3": "16K 字符长文：先出现「服务 helios 的历史端口是 40001（已废弃）」，后出现「服务 helios 当前监听端口是 42875」。问：服务 helios **当前**的监听端口是多少？",
  "vision.1": "64×64 四象限图（左上红 #ff0000 / 右上蓝 / 左下绿 / 右下黄）。问：图片被分成四个象限，请只回答左上角象限的颜色。",
  "vision.2": "32×32 纯色图（纯绿 #00aa00）。问：这张图是什么颜色？只回答颜色名。",
  "vision.3": "64×64 四象限图同 `vision.1`。问：图里有几只猫？",
  "manual.1": "最近怎么样？",
  "manual.2": "帮我把那个东西改一下。",
  "manual.3": "这个功能有点意思，你觉得呢？",
}

/** 注记隔离闭词表（§5.13 `prompt.2`；扩表 ⇒ `SUITE_VERSION + 1`）。 */
const NOTE_WORDS = ["指代不明", "对象不明", "测点", "测试点", "内部注记", "陷阱题"]
const notesIn = (text) => NOTE_WORDS.filter((w) => String(text).includes(w))

test("SUITE_VERSION = 单源整数（KD-2）；judge.json 冻结绑定同值（§2.10.3）", () => {
  assert.equal(Number.isInteger(SUITE_VERSION), true)
  assert.ok(SUITE_VERSION >= 1)
  assert.equal(SUITE_VERSION, 3, "本批：判官化 + 题面修正 + 判官身份冻结 = 2 → 3")
  assert.equal(loadJudgeConfig(join(BENCH_DIR, "judge.json")).frozenAtSuiteVersion, SUITE_VERSION)
})

test("用例 id 全局唯一、与维度一致；8 自动维齐；共 25 例", () => {
  assert.equal(CASES.length, 25, "设计 §1.4：自动判分 25 例")
  const ids = CASES.map((c) => c.id)
  assert.equal(new Set(ids).size, ids.length, "id 必须唯一")
  for (const c of CASES) {
    assert.equal(c.id.split(".")[0], c.dim, `${c.id} 的 id 前缀应等于维度`)
    assert.ok(DIMENSIONS.includes(c.dim), `未知维度 ${c.dim}`)
  }
  assert.deepEqual([...new Set(CASES.map((c) => c.dim))].sort(), [...DIMENSIONS].sort(), "每个自动维都要有用例")
  assert.equal(DIMENSIONS.length, 8)
  assert.equal(AXES.length, 2)
  assert.equal(CAPABILITY_SELECTOR, "capability")
  assert.equal(DIM_LABELS[MANUAL_DIM] !== undefined, true)
})

test("类覆盖：每维 正常/边界/错误 各 ≥1（tool 维 2/1/1，§1.4）", () => {
  const expected = {
    reasoning: { normal: 1, boundary: 1, error: 1 },
    code: { normal: 1, boundary: 1, error: 1 },
    json: { normal: 1, boundary: 1, error: 1 },
    tools: { normal: 2, boundary: 1, error: 1 },
    instructions: { normal: 1, boundary: 1, error: 1 },
    multiturn: { normal: 1, boundary: 1, error: 1 },
    longctx: { normal: 1, boundary: 1, error: 1 },
    vision: { normal: 1, boundary: 1, error: 1 },
  }
  for (const dim of DIMENSIONS) {
    const got = counts(CASES.filter((c) => c.dim === dim), "class")
    assert.deepEqual(got, expected[dim], `${dim} 的类覆盖不符`)
  }
})

test("用例对象字段（§2.6 冻结）：prompt / callOpts / grade 齐；判官面有 judge；机械面有 mechRubric", () => {
  for (const c of CASES) {
    assert.equal(typeof c.prompt, "string")
    assert.ok(c.prompt.length > 0, `${c.id} 题面为空`)
    assert.equal(typeof c.grade, "function", `${c.id} 缺判分函数`)
    assert.equal(typeof c.callOpts, "object")
    assert.ok(c.build === null || c.build === undefined || typeof c.build === "function")
    assert.ok(["normal", "boundary", "error"].includes(c.class))
    if (c.judge) {
      assert.equal(Number.isInteger(c.judge.turn), true, `${c.id} judge.turn 必填（回合精确）`)
      assert.equal(c.judge.turn >= 0, true)
      assert.equal(typeof c.judge.rubric, "string")
      assert.ok(c.judge.rubric.length > 0, `${c.id} 缺 judge.rubric`)
      if (c.judge.question != null) assert.equal(typeof c.judge.question, "string")
    }
    if (c.mechRubric != null) assert.equal(typeof c.mechRubric, "string")
  }
  // 每个用例至少有一个判据面（机械 / 判官）；两者皆无 ⇒ 判据缺失
  for (const c of CASES) assert.ok(c.mechRubric || c.judge, `${c.id} 无任何判据面`)
})

test("判据面分层冻结（§2.10.2）：判官面 11 例 / 机械面 20 例 / 纯判官面 5 例；集合与声明派生一致", () => {
  const judge = [...JUDGE_FACE].sort()
  const mech = [...MECH_FACE].sort()
  assert.deepEqual(judge, [
    "instructions.3", "longctx.3", "multiturn.1", "multiturn.2", "multiturn.3",
    "reasoning.3", "tools.2", "tools.4", "vision.1", "vision.2", "vision.3",
  ], "判官面 11 例（§2.10.2 分层表）")
  assert.equal(mech.length, 20, "机械面 20 例（§2.10.2 分层表末列 ✓ 的行）")
  const pure = judge.filter((id) => !mech.includes(id))
  assert.deepEqual(pure.sort(), ["instructions.3", "reasoning.3", "vision.1", "vision.2", "vision.3"], "纯判官面 5 例")
  const mixed = judge.filter((id) => mech.includes(id))
  assert.deepEqual(mixed.sort(), ["longctx.3", "multiturn.1", "multiturn.2", "multiturn.3", "tools.2", "tools.4"], "混合面 6 例")
})

test("多轮 / 构造型用例的判官题面口径（§2.6）：question 含 followUps 逐字；构造型 question = 实际问句", () => {
  const byId = (id) => CASES.find((c) => c.id === id)
  const mt1 = byId("multiturn.1")
  const followUps = mt1.build().followUps
  for (const f of followUps) assert.ok(mt1.judge.question.includes(f), "多轮 question 须逐字包含 followUps 各条")
  assert.ok(mt1.judge.question.startsWith(mt1.prompt), "多轮 question = prompt + followUps 逐字拼接")
  const L = byId("longctx.3")
  assert.equal(L.judge.question, "服务 helios 当前的监听端口是多少？只回答数字。")
  assert.ok(byId("vision.3").judge.question === "图里有几只猫？")
  // 静态用例 question 缺省 = prompt（§2.6）
  assert.equal(byId("reasoning.3").judge.question, undefined)
})

test("隐藏用例纪律（AC-5 / KD-3）：code 三例各 3–5 条隐藏断言，题面零泄漏", () => {
  for (const id of ["code.1", "code.2", "code.3"]) {
    const n = (CODE_ASSERTS[id].match(/__check\(/g) ?? []).length
    assert.ok(n >= 3 && n <= 5, `${id} 隐藏断言 ${n} 条（须 3–5）`)
    const caseObj = CASES.find((c) => c.id === id)
    assert.ok(!caseObj.prompt.includes("__check"), `${id} 题面泄漏隐藏断言`)
    assert.ok(!caseObj.prompt.includes("隐藏"), `${id} 题面提及隐藏用例`)
  }
})

test("人工 lane：3 条、无判分函数（AC-6 结构判据）、不入能力矩阵；无判官 / 复核面", () => {
  assert.equal(MANUAL.length, 3)
  for (const m of MANUAL) {
    assert.equal(typeof m.promptId, "string")
    assert.equal(typeof m.prompt, "string")
    assert.equal("grade" in m, false, "人工 lane 不得携带判分函数")
    assert.equal("judge" in m, false, "人工 lane 不判分（无判官面）")
  }
  assert.equal(DIMENSIONS.includes(MANUAL_DIM), false, "manual 不是自动维度（`capability` 不含它）")
  assert.equal(casesForDims(new Set(DIMENSIONS)).length, CASES.length)
})

test("prompt.1：全量题面逐字冻结（25 自动例 + 3 人工条 = 28 条）——改题须 SUITE_VERSION + 1", () => {
  const ids = [...CASES.map((c) => c.id), ...MANUAL.map((m) => m.promptId)]
  assert.equal(ids.length, 28)
  assert.deepEqual(ids.filter((id) => !(id in FROZEN_PROMPTS)), [], "冻结清单缺条目")
  assert.equal(Object.keys(FROZEN_PROMPTS).length, 28, "冻结清单恰 28 条")
  for (const [id, text] of Object.entries(FROZEN_PROMPTS)) {
    const live = CASES.find((c) => c.id === id) ?? MANUAL.find((m) => m.promptId === id)
    assert.equal(live.prompt, text, `${id} 题面与冻结正本不符（改题须 bump SUITE_VERSION）`)
  }
})

test("prompt.2：注记隔离（闭词表）+ 反例控制（反例串必须被判红）", () => {
  assert.ok(notesIn("帮我把那个东西改一下。（指代不明）").length > 0, "反例串必须被判红（守卫有效性）")
  assert.ok(notesIn("（对象不明）这个功能有点意思").length > 0, "反例串二")
  for (const [id, text] of Object.entries(FROZEN_PROMPTS)) {
    assert.deepEqual(notesIn(text), [], `${id} 冻结题面含设计侧注记`)
    const live = CASES.find((c) => c.id === id) ?? MANUAL.find((m) => m.promptId === id)
    assert.deepEqual(notesIn(live.prompt), [], `${id} 实现档题面含设计侧注记`)
  }
})

test("judge.json：三槽 schema + 身份机检（A≠B · 仲裁员第三方）+ 预算 / 超时区间", () => {
  const cfg = loadJudgeConfig(join(BENCH_DIR, "judge.json"))
  assert.equal(cfg.judges.length, 2, "判官对恰 2 位")
  assert.ok(cfg.arbiter, "仲裁员必备（无仲裁跑法不存在）")
  assert.notEqual(cfg.judges[0].model, cfg.judges[1].model, "A ≠ B（同模型双判无冗余）")
  for (const s of [cfg.judges[0], cfg.judges[1], cfg.arbiter]) {
    assert.equal(typeof s.provider, "string")
    assert.ok(s.provider.length > 0)
    assert.ok(s.maxTokens >= 1024 && s.maxTokens <= 8192, "预算区间 [1024, 8192]")
    assert.ok(s.timeoutSec >= 5 && s.timeoutSec <= 120, "超时区间 [5, 120]")
  }
  assert.ok(![cfg.judges[0].model, cfg.judges[1].model].includes(cfg.arbiter.model), "仲裁员 ≠ A / B")
})

test("models.json：schema 通过；条目可解析；label 文件名安全", () => {
  const roster = loadRoster(join(BENCH_DIR, "models.json"))
  assert.ok(roster.models.length >= 1)
  for (const m of roster.models) {
    assert.match(m.label, /^[A-Za-z0-9][A-Za-z0-9._-]*$/)
    assert.ok(m.provider.length > 0 && m.model.length > 0)
  }
  const one = selectEntries(roster, roster.models[0].label)
  assert.equal(one.length, 1)
  const byKey = selectEntries(roster, `${roster.models[0].provider}:${roster.models[0].model}`)
  assert.equal(byKey[0].label, roster.models[0].label)
  assert.throws(() => selectEntries(roster, "no-such-model"), /未知模型/)
})

test("models.json：schema fail-closed（label 非法 / provider 缺失 / 未知维度 ⇒ 装载即拒）", () => {
  const dir = mkdtempSync(join(tmpdir(), "bench-roster-"))
  const write = (name, obj) => {
    const p = join(dir, name)
    writeFileSync(p, JSON.stringify(obj), "utf8")
    return p
  }
  assert.throws(() => loadRoster(write("a.json", { models: [{ label: "bad label", provider: "p", model: "m" }] })), /label 非法/)
  assert.throws(() => loadRoster(write("b.json", { models: [{ label: "ok", model: "m" }] })), /provider 缺失/)
  assert.throws(() => loadRoster(write("c.json", { models: [{ label: "ok", provider: "p", model: "m", dims: ["nope"] }] })), /未知维度/)
  assert.throws(() => loadRoster(write("d.json", { models: [] })), /非空数组/)
})

test("prices.json：schema 通过；每条可回溯（asOf + source）；单位 = 元/百万 token", () => {
  const prices = loadPrices(join(BENCH_DIR, "prices.json"))
  assert.equal(prices.currency, "CNY")
  assert.equal(prices.unit, "元 / 百万 token")
  assert.ok(prices.entries.length >= 1)
  for (const e of prices.entries) {
    assert.match(e.match, /^[^:]+:.+$/, `match 须为 provider:model 形态：${e.match}`)
    assert.equal(typeof e.input, "number")
    assert.equal(typeof e.output, "number")
    assert.ok((e.source ?? prices.source).length > 0, `${e.match} 缺 source`)
    assert.match(e.asOf ?? prices.asOf, /^\d{4}-\d{2}-\d{2}$/, `${e.match} 缺 asOf`)
  }
})

test("prices.json：无孤儿条目（每条价格至少命中一个在册条目 **或** 任一位判官键——§2.10.5）", () => {
  const roster = loadRoster(join(BENCH_DIR, "models.json"))
  const prices = loadPrices(join(BENCH_DIR, "prices.json"))
  const cfg = loadJudgeConfig(join(BENCH_DIR, "judge.json"))
  const judgeKeys = [cfg.judges[0], cfg.judges[1], cfg.arbiter].map((s) => `${s.provider}:${s.model}`)
  const key = (m) => `${m.provider}:${m.model}`
  const hit = (pattern, k) => {
    if (pattern === k) return true
    if (!pattern.includes("*")) return false
    return new RegExp(`^${pattern.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`).test(k)
  }
  const keys = [...roster.models.map(key), ...judgeKeys]
  const orphans = prices.entries.filter((e) => !keys.some((k) => hit(e.match, k))).map((e) => e.match)
  assert.deepEqual(orphans, [], `以下价格条目命不中在册模型或判官键（孤儿数据）：${orphans.join(", ")}`)
})

test("fixture.1：dry-run 夹具覆盖（判官面 A / B（分歧样本 + C）/ 机械面复核脚本）+ 全链路零网络", async () => {
  const { FIXTURE } = await import("../run.mjs")
  const missing = JUDGE_FACE.filter((id) => {
    const s = FIXTURE.judge?.[id]
    return !s || !Array.isArray(s.A) || s.A.length === 0 || !Array.isArray(s.B) || s.B.length === 0
  })
  assert.deepEqual(missing, [], `以下判官面用例缺 A / B 夹具脚本：${missing.join(", ")}`)
  assert.ok(Object.values(FIXTURE.judge).some((s) => Array.isArray(s.C) && s.C.length > 0), "夹具须含分歧样本的 C 脚本")
  const missReview = MECH_FACE.filter((id) => !Array.isArray(FIXTURE.review?.[id]) || FIXTURE.review[id].length === 0)
  assert.deepEqual(missReview, [], `以下机械面用例缺复核夹具脚本：${missReview.join(", ")}`)
  for (const [id, s] of Object.entries(FIXTURE.judge)) {
    for (const slot of ["A", "B", "C"]) {
      for (const e of s[slot] ?? []) assert.equal(typeof e.text, "string", `${id} ${slot} 条目缺 text`)
    }
  }
  const orig = globalThis.fetch
  let calls = 0
  globalThis.fetch = () => { calls++; throw new Error("network disabled by test") }
  let r
  try {
    r = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--dims", "vision,reasoning", "--label", `fixture-${process.pid}`])
  } finally { globalThis.fetch = orig }
  assert.equal(r.code, 0, r.out)
  assert.equal(calls, 0, "dry-run 全链路零网络（夹具判官 / 复核亦不触网）")
})

test("25 例 + 3 人工条各有一段固定响应脚本（防题集增例后静默耗尽）", async () => {
  const { FIXTURE } = await import("../run.mjs")
  const missing = CASES.filter((c) => !Array.isArray(FIXTURE[c.id]) || FIXTURE[c.id].length === 0).map((c) => c.id)
  assert.deepEqual(missing, [], `以下用例缺 dry-run 夹具：${missing.join(", ")}`)
  for (const m of MANUAL) {
    assert.ok(Array.isArray(FIXTURE.manual?.[m.promptId]) && FIXTURE.manual[m.promptId].length > 0, `${m.promptId} 缺夹具`)
  }
})
