/**
 * prompts-mirror-anchors.test.mjs — 提示词双源镜像锚测试（第 5 批 VSC-MIRROR · 面②）。
 *
 * 权威：ENGINEERING-MODE.md §2.22.2（镜像锚 A1–A12）/ §2.22.7（双源结构 + 端特有段 + 跨仓节引用）；
 * 验收：AC39（文本类锚逐字 + A12 宿主）/ AC43（双源结构 + 端特有段）；用例 T62 / T65。
 *
 * 断言九面：
 *   ① 双源同名集合两侧各 15（src/prompts 与 docs/design/prompts，均与 CLI 同仓同名集合相等）；
 *   ② 文本类锚 A1–A8/A11/A12 在 VSC 宿主档（双源两侧）与 CLI 侧逐字相同（A8 = 跨仓同文件 grep）；
 *      A9/A10 为行为锚（宿主是工具/脚本代码），属面① T59/T61，本档不 grep；
 *   ③ 端特有段在镜像中且被断言（非仅锚句——VSC R14 池规则段等，§2.22.7）；
 *   ④ 镜像跨仓节引用不悬空（VSC 侧可解析，或以「（CLI 侧）」注记豁免——§2.22.7 V1 判据）；
 *   ⑤ A12/T65：主 agent 人格含产品经理身份 + spawn eng-designer 调用链，不含 ARCHITECT/交付物旧句；
 *   ⑥ 本批同文组跨仓逐字（CLI ↔ VSC）：组 1 = Action 四值句（zh↔zh / en↔en 各 4 文件面）；
 *      组 2 = 修正轮 ⇄ 用户批准 时序 bullet 全文（4 文件面）——权威定义 = ADVISOR-CONVERGENCE §13.10 面⑥；组 3 = spawn 排队纪律「提交即走」句（en↔en——两仓 discipline-engineering.md）。
 *   ⑦ 公共层扩容同文组跨仓逐字（CLI ↔ VSC）：common 11 标题组（zh↔zh / en↔en 同串）+ 关键句组
 *      （en↔en / zh↔zh）——权威 = PROMPT-SYSTEM 设计档 §3.3 面⑦ / AC-CL1。
 *   ⑧ 角色重定义批锚（ROLE-REDEFINITION §2.28——本端四端面）：RF-1 勾销句（双源两侧）/ RF-4c 自审第 6 条
 *      （双源两侧）/ RF-4a 身份句 + RF-4d discipline 头注 consumers——旧句零命中 + 替子逐字在位。
 *   ⑨ 机制纪律锚（机制纪律提示词落地——测试纪律 / 台账维护；本端三档 × 双源 + CLI 侧逐字对照——PROMPT-SYSTEM §8.5）。
 *
 * 跨仓读取 = 兄弟仓路径 `../thincoder/...`（可用 THINCODER_CLI_ROOT 覆盖）；兄弟仓不可用 → fail-closed（显式失败，不静默通过）。
 */
import { test } from "node:test"
import assert from "node:assert"
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const VSC = join(dirname(fileURLToPath(import.meta.url)), "..")
// 兄弟仓根：默认 `../thincoder`（两仓并排 checkout）；可用 THINCODER_CLI_ROOT 覆盖。
// 缺仓/缺文件 → fail-closed（见 readRepo），绝不静默通过；本测试因此需双仓同存。
const CLI = resolve(process.env.THINCODER_CLI_ROOT?.trim() || join(VSC, "..", "thincoder"))
// 空值/自指防护：CLI 根必须真为异仓——空串/自指会让跨仓比对退化为自比自（真空通过）。
assert.notStrictEqual(CLI, resolve(VSC), "CLI 根不得等于本仓根（THINCODER_CLI_ROOT 空值/自指）——跨仓断言必须 fail-closed")
const SRC = "src/prompts/"
const ZH = "docs/design/prompts/"
const DE_PAIR = [SRC + "discipline-engineering.md", ZH + "discipline-engineering.md"]

