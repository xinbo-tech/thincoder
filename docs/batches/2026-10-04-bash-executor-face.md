# 2026-10-04 · bash 执行器语义根治（注入锚激活 ∥ 描述死写收正）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 22:43「bash工具的提示词或者工具介绍是不是也有缺陷啊？是不是应该提醒模型注意到当前用的执行器是什么？」（台账 #922）。
> 台账 = #922（core · 归批）。前情 = 无（独立批——承 #922 ∥ 同族 #921（静态描述与运行时真相脱钩第二面））。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-05

**开批登记（2026-10-04 22:4x · 主 agent）**：**来源** = 用户 22:43 质询（「bash 工具的提示词或者工具介绍是不是也有缺陷？是不是应该提醒模型注意到当前用的执行器是什么？」——台账 #922）。

**根因三层（父侧已验——当日 ×4 撞墙实证）**：
- ① `tool-docs/bash.md` Notes 段硬编码「On Windows the shell is cmd.exe (NOT PowerShell)」——本环境 bash 工具实跑 **PowerShell 5.1**（`&&` ParserError ×2 ∥ `;` 可用 ×2——描述与执行器互斥相反）；
- ② `bash.md:15` 有 `{{inject:bash-terminal-face}}` 注入锚（机制位在）但三端取值全空/无 shell 语义（CLI `prompt-injections.mjs:17` 空串 ∥ 桌面 `:19` 空串 ∥ VSC `:18` 仅 terminal 参数语义）⇒ 运行时模型拿不到执行器身份；
- ③ 后果 = 会话内 cmd 语法建议反复失败试错（`cd /d &&` ∥ `set` 赋值等）。

**候选修法（满量）**：A｜注入锚激活——三端 bash-terminal-face 填**运行时执行器身份**（启动时探测：`process.env.ComSpec` ∥ PSModulePath/PSVersionTable 探测；VSC 同）∥ B｜bash.md 死写句收正（「执行器随宿主端而异——以注入面声明为准」）∥ C｜PS 解析错时工具回显当前执行器提示（可选——设计轮裁）。

**未验证面（设计轮须实测取证）**：CLI/VSC 两端 bash 实际 shell 未实测（本会话仅桌面宿主实证 = PowerShell）；`spawnSync(shell:true)` Windows 默认解析 = cmd.exe 除非 COMSPEC 改写——三端可能不同值，注入面必须运行时取而非静态写。

**授权口径** = 全链（用户 12:18 + 21:47 + 21:51 沿用）；**边界** = `tool-docs/bash.md` ∥ 三端 `prompt-injections.mjs` ∥ 可能的探测辅助档；不触 advisor/subagent 面（#921 域）∥ 不触在飞三批面。

**授权（2026-10-04 22:50 · 用户「这些任务都自动跑吧」）**：本批全链自动——评审点火 ∥ §4 代签（三条件照仓例）∥ 修正/实施轮派发 ∥ 收口核销提交双推；自缚三条照旧。**设计硬约束（用户 22:48 裁定在案）**：执行器 = 运行时探测、零静态默认——已推设计舱（#15）为最高优先级约束。

## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-10-04（设计档 BASH-EXECUTOR-FACE.md 新建落盘 · doc-check exit 0 · 探测机制钉死（spawn 同链 ∥ 运行时 ∥ fail-open）· 修法 A/B 采纳 C 否决 · 产品码零写）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成（设计轮交付 · eng-designer · 2026-10-04）

**设计档落点**：`docs/core/design/BASH-EXECUTOR-FACE.md`（新建 · 工具系统板块面 · 机检已过——`node scripts/doc-check.mjs` exit 0：悬空 0 ∥ 行宽 0 超线）。

**本批条目（覆盖）**：

| # | 条目 | 端 | 落点 |
|---|---|---|---|
| 1 | 注入锚激活——`bash-terminal-face` 填运行时执行器身份 | 核+三端 | 核缝零改（`thincoder-core/prompt-files.mjs:105-113`）；三端 `prompt-injections.mjs` 键值函数化 |
| 2 | 探测单源 `resolveShellIdentity` | 核 | `thincoder-core/shell-identity.mjs`（拟新增 ≈70 行——spawn 同链探测 ∥ 识别表 ∥ fail-open） |
| 3 | `bash.md:33` 死写句 → 零断言替形 | 核 | `thincoder-core/tool-docs/bash.md`（行替换 · 零 shell 名） |
| 4 | `posixSyntaxHint` 身份门（kind==cmd 才出） | 核 | `thincoder-core/tools/bash.mjs:28-38`（+≈6 行） |
| 5 | VSC `SHELL_NOTES` 死常量删除 | VSC | `thincoder-vscode/src/tools/shell.mjs:159-166`（−≈8 行） |
| 6 | 权威档两处指针/收正 | docs | `TOOLS.md` §6.2 +1 行 ∥ `PROMPT-SYSTEM.md` §6.3 ∥ `CORE-UNIFICATION.md` §2.13.2（bash 锚半边处置语） |

**机制钉死（设计档 §2/§3 逐字）**：探测源 = **spawn 同链**（`config.shell` → %COMSPEC% → 兜底字面 `cmd.exe`；非 win32 SHELL → `/bin/sh`）——探测值 = 实际执行器；时机 = 首次装配一次 + memo（先例 `shell-candidates.mjs:8`）；注入值 = kind ⇒ 一行 Executor 声明（cmd ∥ powershell ∥ posix ∥ unknown 四字面已定稿）；**探测不到 ⇒ unknown 中性句（fail-open 不猜——用户 22:48 裁定③）；静态默认/平台推断零容忍（裁定①）；bash.md 替形零断言（裁定②）**。VSC 附加 = Executor 行 + 既有 terminal 参数行拼接（宿主能力面保留原文）；terminal 可见终端（用户 shell）不探测（K6）。

**实测取证（设计轮 · as-of 2026-10-04）**：产品码级四态全数在档（设计档 §1.1）——态1 config.shell=powershell ⇒ PS 5.x（Major=5）；态2 null ⇒ cmd.exe 报错；态3 null+POSIX 式 ⇒ hint 正确；态4 powershell+同命令 ⇒ **hint 仍喊 cmd.exe（误导实锤）**。exec 侧：`echo %COMSPEC%` ⇒ cmd.exe；PS 语法两态失败。**AC6 三端探针读数归实施轮复测**（三端同链 ⇒ 同值——本会话仅桌面宿主 + CLI exec 两侧实证）。

