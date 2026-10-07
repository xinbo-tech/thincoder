# 2026-10-07 · browser-tool
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 13:11「点火。」——承 13:10 范围裁定原话（见台账 #1007）。。
> 台账 = #1007（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-07
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-07）**

### 1.1 来源与点火

- 来源 = 用户 2026-10-07 13:10 原话：「不需要能接管，能自己启动自己操作就行，可以做成一个浏览器工具给thincoder使用，应该无头有头都支持。」——范围钉死：**自启自操作 ∥ 无接管（无扩展）∥ 无头+有头**。
- 点火 = 用户 13:11「点火。」。
- 需求档 = `docs/core/requirements/BROWSER-TOOL.md`（新建——F-BT1–F-BT8 ∥ N-BT1–N-BT6 ∥ 边界 §4；本批设计对位它）。

### 1.2 合并扫描（点火前——依批次纪律）

| 候选 | 判 | 理由 |
|---|---|---|
| #1007 本体 | 立批（本批） | — |
| #857（websearch 后端可配置） | 不并 | 阻塞条件未达（待外部端点证据）；且面 = 搜索后端 ≠ 浏览器驱动 |
| #855（多窗口槽分配）∥ #868（designToken 签发可靠性） | 不并 | 均待复现材料（条件未达） |
| #946（VSC 残两处）∥ #967（server README 注记） | 不并 | 不同实施面（VSC 面 ∥ 产品文面） |
| 文档清账族（#654/#924/#953/#954/#958/#977/#983/#1000） | 不并（另批同波） | 文档面 ≠ 工具面（不同交付目标）；本波同时点火 = `docs/batches/2026-10-07-doc-cleanup.md` |

### 1.3 授权口径

- 用户 13:01「可以，自动干到落地」+ 12:25「自动跑」全链授权（自缚三条：需新范围 ∥ 用户口径裁决 ⇒ 停；破坏性先停）——本批全链（设计 → 评审 → §4 代签 → 实施 → 收口）自动执行。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-07 · 设计档 = BROWSER-TOOL.md（新建）；14 条目逐条落点/验收在段；登记面同拍（TOOLS.md §6.7 ∥ docs/README.md）；行宽绿 · 本档新增悬空锚 0；评审轮 1 修轮 9 条已落（修轮块））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮交付（eng-designer · 2026-10-07）**

设计档 = `docs/core/design/BROWSER-TOOL.md`（**新建**——本板块设计权威：八动作契约 ∥ 引用机制 ∥ 会话模型 ∥ 安全面 ∥ 四端注册 ∥ 受影响文件 ∥ 用例面）。登记面同拍：`docs/core/design/TOOLS.md` §6.7 加 browser 条 + 变更记录；`docs/README.md` §4 登记新档（「其余」35 ⇒ 36 档）+ 变更记录。需求档（`docs/core/requirements/BROWSER-TOOL.md`）= 主 agent 笔，**零改**（设计逐条对位——判定句皆可机验，五要素齐备）。

**本批条目（覆盖——14 条；需求单源 = `docs/core/requirements/BROWSER-TOOL.md`；行号 = 该档实读）**

