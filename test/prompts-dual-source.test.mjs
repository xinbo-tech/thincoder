/**
 * prompts-dual-source.test.mjs — eng-designer 双源 + 第 9 批锚测试（第 13 批 D-2——自同目录 async
 * 引导测试档 `:420`–EOF **逐字迁出**；用例守恒 53 = 42 + 11；拆法见 ENGINEERING-MODE.md §2.26.3）。
 *
 * 断言对象 = 双源提示词（`src/prompts/` 英文落地 + `docs/design/prompts/` 中文权威）：
 *   - 第 2 批锚（ENGINEERING-MODE §2.15/§2.16/§2.19）——AC21–AC25（T37/T38/T42）
 *   - 第 9 批锚（PROMPT-REVIEW-ORDER——ADVISOR-CONVERGENCE §13）——T-RO1–T-RO6
 * 头部自持（零跨档 import——D-2 契约）：imports + read/exists 助手 + 语料读取 + NEW_PROMPTS 常量；
 * 断言逐字搬移（零改/零增/零删）。纯文件读取 + 字符串匹配——快层 glob 自动发现直跑。
 */
import { test } from "node:test"
import assert from "node:assert"
import { readFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(join(__here, "..", rel), "utf8")
const exists = (rel) => existsSync(join(__here, "..", rel))

// 新 15 文件全集（PROMPT-SYSTEM §2 命名法——AC21 断言面：designer 档须在册）
const NEW_PROMPTS = [
  "persona-engineering.md", "persona-normal.md", "persona-eng-coder.md", "persona-eng-designer.md",
  "persona-explore.md", "persona-coder.md", "persona-plan.md",
  "common.md", "discipline-engineering.md", "discipline-normal.md",
  "consult-base.md", "advisor-design.md", "advisor-round1.md", "advisor-round2.md", "advisor-round3.md",
]
const pe = read("src/prompts/persona-engineering.md")
const de = read("src/prompts/discipline-engineering.md")
const dn = read("src/prompts/discipline-normal.md")

// ─────────────────────────────────────────────────────────────────────────────
// 第 2 批锚（ENGINEERING-MODE §2.15/§2.16/§2.19）：eng-designer 角色 + 行为纪律 + 文档更新纪律。
// 口径 = AC21/AC22/AC23/AC24/AC25（T37/T38/T42）：**双源在位 + fail-when-unchanged**。
// ─────────────────────────────────────────────────────────────────────────────
const pdes = read("src/prompts/persona-eng-designer.md")
const pdesZh = read("docs/design/prompts/persona-eng-designer.md")
const psubEn = read("src/prompts/persona-eng-coder.md")
const psubZh = read("docs/design/prompts/persona-eng-coder.md")
const deZh = read("docs/design/prompts/discipline-engineering.md")
const peZh = read("docs/design/prompts/persona-engineering.md")
const DE_PAIR = [["src（英文落地）", de], ["docs/design/prompts（中文权威）", deZh]]

test("AC21 新槽文件双源齐备 + 已入 NEW_PROMPTS（首行头注合格式——漏入则格式/宽行断言不覆盖）", () => {
  assert.ok(NEW_PROMPTS.includes("persona-eng-designer.md"), "已入 NEW_PROMPTS（15 文件全集）")
  assert.ok(exists("src/prompts/persona-eng-designer.md"), "英文落地位")
  assert.ok(exists("docs/design/prompts/persona-eng-designer.md"), "中文权威位")
  assert.match(pdes.split("\n")[0], /^<!-- slot:\[1\] consumers:\[.+\] -->$/, "英文落地头注格式")
  assert.match(pdesZh.split("\n")[0], /^<!-- 槽位:\[1\] 消费方:\[.+\] -->$/, "中文权威头注格式")
})

test("AC22① 四条行为纪律句双源驻留（六段自写·一段一作者 / 执行者拒收 / 澄清必经主 agent / 三方条目一致）", () => {
  for (const [name, doc] of DE_PAIR) {
    assert.ok(doc.includes("**六段自写 · 一段一作者**"), `${name}: 六段自写纪律句缺失`)
    assert.ok(doc.includes("§1 主 agent / §2 eng-designer / §3 评审子代理 / §4 主 agent / §5 eng-coder / §6 父代理"), `${name}: 一段一作者段归属枚举缺失`)
    assert.ok(doc.includes("**执行者拒收**"), `${name}: 执行者拒收句缺失`)
    assert.ok(doc.includes("不执行、打回"), `${name}: 拒收动作句缺失`)
    assert.ok(doc.includes("**澄清必经主 agent**"), `${name}: 澄清必经主 agent 句缺失`)
    assert.ok(doc.includes("子代理撞到需要用户决定的事") && doc.includes("打回主代理") && doc.includes("无旁路"), `${name}: 打回主代理/无旁路句缺失`)
    assert.ok(doc.includes("**三方条目一致**"), `${name}: 三方一致句缺失`)
    assert.ok(doc.includes("批次档 §2 本批条目 = 设计档验收标准回指的条目 = 需求档条目"), `${name}: 三方条目等式缺失`)
  }
  // 角色侧归属（一段一作者的分段自写——persona 各写己段）
  assert.ok(pdes.includes("**§2 you**"), "designer-src: §2 自写归属缺失")
  assert.ok(pdesZh.includes("**§2 你**"), "designer-zh: §2 自写归属缺失")
  for (const [name, doc] of [["coder-src", psubEn], ["coder-zh", psubZh]]) {
    assert.ok(doc.includes("**§5 你**"), `${name}: coder 侧 §5 自写归属缺失`)
    assert.ok(doc.includes("**执行者拒收**"), `${name}: coder 侧执行者拒收缺失`)
  }
  assert.ok(pdes.includes("**执行者拒收**") && pdesZh.includes("**执行者拒收**"), "designer 侧执行者拒收缺失")
})

test("AC22② 四步流程三句（设计=需求检验 / 需求缺口停报链 / 写权句）双源驻留", () => {
  for (const [name, doc] of DE_PAIR) {
    assert.ok(doc.includes("设计 = 对需求的检验——设计写不出来的地方，就是需求没说清的地方（回问，不自己补）"), `${name}: 定位句缺失`)
    assert.ok(doc.includes("勘察发现需求说不通 / 与实现冲突 / 归属不明 → **停下打回主 agent**，不自行选一种解释往下写"), `${name}: 需求缺口停报链句缺失`)
    assert.ok(doc.includes("设计档与需求档由 eng-designer 写作（含修订）；主 agent 记批次档、核验设计稿、发起评审"), `${name}: 写权句缺失`)
  }
})

test("AC22③ 文档更新纪律三句（D2 单一权威源 / D5 冻结窗口 / D6 回读核对）双源驻留 + D1–D7 全表", () => {
  for (const [name, doc] of DE_PAIR) {
    assert.ok(doc.includes("**D2 单一权威源** — 一条机制**只在一处详述**，其余处**只引用不重述**"), `${name}: D2 句缺失`)
    assert.ok(doc.includes("**D5 冻结窗口** — **评审在途不改被审文档**（改了 = 评审对象已变 → stale，token 不签发）"), `${name}: D5 句缺失`)
    assert.ok(doc.includes("**D6 回读核对** — 任何写入后**回读核实**再报完成"), `${name}: D6 句缺失`)
    for (const d of ["D1", "D2", "D3", "D4", "D5", "D6", "D7"]) {
      assert.ok(doc.includes(`**${d} `), `${name}: 纪律表 ${d} 缺失（七条齐全）`)
    }
  }
})

test("AC23 主 agent 人格已改述（双源：产品经理/会话面 + 调用链；不再自称设计文档交付者）", () => {
  for (const [name, doc] of [["src", pe], ["zh", peZh]]) {
    assert.ok(doc.includes("产品经理"), `${name}: 产品经理身份缺失`)
    assert.ok(doc.includes("流程编排者"), `${name}: 流程编排者身份缺失`)
    assert.ok(doc.includes("调用链"), `${name}: 调用链段缺失`)
    assert.ok(doc.includes("spawn eng-designer"), `${name}: 调用链 spawn 指令缺失`)
    assert.ok(!doc.includes("ARCHITECT"), `${name}: ARCHITECT 残留`)
    assert.ok(!doc.includes("You design and delegate"), `${name}: 「You design and delegate」残留`)
    assert.ok(!doc.includes("你是架构师"), `${name}: 「你是架构师」残留`)
    assert.ok(!doc.includes("需求文档 + 设计文档（docs/），"), `${name}: 交付物=需求+设计文档 旧句残留`)
  }
})

test("AC24 「主会话即 designer」句已撤销 + 四维归属改述为设计者角色（双源）", () => {
  for (const [name, doc] of [["src", de], ["zh", deZh]]) {
    assert.ok(!doc.includes("主会话即 designer"), `${name}: 旧身份句残留`)
    assert.ok(doc.includes("设计者角色（eng-designer）"), `${name}: 四维归属改述缺失`)
    assert.ok(doc.includes("勘察/方案对比/预检/实践沉淀四维"), `${name}: 四维结构不丢`)
  }
})

test("AC25 persona-eng-designer 双源 FR19 固定子串全命中（产出要素——评审 #4 钉死口径）", () => {
  const FIXED = [
    "批次档 §2", "不写进设计档", "选型对比", "拆分计划", "验收标准逐条回指", "用例表",
    "UI", "open", "判定句", "打回", "todo 状态推进", "不经 advisor", "勘察预算",
  ]
  for (const [name, doc] of [["src", pdes], ["zh", pdesZh]]) {
    for (const s of FIXED) assert.ok(doc.includes(s), `${name}: FR19 固定子串缺失: ${s}`)
  }
  // 产出要件（数量形态与列表同改——D3 自证）：8 项设计档逐项
  for (const [name, doc] of [["src", pdes], ["zh", pdesZh]]) {
    assert.ok(/设计档 8 项/.test(doc), `${name}: 设计档 8 项 声明缺失`)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 第 9 批锚（PROMPT-REVIEW-ORDER——ADVISOR-CONVERGENCE §13）：Action 四值 + 修正轮 ⇄ 用户批准 时序。
// 口径 = T-RO1–T-RO6：**双源在位 + fail-when-unchanged**（本仓断言自身两面；跨端两面由 VSC 端
// 同款 + 跨仓面⑥ 承载——多实现面纪律，各端独立、不做跨仓 import）。
// ─────────────────────────────────────────────────────────────────────────────
const ROPE_CHAIN = ["评审 pass 后逐条裁决", "修正轮落地并经核验"]
const ROPE_LABEL = "**修正轮 ⇄ 用户批准 时序**"
const ROPE_BULLET = [
  "- **修正轮 ⇄ 用户批准 时序**（评审后）：评审 pass 后你逐条裁决（裁决表）——裁决要求修正的（设计档修订 / 实现修复），",
  "  **修正轮落地并经你核验后，才可请求用户批准**；修正轮在途时**不得**请求批准——在途状态只作汇报，汇报不携带批准请求。",
  "  **修正轮边界**：只落评审发现与你的裁决直接导出的修正——**不得夹带新语义/新范围**；夹带即新内容，",
  "  须显式摆给用户单独定，不得随批准请求一并默认通过。",
  "  批准请求中，裁决表的 `Dispatched` 行须已逐条收敛为 `Fixed`（随请求给出落地证据：file:line 或设计档节）。",
].join("\n")
const PE_PAIR = [["src（英文落地）", pe], ["docs/design/prompts（中文权威）", peZh]]
const dnZh = read("docs/design/prompts/discipline-normal.md")
const DN_PAIR = [["src（英文落地）", dn], ["docs/design/prompts（中文权威）", dnZh]]

test("T-RO1 正常：链行节点双源在位（评审后裁决 / 修正轮落地核验——节点序先于用户批准）", () => {
  for (const [name, doc] of PE_PAIR) for (const lit of ROPE_CHAIN) assert.ok(doc.includes(lit), `${name}: 链行节点缺失: ${lit}`)
  assert.ok(pe.indexOf(ROPE_CHAIN[0]) < pe.indexOf("user approval") && peZh.indexOf(ROPE_CHAIN[0]) < peZh.indexOf("→ 用户批准"), "节点序漂移（应插在提醒评审与用户批准之间）")
})

test("T-RO2/T-RO3 正常/边界：Action 四值 + 计数词同改（de×2 + dn×2 双源——词序 Fixed→Dispatched→Not an issue→Deferred）", () => {
  for (const [name, doc] of [...DE_PAIR, ...DN_PAIR]) {
    const want = name.startsWith("src") ? "exactly four values" : "恰好四选一"
    assert.ok(doc.includes("Dispatched") && doc.includes(want), `${name}: 四值/${want} 缺失——计数词未同改`)
    const o = ["`Fixed`", "`Dispatched`", "`Not an issue`", "`Deferred`"].map((v) => doc.indexOf(v))
    assert.ok(o[0] < o[1] && o[1] < o[2] && o[2] < o[3], `${name}: 词序漂移`)
  }
})

test("T-RO4 正常：时序 bullet 双源逐字全文 + 要素 + 位序（裁决表块末行后、轮次衰减前）", () => {
  for (const [name, doc] of DE_PAIR) {
    assert.ok(doc.includes(ROPE_BULLET), `${name}: 时序 bullet 逐字全文缺失`)
    for (const el of ["**不得**请求批准", "**不得夹带新语义/新范围**", "`Dispatched` 行须已逐条收敛为 `Fixed`"]) assert.ok(doc.includes(el), `${name}: bullet 要素缺失: ${el}`)
    assert.ok(doc.indexOf(ROPE_LABEL) < doc.indexOf("轮次衰减"), `${name}: 位序漂移（应早于轮次衰减）`)
  }
  assert.ok(de.indexOf("surface any unresolved 🔴 to the user.") < de.indexOf(ROPE_LABEL) && deZh.indexOf("未解决的 🔴 必须向用户呈现。") < deZh.indexOf(ROPE_LABEL), "bullet 应紧随裁决表块末行")
})

test("T-RO5/T-RO6 反例+边界：旧三值句/旧相邻形态零残留（本仓 6 档）+ 新增文本零维护者注（§2.7 #15）", () => {
  for (const [name, doc] of [...PE_PAIR, ...DE_PAIR, ...DN_PAIR]) assert.ok(!doc.includes("恰好三选一") && !doc.includes("exactly three values"), `${name}: 旧三值句残留`)
  for (const [name, doc] of PE_PAIR) {
    assert.ok(!doc.includes("（发起权在用户）→ 用户批准") && !doc.includes("(initiation stays with the user) → user approval"), `${name}: 旧相邻形态残留（防“追加两版”）`)
  }
  for (const lit of [...ROPE_CHAIN, ROPE_LABEL, ...ROPE_BULLET.split("\n")]) assert.ok(!/\d{4}-\d{2}-\d{2}|第\s*\d+\s*批|评审\s*#/.test(lit), `新增文本含维护者注: ${lit.slice(0, 26)}…`)
})
