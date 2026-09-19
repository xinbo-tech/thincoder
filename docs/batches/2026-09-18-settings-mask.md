# 2026-09-18 · settings 脱敏键集扩面（快车道）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（提交 `ea2f3360`；先红 10 明文 → 改后 34/34 · 三包绿）

### 1.1 批件（用户 2026-09-18 04:46「都开了吧」）

| # | 条目 | 实况 |
|---|---|---|
| ① | **台账 #53**：`settings` 工具**脱敏漏项**——`mcp.servers.*.headers.Authorization` **明文回显**（现行脱敏规则只认路径段含 `apiKey/key/token/secret/password`） | 安全面；用户已被告知轮换该 key（值不入档）；附属面 = `headers.*` 任意键 / `*.auth` / `*.credential` 等形态 |

### 1.2 路径

**设计轮（eng-designer）** → 评审 → 实施（eng-coder）。快车道（安全面）——小批快走。

### 1.3 边界

- **禁触**：`provider/**` · 提示词面 · 数据面（DB/配置值）· 冻结批档 / `_archive/**` / 参照树。
- 收正判据 = 夹具键集逐键断言（可机判），**不得只加 `Authorization` 单键**。

### 1.4 台账

- **#53**（settings 脱敏漏项）。

## §2 批次任务与设计修订（eng-designer）

### 2.1 本批覆盖的需求条目（三点链：需求档条目 = §2 任务 = 设计档回指）

| 需求条目（`docs/core/requirements/SETTINGS-TOOL.md`） | 本批处置 | 设计档落点 |
|---|---|---|
| **F-ST5** 敏感键遮蔽（键段判定命中 ⇒ 值遮蔽展示——读面不泄漏凭据） | **本批唯一功能面**——判定谓词扩面收正（漏项：`headers` 族与四词） | `docs/core/design/SETTINGS-TOOL.md` §2.4（改写） |
| **N-ST3** 零凭据落输出（工具输出永不含明文凭据） | 同一谓词面（零明文 = 判据主体） | 同 §2.4 + §3 D-ST13/D-ST14 |
| **N-ST4** 可测试（工具形状 / 描述句由用例逐条断言） | 用例族 T-S4（夹具逐键）含描述句断言 | §2.4 判据面 + §5 测试档行 |
| **N-ST6** 描述纪律（描述写清敏感值永不明文回显） | 描述句须与新谓词同源 | §4「UI/交互」行（逐字 = 产品代码） |

**明示不在本批**：F-ST1（只读动作面）· F-ST2（写动作热应用）· F-ST3（已知键校验）· F-ST4（形状护栏）· F-ST6（并发写冲突）· F-ST7（值解析去引号）· N-ST1/N-ST2/N-ST5——零触碰（本批只动读面/回显谓词，写面语义零改，见设计档 §4）。

### 2.2 设计成段（现状实核 → 修法 → 判据 → 受影响文件）

#### ① 现状实核（台账 #53 · 本席实跑取证 as-of 2026-09-18）

三条硬证据（夹具值一律为哨兵串，**真值不入档**；`configPath` 不触真实用户配置——`list` / `get` 为**纯读动作（不写盘）**，下表 `list` 行以占位路径 `'nul'` 等价调用（该参不参与读路径），`set` 行指临时文件）：

| 面 | 实测命令（等价调用） | 现态读数 |
|---|---|---|
| `list` | `settingsTool({configPath:'nul'}).execute({action:'list'}, {agent:{config: 夹具}})` | `mcp.servers.0.headers.Authorization = Bearer FIXTURE-NOT-REAL (string)` 等 **9 行明文** |
| `get` | `…({action:'get', key:'mcp.servers.0.headers'})` | `mcp.servers.0.headers = [object Object] (object)`（未遮——且非敏感父对象渲染同形） |
| `set` | `…({action:'set', key:'mcp.servers.0.headers.Authorization', value:'Bearer SENTINEL-NOT-REAL'})` | 回显含明文哨兵：`settings set: … = Bearer SENTINEL-NOT-REAL (string) — persisted + hot-applied` |

现态**逐行**读数（夹具含 `mcp.servers.0.headers.{Authorization,Cookie,X-Custom}` · `mcp.servers.0.env.{PLAIN_VAR,GITHUB_TOKEN}` · `mcp.servers.0.token` · `providers.0.{apiKey,headers.X-Custom}` · `websearch.apiKey` · `demo.{auth,authorization,cookie,credential}`）：

- **明文行（漏项 = 9）**：`mcp.servers.0.headers.Authorization` · `.Cookie` · `.X-Custom` · `providers.0.headers.X-Custom` · `mcp.servers.0.env.PLAIN_VAR` · `demo.auth` · `demo.authorization` · `demo.cookie` · `demo.credential`；
- **已遮行（谓词在位 = 4）**：`mcp.servers.0.env.GITHUB_TOKEN` · `mcp.servers.0.token` · `providers.0.apiKey` · `websearch.apiKey`（⇒ 谓词机制本身有效，缺陷面 = **词表缺项 + 开口键族缺席**，非机制失灵）。

#### ② 修法（判定谓词 = 两句取或）

`thincoder-core/agent-tools/settings.mjs`：`isSensitiveKey(path)` 由单句改**两句取或**——

- **词表句**（扩四词）：`/(^|[._-])(api[_-]?key|key|token|secret|password|authorization|auth|cookie|credential)($|[._-])/i`（段界 = `._-` / 串首尾——**段内复合段名（refreshToken / clientSecret 类）不命中 = 登记残余类**：设计档 D-ST17 / §4 边界行 / 本档 §2.4 候选 C2）；
- **开口键族句**（新增）：`/(^|[._-])(headers|env)($|[._-])/i`——段名 `headers` / `env` 命中 ⇒ **其下全部子键整族遮罩**。

