#!/usr/bin/env node
/**
 * check-ledger.mjs — 需求池 / 技术待办台账机检（FR18 #6——设计档 §2.24.6 / §2.24.9 契约）。
 * L1 指针可解析（①归一 `§X` ↔ 标题编号 X ②basename 唯一 ③档存在且节号在标题里）· L2 组计数 == 未决实条目数（D3）·
 * L3 形态：①需求池条目单行 ②技术条目含 `file:line` 形态 ③锚形态与组标题结构一致 ④`status=` ∈ 六态
 * ⑤活文件 `- [x]` 零命中（归档口径）⑥`触发=` ∈ 三枚举。**只判形态**——症状 / 归属语义留评审。
 * L4 本仓可解析（FR25/R4——跨仓登记闸）：①指针 `X.md §N` 以**本仓根 + 台账目录**为基根解析（档 + 节号；**不含**工作区根 / 兄弟仓——不复用 `refBases`）
 * ②证据 `path.ext:line` 的路径段须在**本仓根**内为现存文件。不可解析 ⇒ `[L4]` + fail-closed（L1–L3 判据语义零改）。
 * L4 不入判据（零假阳）：无路径散文 /「名称（仓别）§N」规范形态（无 `.md`）/ 组标题行。
 * 豁免（零假阳）：非必填态（待讨论 / 待设计）不判 ③；无 `status=` / `触发=` 场分别免 ④ / ⑥（后者进审计面）；无标记组不判 ③。
 * 基线：`test/fixtures/ledger-baseline.json` 内为存量违规（降报告、不阻断）；新增违规阻断（退出码 1）。
 * 输出：红 = `<档>:<行号> [L1|L2|L3] <症状> — 期望 … · 实得 …` + `<n> 处违规`；绿 = 每档一行 `OK: <档>`。
 * 审计（`--audit`）：技术组无触发条目的「待处置清单」（行龄 > N 天标「老化」）——只读、退出码 0。
 * 汇总（`--summary`）：L2 明细行序列（每项目一行——`src/ledger.mjs` 口径 + 同 formatter）——只读、退出码 0（收口行）。
 * 用法：`node scripts/check-ledger.mjs [--root <仓根>] [--ledger <档>]... [--audit] [--summary] [--days N]`；
 * 扫描域 = 显式台账清单（默认**只含本仓** `docs/TODO.md`——跨仓扫描面与「跨仓登记」同病）——与 `check-doc-width.mjs` 互不侵入；不进产品提示词。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
// 数字单源（F7/AC80）：解析 / 计数 / 老化阈值 / 显示面 formatter 消费 `src/ledger.mjs`（L1–L3 语义零改）
import { AGING_DAYS, blameAges, discoverFamily, EMPTY_FAMILY_LINE, formatDetailLine, scanGroups, summarizeLedger } from "../src/ledger.mjs";
/** 状态机六态（需求档 §1.13） */
export const SIX_STATES = ["待讨论", "待设计", "在途", "待核销", "已核销", "已废弃"];
/** 触发字段三枚举（§2.24.9②） */
export const TRIGGERS = ["归批", "条件", "认账不排期"];
/** 老化阈值（天）——单源 = `src/ledger.mjs`（`--days` 可覆盖） */
export { AGING_DAYS };
/** 基线档（存量违规报告清单；键稳定、不含行号） */
export const BASELINE_PATH = "test/fixtures/ledger-baseline.json";
export const DEFAULT_LEDGERS = ["docs/TODO.md"]; // 默认台账清单：只扫本仓（L4/R1——检查器不扫对端仓；缺则跳过不报）
const ENTRY_RE = /^- \[[ x]\]\s+/, OPEN_ENTRY_RE = /^- \[ \]\s+/; // 任意锚（条目键 / 全档扫）/ 未决条目（组计数——§2.24.4 未决口径）
const DECL_RE = /（(\d+)\s*条）/;
const H2_RE = /^##\s+(.*)$/;
const EVIDENCE_RE = /[A-Za-z0-9_./-]+\.[A-Za-z0-9]+`?\s*:\s*\d+/;
const EVIDENCE_RE_G = new RegExp(EVIDENCE_RE.source, "g"); // L4② 逐条 matchAll 用（既有 EVIDENCE_RE 非全局——L3② `.test` 语义零改）
const REF_RE = /([A-Za-z0-9_./-]+(?:\.md|\/[A-Za-z0-9_.-]+))`?\s*§\s*(\d+(?:\.\d+)*)/g;
const TRIGGER_RE = /触发\s*=\s*([^·\n]*)/;
const STATUS_RE = /status=([^·\n（(]*)/;
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".turbo"]);
const SIBLING_NAMES = ["thincoder", "thincoder-vscode"]; // 兄弟仓族（跨仓引用 CLI ↔ VSC）
/** 标题编号集合（`## 1.13 x` / `### §2.24 x`；`### 18.5` 满足父节号 `§18`）。 */
function sectionNums(file) {
  const out = new Set();
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = /^#{1,6}\s+(.*)$/.exec(line);
    if (!m) continue;
    for (const re of [/^§?\s*(\d+(?:\.\d+)*)\b/, /§\s*(\d+(?:\.\d+)*)/]) {
      const a = re.exec(m[1]);
      if (a) out.add(a[1]);
    }
  }
  return out;
}
const hasSection = (nums, n) => nums.has(n) || [...nums].some((x) => x.startsWith(n + "."));
/** 引用解析基根：仓根 + 台账同目录 + 工作区根 + 兄弟仓族 + 本次运行各台账所属仓根（只认两仓族——不做工作区全目录扫描）。 */
export function refBases(root, ledgerDir, extra = []) {
  const ws = resolve(root, "..");
  return [...new Set([root, ledgerDir, ws, ...SIBLING_NAMES.map((n) => join(ws, n)), ...extra])];
}
/** 档引用解析（搜索序见上）；命中返回绝对路径，否则 null。 */
function resolveDoc(p, bases) {
  for (const b of bases) {
    for (const c of [resolve(b, p), p.endsWith(".md") ? null : resolve(b, p + ".md")]) {
      if (!c) continue;
      try { if (statSync(c).isFile()) return c; } catch { /* 下一候选 */ }
    }
  }
  return null;
}
/** L4 包含判据：`abs` 在本仓根内（`..` 逃逸 / 跨盘 → false）。 */
function withinRoot(root, abs) {
  const rel = relative(root, abs);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}
