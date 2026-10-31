# 2026-11-01 · opencode-session-header
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 01:04「需要改成没会话一个。开批。」（= 每会话一个）；缘起 = 同日 01:02 opencode-go 报 400 MissingSessionID，父侧诊断后以静态头临时打通。。
> 台账 = #1923（PROVIDER · 归批）。前情 = 2026-10-30-ssh-device-readability（已收口 2026-10-30）—— 本批独立，另一面（供应商请求头）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

### 1.1 一句话

**把 `x-opencode-session` 从「配置里的固定值」改成「每会话一个」。**

**用户裁定：**「需要改成没会话一个。开批。」（2026-11-01 01:04 —— 按上下文，「没」= 「每」）

### 1.2 现场（父侧实测，只用了 `deepseek-v4.1-flash`、`max_tokens: 1`）

```
https://opencode.ai/zen/go/v1                带 header → HTTP 200 ✔   不带 → HTTP 400 MissingSessionID
https://opencode.ai/inference/go/openai/v1   带 header → HTTP 200 ✔   不带 → HTTP 400 MissingSessionID
```

**同 key、同模型、只差一个头。** 报错全文：`{"type":"error","error":{"type":"MissingSessionID","message":"Request is missing x-opencode-session and cannot be routed efficiently."}}`

**官方文档 `opencode.ai/docs/go/`（父侧取原文）**：

> **Send a stable session ID in `x-opencode-session` for each conversation so we can optimize routing and prompt caching.**
> Your client should … Identify itself with its own user agent, such as `my-coding-agent/1.0`, rather than a generic SDK or HTTP-library name.

**UA 一条我们天然合格** —— `thincoder-core/client-identity.mjs:41` 发的是 `` `ThinCoder/${identity.surface}/${identity.version}` ``，正是「自报家门」形。

### 1.3 父侧昨晚的临时修复（本批要取代的那一形）

**已把固定值写进配置**：`providers[19]`（name = `opencode-go`）的 `headers = {"x-opencode-session": "thincoder-7f3a1c92-…"}`。

**它只做到「能用」，没做到「每会话一个」**：多个会话共用一个 id ⇒ **它承诺的路由优化 / prompt 缓存粒度拿不到**。**用户裁定要改的就是这一点。**

### 1.4 要设计席判的四件（都不是父侧的裁量面）

1. **会话 id 从哪来** —— 产品内 `sessionId` 是既有一等概念；同形先例在盘：`thincoder-core/mcp/transport-http.mjs:36` `if (sessionId) h["Mcp-Session-Id"] = sessionId`。**provider 层此刻拿不拿得到，要实读确认。**
2. **注入点** —— 候选三处：`thincoder-core/client-identity.mjs:46` `withUserAgent`（客户端标识唯一入口）∥ `thincoder-core/provider/core.mjs:417`（每请求头对象）∥ 配置头模板化（如 `"${sessionId}"` 请求时替换）。**你判并给理由。**
3. **配置面怎么配合** —— 固定值要不要保留 / 是否做成通用机制（任何渠道可用模板头）/ 还是单渠道特办。
4. **无会话上下文时给什么** —— `generate-title` / `embedding` / 子代理首轮 / 摘要桩等路径是否都有会话 id；没有时给什么（退回固定值 ∥ 每次调用新值 ∥ 不发头）。

### 1.5 边界（不做）

- **不动 UA 纪律**（`docs/core/design/PROVIDER.md` §6.17：UA 不可被渠道覆盖）
- **不改 OpenCode 那边的任何行为**，只调我们的请求
- **不动别的渠道的既有头**
- **不改 `opencode-go` 的 baseURL / 模型表**（已能用）

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-11-01（收口前补正：§6.17 补「判据文件与跑法」= docs/batches/2026-11-01-opencode-session-header.test.mjs ∥ §2.20 supersession 落盘（§2.5 行5 ∥ §2.6 ∥ §2.17 旧路径作废））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.0 状态行

设计完成（2026-11-01 · 首版已落盘：`docs/core/design/PROVIDER.md` §6.17 + 用例表 #15–#18 + D-PR44）。

### 2.1 本批条目（覆盖 ∥ 不覆盖）

来源 = §1 用户裁定 ∥ §1.4 四问；台账 #1923。

| # | 条目 | 落点 |
|---|---|---|
| 1 | `x-opencode-session` 从配置固定值改成「每会话一个」 | `docs/core/design/PROVIDER.md` §6.17 会话标识头块 + D-PR44 |
| 2 | ① 会话 id 来源 | 值 = `getSessionId()`（新叶子档 `thincoder-core/session-identity.mjs`） |
| 3 | ② 注入点 | `thincoder-core/client-identity.mjs:46-54` `withUserAgent` |
| 4 | ③ 配置面 | 定制头值支持 `${sessionId}` 模板——通用机制，不按渠道特办 |
| 5 | ④ 无会话上下文的路径 | 不存在这种路径（进程级稳定值）⇒ 零 fallback 分支 |

不覆盖项见 2.7。

### 2.2 设计档落点

- 机制本体与两条语义边界 = `docs/core/design/PROVIDER.md` §6.17（本席本批已写入）。
- 同节原句「会话动态头……不做（证据未立）」与实测相反（不带该头必 400），本批**删除**该句，不留「原为 X」注。
- 可机检用例 = 同节用例表 #15–#18；决策记录 = 同档 D-PR44。

### 2.3 口径先定：「每会话一个」的「会话」= 一次进程会话实例

产品里「会话」的一等标识就是 `sessionId`——台账执行者、同伴实例、槽属主读同一值（`thincoder-core/session-slots.mjs:64-69`）。

官方档说 `per conversation`，落成 `sessionId` 是同一概念的直译；落成「槽位里的对话」要把槽标识穿到 `chat()` 调用链，代价见 2.6。

代价逐条写进 2.7，不藏。

### 2.4 四问逐条

**① 会话 id 从哪来 —— `getSessionId()`，进程级取值，不走调用链传参。**

实读 `thincoder-core/session-slots.mjs:64-69`：惰性生成 `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`，缓存在模块级 `currentSessionId`（`:61`）——进程内稳定、零 IO、无前置条件。

实读 provider 层拿不到它：`thincoder-core/provider/core.mjs:45-64` `createProvider` 只拷 baseURL ∥ apiKey ∥ model 等，无会话标识；`chat(provider, opts)` 的 `opts` 携 `logCtx`（`core.mjs:94`）等，链路里也没有。故本批不给 `chat()` 加参。

依赖面：`thincoder-core/client-identity.mjs` 是零依赖叶子（档头注 `:5-7`），而 `thincoder-core/session-slots.mjs:30-53` 引 `config.mjs` ∥ `session.mjs` ∥ `session-store.mjs` ∥ `process-probe.mjs`。

