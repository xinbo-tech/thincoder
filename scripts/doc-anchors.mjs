#!/usr/bin/env node
/**
 * doc-anchors.mjs — 文档锚一致性机检 · 入口 / 域驱动 / 报告（合并仓统一版 · S4 机检单仓化）。
 *
 * 结构（R24a 拆分——各档 ≤300 行）：
 *   ① 本档 = 入口 / 域驱动 / 报告（`main` + `formatReport`）+ 家族全量 re-export（对外导入面不变）；
 *   ② `doc-anchors-v5.mjs` = V5 锚引擎（CLI 锚：V5-A 路径/坐标 · V5-B 用例号 · V5-C 符号——判据全文
 *      见 `thincoder/docs/design/ENGINEERING-MODE.md` §2.32.3）；
 *   ③ `doc-anchors-core.mjs` = VSC 锚引擎（A1 用例号 / A2 符号 / A3 路径——判据权威 =
 *      `thincoder-vscode/docs/design/DOC-CODE-RECONCILE.md` §4）；
 *   ④ `doc-anchors-targets.mjs` = 采集面（源域 + 在册判据域）。
 * 来源 = 两产品实现并集（CLI `thincoder/scripts/doc-anchors.mjs` + VSC `thincoder-vscode/scripts/check-doc-anchors.mjs`）；
 * 跨仓面整类退役（设计档 TWO-REPO-MERGE.md §2.4 R1–R3 / R7）：对端仓根发现（兄弟目录循环）·
 * 对端前缀判据与排除式 5② · 缺仓/域外口径 · 对端根断言与自指防护——全数删除（旧判据符号零留存）。
 * 两引擎一体（`--domain` 参数化）：**无域参 = 全域**（仓根发现域集——两产品各按自身锚面）；产品域由门禁显式传参。
 * 解析语义（§2.5）：路径 token 按**仓根相对路径**解析（合并后 `thincoder-vscode/…` 前缀自降格为仓内相对路径、
 * 无需改写）；合规形态（`路径（仓别）`——E3）在基根未命中时按**仓内其它产品域**兜底。
 * 判定单位 = 行（fenced 块整块跳过）。两态（CLI 锚）：模块常量 `V5_GATE`（`true` = 闸态）+
 * CLI `--v5-gate` / `--v5-report`（临时收紧 / 放宽）；判定函数接受**显式 `gate` 参数**（两态可直驱——用例与 AC 跨切换点零改）。
 * 用法：`node scripts/doc-anchors.mjs [--root <仓根>] [--domain <产品域>] [--engine v5|vsc] [--v5-gate|--v5-report] [--strict] [--json]`
 * 进程内直驱动契约（VSC 锚原契约沿用——两产品测试面消费）：`main(argv, { cwd, log, env })`——
 * `cwd` = 默认根 · `log` = 输出出口（默认 `console.log`）· `env` = 环境面（默认 `process.env`——`V5_GATE` 读自其中）。
 * 导出：main / formatReport + 三档全量 re-export（V5_GATE / V5_SCAN_DIRS / NOTE_MARKERS / DEF_PREDICATES /
 * extractAnchors / scanDocAnchors + checkAnchors / extractTokens / collectSourceDomain / collectCaseTitles / …）。
 */
