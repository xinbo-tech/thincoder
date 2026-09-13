/**
 * ledger-check.test.mjs — 台账机检用例（LEDGER-SELF-CONTAINED 批 §7 · T-VS1 · T-VS4–T-VS6 · T-VS35 + L2/L3 面；S4 单仓化修订）。
 *
 * 夹具 = 临时工作区 `<ws>/thincoder-vscode`（本域根）；「仓」= 合并仓（单仓语义——设计档 TWO-REPO-MERGE.md §2.4 R9：
 * 跨仓闸删除，L4 收为本仓可解析；跨仓类断言段 T-VS2 / T-VS3 随批删除）。
 * 组语义：L1 指针可解析（基根组）· L4 本仓可解析（基根组 / 唯一 basename；越出根禁——`仓根外前缀` / `仓根外绝对路径`）。
 * 基线（B16 阈值 = 0）：**必须保持为空**——非空即 FAIL（固定句「本基线必须保持为空」）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { main, runCheck } from "../../scripts/check-ledger.mjs"

/** 夹具：写临时工作区文件集（键 = 相对路径）。 */
function fixture(files) {
  const ws = mkdtempSync(join(tmpdir(), "ledger-check-"))
  for (const [rel, content] of Object.entries(files)) {
    const p = join(ws, rel)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, content, "utf8")
  }
  return ws
}
/** 基础工作区：本仓需求 / 任务档 + 源文件在位。 */
const base = (ledger, extra = {}) => ({
  "thincoder-vscode/docs/TODO.md": ledger,
  "thincoder-vscode/docs/requirements/DEMO.md": "# DEMO\n\n## 1. 目标\n\n正文。\n",
  "thincoder-vscode/docs/batches/B.md": "# B\n\n## §2 任务\n\n正文。\n",
  "thincoder-vscode/src/a.mjs": "export const a = 1\n",
  ...extra,
})
const POOL_OK = "- [ ] **本仓项** → 需求 本仓 `docs/requirements/DEMO.md` §1 · 任务书 `docs/batches/B.md` §2 · status=待设计\n"
const TECH_OK = "- [ ] **技术项** → 证据 `src/a.mjs:3`（说明）· 触发=认账不排期\n"
const groups = (pool, tech) => `# TODO\n\n## 需求池（1 条）\n\n${pool}\n## 技术待办（1 条）\n\n${tech}\n`
/** 运行 main 并捕获输出（退出码语义可断言）。 */
function run(root, args = ["docs/TODO.md"]) {
  const lines = []
  const code = main(["--root", root, ...args.flatMap((a) => ["--ledger", a])], { log: (s) => lines.push(s) })
  return { code, out: lines.join("\n") }
}

// T-VS1 正常：本仓指针全解析 → 零违规；退出码 0
test("T-VS1 正常：本仓指针 + 证据全解析 → 零 L4；退出码 0", () => {
  const ws = fixture(base(groups(POOL_OK, TECH_OK)))
  try {
    const root = join(ws, "thincoder-vscode")
    const r = runCheck({ root, ledgers: [{ path: "docs/TODO.md", live: true }] })
    assert.equal(r.fresh.length, 0, `fresh=${JSON.stringify(r.fresh.map((v) => v.msg))}`)
    assert.equal(run(root).code, 0)
  } finally { rmSync(ws, { recursive: true, force: true }) }
})

// T-VS2 / T-VS3（跨仓证据 / 跨仓指针 → [L4]）随 S4 整段删除——跨仓闸判据已退役（设计档 §2.4 R9）；
// 「越出根必报」的存留语义由 T-VS35（仓根外前缀 / 越根绝对路径）覆盖。