直接 import 会把会话 ∥ 槽 ∥ 进程探测整链拉进每个 transport 的 import 图。故把那 9 行原样迁到新叶子 `thincoder-core/session-identity.mjs`（零 import），`session-slots.mjs` 改为 re-export——既有 import 面零改。

**② 注入点 —— `thincoder-core/client-identity.mjs:46-54` `withUserAgent`，唯一改点。**

- 覆盖完整：§6.17 消费点全表六处定制头展开面 + embedding 全部经它装配（`provider/core.mjs:417` ∥ `responses.mjs:238` ∥ `anthropic.mjs:199` ∥ `google.mjs:134` ∥ `generate-title.mjs:102` ∥ `list-models.mjs:78/96/112` ∥ `embedding.mjs:115`）。
- 只改 `provider/core.mjs:417` 不够：覆盖 OpenAI 兼容主链而已，漏 anthropic ∥ responses ∥ google 三 transport、会话标题、模型清单；`opencode-go-anthropic` 是同渠道另一条路。
- 不在装载面解析：`env-ref.mjs` 那类装载期解析把值冻结进 provider 对象，与「请求时替换」不符。

装配后的键值仍是普通定制头 ⇒ 「内置头胜出」「UA 不可覆盖」两条既有纪律零改。

**③ 配置面 —— 通用机制：`providers[].headers` 的值支持 `${sessionId}` 模板。**

- 注入点已在共用装配面，通用与单渠道特办成本相同；特办要按渠道名开分支，名随渠道增删漂移，还把一处解析拆成两条路径。
- 模板住渠道配置的结构性好处：只有声明该头的渠道发头，别的渠道出站头零变化——本批硬约束自动成立。
- 值形语义（已写进 §6.17）：整值与内嵌同解、可多处，同 `env-ref` 既有语义。建议值 = `"thincoder-${sessionId}"`，保留产品前缀，上游日志可辨识。
- 未识别变量（如 `${sessionIDd}`）原样出站、不抛错：头已在，上游不回 `MissingSessionID`，代价只是路由不优化。抛错会把历史合法值变成硬中断——定制头值是通道值域，与 `env-ref` 的「未设即抛」不同域。

**④ 无会话上下文的路径 —— 不存在，故零分支。**

`getSessionId()` 无前置条件：会话标题 ∥ embedding ∥ 子代理首轮 ∥ 摘要桩 ∥ 模型清单，全在同一进程内取到同一个值。

按「没有场景的分支不建」纪律，退回固定值 ∥ 每次新值 ∥ 不发头三种处置一条都不建——建了即三份无人验证的路径。

### 2.5 受影响文件与测试覆盖

| # | 文件 | 改动 |
|---|---|---|
| 1 | `thincoder-core/session-identity.mjs` | 新建（零 import 叶子）：`getSessionId()` 与模块级 `currentSessionId`，逐字迁自 `session-slots.mjs:61-69` |
| 2 | `thincoder-core/session-slots.mjs` | 删本地实现，改 re-export（导出面零变） |
| 3 | `thincoder-core/client-identity.mjs` | `withUserAgent` 内加 `${sessionId}` 解析：先解析 → 再删 UA 大小写变体 → 后写产品 UA；档头注同步 |
| 4 | `thincoder-core/config-presets.mjs` | `:54` 注释「可选遥测——不发」与实测相反（不带必 400）⇒ 改注释；预设本身不加 `headers` 字段 |
| 5 | `thincoder-core/test/session-header.test.mjs` | 新建（批内单测，收口删除）：用例 #15–#18 + 导出面一条 |
| 6 | `docs/core/design/PROVIDER.md` | §6.17 机制块 + 用例表 #15–#18 + D-PR44（本席已写） |
| 7 | 仓外 `~/.thincoder/config.json` | `providers[19].headers` 的固定值 → `"thincoder-${sessionId}"`；非本仓写，主 agent ∥ 用户执行 |

**tier 结论**：无文件跨层。改动全在核件内——新增叶子 < 30 行，`session-slots.mjs` 净减，均在 500 行软线内。

**四端零改**：`withUserAgent` 是核件共用装配面，端壳不碰；桌面物化按整目录实拷，新增根级 .mjs 随目录镜像带入。

### 2.6 验收对照（可机检）

判据文件 = `thincoder-core/test/session-header.test.mjs`，命令 = `node --test thincoder-core/test/session-header.test.mjs`。

| AC | 条目 | 期望读数 |
|---|---|---|
| AC1 | 条目 1∥4：模板解析出会话值 | 用例 #15 绿：桩 `fetch` 捕获的出站头 = `getSessionId()` 同值且带 `thincoder-` 前缀 |
| AC2 | 条目 2：进程级稳定 | 用例 #16 绿：连发两次 `chat`，两次该头值相同 |
| AC3 | 条目 4 边界：未声明即不发 | 用例 #17 绿：无该键的渠道，出站头集合不含 `x-opencode-session` |
| AC4 | 条目 4 边界：未识别变量原样 | 用例 #18 绿：`${sessionIDd}` 字面出站，不抛 |
| AC5 | 导出面零破 | 同文件一条 `getSessionId` 自 `thincoder-core/session-slots.mjs` import 仍可用，绿 |
| AC6 | 真渠道可用（父侧收口面，本批不跑） | `opencode-go` 发一次 chat（`deepseek-v4.1-flash` · `max_tokens:1`）→ HTTP 200，同 §1.2 手法 |

### 2.7 关键决策与边界

**D-PR44**（已落设计档）：会话头 = 定制头值模板，单点解析于 `withUserAgent`。

被拒备选：

- **per-slot（对话文件）id**：做法 = 把活动槽标识穿到 `chat()` 调用链。收益 = 同进程两对话分桶 + 断进程续聊保缓存。代价 = `chat()` 加参 + agent 环 ∥ 子代理 ∥ 标题生成 ∥ advisor 各点接线 + 槽切换时序判据。本批不取：用户诉求「拿到路由 ∥ 缓存粒度」在进程会话级已成立（固定值时代是全机器一个桶）。
- **按渠道名特办**：名分支随增删漂移，且通用模板与特办成本相同。
- **装载面解析**：值冻结，与「请求时替换」不符。
- **新增 `withSessionHeader` 包装器**：要改全部七处调用点，本批硬要求是一处改。

**边界（不做）**：

- 不动 UA 纪律（模板解析与删 UA 变体、写产品 UA 无交集）。
- 不改 OpenCode 侧任何行为，只调我们的请求。
- 不动别的渠道既有头（AC3 兜）。
- 不改 `opencode-go` 的 baseURL ∥ 模型表。
- 不给预设引入 `headers` 字段；不新增端内配置 UI（`providers[].headers` 本就无端内编辑面，写入面 = `config.json`）。

**已知残差（明写）**：

