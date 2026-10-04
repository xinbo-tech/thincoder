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
（`thincoder-desktop/src/main/main.mjs:92` 起 `app.requestSingleInstanceLock()`，锁落 userData ⇒ 两个并发 Electron 实例必须各有独立 userData）·
**模型段 `none` 兼作重定向生效的证据**（真家有 provider 时该段不为 `none`）。

**就绪判据**（不用固定 sleep）：引导位 = `documentElement.dataset.boot`（置位面 `thincoder-desktop/renderer/dom.mjs:44-46`；
`thincoder-desktop/renderer/app.mjs:237` 置 `ok`，`:224` `:231` `:240` 置 `error`）。断言序 = **先等 `boot ∈ {ok, error}` 落位，再断言其 `=== "ok"`**
—— 直接等 `"ok"` 会在真错误面空等超时，把「引导失败」报成「超时」。这一读法沿用宿主既有读回口径（`thincoder-desktop/src/main/window.mjs:116-118` 轮询至置位或上限）。

**截图判据**：`page.screenshot({ path })`（Playwright 按扩展名出 PNG），落 `thincoder-desktop/test/artifacts/settings-panel.png`（新增 · 运行期产物目录）。**判定 = 文件存在 + PNG magic（前 4 字节 `89 50 4E 47`）**，不做像素断言（跨平台字体 / 渲染差异 ⇒ 假红源）。

## 2. 关键决策记录

| KD | 决策 | 理由 · 否决备选 |
|---|---|---|
| KD-1 | 驱动依赖 = `playwright-core` | Electron 驱动在该包内且 `scripts` 缺省（无浏览器下载）；否决 `@playwright/test`：自带 runner ⇒ 第二 runner（`docs/core/design/TESTING.md` §4.2）；否决自研 CDP 直连：协议面自维护、成本高于收益；**失败退路**：安装后首步核验（`require("playwright-core")._electron` 可达 · §1① 四条依据不翻）；不成立 ⇒ 停手上抛、备选另裁（不就地改口径） |
| KD-2 | E2E **并入既有 `test` 入口**，不新增 script | 沿用「脚本一条 · 清单登记 · walk 递归」既有形；否决 `test:e2e` 独立脚本：第二入口 = 漂移源（`docs/core/design/TESTING.md` §10 F1/F2） |
| KD-3 | 用例落 `thincoder-desktop/test/integration/`（域界 = 目录界） | 判据 = `docs/core/design/TESTING.md` §4.1 承载选型（域界 = 目录界）+ §4.3 目录 / 命名契约；否决落 `thincoder-desktop/test/` 顶层（顶层 = 单元域，域界被抹平）；否决与单测混目录（同因） |
| KD-4 | 隔离手段 = **家目录重定向**（env 面，主选）；退路 = 测试侧 `--user-data-dir` 启动参数 | 否决不隔离：真家 config 泄漏 ⇒ 断言不稳定 + 并发单实例锁撞车（`thincoder-desktop/src/main/main.mjs:92-106`：非主实例弹模态框待点击（非 `--smoke` 径）⇒ 子进程阻塞待人工点击）；否决**产品码内**改向（`app.setPath` 类 ⇒ 动产品码，本批禁止）；退路 = **测试侧** `launch.args` 项（不动产品码），落位实证与停手口径见 §3.2 |
| KD-5 | **不传 `executablePath`**，走缺省解析 | 缺省 = 包内 `node_modules/.bin/electron`（包类型声明 `Electron.launch` 的 `executablePath` 项注释）。逃生口（实施期若缺省落空）= `createRequire(import.meta.url)("electron")` —— electron 包入口尾行 `module.exports = getElectronPath()`（本机实读）⇒ 该 require 的**值**即二进制路径串，不写任何硬路径 |
| KD-6 | 走**常态启动面**（窗口常驻），不用 `--smoke` | `--smoke` 语义 = 单行 JSON 读数后退出（`thincoder-desktop/src/main/main.mjs:4` 启动序）；与本条「开面板 ⇒ 交互 ⇒ 截图」不同面。冒烟读数归既有复核形 |
| KD-7 | 断言面 = **DOM 契约**（`data-*` 锚与态值），非文案 | 文案随 locale 变；契约锚 = 产品自身登记的机读面 ⇒ 属 `docs/core/design/TESTING.md` §4.5「业务可观察结果」侧（不 import 应用内部 / 不锁私有形状；「子节点数 0」= 产品登记的退场契约——容器清空，`thincoder-desktop/renderer/views/settings.mjs:261`）；契约锚清单 = 本表下 **KD-7 注** |
| KD-8 | 截图**不做像素断言** | 判据只要求「落点固定 + 可见」，未要求视觉回归；像素差异 = 假红源 |
| KD-9 | 每用例独立 fixture 家 + 独立 Electron 实例 | `node --test` 逐档并发 ⇒ 档间不得共享状态；用例尾递归清临时家（失败取证靠 PNG 与 stdout，不靠临时家） |
| KD-10 | 新增 `thincoder-desktop/.gitignore`（忽略 `thincoder-desktop/test/artifacts/`）（新增） | 运行期产物不进 git（兄弟包各有 `.gitignore` 先例）；`.gitignore` = 仓库管线文件、**非产品码**，与本批「不改产品码」不抵（该判断登记 §7） |

**KD-7 注（契约锚清单）**：`[data-settings][data-state]`（`thincoder-desktop/renderer/views/settings.mjs:269`）·
`[data-settings] [data-section]`（**作用域限定**——`data-section` 名在 rail 面同现：`thincoder-desktop/renderer/views/sessions.mjs:135`）·
`#settings-btn`（核件面板控制行第 7 钮——`thincoder-render-core/composer/controls.mjs:51`；出口 = `openSettings`）/ `"settings:close"`（`thincoder-desktop/renderer/views/settings.mjs:253`）。

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
| fixture | `<临时家>/.thincoder/config.json` = `{"locale":"en"}`（**唯一预置内容**——用例 1 面；用例 2 见 §3.5） | 核 `thincoder-core/config-io.mjs:32` `configDir = join(homedir(), ".thincoder")` ⇒ 家目录改向即配置面改向；无 provider ⇒ 零网络 |
| userData | 生效路径 = 测试侧 `launch.args` 传 `--user-data-dir=<临时家>/userData`（§3.2 生效路径段 · 不动产品码）；依据 = 实测 env 改向不达该面（Chromium 不采信 `APPDATA`——只给四 env 时 `app.getPath("userData")` 仍指系统真值）；**不用**产品 `setPath` | 实测读数（2026-09-27）= 落 `<临时家>/userData`；侧证 = 本用例 `model` 段应为 `none` |
| userData 落位（实施首步实证） | 经 Electron 侧读 `app.getPath("userData")` ⇒ 断言 ∈ 临时家；两况须过 = 本机已有实例 · 并发实例 | 单实例锁落 userData（`thincoder-desktop/src/main/main.mjs:92-106`：非主实例弹模态框待点击（非 `--smoke` 径）⇒ 子进程阻塞待人工点击） |
| 清理 | 用例尾递归删临时家 | KD-9 |

**生效路径（userData 面）**：`launch.args` 传 `--user-data-dir=<临时家>`（测试侧传参 ⇒ 不改产品码；采信已实证——2026-09-27 落 `<临时家>/userData`）；该路亦不成立 ⇒ **停手上抛**（§8-6），不得就地改产品码。

### 3.3 就绪与断言序（即用例 1 的执行序）

1. `launch` ⇒ `await app.firstWindow()`
2. 等 `dataset.boot ∈ {ok, error}` 落位 ⇒ 断言 `=== "ok"`
3. 断言设置入口在：`button#settings-btn`（核件面板控制行——`thincoder-render-core/composer/controls.mjs:51`；入口与项目无关，装配期即挂）
4. 点按入口 ⇒ 等根 `div[data-settings][data-state="open"]`（`thincoder-desktop/renderer/views/settings.mjs:269`）
5. 读设置面段集合与序：`[data-settings] [data-section]` 的 `data-section` 列表 `=== ["providers","model","agent","mcp","env","tools","models"]`（`SECTIONS` 冻结序七段——`thincoder-desktop/renderer/views/settings.mjs`）
6. 等设置面各段 `[data-settings] [data-section]` 的 `data-state` 脱离加载态 ⇒ 断言 `providers / agent / mcp = "ready"`、`model = "none"`（四段夹具定形；`model=none` 兼作隔离生效证据；`env ∕ tools ∕ models` 三段态断言随下次 E2E 跑补记）
7. `mkdirSync(dirname(PNG), { recursive: true })` **预建落点目录**（`node:fs`；不押截图调用的自建行为）⇒ `page.screenshot({ path: PNG })` 落固定落点 `thincoder-desktop/test/artifacts/settings-panel.png`（`PNG` = 用例档内单一绝对常量 · §5③）⇒ 断言存在 + PNG magic（前 4 字节 `89 50 4E 47`）
8. 点 `button.settings-close[data-action="settings:close"]`（`thincoder-desktop/renderer/views/settings.mjs:250-252`）⇒ 等根 `[data-state="closed"]` 且**子节点数 0**（退场 = 容器清空，非 `hidden`）
9. `await app.close()` ⇒ 清临时家

