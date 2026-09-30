# 2026-09-29 · structure-split-round（越线档结构轮拆分：chrome.css ∥ mount-sessions 族）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 挂账族集中处置（用户 2026-09-29 16:56 令）——越线档结构轮载体：台账 #536（chrome.css ∥ mount-sessions 族）。。
> 台账 = #536（桌面/渲染结构 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批（父侧 · 2026-09-29 16:5x）

- **来源** = 挂账集中处置令（16:56）；授权 = 13:52 全权。
- **条目（1 行）**：**#536**（越线档结构轮拆分——`chrome.css` 425 ∥ `mount-sessions.mjs` 400 族；**届盘重读**全量越线档（含各批「拆分预案在册」未执行者）逐个裁：拆 ∕ 续期（+由）。
- **口径**：设计 = eng-designer（拆分方案 + 避让在飞批）；实施 = eng-coder（评审 + 代签 §4 + token 后）；结构动作沿「纯件出档 ∕ 引用改指」先例。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（届盘全量越线档逐个裁定 + 主件两拆方案就绪；评审对象 = 本段 + docs/desktop/design/PROJECT.md 随动）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 口径与范围（承 §1）

- 条目 = **#536**（越线档结构轮）；授权 = §1.1 口径（设计 = eng-designer〔本段〕∕ 实施 = eng-coder〔评审 + 代签 §4 + token 后〕）；结构动作 = 纯件出档 ∕ 引用改指，缝 = 同名再出口先例。
- 届盘全扫面 = `thincoder-desktop/**`（renderer ∕ src ∕ test）全量 + 他端如查得（§2.3）；口径 = **内容行数**（文末换行不计——与 §4.1 同口径）；实读时点 = 2026-09-29 届盘。
- 本批执行面 = **主件两台拆**（`renderer/chrome.css` ∥ `renderer/mount-sessions.mjs`——§2.2 方案 A ∕ B）；余档 = 逐档裁定（续期 + 由 ∕ 窗口，§2.1）；不扩面。
- 禁：产品码零写（本段 = 设计轮）；零语义（纯结构搬——移动块逐字）。
- 设计档落点 = 本段 + `docs/desktop/design/PROJECT.md`（§4.1 两行 + 越层段重写 + §4.2 本批预登块 + 变更记录行——**本设计轮已落**；实读回填 = 实施轮）。

### 2.1 届盘全扫 · 越线档清单 + 逐档裁定（实读 2026-09-29 · 内容行数）

**>500 硬限（仓级）**：桌面面 **零档**（在册例外 Ⅰ `renderer/i18n.mjs` **500** = 顶格未越）。

**>300 顾问线（含例外 Ⅰ）——十一档**：

| # | 档（`thincoder-desktop/` 前缀略） | 届盘读 | 裁定 |
|---|---|---|---|
| 1 | `renderer/i18n.mjs` | **500**（例外 Ⅰ） | **拆——他批承接**（在飞批 `2026-09-29-i18n-split`；本批零触——避让） |
| 2 | `renderer/chrome.css` | **450**（登记旧值 425 陈旧——届盘收正） | **拆——本批**（§2.2-A；⇒ ≈288 + `session-list.css` ≈170） |
| 3 | `renderer/mount-sessions.mjs` | **406**（登记旧值 400 陈旧——届盘收正） | **拆——本批**（§2.2-B；⇒ ≈245 + `session-wire.mjs` ≈185） |
| 4 | `renderer/mount-settings-segments.mjs` | **356** | 续期——由 = 设置面族在飞两批避让；预案 = MCP 族再出一档；窗口 = 下次结构性触碰 |
| 5 | `renderer/views/settings.mjs` | **334** | 续期——由 = 同上 + 该面整树重建形态将变（窗口顺延至其落定）；预案 = 段体续拆 |
| 6 | `renderer/i18n-views.mjs` | **328** | 续期——由 = 在飞批 #618 触其值面；预案 = 词族按视图面续拆 |
| 7 | `src/main/suspension-drive.mjs` | **326** | 续期——预案 = 窗内时效 ∕ 时序守卫面出档（≈30 行）在册；本批零触 |
| 8 | `src/main/settings.mjs` | **324** | 续期——由 = 设置面族在飞避让；预案 = 按族续拆评估 |
| 9 | `src/main/ipc.mjs` | **322** | 续期——预案 = 在册「按面拆分」句；本批零触 |
| 10 | `src/main/agent-bridge.mjs` | **318**（登记旧值 333 陈旧——届盘收正） | 续期——预案 = 协议行解析 ∕ 事件映射族出档（新档名实施批定） |
| 11 | `renderer/chat.css` | **312** | 续期——预案 = `chrome-denoise.css`（拟新增 · 排末） |

（续期各档统一：窗口 = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）；登记面 = PROJECT.md §4.1 越层段〔本设计轮已按盘重写〕。）

