# BASH-EXECUTOR-FACE（bash 执行器语义面 · 工具系统设计档）

> 板块归属 = 工具系统（本层 `TOOLS.md`）——bash 工具的**执行器身份语义面**（运行时探测与声明单源）。
> 建档：2026-10-04（bash-executor-face 批 · 批档 `docs/batches/2026-10-04-bash-executor-face.md` §2 · 台账 #922——承 #921 同族第二面「静态描述与运行时真相脱钩」）。
> **授权 = 用户 2026-10-04 22:48 三条设计约束（最高优先级）**：
> ① 探测必须 = **纯运行时**（每次会话启动/首次调用时读实际执行器；**禁止任何静态默认值/写死分支**——包括「Windows ⇒ PowerShell」这类平台推断，同一平台不同环境可不同）；
> ② `bash.md` 死写句替形必须**零断言**（只说「以注入面声明为准」，不写任何具体 shell 名做默认）；
> ③ 三端实测 = **验证探测机制在不同环境下取值正确的手段，不作为任何兜底默认的依据**；探测不到 ⇒ 注入「执行器未识别」中性句，**fail-open 到现行为，不猜**。

## 1. 修法裁定（A/B/C 取舍 + 探测机制）

| 项 | 裁定 | 依据（坐标 + 实测） |
|---|---|---|
| **修法 A**｜注入锚激活——三端 `bash-terminal-face` 填运行时执行器身份 | **采纳**（本批主面） | 锚机制位在：核缝 `thincoder-core/prompt-files.mjs:105-113`（`applyPromptInjections`——未配置恒等 ∥ 命中替换 ∥ 缺键抛错）；锚位 = `thincoder-core/tool-docs/bash.md:15`；三端取值现空/无 shell 语义（CLI `thincoder-cli/src/prompt-injections.mjs:17` 空串 ∥ 桌面 `thincoder-desktop/src/main/prompt-injections.mjs:19` 空串 ∥ VSC `thincoder-vscode/src/prompt-injections.mjs:18` 仅 terminal 参数语义） |
| **修法 B**｜`bash.md` 死写句收正 | **采纳**（本批） | 死写句 = `bash.md:33`「On Windows the shell is **cmd.exe** (NOT Git Bash, NOT PowerShell)…」；实测根因 = `~/.thincoder/config.json` `shell: "powershell"` → `thincoder-core/tools/bash.mjs:283` 直传 spawn ⇒ 本机三端实际执行器 = Windows PowerShell 5.1——描述与执行器互斥相反（父侧当日 ×4 撞墙与此吻合：PS 5.1 无 `&&` ⇒ ParserError ×2） |
| **修法 C**｜PS 解析错时工具回显当前执行器提示 | **否决（登记 —）** | Executor 声明行常驻 bash 工具描述面（修法 A 生效后每 schema 在场——命令报错时模型旁路即读，无需第二提示通道）；且用户 22:48 裁定③「探测不到不猜」与专项猜测性回显相抵 ⇒ 否决，不进本批 |
| **探测机制**｜探测源 | **钉死 = 与 spawn 链同源**：探测读数 = spawn 侧同式计算（`ctx.agent.config.shell`（trim 后非空串即用）→ 空/缺省时 win32 = `%COMSPEC%` → 仍空 = `cmd.exe`；非 win32 = `process.env.SHELL` → 空 = `/bin/sh`） | 探测源与 spawn 参数计算**逐式同源** ⇒ 探测值 = 实际执行器（不是环境快照）。候选中的 `PSModulePath` **否决**：PS 加载态 ≠ 执行器在用（本机 exec 实测恒存在）；`ComSpec` **降级为链中一环**（仅 config.shell 空时代表执行器——态 2/态 4 对照实证） |
| **探测机制**｜时机 | **端装配层 import 期一次（注册前）+ memo 进程生命周期·按配置值键控**（描述面值随进程启动固定——进程内改 `shell` 不刷新，重启生效；hint 门按配置值重探） | `shell-candidates.mjs:8` 同判据先例（「shell 路径不热变化」）；缝纯字符串替换、不支持函数值键 ⇒ 端装配层前置求值（`prompt-files.mjs:105-113`；评审轮 2 发现 13 / 批档 §5.4-1）；`toOpenAISchema` 调用期替换原语（`thincoder-core/tools/shared.mjs:174`）= 值的消费点 |
| **探测不到 ⇒ 中性句** | **钉死（fail-open，不猜）** | 用户 22:48 裁定③；Identity 未命中知名字（cmd/powershell/pwsh/bash/sh/zsh/fish/wsl）⇒ 注入中性句「当前执行器未能识别——语法以命令实际报错为准」，锚仍被替换（不留锚字面进模型——`prompt-files.mjs:109` 缺键抛错语义由供值面保证不触发） |
| **静态默认/平台推断** | **零容忍** | 用户 22:48 裁定①；平台推断已被本机实证直接证伪（同平台 cmd/PS 由 config.shell 决定，非平台属性） |

