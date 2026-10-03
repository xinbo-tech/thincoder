# 2026-10-03 · 首跑渠道提示修复
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 12:56 走查（附截图）「初次使用的用户可能胡碰到个bug，已经配置好了第一个provider和key，但是界面仍然显示未配置API密钥」→ 父侧根因链实读 + 数据层复现 → 12:59 用户裁定「好，A+B」（A 真因透传 ∥ B 首跑补全，两条全做）。
> 台账 = #840（desktop · 归批）。前情 = 无（独立批——与今日发布线相邻但独立）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-03
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-03 12:5x）**

**来源**：用户 12:56 走查（附截图，粘贴件 `.thincoder/tmp/paste-murx5xdskb8e-0.jpg`——画面：composer 上方提示行「未配置 API 密钥 — 点击 ⚙ 设置」∥ 模型位「…」∥ effort=MAX）。用户原话逐字：「**初次使用的用户可能胡碰到个bug，已经配置好了第一个provider和key，但是界面仍然显示未配置API密钥**」。

**根因链（父侧实读 file:line + 真核数据层复现）**：
① **数据层**：运行时 provider 恒由 `defaultModel`（`provider:model` 复合串）解析（`thincoder-core/model-ref.mjs`——裸 provider ∕ 裸 model 一律拒；无效 ⇒ `{}` 不抛）；`loadConfig()` 于 `thincoder-core/config.mjs:328-335` 落 `providerInvalidReason`。**复现读数**（真核 + 临时夹具家 `%TEMP%\tc-repro-4ZY78Z`，已跑）：仅 provider+key（无 `defaultModel`）⇒ `provider={}` + reason「defaultModel 未设置（config 顶层 defaultModel — 新会话起点；/config → 默认模型 设置）」；`defaultModel:"deepseek:"`（空模型段）⇒ reason「invalid model reference … model part is empty」；正常号 ⇒ 有效 ✓。
② **回执丢弃真因**：`thincoder-desktop/src/main/turn-input.mjs:64-66`——`agent._providerInvalid` ⇒ 只回 `{ ok:false, reason:"provider-invalid", started:false }`；`_providerInvalidReason`（真因串）不出档。
③ **渲染面硬映射**：`renderer/composer-sync.mjs:77-81`（`:79`）——`provider-invalid` 一律 ⇒ `composer.send.noProvider` = 「未配置 API 密钥 — 点击 ⚙ 设置」（`renderer/i18n-views.mjs:229` zh ∥ `:67` en）。⇒ **key 已配仍被指去配 key = 误导首跑用户**。
④ **缺环产生**：`defaultModel` 写入**仅在表单 `active` 勾选时**发生（`renderer/mount-settings-exits.mjs:59-88` submitChannel → `src/main/providers.mjs:165-171`）；首跑路径若未勾 ∕ 向导步 2 未走完 ⇒ 缺环 ⇒ ①②③连环触发。**开放项（设计轮实读落定）**：providers 表单 markup 的 `active` 缺省态 ∥ 向导步 1 提交是否带 `active`。

**授权**：用户 12:59「**好，A+B**」——**A = 真因透传**（回执携真因；渲染面按真因出词——真缺渠道 ∕ 缺 key 才用现词）∥ **B = 首跑补全**（首个渠道+key 落库且模型已知 ⇒ 未设时自动补 `defaultModel`；向导收尾校验引导）。

**影响面 ∥ 流程**：桌面 0.10.1 今日已上线 ⇒ 本修复若成将随 **0.10.2**（发布 = 用户门，另窗）。本批走完整链（设计 → 用户点火评审 → 批准 → 实现）；设计单落点由设计轮定（候选 = `docs/desktop/design/` 的 UI ∕ IPC ∕ 设置面档）。

**§1 三端对照（用户 13:0x 问「其他两端是否会碰到同样的问题？」——父侧实读）**

结论：**只有桌面会撞**；CLI ∥ VSC 各自有自愈面（均**不需改动**）：

- **CLI = 不会**（三层证据）：① 首跑向导**必写 `defaultModel`**（`thincoder-cli/src/cli/setup-wizard.mjs:81` 写 + `:90` 明示读数；`src/tui/wizard.mjs:174/194`「首配模型即写 defaultModel」）；② 即使缺环（非向导路径加渠道）⇒ **TUI 首帧直接弹模型选择器**（D-S2：`src/tui/index.mjs:51-57/223` `promptProviderIfInvalid`）——不是错误行，是**自助修复入口**；③ 其余面的提示**准确**：启动提示行「尚未设置默认模型（config.defaultModel…）：/config → 默认模型 设置一次」（`index.mjs:63-64`）∥ 无头面「未配置有效模型（defaultModel "…"：<真因>）」（`command-interactive.mjs:35-37`）∥ ACP 明分「无 key」与「key 在位但 defaultModel 不可解析」两类（`acp/handlers-session.mjs:42-45`）。
- **VSC = 不会**（解析链兜底）：`panel-turn-stages.mjs:57-74`——显式 provider 缺席 ⇒ 槽渠道（有 key）⇒ `resolveProviders().activeProvider` ⇒ **扫全体找任一有 key 渠道**（`:69-72`）；模型面 `presets.mjs:107-117` `resolveDefaultModel`——`defaultModel` 不属本渠道 ⇒ **退渠道默认单值 `entry.model`**。⇒ 「已配渠道+key」在 VSC **直接能发**，不触发无效态。其错误行 `error.provider`（`:78`，词 = 「未配置 API 密钥 — 点击 ⚙ 设置」——桌面现词即沿此基准）**只在真·一个带 key 的渠道都没有时**出现 ⇒ 词义与真实条件相符（非误导）。
- **桌面 = 唯一**：① 装配走核的 `defaultModel` 严格解析（无 VSC 式「找任一有 key 渠道」兜底）；② 且回执丢弃真因（`turn-input.mjs:64-66`）+ 渲染面硬映射「缺 key」（`composer-sync.mjs:79`）⇒ 「配好 key 仍被指去配 key」= **桌面独有**。
- **设计素材（供设计轮，不扩范围）**：VSC 兜底链形（同上 file:line）可作 B 的对照读本；「桌面是否也引入解析兜底」**不在本批范围**（本批 B = 保存时补写 + 向导校验，用户 12:59 已裁）。

**§1 追加（用户 13:07 原则裁定 ——「三端界面可以不一样，但是逻辑应该是一样的」）**：父侧核读 = 本案三端差的**不止界面、是逻辑**：CLI = 严格（跟核判据）+ 引导（`cli/src/tui/index.mjs:56-68`）∥ 桌面 = 严格 + 错报（本批在修）∥ **VSC = 宽松——接入面自建回退链绕过核判据**（`vscode/src/extension/panel-turn-stages.mjs:57-78` + `presets.mjs:107-117`）。⇒ 「缺 `defaultModel`」这一态的**判定与处置**为归一对象，已登记独立候选 **台账 #841**（U1 严格+引导 ∥ U2 宽松静默 ∥ U3 宽松+明示；**本批 A+B 与任何档位无冲突**——A（真因透传）在任何档位下均为正确兜底，B（保存时补写）降低该态发生率）。**本批范围不变**（桌面 A+B；CLI/VSC 零触）。

**§1 父侧裁断（设计轮 #1 上抛项批复 · 2026-10-03 13:1x）**——评审射程按此口径：

| 项 | 裁 | 理由 |
|---|---|---|
| **U-2**（向导「采用」接线，超派单字面） | **纳入** | B② 守卫把用户导入模型步——该步「采用」现为禁用态（缺 `onUseModel` 接线）⇒ 不接线则 B 的引导 = **死路**；属 B 的必要闭合，非扩范围 |
| **U-3 / C**（无效装配不入表） | **纳入** | A 的承诺 = 「按真因修即可用」；装配表缓存无效 agent（清点仅 session:delete ∥ 切项目）⇒ 修正后再发仍报同一句 ⇒ **误导复现**；属 A 的承诺闭合 |
| **U-1 ∥ U-4**（`providers.mjs` 315 ∥ `agent-host.mjs` ~301 越 300 软线） | **续期** | 本批 = 定点修复；两处均行级小修，拆分会让 diff/评审面膨胀。残项在册（§2 越层五档同判） |
| **KD-5**（补写条件「缺失∥无效」字面不一） | **取「仅缺失」** | 与 §1 禁止项（静默覆盖既有非空）一致；无效-非空态由 A 词面如实呈现（用户可经钮改） |
| **U-9**（设置面本态零候选 ⇒ 无 in-UI 补设路径） | **另批** | 已挂台账 **#842**（归批）；本批 13:09 钮已避死端（改指输入区模型菜单） |

