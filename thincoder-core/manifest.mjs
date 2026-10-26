/**
 * manifest.mjs — M1 项目状态档（项目级状态账——工程模式是其**读侧消费者**之一）。
 * 权威设计 = docs/core/design/MANIFEST.md §2
 * （机制代码在核，操作对象 = 被开发项目 cwd 根的 PROJECT-MANIFEST.json 数据档）。
 *
 * 契约速览（全量见模块设计 §2.2）：
 *  - readManifest(cwd) → { ok, manifest, missingKeys, unknownKeys, errors, reason }：
 *    读 + validateManifest(obj)；缺键 → 产 missingKeys（非拒）→ 补默认值 →
 *    再校验通过；整档缺失 → { ok:false, reason:'missing' }（不静默 fallback）。
 *    未知键（#802 / KD-M1-36）→ 产 unknownKeys + 一行可见告警（console.warn + logEvent；
 *    同档同键集去重、读到零未知键清该档 memo）——非拒定性零变。
 *  - validateManifest(obj) → { ok, errors, missingKeys, unknownKeys }：枚举 / version 数值 /
 *    docRoot 子键值形态（串 | 数组 | null（本面无——KD-M1-37），F7）——**纯函数、零 fs**；不落盘。
 *  - 两族声明键（`codePaths` / `index.{codeExtensions,docExtensions,publicRepos}`——KD-M1-31 / M1-32）：
 *    缺键补默认；形态错 = 档非法（fail-closed，与 docRoot 子键同款）；
 *    读向 = `declaration.mjs`（2026-10-01 自 `conventions.mjs` 迁出——经其转口可达）经 `readManifest` /
 *    `manifestFilePath` 投影（单向——KD-M1-33）；`index.publicRepos` 绝对根集 = `declaredPublicRoots`（§6.15）。
 *  - isValidDocRootValue(value) / docRootPaths(value, cwd)（F7 判据单源 KD-M1-8）：值形态谓词
 *    + 值 → 绝对路径数组（展开 / trim + `\` 归一 / 基数 = 项目根 / 去重保序）。
 *  - requireManifest(cwd) → 装配钩子入口 = readManifest(cwd)。
 *  - discoverProjects(cwd) → { kind, root, candidates, matched }：**项目梯**（五级 / git 非前提——KD-M1-23）；
 *    `discoverRepos(cwd)` 同形态 = **仓梯**（`.git` 视图——`git` 工具经它接线，KD-M1-22）。
 *    两梯共一模块私有 walk 内核 `scanChildren`（单源）；`candidates` 按名排序、`matched` 记档位。
 *  - owningProject(target, boundary) → 归属形单点（沿祖先链取**最近带档目录**；界由调用方定——KD-M1-30）。
 *  - projectView(target) → { state, root, path, manifest?, candidates?, errors?, matched }：**按用点解析**
 *    的读侧单点（归属 ∨ 发现兜底 / 五态 / 非抛错 / **零写**——KD-M1-24）。
 *  - resolveProjectRoot(cwd)：项目根（**归属形**——KD-M1-30）= `projectRootView(cwd).root`（薄委托；取值规则见下行）；
 *    projectRootView(cwd) → { state: ok|workspace|none, root, candidates }：项目根直读形（判定单点——§2.2）。
 *  - resolveEngineeringManifest(cwd, { writer, init }) → 入口决策树（**非抛错**——KD-M1-20）：
 *    两端入口钩子与翻转面（拒翻）共用同一张树（判据单源；§2.8 F1）——态码五枚
 *    `missing` / `invalid` / `no-project` / `workspace` / `init-failed`（KD-M1-28）。名中 `Engineering` = 历史命名（沿用不改名）；消费面 = 两端入口钩子 + 翻转面——**非**「模式拥有本模块」。
 *  - manifestFilePath(cwd) → 数据档绝对路径（档路径单源 KD-M1-18——读 / 写 / mtime 门控三处同源）。
 *  - initManifest(cwd, { writer = 'subagent' } = {}) → 经写门写 DEFAULT_MANIFEST，缺省拒。
 *  - writeManifest(cwd, manifest, { writer = 'subagent' } = {}) → 落盘前先校验（ok:false 拒
 *    落盘）；仅 writer === 'main' 落盘（fail-closed 缺省拒）。
 *
 * N1 零依赖：仅 node:fs / node:path + 标准库 JSON.parse——无第三方解析器、无 node:sqlite。
 * N3 可迁移：本模块不硬编码任何本仓路径（docRoot 由被开发项目声明；机检参数不在 manifest 面——住引擎内置常量）。
 */
