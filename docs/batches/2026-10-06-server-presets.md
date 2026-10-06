# 2026-10-06 · server-provider-presets
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 11:19 问「server提供了预置provider了吗」+ 11:20「我希望加」+ 11:22「点火，自动跑」——需求 = provider 预设（需求档 §2:9 ∥ 台账 #960）。
> 台账 = #960（server · 归批）。前情 = docs/batches/2026-10-06-server-gateway.md §6（已收口 2026-10-06）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-06
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent）**

**任务与来源**：用户 2026-10-06 11:19 问「server提供了预置provider了吗」→ 11:20「我希望加」→ 11:22「点火，自动跑」。需求 = server 配置支持**内建 provider 预设**——管理员按预设名加常用上游，免手写 `baseURL`/默认模型；落地需求 = `docs/server/requirements/PROJECT.md` §2:9（功能点 9）+ 变更记录；台账 `#960`。

**现状核查（父侧）**：server 零预设——全树 ∥ 设计档 grep「preset ∥ 预设」零命中；provider 面 = 手写 `config.json`（`config.example.json` 为全貌）。CLI 侧预设表 = `thincoder-core/config-presets.mjs`（24 家，**只读参考面**——运行时 import 被 KD-SV-2 禁止）。候选三路：① server 自持预设表 ∥ ② 边界例外引 core ∥ ③ 外部脚本生成（①/③ 成本小；② 动 KD-SV-2）。

**授权（父侧代点火 + 代批准 · 全链自动）**：用户 11:22「点火，自动跑」⇒ 设计评审点火权 ∥ §4 用户批准权 ∥ 修正/实施轮派发 ∥ 收口核销/提交推送——均委托父侧自动执行（沿本仓先例）。

**父侧自缚三条**：① 代签仅当三条件齐备（评审 pass〔0🔴〕∧ 修正轮已落地并逐条核验 ∧ token 已签发）；② 每次代签在 §4 写明依据；③ 需**新范围**（本批之外）或**用户口径裁决** ⇒ 停下。

**边界（本批不做）**：预设面之外的既有机制零触（鉴权 ∥ 计量 ∥ 转发 ∥ 部署）；需求档由主 agent 维护；**不重开 KD-SV-1–16**——如设计倾向「边界例外引 core」（② 路）须**停下上抛用户**。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（六问逐答落位（①自持表 ②20 家 ③预设形 ④快照+漂移件 ⑤AC-9 候补 ⑥①路选）∥ KD-SV-17 ∥ doc-check 本批新增悬空 0 ∥ 行宽 0（整档 58——#958 族在册））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 轮次定位与本批条目（覆盖）

- 轮次 = **设计轮**（initial）；需求 = `docs/server/requirements/PROJECT.md` §2:9（功能点 9「provider 预设」+ 变更记录 2026-10-06 行）；台账 = #960（task_book 指针 = 本档）；批档 §1 在册。
- 条目表（逐条覆盖）：

| # | 条目（需求回指） | 设计落点 | 状态 |
|---|---|---|---|
| 1 | 内建 provider 预设——按预设名添加常用上游（免手写 `baseURL`/默认模型） | `ops/OPS.md` §1「预设形」块（展开/缺省/覆盖/拒启） | ✅ 覆盖（设计轮） |
| 2 | 覆盖面（设计轮定） | `ops/OPS.md` §1「覆盖面」块——起步 20 家（CLI 表 OpenAI 兼容子集）+ 排除 4 家论证 | ✅ 覆盖 |
| 3 | 配置形态（设计轮定） | `ops/OPS.md` §1「预设形」块 + §9 用例 N12/N13/B9/E11 | ✅ 覆盖 |
| 4 | 零第三方运行期依赖（沿需求 §3） | 自持表落点（`presets.mjs` 零 import 面）+ KD-SV-17（②/③ 均否——见 §2.5） | ✅ 覆盖 |
| 5 | 漂移管理（自持表 ↔ CLI 表） | `ops/OPS.md` §1「漂移纪律」块（快照 + 手工同步 + 批内件断言） | ✅ 覆盖 |

