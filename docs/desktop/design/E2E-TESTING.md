# 桌面端（DESKTOP）· 端到端测试基建（E2E）

**面**：测试基建（`thincoder-desktop/test/`）——本档是该面的单源设计。
**权威面**：真 Electron（真进程 / 真窗口 / 真 DOM）——本批判据钉死；web 快筛不作替代（本批判不做）。
**上位单源**：`docs/core/design/TESTING.md`（测试纪律 / 承载选型 / 单入口门禁 —— 本档**引用不重述**，D2）。
**本批**：`docs/batches/2026-09-26-desktop-e2e-infra.md`（§1 判据 · §2 批条目）。

## 1. 方案与理由

E2E 基建 = 在既有单入口测试骨架里**真启 Electron 应用**、驱动渲染面交互、把固定路径 PNG 落盘。四件东西定形：

**① 驱动 = `playwright-core`（devDependency）**。Electron 驱动住在该包内（`types/types.d.ts:19251` 导出 `_electron`），
且该包 registry 元数据 `scripts` / `dependencies` 两字段缺省（无 postinstall、不下载浏览器 · 自身零依赖）—— 安装不触代理面、不引浏览器二进制。
依据（as-of 2026-09-27 · 发行包 tarball `1.63.0` 与 registry 直读四项：`_electron` 导出 · `scripts` 缺省 · `dependencies` 缺省 · 现版 `1.63.0`）；**运行期可达性 = 实施首步实证**（失败退路见 KD-1）。

**② 骨架 = 内建 `node:test` + `node:assert/strict`**（与桌面端既有测试同构）。E2E **并入单入口**（`npm test` → `thincoder-desktop/test/run.mjs` → `node --test …`），**不新增 script**：`docs/core/design/TESTING.md` §10 F1/F2 与 §4.2 已把「第二 runner / 第二入口」判为漂移源。

**③ 落点 = `thincoder-desktop/test/integration/settings-panel.test.mjs`**。沿 `docs/core/design/TESTING.md` §4.1 承载选型（**域界 = 目录界**）
与 §4.3 目录 / 命名契约（`thincoder-desktop/test/integration/<场景名>.test.mjs`）；E2E 属**常驻类**（业务场景 + 生产问题来源），域界 = 目录界（§4.1）。
登记进 `thincoder-desktop/test/files.mjs` ⇒ `thincoder-desktop/test/run.mjs` 的 walk 递归与反向自检**天然覆盖**，runner 逻辑零改动。

**④ 隔离 = 每用例独立临时家目录**。`launch` 的 `env` 显式把 HOME / USERPROFILE 与 APPDATA / XDG_CONFIG_HOME 重定向到用例自建 `mkdtemp` 目录，
并预置其中 `.thincoder/config.json` = `{"locale":"en"}`。三重作用：零网络（不读真家 provider）· 消单实例锁撞车
（`thincoder-desktop/src/main/main.mjs:55` 起 `app.requestSingleInstanceLock()`，锁落 userData ⇒ 两个并发 Electron 实例必须各有独立 userData）·
**模型段 `none` 兼作重定向生效的证据**（真家有 provider 时该段不为 `none`）。

**就绪判据**（不用固定 sleep）：引导位 = `documentElement.dataset.boot`（置位面 `thincoder-desktop/renderer/dom.mjs:44-46`；
`thincoder-desktop/renderer/app.mjs:270` 置 `ok`，`:259` `:265` `:273` 置 `error`）。断言序 = **先等 `boot ∈ {ok, error}` 落位，再断言其 `=== "ok"`**
—— 直接等 `"ok"` 会在真错误面空等超时，把「引导失败」报成「超时」。这一读法沿用宿主既有读回口径（`thincoder-desktop/src/main/window.mjs:116-118` 轮询至置位或上限）。

