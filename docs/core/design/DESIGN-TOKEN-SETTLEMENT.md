# 设计评审凭证结算（DESIGN-TOKEN-SETTLEMENT）· 工程模式凭证链板块

> 板块 = **工程模式凭证链（结算面）**——评审通过后 token 的**结算 / 持久化 / 回读 / 消费**。
> 相邻权威 = `docs/core/design/ENG-TOKEN-BINDING.md`（token 生命周期语义：TTL / 格式 / 跨模式存活——本档**不重述**，D2）· `docs/core/design/CONSULTATION.md`（评审引擎）· `docs/core/design/SESSION.md`（会话槽文件与序列化）。
> 需求侧 = `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md`（源 = VSC 树需求档）；CLI 树需求档**未迁**（后续批）。

## 1. 定位

**结构性基线**：CLI 的 agent 对象是**进程常驻单对象**（跨回合 / 挂起复用）——因此 **无** VSC 端的死对象 bug、无挂起入场快照、无 onComplete 清零类似物。

**现行设计（D1–D3）**：槽文件 = **权威结算台账**；settle 当场落盘；门禁 miss 回读槽；单值镜像退役。

## 2. D1 —— settle 当场同步落盘

- settle 是唯一结算点 ⇒ **settle 当场把 token 字段持久化到槽文件**（不等下个回合尾 `saveSession`）。
  - 落点：`thincoder-core/agent-tools/advisor-settle.mjs:152`（结算）→ `:163`（`persistEngTokens(agent)` 当场落盘）。
  - 落盘函数：`thincoder-core/token-ttl.mjs:233`（`persistEngTokens`）——复用 `engTokenSlotFields` 序列化 + session 安全写 / 轮转（`guardForeignSlotFile`，`thincoder-core/session-guard.mjs:35`——与 `saveSession` 同一份守卫，**勿裸写文件**）。
  - 内存 Map 仍为当前进程缓存（常驻、与槽一致）。
- **写失败语义**：settle 的槽写须同步 await——**失败即 settle 失败**（token 不注册、无 Approved 回显、可重评）：不静默吞错、不产生「内存有盘上无」态。回滚点：`advisor-settle.mjs:171`–`:172`（失败恢复 settle 前的 Map）。

## 3. D2 —— spawn 门禁读权威（miss 回读槽）

- 门禁先读内存 Map；**miss 时回读槽文件权威台账**（reconcile + 判定）——覆盖「进程重启后槽有但 Map 未及回填 / 缓存与槽不一致」。TTL 过滤保留。
- 落点：`thincoder-core/agent-tools/subagent-spawn.mjs:100`（`resolveDesignSlot`）· 回读函数 `thincoder-core/token-ttl.mjs:187`（`reconcileEngTokensFromSlot`）· 只读原语 `:164`（`readEngTokensFromSlot`）。

## 4. D3 —— 单值镜像退役 + dispatch 写门问活槽

- `_engDesignToken` 单值镜像**退役**：settle / restore / consume / TTL / `new` 一律不再维护它（**零写**）。
  - 序列化面只产多槽表：`thincoder-core/token-ttl.mjs:112`（`engTokenSlotFields`）。
  - agent 对象**无该字段初始化**：`thincoder-core/agent.mjs:69`–`:71`。
  - 会话复位不再清镜像：`thincoder-core/session.mjs:437`–`:438`。
- **存量兼容**：旧会话槽文件可能残留镜像字段值——恢复时**一次性**读取迁入 Map（**唯一迁移读点**，此后不写不读）：`thincoder-core/token-ttl.mjs:131`（`restoreEngTokens`）；落盘时该 legacy 字段被一并删除（`token-ttl.mjs:271`）。
- **dispatch 写门**：资格判定改问**「任一活槽存在」**——`thincoder-core/token-ttl.mjs:211`（`anyLiveDesignSlot`），调用点 `thincoder-core/agent/dispatch.mjs:99`。
- **轻通道轮在盘放行**：无活槽时，**轻通道轮在盘**（轮次行 `在途` 携「收尾链待跑」+ 指针指向「进行中」轮档）亦放行——判据 = `docs/core/design/LIGHT-CHANNEL.md` §2.8（本档不重述）；调用点 = 同条件式**末位合取项**（`thincoder-core/agent/dispatch.mjs:98-101` 条件式——末位合取 `:101`）。

## 5. consume 落盘对称（交付 🔴 复活洞修复）与用例

- **复活洞**：D1 + D2 叠加后，consume-design 删内存槽 → 回合尾 save 窗口内 spawn 门禁 miss 回读 → 会从**盘上复活**已消费 token。
- **修法**：consume-design 删内存槽后**当场同步落盘删除**（写空槽）——`thincoder-core/agent-tools/design-slots.mjs:150`（`removeDesignTokenSlot`）→ `:152`（`persistEngTokens`）。落盘失败 ⇒ 回滚内存槽 + 抛错可重试（不留半消费态）。
- **消耗语义**：消费后同 designId 再 spawn = `resolveDesignSlot` not found 机械拒（消费核 `thincoder-core/agent-tools/design-slots.mjs:110`–`:135` 即此契约）。**批量清点 / 选择器面 = §9**。

**用例**（当批定向单测 `docs/batches/<batch>-<topic>.test.mjs`——收口随批删；相应集成用例尚未设立——既有缺口，另账）：

| 类 | 场景 | 期望 |
|---|---|---|
| 正常 | settle 当场落盘 → 进程 kill（不等回合尾）→ resume → spawn | 门禁从槽读到 token，通过 |
| 正常 | 缓存 miss 回读 | 内存 miss → 回读槽文件 → 命中 |
| 正常 | consume 后 kill → restart → 同 designId 再 spawn | **不复活**（旧台账已删） |
| 正常 | dispatch 写门资格判定 | 有活槽放行 / 无活槽拦（轻通道轮在盘除外——§4 D3） |
| 边界 | 过期 token 槽 | 恢复 / 门禁 TTL 过滤——过期拒 |
| 边界 | 残留镜像一次性迁移 | 迁入 Map，随后不再写镜像 |
| 错误 | settle 落盘失败 | settle 失败可重评，不留半结算态 |
| 错误 | consume 落盘失败 | 回滚内存槽 + 抛错可重试 |

## 6. 机制面（B 式迁移并入——现状路径）

### 6.1 实现坐标

| 面 | 落点 | 实核 |
|---|---|---|
| settle 当场落盘 | `thincoder-core/agent-tools/advisor-settle.mjs:152` · `:163` | 在位 |
| settle 失败回滚 | `thincoder-core/agent-tools/advisor-settle.mjs:171`–`:172` | 在位 |
| 落盘函数 + 槽台账 I/O | `thincoder-core/token-ttl.mjs:233` · `:164` · `:187` · `:211` | 在位 |
| 槽序列化 / 恢复 | `thincoder-core/token-ttl.mjs:112` · `:131` | 在位 |
| spawn 门禁解析 | `thincoder-core/agent-tools/subagent-spawn.mjs:100` | 在位 |
| consume 落盘对称 | `thincoder-core/agent-tools/design-slots.mjs:150` · `:152` | 在位 |
| dispatch 写门 | `thincoder-core/agent/dispatch.mjs:95` | 在读任一活槽 ∨ 轻通道轮在盘（§4 D3——判据 = `docs/core/design/LIGHT-CHANNEL.md` §2.8） |
| 镜像零写 | `thincoder-core/agent.mjs:69`–`:71` · `thincoder-core/session.mjs:437`–`:438` | 无字段初始化 |
| 轮转守卫（拆分产物） | `thincoder-core/session-guard.mjs:35` | 与 `saveSession` 共用 |
| 凭证工具组（拆分产物） | `thincoder-core/agent-tools/design-token.mjs` | 签发 / 校验 / 结算纯函数 |
| 测试 | 当批定向单测（`docs/batches/<batch>-<topic>.test.mjs`——收口随批删） | 相应集成用例尚未设立（既有缺口，另账） |

### 6.2 双端与依赖方向

