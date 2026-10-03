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
**状态行**：设计完成（2026-10-04 · 设计档 = docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md · 复验 5/5 在档 · #862 拆批裁定在档 · fix 轮（评审 #66 号 1–5 收正 · 号 6 保持）· 交付登记轮收正（#75 四条：号 1 §2.4+§11 ∥ 号 2 §2.2 钳形 ∥ 号 4 §2.5/§11 两登记；号 3 = 记录接受）· doc-check 复跑 = exit 0）
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

**§2 fix 轮 · 追加（#75 交付报告「待父侧裁决」四条收正 · eng-designer · 2026-10-04）**

父侧裁定：① 号 1 = 小修采纳（设计面落形）∥ ② 号 2 = 小修采纳（设计+代码同源面——设计侧先定形）∥ ③ 号 3 = 记录接受（父侧 §6 登记——设计侧零动作）∥ ④ 号 4（🔵×3）= 逐条登记。行锚 = 设计档收正后 as-of 本次收正。

- **号 1（🟡 delete→new 同键处置）**：设计档 §2.4 增「new 途处置点钉定」（`:112-114`）+「new 途认领释放位次」（`:115-116`）——处置动作 = `cancel` ∥ 删键（`sessions.set` 直前）；**认领释放随 `sessions.set`/`committed` 之后**（保留集须含新会话槽——先释后装会误释 `newSession` 新写认领，判据 `staleClaims`——`session-slot-claims.mjs:29-35` ∥ `session-lifecycle.mjs:273-274`）；§11 登记 `:353`；§12 实施令 `:368`。
- **号 2（🟡 值域钳）**：设计档 §2.2 定形 = `Number.isFinite(v) && Math.abs(v) <= 8.64e15`（TimeClip 上限）⇒ ISO；非法 ∥ 超域 ⇒ 键缺席（= null 语义；不用 epoch 0 占位）（`:70` ∥ 代码形 `:63-65` ∥ 验收 `:72`）；§3.2 `:182` ∥ §9 AC-2 `:311` ∥ §10 T5 `:328` 随动。
- **号 3（🟡 批内件 456 行）**：记录接受——设计侧零动作（父侧 §6）。
- **号 4（🔵×3）**：① 两形登记——§2.5 钉行为（裸盘符 ⇒ `unsupported scheme`：`new URL("C:/…").protocol === "c:"` 实读；非 URL 形带片段 ⇒ 不选区 ⇒ 通常 `unreadable`）（`:140-141` ∥ `:164`）+ §11 `:356`；② §11 装配失败面登记 `:354`；③ 「两档 >300 咨询档」= §7 拆分评审在册——不重开（零动作）。
- 机检：`node scripts/doc-check.mjs`（thincoder 仓根）= **exit 0**（悬空 0 ∥ 行宽 0；行数面差异 9 条 = 报告态——desktop ∥ render-core 域，非本档面）。
- 边界：只动设计档 + 本批档 §2；产品码零触（修正轮实施 = 后续 coder 轮）∥ 需求档零触 ∥ 在飞写域零触 ∥ 已收口批档零触。

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
**状态行**：实施完成（批内件 20/20（先红后绿）· doc-check exit 0 · 审计 clean ∥ 评审 pass（0🔴；🟡×3+🔵×3 均非 must-fix，登记待父侧裁决））



**§5 实施记录（eng-coder · 2026-10-04 · initial 轮——#870 ∥ #871 ∥ #872 ∥ #873 实施；#862 未实施 = 拆批在案）**

**schema SHA 复核（实施轮首步 · 设计档 §4.1）**：gh-proxy 镜像复取（命令同 `docs/batches/2026-09-18-acp-external-drivers.md` §2.8）= **247168 字节 · SHA256 `3c17bd6385d90cf672d8a661fddc359d73422cf8b8ce6865213d25cfd4c0eca7` · 170 `$defs`**——三项与设计档记值逐字相符 ⇒ 按设计继续（无停下上报项）。

**文件面与实测行数（Δ = 对设计 §7 预算；按盘回填面 = 本表）**