| # | 条目 | 需求行 | 交付面（落点） | 验收判据（机验） |
|---|---|---|---|---|
| E-1 | 自启浏览器（无接管） | F-BT1 `:19` | `thincoder-core/browser/launch.mjs`（发现表 + spawn + DevToolsActivePort）∥ `browser/session.mjs`（开启序） | 冒烟 S1：零预置自启成功；`--user-data-dir` 非默认；代码面无连接既有实例路径 |
| E-2 | 无头 ∥ 有头双模式 | F-BT2 `:20` | `session.mjs`（`headless` = 会话开启参数）∥ schema `headless?` | 单测 T7（异值报错句）；冒烟 S1 ∥ S7 |
| E-3 | 动作面（八动作） | F-BT3 `:21` | `thincoder-core/tools/browser.mjs`（schema/校验/回执）∥ `session.mjs`（八动作） | 单测 T1/T2（schema 枚举 + 回执文法逐动作）；冒烟 S1（navigate 内联新页清单） |
| E-4 | 元素引用步进 | F-BT4 `:22` | `browser/snapshot.mjs`（引用表：稳定键 + 复用 + [new] + 失效标注 + 上限） | 单测 T3（生成/复用/[new]/disabled/stale/上限）；冒烟 S2 |
| E-5 | 等待与稳定判定 | F-BT5 `:23` | `session.mjs` wait（selector/text/url/networkIdle + 超时）∥ 失败回执带页摘 + 清单 | 单测 T4；冒烟 S3（命中）∥ S4（超时回执） |
| E-6 | 登录态持久 | F-BT6 `:24` | `launch.mjs` profile = `~/.thincoder/browser/profile`（持久） | 单测 T8；冒烟 S5（同 profile 两会话免登） |
| E-7 | 写操作闸 | F-BT7 `:25` | `tools/browser.mjs` `isReadonlyAction`（click/evaluate 过闸）+ `thincoder-core/permission.mjs` formatPermission browser 分支 | 单测 T5（分类表）+ T6（拒绝回执句）；读盘断言分支在档 |
| E-8 | 四端注册 | F-BT8 `:26` | `thincoder-core/tools/index.mjs` ∥ `thincoder-vscode/src/tools/index.mjs`（CLI/桌面随核装配自动） | 单测 T9（核表 + VSC 清单）∥ T10（无浏览器错误句） |
| E-9 | 零第三方依赖 | N-BT1 `:32` | 全组 import 面（`node:*` + 仓内） | 单测 T11（import 扫描——仅 node:* + 相对路径） |
| E-10 | 不可信数据处理 | N-BT2 `:33` | `tool-docs/browser.md` untrusted 句 + 回执 source 标注（`[page]` / `[evaluate @`） | 单测 T12 |
| E-11 | 输出规模上限 | N-BT3 `:34` | snapshot 100/200 条 + 20k 字符；evaluate 8k 字符（皆截断标记） | 单测 T13（101 元素 / 8001 字符两格） |
| E-12 | 隔离与凭据 | N-BT4 `:35` | profile 隔离 + password 目标 `(hidden)` + 零凭据回读（Cookie 库零读） | 单测 T14 |
| E-13 | 平台面 | N-BT5 `:36` | `launch.mjs` 三平台候选表 + `BROWSER_PATH` + 找不到错误句 | 单测 T15（打桩——零真实文件系统依赖） |
| E-14 | 可测试 | N-BT6 `:37` | 批内件两档（假传输单测 + 真浏览器冒烟） | 两档先红后绿（读数入 §5） |

**本批不做（明确排除）**：接管/扩展/WebView2/录制回放/第三方自动化库（需求 §4 全体——代码层零分支）；多标签管理/弹窗跟随；多命名会话（单会话/进程 + profile 锁）；SSRF 私网拦截（KD-7 理由在档）；不改 `web`/`websearch` 语义（D2）；不改审批/权限机制本体（仅加 `formatPermission` 一个展示分支）；不改需求档/提示词面；不建模型侧新机制。

**登记面与落点（本笔已落——as-of 2026-10-07）**

| 面 | 落点 | 内容 |
|---|---|---|
| 设计档 | `docs/core/design/BROWSER-TOOL.md`（新建 · 273 行） | 全机制权威（§1 方案 ∥ §2 契约 ∥ §3 安全 ∥ §4 发现/profile ∥ §5 文件表 ∥ §6 决策 ∥ §7 回指 ∥ §8 用例 ∥ §9 边界 ∥ §10 UI） |
| 工具系统档 | `docs/core/design/TOOLS.md` §6.7（`:245-246`）+ 变更记录 | browser 条（两行——自启 + 引用步进 + 审批门 + 权威指针） |
| 文档地图 | `docs/README.md` §4（`:73-75`）+ 变更记录 | 新档登记（浏览器工具面 1 档；35 ⇒ 36 档） |

**受影响文件清单（现行行数 = 2026-10-07 实读——实施轮照此表落）**

| 文件 | 现行 | Δ（⇒ ≈） | 说明 |
|---|---|---|---|
| `thincoder-core/browser/cdp.mjs` | 新档 | ≈90 | CDP 客户端（call/on/close；`WebSocketImpl` 注入缝） |
| `thincoder-core/browser/launch.mjs` | 新档 | ≈160 | 候选表 ∥ profile 锁 ∥ 启动 ∥ 杀树 |
| `thincoder-core/browser/snapshot.mjs` | 新档 | ≈180 | 快照脚本 ∥ 归一 ∥ 引用表 ∥ 渲染 ∥ 页摘 |
| `thincoder-core/browser/session.mjs` | 新档 | ≈240 | 单例 ∥ 队列 ∥ 八动作 ∥ 寻址 ∥ 空闲关 |
| `thincoder-core/tools/browser.mjs` | 新档 | ≈170 | 工具面（schema/校验/hook/回执） |
| `thincoder-core/tool-docs/browser.md` | 新档 | ≈45 | 六要素——**必须与代码同提交**（缺失 ⇒ import 期抛错） |
| `thincoder-core/tools/index.mjs` | 77 | +3 ⇒ 80 | 核登记（静态表 + 导出） |
| `thincoder-vscode/src/tools/index.mjs` | 187 | +2 ⇒ 189 | VSC 清单登记 |
| `thincoder-core/permission.mjs` | 80 | +7 ⇒ 87 | formatPermission browser 分支 |
| `thincoder-core/config.mjs` | 491 | +4 ⇒ ≈495 | `DEFAULTS.browser.allowDomains` + 合并行（**余量 5——见上抛 1**） |
| `docs/batches/2026-10-07-browser-tool.test.mjs` | 新档 | ≈260 | 单测（假传输——T1–T15） |
| `docs/batches/2026-10-07-browser-tool.smoke.mjs` | 新档 | ≈120 | 真浏览器冒烟（S1–S7——N-BT6） |