/** L4①：本仓基根档解析（root + 台账目录——**不含**工作区根 / 兄弟仓；与 L1 `resolveDoc` 的 `refBases` 分离）。 */
function l4ResolveDoc(root, bases, p) {
  for (const b of bases) {
    for (const c of [resolve(b, p), p.endsWith(".md") ? null : resolve(b, p + ".md")]) {
      if (!c || !withinRoot(root, c)) continue;
      try { if (statSync(c).isFile()) return c; } catch { /* 下一候选 */ }
    }
  }
  return null;
}
/** L4②：证据路径段须在本仓根内为现存文件（`..` 逃逸即不可解析）。 */
function inRepoFile(root, p) {
  const abs = resolve(root, p);
  if (!withinRoot(root, abs)) return false;
  try { return statSync(abs).isFile(); } catch { return false; }
}
/** 仓内 `.md` basename 计数（L1②：只写 basename 时同名 ≥2 即多义）。 */
function mdBasenames(root, out = new Map()) {
  for (const name of readdirSync(root)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(root, name);
    try { if (statSync(p).isDirectory()) mdBasenames(p, out); else if (name.endsWith(".md")) out.set(name, (out.get(name) ?? 0) + 1); } catch { /* 跳过 */ }
  }
  return out;
}
/** 条目键（基线键用——稳定、不含行号）：首个 `**…**` 标题的首分句。 */
export function entryKey(text) {
  const m = /\*\*(.+?)\*\*/.exec(text);
  return ((m ? m[1] : text.replace(ENTRY_RE, "")).split(/[（(：:——]/)[0].trim() || text).slice(0, 40);
}
/** 档显示名（仓目录名 + 仓内相对路径——不随 cwd 漂移）。 */
export const displayName = (abs, root) => basename(root) + "/" + relative(root, abs).replace(/\\/g, "/");

/** 单档机检：返回违规 [{kind, line, key, msg}]。`abs` = 台账绝对路径；`root` = 所属仓根。 */
export function checkLedger(abs, root, extraRoots = []) {
  const display = displayName(abs, root);
  const lines = readFileSync(abs, "utf8").split("\n");
  const bases = refBases(root, dirname(abs), extraRoots);
  const seen = new Map();
  const resolveRef = (raw) => (seen.has(raw) ? seen.get(raw) : (seen.set(raw, resolveDoc(raw, bases)), seen.get(raw)));
  const hits = [];
  const add = (kind, line, keyTail, symptom, expect, got) =>
    hits.push({ kind, line, key: `${kind}|${display}|${keyTail}`, msg: `${display}:${line} [${kind.slice(0, 2)}] ${symptom} — 期望 ${expect} · 实得 ${got}` });

  // L3⑤ 活文件 `- [x]` 零命中（归档口径）
  lines.forEach((l, i) => {
    if (/^- \[x\]/.test(l)) add("L3⑤", i + 1, entryKey(l), "活文件含 `- [x]`（归档口径）", "0 命中（已核销 / 已废弃移入同仓 TODO-archive.md）", "1 条");
  });

  // 组扫描（L2 计数 + L3①③ 分组识别）——解析唯一实现 = `src/ledger.mjs` `scanGroups`（数字单源 F7/AC80）
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
          baseNames ??= mdBasenames(root);
          const n = baseNames.get(basename(r.raw)) ?? 0;
          if (n > 1) add("L1", e.line, `basename:${r.raw}`, `basename 多义（${r.raw}）`, "带目录前缀（仓内同名 ≥2）", `同名 ${n} 份`);
        }
      }
      // L4 本仓可解析（FR25/R4——跨仓登记闸；判据 = 设计档 `docs/design/LEDGER-SELF-CONTAINED.md` §7）
      // 基根 = 本仓根 + 台账目录（**不含**工作区根 / 兄弟仓——显式不复用 L1 的 `refBases`，两者语义独立）
      for (const r of refs) {
        const target = l4ResolveDoc(root, [root, dirname(abs)], r.raw);
        if (!target) add("L4", e.line, `${r.raw} §${r.sec}`, `指针本仓不可解析（${r.raw} §${r.sec}）`, "本仓根 / 台账目录为基根可解析到档", "本仓不可解析");
        else if (!hasSection(sectionNums(target), r.sec)) add("L4", e.line, `${r.raw} §${r.sec}`, `指针本仓不可解析（${r.raw} §${r.sec}）`, "本仓档内节号在标题中", "本仓无该节");
      }
      for (const m of e.text.matchAll(EVIDENCE_RE_G)) {
        const label = m[0].replace(/`/g, "");
        const p = m[0].replace(/`?\s*:\s*\d+$/, "");
        if (!inRepoFile(root, p)) add("L4", e.line, label, `证据路径本仓不可解析（${p}）`, "本仓根内为现存文件", "本仓不可解析");
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
  return hits;
}

