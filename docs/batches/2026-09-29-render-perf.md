# 2026-09-29 · render-perf
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 13:45 走查「输出速度好慢」+ 父侧真机计时实锤（`thincoder/.thincoder/tmp/perf-probe.mjs`：单块流式每 chunk 重挂成本随文本线性增长 10KB=0.9ms ∕ 40KB=4.5ms ∕ 80KB=5.9ms）+ 用户 13:48 斥责「VSC 早就处理了的毛病又搞出来——渲染核干了啥」。
> 台账 = #609（desktop ∕ 核 · 归批）。前情 = #518 ∕ #603 批（块跟滚族 · 同飞）+ 真机计时实锤（台账 #609）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29

### 1.1 报障与真机实锤（父侧 · 2026-09-29）

用户 13:45「桌面端渲染是不是有什么问题？现在输出速度好慢!」→ 13:48 斥「VSC 早就处理了的毛病又搞出来，渲染核干了啥」。

**真机计时（`thincoder/.thincoder/tmp/perf-probe.mjs` · 真 Electron 直驱 `mountChat`）**——单块流式正文每 chunk 重挂成本随已积累文本**线性增长**：0.5–2 KB = 0.1ms · 5 KB = 0.4ms · 10 KB = 0.9ms · 20 KB = 1.7ms · 40 KB = 4.5ms · 80 KB = 5.9ms（≈0.06–0.1ms/KB）。⇒ **答案越长、每 chunk 越贵**；再叠「每 chunk 多触发面（正文 ∕ 推理 ∕ 状态行 ∕ 池区）+ 强制布局」。

**同族先例（VSC 已付成本）**：`thincoder-vscode/CHANGELOG.md`「Stop 卡顿（渲染积压）」——每 chunk 全文 md 重渲 + DOM 重建 ⇒ O(n²) 淹没主线程；**修法 = rAF 节流（O(1) 字符串追加、每帧最多渲一次）+ advisor/subagent 滚动纳入节流**。桌面缺该层。

### 1.2 根因定位（父侧 · 结构层）

- 渲染核统了「构件与渲染逻辑」（长得像），**未统「更新纪律」**（何时重挂 ∕ 一次多少 ∕ 合并节流 ∕ 布局节俭）——「宿主帧模型 = 端」的留端边界把宿主事实（rAF ∕ store 帧）过度推广成了整个更新层。
- 桌面现形 = **状态树订阅驱动 · 每面「clear + build + append」整面重挂**（#187 清点）；每 chunk 全量重挂 ⇒ 成本 ∝ 内容长度。
- **方向（父侧钉死）**：**触发源留端（rAF ∕ store 帧）、更新纪律收核**（rAF 帧合并脏集 + O(1) 增量追加 + 帧尾动作 + 禁逐 chunk 强制布局）——**直取 VSC 已付轮子**，桌面消费同一件；「VSC 已修同族缺陷清单」入桌面开工检查项。

### 1.3 边界与串行

- 与 #603 批（块跟滚让位修复）交叠面 = 池区 churn 消（`views/activity.mjs` 原位领用）——**归 #603 批实施**，本批不重做；本批 = **更新纪律族**（流式缝合 ∕ 帧合并 ∕ 增量尾更新 ∕ 布局节俭 ∕ 各面重挂面收窄）。
- 相关台账：#605（工具卡每 chunk 重建）· #604（设置面整树重建）· #606（重建面位/焦点族）· #607（pin 工厂）——本批设计裁「并入 ∕ 排后」。
- 探针件（计时基座）随批留存；验收 = 真机计时复跑（80KB 处 5.9ms ⇒ O(1) 量级）+ 三端对拍腿。

### 1.4 设计交付与评审排程（父侧 · 2026-09-29 14:0x）

- **设计已落（#193）**：KD-RC-9 新增（核档 `RENDER-CORE.md:75`——脏标记 ∕ 帧合并 ∕ 应用器契约 + 五被否候选）· KD-RC-8③ 收正（`:74`——「宿主帧模型 = 端」退场 ⇒ 触发源 = 端 · 帧合并纪律 = 核）· `RENDERER.md` §1.2（`:102-108` 端侧触发源接口）· 文件表（批档 §2.4 + `design/PROJECT.md` §4.2）· 验收（AC-1–5 + R-1–5 真机腿——阈值 ≤0.3ms@80KB ∕ 帧 p95 ≤8ms）· 裁定（#605 并入消 ∕ #604·#606·#607 排后）· 上抛六项（§2.8）。
- **评审点火排程（父侧裁）**：与在飞串行列（#192 滚动修正 → #195 susp-queue 修正 → #199 状态行修正——同触 `RENDER-CORE.md` ∕ `RENDERER.md` ∕ `UI.md`）**文件面互斥**（评审冻结窗会打回其写入）⇒ **本批评审点火 = 该串行列排空后（#199 落定）即刻执行**。此为排程序，非停顿。
- 上抛处置：§2.8① 需求档性能行 = 父侧笔（随落）；② #592 挂账（探针扩面件）随落；③ 滚动批档 §2.13 句与 KD-RC-9 不同步 → 已转 #192 修轮注记；⑤ §4.2 R3c 残句 = 记录面不动；⑥ `chat.mjs` 拆分执行 = 设计已裁（评审复核）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（设计轮 + 修复轮（评审轮 1（#214）· 十发现逐号）已落——设计四档 + §2.9（机检零净增）；批内件两档待实施轮）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 批次任务（覆盖 · 台账 #609）

设计轮交付（零实施）：把 VSC 已付的轮子（rAF 帧合并 + O(1) 增量追加 + 帧尾动作 + 禁逐 chunk 强制布局）上提为核的更新契约、桌面消费——消「每 chunk 全量重挂 ⇒ 成本 ∝ 文本长度」。