**拆分决定（设计定形——钉死）**：五档新面单档全 <300 软线；既有档零结构改动；`config.mjs` 贴限不拆（零重构——上抛 1）。

**测试面（批内件两档——随批归档，不入仓套件）**：用例全表 = 设计档 §8（U1–U22）+ §7 判据列（T1–T15 单测 ∥ S1–S7 冒烟）；单测零真实浏览器/文件系统（`WebSocketImpl` + `_deps` 注入缝）；冒烟 = 本机 Edge/Chrome 无头 + 进程内 fixture 服务（沿 `scripts/console-walkthrough.mjs` 形态）。复跑 = 仓根 `node --test <批内件>`；先红后绿读数入 §5。

**验收对照（三链同源——需求 ↔ §2 条目 ↔ 设计档 §7）**：E-1–E-14 逐条 ⟷ F-BT1–8 ∥ N-BT1–6 逐行 ⟷ 设计档 §7 表逐行；机器面 = 批内件两档全绿 + `node scripts/doc-check.mjs`（本笔新增悬空锚 0 · 行宽绿）+ `node scripts/api-contract.mjs --check`（实施轮随动，若生成区覆盖新档）。

**关键决策（要旨——逐字见设计档 §6 KD-1–KD-9）**：KD-1 引用 = 稳定键 + 会话内单调号（跨快照复用）；KD-2 写闸 = dispatch 分类钩子（click/evaluate 过闸——不双问、planMode/批量/autoApprove 全随既有语义）；KD-3 域允许清单 = 配置键 `browser.allowDomains`（缺省空）+ navigate/当前页两点强检（护栏非沙箱）；KD-4 `headless` = 会话开启参数（异值报错不热切）；KD-5 单会话/进程 + profile 锁；KD-6 screenshot 落盘返路径；KD-7 不设 SSRF 私网拦截；KD-8 空闲 15 分钟自动关 + 进程退出杀树；KD-9 描述面英文 ≈45 行。

**上抛项（父侧 / 评审面）**

1. **`thincoder-core/config.mjs` 余量告警**：491 ⇒ ≈495（上限 500——余量 5）。本批照加（+4 行、零重构）；**后续任何 config 增量前须先拆档**（候选方向 = DEFAULTS 外提）——请父侧裁是否另行登记台账。
2. **地图计数核对行滞后（实读披露）**：`docs/README.md` §4 计数核对行（as-of 2026-09-30 · 实档 57 = 登记 57）与在盘实读不符——本档入册前 `docs/core/design/` 实档 **58**、入册后 **59**。本笔只登记本档（「其余」35 ⇒ 36）+ 变更记录，**未动**计数核对行（非本批面；另有并行清账批在途）——请父侧知悉归属。
3. **doc-check 锚闸现状（列报）**：全库悬空 **66**（基线 66——本笔新增 **0**：新股 10 处引用皆标「拟新增」；行宽闸绿）。其中一处涉及本波批面：`docs/core/requirements/BROWSER-TOOL.md:52` 引 `docs/design/browser.md`（thinworker 参考）悬空——**需求档 = 主 agent 笔**，修正形（声明源前缀 ∥ 标记族）请父侧裁。
4. **F-BT7「配置化允许清单」的取舍披露**：本设计取「逐次确认」分支（既有审批机制）+ 另立 `browser.allowDomains` 收束面；**未**把清单做成审批豁免（豁免要跨层把配置读进分类钩子——引入隐态，KD-2/KD-3）。如父侧/用户要豁免语义，另笔裁。
5. **VSC 设置面板无 `browser.allowDomains` 行**（config 文件 ∥ settings 工具可达）——登记为已知面，非本批缺口。

**实施轮任务书指针**：eng-coder 按 `BROWSER-TOOL.md` §2–§6 逐表执行（文件拆分 / 落点 / 常量 / 回执文法已钉死）；`tool-docs/browser.md` 与代码同提交；批内件两档落 `docs/batches/`；`api-contract --write` 随动（若覆盖新档）；`tool-schema-size.mjs` 报告读数入 §5；§5 含先红/后绿两读。

**修轮块（设计评审轮 1 · 9 条 · eng-designer · 2026-10-07）**——父侧裁决 = 全数落地为文档修订；diff 面 = `docs/core/design/BROWSER-TOOL.md` + 本段（零扩面）。