### 3.4 接口面小结

本档**不新增产品接口**：E2E 只读既有契约面（IPC 面见 `docs/desktop/design/IPC.md`；DOM 面 = 上述 `data-*` 锚）。实施期若某步断言必须产品补锚 / 补缝 ⇒ **停下上抛**（§8-6），不得就地改产品码。**批 B 追加轮**（`T-DSK32`）同径：**零新通道**；断言只读既有契约面（`data-action` / 输入框 `disabled`）+ **本批登记锚** `data-guide`（登记面 = `docs/desktop/design/UI.md` §1 批 B 追加注项 1）；判据单源 = 同上。

### 3.5 首启空态引导冒烟序（即用例 2 的执行序 · 十序）

1. 临时家 = `mkdtemp(join(tmpdir(), "tc-desktop-e2e-"))`（`~` 定向 = §3.1 launch 契约 · 照 §3.2），**不**预置 `.thincoder/config.json`（与 §3.2 的 `{"locale":"en"}` 差别有意：本用例要在**零配置**下起）；另建第二枚临时目录作项目根（记 `PROJ`）。
  夹具**预置**会话槽族档一枚：`<临时家>/.thincoder/sessions/<40hex>.json`（`cwd` = `PROJ`；形单源 = 核写面 `thincoder-core/session-slots.mjs` 物化形 · 族判据 = `thincoder-core/session-stale.mjs` 的 `GROUP_RE`）。
  读面口径 = `docs/desktop/design/IPC.md` §2 项目面注项 4（40 位哈希族 ⇒ 位次 = 最近写入）；夹具先例 = 手写族档（原 `thincoder-desktop/test/projects.test.mjs` 随 2026-09-28 测试树全清重置退场）。
2. `launch`（§3.1 契约 · `--user-data-dir=<临时家>/userData` 照 §3.2）⇒ `await app.firstWindow()` ⇒ 等 `dataset.boot ∈ {ok, error}` **落位**（就绪判据 = §1）⇒ 断言 `=== "ok"`，且骨架三锚在场：
   `[data-slot="session-control"]`（会话控制条——骨架 `thincoder-desktop/renderer/index.html:40`；常量 = `thincoder-desktop/renderer/mount-sessions.mjs:37` `SESSION_SLOT`）· `[data-slot="flow"]` · `[data-slot="composer"]`。
3. 向导退场（**真点** · 零配置 ⇒ 向导树占 `[data-slot="settings"]` 槽——槽位口径 = `thincoder-desktop/renderer/mount-settings.mjs`）：点 `button[data-action="settings:close"]`（退场控件 = `thincoder-desktop/renderer/views/onboarding.mjs:121-124`）
   ⇒ 等 `[data-slot="settings"]` 清空（`thincoder-desktop/renderer/settings.css`：`:empty` / `[data-state="closed"]` ⇒ 零覆盖层面——该层 `position: fixed` 全覆盖，**不退场则后续真点全落空**）。
4. 断言 `no-project` 档：对话流根 `[data-slot="flow"]` 的 `data-state === "none"` ∧ `data-blocks === 0` ∧ 其内 `[data-guide="no-project"]` 在场、内含 `button[data-action="project:open"]`（构树 = `thincoder-desktop/renderer/views/chat-guide.mjs`）；
   输入框禁用：`[data-slot="composer"]` 根 `data-state === "none"` ∧ 其内输入框 `disabled` 真（两态口径 = `thincoder-desktop/renderer/mount-composer.mjs`）——判据 = **无活动会话**，引导在场**不**解除。
5. 等会话控制面项目钮在场：`button.session-project[data-action="project:open"]`（**恒在场**——R13 后渲染面开项目入口；构树 = `thincoder-desktop/renderer/views/session-control.mjs:112-120`）。
6. **真点**该钮（渲染面产品路出口——**非**引导面自证；**对话框夹具** = 测试侧替换主进程 `dialog.showOpenDialog` ⇒ 返回 `PROJ`——仅换 OS 对话框层，
产品码 ∕ 渲染面零改）：`openDir(PROJ)`（`thincoder-desktop/renderer/app.mjs:106-116`）⇒ `refreshRail()` + `resumeOpened()`（`thincoder-desktop/renderer/mount-sessions.mjs`）⇒ 等 `[data-guide="no-message"]` 在场 ∧ 输入框 `disabled` 撤（夹具槽可续 ⇒ 续会话；不可续 ⇒ 新分配——两况同落 `no-message` ∧ enabled）。
  **选择器限定**：同页多枚 `project:open` 在场（会话控制面项目钮 + 引导面动作控件——同出口）⇒ 按类取值（`button.session-project`）；两者皆走主进程原生对话框，无 `data-path` 形。
7. 断言空态分态：`[data-guide="no-project"]` 已退场 ∧ 对话流 `data-state === "empty"` ∧ `data-blocks === 0` ∧ `[data-guide="no-message"]` 在场（= 既有空态节点，词面 `chat.empty.hint` 不变 · 该码零动作控件）∧ 输入框非 `disabled`。
8. 键入文本（`fill` + `keyboard.press("Enter")`）——零 provider ⇒ 发送必不成回合。
9. 等 console 现 `[composer] msg:send failed: provider-invalid`（`thincoder-desktop/renderer/mount-composer.mjs` 拼 `[composer] ${channel} failed: ${reason}`；因由 = `thincoder-desktop/src/main/agent-host.mjs` 零 provider ⇒ `provider-invalid`）
  ∧ 断言输入框值 = 键入文本**逐字**（失败 ⇒ `kept`，不清输入 —— `thincoder-desktop/renderer/mount-composer.mjs`）∧ `data-blocks === 0`（零块落地）。
10. `await app.close()` ⇒ 清理两枚临时目录（§3.2 清理行）；全程 `page.on("pageerror")` 收集须为空。

**边界**：本序不出网、不押真实模型（零 provider = 发送必败面即判据；成功面**不做** —— §8）· 不截图（固定落点 PNG 判据面 = §3.3 第 7 步）· 断言只走 `data-*` 锚与 console 字面（**零文案匹配** —— 临时家无 `locale` 配置，词面非本序判据面）· `project:open` 无 `data-path` 形（主进程原生对话框）⇒ 真点面 = 会话控制面项目钮 + **主进程对话框测试侧替换**（返回 `PROJ`——第 6 步）；
引导面 `project:open` 控件维持**在场断言**（第 4 步）· **`no-session` 面 ∕ 其引导动作步不作本序覆盖**——无可达 UI 驱动路（`tab:close` 控件随 R13 裁撤全树零命中 ∧ `session:delete` 末项门〔会话数 ≤ 1 拒〕∧ 开项目恒一次 resume 分配——实读 `thincoder-desktop/src/main/session-actions.mjs:58-73`）；登记 = `docs/batches/2026-09-29-desktop-copy-vsc-align.md` §2.12。

### 3.6 账本警示面序（即用例 5 的执行序 · 六序）

1. 临时家 = `mkdtemp(join(tmpdir(), "tc-desktop-e2e-"))`（launch 契约 = §3.1 · 隔离 = §3.2）；另建第二枚临时目录作项目根（记 `PROJ`）。
   夹具 = `<临时家>/.thincoder/config.json` = `{"locale":"en"}`（向导跳过）+ 会话槽族档一枚（`cwd` = `PROJ`——形单源 = 核写面物化形 · 沿 §3.5 夹具先例）+ **损坏现场档**一枚 = `{manifest}.corrupted`（= `<临时家>/.thincoder/sessions/<cwd 哈希>.json.manifest.corrupted`——命名单源 = `docs/core/design/SESSION.md` §6.1 后缀族 / §6.23 判据句 3）。