- 同进程多个对话槽共享一个 id ⇒ 分桶粒度到「进程会话」为止。
- 断进程续聊拿不到同一 id ⇒ 缓存不跨进程续命。
- 值形写错（`${sessionIDd}`）静默降级为固定字面，无端侧提示。

### 2.8 上抛项

**[上抛·知会] 本批无独立需求档条目**：板 `PROVIDER` 的需求面 = §1（用户裁定 + 边界），台账 #1923 已挂。三链同源若要一条 REQ 行，属主 = 主 agent。

**[上抛·知会] 仓外一步**：`~/.thincoder/config.json` 的 `providers[19].headers` 需改成 `"thincoder-${sessionId}"`；不改则代码改动对它不生效（仍是固定值）。属用户数据目录，非本仓写。

**[上抛·待裁] 口径确认**：我把「每会话一个」落成每进程会话实例（= 产品内 `sessionId`）。若用户要的是每个对话槽一个（同进程两窗口分桶 + 断进程续聊保缓存），那是另一批穿参改造，代价见 2.7。

### 2.9 自检更正（本节内交叉引用）

2.3 段内一句「代价见 2.6」应为「代价见 2.7」——2.6 = 验收对照，2.7 = 关键决策与边界（含被拒备选与其代价）。落盘原文无法改写（本段 append-only），以本行为准。

自检三项读数：

1. **引用集 ↔ 标题集**：本节引用的 §1.2（现场实测）∥ §1.4（四问）在批档 §1 均存在；设计的 §6.17 在 `docs/core/design/PROVIDER.md` 存在（`### 6.17` 标题）；既有 `env` 值引用指针未由本席改动，机检门锚点解析通过。
2. **表行 ↔ 汇总数**：2.5 受影响文件表 7 行，正文同样说 7 处（1–7）——一致；设计档用例表新增 4 行（#15–#18），与 2.6 的 AC1–AC4 一一对应。
3. **断言 ↔ 读数**：本批 200 ∥ 400 读数来自 §1.2 父侧实测（本席未重跑；设计档标为「实测依据」并注明端点与条件）。本席自跑读数 = `doc_check` gate PASS（`docs/core/design/PROVIDER.md` 1 档）+ 本次 §2 写入回执 gate PASS。

### 2.10 修正轮（§3 轮次 1 → 11 项全接 · 2026-11-01）

逐条落点（编号 = §3 轮次 1 编号）：

| # | 改动落点 |
|---|---|
| 🔴1 | `docs/core/design/PROVIDER.md:222-225`：§6.11 原句「可选遥测——不发」改「必需 + 两条预设各携缺省值」；本节 2.13 增行点名 |
| 🔴2 | `docs/core/design/PROVIDER.md:752` 新增「集成用例（RTM 增量）」段；`test/RTM.md:266-273` 新设 CLI 故事 23 + 行 `23-1` |
| 🔴3 | `docs/core/design/PROVIDER.md:746` 改为「只精确匹配 `${sessionId}`」、理由改构造必然；用例 #18 降构造检查（`docs/core/design/PROVIDER.md:837`） |
| 🟡4 | `docs/core/design/PROVIDER.md:744` 补长驻多对话面（ACP ∥ server），点名 `thincoder-cli/src/acp/handlers-session.mjs:211` |
| 🟡5 | `thincoder-core/config-presets.mjs:54-58` 两条预设各带 `headers`，注释改同口径 |
| 🟡6 | 本节 2.11 补两条被拒备选 + 依赖实读 8 档 |
| 🟡7 | `docs/core/design/PROVIDER.md:750` survey-evidence 行 |
| 🟡8 | `docs/core/design/PROVIDER.md:747` closest-precedent 行（先例 = `${env:VAR}` 值位模板） |
| 🟡9 | `docs/core/design/PROVIDER.md:748` 三问行 |
| 🟡10 | 本节 2.13 增行：API-CONTRACT 生成区重跑 |
| 🔵11 | 本节 2.12 AC7：新叶零 import 静态断言 |

### 2.11 被拒备选补记（🟡6）

- **模块级 setter 注入**（同 UA 面 `setClientIdentity` 形，`thincoder-core/client-identity.mjs:24`）：会话 id 是进程内惰性生成的自足值，setter 无用武之地——要它就得在七处消费点前各调一次，把「取当前值」变成「依赖调用顺序」。代价 = 七处调用 + 一条新的顺序判据；`getSessionId()` 自洽取到，零时序耦合。
- **既有 re-export 形**（`thincoder-core/session-slots.mjs:56-59` 同形做法）：`client-identity.mjs` 直接 `import { getSessionId } from "./session-slots.mjs"` 会把整链拉进每个 transport 的 import 图。实读依赖 8 档 = `config.mjs` ∥ `session-migrate.mjs` ∥ `session.mjs` ∥ `session-store.mjs` ∥ `process-probe.mjs` ∥ `session-slots-manifest.mjs` ∥ `session-slot-scan.mjs` ∥ `session-slot-verify.mjs`（`thincoder-core/session-slots.mjs:30-55`）。
- 8 档的代价面：transport 装载期被迫背 config 读盘 ∥ 会话存储 ∥ 进程探测。故 9 行迁零 import 叶子，`session-slots.mjs` 改 re-export，既有 import 面零改。

### 2.12 验收补 AC7（🔵11）

AC7 = **新叶零 import**：源扫 `thincoder-core/session-identity.mjs` 的 `^import` 零命中（静态断言，同 AC 文件内一条）。

理由：这是「不把会话 ∥ 槽 ∥ 探测整链拉进 transport」的唯一可机检判据；缺它则将来给新叶加一条 import 时 AC1–AC5 全绿而前提已破。

### 2.13 受影响文件（修正轮增量，接 2.5）

| # | 文件 | 改动 |
|---|---|---|
| 8 | `docs/core/design/PROVIDER.md` §6.11 OpenCode Go 段 | 该头「可选遥测——不发」→「必需 + 预设携缺省值」（🔴1，消灭同头两处活描述） |
| 9 | `test/RTM.md` CLI 端故事 23 · 行 23-1 | 新增集成用例行（🔴2） |
| 10 | `test/integration/opencode-session-header.test.mjs` | 新建（收口面实施；本席只给位置与断言） |
| 11 | `docs/core/design/API-CONTRACT.md` 生成区 | 重跑 `node scripts/api-contract.mjs --write`：`getSessionId` 行移位至新叶 + 新叶四导出（🟡10） |

2.5 原 7 行不撤，合计改动面 11 行。

### 2.14 上抛（修正轮）

**[上抛·知会] §2.7 一条旧边界已被父侧裁定作废**：原写「不给预设引入 `headers` 字段」，现两条 OpenCode Go 预设各携带 `headers`。

性质 = 可用性修（新装即有头，不必手改配置），不是新语义；AC3（未声明即不发）对其余渠道依然成立。§2.7 落盘原文不可改（append-only），以本行为准。

