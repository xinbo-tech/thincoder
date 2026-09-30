#!/usr/bin/env node
/**
 * api-contract.mjs — #418 接口索引生成器（生成区唯一笔）+ `--check` 骨架漂移判据（报告态 v1 · 不入闸）。
 * 权威设计 = `docs/batches/2026-09-29-tools-carryover.md` §2.3（混合形：生成区机械三列 ∥ 语义区人工唯一笔）。
 * 父侧直接执行（工程工具面）· 单提交可 revert。
 * 口径：`^export ` 行口径；行 = 导出条目（一条 export 语句一行；多符号语句符号列并列；生成器保证零空）；
 *      扫描域 = 根下 `**\/*.mjs`（跳 `node_modules` ∕ `.git` ∕ `.thincoder` ∕ `_archive` ∕ `bench` ∕ `docs` ∕ 点目录/点文件）；
 *      输出即守行宽 ≤300——超宽行按「, 」边界截尾并标 `…（+N）`（截断行数在运行报告面报出，不静默）。
 * 用法：node scripts/api-contract.mjs [--root <仓根>] [--target <档>] [--write | --check]
 *   缺省 = stdout 表体；--write = 整区替换目标档生成区（BEGIN/END GENERATED 标记间）；--check = 漂移判据（exit 1 = 漂移）。
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const SKIP_DIRS = new Set(["node_modules", ".git", ".thincoder", "_archive", "bench", "docs"]);
const MARK_BEGIN = /^<!-- BEGIN GENERATED/;
const MARK_END = /^<!-- END GENERATED -->\s*$/;

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); continue; }
    if (e.isFile() && e.name.endsWith(".mjs")) out.push(p);
  }
  return out;
}

function formOf(rest) {
  if (rest.startsWith("default")) return "default";
  if (rest.startsWith("async function")) return "fn";
  const t = rest.split(/\s/)[0];
  if (t === "function") return "fn";
  if (t === "class") return "class";
  if (t === "const" || t === "let" || t === "var") return t;
  if (t.startsWith("{")) return "named";
  if (t.startsWith("*")) return "star";
  return "other";
}

function symOf(rest) {
  let m;
  if ((m = rest.match(/^default\s+async\s+function\s*\*?\s*([A-Za-z0-9_$]+)?/))) return m[1] ?? "default";
  if ((m = rest.match(/^default\s+(?:function|class)\s*\*?\s*([A-Za-z0-9_$]+)?/))) return m[1] ?? "default";
  if (rest.startsWith("default")) return "default";
  if ((m = rest.match(/^(?:async\s+)?function\s*\*?\s*([A-Za-z0-9_$]+)/))) return m[1];
  if ((m = rest.match(/^class\s+([A-Za-z0-9_$]+)/))) return m[1];
  if ((m = rest.match(/^(?:const|let|var)\s+([A-Za-z0-9_$]+)/))) return m[1];
  if ((m = rest.match(/^\{([\s\S]*?)\}/))) return m[1].trim().replace(/\s+/g, " ");
  if ((m = rest.match(/^\*\s*(?:as\s+([A-Za-z0-9_$]+))?/))) return m[1] ? `${m[1]}（* 再导出）` : "*";
  return "—";
}

/** 采集：根下 `**\/*.mjs`（跳 `node_modules` ∕ `.git` ∕ `.thincoder` ∕ `_archive` ∕ 点目录），`^export ` 行口径。 */
export function collect(root) {
  const files = walk(root).sort();
  const rows = [];
  for (const f of files) {
    const rel = relative(root, f).split(sep).join("/");
    const lines = readFileSync(f, "utf8").split("\n");
    lines.forEach((l, i) => {
      if (!l.startsWith("export ")) return;
      let rest = l.slice(7).trim();
      if (rest.startsWith("{") && !rest.includes("}")) {
        for (let j = i + 1; j < lines.length; j++) { rest += " " + lines[j].trim(); if (lines[j].includes("}")) break; }
      }
      rows.push({ sym: symOf(rest).replace(/\|/g, "\\|"), at: `${rel}:${i + 1}`, form: formOf(rest) });
    });
  }
  return { files: files.length, rows };
}

/** 渲染：机械三列（符号 ∥ 档:行 ∥ 导出形）。超 300 行 = 「, 」边界截尾 + `…（+N）` 标记（报告面计数）。 */
export function render(rows) {
  const out = ["| 符号 | 档:行 | 导出形 |", "|---|---|---|"];
  let truncated = 0;
  let dropped = 0;
  for (const r of rows) {
    const tail = ` | \`${r.at}\` | \`${r.form}\` |`;
    let line = `| \`${r.sym}\`${tail}`;
    if (line.length > 300) {
      const parts = r.sym.split(", ");
      const kept = parts.slice();
      while (kept.length && `| \`${kept.join(", ")} …（+${parts.length - kept.length}）\`${tail}`.length > 300) kept.pop();
      const sym = (kept.length ? `${kept.join(", ")} ` : "") + `…（+${parts.length - kept.length}）`;
      line = `| \`${sym}\`${tail}`;
      if (line.length > 300) line = `| \`${sym.slice(0, Math.max(1, 300 - tail.length - 10))}…\`${tail}`;
      truncated += 1;
      dropped += parts.length - kept.length;
    }
    out.push(line);
  }
  return { text: out.join("\n"), truncated, dropped };
}

export function main(argv = process.argv.slice(2), { cwd = process.cwd(), log = console.log, err = console.error } = {}) {
  const argOf = (f) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
  const root = resolve(argOf("--root") ?? cwd);
  const target = resolve(root, argOf("--target") ?? "docs/core/design/API-CONTRACT.md");
  const mode = argv.includes("--check") ? "check" : argv.includes("--write") ? "write" : "stdout";
  const { files, rows } = collect(root);
  const { text, truncated, dropped } = render(rows);
  if (truncated) log(`报告：截断 ${truncated} 行（-${dropped} 枚符号——源可 grep）`);
  if (mode === "stdout") {
    log(text);
    log(`合计：${rows.length} 条导出条目（${files} 档 · ${root}）`);
    return 0;
  }
  const cur = readFileSync(target, "utf8");
  const lines = cur.split("\n");
  const bi = lines.findIndex((l) => MARK_BEGIN.test(l));
  const ei = lines.findIndex((l) => MARK_END.test(l));
  if (bi < 0 || ei <= bi) { err(`FAIL(markers): 目标档生成区标记缺失 ∕ 倒序——${target}`); return 1; }
  const region = lines.slice(bi + 1, ei).join("\n").replace(/\s+$/, "");
  if (mode === "check") {
    const same = region === text;
    log(same
      ? `OK(api-contract): 骨架零漂移（${rows.length} 条 · ${files} 档）`
      : `DRIFT(api-contract): 生成区 ≠ 源（盘上 ${region.split("\n").length} 行 ∕ 生成 ${text.split("\n").length} 行）——重跑 --write`);
    return same ? 0 : 1;
  }
  const next = [...lines.slice(0, bi + 1), ...text.split("\n"), ...lines.slice(ei)];
  writeFileSync(target, next.join("\n"));
  log(`WROTE(api-contract): ${rows.length} 条 → ${target}（生成区整区替换）`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
