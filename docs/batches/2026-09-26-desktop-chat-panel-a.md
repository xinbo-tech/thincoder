# 2026-09-26 · 桌面会话面板补齐 · 批 A「能对话」
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-26 · 来源 = 用户 2026-09-26 22:19 走查（「输入框呢？…功能至少应该跟 cli/vsc 对齐」）+ 22:25 射程裁定（「能两批都做就都做了吧」）+ 22:2x 追加（「斜杠命令不是必须项」）——需求档 `docs/desktop/requirements/PROJECT.md` **§3.5** + **D13**；台账 #428。
> 台账 = #428（桌面端会话面板对齐 · 归批）。前情 = docs/batches/2026-09-26-desktop-impl-9.md §6（已收口 2026-09-26）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-27

### 1.1 讨论来源

用户 **22:19** 实测走查（「输入框呢？…功能至少应该跟 cli/vsc 对齐」）✓ + **22:25** 射程裁定（「能两批都做就都做了吧」✓ ⇒ **A + B 全做**）+ **22:2x** 追加（「**斜杠命令不是必须项**」⇒ 不对齐此项 ✓）。**依据** = 需求档 `docs/desktop/requirements/PROJECT.md` **§3.5** + **D13** ✓ · 逐项对照 = 调查 **#28**（20 行 · 格级 `file:line` ✓）· 台账 **#428** ✓。

### 1.2 批 A 条目（四件 · 硬阻塞 ✓）

1. **输入面** ✓——多行输入框 · **Enter 发送 / Shift+Enter 换行** · **中断键**（通道已备 = `msg:send` / `msg:interrupt` ✓）；
2. **`ev:question` / `ev:task` 消费** ✗——现 `renderer/events.mjs:198-199` 两通道**直返 `state`** ⇒ 事件到达即丢 · **回合必挂** ✓（**接线缺陷**，非缺功能 ✓）；
3. **消息队列写者** ✗——切片在（`renderer/store.mjs:45` ✓）· `events.mjs:41` 明注**零写者** ⇒ busy 期提交无路径 ✓；
4. **会话改名 / 删除 UI** ✓——通道 + 主侧逻辑已备（`session-actions.mjs:49` / `:57` ✓）⇒ 仅缺渲染面控件 ✓。

### 1.3 判据（机器可核 ✓）

① `thincoder-desktop` `node test/run.mjs` **全绿**（118 + 新增 ✓）；② 输入槽在盘（DOM 槽 + handlers 接线 ✓ · **Enter / Shift+Enter 两向** ✓）；③ **question / task 有消费路径**（用例驱动：事件 ⇒ 界面可见 + **可作答** ✓）；④ 队列写者（busy 提交 ⇒ 入队 ✓ + 满队提示 ✓）；⑤ 改名 / 删除（控件 + 通道往返 ✓）；⑥ **三端既有测试零回归** ✓ + doc-check 本批面零新增 ✓ + 各档 ≤300 ✓。

### 1.4 边界 / 依赖

**不做** ✗：**斜杠命令族**（**非必须项 · 用户裁定** ✓）· **批 B 四项**（另批 ✓）· 文件树 / 内置 diff / 终端面板（§3.4 / §5 既有边界 ✓）。**依赖** ✓：通道面已在（`msg:send` / `msg:interrupt` / `session:rename` / `session:delete` / 九事件订阅 ✓）+ 对照表 #28 ✓。

### 1.5 后续批（登记 ✓ 不丢）

**批 B「对齐」** ✓：⑤ 会话级模型 / provider 切换 · ⑥ 推理档位（**枚举选项**形 ✓）· ⑦ 状态栏上下文占用读数 · ⑧ 附件 / 复制导出（**D13** ✓）⇒ **批 A 收口后立批** ✓。

### 1.6 需求口径更正（父侧 · 2026-09-26 22:32 · **以本块为准** ✓）

- **#29 上抛（实读）** ✗：§1.2 ② 的「**回合必挂**」**与实现不符**——`thincoder-desktop/src/main/agent-bridge.mjs:72-75` 的 `onQuestion` **同步返回信号串**（不抛 · 不阻塞 ✓）⇒ 核 `thincoder-core/tools/question.mjs:24` 取该串为工具结果 ⇒ **回合不挂** ✓（`docs/desktop/design/IPC.md:36` **逐字已记**「作答通道未落 · **不阻塞回合**」✓）。
- **父侧失职** ✗：该错误经调查 #28 的**推断句**（其自标「未核宿主侧发出面」✗）被我**复述成事实** ✗ ⇒ **违证据纪律**（推断未核即断言 ✓）。**记功 #29** ✓（实读纠错 ✓）。
- **裁定 = (a) 真作答面** ✓（**同回合内作答**）：依据 = ① 验收句逐字「跑完一个**带提问的任务**」✓ + ② 用户「跟 cli/vsc **对齐**」✓ ⇒ **(b) 可视化路 = 工具仍不可真用** ✗ = **形状缩水** ⇒ 不许 ✗。**射程** = 新通道 **`question:respond`**（白名单 25 → **26** ✓）+ 桥 **`onQuestion` 改异步返 Promise** ✓ + **核外待决表**（沿审批门 `src/main/suspensions.mjs` 先例 ✓ · `promptId` 同源同值形态 ✓）+ **流内问题卡**（选项可点 / 自由答 ✓）——**均在批 A 内** ✓。
- **更正三处** ✓：需求档 §3.5 ② **就地收正** ✓ · 台账 **#428** evidence 收正 ✓ · 本档以本块为准 ✓。

### 1.7 走查发现：标签页点击切换失效（父侧 · 2026-09-26 22:45 · 并入批 A 作第 ⑤ 件）

- **现象** ✓（用户 22:43 走查实测）：「**会话标签页点击切换似乎不起作用**」✗。
- **父侧定位（实读 ✓ · 待 #29 复核）**：链路本身**通** ✓——`renderer/views/sessions.mjs:261-264` `tabControl` 带 `data-action="tab:activate"` ✓ + `wire(…handlers.onActivate…)` ✓；`renderer/app.mjs:174-179` 共用切换尾（`session:switch` ✓ + 错误兜底 ✓）。**疑点 = `views/sessions.mjs:237-245` `tabItem`：非活动标签落 `inert`** ✗——`inert` = **该子树对所有用户输入（含指针）失效** ⇒ **点非活动标签零响应** ✓（与现象吻合 ✓）。
- **与设计相抵** ✗：设计原话「非活动标签 `inert`（**不收 Tab 序**）」✓ ⇒ 意图 = **键盘 Tab 序排除**（对应 `tabindex="-1"` ✓）⇒ **`inert` 属过用** ✗（顺带禁鼠标 ✓）；而设计同时要求「标签激活 ⇒ `session:switch`」✓（`app.mjs:5` · `UI.md:17`）⇒ 二者相抵 ✓。
- **归口** ✓：**并入批 A（第 ⑤ 件）** ✓（同面 = 会话族渲染面 ✓）；**修法 = `tabindex="-1"` 换 `inert`** ✓ + 测试面随动（若现断言锁住 `inert` ⇒ **换断言对象，不删断言** ✗）+ 用例两向（非活动**可点且切换** ✓ ∥ 活动点击幂等 ✓）。
- **记账** ✗：本项**非新需求**（实现偏差 ✓ ⇒ 不动需求档 ✓）；**#431 家族再 +1 实例** ✓——「走查发现的『看着不对』，测试面看不见」✓（并注：**若测试锁住了错行为，则测试绿 ≠ 行为对** ✗）。

### 1.8 §1.7 更正：根因在设计层（父侧 · 2026-09-26 22:47 · **以本块为准** ✓）

- **§1.7 的归因错了** ✗：该块称 `inert` 属「**实现过用**」✗——实读更正如下：

| 实据（本次实读 ✓） | 内容 |
|---|---|
| `docs/desktop/design/UI.md:15` | 「**非活动标签置 `inert`**（不收 Tab 序、**不响应焦点**）」✓ |
| `docs/desktop/design/UI.md:57` | 项 7 复述同形 ✓ |
| `docs/desktop/design/PROJECT.md:254` | **T-DSK20**：「非活动标签不收 Tab 序」✓ |
| `test/views-tabbar.test.mjs:158-159` · `:286` | 断言 `inert` 在场 ✓ |

- **根因 = 设计层语义选择错误** ✗：意图「不收 Tab 序」✓（T-DSK20 ✓）· 手段 `inert` ✗ —— `inert` 使子树**对全部用户输入失效（含点击）** ⇒ **标签条"点击激活"被其落形杀死** ✗（`UI.md:15` **同一行**又写着「标签点击激活（与左列点行同一路）」✓ ⇒ **同行自相矛盾** ✓）。**代码与测试均忠实于设计** ✓ ⇒ **非实现之错、亦非测试之错** ✓。
- **父侧记账** ✗：本块为**第二次归因错误**（前一次 = §1.6「回合必挂」✓）⇒ 两次同型 = **未实读即下结论** ✓ ⇒ 纪律强化：**归因前须实读"设计档 + 代码 + 测试"三面** ✓（只读代码面会误判归属 ✓）。
- **路由更正 = 设计先行** ✗（`eng-designer` = 设计唯一作者 ✓）：**须改设计档**（`UI.md:15` 落形行 + `:57` ✓），非只改码 ✗；**T-DSK20 判据句建议保留** ✓（「不收 Tab 序」= 真意图 ✓·可机检 ✓）⇒ **只收落形、不收判据** ✓。**硬约束** ✓：非活动标签**必须可点且点在切换** ✓；测试面**换断言对象、不删断言** ✗。
- **#431 家族更新** ✗：本件属「**设计层语义错误 → 代码与测试忠实执行 → 全绿但行为错**」✓——比"测试锁住错行为"更前一步：**测试忠实于一份错设计** ✓ ⇒ 可见性缺口在**设计评审面**（人读设计时也未察觉同行矛盾 ✓）。

### 1.9 走查发现：关标签后对话流内容不消（父侧 · 2026-09-26 22:50 · 并入批 A 作第 ⑥ 件）

- **现象** ✓（用户 22:48 走查实测）：「把标签点 × 关掉了，但**会话流内容还在**」✗。
- **父侧定位（实读 ✓ · 待 #29 复核）** ✗：
  - `renderer/store.mjs:113-119` `closeTab` **只改 `tabs` / `activeTab`**（邻位接管律 ✓：关活动 ⇒ 优先右邻 ✓；关唯一 ⇒ `activeTab = null` ✓；关非活动 ⇒ 活动键不变 ✓）——**不触"页"** ✗；
  - `renderer/app.mjs:192-207` 三出口（`requestClose` / `confirmClose` / `cancelClose`）**均只 `store.set(纯动作)`** ✗；
  - `renderer/app.mjs:8` 明载 **帧出口重挂键 = `activeSession` / `locale`** ✓，而 `activeSession` **只由 `openResult`（`app.mjs:174-190` 切 / 建 / 续三路）设置** ✗ ⇒ **关闭路径从不更新它** ✓ ⇒ `paintChat` 不重挂 ✓ ⇒ **屏上留着已关会话的块** ✓（与现象吻合 ✓）。
- **本质** ✗：**"邻位接管律"只落在键面，未落在页面** ✓——`activeTab` 转了 ✓，"页"（`activeSession` + 块切片）没转 ✗ ⇒ **状态完成一半** ✓。
- **次生缺口** ✗：`activeTab = null`（关唯一标签 ✓）时**居中面无语义** ✗（渲染面未见空态 ✗）；已关会话的**事件**是否造成"幽灵"更新 ✗——**待实测确认** ✓。
- **修法方向（待 #29 裁形）** ✓：① 关闭致 `activeTab` 变更 ⇒ 走**与 `activateSession` 同一尾**（`session:switch` 载邻位 ✓）；② `activeTab = null` ⇒ **居中面空态**（须设计定形 ✗）；③ 用例两向（**关活动 ⇒ 屏上不再是它** ✓ ∥ 关唯一 ⇒ 空态 ✓）。
- **与 §1.7（第 ⑤ 件）同源** ✗：⑤ = 点击不切换（`inert` 杀点击 ✓）· ⑥ = 关闭不换页（页生命周期缺尾 ✓）⇒ 两者皆属「**标签条交互 ⇒ 页生命周期**」这条线 ✓ ⇒ **建议设计层整体收正**，而非两点各打补丁 ✓。
- **#431 家族 +1** ✓：又一条**结构在盘、行为错**且**测试面看不见**的实例 ✓。

### 1.10 实施期裁定：A-1 × app.mjs 硬闸冲突（父侧 · 2026-09-27 01:59）

- **冲突** ✗（A-1 上报 ✓）：设计 §4.1 要求 A-1 在 `thincoder-desktop/renderer/app.mjs` 落 `mount-composer.mjs` 引调（import + 挂载 1–2 行 ✓），而既有硬闸 `thincoder-desktop/test/host-floor.test.mjs:279`（U95 ✓）断言该档 ≤300，**现值 299** ✗ ⇒ A-1 一落即红；A-3 的变更体量更大（关闭尾 + 行动作接线 ~30 行 ✗）⇒ 两侧不能同真 ✓。
- **裁定 = 走设计已登记的拆档** ✓：`thincoder-desktop/renderer/mount-sessions.mjs`（拟新增 ✓）——**设计档 `docs/desktop/design/PROJECT.md:114` 本已登记该预案 ✓ 且消解窗口 = 「下次触碰批」** ✗ ⇒ **A-1 即该窗口** ✓ ⇒ 执行它 = 依设计 （非越权 ✓）。
- **硬要求** ✓：**机械提取 · 行为零改** ✗（不顺手重构 ✓）；新旧两档 ≤300 ✓；新档入既有结构闸面 ✓；**U95 恢复绿** ✓。
- **越声明披露** ✓：`mount-sessions.mjs` 不在 A-1 派单 `files` 内 ⇒ 属越声明 ✓ —— 父侧裁定放行 ✓、要求报告如实披露 ✓（越声明 ≠ 违规 ✓）。
- **A-3 交接** ✓（**父侧负责** ✗）：会话族接线已迁 `mount-sessions.mjs` ⇒ A-3 的 `closeTail` / 改名删除接线落**新档所在面**（不再假定在 `app.mjs` ✗）——由父侧在 A-3 起跑后转达 ✓。

### 1.11 派单期裁定二则（父侧 · 2026-09-27 02:17 · 承 §1.10 实施切分）

**㈠ U52 导出名册同笔更新** ✓（#45 上报 ✓）：`thincoder-desktop/test/views-locks.test.mjs:47-51`（U52 ✓）以 `deepEqual` **逐名校验 `store.mjs` 导出面（21 名）** ✓ ⇒ A-1a 新增四名（`enqueue` / `dequeue` / `drainQueue` / `QUEUE_MAX` ✓）必致其红 ⇒ **验收①物理不可达** ✗。裁定 = **新增导出者同笔更新该名册** ✗（仅该数组 ✓·该档其它字节零动 ✓），报告按**越声明披露** ✓（越声明 ≠ 违规 ✓）。**时序已核** ✓：该档唯一另一写者 = A-1b（`dependsOn [45]` ⇒ 串行 ✓）；A-3a 声明集不含它 ✓ ⇒ 无并写 ✓。

**㈡ `views-chrome.test.mjs` 越 300 ⇒ 照设计原样** ✓：设计 §4.1 已登记该档越层 + 拆分预案（消解窗口 = 下次触碰批 ✓）⇒ **原址补例 + 披露计数** ✓·**不当场拆档** ✗（拆档须新增测试档 + 动 `files.mjs` ⇒ 与本案既定边界相抵 ✓）。保险 = 若实际受 U95 一类硬闸 ⇒ 停手上抛 ✓。

**记功** ✓：#45 两轮共报父侧三处缺陷（派单第 5 项与设计 §2.9 相抵 · 新档登记义务缺环 · 本次 U52 盲区 ✓）——**不裁、带证据上报、同时继续不受影响面** ✓ = 期望行为 ✓。

### 1.12 用户授权（**父侧代点火 + 代批准** · 2026-09-27 02:18 ✓）

用户原话 ✓：「**你自动跑完吧**」⇒ 本批链上：**设计评审点火权** + **§4 批准权** + **修正 / 实施轮派发** + **收口核销 / 提交推送** —— 均**委托父侧自动执行** ✓（沿本仓先例 `docs/batches/2026-09-21-end-diff-doctrine.md` §1.0 ✓）。

**父侧自缚三条** ✗：① 代签仅在三条件齐备时（评审 pass〔0 🔴〕∧ 修正轮落地并逐条核验 ∧ token 已签发 ✓）；② 代签写明依据 ✓；③ 需**新范围**或**用户口径裁决** ⇒ **停下** ✗。

**射程** ✓：批 A 六舱（#45 / #51 / #52 在跑 · #53 / #54 排队 ✓）+ 收口 / 提交 ✓；**批 B**（既定射程 ✓）在其后 ✓。

### 1.13 派单期裁定三则（父侧 · 2026-09-27 02:20 · #51 / #52 上报 ✓）

**㈠ A-2b 原子落地面扩权** ✓（#51 上报 ✓·其自证："半落即红——host-floor U74 断言 HANDLERS 键集 ≡ CHANNELS 集两向" ✓）：① `src/preload/preload.cjs` 白名单 25 ⇒ 26 ✓（设计档 `PROJECT.md:408` 明记"`ipc.mjs` / `preload.cjs` 同改" ✓）；② 三档计数随动（`test/host-floor.test.mjs` U13/U74 · `test/projects.test.mjs` · `test/session-contract.test.mjs` ✓·机械 ✓）；③ `src/main/agent-host.mjs:118` / `:120` + 第 4 键 `askQuestion`（2 行 ✓）——**均准** ✗（已核：三面不在他舱声明集内 ✓）。

**㈡ `test/agent-host.test.mjs` 拆档 ⇒ 准** ✓：该档在 **U95 hard 臂**内（≤300 含线上 ✓）⇒ 新例 ~320 必越硬闸 ✗ ⇒ 按**设计预案**拆 `test/agent-host-question.test.mjs` ✓（同 app.mjs 型：硬闸在前 ⇒ 预案即生效 ✓）+ 同笔登记 `test/files.mjs` + U51 零 CJK 扫描清单 ✓。**设计档计数漂移**（27 ⇒ **28** 档 · `files.mjs` 15 ⇒ **16** ✓）⇒ **父侧收口轮统一转设计面** ✗（实施舱不得动设计档 ✓）。

**㈢ 同档并写时序纪律** ✓（`test/files.mjs` 三写者：#51 在跑 / #52 在跑 / #54 排队 ✓）：**登记放最后一笔** ✓ · **写前重读** ✗ · **只加己行 · 他人行零动** ✗ · 与盘上不符 ⇒ 以盘上为准 ✓——已同步 **#51 / #52** ✓（#54 起跑时同步 ✓）。

**㈣ 设计缺口自填追认** ✓：`respond` 反向（审批载荷命中提问门）设计未定 reason ⇒ 实施舱拟取 **`bad-kind` + 不 resolve**（与正向对称 ✓）⇒ **准** ✓ + 披露 ✓。

### 1.14 派单期裁定：flush 触发落点（父侧 · 2026-09-27 02:22 · #45 上报 ✓）

**缺口** ✗：flush 的**触发**无干净落点——设计档 `PROJECT.md:136` 把「回合尾 flush 队首一条」写在 `mount-composer.mjs` ✓，而回合尾现成消费点只在 `renderer/events-subscribe.mjs:54`（`if (isTurnTail(ev)) void refreshTitles()` ✓·该档既不在 A-1a 声明内、也不在设计 §2.5 改动清单内 ✗）。

**裁定 = 取「句柄 + 接线面」形** ✓（**不**在 `mount-composer` 内另起订阅 ✗ ⇒ **不出现第二个订阅点** ✗）：
- **flush 逻辑** = A-1a 的 `mount-composer.mjs` 导出 `flushTurnTail()` ✓（设计档 `:136` 按「逻辑在此档 · 触发在订阅接线面」读 ✓ ⇒ 无矛盾 ✓）；
- **触发接线** = **A-1b** ✗：`renderer/events-subscribe.mjs` 于现成 `isTurnTail(ev)` 处**增 `onTurnTail` 窄口**（注入式 ✓·**判据仍单源** ✓）+ `renderer/app.mjs` 递入 A-1a 句柄 ✓；
- **`renderer/events.mjs` 回合尾两处**（`isTurnTail` 吃 `ev:error` ✓ + 错误径清本键 `running` / 位落 `done` ✓）⇒ **归 A-1b** ✗（A-1a 不落该档 ✓·其验收不需它 ✓）；
- 派单同步 ✓：A-1b 重派（`#53` 撤 ⇒ **#56** ✓·`files` += `renderer/events-subscribe.mjs` ✓）；#45 已收到裁定 ✓。

**记功** ✓（#45 第三 / 四次）：派单相抵 · 登记缺环 · U52 盲区 · 本次 flush 触发落点 ✓ —— **「不自裁 + 带证据 + 不停工」三件齐** ✓。

### 1.15 实施期记录（父侧 · 2026-09-27 02:48 ✓）

**㈠ 体检方法纠正** ✗：观测面 `touched` 字段**滞后**（#45 报"零落盘"时其实已落 `store.mjs` 四导出 + `i18n.mjs` +9 行 ✓）⇒ **盘上实读 / 实跑套件才是裁判** ✗；02:28 对 #45 的催促系据失效读数 ⇒ 已向其更正 ✓。

**㈡ A-2b（#51）交付核** ✓：新通道 `question:respond`（白名单 26 末位 ✓）· 桥 `onQuestion` 异步 ✓ · 待决表 `{kind,key,resolve}`（`promptId` 同源 ✓）· 取消串单源 `QUESTION_CANCELLED` ✓ · 四档判红删表前判、皆不结算 ✓；内部审计 CLEAN ✓ + 代码评审两轮 pass（8 条全落 ✓）。**父侧复跑** = **126/126 · fail 0**（exit 0 ✓·含 U114/U115/U116/U37/U74 ✓）。
**披露处置** ✗：① `files.mjs` 28 条（构成与设计 27 不同 ✓）· ② U95 fresh 清单未含新档（由两向自检兜底 ✓）· ④ `PROJECT.md` / `SHELL.md` 计数与坐标滞后（含 §4.1 回填 ✓）⇒ **① ② ④ = 收口轮设计面统一收正** ✓；③ `bad-kind` 两向 + `bad-verdict` = 设计三档（`IPC.md`:59）之外的**第四档** ⇒ **父侧裁定：属同族（判红不 resolve · fail-loud ✓）· 准** ✗ + 由收口轮设计面补入点名 ✓；⑤ 评审宿主引用机检「0/7 匹配」= **路径形态假阴性**（父侧同型复现并证伪 ✓）⇒ **该工具结论不采信** ✗·一切坐标以实读为准 ✓。
**㈢ A-3a（#52）交付核** ✓：其面（标签条拆分 / 点按 / 加速键 / 确认面）**全绿** ✓；其报两红 = **邻舱在飞所致**（名册锁 + 键数 ✓·均在其硬禁面外 ✓·分文未动 ✓ = 正确 ✓）；三处父侧随动（名册 +4 ∥ U51 键数 101→104 ∥ 零 CJK 名单补 `tabbar.mjs` ✓）⇒ **已点名转 #45**（同为其声明面 ✓）✓。

### 1.16 A-1a 交付裁定与下游登记（父侧 · 2026-09-27 02:50 ✓）

**㈠ 交付核** ✓：`126/126 · fail 0`（**父侧亲跑 × 3 次** ✓·exit 0 ✓）；U117/U118/U119 三新例在 ✓；U51 已含「**十三**视图档零 CJK」（`tabbar.mjs` 入名单 ✓ = 02:46 随动第 3 项落定 ✓）；同轮实读证第 1 / 2 项早已在盘（名册 25 名 / 键数 104 ✓）。**内部评审立功** ✓：轮 1 逮 **🔴 `handlers` 全档无定义**（`attachComposer` 必抛 ⇒ 判据②未交付；125 绿因无用例调它 ✓）⇒ 两轮修复 ⇒ 终态 clean ✓。
**㈡ 五项决策 = 准** ✓：① `QUEUE_MAX = 8` ✓ ② 草稿载体 = 闭包（非 store 键 ✓·键入零重绘 ✓）③ 复填 = `box.value` 赋值径（真机走查后若证冗余可删 ✓）④ flush 在飞卫兵 `flushInFlight` + 交叠一行诊断 ✓ ⑤ 自铸用例号 U117/U118/U119 ✓。
**㈢ 设计面缺口 ⇒ 收口轮设计面统一收** ✗（不当场自裁 ✓ 正确 ✓）：
1. **IME 组字期 Enter 直发** ✗（`:211` 仅看 `key`/`shiftKey` ⇒ CJK 用户组字中途会误发 ✓）⇒ **设计补规则**（`isComposing` 为真 ⇒ 不触发发送 ✓）**+ 实施小修**；
2. **交叠丢刻的续跑兜底** ✗（「无后继回合尾」时的处置属设计面 ✓）；
3. **🔵 三项**：`PROJECT.md` §4.1 三行数值回填（实测 `mount-composer 251` / `store.mjs 294` / `i18n.mjs 300`；另 `views-chrome 374` · `store.test 314` **越 300 软线 ⇒ 需拆分计划 / 免注册口径** ✓）· `store.test.mjs` 写死 `QUEUE_MAX === 8`（单源风险 ✓）· `drainQueue` 渲染面零调用者（`flushTurnTail` 用 `dequeue` ✓·`drainQueue` 留关页/复位面 ✓）。
**㈣ 走查面登记** ✓：**T-DSK21（真机 DOM 挂载 / 复填 / 焦点 / 组字）= 人工面** ⇒ 待 **A 六舱全落 + IME 小修落地** ⇒ **请用户走查**（届时桌面端可真跑 ✓）。

### 1.17 派单期裁定：`events.mjs` 归约半归属（父侧 · 2026-09-27 02:52 · #54 上报 ✓）

**缺口** ✗：设计 item ② 的**归约半**（`ev:question` / `ev:task` 两通道切片 + `clearQuestion` 纯动作 + 位标置位 ✓·`PROJECT.md:115` + §2.5 改动档 ✓）记在 `renderer/events.mjs`，而 A-2a 派单禁改该档、A-1b 声明面只为「回合尾两处」（§1.14 ✓）⇒ **该面两舱皆未覆盖** ✗（实读佐证：盘上 `:198-199` 两通道仍直返 state ✓·`renderer` 全族零 `questions` / `tasks` 切片 ✓）。**同型前科** ✗：§1.11㈠（U52 名册）——**新增面者 = 同笔落齐者**的判据一致 ✓。

**裁定 = ①（扩 A-2a 面）** ✓：`renderer/events.mjs` 的 **question / task 半归 #54** ✗（归约 + `clearQuestion` 导出 + 位标置位 ✓·越声明披露 ✓；其 T-DSK24 ②③ 的机检面即此归约 ⇒ 归它才能自绿 ✓）；**回合尾两处**（`isTurnTail` 吃 `ev:error` ✓ + 错误径清 `running` / 位落 `done` ✓）**仍归 #56** ✗。
**同档并写纪律** ✓（已双发）：**放最后一笔** ✓ · **写前必重读** ✗ · **只动己半** ✗ · 盘上已含邻舱改动 ⇒ **以其为准合入** ✓（禁整档覆写 ✗）。

### 1.18 派单期裁定 + 判据升格（父侧 · 2026-09-27 03:16 · #58 上报 ✓）

**㈠ 两处裁定（皆准 ✓）**：① **开 `renderer/views/sessions.mjs`** ✓（A-3b 的行内控件落点 = 该档树内部 `rowsList`/`rowItem`:106-119 ✓·**导出面零动** ✗ ⇒ U52 sessions 名册零随动 ✓；前写者 A-3a 已交付 ⇒ 无并写 ✓）；② **U52 store 名册同笔 +2 名**（`openRailForm` / `closeRailForm` ✓·沿 §1.11㈠ 先例 ✓·只动该数组 ✓·披露 ✓；前写者 A-1b 已交付 ⇒ 无并写 ✓）。**时序** ✓：`renderer/i18n.mjs` 与 #59 共用 ⇒ 词键放最后一笔 + 写前重读 ✓。

**㈡ 判据升格（本批第 5 例 ⇒ 升为常设条款 ✓）**：今晚同型五例 —— §1.11㈠（U52 store 名册）· §1.13㈠（U52 preload/计数三档）· §1.14（flush 触发落点）· §1.17（`events.mjs` 归约半）· 本块两处 ✓ —— **共同判据**：
> **「凡本舱新增的导出 / 面 / 新档 ⇒ 该舱同笔落齐其锁、名册、闸面登记（越声明披露 ✓·只动相关数组 ✓）」** ✗
**⇒ 升为派单常设条款** ✓：自下一批起，**每份实施派单的「设计要点」必含此句** ✗（免得每次都由子代撞出来 ✓）；本批剩余舱（#59 / #58）已按本块补发 ✓。

### 1.19 派单期裁定二则 + 重派（父侧 · 2026-09-27 03:20 · #58 上报 ✓）

**㈠ 新词键 ⇒ `views-chrome.test.mjs` 三处同笔** ✓（准 (i) ✓）：`:202` 键数锁 `104 → 实读值+新增数`（**不写死** ✗）· `:297` 全键消费 `deepEqual`（补键族拆解 ✓）· `:299-306` 零 CJK 名单如需 ✓ + **补消费树**使新键被消费 ✓。依据 = **§1.18 常设条款** ✓ + 设计 §2.9:244/:251 本预期该档随动 ✓（禁碰清单系切分所致 ✗）。**键数链条** ✓：#58 ⇒ #60（两舱共用 `i18n.mjs` + `views-chrome` ⇒ 写前重读 ✓·不写死数 ✗）。

**㈡ `store.mjs` 越 advisory ⇒ 照写 + 披露** ✓（准 (i) ✓）：实读依据 = `AGENTS.md`「≤300 **advisory** · ≤500 **hard**」✓ + host-floor U95 清单**不含** store ⇒ **无机械闸** ✓；**拆分预案 / 软线登记归收口轮** ✗（不当场拆 ✓）。

**㈢ 重派** ✓：A-2a 舱 `#59`（零成本撤销 ✓）⇒ **#60** ✓（`files` += `test/views-chrome.test.mjs` ✓ —— 它同样新增词键，同一条款覆盖 ✓·避免"起跑后再追发"的时序运气 ✗）。

### 1.20 A-3b 交付裁定（父侧 · 2026-09-27 03:54 ✓）

**交付核** ✓：`128/128 · 0 fail`（父侧复跑 ✓·+U120 页随动五例+三臂 · +U121 删除同源 ✓）；11 档全在其声明 + 越声明逐项披露 ✓；评审 pass（0 must-fix ✓·fix 0 轮 ✓）。

**㈠ U1 显式确认（其上报「请收口轮显式确认」⇒ 父侧即裁 ✓）**：**删除 ⇒ 同源页随动 = 确认保留** ✓ —— 依据：设计 ⑥ 第四点（§1.9 / §2.4 ⑥）已载同源出口 + 防死标签理由 ✓ + U121 已机检 ✓；§2.8「不确认 ⇒ 退为零动作」那句**不作退形依据** ✗（其语境 = 回执非 `ok` 时的零动作防死标签 ✓·与"回执 ok 真 ⇒ 同源出口"不冲突 ✓）。**退形成本（摘分支 + 摘 U121）不予采用** ✗。

**㈡ 其上报三项 ⇒ 收口轮设计面统一收** ✗（已累计，届时一批）：① `railForm` 无外部消解窗口（切项目 / 行集整置 ⇒ 陈旧确认面 ✗·设计增量 ✓）；② 改名出口无行为例（与 U121 不对称 ✓ ⇒ 补例 ∥ 登记走查面 ✓）；③ DOC-DRIFT（`PROJECT.md:53` / `:114` / `:149` · `RENDERER.md:44` 宿主仍指 `app.mjs` ⇒ 实住 `mount-sessions.mjs` ✓）。

**㈢ 其响应表 1 条 🟡 原文缺失** ✗（其如实注明 ✓）⇒ 由收口轮评审 / 审计复核时重新导出 ✓（不静默 ✓）。

**㈣ 越预算 6 档 + ≥300 登记** ✓ ⇒ 收口轮设计面同收 ✓（`store.mjs` ≈304 · `store.test.mjs` 314 · `views-chrome.test.mjs` 374 等 ✓）。

