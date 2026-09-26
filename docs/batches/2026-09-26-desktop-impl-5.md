# 2026-09-26 · 桌面端实施批 5（会话族通道 + 左列/标签条接线）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-26 · 来源 = 用户 2026-09-25 22:17「你直接自己跑完吧」（授权与自缚条件见批 3 档 §1.11）——父侧自推：批 4（中区外壳）收口 ⇒ 批 5 = 会话族通道 + 左列 / 标签条接线。
> 台账 = #353（桌面端程序 · 滚动在途 · 本批 = 第 5 段）。前情 = docs/batches/2026-09-25-desktop-impl-4.md §6（已收口 2026-09-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-26
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 2026-09-25 22:17「**你直接自己跑完吧**」（授权射程与自缚条件 = 批 3 档 §1.11）——父侧自推：批 4（中区外壳）收口 ⇒ **批 5 = 会话族通道 + 左列 / 标签条接线**——把批 3 / 批 4 留下的 `disabled` **诚实形接通**。

### 1.2 本批交付目标

1. **通道族**（设计面 = `docs/desktop/design/IPC.md` §2 会话族行）：`session:create` / `session:switch` / `session:rename` / `session:delete` / `session:resume`——载荷与失败面照 IPC.md 行 + `sessions:list` 先例；`preload.cjs` 白名单 **4 → 9**（顺序锁定 · 三处断言 + 清单随动）。
2. **左列接线**：会话行点击 = 切换 / 恢复（`session:switch` / `session:resume`）；空态新建入口 = `session:create`；启动态「打开目录」与最近目录项 = 已接线（`project:open`）复核。
3. **标签条接线**：标签点击 = 激活；关闭控件 = 关闭标签（**运行中需确认** · `UI.md:17`）；新建控件 = `session:create`。
4. **重命名 / 删除**：以设计现状为准——通道落齐；**UI 入口若设计未给 ⇒ 只落通道 + 上抛**（不擅加 UI 主张）。

### 1.3 判据（机器可核 · 待 §2 细化）

① 五通道端到端（主进程读面 + 白名单 **九项定序**）；② 左列接线三态（行点击 / 空态入口 / 启动态入口）；③ 标签条激活与关闭（含**运行中确认**语义——确认面形态由 §2 定形）；④ 词表键齐（零硬编码）；⑤ **零回归**（46 例不红 · 新增全绿 · 三包增量零（基线相对形）· doc-check 失败行集合无新增）；⑥ 视图面判据形态沿 `docs/desktop/design/RENDERER.md` §1.1。

### 1.4 边界（本批不含）

对话流 / 工具卡 / 审批卡（`views/chat*.mjs`）· 活动池 · 设置 / 首启向导 · **agent 装配**（`agent-host.mjs`——会话可开 / 可切 / 可重命名，但「发消息」仍无供给）· 打包分发 · 主题切换面。

### 1.5 已知事实 / 依赖 / 条件触发

- 批 4 已收口（46/46 · 冒烟 `boot:"ok"`）；`sessions:list` 已落（批 3）；未接线诚实形先例 = 批 3 / 批 4 的 `disabled` + `data-action`。
- 设计锚：`IPC.md` §2 会话族行 · `UI.md:17`（交互行：Enter / Shift+Enter / Ctrl+1..9 / **关运行中标签需确认**）· `PROJECT.md` §7（T-DSK3 / T-DSK12 / T-DSK20）· 需求档 §3.1 / §3.5。
- **台账 #405 条件触发**：若本批触碰 `thincoder-desktop/test/views.test.mjs`（322 行在册例外）⇒ **须执行二次拆分**（U49–U52 面拆 `views-chrome.test.mjs`）+ `test/files.mjs` 清单随动 + 预算表回填。
- 台账 #401（启动态中区引导面）不阻塞本批；#397（locale 供给）仍不修。

### 1.6 设计轮裁定 + 上抛处置（父侧 · 2026-09-26 00:29）

- **判据⑤ 口径裁定 = 收**（设计轮 §2.10 收窄送裁）：⑤ 读作「**本批新增 / 改动行零悬空、零新增超宽**」——全仓闸态余量（**悬空 4 + 超宽 18**）为前批遗留（core / vsc 档 · 本批未触）⇒ **非本批射程**；全仓归零属独立批次（该族债已在册）。
- **上抛处置（S1–S5 全收）**：
  - **S1**（关闭确认面实机不可达：`tabBadges` 零 writer ⇒ `needsCloseConfirm` 恒假，仅树面机检可达）⇒ **收**（树面机检 = 正确形态；运行期可达随值面 / agent 批 —— 登记在案，不阻塞）。
  - **S2**（标签键位 `Ctrl/Cmd+1..9` 未接线）⇒ 收（延后随接线批）。
  - **S3**（T-DSK3 走查口径：重命名 / 删除**零 UI 入口**）⇒ 收（与 §1.2-4 裁定一致 ✓ 已加注）。
  - **S4**（题外：`IPC.md:47` 坐标漂移 · 台账 #392 / #393 / #401 / #397 · 批 4 §2.12 时点值）⇒ 均在册，不动。
  - **S5**（全仓闸态遗留 4 / 18）⇒ 承判据⑤ 裁定（非本批域）。
- **评审**：设计评审**已发**（#59 · 本块落地后同轮点火）——通过后逐条裁定 → 修复轮（如需）→ **§4 代签** → 实施。

### 1.7 首轮评审裁定 + 修复轮（父侧 · 2026-09-26 00:35）

- **#59 = pass**（🔴 0 / 🟡 7 / 🔵 4）——**十一条全收** ⇒ 修复轮 **#60**（§2.13 形态 · 逐号 1–11 · 修后为准）。
- **承重项口径**：
  1. **条目 6**（打开即续）补判据 / 用例落点，并定义「成功」判据（`project:open` 为 fail-soft、无成功旗标：`projects.mjs:114-120`）。
  2. **U51**（闭集用量面 · `views.test.mjs:275`）随动说明补「walk 增确认面树（`pendingClose` 命中态）」——否则断言不可满足。
  3. **判据③** app 侧接线明写机检 / 人工边界 + 按 `:319` 先例补结构断言。
  4. **条目 4**（标签点击激活）运行期边界（非活动标签 `inert` ⇒ 不可点）入上抛（S 族 / S1 同族）。
  5. **信封 reason 面**：记法统一为 `reason: null|string`（§2.1 行 2 / `IPC.md:51`）· `IPC.md:52` 载 cwd 空档不对称 + `slot-missing` 三因语义。
  6. **档内计数 / 状态副本随动面**补齐（`preload.cjs:7-8` · `ipc.mjs:2` · `i18n.mjs:5` · `views/sessions.mjs:14/:16-17` · 两测试档「四项」措辞）；**U40 死 token**（`views.test.mjs:84`）改 `session:switch` 或删。
  7. `UI.md:23`「退回启动态 = 左列项目区入口」收窄（删）或登记待落项。
  8. 确认面两键定 `data-action` / class + 纳入 U55 两态 + `styles.css` 行（如需）。
  9. 拆分预案随动面补 U51 扫描清单 / U52 导出锁 / `PROJECT.md` §4.1。
  10. `PROJECT.md:117` 措辞改条件式（或例外行保留至 §5 落地）。
  11. `SHELL.md:23/:61`「七项绑定转口」措辞分层（端参绑定 3 · 同形转口 1 · 纯 re-export 1）。
- **排程**：修复轮落 → 父侧核验 → **§4 代签** → 实施。

### 1.8 实施中裁定：`views-tabbar.test.mjs` 329 > 300（父侧 · 2026-09-26 01:06）

- **情形**：实施（#61）实读 `test/views-tabbar.test.mjs` **329**（预算 ~265 · **超拆分层 29**）· `views-chrome` 213（~155）· `session-contract` 280（~240）· `store` 227（~215）· `views` 200（~200 **层内** ✓）；其余全绿（**51/51** · 冒烟 `ok:true` · served 10）。
- **裁定 = 不拆档**：按原清单交付 + **如实回填实读**；329 按**在册例外**受理（先例 = 批 4 `views.test.mjs` 322）· **消解窗口 = 该档下次被触碰的批**；其余超预算档 = **收（以实读为准）**。
- **归口**：例外登记 + 各档实读回填 + 清单 / 档数 / 预算随动（`test/files.mjs` · `PROJECT.md` §4.1 · `SHELL.md:37`）= **实施后修正轮（设计面）**；实施舱**不拆档 / 不动设计档 / 不改清单**（已回令）。
- **理由**：① 该档为本批刚建的拆分产物（#405 的落地形态），即刻二次拆分 = churn，收益（29 行）低于成本；② 与批 4 裁定同律（受理 + 带窗口的例外）；③ 层规则要求「拆分**评审**」——本例评审结论 = **受理并带消解窗口**（在册）。

### 1.9 落地核验 + 修正轮（父侧 · 2026-09-26 01:17）