另：§2 为**两次 append**（设计单 → 13:09 补录）——**评审以补录为准**（A 半呈现形 = 词+内联动作钮「选择模型」，非首稿的纯文字指路句）；两稿并存属 append-only 记录性质，非冻结态残留。

**§1 活体实况追加（用户 13:17 走查 · 试用用户实机）**：「让用户**手动选择了模型**（能正常设为 deepseek-flash），但输入 test 回车 ⇒ 仍出「未配置api密钥…」，**无法会话**」——父侧双证核实：

- **码面**：桌面全树 `_providerInvalid` **仅一处消费**（`thincoder-desktop/src/main/turn-input.mjs:64` 的发送门），**零复验清除点**；装配序 = `assembleAndLoad`（`agent-host.mjs:173-183`）先装配（按 config 判无效）→ 后 `loadAgentSlot`（施加槽选中模型）——**标记仍在 ⇒ 每发恒拦**。**对照 CLI 同族**：`command-interactive.mjs:148-149`「修复后复验清除标记，仅当两者都无效才弹重选（`validateProvider` 幂等）」⇒ 桌面**缺这一环**（= 设计轮已发现的 **KD-8**）。
- **两处吞选择的环路**（无论用户从哪条路选模型）：① 会话级选择（`session:prefs` 写 + 施加）⇒ 无 post-slot 复验 ⇒ 标记不清（KD-8 治）；② 配置级写盘（settings「采用」等的 `settings:agent`）⇒ **装配表不清**（`agent-host.mjs:185-198` 缓存无效 agent；配置写盘零清点）⇒ 旧标记复用（设计 **C** 治）。
- **⇒ 结论**：本批设计（**KD-8 槽复验 + C 无效不入表**）**正中此实况**——设计无需变更；**验收补锚**：批内件须覆盖「会话级选模型（槽写 + 施加）⇒ 再发探**放行**」= 用户 13:17 活体路径（实施轮 T 集纳入）。

**§1 父侧更正（2026-10-03 13:43 · 13:09 口径系误读——作废）**：用户 13:43 澄清：13:09 那条实为拼音误打，原话 = 「**按你倾向走**」（采纳父侧倾向——与 13:10 同义），**非「界面加按钮」**。父侧误读后果（**全部作废**）：① 内联动作钮（钮词 `composer.send.chooseModel` ∥ 锚 `composer:chooseModel` ∥ handler 面含 (b) DOM 触发行）∥ ② AC-7 钮件 ∥ ③ T2 钮断言 ∥ ④ `chat-composer.css` 钮样式规则 ∥ ⑤ KD-3「动作归钮」修订——终形回退为**词面-only**（准确词 `composer.send.noDefaultModel`）。**保留不动**：A 真因透传（`providerKind` ∥ 载体 `{reason,kind}` ∥ 词路由 ∥ 新词 ×2 语）∥ B① 补写 ∥ B③ 接线 ∥ C 不入表 ∥ KD-8 槽复验（13:17 活体路径）——用户 12:56 ∥ 12:59 ∥ 13:17 三批实需**零减**。修正轮 **`#7`** 已派（收正 §2 ∥ `COMPOSER.md` ∥ `IPC.md`）；实施轮 `#5` 已接**停手令**（钮面待收正，其余照跑）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（更正轮 #7：词面-only 终形收正 ＋ #840 触面四档（IPC ∥ COMPOSER ∥ SETTINGS ∥ SHELL）全域扫净（用户 13:43 更正 · 2026-10-03））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-03）**

**本批条目（覆盖）**

- **A · 真因透传与词面（用户 12:59 裁「A」）**：`msg:send` 的 `provider-invalid` 回执携真因分类 `providerKind`（闭集 `defaultModel` ∥ `provider`）；渲染面按类出词——缺 ∕ 无效 `defaultModel` ⇒ 新词（指向「选择默认模型」的真实出口）；真·无渠道 ∥ 渠道条目结构不全 ⇒ 保留现词。
- **B · 首跑补全（用户 12:59 裁「B」）**：① `provider:save` 成功径——条目有效 ∧ `defaultModel` 缺失 ⇒ 补写（既有非空零覆盖）；② 向导收尾——`defaultModel` 仍缺 ∧ 渠道非空 ⇒ 不完成，引导模型步；③ 向导模型步「采用」接线（引导须可操作——KD-6）。
- **C · 配置写盘后装配自愈（设计增项——B 之完成面；KD-7 ∥ U-3）**：无效装配不入装配表 ⇒ 修正配置后下次发送按盘上新态重装配。
- **不覆盖（边界）**：`provider:setKey` ∥ `delKey` ∥ `setProxy` ∥ `settings:agent` 写语义零改；改 `provider:save` 既有 `active:true` 支；引入 VSC 式解析兜底；改核（`thincoder-core/**` 零触）；CLI ∥ VSC 零触；新第三方依赖零。
- **需求档合规检查**：需求卷 `D11`（向导可完成）——B② 守卫只在「渠道非空 ∧ `defaultModel` 缺」触发，「无 config」态零改 ⇒ 不抵触；需求档 ∥ 需求卷本批零改（笔 = 主 agent；如需 D 条目见 U-7）。

**设计档落点**：机制单源 = 本段 §2；长档按「一类问题一档」分持——`docs/desktop/design/IPC.md`（回执形 ∥ `provider:save` 契约 ∥ 设置族注 8①）· `docs/desktop/design/COMPOSER.md`（词面映射本批注）· `docs/desktop/design/SETTINGS.md`（首跑补全本批注）；三档互指不重述（D2）。

**机制设计 —— A（真因透传）**

1. 回执形 = **加性扩键**（KD-1）：`{ ok:false, reason:"provider-invalid", providerKind:"defaultModel"|"provider", started:false }`——`reason` 裸码零改（现渲染面唯一判据 = `renderer/composer-sync.mjs:79`；E2E 锚 `[composer] msg:send failed: provider-invalid` 逐字不动）。**逐消费者核**：`provider-invalid` 现消费面 = `composer-sync.mjs:79`（词路由）∥ `src/main/ipc.mjs:186-191`（注面）∥ 两个批内件（见受影响表）；回执其余消费者（`composer-wire.mjs` `recordFailure` ∥ `healLate` ∥ `sendQueued`）只读 `ok` ∥ `started` ∥ `queued` ∥ `degraded`——零受影响。
2. 分类判据 = **结构判定**（零字符串嗅探、零解析副本）：`src/main/turn-input.mjs` 纯函数，取装配产物已算值——`agent.config.provider?.name` 非空 ⇒ `provider`（解析已通过 ⇒ 无效因在条目结构〔缺 `baseURL` 等〕，修点在渠道面）；`defaultModel` 非空而解析未过（未知渠 ∥ 模型段空 ∥ 形态非法）⇒ `defaultModel`；`defaultModel` 缺 ∥ 空 ⇒ 渠表空 ? `provider` : `defaultModel`；config 不可用（测试桩 ∥ 缺）⇒ `provider`（保守——落回现词）。
3. 词面（`renderer/i18n-views.mjs` 单源、两语成对；新键 **`composer.send.noDefaultModel`**）：zh `默认模型未设置或无效 — 点击 ⚙ 设置 → 模型与档位` ∥ en `Default model missing or invalid — click ⚙ Settings → Model & tier`。判据 = 用户原话精神（语句指向真实可修的下一步）：「选择默认模型」的桌面可达出口 = 设置面「模型与档位」段「采用」（`renderer/mount-settings-exits.mjs:128-139` `useModel` → `settings:agent` 写 `defaultModel`）；词内「模型与档位」逐字 = 段名单源（`renderer/i18n-settings.mjs:37` / `:102`）。
4. 失败态载体（`renderer/composer-wire.mjs:61-65`）：`failed` 裸串 ⇒ `{ reason, kind }`（`failure()` 单消费点 = `composer-sync.mjs:143`，已核）；console 行逐字保持。
5. 词路由（`renderer/composer-sync.mjs` `failedNotice:77-81`）：`provider-invalid` ⇒ `kind === "defaultModel"` 选新词 ∥ 否则现键 `composer.send.noProvider` 零改；余码零改（`composer.send.failed` + `${reason}`）。

**机制设计 —— B（首跑补全）**