2. `launch`（§3.1 · `--user-data-dir` 照 §3.2）⇒ `await app.firstWindow()` ⇒ 等 `dataset.boot ∈ {ok, error}` **落位** ⇒ 断言 `=== "ok"`。
3. **真点**会话控制面项目钮（`button.session-project[data-action="project:open"]`——对话框夹具返回 `PROJ`，照 §3.5 第 6 步）⇒ 等 `[data-guide="no-message"]` 在场（resume 开页两况同落）。
4. 点开会话控制面下拉（选择器 toggle ⇒ `aria-expanded` 转真）⇒ 断言**警示行在场**：下拉首行 = `div.session-ledger-notice[data-ledger-notice]`——**非 `button`** ∧ 零 `data-action`（非可点）；且**不打断列表**：`.session-item` 条目数 = 夹具族数。
5. 截图（沿 §3.3 第 7 步记法）：预建目录 ⇒ `page.screenshot({ path })` 落固定落点 `thincoder-desktop/test/artifacts/ledger-notice.png` ⇒ 断言存在 + PNG magic（前 4 字节 `89 50 4E 47`）。
6. `await app.close()` ⇒ 清两枚临时目录；全程 `page.on("pageerror")` 收集须为空。

**边界**：本序不出网（零 provider——不开回合）· 负断言面（正常账本 ⇒ 零注记）**不在本序**——判据面 = 回执缺席 ∧ 零节点（原两单元档随 2026-09-28 测试树全清重置退场——现载体 = 单元测试档惯例；登记不静默缩水）· 断言只走 `data-*` 锚（零文案匹配——`reason` 值面归视图用例）。

## 4. 受影响文件清单

| 档 | 现行数 | 预估增量 | 说明 |
|---|---|---|---|
| `thincoder-desktop/test/integration/settings-panel.test.mjs` | 0 ⇒ **137**（内容行数） | ~120 行（预算） | 用例 1（§3.3 九步）· 常驻类 · **已退**（2026-09-28 测试树全清重置——盘上无档） |
| `thincoder-desktop/test/integration/first-run-smoke.test.mjs` | 0 ⇒ **171**（内容行数——2026-09-27 实读） | +171 行（已落） | 用例 2（§3.5 十序）· 常驻类 · **已退**（2026-09-28 测试树全清重置——盘上无档） |
| `thincoder-desktop/test/integration/chat-render.test.mjs` | 0 ⇒ **146**（内容行数——2026-09-28 实读） | +146 行（已落） | 用例 3（`T-DSK37` 会话流经核 + 会话面板元数据 · 真 Electron 直驱）· 常驻类 · **已退**（2026-09-28 测试树全清重置——盘上无档） |
| `thincoder-desktop/test/integration/statusline-align.test.mjs`（集成域） | 0 ⇒ **142**（`wc -l`——实读 2026-09-28） | +142 行（已落） | 用例 4（`T-DSK39` 状态栏对齐——真 Electron 打开态对表；夹具前置 = 第二枚临时目录项目根〔槽 `cwd` = `PROJ`〕——判据面单源 = §6）· 常驻类 · **已退**（2026-09-28 测试树全清重置——盘上无档） |
| `thincoder-desktop/test/integration/ledger-notice.test.mjs`（集成域） | 0 ⇒ **121**（`wc -l`——实读 2026-09-28） | +121 行（已落） | 用例 5（`T-DSK40` 账本警示面——真 Electron；夹具前置 = 损坏现场档 `{manifest}.corrupted` + 会话槽族档〔槽 `cwd` = `PROJ`〕——判据面单源 = §3.6 / §6）· 常驻类 · **已退**（2026-09-28 测试树全清重置——盘上无档） |
| `thincoder-desktop/test/integration/align3-face.test.mjs`（集成域） | 0 ⇒ **209**（`wc -l`——实读 2026-09-28） | +209 行（已落） | 用例 6 / 7（`T-DSK42` / `T-DSK43` 小修族真机面——真 Electron；**离线可产断言面** = 工具卡摘要 / 错误横幅 / 欢迎条 / 设置面类型加工 / Esc 关闭；**离线不可产面**（停止痕 / 文件链接 / 子代理门审批 / 提问卡键焦 / 忙态两钮可点 / 审批卡真置焦）= 人工走查 + 父侧真跑闭合；夹具前置 = `{"locale":"en"}` + 会话槽族档〔槽 `cwd` = `PROJ`〕——判据面单源 = §6）· **已退**（2026-09-28 测试树全清重置——盘上无档）· 常驻类 |
| `thincoder-desktop/test/integration/timer-wake-face.test.mjs`（集成域） | 0 ⇒ **≈120**（拟新增——timer-wake 阶段 2） | +≈120 行（拟新增） | 用例 8（`T-DSK44` 到期触发面——真 Electron；**离线不可产组**（零 provider ⇒ 真 timer 不可复现）⇒ 人工走查 + 父侧真跑闭合；**机检面 = 单元测试档惯例**（名随批次档——住 `docs/batches/` · 不登记 · 随批留存；原单元档 `thincoder-desktop/test/timer-wake.test.mjs` 随 2026-09-28 全清重置退场——离线可产组历史例 T-TW17–T-TW21）；判据面单源 = §6）· 常驻类 |
| `thincoder-desktop/test/integration/midturn-input.test.mjs`（集成域） | 0 ⇒ **135**（实读 2026-09-28） | —（**已退**——2026-09-28 测试树全清重置，盘上无档） | 用例 9（`T-DSK45` 回合中插入真机面——真 Electron；夹具前置 = `{"locale":"en"}` + 会话槽族档〔槽 `cwd` = `PROJ`〕；**离线不可产**（真回合需 provider）⇒ 人工走查 + 父侧真跑闭合；判据面单源 = §6）· 常驻类 |
| `thincoder-desktop/test/files.mjs` | **3**（实读 2026-09-29——全清重置后空清单；单源 = `docs/desktop/design/PROJECT.md` §4.1） | —（登记面随全清重置不在册） | 登记新用例档（walk 递归 + 反向自检据此覆盖；集成件 = 落盘时登记 +1） |
| `thincoder-desktop/test/run.mjs` | **49**（实读 2026-09-29——单源 = `docs/desktop/design/PROJECT.md` §4.1） | ±1 行（`:4` 注释改写 · **逻辑零改动**） | 注释须与「集成域已建」同实（walk 递归天然覆盖新档） |
| `thincoder-desktop/.gitignore`（新增） | 0 | ~5 行 | 忽略 `thincoder-desktop/test/artifacts/`（KD-10） |
| `thincoder-desktop/package.json` | 20 | +1 行 | `devDependencies` 加 `playwright-core`（现版 `1.63.0` · as-of 2026-09-27 registry 直读）；**只进 devDependencies**，`dependencies` 不变 |
| `thincoder-desktop/package-lock.json` | 3950 | 增量 ≈ npm 解析结果（`playwright-core` 依赖图） | devDep 入册必改锁定面（该档 git 已跟踪） |
| `thincoder-desktop/test/artifacts/settings-panel.png`（新增 · 运行期产物） | — | 运行期产物 | 判据③固定落点；不进 git |
| `docs/desktop/design/E2E-TESTING.md` | 0 | 本档 | 设计单源 |
| `docs/desktop/design/PROJECT.md` | 410（as-of 2026-09-26 落笔轮；盘上现值 431 内容行——批 A 修正轮落于其后） | +10 行（七处小改 + 值收正两处 + 行宽折行两处） | **已落**（2026-09-26 放行落笔轮）⇒ §8-7（已解） |
| `docs/core/design/TESTING.md` | 413 | +3 行（多实现面行补桌面面 / §10 边界口径收正） | **已落**（2026-09-26 放行落笔轮）⇒ §8-4 / §8-5（已解） |
| `docs/batches/2026-09-29-model-menu-parity.test.mjs`（单元测试档——非集成域） | **300**（内容行数 · 9 用例——实读 2026-09-29；自 `.thincoder/tmp/` 转正） | —（随批留存 · 不登记） | 模型菜单全渠批测试面（handler 面（真核探针径 + 本地回环 HTTP 桩）· 通道四件套结构机检 · store 纯动作 · 触发六径）；**集成档未建**（回退载体 = 真机 R5 ∕ R6——触发链面不可装载）；集成域现盘空（`thincoder-desktop/test/integration/` 零档） |

