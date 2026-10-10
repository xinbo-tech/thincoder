# 桌面端（DESKTOP）· web 快筛（渲染面脱 Electron 快筛）

**面**：web 快筛工具（`thincoder-desktop/tools/web-quickcheck/`）——本档是该面的单源设计。
**权威面**：真 Electron（走查 + E2E）——**web 快筛不作验收判据** ∥ 不替代走查 ∥ 不入仓套件 ∥ 不作交付依据（裁定 = §1 · 纪律句 = §3.4 · 边界 = §7）。
**上位单源**：`docs/core/design/TESTING.md`（测试纪律 / 承载选型 / 单入口门禁——本档**引用不重述**，D2）；关系档 = `docs/desktop/design/E2E-TESTING.md`（Electron E2E 基建——本档只采其判据形与产物根，零改其面）。
**本批**：`docs/batches/2026-09-30-web-quickcheck.md`（§1 条目 · §2 批条目）；台账 = #434。

## 1. 方案与理由

**目的**：给渲染面改动一条**秒级**反馈路——真浏览器里跑**真渲染面**（真 DOM ∥ 真 CSS ∥ 真布局 ∥ 真事件），脱开 Electron 进程面。

**为什么可行（实读）**：渲染面已是**宿主注入形**——各面装配经 `attachX(host, …)` 取窄桥
（`thincoder-desktop/renderer/app.mjs:62` `attachSettings(host, …)` · `:64` `attachComposer(host, …)` · `:57` `attachPool(host)`），会话族 ∥ 事件面自取 `globalThis.thincoder`（`thincoder-desktop/renderer/session-wire.mjs:31` · `thincoder-desktop/renderer/app.mjs:54`）。
窄桥契约 = `{ invoke(channel, payload) → Promise, on(name, cb) → off }`（装配面 = `thincoder-desktop/src/preload/preload.cjs:76`）。
⇒ **同一缝即可喂浏览器**：静态服务把两棵树同构映射到 `http://127.0.0.1:<port>/`，注入一枚 host shim 供 `window.thincoder`，整面即跑。

**三件东西（台账 #434 消解径）**：① **host shim 契约**（§3.2——窄桥同形 + 有限 stub 表）；② **静态服务**（§3.1——双根供给 + shim 注入）；③ **一条真浏览器冒烟**（§3.3——九段断言序 + 截图）。

**与 #433 基建（`docs/desktop/design/E2E-TESTING.md`）的复用与边界**：

- **复用**：同一枚驱动依赖 `playwright-core`（`thincoder-desktop/package.json:22` devDep——零 postinstall、不下载浏览器；依据 = `E2E-TESTING.md` KD-1）；运行期产物同根 `thincoder-desktop/test/artifacts/`（已由 `thincoder-desktop/.gitignore:2` 忽略）；单入口套件面零改（`thincoder-desktop/test/run.mjs` ∥ `files.mjs` 零触）。
- **边界**：E2E = 真 Electron 全栈（真进程 ∥ 真 preload 白名单 ∥ 真 IPC ∥ `app://` scheme ∥ 真窗口截图）——**验收判据面**；快筛 = 真浏览器 + 假宿主——**开发期回路**。快筛红 ⇒ 渲染面大概率真红（同一份文件被两端取用）；快筛绿 ⇒ 只证渲染面在 shim 契约内自洽，**IPC ∥ 主进程 ∥ 宿主面仍未验**。
- **#433 面零触**：E2E-TESTING.md 本体不改；其 §7 项 1「不做 web 快筛」边界句与 §8-1 上抛项的**状态随动 = §8 上抛 U1**（裁权归主 agent——「不扩 #433 已收口面」）。

**权威面裁定（实读后定形）**：真 Electron 独有且不可脱的面 = preload 通道白名单（`thincoder-desktop/src/preload/preload.cjs:30` `CHANNELS` 46 项 ∥ `:47` `EVENT_CHANNELS` 23 项）· 真 IPC 处理体 · `app://` 特权 scheme（`thincoder-desktop/src/main/protocol.mjs:44`）· 主进程 / 会话 / 模型真链。
⇒ 裁定：**Electron 为唯一权威面**；web 快筛读数**不作验收结论 ∥ 不替代用户走查 ∥ 不入 `npm test` 门**；「快筛过了」不得作为交付依据（纪律句 = §3.4）。