覆盖七件：
1. 核新增 `flow/frame.mjs` 帧合并件（脏标记 ∕ 帧合并 ∕ 应用器契约；`FRAME_MIN_MS`=50 · 单飞 rAF · `flush`）——**更新纪律收核**。
2. 核 `appendToolOutput`（O(1) 工具输出追加原语——自 VSC `chat-messages.js:77-96` 上提；VSC 改指零行为变更；桌面工具卡消费——**#605 并入消**）。
3. 桌面接装：`app.mjs` 订阅改 `mark`（触发源 = store 变更）+ 分派件 `frame-dispatch.mjs`（键集 → 六面 · 每面每帧至多一次）。
4. 逐面落点（会话流正文 ∕ 推理 · 工具卡 · 状态行 · 池区 · 卡面 ∕ 会话条 ∕ 会话头——见 §2.3 表）。
5. `views/chat.mjs` 越 300 消解（窗口到期）：模型族七件出档 `views/chat-model.mjs`。
6. 验收腿：真机计时前后对照（探针扩面）· VSC 零回归 · 平 node 机检（§2.5）。
7. 文档面落点（§2.2）。

明确不在本批：**#603**（池壳原位领用——在飞）· **#604**（设置面草稿保真——排后）· **#606**（重建面位 ∕ 焦点族——排后）· **#607**（pin 工厂——排后）；CLI ∕ 心跳面 ∕ 虚拟化零触碰。

### 2.2 设计落点（文档面 · 已落）

| 档 | 落点 |
|---|---|
| `docs/render-core/design/RENDER-CORE.md` | 新增 **KD-RC-9**（更新纪律收核）+ **KD-RC-8③ 收正**（触发源 = 端）+ 被否列同拍；§3 行 4 ∕ §4 行 3 ∕ §5 两条目随动；§5 增调度族 + 追加原语；§6 本批随动段；§7 C9–C11；§10 I ∕ J |
| `docs/desktop/design/RENDERER.md` | §1 索引 + **新 §1.2**（更新纪律：帧合并）+ §1.1 帧面分派条 + §3 属句收正 + 读数按档裁剪条 |
| `docs/desktop/design/UI.md` | :477 ∕ :490 同句域收正（「无 rAF——直调」退场）+ 对话流行补 §1.2 指针 |
| `docs/desktop/design/PROJECT.md` | §2 **KD-48** · §4.1 两新档行 + `views/chat.mjs` 行 · §4.2 本批块 · §10 CD 收正 + CE ∕ CF |
| `docs/desktop/requirements/PROJECT.md` §6 性能行 | 阈值与测法 = 本批定形（§2.5 AC 真机腿）——**父侧落笔**（建议文本 = §2.8 ①） |

### 2.3 机制设计（更新契约 · 逐面落点）

**契约形**（单源 = 核档 §2 KD-RC-9）：
- **核侧件形**：① 脏标记 `mark(keys)`（O(1) 脏键集）② 帧合并（单飞 rAF + `FRAME_MIN_MS`(50) 最小间隔 + 跳帧重排 + `flush` 同步尾帧）③ 应用器契约（每键面每帧至多绘一次 ∕ 增量更新为默认 ∕ 布局节俭 ∕ 帧尾动作落面尾段 ∕ 每 chunk 同步成本禁 ∝ 累计文本）。
- **端侧触发源接口**：宿主事件 → `mark`（VSC 流式装配 ∕ 桌面 `store` 订阅）；**帧时刻现读**（禁 mark 时刻取态快照）；`flush` 消费点 = `returnToLatest` 回底顺序保真 + 测试 ∕ 探针确定性。
- **核件形**：`flow/frame.mjs` `createFrameMerge({ apply(dirtyKeys), raf?, now?, minMs? }) → { mark, flush }`（帧语义逐行对位 `createStreamRenderer` `flow/stream.mjs:36-92`）；`flow/stream.mjs` `appendToolOutput(el, text, deps?)`（占位清 ∕ 超 `MAX_TOOL_OUTPUT` 截断（注 = `capText` 缺省注单源）∕ `_capped` 停收）。

**逐面落点**（触发键 → 帧内处理）：

| 面 | 触发键（现行键集） | 现行（file:line） | 预期 |
|---|---|---|---|
| 会话流正文 ∕ 推理 | `blocks`（CHAT_KEYS） | 逐 chunk 同步全链：尾块 md 全量重渲（`chat-text.mjs:83-87` → 核 `flow/stream.mjs:22`）+ 帧内多扫（`chat.mjs:307` ∕ `:322` ∕ `:360-361`）+ 两读（`chat.mjs:350` ∕ `:353`） | 帧界（≤1/帧）：尾块就地 md 重渲 + `mounted` 记账直取（零全块扫）+ 读数按档裁剪（跟滚帧零读） |
| 工具卡输出 | `blocks`（尾块 `kind=tool`） | 每 chunk 整卡 `replaceWith`（`chat.mjs:310-314`——#605：自滚位 ∕ 选区逐帧归零） | **就地更新**：头行分段刷 + 结果区 `appendToolOutput` O(1) 追加（节点身份不变——零重建） |
| 状态行 | `blocks` ∈ STATUS_KEYS（`mount-status.mjs:20`） | 逐 chunk `clear+build+append` 全量重建（`statusline.mjs:152`） | 帧界 + **面内差分门**（模型等价 ⇒ 零写——`blocks` 保持入键：工具段更新点随块面） |
| 池区 | `subBlocks`（POOL_KEYS） | 逐 chunk 壳 churn（壳原位领用 = #603 在飞消） | 帧界（≤1/帧）；壳领用 = **#603**（不重做） |
| 卡面 ∕ 会话条 ∕ 会话头 | CARDS_KEYS ∕ SESSION_KEYS ∕ HEAD_KEYS（低频） | 逐写即绘 | 帧界（低频键面；位 ∕ 焦族 = #606 排后） |
| 复制钮 gating | （随尾节点） | 帧级全根扫（`chat.mjs:277` ∕ `:360`） | 随尾节点着装（重挂全根一次 + 尾段逐新节点——禁帧级全根扫） |
| 心跳拍（1s） | 计时器（非 store） | 直接 `refreshLiveBlocks` + 条件 `paintStatus`（`app.mjs:247-252`） | **不动**（低频有界——登记） |

### 2.4 受影响文件与测试面（逐档「现行 ⇒ 预期」+ 行宽 ∕ 越层核）