> 表内「现行数 / 预估增量」为**各批落笔时读数**（as-of；行内已注日期者从其注）；全盘现值**单源** = `docs/desktop/design/PROJECT.md` §4.1（各档现行值——R3 期六档行已入册）；本批触碰面「现行 ⇒ 预期」= 该档 §4.2 各批行；**集成档行随 2026-09-28 测试树全清重置退场**（盘上无档——重建时按 §4.1 惯例登记「集成件 +1」）。

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
| `T-DSK32 first-run-smoke` | 正常 | 空 fixture 家（零 config ⇒ 无项目 / 无会话；预置族档一枚） | 四断言面（向导退场 → `no-project` → 真点开项目 `no-message` → 键入必败面）· 全形 = §3.5 十序 | ✅ 做（批 B 追加轮） |
| `T-DSK37 chat-render` | 正常 | fixture 家（`{"locale":"en"}` + 会话槽族四档——槽 1 回放历史：围栏块 / 注入样本 / 路径候选 / 推理块） | 引导位 `ok`；真点最近目录 ⇒ `data-state="flow"` ∧ 块序 = `user/reasoning/assistant/user`（**对齐第三批收正**——恢复帧次序 = 推理 → 正文）；`pre.code-block` 恰一枚 + 复制钮点按 ⇒ 剪贴板收代码文本；注入样本字面在场 ∧ 零 `script` 节点；推理块（`details.reasoning-block`）恰一枚；路径候选零 `.file-link`；行元数据段序 = `provider / msgs / updated` ∧ 含 `p1:m1` | ✅ 做（R3c） |
| `T-DSK39 statusline-align` | 正常 | fixture 家（`{"locale":"en"}` + **另建第二枚临时目录作项目根**（记 `PROJ`）+ 会话槽族档〔`cwd` = `PROJ`；沿 T-DSK32 夹具先例〕——**两臂**（夹具按可达态）：主臂槽档 = `autoApprove: true` / `advisor: { guard: true }` / `engineering: true` / `planMode: false`（四真不可达——`engineering: true` ⇒ 核恢复点 `clearPlanMode` 令 `planMode` 恒 false，实读 `thincoder-core/session-lifecycle.mjs:126-133`）；第二臂槽档 = `planMode: true` / `engineering: false` + `autoApprove: true` / `advisor: { guard: true }` 同值（另盖 `plan` 点亮）；两臂皆 `tasks` 2 条 + `title` 一条 + 读数可算；清理 = 两枚临时目录） | ① 真点**会话控制面项目钮**（`button.session-project[data-action="project:open"]`——对话框夹具 `PROJ`，照 §3.5 第 6 步；与 T-DSK32 同一产品路）⇒ `openDir` 成功链 ⇒ 自动一次 `session:resume` 开页（点开即续；主路未开页 ⇒ 备路 = 点会话控制面选择器开下拉 ⇒ 点条目〔`.session-item[data-slot]`——`session:switch` 同一开页尾〕） ② 状态行在场段 ⊆ 16 码闭集 ∧ 相对序 = 闭集序 ∧ 假 / 缺 ⇒ 零节点（**主臂**亮点三段 = `auto` / `advisor` / `eng` 在场 + **`plan` 零节点**（负断言）；**第二臂** = `plan` 在场 + `eng` 零节点；两臂保留在场 = `state` / `tasks` / `context` / `title` / `enter`）③ `state` 段词 = `Ready`（locale = en）④ `enter` 段词 = `Enter: send` ⑤ `tasks` 段词 = `✓0/2` ⑥ PNG 落 `thincoder-desktop/test/artifacts/statusline-align.png`（CLI 同刻对照面）；断言序单源 = `docs/desktop/design/PROJECT.md` §7 **T-DSK39** 行 | ✅ 做（状态栏对齐批已落——机检档随 2026-09-28 全清重置退场（单元测试档惯例）） |
| `T-DSK40 ledger-notice` | 正常 | fixture 家（`{"locale":"en"}` + 第二枚临时目录作项目根〔记 `PROJ`〕+ 会话槽族档〔`cwd` = `PROJ`〕+ **损坏现场档** `{manifest}.corrupted` 一枚——命名 / 落位单源 = §3.6 第 1 步；清理 = 两枚临时目录） | ① 真点**会话控制面项目钮**（`button.session-project`——对话框夹具 `PROJ`，照 §3.5 第 6 步）⇒ 等 `[data-guide="no-message"]` ② 点开下拉 ⇒ 下拉首行 = `div.session-ledger-notice[data-ledger-notice]`（**非 `button`** ∧ 零 `data-action`）∧ `.session-item` 条目数 = 夹具族数 ③ PNG 落 `thincoder-desktop/test/artifacts/ledger-notice.png` ④ 零 `pageerror`；断言序单源 = §3.6；用例号自铸披露 = `docs/desktop/design/PROJECT.md` §10 **AU** | ✅ 做（账本可靠批 · 桌面微轮已落——机检档随 2026-09-28 全清重置退场（单元测试档惯例）） |
| `T-DSK42 小修族·对话流面`（对齐第三批） | 正常 | fixture 家（`{"locale":"en"}` + 会话槽族档〔`cwd` = `PROJ`〕——沿 `T-DSK32` 夹具先例） | ① 工具卡头 = 名称 / 参数 / 状态词 / 耗时 / **摘要段**（`read` ⇒ `N lines` 形）在场 ∧ 状态色 = `data-status` 两值（`error` ⇒ `#f14c4c`）② 停止痕 `[data-stopped]` 在场（`msg:interrupt` ⇒ `stopped` 终局后）且词 = `[stopped]`（en）——**离线不可产** ③ 错误横幅 = 文 + 重试钮在场（末 `user` 块在场 ⇒ 钮在）；`details`（`techInfo`）面 = **离线不可产** ④ `no-message` 帧欢迎条 = 抬头 / 文案 / 快捷键行三行 ⑤ 工具结果含盘上真路径 ⇒ `.file-link[data-path]` 在场 ∧ 点按 ⇒ 零 `pageerror`——**离线不可产**；**离线不可产面 = 人工走查 + 父侧真跑闭合**（D16 义务——零 provider 夹具 ⇒ 真回合不可离线复现）；机检面 = `thincoder-desktop/test/integration/align3-face.test.mjs`（已落 · 实读 **209** · 集成域——离线可产断言）；用例号自铸披露 = `docs/desktop/design/PROJECT.md` §10 **BF** | ✅ 做（对齐第三批 · 已落） |
| `T-DSK43 小修族·外围面`（对齐第三批） | 正常 | fixture 家（同上） | ① 子代理门审批卡首行含 owner 段（`<owner> · <tool>`）∧ diff 节点在场（`apply_patch` 门——`diff-preview` 类名）——**离线不可产** ② 提问卡填入 ⇒ Enter ⇒ 卡退场 ∧ 回焦 `[data-input="text"]`——**离线不可产** ③ 回合在飞 ⇒ 输入区模型 ∕ 推理钮**可点** ∧ 中断键可点（**非在飞 ⇒ 键隐**——核件两态 = 显 ∕ 隐）——**离线不可产** ④ 设置面 agent 段 = 具名控件 ∧ `change` ⇒ 即改即存（回读同值）——离线可产 ⑤ 设置面开 ⇒ `Escape` ⇒ 关闭（`[data-slot="settings"]` 清空）——离线可产（**F-Esc 判据**）⑥ 审批卡出现即 `document.activeElement` = 卡内 `[data-autofocus="1"]`——**离线不可产**（**F-置焦 判据**）；**离线不可产面 = 人工走查 + 父侧真跑闭合**；机检面 = `thincoder-desktop/test/integration/align3-face.test.mjs`（已落 · 实读 **209** · 集成域——离线可产断言）；用例号自铸披露 = `docs/desktop/design/PROJECT.md` §10 **BG** | ✅ 做（对齐第三批 · 已落） |
| `T-DSK44 timer-wake 触发面`（timer-wake 阶段 2） | 正常 | 真 provider 会话：真设 timer ⇒ 到期 | ① 到期 ⇒ 交付 + 流内触发行恰一行（`[System reminder: ⏰ timer — …]` 原文——显示裁 ≤3 行）② 状态行 `⏰N` 段随动（在途 N）①②③ = 真 provider 面——**全组离线不可产**（零 provider 夹具 ⇒ 真 timer 不可复现）⇒ 人工走查 + 父侧真跑闭合；**机检面 = 单元测试档惯例**（原单元档 `thincoder-desktop/test/timer-wake.test.mjs` 随 2026-09-28 全清重置退场）；真机档 = `thincoder-desktop/test/integration/timer-wake-face.test.mjs`（拟新增）；用例号自铸披露 = `docs/desktop/design/PROJECT.md` §10 **BJ** | ✅ 做（timer-wake 阶段 2 · 拟新增） |
| `T-DSK45 回合中插入`（回合中插入批） | 正常 | 真 provider 会话：长工具回合在飞 ⇒ 忙态发两条 | ① 忙态提交 ⇒ **零 `busy` 拒** ∧ 输入区上方 `⏳` 待发送气泡在场（逐条 · 非流内）∧ 段 14 读数 = N ② 首条于**步边界**注入 ⇒ 气泡退场 ∧ 用户块入流（标签 `❯ You:`）∧ 段 14 随动（N-1）③ 末条随**回合尾送达**（无需用户再按 Enter）④ 队空后 `[data-pending]` 零节点；**离线不可产**（真回合需 provider）⇒ 人工走查 + 父侧真跑闭合；机检面 = 单元测试档惯例（原单元族 U214–U226 随 2026-09-28 全清重置退场——名随批次档 · 住 `docs/batches/` · 不登记 · 随批留存；自铸披露 = `docs/desktop/design/PROJECT.md` §10 BK）；用例号自铸披露 = `docs/desktop/design/PROJECT.md` §10 **BK** | ✅ 做（回合中插入批 · 拟新增） |
| `R1` 模型菜单全渠·一级全渠（模型菜单全渠批） | 正常 | 配 ≥2 有 key 渠（含自定义）——真机 | 菜单一级行数 = 渠数 ∧ 行序 = 配置序 ∧ 每渠悬停列模型 ∧ 选取 ⇒ 槽写生效（跨端同槽复核） | ✅ 做（真机 · 父侧收口——桌面 + VSC 同配置对拍） |
| `R2` 模型菜单全渠·跨端集合对照 | 正常 | 桌面 ∥ VSC 同 config | 两端一级行集合相等（按 provider 键取集合——勿按显示文本：桌面分组标题 = 渠名 ∕ VSC = `providerLabel`） | ✅ 做（真机 · 父侧收口） |
| `R3` 模型菜单全渠·失败渠诊断 | 错误 | 一渠 key 作废 | 该渠零行、零崩、控制台零静默（核落账失败项在） | ✅ 做（真机 · 父侧收口） |
| `R4` 模型菜单全渠·会话切换随动 | 正常 | 会话 A/B 同渠不同模型 ⇒ 切换 | 模型钮随会话（同值回写不报错） | ✅ 做（真机 · 父侧收口） |
| `R5` 模型菜单全渠·外部改档随现 | 正常 | 外部改 config（CLI 加渠） | 菜单随现（免重启） | ✅ 做（真机 · 父侧收口） |
| `R6` 模型菜单全渠·设置面加渠随现 | 正常 | 设置面加渠 ⇒ 回输入区 | 菜单随现（免重启） | ✅ 做（真机 · 父侧收口） |
| `R7` 模型菜单全渠·已配渠集 → 空 | 边界 | 设置面逐渠删至零 | 菜单保持现状（旧行驻留——有意边界；零崩、控制台零静默）；重新配渠 ⇒ 随推送复现（免重启） | ✅ 做（真机 · 父侧收口） |
| `T-DSK27b config 档缺失` | 边界 | 临时家**不预置** config | 引导位仍 `ok`（档缺 ⇒ `configured` 判假）；向导面占槽（设置面是否仍可开 **待实施期实证**） | ❌ 不做（§8-3） |
| `T-DSK27c 面板重复开 / 关` | 边界 | 连点入口两次 + 关两次 | `open` / `closed` 收敛无残留 | ❌ 不做（§8-3） |
| `T-DSK27d 引导失败面` | 错误 | 需破坏 preload 桥（不可达） | boot `error`，用例以「boot 值 = error」失败并回显该值 | ❌ 不做（§8-3） |