/** 跨仓/本仓读——fail-closed：缺文件显式失败，绝不静默通过。 */
const readRepo = (root, rel) => {
  const p = join(root, rel)
  assert.ok(existsSync(p), `跨仓锚断言 fail-closed：${p} 不存在（兄弟仓不可用或文件缺失）`)
  return readFileSync(p, "utf8")
}
const mdSet = (root, rel) => readdirSync(join(root, rel)).filter((f) => f.endsWith(".md")).sort()

// ── ② 文本类锚字面表（CLI 侧为逐字源；两侧同一字面串 = 逐字一致） ──────────────
const A1 = [
  "**六段自写 · 一段一作者**：批次档 §1 主 agent / §2 eng-designer / §3 评审子代理 / §4 主 agent / §5 eng-coder / §6 父代理——",
  "每个角色只写自己那一段（append-only，段不重叠）；**子代理自写，不经父侧转述**（转述 = 二次加工 = 失真源）。",
]
const A2 = ["写入手段 = `batch_segment({segment, text})`（**无路径参数**——目标档由 spawn 绑定 / 评审实例键提供，段号由调用者身份定：eng-designer → §2 · 设计评审 → §3 · eng-coder → §5；越段即拒）。"]
const A4 = [
  "**D1 写权矩阵**", "**D2 单一权威源** — 一条机制**只在一处详述**，其余处**只引用不重述**", "**D3 计数·枚举纪律**",
  "**D4 指针纪律**", "**D5 冻结窗口** — **评审在途不改被审文档**", "**D6 回读核对** — 任何写入后**回读核实**再报完成",
  "**D7 变更留痕 + 核销同步**",
]
const A6 = ["写不进去（拒/失败）→ 报告里明说“§× 未写入”；**父侧代写必须打标**（不得静默代笔、不得假装写过）。"]
const A7 = [
  "批次档在飞时的设计评审：**必须传 `batchDoc`**（批次档路径）——评审者据此拿到 `batch_segment` 写通道，把发现表 + VERDICT + 计数**逐字**写进批次档 §3",
  "无批次档的在途设计评审**不受阻**（不传即不挂载——不得因缺此参数拒绝评审；缺写通道时 §3 只能父侧代写并**打标**）。",
]
const A5A6_ADVISOR = [
  "## 批次档 §3 落档（仅设计评审——工具已挂载时）",
  "仅当本评审为设计评审、且工具面里已挂载 `batch_segment` 时",
  "把本轮**发现表 + VERDICT + 计数逐字**写进批次档 §3",
  "写不进去（被拒/失败）→ 报告里明说「§3 未写入」——不得静默略过，也不得假装写过（父侧代写必须打标）。",
]
const A3_CODER = ["**§5 由你自写**", "**执行者拒收**：查不到任务书（批次档 §2 / `batchDoc` 路径不可读）→ **不执行、打回**——不自行补造任务书往下干。"]
const A3_DESIGNER_SRC = [
  "**执行者拒收**(executor refusal): if the task-book basis is missing (batch record §1 / the requirement list) → **do not execute — bounce it back**; never fabricate a direction and proceed.",
  "## 三方条目一致（three-way item consistency — hard rule）",
  "**批次档 §2 本批条目 = 设计档验收标准回指的条目 = 需求档条目** — the three chains must share one source;",
]
const A3_DESIGNER_ZH = [
  "**执行者拒收**：查不到任务书依据（批次档 §1 / 本批清单）→ **不执行、打回**——不自行补造方向往下干。",
  "## 三方条目一致（铁律）",
  "**批次档 §2 本批条目 = 设计档验收标准回指的条目 = 需求档条目**——三条链必须同源；",
]
const A3_SHARED = [
  "**澄清必经主 agent**：子代理撞到需要用户决定的事 → **打回主代理**，无旁路（子代理没有对话面）。",
  "**三方条目一致**：**批次档 §2 本批条目 = 设计档验收标准回指的条目 = 需求档条目**——advisor 八维 #1 需求覆盖 / #6 范围靠这份清单判。",
]
const A11_SRC = [
  '`subagent(role="eng-coder", designId=<id-A>, designToken=<token-A>, batchDoc=<batch-record-path>, task=...)`',
  "`batchDoc` is REQUIRED on every eng-coder spawn — the batch record path (e.g. `docs/batches/<batch>-<topic>.md`), which is the task book the child implements: a spawn without it, or with a path that does not resolve to a readable file, is mechanically refused.",
]
const A11_ZH = [
  '`subagent(role="eng-coder", designId=<id>, designToken=<token>, batchDoc=<批次档路径>, task=...)`',
  "**`batchDoc` 必传**（批次档路径，如 `docs/batches/<批>-<主题>.md`",
]
const A12 = ["产品经理", "流程编排者", "调用链", "spawn eng-designer", "评审 pass 后逐条裁决", "修正轮落地并经核验"]