**离册（越层消解）**：`renderer/views/chat.mjs` 届盘 **284** ≤300——登记旧值 362 = 模型族出档（更新纪律收核批）前读数 ⇒ 越层除名。
**贴 300 层（≤300 ∧ ≥297）**：`renderer/store.mjs` 300 · `src/main/providers.mjs` 300 · `renderer/app.mjs` 299 · `renderer/core.css` 299 · `renderer/views/chat-tool.mjs` 299 · `renderer/views/settings-sections.mjs` 297（预案 = 各自下次结构性触碰的批）。
**读数收正**：`src/main/agent-bridge.mjs` 333 ⇒ **318**（陈旧值；登记面已改，变更记录在册）。

### 2.2 主件拆分方案

**方案 A —— `renderer/chrome.css` 拆**（3.4 案落形）：
- **切点**（as-of 2026-09-29；内容锚为准，行号随届盘）：迁出 = 原 **`:136-262`**（`/* 下拉面…*/` 起 … `.session-delete:focus-visible` 止——下拉容器 + 条目全族 + 空态 + 账本注记 + 行内 ✎ ∕ ✕）+ **`:287-323`**（`/* 改名形…*/` 起 … `.session-confirm:focus-visible` 止——条目内改名形）＝ **164 行**；留档 = 栅格骨架 ∕ 会话控制条（项目钮 ∕ 选择器 ∕ 标题 ∕ 箭头 ∕ **`.session-new`**）∕ **`.auto-confirm` 族**（共享面——`renderer/settings-confirm.mjs:5-6` 复用，不迁）∕ 会话头字段 ∕ 状态行 ∕ 引导层。
- **新档** = `renderer/session-list.css`（拟新增）——头注 + 迁出块全量逐字（顺序 = 原序）≈ **170**。
- **本档** = 450 − 164 + 保位注（1 行）≈ **288**。
- **改指表**：① `renderer/index.html:12` 后增 `<link rel="stylesheet" href="./session-list.css" />`（位次 = `chrome.css` 之后 ∕ `skin.css` 之前——级联序不变）；② 全树 `*.css` grep：迁出选择器集（`session-dropdown/item/rename/cancel/confirm/empty/ledger-notice` 族）**唯一定义面** = chrome.css 原文 ⇒ 无跨档同选择器竞争，搬移零观感风险；③ JS 面零引用（CSS 无代码引用面）。
- **零语义证据面**：迁出块与原文逐行一致（diff 对拍）+ 级联位次保持 + 零新增 ∕ 删除规则。

**方案 B —— `renderer/mount-sessions.mjs` 拆**（续拆落形——两手合一）：
- **切点**：迁出 = 原 **`:244-406`**（`// ─── 会话族接线` 段注起 … 档尾 `takeover` 止全部：`isProject` ∕ `refreshRail` ∕ `slotOf` ∕ `reasonOf` ∕ `loadPage` ∕ `openPage` ∕ `backfill` ∕ `openResult` ∕ `resumeOpened` ∕ `activateSession` ∕ `createSession` ∕ `confirmRename` ∕ `deleteSession` ∕ `takeover`）＝ **163 行**；留档 = 挂载与交互面（`FACE` 态族 ∕ `mountSessionBar` ∕ `wireFace` ∕ `render` ∕ `bindOutsideClose` ∕ `insideSelector` ∕ 草稿两助手 ∕ `submitRename` ∕ 确认 popover ∕ `SESSION_SLOT` ∕ `NAME_INPUT`）。
- **新档** = `renderer/session-wire.mjs`（拟新增）——接线面全量 + 自持 `host` 窄桥（模块级 `globalThis.thincoder`——与主档同刻约定）；≈ **185**。
- **本档** = 406 − 163 + 转口块 ≈3 − 头注 ∕ import 面收 ≈ **245**。
- **改指表（缝 = 同名再出口）**：
  - ① 本档增 `export { activateSession, backfill, confirmRename, createSession, deleteSession, refreshRail, resumeOpened } from "./session-wire.mjs"` ⇒ `renderer/app.mjs:37-40` **零改**（九名导入面解析零变）；
  - ② 存档批内件 `thincoder-desktop/.thincoder/tmp/2026-09-29-desktop-residuals-sweep-wave-a.test.mjs:91`（引 `confirmRename`）**零改**；
  - ③ import 面收：`openSession` ∕ `applyPage` ∕ `beginBackfill/endBackfill` ∕ `showToast` 随迁新档；`dom` ∕ `i18n`（`t`）∕ `store`（仅 `store.get`）∕ `views/session-control` 留主档。**新档 import 面全量（五源）= `./events.mjs`（`openSession`）· `./page-read.mjs`（`applyPage`）· `./store.mjs`（`beginBackfill` ∕ `endBackfill` ∕ `store`——`.get` ∕ `.set` 两用）· `./i18n.mjs`（`t`）· `/rc/toast.mjs`（`showToast`）**；`host` = 自持窄桥（非 import）；
  - ④ 存档批内件 `thincoder/.thincoder/tmp/2026-09-29-desktop-micros.test.mjs`（同件存档副本 = `thincoder/docs/batches/2026-09-29-desktop-micros.test.mjs`）——L-C 结构核（该档 `:94-101`）以 `MOUNT` 常量（`:27`）读 `renderer/mount-sessions.mjs` 源文本计数：`session.deleteFailed` 恰 2 ∕ `showToast(t("session.openFailed"` 恰 4 ∕ `renameFailed` 恰 2（现读 `:311 ∕ :325 ∕ :335 ∕ :346`、`:359 ∕ :366`、`:384 ∕ :392`——三组串全居迁出区 `:244-406`）⇒ 拆后该件必红 ⇒ **实施轮改指 `MOUNT` → `renderer/session-wire.mjs`**（两副本同步；复跑 = `node --test` 该件——两副本位皆可跑；判据 = 复跑绿）；
  - ⑤ 注释指针（**随批改指**——一行级、零语义）：`renderer/store.mjs:55`（写者指针）· `renderer/page-read.mjs:6`（消费面两径）· `renderer/i18n-views.mjs:79 ∕ :221`（toast 消费面）· `renderer/i18n.mjs:49`（消费面）· `renderer/events.mjs:9`（消费面）——五档六处「`mount-sessions.mjs`」⇒「`session-wire.mjs`」；链序注补 `session-list`（位次 = chrome 后 ∕ skin 前）：`renderer/chat-cards.css:2` ＋ 同族核得 `renderer/chat.css:6` · `renderer/chat-composer.css:2` · `renderer/chat-fixes.css:2`；并纳核得 `renderer/views/session-control.mjs:5`（「接线留」句——接线随本批出档）。