// T-VS4 边界：零假阳（无路径散文 / `名称（仓别）§N` 规范形态 / 组标题行）
test("T-VS4 边界：散文 + 规范形态 + 组标题行 → 零 L4", () => {
  const ledger = "# TODO\n\n> 形态权威 = `ENGINEERING-MODE（CLI 仓）§1.13`——对位声明，非条目。\n\n"
    + "## 需求池（1 条）\n\n"
    + "- [ ] **零假阳** → 与 ACME（某仓）§3 同源（镜像登记）· 需求 本仓 `docs/requirements/DEMO.md` §1 · 任务书 `docs/batches/B.md` §2 · status=待讨论\n"
    + "\n## 技术待办（1 条）\n\n" + TECH_OK
  const ws = fixture(base(ledger))
  try {
    const root = join(ws, "thincoder-vscode")
    const r = runCheck({ root, ledgers: [{ path: "docs/TODO.md", live: true }] })
    assert.equal(r.fresh.length, 0, `fresh=${JSON.stringify(r.fresh.map((v) => v.msg))}`)
  } finally { rmSync(ws, { recursive: true, force: true }) }
})

// T-VS5 反证：基线不得再设——非空基线 ⇒ FAIL（固定句）；违规一律阻断
test("T-VS5 反证：基线不得再设——非空基线 ⇒ FAIL（固定句）；违规一律阻断", () => {
  const pool = "- [ ] **坏指针项** → 需求 `NOSUCH-DOC.md` §9 · 任务书 `docs/batches/B.md` §2 · status=待设计\n"
  const ws = fixture(base(groups(pool, TECH_OK)))
  try {
    const root = join(ws, "thincoder-vscode")
    const ledgers = [{ path: "docs/TODO.md", live: true }]
    const keys = runCheck({ root, ledgers }).fresh.map((v) => v.key)
    assert.ok(keys.length >= 1, "坏指针为阻断面（反证非空转）")
    const bfile = join(root, "test", "fixtures", "ledger-baseline.json")
    mkdirSync(dirname(bfile), { recursive: true })
    writeFileSync(bfile, JSON.stringify({ entries: keys }), "utf8")
    const blocked = run(root)
    assert.equal(blocked.code, 1, "非空基线 ⇒ 阻断（不再降报告）")
    assert.ok(blocked.out.includes("FAIL(基线)"), "FAIL(基线) 面在位")
    assert.ok(blocked.out.includes("**本基线必须保持为空**"), "固定句在位")
    writeFileSync(bfile, JSON.stringify({ entries: [] }), "utf8")
    const clean = runCheck({ root, ledgers })
    assert.deepStrictEqual(clean.baseline, [], "基线已清空")
    assert.ok(clean.fresh.length >= 1, "违规照报（基线清空后不豁免）")
  } finally { rmSync(ws, { recursive: true, force: true }) }
})

// T-VS6 正常/错误：L4② 判据精化（省略前缀仓内定位通过；不可定位仍红）
test("T-VS6 正常/错误：L4② 判据精化（省略前缀仓内定位通过；不可定位仍红）", () => {
  const ok = "- [ ] **省略前缀** → 证据 `a.mjs:3`（省略目录前缀——仓内唯一 basename）· 触发=认账不排期\n"
  const ws = fixture(base(groups(POOL_OK, ok)))
  try {
    const root = join(ws, "thincoder-vscode")
    const r = runCheck({ root, ledgers: [{ path: "docs/TODO.md", live: true }] })
    assert.equal(r.fresh.length, 0, `fresh=${JSON.stringify(r.fresh.map((v) => v.msg))}`)
  } finally { rmSync(ws, { recursive: true, force: true }) }
  const miss = "- [ ] **不可定位** → 证据 `nosuch.mjs:3`（本仓无同名文件）· 触发=认账不排期\n"
  const ws2 = fixture(base(groups(POOL_OK, miss)))
  try {
    const root = join(ws2, "thincoder-vscode")
    const r = runCheck({ root, ledgers: [{ path: "docs/TODO.md", live: true }] })
    assert.ok(r.fresh.some((v) => v.kind === "L4"), `不可定位仍红：${JSON.stringify(r.fresh.map((v) => v.msg))}`)
    assert.equal(run(root).code, 1)
  } finally { rmSync(ws2, { recursive: true, force: true }) }
})

