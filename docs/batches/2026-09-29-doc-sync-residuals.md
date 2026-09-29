# 2026-09-29 · doc-sync-residuals
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 父侧 2026-09-29 03:2x 三批收口残留扫（轮 8 收正行 + 退役续收 + 台账在册文档面）。
> 台账 = #251 ∕ #255 ∕ #298 ∕ #549（core ∕ cli ∕ vsc 文档面 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批（父侧 · 2026-09-29 03:4x）
- **来源**：三批（tech-debt ∕ parity ∕ flow）收口后的**设计面残留收正**。范围 = **A 组**（轮 8 收正行：`AGENT-LOOP-ASYNC-POOL.md` §6.30 ∕ `SESSION.md` §6.21 ∕ `MODEL-SPECS.md` §16.3 + §16.12 上抛 2 ∕ `IPC.md` `msg:send` `aborted` ∕ `WEBVIEW-INPUT.md` C-B2-6 ∕ agent-turn 407 登记）＋ **B 组**（#251 ∕ #255 ∕ #298 三登记句）＋ **C 组**（`CONFIG.md:48` ∕ `CORE-UNIFICATION.md:42/:1352`）＋ **#549**（E2E-TESTING 真机面同步）。
- **待放行**：**D 组**（desktop 退役续收 ∕ 存量悬空 ∕ #548）· **E 组**（§4.1 全表重锚 #551）——桌面三档在他轮冻结窗解除后另派。
- **口径**：写优先（每落一笔即 read-back 核——前身 #45 因 26 回合零落盘被撤）；产品码零触；设计面笔权 = eng-designer（本批设计轮 #49 已派在跑）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 1：评审 #202 九条逐条落定——见 §2 末块）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮交付（doc-sync-residuals · 2026-09-29 · eng-designer）**

> 口径：设计面残留收正轮——零新语义 ∕ 零新条款；产品码（含 `ipc.mjs:183-186` 注释面）零触。清单源 = `docs/batches/2026-09-28-tech-debt-closeout.md` §1.19 收正行 ①–⑥ ∕ §5（三登记句）+ 台账 #251 ∕ #255 ∕ #298 ∕ #549 + 父侧派单。

**1. 覆盖（逐组 → 落点 → 前 ⇒ 后）**

**A · 轮 8 收正行**

