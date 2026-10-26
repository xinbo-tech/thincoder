/**
 * agent-tools/manifest.mjs — `manifest` 工具：M1 项目状态档（`PROJECT-MANIFEST.json`）的
 * agent 侧读写出口（2026-10-08 · 台账 #1098；权威设计 = `docs/core/design/MANIFEST.md` §2.10）。
 *
 * 三动作（KD-M1-38）：
 *  - `read`  ⇒ `projectView(target)` 五态报明（稳定锚 `state=ok|missing|invalid|workspace|no-project`）；
 *              `ok` 态再 `readManifest(view.root)` 取细节面（`projectView` 面不含 `missingKeys` /
 *              `unknownKeys`）——**不抛**（缺档报明，非拒）。
 *  - `init`  ⇒ 缺档建默认档（`initManifest`——内容 = `DEFAULT_MANIFEST`）；**已带档 ⇒ 拒**
 *              （不覆盖——`initManifest` 本体无覆盖保护，工具面补此闸）。
 *  - `write` ⇒ **点改**：读现档 → 设节点 → 落盘（`writeManifest` 内先 `validateManifest`——
 *              编辑结果非法 ⇒ 拒 + 盘零变）；**缺档 ⇒ 拒** + 引导 `init`（写不建档）。
 *
 * 写面白名单（判据单源 = `MANIFEST_SCHEMA`——钉死谓词）：**12 个可写节点** = `keys` 中**非** `nestedKeys`
 * 父键者（`version` / `phase` / `codePaths` 整键）+ `nestedKeys` 子键（`docRoot.*` 五子键 / `index.*` 四子键）；
 * **两族整键写（传整个对象）⇒ 拒**；白名单外 ⇒ 拒（拼写保护——未知键写盘 = 静默死键，KD-M1-36 问题本体）。
 * `value` 解析 = 同款口径 `settings.mjs` 的 `parseValue`（先 `JSON.parse`，失败取字面串；`"null"` ⇒ `null`
 * ——`docRoot.*` 的「本面无」，KD-M1-37）。
 *
 * 目标面（KD-M1-39——判据复用零新解析器）：`read` = `projectView`；`init` / `write` =
 * `projectRootView`（工作区 ⇒ 拒 + 下辖项目全列 + 显式 `target` 指引）；`resolveProjectRoot` 对
 * 工作区塌缩 `null`（**回落发生在调用方 `writeRoot`，非本函数**）⇒ 写 / 建两动作**不得**直用。
 *
 * 写路径复用（零新写路径）：落盘恒经 `writeManifest` / `initManifest`——`writer` 恒显式 `'main'`
 * （缺省 `'subagent'` = 写门 fail-closed 缺省，KD-M1-3 / AC-M1-5 零改）。
 *
 * 报告面随动（KD-M1-40）：本工具**不写** `agent.manifest`（第二值源否——工具目标可为非锚项目）——
 * 写盘 = 盘面变化，情境行经既有 ③b mtime 门控于下回合采纳（`agent/setup-reminders.mjs`）。
 *
 * 缓存失效（#1367 面⑦）：写档成功（init ∥ write——全部成功路径）⇒ `clearDeclarationCache()`——
 * 「补档即回归」进程内即时（声明 ∥ 范围缓存同清）；失败路径不清（盘零变 ⇒ 缓存照旧）；
 * 手工改档 ⇒ 重启生效（零文件侦听）。
 *
 * 只读变体（`manifestReadTool`——2026-10-22 · 台账 #1738）：子代理面同名 `manifest`，`action` 枚举只剩
 * `read`（schema 级不可达 = 权限面第一道）+ execute 入口机械拒绝（第二道，providers 不强制 schema enum）；
 * `readAction` 的 `canInit=false` 让缺档 / 无项目两态的引导行不指 `init`。全量工具 `manifestTool` 零改
 * （`readonly: false` = 动作级分类面，只读性归 `dispatch-gates` 的 `read` 判定）。
 */
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { MANIFEST_REL, MANIFEST_SCHEMA, initManifest, projectRootView, projectView, readManifest, writeManifest } from "../manifest.mjs"
import { DESC } from "../tools/shared.mjs"
import { clearDeclarationCache } from "../conventions.mjs" // #1367 面⑦：写档成功 ⇒ 缓存失效（fix 轮接线）

/** 拒面统一前缀（设计 §2.10：`manifest <action>: refused — …`）——盘零变类拒绝一律经此抛错。 */
function refuse(action, reason) {
  return new Error(`manifest ${action}: refused — ${reason}`)
}

/** `target` 解析（先例 `eng.mjs` 的 `resolveEngineeringManifest` 缺省会话锚 ∥ `git.mjs` 的 `resolveBaseDir` 相对形归一）：缺省 = 会话锚
 *  （`ctx.agent.cwd ?? ctx.cwd ?? process.cwd()`）；显式相对形按会话锚归一（绝对形原样）。 */