**[上抛·待裁] 口径确认（承 2.8 原条）**：口径仍 = 每进程会话实例一个。🟡4 补的长驻多对话面（ACP ∥ server）同口径归档——同一进程内多个 ACP 会话共用一个 id，与既有粒度告警 `thincoder-cli/src/acp/handlers-session.mjs:211` 同源。若用户要「按对话分桶」，属另一批穿参改造，代价见 2.7 首条被拒备选。

### 2.15 修正轮 2（§3 轮次 2 → 🟡1–🟡5 + 🔵6 全接 · 2026-11-01）

本轮不动代码（父侧裁定：`thincoder-core/**` 由 eng-coder 接手）；改面只有设计档、`test/RTM.md` 与本段。

| # | 改动落点 |
|---|---|
| 🟡1 | 本节 2.16：supersession 点名 §2.5 行 4「预设本身不加 `headers` 字段」（§2.14 只撤了 §2.7 一条同类旧边界） |
| 🟡2 | `docs/core/design/PROVIDER.md:846` 新用例 #19（两条 opencode 预设各携 `thincoder-${sessionId}` + `presetToEntry` 落库形 + `deepseek` 对照面）；本节 2.17 新增 AC8；2.5 行 5 的用例范围扩到 #15–#19 |
| 🟡3 | `docs/core/design/PROVIDER.md:746-747`：缺省值承诺限定到 CLI ∥ desktop；server（静态表每键只载 `baseURL`，`expandProviderEntry` 只出四字段）∥ VSC（无该字段面）列范围外，各带读数 |
| 🟡4 | `test/RTM.md:273` 行 23-1 改本地假上游两态（带头 200 + 助手回复 ∥ 不带头 400 `MissingSessionID`），业务判据只留「用户拿到助手回复」；`docs/core/design/PROVIDER.md:755-763` 同拍改 |
| 🟡5 | `test/RTM.md:269` 节注 + `docs/core/design/PROVIDER.md:762`：需求面 = 用户裁定 + 台账行，需求档未立条目 |
| 🔵6 | `docs/core/design/PROVIDER.md:749`：值类型口径——替换只作用于字符串值，装载面净化（`thincoder-core/config-normalize.mjs:104`）只留字符串值，故配置链路到不了非字符串头值 |
| 🔵7 | 无改动：用例 #18 是构造检查，已在 §3 轮次 2 结项，不重开为「无来处分支」 |

### 2.16 supersession：§2.5 行 4 已被取代（🟡1）

2.5 受影响文件表行 4 写「`config-presets.mjs:54` 注释改；预设本身不加 `headers` 字段」——**后半句作废**。

盘上 `thincoder-core/config-presets.mjs:57-58` 两条 OpenCode Go 预设各携 `headers: { "x-opencode-session": "thincoder-${sessionId}" }`，设计档 `docs/core/design/PROVIDER.md:746` 同此口径。§2.14 只撤了 2.7 的同类旧边界，没覆盖这一行。

**现行口径（本条目唯一活描述）**：行 4 的改动 = `config-presets.mjs` 注释改（那句「可选遥测——不发」与实测相反）+ 两条 OpenCode Go 预设各携该头缺省值。

**实施席按本行为准**：不得删预设里的 `headers`——删了就是「新装仍 400」，正是本批要修的那个症状。§2.5 原行与 §2.14 原文按 append-only 留存，不作现行依据。

### 2.17 验收补 AC8（🟡2）：预设缺省值有机检读数

AC8 = **两条 OpenCode Go 预设携模板、其余预设不携**。判据文件 = 同批 `thincoder-core/test/session-header.test.mjs`（用例 #19，`docs/core/design/PROVIDER.md:846`）；命令 = `node --test thincoder-core/test/session-header.test.mjs`。

① `PROVIDER_PRESETS["opencode-go"]` ∥ `["opencode-go-anthropic"]` 的 `headers["x-opencode-session"]` 逐字 = `thincoder-${sessionId}`。

② `presetToEntry("opencode-go").headers` 同值（落库条目形——`desc` 外全字段随条目进配置，chat 读的是这一形）。

③ 对照面 = 其它预设（如 `deepseek`）无该键，即 AC3 的同源反面。

理由：AC1–AC7 全作用在手写 `provider.headers` 上，没有一条看预设表——预设里那个头被删掉时七条全绿，而新装渠道退回 400。AC8 是此处唯一能红的读数。2.6 表现行 AC1–AC6 不动，AC8 接排。

### 2.18 上抛（修正轮 2）

**[上抛·待裁] 需求档边界与设计正面冲突**：`docs/core/requirements/PROVIDER.md:96` 的范围边界写「**不实现会话动态头**；不改头语义；……」，本批设计正是实现会话动态头（`docs/core/design/PROVIDER.md` §6.17）——两侧同指一事、结论相反。

需求档不在本席写面（D1）⇒ 交主 agent 处置：按用户 2026-11-01 01:04 裁定，该边界句已失效，应删（不留「原为 X」注）。不删则实施席读 REQUIREMENTS §4.3 的「不做」会止步，或把已落设计判为越界。

本席已在 RTM `:269` 与设计档 `:762` 按事实写「需求档未立条目」，不指向 §4.3——指向它是指向一条「不做」。

**[上抛·知会] 仓外一步（承 2.8）**：`~/.thincoder/config.json` 的 `providers[19].headers` 需改成 `"thincoder-${sessionId}"`，否则该渠道仍是固定值、代码改动对它不生效。

**[上抛·待裁] 口径确认（承 2.8 ∥ 2.14，未裁）**：口径 = 每进程会话实例一个；若要按对话槽分桶，属另一批穿参改造（代价 = §2.7 首条被拒备选）。

### 2.19 自检更正（本节内坐标，§2.15 ∥ §2.17）

分行长高了三行，下列坐标以本行为准（§2 段 append-only，原文留存不改）：

- 🟡2：用例 #19 实际在 `docs/core/design/PROVIDER.md:848`（2.15 表与 2.17 段原写 `:846`）。
- 🟡4：集成用例块实际为 `docs/core/design/PROVIDER.md:755-762`（2.15 表原写 `:755-763`）。

其余坐标经回读核对无差：🟡3 = `:746-747` · 🟡5 = `:762` · 🔵6 = `:749` · `test/RTM.md:269` ∥ `:273`。

本轮机检读数：`doc_check` gate PASS（`docs/core/design/PROVIDER.md` ∥ `test/RTM.md` ∥ 本批档，3 档 0 命中）；本条写入回执 gate PASS（范围 4 档）。

### 2.20 supersession：批内单测档路径（§2.5 行 5 ∥ §2.6 ∥ §2.17 旧路径作废 · 2026-11-01）