- **双端**：CLI 与 VSC 各自实现、**语义同源**（同一批「结算即落盘 / 门禁读权威 / 镜像退役」三条）。CLI 无 VSC 的快照 / 清零修复面（不存在对应 bug），**不引入**。
- **已知有意差异**：两项——① **同 id 冲突裁决**（本仓 = **槽为准**〔「槽 = 权威」〕；VSC = 内存优先——`thincoder-vscode/src/agent/agent-state.mjs:58-76` `reconcileEngDesignTokens`：`!map.has(id)` 才合入）——**A9 核查 = ① 不成立**（两面同具备 Map 与槽两载体，无单侧对象）⇒ 按「端差默认 = 消」转**消解路径 + 到期条件**：
  两面对齐同一裁决规则（方向 = token 结算 / 合并面设计轮裁定——候选 = 槽为准〔核现径〕∥ 内存优先〔端现径，防丢新铸〕）；**到期 = token 结算 / 合并面下次触碰**。
  **处置面**：新清点 / 批量消费面（F-SL1 / F-SL2）按「**槽为准**」（核现径）落地——裁决主项与核侧一致；**两面对齐余项**（VSC 内存优先面收正）**缓办**（零触端 reconcile 面）——待决项维持未裁，到期条件照旧（该面下次触碰）。

  ② **过期清理回写时序**（VSC = 当场权威台账回写；本形态 = 惰性〔随下次 `persistEngTokens` / `saveSession` 携带〕）——**形态（写回时序）· 语义零差**（清理对象 = 过期项——任何门禁均不授权，早清晚清不改变授权结果）⇒ 非登记项。源码注释逐字登记（`thincoder-core/token-ttl.mjs:181`–`:186`）。
- **依赖环（有意、安全）**：`token-ttl.mjs` 只 import 底层槽 I/O（`session-slots.mjs` + `session-guard.mjs`）；`session.mjs` 同时 import `token-ttl.mjs` → 静态环，与既有 session ↔ session-slots 环同构（函数声明实例化期已初始化，环安全）。

### 6.3 VSC 端结算接线

> 来源 = VSC 产品档（旧档一字未改、留参照历史）。VSC 结构性基线不同：agent 对象**每 run 重建**（`thincoder-vscode/src/agent/setup.mjs`——非 CLI 常驻单对象）⇒ 结算面多出
> 「死对象 / 快照 / 清零」三类 VSC 独有断点——D1–D6 全部落地后与 CLI **同机制语义**（settle 即落盘权威台账 / 门禁读权威 / 镜像退役）。生命周期语义 / TTL / 格式 = 核面单一权威（`docs/core/design/ENG-TOKEN-BINDING.md` §6.3——本档不重述）；原 VSC 镜像 `advisor.mjs` 等随 W12/W13 已删）。

| 面 | VSC 落点（实核 · W16 接线面收正） |
|---|---|
| settle 当场同步落盘（D1——去 fire-and-forget） | **W12 已迁核**——现体 = 核 `thincoder-core/agent-tools/advisor-settle.mjs`（settle 当场落盘 `:152` · `:163` · 失败回滚 `:171-172`）+ 核 `thincoder-core/token-ttl.mjs:233`（`persistEngTokens`）；原端侧 `src/agent-tools/advisor-async.mjs:364-392` 已删 |
| token 入槽 + Approved 后缀（echo 即裁决） | **W12 已迁核**——现体 = 核 `thincoder-core/agent-tools/design-token.mjs:22`（`buildApprovedSuffix`）· `:82`（`settleDesignReview`）；原 `advisor-async.mjs:389` / `:392` 已删 |
| 门禁读权威（miss 回读槽——D4） | 现体 = 核 `thincoder-core/agent-tools/subagent-spawn.mjs:100`（`resolveDesignSlot`——内存 miss 回读槽 reconcile + TTL 过滤保留；仅过期拒才删槽） |
| 写侧保留槽 + union 合并（D2 + D6——忙时不清 settle 落盘项） | **W11 转口核**——端壳 `thincoder-vscode/src/extension/session-slot-write.mjs:23`（`engTokensMergeForSave` = 核 `mergeEngTokensForSave` re-export）→ 核 `thincoder-core/session-slot-write.mjs:156`（并集 + 同 key 新铸者胜） |
| 会话内回合从槽新读（D3——快照已删） | 端壳 hydrate 面：`thincoder-vscode/src/agent/setup.mjs`（`hydrateRun` 每轮 `loadSlot` → `applySlotSessionState`）+ `thincoder-vscode/src/agent/agent-state.mjs:56`（`reconcileEngDesignTokens` 槽源合入——同 id 冲突**内存优先**〔状态词 = §6.2 ①〕；内存项永不清空——「槽 = 权威」仅指门禁读源 = D-S3） |
| 单值镜像退役（D5） | `_engDesignToken` 单值镜像**零运行时读写**（dispatch 写门资格问「任一活槽存在」——核 `resolveDesignSlot`（`thincoder-core/agent-tools/subagent-spawn.mjs:115`））；仅 `thincoder-vscode/src/agent/agent-state.mjs:70-71` 一次性迁移读（legacy 残留——`ENG-TOKEN-BINDING.md` §6.3 已列） |
| 消费落盘对称（consume 后不复活） | **W12/W13 已迁核**——现体 = 核 `thincoder-core/agent-tools/design-slots.mjs:110`（`executeConsumeDesignAction`——删内存槽 + `persistEngTokens` 当场同步落盘 + 失败回滚 `:153-156`） |
| 测试覆盖 | 当批定向单测（`docs/batches/<batch>-<topic>.test.mjs`——settle 落盘 / union 忙时 / restore / consume 不复活；收口随批删）。相应集成用例尚未设立（既有缺口，另账） |

**VSC 侧差异**：① `engTokensMergeForSave` 同 key 冲突「**expiresAt 大者胜**（新 mint）」——**已消解**（W11 转口后同一实现：端壳 = 核 `mergeEngTokensForSave` re-export；

  「新铸者胜」与「expiresAt 大者胜」= 同一规则——核档 `thincoder-core/session-slot-write.mjs:172-173`）；② `reconcileEngTokensFromSlot` 同 id 冲突以槽为准（VSC 版内存优先）——**消解路径 + 到期条件在册**（A9 核查与处置 = §6.2 ①）。

## 7. 并入的关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-S1 | **settle 即落盘**（不等回合尾） | settle 是唯一结算点——窗口内被杀即丢凭证 |
| D-S2 | 落盘失败 = **settle 失败** | 宁可结算失败可重评，也不留「内存有盘上无」半结算态 |
| D-S3 | 门禁 **miss 回读槽**（槽 = 权威） | 重启后 Map 未回填时不能凭缓存 miss 就拒 |
| D-S4 | 单值镜像**退役**（零写 + 仅一次性迁移读） | 两套真相必然分叉 |
| D-S5 | dispatch 写门改问**任一活槽** | 与 spawn 门同源（同一 reconcile） |
| D-S6 | consume 删槽**当场落盘** | 不落盘则 D1+D2 叠加出复活洞 |

## 8. 评审凭证（v2——M6 增量）

**定位**：评审通过 ≠ 授权落地——通过只发「凭证」（designId + token），实现方拿凭证解锁写码；链收口后**同 designId 再 spawn = 机械拒**（链终消费）。v1 已完整实现凭证生命周期（签发 → TTL → 消费 → 移除），**v2 继承零改**；评审对象受理面 = 项目内现存 `.md`（判据单源 = `docs/core/design/ADVISOR-GUARDS.md` §12）。

**五功能点**：

| # | 功能点 | 方案 |
|---|---|---|
| F1 | 评审通过 → 签发 designToken | **继承 v1**（`generateDesignToken` + `settleDesignReview` → designId+token） |
| F2 | 链终消费制 | **继承 v1**（`consume-design` → `resolveDesignSlot` + `removeDesignTokenSlot`——消费后同 designId 再 spawn = `designId not found` 机械拒；重复消费幂等 no-op） |
| F3 | 评审对象来源 = 项目内现存 `.md` | 解析 / 受理 / 拒发文案的判据单源 = `docs/core/design/ADVISOR-GUARDS.md` §12（本档不复述，D2）；实现宿主 = `resolveReviewDocPaths`（`review-facts.mjs`；不 import `dispatch.mjs`——簇间回边环风险）。实施 = eng-coder 轮 |
| F4 | 凭证值不落文档 | token / designId **值**永不落档（只记 `review passed`）——`sanitizeText`/`CRED_RE` 机械剥除已实证（继承） |
| F5 | 六 kind 不签发 | 非全绿（含 🔴）→ 不签发 token（fail-closed，继承） |

**验收（回指 AC-M6）**：

| # | 判据 |
|---|---|
| AC-M6-1 | 评审通过（全绿）→ 签发 token + 槽登记 |
| AC-M6-2 | 链终消费后同 designId 再 spawn → 拒 |
| AC-M6-3 | 受理面 = 项目内现存 `.md`（判据单源 = `docs/core/design/ADVISOR-GUARDS.md` §12）；源码硬编码 `docs/` → 零命中 |
| AC-M6-4 | token / designId 值不落文档（只记 `review passed`） |
| AC-M6-5 | 六 kind 非全绿（含 🔴）→ 不签发 token |