## 1.1 设计轮实证读数（as-of 2026-10-04 · 实施轮复测收正）

**产品码级四态实测**（直接驱动核 `bashTool.execute`，cwd = 仓根；坐标 = `thincoder-core/tools/bash.mjs:283` ∥ `:116-118` ∥ `:28-38`）：

| 态 | `config.shell` 传入 | 命令 | 实测结果 | 结论 |
|---|---|---|---|---|
| 1 | `"powershell"`（= 本机实际配置） | `$PSVersionTable.PSVersion.Major` | stdout `5`（exit 0） | config.shell 链 ⇒ PS 5.1 在用 |
| 2 | `null`（默认链） | 同上 | cmd.exe 报「不是内部或外部命令」（exit 1） | config.shell 空时 ⇒ cmd.exe（%COMSPEC% 链——`echo %COMSPEC%` 实测 ⇒ `C:\Windows\system32\cmd.exe`） |
| 3 | `null` | `echo hi 2>/dev/null` | hint 触发：「Current shell is cmd.exe」——正确 | hint 在 cmd 身份下正确 |
| 4 | `"powershell"` | 同上 | hint **仍喊「Current shell is cmd.exe」**；实际 stderr = PS「未能找到路径 D:\dev\null」 | **hint 无身份门 = 同族缺陷实锤**（POSIX 语法提示对 PS 也不成立——PS 重定向语法不同） |

链终值补注：COMSPEC 空分支 = win32 进程级继承面实际不可达，兜底字面为 spawn 镜像事实陈述——「unknown 中性句」只用于真探测不到（识别表未命中），不用于链兜底。

**根因链（一句话）**：三端共用核配置档 `~/.thincoder/config.json`（CLI `bin/thincoder.mjs:32` ∥ VSC `extension.mjs:92` ∥ 桌面 `src/main/main.mjs:47` 三注册点 + 三端工具实现同读 `ctx.agent?.config?.shell`——核 `bash.mjs:283` ∥ VSC `src/tools/shell.mjs:219`）⇒ 本机 `shell: "powershell"` 一键决定三端执行器；
§1 候选探测源（ComSpec/PSModulePath）与实际执行器**不同源** ⇒ 设计收正为「spawn 同链探测」。

## 2. 接口契约（机制 / 数据流）

**单源**：核内新档 `thincoder-core/shell-identity.mjs`（拟新增——本批实施轮落盘；≈70 行）——`resolveShellIdentity(configShell)` ⇒ `{ raw, name, kind, known }`：

- 入参 = spawn 侧同一取值（`ctx.agent?.config?.shell ?? null`，调用方传）；纯函数（不读环境外的状态；win32 分支内读 `%COMSPEC%`）；
- 出参四键：`raw`（链终值：config.shell 原串 ∥ %COMSPEC% ∥ "cmd.exe" ∥ SHELL ∥ "/bin/sh"）· `name`（显示名）· `kind`（语法族：`cmd` ∥ `powershell` ∥ `posix` ∥ `unknown`）· `known`（是否命中知名字）；
- 识别表**按 `raw` 尾段词匹配**（大小写不敏感）：`cmd.exe` ⇒ `{ name: "cmd.exe", kind: "cmd" }`；`powershell` ⇒ `{ name: "Windows PowerShell", kind: "powershell" }`；`pwsh` ⇒ `{ name: "PowerShell (pwsh)", kind: "powershell" }`；
  `bash` ∥ `wsl` ⇒ posix；`sh` ∥ `zsh` ∥ `fish` ⇒ posix；未命中 ⇒ `{ known: false, kind: "unknown" }`（fail-open 面——零猜测）；
- **零静态平台默认**：非 win32 且 SHELL 空 ⇒ `/bin/sh`（Node `shell:true` 兜底字面——这是 spawn 侧实际行为的事实陈述，非平台推断）。