- **零环面** = 主档不 import 新档（仅再出口）· 新档不 import 主档（handlers 注入制）——方向单行。
- **零语义证据面**：迁出块逐行一致 + 导出面九名清零变（两路径 import identity）+ 全部行为判据（三出口 ∕ 刷新 ∕ 改名 ∕ 删除 ∕ 邻位接管）不减。

**缝与名之裁**：缝取**同名再出口**（不取 `app.mjs` 直引改指——KD-SS-1）；名取 `session-list.css`（沿 3.4 案在册名）∕ `session-wire.mjs`（沿 `composer-wire.mjs` 命名族）。

### 2.3 他端查得（界外 · 本批不裁——报告项）

- **>500 硬限（代码面全仓）**：**1 档** = `thincoder-vscode/webview/chat.css` **511**（已在册：`docs/vsc/design/VSC-DEBT.md:308`「CSS 不入门」裁定 + 本档 §10 CC② 观察）。
- **>300 顾问线（各端登记面自持）**：`thincoder-core` **35 档**（最大 `provider/responses.mjs` **495**——余 5；≥480：`manifest.mjs` 482 ∕ `agent-tools/advisor-async.mjs` 481 ∕ `agent-tools/consult.mjs` 481）· `thincoder-cli` **10 档**（最大 `src/tui/model-picker.mjs` **499**——余 1）· `thincoder-vscode` **12 档**（最大 `webview/chat.css` 511；次 `webview/base.css` 487）· `thincoder-render-core` **4 档**（最大 `composer/composer.css` **481**）。
- 处置建议 = 归各端登记面（本批零改）；近硬限三档（cli 499 ∕ core 495 ∕ core 482）建议父侧知会各板（**上抛 ③**）。

### 2.4 避让表（在飞批 · 2026-09-29 届盘）

| 在飞批（`docs/batches/`） | 桌面渲染面触点 | 与本批关系 |
|---|---|---|
| `2026-09-29-desktop-rebuild-fidelity`（#604–#608 + #581 候选） | `renderer/mount-sessions.mjs:104-118`（会话条重建）· `views/chrome.mjs:191-198` · `views/activity.mjs` · `app.mjs:260-271` · `views/chat.mjs:304-318` · `views/settings.mjs` · `views/onboarding.mjs` | **同档冲突 = mount-sessions.mjs**（本批迁 `:244-406` ∕ 彼动 `:104-118`——区段不交）⇒ **须串行**：建议本批拆先落（纯搬零语义 = 稳定基）；若彼先落，本批拆点按届盘重钉（内容锚不变）。**上抛 ①** |
| `2026-09-29-desktop-residuals-round3`（#539 … #618） | `app.mjs:59` · `mount-composer.mjs:29` · `store.mjs:58` · `composer-wire.mjs:46` · `views/settings-sections.mjs` · `i18n-views.mjs` · `views/statusline*` · `chat-composer.css:61` | 零交（本批不触 app.mjs ∕ store.mjs） |
| `2026-09-29-i18n-split`（#614） | `renderer/i18n.mjs`（+ `i18n-views.mjs` 勘察） | = 例外 Ⅰ 承接批 ⇒ 本批零触 |
| `2026-09-29-perf-residuals`（#619） | `chat-stream.mjs` · `views/chat.mjs` · render-core md 链 | 零交 |
| `2026-09-29-doc-backfill`（#560/#594/#598/#612） | **文档面**——含 `docs/desktop/design/PROJECT.md`（播种面族 ∕ 坐标族——他区段） | **同档双笔 = PROJECT.md**（本批 = §4.1/§4.2；无行重叠）⇒ 串行落笔安全；本设计轮已先行落笔。**上抛 ②** |
| `2026-09-29-desktop-extension-engine-face`（#523/#524） | #523 若裁「接」或触 `src/main/agent-bridge.mjs`（本批续期行） | watch（本批零触） |
| `2026-09-29-batch-mechanics` ∕ `-core-env-residuals` ∕ `-doc-check-face` | 非桌面渲染面 | 零交 |

