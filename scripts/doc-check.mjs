#!/usr/bin/env node
/**
 * doc-check.mjs — M8 机检引擎 · 单引擎入口（锚 + 行宽）。
 * 权威设计 = `docs/core/design/DOC-DISCIPLINE.md` §7（机器可检纪律）（2026-09-22 hygiene 批改指旧归档模块名 · 父侧直接执行 · 可 revert）
 * 单引擎：锚检查 + 行宽检查 + 行数面同一 main 驱动、同一报告；台账一致性不并入（由 M2 SQLite schema 承接，
 * check-ledger* 家族随单引擎作废——无文件）。
 * 声明面：判据全部读 manifest checkConfig（scanDirs / lineWidth / anchors.domain / anchors.exclude /
 * exemptions / lineCounts / widthExemptZones）——无硬编码路径 / 阈值；整档缺失 fail-closed（readManifest 拒，不静默 fallback）。
 * 本档不写 manifest（写门 = M1 writeManifest，writer:'main' 专权——唯一写 manifest 的路径）。
 * 用法：node scripts/doc-check.mjs [--root <仓根>] [--domain <产品域>]
 * 导出：main / formatReport。
 */
import { existsSync, readdirSync, realpathSync } from "node:fs";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readManifest } from "../thincoder-core/manifest.mjs";
import { declaredPublicRoots } from "../thincoder-core/declaration.mjs";
import { checkAnchors } from "./doc-check-anchors.mjs";
import { checkDocWidths, discoverDomains } from "./doc-check-width.mjs";
import { checkLineCounts } from "./doc-check-linecounts.mjs";

/** 仓根探测（#822 · 父侧直接执行）：--root 缺省时自 cwd 探根——
 *  ① **祖先最近者胜**（向上取最近携带 PROJECT-MANIFEST.json 的祖先——与 manifest 归属同律）⇒ 子目录内直跑不再落「0 档假绿」（原缺省 = cwd ⇒ scanDirs 相对 cwd 解析 ⇒ 扫空还 EXIT 0）；
 *  ② 无祖先 ⇒ 查直接子目录携带者：恰一 ⇒ 用之；多 ⇒ 显式拒（列候选——机制不猜）；零 ⇒ 回退 cwd（fail-closed 语义零变）。 */
export function detectRoot(cwd) {
  let dir = resolve(cwd);
  for (;;) {
    if (existsSync(resolve(dir, "PROJECT-MANIFEST.json"))) return { root: dir };
    const up = resolve(dir, "..");
    if (up === dir) break;
    dir = up;
  }
  const base = resolve(cwd);
  const kids = [];
  try {
    for (const e of readdirSync(base, { withFileTypes: true })) {
      if (e.isDirectory() && existsSync(resolve(base, e.name, "PROJECT-MANIFEST.json"))) kids.push(resolve(base, e.name));
    }
  } catch { /* 不可读 ⇒ 视为零候选 */ }
  if (kids.length === 1) return { root: kids[0] };
  if (kids.length > 1) return { root: base, ambiguous: kids.sort() };
  return { root: base };
}

/** 锚报告（报告段逐条 + 汇总 + 两态固定句）。
 * 逐条行族标（§4.2.9 / §4.2.10）：拟新增 / 迁移期引文 = 列报 · 不入闸；标记失据 = 违规行行尾标；
 * 标记并置 = 并置行报告面标；标记冗余 = 报告行（行式同 V5-C 宽形态行）。 */
export function formatReport(r) {
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  const out = [`机检·锚：扫描域 ${r.scanDirs.join(" + ")} · ${r.files} 档`];
  for (const x of r.rows) {
    const fam = x.pending ? "·拟新增——列报 · 不入闸" : (x.citation ? "·迁移期引文——列报 · 不入闸" : "");
    const note = x.groundless ? "·标记失据" : (x.conflict ? "·标记并置" : "");
    out.push(`✗ ${x.file}:${x.line} ${x.anchor}（${x.clazz}${fam}${note}）`);
  }
  for (const x of r.wideRows) out.push(`报告 ${x.file}:${x.line} ${x.anchor}（${x.clazz}——报告面，不入闸）`);
  for (const x of r.redundantRows ?? []) out.push(`报告 ${x.file}:${x.line} ${x.anchor}（标记冗余——报告面，不入闸）`);
  for (const x of r.unverifiedRows ?? []) out.push(`报告 ${x.file}:${x.line} ${x.anchor}（声明源缺位——未核 · 不入闸）`);
  out.push(`汇总：候选 ${sum(r.cand)} · 悬空 ${r.danglingTotal} · 注记豁免 ${sum(r.exempt)} · 拟新增 ${r.pendingTotal} · 迁移期引文 ${r.citationTotal} · 声明源缺位 ${r.unverifiedTotal ?? 0}`);
  out.push(`  用例号：候选 ${r.cand.case} · 悬空 ${r.dang.case} · 注记豁免 ${r.exempt.case}`);
  out.push(`  路径/坐标：候选 ${r.cand.path} · 悬空 ${r.dang.path} · 注记豁免 ${r.exempt.path}`);
  out.push(`  符号·窄：候选 ${r.cand.symbol} · 悬空 ${r.dang.symbol} · 注记豁免 ${r.exempt.symbol}`);
  out.push(`  符号·宽（报告面）：候选 ${r.cand.wide} · 悬空 ${r.wideRows.length} · 注记豁免 ${r.exempt.wide}`);
  out.push(r.gate
    ? (r.danglingTotal > 0 ? `FAIL(锚): ${r.danglingTotal} 条悬空（闸态——阈值 0）` : "OK(锚): 0 条悬空（闸态——阈值 0）")
    : `报告 ${r.danglingTotal} 条（报告态——不阻断）`);
  return out;
}