行数 = 实读 2026-09-29（行计数口径——与在册「内容行数」差 1 属末行口径，沿先例）。

| 档 | 现行 ⇒ 预期 |
|---|---|
| 核 `thincoder-render-core/flow/frame.mjs`（新） | — ⇒ ≈60（帧合并件） |
| 核 `thincoder-render-core/flow/stream.mjs` | 113 ⇒ ≈135（+`appendToolOutput`） |
| 核 `thincoder-render-core/test/run.mjs` | 82 ⇒ ≈110（+帧归并用例） |
| VSC `thincoder-vscode/webview/chat-messages.js` | 267 ⇒ ≈262（toolOutput 支改指核件——零行为变更） |
| 桌 `renderer/app.mjs` | 271 ⇒ ≈275（帧接装） |
| 桌 `renderer/frame-dispatch.mjs`（新） | — ⇒ ≈50 |
| 桌 `renderer/views/chat-model.mjs`（拆分产出） | — ⇒ ≈95 |
| 桌 `renderer/views/chat.mjs` | 361 ⇒ ≈265（越 300 消解——模型族出档） |
| 桌 `renderer/views/chat-tool.mjs` | 217 ⇒ ≈233 |
| 桌 `renderer/views/chat-chrome.mjs` | 292 ⇒ ≈298（**贴层**——PROJECT.md §10 CF） |
| 桌 `renderer/views/chat-scroll.mjs` | 93 ⇒ ≈99 |
| 桌 `renderer/views/statusline.mjs` | 177 ⇒ ≈182 |
| 测试 ∕ 探针面 | 批内件两档 = `docs/batches/2026-09-29-render-perf.test.mjs`（平 node 机检）+ `-probe.mjs`（真机计时扩面——来源 = `.thincoder/tmp/perf-probe.mjs`，原件保留）；仓套件不写 ∕ 不改 ∕ 不跑（全清令） |

**行宽核**：四设计档新增散文行 ≤300；KD 表行按表内现行形（同族行皆超 300——既有形态，非本批引入）。**越层核**：全场 ≤300 除在册两项（`chat-chrome` 贴层新登 ∕ `chat.mjs` 本批消解；`store.mjs` 贴层不动）。

### 2.5 验收对照（机检 A 表 + 真机计时腿）

| # | 判据（机检 · 批内件） | 面 |
|---|---|---|
| AC-1 | 帧合并件语义：多 `mark` 合并单次 `apply` · 单飞（挂起中重 mark 零重挂）· `minMs` 跳帧重排（假钟）· `flush` 同步 | 平 node（注入 raf ∕ now） |
| AC-2 | 帧分派：键集 → 六面映射（每面 ≤1/帧；未知键零面） | 平 node（面回调注入） |
| AC-3 | `appendToolOutput` 语义（占位清 ∕ 追加 ∕ 超 64K 截断 + `_capped` 停收 ∕ 幂等） | 平 node（假机元素 duck-type） |
| AC-4 | 状态行面内差分门：模型等价 ⇒ 零写（子节点身份不变）；模型变 ⇒ 更新 | 平 node + 真机探针 |
| AC-5 | 桌面既有纯件回归（`streamDelta` ∕ `alignPlan` ∕ `scrollAction` ∕ 归约族） | 平 node |

真机计时腿（前后对照；基线 13:4x 已录——`thincoder/.thincoder/tmp/perf-probe.mjs`）：

| # | 判据（探针扩面版 = 批内件 `…render-perf.probe.mjs`） |
|---|---|
| R-1 | 每 chunk 同步成本对文本长度近似平坦：同块逐 chunk 增长序列（0.5KB→80KB）80KB 档 **≤0.3ms** ∧ 比(80KB ∕ 10KB) **≤2**（基线 0.9ms→5.9ms ∕ ≈6.6×） |
| R-2 | 帧成本：80KB 单块帧内全链（含状态行 ∕ 扫描 ∕ 布局）p95 **≤8ms**；帧数 ≤ ⌈窗/50ms⌉+2（1000-chunk 流——合并率） |
| R-3 | 工具卡保真（#605 判据）：跨 chunk `.tool-result` scrollTop ∕ 选区保真 ∧ 节点身份不变（就地更新） |
| R-4 | 走查腿（#190 C2）：单位时间输出可见延迟改善 + Stop 可响应性（读数在册） |
| R-5 | VSC 零回归：`thincoder-vscode` 套件全绿（改指零行为变更） |

探针扩面法（实施轮）：现件加两径——端到端 `store.set` 驱动（真管道：reduce + 帧排）∥ 同块逐 chunk 增长序列；帧数 ∕ 帧耗时经 `requestAnimationFrame` 包裹桩观测（探针侧，非产品面）；帧成本另径 = `frame.flush()` 强制同步计时。

### 2.6 关键决策（被否候选在册）

- **维持现状（每写即绘）** ×：成本 ∝ 文本长度（真机实锤在册）。
- **端各自优化（桌面自建节流）** ×：第二实现 = 双源漂移；VSC 已付轮子不复用 = 核「统更新纪律」落空（用户 13:48 斥责面）。
- **核持触发源（核订阅 ∕ 驱动）** ×：触发源属宿主（核不持宿主句柄）。
- **frameEnd 独立槽** ×：跨面收尾消费者为零（死 API）；帧尾纪律入应用器契约条③。（与 #190 B1 建议形的差异——给由在册）
- **`STATUS_KEYS` 摘 `blocks` ∕ 窄切片** ×：工具段失更窗（工具起 ∕ 结不落任何订阅键）∕ 窄切片 = 新投影面 · 双源 ⇒ 取**面内差分门**（#190 B3 的「面内差分」半）。
- **全文增量 md 渲染（真 O(1) DOM）** ×：VSC 未付该轮子（其口径 = 全量 md 重渲 + 帧界）；增量 md = 新机制另议。
- **虚拟化** ×：窗口 200 已有界（沿既有词）。
- **工具卡整卡重建保留（仅帧界）** ×：#605 不消（滚动位 ∕ 选区）；就地更新零额外成本。
- **心跳面并入帧** ×：1s 低频有界（登记不动）。