**值面（注入文案形态 · 字面钉死，实施逐字）**——`kind` ⇒ 一行声明（不换行 · 紧凑 · 语法提示 ≤1 句）；`powershell` 族差异句按 `raw` 尾段词分流：命中 `/pwsh/i` ⇒ pwsh 形，否则 ⇒ Windows PowerShell（5.x）形：

| kind | 注入值（逐字定稿） |
|---|---|
| `cmd` | `- Executor: the bash tool runs commands through Windows cmd.exe (%COMSPEC%). Use cmd syntax: && works; NUL not /dev/null; %VAR% not $VAR; no single-quote grouping. For complex logic prefer the execute tool (node).` |
| `powershell`（raw 尾段未命中 `/pwsh/i`） | `- Executor: the bash tool runs commands through Windows PowerShell ($RAW). PS 5.1 has NO &&/\|\| (use ; or separate calls); redirection differs (2>/dev/null is invalid); cmdlets differ (Remove-Item, Copy-Item). For complex logic prefer the execute tool (node).`（`$RAW` = 模板插值 `raw` 键原值） |
| `pwsh`（raw 尾段命中 `/pwsh/i`） | `- Executor: the bash tool runs commands through PowerShell (pwsh; $RAW). && and \|\| work; %VAR% does not expand (use $VAR); cmdlets differ (Remove-Item, Copy-Item). For complex logic prefer the execute tool (node).`（`$RAW` 同上——两形同属 `powershell` kind 按 raw 尾段分流，kind 枚举不动） |
| `posix` | `- Executor: the bash tool runs commands through a POSIX shell ($RAW). Standard POSIX syntax applies ($(...), $VAR, ;, >/dev/null).`（`$RAW` 同上） |
| `unknown` | `- Executor: the bash tool shell could not be identified (raw: $RAW) — write portable commands and trust the command's own error output.`（`$RAW` 同上） |

**数据流（三端）**：端装配层在本端 `prompt-injections.mjs` 的 `bash-terminal-face` 键填 **import 期求值**的结果（模块加载即求值·注册前）：`executorLine(resolveShellIdentity(configShell()))` ⇒ 按上表组装为静态字符串——
核缝 `applyPromptInjections` 为纯字符串替换、注册即快照（`prompt-files.mjs:105-113` ∥ `:92-94`；函数值会被 `String.replace` 字符串化 ⇒ 不支持函数值键——评审轮 2 发现 13 兜底路径 / 批档 §5.4-1）⇒ **描述面值随进程启动固定**：进程内改 `shell` 配置不刷新该行（重启生效——残余口径 §8）；
hint 门等逐执行调用面按配置值 memo 键控重探（同配置值 ⇒ 取缓存身份；配置值变化 ⇒ 未命中重探——裁定①零静态成立）→
三端注册点不动（`thincoder-cli/bin/thincoder.mjs:32` ∥ `thincoder-vscode/extension.mjs:92` ∥ `thincoder-desktop/src/main/main.mjs:47`）→ `DESC("bash")` 装配链在 `toOpenAISchema` 调用期完成替换（`thincoder-core/tools/shared.mjs:174`）。

**VSC 端附加面**：VSC `bash-terminal-face` 值 = **执行器声明行 + 既有 terminal 参数行**（两段拼接——terminal 参数语义是 VSC 宿主能力面，
保留原文 `thincoder-vscode/src/prompt-injections.mjs:18` 整行不动，前拼执行器声明行）。
VSC 自有 `tools/shell.mjs` 的 `SHELL_NOTES`（`:162-166`——**死常量**：全档无引用）**整块删除**。

**VSC terminal 面边界**：`terminal: "visible"/"inject"` 跑在用户自己的可见终端（用户 shell 不可探测）——
既有文案已声明「may be PowerShell 5.1 … Check the user's shell before assuming」（`shell.mjs:165`）语义保留（以 terminal 参数行原文为准）；
本机制只声明**隔离子进程**执行器。

## 3. 机制设计（四处改面）

### 3.1 探测单源——新档 `thincoder-core/shell-identity.mjs`（拟新增——实施轮落盘）