**截图判据**：`page.screenshot({ path })`（Playwright 按扩展名出 PNG），落 `thincoder-desktop/test/artifacts/settings-panel.png`（新增 · 运行期产物目录）。**判定 = 文件存在 + PNG magic（前 4 字节 `89 50 4E 47`）**，不做像素断言（跨平台字体 / 渲染差异 ⇒ 假红源）。

## 2. 关键决策记录

| KD | 决策 | 理由 · 否决备选 |
|---|---|---|
| KD-1 | 驱动依赖 = `playwright-core` | Electron 驱动在该包内且 `scripts` 缺省（无浏览器下载）；否决 `@playwright/test`：自带 runner ⇒ 第二 runner（`docs/core/design/TESTING.md` §4.2）；否决自研 CDP 直连：协议面自维护、成本高于收益；**失败退路**：安装后首步核验（`require("playwright-core")._electron` 可达 · §1① 四条依据不翻）；不成立 ⇒ 停手上抛、备选另裁（不就地改口径） |
| KD-2 | E2E **并入既有 `test` 入口**，不新增 script | 沿用「脚本一条 · 清单登记 · walk 递归」既有形；否决 `test:e2e` 独立脚本：第二入口 = 漂移源（`docs/core/design/TESTING.md` §10 F1/F2） |
| KD-3 | 用例落 `thincoder-desktop/test/integration/`（域界 = 目录界） | 判据 = `docs/core/design/TESTING.md` §4.1 承载选型（域界 = 目录界）+ §4.3 目录 / 命名契约；否决落 `thincoder-desktop/test/` 顶层（顶层 = 单元域，域界被抹平）；否决与单测混目录（同因） |
| KD-4 | 隔离手段 = **家目录重定向**（env 面，主选）；退路 = 测试侧 `--user-data-dir` 启动参数 | 否决不隔离：真家 config 泄漏 ⇒ 断言不稳定 + 并发单实例锁撞车（`thincoder-desktop/src/main/main.mjs:55-58`：非主实例静默退出 ⇒ `firstWindow()` 挂起 / 超时）；否决**产品码内**改向（`app.setPath` 类 ⇒ 动产品码，本批禁止）；退路 = **测试侧** `launch.args` 项（不动产品码），落位实证与停手口径见 §3.2 |
| KD-5 | **不传 `executablePath`**，走缺省解析 | 缺省 = 包内 `node_modules/.bin/electron`（包类型声明 `Electron.launch` 的 `executablePath` 项注释）。逃生口（实施期若缺省落空）= `createRequire(import.meta.url)("electron")` —— electron 包入口尾行 `module.exports = getElectronPath()`（本机实读）⇒ 该 require 的**值**即二进制路径串，不写任何硬路径 |
| KD-6 | 走**常态启动面**（窗口常驻），不用 `--smoke` | `--smoke` 语义 = 单行 JSON 读数后退出（`thincoder-desktop/src/main/main.mjs:4` 启动序）；与本条「开面板 ⇒ 交互 ⇒ 截图」不同面。冒烟读数归既有复核形 |
| KD-7 | 断言面 = **DOM 契约**（`data-*` 锚与态值），非文案 | 文案随 locale 变；契约锚 = 产品自身登记的机读面 ⇒ 属 `docs/core/design/TESTING.md` §4.5「业务可观察结果」侧（不 import 应用内部 / 不锁私有形状；「子节点数 0」= 产品登记的退场契约——容器清空，`thincoder-desktop/renderer/views/settings.mjs:261`）；契约锚清单 = 本表下 **KD-7 注** |
| KD-8 | 截图**不做像素断言** | 判据只要求「落点固定 + 可见」，未要求视觉回归；像素差异 = 假红源 |
| KD-9 | 每用例独立 fixture 家 + 独立 Electron 实例 | `node --test` 逐档并发 ⇒ 档间不得共享状态；用例尾递归清临时家（失败取证靠 PNG 与 stdout，不靠临时家） |
| KD-10 | 新增 `thincoder-desktop/.gitignore`（忽略 `thincoder-desktop/test/artifacts/`）（新增） | 运行期产物不进 git（兄弟包各有 `.gitignore` 先例）；`.gitignore` = 仓库管线文件、**非产品码**，与本批「不改产品码」不抵（该判断登记 §7） |