- **交付核验 = 通过**（父侧亲跑）：`npm test` ⇒ **51/51 · fail 0**（U53–U57 全绿：行两锚 / 标签接线 / 确认面 / store 三动作 / 五通道往返含负例；U27 = 白名单**九项**顺序）；冒烟 ⇒ `ok:true ∧ boot:"ok" ∧ served:10`；`test/files.mjs` = **八档** ✓；行数实读复核（内容行数）：`views.test.mjs` **200**（322 → 200 = 台账 **#405 消解** ✓）· `views-chrome.test.mjs` 213 · `views-tabbar.test.mjs` 329 · `session-actions.mjs` 67 · `app.mjs` 209；`session-actions.mjs` 逐行实读 = 设计形态（信封 / `no-project` 仅 create-rename-resume / `slot-missing` 统一档 / rename 四值直传 / 抛不吞 / 零核导入 ✓）。
- **修正轮 #62 已派**（设计档随动：全表实读回填 + 300 层例外换防（删 322 旧例外 · 登记 329 新例外带窗口）+ 陈旧标记 / 措辞收正）；**依 #404 纪律：修正轮落地核验 ⇒ 才 close**。
- **台账**：#405 条件已触发且落地核验 ⇒ **核销**（两步）；新品例外 = **#407**（329 · 条件型 · 窗口 = 该档下次被触碰）；域外注 `resumeSlot` 裸版 ⇒ **#406**（条件型）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（批 5 五档设计 + 修复轮 #60（§2.12）· 实施后修正轮 #62 逐号 1–4 收正落档（§2.13）· 闸态余 4 悬空 / 18 超宽 = 前批遗留 · 2026-09-26）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批覆盖（条目表）

| # | 条目 | 需求 / 上溯回指 | 本批形态 |
|---|---|---|---|
| 1 | 会话族五通道落地 | 需求 §4 D2（`docs/desktop/requirements/PROJECT.md:81`）· `docs/desktop/design/IPC.md` §2 会话族行 | 端壳新增 `session:create` / `session:switch` / `session:rename` / `session:delete` 四写通道 + `session:resume` 接续通道；五通道全经核入口（`@thincoder/core/session.mjs`），端层**零算法副本** |
| 2 | 通道回执信封 | 批档 §1.3 ① · 先例 = `IPC.md` §2 `config:read` | 统一 `{ ok, reason?, cwd, slot }`；reason 分档 = `no-project`（动作层判 cwd）/ `slot-missing`（动作层整形）/ `invalid-slot|file-missing|parse-failure|mtime-conflict`（核 `renameSlot` 闭集**直传**）；意外抛 = invoke 拒绝（fail-loud） |
| 3 | 左列接线 | 需求 §3.1 左列会话行（`docs/desktop/requirements/PROJECT.md:45`）· `docs/desktop/design/UI.md` §1 左列行 | 行点击 = `session:switch` ⇒ 开标签；空态新建入口 / 标签条新建控件 = `session:create`；行 `data-action` 由占位 `session:resume` 收正为 `session:switch` |
| 4 | 标签条接线 | `docs/desktop/design/UI.md` §1 标签条行 · 交互行 | 标签点击 = 激活（与行点击**同一路** `activateSession`）；关闭 = 经确认面；新建 = `session:create` |
| 5 | 关闭确认面 | `docs/desktop/design/UI.md` §1 交互行（关闭含确认） | `pendingClose` 单键 + 判据 `needsCloseConfirm(codes)`（codes ∩ {approval, running}）；树面关闭控件**原位换两枚文本按钮**（DOM 序 = 取消 → 确认） |
| 6 | 项目打开即续 | 需求 §3.1「点开即可续」· `docs/desktop/design/IPC.md` §2 项目面注项 3 | `project:open` 成功 ⇒ 自动 `session:resume` ⇒ 开标签 + 两读面刷新 |
| 7 | 白名单九项 | 批档 §1.3 ① · `docs/desktop/design/IPC.md` §2 会话族行 | `thincoder-desktop/src/preload/preload.cjs:10` 单源 4 → **9** + 三断言点同步（`thincoder-desktop/test/host-floor.test.mjs:79` · `thincoder-desktop/test/projects.test.mjs:165` · `thincoder-desktop/test/session-contract.test.mjs:144-152`） |
| 8 | 在册例外消解 | `docs/desktop/design/PROJECT.md:116-117`（消解窗口 = 本批） | U49–U52 迁 `thincoder-desktop/test/views-chrome.test.mjs`；`thincoder-desktop/test/files.mjs` 清单七档 → 八档；`views.test.mjs` 322 → ~200 |
| 9 | 零回归 | 批档 §1.3 ⑤ | 46 例不红 → 本批后 **51** 例；核 / CLI / 扩展三包零增量；`doc-check` 过 |

**本批不含**（沿批档 §1.2 项 4 / §1.3 边界）：对话流 · 活动池 · 设置面 · agent 装配 · 打包链；`session:rename` / `session:delete` **只落通道 + 用例、零 UI 入口**（UI 入口随会话管理面批——见 §2.7）。

### 2.2 逐面契约（机制设计）

**（a）端壳转口面**（`thincoder-desktop/src/main/session-slots.mjs`，实读 64 行 → ~76）

既有 `resumeSlot`（`:64`，`(cwd) => coreResumeSlot(cwd, { end: END })`，async——核 `thincoder-core/session-lifecycle.mjs:43`）即**接续转口**；本批加**三项同形端参绑定转口** + **一项纯 re-export**：

- `newSession = (cwd) => coreNewSession(cwd)` —— 核 `thincoder-core/session-lifecycle.mjs:183`（**async**）；其 marker 写（`:245-246`）**无端参** ⇒ 端名声明（`session-slots.mjs:41 setSessionEnd(END)`）即覆盖，端层不传端参；
- `switchToSlot = (cwd, slot) => coreSwitchToSlot(cwd, slot, { end: END })` —— 核 `:289`（同步；判据 `data|null`），`:306` 写端参 marker；
- `deleteSlot = (cwd, slot) => coreDeleteSlot(cwd, slot, { end: END })` —— 核 `thincoder-core/session-slots.mjs:225` → bool；
- `renameSlot` —— **纯 re-export**（核 `thincoder-core/session-rename.mjs:16`；端无关、不碰 marker；回执 `{ok, reason?}`，reason 闭集单源 = `:15`）。

导入面 = `@thincoder/core/session.mjs`（四名皆在该档 re-export：`:41` / `:45` / `:52`）——端壳核门只此一处。

**（b）动作层**（新档 `thincoder-desktop/src/main/session-actions.mjs`，0 → ~85）

五函数 + 信封整形，**零算法副本**（不预校验槽号、不做端层规则）：

| 函数 | 调用链 | `ok` 判据 | reason 分档 |
|---|---|---|---|
| `createSession(cwd)` | `newSession(cwd)`（await） | 恒 `ok`（核返回槽号） | cwd 空 ⇒ `no-project` |
| `switchSession(cwd, slot)` | `switchToSlot` | 返回体非 null | 核 null ⇒ `slot-missing` |
| `renameSession(cwd, slot, title)` | `renameSlot(cwd, slot, title)` | `ok === true` | cwd 空 ⇒ `no-project`；否则核 reason **直传**（四值闭集） |
| `deleteSession(cwd, slot)` | `deleteSlot` | 返回 `true` | 核 `false` ⇒ `slot-missing` |
| `resumeSession(cwd)` | `resumeSlot(cwd)`（await） | 恒 `ok`（核恒返回槽号——兜底 `allocateFresh`） | cwd 空 ⇒ `no-project` |

信封 = `{ ok, reason: null|string, cwd, slot }`（`slot` = 成功时槽号，否则 `null`）。**不做端层槽号预校验**（零语义副本：`switch` / `delete` 收非整数 ⇒ 核判 `slot-missing`，不再造第二份 `invalid` 判据）；`title` 直传核（端层零规整）。意外抛**不吞**、直传 invoke 拒绝（fail-loud——沿 `config:read` 先例）。

**（c）通道表**（`thincoder-desktop/src/main/ipc.mjs`，实读 71 行 → ~78）

`HANDLERS` 冻结表（`:35-40`）4 → **9** 项，序 = `config:read, project:open, project:recent, sessions:list, session:create, session:switch, session:rename, session:delete, session:resume`；新五项载荷 = 无（create / resume）· `{slot}`（switch / delete）· `{slot, title}`（rename）。注册面（`:62-71`）不改形（逐项缺体即抛）。
`thincoder-desktop/src/preload/preload.cjs:10` 白名单**同序** 4 → 9（单源）。

**（d）状态树**（`thincoder-desktop/renderer/store.mjs`，实读 159 行 → ~190）

- 初态（`:23-37`）增切片 `pendingClose: null`（值 = 待确认关闭的标签键）；
- 判据 `needsCloseConfirm(codes)` = `codes` ∩ `{approval, running}` ≠ ∅（`codes` = 标签状态码集，与 `deriveTabBadge`（`:100`）同入参形）；
- 三纯动作（同既有纪律：拒收 / 无变化 ⇒ **原引用**）：`requestCloseTab(state, key, codes)`（键不在 `tabs` ⇒ 原态；需确认 ⇒ 置 `pendingClose`；**不需 ⇒ 直接 `closeTab`**——守卫内化）· `confirmCloseTab(state)`（`pendingClose` 非空 ⇒ `closeTab` + 清键）· `cancelCloseTab(state)`（清键）。

**（e）视图面**（`thincoder-desktop/renderer/views/sessions.mjs`，实读 250 行 → ~285）

- **接线形通则**（本批立，沿既有 `control()` `:147-152` 形）：handlers 给 ⇒ 落 `onClick`、**无** `disabled`；缺省 ⇒ `disabled: true` + `data-action`（诚实非死控）。标签条面同形（现全项硬 `disabled`）。
- rail handlers = `{ onOpenDir, onOpenRecent, onSession, onNewSession }`：会话行（`:105-112`）点击 ⇒ `onSession(String(row.slot))`；空态新建入口（`:95-97`）⇒ `onNewSession`；行 `data-action` `session:resume` → **`session:switch`**。
- tabbar handlers = `{ onActivate, onClose, onConfirmClose, onCancelClose, onNew }`；`tabbarModel`（`:170`）增 `pendingClose` 入参（每标签得 `pendingClose: boolean`）。
- **确认面树形**：`tab.pendingClose === true` ⇒ 标签项加 `data-confirm="1"`，子序 = [标签控件, **取消**, **确认**]（关闭控件**原位退出**）；两按钮 = 文本按钮（词键 `tab.action.close.cancel` / `tab.action.close.confirm`）——无图标字形、无 dialog、无 `window.confirm`、无超时自动消。
- `iconControl(spec, onClick)`（`:243`）：加可选接线参（缺省 ⇒ `disabled`）——关闭 / 新建两枚同形。

