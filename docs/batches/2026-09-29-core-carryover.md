# 2026-09-29 · core-carryover
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 20:42 直令——池面转批：核收尾族（#638 ∕ #641 ∕ #645）。
> 台账 = #638 ∕ #641 ∕ #645（核收尾族 · 归批）。前情 = 引擎面批 ∕ enddiff 批 ∕ core-env 批转出。
## §1 讨论（主 agent）

**状态行**：已收口 2026-09-29

- **来源** = 用户 20:42 直令；触发 = 池面转批——核收尾族三条。
- **条目**：**#638**（核面脏值下游无类型门——`token-window.mjs:151-152 ∕ :161` · `agent-host.mjs:148` 三处裁）· **#641**（两休眠缝 `configureEditReceipt` ∕ `configureGitApproval` 重分类 ∕ 退场裁定 + 第三缝 `setWaitForConditionSource` 并单）· **#645**（核清除形扩族：数值键 `null` 语义放行 ∕ 主侧写链——`settings.mjs:141-145` 类型表）。
- **口径**：核面（`thincoder-core/**`）；#641 若裁「退场」需携落点清单（`CORE-UNIFICATION.md` §2.13.3 ∕ §2.13.4 + `TOOLS.md` §6.11）。
- **边界**：不触 desktop/vsc 码面（#645 的「主侧写链」= 桌面侧联动——设计给接口约定，实施随批分舱）。
- **授权** = 13:52 ∕ 17:02 全权。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（三条逐条出稿（#638 ∥ #641 ∥ #645）+ 三缝裁定候选在册）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

- **#638**（核面脏值下游无类型门三处）：选定 = **adoption 边界归一（主修）+ 查表族全性（防御）双落点**（§2.2）。
- **#641**（两休眠缝裁定 + 第三缝并单）：设计倾向 = **两缝退场（B）** ∥ **第三缝并单裁 + 保留重分类**（§2.3；候选对比全表在册——裁定点见 §2.8）。
- **#645**（核清除形扩族）：选定 = **`_checkKnownKeyValue` null 放行面扩 number/boolean + 写形归一「null ⇒ 删键」**（核工具与桌面主侧同形）（§2.4）。
- 本批 = **设计轮**：产品码零触 · 需求档零触 · 不发起评审。测试面 = 批内件（随实施轮落——本设计给 file 级落点与判据，§2.6 ∕ §2.7）。

### 2.2 #638 设计（核面脏值下游无类型门）

#### 2.2.1 现状实读（本轮实核 · file:line）

| # | 环节 | 实读 | 判 |
|---|---|---|---|
| ① | 脏值落地 | `session-lifecycle.mjs:170` `slotModel = data.activeModel \|\| slotProvider.model`（非串真值透传）→ `:173` `agent.activeModel = slotModel` → `:175` `agent.provider.model = slotModel` | 非串脏值入两字段 |
| ② | 同档守卫（在盘） | `:179` 阈值重算门（`typeof agent.provider.model === "string" && …`）· `:188` 档位块门（同形） | 「类型脏载不中断恢复」口径已立（#441④） |
| ③ | 命名三面落点链 | `token-window.mjs:151-152`（`contextUsage`：`resolveCompactThreshold→providerSpec` ∕ `providerSpec(agent?.provider).context`）——经 `context.mjs:278`（`compressIfNeeded`；调用面 = `agent/run-stages.mjs:72/:81` 共享 run stage，常规触达）+ `agent-tools/context.mjs:64`（stats 面）· `token-window.mjs:161`（`historyPercent`）· `thincoder-desktop/src/main/agent-host.mjs:148`（`postUsage→historyPercent`；静态可达） | 非串 model ⇒ **TypeError 抛** |
| ④ | 抛点 | `model-specs.mjs:261`（`lookupSpec` `(model ?? "").toLowerCase()`）· `:280`（`warnUnknownModel` 同形） | 本轮直调实证（下） |
| ⑤ | 同类面（本轮扩扫所得 · 原条未列） | `session-lifecycle.mjs:383`（`sessionReading` 同款 `data.activeModel \|\| entry.model` 合并；桌面消费 `src/main/session-slots.mjs:157`）· `config.mjs:139`（`resolveEnableThinking` `(provider?.model ?? …).toLowerCase()`——`provider/core.mjs:220` 请求构建触达）· 直调 `specForModel(agent.provider.model)` 十余面（`agent/turn-loop.mjs:187` · `auto-think.mjs:66` · `generate-title.mjs:44` · `provider/rate.mjs:89` · `provider/responses.mjs:169` · `agent/record-results.mjs:51` 等） | 同一缺陷类（下游无类型门）；散点不可枚举防御 |
| ⑥ | 直调实证（本轮实跑） | `providerSpec({model:42})` ⇒ `TypeError: (model ?? "").toLowerCase is not a function`（42 ∕ true ∕ {} 三型同抛）；`historyPercent([], {model:42})` 同抛；串值基线 `providerSpec({model:"glm-4.6"}).context === 128000` | 抛成立 ∥ 串零回归 |

- **上游已归一面（旁证）**：config 侧 `config.mjs:283-286`（`providers[].model` 非串/空 ⇒ 归一删除）· VSC 侧 `panel-turn-stages.mjs:53`（`typeof slotData.activeModel === "string" && … ? … : null`）⇒ **权威入脏口 = 会话槽数据经核 `applySession`**（CLI ∕ 桌面同走——桌面 `session-io.mjs:25`）。

#### 2.2.2 候选对比（含「不做」支）

| 候选 | 内容 | 判 |
|---|---|---|
| A 消费点逐点防御 | 命名三处各加判型门 | **拒**：⑤ 同类面十余处散点（直调 `specForModel`）——逐点必漏 + 第二份判据（违单点 ∕ 单源） |
| **B adoption 边界归一（主修）** | `:170` ∕ `:383` 两站点归一：非串 = 未登记 ⇒ 回退渠道模型（镜 `:179` ∕ `:188` ∕ VSC `panel-turn-stages.mjs:53` 同形） | **选**：脏值不入状态；阈值重算恢复可达（`switched` 支重达）；口径贯彻到消费面 |
| **C 查表族全性（防御单点）** | `model-specs.mjs:260-261 ∕ :279-280` 非串归一空串（未登记 ⇒ DEFAULT_SPEC · 零警告——与 `providerSpec` 文档句「keeps the function total」一致，消 doc/impl 相抵）+ `config.mjs:139` 同类面并修 | **选**：覆盖全下游（含 ⑤ 扩扫面与命名三面）；单点收口 |
| D 不做（维持现状） | 登记为边界 | **拒**：脏载 ⇒ 下一常规压缩检查点即抛 ⇒ 恢复后回合不可用——与 #441④ 已立口径相抵；静态可达已证 |

**选定 = B + C（双落点；C 含 `config.mjs:139`）。**

#### 2.2.3 落点（file 级）

| 档 | 现状行数 | 改点 | 预计 |
|---|---|---|---|
| `thincoder-core/session-lifecycle.mjs` | 386 | `:170` slotModel 归一 · `:383` sessionReading provider 合并归一（+ 注句） | ±4 |
| `thincoder-core/model-specs.mjs` | 355 | `:260-261` `lookupSpec` · `:279-280` `warnUnknownModel` 非串归一空串 | ±4 |
| `thincoder-core/config.mjs` | 430 | `:139` `resolveEnableThinking` 同形归一 | +2 |
| 批内件（新档） | — | `docs/batches/2026-09-29-core-carryover.test.mjs`（全批单档——§2.6） | 新档 |

#### 2.2.4 验收判据（可机判）