- **本批边界（不做）**：预设面之外的既有机制零触（鉴权 ∥ 计量 ∥ 转发 ∥ 部署）；需求档零笔（AC-9 候补 = 上抛 R7）；产品码零写（实现 = 实施轮）；KD-SV-1–16 零改（只增 KD-SV-17）；他批零触。

### 2.2 设计档落点

- 机制全文 = `docs/server/design/ops/OPS.md` §1（配置面——预设块织入）。**非新档**：预设 = 配置面一 facet（一域一档 ∥ 单源不拆——拆档 = 话题裂面）；同档随动 = §6（预算）∥ §7（判据）∥ §8（KD-SV-17）∥ §9（用例）∥ 变更记录。
- 板级随动 = `docs/server/design/PROJECT.md`：§2.1 ops 行（三档 ⇒ 四档）∥ §4 索引（KD-SV-1–17）∥ §6 预算/随动表 ∥ §7 AC-9 行 ∥ §9 R7/R8。
- 代码落点 = `thincoder-server/src/ops/presets.mjs`（拟新增——ops 域配置面族）；消费点 = `thincoder-server/src/ops/config.mjs:73`（`validateConfig` providers 映射处注入展开）。

### 2.3 机制设计（六问逐答——对批档 §1 任务书问面）

**① 预设表形态与落点**：自持静态表 = `thincoder-server/src/ops/presets.mjs`（拟新增——设计估 ≈45 行）；每键 = `{ baseURL, model }`（`model` = 默认模型——展开为 `models` 缺省 `[model]`；不含 `desc`/`thinking` 一族）。落 ops 域缘 = 配置面族（`config.mjs` 同域消费；零运行面——不值新域）；非新档（一域一档——单源不拆）。预算 = `ops/OPS.md` §6 表在册（**≈45**（设计估——待实施回填））。

**② 覆盖面（起步 20 家）**：= 抄录自 `thincoder-core/config-presets.mjs:16-53`（24 家——只读参考面）的 **OpenAI 兼容子集**：`deepseek` ∥ `kimi` ∥ `kimi-code` ∥ `glm` ∥ `glm-code` ∥ `qwen` ∥ `qwenplan` ∥ `mimo` ∥ `mimoplan` ∥ `openai` ∥ `grok` ∥ `mistral` ∥ `volcengine` ∥ `hunyuan` ∥ `tokenhub` ∥ `huawei` ∥ `siliconflow` ∥ `openrouter` ∥ `groq` ∥ `opencode-go`（20 家）。**排除 4 家**：`claude` ∥ `gemini` ∥ `opencode-go-anthropic`（`format` 面——非 OpenAI 协议；server 只做 OpenAI 兼容面——需求 §4 不做项）∥ `minimax`（`chatPath` 面——非标准路径；本服务转发固定 `baseURL + /chat/completions`——`thincoder-server/src/gateway/forward.mjs:181`）。每键只载 `{ baseURL, model }`（客户端侧参数族不抄——服务端不消费）。名单/计数同源 = `ops/OPS.md` §1（D3 同改纪律在册）。

**③ 配置形态**：
- 预设形（最小）：`{ "preset": "deepseek", "apiKey": "env:DEEPSEEK_API_KEY" }`；覆盖形：`{ "preset": "qwen", "name": "bailian", "models": [...] }`；手写形（现行面——零变）。
- `name` **缺省 = 预设名**（显式在场者以其为准——空 ⇒ 拒；沿既有 `name` 判据）；`baseURL`/`models` **可覆盖**（条目胜——区域端点 ∥ 自选中继清单）；`apiKey` 只住条目（预设表零密钥）。
- **未知预设名 ⇒ 拒启**（fail-closed——报错列可用名）；同预设双条且均无 `name` ⇒ 重名拒（既有判据自然衔接）。
- 归一后 provider 形与手写形同形（`{name, baseURL, apiKey, models}`）——下游（派发 ∥ 清单 ∥ 转发）零改。

