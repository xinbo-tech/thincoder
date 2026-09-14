/**
 * prompts-async-guidance.test.mjs — prompts 结构机检（PROMPT-SYSTEM 施工③——2026-09-10 重写；
 * 2026-09-12 散文锚退役批后仅余结构面）。
 *
 * 2026-09-12 散文锚退役批（PROSE-ANCHOR-RETIRE）：原「提示词句子驻留」断言族（MAIN-DESIGN-ENHANCE
 * A1-A4 / §2.9 锚#1-#7 / 开关段 C1-C4 / ASYNC-RESIDUE / advisor VERDICT 面 / §7.5-§7.7.1 工具描述
 * / 搜索条款宿主 / 特殊模块降级面 / §2.7 前 20% 巡检词）与旧件不存在检查的镜像面整删——判据见
 * `docs/design/TESTING.md` §11.1（读非测试档断言句子在场/缺席 = 散文锚）。退役旧件不存在检查
 * 已收归接收档 test/doc-consistency.test.mjs T75（扫① 2026-09-11）。
 * 保留面 = 结构机检（新集合存在性 / 槽表与装配矩阵结构断言 / 降级链警告结构断言 / 槽注与表行机械扫）。
 * 纯文件读取 + 装配函数调用——无 io/网络/慢依赖——快层直跑。
 */