import { readFileSync, writeFileSync } from "node:fs"
import { join, parse, resolve } from "node:path"
import { DEFAULT_MANIFEST, isValidDocRootValue, validateManifest, fillDefaults } from "./manifest-schema.mjs"
import { MANIFEST_REL, discoverProjects, owningProject, resolveProjectRoot } from "./manifest-discovery.mjs"
// #802（KD-M1-36）：未知键读面告警的事件面——诊断日志（fire-and-forget，失败静默降级）。
import { logEvent } from "./log.mjs"
// 同名 re-export（2026-09-29 structure-split-2 · 台账 #620——缝 = 同名再出口）：发现 ∕ 归属族与校验 ∕ 默认值族出档
// `manifest-discovery.mjs` ∕ `manifest-schema.mjs`；全迁移导出经本档转口——消费者 import 面零改。
export { MANIFEST_REL, discoverProjects, discoverRepos, owningProject, projectRootView, resolveProjectRoot, _setProjectRootForTest, _resetProjectRootForTest } from "./manifest-discovery.mjs"
export { DEFAULT_MANIFEST, MANIFEST_SCHEMA, isValidDocRootValue, validateManifest } from "./manifest-schema.mjs"

/**
 * **按用点解析**的读侧单点（KD-M1-24 / M1-30——**非抛错 / 零写 / 无缓存**）：两段合成——
 * · **归属（第一段——§⑥ 归属形）**：`owningProject(target, target 所在盘根)` 沿祖先链取最近带档目录
 *   （子优于根 / 不跨兄弟 / 无全局优先级）⇒ 读该档 ⇒ `ok` / `invalid`。界与 `projectRootView`
 *   同源（目标所在盘根）——同一 target 两面同归属，非会话锚。
 * · **发现兜底（第二段——§⑥ 发现规则，纯向下）**：祖先链无档 ⇒ `discoverProjects(target)` ⇒
 *   `self` ⇒ 读其档（带档 ⇒ `ok` / `invalid`；缺档 ⇒ `missing`）；`workspace` ⇒
 *   `workspace`（+ `candidates`）；`none` ⇒ `no-project`。
 * 写侧（建档）**不在**此函数（归入口决策树——KD-M1-25 / M1-29）⇒ 注入器 / 只读消费面不会变写点。
 * `matched` 契约：归属段命中 ⇒ `'manifest'`；发现段 ⇒ `discoverProjects.matched` 逐字；
 * `no-project`（/ 覆盖位短路）⇒ `null`——报明行工作区变体按它分野（§2.6 条 1b）。
 * 读错（非 ENOENT——权限 / 目录等）收为 `invalid`（非抛错契约；`readManifest` 语义零改）。
 * @param {string} [target] 目标路径（目录 / 文件——动作作用于哪个项目的路径）
 * @returns {{state:'ok'|'missing'|'no-project'|'workspace'|'invalid', root:string|null, path:string|null,
 *   manifest?:object, candidates?:string[], errors?:string[], matched:'manifest'|'git'|null}}
 */
