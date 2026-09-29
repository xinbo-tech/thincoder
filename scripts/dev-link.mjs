#!/usr/bin/env node
/**
 * dev-link.mjs — dev 链（`<产品>/node_modules/@thincoder/*`）规范形工具（2026-09-29 批 · 台账 #577）。
 *
 * 背景（#577 路径盘符族 · 修产生方 ∕ 模块解析面零改）：Windows 下 junction 目标串 = **创建时原样
 * 存储**——`npm link` 的目标拼写随调用进程 cwd 拼写漂（收敛前本机实测：vsc ∕ desktop 链落 `D:\…`、
 * cli 链落 `d:\…`）；Node 模块恒等 = 解析 URL 串恒等 ⇒ 同一文件经两种盘符拼写的链载入 = 两个
 * 模块实例（`===` false）。本工具 = 链产生 ∕ 判面的**确定性规范形**：规范 target =
 * `realpathSync.native` 输出（盘符大写 + 真大小写 + `\` 分隔；陷阱实读：`.native` 面折叠盘符
 * 大小写，JS 面 `realpathSync` 保留输入拼写——故必须用 `.native`）。
 *
 * 覆盖面 = 五链（三个产品 × 各自 `package.json` 的 `@thincoder/*` 依赖声明）：target 派生规则 =
 * 声明 × 仓内兄弟目录（`@thincoder/<n>` → `<仓根>/thincoder-<n>`，读回该目录 `package.json.name`
 * 逐字对账；兄弟目录缺位 / 对账失败 ⇒ 报错跳过，不建悬空链）——与现存链无关 ⇒ 缺失链可判 ∕ 可建。
 *
 * 类（class）：ok 规范 · case-variant 同路径异拼写 · wrong-target 异路径 · missing 缺失 ·
 * materialized 物化副本（真目录——缺省不替换；`RELEASE.md` §5.3 物化纪律）。
 * 判定面 = win32 开发链（junction 目标为绝对串）；非 win32（`"dir"` symlink——npm 相对目标形态）不入判定。
 * 用法：node scripts/dev-link.mjs [--check] [--json] [--force]
 *   缺省      apply：missing ⇒ 建 ∕ case-variant ∕ wrong-target ⇒ 修（重建规范链）∕ ok ⇒ no-op ∕
 *             materialized ⇒ 跳过报出；退出码 0 = 终态全规范 ∕ 1 = 有未收敛 ∕ 2 = 参数错。
 *   --check   只读判：逐链报类；退出码 0 = 全规范 ∕ 1 = 漂移。
 *   --json    只读（同 --check 判定）：stdout 输出契约 `{ links: [{ product, link, target, class }], ok }`。
 *   --force   仅 apply 面、仅 materialized 类：允许替换真目录（破坏性——显式；本批不入判据）。
 * 零依赖（全 `node:` 面）；纯函数面（classify ∕ canonicalTarget）可直测（批内件 T4 ∕ T6）。
 */
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, realpathSync, rmSync, symlinkSync, unlinkSync } from "node:fs";
import { dirname, join, posix, resolve, win32 } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** 产品目录（覆盖面宿主——五链 = cli:core ∕ vsc:core+render-core ∕ desktop:core+render-core）。 */
const PRODUCTS = ["thincoder-cli", "thincoder-vscode", "thincoder-desktop"];

const USAGE = "用法：node scripts/dev-link.mjs [--check] [--json] [--force]";
const CLASS_LABEL = { ok: "规范", "case-variant": "同路径异拼写", "wrong-target": "异路径", missing: "缺失", materialized: "物化副本" };

/** 仓根（工具住所的父目录——`<仓根>/scripts/dev-link.mjs`；native 规范化，判据基座）。 */
export function repoRoot() {
  return realpathSync.native(fileURLToPath(new URL("..", import.meta.url)));
}

/** 同路径比较折叠（仅用于比较，不改写 target）：win32 = 分隔符归一 + 小写（盘符 / 段大小写不敏感）；其余 = 原样。 */
const fold = process.platform === "win32"
  ? (s) => win32.normalize(s).toLowerCase()
  : (s) => posix.normalize(s);