**旧路径（作废）**：`thincoder-core/test/session-header.test.mjs`——出现在 §2.5 受影响文件表行 5 ∥ §2.6 判据文件行 ∥ §2.17 AC8 判据文件行，三处一并作废。

**现行口径（唯一活描述）**：批内单测档 = `docs/batches/2026-11-01-opencode-session-header.test.mjs`；验收命令 = `node --test docs/batches/2026-11-01-opencode-session-header.test.mjs`。用例 #15–#19 ∥ AC5 ∥ AC7 的内容判据一字未改，实跑读数见 §5.3 第 1 条（`pass 7 · fail 0`）。

**为什么原路径是错的**（本席实读三条，均可复核）：

- `thincoder-core/test/run.mjs:34-35`：`walk("test")` 递归后对每个 `*.test.mjs` 直接 `fail("uncollected test file (unit test files live in docs/batches/ and run via node --test <file>): …")` ⇒ 该档落进 core 的 `test/` 树，core 包 `npm test` 恒红。
- `thincoder-core/agent-tools/batch-unit-test-gate.mjs:8-11`：本批档认领判据 = `D = dirname(abs)`（批档所在目录）下的 `*.test.mjs` ⇒ 落在包测试树的档收口不被点名、永久留盘，零留存纪律失去结构兜底。
- `docs/core/design/TESTING.md:130`：单元测试档现行形态 = `docs/batches/*.test.mjs`，跑法 `node --test docs/batches/<档>.test.mjs`。

**设计档面**：`docs/core/design/PROVIDER.md` §6.17 原本没有判据文件行（该档 `session-header` 零命中，`grep` 实读）——本席本批在 `:852-854` 新增「判据文件与跑法」段，现行值同上；该处不存在旧路径要改。

**实施席按本行为准**：§2.5 行 5 ∥ §2.6 ∥ §2.17 的旧路径按 append-only 留存、不作现行依据（偏离经过与父侧裁示 = §5.2）。

## §3 设计评审（评审子代理）
**状态行**：评审通过 2026-11-01（第 2 轮：首轮 11 条全落，🔴 0 · 🟡 5 · 🔵 2）



### 轮次 1（评审子代理）

### 设计评审（首轮）
对象 = §2 设计 + 设计档 §6.17。
VERDICT: changes-required
计数：🔴 3 · 🟡 7 · 🔵 1（共 11 项）

**🔴 阻断**

🔴1 同一个头两处活描述
`docs/core/design/PROVIDER.md:222`
仍写「可选遥测——不发」。
本批 `:745` 写「必需，不是可选遥测」。
批档已删 §6.17 同句，也已改仓内注释。
但 2.5 行 6 只覆盖 §6.17 机制块。
⇒ 漏改 §6.11:222；2.5 补一行。

🔴2 无集成测试设计节
`test/RTM.md` 实读存在（22 条故事）。
不带该头必 400（批档 `:20`）。
AC6 正是该场景，却写「本批不跑」。
⇒ 补 RTM 增量 + 用例行号先落 RTM。

🔴3 分支无来处（6b）
「未识别变量原样出站」是设计分支
（`:743` + AC4 / 用例 #18）。
理由为假设句，无观察、无复现路径。
⇒ 给场景，或改成只匹配 `${sessionId}`。

**🟡 建议**

🟡4 残差未含 ACP server ∥ server 端。
🟡5 预设不携 headers 且无端内写面。
🟡6 2.7 未列 setter 注入 / 既有 re-export 备选。
🟡7 缺 survey-evidence 行（源见 `:745`）。
🟡8 缺 closest-precedent 行（先例 `:744`）。
🟡9 缺三问行（新叶名 / `${sessionId}`）。
🟡10 `docs/core/design/API-CONTRACT.md:1974` 待重跑。

**🔵 备注**

🔵11 AC5 未锁「新叶零 import」。

**本席实读读数**
327 ∥ 55 ∥ 67 ∥ 495 行，全在 500 行内。
`env-ref.mjs:29` 确认 `${sessionId}` 不被吞。
九处 `withUserAgent` 展开点逐一核对。

### 轮次 2（评审子代理）

对象 = §2 修正轮（首轮 11 条落地复核）+ 父侧点名三件。

**父侧点名三件的判定**

- **(a) 设计席改产品码 + 是否由 eng-coder 接手**：盘上确已改（`thincoder-core/config-presets.mjs:57` 两条预设各携 `headers`），注释与代码同口径。**接手判定 = 须接手，且该改动此刻无任何验收读数** —— AC1–AC7（§2.6 ∥ §2.12）全部作用在手写的 `provider.headers` 上，没有一条断言两条预设携 `thincoder-${sessionId}`。见 🟡2。
- **(b) 🔴3 新写法是否真消除分支**：是。`docs/core/design/PROVIDER.md:746` 把处置改成单串精确替换，明写「构造上不存在「未识别变量」这回事」；实现形 = 一次 `replaceAll` / `split+join`，无 `if` 无正则扫描 ⇒ 6b 在代码面已无待证场景，用例 #18（同档 `:837`）降为构造检查成立。残余只在值类型面（🔵6）。
- **(c) RTM 故事 23 + 行 23-1 是否越界**：不越界。编号先落 RTM 正是规范要求的次序（`test/RTM.md:273` 行先存、用例标题后写）；`待执行` + 执行日期 `—` 与既有 22-1 ∥ 19-1 同形。问题不在越界，在该行**按现在写法必须打真端点才可跑**（🟡4）。

**首轮 11 条逐条实读**（机制档 = `docs/core/design/PROVIDER.md` §6.17 ∥ §6.11）

| 条 | 落地 |
|---|---|
| 🔴1 | ✔ 「可选遥测」在该档已无活描述（仅 `:751` 否定句）；`:224-225` 改「必需 + 两条预设各携缺省值」 |
| 🔴2 | ✔ `:752` 集成用例段 + RTM 故事 23 / 行 23-1；交互 ∥ 业务结果 ∥ 入口 ∥ 回指齐 |
| 🔴3 | ✔ `:746` + 用例 #18（`:837`） |
| 🟡4 | ✔ `:744` 补 ACP ∥ server 长驻面；`thincoder-cli/src/acp/handlers-session.mjs:211` 引文实读相符 |
| 🟡5 | 部分 —— 代码已改、批档 `:204` 已记账，但 §2.5 行 4 未撤（🟡1） |
| 🟡6 | ✔ §2.11 两条被拒备选；8 档依赖 `thincoder-core/session-slots.mjs:30-55` 实读相符 |
| 🟡7 | ✔ survey-evidence = 该档 `:750` |
| 🟡8 | ✔ closest-precedent = 该档 `:747`（`thincoder-core/env-ref.mjs:28` `resolveEnvRefs` 实读存在） |
| 🟡9 | ✔ 三问行 = 该档 `:748`（`getSessionId` @ `thincoder-core/session-slots.mjs:64` 实读存在） |
| 🟡10 | ✔ §2.13 行 11（API-CONTRACT 重跑） |
| 🔵11 | ✔ §2.12 AC7 |