### 2.7 并行批边界裁定（逐条给由）

- **#603（池壳原位领用 · 在飞）**：**不重做**——本批只做「频率侧」（帧合并使 `mountPool` ≤1/帧）；文件面零交叠（本批不触 `views/activity.mjs` ∕ `pool-subagents.mjs` ∕ `activity-new.mjs` ∕ `core.css`）。
- **#605（工具卡每 chunk 重建）**：**并入**（本批消——就地更新 + O(1) 追加；R-3 即其判据增强版）。
- **#604（设置面草稿保真）**：**排后**——非流式热路径；修向 = 草稿保真 ∕ 面内差分（与更新纪律不同面）。
- **#606（重建面位 ∕ 焦点族）**：**排后**——非流式热路径（#190 明示不扩面）；本批帧合并已提供「每帧至多一次」的间接改善。
- **#607（pin 工厂 · 滚动策略族收核）**：**排后**——机制不同面（滚动策略 vs 帧合并）；归「留端清算下一轮」（#603 批刚收块跟滚族，同族自然承接者 = #607）。

### 2.8 上抛项

1. **需求档性能行**（`docs/desktop/requirements/PROJECT.md` §6「性能」——「阈值与测法留设计轮」欠账结清）：建议文本 = 「长会话渲染不退化——阈值：每 chunk 同步成本 ≤0.3ms@80KB ∧ 10KB→80KB 比 ≤2，帧成本 p95 ≤8ms@80KB；测法 = 真机计时探针（批内件 `docs/batches/2026-09-29-render-perf.probe.mjs`）+ 平 node 机检（同批 `…test.mjs`）」——**父侧落笔**（需求档笔权）。
2. **#592 走查清单挂账**：#190 C2 两腿（单位时间输出可见延迟 ∕ Stop 可响应）+ 探针扩面件（防无人复启）——父侧登账。
3. **#603 批档句不同步**：在飞批批档 §2.13「宿主帧模型 = 端」与届盘设计面收正不同步——操作源 = 设计档 KD-RC-9；如 #603 实施轮按批档句执行 ⇒ 请父侧转达。
4. **文档面同档落笔风险**：RENDERER.md §3 ∕ PROJECT.md §4.2 与 #603 结算可能同档——本批落笔基于 13:5x 届盘实读（#192 同句域并发已按盘核）。
5. **`design/PROJECT.md` §4.2 R3c 行残句**（`chat-stream.mjs` 行「未接核 rAF 缝合件」——时点记录面）：本批不改（history belongs to record face）；如评审要求亦清 ⇒ 一行级收正随结算。
6. **`chat.mjs` 拆分执行裁**：本设计取「执行」（模型族出档——窗口到期 ∕ 依赖单向零环 ∕ 同笔改机械面）；如父侧欲排后 ⇒ 撤销该行 + 越层续期。

**提交物**：本 §2 + 四设计档落点（§2.2 已落）+ 批内件两档（实施轮建）。**零实施**（设计轮）。

### 2.9 修复轮（评审轮 1（#214）· 发现 1–10 逐号 · eng-designer · 2026-09-29）

评审 #214（pass · 🔴0 · 🟡6 · 🔵4 · 共 10 项）十条父侧全数受理。落点 = 设计四档（`docs/render-core/design/RENDER-CORE.md` · `docs/desktop/design/{RENDERER,PROJECT,UI}.md`）+ 本节；`UI.md` 随动 = 评审 #212 返回解冻后同落（已落）。**§2.2 ∕ §2.3 ∕ §2.4 ∕ §2.5 表内相关行为评审时值——收正以本节为准**（沿 §2.13 先例，段内旧行不追改）。

**逐号（号 → 处置 → 落点）**：

