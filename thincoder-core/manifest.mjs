/**
 * manifest.mjs — M1 项目状态档（ENGINEERING-MODE v2 基础模块）。
 * 权威设计 = docs/core/design/MANIFEST.md §2
 * （机制代码在核，操作对象 = 被开发项目 cwd 根的 PROJECT-MANIFEST.json 数据档）。
 *
 * 契约速览（全量见模块设计 §2.2）：
 *  - readManifest(cwd) → { ok, manifest, missingKeys, errors, reason }：
 *    读 + validateManifest(obj)；缺键 → 产 missingKeys（非拒）→ 补默认值 →
 *    再校验通过；整档缺失 → { ok:false, reason:'missing' }（不静默 fallback）。
 *  - validateManifest(obj) → { ok, errors, missingKeys }：枚举 / version 数值 /
 *    docRoot 子键值形态（串 | 数组，F7）——**纯函数、零 fs**；不落盘。
 *  - isValidDocRootValue(value) / docRootPaths(value, cwd)（F7 判据单源 KD-M1-8）：值形态谓词
 *    + 值 → 绝对路径数组（展开 / trim + `\` 归一 / 基数 = 项目根 / 去重保序）。
 *  - requireManifest(cwd) → 装配钩子入口 = readManifest(cwd)。
 *  - discoverProjects(cwd) → { kind, root, candidates, matched }：**项目梯**（五级 / git 非前提——KD-M1-23）；
 *    `discoverRepos(cwd)` 同形态 = **仓梯**（`.git` 视图——`git` 工具经它接线，KD-M1-22）。
 *    两梯共一模块私有 walk 内核 `scanChildren`（单源）；`candidates` 按名排序、`matched` 记档位。
 *  - owningProject(target) → 归属形单点（沿祖先链取**最近带档目录**——KD-M1-30）。
 *  - projectView(target) → { state, root, path, manifest?, candidates?, errors?, matched }：**按用点解析**
 *    的读侧单点（归属 ∨ 发现兜底 / 五态 / 非抛错 / **零写**——KD-M1-24）。
 *  - resolveProjectRoot(cwd) = owningProject(cwd) ?? discoverProjects(cwd).root（KD-M1-30）。
 *  - resolveEngineeringManifest(cwd, { writer, init }) → 入口决策树（**非抛错**——KD-M1-20）：
 *    两端入口钩子与翻转面（拒翻）共用同一张树（判据单源；§2.8 F1）——失败码五枚
 *    `missing` / `invalid` / `no-project` / `ambiguous` / `init-failed`（KD-M1-28）。
 *  - manifestFilePath(cwd) → 数据档绝对路径（档路径单源 KD-M1-18——读 / 写 / mtime 门控三处同源）。
 *  - initManifest(cwd, { writer = 'subagent' } = {}) → 经写门写 DEFAULT_MANIFEST，缺省拒。
 *  - writeManifest(cwd, manifest, { writer = 'subagent' } = {}) → 落盘前先校验（ok:false 拒
 *    落盘）；仅 writer === 'main' 落盘（fail-closed 缺省拒）。
 *
 * N1 零依赖：仅 node:fs / node:path + 标准库 JSON.parse——无第三方解析器、无 node:sqlite。
 * N3 可迁移：本模块不硬编码任何本仓路径（docRoot / checkConfig 由被开发项目声明）。
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
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
 * 保「覆盖即覆盖值」语义，回归守卫 = `test/manifest.test.mjs` T42 覆盖断言）。
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

/**
 * 项目根解析（**归属 ∨ 发现**——KD-M1-30 / M1-24）：`owningProject(cwd) ?? discoverProjects(cwd).root`。
 * 带档路径与批前**逐字同**；变更面两条（设计 §2.2）：① 项目树内路径（祖先带档）⇒ **该项目根**
 * （批前回落 `resolve(cwd)`——错层建档面，本批修）；② 裸仓恰一 ⇒ 该仓根（零档降级 = 建档机会）。
 * `none` / `ambiguous` ⇒ `null`。调用方（`manifestFilePath` / `docRootBase` / `ledger-db.mjs` /
 * `ledger-cmd.mjs`）**零改**（行为随语义变更——设计 §2.5 键面条 / 错层条）。
 * @returns {string|null} 项目根绝对路径 / null
 */
export function resolveProjectRoot(cwd) {
  return owningProject(cwd) ?? discoverProjects(cwd).root
}