**KD-7 注（契约锚清单）**：`[data-settings][data-state]`（`thincoder-desktop/renderer/views/settings.mjs:269`）·
`[data-settings] [data-section]`（**作用域限定**——`data-section` 名在 rail 面同现：`thincoder-desktop/renderer/views/sessions.mjs:135`）·
`data-action="settings:open"`（`thincoder-desktop/renderer/views/info-row.mjs:88-90`）/ `"settings:close"`（`thincoder-desktop/renderer/views/settings.mjs:250-252`）。

## 3. 架构与接口契约

### 3.1 驱动契约（launch）

```
_electron.launch({
  args: ["."],                 // 主脚本 = 包根（main 指向 thincoder-desktop/src/main/main.mjs）
  cwd: <APP_DIR 绝对路径>,      // 应用根（包类型声明：cwd = “Current working directory to launch application from.”）
  env: { ...process.env 去掉 ELECTRON_RUN_AS_NODE, HOME/USERPROFILE/APPDATA/XDG_CONFIG_HOME = fixture 家 },
  colorScheme: "light",        // 类型声明：缺省即 light；显式写死消平台差异
})
```

`env` 缺省 = `process.env`（包类型声明原文：`env` = “Specifies environment variables that will be visible to Electron. Defaults to `process.env`.”）⇒ **本契约必须显式传 env**，否则继承来的环境变量既漏真家、又可能带毒。

**`ELECTRON_RUN_AS_NODE` 必须删除**：该变量若被继承，electron 二进制会退化为纯 node ⇒ 启动报错成**假红**。此坑本仓已实证（见批档 `docs/batches/2026-09-25-desktop-impl-3.md` §5.4 第 2 条的实测读数与有效形）；显式传 env 即对本坑免疫。

### 3.2 隔离契约

| 项 | 形态 | 依据 |
|---|---|---|
| 临时家 | `mkdtemp(join(tmpdir(), "tc-desktop-e2e-"))`，**每用例一枚** | KD-9「一用例一隔离」 |
| fixture | `<临时家>/.thincoder/config.json` = `{"locale":"en"}`（**唯一预置内容**） | 核 `thincoder-core/config-io.mjs:32` `configDir = join(homedir(), ".thincoder")` ⇒ 家目录改向即配置面改向；无 provider ⇒ 零网络 |
| userData | 生效路径 = 测试侧 `launch.args` 传 `--user-data-dir=<临时家>/userData`（§3.2 生效路径段 · 不动产品码）；依据 = 实测 env 改向不达该面（Chromium 不采信 `APPDATA`——只给四 env 时 `app.getPath("userData")` 仍指系统真值）；**不用**产品 `setPath` | 实测读数（2026-09-27）= 落 `<临时家>/userData`；侧证 = 本用例 `model` 段应为 `none` |
| userData 落位（实施首步实证） | 经 Electron 侧读 `app.getPath("userData")` ⇒ 断言 ∈ 临时家；两况须过 = 本机已有实例 · 并发实例 | 单实例锁落 userData（`thincoder-desktop/src/main/main.mjs:55-58`：非主实例静默退出 ⇒ `firstWindow()` 挂起 / 超时） |
| 清理 | 用例尾递归删临时家 | KD-9 |

**生效路径（userData 面）**：`launch.args` 传 `--user-data-dir=<临时家>`（测试侧传参 ⇒ 不改产品码；采信已实证——2026-09-27 落 `<临时家>/userData`）；该路亦不成立 ⇒ **停手上抛**（§8-6），不得就地改产品码。

### 3.3 就绪与断言序（即用例 1 的执行序）

