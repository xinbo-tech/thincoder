# 2026-10-04 · 渠道档位退役（桌面）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 11:28 裁定（#635 ③ 渠道档位 = 全消——「渠道档位根本就是错误的设计……根本没法有一个共通的渠道档位参数」）⇒ 退役清理立批。
> 台账 = #902（desktop · 归批）。前情 = docs/batches/2026-09-27-desktop-chat-panel-b.md §2（已收口 2026-09-27——该面建造之源）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-04
**开批登记（2026-10-04 11:2x · 主 agent）**：**来源** = 用户 11:28 裁定（#635 ③ 渠道档位 = **全消**）——判词：「渠道档位根本就是错误的设计，一个渠道下面很多种模型，每种模型的档位参数可能都不一样，**根本没法有一个共通的渠道档位参数**」+「为啥总是不肯清理」。**目标** = 桌面渠道级档位面**整套退役**：设置面「模型与档位」段档位控件 ∥ `settings:agent` `{tier}` 写径 ∥ `provider:list` 行 `effort` 投影 ∥ 设计档 KD-18 ⑥ 族条文（D8 删）。**保留** = 会话级档位（输入区控件行——用户 10-02 已定「留给输入面板」）∥ advisor effort ∥ 核 ∥ CLI ∥ VSC 零触。**授权口径** = 全链（设计 → 用户点火评审 → 批准 → 实施）；每步停走。**设计轮已派**（eng-designer——首轮）。**清账注**：它坐在 #635「反向差五项」待裁位（2026-09-29 起）——今晨父侧曾拟「登记（保留）」建议，按本裁**撤销该建议**（父侧认错在案）。

**U1 裁定（用户 2026-10-04 11:53「改」· 承父侧建议）**：段名「**模型与档位**」（en「Model & tier」）⇒「**模型**」（en「Model」）——随批落（段内已无档位控件，名不副实）。父侧全仓扫描已甄别：活面 = 设计档（SETTINGS/IPC/MENU/COMPOSER/PACKAGING/RENDERER 六档 15 处族，逐处清查在册）∥ 需求档（D39 行——主 agent 随动）∥ 产品码（i18n 两语值 + 注释族——实施轮落）；**输入区的「模型与档位」= 模型+档位两概念（会话级），非段名——零触**；历史变更行零触。修订笔已派（eng-designer——排 G 批设计轮后，同档避并发写）。

**父裁（主 agent · 2026-10-04 12:5x · 承修正块 #7 顺列项）**：预期红两项处置 = **零动作 + §6 收口互指**——`docs/batches/2026-09-29-desktop-head-toolcolor.test.mjs:73`（键位切片腿——键删后预期红）∥ `docs/batches/2026-09-29-desktop-residuals-round3.test.mjs:208`（导入行正则——`deepEqual` 净删后预期红）。两者均随批留存件（旧档零触）；§6 收口按「预期红（键位退役 / 导入面净删）+ 存量红（计数陈旧）」双口径核销。复评（轮次 2）已代点火。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-04 · fix 轮（评审 #18 点修落定：🔴1/🟡3/🔵3 + 范围外注 1 逐条处置已落——§2 修正块（#18）在册；复评（轮次 2）待派））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-04 · initial 轮）**

**本批条目（覆盖 · 台账 #902 · 用户 2026-10-04 11:28 裁定——#635 ③ 渠道档位 = 全消）**

- **R1 · 设置面档位行整行退役（渲染面净删）**：「模型与档位」段档位行（`select`）整行退役——`tierFace` ∥ `tierOptions` ∥ `acceptTier` ∥ `tierRowNode` ∥ `EFFORT_NONE` 随净删；`modelBody` 输出 = 当前读数 + 候选两段（控件零节点）；`views/settings.mjs` 的 `tier:` 装配键 ∥ `mount-settings-exits.mjs` 的 `setTier` 出口 + `onTier` 接线随净删。
- **R2 · `settings:agent` tier 写径退役（含两拒码）**：`tierAgent` ∥ `VANISHED` ∥ `hasTier` 支随净删（`bad-level` / `unknown-provider` 两码随消）；**载荷形态收窄 = 顶层有效键闭集 `{ patch }`**——表外顶层有效键（含退役档位意图载荷）⇒ `invalid-patch`（**零写**——显式拒收，不静默吞）。
- **R3 · `provider:list` 行 `effort` 投影退役**：`effortOf` 整件 + 行 `effort` 键 + 随之引用（`parseModelRef` ∥ `thinkOffShape` ∥ `specForModel` ∥ `deepEqual`）离导入面；`deepEqual`（settings-values.mjs）随净删——判据面唯一消费 = 退役两面。
- **R4 · 词面随净删**：`settings.model.tier`（i18n-settings，两语——62 ⇒ 61 键）∥ `effort.auto` / `effort.off`（i18n.mjs，两语——`effort.*` 档头注随收）。
- **R5 · 设计档条文退役（五档 · D8 删净）**：COMPOSER ∥ IPC ∥ SETTINGS ∥ PROJECT ∥ UI 逐处删（清单 = 受影响文件表「设计档」行）；失效条文零残留——不留划改 / 取代注记；历史归各档变更记录一笔。
- **R6 · 退役验证用例设计（批内件新档）**：`docs/batches/2026-10-04-desktop-channel-tier-retire.test.mjs`（拟新增——腿见下「退役验证用例设计」）。

**不覆盖（本批边界）**：会话级档位族（输入区控件行 ∥ `session:prefs` ∥ 槽 `effort` ∥ `model:list` 逐模型投影——**零触**）∥ advisor effort 族（`agent.advisor.reasoningEffort` 三态写 ∥ 设置面 models 段 effort 控件——零触）∥ 核（`thincoder-core/**`——**核语义零触**，见「核心查证」）∥ CLI ∥ VSC ∥ `thincoder-render-core` ∥ 需求档（主 agent 写域——本批零触）∥ 「模型与档位」段本身（段名 / 段头读数 / 候选行零触——只退档位行）∥ 通道集 ∥ 白名单计数（`settings:agent` 通道在册零变——只收窄载荷形态）。

**核心查证（设计先答 · 据实写死）：`providers.<i>.reasoningEffort` / `.thinking` 今日真实消费链 + 遗留值策略**

- **结论：两键仍被「请求组装面」消费——核语义零触 = 本批边界。** 证据链（实读）：装配 `thincoder-core/agent/assemble.mjs:66`（`config.provider` = 激活渠条目）⇒ `:106`（`createAgent({ provider, … })`——条目对象直入 `agent.provider`）；会话恢复 `thincoder-core/session-lifecycle.mjs:185`（`agent.provider = { ...slotProvider }`）+ `:197-209`（槽 `effort` **非 null 才覆写**；`null` / 缺键 ⇒ 不动 ⇒ 条目原值留在运行态）；载荷 `thincoder-core/provider/core.mjs:196`（`thinking` 直携）/ `:200-207`（`reasoning_effort` 启送 + 枚举守卫）/ `:216-223`（off 静默失效修正支）/ `:227`（`resolveEnableThinking`——`thincoder-core/config.mjs:134-146`）；值源含预设自带（`thincoder-core/config-presets.mjs:17-23`——kimi / glm / deepseek 等 preset 声明 `thinking` / `reasoningEffort`）。
- **遗留值策略（定死）：保留原值 ∥ 停止桌面读写 ∥ 零迁移零删除。** 桌面退役后两键不再经桌面面读写；存量值（含批 B 时期桌面控件写入者）与预设值**同权**——语义 = 该渠道条目默认值（槽 `effort` 未设时随条目生效——独立于退役面成立）。**不作值清理 / 不回填 / 不迁移**（无来源可辨且核侧仍在消费——清理 = 越界改核语义）。
- **注**：批 B「槽配置回落支」已删（`docs/desktop/design/SESSIONS.md:122` session-slots 行在案）不影响本结论——回落效果由「不覆写」自然持有（上链 `:197-209`）。

**设计档落点（本批已落笔 · 产品码零触）**

