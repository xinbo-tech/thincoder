/**
 * check-ledger-core.mjs — 台账机检 · 判据核（单档扫描核 + 多档驱动）。
 *
 * 本档 = `check-ledger.mjs`（入口 / L4 定位判序 / 报告）的判据核（R24a 拆分——各档 ≤300 行）：
 * checkLedger（单档 L1–L4 判据）· loadBaseline（基线读取）· defaultEntries（单仓唯一台账默认清单）·
 * runCheck（多档驱动）。判据口径 / 豁免明细 / L4② 判序 = 入口档头注（本档不重述）。
 * 常量 / 正则 / 定位辅助（sectionNums / mdBasenames / entryKey / displayName / resolutionBases /
 * evidenceStateIn / …）驻入口档单源共享（VSC 锚引擎 `doc-anchors-core.mjs` 亦自入口档导入 evidenceState）。
 */
import { readFileSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { discoverDomains } from "./check-doc-width.mjs";
import {
  BASELINE_PATH, DECL_RE, DEFAULT_LEDGERS, ENTRY_RE, EVIDENCE_RE, EVIDENCE_RE_G, OPEN_ENTRY_RE, REF_RE,
  SCRIPT_ROOT, SIX_STATES, STATUS_RE, TRIGGERS, TRIGGER_RE, displayName, entryKey, evidenceScope,
  evidenceStateIn, hasSection, isFile, ledgerModuleFor, mdBasenames, resolutionBases, resolveDoc, sectionNums,
} from "./check-ledger.mjs";

/** 单档机检：返回违规 [{kind, line, key, msg}]。`abs` = 台账绝对路径；`root` = 所属域根；`rootBase` = 调用根（合并仓根；缺省 = 域根）。 */
export function checkLedger(abs, root, { live = true, cache = null, rootBase = null } = {}) {
  const domainRoot = resolve(root);
  const display = displayName(abs, domainRoot);
  const lines = readFileSync(abs, "utf8").split("\n");
  const bases = resolutionBases(rootBase ?? domainRoot, domainRoot, dirname(abs));
  const { scanGroups } = ledgerModuleFor(rootBase ?? domainRoot); // 产品域单源（不跨产品混用）
  const seen = new Map();
  const resolveRef = (raw) => (seen.has(raw) ? seen.get(raw) : (seen.set(raw, resolveDoc(raw, bases)), seen.get(raw)));
  const hits = [];
  const evCache = cache ?? {}; // L4② 定位缓存容器（同轮多档共享，避免重复全仓扫描）
  const rc = (evCache[domainRoot] ??= {}); // 按域根分键——多域清单下逐域独立（防计数串用）
  const add = (kind, line, keyTail, symptom, expect, got) =>
    hits.push({ kind, line, key: `${kind}|${display}|${keyTail}`, msg: `${display}:${line} [${kind.slice(0, 2)}] ${symptom} — 期望 ${expect} · 实得 ${got}` });

  // L3⑤ 活文件 `- [x]` 零命中（归档口径；归档档 `live:false` 免判——其条目本就含已完成闭环）
  if (live) lines.forEach((l, i) => {
    if (/^- \[x\]/.test(l)) add("L3⑤", i + 1, entryKey(l), "活文件含 `- [x]`（归档口径）", "0 命中（已核销 / 已废弃移入同仓 TODO-archive.md）", "1 条");
  });

  // 组扫描（L2 计数 + L3①③ 分组识别）——解析唯一实现 = 产品域 `src/ledger.mjs` `scanGroups`（数字单源 F7/AC80）
  const groups = scanGroups(lines);

  let baseNames = null;
  for (const g of groups) {
    // L2 计数一致（D3）：声明「（N 条）」== 组内未决实条目数（无声明不判）
    if (Number.isFinite(g.declared) && g.declared !== g.entries.length) {
      add("L2", g.line, g.name.replace(DECL_RE, ""), `组计数不符（${g.name}）`, `声明 ${g.declared} 条 == 组内未决条目数`, `${g.entries.length} 条`);
    }
    const isPool = g.name.includes("需求池");
    const isTech = g.name.includes("技术");
    for (const e of g.entries) {
      const key = entryKey(e.text);
      const refs = [...e.text.matchAll(REF_RE)].map((m) => ({ raw: m[1], sec: m[2] }));
      const status = (STATUS_RE.exec(e.text) ?? [])[1]?.trim() ?? null;
      // L1 指针可解析（三条子判据）
      for (const r of refs) {
        const target = resolveRef(r.raw);
        if (!target) add("L1", e.line, `${r.raw} §${r.sec}`, `指针不可解析（${r.raw} §${r.sec}）`, "档存在且节号在标题中", "unknown-doc（档不存在）");
        else if (!hasSection(sectionNums(target), r.sec)) add("L1", e.line, `${r.raw} §${r.sec}`, `指针不可解析（${r.raw} §${r.sec}）`, "节号在标题中（`§X` ↔ 标题编号 X）", "no-section（档内无该节）");
        if (!r.raw.includes("/")) {
          baseNames ??= mdBasenames(domainRoot);
          const n = baseNames.get(basename(r.raw)) ?? 0;
          if (n > 1) add("L1", e.line, `basename:${r.raw}`, `basename 多义（${r.raw}）`, "带目录前缀（仓内同名 ≥2）", `同名 ${n} 份`);
        }
      }
      // L4 本仓可解析（单仓——「仓」= 合并仓；判据 = 基根组可解析。节号存在性 = L1 面（未决条目）——L4① 只判可解析）
      for (const r of refs) {
        const target = resolveDoc(r.raw, bases);
        if (!target) add("L4", e.line, `${r.raw} §${r.sec}`, `指针本仓不可解析（${r.raw} §${r.sec}）`, "基根组（仓根 / 产品域 / 台账目录）可解析到档", "本仓不可解析");
      }
      for (const m of evidenceScope(e.text).matchAll(EVIDENCE_RE_G)) {
        const label = m[0].replace(/`/g, "");
        const p = m[0].replace(/`?\s*:\s*\d+$/, "");
        const why = evidenceStateIn(bases, domainRoot, p, rc);
        if (why) add("L4", e.line, label, `证据路径本仓不可解析（${p}）`, "本仓可定位（基根组 / 唯一 basename；越出合并仓禁）", why);
      }
      if (isPool && (lines[e.line] ?? "").trim() && !/^(#{1,6}\s|-\s\[|\||>|```|---)/.test(lines[e.line])) {
        add("L3①", e.line + 1, key, "需求池条目含续行（单行硬约束）", "一行一条", `第 ${e.line + 1} 行为续行`);
      }
      // L3④ status ∈ 六态（无 `status=` 场豁免）
      if (status && !SIX_STATES.includes(status)) add("L3④", e.line, key, "status 取值越域", `∈ {${SIX_STATES.join(" / ")}}`, status);
      if (isTech) {
        // L3② 技术组条目含 `file:line` 正则形态
        if (!EVIDENCE_RE.test(e.text)) add("L3②", e.line, key, "技术条目缺 `file:line` 证据形态", "含 file:line 正则", "未见匹配");
        // L3⑥ 触发取值合法（无 `触发=` 场 → 审计面，不判红）
        const trig = (TRIGGER_RE.exec(e.text) ?? [])[1]?.trim() ?? null;
        if (trig && !TRIGGERS.some((t) => trig === t || trig.startsWith(t + "（"))) add("L3⑥", e.line, key, "触发取值非法", `∈ {${TRIGGERS.join(" / ")}}`, trig.slice(0, 30));
      }
      // L3③ 条目锚形态与组标题结构一致（非必填态豁免）
      if ((status === "在途" || status === "待核销") && (isPool || isTech)) {
        const docRef = refs.some((r) => resolveRef(r.raw));
        const poolOk = docRef && refs.some((r) => r.raw.includes("requirements/")) && refs.some((r) => r.raw.includes("batches/"));
        const techOk = docRef || EVIDENCE_RE.test(e.text) || /(^|[·→\s])—([·\s（]|$)/.test(e.text);
        if (isPool && !poolOk) add("L3③", e.line, key, "条目锚形态与需求池组结构不符", "需求档节 + 任务书 §2", "缺 需求档节 / 任务书");
        if (isTech && !techOk) add("L3③", e.line, key, "条目锚形态与技术组结构不符", "归属档节 / 证据行", "两者皆无");
      }
    }
  }
  // L4 归档闭环条目面（`- [x]`——已核销 / 已废弃条目仍属本仓射程；L1/L3 面 = 未决条目）
  lines.forEach((l, i) => {
    if (!ENTRY_RE.test(l) || OPEN_ENTRY_RE.test(l)) return;
    for (const r of [...l.matchAll(REF_RE)].map((m) => ({ raw: m[1], sec: m[2] }))) {
      const target = resolveDoc(r.raw, bases);
      if (!target) add("L4", i + 1, `${r.raw} §${r.sec}`, `指针本仓不可解析（${r.raw} §${r.sec}）`, "基根组（仓根 / 产品域 / 台账目录）可解析到档", "本仓不可解析");
    }
    for (const m of evidenceScope(l).matchAll(EVIDENCE_RE_G)) {
      const label = m[0].replace(/`/g, "");
      const p = m[0].replace(/`?\s*:\s*\d+$/, "");
      const why = evidenceStateIn(bases, domainRoot, p, rc);
      if (why) add("L4", i + 1, label, `证据路径本仓不可解析（${p}）`, "本仓可定位（基根组 / 唯一 basename；越出合并仓禁）", why);
    }
  });
  return hits;
}

/** 读基线清单（缺失 / 损坏 → 空集 = 全部视为新增）。 */
export function loadBaseline(root) {
  try {
    const j = JSON.parse(readFileSync(resolve(root, BASELINE_PATH), "utf8"));
    return new Set(Array.isArray(j.entries) ? j.entries : []);
  } catch { return new Set(); }
}

/** 默认台账清单（单仓唯一台账——仓根 `docs/` 活档 + 归档档；两产品旧台账已随单仓化退役）。
 *  解析基 = 调用根（其下存在任一台账档）→ 本脚本所属仓根（`SCRIPT_ROOT`）——全域 / 产品域两态共用
 *  （域参不改变台账位置：单仓一账；产品门禁传参面保留）。缺档跳过不报。 */
export function defaultEntries(rootAbs) {
  const base = [rootAbs, SCRIPT_ROOT].find((b) => DEFAULT_LEDGERS.some((e) => isFile(resolve(b, e.path)))) ?? rootAbs;
  return DEFAULT_LEDGERS.map((e) => ({ path: relative(rootAbs, resolve(base, e.path)).replace(/\\/g, "/"), live: e.live }));
}

/** 多档机检：{perFile, fresh（阻断——全部违规）, baseline（基线条目——必须为空）, checked, skipped, targetPaths}。
 *  基线不再分流（B16：阈值 = 0——「入基线」已废；非空基线 = 独立 FAIL 面，见 `main`）。 */
export function runCheck({ root = process.cwd(), domain = null, ledgers = null, baseline = null } = {}) {
  const rootAbs = resolve(root);
  const entries = (ledgers ?? null)
    ? ledgers.map((p) => (typeof p === "string" ? { path: p, live: true } : p))
    : defaultEntries(rootAbs);
  const domainRoots = [...new Set(entries.map((e) => resolve(dirname(resolve(rootAbs, e.path)), "..")))];
  const baselineList = [...(baseline ?? new Set([...domainRoots, ...(domain ? [resolve(rootAbs, domain)] : discoverDomains(rootAbs))].flatMap((d) => [...loadBaseline(d)])))];
  const perFile = [], skipped = [], fresh = [];
  const evCache = {}; // L4② 定位缓存容器（同轮共享；内层按域根分键——每域全仓 basename 扫描一次）
  for (const e of entries) {
    const abs = resolve(rootAbs, e.path);
    if (!isFile(abs)) { skipped.push(abs); continue; } // 缺档 → 跳过不报（降级不阻断）
    const domainRoot = resolve(dirname(abs), "..");
    const hits = checkLedger(abs, domainRoot, { live: e.live !== false, cache: evCache, rootBase: rootAbs });
    perFile.push({ file: displayName(abs, domainRoot), hits, fresh: hits });
    fresh.push(...hits);
  }
  return { perFile, fresh, baseline: baselineList, checked: perFile.length, skipped, targetPaths: entries.map((e) => resolve(rootAbs, e.path)) };
}