/**
 * **按用点解析**的读侧单点（KD-M1-24 / M1-30——**非抛错 / 零写 / 无缓存**）：两段合成——
 * · **归属（第一段——§⑥ 归属形）**：`owningProject(target)` 沿祖先链取最近带档目录
 *   （子优于根 / 不跨兄弟 / 无全局优先级）⇒ 读该档 ⇒ `ok` / `invalid`。
 * · **发现兜底（第二段——§⑥ 发现规则，纯向下）**：祖先链无档 ⇒ `discoverProjects(target)` ⇒ 命中
 *   （`self` / `unique`）⇒ 读其档（带档 ⇒ `ok` / `invalid`；缺档 ⇒ `missing`）；`ambiguous` ⇒
 *   `ambiguous`（+ `candidates`）；`none` ⇒ `no-project`。
 * 写侧（建档）**不在**此函数（归入口决策树——KD-M1-25 / M1-29）⇒ 注入器 / 只读消费面不会变写点。
 * `matched` 契约：归属段命中 ⇒ `'manifest'`；发现段 ⇒ `discoverProjects.matched` 逐字；
 * `no-project`（/ 覆盖位短路）⇒ `null`——报明行歧义变体按它分野（§2.6 条 1b）。
 * 读错（非 ENOENT——权限 / 目录等）收为 `invalid`（非抛错契约；`readManifest` 语义零改）。
 * @param {string} [target] 目标路径（目录 / 文件——动作作用于哪个项目的路径）
 * @returns {{state:'ok'|'missing'|'no-project'|'ambiguous'|'invalid', root:string|null, path:string|null,
 *   manifest?:object, candidates?:string[], errors?:string[], matched:'manifest'|'git'|null}}
 */
export function projectView(target) {
  const anchor = resolve(target ?? ".")
  const owning = owningProject(anchor)
  if (owning) return viewAtRoot(owning, "manifest")
  const d = discoverProjects(anchor)
  if (d.kind === "ambiguous") return { state: "ambiguous", root: null, path: null, candidates: d.candidates, matched: d.matched }
  if (d.kind === "none") return { state: "no-project", root: null, path: null, matched: null }
  return viewAtRoot(d.root, d.matched)
}

/** `projectView` 公共尾段：给定项目根 ⇒ 读 + 校验 ⇒ `ok` / `missing` / `invalid`（非抛错）。 */
function viewAtRoot(root, matched) {
  const path = join(root, MANIFEST_REL)
  let m
  try {
    m = readManifest(root)
  } catch (e) {
    return { state: "invalid", root, path, errors: [e?.message ?? String(e)], matched } // 读错（权限 / 目录等）⇒ 非抛错收口
  }
  if (m.ok) return { state: "ok", root, path, manifest: m.manifest, matched }
  if (m.reason === "missing") return { state: "missing", root, path, matched }
  return { state: "invalid", root, path, errors: m.errors, matched }
}

/**
 * docRoot 路径解析基数（单点——manifest 的路径值一律相对**项目根**解析，非原始 cwd）：
 * 会话锚在容器根时，manifest 读的是子仓内的档，其 docRoot 值（如 docs/core/design）相对子仓根；
 * 消费面必须用项目根当基数，否则解析到容器根下不存在的目录（2026-09-17 实证：评审五档全拒）。
 * @returns {string} 项目根绝对路径（无项目根时回退 resolve(cwd)）
 */
export function docRootBase(cwd) {
  return resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")
}

/**
 * `docRoot` 子键**值形态判据**（F7 / KD-M1-6 / KD-M1-8——判据单源）：非空字符串（`trim` 后
 * 非空），或非空数组且元素皆非空字符串（**同款口径**：元素 `trim` 后非空）；其余（空串 /
 * 空白串 / 空数组 / 数组含非串 / 空串 / 空白串元素 / 非串非数组）为非法。
 * @param {unknown} value docRoot 某子键的值
 * @returns {boolean}
 */
export function isValidDocRootValue(value) {
  if (typeof value === "string") return value.trim() !== ""
  if (!Array.isArray(value) || value.length === 0) return false
  return value.every((p) => typeof p === "string" && p.trim() !== "")
}

/**
 * `docRoot` 子键值 → **绝对路径数组**（F7 / §2.7 解析管线——全在本模块一处）：展开（串 /
 * 数组统一成列表）→ 逐元素 `trim` + `\` 归一 → `resolve(docRootBase(cwd), p)`（基数 =
 * 项目根，不回退原始 cwd）→ 去重（保序）。非法形态 → `[]`（零根——拒面在 `validateManifest`，
 * 本函数不判错；两处共用 `isValidDocRootValue`，判据单源）。
 * @param {unknown} value docRoot 某子键的值（串 | 数组）
 * @param {string} [cwd] 会话锚（基数由 docRootBase 解析为项目根）
 * @returns {string[]} 绝对路径（去重保序）
 */