**修法裁定表**：A 采纳（主面）∥ B 采纳 ∥ **C 否决**（身份门已统一前置声明；PS 专项回显 = 猜测性第二通道，与裁定③相抵——K4）。探测机制：**否决 ComSpec 为主源**（config.shell 非空时不同源——态2/态4 对照）；**否决 PSModulePath**（加载态≠在用，本机恒存在）；否决逐调用重探（值只被装配消费）。

**根因收正（对 §1 候选探测源的实纠正）**：本机三端实际执行器 = **`~/.thincoder/config.json` `shell: "powershell"`** → `bash.mjs:283` 直传 spawn（三端共用核配置 + 同读 `ctx.agent?.config?.shell`——VSC `shell.mjs:219` 同形）⇒ 非 ComSpec/PSModulePath 层问题；×4 撞墙（`&&` ParserError）= PS 5.1 无 `&&` 的确定行为。

**受影响文件（11 档全清单含行数与增量——设计档 §4）**：核 4（shell-identity.mjs 新 ∥ bash.md 38 ∥ bash.mjs 289+6 ∥ test 新）+ 三端注入表 3（20/22/21 各+4）+ VSC shell.mjs 331−8 + docs 3。档位：全 ≤300 ✓；shell.mjs 既有超软线（减行不触登记）。

**测试面**：单测 `thincoder-core/test/shell-identity.test.mjs`（拟新增 ≈80 行——识别表七态 ∥ fail-open ∥ `_setComSpecForTest` 缝；随批归档不入仓套件）；AC1–AC8 机判（设计档 §6——AC6 三端探针 ∥ AC8 三链全绿 + doc-check exit 0）。设计轮已跑：doc-check exit 0 ✓。

**验收对照（三面同源核对 ✓）**：批档 §1 授权边界（bash.md ∥ 三端 prompt-injections ∥ 探测辅助档）= 设计档 §4 清单 = AC1–AC8 回指——逐条对齐；禁触面（#921 域 ∥ 在飞三批 ∥ manifest ∥ 需求档/提示词正本 ∥ spawn 行为本身）= 设计档 §8 边界零触。

**上抛项（父侧裁定面）**：
1. **§1 候选探测源收正确认**——ComSpec/PSModulePath 双否决、根因 = config.shell（上段）——§1 未验证面以此闭合，无需改 §1（历史记录面）。
2. **U5 空白串差异**（spawn 现体不 trim 直传会失败 ∥ 探测面按 trim 空归默认链）——如实陈述不改变 spawn 现行为；如需 spawn 侧同修 = 语义面新批。
3. **`question-ui-face` 锚不动**（仍待工具面 review——本批只处置 bash 锚半边；`CORE-UNIFICATION.md:1308` 行保留 question 半边）。
4. hint 文案改引用探测 `name`（`Current shell is cmd.exe` → 动态名）= 现行为改进（同缺陷族修复面——已入条目 4，非新语义）。

**实施轮任务书指针**：eng-coder 按设计档 §3 四改面 + §4 清单 + §6 AC1–AC8 执行；§5 实施记录含三端探针读数表（AC6）。

### fix 轮修正块（评审轮 1 · 发现 1–11 · eng-designer · 2026-10-04 23:0x）

（承 §3 轮次 1 十一条 + 父侧逐条裁定；§2 本体行不重写，本块 append 纪行；**块内各条 = 终值语句——与先行文不一致处以本块为准**；被审设计档随同笔定点收正——逐条附落点。）

1. **发现 1（🔴 AC7 夹具与探测链互斥 · 裁定甲案）**——**终值**：空 COMSPEC ⇒ `cmd.exe` 兜底字面声明**保留**（探测值 = 实际执行器——spawn 镜像语义自洽；「unknown 中性句」只用于真探测不到 = 识别表未命中，不用于链兜底）。AC7 判据收正（设计档 `BASH-EXECUTOR-FACE.md:145`）：夹具改**未知名** `config.shell="myweirdshell"`（U4 形——期望 unknown ✓）+ 另补断言 `_setComSpecForTest("")` + shell=null ⇒ `kind:"cmd"`、注入 cmd 行；§1 探测链定义（:17）∥ §1.1 态 2 读数 ∥ AC1 不动（链定义自洽）。§1.1 值面表后补链终值补注一句（:33）：「COMSPEC 空分支 = win32 进程级继承面实际不可达，兜底字面为 spawn 镜像事实陈述」。
2. **发现 2（🔴 注入值求值时机双形 · 钉死单一机制）**——**终值**：键值 = **函数**；求值时机 = **`applyPromptInjections`/重装配期**（值函数被调用时）；memo 按配置值键控（同配置值 ⇒ 取缓存身份；配置值变化 ⇒ 重装配未命中重探）——K2 配置变更刷新与裁定①零静态同时成立。「模块加载时求值一次」措辞全数删除。落点：设计档 §2 数据流（:58-60）∥ §3.2（:81）∥ K3（:129）三处同步；批档 §2 条目 1「键值函数化」与终值一致，不动。
3. **发现 3（🟡 powershell 族文案对 pwsh 为假陈述）**——**终值**：值面表逐字定稿两形——`powershell` kind 按 `raw` 尾段词分流：命中 `/pwsh/i` ⇒ pwsh 形（`&&`/`||` work；`%VAR%` 不展开）；未命中 ⇒ Windows PowerShell（5.x）形（PS 5.1 has NO &&）。kind 枚举不动（识别表仍单目 `powershell`，组装处分流——评审建议两形择一）。落点：设计档 §2 值面表（:48 ∥ :53-54）∥ U1（:152）；U1 预期同步收正为 pwsh 形。
4. **发现 4（🟡 C 否决依据悬空）**——**终值**：否决理由改写为实际成立依据 = **Executor 声明行常驻 bash 工具描述面**（修法 A 生效后每 schema 在场——命令报错时模型旁路即读，无需第二提示通道）+ 裁定③不猜；「§3.3 错误形态输出已统一前置」悬空句删除（§1 表 :16 ∥ K4 :130 两处）。C 否决结论本身不变。
5. **发现 5（🟡 §1 边界枚举与设计 §4 面差）**——**终值**：设计档 §8 补边界口径注（:165）：批档 §1 授权边界 = **设计前枚举**（三面）；条目 4（hint 身份门）∥ 5（VSC 死常量删除）∥ 6（权威档收正）依用户 2026-10-04 22:50 全链授权纳入（同缺陷族修复面，非新语义）。§1 历史面零改。
6. **发现 6（🟡 单测落点自相矛盾）**——**终值**：测试落点 = **批档归档**（`docs/batches/2026-10-04-bash-executor-face.test.mjs`——随批留存，**不入 `thincoder-core/test/` 仓套件树**；PROMPT-SYSTEM §6.10 教义——单元测试件为开发期工具不占仓套件；AC1 的 node -e 直探已覆盖机判）。设计档 §4 行 8 收正（:116）。
7. **发现 7（🔵 「两档」计数错）**——**终值**：**三档**（TOOLS ∥ PROMPT-SYSTEM ∥ CORE-UNIFICATION）。落点：设计档 §3.4 标题（:100）；批档 §2 条目 6「两处」字样由本块为准（条目表行不重写）。
8. **发现 8（🔵 U5 空白串差异）**——**维持上抛处置，无改动**（:152 如实登记形态保留；实施轮 §5 记录该差异读数）。
9. **发现 9（🔵 AC8 缺桌面面）**——**终值**：AC8 补桌面装配产物断言（AC2 同式：桌面 `applyPromptInjections(DESC("bash"))` 产物含 `Executor:` 行 ∥ 零 `{{inject:` 字面；桌面套件存在与否 = 实施轮核——在 ⇒ 入套件跑，不在 ⇒ 装配探针直断）。落点：设计档 AC8（:146）。
10. **发现 10（🔵 PROMPT-SYSTEM §6.3 取值表缺桌面枚举）**——**终值**：§3.4 收正语同笔补桌面取值表（三端面枚举齐：CLI ∥ VSC ∥ 桌面）。落点：设计档 §3.4（:103-104）。
11. **发现 11（🔵 评审局限声明）**——**登记备查，无改动**（§4 行数注以实施轮 wc -l 实读为准；评审范围外文件坐标 unverified 维持）。

