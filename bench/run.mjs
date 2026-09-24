#!/usr/bin/env node
/**
 * bench/run.mjs — 模型基准套件入口（设计 §2.1 CLI 契约 / §2.7 复跑契约）。
 *
 * 一条命令：读参测清单 → 按题集逐维调模型（经核 provider 路径）→ 判分 + 计时 + 记账 → 落**报告对**（md + json）。
 *
 * 三条路径：
 * - 真实运行：`node bench/run.mjs [--models …] [--dims …] [--label …] [--n N] [--max-tokens N] [--timeout 秒]`
 * - 夹具自检：`--dry-run`（不调模型、不读用户 config；用本档内联固定响应表跑通判分→指标→报告→脱敏）
 * - 离线重算：`--recompute --from <结果.json>`（零 API；成本按**当前** prices.json 重算 ⇒ 新报告对）
 *
 * 退出码（§2.1-5）：0 = 跑完（模型用例失败不影响退出码——失败是数据不是错误）· 1 = 基建错误（参数错 /
 * 未知模型 / provider 缺配置 / 数据档不合 schema）· 130 = SIGINT（中止在飞调用、**不落档**）。
 * 编排本体在 `lib/pipeline.mjs`（run.mjs 超 300 行 ⇒ 按设计档 §3 拆分触发条件拆出）；夹具表仍住本档。
 */

import { pathToFileURL } from "node:url"
import { CAPABILITY_SELECTOR, DIMENSIONS, MANUAL_DIM } from "./cases/index.mjs"
import { recomputeMain, runMain } from "./lib/pipeline.mjs"

const USAGE = `用法：
  node bench/run.mjs [--models <列表>] [--dims <列表>] [--label <名>] [--n <次>] [--max-tokens <N>] [--timeout <秒>] [--dry-run]
  node bench/run.mjs --recompute --from <结果.json> [--label <名>]

  --models     参测模型（逗号分隔；条目 = models.json 的 label 或 provider:model）；缺省 = 清单全量
  --dims       选择器（逗号分隔：capability / 各维度键 / manual / speed / cost）；缺省 = 全跑 + 全轴
  --label      报告文件名标签（<日期>-<标签>.{md,json}）；缺省 run
  --n          每例重复次数（速度轴建议 3）；缺省 1
  --max-tokens 单次调用输出上限（可比性冻结面）；缺省 4096
  --timeout    单次调用墙钟上限（秒）；缺省 120
  --dry-run    夹具自检：不调模型、不读用户 config，跑通判分（含判官对 / 仲裁 / 复核夹具）→指标→报告→脱敏链路
  --recompute  离线重算：读入已有结果 JSON，以当前 prices.json 重出报告（零 API 调用）

  判官配置 = bench/judge.json（判官对 A / B + 分歧仲裁 C · 判官必备）：文件缺失 / 不合 schema /
  判官身份违约（A=B · 仲裁员 ∈ {A, B}）/ 冻结版本不匹配 ⇒ 拒跑（退出码 1）。
  判官可与被测重合（允许自判——不拒跑）：重合级别逐位明示于报告概览判官行（同位 / 同渠道 / 无重合）。`

// ── dry-run 内联夹具响应表（§3 冻结落点：夹具内联于本档） ──────────────────────────
// 每例 = 该用例的模型调用脚本（含工具环各轮）；ttft / total / tokens 全部取固定值 ⇒ 自检完全确定。
let fxSeq = 0
const fx = (text, [prompt, cached, completion], ttftMs, totalMs, extra = {}) => ({
  text, ttftMs, totalMs, tokens: { prompt, cached, completion }, ...extra,
})
const tool = (name, args) => ({ id: `call_fx_${++fxSeq}`, name, arguments: JSON.stringify(args) })
const ask = (text) => fx(text, [30, 0, 12], 260, 900)