理由（D-ST13/D-ST14）：HTTP 头名与环境变量名**不可枚举**（对端/用户任意取），词表永远漏——族闭合才是复发根因的处置；**不得只加 `Authorization` 单键**（本批判据即含「任意头名 `X-Custom-Trace` 亦须遮」一格）。谓词单点、四处消费（list 行 / get 行 / set 回显 / 错误文案值位）——零新增调用点。**写面零改**：敏感键仍可写、真值仍落盘。

#### ③ 判据（可机判 —— 夹具键集逐键 + 先红）

**判据句**：夹具键集**逐键**断言——（a）敏感族**全遮**；（b）非敏感键**不误遮**（逐键渲染 = 原值原样）；（c）**明文零出现**（逐敏感键 `!out.includes(哨兵)`）。

**夹具键集**（哨兵值形如 `SENTINEL-<n>`，真值零入档）：

| 类 | 键（路径） | 期望 |
|---|---|---|
| 开口族（`headers`） | `mcp.servers.0.headers.Authorization` / `.Cookie` / `.X-Custom-Trace`（任意名） / `.Accept`（无害名） · `providers.0.headers.X-Custom` | masked |
| 开口族（`env`） | `mcp.servers.0.env.PLAIN_VAR` · `.GITHUB_TOKEN` | masked |
| 词表（回归） | `mcp.servers.0.token` · `providers.0.apiKey` · `websearch.apiKey` | masked |
| 词表（本轮扩面） | `demo.auth` · `demo.authorization` · `demo.cookie` · `demo.credential` | masked |
| 非敏感（不误遮） | `DEFAULTS` 全叶子（除 `websearch.apiKey`）· `mcp.servers.0.{name,url,command,args.0}` · `providers.0.{name,baseURL,model}` | 原值 |

**DEFAULTS 实核（as-of 2026-09-18——T-S4.5 前提）**：`flatten(DEFAULTS)` 共 **24 叶子**；新谓词（两句取或）命中面 = **仅 `websearch.apiKey`**（词表句；族句命中 **0**——DEFAULTS 无 `headers` / `env` 段）⇒ T-S4.5 豁免清单（除 `websearch.apiKey` 外 DEFAULTS 叶子零 masked）**前提成立**。

**先红方案（现态必红）**：夹具含 `mcp.servers.0.headers.Authorization` ⇒ 现态该行明文（实测已证 9 行明文；终夹具加 `Accept` / `X-Custom-Trace` 两格 ⇒ **预期 11 行明文**）。先红 = 实现**前**跑 T-S4.1 → FAIL（断言 masked 而行内为明文哨兵）；实现后 → PASS。T-S4.2（get 面）/ T-S4.3（set 回显面）/ T-S4.6（描述句面——现描述句无族词语义）现态亦红（实测读数见 ①；T-S4.4 / T-S4.5 现态即绿——形状面 / 不误遮面）。

#### ④ 用例表（正常 / 边界 / 错误 —— 判定单位 = 行）

| # | 类型 | 输入 | 期望输出 |
|---|---|---|---|
| T-S4.1 | 正常（核心） | 上表夹具 + `action:list` | 逐键：敏感 14 键 = `path = ••••（masked） (type)`；非敏感键 = `path = <原值> (type)`；**敏感键哨兵逐键零出现**（`!out.includes(哨兵)`——与 §2.2③(c) 同口径；非敏感格值亦为哨兵串，故「全输出零哨兵」不成立——评审轮 1 发现 2）（**先红**） |
| T-S4.2 | 正常 | `get mcp.servers.0.headers` / `…headers.Authorization` / `…name` | 前二者 masked（父对象行 = `••••（masked） (object)`）；`name` = `srv (string)`（先红：现态 `[object Object]`） |
| T-S4.3 | 边界（set 面） | `set mcp.servers.0.headers.Authorization` = 哨兵（临时 config） | 回显 `— stored（值不回显）` + masked + 回显零哨兵；**磁盘值 = 真值**（可写性零改）（先红） |
| T-S4.4 | 错误 | `set websearch.apiKey` = `{"k":"SENTINEL"}`（形状违规） | 抛错 ∧ 错误文案判据可见 ∧ **值位 masked** ∧ 零明文 ∧ 磁盘/内存零变化（同谓词单点——T-S2.22 同型回归锁） |
| T-S4.5 | 边界（不误遮·防漂移） | `structuredClone(DEFAULTS)` 全叶子 + MCP/provider 结构键 → list | 除 `websearch.apiKey` 外 DEFAULTS 叶子逐键渲染为原值（零 masked）；新默认键落敏感族即发声（前提实核 = §2.2③ DEFAULTS 实核句——命中面仅 `websearch.apiKey`） |
| T-S4.6 | 文案（结构机判） | `settingsTool().description` | 描述句含新谓词语义（`headers` / `env` 族 + 词表）——逐字句由 coder 定稿，测试锚 = 定稿整句断言（先例 T-S2.24 / T-S2.35） |

#### ⑤ 受影响文件表（as-of 2026-09-18 实测行数 + 预计增量 + 拆分计划）