| # | 发现（§3 轮次 1） | 改动位置（as-of 修后实读） | 修法一句 |
|---|---|---|---|
| 1 | click 闸 ∥ navigate 免审判据不对称（🟡） | 设计档 §3.1 `:126` ∥ `:128` ∥ `:129` | 行为不动；删「GET 安全」援引，补 navigate 残险与对冲句（入口 + allowDomains 收束 + 回执可审计）；两栏差异单点 = 有无等价收束面 |
| 2 | `url` 注缺 wait（🟡） | §2.1 `:40` | 注改 `// navigate ∥ wait` |
| 3 | 「见上抛 1」悬空 ×2（🟡） | §5 `:190` ∥ `:196` | 就地写明：491⇒≈495 贴限 · 零重构 · 后续 config 增量前先拆档（登记 = 台账 #1009） |
| 4 | S6 声明无定义（🔵） | §7 F-BT3 行 `:218` | 补定义 S6 = screenshot 真落盘（PNG 头 · >0 字节）——U6 无他面可落（单测零真 fs），取「补定义」支 |
| 5 | §5 口径（行数）vs TOOLS 行（字节）（🔵） | §5 表头 `:177` | 注明「.md 档记字节——行数口径豁免」 |
| 6 | TOOLS 条恐复述机制（🔵） | §5 TOOLS.md 行 `:193` | 明书「指针 + 一句定位（机制细节以本档为权威，不复制）」 |
| 7 | 缝缺回落/还原纪律（🔵） | §7 N-BT6 行 `:229` | 补「缝默认回落真实现（`??`）· 用例 `finally` 还原 · 冒烟零依赖缝」 |
| 8 | F-BT4「显式标注」口径未记（🔵） | §2.3 `:89` | 取「使用时报错」读法（stale 回执 = 显式标注；T3 stale = 回执面）；快照不加消失标记（取舍在档） |
| 9 | U 表无落点 · 切换正例缺（🔵） | §8 `:233-257` ∥ §7 F-BT2 行 `:217` ∥ §8 注 `:259` | 落点列逐条覆盖（单测 T*/冒烟 S*；无编号格 = 单测组）；补 U23 = close→异值重开正例（落 T7） |

