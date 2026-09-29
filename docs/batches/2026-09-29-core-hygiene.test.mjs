/**
 * 2026-09-29-core-hygiene.test.mjs — 批内件（#577 路径盘符族 · T1–T6 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = `node --test docs/batches/2026-09-29-core-hygiene.test.mjs`
 * （本刻暂存 `.thincoder/tmp/` 同名件——两处均两层深；导入一律以 `process.cwd()` 为仓根解析 ⇒
 * 从仓根（`thincoder/`）跑，暂存位与终位同一命令形态）。
 *
 * 判据面（批档 §2.2.3）：T1 台账键（转引 #286 ∕ #287——不重复实施，实读键径）+ T2 session 槽 +
 * T3 其余键面（可达面直驱 ∕ 不可达面结构扫描 normalizeCwd 单源）+ T4 链面（classify ∕ canonicalTarget
 * 纯函数例 + `--check` 退出码 + `--json` 契约）+ T5 跨包恒等复测（环境收敛后——不改任何锁档）+
 * T6 负控（合成「异拼写」夹具判红）。
 * 注：T4 的 `--check` 退出码 ∕ T5 恒等 = **环境收敛后读数**（本机五链全规范态）；盘符面例（大小写折叠）
 * 与末段实跑断言（--check 退 0 ∕ `--json` 五链）判据环境 = win32 收敛态（仓根 `D:\teamcode\thincoder`）。
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const WIN = process.platform === "win32";
/** 盘符拼写取反（大写 ⇄ 小写）——异拼写夹具变体：保证 ≠ 规范形（零「盘符必为大写」环境假设）。 */
const flipDriveCase = (p) => p.replace(/^([A-Za-z]):/, (_, d) => (d === d.toUpperCase() ? d.toLowerCase() : d.toUpperCase()) + ":");
const mod = (rel) => pathToFileURL(join(ROOT, rel)).href;
const { ledgerKey } = await import(mod("thincoder-core/ledger-db.mjs"));
const { sessionPath, normalizeCwd, _setSessionsDirForTest, _resetSessionsDirForTest } = await import(mod("thincoder-core/session-slots.mjs"));
const { traceSessionKey } = await import(mod("thincoder-core/traces/trace-store.mjs"));
const devLink = await import(mod("scripts/dev-link.mjs"));

// ─── T1 台账键 case 变体（转引验证：#286 ∕ #287 已交付面——键值锁）────────────

test("T1 台账键：ledgerKey('D:\\\\x') === ledgerKey('d:\\\\x') = true（转引 #286 ∕ #287）· 键值 = 056b8aee16abdaab", () => {
  assert.equal(ledgerKey("D:\\x"), ledgerKey("d:\\x"));
  assert.equal(ledgerKey("D:\\x"), "056b8aee16abdaab");
});

// ─── T2 session 槽 case 变体（注入缝——不碰真实目录）────────────────────────

test("T2 session 槽：sessionPath('d:\\\\x') === sessionPath('D:\\\\x')（注入缝）· normalizeCwd 直驱", () => {
  assert.equal(normalizeCwd("d:/a/b"), "D:/a/b");
  assert.equal(normalizeCwd("d:\\a\\b"), "D:\\a\\b");
  const dir = mkdtempSync(join(tmpdir(), "core-hygiene-t2-"));
  _setSessionsDirForTest(dir);
  try {
    assert.equal(sessionPath("d:\\x"), sessionPath("D:\\x"));
    assert.ok(sessionPath("d:\\x").startsWith(dir), "注入缝生效（不碰真实 sessions 根）");
  } finally {
    _resetSessionsDirForTest();
    rmSync(dir, { recursive: true, force: true });
  }
});

// ─── T3 其余键面（可达面直驱 + 不可达面结构扫描）────────────────────────────

