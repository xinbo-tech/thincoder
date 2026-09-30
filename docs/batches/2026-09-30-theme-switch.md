# 2026-09-30 · 主题切换
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 用户 2026-09-30 20:17 走查（原话「我看到过你测试时有暗色的主题，但是并不知道怎么切换主题。」）+ 23:40 批次点火令「A，C」；台账 #743；需求档 = docs/desktop/requirements/PROJECT.md §4 D33（亮 ∥ 暗 ∥ 跟随系统三态 + 记住）。。
> 台账 = #743（UI · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：台账 **#743**（UI · 归批）+ 需求 **D33**（`docs/desktop/requirements/PROJECT.md` §4——亮 ∥ 暗 ∥ 跟随系统三态切换 + 记住）；用户 2026-09-30 20:17 走查原话「我看到过你测试时有暗色的主题，但是并不知道怎么切换主题。」+ 23:40 批次令「A，C」。

**范围**：应用内**三态切换** + **重启记住**；落面 = 实读二择一（裁定 = §2 KD-61）。**边界**：D29 排版基线零动 ∥ 两端（CLI ∥ VSC）零触 ∥ 非色变量零动 ∥ markdown 内容渲染面不碰。

**设计轮** = #1（已完成——裁定 = **渲染面覆盖径**：`data-theme` 三态 + `light-dark()` 单块 + 渲染面 `localStorage` 持久化；落点五档在盘 + §2 在批档）。

**上抛（处置）**：① 窗口画布色 ∥ 原生面仍随系统（**边界 · 非缺陷**——全同步 = 跨进程载波另批）；② 六腿批内件 + 真机 T-DSK54（父侧闭合）；③ 实施批义务 = 键链续写（`SETTINGS_DICT` 56 ⇒ 60 ∥ `HOST_DICT` 295 ⇒ 299）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（主题切换（#743）· 落面裁定 = 渲染面覆盖径（KD-61）· 六腿 + T-DSK54 · 上抛 3 · 2026-09-30）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮（initial）· eng-designer · 2026-09-30**

### 一、本批条目（覆盖）

| # | 条目 | 来源 | 状态 |
|---|---|---|---|
| 1 | **主题切换**：应用内**亮 ∥ 暗 ∥ 跟随系统**三态切换 + **记住**（重启恢复） | 需求 `docs/desktop/requirements/PROJECT.md` §4 **D33**（已落，含判据）+ 台账 #743 | 设计落 ✓（本段） |

- 本批**不含**：核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC ∥ 主进程**行为面**（`window.mjs` 注释两处随正除外）∥ 通道表 ∥ preload ∥ markdown 排版基线（D29 零动）∥ 主题换肤面（色板 ∥ 自定义——未入需求）。
- 需求核对（设计前置）：D33 现文 = 三态 + 记住（重启恢复）+ 落面二择一（实读裁定）+ 同族先例（D30 `localStorage`）——**可机检**（见五）；**无需求缺口**（不上抛需求补件）。
- **实读前提（本批第一裁定）**：现盘 = 纯系统跟随、零切换面（`thincoder-desktop/renderer/theme.css:48` `@media` 双块 ∥ `thincoder-desktop/src/main/window.mjs:61-63` `nativeTheme` 只作画布色事实）；**落面二择一裁定 = 渲染面覆盖径**（判由与被否列 = `docs/desktop/design/PROJECT.md` §2 **KD-61**）。

### 二、设计档落点（D6 读回在盘）

| 档 | 落点 | 内容 |
|---|---|---|
| `docs/desktop/design/UI.md` | `:4`（档头 **D1–D33**）· `:29`（设置面行行内指针）· `:31`（主题行收正）· `:250` ∥ `:259`（D24 注两处计数镜像）· `:661` 起（**本批注（主题切换 · D33）**六项）· `:859`（变更记录） | 形态 ∥ 交互 ∥ 载体 ∥ 边界（形态单源） |
| `docs/desktop/design/RENDERER.md` | `:4`（档头）· `:28`（§1 索引增行）· `:143` 起（**§1.4 主题三态面**）· `:297`（变更记录） | 工艺接入面（模块缝 ∥ 装配两点 ∥ 值面 ∥ 持久化 ∥ 单写者纪律） |
| `docs/desktop/design/PROJECT.md` | `:6`（档头）· `:106`（**KD-61**）· `:219`（theme.css 行）· `:225` ∥ `:251` ∥ `:312`（三行实读收正）· `:240`（theme.mjs 新档行）· `:339` ∥ `:341`（越层段）· `:1075` 起（§4.2 本批块十二行）· `:1106`（§6.1 表头）· `:1176` 起（验收块）· `:1257`（**T-DSK54**）· `:1341`（§8 本批边界行）· `:1457`（§10 **DB**）· `:1871`（变更记录） | 决策 ∥ 受影响文件账 ∥ 验收回指 |
| `docs/desktop/design/SHELL.md` | `:4` · `:117` · `:237` | 宿主面索引（本档只持系统事实之注） |
| `docs/desktop/design/IPC.md` | `:4` · `:460` | 随修（零通道——枚举随动） |