export function docRootPaths(value, cwd) {
  if (!isValidDocRootValue(value)) return []
  const base = docRootBase(cwd)
  const list = (Array.isArray(value) ? value : [value]).map((p) => resolve(base, p.trim().replace(/\\/g, "/")))
  return [...new Set(list)]
}

/** 落盘根：**项目根**优先（项目树内任意子目录调用都落项目根——防错层，KD-M1-30 归属形）；
 *  无项目（梯⑤ 存档 / 临时目录 / 测试注入）→ 退回 cwd（既有行为，不更坏）。 */
function writeRoot(cwd) {
  return resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")
}

/**
 * 数据档路径（**单源**——KD-M1-18）：`join(writeRoot(cwd), MANIFEST_REL)`。读（`readManifest`）/ 写
 * （`writeManifest`）/ mtime 门控（`agent/setup-reminders.mjs` ③b）三处同源——调用方不重写根
 * 解析式（「档在哪」与「项目根在哪」是同一判据，重写即判据双源）。
 * @param {string} [cwd] 会话锚（缺省 → 进程 cwd）
 * @returns {string} 数据档绝对路径
 */
export function manifestFilePath(cwd) {
  return join(writeRoot(cwd), MANIFEST_REL)
}

/** 默认五键（架构 §2.3 E1 逐字）——整档初始化的写源与缺键 fallback 的补源。 */
export const DEFAULT_MANIFEST = Object.freeze({
  version: 1,
  phase: "initial-dev",
  docRoot: Object.freeze({
    requirements: "docs/requirements",
    specs: "docs/requirements/specs",
    design: "docs/design",
    modules: "docs/design/modules",
    batches: "docs/batches",
  }),
  promptsLanding: "thincoder-core/prompts",
  checkConfig: Object.freeze({
    scanDirs: Object.freeze(["docs"]),
    lineWidth: 300,
    anchors: Object.freeze({ domain: "docs", exclude: Object.freeze(["_archive", "batches"]) }),
    exemptions: Object.freeze([]),
  }),
})

/** 校验判据（模块设计 §2.2）——枚举 / 键存在（fallback 用）；判据单源（KD-M1-4）。 */
export const MANIFEST_SCHEMA = Object.freeze({
  $anchor: "docs/core/design/MANIFEST.md",
  enum: Object.freeze({
    phase: Object.freeze(["initial-dev", "production"]),
  }),
  keys: Object.freeze(Object.keys(DEFAULT_MANIFEST)),
  nestedKeys: Object.freeze({
    docRoot: Object.freeze(Object.keys(DEFAULT_MANIFEST.docRoot)),
    checkConfig: Object.freeze(Object.keys(DEFAULT_MANIFEST.checkConfig)),
  }),
})

/**
 * 形状校验（模块设计 §2.2）——枚举 / version 数值恒做；**纯函数、零 fs**（原 `{ cwd }`
 * 指针腿已随字段整链裁撤——KD-M1-5 墓志）；不落盘。键存在性入 missingKeys（非拒）：
 * 缺键 = 便利 fallback（补默认值），不是错（与整档缺失两分——KD-M1-2）。
 * @param {object} obj 待校验 manifest 对象
 * @returns {{ok:boolean, errors:string[], missingKeys:string[]}}
 */
export function validateManifest(obj) {
  const errors = []
  const missingKeys = []
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, errors: ["manifest 顶层必须是 JSON 对象"], missingKeys }
  }
  for (const key of MANIFEST_SCHEMA.keys) {
    if (!(key in obj)) missingKeys.push(key)
  }
  for (const [nested, subkeys] of Object.entries(MANIFEST_SCHEMA.nestedKeys)) {
    const value = obj[nested]
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      missingKeys.push(nested) // 整键缺失/非对象 → 与整键缺同语义（整键补默认）
      continue
    }
    for (const sub of subkeys) {
      if (!(sub in value)) { missingKeys.push(`${nested}.${sub}`); continue } // 子键路径（AC-3 / T3b）
      // docRoot 子键值形态（F7 / KD-M1-7）：串 | 非空串数组；非法 → 拒（不静默跳过）。
      if (nested === "docRoot" && !isValidDocRootValue(value[sub])) {
        errors.push(`docRoot.${sub} 值形态非法：${JSON.stringify(value[sub])}（须为非空字符串或非空字符串数组——KD-M1-6 / KD-M1-7）`)
      }
    }
  }
  if (obj.phase !== undefined && !MANIFEST_SCHEMA.enum.phase.includes(obj.phase)) {
    errors.push(`phase 取值非法："${obj.phase}"（允许：${MANIFEST_SCHEMA.enum.phase.join(" | ")}）`)
  }
  if (obj.version !== undefined && (typeof obj.version !== "number" || !Number.isFinite(obj.version))) {
    errors.push(`version 非法：${JSON.stringify(obj.version)}（须为数值）`)
  }
  return { ok: errors.length === 0, errors, missingKeys }
}