**读回（D6——as-of 2026-10-04 23:0x 逐号）**：① :145 AC7 双断言形 ✓ ∥ :33 链终值补注 ✓；② :58-60 ∥ :81 ∥ :129 三处「值函数/重装配期/memo 按配置值键控」一致 ✓ ∥ 「模块加载时求值」全文 0 命中 ✓；③ :48 分流总则 ∥ :53-54 两形逐字 ∥ :152 U1 pwsh 形 ✓；④ :16 ∥ :130 实据形 ✓ ∥ 悬空句 0 命中 ✓；⑤ :165 边界口径注 ✓；⑥ :116 批档归档落点 ✓；⑦ :100 「三档」✓；⑨ :146 桌面断言 ✓；⑩ :103-104 桌面枚举 ✓。⑧⑪ 无改动（登记面）✓。

**fix 轮机检**：`node scripts/doc-check.mjs` = **exit 0**（悬空 0 ∥ 行宽 0 超限；行数面 18 条报告态 = desktop 域既有态，非本批件）。fix 轮自见行宽红 1 条（:103——本轮扩写超线）当场折行收正后绿（fix-of-fix，在册不隐瞒）。

**边界（本修正轮不做）**：产品码零触 ∥ §1/§3/§4/§5/§6 零触 ∥ 他批面（清账 #13 ∥ #921 #14）零触 ∥ 需求档/提示词正本零触——`git status` 自证（见交付报告）。

### fix 轮修正块（评审轮 2 · 发现 13 兜底路径 · eng-designer · 2026-10-05）

（承实施轮 §5.4-1 偏差登记 + 评审轮 2 发现 13 兜底路径、父侧路由回舱〔§5.7 上抛项闭合〕；§2 本体行不重写，本块 append 纪行；**块内各条 = 终值语句——与先行文（含 fix 轮 1 块第 2 条）不一致处以本块为准**；设计档随同笔定点收正——逐条附落点。）