## 2. 关键决策记录

本档 KD 号域 = **W 系列**（与 `docs/desktop/design/PROJECT.md` KD 号域分离——本档专属）。

| KD | 决策 | 理由 · 否决备选 |
|---|---|---|
| KD-W1 | 权威面 = 真 Electron（走查 + E2E）；快筛 = 开发期回路，不作验收判据 | 实读：宿主面（白名单 ∥ 真 IPC ∥ `app://`）不可脱 ⇒ 快筛替代 = 假绿面。否决：以快筛替代走查 ∥ E2E（缺宿主面）；否决：给快筛挂验收级判据（第二权威源） |
| KD-W2 | 实现落点 = `thincoder-desktop/tools/web-quickcheck/`（`serve.mjs` ∥ `host-shim.mjs` ∥ `run.mjs`） | 工具 ≠ 套件：`test/` 树 = 单入口套件域（`thincoder-desktop/test/run.mjs:35-37` 对未登记 `*.test.mjs` 反查即红）；本工具 = 零登记运行路径。否决：落 `test/`（域界 = 目录界被抹平）；否决：落 `scripts/`（与打包链工具 `check-dist.mjs` 混面） |
| KD-W3 | 静态服务 = 自持 `node:http`（三根 + MIME 白名单 + 逃逸 ∥ 点段门 + `127.0.0.1` 绑定） | 语义对齐 `thincoder-desktop/src/main/protocol.mjs`（双根 = `:34-37` ∥ MIME = `:24-31` ∥ 门 = `:53-61`）但**不同源**——本机开发工具、loopback 唯一入口（安全门语义本职在 Electron 侧）。否决：复用 `protocol.mjs`（顶层 `import { protocol } from "electron"`——平 node 不可装载）；否决：抽共用模块（本批产品码零触）。漂移控制 = §3.4 对齐表 + §6 WQ-2 行为腿 |
| KD-W4 | host shim = **服务端静态注入**（`/` 的 HTML 把 shim 脚本行插在 `app.mjs` 前）+ 有限 stub 表（5 通道） | 同源注入 ⇒ Playwright 与手动浏览同一形；CSP `script-src 'self'` 放行同源脚本（`thincoder-desktop/renderer/index.html:7`）。否决：`page.addInitScript` 单用（手动浏览无 shim——半残）；否决：改 renderer 加缝（产品码零触） |
| KD-W5 | 浏览器 = **系统浏览器 channel**（缺省 `msedge`；`--browser=` 覆盖）；不引浏览器下载 | `playwright-core` 零 postinstall、不下载浏览器（`E2E-TESTING.md` KD-1 依据守恒）；本机 Edge ∥ Chrome 两在（2026-10-01 实查）；通道选项在册（`thincoder-desktop/node_modules/playwright-core/types/types.d.ts:17554` `channel?: string`）。否决：引 `playwright` 全包（新增下载面 ∥ 与 #433 依赖面分叉）；否决：缺省静默回退（失败必明示） |
| KD-W6 | 冒烟面 = 引导链（boot ∥ 骨架 ∥ 引导面 ∥ 会话条 ∥ 输入面板）+ **一真事件径**（会话下拉开合）+ CSS ∥ 布局读数 + 截图 + 干净面 | 断言锚全为已登记契约面（§3.3 逐锚实读）；深浅平衡 = 一条覆盖 boot 全链，不叠形状敏感 stub。否决：设置面开合（+≥6 通道 stub——形状敏感、面大值低）；否决：`project:open` 真点链（级联 resume ∥ history 面） |
| KD-W7 | 不入套件、零登记、单入口工具调用（`npm run quickcheck`——scripts +1） | 快筛 ≠ 验收门（KD-W1）；仓套件单入口规则零破（`docs/core/design/TESTING.md` §10 F1/F2）。否决：登记进 `thincoder-desktop/test/files.mjs`（并入套件 ⇒ 慢路复发 + 权威面冲突）；否决：第二 test runner |

## 3. 架构与接口契约

### 3.1 静态服务（`serve.mjs`）

- 绑定 = `127.0.0.1:<port>`（缺省端口 0 = 系统分配，打印实 URL）；可独立运行（打印 URL 待命）∥ 可被 `run.mjs` 导入（导出服务句柄 `{ url, close }`）。
- 路由（三根显式登记 · 前缀序——前两根语义对齐 `thincoder-desktop/src/main/protocol.mjs:34-37`）：

