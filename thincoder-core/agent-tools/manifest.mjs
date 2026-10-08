/**
 * agent-tools/manifest.mjs — `manifest` 工具：M1 项目状态档（`PROJECT-MANIFEST.json`）的
 * agent 侧读写出口（2026-10-08 · 台账 #1098；权威设计 = `docs/core/design/MANIFEST.md` §2.10）。
 *
 * 三动作（KD-M1-38）：
 *  - `read`  ⇒ `projectView(target)` 五态报明（稳定锚 `state=ok|missing|invalid|ambiguous|no-project`）；
 *              `ok` 态再 `readManifest(view.root)` 取细节面（`projectView` 面不含 `missingKeys` /
 *              `unknownKeys`）——**不抛**（缺档报明，非拒）。
 *  - `init`  ⇒ 缺档建默认档（`initManifest`——内容 = `DEFAULT_MANIFEST`）；**已带档 ⇒ 拒**
 *              （不覆盖——`initManifest` 本体无覆盖保护，工具面补此闸）。
 *  - `write` ⇒ **点改**：读现档 → 设节点 → 落盘（`writeManifest` 内先 `validateManifest`——
 *              编辑结果非法 ⇒ 拒 + 盘零变）；**缺档 ⇒ 拒** + 引导 `init`（写不建档）。
 *
 * 写面白名单（判据单源 = `MANIFEST_SCHEMA`——钉死谓词）：`keys` 中**非** `nestedKeys` 父键者
 * （`version` / `phase` / `promptsLanding` / `codePaths` 整键）+ `nestedKeys` 子键
 * （`docRoot.*` / `checkConfig.*` / `index.*`（含 `publicRepos`）/ `advisor.*`）；**四族整键写
 * （传整个对象）⇒ 拒**；白名单外 ⇒ 拒（拼写保护——未知键写盘 = 静默死键，KD-M1-36 问题本体）。
 * `value` 解析 = 同款口径 `settings.mjs:216-228`（先 `JSON.parse`，失败取字面串；`"null"` ⇒ `null`
 * ——`docRoot.*` 的「本面无」，KD-M1-37）。
 *
 * 目标面（KD-M1-39——判据复用零新解析器）：`read` = `projectView`；`init` / `write` =
 * `projectRootView`（歧义 ⇒ 拒 + 候选全列——不猜）；`resolveProjectRoot` 对歧义塌缩 `null` 再回落 cwd
 * ⇒ 写 / 建两动作**不得**直用。
 *
 * 写路径复用（零新写路径）：落盘恒经 `writeManifest` / `initManifest`——`writer` 恒显式 `'main'`
 * （缺省 `'subagent'` = 写门 fail-closed 缺省，KD-M1-3 / AC-M1-5 零改）。
 *
 * 报告面随动（KD-M1-40）：本工具**不写** `agent.manifest`（第二值源否——工具目标可为非锚项目）——
 * 写盘 = 盘面变化，情境行经既有 ③b mtime 门控于下回合采纳（`agent/setup-reminders.mjs`）。
 */
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { MANIFEST_REL, MANIFEST_SCHEMA, initManifest, projectRootView, projectView, readManifest, writeManifest } from "../manifest.mjs"
import { DESC } from "../tools/shared.mjs"

/** 拒面统一前缀（设计 §2.10：`manifest <action>: refused — …`）——盘零变类拒绝一律经此抛错。 */
function refuse(action, reason) {
  return new Error(`manifest ${action}: refused — ${reason}`)
}

/** `target` 解析（先例 `eng.mjs:81` 缺省会话锚 ∥ `git.mjs:32-35` 相对形归一）：缺省 = 会话锚
 *  （`ctx.agent.cwd ?? ctx.cwd ?? process.cwd()`）；显式相对形按会话锚归一（绝对形原样）。 */
function resolveTarget(args, ctx) {
  const base = ctx?.agent?.cwd ?? ctx?.cwd ?? process.cwd()
  return args?.target ? resolve(base, String(args.target)) : resolve(base)
}