1. `launch` ⇒ `await app.firstWindow()`
2. 等 `dataset.boot ∈ {ok, error}` 落位 ⇒ 断言 `=== "ok"`
3. 断言设置入口在：`button.info-entry[data-action="settings:open"]`（`thincoder-desktop/renderer/views/info-row.mjs:82-90`；入口与项目无关，装配期即挂）
4. 点按入口 ⇒ 等根 `div[data-settings][data-state="open"]`（`thincoder-desktop/renderer/views/settings.mjs:269`）
5. 读设置面段集合与序：`[data-settings] [data-section]` 的 `data-section` 列表 `=== ["providers","model","agent","mcp"]`（`SECTIONS` 冻结序，`thincoder-desktop/renderer/views/settings.mjs:22-27`）
6. 等设置面各段 `[data-settings] [data-section]` 的 `data-state` 脱离加载态 ⇒ 断言 `providers / agent / mcp = "ready"`、`model = "none"`（fixture 定形；`model=none` 兼作隔离生效证据）
7. `mkdirSync(dirname(PNG), { recursive: true })` **预建落点目录**（`node:fs`；不押截图调用的自建行为）⇒ `page.screenshot({ path: PNG })` 落固定落点 `thincoder-desktop/test/artifacts/settings-panel.png`（`PNG` = 用例档内单一绝对常量 · §5③）⇒ 断言存在 + PNG magic（前 4 字节 `89 50 4E 47`）
8. 点 `button.settings-close[data-action="settings:close"]`（`thincoder-desktop/renderer/views/settings.mjs:250-252`）⇒ 等根 `[data-state="closed"]` 且**子节点数 0**（退场 = 容器清空，非 `hidden`）
9. `await app.close()` ⇒ 清临时家

### 3.4 接口面小结

本档**不新增产品接口**：E2E 只读既有契约面（IPC 面见 `docs/desktop/design/IPC.md`；DOM 面 = 上述 `data-*` 锚）。实施期若某步断言必须产品补锚 / 补缝 ⇒ **停下上抛**（§8-6），不得就地改产品码。

## 4. 受影响文件清单

| 档 | 现行数 | 预估增量 | 说明 |
|---|---|---|---|
| `thincoder-desktop/test/integration/settings-panel.test.mjs` | 0 ⇒ **137**（内容行数） | ~120 行（预算） | 用例 1（§3.3 九步）· 常驻类 · **已落**（2026-09-27 实读） |
| `thincoder-desktop/test/files.mjs` | 12 | +1 行 | 登记新用例档（walk 递归 + 反向自检据此覆盖） |
| `thincoder-desktop/test/run.mjs` | 41 | ±1 行（`:4` 注释改写 · **逻辑零改动**） | 注释须与本批「集成域已建」同实 ⇒ 本批随改（walk 递归天然覆盖新档） |
| `thincoder-desktop/.gitignore`（新增） | 0 | ~5 行 | 忽略 `thincoder-desktop/test/artifacts/`（KD-10） |
| `thincoder-desktop/package.json` | 20 | +1 行 | `devDependencies` 加 `playwright-core`（现版 `1.63.0` · as-of 2026-09-27 registry 直读）；**只进 devDependencies**，`dependencies` 不变 |
| `thincoder-desktop/package-lock.json` | 3950 | 增量 ≈ npm 解析结果（`playwright-core` 依赖图） | devDep 入册必改锁定面（该档 git 已跟踪） |
| `thincoder-desktop/test/artifacts/settings-panel.png`（新增 · 运行期产物） | — | 运行期产物 | 判据③固定落点；不进 git |
| `docs/desktop/design/E2E-TESTING.md` | 0 | 本档 | 设计单源 |
| `docs/desktop/design/PROJECT.md` | 410（as-of 2026-09-26 落笔轮；盘上现值 431 内容行——批 A 修正轮落于其后） | +10 行（七处小改 + 值收正两处 + 行宽折行两处） | **已落**（2026-09-26 放行落笔轮）⇒ §8-7（已解） |
| `docs/core/design/TESTING.md` | 413 | +3 行（多实现面行补桌面面 / §10 边界口径收正） | **已落**（2026-09-26 放行落笔轮）⇒ §8-4 / §8-5（已解） |