/** CLI 主行程（单引擎 + 声明面）：--root 默认 cwd；--domain 显式产品域；退出码 0/1。 */
export function main(argv = process.argv.slice(2), { cwd = process.cwd(), log = console.log } = {}) {
  const argOf = (f) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
  const explicitRoot = argOf("--root");
  let root; let ambiguous = null;
  if (explicitRoot) { root = resolve(explicitRoot); }
  else { const d = detectRoot(cwd); root = d.root; ambiguous = d.ambiguous ?? null; }
  if (ambiguous !== null) {
    log(`FAIL(manifest): 缺省 cwd 下候选项目不唯一（${ambiguous.length} 个）——显式给 --root <仓根>（机制不猜）：\n${ambiguous.map((c) => `- ${c}`).join("\n")}`);
    return 1;
  }
  const domainArg = argOf("--domain");
  const read = readManifest(root);
  if (!read.ok) {
    log(`FAIL(manifest): ${read.reason ?? read.errors.join("；")}——整档缺失拒绝进入（fail-closed）。`);
    return 1;
  }
  const cfg = read.manifest.checkConfig;
  const declaredRoots = declaredPublicRoots(root); // §6.15 单一声明源根集（#832——声明源候选入参；缺省 [] ⇒ 零行为）
  // D3 计数纪律：判据键清单 = 单一数组（计数 = 列表长度——加键时改一处，计数自动同改）。
  // 派生自 checkConfig 实际键面：scanDirs / lineWidth / anchors.domain / anchors.exclude / exemptions / lineCounts / widthExemptZones。
  const CRITERIA_KEYS = ["scanDirs", "lineWidth", "anchors.domain", "anchors.exclude", "exemptions", "lineCounts", "widthExemptZones"];
  log(`判据项 ${CRITERIA_KEYS.length} 项（${CRITERIA_KEYS.join(" / ")} = checkConfig 声明面——D3）`);
  const bases = domainArg ? [resolve(root, domainArg)] : discoverDomains(root);
  if (!bases.length) bases.push(root);
  const zones = (Array.isArray(cfg.widthExemptZones) ? cfg.widthExemptZones : []).filter((z) => typeof z === "string" && z !== "");
  const zoneNote = zones.length ? `（区带豁免在效——${zones.join(" ∥ ")}；区带内超宽行不计）` : "";
  let fail = 0;
  for (const base of bases) {
    const r = checkAnchors(base, cfg, { gate: true, root, declaredRoots });
    for (const line of formatReport(r)) log(line);
    const widths = checkDocWidths(base, { lineWidth: cfg.lineWidth, scanDirs: cfg.scanDirs, exclude: cfg.anchors.exclude ?? [], exemptZones: zones });
    for (const h of widths) log(`✗ 行宽 ${relative(root, h.file).replace(/\\/g, "/")}:${h.line}（${h.len} 字符）`);
    log(widths.length
      ? `FAIL(行宽): ${widths.length} 行超 ${cfg.lineWidth} 字符${zoneNote}——文档人类可读判据。`
      : `OK(行宽): 源域全部 .md 无 >${cfg.lineWidth} 字符单行${zoneNote}。`);
    if (r.danglingTotal > 0 || widths.length) fail = 1;
  }
  // —— 行数面（#546）：声明读取面 = 运行根单读；执行域 = 运行根一次；差异 = 报告态（KD-2）——
  for (const base of bases) {
    if (resolve(base) === root) continue;
    const sub = readManifest(base);
    if (sub.ok && (sub.manifest.checkConfig.lineCounts ?? []).length) {
      log(`✗ 行数面声明面错误：子域 ${relative(root, base).replace(/\\/g, "/")} 持 checkConfig.lineCounts 声明——声明读取面 = 运行根单读（fail-closed）。`);
      fail = 1;
    }
  }
  const lc = checkLineCounts(cfg.lineCounts ?? [], { root });
  for (const line of lc.lines) log(line);
  log(`行数面：差异 ${lc.diffCount} 条（比对 ${lc.compared} 行 · 跳过 ${lc.skipped.est + lc.skipped.nonnum} 行〔预估 ${lc.skipped.est} ∕ 非数 ${lc.skipped.nonnum}〕）——报告态，回填工单即本清单`);
  return fail ? 1 : 0;
}

const isMain = process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url;
if (isMain) process.exit(main());