const ANCHORS = [
  { id: "A1/A2/A6/A7", files: DE_PAIR, literals: [...A1, ...A2, ...A6, ...A7] },
  { id: "A4", files: DE_PAIR, literals: A4 },
  { id: "A5/A6-advisor", files: ["advisor-design.md", "advisor-round2.md", "advisor-round3.md"].flatMap((f) => [SRC + f, ZH + f]), literals: A5A6_ADVISOR },
  { id: "A3-coder", files: [SRC + "persona-eng-coder.md", ZH + "persona-eng-coder.md"], literals: A3_CODER },
  { id: "A3-designer-src", files: [SRC + "persona-eng-designer.md"], literals: A3_DESIGNER_SRC },
  { id: "A3-designer-zh", files: [ZH + "persona-eng-designer.md"], literals: A3_DESIGNER_ZH },
  { id: "A3-shared", files: DE_PAIR, literals: A3_SHARED },
  { id: "A11-src", files: [SRC + "discipline-engineering.md"], literals: A11_SRC },
  { id: "A11-zh", files: [ZH + "discipline-engineering.md"], literals: A11_ZH },
  { id: "A12", files: [SRC + "persona-engineering.md", ZH + "persona-engineering.md"], literals: A12 },
]

test("A1–A8/A11/A12 文本类锚：VSC 宿主（双源两侧）与 CLI 侧逐字相同（AC39/T62）", () => {
  for (const a of ANCHORS) {
    for (const f of a.files) {
      const vsc = readRepo(VSC, f), cli = readRepo(CLI, f)
      for (const lit of a.literals) {
        assert.ok(cli.includes(lit), `${a.id}: CLI 侧 ${f} 缺该锚字面串（CLI = 逐字源）`)
        assert.ok(vsc.includes(lit), `${a.id}: VSC 侧 ${f} 与 CLI 侧不逐字（缺 ${JSON.stringify(lit.slice(0, 36))}…）`)
      }
    }
  }
})

test("A8 工具描述文案：跨仓同文件 grep（batch-segment.mjs——段白名单/无路径参数/append-only/来源戳/剥凭证/失败明示）", () => {
  const F = "src/agent-tools/batch-segment.mjs"
  const cli = readRepo(CLI, F), vsc = readRepo(VSC, F)
  const CONTRACT = [
    "Append your own section of the batch record",
    "There is NO path parameter",
    "(eng-designer → §2, design review → §3, eng-coder → §5) — a write outside your own section is refused.",
    "Append-only: the text lands at the end of your section; existing lines are never rewritten or deleted.",
    "Credential values are stripped mechanically before writing",
    "stamped by the tool with a `### 轮次 N（评审子代理）` heading",
    "Failures are hard and visible (no silent fallback)",
  ]
  for (const s of CONTRACT) {
    assert.ok(cli.includes(s), `A8: CLI ${F} 缺描述子串 ${JSON.stringify(s.slice(0, 32))}…`)
    assert.ok(vsc.includes(s), `A8: VSC ${F} 描述与 CLI 不同源（缺 ${JSON.stringify(s.slice(0, 32))}…）`)
  }
})

