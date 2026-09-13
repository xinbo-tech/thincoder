/**
 * doc-anchors.test.mjs — V5「文档锚一致性」用例（合并仓统一版——S4 单仓化：跨仓面删除；
 * 设计 `ENGINEERING-MODE.md` §2.32 / §3.1 AC-V5-1–AC-V5-16；需求 §1.20 / FR26）。
 *
 * 宿主 = 本档（T-V5-1–T-V5-12 · T-V5-15 · T-V5-16）；T-V5-13/14 = `test/doc-impact.test.mjs`（轮 3）。
 * 判据面：纯函数 / 临时域夹具用例走**快层**；**主行程 CLI（子进程 spawn）/ 真实域复跑用例走 `slow()` 归册**。
 * 两态由显式 `gate` 参数 / CLI `--v5-gate`·`--v5-report` 驱动；夹具用例域自持——**不读真实扫描域**（真实域复跑 = T-V5-15② 专例）。
 * S4 单仓化（设计档 TWO-REPO-MERGE.md §2.4 R1–R3）：对端仓根解析 / 域外降级段已删；仓内相对路径 token（含
 * `thincoder-vscode/…` 前缀形）照判（解析命中即过、悬空即报——T-V5-5⑦ 夹具随单仓化重述）。
 */
import { test, beforeEach, afterEach } from "node:test";
import { slow } from "./slow.mjs";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  V5_GATE, V5_SCAN_DIRS, NOTE_MARKERS, extractAnchors, scanDocAnchors, formatReport,
} from "../../scripts/doc-anchors.mjs";
import { checkDocConsistency, SCAN_DIRS, BASELINE_PATH } from "../../scripts/check-doc-width.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MERGED = resolve(REPO, ".."); // 合并仓根（S4——仓根统一版脚本 + 全域/产品域两态）
const SCRIPT = join(MERGED, "scripts", "doc-anchors.mjs");

let tmp;
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "doc-anchors-")); });
afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

