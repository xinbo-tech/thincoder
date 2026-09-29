/**
 * 2026-09-29-desktop-execute-electron-node.test.mjs — 批内件（台账 #602 · V1–V5 · 随批留存归档）。
 * 名随批次档 · 不进仓套件；**本刻暂存 `.thincoder/tmp/` 同名件**（`docs/batches/` 写面被批档命名门
 * 判「跨批」而拒 ⇒ 退 tmp 同件并报告——coder 任务书预案 ∕ 兄弟批同款立即形；两处均两层深 ⇒
 * 从仓根 `thincoder/` 跑同命令形态），复跑（从仓根跑——导入以 process.cwd() 解析）：
 *   node --test .thincoder/tmp/2026-09-29-desktop-execute-electron-node.test.mjs
 *   （终位 `docs/batches/` copy 后同形：`node --test docs/batches/2026-09-29-desktop-execute-electron-node.test.mjs`）
 *
 * 判据面（批档 §2.5）：V1 `nodeChildEnv` 纯函数双支 · V2 真子进程 env 读数（置位 ⇒ `1`；复位 ⇒ `unset`）·
 * V3 lint 快路径绑定（置位 ⇒ 经 `lint` 工具驱动 `configureExecRun` 探针捕获 `opts.env`）·
 * V4 缺省径透传（`runCommand` → `execFileSync` 真子进程读数）·
 * V5 形面断言（**归一空白**后匹配——对换行 ∕ 缩进 ∕ 注释插入敏感，归一空白为构成性前提）。
 * 置位面 = `process.versions.electron` try/finally 置删（本机 node 实读可置可删）。
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const mod = (rel) => pathToFileURL(join(ROOT, rel)).href;
const { nodeChildEnv } = await import(mod("thincoder-core/tools/node-child.mjs"));
const { executeTool } = await import(mod("thincoder-core/tools/execute.mjs"));
const { lintTool } = await import(mod("thincoder-core/tools/linter.mjs"));
const { runCommand, configureExecRun, resetExecRun } = await import(mod("thincoder-core/tools/exec-run.mjs"));

/** 置位 process.versions.electron（真 ⇒ Electron 宿主读数）——try/finally 置删复位。 */
async function withElectron(fn) {
  process.versions.electron = "1";
  try { return await fn() } finally { delete process.versions.electron }
}

// ─── V1 nodeChildEnv 纯函数（判据注入双支）──────────────────────────────────

test("V1 nodeChildEnv：真 ⇒ 旗标 + base 键全保留 + 副本非别名；假 ⇒ 原样同引用无该键", () => {
  const base = { PATH: "/usr/bin", HOME: "/home/u", EMPTY: "" };
  const on = nodeChildEnv(base, true);
  assert.equal(on.ELECTRON_RUN_AS_NODE, "1");
  assert.notEqual(on, base, "真支 = 副本（非别名）");
  for (const k of Object.keys(base)) assert.equal(on[k], base[k], `base 键保留：${k}`);
  assert.equal(Object.hasOwn(base, "ELECTRON_RUN_AS_NODE"), false, "不改父进程 env（base 零染）");
  const off = nodeChildEnv(base, false);
  assert.equal(off, base, "假支 ⇒ 原样返回 base（同引用）");
  assert.equal(Object.hasOwn(off, "ELECTRON_RUN_AS_NODE"), false, "假支无该键");
});

// ─── V2 真子进程 env 读数（置位 ∕ 复位双支——判别「接入在场」）─────────────

test("V2 execute 真子进程读数：置位 ⇒ 输出 1；复位 ⇒ 输出 unset", async () => {
  const probe = "console.log(process.env.ELECTRON_RUN_AS_NODE ?? 'unset')";
  const on = await withElectron(() => executeTool.execute({ code: probe }, { cwd: ROOT }));
  assert.equal(on.trim(), "1", "置位 ⇒ 子进程 env 携旗标");
  const off = await executeTool.execute({ code: probe }, { cwd: ROOT });
  assert.equal(off.trim(), "unset", "复位 ⇒ 无该键（逐字零变）");
});

// ─── V3 lint 快路径绑定（探针捕获 opts.env——linter → exec-run 在场）───────

test("V3 lint 快路径：置位 ⇒ lint 工具经 exec-run 探针捕获 opts.env 携旗标；复位支同引用", async () => {
  resetExecRun(); // 防前测注入残留
  const dir = mkdtempSync(join(tmpdir(), "desktop-execute-v3-"));
  const file = join(dir, "probe.mjs");
  writeFileSync(file, "export const v3 = 1\n", "utf8");
  const seen = [];
  try {
    configureExecRun({ run: async (cmd, args, opts) => { seen.push({ cmd, args, opts }); return "" } });
    const on = await withElectron(() => lintTool.execute({ path: file }, { cwd: ROOT }));
    assert.equal(on, `Syntax OK: ${file}`, "快路径经探针驱动（linter → exec-run 绑定在场）");
    assert.equal(seen.length, 1, "探针恰被调一次");
    assert.equal(seen[0].cmd, process.execPath);
    assert.deepEqual(seen[0].args, ["--check", file]);
    assert.equal(seen[0].opts.env?.ELECTRON_RUN_AS_NODE, "1", "置位支：opts.env 携旗标");
    const off = await lintTool.execute({ path: file }, { cwd: ROOT });
    assert.equal(off, `Syntax OK: ${file}`);
    assert.equal(seen.length, 2, "复位支：探针再调一次");
    assert.equal(Object.hasOwn(seen[1].opts.env ?? {}, "ELECTRON_RUN_AS_NODE"), false, "复位支：无该键");
    assert.equal(seen[1].opts.env, process.env, "复位支：同引用（逐字零变）");
  } finally {
    resetExecRun();
    rmSync(dir, { recursive: true, force: true });
  }
});

// ─── V4 缺省径 env 透传（runCommand → execFileSync 真子进程读数）──────────

test("V4 缺省径透传：runCommand + opts.env ⇒ 真子进程读数 PROBE=1", async () => {
  resetExecRun(); // 缺省径（防注入残留）
  const out = await runCommand(process.execPath, ["-e", "console.log(process.env.PROBE ?? 'unset')"], { env: { ...process.env, PROBE: "1" } });
  assert.equal(String(out).trim(), "1", "缺省径吃 opts.env");
});

// ─── V5 形面断言（归一空白——构成性前提）────────────────────────────────────

test("V5 形面断言（归一空白）：execute ∕ linter 含 env: nodeChildEnv()；exec-run defaultRun 含 opts.env 透传", () => {
  const norm = (s) => s.replace(/\s+/g, " ");
  const src = (rel) => norm(readFileSync(join(ROOT, rel), "utf8"));
  assert.ok(src("thincoder-core/tools/execute.mjs").includes("env: nodeChildEnv()"), "execute.mjs spawn 选项携 env: nodeChildEnv()");
  assert.ok(src("thincoder-core/tools/linter.mjs").includes("env: nodeChildEnv()"), "linter.mjs 调用携 env: nodeChildEnv()");
  const execRun = src("thincoder-core/tools/exec-run.mjs");
  const start = execRun.indexOf("function defaultRun");
  const end = execRun.indexOf("export async function runCommand");
  assert.ok(start >= 0 && end > start, "defaultRun 锚点在位（稳定 token）");
  assert.ok(execRun.slice(start, end).includes("opts.env"), "exec-run.mjs defaultRun 含 opts.env 透传");
});