/** 缺键补默认值（module 设计 §2.2 管线）：顶层缺键补默认、docRoot/checkConfig 子键补默认
 *  （与整键缺同语义）；不覆写既有值。深拷贝默认源（structuredClone）——冻结常量永不外泄引用。 */
function fillDefaults(obj) {
  const out = structuredClone(DEFAULT_MANIFEST)
  for (const key of MANIFEST_SCHEMA.keys) {
    if (!(key in obj)) continue
    if (key === "docRoot" || key === "checkConfig") {
      const src = obj[key]
      if (src === null || typeof src !== "object" || Array.isArray(src)) continue // 整键非对象 → 保持默认
      for (const sub of Object.keys(out[key])) {
        if (sub in src) out[key][sub] = src[sub]
      }
    } else {
      out[key] = obj[key]
    }
  }
  return out
}

/**
 * 读 cwd 根数据档（模块设计 §2.2）：读 + validateManifest(obj) → 缺键产
 * missingKeys（非拒）→ 补默认值 → 再校验通过。整档缺失 → { ok:false, reason:'missing' }
 * （绝不静默 fallback——KD-M1-2）；JSON 非法 / 顶层非对象 → reason:'invalid'。
 * @returns {{ok:boolean, manifest:object|null, missingKeys:string[], errors:string[], reason?:string}}
 */
export function readManifest(cwd) {
  let raw
  try {
    raw = readFileSync(manifestFilePath(cwd), "utf8")
  } catch (e) {
    if (e.code === "ENOENT") {
      return { ok: false, reason: "missing", errors: [], missingKeys: [], manifest: null }
    }
    throw e // 权限/目录等其他读错——fail-closed 上抛，不伪装成缺失
  }
  let obj
  try {
    obj = JSON.parse(raw)
  } catch {
    return { ok: false, reason: "invalid", errors: [`${MANIFEST_REL} 不是合法 JSON`], missingKeys: [], manifest: null }
  }
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, reason: "invalid", errors: ["manifest 顶层必须是 JSON 对象"], missingKeys: [], manifest: null }
  }
  const first = validateManifest(obj)
  const manifest = fillDefaults(obj)
  const final = validateManifest(manifest)
  return { ok: final.ok, manifest, missingKeys: first.missingKeys, errors: final.errors, reason: final.ok ? undefined : "invalid" }
}

/**
 * 装配钩子入口（模块设计 §2.2）——同 readManifest(cwd)。ok:true 返回补默认值后的 manifest；
 * reason:'missing' 由调用方走**建档流**（**工程模式会话**口径——梯②④⑤ 就地建档，**不拒会话**；
 * KD-M1-29）；普通会话 = 装配钩子零 manifest I/O（KD-M1-12）。
 */
export function requireManifest(cwd) {
  return readManifest(cwd)
}

/**
 * 入口决策树（**非抛错**形态——KD-M1-20；docs/core/design/MANIFEST.md §2.8 F1）：三面共用——
 * ① CLI 装配 / 重估薄包装 ② VSC `hydrateRun` 钩子块 ③ 翻转面（`eng` 工具 / `/eng` /
 * `/session` / ACP——「先判后翻」，拒翻分支零副作用）。判据树只此一处（判据单源——KD-M1-8
 * 同族）；读侧解析与状态归位 = `projectView`（KD-M1-24——非抛错 / 零写）。
 *
 * 分支（两分支六出口——§2.8 F1 树）：
 *   档合法         → { ok:true, manifest, created:false }（manifest = 补默认值后的档内容）
 *   缺档 + init    → 梯②④⑤（锚 = 裸仓 / 裸仓命中 / 无项目）⇒ `initManifest(cwd, { writer })`
 *                    （抛错 → `init-failed`）；歧义（≥2 候选）⇒ `{ ok:false, code:'ambiguous',
 *                    message, candidates }`（**不建 / 不猜**）
 *   缺档 + !init   → 梯⑤（无项目）⇒ `{ ok:false, code:'no-project' }`（KD-M1-28；`init:false` 面）；
 *                    梯②④（裸仓可解析、档缺）⇒ `{ ok:false, code:'missing' }`；歧义 ⇒ 同上
 *   档非法         → { ok:false, code:'invalid', message, errors }
 *
 * `writer` 由调用点**显式**传（生产调用点全传 `'main'`）：缺省 `'subagent'` 是写门 fail-closed
 * 缺省（KD-M1-3），误用缺省 ⇒「缺档 + 梯②④⑤」退化为 `init-failed`（拒翻——与 §2.8 F2 /
 * AC-20② 语义相反；T38 反证格）。
 * 失败码两态文案不同（KD-M1-28）：无项目 ⇒ 可在锚处落地 / 歧义 ⇒ 列候选不猜；文案族 =
 * 「项目不可解析」（稳定锚句 `/项目不可解析/`——拒翻面与报明面共用）。
 * 边界：`readManifest` 的非 ENOENT 读错（权限 / 目录等）由 `projectView` 收为 `invalid`（非抛错
 * 契约——`readManifest` 返回语义零改）；本树只承诺上列六出口。
 * @param {string} [cwd] 会话锚（缺省 → 进程 cwd）
 * @returns {{ok:true, manifest:object, created:boolean}
 *   | {ok:false, code:'missing'|'invalid'|'no-project'|'ambiguous'|'init-failed',
 *      message?:string, errors?:string[], candidates?:string[]}}
 */