1. **求值机制语终端值**——**终值**：注入键值 = **端装配层 import 期求值的静态字符串**（`executorLine(resolveShellIdentity(configShell()))`——模块加载即求值、注册前；端侧配置读带 try/catch fail-open 护栏）；核缝 `applyPromptInjections` 为纯字符串替换、不支持函数值键（函数值被 `String.replace` 字符串化——评审轮 2 发现 13 / §5.4-1 实证）⇒ 原终值「值函数 / applyPromptInjections·重装配期求值」不可达、按兜底路径收正；原被否决的「模块加载时求值一次」= 缝能力约束下的兜底实装形态。语义保持 = 运行时探测（进程启动读实际配置）∥ memo 按配置值键控。**描述面值随进程启动固定——进程内改 `shell` 配置不刷新（重启生效）；hint 门按配置值 memo 键控重探**（设计档 §8 残余登记）。
2. **落点（设计档随同笔定点收正 · as-of 2026-10-05 读回行号）**：§1:18 时机行 ∥ §2 数据流 :58-60 ∥ §3.2 标题 :79 + 正文 :81-82 + 读法行 :87 ∥ K2/K3 :131-132 ∥ §4:115 动作列 ∥ §8 残余行 :169 ∥ 变更记录 :178。
3. **读回（D6）**：五处机制语与实装同拍 ✓——设计档描述面「值函数」「重装配期求值」零残留；残留 3 处均属记录面/沿革形式（K3 沿革注「原设计 ⇒ 实装改」:132 ∥ 变更记录 :177〔2026-10-04 历史行〕∥ :178〔本行沿革形式〕）。
4. **机检读数（as-of 2026-10-05 00:4x）**：`node scripts/doc-check.mjs` = **exit 1**——悬空 3 条**全在 `docs/core/design/LEDGER.md`（:526 ∥ :527 ∥ :549）= 他批在飞面**（ledger-unification 批 §11「Ledger-tool unification」——git diff 实证在盘未提交）；**本批件面（`BASH-EXECUTOR-FACE.md`）= 0 悬空 ∥ 0 超线**（行宽全文 OK ∥ 行数面 19 条报告态＝既有读数，含本批相关 1 条见 §5.6-1）——上抛父侧路由（回填归 ledger-unification 批 / doc-check 工单）。
5. **边界（本修正轮）**：产品码零触 ∥ 本档 §1/§3/§4/§5/§6 零触 ∥ 设计档其余面不重写 ∥ 他批面零触（LEDGER.md 只报告不触改）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象** = 设计档 `BASH-EXECUTOR-FACE.md` 全文 + 批档 §1/§2 ∥ 权威档三档（TOOLS.md ∥ PROMPT-SYSTEM.md ∥ CORE-UNIFICATION.md 相关面）。评审范围外文件（bash.mjs/bash.md/三端注入表/shell.mjs/desktop 档）的坐标与行数注一律标 unverified，未抽查。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 一致性 | 🔴 | AC7 夹具与探测链定义互斥：探测链规定空 %COMSPEC% 时兜底字面 cmd.exe（BASH-EXECUTOR-FACE.md:17「仍空 = cmd.exe」∥ :41 raw 链终值），故 `_setComSpecForTest("")` + shell=null ⇒ kind=cmd、注入 cmd 行；AC7（BASH-EXECUTOR-FACE.md:141）却期望同夹具「注入 unknown 中性句」——同一夹具两处预期相反，实施轮无法同时满足 | 二选一钉死：按 spawn 镜像语义，空 COMSPEC ⇒ cmd.exe 是准确声明（建议 AC7 夹具改未知名 config.shell（同 U4），另补「空 COMSPEC ⇒ cmd 行」断言）；或改链定义为「COMSPEC 空 = 探测失败 ⇒ unknown」并同步收正 :17/:41 与态 2 读数 |
| 2 | 一致性 | 🔴 | 注入值求值时机两处描述互斥：§3.2/K3 =「模块加载时求值一次的表达式」（BASH-EXECUTOR-FACE.md:77 ∥ :125——值 = 静态串）；批档 §2 条目 1 =「三端 `prompt-injections.mjs` 键值函数化」（2026-10-04-bash-executor-face.md:38）+ 探测机制行「配置变更经既有重装配面生效——新装配读 memo 未命中则重探」（BASH-EXECUTOR-FACE.md:18——要求键值 = 函数、重装配时重调）。模块加载一次 ⇒ K2 的配置变更刷新承诺成死信；函数化 ⇒ §3.2 字面失真——同一机制两种形态 | 钉死单一机制（建议：键值 = 函数、applyPromptInjections/重装配期求值 + memo 按配置值键控——同时满足 K2 与裁定①），并同步收正 §3.2/K3 措辞 |
| 3 | 验收 | 🟡 | powershell 族注入文案逐字定稿含「PS 5.1 has NO」（BASH-EXECUTOR-FACE.md:51），对 pwsh（kind=powershell）为假陈述（pwsh 支持 `&&`）；U1（:148）自记「pwsh 支持 `&&`——文案按族写，pwsh 5.1 差异句以 raw 展开区分」，但 :51 模板仅 $RAW 插值、无法按 raw 区分差异句——恰是 #922「声明与执行器不符」缺陷族在 pwsh 环境的新实例（保守方向、非危害，与批目标相抵） | 模板按 raw 尾段词分流 5.1/pwsh 差异句（或识别表拆 powershell5/pwsh 两目），§2 值面表逐字定稿两形 |
| 4 | 一致性 | 🟡 | 修法 C 否决依据引「§3.3 错误形态输出已统一前置「执行器声明行」」（BASH-EXECUTOR-FACE.md:16 ∥ K4 :126「身份门已在错误形态输出前统一声明」）——§3 实际只有描述面 Executor 行 + hint 门，错误输出并无前置声明行机制，论据悬空（否决结论本身仍可由「描述面常驻声明 + 裁定③不猜」支撑） | 否决理由改写为实际成立的依据（Executor 行常驻工具描述 + 裁定③），删「错误形态输出已统一前置」悬空句 |
| 5 | 文档状态 | 🟡 | 批档 §1 边界只列三面（2026-10-04-bash-executor-face.md:19「三端 `prompt-injections.mjs` ∥ 可能的探测辅助档」），设计 §4 实际含 bash.mjs hint 门（+6）∥ VSC shell.mjs（−8）∥ docs 3 档；§2 验收对照（:57）称「AC1–AC8 回指——逐条对齐」字面不成立（hint 门由评审对象声明正当化，非 §1 边界枚举项） | 收口时在 §4/§6 补边界口径注（§1 = 设计前枚举，条目 4/5/6 依 22:50 全链授权纳入），勿改 §1 历史面 |
| 6 | 一致性 | 🟡 | 单测落点自相矛盾：§4 行 8 把测试档放 `thincoder-core/test/shell-identity.test.mjs`（BASH-EXECUTOR-FACE.md:112——仓套件路径，node --test 必收）又注「测试档不入仓套件」（:117 ∥ 批档 :55「随批归档不入仓套件」）；与 PROMPT-SYSTEM.md §6.10 教义「单元测试用例随批次档存（开发期工具——不占项目 `test/` 树）」（PROMPT-SYSTEM.md:284）相抵 | 二选一：按 §6.10 教义改行 8 落点为批档归档（AC1 node -e 直探已覆盖机判）；或明确入套件并删「不入仓套件」注 |
| 7 | 计数 | 🔵 | §3.4 标题「权威档同步（本层两档 · 一行级）」（BASH-EXECUTOR-FACE.md:96）与批档条目 6「权威档两处指针/收正」（:43）均计两处，实列/实触三档（TOOLS ∥ PROMPT-SYSTEM ∥ CORE-UNIFICATION——:98-99 ∥ §4 行 9–11） | 收正为「三档」 |
| 8 | 边界 | 🔵 | U5 空白串差异（:152「spawn 侧现体对空白串不 trim，直传 spawn 会失败」——声明 cmd.exe 而实际 spawn 失败）= 已如实登记 + 上抛（:61），fail-open 面可接受 | 维持上抛处置；实施轮 §5 记录该差异读数 |
| 9 | 验收 | 🔵 | AC8（:142「CLI/VSC `npm test` 全绿」）未含桌面端测试套件；桌面仅 AC6 探针覆盖，而设计改 `thincoder-desktop/src/main/prompt-injections.mjs` +4（§4 行 5）——desktop 是否有 npm test 未验证 | 桌面有套件则入 AC8；否则补一条桌面装配产物断言（同 AC2 式） |
| 10 | 完整性 | 🔵 | PROMPT-SYSTEM.md §6.3 收正语（BASH-EXECUTOR-FACE.md:99）只处置 bash 锚半边；该行现文「取值表 = `thincoder-cli/src/prompt-injections.mjs` ∥ `thincoder-vscode/src/prompt-injections.mjs`」（PROMPT-SYSTEM.md:182）未含桌面端——本批根因②与 §3.2 均以三端为面 | §6.3 收正时同笔补桌面取值表，消三端面枚举滞后 |
| 11 | 评审局限 | 🔵 | 无项目标准档/文档地图申报（评审上下文明示）——归属按 AGENTS.md 与在档惯例判（新建 BASH-EXECUTOR-FACE.md = 工具系统板块机制档 + TOOLS.md 指针不复制，符合 D2/档族惯例，不判碎片化）；§4 行数注（bash.md 38 ∥ bash.mjs 289 ∥ 注入表 20/22/21 ∥ shell.mjs 331 ∥ TOOLS 1230 ∥ PROMPT-SYSTEM 650 ∥ CORE-UNIFICATION 2054）涉评审范围外文件 = unverified 未抽查 | 实施轮 doc-check/机检照跑；行数以 wc -l 实读为准 |