### 三、机制设计（单源 = `UI.md` §1 本批注 ∥ `RENDERER.md` §1.4 ∥ 本档 `PROJECT.md` §2 KD-61）

① **状态载体** = `documentElement` 的 `data-theme`——闭集 `system` ∥ `light` ∥ `dark`（缺省 ∥ 存储缺 ∥ 表外值 ⇒ `system`）；**单写者 = `thincoder-desktop/renderer/theme.mjs`**（`initTheme` 装配期一次 ∥ `setTheme` 出口径）。
② **值面**（`thincoder-desktop/renderer/theme.css`）= 原「亮缺省块 + `@media` 暗块」收敛为**单块 `light-dark(亮, 暗)` 值对**（色值对 **24**——暗值逐字保原；`--error-fg` 同值单列）+ `color-scheme` 三态（`light dark` 缺省 ∥ 两枚 `:root[data-theme]` 覆写）；`@media` 退场；**D29 基线四值（`--font` ∥ `--fs` ∥ `--lh` ∥ `--ls`）零动**。宿主实读 = Electron 44.4.5 ∕ Chromium 152.0.7977.130（`light-dark()` 支持面 = Chromium 123+）。
③ **切换面** = 设置面板头三态钮族（语言控件**左侧**；容器 `div.settings-theme` `role="group"` + `aria-label`；三钮 `data-action="settings:theme"` + `data-theme` = 目标值 + `data-active` ∥ `aria-pressed` 当前态（恰一）；序 = **跟随系统 ∥ 亮色 ∥ 暗色**（缺省态居首——沿「Auto 居首」先例）；缺 handlers ⇒ 三钮 `disabled`；样式并入次级键族——D24 带上）。
④ **持久化（记住）** = 渲染面 `localStorage`（键 `thincoder.desktop.theme`——三值闭集串；端自有 UI 态类——D30 同族先例）；**读 = 装配期一次**（先于首绘可及面）∥ **写 = 每次点按即刻**；读 ∥ 写皆捕获 + `console.error`——读失败 / 表外 ⇒ `system`（降级）；写失败 ⇒ 会话内照常（fail-soft）。
⑤ **store 镜像** = 顶层切片 `theme`（装配播种 ∥ 出口写；`SETTINGS_KEYS` 增 `theme`——设置面重绘触发键）；`dataset.theme` 应用仍在 `theme.mjs`（同步——不经帧）。
⑥ **实现形态**：新档 `renderer/theme.mjs`（注入缝 `{ doc, storage }` ⇒ 平 node 直测；导出 `initTheme` ∥ `setTheme`；常量键 + `THEMES` 闭集）；出口接线 = `mount-settings-exits.mjs` `onSetTheme`。
⑦ **边界**：窗口画布色 ∥ 原生面（菜单 ∥ 对话框 ∥ 标题栏）随系统（主进程不持用户值——`nativeTheme.themeSource` 径被否）；CLI ∥ VSC ∥ 通道 ∥ preload 零触。

**用例表（正常 ∥ 边界 ∥ 错误 · 判据面）**：

| # | 场景 | 输入 ∕ 动作 | 预期 |
|---|---|---|---|
| C1 | 正常 · 三态切换 | 点「暗色」 | `dataset.theme` = `dark` + 底色随暗 + 根 `color-scheme` = `dark` + 存储 = `"dark"`；面上「暗色」钮 `data-active` 恰一 |
| C2 | 正常 · 重启恢复 | C1 后退出再启动 | `dataset.theme` = `dark`（装配期读回应用）+ 存储键在 |
| C3 | 边界 · 跟随系统随动 | 点「跟随系统」后系统深浅翻转 | `dataset.theme` = `system`；底色随媒体翻转（零 JS——声明式） |
| C4 | 边界 · 存储缺 ∥ 表外值 | 冷启无存储 ∥ 存储 = `"blue"` | 视同 `system`（零外写零改） |
| C5 | 边界 · 同值点按 | 点当前态钮 | 幂等（零通知 ∥ 同值重写） |
| C6 | 错误 · 存储读写抛 | storage 抛 | `console.error` 一行 + 零抛；读失败 ⇒ `system`；写失败 ⇒ 会话内照常 |
| C7 | 错误 · 表外目标值 | `setTheme("blue")`（直调） | `null` + 零写 + 零改 + `console.error` |
| C8 | 负控 · 单写者 | 全仓扫描 | `documentElement.dataset.theme` 写径仅 `theme.mjs` 一处 |