| # | 落点 | 前 ⇒ 后 |
|---|---|---|
| A① | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.10 门三件沿用块（`:577` 邻位新 bullet） | 补 **#448 两句**——① 模态期抑制 + 关闭后补评估（`modalOpen(state)` 门 = `thincoder-cli/src/tui/timer-watch.mjs:80` ∕ `:96`；四关闭点装配 = `pickers.mjs:35` ∕ `wizard.mjs:170` ∕ `:242` + `index.mjs:174` ∕ `:181` 注入）；② 异常径重武装 + 会话停 ∕ 显式撤销除外（实落 = 粘滞位 `_timerRearmRevoked`——`agent-turn.mjs:95-99` ∕ `:84-85` ∕ `:157` ∕ `:221` ∕ `:400`；正文改名 `runAgentTurnBody`）。**#513 CLI 句 = 文档收正大合并轮 D 组已落（`:577` 端面镜像句 = 收正-⑤ 建议句形）——本轮实读复核、零触** |
| A② | `docs/core/design/SESSION.md` §6.21 判据句 4 | 「VSC 侧自有施加面」句整体卸载 ⇒「**VSC 侧无槽 effort 施加面（实读 2026-09-29）**」——证据三件（`thincoder-vscode/src/agent/agent-state.mjs:89-129` 无 `effort` 映射 ∕ `setup.mjs:186-207` 只读槽 provider ∕ model ∕ VSC 全树零 `applySession` import）；补接线归设计轮 |
| A③ | `docs/core/design/MODEL-SPECS.md` §16.3 行注 + §16.12 上抛 2 | 「未取证」⇒ **取证已落**（`glm-5.2` ∕ `glm-5`：`{type:"disabled"}` 受理且生效 ⇒ `thinkAlwaysOn` 维持不标 · 判据默认侧成立；源 = 台账 #356 探针读数） |
| A④ | `docs/desktop/design/IPC.md` §2 `msg:send` 行 | reason 闭集 + **`aborted`**（跨中止径——#515②：装配 `await` 期被中止 ⇒ 零起跑零落盘；落点 = `thincoder-desktop/src/main/turn-driver.mjs:153-154`） |
| A⑤ | `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 细则族 | 补 **⑧ 取批面放行**（#429 落形——`consumableAction`（`thincoder-vscode/src/extension/queued-merge.mjs:37`）两取批点（`queued-pickup.mjs:35` ∕ `:53`）；KD-9 以备选结案；旧「入队门禁不可达」预设（VSC 面）收正） |
| A⑥ | `docs/cli/design/CLI-DEBT.md` §2.1 表 A + §2.2 表 B + 本节 | 补登 **A16** `src/tui/agent-turn.mjs` **407**（#448② 实改档：386 ⇒ 407 · +21——越 400 首登 + 拆分预案 = 送达 ∕ 兜底面抽档（原案）∕ 收口层，拆点届盘择一）；B2 行转正移出（表 A 14 ⇒ 15 档 · 表 B 9 ⇒ 8 档） |

**B · 三登记句（转档）**

| # | 落点 | 登记句（要旨） |
|---|---|---|
| B251 | `AGENT-LOOP-ASYNC-POOL.md` §6.8 被否候选④ | send 消费件合流候选——**条件**：统一需求出现 ∨ 两套「边界消费」逻辑确已漂移 ⇒ 另开批次评估；涉 `send` 机制面 ⇒ 先单拎用户请裁（台账 #251 转档） |
| B255 | `MODEL-BENCH.md` §2.11（复核失败条邻位） | 复核位截断盲区——`deepseek-flash` `multiturn.1` ∕ `.3` 两度放大预算仍截断 ⇒ 判据演进信号（承接线）缺失（设计允许的降级 · fail-closed 零变）；收窄建议未采纳（复核模板精简 ∕ 复核位换模型）；源 = `docs/batches/2026-09-24-judge-reversal-fix.md` §6.3 |
| B298 | `MULTI-INSTANCE-COLLAB.md` §4.4.4 | 端写前 L3 预检同步调用族（`thincoder-vscode/src/agent/execute-tools.mjs:187-195`）——未取证实害；**条件** = 写路径冻结再现观测 ⇒ 归批评估（台账 #298 转档） |

**C · 跨树两处**：`CONFIG.md` §2.2 #132 行——端特有段判词收窄（配置监视纯逻辑已上提核 `thincoder-core/config-watch.mjs`；端特有 = 宿主接线 + 迁移面）+ 端壳两档补仓根全形；`CORE-UNIFICATION.md` §2.1 B16 行（77 读数上提登记）+ §2.13.4 ④ 端特有面块（路径收正）。

**#549 · flow 真机面同步**：`E2E-TESTING.md` §6 按批读——补 **flow 批（R1–R13）** 真机走查面行（逐面 + 全清令注；单源 = flow 批 §2.3 第 3 条 + R12 未办 5）。

**2. 受影响文件与测试面**
- 文档面 **11 档**（逐处 + 各档变更记录一行随笔）：`AGENT-LOOP-ASYNC-POOL.md` · `SESSION.md` · `MODEL-SPECS.md` · `IPC.md` · `WEBVIEW-INPUT.md` · `CLI-DEBT.md` · `MODEL-BENCH.md` · `MULTI-INSTANCE-COLLAB.md` · `CONFIG.md` · `CORE-UNIFICATION.md` · `E2E-TESTING.md`。
- 测试面：**零**（纯文档面）；产品码 ∕ 提示词 ∕ 需求档 ∕ 工程工具：零触。

**3. 机制设计**：无——本批 = 既有机制的设计面收正 ∕ 转档登记（零新语义 ∕ 零新条款）。

**4. 验收对照**：① 逐处落 = 上表 + 各档变更记录；② `node scripts/doc-check.mjs`（仓根）复跑：**悬空 173 ⇒ 171**（Δ = −2）；**行宽 9 ⇒ 10**（本批 authored 零新增——四条已当场折行复跑归零；净 +1 = 他批并发新增 `IPC.md:373`（挂起窗径批 #561）——非本批笔）；③ 本节 append。

**5. 关键决策**：KD-1 **#513 CLI 句判定「已落」**（实读 `:577` = 收正-⑤ 建议句形）——零触；KD-2 **#298 落点取设计档锚**（`MULTI-INSTANCE-COLLAB.md` §4.4.4）；KD-3 **修订式表达零携**（失效句整体替换为现态句）。

**6. 边界 / 本轮不做**：D ∕ E 组（待放行）不触；`PROJECT.md`（desktop）∕ `UI.md` ∕ `RENDERER.md`（他轮冻结窗）零触；产品码零触（归码面轮）。

**7. 上抛项**：① 本记录表头 ∕ §1 已由父侧补填；② 「入队门禁不可达」代码注释面残存六处（`queued-pickup.mjs:17` ∕ `suspension-drive.mjs:263` ∕ 核 `queued.mjs:76` ∕ `panel-turn-stages.mjs:235` ∕ `suspension.mjs:304` ∕ `:452`）——归码面轮；③ `ipc.mjs:183-186` 注释（`aborted`）未落——归码面轮。

**设计评审修正轮 1（eng-designer · 2026-09-29）——承 §3 轮次 1（#202 · 🔴0 ∕ 🟡4 ∕ 🔵5 共 9 条）· 父侧逐条裁定「全数接受 1..9」**

**逐号处置（发现号 → 落点 file:line；行号 = 收正后实读）**

| # | 处置 | 改动落点 |
|---|---|---|
| 1 | 已收正——模态门坐标按届盘重锚（谓词定义 `:47-48` ∕ 火面 `busy` 谓词 `:60`）；§6.30.16 重锚清单①同拍打「已落」 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:581` ∕ `:738` |
| 2 | 已收正——端半登记句定性改写为**历史观测**（原端半档**已迁核**、现盘零命中）+ 现态锚 = 核 `thincoder-core/agent/dispatch-run.mjs:52`（写前 `peerCollabNote`）+ 条件句挂现盘观测点；同节两处死坐标同拍重锚（`:421-423` ⇒ `dispatch-run.mjs:65` ∕ `:115`；`:358-359` ⇒ `:52`） | `docs/core/design/MULTI-INSTANCE-COLLAB.md:244` + `:222` + `:229` |
| 3 | 已收正——登记指针 `CLI-DEBT.md` §2.2 B2 行 ⇒ §2.1 A16 行 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:513` |
| 4 | 届盘实读：#203（b2-collection-correction 修正轮）已落「修订式对照句删除」（git diff + 该档记录面 `:236` 在册）；残余 KD-9 收结句仍在细则面 ⇒ 按「仍是旧形 ⇒ 你落」落形——KD-9 收结句自 `:53` 移出（历史在册 = 该档记录面两条）；该档记录面 +1 行 | `docs/vsc/design/WEBVIEW-INPUT.md:53` + `## 变更记录` 段末 `:237` |
| 5 | §1 `:10` 引节号 `§16.9-2` 为准误（实读：MODEL-SPECS 无 §16.9 对应收正项；真落点 = §16.3 行注 `:1735` + §16.12 上抛 2 `:1886`）⇒ **零动作并给据**：§1 = 主 agent 笔权（本批禁触），收正句随报告上抛；§2 A③ 所记即现态节号面 | 零动作（`docs/batches/2026-09-29-doc-sync-residuals.md:10`——归主 agent） |
| 6 | 已收正——「四关闭点」改述「**三装配点 + 两注入位**」并给计数口径（调用点 3：`pickers.mjs:35` ∕ `wizard.mjs:170` ∕ `:242`；注入位 2：`index.mjs:174` ∕ `:181`） | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:582` |
| 7 | 已收正——面-号逐项对齐（逐面挂 R 号：R1 ∕ R3 ∕ R4 ∕ R5 ∕ R2 ∕ R6 ∕ R8 ∕ R9 ∕ R11 ∕ R12 ∕ R13；R10 注「见上行」、R7 注「不入本走查」）；原 300 字符单行拆两行（行宽安全） | `docs/desktop/design/E2E-TESTING.md:203-204` |
| 8 | 已落——实跑 `node scripts/doc-check.mjs`（仓根 · 全量 · 152 档）：**pre 悬空 160 ∕ 行宽 65 ⇒ post 悬空 160 ∕ 行宽 67**；**本批写域（四档）零新增**（四档条目仅随行号位移；总盘 +2 行宽 = 他批并发笔——`RENDER-CORE.md` 净 +2 ∕ `UI.md:534/:535` 两行加宽属等数替换）；对照 = §2.4 ② 前轮读数（无留痕）——以本行实跑为准。留痕 = `.thincoder/tmp/doc-check-fixround1-pre.log` ∕ `-post.log` | 读数行（本块） |
| 9 | 已收正——`timer-watch.mjs` 读数 90 ⇒ **64**（2026-09-29 B3 收编后实测；两处） | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:409` + `:483` |