**`T-DSK32` 断言面（判据单源 = §3.5 十序）**：① 向导退场后 `[data-guide="no-project"]`（含 `project:open` 控件）∧ 输入框 `disabled` ② **真点**会话控制面项目钮（`button.session-project`——对话框夹具 `PROJ`，照 §3.5 第 6 步）⇒ `[data-guide="no-message"]` ∧ 非 `disabled`
③ 键入 + Enter ⇒ 值逐字保留 ∧ `data-blocks=0` ∧ console `provider-invalid`。

> **按批读**：建档批（E2E 基建批）落 `T-DSK27`（判据②：至少一条）；**批 B 追加轮**补落 `T-DSK32`（首启空态引导冒烟）· **R3c** 补落 `T-DSK37`（会话流经核 + 会话面板元数据——判据面单源 = `docs/desktop/design/PROJECT.md` §7 T-DSK35 / T-DSK34）· **状态栏对齐批**落 **`T-DSK39`**（打开态对表——**已落**（机检档随 2026-09-28 全清重置退场——单元测试档惯例）；
判据面单源 = `docs/desktop/design/PROJECT.md` §7 **T-DSK39** 行）。
> **账本可靠批 · 桌面微轮**落 `T-DSK40`（账本警示面——真 Electron · **已落**（机检档随 2026-09-28 全清重置退场——单元测试档惯例）；判据面单源 = §3.6 / §6）。
> **对齐第三批 · 小修族**落 `T-DSK42` / `T-DSK43`（小修族真机面——**已落**（机检档 `align3-face.test.mjs` 随 2026-09-28 全清重置退场——重建时登记）；**离线不可产面** = 人工走查 + 父侧真跑闭合；判据面单源 = `docs/desktop/design/PROJECT.md` §7 两行）。
> **timer-wake 阶段 2**（VSC + 桌面）落 `T-DSK44`（到期触发面——**拟新增** · **机检面 = 单元测试档惯例**（原单元档 `timer-wake.test.mjs` 随 2026-09-28 全清重置退场）+ 真机档 `timer-wake-face.test.mjs`（拟新增 · 离线不可产组 ⇒ 人工走查 + 父侧真跑闭合）；判据面单源 = 本节 + `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.12）。
> **回合中插入批**落 `T-DSK45`（回合中插入——**拟新增** · **机检面 = 单元测试档惯例**（原集成档 `midturn-input.test.mjs` 随 2026-09-28 全清重置退场）；**离线不可产面** = 人工走查 + 父侧真跑闭合；判据面单源 = `docs/desktop/design/PROJECT.md` §6.1 本批注 ∕ `docs/desktop/design/UI.md` §1「本批注（回合中插入 · 步边界 pickup）」）。
> **R10 · 子代理面板 ∕ live 面**（flow 批）：真机面 = **右列子代理全族**（出生 ∕ 走时 ∕ ⏹ ∕ 终态留场 ∕ 归档 ∕ 计数贴 ∕ 空态）——**人工走查 + 父侧真跑闭合**（离线不可产组同 T-DSK45；**测试面随全清令取消**——不新增用例号）。
> **flow 批 · 桌面 ⇒ VSC 对齐（R1–R13 · 真机走查面登记）**：卡三面（R1）· 待发送三态 ∕ 步边界取批（R3）· timer 到期唤醒（R4）· 附件贴图两径（R5）· 文件链接点开（R2）· 失焦通知两档 ∕ 子代理 2s 走时（R6）· provider 四流程（R8）· 悬挂窗四态（R9）·
> 状态行逐段（CLI 同刻 · R11）· 会话流逐面（VSC 同刻 · R12）· 会话控制下拉与左列零残留（R13）——R10 见上行；R7（装配序面）不入本走查——**人工走查 + 父侧真跑闭合**（各轮探针读数 = flow 批档 §5 在册）；**测试面随全清令取消**——不新增用例号（单源 = flow 批 §2.3 第 3 条 + R12 未办 5）。
> **模型菜单全渠批**（2026-09-29）落 `R1`–`R7` 真机条目行（桌面 + VSC 同配置对拍——**父侧收口跑**；R1–R7 = 真机条目代号，**不新增 T-DSK 用例号**——沿「真机走查面登记」先例）；机检面 = 单元测试档 `docs/batches/2026-09-29-model-menu-parity.test.mjs`（9 用例 · 随批留存 · 不入仓套件）；判据面单源 = `docs/desktop/design/PROJECT.md` §7 + `docs/desktop/design/IPC.md` §2「模型清单注」。
> 边界 / 错误三条（`T-DSK27b`–`T-DSK27d`）**登记不做**，不静默缩水；编号以 `docs/desktop/design/PROJECT.md` §7 落定序为准（`T-DSK27` = 2026-09-26 落 · `T-DSK32` = 批 B 追加轮落 · `T-DSK37` = R3c 落——自铸披露 = `docs/batches/2026-09-27-render-core-r3.md` §5）。

## 7. 边界（不做）

1. **不做 web 快筛**（判据④明示不做）——Electron 为唯一权威面（web 只做快筛）。**转档触发（可判形 · 2026-09-29 收正）**：① Playwright 基建在位（可判引用件 = `thincoder-desktop/package.json` devDependencies 含 `playwright-core`）∧ ② 桌面面「跑得慢」实测读数在案（实证对象 = 桌面套件单跑耗时；载体 = 收口亲跑日志 ∕ 报告行）；**现无该读数 ⇒ 条件未触**。
2. **不做 CI 接线**（本批边界）——含 Linux 无显示面（xvfb）与三平台矩阵，留待 CI 批。
3. **不引第二 runner**（`@playwright/test` / vitest / jest 一律不进）。
4. **不做视觉 / 像素回归**（KD-8）。
5. **不改产品码**（**按批读**）：`thincoder-desktop/src/**` · `thincoder-desktop/renderer/**` 零改动（测试面 `thincoder-desktop/test/**` 不属本列——建档批在其上净增一档 + 一处注释改写）；**批 B 追加轮**（`T-DSK32`）驱动的产品面改动（引导节点 / 接线 / 词键）由批 B 实施落——本档只登记用例面与断言形。实施期若某断言必须产品补锚 ⇒ 停手上抛（§8-6）。
6. **不改三端测试面**：cli / core / vscode 的用例与 runner 不因本批变动。
7. **`.gitignore` 的边界判断**（KD-10）：运行期产物目录不进 git 的管线文件 —— 非产品码、非产品文本面；若复核判定其属产品面 ⇒ 撤销该档、改由父侧登记。
8. **不做并行度调参**：`node --test` 并发度用内建缺省，不引 `--test-concurrency` 之类硬参数。
9. **无产品 UI / 交互决策**（**按批读**）：建档批只驱动**既有** DOM 契约面（§3.3），不改任何产品界面与交互 ⇒ 设计档第八项（UI / 交互决策落定）在该批为空集；**批 B 追加轮**（`T-DSK32`）所驱动的首启引导面 UI / 交互决策**已落**，其单源 = `docs/desktop/design/UI.md` §1「批 B 追加注」（四项：引导节点 · 分态 · 动作控件在场律 · 判据保留）——本档只落用例面与断言形。

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
13. **改善项（2026-09-27 登记；2026-09-29 收正——非缺口）**：核侧家目录隔离现经 `USERPROFILE` / `HOME` 覆写（核侧 `os.homedir()` 读取面——系统原语）；显式参数 seam = **可选**（用户 2026-09-27 口径「参数通道偏好 · 非禁令」）；现形已实证可用（§8 第 11 项）⇒ **非缺口**（「另批裁」句退场）；触发条件 = 核侧新增 home 依赖点令 E2E 隔离失效 ⇒ 随触面批补 seam。

## 9. 文件账（本域 · 迁自 `PROJECT.md` §4.1——as-of 2026-10-02）

### 9.1 本端文件清单与行数预算（测试基建族行 · 迁自 `PROJECT.md` §4.1——逐字；切片 3 判域迁入——`.gitignore` 混合行按 KD-10 单源归本域，`dist/` 半随行在册）

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/test/run.mjs` · `thincoder-desktop/test/files.mjs` | **49 / 3**（实读 2026-09-29） | 单入口 + 显式清单（清单↔盘上两向自检——照 `docs/core/design/TESTING.md` §10 形态；`files.mjs` 值口径 = 内容行数）；`thincoder-desktop/test/` 现盘 = `files.mjs` ∕ `rc-resolve.mjs` ∕ `run.mjs` 三档（测试面全清重置后——单元 = 单元测试档不登记 ∕ 集成件 = 落盘时登记 +1；单源 = `docs/batches/2026-09-28-test-layer-prompts.md` §1.15–§1.23） |
| 用例模块（原 48 档） | — | **2026-09-28 测试树全清重置**：存量测试全退（清单 = `thincoder-desktop/test/files.mjs` 空清单）；单元 = 单元测试档（名随批次档 · 住 `docs/batches/` · 不登记 · 随批留存）；集成件 = 落盘时登记 +1（单源 = `docs/batches/2026-09-28-test-layer-prompts.md` §1.15–§1.23；同上行） |
| `thincoder-desktop/.gitignore` | **9**（实读 2026-10-04；前读 8（实读 2026-10-01〔实施落盘〕）；构建窗余项 +1——`dist-*/` 条目） | 忽略 `thincoder-desktop/test/artifacts/`（运行期产物不进 git——KD 单源 = 本档 KD-10）∥ `.thincoder/`（代理运行期状态）∥ `dist/` ∥ `dist-*/`（打包产物不进 git） |

**行数面机检**：本表迁出后，`checkConfig.lineCounts`（`PROJECT-MANIFEST.json`）读取面 = `docs/desktop/design/PROJECT.md` §4.1（运行根单读）——本表行按同值同步；后续本域新档由落盘批在本表补行（沿 §4.1 纪律）。
**原址指针**：本族各行在 `docs/desktop/design/PROJECT.md` §4.1 已改一行指针（as-of 2026-10-02）。

## 变更记录

- 2026-09-26 建档：桌面端 E2E 测试基建设计（`playwright-core` 驱动 · `thincoder-desktop/test/integration/` 首例 · 家目录隔离 · 固定 PNG 落点 · 单入口并入）。
- 2026-09-26 收正（交付前自检）：坐标形统一为**仓根相对全路径**（`thincoder-desktop/…` / `docs/…`——与桌面端兄弟档同形）；行宽收正；标记语义收正（「拟新增」只留未落盘的新用例档，运行期产物与 `.gitignore` 记「新增」）；§7 增第 9 条（UI / 交互决策 = 空集）；§8 增第 12 项。
- 2026-09-26（**放行落笔轮**）：用例号收正 `T-DSK25 ⇒ **T-DSK27**`（T-DSK25 / 26 为批 A 所占——`docs/desktop/design/PROJECT.md` §7 已落）；`docs/desktop/design/PROJECT.md` 七处落定（§8-7 已解）· 回指链闭合（需求档 **D14**——§8-2 已解）
  · `docs/core/design/TESTING.md` 两处落定（§8-4 / §8-5 已解）· 计数面口径落定（§8-9 已解）· KD-7 行宽折行（契约锚清单落表下注——零新增，行宽收正）。
- 2026-09-27 修正轮（评审 #1–#10 落位）：KD-4 重写（否决项只指产品码改动 · 退路 = 测试侧 `--user-data-dir` 成文）· §3.2 userData 落位行 + 退路段（实施首步实证 · 含两况）· 第 5 / 6 步与 KD-7 注锚限作用域（`[data-settings] [data-section]`）· 契约锚引线收正（`thincoder-desktop/renderer/views/settings.mjs` 263-265 ⇒ 269）
  · `thincoder-desktop/test/run.mjs` 入 §4 表（§8-10 收口）· KD-3 / §1③ 判据句改引 `docs/core/design/TESTING.md` §4.1 / §4.3 · 第 7 步补目录预建 · §4 补锁文件行 · 驱动四条依据落 as-of 读数（KD-1 加失败退路）· `PROJECT.md` 行改 as-of 口径 · KD-7 补 §4.5 对齐句。
- 2026-09-27（**实施后对账轮**）：§6 T-DSK27 态序收正为实证序 `ready,none,ready,ready` · §3.2 / §4 userData 面按现行生效面陈述（`--user-data-dir`——env 改向不达该面）· §4 去「（拟新增）」+ 值回填 **137** 内容行 · §8-11 去 `unverified` · §8-12 转已落 · §8 增第 13 项（改善项 · 登记待裁）；明细 = `docs/batches/2026-09-26-desktop-e2e-infra.md` §2.11。
- 2026-09-27（**批 B 追加轮**）：§3.5 新增（用例 2 = `T-DSK32` 首启空态引导冒烟 · 十一序 + 边界）· §3.4 加同径注（零新通道 / 零新 DOM 锚）· §4 增 `thincoder-desktop/test/integration/first-run-smoke.test.mjs` 行（0 ⇒ ~140 · 待实施）+ 表下 as-of 口径注 · §6 增 `T-DSK32` 行（✅ 做）+ 表下注按批分立
  · §7 项 5 / 项 9 **按批读**（批 B 追加轮驱动的引导面 UI / 交互决策单源 = `docs/desktop/design/UI.md` §1「批 B 追加注」）；明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2.12。
- 2026-09-27（**批 B 追加轮 · 修正轮**——设计评审 §3 轮次 1 逐号点修）：§3.5 **重定驱动面**（十一序 ⇒ **十二序**）：向导退场真点 ⇒ 夹具预置会话槽族档 ⇒ 左列最近目录项真点开项目（实落 `no-message`）
  ⇒ 关唯一标签核 `no-session` ⇒ 引导面 `session:create` 真点（旁证）；桥直调步删 · §3.4 收正「零新通道」+ 本批登记锚 `data-guide` · §4 / §6 行同笔 · 明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.10。
- 2026-09-27（**批 B 追加轮 · 注记修正轮 #106**——设计评审 §3 轮次 2 注记 N3 落）：§3.2 fixture 行加用例面限定（「唯一预置内容」= **用例 1 面；用例 2 见 §3.5**）；明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.11。
- 2026-09-27（**批 B 追加轮 · 实施后对账轮**）：§4 表两行收正（`first-run-smoke.test.mjs` 0 ⇒ **171** 已落 · `files.mjs` 12 ⇒ **19**——两档入册 · 净 0 行）。明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.12。
- 2026-09-28（**R3 结算随收 · 设计面收正微轮**——承 `docs/batches/2026-09-27-render-core-r3.md` §5.9）：§4 补 `chat-render.test.mjs` 行（0 ⇒ **146** 已落）；§6 补 `T-DSK37` 行（✅ 做——R3c）+ 表下注「按批读」补 R3c 落项。零新语义。
- 2026-09-28（**状态栏对齐批 · 设计轮**）：§4 增 `statusline-align.test.mjs` 行（拟新增 · 0 ⇒ ≈110——估价）· §6 增 `T-DSK39` 行（状态栏对齐——真 Electron 打开态对表 · ⏳ 待实施）+ 表下注「按批读」同笔；明细 = `docs/batches/2026-09-28-statusline-align.md` §2。
- 2026-09-28（**状态栏对齐批 · 设计评审轮 1 修正**——发现 6 / 10 逐号点修）：§6 `T-DSK39` 输入与 ① 步**点名真点路径**（最近目录项〔`project:open` + `data-path`〕⇒ 自动续会话开页；备路 = 会话行〔`session:switch`〕）+
  补**夹具前置**（第二枚临时目录作项目根 · 槽 `cwd` = `PROJ`）· §4 该档行同笔 · 表下「单源」口径收正（§4.1 各档现行值 + §4.2 各批触碰面）。明细 = `docs/batches/2026-09-28-statusline-align.md` §2。
- 2026-09-28（**账本可靠批 · 桌面微轮 · 设计轮**——F-L4 桌面端落点）：§4 增 `thincoder-desktop/test/integration/ledger-notice.test.mjs` 行（拟新增 · 0 ⇒ ≈100）· §3.6 新增（`T-DSK40` 账本警示面 · 六序）· §6 增 `T-DSK40` 行 + 按批读注同笔；明细 = `docs/batches/2026-09-28-ledger-reliability.md` §2 微轮块。
- 2026-09-28（**状态栏对齐批 · flags 供面口径修订轮**——实施座实测上抛 + 父侧裁定）：§6 `T-DSK39` 夹具按**可达态**改**两臂**（主臂 = `engineering:true ∧ planMode:false`〔四真不可达——实读 `thincoder-core/session-lifecycle.mjs:126-133`〕· 第二臂 = `planMode:true ∧ engineering:false`）；
  ② 断言随臂收正（主臂三段亮 + `plan` 零节点 / 第二臂 `plan` 亮 + `eng` 零节点；保留 = 段在场 ⊆ 16 码闭集 · 相对序 = 闭集序 · 假 / 缺 ⇒ 零节点）+ 夹具补 `title` 一条（`title` 段在场判据——`newSlotData` 缺省空串，实读 `thincoder-core/session-slot-write.mjs:48`）。明细 = `docs/batches/2026-09-28-statusline-align.md` §2。
- 2026-09-28（**账本可靠批 · 报告面收正轮 · eng-designer**——承三座报告面父侧处置项）：§4 两行按盘收正（`statusline-align.test.mjs` 0 ⇒ **142** · `ledger-notice.test.mjs` 0 ⇒ **121**——均已落；`files.mjs` 12 ⇒ **22**）· §6 `T-DSK39` / `T-DSK40` 两行「待实施」⇒「✅ 做」+ 表下按批读注同拍。明细 = `docs/batches/2026-09-28-ledger-reliability.md` §2.12。
- 2026-09-28（**对齐第三批 · 小修族 25 + 相抵 2 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-vsc-align-3.md` §1）：§4 增 `thincoder-desktop/test/integration/align3-face.test.mjs` 行（拟新增 · 0 ⇒ ≈160）· §6 增 **`T-DSK42` / `T-DSK43`** 两行（对齐第三批真机面——拟新增）
  + `T-DSK37` 块序收正随拍（`user/reasoning/assistant/user`——恢复帧次序）；明细 = 批档 §2。
