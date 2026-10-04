# 2026-10-04 · 泛化编辑器退役（桌面）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 11:35 裁定「#635 全按你建议」⇒ ① 泛化编辑器全消（前置：表外现存键名单核查）+ ②⑤ 保留登记（④ 已消）。
> 台账 = #903（desktop · 归批）。前情 = 无（独立批——#635 余项裁定落地；⑤项源 = docs/batches/2026-09-29-parity-b10-ui.md 端差全表 #15 ④-B10）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-04
**开批登记（2026-10-04 11:3x · 主 agent）**：**来源** = 用户 11:35「#635全按你建议。」——按父侧建议落形：#635 **① 泛化编辑器 = 全消**（前置 = 表外现存键名单核查——为空/无权重键 ⇒ 直接拆；有活键 ⇒ 先补齐具名表再拆）；**② 语言切换 = 保留 + 登记**（宿主能力类端差——桌面独立 app 无宿主语言面 ∥ VSC 走 `vscode.env.language`）；**⑤ 手 Verify = 保留 + 登记**（差异在位置不在能力——VSC 对位方向 = 行内校验，如需）；**④ autoThink = 已消**（VSC #17 已补，账目收正在册）。**入批** = ① 全消（实现面）+ ②⑤ 登记（记录面 2 注——防「未落档 ⇒ 下游复活」）；**边界** = 核 ∥ CLI ∥ VSC 产品码零触；不扩成设置面重构。**授权口径** = 全链（设计 → 用户点火评审 → 批准 → 实施）。**设计轮已派**（eng-designer——排 T 批（渠道档位退役）设计轮后：两份设计共用 SETTINGS/UI/PROJECT 档，同档避并发写）。**台账** = #903（在途）。

**实施裁定（主 agent · 2026-10-04 12:5x · 承实施舱 #26 上问）**：件② `mount-settings-segments-agent.mjs`——**`listOf`（`:20-21`）保留**（唯一偏差点）。依据：保件 `applyNamedField`（`:104` 契约「回执 ⇒ `fields` 就地刷新」）`:119` 消费 `listOf`——原删件清单（六件 ∥ 净 −54）系设计列表疏漏（未核保件消费面）；其余消费面（`currentFields` `:26` ∥ `saveAgent` `:82`）均在被删集内。腿②扫描名单不含 `listOf` ⇒ 零残留口径不受影响；内联改写（改写保件内部）违「净删为主 · 零新语义」，不取。**as-built**：件② 净删按实扣（−52/−53 量级——~103 行量级，界内）；其余删点照设计。§5/§6 随动记录。

- **父裁与披露（2026-10-04 收口轮）**：① `listOf` **保留** = 父裁（设计删件清单疏漏——`applyNamedField` 实消费面；除名实取五件 = `currentFields` ∥ `rowValue` ∥ `agentPatch` ∥ `saveAgent` ∥ `onSaveAgent`）；② fix 轮三处注面收正（超出设计点名——同「注面收正 ∕ 随消」口径 · 逐条可回退）：`settings.css:10`「越 300 在册」自携句（设计漏点——本批即其消解窗口）∥ `i18n-settings.mjs:18` 消费面名录 10 ⇒ 9 ∥ `mount-settings-segments-agent.mjs:31` 理由句收正（#645 后 `_NULL_CLEARABLE` 已含 number/boolean——原句失实 · 行为零改）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（fix 轮（2026-10-04 · 评审 #19 发现 1–6 逐号落——修正块见本节尾）：U1 名录六件 ∥ 清单补 :15 注收正 ∥ 腿④钉回现盘 ∥ U4 补跨档面 ∥ 注面三处点明 ∥ 十处展开（删净 8 ∥ 保留注 2）；doc-check 复跑读数见报告）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-04 · initial 轮）**

**本批条目（覆盖 · 台账 #903 · 用户 2026-10-04 11:35 裁定「#635 全按你建议」——① 全消 + ②⑤ 保留登记）**

- **R1 · 名单核查（前置 · 实证 · 可复算）**：agent 段**表外现存键名单**——实调既有读面 ∥ 渲染出口 × 两输入（`DEFAULTS` schema 基线 ∥ `loadConfig()` 现盘核读）。**结论 = 无「具名化义务」活键 ⇒ 直拆（全消），零「先补」**。方法 ∥ 名单 ∥ 判据 = 下节。
- **R2 · 泛化编辑器全消（渲染面净删）**：`agentBody` 兜底行族 ∥ 变更集 ∥ 段末保存钮整组退役（逐件 = 「机制设计」节）。
- **R3 · 保存钮处置 = 退役**（判由：零泛化可编辑行 ⇒ 钮无物可存，保留即死控——违诚实非死控纪律；`settings:saveAgent` 锚 ∥ `onSaveAgent` 句柄随净删）。
- **R4 · 词面随净删**：`settings.agent.save` ∥ `settings.agent.readonly`（两语）净删；`settings.reason.slotAuthority` **保留**（消费者 = 拒码词表 `REASON_WORD["slot-authority"]`——防御面在，见 R6）。
- **R5 · 只读行族样式随净删**：`settings.css` `.settings-field-readonly` ∥ `.settings-readonly-hint` 规则组净删（唯一产出面 = 退役兜底行 ⇒ 无产出 = 死规则）。
- **R6 · 主侧防御面保留（零触）**：`settings:agent` `slot-authority` 拒码 ∥ `SLOT_AUTHORITY_PATHS` ∥ patch 写径语义——**零改**（沿 #617「拒码保留（防御面）」先例；桌面 UI 已无可达写径 ⇒ 纯防御）。
- **R7 · 设计档条文随正（D8 删净）+ ②⑤ 保留裁定登记两注**（落点 = 下节）。
- **R8 · 退役验证用例设计（批内件新档 `docs/batches/2026-10-04-desktop-generic-editor-retire.test.mjs` 拟新增）**。

**不覆盖（本批边界）**：核 ∥ CLI ∥ VSC 产品码/设计（VSC 侧如需注 ⇒ 披露不写）∥ 需求档（主 agent 写域）∥ `settings:agent` 写径语义（`{patch}` 单键 ∥ 显式清除面 ∥ 未知键放行）∥ `agentFields` 读面（`fields` 仍供具名值查找——零触）∥ 其余六段（env ∥ models 段 `data-field` 行锚族**非本段产出**——零触）∥ 「模型与档位」段族（T 批在跑）∥ 设置面七段 IA ∥ D37 样式余则（`.settings-row` nowrap ∥ MCP 豁免 ∥ 卡界 ∥ 拨杆——零触）∥ 会话槽写面（`session:flags`）∥ `agent.engineering` 输入区模式钮。