const FIXTURE = {
  "reasoning.1": [fx("3", [24, 0, 1], 180, 420)],
  "reasoning.2": [fx("371281", [30, 0, 2], 200, 500)],
  "reasoning.3": [fx("9 不是质数，不能分解为两个质因数之积。", [32, 0, 14], 240, 700)],
  "code.1": [fx("function chunkEven(arr, size) {\n  if (size < 1) throw new RangeError(\"size must be >= 1\")\n  const out = []\n  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))\n  return out\n}", [40, 0, 60], 300, 1500)],
  "code.2": [fx("function sumEven(nums){ let t=0; for (let i=0; i<nums.length; i++){ if (nums[i]%2===0) t+=nums[i] } return t }", [90, 0, 40], 280, 1100)],
  "code.3": [fx("function parsePairs(text) {\n  const out = {}\n  for (const seg of String(text).split(\";\")) {\n    const i = seg.indexOf(\"=\")\n    if (i < 0) continue\n    out[seg.slice(0, i)] = seg.slice(i + 1)\n  }\n  return out\n}", [60, 0, 55], 310, 1400)],
  "json.1": [fx('{"name":"小明","age":9,"tags":["阅读","围棋"]}', [36, 0, 20], 220, 600)],
  "json.2": [fx('{"zip":"100001","note":null,"nested":{"items":[]},"escaped":"a\\"b"}', [44, 0, 22], 230, 640)],
  "json.3": [fx('{"status":"empty","count":0,"items":[]}', [40, 0, 14], 210, 560)],
  "tools.1": [fx("", [30, 0, 8], 190, 500, { toolCalls: [tool("get_time", {})], finishReason: "tool_calls" }), fx("现在是 2026-09-23 22:00。", [70, 0, 12], 250, 800)],
  "tools.2": [
    fx("", [34, 0, 8], 190, 520, { toolCalls: [tool("get_time", {})], finishReason: "tool_calls" }),
    fx("", [80, 0, 24], 260, 900, { toolCalls: [tool("send_email", { to: "alice@example.com", subject: "时间同步", body: "现在是 2026-09-23 22:00。" })], finishReason: "tool_calls" }),
    fx("邮件已发出。", [120, 0, 10], 240, 700),
  ],
  // 刻意回中文数字「十二个月」：机械判据（阿拉伯数字独立成词）判 FAIL，复核返回 overturn
  // —— 自检固定覆盖「复核翻案」渲染路径（改判 `pass` + `⟲` 标注；见 README「快速开始」注）
  "tools.3": [fx("一年有十二个月。", [26, 0, 12], 200, 480)],
  "tools.4": [
    fx("", [40, 0, 16], 260, 700, { toolCalls: [tool("get_weather", { city: "北京" }), tool("get_weather", { city: "上海" })], finishReason: "tool_calls" }),
    fx("北京晴 26℃，上海小雨 24℃。", [110, 0, 14], 280, 820),
  ],
  // 缺陷形态串（正文 3 段 + `---` + 自检块）：机械条全过（旧机械面读数「段落 4」⇒ fail）——`judge.13` 定点复现夹具
  "instructions.1": [fx("夜里的城市换上另一副面孔。楼宇的窗格次第亮起像有人在天幕上摆开一盘发光的棋子。\n\n霓虹从巷口一直烧到江边把湿漉漉的柏油路染成碎金。行人放慢脚步抬头看一眼又低头赶路。霓虹在雨里显得格外固执。\n\n远处塔吊的轮廓被灯串勾出台阶状的边。风从桥面吹过来带着水汽和烤红薯的甜味。整座城像一台刚进夜班的机器还在低声运转。\n\n---\n自检：正文三段 汉字数达标 未用逗号 霓虹出现两回 首字为夜", [30, 0, 120], 420, 3200)],
  // 缺陷形态串（正文 2 句 + `---` + 自检块）：机械三条全过（旧机械面句读数 3 ⇒ fail）——`judge.13` 定点复现夹具
  "instructions.2": [fx("会议时间调整为周三午后两点开始。相关材料务必在周二下班前提交截止。\n\n---\n自检：正文两句 每句均未超四十字 含截止一词 全文无阿拉伯数字", [34, 0, 30], 300, 900)],
  "instructions.3": [fx("两条要求互相冲突：含大写 PASS 就不可能做到不含任何大写字母。", [36, 0, 24], 280, 800)],
  "multiturn.1": [
    ask("请问收件人是谁？主题和会议时间也请给一下？"),
    fx("", [60, 0, 20], 250, 900, { toolCalls: [tool("send_email", { to: "team@example.com", subject: "周会", body: "明天 15:00 周会，请准时。" })], finishReason: "tool_calls" }),
    fx("邀请邮件已发出。", [96, 0, 10], 230, 700),
  ],
  "multiturn.2": [fx("1. 快得像一阵风 2. 快到只剩残影 3. 让等待彻底成为历史", [40, 0, 32], 300, 900)],
  "multiturn.3": [
    fx("", [40, 0, 18], 250, 850, { toolCalls: [tool("send_email", { to: "team@example.com", subject: "发布提醒", body: "明天上午十点发布。" })], finishReason: "tool_calls" }),
    fx("邮件已发送，时间定在明天上午十点。", [90, 0, 12], 240, 700),
  ],
  "longctx.1": [fx("49152", [2200, 0, 1], 900, 2600)],
  // 刻意回干扰值 57317（而非期望 57318）：自检固定覆盖「机械 FAIL + 复核 uphold」渲染路径
  "longctx.2": [fx("57317", [8800, 0, 1], 2400, 5200)],
  "longctx.3": [fx("42875", [4400, 0, 1], 1500, 3600)],
  "vision.1": [fx("红色", [420, 0, 2], 700, 1800)],
  "vision.2": [fx("绿色", [120, 0, 2], 500, 1200)],
  "vision.3": [fx("图中没有猫。", [430, 0, 6], 720, 1900)],
  manual: {
    "manual.1": [fx("还行，谢谢关心。", [20, 0, 8], 220, 600)],
    "manual.2": [fx("请问您指的是哪个功能？", [24, 0, 12], 240, 700)],
    "manual.3": [fx("我觉得挺有意思，可以说说你的想法。", [22, 0, 14], 230, 680)],
  },
}