**（f）路由与刷新**（`thincoder-desktop/renderer/app.mjs`，实读 107 行 → ~140）

- `activateSession(slot)` = `session:switch` ⇒ `ok` ⇒ `openTab(String(slot))` + `refreshRail()`；**行点击与标签点击同一路**（切标签 = 切换会话）。
- `session:create` ⇒ `ok` ⇒ `openTab(String(slot))` + `refreshRail()`。
- `openDir(path)`（`:69`）成功 ⇒ 追加 `session:resume` ⇒ `ok` ⇒ `openTab(String(slot))` + 两读面刷新（**点开即续**）。
- 关闭三出口：关闭控件 ⇒ `requestCloseTab(state, key, state.tabBadges?.[key] ?? [])` ⇒ `store.set(next)`；确认 ⇒ `confirmCloseTab`；取消 ⇒ `cancelCloseTab`。
- `SHELL_KEYS`（`:25`）增 `pendingClose`（确认面重挂触发）；`paintRail`（`:43`）/ `paintShell`（`:49`）改传两组 handlers；动作入口一律 `host.invoke(...)` + 失败 `console.error`（不静默——沿既有面）。

**（g）词表面**（`thincoder-desktop/renderer/i18n.mjs`，实读 97 行 → ~101）

宿主专有键 +2 = `tab.action.close.cancel`（取消 / Cancel）· `tab.action.close.confirm`（关闭 / Close）⇒ 12 → **14**（机检 = U51）。

### 2.3 受影响文件与设计档落点（实读 → 预估；口径 = 内容行数 · 文末换行不计）

**产品面（主进程 / 预载 / 渲染面）**

| 文件 | 实读 | 预估 | 改动 |
|---|---|---|---|
| `thincoder-desktop/src/main/session-actions.mjs`（新增） | 0 | ~85 | 五通道动作层 + 回执信封（零算法副本） |
| `thincoder-desktop/src/main/ipc.mjs` | 71 | ~78 | `HANDLERS` 4 → 9 + 五项处理体 + 一行导入 |
| `thincoder-desktop/src/main/session-slots.mjs` | 64 | ~76 | 三项端参绑定转口 + `renameSlot` 纯 re-export + 头注块 ② 计数随动 |
| `thincoder-desktop/src/preload/preload.cjs` | 24 | ~29 | 白名单 4 → 9（单源） |
| `thincoder-desktop/renderer/store.mjs` | 159 | ~190 | `pendingClose` 切片 + `needsCloseConfirm` + 三纯动作 |
| `thincoder-desktop/renderer/app.mjs` | 107 | ~140 | 两组 handlers + `activateSession` + 创建 / 接续触发点 + `SHELL_KEYS` 增键 |
| `thincoder-desktop/renderer/views/sessions.mjs` | 250 | ~285 | 左列两类接线 + 标签条全接线 + 确认面树形 + `iconControl` 接线参 |
| `thincoder-desktop/renderer/i18n.mjs` | 97 | ~101 | 宿主键 12 → 14 |

`views/sessions.mjs` 预估 ≲ 300（主动拆分层）——**拆分预案**：超 300 ⇒ 标签条面（`tabbarModel` / `tabbarTree` / `mountTabbar` 及其子构树）拆 `thincoder-desktop/renderer/views/tabbar.mjs`（`docs/desktop/design/SHELL.md` §1 树随动）。

**测试面**

| 文件 | 实读 | 预估 | 改动 |
|---|---|---|---|
| `thincoder-desktop/test/views.test.mjs` | 322 | ~200 | U49–U52 迁出（-144）+ U53（左列接线形） |
| `thincoder-desktop/test/views-chrome.test.mjs`（新增） | 0 | ~155 | U49–U52 迁入 + 自带头（含 U51 计数 12 → 14 · U52 清单两向随动） |
| `thincoder-desktop/test/views-tabbar.test.mjs` | 228 | ~265 | U48 原址更新（未接线形 → 接线形）+ U54（标签条接线形）+ U55（确认面） |
| `thincoder-desktop/test/store.test.mjs` | 184 | ~215 | U56（`pendingClose` + 三动作 + 判据） |
| `thincoder-desktop/test/session-contract.test.mjs` | 199 | ~240 | U37 原址更新（白名单 4 → 9 定序）+ U57（五通道往返） |
| `thincoder-desktop/test/host-floor.test.mjs` | 92 | 92 | 白名单断点（`:79`）九项随动 |
| `thincoder-desktop/test/projects.test.mjs` | 193 | 193 | 白名单断点（`:165`）九项随动 |
| `thincoder-desktop/test/files.mjs` | 6 | 6 | 清单七档 → 八档（`views-chrome.test.mjs`） |

**设计档落点**

| 档 | 改动 |
|---|---|
| `docs/desktop/design/IPC.md` | §2 会话族行（五通道落地）+ 会话族注（信封与 reason 分档）+ 项目面注项 3（`session:resume` 触发点）+ 变更记录 |
| `docs/desktop/design/UI.md` | §1 标签条行 / 交互行（关闭确认面落形）+ 左列行（接线落地）+ 变更记录 |
| `docs/desktop/design/SHELL.md` | §1 树加 `session-actions.mjs` 行 + 会话行转口计数随动 + 变更记录 |
| `docs/desktop/design/RENDERER.md` | §1 工艺索引增「接线形通则」行 + 变更记录 |
| `docs/desktop/design/PROJECT.md` | §4.1 行数预算（产品面 4 行 + 测试面 8 行）+ `:116-117` 在册例外消解（二次拆分已落档）+ §7 T-DSK3 注 + 变更记录 |

### 2.4 用例表（U53 起续号；判据形态沿 `docs/desktop/design/RENDERER.md` §1.1——纯构树零 DOM，平 node 直测）

| 用例 | 场景 | 输入 | 预期输出 | 落档 |
|---|---|---|---|---|
| U53 | 左列接线形 | `railTree(model, handlers)` 两态调用（给 / 缺 handlers） | 给 ⇒ 会话行 / 空态新建入口落 `onClick` ∧ 无 `disabled` ∧ `data-action` = `session:switch` / `session:create`；缺 ⇒ `disabled: true`（树形其余等价） | `thincoder-desktop/test/views.test.mjs` |
| U54 | 标签条接线形 | `tabbarTree(model, handlers)` 给 / 缺 handlers | 给 ⇒ 标签控件 `onClick` 携带本键、关闭 / 新建控件同形落接线、无 `disabled`；缺 ⇒ 全控制项 `disabled: true` | `thincoder-desktop/test/views-tabbar.test.mjs` |
| U55 | 关闭确认面 | `pendingClose` 命中 / 未命中两模型 | 命中 ⇒ 标签项 `data-confirm="1"` ∧ 子序 = [标签, 取消, 确认] ∧ 两键文本 = 词表值 ∧ 关闭控件退出；未命中 ⇒ 原形（关闭控件在位、无 `data-confirm`） | `thincoder-desktop/test/views-tabbar.test.mjs` |
| U56 | 状态树确认三动作 | `requestCloseTab`（需确认 / 不需 / 键不在）· `confirmCloseTab` · `cancelCloseTab` · `needsCloseConfirm` 四组入参 | 需确认 ⇒ 置键（`tabs` 不变）；不需 ⇒ 直接关（邻位接管律不变）；键不在 ⇒ **原引用**；`confirmCloseTab` ⇒ 关 + 清键；`cancelCloseTab` ⇒ 清键；判据 = `approval` / `running` 命中为真、`done` / `idle` / 空集为假 | `thincoder-desktop/test/store.test.mjs` |
| U57 | 五通道往返 | 临时 sessions 目录（核 `_setSessionsDirForTest` 缝）+ 五通道逐个调用 + 负例（cwd `null` · 不存在槽号 · rename 四闭集 reason） | 每通道信封形 = `{ok, reason, cwd, slot}`；成功 ⇒ 槽面可回读；失败 ⇒ 对应 reason 档；另端 marker（`.cli` / `.vscode`）零触碰 | `thincoder-desktop/test/session-contract.test.mjs` |

**原址更新**：U37（`session-contract.test.mjs:144-152`——白名单四项定序 ∧ 冻结 ⇒ **九项**定序 ∧ 冻结）· U48（`views-tabbar.test.mjs:192`——`disabled` 断言改**接线形**；零字形 / 常量单源两项不动）· U51（迁后 12 → **14** 键）· U52（迁后清单两向 + 导出面锁随本批导出面随动）· `host-floor.test.mjs:79` · `projects.test.mjs:165`（白名单断点九项）。
**拆档**：`views.test.mjs:179-322`（U49–U52）→ `test/views-chrome.test.mjs`（原例逐条搬移、判据不改；U51 / U52 计数随动）⇒ 322 → ~200，**在册例外消解**（沿 `docs/desktop/design/PROJECT.md:116-117` 二次拆分预案）；`test/files.mjs` 七档 → 八档。
**用例计数**：46 → **51**（+U53–U57）。

### 2.5 验收对照（对回批档 §1.3 判据）