**④ 同步纪律**：**一次性抄录（快照日 2026-10-06）+ 手工同步**（后续批——同步笔 = 表 ∥ OPS 名单行 ∥ 漂移件三处同改）；**漂移检 = 批内件断言**（server 键集 = CLI 表 OpenAI 兼容子集（`!format && !chatPath` 派生）∥ 同键 `baseURL`/`model` 逐值相等——重跑批档件即报）。为何非活链 = KD-SV-2（运行时 import 禁）；为何非生成步 = ③ 弃因（见 ⑥）。

**⑤ 验收判据**：设计侧 = `ops/OPS.md` §7 AC-9 行（**候补**——AC 行由主 agent 落需求档；上抛 R7）；用例面 = `ops/OPS.md` §9 N12/N13/B9/E11 + 展开/覆盖/拒启单元 + 手写形回归 + 漂移件 + `config.example.json` 冒烟；批内件档 = `docs/batches/2026-10-06-server-presets.test.mjs`（拟新增——设计估 ≈160 行；复跑 = `node --test` 单档 ∥ cwd = 仓根）。

**⑥ 三路选型（① 选定）**：
- **① server 自持表（选定）**——表极小（≈45 行）∥ 零运行时耦合（不动 KD-SV-2）∥ 快照 + 漂移件兜同步。
- **② 边界例外引 core（否）**——重开 KD-SV-2（为 ≈40 行数据表动架构决策不值）；核表字段面 ≠ server 面（`format`/`chatPath`/`thinking` 一族不消费）；且沿批档 §1 边界「倾向 ② 须停下上抛」——**本设计不倾向 ②（无上抛触发）**。
- **③ 外部脚本生成（否）**——生成步 = 变相构建（违「无构建步骤」纪律）；产物仍为仓内快照（机制多而无得——漂移件对两案同等适用）。
- 全文 = `ops/OPS.md` §8 KD-SV-17 行（含被否候选与何故否）。

### 2.4 受影响文件与测试面

- 产品码（实施轮笔——本批零写）：`thincoder-server/src/ops/presets.mjs`（拟新增——设计估 ≈45）∥ `thincoder-server/src/ops/config.mjs`（154 ⇒ 预期 ≈160——展开接线）∥ `thincoder-server/config.example.json`（28 ⇒ 预期 ≈32——预设形 ∥ 手写形并存）∥ `thincoder-server/README.md`（120 ⇒ 预期 ≈128——预设用法段）。
- 设计档（本批笔）：`docs/server/design/ops/OPS.md`（§1 ∥ §6 ∥ §7 ∥ §8 ∥ §9 ∥ 变更记录）∥ `docs/server/design/PROJECT.md`（§2.1 ∥ §4 ∥ §6 ∥ §7 ∥ §9 ∥ 变更记录）。
- 测试面 = 批内件 `docs/batches/2026-10-06-server-presets.test.mjs`（拟新增）；不设 `test/` 树（沿测试纪律）；复跑 = `node --test docs/batches/2026-10-06-server-presets.test.mjs`（cwd = 仓根）。

### 2.5 验收对照（回指功能点 9 ∥ 需求 §2:9）

- AC-9 候补判据（全文 = `ops/OPS.md` §7 行）= 展开正路（默认模型 ⇒ `/v1/models` 前缀名）∥ 未知预设拒启 ∥ `name` 缺省/显式 ∥ 覆盖语义 ∥ 手写形回归 ∥ 漂移件绿；载体 = 批内件。AC 行候补 = 上抛 R7（需求档笔 = 主 agent）。

### 2.6 机检读数（D6 读回——`node scripts/doc-check.mjs` · 仓根 · 原始字节落盘避控制台编码）