/** 规范形 target（单一产生口）：`realpathSync.native(resolve(p))`——盘符大写 + 真大小写 + `\` 分隔。 */
export function canonicalTarget(p) {
  return realpathSync.native(resolve(p));
}

/** 链面分类（纯函数——fs 观测面以入参显式给出，判据可直测）。
 *  @param {{present: boolean, isLink: boolean, stored: string|null}} obs 观测（present=链位存在；
 *         isLink=lstat.isSymbolicLink()；stored=readlink 已存 target 串）
 *  @param {string} canonical 规范形 target
 *  @returns {"ok"|"case-variant"|"wrong-target"|"missing"|"materialized"} */
export function classify(obs, canonical) {
  if (!obs.present) return "missing";
  if (!obs.isLink) return "materialized";
  if (obs.stored === canonical) return "ok";
  return fold(obs.stored) === fold(canonical) ? "case-variant" : "wrong-target";
}

/** 链位观测（fs 面——lstat ∕ readlink；链位缺位 = ENOENT ⇒ present:false）。 */
function observe(link) {
  let st;
  try { st = lstatSync(link); } catch (e) {
    if (e.code === "ENOENT") return { present: false, isLink: false, stored: null };
    throw e;
  }
  if (!st.isSymbolicLink()) return { present: true, isLink: false, stored: null };
  return { present: true, isLink: true, stored: readlinkSync(link) };
}

/** 五链计划（target 派生 ∕ 与现存链无关）：产品 `package.json` 声明 × 仓内兄弟目录（`thincoder-<n>`；
 *  读回 `package.json.name` 逐字对账）——缺位 ∕ 读取解析失败 ∕ 对账失败 ⇒ 入 errors 并跳过（不建悬空链）。 */
export function planLinks(root) {
  const entries = [];
  const errors = [];
  for (const product of PRODUCTS) {
    const pkgPath = join(root, product, "package.json");
    if (!existsSync(pkgPath)) { errors.push(`${product}/package.json 缺位——跳过（${pkgPath}）`); continue; }
    let deps;
    try {
      deps = Object.keys(JSON.parse(readFileSync(pkgPath, "utf8")).dependencies ?? {})
        .filter((n) => n.startsWith("@thincoder/"));
    } catch (e) {
      errors.push(`${product}/package.json 读取 ∕ 解析失败（${e.code ?? e.message}）——跳过`);
      continue;
    }
    for (const dep of deps) {
      const short = dep.slice("@thincoder/".length);
      const sibling = join(root, `thincoder-${short}`);
      if (!existsSync(sibling)) { errors.push(`${product}: ${dep} 兄弟目录缺位（thincoder-${short}）——跳过`); continue; }
      let name;
      try {
        name = JSON.parse(readFileSync(join(sibling, "package.json"), "utf8")).name;
      } catch (e) {
        errors.push(`${product}: ${dep} 对账读取失败（thincoder-${short}/package.json——${e.code ?? e.message}）——跳过`);
        continue;
      }
      if (name !== dep) { errors.push(`${product}: ${dep} 对账失败（thincoder-${short}/package.json = ${name}）——跳过`); continue; }
      entries.push({ product, link: join(root, product, "node_modules", "@thincoder", short), target: canonicalTarget(sibling) });
    }
  }
  return { entries, errors };
}

/** 只读判定（`--check` ∕ `--json` 同面）：逐链 class + ok（errors 非空 ⇒ 恒 false）。 */
export function checkLinks(root) {
  const { entries, errors } = planLinks(root);
  const links = entries.map((e) => ({ product: e.product, link: e.link, target: e.target, class: classify(observe(e.link), e.target) }));
  return { links, errors, ok: errors.length === 0 && links.every((l) => l.class === "ok") };
}