### 1.21 派单期裁定：断言锁同笔 + 条款措辞收正（父侧 · 2026-09-27 03:55 · #60 上报 ✓）

**㈠ 裁定 = 准** ✓：`test/events-reduce.test.mjs:104-105`（两通道「零写现态 ⇒ 原引用」钉）随归约改写 ⇒ **授权同笔改断言对象**（「写本键切片 ∧ 他键零写 ∕ 非本键 ⇒ 原引用」✓·**不删断言** ✗）。依据双重 ✓：**A-1b §5 已预告**「届时随改断言」（舱间交接已登记 ✓）+ **§1.18 常设条款** ✓。并写核查 ✓：唯一前写者 A-1b 已交付 ⇒ 无并写（写前重读照旧 ✓）。

**㈡ 同型第 6 例 ⇒ 条款措辞收正** ✗（**根因 = 我把条款写成了"列举式"** ✗）：#60 的派单**带了** §1.18 条款 ✓，但**只列举了 `views-chrome` / `files.mjs`** ✗ ⇒ 我漏列 `events-reduce` 的断言锁 ✗ ⇒ 子代又撞 ✓。**收正后措辞**（自本刻起 ✓）：
> **凡本舱新增 / 改写的面 ⇒ 其既存锁与登记（名册 / 计数 / 断言钉 / 闸面清单）同笔落齐** ✗ —— **清单以「你实际改了什么」为准，不限于派单列举** ✗；越声明披露 ✓·只动相关处 ✓。

**㈢ 记账** ✓：六例全为「子代逮到父侧切缝」✓·零例自裁 ✓ —— 条款 → 枚举 → **开放措辞** 的收敛过程本身入档 ✓。

### 1.22 A-2a 三度空转 ⇒ 三拆重派（父侧 · 2026-09-27 04:20 ✓）

**盘面裁决** ✗：`#60`（A-2a 第二次重派）**125/180 轮 · 盘上零落盘**（父侧 `git status` 实读：`views/question.mjs` / `views/plan.mjs` / `mount-cards.mjs` / `views-question.test.mjs` **皆不存在** ✓）⇒ **取消** ✓（零工作可失 ✓）。**同舱前史** ✗：`#54`（152 轮零写 ✓ 撤）· `#59`（排队期预防性重派 ✓）· `#60`（125 轮零写 ✓ 撤）⇒ **同面三度空转** ✓。

**处置 = 按"可用舱规模"三拆** ✓（先例：`#45` = 5 档一次交付 ✓·`#52` = 6 档 ✓ ⇒ **≤5-6 档/舱**为可靠区间 ✓）：
- **A-2a-1 归约半（2 档）** = `renderer/events.mjs` + `test/events-reduce.test.mjs`（含 §1.21 授权的断言对象改写 ✓）⇒ **#69** ✓；
- **A-2a-2 卡树三档（3 档 · 全新建）** = `views/question.mjs` / `views/plan.mjs` / `mount-cards.mjs`（词键名自拟 ⇒ **清单交接线舱** ✓）⇒ **#70** ✓；
- **A-2a-3 接线 + 测试（6 档）** = `views/chat.mjs` / `app.mjs` / `i18n.mjs` / `views-question.test.mjs` / `views-chrome.test.mjs` / `files.mjs` ⇒ **#71**（dep #69 + #70 ✓）。

**教训入档** ✗：**"卡面族"是本批唯一需要"读设计 → 造新档"的舱**（其余皆机械改造 ✓）⇒ 设计依赖度高的舱**必须更小** ✓；三拆后每舱 ≤6 档且无（或仅一处）新建 ✓。

### 1.23 A-2a-1 上抛裁定：events.mjs 越层（父侧 · 2026-09-27 04:30 · #69 上报 ✓）

**冲突** ✗（其一手实读 ✓）：`renderer/events.mjs` = **299 行** ✓ 且**在 `test/host-floor.test.mjs:258→267` 的 ≤300 机械闸内**（fresh 在册档 ⇒ **硬闸**，非 advisory ✗——与 §1.19㈡ store 案「清单不含 ⇒ 无闸」**恰成镜像** ✓，其读法准确 ✓）；本舱四项文风内 ≈+14 ⇒ ≈313，**极压单行亦 ≥301** ⇒ **无合法形态可入 ≤300** ✗。设计自算偏 ~13（`PROJECT.md:115` 预判「贴 300 层」✓）。

**裁定 = (b) 原位 + 例外登记** ✓：**(a)**（拆 `renderer/questions.mjs` ✗）唯省 13 行而**新增跨档缝拓扑**（最小环互引 vs 参数注入 ✗）+ 5 处设计收正 ⇒ 以新结构风险换 13 行 = 不值 ✓；**(b)** 零结构变动 + 例外面机制即有先例（`mount-settings` 458 ✓）。
**授权** ✓（沿 §1.18 ✓）：**#69 同笔改 `test/host-floor.test.mjs` 两笔**（`:258` 摘除该档 + `:271` 补例外项 ✓·形照邻条 ✓·限此两笔 ✗）；**`PROJECT.md` §4.1 登记句 = 只报不写** ✗（收口轮设计面 ✓）；`events.mjs` 落定 ≤500 ✓。
**两处归口** ✓：① 两切片 `questions` / `tasks`（设计记 store、盘上缺 ✓）⇒ **归约器首写自种**（不动 `store.mjs` ✗·其面已交付 ✓）；② `stopped` 终局摘本键提问项 + 清位标（`RENDERER.md:39/:56` ✓）⇒ **并入 #69 面**（其三项扩为四项 ✓）。

### 1.24 A-2a-1 交付核（父侧 · 2026-09-27 04:55 ✓）

**核** ✓：桌面端全量 **129/129 · exit 0**（**父侧亲跑 ✓**·含 `T-DSK24 卡面两切片` ✓）；三档落位（`events.mjs` 338 ✓·`events-reduce.test.mjs` 249 ✓·`host-floor.test.mjs` 284 ✓ = §1.23 授权两笔 ✓）；clean（评审 pass · fix 0 ✓）。
**其"相邻观察"核** ✗：`files.mjs:4` **确含 `test/agent-host-question.test.mjs`** ✓ ⇒ 「在册未登记」系**读岔** ✗（未列的实为 `views-question.test.mjs` —— 该档由 **#71** 新建并登记 ✓，属正常）⇒ **无缺陷** ✓。
**其"如实记"处置** ✓：① 评审原文因会话压缩未留存（**今晚第 2 例** ✗——#58 同型 ✓）⇒ **派单常设条款补一条** ✗：**「舱内评审 / 审计报告须在 §5 逐字留存（不得只记自述摘要）」** ✓（自下一批起 ✓）；② 设计档漂移（`PROJECT.md:115/:120/:141/:147/:173` · `IPC.md:44` · `UI.md:23` 两坐标漂至 `events.mjs:154`/`:322` · `events-subscribe.mjs:4/:17` ✓）⇒ 收口轮设计面 ✓。

### 1.25 A-2a-2 交付核（父侧 · 2026-09-27 05:07 ✓）

**核** ✓：三档全新建 ✓（`views/question.mjs` 106 · `views/plan.mjs` 41 · `mount-cards.mjs` 144 ✓）；桌面端 **129/129**（其自证 ✓·本舱冒烟 33 checks/167 asserts ✓）；clean（内审 clean · 评审三轮 pass · fix 1 轮仅注释坐标 ✓）✓。
**其交接清单 ⇒ 一格无主 ⇒ 当场归口** ✗：**`renderer/styles.css`（三卡类）不在 #71 声明面** ✓ ⇒ **已令 #71 并入** ✓（+ `chat.mjs` 的 `blockAnchor` 卡序接缝 ✓ + `i18n.mjs` 107 → 110 键数 ✓ ⇒ 三项作**补充面**并入 ✓·越声明披露 ✓）。
**其余漂移 ⇒ 收口轮设计面** ✓：`PROJECT.md:133/134/137` §4.1 估值 vs 实读（106/41/144 ✓·`mount-cards` 超估 ≈2.6× ✓）；U95 `fresh` 清单无三新档 ✓（沿 A-1a/A-1b 同律 ✓）。
**其两条残留 🔵** ✓：签名理论碰撞面（换问 ⇒ prompt-id 必变 ⇒ 实网不可达 ✓）· plan 行项零过滤（核侧已滤 ✓）⇒ **保留现判据** ✓（父侧准 ✓）。
**条款执行观察** ✓：其 §5 **逐字留存评审原文（含日志恢复路径）** ✓ —— §1.24 新立的常设条款**首例即执行** ✓。

### 1.26 裁定：三卡 CSS 落 `chat.css`（父侧 · 2026-09-27 05:23 · **收正 §1.25** ✗）

**缘起** ✗：#71 实读设计单源后上抛——§1.25 我写的"CSS 三卡类 ⇒ `renderer/styles.css`"（**转述自 #70 交接用词** ✗）与设计档相抵：`PROJECT.md:112` 把**对话流面样式单源**定在 **`renderer/chat.css`** ✓（块 / 工具卡 / 摘要块 / 药丸 ✓）；同族**审批卡** `.approval-card` 实住 `chat.css:129-170` ✓（先例 ✓）；`styles.css` 自述面 = 布局 / 主题变量 / 外壳 / 字形（`PROJECT.md:111` ✓）且已 340 行越 300 ✗。

**裁定** ✓：**三卡类落 `renderer/chat.css`** ✓（与审批卡同族同形 ✓）；#71 按**越声明**披露 ✓；§1.25 那句**以本块为准** ✓。

**父侧教训入档** ✗（今晚第 N 次同根）：**引用"单源"必须自己读原文，不得转述他人的转述** ✗——#70 交接用词 ✓ → 我未核即转 ✓ → #71 实读纠回 ✓。**⇒ 派单 / 裁定凡涉"某面落在哪"⇒ 引设计档原文行 ✓（不引子代措辞 ✗）。**

### 1.27 裁定：`ok:false` 径补诊断（父侧 · 2026-09-27 05:32 · #71 上报 🔴 ✓）

**🔴** ✗（其**代码评审**揭出 · 审计先已 clean ✓ —— **分层防线**：审计查偏差 / 评审查缺陷 ✓）：`renderer/mount-cards.mjs:50`（`receipt?.ok !== true ⇒ return false`）**零诊断** ✗ ⇒ 与设计**三处**原文相抵（`UI.md:23` · `RENDERER.md:55` · `PROJECT.md:275` = T-DSK24 ①「失败 ⇒ 卡留 + `console.error`」✓）；同批同族先例 `mount-composer.mjs:136` 对 `ok` 假**是**记错的 ✓；U124 ② 亦只断「卡留」✗。

**裁定 = (a)** ✓：**授权 #71 当场补** ✗（`mount-cards.mjs` 一行 `console.error`（携 `reason` ✓）+ U124 ② 补错面断言 ✓·**越声明披露** ✓）——依据：§1.25 既定机制 ✓ + #70 已交付（无并写 ✓）+ 三条设计原文的「失败」**覆盖 `ok:false`** ✓（同族行为即先例 ✓ ⇒ **非窄读问题，是实装缺口** ✗）。
**本轮验收面归属** ✓：T-DSK24 ①② = #71 面 ✓ ⇒ 补在 #71 合理 ✓。

### 1.28 IME 小修交付核 + 收口尾轮（父侧 · 2026-09-27 08:14 ✓）

**#75 交付核** ✓：组字门落形（`mount-composer.mjs:41-43` 纯谓词 `isComposing` ∥ `keyCode === 229` ✓·`:221` 首句门位 ⇒ 零发送 / 零 `preventDefault` / 零吞键 ✓·**零持久态 ⇒ 结构性不粘滞** ✓）；**U126 四臂** ✓（标准形 / 兜底臂 / 换行键 / 不粘滞+零丢字 ✓）；桌面端 **134/134 · fail 0** ✓；内审 CLEAN（四类偏差零命中 ✓ + 另查「无绕门可达发送的键路」✓）；doc-check delta 0 ✓；**评审跳过**（fix 轮小修 · 派单明禁 ✓·**如实披露**两源判据 = 内审 + 机检 ✓ = 可接受 ✓）。**收正轮 1**（引用源 §1 输入区行 → 交互行 ✓·229 臂溯源 ✓·U126 臂③ 非判别性标注 ✓）✓。
**其 5 条只报不写 ⇒ 已派收口尾轮** ✓（设计舱：`UI.md` 两处陈旧标记删除 + 229 臂点名 ✓·`PROJECT.md` §4.1 行数账两处回填 + `views-chrome` 越层拆分点登记 ✓·变更记录 ✓）。
**父侧裁定** ✓：**229 兜底臂准其入设计行** ✓（实施含之 · 加法语义同族 ✓·老 WebView 臂 ✓）。
**⇒ 尾轮落定即批 A 可 §6 收口** ✓（两批共一笔提交 = 待 A 冻结后一并 ✓）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（收口轮追记 · 实施后随动收正 · 设计五档 · 收口尾轮：只报不写清单 5/5 落地 · 2026-09-27）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 · 六件）

| # | 条目 | 需求锚 | 判据 | 设计落点 | 用例 |
|---|---|---|---|---|---|
| ① | 输入面（多行输入 · Enter 发送 / Shift+Enter 换行 · 中断键 · 挂载根） | 需求 §3.5 项 1（`docs/desktop/requirements/PROJECT.md:84`）· 对回 §3.1 `:38` / D3 | §1.3 ② | `docs/desktop/design/UI.md` §1「输入区」行 · `thincoder-desktop/renderer/index.html` 增 `[data-slot="composer"]` · `thincoder-desktop/renderer/mount-composer.mjs`（拟新增） | T-DSK22 |
| ② | 提问与计划面（`ev:question` / `ev:task` 消费 + `question` 工具**真作答**） | 需求 §3.5 项 2（`:85-88`）· 批档 §1.6 裁定 (a) | §1.3 ③ | `docs/desktop/design/IPC.md` §1 两载荷 + §2 白名单 25 → **26**（`question:respond`）· `UI.md` §1「提问呈现」/「计划面」行 · `thincoder-desktop/renderer/views/question.mjs` / `plan.mjs`（拟新增）· `thincoder-desktop/src/main/agent-bridge.mjs` 注入第 4 键 | T-DSK24 |
| ③ | 队列写者（忙态入队 · 唯一回合尾出队 · 满队不收） | 需求 §3.5 项 3（`:89`） | §1.3 ④ | `UI.md` §1「输入区」行 + §2 项 1「队列入池」 · `thincoder-desktop/renderer/store.mjs` 三纯动作 + `QUEUE_MAX` 单源 | T-DSK22 / T-DSK23 |
| ④ | 会话改名 / 删除 UI（左列行内控件 · 行原位换形） | 需求 §3.5 项 4（`:90`）· 对回 **D2** | §1.3 ⑤ | `UI.md` §1「左列会话行」行（行动作两控件） | T-DSK3 注（`thincoder-desktop/test/views.test.mjs` 原址补例） |
| ⑤ | 标签页点按切换失效（**走查并入 · 非新需求**） | 批档 §1.7 / §1.8（对回需求 §3.1 标签条） | T-DSK20 / T-DSK25（+ §1.3 ① 全绿） | `UI.md` §1「标签条」/「交互」行（两控件 `tabindex="-1"` 换 `inert`）· `thincoder-desktop/renderer/views/tabbar.mjs`（拟新增） | T-DSK20 / T-DSK25 |
| ⑥ | 关标签 ⇒ 页随动（**走查并入 · 非新需求**） | 批档 §1.9 | T-DSK26（+ §1.3 ① 全绿） | `docs/desktop/design/RENDERER.md` §1.1 **页生命周期** · `thincoder-desktop/renderer/app.mjs` 关闭尾 | T-DSK26 |

**三链一致**：需求侧 = 需求档 §3.5 四项（`:84-90`）+ **D13**（`:121`）；⑤ / ⑥ 两件为**走查并入**（实现偏差 ⇒ **非新需求** ⇒ 需求档侧**不新增条目**，锚 = 本档 §1.7 / §1.8 / §1.9）；本表 = 设计档验收行（`docs/desktop/design/PROJECT.md` §7 T-DSK20 / T-DSK22–26）同源，逐条可机检。

### 2.2 本批不含（边界）

**斜杠命令族**（用户裁定「非必须项」）· **批 B 四项**（会话级模型 / provider 切换 · 推理档位 · 状态栏上下文占用读数 · 附件 / 复制导出——需求 **D13** `docs/desktop/requirements/PROJECT.md:121`）· 文件树 / 内置 diff / 终端面板（§3.4 / §5 既有边界）· 审批卡**置焦执行**（open）· 活动池**窗限 / 归档**（`docs/desktop/design/PROJECT.md` §10 **P**）· 标签条**九档以上**键盘面（open）。

### 2.3 设计档落点（批 A 增量 · 已全部写盘）

| 档 | 增量 |
|---|---|
| `docs/desktop/design/RENDERER.md` | §1 索引「接线形通则」补半句（关闭路径同律）+ §1.1 新增**页生命周期**四条与**键盘面**（加速键单源） |
| `docs/desktop/design/UI.md` | §1 增「输入区」/「提问呈现」行；「标签条」/「交互」行收正（`tabindex="-1"` · **零 `inert`** · 关后页随动**只引单源不述**）；「左列会话行」补行动作（批 A 落形）；§2 项 1 补「队列入池」 |
| `docs/desktop/design/IPC.md` | §1 增 `ev:question` / `ev:task` 两载荷；§2 白名单 **25 → 26**（`question:respond` 末位） |
| `docs/desktop/design/SHELL.md` | §4 待决表（沿审批门挂起表先例 · `kind` 两值） |
| `docs/desktop/design/PROJECT.md` | §2 增 **KD-14 / KD-15 / KD-16** · §4.1 文件表（新档六 + 拆档两 + `app.mjs` 行记关闭尾）· §6.1 D3 / D4 回填 · §7 T-DSK20 落形 + T-DSK22–26 + T-DSK3 注层别 · §8 批 A 不做行 · §9 形态行 20 → 23 · §10 O / P / Q · 变更记录 |

### 2.4 机制设计

**① 输入面**——容器 = `thincoder-desktop/renderer/index.html` 新增单容器 `[data-slot="composer"]`（`.session` 内 · 对话流之后）；两态 = 有活动会话 ⇒ 可用 ∥ 无 ⇒ `disabled`（锚恒在）；键位 = Enter 发送 / Shift+Enter 换行；中断键 `data-action="msg:interrupt"`（**零乐观写**）；忙态判据 = 本会话位标含 `running` ⇒ Enter 不发，转 ③。

**② 真作答面**（`question` 工具**真可用**）——新通道 `question:respond`（出站 + 回执 · 白名单末位）+ 桥面 `onQuestion` 改**异步返 Promise**（原同步返信号串 ⇒ 工具结果被顶掉、工具不可真用）+ **核外待决表**（沿审批门挂起表先例 · `promptId` 同源同值）+ 流内问题卡（`data-card="question"` + `data-prompt-id`；给答项 `question:<i>`（i = 1 起）/ 自由作答 `question:answer` / 取消 `question:cancel`）；**退场判据 = 回执 `ok` 真**（零乐观写——失败 ⇒ 卡留在场可重试 + `console.error`）；`answer` 取值 = 选项串**原样** ∥ 输入串 ∥ 取消 ⇒ `null`。
**计划面**（`ev:task`）——流内独立节点 `data-card="task"` · 逐行 = 标题 + 状态词（出词 §1 闭枚举）· **同 key 就地替换**（不叠卡）· **空列表 ⇒ 卡不在场**（`items` 空 ⇒ 零节点）。

**③ 队列写者**——`pool.queue` **唯一写面** = `thincoder-desktop/renderer/store.mjs` 三纯动作（入队 / 出队 / 耗尽判定）+ `QUEUE_MAX` 常量单源；条目形 `{ title, status: "queued" }`（形单源 = 池面队列条目消费集 `thincoder-desktop/renderer/views/activity.mjs:119-125`）；**出队** = 唯一回合尾（`done` / `stopped`）经 `msg:send` 发出**一条**（余者待下一回合尾）；**满队** = 队长 ≥ `QUEUE_MAX` ⇒ 提示行落地（词键 `composer.queue.full`）且**该条不入队**（队长不增 · 输入文本保留）。

**④ 改名 / 删除 UI**——行内两控件（`data-action="session:rename"` / `session:delete`）· **行原位换形**（改名 ⇒ 文本控件 + 取消 / 确认两键 ∥ 删除 ⇒ 取消 / 确认两键；DOM 序 = 取消 → 确认）· 通道往返（`session:rename` / `session:delete`——通道面批 5 已落）；**否** `window.prompt` / `window.confirm` / dialog / 超时自动消。

**⑤ 标签点按失效修复**——根因 = **设计层语义选错**（`inert` 使子树对**全部**用户输入失效 ⇒ 杀死同行「标签点击激活」；批档 §1.8）：收正 = 非活动项**两控件各 `tabindex="-1"`**（真意图 = 只收键盘 Tab 序）+ **零 `inert`** + **确认态例外**（`data-confirm="1"` 项免 `-1`——决策面须键盘可达）；T-DSK20 判据「非活动标签不收 Tab 序」**保留**（只收落形、不收判据）；加速键 `Ctrl/Cmd+1..9` = 文档级 `keydown`，落 `thincoder-desktop/renderer/views/tabbar.mjs`（表外键**零动作 · 不吞键**——纯函数判定），单源 = `docs/desktop/design/RENDERER.md` §1.1 键盘面。

**⑥ 关标签 ⇒ 页随动**——尾落**接线面** `thincoder-desktop/renderer/app.mjs`（`closeTail(before)`，判据 = 动作前后 `activeTab` 比较）：
- 关活动且 `after.activeTab !== null` ⇒ `void activateSession(after.activeTab)`（**与激活同一尾**——邻位接管律已由 `closeTab` 落，本尾只补页）；
- 关唯一（`after.activeTab === null`）⇒ `store.set(openSession(store.get(), null))` **关页** —— 中区复用**既有** `none` 态（`thincoder-desktop/renderer/views/chat.mjs:32-47` 零节点 ⇒ **不新造空态视觉**、不发 `session:switch`）；
- 关非活动 / 拒收 / 待确认（`cancelClose`）⇒ **零动作**（`activeTab` 未变）；
- **删除会话 ⇒ 同源出口**（本端自补 · 见 §2.8 U1）：`session:delete` 回执 `ok` ⇒ `closeTab(本键)` + 同尾；`ok:false` ⇒ 零动作（防死标签）；
- **幽灵更新** = 既有 `forActive` 过滤已覆盖（`thincoder-desktop/renderer/events.mjs:68`）⇒ 零新机制；**页窗暂留** = 既有口径（`docs/desktop/design/PROJECT.md` §10 Q）。

### 2.5 受影响文件与测试面

逐档行数与预算 = `docs/desktop/design/PROJECT.md` §4.1 **单源**（本节不复制数值）。形状：

- **新档六**（全在 `thincoder-desktop/`）——`renderer/views/tabbar.mjs`（标签条面自 `renderer/views/sessions.mjs` 拆出 · 含加速键面）· `renderer/views/question.mjs` · `renderer/views/plan.mjs` · `renderer/mount-composer.mjs` · `test/views-question.test.mjs` · `test/views-tabbar-close.test.mjs`（标签条关闭面 + 页随动四例 · 自 `test/views-tabbar.test.mjs` 拆出）。
- **改动档**——`renderer/index.html`（增 `[data-slot="composer"]`）· `renderer/app.mjs`（关闭尾 + 续拆）· `renderer/store.mjs`（队列三纯动作 + `QUEUE_MAX`）· `renderer/events.mjs`（`ev:question` / `ev:task` 消费）· `renderer/i18n.mjs`（新增词键）· `renderer/views/chat.mjs` · `renderer/views/sessions.mjs`（标签条面拆出）· `src/main/agent-bridge.mjs`（注入第 4 键）· `src/main/suspensions.mjs` 面（待决表）· `test/views-locks.test.mjs`（关闭尾接线锚）。
- **清单两向自检**——`thincoder-desktop/test/files.mjs` 现值 **12 行 / 25 条** ⇒ 本批 **27 条**（盘上未登记 ⇒ `test/run.mjs` 反查即失败）；用例模块计数 **25 → 27 档**。
- **测试面登记**：T-DSK22 / T-DSK23 = `test/views-question.test.mjs`（输入区两向 + 满队）；T-DSK24 = 同档（两通道消费 + 三出口）；T-DSK23 队列写者 = `test/store.test.mjs` 原址补例；T-DSK25 = `test/views-tabbar.test.mjs`（点按两向 + 加速键——**断言换对象，不删断言**）；T-DSK26 = `test/views-tabbar-close.test.mjs`（四例）+ `test/views-locks.test.mjs`（关闭尾接线锚）；T-DSK3 注 = `test/views.test.mjs` 原址补例。

### 2.6 验收对照（逐条回指需求 · 机器可核）

| 判据（本档 §1.3） | 验收行（`docs/desktop/design/PROJECT.md` §7） | 机检面 |
|---|---|---|
| ② 输入槽在盘（DOM 槽 + handlers · Enter / Shift+Enter 两向） | T-DSK22 | `thincoder-desktop/test/views-question.test.mjs` |
| ③ question / task 有消费路径 + **可作答** | T-DSK24 | `test/views-question.test.mjs` |
| ④ 队列写者（busy 入队 + 满队提示） | T-DSK22 / T-DSK23 | `test/views-question.test.mjs` + `test/store.test.mjs` |
| ⑤ 改名 / 删除（控件 + 通道往返） | T-DSK3 注 | `test/views.test.mjs`（构树）+ `test/session-contract.test.mjs`（通道） |
| 走查 ⑤（标签点按 + 加速键） | T-DSK20 / T-DSK25 | `test/views-tabbar.test.mjs` |
| 走查 ⑥（关标签 ⇒ 页随动四例） | T-DSK26 | `test/views-tabbar-close.test.mjs` + `test/views-locks.test.mjs` |
| ① 全绿 · ⑥ 三端零回归 / doc-check 本批面零新增 / 各档 ≤300 | `thincoder-desktop/test/run.mjs` | 合计门 |

### 2.7 关键决策

三条决策已落 `docs/desktop/design/PROJECT.md` §2（**KD-14 / KD-15 / KD-16** · 含被否候选）：KD-14 = `question` 工具**同回合内真作答**（否：可视化路 / 保持同步返信号串 / 改核机制）· KD-15 = 收 Tab 序用 `tabindex="-1"`、**不用 `inert`**（否：保留 `inert` / 不收 Tab 序 / 两机制叠加）· KD-16 = 关闭尾**落接线面** `renderer/app.mjs`、**不进 store**（否：尾内联 `closeTab` / 帧出口派生页键 / 空键 `session:switch`）。理由面本节**不重述**（单源 = §2 · 机检面 = §2.4 ⑥）。

### 2.8 上抛项（父侧 / 需求侧处置）

- **U1 · scope call 请父侧确认**：⑥ 的自补出口「**删除会话 ⇒ 关标签 + 同尾**」（§2.4 ⑥ 第四点）。批档 §1.9 只点「关闭」路径，删除路径的页随动**同源未被点**；本端按同律补齐。**不确认 ⇒ 该项退为零动作**（删除后标签留在场 = 死标签）。
- **U2 · 池族口径差**：提问挂起项**不入池三族**（`docs/desktop/design/UI.md` §1 提问呈现行逐字）∥ 需求 **D4** 措辞——登记 = `docs/desktop/design/PROJECT.md` §10 **O** 行（设计面不改需求档 · 待父侧 / 需求侧裁）。
- **U3 · `ev:task` 非必现**：`thincoder-desktop/src/main/agent-bridge.mjs:72-75` 面外，`task` 工具在非工程模式停用（`thincoder-core/tools/task.mjs:64-66`）⇒ 计划面可能**恒不在场**——登记 = §10 **P** 行（用例面 = 事件驱动，非端到端必现）。
- **U4 · 未实装（本次实读核实）**：`thincoder-desktop/renderer` 全族 grep `session:rename` / `session:delete` / `data-action="session*"` **零命中**，`thincoder-desktop/renderer/app.mjs` 亦无 `session:delete` 接线 ⇒ ④ 的**左列改名 / 删除控件尚未实装**（本批实施面 · 与 §7 T-DSK3 注层别标注一致）。
- **报告项（非本批域 · 不动作）**：机检 `FAIL(锚)` 全 48 条落 `docs/core/**` 迁移期引文 · 越 300 非本端笔两条（`docs/E2E-TESTING.md:18` 356 字 · `docs/desktop/requirements/PROJECT.md:85` 444 字）· 建议收口时排空码面池（`fresh` 18 → 21）· 记录头 `:3` 双句号与 §1 状态行「进行中」/ 模板占位行未收（父侧笔）。

### 2.9 机检面收正（与 `docs/desktop/design/PROJECT.md` §7 批 A 注同源 · 以本块为准）

§2.5 / §2.6 的机检面行与设计档 §7 批 A 注**先前不一致**（三链缺陷 · 本端自查发现 ⇒ 面归属收正 · 设计档侧同轮已改）：

| 验收行 | 机检面（单源 = 设计档 §7 批 A 注） | 走查面（T-DSK21） |
|---|---|---|
| T-DSK22 / T-DSK23 | 队列三纯动作与两切片归约（`thincoder-desktop/test/store.test.mjs` / `events-reduce.test.mjs` 原址补例）+ **输入区构树与两态锚**（`thincoder-desktop/test/views-chrome.test.mjs` 原址补例——中区外壳面同档，新词键随入「全量词表键齐」） | 实键位（Enter / Shift+Enter 真事件）与 flush 时序 |
| T-DSK24 ① | `thincoder-desktop/test/agent-host.test.mjs`（`question:respond` 往返 + 三 reason 不 resolve）+ `thincoder-desktop/test/views-question.test.mjs`（卡构树与三出口锚） | 卡片真点按 |
| T-DSK24 ② | `thincoder-desktop/test/views-question.test.mjs`（`ev:task` 归约 + 卡构树 · 事件驱动） | — |
| T-DSK25 | `thincoder-desktop/test/views-tabbar.test.mjs`（两控件 `tabindex` 两态 + 接线两向 + 加速键**纯函数判定**） | 加速键真事件面与点按真视觉切换 |
| T-DSK26 | `thincoder-desktop/test/views-tabbar-close.test.mjs`（页随动四例）+ `thincoder-desktop/test/views-locks.test.mjs`（关闭尾接线锚） | — |
| T-DSK3 注 | `thincoder-desktop/test/views.test.mjs`（左列行控件构树 · 原址补例） | 左列控件真交互 |

两条口径：① 「输入区构树」的宿主档 = `thincoder-desktop/test/views-chrome.test.mjs`（中区外壳面 · 与「全量词表键齐」同处 ⇒ 新词键零另册）；② T-DSK25 原只登记走查面 ⇒ 补**加速键纯函数判定**机检（判据 = `Ctrl/Cmd+1..9` ⇒ 第 N 档 · 表外键零动作不吞键）。

### 2.10 U2 裁定落地（父侧 2026-09-26 · 点修两处）

**裁定（父侧）**：**徽标计入 + 保留「不入池三族」**；需求 D4 措辞不改（问题卡走流内 = 审批卡先例）。
（本档 §2.8 的 U2 登记行属记录面（append-only）不动；本块 = 裁定与落地追记。）

**依据（三条 · 同 O 行）**：① 池 = **本会话面** ⇒ 不添跨会话可见性；② 流内已有决策面 ⇒ 池行零增益；③ 需求档「不静默等待」的兑现面 = **跨会话可见面**（标签位徽标）⇒ 徽标计入。

**落形**：待作答 ⇒ 该会话位标含 `approval` 码（与审批门**同码同词**——闭枚举不加值；显示词 / 优先级单源 = `docs/desktop/design/UI.md` §2 项 2）· 出场（回执 `ok` 真）⇒ 清码（判据同卡退场）——连带：该态下关标签走确认面（`needsCloseConfirm` 判据自动在场）。

**落点（已写盘 · 两处）**：

| # | 档 | 行 | 改法 |
|---|---|---|---|
| 1 | `docs/desktop/design/UI.md` | :23（提问呈现行） | 删失效表述「本批唯一呈现面」（修订式表述——直删）→ 改写开头 = 决策面 + 不入池三族 + 跨会话可见面 = 标签位（落形余项逐字保留） |
| 2 | `docs/desktop/design/PROJECT.md` | :309（§10 O 行） | 类型列 → **已裁定（父侧 2026-09-26）**；处置列 = 裁定全文（D4 不改 · 兑现面 = 跨会话可见面 · 池三族不动 · 连带确认面 · 落形回指） |

