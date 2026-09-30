# 2026-09-29 · desktop-extension-engine-face（桌面补线·引擎面：五项未接待裁 + 对齐审计强制输入清单）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 挂账族集中处置（用户 2026-09-29 16:56 令）——桌面补线·引擎面载体：台账 #523 ∕ #524。。
> 台账 = #523 ∕ #524（桌面 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批（父侧 · 2026-09-29 16:5x）

- **来源** = 挂账集中处置令（16:56）；授权 = 13:52 全权。
- **条目（2 行）**：**#523**（桌面五项「未接·待裁」——`onCompress*` ∕ `onWait` ∕ `configureExecRun` ∕ 会话 GC 启动径 ∕ trace 登记面 + 休眠缝两项交核侧：`configureEditReceipt ∕ configureGitApproval`；设计轮给**逐项裁定表**：接 ∥ 不接（+由））· **#524**（对齐审计强制输入清单——核档头「留端」清单 + 核注入缝登记表 22 导出为**强制输入**；落点 = 方法注记（设计面））。
- **口径**：设计 = eng-designer（含逐项裁定）；实施按裁定（码 ∕ 档面分流）；#523 若裁「接」⇒ 落面清单进 §2。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（（#523 七项逐项裁毕 ∕ #524 收正随落 ∕ 零产品码））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计（eng-designer · 2026-09-29 · 设计轮 · initial）**

**覆盖条目**：台账 **#523**（桌面五项「未接·待裁」+ 休眠缝两项）· **#524**（对齐审计强制输入清单——方法注记）。**产出** = 逐项裁定表（七项 · §2.1）+ 接项落面清单（§2.2）+ 不接项登记（§2.3）+ 交核侧转单（§2.4）+ #524 收正（§2.5 · 已随设计轮落）。**零产品码改动**（写面 = `docs/desktop/design/PROJECT.md` 单档——设计面）。

#### 2.1 逐项裁定表（#523 · 七项 · 无空值）

| # | 项 | 裁定 | 由 | 落面 ∕ 登记 |
|---|---|---|---|---|
| 1 | `onCompress*` | **接（已在位）** | R4（`docs/batches/2026-09-28-desktop-feature-parity.md`）已落——桌面压缩生命周期四态可见面 | §2.2-①（零新码） |
| 2 | `onWait` | **接（已在位）** | R4 已落——等待相位五 kind 状态文本面 | §2.2-②（零新码） |
| 3 | `configureExecRun` | **接（已在位）** | R3 已落——可中断执行器注入 | §2.2-③（零新码） |
| 4 | 会话 GC 启动径 | **接（已在位）** | R1 已落（并入 #406）——启动拍 + 恢复径双点火 | §2.2-④（零新码） |
| 5 | trace ∕ 丢弃痕登记面 | **不接** | trace 支 = 非用户可见面（VSC 开发者诊断链路；CLI 侧无 `/traces` 命令——仅启动清理 + `/config` 开关）⇒ 对齐义不要求桌面造；丢弃痕支 = 子块 drop 痕迹（核留端清单项）——归 **#608**（`docs/batches/2026-09-29-desktop-rebuild-fidelity.md` 在途）处置 | §2.3；登记已落 = `docs/desktop/design/PROJECT.md` §10 **CK** 行 |
| 6 | 休眠缝① `configureEditReceipt` | **交核侧**（本批零接） | 三端零消费者 + 端审批在工具执行前（`docs/core/design/TOOLS.md` §6.11 既有口径）⇒ 非桌面对齐缺口 | §2.4；登记已落 = §10 **CL** 行 |
| 7 | 休眠缝② `configureGitApproval` | **交核侧**（本批零接） | 同上 | §2.4；§10 **CL** 行 |

**裁定基准**（关键决策）：**现盘实读优先于台账表述**——①②③在台账行内记「未接」与现盘相抵（R3/R4/R1 已落）；本设计按现盘裁定为「接（已在位）」，并在 §2.8 报坐标陈旧族（收正归父侧）。**零静默打折**：七项逐项在册、无空值。

#### 2.2 接项落面清单（四项 · 已在位——本设计轮现盘复核 + 判据）

