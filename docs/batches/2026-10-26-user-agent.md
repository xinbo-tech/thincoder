# 2026-10-26 · 模型请求 User-Agent
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-26 · 来源 = 用户 2026-10-26 20:38「现在我们调用模型时http请求的agent名称用的是啥？」→ 20:38「要加，加上ThinCoder、端类型和版本号」。
> 台账 = #1819（PROVIDER · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-26
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：用户 2026-10-26 20:38「现在我们调用模型时http请求的agent名称用的是啥？」→「要加，加上ThinCoder、端类型和版本号」→ 20:44「**不要可覆盖**」。

## 现状（父侧实读）

**模型调用请求里根本没有 `User-Agent` 头。**

| 面 | 落点 | 现有 header |
|---|---|---|
| OpenAI 兼容 | `thincoder-core/provider/core.mjs:415` | `provider.headers` 展开 ∥ `Content-Type` ∥ `Authorization` |
| Anthropic | `thincoder-core/provider/anthropic.mjs:197` | `provider.headers` ∥ `x-api-key` ∥ `anthropic-version` |
| Google | `thincoder-core/provider/google.mjs:133` | `provider.headers` ∥ `Content-Type` |
| Responses | `thincoder-core/provider/responses.mjs:237` | `provider.headers` ∥ `Content-Type` ∥ `Authorization` |

**全仓 `User-Agent` 出现在五面、无一是模型调用**：网页抓取 `thincoder-core/tools/web.mjs:84`（冒充浏览器是刻意）；代理探测三端 `thincoder-cli/src/tui/cmd-config-menus.mjs:63` ∥ `thincoder-desktop/src/main/providers.mjs:393` ∥ `thincoder-vscode/src/extension/settings.mjs:300`。

server 平台客户端 `thincoder-server/src/project/platform-client.mjs:56`（GitHub API 要求）；MCP `clientInfo`（`thincoder-core/mcp.mjs:60`）是握手字段，不是 HTTP 头。

⇒ 上游服务商看到的是 Node.js `fetch` 的默认 UA，**请求在服务商侧是无名的**。

## 要什么

四个 provider 面在模型请求上带 `User-Agent`，内容含三件：

| # | 成分 | 来源 |
|---|---|---|
| 1 | **产品名** `ThinCoder` | 字面 |
| 2 | **端类型** | CLI ∥ VSC ∥ desktop ∥ server（四个消费面）|
| 3 | **版本号** | 各端 `package.json` 的 `version`（实读：core 0.10.12 · cli 0.12.79 · vscode 0.10.12 · desktop 0.10.12 · server 0.1.0）|

**具体格式由设计定**（`ThinCoder/<端>/<版本>` 之类的形态候选），但必须含这三件、且机器可解析。

## 硬约束：**不可覆盖**（用户 20:44 令）

**`provider.headers` 里写了 `User-Agent` 也不能盖掉我们设的值。**

**为什么这条是硬约束**：这个 UA 是产品对上游的身份声明，不是渠道配置项。让渠道把它改掉，等于「谁都能把这个产品叫成别的名字」——那这个标识就没有意义。

**实现含义**（设计要落清）：现有四个面都是 `{ ...(provider.headers ?? {}), <我们的键>: <我们的值> }` 的形态——**对象展开下后写的赢**，所以把 UA 放在展开之后即天然不可覆盖。**设计须显式写明这条，并给一条机检**（构造带 `User-Agent` 的 `provider.headers`，断言出站仍是我们的值）。

## 边界

- **不动 `tools/web.mjs` 的 UA**（那是网页抓取，冒充浏览器是刻意的）
- **不动 `tui/cmd-config-menus.mjs` 的探测 UA**
- 不加配置键（**不是**「可配置项」，是产品标识）
- 不改 `provider.headers` 的既有语义（自定义头仍生效，只是 UA 这一键被占）

## 待设计定

1. **UA 字形**——`ThinCoder/CLI/0.12.79` ∥ `ThinCoder-CLI/0.12.79` ∥ 其它；要能被服务商侧按产品名聚合，也要能拆出端与版本
2. **端类型与版本怎么注进来**——`provider/core.mjs` 是被三端共用的核件，它不知道自己在哪个端里跑；要有注入点（谁注、缺省是什么）
3. **server 面的端名**——server 自己也调模型（管理面 agent），它的 UA 该是什么
4. **缺省值**——某个端没注入时用什么（不能空、不能是 `undefined`）

**已定决定：server 端声明点下移到 `src/agent/run.mjs` 的 `loadCoreChat()`（偏离设计 §6.17 的 `bin/thincoder-server.mjs` 顶部）· 用户未介入（父侧依实施席上抛裁定） · 时间：2026-10-26 21:20**

## 事实

| 项 | 实读 |
|---|---|
| `thincoder-server/node_modules/@thincoder/` | **只有 `render-core`**，无 `core` |
| server `src/**` 载核形态 | **全部动载 + 降级**：`chat-compact.mjs:44`「取核面不可用（${face}）：@thincoder/core 未装载——该面退中性（回合不阻断；生产镜像内核为声明依赖）」· `chat-env-tools.mjs:56` 同式 |
| 核唯一装载点 | `src/agent/run.mjs:21` `export async function loadCoreChat()` |

## 裁定

**设计原文（`bin/thincoder-server.mjs` 顶部静态 import）在本仓物理上落不下去**：加静态 `@thincoder/core` import ⇒ 无核检出树**启动即崩**，`npm run dev`（`node --watch bin/thincoder-server.mjs`）与用例 #13 当场红，且**破坏既有「缺核各面退中性」语义**。

**改走**：声明点在 `loadCoreChat()` 内、**核装载成功后**动载 `@thincoder/core/client-identity.mjs` 并声明。

**逻辑上比设计原文更自洽**：`loadCoreChat()` 是唯一核装载点 ⇒ 无核就没 chat、也没出站请求 ⇒「有模型调用前必先声明」天然成立。

## 连带

- `bin/thincoder-server.mjs` **零改动**
- 用例 #13 改为**断言 `userAgent()` 产出**（不是入参），核不可用时 **skip 并打印原因**（开发树本就无核，不伪绿）
- **收口轮**由设计席把 §6.17 的 server 行进改成上形（本轮设计档不动）

## 性质

**父侧裁定，非用户指示**——用户原话未涉及 server 落点细节。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 2：评审第 2 轮 8 条已落（#1 CLI 声明点移 command-table.mjs））


**设计档落点**：`docs/core/design/PROVIDER.md` §6.17「请求头装配（`provider.headers`）」内新增「客户端标识头（`User-Agent`）」块（机制 ∥ 关键决策 ∥ 受影响文件表 ∥ 用例表）。本段只列条目与验收，细节以该处为单源。

## 目标态

七处出站模型请求（OpenAI 兼容 ∥ Anthropic ∥ Google ∥ Responses ∥ 会话标题 ∥ 模型清单 ∥ embedding）都带 `User-Agent: ThinCoder/<surface>/<version>`；surface 字面 = 既有端名 `cli` ∥ `vscode` ∥ `desktop` ∥ `server`（缺省 `core`）；该键**不可被 `providers[].headers` 覆盖**（含大小写变体）；无配置键、无开关。

## 五问答复