| 前缀 | 供给根 | 档案 |
|---|---|---|
| `/__quickcheck/` | 本工具目录 | 工具资产（`host-shim.mjs`）——本机开发工具专用命名空间 |
| `/rc/` | 核包根（`createRequire` 解析 `@thincoder/render-core/package.json` 所在目录——沿 `protocol.mjs:21` 同法） | 核件（渲染面 `/rc/…` 同源绝对路径 import 面不变） |
| `/` | `thincoder-desktop/renderer/` | 渲染面全档 |

- MIME 白名单 = `.html` ∥ `.mjs` ∥ `.css` ∥ `.svg` ∥ `.png` ∥ `.woff2`（表逐项同 `protocol.mjs:24-31`；表外 ⇒ 404）。
- 门（fail-closed）：点段（`.` ∥ `..` 段）⇒ 404；逃逸（resolve 越根）⇒ 404（判据形对齐 `protocol.mjs:53-61`）。
- **注入**：`/` 与 `/index.html` 响应把 `thincoder-desktop/renderer/index.html:55` 的脚本行 `<script type="module" src="app.mjs"></script>` 替换为 **shim 脚本行 + 原行**（模块脚本按文档序执行 ⇒ shim 先于 `app.mjs` 求值）；**锚缺失 ⇒ 500 + stderr 明示**（fail-loud——不静默出未注入页）。

### 3.2 host shim 契约（`host-shim.mjs`）

`window.thincoder`（= `globalThis.thincoder`）逐形同窄桥：

- `invoke(channel, payload) → Promise<receipt>`——channel ∈ 下表（**9 通道 = 引导链调用集 7 + boot 主题往返 1 + 设置面团队卡读面 1**）⇒ 回定形回执；**表外 ⇒ `Promise.reject(Error("[quickcheck] channel not stubbed: " + channel))`**（沿 preload 表外 reject 先例——`thincoder-desktop/src/preload/preload.cjs:73`）。
- `on(name, cb) → off`——登记入记录面后返回空退订（v1 零事件发射——事件面不在本冒烟）。
- 记录面 `globalThis.__quickcheck = { calls: [], unstubbed: [], subscriptions: [] }`——冒烟末断言 `unstubbed` 为空（**产品 boot 新增通道时此处红** ⇒ 同批扩表——防静默漏面）。

stub 表（回执逐形 = 实读锚）：

| 通道 | 回执 | 实读锚 |
|---|---|---|
| `config:read` | `{ config: {}, locale: "en", dict: {}, configured: true }` | 形 = `thincoder-desktop/src/main/ipc.mjs:83-92`；`dict` 空投影 ⇒ 词面全走宿主表（`thincoder-desktop/renderer/i18n.mjs:369-375`）；`configured: true` ⇒ 越过向导（`thincoder-desktop/renderer/app.mjs:225`） |
| `project:recent` | `{ cwd: null, recent: [] }` | 形判据 = `thincoder-desktop/renderer/session-wire.mjs:36-38` |
| `sessions:list` | `{ sessions: [], ledger: null }` | `thincoder-desktop/renderer/session-wire.mjs:44-48` |
| `model:catalog` | `{ ok: true, models: [], unavailable: [] }` | `thincoder-desktop/renderer/composer-sync.mjs:205-219`（两空 ⇒ 零推送） |
| `provider:list` | `{ ok: true, active: null, presets: [], providers: [] }` | `thincoder-desktop/renderer/mount-settings-reads.mjs:51-71`（无激活 ⇒ 模型段零请求） |
| `ledger:read` | `{ ok: true, counts: null, thresholdReached: false }` | 形 = `thincoder-desktop/src/main/project-info.mjs:36`（主侧契约；渲染面调用点未实读——本冒烟不触） |
| `batch:status` | `{ ok: true, phase: null }` | 形 = `thincoder-desktop/src/main/project-info.mjs:161`（同上） |
| `theme:state` | `{ ok: true }` | 形 = `thincoder-desktop/src/main/ipc.mjs`（`themeState` ⇒ `{ ok:true }` ∥ `invalid-theme`）；调用 = `thincoder-desktop/renderer/app.mjs:299`（boot 主题回写；`ok !== true` ⇒ `console.error` ⇒ 干净面红） |
| `team:status` | `{ ok: true, loggedIn: false, server: null, member: null, label: null }` | 形 = `IPC.md` §2 团队族行（核 `teamStatus()` 投影）；消费 = `thincoder-desktop/renderer/mount-settings-team.mjs`（设置面团队卡读面——为手动浏览与设置面冒烟备） |
**9 通道来源**（引导链实际调用点实读——逐通道）：`config:read` = `thincoder-desktop/renderer/app.mjs:213`（boot 往返）∥ `project:recent` + `sessions:list` = `renderer/session-wire.mjs:43`（`refreshRail` 并发两读）
∥ `model:catalog` = `renderer/composer-sync.mjs:232`（装配首跑恰一次）∥ `provider:list` = `renderer/mount-settings.mjs:158`（`reads.loadProviders()`）∥ `theme:state` = `renderer/app.mjs:299`（boot 主题回写——菜单体系批 D36 落通道、同批未扩表 ⇒ 2026-10-10 父侧补齐）∥ `team:status` = `renderer/mount-settings-team.mjs`（设置面团队卡读面——B1 批落通道）∥ `ledger:read` + `batch:status` = 主侧契约面（`src/main/project-info.mjs:36` ∥ `:161`——渲染面调用点未实读）。
表外行为 = 拒 + 记录——**不猜、不造回执**。