- `docs/desktop/design/COMPOSER.md`：§1 **KD-18**（设置面半全消——会话级半留）∥ §4 D6 行两处 ∥ 跨档条目需求 §3.5 项 6 单源改指 ∥ 变更记录一笔；
- `docs/desktop/design/IPC.md`：§2 `provider:list` 行（`effort` 消）∥ `settings:agent` 行（写形收窄）∥ 设置族注 **项 9「档位控件注」整项删除**（项 10 号位保持——零改引）∥ 变更记录一笔；
- `docs/desktop/design/SETTINGS.md`：§2.1 设置面行 ∥ §2.2 行族句 ∥ **§2.7 整节删** ∥ §2.9 半行指针 ∥ §3.1 四行说明 ∥ §5 用例行（T-DSK31）删 ∥ §2.3 P14 死引清 ∥ 变更记录一笔；
- `docs/desktop/design/PROJECT.md`：§4.2 本批「现行 ⇒ 预期」块（新立）∥ §7 行删 ∥ §9 落形句 ∥ 变更记录一笔；
- `docs/desktop/design/UI.md`：§1 批 B 注（项 5 删 + 前言单源列收 + 计数随正）∥ 主题切换注先例引随删 ∥ 变更记录一笔。

**机制设计（退役形——净删为主）**

1. **渲染面**（净删；零新节点 / 零新词键）：`renderer/views/settings-sections.mjs`——删 `EFFORT_NONE` ∥ `tierFace` ∥ `tierOptions` ∥ `acceptTier` ∥ `tierRowNode`；`modelBody` ⇒ `[modelHeadNode(section), ...modelChoicesTree(section, handlers)]`（档头两处注随正——「面形要点」档位句删、导出面句去 `tierFace`）。`renderer/views/settings.mjs`——删 `tierFace` 导入 + `tier: tierFace(settings)` 装配键。`renderer/mount-settings-exits.mjs`——删 `setTier` 函数 + `onTier:` 接线 + 两处注随正。`renderer/mount-settings-reads.mjs`——两处注释随正（`{ models:false }` 复读理由 ⇒ 渠行面复读——`effort` 现值理由删）。
2. **主侧**：`src/main/settings.mjs`——删 `tierAgent` ∥ `VANISHED` ∥ `hasTier` 支 ∥ 档头档位写径句；`settingsAgent` 载荷形态收窄（顶层有效键闭集 `{ patch }`；表外 ⇒ `invalid-patch` 零写）；导入面随净删（`thinkOffShape` / `thinkOffPath` 离 `think-off.mjs` 导入——`applyAdvisorEffort` 留）。
3. **读投影**：`src/main/providers.mjs`——删 `effortOf` + `provider:list` 行 `effort` 键 + 档头批 B 句 + 四引用离导入面；`src/main/settings-values.mjs`——删 `deepEqual` 定义 + 档头注句（判据面唯一消费 = 退役两面；`settings.mjs` 同名 re-export 行随删）。
4. **词面**：`renderer/i18n-settings.mjs`——删 `settings.model.tier`（两语）+ 键数注 62 ⇒ 61；`renderer/i18n.mjs`——删 `effort.auto` / `effort.off`（两语）+ `effort.*` 档头注从句删。
5. **通道 / preload / ipc-registry**：零触（`settings:agent` 通道在册；拒收位在既有处理体内）。

**受影响文件表（实读 as-of 2026-10-04（本设计轮）· 口径 = 内容行数（文末换行不计）；「净删」= 设计预算，实施轮按盘回填）**

| # | 文件 | as-of 行数 | 净删（预期） | 改动点 |
|---|---|---|---|---|
| 1 | `thincoder-desktop/src/main/settings.mjs` | 360 | ≈ −44（⇒ ~316） | `tierAgent`（`:196-233`）∥ `VANISHED`（`:158-160`）∥ `hasTier` 支（`:322-327`）净删 + 载荷闭集收窄 + 导入面一处 |
| 2 | `thincoder-desktop/src/main/providers.mjs` | 339 | ≈ −21（⇒ ~318） | `effortOf`（`:66-79`）∥ 行 `effort`（`:111`）∥ `ref`（`:93-94`）∥ 档头句 + 四引用离导入面 |
| 3 | `thincoder-desktop/src/main/settings-values.mjs` | 118 | ≈ −8（⇒ ~110） | `deepEqual`（`:108-118`）+ 档头注句 |
| 4 | `thincoder-desktop/renderer/views/settings-sections.mjs` | 169 | ≈ −66（⇒ ~103） | 五件净删（`EFFORT_NONE` / `tierFace` / `tierOptions` / `acceptTier` / `tierRowNode`）+ `modelBody` 收两段 + 档头注两处 |
| 5 | `thincoder-desktop/renderer/views/settings.mjs` | 399 | −2 | `tierFace` 导入 ∥ `tier:` 装配键 |
| 6 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | 270 | ≈ −16（⇒ ~254） | `setTier`（`:146-159`）∥ `onTier`（`:253`）∥ 注 `:27` |
| 7 | `thincoder-desktop/renderer/mount-settings-reads.mjs` | 204 | ±0 | 注释两处（`:12-13` / `:51`） |
| 8 | `thincoder-desktop/renderer/i18n-settings.mjs` | 156 | −2（+注 1 处） | `settings.model.tier`（`:84` / `:149`）+ 键数注 |
| 9 | `thincoder-desktop/renderer/i18n.mjs` | 415 | −4（+注 1 处） | `effort.auto` / `effort.off`（`:216-217` / `:322-323`）+ 档头注 |
| 10 | 测试面 | — | 新档（≈ 100–130 行） | 批内件 `docs/batches/2026-10-04-desktop-channel-tier-retire.test.mjs`（拟新增——腿见下） |
| 11 | 设计档 | — | 五档净删 | COMPOSER ∥ IPC ∥ SETTINGS ∥ PROJECT ∥ UI（逐处 = 「设计档落点」节；含本档 §4.2 块） |

**对账（量级 · 对标批 B 建造量）**：代码净删 ≈ **−163**（= 44+21+8+66+2+16+0+2+4——八成为 `settings-sections.mjs` 66 + `settings.mjs` 44 + `providers.mjs` 21 三档）；设计档五档净删数十行（D8 删净）；新增仅批内件一件（≈ 100–130 行——随批留存不计线）。退役面九档全数 ≤500 硬限（三档越 300：`settings.mjs` 360 ⇒ ~316 ∥ `providers.mjs` 339 ⇒ ~318 ∥ `views/settings.mjs` 399 ⇒ ~397——皆非结构性触碰 ⇒ **续期**（在册 = `docs/desktop/design/PROJECT.md` §4.1 越层段））。

**退役验证用例设计（批内件新档 `docs/batches/2026-10-04-desktop-channel-tier-retire.test.mjs`（拟新增）——跑法沿批内件惯例：仓根 `node --test docs/batches/…`；渲染档件经 `../../thincoder-desktop/test/rc-resolve.mjs` 预载）**

- **腿 ① 控件零节点 / 零导出面**：`modelBody` 输出 = 当前读数 + 候选两段（零 `data-tier` 节点 ∥ 零档位 `select`）；`settings-sections.mjs` 导出面枚举不含 `tierFace` / `tierOptions`（动态 import 枚举）；`settingsModel(…).model` 零 `tier` 键。
- **腿 ② 写径拒收**：`settingsAgent({ tier: { … } })` ⇒ `{ ok:false, reason:"invalid-patch" }` ∧ **零写**（配置档内容不变；`{ patch }` 正径 ∥ `{}` 读面两向对照照常）。
- **腿 ③ 行 `effort` 键消**：`provider:list` 行键集不含 `effort`；`providers.mjs` 导出面不含 `effortOf`。
- **腿 ④ 会话级零回归**：`composer-sync.mjs` `effortOf`（写向映射）`"none" ⇒ "off"` ∥ `"" ⇒ "auto"` ∥ `"high" ⇒ "high"` 三态照旧；`model:list` 元素形 `{ id, effortEnum, thinkOff }` 逐项在场；`session:prefs` 键闭集（含 `effort`）与失败径三档照旧（定向回归）。
- **腿 ⑤ 词键零残留**：`HOST_DICT` 两语零 `settings.model.tier` / `effort.auto` / `effort.off` 键；两语键集相等。
- 真机面：设置面「模型与档位」段开 ⇒ 零档位行（真 Electron 走查——父侧收口可选；离线可产者全归腿 ①–⑤）。