**零改动面**：需求档零写（D4 措辞不改——`git diff` 前后 hunk 头一致，本轮未碰 `docs/desktop/requirements/PROJECT.md`）· `E2E-TESTING.md` 未触 · `docs/desktop/design/PROJECT.md` §10-O 以外行未触 · 池三族枚举不动。

**待父侧裁两项（面限 · 本端未落笔）**：① `docs/desktop/design/PROJECT.md:265`（T-DSK24 行）判据列未含徽标行为 ⇒ 提案：第三列补「待作答期 ⇒ 该会话位标含 `approval` 码；回执 `ok` 后清除」；② 两档**变更记录**行未落（`docs/desktop/design/PROJECT.md` 面限 = §10-O 以外禁动；`docs/desktop/design/UI.md` 面限 = 点修两处）⇒ 提案行随交付报告。

**机检面（实跑 · 本行落地后）**：`node scripts/doc-check.mjs`（workdir = thincoder）⇒ 两行**零列报**（`UI.md` 项无 :23；`docs/desktop/design/PROJECT.md` 项无 :309——:308 为既有报告面项）；全树 FAIL 均既有面（迁移期引文 / 未注解坐标），非本轮新增。

### 2.11 修正轮追记（设计评审 §3 十五条逐号点修 · 2026-09-26）

**总况**：§3 十五条（🔴 3 · 🟡 6 · 🔵 6）逐号点修**全数落盘**——设计五档改动 25 处 + 一致性收尾 14 处（拆行 ∕ 树 `│` 对齐 ∕ 「（拟新增）」补标——零语义）。下表行号 = 修正轮末实读；档名简称 = 设计五档（`docs/desktop/design/`：`PROJECT.md` / `RENDERER.md` / `SHELL.md` / `UI.md` / `IPC.md`）。

| 号 | 处置 | 落点（修正轮末实读） |
|---|------|------|
| 1 | 🔴 三测试档补登越层 + 点名拆分预案；越层计数「四面 ⇒ **八面**」同收 | `PROJECT.md:147`（八面）· `:149-150`（`test/agent-host.test.mjs` 297 ⇒ ~322 ∕ `test/views-chrome.test.mjs` 296 ⇒ ~321 ∕ `test/store.test.mjs` 279 ⇒ ~304——预案档逐一点名）· `:151`（八处消解窗口 = 各自下次被触碰的批） |
| 2 | 🔴 `app.mjs` **299 ⇒ ~330**（+关闭尾 ~5 · +行动作接线 ~25 · +两新档引调 ~4；> 300 ⇒ 并列拆分预案）+ 三组出口归属补载 | `PROJECT.md:114` · `:148`（预案 = `renderer/mount-sessions.mjs`（拟新增）） |
| 3 | 🔴 回合尾**三径**（`isTurnTail` 含 `ev:error`；错误径清本键 `running` + 位落 `done`） | `RENDERER.md:37` · `UI.md:20` · `PROJECT.md:115` · `:272` · `:288` |
| 4 | 🟡 flush **先发后出队**（`ok` 假 ∥ 抛 ⇒ 留队 + `console.error`）；直发失败 ⇒ 文本保留 + `console.error` | `UI.md:20` · `RENDERER.md:38` · `PROJECT.md:272` · `:273` · `:289` |
| 5 | 🟡 中断 × 提问门 ⇒ 按取消结算 ⇒ 终局 `stopped` ⇒ 事件面摘本键提问项 + 清码（判据 = 终局事件面，非回执） | `UI.md:23` · `RENDERER.md:54-55` · `PROJECT.md:274` · `:290` |
| 6 | 🟡 提问卡出口**点名列档** = `renderer/mount-cards.mjs`（`question:respond` 出站两向 + 回执 `ok` 真 ⇒ 清本键 `questions` 切片 + 清位标；计划卡零出口——纯呈现） | `PROJECT.md:137` · `:114` · `:174` · `RENDERER.md:22` |
| 7 | 🟡 表项形 `{ kind, shape?, key, resolve }`——`shape` = verdict 闭集 discriminator；码面随动 = `src/main/suspensions.mjs`:51 / `:60` / `:63` `kind` ⇒ `shape`（零行增减） | `PROJECT.md:99` · `SHELL.md:24-25` · `:98` |
| 8 | 🟡 原址**改例**（非补例）：三条 `inert` 断言 ⇒ 两控件 `tabindex` 两态 + 点按两向；死注释随动 | `PROJECT.md:178` · `:161` |
| 9 | 🟡 T-DSK26 两端对齐为**五例**（④ 待确认按取消 ⇒ 零动作 · ⑤ 已关会话迟到回执零写——判据 ∥ 机检面同列） | `PROJECT.md:276` · `:179` |
| 10 | 🔵 `digest` 面零落点 ⇒ §10 增 **S** 行（父侧 ∕ 需求侧收口——本批只登记） | `PROJECT.md:327` |
| 11 | 🔵 值收单一实读：`test/run.mjs` · `test/files.mjs` = **41 / 12 ⇒ 15**（口径 = 内容行数）+ 用例模块 **二十七档**计数同收 | `PROJECT.md:140` · `:141` |
| 12 | 🔵 注释面死项入本批面（`styles.css:184` 等——随 ⑤ 收正，零语义） | `PROJECT.md:111` · `:161` |
| 13 | 🔵 测试面换靶三面登记（`test/views-tabbar.test.mjs`：`:15` 导入源 ⇒ `views/tabbar.mjs` ∕ `:235` 零字形名单补 `tabbar.mjs` ∕ `:325-328` 关闭确认面四禁靶同换） | `PROJECT.md:161-162` |
| 14 | 🔵 加速键命中边界定形（**键 ∈ 1..9 ∧ 第 N 档存在** ⇒ 激活；第 N 档不存在 ∥ 表外键 ⇒ 零动作**不吞键**）——T-DSK25 ③ ∥ 机检面同判据 | `UI.md:17` · `RENDERER.md:42` · `PROJECT.md:275` · `:292` |
| 15 | 🔵 取消结算串 `(user cancelled)` 单源 = `src/main/suspensions.mjs`；回执 `answer: null` ∥ 工具结果串两域分离 | `IPC.md:59` · `UI.md:23` |

**「新档六」⇒「新档七」收正**：批 A 新档 = `renderer/views/{tabbar,question,plan}.mjs` · `renderer/mount-composer.mjs` · `renderer/mount-cards.mjs`（#6 补立）· `test/{views-question,views-tabbar-close}.test.mjs`——七档（单源 = `docs/desktop/design/PROJECT.md`:137 / `:174`；本节既有「六」两处（`:104` / `:130`）为记录面旧笔，不回改）。

**闸读数（修正轮末复跑 · `node scripts/doc-check.mjs`）**：本批设计五档 = **锚 0 悬空 · 行宽 0 超限**；全树 FAIL = **悬空 34 + 行宽 19**，逐条落 `docs/core/**` / `docs/vsc/**`（他人既有债——列报 · 不动作）；桌面侧入闸行全属「拟新增——列报 · 不入闸」类；批档本体不在闸面（manifest 排除）。

**工具面观察（`scripts/**` 域 · 非本批设计面——登记 · 上报不动作）**：① 坐标豁免射程 = `scripts/doc-check-anchors.mjs`:114-121（`pointerRanges`）经 `:251-252`（`free()`）消费——豁免以**行级标记**为前提（`marked &&`），射程体 = 冒号前字面（`file:123` 形覆盖「file」四字 ∕ 裸 `:N` 形零宽）⇒ 豁免粒度 = 行 × 射程，非锚本体；② `DEF_PREDICATES`（`:36`）含「导出」等 13 词——行内含谓词 + 恰一坐标宿主 ⇒ 该行标识符按带宿主收编（`:149-151`），措辞即可改变符号面判定；③ 路径判含「唯一 basename」容忍（`:166-173`——域内 ∕ 仓根 basename 唯一 ⇒ 判已解析）⇒ 前缀错误型真悬空可不报（假阴性通道）。

**未决项**：无（15/15）；修正轮零新语义（全部改动 = §3 十五条 ∥ §2.10 U2 裁定之直接派生）。复评对象 = 设计五档（逐号落点见上表 ∥ 各档变更记录）。

### 2.12 二轮点修追记（设计评审 §3 轮次 2 发现 2–6 逐号点修 · 2026-09-26）

**总况**：§3 轮次 2 六条（🔴 0 · 🟡 4 · 🔵 2）——**设计笔面五条（2–6）逐号落盘**，改动 26 处（含行宽重排 3 处 ∕ D3 计数收正）；发现 1（需求档两条「逐字」实证引文随设计改写悬空）落 `docs/desktop/requirements/PROJECT.md:80` / `:87` 笔面 ⇒ **上抛父侧**（设计侧零触碰）。**零新语义**（全部改动 = §3 轮次 2 发现 ∥ §2.10 U2 裁定之直接派生）。下表行号 = 本轮末实读。

| 号 | 处置 | 落点（本轮末实读） |
|---|------|------|
| 2 | 🟡 `ev:error` 收**单义** = 宿主回合结算（错误径）——删旧「工具错误 / 回合错误」双支读法（工具级错误不经本通道，与同行后句同读）；对话流行去「双支」指引 | `IPC.md:21` · `UI.md:19` |
| 3 | 🟡 flush **取文本面**点名（载荷 `text` = 条目 `title` 逐字原样）+ 失败三码（`busy` / `bad-key` / `provider-invalid`）∥ 抛 ⇒ 留队 + `console.error` + 可见失败面 + 重触发 = 下一回合尾；`busy` 同键序不可达（佐证 `src/main/agent-host.mjs:170-181`） | `UI.md:20` |
| 4 | 🟡 §4.1 补「现值 ⇒ 预期值」（评审点名六档 + `ipc.mjs` 余量括注按批后重算）：`ipc.mjs` 184 ⇒ ~190 · `agent-bridge.mjs` 79 ⇒ ~85 · `preload.cjs` 56 ⇒ 57 · `index.html` 45 ⇒ ~46 · `store.mjs` 259 ⇒ ~300（> 300 ⇒ 预案 = 队列面拆 `renderer/queue.mjs`（拟新增））· `views.test.mjs` 201 ⇒ ~215 · `events-reduce.test.mjs` 162 ⇒ ~190 | `PROJECT.md:96` · `:98` · `:109` · `:110` · `:120` · `:141` |
| 5 | 🔵 `isTurnTail` 判据入参形点名（吃**两通道形**：`ev:activity`〔无 `fields`〕∧ `done` / `stopped` ∥ `ev:error` 单形 `{ key, message }`） | `RENDERER.md:37-38` · `PROJECT.md:115` |
| 6 | 🔵 提问待作答位标 `approval` **置位面**点名（归约面 `events.mjs` `onQuestion`〔与 `onApproval` 同形〕）+ 清位面两面（`mount-cards.mjs` 回执 `ok` ∥ 事件面 `stopped`） | `UI.md:23` · `PROJECT.md:115` |

**D3 计数收正（发现 4 连带）**：越层预算贴「八面 ⇒ **九面**」（`PROJECT.md:147`——新增 `store.mjs`）· 消解窗口「八处 ⇒ **九处**」（`:152`）；「另五档」列举 = `agent-bridge.mjs` / `preload.cjs` / `index.html` / `views.test.mjs` / `events-reduce.test.mjs`（5 条路径 ✓）。

**行宽重排（零语义）**：`PROJECT.md:147-148`（192 / 187）· `:433-434`（261 / 178）· `RENDERER.md:37-38`（251 / 292）。

**变更记录行**：`PROJECT.md:435` · `RENDERER.md:127` · `UI.md:97` · `IPC.md:184`。

**闸读数（本轮末复跑 · `node scripts/doc-check.mjs`）**：候选 26591 —— **桌面设计五档入闸 FAIL = 0**（桌面 ✗ 行全属「拟新增——列报 · 不入闸」豁免类 + 报告面）；**行宽桌面 = 0**（全树 19 条超 300 逐条落 `docs/core/**` / `docs/vsc/**`——他人既有债 · 列报不动作）；全树悬空 34 条（`docs/core/**` 33 + `docs/vsc/**` 1——同上，桌面侧零）。批档本体不在闸面（manifest 排除）。

**未决项**：无（设计笔面 5/5 落盘）；发现 1 待父侧在需求档处置（引文改指现行落点 ∥ 标注历史引文）。复评对象 = 设计五档（逐号落点见上表 ∥ 各档变更记录）。

### 2.13 收口轮追记（实施后随动收正 · 2026-09-27）

**总况**：批 A 实施后**对账 + 随动收正**——笔面 = 设计五档全触（`docs/desktop/design/`：`PROJECT.md` / `RENDERER.md` / `SHELL.md` / `UI.md` / `IPC.md`，含 `IPC.md` / `UI.md` 两档——同源差收正，非仅树面 / 索引面）：行数账按盘全量回填 · 越 300 段重写 · KD-16 宿主收正 · §10 增 **T–X** 五行 · 树面 / 索引面随动 · 机检收项（六条超宽行拆分 + 两处「（拟新增）」补标——零语义）。**零新语义**（全部改动 = 实施落形 ∥ 对账差之直接派生）。行号 = 收口轮末实读。

**① 行数账按盘全量回填**（`PROJECT.md` §4.1 · 实读 2026-09-27）：§5 披露差三档收正 = `renderer/app.mjs` **222** · `renderer/i18n.mjs` **317** · `test/views-chrome.test.mjs` **392**（§5.5 #3 漂移表同源）· `src/main/agent-bridge.mjs` **79 ⇒ 77**（§5 表列按盘收正）·
新行两处 = `renderer/mount-sessions.mjs` **197**（`:118`）· `renderer/views/settings-sections.mjs` **206**（`:132`——本批补登）· 用例模块 **二十八档**（值列全换——`test/files.mjs` 清单 **15** 行 ∥ `test/run.mjs` **41** 行；集成域行 **137**）·
存量 `~` 值九行（`electron-builder.yml` / `.gitignore` / `main.mjs` / `window.mjs` / `protocol.mjs` / `session-slots.mjs` / `sessions.mjs` / `projects.mjs` / `check-dist.mjs`）**只报不追平**（§10 **T** 行）。

**② 越 300 段重写**（`PROJECT.md`:148-157）：在册例外一（`renderer/mount-settings.mjs` **458**——距 500 硬限 42 行）+ 批 A 实读越层八档 = **九档**：`renderer/styles.css` **340** · `renderer/events.mjs` **338** · `renderer/i18n.mjs` **317** · `renderer/store.mjs` **310** · `test/views-chrome.test.mjs` **392** · `test/views-question.test.mjs` **359** · `test/store.test.mjs` **333** · `test/views-tabbar-close.test.mjs` **317**——各带拆分预案 + 消解窗口（窗口 = 各自下次被触碰的批）；
预案点名四件 = `renderer/questions.mjs` · `renderer/queue.mjs` · `test/store-queue.test.mjs` · `renderer/mount-onboarding.mjs`（皆带「（拟新增）」标），余者「档名实施批定」；贴 300 层 = `renderer/views/chat.mjs` **289**（预案 = 卡构树拆出）；分档理由括注中的 `styles.css` **284** = 分档时点读数（as-of——现值 **340** 见本行）。

**③ KD-16 宿主收正**（`PROJECT.md`:53）：关闭尾落**接线面** `renderer/mount-sessions.mjs`（`closeTail(before)`——三调用点 `:133` / `:140` / `:192`）；KD-16 旧「住 `app.mjs`」口径随会话族拆档收正。

**④ §10 增 T–X 五行**（`PROJECT.md`:332-336）：T = 行数账回填（登记）· U = 拆档产物四件（`views/tabbar.mjs` 200 / `mount-sessions.mjs` 197 / `agent-host-question.test.mjs` 116 / `views-tabbar-close.test.mjs` 317）· V = `railForm` 无外部消解窗口 · W = 行形态两件（改名出口用例缺口）· X = 输入面两件（IME 组字保护实施未落 / 附件面）。

**⑤ 树面 / 索引面随动**：`SHELL.md` §1 树 = 会话族拆出档行入册 + `events-subscribe.mjs` 行补第 4 键 `onTurnTail` + 三处去「（拟新增）」+ `views/` 行补 `settings-sections.mjs`（登记）+ `test/` 行 **二十七 ⇒ 二十八档**（名单补 `agent-host-question`）；
`RENDERER.md` §1 / §1.1 = 索引去「（拟新增）」四处 + `attachEvents` 补第 4 键 + 页生命周期**开页路宿主收正**（`mount-sessions.mjs:63` / `:100` / `:109`——响应表 1）；
`IPC.md` §1 / §2 = 会话键面宿主同源收正 + 切片键补 `questions` / `tasks` + 载荷段「本批」⇒「批 A」四处 + `msg:send` 行去「（拟新增）」+ `approval:respond` 行补回执 reason 四档（`bad-verdict` 入册）；
`UI.md` §1 = IME 组字规则入册（`isComposing`——实施待安排）+ 三处「本批」⇒「批 A」+ 提问呈现行码位两面收正 + 左列会话行行形态收正（删除形保留行控件 / 改名形撤行控件）。

**⑥ 机检收项（零语义）**：六条超宽行拆分 = `PROJECT.md`:159（1 ⇒ 2 行）· `SHELL.md`:47 / `:150` · `IPC.md`:44 / `:186` · `UI.md`:98（1 ⇒ 3 行）；两处「（拟新增）」补标 = `PROJECT.md`:121（`renderer/queue.mjs`）· `:148`（`renderer/mount-onboarding.mjs`）。

**变更记录行**：`PROJECT.md`:445-446 · `RENDERER.md`:128 · `SHELL.md`:150-151 · `IPC.md`:186-187 · `UI.md`:98-100。

**入闸读数（收口轮末复跑 · `node scripts/doc-check.mjs`）**：全树 **悬空 50 ⇒ 48 · 行宽 24 ⇒ 18**；桌面设计面 **入闸 FAIL = 0**（桌面 ✗ 行全属「拟新增——列报 · 不入闸」豁免类）+ **行宽 = 0**（含 `E2E-TESTING.md` 逐行扫）；余数逐条落 `docs/core/**` / `docs/vsc/**`（他人既有债——列报 · 不动作）；批档本体不在闸面（manifest 排除）。

**未决项**：无（对账面全数落盘）；零新语义。复评对象 = 设计五档。

### 2.14 收口尾轮追记（只报不写清单落地 · 2026-09-27）

**总况**：A-1a 舱（IME 组字门）§5「只报不写清单」五项逐条落地（#1∥#5 → ① · #2 → ② · #3 → ③ · #4 → ④；⑤ = 两档变更记录行）；笔面 = 设计两档（`UI.md` · `PROJECT.md`）+ 两档变更记录行。**零新语义**（全部改动 = 实施落形 ∥ 计数回填之直接派生）。行号 = 尾轮末实读。

**① 交互行**（`UI.md`:17）：删「**实施未落**——登记 open 行」陈旧标记 + 补 229 兜底臂点名（`isComposing` 真 ∥ `keyCode === 229`——老 WebView 兜底臂；父侧裁定入设计行——加法臂已落盘 · 语义同族；判据单源 = `renderer/mount-composer.mjs:41-43`；两臂同径；§2.13 ⑤「实施待安排」随本轮结清）。

**② open 行**（`UI.md`:35）：摘 **IME 组字保护**条（原「`isComposing` 实施未落——见「交互」行」——实施已落 ⇒ 条目消）。

**③ 行数账回填（清单 #3）**（`PROJECT.md` §4.1）：`renderer/mount-composer.mjs` **251 ⇒ 262**（`:138`）。

**④ 行数账回填 + 拆分点登记（清单 #4）**：`test/views-chrome.test.mjs` **392 ⇒ 437**（`:143` 值列 / `:152` 越 300 段 / `:157` 300 层段——三处同源）；越 300 段补拆分点条件「新档须动 `test/files.mjs` / `test/run.mjs`——只登记、不建新档」（消解窗口 = 表内共享行「各自下次被触碰的批」不变）。

**⑤ 变更记录行**：`PROJECT.md`:447-449 · `UI.md`:101-102。

**另**：§10 **T** 行（`PROJECT.md`:332）**392** = 当轮回填记录值（记录面）——留档不追改；§4.1 用例模块行值列（`:143`）居清单外，已同源回填（见④）。

**入闸读数（尾轮末复跑 · `node scripts/doc-check.mjs`）**：全树 **悬空 48 · 行宽 18**（与收口轮末持平——delta 0）；桌面设计面 **入闸 FAIL = 0** + **行宽 = 0**；余数逐条落 `docs/core/**` / `docs/vsc/**`（他人既有债——列报 · 不动作）；批档本体不在闸面（manifest 排除）。

**未决项**：无（设计笔面 5/5 落盘）；零新语义。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

## 设计评审（批 A「能对话」六件 · 设计态）——发现表

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Affected-file size | 🔴 | `thincoder-desktop/test/agent-host.test.mjs`（§4.1 值列 **297**）· `thincoder-desktop/test/views-chrome.test.mjs`（**296**）· `thincoder-desktop/test/store.test.mjs`（**279**）三档在本批**原址补例**（`docs/desktop/design/PROJECT.md:278-279`：`question:respond` 往返 + 三 reason ／ 输入区构树两态锚 + 词键 ／ 队列三纯动作）⇒ 三档皆越 300 层；而「批 A 预算贴 / 越 300 层**四面**」（`:144`）只列 events / i18n / views-sessions / views-chat 四档，此三档无拆分预案 | 三档补登越层项与拆分预案（或把补例改落新档 / 拆档），并同步 `:144` 的「四面」计数 |
| 2 | Affected-file size / Clarity | 🔴 | `thincoder-desktop/renderer/app.mjs` 行（`:113`）记现态 **299** ⇒ 「本档落回 **~255**」（变更记录 `:404`「`~250 ⇒ ~255`」）；但该行所列本批变更只有「输入区接线拆出 `mount-composer.mjs`（拟新增）」+「关闭尾 ~5 行」——新档抽出不减 app.mjs 行（同形先例：批 9 抽出 458 行的 `mount-settings.mjs` 后 app.mjs 由 297 → 299，`:368` / `:380`），无一处减行 ~44 ⇒ 落点数字不可由所列变更推出；按所列变更 app.mjs 落 ~304（>300）而该档无拆分预案（`:144` 四面未含）。另该行未载本批必在接线面新增的三组出口（行内改名 / 删除两通道的 invoke + 刷新 + 删除后 `closeTab`；提问 / 计划卡出口） | 收正落点值（写明减行来源或改记 ~304）· 越 300 即补拆分预案 · 补载三组出口的归属档与行数 |
| 3 | Acceptance criteria | 🔴 | 错误终局未入队列 flush 集，且 `running` 位标在错误径不清 ⇒ 本批输入面在任一回合错误后**永久判忙**：`docs/desktop/design/UI.md:20` 忙态判据 = 「本会话位标含 `running`」· flush 集 = 「唯一回合尾（`done` / `stopped`）」；实证 = `thincoder-desktop/renderer/events.mjs:158-161` / `:174-177` 只在 done / stopped 清 `running`，而错误径只发 `ev:error`（`thincoder-desktop/src/main/agent-host.mjs:177-179`）⇒ 位标常亮 ⇒ 后续 Enter 全入队、队永不出（T-DSK22 / T-DSK23 无此径） | 定形错误终局（`ev:error`）的位标与 flush 处置（错误径清 `running` ∥ 纳入 flush 集）· 该径写入 T-DSK22 与机检面 |
| 4 | Error conditions | 🟡 | 输入区两失败径无处置：① flush「队首发 `msg:send` 并出队」（`UI.md:20`）——`msg:send` 可回 `{ok:false, reason}`（`busy` / `provider-invalid` / `bad-key`，`docs/desktop/design/IPC.md:57`）⇒ 先出队后失败即**静默丢条**（与本仓「零静默」纪律相冲）② 正常 Enter 径失败亦无处置（文本保留 / 入队 / 错误面皆未定） | 出站前收回执再出队（失败 ⇒ 留队 + 明示）· 两径写入 T-DSK22 / T-DSK23 判据 |
| 5 | Acceptance criteria | 🟡 | 提问卡退场只有「回执 `ok` 真」一条判据（`UI.md:23`），与中断径冲突：`msg:interrupt` ⇒ `denyGates(key)`（`thincoder-desktop/src/main/suspensions.mjs:47-53`）按拒结算本键**全部**待决门（表项已删）⇒ 卡无摘除路、再作答落 `unknown-prompt`（「卡留可重试」⇒ 死卡） | 定形 abort × 提问门（门结算 ⇒ 事件面摘卡 ∥ 中断径不结算提问门）· 补该径判据 / 用例 |
| 6 | Clarity | 🟡 | 提问卡三出口的**接线落点无点名**：`thincoder-desktop/renderer/views/question.mjs` 零 `store.mjs` import、出口经注入句柄（`PROJECT.md:132` · `UI.md:23`），但 §4.1 无任何档声明承载 `question:respond` 出站 + 清 `questions` 切片 + 清位标（对照先例 = 审批出口 `respondApproval` 住 `views/approval.mjs`、接线住 `mount-pool.mjs`）；同类 = ④ 改名 / 删除两通道的 invoke + 刷新 + 删除后关闭尾亦无点名落点 | 在 §4.1 点名承载档（新档 ∥ 既有 mount-* / app.mjs）并登记其行数与随动面 |
| 7 | Clarity | 🟡 | 待决表形状与现表契约相抵：三处记「`kind` 两值（`approval` / `question`）」（`PROJECT.md:98` · `SHELL.md:24` · `:94`），而现表以 `kind` 区分单 / 批门并据以选 verdict 闭集（`thincoder-desktop/src/main/suspensions.mjs:60`：`entry.kind === "single" ? ITEM_VERDICTS : BATCH_VERDICTS`）；同档 `:95` 仍保两套 verdict 闭集 ⇒ 判据面失锚 | 补名 discriminator（独立 `shape` 字段 ∥ kind 三值）· 三处措辞与表项形状同收 |
| 8 | Clarity（测试面） | 🟡 | ⑤ 换机制后既有断言必红而未登记：`inert` 落形改 `tabindex="-1"`（`UI.md:15` · `PROJECT.md:52` KD-15），但 `thincoder-desktop/test/views-tabbar.test.mjs:158-159` / `:286` 仍断言 `props.inert === true`（源 = `thincoder-desktop/renderer/views/sessions.mjs:242`），设计只记「原址**补例**」（`PROJECT.md:170`） | 记明原址**改例**（三条 `inert` 断言换成两控件 `tabindex` 两态）· 并同步该档档头注释 |
| 9 | Acceptance criteria | 🟡 | T-DSK26 判据与机检面第四例不一致：判据 ④ = 待确认态按取消 ⇒ 零动作（`PROJECT.md:267`），机检面第四例 = 已关会话迟到回执零写（`:170`）⇒ 判据 ④ 无机检面、机检面有判据外用例 | 两端对齐（补 ④ 的机检例 ∥ 把迟到回执例写进判据） |
| 10 | Requirements | 🔵 | 需求 D4「挂起态与 digest」（`docs/desktop/requirements/PROJECT.md:112`）中「digest」在受审六档零落点（全档搜索仅需求档一处命中）；本批既借 §10 O 裁定 D4 口径（挂起态 = 流内卡 + 标签位），「digest」是否同批收口未记 | 一并裁定「digest」的呈现面（或登记为另批议题），免读者当活工单 |
| 11 | Doc hygiene（数值） | 🔵 | 数值漂移：§4.1 记 `thincoder-desktop/test/run.mjs` · `files.mjs` = **41 / 14**（`PROJECT.md:138`），盘上实读 `thincoder-desktop/test/files.mjs` **12** 行（现值 25 档），批 A 两条变更记录又分别记 `12 → 13`（`:397`）与 `13 → 14`（`:402`） | 收为单一实读值，并统一「现值 ∥ 落点」记法 |
| 12 | Doc hygiene（注释面） | 🔵 | 失效机制残留：`thincoder-desktop/renderer/styles.css:184`（「非活动标签 `inert`（不收 Tab 序 / 不响应焦点）」）· `thincoder-desktop/renderer/views/sessions.mjs:18` / `:237` · `thincoder-desktop/test/views-tabbar.test.mjs:6`（档头）——⑤ 改 `tabindex` 后皆成死项；`styles.css` 亦未列本批受影响面 | 随 ⑤ 一并收正注释（或登记为码面池随动面） |
| 13 | Clarity | 🔵 | 测试面硬编码路径未随拆档登记：`thincoder-desktop/test/views-tabbar.test.mjs:325-328` 扫描 `../renderer/views/sessions.mjs`（关闭确认面四禁）；标签条面（含关闭确认面）拆 `views/tabbar.mjs` 后该扫描换靶未记（§4.1 随动面 `:154` 只点名 U51 / U52 两面） | 换靶登记（扫描面随拆档指向 `views/tabbar.mjs`） |
| 14 | Clarity | 🔵 | 加速键边界未定：`Ctrl/Cmd+1..9` 覆盖 1–9（`UI.md:15` · open 行 `:35`），但「第 N 档不存在」时的行为（零动作 ∥ 是否 `preventDefault`）未定，T-DSK25 ③ 亦未覆盖 | 定形（不存在 ⇒ 零动作且不吞键）并写入 T-DSK25 判据 |
| 15 | Clarity | 🔵 | 取消作答的结算串无单源：`IPC.md:59` 记「挂起表以取消串结算」而回执 `answer: null`；该串即 `question` 工具返给模型的结果串（核要求非 `undefined`——`thincoder-core/agent/dispatch.mjs:419`），其取值未点名 | 点名取消结算串（单源），消两域（回执 `null` ∥ 工具结果串）歧义 |

**计数**：🔴 **3** · 🟡 **6** · 🔵 **6** —— 合计 **15**。
**核验面**：行数标注抽查（app.mjs 299 ✓ · events.mjs 295 ✓ · ipc.mjs 184 ✓ · i18n.mjs 293 ✓ · views/sessions.mjs 292 ✓ · store.mjs 259 ✓ · test/agent-host.test.mjs 297 ✓ · test/views-chrome.test.mjs 296 ✓ · test/store.test.mjs 279 ✓ · test/views-tabbar.test.mjs 329 ✓ · test/run.mjs 41 ✓ · test/files.mjs 12 ✗〔记 14〕）；可行性抽查（核 `question` 工具直返 `ctx.onQuestion`——`thincoder-core/tools/question.mjs:24`；`await item.tool.execute`——`thincoder-core/agent/dispatch.mjs:411` ⇒ 桥改异步返 Promise 可挂回合，KD-14 成立 ✓）。
**未审**（射程外）：批 C · 批 B · 斜杠命令族 · 全仓 doc-check 存量红（#435）。

VERDICT: changes-required

### 轮次 2（评审子代理）

## 设计评审（批 A「能对话」· **二轮** · 逐号核 §2.11 十五条修正 · 设计态）——发现表