**计数**：🔴 2 · 🟡 5 · 🔵 4（合计 11）。🔴 #1（AC7 与探测链互斥）∥ #2（注入值求值时机双形）均属机制级自相矛盾，实施前必须收口——按评审规则任一 🔴 即 changes-required。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 复核轮 2（轮次 2 · 修正块十一条验证）

评审对象 = 设计档 `BASH-EXECUTOR-FACE.md` 全文 + 批档 §1/§2（含 fix 轮修正块）∥ 权威档三档相关面。范围外文件坐标一律 unverified。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | BASH-EXECUTOR-FACE.md | 🔴 | Fixed | AC7 改双断言形（:147「`_setComSpecForTest("")` + shell=null ⇒ `kind:"cmd"`、注入 cmd 行」+ 未知名夹具 ⇒ unknown）∥ :33 链终值补注「「unknown 中性句」只用于真探测不到（识别表未命中），不用于链兜底」——与 :17 链「仍空 = `cmd.exe`」一致，互斥消除 |
| 2 | 2 | BASH-EXECUTOR-FACE.md | 🔴 | Fixed | 求值时机钉死单一机制：:59「函数体在 `applyPromptInjections`/重装配期被调」∥ :81 ∥ :131 K3「否决「模块加载时求值一次」」——与批档 :38「键值函数化」及 K2 配置变更刷新一致，双形消除 |
| 3 | 3 | BASH-EXECUTOR-FACE.md | 🟡 | Fixed | :48 分流总则「命中 `/pwsh/i` ⇒ pwsh 形，否则 ⇒ Windows PowerShell（5.x）形」+ :53-54 两形逐字 + :154 U1 pwsh 形——pwsh 假陈述消除 |
| 4 | 4 | BASH-EXECUTOR-FACE.md | 🟡 | Fixed | :16 否决理由改写实据「Executor 声明行常驻 bash 工具描述面（修法 A 生效后每 schema 在场——命令报错时模型旁路即读，无需第二提示通道）」∥ :132 K4 同形——悬空句已删 |
| 5 | 5 | BASH-EXECUTOR-FACE.md | 🟡 | Fixed | :167 边界口径注「批档 §1 授权边界 = **设计前枚举**（三面」+ 条目 4/5/6 依 22:50 全链授权纳入；§1 历史面零改 ✓ |
| 6 | 6 | BASH-EXECUTOR-FACE.md | 🟡 | Fixed | :118 测试落点 = 批档归档「`docs/batches/2026-10-04-bash-executor-face.test.mjs`（随批归档——不入 `thincoder-core/test/` 仓套件树）」——与 PROMPT-SYSTEM.md:284「单元测试用例随批次档存（开发期工具——不占项目 `test/` 树）」一致 |
| 7 | 7 | BASH-EXECUTOR-FACE.md | 🔵 | Fixed | :100「权威档同步（本层三档 · 一行级）」；批档条目 6「两处」旧字面由 fix 块「以本块为准」覆盖（append-only 机制） |
| 8 | 8 | BASH-EXECUTOR-FACE.md | 🔵 | Accepted | U5 空白串差异维持登记 + 上抛（:158「spawn 侧现体对空白串不 trim，直传 spawn 会失败」∥ 批档 :61「如需 spawn 侧同修 = 语义面新批」）——reasoned non-fix 成立 |
| 9 | 9 | BASH-EXECUTOR-FACE.md | 🔵 | Fixed | :148 AC8 补「桌面装配产物断言（AC2 同式：桌面 `applyPromptInjections(DESC(\"bash\"))` 产物含 `Executor:` 行 ∥ 零 `{{inject:` 字面」 |
| 10 | 10 | BASH-EXECUTOR-FACE.md | 🔵 | Fixed | :103-104 §6.3 收正语「取值表行并入 `thincoder-desktop/src/main/prompt-injections.mjs`（三端面枚举齐：CLI ∥ VSC ∥ 桌面）」 |
| 11 | 11 | 2026-10-04-bash-executor-face.md | 🔵 | Accepted | 评审局限声明登记备查（fix 块 11——无改动；范围外行数注 unverified 维持） |
| 12 | (new) | 2026-10-04-bash-executor-face.md | 🔵 | New | fix 块读回行锚漂移：:71 引「BASH-EXECUTOR-FACE.md:145」而 AC7 现体在 :147（同族 :116/:129/:130/:146/:152/:165 均差 2 行）——内容在场核对 ✓、仅坐标陈旧（R7c 卫生面） |
| 13 | (new) | BASH-EXECUTOR-FACE.md | 🟡 | New | 缝能力前提未验：:59「函数体在 `applyPromptInjections`/重装配期被调」vs 批档 :38「核缝零改（`thincoder-core/prompt-files.mjs:105-113`）」——缝是否原生支持函数值键 = 范围外 unverified；若缝为纯字符串替换则两断言不能同时成立。实施轮先核缝能力（或取端装配层求值路径），偏差须批内登记 |
| 14 | (new) | 2026-10-04-bash-executor-face.md | 🔵 | New | :55 先行文残留旧落点「`thincoder-core/test/shell-identity.test.mjs`（拟新增 ≈80 行——识别表七态…随批归档不入仓套件」行内自相矛盾——由 fix 块第 6 条终值按「以本块为准」覆盖；历史面不改，登记防误读 |

**计数**：前轮 11 条 = Fixed 9 ∥ Accepted 2（发现 8 ∥ 11）；本轮新增 🔴 0 · 🟡 1（#13）· 🔵 2（#12 ∥ #14）。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-04 23:1x 父侧代签**（承用户 22:50「这些任务都自动跑吧」全链授权；非用户亲签）。