**验收对照（回指批单 ⇒ 机检面）**

| 批单条目 | 验收面（机检） |
|---|---|
| ① 清干净（UI ∥ 写径 ∥ 读投影 ∥ 设计档条文） | 腿 ①②③ + 五档 grep 面（`tierFace` / `tierOptions` / `setTier` / `onTier` / `effortOf` / 档位控件注 / T-DSK31 零 live 命中——余 = 各档变更记录历史面 + §4.2 删除预案块（披露 U4）） |
| ② 五设计档落笔逐处读回、失效条文零残留 | 五档变更记录各一笔 + doc-check exit 0（本设计轮已复跑） |
| ③ 会话级族零触 | 腿 ④ + `git diff` 面（会话级五件零改——实施轮自证） |
| ④ doc-check 自跑 exit 0 | **本设计轮：✓**（锚 0 悬空 ∥ 行宽 OK；行数面报告 8 条 = 存量陈旧值——回填工单，含 `SETTINGS.md:193` `settings.mjs` 表 331 ⇒ 实读 360） |
| ⑤ 退役验证用例设计 = 控件零节点 ∥ 写径拒收 ∥ 零回归会话级 | 腿 ① ∥ ② ∥ ④（本表「退役验证用例设计」节） |

**关键决策（KD-902-1–5）与被否项**

- **KD-902-1 净删口径**（退役 = 删面 ∥ 不建迁移 ∥ 不留兼容读 ∥ 不留「已退役」注记）：被否——保留隐藏控件 / 兼容读期（残留 = 读者重开死项）。
- **KD-902-2 写径拒收 = 顶层有效键闭集 `{ patch }`**（表外顶层有效键 ⇒ `invalid-patch` 零写）：被否——静默落读面（旧载荷得 `ok:true` 假成功）；`tier` 键名单点检（单点补丁——第二旧载荷仍静默）；两层嵌套校验（越本批）。
- **KD-902-3 遗留值策略 = 保留原值 ∥ 停止桌面读写 ∥ 核语义零触**（见「核心查证」）：被否——清值迁移（无来源可辨 + 越核边界）；核侧停用两键（越本批 ∥ 破坏预设语义）。
- **KD-902-4 验证面 = 批内件新档**（在盘无旧用例可退役——见 U2；沿批内件惯例）：被否——重入仓套件（2026-09-28 全清重置后清单 `[]`——重建立项不在本批）；纯源扫无行为腿（拒收 ∥ 零回归需行为面）。
- **KD-902-5 设计档 D8 删净 + 变更记录一笔**（不留划改 / 取代注记）：被否——划改保留（违用户 2026-09-18 裁定「失效即删」）；无记录删（历史无痕——违变更记录纪律）。

**上抛项（父侧 / 用户裁）**

- **U1 · 「模型与档位」段名**：段名两语键 `settings.section.model` =「模型与档位」/「Model & tier」——段内档位控件已退役，**段名是否随改**（如「模型」）？越本批表：改名牵动菜单收窄批的**排除字面判据**（菜单发出闭集 = `SECTIONS` 名序去「模型与档位」——源扫同字面）∥ 需求卷 D39 表述 ∥ `SCOPES` / `SETTINGS_GROUPS` 闭集面。**本批不动，披露待裁**（若裁改名 ⇒ 另批）。
- **U2 · 测试面派单事实差（披露）**：批单所列测试档 `thincoder-desktop/test/views-settings.test.mjs` ∥ `test/settings.test.mjs` ∥ `test/views-chrome.test.mjs` ∥ `test/providers.test.mjs` **均不在盘**——2026-09-28 测试树全清重置（`test/files.mjs` 清单 = `[]`；`test/run.mjs` 空清单守卫）。故「测试面相应用例（整删）」无在盘对象；退役验证改以批内件新档承接（KD-902-4）。
- **U3 · `deepEqual` 随净删（披露 · 已落设计）**：`settings-values.mjs` `deepEqual` 判据面唯一消费 = 退役两面（tier 写径 ∥ 行 effort 投影）⇒ 随净删（含 `settings.mjs` re-export 行）。如父侧认为越表 ⇒ 可回退为「保留未用导出」（回退即可，零结构影响）。
- **U4 · §4.2 块家族词面（披露）**：`docs/desktop/design/PROJECT.md` §4.2 本批「现行 ⇒ 预期」块如实点名待删符号（`tierFace` / `effortOf` / `setTier` …）——批单验收②的 grep 家族在五档内的 live 命中余项 = **该块（删除预案——实施后翻「实读」即随消）** + 各档变更记录行；本设计判「必要且临时」（不点名则删除对象不可核），如裁不从 ⇒ 实施轮该块收敛为文件名级。

**披露（越表发现 · 已随批清 / 已登记）**

- 越表必清（随批已清）：`docs/desktop/design/SETTINGS.md` §2.3 P14 行——原引「档位控件注」+「patch 表达不了删键」（W3 已消解旧说）⇒ 死引与失效陈述删，端差登记句保留。**越批披露**：该 端差「VSC 删键 ∕ 桌面零发送」与 W3 消解的关系未再核——非本批面，报父侧。
- 随批收正（注释面）：`renderer/mount-settings-reads.mjs` ∥ `renderer/mount-settings-exits.mjs` 注释携该面词（`effort` 现值 / `setTier`）——随净删收正（本表 6 ∥ 7 行）。
- 未越表（零触）：`docs/desktop/design/SHELL.md:151`（回落句——会话 / 核语义面）∥ `docs/desktop/design/SESSIONS.md:122`（配置回落支删除——批 B 在案）∥ `ACTIVITY.md:18` ∥ `IPC.md` §1 `ev:digest` 的 `tier` 字段 = **消化轮档位（同名异物）**。

**§2 修正块（fix 轮 · U1 段名收正 · 2026-10-04 · eng-designer）**

**U1 收口（用户 2026-10-04 11:53 裁「改」——承父侧建议 · 已落）**：设置面段名「模型与档位」（en「Model & tier」）⇒「**模型**」（en「**Model**」）——随本批落（段内档位控件已退役，名不副实）。**原 U1 条目**（「本批不动，披露待裁——若裁改名 ⇒ 另批」）随本裁收口：改名落本批（设计档本修正轮 ∥ 产品码实施轮）。

- **收正面（设计档六档 · 本修正轮已落 · 21 行 ∕ 26 处）**：SETTINGS（`:3` ∥ `:29` ∥ `:37` ∥ `:86` ∥ `:109` ∥ `:116` ∥ `:125` ∥ `:161` ∥ `:168` ∥ `:195`）∥ IPC（`:39`）∥ MENU（`:13` ∥ `:14` ∥ `:24` ∥ `:25` ∥ `:133` ∥ `:134` ∥ `:135`）∥ COMPOSER（`:114`）∥ PACKAGING（`:180`）∥ RENDERER（`:165`）——**首现注一处**（SETTINGS `:29`——首处释义句挂「（原「模型与档位」）」；注位判由 = 可辨性风险位（「去「模型」」歧义）+ 防历史断链；余处不注）；各档变更记录一笔（新行——历史行零触）。
- **产品码落点（实施轮——设计只给落点 ∥ 判据 ∥ 用例）**：值面 `thincoder-desktop/renderer/i18n-settings.mjs:37`（en「Model & tier」⇒「Model」）∥ `:102`（zh「模型与档位」⇒「模型」）；注释面 `thincoder-desktop/renderer/views/settings.mjs:32` ∥ `:37` ∥ `thincoder-desktop/renderer/views/settings-sections.mjs:3` ∥ `thincoder-desktop/src/main/app-menu.mjs:13` ∥ `:18` ∥ `:34` ∥ `thincoder-desktop/src/main/menu-words.mjs:124`（「去「模型与档位」」⇒「去「模型」」释义句）。
- **零改面**：`name` 键（`model`）∥ 集合逻辑（六名发出 ∥ `SCOPES` 七名宽容）∥ 通道 ∥ 载荷 ∥ 词表键名（`settings.section.model` 键名不变——只改值）∥ 需求卷（主 agent 笔面——D39 行 + 变更记录已落）。
- **零触在册**：`COMPOSER.md:259`（T-DSK7 场景名 = 模型+档位两概念——非段名）∥ 各档历史变更行 ∥ RENDERER `:165`「四段面」枚举（批 9 快照——现七段；陈旧差分披露在册，越本批面未扩改）。