§2 契约的实现体；纯函数 + 识别表；**禁平台推断**（判定永远从 `raw` 值出发，不从 `process.platform` 出发——
win32 只用于决定「config.shell 空时读 %COMSPEC% 还是 SHELL」这一 spawn 侧既有行为的事实镜像）。
测试缝：`_setComSpecForTest(value)`（注入 %COMSPEC% 读数——仿 `shell-candidates.mjs:34` `_setShellDetectForTest` 先例）。

### 3.2 三端注入表——端装配层 import 期求值

三端 `prompt-injections.mjs` 的 `bash-terminal-face` 键值 = **import 期求值的静态字符串**（`executorLine(resolveShellIdentity(configShell()))`——模块加载即求值、注册前）：核心缝 `applyPromptInjections` 为纯字符串替换、不支持函数值键（函数值会被 `String.replace` 字符串化——`prompt-files.mjs:105-113`）。
⇒ **描述面值随进程启动固定**——进程内改 `shell` 配置不刷新该行（重启生效）；同一单源 memo 按配置值键控服务逐执行调用面（hint 门——同配置值取缓存身份，配置值变化 ⇒ 未命中重探，裁定①零静态成立）：

- CLI（`thincoder-cli/src/prompt-injections.mjs:17`）：空串 → 执行器声明行；
- 桌面（`thincoder-desktop/src/main/prompt-injections.mjs:19`）：空串 → 执行器声明行（桌面 = 核缺省隔离子进程，无 terminal 参数——与 CLI 同形）；
- VSC（`thincoder-vscode/src/prompt-injections.mjs:18`）：执行器声明行 + 既有 terminal 参数行拼接。
- 三端取 config.shell 的读法：CLI/桌面 = 核 `loadConfig()?.shell`；VSC = 核 `loadConfig()?.shell`（同源 `config-io.mjs`——`thincoder-vscode/src/extension/settings.mjs:12` 既有 import 面）；读带 try/catch fail-open 护栏（读失败 ⇒ null ⇒ 默认链——损坏配置不阻断进程）。
  **端侧零探测逻辑**（纯调核单源——多实现面纪律：语义同源、原文自持）。

### 3.3 `bash.md` 死写句替形（零断言）+ hint 身份门 + 桌面 execute 随动

- `bash.md:33` 整行替换为（**零断言替形 · 字面钉死**）：
  `- Shell identity: the bash tool's shell is NOT fixed — it depends on configuration and environment. The current executor is declared in the Executor line above; write commands for THAT shell, and when a command fails read its error output to identify the actual shell.`
  （不出现任何具体 shell 名；「以注入面声明为准」语义 = 「Executor line above」。）
- `posixSyntaxHint`（`bash.mjs:28-38`）加**身份门**：`resolveShellIdentity(ctx.agent?.config?.shell).kind === "cmd"` 才产出 hint；
  kind ≠ cmd ⇒ 返回空串（PS/POSIX 环境不再喊 cmd.exe）；提示语中「Current shell is cmd.exe」改为引用探测名（探测出参 `name`）。
  VSC `tools/shell.mjs` 无 hint 面（grep 实证零命中）——零随动；
  **桌面端 bash 实现体 = 核 `bash.mjs`（无自有副本——桌面 grep 实证零命中 `posixSyntaxHint`/`SHELL_NOTES`）** ⇒ 核改即桌面随动，零桌面产品码改动。
- 删除 VSC `shell.mjs:159-166` 死常量块 `SHELL_NOTES`（含 `isWin` 若无他引用——实施时核对该档 `isWin` 其余引用面）。

### 3.4 权威档同步（本层三档 · 一行级）

- `docs/core/design/TOOLS.md` §6.2 schema 生成行后补一行：bash 执行器身份单源 = `BASH-EXECUTOR-FACE.md`（本档）——指针不复制（D2）。
- `docs/core/design/PROMPT-SYSTEM.md` §6.3「遗留注入锚」行的 `bash-terminal-face` 处置语收正：**已激活**（运行时执行器身份——机制单源 = 本层 `BASH-EXECUTOR-FACE.md`）；
  **同笔补取值表枚举**——取值表行并入 `thincoder-desktop/src/main/prompt-injections.mjs`（三端面枚举齐：CLI ∥ VSC ∥ 桌面）；
  `CORE-UNIFICATION.md` §2.13.2「工具面 2 锚保留（待工具面 review 统一）」行同笔收正（bash 锚已处置；question 锚仍待 review——**该行保留 question 半边**）。

## 4. 受影响文件清单（当前行数 → 预计增量）