export function projectView(target) {
  const anchor = resolve(target ?? ".")
  const owning = owningProject(anchor, parse(anchor).root)
  if (owning) return viewAtRoot(owning, "manifest")
  const d = discoverProjects(anchor)
  if (d.kind === "workspace") return { state: "workspace", root: null, path: null, candidates: d.candidates, matched: d.matched }
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
 * `docRoot` 子键值 → **绝对路径数组**（F7 / §2.7 解析管线——全在本模块一处）：展开（串 /
 * 数组统一成列表）→ 逐元素 `trim` + `\` 归一 → `resolve(docRootBase(cwd), p)`（基数 =
 * 项目根，不回退原始 cwd）→ 去重（保序）。非法形态 → `[]`（零根——拒面在 `validateManifest`，
 * 本函数不判错；两处共用 `isValidDocRootValue`，判据单源）。`null`（本面无）⇒ `[]`（**合法
 * 零根——非错**；#944 / KD-M1-37）。
 * @param {unknown} value docRoot 某子键的值（串 | 数组 | `null`）
 * @param {string} [cwd] 会话锚（基数由 docRootBase 解析为项目根）
 * @returns {string[]} 绝对路径（去重保序）
 */
export function docRootPaths(value, cwd) {
  if (!isValidDocRootValue(value)) return []
  if (value === null) return [] // 「本面无」（#944）：合法零根——非错（不展开、不报错）
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

/** #802（KD-M1-36）未知键告警去重 memo：档路径 → 上次观测键集（进程内）；读到零未知键即清该条。 */
const unknownKeysSeen = new Map()

/** 未知键诊断（#802 · 2026-10-23 改）：**不上界面**——只写 logEvent('manifest:unknown-keys')；同档同键集恰一次。 */
function warnUnknownKeys(file, unknownKeys) {
  if (unknownKeys.length === 0) { unknownKeysSeen.delete(file); return }
  const sig = JSON.stringify([...unknownKeys].sort())
  if (unknownKeysSeen.get(file) === sig) return
  unknownKeysSeen.set(file, sig)
  // 不上界面（2026-10-23 用户裁定：换别的项目也不能弹，不许骚扰用户）；只写诊断日志，`manifest read` 时才出现在结果里
  logEvent("manifest:unknown-keys", { path: file, keys: unknownKeys.join(",") })
}

/**
 * 读 cwd 根数据档（模块设计 §2.2）：读 + validateManifest(obj) → 缺键产
 * missingKeys（非拒）→ 补默认值 → 再校验通过。整档缺失 → { ok:false, reason:'missing' }
 * （绝不静默 fallback——KD-M1-2）；JSON 非法 / 顶层非对象 → reason:'invalid'。
 * @returns {{ok:boolean, manifest:object|null, missingKeys:string[], unknownKeys:string[], errors:string[], reason?:string}}
 */
export function readManifest(cwd) {
  let raw
  const file = manifestFilePath(cwd) // #802：档路径单点（读 / 告警 memo 同源）
  try {
    raw = readFileSync(file, "utf8")
  } catch (e) {
    if (e.code === "ENOENT") {
      return { ok: false, reason: "missing", errors: [], missingKeys: [], unknownKeys: [], manifest: null }
    }
    throw e // 权限/目录等其他读错——fail-closed 上抛，不伪装成缺失
  }
  let obj
  try {
    obj = JSON.parse(raw)
  } catch {
    return { ok: false, reason: "invalid", errors: [`${MANIFEST_REL} 不是合法 JSON`], missingKeys: [], unknownKeys: [], manifest: null }
  }
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, reason: "invalid", errors: ["manifest 顶层必须是 JSON 对象"], missingKeys: [], unknownKeys: [], manifest: null }
  }
  const first = validateManifest(obj)
  warnUnknownKeys(file, first.unknownKeys) // #802：读面单点告警（非拒——ok 定性零变）
  const manifest = fillDefaults(obj)
  const final = validateManifest(manifest)
  return { ok: final.ok, manifest, missingKeys: first.missingKeys, unknownKeys: first.unknownKeys, errors: final.errors, reason: final.ok ? undefined : "invalid" }
}

/**
 * 装配钩子入口（模块设计 §2.2）——同 readManifest(cwd)。ok:true 返回补默认值后的 manifest；
 * reason:'missing' 由调用方走**建档流**（**工程模式会话**口径——梯②⑤ 就地建档，**不拒会话**；
 * KD-M1-29）；普通会话 = 装配钩子零 manifest I/O（KD-M1-12）。
 */
export function requireManifest(cwd) {
  return readManifest(cwd)
}

/** 建档（init 支）成功后的同步通知位（#1376——**反向注册**：`declaration.mjs` 已向依赖本模块，
 *  订阅方由对侧注册 ⇒ 本模块保持零出边（MANIFEST.md KD-M1-33）；形同 `config-io.mjs` `onConfigSelfWrite`
 *  ——返回退订函数；订阅方失败不影响建档）。 */
const manifestInitFns = new Set()
export function onManifestInit(fn) {
  if (typeof fn !== "function") return () => {}
  manifestInitFns.add(fn)
  return () => { manifestInitFns.delete(fn) }
}

/**
 * 入口决策树（**非抛错**形态——KD-M1-20；docs/core/design/MANIFEST.md §2.8 F1）：三面共用——
 * ① CLI 装配 / 重估薄包装 ② VSC `hydrateRun` 钩子块 ③ 翻转面（`eng` 工具 / `/eng` /
 * `/session` / ACP——「先判后翻」，拒翻分支零副作用）。判据树只此一处（判据单源——KD-M1-8
 * 同族）；读侧解析与状态归位 = `projectView`（KD-M1-24——非抛错 / 零写）。
 *
 * 分支（两分支六出口——§2.8 F1 树）：
 *   档合法         → { ok:true, manifest, created:false }（manifest = 补默认值后的档内容）
 *   缺档 + init    → 梯②⑤（锚 = 裸仓 / 无项目）⇒ `initManifest(cwd, { writer })`
 *                    （抛错 → `init-failed`）；工作区（锚自身无档 ∧ 下辖 ≥1 项目——1 ∥ 更多同判）⇒
 *                    `{ ok:false, code:'workspace', message, candidates }`（**不建 / 不猜**）
 *   缺档 + !init   → 梯⑤（无项目）⇒ `{ ok:false, code:'no-project' }`（KD-M1-28；`init:false` 面）；
 *                    梯②（裸仓可解析、档缺）⇒ `{ ok:false, code:'missing' }`；工作区 ⇒ 同上
 *   档非法         → { ok:false, code:'invalid', message, errors }
 *
 * `writer` 由调用点**显式**传（生产调用点全传 `'main'`）：缺省 `'subagent'` 是写门 fail-closed
 * 缺省（KD-M1-3），误用缺省 ⇒「缺档 + 梯②⑤」退化为 `init-failed`（拒翻——与 §2.8 F2 /
 * AC-20② 语义相反；T38 反证格）。
 * 态码文案分野（KD-M1-28）：无项目 ⇒ 可在锚处落地 / 工作区 ⇒ 报明事实 + 点名项目根；文案族 =
 * 「项目不可解析」（稳定锚句 `/项目不可解析/`）——**仅「档非法」格**（§2.8 F2 拒翻面唯一拒格）。
 * 边界：`readManifest` 的非 ENOENT 读错（权限 / 目录等）由 `projectView` 收为 `invalid`（非抛错
 * 契约——`readManifest` 返回语义零改）；本树只承诺上列六出口。
 * @param {string} [cwd] 会话锚（缺省 → 进程 cwd）
 * @returns {{ok:true, manifest:object, created:boolean}
 *   | {ok:false, code:'missing'|'invalid'|'no-project'|'workspace'|'init-failed',
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
  if (view.state === "workspace") {
    return { ok: false, code: "workspace", candidates: view.candidates, message: workspaceProjectMessage(cwd, view.candidates) }
  }
  // 缺档（梯②⑤）：init ⇒ 就地建档（内容 = DEFAULT_MANIFEST，经写门 writer:'main'）；!init ⇒ 归码。
  if (!init) return { ok: false, code: view.state === "no-project" ? "no-project" : "missing" }
  try {
    const manifest = initManifest(cwd, { writer })
    // #1376：建档支成功 ⇒ 同步广播（进程内声明 ∥ 范围缓存即刻随动——如 eng 翻转面结束后
    // 同进程的声明复读；订阅方失败不阻断建档；失败路径不广播）。
    for (const fn of manifestInitFns) { try { fn() } catch (e) { console.warn(`[manifest] init subscriber failed: ${e?.message ?? e}`) } }
    return { ok: true, manifest, created: true }
  } catch (e) {
    return { ok: false, code: "init-failed", message: e?.message ?? String(e) }
  }
}

/** 工作区消息（**事实行**——§2.5「单项目解析律」条 / §2.8 F2 工作区行）：念明下辖项目**全列**
 *  （绝对路径、按名排序）+ 可执行下一步（点名项目根 / 目标路径）——报明事实，非错误框定
 *  （不书「项目不可解析」/ 候选二义）。 */
function workspaceProjectMessage(cwd, candidates) {
  const list = (candidates ?? []).map((c) => `- ${c}`).join("\n")
  return `工作区：会话锚 ${cwd} 自身无 ${MANIFEST_REL}，下辖 ${(candidates ?? []).length} 个项目（下列全部）——` +
    `每个项目一份 ${MANIFEST_REL}；请显式给出目标项目根或目标路径（动作按用点路径解析）：\n${list}`
}

/**
 * 写门落盘（模块设计 §2.2 / KD-M1-3）：仅 writer === 'main' 放行（fail-closed 缺省拒）；
 * 落盘前先 validateManifest(manifest)（ok:false → 拒落盘，防写非法档）。
 * 不替被开发项目创建目录（§1.4 边界）——cwd 不存在时写失败自然上抛。
 * @returns {object} 传入的 manifest（校验通过后原样落盘）
 */
/** 已退役的顶层键（FR42 八键 → 五键）：写入时静默丢弃——它们不是用户拼错，是产品自己退场的键，
 *  留着只会让读面反复报「未知键」骚扰用户（2026-10-23 用户裁定「死键你删掉啊」）。 */
const RETIRED_KEYS = ["promptsLanding", "checkConfig", "advisor"]

/** 返回去掉退役键的新对象（不改入参）。 */
function stripRetiredKeys(obj) {
  const out = { ...obj }
  for (const k of RETIRED_KEYS) delete out[k]
  return out
}

export function writeManifest(cwd, manifest, { writer = "subagent" } = {}) {
  if (writer !== "main") {
    throw new Error("writeManifest 拒绝：非主 agent 无写权（writer 须为 \"main\"，fail-closed 缺省拒）")
  }
  const cleaned = stripRetiredKeys(manifest)
  const validated = validateManifest(cleaned)
  if (!validated.ok) {
    throw new Error(`writeManifest 拒绝：manifest 校验不过——${validated.errors.join("；")}`)
  }
  writeFileSync(manifestFilePath(cwd), JSON.stringify(cleaned, null, 2) + "\n")
  return cleaned
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
