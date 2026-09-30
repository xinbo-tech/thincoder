/**
 * 2026-09-29-doc-check-face.test.mjs — 批次本地件（#546 行数面 · 含 #435 ∕ #469 设计三链的 #546 腿）。
 * 批次档 = `docs/batches/2026-09-29-doc-check-face.md`（§2.4 落点 6——正常 ∕ 差异 ∕ 边界 ∕ 错误四组）。
 * 复跑：`node --test docs/batches/2026-09-29-doc-check-face.test.mjs`
 * 夹具 = temp 域（零落仓）；被测面 = `scripts/doc-check-linecounts.mjs`（parseSectionRows ∕ checkLineCounts ∕ countContentLines）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { countContentLines, parseSectionRows, checkLineCounts } from "../../scripts/doc-check-linecounts.mjs";

const SEC = "4.1 本端文件清单与行数预算";

function makeRoot(files) {
  const root = mkdtempSync(join(tmpdir(), "dcl-"));
  for (const [rel, text] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  }
  return root;
}

/** 声明档文本：节标题 + 空行 + 数据行（行号 = 3 起）。 */
function docText(rows) {
  return ["### 4.1 本端文件清单与行数预算", "", ...rows, ""].join("\n");
}

test("正常：表值 = 实读 ⇒ 零差异零输出（比对计数在）", () => {
  const root = makeRoot({ "lib/a.mjs": "l1\nl2\nl3\n" });
  writeFileSync(join(root, "d.md"), docText(["| `lib/a.mjs` | **3**（实读） | x |"]));
  const r = checkLineCounts([{ doc: "d.md", section: SEC }], { root });
  assert.equal(r.diffCount, 0);
  assert.equal(r.compared, 1);
  assert.deepEqual(r.lines, []);
});

test("差异：表值 ≠ 实读 ⇒ 报告行（表 N ⇒ 实读 M，Δ）", () => {
  const root = makeRoot({ "lib/a.mjs": "l1\nl2\n" });
  writeFileSync(join(root, "d.md"), docText(["| `lib/a.mjs` | **5** | x |"]));
  const r = checkLineCounts([{ doc: "d.md", section: SEC }], { root });
  assert.equal(r.diffCount, 1);
  assert.match(r.lines[0], /报告 行数 d\.md:3 `lib\/a\.mjs`（表 5 ⇒ 实读 2，Δ-3）/);
});

test("差异：行内档不在盘 ⇒ 盘无档报告 + 计入差异", () => {
  const root = makeRoot({});
  writeFileSync(join(root, "d.md"), docText(["| `lib/gone.mjs` | **3** | x |"]));
  const r = checkLineCounts([{ doc: "d.md", section: SEC }], { root });
  assert.equal(r.diffCount, 1);
  assert.match(r.lines[0], /（盘无档）$/);
});

test("边界：**≈N** 预估行 ⇒ 跳过（计「预估」）——不比对不报差异", () => {
  const root = makeRoot({ "lib/a.mjs": "l1\n" });
  writeFileSync(join(root, "d.md"), docText(["| `lib/a.mjs` | **≈99** | x |"]));
  const r = checkLineCounts([{ doc: "d.md", section: SEC }], { root });
  assert.equal(r.compared, 0);
  assert.equal(r.diffCount, 0);
  assert.equal(r.skipped.est, 1);
});

test("边界：非加粗 ~40 ⇒ 非数行跳过", () => {
  const root = makeRoot({ "lib/a.mjs": "l1\n" });
  writeFileSync(join(root, "d.md"), docText(["| `lib/a.mjs` | ~40 | x |"]));
  const r = checkLineCounts([{ doc: "d.md", section: SEC }], { root });
  assert.equal(r.skipped.nonnum, 1);
  assert.equal(r.compared, 0);
});

test("边界：多档行 a · b + **2 / 5** ⇒ 两对并比；后置 ≈ 不夺首（KD-3）", () => {
  const root = makeRoot({ "lib/a.mjs": "1\n2\n", "lib/b.mjs": "1\n2\n3\n4\n5\n" });
  writeFileSync(join(root, "d.md"), docText(["| `lib/a.mjs` · `lib/b.mjs` | **2 / 5**（后置 **≈265**） | x |"]));
  const r = checkLineCounts([{ doc: "d.md", section: SEC }], { root });
  assert.equal(r.compared, 2);
  assert.equal(r.diffCount, 0);
});

test("错误：配对失败（档 2 ∕ 数 1）⇒ 行式异常报告行（不静默丢）", () => {
  const root = makeRoot({ "lib/a.mjs": "1\n", "lib/b.mjs": "1\n" });
  writeFileSync(join(root, "d.md"), docText(["| `lib/a.mjs` · `lib/b.mjs` | **7** | x |"]));
  const r = checkLineCounts([{ doc: "d.md", section: SEC }], { root });
  assert.equal(r.diffCount, 0);
  assert.match(r.lines[0], /行式异常：配对失败（档 2 ∕ 数 1）/);
});

test("错误：声明档盘无档 ⇒ 报告行", () => {
  const root = makeRoot({});
  const r = checkLineCounts([{ doc: "missing.md", section: SEC }], { root });
  assert.equal(r.diffCount, 1);
  assert.match(r.lines[0], /报告 行数 missing\.md（声明档盘无档）/);
});

test("错误：声明节未命中 ⇒ 报告行", () => {
  const root = makeRoot({});
  writeFileSync(join(root, "d.md"), "# 别的节\n\n| `lib/a.mjs` | **1** | x |\n");
  const r = checkLineCounts([{ doc: "d.md", section: SEC }], { root });
  assert.match(r.lines[0], /（声明节未命中：4\.1 本端文件清单与行数预算）/);
});

test("域止：下一同级标题之后的行不计（parseSectionRows 域界）", () => {
  const text = ["### 4.1 本端文件清单与行数预算", "", "| `lib/a.mjs` | **1** | x |", "### 4.2 下一节", "", "| `lib/b.mjs` | **999** | 域外 |", ""].join("\n");
  const parsed = parseSectionRows(text, SEC);
  assert.equal(parsed.found, true);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].files[0], "lib/a.mjs");
});

test("实读口径（KD-4）：文末换行不计", () => {
  assert.equal(countContentLines("a\nb\n"), 2);
  assert.equal(countContentLines("a\nb"), 2);
  assert.equal(countContentLines(""), 0);
});
