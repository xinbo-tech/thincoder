#!/usr/bin/env node
/**
 * check-doc-width.mjs — 文档宽度检查 + 文档一致性机械校验 V1/V2/V3（合并仓统一版 · S4 机检单仓化）。
 *
 * 结构（R24a 拆分——各档 ≤300 行）：本档 = 入口 / 报告 + 宽度判据 + 六档并入映射；
 * 判据核（域驱动 / V1 / V2 / V3 / 基线）= `check-doc-width-core.mjs`（全量 re-export——对外导入面不变）。
 * 来源 = 两产品同名档（CLI `thincoder-cli/scripts/check-doc-width.mjs` 与 VSC `thincoder-vscode/scripts/check-doc-width.mjs`）
 * 的并集——跨仓判据（V4 跨仓形态 / 方向对常量）整类退役（两仓合并 S4；设计档 TWO-REPO-MERGE.md §2.4 R5/R8）。
 * 本档 = 域参数化单份：**无域参 = 全域**（仓根 `docs` 自身 + 各产品子目录域）；产品域由门禁显式传参（`--domain`）。
 *
 * ① 宽度检查（既有）：扫描域内 .md 的 >max 字符单行（文档人类可读判据——README 归属规则 6）；
 *    **表格行豁免**（谓词 = 既有 `isTableRow`，markdown 表格行结构性不可折行）。
 * ② V1/V2/V3 判据全文与精度取向 = 核心档（`check-doc-width-core.mjs`）头注；基线（各域自持
 *    `test/fixtures/doc-consistency-baseline.json`）：**必须保持为空**——新增违规一律红，不得再入基线。
 *
 * 用法：node scripts/check-doc-width.mjs [--root <仓根>] [--domain <产品域>] [--dir <docs/design>] [--max 300]
 * 导出（两产品 `test/doc-consistency.test.mjs` 消费）：核心全量（collectMarkdown / scanDomain / discoverDomains /
 * checkSectionRefs / checkCountLists / checkBatchSegments / checkDocConsistency / loadBaseline / SCAN_DIRS /
 * isExecutableLine / inCodeSpan——经 re-export）+ 本档 checkDocWidths / MERGED_SCRIPTS。
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  checkDocConsistency, collectMarkdown, discoverDomains, isTableRow, loadBaseline, scanDomain, v1Key, v2Key, v3Key,
} from "./check-doc-width-core.mjs";

export * from "./check-doc-width-core.mjs";

/**
 * 六档并入映射（S4 单仓化）：旧档名 → 仓根统一版（`scripts/` 下）。
 * 语义 = 设计档 §2.5「退场注记 + 来源指针（已并入仓根统一脚本 …）」的**机器侧对位**——对已删档名的
 * 历史引用（AC / as-of 断言行——「不改写」边界内）按并入语义解析，不逐条改写文档。
 */
export const MERGED_SCRIPTS = Object.freeze({
  "doc-anchors.mjs": "doc-anchors.mjs",
  "check-doc-anchors.mjs": "doc-anchors.mjs", // VSC 侧旧名并入统一版
  "check-doc-width.mjs": "check-doc-width.mjs",
  "check-ledger.mjs": "check-ledger.mjs",
});

/** ① 宽度检查：返回 [{file, line, len}]（file 为绝对路径）。
 *  表格行豁免（§2.26.2——谓词 = 既有 `isTableRow`，与 V2 同源；非表格超宽行照报）。 */