test("③ 双源同名集合两侧各 15（AC43/T62）", () => {
  for (const rel of ["src/prompts", "docs/design/prompts"]) {
    const vsc = mdSet(VSC, rel), cli = mdSet(CLI, rel)
    assert.equal(vsc.length, 15, `${rel}: VSC 侧应为 15 档（实 ${vsc.length}）`)
    assert.deepStrictEqual(vsc, cli, `${rel}: 与 CLI 同名集合必须一一对应（无多无少）`)
  }
  assert.deepStrictEqual(mdSet(VSC, "docs/design/prompts"), mdSet(VSC, "src/prompts"), "本端双源同名集合相等")
})

test("④ 端特有段进镜像且被断言（AC43——非仅锚句）", () => {
  const de = readRepo(VSC, ZH + "discipline-engineering.md")
  assert.ok(de.includes("VSC 端特有段"), "镜像 discipline-engineering 缺端特有段（R14 池规则——VSC 独有）")
  assert.ok(de.includes("per-role-domain pools"), "端特有段缺 R14 池规则本体句")
  assert.ok(de.includes("eng-coder 池 4"), "端特有段缺池容量口径")
  assert.ok(de.includes("agent.poolLimits = { engCoder, other, advisor }"), "端特有段缺 agent.poolLimits 配置键")
  const pe = readRepo(VSC, ZH + "persona-engineering.md")
  assert.ok(pe.includes("VSC 端特有段"), "镜像 persona-engineering 缺端特有段（多并行/池规则/取消语义）")
  assert.ok(pe.includes("取消运行中的 eng-coder 是最后手段"), "端特有段缺取消语义句")
  const pec = readRepo(VSC, ZH + "persona-eng-coder.md")
  assert.ok(pec.includes("VSC 端特有段：实现纪律与交付报告"), "镜像 persona-eng-coder 缺端特有段（落地独有实现纪律/报告格式段）")
  assert.ok(pec.includes("不得静默降级") && pec.includes("收尾自审六条"), "端特有段缺实现纪律/收尾自审本体")
})

test("⑤ 镜像跨仓节引用不悬空（VSC 可解析，或「（CLI 侧）」注记豁免——§2.22.7）", () => {
  const docs = []
  ;(function collect(dir) {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n)
      if (n === "_archive") continue
      if (statSync(p).isDirectory()) collect(p)
      else if (n.endsWith(".md")) docs.push(p)
    }
  })(join(VSC, "docs"))
  const numsOf = (p) => {
    const s = new Set()
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = /^#{1,6}\s+(.*)$/.exec(line)
      if (!m) continue
      for (const re of [/^§?\s*(\d+(?:\.\d+)*)\b/, /§\s*(\d+(?:\.\d+)*)/]) {
        const a = re.exec(m[1])
        if (a) s.add(a[1])
      }
    }
    return s
  }
  const hasSection = (s, n) => s.has(n) || [...s].some((x) => x.startsWith(n + "."))
  const REF = /\[?([A-Za-z0-9_\-./]+\.md)\]?(?:\([^)\n]*\))?[^\S\n]*[（(【]?[^\S\n]*[:：]?[^\S\n]*§\s*(\d+(?:\.\d+)*)/g
  const dangling = []
  for (const f of mdSet(VSC, "docs/design/prompts")) {
    const rel = "docs/design/prompts/" + f
    readRepo(VSC, rel).split("\n").forEach((line, i) => {
      REF.lastIndex = 0
      let m
      while ((m = REF.exec(line))) {
        const base = m[1].split("/").pop()
        const okVsc = docs.filter((p) => p.endsWith(base)).some((p) => hasSection(numsOf(p), m[2]))
        if (!okVsc && !line.includes("（CLI 侧）")) dangling.push(`${rel}:${i + 1} ${m[0]}`)
      }
    })
  }
  assert.deepStrictEqual(dangling, [], "镜像含悬空节引用（须本端可解析，或按 §2.22.7 标注「（CLI 侧）」）")
})