| # | 档 | 现行数 | 增量 | 动作 |
|---|---|---|---|---|
| 1 | `thincoder-core/shell-identity.mjs`（拟新增——实施轮落盘） | 0 | +≈70 | 探测单源（§3.1） |
| 2 | `thincoder-core/tool-docs/bash.md` | 38 | 0（行替换） | `:33` 死写句 → 零断言替形（§3.3） |
| 3 | `thincoder-core/tools/bash.mjs` | 289 | +≈6 | hint 身份门（§3.3） |
| 4 | `thincoder-cli/src/prompt-injections.mjs` | 20 | +≈4 | import 期求值（§3.2） |
| 5 | `thincoder-desktop/src/main/prompt-injections.mjs` | 22 | +≈4 | 同上 |
| 6 | `thincoder-vscode/src/prompt-injections.mjs` | 21 | +≈4 | 同上 + terminal 行拼接（§2） |
| 7 | `thincoder-vscode/src/tools/shell.mjs` | 331 | −≈8 | 死常量 SHELL_NOTES 删除（§3.3） |
| 8 | 批档归档单测件 `docs/batches/2026-10-04-bash-executor-face.test.mjs`（随批归档——不入 `thincoder-core/test/` 仓套件树） | 0 | +≈80 | 单测（§6 用例表转测——§6.10 教义：开发期工具不占仓套件） |
| 9 | `docs/core/design/TOOLS.md` | 1230 | +1 | §6.2 指针行（§3.4） |
| 10 | `docs/core/design/PROMPT-SYSTEM.md` | 650 | 0（行内收正） | §6.3 处置语（§3.4） |
| 11 | `docs/core/design/CORE-UNIFICATION.md` | 2054 | 0（行内收正） | §2.13.2 处置语（§3.4） |

档位判定：新档 `shell-identity.mjs` ≈70 行 ≤300 软线 ✓；`bash.mjs` 289 +6 = ≈295 仍 ≤300 ✓；`shell.mjs` 331 −8 = ≈323（**既有超软线档——减行不触登记义务**；其登记面 = 既有拆分计划，本批零新语义）。测试档不入仓套件（批档 §5 单测面——随批归档）。

## 5. 关键决策记录（含否决备选）

| # | 决策 | 否决的备选 + 理由 |
|---|---|---|
| K1 | 探测源 = spawn 同链（config.shell → %COMSPEC% → 兜底字面） | 否决「ComSpec 为主探测源」（§1 候选 A 原形）：config.shell 非空时 ComSpec 与实际执行器**不同源**（态 2/态 4 对照实证——本机 ComSpec=cmd.exe 而实际=PS 5.1）；否决「PSModulePath 探测」：PS 加载态 ≠ 在用（本机恒存在——exec 实测），且非 win32 无此变量 |
| K2 | 探测时机 = 端装配层 import 期一次（注册前）+ memo 进程生命周期·按配置值键控 | 否决「每次调用时探测（无 memo）」：值只随配置值变化——memo 键控后同配置值零重探（hint 门逐执行调用即命中缓存）；memo 先例 = `shell-candidates.mjs:8`（同判据）；描述面值随进程启动固定（进程内改 `shell` 配置不刷新——重启生效，残余口径 §8） |
| K3 | 注入值 = **端装配层 import 期求值**（注册前——`executorLine(resolveShellIdentity(configShell()))`） | **原设计 ⇒ 实装改**：求值形态由「值函数/`applyPromptInjections`·重装配期求值」收正为端装配层 import 期求值（缝纯字符串替换、不支持函数值键——原否决项「模块加载时求值一次」即此形态；`prompt-files.mjs:105-113`；评审轮 2 发现 13 / 批档 §5.4-1）；否决「每次 schema 构建无 memo 重算」：值只随配置值变化——memo 键控后未变配置零重探；否决「工具描述静态写死具体 shell 名」（修法 B 单独成案——下一环境复现同族缺陷，用户裁定①） |
| K4 | 修法 C 否决 | Executor 声明行常驻工具描述面（修法 A 生效后每 schema 在场——报错旁即读）+ 用户裁定③「探测不到不猜」（专项回显 = 猜测性第二通道，相抵） |
| K5 | hint 身份门 kind==cmd 才出 | 否决「hint 文案改为通用语法提醒」：POSIX 语法提示对 PS 亦误导（态 4——PS 重定向语法不同）；kind 门 = 精确修 |
| K6 | VSC terminal 参数语义保留于 VSC 表 | 否决「并入核 bash.md」：visible/inject = VSC 宿主能力面（terminal 参数核 schema 无此键——`bash.mjs:240-249` 实证）＝合法宿主差异（端差纪律唯一例外面）；执行器声明行（三端共用）与 terminal 行（VSC 独有）分属两语义面，拼接不合并 |
| K7 | bash.md 替形 = 纯零断言句 | 用户裁定②直接钉死；否则决「替形写 Windows 默认 cmd」——同族缺陷复现通道 |