**三条件核验**：① 设计评审 pass ✓（#16 轮次 1 = changes-required（2🔴/5🟡/4🔵）→ fix 轮 `#17` 十一条终值落地 → #18 轮次 2 复核 **pass**（前轮 11 条：Fixed 9 ∥ Accepted 2；新增 0🔴/1🟡/2🔵）——双轮报告全文在 §3）；② 修正轮落地并逐条核验 ✓——父侧逐条实读（AC7 双断言形 :147 ∥ 值函数三处一致 :59/:81/:131 ∥ pwsh 分流 :48/:53-54 ∥ 悬空句 0 命中 ∥ 边界口径注 :167 ∥ 测试批档归档 :118 ∥ 三档 :100 ∥ AC8 桌面断言 ∥ 桌面取值表 :104）；③ token 已签发 ✓（运行态不入档）。**批准范围** = 本批全量（A 注入锚激活 ∥ B bash.md 零断言替形 ∥ hint 身份门 ∥ VSC 死常量删 ∥ 三档权威档随动；含轮次 2 新增 🟡13 = 实施轮第一步核缝能力前提（typeof function 分支有无——不支持则端装配层求值 + 批内登记偏差）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（续跑收口轮 · AC1–AC8 全绿机判（红绿两读与三端探针读数表在 5.3）· 审计零偏差 ∥ advisor 轮 1 changes-required → fix → 轮 2 pass · 1 项 🔴（设计档机制语收正）非本舱写域、已上抛待路由（收口条件见 5.7））



### 5.1 交付摘要（续跑收口轮 · 2026-10-04 23:5x · eng-coder）

前舱 provider 中断（23:42 · 零报告）——现场复核 = 八改动面 + 三档随动**全部在盘**（逐档全读 + git diff 实证：机制面与设计终值一致，零重做）；本轮 = 补验全门 + 红绿两读 + 三端探针读数 + 两处收正（① 三端注释过宽句按实况收正；② 无他）。全文读数如下。

### 5.2 复核差异表（落态 vs 终值）

| # | 面 | 终值（设计档 §3/§4 + §2 fix 块） | 落态实读 | 判定 |
|---|---|---|---|---|
| 1 | `thincoder-core/shell-identity.mjs` | 新增 ≈70 行（识别表 ∥ spawn 同链 ∥ memo ∥ `_setComSpecForTest` 缝） | 107 行新档：识别表 8 目 · `lastWord` · 同链 + memo 按配置值键控 · 缝 | ✓（实现注 = 5.4-3） |
| 2 | `thincoder-core/tool-docs/bash.md:33` | 零断言替形（逐字） | 与设计 §3.3 逐字一致（diff = 单行替换） | ✓ |
| 3 | `thincoder-core/tools/bash.mjs` | +≈6（import ∥ 身份门 ∥ 探测名） | +5（289→294）：`:12` import ∥ `:263-264` 门 ∥ `:40` 动态名 | ✓（≈） |
| 4 | 三端 `prompt-injections.mjs` | 键值函数化（applyPromptInjections/重装配期求值 + memo） | **import 期求值**（注册前）——缝不支持函数值键（评审轮 2 发现 13 兜底路径） | ⚠ 偏差已登记（5.4-1） |
| 5 | `thincoder-vscode/src/tools/shell.mjs` | SHELL_NOTES 整块删（−≈8） | 删净（净 −5：块 + `isWin` 删 ∥ 说明注释 +4）；全档 `isWin`/`SHELL_NOTES` 零命中 | ✓ |
| 6 | 批内件 `docs/batches/2026-10-04-bash-executor-face.test.mjs` | 批档归档单测（≈80 · 不入仓套件） | 115 行 · 八腿 | ✓ |
| 7 | `TOOLS.md` §6.2 | +1 指针行 | `:179` 指针在（不复制——D2） | ✓ |
| 8 | `PROMPT-SYSTEM.md` §6.3 | 处置语「已激活」+ 取值表三端枚举 | `:182` 三端枚举齐（CLI ∥ VSC ∥ 桌面）∥ `:183` 已激活 | ✓ |
| 9 | `CORE-UNIFICATION.md` §2.13.2 | bash 锚半边收正 ∥ question 半边保留 | `:1311-1312` 同形 | ✓ |
| 10 | spawn 面（shell 参数计算式） | 零改 | diff 实证零触（`bash.mjs:276/288` 原样） | ✓ |

### 5.3 机判门读数（终读）

- **批内件红绿**：`node --test docs/batches/2026-10-04-bash-executor-face.test.mjs`（cwd = 仓根）→ **读1 = 8/8 绿 ∥ 读2 = 8/8 绿**；注释收正后复跑 **8/8 绿**。**红读（负控）**：同套件对变异副本（3 种子 = pwsh 名 ∥ 空 COMSPEC 兜底 ∥ pwsh 分流）⇒ **5 过 · 3 失**——断言非空转、被精确捕获。
- **AC1**：`resolveShellIdentity('powershell')` ⇒ `{"raw":"powershell","name":"Windows PowerShell","kind":"powershell","known":true}`；`null`（win32）⇒ `{"raw":"C:\\Windows\\system32\\cmd.exe","name":"cmd.exe","kind":"cmd","known":true}`。
- **AC3**：bash.md 全文计数 `cmd.exe` = 0 ∥ `PowerShell` = 0 ∥ `Git Bash` = 0（大小写不敏感 powershell 亦 0）。
- **AC4**：态 3（shell=null）= `hintPresent=true · hintNamesCmd=true`；态 4（shell=powershell）= `hintPresent=false`（命令自身 exit 1——PS 重定向差异；hint 门已关）。
- **AC5**：`SHELL_NOTES` 于 `thincoder-vscode/src` 零命中（`isWin` 零残留）。
- **AC6**：三端探针读数表（5.3a）。
- **AC7**：`node scripts/doc-check.mjs` **exit 0**（悬空 0 ∥ 行宽 0 超线；行数面 19 条报告态——其中 1 条 = 本批件，见 5.6）。
- **AC8**：核 `node --test`（cwd = 核）**exit 0**（2 过 = run/slow 启动器；「零用例即绿」既定态——2026-09-28 全清重置）∥ CLI/VSC/桌面 `npm test` 各 **exit 0**（同零用例态）∥ 桌面装配断言 = `applyPromptInjections(DESC("bash"))` 产物含 `- Executor:` ∥ 零 `{{inject:` ∥ 零死写句（探针直断：`hasExecutor=true hasAnchor=false hasDeadWrite=false`）。
- **触码语法**：7 档 `node --check` 全 OK（shell-identity ∥ bash.mjs ∥ 三端注入表 ∥ VSC shell.mjs ∥ 批内件）。
- **行数实读**（内容行；vs 设计 §4 预计）：shell-identity **107**（≈70+）∥ bash.md **38**（0）∥ bash.mjs **294**（+5 ≈ +6）∥ CLI 表 **31**（+11 ≈ +4）∥ 桌面表 **31**（+9 ≈ +4）∥ VSC 表 **36**（+15 ≈ +4）∥ VSC shell.mjs **325**（−5 ≈ −8）∥ 批内件 **115**（≈80）。超预计项 = 注释块（偏差登记 + 机制权威指针 + 轮次说明）；**档位判据全绿**（≤300 软线：107 ∥ 294 ∥ 31/31/36；shell.mjs 325 = 既有超软线、本批减行）。