| 判据 | 落点 | 机检面 |
|---|---|---|
| ① 五通道端到端 + 九项定序 | §2.2（a）–（c） | U57（动作层往返 + 负例）· U37（九项定序 ∧ 冻结）· 两白名单断点（`:79` / `:165`）；**渲染面真回路**（点行 → 开标签）归人工走查（Electron 内实跑） |
| ② 左列三态不破 | §2.2（e）–（f） | U39（原例——三态判定不变）· U53（接线形） |
| ③ 标签条激活 / 关闭含确认 | §2.2（e）–（f） | U54 · U55 · U56 |
| ④ 词表键齐 | §2.2（g） | U51（14 键两语键集相等 ∧ 哨兵 ∧ 零 CJK） |
| ⑤ 零回归 | §2.3 测试面 | 本端全量 `node test/run.mjs` **51 例绿** · 核 / CLI / 扩展三包零增量（本批不改核、不触另两端）· `doc-check` 过（设计档逐档落档） |
| ⑥ 沿 `RENDERER.md` §1.1 | §2.2（e） | 接线面全在**纯构树**层（描述符 `onClick`）；`mountXxx` 仍为唯一触 DOM 处——U53–U55 皆平 node 直测（零 DOM 依赖） |

### 2.6 关键决策（本批新增）

| # | 决策 | 理由 | 被否 |
|---|---|---|---|
| KD-a | 五通道走**新增动作层档** `session-actions.mjs`；转口仍住 `session-slots.mjs` | 转口（端参绑定）与信封（回执整形）分面：转口档保持「零算法副本」纯度；信封集中一处 ⇒ 可平 node 直测（U57 取 `cwd` 入参而非 `currentCwd()` 闭包） | 信封写进 `ipc.mjs`（通道表膨胀 + 不可脱壳直测） |
| KD-b | 信封 = `{ok, reason?, cwd, slot}`；reason 三档（动作层两档 + 核闭集直传） | 失败原因可机检、与核 `renameSlot` 闭集**同源**（不造第二份词表）；`no-project` / `slot-missing` 是端层**整形**而非新判据 | 抛异常传错（渲染面须 try/catch 分辨语义）· reason 端层重命名 |
| KD-c | 接续触发点 = `project:open` 成功后自动一次 | 「点开即可续」是需求 §3.1 明写的可感行为；resume = 读面 + 兜底建槽，不引入新语义 | 左列再加显式「接续」按钮（重复入口、与点行语义重叠） |
| KD-d | 确认判据住 store（`needsCloseConfirm`），视图只消费 | 与 `deriveTabBadge` 同律（判据单源 = store，视图零规则） | 判据写视图（两份规则） |
| KD-e | 关闭确认 = 树面**原位换两键**（取消 → 确认） | 零框架面内自持；dialog 形态不可控、自动消 = 静默等待 | dialog API · `window.confirm` · 超时自动消 · 图标字形 |
| KD-f | 行 `data-action` 由占位 `session:resume` 收正为 `session:switch` | 行点击语义 = 激活并成标签（switch）；resume 仅项目打开后自动触发——机读面与行为须一致 | 保留 `session:resume` 占位（机读值与行为不符） |
| KD-g | `rename` / `delete` 只落通道、零 UI 入口 | 批档 §1.2 项 4（本批不含会话管理 UI）；通道面六操作往返齐 ⇒ D2 判据仍可达 | 左列行内管理菜单（超本批范围） |

### 2.7 边界（本批不做）

- **零 UI 入口**：`session:rename` / `session:delete`（通道 + 用例在册，UI 随会话管理面批）；标签条 Ctrl/Cmd+1..9 键位（本批不接线——见 §2.8 S2）。
- **零新语义**：不改核、不触另两端；`activeSession` / `pool` / `sessionMeta` 三切片本批零 writer（消费面随后续批）。
- **不落**：对话流 · 活动池 · 审批面 · 设置面 · 首启向导 · 打包链。

### 2.8 上抛项（本批设计面发现 · 全为非阻塞观测）

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| S1 | 确认面**实机不可达**：`tabBadges` 全仓零 writer（`thincoder-desktop/renderer/app.mjs:25` 已列入 `SHELL_KEYS`，但无写入点）⇒ 标签状态码集恒空 ⇒ `needsCloseConfirm` 恒假 ⇒ 确认分支只在**树面机检**可达（喂模型） | 观测 | 随「活动池 / 审批面」批补 `tabBadges` writer（届时确认面自动可达）；本批不造假数据注入 |
| S2 | 标签键位（Ctrl/Cmd+1..9）本批未接线：`data-action` 面已留，键位监听未落 | 观测 | 随键位 / 快捷键批（走查面 T-DSK21） |
| S3 | T-DSK3（`docs/desktop/design/PROJECT.md:195`）场景含「重命名 1 个 → 删除 1 个」——本批该两动作零 UI 入口 ⇒ 人工走查不可达 | 观测 · 已对 T-DSK3 加注 | 走查按注验收（左列项数 ∧ 新建可达），管理 UI 批后恢复全场景 |
| S4 | 题外（前批遗留，只报不改）：`docs/desktop/design/IPC.md:47` 会话族注内坐标漂移（`:81` → `:86`）· 台账 #392 / #393 / #401 / #397 · 批 4 §2.12 观察项（`docs/desktop/design/PROJECT.md:112` 时点值并存） | 题外 | 本批射程外，随各自批次处置 |

### 2.9 三链一致（自检）

条目 ⇄ 设计回指 ⇄ 需求：§2.1 第 1 行 ⇄ `docs/desktop/design/IPC.md` §2 会话族行（本批落笔）⇄ 需求 §4 D2（`docs/desktop/requirements/PROJECT.md:81`）；§2.1 第 3–6 行 ⇄ 需求 §3.1（`docs/desktop/requirements/PROJECT.md:45-52`）⇄ `docs/desktop/design/UI.md` §1 左列行 / 标签条行。需求档五元素齐备（模块目标 §1 · 功能点 §4 · 边界 §5 · 验收 §7 A1–A4 · 依赖 §8 P1–P4）⇒ 设计可依，**零 gap**。

### 2.10 收正与闸态（写档后自检 · 2026-09-26）

**计数口径收正**（§2.3 设计档落点行「产品面 4 行 + 测试面 8 行」）：实落 = `docs/desktop/design/PROJECT.md` §4.1 **产品面 4 行**——① `thincoder-desktop/src/main/session-actions.mjs`（拟新增）行 = 增；② `thincoder-desktop/src/main/session-slots.mjs` 行 = 改（七项绑定转口 + `renameSlot` 纯 re-export）；③ `thincoder-desktop/renderer/app.mjs` 行 = 预算 ~120 → ~150；④ `thincoder-desktop/renderer/views/sessions.mjs` 行 = 预算 ~240 → ~290；加 **测试面 1 行**（用例模块行 = 七 → 八档 + 各档预算重估）——即「测试面 8 行」实为**一行八档**，非 8 行；另 300 层段改写 + §7 T-DSK3 注 + 变更记录。

**判据⑤「doc-check 过」口径收正 + 闸态**（仓 `thincoder/` · `node scripts/doc-check.mjs`）：本批五档落笔后首次读数 = 悬空 **8** · 超宽 **20**——其中**本批新增 4 悬空**（`docs/desktop/design/IPC.md:51` / `:71` · `docs/desktop/design/SHELL.md:90` · `docs/desktop/design/PROJECT.md:118`——未落档文件引用缺「（拟新增）」标记）+ **2 超宽**（`docs/desktop/design/IPC.md:51` 520 字 · `docs/desktop/design/PROJECT.md:264` 494 字）⇒ 全部就地收正：四处补「（拟新增）」标记（形面 · 零语义变动）· 会话族注项 5 单行 520 字拆「主行 + 两子行」· 变更记录批 5 条单行 494 字拆三条。**收正后读数 = 悬空 4 · 超宽 18**，桌面端档（`docs/desktop/design/` 五档）**零悬空、零超宽**；余数全数为前批遗留（core / vsc 档，本批未触——见 §2.11 S5）。故判据⑤口径 = **本批新增 / 改动行零悬空、零新增超宽**（全仓闸态余项非本批射程）。

### 2.11 上抛补充（S5 · 本批设计面自检发现）

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| S5 | 题外（前批遗留，只报不改）：`doc-check` 闸态余 **4 悬空**（`docs/core/design/MODEL-SPECS.md` 3〔`:323` 符号 · `:1372` / `:1465` 路径〕+ `docs/core/design/SESSION.md:850` 路径）+ **18 行超宽**（`docs/core/design/CORE-UNIFICATION.md` 2 · `docs/core/design/MODEL-BENCH.md` 6 · `docs/core/design/MODEL-SPECS.md` 6 · `docs/vsc/design/VSC-DEBT.md` 3 · `docs/vsc/requirements/WEBVIEW.md` 1） | 题外 | 本批射程外（core / vsc 档，本批未触），随各自批次处置 |

### 2.12 修复轮 #60 收正（§3 轮次 1 十一条逐号处置 · 2026-09-26）

**编号说明**：§1.7 所称「§2.13 形态」= 本块——§2 现止于 §2.11 ⇒ 收正块取下一序号 **§2.12**（两称指同一块）。批档 append-only ⇒ 旧行留痕不改；§2 前文与本块冲突处以本块为准（沿 §1.7「修后为准」）。§2.1 行 2 / §2.6 KD-b 的旧 `reason?` 记法亦以本块统一记法为准。

**逐号处置**（号 / 发现要点 / 处置 / 落点；「本块」= 该处置的判据面落档处，实施面 obligation 随 §5 核）：