### 3.3 冒烟路径（`run.mjs` · 九段）

1. 起服务（端口 0 ⇒ 读实 URL）；浏览器 = `chromium.launch({ channel, headless: true })`——`channel` 缺省 `msedge`，`--browser=` 覆盖（`chrome` ∥ `msedge` 本机两在——2026-10-01 实查）；启动失败 ⇒ 明示退出（不静默回退）。
2. 上下文 = `{ viewport: { width: 1440, height: 900 }, colorScheme: "light" }`（固定视口 ⇒ 布局读数 ∥ 截图稳定）；挂 `pageerror` ∥ `console.error` 收集器。
3. `goto(base + "/")` ⇒ 等 `document.documentElement.dataset.boot ∈ {ok, error}` **落位** ⇒ 断言 `=== "ok"`（就绪判据同读法 = `E2E-TESTING.md` §1；置位面 = `thincoder-desktop/renderer/dom.mjs:50-53`）。
4. 骨架六槽在场：`[data-slot]` = `session-control` ∥ `flow` ∥ `composer` ∥ `pool` ∥ `status` ∥ `settings`（骨架 = `thincoder-desktop/renderer/index.html:40-42` ∥ `:46` ∥ `:48` ∥ `:53`）。
5. 引导面：`[data-slot="flow"]` 根 `data-state === "none"` ∧ `data-blocks === "0"` ∧ `[data-guide="no-project"]` 在场 ∧ 其动作控件 `button[data-action="project:open"]` 在场
  （判据源 = `thincoder-desktop/renderer/views/chat-guide.mjs:19-22` ∥ `:38-49`；根锚 = `thincoder-desktop/renderer/views/chat-chrome.mjs:26-33`——判据形与 `E2E-TESTING.md` §3.5 步 4 同源）。
6. 会话条 + 输入面板装配：`button.session-project` 在场 ∧ `.session-selector[aria-expanded="false"]` 在场 ∧ `[data-slot="composer"]#toolbar` 内 `#input` ∥ `#send-btn` ∥ `#attach-btn` 在场（装配 = `thincoder-desktop/renderer/mount-composer.mjs:236-243`；输入框 id = `thincoder-render-core/composer/panel.mjs:78-79`）。
7. 真事件径（一径两拍）：点 `.session-selector` ⇒ `aria-expanded === "true"` ∧ `.session-dropdown[data-open="1"]` 在场 ∧ `.session-empty` 在场；点 `[data-slot="status"]`（选择器外）⇒ `aria-expanded === "false"` ∧ `.session-dropdown` 零节点
  （接线 = `thincoder-desktop/renderer/mount-sessions.mjs:113-137` ∥ `:212-223`，空态行 = `thincoder-desktop/renderer/views/session-control.mjs:153-154`）。
