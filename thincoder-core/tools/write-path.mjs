/**
 * tools/write-path.mjs — 核内**单一写路径点**（编辑器编辑径注入缝——CORE-UNIFICATION §2.13.5）。
 *
 * 缺口（本档存在的原因）：宿主侧对「编辑器里打开着的文件」有专门处理——先 `applyEdit`
 * 再保存。不保存会让缓冲变脏而磁盘仍旧 ⇒ 下一次编辑撞上我们自己的 isDirty 护栏，外部
 * 写入又与用户随后的保存互相竞写（split-brain 数据丢失）。核内原先写盘直调
 * `node:fs/promises`、散在 5 个档的 8 个写点上 ⇒ **没有可注入的一跳** ⇒ 端侧接核后会
 * 丢掉编辑器径。本模块就是那一跳：核内**工具面的 8 个编辑写点**全改调 `writeThroughPath`
 * （模型面直写 `agent-tools/batch-segment.mjs` = 设计登记的 S2 前置门 · `tools/checklist-sync.mjs`
 * = 已登记豁免——两者不在本缝覆盖面；口径与 `CORE-UNIFICATION.md` §2.13.5 落地收正同源）。
 *
 * 默认径 = CLI 语义（**零行为变**）：`writeFile` + 记账。端侧
 * `configureWritePath({ openDoc, applyEdit, isDirty })` 覆盖 ⇒ 编辑器径；**缺省不覆盖**。
 * 核内**零端名分支**（契约 5——本档只认三个函数名，不出现任何端名）。
 *
 * 记账面（dirty-file tracking）**同源住本档**：核内写盘只此一处 ⇒ 记账面只此一处（Map/Set +
 * 函数）。默认径的记账由本档代落——`meta.record` ⇒ `recordWrite`、`op="delete"` ⇒ `markDirty`；
 * 调用方不再自行 `recordWrite` / `markDirty`（**不重复记账**）。**唯一例外 = apply_patch 的批级
 * 记账**（两段式全部成功后由调用方一次 `markDirty`——批级语义，与改前逐字同）。`file.mjs` 只做
 * 再导出，保既有 import 面稳定（模块拆分写优先纪律）。
 */
import { writeFile, unlink, rename, cp, rm } from "node:fs/promises"

/** apply_patch 两段式的暂存后缀（单点定义——阶段一落暂存档、阶段二提交、失败清理均用它）。 */
export const TMP_SUFFIX = ".thincoder-tmp"

// ────────────────────────────────────────
// 记账面（read-before-insert 护栏的数据源）
// ────────────────────────────────────────
// insert_after 以行号为锚——最易漂移的定位方式。每个写点把文件标记为 dirty；
// insert_after 拒绝在 dirty 文件上运行，直到模型重新 read（拿到新行号）。
const dirtyPaths = new Set()
export function markDirty(abs) { dirtyPaths.add(abs) }
export function clearDirty(abs) { dirtyPaths.delete(abs) }
export function isDirty(abs) { return dirtyPaths.has(abs) }

// 写入工具记录受影响行范围——insert_after 精确判定：after_line 在未受影响区
// （< lastWrite.startLine）→ 行号未漂移 → 允许；受影响区内 → 拒绝（护栏保留）；
// write 全文重写 → 全文件受影响，任何 after_line 拒绝。
const lastWrites = new Map() // abs → { type: 'write'|'edit'|'insert', startLine, shift }
export function recordWrite(abs, write) {
  lastWrites.set(abs, write)
  dirtyPaths.delete(abs) // 本 session 写入——等效于刚 read 过（快照在 lastWrites）
}
export function lastWriteOf(abs) { return lastWrites.get(abs) }
export function clearLastWrite(abs) { lastWrites.delete(abs) }

// ────────────────────────────────────────
// 注入面（端侧编辑器径）
// ────────────────────────────────────────

let injected = null