**名单核查（R1 · 实读方法 + 读数 + 名单全文 + 权重判据）**

- **方法（可复算）**：脚本 `thincoder-desktop/.thincoder/tmp/635-namelist-check.mjs`（留存）；跑法 `cd thincoder-desktop && node --import file:///…/thincoder-desktop/test/rc-resolve.mjs .thincoder/tmp/635-namelist-check.mjs`。① 读面 `agentFields`（`src/main/settings-values.mjs`——`settings:agent` 读回执 `fields` 同一出口）+ ② 段体 `agentBody`（`renderer/views/settings-agent.mjs`——渲染同一出口）；③ 两输入各跑：`DEFAULTS`（schema 基线）∥ `loadConfig()`（现盘核读——`~/.thincoder/config.json` 在盘）；④ 差集 = `agentBody` 输出携 `data-field` 的行（表外键）逐条出（path ∕ kind ∥ editable ∥ sensitive ∥ slotAuthority）。
- **读数**：`NAMED_FIELDS` = **18**；DEFAULTS 基线：fields 30 ⇒ 具名落屏 18 ∥ 兜底行 **18** ∥ 保存钮在场；现盘核读：fields 52 ⇒ 具名落屏 18 ∥ 兜底行 **40** ∥ 保存钮在场；具名掉队 0（两输入同）。
- **名单全文（现盘 40 行 · 逐条；基线 18 行 = 现盘子集）**（分类括注：〔分节〕有专段承接 ∥ 〔槽面〕会话槽键 ∥ 〔高级〕两端设置面皆无面 ∥ 〔派生〕`loadConfig` 归一产物 ∥ 〔面头〕有其控件）：
  `$schema`〔派生/外档〕· `advisor.guard`〔派生副本——真面 = `agent.advisor.guard` 具名开关〕· `advisor.timeoutMs`〔派生副本〕· `agent.advisor.timeoutMs`〔高级〕· `agent.compactThresholdAuto`〔派生〕· `agent.consultModels`〔分节 = models 段〕· `agent.engineering`〔槽面——写面 = `session:flags` ∥ 输入区模式钮〕· `agent.goalTurns`〔高级〕· `agent.streamRules`〔高级 · 数组〕· `agent.timerWake`〔高级〕· `defaultModel`〔分节 = 模型段 + `provider:save` 补写〕· `diagnostics.heapSnapshot`〔高级〕· `diagnostics.heapWatch`〔高级〕· `embedding.apiKey`〔分节 = tools 段〕· `embedding.baseURL`〔高级〕· `embedding.model`〔高级〕· `locale`〔面头 = 语言控件〕· `mcp.servers`〔分节 = MCP 段〕· `memory.dbPath`〔高级〕· `memory.projectDir`〔高级〕· `memory.team`〔高级〕· `provider.*` 七件（`apiKey` ∥ `baseURL` ∥ `fetchTimeoutMs` ∥ `maxTokens` ∥ `model` ∥ `name` ∥ `reasoningEffort`）〔派生——激活渠条目副本；真面 = 渠道段〕· `providerInvalidReason` ∥ `providerState` ∥ `providerStateReason`〔派生〕· `providers` ∥ `providersList`〔分节 = 渠道段（`providersList` = 派生别名）〕· `proxy.model` ∥ `proxy.uri` ∥ `proxy.web`〔分节 = env 段〕· `shell`〔分节 = env 段〕· `traces.enabled` ∥ `traces.retentionHours`〔高级〕· `websearch.apiKey`〔分节 = tools 段〕。
- **权重判据（「活键」= 具名化义务键 · 二则或）**：① **VSC 具名面对位缺口**——对位令「VSC 有 ⇒ 桌面必有；反向未含」：VSC agent 卡键集（实读 `thincoder-vscode/webview/settings-agent.js:11-72`：maxTurns ∥ subagentTurns ∥ poolLimits×3 ∥ compactThreshold ∥ verifyGuard ∥ autoThink ∥ subagentModel ∥ subagentModels×5 ∥ consultTurns ∥ consultTimeoutMs ∥ advisor.guard ∥ advisor.provider ∥ advisor.model ∥ advisor.reasoningEffort ∥ consultModels）**全数 ⊆ 桌面覆盖**（18 具名 + models 段承接 advisor.provider/model ∥ consultModels）⇒ **缺口 0**；② **本端分节/他面承接缺口**——逐条判 = 名单分类括注；〔分节〕〔面头〕〔槽面〕三类承接面在位（实读）；仅〔高级〕类无面（`agent.goalTurns` ∥ `agent.timerWake` ∥ `agent.streamRules` ∥ `agent.advisor.timeoutMs` ∥ `embedding.baseURL` ∥ `embedding.model` ∥ `memory.*` ∥ `traces.*` ∥ `diagnostics.*`）——**VSC 同零面**（实读 VSC webview ∥ extension 零命中）⇒ 非本面义务。
- **结论**：**无活键 ⇒ 全消方案（零「先补」）**。披露：〔高级〕键退休后桌面设置面不可达——与 VSC 同况；config 手编 ∥ `settings` 工具 ∥ CLI `/config` 径不变（§「上抛 U2」）。

**设计档落点（本批已落笔 · 产品码零触（设计轮））**

- `docs/desktop/design/SETTINGS.md`（唯一落点档 · 十处）：
  1. §2.1 设置面行 —— **② 保留裁定注**（面头语言控件句邻位——裁定日 + 依据：桌面独立 app 无宿主语言面（VSC = 宿主 `vscode.env.language`）——宿主能力类端差）；
  2. §2.2 项 6 —— slot 权威键句收正（`agent.engineering` = 会话槽面键 · 设置面零行）；
  3. §2.3 项 14 —— 落点死引收正（`agentFieldNode` ⇒ `namedFieldNode` ∥ `namedOut`）；
  4. §2.3 项 15 —— 全消收正（表外标量键 = 不再行面呈现；端差句净删——桌面同 VSC 纯具名）；
  5. KD-49 被否列 —— 泛化行读面形 → 随全消整体退役（指回 §6 **CH**）；
  6. KD-66 ② —— **⑤ 保留裁定注**（动作簇句邻位——差异在位置不在能力；位置类端差）；
  7. KD-66 ③ ∥ §2.5 项 1 ∥ §4 本块 —— 「只读字段行收束」半净删（对象随退役消）；
  8. §6 **CH** —— 转闭合（随全消泛化行整体退役——本项闭合）；
  9. 变更记录 —— 一笔。