| 文件 | 实测（Δ） | 落点（file:line） |
|---|---|---|
| `thincoder-cli/src/acp/resource-link.mjs`（新） | 124 行 | §2.5 判定树全量（导出 = `resolveResourceLink` / `buildPromptText` / `MAX_INLINE_BYTES` / `MAX_INLINE_LINES` / `MAX_INLINE_CHARS`） |
| `thincoder-cli/src/acp/bridge.mjs` | 408（397 +11） | 头注 `:10-11` ∥ `providerSpec` import `:29-30` ∥ 签名增 `agent` `:66` ∥ onUsage `:212-219` |
| `thincoder-cli/src/acp/session.mjs` | 54（Δ0——`:22` 单行改） | 调用点传 `agent`（活引用） |
| `thincoder-cli/src/acp/handlers-session.mjs` | 329（292 +37） | 投影 `:40-53` ∥ 释放工厂 `:64-72` ∥ new 重排+回滚 `:185-229` ∥ prompt 接线 `:236-241` ∥ 两通知 `:298-304` / `:320-325` |
| `thincoder-cli/src/acp/handlers-slots.mjs` | 218（196 +22） | list 条目 `:46-55` ∥ load/resume id+替换 `:80-92` / `:152-161` ∥ 两响应 `:126-128` / `:185-186` |
| `thincoder-cli/src/acp.mjs` | 152（151 +1） | import `:33` ∥ ctx `:100-117`（计数器撤 ∥ `releaseClosedSlot` 入） |
| `docs/cli/design/ACP-CLIENT.md` | 661（655 +6） | §5 表 R1–R10 十处 + G5/G6 行删 + 变更记录 `:657-661` |
| `docs/core/design/API-CONTRACT.md` | 2972（重生成） | `node scripts/api-contract.mjs --write`（2862 条；`--check` = 骨架零漂移 · 636 档） |
| `docs/batches/2026-10-04-issue-fix-round2.test.mjs`（新） | 456 行 | T1–T20（先红后绿——见下） |

**批内件读数（先红后绿 · 逐腿）**

- **红相位（旧盘 · 修前，最终版批内件）**：**19 红 / 1 绿**。逐腿红因：T1–T2 `{usage}` 包装键（无 used/size）∥ T3 size `undefined` ∥ T4 `updatedAt` = number（epoch）∥ T5 NaN 值直发 ∥ T6–T8 `configOptions` = `[{id,name}]` 无判别键（T6 响应 `{}`、T8 undefined）∥ T10 原 id prompt ⇒ `unknown session 2`（旧分配器注册为 `"1"`）∥ T11 原 id 查无会话 ∥ T12 首载不替换（`first.cancelled=0`、Map size=2）∥ T13 `mode` 键 ∥ T14 `{configId,value}` ∥ T15–T19 `resource-link.mjs` 模块缺失（ERR_MODULE_NOT_FOUND）∥ T20 旧文案。**唯一绿 = T9**（单会话下旧计数器 id 与槽号串巧合同值；其「失败回滚」两腿为**新序**结构护栏——旧序下 createSession 失败本就零认领 ⇒ 平绿，红性在新序缺回滚时显现——如实登记）。
- **绿相位（落形后）**：**20/20 pass（EXIT 0）**。关键读数：T1 `{used:150,size:1000000}` ∥ T2 `{}`/无参 ⇒ `{used:0,size:1000000}` 零抛 ∥ T3 未知模型/无 provider ⇒ `128000` ∥ T4 `"updatedAt":"2026-10-03T17:16:04.890Z"`（发射值往返恒等）∥ T5 非有限 ⇒ `undefined`（JSON 序列化键缺席）∥ T6–T8 全形（`type`/`currentValue`/`options`；无 model ⇒ 缺席；四处同源）∥ T9 `id="1"` ∈ list + 回滚前后文件集等 ∥ T10 `keys=["2"]` 全链命中 ∥ T11 resume 原 id 命中 + close 后认领释放 ∥ T12 `first.cancelled=1 size=1` + 槽文件缺失/工程拒载双拒载腿（旧实例零副作用保留）∥ T13 `currentModeId:"plan"` ∥ T14 全量 `configOptions`（通知=响应同源）∥ T15 文本在前 + 围栏整文 ∥ T16 `lines 10–20`（en dash）行数正确 + `#L5:15` + 尾截断 + 单行形 ∥ T17 百分号解码/盘符剥前导 `/`/相对按 cwd ∥ T18 五类词表标记逐字 ∥ T19 四上限标记（行/字符/NUL/字节）∥ T20 `-32602` 新文案 + 畸形首块不吞后续合法块。
- 跑法：自 `thincoder/` 仓根 `node --test docs/batches/2026-10-04-issue-fix-round2.test.mjs`（T5 协作面桩 = `registerHooks` 第二模块实例——`listSlots` 非有限值经真实管线不可达，如实登记于件内注释）。

**机检读数**：`node scripts/doc-check.mjs` = **exit 0**（锚 0 悬空 ∥ 行宽 0 超限；行数面 8 条差异 = desktop 域报告态、非本批面）∥ `node scripts/api-contract.mjs --check` = 骨架零漂移 ∥ 六源档 + 批内件 `node --check` 全 OK。