- **AC-638-1（adoption）**：`applySession(agent, {activeProvider:"p", activeModel:42})`（p.model="m"）⇒ `agent.provider.model === "m"` ∧ `agent.activeModel === "m"`；串值径（"m2"）⇒ `"m2"`（零回归）。
- **AC-638-2（读数面）**：`sessionReading({activeProvider:"p", activeModel:42, history:[]}, {providers:[p], fallback})` ⇒ 返回数字（零抛），且 = 以 `entry.model` 直算同值。
- **AC-638-3（查表全性）**：`specForModel(42)` 不抛（= DEFAULT_SPEC）· `providerSpec({model:true}).context === 128000` · `historyPercent([], {model:{}})` 返回数字 · 以 `{model:42}` 调 `contextUsage` ∕ `compressIfNeeded` 零抛。
- **AC-638-4（同类面）**：`resolveEnableThinking({model:42, baseURL:"https://dashscope.aliyuncs.com/x"}, spec)` 零抛。
- **AC-638-5（命名三面回归）**：`token-window.mjs:151-152 ∕ :161` 串值径逐字节零变；`agent-host.mjs:148` 经 `historyPercent` 同函数承判（端侧不单测——跨端码面）。
- 测试面 = 批内件（上列 fixtures）；集成面不新增。

### 2.3 #641 设计（三缝裁定）

#### 2.3.1 现状实读（本轮实核）

| 缝 | 定义 | 消费支 | 全仓消费者（本轮复核） |
|---|---|---|---|
| `configureEditReceipt` ∕ `resetEditReceipt` | `tools/edit-diff.mjs:398 ∕ :402` | `composeEditReceipt` `:408-414` 之 `injectedReceipt` 分支；调用 = `edit-diff.mjs:379` ∕ `edit-batch.mjs:98` | **零**（`**/*.{mjs,cjs,js}` 全扫：仅定义 + reset + 文档引；`edit-batch.mjs:17 ∕ :21` 为注释） |
| `configureGitApproval` ∕ `resetGitApproval` | `tools/git.mjs:64 ∕ :68` | `:130-134`（execute 审批门分支，`injectedApproval`） | **零**（同扫） |
| `setWaitForConditionSource` | `tools/ops.mjs:129` | `ops.mjs:249`（`injectedConditionSource` ⇒ `evalConditionSource`） | **零**——按 `**/*.{mjs,cjs,js}` 全仓扫描（含核 `test/**`）：跨档消费者 0（定义 ∕ 消费点仅 `ops.mjs` 自身——`:129` ∕ `:249`）；核测试树现盘空（2026-09-28 全清令重置后仅 `run.mjs ∕ slow.mjs`——`run.mjs:41-45` 空清单守卫）；复跑 = 同 glob 全仓复扫（单测树重建轮后复核） |

> **扫描域 ∕ 复跑口径（本表三行同）**：消费者扫描 = `**/*.{mjs,cjs,js}` 全仓（含核 `test/**`——现树空：`run.mjs` ∕ `slow.mjs` 两档）；复跑 = 同 glob 全仓 grep 逐名（到期条件见 §2.8 上抛 2）。

- **机制前提核对**：`TOOLS.md` §6.11（`:276`）已载「端审批在**工具执行前**」＝审批面 = 派发层权限位（工具层无审批位）——两缝前提被架构事实相抵；回执文本 = **模型面**（进 tool 消息）——端差异化渲染 = 渲染面职责（CLI ∕ VSC ∕ 桌面各持视图），不经工具结果改写。
- **休眠史（记录面 · 不复述入规范面）**：2026-09-15 VSC 接线批「按缺省不覆盖」入册 → 2026-09-28 桌面对齐审计判「休眠缝 ⇒ 核侧裁」（`docs/batches/2026-09-28-desktop-feature-parity.md` §2.8 行 2 ∕ 5 ∕ E）→ 2026-09-29 引擎面批转单（`docs/batches/2026-09-29-desktop-extension-engine-face.md` §2.4）。

#### 2.3.2 候选对比（两缝）

| 候选 | 内容 | 判 |
|---|---|---|
| A 保留 + 重分类 | 零码改；登记句由「未接（休眠缝）」改「不接（有由）」+ 到期条件 | 备选形态：其「由」= 扩展点（审批粒度细化 ∕ 只读判定 ∕ 回执形态）= **推测性**；注册面永挂且误导（未来轮可误接线造第二审批层 ∕ 模型面回执分叉）；若采 A ⇒ 登记句按 A 落（二择一，不两存） |
| **B 退场（推荐）** | 删注入面 + reset + 消费支（两源码档 ≈ −38 行）；登记面改「已退场（2026-09-29 裁定）」+ 三档句收正 | **推荐**：① 两缝前提结构性相抵（见 §2.3.1）；② 举证不足 ⇒ 消除（KD-42 判定三态）；③ 再添回便宜（族内 20+ 同款先例可套）；④ 机判可证（符号零命中 + 缺省行为逐字节同） |

#### 2.3.3 第三缝并单裁定

| 候选 | 判 |
|---|---|
| 并单 + 同处置（退场） | 拒：类别不同——**测试缝**（消费类 = 核测试；端零消费者 = 预期形态、非休眠）；单测树重建期退测试钩 = 过早 |
| **并单 + 保留重分类（推荐）** | **裁 = 并单成立**（同轮一并裁）；**处置 = 保留**——注册句 =「测试缝（消费类 = 核测试；端零消费者 = 预期形态）」；到期 = **单测树重建轮复核**（届时无消费 ⇒ 再裁退场） |
| 不并单（拆出另条） | 拒：与台账行（#641 标题「+ 第三缝并单」）及引擎面批建议相抵——零增益 |

#### 2.3.4 落点（file 级 · B 支）

| 档 | 现状行数 | 改点 | 预计 |
|---|---|---|---|
| `thincoder-core/tools/edit-diff.mjs` | 416 | 删 `:390-402` 注入面块（注 + `injectedReceipt` + configure/reset）；`composeEditReceipt` 改纯组装（去分支） | −19 ≈ 397 |
| `thincoder-core/tools/git.mjs` | 427 | 删 `:56-68` 块（注 + `injectedApproval` + configure/reset）+ `:130-134` 消费支 | −19 ≈ 408 |
| `thincoder-core/tools/edit-batch.mjs` | 204 | 注 `:17 ∕ :21` 收正（去「回执形态按端注入」句） | ±2 |
| `docs/core/design/CORE-UNIFICATION.md` | — | §2.13.3 `:1313-1316`（族余项 **9 组 → 7 组** + 去两名）· §2.13.4 `:1344 ∕ :1349`（两行：核内位改「无」+ 由；S2 列改述）· §2.13.6 缺口 5 同笔（`:1416` 谓词收窄 =「核内位 = 无（未退场）」或增「已退场不计缺位」子句——退场行不入缺位计数） | 句级 |
| `docs/core/design/TOOLS.md` | — | §6.11 `:276` 句收正（去两缝名——审批在工具执行前保持）+ §2.2 #59（`:64`）∕ #69（`:74`）两行「端差处置」列改述（退场后无核内注入位——改「已退场——端差由端侧装配 ∕ 渲染面承载、核内无注入位」或等价句；与 §6.11 收正句同向） | 句级 |
| 批内件（新档） | — | `docs/batches/2026-09-29-core-carryover.test.mjs`（§2.6） | 新档 |

**联动（披露 · 承运随父侧）**：`docs/desktop/design/PROJECT.md` §10 **CL**（`:1098` 转单行收正——裁定落定后）；KD-42 输入面叙述句中的旧表计数（`23 行 = 22 函数 + 1 例外`）＝历史 as-of（建议不动，随下笔再议）。

#### 2.3.5 验收判据（可机判）