- **改前基线**（留档 = `.thincoder/tmp/doccheck-before-presets.txt`）：悬空 **60** ∥ 拟新增 50 ∥ 注记豁免 329 ∥ 候选 49325 ∥ 行宽 OK（0）∥ 行数面差异 13（桌面声明面）。
- **改后**（复跑 = `.thincoder/tmp/doccheck-latest.txt`）：悬空 **58**（较改前 −2——见 §2.7 披露①）∥ 拟新增 50 ∥ 注记豁免 **331**（+2 = 两条注记）∥ 候选 49358 ∥ **行宽 0** ∥ 行数面差异 13（本批零触）∥ 声明源缺位 0。
- **本批触面**：新增悬空 **0** ∥ 新增超宽 **0**；server 域闸态行 2 ⇒ **0**；新报告面符号 2 条（`SERVER_PRESETS` ∥ `expandProviderEntry`——`OPS.md:136`，报告面不入闸）；`presets.mjs` 引用被「唯一 basename 回退」吸收（仓内 `thincoder-vscode/src/extension/presets.mjs` 同名唯一——（拟新增）标记在档、列报零）；批内件 `.test.mjs` 引用 = 双扩展段不判锚（#904 在册、非本批面）。
- 整档余存悬空 58 = #958 族 + 他批存量（本批零增——归清账批）。

### 2.7 披露与顺带项（一致性面——逐条已报）

- **① 既有悬空闭合（2 条）**：`thincoder-server/config.json` 引用（`OPS.md:40`（改动行）∥ `PROJECT.md:122`（随动表行））；**改前实测 = 闸态悬空**（本批复测；与前批读数「拟新增列报」不符——以本批复测为准，差异在册不阻塞）；处置 = 行尾加注记集标记「（机检豁免——部署机本地档）」（机制 = 引擎注记集 14 词；先例 = 端侧语汇 ∥ 用例退场登记）——**零语义**（仅标记形）；读数佐证：悬空 60 ⇒ 58 ∥ 注记豁免 329 ⇒ 331。
- **② README 行数复测校正**：实读 = **120**（原表记 119——±1 漂移；复测法 = node 直数内容行 ∥ 文末换行不计；同批复测 ops 域其余九档 = 与原表一致）⇒ ops 小计/合计/总账/全树随正 +1（`OPS.md` §6 ∥ `PROJECT.md` §6：699 ∥ 2736 ∥ 2761）。
- **③ 实施后回填**（上抛 R8）：`presets.mjs` 实读行 ∥ config/example/README 增量 ∥ 批内件行数——实施后轮收正（`PROJECT.md` §9 R8 在册）。

### 2.8 上抛项

- **R7（需求档回笔——主 agent 笔）**：AC-9 行候补（判据草案 = `ops/OPS.md` §7；本节 §2.5）。先例 = AC-7/AC-8 回笔。
- **R8（实施后设计回填轮）**：预算实读收正 + 批内件实读（沿先例）。
- 无「停下上抛」触发（② 未倾向——批档 §1 边界条款未激活）。

**§2 勘误随记（append-only 段内）**：§2.1 条目表第 4 行内「见 §2.5」应为「见 §2.3 之 ⑥」——本段 append-only，就地随记；其余段内交叉指针逐条复核无误。