// L2/L3 语义同源面：组计数不符 → [L2]；活档 `- [x]` → [L3⑤]
test("L2/L3：组计数不符 + 活档 `- [x]` 照报（同源判据面）", () => {
  const ledger = "# TODO\n\n## 需求池（3 条）\n\n" + POOL_OK + "\n- [x] **已核销项** → status=已核销\n"
  const ws = fixture(base(ledger))
  try {
    const root = join(ws, "thincoder-vscode")
    const r = runCheck({ root, ledgers: [{ path: "docs/TODO.md", live: true }] })
    assert.ok(r.fresh.some((v) => v.kind === "L2" && v.msg.includes("组计数不符")))
    assert.ok(r.fresh.some((v) => v.msg.includes("活文件含 `- [x]`")))
  } finally { rmSync(ws, { recursive: true, force: true }) }
})

// T-VS35 错误：L4② 假阴面反证 + 全匹配（收紧——本端；AC-VS32 · AC-VS33）
test("T-VS35 错误：L4② 收紧（仓根外前缀 / 越根绝对路径 ⇒ 必报；省略 / 陈旧前缀零回归；全匹配逐处判——端差消解）", () => {
  const ws = fixture(base("# TODO\n", { "thincoder/src/agent/x.mjs": "export const x = 1\n" }))
  try {
    const root = join(ws, "thincoder-vscode")
    const abs = join(ws, "thincoder", "src", "agent", "x.mjs").replace(/\\/g, "/")
    const ledger = "# TODO\n\n## 需求池（0 条）\n\n## 技术待办（5 条）\n\n"
      + "- [ ] **仓根外前缀** → 证据 `pkg/src/a.mjs:10`（前缀首段非本端现存）· 触发=认账不排期\n"
      + "- [ ] **省略前缀对照** → 证据 `a.mjs:3`（仓内唯一 basename）· 触发=认账不排期\n"
      + "- [ ] **陈旧前缀对照** → 证据 `src/old/a.mjs:12`（首段现存）· 触发=认账不排期\n"
      + "- [ ] **双证据条** → 证据 `a.mjs:3` · `other/a.mjs:11`（次处仓根外前缀）· 触发=认账不排期\n"
      + `- [ ] **越根绝对路径** → 证据 \`${abs}:9\`（绝对路径越出根）· 触发=认账不排期\n`
    writeFileSync(join(root, "docs", "TODO.md"), ledger, "utf8")
    const r = runCheck({ root, ledgers: [{ path: "docs/TODO.md", live: true }] })
    const l4 = r.fresh.filter((v) => v.kind === "L4")
    assert.equal(l4.length, 3, `L4=${JSON.stringify(l4.map((v) => v.msg))}`)
    assert.equal(l4.filter((v) => v.msg.includes("仓根外前缀（首段非仓根条目）")).length, 2, "①③ 均报「仓根外前缀」")
    assert.ok(l4.some((v) => v.msg.includes("仓根外绝对路径")), "⑤ 越根绝对路径必报")
    assert.ok(l4.some((v) => v.key.includes("pkg/src/a.mjs")), "① 假阴面必报（旧 basename 回退会漏）")
    assert.ok(l4.some((v) => v.key.includes("other/a.mjs")), "③ 全匹配逐处判（次处越根——首匹配会漏——端差消解）")
    assert.ok(!l4.some((v) => v.key.endsWith("|a.mjs:3")), "② 省略前缀对照条零报")
    assert.ok(!l4.some((v) => v.key.includes("src/old/a.mjs")), "② 陈旧前缀对照条零报")
    assert.equal(run(root).code, 1, "退出码 1（fail-closed）")
  } finally { rmSync(ws, { recursive: true, force: true }) }
})
