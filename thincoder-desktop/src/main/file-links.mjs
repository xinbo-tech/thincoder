/**
 * file-links.mjs — 验存文件链接（「对齐第三批」相抵② · KD-39；**R2 上提后 = 核件单源 + 端侧探针注入**）。
 *
 * **R2 上提（处理流批 · 2026-09-28）**：解析纯函数（路径 token ∕ 去重 ∕ 封顶 ∕ 盘上存在闸判据）上提
 * 核件 `@thincoder/core/file-links.mjs`（单源——原「多实现面各自落地」句随上提失效；设计档收正归设计面轮）；本档只留端胶水：
 * ① `extractFileLinks(cwd, text)` = 核件 + **`node:fs` 探针端侧注入**（`existsSync` ∕ `statSync` 同名面）；
 * ② `fileOpenTarget(payload)` = `file:open` 载荷的纯判据（路径串合格性 —— `ipc.mjs` 出口消费）——保留端侧。
 * 判据 = **盘上存在闸**（存在 ∧ 是文件）：路径 token 只在真实存在时才成链接 —— URL / 日志噪音 /
 * 版本号恒不成链接（存在检查 = 最后一道闸）。
 * 纪律：零第三方依赖（`node:fs` / `node:path`）；渲染面零 fs（KD-10 端侧零自写盘）——本档只读盘面事实。
 */
import { existsSync, statSync } from "node:fs"
import { isAbsolute } from "node:path"
import { MAX_LINKS, extractFileLinks as extractFileLinksCore } from "@thincoder/core/file-links.mjs"

/** 逐结果封顶（re-export 核件单源 —— 值同源 = VSC 同档 `MAX_LINKS`）。 */
export { MAX_LINKS }

/** 工具结果文本 ⇒ 验存文件链接（去重 + 封顶）——核件语义 + `node:fs` 端侧探针注入。
 *  `cwd` = 项目根（相对 token 的解析基）；缺 / 空 ⇒ 相对 token 一律不检（不落 `process.cwd()`
 *  第二解析基 —— 零假链接）；绝对 token 与 cwd 无关，照检。返回 `[{ raw, path, line }]`。 */
export function extractFileLinks(cwd, text) {
  return extractFileLinksCore(cwd, text, { existsSync, statSync })
}

/** `file:open` 载荷判据（纯函数 · 零抛）：`path` = 非空**绝对**串 ⇒ 原样；否则 `null`（调用面出 `bad-path`）。
 *  绝对性判据（`isAbsolute`）= 契约「盘上绝对路径（验存件）」（`docs/desktop/design/IPC.md` §2 `file:open` 行）——
 *  相对串零静默拒（`shell.openPath` 会按主进程 cwd 解析 ⇒ 假目标）；
 *  `line` 本批不施加（`shell.openPath` 无行参 —— 载荷备用；端差登记 = `docs/desktop/design/UI.md` §1
 *  「本批注（对齐第三批 · 小修族）」相抵②）。 */
export function fileOpenTarget(payload) {
  const path = payload?.path
  return typeof path === "string" && path !== "" && isAbsolute(path) ? path : null
}
