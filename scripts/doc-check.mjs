#!/usr/bin/env node
/**
 * doc-check.mjs — M8 机检引擎 · V5 专用面（非 gate 判据源；gate 只读 `thincoder-core/doc-check/index.mjs`）。
 * 权威设计 = `docs/core/design/DOC-DISCIPLINE.md` §7（机器可检纪律）（2026-09-22 hygiene 批改指旧归档模块名 · 父侧直接执行 · 可 revert）
 * 2026-10-18（父侧直接执行 · 可 revert——doc-check-gate 批判据源唯一化）：本脚本与 `thincoder-core/doc-check/`
 * 判据集不同形（V5 三锚 + 六键 vs 起步两判据），保留在盘但不参与任何 gate verdict，读数不可互换。
 * 2026-10-22（FR42 · 工程工具面）：参数源改读**工具内置常量** `DOC_CHECK_BUILTINS`——删 manifest 读取、
 * 删目录发现：扫描根 = `--root` 必带（`--domain` 显式给时才收窄到该子目录），缺 `--root` ⇒ `FAIL(root)`。
 * 本档不写 manifest（写门 = M1 writeManifest，writer:'main' 专权——唯一写 manifest 的路径）。
 * 用法：node scripts/doc-check.mjs --root <仓根> [--domain <产品域>]（`--root` 必带——零发现/零探测；缺 ⇒ `FAIL(root)` + exit 1）
 * 2026-10-13（父侧直接执行 · 可 revert——#101 上抛闭环）：--domain 指不存在路径 ⇒ fail-closed（原落空扫「0 悬空」假绿；域路径 = 仓根相对解析，机制不猜）。
 * 导出：main / formatReport。
 */
import { existsSync, realpathSync } from "node:fs";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DOC_CHECK_BUILTINS } from "../thincoder-core/doc-check/index.mjs";
import { checkAnchors } from "./doc-check-anchors.mjs";
import { checkParagraphs, DOC_CLASS } from "./doc-check-paragraph.mjs";

/** 判据项（D3 计数纪律：清单 = 单一数组，计数 = 列表长度——加键时改一处，计数自动同改）。 */
const CRITERIA_KEYS = ["paragraphMax", "lineMax", "paragraphExemptZones", "exemptions"];

/** 锚报告（报告段逐条 + 汇总 + 两态固定句）。
 * 逐条行族标（§4.2.9 / §4.2.10）：拟新增 / 迁移期引文 = 列报 · 不入闸；标记失据 = 违规行行尾标；
 * 标记并置 = 并置行报告面标；标记冗余 = 报告行（行式同 V5-C 宽形态行）。 */
export function formatReport(r) {
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  const out = [`机检·锚：扫描根 ${r.scanRoot} · ${r.files} 档`];
  for (const x of r.rows) {
    const fam = x.pending ? "·拟新增——列报 · 不入闸" : (x.citation ? "·迁移期引文——列报 · 不入闸" : "");
    const note = x.groundless ? "·标记失据" : (x.conflict ? "·标记并置" : "");
    out.push(`✗ ${x.file}:${x.line} ${x.anchor}（${x.clazz}${fam}${note}）`);
  }
  for (const x of r.wideRows) out.push(`报告 ${x.file}:${x.line} ${x.anchor}（${x.clazz}——报告面，不入闸）`);
  for (const x of r.redundantRows ?? []) out.push(`报告 ${x.file}:${x.line} ${x.anchor}（标记冗余——报告面，不入闸）`);
  out.push(`汇总：候选 ${sum(r.cand)} · 悬空 ${r.danglingTotal} · 注记豁免 ${sum(r.exempt)} · 拟新增 ${r.pendingTotal} · 迁移期引文 ${r.citationTotal}`);
  out.push(`  用例号：候选 ${r.cand.case} · 悬空 ${r.dang.case} · 注记豁免 ${r.exempt.case}`);
  out.push(`  路径/坐标：候选 ${r.cand.path} · 悬空 ${r.dang.path} · 注记豁免 ${r.exempt.path}`);
  out.push(`  符号·窄：候选 ${r.cand.symbol} · 悬空 ${r.dang.symbol} · 注记豁免 ${r.exempt.symbol}`);
  out.push(`  符号·宽（报告面）：候选 ${r.cand.wide} · 悬空 ${r.wideRows.length} · 注记豁免 ${r.exempt.wide}`);
  out.push(r.gate
    ? (r.danglingTotal > 0 ? `FAIL(锚): ${r.danglingTotal} 条悬空（闸态——阈值 0）` : "OK(锚): 0 条悬空（闸态——阈值 0）")
    : `报告 ${r.danglingTotal} 条（报告态——不阻断）`);
  return out;
}

/** CLI 主行程（单引擎 + 内置常量）：`--root` **必带**（零发现 ∥ 零探测——与核发现面解耦）；--domain 显式产品域；退出码 0/1。 */
export function main(argv = process.argv.slice(2), { log = console.log } = {}) {
  const argOf = (f) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
  const explicitRoot = argOf("--root");
  if (!explicitRoot) {
    log("FAIL(root): 缺 --root——显式给 --root <仓根>（机制不猜；不做发现/探测）。");
    return 1;
  }
  const root = resolve(explicitRoot);
  const domainArg = argOf("--domain");
  const base = domainArg ? resolve(root, domainArg) : root;
  if (domainArg && !existsSync(base)) {
    log(`FAIL(domain): 域路径不存在——${base}（--domain = 仓根相对路径；机制不猜，不落空扫假绿）。`);
    return 1;
  }
  log(`判据项 ${CRITERIA_KEYS.length} 项（${CRITERIA_KEYS.join(" / ")} = 工具内置常量——D3）`);
  const zones = [...DOC_CHECK_BUILTINS.paragraphExemptZones];
  const zoneNote = zones.length ? `（区带豁免在效——${zones.join(" ∥ ")}；区带内行不计入段）` : "";
  const r = checkAnchors(base, DOC_CHECK_BUILTINS, { gate: true, root });
  for (const line of formatReport(r)) log(line);
  const paragraphs = checkParagraphs({ paragraphMax: DOC_CHECK_BUILTINS.paragraphMax, lineMax: DOC_CHECK_BUILTINS.lineMax, exemptZones: zones, files: r.fileList });
  for (const h of paragraphs) log(`✗ ${h.clazz} ${relative(root, h.file).replace(/\\/g, "/")}:${h.line}`);
  const paraHits = paragraphs.filter((h) => h.clazz === DOC_CLASS.para);
  const lineHits = paragraphs.filter((h) => h.clazz === DOC_CLASS.line);
  log(paraHits.length
    ? `FAIL(${DOC_CLASS.para}): ${paraHits.length} 段——重新组织语言重写${zoneNote}。`
    : `OK(${DOC_CLASS.para}): 源域全部 .md 无该类段${zoneNote}。`);
  log(lineHits.length
    ? `FAIL(${DOC_CLASS.line}): ${lineHits.length} 行——提示词面逐行裸判。`
    : `OK(${DOC_CLASS.line}): 提示词面无单行过长。`);
  return (r.danglingTotal > 0 || paragraphs.length) ? 1 : 0;
}

const isMain = process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url;
if (isMain) process.exit(main());
