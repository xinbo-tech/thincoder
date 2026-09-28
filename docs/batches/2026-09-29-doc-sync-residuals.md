# 2026-09-29 · doc-sync-residuals
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 父侧 2026-09-29 03:2x 三批收口残留扫（轮 8 收正行 + 退役续收 + 台账在册文档面）。
> 台账 = #251 ∕ #255 ∕ #298 ∕ #549（core ∕ cli ∕ vsc 文档面 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批（父侧 · 2026-09-29 03:4x）
- **来源**：三批（tech-debt ∕ parity ∕ flow）收口后的**设计面残留收正**。范围 = **A 组**（轮 8 收正行：`AGENT-LOOP-ASYNC-POOL.md` §6.30 ∕ `SESSION.md` §6.21 ∕ `MODEL-SPECS.md` §16.9-2 ∕ §16.3 ∕ `IPC.md` `msg:send` `aborted` ∕ `WEBVIEW-INPUT.md` C-B2-6 ∕ agent-turn 407 登记）＋ **B 组**（#251 ∕ #255 ∕ #298 三登记句）＋ **C 组**（`CONFIG.md:48` ∕ `CORE-UNIFICATION.md:42/:1352`）＋ **#549**（E2E-TESTING 真机面同步）。
- **待放行**：**D 组**（desktop 退役续收 ∕ 存量悬空 ∕ #548）· **E 组**（§4.1 全表重锚 #551）——桌面三档在他轮冻结窗解除后另派。
- **口径**：写优先（每落一笔即 read-back 核——前身 #45 因 26 回合零落盘被撤）；产品码零触；设计面笔权 = eng-designer（本批设计轮 #49 已派在跑）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（前轮改动 11 档 · 本 append = 转落）
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

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