**① `onCompress*`**：核发射 = `thincoder-core/context.mjs:304`（`onCompressStart`）· `thincoder-core/agent/run-stages.mjs:89`（成功）/`:98`（失败）/`:106`（fallback）；桌面链 = `thincoder-desktop/src/main/agent-bridge.mjs:287-296`（四回调 ⇒ `ev:compress`）⇒ `src/preload/preload.cjs:50`（出站白名单）⇒ `renderer/events-subscribe.mjs:40` ⇒ `renderer/events.mjs:227` ⇒ `renderer/events-status.mjs:83`（切片写）⇒ `renderer/views/compress-status.mjs` + `renderer/views/chat-model.mjs:76`（渲染）。**判据** = 四态（start ∕ done ∕ fallback ∕ failed）经 `ev:compress` 至流内压缩行；词面 = 核字典 `compress.*`（零端自铸词）。

**② `onWait`**：核 = `callbacks.onWait` 经 `thincoder-core/agent/chat-call.mjs:33` 透传 provider 链（`provider/core.mjs` / `rate.mjs` / `retry.mjs` 发射）· 相位→kind 映射 = 核单源 `thincoder-core/provider/wait-status.mjs`；桌面链 = `agent-bridge.mjs:280-286`（⇒ `ev:statusText`；`warn` ∕ 未知 ⇒ 零载波）⇒ `preload.cjs:50` ⇒ `events-subscribe.mjs:40` ⇒ `events.mjs:226` ⇒ `events-status.mjs:76` ⇒ `renderer/views/statusline.mjs` 段 3 支③。**判据** = 五 kind 状态文本可见且零自铸词。（台账引坐标 `agent.mjs:274` = 三拆前旧址——见 §2.8。）

**③ `configureExecRun`**：桌面端面 = `thincoder-desktop/src/main/exec-run.mjs:19-22`（`installExecRunSeams()`：`configureExecRun({ run: runInterruptible })` + `configureProcessTreeKill`）；接线 = `src/main/agent-assemble.mjs:17/:32`（模块装配期一次）；值 = 核件单源（`thincoder-core/tools/exec-run.mjs:32` ∕ `:61`——`runInterruptible` 上提 R3；VSC 同形 = `thincoder-vscode/src/tools/shared.mjs:104`）。**判据** = 桌面装配期注入在位 ∧ 核 linter ∕ verify 命令经 `runCommand` 单点（可中断——Stop ⇒ 树杀）。

**④ 会话 GC 启动径**：启动拍 = `thincoder-desktop/src/main/main.mjs:116`（窗口起后 `scheduleSessionMaintenancePasses({ cwd: currentCwd() })`——GC + 索引两枚；核侧启动窗外 3s 延迟拍、每进程一次去重）；恢复径 = `src/main/ipc.mjs:172`（`session:resume` 成功径 `scheduleSessionGC(receipt.cwd)`）；供面 = `src/main/session-maintenance.mjs:104-112`。装载径走 `loadSlotFile`（绕 `resumeSlot`）为**有意设计**（`src/main/session-io.mjs:13-17`——防认领竞争）⇒ GC 时点 = 启动拍 + 恢复成功径双点火（`thincoder-core/session-gc.mjs:195` 去重）。**判据** = 两点火点在场 ∧ 核侧去重成立。

#### 2.3 不接项（#523④）· 登记形态

- **trace 支** = `traces` ∕ `stopTrace`：**不做**（非用户可见面——对齐义不要求桌面造；先例判定 = 对位批 §2.9 上抛 4 ∕ R10）。登记形态 = 端差登记（裁定 · 不做）——**已随设计轮落**：`docs/desktop/design/PROJECT.md` §10 **CK** 行（现读 :1032-1033，届盘复核；消解路 = 用户显式要求桌面诊断面时另立轮）。
- **丢弃痕支** = 子块 drop 痕迹（核留端清单项）——归 **#608**（在途批）处置；本批不双处理。

#### 2.4 休眠缝两项（#523⑤）· 交核侧（转单形态 · 核侧落点建议）

