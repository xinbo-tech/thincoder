/**
 * rc-resolve.mjs — `/rc/` 解析钩子（**非用例档** ⇒ 不入 `test/files.mjs`；由 `test/run.mjs` 以 `--import` 预载
 * —— `node --test` 的测试文件进程同生效）。
 * 渲染面经 `app://desktop/rc/**` **第二根**取核件（同源绝对路径 —— `docs/render-core/design/RENDER-CORE.md` §1.3
 * 「桌面端加载形」；`test/guard-closure.test.mjs` `/rc/` 前缀白名单同源）。平 node 无该 origin ⇒ 本钩子把
 * `/rc/<子路径>` 解析到 `@thincoder/render-core` 包根（**包名解析单源** = `package.json`，与生产主进程
 * `protocol.mjs` 的 `CORE_ROOT` 同址同法）——渲染档在测试与生产下走同一份核件。
 * 射程说明：测试文件自身 spawn 的第三方子进程（如 `spawnSync(process.execPath, …)`）**不**承袭本钩子。
 * 生产侧同形——app 主进程装载 `renderer/i18n.mjs`（node-safe 档：零 `/rc/` 静态导入 ⇒ 不经本钩子；
 * 判据单源 = `docs/desktop/design/SHELL.md` §1「node-safe 子集」）：本钩子射程 = **测试进程内**渲染档取件
 * （含渲染档 import 的核件面）。
 */
import { createRequire, registerHooks } from "node:module"
import { dirname, join } from "node:path"
import { pathToFileURL } from "node:url"

const coreRoot = dirname(createRequire(import.meta.url).resolve("@thincoder/render-core/package.json"))

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("/rc/")) {
      return { url: pathToFileURL(join(coreRoot, specifier.slice(4))).href, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})