1. 补写（`src/main/providers.mjs` `providerSave:147-173` 邻域）：保存成功后——条目有效（`name+model+baseURL` 全非空）∧ `defaultModel` 缺失（非串 ∥ trim 空）⇒ 经同一写盘执行体 `writeConfigAtomic` 补写 `defaultModel = "<name>:<model>"`；写失败 ⇒ 回执 `{ok:false, reason}`（同 `active` 支形）。既有 `active:true` 支零改（显式意图——覆盖写在册）；两支排他（`active:true` 不重入补写支）。
2. 向导收尾守卫（`renderer/mount-onboarding.mjs` `finishWizard:62-72`）：`config:read` 成功 ∧ `config.defaultModel` 缺 ∧ `config.providers` 非空 ⇒ 不进完成径——步 2 + notice 码 `no-default-model`（`views/settings.mjs` `REASON_WORD:52-67` +1 码 → `settings.reason.noDefaultModel` 词对住 `i18n-settings.mjs`：zh `尚未设置默认模型——请在「模型」步骤选择后再完成` ∥ en `No default model set — choose one in the Model step, then finish`）+ 候选面同径装载（同 `nextStep` 步入步 2 径）。渠道空 ⇒ 现行为零改（零动作可走到尾 ∥ 模型步零候选无可行动作；该态由 A 的 `provider` 类如实呈现）。
3. 模型步接线：`createWizard` 增注入 `useModel`（单一实现 = `exits.handlers.onUseModel`；注入点 = `mount-settings.mjs:212-216`）⇒ 步 2 候选行「采用」可操作（现读禁用——`views/settings-sections.mjs:70-72` 判 `handlers.onUseModel` 缺 ⇒ `wire` 落 `disabled`；向导 handlers 六出口无此键，`mount-onboarding.mjs:75-87`）。

**机制设计 —— C（无效装配不入表）**

`src/main/agent-host.mjs` `ensure:185-198`：装配完成时 `agent._providerInvalid === true` ⇒ 不入 `agents` 表（`usageTally` ∥ 在途面零动）；下次发送按盘上新态重装配。理由 = 现「同键复用」恒缓存无效装配（`agents` 清点仅 `session:delete` ∥ 切项目两径——`ipc.mjs:151` ∥ `turn-driver.mjs:227`；配置写盘零清点）⇒「失败发送 → 修正（B① ∥ `useModel` ∥ 改钥）→ 再发」会话内不自愈，且 A 词面会再指「选择默认模型」——该动作刚完成（**误导复现**）。成本面 = 修正后首发即重装配（有效 ⇒ 入表复用）；无效态逐发重装配（用户按键触发 ∥ 首跑配置小——有界）。

**受影响文件表（file:line 级 · 现行 ⇒ 预期）**

| # | 文件 | 现行 ⇒ 预期 | 改动点 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/turn-input.mjs` | 119 ⇒ ≈135 | `send` 回执增 `providerKind`（`:64-66`）＋分类纯函数（档级） |
| 2 | `thincoder-desktop/src/main/providers.mjs` | 315 ⇒ ≈328 | `providerSave` 补写支（`:163-173` 邻域）＋注面（越层在册——U-1） |
| 3 | `thincoder-desktop/src/main/agent-host.mjs` | 298 ⇒ ≈301 | `ensure` 无效不入表（`:185-198`；贴层 → 或越 300——U-4） |
| 4 | `thincoder-desktop/src/main/ipc.mjs` | 276 ⇒ ≈277 | `msgSend` 注面随动（`:186-191`） |
| 5 | `thincoder-desktop/renderer/composer-wire.mjs` | 262 ⇒ ≈268 | `recordFailure` 携 kind（`:61-65`） |
| 6 | `thincoder-desktop/renderer/composer-sync.mjs` | 302 ⇒ ≈305 | `failedNotice` 类路由（`:77-81`；越层在册——判词值/行级小修 ⇒ 续期） |
| 7 | `thincoder-desktop/renderer/i18n-views.mjs` | 374 ⇒ ≈378 | `composer.send.noDefaultModel` ×2 语 ＋组注（越层在册——续期） |
| 8 | `thincoder-desktop/renderer/i18n.mjs` | 408 ⇒ ≈409 | 键数链注续链（越层在册——续期） |
| 9 | `thincoder-desktop/renderer/i18n-settings.mjs` | 156 ⇒ ≈159 | `settings.reason.noDefaultModel` ×2 语 ＋档头键数注 |
| 10 | `thincoder-desktop/renderer/views/settings.mjs` | 398 ⇒ ≈399 | `REASON_WORD` +1 码（越层在册——续期） |
| 11 | `thincoder-desktop/renderer/mount-onboarding.mjs` | 89 ⇒ ≈103 | 守卫 ＋`useModel` 接线 ＋注 |
| 12 | `thincoder-desktop/renderer/mount-settings.mjs` | 249 ⇒ ≈250 | `createWizard` 注入 `useModel`（`:212-216`） |
| 13 | `docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs` | 新档 ≈170 | 批内件（T1–T6） |
| 14 | `docs/batches/2026-09-29-send-busy-timing.test.mjs` | 325 ⇒ ≈327 | T4 期望改钉新形（`:144`） |
| 15 | `docs/batches/2026-09-29-hatch-clearance-2.test.mjs` | 325 ⇒ ≈327 | L10 路由钉改形（`:203` 邻域） |
| 16 | `docs/desktop/design/IPC.md` | 508 ⇒ +4 行 | `msg:send` ∥ `provider:save` 两行 ＋设置族注 8① ＋变更记录 |
| 17 | `docs/desktop/design/COMPOSER.md` | 253 ⇒ +10 行 | 本批注 ＋变更记录 |
| 18 | `docs/desktop/design/SETTINGS.md` | 357 ⇒ +12 行 | §2.14 本批注 ＋变更记录 |

行数口径 = 内容行数（文末换行不计）；「预期」= 设计预算，实施轮按盘回填；越层在册五档（`composer-sync` ∥ `providers` ∥ `views/settings` ∥ `i18n` ∥ `i18n-views`）本批均判「行级 ∥ 词值小修」⇒ 续期（U-1 ∥ U-4 为两档裁定面）。

**验收对照（回指本批条目）**

| 条目 | 验收判据 | 机检 / 实证面 |
|---|---|---|
| A | 回执携 `providerKind`（闭集二值 · 结构判定）∥ 类 → 词路由在场 ∥ 新词两语成对 | 批内件 T1 ∥ T2；修复前读数 = §1 ②（裸码、真因不出档） |
| B① | 仅 provider+key 夹具 ⇒ 保存 ⇒ `defaultModel` 补写 `name:model`；既有非空零覆盖；`active:true` 支照旧；坏条目零写 | 批内件 T3（临时 config · 核 `config-io.mjs:37` `_setConfigPathForTest` 缝） |
| B②③ | 守卫纯逻辑：渠道非空 ∧ 缺 ⇒ 步 2 + notice 码；渠道空 ⇒ 完成径零改；模型步 handlers 携 `onUseModel` | 批内件 T4 ＋源码判据 |
| C | 无效装配：`ensure` 两次 ⇒ 装配恰两次；有效 ⇒ 恰一次（同键复用保持） | 批内件 T5 |
| 三端零触 | 改动集全数落 `thincoder-desktop/**` ＋批档目录；`thincoder-core/**` ∥ `thincoder-cli/**` ∥ `thincoder-vscode/**` 零触碰 | 实施轮 `git diff --name-only` 核对（VSC 基准词 ∥ 兜底链 ∥ CLI 三面零改） |
| 复现对（总） | 修复前 = §1 ①②（数据层实读 ∥ 回执 ∥ 硬映射）；修复后同夹具：A 出词正确 ∥ B 补后路径可发送（补写 ⇒ `loadConfig().provider` 有效 ＋ 首发重装配） | 批内件 T1–T5 ＋ §1 读数对拍 |

**关键决策（含被否）**