- **议题**：`configureEditReceipt`（`thincoder-core/tools/edit-diff.mjs:398`；reset :402；消费 = `composeEditReceipt` :408-414）· `configureGitApproval`（`thincoder-core/tools/git.mjs:64`；reset :68；消费 = :130-134）——**三端零消费者**（本设计轮全仓 grep 复核：仅定义 + reset + 文档引用）。
- **现状口径**：两缝缺省 = 零行为变（CLI 语义 ∕ 无门）；`docs/core/design/TOOLS.md` §6.11 已载「端审批在工具执行前」（端审批不由工具层缝承担）。
- **处置两选项（核侧裁）**：**A · 保留 + 重分类（本设计倾向）**——登记行由「未接（休眠缝）」改判「**不接（有由）**——端审批在工具执行前 ∕ 零行为变默认；保留为扩展点」+ 到期条件（任一端提出该面需求〔审批粒度细化 ∕ 只读判定 ∕ 回执形态〕时启用并重裁）；零码改。**B · 退场**——删注入面 + reset + 消费支（`edit-diff.mjs` :397-414 ∕ `git.mjs` :63-68 + :130-134）；登记行改「已退场」；`TOOLS.md` §6.11 句随正。
- **核侧落点建议**：`docs/core/design/CORE-UNIFICATION.md` §2.13.3（族余项）∕ §2.13.4（#59 ∕ #69 行——改判 + 行号届盘重锚）+ `docs/core/design/TOOLS.md` §6.11（随动）；选 B ⇒ 另加两源码档 +（测试树重建时）缝自检随动。
- **同族**：`setWaitForConditionSource`（`thincoder-core/tools/ops.mjs:129`）——对位批 §2.9⑤ 已建议合并一条核侧议题；本批台账行未含 ⇒ 建议并单（待父侧裁）。登记 = §10 **CL** 行（现读 :1032-1033，届盘复核）。

#### 2.5 #524 方法注记（KD-42）收正 · 已随设计轮落

**落点档** = `docs/desktop/design/PROJECT.md` §2 **KD-42**（现读 :82）。**收正三事**：① 输入锚由已退役机检档（`thincoder-core/test/tool-seams.test.mjs`——随 2026-09-28 核测试树全清退役；现盘 `test/` 仅 run.mjs ∕ slow.mjs）改指**设计面单源** = `docs/core/design/CORE-UNIFICATION.md` §2.13.3（函数面注入位表）＋ §2.13.4（④裁决行对照）；对账面 = 设计面记录 ＋ 届盘复核（测试树重建后回填机检）；② 补落先例批修正 12 已裁未落句「**域外对账保持人工**」（机械并扫命名族 `(configure|reset|set)[A-Z]` 会撞功能性 setter ⇒ 假阳性）；③ 先例句现状收正（`configurePromptInjections` 桌面已补接）。留端清单支 ∕ 判定三态 ∕ 根因先例 ∕ 对账节载体 ∕ 被否列均原样。**先例批的 KD-42 死锚成因（随落脱靶——该批 §3 评审发现 4 ∕ §5 报告项 1 均点名未落）随本轮闭合。**

#### 2.6 受影响文件与测试面 · 实施面（供下轮）

- **设计档（本轮已落）**：`docs/desktop/design/PROJECT.md`——KD-42 收正（:82）+ §10 增 **CK** ∕ **CL**（现读 :1032-1033，届盘复核）+ 变更记录一行（现读 :1322，届盘复核）。**产品码：零改**。
- **实施面（供下轮）**：**零**——①②③④ 已在位（无实施动作；余 = 台账核销归父侧）；⑤ 登记（CK ∕ CL）已随设计轮落；转单核侧执行 = 核侧轮（§2.4）。
- **测试面**：无（设计面批；无码改动）；批内件 = 无。

#### 2.7 验收对照（回指批任务四项 + 登记在盘）

| AC | 判据 | 状态 |
|---|---|---|
| ① 裁定表覆盖七项（无空值） | §2.1 表 = 7 行（1–7），行行有裁定 + 由 + 落面 ∕ 登记 | ✓ |
| ② 接项给落面清单（file:line + 判据） | §2.2（四项——现盘实证链 + 逐项判据） | ✓ |
| ③ #524 注记（落点档 + 文本） | §2.5（KD-42 收正已落——落点档 + 三收正事在册） | ✓ |
| ④ 零产品码改动 | 本轮写面 = `docs/desktop/design/PROJECT.md` 单档（设计面） | ✓ |
| ⑤ 登记在盘 | §10 CK ∕ CL 两行（内容锚定）逐字在位 | ✓ |

#### 2.8 上抛与发现项