/** 读基线清单（缺失 / 损坏 → 空集 = 全部视为新增）。 */
export function loadBaseline(root) {
  try {
    const j = JSON.parse(readFileSync(resolve(root, BASELINE_PATH), "utf8"));
    return new Set(Array.isArray(j.entries) ? j.entries : []);
  } catch { return new Set(); }
}

/** 多档机检 + 基线分流：{perFile, fresh（阻断）, known（存量降报告）, checked, skipped}。 */
export function runCheck({ root = process.cwd(), ledgers = null, baseline = null } = {}) {
  const targetPaths = (ledgers ?? DEFAULT_LEDGERS).map((p) => resolve(root, p));
  const base = baseline ?? loadBaseline(root);
  const perFile = [], skipped = [], fresh = [], known = [], roots = new Set();
  for (const abs of targetPaths) { try { if (statSync(abs).isFile()) roots.add(resolve(dirname(abs), "..")); } catch { /* 缺目录 */ } }
  for (const abs of targetPaths) {
    let ok = false;
    try { ok = statSync(abs).isFile(); } catch { /* 缺目录 / 不可读 */ }
    if (!ok) { skipped.push(abs); continue; } // 对端仓缺失 / 本仓缺目录 → 跳过不报（降级不阻断）
    const repoRoot = resolve(dirname(abs), "..");
    const hits = checkLedger(abs, repoRoot, [...roots].filter((r) => r !== repoRoot));
    const f = hits.filter((v) => !base.has(v.key));
    const k = hits.filter((v) => base.has(v.key));
    perFile.push({ file: displayName(abs, repoRoot), hits, fresh: f, known: k });
    fresh.push(...f), known.push(...k);
  }
  return { perFile, fresh, known, checked: perFile.length, skipped, targetPaths };
}