- **KD-1 回执加性扩键（非改写 `reason`）**：`reason` 为现渲染面唯一判据 ∥ E2E 锚逐字；改写 = 全链重钉。被否：结构化 `reason` 对象 ∥ 新裸码 `provider-invalid:defaultModel`（与现有码风格相抵、消费者全改）。
- **KD-2 分类 = 结构判定（非字符串嗅探）**：核真因串为中文 ∕ 非契约（`thincoder-core/model-ref.mjs:58-66`）；嗅探 = 跨层脆链。被否：按真因串前缀匹配 ∥ 主侧直传核真因串（双语面不可用）。
- **KD-3 词面指向设置面「模型与档位」段**：该段「采用」= `defaultModel` 真写口（`mount-settings-exits.mjs:128-139`）。被否：指「输入区模型菜单」（写会话槽 ∥ 不改 `defaultModel`——非真实下一步）。
- **KD-4 补写触面 = 任意保存（非「首个渠道」）**：条件「缺失」已自限（正常配置零触发 ∥ 既有非空零触碰）；限「首个」需引计数判据且漏「渠已在而缺环」态（本次缺陷实况）。副作用面 = 缺失态下任意成功保存使新条目成默认起点——该态「有」优于「无」，选择权不损（设置面可随时改选）。
- **KD-5 补写条件 = 仅缺失（非「缺失 ∥ 无效」）**：承 §1 用户原话「未设时自动补」＋派单重述「在 `defaultModel` 缺失时补写」＋禁止项「静默覆盖用户既有非空」（无效非空 = 既有非空）；无效态由 A 准确词引导。派单文面两处取文（「缺失 ∥ 无效」∥「缺失时补写」）不一致——取后者，本裁为设计轮裁定面，评审可推翻。
- **KD-6 向导守卫条件与零动作保留**：触发限「渠道非空 ∧ 缺」；渠道空保持完成径（零动作可走到尾 ∥ 模型步零候选无可行动作）；守卫须配模型步接线（否则引导 = 死路——U-2）。被否：无渠道也拦完成（破零动作面 ∥ 引导无落点）∥ 放任现状（不静默完成之裁不满足）。
- **KD-7 无效装配不入表（设计增项）**：验收「B 补后路径可发送」在「先失败后修正」时序下须 C 方能成立；最小形（一行条件）∥ 零订阅 ∥ 零新通道。被否：配置写盘事件清无效装配（`onConfigSelfWrite` ∥ watch 双钩——多机制面 + 在飞装配竞态窗）∥ 不管（会话内不自愈 + A 词面误导复现）。请裁 = U-3。

**上抛项**

- **U-1** `providers.mjs` 越层在册（315；`docs/desktop/design/PROJECT.md` §4.1 越层段：预案 = 验证/探针族出档）：B① 判「行级逻辑小修」⇒ 续期；**若评审裁结构性触碰 ⇒ 拆分预案须入本批**（增量面另计）。
- **U-2** 向导模型步「采用」禁用 = 既有接线缺口（本轮发现——非本批引入）；B③ 修复之。**请评审 ∥ 用户确认纳入**（超派单字面）。
- **U-3** C（无效装配不入表）超派单字面；不纳入时的留驻缺陷面 = 会话内「失败发送 → 修正 → 再发」仍拒，须重开会话 ∥ 重启；且该态 A 词面会再指刚完成的动作。**请裁**。
- **U-4** `agent-host.mjs` 298 ⇒ ≈301：或越 300 顾问线（现读 298 贴层）——实施轮按盘实读；越线则入越层段登记（预案 = 装配表维护面评估）。
- **U-5** 会话槽自愈面（射程外）：桌面无 `loadAgentSlot` 后复验（CLI 先例 `thincoder-cli/src/command-interactive.mjs:149`）；「会话槽 provider 有效 ∥ config 无效」态桌面仍拒，且工具按 `model: null` 装配——涉槽语义需独立设计，登记待裁。
- **U-6** `docs/desktop/design/E2E-TESTING.md:114` 坐标陈旧（console 行实拼点 = `renderer/composer-wire.mjs`；归因句 = `src/main/turn-input.mjs`）——随该档下次触碰收正（零语义）。
- **U-7** 需求侧：如需 D 条目记录本修复（含 B② 对 D11 的补则），笔 = 主 agent（本设计轮零改需求档）。
- **U-8** 词数链 ∥ 行数账回填面：`i18n.mjs` 链注 ∥ `docs/desktop/design/UI.md` §4.1 ∥ `PROJECT.md` §4.1 越层段——随实施轮按盘回填（届盘实读续链，零预设值）。

**§2 补录 · 13:09 用户新增口径（界面呈现 · A 半修订 —— 按钮倾向走）**

**来源**：父侧转达用户 13:09 口径——引导面倾向**可点按的动作按钮**（缺 ∥ 无效 `defaultModel` ⇒ 提示行给可直接打开模型选择器的动作入口，而非「请去 ⚙ 里选」的句子）。**B 半 ∥ C 半不受影响**。本补录**修订上文 A③ 词值与 KD-3**；其余条目照旧读。

**修订后 A 呈现形（运行面定形）**

1. **词改状态陈述（去指路句）**：`composer.send.noDefaultModel` = zh `默认模型未设置或无效` ∥ en `Default model missing or invalid`；**原「点击 ⚙ 设置 → 模型与档位」指路撤销**——**本轮实读发现**：设置面「模型与档位」段候选按**激活渠道**取数（`thincoder-desktop/renderer/mount-settings-reads.mjs:33-39` `activeModel` + `:74-78` `loadModels`）；`defaultModel` 缺失 ⇒ `activeProvider` 空 ⇒ 该段**零候选**（仅段态「未配置」）、渠道行族亦无「设为当前」动作（`thincoder-desktop/renderer/views/settings-sections-providers.mjs:133-165` 行控件 = 改钥 ∥ 删钥 ∥ 校验 ∥ 移除）⇒ 该指路为**死端**，撤销。
2. **动作钮（新）**：`defaultModel` 类的失败行 = [词, 钮]——钮词新键 `composer.send.chooseModel`（zh `选择模型` ∥ en `Choose model`）；锚 `data-action="composer:chooseModel"`；handler = `panelOf()?.openModelMenu`（**同模型钮 ∥ `/model` 同一函数**——核件面板动作句柄面 `thincoder-render-core/composer/panel.mjs:279-284`；模型菜单候选 = `model:catalog` **全渠扇出**，不依赖激活渠道 ⇒ 本态可用）；缺面 ⇒ `wire` 落 `disabled`（诚实非死控；平 node 测试面同形）。行形 = 现行 `div.composer-notice[data-notice="send-failed"]` + 内联钮；样式最小改 = `thincoder-desktop/renderer/chat-composer.css` `.composer-notice:32-34` 邻域加一规则（次级链接形；零新变量 ∥ 零新色值；圆角沿 v3 钮族先例）。
3. **可修链闭合（新增必要条件——原 U-5 提为正件）**：模型菜单选取 = **会话槽写**（`session:prefs`，既有；其语义零改）——桌面装配在槽应用后**无复验**（CLI 有：`thincoder-cli/src/command-interactive.mjs:149`）⇒ 补：`thincoder-desktop/src/main/agent-host.mjs` `assembleAndLoad:173-183` 在 `loadAgentSlot` 后 `if (agent._providerInvalid) validateProvider(agent, agent.config)`（CLI 同型；槽有效 ⇒ 清标 ⇒ 本次发送放行）。**不补则按钮 = 假修**（点选后仍拒——与核心判据相抵），故入本批。
4. **钮目标的被否**：开设置面「模型与档位」段 ∥ 开组弹窗（`openSettingsModal("model")`）——两径同死端（同 1 的零候选实况）。
5. **残留（上抛 U-9）**：config 级 `defaultModel` 在本态仍无 in-UI 补设路径（会话级修复不反写 config；新会话仍需再选）——候选消解（另批）：模型段按全渠列候选 ∥ 渠道行增「设为当前」动作；**不扩范围**（13:09 明示）。

**受影响文件表 · 增量**：`renderer/composer-sync.mjs` 302 ⇒ ≈307（钮 ＋ 类路由）· `renderer/i18n-views.mjs` 374 ⇒ ≈380（两键 ×2 语）· `thincoder-desktop/renderer/chat-composer.css` **137 ⇒ +1 规则**（新列）· `src/main/agent-host.mjs` 298 ⇒ ≈304（槽复验 ＋1-2 行——**越 300 顾问线**，U-4 升级为在册线）· 余行照上文。

**验收增量**：**AC-7（13:09 钮）**——`defaultModel` 类失败行内联钮在场 ∧ 点按 ⇒ 模型菜单在场（同钮同门）∧ 菜单选取后下次发送放行（槽复验链）；机检 = 批内件 T2 扩（钮节点在场 ∥ handler 接线 ∥ 两新键词值）+ T6（`assembleAndLoad` 槽复验：假装配无效 ＋ 假槽有效 ⇒ 清标；槽无效 ⇒ 标记保持——存根断言）+ 源码判据；真机 = 父侧。