附记：① §8 U 表扩为 U1–U23（+U23）——本段前文「U1–U22」以本块为准；② 行增量 +4（原 276 行 ⇒ 280，行内改为主）；③ 落点列中 U16/U20/U22 无专属 T 编号（记「单测」——如需专属格另笔）；④ 修轮未触需求档 ∥ `TOOLS.md` ∥ `README.md`；⑤ doc-check 复跑 = 行宽绿 · 本档非报告面行 0（全库悬空读数 65——非本笔）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements（F-BT7 判据面） | 🟡 | 安全判据内部不对称：设计 `thincoder/docs/core/design/BROWSER-TOOL.md:125` 以「`<a>` 可携 JS 副作用、query 串 GET 亦可致变」为由主张 click 全量过闸，而 `:127` 以「GET 语义——Web 约定安全且为会话入口」把 navigate 列免审面——navigate 可直达 query 串变造 URL，同一论据对两类动作给出相反结论（需求档 `thincoder/docs/core/requirements/BROWSER-TOOL.md:25` 只钉「不可逆类」并把判据面交设计，故属判据自洽问题而非需求违背）。 | 在 §3.1 补记 navigate 免审的残余风险与对冲（allowDomains 非空即收束、回执可审计），或把 navigate 纳入条件性闸面，使 F-BT7 判据句在 click ∥ navigate 两侧一致。 |
| 2 | Clarity（schema 单表） | 🟡 | 参数字典与动作契约同档两处定性不一致：`thincoder/docs/core/design/BROWSER-TOOL.md:40` 注释 `url?: string` → `// navigate`（仅 navigate），而 `:65` wait 四选一含 url（「四选一：**selector** ∥ **text** ∥ **url** ∥ **networkIdle:true**」）、`:71` 释「url = `location.href` 含子串」；对照 `:42`/`:44` 的 text/selector 均注「∥ wait」，url 注释漏 wait——而 T1 宣称按 §2.1 机检「参数字典」。 | 把 `:40` 注释改为 `// navigate ∥ wait`（或补一行显式说明），使 §2.1 与 §2.2/§2.3 一致。 |
| 3 | Clarity（语义悬空 · R7d） | 🟡 | `thincoder/docs/core/design/BROWSER-TOOL.md:188`「**<500 硬限但余量 5**——见上抛 1」与 `:194`「**零重构**——见上抛 1」两处指向「上抛 1」，但两档内无该条目定义或清单（`:118` 的「上抛」= 审批沿父链上抛，语义不同）——config.mjs 贴限的处置依据在评审范围内不可解析。 | 在 §5 就地写明该上抛事项全文（或改为指向档内可解析位置），使 config.mjs 拆分歧路径可追溯。 |
| 4 | Acceptance | 🔵 | 用例计数漂移：`:256` 声明「冒烟（S1–S7——真 Edge/Chrome 无头 + 进程内 fixture 服务）」（`:275` 同），但 §7 仅定义 S1（`:214`-`:216`）、S2（`:217`）、S3/S4（`:218`）、S5（`:219`）、S7（`:215`）——S6 在两档内零出现（grep 实证：无匹配）。 | 补定义 S6 或将区间改为 S1–S5、S7；若 S6 定义在批档，在档内明示出处。 |
| 5 | Affected-file size annotations | 🔵 | §5 表头声明「口径 = 文件行数」（`:175`），而 TOOLS.md 行按字节注（`:191`「212,106 字节」）——口径与表头不符（.md 可豁免）；另按本评审声明范围（仅两档）无法复测 77/187/80/491 等现行行数，行数标注一律按 **unverified** 对待（新增 5 档 <300 的拆分级判断无法实测）。 | 统一表头口径表述（.md 档可豁免不注数或注明混用原因）；行数标注附可复现的实读口径以便复核。 |
| 6 | Document ownership | 🔵 | 评审上下文未提供文档地图 → 归属判据降级，仅按 AGENTS.md + 两档互指核对：placement（设计 `:3` 宣告本档为 browser 工具设计权威；需求档 `:5` 记「设计侧 = `docs/core/design/BROWSER-TOOL.md`」与 D2 分工）与「各持权威、不复制」约定不冲突；但 `:191` 计划向 `docs/core/design/TOOLS.md` §6.7 加 browser 条——若该条复述机制而非指针，即构成同机制双处描述（TOOLS.md 在评审范围外，未核）。 | TOOLS.md 增条目保持「指针 + 一句定位」，机制细节留在本 board 档。 |
| 7 | Feasibility（测试缝纪律） | 🔵 | 三处注入缝已点名（`:179`「`WebSocketImpl` 注入缝」、`:180`「`resolveBrowser({platform, env})`（测试缝）」、`:182`「`_deps` 测试替身缝」），但未写缝的回落/还原纪律（默认 null ⇒ 生产路径不变、用例 finally 还原、冒烟面不依赖缝）——缺失时注入态可能泄入生产路径或跨用例污染。 | 在 §5/§7 补一句：缝默认回落真实现（`??` 缺省）、用例 finally 还原、冒烟面零依赖缝。 |
| 8 | Requirements（F-BT4 口径） | 🔵 | F-BT4 判定句含「页面微变不使引用全失效（失效项在回执中显式标注）」（需求档 `:22`），设计把失效检测落在**使用时**（`thincoder/docs/core/design/BROWSER-TOOL.md:88`，stale 报错 + 页摘 + 清单，句含 "run snapshot again"），snapshot 清单对「上一轮有、本轮无」的 ref 无标记；两读法均可成立，但档内未记该取舍（T3「stale」计在回执面与否亦未述）。 | 在 §2.3 补一句口径（使用时报错是否即 F-BT4「显式标注」的实现），或在清单尾部对消失 ref 加标记。 |
| 9 | Acceptance | 🔵 | §8 的 U1–U22 未标用例落点（单测 ∥ 冒烟），与 §7 的 T1–T15/S1–S7 为两套平行件而无映射；且 F-BT2 的**正向切换路径**（close → 以另一 headless 值重开）无显式用例——`:215` T7 与 `:244` U12 只覆盖异值报错，S1/S7 两模式是否同轮先后含 close 未述。 | 给 U 表补落点列（或一句映射规则）；为「close → 另一模式重开」补一条正例。 |

VERDICT: pass

计数：🔴 0 · 🟡 3 · 🔵 6（合计 9 条；无 🔴，不阻塞）。

## §4 用户批准（主 agent）

**§4 用户批准（代签 · 2026-10-07）**

**授权依据**：用户本日全链授权（「自动跑」→「可以，自动干到落地」→ 13:1x「攒批一起吧」——本批在攒批列内）。

**代签自缚三条（缺一不复签）**：① 评审通过（§3 轮次 1 = VERDICT pass）✓；② 修轮落地并核验（§2 修轮块九号——父侧逐坐标核验在案：§2.1 `:40` ∥ §2.3 `:89` ∥ §3.1 `:129` ∥ §5 `:177`/`:190`/`:193`/`:196` ∥ §7 `:217`/`:218`/`:229` ∥ §8 `:233-257`/`:259`）✓；③ 令牌在手（会话槽——零入档）✓。**评审后零范围变更**（修轮 = 九条文档修订，机制语义零动）。