**§2 勘误随记（二）**：§2.7 披露① 两条坐标系**改前**行号（`OPS.md:40` ∥ `PROJECT.md:122`）；改后现值 = `OPS.md` §1 模板行（`:43`）∥ `PROJECT.md` §6 随动表 `.gitignore` 行（`:124`）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc state（跨档滞后） | 🟡 | AC-9 已落需求档——`thincoder/docs/server/requirements/PROJECT.md:56` 有 AC-9 行且 `:109` 记「验收表补 **AC-9**」；设计侧三处仍记候补/未落：`thincoder/docs/server/design/ops/OPS.md:153`「**AC 行候补**——由主 agent 落需求档」∥ `thincoder/docs/server/design/PROJECT.md:142` 同句 ∥ `thincoder/docs/server/design/PROJECT.md:167`「功能点 9 验收行未落需求档」 | 三处按已闭合口径收正（AC-9 已落需求档——指 requirements/PROJECT.md AC-9 行）；R7 行同步销项 |
| 2 | Doc state（需求档内：变更记录 ↔ 正文） | 🟡 | `thincoder/docs/server/requirements/PROJECT.md:109` 声称「§2:9 形态定稿句（server 自持表——KD-SV-17 ∥ 起步 20 家 OpenAI 兼容子集）」，但 §2:9 正文（`thincoder/docs/server/requirements/PROJECT.md:42`）止于「预设覆盖面与配置形态 = 设计轮定；零第三方运行期依赖（沿 §3）。」——无定稿句（对照 §2:7 先例 = `:40`「**形状 = 定稿**（AC-7 已落——设计 `accounts/ACCOUNTS.md` §5 七判据）」） | §2:9 补定稿句（形如「**形态 = 定稿**（server 自持表——KD-SV-17 ∥ 起步 20 家 OpenAI 兼容子集）」），或按实收正变更记录措辞 |
| 3 | Numbers（预算链差额） | 🔵 | ops 小计链对不上：`thincoder/docs/server/design/ops/OPS.md:183` 记「小计 ≈765 ⇒ 683」（当时 README=119）∥ `thincoder/docs/server/design/ops/OPS.md:145` 记「**≈765 ⇒ 699 ⇒ 预期 ≈762**（实读复测校正 +1（README）；本批 +≈63 = presets ∥ config ∥ example ∥ README）」——`:134-144` 各行行值实计 698（不含 presets、README 计 119）⇒ 自 683 起差 15 行无归属；全树同型：`thincoder/docs/server/design/PROJECT.md:177`（2745 ∥ ops ⇒ 683）↔ `:115`/`:118`（2761 ∥ ops ⇒ 699），`:178` ∥ 批档 `:88`（「同批复测 ops 域其余九档 = 与原表一致」）仅归因 +1（README）⇒ 2745→2761 亦差 15 行无记录 | 差额 15 行来源补记（或重述小计链 683→698→699），使 2745→2761 逐项可核 |
| 4 | Doc hygiene | 🔵 | 批档 §2.7①（`2026-10-06-server-presets.md:87`）记标记「（机检豁免——部署机本地档）」（与 `design/PROJECT.md:124` 同文），而 `design/ops/OPS.md:43` 实际落文「（机检豁免——部署机自建档，仓内不入库）」——同功能标记两形并存 | 两处标记文本统一，或批档按实际两形并记 |
| 5 | Clarity | 🔵 | 漂移件的 CLI 表取数路径未落笔（import 引核表 ∥ 文本解析）；KD-SV-2 字面（`design/PROJECT.md:14` ∥ `:111`）未带「运行期」限定，「只读参考面」口径的边界只在 `design/ops/OPS.md:35` 一笔带过 | §1 漂移纪律处补一句取数口径（import ∥ 解析）与其只读、非运行期依赖性质，免实施轮歧义 |

计数：🔴 0 ∥ 🟡 2 ∥ 🔵 3 —— 无阻塞项。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**——用户 2026-10-06 11:22「点火，自动跑」全链授权。

- **三条件齐备**：① 评审 **pass**（§3 轮次 1——🔴0 ∥ 🟡2 ∥ 🔵3）；② 修正轮已落地并逐条核验（五条全收正：三处滞后标记 ⇒ 已落口径 ∥ §2:9 定稿句补 ∥ 预算链补记（差额真因 = provider 名校验轮 `config.mjs` +15）∥ 注记标记文本统一 ∥ 漂移取数口径半句——父侧直接执行 · 机械类 · 逐处对表 · 可 revert；读回逐处确认）；③ **token 已签发**（值不入档）。
- **批准范围** = 实施轮：`thincoder-server/src/ops/presets.mjs`（新 ≈45）∥ `src/ops/config.mjs`（154 ⇒ ≈160——展开注入）∥ `config.example.json`（28 ⇒ ≈32）∥ `README.md`（120 ⇒ ≈128）∥ 批内件 `docs/batches/2026-10-06-server-presets.test.mjs`（新 ≈160——N12/N13/B9/E11 + 漂移件）。
- **依据登记** = §3 轮次 1 ∥ §2（设计）∥ 需求 §2:9 / AC-9。可撤回（用户任何时点否决 ⇒ 实施止付 ∕ 回滚）。

## §5 实施记录（eng-coder）

**§5 实施记录（eng-coder）**