**受影响文件表增补（U1 · 追加——沿本表口径）**

| # | 文件 | as-of 行数 | 变更（预期） | 改动点 |
|---|---|---|---|---|
| 8a | `thincoder-desktop/renderer/i18n-settings.mjs` | 156 | 值改 2 行（±0——键名零改） | `settings.section.model`：`:37` en「Model & tier」⇒「Model」∥ `:102` zh「模型与档位」⇒「模型」 |
| 12 | `thincoder-desktop/renderer/views/settings.mjs` | 399 | 注释随正 2 处（±0） | `:32` ∥ `:37` |
| 13 | `thincoder-desktop/renderer/views/settings-sections.mjs` | 169 | 注释随正 1 处（±0） | `:3` |
| 14 | `thincoder-desktop/src/main/app-menu.mjs` | 158 | 注释随正 3 处（±0） | `:13` ∥ `:18` ∥ `:34` |
| 15 | `thincoder-desktop/src/main/menu-words.mjs` | 145 | 注释随正 1 处（±0） | `:124` |

**批内件用例增腿（腿 ⑥ · U1 词面 ∥ 注释面）**：`HOST_DICT` 两语 `settings.section.model` 值精确等值 = zh「模型」∕ en「Model」（「档位」∕「tier」残字由此排除）；本轮注释面源扫零残——五档（`thincoder-desktop/renderer/i18n-settings.mjs` ∥ `thincoder-desktop/renderer/views/settings.mjs` ∥ `thincoder-desktop/renderer/views/settings-sections.mjs` ∥ `thincoder-desktop/src/main/app-menu.mjs` ∥ `thincoder-desktop/src/main/menu-words.mjs`）零「模型与档位」∧ 零「Model & tier」命中。

**量级随动（U1）**：文改 ∥ 值改 ∥ 零增删——代码净删总量 ≈ **−163** 不变（段名收正零行数增减）；批内件 +腿 ⑥（随批留存不计线）。

**自检（本修正轮）**：锚 0 悬空 ∥ 本域六档零行宽红（全仓复跑 exit 1——唯一红 = 区域外 `docs/cli/requirements/ACP-CLIENT.md:91`（421 字符——非本批面，报父侧路由））∥ 六档残字复核：旧名零 live 命中（余 = 记录面（历史行 ×5 + 本轮新增变更行 ×6）+ 首现注 ×1 + COMPOSER `:259` 概念面）；逐处读回 = 报父侧。

**§2 修正块（fix 轮 · 评审 #18 点修 · 2026-10-04 · eng-designer）**

**评审 #18（§3 轮次 1 发现表 · VERDICT: changes-required · 🔴1 ∥ 🟡3 ∥ 🔵3 + 范围外注 1）逐号处置——父侧逐条裁定 = 按列落；本修正轮已落；token 未签发——复评（轮次 2）待派。**

- **#1（🔴 · 导入指令收正）**：**修正行 45（机制设计 2 · 主侧）**：「导入面随净删（`thinkOffShape` / `thinkOffPath` 离 `think-off.mjs` 导入——`applyAdvisorEffort` 留）」收正 ⇒ **只去 `thinkOffShape`**（`tierAgent` 随退役——其唯一消费面）∥ **保留 `thinkOffPath`**（`modelEntry` 逐模型 `thinkOff` 投影实消费——`settings.mjs:103`；`model:list` / `model:catalog` 面 = 本批零触边界——腿 ④「元素形 `{ id, effortEnum, thinkOff }` 逐项在场」即该保留的行为锁）∥ `applyAdvisorEffort` 留。改后导入形 = `import { thinkOffPath, applyAdvisorEffort } from "@thincoder/core/think-off.mjs"`。**`deepEqual` 引用面全列**（随 U3 净删）：`settings.mjs`——`:42`（导入）∥ `:45`（re-export 行内名）∥ `:219`（消费）∥ `:6`（档头注句）；`providers.mjs`——`:37`（导入——**自 `settings.mjs` re-export 面取**，余 `maskKey` 留）∥ `:71`（档头注句）∥ `:77`（消费）；`settings-values.mjs`——`:111`（定义）∥ `:117`（递归）∥ `:3` ∥ `:8` ∥ `:12`（档头注句）——**实施轮验收 = 全仓 grep（裸标识符形）零残留**。届盘全仓读数（本轮回）：产品码 live = 上列 **12 处**（实施轮净删对象）；文档面 = `PROJECT.md:929-930`（§4.2 本批块——删除预案，U4 披露在册，实施后翻读即随消）∥ `SHELL.md:49`（随本收编已消）；余项归属 = 打包产物快照（`thincoder-desktop/dist-r3/` ∥ `dist-r4/` ∥ `.thincoder/tmp/desktop-dist-*`——零动作）∥ 旧批内件 ∥ 日志档案（见 #7）。

- **#2（🟡 · 「不覆盖」行相抵收口）**：**修正行 26**：「不覆盖（本批边界）」行「「模型与档位」段本身（段名 / 段头读数 / 候选行零触——只退档位行）」——**「段名」项随 U1 修正块收口**（段名改名落本批：设计档六档已落 ∥ 产品码实施轮）；余项（段头读数 / 候选行零触——只退档位行）照旧有效。修正指 = 本块承载（§2 append-only 口径——行 26 原文零动）。

- **#3（🟡 · `SETTINGS.md:345` 枚举残留）**：已落——迁讫枚举去「31」：`T-DSK8 ∥ 9 ∥ 10 ∥ 13 ∥ 31 ∥ 32 ∥ 58` ⇒ **`T-DSK8 ∥ 9 ∥ 10 ∥ 13 ∥ 32 ∥ 58`**；与验收①「T-DSK31 零 live 命中」对齐（届盘：`T-DSK31` 字面仅余 `SETTINGS.md:385` 变更记录行 = 历史面）。读回在案。

- **#4（🟡 · i18n.mjs 改动点补全）**：**修正行 9 ∥ 机制设计 4**——注面**全列**：① `:216-217` / `:322-323`（`effort.auto` / `effort.off` 键删——两语）；② `:127`（`effort.*` 族条**整条去**——键族不再存在 · D8 删净）；③ `:215` / `:321`（两语段注「批 B 面（档位两特值词 / 状态栏读数串…」——「档位两特值词 /」子句去，余句留）；④ `:93`（键数链尾续链一笔 **314 ⇒ 312**——两语同拍、键集相等）；⑤ `:121`（`settings.*` 键数注校准 **60 ⇒ 61**——本批删一键后口径）。行数随动：键删 −4 不变 ∥ 注面换笔 ±0 ∥ 族条去 ≈ −2（实施轮按盘回填）。

- **#5（🔵 · `IPC.md:297` 坐标重锚）**：已落——`settings:agent` 行括注「实读 `thincoder-desktop/src/main/settings.mjs:230-240`」⇒ **「实读 `thincoder-desktop/src/main/settings.mjs:319` 起——`settingsAgent` 体；行号随本批实施轮净删回填」**（届盘实读：二择一判定注 `:316-318` 在其上邻）。读回在案。

- **#6（🔵 · `PROJECT.md:938` 行 11 补档）**：已落——设计档列末补 U1 收正三档：`docs/desktop/design/MENU.md` ∥ `docs/desktop/design/PACKAGING.md` ∥ `docs/desktop/design/RENDERER.md`（「段名收正（U1）+ 变更记录」——批档 U1 修正块在册）。读回在案。