| # | 文件 | 当前行数 | 变更 | 本轮增量 | 拆分 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/settings.mjs` | **265** | 修改：`:15` 词表句扩四词 · **`:16` 拟新增**开口键族句常量 · `isSensitiveKey` 两句取或（`:18-20`） · 头注 `:6` 口径句 · description 句 `:212` 同改 | ≈ +6（净） | 无（300 软线内） |
| 2 | `thincoder-cli/test/settings-mask.test.mjs` | 0 | **新增**：T-S4.1–T-S4.6（夹具逐键 + get/set/错误面 + 不误遮 + 描述句）；自带 ≈12 行双缝 helper（`settingsTool({configPath})` + `_setConfigPathForTest` 同指临时文件） | ≈ +95 | **新档即拆分落点**——既有 `settings.test.mjs` **480 行** + ≈95 ⇒ **≈575** 超 500 硬限（D-ST15——估算值单源 = ≈95） |
| 3 | `docs/core/design/SETTINGS-TOOL.md` | **139 → 155**（设计轮已落）→ **170**（修正轮后） | §2.4 改写 · §2.8 一处已删路径改迁移期引文 · §3 +D-ST13–17 · §4 +4 行 · §5 坐标 + 基准注 · 变更记录 | +16（设计轮）· +15（修正轮） | 无 |

**明示未列入**：`thincoder-vscode/test/settings-tool.test.mjs`（谓词核单源、VSC 端面零改——端侧用例无需新增）· `docs/core/requirements/SETTINGS-TOOL.md`（**主 agent 写域**——见 §2.3 提案）· `thincoder-core/mcp.mjs` 与传输层（`${env:VAR}` 属候选）· TUI / VSC 面板遮蔽面（各自板块，本批零触碰）。

#### ⑥ 回归网与登记面处置（评审轮 1 发现 4 / 9——as-of 2026-09-18 实查）

**回归网复跑面（执行后必跑）**——两端既有档逐档结论：

| 档 | 现状读数（实核） | 本批改后 | 会翻转的期望 |
|---|---|---|---|
| `thincoder-cli/test/settings.test.mjs`（480 行 · 28 例） | `node --test test/settings.test.mjs` = **tests 28 · pass 28 · fail 0**（本席实跑） | **零翻转** | 无——夹具键面（`agent.maxTurns` / `agent.customFlag` / `providers.0.{name,apiKey}` / `websearch.apiKey`）新谓词零新增命中（`apiKey` 旧词已遮）；T-S2.24（`:431-434`）逐字锁断言的是**类型校验句**（非敏感值句）⇒ 不破 |
| `thincoder-vscode/test/settings-tool.test.mjs`（224 行 · 9 例） | 端侧零改（谓词核单源） | **零翻转** | 无——T-S2.35（`:156-159`）同为类型校验句逐字锁；夹具无 `headers` / `env` / 四新词段 |
| `thincoder-vscode/test/integration/host-shape-spawn.test.mjs` | 引核工厂（`:26`） | **零翻转** | 无——断言面 = 工具名集合（`:206`），不涉描述句 / 遮罩值 |

**计数复核（runner 口径）**：新档 6 例 + 既有 28 例 ⇒ **28 → 34**；复跑命令 = `node --test test/settings.test.mjs test/settings-mask.test.mjs`（cwd = `thincoder-cli/`）。
**先红相位（实施轮）**：实现前跑新档 ⇒ T-S4.1 / T-S4.2 / T-S4.3 / T-S4.6 **必红**（T-S4.4 / T-S4.5 现态即绿——形状面 / 不误遮面）；实现后 ⇒ 新档 6/6 绿 ∧ 既有 28/28 绿。

**登记面结清（N-ST4 后半句「登记入测试清单」）**：CLI / 核侧**无清单档**——`thincoder-cli/test/run.mjs:9` 走两层 glob（`test/*.test.mjs` + `test/integration/*.test.mjs`）⇒ 新档落 `test/` 顶层即被收集，**无清单须追加**；VSC 侧 = 显式清单制（`thincoder-vscode/test/files.mjs`；设计档 `TESTING.md:361` 同口径），本批无 VSC 新档 ⇒ **零增删**。⇒ N-ST4 后半句结清。

### 2.3 需求侧判定线细化提案（主 agent 落笔——本席只提案）

F-ST5 判定句现载「键段判定命中（**密钥类键段名**）⇒ 值遮蔽展示」——「密钥类键段名」无枚举/无夹具面 ⇒ **不可机判**。建议细化（本席提案，实施轮后即可机判）：

> 判定句（提案）= 路径段命中下列两类之一 ⇒ 值位遮蔽（键名保留可见）：① 词表段 `apiKey|key|token|secret|password|authorization|auth|cookie|credential`（不区分大小写、`._-` 为段界）；② 开口键族段 `headers|env`（其下全部子键）。
> 机判 = 夹具键集逐键（敏感族全遮 ∧ 非敏感键不误遮 ∧ 明文零出现）——夹具集见本节 §2.2③。

### 2.4 候选登记（本批不做——待主 agent 入台账 / 需求档）

