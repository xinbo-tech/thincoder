# 2026-10-04 · issue 修复批·二（ACP 协议面 5 条：结构化子代理事件 ∥ resource_link ∥ usage_update 形状 ∥ 会话身份 G5 ∥ set_config_option 形状）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 00:38「就这8条？不是19条吗？」= 归批组全量开批令（承 00:34「开批吧」+ 00:31「都自动跑」）；条目源 = 2026-10-03 分诊（#862 ∥ #870 ∥ #871 ∥ #872 ∥ #873——ACP 协议面）。
> 台账 = #862 ∥ #870 ∥ #871 ∥ #872 ∥ #873（ACP 面 · 归批）。前情 = 无（同会话兄弟批——前批 = `docs/batches/2026-10-04-issue-fix-round1.md`（核健壮性 8 条））。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批性质**：归批组第二组（ACP 协议面 5 条——四件 schema 收正 + 一件能力扩展）；用户 00:38「就这8条？不是19条吗？」= 全量开批令；全链（设计 → 评审 → 实施 → 收口）。

**本批条目（5）**：
| # | 台账 | 条目 | 证据锚（分诊实读） |
|---|---|---|---|
| 1 | #862 | ACP 结构化子代理事件（role/id/state/进度）——能力扩展 | `bridge.mjs:194-195`（仍注「另行跟踪」）∥ 全档零结构化映射 ∥ 活动面板（ACP 客户端侧）前置件 |
| 2 | #870 | `session/prompt` 支持 `resource_link`（Zed @文件引用） | 全仓 `resource_link` 零命中 ∥ `handlers-session.mjs:204-206`（仅取首个 text 块）∥ 设计档 `ACP-CLIENT.md:616`（G6）∥ `:627`「建议立批」已登记；待实现 = `file://` 解码 + `#Lx-Ly` 选区 + 上限/二进制/降级三态 |
| 3 | #871 | `usage_update` 形状收正 + `session/list` updatedAt 改 ISO | 3.3 已修（`client-caps.mjs:57-61` + `handlers-session.mjs:49-69`）；3.1 存活 = `bridge.mjs:208` 缺 `used/size`（官方 schema `UsageUpdate.required=[used,size]`）；3.2 半修 = `handlers-slots.mjs:48` 键已正 ∥ `:50` `updatedAt ?? 0` 仍发 epoch（schema 要 ISO 8601） |
| 4 | #872 | 会话身份与状态同步（G5 id 命名空间归一 + 两处通知字段收正） | 2.1 load/resume 仍新分配 id 且只回 `{configOptions}`（`handlers-slots.mjs:79-80,108-114` ∥ `:139-140,161-164`）∥ 2.2 计数器 id 非持久身份（`acp.mjs:101,108` + `handlers-session.mjs:167`）∥ 2.3 通知字段 `mode:`（`:287`）∥ `{configId,value}`（`:266`）对 schema 相抵（`currentModeId/configOptions`）；设计档 `ACP-CLIENT.md:521-523,615` 明载 G5「本批不做」 |
| 5 | #873 | `set_config_option` 响应补 `configOptions` + 判别键 `type` | 1.2/1.4 已修（`client-caps.mjs:28-37,62` ∥ `handlers-session.mjs:204`）；1.3 半修（`:191` sessionId 已修 ∥ `:32-36` configOptions 元素仍 `{id,name}` 无 `type`——schema oneOf select/boolean 必填）；1.1 存活（`:268` 仍返 `{}` vs `SetSessionConfigOptionResponse.required=[configOptions]`）；同拍收正设计档 `ACP-CLIENT.md:487/500` |

**复验令（承用户 2026-09-25 先例）**：设计轮开工先逐条实读复验仍存在；已消/前提变者按实况登记（不硬做——#871/#873 各有半修项，逐条对现盘）。

**授权口径**：全链；用户 00:31「都自动跑」（点火/代签/派发/收口全自动——自缚三条在册）。

**边界**：在飞写域零触——#51（`thincoder-core/ledger-*.mjs` ∥ `thincoder-cli/src/**` ∥ `docs/cli/design/{CLI-ENTRY,ACP-CLIENT}.md` ∥ `docs/batches/2026-10-03-read-data-interface*`——**实施在跑**；本批设计轮 = 只写文档，但实施轮与 #51 写域交叠 ⇒ 实施须待 #51 收口后派发）∥ #54/#58（面板面）∥ #56（issue 批·一）∥ #57（菜单轮评审——只读）∥ 已收口批档。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（设计档 = docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md · 复验 5/5 在档 · #862 拆批裁定在档 · 实施须待 #51 收口后派发 · fix 轮收正（评审 #66 号 1–5 已落 · 号 6 保持；doc-check 复跑 = exit 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-04 · initial 轮）**

