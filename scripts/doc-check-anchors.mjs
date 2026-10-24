/**
 * doc-check-anchors.mjs — M8 单锚引擎（机检：文档锚一致性）。
 * 权威设计 = M8 机检引擎模块设计（ENGINEERING-MODE-V2-MODULE-MACHINE-CHECK）§2.2 · 判据权威 = DOC-DISCIPLINE §4（单一权威源）；本档 = 双引擎（V5 + VSC）收敛后的单引擎。
 * 2026-10-22（FR42 · 工程工具面）：参数面改读**内置常量**（`thincoder-core/doc-check/index.mjs` 的
 *   `DOC_CHECK_BUILTINS`——`exemptions` 恒空）· 删 manifest 读取（`scanDocAnchors` 入口随之退场）·
 *   解析序收两级（域根 ∥ 声明根两支退场——裸名不跨目录解析，与产品引擎同口径）。
 * 三类锚（判定单位 = 行；fenced 块整块跳过）：
 *   用例号：T-… 形态（右界强制）；在册判据 = test 树文本 ∪ 用例注册标题 ∪ 档内定义位——
 *     test 树 = 域根下全部 `test` 树（全深走 · 目录名判；§4.2.2）。
 *   路径/坐标：路径 token（可带坐标尾 :N / :N-M / :N/:M 并列组——坐标尾不参与存在性判、
 *     仅紧邻 token 生效、无路径的裸坐标不成锚）；存在性 = 解析序（仓根 → 本档目录）——
 *     **无 basename 索引**：裸名不跨目录解析（与产品引擎同口径）。
 *   符号：反引号标识符 + 定义谓词（闭枚举 13 词——窄形态）；路径形态码段（含 `/`）不产锚；
 *     宽形态仅报告（不入闸）。
 * 注记豁免：注记标记集（闭枚举）+ 并档叙述 + 内置豁免表（恒空）——命中即过。
 * 两族行标记（生效面 = 仅路径/坐标锚）：「（拟新增」（§4.2.9 · 前向引用）+「迁移期引文」
 *   （§4.2.10 · 后视引用 = 标记 + 史实谓词 + 悬空三合一）——列报 · 不入闸；失据照红 / 冗余出报告行。
  * 共享谓词单源：isExecutableLine / inCodeSpan = doc-check-paragraph.mjs；采集面 = doc-check-targets.mjs。
 * 导出：checkAnchors / extractAnchors / resolveFile / pathState / codeSpanIdentifiers / pointerRanges。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { inCodeSpan, isExecutableLine } from "./doc-check-paragraph.mjs";
import { collectCaseTitles, collectCodeTokens, collectTestTrees } from "./doc-check-targets.mjs";

/** 注记标记集（闭枚举——DOC-DISCIPLINE §4.2.3）：行含任一标记 ⇒ 整行过。 */
const NOTE_MARKERS = ["本机检注记", "机检豁免", "旧档豁免", "既往披露", "历史豁免", "存量豁免", "豁免说明", "引用豁免", "豁免登记", "机检豁免锚", "镜像豁免", "已入基线豁免", "豁免前提", "前提豁免"];

/** 并档叙述（§4.2.3.4）：叙述已并入他档 / 存档，本档只承载引用。 */
const isLineage = (l) => /(?:已经|已|现已)并入/.test(l) && /（(?:见|参看|详见|指向|承载于)/.test(l);

/** 定义谓词（符号·窄 §4.2.4.3 · 闭枚举 13 词）：窄形态 = 谓词 + 恰一个宿主坐标 + 反引号标识符。
 *  `在` / `见␣` 已删（2026-09-18 判据面批：高频词无宿主指向语义——185 条悬空全由这两词触发）。 */
const DEF_PREDICATES = ["定义于", "定义在", "声明于", "声明在", "生成点", "定义处", "唯一权威", "导出", "位于", "定义见", "实现见", "详见", "见其"];

/** 占位类：仅当 basename 形态命中（与候选一致、非判定依据）。
 *  `x` / `b` = 单字母示意名（`docs/batches/x.md` / `a/b.mjs` 族——doc 抽取示例专用；2026-10-15 清账轮 3 扩面——#1407①：示意名误报 21 条，父侧直接执行 · 可 revert）。 */