// ── 判官 / 复核夹具脚本（§5.13 `fixture.1`：每个判官面用例有 A / B 脚本，机械面用例有复核脚本） ──────
// 逐位脚本（`slot` = A / B / C / review）；`text` = 该位返回的裁决 JSON（内容固定 ⇒ 自检完全确定）。
const jTok = (prompt, completion) => ({ prompt, cached: 0, completion })
const jv = (verdict, reason) => ({ text: JSON.stringify({ verdict, reason }), tokens: jTok(320, 40) })

FIXTURE.judge = {
  "reasoning.3": { A: [jv("pass", "夹具：指出 9 不是质数，正确识破前提陷阱。")], B: [jv("pass", "夹具：点明 9 非质数，符合 PASS。")] },
  "instructions.1": { A: [jv("pass", "夹具：正文 3 段，分隔线后的自检块不计入。")], B: [jv("pass", "夹具：正文段数 3，附注块已排除。")] },
  "instructions.2": { A: [jv("pass", "夹具：正文 2 句且均 ≤40 汉字，自检块不计入。")], B: [jv("pass", "夹具：正文句数 2，每句未超上限。")] },
  "instructions.3": { A: [jv("pass", "夹具：指出两条要求互斥。")], B: [jv("pass", "夹具：明确指认冲突。")] },
  "tools.2": { A: [jv("pass", "夹具：正文时刻 22:00 与工具返回值同一时刻。")], B: [jv("pass", "夹具：正文载明 22:00，时刻等价。")] },
  "tools.4": { A: [jv("pass", "夹具：同时传达北京晴、上海小雨。")], B: [jv("pass", "夹具：两城市天气齐。")] },
  "multiturn.1": { A: [jv("pass", "夹具：请求缺失信息且未声称已发送。")], B: [jv("pass", "夹具：向用户补全信息，未代决。")] },
  // 分歧样本（A / B 相异 ⇒ 触发第三判 C；多数决 ⇒ pass · resolution = arbitrated）
  "multiturn.2": {
    A: [jv("pass", "夹具：未提问且给出 3 个不同候选。")],
    B: [jv("fail", "夹具（刻意分歧）：候选仅列三项，判定证据不足。")],
    C: [jv("pass", "夹具（仲裁）：候选满足 ≥3 互不相同，维持通过。")],
  },
  "multiturn.3": { A: [jv("pass", "夹具：信息足够直接代决，未追问。")], B: [jv("pass", "夹具：回合 1 内发信，无多余追问。")] },
  // 位级失败样本（A 两次不可解析 ⇒ 有效判 < 2 ⇒ 合成分 error · 告警分列「有效判不足」）
  "longctx.3": {
    A: [{ text: "", tokens: jTok(320, 0) }, { text: "按判据应判通过。", finishReason: "stop", tokens: jTok(320, 20) }],
    B: [jv("pass", "夹具：以 42875 为当前值，符合 PASS。")],
  },
  "vision.1": { A: [jv("pass", "夹具：左上角为红色族。")], B: [jv("pass", "夹具：回答红色，符合 PASS。")] },
  "vision.2": { A: [jv("pass", "夹具：回答绿色族。")], B: [jv("pass", "夹具：绿色，符合 PASS。")] },
  "vision.3": { A: [jv("pass", "夹具：指出图中没有猫，拒答正确。")], B: [jv("pass", "夹具：明确拒答，无中生有已避免。")] },
}

