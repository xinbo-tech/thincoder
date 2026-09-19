/**
 * prompts-async-guidance.test.mjs — prompts 结构面 + 锚注入接线面测试（VSC 端——PROMPT-SYSTEM 施工③
 * 2026-09-10 重写，与 CLI test/prompts-async-guidance.test.mjs 同构）。
 *
 * W2（2026-09-15 · `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W2）：本端 `src/prompts/` 15 档 +
 * `src/prompt-overlays.mjs` 已删 ⇒ 断言面改指核（槽位装配面 = 核内单点 `@thincoder/core/prompt-overlays.mjs`）：
 *   ① 删净面：本端 `src/prompts/` / `src/prompt-overlays.mjs` 不存在；核包 `prompts/` 15 档在位；
 *   ② 装配矩阵 / 降级链 / 结构巡检（槽位注释、表行宽、非空）——对象 = 核包槽文件；
 *   ③ 锚注入接线面（A-K5 / §2.13.2「VSC 列」）：表 ⇔ 核锚名集合等值 + 配置态四装配面零 `{{inject:`
 *      字面 + 13 锚 VSC 值逐锚在场 + 入口径（`activate()` 直调）同断言。
 * 2026-09-12 PROSE-ANCHOR-RETIRE：读档锚句断言（MAIN-DESIGN-ENHANCE A1–A4 / 锚#1–#7 / 开关段 C1–C4 /
 * ASYNC-RESIDUE / ADVISOR-VERDICT / 搜索条款 / 第 9 批 T-RO1–T-RO4 / 语料修复 T-PC-1~T-PC-3 /
 * 降级链①② 篇句面）整删·段删——读非测试档文本 = 散文锚（判据见 CLI 侧设计档 TESTING.md §11）。
 * 存留面 = 结构自洽（删净面 / 槽表 / warnings 结构 / 降级链警告 / 注释头 / 行宽 / 非空）+
 * T-RO5/T-RO6 残余（测试内常量零维护者注——§2.7 #15）。
 */
import { test } from "node:test"
import assert from "node:assert"
import { readFileSync, existsSync, writeFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { tmpdir } from "node:os"
import { env as vscodeEnv, window as vscodeWindow } from "vscode"
import {
  PROMPTS_DIR, TOOL_DOCS_DIR, loadSlot, configurePromptInjections, resetPromptInjections,
} from "@thincoder/core/prompt-files.mjs"
import {
  assemblePrompt, SCENARIO_SLOT_FILES, PERSONA_ENGINEERING, PERSONA_NORMAL, COMMON,
  DISCIPLINE_ENGINEERING, DISCIPLINE_NORMAL, CONSULT_BASE,
} from "@thincoder/core/prompt-overlays.mjs"
import { toOpenAISchema, builtinTools } from "../src/tools/index.mjs"
import { buildAdvisorSystemPrompt } from "@thincoder/core/advisor.mjs" // W12：advisor 镜像删旧——核单源（原 ../src/advisor/main.mjs）
import { VSC_PROMPT_INJECTIONS } from "../src/prompt-injections.mjs"
import { activate } from "../extension.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const REPO = join(__here, "..")
const exists = (rel) => existsSync(join(REPO, rel))

const NEW_PROMPTS = [
  "persona-engineering.md", "persona-normal.md", "persona-eng-coder.md", "persona-eng-designer.md",
  "persona-explore.md", "persona-coder.md", "persona-plan.md",
  "common.md", "discipline-engineering.md", "discipline-normal.md",
  "consult-base.md", "advisor-design.md", "advisor-round1.md", "advisor-round2.md", "advisor-round3.md",
]
const SCENARIOS = ["normal", "engineering", "eng-coder", "eng-designer", "explore", "coder", "plan", "consult"]
const ANCHOR_RE = /\{\{inject:([a-z0-9-]+)\}\}/g
const LITERAL = "{{inject:"

const pn = loadSlot("persona-normal.md")
// 六场景装配快照（装配矩阵/降级链断言面）
const engMode = Object.fromEntries(["normal", "engineering", "eng-coder", "explore", "coder", "plan"].map((s) => [s, assemblePrompt(s)]))

/** 核内全部注入锚名（去重；扫描对象 = 核包 prompts/ + tool-docs/——与 VSC 表同源）。 */
function coreAnchorNames() {
  const names = new Set()
  for (const dir of [PROMPTS_DIR, TOOL_DOCS_DIR]) {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".md")) continue
      for (const m of readFileSync(join(dir, f), "utf8").matchAll(ANCHOR_RE)) names.add(m[1])
    }
  }
  return [...names].sort()
}