**状态行**：实施完成（五档落位：presets 50 ∥ config 158 ∥ example 32 ∥ README 125 ∥ 批内件 347；新档 8/8 ∥ 七件 56/56 绿；审计零偏差 ∥ 评审 1–2 轮 pass；终态 clean）

**交付摘要（实施轮 · initial）**——provider 预设（需求 `requirements/PROJECT.md` §2:9 ∥ AC-9 ∥ KD-SV-17）：

- 落位五档（实读行数——内容行 ∥ 文末换行不计）：`thincoder-server/src/ops/presets.mjs`（新 **50**）∥ `thincoder-server/src/ops/config.mjs`（154 ⇒ **158**）∥ `thincoder-server/config.example.json`（28 ⇒ **32**）∥ `thincoder-server/README.md`（120 ⇒ **125**）∥ `docs/batches/2026-10-06-server-presets.test.mjs`（新 **347**——设计估 ≈160，超估已披露，R8 回填）。
- 机制：`SERVER_PRESETS`（20 键 `{baseURL, model}`——核表 OpenAI 兼容子集抄录，快照日 2026-10-06）∥ `expandProviderEntry(entry, where)`（`name` 缺省 = 预设名 ∥ `baseURL`/`models` 缺省取预设值（`models` = `[model]`）∥ 条目自带者覆盖 ∥ 未知预设名 ⇒ 抛（报错列 20 可用名——`Object.hasOwn` 防原型链键））∥ `config.mjs:79` providers 校验前逐条展开——展开后 `{name, baseURL, apiKey, models}` 与手写形同形（下游零改）。
- 读数：`node --check` 五档全绿；新档 **8/8** 绿；七件全量回归 **56/56** 绿（cwd = `thincoder/` 仓根）；漂移件对核表实读（键集 20/20 相等 ∥ 同键 `baseURL`/`model` 逐值相等）绿；零依赖扫描绿（全树 import 仅 `node:`/相对 ∥ `dependencies` 空）。
- 批内件锚点：漂移件 `:117` ∥ 展开单元 `:138` ∥ N12 `:167` ∥ N13 `:207` ∥ B9 `:241` ∥ E11 `:259` ∥ 手写形+example 冒烟 `:286` ∥ 依赖扫描 `:329`。

**决策透明表**：

| # | 决策点 | 落法 | 理由 |
|---|---|---|---|
| 1 | 展开注入位置 | `validateConfig` providers 映射首（`config.mjs:79`——形判后、各判据前） | 设计 §2.2 所指消费点；手写形原样放行 ⇒ 六件回归零改 |
| 2 | 未知预设名报错形 | `providers[i].preset` 位点 + 全 20 名（` ∥ ` 连接）+ 「拒启」 | 沿既有 fail-closed 报错形（位点 + 缘由）；`Object.hasOwn` 防 `toString` 一族原型键 |
| 3 | 显式空/坏值 | 展开面不静默修正（原样穿过 ⇒ 校验面既有判据） | 「显式在场者胜」口径；展开面零新增语义（注记按 fix 轮收窄——见下） |
| 4 | N12 实请求段 | `baseURL` 覆盖指 mock（唯一可达 mock 路）；零覆盖展开值在同测试前半段与核表实读比对 | 真 baseURL 不可达；两形语义各自独立断言 |
| 5 | 批内件单档（347 行） | 不拆档 | 设计 §2.4 指定单档路径；拆档 = 超批准文件清单；超估走 R8 回填 |

**审计与代码评审（轮次与终态）**：