**复验结论（逐条实读 · 开工先复验——承用户 2026-09-25 先例）**：5/5 对现盘实读——#871：3.3 已修确认 ∥ 3.1（`usage_update` 缺 used/size）/ 3.2（`updatedAt` 仍发 epoch）存活；#873：1.2 / 1.4 已修确认 ∥ 1.1（`set_config_option` 返 `{}`）/ 1.3（configOptions 缺判别键）存活；#872：2.1 / 2.2 / 2.3 三条全存活；#870：存活（基线 MUST 未达）；#862：存活。**逐条表（含 file:line）= 设计档 `docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md` §1.2**（单一权威源）。

**本批条目（覆盖）**

| # | 台账 | 条目 | 承接（设计档章节 ∥ 用例） | 状态 |
|---|---|---|---|---|
| 1 | #871 | `usage_update` 形状收正（used/size）+ `session/list` updatedAt 改 ISO（messageCount 剔） | §2.1 ∥ §2.2 · T1–T5 | 入批 |
| 2 | #873 | `set_config_option` 响应补 configOptions + 全形判别键 `type` | §2.3 · T6–T8 | 入批 |
| 3 | #872 | 会话身份 G5（id = 持久槽号）+ 两处通知字段收正 | §2.4 · T9–T14 | 入批 |
| 4 | #870 | `resource_link` 基线支持（解码 / 选区 / 上限 / 降级三态） | §2.5 · T15–T20 | 入批 |
| 5 | #862 | 结构化子代理事件（role/id/state/进度） | §6（裁定：**拆批**——四理由 + 后续批 scope 草案在档） | **不做**（拆批登记） |

**设计档落点与归属理由** = 新档 `docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md`（本设计轮已落）：长期机制单源 = `docs/cli/design/ACP-CLIENT.md`，但该档属 #51（read-data-interface 实施）在飞写域（零触）⇒ 批设计独立成档 + owning 档同拍收正（承 `docs/cli/design/READ-DATA-INTERFACE.md` 先例）；ACP-CLIENT.md 收正目标文本 = 设计档 §5（十处落点——实施轮同拍落）。**实施前置 = 待 #51 收口写域让渡后派发。**

**机制设计（要点——全文 = 设计档 §2 / §3）**

- #871a：`thincoder-cli/src/acp/bridge.mjs:208` → `{ used: (prompt_tokens+completion_tokens), size: providerSpec(agent.provider).context }`（上下文窗口单源；未知模型 128_000 兜底）；`buildAcpCallbacks` 签名增 `agent`（活引用——切模型随动），`thincoder-cli/src/acp/session.mjs:22` 调用点同传。
- #871b：`thincoder-cli/src/acp/handlers-slots.mjs:47-53` → `updatedAt` ISO 8601（非有限 ⇒ 键缺席）+ `messageCount` 删。
- #873：`CONFIG_OPTIONS` 常量 → `sessionConfigOptions(agent)` 投影函数（select/boolean 判别键 + currentValue + options；model 不可解析 ⇒ 该项缺席）；四处响应（set_config_option ∥ new ∥ load ∥ resume）同源。
- #872：id = 持久槽号串（new 先认领——失败 `deleteSlot` 回滚；load/resume 沿用客户端原文 id；同 id 在存 ⇒ close 同法替换）；`allocSessionId` / `nextId` 撤除；`releaseClosedSessionSlot` 提为工厂入 ctx；通知收正 `currentModeId` ∥ 全量 `configOptions`。
- #870：新档 `thincoder-cli/src/acp/resource-link.mjs`（拟新增）——判定树（`file://` 解码 / UNC / 盘符 / 相对按 cwd / 选区 `#Lx-Ly` ∥ `#Lx:y` / stat 与 NUL / 上限三态 / 固定词表降级标记）；`handlers-session.mjs:204-206` 接线（首个合法 text 块 + 资源段保序）。
- schema 基准：官方 v1 复取复核（SHA256 与 2026-09-18 记值**逐字同**——16 日零漂移；摘录 = 设计档 §4）。

**受影响文件与行数预算**（现行 = as-of 2026-10-04 实读；Δ = 预算；实施轮按盘回填）