### 5.3a AC6 三端探针读数表（`node .thincoder/tmp/ac6-three-end-probe.mjs` · cwd = 仓根）

| 端 | `$PSVersionTable.PSVersion.Major` | `echo %COMSPEC%` | 与本机链一致性 |
|---|---|---|---|
| CLI（核 `bash.mjs`） | `5`（exit 0） | `%COMSPEC%`（字面——PS 不展开 `%VAR%`；exit 0） | ✓ `config.shell="powershell"` ⇒ PS 5.x（`&&` 不可用之实况与注入行一致） |
| VSC（`shell.mjs` 自有实现） | `5`（exit 0） | `%COMSPEC%`（字面；exit 0） | ✓（三端同链 ⇒ 同值） |
| 桌面（= 核实现体——无自有副本） | `5`（exit 0） | `%COMSPEC%`（字面；exit 0） | ✓（同上） |

三端注入表 Executor 行同读 = `- Executor: … Windows PowerShell (powershell). PS 5.1 has NO &&/|| …`（raw 未命中 `/pwsh/i` ⇒ 5.x 形 ✓）；三端装配产物 `hasExecutor=true · hasAnchor=false`。

### 5.4 偏差与决策透明

1. **求值时机偏差（评审轮 2 发现 13 —— 批内登记）**：核缝 `applyPromptInjections`（`prompt-files.mjs:105-113`）为纯字符串替换、注册即快照（`:92-94`）——**不支持函数值键**（函数值会被 `String.replace` 字符串化）⇒ 设计终值「值函数 / applyPromptInjections·重装配期求值」不可达。取评审允许的兜底 = **端装配层前置求值**（import 期、注册前）：探测仍为纯运行时（进程启动读实际配置——裁定①满足）；**语义差 = 描述面 Executor 行随进程启动固定**——进程内改 `shell` 配置不刷新本行（重启生效）；hint 门（`bash.mjs:263-264` 逐执行调用同一单源）按配置值 memo 键控重探。**K2「配置变更重装配刷新」对描述面不成立、对 hint 面成立**。三端注释已按实况收正；登记 = 本节。
2. **U5 空白串差异读数（fix 块 8 维持上抛）**：`config.shell="  "` ⇒ 探测面 trim 后空、走默认链（实测 = ComSpec 链 ⇒ `cmd.exe`——批内件 U5 守）；spawn 侧现体对空白串不 trim 直传——**行为零改**（本批零触 spawn 面）。
3. **识别表实现注**：精确命中优先 + 词尾 `endsWith` 兜底（`pwsh` 专目防泛匹配；`sh` 目末位防 `fish` 尾重叠）；U1–U7/AC1 全例与设计逐字一致；兜底 = 容错超集（真未命中仍 ⇒ unknown 中性句）。
4. **本轮收正**：三端注释「运行语义与重装配期求值一致——配置变更重装配时重探」为过宽声明（描述面实际固定）→ 按实况收正为「描述面值随进程启动固定；hint 门按配置值 memo 键控重探」（偏差指向本节）；「偏差已登记 §2 fix 块」字样同步收正为「登记 = §5」。

### 5.5 边界确认（git status 实证）

本批改动集 = 产品码 6 档 + 新档 2（`shell-identity.mjs` ∥ 批内件）+ docs 3 档随动；**spawn 面零改**（`bash.mjs` diff 仅 import/门/名三处）；他批在飞面（清账 57 档等）零触；批档 §1–§4 零触（§5 = 本档）；tmp 探针 = `.thincoder/tmp/ac6-three-end-probe.mjs` ∥ `ac6-vscode-hook.mjs` ∥ `ac6-vscode-stub.mjs` ∥ `ac-red-mutant.mjs` ∥ `ac-red-control.test.mjs`（临时面——git 忽略、不入交付）。

### 5.6 文档漂移登记（本批触碰面 —— 只报告不触改）

1. `docs/desktop/design/SHELL.md:191` 行数表：`thincoder-desktop/src/main/prompt-injections.mjs` 表 22 ⇒ 本批实读 31（+9；AC7 doc-check 行数面 19 条报告态之一——该次运行读数 30、注释收正后 31）。doc-check = 报告态不入闸；该档属他批在飞触碰集 ⇒ 回填归 doc-check 工单 / eng-designer。
2. 设计档 §4 增量预计 vs 实读（含本舱收正后终盘）——已 5.3 披露，非静默：CLI 表 37 ∥ 桌面表 37 ∥ VSC 表 42（+17/+15/+21，超预计项 = 偏差登记注释块 + 护栏 + 指针）；shell-identity 107（≈70+）∥ bash.mjs 294（+5 ≈ +6）∥ shell.mjs 325（−5 ≈ −8）∥ 批内件 115（≈80）。档位判据全绿（≤300：107 ∥ 294 ∥ 37/37/42；shell.mjs 325 = 既有超软线、本批减行）。
3. `docs/core/design/PROMPT-SYSTEM.md` 三端枚举行实际坐标 = `:188`/`:190`（5.2 行 8 引 `:182`/`:183`——coordinate drift；回填归收口同笔，§2 属他段不改）。

### 5.7 审计与代码评审轮次与终态（收口轮）

