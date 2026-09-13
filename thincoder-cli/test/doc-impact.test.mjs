/**
 * doc-impact.test.mjs — 反查脚本用例（设计 `ENGINEERING-MODE.md` §2.32.5.1 / §3.1 AC-V5-12–AC-V5-13；
 * 需求 §1.20 F7 / FR26；批次档 `../docs/batches/2026-09-12-DOC-CODE-RECONCILE.md` §2 条目 C／轮 3）。
 *
 * 宿主 = 本档：T-V5-13（快层——纯函数直驱 `docImpact`）· T-V5-14（慢层 `slow()`——真实 git 子进程）。
 * 反查 = 只读、不写、不阻断（D-V5-6——正常退出码 0；命中不改变退出码）；域 = `docs/{design,requirements}`（`_archive` 跳过）。
 */
import { test } from "node:test";
import { slow } from "./slow.mjs";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { docImpact, changedTokensFromDiff } from "../scripts/doc-impact.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(REPO, "scripts", "doc-impact.mjs");

test("T-V5-13 正常：反查纯函数——命中档清单（档 + 命中词）+ 空清单反证", () => {
  const tmp = mkdtempSync(join(tmpdir(), "doc-impact-"));
  try {
    mkdirSync(join(tmp, "docs", "design"), { recursive: true });
    mkdirSync(join(tmp, "docs", "requirements"), { recursive: true });
    writeFileSync(join(tmp, "docs", "design", "hit.md"),
      "# 命中档\n\n`freshlyAddedThing` 定义于 src/agent/loop.mjs:42。\n\n再见 freshlyAddedThing。\n");
    writeFileSync(join(tmp, "docs", "design", "clean.md"), "# 无引用\n\n与本变更面无关。\n");
    writeFileSync(join(tmp, "docs", "requirements", "req.md"), "# 需求\n\n依赖 src/agent/loop.mjs 的行为。\n");
    mkdirSync(join(tmp, "docs", "design", "_archive"), { recursive: true });
    writeFileSync(join(tmp, "docs", "design", "_archive", "old.md"), "# 历史快照\n\nfreshlyAddedThing 不入扫描。\n");

    const r = docImpact({ changedFiles: ["src/agent/loop.mjs"], changedSymbols: ["freshlyAddedThing"], docsRoot: tmp });
    assert.equal(r.scanned, 3, "扫描 = 3 档（`_archive` 跳过——与 V5 口径同源）");
    assert.deepStrictEqual(r.hits.map((h) => [h.doc, h.count]), [["docs/design/hit.md", 3], ["docs/requirements/req.md", 1]],
      "命中档清单（命中数降序；无引用档不入清单）");
    assert.deepStrictEqual(r.hits[0].words, [{ word: "freshlyAddedThing", count: 2 }, { word: "loop.mjs", count: 1 }],
      "每档带命中词 + 命中数（符号 + basename 两形态）");
    assert.deepStrictEqual(docImpact({ changedFiles: ["src/other/thing.mjs"], changedSymbols: ["neverMentionedThing"], docsRoot: tmp }).hits, [],
      "无关联变更 → 空清单（反证非空转）");
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test("T-V5-13② 边界：变更行 token 抽取（强形态过滤保留 + V5 抽取器单源）", () => {
  const diff = [
    "diff --git a/src/agent/loop.mjs b/src/agent/loop.mjs",
    "--- a/src/agent/loop.mjs",
    "+++ b/src/agent/loop.mjs",
    "@@ -1,2 +1,3 @@",
    "-const oldName = 1;",
    "+export const freshlyAddedThing = importValue;",
    "+// see `wiredThroughHelper` and ./side-module.mjs / config.json",
  ].join("\n");
  const t = changedTokensFromDiff(diff);
  assert.ok(["freshlyAddedThing", "oldName", "importValue"].every((s) => t.symbols.includes(s)), "强形态标识符保留（camelCase）");
  assert.ok(!t.symbols.includes("const") && !t.symbols.includes("export"), "关键字不入候选（过滤保留）");
  assert.ok(t.symbols.includes("wiredThroughHelper"), "反引号标识符（V5 `extractAnchors` 同形态面）");
  assert.ok(!t.symbols.includes("side-module.mjs") && !t.symbols.includes("config.json") && !t.symbols.includes("src/agent/loop.mjs"),
    "路径形 / 裸文件名形态不入符号候选（文件面由 `--name-only` 承担）");
});

slow("T-V5-14 正常：反查 git 包装（临时 git 仓——真实子进程类归册）", () => {
  const tmp = mkdtempSync(join(tmpdir(), "doc-impact-git-"));
  try {
    const git = (args) => spawnSync("git", args, { cwd: tmp, encoding: "utf8" });
    assert.equal(git(["init", "-q"]).status, 0, "git init");
    git(["config", "user.email", "t@example.com"]); git(["config", "user.name", "t"]);
    mkdirSync(join(tmp, "src"), { recursive: true });
    mkdirSync(join(tmp, "docs", "design"), { recursive: true });
    writeFileSync(join(tmp, "src", "thing.mjs"), "export const legacyValue = 1;\n");
    writeFileSync(join(tmp, "docs", "design", "impact-fixture.md"), "# 夹具档\n\n本档引用 fixtureChangedThing 的说明。\n");
    git(["add", "-A"]);
    assert.equal(git(["commit", "-qm", "base"]).status, 0, "base commit");
    const base = git(["rev-parse", "HEAD"]).stdout.trim();
    writeFileSync(join(tmp, "src", "thing.mjs"), "export const fixtureChangedThing = 2;\n");
    git(["add", "-A"]);
    assert.equal(git(["commit", "-qm", "change"]).status, 0, "change commit");

    const r = spawnSync(process.execPath, [SCRIPT, "--base", base], { cwd: tmp, encoding: "utf8" });
    assert.equal(r.status, 0, "非门禁——退出码 0\n" + r.stdout + r.stderr);
    assert.ok(r.stdout.includes("docs/design/impact-fixture.md"), "输出含该设计档");
    assert.ok(r.stdout.includes("fixtureChangedThing"), "输出含变更符号（`git diff -U0` 抽取面）");
    const j = spawnSync(process.execPath, [SCRIPT, "--base", base, "--json"], { cwd: tmp, encoding: "utf8" });
    assert.equal(j.status, 0, "--json 退出码 0");
    assert.ok(JSON.parse(j.stdout).hits.some((h) => h.doc === "docs/design/impact-fixture.md"), "--json 命中档含该设计档");
    const bad = spawnSync(process.execPath, [SCRIPT], { cwd: tmp, encoding: "utf8" });
    assert.equal(bad.status, 2, "缺 `--base` ⇒ 2（fail-loud——不静默空转）");
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});