- **③ 核对**：他批（T 批）条文在其落笔处零触——本批改动点与 T 批改动点逐处不相交（`git diff` 分块可核）。

**机制设计（退役形——净删为主）**

1. **渲染面**（净删；零新节点 / 零新词键）：`renderer/views/settings-agent.mjs`——删 `agentFieldNode` 整件（`:135-162`，含档注）∥ `agentBody` 收为「具名行唯出」（删 `rows` ∥ `editable` ∥ `onSave` ∥ 段末按钮节点 `:221-229`）∥ `wire` 离 `chat-tool.mjs` 导入面（唯一消费 = 保存钮）∥ 档头 / 两函数注收正（去「泛化兜底」字样）。**具名过滤器 ∥ `EDITABLE_KINDS` ∥ `SELF_FACED_KINDS` 零改**（`field` 缺位 ⇒ 表定控型空控件照旧；字段在场而敏感 / 非标量 ⇒ 不落具名控件 = 零行——见「披露」边缘条）。
2. **出口面**：`renderer/mount-settings-segments-agent.mjs`——删 `currentFields` ∥ `rowValue` ∥ `agentPatch` ∥ `saveAgent` ∥ `listOf` ∥ `onSaveAgent` 出口项；`deps.slot` 解构撤（唯一消费 = agentPatch）；档头注收正（五出口 ⇒ **三**：`namedOut` ∥ `applyNamedField` ∥ `toggleGuard`）。`renderer/mount-settings-exits.mjs`——`:177` `createAgentExits` 调用面撤 `slot` 实参；`:55` 注「泛化兜底行作用域」句收正。
3. **词面**：`renderer/i18n-settings.mjs`——删 `settings.agent.readonly` ∥ `settings.agent.save`（两语 = 4 行）+ 档头键数注 62 ⇒ 60（与 T 批 −1 键在飞——终值按盘收正）；**保留** `settings.reason.slotAuthority`（`renderer/i18n-views.mjs`——消费者 = `views/settings.mjs` `REASON_WORD`）。
4. **样式**：`renderer/settings.css`——删 `.settings-field-readonly` ∥ `.settings-readonly-hint` 规则组（`:250-256`——含合色块 ∥ D37 补则注 ∥ 两则）——**304 ⇒ 297（回线）**；`.settings-submit` 保留（他钮共用：`settings-controls.mjs` ∥ `settings-sections-mcp.mjs`）。
5. **主侧 ∥ 通道 ∥ preload ∥ IPC**：零触（`settings:agent` 通道在册；拒收位在既有处理体）。
6. **测试面（逐处）**：**在盘 test 树 = 零对象**（`thincoder-desktop/test/files.mjs` = `export default []`——2026-09-28 全清重置后，本设计轮实读）；**归档批内件 4 件**将随退役断代（直接复跑径红——详「上抛 U1」）；退役验证 = 批内件新档承接（KD-903-5）。

**受影响文件表（实读 as-of 2026-10-04（本设计轮）· 口径 = 内容行数（文末换行不计）；「净删」= 设计预算，实施轮按盘回填）**