- **AC-641-1（符号零命中·B 支）**：`configureEditReceipt ∕ resetEditReceipt ∕ configureGitApproval ∕ resetGitApproval` 在 `thincoder-core/**` 零命中（grep 机检）。
- **AC-641-2（缺省行为逐字节同）**：`composeEditReceipt(fields)` 缺省回执与改前同 fixtures 输出（`Edited … ∕ Deleted …` + 写入点上下文）；`git` 工具缺省径执行结果同改前（零门直派发）。
- **AC-641-3（设计档三落点）**：§2.13.3 计数改 **7 组** ∧ 两名零残留；§2.13.4 两行收正；`TOOLS.md` §6.11 句收正。
- **AC-641-4（第三缝）**：`ops.mjs:129` 在位（保留）；注册句落 §2.13.3 族余项邻位（测试缝单列，不混入 configure 族计数）。

### 2.4 #645 设计（核清除形扩族）

#### 2.4.1 现状实读（本轮实核）

| # | 环节 | 实读 | 判 |
|---|---|---|---|
| ① | 校验器 | `agent-tools/settings.mjs:135-146`：形状表命中键 null 放行；`TYPE_MAP` 派生表其余——`value===null` 仅 `want==="object"` 放行 | number ∕ boolean 类 null ⇒ 抛 |
| ② | 直调实证（本轮实跑） | `_checkKnownKeyValue("agent.maxTurns", null)` ⇒ `expects number — got null`；`("traces.enabled", null)` ⇒ `expects boolean`；`("agent.poolLimits", null)` ∕ `("defaultModel", null)` ⇒ PASS（object 类 ∕ 形状表既有放行） | 两族不可清；既有放行面在册 |
| ③ | 双消费方 | 核工具 `set`（`:253` 校验 → `:257` `setKeyPath(disk, …)`——**null 以 null 落盘，非删键**）· 桌面主侧 `thincoder-desktop/src/main/settings.mjs:296`（同校验）→ `:304` `deleteKeyPath`（**null ⇒ 删键已在位**） | 「空 ∕ 非数 ⇒ null ⇒ 删键回退默认」被 ① 挡死（桌面删键支不可达） |
| ④ | 载体 | `UI.md:400` 已载消解路「主侧写链 + 核清除形扩族——另批」；#635 残半 = 桌面渲染面发送面（零发送维持——父裁 (a)） | 本批 = **核半幅**（主侧写链半幅已落——本轮核实） |
| ⑤ | 联动面 | 桌面渲染注 `mount-settings-segments-agent.mjs:31`（「今仍不可达」句）· 跨批锁 `docs/batches/2026-09-29-enddiff-clearance.test.mjs:437-455`（B6b 断言「数值键 null ⇒ 拒」） | 落定后两处须收正（注释归桌面轮 ∥ B6b 归本批实施） |

#### 2.4.2 候选对比

| 候选 | 内容 | 判 |
|---|---|---|
| A validator-only | 仅放行 number（boolean 不动）；核工具写形不动（null 照写） | 拒：核工具写 null 与桌面删键**两形并存**（跨面机制差默认消）；boolean 族 null 写有语义翻转风险（如 `traces.enabled` 消费形 `!== false` ⇒ null = 开）；数族写 null 与「删键回退默认」形不一 |
| **B 核清除形扩族 + 写形归一（推荐）** | ① 放行面：number + boolean（形状表 ∕ object 类既有）；string 类维持拒（消费面无未设态——如 `memory.dbPath`）② 写形：null ⇒ **删键**（核工具：盘删键 + 内存回填 DEFAULTS；桌面主侧已在位，零改） | **推荐**：单一语义「null = 显式清除 ⇒ 删键回退默认」全端一致；`UI.md:400` 消解路核半幅闭合；机判可证 |
| C 端侧绕行 | 桌面特例跳过核校验自删键 | 拒：违「端侧零族别自判 ∕ 校验一律走核导出面」（`thincoder-desktop/src/main/settings.mjs:19` 纪律）——第二份判据 |
| D 不做（维持零发送） | 登记永挂 | 拒：消解路永不可达（#635 残半无法续）；与已立账「另批」相抵 |

#### 2.4.3 语义裁定（本批定义）

- **null 放行面** = 形状表键（既有）∪ object 类（既有）∪ **number / boolean 类（本批扩）**；string 类维持拒。
- **写形单源** = 「null ⇒ 删键」：盘面删键（默认不固化——沿 D-F5b 磁盘真相最小化）；内存热应用 = 回填该键 `DEFAULTS` 默认值（等价 loadConfig 重载形态；形状表键默认 null ⇒ 与今日同形；未知键 ⇒ 删键）。
- **端侧接口约定（零端码）**：桌面主侧「null ⇒ `deleteKeyPath`」已在位，核放行后即通；桌面渲染面「空 ∕ 非数 ⇒ null」发送面 = #635 残半（另轮）；VSC 删键径随其触碰轮核。

#### 2.4.4 落点（file 级）

| 档 | 现状行数 | 改点 | 预计 |
|---|---|---|---|
| `thincoder-core/agent-tools/settings.mjs` | 272 | `:141-145` 放行条件扩 number/boolean；`:256-260` 写形归一（null ⇒ 盘删键 + 内存回填默认；携私有 `deleteKeyPath` 小件）；`:217` description 句「null clears the key」按实收正（如需要） | +12±6 |
| `docs/core/design/SETTINGS-TOOL.md` | — | §2.6 校验语义句（放行面枚举）· §3 决策（D-ST7 语义句补 + 新行「null ⇒ 删键（全端同形）」）· §2.3 写盘段补「盘删键 + 内存回填默认」句（`:31-35`——现句只述 `setKeyPath → writeConfigAtomic`）· §2.7 输出契约补删键径回显形态（`:73-76`——现只 `stored` ∕ `persisted` 两形；补第三形语义 = 键已删除 ∕ 回退默认，逐字形归实施轮）· §4 批次域句收正或退场（`:119`「本批只改读面…写面语义零改」与新写形相抵）· §5 坐标 | 句级 |
| `docs/batches/2026-09-29-enddiff-clearance.test.mjs` | **509**（`wc -l`；末行号 510） | `:437-455` B6b 数值臂改新事实（null ⇒ `ok:true` + 盘删键 + 回读默认）+ **超限拆**（拆点 = `:457`——B6b 块后 ∕ #637 段标前；迁出 #637 段 → `docs/batches/2026-09-29-enddiff-clearance-b637.test.mjs`；两档各 ≤500——细节见 §2.6） | ±6 + 拆（−52 迁出） |
| `docs/batches/2026-09-29-enddiff-clearance-b637.test.mjs` | —（新档 · 拆分产物） | 头部自持（imports + 助手 + 所需桩）· 迁出 #637 段逐字搬移 · 用例数守恒 | 新档 ≈150–250 |
| 批内件（新档） | — | `docs/batches/2026-09-29-core-carryover.test.mjs`（§2.6） | 新档 |

**联动（披露 · 承运随父侧）**：`UI.md:400` 句收正 ∕ 桌面 `mount-settings-segments-agent.mjs:31` 注释（两处归桌面轮）；桌面主侧 = **零码改**（本轮核实）。

#### 2.4.5 验收判据（可机判）