另：工作树在飞未提交 = `docs/desktop/design/{PROJECT,IPC,UI}.md`（并批笔——本设计轮落笔前已届盘重读）。

### 2.5 验收对照（judgment lines —— 逐条机检可判）

- **AC-1 落盘与行数**：`session-list.css` 落盘；`chrome.css` ≤300（预期 ≈288）；`session-wire.mjs` 落盘；`mount-sessions.mjs` ≤300（预期 ≈245）。（机检 = 内容行数扫描）
- **AC-2 逐字零变**：迁出两段与原文逐行一致（chrome.css `:136-262` ∕ `:287-323`；mount-sessions `:244-406`——diff 正负行对拍）。
- **AC-3 引用面**：`index.html` link 在位且位次 = chrome.css 之后 ∕ skin.css 之前；`app.mjs` 零改且装配冒烟绿。（机检 = `node --check` + 启动冒烟）
- **AC-4 缝**：七名再出口与 `session-wire.mjs` 直导入同引用（import identity）；存档批内件 `2026-09-29-desktop-residuals-sweep-wave-a.test.mjs` 复跑绿。
- **AC-5 行为零变**：`thincoder-desktop` `node test/run.mjs` 全绿（回归基线）；全 renderer 面 `node --check`。
- **AC-6 登记**：PROJECT.md §4.1 两行 + 越层段 + §4.2 块实读回填（实施轮义务）；变更记录一行（本设计轮已落）。
- **判据面说明**：本批 = tech_todo（#536）——无需求档五要素面（不适用）；判据 = 本节 + 台账行 + §1 口径。

### 2.6 关键决策

- **KD-SS-1 缝 = 同名再出口**（不取 `app.mjs` 直引改指）。由 = 拆档链登记缝制式（PROJECT.md §4.2「缝 = 同名再出口 ∕ 表位注册」）+ 先例 `src/main/agent-host.mjs:53-55` + 零消费者 churn（`app.mjs` 双在飞批笔面避让 + 所引存档件保绿）。被否：直引改指（触 app.mjs + 存档件两处；收益 = 少一层转口）。
- **KD-SS-2 切面划定**：A 案取「会话列表面」（下拉 + 条目全族 + 条目内改名形；`.session-new` = 控制条钮留档 ∕ `.auto-confirm` = 共享确认族留档）；B 案取「接线面全量」（非仅两手）——由 = 迁后主档余量（两手仅 ⇒ ≈290+ 贴线；全量 ⇒ ≈245）+ 零环面（handlers 注入制天然缝）。
- **KD-SS-3 A 案非连续切**（`:136-262` + `:287-323`）——由 = `.session-new` ∕ `.auto-confirm` 居间留档；CSS 无顺序依赖（选择器集互斥）。
- **KD-SS-4 不扩面**：余档全「续期在册」——由 = ① 设置面族在飞两批（避让）② 各档消解窗口 = 「下次结构性触碰」未到（本批零触）③ i18n 有专批在飞。被否：本轮一并清零（十拆同批——超范围且与在飞批撞面）。

### 2.7 上抛项

1. **`mount-sessions.mjs` 双写者定序**（本批拆 ∕ rebuild-fidelity #606）——请父侧定序（建议本批先落；§2.4）。
2. **PROJECT.md 同档双笔**（本批 §4.1/§4.2 ∕ doc-backfill 他区段）——串行即可（本设计轮已先落）。
3. 他端近硬限三档（cli `model-picker` 499 ∕ core `responses` 495 ∕ core `manifest` 482）——建议知会各板。

### 2.8 实施轮随动义务

- 实施轮：两台拆落盘 + 批内件（结构不变量 + 缝实证）+ `thincoder-desktop` 测试套回归；§4.1 两新档补行 + 两行 ∕ 越层段实读回填 + §4.2 本块实读；变更记录随动一行。
- 测试面 = ①批内件（行数上界 ∕ 移动块逐字 ∕ 导出 identity ∕ 零重复选择器）；②既有回归 = `node test/run.mjs`（桌面）；③存档件复跑（缝面）。

### 2.9 父侧定序裁定（回复收讫 · 2026-09-29）