/**
 * 覆盖默认写路径（**端装配层**调用；核内不调用——缺省不覆盖）。
 *
 * @param {{openDoc?: (abs: string) => any, isDirty?: (doc: any) => boolean,
 *          applyEdit?: (doc: any, content: string, meta: object) => Promise<void>}|null} impl
 *   · `openDoc(abs)` → doc | null   该路径是否被宿主打开（**每个写点都会问一次**——门禁面）
 *   · `isDirty(doc)` → boolean      打开且脏 ⇒ 拒写（split-brain 护栏，**所有写点一律适用**）；
 *     **给了 `applyEdit` 就必须给 `isDirty`**（否则抛配置错——否则 = 静默退化为无护栏编辑器径）
 *   · `applyEdit(doc, content, meta)` → 端侧应用并落盘（内容写点专用——`applyEdit` + save）；
 *     返回 **null** = 未处理 ⇒ 回退默认径（§2.13.5 契约；返回其他值 = 已处理）
 * 传 null / 非对象 ⇒ 撤销注入（回默认 fs 径）。
 */
export function configureWritePath(impl) {
  injected = impl && typeof impl === "object" ? impl : null
}

/** 撤销注入（测试与端装配生命周期用——缺省态 = 默认 fs 径）。 */
export function resetWritePath() { injected = null }

/** 脏缓冲拒写文案（**端中立**——与宿主侧现措辞同句；S2 接线后用户可见文案由本条统一）。 */
export const dirtyRefusalMessage = (abs) =>
  `File has unsaved changes in the editor: ${abs}. Save or discard before allowing automated edits.`

/**
 * 门禁单点（src 面与 dest 面共用——每面各问一次 `openDoc`）：
 * fail-closed（给了 `applyEdit` 却没给 `isDirty` ⇒ 脏态不可知 ⇒ 抛配置错，不静默退化为
 * 无护栏编辑器径）；打开且脏 ⇒ 抛端中立拒写文案（split-brain 护栏）。
 * @returns doc | null（未打开 ⇒ null——该面无门禁）
 */
function gateOpenDoc(impl, abs) {
  const doc = impl.openDoc(abs)
  if (!doc) return null
  if (typeof impl.applyEdit === "function" && typeof impl.isDirty !== "function") {
    throw new Error("writeThroughPath: injection provides applyEdit without isDirty — refusing to write to an open file whose dirty state is unknown")
  }
  if (typeof impl.isDirty === "function" && impl.isDirty(doc)) throw new Error(dirtyRefusalMessage(abs))
  return doc
}

/**
 * 试注入面：命中 ⇒ 编辑器径（`{ written: true, via: "editor" }`）；未处理 ⇒ null（回默认）。
 * 未打开（`openDoc` 返回假值）/ 无注入面 / 非内容写点 ⇒ 未处理。
 * **dest 面门禁**（move / rename 的覆盖面——父侧裁定补丁）：路径操作会覆盖目标档 ⇒
 * 目标档与源档**同过门禁**（覆盖「编辑器打开且脏」的目标档 = 直接吞掉用户缓冲，
 * 与 src 面同源 split-brain 风险）⇒ 拒写。src 未打开**不豁免** dest 门（两面各问一次）。
 * copy 不写 src、覆 dest——本补丁按裁定范围只覆盖 move / rename（copy 面登记见交付报告）。
 */
async function tryInjectedPath(abs, content, meta) {
  const impl = injected
  if (!impl?.openDoc) return null
  const op = meta.op ?? "write"
  const doc = gateOpenDoc(impl, abs) // 每个写点都问一次（门禁面——见 configureWritePath）
  if ((op === "move" || op === "rename") && typeof meta.dest === "string" && meta.dest.length > 0) {
    gateOpenDoc(impl, meta.dest) // dest 面过门禁（覆盖目标档——与 src 同源拒写判据）
  }
  // 编辑器径只承载**内容写点**（op="write"）；delete / 路径操作（copy/move/rename）与
  // commit（默认径两段式的收尾）无端侧载体 ⇒ 门禁过后回默认径。
  if (!doc || op !== "write") return null
  if (typeof impl.applyEdit !== "function") return null
  const handled = await impl.applyEdit(doc, content, meta)
  if (handled === null) return null // 契约：null = 未处理 ⇒ 回退默认径（防“报成功但无落盘”）
  if (meta.record) recordWrite(abs, meta.record) // 编辑器径同样是「我们写的」——记账同源
  return { written: true, via: "editor" }
}