- **AC-645-1（放行面）**：`_checkKnownKeyValue("agent.maxTurns", null)` ∕ `("traces.enabled", null)` 不抛；`("memory.dbPath", null)` 仍抛；`("agent.poolLimits", null)` ∕ `("defaultModel", null)` 零回归（PASS）。
- **AC-645-2（核工具写形）**：`set agent.maxTurns null`（Δfixture configPath）⇒ 盘 `"maxTurns" in agent === false` ∧ 内存 `config.agent.maxTurns === 200`（DEFAULTS）∧ 回执 ok。
- **AC-645-3（桌面主侧 · 零改）**：`settingsAgent({patch:{"agent.maxTurns":null}})` ⇒ `{ok:true}` ∧ 盘键删 ∧ 回读 = 默认（即 B6b 改后断言）。
- **AC-645-4（形状表径零回归）**：`subagentModel` null ⇒ ok ∧ 盘删键（B6b 第二段仍绿）。
- **AC-645-5（object 类 null 写形）**：`set agent.poolLimits null`（Δfixture configPath）⇒ ok ∧ 盘键删 ∧ 内存 = `DEFAULTS` 值（回填）——写形归一覆盖既有放行面。
- **AC-645-6（未知键径）**：盘预置未知键（如 `agent._probe_unknown`）⇒ `set` 该键 `null` ⇒ ok ∧ 盘键删 ∧ 内存同删（无回填）。

### 2.5 三链对照（本批条目 ⟺ 设计判据 ⟺ 台账）

| 台账行 | 设计节 | 判据 | 落点 |
|---|---|---|---|
| #638 | §2.2（B+C 双落点） | AC-638-1..5 | `session-lifecycle.mjs` ∕ `model-specs.mjs` ∕ `config.mjs`（+ 批内件） |
| #641 | §2.3（两缝退场 B ∥ 第三缝保留重分类） | AC-641-1..4 | `edit-diff.mjs` ∕ `git.mjs` ∕ `edit-batch.mjs` + 三档句 |
| #645 | §2.4（放行扩族 + 写形归一） | AC-645-1..6 | `settings.mjs` + `SETTINGS-TOOL.md` + B6b |

- 三链同源：本表 = 台账行（#638 ∕ #641 ∕ #645）⟺ §2 各节 ⟺ 各 AC 组；三条皆 `tech_todo`——需求面载体不存在（需求档零触）。

### 2.6 受影响文件与测试面（全批汇总 · file 级）

| 档 | 面 | 现状行数 | 预计增量 | 批 |
|---|---|---|---|---|
| `thincoder-core/session-lifecycle.mjs` | 产品码 | 386 | ±4 | #638 |
| `thincoder-core/model-specs.mjs` | 产品码 | 355 | ±4 | #638 |
| `thincoder-core/config.mjs` | 产品码 | 430 | +2 | #638 |
| `thincoder-core/tools/edit-diff.mjs` | 产品码 | 416 | −19 | #641 |
| `thincoder-core/tools/git.mjs` | 产品码 | 427 | −19 | #641 |
| `thincoder-core/tools/edit-batch.mjs` | 产品码 | 204 | ±2 | #641 |
| `thincoder-core/agent-tools/settings.mjs` | 产品码 | 272 | +12±6 | #645 |
| `docs/batches/2026-09-29-enddiff-clearance.test.mjs` | 跨批锁 | **509**（`wc -l`；末行号 510——>500 超限，本批拆） | B6b 改判 ±6 + 拆分（迁出 −52） | #645 |
| `docs/batches/2026-09-29-enddiff-clearance-b637.test.mjs` | 跨批锁（拆分产物 · 新） | — | 新档 ≈150–250（迁出 #637 段 ≈52 行 + 自持头部） | #645 |
| `docs/core/design/CORE-UNIFICATION.md` | 设计档 | — | 句级 | #641 |
| `docs/core/design/TOOLS.md` | 设计档 | — | 句级 | #641 |
| `docs/core/design/SETTINGS-TOOL.md` | 设计档 | — | 句级 | #645 |
| `docs/batches/2026-09-29-core-carryover.test.mjs` | 批内件（新） | — | 新档 ≈150–250 | 全批 |

- **测试面 = 批内件 + 跨批锁 B6b 改判**：① 批内件 `docs/batches/2026-09-29-core-carryover.test.mjs`（三组：638 fixtures ∕ 641 缺省径 + 符号零命中 ∕ 645 校验 + 写形——含 AC-645-5 ∕ -6）；② 跨批锁改判 = `docs/batches/2026-09-29-enddiff-clearance.test.mjs` B6b（AC-645-3 ∕ -4——数值臂改新事实，拆后仍住原档）。
- 复跑 = 仓根 `node --test` 逐档（批内件 ∕ enddiff 原档 ∕ 拆分产物——三档各跑）；**集成面不新增**（核面单元级）。
- **行数口径与登记面对账（2026-09-29 届盘重锚）**：本表「现状行数」= 届盘实读（read 工具末行号口径；`wc -l` = 本值 −1〔末尾换行差〕）；登记面（`CORE-UNIFICATION.md` §2.8.1）读数 = 各自 as-of（2026-09-14 ∕ 09-25）——**待刷新**；消解条件 =「该档下次实质改动时」按**触碰批复核**口径（未越 500 ⇒ 不强制拆、回填行数账——先例 = MANIFEST 批父裁同口径）。
- **本批触及 >300 档逐档对账（落点清单）**：`session-lifecycle.mjs` **386**（`wc -l` 385）↔ 子表行 11 记 318（as-of 09-25——待刷新；行内 `newSession` 坐标 `:170-235` 已漂移——现盘 `:206` 起）。
- `model-specs.mjs` **355**（354）↔ 行 14 记 348（as-of 09-25——待刷新）；`config.mjs` **430**（429）↔ 主表行 1 记 419（as-of 09-14——待刷新）；`tools/edit-diff.mjs` **416**（415——与行 16 登记同值 ∕ 仅口径差 1）。
- `tools/git.mjs` **427**（426）：§2.8.1 三表（主表 ∕ 子表 ∕ 次优先）无行 ∕ 无拆分计划（补登时点另定）；读数侧旧在册（`SOFT_LINE_REGISTRY` 含该名——旧档版实核）随 2026-09-28 全清令退场（删档提交 `08d31696`）——重建轮恢复。
- **落点 = `CORE-UNIFICATION.md` §2.8.1 行 11 ∕ 14 ∕ 16（+ 主表行 1）读数按本批落笔后实读刷新（行 11 坐标同笔收正）**；两缝核内坐标对账 = 本设计届盘实读（`edit-diff.mjs:397-402` ∕ `git.mjs:63-68`）↕ §2.13.3 族余项 ∕ §2.13.4 两行旧坐标（as-of 09-14）——两行按退场处置整行改判，旧坐标随行退场。
- **>500 档处置（本批拆——硬限无豁免）**：跨批锁 `docs/batches/2026-09-29-enddiff-clearance.test.mjs` 现盘 `wc -l` **509** ⇒ **本批拆**：拆点 = `:457`（B6b 块后 ∕ #637 段标前）；迁出组 = #637 段（B7 ∕ B8 两用例，`:458-509`——主题连贯）→ 新档 `docs/batches/2026-09-29-enddiff-clearance-b637.test.mjs`。
- 新档头部自持 = imports + 助手 + 所需桩子集（零跨档 import）；迁出逐字搬移、断言零改；用例数守恒；两档各 ≤500（预估原档 ≈456±6 ∕ 新档 ≈150–250，实施轮实读回填）；B6b 改判（±6）仍住原档；原档头注覆盖句随拆收正（去 #637 项）。
- **域外观察（披露）**：批内件 >500 实扫另有 **6 档**（1020 ∕ 727 ∕ 685 ∕ 651 ∕ 589 ∕ 515——`wc -l`；最大 = `2026-09-29-parity-b1-vsc-core.test.mjs`）——非本批面，报请父侧登记 ∕ 另议。

### 2.7 验收对照（回指本 §2 判据）