**修正核验**：§3 一轮十五条（🔴3 · 🟡6 · 🔵6）逐号抽查 §2.11 落点，**15/15 在盘**（1 → `PROJECT.md:147`／`:149-150`／`:151` 八面 ⟂ 三测试档点名预案；2 → `:114` 299 ⇒ ~330 + 换算式 + 三组出口 + 预案 `mount-sessions.mjs`；3 → `RENDERER.md:37`／`UI.md:20`／`PROJECT.md:115`／`:272`／`:288` 三径含 `ev:error`；4 → `UI.md:20`／`RENDERER.md:38` 先发后出队 + 文本保留；5 → `UI.md:23`／`RENDERER.md:54-55`／`PROJECT.md:274`／`:290` 中断径摘项；6 → `PROJECT.md:137`／`RENDERER.md:22` 卡族出站档 `mount-cards.mjs`；7 → `PROJECT.md:99`／`SHELL.md:25`／`:98` 表项 `{ kind, shape?, key, resolve }`；8 → `PROJECT.md:178`／`:161` 原址改例；9 → `:276`／`:179` T-DSK26 五例两端对齐；10 → `:327` S 行；11 → `:140` `41 / 12 ⇒ 15` + `:141` 二十七档；12 → `:111`／`:161`；13 → `:161-162` 换靶三面；14 → `UI.md:17`／`RENDERER.md:42`／`PROJECT.md:275`／`:292` 命中判据；15 → `IPC.md:59`／`UI.md:23` 取消结算串两域分离）。
**盘上抽查**（实读）：`renderer/app.mjs` = **299** ✓（关闭三出口只写 store 纯动作 ⟂ 无页随动 ⇒ ⑥ 落点成立）· `test/files.mjs` = **12 行 / 25 条** ✓（+2 +1 = 15 算式自洽）· `src/main/suspensions.mjs:51` / `:60` / `:63` 确为 `entry.kind` 使用点 ✓（#7 码面随动坐标实锚）· `renderer/views/activity.mjs:119-125` 队列条目只消费 `title` / `status` ✓ · 位标码实为 `approval` / `running` / `done` / `idle`（`renderer/store.mjs:152-156`）⇒ §2.10「同码同词」成立 ✓ · `views-tabbar.test.mjs:158-159` / `:286` `inert` 断言 + 四处 `inert` 死注释（`styles.css:184` · `views/sessions.mjs:18` / `:237` · `views-tabbar.test.mjs:6`）✓。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity（跨档引文） | 🟡 | 需求档两条「逐字」实证坐标随批 A 设计改写而失效：`docs/desktop/requirements/PROJECT.md:80` 引 `docs/desktop/design/IPC.md:55` 逐字「UI 输入区与中断键随视图批（登记 = `docs/desktop/design/PROJECT.md` §10）」——`IPC.md:55` 现为 `session:resume` 行，该句已收正为 `IPC.md:57` 的「批 A 落」，且 §10 该登记行已删（`PROJECT.md:415`）；`requirements/PROJECT.md:87` 引 `IPC.md:36` 逐字「作答通道未落 · 不阻塞回合」——`IPC.md:36` 现为 `ev:question` 载荷行，该措辞全档零命中（仅存记录面 `IPC.md:168`）⇒ 两处实证悬空 | 两处实证改指现行落点（或标注为历史引文），使引文与坐标同在盘上可核 |
| 2 | Clarity（判据单源） | 🟡 | `ev:error` 语义口径未收单义，而修正 #3 已把它升为回合尾判据（`docs/desktop/design/RENDERER.md:37` 三径同判据 · 谓词 `isTurnTail` 含 `ev:error`；`docs/desktop/design/UI.md:20` 错误径清 `running` + 位落 `done`）：`IPC.md:21` 语义列仍写「错误卡（工具错误 / 回合错误）」，同行后句又写「工具级错误 = 工具块 `status=\"error\"`（不经本通道）」，`UI.md:19` 则作「错误卡 = 回合级错误块」⇒ 若按语义列读（工具错误亦经本通道），中途到达的 `ev:error` 会被判回合尾（误清位标 / 误 flush） | 收正 `IPC.md:21` 语义列使 `ev:error` = 宿主回合结算单义；连带 `UI.md:19`「双支」指引与新判据同读一套口径 |
| 3 | Clarity | 🟡 | 队首 flush 的**取文本面**未点名：条目形单源 = 池面队列消费集（`UI.md:20` 条目 `{ title, status: \"queued\" }`；实读 `renderer/views/activity.mjs:119-125` 只消费 `title` / `status`），出队经 `msg:send { key, text }`（`IPC.md:57`）⇒ `text` = 条目 `title`（原文原样 ∥ 显示串截断）∥ 另携字段，未定；另 flush 回执 `busy`（单驱动器在飞拒——`IPC.md:57`）落「留队 + `console.error`」后无重触发径（`UI.md:20` 余者待下一回合尾）——驱动器释放与回合尾事件先后次序设计面未定（**unverified**：住主侧实现，本轮未实读） | 点名条目承载字段（原文 ∥ 显示串与载荷串分离）并写入 T-DSK22；补 flush 失败（`busy` ∥ `ok:false` ∥ 抛）后的重触发或可见失败面 |
| 4 | Affected-file size | 🟡 | §4.1 多档本批改动无增量标注（判据 = 现值 + 期望增量）：`renderer/index.html`（45）· `renderer/store.mjs`（259——队列三纯动作 + 两切片 + `QUEUE_MAX` + `railForm` 皆无预算，距 300 最近而批后值未给）· `src/main/agent-bridge.mjs`（79）· `src/preload/preload.cjs`（56）· `test/views.test.mjs`（201）· `test/events-reduce.test.mjs`（162）；`test/views-locks.test.mjs` 记「值列实施后回填」（延后）。另 `PROJECT.md:96` `ipc.mjs` 行值 **184** 而括注「**批 A 扩面后**余量 **16 行**」——16 = 184 距 200 的现值余量，本批增处理体后不可能同值（除非增量恰 0） | 改动档补 `现值 ⇒ 预期值 ∥ 结构不变`（至少近 300 者：`store.mjs`）；`ipc.mjs` 括注标明余量属现值 ∥ 按本批增量重算；跨 300 即补拆分预案 |
| 5 | Clarity | 🔵 | 修正 #3 点名的判据单源 `isTurnTail` 未给 `ev:error` 入判据的形：现谓词按 `ev:activity` 形定义（`renderer/events.mjs:154-158`：`fields` 键不在场 ∧ `event ∈ {done, stopped}`），而 `ev:error` 载荷 = `{ key, message }`（`IPC.md:40`，无 `event` / `fields`）⇒ 「判据含 `ev:error`」（`PROJECT.md:115`）的落形须点名 | 点名判据入参形（谓词吃两通道形 ∥ 错误径在同判据下显式分派），使「三径同判据」可机检 |
| 6 | Clarity | 🔵 | 提问待作答态的位标 `approval` **码置位面**未点名（清 = `mount-cards.mjs`——`PROJECT.md:137`；`UI.md:23` 只写「待作答 ⇒ 位标含 `approval` 码 · 出场 ⇒ 清码」）；同面既有已知缺口 = 位标置 / 清键源不同源（`renderer/events.mjs:141-142` / `:285`） | 点名置位面（归约面按同码闭集置位 ∥ 派生面自 `questions` 切片派生），与清位面同列 |

**计数**：🔴 **0** · 🟡 **4** · 🔵 **2** —— 合计 **6**（一轮十五条全数落盘，零残留 🔴；本轮新发现均属修正面边缘的口径残留）。
**未审**（射程外）：批 C（E2E 基建）· 批 B 四项 · 斜杠命令族 · 全仓 doc-check 存量红（#435）。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准（主 agent 代记 ✓）

- **时点** ✓：用户 **2026-09-27 01:19** 一句「**批**」——**双批同批**（批 A + 批 C ✓）。
- **依据（三条件齐备 ✓）**：① **评审通过**（二轮 · 🔴 0 · 🟡4 / 🔵2 ✓）；② **修正轮落定并逐条核验**（#38 落 #2–#6 ✓；**#1 由父侧当场落定** ✓——需求档两处悬空引文改指现行锚 ✓）；③ **token 已签发** ✓。
- **发现处置收敛** ✓（§3 轮次 2 的 6 条）：#1 **Fixed**（父侧 ✓）· #2–#6 **Fixed**（#38 ✓·落点见 §2 修正块与各档变更记录 ✓）——**无 Dispatched 残留、无未披露 🔴** ✓。
- **实施分工** ✓（父侧派单 · 按「一舱一单面」纪律分三舱）：
  - **A-1「输入区 + 队列」** ✓（判据 §1.3 ② ④ · 用例 T-DSK22 / T-DSK23 ✓）；
  - **A-2「提问 / 计划卡 + 真作答」** ✓（判据 §1.3 ③ · T-DSK24 ✓·含主侧两档）；
  - **A-3「会话族：标签条拆分 + 关页随动 + 改名 / 删除」** ✓（判据 §1.3 ⑤ ⑥ ① · T-DSK20 / T-DSK25 / T-DSK26 / T-DSK3 注 ✓）；
  - 三舱声明 `files` ⇒ 共用档（`renderer/app.mjs` / `store.mjs` / `events.mjs` / `i18n.mjs` / `test/files.mjs`）由**调度器串行** ✓。
- **派单期裁定（父侧 ✓）**：**#436（队列非空且非忙时 Enter 直发不冲队首）不入本批** ✗——按设计原样实施（Enter 直发 ✓ · 失败留队 ✓），该边缘行为另案 ✓。

## §5 实施记录（eng-coder）
**状态行**：实施完成（审计 CLEAN/DIVERGENT 均零代码级 · 评审轮 A-2b 4 + A-3b 1 + A-2a-1 1 + A-2a-2 3 + A-2a-3 2（全 pass）+ IME 舱 0（派单明禁点评审 ⊕ 内部审计 CLEAN）· fix 2 轮（A-1a）+ 1 轮（A-2a-2）+ 1 轮（A-2a-3）+ 1 轮（IME 舱 · 审计后口径收正）+ 0（其余舱）· 各舱终态 clean · 套件 129/129 ⇒ 133/133（A-2a-3 +U122–U125）⇒ 134/134（IME 舱 +U126）· 含 A-2a-1 / A-2a-2 / A-3b / A-2a-3 / A-1a 补记（IME 组字门）收口 · 2026-09-27）



### 5.1 舱 A-2b 实施记录（eng-coder · 真作答面：主侧 + 通道）

**舱面** = §2.4 ② 的主侧 + 通道半（渲染半 = 舱 A-2a，本舱不触渲染档）。设计单源 = `docs/desktop/design/PROJECT.md`:275 T-DSK24 · `docs/desktop/design/IPC.md` §1 `ev:question` 行 / §2 `question:respond` 行与白名单末位 · `docs/desktop/design/SHELL.md` §4 项 5。

**落盘面**（五源 + 六测 · 行数 = 内容行数口径）

| 档 | 变更 | 行数 |
|---|---|---|
| `src/main/suspensions.mjs` | 加密 `askQuestion`（提问门 `kind:"question"` · **无 `shape` 键**）· `QUESTION_CANCELLED = "(user cancelled)"` 单源导出 · `respond` 按门 kind 分派（四档判红**皆不 resolve**）· `denyGates` 提问门按取消串结算 | 113 |
| `src/main/agent-bridge.mjs` | `createBridge` 第 4 依赖 `askQuestion`；`onQuestion:(q,opts) => askQuestion(key,q,opts)` 返**悬起 Promise**（原同步返信号串实现已废） | 77 |
| `src/main/agent-host.mjs` | `askQuestion` 入桥 + `respond` 转口 + `denyGates` 打断路径 | 204 |
| `src/preload/preload.cjs` | `CHANNELS` 25 → **26** · `"question:respond"` 末位（既有十三项序不动） | 57 |
| `src/main/ipc.mjs` | `questionRespond` 处理体（未装配 ⇒ fail-loud 直抛，沿 `approval:respond` 先例） | 195 |
| `test/agent-host-question.test.mjs`（**新**） | U114 / U115 / U116 | 115 |
| `test/agent-host.test.mjs` | U82 改真作答面（作答疑载动态 ⇒ 键集 / 值分断言） | 299 |
| `test/host-floor.test.mjs` | U13 / U74 / U77 计数与文案随动 + 档头 | 284 |
| `test/projects.test.mjs` · `test/session-contract.test.mjs` | U27 · U37 白名单计数随动 + 档头 | 204 · 284 |
| `test/files.mjs` | 新档登记（25 → 27 条；同 diff 内含邻舱 `test/integration/settings-panel.test.mjs`，非本舱笔） | 14 |

**行为要点**（逐条对设计）

1. 出站 `ev:question` 恒四键 `{ key, promptId, question, options }`，`options` 缺省 ⇒ `[]`（`docs/desktop/design/IPC.md`:36）✓
2. `promptId` = 出站载荷与 `question:respond` 回执**同源同值**（同表项）✓
3. `respond` 判红四档：表外 ⇒ `unknown-prompt`；跨 `kind` **两向** ⇒ `bad-kind`；跨形 / 表外 verdict ⇒ `bad-verdict`；`answer` 非串且非 `null` ⇒ `bad-answer` —— **四档皆不 resolve**（挂起保留 ⇒ 合法载荷可续答）✓（设计行面三档 + 审批门既有第 4 档）
4. `answer` = 串**原样** ∥ `null` ⇒ 取消串（`QUESTION_CANCELLED`，单源 = `suspensions.mjs`；`docs/desktop/design/IPC.md`:59）✓
5. 命中 ⇒ **删表 + resolve**；工具结果 = resolve 值（核 `thincoder-core/tools/question.mjs:24` 直返 ⇒ 真作答；回合停在本次工具调用上，`dispatch.mjs:411` 续）✓
6. 打断路径：`interrupt` ⇒ `denyGates(key)` ⇒ 提问门按取消串结算（**消悬 Promise** —— 门挂起时 abort 不解除 await）✓
7. 通道面：白名单 26 项 · 末位 · 两向 ≡（`HANDLERS` ≡ `CHANNELS`）· 未装配 ⇒ fail-loud ✓

**决策透明表**

| # | 决策 | 依据 / 备选 |
|---|---|---|
| D1 | `bad-kind` **两向**（审批载荷打提问门 ∥ 作答载荷打审批门）⇒ `{ok:false}` 且不 resolve | 设计行面点单向（传了审批 id）；本舱按门 `kind` 分派、两向对称（同判据同档）；否：单向静默吞 |
| D2 | 缺 `answer` 键 ⇒ 走 `bad-kind`（非 `bad-answer`）—— 判据 = `"answer" in payload`（无作答意向 = 跨 kind） | `bad-answer` 留给「有作答意向但形假」（非串且非 `null`）；否：缺键当假形 ⇒ 与审批载荷混淆 |
| D3 | 新测试档 `test/agent-host-question.test.mjs`（设计 §2.5 清单未列此档） | 真作答面须真桥 + 真盘（打断收尾走终点保存）+ 真表读数 ⇒ 独立档；已登记 `test/files.mjs`；**父侧计数随动项**（见 §5.3） |
| D4 | 测试 harness 精简（替身 `deps` 八键；真 harness 另有 `author` 等键缺省） | 作答面不依赖装配细节（`ensure` 路径跑通即可）；假 `emit` 收序 —— 同 `agent-host.test.mjs` 纪律 |
| D5 | U82 作答疑载走「动态 `promptId`：键集 + 值分断言」，不入静态 arm 表 | 同批 7 审批门载荷先例（动态 id 无法逐字深比）；否：哨兵占位再改写 ⇒ 断言对象失真 |

**fix round**（本舱自审轮）

- F1（U82 第 140 行臂）：静态期望缺 `promptId` ⇒ 红；修 = 移出静态表 + 键集 / 值分断言（D5）。
- F2（新档三例 `cb is null`）：替身 agent 缺 `baseURL` ⇒ `send` 短路 `provider-invalid`（`agent-host.mjs:166`），`run` 未调 ⇒ 桥面未捕获；修 = 替身补 `baseURL`（D4）。
- 两修后全套 `node test/run.mjs`：**122 tests / 122 pass / 0 fail**。

### 5.2 审计轮（explore 只读 · 对照设计）

**轮次 1**（explore 子代理 · 只读 · 四类偏差逐类核）——**CLEAN：四类偏差均未发现**（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST 全零）。其证据面：`askQuestion` 四键载荷（`src/main/suspensions.mjs`:59-63）· 三档判红皆不 resolve（:79 / :91 / :93 / :95，删表动作全在判红之后）· 取消串全 desktop 树唯此一处（:21）· `denyGates` 提问门 ⇒ 取消串（:67-73）· 桥 `onQuestion` 返悬起 Promise 且旧同步信号串路径零残留（`src/main/agent-bridge.mjs`:73）· 宿主 respond 转口（`src/main/agent-host.mjs`:203）· 打断路径（:185-192）· 通道两向逐字同序（`src/main/ipc.mjs`:91/:146-149 · `src/preload/preload.cjs`:20-27）· 三档计数随动齐。

**审计后自修一处**（审计提「纯注释 · 归属由父侧裁定」；本舱按「注释须与代码相符」自收，属本舱档内笔）：`src/main/agent-host.mjs` 档头 ③「待决表（审批两形：逐项 / 批次）」⇒ 今表三门形，改「审批逐项 / 审批批次 / 提问」（:3）；同档出档注 `suspensions.mjs` 名面补 `QUESTION_CANCELLED`（:11）。**注释面零语义改变**。

**审计限制（据实）**：explore 无 git / execute ⇒ 纯静态，未跑测试；「122/122 全绿」为该轮未机验声明，本舱自查机验面见 §5.4。

### 5.3 父侧收口随动项（本舱不自改设计档 · 逐条列明）

1. **设计面计数与名集**：`docs/desktop/design/PROJECT.md`:141 用例模块行（自称名序 = `test/files.mjs` 现值同序，实缺 `agent-host-question`）· `docs/desktop/design/SHELL.md` §1 树 test 行（同缺）；`PROJECT.md`:140「files.mjs 12 ⇒ 15」∥ 批次档 :103「15 ⇒ 16」∥ 磁盘现值 = **14 行 / 27 条**（25〔批 9 档〕+ `agent-host-question`〔本舱〕+ `integration/settings-panel`〔邻舱〕）⇒ 终态随舱 A-2a / A-3 落档一次对平。
2. **行数闸覆盖面**：`test/host-floor.test.mjs` U95 `fresh` 清单未含 `test/agent-host-question.test.mjs`（实 115 行，远低于 300 触发线 —— 风险为零，登记面待父侧并入）。
3. **本舱不主张项**：U51 零 CJK 扫描面 = `renderer/views` 十二视图档源码（`test/views-chrome.test.mjs`:196/:294），与本舱新增测试档无关 —— 批次档 :103 若指视图档数随动，归属应为新增视图档之舱。

### §5.4 代码评审轮（advisor type=code · sync）与终态（2026-09-27）

**轮次**：1 轮 · 报告结论 = **VERDICT: pass**（0 🔴 / 2 🟡 / 4 🔵 + 1 条射程外登记）；两条 🟡 均**非 must-fix**（R7a 报告面 / R5 协调项）。
**宿主机检回执异常（如实记）**：评审报告末的引用机检回执报「0/6 引用匹配（file unreadable）」——该为**引用路径形态**（档名相对式 `IPC.md` / `suspensions.mjs` 等）在机检侧解析失败所致，**非引用失实**；本舱已对六条引用逐条实读复核（证据列于下行各条「证据」格），复核结论 = 引用全部属实 ⇒ 该回执不构成对报告结论的否定。

**响应表（逐条判定 / 处置 / 证据）**

| # | 级 | 发现 | 判定 | 处置 | 证据（本舱实读复核） |
|---|---|---|---|---|---|
| 1 | 🟡 | 设计单源面滞后（跨档 · 报告不编辑）：`PROJECT.md`:141 名集缺 `agent-host-question` 且值列 `agent-host.test.mjs` = 297（盘上 299）· `PROJECT.md`:291 记 T-DSK24 ① 机检面 = `agent-host.test.mjs`（原址补例）· `SHELL.md`:52「用例模块二十七档」 | 采纳 | 不自行改设计档（eng-designer 权属）⇒ 并入 §5.3 项 1 父侧收正清单（补 :291 · SHELL.md:52 两点） | 三处逐字实读 ✓（`PROJECT.md`:141 / :291 · `SHELL.md`:52-54）；盘上登记 28 条 ≡ 盘上档（`test/run.mjs` 两向自检随套件绿 ⇒ 机械证） |
| 2 | 🟡 | U95 行数闸 `fresh` 清单未含本舱新档 `test/agent-host-question.test.mjs` | 采纳为**父侧协调项** | 不自行扩闸面：任务书 §1.13 ㈡ 登记义务 = `files.mjs` + U51 清单两项；闸面名集属设计/父侧判断，本舱不自改 | `test/host-floor.test.mjs`:260-261 档内注释自述「其余新档行数面 = §4.1 值列表（**父侧臂清单随动项**）」⇒ 名集随动本属父侧 ✓；新档实测 116 行 ≪ 300（当前零风险） |
| 3 | 🔵 | 缺 `answer` 键载荷 ⇒ `bad-kind`（`IPC.md`:59 三档字面读法为 `bad-answer`） | **部分采纳**（口径点名 · 不改行为） | 不改判据：判据改 `answer !== undefined` 会使「审批载荷打提问门」同落 `bad-answer`，推翻 §1.13 ㈣ 已裁定的 `bad-kind` 两向对称；建议设计面在 `IPC.md`:59 点名「无 `answer` 键 = 无作答意向 ⇒ `bad-kind`」⇒ 并入 §5.3 | `suspensions.mjs`:93 判据逐字 ✓ · `IPC.md`:59 三档逐字 ✓ · 四档皆不 resolve（U115 绿）· `respond(null)` 抛 TypeError 沿 `approval:respond` 既有同形（fail-loud） |
| 4 | 🔵 | U114 `test/agent-host-question.test.mjs`:58 断言自指臂（`promptId: qp.promptId` 恒真） | 采纳 | **评审后修 F3**：收为「三值逐字 + `typeof promptId === "string"`」，键集断言由 :61 覆盖（覆盖严格不降） | 修后套件复跑 **125/125 pass**（U114 绿）；新档 115 ⇒ 116 行 |
| 5 | 🔵 | 设计 §4.1 数值面陈旧（R7c 文档卫生） | 采纳 | 父侧收口轮实读回填；并入 §5.3 | 本舱实测（口径 = 内容行数）`ipc.mjs` **195**（设计 184 ⇒ ~190；「批后 ~10 行余量」应作 **5**）· `agent-host.mjs` **204**（设计 203）· `agent-bridge.mjs` **77**（设计 79 ⇒ ~85）· `suspensions.mjs` **113**（设计 76 无增量标记）· `agent-host.test.mjs` **299**（设计 297）· `files.mjs` **14 行 / 28 条**（设计 :140 记「41 / 12 ⇒ 15」） |
| 6 | 🔵 | `preload.cjs`:10 注释坐标 `IPC.md`:42-43 失效 | 采纳 | **评审后修 F4**：去行号、留 §级记法 ⇒ 「`docs/desktop/design/IPC.md` §2 会话族行 · §1 白名单」（D4 形 · 抗漂移）；该行为既有上下文行（`git diff` 证本批未动其文），仍按「死指针即缺陷」修 | `IPC.md`:42 = `argsSummary` 段（非通道行）· msg 两通道现行坐标 = `IPC.md`:57 ✓ |

**射程外登记（评审报出 · 本舱不处置）**：`src/main/agent-host.mjs` 的 `dispose` 生产面无调用者（装配批 8 遗留；调用面 = `main.mjs` / 渲染面退场回路）⇒ 转父侧登记。

**评审后修（R8 · 零语义 / 零行为）**：F3（测试断言面）· F4（注释坐标面）——复跑 = `node test/run.mjs`（workdir `thincoder-desktop`）**125/125 pass · 0 fail**（§5.1 所记 122 为本舱前次读数；125 = 并入邻舱新例 U117 / U118 / T-DSK25 后现值）。

**终态：clean**——审计轮 CLEAN（§5.2）· 代码评审轮 pass（0 🔴）· 6 条发现全数落定（2 条父侧收正 · 1 条父侧数值回填 · 1 条口径点名 · 2 条评审后修）。

### §5.5 代码评审轮 2（修 claims 复核）与收口（2026-09-27）

**轮次**：advisor code review **轮 2**（同面 · 只核轮 1 两条修 claims，排除项按声明不复核）· 结论 = **VERDICT: pass**（0 🔴）。
- 复核面 = `test/agent-host-question.test.mjs` · `src/preload/preload.cjs`（评审侧 fresh read）。
- **F3 = Fixed（verified）**：`:58-59` 三值逐字（`[qp.key, qp.question, qp.options]`）· `:60` `typeof qp.promptId === "string"` · `:61` 键集四键 —— 与 claim 逐字相符；并核 `promptId` 源 = `suspensions.mjs`:60 `const promptId = randomUUID()`（串 ⇒ 断言为真命题，非假绿）· `:62` 表项读取 + `suspensions.mjs`:35 表项形（`shape ? {...} : { kind, key, resolve }`）一致 ⇒ 非真表键即抛红。
- **F4 = Fixed（verified）**：`preload.cjs`:10 行号锚 `:42-43` 已去，全文复扫零 `:NN` 残留。
- 轮 2 新报（2 条 · 均 🔵 · 非本修引入 · 不阻断）——**注释坐标精度**：(a) `preload.cjs`:10 的 § 锚可再点名（msg 二通道自身行 = `IPC.md`:57，而档内「会话族行」专指 `IPC.md`:54；26 项通道白名单面段 = `IPC.md`:75 落 **§2** 内，§1 的「白名单」= `IPC.md`:46 九条 `ev:*` 订阅面，异域）；(b) `preload.cjs`:2 锚「`IPC.md` §1 KD-3」不可定位（`IPC.md` 全档无 `KD-3` 字样；KD-3 单源 = `PROJECT.md`:38，同形先例 = `SHELL.md`:37 / `:72`）。
- 宿主机检回执再次报「0/7 引用匹配（file unreadable）」= 与轮 1 同形的**路径形态假阴性**（引用为档名相对式）；本舱对轮 2 关键坐标逐条实读复核（`IPC.md`:46 / :54 / :57 / :75 · `suspensions.mjs`:35 / :60 · `PROJECT.md`:38 · `SHELL.md`:37 / :72）**全部属实** ⇒ 该回执不构成对结论的否定。

**评审后修（R9 · 零语义 / 零行为 · 轮 2 建议逐字采纳）**
- **F5**：`preload.cjs`:10 ⇒ 「（`docs/desktop/design/IPC.md` §2 该行 · 白名单面）」——两锚同落 §2；「§2 该行」沿档内既有记法（`IPC.md`:79 逐字「载荷 / 回执见 §2 该行」）。
- **F6**：`preload.cjs`:2 ⇒ 「（`docs/desktop/design/PROJECT.md` §2 KD-3；批档 §2.11 收正②）」——KD-3 归位单源档（`PROJECT.md`:38 逐字「| KD-3 | 预载 = **沙箱 CJS 窄桥**（`contextBridge`），渲染面零 Node |」）。

**复跑证据（F5/F6 后）**：`node test/run.mjs`（workdir `thincoder-desktop`）= **tests 126 · pass 126 · fail 0**——读 `preload.cjs` 的机检面随改动复验（U37 白名单二十六项定序 · U74 HANDLERS ≡ CHANNELS 两向 · U114 / U115 / U116 全绿）；126 = 并入邻舱新例后现值（§5.4 记 125 为其时读数）。

**终态：clean**（轮 1 pass + 轮 2 pass；8 条发现全数落定 = 4 条父侧〈收正 / 协调 / 口径点名 / 数值回填〉+ 4 条本舱修复 F3–F6）。未起轮 3：F5/F6 = 纯注释面且建议即出自轮 2 评审本体，以「逐字采纳 + 读回 + 套件复验」落定，无新判断面（如实记，不静默收敛）。

### A-3a 标签条拆分 + 点按修复 + U55 拆档（eng-coder）

**交付摘要**：`renderer/views/tabbar.mjs`（新档 · 200 行）承接标签条面 —— 导出 `tabbarModel` / `tabbarTree` / `mountTabbar` / `BADGE_WORD` / `acceleratorTab`；`renderer/views/sessions.mjs`（170 行）留同名再出口（:27 恰四名）+ 左列三段面；`test/views-tabbar-close.test.mjs`（新档 · 101 行）= U55 关闭确认面族自 `test/views-tabbar.test.mjs` 拆出；`test/views-tabbar.test.mjs`（297 行）换靶（导入源 :16 · 零字形扫描名单 :244 补 `tabbar.mjs` · 关闭面四禁扫靶随迁）；`test/files.mjs` +1 登记（清单 28 条 ⇄ 盘上 `test/**/*.test.mjs` 28 档，实测两向齐）；`renderer/styles.css:184-185` 死注释收正（**越声明披露**：该档不在本任务原声明六档内，因设计把「`styles.css:184` 死注释收正」列为 ⑤ 随动面 —— 仅注释面，零语义）。

**验收对照**（T-DSK25 机检面三件 + T-DSK20）：① 非活动项两控件各 `tabindex="-1"` ∧ 活动项零 ∧ 全树零 `inert`（`tabbar.mjs:134` `confined = tab.active !== true && !confirm`，`props.tabindex` 经 `setAttribute` 落真属性）✓；② 接线两向（U45 点按非活动项 ⇒ `onActivate` 携本键 / U54 三接线形）✓；③ 加速键纯函数（键 ∈ 1..9 ∧ 第 N 档存在 ⇒ 第 N 档；表外 / 越界 / 无修饰 ⇒ `null` 零动作**不吞键**；文档级单枚 listener、命中才 `preventDefault`）✓；④ 确认态例外（`data-confirm="1"` 项三控免 `-1`）—— 含**非活动命中项判别例**（:56-66，五断言钉 `!confirm` 支路）✓。

**决策透明表**：`wire` / `withKey` 与 sessions.mjs 三副本（判据单源 = `RENDERER.md` §1.1，拆档不动它 · 已披露）· `TAB_STOP_OUT="-1"` 常量单源 · 加速键走文档级 listener（真事件面 / 真视觉切换 = 人工走查，设计 `PROJECT.md:181`，非自动面）· 拆档后 barrel 导出面与 `test/views-locks.test.mjs:54` 期望名集逐字一致（消费面零随动）。

**审计与代码评审轮次**：内部偏差审计 1 轮（验收点 A–F 全「是」· 零越界 · 1 条头注宣示偏差 ⇒ 已改）；advisor `type=code` 评审 2 轮 —— round 1 = **pass**（2×🟡 可选 + 3×🔵，零 🔴）· round 2（fix-claim 逐条核验）= **pass**。**终态 = clean**。

**fix round（共 1 轮 · 3 处，均在本舱档内）**：① U55 补「例外判别例」（夹具 `{tabs:["a","b","c"], activeTab:"b", pendingClose:"a"}` —— 命中项非活动，判别力：无 `!confirm` 实现下该控必携 `-1` ⇒ 断言必红）；② `styles.css:184-185` 补确认态例外条（零语义 · 不影响 U48 三常量扫描）；③ 新档头注补夹具遍历序差（夹具后序 vs 同族档私有前序副本 ⇒ 断言须序无关）。

**验证读数**：定点 `node --test` —— `views-tabbar.test.mjs` 6 例绿 · `views-tabbar-close.test.mjs` 1 例（6 断言组）绿；全量 `node test/run.mjs` = **tests 125 / pass 125 / fail 0**（零红；上轮全量两红 `views-locks:47` / `views-chrome:198` 已由邻舱在飞修好）。行数实读：`tabbar` 200 · `sessions` 170 · `views-tabbar.test` 297 · `views-tabbar-close.test` 101 · `files` 14 · `styles.css` 285（皆 ≤300）。

**未落项（父侧 · 据实）**：① `test/views-chrome.test.mjs` 的 U51 零 CJK 扫描名单未补 `renderer/views/tabbar.mjs`（该档在本任务禁改区 ⇒ 归父侧派工；属名单式扫描的漏登记，非现红）；② 设计档值列 / 落形预测未回填（`PROJECT.md:141` 值列仍 `329 / ~100` · `:156` 预测 `~273 / ~100` ⇒ 实读 297 / 101；`PROJECT.md:176` 已登记为码面随动池 ⇒ 收口轮）；③ T-DSK26 页随动五例（`PROJECT.md:180` 档属位同在新档 `views-tabbar-close.test.mjs`）由页随动轮（A-3b）落笔 —— 新档头 :5-6 已如实披露。

### 交付摘要（舱 A-1a · 中区输入区）

改动面 7 档（全在 §2.4 文件清单内），逐档一行：

- `renderer/store.mjs` —— 队列族四导出（`QUEUE_MAX` / `enqueue` / `dequeue` / `drainQueue`，三动作皆纯函数，拒收/空队返原引用）；294 行。
- `renderer/i18n.mjs` —— 输入区三键 × 两语（`composer.input` / `composer.interrupt` / `composer.queue.full`）⇒ 104 键，两语键集相等；300 行（贴顶，零余量）。
- `renderer/index.html` —— `.session` 内 flow 之后补 `:33:         <div class="composer" data-slot="composer"></div>`（落点 = 对话流之后）。
- `renderer/mount-composer.mjs`（**新档**）—— `composerModel` / `composerTree` / `attachComposer` / `flushTurnTail`；251 行。
- `test/store.test.mjs` —— U117 队列三纯动作；314 行。
- `test/views-chrome.test.mjs` —— U118 构树两态锚 · U119 挂载/接线面（句柄表 · 槽锚两向 · 落点序 · flush 在飞卫兵）；374 行。
- `test/views-locks.test.mjs` —— **仅** `store.mjs` 导出名册数组 21 → 25 名（父侧 02:17 裁定的「该数组唯一 · 其它字节零动」）。