- **#7（🔵 · 旧批内件处置披露 · U2 ∥ KD-902-4 邻位）**：`docs/batches/2026-09-29-desktop-head-toolcolor.test.mjs`（批内件 · 随批留存）——本批键删（`effort.auto` ∥ `effort.off` 两语）后 `:73` 键位切片腿（邻位对拍 = `["effort.auto","effort.off","status.usage"]`）**预期红**（`:70` 计数腿 292 = 存量陈旧红——非本批引入）。**处置 = 零动作**（旧档零触——披露由本块承载；沿 #817/#820「预期红 + 收口互指」先例）；**收口互指** = §6 收口按「预期红（键位退役）+ 存量红（计数陈旧）」双口径核销。**同族顺列披露**（deepEqual 扫面顺手）：`docs/batches/2026-09-29-desktop-residuals-round3.test.mjs:208`（正则扫 `settings.mjs` 导入行含 `deepEqual`——实施后**预期红**）——列报；处置口径候父侧（倾向同本条）。

- **范围外注收编（1）**：已落——`docs/desktop/design/SHELL.md:49` 树行去「∕ `deepEqual`」⇒「（R7——`MASK` ∕ 叶展平 ∕ 点分路径写）」（`settings-values.mjs` 构成描述随正——该函数随本批退役）。读回在案。

**本轮口径 ∥ 自检**：写面 = 本档 §2 + 四档（`SETTINGS.md` ∥ `IPC.md` ∥ `PROJECT.md` ∥ `SHELL.md`）；零产品码 ∥ 零需求档 ∥ 零 G 批档 ∥ 零他批面 ∥ 只按点修（点修随各档既有本批变更行）。自检：① 八处落位逐处读回（D6）——见各条；② **doc-check 复跑 = exit 0**（OK(锚) 0 悬空 ∥ OK(行宽) 源域 .md 无 >300 单行；行数面报告 8 条 = 存量陈旧值——回填工单，本轮零新增；上轮记录的区域外唯一红届盘不复现——非本轮回）；③ `deepEqual` 全仓 grep 读数（裸标识符形）= 产品码 live 12 处（归属见 #1）∥ 文档面 2 处（U4 预案块）∥ 档案面（零动作）；④ `T-DSK31` live 残留 = 0（余 `SETTINGS.md:385` 历史行）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审面**：批档 §2（initial 轮 + fix 轮 U1 修正块）+ 设计档八档（COMPOSER ∥ IPC ∥ SETTINGS ∥ PROJECT ∥ UI ∥ MENU ∥ PACKAGING ∥ RENDERER）——按盘实读核对（含产品码九档退役面 spot-check：`settings.mjs` ∥ `providers.mjs` ∥ `settings-values.mjs` ∥ `settings-sections.mjs` ∥ `views/settings.mjs` ∥ `mount-settings-exits.mjs` ∥ `mount-settings-reads.mjs` ∥ `i18n-settings.mjs` ∥ `i18n.mjs`）。

| # | 类别 | 严重级 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 可行性 / 需求覆盖（主侧退役指令） | 🔴 | 批档 §2「机制设计」2（`:45`）令 `thinkOffShape` / `thinkOffPath` 二者皆「离 `think-off.mjs` 导入」（"导入面随净删（`thinkOffShape` / `thinkOffPath` 离 `think-off.mjs` 导入——`applyAdvisorEffort` 留）"）；实读 `thincoder-desktop/src/main/settings.mjs:38`（导入三件）与 `:103`——`thinkOffPath` 仍被 `modelEntry` 消费（`return { id, effortEnum: spec.reasoningEffortEnum ?? [], thinkOff: thinkOffPath(spec) }`），而 `modelEntry` 供 `model:list` 逐模型投影——该面 = 批档自列**零触**边界（"`model:list` 逐模型投影——**零触**"）且腿 ④ 明断「`model:list` 元素形 `{ id, effortEnum, thinkOff }` 逐项在场」；IPC.md:296「模型`model:list`」行同保 `thinkOff`（"元素形 = `{ id, effortEnum, thinkOff }`——核 `specForModel(model).reasoningEffortEnum` / `thinkOffPath(spec)` 逐模型投影"）。照此实施 ⇒ `model:list` 运行时 ReferenceError（`tierAgent` 退役只消去 `:208` 一处消费，`:103` 仍在）。 | 改「导入面随净删」指令为只删 `thinkOffShape`（+ `deepEqual`）：`think-off.mjs` 导入保留 `thinkOffPath`（`import { thinkOffPath, applyAdvisorEffort } from "@thincoder/core/think-off.mjs"`）；同批腿 ④ 可补一条负向锁（`model:list` 逐项 `thinkOff` 布尔在场）。 |
| 2 | 文档卫生（设计面自相抵） | 🟡 | 批档 §2「不覆盖」行（`:26`）仍留「「模型与档位」段本身（段名 / 段头读数 / 候选行零触——只退档位行）」——U1 修正块（`:110`）已裁「改名落本批（设计档本修正轮 ∥ 产品码实施轮）」，两处并存，前者为活形（未挂修正指）。 | 同笔给「不覆盖」行挂修正指（如注「段名随 U1 修正块」），或把该句收窄为「段头读数 / 候选行零触」。 |
| 3 | 文面残留（读回验收面） | 🟡 | 验收对照 ①（`:81`）断言「T-DSK31 零 live 命中——余 = 各档变更记录历史面 + §4.2 删除预案块」；实读 `docs/desktop/design/SETTINGS.md:345` 用例区尾枚举仍含 T-DSK31 缩写位：「（本域用例全文迁讫（T-DSK8 ∥ 9 ∥ 10 ∥ 13 ∥ 31 ∥ 32 ∥ 58 + **R1–R7**——真机条目，模型菜单全渠批）；」——该行为活面（非变更记录），与「§5 用例行 T-DSK31 删」后的现态不符。 | 该枚举去「31」（或改述为迁讫件现集），与 §5 行删同笔。 |
| 4 | 清晰度（i18n.mjs 改动点清单不全） | 🟡 | 受影响表行 9 与机制设计 4（`:47`）只列 i18n.mjs「−4（+注 1 处）」「`effort.*` 档头注从句删」；实读该档 `effort.*` 相关活面 ≥3 处且另有链面：`:127` 族条「`effort.*` = 档位两特值词（`auto` = 未设（`null`）·」∥ 两语段注 `:215` / `:321`「批 B 面（档位两特值词 / 状态栏读数串…」∥ 键数链尾 `:93`「**313 ⇒ 314**（两语同拍、键集相等；届盘实读续链）」——删两键两语后链尾须续一笔（314 ⇒ 312），否则键数链与实读漂移（链面为在册纪律：每批增／退键续链）。另 `:121`「`settings.*` = 设置面（**60 键**…」已与 `i18n-settings.mjs` 的 62 键面脱节（本批改 61）。 | 行 9 改动点清单补点全部注位（族条 ∥ 两语段注 ∥ 链尾续链），键数注同笔校准。 |
| 5 | 坐标陈旧（本批已改该行） | 🔵 | `docs/desktop/design/IPC.md:297` `settings:agent` 行读面括注「实读 `thincoder-desktop/src/main/settings.mjs:230-240`」与现盘不符（现 `:230-240` 为 `tierAgent` 尾邻域；二择一读面判据在 `:319` 起），本批净删后再移。 | 该行既经本批收正，宜同笔重锚（或随实施回填轮收）。 |
| 6 | 记账面欠登（§4.2 块设计档行） | 🔵 | `docs/desktop/design/PROJECT.md:938` §4.2 本批块行 11「设计档」未列 U1 收正轮所触三档；批档修正块明记其在内：「…∥ COMPOSER（`:114`）∥ PACKAGING（`:180`）∥ RENDERER（`:165`）」——MENU ∥ PACKAGING ∥ RENDERER 三档各有一笔变更行在盘。 | 行 11 设计档列补三档（或改「逐处 = 批档 §2 修正块」指针式）。 |
| 7 | 验证面披露（旧批内件退役断言） | 🔵 | 旧批内件含本批将再红的退役断言：`docs/batches/2026-09-29-desktop-head-toolcolor.test.mjs:73`「assert.deepEqual(en.slice(at + 1, at + 4), ["effort.auto", "effort.off", "status.usage"], "删位邻位对拍（余键零动）")」——键删后该切片腿必红（该档计数腿 292 已为陈旧值，属既有红）。设计（KD-902-4 / U2）只述仓套件与派单测试档口径。 | 沿 #820 先例给一笔处置披露（旧档头注「预期红 + 收口互指」或列入改钉清单）。 |