| # | 问 | 答 |
|---|---|---|
| 1 | UA 字形 | `ThinCoder/<surface>/<version>`（例 `ThinCoder/cli/0.12.79`）。首段精确匹配产品名 ⇒ 按产品聚合不靠前缀启发；`split("/")` 拆出端与版本。surface 小写枚举 = 既有端名 `cli` ∥ `vscode` ∥ `desktop` ∥ `server`（VSC 用 `vscode` 不用 `vsc`——端名单源在 `session-slots.mjs`，不另立词表）；version = 该端 `package.json` 的 `version` 原样。拒了 `ThinCoder-cli/0.12.79`：产品聚合只能靠前缀匹配 |
| 2 | 端与版本怎么注 | 核件新增 `thincoder-core/client-identity.mjs`：`setClientIdentity({surface,version})` / `clientIdentity()` / `userAgent()` / `withUserAgent(headers)`。各端在**自己的启动期声明一次**（CLI `thincoder-cli/src/command-table.mjs`——每个命令都过的分发点，`thincoder-cli/bin/thincoder.mjs:28` 静态 import；TUI `startup.mjs` 会漏 headless ∥ ACP ∥ distill ∥ embedding 四条模型路径。Desktop `thincoder-desktop/src/main/session-slots.mjs` · VSC `thincoder-vscode/src/extension/session-slots.mjs` · Server `thincoder-server/bin/thincoder-server.mjs`——desktop ∥ VSC 落在零 electron ∥ vscode 依赖的端名声明档，故可被单测 import 断言）。核件不猜自己在哪个端——不读 `argv` / 环境变量 / `package.json`。拒了 provider 条目字段：那是用户可改的配置，等于允许用户改掉产品身份 |
| 3 | server 端名 | `server`（用户 2026-10-26 20:39 原话「server的端类型就是server」）。四端名 = 既有端名 `cli` ∥ `vscode` ∥ `desktop` ∥ `server`，统一小写；内部缺省面 `core` |
| 4 | 不可覆盖的机检 | 装配 = `{ ...withUserAgent(provider.headers), ...内置头 }`；`withUserAgent` 先**删除任何大小写变体的 `user-agent` 键**，再写我们的值。必须删键：`fetch` 的 `Headers` 对大小写变体同名键是**合并**语义，只靠「后写覆盖」会出 `evil, ThinCoder/…` 双值。机检 = 单测构造 `{"User-Agent":"evil/1.0"}` 与 `{"user-agent":"evil/1.0"}` 两例，断言出站单值且等于我们的 UA（`design §6.17` 用例 #2 ∥ #3） |
| 5 | 其它出站面 | **一并覆盖** `provider/list-models.mjs` 三个 format 分支与 `generate-title.mjs`（会话标题是真模型请求）与 `embedding.mjs`（同一次上游模型请求；只加 UA，不给它引入定制头字段）。**不动** 网页抓取 `tools/web.mjs` ∥ 代理探测三端（`tui/cmd-config-menus.mjs` ∥ `desktop/src/main/providers.mjs` ∥ `vscode/src/extension/settings.mjs`）∥ server 平台客户端 ∥ MCP `clientInfo` |

**缺省值**：无人注入 ⇒ `ThinCoder/core/0.0.0`。哨兵值（真实端版本恒不等于 `0.0.0`），非空、非 `undefined`；只该出现在编程调用 ∥ 单测面，四端进程内出现即注入漏了。不读核件 `package.json`——desktop 把核件 materialize 到 `.thincoder/tmp/`，那里未必有该文件。

## 本批条目（覆盖）

| # | 条目 | 判据 |
|---|---|---|
| 1 | 模型请求带 `User-Agent`，含产品名 ∥ 端 ∥ 版本三件 | 出站 UA 匹配 `^ThinCoder/(cli\|vscode\|desktop\|server\|core)/\S+$` |
| 2 | 该键不可被 `providers[].headers` 覆盖（大小写变体同判） | 注入 `User-Agent` ∥ `user-agent` 后出站仍是我们的值且单值 |
| 3 | 其它定制头零回归 | 定制 `X-Device-Id` 照旧出站 |
| 4 | 不是配置项：无配置键、无开关 | 配置面零新增键（`config.mjs` 零改） |
| 5 | 端与版本由各端自注，核件不猜 | 四端接线用例（`design §6.17` #10–#13）各断言 `clientIdentity()` = 该端 `package.json` 版本；核件零 `package.json` ∥ `argv` ∥ 环境变量读取 |
| 6 | 域外面级不动 | 五面零改：网页抓取 `thincoder-core/tools/web.mjs` ∥ 代理探测 `tui/cmd-config-menus.mjs` `desktop/src/main/providers.mjs` `vscode/src/extension/settings.mjs` ∥ server 平台客户端 `server/src/project/platform-client.mjs`；MCP `clientInfo` 零改 |

## 受影响文件与测试

受影响文件表（本轮实测行数 → 预期增量）= `design §6.17` 表：11 个既有档 + 新建 1 个（`thincoder-core/client-identity.mjs`，≈55 行）+ 批内单测档 1 个。单档增量均 ≤3 行，最大档 363 行（server），全在 500 行软线内，无需拆分计划。

测试：本批单测档 `test/2026-10-26-user-agent.test.mjs`（收口删除），覆盖 `design §6.17` 用例 #1–#14（四端接线 #10–#13 · CLI 声明点唯一 #14）。

## 验收对照

| 条目 | 验收（机检） |
|---|---|
| 1 · 4 | `node --test test/2026-10-26-user-agent.test.mjs` 全绿；用例 #1 断言三件齐全、#4 断言缺省哨兵 |
| 2 | 同命令；用例 #2 ∥ #3 断言不可覆盖（含大小写变体单值） |
| 3 | 同命令；用例 #5 断言其它定制头零回归 |
| 5 | 同命令；用例 #10–#13 断言四端各声明一次（import 该端落点后 `clientIdentity()` = 该端 `package.json` 版本）；#4 断言无声明时缺省 `core/0.0.0`（核件无自动探测）；#14 断言 CLI 声明点唯一（源扫恰 1 处 = `command-table.mjs`） |
| 6 | `git diff --stat` 五面域外档零改动 |

集成半边按批次规则不在此跑。

**RTM 实读证据**（本轮实读 `test/RTM.md`）：`## CLI 端` 下 11 条故事（§1 工具结果回到模型 … §11 超窗守卫）· `## VS Code 端` · `## Desktop 端` · `## 异常与更正` · `## 签署面`，共 34 条带号用例行。

对这些段做大小写敏感扫描（`User-Agent` ∥ `UserAgent` ∥ `请求头` ∥ `clientInfo` ∥ `出站`）= **零命中** ⇒ 无既有行断言出站请求头。故 RTM 增量 = 0 行（本批不改任何用户可观察结果——UA 是端对上游的身份声明，不经用户可见入口）。

## 边界（本批不做）

- 不加平台 ∥ Node 版本 ∥ 语言环境等附加段——UA 只此三段
- 不改 `provider.headers` 既有语义：其它键的「内置头胜出」与「大小写变体交给 fetch 归并」零改（例外只有 `User-Agent` 一键）
- 不做 UA 的运行时展示面、不做日志落盘、不做服务商侧解析工具
- VSC 端无 `providers[].headers` 概念——本批不引入

## 上抛项