设计锚逐条落形及其机检面：

| 设计锚（§1.3 判据② / T-DSK22 / T-DSK23 / §1.14） | 落形 | 机检面 |
|---|---|---|
| 树根 `{class:"composer", "data-state": active ? "ready" : "none"}` | `composerTree` 构根，两态恒在 | U118 `:314` / `:328` |
| `full` ⇒ 首子 `div.composer-notice[data-notice=queue-full]`（子序 [提示,输入框,中断键]） | `full` 派生自 `queue.length >= QUEUE_MAX` | U118 `:336-341` |
| `textarea.composer-input[data-input=text][rows=1][aria-label]`，`usable = active && typeof onKeyDown === "function"` 否则 `disabled` | `usable` 单源闸；未接线 ⇒ 全 disabled | U118 `:318-322` / `:330-334` |
| `button.composer-interrupt[data-action="msg:interrupt"]`；只按「有无活动会话」闸、零乐观写 | 出口只发通道，不置位标 | U118 `:323-325` / `:332-333` |
| Enter 发 / Shift+Enter 换行 | `onKeyDown` 只认无修饰 Enter | U118 `:321`（接线面）+ 真机走查 |
| 空白 ⇒ `empty`；无会话 ⇒ `no-session`；忙态入队（满 ⇒ `full` 文本保留；受理 ⇒ `queued` + 清输入）；闲态 ⇒ `sent` / `kept` | `submit` 五出口 | 走查（T-DSK22 真机） |
| flush 先发后出队、载荷 = 队首 `title` 逐字、失败留队 + `console.error` | `flushTurnTail` | U119 `:367-373`（卫兵行为面） |
| 挂载面 = `[data-slot="composer"]` 槽 + `handlers` 接线 | `attachComposer` 返 `{paintComposer, flushTurnTail, handlers, keys, detach}` | U119 `:352-355` · `:359-365` |
| flush 触发接线归 A-1b（本档零第二订阅点） | 未动 `app.mjs` / `events*.mjs` | 改动面清单（上 7 档） |

验证：`node test/run.mjs` ⇒ **126 / 126 绿**（含新增 U117 / U118 / U119；面数 125 → 126）。

### 决策透明表

| 决策点 | 取值 | 依据 / 理由 | 谁可推翻 |
|---|---|---|---|
| `QUEUE_MAX` 具体值 | **8** | 设计只定「有上限」语义、未给数；取 8 与核侧默认档一致 | 父侧 / 设计侧一行改数 |
| 草稿载体 | `attachComposer` 内闭包变量 `draft`（非 store 键） | 草稿不属状态机（不入 `activeSession` / `pool` 切片），闭包 = 重绘不丢且不触发订阅 | 父侧 |
| 复填实现 | 描述符 `value` 属性 + 挂载后 `:117:    if (box !== null && box !== undefined) box.value = model.text` 两条路径同覆盖 | `<textarea>` 的 `value` **内容属性**是否承载显示值存疑 ⇒ 属性赋值径与平台无关 | 父侧（若真机走查证明描述符径足够，可删赋值径） |
| flush 在飞卫兵 | 模块级 `flushInFlight` + 交叠刻一行诊断 + 零动作 | 防同条双发 / 连摘两条 ⇒ 保「一次一条」；交叠丢刻不静默 | 父侧（「丢刻后由谁续跑」属设计面） |
| 自铸用例号 | U117 / U118 / U119 | 本批新增面需号（原册至 U116） | 父侧（可改名） |
| 零 CJK 名单 +1 | `test/views-chrome.test.mjs:300` 补 `"tabbar.mjs"`，标题计数 `十二 → 十三` | 父侧 02:46 追补第 3 项；`renderer/views/tabbar.mjs` 实存且 `\p{Script=Han}` 命中零 ⇒ 加名单安全（计数与清单同动，D3） | 父侧 |

### 父侧 02:46 追补的三处随动 —— 逐项核对结果

1. ✗ **已成事实（追补依据滞后）**：`test/views-locks.test.mjs:47-52` 名册**已含** `QUEUE_MAX` / `dequeue` / `drainQueue` / `enqueue` 四名（25 名，`Object.keys(store).sort()` 全等断言）；U52 绿。
2. ✗ **已成事实（追补依据滞后）**：`test/views-chrome.test.mjs:202` 已是 `assert.equal(keys.length, 104, "宿主键数 = 104（… + 输入区 3）")`；另 `:297` 消费面断言亦为 104 + 5；U51 绿。
3. ✓ **本轮落笔**：`:300` 零 CJK 名单 `sessions.mjs` 之后补 `"tabbar.mjs"`，`:200` 用例标题 `十二视图档 → 十三视图档`（该清单唯一计数点，grep 复核）；改后 U51 绿。

（父侧 02:28「盘上零落盘」的催促据 `touched` 观测面，该字段滞后；本轮与上轮实际均已落盘 —— 结论以盘面 `read` / `git status` 为准。）

### 审计与代码评审轮次与终态

| 轮 | 类型 | 面 | 结论 | 处置 |
|---|---|---|---|---|
| 内审 1 | explore 偏差审计 | 设计锚 / 判据 / 文件清单 / 越面 | **四类全 CLEAN**（观察：`QUEUE_MAX=8` 待披露；§2 机检面张力已由 §2.9 化解） | 无 fix |
| 评审 1 | advisor code | 7 档 | **changes-required**：🔴 `handlers` 全档无定义 ⇒ `attachComposer` 必抛 · 输入框恒 disabled（判据②未交付）；🟡 must-fix 挂载/接线零机检；🟡 草稿复填依赖内容属性；🟡 flush 无在飞卫兵 | fix round 1 |
| 评审 2 | advisor code（核修复声明） | `mount-composer.mjs` · `views-chrome.test.mjs` | **pass**：前四项目标皆实修 + 各有机器面；余 🟡 #5（IME，设计侧协调项）+ 新 🔵 三条（序断言真空 · 交叠丢刻零诊断 · 射程外三项） | fix round 2（三条 🔵 闭两条，射程外三项按规矩不动） |
| 评审 3 | advisor code（严格只核声明） | 同上两档 | **pass**：本轮两处窄修（序断言两向护 `:363-365` · 丢刻诊断 `:171`）+ 父侧追补第 3 项（名单 +1 / 计数同动）皆闭合；无新 🔴 | —— |

**终态 = clean（收敛）**：0 个未闭合 🔴 · 0 个未闭合 must-fix 🟡；余项 = 🟡 #5（组字期 Enter 直发 —— 设计缺口，按「设计先行」路由父侧 / 设计侧，实现侧不自裁落形）+ 报告级 🔵（射程外三项：`PROJECT.md` §4.1 数值漂移 / `store.test.mjs` 写死 `QUEUE_MAX === 8` / `store.mjs` `drainQueue` 渲染面零调用者 —— 均待父侧或 A-3a 面处理）。

### fix round（共 2 轮 · 均在预算内）

- **round 1**：① `mount-composer.mjs:229:  const handlers = { onInput, onKeyDown, onInterrupt }` 补定义（🔴）；② `mountComposer` 挂载后属性赋值复填草稿（🟡）；③ `flushTurnTail` 模块级在飞卫兵 + `try/finally`（🟡）；④ `views-chrome.test.mjs` 新增 U119（挂载零抛 + 句柄表形 + 槽锚两向 + flush 卫兵）补机检面（🟡 must-fix）。
- **round 2**（评审 2 后窄修）：⑤ 交叠丢刻补一行诊断（🔵）；⑥ 落点序断言补两侧 `>= 0` 护（🔵）；⑦ 父侧追补第 3 项：零 CJK 名单 + `"tabbar.mjs"` 与计数 `十二 → 十三`。
- 未做（明确不做，非遗漏）：⑧ IME 组字态 Enter 闸（设计缺口，父侧 / 设计侧先定）；⑨ `drainQueue` 消费面（属 A-3a）；⑩ `store.test.mjs:282` 头注措辞含混（早批遗留，非本舱面）。

### 越预算 / 未决披露

- 行数 vs 设计预算：`mount-composer.mjs` **251** vs 设计 ~95（§1.11㈡ 授权不拆档）；`views-chrome.test.mjs` **374** vs ~321；`store.test.mjs` **314** vs ~304；`i18n.mjs` **300**（贴顶）。`store.mjs` 294 ≤ 300 ✓；`index.html` 46 ✓；`views-locks.test.mjs` 117 ✓。
- 待父侧回填：`docs/desktop/design/PROJECT.md` §4.1 三行数值（本档实测值已在上句给出）。
- 越面披露：本舱**零**越面写 —— 未动 `app.mjs` / `events*.mjs` / 设计档 / `views-locks` 该数组外字节（除父侧指令的第 3 项随动）。

### 交付摘要（舱 A-1b · 事件回合尾 + flush 接线 + `app.mjs` 拆档 + 补例）

**舱面** = §2.4 ①③ + §1.14 裁定（flush 触发落点）+ §1.17 归约半归属 + `docs/desktop/design/RENDERER.md` §1.1:37-39 三径 + `UI.md:20`；派单 = #56（#53 撤 · `files` += `renderer/events-subscribe.mjs`）。改动面 **9 档**（6 在册 + 1 越声明已放行 + 2 收尾随动），逐档一行（行数 = 内容行数口径 · 本轮实测）：

- `renderer/events.mjs`（在册）—— **299** 行。`isTurnTail` 回合尾判据**单源**吃两通道形三径（:158-163：`ev:error` ⇒ 真；非 `ev:activity` ∥ `fields` 键在场 ⇒ 假；余判位 `done` / `stopped`）；`onError`（:183-189）= 错误块入流（活动会话门 `forActive`）+ 本键 `running` 清 + 位落 `done`（清 → 置 · 幂等）。
- `renderer/events-subscribe.mjs`（在册 · §1.14 裁定加入）—— **68** 行。九通道订阅（:18-21）；回合尾两动作**同刻** = 标题刷新 + `onTurnTail` 窄口（:58-61）；窄口归一 :33（缺 / 非函数 ⇒ `null` ⇒ 零动作 —— 未接线调用面合法）。
- `renderer/mount-sessions.mjs`（**新档 · 越声明 · §1.10 放行**）—— **129** 行。会话族自 `app.mjs` **整族机械提取 · 零行为改**：8 导出（`refreshRail` / `backfill` / `resumeOpened` / `activateSession` / `createSession` / `requestClose` / `confirmClose` / `cancelClose`）+ 5 私有（`isProject` / `slotOf` / `loadPage` / `openPage` / `openResult`）。
- `renderer/app.mjs`（在册）—— **190** 行（≤300 ✓）。import 换源（:17-21）· `const { flushTurnTail } = attachComposer(host)`（:42）· `attachEvents({ on: host?.on, onTurnTail: flushTurnTail })`（**:181 = 全仓 flush 触发唯一处** · 零第二订阅点）· 会话族整块删除 + 档头注随动（:5-6 / :9-12）。
- `test/events-reduce.test.mjs`（在册）—— **201** 行。U88 内补错误径四臂（:107-119：结算 / 入流 / 幂等 / 他键零扰）；U89 内补三径各恰一次（:147-171）+ 内联形负臂（:158-166）+ 窄口非函数臂（:176-189）。**零新例号**。
- `test/views-locks.test.mjs`（在册）—— **121** 行。会话族四动作锚宿主改钉 `mount-sessions.mjs`（:71 起读该档 · :103-106 四锚）+ `pendingClose` 仍守 `app.mjs`（:108）+ 头注一行。
- `test/store.test.mjs`（在册）—— **314** 行（无净增）。**仅 1 行指针**：:259 消费面坐标 `app.mjs:183` → `mount-sessions.mjs:118`。
- `test/views.test.mjs` · `test/views-tabbar.test.mjs`（**收尾随动 · 越声明 · 零语义**）—— 三处断言文案「通道载荷回代 / 通道名归 `app.mjs`」→「归 `mount-sessions.mjs`」（`views.test.mjs:189` · `:200` · `views-tabbar.test.mjs:280`）：该三句在本舱提取后成立性反转（载荷回代 `slotOf` 与三通道名随族迁出）⇒ 死指针即修；只动断言文案字节，断言对象 / 判据零改。

设计锚逐条落形及其机检面：

| 设计锚（`RENDERER.md` §1.1:37-39 / `UI.md`:20 / §1.14 / §1.17） | 落形 | 机检面 |
|---|---|---|
| 回合尾 = 三径（`done` / `stopped` / `ev:error`），判据单源吃两通道形 | `isTurnTail`（`events.mjs:158-163`）—— 订阅面与值面同用一出口 | U89 `:147-171`（三径各恰一次）+ U88 `:100-105`（内联形负臂） |
| 错误径终局 = 本键 `running` 清 + 位落 `done` ∧ 块面仍守键门 | `onError`（`events.mjs:183-189`） | U88 `:107-119`（四臂） |
| 回合尾 ⇒ 标题刷新 ∧ flush 窄口（**同触发点** · 判据仍单源） | `events-subscribe.mjs:58-61` | U89 `:149-150` / `:155-156` / `:170-171` |
| 窄口注入式；缺 / 非函数 ⇒ 零动作 | `:33` 归一 + `:60` 判空 | U89 `:176-189`（非函数臂 + 标题刷新不受累） |
| flush 触发唯一处 = 接线面一行（逻辑住 `mount-composer.mjs`） | `app.mjs:42` 取句柄 · `:181` 接线 | 结构面：`views-locks:99` 串 `attachEvents(` 在位（**接线点本身无机检臂** ⇒ 终态 🔵⑥） |
| 拆档 = 机械提取 · 行为零改（§1.10 硬要求） | 会话族整块迁 `mount-sessions.mjs`（8 导出 = `app.mjs` 消费集闭包） | 全 126 例逐例过（含会话族锁面 · U75 消费面两读数） |
| 新档入既有结构闸面（§1.10 硬要求） | U52 既有结构面起读新档（`views-locks.test.mjs:71` / `:103-106`）+ U5 闭包自 `app.mjs` 走边覆盖（fail-closed 读） | U52 · U5 双绿；**未入** U95 `fresh` 臂 / U5 正控名集 ⇒ 父侧随动（终态 🔵②） |

**验证**：`node test/run.mjs` ⇒ **126 / 126 绿 · 0 红**（例数与 A-1a 同 —— 本舱零新例号；本轮实读两次：文案随动前后各一次，读数一致）。

决策透明表：

| 决策点 | 取值 | 依据 / 理由 | 谁可推翻 |
|---|---|---|---|
| 窄口缺省语义 | 缺 / 非函数 ⇒ `null` ⇒ 零动作（**不抛**） | 订阅面不得因未接线调用而炸；调用面（测试 / 未来第二调用点）合法缺省；判据仍单源 | 父侧 |
| 三径判据位置 | 全落 `isTurnTail` 一处（订阅面零位码判断） | §1.14「判据仍单源」—— 订阅面只做「命中 ⇒ 两动作」 | 设计侧 |
| 错误径块入流门 | `forActive`（仅活动会话入流；结算仍无条件） | 非活动会话的错误不污染对话流 —— 与 `ev:activity` 径同门 | 父侧 |
| 拆档落名 / 导出面 | `mount-sessions.mjs` · 8 导出 + 5 私有 | §1.10 已登记拟名；导出面 = `app.mjs` 消费集（私有五个全仓零外部调用者 ⇒ 反出口即扩面） | 父侧 |
| 补臂不新号（U88 / U89 内补） | 两例内补臂 · 零新例号 | 三径 / 错误径属既有用例的判据同一族（测试面不变 ⇒ 不虚增例数） | 父侧 |
| 三处断言文案随动 | 「归 `app.mjs`」→「归 `mount-sessions.mjs`」 | 本舱提取后原文案成立性反转（死指针）；零语义字节 | 父侧 |

审计与代码评审轮次与终态：

| 轮 | 类型 | 面 | 结论 | 处置 |
|---|---|---|---|---|
| 内审 1 | explore 偏差审计（只读 · 对照设计） | 设计锚 / 判据 / 文件清单 / 越面 | **VERDICT: clean**（无发现项需处置） | 无 fix |
| 评审 1 | advisor code（sync） | 9 档 | **pass**：0 🔴 · 2 🟡（报告项 · 非 must-fix）· 4 🔵 | 无 fix round |

**advisor 六条发现逐条处置**：

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| ① | 🟡 | `RENDERER.md:44` 开页路宿主坐标仍指 `app.mjs`（实迁 `mount-sessions.mjs`） | **报告项** —— 设计档面（归设计侧 / 父侧收口）；本舱只报不改（同 §5.3 口径） |
| ② | 🟡 | 两新档未入 U95 `fresh` 臂 / U5 正控名集（`mount-composer.mjs` A-1a · `mount-sessions.mjs` 本舱） | **报告项** —— 闸面名集 = 父侧臂清单随动项（`host-floor.test.mjs:261` 自注「§4.1 值列表（父侧臂清单随动项）」· `:282-283` 指明同规则单源）；§1.10 要求的「新档入既有结构闸面」本舱已落 = U52 起读新档 + U5 闭包覆盖 |
| ③ | 🔵 | `RENDERER.md:32` 三键 vs 实四键 | **报告项** —— 与 §5.3 已登记 `PROJECT.md:116` 同形漂移，归设计档收口 |
| ④ | 🔵 | `events-reduce.test.mjs:104-105` 钉 `ev:question` / `ev:task` 零写现态 | **保留（A-2a 面）** —— 该两通道改写切片属 §1.17 归约半；届时随改断言，本舱不动 |
| ⑤ | 🔵 | `events.mjs:186` 键域（`tabBadges` 任意键可写） | **保留** —— 与 `ev:activity` 径同律（U88 `:96-98` / `:115-117` 钉住「他键可写 · 本键零扰」）；无判据要求收窄 ⇒ 不动 |
| ⑥ | 🔵 | `app.mjs:181` flush 接线无机检臂 | **保留 + 披露** —— 结构面只证 `attachEvents(` 在位；端到端面 = 真机冒烟；加臂 = 新判据 ⇒ 须设计侧先定（本舱不自裁） |

**终态 = clean（收敛 · 0 未闭合 🔴 · 0 未闭合 must-fix · fix 0 轮）**。

fix round：**0 轮**（内审 clean + 评审 pass ⇒ 无 fix 触发；终态即初交态）。

越预算 / 未决披露：

- 行数 vs 设计预算：`events.mjs` **299** vs `PROJECT.md` §4.1 预算 ~295（**面内** —— U95 在册档 ≤300 ✓ · 贴顶余 1）；`events-subscribe.mjs` **68**（设计未给数）；`mount-sessions.mjs` **129**（新档 · 设计未给数）；`app.mjs` **190** vs 拆前预算 ~330（拆后达标 ✓）；`events-reduce.test.mjs` **201** / `views-locks.test.mjs` **121** ✓。
- 越声明披露（三项 · 逐项理由）：① `renderer/mount-sessions.mjs` = §1.10 父侧放行的拆档新档（不在 A-1b 派单 `files` 内）；② `test/views.test.mjs` · ③ `test/views-tabbar.test.mjs` = 收尾随动三处断言文案（本舱提取致原文案成立性反转 ⇒ 死指针即修 · 零语义）。
- `test/store.test.mjs` **314** > 300（advisory 线）：该档 **A-1a 面**已披露（§5.1 越预算行）—— 本舱对其仅 1 行指针改（无净增）；拆档 / 例外面登记归父侧窗口处置，本舱不重复主张。
- 未决（报父侧 · 本舱不改）：U95 `fresh` 臂与 U5 正控名集未含两新档（= 🔵②）· 设计档漂移（`RENDERER.md:32` / `:44` 本舱亲见 + `PROJECT.md:114` / `:116` / `:141` / `:149` 与 `SHELL.md:40-45` 承 §5.3 登记）—— 均属设计侧 / 父侧面。
- §1.10 的 A-3 交接确认：会话族接线已迁 `mount-sessions.mjs` ⇒ A-3 的关闭尾 / 改名删除接线落**新档面**（不再假定在 `app.mjs`）。第 ⑥ 件「关标签后对话流内容不消」= A-3 舱面，本舱零涉及。

### A-3b 左列行内动作（④）+ 关标签页随动（⑥）（eng-coder · 2026-09-27）

**范围** = 批档 §2.4 ④（左列会话行内控件：改名 / 删除）+ ⑥（关标签 ⇒ 页随动）；含修正轮补登的两通道出口（`session:rename` / `session:delete`）接线。任务面 = §2.5 / §2.6 / §2.9（T-DSK3 注 · T-DSK26）。

#### 交付摘要

- **④ 态单源**（`thincoder-desktop/renderer/store.mjs:156-165`）：`railForm { key, mode }` 单槽 + 两纯动作 `openRailForm` / `closeRailForm` —— mode 闭集 `{rename, delete}`；表外键 / 表外形 ⇒ 原引用拒收；同键同形 ⇒ 原引用；换键 / 换形 ⇒ 新态；收形 ⇒ 槽清空（取消 / 应用两出口共用尾）且 `tabs` / `activeTab` 零动。
- **④ 落形**（`thincoder-desktop/renderer/views/sessions.mjs:155-166`）：行**原位**换形 —— 常态 `[行控件, 改名, 删除]` ∥ 改名形 `[文本控件, 取消, 确认]`（行控件原位退出：编辑对象即行内容）∥ 删除形 `[行控件, 取消, 确认]`（沿关闭确认面同形）；在形 ⇒ `data-form` 机读锚；确认键携本键 `data-slot`；词面 = 两语三键（`thincoder-desktop/renderer/i18n.mjs:40-43` ∕ `:152-155`：`rail.action.rename` / `rail.action.delete` / `rail.action.cancel`）。
- **④ 字形面**：`thincoder-desktop/renderer/styles.css:171-224`（两控件 `content` 字形；视图档零字形字面 —— KD-f）；草稿住 DOM（`rail-rename-input` 零 handler，值 = 行标题投影；接线面确认时读值 `thincoder-desktop/renderer/app.mjs:75-84`）。**四禁**（`window.prompt` / `window.confirm` / `<dialog` / `setTimeout`）机检两档零命中（`thincoder-desktop/test/views.test.mjs:285-289`）✓。
- **⑥ 关闭尾**（`thincoder-desktop/renderer/mount-sessions.mjs:121-126` `closeTail(before)`）：比 `activeTab` 前后差 —— 关活动 ⇒ `activateSession(邻位键)`（与左列点行 / 标签激活同一路）· 关唯一 ⇒ `store.set(openSession(现态, null))` 关页（中区 `none` 态零节点）· 关非活动 / 拒收 / 待确认 ⇒ 零动作；三调用点 `:133` / `:140` / `:192`。
- **⑥ 删除同源**：`session:delete` 回执 `ok:true` ⇒ `closeTab(本键)` + 同尾；`ok:false` ⇒ 零动作（不造死标签）。
- **判据对照**：T-DSK26 五例逐字兑现（`docs/desktop/design/PROJECT.md:277`）· T-DSK3 注 UI 入口构树面（`PROJECT.md:280`）。
- **验证**：全量 `node test/run.mjs`（cwd `thincoder-desktop`）= **tests 128 ∕ pass 128 ∕ fail 0**（交付前复跑）。
- **机检面**：新档 `test/views-tabbar-close.test.mjs` —— U120 页随动五例（含三支附加臂，见决策表 D6）+ U121 删除出口同源；`test/views.test.mjs:248-257` ∕ `:269-276` ④ 两形固化 + `:281-283` 形不合法臂；`test/store.test.mjs:264-279` railForm 纯动作 + U75 定形锁随动；`test/views-chrome.test.mjs:204` 键数锁（`104 + 3` = 107 宿主键）+ `:302` 全键消费（107 + 5）；`test/views-locks.test.mjs` store 导出名册 +2 名（§1.18㈠②）+ 关闭尾接线锚。实机走查 = T-DSK21（人工面 —— 非本舱自动面，未跑）。

**FILES CHANGED**（11 档 · 均在 `thincoder-desktop/`）：
renderer（6）：`store.mjs` · `views/sessions.mjs` · `mount-sessions.mjs`（批 A 新档 · A-1b 建 129 ⇒ 本舱 197）· `app.mjs` · `styles.css` · `i18n.mjs`
test（5）：`views.test.mjs` · `views-chrome.test.mjs` · `views-locks.test.mjs` · `store.test.mjs` · `views-tabbar-close.test.mjs`（批 A 新档 · A-3a 建 101（U55）⇒ 本舱 317（+U120 / U121））

#### 决策透明表

| # | 决策 | 依据 |
| --- | --- | --- |
| D1 | ④ 换形态住 store（`railForm` 单槽）· 字形住 CSS · 草稿住 DOM | 设计锚（态单源 / KD-f / 草稿不住 store）· §2.4 ④ |
| D2 | 删除形**保留行控件**（`[行控件, 两键]`） | 设计侧未点名（`docs/desktop/design/UI.md` §1 左列会话行二义）；取「沿关闭确认面同形」—— 待确认态不撤行内容（改名形撤行控件之理由在删除形不成立）⇒ 测试固化 + 代码注释；设计侧一行收正见响应表 |
| D3 | 确认键词 = 动作词（改名 / 删除） | 设计未点名；复用行控件词面（零新键） |
| D4 | 取消 / 应用两出口共用 `closeRailForm` 一尾 | 设计锚（收形一尾） |
| D5 | 用例号 U120 / U121 自铸 | 设计用例号归属表无 A-3b 段（批 9 先例）；双处披露（测试档头注 `:5-7` + 本段） |
| D6 | U120 段内补三支附加臂：⑤b 对照臂（同形回执在键活动时必写 —— 证 ⑤ 零写非哑断言）· ⑥ 表外臂（表外键拒收 ⇒ 零动作 / 零 IPC）· ⑦ 确认径臂（待确认 ⇒ 确认 ⇒ 关本键 + 同尾页随动 —— 五例未单列，本档补 `:260`） | 设计外补臂（判据两向）· 披露 |

#### 审计与代码评审轮次与终态

- **审计轮（explore 只读 · 对照设计）**：终态 **DIVERGENT**（无代码级偏差）—— 发现族集中在行数 / §4.1 登记 / 记录面；处置 = 本段逐条披露 + 收口轮（代码零改）。
- **代码评审轮 1（advisor `type=code` · sync）**：**VERDICT pass**（0 🔴 · 6 🟡 · 1 🔵；无 must-fix）。评审对 host 档两处引注未能亲读（传入路径未带仓根前缀 ⇒ 不可读）⇒ 本舱亲读复核（`store.mjs:156-165` · `mount-sessions.mjs:121-126` · `app.mjs:64-84`）✓。
- **fix round = 0**（审计零代码级发现 · 评审零 must-fix ⇒ 无代码修轮）。**终态 = clean（收敛）**。
- 复核读数：终态复跑全量套件 = **128 / 128 / 0** ✓。

#### 响应表（评审发现逐条处置）

| # | 级 | 发现 | 处置 |
| --- | --- | --- | --- |
| 1 | 🟡 | 设计档坐标滞后：`docs/desktop/design/PROJECT.md:53`（KD-16 关闭尾宿主）/ `:114`（app.mjs 行）/ `docs/desktop/design/RENDERER.md:44`（开页路宿主）仍指 `app.mjs`，实住 `mount-sessions.mjs` | **只报不改**（设计档非本舱写权）—— 收口轮 / 设计侧 |
| 2 | 🟡 | 越 300 / 越注册值未披露：`store.mjs` 310 · `i18n.mjs` 308 · `styles.css` 340 · `views-chrome` 379 · `store.test` 333 · `tabbar-close` 317 | 本段「越预算披露」逐档列值；拆分登记归收口轮（§1.19㈡） |
| 3 | 🟡 | ④ 换形落形二义（删除形含行控件 · 设计未点名；确认键词未点名） | 实现取「沿关闭确认面同形」+ 动作词；测试固化 `views.test.mjs:269-274`；设计侧一行收正 |
| 4 | 🟡 | `railForm` 无外部消解窗口（切项目 / 行集整置留场；槽号可复用 ⇒ 陈旧确认面指向新槽） | **设计缺口 · 本舱不改**（改 = 设计增量）—— 报告父侧 / 设计侧 |
| 5 | 🟡 | 改名出口无行为例（与 U121 删除出口不对称） | 建议补例或登记走查面；本舱不改（设计侧裁决） |
| 6 | 🔵 | §5 无 A-3b 记录（U120 / U121 自铸号披露面） | **本条即补** —— 本段 + 测试档头注双处 |
| — | — | 余 1 🟡 全文未随上下文交接保留（类属 = 披露 / 登记面） | 如父侧持评审全文且为新条 ⇒ 请回填本段；如与上列同族 ⇒ 已覆盖 |

#### 越预算披露（口径 = 内容行数 `replace(/\n$/,"").split("\n").length` · §1.19㈡ 照写 + 披露）

| 档 | 设计注册值 | 实读（本舱终态） | 差 / 说明 |
| --- | --- | --- | --- |
| `renderer/store.mjs` | 259 ⇒ ~300（`PROJECT.md:148`） | **310** | 越注册 ~300 ⇒ 越 300；§1.19㈡ 裁定「照写 + 披露；拆分归收口轮」 |
| `renderer/i18n.mjs` | 293（`:119`）· 贴 300 层预案（`:147`） | **308** | +3 键 × 两语 ⇒ 越 300；预案（词族按视图面拆）待收口轮 |
| `renderer/styles.css` | 284（`:111`）· 拆分预案（`:146`） | **340** | +56（④ 行形态面 `:171-224`）；已越 300 —— **预案触发待收口轮** |
| `test/views-chrome.test.mjs` | 296 ⇒ ~321（`:151`） | **379** | +58 越注册值；预案点名（`views-composer.test.mjs`）待收口轮 |
| `test/store.test.mjs` | 279 ⇒ ~304（`:151`） | **333** | +29 越注册值；行形态例 + U75 锁随动 |
| `test/views-tabbar-close.test.mjs` | ~100（`:156` · A-3a 实建 101） | **317** | **+216 最大偏差**（U120 五例 + 三臂 + U121 + 夹具面 `:109-154`）；>300 ⇒ 拆预案归收口轮 |
| `renderer/app.mjs` | 299 ⇒ ~330（`:114`） | **213** | 拆档落形（拆后达标 ✓） |
| `renderer/mount-sessions.mjs` | 无行（`:114` / `:149` 仍「拟新增」） | **197** | 新档无 §4.1 行 ⇒ 设计侧登记（见响应表 1） |
| 未越档 | — | `views/sessions.mjs` 256 · `test/views.test.mjs` 292 · `test/views-locks.test.mjs` 135 | ≤300 ✓ |

#### 列外 / 越声明披露（逐档理由）

1. `renderer/styles.css` —— **越 §2.5 声明**：④ 行形态的样式 / 字形面必需（KD-f 字形住 CSS、视图档零字形字面；设计评审 §3 轮 1 第 12 条已把该档注释面纳入批 A，本舱为其**内容面**）⇒ 落 `:171-224`；行数披露见表。
2. `renderer/mount-sessions.mjs` —— **§1.10 裁定落点**（A-3 交接明示「关闭尾 / 改名删除接线落新档面」，批档 `:81` / `:655`）；本舱扩 129 ⇒ 197（`closeTail` + 三调用点 + 删除同源）。
3. `renderer/i18n.mjs` —— §2.5 改动档列内（「新增词键」）+ §1.18 时序（与 #60 共用 ⇒ 放最后一笔 · 写前重读）+ §1.19㈠（三处同笔）。
4. `test/store.test.mjs` —— **越 §2.5 声明**（依 §1.18 常设条款：「凡本舱新增的导出 / 面 / 新档 ⇒ 同笔落齐其锁、名册、闸面登记」）—— 新增 `railForm` 槽 ⇒ U75 初态键集锁 +railForm + railForm 两动作例。
5. `test/views-chrome.test.mjs` —— §1.19㈠ 裁定（键数锁 `104 + 3` / 全键消费 / 零 CJK 名单）。
6. `test/views-locks.test.mjs` —— §2.5 列内（关闭尾接线锚）+ §1.18㈠②（store 名册 +2 名，只动该数组）。
7. `test/views-tabbar-close.test.mjs` —— §2.5 新档列内（A-3a 建 · U55 迁入）+ A-3a 未落项③ 明确「T-DSK26 五例由页随动轮（A-3b）落笔」✓。
8. `test/files.mjs` —— 本舱**零改**（新档登记 `:7` 由 A-3a 落；本舱复核在场 ✓）。

