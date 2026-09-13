#!/usr/bin/env node
/**
 * doc-anchors.mjs — 文档锚一致性机检（合并仓统一版 · S4 机检单仓化——「两实现并集」单档）。
 *
 * 来源 = 两产品实现并集（CLI `thincoder/scripts/doc-anchors.mjs` + VSC `thincoder-vscode/scripts/check-doc-anchors.mjs`）；
 * 跨仓面整类退役（设计档 TWO-REPO-MERGE.md §2.4 R1–R3 / R7）：对端仓根发现（`resolvePeerRoot` 兄弟目录）·
 * 对端前缀（`PEER_PREFIX` / 排除式 5②）· 缺仓/域外口径（`domain-out`）· 对端根断言与自指防护——全数删除。
 * 两引擎一体（`--domain` 参数化）：
 *   ① **CLI 锚（V5-A 路径/坐标 · V5-B 用例号 · V5-C 符号）**——本档（判据全文见 `thincoder/docs/design/ENGINEERING-MODE.md` §2.32.3）；
 *   ② **VSC 锚（A1 用例号 / A2 符号 / A3 路径）**——`doc-anchors-core.mjs`（语义同源独立实现；本档 re-export 供两产品测试面消费）。
 * 域参数化两态：**无域参 = 全域**（仓根发现域集——两产品各按自身锚面）；产品域由门禁显式传参（`--domain thincoder-vscode`）。
 * 解析语义（§2.5）：路径 token 按**仓根相对路径**解析（合并后 `thincoder-vscode/…` 前缀自降格为仓内相对路径、
 * 无需改写）；合规形态（`路径（仓别）`——E3）在基根未命中时按**仓内其它产品域**兜底。
 * 判定单位 = 行（fenced 块整块跳过）。三锚（V5-A / V5-B / V5-C）、存在性域与解析序、注记识别、假阳类逐条排除。
 * 两态（CLI 锚）：模块常量 `V5_GATE`（`true` = 闸态）+ CLI `--v5-gate` / `--v5-report`（临时收紧 / 放宽）；
 * 判定函数接受**显式 `gate` 参数**（两态可直驱——用例与 AC 跨切换点零改）。
 * 用法：`node scripts/doc-anchors.mjs [--root <仓根>] [--domain <产品域>] [--engine v5|vsc] [--v5-gate|--v5-report] [--strict] [--json]`
 * 导出：V5_GATE / V5_SCAN_DIRS / NOTE_MARKERS / DEF_PREDICATES / extractAnchors / scanDocAnchors / formatReport / main
 * + `doc-anchors-core.mjs` 全量 re-export（checkAnchors / extractTokens / collectSourceDomain / collectCaseTitles / …）。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { discoverDomains, inCodeSpan, isExecutableLine, MERGED_SCRIPTS } from "./check-doc-width.mjs"; // 共享豁免谓词单源 + 六档并入映射
import { checkAnchors } from "./doc-anchors-core.mjs";

export * from "./doc-anchors-core.mjs";

/** 两态常量（`true` = 闸态；临时放宽经 CLI `--v5-report`——§2.32.3.5 / AC-V5-11）。 */
export const V5_GATE = true;
/** 扫描域（文档锚判定面；不含 `docs/batches`——§2.32.3.6 V3 行；不触 `_archive/`）。 */
export const V5_SCAN_DIRS = ["docs/design", "docs/requirements"];
/** 注记标记集（**闭枚举逐字**——§2.32.3.3；同行命中即通过，不做跨行语义判）。 */
export const NOTE_MARKERS = [
  "已退场", "已退役", "已废", "已废弃", "已撤", "已收窄", "退场", "退役", "已删",
  "已拆", "已清空", "已并入", "归档", "换名", "改名", "删除记录", "未恢复",
];
/** 「原…系」并档叙述（§2.32.3.3 新增条——`原`＋编号段〔字母 / 数字 / `-` / `/`〕＋`系`；射程 = 叙述位（标题 / 括注））。 */
const isLineage = (line) => { const m = /原\s*[A-Za-z0-9\-\/]+\s*系/.exec(line); return !!m && (/^#{1,6}\s/.test(line) || (/[（(][^（）()]*$/.test(line.slice(0, m.index)) && /^[^（）()]*[）)]/.test(line.slice(m.index + m[0].length)))); };
/** 定义谓词（闭枚举——V5-C 窄形态三要素之一）。 */
export const DEF_PREDICATES = ["定义于", "定义在", "声明于", "声明在", "生成点", "定义处", "唯一权威", "导出"];
const CODE_TREES = ["src", "scripts", "bin", "test"]; // 代码树（符号存在性域——§2.32.3.2）
const PLACEHOLDERS = new Set(["x", "y", "a", "b", "foo", "bar", "file", "target", "doc", "none", "example", "app", "main", "index"]); // 占位集（末段裸名——排除式 1；含通用入口名类 `app`/`main`/`index`；大小写不敏感）
const EXTS = "mjs|cjs|js|json|md|css|html|svg|yml|yaml|sh|ps1";
const PATH_RE = new RegExp( // V5-A 路径 / 坐标锚（§2.32.3.1；坐标含**行区间** `:N-M`）
  `(?<![A-Za-z0-9_.\\-\\/])((?:[A-Za-z0-9_.\\-]+\\/)*[A-Za-z0-9_.\\-]+\\.(?:${EXTS}))(?::(\\d+(?:-\\d+)?))?(?![\\w])`, "g");
/** V5-B 用例号锚（§2.32.3.1 收紧形态 + 多段号 `T-V5-12` 形态完整捕获——见档尾注）。 */
const CASE_RE = /(?<![A-Za-z0-9-])((?:T-[A-Z]{1,5}\d{1,3}(?:-\d{1,3})?|T-\d{1,3}|T[A-Z]?\d{1,3})[a-z]?(?:\.\d+)?)(?![A-Za-z0-9-])/g;
const SPAN_RE = /`([^`\n]+)`/g;
const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*$/;
const TOKEN_RE = /[A-Za-z_$][A-Za-z0-9_$.-]*/g;
/** 指针形态（`源 = …` / `删除记录 = …`——指针本体同受 V5-A 判定：注记不能拿不存在的指针当退场证据）。 */
const PTR_RE = /(?:源|删除记录)\s*=\s*`?([^\s`）)]+)`?/g;
/** 合规形态（E3）：token 后接 `（仓别）` 注记。 */
const NOTE_AFTER_RE = /^`?\s*[（(]\s*(?:CLI|VSC|对端|本仓|他仓)[^（）)]{0,10}[）)]/;
/** 排除式 5①：**`.md` token** 后接 `§N` ⇒ 归 V1（V1 只判 `.md`；非 `.md` 不豁免——照判存在性）。 */
const SECTION_AFTER_RE = /^[\s:：]*§\s*\d/;
const EXT_SEG_RE = new RegExp(`\\.(?:${EXTS})(?=\\/|$)`, "g");
const DOT_DIR_RE = /^\.[\w-][\w.-]*\//; // 排除式 2：点目录首段（`.thincoder/` / `.git/` 类）；`..` / `.` 档相对形态不在此列（解析序 ② 要用）
const SKIP_DIRS = new Set(["node_modules", ".git", "_archive", "dist", "build", "coverage", ".turbo"]);

const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };
/** 递归列文件（跳过构建 / 版本库 / 归档目录）。 */
function walk(dir, out = []) {
  let names;
  try { names = readdirSync(dir); } catch { return out; }
  for (const n of names) {
    if (SKIP_DIRS.has(n)) continue;
    const p = join(dir, n);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const addTokens = (set, text) => { for (const m of text.matchAll(TOKEN_RE)) set.add(m[0]); };
/** 符号存在性：**整标识符边界**匹配（子串匹配会把 `foo` 误判为存在于 `fooBar`——假阴面）。 */
const symbolIn = (text, id) => new RegExp(`(?<![A-Za-z0-9_$])${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9_$])`).test(text);

/** V5-B 定义面（三源任一命中即通过——§2.32.3.2）：① 各域 `test/**` 文本；② 定义位（表格首格 / 列表项首 / 粗体行首）；③ 退役登记表（表头含 `用例名`——表内任意格）。 */
function buildCaseIndex(domains) {
  const tokens = new Set();
  for (const base of domains) {
    for (const f of walk(join(base, "test"))) { if (isFile(f)) addTokens(tokens, readFileSync(f, "utf8")); }
    for (const d of ["docs/design", "docs/requirements", "docs/batches"]) {
      for (const f of walk(join(base, d))) {
        if (!f.endsWith(".md")) continue;
        let retired = false;
        for (const line of readFileSync(f, "utf8").split("\n")) {
          const cells = /^\s*\|/.test(line) ? line.replace(/^\s*\||\|\s*$/g, "").split("|") : null;
          if (cells) {
            if (/\|\s*用例名\s*\|/.test(line)) retired = true;
            addTokens(tokens, retired ? line : (cells[0] ?? ""));
            continue;
          }
          retired = false;
          const li = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
          if (li) { const first = li[1].match(TOKEN_RE); if (first) tokens.add(first[0]); continue; }
          const bold = /^\s*\*\*(.+?)\*\*/.exec(line);
          if (bold) addTokens(tokens, bold[1]);
        }
      }
    }
  }
  return tokens;
}
/** 代码树标识符集（V5-C 宽形态存在性域——四树；token + 点分段）。 */
function buildCodeIds(domains) {
  const ids = new Set();
  for (const base of domains) {
    for (const tree of CODE_TREES) {
      for (const f of walk(join(base, tree))) {
        if (!isFile(f)) continue;
        for (const m of readFileSync(f, "utf8").matchAll(TOKEN_RE)) {
          ids.add(m[0]);
          for (const s of m[0].split(".")) ids.add(s);
        }
      }
    }
  }
  return ids;
}
/** 唯一 basename 索引（解析序 ④——**域内**同名唯一命中即通过）。 */
function buildBasenames(root) {
  const m = new Map();
  for (const f of walk(root)) m.set(basename(f), (m.get(basename(f)) ?? 0) + 1);
  return m;
}

/** 反引号标识符（V5-C 抽取面——共享 `inCodeSpan` 谓词确认确在码段内）。 */
function codeSpanIdentifiers(line) {
  const out = [];
  for (const m of line.matchAll(SPAN_RE)) {
    const s = m[1].trim();
    if (!IDENT_RE.test(s) || !inCodeSpan(line, m.index + 1)) continue;
    out.push({ id: s, idx: m.index + 1 });
  }
  return out;
}
/** 指针本体区间（注记同行——指针本体**不自豁免**）。 */
function pointerRanges(line) {
  const out = [];
  for (const m of line.matchAll(PTR_RE)) out.push([m.index, m.index + m[0].length]);
  return out;
}

/** 行内三锚抽取（含射程收窄 + 排除式 1–5①——§2.32.3.1）。返回 { cases, paths, symbols, wide }。
 *  （排除式 5②「对端前缀裸直引跳判」随跨仓面退役删除——该类 token 转「仓内相对路径」照判。） */
export function extractAnchors(line) {
  const out = { cases: [], paths: [], symbols: [], wide: [] };
  for (const m of line.matchAll(CASE_RE)) {
    if (/^T\d+\.\d+$/.test(m[1])) continue; // 排除式 ②（裸 `T<数>.<数>` = 台账 / 条目号族）
    out.cases.push({ anchor: m[1], idx: m.index });
  }
  for (const m of line.matchAll(PATH_RE)) {
    const token = m[1], coord = m[2] ?? null;
    if (!coord && !token.includes("/")) continue; // 射程：裸 basename 且无坐标不判
    if (/[<>{}*?…]/.test(token)) continue; // 排除式 1（占位与通配）
    if (PLACEHOLDERS.has(basename(token).replace(/\.[A-Za-z0-9]+$/, "").toLowerCase())) continue; // 排除式 1（末段占位集）
    if (DOT_DIR_RE.test(token)) continue; // 排除式 2（运行期 / 工具面点目录——`../` 档相对形态不排除）
    if ((token.match(EXT_SEG_RE) ?? []).length >= 2) continue; // 排除式 3（组合简写 `a.md/b.md`）
    if (isExecutableLine(line)) continue; // 排除式 4（命令字面 / 搜索模式串行——共享谓词）
    const after = line.slice(m.index + m[0].length);
    if (token.endsWith(".md") && SECTION_AFTER_RE.test(after)) continue; // 排除式 5①（`.md` token 后接 `§N` ⇒ 归 V1；非 `.md` 照判）
    out.paths.push({ anchor: token + (coord ? ":" + coord : ""), token, coord, idx: m.index, note: NOTE_AFTER_RE.test(after) });
  }
  const ids = codeSpanIdentifiers(line);
  const named = ids.filter((s) => /[A-Za-z0-9]/.test(s.id)); // 占位排除：`_` 类纯装饰符非具名符号（假阳类逐条排除）
  if (named.length && DEF_PREDICATES.some((p) => line.includes(p))) { // V5-C 窄形态：三要素（标识符 + 谓词 + 唯一宿主档坐标）
    const hosts = [...new Map(out.paths.filter((p) => p.coord).map((p) => [p.token, p])).values()];
    if (hosts.length === 1) for (const s of named) out.symbols.push({ anchor: s.id, idx: s.idx, host: hosts[0].token, note: hosts[0].note });
  }
  for (const s of ids) if (s.id.length >= 5 && /[A-Z_]/.test(s.id)) out.wide.push({ anchor: s.id, idx: s.idx }); // 宽形态（报告面）
  return out;
}

/** 解析序（单仓）：① 仓根 ② 域根 ③ 本档所在目录 ④ 域别名前缀剥离 ⑤（合规形态 E3）仓内其它产品域 ⑥ 六档并入映射（旧档名 → 仓根统一版）——命中返回绝对路径。 */
function resolveFile(env, docDir, token, note = false) {
  const norm = token.replace(/\\/g, "/"), segs = norm.split("/");
  const stripped = segs[0] === basename(env.scanRoot) ? segs.slice(1).join("/") : null;
  const cands = [resolve(env.root, norm), resolve(env.scanRoot, norm), resolve(docDir, norm)];
  if (stripped) cands.push(resolve(env.scanRoot, stripped));
  if (note) for (const d of env.otherDomains) cands.push(resolve(d, norm)); // E3 合规形态跨域候选（单仓语义）
  const merged = MERGED_SCRIPTS[basename(norm)];
  if (merged) cands.push(resolve(env.root, "scripts", merged)); // 六档并入映射（退场注记语义的机器侧对位）
  return cands.find(isFile) ?? null;
}
/** V5-A 判定：`null` 通过 · `"dangling"` 悬空。 */
function pathState(env, docDir, a) {
  if (resolveFile(env, docDir, a.token, a.note)) return null;
  const n = env.basenames.get(basename(a.token)) ?? 0; // ④ 唯一 basename 索引（域内）
  if (n === 1) return null;
  if (n >= 2 && a.token.includes("/")) return null; // 多命中**且有目录前缀** ⇒ 不报（§2.32.3.2 ④）
  if ((env.repoBasenames.get(basename(a.token)) ?? 0) === 1) return null; // ⑥ 仓根唯一 basename（单仓语义——跨域唯一亦命中）
  return "dangling";
}

/** 扫描（判定函数——显式 `gate` 参数；`domain` 显式时仅扫该产品域）。 */
export function scanDocAnchors(root, { gate = V5_GATE, dirs = V5_SCAN_DIRS, domain = null } = {}) {
  const rootAbs = resolve(root);
  const domains = discoverDomains(rootAbs);
  const scanRoot = domain ? resolve(rootAbs, domain) : (domains[0] ?? rootAbs);
  const domainSet = domains.length ? domains : [rootAbs];
  const env = { root: rootAbs, scanRoot, otherDomains: domainSet.filter((d) => d !== scanRoot), basenames: buildBasenames(scanRoot), repoBasenames: buildBasenames(rootAbs) };
  const defs = buildCaseIndex(domainSet);
  const codeIds = buildCodeIds(domainSet);
  const files = [];
  for (const d of dirs) for (const f of walk(join(scanRoot, d))) if (f.endsWith(".md")) files.push(f);
  files.sort();

  const rows = [], wideRows = [];
  const cand = { case: 0, path: 0, symbol: 0, wide: 0 };
  const exempt = { case: 0, path: 0, symbol: 0, wide: 0 };
  const dang = { case: 0, path: 0, symbol: 0 };
  for (const f of files) {
    const rel = relative(scanRoot, f).replace(/\\/g, "/");
    const docDir = dirname(f);
    let fence = false;
    readFileSync(f, "utf8").split("\n").forEach((raw, i) => {
      if (/^\s*```/.test(raw)) { fence = !fence; return; }
      if (fence) return; // fenced 块整块跳过
      const line = raw;
      const marked = NOTE_MARKERS.some((m) => line.includes(m)) || isLineage(line); // 注记 / 并档叙述：粒度 = 判定行
      const ptr = pointerRanges(line);
      const free = (idx) => marked && !ptr.some((r) => idx >= r[0] && idx < r[1]);
      const push = (clazz, anchor) => rows.push({ file: rel, line: i + 1, anchor, clazz });
      const { cases, paths, symbols, wide } = extractAnchors(line);
      for (const a of cases) {
        cand.case++;
        if (free(a.idx)) { exempt.case++; continue; }
        if (defs.has(a.anchor)) continue;
        dang.case++; push("用例号", a.anchor);
      }
      for (const a of paths) {
        cand.path++;
        if (free(a.idx)) { exempt.path++; continue; }
        const st = pathState(env, docDir, a);
        if (st === null) continue;
        dang.path++; push("路径/坐标", a.anchor);
      }
      for (const a of symbols) {
        cand.symbol++;
        if (free(a.idx)) { exempt.symbol++; continue; }
        const host = resolveFile(env, docDir, a.host, a.note);
        if (!host) continue; // 宿主档缺失 ⇒ 归 V5-A 行（不重复报）
        try { if (symbolIn(readFileSync(host, "utf8"), a.anchor)) continue; } catch { continue; } // 宿主不可读 ⇒ 不可判（不抛）
        dang.symbol++; push("符号", a.anchor);
      }
      for (const a of wide) {
        cand.wide++;
        if (free(a.idx)) { exempt.wide++; continue; }
        if (codeIds.has(a.anchor)) continue;
        wideRows.push({ file: rel, line: i + 1, anchor: a.anchor, clazz: "符号·宽" });
      }
    });
  }
  return {
    gate, root: rootAbs, scanRoot, scanDirs: dirs, files: files.length,
    rows, wideRows, cand, exempt, dang,
    danglingTotal: dang.case + dang.path + dang.symbol,
  };
}

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
 *  CLI 锚两态 = `--v5-report` / `--v5-gate`（默认闸）；VSC 锚两态 = `--strict` / `V5_GATE=1`（默认报告）。 */
export function main(argv = process.argv.slice(2)) {
  const argOf = (f) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
  const root = resolve(argOf("--root") ?? process.cwd());
  const domainArg = argOf("--domain");
  const engineArg = argOf("--engine");
  const v5Gate = argv.includes("--v5-report") ? false : true; // V5 锚：默认闸（V5_GATE=true——翻转后）
  const vscGate = argv.includes("--strict") || /^(?:1|true)$/i.test(process.env.V5_GATE ?? "");
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
        console.log(JSON.stringify({ mode: res.mode, sourceDomain: res.sourceDomain, counts: res.counts, hits: res.hits }));
      } else {
        for (const h of res.hits) console.log(`✗ V5 ${h.file}:${h.line} [${h.kind}] ${h.anchor} — 期望 ${h.expect} · 实得 ${h.got}`);
        console.log(`V5: 命中 ${res.counts.total} 处 · distinct ${res.counts.distinct}（A1 ${res.counts.A1} / A2 ${res.counts.A2} / A3 ${res.counts.A3}）· ${vscGate ? "阻断态" : "报告态"}`);
        if (vscGate && res.counts.total) console.log(`FAIL(V5): 命中 ${res.counts.total} 处（阈值 0——文档锚须在册）——修掉；不得入基线（入基线 = 例外 = 违规）。`);
      }
      if (vscGate && res.counts.total) fail = 1;
    } else {
      const r = scanDocAnchors(root, { gate: v5Gate, domain: domainArg ?? (d === root ? null : relative(root, d)) });
      for (const line of formatReport(r)) console.log(line);
      if (v5Gate && r.danglingTotal > 0) fail = 1;
    }
  }
  return fail ? 1 : 0;
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) process.exit(main());

// 注（as-of 2026-09-12 实施轮）：V5-B 正则在设计 §2.32.3.1 逐字形态上补一处**多段号完整捕获**（`T-V5-12` / `T-LS-3` 类：
// `T-[A-Z]{1,5}\d{1,3}(?:-\d{1,3})?` + 收尾 `(?![A-Za-z0-9-])`）——照逐字形态该族只捕获到 `T-V5` 前缀，与同节
// 「`T-V5-*` / `T-LS*` / `T-H8` / `T-01` 类均保留」的**声明意图**相抵；既有排除面（前导 `-` / `TLS12`·`TAB123` / 裸 `T<数>.<数>`）零改。差异已上报。
