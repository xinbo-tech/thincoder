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
 *  - discoverRepos(cwd) → { kind: self|unique|none|ambiguous, root, candidates }：仓发现**单源**
 *    （KD-M1-22——manifest 面与 `git` 工具共用；`candidates` 按名排序）；`resolveProjectRoot` = 其薄包装。
 *  - resolveEngineeringManifest(cwd, { writer, init }) → 入口决策树（**非抛错**——KD-M1-20）：
 *    两端入口钩子（抛错薄包装）与翻转面（拒翻）共用同一张树（判据单源；§2.8 F1）。
 *  - manifestFilePath(cwd) → 数据档绝对路径（档路径单源 KD-M1-18——读 / 写 / mtime 门控三处同源）。
 *  - initManifest(cwd, { writer = 'subagent' } = {}) → 经写门写 DEFAULT_MANIFEST，缺省拒。
 *  - writeManifest(cwd, manifest, { writer = 'subagent' } = {}) → 落盘前先校验（ok:false 拒
 *    落盘）；仅 writer === 'main' 落盘（fail-closed 缺省拒）。
 *
 * N1 零依赖：仅 node:fs / node:path + 标准库 JSON.parse——无第三方解析器、无 node:sqlite。
 * N3 可迁移：本模块不硬编码任何本仓路径（docRoot / checkConfig 由被开发项目声明）。
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

/** 数据档文件名（每个 git 仓一份——项目根 = 仓根；2026-09-17 用户裁定）。 */
export const MANIFEST_REL = "PROJECT-MANIFEST.json"

/** 测试注入：强制项目根（测试 tmp 非 git 仓——同 ledger `_setLedgerDirForTest` 先例）。 */
let _projectRootOverride = null
export function _setProjectRootForTest(dir) { _projectRootOverride = dir }
export function _resetProjectRootForTest() { _projectRootOverride = null }

/**
 * 仓发现（**单源**——KD-M1-22 / 设计 `docs/core/design/MANIFEST.md` §2.2 · `docs/core/design/TOOLS.md` §6.13；
 * 2026-09-17 用户裁定 + #62 批）：判据 = git 目录（`.git`）+ 数据档存在性——
 * ① `_projectRootOverride` 在场 ⇒ `self` + 覆盖值（测试注入面，短路先于真判据）；
 * ② 锚（cwd 的 `resolve`）自身含 `.git` ⇒ `self`（锚即仓根）；
 * ③ 否则**向下看锚的直接子目录一层**（不递归、不向上）：含 `.git` **∧** 含 `MANIFEST_REL`（只判存在性、
 *    不解析档内容）——恰一 ⇒ `unique`；零 ⇒ `none`；≥2 ⇒ `ambiguous`（全列候选，不猜）。
 * `candidates` 一律**按名排序**（歧义消息确定可判）——`self` / `none` ⇒ `[]`。
 * 纯 fs（不读档内容 / 不查模式 / 不依赖 agent）· **不抛**（锚不可读 ⇒ `none`）· 不缓存。
 * @param {string} [cwd] 会话锚（缺省 → 进程 cwd）
 * @returns {{kind:'self'|'unique'|'none'|'ambiguous', root:string|null, candidates:string[]}}
 */