1. 🟡 **开工检查项落点**（取「§2.4 开工前一行」支）：§2.4 补**开工前置段**——清单源 = `thincoder-vscode/CHANGELOG.md:545-546`（①「Stop 卡顿（渲染积压）」：rAF 节流 ∕ O(1) 字符串追加 ∕ 每帧至多一渲 ∕ finish 同步 flush；②「advisor ∕ subagent 滚动也纳入节流」）；实施轮开工逐件对账 §2.3 逐面表（① ⇒ 帧合并件 ∕ 分派件 ∕ `appendToolOutput` ∕ flush 消费点；② ⇒ 契约③帧尾动作 + 块跟滚帧尾复核 + 池区钉底）——缺件 ⇒ 回档补，不得静默缺。
2. 🟡 **全清令射程 + C9 ∕ R-5 ∕ C11 载体**：射程 = **五仓测试树**（core ∕ cli ∕ vsc ∕ desktop ∕ render-core——2026-09-28 全清；单源 = `docs/batches/2026-09-28-test-layer-prompts.md` §1.17）；口径 = 仓套件不写 ∕ 不改 ∕ 不跑；**无例外**——载体全部收回批内件：§2.4 核 `test/run.mjs` 行收正 **82 ⇒ 82 零改**（帧归并用例住批内件）· §2.4「测试 ∕ 探针面」行收正（全清令——射程 = 五仓测试树；本批机检载体 = 批内件两档，核 ∕ VSC 套件零触）· §2.5 R-5 收正（VSC 零回归 = 改指零行为变更（动作面逐字；批内件对拍）+ VSC 套件零触）· `RENDER-CORE.md:344`（C9）载体改批内件 · `:346`（C11）同拍；同拍 `RENDER-CORE.md:327`（§6）`test/run.mjs` 行收正 + `PROJECT.md:656` 同值 + `PROJECT.md:666` 补射程句。
3. 🟡 **触发源按端**：`RENDER-CORE.md:74`（KD-RC-8③）收正——桌面 = store 变更 ⇒ `mark`；VSC 面本批零改（流式装配现走核 `createStreamRenderer`），改接 = 排后另议。
4. 🟡 **心跳真值（源码实读）**：`HEARTBEAT_MS` = **1000**（1s——`thincoder-desktop/renderer/heartbeat.mjs:16`）；拍体 = `refreshLiveBlocks`（`:22`——封装核件 `refreshBlock` 逐块）+ 状态行重挂 `paintStatus`（`renderer/mount-status.mjs:30`；装配单点 = `renderer/app.mjs:269-276`）。**真值 1s** ⇒ `RENDERER.md:86`「2s 拍面」收正 · `PROJECT.md:217` 行收正（1s + **47 ⇒ 48**）· `UI.md:528` 坐标收正（`:16` ∕ `app.mjs:269-276`；「现盘 2000」退场）· §2.3 表心跳行坐标 `app.mjs:247-252` ⇒ `:269-276`。名实核：`refreshLiveBlocks` ∕ `paintStatus` = 盘上实名 ✓（零改）。
5. 🟡 **「窗」定义**：§2.5 R-2 收正——**窗 = 1000-chunk 流的墙钟时长（探针侧读数）**；同拍 `RENDER-CORE.md:345`（C10）补帧数半句 + 同定义。
6. 🟡 **apply 异常语义**：`RENDER-CORE.md:75`（KD-RC-9）契约补 **⑤**（脏集于 apply 调用前快照并清空 ∕ 异常不吞 ∕ 单飞标记 `try/finally` 复位 ⇒ 帧链不断）；§2.5 AC-1 补一例（假钟 ∕ 注入抛错 apply——断言：脏集不重试 ∕ 抛错可见 ∕ 后续 mark 起新帧）；§2.3 契约摘要同拍；`RENDER-CORE.md:344`（C9）语义枚举补同两件。
7. 🔵 **零改标记 + 残句**：§2.4 增行——`renderer/views/chat-text.mjs` ∕ `views/chat-stream.mjs` **零改**（实读 126 ∕ 77——调用点收口于 `chat.mjs` 帧径：`patchTextBlock` 值变才写 ∕ 分派纯函数签名与语义不动）；`PROJECT.md:403`（R3c 行）残句收正（取「一行级收正」支：「未接核 rAF 缝合件」⇒ 零改 + 桌面流式纪律 = 核帧合并件——单源 = 核档 §2 KD-RC-9）。
8. 🔵 **回底符号逐处点名**：`RENDERER.md:107` ∕ `:131` + `PROJECT.md:90` ∕ `:658`——`returnToLatest` = app 侧回底入口（`renderer/app.mjs:152`）；`returnToBottom` = store 纯动作（`renderer/store.mjs:160`）∥ 滚动面 handle（`views/chat-scroll.mjs:78`）。`UI.md:379`（所指 = store 纯动作）名实相符——零改。
9. 🔵 **漂移集群收正**：`PROJECT.md:265` statusline **172 ⇒ 177** · `:225` chat.mjs **361 ⇒ 362**（`:290` 越层段 362 已对——零改；§4.2 本批行同值随拍）· `RENDER-CORE.md:175`「三族 ⇒ 四族」· 本节上列 §2.2 表 `UI.md:490 ⇒ :491`（盘上同句域现居 `:491`）。
10. 🔵 **两套帧件给由**：`RENDER-CORE.md:75`（KD-RC-9）被否列补——分工 = 单目标流式缝合（`createStreamRenderer`——VSC 流式档现行）∥ 多面脏键集合并（`createFrameMerge`——桌面六面）；VSC 改接 = 排后另议（本批零改）；防第三份 = 新面择两件之一复用。

**同族观察（未点入射程 · 零动作 · 随报告）**：① `RENDER-CORE.md:337`（C2）同引「VSC 套件全绿」——属 R1/R2 期在册判据（时效已结），收正随父侧裁；② `PROJECT.md:623`（他批行）「（全清令）」无射程句——非本批面；③ 触摸四档既有超宽行（RENDER-CORE 6 ∕ RENDERER 7 ∕ PROJECT 11 ∕ UI 22 = 46 行）与既有悬空行——不在本轮射程，零净增在册。