| # | 候选 | 立据 / 处置建议 |
|---|---|---|
| C1 | **配置内环境变量引用形态**（`${env:VAR}`——headers / env 值放引用而非真值，消费侧在建连时展开） | 用户既知风险面（密钥入 `config.json` 明文为 MCP 配置面固有）；本批**遮蔽面已覆盖其值位**（引用串同为头值 ⇒ 族遮罩内），但**「不落真值」是新增能力**（值模板 + MCP 建连侧展开）非遮蔽收正——D-ST16；全仓实核：`${env:` 零命中（现无该机制）。建议入台账为独立候选（面 = MCP 建连 / 配置面），**不在本批** |
| C2 | **段内复合段名残余类**（refreshToken / clientSecret / privateKey 类 camelCase / 前缀复合——词表句段内不匹配 ⇒ 明文回显） | 本批**登记不做**（设计档 D-ST17 + §4 边界行；评审轮 1 发现 3 择「登记残余类」而非「扩段内边界规则」）：① 段界口径与 §2.3 需求提案单源，扩段内边界 = 改判定句语义（需求档笔在主 agent）；② 段内规则必带假阳（maxTokens / tokenCount 类无害键被遮）；③ 凭据承载位已由 `headers` / `env` 族闭合覆盖。建议入台账为独立候选（面 = 敏感谓词段内边界规则 + 先红夹具格），**不在本批** |

### 2.5 发现清单（逐条——含非阻断项）

| # | 类 | 发现 | 处置 |
|---|---|---|---|
| 1 | 悬空指针（**需求档**） | `docs/core/requirements/SETTINGS-TOOL.md:61` 悬空锚 `src/agent-tools/settings.mjs`（缺 `thincoder-core/` 前缀）——机检常驻 FAIL 行之一 | **列表上抛**（需求档 = 主 agent 写域，本席零触碰） |
| 2 | 悬空指针（本席写域） | 设计档原 `:68` 悬空锚（VSC 端侧旧路径，该档已删） | **已随批收正**（改「迁移期引文」形态 ⇒ 机检转「列报·不入闸」；见 §2.6 读数） |
| 3 | 判定句缺口 | F-ST5 判定句不可机判（§2.3 提案） | **上抛主 agent**（提案已给） |
| 4 | 同族面（TUI · 人类 UI） | `/mcp` 表单**输入提示**面逐对列 headers/env **现值明文**：`thincoder-cli/src/tui/cmd-mcp-form.mjs:119-120`（`${k}=${val}`）；同档 `token` 已走 `maskToken`（`:118`） | 归 TUI 板块；**本批零触碰**（人类编辑面非 agent 面）——登记 |
| 5 | 同族面（正面证据） | `/mcp` **预览面**已遮：`thincoder-cli/src/tui/cmd-mcp.mjs:123`（`maskToken`）· `:124-125`（只列头名 / 变量名，零值） | 无需处置——如实登记（说明该族漏项仅在 settings 工具读面） |
| 6 | 渲染瑕疵（非泄漏） | `get` 打在**非敏感父对象**上回显 `[object Object] (object)`（实测：`get mcp.servers.0.env` 现态同形） | 本批零改（敏感父对象因谓词命中改出 masked；通用渲染改进 = 另批候选）——登记 |
| 7 | 并发写入事实 | 本席设计轮期间他批在写同仓：`git status` = 13 档 modified（`DOC-DISCIPLINE.md` · `WEBVIEW-PROTOCOL.md` · `TUI.md` · `MANIFEST.md` · `CONTEXT-COMPACTION.md` · `context.mjs` 等，均非本席面） | 机检**总读数**漂移归他批；本席面读数单列（§2.6）——登记 |
| 8 | 行数口径（本席写域） | 三处「当前行数」与实核差一（`settings.mjs` 记 266 → 实核 **265**；`settings.test.mjs` 记 481 → **480**；设计档记 140 → 156 → 实核 **139 → 155**）——口径 = 末行号 / `wc -l`（非 `split("\n")` 段数） | **已随本修正轮就地收正**（§2.2⑤；D-ST15 同改）——一致性面收正，非语义变更 |
| 9 | 计数面（本席写域） | 设计档 `§2.8` / `§5` 记 VSC 用例「8 例」，实核 `^test(` = **9 例**（T-S2.30–T-S2.38） | **已收正**（8 → 9，两处）——一致性面收正 |
| 10 | 编号引用（**产品代码面**） | 实施档注释仍引旧档编号 `D-S2.3` / `D-S2.4` / `D-S2.5` 与 `SETTINGS-TOOL.md §8`（`settings.mjs:83` / `:116` / `:133`；头注 `:10`）——设计档已改指本档 D-ST7 / D-ST8 / D-ST9 | 登记——设计档 §6.1 加**编号映射行**（引用可定位）；代码注释收正**不在本批**（产品代码面，本批零改）——上抛父侧定去向 |
| 11 | 需求档对齐（**父侧笔**） | D-ST17 的消解路径 = 候选 C2（§2.4）；而需求侧 F-ST5 判定句细化提案（§2.3）未含段内边界口径 | 上抛主 agent：采纳 C2 时 F-ST5 细化句须同步扩段内口径；不采纳 ⇒ 维持段界口径（`._-`）+ 残余类登记 |

### 2.6 机检读数（`node scripts/doc-check.mjs` · 仓根 = `thincoder/`）

| 轮 | 总读数（悬空 / 行宽 / 拟新增 / 引文） | 本席面（`docs/core/design/SETTINGS-TOOL.md`） |
|---|---|---|
| 编辑前（基线） | 286 / 3 / 2 / 0 | 1 行悬空（原 `:68`） |
| 本席编辑后（紧接复跑） | **285 / 3 / 2 / 1** | **1 行「迁移期引文——列报 · 不入闸」（`:76`）· 新增悬空 0 · 新增宽行 0** |
| 他批并发写入后（复核） | 295 / 4 / 2 / 1 | 同上（本席面零变；漂移 10 条悬空 + 1 条宽行全归他批档，见 §2.5 #7） |
| 修正轮后（本轮） | **287 / 5 / 2 / 1** | 本席面：**新增 0**（`:81` 迁移期引文 1 条——原 `:76` 同条，随本轮 +5 行位移；新增悬空 0 · 新增宽行 0 · 报告面新增 0） |