**边界（本增量不做）**：不做评审判据本身（advisor 内部——继承）；不做凭证格式改造（`uuid:expiresAt` 继承 v1，不重设 HMAC/签名层）。

## 9. 槽位清点（令牌直读）与批量消费

**背景**：链终消费（§5 / §8 F2）只有逐枚通道、无清点面——已批准未消费槽只能从门禁拒文（`designId not found … held design ids`）反查。已闭链批的活 token 滞留 = 复用漏洞 ⇒ 本节补**清点面**与**批量消费**；**token 的身份 / 值形 / TTL 语义零改**（settle 增写批次旁列 = §10；#868 可靠性面另论）。

**在位 / 增量分界**：F-SL1 清点面 ∥ F-SL2 批量消费 = 在位零改（清点核 `design-slots.mjs:150` ∥ 消费核 `:183`）；本节增量 = 清点行恒携 `designToken` + 删 reveal ∥ 掩蔽 ∥ 一次一槽（删除面见下）。

**F-SL1 清点面（`subagent` action:`design-slots`——只读）**：

- **动作面**：`subagent` 工具只读 action `design-slots`（第九动作——动作表 = `AGENT-LOOP-SUBAGENT.md` §6.7.2）；工程模式父侧（depth-0）限定（与 consume-design 同门）；分类 = 只读（planMode 放行 / 免审批 / digest 放行——同 `status` / `observe`）。
- **数据源**：槽文件权威表（`readEngTokensFromSlot`——无 TTL 过滤原样）∪ 内存 Map（并集去重，冲突以槽为准——D-S3 同源）；**零写**（不 reconcile 回写、不落盘）。
- **列表面（逐槽一行；龄升序——最老在前）**：`designId`（全串）∥ 状态（`live` / `expired`——`tokenExpired` 单源）∥ 时龄 `ageDays`（= now − (expiresAt − `effectiveTokenTtlMs`) 派生；TTL 配置曾改时为近似——如实注）∥ `expiresAt`（精确）∥ 批 ∥ `designToken`（末位——见「令牌直读」）；尾行 = 计数行（总数 ∥ live ∥ expired）。
- **「批」列来源**：槽文件批次旁列（§10——settle 时按 `docSetKey` 的 `batches/` 段档落盘）优先；旁列缺失（旁列启用前签发的旧槽）⇒ 会话内评审实例注册表（`_advisorRuns`）按 designId 命中 run 反查 `docSetKey`（= 被审文档绝对路径集 JSON）中 `batches/` 段档；两者皆不可得 ⇒ `—`。
- **输出形**：行文本（紧凑——同 consume 面风格）；字段 / 序 / 降级标记 = 契约，行内措辞 = 实现面。

**F-SL1 令牌直读（token 不藏）——需求 F-SL3**：

- **决策与理由**：清点行**恒携** `designToken` 全串值——用户 2026-10-17 裁定「没必要把 token 藏起来，agent 要就告诉他」。理由：值不列时 agent 取用仍要绕回台账找回，而分层取用（开关 / 值形态取舍 / 单槽限）只增机制、不减取用成本 ⇒ 收为一条行契约：照列（用户同日 19:22 同裁「不希望让机制进一步复杂化」）。
- **最相近先例**：同节 F-SL1 清点面（同一行契约 ∥ 同一并集视图 `unionSlots` ∥ 同一 fail-closed 拒形）；实现坐标（现行）= `thincoder-core/agent-tools/design-slots.mjs:150`（清点核）∥ `:171`（行拼装）；先例批号 = 未在档内可考；对齐 = 令牌列 = 行契约的末位字段，不新立参数 / 动作 / 存储；偏差 = 无。
- **公开源核查**：项目声明 `PROJECT-MANIFEST.json` 的 `index.publicRepos` = 空 ⇒ 无公开源档可查；核内最近先例 = `consume-design` 回执（照列 designId，无值形态取舍）——「按形态取舍后恒显」查无既有先例，以用户裁定为准。
- **参数面**：唯一参数 `designId`（可选——过滤到单槽；trim 后精确匹配；空串视同缺省；未知 ⇒ 拒 + 列在场 id）。
- **畸形口径**：槽值不可解析（`tokenExpiryMs` = null）⇒ `designToken=—`，`ageDays` / `expiresAt` 同 `—`；过期槽**照列值**——`status=expired` 已标态，且过期 token 在任何门禁都过不了，值本身不构成授权。
- **日志互作（在案——工具输出恒含令牌，日志面单点剥离）**：工具结果前 200 字符经 `agent/dispatch-run.mjs` 的 `tool:done` 事件 `head` 字段落盘；`thincoder-core/log.mjs` `SECRET_FORM` 含 token 值形（`[0-9a-f]{8}-…-[0-9a-f]{12}:\d{10,16}`）⇒ `sanitizeString` 在形态前截断，字段名黑名单含 `designtoken`。**日志面零改**；令牌列置行尾 ⇒ 截断只吃掉值本身，其余列在日志里仍完整。
- **日志面已知代价（如实登记）**：多槽清单在日志 `head` 只保留首行（token 之后内容被截断）——日志面不再保有清单完整性；令牌值本身仍不入日志。
- **边界**：零写（不 reconcile 回写、不落盘——`unionSlots` 同源）；不改 spawn 门显式令牌语义（见下「自动解析取舍」）；不动 TTL / 消费机制；端面（VSC / 桌面）零改（只读动作级分类已覆盖）；跨重启可用（并集视图含槽文件）。
- **边界注（列值来源 ↔ spawn 门分叉——登记备查、非阻断）**：列值来源 = 槽为准（`unionSlots`），spawn 门 = 内存优先、miss 回读槽（§3 D2——`thincoder-core/agent-tools/subagent-spawn.mjs:104`）——同 id 两载体分叉时（低可达——常态同步）列出的值可能被门「严格相等」校验拒；不改两侧判序。

**描述面 / 提示面（建议文本——落笔归各面笔主，D1）**：