**零改动面**：`thincoder-desktop/src/**` 与 `thincoder-desktop/renderer/**`（= 产品码全域，本批不动）· 三端（cli / core / vscode）测试面 · 各包 `package.json` 脚本（`thincoder-desktop/package.json` 的 `scripts` 块亦零改动）。

## 5. 验收判据回指（本批判据 → 本档落点 → 机检形）

| 本批判据 | 本档落点 | 机检形 |
|---|---|---|
| ① 真 Electron 跑通 ⇒ 主界面可见 ⇒ 固定路径 PNG | §3.1 驱动契约 + §3.3 全序 | `cd thincoder-desktop && npm test` exit 0，且 §3.3 第 7 步固定落点 PNG 存在、前 4 字节 = `89 50 4E 47` |
| ② 至少一条端到端用例（开设置面 ⇒ 四段可见 ⇒ 关闭） | §6 用例 1（T-DSK27） | 同上一次运行即覆盖（§3.3 九步全绿） |
| ③ PNG 落点固定 | §3.3 第 7 步 | 路径在用例档内为**单一常量**；断言存在 + magic |
| ④ web 快筛与 Electron 一致（**本批判不做**） | §7 第 1 条 · §8-1 | 不适用（未做 ⇒ 无判据可回指，登记不缩水） |
| ⑤ 三端测试零回归 | §4「零改动面」 | 三包 `npm test` 各自 exit 0（父侧核销读数） |
| ⑥ Playwright = devDep | §4 `thincoder-desktop/package.json` 行 | `dependencies` 无 `playwright-core`，`devDependencies` 有 |

**回指链（已闭）**：桌面端需求档 `docs/desktop/requirements/PROJECT.md` §4 **D14 可测性（E2E）** 已落（2026-09-26）⇒ 三链同源（需求档 D14 ↔ 批档 §1 判据 ↔ 本档 §5 回指表）。

## 6. 用例表

| 编号 | 类型 | 输入 | 期望输出 | 本批 |
|---|---|---|---|---|
| `T-DSK27 settings-panel` | 正常 | 空 fixture 家（唯一预置 `<临时家>/.thincoder/config.json` = `{"locale":"en"}`）· 无项目 | boot `ok`；入口在；点按后面板 `open`；段序 `providers,model,agent,mcp`；态 `ready,none,ready,ready`；PNG 落固定落点（§3.3 第 7 步）；关闭后 `closed` 且子节点 0 | ✅ 做 |
| `T-DSK27b config 档缺失` | 边界 | 临时家**不预置** config | 引导位仍 `ok`（档缺 ⇒ `configured` 判假）；向导面占槽（设置面是否仍可开 **待实施期实证**） | ❌ 不做（§8-3） |
| `T-DSK27c 面板重复开 / 关` | 边界 | 连点入口两次 + 关两次 | `open` / `closed` 收敛无残留 | ❌ 不做（§8-3） |
| `T-DSK27d 引导失败面` | 错误 | 需破坏 preload 桥（不可达） | boot `error`，用例以「boot 值 = error」失败并回显该值 | ❌ 不做（§8-3） |

> 本批只落 `T-DSK27`（判据②：至少一条）。边界 / 错误三条**登记不做**，不静默缩水。编号以 `docs/desktop/design/PROJECT.md` §7 落定序为准（**T-DSK27** = 该档 §7 已落 · 2026-09-26）。

## 7. 边界（不做）

