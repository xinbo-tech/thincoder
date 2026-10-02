/**
 * doc-check-width.mjs — M8 行宽检查 + 共享豁免谓词 + 域驱动。
 * 权威设计 = M8 机检引擎模块设计（ENGINEERING-MODE-V2-MODULE-MACHINE-CHECK）§2.2
 * 由 check-doc-width-core.mjs 继承；砍 V1/V2/V3 一致性族 + v3Key（V3 历史常量）+ 基线通道
 * （v1 基线「必须保持为空」→ v2 通道不存在——无基线读写函数）。
 * 声明面驱动：扫描目录 = checkConfig.scanDirs；行宽阈值 = checkConfig.lineWidth——无硬编码路径 / 阈值。
 * 区带宽度豁免（条目 N——行宽清账批 · 2026-10-01）：单遍扫描携标题栈——行所属标题链任一为「区带头」⇒ 该行豁免宽度判定；
 * 声明面 = checkConfig.widthExemptZones（缺省 ∕ 空集 ⇒ 零豁免——惰性 · fail-closed）。判据 = `docs/core/design/DOC-DISCIPLINE.md` §3.15。
 * 单源域：锚检查与行宽检查共用同一源域（collectSourceDomain——doc-check-targets.mjs 单源采集）。
 * 导出：scanDomain / checkDocWidths / isTableRow / isExecutableLine / inCodeSpan / isZoneHead / discoverDomains。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { MANIFEST_REL } from "../thincoder-core/manifest.mjs";
import { collectSourceDomain } from "./doc-check-targets.mjs";

/** 域发现跳过目录（不视作候选产品域）。 */
const DOMAIN_SKIP = new Set(["node_modules", ".git", "dist", "build", "coverage", ".turbo", "_archive", ".thincoder"]);

/** 域发现（声明面）：cwd 根（持 manifest）+ 各持自身 manifest 的一级子目录——域判据 = manifest 在场，无路径硬编码。 */
export function discoverDomains(root) {
  const rootAbs = resolve(root);
  const hasManifest = (p) => { try { return statSync(join(p, MANIFEST_REL)).isFile(); } catch { return false; } };
  const out = [];
  if (hasManifest(rootAbs)) out.push(rootAbs);
  let names = [];
  try { names = readdirSync(rootAbs); } catch { /* 不可读：仅根域 */ }
  for (const n of names) {
    if (DOMAIN_SKIP.has(n) || n.startsWith("dist-")) continue;
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

/** 区带头谓词（§3.15 谓词面）：标题文本去首部编号（`^\d+(?:\.\d+)*[.、]?\s*`）后——等于区带名 ∨ 以「区带名 + （∕(」起（容括注后缀，如 `变更记录（续）`）；闭集外一律不纳（fail-closed）。 */
export function isZoneHead(headingText, zones = []) {
  const text = String(headingText).replace(/^\d+(?:\.\d+)*[.、]?\s*/, "");
  return zones.some((z) => typeof z === "string" && z !== "" && (text === z || text.startsWith(z + "（") || text.startsWith(z + "(")));
}

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

/** 行宽检查（单判据 = checkConfig.lineWidth）：超阈值 ∧ 非表格行 ∧ 非区带内 ⇔ 命中。
 *  区带豁免（§3.15）：单遍扫描携标题栈（`^(#{1,6})\s` 行入栈——同级 ∕ 更高级出栈）；行所属标题链任一为区带头 ⇒ 豁免。
 *  `exemptZones` 缺省 ∕ 空集 ⇒ 零豁免（惰性 · fail-closed）。 */
export function checkDocWidths(base, { lineWidth, scanDirs, exclude, exemptZones = [] } = {}) {
  const zones = (Array.isArray(exemptZones) ? exemptZones : []).filter((z) => typeof z === "string" && z !== "");
  const hits = [];
  for (const f of scanDomain(base, { scanDirs, exclude })) {
    let text = "";
    try { text = readFileSync(f, "utf8"); } catch { continue }
    const stack = []; // 标题栈 —— { level, exempt }；exempt = 自身 ∥ 祖先命中区带
    text.split("\n").forEach((l, i) => {
      const m = /^(#{1,6})\s+(.*)$/.exec(l);
      if (m) {
        while (stack.length && stack[stack.length - 1].level >= m[1].length) stack.pop();
        const self = isZoneHead(m[2].trim(), zones);
        stack.push({ level: m[1].length, exempt: self || (stack[stack.length - 1]?.exempt ?? false) });
        return;
      }
      const inZone = stack[stack.length - 1]?.exempt === true;
      if (l.length > lineWidth && !isTableRow(l) && !inZone) hits.push({ file: f, line: i + 1, len: l.length });
    });
  }
  return hits;
}