**复核读数（本席实测）**

- `thincoder-core/session-slots.mjs` 327 行 ∥ `thincoder-core/client-identity.mjs` 55 行 ∥ `thincoder-core/config-presets.mjs` 69 行；两个新档未见盘（待实施）。
- tier 结论行「无文件跨层」成立；`withUserAgent`（`thincoder-core/client-identity.mjs:46`）9 行，函数层亦无跨层。
- 注入面可行性实读确认：`thincoder-core/provider/core.mjs:11` 已 import、`:417` 已展开 ⇒ 「一处改全覆盖」成立，transport 零改。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 需求覆盖 ∥ 状态一致性 | 🟡 | §2.5 行 4 仍写「预设本身不加 `headers` 字段」，与盘上代码（`thincoder-core/config-presets.mjs:57`）及 §2.10 🟡5「两条预设各带 `headers`」相反；§2.14 只撤 §2.7，未覆盖这一行 ⇒ 受影响文件表里同一条目两份活说法 | 按 §2.14 同式补一条 supersession，点名 §2.5 行 4（不只 §2.7），使预设条目只剩一份活描述 |
| 2 | 方法论 ∥ 验收 | 🟡 | 设计席已把产品码写进 `thincoder-core/config-presets.mjs:57-58`（早于评审批准），而该改动无验收读数：AC1–AC7 全在手工 `provider.headers` 上，无一条断言两条预设携模板 | §5 由 eng-coder 认领并复核这两个预设（含 `presetToEntry` 落库形），同时给该默认值一条机检读数 |
| 3 | 范围 | 🟡 | 预设携 headers 的辐射面未点名：server 表 `thincoder-server/src/ops/presets.mjs:33` 只载 `baseURL`，`expandProviderEntry`（`:46-51`）只出四字段 ⇒ 经 server 预设建的 `opencode-go` 仍会 400；VSC 无 `providers[].headers` 面（`docs/core/design/PROVIDER.md:742`）。而 `docs/core/design/PROVIDER.md:745` 的「新装即带上，用户无需手改配置」未限定端面 | 把该承诺限定到有该面的端（CLI ∥ desktop），server ∥ VSC 明确列为范围外并给理由 |
| 4 | 集成用例设计 ∥ 可跑性 | 🟡 | `test/RTM.md:273` 行 23-1 的「怎么做」= 真 `opencode-go` + `deepseek-v4.1-flash` 发一句话，无替身；这与本档自己的纪律相反（`docs/core/design/PROVIDER.md:1352`「零外网、零付费端点；真端点 smoke 不属本套件」），也与「两层不重复持有同一断言」（同档 `:1343`）冲突——行内断言的出站头同值已在单测 #15/#16 断言 | 该行改为本地假上游（有头 200 ∥ 无头 400 两态），业务判据只留「用户拿到助手回复」；真端点留给收口 smoke |
| 5 | 需求回指 | 🟡 | 行 23-1 的节注回指只有「回指 = 台账 #1923（用户 2026-11-01 01:04 裁定「每会话一个」）」（`test/RTM.md:269`）；本板存在需求档 `docs/core/requirements/PROVIDER.md`（`docs/README.md:92`），兄弟行回指的都是需求档位。「本批无独立需求档条目」只在批档 §2.8（`:178`）声明，行内没有 | 行内回指补需求档位，或在节注写明「需求面 = 用户裁定 + 台账行，需求档无条目」 |
| 6 | 清晰度 | 🔵 | `docs/core/design/PROVIDER.md:746` 的「构造上只匹配一个串」讲的是**变量名**面；值类型面未写，而被引先例 `thincoder-core/env-ref.mjs:29` 明确 `if (typeof value !== "string" \|\| …) return value` 兜非字符串 | 在 §6.17 补一句值类型口径（非字符串原样通过 ∥ 已由装载面净化），使「无分支」覆盖类型面（非字符串头值是否可达未读 `sanitizeProviderHeaders` —— unverified） |
| 7 | 备注（已结） | 🔵 | 用例 #18 的期望值由构造推出、无观察来源——因代码面已无该分支，作为构造检查成立；记录以免后续被当作「无来处分支」重开 | 无 |

计数：🔴 0 · 🟡 5 · 🔵 2（共 7 项）—— 无阻断项，🟡/🔵 建议性。
文档归属：本仓文档地图实读存在（`docs/README.md:54` 供应商与模型 = `docs/core/design/PROVIDER.md`），本批落点与主题属主一致；RTM 归集成行 —— 无碎档、无第二活描述（🔴1 已消）。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**状态行**：已批准 2026-11-01

### 4.1 批准依据（用户原话 · 逐字）

- **「需要改成没会话一个。开批。」**（2026-11-01 01:04）—— 按上下文，「没」= 「每」。**这一句同时是**：需求口径（每会话一个）· 开批指令 · 整条链的 go-ahead（设计 → 评审 → 实施 → 收口）。
- **前置缘起**：同日 01:02 用户报 `400 MissingSessionID`；父侧诊断后以静态头临时打通，并把「要每会话一个 ⇒ 开批」的代价与边界摊开，用户据此裁定。

### 4.2 批准范围

| 件 | 性质 |
|---|---|
| **① 进程级会话标识** | 新叶子 `thincoder-core/session-identity.mjs` + `session-slots.mjs` 改 re-export（既有 import 面零改） |
| **② `${sessionId}` 值位模板** | `withUserAgent` 单点解析；**未声明该头的渠道零变化** |
| **③ 预设携缺省值** | 两条 OpenCode Go 预设各带模板——新装即生效 |

### 4.3 明确不在本批

按对话槽分桶（同进程多对话共享一个 id）· VS Code 端引入 `providers[].headers` 面 · server 静态预设表 · `User-Agent` 不可覆盖语义 · OpenCode 侧任何行为。

### 4.4 用户批准前收到的选项

父侧在 01:04 之前已把「固定值已能连上，但拿不到它承诺的路由/缓存优化」与「每会话一个要动代码、得开批」两件事一并摊开；用户裁定开批 —— **不是父侧代决**。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-11-01（五件活全落 · 单测 7/7 绿 · 集成 2/2 绿 · 单测档落点按父侧裁定改为批档同目录）



### 5.1 五件活逐件（落点 + 关键读法）