| # | 发现要点 | 处置 | 落点 |
|---|---|---|---|
| 1 | 条目 6「项目打开即续」无判据 / 用例 / 走查面；`project:open` 为 fail-soft 通道（取消 / 无效路径同返 `{cwd, recent}`）⇒「成功」无判据 | ①「成功」判据 = 回执 `cwd` 变更 ∨ `cwd` = 请求 `path`（无成功旗标——`thincoder-desktop/src/main/projects.mjs:114-120`）；同目录重选（无 `path`）不重复接续 ②条目 6 判据面 = **人工走查 T-DSK2 / T-DSK12**（渲染面真回路，同判据① 口径） | `docs/desktop/design/IPC.md:61-62` · 本块 |
| 2 | U51 是**闭集用量面**断言（`thincoder-desktop/test/views.test.mjs:275`：`used` 须 = 全部宿主键 + 子集标注）⇒ 新增两键须被其 walk 树消费，照文改计数则断言不可满足（红） | U51 随动说明补「walk 增确认面树（`tabbarModel` 带 `pendingClose` 命中态）」 | 本块 |
| 3 | 判据③ 的 app 侧接线（关闭三出口 + `activateSession` + `SHELL_KEYS` 增 `pendingClose`）零用例覆盖、无机检 / 人工边界声明 | 机检面 = U52 扩 **app.mjs 源面结构断言**（`activateSession(` / `requestCloseTab(` / `pendingClose`——沿 `thincoder-desktop/test/views.test.mjs:319` 既有结构断言形）；运行期真回路 = 人工走查（Electron 内实跑） | 本块 |
| 4 | 条目 4「标签点击 = 激活」运行期不可达：非活动标签项落 `inert`（`thincoder-desktop/renderer/views/sessions.mjs:216-217` · `renderer/dom.mjs:12` 布林属性）⇒ 经标签条切换仅剩左列一路；`inert` 阻断指针事件属标准语义、仓内无实测记录（该点半 `unverified`） | 上抛 **S6**（同 S1 族，见下）+ 条目 4 机检面注「树形接线；运行期切换 = 左列一路」 | 本块 |
| 5 | 信封 reason 面三处口径不一：① `reason?`（可选）vs `reason: null\|string`（必在可空）；② cwd 空档分叉（`switch` / `delete` 无 `no-project`）；③ `slot-missing` 一词三因未载 | ①记法统一 `reason: null|string`（四档同记法：会话族行 + 注项 5 + SHELL 信封行 + PROJECT 动作层行；表行内转义 `null\|string`）②注项 5 补两子行：cwd 空档不对称（`switch` / `delete` 恒 `slot-missing`——`thincoder-core/session-slots-manifest.mjs:55-64`）· `slot-missing` 三因（非整数槽 / 清单无项 / 数据文件不可读——`thincoder-core/session-lifecycle.mjs:291-293`） | `docs/desktop/design/IPC.md:31` / `:51-54` · `docs/desktop/design/SHELL.md:24` · `docs/desktop/design/PROJECT.md:90` |
| 6 | 头注 / 计数 / 标签随动面未列入受影响面；U40 引用退役 token | 逐处点名（见下表）＋ U40 收正：`thincoder-desktop/test/views.test.mjs:84` 退役 token `session:resume` → `session:switch` | 本块 |
| 7 | `docs/desktop/design/UI.md:23` 末句「退回启动态 = 左列项目区入口」在现形无落点（`renderer/views/sessions.mjs:60-63` 仅 `boot` 态落项目区） | 删句（口径收窄；菜单口径单源 = SHELL §2 / IPC §1，附注不重复） | `docs/desktop/design/UI.md:23` |
| 8 | 确认面两键无 `data-action` / class 锚；`styles.css` 未列受影响面；U54 / U55 不覆盖确认态两键的两态接线形 | 两键定锚 = `data-action` `tab:close-cancel` / `tab:close-confirm` + class `tabbar-cancel` / `tabbar-confirm`；U55 收两态（handlers 给 ⇒ `onClick` ∧ 无 `disabled`；缺 ⇒ `disabled` + 锚）；受影响面补 `renderer/styles.css` 行（实读 270 → ~272——两键 class 形 · 零新字形） | `docs/desktop/design/UI.md:17` · 本块 |
| 9 | 拆分预案（`views/tabbar.mjs`）随动面只列 SHELL §1 | 随动面补 = U51 零 CJK 扫描清单 · U52 导出面锁（`test/views.test.mjs:306` / `:277`——二次拆分后随 `views-chrome.test.mjs`）· 本档 §4.1 行预算 | `docs/desktop/design/PROJECT.md:120` |
| 10 | `docs/desktop/design/PROJECT.md:117` 例外记录已撤而盘上 `test/views.test.mjs` 仍 322 行（>300 层债记录消失） | 措辞改**条件式**：二次拆分「随本批落地」（落地前档面不宣称已拆） | `docs/desktop/design/PROJECT.md:117-118` |
| 11 | 「七项绑定转口」把**无端参**的同形转口 `newSession` 计入「端参绑定」，与 `renameSlot` 纯 re-export 的判据面混列 | 措辞**分层**：转口八项 = 端参绑定 6〔marker 三项 + `resumeSlot` / `switchToSlot` / `deleteSlot`〕· 同形转口 1〔`newSession`·无端参〕· 纯 re-export 1〔`renameSlot`〕 | `docs/desktop/design/SHELL.md:23` / `:61` · `docs/desktop/design/PROJECT.md:40` / `:89` |

**发现 6 —— 头注 / 计数 / 标签随动面（逐处点名 · 实施面 obligation；措辞 / 计数按单源同值收正）**：

| # | 档 : 行 | 现文（收正前） | 收正 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/preload/preload.cjs:7-8` | 「本批四项」 | 九项（白名单单源 = `preload.cjs:10`） |
| 2 | `thincoder-desktop/src/main/ipc.mjs:2` | 通道清单措辞 | 随九项白名单同源收正（五通道入表） |
| 3 | `thincoder-desktop/renderer/i18n.mjs:5` | 「12 键」 | **14 键**（+2 = 确认面两键词） |
| 4 | `thincoder-desktop/renderer/views/sessions.mjs:14` / `:16-17` | 「未接线面（R-3）…接线随会话族通道批」 | 该段落地后失真 ⇒ 改写（R-3 标注撤） |
| 5 | `thincoder-desktop/test/session-contract.test.mjs:4` / `:149` | 「四项」措辞 | 九项 |
| 6 | `thincoder-desktop/test/projects.test.mjs:159` | 「四项」措辞 | 九项 |
| 7 | `thincoder-desktop/test/views.test.mjs:84` | U40 断言引用退役 token `session:resume`（恒真空） | **`session:switch`**（机读值与行为一致——KD-f） |

**上抛续号（S 族）**：

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| S6 | 非活动标签项落 `inert`（`thincoder-desktop/renderer/views/sessions.mjs:216-217`；`renderer/dom.mjs:12` 以布林属性写）⇒ 指针事件被拦，**标签点击切换在运行期不可达**（活动标签点击 = 无操作）——条目 4 运行期仅剩左列一路；`inert` 语义为标准面、仓内无实测记录（半 `unverified`） | 观测 | 随「活动池 / 审批面」批或标签条交互批处置（若改可点 ⇒ 需 `inert` 面设计 + 走查 T-DSK2）；本批机检面按「树形接线」验收 |

**判据⑤ 机检读数（复跑 · 收正前 → 收正后）**：`cd thincoder && node scripts/doc-check.mjs`——本块写前读数 = 悬空 **6** · 超宽 **22**（其中**本轮新增 2 悬空**：`docs/desktop/design/PROJECT.md:267` / `docs/desktop/design/SHELL.md:91` 引动作层档缺「（拟新增）」标记；**4 行超宽**：`PROJECT.md:117` 304 · `:118` 348 · `:267` 360 · `SHELL.md:91` 339 字符）⇒ 全部就地收正（拆主行 / 子行 · 变更条拆多条 · 补标记）——收正后读数 = 悬空 **4** · 超宽 **18**（全数为前批遗留 core / vsc 档——同 §2.11 S5）；`docs/desktop/design/` 五档**零悬空、零超宽**，本轮新增 / 改动行零新增违规。批档面不在机检射程（`PROJECT-MANIFEST.json:30-33` `anchors.exclude` 含 `batches`）。

**三链一致（收正后复核）**：§2.1 条目表 ⇄ 设计回指 ⇄ 需求档——本轮改点全为**判据 / 措辞 / 标记 / 计数随动**面，条目 ⇄ 落点映射零变动；§2.9 结论（需求五元素齐备、零 gap）不改。

### 2.13 实施后修正轮 #62 收正（逐号 1–4 · 2026-09-26）

**依据** = 批档 §1.8（329 例外裁定）/ §1.9（落地核验 + 修正轮派单）；射程 = 设计三档（`docs/desktop/design/PROJECT.md` · `IPC.md` · `SHELL.md`）设计面 + 三档变更记录；**零新语义**（只做实读回填 / 例外换防 / 陈旧标记收正 / 变更记录补行；零条目、零判据变动）。

**逐号处置**：

| # | 派单项 | 处置 | 落点（收正后） |
|---|---|---|---|
| 1 | 全表实读回填 | §4.1 产品面 9 行 + 测试面 2 行（`run.mjs` · `files.mjs` 行 + 用例模块行）实读收正（交付档列值 = 实读裸值；未交付档保 `~`）；新档两行入表 | `PROJECT.md:87-104` 内 9 行 · `:110` · `:111` |
| 2 | 300 层段换防 | 段改写：两轮拆分转既成（`views.test.mjs` 实读 200）+ 新例外登记（`views-tabbar.test.mjs` 329 · 拆分候选 = 确认面 U55 面拆出 · 消解窗口 = 该档下次被触碰的批）；旧例外 322 盘上已无文本可删（批 5 设计轮撤）⇒ 消解记入变更记录 | `PROJECT.md:117-118` · 变更记录 `:272` |
| 3 | 陈旧标记 | 规范面删标：`IPC.md:55` · `SHELL.md:24` · `PROJECT.md:90`（同因 = 档已交付）；记录面判 = **留档不改**（`IPC.md:75-76` · `PROJECT.md:265-270` · `SHELL.md:85-92`——dated 历史） | 三档 · 变更记录各补 #62 行 |
| 4 | 变更记录补行 | 三档各补 #62 条（依据 = 批档 §1.8 / §1.9）；PROJECT 另记 300 层段 / 记录面判 | `PROJECT.md:271-273` · `IPC.md:78` · `SHELL.md:93` |