### 四、受影响文件与测试面

| 档 | 现行 ⇒ 预期 | 变更 |
|---|---|---|
| `thincoder-desktop/renderer/theme.css` | **96 ⇒ ≈65** | 双块收敛单块 `light-dark()` 值对（24 对）+ `color-scheme` 三态；`@media` 退场 |
| `thincoder-desktop/renderer/theme.mjs`（拟新增） | — ⇒ **≈70** | 三态面模块（键 ∥ `THEMES` ∥ `initTheme` ∥ `setTheme`；注入缝） |
| `thincoder-desktop/renderer/app.mjs` | **300 ⇒ ≈303** | 装配期 `initTheme()` + 切片播种（越 300 咨询线——越层段在册） |
| `thincoder-desktop/renderer/store.mjs` | **303 ⇒ 304** | 顶层切片 `theme` 初态 |
| `thincoder-desktop/renderer/mount-settings.mjs` | **184 ⇒ 185** | `SETTINGS_KEYS` 增 `theme` |
| `thincoder-desktop/renderer/mount-settings-exits.mjs` | **227 ⇒ ≈240** | 主题出口 `onSetTheme` |
| `thincoder-desktop/renderer/views/settings.mjs` | **336 ⇒ ≈357** | 面头三态钮族 + 面模型 `theme` |
| `thincoder-desktop/renderer/settings.css` | **298 ⇒ ≈301** | 钮族带上（越 300 咨询线——越层段在册） |
| `thincoder-desktop/renderer/i18n-settings.mjs` | **141 ⇒ ≈151** | 四键 × 两语；链 `SETTINGS_DICT` **56 ⇒ 60** ∥ `HOST_DICT`（合并表）**295 ⇒ 299** |
| `thincoder-desktop/src/main/window.mjs` | **227 ⇒ 227** | 注释两处（零行为改） |
| 批内件 `docs/batches/2026-09-30-theme-switch.test.mjs`（拟新增） | — ⇒ **≈200** | 六腿（平 node；`--import thincoder-desktop/test/rc-resolve.mjs`）；随批留存 · 不进仓套件 |
| 设计档 ×5（见 §二） | — | 本段已落（读回在盘） |

**零触**：核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC ∥ 通道表 ∥ preload ∥ markdown 内容面（D29）∥ 主进程行为（`window.mjs` 注释除外）。

### 五、验收对照（判据点回需求）

| 需求句（D33 现文） | 机检判据 | 面 |
|---|---|---|
| 应用内亮 ∥ 暗 ∥ 跟随系统三态切换 | 腿 ⑤（CSS 三态结构）+ 腿 ⑥（头三钮）+ 真机 T-DSK54 ①③④ | 批内件 + 真机 |
| 记住（重启恢复） | 腿 ①（读回 ∥ 落写）+ 真机 T-DSK54 ②（两启程） | 批内件 + 真机 |
| 落面二择一（实读裁定） | KD-61（判由 ∥ 被否列）+ 腿 ④（零 IPC——单写者负控） | 设计 + 批内件 |
| （切换面在场 = 前置面） | 腿 ⑥（三钮 ∥ 锚 ∥ 当前态恰一 ∥ 缺 handlers disabled） | 批内件 |
| （失败面 · 零静默） | 腿 ①②③（抛臂 ⇒ console.error + 降级 / fail-soft） | 批内件 |
| （D29 守界） | 腿 ⑤（基线四值逐字零动） | 批内件 |