export function checkDocWidths(root, { max = 300, dir = null, domain = null } = {}) {
  const files = dir ? collectMarkdown(resolve(root, dir)) : scanDomain(root, domain);
  const hits = [];
  for (const f of files) {
    readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      if (l.length > max && !isTableRow(l)) hits.push({ file: f, line: i + 1, len: l.length });
    });
  }
  return hits;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const args = process.argv.slice(2);
  const argOf = (flag) => { const i = args.indexOf(flag); return i >= 0 && args[i + 1] ? args[i + 1] : null; };
  const maxW = argOf("--max") ? parseInt(argOf("--max"), 10) : 300;
  const root = resolve(argOf("--root") ?? process.cwd());
  const dirArg = argOf("--dir");
  const domainArg = argOf("--domain"); // 产品域态（门禁传参）；无域参 = 全域

  // ① 宽度——扫描域 = 发现域集（或显式产品域）的 docs/design + docs/requirements + docs/batches；
  //    扫描单源 = checkDocWidths（表格行豁免同在其中——主流程零内联重复扫描，防两处规则漂移；T74）
  const widthFiles = dirArg ? collectMarkdown(resolve(root, dirArg)) : scanDomain(root, domainArg);
  const widthHits = checkDocWidths(root, { max: maxW, dir: dirArg, domain: domainArg });
  const byFile = new Map();
  for (const h of widthHits) byFile.set(h.file, [...(byFile.get(h.file) ?? []), h]);
  for (const [f, hs] of byFile) {
    console.log(`✗ ${f.replace(root + /[\\/]?/, "")}: ${hs.length} 行 >${maxW} 字符`);
    for (const x of hs.slice(0, 3)) console.log(`    :${x.line} (${x.len} chars)`);
    if (hs.length > 3) console.log(`    … 共 ${hs.length} 行`);
  }
  if (widthHits.length) {
    console.log(`\nFAIL(宽度): ${byFile.size} 文件 / ${widthHits.length} 行超 ${maxW} 字符——违反 README 归属规则 6（文档人类可读）。`);
  } else {
    console.log(`OK(宽度): 扫描域全部 .md 无 >${maxW} 字符单行（${widthFiles.length} 文件）。`);
  }

  // ② 一致性 V1/V2/V3——新增阻断、存量报告（基线 = 各域 test/fixtures/doc-consistency-baseline.json）
  const { v1, v2, v3 } = checkDocConsistency(root, domainArg);
  const baseline = new Set();
  const baseRoots = domainArg ? [resolve(root, domainArg)] : [root, ...discoverDomains(root)];
  for (const d of baseRoots.filter((x, i, a) => a.indexOf(x) === i)) {
    for (const k of loadBaseline(d)) baseline.add(k);
  }
  // 基线必须保持为空（2026-09-12 清零轮闸门收紧）：入基线 = 例外 = 违规 → 非空即 FAIL
  if (baseline.size) {
    console.log(`FAIL(基线): 基线清单非空（${baseline.size} 条）——**本基线必须保持为空**：新增违规一律红，不得再入基线（入基线 = 例外 = 违规）。`);
    for (const k of baseline) console.log(`    ${k}`);
  }
  const all = [...v1.map((r) => [v1Key(r), r]), ...v2.map((r) => [v2Key(r), r]), ...v3.map((r) => [v3Key(r), r])];
  const fresh = all.filter(([k]) => !baseline.has(k));
  const known = all.length - fresh.length;
  for (const [, r] of fresh) {
    console.log(r.kind === "batch" ? `✗ V3 ${r.file} §3 缺工具写入的轮次行（一批一段——FR22 N3）`
      : r.declared !== undefined ? `✗ V2 ${r.file}:${r.line} “${r.decl}” 声明 ${r.declared} ≠ 枚举 ${r.found}（${r.form}）`
      : `✗ V1 ${r.file} “${r.ref}”（${r.reason}）`);
  }
  console.log(`一致性 V1/V2/V3：新增违规 ${fresh.length} 条 · 存量（基线内）${known} 条。`);
  if (fresh.length || baseline.size) {
    console.log(`\nFAIL(一致性): ${fresh.length} 条违规（V1 段引用 / V2 计数 / V3 批次档 §3）——**修掉**；本基线必须保持为空，不得再入基线（入基线 = 例外 = 违规）。`);
    process.exit(1);
  }
  process.exit(widthHits.length ? 1 : 0);
}