| 项 | 判据 | 状态 |
|---|---|---|
| #638 | AC-638-1..5 | 设计就绪（待评审） |
| #641 | AC-641-1..4 | 设计就绪（含 A ∕ B 裁定候选在册） |
| #645 | AC-645-1..6 | 设计就绪（含端侧零码核实） |
| 本轮零产品码 | 本设计轮写面 = 批档 §2 | ✓ |
| 需求档零触 | 三条皆 tech_todo——设计不触需求面 | ✓ |

### 2.8 上抛项（裁定点）与披露

**上抛（裁定点）**：

1. **#641 两缝 A ∕ B 二择一**——设计倾向 **B（退场）**；若采 A（保留重分类）⇒ 登记句按 A 落（零码改）。
2. **#641 第三缝处置确认**——并单成立；处置 = 保留 + 重分类（测试缝）；到期 = 单测树重建轮复核。
3. **#645 放行面与写形确认**——放行 = number + boolean；写形 = 「null ⇒ 删键」归一（含核工具落点）；若父侧维持「核工具写 null」保守形 ⇒ 桌面目标仍达（桌面删键已位）但两形并存（备选在册）。
4. **#638 双落点确认**——B+C（含 `config.mjs:139` 同类面并修）；若口径 = 仅 adoption 单点 ⇒ 查表全性另议。

**披露（报告级 · 逐条）**：

1. **#638 同类面扩扫所得**（原条未列）：`session-lifecycle.mjs:383`（`sessionReading`——桌面 `session-slots.mjs:157` 消费）· `config.mjs:139`（`resolveEnableThinking`）· 十余直调 `specForModel` 面——已并入 B+C 覆盖（不扩则散点必漏）。
2. **#641 联动面**：桌面 `PROJECT.md` §10 CL 行（`:1098`）收正待裁定后（承运随父侧）；KD-42 叙述句旧计数 = 历史 as-of（建议不动）；批次档 = 记录面（零触）。
3. **#645 跨批锁翻转**：`docs/batches/2026-09-29-enddiff-clearance.test.mjs` B6b（`:437-455`）所锁「数值键 null ⇒ 拒」事实将翻转——须随实施笔改（不改 ⇒ 后续复跑假红）。
4. **#645 主侧写链半幅已在位**（本轮核实）：`thincoder-desktop/src/main/settings.mjs:304` 删键支在盘——原条「主侧写链」实为已完成半幅；剩余端侧半幅 = 渲染面发送（#635 残半）＋ `mount-settings-segments-agent.mjs:31` 注释。
5. **#641 第三缝现零消费**（含核测试树空）——重分类到期条件见上抛 2；不做则属无由挂账。
6. **#638 上游旁证**：config 侧归一（`config.mjs:283-286`）与 VSC 侧门（`panel-turn-stages.mjs:53`）已在位——入脏口收敛至核 `applySession` 单点（双落点治理面据此收窄）。

### 2.9 修正块（评审轮 1 · 发现 1–7 落地 · 2026-09-29）

父侧裁定：§3 发现 1–7 全数接受，逐条就地落位（发现 8 = §1 面——父侧已收正，本块未触）；改动坐标 = 本档 §2 各节（届盘行号）。

- **号 1（🔴 · §2.6 ∕ §2.4.4）**：`docs/batches/2026-09-29-enddiff-clearance.test.mjs` 现盘实测 **509**（`wc -l`；末行号 510）——>500 超限 ⇒ **本批拆**（硬限无豁免）：拆点 = `:457`（B6b 块后 ∕ #637 段标前）；迁出组 = #637 段（B7 ∕ B8，`:458-509`）。
- 新档 = `docs/batches/2026-09-29-enddiff-clearance-b637.test.mjs`（头部自持 · 逐字搬移 · 用例数守恒 · 两档各 ≤500；B6b 改判仍住原档）。**域外观察**：批内件 >500 另有 6 档（1020 ∕ 727 ∕ 685 ∕ 651 ∕ 589 ∕ 515）——报请父侧。
- **号 2（🟡 · §2.6）**：表下补**对账口径句**（本表 = 届盘重锚（read 口径）∕ 登记面 = as-of 待刷新）+ 本批触及 >300 档逐档对账 + 三登记行（`CORE-UNIFICATION.md:1130 ∕ :1133 ∕ :1135`）读数 ∕ 消解条件（触碰批复核口径）挂落点清单；`tools/git.mjs` 登记 ∕ 计划状态核实写明（§2.8.1 无行 ∕ 无计划；旧在册（`SOFT_LINE_REGISTRY`）随全清令退场）。
- **号 3（🟡 · §2.4.4）**：`SETTINGS-TOOL.md` 落点扩 §2.3（盘删键 + 内存回填默认句）∕ §2.7（删键径回显形态）∕ §4（批次域句收正或退场）。
- **号 4（🟡 · §2.3.4）**：`TOOLS.md` 落点扩 §2.2 #59（`:64`）∕ #69（`:74`）两行「端差处置」列改述（退场后无核内注入位——与 §6.11 收正句同向）。
- **号 5（🟡 · §2.3.4）**：`CORE-UNIFICATION.md` §2.13.6 缺口 5 纳入落点（谓词收窄「无（未退场）」∕ 增「已退场不计缺位」子句）。
- **号 6（🟡 · §2.3.1）**：第三缝扫描句改述 = 扫描结论本体 + 扫描域（`**/*.{mjs,cjs,js}` 全仓含核 `test/**`）+ 复跑口径；表下补三行同口径注。
- **号 7（🔵 · §2.4.5 ∕ §2.5 ∕ §2.6 ∕ §2.7）**：AC 组补 **AC-645-5**（object 类 null 写形）∕ **AC-645-6**（未知键径）；§2.5 ∕ §2.7 计数随改（AC-645-1..4 → 1..6）；§2.6「测试面」句改「批内件 + 跨批锁 B6b 改判」（与 AC-645-3 ∕ -4 一致化）。