/**
 * 默认径（无注入面 / 注入面未处理）——**CLI 语义，零行为变**。
 *
 * meta:
 *   · `op`     "write"（默认）| "delete" | "copy" | "move" | "rename" | "commit"
 *   · `record` op="write"：写后记账快照（recordWrite 第二参——受影响区）
 *   · `dest`   op ∈ {copy, move, rename}：目标绝对路径
 *   · `stage`  op="write"：落到 `<abs>.thincoder-tmp`（**不提交、不记账**）——apply_patch
 *              阶段一；提交由阶段二 `op="commit"` 收口（两段式原子保持）。**注入径例外**：
 *              编辑器径无暂存档（即时提交）——此时 stage 写直接落目标档并返回
 *              `via:"editor"`，调用方须读 `via` 决定是否跳过 `op="commit"`（apply_patch 已如此）
 */
async function defaultPath(abs, content, meta) {
  const op = meta.op ?? "write"
  switch (op) {
    case "write": {
      if (meta.stage) {
        await writeFile(abs + TMP_SUFFIX, content, "utf8")
        return { written: true, via: "staged" }
      }
      await writeFile(abs, content, "utf8")
      if (meta.record) recordWrite(abs, meta.record)
      return { written: true, via: "fs" }
    }
    case "commit": {
      await rename(abs + TMP_SUFFIX, abs)
      return { written: true, via: "committed" }
    }
    case "delete": {
      await unlink(abs)
      markDirty(abs)
      return { written: true, via: "fs" }
    }
    case "copy": {
      await cp(abs, meta.dest, { recursive: true, force: true })
      return { written: true, via: "fs" }
    }
    case "move":
    case "rename": {
      // move 与 rename 共享 rename 系统调用；跨设备 move 回退 copy + rm（既有语义）。
      try {
        await rename(abs, meta.dest)
      } catch (e) {
        if (e?.code !== "EXDEV") throw e
        await cp(abs, meta.dest, { recursive: true, force: true })
        await rm(abs, { recursive: true, force: true })
      }
      return { written: true, via: "fs" }
    }
    default:
      throw new Error(`writeThroughPath: unknown op "${op}"`)
  }
}

/**
 * 核内**单一写路径点**——全部工具写点经此落盘。
 *
 * @param {string} abs 目标绝对路径
 * @param {string|null} content 写入内容（op="write" 必填；delete / copy / move / rename 传 null）
 * @param {object} [meta] 见 defaultPath 的字段表
 * @returns {Promise<{written: boolean, via: "editor"|"fs"|"staged"|"committed"}>}
 *   `via` = 实际落盘径（"editor" = 注入面已提交；"staged" = 已落暂存待 `op="commit"`）；
 *   `via:"editor"` 与 `meta.stage` 组合 = 编辑器径已直接提交目标档（无暂存档）
 */
export async function writeThroughPath(abs, content, meta = {}) {
  // `op="commit"` = 默认径两段式的收尾（暂存档 → 目标）——编辑器径是即时提交、不产生暂存
  // 档 ⇒ 无端侧载体，不再问注入面（避免无意义的门禁调用；目标档的门禁已在 staging 问过）。
  if ((meta.op ?? "write") !== "commit") {
    const handled = await tryInjectedPath(abs, content, meta)
    if (handled) return handled
  }
  return await defaultPath(abs, content, meta)
}