- **① `mount-sessions.mjs` 双写者** ⇒ **本批拆先落**（纯搬零语义 = 稳定基）；rebuild-fidelity #606 在其后届盘重读（§2.4 避让表同拍）。
- **② `PROJECT.md` 双笔** ⇒ 本设计轮先落笔有效；doc-backfill 于其实施时届盘重读。
- **③ 他端近硬限三档**（cli `model-picker` 499 ∕ core `responses` 495 ∕ core `manifest` 482）⇒ 收讫，父侧已归账（下一结构轮）。
- §2.7 上抛 1–3 = **全数裁决闭环**（无余项）。

### 2.10 修正块（设计评审 #18 · 五发现逐条落修 · 2026-09-29 · eng-designer）

**形态** = 「段内就地订正 + 本块逐条记录」并用（订正已在正文落位；原行可由 git 历史逐字复核；本块 = 记录面）。五发现 = 父侧全数受理（0 🔴 · 1 🟡 · 4 🔵）；本轮 = 设计面修正（产品码 ∕ 他档零改；§3 零改）；不夹带新范围。

| # | 发现 | 落修（落点 = §2 正文；源面 file:line 为实读） |
|---|---|---|
| 1 🟡 | micros 存档件消费者漏列 ∕ KD-SS-1 措辞过宽 | §2.2-B 改指表 **增 ④**——micros 件（两副本）实施轮改指 `MOUNT` → `renderer/session-wire.mjs`（判据 = 复跑绿）；KD-SS-1「存档批内件保绿」⇒「**所引存档件**保绿」（§2.6） |
| 2 🔵 | 新档 import 面无单源句 | §2.2-B ③ 补 **新档 import 面全量（五源）** = 随迁四组 + `store`（`.get` ∕ `.set`）+ `t`；`host` 非 import（自持窄桥） |
| 3 🔵 | `renderer/app.mjs:36-40` 跨度含无关行 | §2.2-B ① 引注 ⇒ `renderer/app.mjs:37-40` |
| 4 🔵 | §2.1 两档旧值无收正注 | §2.1 表 2 ∕ 3 行补注：`renderer/chrome.css` **450**（登记旧值 425 陈旧——届盘收正）· `renderer/mount-sessions.mjs` **406**（登记旧值 400 陈旧——届盘收正）——沿 agent-bridge 行式样 |
| 5 🔵 | 注释指针面未入改指表 | §2.2-B 改指表 **增 ⑤**（随批改指——一行级、零语义）：五档六处「`mount-sessions.mjs`」⇒「`session-wire.mjs`」＋ 链序注补 `session-list`（chrome 后 ∕ skin 前）= 清单内 `renderer/chat-cards.css:2` ＋ 同族核得 `renderer/chat.css:6` · `renderer/chat-composer.css:2` · `renderer/chat-fixes.css:2`；核得并纳 `renderer/views/session-control.mjs:5`（「接线留」句——接线随本批出档） |

**核扫旁注（发现 5 连带 · 零动）**——族级 ∕ 历史描述指针在册保持（按发现 5 二择一之「族级指针惯例留存」口径）：`renderer/app.mjs:5 ∕ :12`（出档面图——另受在飞批避让）· `renderer/views/chrome.mjs:10`（发现 5 自引先例）· `renderer/i18n-views.mjs:13`（⑤ 组头）· `renderer/store.mjs:6`（面内态仍归主档——仍真）· `renderer/views/session-control.mjs:3`（R13 出档史语——仍真）· 存档件 wave-a `:82`（载序语——仍真）。