/** 四装配面输出（槽位+consult / 工具描述 / 顾问提示词）——锚面断言共用。 */
function assemblyFaces() {
  const prompts = SCENARIOS.map((s) => assemblePrompt(s).prompt)
  const tools = builtinTools.map((t) => String(toOpenAISchema(t).function.description))
  const advisor = buildAdvisorSystemPrompt({ _advisorRound: 0 }, null, "design")
  return { prompts, tools, advisor, union: [...prompts, ...tools, advisor].join("\n────────\n") }
}

test("W2 删净面：本端 src/prompts/ + src/prompt-overlays.mjs 不存在（核包 15 档在位——装配面 = 核单点）", () => {
  assert.ok(!exists("src/prompts"), "src/prompts/ 已随 W2 删除（F9 残留删净）")
  assert.ok(!exists("src/prompt-overlays.mjs"), "src/prompt-overlays.mjs 已删（槽位装配 = 核内单点）")
  assert.ok(!exists("src/tools/bash.md"), "src/tools/*.md 已删（描述面 = 核 tool-docs/）")
  for (const f of NEW_PROMPTS) assert.ok(existsSync(join(PROMPTS_DIR, f)), `${f} 核包（英文落地）在位`)
})

// ─────────────────────────────────────────────────────────────────────────────
// 装配矩阵断言（PROMPT-SYSTEM §3.2——assemblePrompt 七场景：文件名/顺序/槽完整性）。
// ─────────────────────────────────────────────────────────────────────────────
test("§3.2 装配矩阵：六主链场景槽文件名与顺序 1:1", () => {
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.engineering, ["persona-engineering.md", "common.md", "discipline-engineering.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.normal, ["persona-normal.md", "common.md", "discipline-normal.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES["eng-coder"], ["persona-eng-coder.md", "common.md", "discipline-engineering.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.explore, ["persona-explore.md", "common.md", "discipline-normal.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.coder, ["persona-coder.md", "common.md", "discipline-normal.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.plan, ["persona-plan.md", "common.md", "discipline-normal.md"])
})

test("§3.2 装配矩阵：consult = 自含基底不入主链（null 行）", () => {
  assert.strictEqual(SCENARIO_SLOT_FILES.consult, null)
})

test("§3.2 装配矩阵：assemblePrompt 输出=槽序拼接（人格→公共→纪律）+ 层序内部锚", () => {
  for (const s of ["normal", "engineering", "eng-coder", "explore", "coder", "plan"]) {
    assert.ok(engMode[s].warnings.length === 0, `${s}: 全槽在位无警告`)
  }
})

test("§3.2 装配矩阵：角色场景人格差异（explore/coder/plan = 各自角色人格文件 1:1）+ 常量导出面 = 六件", () => {
  for (const name of [PERSONA_ENGINEERING, PERSONA_NORMAL, COMMON, DISCIPLINE_ENGINEERING, DISCIPLINE_NORMAL, CONSULT_BASE]) {
    assert.ok(typeof name === "string" && name.length > 50, `导出常量非空: ${String(name).slice(0, 20)}`)
  }
})

test("§3.2 consult 场景：assemblePrompt 返回 CONSULT_BASE 自含基底（无四槽拼接）", () => {
  const c = assemblePrompt("consult")
  assert.ok(c.warnings.length === 0, "consult: 无警告")
})

// ─────────────────────────────────────────────────────────────────────────────
// 降级链断言（§3.4：槽缺失→警告；common 缺失→同款；AGENTS/[4] 层缺失=静默跳过）。
// W2：夹具读盘目标 = 核包槽文件（CLI U2 同法——本端副本已删）。
// 2026-09-12 PROSE-ANCHOR-RETIRE：原「特殊模块→报错不自降级」条（降级链④，读 setup.mjs 源码）整删；
// AGENTS 层静默跳过语义由 T-CI-2 机判（test/context-parity.test.mjs——[4] 层已真实落位）。
// ─────────────────────────────────────────────────────────────────────────────
test("§3.4 降级链①：槽文件缺失→空缺+警告（不 fallback——层间隔离）", async () => {
  // 槽内容 = prompt-overlays 模块级 SLOT_CONTENTS 常量——改文件须重载新实例触发真实 loadSlot 读盘。
  const target = join(PROMPTS_DIR, "persona-normal.md")
  const bak = readFileSync(target, "utf8")
  writeFileSync(target, "")
  try {
    const freshUrl = pathToFileURL(join(PROMPTS_DIR, "..", "prompt-overlays.mjs")).href + `?v=${Date.now()}`
    const fresh = await import(freshUrl)
    const r = fresh.assemblePrompt("normal")
    assert.ok(r.warnings.length === 1, "恰好一条警告")
    assert.ok(r.warnings[0].includes("prompt slot file persona-normal.md missing"), "警告点名缺失文件")
    assert.ok(r.warnings[0].includes("no fallback from another slot"), "警告声明不 fallback（层间隔离）")
  } finally {
    writeFileSync(target, bak)
  }
  assert.strictEqual(readFileSync(target, "utf8"), bak, "快照恢复")
})

test("§3.4 降级链②：common.md 缺失→同款警告（四槽全覆盖——评审 round#1 补）", async () => {
  const target = join(PROMPTS_DIR, "common.md")
  const bak = readFileSync(target, "utf8")
  writeFileSync(target, "")
  try {
    const freshUrl = pathToFileURL(join(PROMPTS_DIR, "..", "prompt-overlays.mjs")).href + `?v=${Date.now()}`
    const fresh = await import(freshUrl)
    const r = fresh.assemblePrompt("engineering")
    assert.ok(r.warnings.length === 1, "恰好一条警告")
    assert.ok(r.warnings[0].includes("common.md missing"), "警告点名 common.md")
  } finally {
    writeFileSync(target, bak)
  }
  assert.strictEqual(readFileSync(target, "utf8"), bak, "快照恢复")
})

test("§3.4 降级链③：AGENTS.md 缺失=静默跳过（[4] 层真实注入——caller tail 契约）", () => {
  // VSC-CONTEXT-PARITY 批修四：旧「[4] 层由调用面承担」宣告作废——[4] 层已真实落位
  // （D-CI2：项目指令块 + skills 清单入 setup.mjs systemPrompt 尾）。契约三款：
  // ① caller tail 真实存在（setup.mjs 注入面）；② 场景表仍无 AGENTS/skills 槽文件
  // （四槽位矩阵零变——缺失即静默、无警告需求）；③ 缺失静默语义由 T-CI-2 机判
  // （test/context-parity.test.mjs——AGENTS 缺 → 无 <untrusted_project_instructions>、零报错）。
  for (const files of Object.values(SCENARIO_SLOT_FILES)) {
    if (!files) continue
    assert.ok(files.every((f) => !/AGENTS|skills/i.test(f)), "场景表无 AGENTS/skills 槽——缺失即静默（无警告需求）")
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// §2.7 编写纪律巡检（机械扫——核包 15 文件 + 14 条纪律可机械部分；W2 改指核）。
// ─────────────────────────────────────────────────────────────────────────────
test("§2.7 #13 槽位注释：每文件头部 <!-- slot:[...] consumers:[...] -->（主链 [1]-[3] 数字槽位）", () => {
  for (const f of NEW_PROMPTS) {
    const first = loadSlot(f).split("\n")[0]
    if (["consult-base.md", "advisor-design.md", "advisor-round1.md", "advisor-round2.md", "advisor-round3.md"].includes(f)) {
      // 特殊模块自含——不套前缀法（蓝图 §2 豁免从句）——头部注在即可
      assert.match(first, /^<!-- slot:.+ consumers:\[.+\] -->$/, `${f}: 头部注缺失`)
    } else {
      assert.match(first, /^<!-- slot:\[\d\] consumers:\[.+\] -->$/, `${f}: 头部槽注缺失/变形`)
    }
  }
})

test("§2.7 #9 表行 >200 零命中（dn 4 处随表删源清零——公共层扩容）", () => {
  const hits = []
  for (const f of NEW_PROMPTS) {
    const lines = loadSlot(f).split("\n")
    lines.forEach((l, i) => { if (l.startsWith("|") && l.length > 200) hits.push(`${f}:L${i + 1}(${l.length})`) })
  }
  assert.deepStrictEqual(hits, [], "表行 >200 零命中（common 路由表逐行 ≤200）")
})

test("§2.7 #5 前 20% 巡检词（WAIT/Do NOT/auto/manual/initiated by the user——文件前 20% 区）", () => {
  // 2026-09-12 PROSE-ANCHOR-RETIRE：巡检词正则断言（读 pe 文本）删——读非测试档文本 = 散文锚；
  // 保留 persona-normal 非空面（CLI 20 文件特例同款豁免）。
  {
    assert.ok(pn.length > 100, "persona-normal: 内容在位")
  }
})

test("主链槽位装配非空（六场景全槽在位——终验）", () => {
  for (const s of ["normal", "engineering", "eng-coder", "explore", "coder", "plan"]) {
    assert.ok(engMode[s].prompt.length > 500, `${s}: 装配非空`)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 第 9 批残余（PROMPT-REVIEW-ORDER）：T-RO1–T-RO4（双源逐字锚）2026-09-12 散文锚退役整删；
// 存留 = T-RO5/T-RO6 残余（测试内常量零维护者注）。跨仓逐字由 prompts-mirror-anchors 承载。
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

test("T-RO5/T-RO6 反例+边界：旧三值句/旧相邻形态零残留（本端 6 档）+ 新增文本零维护者注（§2.7 #15）", () => {
  for (const lit of [...ROPE_CHAIN, ROPE_LABEL, ...ROPE_BULLET.split("\n")]) assert.ok(!/\d{4}-\d{2}-\d{2}|第\s*\d+\s*批|评审\s*#/.test(lit), `新增文本含维护者注: ${lit.slice(0, 26)}…`)
})

// ─────────────────────────────────────────────────────────────────────────────
// 锚注入接线面（W2 · CORE-UNIFICATION §2.13.2「VSC 列」/ §2.13.7 · A-K5）：
// ① 表 ⇔ 核锚名集合逐名等值（fail-closed）；② 配置态四装配面零 `{{inject:` 字面 + 13 锚 VSC 值在场；
// ③ 工具描述面特有形态；④ 未配置态恒等；⑤ 入口径（activate() 直调）同断言（A-K5）。
// ─────────────────────────────────────────────────────────────────────────────
test("锚面①：VSC 表 ⇔ 核锚名集合逐名等值（工具面 2 锚——提示词面锚全消 2026-09-17）", () => {
  const core = coreAnchorNames()
  assert.deepStrictEqual(core, Object.keys(VSC_PROMPT_INJECTIONS).sort(), "VSC 表键 ⇔ 核内锚名（逐名等值——新增/缺失即红）")
  assert.equal(core.length, 2, "锚名去重集合 = 2（bash-terminal-face / question-ui-face）")
  assert.ok(!core.includes("agent-loop-pointer"), "旧名单锚零命中")
  assert.equal(core.filter((n) => n.startsWith("agent-loop-ptr-")).length, 0, "agent-loop-ptr-* 指针族已删（正文自足）")
})

test("锚面①b：顾问提示词面零锚（本端该面直读核档、不过注入原语——新增锚即红）", () => {
  // 本端 `advisor/main.mjs` 四常量经 `loadAdvisorPrompt` 直读，不经 `applyPromptInjections`（核内
  // `advisor.mjs` 面 4 才有挂点——本端镜像面随 W12 并入核）⇒「四装配面零字面」在该面靠「核内
  // advisor 档零锚」成立；本断言 = 该前提的 fail-closed 机检（W12 后由核内结构机检承接——§2.13.8（五）6）。
  for (const f of ["advisor-design.md", "advisor-round1.md", "advisor-round2.md", "advisor-round3.md"]) {
    assert.ok(!loadSlot(f).includes(LITERAL), `核内 ${f} 零锚（本端该面无注入位——新增锚即红）`)
  }
})

test("锚面②：配置态四装配面零锚字面 + 「VSC 列」取值逐条在场（场景面特有形态逐条）", () => {
  try {
    configurePromptInjections(VSC_PROMPT_INJECTIONS)
    const { prompts, tools, advisor, union } = assemblyFaces()
    for (const s of SCENARIOS) {
      const r = assemblePrompt(s)
      assert.ok(!r.prompt.includes(LITERAL), `${s}: 装配输出零 ${LITERAL} 字面`)
      assert.deepEqual(r.warnings, [], `${s}: 全槽在位（核包）`)
    }
    for (const t of tools) assert.ok(!t.includes(LITERAL), "工具描述面零锚字面")
    assert.ok(!advisor.includes(LITERAL), "顾问提示词面零锚字面")
    // 全 13 名取值在场（空串 = 显式「本端为空」⇒ 该处零字面，由上一断言覆盖）
    for (const [name, value] of Object.entries(VSC_PROMPT_INJECTIONS)) {
      if (value === "") continue
      assert.ok(union.includes(value), `§2.13.2「VSC 列」取值在场：${name}`)
    }
    // 场景面特有形态（取值落点逐条——含括号 / 后缀边界：前缀重复类缺陷即红）
    const eng = prompts[SCENARIOS.indexOf("engineering")]
    const normal = prompts[SCENARIOS.indexOf("normal")]
    const engCoder = prompts[SCENARIOS.indexOf("eng-coder")]
    assert.ok(prompts[SCENARIOS.indexOf("eng-designer")].includes("docs/README.md"), "eng-designer: 文档地图统一 docs/README.md")
    assert.ok(eng.includes("advisor calls are async by default at the top level"), "engineering: advisor 异步语义正文在场")
    assert.ok(eng.includes("Concurrent pool limits (per role domain)"), "engineering: R14 池规则并入正文")
    assert.ok(!eng.includes("## 改动面反查（文档影响面）"), "engineering: 改动面反查节不在场（消端差）")
    assert.ok(eng.includes("in-child advisor code review"), "engineering: 交付链正文自足")
    assert.ok(normal.includes("Top-level subagent spawns default to async"), "normal: 顶层异步 spawn 语义正文在场")
    assert.ok(normal.includes("Top-level escalate defaults to async"), "normal: 飞刀异步语义正文在场")
    assert.equal((normal.match(/^## 收尾验收$/gm) ?? []).length, 0, "normal: `## 收尾验收` 节已消（内容并入正文）")
    assert.ok(normal.includes("Ctrl+I"), "normal: 会诊终止口径并入正文（两端一致）")
    assert.ok(engCoder.includes("the full loop runs in this same session."), "eng-coder: 交付协议正文自足")
    assert.ok(!engCoder.includes("## Guidelines"), "eng-coder: Guidelines 端特有段已消（并入正文）")
    assert.ok(engCoder.includes("Final review before finishing"), "eng-coder: 收尾自审清单并入正文")
    assert.equal((engCoder.match(/one file at a time/g) ?? []).length, 1, "eng-coder: 核内已承载项不重复")
    assert.equal((engCoder.match(/Out-of-file-list changes/g) ?? []).length, 1, "eng-coder: file 域项不重复")
    assert.ok(!union.includes("AGENT-LOOPAGENT-LOOP"), "整条指针替换（前缀不重复）")
  } finally { resetPromptInjections() }
})

test("锚面③：未配置态恒等（原文过——U0 三态基线「未配置零变」）", () => {
  resetPromptInjections()
  // 提示词面无锚（2026-09-17 消端差）——未配置 ⇒ 工具面锚字面原样过
  assert.ok(builtinTools.map(toOpenAISchema).some((s) => String(s.function.description).includes(LITERAL)), "工具描述面同（未配置恒等）")
})

/** 入口径宿主桩（`test/vscode-mock` 的 `env/ window` 缺两件——测试内补桩并还原：A-K5 驱动面）。 */
function mockContext() {
  return {
    subscriptions: [],
    globalStorageUri: { fsPath: join(tmpdir(), "thincoder-w2-entry-storage") },
    extensionUri: { fsPath: REPO },
    extensionPath: REPO,
    workspaceState: { get: () => undefined, update: async () => {} },
    globalState: { get: () => undefined, update: async () => {} },
    secrets: { get: async () => undefined, store: async () => {}, delete: async () => {} },
  }
}

test("锚面④ A-K5 入口径：activate() 首步配置本端表 ⇒ 四装配面零字面 + 13 锚 VSC 值在场", async () => {
  // mock 补桩面：`vscode-mock` 的 `env/ window` 缺 `language` / `registerWebviewViewProvider` 两件
  // （activate() 全链仅此两处需要）——读-改-还按「原属性是否存在」还原（免留残属性）。
  const hadLang = "language" in vscodeEnv
  const origLang = vscodeEnv.language
  const hadProvider = "registerWebviewViewProvider" in vscodeWindow
  const origProvider = vscodeWindow.registerWebviewViewProvider
  vscodeEnv.language = "en"
  vscodeWindow.registerWebviewViewProvider = () => ({ dispose: () => {} })
  try {
    await activate(mockContext())
    const { prompts, tools, advisor, union } = assemblyFaces()
    for (const t of [...prompts, ...tools, advisor]) assert.ok(!t.includes(LITERAL), "入口径：装配输出零锚字面")
    for (const [name, value] of Object.entries(VSC_PROMPT_INJECTIONS)) {
      if (value === "") continue
      assert.ok(union.includes(value), `入口径：§2.13.2「VSC 列」取值在场：${name}`)
    }
    assert.equal((prompts[SCENARIOS.indexOf("normal")].match(/^## 收尾验收$/gm) ?? []).length, 0, "入口径：收尾验收节已消（内容并入正文）")
    assert.ok(prompts[SCENARIOS.indexOf("normal")].includes("docs/README.md"), "入口径：文档地图统一 docs/README.md")
  } finally {
    if (hadLang) vscodeEnv.language = origLang
    else delete vscodeEnv.language
    if (hadProvider) vscodeWindow.registerWebviewViewProvider = origProvider
    else delete vscodeWindow.registerWebviewViewProvider
    resetPromptInjections()
  }
})
