/**
 * doc-check.test.mjs — M8 机检判据面自测护栏（#37 · 2026-09-18 判据面批）。
 *
 * 判据来源 = `docs/core/design/DOC-DISCIPLINE.md` §4.2.1–§4.2.10（判据句单源）+ §7 自测护栏段；
 * 用例表 = 批次档 `docs/batches/2026-09-18-machine-check-face.md` §2.5（T-DC-1–17）。
 * 覆盖面 = 三锚抽取（右界守卫 / 谓词闭枚举 / 路径段不产符号锚）/ 存在性域（用例定义面 = 域根下
 * 全部 `test` 树）/ 注记集收窄 / 两族（拟新增 · 迁移期引文——三态与报告面）/ 两态与退出码 /
 * 声明面（scanDirs · lineWidth · exclude）/ 报告行集合（回归锁）/ 零落仓 + 并发免疫。
 *
 * 夹具纪律（§3.4 条目 E）：夹具根一律 = 系统临时域（`mkdtempSync(join(tmpdir(), "doc-check-"))`）——
 * 零落仓 + 并发免疫（临时域唯一 ⇒ 双实例并发均绿；清理只扫本实例自持的夹具表，不碰他人实例）。
 * 覆盖偏移登记：① 面（右界守卫）的 T-DC-2 设计用例以裸 basename 表述（`a.js` / `b.json`），而裸
 * basename 无坐标者不在射程（§4.2.1 射程句）⇒ 该例改用带目录段形态（判据面等价；T-DC-1 按表原文
 * 已是带目录段形态，零偏移）；其余用例按表逐条对齐。
 */
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkAnchors, extractAnchors } from "../../scripts/doc-check-anchors.mjs";
import { formatReport, main } from "../../scripts/doc-check.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const THIS_FILE = join(HERE, "doc-check.test.mjs");

// ── 夹具面（系统临时域 · 零落仓）────────────────────────────────
/** 声明面默认值（形态同 manifest checkConfig——声明面驱动，引擎零硬编码路径 / 阈值）。 */
const CFG = (over = {}) => ({
  scanDirs: over.scanDirs ?? ["docs"],
  lineWidth: over.lineWidth ?? 300,
  anchors: { domain: "docs", exclude: [], ...(over.anchors ?? {}) },
  exemptions: over.exemptions ?? [],
});

/** 本实例自持夹具表（清理只碰自持项——他人实例的临时域不动）。 */
const OWN_FIXTURES = [];