**记录面**（四档「变更记录」段末各 +1 行——实施笔 = 本修正轮）：`AGENT-LOOP-ASYNC-POOL.md`（两行条目）· `MULTI-INSTANCE-COLLAB.md` · `WEBVIEW-INPUT.md` · `E2E-TESTING.md`。

**边界核对**：改动面 = 四设计档（就地）＋ 本档 §2（本块 + 状态行）＋ `.thincoder/tmp/` 两日志；产品码 ∕ 测试件 ∕ §1 ∕ §3–§6 ∕ 其它批射程零触；本批落笔行行宽全 ≤300（最大 = `MULTI-INSTANCE-COLLAB.md:244` 299）；**既落行零回改**（仅收问题点 + 记录面追加）。**零新语义**。

**上抛观察（逐条报告）**：
- O1 发现 5 残余：§1 `:10` 引节号收正归主 agent（§1 禁触）——建议收正形 = 「`MODEL-SPECS.md` §16.3 + §16.12 上抛 2」。
- O2 `AGENT-LOOP-ASYNC-POOL.md:769`（记录面）「四关闭点装配」残句未触——记录面历史描述（规范面 `:582` 已改述）；如需追正随父侧。
- O3 `MULTI-INSTANCE-COLLAB.md` 同族残余未触（非九条射程）：`:225` ∕ `:258` ∕ `:299` ∕ `:301` 文件级 `dispatch.mjs` 引用；`:257`「该档 499 行贴硬限」读数（现盘实测 254 行）——供父侧知悉。
- O4 发现 4 与 #203 半重叠处置：本笔在 #203 已落笔之上再收残余（KD-9 收结句移出细则面）；#203 记录面 `:236` 描述其自身笔迹（保留为史实）；如父侧认 #203 口径（结句留细则面），本笔可单句 revert。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