**零新语义**（= 评审发现与父侧裁定逐条落位；设计档正式条款零触——设计档改点仅入落点清单）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**范围与口径（本轮）**：设计评审（轮 1）——评审对象 = 批档 §2 设计（`docs/batches/2026-09-29-core-carryover.md` §2）+ 三档设计面（`CORE-UNIFICATION.md` ∕ `TOOLS.md` ∕ `SETTINGS-TOOL.md`）。未声明项目标准档、未找到文档地图 ⇒ 归属判据取各档自述权威 + AGENTS.md；源档行数 / 坐标无法越出评审面实点（只做档内对账）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file size | 🔴 | 受影响文件表把 `docs/batches/2026-09-29-enddiff-clearance.test.mjs` 记为 **510 行**（`:153` · `:186`）并要改 **±6**——该测试档已越 **>500 硬限**（无豁免通道），设计未携带任何拆分计划或登记说明；§2.6 尾注「三档产品码均未近 500 硬限（416 ∕ 427 ∥ 272）；无跨文件超限拆分需求」（`:193`）只覆盖三个产品档，未处理该档。 | 三选一并在设计内落定：(a) 为该档补拆分计划（拆点 / 行区间 / 拆后预估 / 消解条件）；(b) 同笔拆分该档，或把 B6b 断言迁入未越限档；(c) 若 510 为陈旧读数，按现盘重锚，并把 §2.6 尾注口径句改为覆盖全表所有 >300 档。 |
| 2 | Clarity / doc-state | 🟡 | 行数 / 坐标读数与 `CORE-UNIFICATION.md` §2.8.1 登记表（档位唯一权威——`:1085`「>300（软线）档须带拆分计划」）互不吻合，且设计未声明按谁重锚：`session-lifecycle.mjs` **386**（`:58`）↔ 登记 **318**（`CORE-UNIFICATION.md:1130`，该行把 `newSession` 记为 `:170-235`，与本设计把 `:170` 读作 `slotModel = …` 赋值点相抵）；`model-specs.mjs` **355**（`:59`）↔ **348**（`:1133`）；`tools/edit-diff.mjs` **416**（`:104`）↔ **415**（`:1135`）；两缝核内坐标 `tools/edit-diff.mjs:371` ∕ `tools/git.mjs:42`（`:1315` · `:1344` · `:1349`）↔ 本设计 `:398 ∕ :402` · `:64 ∕ :68`（`:78` · `:79`）；`tools/git.mjs` **427**（`:105`）在 §2.8.1 可见表内无读数 / 拆分计划行。 | 在 §2.6 行数表下补对账口径句（哪一列 = 现盘重锚、哪一列 = 登记面待刷新），并把本批触及的三个 >300 档的登记行读数 / 消解条件（「该档下次实质改动时」）显式挂进落点清单；`tools/git.mjs` 的登记与计划状态须核实后写明。 |
| 3 | Document ownership | 🟡 | #645 的 `SETTINGS-TOOL.md` 落点清单不全——只列 §2.6（校验语义）· §3（决策）· §5（坐标）（`:152`），而「写形归一（null ⇒ 删键 + 内存回填 DEFAULTS）」同时落在该档 §2.3「热应用 + 写盘」句（`SETTINGS-TOOL.md:34`，现句只述 `setKeyPath(agent.config,…)` → `writeConfigAtomic`）、§2.7 输出契约（`:75-76`，set 回显只有 `stored` / `persisted + hot-applied` 两形，删键径无表述）、§4 边界句「本批只改读面 / 回显谓词…写面语义零改」（`:119`）。落定后这三处将与新写形相抵。 | 把 §2.3 / §2.7 / §4 一并纳入落点清单（§2.3 补「盘删键 + 内存回填默认」句；§2.7 补删键径回显形态；§4 该句按现行语义收正或退场）。 |
| 4 | Document ownership | 🟡 | #641 的 `TOOLS.md` 落点清单只含 §6.11（`:108`），漏 §2.2 两行：#59 端差处置「审批门按端注入（④ 段）」（`TOOLS.md:64`）· #69「回执形态按端注入（④ 段）」（`TOOLS.md:74`）——退场后二者无载体，与收正后的 §6.11（`:276`）同档相抵。 | 把 §2.2 #59 / #69 两行的「端差处置」列同批改述（改为「已退场 —— 端差由端侧装配 / 渲染面承载、核内无注入位」或等价句），与 §6.11 收正句同向。 |
| 5 | Document ownership | 🟡 | `CORE-UNIFICATION.md` §2.13.6 缺口 5 未纳入落点：`:1416` 以谓词「§2.13.4『核内位 = 无』的行」枚举缺位（#112 · #172）；本批把 #59 / #69 两行改成「核内位 = 无」（`:107`）⇒ 谓词命中面变四行，与该档既有维护纪律（「枚举同改」先例见 `:1859` · `:1924` · `:1932`）相抵。 | 落点清单补 §2.13.6 缺口 5 一句：谓词收窄为「无（未退场）」或增「已退场不计缺位」子句，使计数与 §2.13.4 行值同类。 |
| 6 | Clarity / evidence | 🟡 | 第三缝消费者扫描句失真：`:80` 写「零（含核测试树空——`test/` 仅 `run.mjs ∕ slow.mjs`）」；核测试树并非空——同批另一档实读 160 tests（`CORE-UNIFICATION.md:628`）· `thincoder-core/test/write-path.test.mjs`（`:1382`）· `test/model-specs.test.mjs`（`:1131`）等皆在其内。该括注是「零消费者」结论的证据基座。 | 改述为扫描结论本体（「按 `**/*.{mjs,cjs,js}` 扫描消费者 = 0；扫描面含核 `test/**`」）并给出扫描域 / 复跑口径；若扫描确未覆盖核测试树，补扫后再书结论。 |
| 7 | Acceptance criteria | 🔵 | AC / 测试面覆盖口径不一：写形归一未对既有放行面（object 类，如 `agent.poolLimits` / `defaultModel`）立写形断言——AC-645-1 只判校验「零回归」（`:160`）；写形仅由 AC-645-2（数值键）/ AC-645-4（形状表键）覆盖；§2.4.3 的「未知键 ⇒ 删键」径（`:144`）无 AC。另 AC-645-3 / -4 的判据落在跨批锁 B6b（`:162` · `:163`），与 §2.6「测试面 = 批内件单档」（`:192`）表述不一。 | 补 object 类 null 写形与未知键径两条断言（或显式登记「由 B6b 承判」），并把 §2.6 测试面句改为「批内件 + 跨批锁 B6b 改判」的一致表述。 |
| 8 | Methodology / record hygiene | 🔵 | 批次档 §1 存两条 `**状态行**：` 行（`:6` 占位「（…）」+ `:9` 实体）——同段双状态行，占位行仍是死字面，后续 status 写入有选错行风险。 | 合并为一条状态行（保留 `:9` 实体行、删 `:6` 占位行）。 |

**计数**：🔴 1 · 🟡 5 · 🔵 2

**跨面未验（出范围注——无严重度）**：桌面 `thincoder-desktop/src/main/settings.mjs:296 ∕ :304` · `UI.md:400` · `docs/batches/2026-09-29-enddiff-clearance.test.mjs:437-455`（B6b 实体）· `panel-turn-stages.mjs:53` · `session-slots.mjs:157` · `PROJECT.md` §10 CL（`:1098`）· 台账 `docs/TODO.md` #638 ∕ #641 ∕ #645——均不在评审面
⇒ 相关断言（「主侧删键已在位」「需求面载体不存在」「B6b 现状」）本轮未验。

VERDICT: changes-required

### 轮次 2（评审子代理）

**复核（轮 2 · 全档重读 · 轮 1 快照不复用）**：对象 = 批档 §2（含 §2.9 修正块）+ 三档设计面（`CORE-UNIFICATION.md` ∕ `TOOLS.md` ∕ `SETTINGS-TOOL.md`）。轮 1 的 **1 🔴 ∕ 5 🟡 ∕ 2 🔵 全部落位**；本轮新发现 = **1 🔵**（口径自洽）。逐条证据 = 本轮实读引文。