**按档归属**：本席写域净效应 = **悬空 −1（旧死指针收正）· 新增 0**；需求档 `:61` 常驻悬空不变（主 agent 域）。行宽面本席面零命中（三档均 ≤300 字符/行）。

**既有回归网基线（供实施轮比对）**：`node --test test/settings.test.mjs`（`thincoder-cli/`）= **tests 28 · pass 28 · fail 0**（本批未改代码——基线读数；复跑面与计数复核 = §2.2⑥）。

### 2.7 设计修正轮小结（评审轮 1 发现 1–9 逐条落位 · eng-designer · 2026-09-18）

**面**：只动本席写域（设计档 `docs/core/design/SETTINGS-TOOL.md` + 本档 §2 就地改行）——代码面 / 需求档 / 机检域零触碰。**轮次** = fix（定点改，无全量勘察）。**判据单源** = §3 轮次 1 发现表（各条 `Suggestion` 已由父侧裁定全部接受）。

| 发现号 | 处置 | 改动落点（file:line） |
|---|---|---|
| 1 🟡 坐标基准 + 一锚两值 | Fixed | 设计档 §5 表头加**基准注**（坐标 = 变更前实核；族句常量单标「拟新增」+ 注插入后下游 **+1**）`:130-132`；工具实现行 `:135`；description 锚两档统一为 **`:212`**（设计档 `:125` / `:135`；实核 = 描述敏感值句本体，`description` 属性起点 `:207`） |
| 2 🟡 T-S4.1 期望互斥 | Fixed | 本档 §2.2④ `:87`——末句改「**敏感键哨兵逐键零出现**（`!out.includes(哨兵)`——与 §2.2③(c) 同口径）」+ 注明非敏感格值亦为哨兵串（故「全输出零哨兵」不成立） |
| 3 🟡 词表句段界残余类 | Fixed（择「登记残余类 + 判定理由」） | 设计档 §2.4 残余类条目 `:46` · **新增 D-ST17** `:113`（D-ST13 `:109` 加引指）· §4 边界行 + 三理由 `:120-122`；本档 §2.2② `:60` + 候选 **C2** `:131`。择此不择「扩段内边界规则」的理由 = ① 段界口径与 §2.3 需求提案单源（扩即改判定句语义，需求档笔在主 agent）② 段内规则假阳（`maxTokens` 类无害键被遮）③ 凭据承载位已由 `headers` / `env` 族闭合覆盖 |
| 4 🟡 回归网面 | Fixed | 本档**新增 §2.2⑥ 回归网与登记面处置** `:104-117`——两端既有档逐档「**零翻转**」结论（含夹具键面 / 断言面依据：T-S2.24 `:431-434` 与 T-S2.35 `:156-159` 断言的是类型校验句，非敏感值句）+ **计数复核 CLI 28 → 34** + 先红相位（T-S4.1/2/3/6 必红·T-S4.4/5 现态即绿）+ 复跑命令 |
| 5 🟡 引用不可定位 | Fixed | (a) 设计档 §2.6 补**测试缝双缝纪律**句 `:71`（§6.1 `:152` 指针落点补齐）；(b) `D-S2.4`→`D-ST8`（§2.4 `:48`）· `D-S2.5`→`D-ST9`（§2.9 `:91`）+ §6.1 加**编号映射行** `:155`（旧档 D-S2.3/4/5 ↦ 本档 D-ST7/8/9） |
| 6 🔵 估算值 / 实跑表述 | Fixed | (a) 估算值统一 **≈95**（设计档 D-ST15 `:111` ↔ 本档 §2.2⑤ `:99`；`480 + ≈95 ⇒ ≈575` 超 500 硬限）；(b) 本档 §2.2① 表头 `:43` 改述（`list` / `get` 纯读不写盘 ⇒ 占位路径 `'nul'` 等价调用，`set` 用临时文件） |
| 7 🔵 T-S4.5 前提 | Fixed（补实核句，不改机械派生期望） | **DEFAULTS 实核句**两处同读数：设计档 §2.4 `:51-52` + 本档 §2.2③ `:79`（T-S4.5 行 `:91` 前提回指）——`flatten(DEFAULTS)` **24 叶子**；新谓词命中 = 仅 `websearch.apiKey`（词表句），族句命中 **0** |
| 8 🔵 族句逐字式样 | Fixed | 设计档 §2.4 `:43`——族句与词表句**同规格并列**：逐字式样 `/(^|[._-])(headers|env)($|[._-])/i`（`:16` 拟新增）+ 边界语义（段界 = `._-` / 串首尾；`envTimeout` / `headersExtra` 类**不命中**） |
| 9 🔵 N-ST4 登记面 | Fixed | 本档 §2.2⑥ `:117`——CLI / 核侧**无清单档**（`thincoder-cli/test/run.mjs:9` 两层 glob 自动收集；新档落 `test/` 顶层即入集）· VSC 显式清单制（本批无新档 ⇒ 零增删）⇒ N-ST4 后半句结清 |

**随轮一致性收正（非评审发现——本席实核驱动，就地收正并逐条报）**：① 行数口径三处差一（`settings.mjs` 266 → **265** · `settings.test.mjs` 481 → **480** · 设计档 140 → 156 → **139 → 155**；口径 = `wc -l` / 末行号）——本档 §2.2⑤ `:98-100` + 设计档 D-ST15；② VSC 用例数 **8 → 9**（`^test(` 实核）——设计档 §2.8 `:82` / §5 `:139`；③ 设计档 `:81` 迁移期引文 1 条随本轮 +5 行位移（原 `:76` 同条，**非新增**）。