8. 真 CSS ∥ 布局读数：`.app` computed `display === "grid"`（`thincoder-desktop/renderer/chrome.css:9-16`）∧ `body` computed `background-color === "rgb(247, 248, 250)"`（亮色 `--bg`——`thincoder-desktop/renderer/theme.css:8`；值随该档改值同拍）∧ `[data-slot="flow"]` 盒宽 ∥ 高 > 0 ∧ `[data-slot="status"]` 盒底 ≈ 视口底（容差 ≤ 2px）。
9. 截图 `page.screenshot({ path })` 落 `thincoder-desktop/test/artifacts/quickcheck-boot.png` ⇒ 断言存在 + PNG magic（前 4 字节 `89 50 4E 47`；判据形 = `E2E-TESTING.md` §1 截图判据）；收口断言 = `pageerror` 零 ∧ `console.error` 零 ∧ `__quickcheck.unstubbed` 零 ⇒ 关浏览器 ∥ 关服务 ∥ exit 0；任一断言败 ⇒ 逐条列报 + exit 1。

**实施首步实证点**（写死风险位）：① 系统浏览器通道可启（`msedge`）；② 引导链在本 shim 下 console 干净（若发现与 shim 无关的良性噪声 ⇒ 停下登记，不静默放宽）；③ 注入锚逐字命中。

### 3.4 与 Electron 权威面的关系判据（纪律句）

1. **证据链**：验收 ∥ 走查 ∥ 交付依据一律出真 Electron（E2E ∥ 真机走查）；快筛读数只进开发回路——不进批档 §6 收口 ∥ 不作核销锚 ∥ 不作完成依据。
2. **红绿含义**：快筛红 ⇒ 先当真因查（渲染面同源）；快筛绿 ⇒ 零验收效力（宿主面未验）。
3. **漂移处置方向**：快筛与 Electron 行为不一致 ⇒ **修快筛**（shim ∥ 服务语义以产品与 `protocol.mjs` 为准——台账 #434 漂移风险的正面承答）。
4. **单源保持**：渲染面文件零分叉（两端取用同一份文件）；shim ∪ stub 表 = 唯一假面；扩面走本档修订（不在工具里就地长语义）。

服务语义对齐表（权威 → 镜像）：

| 面 | `thincoder-desktop/src/main/protocol.mjs`（权威） | `serve.mjs`（镜像） |
|---|---|---|
| 供给双根 | `/rc/` → 核包根 · `/` → `renderer/`（`:34-37`） | 同 + 第三根 `/__quickcheck/`（工具资产——仅本机） |
| MIME 白名单 | `.html/.mjs/.css/.svg/.png/.woff2`（`:24-31`） | 同表 |
| 逃逸 ∥ 点段门 | 段界逃逸 + 点段拒 ⇒ 404（`:53-61`） | 同向 fail-closed ⇒ 404 |
| 入口 | `app://desktop` 特权 scheme | `http://127.0.0.1:<port>` |
| favicon 特例 | （无——协议面零涉） | `/favicon.ico` ⇒ **204**（浏览器面产物特例——#434 实跑取证：真浏览器自动取 ⇒ 服务扩展名门 404 ⇒ 收口 console 判据红；判据**不弱化**） |

## 4. 受影响文件清单

| 档 | 现行 | 预期 | 说明 |
|---|---|---|---|
| `thincoder-desktop/tools/web-quickcheck/serve.mjs`（已落） | 0 | **144**（实读 2026-10-02） | 静态服务（§3.1） |
| `thincoder-desktop/tools/web-quickcheck/host-shim.mjs`（已落） | 0 | **42**（实读 2026-10-02） | host shim（§3.2） |
| `thincoder-desktop/tools/web-quickcheck/run.mjs`（已落） | 0 | **191**（实读 2026-10-02） | 快筛冒烟（§3.3） |
| `thincoder-desktop/package.json` | **23**（实读 2026-10-01——内容行数口径） | 24（+1 行——`quickcheck` script） | `devDependencies` 零改（`playwright-core` 在册复用；`dependencies` 零改） |
| `docs/batches/2026-09-30-web-quickcheck.test.mjs`（已建成 · 137 行——批内件） | 0 | **137**（实读 2026-10-02） | 服务路由 ∥ 门 ∥ shim 契约 ∥ 注入锚面腿；随批留存 · 不进仓套件 |
| `docs/desktop/design/WEB-QUICKCHECK.md` | 0 | 本档 | 设计单源 |
| `docs/desktop/design/PROJECT.md` | 1891 | §4.1 三行（已落——实读回填）+ 值列随动（`package.json` 23 ⇒ 24）· §4.2 本批块 · §5 script 行 · 变更记录 | 已落（设计轮） |
| `docs/desktop/design/SHELL.md` | 238 | §1 树一行 + `package.json` 行随动 + 变更记录 | 已落（设计轮） |
| `docs/README.md` | 141 | 地图（desktop 设计 6 ⇒ 7 ∕ 部分 7 ⇒ 8 ∕ 总 33 ⇒ 34）+ 变更记录 | 已落（设计轮） |