/** 复核脚本（20 个机械面用例各一；`tools.3` = 翻案样本（机械判据只认阿拉伯数字），`longctx.2` = 维持样本）。 */
const rev = (verdict, reason) => [{ text: JSON.stringify({ verdict, reason }), tokens: jTok(380, 50) }]
const UPHOLD = rev("uphold", "夹具：机械判据成立，维持不通过。")
FIXTURE.review = {
  "reasoning.1": UPHOLD,
  "reasoning.2": UPHOLD,
  "code.1": UPHOLD,
  "code.2": UPHOLD,
  "code.3": UPHOLD,
  "json.1": UPHOLD,
  "json.2": UPHOLD,
  "json.3": UPHOLD,
  "tools.1": UPHOLD,
  "tools.2": UPHOLD,
  "tools.3": rev("overturn", "夹具：回答以中文数字给出正确答案（十二个月），机械判据只认阿拉伯数字 ⇒ 判据过严、误判。"),
  "tools.4": UPHOLD,
  "instructions.1": UPHOLD,
  "instructions.2": UPHOLD,
  "multiturn.1": UPHOLD,
  "multiturn.2": UPHOLD,
  "multiturn.3": UPHOLD,
  "longctx.1": UPHOLD,
  "longctx.2": rev("uphold", "夹具：回答为近邻干扰值 57317，非目标值 57318 ⇒ 维持机械判定。"),
  "longctx.3": UPHOLD,
}

// ── CLI 解析（§2.1） ──────────────────────────────────────────────────────────

function intArg(raw, flag, min) {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < min) throw new Error(`${flag} 需要 ≥${min} 的整数（得到：${raw}）`)
  return n
}

