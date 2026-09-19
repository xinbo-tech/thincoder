/**
 * doc-check-width.mjs — M8 行宽检查 + 共享豁免谓词 + 域驱动。
 * 权威设计 = M8 机检引擎模块设计（ENGINEERING-MODE-V2-MODULE-MACHINE-CHECK）§2.2
 * 由 check-doc-width-core.mjs 继承；砍 V1/V2/V3 一致性族 + v3Key（V3 历史常量）+ 基线通道
 * （v1 基线「必须保持为空」→ v2 通道不存在——无基线读写函数）。
 * 声明面驱动：扫描目录 = checkConfig.scanDirs；行宽阈值 = checkConfig.lineWidth——无硬编码路径 / 阈值。
 * 单源域：锚检查与行宽检查共用同一源域（collectSourceDomain——doc-check-targets.mjs 单源采集）。
 * 导出：scanDomain / checkDocWidths / isTableRow / isExecutableLine / inCodeSpan / discoverDomains。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { MANIFEST_REL } from "../thincoder-core/manifest.mjs";
import { collectSourceDomain } from "./doc-check-targets.mjs";

/** 域发现跳过目录（不视作候选产品域）。 */
const DOMAIN_SKIP = new Set(["node_modules", ".git", "dist", "build", "coverage", ".turbo", "_archive"]);

/** 域发现（声明面）：cwd 根（持 manifest）+ 各持自身 manifest 的一级子目录——域判据 = manifest 在场，无路径硬编码。 */
export function discoverDomains(root) {
  const rootAbs = resolve(root);
  const hasManifest = (p) => { try { return statSync(join(p, MANIFEST_REL)).isFile(); } catch { return false; } };
  const out = [];
  if (hasManifest(rootAbs)) out.push(rootAbs);
  let names = [];
  try { names = readdirSync(rootAbs); } catch { /* 不可读：仅根域 */ }
  for (const n of names) {
    if (DOMAIN_SKIP.has(n)) continue;
    const p = join(rootAbs, n);
    try { if (statSync(p).isDirectory() && hasManifest(p)) out.push(p); } catch { /* 跳过 */ }
  }
  return out;
}

/** 源域（单源）：scanDirs × exclude 声明面下的全部 .md——锚检查与行宽检查同一文件集。 */
export function scanDomain(base, { scanDirs = [], exclude = [] } = {}) {
  return collectSourceDomain(resolve(base), scanDirs, exclude);
}

/** 表格行谓词（markdown 表格行结构性不可折行——行宽豁免；与锚检查同源）。 */
export const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);

/** 行内可执行坐标（命令 / 搜索模式串码段）——锚射程豁免（证据与命令保字面）。 */
export function isExecutableLine(line) {
  if (/`[^`\n]*&&[^`\n]*`/.test(line)) return true; // 命令链（cd … && …）
  if (/`[^`\n]*\b(?:cd|node|npm|npx|grep|rg|git)\s[^`\n]*`/.test(line)) return true; // 码段内命令词
  if (/`[^`\n]*(?:\[\^|\\\.|\(\?<|\(\?:|\{\d)/.test(line)) return true; // 码段内搜索模式串片段
  return false;
}

/** 行内位置是否在反引号码段内（引述面不判）。 */
export function inCodeSpan(line, idx) {
  return (line.slice(0, idx).match(/`/g) ?? []).length % 2 === 1;
}

/** 行宽检查（单判据 = checkConfig.lineWidth）：超阈值且非表格行 → [{file, line, len}]。 */
export function checkDocWidths(base, { lineWidth, scanDirs, exclude }) {
  const hits = [];
  for (const f of scanDomain(base, { scanDirs, exclude })) {
    let text = "";
    try { text = readFileSync(f, "utf8"); } catch { continue }
    text.split("\n").forEach((l, i) => {
      if (l.length > lineWidth && !isTableRow(l)) hits.push({ file: f, line: i + 1, len: l.length });
    });
  }
  return hits;
}
