/**
 * spawn-gates.test.mjs — M5 委派与 spawn 门（ENGINEERING-MODE-V2-MODULE-DELEGATION.md §3）
 * 单元面（谓词层 + schema/门接线断言——装配点 seam 面用例 = thincoder-cli/test/batch-doc-gate.test.mjs）：
 *   T1 工程角色带齐字段 → 放行（validateTaskBookFields 不抛）
 *   T2 round=fix → 放行（F4 已裁撤——2026-09-17 主 agent 裁定：散文 marker 不可机判）
 *   T3 files 内容产物（源文件 + 设计档）→ normalizeFileList 放行（归一化为绝对路径）
 *   T6 缺 round / round 非法 / 缺任一文本字段 → 拒（派单缺陷文案）
 *   T8 files 传 scripts/** / 过程档（TODO/CHANGELOG/checklist 族）→ 拒；目录声明 → 拒（继承）
 *   T8f files 传 PROJECT-MANIFEST.json（任一层 / 任意大小写）→ 拒（#33 二道防线——KD-M1-14）
 *   U4 单源锁（schema round enum ≡ ROUND_VALUES 同一引用 + 字面量锁 + 成员逐一放行）+ U7 门行为零回归（工程模式拒 role='plan'——KD-M5-9/10）
 * F5（角色 enum 的 advisor 项）裁撤——advisor 不入 spawn 通道（无对应用例）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { resolve } from "node:path"

import {
  validateTaskBookFields, rejectEngineeringFilePaths, ROUND_VALUES,
} from "../agent-tools/spawn-gates.mjs"
import { subagentTool } from "../agent-tools/subagent.mjs"
import { normalizeFileList } from "../agent-tools/subagent-scheduler.mjs"

/** F2 六强制字段齐备任务书（五段文本字段 + round 结构化参数——T1 正常形态）。 */
const FULL_BOOK = [
  "目标与理由：实现 spawn 门禁。",
  "已知事实：spawn 链单源在核。",
  "设计要点与禁止范围：仅改 spawn 装配面；禁动文档。",
  "验收标准：AC-M5-1..6 全过、测试绿。",
  "交付报告格式：交付表 + 路径 + 验证命令。",
].join("\n")

const CWD = "C:/w"

// ── T1 / T2 正常放行 ────────────────────────────────────────────────────────
test("T1 validateTaskBookFields: 六字段齐备 + round=initial → 放行", () => {
  assert.doesNotThrow(() => validateTaskBookFields({ task: FULL_BOOK, round: "initial" }))
})

test("T1b validateTaskBookFields: 五段文本字段落在 context 面（task 短书 + context 携带）→ 放行", () => {
  assert.doesNotThrow(() => validateTaskBookFields({
    task: "按批准设计实现（见 context 任务书）。",
    context: FULL_BOOK,
    round: "initial",
  }))
})

test("T2 validateTaskBookFields: round=fix（无全量勘察 marker）→ 放行（fix 轮被接受）", () => {
  assert.doesNotThrow(() => validateTaskBookFields({ task: FULL_BOOK, round: "fix" }))
})

// ── T6 缺字段 / 非法值 → 拒 ─────────────────────────────────────────────────
test("T6 validateTaskBookFields: 缺 round → 拒（派单缺陷）", () => {
  assert.throws(() => validateTaskBookFields({ task: FULL_BOOK }),
    /round \(initial\|fix\)/)
  assert.throws(() => validateTaskBookFields({ task: FULL_BOOK }),
    /missing mandatory field/)
})

test("T6b validateTaskBookFields: round 非法值 → 拒（枚举收窄）", () => {
  assert.throws(() => validateTaskBookFields({ task: FULL_BOOK, round: "v2" }),
    /round ∈ \{initial, fix\}/)
})

test("T6c validateTaskBookFields: 缺任一文本字段 → 拒（五段逐缺各拒，文案带缺段名）", () => {
  const fields = [
    "目标与理由：实现 spawn 门禁。",
    "已知事实：spawn 链单源在核。",
    "设计要点与禁止范围：仅改 spawn 装配面；禁动文档。",
    "验收标准：AC-M5-1..6 全过、测试绿。",
    "交付报告格式：交付表 + 路径 + 验证命令。",
  ]
  for (const drop of fields) {
    const book = fields.filter((f) => f !== drop).join("\n")
    assert.throws(() => validateTaskBookFields({ task: book, round: "initial" }), /missing mandatory field/, drop)
  }
})

test("T6d validateTaskBookFields: 空参 / 无任务书 → 拒", () => {
  assert.throws(() => validateTaskBookFields({}), /missing mandatory field/)
  assert.throws(() => validateTaskBookFields(null), /missing mandatory field/)
})