| # | 文件 | as-of 行数 | 净删（预期） | 改动点 |
|---|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/settings-agent.mjs` | 230 | ≈ −38（⇒ ~192） | `agentFieldNode`（`:135-162`）∥ 段体 rows/editable/onSave/按钮（`:221-229`）∥ `wire` 导入 ∥ 注文三处 |
| 2 | `thincoder-desktop/renderer/mount-settings-segments-agent.mjs` | 156 | ≈ −54（⇒ ~102） | 六件净删（`currentFields` `:23-28` ∥ `rowValue` `:30-41` ∥ `agentPatch` `:49-70` ∥ `saveAgent` `:72-83` ∥ `listOf` `:20-21` ∥ `onSaveAgent` `:150`）+ `slot` 解构 ∥ 档头注 |
| 3 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | 270 | ±0 | `:55` 注 ∥ `:177` 调用面撤 `slot` |
| 4 | `thincoder-desktop/renderer/i18n-settings.mjs` | 156 | −4（+注收正） | 两键 × 两语（`:79-80` ∥ `:144-145`）∥ 键数注 |
| 5 | `thincoder-desktop/renderer/settings.css` | 304 | −7（⇒ 297） | 规则组 `:250-256` |
| 6 | 测试面 | — | 新档（≈ 110–150 行） | 批内件 `docs/batches/2026-10-04-desktop-generic-editor-retire.test.mjs`（拟新增——腿见下） |
| 7 | 设计档 | — | SETTINGS.md 十处 | 逐处 = 上节「设计档落点」 |
| 8 | 零触登记 | — | 0 | `views/settings.mjs`(399) ∥ `views/settings-sections.mjs`(169) ∥ `i18n-views.mjs`(386) ∥ main `settings.mjs`(360) ∥ `settings-values.mjs`(118) ∥ `IPC.md` ∥ 需求档 ∥ 核 ∥ CLI ∥ VSC |

**对账（量级 · 退役清单 × 净删）**：代码净删 ≈ **−103 行**（= 38+54+0+4+7——八成为 1 ∥ 2 两档）；样式回线（304 ⇒ 297——越 300 在册条目随消）；词键 −2 键 × 两语；新增 = 仅批内件一件（≈110–150 行——随批留存不计线）；退役面全档 ≤500 ✓。

**退役验证用例设计（批内件新档 `docs/batches/2026-10-04-desktop-generic-editor-retire.test.mjs`（拟新增）——跑法沿惯例：仓根 `node --test docs/batches/…`；渲染档件经 `../../thincoder-desktop/test/rc-resolve.mjs` 预载）**

- **腿 ① 兜底行零节点（行为）**：`agentBody`（`{state:"ready", fields:<含表外键夹具>}`）⇒ 输出恒 = 具名 `data-field-name` 行集（恰 = `NAMED_FIELDS` 落屏集）∧ 零 `data-field` 节点 ∧ 零 `settings:saveAgent` 按钮；夹具两向对照（含表外可编辑标量 `agent.goalTurns`(number) ∥ `agent.engineering`(slotAuthority) ∥ `locale` ∥ `mcp.servers`(array) ↔ 无表外键 ⇒ 同形）。
- **腿 ② 符号 ∥ 锚零残留（源扫）**：renderer 树（除 dist/.thincoder）`settings:saveAgent` ∥ `onSaveAgent` ∥ `agentFieldNode` ∥ `agentPatch` ∥ `rowValue` ∥ `currentFields` 零命中；`views/settings-agent.mjs` 导出面 = 恰 `NAMED_FIELDS` ∥ `agentBody`；`createAgentExits` handlers 键集 = 恰 `{ onNamedField, onToggleGuard }`。
- **腿 ③ 词键零残留**：`SETTINGS_DICT` 两语零 `settings.agent.save` ∥ `settings.agent.readonly`；两语键集相等；`settings.reason.slotAuthority` 在位（防御面词）。
- **腿 ④ 具名面零回归（定向）**：`agentBody` 具名 18 键落屏；`applyNamedField` 单键 patch 直发（回执 ⇒ `fields` 就地刷新）；`toggleGuard` 槽写照旧；`settingsAgent({patch:{…}})` 表外顶层键拒 `invalid-patch` ∥ `slot-authority` 拒码保留（防御面）。
- **腿 ⑤ 样式零残留**：`settings.css` 零 `.settings-field-readonly` ∥ `.settings-readonly-hint` 规则；D37 余则（`.settings-row` nowrap ∥ `.settings-mcp-detail` 豁免 ∥ 卡界 ∥ 拨杆）照旧在位。
- **真机面**：设置面 agent 段走查（零表外行 ∥ 零保存钮；具名即改即存照常）——父侧收口可选；离线可产者全归腿 ①–⑤。

**验收对照（回指批单 ⇒ 机检面）**

| 批单条目 | 验收面（机检） |
|---|---|
| ① 清干净（兜底行 ∥ 保存钮 ∥ 词键 ∥ 样式） | 腿 ①②③⑤ |
| ② 设计档落点逐处读回（含 ②⑤ 注文） | SETTINGS.md 十处读回（上节）+ doc-check exit 0 |
| ③ doc-check 复跑 exit 0 | **本设计轮：✓**（读数 = 报告） |
| ④ 零他批面触碰 | `git status --porcelain` 差分（本批写面 = SETTINGS.md ∥ 批档 §2 ∥ tmp 脚本——他批面零新增） |
| ⑤ 量级对账（退役清单 × 净删） | 「对账」节 |
| 前置 · 名单核查 | 「名单核查」节（方法可复算 + 全文 + 判据） |

**关键决策（KD-903-1–6）与被否项**

- **KD-903-1 全消口径 = 净删**（兜底行 ∥ 只读行族 ∥ 保存键 ∥ 变更集 ∥ 出口整组退役；不建兼容层 ∥ 不留隐藏兜底）：被否——保留只读兜底行（假面残留——读者重开死项）∥ 两阶段（先隐后删）∥ 保留空壳保存钮（死控）。
- **KD-903-2 名单核查 = 直拆（无「先补」）**：判据 = VSC 具名缺口 0 + 本端分节承接在位；〔高级〕类 = 两端皆无面（非义务）；〔派生〕类 = 归一产物（本即噪声——佐证全消）。被否——把〔高级〕键塞入具名表（越 VSC 对位令 ∥ 扩面）∥ 把〔派生〕键具名化（写派生键 = 造脏）。
- **KD-903-3 保存钮 = 退役**（判由 = R3；`settings-submit` CSS 类保留——他钮共用）：被否——保 `disabled` 空钮（噪声）。
- **KD-903-4 词键 = 两枚删 ∥ `settings.reason.slotAuthority` 留**（拒码词表消费者在——防御面保留；沿 #617 拒码留裁）：被否——slotAuthority 词键连删（拒码无词可出）∥ 连拒码 / 词表项删（拆防御面——越表）。
- **KD-903-5 测试面 = 批内件新档 + 归档件断代**（上抛 U1 列点；断代注 / 重锚 = 父侧执行面——沿 #897 先例）：被否——重入仓套件（全清重置后清单 `[]`——重建立项不在本批）∥ 重锚归档四件（代际混淆——原文断言的是退役面本身）。
- **KD-903-6 设计档 D8 删净 + 变更记录一笔**（含「只读字段行收束」半净删——对象随退役消）：被否——划改保留（违 2026-09-18 裁定）∥ 无记录删（历史无痕）。

**上抛项（父侧 / 用户裁）**

- **U1 · 归档批内件断代处置（4 件 · 逐件腿点名）**：① `docs/batches/2026-09-29-desktop-residuals-round3.test.mjs` ⑥ 腿（slot 只读行在场判据 ∥ 段尾保存判据 ∥ 提交集）——断代；② `docs/batches/2026-09-29-enddiff-clearance.test.mjs` B6 腿（`:422` ∥ `:425` `onSaveAgent` 径）——断代；③ `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs` agent 组探针（`:142` `probe: "settings:saveAgent"` + `:492-494` 在场判据）——断代或探针改点（改钉 `data-field-name` 锚）；④ `docs/batches/2026-10-02-desktop-settings-layout.test.mjs` 腿 ② 只读两则扫描（`:173` ∥ `:178`）——断代。**处置建议 = 断代注（父侧执行面 · 沿 #897 先例）；替代 = 认账登记**。不阻断本批。
- **U2 · 〔高级〕键设置面零入口（披露 · 非阻断）**：`agent.goalTurns` ∥ `agent.timerWake` ∥ `agent.streamRules` ∥ `agent.advisor.timeoutMs` ∥ `embedding.baseURL` ∥ `embedding.model` ∥ `memory.*` ∥ `traces.*` ∥ `diagnostics.*`——退休后桌面设置面不可达（与 VSC 同况）；如欲具名化 = 另批另裁。
- **U3 · i18n 键数注与 T 批（渠道档位退役 −1 键）同档在飞**——键数注按两批实施后盘值收正（序由父侧定）。
- **U4 · §3.1 数回填**：`settings.css` 回线（304 ⇒ 297——越线在册条目随消）∥ 本批五档行数——实施轮按盘回填（沿惯例）。

**披露（越表发现 · 逐条）**

- **兜底行作用域事实**：原变更集查询锚 = `[data-field]` × 设置槽**全体**（他段同锚行——env ∥ models——在射程）——原「泛化保存」语义宽于 agent 段字面；随全消整体退场（他段零依赖：各有其出口）。
- **具名掉队边缘**：具名键字段形态腐坏（如 `agent.maxTurns: null`）⇒ 具名过滤器挡下 = **零行**（原经兜底行呈只读回显）——行为微差登记（腐坏档边缘；写入仍由核类型表拒）。
- **VSC 侧**：②⑤ 为宿主能力类 ∥ 位置类端差——VSC 侧如需注 ⇒ 本批披露不写（边界）。
- **批单附表差**：派单「已知事实」记 `settings-agent.mjs` = 231 行——**实读 = 230**（内容行数口径；以实读为准）。

**收正 · 需求面核查（本段自纠 + 合规闭链）**

- **收正（自纠 #1）**：上文「VSC 同零面（实读 VSC webview ∥ extension 零命中）」表述过宽——实读 = **VSC 设置 UI（webview）零命中**；`thincoder-vscode/src/agent/setup.mjs:117-174` ∥ `src/extension/timer-watch.mjs:5-6` ∥ `src/extension/suspension.mjs:274` = **配置管线消费**（非 UI 面）。**结论不变**（〔高级〕键在 VSC 亦无设置入口 ⇒ 非本面义务）。
- **需求面核查（合规 · 闭链）**：需求卷 `docs/desktop/requirements/SETTINGS.md`——**D7**（设置与凭据：provider 增删 ∥ key 管理 ∥ preset / custom 三协议 ∥ **agent 参数面板** ∥ **i18n（en / zh）**）为唯一涉面条目：具名参数面板保留 ∥ 语言控件保留（②登记）∥ 退役面 = 桌面独有外挂（需求从未承诺表外键编辑）⇒ **零需求面变更 ∥ 零缺口**（设计输入可设计性核讫——本批不新增需求条；需求档零触 = 主 agent 笔域）。

**§2 修正块（fix 轮 · 2026-10-04 · 评审 #19 发现 1–6 逐号 · eng-designer）**

承 §3 评审轮次 1 建议（🔴0 ∥ 🟡4 ∥ 🔵3）；发现 7 裁 Deferred——本块零触。落法 = 记录面收正；写域 = 本档单档（`SETTINGS.md` ∥ 产品码 ∥ 需求档 ∥ 他批档零触）。

**修正 1（🟡1 · U1 名录补齐：四件 ⇒ 六件 + ③ 件补点 + 澄清两则）**

- **⑤ 新增** `docs/batches/2026-09-30-desktop-residuals.test.mjs`——`:347`（M-679d 腿）钉 `createAgentExits({ ask, store, setSettings, report, clearReport, slot, paintSettings })` 调用形（注文「agent 注入面零改」）：本批撤 `slot` 实参 ⇒ 必红。处置候选 = 断代注 ∥ 重锚改断言（重锚须同改注文句）。执行面 = 父侧（沿 #897 ∥ KD-903-5 口径）。
- **⑥ 新增** `docs/batches/2026-09-29-i18n-split.test.mjs`——本批添红三处：`:121`（A6 冻结表）`views/settings-agent.mjs` = 230 ⇒ ~192；`:58`（A1）`SETTINGS_DICT` = 62 ⇒ 60；`:81-82`（A2 基线对拍）`HOST_DICT` 合并表 314 ⇒ 312 ⇒ 与冻结基线（`docs/batches/2026-09-29-i18n-split.baseline.json` = 314 条 × 两语）全量等值不再。**另（复核补点 · 按实测增补）= 本件现状已红**：实跑读数 = 4/5 pass——A6 首停 `views/settings.mjs`（冻结 398 vs 盘 399——既有漂移，非本批所致）。处置候选 = 重锚按盘（含基线重冻——本件重锚先例 = 2026-10-04 台账 #889「断言 = 现盘形」）∥ 断代。执行面 = 父侧。
- **③ 件补点**：`docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs` 补 `:522`（波 2 腿 ⑥）`assert.equal(contentLines(settings), 304, "settings.css 行数不动（304 在盘）")`——本批 304 ⇒ 297 ⇒ 必红（原腿点名缺此点）。
- **澄清（不列 · 两则）**：① `docs/batches/2026-09-30-desktop-typography-unify-probe.mjs:215`——死类仅现于夹具 HTML、全档零断言引用（按盘复核）⇒ 不红；② 余档复核（本批触面符号全扫）——`docs/batches/2026-09-29-parity-b10-ui-w3.test.mjs`（`:225/:287/:296` 仅多传 `slot` 键、句柄用存留面、无行数钉）∥ `docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs:312`（否定断言）∥ `docs/batches/2026-09-30-desktop-typography-unify.test.mjs`（全局计数阈值）——三者均不红、不入名录。

**修正 2（🟡2 · 清单补注——取「补清单」）**

改动清单第 3 行 ∥ 机制节项 2 补：`thincoder-desktop/renderer/mount-settings-exits.mjs:15` 档头注收正——B10 W3 注「agent 段五出口（`agentPatch` ∕ `saveAgent` ∥ `namedOut` ∥ `applyNamedField` ∥ `toggleGuard`）」⇒ 退役后三出口（去 `agentPatch` ∥ `saveAgent` 名）；腿 ② 扫描面**不收窄**（零残留口径保——注面同去）。

**修正 3（🟡3 · 腿 ④ 钉回现盘）**

腿 ④ 判据句「表外顶层键拒 `invalid-patch`」删除，钉回现盘语义（实读 `thincoder-desktop/src/main/settings.mjs:319-333`）：「两有效键（`{patch,tier}`）同在 ⇒ `invalid-patch`（`:325`）∥ patch 非对象 ∥ 数组 ∥ 零条目 ⇒ `invalid-patch`（`:328-329`）∥ 零有效键（`{}` ∥ `{patch:null}`）⇒ 读面 `ok:true`（`:327`）∥ 表外顶层键 = **放行**（`:321-322` 只取两键——零拒；与 `:313`「未知键放行」同拍）∥ `slot-authority` 拒码保留（`:331-332`——防御面）」。落定 = 本批按现盘断言；T 批（desktop-channel-tier-retire）「载荷顶层有效键闭集——表外 ⇒ `invalid-patch`」形（`SETTINGS.md:385`）为 T 批在飞设计——**不引入本批断言**（先后序 = T 批实施轮）。

**修正 4（🟡4 · 回填面补名）**

U4 ∥ 设计档落点补跨档台账面：`i18n-settings.mjs` 文件账 = `docs/desktop/design/UI.md` §4.1（无 `SETTINGS.md` §3.1 行——`SETTINGS.md:284` 自记）⇒ 词面 156 ⇒ 152 与键数注 62 ⇒ 60（与 T 批 −1 键同档 ⇒ 终值 = 两批实施后盘值——U3）在 UI.md §4.1 回填；`SETTINGS.md` §3.1 行回填须与机检单读面 `docs/desktop/design/PROJECT.md` §4.1 同值（`SETTINGS.md:217` 纪律）——`settings.css` 304 ⇒ 297 两档同值收正；`settings.css`「越 300 在册」条目（`SETTINGS.md:215` 行 ∥ `PROJECT.md` §4.1 越层段）随回线**随消**（消解窗口 = 本批——结构性触碰触发）。

**修正 5（🔵5 · 注面范围点明）**

机制节项 1「注文收正」范围点明含 `thincoder-desktop/renderer/views/settings-agent.mjs:3`（档头「agent 字段行」）∥ `:10`（「敏感 / 非标量 ⇒ 只读回显」）∥ `:21-22`（「`array` / `null` / 对象 ⇒ 只读行 —— 防类型损坏」对位句）三处死面描述——与退役同步去（腿 ② 标识符源扫不覆盖注文 ⇒ 按此点名单执行）。

**修正 6（🔵6 · 简称展开）**

「D8 删净」⇒「**删净 8 处 ∥ 保留注 2 处（= 十处）**」（两落点 = 状态行 ∥ KD-903-6；消与需求卷 D8（`SETTINGS.md:296` = 索引状态读数）同符）。状态行随本轮 status 更新即正；KD-903-6 句以本块口径为准。

**本块口径**：零新语义（名录补齐 ∥ 判据钉盘 ∥ 回填面点名 ∥ 范围点明 ∥ 简称展开）；批单「上抛 4 条」条数不变（U1 内名录 = 六件）；复核补点（⑥ 件 A2 腿 ∥ 现状已红 ∥ 余档三则不红）以实测为准。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements coverage | 🟡 | U1 归档件名录不完整：自述「归档批内件 4 件将随退役断代」（`docs/batches/2026-10-04-desktop-generic-editor-retire.md:57`）／「U1 · 归档批内件断代处置（4 件 · 逐件腿点名）（`:105`）」，实测另有两件含本批必红的断言——`docs/batches/2026-09-30-desktop-residuals.test.mjs:347` 钉含 `slot` 的调用形（本批撤该实参，必红）；`docs/batches/2026-09-29-i18n-split.test.mjs:121` 冻结 `views/settings-agent.mjs`=230（本批 ⇒ ~192）＋`:58` `SETTINGS_DICT`=62（本批 ⇒ 60）；已列件 ③ `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs` 另有 `:522` settings.css=304 断言（本批 ⇒ 297）未点名 | 名录与逐件断言点按实测补齐（新增两件 + ③ 件补 `:522`）；`docs/batches/2026-09-30-desktop-typography-unify-probe.mjs:215` 仅携死类、无断言、不红——可不列 |
| 2 | Clarity / internal consistency | 🟡 | 改动清单与自设验收腿相抵：文件 3 改动点记 `:55` 注 ∥ `:177` 调用面撤 `slot`（`…retire.md:65`；机制节同口径 `:53`），但 `thincoder-desktop/renderer/mount-settings-exits.mjs:15` 档头注仍含 `agentPatch` ∕ `saveAgent` 名，而腿 ② 断言 renderer 树 `agentPatch` 零命中（`…retire.md:77`）——按清单实施该腿必红 | 清单补 `mount-settings-exits.mjs:15` 档头注收正（或腿 ② 扫描面收窄并注明依据），二者取一 |
| 3 | Acceptance verifiability | 🟡 | 腿 ④ 断言「表外顶层键拒 `invalid-patch`」（`…retire.md:79`）与现盘不符：`thincoder-desktop/src/main/settings.mjs:313` 记「未知键**放行**」、`:327` 表外顶层键走读面（`ok:true`）；现盘 `invalid-patch` 仅 `:325` ∥ `:329` 两径；该拒收形是 T 批（desktop-channel-tier-retire）在飞设计（`SETTINGS.md:385`），而本批边界自述写径「未知键放行」零触（`…retire.md:25`） | 腿 ④ 该句钉回现盘语义（`{patch,tier}` 同在 ∥ 零 / 非对象 patch ⇒ `invalid-patch`）；若确欲断言 T 批形，显式标 T 批依赖与先后序 |
| 4 | Document ownership / coordination | 🟡 | 回填面点名不全：U4 只名「§3.1 数回填」＋「本批五档行数」（`…retire.md:108`），但 `i18n-settings.mjs` 无 §3.1 行（文件账在 UI.md §4.1——`SETTINGS.md:284` 自记），且 §3.1 行须与机检单读面 `PROJECT.md` §4.1（`SETTINGS.md:217`）同值 | U4 ∥ 落点补名跨档台账面（i18n 行 = UI.md §4.1 ∥ settings.css 在册条目/§4.1 面），按盘同值收正 |
| 5 | Doc hygiene | 🔵 | 注文收正口径窄于残留：只约「去「泛化兜底」字样」（`…retire.md:52`），但退役后 `thincoder-desktop/renderer/views/settings-agent.mjs:10`「敏感 / 非标量 ⇒ 只读回显」、`:21`「`array` / `null` / 对象 ⇒ 只读行 —— 防类型损坏」、`:3`「agent 字段行」成死面描述（腿 ② 标识符扫不覆盖） | 点明注面收正范围含该三处（与退役同步去死面描述） |
| 6 | Clarity | 🔵 | 自造简称「D8 删净」（`…retire.md:9` ∥ `:101`）与需求卷 D8 同符（`SETTINGS.md:296` = 索引状态读数），须以「十处 = 删净八处 + 保留注两处」反推解码 | 展开为「删净 8 处 ∥ 保留注 2 处（= 十处）」——消同符歧义 |
| 7 | Doc state | 🔵 | 抽检既有读数漂移（非本批所致）：`SETTINGS.md:186` 记 `src/main/settings.mjs` = 331（as-of 2026-10-03），现盘内容行 = 360（与设计零触行自读「main `settings.mjs`(360)」`…retire.md:70` 一致） | 随下次回填按盘收正该行（本批零触面——报告不改） |

计数：🔴 0 ∥ 🟡 4 ∥ 🔵 3

VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-04 12:46 父侧代签批准**（用户 12:18「都自动跑吧」授权——全链自动）。

**三条件核验**：① 评审 pass（#19 · 🔴 0 · 🟡4 + 🔵3 全裁——🟡1–6 全数 Fixed（修正轮 #22 落定并经父侧核读：修正块 `:122-153` 逐处实读——U1 六件名录 ∥ `:15` 补注 ∥ 腿④钉盘（`src/main/settings.mjs:319-333` 现盘语义——T 批形不引入）∥ U4 跨档面 ∥ 注面三处点名单 ∥ 简称展开）；🔵7 = Deferred（既有漂移 `SETTINGS.md:186`——T 批冻结窗 + 非本批，随下次回填收正））；② 修正落地核验 ✓（上列逐处实读）；③ token 已签发（运行态，不入档）。

**批准范围** = 本批全量（agent 段泛化退役 + #635②⑤ 保留登记；净删 ≈ −103 行）。派发 = 实施舱（eng-coder · initial）。**跨批序注**：`i18n-settings.mjs` 键数与 T 批（−1 键）同档——终值 = 两批实施后盘值（U3 在册；G 先落、T 复核后落，T 实施轮按盘校准）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（审计 1 轮（四类 clean）+ fix 轮 1（3 处注面收正）+ 代码评审 1 轮（pass）；终态 clean）



**§5 实施记录（eng-coder · 2026-10-04 · initial 轮）**

**实施摘要**：五档净删（泛化编辑器全消）+ 批内件新档（五腿，先红后绿）。零新节点 ∥ 零新词键 ∥ 零新语义；具名面（18 键）∥ 其他段 ∥ `session:flags` 写面 ∥ 拒码（含 `slot-authority`）零触。

**逐档读数（as-of ⇒ 实读 ∥ 净删 ∥ 与设计预算）**

| # | 文件 | as-of | 实读 | 净删 | 设计预算 | 偏差说明 |
|---|---|---|---|---|---|---|
| 1 | `renderer/views/settings-agent.mjs` | 230 | 188 | −42 | ≈ −38 | 注面收正（档头 3 行合 2 ∥ `agentBody` 注 5 行合 2 = −4）∥ 删块随带空行（−1）——同设计「注面收正」面，零语义 |
| 2 | `renderer/mount-settings-segments-agent.mjs` | 156 | 98 | −58 | ≈ −54 | `listOf` 保留（父裁——见决策表）∥ 四删块随带空行（−4）——设计清单未计分隔空行 |
| 3 | `renderer/mount-settings-exits.mjs` | 270 | 270 | ±0 | ±0 | ✓（`:15` 注收正 ∥ `:55` 注句 ∥ `:177` 调用面撤 `slot`——皆原位） |
| 4 | `renderer/i18n-settings.mjs` | 156 | 152 | −4 | −4 | ✓（两键 × 两语 = 4 行；键数注 62 ⇒ 60 实读两语各 60 键） |
| 5 | `renderer/settings.css` | 304 | 297 | −7 | −7 | ✓（`:250-256` 净删；`.settings-submit` 保留） |

合计净删 **−111**（设计 ≈ −103）；偏差全在 1 ∥ 2 两档，来源 = 注面收正 ∥ 删块随带分隔空行（设计数为「≈」预算，未计空行）。

**决策透明表（逐条）**

- **件② `listOf` 保留——父裁（2026-10-04）**：设计删件清单含 `listOf`，但保件 `applyNamedField`（`:63`）实消费（`listOf(receipt.fields)`）——删之则运行期 ReferenceError、腿④必红；裁定 = 保留（设计清单疏漏，以「五出口 ⇒ 三 ∥ 回执 `fields` 就地刷新」为准）；替代案（`:63` 内联 `Array.isArray(…)`）不取（违「净删为主 · 零新语义」）。
- **注面收正两处（范围外披露）**：① `views/settings-agent.mjs` 档头「缺 handlers ⇒ `wire` 落 `disabled: true`」⇒「控件落 `disabled: true`」（`wire` 导入随保存钮删——死机制句）；② `i18n-settings.mjs` 档头键族描述去「agent 段：只读标 · 保存」（该族两键净删后本档零 agent 键）。两处皆事实收正、零语义。
- **键数注写法**：`i18n-settings.mjs` 键数注保持单行（62 ⇒ 60 + 退役一笔），以保设计 −4 净删预算。

**先红后绿读数（批内件五腿）**

- **RED（实施前）**：`4 pass ∕ 4 fail`——腿① 红（4 个 `data-field` 节点、含表外夹具）；腿② 红（8 命中：exits `agentPatch`；segments-agent `onSaveAgent` ∥ `agentPatch` ∥ `rowValue` ∥ `currentFields`；view `settings:saveAgent` ∥ `onSaveAgent` ∥ `agentFieldNode`）；腿③ 红（en 含 `settings.agent.save`）；腿⑤ 红（css 含 `.settings-field-readonly`）；**腿④ 四子项首轮即绿**（零回归腿——预期，非红）。
- **GREEN（实施后）**：`8 pass ∕ 0 fail`。
- **复跑**：仓根 `thincoder/`：`node --test docs/batches/2026-10-04-desktop-generic-editor-retire.test.mjs`（`rc-resolve.mjs` 预载）。

**机检读数**

- `node --check`：四 `.mjs` 全 exit 0（`settings.css` 非 JS——由腿⑤源扫覆盖）。
- `node scripts/doc-check.mjs`：**exit 0**；✗ 343 全「列报 · 不入闸」（既有迁移期引文），**0 闸红**；行数面报告 12 条差异含本批 4 条（`SETTINGS.md:196`（188）∥ `:210`（98）∥ `:215`（297）+ `UI.md:502`（152））= 表值待回填——**doc 面回填不在本舱写域**（派单禁「不碰 `SETTINGS.md` 等」——T 批同档在飞），留设计/父侧面。
- 越表自证：`git status` —— 本舱改动 = 五档（M：`renderer/views/settings-agent.mjs` ∥ `renderer/mount-settings-segments-agent.mjs` ∥ `renderer/mount-settings-exits.mjs` ∥ `renderer/i18n-settings.mjs` ∥ `renderer/settings.css`）+ 批内件测试档（新）+ 本档 §5；`src/main/providers.mjs` 的 M 系他批（T）并发写，非本舱。

**上抛 ∥ 披露（续）**

- **doc 面行数回填仍开**（含 `UI.md` §4.1 i18n 行 156 ⇒ 152；`SETTINGS.md` §3.1 行须与 `PROJECT.md` §4.1 同值收正——修正 4）。
- **i18n 键数终值待 T 批复核**（U3 在册；本批落盘 = 60）。
- 归档批内件断代处置（U1 六件）∥ 真机面走查 = 父侧执行面。

**§5 补记（fix 轮 ∥ 内部审计 ∥ 内部代码评审 · 2026-10-04——含对前文两处读数的更正）**

**更正（对前文）**：上表 ⑤ 与机检节的 `settings.css` 终值 = **296（−8）**（非 297）：fix 轮按修正 4「`settings.css`『越 300 在册』条目随回线**随消**」净删档头自携句一行（`:10`「**越 300 在册**（…消解窗口 = 本档下次结构性触碰的批…）」——修正 4 只点名 `SETTINGS.md:215` ∥ `PROJECT.md` §4.1 两处 doc 副本，档头自携副本 = 设计漏点；本批即该「结构性触碰」⇒ 句死 ⇒ 净删）。`doc-check` 行数面本批 4 条终值 = **188 ∥ 98 ∥ 296 ∥ 152**；合计净删 = **−112**。**行数终值：188 ∥ 98 ∥ 270 ∥ 152 ∥ 296**。

**内部审计（explore · 1 轮 · 只读）**：四类偏差（部分实现 ∥ 静默简化 ∥ 越表 ∥ 文档漂移）= **零命中**；另报注面残留 3 处（🟡1 ∥ 🔵2）——已入 fix 轮逐处处置：
- 🟡 `settings.css:10` 越 300 在册自携句（失效）⇒ 净删（见上「更正」）；
- 🔵 `i18n-settings.mjs:18` 消费面名录：`views/settings-agent.mjs` 对本字典消费面随两键净删归零（其词键全在 `i18n-views.mjs`）⇒ 名录去该项、注数 10 ⇒ **9**；
- 🔵 `mount-settings-segments-agent.mjs:31` 理由句「数值键 null 被核类型表拒」失实（#645 后核 `_NULL_CLEARABLE` 已含 `number`/`boolean`——`thincoder-core/agent-tools/settings.mjs:73` ∥ `:155` 放行）⇒ 收正为「无效数值（空 ∕ 非数）∕ 目标缺位 ⇒ `undefined`（调用面零发送）」（行为零改）；
- 两处登记/列报项未动（设计已册）：U1 六件断代（修正 1）∥ doc 面回填（修正 4/U4）。
- fix 轮后复跑：**8 pass ∕ 0 fail**（五腿全绿维持）；renderer 树六符 + 两死类零命中；四 `.mjs` `node --check` OK。

**内部代码评审（advisor · 1 轮 · 同步）**：**pass**——🔴 0；🟡1 = 协调项（doc 面回填交班——非缺陷 · 不阻断）∥ 🔵2 = 测试缝未复位 + 证据基线披露；**无 must-fix**。处置：🟡1 留父侧 doc 面（本舱写域外，碟面值已就绪：188 ∥ 98 ∥ 296 ∥ 152 + 键数 60）；🔵2 记录不修（本件无害——`node --test` 按档分进程、其后腿零配置面读；评审后不再改动已核电子件）；🔵3 由父侧收口复跑闭合。

**终态**：**clean**（审计 1 轮 + fix 1 轮 + 代码评审 1 轮；零未决返工项；剩余 3 项皆父侧 ∥ 设计面记录项）。

## §6 验证与收口（父代理）

**收口判词：已收口 2026-10-04**（泛化编辑器退役（桌面 · #635①）——批链：设计 → 评审 #19（🔴0/🟡4/🔵3 全裁）→ 修正轮 #22 → §4 代签（12:44）→ 实施 #26（审计 clean ∥ 代码评审 pass）→ 本节核销）

- **判据链**：批内件五腿 8 例 **先红 4✖/4✔ → 后绿 8✔/0✖**（父侧收口复跑：仓根 `node --test docs/batches/2026-10-04-desktop-generic-editor-retire.test.mjs` = **exit 0 · tests 8**）∥ `node --check` 四 `.mjs` exit 0（css 由腿⑤源扫覆盖）∥ as-built：`views/settings-agent.mjs` **188** ∥ `mount-settings-segments-agent.mjs` **98** ∥ `mount-settings-exits.mjs` **270**（±0——`listOf` 父裁实扣后）∥ `i18n-settings.mjs` **152**（键数两语各 **60**）∥ `settings.css` **296**（**回线 ✓**）——合计净删 **−112**（设计 ≈ −103；超估逐条归因在 §5）。
- **收口测试行**：本批单元件 = `docs/batches/2026-10-04-desktop-generic-editor-retire.test.mjs`（220 行 · 8 例 · 随批留存）；集成面 = 无新增 ∥ 无修订；仓套件 = 未跑（仓 `test/` 树空清单——批内件复跑为本批唯一运行）。
- **doc-check**：**exit 0**（父侧收口直跑）；行数面四条报告态随回填齐平（`SETTINGS.md:196/:210/:215` + `UI.md:502` = 本批四面——收口笔后消解）。
- **收口笔（父侧 · 逐处可 revert）**：① `docs/desktop/design/SETTINGS.md` §3.1 三行走读齐平（188 ∥ 98 ∥ 296——**越 300 在册条目消解**）；② `docs/desktop/design/UI.md` §4.1 i18n 行走读齐平（152 ∥ 键数 60——T 批终值 59 在飞）；③ `docs/desktop/design/PROJECT.md` §4.1 越层段回线除名（十六 ⇒ 十五）+ D33 块 settings 侧预案注销；④ 三档变更记录行随拍。
- **在册（非阻断）**：① U1 六件断代 ∥ 真机面走查 = 设计已册（用户面）；② T 批在飞同档（`mount-settings-exits.mjs` ∥ `i18n-settings.mjs`——本批 `:15` 注收正零回退（已点名防撞），键数终值届 T 盘）；③ 🔵2 测试缝未复位 = 记录不修（本件无害）；④ 🔵7 既有漂移（`SETTINGS.md:186` `src/main/settings.mjs` 331 —— 现盘 360）随 T 批实施后回填窗收正（在册）。
- **前批遗留交叉核**：无（独立批）。
- **结算**：台账 #903 核销 ∥ 签入（双远端）。