## 6. 验收标准（回指批档 §2 条目 · 机判）

| # | 判据（命令 → 期望） | 回指 |
|---|---|---|
| AC1 | `node -e "import('./thincoder-core/shell-identity.mjs').then(m=>console.log(JSON.stringify(m.resolveShellIdentity('powershell'))))"` ⇒ `known:true, kind:"powershell"`；入参 `null`（win32）⇒ `kind:"cmd", raw:"C:\\Windows\\system32\\cmd.exe"`（以实机 ComSpec 为准） | 批档 §2 · 机制设计 |
| AC2 | 三端启动后 `applyPromptInjections(DESC("bash"))` 产物含 `Executor:` 行、**零 `{{inject:` 字面**、零「On Windows the shell is」死写句 | 批档 §2 · 交付 = 注入激活 |
| AC3 | `bash.md` 全文 grep `cmd.exe`/`PowerShell`/`Git Bash` ⇒ **0 命中**（零断言验收） | 批档 §2 · 修法 B |
| AC4 | 态 4 复测（config.shell=powershell + `echo hi 2>/dev/null`）⇒ 输出**零 hint**（身份门生效）；态 3 复测（shell=null）⇒ hint 在场且写探测名 | 批档 §2 · hint 身份门 |
| AC5 | `grep -r "SHELL_NOTES" thincoder-vscode/src` ⇒ 0 命中（死常量清除） | §3.3 |
| AC6 | 三端实测取证在档（批档 §5）：CLI / VSC / 桌面各跑一次探针命令（`$PSVersionTable.PSVersion.Major` ∥ `echo %COMSPEC%`），读数与本机 config.shell 链一致（三端同链 ⇒ 同值） | 批档 §2 · 验收标准② |
| AC7 | 探测不到路径（config.shell = 未知名——U4 夹具 `"myweirdshell"`）⇒ 注入 unknown 中性句（fail-open——不猜）；`_setComSpecForTest("")` + shell=null ⇒ `kind:"cmd"`、注入 cmd 行（链终值 = 兜底字面 `cmd.exe`——spawn 镜像，探测值 = 实际执行器） | 批档 §2 · 用户裁定③ |
| AC8 | 核测试 `node --test`（cwd = thincoder-core）全绿；CLI/VSC `npm test` 全绿；桌面装配产物断言（AC2 同式：桌面 `applyPromptInjections(DESC("bash"))` 产物含 `Executor:` 行 ∥ 零 `{{inject:` 字面——桌面套件存在与否实施轮核：在 ⇒ 入套件跑，不在 ⇒ 装配探针直断）；`node scripts/doc-check.mjs` exit 0 | 批档 §2 · 验收标准③（设计轮 doc-check 于本设计轮已跑——见交付报告） |

## 7. 用例表（正常 / 边界 / 错误）

| 用例 | 类 | 输入 | 预期输出 |
|---|---|---|---|
| U1 | 正常 | config.shell=`"pwsh"` → resolve | `{raw:"pwsh", name:"PowerShell (pwsh)", kind:"powershell", known:true}`；注入 = pwsh 形（值面按 `/pwsh/i` 分流——`&&` 可用差异句，非 PS 5.1 形） |
| U2 | 正常 | config.shell=`null`（win32，ComSpec=cmd.exe） | kind=cmd；注入 = cmd 行；hint 门开 |
| U3 | 正常 | config.shell=`"C:\\Program Files\\Git\\bin\\bash.exe"` | 尾段 `bash.exe` ⇒ kind=posix；注入 = posix 行 |
| U4 | 边界 | config.shell=`"myweirdshell"`（未知名） | known=false ⇒ unknown 中性句（fail-open；**不**默认任何族） |
| U5 | 边界 | config.shell=`"  "`（纯空白） | trim 后空 ⇒ 走默认链（与 spawn 侧 `?? null` 后 spawn 行为一致——注：spawn 侧现体对空白串不 trim，直传 spawn 会失败；探测面按 trim 空归默认链，**不改变 spawn 现行为**——如实陈述差异，不改 spawn 面） |
| U6 | 错误 | bash.md 缺 Executor 行上游（注入表未配置——端侧漏配键） | `prompt-files.mjs:109` 抛错（fail-loud 既有语义——本批零改；三端装配层保证配置） |
| U7 | 边界 | 非 win32 + SHELL 未设 | raw=/bin/sh（Node 兜底字面镜像），kind=posix |