**机检读数（`node scripts/doc-check.mjs` · 仓根 = `thincoder/`）**：修正轮起点 **287 / 6 / 2 / 1** ⇒ 终态 **287 / 5 / 2 / 1**（行宽 −1 归他批档）；**本席档（设计档）新增 0**——新增悬空 0 · 新增宽行 0 · 报告面新增 0（`:81` 迁移期引文 1 条为既有同条）。读数行见 §2.6 `:156`。

**上抛面（本席写域外——只报不改）**：① 需求档 F-ST5 判定句细化提案（§2.3，含 `._-` 段界口径）待父侧落笔；② 采纳候选 C2 时 F-ST5 须同步扩段内边界口径（§2.5 #11）；③ 需求档 `:61` 悬空锚 `src/agent-tools/settings.mjs`（缺 `thincoder-core/` 前缀）常驻 FAIL（§2.5 #1）；④ 实施档注释仍引旧档编号 `D-S2.3`–`D-S2.5` / `SETTINGS-TOOL.md §8`（`settings.mjs` `:10` / `:83` / `:116` / `:133`——产品代码面，本批零改，设计档 §6.1 已给映射）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象声明**：设计轮初评（id=2 交付）——设计档 `thincoder/docs/core/design/SETTINGS-TOOL.md`（§2.4 两句取或谓词扩面 / D-ST13–D-ST16 / §5 坐标）+ 批次档 `thincoder/docs/batches/2026-09-18-settings-mask.md`（现状实核 · 用例表 T-S4 · 受影响文件表）+ 需求档 `thincoder/docs/core/requirements/SETTINGS-TOOL.md`（F-ST5 / N-ST3 / N-ST4 / N-ST6）。
**面限**：无项目标准档、无文档地图（Document ownership 判据降级）；声明面外的实施文件（`settings.mjs` / 既有测试档）未出链核验 ⇒ 相关行数与锚点本席标 `unverified`。落表内算术自洽项已核（夹具 15 键 / 现态 9 明文 + 4 已遮 / 终夹具 11 明文 / 敏感 14 键 / 481+95 > 500）。
**计数**：🔴 0 · 🟡 5 · 🔵 4。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / 文档状态 | 🟡 | 坐标基准未标、两档不同值：`thincoder/docs/core/design/SETTINGS-TOOL.md:123`（§5）把**计划新增**的族句常量 `:16` 与 as-of 实核坐标并列同表；同一 description 锚点设计档写 `:207`（`:117` / `:123`）、批次档写 `:212`（`thincoder/docs/batches/2026-09-18-settings-mask.md:96`）——一锚两值且无「变更前 / 变更后」基准（族句插入后 §5 内 `:29` / `:38` / `:61` / `:72-81` / `:146` / `:188-198` / `:207` / `:265` 整体位移） | §5 表头加基准注（坐标 = 变更前实核；族句落点单标「拟新增」并注插入后下游 +N）；两档锚点取同一基准值 |
| 2 | 验收判据 | 🟡 | T-S4.1 期望句互斥（`thincoder/docs/batches/2026-09-18-settings-mask.md:85`）：「非敏感键 = `path = <原值> (type)`」与「全输出零哨兵」不能同真——`:43` 明示夹具值**一律**为哨兵串，非敏感键渲染原值即含哨兵；可判口径在同档 `:67(c)`（逐敏感键 `!out.includes(哨兵)`） | T-S4.1 末句限定为「敏感键哨兵逐键零出现」（与 §2.2③(c) 同口径），或非敏感键改用非哨兵字面值 |
| 3 | 需求覆盖 / 安全面 | 🟡 | 词表句为**段界枚举**（`thincoder/docs/core/design/SETTINGS-TOOL.md:41`；同式见 `thincoder/docs/batches/2026-09-18-settings-mask.md:60`——前置须 `^|._-`）⇒ camelCase / 前缀复合段名仍明文回显（`refreshToken` / `accessToken` / `clientSecret` / `privateKey` / `bearerToken` / `oauthToken` 类）；D-ST13（`thincoder/docs/core/design/SETTINGS-TOOL.md:104`）以「族闭合防复发」立论，而 §4 未登记该残余类 ⇒ 同形漏项留给下次（N-ST3 面） | 词表句段内边界规则列入 §2.4 并考虑覆盖大小写转换 / 复数形态；或在 D-ST13 / §4 显式登记该残余类与判定理由 |
| 4 | 验收 / 回归面 | 🟡 | 描述句须同改（`thincoder/docs/core/design/SETTINGS-TOOL.md:117`）撞既有逐字锁：本批自引先例 T-S2.24 / T-S2.35（`thincoder/docs/batches/2026-09-18-settings-mask.md:90`）即描述句逐字断言样式（设计档 `:141` 记「工具描述逐字新句」面），但 `thincoder-cli/test/settings.test.mjs`（481 行）与 VSC 档（批次档 `:100` 仅称「无需新增」）均未列受影响文件表（`:96-98`），亦无「既有期望翻转」处置句——批次只给基线 28/28（`:137`） | 受影响文件表补行（或加回归网处置小节）：实施后复跑两端既有档，逐条列出会翻转的期望及其改法；并以计数复核 runner 收档（CLI 28 → 34） |
| 5 | 文档引用不可定位 | 🟡 | (a) §6.1（`thincoder/docs/core/design/SETTINGS-TOOL.md:139`）称「测试缝双缝纪律（写侧假体 + 读侧 `_setConfigPathForTest` 同指临时文件，防读写真实用户配置）**入 §2.6**」——§2.6（`:55-66`）实为派生表 / 形状表 / 校验语义 / 加键流程 / 测试缝**导出**，无该句，落点不存在；(b) §2.4（`:46`）/ §2.9（`:86`）引 `D-S2.4` / `D-S2.5`，本档 §3 只定义 D-ST1–D-ST16，三档无该编号定义 | 双缝纪律句补进 §2.6（或改 §6.1 指针）；`D-S2.x` 补定义 / 改指本档编号 / 按 §2.8 迁移期引文形态标注来源 |
| 6 | 文档卫生 / 数值漂移 | 🔵 | (a) 同一拆分依据两值：设计档 D-ST15（`thincoder/docs/core/design/SETTINGS-TOOL.md:106`）「481 + ≈90 ⇒ 571」vs 批次档 `:97`「481 + ≈95 ⇒ 576」（结论同 = 超 500，不影响拆分）；(b) 批次档 `:43` 称「`configPath` 指向临时文件」，而 `list` 行（`:47`）实写 `{configPath:'nul'}`（该动作不写盘，无实害） | 取同一估算值（或注明区间）；证据行表述与实跑一致（列临时文件路径，或注「list/get 不写盘、路径仅占位」） |
| 7 | 验收（条件前提） | 🔵 | T-S4.5（`thincoder/docs/batches/2026-09-18-settings-mask.md:89`）豁免清单「除 `websearch.apiKey` 外 DEFAULTS 叶子零 masked」的前提 = 「DEFAULTS 无 `headers` / `env` / 四新词段」；三档无该实核句（本席未出链核验 · `unverified`）——前提不成立则该格以「实现错」面目变红，易诱发实施轮就地加豁免（静默改判据） | 在设计档 §2.4 判据面或批次档 §2.2③ 补 DEFAULTS 实核结论（命中面 = 仅 `websearch.apiKey`）；或把 T-S4.5 期望改为与 `_nullLeafPaths(DEFAULTS)` 同源的机械派生 |
| 8 | Clarity | 🔵 | 族句（`thincoder/docs/core/design/SETTINGS-TOOL.md:43`）只给语义、未如词表句（`:41`）逐字并列常量 ⇒ 段界语义（`envTimeout` / `headersExtra` 类是否命中）留待解释；确切式样仅见批次档 `:61` | §2.4 两句按同规格并列（族句含边界语义的逐字式样），使设计档单档即可实现 |
| 9 | 需求覆盖 | 🔵 | N-ST4（`thincoder/docs/core/requirements/SETTINGS-TOOL.md:36`）含「登记入测试清单」半句；三点链（批次档 `:34`）只映射「用例断言」面，新档是否有清单登记落点未述（批次档 `:100` 未列；`:125` 提他批在改 `MANIFEST.md`，是否即该清单未断定——本席未出链核验） | 受影响文件表或 §2.5 补一句登记面结论（无清单档 / 或有并追加条目），显式结清 N-ST4 后半句 |