**腿详（批内件六腿）**：① **存储读回 ∥ 缺省**——假 storage/doc：无值 ∥ `"dark"` ∥ 表外 ∥ 读抛（⇒ `system` + `console.error`）；② **落写 ∥ fail-soft**——`setTheme("dark")` ⇒ `dataset.theme` + `setItem`；`setItem` 抛 ⇒ 属性仍落 + `console.error`；③ **表外值拒绝**——`setTheme("blue")` ⇒ `null` + 零写零改 + `console.error`；④ **单写者负控**——渲染面源扫描：`documentElement.dataset.theme` 写径恰 `theme.mjs` 一处字面；⑤ **CSS 结构**——`theme.css`：零 `prefers-color-scheme` ∥ `light-dark(` 恰 **24** ∥ 两枚 `:root[data-theme]` 规则 ∥ 基线四值（`--font` / `--fs` / `--lh` / `--ls`）逐字零动；⑥ **设置面头**——三钮 ∥ `data-action` / `data-theme` 锚齐 ∥ `data-active` ∥ `aria-pressed` 恰一 ∥ 缺 handlers ⇒ 三钮 `disabled`（描述符树平 node 直测）。
真机 = **T-DSK54**（两启程：切暗 → 重启 → 仍在 ∥ 切亮 ∥ 切回跟随系统 + 负控）——父侧真跑闭合（D16 义务）。

### 六、关键决策（单源 = KD-61）

选定 = **渲染面覆盖径**（`data-theme` 三态状态 + `theme.css` 单块 `light-dark()` 值对 + `localStorage` 持久化——零 IPC）。
被否：`nativeTheme.themeSource` 径（跨进程载波 ∥ 首帧窗结构性劣化 ∥ 媒体回灌隐式耦合——KD-61 被否列）· 共享 config 新字段（跨端共享面——KD-9 被否候选）· 新落盘档（第二份存储——KD-9 ∕ KD-56 被否候选）· 纯 JS 媒体监听（system 态交 JS——冷启首绘窗）· 菜单项切换面（主进程面 + 跨进程状态同步）。

### 七、上抛项（≤3）

1. **（口径披露 · 登记 = `PROJECT.md` §10 DB）**：窗口画布色 ∥ 原生面（菜单 ∥ 对话框 ∥ 标题栏）仍随系统（主进程不持用户值——`themeSource` 径被否）；强制态下首帧前窗底 ∥ 原生面 = 系统态——**边界，非缺陷**；如需全同步 ⇒ 另批（须跨进程载波）。
2. **（观察 · 供评审知情）**：需求 §4 **D32**（发行渠道）设计未立批——本批随修仅做档头枚举号随动（**D1–D31 ⇒ D1–D33**，五档同拍）；D32 验收行待其批落。
3. **（实施批义务）**：批内件六腿（`docs/batches/2026-09-30-theme-switch.test.mjs`）+ 真机 **T-DSK54** 两启程 + PNG（`thincoder-desktop/test/artifacts/theme-switch.png`）；词键四键两语值 = 设计给定（en：Theme ∕ System ∕ Light ∕ Dark；zh：主题 ∕ 跟随系统 ∕ 亮色 ∕ 暗色——改词面 = 词面裁定）；i18n 键链续写（SETTINGS_DICT 56 ⇒ 60 ∥ HOST_DICT 295 ⇒ 299）= 实施轮。

