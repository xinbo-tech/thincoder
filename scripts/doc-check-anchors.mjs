/**
 * doc-check-anchors.mjs — M8 单锚引擎（机检：文档锚一致性）。
 * 权威设计 = M8 机检引擎模块设计（ENGINEERING-MODE-V2-MODULE-MACHINE-CHECK）§2.2 · 判据权威 = DOC-DISCIPLINE §4（单一权威源）；本档 = 双引擎（V5 + VSC）收敛后的单引擎。
 * 收敛落点（KD-M8-3 / KD-M8-4）：
 *   - 判据读声明面：扫描目录 = checkConfig.scanDirs；锚域 = checkConfig.anchors.domain；
 *     豁免段 = checkConfig.anchors.exclude；行级豁免串 = checkConfig.exemptions（空表 = 惰性）。
 *   - 砍：参照历史面豁免族（REF_DOC_TREES）· 六档并入映射（MERGED_SCRIPTS）· V3 历史常量——全数删除，不保留。
 * 三类锚（判定单位 = 行；fenced 块整块跳过）：
 *   用例号：T-… 形态（右界强制）；在册判据 = test 树文本 ∪ 用例注册标题 ∪ 档内定义位——
 *     test 树 = 域根下全部 `test` 树（全深走 · 目录名判；§4.2.2）。
 *   路径/坐标：路径 token（可带坐标尾 :N / :N-M / :N/:M 并列组——坐标尾不参与存在性判、
 *     仅紧邻 token 生效、无路径的裸坐标不成锚）；存在性 = 解析序（仓根 → 锚域根 → 本档目录 →
 *     锚域前缀剥离）+ 唯一 basename 索引（域内 / 仓根）。
 *   符号：反引号标识符 + 定义谓词（闭枚举 13 词——窄形态）；路径形态码段（含 `/`）不产锚；
 *     宽形态仅报告（不入闸）。
 * 注记豁免：注记标记集（闭枚举）+ 并档叙述 + 声明面 exemptions（行级）——命中即过。
 * 两族行标记（生效面 = 仅路径/坐标锚）：「（拟新增」（§4.2.9 · 前向引用）+「（迁移期引文」
 *   （§4.2.10 · 后视引用 = 标记 + 史实谓词 + 悬空三合一）——列报 · 不入闸；失据照红 / 冗余出报告行。
 * 共享谓词单源：isExecutableLine / inCodeSpan = doc-check-width.mjs；采集面 = doc-check-targets.mjs。
 * 导出：checkAnchors / extractAnchors / scanDocAnchors。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { readManifest } from "../thincoder-core/manifest.mjs";
import { inCodeSpan, isExecutableLine } from "./doc-check-width.mjs";
import { collectCaseTitles, collectCodeTokens, collectSourceDomain, collectTestTrees } from "./doc-check-targets.mjs";

/** 注记标记集（闭枚举——DOC-DISCIPLINE §4.2.3）：行含任一标记 ⇒ 整行过。 */
const NOTE_MARKERS = ["本机检注记", "机检豁免", "旧档豁免", "既往披露", "历史豁免", "存量豁免", "豁免说明", "引用豁免", "豁免登记", "机检豁免锚", "镜像豁免", "已入基线豁免", "豁免前提", "前提豁免"];

/** 并档叙述（§4.2.3.4）：叙述已并入他档 / 存档，本档只承载引用。 */
const isLineage = (l) => /(?:已经|已|现已)并入/.test(l) && /（(?:见|参看|详见|指向|承载于)/.test(l);

/** 定义谓词（符号·窄 §4.2.4.3 · 闭枚举 13 词）：窄形态 = 谓词 + 恰一个宿主坐标 + 反引号标识符。
 *  `在` / `见␣` 已删（2026-09-18 判据面批：高频词无宿主指向语义——185 条悬空全由这两词触发）。 */