/** 夹具档（相对 tmp 的路径；目录自动建）。 */
function doc(rel, content) {
  const p = join(tmp, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
  return p;
}
/** 夹具域扫描（域 = tmp 自身——确定性）。 */
const scan = (opts = {}) => scanDocAnchors(tmp, { ...opts });
const kinds = (r, clazz) => r.rows.filter((x) => x.clazz === clazz).map((x) => x.anchor);
/** CLI 主行程（夹具域 = cwd）。 */
const cli = (args = []) => spawnSync(process.execPath, [SCRIPT, ...args], {
  cwd: tmp, encoding: "utf8",
});

test("T-V5-1 正常/反证：用例号锚（定义面 + 注记）——仅悬空号报", () => {
  doc("test/host.test.mjs", 'test("T41 已有宿主", () => {});\n');
  doc("scripts/host.mjs", "export const presentSymbolName = 1;\n");
  doc("docs/design/case-anchor.md", [
    "# 夹具：用例号锚",
    "",
    "悬空号（三源均无、同行无注记）：T-V5-9 从未定义。",
    "",
    "定义面命中（test 树）：T41 有宿主。",
    "",
    "| # | 名称 |",
    "|---|---|",
    "| T-V5-12 | 表格首格定义面 |",
    "",
    "悬空但同行注记：T-V5-8 已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `scripts/host.mjs:3`）。",
  ].join("\n"));
  const r = scan();
  assert.deepStrictEqual(r.rows, [{ file: "docs/design/case-anchor.md", line: 3, anchor: "T-V5-9", clazz: "用例号" }],
    "仅 ① 报（报行含档:行 + 号 + 锚类）；② 定义面 / ③ 注记零命中");
  assert.equal(r.exempt.case, 1, "注记豁免条数可见（防标记集滥用——§2.32.3.3）");
  assert.deepStrictEqual(r.dang, { case: 1, path: 0, symbol: 0 }, "计数面逐类可核（域外类随 S4 删除）");
});

test("T-V5-2 正常：路径/坐标锚（射程 + 排除式）——仅悬空路径报", () => {
  doc("docs/design/paths.md", [
    "# 夹具：路径射程",
    "",
    "① 悬空路径：docs/design/nope-missing.md 无宿主。",
    "② 现存路径：docs/design/paths.md（本档自身）。",
    "③ 占位形态：docs/design/X.md 与 docs/design/<file>.md 射程外。",
    "④ 裸 basename 无坐标：README.md 射程外。",
  ].join("\n"));
  const r = scan();
  assert.deepStrictEqual(kinds(r, "路径/坐标"), ["docs/design/nope-missing.md"], "仅 ① 报；③ 占位 / ④ 裸 basename 不报");
  // 轮 3 判据锁定：排除式 5① 只豁免 `.md`（非 `.md` + `§N` 照判）；坐标含行区间 `:N-M`（整条抽取、不截断）
  const direct = extractAnchors("`.md` 豁免：docs/design/paths.md:1-2 §3；非 `.md` 照判：scripts/side-here.mjs:3 §2；行区间：scripts/side-here.mjs:12-15 §2。");
  assert.deepStrictEqual(direct.paths.map((p) => p.anchor), ["scripts/side-here.mjs:3", "scripts/side-here.mjs:12-15"],
    "非 `.md` token 不再整条豁免；`:N-M` 坐标整条抽取");
  doc("docs/design/narrowed.md", "# 反证\n\n非 `.md` + `§N` 悬空照判：scripts/absent-side.mjs:3 §2。\n");
  assert.deepStrictEqual(kinds(scan(), "路径/坐标"), ["scripts/absent-side.mjs:3", "docs/design/nope-missing.md"],
    "收窄反证：非 `.md` token + `§N` 缺 ⇒ 报（不再静默豁免）");
});

test("T-V5-3 边界：解析序（档相对 / 唯一 basename / 仓内前缀路径）", () => {
  doc("docs/requirements/rel.md", "# 档相对目标\n");
  doc("docs/design/unique-name.md", "# 唯名 basename 宿主\n");
  doc("thincoder-vscode/docs/design/AGENT-LOOP.md", "# 仓内另一域档（供前缀路径形态）\n");
  doc("docs/design/order.md", [
    "# 夹具：解析序",
    "",
    "① 档相对：../requirements/rel.md 可解析。",
    "② 唯名 basename：docs/unique-name.md 仓内唯一命中。",
    "③ 前缀路径（单仓相对路径）：thincoder-vscode/docs/design/AGENT-LOOP.md 可解析（S4 单仓化）。",
  ].join("\n"));
  const r = scan();
  assert.deepStrictEqual(r.rows, [], "三者均通过（零命中）");
  assert.equal(r.cand.path, 3, "三锚均在射程内（非空转）");
});

test("T-V5-4 正常/反证：符号锚窄形态——仅缺符号报", () => {
  doc("scripts/host.mjs", "export const presentSymbolName = 1;\n");
  doc("docs/design/symbols.md", [
    "# 夹具：符号窄形态",
    "",
    "① 谓词 + 宿主坐标但宿主无此符号：`ghostSymbolName` 定义于 `scripts/host.mjs:12`。",
    "② 宿主有此符号：`presentSymbolName` 定义于 `scripts/host.mjs:3`。",
    "③ 无宿主/无谓词的悬空符号：`looseSymbolName` 见别处。",
  ].join("\n"));
  const r = scan();
  assert.deepStrictEqual(kinds(r, "符号"), ["ghostSymbolName"], "仅 ① 报（②③ 零命中）");
  assert.ok(r.wideRows.some((x) => x.anchor === "looseSymbolName"), "③ 归宽形态报告面（不入闸）");
});

test("T-V5-5 边界：假阳类零命中（逐类钉死；⑦ 随 S4 单仓化重述）", () => {
  doc("docs/design/exists.md", "# 存在档\n");
  doc("thincoder-vscode/docs/design/AGENT-LOOP.md", "# 仓内另一域档\n"); // ⑦ 前缀路径形态的命中目标（单仓相对路径）
  doc("docs/design/false-positive.md", [
    "# 假阳类夹具",
    "",
    "① 内部编号：AC-V5-1 / D-V5-1 / F-x / N-x 均非用例号。",
    "② 库·平台 API：`preventDefault` 是浏览器 API。",
    "③ 提交哈希：7b05f1b0badeac8775a0a2b72164764fded2be2e。",
    "④ 行内命令：复跑 `cd thincoder-vscode && node scripts/check-doc-width.mjs` 全绿。",
    "```text",
    "docs/design/ghost-in-fence.md",
    "cd thincoder-vscode && node scripts/check-doc-width.mjs",
    "```",
    "⑤ 占位路径：docs/design/X.md 与 docs/design/<file>.md。",
    "⑥ 运行期面：.thincoder/index/x.md 与 config.json。",
    "⑦ 前缀路径（单仓化：按仓内相对路径解析命中——非排除面）：见 thincoder-vscode/docs/design/AGENT-LOOP.md。",
    "⑧ 退场 / 换名 / 归档叙述行：docs/design/gone-away.md 已拆（`renamedThing` 换名；`archivedThing` 归档）。",
    "⑨ 裸 T<数>.<数>：T1.5 条目号。",
    "⑩ 标识符撞用例号形态：TLS12 / TAB123。",
  ].join("\n"));
  const r = scan();
  assert.deepStrictEqual(r.rows, [], "全零命中（含 ⑦ 单仓相对路径命中 / ⑧ 同行悬空锚 + 注记豁免）");
  assert.deepStrictEqual([r.cand.case, r.cand.path, r.cand.symbol, r.exempt.case, r.exempt.path, r.exempt.symbol], [0, 2, 0, 0, 1, 0],
    "射程内：⑦ 前缀路径（S4 单仓化后照判——命中零报）+ ⑧ 的悬空路径（注记豁免）共 2 候选（fenced 块 / 命令 / 占位 / 运行期 / 台账号 全在抽取面外）");
  assert.ok(r.wideRows.some((x) => x.anchor === "preventDefault"), "② 宽形态仅入报告面（不入闸——假阳类 2）");
  const lines = [
    "① 内部编号：AC-V5-1 / D-V5-1 / F-x / N-x 均非用例号。",
    "② 库·平台 API：`preventDefault` 是浏览器 API。",
    "③ 提交哈希：7b05f1b0badeac8775a0a2b72164764fded2be2e。",
    "④ 行内命令：复跑 `cd thincoder-vscode && node scripts/check-doc-width.mjs` 全绿。",
    "⑤ 占位路径：docs/design/X.md 与 docs/design/<file>.md。",
    "⑥ 运行期面：.thincoder/index/x.md 与 config.json。",
    "⑨ 裸 T<数>.<数>：T1.5 条目号。",
    "⑩ 标识符撞用例号形态：TLS12 / TAB123。",
  ];
  for (const line of lines) {
    const ex = extractAnchors(line);
    assert.deepStrictEqual([...ex.cases, ...ex.paths, ...ex.symbols].map((a) => a.anchor), [], `零抽取（不入闸）：${line.slice(0, 6)}`);
  }
  // ⑦ 重述（S4）：前缀路径形不再排除——抽取面含该 token（照判）
  const ex7 = extractAnchors("⑦ 前缀路径：见 thincoder-vscode/docs/design/AGENT-LOOP.md。");
  assert.deepStrictEqual(ex7.paths.map((a) => a.anchor), ["thincoder-vscode/docs/design/AGENT-LOOP.md"],
    "⑦ 重述：裸前缀路径在抽取面内（单仓化——归 V4 的排除式 5② 已删）");
});

slow("T-V5-6 正常：报告态——夹具命中 + 主行程 CLI ⇒ 退出码 0（F4）", () => {
  doc("docs/design/hit.md", "# 夹具\n\n悬空路径：docs/design/missing-here.md 无宿主。\n");
  const r = cli(["--v5-report"]); // 轮 2 翻转后：报告态经 `--v5-report` 直驱
  assert.equal(r.status, 0, "报告态：退出码不受 V5 影响（不阻断）");
  assert.match(r.stdout, /报告\(V5\): docs\/design\/hit\.md:3 docs\/design\/missing-here\.md（路径\/坐标）/);
  assert.match(r.stdout, /V5 报告 1 条（报告态——不阻断）/, "汇总行含报告态标记");
});

slow("T-V5-7 正常：闸态（反证非空转）——同夹具 + gate:true ⇒ 退出码 1", () => {
  doc("docs/design/hit.md", "# 夹具\n\n悬空路径：docs/design/missing-here.md 无宿主。\n");
  const r = cli(["--v5-gate"]);
  assert.equal(r.status, 1, "闸态：命中计入违规集 ⇒ 退出码 1（阈值 0）");
  assert.match(r.stdout, /FAIL\(V5\): 1 条悬空锚（闸态——阈值 0）/);
  assert.match(r.stdout, /docs\/design\/hit\.md:3/, "违规行含档:行");
});

slow("T-V5-8 边界：基线零改（两态运行后回读——V5 不入基线）", () => {
  doc("docs/design/hit.md", "# 夹具\n\n悬空：docs/design/missing-here.md。\n");
  cli(["--v5-report"]);
  cli(["--v5-gate"]);
  const raw = JSON.parse(readFileSync(join(REPO, BASELINE_PATH), "utf8"));
  assert.deepStrictEqual(raw.entries, [], "基线 entries 必须为空数组");
  assert.ok(!JSON.stringify(raw).includes("V5"), "V5 不出现在条目标记（V1|/V2|/V3|/V4| 面零改）");
  assert.deepStrictEqual(V5_SCAN_DIRS, ["docs/design", "docs/requirements"], "V5 扫描域常量（不含批档）");
});

slow("T-V5-9 正常：全量清单（逐条行 + 汇总四数；重定向落盘可读）", () => {
  doc("thincoder-vscode/docs/design/AGENT-LOOP.md", "# 仓内另一域档\n");
  doc("docs/design/listing.md", [
    "# 夹具：清单",
    "",
    "悬空路径：docs/design/missing-here.md 与悬空号 T-V5-88。",
    "注记行：docs/design/gone-away.md 已退场（段删——某批）。",
    "仓内前缀路径：thincoder-vscode/docs/design/AGENT-LOOP.md。",
  ].join("\n"));
  const r = cli(["--v5-report"]);
  const dump = join(tmp, "v5-report.txt");
  writeFileSync(dump, r.stdout);
  const text = readFileSync(dump, "utf8");
  for (const s of ["报告(V5):", "V5 汇总：候选 ", "· 悬空 ", "· 注记豁免 ", "V5 报告 2 条（报告态——不阻断）"]) {
    assert.ok(text.includes(s), `重定向落盘可读且含「${s}」`);
  }
  for (const s of ["用例号（V5-B）：候选 ", "路径/坐标（V5-A）：候选 ", "符号·窄（V5-C）：候选 ", "符号·宽（V5-C 报告面——不入闸）：候选 "]) {
    assert.ok(text.includes(s), `分档计数行在位：${s}`);
  }
});

test("T-V5-10 边界：射程不重叠（V1 / V2 面 V5 零命中，不重复报行）", () => {
  doc("docs/design/overlap.md", [
    "# 夹具：射程边界",
    "",
    "① 档名 + 节号（V1 面）：docs/design/other.md §5 由 V1 判。",
    "③ 计数（V2 面）：",
    "",
    "两条：",
    "",
    "- a",
    "- b",
  ].join("\n"));
  const r = scan();
  assert.deepStrictEqual(r.rows, [], "V5 零命中（① 归 V1（后接 §N）/ ③ 归 V2；V4 跨仓面随 S4 整类退场）");
});

slow("T-V5-12 正常/反证：收紧两态（夹具域 + 显式 gate 参数——不读真实扫描域）", () => {
  doc("docs/design/clean.md", "# 清账完成态：零锚\n\n无事实锚。\n");
  assert.equal(scan({ gate: true }).danglingTotal, 0, "① 清账完成态（三锚命中 0——函数面显式 gate 直驱）");
  assert.equal(formatReport(scan({ gate: true })).at(-1), "OK(V5): 0 条悬空锚（闸态——阈值 0）", "① 闸态洁净句（零悬空 ⇒ OK 句）");
  assert.equal(cli(["--v5-gate"]).status, 0, "① 收紧不误红（退出码 0）");
  doc("docs/design/dirty.md", "# 植入悬空锚\n\nT-V5-77 悬空号 + docs/design/nope-here.md 悬空路径。\n");
  const g2 = cli(["--v5-gate"]);
  assert.equal(g2.status, 1, "② 同域植入悬空锚 ⇒ 退出码 1（反证非空转）");
  assert.match(g2.stdout, /FAIL\(V5\): 2 条悬空锚（闸态——阈值 0）/, "② 悬空锚计数逐条可核");
  const rep = cli(["--v5-report"]);
  assert.equal(rep.status, 0, "③ 报告态退出码 0");
  assert.match(rep.stdout, /报告\(V5\): /, "③ 报告段在位");
  assert.deepStrictEqual(JSON.parse(readFileSync(join(REPO, BASELINE_PATH), "utf8")).entries, [], "两态均不写基线（N2）");
});

test("T-V5-15 正常：常驻接线（新档在快层发现集内）", () => {
  const fast = readdirSync(join(REPO, "test")).filter((f) => f.endsWith(".test.mjs"));
  assert.ok(fast.includes("doc-anchors.test.mjs"), "新档在快层发现集内（未接线 = 红——F8 / AC-V5-14）");
  const runner = readFileSync(join(REPO, "test", "run-fast.mjs"), "utf8");
  assert.ok(runner.includes('test/*.test.mjs'), "快层默认目标 glob 覆盖新档（发现口径实核——非空转）");
});

slow("T-V5-15② 正常：常驻接线——真实域复跑（再出现即红；同 V1–V4 T41① 口径）", () => {
  const r = scanDocAnchors(MERGED, { domain: "thincoder-cli" }); // 合并仓根 + CLI 产品域（S4 单仓——全域解析面）
  assert.equal(r.gate, true, "默认闸态（`V5_GATE = true`——翻转后）");
  assert.ok(r.files >= 50 && r.cand.case + r.cand.path > 100, "扫描域 / 候选面非空（防空域假绿）");
  assert.equal(r.danglingTotal, 0, "本仓扫描域零悬空锚（真实域——复跑原文见批次档 §5）");
  assert.equal(formatReport(r).at(-1), "OK(V5): 0 条悬空锚（闸态——阈值 0）", "闸态洁净句（真实域）");
});

test("T-V5-16 正常/反证：既有判据零伤（N5 承接——SCAN_DIRS + 夹具域钉死快照）", () => {
  assert.deepStrictEqual(SCAN_DIRS, ["docs/design", "docs/requirements", "docs/batches"], "① SCAN_DIRS 三元素逐字全等");
  doc("docs/design/v1.md", "# 夹具\n\n合规：v1.md §1 与 本档 §1。\n\n失效节号：v1.md §99。\n\n## 1. 第一节\n");
  doc("docs/design/v2.md", "# 计数\n\n三条：\n\n- a\n- b\n");
  doc("docs/batches/2026-09-12-fixture.md", [
    "# 批次", "", "## §3 设计评审（评审子代理写）", "", "### 轮次与发现（发现摘要）", "",
    "## §4 用户批准（主 agent 记）", "", "**2026-09-12 · 用户批准**", "",
  ].join("\n"));
  const got = checkDocConsistency(tmp);
  assert.deepStrictEqual({
    v1: got.v1.map((r) => `${r.file}|${r.ref}|${r.reason}`),
    v2: got.v2.map((r) => `${r.file}|${r.decl}|${r.declared}|${r.found}|${r.form}`),
    v3: got.v3.map((r) => r.file),
  }, {
    v1: ["docs/design/v1.md|v1.md §99|no-section"],
    v2: ["docs/design/v2.md|三条|3|2|list"],
    v3: ["docs/batches/2026-09-12-fixture.md"],
  }, "② 夹具域判定集合 = 钉死快照（V1 / V2 / V3 各人造命中——合规对照零误报；V4 跨仓面随 S4 退场）");
  assert.ok(NOTE_MARKERS.includes("归档") && NOTE_MARKERS.includes("换名") && NOTE_MARKERS.includes("改名"),
    "注记标记集闭枚举含 归档 / 换名 / 改名（§2.32.3.3）");
  assert.equal(V5_GATE, true, "轮 2 翻转后 = true（闸态——AC-V5-11）");
});