**范围外注（无严重级）**：`docs/desktop/design/SHELL.md:49` 树行仍把 `deepEqual` 写作 `settings-values.mjs` 的构成（「│   ├── settings-values.mjs         ← 设置族值面 ∕ 遮罩族（R7——`MASK` ∥ 叶展平 ∥ 点分路径写 ∕ `deepEqual`）」）——U3 净删后该描述失效；该档不在本批设计档落点清单（五档）与修正轮六档内。属评审范围外文件，列报不判级。

**核对已过面（记要点）**：腿 ①②③④⑤ 目标符号与消费面逐处实读在位（`tierFace`/`tierOptions`/`acceptTier`/`tierRowNode`/`EFFORT_NONE` @ `settings-sections.mjs`；`tierFace` 导入 + `tier:` 装配键 @ `views/settings.mjs:27/:164`；`setTier` @ `mount-settings-exits.mjs:148-159` + `onTier` @ `:253`；`effortOf` @ `providers.mjs:74-79` + 行 `effort` @ `:111`；`deepEqual` 消费恰退役两面 @ `settings.mjs:219` ∥ `providers.mjs:77`；`settings.model.tier` @ `i18n-settings.mjs:84/:149`；`effort.auto`/`effort.off` @ `i18n.mjs:216-217/:322-323`，且唯一消费 = 退役面）；as-of 行数九档抽查对盘（`settings.mjs` 实读 360〔`SETTINGS.md:186` ∥ §4.1 记 331 = 设计已披露的存量陈旧值〕· `providers.mjs` 339 · `views/settings.mjs` 399 · `mount-settings-exits.mjs` 270 · `mount-settings-reads.mjs` 204 · `i18n-settings.mjs` 156 · `i18n.mjs` 415 · `settings-sections.mjs` 169 · `settings-values.mjs` 118）；三档 >300 各有在册拆分预案（§4.1 越层段在位）；U2 事实核对成立（`thincoder-desktop/test/files.mjs:3` = `export default []`）；U1 收正六档逐处抽验（SETTINGS 10 处 ∥ IPC `:39` ∥ MENU `:13/:14/:24/:25/:133/:134/:135` ∥ COMPOSER `:114` ∥ PACKAGING `:180` ∥ RENDERER `:165` 皆已落；`T-DSK7` 场景名 = 概念面零触）；其余退役面零 live 残留核过（`档位控件注` / `批 B 注项 5` / `设置族注 9` 等余项全在变更记录历史面，产品码内旧引随退役件同消）。

计数：🔴 1 ∥ 🟡 3 ∥ 🔵 3 ∥ 范围外注 1。

VERDICT: changes-required

### 轮次 2（评审子代理）

**复评（轮次 2）核销**：仅核评审 #18 修正落定（§2 修正块 = 批档 `:135-155`）——按盘逐处读回，不猎新项；8/8 落定：① #1（🔴）修正指令在册（`:139`——「只去 `thinkOffShape`」∥「保留 `thinkOffPath`」+ 改后导入形）；对盘回归 = `IPC.md:296`（`thinkOffPath(spec)` 逐模型投影）∥ `PROJECT.md:929`（四引用不含 `thinkOffPath`）口径一致，无档令删；② #2（🟡）修正指挂账（`:141`——「行 26 原文零动」∥本块承载）；③ #3（🟡）`SETTINGS.md:345` 枚举已去「31」（对盘读回：`T-DSK8 ∥ 9 ∥ 10 ∥ 13 ∥ 32 ∥ 58`）；④ #4（🟡）i18n.mjs 注面五件补全在册（`:145`）；⑤ #5（🔵）`IPC.md:297` 重锚（对盘读回）；⑥ #6（🔵）`PROJECT.md:938` 行 11 补三档（对盘读回）；⑦ #7（🔵）旧批件双红 = 披露（`:151`）+ §1 父裁零动作 ∥ §6 双口径核销（`:11`）；⑧ 范围外收编 = `SHELL.md:49` 去 `deepEqual`（对盘读回；设计档 `deepEqual` 文档面仅余 `PROJECT.md:929-930` 预案块）。

| # | 类别 | 严重级 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 清晰度（修正块引用坐标） | 🔵 | 修正块 #1 ∥ #2 的「修正行 45」（批档 `:139`）∥「行 26」（`:141`）与届盘实读差 2 行（机制设计 2 = `:47` ∥「不覆盖（本批边界）」行 = `:28`）——修正块写成后 §1 父裁行（`:11`）等记录增长所致；引文锚在义、无歧义。 | 引用改以小节名 + 引文锚为准（或回填轮按盘顺正行号）。 |
| 2 | 文面精确（读回口径） | 🔵 | 修正块 #3（批档 `:143`）自述「字面仅余 `SETTINGS.md:385` 变更记录行」；届盘全仓尚余 `PROJECT.md:1453`（「§7 增 T-DSK31」）∥ `PROJECT.md:1821`（「§7 T-DSK31 行删」）——均变更记录面，与验收①「余 = 各档变更记录历史面」相容、无伤判据。 | 读回句标注扫描面，或按全仓口径补列两处。 |

计数：🔴 0 ∥ 🟡 0 ∥ 🔵 2 ∥ 范围外注 0。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-04 12:59 父侧代签批准**（用户 12:18「都自动跑吧」授权——全链自动；本批为 changes-required 复评通过后签发）。

**三条件核验**：① 评审 pass（轮次 2 · #28——仅核轮次 1 前表修正落定：**8/8 全数 Fixed**（修正轮 #23 逐号落定并经父侧核读：修正块 `:135-155`）；残留 🔵 2 = 修正块自身精度项（引用坐标 +2 漂移 ∥ `T-DSK31` 读回口径）——不阻过、零动作）；② 修正落地核验 ✓（上列逐处实读）；③ token 已签发（运行态，不入档）。

**批准范围** = 本批全量（渠道档位退役：九档净删 ≈ −163 + 批内件腿 ①–⑤）。派发 = 实施舱（eng-coder · initial）。**跨批序注**：与本批共享两档（`mount-settings-exits.mjs` ∥ `i18n-settings.mjs`）的 G 批实施先落（#26 在飞）——本批实施经调度排队其后；键数面按**实施时实盘**校准（G 批先落预期 ⇒ `SETTINGS_DICT` 60 ⇒ 本批 59 ∥ 合并链尾 312 ⇒ 本批 310——以盘为准）；G 批 leg ④「表外顶层键放行」断言在本批落地后失效（随批留存件——§6 收口互指）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（内部审计 1 轮（四类 clean）+ 内部代码评审 1 轮（pass · 零 must-fix）+ fix 轮 0；终态 clean）



**§5 实施记录（eng-coder · 2026-10-04 · initial 轮）**

**实施摘要**：九档净删（渠道档位退役）+ 批内件新档（六腿，先红后绿）+ U1 段名收正两档注释随正。零新节点 ∥ 零新词键 ∥ 零新语义；会话级档位族（输入区控件 ∥ `session:prefs` ∥ 槽 `effort` ∥ `model:list` 逐模型投影 ∥ `composer-sync` 写向映射）∥ advisor effort 族 ∥ 核 ∥ CLI ∥ VSC 零触。

**逐档读数（as-of ⇒ 实读 ∥ 净删 ∥ 与设计预算）**——口径 = 内容行数（文末换行不计）