1. **盒沙盒（member-shell）已定为域外，本段无未决项**：管理面 agent 在本进程（`thincoder-server/src/agent/run.mjs` 载入核 provider 客户端），`bin/thincoder-server.mjs` 一处声明即覆盖。盒沙盒是另一调模型的进程面，但它的 `baseURL` 取自 `env.OPENAI_BASE_URL`（`deploy/sandbox/member-shell/core-run-util.mjs:59`）= 自家 server 网关、渠道名 `BOX_PROVIDER = "server"`（`:17`），不是上游服务商；网关是否透传该头未读（`unverified`），且盒内无自有 `package.json` 可声明版本 ⇒ 本批不接线，盒内请求带缺省 `core/0.0.0` 发往自家网关。**上抛父侧：登一条 tech_todo（网关透传核实 + 盒身份），另批处置**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审结论（`docs/core/design/PROVIDER.md` §6.17 客户端标识头块 · :730-:777 ∥ 批档 §2）

计数：🔴 1 · 🟡 9 · 🔵 3（共 13 条）

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | Document ownership | 🔴 | 新增块用「改写/改判」括注代替就地修订，同节三条既有活体规范句仍与新增块相反：`docs/core/design/PROVIDER.md:724`「**装配契约** = `{ ...(provider.headers ?? {}), ...内置头 }`」不含 UA；`docs/core/design/PROVIDER.md:725`「⑥ 模型清单拉取 `list-models.mjs`（对照面——零改）」而 `docs/core/design/PROVIDER.md:764` 给该档「+3（三处装配）」；`docs/core/design/PROVIDER.md:723` 的两类来源（内置头 = 协议要求 · 定制头 = 渠道配置）无 UA 的位置。同一机制（请求头装配与消费点）在同节两处相反 ⇒ 自上而下读到 :724-:725 会得出「装配式无 UA、list-models 零改」。 | 就地把 :723 补第三类「产品标识头」、:724 装配式改为 `{ ...withUserAgent(provider.headers), ...内置头 }`、:725 ⑥ 改为「本项覆盖 · UA 三处装配」；删掉新增块「改写 6.17 原…」「改判为本项覆盖」两处括注（旧句已不在）。 |
| 2 | Requirements / Document ownership | 🟡 | 拥有该主题的需求档未随动：`docs/core/requirements/PROVIDER.md:85`「### 4.3 `provider.headers` 全通路铺开」的判定句 `:91`「无定制头配置时头集合逐字一致」与非功能行 `:95`「N8 零行为回归（未配置 headers 时头集合逐字不变）」在「UA 一律携带」下已为假；本批也未在该档登记需求条目（同档 §4.1–§4.9 每批登记一行，`:52` 起）。批档 §2 条目表是记录面，不是需求面。 | 在 `docs/core/requirements/PROVIDER.md` 新增 §4.10（UA 三件 + 不可覆盖 + 无配置键，带 F-ID 与判定句），并把 §4.3 的 R18 判定句与 N8 行按「定制头面」重新限定、明写新增内置头 UA。 |
| 3 | Precedent | 🟡 | 新增块无「先例（closest-precedent）」行，而本档每一节都有（`:310` · `:475` · `:1043` · `:1114-1118`），屋形见 `:1257`「**先例与公开来源**：」。直接先例在册未引：`docs/core/design/PROVIDER.md:1323`「D-PR21 · 请求头展开形态 = **各点内联**」与 `:1324`「D-PR22 · 覆盖语义 = **内置头胜出**」；本项对 `:727`「大小写变体同名定制头交给 fetch 归并（不做大小写归一）」的偏离也未写对齐/偏离理由。 | 补「先例（closest-precedent）」行：坐标 = D-PR21 ∥ D-PR22 ∥ §6.17 既有装配契约；对齐 = 各点内联、内置头胜出；偏离 = UA 键做大小写归一 + 删键（理由 = fetch `Headers` 合并语义，`:742`），并说明其余键零改。 |
| 4 | Survey | 🟡 | 无「公开来源核查」行（屋形 = `:1263`「**公开来源核查**：docs.anthropic.com ∥ platform.claude.com …」）；`:750` 提到「RFC 更常见的 `ThinCoder-cli/<version>`」但未记录来源与核查结论。 | 补公开来源行：核查了哪些源（UA 语法 ∥ 各家 CLI 的 UA 实样 ∥ 服务商侧分桶惯例），结论「相关 / 无相关」都写；`unverified` 项照实标注。 |
| 5 | Existing-piece | 🟡 | 新名（`client-identity.mjs` · `setClientIdentity` · `clientIdentity()` · `userAgent()` · `withUserAgent()` · surface 五枚举）无三问行（屋形 = `:1259`「**三问行（既有件核对）**」；`:687-695` 同形）。核内无同职责既有件（`thincoder-core/shell-identity.mjs:2` 是 bash 执行器身份，主题不同），模块级 setter + 测试缝先例存在（`session-slots.mjs:113` · `shell-identity.mjs:13`）。 | 补三问行：`none found: client-identity`（写明 grep 面）+ 设置器形态 `existing: session-slots.mjs:113 setSessionEnd` 作先例坐标。 |
| 6 | Affected files / size annotation | 🟡 | `:765` 三个端启动档只写「各入口」无现况行数（本轮实测：`thincoder-cli/src/tui/startup.mjs` 344 · `thincoder-desktop/src/main/main.mjs` 269 · `thincoder-server/bin/thincoder-server.mjs` 360，+3 后仍在 500 软线内 ⇒ 拆分不触发，但标注缺失）；`:766` VSC activate 入口「未定位」；批档 `:99` 点名的单测档 `test/2026-10-26-user-agent.test.mjs` 未进表（屋形见 `:666`）。核件六档行数抽查逐一对上（494 ∥ 367 ∥ 298 ∥ 317 ∥ 147 ∥ 200 ✔）。 | 补三数（344/269/360）与单测档行（0 → +~N）；VSC activate 入口本轮定位并写行，或明写「VSC 注入不在本批」及其验收后果。 |
| 7 | Acceptance | 🟡 | 端侧注入零机检：`:108` 条目 5 的验收 = 用例 #4 断言缺省哨兵，该用例在**四端全都不注入**时同样绿；无一步验证 CLI ∥ desktop ∥ server ∥ VSC 实际出站 `ThinCoder/<surface>/<version>`（AGENTS.md「Every change must be verified by running it」）。用例 #1–#3 断言「出站」但未点名观测缝。 | 每条端补一条接线断言（导入该端入口后 `clientIdentity()` 等于该端版本，或一次真实装配式出站断言），并写明「出站」的观测方式（global `fetch` 桩 ∥ transport 入参注入）。 |
| 8 | Requirements coverage | 🟡 | `thincoder-core/embedding.mjs:111`「response = await fetch(`${embedder.baseURL}/embeddings`, {」自带 header 对象（:113-116 仅 `Content-Type` + `Authorization`）：它也是一次对上游的模型调用，消费点全表六处与域外三处都没它 ⇒ 该通路仍是无名 UA，正是 §1 `:24` 诊断的症状。 | 判定并落档：或纳入（多一处装配，成本 1 行），或写进域外并给理由（非 provider 通路 ∥ 另批登记）。 |
| 9 | Doc hygiene | 🟡 | 批档 §2 留修订痕迹：`:70`「四类出站模型请求」与同行枚举六项不符、`:97`「7 个既有档改动面」与 `:128` 的 9 不符，两处靠 `:125`「**本段自校更正（2026-10-26，逐字对读后改）**：」块补救。被否的表达式应就地删除，更正块不留。 | 把 `:70` 改「六处」、`:97` 改「9 个既有档」，删掉 `:125-128` 更正块。 |
| 10 | Integration-test | 🟡 | `:111`「RTM 增量 = 无」结论成立（本轮核 `test/RTM.md`：11 条 CLI 故事 + VSC ∥ Desktop 段，`User-Agent` ∥ `请求头` ∥ `header` 零命中 ⇒ 无既有行断言出站头），但零行只以括注给理由，未点名读了哪些段/行，与「没读」不可分辨；本档屋形是显式节（`docs/core/design/PROVIDER.md:1275` §6.28，依据 F34 `:1277`）。 | 在该段补一句 RTM 实读证据（读了哪些故事段、零命中、故零增删），不必新建节。 |
| 11 | Clarity | 🔵 | `:735` 要求「版本号 = 该端 `package.json` 的 `version` **原样**」，但注入行 `:765`「+3（import + 一次设置）」未说版本号由哪个符号给；desktop 面读的是桌面版本还是 materialize 下来的核版本并非同一数（实测芯件树目录名 `.thincoder/tmp/desktop-core-materialized-0.10.9`，而核 package.json 为 0.10.12）。 | 每个端写一行「版本取自哪个文件/符号」，desktop 明确取桌面 `package.json` 而非 tmp 芯件树。 |
| 12 | Clarity | 🔵 | `:743` 枚举外 surface 抛错与用例 #6（`:777`）未给错误文案，也无复现行；实施面可任选措辞。 | 写明抛错的文案骨架（含收到的值与合法枚举），并注明启动期抛错不进生产请求。 |
| 13 | Feasibility | 🔵 | 新增核件要经 desktop 的 materialize 进运行时；实测该树是整目录镜像（`.thincoder/tmp/desktop-core-materialized-0.10.9/` 含全部根 `.mjs` 与子目录），故新件应会被带入——但复制实现未读（`unverified`）。 | 在受影响文件表下加一句：desktop 材料化按目录镜像带入 `client-identity.mjs`（或若为清单式，登记该清单加行）。 |

**通过项（记录）**：字形 `ThinCoder/<surface>/<version>` 三段可拆解（首段精确匹配 + `split("/")`）；不可覆盖给了删键理由（fetch `Headers` 合并语义）与两例机检；缺省 `core/0.0.0` 是可判哨兵且不读核 `package.json`（材料化树版本滞后的理由成立）；`provider.headers` 既有语义对其余键零改；

域外三处（`web.mjs` ∥ `cmd-config-menus.mjs` ∥ `mcp.mjs`）写明；验收命令为改动面单测档 `node --test test/2026-10-26-user-agent.test.mjs`（未写全量套件）；核件六处装配坐标实读对上（`core.mjs:416` · `anthropic.mjs:198` · `google.mjs:133` · `responses.mjs:237` · `generate-title.mjs:101` · `list-models.mjs:77/95/111`）。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 设计评审结论（第 2 轮 · `docs/core/design/PROVIDER.md` §6.17 客户端标识头块 · :730-:806 ∥ 需求档 §4.3 R18/N8 收正 + §4.10 ∥ 批档 §2）

计数：🔴 1 · 🟡 7 · 🔵 2（共 10 条）。上一轮 13 条处置：11 条已落地（#1 #2 #3 #4 #6 #8 #9 #10 #11 #12 #13）；#5 前半（`none found` 三问行）仍未落；#7 的端侧机检已补（用例 #10–#13 + :754 观测缝），但 CLI 端的注入点选错面 ⇒ 由本轮 #1 承。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | Requirements / Feasibility | 🔴 | CLI 端唯一声明点 = `docs/core/design/PROVIDER.md:742`「`thincoder-cli/src/tui/startup.mjs` 顶部」，但 CLI 的模型调用不止 TUI 一条：headless 一次性跑（`thincoder-cli/src/command-interactive.mjs:74` `await runAgent(agent, prompt, {`）· ACP 服务（`:198` `const { runAcpServer, runAcpLogin } = await import("./acp.mjs")`）· `distill` 命令（`thincoder-cli/src/distill.mjs:62` `const res = await chat(provider, {`）· `memory` ∥ `sync` 的 embedding（`thincoder-cli/src/command-table.mjs:32` `memory.embedder = createEmbedder(config.embedding)`）。这些路径的 import 链（`bin/thincoder.mjs:17-29` · `command-interactive.mjs:7-15` · `command-table.mjs:8-16`）全不经 startup.mjs（唯一入口 = `thincoder-cli/src/tui.mjs:5` `export { startTUI } from "./tui/index.mjs"` → `tui/index.mjs:38` `import { showStartup, backgroundIndex, createLoadOlder } from "./startup.mjs"`）⇒ 这些进程的请求带 `ThinCoder/core/0.0.0`。与需求 R37（`docs/core/requirements/PROVIDER.md:245`「四端进程内出现即为注入漏接」）及设计自述不变量（`docs/core/design/PROVIDER.md:749`「四端进程内出现即声明漏了」）直接相反；用例 #10（`:800`）只 import startup.mjs，抓不到。 | 把 cli 声明点移到**每个命令都过的入口**：首选 `thincoder-cli/src/command-table.mjs` 顶部（bin `:28` 静态 import 的分发点，导入零副作用、可被单测直 import），或用 `bin/thincoder.mjs:55` 已有的 `const VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version` 就地声明。受影响文件表换该档行（现况行数一并标），用例 #10 改为「import `command-table.mjs` ⇒ `clientIdentity()` = cli 版本」并保留一条 TUI 面断言。 |
| 2 | Document ownership / 证据 | 🟡 | `docs/core/design/PROVIDER.md:755`「**域外（三处不动）**」只列 web.mjs ∥ cmd-config-menus.mjs ∥ mcp `clientInfo`；批档 `docs/batches/2026-10-26-user-agent.md:22`「全仓 `User-Agent` 只出现在 `tools/web.mjs`（网页抓取）与 `tui/cmd-config-menus.mjs`（代理探测）」失实——本轮全仓扫描另有：`thincoder-desktop/src/main/providers.mjs:393`（桌面代理探测）· `thincoder-vscode/src/extension/settings.mjs:300`（VSC 代理探测，同串 `ThinCoder`）· `thincoder-server/src/project/platform-client.mjs:56`（`"user-agent": "thincoder-server"`）。 | 域外行改面级表述或补齐五处（web ∥ CLI 探测 ∥ desktop 探测 ∥ VSC 探测 ∥ server 平台客户端）；删批档 §1 那句「全仓只两处」。需求 §4.10「不动代理探测的 UA」已覆盖四类，server 平台客户端需一句归类。 |
| 3 | Doc-state（需求档内两处说法） | 🟡 | `docs/core/requirements/PROVIDER.md:96`「不动 embedding 独立渠道」与新 §4.10 `:249`「**embedding 独立渠道只加标识头、不给它引入 `providers[].headers`**」两种说法；§4.10 括注「承 §4.3 定制头面边界」是解释，但 §4.3 该句无限定词，单读 §4.3 会得出「embedding 不动」。 | §4.3 范围边界改「不动 embedding 独立渠道的定制头面（§4.10 标识头除外）」——与同节 R18（`:91`）∥ N8（`:95`）已用的例外写法同形。 |
| 4 | Doc hygiene（编号撞键） | 🟡 | 需求档 `:149` 已给 §4.6 定义「N14 过匹配防回归」，新增 §4.10 `:247` 又用「N14 除 `User-Agent` 外其余头行为零改」。 | §4.10 非功能条目换未占用号（N21 起），并顺检本档 R/N 分配（§4.8 的 R32/R33 与 §4.9 的 R33 属存量撞键，可同批登记、不改值）。 |
| 5 | Existing-piece（三问） | 🟡 | 先例坐标落了（`docs/core/design/PROVIDER.md:734` `existing: … setSessionEnd`），但新增名仍无三问答复：`client-identity.mjs` ∥ `setClientIdentity` ∥ `clientIdentity()` ∥ `userAgent()` ∥ `withUserAgent()`（屋形 = `:687-695`「既有件三问」表）。本轮实测：全仓 `clientIdentity|withUserAgent|setClientIdentity|client-identity` **零命中** ⇒ `none found` 成立。 | 补一行 `none found: client-identity / setClientIdentity / clientIdentity / userAgent / withUserAgent`（写明 grep 面 = 仓根 `**/*.{mjs,js}`），或按 `:687` 表形并入。 |
| 6 | Clarity（观测缝前提） | 🟡 | `docs/core/design/PROVIDER.md:754`「provider 请求恒经 `proxyFetch`」不成立：`thincoder-core/provider/list-models.mjs:34` `const response = await (provider.proxyUri ? proxyFetch(url, opts, provider.proxyUri) : fetch(url, opts))` 与 `thincoder-core/generate-title.mjs:116` `: await fetch(url, opts)` 在无 `proxyUri` 时直调 `fetch`。结论（桩 `globalThis.fetch` 可观测）仍成立，但前提句错，实施面照字面读只桩 `proxyFetch` 会漏两处。 | 前提改「七处最终都落 `globalThis.fetch`（`proxyFetch` 内 `proxy.mjs:43` 一条 + list-models ∥ generate-title 的无代理分支直调）」，指令「桩 `globalThis.fetch` 断言 `opts.headers`」不变。 |
| 7 | Branch provenance | 🟡 | 两处新增防御无场景来源：① `docs/core/design/PROVIDER.md:750` 删大小写变体键，理由「fetch 的 `Headers` 对大小写变体同名键是**合并**语义」只在文中断言，无复现命令、无实地读数/用户报告；② `:751` 枚举外 surface 抛错，场景 = 尚无任何端传过非法 surface。 | ① 补一行复现作为场景证据（`node -e "console.log([...new Headers({\"User-Agent\":\"a\",\"user-agent\":\"b\"})])"` ⇒ 单键值 `a, b`）；② 写明该分支场景 = 端接线笔误并说明为何抛错而非落哨兵，或去掉抛错走哨兵（少一个只有一条文案伴生的分支）。 |
| 8 | 上抛项（协调项） | 🟡 | 批档 §2 `:126` 唯一未决项只问「管理面 agent 是否独立子进程」。本轮实读：管理面在本进程（`thincoder-server/src/agent/run.mjs:19` 载入核 provider 客户端；`thincoder-server/src` 无 `child_process`），但**盒沙盒**是另一个调模型的进程面——`thincoder-server/deploy/sandbox/member-shell/core-run.mjs:415` `await core.runAgent(agent, input, callbacks, { signal, extraTools })`（provider = 盒 env 的 server 网关）。该面既不在四端枚举，也不在域外行。 | 上抛项改写为「盒沙盒（member-shell）归属：server 面 ∥ 另立面 ∥ 域外（及理由）」，或直接给结论 + 一句显式边界（需求 R34 枚举只有四端）。 |
| 9 | 数值口径 | 🔵 | `docs/core/design/PROVIDER.md:766`「行数口径 = `read` 行号；`wc -l` 读数各差 1」——本轮抽查 `read` 报的总行数与表值逐一相等（`core.mjs` 494 · `embedding.mjs` 155 · `anthropic.mjs` 367 · `google.mjs` 298 · `responses.mjs` 317 · `generate-title.mjs` 147 · `provider/list-models.mjs` 200 · `desktop/src/main/session-slots.mjs` 272 · `vscode/src/extension/session-slots.mjs` 77 · `server/bin/thincoder-server.mjs` 360 · `cli/src/tui/startup.mjs` 344），括注的「各差 1」无实测支撑。 | 括注改为「口径 = `read` 报的总行数」，免得实施面复算对不上。 |
| 10 | 坐标漂移 | 🔵 | `docs/core/design/PROVIDER.md:748`「`thincoder-desktop/src/main/main.mjs:9`」——electron 静态 import 在 `thincoder-desktop/src/main/main.mjs:13`（`import { app, dialog, Notification } from "electron"`）；`:734` 测试缝坐标 `thincoder-core/shell-identity.mjs:13` 是提到该符号的注释行，定义在 `:81`（`export function _setComSpecForTest(value) {`）。 | 两处坐标改 `:13` / `:81`，其余不动。 |

**通过项（记录）**：字形三段可拆 + 首段精确匹配；不可覆盖给删键理由与两例机检；缺省 `core/0.0.0` 哨兵不读核件 `package.json`（材料化树版本滞后理由成立）；

`provider.headers` 其余键零改；`withUserAgent` 装配式与既有四 transport 实码对得上（`core.mjs:415-419` · `anthropic.mjs:197-198` · `google.mjs:133` · `responses.mjs:237` 已是一处 `const headers` 供三 fetch）；list-models 三分支坐标 `:77 ∥ :95 ∥ :111` 实读对上；

`materialize-deps.mjs:25` `PACKAGES` ∥ `:31` `EXCLUDED_TOP` 实读对上（目录镜像带入成立）；核包 `exports: {"./*":"./*"}` ⇒ 新件可解析；desktop ∥ VSC 的 `session-slots.mjs` 确零 electron ∥ vscode 依赖（`vscode/src/extension/session-slots.mjs:51` `setSessionEnd(END)` 在 `:51`，`desktop/src/main/session-slots.mjs:78` 同式）；

server 版本 `0.1.0` 与用例 #13 字面一致、`:359` main-guard 实读在位；RTM 零增删判据实读成立（`test/RTM.md` 对 `User-Agent|请求头|header` 大小写不敏感扫描零命中），理由句「不改任何用户可观察结果」属规则允许的那一条；验收命令 = 改动面单测档 `node --test test/2026-10-26-user-agent.test.mjs`（未写全量套件）；受影响文件表 11 既有档 + 2 新档、最大 363 行，全在 500 软线内。

VERDICT: changes-required

### 轮次 3（评审子代理）

### 设计评审结论（第 3 轮 · `docs/core/design/PROVIDER.md` §6.17 客户端标识头块 · :730-:809 ∥ 需求档 §4.3 R18/N8 + §4.10 ∥ 批档 §2）

计数：🔴 0 · 🟡 0 · 🔵 1（新增 1 条）。第 2 轮 10 条处置复核：**Fixed 9**（#1 #2 #3 #4 #5 #6 #7 #9 #10）· **Accepted 1**（#8 盒沙盒归域外并登父侧 todo）· **Unfixed 0**。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/PROVIDER.md | 🔴 | Fixed | CLI 声明点已移到每个命令都过的分发点：`:743`「`thincoder-cli/src/command-table.mjs` 顶部（每个命令都过的分发点——理由见下条）」；`:748`「**CLI 声明点 = `command-table.mjs`，不是 `tui/startup.mjs`**」并逐条点出 headless ∥ ACP ∥ distill ∥ embedding 四条模型路径；受影响文件表换行（`:781` `thincoder-cli/src/command-table.mjs` 202 → +3，旧 `startup.mjs` 行已删，`:787` tier 改「server 363 ∥ CLI 205」）；用例 #10 改为 import `command-table.mjs`（`:803`），新增用例 #14 兜声明点唯一（`:807`）；批档 §2 五问答复同步（`:77`）。全档已无把 startup.mjs 当 CLI 声明点的残留（该名只剩纠正性引用 `:748` ∥ `:807` ∥ `:809`）。 |
| 2 | 2 | docs/core/design/PROVIDER.md | 🟡 | Fixed | `:757` 改「**域外（面级 · 不动）**」并补齐五面：① `tools/web.mjs:84` ② 代理探测三端（`cmd-config-menus.mjs:63` ∥ `desktop/src/main/providers.mjs:393` ∥ `vscode/src/extension/settings.mjs:300`）③ `server/src/project/platform-client.mjs:56` ④ `mcp.mjs:60` `clientInfo`；批档 `:22` 已改「全仓 `User-Agent` 出现在五面、无一是模型调用」并逐面列坐标，失实句已删；`:93` 条目 6「五面零改」与 `:109` 验收同步。 |
| 3 | 3 | docs/core/requirements/PROVIDER.md | 🟡 | Fixed | `:96`「**不动 embedding 独立渠道的定制头面**（§4.10 标识头除外）」，与同节 R18（`:91`）∥ N8（`:95`）的例外写法同形。 |
| 4 | 4 | docs/core/requirements/PROVIDER.md | 🟡 | Fixed | `:247`「**非功能**：N21 除 `User-Agent` 外其余头行为零改」——N14 撞键消除，N21 在本档未占用（§4.8 止于 N20）。 |
| 5 | 5 | docs/core/design/PROVIDER.md | 🟡 | Fixed | `:737`「**三问行（既有件核对）**：`none found`——仓根 `**/*.{mjs,js,ts,cjs}` 扫 `client-identity` ∥ `setClientIdentity` ∥ `clientIdentity` ∥ `userAgent` ∥ `withUserAgent` = **零命中**（2026-10-26 实读）⇒ 五名皆新建；设置器形态不新立，沿上「先例」行的 `setSessionEnd` 形。」与第 2 轮实测结果一致。 |
| 6 | 6 | docs/core/design/PROVIDER.md | 🟡 | Fixed | `:756` 前提改为「七处最终都落 `globalThis.fetch`」，并点名 `list-models.mjs:34` 与 `generate-title.mjs:116` 无 `proxyUri` 时直调 `fetch`、embedding `:111` 直调；「桩 `globalThis.fetch` 断言 `opts.headers`」指令保留。 |
| 7 | 7 | docs/core/design/PROVIDER.md | 🟡 | Fixed | ① `:752` 补复现行「`node -e "console.log([...new Headers({\"User-Agent\":\"a\",\"user-agent\":\"b\"})])"` ⇒ `[ [ 'user-agent', 'a, b' ] ]`」；② `:753` 写明场景 =「**端接线笔误**（四端声明行写错字面，如 `surface:"VSC"`），复现 = 用该入参调一次即抛」并给「不落哨兵」的取舍理由。 |
| 8 | 8 | docs/batches/2026-10-26-user-agent.md | 🟡 | Accepted | 盒沙盒不再挂成未决：批档 `:126`「**盒沙盒（member-shell）已定为域外，本段无未决项**」+ 理由（盒 provider 端点 = 自家 server 网关，`core-run-util.mjs:59` ∥ `:17` `BOX_PROVIDER = "server"`）+ 明确边界（盒内请求带缺省 `core/0.0.0` 发往自家网关，`unverified` 项照实标）+「登一条 tech_todo…另批处置」；设计 `:758` 同文。**注**：本轮未重读 `member-shell/core-run-util.mjs`（不在评审范围）⇒ 该两坐标按作者所读采信，未独立复核。 |
| 9 | 9 | docs/core/design/PROVIDER.md | 🔵 | Fixed | `:769` 口径改「行数口径 = `read` 报的总行数」，并给 4 档对读实测对（`command-table.mjs` 202/201 ∥ `list-models.mjs` 200/199 ∥ `generate-title.mjs` 147/146 ∥ `embedding.mjs` 155/154）与差值解释。 |
| 10 | 10 | docs/core/design/PROVIDER.md | 🔵 | Fixed | `:750` 改「`thincoder-desktop/src/main/main.mjs:13`」；`:734` 测试缝坐标改「`thincoder-core/shell-identity.mjs:81` `_setComSpecForTest`（定义行；`:13` 是提及该符号的注释）」。 |
| 11 | (new) | docs/core/design/PROVIDER.md | 🔵 | New | 用例 #14 判定口径含糊：`:807`「| 14 | 声明点唯一（CLI） | 源扫 `thincoder-cli/src/**/*.mjs` 的 `setClientIdentity` 命中 | 恰 1 处，且该档 = `command-table.mjs`（回到 `tui/startup.mjs` 即红） |」——同档内 `import { setClientIdentity }` 行与调用行各含一次该符号，按「行命中恰 1」实现会得 2 处而误红。建议改判据为「命中**档**集合 = {`command-table.mjs`}」（或扫调用形 `setClientIdentity(`），与 `:809`「声明只许在 `command-table.mjs` 一处」的意图对齐。 |

VERDICT: pass

## §4 用户批准（主 agent）

**批准 = 设计评审第 3 轮 pass（2026-10-26 21:13）**

## 评审读数

| 轮 | 结论 | 计数 |
|---|---|---|
| 1 | changes-required | 🔴 1 · 🟡 7 · 🔵 2 |
| 2 | changes-required | 🔴 1 · 🟡 7 · 🔵 2（第 1 轮 🔴 已修，第 2 轮新抓 CLI 注入点选错面）|
| 3 | **pass** | 第 2 轮 10 条：**Fixed 9 · Accepted 1 · Unfixed 0**；新增 🔵 1 |

## 用户授权链

| 时点 | 原话 |
|---|---|
| 20:38 | 「现在我们调用模型时http请求的agent名称用的是啥？」 |
| 20:38 | 「要加，加上ThinCoder、端类型和版本号」 |
| 20:39 | 「server的端类型就是server」 |
| 20:44 | 「不要可覆盖」 |
| 21:01 / 21:12 | 「评审」×2 |

## 父侧对评审 host 提示的复核

第 3 轮评审报「`proxy.mjs:43` 文件不可读（host-verified 1/2）」。**父侧实测：`thincoder-core/proxy.mjs` 在盘、55 行，`:43` = `const response = await globalThis.fetch(urlStr, { ...opts, signal })`** —— 坐标成立，是评审侧读取失败，不是设计错。**该提示不改判**。

## 批准覆盖

§2 现行任务书全部条目（13 条五问答复 · 11 处既有档 + 1 新建 + 1 单测档 · 用例 #1–#14 · 域外五面 + 盒沙盒）。

**不覆盖**：新增 🔵 #11（用例 #14 判定口径「恰 1 处」含糊）——实施时按「命中档集合 = {`command-table.mjs`}」实现即可，不必回改设计档。

## 实施轮不授权

- 不改 `thincoder-core/prompts/`、`bench/**`、`docs/core/design/MODEL-BENCH.md`
- 不改设计档 `docs/core/design/PROVIDER.md` 与需求档 `docs/core/requirements/PROVIDER.md`（评审已定稿）
- 不动域外五面（`tools/web.mjs` ∥ 三端代理探测 ∥ `platform-client.mjs` ∥ MCP `clientInfo`）
- 不动盒沙盒（已记台账 `#1820`）

## §5 实施记录（eng-coder）
**状态行**：实施完成（13 档 + 批内单测；14/14 绿；审计 1 轮 · 代码评审 2 轮（终态 clean）；偏离 D1–D5 与上抛项见段内）



### 交付摘要

模型请求带 `User-Agent: ThinCoder/<surface>/<version>`，该键不可被 `providers[].headers` 覆盖（含大小写变体）。新建核件 1 档 + 改 11 档既有档 + 批内单测 1 档（落 `docs/batches/`，收口删除）。

| # | §2 条目 | 实现 | 机检读数 |
|---|---|---|---|
| 1 | 模型请求带 UA（三件） | 七处装配点全改：`provider/core.mjs:417` · `provider/anthropic.mjs:199` · `provider/google.mjs:134` · `provider/responses.mjs:238`（三处 fetch 共用）· `generate-title.mjs:102` · `provider/list-models.mjs:78/96/112` · `embedding.mjs:115`；字形 `ThinCoder/<surface>/<version>` | 用例 #1 断言 `^ThinCoder/(cli\|vscode\|desktop\|server\|core)/\S+$` 与逐字值 → pass |
| 2 | 不可覆盖（含大小写变体） | `withUserAgent` 先删任何大小写变体的 `user-agent` 键再写本产品值（`client-identity.mjs:44-51`），不改入参 | 用例 #2 `{"User-Agent":"evil/1.0"}` ∥ #3 `{"user-agent":"evil/1.0"}` → 出站单值等于我们的 UA、无 `evil` → pass |
| 3 | 其它定制头零回归 | 其余键照旧展开、内置头仍胜出 | 用例 #5 `X-Device-Id: abc` 照旧出站 → pass |
| 4 | 不是配置项 | 零配置键、零开关；`config.mjs` 零改；核件不读 `argv`/环境变量/任何 `package.json` | 用例 #4 缺省哨兵 `ThinCoder/core/0.0.0` → pass；`git diff` 无 `config.mjs` |
| 5 | 端与版本自注、核件不猜 | CLI `command-table.mjs:20-21`（`../package.json`）· desktop `src/main/session-slots.mjs`（`../../package.json`，非物化核树）· VSC `src/extension/session-slots.mjs` · server `src/agent/run.mjs` `loadCoreChat()` 内（动载后声明，`readPackageVersion()`） | 用例 #10–#13 各断言 `clientIdentity()` = 该端 `package.json` 版本（server 断言产出 `userAgent()`）→ pass；用例 #14 源扫命中档集合 = {`command-table.mjs`} → pass |
| 6 | 域外面级不动 | `tools/web.mjs` ∥ 三端代理探测 ∥ `server/src/project/platform-client.mjs` ∥ MCP `clientInfo` ∥ 盒沙盒：零改 | `git status` 面无这些档；`git diff --stat` 只含上列 11 档 + 1 新件 |

### 偏离与决策（均经父侧裁或评审驱动，逐条留证）

| # | 项 | 设计/§2 原文 | 实际落地 | 依据 |
|---|---|---|---|---|
| D1 | server 声明点 | `bin/thincoder-server.mjs` 顶部 | `thincoder-server/src/agent/run.mjs` 的 `loadCoreChat()` 内（核装载成功后声明）；`bin/thincoder-server.mjs` 零改 | **父裁 (b)**（2026-10-26 21:2x）。事实面：`thincoder-server/node_modules/@thincoder/` 只有 `render-core`（无 `core`）；`cd thincoder-server && node --input-type=module -e "await import('@thincoder/core/client-identity.mjs')"` ⇒ `ERR_MODULE_NOT_FOUND`；静态 import 会让无核检出树启动即崩并破坏「缺核各面退中性」（`src/agent/run.mjs:20` 旧注 ∥ `deploy/sandbox/member-shell/core-run.mjs:19` 同向纪律） |
| D2 | 批内单测落点 | `test/2026-10-26-user-agent.test.mjs` | `docs/batches/2026-10-26-user-agent.test.mjs` | 代码评审第 1 轮 🔴#1：仓根 `test/run.mjs:36-38` 的 SC-1 反查（`test/` 树内 `*.test.mjs` 必须全落 `test/integration/`）实测判红，且 CI 跑的正是该 runner（`.github/workflows/test.yml:19` `- run: cd .. && node test/run.mjs`）；两个 runner 注释均写明「批内单测住 `docs/batches/`」。**收口待办（父侧笔）**：`docs/core/design/PROVIDER.md:785` 与批档 §2 `:127` ∥ `:133` 仍写旧址，需同步改 `docs/batches/…` 并把验收命令改为 `node --test docs/batches/2026-10-26-user-agent.test.mjs` |
| D3 | 入参校验范围 | 只写 surface 枚举外抛错 | 追加 version 校验（`typeof version !== "string" ∥ trim 空` ⇒ 抛），断言并入用例 #6，未新增用例号 | 代码评审第 1 轮 🔵#5：漏传 version 时出站会变 `ThinCoder/cli/undefined` 且仍过设计判据 `^…/\S+$`；实测四个生产调用面全部传串，零调用方受新抛影响 |
| D4 | 档头判据句对齐 | — | desktop/VSC `session-slots.mjs` 档头补明「唯一自读 = 本端 `package.json` 的 version」 | 代码评审第 1 轮 🟡#3：desktop 档头原写「零文件系统直读」，与新代码二说 |
| D5 | 用例 #13 强度 | 断言「核不可用 ⇒ skip 并打印原因」 | 保留 skip 分支，另加逐字 specifier 断言（`requested` deepEqual 两条生产 specifier） | 代码评审第 1 轮 🟡#4：原实现只验替身，包名笔误会被 `includes()` 放过 |

**未采纳（有据）**：评审 🔵#6 建议给用例加复位钩子——复位要用 `setClientIdentity` 写哨兵，会让用例 #4 变成「断言我刚写入的复位值」即不可失败化；改以档头顺序纪律（#4 最先跑，观测核件初值）替代，理由已写入测试档头注。

### 读数（本轮实跑）

| 命令 | 结果 |
|---|---|
| `node --check` × 13 档（12 代码 + 1 单测） | 全部 OK |
| `node --test docs/batches/2026-10-26-user-agent.test.mjs` | **tests 14 · pass 14 · fail 0 · skipped 0**（~0.5s） |
| SC-1 判据复测（按 `test/run.mjs:36-40` 同式遍历 `test/`） | `total = 12 · outside test/integration = 0` ⇒ **PASS**（迁移前实测为 `✖ test manifest check failed: uncollected test file … test/2026-10-26-user-agent.test.mjs`，exit 1） |
| 端接线直跑（独立进程） | `command-table.mjs` ⇒ `ThinCoder/cli/0.12.79` · desktop ⇒ `…/desktop/0.10.12` · VSC ⇒ `…/vscode/0.10.12` · server（注入缝）⇒ `ThinCoder/server/0.1.0` |
| `withUserAgent` 边角 | `null` 入参 ⇒ 仅 UA；`{"User-Agent":"a","USER-agent":"b"}` ⇒ 仅 UA；入参对象零变异；返回新对象 |
| `git diff --stat` 域外核对 | 无 `tools/web.mjs` ∥ 三端代理探测 ∥ `platform-client.mjs` ∥ `mcp.mjs` ∥ `config.mjs` ∥ `deploy/sandbox/member-shell/**` |

### 内部审计与代码评审

| 环 | 对象 | 结论 |
|---|---|---|
| 偏离审计（explore，只读） | 13 档 + §2 + 设计 §6.17 | `AUDIT: divergences (1)` —— 唯一偏离 = D1（已批准，收口欠设计档改行）；七处装配 ∥ 删键语义 ∥ 四端声明 ∥ 域外面 ∥ 用例强度逐项实读对上 |
| 代码评审 第 1 轮（advisor type=code） | 同上 | `VERDICT: changes-required` —— 🔴1（单测落址触 SC-1/CI）· 🟡3（发布序协调 · 档头判据句 · #13 只验替身）· 🔵2（version 未校验 · 测试全局态/顺序） |
| 修复轮 | D2 ∥ D4 ∥ D5 ∥ D3 | 逐条落地上表；🔵#6 有据不采纳 |
| 代码评审 第 2 轮（复核对齐） | 修复面 | `VERDICT: pass` —— 原 🔴#1 修复经当前文件状态验证；🟡#2 与 🔵#6 为「有据非修」关闭；新 🟡#7 = D2 的文档滞后行（报而不改、非 must-fix） |

**终态 = clean**（审计 1 轮 · 代码评审 2 轮 · 修复 1 轮；无未决 🔴）。

### 上抛项（供 §6 收口）

1. **发布序协调项（父侧台账）**：四端现在都依赖 `@thincoder/core/client-identity.mjs`，本批未动任何 `package.json`（下限仍 cli/desktop/vscode `^0.10.12` · server `^0.10.7`；核版本仍 `0.10.12`）。若端包先于核新版本发出，装到旧核的端启动即 `ERR_MODULE_NOT_FOUND`（server 为 `loadCoreChat` 抛错，既有「缺核退中性」不覆盖此形）。已发布面未核（`unverified`）。
2. **文档同步（父侧/设计席笔）**：D2 的旧址三行（`docs/core/design/PROVIDER.md:785` · `docs/batches/2026-10-26-user-agent.md:127/133`）+ 父侧已认领的 server 行改写（`docs/core/design/PROVIDER.md:746/784/806`）。
3. **盒沙盒 ∥ server 网关→上游跳**：按设计 ∥ 父裁归另批（台账 #1820），本批未接线；`gateway/forward.mjs` 的 `upstreamHeaders` 只给 `content-type` + `authorization`（本轮审计实读），该跳的标识面随另批处置。

## §6 验证与收口（父代理）

**状态行**：收口中

## 收口判词

**目标达成**：模型请求一律带 `ThinCoder/<surface>/<version>`，**不可被 `provider.headers` 覆盖**（含大小写变体），四端各注自己的端与版本，核件不猜。

**用户三条要求逐条对账**：①「加上 ThinCoder、端类型和版本号」= 字形三段（`PROVIDER.md:732-:735`）②「server 的端类型就是 server」= `server` 在枚举内 ③「**不要可覆盖**」= `withUserAgent` 先删键再写（`:750`）+ 用例 #2/#3 断言单值无 `evil`。

## 三机检读数（父侧亲跑）

| 项 | 命令 | 读数 |
|---|---|---|
| 批内单测 | `node --test docs/batches/2026-10-26-user-agent.test.mjs` | **14 pass / 0 fail** |
| 文档门 | `doc_check(mode:"gate")` 三档 | **PASS**（0 段有问题）|
| 域外零改 | `git diff --name-only` 对五面 | **空** |

端接线独立进程直跑读数：`ThinCoder/cli/0.12.79` · `ThinCoder/desktop/0.10.12` · `ThinCoder/vscode/0.10.12` · `ThinCoder/server/0.1.0`。

## 五条偏离（全有据）

| # | 内容 | 依据 |
|---|---|---|
| D1 | server 声明点从 `bin/thincoder-server.mjs` 顶部移到 `src/agent/run.mjs` 的 `loadCoreChat()` 内，bin 零改 | **父侧裁定**：server 开发树无 `@thincoder/core` 可解析，静态 import 会破坏「缺核各面退中性」 |
| D2 | 批内单测从 `test/` 改到 `docs/batches/` | **代码评审 🔴**：`test/run.mjs:36-38` fail-closed 反查，CI（`.github/workflows/test.yml:19`）跑到即红 |
| D3 | `setClientIdentity` 追加 version 校验 | 评审 🔵：漏传会出站 `ThinCoder/cli/undefined` 仍过判据 |
| D4 | desktop/VSC 档头判据句改为与实现一致 | 评审 🟡：原写「零文件系统直读」与实现二说 |
| D5 | 用例 #13 增逐字 specifier 断言 | 评审 🟡：原只验替身，包名笔误被 `includes()` 放过 |

**未采纳一条**：评审建议给用例加复位钩子——复位要写哨兵，会让用例 #4 变成「断言我刚写入的复位值」（不可失败化）；理由已写进测试档头注。

## 设计档待收正（两行，父侧认领，下批落）

| # | 位置 | 现写 | 应写 |
|---|---|---|---|
| 1 | `PROVIDER.md` §6.17 server 行 | `bin/thincoder-server.mjs` 顶部 | `src/agent/run.mjs` 的 `loadCoreChat()` 内（动载后声明——server 无静态 core 依赖）|
| 2 | `PROVIDER.md:785` 受影响文件表 | `test/2026-10-26-user-agent.test.mjs` | `docs/batches/2026-10-26-user-agent.test.mjs`（批内单测落点按仓规）|

**为什么不在本批改**：设计档已经过三轮评审定稿，改两行要重走评审；**两行都不改变机制语义**（落点与路径），且已在 §1 与 §6 记账。**下批随首次触碰改**。

## D7 结算同步清单

| 项 | 结果 |
|---|---|
| §2 ↔ 设计档对账 | 5 条偏离全部明示并记账；2 行待收正见上表 |
| 前批遗留交叉核对 | `#1816` 提示词夹具已收口核销 |
| 修正轮落地前置 | 设计评审 3 轮闭环（pass 后派实施）；代码评审 2 轮闭环（终态 clean）|
| 缓办清单复核 | 无 |
| 暂缓批复核 | 无 |
| 用户文档面同步 | 无用户可见能力变更（请求头对外部服务商可见，不对产品用户可见）|
| 文档门 | **PASS**（§4 两条锚由父侧修复：`:271` / `:272` 补全路径）|
| 台账核销 | `#1819` → 已核销；`#1820`（盒沙盒）· `#1821`（发布序）留账；`#1817`（`unsettled` 拆档）· `#1818`（地图）沿用 |

## 账外（本批未做）

| 项 | 归属 |
|---|---|
| **盒沙盒（member-shell）身份** | 域外，`#1820` |
| **发布序**：四端依赖核新件，核须先发 | `#1821` |
| **已发布面状态** | `unverified`——本批未核线上/已发版本 |
| 设计档两行收正 | 下批随首次触碰 |
| 单测档 `docs/batches/2026-10-26-user-agent.test.mjs` | 本段落盘后删除 |

## 一句记账

**这批唯一没按设计走的两处（server 落点、单测落点），都是实施时撞上真实约束才发现的**——一处是 server 无静态核依赖，一处是 CI 的 fail-closed 反查。**设计三轮评审没抓到，实施第一次跑就撞上了。**