/** 建 ∕ 修链（重建规范链）：删旧链位（若在）→ 父目录确保 → `symlinkSync(target, link, "junction")`
 *  （win32 外 = `"dir"`）。target 原样存储 ⇒ 规范形可确成。 */
function relink(link, target) {
  mkdirSync(dirname(link), { recursive: true });
  try { unlinkSync(link); } catch (e) { if (e.code !== "ENOENT") throw e; }
  symlinkSync(target, link, process.platform === "win32" ? "junction" : "dir");
}

/** apply：missing ⇒ 建 ∕ case-variant ∕ wrong-target ⇒ 修 ∕ ok ⇒ no-op ∕ materialized ⇒ 跳过
 *  （`--force` 才替换真目录——破坏性、显式）。返回逐链动作 + 终态判定（判定面同 checkLinks 形）。 */
export function applyLinks(root, { force = false } = {}) {
  const { entries, errors } = planLinks(root);
  const actions = [];
  for (const e of entries) {
    const before = classify(observe(e.link), e.target);
    let action = "noop";
    if (before === "missing") { relink(e.link, e.target); action = "created"; }
    else if (before === "case-variant" || before === "wrong-target") { relink(e.link, e.target); action = "repaired"; }
    else if (before === "materialized" && force) { rmSync(e.link, { recursive: true, force: true }); relink(e.link, e.target); action = "replaced"; }
    else if (before === "materialized") action = "skipped";
    actions.push({ product: e.product, link: e.link, target: e.target, before, action, after: classify(observe(e.link), e.target) });
  }
  const links = actions.map((a) => ({ product: a.product, link: a.link, target: a.target, class: a.after }));
  return { actions, links, errors, ok: errors.length === 0 && links.every((l) => l.class === "ok") };
}

/** CLI 主行程：`--check` ∕ `--json` = 只读判定；缺省 = apply；退出码 0 ∕ 1（判定）/ 2（参数）。 */
export function main(argv = process.argv.slice(2), { log = console.log, errorLog = console.error } = {}) {
  const known = new Set(["--check", "--json", "--force"]);
  const unknown = argv.filter((a) => !known.has(a));
  if (unknown.length) { errorLog(`dev-link: 未知参数 ${unknown.join(" ")}`); errorLog(USAGE); return 2; }
  const flags = new Set(argv);
  const readonly = flags.has("--check") || flags.has("--json");
  if (readonly && flags.has("--force")) { errorLog("dev-link: --force 仅 apply 面；--check ∕ --json 为只读判定。"); errorLog(USAGE); return 2; }
  const root = repoRoot();
  const rel = (p) => p.slice(root.length + 1);
  if (readonly) {
    const r = checkLinks(root);
    for (const e of r.errors) errorLog(`dev-link: ${e}`);
    if (flags.has("--json")) log(JSON.stringify({ links: r.links, ok: r.ok }));
    else {
      log(`dev-link --check · 仓根 = ${root}`);
      for (const l of r.links) log(`  [${l.class}·${CLASS_LABEL[l.class]}] ${l.product} ${rel(l.link)}`);
      log(`共 ${r.links.length} 链：${r.links.filter((l) => l.class === "ok").length} 规范 ∕ ${r.links.filter((l) => l.class !== "ok").length} 漂移${r.errors.length ? ` · ${r.errors.length} 跳过` : ""}`);
    }
    return r.ok ? 0 : 1;
  }
  const r = applyLinks(root, { force: flags.has("--force") });
  for (const e of r.errors) errorLog(`dev-link: ${e}`);
  log(`dev-link（apply）· 仓根 = ${root}`);
  for (const a of r.actions) log(`  [${a.action}] ${a.product} ${rel(a.link)}（${a.before} → ${a.after}）`);
  log(`共 ${r.links.length} 链：终态 ${r.links.filter((l) => l.class === "ok").length} 规范 ∕ ${r.links.filter((l) => l.class !== "ok").length} 未收敛${r.errors.length ? ` · ${r.errors.length} 跳过` : ""}`);
  return r.ok ? 0 : 1;
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) process.exit(main());