| 文件 | 现行 | Δ | 落点 |
|---|---|---|---|
| `thincoder-cli/src/acp/bridge.mjs` | 397 | +~9 | onUsage / 签名增 agent / 头注 |
| `thincoder-cli/src/acp/session.mjs` | 54 | +1 | 调用点传 agent |
| `thincoder-cli/src/acp/handlers-session.mjs` | 292 | +~55 | 投影函数 + new 重排 + prompt 接线 + 两通知 |
| `thincoder-cli/src/acp/handlers-slots.mjs` | 196 | +~20 | list 条目 + load/resume id 与替换 |
| `thincoder-cli/src/acp/resource-link.mjs`（拟新增） | 新 | ~130 | 判定树全量 |
| `thincoder-cli/src/acp.mjs` | 151 | −2 | 计数器与 ctx 键撤除 |
| `docs/cli/design/ACP-CLIENT.md` | 655 | +~15 | 同拍收正（随动——设计档 §5 十处） |
| `docs/core/design/API-CONTRACT.md` | 2961 | 重生成 | `node scripts/api-contract.mjs --write` |
| `docs/batches/2026-10-04-issue-fix-round2.test.mjs`（拟新增） | 新 | ~290 | 批内单测（T1–T20） |
| `docs/cli/requirements/ACP-CLIENT.md` | 151 | 补笔 | 主 agent 笔（上抛 2） |

**测试面**：批内件 = `docs/batches/2026-10-04-issue-fix-round2.test.mjs`（拟新增 · 随批留存 · 不入仓套件）；跑法 = 自 `thincoder/` 仓根 `node --test docs/batches/2026-10-04-issue-fix-round2.test.mjs`；用例 T1–T20（先红后绿——协议面 = 形状断言为主）；集成面零动。

**验收对照**：AC-1–AC-7 = 设计档 §9（逐条回指本段条目：AC-1–AC-5 ↔ 条目 1–4 实施面 ∥ AC-6 = 机检面（批内件 + doc-check + 语法）∥ AC-7 = #862 拆批记录面）。

**关键决策（含被否）**：设计档 §8（D-1–D-13）——要点：size 取 `providerSpec().context`（否 maxTokens——输出上限语义相抵）∥ id = 槽号（否计数器双命名空间）∥ 同 id 重载替换（否静默覆盖 / 拒载）∥ new 先认领 + `deleteSlot` 回滚（否孤儿认领）∥ resource_link 内联（否仅路径文本）∥ 上限 = 拒绝降级（否截断）∥ #862 拆批（否半切片）。

**边界**：在飞写域零触（#51 面见上；#54 / #56 / #57 面零交集——只列不动）；已收口批档零触；协议版本 / 方法面 / `initialize` 形状零动。

**上抛项**

1. **#862 拆批**（裁定 + 四理由 + 后续批 scope 草案 = 设计档 §6）：台账 #862 维持「待设计」；另批由父侧排程（批名建议 `acp-subagent-events`）——请父侧知悉 / 登记。
2. **需求面补笔（主 agent 笔）**：`docs/cli/requirements/ACP-CLIENT.md`——R-A5.4「configOptions 条目含 id + name」与收正后形状相抵（欠判别键 / 现值，须补述）；#871a / #872 / #870 无对应判定句（缺口——设计侧目标形已给全，见设计档 §1.3）。
3. **实施排序**：本批实施须待 **#51 收口**后派发（`thincoder-cli/src/**` ∥ `docs/cli/design/ACP-CLIENT.md` 写域让渡）。
4. **同拍面（实施轮落）**：ACP-CLIENT.md 十处收正（设计档 §5 表）+ API-CONTRACT 重生成 + doc-check 复跑 exit 0——均为验收项。
5. **边界登记（随收口入台账 · 父侧）**：多块 text 合流残项 ∥ model 候选列表不供货 ∥ 多引用总量无闸 ∥ fork 角如实 ∥ resource_link 块级字段不消费（设计档 §11）。

**§2 批次任务与设计 · fix 轮（eng-designer · 2026-10-04 · 设计评审 #66 号 1–5 收正——设计档同拍 · 号 6 保持）**

（行锚 = 设计档 `docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md` as-of 本次收正后；条目序 = 批档 §1）