**批准面**：`docs/core/design/BROWSER-TOOL.md`（280 行 · 修轮后终态）——实施按 §2–§6 逐表；文件面 = §5 表（6 新核档含 `tool-docs/browser.md` ∥ 4 存量接线 ∥ 2 批内件）；`TOOLS.md`/`README.md` 登记 = 父侧收口笔。

**已派**：eng-coder（initial 轮）——designId 与令牌随派单（不入档）；零第三方 ∥ 写闸 = `isReadonlyAction` 钩子 ∥ 批内件 T1–T15 + S1–S7 先红后绿读数入 §5。

## §5 实施记录（eng-coder）
**状态行**：实施完成（12 档落盘 · 单测 21/21 ∥ 冒烟 6/6+S7(有头) · 两轮 code 评审 pass（修轮 5 条 + 审计 2 条）· 终态 clean · 披露见 5.6）



**§5 实施记录（eng-coder · 2026-10-07）**

### 5.1 交付摘要（12 档 · 行数 = 实读）

| 面 | 档 | 行数 | 说明 |
|---|---|---|---|
| 新 | `thincoder-core/browser/cdp.mjs` | 102 | CDP 客户端（call/on/close + `WebSocketImpl` 缝） |
| 新 | `thincoder-core/browser/launch.mjs` | 144 | 三平台候选表 ∥ profile 锁 ∥ 启动 ∥ 杀树 |
| 新 | `thincoder-core/browser/snapshot.mjs` | 226 | 快照脚本 ∥ 归一 ∥ 引用表 ∥ 渲染 |
| 新 | `thincoder-core/browser/session.mjs` | 436 | 单例 ∥ 串行队列 ∥ 八动作 ∥ 引用寻址 ∥ 空闲关 |
| 新 | `thincoder-core/tools/browser.mjs` | 71 | schema ∥ 参数校验 ∥ `isReadonlyAction` ∥ 回执/错误形 |
| 新 | `thincoder-core/tool-docs/browser.md` | 28 | 描述面（英文 · 六要素 · 含 untrusted 句） |
| 改 | `thincoder-core/tools/index.mjs` | 79 | +3（静态表 + 导出） |
| 改 | `thincoder-vscode/src/tools/index.mjs` | 189 | +2（清单 + import） |
| 改 | `thincoder-core/permission.mjs` | 88 | +8（`formatPermission` browser 分支 + `lastPageUrl` 读点） |
| 改 | `thincoder-core/config.mjs` | 495 | +4（`browser.allowDomains` + 合并行；<500，余量 5 ✓） |
| 新 | `docs/batches/2026-10-07-browser-tool.test.mjs` | 499 | 单测 21 例（假传输 ∥ 零真浏览器 ∥ 零真 fs） |
| 新 | `docs/batches/2026-10-07-browser-tool.smoke.mjs` | 172 | 真浏览器冒烟 S1–S7 |
| 生 | `docs/core/design/API-CONTRACT.md` | — | 生成区随动（任务书 :101 指派）——见 5.6-3 |

### 5.2 决策透明表（实现轮新增判断 · 逐条给由）

| # | 决定 | 由 |
|---|---|---|
| D1 | close 先 `Browser.close` 优雅关（等自退 ≤3s），未退才杀树 | 实测：直杀树不落盘 profile ⇒ 二段会话拿不到 Cookie（F-BT6 破）。先失败后修，冒烟 S5 取证 |
| D2 | 被拦 host 的 navigate 在 `ensureSession` 之前判 | §3.2「不执行」——被拦不得起浏览器进程（单测 U16 断言 `opened.length === 0`） |
| D3 | 页面侧异常（`evalRaw`）统一走 `pageError` | §10.4「失败回执含下一步」——页面侧抛错同样带页摘 + 紧凑清单 |
| D4 | `type` 对非 input/textarea 目标明示拒（`fillable:false`） | 原路径落页面侧 `TypeError: Illegal invocation`（无指引）——改明示句 + 下一步 |
| D5 | 空闲关经串行队列下发（+ `unref()`） | 原直调与在途动作/新开会话可交错（同 profile 双开窗口）；入队后关只落在动作边界 |
| D6 | `evaluate` 不设动作级超时，改为描述档登记 | 设计只给 wait 钉超时；加超时会改语义 ⇒ 只登记「返回的 promise 会被等待」 |
| D7 | 描述档英文 28 行（设计估 ≈45 行） | 六要素齐备即可；真预算面 = `tool-schema-size.mjs` 单档上限 8,000（browser 实测 5,021 ✓） |

### 5.3 读数区

- **先红后绿（两读）**
  - 单测：实施前首跑 = `ERR_MODULE_NOT_FOUND`（`thincoder-core/browser/session.mjs` 未落 ⇒ 用例不成集）；实施后 = `tests 21 · pass 21 · fail 0`（复跑 ×3，含两次修复后）。
  - 冒烟：本轮内实取红→绿一处——S7 先以 `Error: session is already running (headless=true) — close it first to switch mode` 失败（S5 留了开会话、S7 未先 close），补 U23 的 close 步后转绿。