/** 夹具根：文件表 → 临时域（含 PROJECT-MANIFEST.json——`main` 直驱用）。 */
function makeFixture(files, cfg = CFG()) {
  const root = mkdtempSync(join(tmpdir(), "doc-check-"));
  OWN_FIXTURES.push(root);
  const all = {
    ...files,
    "PROJECT-MANIFEST.json": JSON.stringify({
      version: 1, phase: "initial-dev",
      docRoot: { requirements: "docs", specs: "docs", design: "docs", modules: "docs", batches: "docs" },
      promptsLanding: "thincoder-core/prompts",
      checkConfig: cfg,
    }, null, 2),
  };
  for (const [rel, content] of Object.entries(all)) {
    const p = join(root, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
  return root;
}

/** 引擎直驱（判定函数 + 显式 gate——§4.2.5 测试稳定性：两态可直驱）。 */
const scan = (root, cfg = CFG(), gate = true) => checkAnchors(root, cfg, { gate, root });

/** CLI 直驱（真退出码 + 真报告行；声明面读 manifest）。 */
function runMain(root) {
  const out = [];
  const code = main(["--root", root], { log: (l) => out.push(l), cwd: root });
  return { code, out, text: out.join("\n") };
}

// ── ① 右界守卫（`.json` 截断伪影）───────────────────────────────
test("T-DC-1 正常·右界守卫：`.json` 不被交替序截为 `.js`", () => {
  assert.deepEqual(extractAnchors("见 `pkg/package.json`。").paths.map((p) => p.anchor), ["pkg/package.json"]);
  const root = makeFixture({ "docs/a.md": "见 `pkg/package.json`。\n", "pkg/package.json": "{}\n" });
  assert.equal(scan(root).dang.path, 0, "token 形态正确 ⇒ 档在位 ⇒ 零悬空");
});

test("T-DC-2 边界·真 `.js` 不吞（两 token 各自正确）", () => {
  const line = "`pkg/a.js` 与 `pkg/b.json` 各一。";
  assert.deepEqual(extractAnchors(line).paths.map((p) => p.anchor), ["pkg/a.js", "pkg/b.json"]);
  const root = makeFixture({ "docs/a.md": line + "\n", "pkg/a.js": "//\n", "pkg/b.json": "{}\n" });
  assert.equal(scan(root).dang.path, 0, "守卫修正不得回退真 .js 形态");
});

test("T-DC-3 错误·截断反证：形态正确 ∧ 判定照红（零静默）", () => {
  const root = makeFixture({ "docs/a.md": "见 `pkg/package.json`。\n" });
  assert.deepEqual(extractAnchors("见 `pkg/package.json`。").paths.map((p) => p.anchor), ["pkg/package.json"]);
  assert.equal(scan(root).dang.path, 1, "档缺失 ⇒ 照红（不得回退 .js 形态骗过守卫）");
});

// ── ② 谓词闭枚举 + 路径形态码段不产符号锚 ────────────────────────
test("T-DC-4 正常·谓词闭枚举：`定义在` 产锚 ∧ `在` 已删不产锚", () => {
  const withPred = "`fooBar` 定义在 `m/host.mjs:3`。";
  const bareZai = "`fooBar` 在 `m/host.mjs:3`。";
  assert.equal(extractAnchors(withPred).symbols.length, 1);
  assert.equal(extractAnchors(bareZai).symbols.length, 0, "`在` 已删——无宿主指向语义，不产锚");
  const root = makeFixture({ "docs/a.md": withPred + "\n" + bareZai + "\n", "m/host.mjs": "export function fooBar() {}\n" });
  const r = scan(root);
  assert.equal(r.dang.symbol, 0);
  assert.equal(r.cand.symbol, 1, "仅谓词行产候选");
});

test("T-DC-5 正常·路径形态码段不产符号锚（窄宽同法）", () => {
  const line = "`sub/dir/host.mjs:3` 定义在（导出面）。";
  const a = extractAnchors(line);
  assert.equal(a.symbols.length, 0, "路径形态码段不产窄符号锚");
  assert.equal(a.wide.length, 0, "宽形态同法");
  const root = makeFixture({ "docs/a.md": line + "\n", "sub/dir/host.mjs": "//\n" });
  const r = scan(root);
  assert.equal(r.dang.path + r.dang.symbol, 0);
});

test("T-DC-6 错误·真符号照红（反证：面收窄不得放过真缺陷）", () => {
  const root = makeFixture({ "docs/a.md": "`realSym` 定义在 `sub/host.mjs:3`。\n", "sub/host.mjs": "// 无该符号\n" });
  assert.equal(scan(root).dang.symbol, 1);
});

// ── ③ 用例号定义面（域根下全部 `test` 树）───────────────────────
test("T-DC-7 正常·用例定义面走子目录 `test` 树", () => {
  const root = makeFixture({
    "docs/a.md": "见 T-ZZ1 用例（回归锁）。\n",
    "sub/test/x.test.mjs": 'import test from "node:test";\ntest("T-ZZ1 正常", () => {});\n',
  });
  assert.equal(scan(root).dang.case, 0, "定义面 = 域根下全部 test 树（非 <域根>/test 单点）");
});

test("T-DC-8 错误·未在册用例照红", () => {
  const root = makeFixture({
    "docs/a.md": "见 T-QQ9 用例。\n",
    "sub/test/x.test.mjs": 'import test from "node:test";\ntest("T-ZZ1 正常", () => {});\n',
  });
  assert.equal(scan(root).dang.case, 1, "定义面扩后不得放过未在册号");
});

// ── ⑤ 注记集口径（收窄至实装集）────────────────────────────────
test("T-DC-9 正常·注记集口径钉：`机检豁免` 整行过 ∧ 史实词 `已退役` 照红", () => {
  const root = makeFixture({ "docs/a.md": "见 `gone/aa.mjs`（机检豁免）。\n行二见 `gone/bb.mjs`——已退役。\n" });
  const r = scan(root);
  assert.equal(r.exempt.path, 1, "注记标记（闭枚举 14 词）⇒ 整行过");
  assert.equal(r.dang.path, 1, "史实叙述词不入注记集（§4.2.3 收窄裁定；正规通道 = §4.2.10 标记族）");
});

// ── ⑥ 迁移期引文族（三态 + 报告面）──────────────────────────────
test("T-DC-10 正常·族三态①三合一 ⇒ 报告集 + 计数（exit 0）", () => {
  const root = makeFixture({ "docs/a.md": "（迁移期引文 · 旧址）已删 `gone/x.mjs`。\n" });
  const r = scan(root);
  assert.equal(r.dang.path, 0, "三合一命中不入违规集");
  assert.equal(r.citationTotal, 1);
  assert.equal(r.rows.filter((x) => x.citation).length, 1);
  const text = formatReport(r).join("\n");
  assert.match(text, /（路径\/坐标·迁移期引文——列报 · 不入闸）/);
  assert.match(text, /汇总：候选 \d+ · 悬空 0 · 注记豁免 \d+ · 拟新增 \d+ · 迁移期引文 1/);
  assert.equal(runMain(root).code, 0, "族内命中不入闸 ⇒ exit 0");
  // 生效面 = 仅路径/坐标锚（§4.2.10 生效面行）：标记不覆盖用例号 / 符号锚
  const root2 = makeFixture({
    "docs/b.md": "（迁移期引文 · 旧址）已删 `gone/x.mjs` 与 T-QQ9。\n（迁移期引文 · 旧址）已删 `realSym` 定义在 `sub/host.mjs:3`。\n",
    "sub/host.mjs": "// 无该符号\n",
  });
  const r2 = scan(root2);
  assert.equal(r2.dang.path, 0, "路径锚入族");
  assert.equal(r2.dang.case, 1, "用例号锚不受标记影响");
  assert.equal(r2.dang.symbol, 1, "符号锚不受标记影响");
});

test("T-DC-11 错误·标记失据（防滥用①）：无史实谓词 + 悬空 ⇒ 照红 + 行尾标", () => {
  const root = makeFixture({ "docs/a.md": "（迁移期引文）`gone/x.mjs`。\n" });
  const r = scan(root);
  assert.equal(r.dang.path, 1);
  assert.equal(r.rows[0].groundless, true);
  assert.match(formatReport(r).join("\n"), /（路径\/坐标·标记失据）/);
  assert.equal(runMain(root).code, 1);
});

test("T-DC-12 边界·两族并置 ⇒ 按拟新增计入 + 报告面标「标记并置」", () => {
  const root = makeFixture({ "docs/a.md": "（拟新增）（迁移期引文）`gone/x.mjs`。\n" });
  const r = scan(root);
  assert.equal(r.pendingTotal, 1, "前向优先：按「拟新增」计入");
  assert.equal(r.citationTotal, 0, "避开双重豁免面");
  assert.equal(r.dang.path, 0);
  assert.match(formatReport(r).join("\n"), /·拟新增——列报 · 不入闸·标记并置/);
  assert.equal(runMain(root).code, 0);
});

test("T-DC-17 边界·失据以 ③ 悬空为条件：锚可解析 ⇒ 标记冗余（不入闸）", () => {
  const root = makeFixture({ "docs/a.md": "（迁移期引文）`ok/x.mjs`。\n", "ok/x.mjs": "//\n" });
  const r = scan(root);
  assert.equal(r.dang.path, 0, "可解析锚无红可言");
  assert.equal(r.redundantRows.length, 1);
  assert.match(formatReport(r).join("\n"), /（标记冗余——报告面，不入闸）/);
  assert.equal(runMain(root).code, 0);
});

// ── 两态与退出码 / 声明面 / 报告格式 ────────────────────────────
test("T-DC-13 正常·两态可直驱：闸态 FAIL + exit 1 ∧ 报告态不阻断", () => {
  const root = makeFixture({ "docs/a.md": "见 `gone/x.mjs`。\n" });
  const gated = scan(root, CFG(), true);
  const reported = scan(root, CFG(), false);
  assert.equal(gated.gate, true);
  assert.equal(reported.gate, false, "报告态 = 显式 gate 参数直驱（§4.2.5 测试稳定性）");
  assert.equal(formatReport(gated).at(-1), "FAIL(锚): 1 条悬空（闸态——阈值 0）");
  assert.equal(formatReport(reported).at(-1), "报告 1 条（报告态——不阻断）");
  assert.equal(runMain(root).code, 1, "闸态 exit 1（真 CLI 退出码）");
  // 报告态退出码面：CLI 恒传 gate=true（§2.6 不增旗标）⇒ 报告态由判定函数直驱；
  // 「不阻断」= 同一判集只切换阻断语义（上句已钉逐字报告句）⇒ 两态判集相等。
  assert.equal(reported.danglingTotal, gated.danglingTotal, "两态判集相等（仅阻断语义切换）");
});

test("T-DC-14 正常·声明面：scanDirs 域界 ∧ exclude 段不扫 ∧ lineWidth 阈值生效", () => {
  const root = makeFixture(
    {
      "docs/keep.md": "x".repeat(60) + "\n见 `gone/k.mjs`。\n",
      "docs/skip/a.md": "见 `gone/a.mjs`。\n",
      "other/b.md": "见 `gone/b.mjs`。\n",
    },
    CFG({ lineWidth: 50, anchors: { exclude: ["skip"] } }),
  );
  const { code, text } = runMain(root);
  assert.equal(code, 1);
  assert.match(text, /✗ 行宽 docs\/keep\.md:1（60 字符）/);
  assert.match(text, /FAIL\(行宽\): 1 行超 50 字符/);
  assert.doesNotMatch(text, /skip\/a\.md/, "exclude 段内的档不入扫描域");
  assert.doesNotMatch(text, /other\/b\.md/, "scanDirs 域外的档不入扫描域");
  assert.match(text, /✗ docs\/keep\.md:2 gone\/k\.mjs（路径\/坐标）/);
});

test("T-DC-16 正常·报告格式（行集合单源回归锁）", () => {
  const root = makeFixture({
    "docs/a.md": "见 `gone/xx.mjs`。\n（迁移期引文）已删 `gone/xx.mjs`。\n另见 `ZZZ_MISSING_WIDE_NAME`。\n（迁移期引文）`ok/yy.mjs`。\n",
    "ok/yy.mjs": "//\n",
  });
  const lines = formatReport(scan(root));
  assert.match(lines[0], /^机检·锚：扫描域 docs · \d+ 档$/);
  const dang = lines.filter((l) => l.startsWith("✗ "));
  assert.equal(dang.length, 2, "一条照红 + 一条族内列报");
  assert.ok(dang.every((l) => /^✗ \S+:\d+ \S+（.+）$/.test(l)), "逐条行 = ✗ file:line anchor（族标）");
  const report = lines.filter((l) => l.startsWith("报告 "));
  assert.equal(report.length, 2, "一条宽形态 + 一条标记冗余");
  assert.ok(report.every((l) => /^报告 \S+:\d+ \S+（.+——报告面，不入闸）$/.test(l)));
  assert.match(lines.find((l) => l.startsWith("汇总：")), /^汇总：候选 \d+ · 悬空 1 · 注记豁免 \d+ · 拟新增 \d+ · 迁移期引文 1$/);
  for (const kind of ["  用例号：", "  路径/坐标：", "  符号·窄：", "  符号·宽（报告面）："]) {
    const line = lines.find((l) => l.startsWith(kind));
    assert.ok(line, `分型行在场：${kind}`);
    assert.match(line, /：候选 \d+ · 悬空 \d+ · 注记豁免 \d+$/);
  }
  assert.equal(lines.at(-1), "FAIL(锚): 1 条悬空（闸态——阈值 0）", "两态句（本夹具悬空 1 ⇒ 闸态 FAIL 句）");
});

// ── 零落仓 + 并发免疫（§3.4 条目 E）────────────────────────────
/** 仓域扫描域快照（docs/** 相对路径全集——运行前后比对）。 */
function snapshotRepoScanDomain() {
  const out = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      if (n === "node_modules" || n === ".git" || n === ".thincoder") continue;
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(relative(REPO_ROOT, p).replace(/\\/g, "/"));
    }
  };
  walk(join(REPO_ROOT, "docs"));
  return out.sort();
}