**同基准扩展处置（非派单原列 · 报告在案）**：`SHELL.md:24`（与 `IPC.md:55` 同族同基准——动作层档已交付）· `PROJECT.md:115`「预估均 ≲300 / `styles.css` ~280 居顶」随表收正（唯一越层 = 329 · styles 284）· `PROJECT.md:119` 拆分预案行「预估 ~290」→「实读 292」。

**口径与复核**：

- 列值口径：交付档 = 实读裸值（去 `~`、去「（实读 X 行）」冗余注；先例 = `host-floor.mjs` 42）；未交付档保 `~`；表外已交付行（`main.mjs` / `window.mjs` / `protocol.mjs` / `sessions.mjs` / `projects.mjs` / `chrome.mjs` / `dom.mjs` / `index.html` / `package.json` / `check-dist.mjs` / `run.mjs`）非父侧表内 ⇒ 保 `~`（随各自触碰批回填）。
- 实读自核：17 档逐档重测 = 父侧实读全部同值（67 / 90 / 83 / 29 / 188 / 209 / 292 / 102 / 284 · 200 / 213 / 329 / 227 / 280 / 99 / 200 / 6）；表外另得 `run.mjs` 41 · `guard-closure.test.mjs` 101（未回填——报告在案）。
- 名集同值（acceptance ②复核）：`test/files.mjs` 八档 = §4.1 用例模块行 = `SHELL.md:37` 三面**集合同值**；序差（`files.mjs` 序 `…views-tabbar, views-chrome`；两档序 `…views-chrome, views-tabbar`）在册不改（集合面同值 · 派单口径 = 名集）。
- 记录面判（沿既有裁定：历史归记录面 · 不追改）：变更记录 / 时点注（`PROJECT.md:113`「批 3 收口」· `:262` 计数快照等）留档不改。

**闸态（复跑）**：`cd thincoder && node scripts/doc-check.mjs` ⇒ 悬空 **4** · 超宽 **18**（与前批基线逐项同值；`docs/desktop` 面零新增）；本轮新写 / 改动行逐行 <300 字符（最宽 = `PROJECT.md:271` 294 字符）。

**三链一致**：本轮改点全为实读值 / 标记 / 例外面 ⇒ §2.1–§2.12 结论不改。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审判定（批 5 §2 · 九节 + §2.10 / §2.11）

**核对面**：设计锚五档（`IPC.md` §2 会话族行 / 会话族注项 5 · `UI.md:15/:17/:24` · `SHELL.md` 树行与 §3 · `RENDERER.md` §1.1 · `PROJECT.md` §4.1 与 300 层段）逐行对上：五通道 —— 信封与 reason 分档（`IPC.md:51-53`）、接线语义（`UI.md:15/:17/:24`）、白名单九项与三处断言点（`host-floor.test.mjs:79` / `projects.test.mjs:165` / `session-contract.test.mjs:144-152` + `test/files.mjs`）与设计文一致；代码坐标逐条实读复核无误（`session-lifecycle.mjs:183/:245/:289/:306` · `session-slots.mjs:225` · `session-rename.mjs:15-16` · `session.mjs:41/:45/:52` · `store.mjs:23-37/:100` · `app.mjs:25/:43/:49/:69` · `views/sessions.mjs:95-97/:105-112/:147-152/:170/:243` · `i18n.mjs:5/:17-46`）。受影响面 16 行实读值抽核一致（`ipc.mjs` 71 · `session-slots.mjs` 64 · `preload.cjs` 24 · `store.mjs` 159 · `app.mjs` 107 · `views/sessions.mjs` 250 · `i18n.mjs` 97 · `views.test.mjs` 322 · `views-tabbar.test.mjs` 228 · `host-floor.test.mjs` 92 · `projects.test.mjs` 193 · `files.mjs` 6），无档越 500 硬限；唯一 >300 档（`views.test.mjs` 322）本批带**实拆**（U49–U52 → `views-chrome.test.mjs`）⇒ 层判据满足。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / AC | 🟡 | 条目 6「项目打开即续」在 §2.4 / §2.5 无判据行、无用例、未声明人工走查面（对照：判据① 明写「渲染面真回路…归人工走查」）；且 `project:open` 为 fail-soft 通道——取消 / 无效路径同样返回 `{cwd, recent}`（`thincoder-desktop/src/main/projects.mjs:114-120`），**无成功旗标** ⇒ §2.2(f) / `IPC.md:59`「成功 ⇒ 自动一次 `session:resume`」的「成功」无判据 | 给条目 6 补判据 / 用例落点（或写明走查面 = T-DSK2 / T-DSK12），并定义「成功」判据（`cwd` 变更，或与请求 `path` 一致） |
| 2 | AC / verifiability | 🟡 | U51 是**闭集用量面**断言（`thincoder-desktop/test/views.test.mjs:275`：`used` 必须等于全部宿主键 + `sub.running`/`sub.done`）⇒ 新增两键必须被 U51 自身 walk 的树消费；设计只写「12 → 14 键」（§2.2(g) · §2.4 · §2.5 判据④），未点明须在其树列加 `pendingClose` 命中态 ⇒ 照文改计数则断言不可满足（红） | U51 随动说明补一句「walk 增确认面树（`tabbarModel` 带 `pendingClose`）」 |
| 3 | AC / verifiability | 🟡 | 判据③ 的 app 侧接线（关闭三出口 → `requestCloseTab` / `confirmCloseTab` / `cancelCloseTab` · `activateSession` · `SHELL_KEYS` 增 `pendingClose`）无任何用例覆盖，§2.5 也未声明其机检 / 人工边界（判据① 有该声明） | 明写边界；按 `thincoder-desktop/test/views.test.mjs:319` 既有结构断言形，扩一条 app.mjs 源面断言（`activateSession(` / `requestCloseTab(` / `pendingClose`） |
| 4 | Clarity / 上抛面 | 🟡 | 条目 4「标签点击 = 激活」运行期不可达：非活动标签项落 `inert`（`thincoder-desktop/renderer/views/sessions.mjs:216-217` · `docs/desktop/design/UI.md:15`；`renderer/dom.mjs:12` 以布林属性写 `inert`），而活动标签的「激活」等价无操作 ⇒ 经标签条切换会话不成立（仅剩左列一路）；`inert` 阻断指针事件属标准语义（仓内未见实测记录 —— 此点半 `unverified`）。上抛清单（S1–S5）未载此同族项 | 并入上抛（与 S1 同族）或在条目 4 / §2.5 注明「机检面 = 树形接线；运行期切换 = 左列」 |
| 5 | Clarity / 契约口径 | 🟡 | 回执信封 reason 面三处口径不一：① §2.1 行 2 与 `docs/desktop/design/IPC.md:51` 写 `reason?`（可选），§2.2(b) 与 U57 写 `reason: null\|string`（必在、可空）；② cwd 空时词表分叉 —— create / rename / resume 有 `no-project` 档，switch / delete 无（核 `loadManifest` 吞异常返空清单 ⇒ 恒 `slot-missing`），`IPC.md:52` 未载此不对称；③ `slot-missing` 一词覆盖「非整数槽 / 清单无项 / 数据文件不可读」（`thincoder-core/session-lifecycle.mjs:291-293`）三因 | 统一记法（择 `reason: null\|string`）；cwd 空档对齐或明写不对称；`slot-missing` 语义面在 `IPC.md:52` 注明 |
| 6 | Doc hygiene | 🟡 | 本批所改档内的计数 / 状态副本未列入受影响面（设计只对 `session-slots.mjs` 头注做计数随动）：`src/preload/preload.cjs:7-8`「本批四项」· `src/main/ipc.mjs:2` 通道清单 · `renderer/i18n.mjs:5`「12 键」· `renderer/views/sessions.mjs:14/:16-17`「未接线面（R-3）…接线随会话族通道批」段（落地后失真）· `test/session-contract.test.mjs:4/:149` 与 `test/projects.test.mjs:159`「四项」措辞 · `test/views.test.mjs:84`（U40 断言引用退役 token `session:resume` ⇒ 恒真空） | 受影响文件「改动」列补一行「头注 / 计数 / 标签随动」并逐处点名；U40 该行改 `session:switch` 或删 |
| 7 | Doc state | 🟡 | `docs/desktop/design/UI.md:23` 末句「退回启动态 = 左列项目区入口」在现形无落点：`renderer/views/sessions.mjs:60-63`（`sections()`）在 `empty` / `list` 态只落会话区 ⇒ 项目区入口仅 `boot` 态存在；本批条目 2「启动态入口 = 已接线复核」未触及该句（R7a 报告项） | 口径收窄（删该句）或登记为待落项（视图族落点 = `docs/desktop/design/PROJECT.md` §4.1） |
| 8 | Clarity | 🔵 | 确认面两按钮无 `data-action` / class 锚（其余控制项皆有锚，U48 还断言动作序），`renderer/styles.css` 未列入受影响文件面；U54 / U55 不覆盖确认态下两键的两态接线形（handlers 给 ⇒ `onClick` 无 `disabled`；缺 ⇒ `disabled` + 锚） | 给两键定 `data-action` / class 并纳入 U55；若需样式则在 §2.3 补 `styles.css` 行 |
| 9 | Planning | 🔵 | `views/sessions.mjs` >300 的拆分预案（`views/tabbar.mjs`）随动面只列 `SHELL.md` §1：`test/views.test.mjs:306`（U52 导出面锁按 `views/sessions.mjs` 导出表）· `:277`（U51 零 CJK 扫描的硬编码档名）· `PROJECT.md` §4.1 行预算需同步 | 预案随动面补 U51 扫描清单 / U52 导出锁 / §4.1 |
| 10 | Doc state | 🔵 | `docs/desktop/design/PROJECT.md:117` 在本批实施前已记「两轮拆分均已落档」并撤在册例外，而盘上 `test/views.test.mjs` 仍 322 行（>300 层）——若本批中途停，层债记录已消 | 例外行保留至 §5 落地，或措辞改条件式（「随本批落地」） |
| 11 | Consistency | 🔵 | `docs/desktop/design/SHELL.md:23` / `:61` 的「**七项绑定转口**（marker 三项 + 会话族四项：… `newSession` …）」把**无端参**的同形转口 `newSession` 计入「端参绑定」，与 `renameSlot` 纯 re-export 的判据面混列 | 措辞分层（端参绑定 3 · 同形转口 1 · 纯 re-export 1） |