| 面 | 建议文本 |
|---|---|
| `thincoder-core/tool-docs/subagent.md` `:10` | `- action:'design-slots' (engineering mode, parent side): READ-ONLY inventory of this session's approved design token slots — one line per slot (designId, live\|expired, ageDays, expiresAt, batch, designToken), oldest first, ending with a total/live/expired count line. Nothing is written. Use it to see what still holds a slot before consuming; the expired / olderThanDays selectors act on the same set.` |
| 同档 `:11-12`（并两行为一） | `  Every row carries its designToken value (expired ones included — status marks them; a malformed record shows designToken=—). Pass designId to filter to a single slot (trimmed exact match; unknown = refused with the held id list; empty string = no filter). Take designId + designToken verbatim onto the eng-coder spawn — the gate checks exact equality.` |
| `thincoder-core/agent-tools/subagent.mjs` `:148`（`designId` 描述） | `role='eng-coder'`: the designId echoed with the approved token — required to pick between concurrent designs (optional for one). `action:'consume-design'`: the single-slot selector (required to pick between several; the gate refuses to guess); see designIds / expired / olderThanDays for batch consumption. `action:'design-slots'`: filter the inventory to one slot (trimmed exact match; an empty string means no filter; an unknown id is refused with the held id list).` |
| 英文运行期 `thincoder-core/prompts/persona-engineering.md` `:141` | `- **In-flight token recovery**: a token (or its designId) dropped from your context — compaction, restart — is not lost: the slot ledger keeps every issued token. `subagent` `action:'design-slots'` lists every slot with its full `designToken` on the row (expired slots included — status marks them; a malformed record shows `designToken=—`; pass designId to filter to one slot). Pass both values verbatim on the eng-coder spawn (the gate checks exact equality) — recovery changes no discipline: tokens stay short-lived runtime state, consumed at chain terminal.` |
| 动作表 `docs/core/design/AGENT-LOOP-SUBAGENT.md` `:50` | 参数列 `designId?`；返回列 = 槽位清单（designId ∥ live/expired ∥ 时龄 ∥ `expiresAt` ∥ 批 ∥ `designToken`——龄升序）+ 计数尾行；`designId` 过滤 ⇒ 单槽行 + 计数尾行（注 `(filtered by designId)`）；token 恒列（过期照列；畸形 ⇒ `—`）；两值原样入 eng-coder spawn。阻塞列照旧（同步 · 父侧 · 工程模式 · 只读） |

**取用程序（用法——运行态；值不落文档、不贴用户面）**：

1. 清点：`subagent` `action:'design-slots'`——行内即含 `designToken`，按「批」列 / `designId` 认出目标槽；
2. 派发：`designId` + `designToken` **原样**入 eng-coder spawn（门禁严格相等）；
3. 纪律照旧：及时使用 / 链终 `consume-design`（§5 ∥ §8 F2——本节零改；**直读 ≠ 囤积许可**）；**「设计令牌不许放到过期」**（用户 2026-10-13 裁）——令牌 = 短命运行态：签发即尽快派单落地、链收口即消费；放任过期 ⇒ 该枚授权作废（门禁照拒、须重走评审），未消费活槽滞留 = 复用漏洞。

**自动解析取舍（designId-only spawn 为何不做）**：**不做**（现状显式门 = 默认保持）。理由：token 值 = 凭据；**designId 非凭据**（清点面 / 拒文均照列）——门内按 designId 自动取槽 = 把授权退化为「知道 id 即可写码」，「评审通过 → 签发凭证 → 显式持凭证」链条在门面断掉。
直读消除的是**「取不回」**，不是**「不用取」**——取用成本由清点行消解（一次只读调用即见全串），门的显式性保留；如有反证（自动解析仍能保住凭证语义）⇒ 出案另裁（动门 = 凭证语义变更，须全链设计 + 用户裁）。

**F-SL2 批量消费（`consume-design` 选择器扩展）**：

- **选择器（恰一）**：`designId`（单枚）∥ `designIds: string[]`（显式清单——非空）∥ `expired: true`（全部过期项）∥ `olderThanDays: number`（`ageDays > N`）。多选择器同给 / 选择器缺失且多槽 ⇒ 拒（fail-closed——不猜）。
- **语义**：按选择器解析目标集 → 逐枚移出（内存 + 权威表口径，`removeDesignTokenSlot` 同款 token 值守护）→ **单次 `persistEngTokens` 落盘**（§5 D-S6 单点）；落盘失败 ⇒ 内存快照整体回滚 + 抛（不留半消费态）。未知 / 已消费 id = 逐枚 no-op 提示（幂等——§5 语义不变）。
- **落盘携带（如实）**：persist 写内存 Map（现行序列化形）⇒ 过期项随本次落盘一并出清（D2 惰性清理既有语义——非本节引入）。
- **回执**：逐枚行 + 计数行（`consumed N`）；单枚形态回执 = 现行逐字不变。
- **同 id 再 spawn 机械拒**（§8 F2）与多槽隔离（消费 A 不动 B）**不变**。
- **边界（不做）**：不做 `all` 无选择器形态；`consume-design` 不加按批选择器（批归属的消费 = §10 收口自动消费）；**token 值形 ∥ TTL ∥ 单枚语义零改**。

**落点（现行 → 改后）**：

| 面 | 落点 | 现行 | 改后 |
|---|---|---|---|
| 清点 / 消费核 | `thincoder-core/agent-tools/design-slots.mjs`（305 行） | 现行落点：`executeDesignSlotsAction` `:150` ∥ 消费核 `:183` ∥ 并集视图 `:36` ∥ 批列派生 `:60`（`batchOf`）∥ 批档 basename 解析 `:81` ∥ 行拼装 `:171`（单行 `map`，行末恒携 `designToken`）；reveal 面 `grep` 零命中（U-SL14 机检在册） | 清点 / 消费 / 并集零改（批列来源见 §10）；本节改动已落地——无待改项 |
| 动作分派 + 参数 schema | `thincoder-core/agent-tools/subagent.mjs`（422 行） | 九动作分派 `:200` · `designId` 参数 `:148` · `reveal` schema 键 `:152` · 档头回收句 `:8` | 分派零改；`:152` 删行 · `:8` 删行 · `:148` 删末句（删除面 D9–D11） |
| 分类面 | `thincoder-core/agent/dispatch-gates.mjs`（151 行） | `design-slots` ∈ `isSubagentReadonlyAction` | ±0（参数面变化不动只读分类） |
| 描述面 | `thincoder-core/tool-docs/subagent.md`（44 行） | design-slots 条目 `:10-12` | 逐字 = 「描述面 / 提示面」表 tool-docs 两行建议文本（`:11-12` 并一；`:10` 行契约补 `designToken`） |
| 端面 | `thincoder-vscode/src/agent/tool-table.mjs`（187 行） | `vscSubagentFace` readonly 谓词 `:85` | ±0 |
| 动作表 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.2（673 行） | design-slots 行 `:50` | 逐字 = 「描述面 / 提示面」表动作表行建议文本（参数列 `designId?`；返回列含 `expiresAt`） |
| 英文运行期面 | `thincoder-core/prompts/persona-engineering.md`（220 行） | 同源句 `:141` | 逐字 = 同表英文运行期面行建议文本 |

行数口径 = 末行行号（文件末换行不计额外行）；本节坐标 = 设计读数时的现行行号——删行后行号随动，判据以删除面 + U-SL14 的内容机检为准。

**删除面（改前 → 改后——删净为机制本体；落定后由 U-SL14 机检）**：

| # | 文件 / 坐标（改前） | 改前（实读） | 改后 |
|---|---|---|---|
| D1 | `thincoder-core/agent-tools/design-slots.mjs:113-116` | `const revealArg = args?.reveal` + 非 boolean 拒值分支（`reveal must be a boolean …`） | 删净（无 reveal 参数面） |
| D2 | 同档 `:119-121` | `reveal:true` 缺 `designId` ⇒ 拒「one slot at a time (no bulk dump)」（一次一槽） | 删净（`designId` 过滤不附前置条件） |
| D3 | 同档 `:130` | `const reveal = revealArg === true`（分支开关） | 删净 |
| D4 | 同档 `:131-137` | `flatMap` 三分支：`!reveal` 原行 ∥ `liveSlot` 揭值 + `RECOVERY_LINE` ∥ 掩蔽行（`masked; passes no gate`） | 收为单行 `map`：`base` + ` designToken=${e.expiresAt === null ? "—" : e.token}`（恒携；畸形 ⇒ `—`） |
| D5 | 同档 `:90-91` | `RECOVERY_LINE` 常量（「pass designId + designToken verbatim …」取用提示行） | 删净（取用归描述面单点——KD-SL7） |
| D6 | 同档 `:86-88` | `liveSlot` 掩蔽判据（`e.expiresAt !== null && !e.expired`）+ 注 | 删净（值恒列，态由 `status` 表达——无「揭值 / 掩蔽」二分） |
| D7 | 同档 `:111-112` | 参数面注释（`reveal` 仅 boolean ∥ 一次一槽） | 删净；`designId` 过滤注释保留 |
| D8 | 同档 `:11-13` ∥ `:97-100` | 档头 / 函数注的「回收读口」段（reveal 揭值 ∥ 掩蔽） | 收正为「`designId` 过滤单槽；缺省 = 现行清点面逐字零变；零写」 |
| D9 | `thincoder-core/agent-tools/subagent.mjs:152` | `reveal` schema 键（`true = reveal … one slot at a time … masked`） | 删净（参数 schema 无 `reveal` 键） |
| D10 | 同档 `:8` | 档头「design-slots 回收读口——`designId` 过滤 + `reveal:true` 单槽揭值」句 | 删行（历史归 git——D8） |
| D11 | 同档 `:148` | `designId` 描述末句「— REQUIRED with reveal:true」 | 删末句（描述 = 「描述面 / 提示面」表 `subagent.mjs:148` 行建议文本） |

**受影响文件清单（行数口径 = 末行行号）**：

| # | 文件 | 现行行数 | 预计 Δ | 500 软线 | 拆分结论 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/design-slots.mjs` | **305** | ±0（本节面；本批已落地 245 → 305） | 未触 | 不拆 |
| 2 | `thincoder-core/agent-tools/subagent.mjs` | **422** | ±0（本节删除面已落地：`:152` ∥ `:8` 已删、`:148` 已改；现读数含其后其它批次的增行） | 未触 | 不拆 |
| 3 | `thincoder-core/tool-docs/subagent.md` | **44** | −1（→ **43** 实读；`:11-12` 并一；`:10` 行内改） | 不适用（工具描述档） | 不拆 |
| 4 | `thincoder-core/agent/dispatch-gates.mjs` | 151 | 0 | 未触 | 不拆 |
| 5 | `thincoder-vscode/src/agent/tool-table.mjs` | 187 | 0 | 未触 | 不拆 |
| 6 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 673 | ±0（`:50` / `:350` / `:400` 行内改） | 文档·不适用 | 不拆 |
| 7 | `thincoder-core/prompts/persona-engineering.md` | 220 | ±0（`:141` 行内改） | 文档·不适用 | 不拆 |
| 8 | `docs/batches/2026-10-17-token-visibility-simplify.test.mjs`（U-SL1–U-SL14 宿主——批档同目录） | 0（未建） | 新建 **274** 实读 | 不适用（测试档） | 单档 |
| 9 | `thincoder-core/log.mjs` | **214** | ±0（`:21-22` 注释收正——去掉以 reveal 为主体的表述；`SECRET_FORM` ∥ 字段黑名单零动） | 未触 | 不拆 |