// ── ⑥ 本批同文组字面表（PROMPT-REVIEW-ORDER——跨仓逐字；组 1 四值句 / 组 2 时序 bullet / 组 3 提交即走句）───────
const ROPE_ZH_ACTION = "`Action` 恰好四选一：`Fixed`（你改了代码——**已落地**）、`Dispatched`（**修正轮在途——尚未落地**）、`Not an issue`（有证据的技术反驳）、`Deferred`（承认但现在不修——附理由）。"
const ROPE_EN_ACTION = "`Action` is one of exactly four values: `Fixed` (you edited the code — landed), `Dispatched` (fix round in flight — not yet landed), `Not an issue` (technical rebuttal with evidence), `Deferred` (admitted, not fixed now — with a reason)."
const ROPE_BULLET = [
  "- **修正轮 ⇄ 用户批准 时序**（评审后）：评审 pass 后你逐条裁决（裁决表）——裁决要求修正的（设计档修订 / 实现修复），",
  "  **修正轮落地并经你核验后，才可请求用户批准**；修正轮在途时**不得**请求批准——在途状态只作汇报，汇报不携带批准请求。",
  "  **修正轮边界**：只落评审发现与你的裁决直接导出的修正——**不得夹带新语义/新范围**；夹带即新内容，",
  "  须显式摆给用户单独定，不得随批准请求一并默认通过。",
  "  批准请求中，裁决表的 `Dispatched` 行须已逐条收敛为 `Fixed`（随请求给出落地证据：file:line 或设计档节）。",
].join("\n")
const SQ_LITERAL = "- **提交即走——排队是机制的职责**：spawn 一律带 `files`/`dependsOn` 后**直接提交**——域冲突由调度器排队（返回 `queued` + position）、并发池满由池排队；**不手工记队列、不逐档放行、不因冲突/池满而推迟提交**。父侧只读状态（status/observe），不模拟调度器。"

test("⑥ 本批同文组跨仓逐字（组 1：Action 四值句 zh↔zh / en↔en；组 2：修正轮 ⇄ 用户批准 时序 bullet；组 3：提交即走句 en↔en）", () => {
  const GROUPS = [
    { id: "组1-zh 四值句", files: [ZH + "discipline-engineering.md", ZH + "discipline-normal.md"], literals: [ROPE_ZH_ACTION] },
    { id: "组1-en 四值句", files: [SRC + "discipline-engineering.md", SRC + "discipline-normal.md"], literals: [ROPE_EN_ACTION] },
    { id: "组2 时序 bullet 全文", files: DE_PAIR, literals: [ROPE_BULLET] },
    { id: "组3 提交即走句 en↔en", files: [SRC + "discipline-engineering.md"], literals: [SQ_LITERAL] },
  ]
  for (const g of GROUPS) for (const f of g.files) {
    const vsc = readRepo(VSC, f), cli = readRepo(CLI, f)
    for (const lit of g.literals) {
      assert.ok(cli.includes(lit), `${g.id}: CLI 侧 ${f} 缺字面串（缺 ${JSON.stringify(lit.slice(0, 30))}…）`)
      assert.ok(vsc.includes(lit), `${g.id}: VSC 侧 ${f} 与 CLI 不逐字（缺 ${JSON.stringify(lit.slice(0, 30))}…）`)
    }
  }
})