#### fix round

零轮（无代码修）—— 见「审计与代码评审轮次与终态」。

### A-3b 补记 · doc-check 读数（本轮实测）
- 命令：仓根 `node scripts/doc-check.mjs` ⇒ exit 1（机检·锚 扫描域 docs · 150 档）。
- 判读：`FAIL(锚): 34 条悬空` + `FAIL(行宽): 18 行超 300 字符`。
- 逐行清点：34 条悬空 = 路径/坐标 33 + 符号·窄 1，全落 `docs/core/**` 与 `docs/vsc/**`（CHECKPOINT / SESSION / MODEL-SPECS / TOOLS / WEBVIEW / VSC-DEBT 等）。
  18 行宽行同落 `docs/core/design/{CORE-UNIFICATION,MODEL-BENCH,MODEL-SPECS,TURN-CAP-CONTINUE}.md` 与 `docs/vsc/**`；均为 legacy 迁移债（旧模块坐标 `src/*.mjs`、`webview/*.css`、`git/checkpoint.mjs` 类）。
- 本批面：本引擎输出面（锚扫描 150 档 + 行宽扫描）中 `docs/batches/**` 零行命中 ⇒ 本批（含本 §5 全部追加文本）零新增违规；红 = 存量基线，非本舱引入，只报不改。

- 归口说明（精确化）：上列 `docs/core/**`、`docs/vsc/**` 档在工作树中处于 M 态且非本舱笔迹（本舱唯一文档面写 = 本批档）；故读数只断言「非本舱引入」，其归属（存量 or 他批）不在本舱判定面。

#### 派单面登记：U1（删除 ⇒ 同源页随动）· 提交上游确认（收口轮）

- **实装面** ✓：依 §2.4 ⑥ 第四点（`:210`）且属父侧 A-3b 派单面 ⇒ 已落形 + 机检 U121（回执 `ok` ⇒ `closeTab(本键)` + 同尾页随动；`ok:false` ⇒ 零动作）。
- **待确认**：§2.8（`:240`）载「**不确认 ⇒ 该项退为零动作**」；本舱全档检索（§1 / §2 / §4）**未见父侧对 U1 的显式确认记录** ⇒ 本项列**提交上游确认**（收口轮）。
- **设计面观察**：`docs/desktop/design/PROJECT.md:277`（T-DSK26）五例均属「关闭」路径——删除路径未入该行；确认后可由设计侧一行补载。
- **退形面（若上游不确认）**：摘「`session:delete` 回执 ⇒ 同源出口」分支 + U121 例即可（估）；④ 改名 / 删除控件本体不受影响。

### A-2a-1 归约半（`ev:question` / `ev:task` 写切片 + `clearQuestion`）—— #69（eng-coder · 2026-09-27）

**舱面** = §1.22 三拆之 A-2a-1（2 档）+ §1.23 授权同笔两笔（`test/host-floor.test.mjs`）；**四项** = ①两通道改写切片 ②新增 `clearQuestion` 纯动作（导出面七）③提问置位标（`approval` 码）④`stopped` 终局摘项 + 清位标；另并 §1.23 两处归口（①两切片归约器首写自种 · `store.mjs` 零动 × ②`stopped` 终局摘项入境）✓。

#### 交付摘要

**① 两通道改写切片**（`thincoder-desktop/renderer/events.mjs:161-174`）：

- `ev:question` ⇒ `questions[ev.key] = { promptId, question, options }` —— 键白名单 `QUESTION_KEYS`（`:32`）⇒ 表外键不落 ∧ **同键就地替换零叠条** ∧ **首写自种**（`{ ...(state.questions ?? {}), [ev.key]: item }`）∧ **不入 `pool`**。
- `ev:task` ⇒ `tasks[ev.key] = items` —— 载荷逐字原样 ∧ 非数组 ⇒ `[]`（防御读形 · 沿 `applyPage` 同形）∧ 同键就地替换。
- 零键门：两切片任意键可写 —— 非活动会话的项与位标同样在场（切回即见卡）。

**② `clearQuestion(state, key)` 纯动作**（`events.mjs:329-338` · 导出面七之六 = `:12`）：

- 摘本键项 + 清本键 `approval` 位（位标键源 = **切片键** —— 与置位源 `ev.key` 同值同源）；**无本键项 ⇒ 原引用**（`Object.hasOwn` 判据 ⇒ 幂等：重复回执 ∥ 无项终局零写）；他键零动。
- 两调用面 = 出站回执 `ok` 真（`renderer/mount-cards.mjs:21` 导入 · `:52-53` 调用 —— **#70 已落并已消费本导出** ✓，含 `promptId` 守卫）∥ `stopped` 终局（本档 `onActivity`）。

**③ 提问置位标**（`events.mjs:165-166`）：`onQuestion` 同处按**同码闭集**置本键 `approval` 位（`badgeStamps` 单源 —— 与 `onApproval` `:154` 同形；`BADGES` 闭集 `:26` 零改）。

**④ `stopped` 终局摘项 + 清位标**（`events.mjs:198-202`）：`onActivity` 回合尾径 —— `stopped` 先 `clearQuestion(ev.key)`（引用最小变动 = `tail` 三元）再结算：清 `approval` + 去 `running` + 置 `done`（同一次 set 到位）；**`done` 径不摘**（机检钉 `test/events-reduce.test.mjs:240`）。三径判据零改（`isTurnTail` `:180-185`）。

**档头收正**（`:2` `:6` `:12` `:13` `:16-17`）：九通道写切片 · 导出面七（含 `clearQuestion`）· 卡面两切片纪律条（首写自种 / 零键门 / 同键就地替换）。

**FILES CHANGED**（3 档 · 全在 `thincoder-desktop/`）：

| # | 档 | 终态行数 | 变动（实测） |
|---|---|---|---|
| 1 | `renderer/events.mjs` | **338** | 头注收正 + `QUESTION_KEYS` + `onQuestion` / `onTask` + reduce 两 case（`:164` / `:173`）+ `onActivity` stopped 径（`:198`）+ `clearQuestion`（`:329-338`）—— A-1b 终态 299 ⇒ **+39** |
| 2 | `test/events-reduce.test.mjs` | **249** | 头注 + 导入 + U88 两钉换断言对象（`:105-108` · §1.21㈠ 授权 · 不删断言）+ 新例 `T-DSK24`（`:206-249`）—— A-1b 终态 201 ⇒ **+48** |
| 3 | `test/host-floor.test.mjs` | **284** | 仅 §1.23 授权两笔：`fresh` 清单摘 `renderer/events.mjs` + 例外面补 `{ rel: "renderer/events.mjs", limit: 500 }`（`:271`）—— 零净增行 |

**机检覆盖**（`T-DSK24`）：首写自种（原态零槽）· 载荷三键原样（表外键不落）· 同键就地替换零叠条 · 他键写他键槽（本键零动）· 摘项 + 清本键码 · 幂等原引用 · **非本键 ⇒ 原引用**（`:230`）· `approvalOnly` 臂（`:231-233` —— 审批码在 ∧ 提问项无 ⇒ 原引用，**不误清审批码**）· `stopped` 摘项（`:238`）· `done` 不摘（`:240`）· `tasks` 载荷逐字 / 非数组 ⇒ `[]`（`:247`）。

**验证**：`cd thincoder-desktop && npm test`（= `node test/run.mjs` —— `package.json:9` 单源）⇒ **tests 129 ∕ pass 129 ∕ fail 0 · exit 0**（输出含 `✔ T-DSK24 …`）。记录内 A-3b 基线 128 ⇒ 差额不归因（邻舱用例档同期在册）。

#### 决策透明表

| # | 决策 | 依据 |
|---|---|---|
| D1 | 两切片写者住归约器（首写自种）· `store.mjs` 零动 | §1.23 归口①（其面已交付 ⇒ 归约器自种） |
| D2 | `questions[key]` = **单对象** `{ promptId, question, options }` ∥ `tasks[key]` = `items` 数组 | `IPC.md` §1 载荷形 · `RENDERER.md` §1.1 同键就地替换零叠条 · `UI.md` §1 卡面读取集 |
| D3 | `QUESTION_KEYS` 白名单（表外键不落）· `items` 非数组 ⇒ `[]` | 零新键（沿 `APPROVAL_KEYS` `:30`）· 防御读形（沿 `applyPage`） |
| D4 | 提问置位与 `onApproval` **共用** `badgeStamps`（同码共面） | `UI.md:23` 码位两面点名（与审批门同码同词） |
| D5 | `stopped` 摘项 = `onActivity` 尾**前置**（一次 set 到位） | 引用最小变动（`tail` 三元）· 零第二写点 |
| D6 | 无本键项 ⇒ 原引用 | 沿 `clearApproval` 同律（幂等） |
| D7 | 新例住本档原址 · 例号 `T-DSK24` | §1.22 两档舱面 · §1.17 点名该归约即机检面 |
| D8 | `host-floor` 两笔同笔落 | §1.23 授权 + §1.18 常设条款（新增 / 改写面者同笔落齐闸面登记） |

#### 审计与代码评审轮次与终态

- **分歧审计**（只读 explore · 对照设计逐项）：**CLEAN** —— 零代码级偏差；发现族 = 设计档坐标 / 登记面漂移 ⇒ 入下「只报不写」清单。
- **代码评审轮 1**（advisor `type=code`）：**VERDICT pass**（0 must-fix · 3 🟡 · 4 🔵）⇒ **fix round = 0**（零代码改动项）。
- **终态 = clean（收敛）** —— 交付面 = 上「交付摘要」（129 ∕ 129 ∕ 0 终态复跑）。
- ⚠ **如实记**：评审报告原文因会话压缩未留存（追索两路 = `memory` 检索（空）· `.thincoder/sessions`（未果）⇒ 停止追索）；下响应表以评审后自记 + 本轮逐条实读复核为准；余 1 条 🔵 主题不可逐字复述（表尾行）。

#### 响应表（7 条 —— 3 🟡 · 4 🔵 · 0 must-fix · 处置全为「只报」）

| # | 级 | 发现 | 处置 |
|---|:--:|---|---|
| 1 | 🟡 | `approval` 码**双域共用**（审批 ∪ 提问）· 两清码面**互不视**：`clearQuestion` 摘项即清码（`:334` —— 审批项在场不察）∥ `clearApproval` 池空才清码（`:321-323` —— 提问项在场不察）⇒ 两向皆可「项在而码缺」 | **只报（设计缺口）** —— 清码判据宜 = 本键剩余两项联合；同键两域并存的**可达性未证**（评审侧）⇒ 归设计侧收口（`UI.md:23` 码位两面条） |
| 2 | 🟡 | 两新切片**无生命周期消解窗口**：关标签 / 删会话不清 `questions` / `tasks`（零清者）；而槽号可再分配 —— 删除 = 清单条目 / 槽文件联动（`src/main/session-actions.mjs:56`）∧ 新会话取**最小空闲号**（`thincoder-core/session-lifecycle.mjs:215-216` 实读）⇒ 陈旧切片可挂新会话 | **只报（设计缺口）** —— 与 A-3b `railForm` 消解窗缺口同族 ⇒ 归设计侧（消解窗 = 关标签 / `session:delete` 回执） |
| 3 | 🟡 | `renderer/events.mjs` 越预算：**338 > 300**（§1.23 预判 ≈313 ⇒ 实超 25）· 而拆分预案已被 §1.23 否 | **只报** —— 例外在册（`test/host-floor.test.mjs:271` limit 500 ✓ · 距硬限 162 行）⇒ 设计面登记句归收口轮 |
| 4 | 🔵 | 断言钉**实现选择脆弱**（`:211` / `:221` 以 `Object.keys` 钉切片键面 —— 实现改形即红） | **只报**（现状与设计字面一致 · 收窄 / 放宽 = 新判据 ⇒ 设计侧先定） |
| 5 | 🔵 | `onQuestion` 无 `Array.isArray` 防御读形（`options` 逐字原样 ∥ `onTask` `items` 有）—— 非对称 | **只报**（设计未点名该字段防御形 · 消费面零节点判据兜底 ⇒ 补形 = 设计侧先定） |
| 6 | 🔵 | 键域面**可选补例**（非标签键 / 空串键的在场语义） | **只报**（现例已覆「他键写他键槽 ∧ 本键零扰」⇒ 补 = 设计侧定判据） |
| 7 | 🔵 | 主题不可逐字复述（原文未留存） | **只报 · 待回填** —— 父侧若持全文且为新条 ⇒ 按 §5 A-3b 先例回填本表 |

**评审侧机制回执**（自记）：宿主档（`src/main/**`）引用坐标机检 5 条中 4 条报 mismatch ⇒ 逐条实读复核 = 引用内容真实（mismatch 属**引用呈现式**（省略号式多引用）非失实）—— 同 §5.4 先例（只报，不改设计）。

#### 越预算 / 越声明披露

- **行数 vs 设计登记**：`renderer/events.mjs` 338（`PROJECT.md:115` 注册 295 · §1.23 预判 ≈313 ⇒ 实超 25；A-1b 终态 299 ⇒ 本舱 +39）· `test/events-reduce.test.mjs` 249（`PROJECT.md:141` 注册 162 ⇒ 预期 ~190；A-1b 终态 201 ⇒ 本舱 +48）· `test/host-floor.test.mjs` 284（两笔零净增行）。三档皆 ≤500 ✓。
- **越声明披露**（逐项理由）：`test/host-floor.test.mjs` **越 §1.22 舱面声明**（§1.22 只列 2 档）—— 依据 = §1.23 显式授权两笔 + §1.18 常设条款 ✓。零其他越声明 ∧ 零列外改动 ∧ 未触 `store.mjs` / `src/**` / 设计档。

#### 只报不写清单（设计面非本舱写权 —— 交收口轮）

- `PROJECT.md:115`（`events.mjs` 行：值 295 / 拆分预案 /「贴 300 层」⇒ 实况 = 338 + 例外在册 · 预案已被 §1.23 否）· `:120`（`store.mjs` 行载「批 A 增两切片 `questions` / `tasks`」⇒ 实况 = 归约器首写自种，`store.mjs` 零动）· `:141`（`events-reduce.test.mjs` 值 162 ⇒ ~190 ⇒ 实 249；另 `views-question` / `views-tabbar-close` 两档在册「拟新增」）· `:147`（贴 / 越 300 层九面含 `events.mjs` ⇒ 预案已被否）· `:173`（`fresh` 十八档 ⇒ 现 17 档 + 两例外）。
- `PROJECT.md:137` **核实一致** ✓（`clearQuestion` 出口面点名 = `mount-cards.mjs`，与实落相符）· `:177`（`fresh` 口径 ✓ 与实落相符）。
- `IPC.md:44`（会话键面枚举缺 `questions` / `tasks` 两新切片键 —— 枚举陈旧）。
- `UI.md:23`（码位两面条：① 两坐标随本舱增量漂移 —— 现 `events.mjs:154` / `:322`；②「同面缺口」在提问径**已不成立**（清位键源 = 切片键 = 置位源 `ev.key` ⇒ 同值同源）· 余 = 审批径（清位键源 = `activeSession`））。
- `renderer/events-subscribe.mjs:17`（「`ev:question` / `ev:task` 订阅在场、**不写切片**」⇒ 已随本舱证伪 · 邻舱档非本舱写权）+ `:4`（档头归约纯函数枚举缺 `clearQuestion`）。
- **相邻观察**（非本舱）：`test/files.mjs` 现 28 条 —— `test/views-question.test.mjs`（设计登记名）不在册，`test/agent-host-question.test.mjs` 在册（设计未登记名）⇒ 归 A-2a-3 / 在途 #70 收口面。

**设计面映射一条**：§1.21㈠ 括号「非本键 ⇒ 原引用」半句在 reduce 两通道**不可达**（切片零键门 ⇒ 任意事件键皆本键）—— 可达处 = `clearQuestion` 非本键径（机检 `test/events-reduce.test.mjs:230`）⇒ 只报（映射记明）；§1.21㈠ 原钉 `:104-105` ⇒ 实落 `:105-108`（本舱增量后坐标）。

#### fix round

**0 轮** —— 审计 CLEAN ∧ 评审 0 must-fix ⇒ 零代码改动项；**终态 = clean（收敛）**。

### A-2a-2（#70）· 卡树三档（全新建 · 三档零改既有档）

**§5.1 交付摘要**

| 档 | 实读行数 | 形态要点（实核面） |
|---|---|---|
| `thincoder-desktop/renderer/views/question.mjs`（新） | 106 | 纯描述符（题干行 → [给答项?] → 作答区）· 卡根 `data-card="question"` + `data-prompt-id`（`:86-88`）· 给答项 `data-action="question:<i>"`（i 自 1 · 词 = 选项串原样 · `:46-50`）· 提交 `question:answer`（`:74`）· 取消 `question:cancel`（`:75`）· `options` 空 ∥ 缺 ⇒ 零操作区节点（`:41`）· 零 `store.mjs` import · 出站 `respondQuestion`（`:96` `export function respondQuestion(host, promptId, answer)`）：回执失败 ⇒ `console.error` + `null`（`:96-106`，与 `views/approval.mjs:140-150` 逐字同形） |
| `thincoder-desktop/renderer/views/plan.mjs`（新） | 41 | 纯描述符**零出口** · 卡根 `data-card="task"` · 逐行标题 + 状态词 · `PLAN_WORD = {pending: sub.queued, in_progress: sub.running, done: sub.done}`（复用核域键 · `thincoder-core/i18n.mjs:50-54`）· 表外码 ⇒ 零状态词节点 · 空 / 非数组 ⇒ `null`（卡不在场 · `:35`）· `planTree(items)`（`:33`） |
| `thincoder-desktop/renderer/mount-cards.mjs`（新） | 144 | 卡族挂载 + 出站：`CARD_ORDER = 待审批 → 提问 → 计划`（`:32`）· 插点 = 首个更高序卡之前 ⇒ `data-pill` 之前 ⇒ 末位（`:68-76`；`data-pill` 实在 `views/chat.mjs:101`）· 退场**非乐观**：回执 `ok` 真才 `clearQuestion`（`:49-54`）；抛 / 拒 ⇒ 卡仍在场 · 幂等签名 = `prompt-id + 码序 + textContent`（`:65`）· 入口**现刻读** `activeSession`（`ok !== true` ⇒ `false` 零写）→ promptId 守卫 → `clearQuestion` · `submitAnswer`（`:43` `export async function submitAnswer({ store = defaultStore, host } = {}, promptId, answer)`）/ `attachCards` / `mountCards`（`:97` `export function mountCards(root, state, handlers = {})`） |

**出口契约**（三出口值映射 · 与 `docs/desktop/design/IPC.md:59` 一致）：选项串原样 ∥ 输入串 ∥ 取消 ⇒ `answer: null`（`mount-cards.mjs:123/131/75` + `question.mjs:98` 携 `{ promptId, answer }`）—— 宿主侧对偶 `question:respond` 已注册（`src/main/ipc.mjs:91` 白名单 · payload `{ promptId, answer }` `:142` · `preload.cjs:26`）；取消语义对偶 = `QUESTION_CANCELLED`（`src/main/suspensions.mjs:21`）。

**零改面**：本舱 = 三档全新建；既有档零改动（零越声明面 —— git 面三档皆未跟踪新档，既有档零 diff）。

**§5.2 决策透明表**

| # | 决策 | 依据 / 权衡 |
|---|---|---|
| 1 | 词键名自拟三键 `question.input` / `question.answer` / `question.cancel` | 设计授权（批档 §1.22 词键名自拟）；待 #71 落 i18n（107 → 110 · 表头枚举同改）—— 缺键不抛（`thincoder-core/i18n.mjs:304-308` 解析序：宿主 → 核投影 → 键名自身） |
| 2 | 状态词**零新词**：复用核域三键 `sub.queued` / `sub.running` / `sub.done`（排队中 / 运行中 / 完成） | `chat-tool.mjs:20-23` / `tabbar.mjs:34-35` 同键；省 i18n 面三键；语域由 `.thincoder` 在册表核实 |
| 3 | 幂等签名含 `textContent`（不只 `data-*` 机器读面） | 覆盖「同 `prompt-id` 下选项 / 文本变更」面；R1 #4 登记的理论碰撞面（实网不可达）保留现判据、不入签名 —— 加固项待父侧裁定 |
| 4 | 入口「**现刻读** `activeSession` + `ok !== true` ⇒ `false` 零写」 | 沿挂载函数零副作用形（同型先例 `views/chat.mjs:181-190`）；回执面不变式交宿主 |
| 5 | 退出面沿 `approval` 域**逐字同形**（失败自记 `console.error` + `null`） | 双域一致形降低认知面成本；`views/approval.mjs:140-150` 为先例 |
| 6 | 行数实读 106 / 41 / 144 vs 设计档 §4.1 估值 120 / 70 / ~55（`PROJECT.md:133/134/137`） | mount-cards 超估（~55 → 144 · 约 2.6×）：该档承载挂载 + 三出口 + 签名 + 装配四责；**设计档 §4.1 行数值待父侧 / eng-designer 随动**（本舱不改设计档）；U95 臂清单随动项见 §5.4 R1 #1 |

**§5.3 验证**（命令 + 结果）

- 冒烟（平 node 三档直测）：**33 checks / 167 asserts / 0 fail**。
- `node --check` ×3：Syntax OK（三档）。
- 桌面套件 `npm test`（thincoder-desktop）：**129 / 129 pass · 0 fail**（三档在盘状态下全绿）。
- 设计锚逐条实核：R1 评审面（§5.4 逐字留存）——「形态单源逐条在形 · 无 🔴 · 无 must-fix 🟡」。

**§5.4 审计与评审轮次 · 终态**

**原文留存说明**：轮 1 / 轮 3 报告全文已从超限落地日志恢复并逐字留存于下 —— 轮 1 = `C:\Users\liwei\.thincoder\tool-results\1790455949395-call_01_l6oB6G1SV629EGs0b1nu9966.log`（20:52 落地）· 轮 3 = `C:\Users\liwei\.thincoder\tool-results\1790456462095-call_00_LM3goePakvITurKkt45c7719.log`（21:01 落地）；轮 2 原文未单独落地，其结论句逐字住轮 3 原文内（下引）。

| # | 面 | 轮次 | 终态 |
|---|---|---|---|
| 1 | 内部分歧审计（`explore` · 只读 · 同步） | ×1 | **clean** —— 四类偏差（部分实现 / 静默简化 / 文档漂移 / 清单外改动）零命中（原文随会话压实未逐字留存；其实质发现均已被 R1 范围外记录独立重检覆盖） |
| 2 | 代码评审（`advisor` type=code） | 轮 1 | **pass** —— 0 🔴 · 1 🟡（协调 · 不阻断）+ 4 🔵（2 已修 · 2 可选未变） |
| 3 | fix round | 1 轮 | 4 处注释坐标 `RENDERER.md` §2 → §1.1（`mount-cards.mjs` ×3 · `plan.mjs` ×1）—— 仅注释、行为面零改动、零新问题（轮 3 逐处实核） |
| 4 | 代码评审 | 轮 2 | **pass** —— 修复核对通过；残留 = 1 🟡（协调）+ 2 🔵（可选），均不阻断 |
| 5 | 代码评审 | 轮 3（终态复核 · 实跑） | **pass** —— 前轮 5 项逐项 · 修复声明逐处为真 · 三档内 grep `§2` ⇒ 0 命中 · 行为面零改动 |

**轮 1 逐字留存**（`advisor` 报告体）：

> ## 评审面与实读基线
>
> **评审对象**（按声明，未推断）：`thincoder-desktop/renderer/views/question.mjs`（106 行）· `renderer/views/plan.mjs`（41 行）· `renderer/mount-cards.mjs`（144 行）——三档全读、全在盘（实际路径 = `thincoder/thincoder-desktop/...`；声明中的仓根前缀 `thincoder-desktop/` 在盘为子目录形态，非缺档）。三档皆 ≤300（AGENTS.md 文件尺寸线）✓。
>
> **形态与判据面（逐条实核通过 · 未列表即无问题）**：
> - `UI.md:23` 提问呈现落形逐项兑现：卡根 `data-card="question"` + `data-prompt-id`（`question.mjs:86-88`）· 子序 = 题干行 → [给答项?] → 作答区（`:90`）· 给答项 `data-action="question:<i>"` i = 1 起 + 词 = 选项串原样（`:46-50`）· 提交 `question:answer`（`:74`）· 取消 `question:cancel`（`:75`）· `options` 空 ∥ 缺 ⇒ 零操作区节点（`:41`）。
> - 三出口值映射与 `IPC.md:59` 一致：选项串原样 ∥ 输入串 ∥ 取消 ⇒ `answer: null`（`mount-cards.mjs:123/131/75` + `question.mjs:98` 携 `{ promptId, answer }`）。
> - 退场**非乐观**：回执 `ok` 真才写（`mount-cards.mjs:49-54`）· 抛 / 拒 ⇒ `console.error` + `null`（`question.mjs:96-106`，与 `approval.mjs:140-150` 逐字同形）✓ 清位单源 = `events.mjs:329-338`（摘本键项 + 清 `approval` 码，两调用面之一即本档）✓。
> - `UI.md:24` 计划面：卡根 `data-card="task"` · 逐行标题 + 状态词 · 空列表 ⇒ 返回 `null`（卡不在场，`plan.mjs:35`）· 同 key 就地替换（`mount-cards.mjs:102-113`）✓。词键映射经实核无误：`pending→sub.queued`(排队中) / `in_progress→sub.running`(运行中) / `done→sub.done`(完成)（`thincoder-core/i18n.mjs:50-54`），码域 = 核 `task` 工具三值（`thincoder-core/agent-tools/task.mjs:37/50`）✓。
> - `RENDERER.md:54` 插入点纪律：`cardAnchor` = 首个更高序卡之前 ⇒ `[data-pill]` 之前 ⇒ 末位（`mount-cards.mjs:68-76`；`data-pill` 实在 `views/chat.mjs:101`）✓；`RENDERER.md:49` 判据面：两视图档纯构树零 DOM、机器读面全落 `data-*`、零 `store.mjs` import ✓；`RENDERER.md:42` 接线两态（handlers 缺 ⇒ `disabled: true`，锚恒在）✓；文案一律 `t()`、代码面零 Han（Han 仅住块 / 行注释内——与 `views.test.mjs:186-187` 的 `stripComments` 判据同形）✓。
> - 消费面契约实核：`responsive` 依赖全在——`store.mjs:310` / `events.mjs:329` / `dom.mjs:21` / `chat-tool.mjs:36,43` / `i18n.mjs:304` 皆存在；`wantedCards` 读形与归约器写形一致（`events.mjs:161-174`：`questions[key]={promptId,question,options}`、`tasks[key]=items`）✓；`store.set` 走 `Object.entries(next)`（`store.mjs:295`）⇒ 自种新键可通知 ✓。跨舱佐证：A-2a-1 交付核已独立实读本档两处（批档 §5 `renderer/mount-cards.mjs:21` 导入 · `:52-53` 调用）✓。
>
> | # | File | Severity | Issue | Suggestion |
> |---|------|----------|-------|------------|
> | 1 | renderer/{views/question.mjs, views/plan.mjs, mount-cards.mjs} | 🟡 | **协调项（非缺陷 · 不阻断）**：三新档未入 U95 行数硬臂名集——`test/host-floor.test.mjs:253-264` 的 `fresh` 清单（"renderer/events-subscribe.mjs", "renderer/mount-pool.mjs", 等）无本舱三档 ⇒ 三档现**不在** ≤300 机械闸内（闸内档触线即红，闸外档靠人工审视）。现行风险 ≈ 0（实读 106 / 41 / 144 行）；同态先例 = A-1a `mount-composer.mjs` / A-1b `mount-sessions.mjs` 均按「父侧臂清单随动项」收口，`test/host-floor.test.mjs:261` 自注亦明载「其余新档行数面 … = §4.1 值列表（父侧臂清单随动项）」 | 归父侧收口 / 臂清单随动轮（本舱不自改闸面名集——沿 A-1a/A-1b 同律）；若要求本舱同笔落，回授权后加三名即可（机械一笔） |
> | 2 | renderer/mount-cards.mjs | 🔵 | 设计坐标**三处引错节号**（R7c 文档卫生 · 死指针）：`:3` 与 `:32` 引「`docs/desktop/design/RENDERER.md` §2 插入点纪律条」、`:15` 引「§2 判据面条」；二者实住 **§1.1**（`RENDERER.md:54` 插入点纪律条 · `:49` 判据面条），而 §2 = 有界渲染窗口（起 `RENDERER.md:64`）⇒ 三处坐标不可定位 | 三处改引 `§1.1`（或只留「`RENDERER.md` 插入点纪律条 / 判据面条」不写节号——抗漂移形沿 `preload.cjs` 已采记法） |
> | 3 | renderer/views/plan.mjs | 🔵 | 同型一处：`:7` 引「判据面 = `docs/desktop/design/RENDERER.md` §2 判据面条」——实住 §1.1（同 #2） | 同 #2 |
> | 4 | renderer/mount-cards.mjs | 🔵 | 幂等签名**理论碰撞面**（低危 · 实网不可达）：`:65` 中 `codes` 以 `\u0000` 分隔，但**文本面 = 全子树 `textContent` 无分隔连写**，且出口锚集（`data-action` 序）不入签名 ⇒ 不同卡可同签名（如同 `prompt-id` 下 `options` = `["a","b"]` 与 `["ab"]`；两者 textContent 皆 `ab`）⇒ 判等 ⇒ **漏更新**，留 stale 出口锚（点按送出已不在的选项串）。实网不可达（换问 ⇒ `prompt-id` 必变 · 选项被滤后串序即所发值），故非缺陷 | 可选加固：文本面按子节点逐个拼接（或把出口锚序 / 选项计数一并入签名）——纯加固，不改现判据 |
> | 5 | renderer/views/plan.mjs | 🔵 | 行项**零过滤**（与问题卡侧非对称）：`:28` `children: [item?.title, word]` 对 `items` 内非对象 / 全缺项仍落空 `plan-row`（零标题零状态词）；而 `question.mjs:29` `optionList` 逐项滤除非串 / 空串。核 `task` 工具已保证（`thincoder-core/agent-tools/task.mjs:38`「items with empty titles are silently dropped」· 状态归一 `:21-22`）⇒ 现网不可达 | 可选：补逐项过滤（沿 `optionList` 同形）∥ 在行函数注释明示「上游已保证，不重复滤」——属风格取舍，不加判据 |
>
> ### 范围外记录（**不判级** · 呼应声明的排除面）
>
> 1. **`views/chat.mjs` 卡序接缝（声明已排除 · 归 #71）**：`chat.mjs:204-208` `blockAnchor` = 首个 `[data-card="approval"]` ∥ 药丸（两锚皆缺 ⇒ 末位），只认审批族；`chat.mjs:210-213` `cardAnchor` = 药丸之前（approval 卡「后到者居尾」）。后果：本档 `question` / `task` 卡在场时（无审批卡、无药丸）新到块被**末位追加** ⇒ 屏序成「卡 → 块」，与 `RENDERER.md:54`「根子序 = [摘要块?] → 块序列 → [卡序列?] → [药丸?]」及「待审批 → 提问 → 计划」固定序相抵。本档侧插点判据已按该条单源落形（`mount-cards.mjs:34/68-76`），接缝另半属 #71 声明面 —— 仅登记，不作本舱发现。
> 2. **`events.mjs` `clearQuestion` 清位判据单域（不在本评审面 · 已有登记）**：本档出口面消费该导出（`mount-cards.mjs:21/53`），其语义 = 摘本键项即清本键 `approval` 码（`events.mjs:334`），与审批域互不视（同会话审批项在场时亦清码）—— A-2a-1 代码评审已报同条（批档 §5 其响应表 #1「只报（设计缺口）」）并转设计侧收口，本舱不重复要求。
>
> **总判**：三档对「形态单源」（`UI.md` §1 提问呈现 / 计划面行 + `RENDERER.md` §1.1 插入点纪律条 / 判据面 / 接线形通则）**逐条在形**，出口值映射 / 退场非乐观 / 清位单源 / 卡片序插点 / 零 `store` import（两视图档）/ 文案 `t()` / 零 `node:` 零裸包全部核过；无 🔴、无 must-fix 🟡 —— 唯一 🟡 为父侧协调项（臂清单名集），按规则不阻断。
>
> VERDICT: pass

