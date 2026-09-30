// 2026-09-29-tools-carryover-ac.test.mjs — #418 生成器（`scripts/api-contract.mjs`）夹具件（批次本地单测）。
// 口径：夹具树注入（`--root`）∥ 骨架生成 ∥ `--check` 两态（零漂移 ⇒ 0 ∕ 漂移 ⇒ 1）∥ 行宽 ≤300。
// 父侧直接执行（工程工具面）· 随批档存（docs/batches/）· 复跑 = node --test docs/batches/2026-09-29-tools-carryover-ac.test.mjs
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";

const REPO = fileURLToPath(new URL("../../", import.meta.url));
const SCRIPT = join(REPO, "scripts", "api-contract.mjs");

function fixture() {
  const fx = mkdtempSync(join(tmpdir(), "ac-fixture-"));
  writeFileSync(join(fx, "a.mjs"), [
    "export const A = 1;",
    "export function fn1() {}",
    "export { X, Y as Z };",
    "export default 1;",
    'export * from "./sub/b.mjs";',
    "",
  ].join("\n"));
  mkdirSync(join(fx, "sub"));
  writeFileSync(join(fx, "sub", "b.mjs"), "export class Cls {}\nexport let n = 0;\n");
  const target = join(fx, "API-CONTRACT.md");
  writeFileSync(target, [
    "# fixture index",
    "",
    "<!-- BEGIN GENERATED（生成器唯一笔——勿手改；重跑 = node scripts/api-contract.mjs --write） -->",
    "<!-- END GENERATED -->",
    "",
    "<!-- BEGIN SEMANTIC（人工唯一笔——生成器零触） -->",
    "<!-- END SEMANTIC -->",
    "",
  ].join("\n"));
  return { fx, target };
}

function run(args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

test("生成：夹具三列骨架（符号/档:行/导出形——零空）", () => {
  const { fx } = fixture();
  const r = run(["--root", fx]);
  assert.equal(r.code, 0);
  const rows = r.out.split("\n").filter((l) => l.startsWith("| `"));
  assert.equal(rows.length, 7);
  assert.ok(rows.some((l) => l.includes("`A`") && l.includes("`a.mjs:1`") && l.includes("`const`")));
  assert.ok(rows.some((l) => l.includes("`fn1`") && l.includes("`fn`")));
  assert.ok(rows.some((l) => l.includes("`X, Y as Z`") && l.includes("`named`")));
  assert.ok(rows.some((l) => l.includes("`default`")));
  assert.ok(rows.some((l) => l.includes("`*`") && l.includes("`star`")));
  assert.ok(rows.some((l) => l.includes("`Cls`") && l.includes("`sub/b.mjs:1`")));
  assert.ok(r.out.includes("合计：7 条导出条目（2 档"));
  rmSync(fx, { recursive: true, force: true });
});

test("--write：整区替换生成区（标记间）∥ --check：零漂移 ⇒ 0", () => {
  const { fx, target } = fixture();
  const w = run(["--root", fx, "--target", target, "--write"]);
  assert.equal(w.code, 0);
  const doc = readFileSync(target, "utf8");
  assert.ok(doc.includes("| `A` | `a.mjs:1` | `const` |"));
  const c = run(["--root", fx, "--target", target, "--check"]);
  assert.equal(c.code, 0);
  assert.ok(c.out.includes("OK(api-contract): 骨架零漂移（7 条"));
  rmSync(fx, { recursive: true, force: true });
});

test("--check：漂移 ⇒ 1（DRIFT 行）", () => {
  const { fx, target } = fixture();
  run(["--root", fx, "--target", target, "--write"]);
  const doc = readFileSync(target, "utf8").replace("| `A` | `a.mjs:1` | `const` |", "| `A` | `a.mjs:999` | `const` |");
  writeFileSync(target, doc);
  const c = run(["--root", fx, "--target", target, "--check"]);
  assert.equal(c.code, 1);
  assert.ok(c.out.includes("DRIFT(api-contract)"));
  rmSync(fx, { recursive: true, force: true });
});

test("行宽：生成行 ≤300 ∥ 夹具隔离（无仓档泄漏）", () => {
  const { fx } = fixture();
  const r = run(["--root", fx]);
  const rows = r.out.split("\n").filter((l) => l.startsWith("| `"));
  assert.ok(rows.every((l) => l.length <= 300));
  assert.ok(rows.every((l) => /`(a\.mjs|sub\/b\.mjs):\d+`/.test(l)));
  rmSync(fx, { recursive: true, force: true });
});

test("标记缺失 ⇒ fail-closed（exit 1）", () => {
  const { fx, target } = fixture();
  writeFileSync(target, "# no markers\n");
  const c = run(["--root", fx, "--target", target, "--check"]);
  assert.equal(c.code, 1);
  assert.ok(c.out.includes("FAIL(markers)"));
  rmSync(fx, { recursive: true, force: true });
});