**关键决策 · 修订 ∥ 新增**：**KD-3（修订）** = 词取状态陈述 ∥ 动作归钮（钮 = 同钮同门既有函数——零第二实现；被否：设置面两径（死端，见上））。**KD-8（新）** = 槽应用后复验入本批（CLI 同型一行；被否：不改——按钮假修）。

**§2 修正轮（评审轮 1 · 发现 1–8 逐号落位 + 射程外注①核查 · 2026-10-03 · eng-designer）**

**读本次序（发现 3）**：本段 = §2 终读本——**首稿 A③ 词值**（指路句「默认模型未设置或无效 — 点击 ⚙ 设置 → 模型与档位」）与**首稿 KD-3** 随 13:09 补录作废；补录（:143 起）∥ 本修正块 = 设计面唯一读本（两稿冲突以本块为准）；机制终形已落 `docs/desktop/design/COMPOSER.md` §2 本批注（回指即可）。

**发现 1（🟡 守卫候选源 · 实读 + 降为提示）**：

- **候选取数判据（= 与设置面「激活渠道」径同源）**：向导模型步候选面 = `settings.model` 切片——步入径 `views/onboarding.mjs:55-58`（`loadModels(state.settings.model.provider)`）、步 2 体 `:66-69`（`modelChoicesTree`）、读数 `:32-38`；`settings.model.provider` 单源 = `provider:list` 回执 `active`（= 核 `resolveProviders().activeProvider` = `defaultModel` 的 provider 段——`src/main/providers.mjs:90-96` ∥ `mount-settings-reads.mjs:33-39`）——与设置面「模型与档位」段同一 `loadModels`、同一切片（`views/settings.mjs:253`）。
- **该态非空判据 + 读数/负控**：非空 ⇔ `settings.model.provider` 非空 ⇔ `defaultModel` 可解析；守卫态（渠道非空 ∧ `defaultModel` 缺）⇒ 空 ⇒ 步入步 2 **零候选**——负控 = `loadModels` 早退（provider 空 ⇒ 段归 `none` ∧ `models:[]` ∧ **零请求**，`mount-settings-reads.mjs:74-78`）；且「采用」钮判据三件 = `!current ∧ handlers.onUseModel 在场 ∧ model.provider !== null`（`views/settings-sections.mjs:70-72`）——该态行钮尽禁用（纵接线亦不可操作）。
- **改档（取「降为提示」支——不阻断完成）**：`finishWizard` 完成径 = **现行为零改**（复读 ⇒ 落槽 ⇒ 退场/重进）；该态提示落于输入区发送失败行（词 `composer.send.noDefaultModel` + 钮 `composer.send.chooseModel`——本批 A 面定形；用户 13:09 口径 = 该态引导唯一可行动形）；与「渠道空」支同判（零动作面——模型步无可行动作；死端引导与 KD-3 撤销三处死端同型）。
- **随改档撤销件（不再实施——D8 删净）**：`no-default-model` notice 码 ∥ `settings.reason.noDefaultModel` 词对 ∥ `REASON_WORD` +1 码 ∥ 步 2 改道 ∥ 候选面同径装载；B 的缺环主防线 = B①（守卫态可达性收缩至「补写写失败」残余面）。

**发现 2（🟡 开放项落定——`active` 缺省态 ∥ 向导提交形）**：

- **设置面表单缺省态**：两形（preset ∥ custom）**未传 `activeDefault`**（`views/settings-sections-providers.mjs:183-187`）⇒ 复选框缺省**未勾选**（`views/settings-controls.mjs:109`——`checked = activeDefault === true ? true : undefined`）。
- **向导步 1 表单**：**传 `activeDefault: true`**（`views/onboarding.mjs:57-62`）⇒ 缺省**勾选**。
- **向导步 1 提交**：**恒携 `active`**——`submitChannel` 两形载荷皆含 `active: data.get("active") !== null`（`mount-settings-exits.mjs:72-73`）⇒ 缺省勾选形 = `active: true`（取消勾选 = `false`）。
- **因果闭合 ∥ moot 判由**：12:56 缺环产线 = 「设置面表单（缺省未勾）保存 ⇒ 旧码零 `defaultModel` 写」；B① 触面 = 任意保存（条件「缺失」自限）⇒ 两支同效（目标态 = `defaultModel` 落位）——该产线闭合。

**发现 4（🔵 行数收正）**：`chat-composer.css` 标值 **137 ⇒ 136**（内容行数口径——实读：文末空行 = 第 137 行；`COMPOSER.md` §3.1 同值 136）⇒ 增量形收正 = **136 ⇒ ≈+1~2 行（+1 规则——次级链接形）**。

**发现 5（🔵 C ∥ KD-8 长档落点）**：落点句补列第四档 `docs/desktop/design/SHELL.md`（§4 壳装配第三份 = 装配面既有归口）——两件本批注已落该档（§4 末段 + 变更记录）；机制单源仍 = 本段 §2。

**发现 6（🔵 分类支 1 可达性——实读）**：夹具实跑（真核 `loadConfig` + `validateProvider`；`%TEMP%\tc-840-*`）：`providers:[{name:"p1",model:"m1"}]`（缺 `baseURL`）+ `defaultModel:"p1:m1"` ⇒ `config.provider.name = "p1"` 非空 ∧ `_providerInvalid = true` ∧ 标因 `缺少 baseURL` ⇒ **支 1（`provider` 类）可达**——与 §1 ④「条目结构不全」咬合（修点在渠道面）；批内件 T1 锁分类形（闭集二值 ∥ 结构判定）。状态来源面 = 手工档 ∥ 外端写入（本端两写形皆校验 `baseURL`）。

**发现 7（🔵 13:17 补锚——集成腿补入 · T7）**：批内件增 **T7**（集成腿）——真 `createAgentHost`（存根 `assemble`（无效 config 形——真 `validateProvider` 落标）∥ 存根 `run`）+ 真槽文件（`_setSessionsDirForTest` 沙箱 + `newSession`）+ 真 `setPrefs`（`session:prefs` 写）+ 真 `send`：send#1 ⇒ `provider-invalid` ∧ 装配表零入（C）；`setPrefs({provider, model})` 写槽 ⇒ send#2 ⇒ `{ok:true}`（KD-8 清标）＋ `assembled.length === 2`（C 迫重装配）。器具先例 = `docs/batches/2026-09-28-tech-debt-closeout-r8.test.mjs:215-311`（同形宿主级直测）。**与 §1:50 对账**：「会话级选模型（槽写 + 施加）⇒ 再发探放行」整链 = T7；T2 扩 ∥ T6 = 两端机制锁；真机（父侧）仍走 13:17 同路径。

**发现 8（🔵 读时机明写 + 回执形坐标复核）**：

- **读时机**：`finishWizard` 的 `config:read` = **收尾实读**（每次收尾现调——`mount-onboarding.mjs:63`；非复用 boot 值 ∥ store 旧值）；读源 = 主进程处理体现读（核 `loadConfig` 每次读盘——`config.mjs:236-245`）；判据 = 回执布尔 `configured`。守卫改档（发现 1）后本读数 = 完成径唯一遗留用途；「复用旧读 ⇒ 本会话新存渠不可见」判据句留档于此。
- **回执形坐标**：正确定位 = `IPC.md` §2 设置族注**项 6 回执形注**（现盘 `:303`——「无 `ok` 旗标；读失败 = fail-loud 抛出；判据 = `configured` 布尔在场」）；**`IPC.md:295` = 项 4（两条口径有意分歧）**——内容不匹配（宿主核验标注成立）；实读复核 = 批档 ∥ 三设计档零处 `:295` 硬引用（无须改文——后续引用按「设置族注项 6（`:303`）」写法）。

**射程外注①核查（UI.md §1 输入区行）**：该行载「**发送失败**（`msg:send` `ok` 假 ∥ 抛）⇒ **文本保留** + `console.error`」（`docs/desktop/design/UI.md:28`）——**不载** `data-notice="send-failed"` 形态句（全档 grep 零命中）⇒ **判定 = 零触**（行形态单源 = `COMPOSER.md` §2 本批注）。

**受影响文件表收正（对 :86-107 表 ∥ :155 增量表）**：行 9（`i18n-settings.mjs`）**撤**（零改）∥ 行 10（`views/settings.mjs`）**撤**（零改）∥ 行 11 净额收正 = `useModel` 接线 + 注（89 ⇒ ≈92）∥ 增行 `docs/desktop/design/SHELL.md`（现读 332 ⇒ +≈2——§4 本批注 + 变更记录）∥ 行 13 = T1–T7（含 T7 集成腿；新档预算按盘回填）∥ `chat-composer.css` 格 **137 ⇒ +1 规则** 收正为 **136 ⇒ ≈+1~2 行（+1 规则）**；余行照旧。