**轮 2**（结论句逐字 · 住轮 3 原文内引用）：「残留为 1 项父侧协调 🟡 + 2 项可选加固 🔵，按规则均不阻断」· VERDICT: pass —— 修复核对通过（`mount-cards.mjs` ×3 · `plan.mjs` ×1 四处坐标实核为真且落点属实）。

**轮 3 逐字留存**（`advisor` 报告体 · 终态复核）：

> # 轮 3 复核（前轮 5 项逐项 · 仅本舱三档 + 前轮所点落点）
>
> **前轮修复声明核对**：声明「4 处注释坐标 `RENDERER.md` §2 → §1.1」（mount-cards.mjs ×3 · plan.mjs ×1）—— 本轮 fresh 复读**逐处为真且落点属实**：
>
> - `RENDERER.md:26: ### 1.1 视图面形态：纯描述符 + 薄挂载`（§1.1 自 :26 起）· `RENDERER.md:64: ## 2. 有界渲染窗口`；被引三条均实住 §1.1：`:42: - **接线形通则**：视图档收 handlers 面的控制项**两态落形**...` · `:49: - **判据面**：纯构树**零 DOM** ⇒ 视图行为可在平 node 直测...` · `:54: - **插入点纪律（批 A 扩三卡）**：块节点插入点 = **首个卡节点之前**...`。
> - 三档内 grep `§2` ⇒ **0 命中**（修正后无死指针残留）。
>
> **行为面零改动复核**（三档 fresh 全读，行为行与前轮记录形一致）：`mount-cards.mjs:43: export async function submitAnswer({ store = defaultStore, host } = {}, promptId, answer) {` · `:97: export function mountCards(root, state, handlers = {}) {` · `:134: const paintCards = (state = store.get()) => mountCards(document.querySelector(CARDS_SLOT), state, { onAnswer, onAnswerDraft })` · `question.mjs:96: export function respondQuestion(host, promptId, answer) {` · `plan.mjs:33: export function planTree(items) {` —— 除注释文本外无功能面改动，未引入新问题。
>
> | # | Orig# | File | Severity | Status | Notes |
> |---|-------|------|----------|--------|-------|
> | 1 | 1 | test/host-floor.test.mjs（属 #71 面 · 本舱排除） | 🟡 | 未变（协调项 · 不阻断） | U95 行数硬臂 `fresh` 清单仍无三档：`host-floor.test.mjs:258: "renderer/events-subscribe.mjs", "renderer/mount-pool.mjs",`（:253-264 全清单读核）；grep `mount-cards\|views/plan\|views/question` 于该档 ⇒ 0 命中。父侧臂清单随动项（同 A-1a/A-1b 律）；现风险 ≈ 0（三档 ≤ 145 行 ≪ 300） |
> | 2 | 2 | renderer/mount-cards.mjs | 🔵 | **已修复（本轮复核通过）** | `:3: * 插入点纪律单源 = \`docs/desktop/design/RENDERER.md\` §1.1 插入点纪律条）：` · `:15: *   ⑥ 词面读数 = 接线面（视图档零 DOM —— \`docs/desktop/design/RENDERER.md\` §1.1 判据面条）：本卡` · `:32: /** 卡序闭枚举（**单源** = \`docs/desktop/design/RENDERER.md\` §1.1 插入点纪律条）：待审批 → 提问 → 计划；` —— 三处落点实核（RENDERER.md:54 / :49 ∈ §1.1）✓；另 `:117: // ─── 装配（接线形通则 = \`docs/desktop/design/RENDERER.md\` §1.1）────────────` 亦核 = `RENDERER.md:42 ∈ §1.1` ✓ |
> | 3 | 3 | renderer/views/plan.mjs | 🔵 | **已修复（本轮复核通过）** | `:7: *      码面不变 —— 判据面 = \`docs/desktop/design/RENDERER.md\` §1.1 判据面条）；表外码 ⇒ **零状态词节点**` —— 落点 = `RENDERER.md:49`（判据面条）∈ §1.1 ✓ |
> | 4 | 4 | renderer/mount-cards.mjs | 🔵 | 未变（可选加固 · 不阻断） | `:65: return \`${node?.getAttribute?.("data-prompt-id") ?? ""}\u0000${codes}\u0000${node?.textContent ?? ""}\`` —— 签名面同前轮；实网不可达（换问 ⇒ prompt-id 必变），纯加固项 |
> | 5 | 5 | renderer/views/plan.mjs | 🔵 | 未变（可选 · 不阻断） | `:28: children: [item?.title, word],` —— 行项零过滤同前轮；核 `task` 已滤 ⇒ 现网不可达，风格取舍 |
>
> **范围外记录（不判级）**：`views/chat.mjs` 卡序接缝与 `events.mjs` `clearQuestion` 单域判据 —— 按声明排除 / 已有登记，本舱不重复要求。
>
> **总判**：前轮全部 🔴（0 项）无遗留；声明 4 处坐标逐处实核为真、落点正确，改动仅注释、行为面零变化、无新增问题；残留 = 1 项父侧协调 🟡 + 2 项可选加固 🔵，均不阻断。
>
> VERDICT: pass

**§5.5 只报不写（面外登记 · 本舱零动作）**

1. `views/chat.mjs` 卡序接缝（`blockAnchor` 只认审批族 / `cardAnchor` = 药丸之前）⇒ `question` / `task` 卡在场时新到块末位追加，与 `RENDERER.md:54` 根子序相抵 —— **归 #71**（R1 范围外记录 1 + 轮 3 复述）。
2. `events.mjs` `clearQuestion` 清位判据单域（摘本键项即清本键 `approval` 码 · `events.mjs:334`）—— A-2a-1 已报（其 §5 响应表 #1「只报（设计缺口）」）并转设计侧收口，本舱不重复要求。
3. `test/host-floor.test.mjs:253-264` U95 行数硬臂 `fresh` 清单无三档 —— 父侧臂清单随动项（R1 #1 🟡 · 沿 A-1a/A-1b 同律）。
4. 设计档 §4.1 行数值 vs 实读：`views/question.mjs` ~120 → **106** · `views/plan.mjs` ~70 → **41** · `mount-cards.mjs` ~55 → **144**（`PROJECT.md:133/134/137`）—— **父侧 / eng-designer 随动**（本舱不改设计档）。
5. 三键 `question.input` / `question.answer` / `question.cancel` 待 #71 落 i18n（107 → 110 · 表头枚举同改）。

**§5.6 交接（#71 面）**：`app.mjs` 装配（`attachCards` 调用面）· `test/files.mjs` 清单 · `views-question.test.mjs` 新测 · CSS 三卡类 · `chat.mjs` 卡序 / `blockAnchor` 不认 `question` / `task`（= §5.5.1）· `clearQuestion` 清位单域（= §5.5.2）。

**§5.7 越声明披露**：**零** —— 本舱写入面 = 仅声明三档（全新建 · git 面皆 `??` 未跟踪新档）；工作树另有批 A 他舱未提交改动（M 面 100 项 · 他舱动作，非本舱）与同批新档（`mount-composer.mjs` / `mount-sessions.mjs` / `views/tabbar.mjs` 等），本舱未触。

**§5.8 残留（不阻断）**：R1/R3 表 #4（签名理论碰撞面 · 实网不可达）+ #5（plan 行项零过滤 · 核侧已滤）—— 均属可选加固 🔵，本舱保留现判据、未改动；父侧如裁定加固再入随动轮。

**终态 = `clean`**（内部分歧审计 clean + 代码评审三轮全 pass + fix round 1 收敛 + 桌面套件 129/129 全绿）。

### A-2a-3（#71）· 卡族接线 + 卡面用例（三键两语 · 两锚加宽 · 装配挂点 · 卡族 CSS 落形 · `ok:false` 径补诊）

**本舱面**（声明 + 裁定并档）= 批档 §1.22 六档 + §1.25 三补充面（`i18n.mjs` 三键两语 107 ⇒ 110 · `views/chat.mjs` 卡序接缝两锚 · 三卡 CSS）+ §1.26（CSS 单源 = `renderer/chat.css`）+ §1.27 裁定 (a)（`ok:false` 径补诊授权 —— 越声明面披露见本块 §5.6）。
**禁改面**（diff 实核零触碰）：`index.html` · `renderer/store.mjs` · `renderer/events*.mjs` · `renderer/mount-composer.mjs` / `mount-sessions.mjs` / `mount-pool.mjs` · 其余 views 档 · `src/**` · 其余测试档 · `test/views-harness.mjs`。

**§5.1 交付摘要（A-2a-3）**（口径 = 内容行数〔文末换行不计〕· 实读 2026-09-27）

| 档 | 实读 | 本舱笔面（实核坐标） |
|---|---|---|
| `renderer/i18n.mjs` | 317 | 提问卡三键两语同增（`:76-78` en · `:192-194` zh = `question.input` / `.answer` / `.cancel`）+ 档头枚举 107 ⇒ **110**（`:5-6` 算式 `13+4+6+7+7+3+48+10+9+3` = 110 ✓） |
| `renderer/views/chat.mjs` | 289 | `blockAnchor` 加宽 = 三族任一 `[data-card]`（`:209-212`，取节点 `:211`）· `cardAnchor` 加宽 = 首个提问 ∥ 计划卡（`:216-220`，取节点 `:218`）—— A-2a-2 §5.5.1 登记接缝已兑现（R1 范围外记录 1 核销） |
| `renderer/app.mjs` | 222 | 装配：`:22` import（`attachCards` + `CARDS_KEYS`）· `:48` 实例化 · 三挂点 `:161` / `:165` / `:170`（重挂面 + 增量面前置）· 重绘触发切片 `:221` |
| `renderer/chat.css` | 254 | 卡族落形 `:172-254`（10 类：`.question-card / head / options / option / answer / input / submit / cancel` + `.plan-card / row`）—— 单源 = `chat.css`（§1.26 裁定 · 零新变量名） |
| `renderer/mount-cards.mjs` | 149 | `:51-55` 拒收径补诊（`ok:false` ⇒ 记 `receipt?.reason`；抛/拒半由 `receipt !== null` 守 ⇒ 恰一次零双记）· 档头 `:10-13` 同步 —— §1.27 裁定 (a) 授权面 |
| `test/views-question.test.mjs`（新建） | 359 | U122–U125 四例在册：`:95`（卡根两锚 / 子序 / 给答项逐位 / 三出口值映射）· `:145`（三族同场序 + 块锚加宽）· `:184`（`ok` 才摘 / 失败留卡 + 记错 / 已换项零写 / 空白串零 IPC / 控件缺位记错 / stopped 直摘）· `:310`（空列表零节点 / 码面原码 / 表外码零词 / 就替换不叠卡） |
| `test/files.mjs` | 15 | `:11` 登记（清单 ↔ 盘上两向自检：28 + 集成 1 = 29 ≡ 登记 29 项 ✓）—— A-2a-2 §5 相邻观察「`views-question` 不在册」项兑现 |
| `test/views-chrome.test.mjs` | 392 | U51 随动：量面锁算式 `104+3+3`（`:208-210`）· `QUESTION_WORD_KEYS`（`:78` / `:218`）· `questionTree` 入量（`:266`）· 十五视图档零 CJK 名单（`:320` 含 `question.mjs` / `plan.mjs`） |

**口径注**：本表 = 内容行数口径；R1 / R2 报告中的 `chat.css` 255 · `views-chrome.test.mjs` 393 · `mount-cards.mjs` 150 均为 `split("\n")` 总量口径 ⇒ 同值差 1，非分歧（本块统一按内容行数记）。

**归属纪律（同笔含邻舱组 · 未提交工作树）**：本舱 diff 面与他舱笔迹同笔（实核）——`i18n.mjs` 的 `rail.action.*` 三键（④ 舱面）· `app.mjs` 的 `attachSessions`（A-1b）/ `attachComposer`（A-1a）装配行 · `test/views-chrome.test.mjs` 的 U118 / U119（A-1a 面）· `test/files.mjs` 的他舱登记行 —— 上列**非本舱笔面**，本块只认本舱面；上表行数值 = **整档现值**（含邻舱增行）。

**§5.2 决策透明表（A-2a-3）**

| # | 决策 | 依据 / 权衡（实核） |
|---|---|---|
| 1 | 三卡 CSS 落 `renderer/chat.css`（非 `styles.css`） | §1.26 裁定 + `PROJECT.md:112` 单源面 + 审批卡先例（`chat.css:129-170`；本段 `:173` 注释逐字「卡面沿 `.approval-card` 段**同族同形**」） |
| 2 | 越声明面当场补 `ok:false` 径诊断（实现 1 行 + 断言 1 条） | §1.27 裁定 (a)：设计三处同句「失败 ⇒ 卡留 + `console.error`」（`PROJECT.md:275` T-DSK24 ① · `UI.md:23` · `RENDERER.md:55`）含拒收半 ⇒ 授权补齐，不转设计面收窄 |
| 3 | 「抛/拒」与「`ok:false`」两半分工（零双记） | `respondQuestion` 自记 + 返 `null`（`views/question.mjs:96-106`）；`receipt !== null` 守卫（`mount-cards.mjs:53`）⇒ 本档只记拒收半；同族先例 `mount-composer.mjs:136` |
| 4 | 词键命名 `question.input` / `.answer` / `.cancel`（3 键两语） | 键位闭集单源 = `views/question.mjs`（`i18n.mjs:23-24` 指向）；两语同增、键集相等（U51 量面锁 `:210`） |
| 5 | 卡序 = `approval → question → task`（后到族居尾不夺位） | 单源 = `RENDERER.md:54`；`cardAnchor` 逐项前插（`chat.mjs:216-220`）· `blockAnchor` 三族共认（`:209-212`）；U123 钉同场序 |
| 6 | 装配三挂点取「帧尾第 ① 步」位（先于读数 `t0`） | 卡高不入头侧增量（`app.mjs:165` 注释逐字「先于读数 t0：卡高不入头侧增量」）；重挂面清树 ⇒ 必补挂（`:161` / `:170`）；重挂触发切片 = `CARDS_KEYS`（`:221`） |
| 7 | 配色只用既有主题变量（`--accent` / `--line` / `--radius` / `--bg` / `--bg-raised` / `--fg-muted`） | 设计未点名色值 ⇒ 零新变量名、零第二字形；状态词着色只挂 `data-status` 码（`chat.css:174-175` · `:208-213`） |
| 8 | 出口只走既有窄桥 `question:respond`（取消 = `answer: null`） | 零新通道 / 零新 IPC 名（白名单面 = A-2b 舱）；三 reason 码 `unknown-prompt` / `bad-kind` / `bad-answer` 由主侧判，渲染面只记 `receipt.reason` 原码（不映射词面） |

**§5.3 验证（命令 + 读数）**

1. **桌面套件（本舱主证据）**：`cd thincoder-desktop && node test/run.mjs`（cwd = `thincoder/`）⇒ `tests 133 / pass 133 / fail 0` · 退出码 0（工具面判据：非零退出会显 `(exit code N)` —— 本 run 无此行；同法探针 `node -e "process.exit(3)"` 已验工具确会显示该行）。本舱用例读数：U122 6.34ms · U123 2.96ms · U124 82.46ms · U125 1.39ms · U51 18.68ms。
2. **语法面**：本舱 8 档逐档 `node --check`（每次 write/edit 回报 Syntax OK）。
3. **机检面（doc-check · 扫描域 = docs 150 档）**：`cd thincoder && node scripts/doc-check.mjs` ⇒ `FAIL(锚) 48 条悬空` + `FAIL(行宽) 18 行超 300 字符` —— 两类红**逐条实读零条落本批面**（`docs/batches/**`），全部落 `docs/core/**` · `docs/desktop/design/**` · `docs/vsc/**`（既有红，非本舱引入）；另有 `用例号：候选 1092 · 悬空 0` ✓（用例号面全仓零悬空）。
4. **行数面**：本舱 8 档均 ≪ 500 硬限；越 300 advisory 者 = `i18n.mjs` 317（有在册拆分预案）· `chat.css` 254（有在册预案）· `views-question.test.mjs` 359 · `views-chrome.test.mjs` 392（后二见 §5.5）。

**§5.4 审计与评审轮次 · 终态（A-2a-3）**

| 轮次 | 形式 | 结论 | 关键读数 |
|---|---|---|---|
| 内部审计 | explore 只读（对照设计） | 四类偏差 **零命中**（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST） | 3 条未独立复验（套件 · doc-check · —）· 10 工具轮用满 · 零改动 |
| 代码评审 R1 | advisor（首轮全文） | **changes-required**：🔴 1 + 🟡 2 + 🔵 4 | 🔴 = 拒收径零诊断（`mount-cards.mjs:50` 曾为静默径） |
| 代码评审 R2 | advisor（fix-claims-only） | **pass**：3 claim 全 **Fixed ✓** + 4 carried + 新可选 🔵 1 | 三面同钉（卡留 / 位标零清 / 恰一诊断携 `bad-kind`）· 零双记由 `length === 1` 反证 |
| fix round | 本舱代码面 | **1 轮收敛**（明细见 §5.7） | 修后复跑 133/133/0（见末行「复跑」） |
| 分歧审计 | subagent（内部 · 四类偏差） | **clean** | 见上「内部审计」行 |

**原文留存（逐字引 · 未复述）**

**（一）内部审计全文**（2497 字 · trace `C:/Users/liwei/.thincoder/traces/2026-09-27/38478126a2c4-3507.jsonl` `messages[35]` · `tool_call_id: call_00_8HjzfRcYt4g2e0BdMZul0878`）：

> ## 审计结论
>
> **Four deviation categories: none found.**（四类偏差均未发现）
>
> 审计面：舱 #71（A-2a-3 接线+测试舱）。读面 = 任务书声明的 7 档（`renderer/i18n.mjs` · `renderer/views/chat.mjs` · `renderer/app.mjs` · `test/views-question.test.mjs` · `test/files.mjs` · `renderer/chat.css` · `test/views-chrome.test.mjs`）+ 卡面三档（`renderer/views/question.mjs` · `renderer/views/plan.mjs` · `renderer/mount-cards.mjs`，核形用）+ 设计锚（UI.md §1 提问呈现/计划面行 · RENDERER.md:54-57 插入点纪律/卡面在场条 · IPC.md:59）。本轮零改动。
>
> ### 逐类核查证据
>
> | 类 | 核查面 | 证据 |
> |---|---|---|
> | PARTIAL | 六档落位 + 词键两族 + `files.mjs` +1 | i18n.mjs:76-78（en）/192-194（zh）三键两语同增；宿主 en 键按族实读 = 13+4+6+7+3+7+3+48+10+9 = **110**，与 views-chrome.test.mjs:210 锁值一致；files.mjs:11 登记 `views-question.test.mjs`（盘上 test/ 28 档 + integration/ 1 = 29 ≡ 登记 29 项，manifest 反查无缺口） |
> | PARTIAL | T-DSK24 ①/②/③ 用例面 | views-question.test.mjs U122（卡根两锚/子序/给答项逐位 `question:<i>` i=1 起/三出口值映射/接线两态 · :100-139）· U123（三族同场序 approval→question→task · 块锚加宽 · :157-178）· U124（回执 ok 才摘 · 失败留卡 · 已换项零写 · 空白串零 IPC · 控件缺位记错 · stopped 事件面直摘 · :215-295）· U125（空列表零节点 · 码面原码 + 词面经 `t()` · 表外码零词 · 同 key 不叠卡 · :304-348） |
> | SILENT-SIMPLIFICATION | 形态 vs UI.md:23/24、IPC.md:59、RENDERER.md:54-57 | question.mjs:84-91 卡根两锚、子序 head→[options?]→answer；:46-50 选项串原样零构造；:96-106 `question:respond` 窄桥 + 抛⇒`console.error`+`null`（不静默）；mount-cards.mjs:49-54 **退场非乐观**（`ok` 真才 `clearQuestion`）、:52 已换 prompt-id 零写、:131 空白串零 IPC；plan.mjs:27 `data-status` 原码 / :33-41 空列表⇒`null`；词键复用核域 `sub.*`（views-chrome.test.mjs:63/224 以核域键入 dict 消费，**零新词**）；卡序单源同序（mount-cards.mjs:30/34 ↔ chat.mjs:216） |
> | DOC-DRIFT | 单源落位 + 设计自洽 | 三卡 CSS 落 `renderer/chat.css:172-253`（styles.css 零 `question`/`plan-card`/`data-card` 命中 —— 未越单源，PROJECT.md:112）；RENDERER.md:54-57 已载三卡序与 `question` 退场非乐观（设计与代码同向，无「码先行」）；§4.1/「拟新增」去标 = 收口轮面，非本舱漏写 |
> | OUT-OF-LIST | 触面 = `_touchedFiles` 7 档 | 逐一对照任务书声明面（§1.22 六档 + §1.26 并 CSS）：7 档全在声明面内；`views/chat.mjs` 的 `blockAnchor` 加宽（:209-211）与 i18n 107→110 属**已披露**的并档；行数面 chat.mjs = 289、app.mjs = 223（≤300 ✓）；app.mjs 三挂载点 :161/:165/:170 + `CARDS_KEYS` 重绘 :221 齐备 |
>
> ### 未独立复验项（如实声明，非偏差）
>
> 1. **`cd thincoder-desktop && node test/run.mjs` 全绿**（报告称 133 pass/0 fail）——本审计装配无执行工具，**未复跑**。可证部分：测试档在盘且登记一一对应（见上）、U122–U125 用例在档且逐条覆盖 T-DSK24 ①②③。
> 2. **`doc-check` 本批面零新增**——未复跑。
> 3. **顺带核实（易误导项）**：`d:\teamcode\thincoder\desktop-test.log`（mtime **2026-09-25 21:06**）内容为旧日 manifest 失败「unregistered test file: test/views-activity.test.mjs」——早于本批（`files.mjs` mtime 2026-09-26 21:21），且该档现已登记（files.mjs:10），**非本批证据、非本批产物**；勿据其判红。
>
> 预算：10 工具轮已用满。本审计只读，未改任何文件。

**（二）代码评审 R1 全文**（`C:\Users\liwei\.thincoder\tool-results\1790458182486-call_00_UmHXJAtyC1SsHBR6j1SQ2784.log:1592-1616` · 引文止 :1616；:1617 起 = 宿主噪声，不引）：

> ## 评审面与实读基线
>
> **评审对象**（按声明，未推断）：`thincoder-desktop/renderer/{i18n.mjs, app.mjs, chat.css, mount-cards.mjs, views/chat.mjs, views/question.mjs, views/plan.mjs}` + `thincoder-desktop/test/{views-question.test.mjs, views-chrome.test.mjs, files.mjs}`——十档全读（实际路径 = `thincoder/thincoder-desktop/...`；声明仓根前缀 `thincoder-desktop/` 在盘为子目录形态，非缺档）。对照面：设计五档相关行（`UI.md` 提问呈现 / 计划面 / 输入区行 · `RENDERER.md` §1.1 插入点纪律 / 卡面在场条 · `PROJECT.md` §4.1 / §7 T-DSK24 · `IPC.md` §1/§2）+ 批档 §1.22 / §1.25 / §1.26 + 同族先例三档（`mount-composer.mjs` / `mount-pool.mjs` / `views/approval.mjs`）。
>
> **交付面逐项实核通过**（未列表即无问题）：① i18n 三键两语同增（`i18n.mjs:76-78` / `:192-194`）· 实读 110 键 = 档头「左列 13 + 标签条 4 + 对话流 6 + 活动池 7 + 审批卡 7 + 提问卡 3 + 设置 48 + 向导 10 + 信息行 9 + 输入区 3」算式同值；② `blockAnchor` 加宽（`chat.mjs:211` 收三族任一卡 `[data-card]`）· `cardAnchor` 加宽（`:218` 首个提问 ∥ 计划卡）；③ `app.mjs` 装配 + 触发（`:22` import · `:48` `attachCards` · `:161/:165/:170` 帧内补挂〔重挂面清树后必补 · 增量面先于读数 `t0`〕· `:221` `CARDS_KEYS` 随动）；④ 新建用例档 U122–U125 四例在册（`files.mjs:11` 登记 ✓ · runner 两向自检可达）；⑤ U51 随动（键数 `104+3+3`、`QUESTION_WORD_KEYS`、两卡树入量与数据串、十五视图档零 CJK 名单含 `question.mjs` / `plan.mjs`）；⑥ CSS 落 `chat.css`（`§1.26` 裁定 ✓）：10/10 类全有落形（`.question-card/head/options/option/answer/input/submit/cancel` + `.plan-card/row`），无源类遗漏。三档行数 106 / 41 / 144 与批档 §1.25 实读同值 ✓；`chat.css` 255 · `app.mjs` 222 · `chat.mjs` 289 ≤ 300 ✓。
>
> | # | File | Severity | Issue | Suggestion |
> |---|------|----------|-------|------------|
> | 1 | renderer/mount-cards.mjs（+ renderer/views/question.mjs） | 🔴 | **回执 `ok` 假径零诊断——设计的失败面只落了一半。** 判据三处逐字：`project.md:275`（T-DSK24 ①）「作答 ⇒ `question:respond` 往返 ⇒ **回执 ok 后**卡清除（**失败 ⇒ 卡留 + `console.error`**）」· `ui.md:23`（提问呈现行）· `renderer.md:55`（卡面在场条）——批档 §2.4 ② 同句。实装只覆盖「抛 / 拒绝」半（`views/question.mjs:99` catch 径记错）；**回执非 ok** 径直接静默返回：`mount-cards.mjs:50` = `if (receipt?.ok !== true) return false`（零日志 · 零提示 ⇒ 用户点「提交作答」而宿主拒收时屏上零反馈 · 控制台零记录；`IPC.md:59` 设计的三 reason 码 `unknown-prompt` / `bad-kind` / `bad-answer` 在渲染面零出场面）。同批对照先例两条：`mount-composer.mjs:136` = `if (receipt.ok !== true) console.error(...)`（设计 `ui.md:20` 逐字「`ok` 假 ∥ 抛 ⇒ 留队 + `console.error`」）；同族卡出口 `mount-pool.mjs:21` 同形但审批行无此 clause ⇒ 「失败 ⇒ + console.error」是本行**专设**要求。机检面同缺：U124 ② 只断言「卡留 + 位标零清」（`views-question.test.mjs:215-221`），错面断言仅覆盖 invoke 抛径（`:245-250`） | 在 `submitAnswer` 的 `receipt?.ok !== true` 分支补一行 `console.error`（携 `receipt?.reason`），并在 U124 ② 补一条错面断言（**不删**现有断言）——一行 + 一条即可收敛；若父侧裁「失败」仅指抛 / 拒 ⇒ 转设计面收窄该句（须与 `UI.md:20` 的「`ok` 假 ∥ 抛」形对齐，否则同批两族口径相抵） |
> | 2 | test/views-question.test.mjs | 🟡 | 新建档 **349 行 > 300** advisory 线（AGENTS.md「≤300 advisory · ≤500 hard」）；设计注册值 `PROJECT.md:141` = `~150` ⇒ 2.3×（新档无在册拆分预案）；本档不在 U95 `fresh` 硬臂内 ⇒ 靠人工审视。非 must-fix（沿批内既有裁定「照写 + 披露；拆分登记归收口轮」） | 收口轮登记拆分点并给预案（最自然的切口 = 假 DOM 两缝 `patchCardSeam` / 活树引用面拆入共享夹具 `views-harness.mjs` 同族，或按 U122 / U124 两段拆档）；本舱不改 |
> | 3 | test/host-floor.test.mjs（面外 · 协调项） | 🟡 | **协调项（非缺陷）**：U95 行数硬臂 `fresh` 清单（`:253-264`）未含本舱三新档（`renderer/views/question.mjs` / `plan.mjs` / `renderer/mount-cards.mjs`）与新用例档 ⇒ 该四档 ≤300 **无机械闸**（同态先例 = A-1a `mount-composer.mjs` / A-1b `mount-sessions.mjs`，批档 §1.25 已登记为「父侧臂清单随动项」；`PROJECT.md:173-176` 同口径） | 归父侧收口 / 臂清单随动轮：按同律并入 `fresh` 或落 §4.1 值列表（本舱不自改闸面名集）；现风险 ≈ 0（三档 ≤145 行） |
> | 4 | renderer/i18n.mjs · renderer/chat.css | 🔵 | 越 advisory / 与设计注册值不符：`i18n.mjs` 实读 **317**（注册 293 · `PROJECT.md:119`，拆分预案在册「词族按视图面拆第二档」）· `chat.css` 实读 **255**（注册 **170** · `PROJECT.md:112`，且该行描述只列「对话流块 / 工具卡 / 摘要块 / 药丸」——审批卡先例批 7 与本批卡族两段均未载）。可归因本舱 +6 行（三键两语 + 档头枚举）与卡族段 +85 行 | 只报不改（设计档非本舱写权）：收口轮设计面回填两值与 chat.css 行的样式面枚举（沿 §1.19㈡ / §1.20㈣ 先例） |
> | 5 | test/views-chrome.test.mjs | 🔵 | 本舱 U51 随动后实读 **393 行** > 300 advisory（注册 296 ⇒ 预算 ~321 · `PROJECT.md:151` 拆分预案 = `views-composer.test.mjs` 在册）——本批披露链内（A-3b 374 ⇒ 本舱 393），无 U95 硬臂 | 只报：消解窗口 = 该档下次触碰批；本舱不当场拆（沿 §1.11㈡ 裁定） |
> | 6 | test/views-locks.test.mjs | 🔵 | U52「接线调用在位」清单（`:97-102`）未含本舱新增两锚 `attachCards(` / `paintCards(state)` ⇒ 卡族是本批唯一**族面无结构锁**者（池面 / 会话族 / 设置族各有；输入区由 U119 自锁）。行为面**已**由 U124 真 `document` 缝 + handlers 往返覆盖 ⇒ 非缺陷，仅锁面不同形 | 可选：该清单补两锚；或明确「卡族锁面 = `views-question.test.mjs` U124」（与 U119 对输入区同法），二者择一即可 |
> | 7 | renderer/mount-cards.mjs | 🔵 | 自由作答**空白闸**设计未点名（`UI.md:23` 只写「自由作答 = 文本控件 + 提交键 `question:answer`」）；实装 `:131` `if (draft.trim() === "") return` ⇒ 零动作零 IPC **且静默**（无提示 / 无日志）。沿输入区同形先例（`mount-composer.mjs:150` `if (value.trim() === "") return "empty"`）⇒ 非偏差，属口径补记 | 可选：设计面补一句（或登记「空白闸 = 入口面通则」）；实现现状保留 |
>
> ### 范围外记录（**不判级** · 呼应声明排除面）
>
> 1. `views/chat.mjs` 卡序接缝与 `blockAnchor` 加宽**已完成**（`:209-220`）——A-2a-2 的范围外登记 1 已兑现，无遗留。
> 2. `clearQuestion` 清位判据**单域**（摘本键提问项即清本键 `approval` 码 · `events.mjs:334`）—— A-2a-1 已报、父侧已转设计侧收口；本舱消费该导出（`mount-cards.mjs:21` / `:53`），不重复要求。
> 3. `questions` / `tasks` 两切片**无生命周期消解窗口**（关标签 / 删会话不清）——设计缺口，A-2a-1 已登记，归设计侧。
> 4. `plan.mjs:28` 行项零过滤（`children: [item?.title, word]`）—— 父侧已裁「**保留现判据**」（核 `task` 工具侧已滤 ⇒ 现网不可达）⇒ 按 R3 **不重诉**；`mount-cards.mjs:65` 签名理论碰撞面同（已裁保留）。
> 5. **本评审未独立复跑套件**（只读环境 ⇒ 无执行面）：交付记录「133 pass / 0 fail · exit 0」**未经本评审复验（unverified）**；本表的机检面结论均按源面静态实核（假面缝 `fake-dom.mjs` / `views-harness.mjs` 行为逐点读核：`useSentinels` 全键代理 ⇒ `sentinel()` 断言可达 ✓ · `FakeElement.parent/textContent` 支撑 `patchCardSeam` / 签名面 ✓ · `dom.mjs fill` 跳 `null` 空位支撑 `questionTree` 子序 ✓ · `run.mjs` 两向自检要求登记 ✓）。
>
> VERDICT: changes-required