| # | 文件 | as-of | 实读 | 净删 | 设计预算 | 偏差说明 |
|---|---|---|---|---|---|---|
| 1 | `src/main/settings.mjs` | 360 | 300 | −60 | ≈ −44 | 预算未计 `tierAgent` 档注 13 行 ∥ 档头「档位写径」块 5 行 ∥ 随带空行 2（settingsAgent 体 −6/+7 = +1） |
| 2 | `src/main/providers.mjs` | 339 | 317 | −22 | ≈ −21 | `effortOf` 删块随带空行 1（预算未计） |
| 3 | `src/main/settings-values.mjs` | 118 | 106 | −12 | ≈ −8 | 预算未计档注 3 行 ∥ 随带空行 1 |
| 4 | `renderer/views/settings-sections.mjs` | 169 | 93 | −76 | ≈ −66 | 预算未计五件档注 7 行 ∥ 块间随带空行 4（`modelBody` 5⇒4 = −1 同设计） |
| 5 | `renderer/views/settings.mjs` | 399 | 398 | −1 | −2 | `tier:` 装配键 1 行（导入面 ∥ 注面皆行内收正——±0） |
| 6 | `renderer/mount-settings-exits.mjs` | 270 | 254 | −16 | ≈ −16 | ✓（`setTier` 块 15 ∥ `onTier` 1；`:27` 注面 ∥ 档头出口枚举随正） |
| 7 | `renderer/mount-settings-reads.mjs` | 204 | 204 | ±0 | ±0 | ✓（两处注面随正——行内） |
| 8 | `renderer/i18n-settings.mjs` | 152 | 150 | −2 | −2 | ✓（两语键删 2 行；键数注 59（按盘：60 ⇒ 59）∥ U1 段名值改 2 行行内） |
| 9 | `renderer/i18n.mjs` | 415 | 413 | −2 | −4 | 键删 −4 ∥ 族条 2⇒1（−1）∥ 链尾续链 +3（预算未计注面增行） |
| 10 | `src/main/app-menu.mjs`（U1） | 158 | 158 | ±0 | ±0 | ✓（注释随正 3 处行内） |
| 11 | `src/main/menu-words.mjs`（U1） | 145 | 145 | ±0 | ±0 | ✓（注释随正 1 处行内） |

九档合计净删 **−191**（设计 ≈ −163——偏差全在「预算未计档注 ∥ 随带空行 ∥ 注面增行」，零语义面偏差）；批内件新档 188 行（设计 ≈ 100–130——U1 增腿 ⑥ 与六腿读数断言扩容；随批留存不计线）。退役面全档 ≤500 ✓；三档越 300 续期（`settings.mjs` 300 回线 ∥ `providers.mjs` 317 ∥ `views/settings.mjs` 398——后两档非结构性触碰 ⇒ 续期，回填 = 设计/父侧面）。

**决策透明表（逐条）**

- **顶层有效键闭集实现形**（KD-902-2）：`settingsAgent` 前置换算 `shaped`（仅非 null ∥ 非数组对象面取键）⇒ 表外有效键（非 `undefined`/`null`）⇒ `invalid-patch` 早退**零写**；`{}` / `{ patch:null }` 仍读面 ∥ `{ tier }` ⇒ `invalid-patch`（拒收，非静默落读面）。非对象载荷（缺 ∥ 串 ∥ 数组）沿旧读面语义（越本批表 ∥ 保零回归）。
- **导入面收正**（评审 #1 修正）：`settings.mjs` 只去 `thinkOffShape`（`thinkOffPath` 保留——`modelEntry` 逐模型投影实消费）∥ `applyAdvisorEffort` 留；改后导入形逐字 = `import { thinkOffPath, applyAdvisorEffort } from "@thincoder/core/think-off.mjs"`（腿④-B 结构机检锁定）。
- **注面范围外收正两处（披露 · 零语义）**：① `providers.mjs:198` 回读核验注「—— 沿 `tierAgent` 判例」——`tierAgent` 净删后成死引 ⇒ 去从句（保「零假成功」判据句）；② `settings.mjs` 档头 `model:list`「逐模型档位投影」等句 = **保留面**（`model:list` 元素形零触）——原样不动。
- **键数面按盘校准（偏离设计/派单预期，事实读数）**：`HOST_DICT` 实读 **312 ⇒ 309**（非 312 ⇒ 310）：`settings.model.tier`（第四档 1 键）随退**经合并点随动**，设计 ∥ 派单的「−2」算法漏计该键；链尾续链条 + 批内件腿⑤同值锁定（`SETTINGS_DICT` 59 ∥ `HOST_DICT` 309）。`i18n.mjs` 族条 ∥ 段注 ∥ 键数链五件全落（修正 #4）。
- **U1 段名收正落点**：值面 2 处（`i18n-settings.mjs:37` en ⇒「Model」∥ `:99` zh ⇒「模型」——G 批落形后坐标按盘）∥ 注释面 6 处（`views/settings.mjs:32` ∥ `views/settings-sections.mjs:3` ∥ `app-menu.mjs:13/:18/:34` ∥ `menu-words.mjs:124`）——**设计点名的 `views/settings.mjs:37` 在盘无对应 live 命中**（该档唯一命中 = `:32`，按盘实读收正；差异载下）。

**先红后绿读数（批内件六腿 + 腿④三子项）**

- **RED（实施前）**：`2 pass ∕ 6 fail`——腿① 红（3 节点含档位行 ∥ 导出面含 `tierFace`/`tierOptions`）∥ 腿② 红（`{tier}` 径得 `ok:true` 且落写盘）∥ 腿③ 红（行含 `effort` ∥ 导出面含 `effortOf`）∥ 腿④-B 红（导入形含 `thinkOffShape`——改后态结构锁）∥ 腿⑤ 红（两语含三键）∥ 腿⑥ 红（段名为旧名 ∥ 注释面 6 命中）；**腿④-A ∥ ④-C 首轮即绿**（会话级零回归腿——预期）。
- **GREEN（实施后）**：`8 pass ∕ 0 fail`（六腿 + ④-A/B/C）。
- **复跑**：仓根 `thincoder/`：`node --test docs/batches/2026-10-04-desktop-channel-tier-retire.test.mjs`。

**机检读数**

- `node --check`：十一档 + 批内件全 exit 0。
- `node scripts/doc-check.mjs`：**exit 0**（锚 0 悬空 ∥ 行宽无红；行数面差异 15 条 = 报告态回填工单，含本批七档新值：`settings.mjs` 300 ∥ `providers.mjs` 317 ∥ `settings-values.mjs` 106 ∥ `views/settings.mjs` 398 ∥ `views/settings-sections.mjs` 93 ∥ `mount-settings-exits.mjs` 254 ∥ `i18n.mjs` 413 ∥ `i18n-settings.mjs` 150——doc 面回填不在本舱写域）。
- **符号面 grep（thincoder-desktop 树：renderer ∥ src ∥ test ∥ src/preload，除 `.thincoder`/`dist*`/`node_modules`）**：`tierFace` ∥ `tierOptions` ∥ `setTier` ∥ `onTier` ∥ `deepEqual` ∥ `thinkOffShape` ∥ `tierAgent` ∥ `hasTier` ∥ `EFFORT_NONE` ∥ `acceptTier` ∥ `tierRowNode` = **零命中**；`effortOf` 余 = **会话级族三档**（`composer-sync.mjs` ∥ `composer-wire.mjs` ∥ `mount-composer.mjs`——保留面，同名不同物）；`VANISHED` 余 = `mcp-servers.mjs:52`（本档私记号 `vanished-server`——同名异物）；`settings.model.tier` / `effort.auto` / `effort.off` 余 = 两档**键数链变更记录行**（历史面）。
- **越表自证**：`git status --porcelain`——本舱写面 = 十一档产品码（M）+ 批内件测试档（新）+ 本档 §5；**零 .md 产品面外写入**；盘上其余 doc 面 M（12 档）皆为本批设计轮 ∥ 他批在飞改动（非本舱）。
- **跨批红读数（如实载）**：`docs/batches/2026-10-04-desktop-generic-editor-retire.test.mjs` 复跑 = **7 pass ∕ 1 fail**——唯一红 = 腿④-D `{nope:1}` 行（G 批「表外顶层键 ⇒ 读面 ok:true」断言随本批闭集落地失效）；余七腿全绿。设计 #7 两名录件抽查口径复核：`2026-09-29-desktop-residuals-round3.test.mjs:208`（导入行正则——`deepEqual` 净删）+ `2026-09-29-desktop-head-toolcolor.test.mjs:73`（键位切片——两键删）= 预期红在册（旧档零触）；**新增扫面**：`2026-09-28-tech-debt-closeout-r7.test.mjs:107` ∥ `2026-09-29-desktop-susp-queue.test.mjs` ∥ `window-queue-parity` ∥ `send-busy-timing` 的 `effortOf` 皆**会话级档**（不红）；`2026-09-29-parity-b10-ui-w2.test.mjs:472` `onTier` = 仅多传 handler 键、零断言（不红）。