**坐标与读回注（D6）**：§二落点坐标为落笔 as-of 读数（逐档读回已核）；§4.2 预估行数为设计估算——实施批按盘回填。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 文档卫生 ∥ 完整性 | 🟡 | `theme.css` 注释面未入变更列：档头注 `thincoder-desktop/renderer/theme.css:3`（「主题事实源 = 系统…本档经 `prefers-color-scheme` 直接消费」）∥ 暗块互引注族（`:14` ∥ `:15` ∥ `:16` ∥ `:43` ∥ `:56` ∥ `:57` ∥ `:58` ∥ `:59` ∥ `:74`——「暗色块行」引用）落地后皆成失效表述；`docs/desktop/design/PROJECT.md:1079` ∥ 批档 §四 `theme.css` 行变更列只述「双块收敛单块 `light-dark()` 值对 + `color-scheme` 三态；`@media` 退场」，未点名注释随正（对照同批 `window.mjs` 行 `PROJECT.md:1088` 明确点名「注释两处随正」） | 在 `PROJECT.md:1079` ∥ §4.2 行 1 ∥ 批档 §四 `theme.css` 行变更列补「档头注 ∥ 暗块互引注随正」半句（计数点名即可） |
| 2 | 范围协调（R5） | 🟡 | 档头需求侧行随动至 **D1–D33**（`PROJECT.md:6` ∥ `:1871`；五档同拍已核），但 §6.1（`:1106`）与全档零 D32 行（设计目录 grep「D32」零命中）——需求 §4 **D32**（发行渠道）设计未立批，批档 `:107` 上抛② 已披露（「D32 验收行待其批落」）——登记协调项，非本批缺陷 | 维持 上抛② 登记；§6.1 行 ∥ 验收块随 D32 批次补齐（届时档头枚举与行集闭合） |
| 3 | 清晰度 ∥ 坐标 | 🔵 | 落点坐标 `:297` 与现盘不符：批档 §二（`:38`）称 `RENDERER.md` `:297` = 本批变更记录条目，现盘本批条目居 `:299`（`:297` = 消化面留档批 · 回填轮条目）；其余核过坐标（`UI.md:4/29/31/250/259/661/859` · `RENDERER.md:4/28/143` · `PROJECT.md:6/106/219/225/240/251/312/341/1075/1106/1176/1257/1341/1457/1871` · `SHELL.md:4/117/237` · `IPC.md:4/460`）皆准 | 坐标改为现盘行号 `:299`（沿「坐标 = as-of 读数 ∥ 实施轮回填」政策） |
| 4 | 验收判据（强度） | 🔵 | 腿 ④ 单写者负控 = 字面串 `documentElement.dataset.theme` 扫描（批档 `:96` ∥ `PROJECT.md:1177`）——`documentElement.setAttribute("data-theme", …)` 等属性写径不在扫描面（现盘无该写径 ⇒ 非漏判） | 判据补范围句，或并扫 `"data-theme"` 属性名字面（覆盖面 ⊇ 属性写径） |
| 5 | 清晰度 ∥ 计数账 | 🔵 | 值面条点名「色值对 24 + `--error-fg` 同值单列」（`UI.md:665` ∥ `PROJECT.md:1079` ∥ `RENDERER.md:149`），未点名暗块 `--mono` 同值重声明（`theme.css:60` ∥ 注 `:59`）之处置；24 对已核（暗块 26 声明 − `--mono`（非色值）− `--error-fg`（同值 `#f44747`）= 24） | 值面条补半句「非色变量（`--mono`）暗块同值重声明随块消解——单块单留；不入 `light-dark()`」 |
| 6 | 清晰度 ∥ 先例引用 | 🔵 | `RENDERER.md:145` 面判定称「先例 = §1.3（宽度面）+ `dataset.locale` 帧写径」，而 §1.3 判别特征含「**不落 store 切片 ∥ 不进帧分派面表**」（`:134`）；本面反是——② 装配播种 `store.set({ theme })` + `SETTINGS_KEYS` 增 `theme` 重绘键（`:148`），属性写仍同步不经帧（`PROJECT.md:106` KD-61 ⑤） | §1.4 面判定补差异半句（「与 §1.3 差异 = 持 store 镜面（设置面重绘键）；`dataset.theme` 写仍同步不经帧」） |
| 7 | 文档卫生（R7c） | 🔵 | `PROJECT.md:1329`（§8 · 本批（设置面批）不做）理由句「主题切换面（**未在需求档**）」——D33 落需求档后成无效表述；同档先例 = 同行为 `memory:status` 项标「**已落——R2**」；§9 `:1345` 另有「各批落形句 = 各自时点读数（历史面，不追改）」政策（两径取一） | 按同档先例补「已落——D33」标记，或删理由句留批名限定 |

**核过面（阳性证据）**：现盘 spot-check 全中——`theme.css` 内容行 **96**（24 色值对可复算：暗块 26 声明 −`--mono` −`--error-fg`）∥ `app.mjs` **300** ∥ `settings.css` **298** ∥ `store.mjs` **303** ∥ `views/settings.mjs` **336**；链值 `SETTINGS_DICT` **56**（`i18n-settings.mjs:5`）∥ `HOST_DICT` **295**（`i18n.mjs:72`）；越 300 咨询线两档（`app.mjs` ∥ `settings.css`）+ 在册越层档（`views/settings.mjs` ∥ `store.mjs`）皆带拆分预案 ∥ 消解窗口句（`PROJECT.md:341` ∥ `:327` ∥ `:332`）。

VERDICT: pass

计数：🔴 0 ∥ 🟡 2 ∥ 🔵 5（合计 7）· 范围外注 1（`docs/batches/2026-09-29-desktop-micros.test.mjs:66` 断言 `@media (prefers-color-scheme: dark)` 在场——本批落地后该留存批内件前提消失；按「随批留存 · 不进仓套件」非缺陷；grep 级证据 unverified）。

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