**explore 差异审计（轮 1）**：四类偏差**零**（部分实现 ∥ 静默简化 ∥ 注释与代码不符 ∥ 文档漂移）；4 条 🔵 记录面观察处置——a（§5 悬空指针「见 5.6」）⇒ 本条 5.6 已补；b（5.5 tmp 探针枚举漏两档）⇒ 补正：另含 `ac4-hint-probe.mjs` ∥ `ac6-vsc-probe.mjs`（本轮重跑——AC4/AC6 读数源；本舱新增 `ac-broken-config-probe.mjs` ∥ `ac-red-control.test.mjs` ∥ `ac-red-mutant.mjs`）；c（设计档 K3 :131 含「模块加载时求值」1 处 = 否决对象点名——决策记录面合法；§2 fix 块读回句「0 命中」系指断言形删除，字面复核口径注记、§2 属他段不改）；d（SHELL_NOTES 的「may be PowerShell 5.1 … Check the user's shell before assuming」警示全仓零存——删自设计明令〔§3.3 整块删〕、VSC terminal 行整行保留；设计档 §2「语义保留」措辞按「以 terminal 行原文为准」闭合，供父侧裁）。

**advisor 代码评审（轮 1 → fix → 轮 2）**：
- 轮 1 = **changes-required**：🔴 = 设计档机制语（值函数 / applyPromptInjections·重装配期求值）vs 实装（import 期求值）**机制级互斥**——非本舱写域（eng-designer），**已上抛父侧路由**（ask 在案、回复未到；本舱倾设计档定点收正：§1:18 ∥ §2:58-61 ∥ §3.2:81 ∥ K2/K3:131 + §8 残余登记口径）；🟡 = 三端 import 期无保护读配置（损坏 config ⇒ 整进程坠）；🟡 = shell.mjs 325 行（既有登记债）；🔵 ×5。
- **fix 轮（本舱）**：🔴 按上抛处置（不修、待路由——收口条件：该项落地前不得 §6 收口）；🟡（护栏）**当场修**——三端 `prompt-injections.mjs` 加 `configShell()` try/catch（成功路径零变）；红绿实证 = 损坏配置夹具：修前 3 端 import 全坠（"Config file is not valid JSON…"）→ 修后 3 端存活、fail-open 默认链 cmd 行；批内件 8/8 复跑、三端探针读数同值。
- 轮 2 = **pass**（claims 核验：① Fixed ∥ ② Accepted〔写域 + 授权边界理由成立〕∥ 新引入 🔴 0；新增 1 条 🟡 协调项 = 上抛留痕建议入 §6）。
- **终态 = clean（代码面收敛）**；1 项 🔴（设计档收正）**待父侧路由**——非本舱可闭合。

**补记（D6 读回 · 2026-10-04 23:5x）**：5.3 行数表 = 护栏施前读数；护栏后终盘 = 5.6-2（CLI/桌面/VSC 表 = 37/37/42——较护栏前各 +6 行〔`configShell()` 护栏块〕）；5.2 行 8 的坐标与 5.5 的探针枚举已分别由 5.6-3 ∥ 5.7-b 补正（append-only 机制，不回溯改行）。

## §6 验证与收口（父代理）

**收口判词：已收口 2026-10-05**（bash 执行器语义面——批链：设计 #15 → 评审 #16 轮 1 changes-required（2🔴/5🟡/4🔵）→ fix 轮 #17（十一条）→ #18 轮 2 pass → §4 代签 → 实施 eng-coder#20（审计+评审+fix 三段在册·终态 clean）→ 评审 🔴 兜底路径落地 = 设计收正 fix 轮 #23（2026-10-05 00:43）→ 本节父侧复跑核验）

- **判据链（父侧复跑实读 2026-10-05 00:5x）**：批内件 `node --test docs/batches/2026-10-04-bash-executor-face.test.mjs`（仓根）= **8/8 pass**（父侧复跑）∥ AC1 直探三读数逐字核：`'powershell'` ⇒ `{"raw":"powershell","name":"Windows PowerShell","kind":"powershell","known":true}` ∥ `null`（win32）= ComSpec 链 ⇒ `cmd.exe` ∥ `'myweirdshell'` ⇒ `unknown`（fail-open）∥ `tool-docs/bash.md` 全文壳名（cmd.exe ∥ PowerShell ∥ Git Bash，大小写不敏感）**零命中**；:33 零断言替形在盘、:15 注入锚在盘（`{{inject:bash-terminal-face}}`）∥ 设计档收正八处逐点读回（§1:18 ∥ §2:58-60 ∥ §3.2:79-82/:87 ∥ K2/K3:131-132 ∥ §4:115 ∥ §8:169 ∥ 变更记录:178）；旧机制语残留仅 3 处沿革/记录形（:132 沿革注 ∥ :177-178 变更记录）✓
- **🔴 路由闭合（评审轮 2 发现 13 兜底路径）**：设计档机制语收正 = eng-designer fix 轮 #23 落档——终值 = 端装配层 import 期求值（缝纯字符串替换、不支持函数值键）；残余口径（描述面 Executor 行随进程启动固定——重启生效）入设计档 §8:169；批档 §2 fix 块（:89-97）为覆盖终值。**评审协调项「上抛留痕入 §6」= 本条兑现**。
- **机检读数**：`node scripts/doc-check.mjs` = exit 1——入闸悬空恰 3 条、**全在 `docs/core/design/LEDGER.md` §11（他批在飞面**——ledger-unification 批设计轮在盘未提交；成因 = 裸路径 `tools/index.mjs` 不唯一 + 新档未按「拟新增」标形）；本批件面 **0 悬空**。该 3 条已路由 ledger 批 fix 轮 #24 收正。
- **遗留/登记（父侧裁量）**：① `docs/desktop/design/SHELL.md:191` 行数回填 **22 ⇒ 37**（父侧直接执行·可 revert——回填依据 = 护栏后终盘实读 37）；② 批档 §5.2 行 8 坐标 as-of 漂移（引 `PROMPT-SYSTEM.md:182/:183` ⇒ 实读 `:188/:190`）——§6 收口同笔登记，§5 不回溯（append-only）；③ U5 空白串探测面/spawn 面差异维持上抛（设计档 §1.1 链终值补注 + 批内件守——行为零改）；④ 批内件 115 行随批归档（重跑入口 = 本档路径；零仓套件占面）。
- **台账**：#922 结算（在途 → 待核销 → 已核销；evidence = 本节 + 批内件读数）。
- **提交**：本波 commit（六产品码 + 新档 `shell-identity.mjs` + 三权威档随动 + 批档 + 批内件 + 设计档 `BASH-EXECUTOR-FACE.md`）随本仓统一签入（见 git log）——与文档清账轮同波（三档同文件混合面：`TOOLS.md` ∥ `PROMPT-SYSTEM.md` ∥ `CORE-UNIFICATION.md`）。