**验收对照收正（对 :113-120 表）**：B②③ 行改述 = 「B② 改档（完成径零改——不阻断）＋ B③ handlers 携 `onUseModel`」——机检 = T4（改档重定义：`loadModels(null)` ⇒ `state:"none"` ∧ `models:[]` ∧ 零 `model:list` 请求 = 候选负控；＋步 2 步入径 ∥ handlers 源码判据）∥ AC-7 行机检面补 **T7**；复现对（总）行补 T7；A ∥ B① ∥ C ∥ 三端零触行照旧。

**上抛随动**：U-2 保留——判由收正 = 步 2 可操作面闭合（正常径候选在场——B① 落位后；非守卫死路闭合）；余项（U-3…U-9）照旧。

**修正轮实读结论汇总**：#1 候选源 = 激活渠道径（同设置面）⇒ 守卫态零候选 ⇒ 守卫降为提示（不阻断）；#2 设置面表单 `active` 缺省未勾 ∥ 向导缺省勾选且提交恒携 `active`；#6 支 1 可达（缺 `baseURL` 条目夹具实跑）；#8 收尾实读 + 回执形 = 设置族注项 6（`:303`）。

**§2 更正块（用户 13:43 更正 · 词面-only 终形收正 · 修正轮 #7 · 2026-10-03 · eng-designer）**

**来源**：用户 13:43 澄清——13:09「按钮倾向走」系拼音误打，原话 =「**按你倾向走**」（采纳父侧倾向，与 13:10 同义），**非「界面加按钮」**（§1:52 已载）。13:09 补录 ∥ 修正轮块内钮面句随之**全部作废**。本块 = §2 末位终读件：与补录块（`:143-161`）∥ 修正轮块（`:163-202`）冲突处**以本块为准**。

**终形**：`defaultModel` 类失败行 ⇒ 新词 `composer.send.noDefaultModel`（zh `默认模型未设置或无效` ∥ en `Default model missing or invalid`——状态陈述）**零钮**；余类（无渠道可解析 ∥ 条目结构不全 ∥ 分类缺）⇒ 现键 `composer.send.noProvider` 照旧。落点 = `docs/desktop/design/COMPOSER.md` §2 本批注 ∥ `docs/desktop/design/IPC.md` §2 `msg:send` 行（本修正轮已同笔收正，各带变更记录行）。

**作废清单（不再实施——D8 删净）**：
1. **内联动作钮**：钮词 `composer.send.chooseModel`（×2 语）∥ 锚 `data-action="composer:chooseModel"` ∥ handler 面 = `panelOf()?.openModelMenu`（含 (b) DOM 触发行）；
2. **AC-7**（`:159` 钮件验收行）——整行作废；其中「菜单选取后下次发送放行（槽复验链）」半句归 KD-8 保留（机检 = T6 ∥ T7）；
3. **T2 钮断言**（T2 扩「钮节点在场 ∥ handler 接线 ∥ `chooseModel` 词值」面）——T2 词路由面（`noDefaultModel` 词值）照旧；
4. **`chat-composer.css` 钮样式规则**（`:152` ∥ `:155` 次级链接形单规则——零改）；
5. **KD-3 修订「动作归钮」半句**（`:161`）——「词取状态陈述」半句保留；
6. **13:09 补录块 ∥ 修正轮块内一切钮面句**（`:145-147` ∥ `:153-154` ∥ `:157` ∥ `:171` 等）——非钮面句照旧。

**文件表随动**：`:155` 增量表 ∥ `:196` 收正之钮面格撤——`chat-composer.css` 行撤（零改）；`composer-sync.mjs` 回 ≈305（仅类路由）；`i18n-views.mjs` 回 ≈378（仅 `noDefaultModel` ×2 语）；余行照旧（实施轮按盘回填）。

**保留清单（不动）**：A 词面（`providerKind` 分类 ∥ 载体 `{ reason, kind }` ∥ 词路由 ∥ 新词 `composer.send.noDefaultModel` ×2 语）∥ B① 补写 ∥ B③ 接线 ∥ C 不入表 ∥ KD-8 槽复验（13:17 活体路径）。

**§2 扫面补记（父侧裁「四档全域扫钮件残留并收净」· 修正轮 #7 · 2026-10-03 · eng-designer）**

扫描判据 = 字面 `钮` ∥ `chooseModel` ∥ `openModelMenu` ∥ `钮面` ∥ `按钮倾向`；结果：
- **`COMPOSER.md`**：本批注（#840）已收（前块）；**#841 明示行批注同源引用收净**（`:119` 「字面与钮」⇒「字面」∥ `:122` 钮半 ∥ `:125` 边界句——与修正轮 `#8` 域重叠，报父侧消重）。
- **`IPC.md`**：`msg:send` 行已收（前块）；**「provider 态投影注」内 #841 同源引用收净**（`:232` 「词 ∥ 钮」⇒「词」）。
- **`SETTINGS.md`**：§2.14 收正（父侧裁纳入本轮）——`:162` 来源句改指 13:43 更正（13:09 原话「按你倾向走」）∥ `:163` ∥ `:165-166` 发件行归纯词面（「可行动形」句随删）；变更记录行已补。本档其余「钮」字面 = 既有控件（校验钮 ∥ 项目钮 ∥ 主题钮族 ∥ 「采用」钮 = B③ 保留项）——非本批残留，零触。
- **`SHELL.md`**：**零触（明记）**——§4 装配表维护两件注（`:168-169`）载 C ∥ KD-8 机制句，无钮件字面；全档扫描零命中。
- 记录面（各档原点行 ∥ 旧变更记录行）按 D8 留档不追改——新增更正行已补（`COMPOSER.md` ∥ `IPC.md` ∥ `SETTINGS.md` 三档变更记录）。
- 四档外同源点位（未触——报父侧路由）：`docs/core/design/PROVIDER.md:429`（跨端表钮列——#841 邻面）∥ `docs/batches/2026-10-03-provider-invalid-unify.md:71`（#841 批档·记录面）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（首跑渠道提示修复批 · A 真因透传 + B 首跑补全 + C 装配自愈）**——射程 = 批档 §2（含 13:09 补录）+ 三设计档本批注（IPC.md §2 `msg:send` ∥ `provider:save` ∥ 设置族注 8①；COMPOSER.md §2 本批注；SETTINGS.md §2.14）；四档全文已读。射程降级声明：评审上下文无 Project Standards 档 ∥ 无 Document map ⇒ 文档归属判据按四档自载档界（IPC = 通道 ∥ 载荷单源 · COMPOSER = 输入区单源 · SETTINGS = 设置域单源）+ AGENTS.md 核；需求卷不在射程 ⇒ 需求契合仅按档内引用（D11）核对。
行数标注抽查（判据 8）：15 档源/测试件按盘实读 + 三设计档按「现行 + 本批增行 = 现读」对账——除 `chat-composer.css`（发现 4）外全数相符（`turn-input` 119 ∥ `providers` 315 ∥ `agent-host` 298 ∥ `ipc` 276 ∥ `composer-wire` 262 ∥ `composer-sync` 302 ∥ `i18n-views` 374 ∥ `i18n` 408 ∥ `i18n-settings` 156 ∥ `views/settings` 398 ∥ `mount-onboarding` 89 ∥ `mount-settings` 249 ∥ 两旧批件 325 ∥ 325；新批件按预期未落）；无档近 500 硬限；越层五档在 `docs/desktop/design/PROJECT.md` §4.1 越层段命中（各带预案句）⇒ 续期判与登记面相符；仓根（`thincoder/`）含 `.git` ⇒「`git diff --name-only`」验收面可执行（零触面核实无阻）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 清晰度 / 验收（B② 守卫） | 🟡 | B② 守卫的落点表述（批档 §2:79）把用户导入向导「模型步」，但全设计未落定该步候选面在守卫态（渠道非空 ∧ `defaultModel` 缺）的取数来源与非空判据：补录 1 的实读（`mount-settings-reads.mjs:33-39` ∥ `:74-78`——设置面「模型与档位」段按**激活渠道**取数，`defaultModel` 缺 ⇒ 零候选）与 SETTINGS.md §3.1「`modelChoicesTree` 供首启向导第二步复用」（同组件族）叠读 ⇒ 守卫态零候选 ⇒ 引导不可满足、完成径被阻断（死端，与 KD-3 撤销三处死端的判据同型）；B② 另句（「渠道空 ⇒ …模型步零候选无可行动作」）支持反读（渠道非空 ⇒ 有候选）——两读未裁。 | 补一条候选取数判据（向导模型步候选源点名 ∥ 该态非空判据）＋一条读数或负控；若与设置面同源（激活渠道径），守卫须降为提示（不阻断完成）或改引导落点。 |
| 2 | 需求覆盖 / 清晰度 | 🟡 | §1 指派设计轮「实读落定」的开放项——providers 表单 markup 的 `active` 缺省态 ∥ 向导步 1 提交是否带 `active`（批档 §1:17）——在 §2 ∥ 补录中零落定读数；B 与首跑实况（用户 12:56 走查）的因果链因此未闭合。 | 落一句实读（表单缺省态 ∥ 向导提交形）；或明写该开放项判为 moot（B① 触面 = 任意保存）并给依据。 |
| 3 | 文档卫生 | 🔵 | §2 为两次 append：首稿 A③ 词值（指路句「默认模型未设置或无效 — 点击 ⚙ 设置 → 模型与档位」）与首稿 KD-3 已被 13:09 补录修订（批档 :145），但两稿同段并存、首稿仍为活形，而 §2 自称机制单源（:66）；§1:44 已载「评审以补录为准」。 | 末位追加一条显式作废 ∥ 读本次序句（append-only 不可改原文）；终形已落 COMPOSER.md §2——回指即可。 |
| 4 | 受影响文件行数标注 | 🔵 | `chat-composer.css` 现行标 **137**（批档 :155）与本批口径「内容行数（文末换行不计）」（:109）不符——按盘实读内容 = **136**（文末空行 = 第 137 行），且 COMPOSER.md §3.1 载 **136**（实读 2026-10-01）；同格 delta 以「+1 规则」计而非行数。 | 收正为 136 并给行 delta（≈+1~2 行）；或注明该格为「含文末空行」口径。 |
| 5 | 清晰度 / 文档归属 | 🔵 | C（无效装配不入表 · :84）∥ KD-8（槽复验 · :151）无长档落点：落点句（:66）仅列 IPC ∥ COMPOSER ∥ SETTINGS 三档，装配表 ∥ 装配面（`agent-host.mjs` `ensure:185-198` ∥ `assembleAndLoad:173-183`）机制只停批档 §2。 | 补一行长档落点指针（装配面既有归口）；或明写「两件长存批档 §2」为有意裁。 |
| 6 | 清晰度（证据锚） | 🔵 | A 分类支 1（`agent.config.provider?.name` 非空 ∧ 无效 ⇒ `provider` · :71）无实读锚——§2 只给核真因串坐标（`model-ref.mjs:58-66`），未给该态可达性读数；该支不可达时 `provider` 类实只覆盖「渠表空」，与 §1 ④「条目结构不全」主张脱钩。 | 补该支实读 ∥ 夹具（可达性）；或注明由批内件 T1 锁形 + 装配面保证。 |
| 7 | 验收（13:17 补锚） | 🔵 | §1:50 补锚「批内件须覆盖『会话级选模型（槽写 + 施加）⇒ 再发探放行』」在 AC-7（:157）机检面拆为 T2 扩 ∥ T6 存根（清标 ∥ 标记保持）——「槽写 + 施加」真链只落真机面，与补锚「批内件须覆盖」有半格差。 | 补一条集成腿（`session:prefs` 写入 ⇒ 装配 ⇒ 发送门放行）；或明写该腿归属真机面（与补锚对账）。 |
| 8 | 清晰度 | 🔵 | B② 守卫（:79）的 `config:read` 读时机未明写（收尾实读 ∥ 复用既有读）——若复用旧读，本会话新存渠不可见 ⇒ 守卫恒不触发（B② 落空）。 | 明写读时机（收尾实读 ∥ 读源判据）。 |