**计数**：🔴 0 · 🟡 7 · 🔵 4 = 11 行。
**局限**（无判据权重，仅登记）：① 无 Document Map ⇒ 文档所有权判据降级（按档头自述「单一权威源」与 Project Guide 判：落点面正确，未新建档、未复制正文、指针形合规）；② 无 Project Standards 档 ⇒ 方法学合规只按 Project Guide（AGENTS.md）判；③ 需求档 `docs/desktop/requirements/PROJECT.md` 不在评审 scope ⇒ §2.1 / §2.5 / §2.9 的需求侧回指（`:81` D2 · `:45` §3.1）**未核（unverified）**；④ §2.10 的 `doc-check` 读数（悬空 4 / 超宽 18）未复跑（工具面无脚本执行）。
**域外注（无 severity）**：端壳 `resumeSlot` 绑核裸版（`thincoder-core/session-slots.mjs:300`）而非 CLI / ACP 走的包装版（`thincoder-core/session-lifecycle.mjs:43`，含 `scheduleSessionGC`；实读落点 = `thincoder-desktop/src/main/session-slots.mjs:25-26` / `:64`）——批 3 既定选择，本批 `resumeSession` 沿之，跨端 GC 面差异登记、非本批射程。

VERDICT: pass（🔴 0 ⇒ 不阻塞；上表 🟡 / 🔵 为改进项，随父侧派单处置）

## §4 用户批准（主 agent）

### 4.1 §4 批准 —— 父侧代签（用户 2026-09-25 22:17「你直接自己跑完吧」授权）

- **三条件齐备**：① 设计评审 **#59 = pass**（🔴 0 · 7🟡 + 4🔵 **全收**）；② **修复轮 #60 已落地**（§2.12 · **11/11**）+ 父侧同轮抽核（`IPC.md:52-54` reason 三子行 / `:77` 变更记录 · `UI.md:17` 确认面两键锚 / `:69` 删句 · `SHELL.md:23` / `:61` / `:91` 转口分层 · `PROJECT.md:40` / `:89` / `:118` / `:269-270` · 门 = **悬空 4 / 行宽 18** 基线同值）；③ **token 已签发**（按凭据纪律**不入档**）。
- **依据**：评审 = #59（pass）· 核验结论 = 上列读数 · 发现处置表 = §1.7（十一条全收）+ §2.12（逐号对账 + **S6** 上抛）。
- **批准射程** = §2 九节 + §2.12「修后为准」全部条目（**9 条目** · **U53–U57** · 受影响面 16 行 + 新档 2 + `styles.css`）+ **台账 #405 消解**（`views.test.mjs` 二次拆分随本批落地）。**不含**：对话流 / 工具卡 / 审批 · 活动池 · 设置 / 首启 · agent 装配 · 打包 · **S6 运行期面**（人工走查）· 台账族在册项。
- **派发** = eng-coder（round = initial）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（面 17 档（源码 9 + 测试 8）· 差异审计 CLEAN · 代码评审 pass（🔴 0 / must-fix 0）· fix round 0 · 末端实跑 51/51 + 冒烟 ok:true — 详见本段 5.1–5.5）



### 5.1 交付摘要（2026-09-26 · 实施舱 eng-coder）

**面 = 17 档**（§2.3 受影响面 **16 行**，其中新档 2；+ §2.12 第 8 条补的 `renderer/styles.css` 1 档 = **17**；**零越清单**）：

- **源码 9 档**：`src/main/session-actions.mjs`（新 · 五通道动作层 + 回执信封 · 零算法副本）· `src/main/session-slots.mjs`（三项端参转口 + `renameSlot` 纯 re-export + 头注计数随动）· `src/main/ipc.mjs`（`HANDLERS` 4 → 9 + 五项处理体）· `src/preload/preload.cjs`（白名单单源 4 → 9）· `renderer/store.mjs`（`pendingClose` 切片 + `needsCloseConfirm` + 三纯动作）· `renderer/app.mjs`（两组 handlers + `activateSession` + 创建 / 接续触发点 + `SHELL_KEYS` 增键）· `renderer/views/sessions.mjs`（左列两类接线 + 标签条全接线 + 确认面树形 + `iconControl` 接线参）· `renderer/i18n.mjs`（宿主键 12 → 14）· `renderer/styles.css`（确认面两键 class 形 · 零新字形）。
- **测试面 8 档**：`test/views-chrome.test.mjs`（新 · U49–U52 迁入）· `test/views.test.mjs`（U49–U52 迁出 + U53）· `test/views-tabbar.test.mjs`（U48 原址更新 + U54 / U55）· `test/store.test.mjs`（U56）· `test/session-contract.test.mjs`（U37 更新 + U57）· `test/host-floor.test.mjs` / `test/projects.test.mjs`（白名单断点九项随动）· `test/files.mjs`（清单登记模块 **7 → 8 档**）。

**设计四锚逐条落地**：

1. **信封**：`{ ok, reason: null|string, cwd, slot }` 四键齐备；分档 = `no-project`（`create` / `rename` / `resume` 的 cwd 空）· `slot-missing`（动作层整形：核返回 `null` / `false`）· 核 `renameSlot` 四闭集（`invalid-slot` / `file-missing` / `parse-failure` / `mtime-conflict`）**直传**（端层零第二词表）；`switch` / `delete` **无** `no-project` 档（cwd 空 ⇒ 恒落 `slot-missing`）；fail-loud 不吞（意外抛直传 invoke 拒绝）。
2. **白名单九项定序**（`config:read, project:open, project:recent, sessions:list, session:create, session:switch, session:rename, session:delete, session:resume`）：preload 单源 + **三处断言**（`test/host-floor.test.mjs:79` · `test/projects.test.mjs:165` · `test/session-contract.test.mjs`）全绿。
3. **接线形通则**：给 handlers ⇒ 控件落 `onClick` ∧ 无 `disabled`；缺 ⇒ `disabled: true`；两态比较经 `shapeTree` 归一（U48 / U53 / U54 三用例）。
4. **关闭确认面**：树面原位换两键（标签项 `data-confirm="1"` ∧ 子序 [标签, 取消, 确认] ∧ 关闭控件原位退出）；两键定锚 = `data-action` `tab:close-cancel` / `tab:close-confirm` + class `tabbar-cancel` / `tabbar-confirm`（词键 `tab.action.close.cancel` / `tab.action.close.confirm`）；判据单源 = store `pendingClose`。

### 5.2 行数与层判据

口径 = **内容行数 · 文末换行不计**（§2.3 声明口径；与读工具行数同值——本批 17 档均以换行收尾，两读数相等）；「本批实读」= 本舱 `node` 逐档实时量（2026-09-26）。

| 档 | 设计实读 → 预估 | 本批实读 | 差 |
|---|---|---|---|
| `src/main/session-actions.mjs`（新） | 0 → ~85 | **67** | −18 |
| `src/main/ipc.mjs` | 71 → ~78 | **90** | +12 |
| `src/main/session-slots.mjs` | 64 → ~76 | **83** | +7 |
| `src/preload/preload.cjs` | 24 → ~29 | **29** | 0 |
| `renderer/store.mjs` | 159 → ~190 | **188** | −2 |
| `renderer/app.mjs` | 107 → ~140 | **209** | **+69** |
| `renderer/views/sessions.mjs` | 250 → ~285 | **292** | +7 |
| `renderer/i18n.mjs` | 97 → ~101 | **102** | +1 |
| `renderer/styles.css` | 270 → ~272 | **284** | +12 |
| `test/views.test.mjs` | 322 → ~200（拆后） | **200** | 0 |
| `test/views-chrome.test.mjs`（新） | 0 → ~155 | **213** | +58 |
| `test/views-tabbar.test.mjs` | 228 → ~265 | **329** | +64 |
| `test/store.test.mjs` | 184 → ~215 | **227** | +12 |
| `test/session-contract.test.mjs` | 199 → ~240 | **280** | +40 |
| `test/host-floor.test.mjs` | 92 → 92 | **99** | +7 |
| `test/projects.test.mjs` | 193 → 193 | **200** | +7 |
| `test/files.mjs` | 6 → 6 | **6** | 0 |

**层判据**：唯一越 300 = `test/views-tabbar.test.mjs` **329**（⇒ 在册例外，见 5.3 行 2）；`renderer/views/sessions.mjs` 292 · `renderer/app.mjs` 209 均 < 300 ⇒ **拆分预案（`views/tabbar.mjs`）未触发、零新档**。**全批无档越 500 硬限**。
**超预估档**（依 §1.8「以实读为准」收）：`app.mjs` +69（对 ~140；§4.1 预算 ~120 → ~150 同向超）· `views-tabbar` +64 · `views-chrome` +58 · `session-contract` +40 · `ipc` / `store.test` / `styles.css` 各 +12 —— 逐档预算 / 清单回填（`test/files.mjs` · `PROJECT.md` §4.1 · `SHELL.md:37`）= **实施后修正轮（设计面）**。