export function resolveEngineeringManifest(cwd, { writer = "subagent", init = true } = {}) {
  const view = projectView(cwd)
  if (view.state === "ok") return { ok: true, manifest: view.manifest, created: false }
  if (view.state === "invalid") {
    return {
      ok: false, code: "invalid", errors: view.errors,
      message: `项目不可解析：${MANIFEST_REL} 非法（fail-closed）：${(view.errors ?? []).join("；")}`,
    }
  }
  if (view.state === "ambiguous") {
    return { ok: false, code: "ambiguous", candidates: view.candidates, message: ambiguousProjectMessage(cwd, view.candidates) }
  }
  // 缺档（梯②④⑤）：init ⇒ 就地建档（内容 = DEFAULT_MANIFEST，经写门 writer:'main'）；!init ⇒ 归码。
  if (!init) return { ok: false, code: view.state === "no-project" ? "no-project" : "missing" }
  try {
    return { ok: true, manifest: initManifest(cwd, { writer }), created: true }
  } catch (e) {
    return { ok: false, code: "init-failed", message: e?.message ?? String(e) }
  }
}

/** 歧义消息（文案族「项目不可解析」——KD-M1-28）：候选**全列**（绝对路径、按名排序）+ 指引
 *  显式指定目标——**不猜**（与报明行同族；拒翻面经 F3 明示面逐字转发）。 */
function ambiguousProjectMessage(cwd, candidates) {
  const list = (candidates ?? []).map((c) => `- ${c}`).join("\n")
  return `项目不可解析：会话锚 ${cwd} 下候选项目不是恰好一个（下列 ${(candidates ?? []).length} 个）——` +
    `每个项目一份 ${MANIFEST_REL}；请显式指定目标项目（机制不猜）：\n${list}`
}

/**
 * 写门落盘（模块设计 §2.2 / KD-M1-3）：仅 writer === 'main' 放行（fail-closed 缺省拒）；
 * 落盘前先 validateManifest(manifest)（ok:false → 拒落盘，防写非法档）。
 * 不替被开发项目创建目录（§1.4 边界）——cwd 不存在时写失败自然上抛。
 * @returns {object} 传入的 manifest（校验通过后原样落盘）
 */
export function writeManifest(cwd, manifest, { writer = "subagent" } = {}) {
  if (writer !== "main") {
    throw new Error("writeManifest 拒绝：非主 agent 无写权（writer 须为 \"main\"，fail-closed 缺省拒）")
  }
  const validated = validateManifest(manifest)
  if (!validated.ok) {
    throw new Error(`writeManifest 拒绝：manifest 校验不过——${validated.errors.join("；")}`)
  }
  writeFileSync(manifestFilePath(cwd), JSON.stringify(manifest, null, 2) + "\n")
  return manifest
}

/**
 * 初始化 = 写默认五键档（模块设计 §2.2）：只提供机制，不包交互问答（问答归壳面）。
 * 落盘走同一写门（内部 writeManifest(cwd, DEFAULT_MANIFEST, { writer })）——与 AC-M1-5
 * 同一闸，无第二条写路径（KD-M1-4 / 评审 #12）。
 * @returns {object} 写入的默认 manifest
 */
export function initManifest(cwd, { writer = "subagent" } = {}) {
  return writeManifest(cwd, DEFAULT_MANIFEST, { writer })
}