- 号 1（🟡 行数档）：§7 增「拆分评审（本批 · 判据 8 · 300 咨询档）」段（`:274-281`）——`handlers-session.mjs` 292 → ~345 **本批不拆**（理由三条 + 后续拆分点两条）；`bridge.mjs` 397 → ~406 同段注明（本批 Δ +~9——不拆）。
- 号 2（🔵）：§2.4 增「替换点钉定（拒载安全）」子条（`:109`）——既有前置判据（`loadSlotFile` 缺失 `handlers-slots.mjs:64-67` ∥ 工程模式拒载 `:72-77`）之后、`createSession` 之前；拒载路径零副作用（旧实例保留）；§10 T12 补拒载腿（`:328`）。
- 号 3（🔵）：§1.2 #872 行锚 `acp.mjs:99,106` ⇒ `:101,108`（`:25`——与 §2.4 `:100-108` 对齐）。
- 号 4（🔵）：§2.2 验收句改「发射值往返恒等」（`:70`）——`new Date(emit(v)).toISOString() === emit(v)`。
- 号 5（🔵）：§11 增 thinking 语义登记行（`:348`）——currentValue = 本地显式档（`undefined` ⇒ `false`；`thinkAlwaysOn` 族为本地档、非服务端生效态）。
- 号 6（🔵）：保持（判据降级限制声明——无改法；父侧裁定）。
- 机检复跑（`node scripts/doc-check.mjs` · thincoder 仓根 · 本批改后）= **exit 1**——闸红均非本批面（行宽 2 ∥ 悬空 7）：
  - 行宽：`docs/core/design/CORE-UNIFICATION.md:1118`（337 字符——批一修轮（eng-designer#67）在飞面；父侧已裁＝零触、转交 #67 折行）∥ `docs/core/design/PROVIDER.md:104`（335 字符——他批在飞改动新引）。
  - 悬空：`docs/core/design/AGENT-LOOP-SUBAGENT.md:37`（符号 ×2）∥ `docs/core/design/CORE-UNIFICATION.md:1109/1112/1118/1152/2046`（5 处裸段引用未带 `thincoder-core/` 前缀——`memory` ∥ `provider` 段）。
  - 基线对照：开工实读 = 悬空 0 / 行宽 1（存证日志在案）；上列新增项系开工后他批在飞改动新引。**本批面零新增闸红**——本设计档仅 2 条「拟新增 · 列报 · 不入闸」（与基线同项），无行宽命中。
- 同拍面照旧：他批在飞零触（含 `docs/core/design/CORE-UNIFICATION.md`）；号 1–5 逐条可回读（上列行锚）。

**§2 fix 轮 · 追加（交付前复跑 · 2026-10-04 同日更晚时点）**

- `node scripts/doc-check.mjs`（thincoder 仓根）= **exit 0**——悬空 0 ∥ 行宽 0（本批收正后终态）。
- 本段前文所载中途漂移（悬空 7 ∥ 行宽 2——他批在飞面）已由各批自行消解（含批一 #67 折行 `docs/core/design/CORE-UNIFICATION.md:1118`）。
- 本批验收两项达成：**本批面零新增闸红 ∧ 复跑 exit 0**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**核读范围** = 设计档 `docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md` + 本批档；按判据 8 与对象声明「现盘坐标」要求，对 §1.2/§2/§5/§7 所引源代码坐标与行数逐点抽核实读（source 文件只逐点核读、不作扩展评审）。行数口径 = 项目机检口径「内容行数（文末换行不计）」：bridge.mjs 397 ∥ session.mjs 54 ∥ handlers-session.mjs 292 ∥ handlers-slots.mjs 196 ∥ acp.mjs 151 ∥ ACP-CLIENT.md 655 ∥ API-CONTRACT.md 2961 ∥ requirements/ACP-CLIENT.md 151——全部与 §7 表注值逐字相符。外部官方 schema 本体不可盘核（unverified）；§4.1 的 247168 字节 · SHA256 `3c17…eca7` · 170 `$defs` 与在盘 2026-09-18 批档记值（`docs/batches/2026-09-18-acp-external-drivers.md:257`）逐字相同（已核）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 受影响文件-行数档（判据 8） | 🟡 | `handlers-session.mjs` 292 → ~345（设计档 §7 :263）跨 300 行咨询档，设计未载 proactive split review / 拆分计划；`bridge.mjs` 397 → ~406（:261）同处 >300 档（未跨档）。500 硬限未破。 | §7 补一条拆分评审：或将本批新增的两处导出（`sessionConfigOptions` / `createSlotReleaser`）抽入独立小档以吸收增量，或写明「本批不拆」理由与后续拆分点。 |
| 2 | Clarity | 🔵 | §2.4「同 id 在存 ⇒ 替换」只钉了「先替换 → 再占用检测与装载」（:108），未钉其与既有前置拒面的先后（`loadSlotFile` 缺失 `handlers-slots.mjs:64-67` ∥ 工程模式拒载 :72-77）——若替换先于前置判据，被拒的 load/resume 会误杀同 id 在存会话（cancel 在飞回合）。 | 补一句钉定：替换点在既有前置判据之后、`createSession` 之前；并写明「拒载路径零副作用（旧实例保留）」（或加一条对应用例腿）。 |
| 3 | 引证纪律 | 🔵 | §1.2 #872 行把计数器锚在 `acp.mjs:99,106`（:25）——实读 :99 = `requestRef`、:106 = `getCwd`；计数器实位 = :101（`nextId`）/:108（`allocSessionId`）（§2.4 的 `:100-108` 已对）。 | 把 §1.2 档锚收正为 `:101,108`，与 §2.4 对齐。 |
| 4 | 判据自洽 | 🔵 | §2.2 验收句「有限 `updatedAt` ⇒ `new Date(v).toISOString() === v`」（:70）按字面（v = 输入 epoch 数）恒假——机检需作用在**发出后的 ISO 串**上。 | 改写为对发射值的往返恒等（解析 → toISOString → 与原串相等）。 |
| 5 | 语义登记 | 🔵 | §2.3 thinking 现值判据（:93）声明 off 两形 = `null` ∥ `{type:"disabled"}`，但表达式 `th != null && th.type !== "disabled"` 把 `undefined`（初始/未显式设置——核内亦见 `advisor/run.mjs:62`）收成 false，且不反映 `thinkAlwaysOn` 族（`model-specs.mjs:69`）生效态。 | 在 §11/§8 登记一行：currentValue = 本地显式档语义（undefined ⇒ false；always-on 族为本地档非服务端生效态）；或把 undefined 并入声明的 off 形清单。 |
| 6 | 文档归属（判据降级） | 🔵 | 无文档地图可核（判据降级）——降级核对：新档（:14/:16）承载 ACP 机制面收正，owning 档同拍收正 + 收口后冻结为批次记录，与 `READ-DATA-INTERFACE.md` 先例一致；需求档判定句缺口由主 agent 补笔（:33）。 | 无需改法；记录判据降级（无 map）与降级核对结论即可。 |