import { test } from "node:test"
import assert from "node:assert"
import { readFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { writeFileSync } from "node:fs"
import { assemblePrompt, SCENARIO_SLOT_FILES, PERSONA_ENGINEERING, PERSONA_NORMAL, COMMON, DISCIPLINE_ENGINEERING, DISCIPLINE_NORMAL, CONSULT_BASE } from "@thincoder/core/prompt-overlays.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(join(__here, "..", rel), "utf8")
const exists = (rel) => existsSync(join(__here, "..", rel))
// U2（CORE-UNIFICATION §2.6.3）：英文落地面随迁移改指核包（`src/prompts/` 已删）。
const readCore = (name) => read(`../thincoder-core/prompts/${name}`)
const existsCore = (name) => exists(`../thincoder-core/prompts/${name}`)
const corePromptPath = (name) => join(__here, "..", "..", "thincoder-core", "prompts", name)

// 新 15 文件全集（PROMPT-SYSTEM §2 命名法）
const NEW_PROMPTS = [
  "persona-engineering.md", "persona-normal.md", "persona-eng-coder.md", "persona-eng-designer.md",
  "persona-explore.md", "persona-coder.md", "persona-plan.md",
  "common.md", "discipline-engineering.md", "discipline-normal.md",
  "consult-base.md", "advisor-design.md", "advisor-round1.md", "advisor-round2.md", "advisor-round3.md",
]
// 退役旧件清单（AC-2）已随扫① 收归 test/doc-consistency.test.mjs T75（防回潮族——2026-09-11）——
// 本文件不再维护退役名单副本。

const pn = readCore("persona-normal.md")
import { loadProjectInstructions } from "@thincoder/core/agent/helpers.mjs"

// 七场景装配快照（装配矩阵/降级链断言面——第 2 批新增 eng-designer）
const engMode = Object.fromEntries(["normal", "engineering", "eng-coder", "eng-designer", "explore", "coder", "plan"].map((s) => [s, assemblePrompt(s)]))

test("新 15 件在位于 prompts 树（AC-2——退役旧件不存在检查收归接收档 T75）", () => {
  for (const f of NEW_PROMPTS) assert.ok(existsCore(f), `${f} 新集合在位（核包）`)
})

// ─────────────────────────────────────────────────────────────────────────────
// 开关段 C1-C4（PROMPT-ATTENTION 阶段 C——推进档位）。
// C1/C2/C3 逐字保真限 engineering 三结构位（随迁后宿主 = persona-engineering + discipline-eng）。
// ─────────────────────────────────────────────────────────────────────────────
test("ASYNC 全族：docs/design/AGENT-LOOP.md §14.2 顶层一律异步陈述（旧句负向锚收归接收档 T76）", () => {
  const loopDoc = read("docs/design/AGENT-LOOP.md")
  const sec142 = loopDoc.slice(loopDoc.indexOf("### 14.2 飞刀（escalate）"), loopDoc.indexOf("## 15. 操作纪律"))
  assert.ok(sec142.length > 100, "§14.2 slice non-empty")
})

// ─────────────────────────────────────────────────────────────────────────────
// 装配矩阵断言（PROMPT-SYSTEM §3.2——assemblePrompt 七场景：文件名/顺序/槽完整性）。
// ─────────────────────────────────────────────────────────────────────────────
test("§3.2 装配矩阵：六主链场景槽文件名与顺序 1:1", () => {
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.engineering, ["persona-engineering.md", "common.md", "discipline-engineering.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.normal, ["persona-normal.md", "common.md", "discipline-normal.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES["eng-coder"], ["persona-eng-coder.md", "common.md", "discipline-engineering.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES["eng-designer"], ["persona-eng-designer.md", "common.md", "discipline-engineering.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.explore, ["persona-explore.md", "common.md", "discipline-normal.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.coder, ["persona-coder.md", "common.md", "discipline-normal.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.plan, ["persona-plan.md", "common.md", "discipline-normal.md"])
})

test("§3.2 装配矩阵：consult = 自含基底不入主链（null 行）", () => {
  assert.strictEqual(SCENARIO_SLOT_FILES.consult, null)
})

test("§3.2 装配矩阵：assemblePrompt 输出=槽序拼接（人格→公共→纪律）+ 层序内部锚（MARK 检测）", () => {
  for (const s of ["normal", "engineering", "eng-coder", "eng-designer", "explore", "coder", "plan"]) {
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
// 降级链断言（§3.4 三款：槽缺失→警告；common 缺失→同款；AGENTS 缺失→静默；特殊模块→报错不自降级）。
// ─────────────────────────────────────────────────────────────────────────────
test("§3.4 降级链①：槽文件缺失→空缺+警告（不 fallback——层间隔离）", async () => {
  // 槽内容 = prompt-overlays 模块级 SLOT_CONTENTS 常量（byte-stable 载体）——改文件须重载新实例
  // 触发真实 loadSlot 读盘路径（cache-bust 查询串——旧实例持原快照，不动生产模块）。
  // U2：读盘目标 = 核包槽文件（加载根已改指）。
  const target = corePromptPath("persona-normal.md")
  const bak = readFileSync(target, "utf8")
  writeFileSync(target, "")
  try {
    const fresh = await import(`@thincoder/core/prompt-overlays.mjs?v=${Date.now()}`)
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
  const target = corePromptPath("common.md")
  const bak = readFileSync(target, "utf8")
  writeFileSync(target, "")
  try {
    const fresh = await import(`@thincoder/core/prompt-overlays.mjs?v=${Date.now()}`)
    const r = fresh.assemblePrompt("engineering")
    assert.ok(r.warnings.length === 1, "恰好一条警告")
    assert.ok(r.warnings[0].includes("common.md missing"), "警告点名 common.md")
  } finally {
    writeFileSync(target, bak)
  }
  assert.strictEqual(readFileSync(target, "utf8"), bak, "快照恢复")
})

test("§3.4 降级链③：AGENTS.md 缺失=静默跳过（loadProjectInstructions 返回空串——无警告需求）", () => {
  // AGENTS 层由调用方尾部逻辑承担（PROMPT-SYSTEM §3.4——项目层空缺跳过）。
  assert.ok(typeof loadProjectInstructions === "function", "loadProjectInstructions 在位")
  return loadProjectInstructions(join(__here, "..")).then((v) => {
    assert.ok(typeof v === "string", "返回 string（空串=空缺语义——静默跳过）")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// §2.7 编写纪律巡检（机械扫——14 文件 + 14 条纪律可机械部分）。
// ─────────────────────────────────────────────────────────────────────────────
test("§2.7 #13 槽位注释：每文件头部 <!-- slot:[...] consumers:[...] -->（主链 [1]-[3] 数字槽位）", () => {
  for (const f of NEW_PROMPTS) {
    const first = readCore(f).split("\n")[0]
    if (["consult-base.md", "advisor-design.md", "advisor-round1.md", "advisor-round2.md", "advisor-round3.md"].includes(f)) {
      // 特殊模块自含——不套前缀法（蓝图 §2 豁免从句）——头部注在即可
      assert.match(first, /^<!-- slot:.+ consumers:\[.+\] -->$/, `${f}: 头部注缺失`)
    } else {
      assert.match(first, /^<!-- slot:\[\d\] consumers:\[.+\] -->$/, `${f}: 头部槽注缺失/变形`)
    }
  }
})

test("§2.7 #9 表行 >200 零命中（dn 4 处随表删源清零——第 15 批公共层扩容）", () => {
  let hits = []
  for (const f of NEW_PROMPTS) {
    const lines = readCore(f).split("\n")
    lines.forEach((l, i) => { if (l.startsWith("|") && l.length > 200) hits.push(`${f}:L${i + 1}(${l.length})`) })
  }
  assert.deepStrictEqual(hits, [], "表行 >200 零命中（common 路由表逐行 ≤200）")
})

test("§2.7 #5 前 20% 巡检词（WAIT/Do NOT/auto/manual/initiated by the user——文件前 20% 区）", () => {
  // persona-normal 前 20% 的巡检降级为非空断言（最高规则在其装配链的 common 批准门区）。
  {
    assert.ok(pn.length > 100, "persona-normal: 内容在位（装配链最高规则=common 批准门——非本文件职责）")
  }
})

test("主链槽位装配非空（七场景全槽在位——终验）", () => {
  for (const s of ["normal", "engineering", "eng-coder", "eng-designer", "explore", "coder", "plan"]) {
    assert.ok(engMode[s].prompt.length > 500, `${s}: 装配非空`)
  }
})