- 2026-09-28（**对齐第三批 · 小修族 25 + 相抵 2 · 修正轮 1 · eng-designer**——评审轮 1 逐号点修〔8 / 12 / 13〕）：§4 `align3-face.test.mjs` 行补**断言面二分**（离线可产 / 离线不可产⇒人工走查 + 父侧真跑闭合）；§6 `T-DSK42` / `T-DSK43` 两行同拍（② / ③详情面 / ①②③⑥ 标离线不可产；⑤ 设置面 Esc 关闭、⑥ 审批卡真置焦入列）+ 按批读注补本批行。明细 = 批档 §2 修正轮 1 块。
- 2026-09-28（**对齐第三批 · 小修族 25 + 相抵 2 · 微收正轮 · eng-designer**——承批档 §3 轮次 2 新发现 **#17**）：§4 `align3-face.test.mjs` 行与 §6 `T-DSK42` 行断言面收正——「文件链接」移出**离线可产断言面**（历史卡零链接 ⇒ `.file-link` 离线不可产），改标**离线不可产**并入「人工走查 + 父侧真跑闭合」组。明细 = `docs/batches/2026-09-28-desktop-vsc-align-3.md` §3 轮次 2。
- 2026-09-28（**timer-wake 阶段 2 批 · 设计收尾轮 · eng-designer**——承 `docs/batches/2026-09-28-timer-wake-phase2.md` §2）：§4 增 `timer-wake-face.test.mjs` 行（拟新增 · 0 ⇒ ≈120）· §6 增 **`T-DSK44`** 行（到期触发面——拟新增）+ 按批读注同笔；D16 义务在册（验收由父侧真跑闭合）。明细 = 批档 §2。
- 2026-09-28（**回合中插入批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-midturn-input.md` §2）：§4 增 `thincoder-desktop/test/integration/midturn-input.test.mjs` 行（拟新增 · 0 ⇒ ≈130）· §6 增 **`T-DSK45`** 行（回合中插入——拟新增）+ 按批读注同笔；
  机检面点名（`thincoder-desktop/test/queued-input.test.mjs`（拟新增））；D16 义务在册。明细 = 批档 §2。
- 2026-09-28（**timer-wake 阶段 2 批 · 设计评审轮 1 修正（父侧直接执行 · 可 revert）**——承评审 #28 发现 #6）：`T-DSK44` 机检面口径三处统一——§4 行 / §6 行 / 按批读注同拍（**机检面 = 单元域 `timer-wake.test.mjs`**（离线可产）；真机档 `timer-wake-face.test.mjs` = 离线不可产组 ⇒ 人工走查 + 父侧真跑闭合）。明细 = 评审 #28。
- 2026-09-28（**回合中插入批 · 设计收尾微轮 · eng-designer**——承批档 §5 交付转报落点随正）：§6 `T-DSK45` 行机检面落点随正——`thincoder-desktop/test/agent-host-queued.test.mjs`（U217–U219——原 `thincoder-desktop/test/agent-host.test.mjs` 触 500 硬限按在册预案拆出 ∕ 假面共享 `thincoder-desktop/test/agent-host-harness.mjs`）。明细 = 批档 §2（迁移期引文——测试档已退场）。
- 2026-09-28（**文档回填与卫生轮**（台账 #516）· eng-designer）：§4 `midturn-input` 行 0 ⇒ **135**（实读 2026-09-28——已落）· §6 `T-DSK45` 行机检面补 **midturn 用例族 U217–U226** 全谱（U216 空位不回收）。**零新语义**。
- 2026-09-28（**桌面功能对位批 · 设计面收正轮（fix · #129）· eng-designer**——承 flow 批 R10 交付）：§6 按批读注补 **R10 · 子代理面板 ∕ live 面** 行（真机面 = 右列子代理全族——人工走查 + 父侧真跑闭合；测试面随全清令取消）。明细 = `docs/batches/2026-09-28-desktop-feature-parity.md` §2。
- 2026-09-29（**doc-sync-residuals 批 · flow 真机面同步轮 · eng-designer**——承台账 #549 ∕ flow 批 §2.3 第 3 条 + R12 未办 5）：§6 按批读补 **flow 批 · 桌面 ⇒ VSC 对齐（R1–R13）** 真机走查面行（逐面 + 全清令注）。**零新语义**（登记面）。
- 2026-09-29（**复制面对齐 VSC 批 · 修正轮 2（评审 #58 · 发现 1 ∕ 5 ∕ 6 同族扫）· eng-designer**）：§3.3 第 5 ∕ 6 步段集四段 ⇒ **七段**（`SECTIONS` 冻结序 + 段指针按盘收正）；
§3.6 第 4 步 ∕ §6 `T-DSK40` 行警示行锚按盘收正（下拉首行 ∕ `div.session-ledger-notice` ∕ `.session-item` 计数）。**同机制同值**（单源 = `docs/desktop/design/PROJECT.md` §6.1 ∕ `docs/desktop/design/UI.md` §1）。明细 = 批档 §2.10。
- 2026-09-29（**复制面对齐 VSC 批 · 修正轮 3（§3 轮次 3 · 评审 #76 · 发现 1–11 逐号点修）· eng-designer**）：发现 1（🔴 开项目驱动路径按 R13 后形态重锚——§3.5 步 5/6 ∕ §3.6 步 3 ∕ §6 两行：会话控制面项目钮 `button.session-project` + **主进程对话框测试侧替换**（返回 `PROJ`））+ 发现 5（测试层同步：§4 集成档行「已落 ⇒ 已退」、
`files.mjs` **3** ∕ `run.mjs` **49**、「机检面」改述单元测试档惯例）+ 发现 9（设置入口锚改 `#settings-btn`——原 `info-row.mjs` 面退场）。明细 = 批档 §2.11。