/** 写面白名单谓词（**钉死**——设计 §2.10）：点分路径恰两形——
 *  ① 单段：`keys` ∩ ∉ `nestedKeys`（= `version` / `phase` / `promptsLanding` / `codePaths` 整键）；
 *  ② 双段：`nestedKeys[父]` 含子键（四族子键）；其余（四族整键写 / 未知键 / 更深路径）⇒ 拒。
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

/** `value` 解析（同款口径 = `settings.mjs:216-228`）：先 `JSON.parse`（`"null"` ⇒ `null`；数值 /
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

/** 歧义拒文案（候选全列——不猜；init / write 共用）：多候选 = 显式指定 target，机制不代选。 */
function ambiguousReason(target, candidates) {
  return `ambiguous target ${target} — ${candidates.length} candidate projects (the mechanism never picks one); pass target explicitly:\n` +
    candidates.map((c) => `- ${c}`).join("\n")
}

/** read 动作（五态报明——**不抛**）：`state=` 稳定锚 + 各态附行（ok 细节面 / missing 引导 /
 *  ambiguous 候选全列 / invalid 错误行）。 */
function readAction(target) {
  const view = projectView(target)
  const lines = [`state=${view.state}`]
  if (view.path) lines.push(`path=${view.path}`)
  if (view.state === "ok") {
    const m = readManifest(view.root) // 细节面：missingKeys / unknownKeys / errors（非空才出）
    lines.push(`manifest=${JSON.stringify(m.manifest)}`)
    if (m.missingKeys?.length) lines.push(`missingKeys=${m.missingKeys.join(", ")}`)
    if (m.unknownKeys?.length) lines.push(`unknownKeys=${m.unknownKeys.join(", ")}`)
    if (m.errors?.length) lines.push(`errors=${m.errors.join("；")}`)
  } else if (view.state === "missing") {
    lines.push(`hint: run manifest action=init to create the default manifest here`)
  } else if (view.state === "no-project") {
    lines.push(`hint: no project on the ancestor chain and none below — manifest action=init can create one at the target`)
  } else if (view.state === "ambiguous") {
    lines.push(`candidates (${(view.candidates ?? []).length}):`)
    for (const c of view.candidates ?? []) lines.push(`- ${c}`)
    lines.push(`hint: pass target explicitly — the mechanism never picks one`)
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
      target: { type: "string", description: "Explicit target directory — defaults to the session anchor; relative paths resolve against it. Ambiguous targets are refused with the full candidate list (never picks one)." },
      key: { type: "string", description: "(write) Dot path of the node to set — version / phase / promptsLanding / codePaths, or a sub-key of docRoot / checkConfig / index / advisor (e.g. docRoot.design / index.publicRepos / advisor.docMap); whole-object writes of those four families are refused", },
      value: { type: "string", description: "(write) New value — parsed as JSON first (null / true / 5 / [\"a\"]), otherwise kept as a literal string; \"null\" is the explicit no-such-face for docRoot.<key>" },
    },
    required: ["action"],
  },
  readonly: false, // 动作级分类（dispatch-gates `isSubagentReadonlyAction`）：read = 只读类；init / write 保持侧效门
  async execute(args, ctx) {
    const action = args?.action
    if (!["read", "init", "write"].includes(action)) {
      throw new Error(`manifest: action must be one of read/init/write — got ${JSON.stringify(action)}`)
    }
    const target = resolveTarget(args, ctx)

    if (action === "read") return readAction(target)

    // init / write：目标面 = `projectRootView`（歧义直读形——不猜；KD-M1-39）
    const rootView = projectRootView(target)
    if (rootView.state === "ambiguous") {
      throw refuse(action, ambiguousReason(target, rootView.candidates))
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
      throw refuse("write", `key "${key}" is not writable — writable nodes: version / phase / promptsLanding / codePaths + sub-keys of docRoot / checkConfig / index / advisor (whole-object writes of the four families are refused)`)
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
    return `manifest write: set ${key} = ${JSON.stringify(value)}\npath=${file}`
  },
}