function parseArgs(argv) {
  const opts = {
    models: null, dims: null, label: null, repeats: 1, maxTokens: 4096,
    timeoutSec: 120, dryRun: false, recompute: false, from: null, help: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const need = () => {
      const v = argv[++i]
      if (v === undefined) throw new Error(`参数 ${a} 缺值`)
      return v
    }
    if (a === "--models") opts.models = need()
    else if (a === "--dims") opts.dims = need()
    else if (a === "--label") opts.label = need()
    else if (a === "--n") opts.repeats = intArg(need(), a, 1)
    else if (a === "--max-tokens") opts.maxTokens = intArg(need(), a, 1)
    else if (a === "--timeout") opts.timeoutSec = intArg(need(), a, 1)
    else if (a === "--from") opts.from = need()
    else if (a === "--dry-run") opts.dryRun = true
    else if (a === "--recompute") opts.recompute = true
    else if (a === "--help" || a === "-h") opts.help = true
    else throw new Error(`未知参数 ${a}（--help 看用法）`)
  }
  if (opts.recompute && !opts.from) throw new Error("--recompute 需要 --from <结果.json>")
  if (opts.from && !opts.recompute) throw new Error("--from 只与 --recompute 连用")
  if (opts.label != null && !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(opts.label)) {
    throw new Error(`--label 非法（须英文/数字/连字符）：${opts.label}`)
  }
  return opts
}

/** `--dims` 词表统一（§2.1-1）：能力项决定跑什么；`speed`/`cost` 决定报告轴。 */
function resolveDims(dimsArg) {
  const tokens = dimsArg ? String(dimsArg).split(",").map((s) => s.trim()).filter(Boolean) : []
  const valid = [...DIMENSIONS, MANUAL_DIM, CAPABILITY_SELECTOR, "speed", "cost"]
  const bad = tokens.filter((t) => !valid.includes(t))
  if (bad.length > 0) throw new Error(`--dims 含未知取值：${bad.join(", ")}（可用：${valid.join(", ")}）`)
  const cap = tokens.filter((t) => t === CAPABILITY_SELECTOR || t === MANUAL_DIM || DIMENSIONS.includes(t))
  const axes = tokens.filter((t) => t === "speed" || t === "cost")
  const runDims = new Set()
  if (cap.length === 0) {
    for (const d of DIMENSIONS) runDims.add(d) // 缺省 / 只给轴 ⇒ 全跑 8 自动维（manual 另定，见下行）
  } else {
    for (const t of cap) {
      if (t === CAPABILITY_SELECTOR) for (const d of DIMENSIONS) runDims.add(d)
      else if (t !== MANUAL_DIM) runDims.add(t)
    }
  }
  const runManual = tokens.length === 0 || cap.includes(MANUAL_DIM) // 人工 lane：显式点名，或（无 --dims 的）缺省全跑（§2.1-3）
  const finalAxes = axes.length > 0 ? axes : ["speed", "cost"]
  // `declared` = 用户打字面（缺省 = 展开写全）；能力轴的「出不出」看有无能力项（§2.1-1）
  const declared = tokens.length > 0 ? tokens : [CAPABILITY_SELECTOR, MANUAL_DIM, ...finalAxes]
  return { runDims, runManual, axes: finalAxes, declared, showCapability: cap.length > 0 }
}

/** 入口（导出供测试进程内调用；返回退出码，不自行 exit）。 */
export async function main(argv = process.argv.slice(2)) {
  let opts
  let sel
  try {
    opts = parseArgs(argv)
    if (!opts.help) sel = resolveDims(opts.dims)
  } catch (e) {
    console.error(`[bench] ${e.message}`)
    return 1
  }
  if (opts.help) {
    console.log(USAGE)
    return 0
  }
  try {
    if (opts.recompute) return await recomputeMain(opts)
    opts.label ??= "run" // 缺省标签（§2.1）；重算路径的缺省标签 = <原标签>-recalc（§2.7）
    return await runMain(opts, sel, FIXTURE)
  } catch (e) {
    console.error(`[bench] ${e.message}`)
    return 1
  }
}

export { FIXTURE }

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => { process.exitCode = code }).catch((e) => {
    console.error(`[bench] ${e?.stack ?? e}`)
    process.exitCode = 1
  })
}