function resolveTarget(args, ctx) {
  const base = ctx?.agent?.cwd ?? ctx?.cwd ?? process.cwd()
  return args?.target ? resolve(base, String(args.target)) : resolve(base)
}

/** 写面白名单谓词（**钉死**——设计 §2.10）：点分路径恰两形——
 *  ① 单段：`keys` ∩ ∉ `nestedKeys`（= `version` / `phase` / `codePaths` 整键）；
 *  ② 双段：`nestedKeys[父]` 含子键（两族子键）；其余（两族整键写 / 未知键 / 更深路径）⇒ 拒。
 *  `Array.isArray` 守卫：原型链名（`__proto__` / `constructor` / `toString` 类）取到非数组 ⇒ 落拒面
 *  （不得 TypeError 直出——白名单外一律 `refused` 统一前缀）。 */
function isWritableKey(key) {
  const segs = String(key).split(".")
  if (segs.length === 1) return MANIFEST_SCHEMA.keys.includes(segs[0]) && !Object.hasOwn(MANIFEST_SCHEMA.nestedKeys, segs[0])
  if (segs.length === 2) {
    const subs = MANIFEST_SCHEMA.nestedKeys[segs[0]]
    return Array.isArray(subs) && subs.includes(segs[1])
  }
  return false
}

/** `value` 解析（同款口径 = `settings.mjs` 的 `parseValue`）：先 `JSON.parse`（`"null"` ⇒ `null`；数值 /
 *  布尔 / 数组皆 JSON 形），失败取字面串（裸串如 `docs/design`）。 */
function parseValue(raw) {
  const s = String(raw)
  try { return JSON.parse(s) } catch { return s }
}

/** 点分路径设值（自动建中间对象——settings `setKeyPath` 同款；白名单谓词已保父段为已知族）。 */
function setKeyPath(obj, path, value) {
  const segs = String(path).split(".")
  let cur = obj
  for (let i = 0; i < segs.length - 1; i++) {
    if (cur[segs[i]] === null || typeof cur[segs[i]] !== "object") cur[segs[i]] = {}
    cur = cur[segs[i]]
  }
  cur[segs[segs.length - 1]] = value
}

/** 工作区拒文案（下辖项目全列 + 显式 `target` 下一步——init / write 共用；事实行，非二义框定）。 */
function workspaceReason(target, candidates) {
  return `${target} is a workspace holding ${candidates.length} projects — pass the project root explicitly via target:\n` +
    candidates.map((c) => `- ${c}`).join("\n")
}

/** read 动作（五态报明——**不抛**）：`state=` 稳定锚 + 各态附行（ok 细节面 / missing 引导 /
 *  workspace 下辖项目全列 / invalid 错误行）。
 *  `canInit`（缺省 `true` ⇒ depth-0 输出逐字零变）：`false` 时 `missing` / `no-project` 的引导行不指
 *  `init`——子代理面无该动作，指向不可达动作会把模型送进必然失败的调用。 */
function readAction(target, { canInit = true } = {}) {
  const view = projectView(target)
  const lines = [`state=${view.state}`]
  if (view.path) lines.push(`path=${view.path}`)
  if (view.state === "ok") {
    const m = readManifest(view.root) // 细节面：missingKeys / errors（非空才出）
    lines.push(`manifest=${JSON.stringify(m.manifest)}`)
    if (m.missingKeys?.length) lines.push(`missingKeys=${m.missingKeys.join(", ")}`)
    if (m.errors?.length) lines.push(`errors=${m.errors.join("；")}`)
  } else if (view.state === "missing") {
    lines.push(canInit
      ? "hint: run manifest action=init to create the default manifest here"
      : "hint: no manifest here — report it; creating one is a main-agent action")
  } else if (view.state === "no-project") {
    lines.push(canInit
      ? "hint: no project at this directory and none in the direct children — manifest action=init can create one at the target"
      : "hint: no project at this directory and none in the direct children — report it; creating one is a main-agent action")
  } else if (view.state === "workspace") {
    lines.push(`projects (${(view.candidates ?? []).length}):`)
    for (const c of view.candidates ?? []) lines.push(`- ${c}`)
    lines.push(`hint: pass target explicitly — the target must be one of the projects above`)
  } else if (view.state === "invalid") {
    if (view.errors?.length) lines.push(`errors=${view.errors.join("；")}`)
  }
  return lines.join("\n")
}