| # | 落点（file:line） | 关键读法 |
|---|---|---|
| ① | `thincoder-core/session-identity.mjs:1-21`（新建 · 零 import 叶） | `currentSessionId` + `getSessionId()` 逐字迁自 `session-slots.mjs` 原 `:61-69`（惰性生成 ∥ `Math.random().toString(36).slice(2, 8)` 同形）；档内零 `import` 行 |
| ② | `thincoder-core/session-slots.mjs:59` ∥ `:64` | `import { getSessionId } from "./session-identity.mjs"` + `export { getSessionId }`（既有 import 面零改）；本档两处真消费（`usableSlot` ∥ `resumeSlot` 的属主判据）改走 import 绑定；原 `:61-69` 删除；档头注 `:9-12` 同步改口径 |
| ③ | `thincoder-core/client-identity.mjs:17` ∥ `:28` ∥ `:53-59` ∥ `:64-70` | `SESSION_REF = "${sessionId}"`；解析 = 单串 `replaceAll`，非字符串值原样；`withUserAgent` 工序 = 先解析 → 再删 UA 大小写变体 → 后写产品 UA |
| ④ | `thincoder-core/config-presets.mjs:54-58` | 本席**未改动**：两条 OpenCode Go 预设的 `headers` 与注释已由设计席先落（§2.16 现行口径），本席只认领复核、未删。AC8（用例 #19）是本批给它加的唯一机检读数 |
| ⑤ | `test/integration/opencode-session-header.test.mjs`（新建） | 本机假上游两态：带头 ⇒ 200 + 助手回复；不带头 ⇒ 400 逐字 `MissingSessionID` 载荷。业务判据只留「用户拿到助手回复」，对照跑验证判据来自真实约束 |

批内单测档 = `docs/batches/2026-11-01-opencode-session-header.test.mjs`（用例 #15–#19 + AC5 + AC7，共 7 条）。

**不变量（实读确认）**：装配后仍是普通定制头 + 产品 UA，故各 transport 的 `{ ...withUserAgent(provider.headers), ...内置头 }` 里内置头照旧胜出；未声明该模板的渠道出站头零变化（AC3 兜）。

**注入面覆盖自查**：全仓 `withUserAgent(` 展开点 = `provider/core.mjs:417` ∥ `responses.mjs:238` ∥ `anthropic.mjs:199` ∥ `google.mjs:134` ∥ `generate-title.mjs:102` ∥ `list-models.mjs:78/96/112`，另有 `embedding.mjs:115`（无参调用）；无第八处直接发 `provider.headers` 的旁路 ⇒「一处改全覆盖」成立，`provider/core.mjs:417` 与各 transport 零改。

### 5.2 偏离（一项 · 已由父侧裁定）

**单测档落点偏离 §2.5 行 5 ∥ §2.6 ∥ §2.17 原文**：原文写 `thincoder-core/test/session-header.test.mjs`。

实读反证一：`thincoder-core/test/run.mjs:35` 的 SC-1 反查会把该树内任何 `*.test.mjs` 判错位（锚串逐字 = `uncollected test file (unit test files live in docs/batches/ and run via node --test <file>)`），且遍历是递归的。

实读反证二：`thincoder-core/package.json:15` 的 `"test": "node test/run.mjs"` ⇒ 该档一旦落盘，core 包测试恒定红。

实读反证三：`thincoder-core/agent-tools/batch-unit-test-gate.mjs` 的收口门只扫批档所在目录的 `*.test.mjs`（`D = dirname(abs)`）⇒ 落在 core 测试树里的档收口不被点名，会永久留盘。

**父侧 2026-11-01 裁示**：单测档落 `docs/batches/2026-11-01-opencode-session-header.test.mjs`；验收命令随之改为 `node --test docs/batches/2026-11-01-opencode-session-header.test.mjs`；AC1–AC8 与用例 #15–#19 的内容判据一字不改。本席照裁执行 ⇒ §2.6 ∥ §2.17 原文路径现为历史值。

### 5.3 读数（三条 + 一条补充）

1. `node --test docs/batches/2026-11-01-opencode-session-header.test.mjs` ⇒ `pass 7 · fail 0`（#15 ∥ #16 ∥ #17 ∥ #18 ∥ #19 ∥ AC5 ∥ AC7 全绿）。
2. `node --test test/integration/opencode-session-header.test.mjs` ⇒ `pass 2 · fail 0`（23-1 正常 = 助手回复到手；23-1 对照 = 400 `MissingSessionID` 错误面带出）。
3. `doc_check(mode:"gate", target=D:\teamcode\thincoder)` ⇒ `DOC-CHECK GATE: PASS（0 档）`——该次运行在本段写入之前，范围 = 本会话已写 .md（零档）。

补充读数：`session.mjs` ∥ `session-slots.mjs` 取到的 `getSessionId` 与新叶本体 `===` 为真（re-export 同源）；`provider/index.mjs` ∥ `agent.mjs` ∥ `peer-instances.mjs` ∥ `session-lifecycle.mjs` 逐个 import 零错，无新环（新叶零 import）。

### 5.4 审计与评审轮次（终态 clean）

- **内部偏离审计（explore · 只读）轮次 1**：四类偏离逐条判 ⇒ 🔴 0；🟡 1 = `docs/core/design/API-CONTRACT.md` 生成区未重跑（§2.13 行 11）；🔵 2（本段此前为空 ∥ §2.13 行 11 括注「新叶四导出」与实际一个导出不符）。
- **内部代码评审（advisor · type=code）轮次 1**：VERDICT pass ⇒ 🔴 0 · 🟡 3（API-CONTRACT 未重跑 ∥ AC 判据路径与交付档不一致 ∥ 本段为空）· 🔵 3（`docs/core/design/PROVIDER.md` 两处行号漂移 ∥ AC7 静态断言只认行首 `import` ∥ AC5 形状断言放宽未注理由）。
- **自修轮次**：1 —— 单测首跑红（`recordChatTrace` 要 `logCtx.cwd`），改夹具为 `logCtx: { traces: false }` 后全绿；代码面无第二轮修正。
- **终态**：`clean` —— 代码面无 🔴、无待修项；余下 🟡/🔵 全落在文档面（设计档 ∥ 契约档生成区 ∥ 本档），按归属上抛，未自行改设计面。

### 5.5 未做与上抛

**[上抛·待裁] §2.13 行 11 未执行（属主待裁）**：`node scripts/api-contract.mjs --write` 会整区重写 `docs/core/design/API-CONTRACT.md` 的生成区，属设计档面；父侧本批明示「需求档／设计档／`test/RTM.md` 不是你的笔」，故本席未跑。

现状读数：该档仍把 `getSessionId` 记在 `thincoder-core/session-slots.mjs:64` 且类型记 `fn`，而该行现为 re-export、函数体已迁新叶；新叶在契约档零行。

**[上抛·知会] AC 判据路径的现行口径**：见 5.2。设计档 ∥ 本档层面若要字面一致，更正行由对应属主补（append-only：本席不改前文）。

**[上抛·知会] 仓外一步（承 §2.8 ∥ §2.18）**：`~/.thincoder/config.json` 的 `providers[19].headers` 仍需改成 `"thincoder-${sessionId}"`；不改则该渠道仍是固定值，本批代码对它零效果。本席按约束未碰该档。