发现表（doc-sync-residuals · 设计面残留收正轮 · 11 档落笔验收；评审面 = 批档 + 10 设计档；产品码零触、纯文档面）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / 引用坐标 | 🟡 | A① 落笔的模态门坐标与现盘不符：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:581` 写「单谓词 = `modalOpen(state)`，`thincoder-cli/src/tui/timer-watch.mjs:80` ∕ 门位 = `:96`」；现盘该档 `modalOpen` 仅见于 `:47-48`（定义）与 `:60`（火面 `busy` 谓词），档末 `}` 止于 `:64`（≈64 行）⇒ `:80` ∕ `:96` 越档尾（实核 = 定向 grep）。同档 `:738`（B3 重锚清单①）本就把「『闩边界面收口』块指针（`:80` ∕ `:96`）」列为待重锚项，本轮收正未随动 | 该句两处指针按现盘重锚（谓词定义 `:47-48` / 火面门 `:60`），或改用不带行号的符号锚（`modalOpen` / `fireTimerWake` 门位） |
| 2 | Requirements / 登记可执行性 | 🟡 | B298 登记句锚在已迁核路径：`docs/core/design/MULTI-INSTANCE-COLLAB.md:244` 把「端侧写前 L3 预检 = 同步调用链」锚到 `thincoder-vscode/src/agent/execute-tools.mjs:187-195`，该路径现盘**全仓零命中**（实核：`**/execute-tools.mjs` 无档；`thincoder-core/tools/execute.mjs` 为 execute 工具，异面），句尾又自携「迁移期引文——档已迁核」标记；同节 `:229` 写该钩点「核 `thincoder-core/agent/dispatch.mjs:358-359`——单源，端已取核」⇒ 同节两处对「端半」落点不同，且条件句（写路径冻结再现观测）挂在死坐标上不可观测 | 端半坐标改指现盘核路径（`thincoder-core/agent/dispatch.mjs`），或把该句定性改写为历史观测（保留迁核标记 + 明写「已迁核」），触发条件挂到现盘可观测点 |
| 3 | Document ownership / 跨文件滞后 | 🟡 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:513` 仍指「登记 = `docs/cli/design/CLI-DEBT.md` §2.2 B2 行」，而本批已把 B2 行转正移出（该册 §2.2 现无 B2；agent-turn 登记现 = §2.1 A16，`docs/cli/design/CLI-DEBT.md:46`）⇒ 本批自身改动造成的悬指（同档 §6.30.6 面） | 该指针改指 `docs/cli/design/CLI-DEBT.md` §2.1 A16 行 |
| 4 | Doc hygiene | 🟡 | `docs/vsc/design/WEBVIEW-INPUT.md:53`（C-B2-6 细则⑧）规范面携修订式表达：「**旧「入队门禁不可达」预设**（slash 首动作不可达——VSC 面）随本落形收正：slash 可达且就地消费」；同句前半「『堵源』（补 VSC 入队侧判据）**未取**……**以备选结案**」亦属决策记录材料落细则面——与批档 §2.5 KD-3「修订式表达零携（失效句整体替换为现态句）」相抵 | 细则面只留现态句（slash 可达且就地消费 / `consumableAction` 两取批点判据）；「旧预设收正 / 堵源未取 / KD-9 收结」移入该档变更记录（记录面）或 §5 决策表 |
| 5 | Clarity / 记录面引节号 | 🔵 | 批档 `:10` A 组清单写 `MODEL-SPECS.md` **§16.9-2** ∕ §16.3，§2 A③（`:30`）落点为 §16.3 行注 + **§16.12 上抛 2**（§16.9 用例表无对应收正项）⇒ 同批两处引节号不一致 | 两处收正为同一节号（§16.12 上抛 2） |
| 6 | Clarity / 计数与枚举 | 🔵 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:581-582` 写「**四**关闭点装配 = `pickers.mjs:35` ∕ `wizard.mjs:170` ∕ `:242` + 注入 = `index.mjs:174` ∕ `:181`」——「四」与「三坐标 + 两注入坐标」配对不可唯一判定（`index.mjs` 两处实为 `onModalClose` 注入位：`reevalTimerWake` 定义 `:164`、注入 `:174` ∕ `:181`，实核） | 明写第四关闭点坐标，或改述为「三装配点 + 两注入位（`onModalClose`）」并给出关闭点集计数口径 |
| 7 | Clarity / 面-号配对 | 🔵 | `docs/desktop/design/E2E-TESTING.md:203`（#549 落笔行）面清单枚举 **10** 项却挂「（R1–R9）」号段、末组三项挂「（R11–R13）」⇒ 13 号对 13 项不闭合（10+3）；单项归属需 flow 批 §2.3（**超本评审范围 ⇒ 该点 unverified**） | 面清单与号段逐项对齐（或注明某项横跨两个 R 号），使登记面可逐号复核 |
| 8 | Scope / 验收证据 | 🔵 | §2.4 ② 的机检读数（悬空 173 ⇒ 171 · 行宽 9 ⇒ 10）在本评审**无命令执行面**（不可实跑 `node scripts/doc-check.mjs`）⇒ 未能复核；仅能确认其内部自洽（两处 changelog 各记 `doc-check` 悬空 −1：`docs/core/design/CONFIG.md:208` ∕ `docs/core/design/CORE-UNIFICATION.md:1981`） | 验收读数以实跑输出留痕（日志 / 闸态行）入批档，便于后续复核 |
| 9 | 行数残读（同源） | 🔵 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:409` ∕ `:483` 的 CLI `thincoder-cli/src/tui/timer-watch.mjs` 读数「**90**（实测 · 新档）」= B3 收编前读数（现盘 ≈64 行）——B3 重锚清单③（`:739`）只列 §6.30.5 ∕ §6.30.11，本档两处未随动 | 该两处读数随该档下次触碰重锚（或与发现 1 同笔处理） |