- 漂移审计（explore 只读）：四类偏差（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST）**零命中**；20 键与核表逐值全等；禁改面（gateway/accounts/metering/store ∥ 设计档 ∥ 他批档）零触。
- 代码评审轮次 1（advisor · code）：**pass**——🔴0 ∥ 🟡3 ∥ 🔵4，全非 must-fix（340 行 soft-line advisory ∥ `package.json:12` prepublishOnly 未含新档〔协调项——发布轮〕∥ 设计档三处「拟新增」滞后〔R8 在册〕∥ `models: []` 注记口径 ∥ E11 无超时兜底 ∥ 批档 §5/§6 待落 ∥ README 校验行缺 name 判据〔前轮遗留〕）。
- **fix round（取修 🔵 两条——本笔文件内；340 ⇒ 347 行）**：① `presets.mjs:35` 注记收窄（「空/坏值沿既有判据拒」⇒「展开面不静默修正；值校验归 config.mjs 既有判据」——消 `models: []` 误称，行为零改）；② 批内件 `:110` stderr 丢读 + `:270` E11 15s 兜底强杀（回归若放行未知预设 ⇒ 以读数报红，不挂死）。
- 代码评审轮次 2（advisor · code——fix 核验）：**pass**——两条 fix 逐环实证（注记委托面 = `config.mjs:80/:84/:87` ∥ 兜底出口 = `bin/thincoder-server.mjs:110` SIGTERM 优雅停机 ⇒ 非 1 退出码 ⇒ 断言红）。
- 终态：**clean**（审计零偏差 ∥ 评审 1–2 轮 pass ∥ fix 后七件 56/56 复跑绿）。
- 上抛（父侧收口轮）：R8 回填按本段实读收正（五档行数 + 批内件实读 347）；`package.json` 门禁补件 = 发布轮协调；README 校验行 name 判据 = 前轮遗留（报不改——越本批设计面）。

## §6 验证与收口（父代理）

**§6 验证与收口（主 agent）**

**来路**：用户 11:19 问「server提供了预置provider了吗」→ 11:20「我希望加」→ 11:22「点火，自动跑」（全链授权）→ 批 §1 开批 → 设计轮 `#24`（自持表 20 家 + 展开 + 漂移纪律 + KD-SV-17）→ 评审 `#25`（**pass**——🔴0 ∥ 🟡2 ∥ 🔵3）→ 五条收正（父侧直接执行 · 机械 · 可 revert）→ §4 代签 → 实施轮 `#26`（五档：presets 50 ∥ config 158 ∥ example 32 ∥ README 125 ∥ 批内件 347）→ 本段。

**验证读数（父侧亲跑）**：
- 七件 **56/56 pass**（EXIT=0——含本批新档 8/8）。
- `presets.mjs` 实读复核（20 家表 ∥ 展开语义 ∥ `Object.hasOwn` 防原型链 ∥ 未知名报全名单）。
- **漂移件**：server 键集 20/20 = CLI 表 OpenAI 兼容子集 ∥ 同键 `baseURL`/`model` 逐值相等（只读引核表——KD-SV-2 运行期面零涉）。
- `npm run prepublishOnly`（七件门禁——本批已增列）实跑 = 通过（读数在案）。
- 零依赖扫描绿。

**收口轮父侧收正（直接执行 · 机械类 · 逐处对表 · 可 revert）**：
1. **R8 回填**：设计两档行数按实读收正（OPS §6 四行 + 小计 **762** ∥ PROJECT §6 总账 **2824 行（32 档）**——本批达预期 ≈2824 ✓）+「拟新增」标记随收；
2. `package.json` prepublishOnly 增列本批件（六件 ⇒ **七件门禁**——沿 gateway 批先例，机械一行）；
3. `README.md` 启动校验行补齐（provider `name` 三判据 + 未知预设名——`#26` 上抛③ 的既有遗留）；
4. 两档变更记录 +1 行（R8 轮）。

**测试面**：① 本批批内件 = `docs/batches/2026-10-06-server-presets.test.mjs`（347 行 · 8 用例 ∥ 含漂移件——随批留存，复跑 = `node --test docs/batches/2026-10-06-server-presets.test.mjs`）；② 集成场景 = **无**（同上批口径——新仓面，进仓套件 = 发布面轮议题）。

**遗留 / 移交**：批内件 347 行 >300 软线（在册债——续增前预拆）∥ `#959`（AC-8 真机——环境条件）。

**收口**：批次档冻结；五档 + 设计/需求 + 本档 = 提交携带（下条记）。

**提交与双推**：`59b8a40f`（`feat: thincoder-server provider presets — 20-vendor table with drift check (#960)`——10 档 · +645/−29）；双推 = origin（gitee）✓ ∥ github ✓（2026-10-06）。批次档至此冻结。