**零改动面**：`thincoder-desktop/src/**` ∥ `thincoder-desktop/renderer/**`（= 产品码全域——宿主注入形已是缝，本批零加缝）∥ `thincoder-desktop/test/**`（套件面——单入口 ∥ 清单零登记）
∥ `thincoder-desktop/src/main/protocol.mjs`（供给语义权威——镜像不改）∥ `thincoder-desktop/.gitignore`（产物根沿用）∥ `docs/desktop/design/E2E-TESTING.md`（#433 面——状态随动 = §8 上抛 U1）
∥ `thincoder-core` ∥ `thincoder-render-core` ∥ 三端测试面。

## 5. 验收判据回指（台账 #434 三件 → 本档落点 → 机检形）

| 判据（台账 #434 消解径） | 本档落点 | 机检形 |
|---|---|---|
| ① host shim 契约 | §3.2 + `host-shim.mjs` | 批内件腿（5 通道逐形 ∥ 表外 reject ∥ 记录面）；冒烟 §3.3 步 9 `unstubbed = 0` |
| ② 静态服务 | §3.1 + `serve.mjs` | 批内件腿（`/` 携注入 ∥ `/rc/` 实供 ∥ 逃逸 404 ∥ 表外扩展名 404） |
| ③ 一条真浏览器冒烟 | §3.3 + `run.mjs` | `npm run quickcheck` exit 0（本机 `msedge`）+ 步 9 截图存在 + PNG magic；错误径（WQ-4）= 不存在通道名 ⇒ 非零退出 + stderr 含该通道名 |
| ④ 权威面关系判据 | §1 裁定 + §3.4 纪律句 | 本批 diff 零触 `test/`（运行期产物根 `test/artifacts/` 除外——冒烟截图落点，已 gitignore） ∥ `src/` ∥ `renderer/`（触碰面 = `tools/` ∥ `package.json` ∥ `docs/`）；套件 `npm test` 面零改 |

**三链同源**：台账 #434（承载 = tech_todo；本批无需求档条目——如需需求档笔 = §8 上抛 U3）↔ 批档 `docs/batches/2026-09-30-web-quickcheck.md` §2 条目 ↔ 本表。

## 6. 用例表

| 编号 | 类型 | 输入 | 期望输出 | 本批 |
|---|---|---|---|---|
| `WQ-1` boot 冒烟 | 正常 | 起服务 ⇒ 系统浏览器 ⇒ §3.3 九段全序 | 九段全绿 + PNG 落点 + `unstubbed = 0` + exit 0 | ✅ 做 |
| `WQ-2` 边界 | 边界 | 表外通道调用 ∥ 逃逸路径 `..%2Fsrc%2Fmain%2Fprotocol.mjs` ∥ 表外扩展名 | 拒（reject + `unstubbed` 记名）∥ 404 ∥ 404 | ✅ 做（批内件腿） |
| `WQ-3` 错误 | 错误 | 注入锚缺失（夹具改 `index.html` 脚本行） | 服务 500 + stderr 明示（fail-loud） | ✅ 做（批内件腿） |
| `WQ-4` 错误 | 错误 | `--browser=<不存在通道名>` 直跑 `run.mjs` | 启动即败：非零退出 + stderr 含该通道名 | ✅ 做（批内件腿：非零退出 + stderr 含通道名） |
| 设置面开合 ∥ provider 真链 ∥ 事件面 ∥ 像素回归 | — | — | 不作（§7 边界——不静默缩水：登记于此） | ❌ 不做 |

## 7. 边界（不做）