| # | Orig# | 文件 | 严重度 | 状态 | 说明（逐条 = 本轮实读引文） |
|---|---|---|---|---|---|
| 1 | 1 | `docs/batches/2026-09-29-core-carryover.md` | 🔴 | 已修 | `:203`「**>500 档处置（本批拆——硬限无豁免）**：跨批锁 `docs/batches/2026-09-29-enddiff-clearance.test.mjs` 现盘 `wc -l` **509** ⇒ **本批拆**：拆点 = `:457`（B6b 块后 ∕ #637 段标前）；迁出组 = #637 段（B7 ∕ B8 两用例，`:458-509`）」· `:204`「两档各 ≤500（预估原档 ≈456±6 ∕ 新档 ≈150–250，实施轮实读回填）；B6b 改判（±6）仍住原档」· `:190` 拆分产物行已标注「新档 ≈150–250」——硬限要求满足，缺口关闭。 |
| 2 | 2 | 同上 ∕ `CORE-UNIFICATION.md` | 🟡 | 已修 | `:198` 补对账口径句「本表「现状行数」= 届盘实读（read 工具末行号口径…）；登记面（`CORE-UNIFICATION.md` §2.8.1）读数 = 各自 as-of（2026-09-14 ∕ 09-25）——**待刷新**」；`:199`–`:202` 逐档对账 + 落点「§2.8.1 行 11 ∕ 14 ∕ 16（+ 主表行 1）读数按本批落笔后实读刷新（行 11 坐标同笔收正）」；对账目标实读核：`:1130`「| 11 | `session-lifecycle.mjs` | **318**（实读 2026-09-25） |」· `:1133`「| 14 | `model-specs.mjs` | **348**（实读 2026-09-25） |」· `:1135`「| 16 | `tools/edit-diff.mjs` | **415**（实读 2026-09-25——file-tier-sweep 批补登） |」；`tools/git.mjs` 登记状态已写明（`:201`）。 |
| 3 | 3 | 批档 ∕ `SETTINGS-TOOL.md` | 🟡 | 已修 | `:152` 落点扩「**§2.3 写盘段补「盘删键 + 内存回填默认」句（`:31-35`）· §2.7 输出契约补删键径回显形态（`:73-76`）· §4 批次域句收正或退场（`:119`）**」；三坐标经实读在盘：`SETTINGS-TOOL.md:33`「`set` = `setKeyPath(agent.config, key, value)`…→ 写盘 `writeConfigAtomic(cfgPath, fn)`」· `:76`「set 回显：敏感键后缀 ` — stored（值不回显）`；非敏感键后缀 ` — persisted + hot-applied（运行中已生效）`」· `:119`「**本批只改读面 / 回显谓词**…**写面语义零改**」。 |
| 4 | 4 | 批档 ∕ `TOOLS.md` | 🟡 | 已修 | `:108` 落点扩「**+ §2.2 #59（`:64`）∕ #69（`:74`）两行「端差处置」列改述**」；两行实读含「融合：取 CLI + `isReadonlyAction` 审批门按端注入（CLI 无审批面 ＝ ④ 段）」（`:64`）·「融合：取 CLI 执行体…；回执形态按端注入（④ 段）」（`:74`）；TOOLS.md 全档两名扫描 = 仅 `:276`（`  审批层还消费 `configureGitApproval` / `configureEditReceipt` 缝（本批按缺省不覆盖——端审批在工具执行前）。`）——已入 §6.11 收正落点。 |
| 5 | 5 | 批档 ∕ `CORE-UNIFICATION.md` §2.13.6 | 🟡 | 已修 | `:107` 落点补「**§2.13.6 缺口 5 同笔（`:1416` 谓词收窄 =「核内位 = 无（未退场）」或增「已退场不计缺位」子句——退场行不入缺位计数）**」；`:1416` 实读「5. **函数面 ④ 缺位 2 处**：§2.13.4「核内位 = 无」的行（#112 · #172）」。**残余提示**：同项 `:1420`「**#59 / #69 除外**（休眠缝：两树零消费者，2026-09-28 实核——待裁）」的「待裁」句未入落点文本——建议同笔随退场收正。 |
| 6 | 6 | 批档 `:78` ∕ `:80` | 🟡 | 已修 | 表句与表下注均改述为扫描结论本体 + 扫描域 + 复跑口径：`:78`「**零**——按 `**/*.{mjs,cjs,js}` 全仓扫描（含核 `test/**`）：跨档消费者 0…复跑 = 同 glob 全仓复扫」· `:80`「消费者扫描 = `**/*.{mjs,cjs,js}` 全仓（含核 `test/**`——现树空：`run.mjs` ∕ `slow.mjs` 两档）；复跑 = 同 glob 全仓 grep 逐名」。**跨面未验**：「2026-09-28 全清令」因果句评审面内无第二佐证（`CORE-UNIFICATION.md` 全档「全清令」零命中）。 |
| 7 | 7 | 批档 `:165` ∕ `:166` ∕ `:196` | 🔵 | 已修 | 新增 `:165`「**AC-645-5（object 类 null 写形）**：`set agent.poolLimits null`（Δfixture configPath）⇒ ok ∧ 盘键删 ∧ 内存 = `DEFAULTS` 值（回填）」· `:166`「**AC-645-6（未知键径）**：盘预置未知键（如 `agent._probe_unknown`）⇒ `set` 该键 `null` ⇒ ok ∧ 盘键删 ∧ 内存同删（无回填）」；`:174` ∕ `:213` 计数改「AC-645-1..6」；`:196`「**测试面 = 批内件 + 跨批锁 B6b 改判**」。 |
| 8 | 8 | 批档 §1 | 🔵 | 已修 | 实读 §1 仅一条状态行 `:7`「**状态行**：🔄 进行中（2026-09-29 20:44 · 立批——设计轮已派）」；占位行已不在；§2.9 `:237` 记「发现 8 = §1 面——父侧已收正」。 |
| 9 | （新） | 批档 `:198` ∕ `:189` | 🔵 | 新 | 口径自洽：`:198` 声明「本表「现状行数」= 届盘实读（read 工具末行号口径；`wc -l` = 本值 −1〔末尾换行差〕）」，而 `:189` 记「**509**（`wc -l`；末行号 510——>500 超限，本批拆）」（`:153` ∕ `:203` 同）——同一列两种口径并列（相差 1）；建议统一标注（>500 判定与拆分触发不受影响）。 |

**计数**：🔴 0 · 🟡 0 · 🔵 1（新）——轮 1 八项 8 ∕ 8 落位。

**跨面未验（出范围注 · 无严重度）**：桌面 `thincoder-desktop/src/main/settings.mjs:296 ∕ :304` · `UI.md:400` · B6b 实体（`docs/batches/2026-09-29-enddiff-clearance.test.mjs:437-455`）· `run.mjs:41-45` 空清单守卫 · 删档提交 `08d31696` · 域外 >500 六档读数（`:205`：1020 ∕ 727 ∕ 685 ∕ 651 ∕ 589 ∕ 515）——均住评审面外，本轮未验。

VERDICT: pass

## §4 用户批准（主 agent）

**批准（代签）· 2026-09-29 21:18**——依据 = 用户 13:52 ∕ 17:02 全权（代点火 + 代批 + 代签）。

- **评审状态**：**评审通过**（§3 轮次 2——轮 1 八项 8/8 复核成立；零新增 🔴；余 1 🔵 口径注——实施轮读数回填时同笔统一）。
- **批准范围** = §2 设计：#638（B+C 双落点）∥ #641（两缝退场 + 第三缝保留重分类）∥ #645（放行面扩 + 写形归一）∥ 跨批锁拆分 + B6b 改判 ∥ 三档设计档落点收正。
- **实施切分** = 双舱串行：**码舱**（eng-coder——六产品档 + 跨批锁 + 批内件）→ **设计档舱**（eng-designer——CORE-UNIFICATION ∕ TOOLS ∕ SETTINGS-TOOL 落点 + §2.8.1 读数刷新）。
- **验收**：AC 组（§2.7）· 批内件直跑 · 拆档两档 ≤500 + 用例数守恒 · 读回（D6）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-09-29 · 码舱——六产品档 + 批内件 8/8；跨批锁交接父侧；审计 1 轮 + 自修 1 轮 + 内评 pass + 修正 1 轮 ⇒ clean）



### 5.1 交付摘要（逐件 · file:line 落点）