**射程外注（无严重度）**：① `docs/desktop/design/UI.md` §1 输入区行（COMPOSER.md 多处指为输入区**形态单源**）未列本批随动——若该行载有发送失败行（`data-notice="send-failed"`）形态句，宜列随动/指针（该档未读——unverified）；② 台账 #840 ∥ #841 ∥ #842 与需求卷 D 条目面（U-7）不在射程，未核；③ `E2E-TESTING.md:114` 坐标陈旧已在册（U-6），未核。

**计数**：🔴 0 · 🟡 2 · 🔵 6（共 8 条）
**VERDICT: pass**

## §4 用户批准（主 agent）

**§4 用户批准（主 agent · 代签 · 2026-10-03 13:4x）**

- **授权**：用户 2026-10-03 13:19「**那你自动跑到交付吧**」= 本批全链自动授权（**发布线除外**——13:20「发布不要动，等我来」）。
- **三条件齐备** ✓：① 设计评审 **pass**（轮 1 · 0🔴 ∥ 2🟡 ∥ 6🔵——发现表逐字入 §3）；② 修正轮（`#4`）**落地并父侧核验**（8 条逐号落位 + 射程外注①零触；读回 §2 `:161-200` ∥ `SETTINGS.md` §2.14 抽验 ✓ ∥ `doc-check` 绿）；③ **token 已签发**（凭据值不落档 ✗——按纪律）。
- **代签**：本批进入实施轮（eng-coder · initial · 修 A 真因透传 ∥ B① 首跑补写 ∥ C 装配自愈 ∥ KD-8 槽复验 ∥ 13:09 钮；写域 = 14 档，见 §2 `:86-107` + `:194` 收正）。
- **交付后序**：父侧核验（批内件复跑 + 复现对）→ §6 收口 → 台账 #840 核销 → 双远端签入。**发布（0.10.2）不在本授权内**（用户门）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（initial 轮 ＋ 修正轮 2（T2/B③/T4 补入 · 终读本 = §2 更正块）· 终态 clean · 余项 = 父侧文档回填面 ∥ 两旧批件改钉待转正）



**§5 实施记录（eng-coder · 2026-10-03 · initial 轮 ＋ 修正轮 2）**

**交付摘要（号 → 改动 file:line）**

| # | 件 | 落点（file:line） | 读数 |
|---|---|---|---|
| 1 | A 真因分类（闭集二值 · 结构判定 · 四支含保守面） | `thincoder-desktop/src/main/turn-input.mjs:15-34`（`providerKindOf` 导出 :24） | T1（真核夹具三形态 ＋ 保守三面） |
| 2 | A 回执加性扩键（`reason` 裸码零改） | `src/main/turn-input.mjs:86-89`（:88 携 `providerKind`） | T1 ∥ T5 ∥ T7 回执对拍 |
| 3 | A 载体 `{ reason, kind }`（console 行逐字保持） | `renderer/composer-wire.mjs:61-68` | T2（经 `failedNotice`）∥ 旧批件改钉原型 |
| 4 | A 词路由（**词面-only** —— 类 → 词） | `renderer/composer-sync.mjs:73-85` | T2 四支对拍 |
| 5 | A 新词 ×2 语（`composer.send.noDefaultModel`）＋ 键数链注 | `renderer/i18n-views.mjs:66-70` ∥ `:231-235`；`renderer/i18n.mjs:87-90`（VIEWS 137 ⇒ **138** ∥ HOST 312 ⇒ **313**——届盘实读） | T2 两语成对（`Default model missing or invalid` ∥ `默认模型未设置或无效`）∥ 313/313 |
| 6 | A `msg:send` 注面随动 | `src/main/ipc.mjs:186-192` | 注面 |
| 7 | B① 保存补写（仅缺失 · 条目有效 · 排他 `active:true`） | `src/main/providers.mjs:174`（支）＋ `:184`（`backfillDefaultModel`） | T3 五面（补写 ∥ 非空零覆盖 ∥ 无效-非空零触碰 ∥ active 支照旧 ∥ 坏条目零写） |
| 8 | B③ 模型步「采用」接线（同一引用 —— 零第二实现） | `renderer/mount-onboarding.mjs:38` ＋ `:91`；`renderer/mount-settings.mjs:216`（注入 `exits.handlers.onUseModel`） | T4 ③（同引用 ∥ 缺注入零键） |
| 9 | C 无效装配不入表（有效同键复用保持） | `src/main/agent-host.mjs:201` | T5 ∥ T7 |
| 10 | KD-8 槽复验（装载后幂等复验） | `src/main/agent-host.mjs:181`（`assembleAndLoad`） | T6 ∥ T7 |

**批内件**：`docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs` —— **T1–T7 全在**（initial 轮 5 腿 ＋ 修正轮 2 补 T2 ∥ T4）。