1. **不做 web 快筛**（判据④明示不做）——Electron 为唯一权威面。
2. **不做 CI 接线**（本批边界）——含 Linux 无显示面（xvfb）与三平台矩阵，留待 CI 批。
3. **不引第二 runner**（`@playwright/test` / vitest / jest 一律不进）。
4. **不做视觉 / 像素回归**（KD-8）。
5. **不改产品码**：`thincoder-desktop/src/**` · `thincoder-desktop/renderer/**` 零改动（测试面 `thincoder-desktop/test/**` 不属本列——本批在其上净增一档 + 一处注释改写）；实施期若某断言必须产品补锚 ⇒ 停手上抛（§8-6）。
6. **不改三端测试面**：cli / core / vscode 的用例与 runner 不因本批变动。
7. **`.gitignore` 的边界判断**（KD-10）：运行期产物目录不进 git 的管线文件 —— 非产品码、非产品文本面；若复核判定其属产品面 ⇒ 撤销该档、改由父侧登记。
8. **不做并行度调参**：`node --test` 并发度用内建缺省，不引 `--test-concurrency` 之类硬参数。
9. **无产品 UI / 交互决策**：本档只驱动**既有** DOM 契约面（§3.3），不改任何产品界面与交互 ⇒ 设计档第八项（UI / 交互决策落定）在本档为空集。

## 8. 上抛与报告项

1. **判据④（web 快筛与 Electron 一致）本批不做** ⇒ 需主 agent 裁定落需求档还是另立批（本档只登记不做，不缩水替代）。
2. **需求档 E2E 功能点与判据点**：**已落**（2026-09-26）——`docs/desktop/requirements/PROJECT.md` §4 **D14 可测性（E2E）**；本档 §5 回指已同源（三链闭合，见 §5 回指链行）。
3. **边界 / 错误用例本批不做**（§6 三行）⇒ 上抛是否在后续批补。
4. **`docs/core/design/TESTING.md` 多实现面枚举**：**已落**（2026-09-26）——首部多实现面行补**桌面面**（单入口 · 集成域 `thincoder-desktop/test/integration/`）；见该档变更记录 2026-09-26 行。
5. **`docs/core/design/TESTING.md` §10 边界口径**：**已落**（2026-09-26）——边界行收正为「**运行期零第三方依赖（守）∥ 测试面 `devDependencies` 不在此限（放开）**」；本批 `playwright-core` = 测试面驱动（判据⑥）。
6. **产品缝 = 停手上抛**：实施期若出现「必须改产品码才能断言」的项 ⇒ 停下报父侧裁定。
7. **`docs/desktop/design/PROJECT.md` 七处小改**：**已落**（2026-09-26 放行落笔轮 · 次序 = 批 A 先）——档头 `五档 ⇒ 六档`（+「另两档 ⇒ 另三档」列本档）· 需求侧行 `D1–D14` · §4.1（`package.json` 值 `~45 ⇒ 20 ⇒ 21` + `files.mjs` 值 `14 ⇒ 15` + 两新行）· §7 **T-DSK27** · §8 不做行 · §10 **R** 行 · 变更记录；行数读数见 §8-9。
8. **`docs/README.md` 地图随动**（桌面板块现记档数与总档数口径）⇒ 新档入册属父侧。
9. **计数面口径（已解 · 2026-09-26）**：两表各自面、非矛盾——`docs/desktop/design/PROJECT.md` §4.1 `thincoder-desktop/test/files.mjs` 值 = **登记行数**（现 12 + 批 A 两行 + 本批集成用例档一行 ⇒ **15**）；同表「二十七档」= **单元用例模块枚举**（实读 25 + 批 A 两档；本批集成用例档单列、不入该枚举）；口径 = 内容行数（文末换行不计）。
10. **`thincoder-desktop/test/run.mjs` 注释随改（本批）**：注释须与本批「集成域 `thincoder-desktop/test/integration/` 已建」同实 ⇒ 并入本批（§4 表在册）；runner 逻辑零改动（walk 递归 + 反向自检天然覆盖新档）。
11. **实施期实证点（2026-09-27 复核）**：家目录重定向被 Node `os.homedir()` 采纳——**已实证**（fixture 家内预设生效）；**userData 面 = env 改向不达**（Chromium 不采信 `APPDATA`）⇒ 生效面 = §3.2 `--user-data-dir`（落 `<临时家>/userData` · 两况俱过）
  · `thincoder-desktop/test/integration/` 档被 `thincoder-desktop/test/run.mjs` walk 正常收——**已实证**（单入口覆盖）；Electron 二进制缺盘时 electron 包入口会自下载（CI 接入前须预装）。