1. **不作验收** ∥ **不替代走查** ∥ **不入 `npm test` 门**（纪律句 = §3.4）。
2. **不覆盖宿主面**：主进程 ∥ IPC 真行为 ∥ preload 白名单校验 ∥ 真会话 / 模型链——shim 之外一律不模拟（第二实现 = 漂移源）。
3. **不改产品码**：`thincoder-desktop/src/**` ∥ `thincoder-desktop/renderer/**` 零触（注入缝 = 既有宿主注入形，零加缝）。
4. **不扩 #433 面**：`E2E-TESTING.md` ∥ `thincoder-desktop/test/**` 零触（运行期产物根 `thincoder-desktop/test/artifacts/` 除外——冒烟截图落点，已由 `.gitignore` 忽略）。
5. **不做事件面冒烟**：`on` 空注册（v1——事件面另批另裁）。
6. **不做视觉 ∥ 像素回归**（沿 `E2E-TESTING.md` KD-8 同判）。
7. **不接 CI**（可上 CI 形在——headless + 退出码；接线另批）。
8. **不铸 `T-DSK` 用例号**（快筛 = 工具自检，非验收用例；`docs/desktop/design/PROJECT.md` §7 用例号体系零动）。

## 8. 上抛与报告项

1. **E2E-TESTING.md 状态随动两处**（未触——裁权归主 agent）：其 §7 项 1 边界句「不做 web 快筛」与 §8-1 上抛项（判据④处置）⇒ 现状 = 已另立批（本批）；建议在其对应行补「已另立批」状态（随本批修 ∥ 另立微轮请裁）。
2. **E2E-TESTING.md §3.5 步 4「输入框 `disabled` 真」判据疑陈旧**（报告——另裁）：现行 core 面板 = 常可编辑（`thincoder-render-core/composer/panel.mjs:384-393` `readOnly = false`——INPUT-LOCK-BEHAVIOR-REVISED）；本档 §3.3 步 6 未采该锚。建议随 E2E 重建轮收正。
3. **需求档笔**：`docs/desktop/requirements/PROJECT.md` 是否补「web 快筛 = 开发工具面（非验收）」条目——需求笔 = 主 agent（现承载 = 台账 #434）。
4. **`docs/README.md` 地图随动**：已落（desktop 设计 6 ⇒ 7——本档入册）。

## 9. 文件账（本域 · 迁自 `PROJECT.md` §4.1 ∥ §4.2——as-of 2026-10-02）