const DEF_PREDICATES = ["定义于", "定义在", "声明于", "声明在", "生成点", "定义处", "唯一权威", "导出", "位于", "定义见", "实现见", "详见", "见其"];

/** 占位类：仅当 basename 形态命中（与候选一致、非判定依据）。 */
const PLACEHOLDERS = new Set(["placeholder", "yourfile", "your-file", "example", "your-module", "your-directory", "stub"]);

const EXTS = "mjs|cjs|js|json|md|css|html|svg|yml|yaml|sh|ps1";
// 右界守卫转义须单层（源串 "(?![\\w])" ⇒ 正则源 (?!\w)）；双转义 ⇒ 「字面反斜杠 / 字面 w」二字符类、守卫失效
// ⇒ `…/package.json` 被交替序 `js` 先命中截为 `…/package.js`（§4.2.1 实现口径——2026-09-18 判据面批）。
// 左界守卫补 `@`（2026-09-20 小债批 §2.1 条 2——`@scope/pkg/x.mjs` 包规格形不应抽为仓内路径 token；父侧直接执行 · 可 revert）
const PATH_RE = new RegExp("(?<![A-Za-z0-9_.\\-\\\\/@])((?:[A-Za-z0-9_.\\-]+\\/)*[A-Za-z0-9_.\\-]+\\.(?:" + EXTS + "))(?::(\\d+(?:-\\d+)?)(?:\\/:\\d+(?:-\\d+)?)*)?(?![\\w])", "g");
const CASE_RE = /(?<![A-Za-z0-9-])((?:T-[A-Z]{1,5}\d{1,3}(?:-\d{1,3})?|T-\d{1,3}|T[A-Z]?\d{1,3})[a-z]?(?:\.\d+)?)(?![A-Za-z0-9-])/g;
const SPAN_RE = /`([^`\n]+)`/g;
const IDENT_RE = /[A-Za-z_$][A-Za-z0-9_$]*/g;
const TOKEN_RE = /[A-Za-z0-9_.\-]+\/[A-Za-z0-9_.\-\/]*|[A-Za-z0-9_\-]+/g;
const PTR_RE = /file:(\d+)|file:(\d+)\s*[-~]\s*(\d+)|:(\d+)/g;
const SECTION_AFTER_RE = /#(?:[A-Za-z0-9_-]+|L\d+)/;
const EXT_SEG_RE = /[A-Za-z0-9_-]+\./g;
const DOT_DIR_RE = /(?:^|\/)\.[^\/]/;
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".turbo", ".thincoder", "_archive"]);

/** 两族行标记（§4.2.9 / §4.2.10 · 全角括号逐字前缀——闭枚举；标记内插格式符即不再匹配）。 */
const NEW_MARKER = "（拟新增";
const CITATION_MARKER = "（迁移期引文";
/** 史实谓词（§4.2.10 · 闭枚举 19 词）：迁移期引文行须同行含其一，方为「有据」。 */
const HISTORY_PREDICATES = ["已删", "已迁", "已并入", "退场", "退役", "已废", "改名", "换名", "归档", "已拆", "已清空", "已收窄", "原旁路档", "旧档", "旧址", "对端", "镜像", "迁核", "进核"];

const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };

/** 递归列全文件（SKIP_DIRS 排除）。 */
function walk(dir, out = []) {
  let names = [];
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

/** 文本 token 集（词界分割——TOKEN_RE 全局分词）。 */
function addTokens(set, text) {
  for (const m of text.matchAll(TOKEN_RE)) set.add(m[0]);
}

/** 标识符在文本内存在（词界判，t 为纯 token）。 */
function symbolIn(text, t) {
  const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(?<![A-Za-z0-9_$])" + esc + "(?![A-Za-z0-9_$])").test(text);
}

/** token 在标题集内存在（词界判）。 */
function tokenIn(list, t) {
  const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("(?<![A-Za-z0-9_-])" + esc + "(?![A-Za-z0-9_-])");
  return list.some((s) => re.test(s));
}

/** 行内反引号码段（跨段单段内代码串连读）；路径形态码段（含 `/`）不产符号锚（§4.2.1 V5-C——窄宽同法）。 */
function codeSpanIdentifiers(line) {
  const out = [];
  for (const m of line.matchAll(SPAN_RE)) {
    const span = m[1];
    if (span.includes("/")) continue; // 路径形态码段：该段已由路径面判，不重复报行
    const off = m.index + 1;
    for (const id of span.matchAll(IDENT_RE)) {
      const at = off + id.index;
      if (!inCodeSpan(line, at)) continue;
      out.push({ id: id[0], idx: at });
    }
  }
  return out;
}

/** 行内指针坐标区间（自由豁免射程）。 */
function pointerRanges(line) {
  const out = [];
  for (const m of line.matchAll(PTR_RE)) {
    const body = m[0].split(/:\s*/)[0] ?? m[0];
    out.push([m.index, m.index + body.length]);
  }
  return out;
}

/**
 * 三类锚提取（判定单位 = 行）：用例号 = CASE_RE 右界强制；路径 = PATH_RE（无坐标且无分隔符→不收；
 * 坐标尾 :N/:N-M/并列组——token 独立成锚、坐标不判存在、仅紧邻生效）；符号 = 窄（谓词+恰一宿主+标识符）
 * 与宽（报告面）。fenced 块由调用方整块跳过。
 * 标识符来源 = 非路径形态码段（§4.2.1 V5-C）：路径形态码段切出的段名（`thincoder` / `core` / `tools`）不入集。
 */
export function extractAnchors(line) {
  const out = { cases: [], paths: [], symbols: [], wide: [] };
  for (const m of line.matchAll(CASE_RE)) {
    if (/^T\d+\.\d+$/.test(m[1])) continue; // 版本号形态（如 T1.12）非用例号
    out.cases.push({ anchor: m[1], idx: m.index });
  }
  for (const m of line.matchAll(PATH_RE)) {
    const token = m[1], coord = m[2] ?? null;
    if (!coord && !token.includes("/")) continue; // 纯文件名不显式锚定（右界保字面）
    if (/[<>{}*?…]/.test(token)) continue; // 元字符 = 模式串，不判
    if (PLACEHOLDERS.has(basename(token).replace(/\.[A-Za-z0-9]+$/, "").toLowerCase())) continue;
    if (DOT_DIR_RE.test(token)) continue; // 隐含目录
    if ((token.match(EXT_SEG_RE) ?? []).length >= 2) continue; // 多扩展段（模式串）
    if (isExecutableLine(line)) continue; // 命令 / 搜索模式串码段保字面
    const after = line.slice(m.index + m[0].length);
    if (token.endsWith(".md") && SECTION_AFTER_RE.test(after)) continue; // 小节引用（页面锚，非路径锚）
    out.paths.push({ anchor: token + (coord ? ":" + coord : ""), token, coord, idx: m.index });
  }
  const ids = codeSpanIdentifiers(line);
  const named = ids.filter((s) => /[A-Za-z0-9]/.test(s.id));
  if (named.length && DEF_PREDICATES.some((p) => line.includes(p))) {
    const hosts = [...new Map(out.paths.filter((p) => p.coord).map((p) => [p.token, p])).values()];
    if (hosts.length === 1) for (const s of named) out.symbols.push({ anchor: s.id, idx: s.idx, host: hosts[0].token });
  }
  for (const s of ids) if (s.id.length >= 5 && /[A-Z_]/.test(s.id)) out.wide.push({ anchor: s.id, idx: s.idx });
  return out;
}

/** 路径解析序（§4.2.4.2）：仓根 → 锚域根 → 本档目录 → 锚域前缀剥离。 */
function resolveFile(env, docDir, token) {
  const norm = token.replace(/\\/g, "/"), segs = norm.split("/");
  const stripped = segs[0] === basename(env.anchorRoot) ? segs.slice(1).join("/") : null;
  const cands = [resolve(env.root, norm), resolve(env.anchorRoot, norm), resolve(docDir, norm)];
  if (stripped) cands.push(resolve(env.anchorRoot, stripped));
  return cands.find(isFile) ?? null;
}

/** 路径状态（挂靠 §4.2.4.2 ①-⑥）：可解析 → null；唯一 basename（域内 / 仓根）→ null；否则悬空。 */
function pathState(env, docDir, a) {
  if (resolveFile(env, docDir, a.token)) return null;
  const n = env.basenames.get(basename(a.token)) ?? 0;
  if (n === 1) return null;
  if (n >= 2 && a.token.includes("/")) return null;
  if ((env.repoBasenames.get(basename(a.token)) ?? 0) === 1) return null;
  return "dangling";
}

/** 用例号在册判据（§4.2.3.1 ①②③）：test 树文本 ∪ 档内定义位（表格首格 / 列表首 token / 粗体起始）。 */
function buildCaseIndex(base, files) {
  const tokens = new Set();
  for (const tree of collectTestTrees(base)) {
    for (const f of walk(tree)) {
      if (!isFile(f)) continue;
      let text = "";
      try { text = readFileSync(f, "utf8"); } catch { continue; }
      addTokens(tokens, text);
    }
  }
  for (const f of files) {
    let retired = false;
    let text = "";
    try { text = readFileSync(f, "utf8"); } catch { continue; }
    for (const line of text.split("\n")) {
      const cells = /^\s*\|/.test(line) ? line.replace(/^\s*\||\|\s*$/g, "").split("|") : null;
      if (cells) {
        if (/\|\s*用例名\s*\|/.test(line)) retired = true;
        addTokens(tokens, retired ? line : (cells[0] ?? ""));
        continue;
      }
      retired = false;
      const li = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
      if (li) {
        const first = li[1].match(TOKEN_RE);
        if (first) tokens.add(first[0]);
        continue;
      }
      const bold = /^\s*\*\*(.+?)\*\*/.exec(line);
      if (bold) addTokens(tokens, bold[1]);
    }
  }
  return tokens;
}

/** 域内唯一 basename 索引。 */
function buildBasenames(root) {
  const m = new Map();
  for (const f of walk(root)) m.set(basename(f), (m.get(basename(f)) ?? 0) + 1);
  return m;
}

/** 引擎内核（单引擎）：源域 = collectSourceDomain（声明面）→ 逐行三类锚判 + 注记豁免 + 拟新增计数。 */
function runScan(base, cfg, { gate = true, root = base } = {}) {
  const rootAbs = resolve(root);
  const baseAbs = resolve(base);
  const anchorRoot = resolve(baseAbs, cfg.anchors.domain);
  const exclude = cfg.anchors.exclude ?? [];
  const exemptions = cfg.exemptions ?? [];
  const files = collectSourceDomain(baseAbs, cfg.scanDirs, exclude);
  const env = {
    root: rootAbs,
    anchorRoot,
    basenames: buildBasenames(anchorRoot),
    repoBasenames: buildBasenames(rootAbs),
  };
  const defs = buildCaseIndex(baseAbs, files);
  const titles = collectCaseTitles(baseAbs);
  const codeIds = collectCodeTokens(baseAbs);
  const rows = [], wideRows = [], redundantRows = [];
  const cand = { case: 0, path: 0, symbol: 0, wide: 0 };
  const exempt = { case: 0, path: 0, symbol: 0, wide: 0 };
  const dang = { case: 0, path: 0, symbol: 0 };
  let pendingTotal = 0, citationTotal = 0;
  for (const f of files) {
    const rel = relative(baseAbs, f).replace(/\\/g, "/");
    const docDir = dirname(f);
    let fence = false;
    let text = "";
    try { text = readFileSync(f, "utf8"); } catch { continue; }
    text.split("\n").forEach((line, i) => {
      if (/^\s*```/.test(line)) { fence = !fence; return; }
      if (fence) return;
      const marked = NOTE_MARKERS.some((m) => line.includes(m)) || isLineage(line) || exemptions.some((e) => line.includes(e));
      const ptr = pointerRanges(line);
      const free = (idx) => marked && !ptr.some((r) => idx >= r[0] && idx < r[1]);
      const push = (clazz, anchor, extra = null) => rows.push({ file: rel, line: i + 1, anchor, clazz, ...(extra ?? {}) });
      // 两族标记（§4.2.9 / §4.2.10）：判定单位 = 行；生效面 = 仅 V5-A（下方路径循环内消费）。
      const newMarked = line.includes(NEW_MARKER);
      const citeMarked = line.includes(CITATION_MARKER);
      const citeHist = citeMarked && HISTORY_PREDICATES.some((p) => line.includes(p));
      const { cases, paths, symbols, wide } = extractAnchors(line);
      for (const a of cases) {
        cand.case++;
        if (free(a.idx)) { exempt.case++; continue; }
        if (defs.has(a.anchor) || tokenIn(titles, a.anchor)) continue;
        dang.case++; push("用例号", a.anchor);
      }
      for (const a of paths) {
        cand.path++;
        if (free(a.idx)) { exempt.path++; continue; }
        if (pathState(env, docDir, a) === null) {
          // §4.2.10「标记冗余」（报告面 · 不入闸）：① 标记在场 ∧ 无 ② 史实谓词 ∧ 锚可解析（无红可言）
          if (citeMarked && !citeHist) redundantRows.push({ file: rel, line: i + 1, anchor: a.anchor, clazz: "标记冗余" });
          continue;
        }
        if (newMarked) {
          // §4.2.9：前向优先——与「迁移期引文」并置时按本族计入 + 报告面标「标记并置」
          pendingTotal++;
          push("路径/坐标", a.anchor, { pending: true, ...(citeMarked ? { conflict: true } : {}) });
          continue;
        }
        if (citeMarked && citeHist) { citationTotal++; push("路径/坐标", a.anchor, { citation: true }); continue; }
        dang.path++; // 无标记照红；① ∧ 无 ② ∧ ③ 悬空 ⇒ 照红 + 行尾标「标记失据」
        push("路径/坐标", a.anchor, citeMarked ? { groundless: true } : null);
      }
      for (const a of symbols) {
        cand.symbol++;
        if (free(a.idx)) { exempt.symbol++; continue; }
        const host = resolveFile(env, docDir, a.host);
        if (!host) continue;
        let hostText = "";
        try { hostText = readFileSync(host, "utf8"); } catch { continue; }
        if (symbolIn(hostText, a.anchor)) continue;
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
    gate, root: rootAbs, scanRoot: baseAbs, scanDirs: cfg.scanDirs, files: files.length,
    rows, wideRows, redundantRows, cand, exempt, dang, pendingTotal, citationTotal,
    danglingTotal: dang.case + dang.path + dang.symbol,
  };
}

/** 引擎入口（单引擎——M8 模块设计 §2.2 数据流）：checkAnchors(域, checkConfig) → 统一结果。 */
export function checkAnchors(domain, checkConfig, { gate = true, root = domain } = {}) {
  return runScan(domain, checkConfig, { gate, root });
}

/** 兼容入口（声明面）：scanDocAnchors(仓根, {gate, domain})——判据读 manifest checkConfig（fail-closed）。 */
export function scanDocAnchors(root, { gate = true, domain = null } = {}) {
  const rootAbs = resolve(root);
  const base = domain ? resolve(rootAbs, domain) : rootAbs;
  const read = readManifest(rootAbs);
  if (!read.ok) {
    throw new Error("scanDocAnchors: manifest 不可读——" + (read.reason ?? read.errors.join("；")) + "（fail-closed，不静默 fallback）");
  }
  return runScan(base, read.manifest.checkConfig, { gate, root: rootAbs });
}