## 8. 边界（本批不做）

- **零触**：advisor/subagent 工具面（#921 域）∥ 在飞三批面（清账 docs/** ∥ #919 renderer ∥ #907 provider）∥ manifest 面 ∥
  需求档/提示词正本面（`docs/core/design/prompts/**`——注入值本身除外）∥ VSC terminal 参数语义（`shell.mjs` visible/inject 行原文保留）∥
  spawn 面行为本身（`shell` 参数计算式零改——本批只加声明面与 hint 门）。
- 边界口径：批档 §1 授权边界 = **设计前枚举**（三面——`tool-docs/bash.md` ∥ 三端 `prompt-injections.mjs` ∥ 探测辅助档）；本批条目 4（hint 身份门）∥ 5（VSC 死常量删除）∥ 6（权威档三档指针/收正）依用户 2026-10-04 22:50 全链授权纳入（同缺陷族修复面，非新语义）。
- 残余口径（偏差登记 = 批档 §5.4-1 · 评审轮 2 发现 13 兜底路径）：核心缝注册即快照、不支持函数值键 ⇒ **描述面 Executor 行随进程启动固定**——进程存活期内改 `shell` 配置不刷新该行（重启生效）；hint 门等逐执行调用面按配置值 memo 键控重探。
- 不改 `shell-candidates.mjs`（设置面板候选面——与本机制不同语义面：候选探测 vs 身份声明）；不做可见终端（用户 shell）探测（不可探测——K6）。
- 不动 `question-ui-face` 锚（仍待工具面 review——本批只处置 bash 锚）。
- 设计轮**产品码零写**（本批为设计轮——§4 清单全部由实施轮 eng-coder 落）。

## 变更记录

- 2026-10-04 建档（bash-executor-face 批 · 设计轮 · eng-designer——承批档 `docs/batches/2026-10-04-bash-executor-face.md` §2 · 台账 #922）：修法裁定（A/B 采纳 · C 否决）· 探测机制钉死（spawn 同链 · 运行时 · memo · fail-open）· 三端注入契约与文案字面定稿 · hint 身份门 · VSC 死常量清除 · 权威档两处指针/收正 · 受影响文件 11 档 · AC1–AC8 · 用例 U1–U7 · 边界。授权 = 用户 22:48 三条设计约束（档头）。
- 2026-10-04 fix 轮（评审轮 1 · 发现 1–11 逐条落位——终值 = 批档 §2 fix 轮修正块）：AC7 夹具改未知名 + 补「空 COMSPEC ⇒ cmd 行」断言（§1.1 链终值补注）· 注入求值钉死「值函数 / 重装配期 + memo 按配置值键控」（§2 数据流 ∥ §3.2 ∥ K3）· powershell 值面按 /pwsh/i 分流两形（值面表 ∥ U1）· C 否决理由改写实据（悬空句删）· §8 边界口径注 · §4 行 8 测试落点批档归档 · §3.4 计数三档 · AC8 补桌面装配断言 · §3.4 补 PROMPT-SYSTEM 取值表桌面枚举 · U5 ∥ 评审局限登记（无改动）。
- 2026-10-05 fix 轮（评审轮 2 · 发现 13 兜底路径落地）：求值机制语收正——原「值函数 / `applyPromptInjections`·重装配期求值」**⇒ 实装改** = 端装配层 import 期求值（缝纯字符串替换、不支持函数值键——偏差登记 = 批档 §5.4-1）；描述面值随进程启动固定（进程内改 `shell` 不刷新、重启生效——§8 残余口径）；§1:18 ∥ §2 数据流 ∥ §3.2 ∥ K2/K3 同步收正 + §4:115 动作列 + §8 残余登记。