测试宿主口径：单元测试档随批档存放（`docs/batches/<batch>-<topic>.test.mjs`），收口删、零留存；U-SL1–U-SL9（清点 / 消费回归）+ U-SL10–U-SL13（直读面）+ U-SL14（删除面机检）同宿一档。

**用例（单元测试档）**：
U-SL1 清点全列（live/expired 双态 + 龄序）∥ U-SL2 批列派生（run 命中 ⇒ basename；缺失 ⇒ `—`）∥ U-SL3 `designIds` 批量（含未知 id no-op 幂等）∥ U-SL4 expired / olderThanDays 选择器。
U-SL5 多选择器 / 空清单 ⇒ 拒 ∥ U-SL6 落盘失败 ⇒ 整体回滚（持久化注入错）∥ U-SL7 消费后同 id spawn 机械拒（不复活——槽文件已删）∥ U-SL8 多槽隔离（消费 A 不动 B）∥ U-SL9 工程模式门外拒。

**直读面 / 删除面用例（需求 F-SL3 回指）**：

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| U-SL10 | 正常 | 无参 ∥ `designId` 过滤 ∥ `designId:''` | 三态逐槽行均含 `designToken=<全串>`（live ∥ expired 同显）；过滤态尾行注 `(filtered by designId)` |
| U-SL11 | 边界 | 槽值不可解析（非 `uuid:epoch` 形） | 该行 `designToken=—`（`ageDays` / `expiresAt` 同 `—`）；其余槽照常出值 |
| U-SL12 | 错误 | `designId` 不在并集视图 | 拒；错误串列在场 designId 全集（空账本 ⇒ `(none)`） |
| U-SL13 | 边界 | `logEvent` + 测试缝：`head` 含 token 值形串 | 落盘内容在值形前截断——日志零 token 值（`log.mjs` `SECRET_FORM` 在案，零改） |
| U-SL14 | 机检（删除面） | 实现落定后的两档全文 | 两档 `grep -c reveal` = **0**（`grep -c reveal thincoder-core/agent-tools/design-slots.mjs` ⇒ `0`；`grep -c reveal thincoder-core/agent-tools/subagent.mjs` ⇒ `0`）∧ 参数 schema 无 `reveal` 键（同上 = 0 即证）；仓库根跑 |

**关键决策**：

| KD | 决策 |
|---|---|
| KD-SL1 | 清点 = 新只读 action（`design-slots`） |
| KD-SL2 | 「批」列 = 槽文件批次旁列（§10）优先、`_advisorRuns.docSetKey` 反查兜底 |
| KD-SL3 | 批量选择器恰一 / fail-closed |
| KD-SL4 | 消费 = 单 persist / 整体回滚 |
| KD-SL5 | 清点行**恒携** `designToken`（直读；畸形 ⇒ `—`；过期照列）——不设取用开关 ∥ 不按值形态取舍 ∥ 不限单槽（用户 2026-10-17 裁「没必要把 token 藏起来，agent 要就告诉他」） |
| KD-SL6 | 令牌列置行尾——日志 `head` 在值形处截断 ⇒ 其余列在日志里仍完整、令牌值不入日志；多槽清单在日志只余首行（已知代价） |
| KD-SL7 | 取用提示不入槽行输出（用法归描述面单点——D2） |

## 10. 凭证带批次与收口自动消费

**机制现状（本节 = 目标态）**：每个 design 槽在 settle 时记下它属于哪一份批次档；批档的收口（`close` ∥ `status` 写 §1「已收口」两条通路）在写状态行之前，把该批名下的全部槽消费掉。

**为什么**：dispatch 写门的判据是「存在任一活槽」（`thincoder-core/token-ttl.mjs:275` `anyLiveDesignSlot`），而槽只在收尾被 `consume-design` 消费——模型不执行这条纪律，槽便跨批滞留，门对之后任何一批都等同于不存在。两条合起来成立：带批次让「消费谁」唯一确定，收口自动消费让「有活槽」在任一时点 ≈「有未收口的批」。因此 `thincoder-core/agent/dispatch.mjs:99-102` 的判据**不动**。

**批次标识的来源（settle 时刻，零新输入）**：复用清点面既有的派生——设计评审 run 的 `docSetKey`（`thincoder-core/agent-tools/review-facts.mjs:25`；值 = 被审文档经 `normAbs` 归一的绝对路径集 JSON）中 `batches/` 段档，取**绝对路径**。

实现 = `batchAbsPath`（`thincoder-core/agent-tools/design-slots.mjs:100`）——与 `batchBasename`（同档 `:81`）同一 `lastIndexOf("batches")` 判据，返回整串；文档集含两份不同批档 ⇒ 归属不唯一 ⇒ 不猜（`null`）。判据句：评审文档集含批档 ⇒ 该槽归属该批；不含（或路径不可解析 ∥ 归属不唯一）⇒ 归属 = 无（不猜）。

**写面（settle 同拍，`thincoder-core/agent-tools/design-token.mjs:176-182`）**：派生有值 ⇒ 写该 designId 的旁列行；派生为无 ⇒ **删**该 designId 的既有旁列行。分支出处 = 同一 designId 的复评：评审实例关后（`design-token.mjs:188` `run.open = false`）再用不同 `documents` 评审同一 designId，旧归属若不删，新槽会继承上一轮的批次 ⇒ 收口消费掉本不该消费的授权。

**分支出处（「不含批档 ⇒ 归属 = 无」）**：该降级今天已在生产走——清点面 `batchOf`（`thincoder-core/agent-tools/design-slots.mjs:60`）对无批档的 run 返回 `—`，需求 F-SL1 边界逐字登记（`docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md:25`）。

复现：以单份设计档为 `documents` 跑一次设计评审，`subagent` `action:'design-slots'` 该槽行 `batch=—`。

**存储形**：槽文件新增**旁列** `engDesignTokenBatches: {designId: <批档绝对路径>}`，与 `engDesignTokens` 并列；token 值形 `<uuid>:<expiryMs>` **零改**（`tokenExpiryMs` 的「恰两段」判定、签发 / 校验 / 门禁严格相等 / 日志 `SECRET_FORM` 均不受影响）。内存侧 `agent._engDesignTokenBatches`（Map，designId → 批档绝对路径），与 `_engDesignTokens` 同拍读写。

**保存 / 合并路径（旁列必须对位的三处）**：序列化 = `engTokenSlotFields`（`thincoder-core/token-ttl.mjs:117`）增一字段 ⇒ `saveSession`（`thincoder-core/session.mjs:141` 展开）自动携带。

落盘 = `persistEngTokens`（`token-ttl.mjs:335-340`——`engTokenSlotFields` 取字段后逐字段复制，旁列行 `:339` 同处落盘）；保存并集 = `mergeEngTokenBatchesForSave`（`thincoder-core/session-slot-write.mjs:207`）。

并集规则：沿用 `mergeEngTokensForSave` 的「槽独有项保留」半边；同 key 冲突**以新写者胜**——旁列值是路径，无 mint 时刻可比，不比 `expiresAt`。恢复面 `restoreEngTokens`（`token-ttl.mjs:139`）同拍读入旁列。

**写面如实登记**：

- `mergeEngTokenBatchesForSave`（`session-slot-write.mjs:207`）与既有 `mergeEngTokensForSave`（同档 `:184`）**同形**——纯函数；核侧 `thincoder-core/session.mjs:184` 为整档覆盖写，两函数在核内均无调用点。
- 既有的 tokens 版只有端面一个消费者（`thincoder-vscode/src/extension/panel-session-write.mjs:109`）；旁列版端面尚未接线。
- ⇒ A6（U-BG10）只验纯函数面：「核内保存会不会写丢归属」在本形态下不发生（`session.mjs:141` 展开的就是内存快照，旁列随 `engTokenSlotFields` 一并入档）。两个并集函数是端面 / 防御面预留，与本批要消的窗口无因果关系。

**射程划分（旁列 ≠「不为恢复便利扩展机制」）**：需求档 §5 末条已明写「批归属的旁列（F-D7）不属本条射程」（`docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md:54`）——旁列承载**归属**（让写门判「本笔改动属于哪一批」），不承载**恢复**（不为把过期 ∥ 已消费凭证捞回来）。该裁定的正文单源在需求档，本节不复述（D2）。

**缺失时仍是如实降级**：旁列读不到（旁列启用前签发的旧槽）⇒ 清点「批」列照旧 `—`（F-SL1 既有降级）、收口不消费该槽并如实点名计数（下「无归属槽」）——单一降级层级，不新增态。