/** 夹具探针名全仓命中数（0 = 探针零落仓；探针名只出现在临时域夹具体内）。 */
function fixtureProbeHits() {
  let hits = 0;
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      if (n === "node_modules" || n === ".git" || n === ".thincoder") continue;
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (n.includes("dc-fixture-probe")) hits++;
    }
  };
  walk(REPO_ROOT);
  return hits;
}

/** 本档并发实例（`--test <本档>` 子进程；嵌套层不再派生——防递归）。 */
function runSelf() {
  return new Promise((done) => {
    const child = spawn(process.execPath, ["--test", THIS_FILE], { cwd: REPO_ROOT, env: { ...process.env, DOC_CHECK_NESTED: "1" } });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => done({ code, out }));
  });
}

test("T-DC-15 错误·零落仓 ∧ 并发免疫", { timeout: 180000 }, async (t) => {
  const before = snapshotRepoScanDomain();
  const root = makeFixture({ "docs/dc-fixture-probe.md": "见 `gone/x.mjs`。\n" });
  assert.equal(scan(root).dang.path, 1, "夹具照判（仓域只读、夹具在临时域）");
  assert.deepEqual(snapshotRepoScanDomain(), before, "运行前后仓扫描域零差异（零落仓）");
  assert.equal(fixtureProbeHits(), 0, "全仓夹具名零命中");
  if (process.env.DOC_CHECK_NESTED === "1") {
    t.diagnostic("嵌套实例（DOC_CHECK_NESTED=1）：并发判据由父实例承担——本实例不派生");
    return;
  }
  const [a, b] = await Promise.all([runSelf(), runSelf()]);
  assert.equal(a.code, 0, `并发实例 A 须 exit 0：\n${a.out.slice(-1500)}`);
  assert.equal(b.code, 0, `并发实例 B 须 exit 0：\n${b.out.slice(-1500)}`);
});

after(() => {
  for (const d of OWN_FIXTURES) {
    try { rmSync(d, { recursive: true, force: true }); } catch { /* 已清理：跳过 */ }
  }
});