// ── ⑦ 公共层扩容同文组字面表（common 11 标题组 + 关键句组——跨仓逐字；PROMPT-SYSTEM AC-CL1）────
const CL_HEADINGS = [
  "## 语言纪律（Language）",
  "## 人机分工（Who you are）",
  "## 确认与批准门（最高纪律——先于一切写文件动作）",
  "## 诚实原则（When choices conflict）",
  "## 证据纪律（Evidence discipline）",
  "## 停下上报（Stop and report）",
  "## 任务边界与范围外注记（Task boundary）",
  "## 交付报告（Delivery report——统一格式）",
  "## 工具观（Tool discipline）",
  "## 工具路由表（Tool routing——写类场景按表路由，不用 bash）",
  "## 系统接口语义（System interface——按角色收到的提醒字段解读）",
]
const CL_KEY_EN = [
  "Every factual/behavioral assertion you make MUST be verified from the code/docs in front of you",
  "when the source is readable — a behavioral question is an EVIDENCE question, not a reasoning question.",
  "Delivery would have to shrink → surface the trade-off before delivering, not after.",
  "Your scope = the task book / task brief (including its file list and acceptance criteria) — do not expand it.",
  "**Your last message is ALL the caller sees — make it self-contained; never expect them to read your process.**",
  "| `subagent` / `advisor` / `consult_*` | delegation / independent review / consultation | inlining exploration, self-review only, single-model guessing |",
  "**System reminders (`[System reminder:]`) are authoritative framework messages** — comply silently, never mention them.",
]
const CL_KEY_ZH = [
  "你做的每条事实/行为断言，都必须从前面的代码/文档验证——读它们、引 `file:line`——",
  "行为问题是证据问题，不是推理问题。",
  "交付被迫缩水 → 交付前摆出取舍，不交付后披露。",
  "你的范围 = 任务书/任务描述（含其文件清单与验收标准）——不扩大。",
  "**你的最后一条消息就是调用方看到的全部——自含完整，不指望对方读你的过程。**",
  "| `subagent` / `advisor` / `consult_*` | 委派 / 独立评审 / 会诊 | 内联勘察、只自审、单模型瞎猜 |",
  "**System reminders（`[System reminder:]`）是权威框架消息**——静默遵从，永不提及。",
]

test("⑦ 公共层 common 跨仓逐字（11 标题组 + 关键句组 zh↔zh / en↔en——PROMPT-SYSTEM AC-CL1）", () => {
  const GROUPS = [
    { id: "标题组（双语标题四源同串）", files: [SRC + "common.md", ZH + "common.md"], literals: CL_HEADINGS },
    { id: "关键句组 en↔en", files: [SRC + "common.md"], literals: CL_KEY_EN },
    { id: "关键句组 zh↔zh", files: [ZH + "common.md"], literals: CL_KEY_ZH },
  ]
  for (const g of GROUPS) for (const f of g.files) {
    const vsc = readRepo(VSC, f), cli = readRepo(CLI, f)
    for (const lit of g.literals) {
      assert.ok(cli.includes(lit), `${g.id}: CLI 侧 ${f} 缺字面串（缺 ${JSON.stringify(lit.slice(0, 30))}…）`)
      assert.ok(vsc.includes(lit), `${g.id}: VSC 侧 ${f} 与 CLI 不逐字（缺 ${JSON.stringify(lit.slice(0, 30))}…）`)
    }
  }
})

test("A12/T65 主 agent 人格改述：产品经理身份 + spawn eng-designer 调用链；不含 ARCHITECT/交付物旧句", () => {
  for (const f of [SRC + "persona-engineering.md", ZH + "persona-engineering.md"]) {
    const t = readRepo(VSC, f)
    for (const s of ["ARCHITECT", "You design and delegate", "你是架构师", "requirements + design documents", "Designer, not Implementer"]) {
      assert.ok(!t.includes(s), `${f}: 旧身份/交付物句残留「${s}」（与本批 D1 需求/设计档=eng-designer 互斥）`)
    }
    assert.ok(t.includes("spawn eng-designer"), `${f}: 调用链段缺 spawn eng-designer`)
  }
})

// ── ⑧ 角色重定义批锚（ROLE-REDEFINITION §2.28——本端四端面）：RF-1 勾销句 / RF-4c 自审第 6 条 /
//    RF-4a 身份句 / RF-4d 头注 consumers。口径 = AC61/AC64：旧句零命中 + 替子逐字在位。
const RF1_OLD = "实现后验收标准逐条勾销"
const RF4C_EN_OLD = "Update the affected design-doc sections your diff touches"
const RF4C_EN_NEW = "Report any design-doc drift your diff touches (module map / affected-files table) in your delivery report — do not edit design docs yourself; they are authored by eng-designer."
const RF4C_ZH_OLD = "受影响的设计档章节随 diff 更新"
const RF4C_ZH_NEW = "diff 触及的设计档漂移（模块地图/受影响文件表）写交付报告——不修改设计档；设计档由 eng-designer 执笔"

