/**
 * manifest-discovery.mjs — **发现 ∕ 归属族**出档（2026-09-29 structure-split-2 · 台账 #620）：自 `manifest.mjs`
 * 全量迁出——`MANIFEST_REL` · 测试注入位（`_setProjectRootForTest` / `_resetProjectRootForTest`）·
 * `scanChildren`（两条梯表共用 walk 内核）· `discoverProjects`（项目梯）· `discoverRepos`（仓梯）·
 * `owningProject`（归属形 = 判据本体）· `projectRootView`（三态报明）· `resolveProjectRoot`（归属形薄委托）；
 * **结构拆分零语义**（面不变 ∕ 判据不变，只换宿主档；切点 ∕ 缝单源 = 批档 `docs/batches/2026-09-29-structure-split-2.md` §2.2-C）。
 * 拆分后判据变更（2026-10-25「判据本体单源 + 不向下取根」）：`projectRootView` 取根臂收为**仅归属命中**
 * （界 = 目标所在盘根），`discoverProjects` 的 `self` 只供报明、不进 `root`（项目梯无 `unique`——≥1 即
 * `workspace`，1 ∥ 2 ∥ 更多同判；仓梯 `discoverRepos` 的 `unique` 保留）。
 *
 * 缝 = 同名再出口：宿主 `manifest.mjs` 转口本档八名导出（消费者 import 面零改）；宿主自用四名
 * （`MANIFEST_REL` ∥ `discoverProjects` ∥ `owningProject` ∥ `resolveProjectRoot`）随 import。
 * 零环：本档不引宿主（方向单行）；档外依赖 = `node:fs` ∥ `node:path`；机制详述 = `docs/core/design/MANIFEST.md` §2.2 / §2.9。
 */
import { existsSync, readdirSync, statSync } from "node:fs"
import { dirname, join, parse, resolve } from "node:path"

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
 * ③ 直接子目录中**带档**者非空 ⇒ `workspace`（只看此级；1 ∥ 2 ∥ 更多同判——下辖项目 = 多根工作区，
 * 常态、非错误态，项目梯无 `unique` 态）；④ 零带档才看含 `.git` 的**裸仓**（≥1 ⇒ `workspace`，同判）；
 * ⑤ 均无 ⇒ `none`（⇒ 建档流，落点 = 会话锚）。
 * `candidates` 一律**按名排序**（`self` / `none` ⇒ `[]`）；`matched` ∈ `manifest` / `git` / `null`
 * 记命中（或工作区）出自哪一级。**纯 fs**（只判存在性——不解析档内容）· **不抛** · **不向上** · **不递归**。
 * **覆盖位**（`_setProjectRootForTest` 在场）⇒ **头部短路**（测试注入面——先于真判据，同 `discoverRepos`）。
 * @param {string} [cwd] 会话锚（缺省 → 进程 cwd）
 * @returns {{kind:'self'|'none'|'workspace', root:string|null, candidates:string[], matched:'manifest'|'git'|null}}
 */
export function discoverProjects(cwd) {
  if (_projectRootOverride) return { kind: "self", root: resolve(_projectRootOverride), candidates: [], matched: null }
  const anchor = resolve(cwd ?? ".")
  if (existsSync(join(anchor, MANIFEST_REL))) return { kind: "self", root: anchor, candidates: [], matched: "manifest" }
  if (existsSync(join(anchor, ".git"))) return { kind: "self", root: anchor, candidates: [], matched: "git" }
  const withManifest = scanChildren(anchor, (d) => existsSync(join(d, MANIFEST_REL)))
  if (withManifest.length >= 1) return { kind: "workspace", root: null, candidates: withManifest, matched: "manifest" }
  const bareRepos = scanChildren(anchor, (d) => existsSync(join(d, ".git")))
  if (bareRepos.length >= 1) return { kind: "workspace", root: null, candidates: bareRepos, matched: "git" }
  return { kind: "none", root: null, candidates: [], matched: null }
}

/**
 * **仓发现**（仓梯——KD-M1-23 / `docs/core/design/TOOLS.md` §6.13；**单源** KD-M1-22——`git` 工具
 * 经此符号接线，禁第二份实现）：① 锚含 `.git` ⇒ 锚；② 直接子目录中 `.git` **∧** 带档者恰一 ⇒ 命中
 * （≥2 ⇒ `workspace`——下辖多仓 = 常态）；③ **零个此类时才看**含 `.git` 的裸仓（恰一 ⇒ 命中 /
 * ≥2 ⇒ `workspace`）；④ 均无 ⇒ `none`。
 * 与 `discoverProjects` = **同一 walk 内核**（`scanChildren`）的两种梯表——差异只在谓词与级序。
 * `candidates` 按名排序；`matched` 记档位；纯 fs / 不抛 / 不递归 / 不向上；覆盖位 ⇒ 头部短路。
 * @param {string} [cwd] 会话锚（缺省 → 进程 cwd）
 * @returns {{kind:'self'|'unique'|'none'|'workspace', root:string|null, candidates:string[], matched:'manifest'|'git'|null}}
 */