**（三）代码评审 R2 全文**（`C:\Users\liwei\.thincoder\tool-results\1790458492184-call_01_fRiJsf3f1QDvl3JQg4YE9747.log:599-627` · 引文止 :627；:629 起 = 宿主噪声，不引）：

> ## 第 2 轮核验（fix-claims-only）
>
> **本轮实读**（fresh）：`thincoder/thincoder-desktop/renderer/mount-cards.mjs`（全档 150 行）· `thincoder/thincoder-desktop/test/views-question.test.mjs`（全档 359 行）· 依赖面 `renderer/views/question.mjs`（claim ① 的 `null` 哨兵半边）· 先例面 `renderer/mount-composer.mjs`（"同族先例形"）+ 主侧 `src/main/ipc.mjs`（`question:respond` 回执面可达性）。**注意**：本仓实根为 `thincoder/`，声明与指令给的 `thincoder-desktop\...` 短路径在盘上不可直接解析——本轮引用一律用实读路径，避免上一轮 `[host-verified] 0/6 … (file unreadable)` 的解析失败重演。
>
> **claim 逐条核验**
>
> - **① 核验通过。** `mount-cards.mjs:51-55` 现为：`51: if (receipt?.ok !== true) {` / `52: // 抛 / 拒 ⇒ 回执 null（respondQuestion 已自记错）—— 本档只补「回执拒收」半（零双记）` / `53: if (receipt !== null) console.error(\`[renderer] question:respond failed: ${receipt?.reason ?? "unknown"}\`)` / `54: return false` / `55: }`。与依赖面一致：`views/question.mjs:99: console.error("[renderer] question:respond failed:", error)` + `:100: return null` ⇒ 抛/拒半边由 `receipt !== null` 守卫不二记；`ok:false` 半边恰记一次，且与同族先例 `mount-composer.mjs:136` 同形。上一轮 🔴（`mount-cards.mjs:50` 曾为 `if (receipt?.ok !== true) return false` 静默径）已消解。
> - **② 核验通过。** `views-question.test.mjs:217-226` 本地捕获 + `try/finally` 还原 —— 且捕获窗内 `await tick()`（微任务全排空，无时钟脆弱）；断言链 `228: assert.equal(store.get().questions[KEY] !== undefined, true, "回执非 ok ⇒ 卡留（零切片写）")` · `229: … tabBadges[KEY].includes("approval") …` · `230: assert.equal(rejected.length, 1, "回执非 ok ⇒ 有诊断（console.error 恰一次 —— 错面不静默）")` · `231: assert.equal(rejected[0][0], "[renderer] question:respond failed: bad-kind", "错面携 receipt.reason（同族先例形）")`。`length === 1` 同时钉死「零双记」；⑤ 原断言 `views-question.test.mjs:259: assert.equal(errors.length, 1, "invoke 抛 ⇒ console.error 恰一次")` 在现行实现下确实构成双记反证（双记 ⇒ 2 ⇒ 失败）。唯「untouched/未被改动」本轮无前版快照 ⇒ **不可核**（无实质影响）。
> - **③ 核验通过。** 档头 `mount-cards.mjs:12-13` 已写「失败 / 拒绝 / 抛 ⇒ 卡留可重试 + `console.error`（抛 / 拒 ⇒ `respondQuestion` 自记错；**回执拒收**〔`ok` 假〕⇒ 本档记 `receipt.reason` —— 两半合「失败」全形，各自单记零双记）」；用例题 `views-question.test.mjs:184` 为「…回执 ok 才摘 / 失败留卡 + 记错 /…」；档头 `:10-11` 同步。
>
> | # | Orig# | File | Severity | Status | Notes |
> |---|-------|------|----------|--------|-------|
> | 1 | R1 🔴（claim ①） | renderer/mount-cards.mjs:51-55 | 🔴 → 消解 | **Fixed ✓** | `receipt?.ok !== true` 分支现记 `[renderer] question:respond failed: ${receipt?.reason ?? "unknown"}`（`:53`），`return false` 保留（卡留非乐观，`:54`）；抛/拒半经由 `receipt !== null` 守卫零双记，与 `views/question.mjs:99-100` 自记 + `null` 哨兵咬合。上一轮的静默径已不存在。 |
> | 2 | R1 🔴（claim ②） | test/views-question.test.mjs:216-231 | 🔴 → 消解 | **Fixed ✓** | 捕获缓冲 `:217-226`（try/finally 还原）；三面同钉：卡留（`:228`）· 位标零清（`:229`）· 恰一诊断且携 `receipt.reason`（`:230-231`，逐字错面 `"[renderer] question:respond failed: bad-kind"`）。断言位于 `finally` 之后、缓冲为局部数组 ⇒ 零跨用例泄漏；文件内 4 个 `test()` 顶层串行 ⇒ 无并发互踩。 |
> | 3 | R1 🔴（claim ③） | mount-cards.mjs:10-13 / views-question.test.mjs:9-11, 184 | 🔵（文档同步面） | **Fixed ✓** | 档头 / 用例题 / 用例档头三处措辞与实现面一致，无「两半合失败」表述残留。 |
> | 4 | R1（⑤ 支撑面） | test/views-question.test.mjs:259 | — | **Fixed ✓（行为面）** | `errors.length === 1` 现同时判「抛径恰一次」与「零双记」。「未被改动」不可核（无前版快照），不影响效力。 |
> | 5 | R1-n（file sizes） | test/views-question.test.mjs | 🔵 | Carried（非阻断 · 本轮范围外） | 本轮全档实读至末行 359 行（修复净增约 10 行，为 claim ② 钉断言所必需）——沿 R1 非阻断注，declaration 明列归父侧协调。 |
> | 6 | R1-n（U95 fresh 清单） | test/host-floor.test.mjs（未复读） | 🟡 | Carried（非阻断 · 本轮范围外） | declaration 列为范围外协调项；本轮不据以判断、不升级。 |
> | 7 | R1-n（U52 无卡族锚） | test/views-locks.test.mjs（未复读） | 🔵 | Carried（非阻断 · 本轮范围外） | 同上，父侧协调。 |
> | 8 | R1-n（空白串闸静默） | renderer/mount-cards.mjs:136 | 🔵 | Carried（非阻断 · 本轮范围外） | 本轮实读 `:136: if (draft.trim() === "") return // 空白串 ⇒ 零动作零 IPC（取消走显式出口 —— 不吞别的键）` —— 行为未变；同族同形先例仍在（`mount-composer.mjs:150`）⇒ R1 判「非阻断」的理由仍成立。 |
> | 9 | (new) | renderer/mount-cards.mjs:53 | 🔵 | New — optional（非回归 · 不阻断） | 新守卫以 `null` 为「抛/拒」哨兵：若宿主 **resolve** 出 `null` 或非对象（契约外），卡会留但零诊断（静默）。同族先例另立此档：`mount-composer.mjs:132-134`（`malformed receipt`）。主侧 handler 为 `src/main/ipc.mjs:148: return agentHost.respond(payload)`（宿主 `respond` 内部能否 resolve `null` 未读 ⇒ 该可达性 unverified）⇒ 现网按契约不可达，且此哨兵形乃 `views/question.mjs:98-105` 既有契约（非本次修复引入）。可选项：未来如需与 composer 完全同形，可在 `respondQuestion` 内归一畸形回执（而非以裸 `null` 当哨兵）。 |
>
> **收尾说明（非发现项）**
>
> - 交付记录「133 pass / 0 fail / exit 0」本轮**未独立复跑**（只读工具面，无执行面）⇒ 标记 **unverified**；但 ②/⑤ 的断言链为纯微任务确定序（`await tick()` 即排空），静态可判其必过。
> - 修复只动了声明范围两档；未发现崩溃 / 数据丢失 / 逻辑错误类新问题。
> - 上一轮 🔴 单源问题（拒收径零诊断）已按设计「失败 ⇒ 卡留 + `console.error`」补齐两端：`ok:false` ⇒ 本档记 `reason`，抛/拒 ⇒ `respondQuestion` 自记 —— 恰一次、零双记，且被 U124 ②/⑤ 双面钉死。
>
> VERDICT: pass

**宿主噪声（不引 · 非评审结论）**：R1 日志 `:1617` 与 R2 日志 `:629` 的 `[host-verified] 0/N citations match current file state` —— 系声明短路径（`thincoder-desktop/…`）与实盘路径（`thincoder/thincoder-desktop/…`）前缀差所致的解析失败；R2 已于其「本轮实读」段自行说明（见上引 :601 末句）；A-1b §5 同形先例已登记，非评审结论、非本舱问题。

**§5.5 只报不写（父侧收口项 · 本舱零改动）**

| # | 项 | 面 | 读据 |
|---|---|---|---|
| 1 | U95 `fresh` 行数硬臂清单未含本舱四新档（`views/question.mjs` 106 · `views/plan.mjs` 41 · `mount-cards.mjs` 149 · `views-question.test.mjs` 359） | `test/host-floor.test.mjs`（他舱档） | R1 #3 🟡（协调项 · 非缺陷）；沿 A-1a / A-1b 同律 ⇒ 四档 ≤300 现无机械闸（现风险 ≈ 0） |
| 2 | U52「接线调用在位」清单（`test/views-locks.test.mjs:97-102`）无 `attachCards(` / `paintCards(state)` ⇒ 卡族为本批唯一族面无结构锁者 | `test/views-locks.test.mjs`（他舱档） | R1 #6 🔵；两择一 —— 该清单补两锚 ∥ 明确「卡族锁面 = U124 假 document 缝 + handlers 往返」（与 U119 对输入区同法） |
| 3 | 设计档漂移回填（写权 = 设计面 / 父侧） | `PROJECT.md` | 实读 5 处：`:112` `chat.css` 170 ⇒ **254**（且该行样式面枚举未含卡族段）· `:119` `i18n.mjs` 293 ⇒ **317** · `:141` `views-question.test.mjs` 注册 `~150` ⇒ 实读 **359** · `:151` `views-chrome.test.mjs` 296 ⇒ 预算 ~321 ⇒ 实读 **392** · `:137` `mount-cards.mjs` `~55` ⇒ 实读 **149**（A-2a-2 §5.5.4 记 144，本舱补现值）；`question.mjs` 106 / `plan.mjs` 41 两位另见 A-2a-2 §5.5.4（不重复登记） |
| 4 | 新增可选 🔵（R2 #9）：`null` 哨兵的契约外可达性 | `renderer/mount-cards.mjs:53` · `renderer/views/question.mjs:96-106` | R2 表 #9 New-optional；现网按契约不可达（`src/main/ipc.mjs:148` 直返宿主 ⇒ 可达性 **unverified**）；同族先例 `mount-composer.mjs:132-134` 另立 `malformed receipt` 档 ⇒ 两择一归父侧 |
| 5 | 用例档 >300 advisory 拆分点：`views-question.test.mjs` 359（新档无在册预案）· `views-chrome.test.mjs` 392（预案 `views-composer.test.mjs` 在册） | 测试面 | R1 #2 🟡 / #5 🔵（均非 must-fix）；切口候选 = 假 DOM 两缝 `patchCardSeam` / 活树引用面入共享夹具 ∥ 按 U122 / U124 拆档 —— 本舱不当场拆（沿 A-3b 既有裁定「披露 + 登记」） |
| 6 | 空白闸静默（自由作答） | `renderer/mount-cards.mjs:136` | R1 #7 🔵；设计未点名（`UI.md:23` 只写「文本控件 + 提交键」），实装与先例 `mount-composer.mjs:150` 同形 ⇒ 口径补记可选，实现保留 |
| 7 | 三 reason 码渲染面零词面映射 | `renderer/mount-cards.mjs:53` | R1 #1 描述面：本舱只记 `receipt.reason` **原码**（不映射词面）—— 若设计要求词面出场面须设计面点名（本舱未擅自映射） |

**§5.6 越声明披露（改了什么 / 为什么 / 授权源）**

| # | 越声明面 | 改动 | 授权 / 理由 |
|---|---|---|---|
| 1 | `renderer/mount-cards.mjs:51-55`（+5 行） | `ok:false` 分支补一行 `console.error`（携 `receipt?.reason`）+ 注释 + 同分支 `return false` 保留 | §1.27 裁定 (a) 明授「本舱当场补」；设计三处同句（`PROJECT.md:275` · `UI.md:23` · `RENDERER.md:55`）含拒收半 ⇒ 属**授权后披露**，非擅自扩面 |
| 2 | `test/views-question.test.mjs:216-231`（+10 行） | U124 ② 补错面断言（卡留 / 位标零清 / 恰一诊断携 `bad-kind`）+ 档头 `:9-11` / 用例题 `:184` 措辞同步 | 同上裁定配套面（无断言则错面无闸）；R1 #1 建议「一行 + 一条即可收敛」原样执行，**未删**任何既有断言 |
| 3 | `renderer/chat.css`（卡族段落形 `:172-254`） | 三卡逐类落形（10 类） | §1.26 裁定并档（单源 = `chat.css`）；`styles.css` 实扫零 `question` / `plan-card` / `data-card` 命中 ⇒ 未越单源（审计 DOC-DRIFT 类证据） |
| 4 | `renderer/views/chat.mjs:209-220` | 两锚加宽（`blockAnchor` 三族共认 · `cardAnchor` 提问 ∥ 计划前插） | §1.25 三补充面之一（声明内）；A-2a-2 §5.5.1 登记接缝 ⇒ 本舱兑现，非扩面 |
| 5 | 口径披露 | CSS 配色自选（既有主题变量 · 零新变量名）· 三 reason 码只记原码 · 卡族无族面结构锁（见 §5.5 #2） | §5.2 #7 / #8 + §5.5 #2 / #7 |

**声明面内、非越声明**：`i18n.mjs`（三键两语 + 档头枚举）· `app.mjs`（装配 import / 实例化 / 三挂点 / 重绘切片）· `test/files.mjs:11`（登记）· `test/views-chrome.test.mjs`（U51 随动）。**声明外新增档 0**。**禁改面 0 触碰**（逐档实核）。

**§5.7 fix round（1 轮 · 收敛）**

- **触发**：R1 #1 🔴（拒收径零诊断 —— 设计「失败 ⇒ 卡留 + `console.error`」只落抛/拒半）。
- **轮次 = 1**（无第二轮 fix：R2 三 claim 全 Fixed ✓、零新 🔴）。
- **修面（2 档）**：
  1. `renderer/mount-cards.mjs:51-55` —— `receipt?.ok !== true` 分支补诊断（`:53`）+ 注释（`:52`）；`:54` `return false` 保留（卡留非乐观不变）；档头 `:10-13` 同步两半分工。
  2. `test/views-question.test.mjs:216-231` —— U124 ② 局部捕获缓冲（`:217-226` · `try/finally` 还原 · 窗内 `await tick()`）+ 三面断言（`:228` 卡留 / `:229` 位标零清 / `:230-231` 恰一诊断携 `receipt.reason`）；档头 `:9-11` / 用例题 `:184` 措辞同步。
- **未动面**：其余 6 档零改动；R1 的 🟡2 / 🔵4 全为「只报 / 收口轮」项（§5.5），不当场扩面（沿裁定）。
- **收敛证据**：R2 三 claim 全 **Fixed ✓**；新 🔴 = 0；「零双记」由 `rejected.length === 1`（`:230`）+ ⑤ `errors.length === 1`（`:259`）双侧反证。

**复跑（§5 落笔后 · 2026-09-27 · 本舱自证面）**

1. `cd thincoder-desktop && node test/run.mjs` ⇒ `ℹ tests 133 · pass 133 · fail 0 · cancelled 0 · skipped 0 · todo 0` · `duration_ms 4549.65` · **退出码 0**（工具面无 `(exit code N)` 行）。本舱四例读数（本次）：U122 3.56ms · U123 2.94ms · U124 78.98ms · U125 1.76ms（U51 14.38ms）—— **ms 逐次浮动为非判据面**，裁决面 = 计数 133/133/0 恒定（§5.3 首跑 ms 与本行差异同因）。
2. `cd thincoder && node scripts/doc-check.mjs` ⇒ `汇总：候选 26739 · 悬空 48 · 注记豁免 82 · 拟新增 29 · 迁移期引文 216`；域分 = 路径/坐标 悬空 **47** + 符号·窄 悬空 **1** = **48**（既有红，逐条零落 `docs/batches/**`）· 符号·宽（报告面）443（不入闸）。`FAIL(锚): 48` + `FAIL(行宽): 18` ⇒ **与 §5 落笔前同读数（delta = 0）** ✓ —— 本块写入自身零新增红。
3. 用例号面：`候选 1092 · 悬空 0` ✓（本批 U122–U125 四号在册 · 全仓零悬空）。

**§5.8 残留与交接**

- 未闭合 🔴 = **0**；未闭合 🟡 = 2（§5.5 #1 臂清单 · #5 拆分点，均收口轮窗口）· 🔵 = 5（§5.5 #2 / #6 / #7 + R2 #9 新增可选 + R1 #4 / #5 设计面回填）。
- 评审面未独立复跑套件（R1 / R2 均只读 ⇒ 无执行面）——本舱「复跑」条 = **唯一机检证据源**；U95 / U124 的 `console.error` 计数断言（`:230` · `:259`）在本次复跑中全绿。
- 交接面：本舱交付物 = 8 档（§5.1 表）；下游 = 收口轮（设计面 5 处回填 + `fresh` 臂清单随动 + 两档拆分点登记，全在 §5.5）。
- 口径统一：本块行数一律内容口径（文末换行不计）；R1 / R2 的 255 / 393 / 150 = 总量口径（同值差 1，非分歧，见 §5.1 口径注）。

**终态 = clean（收敛）** —— 内部审计**四类偏差零命中** + 评审 R1 changes-required（🔴1 / 🟡2 / 🔵4）⇒ R2 **pass**（3 claim 全 Fixed ✓ · 零新 🔴）+ fix **1 轮** + 桌面套件 **133/133/0** 全绿 + doc-check **delta 0**。

**§5.8 计数校正（D3 计数 ↔ 枚举同步 · 2026-09-27）**：上条未闭合 **🔵 = 5** 逐项展开 = **R1 #4**（`chat.css` 254 / `i18n.mjs` 317 越注册 · 行位 §5.5 #3 同源）· **R1 #5**（`views-chrome.test.mjs` 392 > 300 · 行位 §5.5 #5 同源）· **R1 #6**（U52 无卡族锚 · 行位 §5.5 #2）· **R1 #7**（空白闸静默 · 行位 §5.5 #6）· **R2 #9**（`null` 哨兵 · 新增可选 · 行位 §5.5 #4）；**🟡 = 2** = **R1 #3**（U95 `fresh` 臂清单 · 行位 §5.5 #1）· **R1 #2**（359 行拆分点 · 行位 §5.5 #5）。§5.5 #7（三 reason 码零词面）系 R1 #1（已消解 🔴）的描述面补记，**不计入**未闭合计数。行位为坐标、判定以 R1 / R2 编号为准。

### A-1a 补记 · IME 组字门（§1.16㈢ 第 1 项「设计补规则 + 实施小修」的**实施半** · eng-coder · 2026-09-27）

#### 交付摘要

**落形**：组字期回车 = 选字确认（键归输入法）⇒ **零发送 · 零 `preventDefault` · 零吞键**；不引入任何组字状态机（判据 = 事件标志 ⇒ 零持久态 ⇒ 结构性不粘滞）。

| 面 | 落点 | 形 |
|---|---|---|
| 判据（**单源一处**） | `thincoder-desktop/renderer/mount-composer.mjs:41-43` | 模块级纯谓词 `isComposing(event)` = `event?.isComposing === true` ∥ `event?.keyCode === 229`（标准形 ∥ 老 WebView 兜底臂 —— 一条谓词两臂同径） |
| 门位 | `:221`（`onKeyDown` 函数体首句） | `if (isComposing(event)) return` —— **先于一切分支**（键型分支 / `preventDefault` / `submitDraft` 皆居其后） |
| 档头 | `:5-7`（② 键位行） | 补组字门子句 + 判据源（`docs/desktop/design/UI.md` §1 交互行 · 裁定源 = 本档 §1.16㈢ 第 1 项） |
| 用例 | `thincoder-desktop/test/views-chrome.test.mjs:394-436` | **U126**（自铸号 —— 沿 §1.16㈡⑤ 先例）四臂见下表 |

**U126 四臂**（`attachComposer(host, { store })` + 假 event；press **不带 `target`** ⇒ 走闭包 `draft` 回退径 = 文本留存旁证）：

| 臂 | 输入 | 断言 |
|---|---|---|
| ① 标准形 | `{ key:"Enter", isComposing:true }` | 零 IPC ∧ `prevented === undefined` |
| ② 兜底臂 | `{ key:"Enter", keyCode:229 }` | 同径零动作（一条谓词两臂同径） |
| ③ 换行键 | `{ key:"Enter", isComposing:true, shiftKey:true }` | 零动作 · 零吞键（**钉不变式 · 不带门的判别力** —— 已就位标注；门的判别力由 ① ② 承载） |
| ④ 不粘滞 | 组字后普通 Enter | `prevented === true` ∧ `deepEqual(calls, [{ channel:"msg:send", payload:{ key:"1", text:"组合中文字" } }])`（恰一发 ∧ 文本 = 组字期键入原文 —— 零丢字） |

**机检读数（本次实测）**：

1. `cd thincoder-desktop && node test/run.mjs` ⇒ `ℹ tests 134 · pass 134 · fail 0`（基线 133 ⇒ **+1 = U126** ✓；U126 单例 ~10.2ms）。
2. `cd thincoder && node scripts/doc-check.mjs` ⇒ 汇总 `候选 26787 · 悬空 48 · 注记豁免 82 · 拟新增 30 · 迁移期引文 216`；`FAIL(锚): 48` + `FAIL(行宽): 18` ⇒ **与落笔前同读数（delta = 0）** ✓；用例号面 **悬空 0** ✓（U126 在册）。

**口径**：行数一律内容口径（文末换行不计）—— `mount-composer.mjs` **262**（≤300 ✓）· `views-chrome.test.mjs` **392 ⇒ 436**（越 300 软线 ⇒ 见「只报不写」）。

#### 决策透明表

| # | 决策点 | 取法 | 依据 / 代价 |
|---|---|---|---|
| 1 | 门形 = 一条谓词 + 首句早返（非各分支内加判） | 取「单源一处」 | 设计规则只一处；避免发送径 / 换行径各判一次而漂移；代价 = 组字期其余键亦走早返 —— 行为等价（原路径对非 Enter 键本就零动作） |
| 2 | 判据含 `keyCode 229` 兜底臂 | **加法**（设计行只点名 `isComposing`） | 老 WebView 不置 `isComposing` 时标准形失效 ⇒ 兜底臂兜住；已就位溯源注释（标「实施追加」）；设计行是否点名两臂 ⇒ 收口轮裁（见「只报不写」） |
| 3 | `isComposing` 取严格 `=== true` | 严格 | 防真值串 / `1` 误判为组字态；正常 Enter 的 `keyCode` 为 13 ⇒ 无误伤（U126 臂 ④ 钉住） |
| 4 | 不引入组字状态机 / 不听 `compositionstart` / `compositionend` | 零态 | 判据 = 事件标志（每条 Enter 自带真值）⇒ **结构性不粘滞**；代价 = 组字期 Shift+Enter 亦零动作（与常态换行同 —— 设计面即「零吞键」不变式，见臂 ③） |
| 5 | 用例自铸号 U126 | 沿 §1.16㈡⑤ 先例 | 名册在册（`test/files.mjs:7`）⇒ 用例号悬空 0 ✓ |
| 6 | 组字以事件标志模拟（非真 composition 事件流） | 平 node 现实 | 本档零 DOM（`attachComposer` 收假 host）⇒ 无 `compositionend` 可发；U126 注释已承明该界限 |

#### 审计与代码评审轮次与终态

| 轮 | 形态 | 结论 |
|---|---|---|
| 内部审计（explore 只读 · 对照设计） | 单轮 | **CLEAN —— 四类偏差（部分实现 / 静默简化 / 文档漂移 / 面外改动）零命中** |
| 代码评审（advisor type=code） | **跳过** | 派单**明禁点评审**（本舱 = fix 轮小修）⇒ 未起评审轮；**披露** —— 终态判据 = 内部审计 + 机检读数两源 |
| 终态 | — | **clean**（内部审计 CLEAN + 套件 134/134/0 + doc-check delta 0） |

**审计事实项四则（均非偏差 —— 逐条处置）**：

1. **U126 臂 ③ 非判别性**（删门亦零动作 ⇒ 恒真）：**已在用例内标注**（「钉不变式 · 不带门的判别力 —— 判别力由 ① ② 承载」）；断言形态不改（设计要的「组字期零吞键」不变式仍需在场）。
2. **229 臂 = 实施追加**（`UI.md:17` 规则行只点名单臂 `isComposing`）：已在谓词注释标明「实施追加的兜底臂」；设计行口径 ⇒ 只报（收口轮）。
3. **同族先例位置更正**：229 臂先例实住 `thincoder-vscode/test/webview-input-history.test.mjs:119-127`（T-MA10-5）；`webview-input-enter.test.mjs` 只落 `isComposing` 臂（T-B2-2）。本舱两臂同径、语义同族（仅 `=== true` 严格化）—— 已采纳入注释。
4. **本舱触及的活面陈旧标记**（`UI.md:17` 「实施未落——登记 open 行」· `UI.md:35` open 行 · `PROJECT.md:138/:152/:157` 行数账）：设计面非本舱写权 ⇒ 列「只报不写」。

#### fix round（共 1 轮 · 预算 5 内）

- **轮 1（审计后口径收正 · 注释 / 引用面 · 零行为改动）**：① 判据源引用 `UI.md` §1 **输入区行** ⇒ **交互行**（实读正源：IME 规则原文住 `:17` 交互行；`:20` 输入区行自以「键位单源 = 本档『交互』行」引用之）× 2 处（实现档头 + 用例档头）；② 谓词注释补 229 臂溯源（实施追加 + 同族先例）；③ U126 臂 ③ 补非判别性标注。
- 收正后复跑：`node test/run.mjs` ⇒ **134/134 · fail 0** ✓（注释面改动零行为漂移，读数不变）。

#### 越声明 / 面外披露

- **代码面越声明 = 0**：改动恰两档（`renderer/mount-composer.mjs` · `test/views-chrome.test.mjs`，皆在声明面内）；派单硬禁（`index.html` / `store.mjs` / `events*.mjs` / 其余 views / `src/**` / 其余测试档 / 需求档 / 设计档）**逐条零触碰** ✓。
- 审计面旁证：交付戳（2026-09-27 00:05 前后）在 `renderer/` 与 `test/` 下仅命中该两档（`test/artifacts/settings-panel.png` = 跑测产物，非源档）。
- 本段写入 = 批档 §5（本舱自身段 —— 非「面外」）。

#### 只报不写清单（设计面 / 收口轮 · 非本舱写权）

| # | 项 | 现刻盘上 | 应然 |
|---|---|---|---|
| 1 | `UI.md:17` 交互行 IME 子句尾「**实施未落**——登记 open 行」 | 已落 | 落地后该子句成陈旧 ⇒ **删**（否 `~~删除线~~` —— 规范性面失效即删，沿「无修订式表达」纪律） |
| 2 | `UI.md:35` open 行「输入区 IME 组字保护（`isComposing` 实施未落——见「交互」行）」 | 已落 | 同上 ⇒ 该条自 open 行摘除 |
| 3 | `PROJECT.md` §4.1 行数账 `mount-composer` **251** | 盘上 **262** | 回填 262 |
| 4 | `PROJECT.md` §4.1 `views-chrome` **392** | 盘上 **436**（越 300 软线） | 回填 436 + 拆分点登记（§2.13② 窗口；新档须动 `test/files.mjs` / `run.mjs` = 本舱声明面外） |
| 5 | `UI.md:17` 规则行是否点名 **229 兜底臂** | 单臂 | 收口轮裁（加法臂已在盘 · 语义同族） |

**交接**：本舱交付 = 2 档 + 本段；下游 = 收口轮（上表 5 项）+ **T-DSK21 真机走查**（§1.16㈣：A 六舱全落 + IME 小修落地 ⇒ 请用户走查 —— 本舱即该「落地」项的最后一件；真机面仍待人工）。

#### §5 计数校正（D3 计数 ↔ 枚举同步 · 2026-09-27）

「A-1a 补记 · IME 组字门」段内两处「`views-chrome.test.mjs` 盘上 **436**」⇒ **437**（内容口径，文末换行不计；总量口径 438）：轮 1 收正 ③（臂 ③ 非判别性标注）= 1 行置换为 2 行 ⇒ +1；审计面读数 436 = 收正**前**取值（审计先于收正落笔）。`mount-composer.mjs` **262** 不变 ✓。

**终读（收正后 · 最终盘上态复跑）**：`cd thincoder-desktop && node test/run.mjs` ⇒ `tests 134 · pass 134 · fail 0`（U126 绿）· `cd thincoder && node scripts/doc-check.mjs` ⇒ `候选 26787 · 悬空 48 · 拟新增 30` 不变 + `FAIL(锚) 48` + `FAIL(行宽) 18` ⇒ **delta 0** ✓。本行同时为准：上段任何 436 取值以本校正为准。

## §6 验证与收口（父代理）

**验证与收口（父侧 · 2026-09-27 08:26 ✓）**

### 6.1 交付与验收（父侧逐舱亲跑 ✓）

- **交付** ✓：七舱全数落位（A-1a / A-1b / A-2a-1 / A-2a-2 / A-2a-3 / A-2b / A-3a / A-3b ✓）+ 收口轮设计面（#74 ✓）+ IME 小修（#75 ✓）+ 收口尾轮（#76 ✓）。
- **判据终态读数** ✓（**皆父侧亲跑**）：桌面端 **134/134 · fail 0 · exit 0**（基线 119 ⇒ 126 ⇒ 128 ⇒ 129 ⇒ 133 ⇒ **134** ✓·零回归 ✓）；`doc-check` 桌面设计面 **FAIL 0 / 行宽 0** ✓（全树存量 48/18 = 他档面 · 台账 #435 ✓）；新增用例族 = U117–U126（队列 / 输入区 / 挂载 / 页随动 / 删除同源 / 卡面 / 组字门 ✓）+ T-DSK24/25/26 ✓。
- **逐需求点** ✓：① 输入面（Enter/Shift+Enter/中断 + **IME 组字门** ✓）② 真作答面（`question:respond` 26 项白名单 · 桥异步 · 待决表 `shape` 判别 · 退场判据 ✓）③ 消息队列（三纯动作 + `QUEUE_MAX=8` 单源 + flush 先发后出队 + 在飞卫兵 ✓）④ 改名/删除（行原位换形 + `railForm` + 通道往返 ✓）⑤ 标签点按（`tabindex` 收正 + 零 `inert` + 加速键 ✓）⑥ 关标签 ⇒ 页随动（`closeTail` 单源 + 删除同源 + 幽灵更新零新机制 ✓）。

### 6.2 结算（D7 清单 ✓）

- **台账** ✓：**#428 保持「在途」** ✗（其射程 = 批 A ∥ 批 B 两半 ✓·A 半已完 ⇒ 证据随动 · **B 半落地后一并核销** ✓）；本批其余条目（#437/#438/#439 ✓）皆在册 ✓。
- **本档冻结** ✓；角色表 / 状态行 / 计数 / 指针随动 ✓（§1 二十八块 ✓ + §2 十四块 ✓ + 各舱 §5 ✓）。
- **未决项（在册 · 不静默）** ✗：① **T-DSK21 真机走查**（人工面 · 用户侧 ✓）待做 ✗；② ≥300 档拆分点（九档 + `chat.mjs` 贴层 ✓·各带预案与消解窗口 ✓）；③ 全树 doc-health 存量（48/18 ✓·#435 ✓）；④ 记录面 as-of 值（§10 T 行 / 变更记录内 392 ✓）**准不追改** ✓（沿「历史变更记录保留 as-of 快照」✓）；⑤ **RELEASE 注记**（批 A 用户面变更 ✓）⇒ 发版时落 ✓。
- **设计槽** ✓：本批 `designId` 于链终点 `consume-design` 消费 ✓。

### 6.3 结语

**一句话** ✓：**桌面端从"能看"变成"能聊、能管、能答问"** ✓ —— 输入区 / 队列 / 真作答 / 会话族 / 页随动六件全落 ✓·**134/134 全绿** ✓·**中文输入法组字不再误发** ✓。