**清单外加项（如实登记）**：发现 5 落修含 ⑤ 内四处清单外项（三链序注 + `session-control.mjs:5`）——同因同处置（随批改指）；如父侧裁不纳，删该四处即回原状。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：批档 §2（越线档结构轮设计——届盘全量清单十一档 + 主件两拆方案〔chrome.css ∥ mount-sessions.mjs〕+ 切点 ∕ 新档名 ∕ 改指表 ∕ 零语义证据面 + 避让表）＋随动档 `thincoder/docs/desktop/design/PROJECT.md`。按盘 spot-check：行数面全对（chrome.css 450 · mount-sessions.mjs 406 · i18n.mjs 500 · app.mjs 299 · store.mjs 300 · core.css 299 · views/chat.mjs 284 · views/chat-tool.mjs 299 · views/settings.mjs 334 · views/settings-sections.mjs 297 · mount-settings-segments.mjs 356 · i18n-views.mjs 328 · suspension-drive.mjs 326 · src/main/settings.mjs 324 · ipc.mjs 322 · agent-bridge.mjs 318 · chat.css 312 · providers.mjs 300；他端 vscode chat.css 511 · cli model-picker 499 · core responses 495 · core manifest 482）；切点面逐锚对上（`:136-262` 127 行 + `:287-323` 37 行 = 164；`:244-406` = 163）；引用面（index.html:12∕:13 位次 · app.mjs:37-40 九名 · 迁出选择器唯一定义面 · 新档名无占用）核验通过；PROJECT.md 随动已落且同数（`:291-292` ∕ `:699-703` ∕ `:1304`；「十档 vs 十一档」= 分组差，无矛盾）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 覆盖率（改指表完整性） | 🟡 | B 案改指表 JS 侧消费者面只列 `app.mjs`（批档 :66①）与 wave-a 存档件（:66② ∕ AC-4 :97），漏列同族「存档批内件」`2026-09-29-desktop-micros.test.mjs`——其 L-C 结构核对 `renderer/mount-sessions.mjs` **源文本计数**断言（`session.deleteFailed` 恰 2 处 ∕ `showToast(t("session.openFailed"` 恰 4 处 ∕ `renameFailed` 恰 2 处；该档 :94-101，复跑命令 :12），三组串全居本批迁出区 `:244-406`（现读 = mount-sessions.mjs:311/:325/:335/:346、:359/:366、:384/:392）⇒ 拆后该机检必红（2∕4∕2 ⇒ 0∕0∕0），设计未给处置；KD-SS-1（:104）「存档批内件保绿」因此表述过宽 | 改指表补该消费者行并附处置口径（其 MOUNT 面改指 `renderer/session-wire.mjs`，或登记为死快照）＋ KD-SS-1 措辞收窄为「所引存档件」 |
| 2 | 清晰度（新档 import 面） | 🔵 | §2.2-B ③（:66）只给主档 import 面收，未列新档 import 面；迁出块除所列四组随迁名外还实调 `t`（如 mount-sessions.mjs:311 ∕ :359 ∕ :384）与 `store`（:259 ∕ :282 ∕ :399 等）——新档 import 面靠推断，无单源句 | §2.2-B ③ 补一行新档 import 面全量（含 `store` 与 `t`），使「新档不 import 主档」可一眼机检 |
| 3 | 引注精度 | 🔵 | `renderer/app.mjs:36-40`（:66①）跨度含无关行——`:36` = `import { attachStatus } from "./mount-status.mjs"`；九名块实起 `:37`（`import {` 行） | 括注改 `renderer/app.mjs:37-40` |
| 4 | 数值漂移（doc hygiene） | 🔵 | §1:12 记台账旧读（`chrome.css` 425 ∥ `mount-sessions.mjs` 400），§2.1:36-37 届盘实读 450 ∥ 406，未如 agent-bridge 行（:44 ∕ :51）给「陈旧值收正」注 ⇒ 同指两档而数值不同 | §2.1 补两档陈旧值收正注（425 ⇒ 450 · 400 ⇒ 406，沿 agent-bridge 行式样） |
| 5 | 引注面（注释指针） | 🔵 | 改指表未含跨档注释指针面：`renderer/store.mjs:55`（「写者 = mount-sessions.mjs refreshRail 唯一写路径」）· `renderer/page-read.mjs:6`（消费面 = mount-sessions 首屏∕回填两径）· `renderer/i18n-views.mjs:79` ∕ `:221`（toast 消费面）· `renderer/i18n.mjs:49` · `renderer/events.mjs:9` · `renderer/chat-cards.css:2`（链序注）——拆后均部分失真（先例：R13 后 `renderer/views/chrome.mjs:10` 仍以族级名指 mount-sessions） | 改指表加「注释指针」行：二择一给由——随批改指 ∕ 按族级指针惯例留存 |

**计数**：🔴 0 · 🟡 1 · 🔵 4

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-29）**

- **依据** = 用户 2026-09-29 13:52「别等我了，自己跑完」+ 17:02「尽可能消除」令（代点火 + 代批准授权）。
- **三条件核检**：① **评审 pass**——本档 §3 轮次 1（在册）② **实施在跑**——#42（结构拆分批）；落定后随 §5 入册 ③ **凭证**——评审已通过（token 在手）。
- **批准射程** = 本批 §2 全量（结构拆分 + micros MOUNT 改指）；**不扩面**。
- 〔父侧代签 · 记录在案 · 可 revert〕

## §5 实施记录（eng-coder）
**状态行**：实施完成（两台拆 + 改指表全项 + PROJECT.md 实读回填落盘；批内件 7/7 绿；审计/评审轮次随下段补）



**实施轮（initial · eng-coder · 2026-09-29）**