export function discoverRepos(cwd) {
  if (_projectRootOverride) return { kind: "self", root: resolve(_projectRootOverride), candidates: [], matched: null }
  const anchor = resolve(cwd ?? ".")
  if (existsSync(join(anchor, ".git"))) return { kind: "self", root: anchor, candidates: [], matched: "git" }
  const scoped = scanChildren(anchor, (d) => existsSync(join(d, ".git")) && existsSync(join(d, MANIFEST_REL)))
  if (scoped.length > 1) return { kind: "workspace", root: null, candidates: scoped, matched: "manifest" }
  if (scoped.length === 1) return { kind: "unique", root: scoped[0], candidates: [...scoped], matched: "manifest" }
  const bare = scanChildren(anchor, (d) => existsSync(join(d, ".git")))
  if (bare.length > 1) return { kind: "workspace", root: null, candidates: bare, matched: "git" }
  if (bare.length === 1) return { kind: "unique", root: bare[0], candidates: [...bare], matched: "git" }
  return { kind: "none", root: null, candidates: [], matched: null }
}

/**
 * **归属形单点 = 判据本体**（KD-M1-30 · 2026-10-23 用户裁定 · 2026-10-25「判据本体真单源」）：
 * 自 `target`（目录 = 自身；文件 = 其所在目录）沿**祖先链**上溯，取最近带 `MANIFEST_REL` 的目录
 * ⇒ 该目录；无 ⇒ `null`（不向下、不猜——发现梯是另问，交调用方处置）。
 * 会话落在项目内层子目录时，这一路上溯正是它归到自己项目根的通路（用户 2026-10-23 23:24
 * 「本来就该爬到项目根啊」）；**发现梯（`discoverProjects`）仍纯向下**——从工作区容器只找直接
 * 子目录，不把容器挂到外层项目上。**纯 fs** · **不跨兄弟** · **无全局优先级**。
 * **界（`boundary`）由调用方定——两面两界**：取根面（`projectRootView`）传**目标所在盘根**（向上
 * 无界——目标由调用方指名）；台账面（`resolveLedgerRoot`）传**会话锚**（越界即停——用户
 * 2026-10-25 19:09「不能跑到工作目录以外去」）。界比较按**段归一**（`isInsideOrEqual`：盘根形带
 * 尾分隔符，`edge + sep` 直比会假阴）。
 * **覆盖位**（`_setProjectRootForTest` 在场）⇒ **头部短路**：直接返回覆盖值（不查档存在性）。
 * @param {string} [target] 目标路径（目录 / 文件）
 * @param {string} [boundary] 上溯上界（缺省 → 进程 cwd）
 * @returns {string|null} 带档目录绝对路径 / null
 */
export function owningProject(target, boundary) {
  if (_projectRootOverride) return resolve(_projectRootOverride)
  let dir = resolve(target ?? ".")
  const edge = resolve(boundary ?? process.cwd())
  // 界：target 在界外（含「target 是界的祖先」）⇒ 无归属——界由调用方定，越界不猜。
  if (!isInsideOrEqual(dir, edge)) return null
  const st = statSync(dir, { throwIfNoEntry: false })
  if (st && !st.isDirectory()) dir = dirname(dir)
  for (;;) {
    if (existsSync(join(dir, MANIFEST_REL))) return dir
    if (dir === edge) return null
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/** `dir` 是否等于 `bound` 或在其子树内（分隔符归一比较）。 */
function isInsideOrEqual(dir, bound) {
  const norm = (p) => p.replaceAll("\\", "/").replace(/\/+$/, "")
  const d = norm(dir)
  const b = norm(bound)
  return d === b || d.startsWith(b + "/")
}

/** **项目根解析的直读形**（判定单点——设计 `MANIFEST.md` §2.2 `projectRootView` 契约行 / §2.5
 *  「单项目解析律与四处会话级缺省收口」条）：`ok`（**仅归属命中**——判据本体 = `owningProject`，
 *  界 = **目标所在盘根** ⇒ 向上无界；函数体唯一 `ok` 出口）/ `workspace`（归属无命中 ∧
 *  `discoverProjects` 报工作区：下辖带档者 ≥1 ∥ 零带档时裸仓 ≥1 ⇒ `root` null + 下辖项目全列
 *  **按名排序**——多根工作区常态，非错误态；1 ∥ ≥2 同判）/ `none`（其余，含裸仓锚——
 *  **不向下取根** ⇒ 双空）；覆盖位在场 ⇒ 头部短路（`ok` + 覆盖值）。
 *  **发现读数只供 `workspace` 报明**：`discoverProjects` 的 `self` **不进 `root`**
 *  （判据单源 = `owningProject`）。**非抛错 / 零写**；`resolveProjectRoot` 薄委托本函数。
 *  @returns {{state:'ok'|'workspace'|'none', root:string|null, candidates:string[]}} */
export function projectRootView(cwd) {
  const target = resolve(cwd ?? ".")
  const owning = owningProject(target, parse(target).root)
  if (owning) return { state: "ok", root: owning, candidates: [] }
  const d = discoverProjects(target)
  if (d.kind === "workspace") return { state: "workspace", root: null, candidates: d.candidates }
  return { state: "none", root: null, candidates: [] }
}

/** 项目根解析（**归属形**——KD-M1-30 / M1-24）：**薄委托** `projectRootView(cwd).root`（判定
 *  单点见上——#828）。带档路径与批前**逐字同**；变更面（设计 §2.2 同条）：① 项目树内路径
 *  （祖先带档）⇒ 该项目根（子目录归到自己的项目根 = 正常通路）；② 祖链无档 ⇒ `null`——
 *  **不向下取根**（下辖带档子目录恰一 ∥ 裸仓恰一均 `null`，发现读数不进 `root`）。
 *  `none` / `workspace` ⇒ `null`。调用方零改（行为随语义变更——设计 §2.5 键面条 / 错层条）。
 *  @returns {string|null} 项目根绝对路径 / null */
export function resolveProjectRoot(cwd) {
  return projectRootView(cwd).root
}