test("⑧ 角色重定义锚（本端四端面）：勾销句 / 自审第 6 条 / 身份句 / 头注 consumers", () => {
  for (const f of DE_PAIR) { // RF-1（双源两侧）+ RF-4d 头注
    const t = readRepo(VSC, f)
    assert.ok(!t.includes(RF1_OLD), `${f}: 旧勾销句残留`)
    assert.ok(t.includes("实现后验收勾销落批次档 §6") && t.includes("设计档内不写勾销状态"), `${f}: 替句子串缺失`)
    assert.ok(t.split("\n")[0].includes("eng-coder + eng-designer"), `${f}: 头注 consumers 未补 eng-designer`)
  }
  const pecEn = readRepo(VSC, SRC + "persona-eng-coder.md")
  const pecZh = readRepo(VSC, ZH + "persona-eng-coder.md")
  // RF-4a/4b（双源两侧）：旧句零命中 + 替句逐字
  assert.ok(!pecEn.includes("The parent agent is the architect") && !/architect/i.test(pecEn), "pec-src: 旧身份句/architect 残留")
  assert.ok(pecEn.includes("The parent agent is the product manager and flow orchestrator"), "pec-src: 新身份句缺失")
  assert.ok(!pecEn.includes("The parent agent provided a design document."), "pec-src: 旧边界句残留")
  assert.ok(pecEn.includes("Your task book references the design document — the authoritative spec."), "pec-src: 新边界句缺失")
  assert.ok(!pecZh.includes("架构师"), "pec-zh: 架构师残留")
  assert.ok(pecZh.includes("父代理是产品经理与流程编排者"), "pec-zh: 新身份句缺失")
  assert.ok(!pecZh.includes("父代理提供了设计文档。"), "pec-zh: 旧边界句残留")
  assert.ok(pecZh.includes("任务书引用了设计文档——权威规格。"), "pec-zh: 新边界句缺失")
  // RF-4c 自审第 6 条（双源两侧）：旧句零命中 + 替句逐字 + 粘连断行已修复
  assert.ok(!pecEn.includes(RF4C_EN_OLD), "pec-src: 自审第 6 条旧句残留")
  assert.ok(pecEn.includes(RF4C_EN_NEW), "pec-src: 自审第 6 条替句缺失")
  assert.ok(pecEn.includes("Your last message IS the report the parent sees — make it complete:"), "pec-src: 报告引导句缺失（粘连修复）")
  assert.ok(pecEn.split("\n").some((l) => l.trim() === "Your last message IS the report the parent sees — make it complete:"), "pec-src: 报告引导句未起新行（粘连未修复）")
  assert.ok(!pecZh.includes(RF4C_ZH_OLD), "pec-zh: 自审第 6 条旧句残留")
  assert.ok(pecZh.includes(RF4C_ZH_NEW), "pec-zh: 自审第 6 条替句缺失")
})