**已复核通过面（供采信）**：A② 证据链实核成立（VSC 全树零 `applySession` import——仅 4 处注释提及；`thincoder-vscode/src/agent/agent-state.mjs` 零 `effort` ∕ `reasoningEffort` ∕ `thinking` 命中）；A① 注入坐标实核命中（`index.mjs:164` 定义 `reevalTimerWake`、`:174` ∕ `:181` 两注入位；`agent-turn.mjs:95` `runAgentTurnInner` ∕ `:104` `runAgentTurnBody` ∕ `:84-85` `timerRearmBlocked` 与粘滞位 `_timerRearmRevoked` 均在盘 ⇒ A① 与 A16 行两名（收口层 ∕ 正文）非同一符号、无互斥）；A⑤ ∕ A⑥ ∕ C ∕ B251 ∕ B255 落点逐处与批档表一致；各档变更记录 10 ∕ 10 在位；表 A 15 档 / 表 B 8 档计数与 A16 余量 93 自洽。

**范围外备注（不判级）**：① A④ 落点 `docs/desktop/design/IPC.md` 不在本次 Documents to Review 列表 ⇒ 该笔未能验收（unverified）；② 评审范围列表两处路径与盘面不符（`cli/design/MODEL-BENCH.md` ⇒ 实为 `core/design/MODEL-BENCH.md`；`vsc/design/E2E-TESTING.md` ⇒ 实为 `desktop/design/E2E-TESTING.md`）——疑为范围声明笔误，两档已按实盘路径逐处复核；③ 文档地图缺位 ⇒ Document ownership 维度按降级口径评。