- **冒烟终态**：默认 = `6/6 + S7(skipped)`；`--headed` 实跑 = `6/6 + S7(ran)`——S1 进程参数断言（F-BT1 判据列）= `--user-data-dir=<~/.thincoder/browser/profile>` ∥ `--headless=new` ∥ `--remote-debugging-port=0` ∥ 运行端口 ≠ 9222（本轮读数 59014）。
- **工具 schema 预算**（报告态）：`档数 48 · 总量 107,265 字符 · 基线 103,529 ⇒ 比值 1.036`；browser 单档 **5,021**（top10 第 5；单档超 8,000 者仅 subagent）。
- **api-contract**：`--check` 初读 = `DRIFT（盘上 3157 ∕ 生成 3208 行）` ⇒ `--write` 后 `OK(api-contract): 骨架零漂移（3206 条 · 699 档）`。
- **doc-check**：`OK(锚) 0 条悬空` ∥ `OK(行宽)`（本批新增悬空 0；报告面 13 条行数差皆非本批档）。
- **行数读数 vs 设计档 §5 预估**：cdp 102(≈90) · launch 144(≈160) · snapshot 226(≈180) · **session 436(≈240 —— 超 300 软线)** · tools/browser 71(≈170) · tool-docs 28(≈45) · 核 tools/index 79(80) · VSC 189(189) · permission 88(87) · config 495(495) · test 499(≈260) · smoke 172(≈120)。

### 5.4 审计与代码评审（轮次与终态）

- **内部审计（explore · 逐档对表）**：3 条——① S1 缺进程参数断言（🟡 ⇒ 已修，F1）② §5 为空（🟡 ⇒ 即本段）③ session.mjs 430 行超设计「<300 软线」标注（🔵 ⇒ 如实登记，见 5.6-1）。
- **代码评审轮 1（advisor · code）**：`VERDICT: pass`——8 条（🟡 2 读数面 + 🟡 1 可选 + 🔵 5），无 🔴。
- **修轮（5 条）**：见 5.5。**代码评审轮 2**：`VERDICT: pass`——5 条修复逐条核实、3 条登记/未修项理由成立、无新 🔴/🟡。
- **终态 = clean**（无未修 🔴；未修项皆登记在案并有理由）。

### 5.5 fix round（7 条）

| # | 来源 | 修法 | 复验 |
|---|---|---|---|
| F1 | 审计 ① | S1 补进程参数断言（真进程命令行 + `DevToolsActivePort` 端口 ≠ 9222） | 冒烟 S1 绿（端口 59014） |
| F2 | 审计 ② | 本段（§5）落盘 | 本段 |
| F3 | 评审 ③ | `evalRaw` 页面侧异常改 `pageError` | 单测 21/21；T2c 面不变 |
| F4 | 评审 ④ | browser.mjs 头注改「首行 `Error:` = 模型面失败形」+ 三处判失败引注 | 引注 `agent/dispatch-run.mjs:77/129/135` 逐行核实 |
| F5 | 评审 ⑤ | `type` 非可填写目标：页面侧 `fillable:false` + 会话层明示拒 + 单测 T3 断言 | 单测 21/21（新断言在 T3） |
| F6 | 评审 ⑥ | 空闲关入串行队列 + `unref()` | 时序复核（无交错面）；冒烟 S5 两段会话仍绿 |
| F7 | 评审 ⑦ | `tool-docs/browser.md` 登记 evaluate promise 等待语义 | 描述档 28 行；T12 判据仍绿 |

另：冒烟 S7 的 close 步（U23 正例）为本轮红→绿修复（见 5.3）。

### 5.6 偏离与漂移披露（父侧收口需知）

1. **`session.mjs` = 436 行**，超设计档 §5「五档新面单档全 <300 软线」标注与 ≈240 预估（500 硬限未破）。拆分会把新档数 6 变 7、超出 §5 文件表 ⇒ 未拆，如实登记（沿任务书「行目标为预估——越线如实报」）。
2. 其余新档行数与 §5 预估有差（见 5.3 末行）；`test.mjs` 499 行贴 500 硬限（余量 1）。
3. **`API-CONTRACT.md` 生成区随动**（任务书指派）：本次 `--write` 后 167 增 ∕ 116 删，其中 43 行 = 本批 browser 面，其余 124 行 = 生成器按当前源树（含并行批在途改动）重算——机械产物、单提交可 revert。
4. 设计档 §2.2 括注「首行 `Error:` 使 dispatch 判 `ok:false`」与实现不符（`agent/dispatch-run.mjs:158` 对字符串结果恒 `ok: true`；按前缀判失败的只有 `:77`/`:129`/`:135` 三处写账点）——**设计档非本交付面，未改**，供父侧收正。
5. `readonly:false` 的余波（有意 · 沿 bash/git 既例）：browser 动作经 `agent/record-results.mjs:91` 失效 verify 态；advisor 评审面不受影响。

