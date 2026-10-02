/**
 * manifest-discovery.mjs — **发现 ∕ 归属族**出档（2026-09-29 structure-split-2 · 台账 #620）：自 `manifest.mjs`
 * 全量迁出〔原 `:39-143`〕——`MANIFEST_REL` · 测试注入位（`_setProjectRootForTest` / `_resetProjectRootForTest`）·
 * `scanChildren`（两条梯表共用 walk 内核）· `discoverProjects`（项目梯）· `discoverRepos`（仓梯）·
 * `owningProject`（归属形）· `resolveProjectRoot`（归属 ∨ 发现）；**结构拆分零语义**（面不变 ∕ 判据不变，
 * 只换宿主档；切点 ∕ 缝单源 = 批档 `docs/batches/2026-09-29-structure-split-2.md` §2.2-C）。
 *
 * 缝 = 同名再出口：宿主 `manifest.mjs` 转口本档七名既有导出（消费者 import 面零改）；宿主自用四名
 * （`MANIFEST_REL` ∥ `discoverProjects` ∥ `owningProject` ∥ `resolveProjectRoot`）随 import。
 * 零环：本档不引宿主（方向单行）；档外依赖 = `node:fs` ∥ `node:path`；机制详述 = `docs/core/design/MANIFEST.md` §2.2 / §2.9。
 */
import { existsSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

/** 数据档文件名（**每个项目一份**——项目根 = 带档目录；**git 非前提**。2026-09-17 / 2026-09-21 用户裁定）。 */
export const MANIFEST_REL = "PROJECT-MANIFEST.json"
/** 测试注入：强制项目根（测试 tmp 非 git 仓——同 ledger `_setLedgerDirForTest` 先例）。 */
let _projectRootOverride = null
export function _setProjectRootForTest(dir) { _projectRootOverride = dir }
export function _resetProjectRootForTest() { _projectRootOverride = null }

/**
 * 一层扫描内核（**模块私有**——两条梯表共用；KD-M1-23 / 设计 §2.2「单源结构」）：枚举锚的
 * **直接子目录**一层（不递归）+ 按名排序 + 谓词过滤 ⇒ 命中表（绝对路径）。
 * 全档唯一 `readdirSync` 落点（结构机判 T54）；锚不可读 ⇒ `[]`（不抛——调用方按「零命中」处置）。
 * @param {string} anchor 锚绝对路径
 * @param {(dir:string)=>boolean} isHit 子目录谓词
 * @returns {string[]} 命中子目录绝对路径（按名排序）
 */
function scanChildren(anchor, isHit) {
  try {
    return readdirSync(anchor, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
      .map((e) => join(anchor, e))
      .filter(isHit)
  } catch { return [] }
}

/**
 * **项目发现**（项目梯五级——KD-M1-23 / 设计 `docs/core/design/MANIFEST.md` §2.2；**git 非前提**，
 * 2026-09-21 用户裁定）：① 锚自身带 `MANIFEST_REL` ⇒ 锚；② 锚含 `.git` ⇒ 锚（缺档 = 建档机会）；
 * ③ 直接子目录中**带档**者优先（非空即只看此级：恰一 ⇒ `unique` / ≥2 ⇒ `ambiguous`）；
 * ④ 零带档才看含 `.git` 的**裸仓**（同判）；⑤ 均无 ⇒ `none`（⇒ 建档流，落点 = 会话锚）。
 * `candidates` 一律**按名排序**（`self` / `none` ⇒ `[]`）；`matched` ∈ `manifest` / `git` / `null`
 * 记命中（或歧义）出自哪一级。**纯 fs**（只判存在性——不解析档内容）· **不抛** · **不向上** · **不递归**。
 * **覆盖位**（`_setProjectRootForTest` 在场）⇒ **头部短路**（测试注入面——先于真判据，同 `discoverRepos`）。
 * @param {string} [cwd] 会话锚（缺省 → 进程 cwd）
 * @returns {{kind:'self'|'unique'|'none'|'ambiguous', root:string|null, candidates:string[], matched:'manifest'|'git'|null}}
 */
export function discoverProjects(cwd) {
  if (_projectRootOverride) return { kind: "self", root: resolve(_projectRootOverride), candidates: [], matched: null }
  const anchor = resolve(cwd ?? ".")
  if (existsSync(join(anchor, MANIFEST_REL))) return { kind: "self", root: anchor, candidates: [], matched: "manifest" }
  if (existsSync(join(anchor, ".git"))) return { kind: "self", root: anchor, candidates: [], matched: "git" }
  const withManifest = scanChildren(anchor, (d) => existsSync(join(d, MANIFEST_REL)))
  if (withManifest.length > 1) return { kind: "ambiguous", root: null, candidates: withManifest, matched: "manifest" }
  if (withManifest.length === 1) return { kind: "unique", root: withManifest[0], candidates: [...withManifest], matched: "manifest" }
  const bareRepos = scanChildren(anchor, (d) => existsSync(join(d, ".git")))
  if (bareRepos.length > 1) return { kind: "ambiguous", root: null, candidates: bareRepos, matched: "git" }
  if (bareRepos.length === 1) return { kind: "unique", root: bareRepos[0], candidates: [...bareRepos], matched: "git" }
  return { kind: "none", root: null, candidates: [], matched: null }
}

/**
 * **仓发现**（仓梯——KD-M1-23 / `docs/core/design/TOOLS.md` §6.13；**单源** KD-M1-22——`git` 工具
 * 经此符号接线，禁第二份实现）：① 锚含 `.git` ⇒ 锚；② 直接子目录中 `.git` **∧** 带档者恰一 ⇒ 命中
 * （≥2 ⇒ 歧义）；③ **零个此类时才看**含 `.git` 的裸仓（恰一 ⇒ 命中 / ≥2 ⇒ 歧义）；④ 均无 ⇒ `none`。
 * 与 `discoverProjects` = **同一 walk 内核**（`scanChildren`）的两种梯表——差异只在谓词与级序。
 * `candidates` 按名排序；`matched` 记档位；纯 fs / 不抛 / 不递归 / 不向上；覆盖位 ⇒ 头部短路。
 * @param {string} [cwd] 会话锚（缺省 → 进程 cwd）
 * @returns {{kind:'self'|'unique'|'none'|'ambiguous', root:string|null, candidates:string[], matched:'manifest'|'git'|null}}
 */
export function discoverRepos(cwd) {
  if (_projectRootOverride) return { kind: "self", root: resolve(_projectRootOverride), candidates: [], matched: null }
  const anchor = resolve(cwd ?? ".")
  if (existsSync(join(anchor, ".git"))) return { kind: "self", root: anchor, candidates: [], matched: "git" }
  const scoped = scanChildren(anchor, (d) => existsSync(join(d, ".git")) && existsSync(join(d, MANIFEST_REL)))
  if (scoped.length > 1) return { kind: "ambiguous", root: null, candidates: scoped, matched: "manifest" }
  if (scoped.length === 1) return { kind: "unique", root: scoped[0], candidates: [...scoped], matched: "manifest" }
  const bare = scanChildren(anchor, (d) => existsSync(join(d, ".git")))
  if (bare.length > 1) return { kind: "ambiguous", root: null, candidates: bare, matched: "git" }
  if (bare.length === 1) return { kind: "unique", root: bare[0], candidates: [...bare], matched: "git" }
  return { kind: "none", root: null, candidates: [], matched: null }
}

/**
 * **归属形单点**（KD-M1-30 / 设计 §2.9 A——2026-09-21 用户裁定「最近者优先」）：自 `target`
 * （目录含自身；文件路径自其父目录起）沿**祖先链**逐级上溯至盘根，取**最近**带 `MANIFEST_REL`
 * 的目录；无 ⇒ `null`（⇒ 调用方走发现兜底）。**嵌套合法**：子内归子、根其余归根。
 * **纯 fs**（只判存在性——不解析档内容 / 不问模式）· **不跨兄弟** · **无全局优先级**。
 * **覆盖位**（`_setProjectRootForTest` 在场）⇒ **头部短路**：直接返回覆盖值（不查档存在性——
 * 保「覆盖即覆盖值」语义，回归守卫 = 本批批内件基座腿（`docs/batches/2026-10-02-manifest-resolution-fix.test.mjs`——
 * 基座三态 + 覆盖位 + 薄委托等价逐格）+ `docs/batches/2026-09-29-structure-split-2.test.mjs` 导出枚举探针（`Object.keys` 名面核））。
 * @param {string} [target] 目标路径（目录 / 文件）
 * @returns {string|null} 最近带档祖先目录绝对路径 / null
 */
export function owningProject(target) {
  if (_projectRootOverride) return resolve(_projectRootOverride)
  let dir = resolve(target ?? ".")
  for (;;) {
    if (existsSync(join(dir, MANIFEST_REL))) return dir
    const parent = dirname(dir)
    if (parent === dir) return null // 盘根 → 祖先链无档
    dir = parent
  }
}

/** **项目根解析的歧义直读形**（判定单点——设计 `MANIFEST.md` §2.2 `projectRootView` 契约行 / §2.5
 *  「多档解析消费面收口」条）：`ok`（唯一解析：归属命中 ∥ 发现 `self` / `unique`）/ `ambiguous`
 *  （≥2 候选 ⇒ `root` null + 候选全列**按名排序**）/ `none`（无项目 ⇒ 双空）；覆盖位在场 ⇒
 *  头部短路（`ok` + 覆盖值）。**非抛错 / 零写**；`resolveProjectRoot` 薄委托本函数（行为逐字零变）。
 *  @returns {{state:'ok'|'ambiguous'|'none', root:string|null, candidates:string[]}} */
export function projectRootView(cwd) {
  const owning = owningProject(cwd)
  if (owning) return { state: "ok", root: owning, candidates: [] }
  const d = discoverProjects(cwd)
  if (d.root) return { state: "ok", root: d.root, candidates: [] }
  if (d.kind === "ambiguous") return { state: "ambiguous", root: null, candidates: d.candidates }
  return { state: "none", root: null, candidates: [] }
}

/** 项目根解析（**归属 ∨ 发现**——KD-M1-30 / M1-24）：**薄委托** `projectRootView(cwd).root`（判定
 *  单点见上——#828）。带档路径与批前**逐字同**；变更面两条（设计 §2.2 同条）：① 项目树内路径
 *  （祖先带档）⇒ 该项目根；② 裸仓恰一 ⇒ 该仓根（零档降级 = 建档机会）。`none` / `ambiguous` ⇒
 *  `null`。调用方零改（行为随语义变更——设计 §2.5 键面条 / 错层条）。
 *  @returns {string|null} 项目根绝对路径 / null */
export function resolveProjectRoot(cwd) {
  return projectRootView(cwd).root
}