/** 行龄（天）：git blame 行级最近变更时间；非 git / 不可判定 → null（标「年龄未知」，零假阳降级）。 */
export function blameDays(abs, line) {
  try {
    const out = execFileSync("git", ["blame", "--porcelain", "-L", `${line},${line}`, "--", abs], { cwd: dirname(abs), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const m = /^author-time (\d+)$/m.exec(out);
    return m ? (Date.now() / 1000 - Number(m[1])) / 86400 : null;
  } catch { return null; }
}

/** 审计（只读）：技术组无触发条目清单（`ageOf` 可注入以便确定性用例）。 */
export function collectPending(abs, { days = AGING_DAYS, ageOf = blameDays } = {}) {
  const display = displayName(abs, resolve(dirname(abs), ".."));
  const out = [];
  let isTech = false;
  readFileSync(abs, "utf8").split("\n").forEach((l, i) => {
    const h = H2_RE.exec(l);
    if (h) { isTech = h[1].includes("技术"); return; }
    if (!isTech || !OPEN_ENTRY_RE.test(l) || TRIGGER_RE.test(l)) return; // 有触发场 → 不属「待处置」；只列未决条目
    const age = ageOf(abs, i + 1);
    out.push({ file: display, line: i + 1, title: entryKey(l), ageDays: age, aged: age != null && age > days });
  });
  return out;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
/** CLI 主行程（导出以便用例在进程内断言退出码语义；`node scripts/check-ledger.mjs` 走此路）。 */
export function main(args = process.argv.slice(2), { cwd = process.cwd(), log = console.log } = {}) {
  const argOf = (f) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : null; };
  const root = resolve(argOf("--root") ?? cwd);
  const ledgers = args.flatMap((a, i) => (a === "--ledger" && args[i + 1] ? [args[i + 1]] : []));
  const ledgerNames = ledgers.length ? ledgers : DEFAULT_LEDGERS;
  if (args.includes("--summary")) { // 汇总面（收口行 F6——只读）：L2 明细行序列（每项目一行）
    const family = discoverFamily(root);
    const rows = [];
    for (const p of family.projects) {
      try { rows.push(formatDetailLine(summarizeLedger(p, { ageOf: blameAges }))); } catch { /* 不可读 → 跳过（N1） */ }
    }
    for (const r of rows) log(r);
    if (!rows.length) log(EMPTY_FAMILY_LINE);
    return 0;
  }
  if (args.includes("--audit")) { // 审计模式：只读，退出码 0
    const days = argOf("--days") ? Number(argOf("--days")) : AGING_DAYS;
    const pending = [];
    for (const p of ledgerNames) {
      const abs = resolve(root, p);
      try { if (statSync(abs).isFile()) pending.push(...collectPending(abs, { days })); } catch { /* 跳过 */ }
    }
    log("待处置清单（技术组无触发条目——报告只读，处置要人判）：");
    for (const r of pending) {
      const age = r.ageDays == null ? "年龄未知" : `行龄 ${Math.floor(r.ageDays)} 天${r.aged ? "【老化】" : ""}`;
      log(`  ${r.file}:${r.line} ${age} — ${r.title}`);
    }
    log(`合计 ${pending.length} 条（老化 ${pending.filter((r) => r.aged).length} 条）。`);
    return 0;
  }
  const { perFile, fresh, known, skipped } = runCheck({ root, ledgers: ledgerNames });
  for (const abs of skipped) log(`SKIP: ${relative(root, abs)}（不可读——跳过不报）`);
  for (const f of perFile) {
    for (const v of f.fresh) log(v.msg); // 红：<档>:<行号> [L1|L2|L3] <症状> — 期望 … · 实得 …
    if (!f.fresh.length) log(`OK: ${f.file}`);
  }
  for (const v of known) log(`· 存量（基线内——降报告，不阻断）：${v.msg}`);
  if (fresh.length || known.length) log(`${fresh.length} 处违规（新增——阻断）+ ${known.length} 处存量（基线内——降报告）。`);
  return fresh.length ? 1 : 0;
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) process.exit(main());