**上抛 ∥ 披露（续）**

- **doc 面回填工单**（设计 ∥ 父侧面）：SETTINGS.md §3.1 ∥ UI.md §4.1 行数新值已备（上列）；`PROJECT.md` §4.2 本批块「删除预案」翻「实读」+ `docs/core/design/API-CONTRACT.md:2080-2081`（`tierFace`/`tierOptions` 导出面清单行——本批净删后成死引，**该档不在五档设计落点**，报父侧路由）。
- **U1 设计坐标差异（披露）**：设计「注释面 `views/settings.mjs:37`」在盘无对应 live 命中（实读该档唯一旧名命中 = `:32`，已收正）；六处注释面落点按盘全清（腿⑥ 双树源扫零残字佐证）。
- **跨批注**：G 批 leg ④ 唯一红（上「跨批红读数」）；G 批键数注 60 面本批按盘续链至 59 ∥ 309。
- **真机面**：设置面「模型」段走查（零档位行）——父侧收口可选；离线可产者全归腿 ①–⑥。

**§5 补记（内部审计 ∥ 内部代码评审 · 2026-10-04 · 终态记录）**

**内部审计（explore · 1 轮 · 只读偏差审计）**：四类（部分实现 ∥ 静默简化 ∥ 越表 ∥ 文档漂移）= **零命中**（CLEAN）。逐类读数：① 部分实现——设计验收 (a)–(e) 逐条对盘全落（五件净删 ∥ 闭集拒收零写可达性结构证明 ∥ `deepEqual` 12 处净删 ∥ `thinkOffPath` 保留 ∥ 词面三键 + 键数按盘 59/309 ∥ U1 八处）；② 静默简化——三项逐条给证据，零近似形；③ 越表——mtime 窗口法（T 批写窗恰为本批 11 + 批内件 + §5；G 批窗口严格可分）零表外写入证据（无 git 工具 → 已声明限制）；④ 文档漂移——本批面内零死引、键数注与实读一致。列报 3 条均为已有披露在册项（`i18n.mjs:6-7` 基线快照 ∥ `PROJECT.md:929-933` 预案块 ∥ 设计 `views/settings.mjs:37` 无 live 命中）。限制声明：`node --test` ∥ `git status` 因审计舱无执行器未复跑——以静态逐腿核对 + §5 记录替代。

**内部代码评审（advisor · 1 轮 · 同步）**：**pass**——🔴 0 ∥ 🟡 2（皆 optional · 非 must-fix）∥ 🔵 3 + 范围外注 4。读数要点：九档净删实读与 §5 表**逐项吻合**（合计 −191）；符号面零 live 残留、`effortOf` 余 = 会话级族同名异物；R2 闭集对判 KD-902-2 成立且 `settings:agent` 四调用面全为合规形态（**零调用面破坏**）；评审 #1（🔴）修正落定（导入形逐字 ∥ `thinkOffPath` 消费在位）；U1 八处全对盘（旧名残字仅归档/打包面）。发现项处置：🟡1 = G 批腿 ④-D 跨批红（已父裁零动作 + §6 双口径核销——本舱零动作）∥ 🟡2 = 三档 >300 在册续期（本批净删非结构性——零动作）∥ 🔵3 = 设计修正块 #4 ⑤ 键数注「60 ⇒ 61」设计面笔误（代码面按盘 59——上报设计/父侧面，本舱零动作）∥ 🔵4 = 腿 ④-B 结构机检 vs 行为锁（无测试缝，可接受——零动作）∥ 🔵5 = `i18n.mjs` 档头 era 快照段（链式惯例历史段——零动作）。**无 must-fix ⇒ fix 轮 0**。

**终态**：**clean**（内部审计 1 轮 + 内部代码评审 1 轮；零修正轮；零未决返工项；剩余项皆父侧 ∥ 设计面记录项：doc 面行数回填工单 + 🔵3 设计面数字回填 + 跨批红收口核销）。

## §6 验证与收口（父代理）

**收口判词：已收口 2026-10-04**（渠道档位退役（桌面 · #635③ 全消裁定）——批链：设计 → 评审 #18（🔴0）→ 修正轮 #23 → 复评 #28（pass · 8/8）→ §4 代签（12:59）→ 实施 #30（审计 clean ∥ 代码评审 pass）→ 本节核销）

- **判据链**：批内件六腿 8 例 **先红 2✖/6✔ → 后绿 8✔/0✖**（父侧收口复跑：仓根 `node --test docs/batches/2026-10-04-desktop-channel-tier-retire.test.mjs` = **exit 0 · tests 8**）∥ `node --check` 12/12 exit 0 ∥ as-built：`settings.mjs` **300**（**回线 ✓**）∥ `providers.mjs` **317** ∥ `settings-values.mjs` **106** ∥ `views/settings-sections.mjs` **93** ∥ `views/settings.mjs` **398** ∥ `mount-settings-exits.mjs` **254** ∥ `mount-settings-reads.mjs` **204**（±0）∥ `i18n-settings.mjs` **150**（键两语各 **59**）∥ `i18n.mjs` **413**（链尾 **309**）；合计净删 **−191**（设计 ≈ −163；超估归因 = 被删函数档注 ∥ 随带空行 ∥ 注面增行——逐档在 §5；语义面审计+评审双证零偏差）。
- **收口测试行**：本批单元件 = `docs/batches/2026-10-04-desktop-channel-tier-retire.test.mjs`（~189 行 · 8 例 · 随批留存）；集成面 = 无新增 ∥ 无修订；仓套件 = 未跑（仓 `test/` 树空清单——批内件复跑为本批唯一运行）。
- **doc-check**：**exit 0**（父侧收口直跑）；行数面报告态随回填消解（本批九档已齐平——`SETTINGS.md` §3.1 六行 + `UI.md` §4.1 两行）。
- **收口笔（父侧 · 逐处可 revert）**：① `SETTINGS.md` §3.1 六行走读齐平（300 ∥ 317 ∥ 106 ∥ 398 ∥ 93 ∥ 254 + reads 204 Δ0）+ 变更记录；② `UI.md` §4.1 两行（i18n-settings **150** ∥ 键 **59**；i18n.mjs **413**）+ 变更记录；③ `PROJECT.md` §4.2 本批块翻「实读」（九行实值 + 测试面 ~189 行六腿）+ §4.1 越层段 `settings.mjs` **回线除名（十五 ⇒ 十四）** + providers/views-settings 读数随正 + 变更记录；④ `API-CONTRACT.md` 生成区刷新（**2877 条**——`--write` + `--check` **exit 0**；`tierFace`/`tierOptions` 死引随消）；⑤ 修正轮自查：COMPOSER.md 去号已在设计面（本判词外）。
- **在册（非阻断）**：① §2 修正块 #4⑤ 键数注笔误（「**60 ⇒ 61**」应为「**60 ⇒ 59**」——实盘 59；代码面正确——本判词更正，§2 append-only 原文留档）；② G 批 leg ④-D 唯一红（「表外顶层键放行」断言过时——随批留存件；G §6 在册 + 本批 §5 如实载，本批 §6 互指）；③ U1 六件断代 ∥ 真机面走查 = 用户面（设计已册）；④ 本批 ¥0 台账影响：`#902` 结算在册。
- **前批遗留交叉核**：无（独立批）。
- **结算**：台账 #902 核销 ∥ 签入（双远端）。