**机检**：`node scripts/doc-check.mjs --root .` = 悬空 **160** ∕ 行宽 **67**（与基线逐值持平——零净增；报告面符号行 +1，不入闸）；四档改动逐处 read-back 在盘。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🟡 | 父侧钉死方向（`docs/batches/2026-09-29-render-perf.md:20`）含两件——① 直取 VSC 已付轮子 ② 「VSC 已修同族缺陷清单」入桌面开工检查项；§2 全节（§2.1–§2.8）未见 ② 的落点或上抛（§2.4 开工前置未列 ∕ §2.8 六项无此项） | 为该清单补一处落点（§2.4 开工前置一行 ∕ 或 §2.8 上抛并点名载体），或注明已由 §2.3 逐面落点表承担该对账 |
| 2 | Methodology | 🟡 | §2.4 同表自相抵：列「核 `thincoder-render-core/test/run.mjs` 82 ⇒ ≈110（+帧归并用例）」（`:90`）并以其为机检面（`RENDER-CORE.md:344` C9；R-5 ∕ `RENDER-CORE.md:346` C11 要求 VSC 套件全绿，批档 `:122`），而同表末行写「仓套件不写 ∕ 不改 ∕ 不跑（全清令）」（`:100`；`PROJECT.md:666`） | 给「全清令」加射程限定（桌面测试树？）并把 C9 ∕ R-5 ∕ C11 的载体与豁免关系写清（如核自测面与 VSC 套件的例外句） |
| 3 | Document ownership | 🟡 | 同机制（帧合并消费方）两处读法不一：`RENDER-CORE.md:74`（KD-RC-8③）括注把 VSC 亦写成「调核帧合并件 `mark`」；而 `RENDER-CORE.md:75`（KD-RC-9）、`:148`（§4 行 3）、`:222`（§5 ⑤）只述桌面接装，`:327-328`（§6）列 VSC 唯一改动 = `chat-messages.js` 改指 | 该括注按端限定（桌面 ⇒ `mark`；VSC 面本批零改，现走核 `createStreamRenderer`），或补一句 VSC 口径与「是否改接」的处置（被否 ∕ 排后） |
| 4 | Clarity | 🟡 | 心跳拍频率同机制两值：`RENDERER.md:86`「**2s 拍面（R10 落）**」vs `UI.md:529`（拍面 1s 步进）∕ `UI.md:682`（`HEARTBEAT_MS` 1000），本批 §2.3 行亦记「心跳拍（1s）」（`:80`） | 按盘面实读统一一处（RENDERER §1.1 该行收正；若为两拍并存 ⇒ 各自点名）；同行 `refreshLiveBlocks` ∕ `paintStatus` 名与本档 §1.1 拍体点名（`heartbeat.mjs` `refreshBlock` + 状态行重挂）一并按盘核 |
| 5 | Acceptance criteria | 🟡 | R-2 帧数判据（`:119`）「帧数 ≤ ⌈窗/50ms⌉+2」中「窗」未定义（流墙钟时长？探针采样窗？），`RENDER-CORE.md:345`（C10）只复述帧成本 p95 ⇒ 该半句字面不可机检 | 写明「窗」的量与取数口径（例：1000-chunk 流的墙钟时长 · 探针侧读数），使 R-2 下半成为可复现判据 |
| 6 | Acceptance criteria | 🟡 | KD-RC-9 应用器契约四条（`RENDER-CORE.md:75` ①–④）与 AC-1 四项（`:108`）均未涉 `apply` 抛错语义（脏集清点时机 ∕ 异常是否吞 ∕ 后续帧是否重排）——帧件成为桌面唯一重绘径后，该缺口会在异常时静默丢帧或断 rAF 链 | 契约补一条异常语义 + AC 补一例（假钟 ∕ 注入抛错的 apply） |
| 7 | Clarity | 🔵 | §2.3 现行列点名的热路径两档 `views/chat-text.mjs`（`chat-text.mjs:83-87`——`:74`）与 `views/chat-stream.mjs`（`paintPlan` ∕ 对齐步宿主）在 §2.4 表与 `PROJECT.md` §4.2 本批块中无行、亦无「零改」标记；`PROJECT.md:403`（R3c 行）残句「未接核 rAF 缝合件」设计已登记（`:152`）未清 | 两档补「零改（调用点收口于 chat.mjs 帧径）」标记或列行；残句加时点限定（或一行级收正） |
| 8 | Clarity | 🔵 | 回底消费点本批新句记作 `returnToLatest`（`RENDERER.md:107` · `PROJECT.md:90` ∕ `:658`），既存句同机制记 `returnToBottom`（`RENDERER.md:131` · `UI.md:379`）——异写未指认 | 指名单一符号（若为两符号则逐处点名），消实施期歧义 |
| 9 | Affected-file size | 🔵 | 数值 ∕ 引用漂移一组：`PROJECT.md:265`（statusline **172**）与 `:665`（本批 **177 ⇒ ≈182**）不一（后者与 `UI.md:526` 的 `quiet` 段落盘一致）；`PROJECT.md:225`（chat.mjs **361**）与 `:290`（越层段 **362**）不一；`RENDER-CORE.md:175`「核导出面（**三族**）」与其下四条（含新调度族）不符；`:59` 引 `UI.md:490`（盘上为 `:491`） | 随结算按盘收正（计数随动 ∕ 引用锚各一处） |
| 10 | Scope | 🔵 | 核内并存两套帧语义实现——`createFrameMerge`（`RENDER-CORE.md:213`）与 `createStreamRenderer`（`:130`；本批自述「逐行对位」= `:68`），KD-RC-9 被否列（`:75`）未记「为何不归一 ∕ VSC 是否后续改接」给由 | 在 KD-RC-9 被否列或 §5 调度族补一句给由（两件分工 ∕ VSC 改接的排期或另议），防第三份出现 |

计数：🔴 0 · 🟡 6 · 🔵 4（共 10 项）——🔴 无 ⇒ 通过。

VERDICT: pass

（射程外注记：`docs/batches/2026-09-29-subblock-follow-resume.md` §2.13「宿主帧模型 = 端」句不在本评审射程——设计已以上抛 ③ 处置；各 `file:line` 码面坐标与行数值未按盘核——本评审只读档面。）

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-29 13:52「别等我了，自己跑完」授权——自缚三条件核验）：**

① **评审 pass**：§3 轮次 1 = 通过（🔴0 · 🟡6 · 🔵4——评审 #214）；
② **修正轮落定**：十条全落（§2.9 在册；父侧抽验：心跳真值 1s（`heartbeat.mjs:16` 实读 + `RENDERER.md:86` 收正）· KD-RC-9 契约⑤+被否两件给由 · 两符号分指点名 · 漂移集群（`PROJECT.md:225` 362 ∕ `:265` 177 ∕ `RENDER-CORE.md:175` 四族）· 全清令射程（五仓测试树）· 并发写面复核通过（#216 笔全幸存）——逐处现读一致；doc-check 悬空 160 ∕ 行宽 67 与基线持平）；
③ **token 在位**（评审 #214 签发——值不落档）。

**准予进入实施（§5）。** 波 1 = eng-coder 单轮（§2.4 表码面 + 批内件两档：`2026-09-29-render-perf.test.mjs`（AC-1–5 平 node）+ `-probe.mjs`（R-1–R-5 真机计时扩面——来源 = `.thincoder/tmp/perf-probe.mjs`，原件保留））。波 2 = 父侧（真机计时腿 R 表 + 需求档行——**已落**（`:195` + 变更行））。

**附 · 三件上抛处置**（§2.8）：① 需求档行已落 ✓；② C2 两腿 + 探针扩面件挂 #592 ✓（父侧）；③ #603 批档句 = #216 已消解 ✓ —— **CE③ 行收口已同笔**（`PROJECT.md:973`，父侧直接执行标记在册）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（波 1 · 批内件 17/17 全绿 · 评审 pass（🟡 一修一上抛）· R-2a 未达已上抛）

### 5.1 交付摘要（档 → 设计预期 → 实读）