import { basename, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { discoverDomains } from "./check-doc-width.mjs";
import { checkAnchors } from "./doc-anchors-core.mjs";
import { scanDocAnchors } from "./doc-anchors-v5.mjs";

export * from "./doc-anchors-core.mjs";
export * from "./doc-anchors-v5.mjs";
export * from "./doc-anchors-targets.mjs";

/** 输出（报告段逐条 + 汇总四数 / 各类计数 + 两态固定句——§2.32.3.5 / AC-V5-7）。 */
export function formatReport(r) {
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  const out = [`V5 文档锚一致性：扫描域 ${r.scanDirs.join(" + ")} · ${r.files} 档`];
  for (const x of r.rows) out.push(`报告(V5): ${x.file}:${x.line} ${x.anchor}（${x.clazz}）`);
  for (const x of r.wideRows) out.push(`报告(V5): ${x.file}:${x.line} ${x.anchor}（${x.clazz}——报告面，不入闸）`);
  out.push(`V5 汇总：候选 ${sum(r.cand)} · 悬空 ${r.danglingTotal} · 注记豁免 ${sum(r.exempt)}`);
  out.push(`  用例号（V5-B）：候选 ${r.cand.case} · 悬空 ${r.dang.case} · 注记豁免 ${r.exempt.case}`);
  out.push(`  路径/坐标（V5-A）：候选 ${r.cand.path} · 悬空 ${r.dang.path} · 注记豁免 ${r.exempt.path}`);
  out.push(`  符号·窄（V5-C）：候选 ${r.cand.symbol} · 悬空 ${r.dang.symbol} · 注记豁免 ${r.exempt.symbol}`);
  out.push(`  符号·宽（V5-C 报告面——不入闸）：候选 ${r.cand.wide} · 悬空 ${r.wideRows.length} · 注记豁免 ${r.exempt.wide}`);
  out.push(r.gate ? (r.danglingTotal > 0 ? `FAIL(V5): ${r.danglingTotal} 条悬空锚（闸态——阈值 0）` : "OK(V5): 0 条悬空锚（闸态——阈值 0）") : `V5 报告 ${r.danglingTotal} 条（报告态——不阻断）`);
  return out;
}

/** CLI 主行程（域驱动）：无域参 = 全域（各域按自身锚面）；`--domain` 显式产品域。
 *  CLI 锚两态 = `--v5-report` / `--v5-gate`（默认闸）；VSC 锚两态 = `--strict` / `V5_GATE=1`（默认报告）。
 *  进程内直驱动：`opts = { cwd, log, env }`（VSC 锚原契约沿用——测试面以 `log` 收集输出 / `env` 注入 `V5_GATE`）。 */
export function main(argv = process.argv.slice(2), { cwd = process.cwd(), log = console.log, env = process.env } = {}) {
  const argOf = (f) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
  const root = resolve(argOf("--root") ?? cwd);
  const domainArg = argOf("--domain");
  const engineArg = argOf("--engine");
  const v5Gate = argv.includes("--v5-report") ? false : true; // V5 锚：默认闸（V5_GATE=true——翻转后）
  const vscGate = argv.includes("--strict") || /^(?:1|true)$/i.test(env.V5_GATE ?? "");
  const all = discoverDomains(root);
  const list = domainArg ? [resolve(root, domainArg)] : (all.length ? all : [root]);
  const codeRoots = all.length ? all : [root];
  const repoNames = [...new Set(codeRoots.map((d) => basename(d)))];
  let fail = 0;
  for (const d of list) {
    const engine = engineArg ?? (basename(d) === "thincoder-vscode" ? "vsc" : "v5"); // 域表（`--engine` 可显式覆盖）
    if (engine === "vsc") {
      const res = checkAnchors({ root: d, mode: vscGate ? "strict" : "report", codeRoots, repoNames, repoRoot: root });
      if (argv.includes("--json")) {
        // `--json` 公共契约（VSC 锚原契约沿用）：hits 逐条投影为五字段（expect / got 仅入文本面）
        const hits = res.hits.map((h) => ({ file: h.file, line: h.line, kind: h.kind, anchor: h.anchor, symptom: h.symptom }));
        log(JSON.stringify({ mode: res.mode, sourceDomain: res.sourceDomain, counts: res.counts, hits }));
      } else {
        for (const h of res.hits) log(`✗ V5 ${h.file}:${h.line} [${h.kind}] ${h.anchor} — 期望 ${h.expect} · 实得 ${h.got}`);
        log(`V5: 命中 ${res.counts.total} 处 · distinct ${res.counts.distinct}（A1 ${res.counts.A1} / A2 ${res.counts.A2} / A3 ${res.counts.A3}）· ${vscGate ? "阻断态" : "报告态"}`);
        if (vscGate && res.counts.total) log(`FAIL(V5): 命中 ${res.counts.total} 处（阈值 0——文档锚须在册）——修掉；不得入基线（入基线 = 例外 = 违规）。`);
      }
      if (vscGate && res.counts.total) fail = 1;
    } else {
      const r = scanDocAnchors(root, { gate: v5Gate, domain: domainArg ?? (d === root ? null : relative(root, d)) });
      for (const line of formatReport(r)) log(line);
      if (v5Gate && r.danglingTotal > 0) fail = 1;
    }
  }
  return fail ? 1 : 0;
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) process.exit(main());