export const manifestTool = {
  name: "manifest",
  description: DESC("manifest"),
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["read", "init", "write"], description: "read — current manifest + validation state (five-state anchor, never throws); init — create the default manifest when missing (refused when one already exists); write — point-edit one node (key + value) of an existing manifest" },
      target: { type: "string", description: "Explicit target directory — defaults to the session anchor; relative paths resolve against it. A workspace target (several projects below it) is refused with the full project list — pass the project root you mean." },
      key: { type: "string", description: "(write) Dot path of the node to set — version / phase / codePaths, or a sub-key of docRoot / index (e.g. docRoot.design / index.publicRepos); whole-object writes of those two families are refused", },
      value: { type: "string", description: "(write) New value — parsed as JSON first (null / true / 5 / [\"a\"]), otherwise kept as a literal string; \"null\" is the explicit no-such-face for docRoot.<key>" },
    },
    required: ["action"],
  },
  readonly: false, // 动作级分类（dispatch-gates `isReadonlyAction`）：read = 只读类；init / write 保持侧效门
  async execute(args, ctx) {
    const action = args?.action
    if (!["read", "init", "write"].includes(action)) {
      throw new Error(`manifest: action must be one of read/init/write — got ${JSON.stringify(action)}`)
    }
    const target = resolveTarget(args, ctx)

    if (action === "read") return readAction(target)

    // init / write：目标面 = `projectRootView`（直读形——工作区不成目标；KD-M1-39）
    const rootView = projectRootView(target)
    if (rootView.state === "workspace") {
      throw refuse(action, workspaceReason(target, rootView.candidates))
    }

    if (action === "init") {
      const root = rootView.state === "ok" ? rootView.root : target // 梯⑤（无项目）⇒ 落点 = target 自身
      const file = join(root, MANIFEST_REL)
      if (existsSync(file)) {
        throw refuse("init", `${file} already carries a manifest — init never overwrites (use action=write to edit it)`)
      }
      try {
        initManifest(root, { writer: "main" }) // 落盘恒经写门（writer 闸 + 校验前闸——零新写路径）
      } catch (e) {
        throw refuse("init", `could not write the default manifest at ${file} — ${e?.message ?? String(e)}`)
      }
      clearDeclarationCache() // 写成功：补档 ⇒ 范围即回归（进程内——失败路径不清）
      return `manifest init: created default manifest (DEFAULT_MANIFEST)\npath=${file}`
    }

    // write：缺档 ⇒ 拒 + 引导 init（写不建档——多写权面唯一的建档动作 = init）
    if (rootView.state === "none") {
      throw refuse("write", `no project at ${target} — write requires an existing ${MANIFEST_REL}; run manifest action=init first (write never creates one)`)
    }
    const root = rootView.root
    const file = join(root, MANIFEST_REL)
    const key = args?.key
    if (!key) throw new Error("manifest write: key is required (dot path, e.g. docRoot.design)")
    if (args?.value === undefined) throw new Error("manifest write: value is required (JSON-parsed first, otherwise a literal string)")
    if (!isWritableKey(key)) {
      throw refuse("write", `key "${key}" is not writable — writable nodes: version / phase / codePaths + sub-keys of docRoot / index (whole-object writes of the two families are refused)`)
    }
    let current
    try {
      current = readManifest(root)
    } catch (e) {
      throw refuse("write", `could not read ${file} — ${e?.message ?? String(e)}`)
    }
    if (!current.ok) {
      if (current.reason === "missing") {
        throw refuse("write", `${file} does not exist — run manifest action=init first (write never creates one)`)
      }
      if (!current.manifest) {
        throw refuse("write", `${file} is not editable (fail-closed): ${(current.errors ?? []).join("；")}`)
      }
      // 现档可解析但校验非法：照常点改——编辑结果仍经落盘前 `validateManifest`（非法 ⇒ 拒 + 盘零变）
    }
    const value = parseValue(args.value)
    const manifest = current.manifest
    setKeyPath(manifest, String(key), value)
    try {
      writeManifest(root, manifest, { writer: "main" }) // 落盘前 validateManifest（编辑结果非法 ⇒ 拒 + 盘零变）
    } catch (e) {
      throw refuse("write", `the edited manifest fails the pre-write validation (disk unchanged) — ${e?.message ?? String(e)}`)
    }
    clearDeclarationCache() // 写成功：声明 ∥ 范围逐字随动（进程内——失败路径不清）
    return `manifest write: set ${key} = ${JSON.stringify(value)}\npath=${file}`
  },
}

/** 子代理只读变体（同名 `manifest`——action 枚举只剩 `read`）：init / write schema 级不可达（权限面第一道）；
 *  execute 入口再做一次机械拒绝（providers 不强制 schema enum——第二道）。 */
export const manifestReadTool = {
  name: "manifest",
  description: DESC("manifest-read"),
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["read"], description: "read — current manifest + validation state (five-state anchor, never throws)" },
      target: { type: "string", description: "Explicit target directory — defaults to the session anchor; relative paths resolve against it. A workspace target (several projects below it) is reported with the full project list — pass the project root you mean." },
    },
    required: ["action"],
  },
  readonly: true,
  async execute(args, ctx) {
    if (args?.action !== "read") {
      throw new Error(`manifest read: refused — this read-only variant exposes only action=read (got ${JSON.stringify(args?.action)})`)
    }
    return readAction(resolveTarget(args, ctx), { canInit: false })
  },
}