VERDICT: pass
计数：🔴 0 · 🟡 4 · 🔵 5（合计 9）；范围外备注 3（不判级）。

## §4 用户批准（主 agent）

**父侧代签 + 追认（用户 2026-09-29 13:52「别等我了，自己跑完」授权）：**

本批 = **行施为先批**（设计面笔随设计轮同位执行——先例 = `doc-dangling-sweep`），故批准面 = 追认制：
① **评审 pass**：§3 轮次 1 = 通过（🔴0 · 🟡4 · 🔵5——评审 #202）；
② **修正轮九条落定**：逐条落位并经父侧抽验（`WEBVIEW-INPUT.md:53` 已收敛为纯现态句 ✓ · 四档记录面 +1 行在册 ✓ · §1 `:10` 引节号由父侧收正 = §16.3 + §16.12 上抛 2）；
③ **凭证**：评审签发之 token 在会话槽（值不落档）。
**据此追认批准；本批无待实施项（笔已全落）——直接进入 §6 收口。** 上抛观察 O1–O4 处置：O1 已收（父侧笔）；O2 记录面不动；O3 挂台账（下一文档轮顺笔）；O4 维持本笔形态（细则面纯现态——#203 记录面保留为史实）。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**波面（全落）**：设计轮（11 档 A ∕ B ∕ C ∕ #549 逐处落笔 + 各档变更记录）＋ 修正轮 1（评审 #202 九条——四档就地收正 + 批档 §2）＋ 父侧笔（§1 `:10` 引节号收正 · §4 追认）。

**验证（父侧）**：① `node scripts/doc-check.mjs` 双跑留痕（`.thincoder/tmp/doc-check-fixround1-pre.log` ∕ `-post.log`）：悬空 160 ⇒ 160（**本批写域零新增**；设计轮 173 ⇒ 171 在册）；行宽 +2 均归他批并发笔；② 抽验：`WEBVIEW-INPUT.md:53` = 纯现态句 ✓ ∕ 四档记录面各 +1 行 ✓ ∕ `CLI-DEBT.md` A16 转正读数 ✓ ∕ `UI.md` 同笔 `:346/:19` 在盘 ✓；③ 评审 #202 = pass（0🔴——§3 全表在册）。

**边界**：产品码 ∕ 需求档 ∕ 提示词零触；D ∕ E 组留待放行（另轮）；O2 ∕ O3 处置 = 记录面不动 ∕ 台账挂账（#612）。

**结算（D7）**：**#251 ∕ #255 ∕ #298 ∕ #549 → 已核销**（依据本节 + §2 ∕ §3；转档句已随本批落设计档，后续由各自条件触发）。**状态行**：已收口 2026-09-29。

**结算补正**：届查台账——#251 ∕ #255 ∕ #298 ∕ #549 四行**已于先前流程核销**（现态 已核销）；本批为其**转档载体**（转档登记句已落设计档，后续由各自条件触发复启）。§6 前文「→ 已核销」按此理解（本轮无新状态迁移）。