### 5.7 越面声明

- 本交付触碰 = 5.1 表 12 档 + `API-CONTRACT.md`（生成区 · 任务书指派）。**表外零改动**。
- `git status` 中的其他改动（`docs/README.md` ∥ `docs/core/design/TOOLS.md` ∥ `thincoder-server/**` ∥ 其他批内件等）**非本交付面**——属并行批/父侧笔。
- 缝纪律：`WebSocketImpl`（`cdp.connect`）+ `_deps.{openBrowser,killBrowser,saveShot}` 缺省 `??` 回落真实现，用例 `finally` 还原，冒烟零缝。

## §6 验证与收口（父代理）

**§6 验证与收口（父代理 · 2026-10-07）**

**父侧验证（独立复跑——非转述 §5）**：

| 面 | 命令 | 读数 |
|---|---|---|
| 批内单测 | `node --test docs/batches/2026-10-07-browser-tool.test.mjs` | **21/21 · exit 0** ✓ |
| 真浏览器冒烟 | `node docs/batches/2026-10-07-browser-tool.smoke.mjs` | **6/6 + S7(skipped) · failed=0** ✓（真 Edge；S1 进程参数断言含运行端口 ≠ 9222） |
| 仓套件 | `thincoder-cli` ∥ `thincoder-vscode` `npm test` | 空清单「zero tests = green」（09-28 全清之常態）✓ |
| 仓套件（真闸） | `thincoder-server` `npm run prepublishOnly`（22 件链） | **tests 173 · pass 173 · fail 0** ✓ |
| 文档闸 | `node scripts/doc-check.mjs` | **悬空 0 · exit 0 · 行宽 OK** ✓ |
| 契约闸 | `node scripts/api-contract.mjs --check` | **OK 骨架零漂移（3206 条 · 699 档）· exit 0** ✓ |
| schema 预算 | `tool-schema-size.mjs` | browser 单档 5,021（<8,000 ✓）——§5 读数采信（报告态） |

**验收对照（E-1–E-14）**：§5 逐条交付 + 父侧抽核（S1 断言 ∥ T9 四端 ∥ T11 零第三方 ∥ T12/T13/T14 句面）⇒ **14/14 ✓**；无简化 / 未做项。

**披露处置（§5.6 逐条）**：

1. `session.mjs` **436 行**（超 300 软线、500 硬限未破——余量 64）：**收口裁定 = 接受现状 + 台账登记**（拆档另轮评估；非贴限态）⇒ 台账新行在册。
2. `test.mjs` 499 行（余量 1）∥ 其余行数差：在册（非阻断）。
3. `API-CONTRACT.md` 生成区随动：父侧复跑零漂移 ✓（随攒批提交）。
4. 设计档 §2.2 括注失实 = **父侧小改收正已落**（`BROWSER-TOOL.md:56` 改「模型面失败形 + 恒 ok 语义」+ 变更记录一行；判据 = `thincoder-core/agent/dispatch-run.mjs:158` ∥ `:182` 实读；父侧直笔 · 可 revert）。
5. `readonly:false` 余波 = 沿 bash/git 既例——接受。

**结算同步清单**：

- 角色表：§1 主 agent ∥ §2 eng-designer ∥ §3 评审子代理 ∥ §4 主 agent ∥ §5 eng-coder ∥ §6 父代理——齐。
- 状态行：§1 → **已收口 2026-10-07**（本节落定后 close 冻结）。
- 计数 / 指针：§5 表 12 档 + `API-CONTRACT.md`（生成区）+ 登记面（`TOOLS.md` §6.7 ∥ `docs/README.md` §4——§2 已落）+ 批内件两档 ∥ 设计档收正（:56 + 变更记录）——待提交（随攒批总收提交）。
- **测试面两行**：① 本批单测文件 = `2026-10-07-browser-tool.test.mjs`（499 行 · 21 例）随批档存档——无需处置；② 集成场景面 = 无新增 / 无修订（新工具面——集成归后续需求批）。
- 台账：**#1007 已核销**（evidence = 本节 + §5 读数）。
- 审批链：§3 评审轮 1 pass（0🔴）→ §4 代签（用户全链授权）→ §5 实施（两轮 code 评审 pass）→ §6 本节复跑。

**收口判词：已收口 2026-10-07**（browser-tool 批——设计 → 评审 pass → 代签 → 实施 14/14 → 父侧复跑六闸全绿（21/21 ∥ 6/6 ∥ 173/173 ∥ 悬空 0 ∥ 零漂移 ∥ 行宽 OK）→ 本节)。