1. **转单（§2.4）**——请父侧：a) 立核侧行（台账 tech_todo ∕ 核面批）携 A ∕ B 两选项 + 落点清单；b) 并单第三缝 `setWaitForConditionSource` 与否（待裁）。
2. **台账收正（归父侧笔）**：#523 逐项裁定后核销（①②③④ 已在位；⑤ 转单已登记）；#524 核销（收正已落）；**坐标陈旧族收正**——`agent.mjs:274`（onWait）⇒ 现体 `thincoder-core/agent/chat-call.mjs:33`（P2 三拆后；agent.mjs 现 106 行）；`edit-diff.mjs:392 ⇒ :398`；`git.mjs:58 ⇒ :64`；「桌面 IPC 18 通道表」现况 = 事件 23 位 ∕ 请求 45 项（§10 BE 行在册）。
3. **发现**：① #523①②③ 在台账行内记「未接」与现盘相抵（陈旧——R3/R4/R1 已落）；② `tool-seams.test.mjs` 死锚（#524 引用）随全清令退役——本批收正；③ 先例批 KD-42 补句「随落脱靶」实证（本轮补落）；④ R10 traces 判定此前未单列登记（仅在批级上抛袋 BS 行）——本轮落 CK；⑤ 同族第三缝越本批台账行（建议并单）。**过程披露**：落笔期 `PROJECT.md` 有并行批在途（KD-34 ∕ KD-40 坐标重锚 + §4.1 越线档重写）⇒ 行号漂移致本舱初轮一笔错行（误及 `BZ` 行 + 一处迁移续行）；已按 HEAD 原文自查复原（现净差 = §2.6 所列三笔意图内改动）——后续行以内容锚定复核在册。

**修正轮（§3 轮次 1 = 评审 #30 · 三条处置 ∕ 父侧裁定全受理）· eng-designer · 2026-09-29**：① 引用漂移——§2.3 ∕ §2.4 ∕ §2.6 三处「现读」行号按内容锚定重锚（`docs/desktop/design/PROJECT.md` §10 **CK** ∕ **CL** ⇒ :1032-1033；本批变更记录行 ⇒ :1322）+「届盘复核」限定；原记 :1017 ∕ :1018 ∕ :1306 系并行在途批位移所致，KD-42（:82）未漂 · 零改。② 验收——§2.7 增 **⑤ 登记在盘**行（§10 CK ∕ CL 两行 · 内容锚定逐字在位；本轮实读复核）；标题随动「回指批任务四项 + 登记在盘」。③ 清晰——§2.5「收正三事」编号归一（①②③ 对应三收正事）+「均原样」独立成句。零产品码 ∕ 他档零改；§3 零改。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象** = 本批 §2 设计（桌面补线·引擎面：七项逐项裁定表 + 接项落面清单 + 不接项登记 + 交核侧转单 + #524（KD-42）收正）。

**限界声明**：无项目标准档 ∕ 无文档地图声明 ⇒ 方法面沿 AGENTS.md 判、「文档归属」维度降级（以 `docs/desktop/design/PROJECT.md` §2 KD 登记 + §10 表为既有归属位判）；抽验含盘面实读（仅用于核对设计断言，未扩评审靶面）。**受影响档行数注**：本批零源码 ∕ 测试档改动（写面 = 纯 .md 单档）⇒ 行数注义务不适用。