**收口自动消费（单源，两通路同调）**：`consumeBatchDesignTokens(agent, abs)` 落 `thincoder-core/agent-tools/batch-lifecycle.mjs`；本体四步 = ①非工程模式 ⇒ no-op；②反查 = 内存 Map ∪ 旁列读入，取该 `abs` 名下的 designId 集。

③空集 ⇒ no-op；④调既有 `executeConsumeDesignAction({ designIds }, { agent })`（`thincoder-core/agent-tools/design-slots.mjs:183`）——单次落盘 + 内存整体回滚 + 逐枚回执全复用，不新写落盘 / 回滚逻辑（KD-BG6）。

- **读形（收口面严格 ∥ 清点面宽容）**：旁列读的单源 = `readEngTokenBatchesFromSlot(agent, { strict })`（`thincoder-core/token-ttl.mjs:221`；槽号解析在 `try` 之外 `:224`）。判据两级：内层按 `readFileSync` 的 `err.code` 分判——`ENOENT` ⇒「没有」（`:233` 返回 `null`），其余 I/O 错原样上抛、交外层（`:234`）；外层按读形处置——宽容形返回 `null`（`:245`；清点面，`unionBatches` 缺省 `thincoder-core/agent-tools/design-slots.mjs:47` 照旧如实降级 `—`），严格形抛（`:242-243`，携槽文件路径 + 底层消息；`unionBatches(agent, { strict: true })` 由 `consumeBatchDesignTokens`（`thincoder-core/agent-tools/batch-lifecycle.mjs:558`）传入）。`JSON.parse` 失败落外层，按同一分形处置。
- **「没有」的三种输入**（两形同 ⇒ 空集，走「③空集 ⇒ no-op」）：无槽号 ∥ 槽文件不存在（`ENOENT`）∥ 文件可读但无 `engDesignTokenBatches` 字段。**不用 `existsSync` 兜底**——它把权限错也吞成「不存在」，正是收口面必须拒的那一类。
- **读不到的处置**：上述三种以外的 I/O 错（`EACCES` ∥ `EISDIR` ∥ `EIO`…）∥ 解析失败 ⇒ 严格形抛 ⇒ **close 被拒**、档零字节变、可重试。分界理由：「读不到」与「没有」是两件事——宽容形对两者返回同一个 `null`，把前者当后者，收口就落成「已收口而凭证仍在」，正是 F-D8 要消的窗口；失败面按「无法判定归属 = 无法证明清账」处理（FAIL-CLOSED 方向只更严）。
- **槽号解析层同判（manifest 层）**：`_slot` 未钉时，槽号来自 manifest 的 `active`（`currentSlotNoReadOnly`，`thincoder-core/token-ttl.mjs:184`；`loadManifest` 调用在 `:187`）。这一层若走宽容形，manifest 不可读就被读成「无槽号」⇒ 严格形返回空集、close 照常落「已收口而凭证仍在」，与旁列同一个洞。故同判：**manifest 文件不存在（`ENOENT`）⇒ 无槽号（合法缺省）；manifest 在盘但读失败 ∥ 解析失败 ⇒ 抛**（`loadManifest` 的 `catch` 在 `thincoder-core/session-slots-manifest.mjs:121`）。
- **manifest 严格形的落法** = `loadManifest(cwd, { strict = false } = {})`：与 `readEngTokenBatchesFromSlot` 同一两形先例（同一读函数、同一判据、缺省宽容）——strict 形 `ENOENT` ⇒ 默认空账本，其余错 ⇒ 抛（携 manifest 路径 + 底层消息）。**被拒的另一条路** = 在 `token-ttl.mjs` 里另写一个只读 `.active` 的严格读函数：那会把「没有 vs 读不到」判据落到第三处（`loadManifest` 宽容形 ∥ 旁列读 ∥ manifest 严格读），三处必漂，且 manifest 形状出现第二个读者。
- **manifest 层边界与代价**：文件可读而 `active` 缺席 ∥ 非整数 ⇒ 无槽号（合法缺省——「读到了，说没有」）。代价 = `loadManifest` 从一个读法变两形，后续调用点须自选——规则 = 展示 / 尽力面用缺省宽容形，收口门面用 strict；现行全部调用点缺省零改。新面登记 = `thincoder-core/session-slots-manifest.mjs`（264 行，247 → +17）。
- **落地状态**：两形已落——`loadManifest(cwd, { strict })`（`thincoder-core/session-slots-manifest.mjs:113`）∥ `currentSlotNoReadOnly(agent, { strict })` 透传（`thincoder-core/token-ttl.mjs:184`）。`close` ∥ `status §1→已收口` 两通路经 `unionBatches(agent, { strict: true })` 一路到底：manifest 在盘但读失败 ∥ 解析失败 ⇒ 两通路被拒、档零字节变、可重试。
- **未单独设例的一类（如实登记）**：manifest 位的非 `ENOENT` I/O 错（`EACCES` ∥ `EISDIR`）没有独立用例——同一条判别式（`err.code === "ENOENT"`）在槽文件位已有 `EISDIR` 证据（U-BG11 支二），manifest 位再补一支只是同一判据的第二处取样，不增加信息。manifest 位的「没有 vs 读不到」由 U-BG14 ∥ U-BG15 守；`active: null`（非整数支）同属此列——与「缺席」同一表达式（`thincoder-core/token-ttl.mjs:188` 的 `Number.isInteger`），不单独设例。