const PLACEHOLDERS = new Set(["placeholder", "yourfile", "your-file", "example", "your-module", "your-directory", "stub", "x", "b"]);

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
/** 指针形（v1 整形抽取复原 · I14 · #677）：`源 =` ∕ `删除记录 =` 后随 token 整体区间——指针本体不入自由豁免面（注记不得以悬空指针为据）。 */
const PTR_FORM_RE = /(?:源|删除记录)\s*=\s*/g;
const SECTION_AFTER_RE = /#(?:[A-Za-z0-9_-]+|L\d+)/;
const EXT_SEG_RE = /[A-Za-z0-9_-]+\./g;
const DOT_DIR_RE = /(?:^|\/)\.[^\/]/;
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".turbo", ".thincoder", "_archive"]);
/** 台账两档（L 专判面迁 M2 SQLite——不入机检源域；档名判，无路径硬编码）。 */
const LEDGER_NAMES = new Set(["TODO.md", "TODO-archive.md"]);

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
    if (SKIP_DIRS.has(n) || n.startsWith("dist-")) continue;
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
export function codeSpanIdentifiers(line) {
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

/** 行内指针坐标区间（自由豁免射程）。v1 整形抽取复原（I14）：`源 =` ∕ `删除记录 =` 后随 token 覆盖（指针本体受 V5-A 判定）；片段命中同取整体区间（勿退化为 `:NN` 零长）。 */
export function pointerRanges(line) {
  const out = [];
  for (const m of line.matchAll(PTR_FORM_RE)) {
    const rest = line.slice(m.index + m[0].length);
    const t = /^\s*(\S+)/.exec(rest);
    if (t) out.push([m.index, m.index + m[0].length + t[0].length]);
  }
  for (const m of line.matchAll(PTR_RE)) out.push([m.index, m.index + m[0].length]);
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
    if ((token.match(EXT_SEG_RE) ?? []).length >= 2) continue; // 多扩展段（模式串）——声明源前缀面随声明根一支退场（FR42）
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

/** 路径解析序（§4.2.4.2 · 两级）：① 仓根相对全路径 → ② 本档目录相对。零命中 ⇒ null（裸名不跨目录解析）。 */
export function resolveFile(env, docDir, token) {
  const norm = token.replace(/\\/g, "/");
  return [resolve(env.root, norm), resolve(docDir, norm)].find(isFile) ?? null;
}

/** 路径状态（挂靠 §4.2.4.2 两级）：可解析 → null；否则悬空。
 *  **不查 basename 索引**：唯一同名不能证明指的是哪一档（跨目录裸名解析就是全域索引的老病）。 */
export function pathState(env, docDir, a) {
  return resolveFile(env, docDir, a.token) ? null : "dangling";
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

/** 引擎内核（单引擎）：源域 = 给定根的 .md 全集（零声明面）→ 逐行三类锚判 + 注记豁免 + 拟新增计数。 */
function runScan(base, builtins, { gate = true, root = base } = {}) {
  const rootAbs = resolve(root);
  const baseAbs = resolve(base);
  const exemptions = builtins.exemptions ?? [];
  const files = walk(baseAbs).filter((f) => f.endsWith(".md") && !LEDGER_NAMES.has(basename(f))).sort();
  const env = { root: rootAbs };
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
        const st = pathState(env, docDir, a);
        if (st === null) {
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
    gate, root: rootAbs, scanRoot: baseAbs, fileList: files, files: files.length,
    rows, wideRows, redundantRows, cand, exempt, dang, pendingTotal, citationTotal,
    danglingTotal: dang.case + dang.path + dang.symbol,
  };
}

/** 引擎入口（单引擎——M8 模块设计 §2.2 数据流）：checkAnchors(扫描根, 内置常量) → 统一结果。 */
export function checkAnchors(domain, builtins, { gate = true, root = domain } = {}) {
  return runScan(domain, builtins, { gate, root });
}