### 9.1 本端文件清单与行数预算（web 快筛族行 · 迁自 `PROJECT.md` §4.1——逐字）

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/tools/web-quickcheck/serve.mjs`（已落 · web 快筛批） | **144**（实读 2026-10-02） | 静态服务（三根映射：`/rc/` → 核包根 ∥ `/` → `renderer/` ∥ `/__quickcheck/` → 工具资产；MIME 白名单 + 逃逸 ∥ 点段门；`/` 注入 host shim 脚本行；`127.0.0.1` 绑定 · 端口 0）——机制 ∕ 判据单源 = `docs/desktop/design/WEB-QUICKCHECK.md` §3.1 |
| `thincoder-desktop/tools/web-quickcheck/host-shim.mjs`（已落 · web 快筛批） | **42**（实读 2026-10-02） | host shim（`window.thincoder` 窄桥同形 + 有限 stub 表（7 通道）+ 表外拒 + `__quickcheck` 记录面）——单源 = `docs/desktop/design/WEB-QUICKCHECK.md` §3.2 |
| `thincoder-desktop/tools/web-quickcheck/run.mjs`（已落 · web 快筛批） | **191**（实读 2026-10-02） | 快筛冒烟（系统浏览器 channel（缺省 `msedge`）+ 九段断言序 + 截图落 `thincoder-desktop/test/artifacts/quickcheck-boot.png`）——单源 = `docs/desktop/design/WEB-QUICKCHECK.md` §3.3 |

**行数面机检**：`checkConfig.lineCounts`（`PROJECT-MANIFEST.json`，运行根单读）**逐条声明节域——本表为其一**（本域值行单源）；后续本域新档由落盘批在本表补值行，`docs/desktop/design/PROJECT.md` §4.1 同拍补指针行（沿 §4.1 纪律）。
**原址指针**：本族各行在 `docs/desktop/design/PROJECT.md` §4.1 已改一行指针（as-of 2026-10-02）。

### 9.2 现有文件改动 · 批块（本域 · 迁自 `PROJECT.md` §4.2——逐字）

**本批（web 快筛 · 设计轮 · 2026-10-01 · 台账 #434 · 批 `docs/batches/2026-09-30-web-quickcheck.md`）行「现行 ⇒ 预期」**（实读 2026-10-01——内容行数口径；机制 ∕ 判据单源 = 批档 §2 ∥ `docs/desktop/design/WEB-QUICKCHECK.md`；**设计轮——产品码零触**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/package.json` | **23 ⇒ 24**（scripts +`quickcheck` 一条（`node tools/web-quickcheck/run.mjs`）；devDeps 零改——`playwright-core` 在册复用） | 脚本面 |
| 2 | `thincoder-desktop/tools/web-quickcheck/`（已落 · 新目录） | 0 ⇒ **377**（= 144 + 42 + 191——实读 2026-10-02）（`serve.mjs` ∥ `host-shim.mjs` ∥ `run.mjs`——逐档行 = `docs/desktop/design/PROJECT.md` §4.1） | 工具面 |
| 3 | 批内件 | `docs/batches/2026-09-30-web-quickcheck.test.mjs`（已建成 · 137 行 · 实读 2026-10-02——服务路由 ∥ 门 ∥ shim 契约 ∥ 注入锚面；随批留存 · 不进仓套件） | 全批 |
| 4 | 设计档 | `docs/desktop/design/WEB-QUICKCHECK.md`（新档——本批主交付）· `docs/desktop/design/PROJECT.md` §4.1 三行 + 值列随动 ∥ §4.2 本块 ∥ §5 script 行 ∥ 变更记录 · `docs/desktop/design/SHELL.md` §1 树一行 + 变更记录 · `docs/README.md`（地图 6 ⇒ 7） | 全批 |

零触面：产品码全域（`thincoder-desktop/src/**` ∥ `thincoder-desktop/renderer/**`——宿主注入形已是缝，零加缝）∥ 套件面（`thincoder-desktop/test/**`——单入口 ∥ 清单零登记）
∥ `thincoder-desktop/src/main/protocol.mjs`（供给语义权威——镜像不改）∥ `thincoder-desktop/.gitignore`（产物根沿用）∥ E2E-TESTING.md（#433 面——状态随动 = 设计档 §8 上抛 U1）
∥ `thincoder-core` ∥ `thincoder-render-core` ∥ 三端测试面。

## 变更记录

- 2026-10-01 建档：web 快筛设计（静态服务 + host shim + 真浏览器冒烟 · 九段；权威面 = Electron 裁定；KD-W1–W7；与 #433 复用 ∥ 边界在册）。
- 2026-10-01（修复轮 · 评审轮次 1 · 发现 3/4/5）：WQ-4 机检形定形（不存在通道名 ⇒ 非零退出 + stderr 含通道名——§5③ ∥ §6 同拍）；§3.2「7 通道来源」改逐通道对应 + 装配链注（`mount-settings` → `mount-info`）；§5④ ∥ §7-4 零触句补「运行期产物根 `test/artifacts/` 除外」；`app.mjs` 调用点坐标实读收正 `:218 ⇒ :219`。
- 2026-10-01（**复核扫面收正批（M7 派生）· 文档簇落地轮 · eng-designer**——承 `docs/batches/2026-10-01-audit-remediation.md` §2 · 台账 #769）：stub 表两行退场（`ledger:read` ∥ `batch:status`——复读面删）+ 通道计数 **7 ⇒ 5** 四处同拍（KD-W4 ∥ §3.2 表引 ∥ 来源注 ∥ §6 验收面）+ 装配链注届盘实读收正（`thincoder-desktop/renderer/app.mjs:213` ∥ `mount-settings.mjs:158`）。明细 = 批档 §2。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 3 · 余量收尾）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§9 新立**（文件账）——§9.1 本域族行 **3** 行（`serve.mjs` ∥ `host-shim.mjs` ∥ `run.mjs`——自 `docs/desktop/design/PROJECT.md` §4.1 逐字迁入）＋ §9.2 批块 **1 块**（web 快筛——迁自 §4.2）。**零新语义**（迁移 ∥ 指针）。