**AC 对照**：AC-1–AC-5 = T1–T20 绿（逐条见上）∥ AC-6 = 本段机检三项 + 批内件全绿 ∥ AC-7 = #862 零实施（源面零结构化子代理映射、剥离语义零改）——台账「待设计」由父侧核。

**审计与评审轮次（终态 = clean）**

- **内部密合审计**（explore · 只读 · 9 档对设计档 + 批档）：**四类偏差均未发现**（0 partial ∥ 0 silent-simplification ∥ 0 out-of-list 未报 ∥ 0 doc-drift）；AC-1–AC-5/AC-7/文档面/边界全 met；AC-6 静态 met（两条执行腿审计侧无 shell ⇒ unverified——读数归本段/报告面）。观察 O-1–O-4：O-1 §5 空 = 本段即补 ∥ O-2 批内件 456 行（见登记 3）∥ O-3 `nextId++` 注记（设计 §5 目标文本同形——R2「已剔」/R4「撤」/R9「已收正」house style，判可接受）∥ O-4 新档未入 §3.5 模块表（设计面留白，非实施偏差）。
- **独立代码评审**（advisor · type=code · 7 档 + 设计/批档）：**VERDICT: pass**（**0 🔴**；🟡×3 + 🔵×3——均非 must-fix）。宿主机械核注 1 条引用不可解析（评审写作 `resource-link.mjs:55` 省前缀——该行实读 = `if (url.protocol !== "file:") return marker(raw, "unsupported scheme")`，与本批实施一致）。

**评审登记（3 🟡 + 3 🔵——父侧裁决面；本轮零擅改 = 零语义外扩纪律）**

1. 🟡 `handlers-session.mjs`——**id 复用覆盖面**（`session/delete` 后 `session/new` 回收槽号 ⇒ `sessions.set` 静默覆盖同键在存实例：旧回合不 cancel、通知串流；失败类 = D-4 被否项经 delete→new 入口）。评审建议 = `sessions.set` 前处置同键（与 load/resume 替换同法）∥ 或设计档 §11 登记。**待父侧裁决（本批小修 ∥ 登记）**。
2. 🟡 `handlers-slots.mjs:53`——`Number.isFinite` 值域钳缺（有限但 |v| > 8.64e15 ⇒ `toISOString` RangeError ⇒ list 整方法 -32603；到达需手改/损坏槽档）。设计 §2.2 目标形同表达式 ⇒ 设计+代码同源面。**待父侧裁决**。
3. 🟡 批内件 456 行 > 300 咨询档（且 > 自记预算 ~290/≤300；500 硬限未破）——建议拆两件 ∥ 抽夹具档；设计 §7 / 批档 §2 表待按盘回填（实测值 = 上表）。
4. 🔵 `bridge.mjs` 408 ∥ `handlers-session.mjs` 329 > 300 咨询档——设计 §7 拆分评审在册（本批不拆），不重开、零动作。
5. 🔵 `resource-link.mjs` 两形未登记（裸盘符 ⇒ `unsupported scheme` ∥ 非 URL 形带片段不选区）——建议设计档 §11 登记；代码零改。
6. 🔵 load/resume 替换的 `createSession` 失败面（旧实例已撤、新实例未建）——设计 §2.4 只保证前置判据拒载零副作用；建议 §11 登记 ∥ 实施恢复。

**越清单与披露（透明面）**

- ACP-CLIENT.md 超出设计 §5 十处的两笔：§2.1 `session/prompt` 行（补 `resource_link`）+ §6.1（`nextId++` 残句改现态）——理由 = 失效句收正（对象已消/被取代；D8）；审计 + 评审均核「成立」。
- 批内件 456 行超设计预算（~290/≤300）——如实登记（= 登记 3）。
- `docs/core/design/API-CONTRACT.md` 重生成 = 工具整区替换语义 ⇒ 差异面含他批在飞坐标位移（panel/desktop 面——非本批笔）；本批面 = `sessionConfigOptions`/`createSlotReleaser`/resource-link 五导出增 + `CONFIG_OPTIONS` 撤 + 行号位移。

**边界遵守**：需求档零触（主 agent 笔已落）∥ 在飞写域零触（面板面 ∥ 批五二档 ∥ 批三档 ∥ 批四档）∥ 已收口批档零触 ∥ #862 面零扩 ∥ 协议版本/方法面/initialize 形状零动。

## §6 验证与收口（父代理）