// ── ⑨ 机制纪律锚（机制纪律提示词落地——本端三档 × 双源 + CLI 侧逐字对照；设计 = PROMPT-SYSTEM §8.5）──
const TD_DE = [
  "## 测试纪律（工程侧——寿命 / 门禁 / 归册）",
  "**单元测试 = 开发期工具**",
  "**不因单次改动而增补**",
  "**默认退役（删除）**",
  "三者全满足才转 ②③",
  "**退役是常态、保留须举证**",
  "**发布门 = 项目的完整验证链**",
  "**未归册而超阈 = 硬红**",
  "活文件只留**未决四态**",
  "`触发=认账不排期`",
  "行龄超 30 天标「老化」",
]
const TD_DN_EN = [
  "Code changes must be verified — unit tests are development-time tools",
  "Integration tests are project assets — never augmented per single change; the release gate is the project's full verification chain.",
]
const TD_DN_ZH = [
  "代码改动必须验证——单元测试是开发期工具",
  "集成测试是项目资产——不因单次改动而增补；发布门 = 项目的完整验证链。",
]
const TD_PE_EN = "- **The ledger is yours**: the requirement-pool / tech-backlog ledger (record + status advance + physical writes; subagents never declare ledger files in `files`)."
const TD_PE_ZH = "- **台账归你**：需求池 / 技术待办台账（记录 + 状态推进 + 物理落笔；子代理一律不在 `files` 声明台账档）。"
const TD_C_EN = "Add tests if the project has them — as unit tests"
const TD_C_ZH = "项目有测试就加测试——写单元测试"
const TD_CNT = "（计数口径 = 未决数——归档条目不计数）"

test("⑨-1 正常：de 双源——测试纪律新节 + 台账块（VSC ↔ CLI 逐字；T-TD1/T-TD7）", () => {
  for (const f of [SRC + "discipline-engineering.md", ZH + "discipline-engineering.md"]) {
    const vsc = readRepo(VSC, f), cli = readRepo(CLI, f)
    for (const lit of [...TD_DE, TD_CNT]) {
      assert.ok(cli.includes(lit), `⑨-1: CLI 侧 ${f} 缺字面串（缺 ${JSON.stringify(lit.slice(0, 30))}…）`)
      assert.ok(vsc.includes(lit), `⑨-1: VSC 侧 ${f} 与 CLI 不逐字（缺 ${JSON.stringify(lit.slice(0, 30))}…）`)
    }
  }
})

test("⑨-2 正常+反证：dn 双源——新句 + `:8` 尾改 + 旧句零残留（回潮即红；T-TD2/T-TD6/T-TD7）", () => {
  for (const [f, keys, old] of [
    [SRC + "discipline-normal.md", [...TD_DN_EN, TD_C_EN], "Code changes need at least one test"],
    [ZH + "discipline-normal.md", [...TD_DN_ZH, TD_C_ZH], "至少要有一个测试"],
  ]) {
    const vsc = readRepo(VSC, f), cli = readRepo(CLI, f)
    for (const lit of keys) {
      assert.ok(cli.includes(lit), `⑨-2: CLI 侧 ${f} 缺字面串（缺 ${JSON.stringify(lit.slice(0, 30))}…）`)
      assert.ok(vsc.includes(lit), `⑨-2: VSC 侧 ${f} 与 CLI 不逐字（缺 ${JSON.stringify(lit.slice(0, 30))}…）`)
    }
    assert.ok(!cli.includes(old) && !vsc.includes(old), `⑨-2: ${f} 旧句残留（回潮即红）`)
  }
})

test("⑨-3 正常+边界：pe 双源归属句（VSC ↔ CLI）+ 新增锚串零维护者注（T-TD3/T-TD4/T-TD7）", () => {
  for (const [f, lit] of [[SRC + "persona-engineering.md", TD_PE_EN], [ZH + "persona-engineering.md", TD_PE_ZH]]) {
    const vsc = readRepo(VSC, f), cli = readRepo(CLI, f)
    assert.ok(cli.includes(lit), `⑨-3: CLI 侧 ${f} 缺归属句（全文锚）`)
    assert.ok(vsc.includes(lit), `⑨-3: VSC 侧 ${f} 缺归属句（全文锚）`)
  }
  const ALL = [...TD_DE, ...TD_DN_EN, ...TD_DN_ZH, TD_PE_EN, TD_PE_ZH, TD_C_EN, TD_C_ZH, TD_CNT]
  for (const s of ALL) assert.ok(!/\d{4}-\d{2}-\d{2}|第\s*\d+\s*批|评审\s*#/.test(s), `新增文本含维护者注: ${s.slice(0, 26)}…`)
})