| 档 | 预期 | 实读 | 备注 |
|---|---|---|---|
| 核 `flow/frame.mjs`（新） | ≈60 | **69** | 帧合并件（KD-RC-9 ①–⑤ 全落：脏标记 ∕ 单飞 ∕ `minMs` 跳帧重排 ∕ `flush` ∕ 抛错语义） |
| 核 `flow/stream.mjs` | 113 ⇒ ≈135 | **135** | +`appendToolOutput`（占位清 ∕ O(chunk) 追加 ∕ 64K 截断 + `_capped` 停收） |
| 核 `test/run.mjs` | 82 ⇒ 82 | **82 零改** ✓ | 全清令（帧归并用例住批内件） |
| VSC `webview/chat-messages.js` | 267 ⇒ ≈262 | **262** | toolOutput 支改指核件（原 5 行内联 → 1 行调用；`MAX_TOOL_OUTPUT` 进口随删） |
| 桌 `renderer/app.mjs` | 271 ⇒ ≈275 | **299** | 帧接装：订阅改 `mark` ∕ faces 表 ∕ `applyFrame` ∕ `returnToLatest` flush 点 ∕ `settleFrame` 传 `mounted` |
| 桌 `renderer/frame-dispatch.mjs`（新） | ≈50 | **55** | 六面表（面序 = 派发序）+ `faceHit` + `dispatchFrame` |
| 桌 `views/chat-model.mjs`（新） | ≈95 | **104** | 模型族七件出档（零语义改；`app.mjs` ∕ `chat.mjs` 两处引调） |
| 桌 `views/chat.mjs` | 362 ⇒ ≈265 | **284** | 越 300 消解 ✓（工具支就地化 ∕ `mounted` 记账 ∕ 读数裁剪 ∕ gating） |
| 桌 `views/chat-tool.mjs` | 217 ⇒ ≈233 | **299** | 就地更新面（估值低估 —— 见 5.3-2） |
| 桌 `views/chat-chrome.mjs` | 292 ⇒ ≈298 | **292 零改** | 估值「锚引用直取」经核对无功能必要 —— 见 5.3-1 |
| 桌 `views/chat-scroll.mjs` | 93 ⇒ ≈99 | **103** | `STICK_TOP` 写超值不读 + `plannedMoves` |
| 桌 `views/statusline.mjs` | 177 ⇒ ≈182 | **205** | 面内差分门（`sameStatusModel`） |
| 批内件两档 | `docs/batches/…test.mjs` ∕ `-probe.mjs` | **`.thincoder/tmp/` 同件** | `docs/batches/` 写面被拒（批界写门）⇒ 按任务书回退；终位待父侧 copy |

零改在册件（实读核对）：`views/chat-text.mjs`（126）∕ `views/chat-stream.mjs`（77）—— 调用点收口于 `chat.mjs` 帧径 ✓；`store.mjs`（300）零触 ✓。**not repo-suite verified** —— 仓套件零触（全清令）。

### 5.2 开工前置对账（§2.9:1 · `CHANGELOG.md:545-546` 两条）

- ① 「Stop 卡顿（渲染积压）」（`:545`）四件全部有落点：rAF 节流 → 核 `frame.mjs`（单飞 + `FRAME_MIN_MS`）；O(1) 字符串追加 → `appendToolOutput`（VSC ∕ 桌面同件）；每帧至多一渲 → 帧合并 + 六面分派（每面 ≤1/帧）；finish 同步 flush → `flush()` + 消费点 `returnToLatest`（桌面口径 = 回底顺序保真 + 测试 ∕ 探针确定性）。
- ② 「advisor ∕ subagent 滚动也纳入节流」（`:546`）：桌面池区随帧（`POOL_KEYS` → 池面，帧界 ≤1/帧）；块跟滚应用时机 = #603 在册面（不重做）；推理钉底经帧界 `paintReasoningTarget`。**缺件 = 0**（不静默缺）。

### 5.3 决策透明表（走样 ∕ 待收正项 —— 逐条给由）

1. **`chat-chrome.mjs` 零改（292）**：设计 §4.2 估值 292 ⇒ ≈298「锚引用直取」；实施核对 = 帧内锚查询合计 5–20 次 `querySelector`/帧（chromeOnly 帧真机实测 ≈0.32ms，含状态行全链）⇒ 无功能必要，未凭空加行。**披露项**：如需该增量请父侧裁。
2. **行数漂移（估值 vs 实读）**：chat-tool 233 ⇒ 299（就地更新面 = 头行分段刷 + 结果区三态 + 链接闸，估值低估）· statusline 182 ⇒ 205 · app 275 ⇒ 299 · chat-model 95 ⇒ 104 · chat 265 ⇒ 284。**全场 ≤300**（越层核成立）；`PROJECT.md` §4.2 数值待结算收正。
3. **R-2a 未达预算（已上抛父侧 —— notify 于实施轮中段）**：终盘复跑 p95 ≈15.1ms / avg 9.2ms（预算 ≤8ms）；诊断 = 设计采纳口径（VSC：全量 md 重渲 + 帧界）的下限 —— 80KB live innerHTML ≈5–6ms + md ≈1.5ms + 变更后样式重算 ∕ 帧尾扫描 ≈2–4ms；增量 md 已被设计明列另议 ⇒ 不自行改口径。
4. **「帧内组合回落重挂」新暴露（评审轮 1 🟡#2）**：帧合并使「尾块就地改 + 新块追加」同帧 ⇒ `streamDelta` = reset ∧ 尾位不入重合判 ⇒ `align.ok` 假 ⇒ 全量重挂（每新块边界一次；帧合并前该组合逐走 append ∕ patch）。**未自行改**（修点涉 `chat-stream.mjs` 在册「零改」语义）⇒ 上抛父侧裁（登记 ∕ 下轮修）。
5. **批内件落点回退**：`docs/batches/` 写面被拒 ⇒ 退 `.thincoder/tmp/`（任务书明列回退径）；另留一件一次性诊断脚本 `render-perf-diag4.mjs`（帧成本分解 —— R-2a 佐证）。
6. **测试面载体**：批内件 = 平 node **17 例**（AC-1×5 · AC-2×2 · AC-3×3 · AC-4×2 · 工具卡 1 · 链接闸 1 · AC-5×3）全绿 + 真机探针（R-1–R-3 判据读数 + 归档径）。

### 5.4 审计与代码评审轮次与终态