- **调用点（两处，均在写状态行之前）**：`close` 通路 = `closeBatchRecord`（`batch-lifecycle.mjs:507`）内——文档机检门 `:519-520`（`REFUSED` ∥ `ERROR` ⇒ throw）之后、消费 `:522`、`updateSectionStatusLine(src, 1, …)` `:524` 之前；`status` 通路 = `statusBatchRecord` 内——机检门 `:480-481` 之后、消费 `:483`、`updateSectionStatusLine(src, seg, …)` `:484` 之前。
- **与文档机检门的先后**：门是两个函数体内部的语句、先于写盘 ⇒ 消费位 = 「全部拒因之后、写盘之前」。这与既有 `reanchorOnClose`（写盘之后）相反——位次本身就是本节的机制（KD-BG3）。
- **匹配**：旁列值与 `abs` 两侧都是 `node:path` 解析后的绝对路径；比较前分隔符归一，`win32` 下不区分大小写。
- **分支出处（匹配归一）**：`docSetKey` 的 `normAbs`（`review-facts.mjs:19`）对绝对输入**原样保留**、不归一分隔符，而 `documents` 同时受理项目根相对形与绝对形（`test/RTM.md` 6-1 ∥ 6-3 的入口写法）⇒ 同一批档在 `docSetKey` 里可带 `/` 或 `\`；Windows 路径大小写不敏感是宿主事实，不是猜测。
- **目标集**：该批名下全部槽（评审槽与修轮槽各按自己 designId 归属同一批档）。
- **失败**：消费核抛（内存已整体回滚）⇒ 原样上抛、**close 被拒**（回执点名原因；档零字节变、可重试）。理由：「已收口而凭证仍在」正是本节要消掉的窗口，把它降级成一句回执 = 把结构保证退回纪律。
- **幂等 / 无匹配**：无匹配 ⇒ no-op。分支出处 = 重开后再 close 走这条（重开通路把 §1 写回「进行中」，`batch-lifecycle.mjs:466-471`；再 close 时该批槽已被上一轮消费）。
- **普通模式**：no-op，不报错。分支出处 = `batch` 的 close 面向两模式（模式位执行期实读，`batch-lifecycle.mjs:414`）；普通模式批无设计槽——槽只在工程模式评审 settle 时铸（同门判据 `design-slots.mjs:152-154`）。
- **回执**：单列 `[design tokens]` 一行（消费枚数 ∥ 留槽无归属枚数点名）；标签形与既有 `[ledger reanchor]`（`batch-lifecycle.mjs:604`）∥ `[doc-check gate]`（`batch-gate.mjs:188`）一致（换行 + 方括号前缀）。

**无归属槽（两类，敞口如实划界）**：①旁列启用前签发的旧槽；②上线后文档集不含批档的评审铸出的槽——谁铸出 = 任何 `documents` 不带批档的设计评审（评审受理面只判「项目内现存 `.md`」，`review-facts.mjs:56-58`，没有「必带批档」的强制面）。

后果：闸被这类槽撑开至其 TTL（`TOKEN_TTL_DEFAULT_MS` = 7 天，`thincoder-core/agent-tools/design-token.mjs:40`）。观测量 = `subagent` `action:'design-slots'` 输出里 `batch=—` 的行数（一行一槽，可直接数）。收口不消费它们，回执点名计数。

**因此「活槽 ≈ 有未收口的批」是近似**：偏差 = 上述无归属槽，上限 = 7 天 TTL。旧槽的处置：不消费、不迁移、不猜归属——批归属猜错，消费掉的是别批的授权（业务结果被改），比留下一个可解释的滞留槽更坏；回执如实点名其数量，用 `consume-design expired:true` 清。这是**如实降级**，不是兜底放行——「哪些槽被消费」的判据与实际结果完全一致。

**已知限制（接受的风险，非遗漏）**：收口面同一拍两种读形——旁列走严格形，token 侧仍走宽容形（`unionSlots` → `readEngTokensFromSlot`，`thincoder-core/token-ttl.mjs:195-207`；消费核 `executeConsumeDesignAction` 同源取用）。

触发 = 槽文件在两次相邻读之间转为不可读（并发改权限 ∥ 外部替换）；影响 = 旁列读成功而槽表读回空 ⇒ 回执「消费 0 枚」而槽仍在盘、写门继续放行至 TTL；不误消费它批、不回滚、不落「已收口而槽被删」。接受理由 = 非确定性竞态窗口（需外部在两次相邻读之间动手），同拍单读须同时改造消费核的槽读取形——超出本节（KD-BG9）。

**与轻通道（`lightRoundOpen`）的面界**：两者都是绕过全链的合法通路，判据互不相干——轻通道看「轮档 + 台账行双在盘」，本节看「槽归属于哪一批」。本节不改轻通道判据，轻通道也不改凭证消费；同一笔代码写两条通路都成立时任一成立即放行（既有语义，零改）。

**最相近先例**：同批族 F-SL1 清点面（`thincoder-core/agent-tools/design-slots.mjs:150` 起）——对齐 = 同一批归属派生、同一槽文件权威台账、同一「落盘失败 ⇒ 内存回滚 + 抛」形（`design-slots.mjs:286-296`）；偏差 = ①归属从显示用升为持久化 + 消费判据 ②新增一次 settle 期写（旁列）。偏差理由：显示面跨重启降级为 `—` 是既知代价，消费判据不能建立在「不可得即 `—`」上——判据要确定性，故须持久化。

**公开源核查**：`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`（本轮 `manifest read` 实读）⇒ 无公开源档可查（单仓声明）；核内最近先例 = 上述 F-SL1 批列派生 + F-D6 链终消费。

**新名字的三问答案**（落地名一律沿既有件，无一件新造形态）：

| 名字 | 三问答案 |
|---|---|
| `engDesignTokenBatches` | `existing: thincoder-core/token-ttl.mjs:117 engTokenSlotFields · name: "engDesignTokens" · consumers: session.mjs:141 saveSession ∥ token-ttl.mjs:335-340 persistEngTokens` ⇒ 对齐（同族槽字段、同序列化点）；偏差 = 新增一个键（无既有键承载批次） |
| `_engDesignTokenBatches` | `existing: token-ttl.mjs:160 agent._engDesignTokens（Map，同拍读写）· consumers: token-ttl.mjs ∥ design-slots.mjs:36 unionSlots` ⇒ 对齐（同 Map 形态、同生命周期）；偏差 = 新增一张表 |
| `readEngTokenBatchesFromSlot` | `existing but unusable: token-ttl.mjs:192 readEngTokensFromSlot · failed on: 字段名硬编码（:199-202 只返回 data.engDesignTokens，不读旁列）` ⇒ 偏差 = 同形兄弟函数，同一轻读形（无 TTL 过滤、不改盘） |
| `consumeBatchDesignTokens` | `existing: thincoder-core/agent-tools/design-slots.mjs:183 executeConsumeDesignAction · designIds 选择器已存在（:191-198）` ⇒ 复用（KD-BG6）；本名只剩「按批反查 designId 集」的薄壳 |
| 回执标签 `[design tokens]` | `existing: batch-lifecycle.mjs:604 [ledger reanchor] ∥ batch-gate.mjs:188 [doc-check gate]`（换行 + 方括号前缀段）⇒ 对齐同形；偏差 = 新前缀（无既有段承载凭证消费） |

**集成测试设计（从 `test/RTM.md` 起读）**：本改动改的是「收口」这一业务动作的可观测结果——收口成功即该批凭证不再放行写产品码；收口被拒即凭证仍活、状态行未变。逐故事结论：

| 面 | 结论 |
|---|---|
| 破行（既有用例断言的业务结果被改） | 无。故事 7（7-1 ∥ 7-2 ∥ 7-3——`batch close` 机检门）的夹具是普通模式项目、无设计槽 ⇒ 消费步 no-op，三条断言（放行 ∥ 范围外档不判 ∥ 范围内悬空拒）逐字不变；故事 8 ∥ 9 走 create / 建档，不经收口。 |
| 冗余行 | 无。 |
| 缺失行 | 一处：CLI 端新故事 10「收口即清账」两行（编号先定，用例标题逐字用同一编号）。manifest 层严格读（本轮裁定）不新增集成行：它的可观测结果与 10-2 同族（close 被拒、档不变），触发条件是宿主文件损坏而非业务场景，由 U-BG14 在单测面守。 |

| 编号 | 怎么做 | 怎么算通过（业务可观测） | 交互组件 | 进入口 | 回指 |
|---|---|---|---|---|---|
| 10-1 | 工程模式夹具里，让一次设计评审的 `documents` 带上批档（签发一个槽），再调 `batch close` 收该批 | close 回执含 `[design tokens]` 且点名消费 1 枚；随后同 designId 的 eng-coder spawn 被机械拒；`design-slots` 里该槽不在 | `batch-lifecycle.mjs` 收口通路 ↔ `design-slots.mjs` 消费核 ↔ 槽文件 I/O | 父侧经 `batch` 工具收口（工程模式） | F-D7 ∥ F-D8 |
| 10-2 | 同一夹具，把 `persistEngTokens` 注入为抛错后再 close | close 被拒且回执点名消费失败；§1 状态行字节不变；槽仍在盘（内存已回滚） | 同上 | 同上 | F-D8 |

落点：两行编号与文字落 `test/RTM.md`、用例落 `test/integration/batch-close-token-consume.test.mjs`（实现轮由 eng-coder 落，见下表）。

**受影响文件清单**（行数口径 = 末行行号；本轮实读）：

| # | 文件 | 现行行数 | 本批 Δ（改前 → 现） | 改动面 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/design-slots.mjs` | 305 | +60（245 → 305） | 批档绝对路径派生出成可复用函数；清点「批」列改读旁列（注册表兜底）；`unionBatches` 增严格读开关（收口面用）；`executeConsumeDesignAction` 零改（被收口通路复调） |
| 2 | `thincoder-core/token-ttl.mjs` | 370 | +64（306 → 370；严格读 +18 ∥ 槽号解析外提 +7） | 旁列序列化（`engTokenSlotFields`）+ restore 读入 + `readEngTokenBatchesFromSlot` 两形（内层 `ENOENT` 短路 + 外层按读形 + 槽号解析提到 `try` 之外）+ `persistEngTokens` 一字段复制 |
| 3 | `thincoder-core/agent-tools/design-token.mjs` | 200 | +16 | `settleDesignReview` 同拍写 / 删旁列（失败 ⇒ settle 失败，与 D1 同语义） |
| 4 | `thincoder-core/agent-tools/batch-lifecycle.mjs` | 612 | +56（556 → 612） | `consumeBatchDesignTokens` 薄壳 + 两通路调用点 + 回执段 + 严格读接入 |
| 5 | `thincoder-core/session-slot-write.mjs` | 260 | +20 | `mergeEngTokenBatchesForSave`（并集；核内零调用点——见「写面如实登记」） |
| 6 | `thincoder-core/session-slots-manifest.mjs` | 264 | +17（247 → 264；实测反超预估 ≈257） | `loadManifest(cwd, { strict })` 两形：缺省宽容（现行全部调用点零改）/ strict 形 `ENOENT` ⇒ 空账本、其余错 ⇒ 抛（manifest 层同判） |
| 7 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | 本档 | 本节 | 设计单源 |
| 8 | `test/RTM.md` | 148 | 新故事 10 两行 | 集成索引（编号先落；另含前序批的故事 8 ∥ 9） |
| 9 | `test/integration/batch-close-token-consume.test.mjs` | 158 | 新建（本批） | 集成用例 10-1 ∥ 10-2 |
| 10 | `docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs` | 486 | 新建（随批删；实测 **486**——440 → 486 为 U-BG15 落成后读数，预估 394） | 当批单测 U-BG1–U-BG15 |

行数与坐标 = 本轮实读（行号口径 = 末行行号）；实施轮的行号随动——判据以内容机检为准（U-BG9 ∥ U-SL14 同口径），行号只用于定位。