- 2026-09-29（**desktop-residuals-sweep 批 · 波 D（非冻结档面）· eng-designer**——承 `docs/batches/2026-09-29-desktop-residuals-sweep.md` §2 · 台账 #540）：退役锚两处处置——§3.5 步 8 `tabbar.mjs` 出处括注删（R13 裁撤无继任）∥ 2026-09-28 行 `agent-host-harness.mjs` 加迁移期引文标记（测试树全清重置）。**零新语义**。
- 2026-09-29（**复制面对齐 VSC 批 · 修正轮 4（§3 轮次 4 · 评审 #107 · 发现 1–5 逐号点修）· eng-designer**）：发现 3（`no-session` 面 ∕ 其引导动作步无可达路 ⇒ 裁退——§3.5 序列 12 ⇒ **10** 步（标题 ∕ §4 档行 ∕ §6 两处随拍；依据 = `tab:close` 零命中 ∧ `session:delete` 末项门 ∧ 开项目恒一次 resume 分配——边界句在册）+ 发现 1（`:131` 机检面改述复核 = 已在盘）+ 发现 5 同族（§4 集成档行复核）。明细 = 批档 §2.12。
- 2026-09-29（**模型菜单全渠批 · W3 文档轮 · eng-designer**——承 `docs/batches/2026-09-29-model-menu-parity.md` §2.6 W3 #14）：§4 增单元测试档行（**300** 行 · 9 用例——集成档未建，回退载体 = 真机 R5 ∕ R6）· §6 增 **`R1`–`R7`** 真机条目行（桌面 + VSC 同配置对拍——父侧收口）+ 按批读注同笔。明细 = 批档 §2。
- 2026-09-29（**doc-sync-residuals 批 · 修正轮（评审 #202 发现 7）· eng-designer**）：§6 按批读 flow 批行**面-号逐项对齐**——逐面挂 R 号（R1 ∕ R3 ∕ R4 ∕ R5 ∕ R2 ∕ R6 ∕ R8 ∕ R9 ∕ R11 ∕ R12 ∕ R13）；R10 注「见上行」、R7 注「不入本走查」（号配单源 = flow 批 §2.2 ∕ §2.8 ∕ §2.9 各轮验收行）。**零新语义**（登记面）。