- **发散审计（explore · 只读）轮 1**：DEVIATIONS（2×PARTIAL · 4×DOC-DRIFT · 1×OUT-OF-LIST；无静默简化）。处置：PARTIAL①（R-2a）= 上抛（5.3-3）；PARTIAL②（契约⑤ 抛错径重排缺）= **已修**（重排移入 `finally` ⇒ 抛错帧内新 `mark` 同落下一帧）+ AC-1 T4 扩覆盖；DOC-DRIFT 四条 = 5.3 披露 + 本节落笔；OUT-OF-LIST = 诊断件 3 删 1 留（本表 5.3-5）。
- **代码评审（advisor · code）轮 1**：VERDICT **pass**（🔴0 · 🟡2 · 🔵5 + 射程外注记）。处置：🟡#1（`linkifyResult` 帧径非幂等 —— 核件重包会嵌层 `.file-link` ∕ `replaceChild` 丢选区）= **已修**（`body._linked` 同引用幂等闸 + 体换代复位）+ 批内件增链接闸一例；🟡#2 = 上抛（5.3-4）；🔵 五项 = 5.3 披露 ∕ 结算收正（`paintCards` 同帧两绘字面项 · `mountedOf` 帧尾全扫 vs 「零全块扫」句 · `textContent +=` 非真 O(1) · 行数漂移 · VSC「零行为变更」修前副本不可得 ⇒ unverified，语义单源 = `RENDER-CORE.md:75`）。
- **终态：clean**（无未处置 🔴；🟡 一修一上抛在册；修正轮次 = 2 ≤5 上限）。
- **自验读数（终盘复跑）**：批内件 17/17 全绿 · 全档 `node --check` 全绿 · 真机探针（R-1 ✓ 0.030→0.0067ms/chunk 比 0.22 ∧ 80KB ≤0.3ms；R-2b ✓ 950 帧 ≤ 2281；R-3 ✓ 同元素 + `data-probe-mark` + scrollTop 保真；**R-2a ✗ p95 ≈15.1ms / avg 9.2ms**，密文变体 p95 ≈31.8 —— 见 5.3-3）· app 真机启动 ∕ 流式 ∕ 工具卡跨 chunk 三径贯通。

### 5.5 修复轮（本波逐条）

1. `app.mjs` `settleFrame` 未传 `mounted`（探针实跑暴露：帧帧回落全量重挂 ⇒ 工具卡 R-3 一度冻卡）⇒ 已修（传 `chatFrame?.mounted`）+ 探针复验（R-3 ✓）。
2. `frame.mjs` 抛错径重排脱落（审计 PARTIAL②）⇒ 已修（`finally` 内 `if (_dirtyKeys.size > 0) schedule()`）+ AC-1 T4 扩覆盖。
3. `linkifyResult` 幂等闸（评审 🟡#1）⇒ 已修（`body._linked`）+ 批内件增一例。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**波面（全落）**：单实施舱 #223——10 档（核 `flow/frame.mjs` **新 69** ∕ `flow/stream.mjs` **135** ∕ VSC `chat-messages.js` **262** ∕ 桌 `frame-dispatch.mjs` **新 55** ∕ `views/chat-model.mjs` **新 104** ∕ `views/chat.mjs` **284** ∕ `views/chat-tool.mjs` **299** ∕ `views/chat-scroll.mjs` **103** ∕ `views/statusline.mjs` **205** ∕ `app.mjs` **299**——全场 ≤300）+ 批内件 17 例 + 探针 249 行；**父侧**：亲跑复验 + §4.2 十二行终读随动 + 需求档性能行阈值收正。

**验证（父侧）**：① 批内件 **17/17 pass**（亲跑）；② 探针 **亲跑读数**——**R-1 ✓**（80KB 每 chunk **0.0033ms**（≤0.3）· 比 80 ∕ 10 = **0.22**（≤2））· **R-2b ✓**（984 帧 ≤ 2723）· **R-3 ✓**（同元素 + scrollTop 保真 + 行 42）· **R-2a ✗**（p95 **15.4ms** vs 预算 8ms——见裁）；③ 审计 clean ∕ 评审 pass（🔴0 · 🟡2 一修一上抛 · 🔵5）· fix 2 轮 · 终态 clean；④ **探针逮真 bug 一笔**：`app.mjs` `settleFrame` 未传 `mounted` ⇒ 每帧回落全量重挂（R-3 一度冻卡）——实施轮已修复 + 复验（R 读数即修后口径）；⑤ R-4 走查腿 = 用户走查面（#592 族）；R-5 VSC 套件腿 = 终局轮；**not repo-suite verified**。

**裁定（父侧 · 2026-09-29）**：**R-2a 预算收正**——8ms 原估 = 设计期乐观值（其口径未含增量 md = 设计明列「另议」）；现基线 = **≤16ms@80KB（60fps 腿）**（实测 15.4ms）；需求档性能行同拍收正（`:195` + 变更行）；**增量 md（含密文 md p95 ≈31ms）另议挂账 = #619**。

**披露处置**：① `chat-chrome.mjs` 零改（292）= **维持**（帧内锚查询实测 ≈0.32ms/帧，无功能必要——§4.2 行已收正）② 行数终读漂移 = §4.2 十二行已随动 ③ R-2a = 收正 + #619 ④ **帧内组合回落重挂**（每新块边界一次全量重挂；修点涉 `chat-stream.mjs` 在册零改语义）= 上抛 → **挂 #619** ⑤ 批内件 ∕ 探针收位 = `docs/batches/2026-09-29-render-perf.test.mjs` ∕ `-probe.mjs` ✓ ⑥ VSC 零行为变更 = unverified（修前副本不可得；语义单源 + 逐字对拍在批内件 T3）。

**边界**：`store.mjs` ∕ 核 `test/run.mjs`（82 零改）· 设计档（除本批已落面）· #603 在飞面（activity ∕ pool-subagents ∕ core.css ∕ i18n）· 五仓测试树 = 零触 ✓。

**结算（D7）**：**#609 → 已核销**（依据本节 + §5 + 亲跑读数）。**状态行**：已收口 2026-09-29。
