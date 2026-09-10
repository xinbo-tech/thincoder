/**
 * prompts-mirror-anchors.test.mjs — 提示词双源镜像锚测试（第 5 批 VSC-MIRROR · 面②）。
 *
 * 权威：ENGINEERING-MODE.md §2.22.2（镜像锚 A1–A12）/ §2.22.7（双源结构 + 端特有段 + 跨仓节引用）；
 * 验收：AC39（文本类锚逐字 + A12 宿主）/ AC43（双源结构 + 端特有段）；用例 T62 / T65。
 *
 * 断言五面：
 *   ① 双源同名集合两侧各 15（src/prompts 与 docs/design/prompts，均与 CLI 同仓同名集合相等）；
 *   ② 文本类锚 A1–A8/A11/A12 在 VSC 宿主档（双源两侧）与 CLI 侧逐字相同（A8 = 跨仓同文件 grep）；
 *      A9/A10 为行为锚（宿主是工具/脚本代码），属面① T59/T61，本档不 grep；
 *   ③ 端特有段在镜像中且被断言（非仅锚句——VSC R14 池规则段等，§2.22.7）；
 *   ④ 镜像跨仓节引用不悬空（VSC 侧可解析，或以「（CLI 侧）」注记豁免——§2.22.7 V1 判据）；
 *   ⑤ A12/T65：主 agent 人格含产品经理身份 + spawn eng-designer 调用链，不含 ARCHITECT/交付物旧句。
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
const A12 = ["产品经理", "流程编排者", "调用链", "spawn eng-designer"]

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

test("A12/T65 主 agent 人格改述：产品经理身份 + spawn eng-designer 调用链；不含 ARCHITECT/交付物旧句", () => {
  for (const f of [SRC + "persona-engineering.md", ZH + "persona-engineering.md"]) {
    const t = readRepo(VSC, f)
    for (const s of ["ARCHITECT", "You design and delegate", "你是架构师", "requirements + design documents", "Designer, not Implementer"]) {
      assert.ok(!t.includes(s), `${f}: 旧身份/交付物句残留「${s}」（与本批 D1 需求/设计档=eng-designer 互斥）`)
    }
    assert.ok(t.includes("spawn eng-designer"), `${f}: 调用链段缺 spawn eng-designer`)
  }
})