- 2026-09-29（**doc-backfill 批 · 波 1 · eng-designer**——承 `docs/batches/2026-09-29-doc-backfill.md` §2 · 台账 #594）：§3.5 步 2 骨架三锚首锚收正——
  `[data-slot="projects"]`（R13 已裁撤）⇒ `[data-slot="session-control"]`（骨架 = `thincoder-desktop/renderer/index.html:40`；常量 = `thincoder-desktop/renderer/mount-sessions.mjs:37` `SESSION_SLOT`）。**零新语义**（锚面收正）。
- 2026-09-29（**撤会话头 + 工具头色批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-head-toolcolor.md` §2 · 台账 #668）：§6 `T-DSK43` 行 ③ 句随动——「会话头三值控件 `disabled`」⇒ **「输入区模型 ∕ 推理钮 `disabled`」**（会话头面退场；三值居所 = 输入区控件行——单源 = `docs/desktop/design/UI.md` §1 输入区行）。**零新语义**（面名收正）。
- 2026-09-29（**口子清零二轮 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-hatch-clearance-2.md` §2 · 台账 #673）：§8 项 13 收正——改善项 = **可选**（用户 2026-09-27 口径「参数通道偏好」）· 现形已实证 ⇒ **非缺口**（「另批裁」句退场）；触发条件 = 核侧新增 home 依赖点令隔离失效 ⇒ 随触面批补 seam。**零新语义**。明细 = 批档 §2。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 3 · 余量收尾）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§9 新立**（文件账）——§9.1 本域族行 **3** 行（`thincoder-desktop/test/run.mjs` · `thincoder-desktop/test/files.mjs` ∥ 用例模块行 ∥ `.gitignore`〔KD-10 单源——`dist/` 半随行〕——自 `docs/desktop/design/PROJECT.md` §4.1 逐字迁入；原址各改一行指针）。**零新语义**（迁移 ∥ 指针 ∥ 判域在册）。
- 2026-10-03（**桌面第二实例提示轮 · 跨档随正轮 · eng-designer**——承批档 `docs/batches/2026-10-03-desktop-second-instance-notice.md` §1 · 台账 #838）：三处随正——§1④ `thincoder-desktop/src/main/main.mjs:70` ⇒ **`:92`**；**KD-4** ∥ §3.2 userData 行「非主实例静默退出 ⇒ `firstWindow()` 挂起 / 超时」⇒「非主实例弹模态框待点击（非 `--smoke` 径）⇒ 子进程阻塞待人工点击」（`thincoder-desktop/src/main/main.mjs:70-73` ⇒ **`:92-106`**）——隔离仍为唯一正解零改。**零新语义**（随正）。明细 = 批档 §2 形式化块。
- 2026-10-04（**模型切换解锁批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-desktop-model-switch-unlock.md` §2 · 台账 #918）：**T-DSK43 ③** 句收正（「两钮 `disabled`」⇒ **可点**——落盘保护 ∥ 回写门 = 解锁批批内件）。**零新语义**。明细 = 批档 §2。
- 2026-10-04（**模型切换解锁批 · 修正轮（评审 #53 · 发现 7）· eng-designer**——承批档 `docs/batches/2026-10-04-desktop-model-switch-unlock.md` §3 轮次 1 · 台账 #918 · 父侧裁 = 全采纳）：§6 `T-DSK43` ③ 判据行去沿革从句（新态直陈——沿革载本档变更记录）+ 中断键句按核件两态收正（非在飞 ⇒ 键隐）；§4 / §6 面名收正（忙态写门 ⇒ 忙态两钮可点）。**零新语义**。明细 = 批档 §2 修正块。