test("T3 其余键面：traces 直驱恒等 + checkpoint ∕ traces ∕ peers ∕ 台账 结构扫描 normalizeCwd 单源", () => {
  assert.equal(traceSessionKey("d:\\x"), traceSessionKey("D:\\x"));
  const FACES = [
    ["ledger-db.mjs", "./session-slots.mjs"],
    ["git/checkpoint.mjs", "../session-slots.mjs"],
    ["traces/trace-store.mjs", "../session-slots.mjs"],
    ["peer-claims.mjs", "./session-slots.mjs"],
    ["peer-domains.mjs", "./session-slots.mjs"],
  ];
  for (const [rel, spec] of FACES) {
    const src = readFileSync(join(ROOT, "thincoder-core", rel), "utf8");
    const re = new RegExp(`import\\s*\\{[^}]*\\bnormalizeCwd\\b[^}]*\\}\\s*from\\s*"${spec.replace(/[/.]/g, "\\$&")}"`);
    assert.ok(re.test(src), `${rel} 经 normalizeCwd 单源（${spec}——不可达面结构扫描）`);
  }
});

// ─── T4 链面（纯函数例 + 退出码 + JSON 契约）───────────────────────────────

test("T4 链面：classify 五类例（含同路径异拼写 ∕ 物化副本）+ canonicalTarget .native + --check 退出码 0 + --json 契约", () => {
  assert.equal(devLink.classify({ present: false, isLink: false, stored: null }, "D:\\a\\b"), "missing", "缺失");
  assert.equal(devLink.classify({ present: true, isLink: false, stored: null }, "D:\\a\\b"), "materialized", "物化副本");
  if (WIN) {
    const ob = (stored) => ({ present: true, isLink: true, stored });
    assert.equal(devLink.classify(ob("D:\\a\\b"), "D:\\a\\b"), "ok", "规范");
    assert.equal(devLink.classify(ob("d:\\a\\b"), "D:\\a\\b"), "case-variant", "同路径异拼写（盘符）");
    assert.equal(devLink.classify(ob("D:/a/b"), "D:\\a\\b"), "case-variant", "同路径异拼写（分隔符）");
    assert.equal(devLink.classify(ob("D:\\x\\b"), "D:\\a\\b"), "wrong-target", "异路径");
    // canonicalTarget：.native 面折叠盘符（JS 面 realpathSync 保留输入拼写 ⇒ 工具必须 .native；§2.2.2 实读）
    const coreCanon = realpathSync.native(join(ROOT, "thincoder-core"));
    const variant = flipDriveCase(coreCanon);
    assert.notEqual(variant, coreCanon, "夹具判别力：取反变体 ≠ 规范形");
    assert.equal(devLink.canonicalTarget(variant), coreCanon);
  }
  // --check 退出码（环境收敛后读数 = 0）+ --check --json 契约
  const script = join(ROOT, "scripts", "dev-link.mjs");
  const check = spawnSync(process.execPath, [script, "--check"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(check.status, 0, `--check 退出码（收敛后 = 0）\n${check.stdout}${check.stderr}`);
  const json = spawnSync(process.execPath, [script, "--check", "--json"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(json.status, 0);
  const parsed = JSON.parse(json.stdout);
  assert.deepEqual(Object.keys(parsed).sort(), ["links", "ok"], "契约顶层键 = { links, ok }");
  assert.equal(parsed.ok, true);
  assert.equal(parsed.links.length, 5, "五链");
  for (const l of parsed.links) assert.deepEqual(Object.keys(l).sort(), ["class", "link", "product", "target"], "逐链键面");
  assert.deepEqual(parsed.links.map((l) => l.class), ["ok", "ok", "ok", "ok", "ok"]);
  const ids = parsed.links.map((l) => `${l.product}:${relative(ROOT, l.link).split(sep).join("/")}`).sort();
  assert.deepEqual(ids, [
    "thincoder-cli:thincoder-cli/node_modules/@thincoder/core",
    "thincoder-desktop:thincoder-desktop/node_modules/@thincoder/core",
    "thincoder-desktop:thincoder-desktop/node_modules/@thincoder/render-core",
    "thincoder-vscode:thincoder-vscode/node_modules/@thincoder/core",
    "thincoder-vscode:thincoder-vscode/node_modules/@thincoder/render-core",
  ], "五链对账（cli:core ∕ vsc:core+render-core ∕ desktop:core+render-core）");
  for (const l of parsed.links) {
    const short = l.link.split(sep).pop();
    assert.equal(l.target, devLink.canonicalTarget(join(ROOT, `thincoder-${short}`)), `${l.product} target = 兄弟目录规范形`);
  }
});

// ─── T5 跨包恒等复测（环境收敛后——真跑读数；不改任何锁档）────────────────────

test("T5 跨包恒等：queued.mjs vsc 链 ∘ cli 链 === true（收敛后复测）", async () => {
  const viaVsc = await import(pathToFileURL(join(ROOT, "thincoder-vscode/node_modules/@thincoder/core/queued.mjs")).href);
  const viaCli = await import(pathToFileURL(join(ROOT, "thincoder-cli/node_modules/@thincoder/core/queued.mjs")).href);
  for (const name of ["planQueuedInput", "takeQueuedBatchItem"]) {
    assert.equal(typeof viaVsc[name], "function", `vsc 链导出 ${name}（恒等断言前提——防空过）`);
    assert.equal(typeof viaCli[name], "function", `cli 链导出 ${name}（恒等断言前提——防空过）`);
  }
  assert.equal(viaVsc.planQueuedInput, viaCli.planQueuedInput, "同一函数绑定（同模块实例）");
  assert.equal(viaVsc.takeQueuedBatchItem, viaCli.takeQueuedBatchItem);
});

// ─── T6 负控（合成「异拼写」夹具 ⇒ 判红——防判据空过）────────────────────────

test("T6 负控：合成「异拼写」夹具（小写盘符 junction）⇒ 判红（case-variant · ok=false）；修复后转绿", () => {
  if (!WIN) return; // 盘符面 = win32 专面（判据环境 = 本机 win32）
  const fx = mkdtempSync(join(tmpdir(), "core-hygiene-t6-"));
  try {
    // 合成三产品仓：cli = 声明核依赖 + 小写盘符 junction（异拼写）；vsc = 声明核依赖 + 链缺失；
    // desktop = 无核依赖（对照——无声明不产链，零误差集）。
    mkdirSync(join(fx, "thincoder-core"), { recursive: true });
    writeFileSync(join(fx, "thincoder-core", "package.json"), JSON.stringify({ name: "@thincoder/core" }), "utf8");
    for (const p of ["thincoder-cli", "thincoder-vscode", "thincoder-desktop"]) mkdirSync(join(fx, p), { recursive: true });
    writeFileSync(join(fx, "thincoder-cli", "package.json"), JSON.stringify({ name: "thincoder", dependencies: { "@thincoder/core": "^0.9.5" } }), "utf8");
    writeFileSync(join(fx, "thincoder-vscode", "package.json"), JSON.stringify({ name: "thincoder-vscode", dependencies: { "@thincoder/core": "^0.9.5" } }), "utf8");
    writeFileSync(join(fx, "thincoder-desktop", "package.json"), JSON.stringify({ name: "thincoder-desktop" }), "utf8");
    const target = realpathSync.native(join(fx, "thincoder-core"));
    const variant = flipDriveCase(target);
    assert.notEqual(variant, target, "夹具判别力：取反变体 ≠ 规范形");
    mkdirSync(join(fx, "thincoder-cli", "node_modules", "@thincoder"), { recursive: true });
    symlinkSync(variant, join(fx, "thincoder-cli", "node_modules", "@thincoder", "core"), "junction");
    const red = devLink.checkLinks(fx);
    assert.deepEqual(red.links.map((l) => l.class), ["case-variant", "missing"], "合成「异拼写」+ 缺失 ⇒ 判红");
    assert.deepEqual(red.errors, []);
    assert.equal(red.ok, false, "负控：ok=false");
    const fixed = devLink.applyLinks(fx);
    assert.deepEqual(fixed.actions.map((a) => a.action), ["repaired", "created"]);
    assert.equal(fixed.ok, true, "修复后转绿");
    assert.equal(devLink.checkLinks(fx).ok, true);
  } finally {
    rmSync(fx, { recursive: true, force: true });
  }
});