**跨 500 软线登记与拆分计划**：六档产品码里只有 `batch-lifecycle.mjs` 越线（556 → 612）；`token-ttl.mjs` 306 → 370、`design-slots.mjs` 245 → 305、`session-slot-write.mjs` 240 → 260、`design-token.mjs` 184 → 200、`session-slots-manifest.mjs` 247 → 264 均未触线；六档均未触 800 硬限。

`batch-lifecycle.mjs` 已越 500 软线：**拆分触发条件** = 本批之后任一改动触及该档时先拆，或任一时刻行数 ≥ 700（硬限 800 前留 100 行余量）。

**切法** = 收口链（`closeBatchRecord` ∥ `statusBatchRecord` 的收口合流 + `reanchorOnClose` + 链完整性门调用面）整体搬进新档 `thincoder-core/agent-tools/batch-closeout.mjs`，`create` ∥ `append` ∥ `status` 的段写面留在原档；两档共享的读档 / 解析工具另置 `batch-read.mjs`。

本批不拆的理由：本次只加一个薄壳与两个调用点，拆分会把本批的验收面与一次纯搬移混在一轮。

**用例（当批单测 U-BG 组）**：

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| U-BG1 | 正常 | settle 一份文档集含批档的评审 | 旁列出现 `{designId: <批档绝对路径>}`；token 值形不变（仍 `uuid:epoch`） |
| U-BG2 | 正常 | close 该批 | 该批全部槽移出槽文件；回执点名消费枚数；§1 → 「已收口」 |
| U-BG3 | 边界 | 同批两枚槽（评审 + 修轮） | 一次 close 全消费；它批槽零动 |
| U-BG4 | 边界 | 旧槽（无旁列）在场 | close **不消费**它；回执点名「N 枚无归属」；槽仍在盘 |
| U-BG5 | 错误 | `persistEngTokens` 注入失败 | close 被拒（§1 状态行字节不变）；内存槽回滚、可重试 |
| U-BG6 | 边界 | `status` §1 → 已收口（第二通路） | 与 close 同效消费 |
| U-BG7 | 边界 | 普通模式批档收口 | no-op，不报错 |
| U-BG8 | 边界 | 评审文档集不含批档 | 旁列无该条目；清点「批」列 = `—`（不猜） |
| U-BG9 | 机检（内容判据） | 四段判据文本：`dispatch.mjs` 放行条件句 ∥ `anyLiveDesignSlot` 判据体 ∥ `TOKEN_TTL_DEFAULT_MS` 行 ∥ `consume-design` 选择器句 | 四段逐字等于改动前快照（期望串写死在测试里；不靠 git） |
| U-BG10 | 边界（合并 · 纯函数面） | 合并函数五条断言：来参未携该字段 ∥ 来参空快照 ∥ 并集 ∥ 同 key 冲突 ∥ 两端皆空（槽侧已有 `{A: 批1}`） | 槽独有项保留（`{A: 批1}` 仍在）∥ 同 key 新写者胜 ∥ 两端皆空 ⇒ `null`——核内保存面不经过该函数（见「写面如实登记」） |
| U-BG11 | 错误（读不到） | 两支：① 槽文件截断（`JSON.parse` 失败）∥ ② 槽位换成目录（`EISDIR`，非 `ENOENT`）后 close 该批 | close 被拒并点名读失败（支二另断言拒因不含 `ENOENT`——非 ENOENT 的 I/O 错不得判成「不存在」）；§1 状态行字节不变；槽文件字节不变（零消费）；恢复可读后同一 close 成功 |
| U-BG12 | 边界（「没有」） | 干净会话：无槽文件 | close 照常收口；回执「消费 0 枚 · 留槽无归属 0 枚」；不铸槽文件 |
| U-BG13 | 边界（旧槽形） | 槽文件在盘、有槽表、无 `engDesignTokenBatches` 字段 | 空集不抛；消费 0 枚 · 留槽无归属 1 枚；旧槽零消费；不凭空铸旁列 |
| U-BG14 | 错误（manifest 层读不到） | 两支（`_slot` 未钉）：① manifest 在盘但截断 ② 干净会话：manifest 不存在（从未创建） | ① close 被拒、§1 字节不变、零消费、修复后同一 close 成功 ② 无槽号 = 合法缺省 ⇒ close 照常收口（「没有」≠「读不到」） |
| U-BG15 | 边界（manifest 读到了、说没有） | manifest 在盘且合法，但 `active` 缺席（`_slot` 未钉） | close 照常收口（不抛）· 零消费（无槽号 ⇒ 该批槽集为空）· 回执点名「消费 0 枚」· manifest 不被本通路改写（`batch-lifecycle.mjs` 内 `saveManifest` 零命中）· 探针反向验证：`thincoder-core/token-ttl.mjs:188` 改成 `1` ∥ `0` ∥ `2` ∥「缺 `active` 即抛」四种错法各使本例如红（还原后绿） |

**验收（回指批次档 §2 条目）**：

- A1 = U-BG1 + U-BG8（归属持久化、跨重启可读）
- A2 = U-BG2 + U-BG3 + U-BG6（两通路都消费本批全部槽，他批零动）
- A3 = U-BG4（旧槽不误伤、不猜、回执可见）
- A4 = U-BG5 + U-BG11 + U-BG12 + U-BG13 + U-BG14 + U-BG15（读形两向都对：读不到 ⇒ close 不落、档零字节变；「没有」⇒ 照常收口；manifest 层同判——文件不存在 ∥ `active` 缺席）
- A5 = U-BG9（放行条件句 ∥ 活槽判据体 ∥ TTL 常量 ∥ `consume-design` 选择器句逐字零变）
- A6 = U-BG10（并集规则的纯函数面；核内保存面未接该函数——见「写面如实登记」）

**验证命令**：`node --test docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs`（当批单测，本批的验收命令）；集成用例 `test/integration/batch-close-token-consume.test.mjs` 由父侧收口一并跑，不入本批验收命令。

**关键决策记录**：

| KD | 决策 | 被拒方案与理由 |
|---|---|---|
| KD-BG1 | 批次进**槽记录旁列** | ① token 值形三段——`tokenExpiryMs` 判「恰两段」，三段即 null ⇒ 全部槽失效、门永久关闭，且波及签发 / 校验 / 门禁相等 / 清点 / 日志形 / 提示词 ② 只存内存注册表——重开 / 重进后降级为 `—`，消费判据失去确定性 |
| KD-BG2 | 批标识 = **批档绝对路径** | basename——同名批档跨目录 / 跨仓误配；绝对路径在 `docSetKey` 里本就有 |
| KD-BG3 | 消费位 = **写状态行之前**，失败拒 close | 写后消费 + 回执报警——把「已收口而凭证仍在」变成可能的终态，正是本节要消的窗口 |
| KD-BG4 | 旧槽**不猜归属**、不迁移 | 按 designId 反查批档——该映射在盘不存在；猜错即消费别批授权 |
| KD-BG5 | `consume-design` 不加按批选择器 | 批归属消费 = 收口自动动作；再加手动入口只增面 |
| KD-BG6 | 收口消费**复用** `executeConsumeDesignAction({designIds})` | 在 `batch-lifecycle.mjs` 里另写落盘 + 回滚——同一份「单次 persist / 整体回滚 / 逐枚回执」逻辑写第二遍，两处必漂 |
| KD-BG7 | 旁列走**保存并集**（槽独有项保留） | 旁列按普通字段整覆盖——忙时保存即写丢归属 ⇒ 收口 no-op ⇒ 凭证留存（U-BG10 就是这条的反例面） |
| KD-BG8 | manifest 层按同一「没有 vs 读不到」判据分判，严格形落在 `loadManifest(cwd, { strict })` | 在 `token-ttl.mjs` 另写只读 `.active` 的严格读函数——判据落第三处、manifest 形状出现第二读者，三处必漂 |
| KD-BG9 | 同拍两读形（旁列严格 ∥ token 侧宽容）**不收敛**，按已知限制登记 | 同拍单读——须改造消费核 `executeConsumeDesignAction` 的槽读取形（超出本节）；触发条件是非确定性竞态（外部在两次相邻读之间改文件可读性） |

**边界（不做）**：不改 `thincoder-core/agent/dispatch.mjs:99-102` 的放行条件 · 不改 `anyLiveDesignSlot` 判据语义 · 不改 TTL · 不放宽「无凭证 ⇒ 拒」（只可能更严） · 不改 `consume-design` 语义 · 不跨会话槽消费（只消费本会话槽内该批的槽，别会话凭证靠 TTL） · 不改轻通道判据 · 不做时间戳等其它字段扩展 · 不加「工程模式评审必带批档」的强制面（无归属槽的敞口按上文如实划界）。