**复跑读数（从仓根 `thincoder/`；仓级套件不跑——父侧收口跑）**：
- 批内件：`node --test docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs` ⇒ **7/7 绿**（T1 ∥ T2 ∥ T3 ∥ T4 ∥ T5 ∥ T6 ∥ T7；输出 `pass 7 · fail 0`）。
- 旧批件改钉（**写门拦截 —— 跨批 companion 拒写；原型落 `.thincoder/tmp/840-repin/`，待父侧转正**）：
  - `2026-09-29-send-busy-timing.test.mjs` 副本 ⇒ **13/13 绿**（钉面 = T4 回执 ＋ T7–T10 `failure()` 载体读 `?.reason` —— **实钉面大于设计所记 `:144`**）。
  - `2026-09-29-hatch-clearance-2.test.mjs` 副本 ⇒ **L10 绿**；L4 ∥ L7 **存量红**（后批改 `core.css` ∥ `views/settings-sections.mjs` 所致 —— 非本批面；证据 = `git log` 两档末改 `16d5882a`（2026-10-02））。

**写门拦截（待父侧）**：两旧批件属他批 companion ⇒ 本席写被拒（cross-batch）；原型已落 `.thincoder/tmp/840-repin/`（hatch 副本另含 1 行 rc 钩子深度修正——终位 `docs/batches/` 用 `../../`）。另：send-busy 件现行头注运行命令缺 `/rc/` 钩子（存量缺陷——导入链 `composer-wire → badges → subagent-reduce → /rc/…`，非本批引入）；工作命令 = `node --import ./thincoder-desktop/test/rc-resolve.mjs --test <file>`。

**决策透明表（自决项）**

| 决策 | 取值 | 判由 |
|---|---|---|
| 分类实施形 | `providerKindOf` 导出 ＋ 四支（含保守面） | §2 :71 ∥ 发现 6；导出供批内件直测，零结构外落点 |
| 写门拦截应对 | 改钉原型入 `.thincoder/tmp/840-repin/` ＋ 报告披露 | 跨批 companion 拒写 = 机械墙；沿「子代理落 tmp、父侧转正」先例 |
| 停手期口径 | 钮面零触（词面-only）；T2/T4/B③ 待父侧收正通知 | 父侧 13:4x 停手令 → 13:5x 收正通知（终读本 = §2 更正块 `:204-220`）后按最终写域补入 |
| B③ 注入形 | `useModel` **同一引用**直落 handler 键（非包装） | 设计「单一实现 = `exits.handlers.onUseModel`」——同引用即零第二实现（T4 断言锁同引用） |

**审计与代码评审轮次与终态**

- 内部差异审计（explore · 只读 1 轮）：代码面 **无** PARTIAL ∥ SILENT-SIMPLIFICATION ∥ OUT-OF-LIST；1 项 🔵 = 设计档 `SETTINGS.md` §2.14 钮面残句（判归设计轮 #7 域 —— 报告后由 #7 收正，复核零残留）。
- 内部代码评审（advisor · type=code · 2 轮）：轮 1 = **pass**（0🔴 · 3🟡 · 2🔵）；轮 2（fix 核验）= **pass**（🟡 T2 词路由腿已补核实 ∥ 余项非阻塞；1 新 🔵 = 批内件越 300 观测）。**终态 = clean**（无 must-fix 遗留；余项皆在册 «越 300 续期» ∥ 父侧文档回填面）。

**审计/评审余项处置（如实报账）**：① `agent-host.mjs` **306** > 300 顾问线 —— U-4「越线则入越层段登记」待父侧回填轮（本席 grep `PROJECT.md` §4.1 越层段未见该档条目）；② 越层在册四档沿设计表「续期」判（`composer-sync` **306** ∥ `providers` **335** ∥ `i18n-views` **381** ∥ `i18n` **413**）；③ `IPC.md:308`/`:310` 坐标漂移 ＆ §5 数值回填 —— 父侧文档面；④ 批内件越 300（T1–T7 全腿 —— 观察项，登记面归父侧）。

**改动集自核**（`git status` · 仓根 `thincoder/`）：产品 10 档 ＋ 批内件 1 档全落本单 files 声明（`mount-onboarding` ∥ `mount-settings` 随 #7 确认纳入）；`thincoder-core/**` ∥ `thincoder-cli/**` ∥ `thincoder-vscode/**` ∥ `thincoder-render-core/**` 零触；`chat-composer.css` 零触（钮面停手令兑现 —— 全树 grep `chooseModel` ∥ `composer:chooseModel` ∥ `no-default-model` ∥ `settings.reason.noDefaultModel` 零命中）。

**复现对（修复前 → 修复后）**：修复前 = §1 ①②（真核读 `provider={}` ＋ 真因串不出档 ＋ 单一路由）；修复后同夹具（T1 ∥ T3 ∥ T7）：回执 `providerKind` 按类出档（`defaultModel` ∥ `provider`）∥ B① 补写后 `loadConfig().provider` 有效（可发送）∥ 槽选后 send#2 放行（KD-8）＋ 重装配（C）。

**行数实读（届盘 · 内容行口径）**：`turn-input` **141** ∥ `providers` **335** ∥ `agent-host` **306** ∥ `ipc` **277** ∥ `composer-wire` **266** ∥ `composer-sync` **306** ∥ `i18n-views` **381** ∥ `i18n` **413** ∥ `mount-onboarding` **95** ∥ `mount-settings` **251** ∥ 批内件 **≈4xx**（T1–T7）。

## §6 验证与收口（父代理）

**§6 验证与收口（父代理 · 2026-10-03 14:2x）**

- **交付判据链**：设计评审 pass（轮 1 · 0🔴；发现 8 条全数裁决采纳 → 修正轮 `#4`）→ §4 代签（用户 13:19 授权）→ 实施轮 `#5`（终态 clean：内部审计 1 轮 + 代码评审 2 轮 pass）→ 文档回填轮 `#9`（越层段/行数账/IPC 坐标；doc-check 绿）。
- **父侧核验读数**：批内件 `docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs` = **7/7 pass**（父侧亲跑）∥ 转正两旧批件复跑 = send-busy **13/13** ✓ ∥ hatch **L10** ✓（L4/L7 存量红——涉面 `core.css` / `views/settings-sections.mjs` **不在本批改动集**）∥ 桌面包套件 = 空清单绿（2026-09-28 重置形态）∥ 产品抽读五处与设计逐字相符（`providerKindOf` ∥ 词面-only 路由 ∥ 仅缺失补写 ∥ C 不入表 ∥ KD-8 槽复验）∥ 改动集 ⊆ files 声明。
- **转正两件**（子代理被跨批写门拦下，父侧 copy 转正）：`2026-09-29-send-busy-timing.test.mjs` ∥ `2026-09-29-hatch-clearance-2.test.mjs`——含机械收正两处（hatch rc 钩子深度 `../../` ∥ send-busy 件头运行命令补 `--import` 钩子〔存量笔误〕）+ 复跑核验。
- **回填轮 `#9` 报账裁决**：① `turn-input.mjs` 补登 = **收**（历轮缺行，随批登记 141）∥ ② IPC 设置族注 8③ 措辞收正 = **收** ∥ ③ views-onboarding 机检指针（桌面测试树 2026-09-28 重置后盘上无档）= **转 #13 顺笔收正**（其触 `IPC.md`）∥ ④ `window.mjs` 计数口径 = **维持现口径**（归阶段二批块，主册/十六档不含——如后续统一口径另批）∥ ⑤ `E2E-TESTING.md:249` `.gitignore` 行 = 非本批面（既有在册线）∥ ⑥ `SETTINGS.md` 说明句低危陈旧 = 残项在册（下次触碰随正）。
- **Δ1 两处**：`i18n.mjs` / `i18n-views.mjs` §5 读数与盘实读差 1 行——**取盘值**（412 ∥ 380；回填轮双读 + doc-check 行数族复核）。
- **用户门项（不阻核销）**：实机走查（13:17 路径：发一句看准确词 ∥ 模型芯片选完再发即通）∥ 发布 **0.10.2**（发布线锁定 = 用户门）。
- **结算**：本批 = 交付完成 ∥ 台账 #840 核销 ∥ 双远端签入。

- **签入**：提交 **`cf3ea937`**（24 档 · +1278 ∥ −68）→ **双远端已推**（`origin` = gitee 直推 ✓ ∥ `github` 经代理推 ✓）。用户门项照旧（实机走查 ∥ 发布 0.10.2）。