**交付摘要**：两台拆落盘 + 改指表全项 + PROJECT.md 实读回填（§2.8 实施轮义务）。实读：
- `renderer/chrome.css` **450 ⇒ 287**（迁出 164 行逐字 = 原 `:136-262` ∕ `:287-323`；保位注一行落 `:136`）∥ 新档 `renderer/session-list.css` **170**（头注 6 + 迁出块 164；链序位 = chrome 后 ∕ skin 前）。
- `renderer/mount-sessions.mjs` **406 ⇒ 236**（迁出 163 行逐字 = 原 `:244-406`；另 import 面收 −5 · 窄桥随迁 −2 · 头注收 −4 · 缝转口块 +4）∥ 新档 `renderer/session-wire.mjs` **194**（头注 22 + 五源 import 面 6 + 窄桥 2 + 迁出块 163）。
- `renderer/index.html` **55 ⇒ 56**（link 位次 = chrome 后 ∕ skin 前）。
- 改指表：⑤ 注释指针十档十一处随批改指（`store.mjs:55` ∕ `page-read.mjs:6` ∕ `i18n-views.mjs:79&221` ∕ `i18n.mjs:49` ∕ `events.mjs:9` ∕ `chat-cards.css:2` ∕ `chat.css:6` ∕ `chat-composer.css:2` ∕ `chat-fixes.css:2` ∕ `views/session-control.mjs:5`）；④ micros 存档件 MOUNT 改指（`.thincoder/tmp/` 副本已落——docs 副本受跨批次写门拒写 ⇒ 父侧收位）；② wave-a 零改 ✓。
- PROJECT.md：§4.1 两新档补行 + 三行实读收正（chrome ∕ mount ∕ index.html——index.html 为本批新增差，一并回填）+ 越层段二档除名（十一 ⇒ 九）+ 硬限段次大两档收正 + §4.2 预登块 ⇒ 实施实读块 + 变更记录一行。

**决策透明表**：

| # | 决策 | 由 |
|---|---|---|
| 1 | 保位注落原块1 切点位（`:136`）、全文一行 | 设计 §2.2-A「保位注（1 行）」最字面读法（该位 = 迁出块原位）；B2 腿机检「净差 = +1 ∧ 落点 = 切点位」 |
| 2 | 迁出块间不置空行（session-list.css = 头注 + 块1 + 块2 直连） | 行预算 170 = 164 + 头注 6；「零重排」最小形 |
| 3 | 主档头注按拆后实况收（接线描述随出档 + 窄桥行移除 + 导出面改写） | 指针真实性纪律（同 ⑤ 族）；窄桥 `host` 拆后主档零引用（实读核——留则死码） |
| 4 | 基线件机器生成（搬前冻结）+ 批内件四腿机检 | 沿 i18n-split 基线先例（KD-4：基线冻结对拍 > git diff 目视）；搬前先生成、改后对拍 |
| 5 | micros 副本两处 prose 指针（档头行 ∕ 用例名）随 MOUNT 一并改指 | 同批指针失真纪律；不随改则档内自相矛盾（披露项） |
| 6 | D 腿判据 = 规则面（剥注释）计数 + 保留面守恒（派生自冻结块） | 实读发现 `.session-item-meta` ∕ `.session-new` 各一次为**注释跨引**（非规则）——判据收正为「规则面唯一定义面 + 注释面守恒」 |

**机检读数（全绿）**：
- 批内件 `.thincoder/tmp/2026-09-29-structure-split-round.test.mjs`：**7/7 绿**（A 行数 287 ∕ 170 ∕ 236 ∕ 194；B1 块逐字 127 ∕ 37；B2 净差 +1 落 `:136`；B3 块逐字 163 + 缝；C 七名同引用 + `app.mjs` 零改；D 规则面唯一 + 跨 10 档零副本 + 留档零动；E 级联序 :12/:13/:14）。
- micros 存档件（tmp 副本）复跑 **5/5 绿**（MOUNT 改指后）。
- wave-a 存档件复跑：**5 pass ∕ 2 fail —— 改前 ∕ 改后同集**（两 fail = ⑤b ∕ ⑤c 他批漂移，批前既红；缝面腿 ③ 绿——栈证 `confirmRename → renderer/session-wire.mjs:144`）。
- `node --check` 全改档 8 .mjs 绿；`thincoder-desktop` `node test/run.mjs` 绿（清单空 = 零用例）；逐字对拍（基线）：块1 ∕ 块2 ∕ 块3 全等 ∕ chrome 余行 286 行逐行等值。
- `node scripts/doc-check.mjs`：本批写域（PROJECT.md）**零新增红**（悬空 460⇒460 归一 ∕ 行宽 80⇒80 ∕ 行式异常 0；行数面三处消差——chrome ∕ mount ∕ index.html）。

**披露 ∕ 未做项**：
1. **micros docs 副本未改指**（跨批次档写门拒写）——`.thincoder/tmp/` 副本已改指；docs 副本待父侧收位（父侧已受理）。
2. wave-a AC-4「复跑绿」不成立（批前即 2 红——他批漂移；父侧已立账，口径 = 同绿集）。
3. micros 副本 prose 两处改指 = 清单外同因处置（同 ⑤ 族改指）。
4. 批内件 ∕ 基线件住 `.thincoder/tmp/`（写门分流预设）；基线 = 机器生成冻结件。
5. 全仓 doc-check 存量红（163 悬空 ∕ 80 行宽）与他批在飞新增（`docs/vsc/design/WEBVIEW-INPUT.md:52` 3 条）不在本批写域。

**自含交付闭环（审计 ∕ 评审轮次 · 修正轮 · 终态）**

