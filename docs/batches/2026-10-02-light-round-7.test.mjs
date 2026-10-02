// 轻通道轮七 · 缺陷修复笔（多仓解析 · advisor 门）· 回归锚
// 档 = `docs/batches/2026-10-02-light-round-7.md`；功能级红绿探针 = 其 §1；
// 覆盖 = 解析原语（夹具化）+ 判定拒绝腿；重跑：`node --test docs/batches/2026-10-02-light-round-7.test.mjs`
// （评审 #5 修复：夹具化去环境耦合 ∥ 补判定拒绝腿——裁定表见档 §6）
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { owningProject } from "../../thincoder-core/manifest-discovery.mjs";
import { resolveReviewRootsFor } from "../../thincoder-core/agent/write-gate.mjs";
import { advisorTool } from "../../thincoder-core/agent-tools/advisor.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url)); // 仓根（thincoder——仓内腿可移植）
const norm = (p) => p.replace(/[\\/]/g, sep);
const underAny = (p, roots) => roots.some((r) => p === r || p.startsWith(r + sep));
const strip = (p) => resolve(p).replace(/[\\/]$/, "");

/** 夹具：造一个临时项目（manifest + 声明 docRoot）。 */
function mkProject(docRoot = { requirements: "docs/requirements", design: "docs/design", batches: "docs/batches" }) {
  const root = mkdtempSync(join(tmpdir(), "round7-proj-"));
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev", docRoot }, null, 2));
  return root;
}

test("夹具①：所属项目解析——项目树内文档 → 本项根（最近带档祖先）", () => {
  const root = mkProject();
  assert.equal(owningProject(join(root, "docs", "design", "x.md")), strip(root));
});

test("夹具②：兄弟项目并存——各归各根（不跨兄弟）", () => {
  const a = mkProject();
  const b = mkProject();
  assert.equal(owningProject(join(b, "docs", "design", "x.md")), strip(b));
  assert.notEqual(strip(a), strip(b));
});

test("夹具③：评审根集（按用点）——声明 docRoot 各层在集；集外照拒", () => {
  const root = mkProject();
  const roots = resolveReviewRootsFor(root).map(norm);
  assert.ok(underAny(norm(join(root, "docs", "design", "x.md")), roots), "docs/design 内 = 合法");
  assert.ok(underAny(norm(join(root, "docs", "requirements", "x.md")), roots), "docs/requirements 内 = 合法");
  assert.ok(!underAny(norm(join(root, "src", "x.md")), roots), "声明外 = 照拒");
});

test("夹具④：无主档文档——祖先链无档 → null（fail-closed 面）", () => {
  const bare = mkdtempSync(join(tmpdir(), "round7-bare-"));
  assert.equal(owningProject(join(bare, "nowhere", "x.md")), null);
});

test("仓内腿：本仓声明面在集（仓结构可移植——不依赖兄弟仓 / 盘符）", () => {
  const roots = resolveReviewRootsFor(ROOT).map(norm);
  assert.ok(underAny(norm(join(ROOT, "docs", "core", "design", "PROMPT-SYSTEM.md")), roots));
  assert.ok(!underAny(norm(join(ROOT, "thincoder-core", "prompts", "common.md")), roots), "运行时提示词树 = 非文档层");
});

test("判定拒绝腿：锚外 ∥ 无主档文档 ⇒ 照拒（scope-not-doc）", async () => {
  const bare = mkdtempSync(join(tmpdir(), "round7-judge-"));
  const out = await advisorTool.execute(
    { type: "design", documents: [join(bare, "not-a-doc.md")] },
    { agent: { cwd: bare } },
  );
  assert.equal(typeof out, "string");
  assert.ok(out.includes("must be documentation files"), "无主档文档照拒（拒文案在场）");
});