**声明面外注（不分级）**：F-ST5 判定句细化（批次档 §2.3 提案、需求档写域）· 候选 C1 `${env:VAR}` · TUI / VSC 面板同族面 · 存量悬空锚 / 行宽读数 —— 均在评审对象声明的排除面内，本评审不评。

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-09-18 04:46「都开了吧」= 本批（快车道 · 安全面）全批授权 → 父侧按序执行（评审 pass · 修正轮 9 条落地 · token 已签发——值不落文档）。

## §5 实现（eng-coder）

**交付摘要**：改动面 = 2 档（`thincoder-core/agent-tools/settings.mjs` 265 → 268 行 · `thincoder-cli/test/settings-mask.test.mjs` 0 → 135 行新增）；终态 = 三包全绿（core 326 · cli 675 · vscode 599）∧ 本批新档 6/6 ∧ CLI settings 两档复跑 34/34，先红读数 = 夹具 14 敏感键 → 10 键明文 / 4 键已遮（旧谓词命中面）。

**改动清单（2 档 · 行数口径 = `wc -l`——§2.5 #8 既定；新档 `split` 段数 136 系尾空行段）**

| # | 文件 | 行数 | 落点 |
|---|---|---|---|
| 1 | `thincoder-core/agent-tools/settings.mjs` | 265 → **268** | `:16` 词表句扩四词（authorization/auth/cookie/credential）· `:18` 新增族句常量 `SENSITIVE_FAMILY`（`headers`/`env` 整族）· `:21-23` `isSensitiveKey` 两句取或 · `:6-7` 头注口径句 · `:215` description 敏感键句同改（设计基准 `:212`，+3 位移） |
| 2 | `thincoder-cli/test/settings-mask.test.mjs` | 0 → **135**（新增；设计估 ≈95） | T-S4.1 `:76` · T-S4.2 `:87` · T-S4.3 `:97` · T-S4.4 `:108` · T-S4.5 `:121` · T-S4.6 `:132`；双缝 helper `withCfg` `:68-72`（写侧 `settingsTool({configPath})` + 读侧 `_setConfigPathForTest` 同指临时文件） |

**交付表（逐条 = 验收面 · 6 项）**