// ── U4 单源锁 / U7 门行为零回归（KD-M5-9 / KD-M5-10）─────────────────────────
test("U4 单源锁：schema round enum ≡ ROUND_VALUES（同一引用）+ 字面量锁 + 成员逐一放行", () => {
  assert.equal(subagentTool.parameters.properties.round.enum, ROUND_VALUES, "schema enum 与常量同一引用（非内联副本——改枚举值只改 spawn-gates.mjs 一处）")
  assert.deepEqual(ROUND_VALUES, ["initial", "fix"], "契约字面量锁 initial|fix")
  for (const r of ROUND_VALUES) {
    assert.doesNotThrow(() => validateTaskBookFields({ task: FULL_BOOK, round: r }), `${r} 逐成员放行`)
  }
})

test("U7 门行为零回归：工程模式 spawn role='plan' → 拒（门文案仍点名 plan）", async () => {
  const parent = { cwd: CWD, config: { agent: { engineering: true } } }
  const err = await subagentTool.execute({ task: FULL_BOOK, role: "plan" }, { agent: parent, depth: 0, callbacks: {} })
    .then(() => undefined, (e) => e)
  assert.match(err?.message ?? "", /role='plan' is disabled/, "门文案零改（plan 仍可被指名拒绝）")
})

// ── T3 / T8 files 声明面 ────────────────────────────────────────────────────
test("T3 normalizeFileList: 内容产物（源文件 + 设计档）→ 放行并归一化为绝对路径", () => {
  const out = normalizeFileList(["src/a.mjs", "docs/design/X.md"], CWD)
  assert.deepEqual(out, [resolve(CWD, "src/a.mjs"), resolve(CWD, "docs/design/X.md")])
})

test("T8 rejectEngineeringFilePaths: scripts/** 任一层段 → 拒（工程工具面不入域）", () => {
  for (const f of ["scripts/x.mjs", "thincoder/scripts/y.mjs", "C:/w/thincoder/scripts/z.mjs", "SCRIPTS/a.mjs"]) {
    assert.throws(() => rejectEngineeringFilePaths([f]), /engineering tool path/, f)
  }
})

test("T8b rejectEngineeringFilePaths: 过程档族（CHANGELOG）→ 拒（父侧职责；台账已移用户目录不入族）", () => {
  for (const f of ["CHANGELOG.md", "docs/CHANGELOG.MD"]) {
    assert.throws(() => rejectEngineeringFilePaths([f]), /Parent-side maintained file/, f)
  }
  assert.doesNotThrow(() => rejectEngineeringFilePaths(["docs/TODO.md", "ledger.db"]), "老 md 台账族 / 项目内 ledger.db 已退役——不再拦截")
})

test("T8c rejectEngineeringFilePaths: 内容产物 + 违规混合 → 收集全部违规并拒（两条都在文案）", () => {
  try {
    rejectEngineeringFilePaths(["src/a.mjs", "scripts/x.mjs", "CHANGELOG.md"])
    assert.fail("should have thrown")
  } catch (e) {
    assert.match(e.message, /engineering tool path scripts\/x\.mjs/)
    assert.match(e.message, /Parent-side maintained file CHANGELOG\.md/)
  }
})

test("T8d normalizeFileList: scripts / 过程档 → 同拒（谓词已接线——错误经同一通道）", () => {
  assert.throws(() => normalizeFileList(["scripts/x.mjs"], CWD), /engineering tool path/)
  assert.throws(() => normalizeFileList(["CHANGELOG.md"], CWD), /Parent-side maintained file/)
})

test("T8e normalizeFileList: 目录声明 → 拒（继承行为——错误文案逐字不变）", () => {
  assert.throws(() => normalizeFileList(["test/"], CWD), /directory declarations are not supported/)
  assert.throws(() => normalizeFileList(["test/ "], CWD), /directory declarations are not supported/)
})

// ── T8f #33 二道防线：PROJECT-MANIFEST.json 声明面（写门唯主 agent——设计 §2.5 / KD-M1-14）──
test("T8f（设计 §3.2 T30）rejectEngineeringFilePaths: PROJECT-MANIFEST.json 任一层 / 任意大小写 → 拒（稳定片段 /Manifest file/）", () => {
  for (const f of ["PROJECT-MANIFEST.json", "PROJECT-MANIFEST.JSON", "sub/PROJECT-MANIFEST.json", "a/b/project-manifest.json", "C:/w/thincoder/PROJECT-MANIFEST.json"]) {
    assert.throws(() => rejectEngineeringFilePaths([f]), /Manifest file/, f)
  }
  // 混合收集：manifest 与过程档各成一条（既有文案逐字不变）
  try {
    rejectEngineeringFilePaths(["src/a.mjs", "CHANGELOG.md", "PROJECT-MANIFEST.json"])
    assert.fail("should have thrown")
  } catch (e) {
    assert.match(e.message, /Manifest file PROJECT-MANIFEST\.json/)
    assert.match(e.message, /Parent-side maintained file CHANGELOG\.md/)
  }
  // 近名不误伤（非该 basename）
  assert.doesNotThrow(() => rejectEngineeringFilePaths(["MANIFEST.md", "thincoder-core/manifest.mjs", "docs/project-manifest.md"]))
  // 装配点通道：normalizeFileList 同拒（谓词已接线——错误经同一通道）
  assert.throws(() => normalizeFileList(["PROJECT-MANIFEST.json"], CWD), /Manifest file/)
})