**抽验（实读核对 · 均与设计断言一致）**：① `onCompress*` 链 = 核 `context.mjs:304` ∕ `agent/run-stages.mjs:89/:98/:106` → 桥 `agent-bridge.mjs:289-296` → `preload.cjs:50` → `events.mjs:227` → `events-status.mjs:83`（四态）；② `onWait` 链 = `agent/chat-call.mjs:33` + `provider/{core,rate,retry}.mjs` 发射 → 桥 `:283-285` → …… → `statusline.mjs` 段 3 支③；③ `configureExecRun` = `src/main/exec-run.mjs:19-22` + `agent-assemble.mjs:17/:32`（核 `tools/exec-run.mjs:32/:61`）；④ 会话 GC 双点火 = `main.mjs:116` + `ipc.mjs:172`（核 `session-gc.mjs:195` 前缀 Set 去重）；⑤ 休眠缝 = `tools/edit-diff.mjs:398/:402/:408-414` · `tools/git.mjs:64/:68/:130-134`，全仓 `*.mjs ∕ *.cjs ∕ *.js ∕ *.ts` 零消费者（「三端零消费者」成立）；⑥ KD-42 收正三事在盘（`PROJECT.md:82`：设计面单源锚 ✔ ∕ 「对账保持人工」句 ✔ ∕ `configurePromptInjections` 桌面已补接 ✔——`thincoder-desktop/src/main/main.mjs:30`）；⑦ `CORE-UNIFICATION.md` §2.13.3（:1294）∕ §2.13.4（:1316）在盘；`TOOLS.md` §6.11（:263/:276）「端审批在工具执行前」在盘；#608 批在途且含「丢弃痕迹」；桌面需求档零 traces 需求（「不接」无需求冲突）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state（引用漂移） | 🟡 | 设计三处「现读」行号已被并行在途写位移：`PROJECT.md` §10 **CK** ∕ **CL** 于本评审读时实读 `:1032-1033`（批档 `:49` ∕ `:58` ∕ `:66` 记 :1017 ∕ :1018）、本批变更记录行实读 `:1322`（批档 `:66` 记 :1306）——同档 2026-09-29 条目族（KD-50（:92）等）插入所致；KD-42 仍 `:82` 在位。设计 §2.8.5 已披露并行写者并声明「内容锚定复核」，但三处字面旧值未随动 ⇒ 按行号直查脱靶 | 复核按内容锚定（「§10 CK ∕ CL 行」「本批变更记录行」）；收口时届盘重锚行号或补「届盘复核」限定语 |
| 2 | Acceptance | 🔵 | §2.7（`:72-77`）四行 AC 未单列「§10 CK ∕ CL 两行在盘」判据（① 只验裁定表三列、③ 只覆盖 KD-42）——本批两大登记产出（不接登记 ∕ 转单登记）无独立验收行 | 增一行 AC：「§10 CK ∕ CL 两行按内容锚定在位」 |
| 3 | Clarity | 🔵 | §2.5（`:62`）「收正三事」编号散乱：起句「① ② 输入锚由…」并列两号、段尾裸「①留端清单支 ∕ …均原样」再占一号 ⇒ 三收正事与「保留面」边界歧义 | 编号归一（①②③ ↔ 三收正事）+「均原样」项独立成句 |

**计数**：🔴 0 ∕ 🟡 1 ∕ 🔵 2（+ 域外注 1）。
**域外注（无 severity）**：`thincoder-desktop/src/main/agent-bridge.mjs:26` ∕ `:280` 注句仍引 `agent.mjs:285`（onWait 旧址——现体 = `thincoder-core/agent/chat-call.mjs:33`，agent.mjs 现 106 行）——同类坐标陈旧，落点在代码注句、非本评审靶面，记此供「坐标陈旧族」收正并单参考。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 父侧代签（用户 2026-09-29 13:52 全权 + 17:02「尽可能消除」令）

- 评审 #30 = **pass**（🔴0 · 🟡1 · 🔵2）→ 修正轮（§2 修正块）三处落定 ∥ 读回核讫。
- 批准：本批 = **零产品码**——实施面 = 设计档随落（`PROJECT.md:82` KD-42 收正 + §10 CK ∕ CL 登记）+ 台账收称；四项「已在位」复核无新增实施。
- 附：两休眠缝转单核侧 = 新挂台账 **#641**（携两选项：A 保留重分类〔设计倾向〕∕ B 退场）。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

### 6.1 验证与收口（父代理 · 2026-09-29 17:2x）

- **交付核对**：七项裁定全处置——1–4「已在位」复核 ✓（四链现盘实证）· 5 trace 支「不做」+ 登记 **CK** ✓ · 6–7 转单核侧 **CL** + 台账 #641 ✓；登记在盘（内容锚定）：`PROJECT.md:1032-1033` · KD-42 收正 `:82`。
- **验证腿**：评审 #30 实读（六链 file:line 全命中 + 零消费者 grep）∥ 修正轮读回核（§2 修正块）∥ 零产品码核（写面 = `PROJECT.md` 单档）。
- **台账**：#523 核销（①②③④ 已在位 ∕ ⑤ 登记）· #524 核销（KD-42 注记已落）· 新挂 #641（核侧两缝两选项）。
- **残留**：无（域外注 = agent-bridge 注句 → 台账 #639 在册）。
- **收口**：本件冻结。