| # | 状态 | 交付项 | 证据 / 读数 |
|---|---|---|---|
| ① | ✅ Done | 谓词扩面：词表句扩四词 + 族句新增 + 两句取或（单点消费零新增调用点；写面零改——敏感键仍可写、真值仍落盘） | `settings.mjs:16/18/21-23` |
| ② | ✅ Done | description 敏感键句同改（词表 + 族语义整句） | `settings.mjs:215` · T-S4.6 逐字断言 |
| ③ | ✅ Done | 新档 T-S4.1–T-S4.6 六例全绿（夹具逐键：敏感全遮 ∧ 非敏感不误遮 ∧ 哨兵逐键零出现） | `node --test test/settings.test.mjs test/settings-mask.test.mjs`（cwd `thincoder-cli/`）= tests 34 · pass 34 · fail 0 |
| ④ | ✅ Done | 先红相位成立：实现前 10 键明文 / 4 键已遮 | 旧谓词算术复核（命中 4 = `env.GITHUB_TOKEN` / `servers.0.token` / `providers.0.apiKey` / `websearch.apiKey`） |
| ⑤ | ✅ Done | 既有回归零翻转 ∧ 计数 28 → 34（runner 口径） | 复跑 34/34（既有 28 全绿）；VSC 端侧零改（谓词核单源） |
| ⑥ | ✅ Done | 三包全绿 | core 326 · cli 675 · vscode 599（交付读数 · fail 0） |

**验证读数（本投 §5 前复核 · as-of 2026-09-18）**

- CLI settings 两档：`node --test test/settings.test.mjs test/settings-mask.test.mjs`（cwd `thincoder-cli/`）= **tests 34 · pass 34 · fail 0**（713ms）。
- 三包复跑：core **330** · cli **675** · vscode **599**——cli/vscode 与交付读数一致；core = 交付 326 + 4（他批 `ledger-write-gate` 在途新档 `thincoder-core/test/ledger-write-gate.test.mjs` 4 例，非本批面）。

**决策透明（实施轮落到代码的裁定）**

| # | 决策 | 依据 |
|---|---|---|
| 1 | description 敏感键句逐字定稿（`settings.mjs:215`），测试锚 = 定稿整句断言 | 设计档 §2.2④ T-S4.6「逐字句由 coder 定稿」· 先例 T-S2.24 / T-S2.35 |
| 2 | 夹具非敏感格值仍用哨兵串（`SENTINEL-21..26`；`name` 例外 = `srv`） | 评审轮 1 发现 2 裁定口径（逐键 `!out.includes(哨兵)`）；`name` 为 T-S4.2 字面期望（档头注 `:6`） |
| 3 | 双缝 helper `withCfg`（`:68-72`）= 写读两缝同指临时文件 + `finally` 复位 | 设计档 §2.6 双缝纪律（防读写真实用户配置） |

**轮次与终态**：内部发散审计（explore 子代理）**1 轮** = 零发散 · 内部代码评审（advisor · code）**1 轮** = pass · fix 轮 **0** ⇒ 终态 **clean**。

**上抛（写域外——只报不改 · 3 条）**

| # | 条目 | 实物锚 | 同指 |
|---|---|---|---|
| 1 | 产品代码面注释仍引旧档编号（`D-S2.3/4/5` · `SETTINGS-TOOL.md §8/§8.3`）——本批零改 | `settings.mjs:11/25/80/86/119/136/249/265` | §2.5 #10（设计档 §6.1 已给编号映射） |
| 2 | 需求档悬空锚（`src/agent-tools/settings.mjs` 缺 `thincoder-core/` 前缀）常驻 FAIL | `docs/core/requirements/SETTINGS-TOOL.md:61` | §2.5 #1（主 agent 写域） |
| 3 | TUI 同族面：`/mcp` 表单输入提示 headers/env 值明文（`${k}=${val}`；`token` 已走 `maskToken`） | `thincoder-cli/src/tui/cmd-mcp-form.mjs:119-121` | §2.5 #4（TUI 板块——本批零触） |

## §6 验证与收口（父代理）

**收口（2026-09-18）**：

- **验收**：六条逐条落位——① 先红（改前夹具 14 敏感键 = **明文 10 · 已遮 4**；新档 6 例 4 红）② 改后新档 6/6 + 既有档 28/28 零翻转 = 合跑 **34/34**（计数复核 28 → 34 成立）③ 逐键遮罩 ∧ 不误遮（14 掩 / 7 原值；`envTimeout` / `refreshToken` / `clientSecret` 类不命中——段界语义）④ 三包全绿（core **330** = 326 + 他批在途 4 例 · CLI 675 · VSC 599）⑤ 机检代码面零新增 ⑥ 边界（`X-Auth-Token` 命中 · DEFAULTS 命中面仅 `websearch.apiKey`）。
- **提交**：`ea2f3360`（2 档 · +143 / −5）。
- **审计与评审终态**：内部发散审计 1 轮（**零发散**）· 代码评审 1 轮 **pass**（🔴 0 · 🟡 2 · 🔵 2 均受理）· fix = 0 · **终态 = clean**。
- **残留（登记）**：① 设计档 §5 基准注 `+1` → 实 **+3** 与批档估算差（`settings.mjs` +6→+3 · 新档 ≈95→135（`wc -l`）· 终夹具 11→10 行）——**父侧待收正（形态级）** ② 评审候选三条（近失键回归锁 / T-S4.4 前提注 / **残余类 vs N-ST3 绝对句口径**）⇒ 下批候选 ③ 产品代码面旧档编号注释（`:11` 等 8 处）⇒ 随下次触碰收正 ④ 需求档 `:61` 悬空锚 ⑤ TUI 同族面 ⇒ **台账 #58**。
- **三账**：台账 **#53** 已核销；批档冻结；收口日期 2026-09-18。