export function discoverRepos(cwd) {
  if (_projectRootOverride) return { kind: "self", root: resolve(_projectRootOverride), candidates: [] }
  const anchor = resolve(cwd ?? ".")
  if (existsSync(join(anchor, ".git"))) return { kind: "self", root: anchor, candidates: [] }
  let found = []
  try {
    found = readdirSync(anchor, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
      .map((e) => join(anchor, e))
      .filter((d) => existsSync(join(d, ".git")) && existsSync(join(d, MANIFEST_REL)))
  } catch { /* 不可读 → 空（none） */ }
  if (found.length === 1) return { kind: "unique", root: found[0], candidates: [...found] }
  if (found.length === 0) return { kind: "none", root: null, candidates: [] }
  return { kind: "ambiguous", root: null, candidates: found }
}

/**
 * 项目根解析（2026-09-17 用户裁定，**最终定案：纯向下，绝不向上**）——`discoverRepos(cwd).root` 的
 * **薄包装**（零语义——KD-M1-22：`self` / `unique` ⇒ 路径，`none` / `ambiguous` ⇒ `null`，与批前逐字同）。
 * 判据本体 = 上（单源）；调用方（`manifestFilePath` / `docRootBase` / `ledger-db.mjs`）零改。
 * @returns {string|null} 项目根绝对路径 / null
 */
export function resolveProjectRoot(cwd) {
  return discoverRepos(cwd).root
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

/** 落盘根：git 根优先（仓内任意子目录调用都落仓根——防错层）；无 .git（临时项目 / 测试）→ 退回 cwd
 *  （旧行为，不更坏）。防「写进 monorepo 容器根」的主闸 = 提示词（主 agent 会话锚必须进仓内）。 */
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
 * reason:'missing' 由调用方走初始化分支（壳面拒进正常循环直至初始化完成）。
 */
export function requireManifest(cwd) {
  return readManifest(cwd)
}

/**
 * 入口决策树（**非抛错**形态——KD-M1-20；docs/core/design/MANIFEST.md §2.8 F1）：三面共用——
 * ① CLI 装配 / 重估薄包装 ② VSC `hydrateRun` 钩子块 ③ 翻转面（`eng` 工具 / `/eng` /
 * `/session` / ACP——「先判后翻」，拒翻分支零副作用）。判据树只此一处（判据单源——KD-M1-8 同族）。
 *
 * 分支（四出口）：
 *   档合法          → { ok:true, manifest, created:false }（manifest = 补默认值后的档内容）
 *   缺档 + init     → 根可解析 ? `initManifest(cwd, { writer })`（抛错 → `init-failed`）
 *                             : { ok:false, code:'root-unresolvable', message }
 *   缺档 + !init    → { ok:false, code:'missing' }（不拒——调用方自决；VSC depth>0 分支用）
 *   档非法          → { ok:false, code:'invalid', message, errors }
 *
 * `writer` 由调用点**显式**传（生产调用点全传 `'main'`）：缺省 `'subagent'` 是写门 fail-closed
 * 缺省（KD-M1-3），误用缺省 ⇒「缺档 + 根可解析」退化为 `init-failed`（拒翻——与 §2.8 F2 /
 * AC-20② 语义相反；T38 反证格）。
 * 边界：`readManifest` 的非 ENOENT 读错（权限 / 目录等）按既有契约**上抛**（不伪装成缺失——
 * readManifest 语义零改）；本树只承诺上列四出口。
 * @param {string} [cwd] 会话锚（缺省 → 进程 cwd）
 * @returns {{ok:true, manifest:object, created:boolean}
 *   | {ok:false, code:'missing'|'invalid'|'root-unresolvable'|'init-failed', message?:string, errors?:string[]}}
 */
export function resolveEngineeringManifest(cwd, { writer = "subagent", init = true } = {}) {
  const m = readManifest(cwd)
  if (m.ok) return { ok: true, manifest: m.manifest, created: false }
  if (m.reason === "invalid") {
    return {
      ok: false, code: "invalid", errors: m.errors,
      message: `${MANIFEST_REL} 非法（fail-closed 拒进正常循环）：${m.errors.join("；")}`,
    }
  }
  if (!init) return { ok: false, code: "missing" }
  // 项目根 = git 仓根（2026-09-17 用户裁定：判据 = .git，向下找；每个仓一份 manifest）：
  // cwd 非仓且子仓中无带 manifest 的仓（零个 = 无项目，多个 = 歧义）→ 不自动建档。
  if (!resolveProjectRoot(cwd)) {
    return {
      ok: false, code: "root-unresolvable",
      message:
        `工程模式启动拒绝：会话锚 ${cwd} 不是 git 仓，且其子仓中带 ${MANIFEST_REL} 的不是恰好一个` +
        `（零个 = 无项目；多个 = 歧义）——每个仓库一份 manifest，请锚在仓内或为子仓建档`,
    }
  }
  try {
    return { ok: true, manifest: initManifest(cwd, { writer }), created: true }
  } catch (e) {
    return { ok: false, code: "init-failed", message: e?.message ?? String(e) }
  }
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