**其余判据结论（无发现）**：5/5 复验表证据锚抽核全中（`bridge.mjs:208` / `handlers-slots.mjs:47-53,79-80,108-114,139-140,161-164` / `handlers-session.mjs:32-36,49-69,167,191,204-206,266,268,287` / `acp.mjs:100-108` / `client-caps.mjs:28-37,57-61`）；修法与 §4.2 schema 逐键对位自洽（used/size ∥ oneOf select/boolean + currentValue + options ∥ currentModeId ∥ configOptions 全量）；目标形可实施（`providerSpec` 全量兜底 `model-specs.mjs:243,323-328` · `newSession` 认领+digest+`deleteSlot` 回滚闭环 `session-lifecycle.mjs:226-290`/`session-slots.mjs:219-237` · `MAX_READ_LINES` `tools/shared.mjs:21` · 无 confine 依据 `tools/shared.mjs:291-302` · `kimi-k3` context 1_000_000 `model-specs.mjs:44` · `_setSessionsDirForTest` 缝在盘）；#862 拆批四理由与现盘相符（⟦ev⟧ 8 名事件族实读在场；剥离=剥即弃 `bridge.mjs:190-197`）；用例 T1–T20 覆盖 normal/boundary/error；上抛 5 项均有处置位（§1.3 / §5 / §6 / §11 / §12）。

**计数**：🔴 0 · 🟡 1 · 🔵 5（共 6）

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-10-04 00:31「都自动跑」——点火 / 代签 / 派发 / 收口全自动授权；自缚三条件齐备）**

- ① **设计评审 pass** ✓：评审 #66（`VERDICT: pass` · 🔴 0 ∥ 🟡 1 ∥ 🔵 5——含 `handlers-session.mjs` 300 档拆分评审项）；
- ② **修正落地核验** ✓：收正轮 #71 五条全落（拆分评审 `:274-281` ∥ 替换点钉定 `:109` ∥ 行锚收正 `:25` ∥ 判据改写 `:70` ∥ 语义登记 `:348`）；父侧抽验在盘；另两笔父侧直接执行（本档 §1 锚点随动 `:17` ∥ 设计档 §2.4 枚举残项重编号 `:108`）+ **需求面补笔已落**（`docs/cli/requirements/ACP-CLIENT.md`——R-A5.4 改述 + **R-A5.8–A5.10** + 变更记录；主 agent 笔）；
- ③ **token 已签发** ✓（值不入档，纪律照守）。

**批准面**：#870 ∥ #871 ∥ #872 ∥ #873（#862 拆批不实施——裁定在档）——**派实施**（eng-coder）。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
