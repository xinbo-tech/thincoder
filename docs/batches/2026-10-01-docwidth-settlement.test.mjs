/**
 * 2026-10-01-docwidth-settlement.test.mjs — 批次本地件（行宽清账批 · 条目 N 历史区宽度豁免）。
 * 批次档 = `docs/batches/2026-10-01-docwidth-settlement.md`（§2.2b 自测件；夹具 = DD-60–DD-62）。
 * 复跑：`node --test docs/batches/2026-10-01-docwidth-settlement.test.mjs`
 * 夹具 = temp 域（零落仓）；被测面 = `scripts/doc-check-width.mjs`（checkDocWidths ∥ isZoneHead）∥
 * `thincoder-core/manifest-schema.mjs`（fillDefaults——声明键搬移）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { checkDocWidths, isZoneHead } from "../../scripts/doc-check-width.mjs";
import { fillDefaults } from "../../thincoder-core/manifest-schema.mjs";

const ZONES = ["变更记录", "历史沿革"];
const WIDE = "x".repeat(301);

function makeRoot(files) {
  const root = mkdtempSync(join(tmpdir(), "dcw-"));
  for (const [rel, text] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  }
  return root;
}

/** 单档夹具：行集 ⇒ `docs/fixture.md`（行号 = 数组下标 + 1）；返命中行号集。 */
function scan(lines, { zones = ZONES } = {}) {
  const root = makeRoot({ "docs/fixture.md": lines.join("\n") + "\n" });
  const hits = checkDocWidths(root, { lineWidth: 300, scanDirs: ["docs"], exclude: [], exemptZones: zones });
  return hits.map((h) => h.line);
}

test("DD-60 正常：区带内超宽 ⇒ 零报；非区带超宽 ⇒ 照报", () => {
  const hits = scan(["## 变更记录", "", WIDE, "", "## 正文", "", WIDE]);
  assert.deepEqual(hits, [7]);
});

test("DD-61 边界：带后缀区带头（全角 （续））⇒ 照免", () => {
  assert.deepEqual(scan(["## 变更记录（续）", "", WIDE]), []);
});

test("DD-61 边界：带后缀区带头（半角 (续)）⇒ 照免", () => {
  assert.deepEqual(scan(["## 变更记录(续)", "", WIDE]), []);
});

test("DD-61 边界：嵌套子标题下 ⇒ 照免（标题链判）", () => {
  assert.deepEqual(scan(["## 变更记录", "", "### 子节", "", WIDE]), []);
});

test("DD-61 边界：声明空集 ⇒ 零豁免（惰性 · fail-closed）", () => {
  const hits = scan(["## 变更记录", "", WIDE, "", "## 正文", "", WIDE], { zones: [] });
  assert.deepEqual(hits, [3, 7]);
});

test("DD-61 边界：编号剥离路径（`## 6. 不并项与历史沿革`）⇒ 照报（闭集外）", () => {
  assert.deepEqual(scan(["## 6. 不并项与历史沿革", "", WIDE]), [3]);
});

test("DD-61 边界：第二区带名（`历史沿革`）⇒ 照免", () => {
  assert.deepEqual(scan(["## 历史沿革", "", WIDE]), []);
});

test("DD-61 边界：区带域止——同级新标题出栈后 ⇒ 照报", () => {
  assert.deepEqual(scan(["## A", "", "### 变更记录", "", WIDE, "", "### 别的", "", WIDE]), [9]);
});

test("DD-62 错误：闭集外标题（`变更记录全文…` ∥ 括注含「历史沿革」的失效节）⇒ 照报", () => {
  assert.deepEqual(scan(["## 变更记录全文…", "", WIDE]), [3]);
  assert.deepEqual(scan(["## 失效节（历史沿革）", "", WIDE]), [3]);
});

test("DD-62 错误：区带外条目形（`- 日期 …`）⇒ 照报（行形族不纳）", () => {
  assert.deepEqual(scan(["## 正文", "", `- 2026-10-01 ${WIDE}`]), [3]);
});

test("isZoneHead 谓词（纯件）：等于 ∥ 括注后缀命中；闭集外一律不纳", () => {
  assert.equal(isZoneHead("变更记录", ZONES), true);
  assert.equal(isZoneHead("变更记录（续）", ZONES), true);
  assert.equal(isZoneHead("变更记录(续)", ZONES), true);
  assert.equal(isZoneHead("历史沿革", ZONES), true);
  assert.equal(isZoneHead("6. 不并项与历史沿革", ZONES), false);
  assert.equal(isZoneHead("变更记录全文…", ZONES), false);
  assert.equal(isZoneHead("失效节（历史沿革）", ZONES), false);
  assert.equal(isZoneHead("条目 N：历史区宽度豁免", ZONES), false);
});

test("fillDefaults 搬移：默认档已载 widthExemptZones ⇒ 读面可达（未载键仍丢弃）", () => {
  const out = fillDefaults({ checkConfig: { widthExemptZones: ["x"] } });
  assert.deepEqual(out.checkConfig.widthExemptZones, ["x"]);
  // 反向对照：未入默认档的键仍被丢弃（搬移只对默认档子键生效——声明键须入 DEFAULT_MANIFEST 才可达）
  assert.equal(fillDefaults({ checkConfig: { notInDefaults: ["x"] } }).checkConfig.notInDefaults, undefined);
});