- **#638（B+C 双落点）**：`thincoder-core/session-lifecycle.mjs:172`（adoption 归一——非串 ∕ 空串 `activeModel` ⇒ 回退渠道模型）· `:386-388`（`sessionReading` 同归一）· `thincoder-core/model-specs.mjs:263` ∕ `:283`（`lookupSpec` ∕ `warnUnknownModel` 非串归一等价空串——查表全性）· `thincoder-core/config.mjs:140`（`resolveEnableThinking` 同归一；同笔删陈旧跨仓 parity 句——`thincoder-vscode/src/config.mjs` 实核不存在）。
- **#641（两缝退场 B 支）**：`thincoder-core/tools/edit-diff.mjs:390-395`（注入面块删 + `composeEditReceipt` 改纯组装）· `thincoder-core/tools/git.mjs:55`（审批缝块删）+ `:115`（消费支删）· `thincoder-core/tools/edit-batch.mjs:15-21`（两句注收正）。第三缝在位（`tools/ops.mjs:159` 定义 ∕ `:286` 消费——保留重分类，零码改）。
- **#645（放行面扩族 + 写形归一）**：`thincoder-core/agent-tools/settings.mjs:66-68`（`_NULL_CLEARABLE`）· `:150`（放行面扩 number/boolean；string 维持拒）· `:183-192`（私有 `deleteKeyPath`——沿桌面 `settings-values.mjs:98` 同形）· `:270-289`（写形归一：盘删键 + 内存删键后回填 DEFAULTS；回执第三形 = `key removed（键已删除——回退默认）`，逐字形归实施轮）· `:6` ∕ `:234`（头注 ∕ description 句按实收正）。
- **批内件**：`.thincoder/tmp/2026-09-29-core-carryover.test.mjs`（183 行——三组 8 用例；终位 `docs/batches/2026-09-29-core-carryover.test.mjs`，父侧移档）。
- **跨批锁（交接父侧——机械门拒）**：`docs/batches/2026-09-29-enddiff-clearance.test.mjs` B6b 改判 + 拆分 = 父侧执行（机械门：「cross-batch batch-record write——本子代理绑定 core-carryover」）。交接三件（新档全文 ∕ B6b 原文→改文 ∕ 原档头注收正）= 交付报告所附；新档暂存卷已落位。

### 5.2 读数

- **测试轮**：批内件 `node --test .thincoder/tmp/2026-09-29-core-carryover.test.mjs` ⇒ **8/8 pass · 0 fail**（最终修订态）。跨批锁原档 `node --test docs/batches/2026-09-29-enddiff-clearance.test.mjs` ⇒ **12/13**——唯一红 = B6b（旧事实臂；设计 §2.8 披露 3 预判「不改 ⇒ 假红」，父侧改判后消解；B6 与 B7 ∕ B8 全绿）。拆分产物暂存卷 `node --test .thincoder/tmp/2026-09-29-enddiff-clearance-b637.test.mjs` ⇒ **2/2 pass**（头部自持成立）。
- **行数账（wc -l；括号 = read 末行号）**：session-lifecycle **390**（391）· model-specs **357**（358）· config **430**（431）· edit-diff **396**（397）· git **402**（403）· edit-batch **203**（204）· settings **298**（299——未越 300 软线）· 批内件 **183**（184）。
- **拆档账**：原档 **509** ⇒ 拆点 `:457`：拆分后原档 = 1-456 ⇒ **456 行**（预估 456±6 ✓）；新档 = **203 行**（≤500 ✓）；迁出块 = 原档 `:458-509` **逐字**（2447B 逐字节核过）；用例数守恒 **13 = 11 + 2** ✓。
- **AC 对照**：AC-638-1..5 ✓（批内件 638-1..4 + 串值回归；638-5 端侧不单测）· AC-641-1 ∕ -2 ∕ -4 ✓（核内半幅；641-3 = 设计档舱）· AC-645-1 ∕ -2 ∕ -5 ∕ -6 ✓（批内件）· AC-645-4 同上 · **AC-645-3 = 跨批锁 B6b 承判（父侧改判后转绿——改判块断言已预验：`numeric.ok=true` ∧ 盘键删 ∧ 回读 200）**。
- 「全绿」条款不适用：`not repo-suite verified — the parent-side closeout run is the only repo-suite run.`

### 5.3 审计 ∥ 内评轮次与终态

- **divergence 审计（explore 子代理 · 只读 · 轮 1）**：四类偏差（PARTIAL ∕ SILENT-SIMPLIFICATION ∕ DOC-DRIFT ∕ OUT-OF-LIST）**全部 = 0**；findings = 2 🔵（注释字面）⇒ 自修轮 1 就地落位（`session-lifecycle.mjs:78-80` ∕ `:179-180` ∕ `:373-374` 三处字面收正 + 复跑绿）。
- **内评（advisor · type=code · 轮 1）**：**VERDICT: pass**（零 🔴；1 🟡 = 五档 >300 文件债（批档 §2.6 已登记、非阻塞）+ 6 🔵）。🔵 落地 4 项（edit-diff 注句去「缺省」字面 ∕ git 空行收束 ∕ 批内件跑法行补终位 ∕ git 断言去本地化文案依赖）；报告级 2 项（第三缝设计坐标漂移 `ops.mjs:129`→现盘 `:159`——设计档舱收正；DEFAULTS 引用别名——沿 `config.mjs:262` 既有先例、零动作）。
- **终态 = `clean`**（审计 1 轮 + 自修 1 轮 + 内评 1 轮 + 内评后修正 1 轮；零未决 must-fix）。

### 5.4 交接块（跨批锁——父侧执行 · 内容 = 交付报告所附）

- **㈠ 新档**：`docs/batches/2026-09-29-enddiff-clearance-b637.test.mjs` 全文 = 交付报告「交接块·㈠」（暂存卷已落位 `.thincoder/tmp/2026-09-29-enddiff-clearance-b637.test.mjs`——可直接 `copy` 至终位；2447B 迁出块逐字节核过 + 2/2 绿）。
- **㈡ 原档 B6b 改判**（原文 `:437-456` → 改文）：交付报告「交接块·㈡」（断言已预验全过）。
- **㈢ 原档头注收正**（覆盖句去 #637 项 + 补拆分产物指针 + 跑法行改终位）：交付报告「交接块·㈢」。
- **㈣ 账**（上 5.2「拆档账」）：原档 509→456 · 新档 203 · 用例数守恒 13 = 11 + 2。

### 5.5 披露

- **陈旧暂存副本**：`.thincoder/tmp/2026-09-29-enddiff-clearance.test.mjs`（与改前原档逐字节同）——B6b 旧断言随本批翻转后成假红源，建议父侧随改判同笔退场。
- **域外**：批内件 >500 另有 6 档（设计 §2.9 号 1 已报父侧）——非本批面。

## §6 验证与收口（父代理）

**§6 验证与收口（主 agent）· 2026-09-29**

- **交付核验**：#638 ∥ #641 ∥ #645 三件落点逐处抽核在盘（`agent-tools/settings.mjs` ∥ `session-lifecycle.mjs` ∥ `model-specs.mjs` ∥ `config.mjs` ∥ `edit-diff.mjs` ∥ `git.mjs` ∥ `edit-batch.mjs`）；批内件 `docs/batches/2026-09-29-core-carryover.test.mjs` 亲跑 **8/8 pass**。
- **跨批锁（父侧执行）**：`enddiff-clearance` 两档——新档 `…-b637.test.mjs`（**203** 行）落位；原档 B6b 改判 + 头注收正 + 拆出块删（**509 ⇒ 456**）；**亲跑 11/11 ∥ 2/2**（用例守恒 13 = 11 + 2）；陈旧暂存副本两枚退场。
- **台账**：#638 ∥ #641 ∥ #645 **已核销**（在途 → 待核销 → 已核销）；内评 🔵6（第三缝坐标漂移 `ops.mjs:129 ⇒ :159`）= 另立账（#672）；批内件 >500 另有 6 档（设计 §2.9 在册——续账）。
- **验收对表**：AC-638-1..5 ✓ ∥ AC-641-1/-2/-4 ✓（-3 = 设计档舱）∥ AC-645-1/-2/-4/-5/-6 ✓（-3 = B6b 承判——改判绿）∥ 拆档两档 ≤500 ✓ ∥ 用例守恒 ✓。
- **D7 收口同步**：角色表 = 设计（#124 舱）∥ 实施（#124）∥ 评审（内评 pass）四件在册；状态行已收口；前情指针 = 无（独立批）；变更记录 = 批档 §5/§6 链条。