- **内部 explore 漂移审计 ×1**（read-only 独立对拍）：**DEVIATIONS 2 条**——① micros docs 副本未改指（= 已披露项 ∕ 写门拒写 ∕ 父侧受理）；② 记录面计数：§4.2 行 ∕ 变更记录行作「两行收正」而实为三行（index.html 一并回填）。其余全绿：迁出三块**全量逐行对拍**全等（含框线 ∕ 全角 ∕ ✎ ✕）· 改指表 11/11 · 主档零死码 · 零环 · §4.1 ∕ 越层段 ∕ §4.2 读数逐条对实读 · 披露项全属实。**SILENT-SIMPLIFICATION 0 · OUT-OF-LIST 0**。
- **修正轮 1**（审计后）：② 就地收正——PROJECT.md §4.2 行 ∕ 变更记录行「两行收正」⇒「三行收正（chrome ∕ mount ∕ index.html）」。
- **advisor 代码评审 ×1**（type=code）：**VERDICT: pass**——🔴 0；🟡 2（PROJECT.md:847 T-DSK20 坐标跨档滞后 ∕ :54 KD-16 实据指针滞后——皆「报而不改」交父侧文档层）+ 🟡 2 协调项（micros docs 副本；wave-a AC-4 字面口径）均披露且父侧在办；🔵 2（`mount-sessions.mjs` 尾空行计数口径 ∕ 五处链序注漏 `core-markdown`）。旁注：评审机检引文复核标 2 条 `index.html:19` 不匹配——实施轮实读复核 = **两皆误报**（index.html:19 = `./core-markdown.css` 实读在场；另一条引文实为 `session-list.css:3` 文本、被机检错挂 index.html）。
- **修正轮 2**（评审后）：① `renderer/mount-sessions.mjs` 尾空行清理（**236 ⇒ 235**——文件原以 `"}\n\n"` 收尾；连带三处登记实读收正：§4.1 行 ∕ §4.2 行 ∕ 变更记录行）；② 本段登记（上方 236 读数以本注为准收正为 **235**）。复跑：批内件 **7/7 绿**（A 腿读数 = 287 ∕ 170 ∕ **235** ∕ 194）· `node --check` 绿 · doc-check 本批写域**零新增红**（归一后新增 0 ∕ 全仓行宽 80 ⇒ 80）。
- **未采纳项（报而不改 · 留父侧）**：T-DSK20 ∕ KD-16 坐标滞后（PROJECT.md §7 ∕ §2——文档层 ∕ 射程外）；链序注 `core-markdown` 遗漏（沿革性，下次触碰补）；micros docs 副本（写门拒写——父侧已令收口同步）。
- **终态 = clean**（无 🔴；🟡 皆为已披露 ∕ 报而不改的协调项；全部机检腿绿；修正轮 2 ≤ 上限 5）。

## §6 验证与收口（父代理）

### 6.1 收口（父侧 · 2026-09-29）

- **交付物全落**：**A 拆** `renderer/chrome.css` 450 ⇒ **287**（≤300）+ 新档 `renderer/session-list.css` **170**（迁出 164 行逐字；保位注一行）∥ **B 拆** `renderer/mount-sessions.mjs` 406 ⇒ **235** + 新档 `renderer/session-wire.mjs` **194**（迁出 163 行逐字；缝 = 同名再出口七名）∥ 级联 `renderer/index.html`（chrome → session-list → skin）∥ ⑤ 十档十一处注释指针 ∥ ④ micros MOUNT 改指（`docs/batches/2026-09-29-desktop-micros.test.mjs`——**父侧同步 ✓**）∥ `PROJECT.md` §4.1 两新档补行 ∕ 越层段（九档）∥ §4.2 ∥ 变更记录（`PROJECT.md:1354-1358`）。
- **批内件（归档）**：`docs/batches/2026-09-29-structure-split-round.test.mjs`——复跑 **7/7 绿**（A 行数上界 ∥ B1–B3 逐字 ∥ C 缝 identity ∥ D 零重复选择器 ∥ E 级联序）；`docs/batches/2026-09-29-desktop-micros.test.mjs`（改指版）复跑 **5/5 绿**。
- **验证**：advisor 代码评审 pass（🔴0；修正轮 ×2：三行收正 + 尾空行收正）；wave-a 照「**改前 ∕ 改后同绿集**」口径（两红 = 他批漂移既存，归其批）；doc-check 本批写域零新增红。
- **集成面**：**不新增**（结构拆分 = 内部重构，零外部行为）。
- **结算同步清单**：① 角色表 ✓ ② 状态行 ✓ ③ 计数 ✓（四档：287 ∕ 170 ∥ 235 ∥ 194）④ 指针 ✓ ⑤ changelog ✓ ⑥ **台账勾销：#536 → 已核销**；新增 **#644**（留项入册：`PROJECT.md:847/:54` 跨档滞后 + 链序注漏 `core-markdown`）⑦ 前批遗留交叉核：`desktop-micros` 副本同步 = 本批收位 ✓。
- **遗留（显式）**：#644（下一文档轮）∥ wave-a 两红（他批漂移）∥ 留档九档（越线在册——续期在 `PROJECT.md` §4.1）。
- **收口结论**：本批终止。