12. **本档「（拟新增）」标记的清除**：**已落**（2026-09-27 实施后对账轮——标记在实施落档后失据）；先例 = `docs/desktop/design/RENDERER.md` §1 去标记六处。
13. **改善项（2026-09-27 登记 · 待裁）**：核侧家目录隔离现经 `USERPROFILE` / `HOME` 覆写（核侧 `os.homedir()` 读取面——系统原语）⇒ **可选**改显式参数 seam（参数通道偏好 · 非禁令——2026-09-27 用户裁定）；替换面（核侧配置路径 seam ∥ 产品补参）另批裁——本轮零改码。

## 变更记录

- 2026-09-26 建档：桌面端 E2E 测试基建设计（`playwright-core` 驱动 · `thincoder-desktop/test/integration/` 首例 · 家目录隔离 · 固定 PNG 落点 · 单入口并入）。
- 2026-09-26 收正（交付前自检）：坐标形统一为**仓根相对全路径**（`thincoder-desktop/…` / `docs/…`——与桌面端兄弟档同形）；行宽收正；标记语义收正（「拟新增」只留未落盘的新用例档，运行期产物与 `.gitignore` 记「新增」）；§7 增第 9 条（UI / 交互决策 = 空集）；§8 增第 12 项。
- 2026-09-26（**放行落笔轮**）：用例号收正 `T-DSK25 ⇒ **T-DSK27**`（T-DSK25 / 26 为批 A 所占——`docs/desktop/design/PROJECT.md` §7 已落）；`docs/desktop/design/PROJECT.md` 七处落定（§8-7 已解）· 回指链闭合（需求档 **D14**——§8-2 已解）
  · `docs/core/design/TESTING.md` 两处落定（§8-4 / §8-5 已解）· 计数面口径落定（§8-9 已解）· KD-7 行宽折行（契约锚清单落表下注——零新增，行宽收正）。
- 2026-09-27 修正轮（评审 #1–#10 落位）：KD-4 重写（否决项只指产品码改动 · 退路 = 测试侧 `--user-data-dir` 成文）· §3.2 userData 落位行 + 退路段（实施首步实证 · 含两况）· 第 5 / 6 步与 KD-7 注锚限作用域（`[data-settings] [data-section]`）· 契约锚引线收正（`thincoder-desktop/renderer/views/settings.mjs` 263-265 ⇒ 269）
  · `thincoder-desktop/test/run.mjs` 入 §4 表（§8-10 收口）· KD-3 / §1③ 判据句改引 `docs/core/design/TESTING.md` §4.1 / §4.3 · 第 7 步补目录预建 · §4 补锁文件行 · 驱动四条依据落 as-of 读数（KD-1 加失败退路）· `PROJECT.md` 行改 as-of 口径 · KD-7 补 §4.5 对齐句。
- 2026-09-27（**实施后对账轮**）：§6 T-DSK27 态序收正为实证序 `ready,none,ready,ready` · §3.2 / §4 userData 面按现行生效面陈述（`--user-data-dir`——env 改向不达该面）· §4 去「（拟新增）」+ 值回填 **137** 内容行 · §8-11 去 `unverified` · §8-12 转已落 · §8 增第 13 项（改善项 · 登记待裁）；明细 = `docs/batches/2026-09-26-desktop-e2e-infra.md` §2.11。