**收口前置**：`docs/batches/2026-11-01-opencode-session-header.test.mjs` 须在收口时删除（零留存纪律），读数已落在 5.3。

## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

**状态行**：已收口 2026-11-01

### 6.1 交付事实

| # | 落地 |
|---|---|
| **① 新叶** | `thincoder-core/session-identity.mjs`（新建，零 import）：`currentSessionId` + `getSessionId()` 逐字迁自 `thincoder-core/session-slots.mjs` 原 `:61-69`；该档改 re-export，**既有 import 面零改** |
| **② 模板解析** | `thincoder-core/client-identity.mjs:57-59` `resolveSessionRefs`：单串 `replaceAll(SESSION_REF, getSessionId())`，**无变量词表、无扫描正则、无「识别失败」分支**；工序 = 先解析 → 删 UA 大小写变体 → 写产品 UA。`thincoder-core/provider/core.mjs:417` 与各 transport **零改** |
| **③ 预设** | `thincoder-core/config-presets.mjs:57-58` 两条 OpenCode Go 预设携 `x-opencode-session: thincoder-${sessionId}`；AC8（用例 #19）首次给它机检读数 |
| **④ 批内单测** | `docs/batches/2026-11-01-opencode-session-header.test.mjs`（7 条：AC1–AC5 · AC7 · AC8；收口删） |
| **⑤ 集成用例** | `test/integration/opencode-session-header.test.mjs`（2 条：真头 200 + 助手回复 ∥ 不带该头复现 `400 MissingSessionID`，本机假上游，零外网） |
| **⑥ 契约索引** | `docs/core/design/API-CONTRACT.md` 生成区重跑（父侧执行 `node scripts/api-contract.mjs --write`，4623 条）：`getSessionId` 实体记 `thincoder-core/session-identity.mjs:16`、re-export 记 `thincoder-core/session-slots.mjs:64` |
| **⑦ 需求档** | `docs/core/requirements/PROVIDER.md` §4.3 边界删「不实现会话动态头」（失效句）；新立 **§4.11**（R38–R40 · N22 · 边界） |

### 6.2 父侧独立复核（全部自跑，不采信报告）

```
node --test docs/batches/2026-11-01-opencode-session-header.test.mjs   ⇒ 7 绿 · 0 红
node --test test/integration/opencode-session-header.test.mjs          ⇒ 2 绿 · 0 红
端到端（产品自己的装配面出站真请求，只打 deepseek-v4.1-flash / max_tokens 1）：
  装配后头 = {"x-opencode-session":"thincoder-13408-…","User-Agent":"ThinCoder/core/0.0.0"}
  模板已解析 = true ⇒ 上游 HTTP 200
载入冒烟：session-slots.getSessionId 可用且进程内稳定 ∥ provider/index ∥ agent ∥ peer-instances 均 OK
```

### 6.3 一处设计错、实施席撞出来的（本批最值得记的）

**设计档 §6.17 把批内单测档写成 `thincoder-core/test/session-header.test.mjs` —— 那是错的。**

- `thincoder-core/test/run.mjs:26` `walk(p)` **递归**，`:35` 任何 `*.test.mjs` ⇒ `fail("uncollected test file (unit test files live in docs/batches/ …)")` ⇒ **core 包 `npm test` 恒红**
- `thincoder-core/agent-tools/batch-unit-test-gate.mjs:8-11` 收口门**只扫批档所在目录** ⇒ 落错位置的档**收口时不被点名，永久留盘**

**实施席没有照任务书埋头写**，而是先读仓里的机检规则、发现「照设计写会破门」，然后停下上抛 —— **既没擅自改设计档，也没硬着头皮写**。父侧裁定改落 `docs/batches/`（同目录同名前缀），内容判据一字未动。

### 6.4 未收项（已登账）

- **提示词体系三处缺位**（父侧排查，见 §6.5）→ 台账行
- **设计档 253 处死先例坐标** → 台账行
- **按对话槽分桶**（本批口径 = 每进程会话实例；要按槽分桶属另一批穿参改造）→ 未登账，等用户是否要

### 6.5 父侧排查：为什么设计档反复写错单测档路径

**结论：不是疏忽，是三层同时缺位，且提示词在往反方向推。**

1. **规则本体不缺** —— `docs/core/design/TESTING.md:90 ∥ :130 ∥ :145 ∥ :529` 都写明单元测试档住 `docs/batches/`。
2. **提示词层零覆盖** —— `thincoder-core/prompts/**` 16 档里：`docs/batches` **0 命中** · 单测/单元测试 **0 命中** · 零留存/用毕即删 **0 命中**；唯一提到 `.test.mjs` 的 `thincoder-core/prompts/common.md:353` 讲的是「设计档不得引批档的 `.test.mjs`」，方向相反。
3. **纪律层半边有位置** —— `thincoder-core/prompts/discipline-engineering.md:171` 给了生命周期（收口删），`:187` 给了集成用例位置，**单测档只给了生命周期没给位置**。
4. **先例库是死的** —— 设计档引用 `<包>/test/*.test.mjs` 共 **253 处，盘上存在 0 处**；而提示词 `:76` 要求「先例勘察、先对齐」。**照做就抄到旧形。**

### 6.6 收口判据

- chain：§1 · §2 · §3（轮次 2 = pass）· §4 · §5 · §6 全在
- 验收：7 绿 + 2 绿 + 端到端 200 + 载入冒烟，全为父侧自跑
- 零留存：本批单测档收口删除（读数已落 §5.3 与本节）
- 台账：`#1923` 转已核销

### 6.7 更正（父侧自纠 —— §6.3 的主体写错了）

**§6.3 写「设计档 §6.17 把批内单测档写成 `thincoder-core/test/session-header.test.mjs`」—— 这句的主体错了。** 父侧实读更正：

- `docs/core/design/PROVIDER.md` 全档 `session-header` 命中 = **0**（本轮之前）；`thincoder-core/test/` 的两处与本批无关（`:1383` 是 anthropic 集成档）。
- **错路径只活在批档 §2 的三行**（`:130` ∥ `:140` ∥ `:269`）—— 即**设计席写的任务书面**，不是设计档面。
- **设计档原本没有「判据文件与跑法」这一行**；本轮由 `docs/core/design/PROVIDER.md:852-854` 补入正确值，由 §2.20 supersession 撤销 §2 三行的旧值。

**不变的部分**：错值确实出自设计席（在任务书 §2 而非设计档），成因仍是 §6.5 那三层；**实施席的上抛也仍然成立** —— 它读的就是批档 §2，那三行确实是错路径。

**教训补一条**：**父侧转述「哪一面写错了」也必须实读**。我把「任务书面」说成了「设计档面」，正是本节所批评的那种「没核实就下断言」—— 设计席如实上报、当场纠了回来。