### 5.3 决策透明表

| # | 事项 | 处置 | 依据 |
|---|---|---|---|
| 1 | `test/views.test.mjs` 322 > 300（台账 #405 条件触发） | **实拆**：U49–U52 → `test/views-chrome.test.mjs`（新档）+ 清单 7 → 8 随动 | §2 开局条件 + §4 批准射程（拆后实测 200 / 213） |
| 2 | `test/views-tabbar.test.mjs` 329 > 300 | **不拆档** + 如实回填实读；在册例外受理（先例 = 批 4 `views.test.mjs` 322）· 消解窗口 = 该档下次被触碰的批 | §1.8 判决（父侧 01:06） |
| 3 | 设计档两处旧标（`IPC.md:55` 动作层「（拟新增）」· `:76` 变更记录 `reason?` 旧记法） | **零改动** —— 归实施后修正轮（设计面） | §1.8 归口 + 「实施舱不动设计档」回令；本舱 grep 复核确在 |
| 4 | 超预算档（见 5.2） | 依「以实读为准」收；预算 / 清单随动归实施后修正轮 | §1.8 判决 |
| 5 | 域外注 = `resumeSlot` 绑核裸版（跨端 GC 面差异） | 如实登记 · **不处理**（`resumeSession` 沿批 3 既定选择） | §3 域外注（非本批射程） |
| 6 | 顾问 🔵 `KD-f` 同档两义（`views/sessions.mjs:22` / `:279` 字形义 vs `:111` 两路一致义） | **未采纳** —— 改注释会使被评审注释面过期 ⇒ 留待该档下次触碰的批 | 评审选项（非 must-fix） |
| 7 | 环境 `ELECTRON_RUN_AS_NODE=1` | 冒烟须显式清该变量 + 以 `node_modules/electron/dist/electron.exe` 启动 | 本机读数（见 5.5） |

### 5.4 审计与评审轮次与终态

- **内部差异审计**（`explore` · read-only · **1 轮**）：**CLEAN** —— 四类偏差（验收项漏做 / 静默简化 / 设计档漂移 / 越清单改动）**零命中**；17 档触碰并集 ⊆ §2.3 面。
- **内部代码评审**（`advisor` `type=code` · **1 轮** · 面 = 17 档 + 4 档设计 / 批档）：**VERDICT = pass**；发现 **6 条**（🟡 3 · 🔵 3 · **🔴 0 · must-fix 0**）⇒ **fix round = 0**（评审面 = 交付面——评审后未再改任何档）。
- **🟡 三条**：① `test/views-tabbar.test.mjs` 329 > 300（例外在册 · 见 5.3 行 2）；② 标签「激活」运行期不可达 —— `renderer/views/sessions.mjs:242` `else props.inert = true` ⇒ 非活动标签子树不入指针事件 ⇒ 条目 4 运行期仅剩左列一路（**S6 在案** · §1.7 第 4 条已裁定 ⇒ 运行期面归人工走查）；③ `docs/desktop/design/IPC.md:55` 动作层仍标「（拟新增）」（文件已交付）+ `:76` 变更记录留 `reason?` 旧记法 ⇒ 归**实施后修正轮（设计面）**。
- **🔵 三条**：§5 / §6 空段（本节即补）；预算 vs 实读漂移（见 5.2）；`KD-f` 同档两义（见 5.3 行 6）。
- **口径说明**：顾问两条 `IPC.md` 引用在 host 侧标 "file unreadable" = 顾问侧路径解析问题（同档本舱可读），**非代码问题**。

### 5.5 末端实跑读数（冻结面 · 评审后未再改档）

- `node test/run.mjs`（cwd = `thincoder-desktop`）⇒ **tests 51 · pass 51 · fail 0 · exit 0**（2026-09-26 复跑）。
- `set "ELECTRON_RUN_AS_NODE=" && node_modules\electron\dist\electron.exe . --smoke` ⇒ **`ok:true`**：`served 10` · `blocked 3` · `probes 200 / 200 / 404 / 404 / 404` · `boot ok` · `errors []` · `node 24.21.0` · `sqlite true` · `floorMet true` · `exit 0`（stderr 的 `disk_cache` 警告与 `[protocol] extension refused` ×3 = **预期噪声**）。
- `node scripts/doc-check.mjs`（仓根）⇒ **悬空 4 · 行宽 18**（与 §3 局限④父侧基线同值；命中全落 `docs/core` + `docs/vsc` 面，本批 `docs/desktop` 面**零闸态命中**——该面各项均为「拟新增 / 报告面——列报 · 不入闸」）。
- **环境注**：本机 `ELECTRON_RUN_AS_NODE=1` ⇒ 冒烟须先清该变量并以 `node_modules/electron/dist/electron.exe` 启动（否则 `electron` 走 node 语义）；测试面平 node 直测，不受影响。

### 5.6 补记（§5 落定后复核追加 · 2026-09-26）

5.3 行 3 / 5.4 🟡③ 所列「旧标」面，后随 grep 全档复核（`docs/desktop/design/` 扫「七项绑定」）**另得两处同族旧标**（同归实施后修正轮 · 设计面 · 本舱零改动只报）：

- `docs/desktop/design/PROJECT.md:266`（变更记录行）：`thincoder-desktop/src/main/session-actions.mjs`「（拟新增）」标记已过期（档已交付）+ 仍作「`thincoder-desktop/src/main/session-slots.mjs` 行改**七项绑定转口**」。
- `docs/desktop/design/SHELL.md:90`（变更记录行）：同形两处（「（拟新增）」+「七项绑定转口」）。
- 口径注：§2.12 第 11 条已把「七项绑定转口」措辞分层为「端参绑定 6 · 同形转口 1 · 纯 re-export 1」并落 `SHELL.md:23` / `:61` · `PROJECT.md:40` / `:89`；上述**变更记录行**未随之（变更记录属记录面，是否回改由修正轮定）。
- 闸态附注：`doc-check` 对「（拟新增）」只在档**不存在**时报悬空 ⇒ 上述标记**非闸态命中**（§2.10 读数 悬空 4 / 超宽 18 不变），归**语义陈旧**而非机检违规。

## §6 验证与收口（父代理）

### 6.1 落地核验（父侧亲跑 · 2026-09-26 01:17）

- **9 条目 = 全 ✅**（§5 交付表）。**父侧亲跑**：`npm test` ⇒ **tests 51 · pass 51 · fail 0**（U53–U57 全绿 · U27 = 白名单**九项**）；冒烟 ⇒ `ok:true ∧ boot:"ok" ∧ served:10`；`test/files.mjs` = **八档** ✓；行数实读复核（内容行数）= `views.test.mjs` **200** · `views-chrome.test.mjs` 213 · `views-tabbar.test.mjs` 329 · `session-actions.mjs` 67 · `app.mjs` 209；`session-actions.mjs` 逐行实读 = 设计形态（信封 / `no-project` 三斜 / `slot-missing` 统一档 / rename 四值直传 / 抛不吞 / 零核导入）✓。

### 6.2 裁定与例外（承 §1.8）

`test/views-tabbar.test.mjs` **329** ⇒ **在册例外**（消解窗口 = 该档下次被触碰的批 · 台账 **#407**）；其余超预算档 = **收（以实读为准）**；**S6**（标签 `inert` ⇒ 运行期切换仅左列）= 人工走查在案；S1 / S2 在案；域外 `resumeSlot` 裸版 ⇒ 台账 **#406**。

### 6.3 修正轮核验（父侧 · 2026-09-26 01:31）

- **#62 落地**：`PROJECT.md:87-104` 九行实读回填 + `:110`/`:111`（用例模块八档 `99/101/280/200/227/200/213/329`）+ `:117-118` **300 层段换防**（两轮拆分转既成 + 新例外 329 带窗口）+ 陈旧标记删（`IPC.md:55` · `SHELL.md:24` · `PROJECT.md:90`）+ 变更记录（`PROJECT.md:271-273` · `IPC.md:78` · `SHELL.md:93`）+ 批档 §2.13（`:304-327`）；同基准扩展三项（`SHELL.md:24` · `PROJECT.md:115` / `:119`）✓；门 = **悬空 4 / 行宽 18**（基线同值 · `docs/desktop` 面零新增）✓。

### 6.4 收口清单（D7）

| 项 | 状态 |
|---|---|
| 角色表 | ✅ §1 / §4 / §6 父侧 · §2 + §2.12 + §2.13 designer · §3 评审（轮次 1）· §5 coder |
| 状态行 | §1 → 已收口（本块后冻结） |
| 计数 | 交付 **18 档**（17 产品 / 测试 + 本批档）· 用例 **U53–U57**（总 51/51）· 条目 9 |
| 指针 | 台账 **#405 已核销**（条件触发消解 · 四步走）· 新立 **#406 / #407**（条件型） |
| 变更记录 | 无（程序首发行前不设 CHANGELOG） |
| 待办勾销 | **#405** ✓；S6 / S1 / S2 = 上抛在案 |
| 台账可见面 | 已查 ✓ |

### 6.5 结论

批 5（会话族通道 + 左列 / 标签条接线）**收口**：五通道 + 白名单九项 + 全交互接线 + 关闭确认面；51/51 + 冒烟全绿；**#405 消解核销**；**收口序纪律（#404）再次守住**（修正轮先落地核验 ⇒ 才 close）。
