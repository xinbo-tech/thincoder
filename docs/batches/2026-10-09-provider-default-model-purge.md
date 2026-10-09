# 2026-10-09 · provider-default-model-purge
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 用户 2026-10-09 12:09 令「把 provider 默认模型这条线好好梳理一下，彻底清除掉」+ 12:29 追问「清默认模型的任务开始了吗？」——全仓清除「渠道默认模型（provider 级 default model）」概念批（盘点已完成——explore #8/#9；本批 = 设计 → 评审 → 批准 → 实施 → 收口）。
> 台账 = #1122（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-09
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-09）**

**来源与授权（用户逐字）**：12:09「我他妈的希望你把provider默认模型这条线好好梳理一下，彻底清除掉！老子已经不胜其烦了！」+ 12:29「清默认模型的任务开始了吗？」（追问 = 令其在跑）。12:07 裁定（前置）：「provider就不应该有默认模型这个概念」——**provider（渠道）不是可选单位、不存在『渠道默认模型』语义；模型选择的原子 = 模型条目本身**（已入项目记忆）。

**盘点（已完成——两路 explore 实读）**：全仓载点表两档在盘——`thincoder/.thincoder/tmp/purge-sweep-client-code.md`（客户端代码面：core/cli/desktop/vsc ~60 处 + 迁移链 + 测试断言档清单）∥ `thincoder/.thincoder/tmp/purge-sweep-docs-server.md`（文档网 + 服务端面：立法句逐条 + 同词歧义载点 A1-A15 + 服务端唯一一处）。

**要害四处（概念复活的机制）**：① 立法句住需求档最顶层（`core/requirements/PROVIDER.md` §4.1:58/:63/:64「每渠道保留恰好一个默认模型（单值）」）；② 设计档一条明文否决过清除的决策（`design/PROVIDER.md:566` D-PR12）+ 三条存在理由（`:291` M3：新装种子/槽位兜底/显示回退）——不翻转则逐字驳回；③ 自我复制口：桌面保存渠道时自动把「渠道的模型」补写成全局 `defaultModel`（`desktop/design/IPC.md:290`）；④ 同词四义（全局新会话起点/渠道级/预设/effort 渠道默认——A1-A15）。

**处置结论（父侧——用户口径下的设计约束）：**

- **渠道侧彻底退场**：`providers[].model` 字段、预设携带的 model（客户端 + 服务端）、一切「渠道的模型」显示与回落——全删；
- **替代语义**：需要模型处只认两处——全局「新会话起点」`defaultModel`（用户既有裁定，保留）或用户当场选定；都没有 ⇒ 明确「未设置」引导，**不静默回落**；
- **服务端同裁**：`SERVER_PRESETS.model` 列退场——预设只免写 baseURL；`models` 缺省改「空 + 现场拉取勾选」（#9 提示的唯一机制缺口须给判据）；
- **同词拆分**：「默认模型」今后只指全局那一个；渠道面不再出现该词；effort 的「渠道默认」加限定词；
- **误伤红线（不动）**：全局 `config.defaultModel` ∥ effort 档位「渠道默认」∥ 服务端 `models[]` 勾选集（另一概念）；「单值镜像」族（工程凭证等）无关勿触。

**面与归属**：需求档翻转（`core/requirements/PROVIDER.md` §4.1 等）= **主 agent 笔**（随设计轮交付后同拍落——保证与设计语义一致）；设计档翻转（立法决策/解析链/迁移/UI/服务端）= 本批设计轮；实施 = 分舱（≤15 件/舱）。

**父侧自缚**：评审点火权 ∥ §4 批准 = 用户（本批暂无全链授权——到步即报、只摆那一条）；射程 = 上述五面；收口含提交推送。

**授权更新（用户 2026-10-09 12:3x「自动跑完」）**：本批升级为全链授权——设计评审代点火 ∥ §4 代签（父侧自缚三条件齐备制）∥ 修正轮 ∥ 实施分舱派发 ∥ 收口 · 核销 · 提交 · 推送 · token 耗；真硬门（破坏性/不可逆 ∥ 新范围 ∥ 口径裁决）仍停并只摆那一条。

**授权更新（用户 2026-10-09 13:49「后续自动跑完」）**：本批收口段全链自动——评审外全部节点（实施 ∥ §6 收口 ∥ ECS 重建+重收敛 ∥ 提交 · 推送 ∥ 台账核销 ∥ token 耗）父侧自动执行；§3/§4 已由早前授权覆盖在册。真硬门（破坏性/不可逆 ∥ 新范围 ∥ 口径裁决）仍停并只摆那一条。

**父侧裁（#28 终报 · 2026-10-09 14:3x）**：① `session-slots.mjs:178` files-外触及 = **认**（修③链必需——第二档入参无人供值则链死；改动面 = 1 行入参 + 1 行 docstring + 批内件入参锁；披露如实）。② 10-06 漂移件随正**非纯值改**——E11「排除面」腿原判据 `includes(key)` 遇 `gemini` ⊂ `gemini-openai` 前缀必红 ⇒ tmp 稿改**整名判**（+1 注释行）；§2「结构不变」句**只对另四件**成立，本件以本裁为准。③ 设计引文漂移 5 处（`SESSION.md:875/:876/:885` ∥ `IPC.md:221` ∥ `UI.md:159`）→ 修正轮（eng-designer #34）在办。④ advisor 代码评审（#28 预算未跑）→ 父侧代跑（在办）。⑤ `structure-split-2` 零动 + 读数归 #1130。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-09——评审轮 1 修正已落（发现 #1–#4 ∥ #6 ∥ #7 ∥ §2 更正；#5 = 父侧需求档笔）；实施期收正（fix 轮）已落（收口前——逐号随正 ∥ 登记；零新语义））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**批次任务与设计（provider-default-model-purge · 设计轮 · eng-designer · 2026-10-09 · 台账 #1122）**

**批令（承 §1）**：全仓清除「渠道默认模型」（渠道条目单值 `model`）概念。**退场后模型身份唯二 = 顶层 `defaultModel`（复合串 `provider:model`）∥ 会话槽 `activeProvider`/`activeModel`**；渠道条目 = `{ name, baseURL, key?, format?, proxy? }`，预设表逐键 `{ baseURL }`。服务端码面已由 §1 裁入本批（第 5 舱）。本设计轮笔域 = 设计档 + 本节；实施 = 后续分舱（eng-coder）。
**设计面落位（本轮已落盘）**：`docs/core/design/PROVIDER.md`（渠道模型立法区 22 处翻转 + 裸渠名拒语义）· `docs/core/design/SESSION.md`（恢复面 5 处随正）· `MODEL-SPECS.md`（P-1..P-3 病例 / 探针入参 / §12 预设面）· `docs/desktop/design/IPC.md`（§2 通道表 + 注 8①，写口三→两）· `SETTINGS.md`（§2.2 渠道行/表单/字段序 + §2.14）· `COMPOSER.md`（KD-17 回落句 + fallback 两字面）· `SHELL.md` · `docs/vsc/design/WEBVIEW.md` §4.8 · `docs/server/design/ops/OPS.md`（预设形/AC-9/KD-SV-17）· `docs/server/design/gateway/API.md`（预设端点/AC-11）· `docs/core/design/DOC-CODE-RECONCILE.md`（A4 行）。

### 2.1 本批覆盖条目（设计面回指）

| 号 | 条目 | 设计落点 |
|---|---|---|
| A1 | **核归一改「一律删」**：`thincoder-core/config.mjs:341-344` 迁移归一由保形改为删除渠道 `model`；`config-io.mjs:142-154` 随正；`config-presets.mjs` `PROVIDER_PRESETS` 逐键去 `model`、`presetToEntry` 不产 `model` | 机器核：载入含 `model` 的档 ⇒ 条目无 `model` 键；预置逐条 `"model" in p === false`（全 24 条） |
| A2 | **CLI**：裸渠名（subagent 克隆等）＝**拒**——可读错误「渠道无默认模型，请用 `provider:model`」；advisor 无 `cfg.model` ⇒ 父解析模型单档；两无 ⇒ `assertProviderModel` fail-fast 不变 | 错误文案 + fail-fast 用例 |
| A3 | **桌面写口两处**：`provider:save` 的 `model`/`active` 参与缺省补写支全退；`backfillDefaultModel` 退场；`defaultModel` 写入面 = 视图出口 ∥ 会话选定写回（IPC.md §2 注 8①） | grep：`defaultModel` 写点 = 2；`backfillDefaultModel` 零引用 |
| A4 | **桌面 UI**：自定形表单 `model` 输入件 ∥ `datalist` 退场；「拉取模型」钮收为渠道校验；渠道行 sub 段显 `baseURL`；`mount-settings-reads.mjs:33-40` 激活渠道 ∥ 当前模型两读数改由 `defaultModel` 复合串直读 | 表单零 `name="model"` 控件；sub 段零 model；两读数直读复合串 |
| A5 | **VSC 横幅两字面（新裁）**：fallback 按载荷 `model` 在场分——在场 = 现句「正在使用可用渠道」；缺 = 「渠道已就绪、模型未定」（负控：`model` 在场 ⇒ 旧字面） | WEBVIEW.md §4.8 逐字；两字面坐实 |
| A6 | **服务端**：`SERVER_PRESETS.model` 退场（每键只 `{ baseURL }`）；`expandProviderEntry`（`thincoder-server/src/ops/presets.mjs:48`）models 缺省 = 空 + 现场拉取勾选；`GET /api/admin/providers/presets` 响应零 `model` 键 | 预设形条目 `models` 空；选中后 `/v1/models` 含 `deepseek/<选中模型>` |
| A7 | **文档面清零**：上列各档概念字面随正（历史语料 = 变更记录/迁移期引文不追改） | `node scripts/doc-check.mjs` EXIT 0 |

### 2.2 明确不在本批

- 需求档（`docs/core/requirements/PROVIDER.md` 八处 ∥ desktop ∥ server requirements 各两处）= **主 agent 笔**——本批只合规核 + 回指，待同拍收口。
- `API-CONTRACT.md` 导出表 = 生成区，不手改（随实现再生成）。
- VSC `models[]` 勾选集概念（面板多选清单）＝非本清除范围，保留。
- 探针脚本**扩档执行**（需密钥实操作）归父侧/用户；本轮只改入参口径。
- `thincoder-core/config-migrate.mjs` 既有迁移链（`activeProvider/activeModel → defaultModel`）不动。

### 2.3 实施分舱

| 舱 | 范围 | 备注 |
|---|---|---|
| 舱1 核 | `config.mjs` ∥ `config-io.mjs` ∥ `config-presets.mjs` | A1 |
| 舱2 CLI | `src/tui/cmd-config.mjs` ∥ `model-picker.mjs` ∥ 探针入参 | A2 |
| 舱3 桌面 | `src/main/providers.mjs` ∥ `renderer/views/settings-controls.mjs` ∥ `mount-settings-reads.mjs` ∥ `settings-sections-providers.mjs` 等 | A3 ∥ A4 |
| 舱4 VSC | `src/extension/settings.mjs` ∥ `settings-panel-write.mjs` ∥ `webview/*` | A5 |
| 舱5 服务端 | `src/ops/presets.mjs` ∥ 预设端点/控制台 | A6（§1 补裁入批） |
| 舱6 文档/测试 | 设计档（本轮已落）∥ 批内测试随正 ∥ 需求档（主 agent） | A7 |

### 2.4 受影响文件（现状行数 = 2026-10-09 设计轮实读 `split("\n").length-1`；预期增删 = 设计估计，实施回填 §5）

| 文件 | 现状 | 预期增删 | 说明 |
|---|---|---|---|
| `thincoder-core/config.mjs` | 496 | ±0~+2 | `:341-344` 归一改一律删 |
| `thincoder-core/config-io.mjs` | 283 | ±0~+3 | `:142-154` 随正 |
| `thincoder-core/config-presets.mjs` | 62 | −~24 | 24 键去 `model`；`presetToEntry` 减字段 |
| `thincoder-cli/src/tui/cmd-config.mjs` | 486 | 小 | 渠面读数随正 |
| `thincoder-cli/src/tui/model-picker.mjs` | 325 | 小 | 渠表读数随正 |
| `thincoder-cli/test/smoke-qwen-thinking.mjs` | 89 | ± | 入参改显式 `provider:model` |
| `thincoder-vscode/src/extension/settings.mjs` | 405 | 小 | 快照/态派生随正 |
| `thincoder-vscode/src/extension/settings-panel-write.mjs` | 219 | 小 | 写面随正 |
| `thincoder-desktop/src/main/providers.mjs` | 324 | −~15 | 补写支退场；写口两处 |
| `thincoder-desktop/src/main/settings.mjs` | 300 | ±0 | 行号随删改回填（`:319` 起口径不变） |
| `thincoder-desktop/renderer/mount-settings-reads.mjs` | 206 | 小 | `:33-40` 复合串直读 |
| `thincoder-desktop/renderer/mount-settings-exits.mjs` | 307 | ± | — |
| `thincoder-desktop/renderer/views/settings-controls.mjs` | 215 | −~10 | `model` 输入件退场 |
| `thincoder-desktop/renderer/views/settings-sections-providers.mjs` | 211 | 小 | sub 段 baseURL |
| `thincoder-desktop/renderer/views/settings.mjs` | 439 | 小 | 选项闭集随正 |
| `thincoder-desktop/renderer/views/onboarding.mjs` | 161 | 小 | 向导步随正 |
| `thincoder-server/src/ops/presets.mjs` | 50 | −~24 | 键面去 `model`（每键只 `{ baseURL }`） |
| `docs/batches/2026-10-04-opencode-go-preset.test.mjs` | 174 | 随正 | 预设断言改「无 `model` 键」 |
| `docs/batches/2026-10-06-server-presets.test.mjs` | 347 | 随正 | 预设形展开断言改「models 空 + 勾选」 |

**>300 线披露**：`config.mjs` 496 ∥ `cmd-config.mjs` 486 ∥ `views/settings.mjs` 439 ∥ `settings.mjs`(VSC) 405 ∥ `model-picker.mjs` 325 ∥ `providers.mjs` 324 ∥ `mount-settings-exits.mjs` 307——本批均为小面改动；越线登记 ∥ 拆分计划随实施轮按既有登记口径处置（本批不新增越线档）。

### 2.5 测试随正清单

1. `docs/batches/2026-10-04-opencode-go-preset.test.mjs`（174 行）——`PROVIDER_PRESETS` 断言改「逐条无 `model` 键」（对齐 MODEL-SPECS P-2/P-3）。
2. `docs/batches/2026-10-06-server-presets.test.mjs`（347 行）——预设形展开断言改「`models` 缺省 = 空 + 现场拉取勾选」。
3. 本批单测件（各舱内件）随实施轮建；批内件归档入 `docs/batches/`，不进 `test/` 树。

**披露**：`thincoder-vscode/src/agent-tools/subagent-async.mjs:145-174` 见 2.6 发现 1——**路径未复核**（本读面 ENOENT），实施轮定位后随舱4处置或单独立项。

### 2.6 设计轮发现（上抛 → 见报告中）

1. **裸渠名（无 `model`）subagent 克隆拒面**：拒语义已立（A2）；`thincoder-vscode/src/agent-tools/subagent-async.mjs:145-174` 用 `split(":")` 截断多冒号模型名（与「首冒号分割」口径相悖）——**pre-existing，未复核**，交父侧裁定归属。
2. **P-1 计数实读 24**（原档 21）：24 家预置全携 `model`——本批退场面即 24 键；计数已在 MODEL-SPECS 收正。
3. **需求档八处待主 agent 同拍**（见 2.2 首条）——本批设计面已先行随正，需求档与设计档暂不同源，**回指链待闭合**。

### 2.7 验收回指（与 2.1 同号）

- A1..A7 机器核方式见 2.1 表末列；闸 = `node scripts/doc-check.mjs` EXIT 0（本轮实跑读数见报告）+ 实施舱各自批内件。
- 文件行数闸：`thincoder-core/test/core-hygiene.test.mjs` 口径不变（本批零新增越线档）。

### 修复轮落位（评审轮 1 · 发现 #1–#4 ∥ #6 ∥ #7 ∥ §2 更正——2026-10-09 · 执行人 = eng-designer）

**本补记 = 终形（现文以本补记为准；被取代项见末尾）。** 父侧裁定 = 全采纳；#5（需求档 R15 退场登记）= 主 agent 并行笔（本补记零涉）；#8 = 父侧判 Not an issue（零动作）。

**§2 更正（父侧裁定）**：

1. **2.6 发现 1 两行（`:103` ∥ `:107`）路径收正**——`thincoder-vscode/src/agent-tools/subagent-async.mjs` ⇒ **`thincoder-core/agent-tools/subagent-async.mjs`**（原记路径无此文件——ENOENT；实文件在核侧：实读 `resolveChildProvider` `:145-174`，`split(":")` 在 `:163`）；**归舱 = 舱1（核）**。
2. **2.3 舱1 范围行补列**——`agent-tools/subagent-async.mjs`（随 §2.6 发现 1 归舱；以本补记为准）。

**逐号落点（号 → 改动；坐标 = as-of 本补记）**：

1. **#1（OPS 服务端预设面残留）** → `docs/server/design/ops/OPS.md`：`:213` 表形改 `{ baseURL }` ∥ `:262` N12 期望改「`models` 空清单 ⇒ 经「模型发现」勾选后 `/v1/models` 含 `deepseek/<选中模型>`」∥ 同扫描收正 `:47`（`{ baseURL, model }` ⇒ `{ baseURL }`）∥ `:48`（漂移句去 `/ model` 逐值）；§6 ∥ §9 涉 `model` 行复扫零余。
2. **#2（添加流程字段面）** → `docs/core/design/PROVIDER.md`：`:358` 补渠道行回退半句（`baseURL`——回指 §6.16）∥ `:359`「Custom 手输 name / baseURL + format」（去 `model`）。
3. **#3（MODEL-SPECS 三处残留）** → `docs/core/design/MODEL-SPECS.md`：`:536` ∥ `:538` ∥ `:992` 改现行形 + 退场限定（历史值改指批次档）。
4. **#4（变更记录 ×10）** → 十档各 +1 行：`PROVIDER.md` ∥ `SESSION.md` ∥ `DOC-CODE-RECONCILE.md` ∥ `IPC.md` ∥ `desktop/SETTINGS.md` ∥ `desktop/COMPOSER.md` ∥ `SHELL.md`（零改登记）∥ `WEBVIEW.md` ∥ `OPS.md` ∥ `API.md`（`MODEL-SPECS.md` 已有 10-09 行——不动）。
5. **#6（注记名统一「2026-10-09 清除批」）** → 逐处：`OPS.md`（3）∥ `PROVIDER.md`（7）∥ `MODEL-SPECS.md`（7）∥ `IPC.md`（4）∥ `SETTINGS.md`（7）∥ `COMPOSER.md`（1）∥ `API.md`（2）；`SESSION.md:212` 补前缀；`DOC-CODE-RECONCILE.md:241` 补批名；`MODEL-SPECS.md:1885` 全名形保留；他批字样（#1111 ∥ #1113 ∥ #1120 等）原样。
6. **#7（WEBVIEW 零改登记）** → `docs/vsc/design/WEBVIEW.md`：§4.8 补批名登记 bullet（两字面与清除后口径零冲突 ⇒ 零改在册）+ 变更记录行（并入 #4）。

**机检**：`node scripts/doc-check.mjs` ⇒ **exit 0**（悬空 0 ∥ 行宽 0——2026-10-09 复跑）。
**被取代项清单（防重开）**：2.6 发现 1 两行（`:103` ∥ `:107`）之「路径未复核（ENOENT）／交父侧裁定归属／随舱4处置」句 ⇒ 路径收正 + 归舱1；2.3 舱1 范围行（缺该档名）⇒ 以本补记为准。
**零触面（显式）**：需求档（#5——主 agent 笔）· 源码 ∕ 测试档 · §1 ∥ §3 段 · 他批记录行（OPS `:312`–`:315` 等）· `MODEL-SPECS.md:1885`。**零新语义**（评审发现直接导出项）。

**观察 #9 裁定落地（随正登记——2026-10-09 · 执行人 = eng-designer）**：`docs/server/design/webui/WEBUI.md` 预设面落点 = `:226` 补句（§2.4④ 添加弹窗预设径——「预设形 `models` 缺省 = **空**（2026-10-09 清除批——服务端预设表零 `model` 键）：模型清单表 = 空表；勾选走「模型发现」（详情弹窗「刷新候选」——§2.4④）」）∥ `:651` 变更记录 +1 行（处置登记——随正式）。**零新语义**（A6 处置登记——数据源失落随正）；`:463` / `:533` 引文现盘零命中（近句 = 表形句 ∥ AC-20 行——A6 零失真）⇒ 该二处零改。机检 = `node scripts/doc-check.mjs` EXIT 0（悬空 0 ∥ 行宽 0）。

**实施期发现收正（fix 轮——实施期上抛 · 父侧裁定；2026-10-09 · 执行人 = eng-designer）**：`GET /api/admin/providers/presets` 端点半形状**保留 `models`（空清单）**——批令「响应零 `model` 键」= 单数键面；`models[]` = 本批红线不触概念。依据：实装 map 恒携 `models`（`provider-admin.mjs:275-283`——线形向后兼容）∥ 控制台 `presetModelsTable`（`public/views-providers-modals.mjs:78-83`）直展 `preset.models`（缺失即抛）——`API.md:54` 样本缺字段 = 漏笔。落点 = `docs/server/design/gateway/API.md`：`:54` 样本补 `models: []` + 两键区分半句 ∥ `:135` 措辞消歧（`model` ∥ `models` 两键区分）∥ 变更记录 +1 行。**零新语义**（形状收正）。**零触面**：源码 ∕ 测试档 ∥ 他档 ∥ `API.md:76`（现文口径正确）∥ `provider-admin.mjs` / 控制台（已终形零改）。**机检**：`node scripts/doc-check.mjs` ⇒ EXIT 0（悬空 0 ∥ 行宽 0 ∥ 行数面差异 0——2026-10-09 复跑）。

**收口前设计侧收正（fix 轮——实施期各舱上抛 · 父侧裁定；2026-10-09 · 执行人 = eng-designer）**

**逐号落点（号 → 改动 file:line；坐标 = as-of 本补记；零新语义——全为随正 ∥ 登记 ∥ 裁定落地）**：

1. `docs/core/design/PROVIDER.md:291`——M3 裸渠名拒文案对齐实装逐字：「渠道无默认模型，请用 `provider:model`」（去「可派生」；实装 = `thincoder-core/agent-tools/subagent-async.mjs:177`）。
2. 同档 `:300`——M10 CLI 对位链删 `keep.model` 回落（`sessionModel ?? dm.model`——「绝不静默回落」同口径）。
3. `docs/desktop/design/SETTINGS.md:31 ∥ :207 ∥ :208`——向导步 1 `activeDefault` 复选随 2026-10-09 清除批退场（`active` 参退场 ⇒ 死控——`provider:save` 无 active 写路；等价路径 = 模型段「采用」）；三处同拍（KD-75② ∥ §2.16 项 5 尾 ∥ 条件渲染句）。实装 = 本批 fix 轮。
4. `docs/server/design/ops/OPS.md:42 ∥ :213 ∥ :249`——`presets.mjs` 实读 50 ⇒ 51（现盘实读）；`:103` §5.1 门禁件数 28 ⇒ 29 ⇒ **29 ⇒ 30 件**（组成式「后续各批 16 ⇒ 17 件」随动——D3 一致）。
5. `docs/server/design/PROJECT.md:173/:174/:180/:344`——链计数 28 ⇒ 29 ⇒ **29 ⇒ 30**；§6 添本批预算行（:175 区）+ 随动表行（:219）+ 变更记录一行。
6. `docs/core/design/PROVIDER.md:322`——§6.18 视觉链判定源收正：判定源（渠道单值模型）随 2026-10-09 清除批退场 ⇒ 恒 `null` ⇒ 走 F-IDG-2 可读报错径（不静默丢图）；判定源重定在途（台账 #1125）；指针改核 `thincoder-core/vision-reader.mjs`（VSC 薄壳 = re-export 面）。
7. `docs/desktop/design/IPC.md:289`——`provider:list` 行 += 顶层 `defaultModel`（`loadConfig` 单源直取——渲染面「激活渠道 ∥ 当前模型」两读数载荷载体）+ 预设键列三键（`desc` 随 S7）；`:245` 注 3 写点行号随现盘（`:228 ∥ :296 ∥ providers.mjs:159`）；`:320-321` 注 8① 行号随现盘（`:84` ∥ `:163-175`（写 `:166`）∥ `:81 ∥ :98` ∥ `setPrefs` `:235-261`）。
8. 本段（实施期扩面登记 + §2.4 表补行 + 状态行收正）。
9. `docs/vsc/design/SETTINGS.md`——model 控件面收正：`#pa-model` ∥ model 必填门 ∥ `settings.modelRequired` ∥ `settings.noDefaultModel` 随 VSC 自定形表单 model 退场逐处翻转（点位 = §1 卡行 ∥ §2.16 ①②③④（#1031/#1033）∥ U-S14/U-S15/U-S16）+ 变更记录一行。
10. `docs/vsc/design/WEBVIEW.md:202-203`——fallback 第二字面键名 `banner.defaultModelFallbackNoModel` 补登（`data-banner-key` 取值闭集闭合——#22 实装键名）+ 登记条 ∥ 变更记录随。
11. `docs/core/design/PROVIDER.md:359`——Add / Remove / Key 流指针收正（VSC `addProviderFlow` 随 #1054 净删 ⇒ 改指核单源 `thincoder-core/provider-flows.mjs:137`；VSC 薄壳 = Remove ∥ Key 两流程 + 探针转口）。
12. `docs/cli/design/TUI-COMMANDS.md:73`——§4 示例行渠级模型段退场（L1 渠行显示回退 = `baseURL` 同全域口径；`ctx` 标 = 默认 spec ⇒ 125K）+ 变更记录随。

**实施期扩面登记（各舱 §5 触档为准；实读 = 2026-10-09）**：

- 舱1 核（无 §5——随行登记）：`config-io.mjs` custom 分支 ∥ core `provider-flows.mjs`（#19 拒文案逐字）∥ `config-migrate.mjs` ②段（M7）∥ `vision-reader.mjs` 清读（`findVisionChannel` 恒 `null`）∥ `model-ref.mjs`（`resolveChannelModel` ②档死读退场）。实读：`config.mjs` 495 ∥ `config-io.mjs` 282 ∥ `config-presets.mjs` 62 ∥ `config-migrate.mjs` 162 ∥ `provider-flows.mjs` 247 ∥ `vision-reader.mjs` 69 ∥ `model-ref.mjs` 162 ∥ `agent-tools/subagent-async.mjs` 482。
- 舱2 CLI 披露五件（超 §2.4 设计轮表列）：`provider-admin.mjs` 240 ∥ `wizard.mjs` 245 ∥ `cmd-advisor.mjs` 291 ∥ `cmd-submodel.mjs` 154（仅注释随正）∥ `setup-wizard.mjs` 116。
- 舱3 桌面四件（#21 披露）：`mount-settings-segments-providers.mjs` 161 ∥ `composer-sync.mjs` 328 ∥ `i18n-views.mjs` 410 ∥ `i18n.mjs` 429。
- 舱4 VSC 实触件：`settings-provider-dialog.js` 266 ∥ `settings-providers.js` 193 ∥ `onboarding.js` 82 ∥ 顺扫四件（`presets.mjs` 192 ∥ `panel-turn-stages.mjs` 246 ∥ `turn-model.mjs` 27 ∥ `vision-channel.mjs` 11——注释随正）。
- `provider:list` 回执键：顶层 `defaultModel`（`thincoder-desktop/src/main/providers.mjs:88`）；VSC 表单链 = `provider-flows` 薄壳（`addProviderFlow` 包装 #1054 净删）+ `settings-providers.js` 副行 = `baseURL`；i18n 两表两死键净删（`settings.modelRequired` ∥ `settings.noDefaultModel`——全域零引用后删；表行数 295 不减——值级改写为主）。

**§2.4 表补行（实施期扩面——现状 = 2026-10-09 实读；增删按 §5 记录）**：

| 文件 | 现状（实读） | 增删 | 说明 |
|---|---|---|---|
| `thincoder-cli/src/tui/provider-admin.mjs` | 240 | 小（未列预算） | 渠级读数退场（预设行去模型段 ∥ custom 分支删 model 问句 ∥ 渠标签 = baseURL） |
| `thincoder-cli/src/tui/wizard.mjs` | 245 | 小（未列预算） | model 步 ∥ 摘要随退场 |
| `thincoder-cli/src/tui/cmd-advisor.mjs` | 291 | 小（未列预算） | 渠级死读修（advisor 渠条目 model 腿） |
| `thincoder-cli/src/tui/cmd-submodel.mjs` | 154 | ±0 | 仅注释随正 |
| `thincoder-cli/src/cli/setup-wizard.mjs` | 116 | 小（未列预算） | model 问句改顶层显式选定 |
| `thincoder-vscode/webview/settings-provider-dialog.js` | 266 | 小（未列预算） | `#pa-model` 件 ∥ 必填门退场；守卫 = baseURL |
| `thincoder-vscode/webview/settings-providers.js` | 193 | 小（未列预算） | 渠道行副行 = `baseURL` + 不可用标 |
| `thincoder-vscode/webview/onboarding.js` | 82 | ±0 | 注释随正 |
| `thincoder-vscode/src/extension/presets.mjs` | 192 | ±0 | 注释随正（核转口链） |
| `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 246 | ±0 | 注释随正 |
| `thincoder-vscode/src/extension/turn-model.mjs` | 27 | ±0 | 注释随正 |
| `thincoder-vscode/src/extension/vision-channel.mjs` | 11 | ±0 | 注释随正（沿革归因） |
| `thincoder-desktop/renderer/mount-settings-segments-providers.mjs` | 161 | 小（未列预算） | 草稿去 model 键 |
| `thincoder-desktop/renderer/composer-sync.mjs` | 328 | 小（未列预算） | fallback 两字面分 |
| `thincoder-desktop/renderer/i18n-views.mjs` | 410 | 键数链续 | VIEWS 149 键 |
| `thincoder-desktop/renderer/i18n.mjs` | 429 | 键数链续 | HOST 323 键 |

**注**：上表「实读」与各舱 §5 行数若有微差（±1——如 `i18n-views.mjs` §5 记 411 ∥ 现读 410），以现盘实读为准（读数时点差；无实转面变动）。

**实现轮引文对齐收正（fix 轮——承 §1「父侧裁（#28 终报）」③；2026-10-09 · 执行人 = eng-designer）**

`sessionReading` 三参化（#28 fix 轮——`session-lifecycle.mjs:389` 签名 `{ providers, fallback, defaultModel }`；解析链 = `slotModel ?? resolveChannelModel(entry, defaultModel ?? null)`）后，设计档 5 处两参引文逐处随正。**零新语义**（仅引文对齐——表述与实况取一真源）。

**逐号落点（号 → 改动 file:line；坐标 = as-of 本补记）**：

1. `docs/core/design/SESSION.md:875`——判据句 1 引文 `sessionReading(data, { providers, fallback })` ⇒ `sessionReading(data, { providers, fallback, defaultModel })`。
2. 同档 `:876`——零副作用入参列 ⇒ + `defaultModel`（与核档 docstring `thincoder-core/session-lifecycle.mjs:387` 逐字同式）。
3. 同档 `:885`——判据句 3 端壳装配 `loadConfig()` → `providersList` / `provider` 传入 ⇒ + `defaultModel` 传入（实况 = `thincoder-desktop/src/main/session-slots.mjs:178`）。
4. `docs/desktop/design/IPC.md:221`——`usage` 读数引文同 1 随正。
5. `docs/desktop/design/UI.md:159`——核侧单源引文同 1 随正。

**读回核验**：旧形 `{ providers, fallback }` 活面零命中（余命中 = 记录面：`docs/batches/2026-09-28-desktop-residuals.md:63` 等批档留档——政策内不追改）；新形 3 处签名点 grep 命中 ∥ 另 2 处（`:876` / `:885`）编辑回读在案。

**机检**：`cd d:\teamcode\thincoder; node scripts/doc-check.mjs` ⇒ **EXIT 0**（悬空 0 ∥ 行宽 0；行数面报告 1 条 = `docs/desktop/design/SESSIONS.md:122` `session-slots.mjs` 表 270 ∥ 实读 271——报告态、非本轮所致，留父侧回填清单）。**零触面**：源码 ∥ 测试档 ∥ 他档 ∥ 变更记录行（射程 = 仅 5 处，未加——如需登记由父侧裁）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审范围**：声明面 15 档全读（核设计 4：PROVIDER / SESSION / MODEL-SPECS / DOC-CODE-RECONCILE；桌面设计 3：IPC / SETTINGS / COMPOSER；VSC 设计 1：WEBVIEW；服务端设计 2：ops/OPS · gateway/API；需求 4：core/PROVIDER · core/PROJECT · desktop/COMPOSER · server/PROJECT）。全为 `.md`（判据 8 豁免面）。发现计数 = 🔴 3 ∥ 🟡 2 ∥ 🔵 3。

| # | 类别 | 级 | 问题 | 改法 |
|---|------|----|------|------|
| 1 | Document ownership | 🔴 | 服务端预设面**同机制两处相反**（残留未随本批收正）：`thincoder/docs/server/design/ops/OPS.md:213` 仍写预设表 = 「预设表（`SERVER_PRESETS`——起步 20 家 `{ baseURL, model }`）」、`:262`（用例 N12）仍期望「`models`=[预设默认模型]；`/v1/models` 含 `deepseek/deepseek-flash`」；与本批已收正句 `OPS.md:41`（「**2026-10-09 批：预设表零 `model` 键——`models` 无缺省；条目未自备 `models` ⇒ 空清单，经「模型发现」面勾选**」）∥ `OPS.md:238`（「`models`= 空（预设表零 `model` 键——2026-10-09 批）」）∥ `docs/server/design/gateway/API.md:54`（「**2026-10-09 批：零 `model` 键**」）∥ `API.md:135`（「响应零 `apiKey` / 零 `model` 字段（2026-10-09 批）」）互斥——实现轮照 N12 直写用例必红 ∕ 照 `{ baseURL, model }` 把键加回 | §6 `presets.mjs` 行表形改 `{ baseURL }`；§9 N12 期望改「`models` 空清单 ⇒ 经「模型发现」勾选后 `/v1/models` 含 `deepseek/<选中模型>`」；§6 ∥ §9 全域再扫一次涉 `model` 行同拍 |
| 2 | Document ownership | 🔴 | 添加流程字段面**同机制两处相反**（跨档）：`docs/core/design/PROVIDER.md:359` 仍写「QuickPick preset 过滤已添加或 Custom 手输 name / baseURL / model + format」；与同档已收正句 `PROVIDER.md:296` ∥ `PROVIDER.md:301`（「**添加表单不设 model 输入件**（渠道条目不携模型——单值模型退场；「拉取模型」钮收为渠道校验）」）∥ `docs/core/requirements/PROJECT.md:31`（C4「手动输入 name / baseURL（**不携模型**——2026-10-09 清除批）」）互斥。同族：`PROVIDER.md:358`「名 + 当前模型」未携回退句（`PROVIDER.md:301`「**渠道行显示回退 = `baseURL`**（单值模型退场——原「渠道无默认模型」词族删除）」） | `:359` 字段面收正为「Custom 手输 name / baseURL + format」；`:358` 补回退半句（或改指 §6.16 回退句） |
| 3 | Document ownership | 🔴 | 同档内同机制残留（用例面已收正、决策/形状句未随）：`docs/core/design/MODEL-SPECS.md:536`（「`model: "hy3"`；**不带** thinking / reasoningEffort / maxTokens 字段」）∥ `:538`（「其 `model` 改指 `doubao-seed-2-0-code-preview-260215`」）∥ `:992`（「`mimo` / `mimoplan` 预设改指 `mimo-v2.6-pro`」）vs 同档已收正 `:662`（「**无 `model` 键**（2026-10-09 批：渠道单值模型退场）」）∥ `:663`（「全表 24 条均 `false`（2026-10-09 批：渠道单值模型退场——逐条无 `model` 键断言）」）∥ `:975`（「`mimo` / `mimoplan` **零 `model` 键**（渠道单值模型退场）」） | 三处就地按已收正口径改写（历史值不留规范面——沿本档自例「旧值叙述改指批次档」）：改述为现行形 ∕ 加「（2026-10-09 批退场）」限定 |
| 4 | Methodology compliance（记录面） | 🟡 | 变更记录缺口：11+ 档正文带本批标记而档内变更记录零本批条目——`docs/core/requirements/PROVIDER.md`（正文 `:58` ∥ `:63` ∥ `:64` ∥ `:122`；变更记录末条 `:163` = 2026-10-04）· `docs/server/design/ops/OPS.md`（正文 `:41` ∥ `:238` ∥ `:249`；`:312`–`:315` 的 2026-10-09 条目全属他批）· `docs/desktop/design/IPC.md`（正文 `:290` ∥ `:295` ∥ `:319` ∥ `:321`；档末条目 `:556` = 2026-10-08）· `docs/core/design/PROVIDER.md`（正文 `:189` ∥ `:294` ∥ `:348` ∥ `:428` ∥ `:567`；档末条目 `:691`–`:695` = 2026-10-08）· `docs/core/design/SESSION.md`（正文 `:212`；全档 `10-09` 零命中）· `DOC-CODE-RECONCILE.md:241` · `desktop/design/SETTINGS.md`（`:47` ∥ `:48` ∥ `:167` ∥ `:172` ∥ `:203` ∥ `:206` ∥ `:207`）· `desktop/design/COMPOSER.md:123` · `server/design/gateway/API.md`（`:54` ∥ `:135`）· `core/requirements/PROJECT.md`（`:31`–`:33`）· `server/requirements/PROJECT.md`（`:42` ∥ `:145`）· `desktop/requirements/COMPOSER.md:12`；唯一在册条目 = `MODEL-SPECS.md:1885` | 逐档补一行本批记录（沿 `MODEL-SPECS.md:1885` 同式：批名 ∥ 落点逐处 ∥ 「零新语义」） |
| 5 | Requirements coverage（需求面） | 🟡 | 需求条目静默消失：`docs/core/requirements/PROVIDER.md:84` 为 R14 行、`:85` 为「| R16 | 文档连带（随件） |」——原 R15 行（判据 = 预设 `deepseek.model` 比较）随清除对象一并删除，但档内零说明、变更记录零条目，读成断号笔误（且该档自述「不新增需求 · 条文三类并逐条标来源」） | 补退场登记（R15 行复位 + 标「判据对象随渠道单值模型退场」或就地一行说明），并同拍变更记录一行 |
| 6 | Doc hygiene | 🔵 | 本批注记名不统一，跨档检索不齐：「2026-10-09 批」（`IPC.md:290` ∥ `PROVIDER.md:294`）∥「2026-10-09 清除批」（`core/requirements/PROVIDER.md:64` ∥ `core/requirements/PROJECT.md:31` ∥ `server/requirements/PROJECT.md:42`）∥「2026-10-09 批裁」（`desktop/design/COMPOSER.md:123`）∥ 无日期形「渠道单值模型退场」（`SESSION.md:212`） | 统一注记名（批名 + 日期），使批名 ∥ `2026-10-09` 任一键一次扫全 |
| 7 | Scope / 登记面 | 🔵 | `docs/vsc/design/WEBVIEW.md` 全档本批零标记、零条目（`grep '10-09'` 零命中）：§4.8 两字面/转口句（`:202`–`:208`）与清除后口径不冲突（`model` 在场 ∕ 缺两字面本即覆盖）⇒ 大概率「零改」——但「零改」未登记，与「漏档」不可区分（该档是否属本轮应触档 = 未核，unverified） | 若属应触档 ⇒ 补一行「零改」判由；否则在批档清单注明免触 |
| 8 | 判据 8（涉改文件行数注） | 🔵 | 本评 15 档全为 `.md`（纯文档，豁免）；若批档 §2 另列源码/测试面改动与行数注，本评未核（unverified） | —（无动作；如需可核批档 §2 表） |

**计数**：🔴 3 ∥ 🟡 2 ∥ 🔵 3（无 🔴 已解者——三条 🔴 均为「同机制两处相反」型残留，须实现轮前收正）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**复核面**：轮 2 复评（只核轮 1 八条修复声明 + 复核面文件；事实源 = 本轮实读）。对盘 = 声明面 15 档 + 复核面 10 件（7 测试件 ∥ `server/design/PROJECT.md` ∥ `webui/WEBUI.md` ∥ `core/requirements/PROVIDER.md`）；声明基准 = 批档 §2 修复轮块（`:116–136`）。**计数：🔴 0 ∥ 🟡 1 ∥ 🔵 1**（另越界注 1）。

| # | Orig# | 文件 | 级 | 状态 | 备注（本轮实读引文） |
|---|-------|------|----|------|----------------------|
| 1 | 1 | `docs/server/design/ops/OPS.md` | 🔴 | **Fixed** | `:213`「`SERVER_PRESETS`——起步 20 家 `{ baseURL }`；**2026-10-09 清除批：零 `model` 键**」∥ `:262` N12「`models`= 空清单（2026-10-09 清除批：预设表零 `model` 键）⇒ 经「模型发现」勾选后 `/v1/models` 含 `deepseek/<选中模型>`」∥ 条目 `:316` 在册 |
| 2 | 2 | `docs/core/design/PROVIDER.md` | 🔴 | **Fixed** | `:358`「……名 + 当前模型 + `›`；渠道行显示回退 = `baseURL`——§6.16」∥ `:359`「Custom 手输 name / baseURL + format」∥ 条目 `:696` 在册 |
| 3 | 3 | `docs/core/design/MODEL-SPECS.md` | 🔴 | **Fixed** | `:536`「**无 `model` 键**（2026-10-09 清除批：渠道单值模型退场）」∥ `:538`「其 `model` 键已随渠道单值模型退场（2026-10-09 清除批）——原改指 `doubao-seed-2-0-code-preview-260215`」∥ `:992` D-5 同式 ∥ `:1128` M-8 同式 |
| 4 | 4 | 14 档（需求 4 + 设计 10） | 🟡 | **Fixed** | 需求 = `core/requirements/PROVIDER.md:165` ∥ `core/requirements/PROJECT.md:167` ∥ `server/requirements/PROJECT.md:267` ∥ `desktop/requirements/COMPOSER.md:25`；设计 = `PROVIDER:696` ∥ `SESSION:1152` ∥ `DOC-CODE-RECONCILE:474` ∥ `IPC:557` ∥ `SETTINGS:515` ∥ `COMPOSER:339` ∥ `SHELL:343`（零改在册） ∥ `WEBVIEW:706` ∥ `OPS:316` ∥ `API:234` |
| 5 | 5 | `docs/core/requirements/PROVIDER.md` | 🟡 | **Fixed** | `:88`「**注**：R15 已退场——判据对象（预设 `deepseek.model` 比较）随渠道单值模型退场删除（2026-10-09 清除批；见变更记录）。」+ `:165` |
| 6 | 6 | 多档 | 🔵 | **Fixed** | 注记名统一「2026-10-09 清除批」（各档抽样逐处命中——批名/日期任一键可扫全） |
| 7 | 7 | `docs/vsc/design/WEBVIEW.md` | 🔵 | **Fixed** | `:210`「**登记（2026-10-09 清除批）**：本节两字面（载荷 `model` 在场 ∥ 缺）与渠道单值模型退场后口径零冲突 ⇒ **零改在册**（本批复核）。」+ 条目 `:706` |
| 8 | 8 | ——（判据 8 注） | 🔵 | **Accepted** | 父侧 Not an issue——理由成立：声明面 15 档全 `.md`（豁免）；本轮补核批档 §2.4：最大触档 496 < 500、零新增越线 ⇒ 判据 8 满足 |
| 9 | (New) | `docs/server/design/webui/WEBUI.md` | 🟡 | **New**（非阻塞——供父侧裁处置） | 本档零本批标记/零本批条目（与 `SHELL`/`WEBVIEW` 的零改在册不对等）；清盘清单 `purge-sweep-docs-server.md:75` 对本档列 `:223` ① 載点；A6 使预设端点 `models` 收窄为空 ⇒ `:225`「模型清单表」数据源失落，处置未登记（§2.2 名单外）⇒ 宜补一行处置登记（零改 ∥ 随正） |
| 10 | (New) | `docs/core/design/MODEL-SPECS.md` | 🔵 | **New**（观察） | 修复轮 #3 的笔（`:536`/`:538`/`:992`）无独立 fix 条目——档内 10-09 条目仍为设计轮形 `:1885`；批档 `:130` 明示「`MODEL-SPECS.md` 已有 10-09 行——不动」⇒ 显式范围裁，非漏笔（供父侧酌） |

**越界注（无级）**：`docs/batches/2026-10-06-server-auto-update.test.mjs:439` 段注释「prepublishOnly 二十八件」 vs 同档 `:9`「二十九件」 ∥ `:480`「应列二十九件」——注释一件未随（属 testkey 批面，非本对象）。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent · 代签）**

**代签依据**：用户 2026-10-09 12:3x 令「自动跑完」（§1:29 全链授权条）——评审代点火 ∥ §4 代签 ∥ 修正轮 ∥ 分舱派发 ∥ 收口在授权射程内；真硬门（破坏性/不可逆 ∥ 新范围 ∥ 口径裁决）全程未触发。

**批准对象**：批档 §2 设计（含修复轮块 `:116–136` ∥ 观察 #9 随正 `:138`）+ 设计档 11 档翻转 + 需求档 15 处同拍（父侧笔）。

**评审终局**：§3 轮次 1（changes-required 🔴3/🟡2/🔵3）→ 修正轮 #16 → 轮次 2 **pass**（7 Fixed + 1 Accepted；新观察处置 = #9 随正登记（WEBUI.md `:226`/`:651`——`:138` 在册）∥ #10 Not an issue（§2:130 显式范围裁）∥ 越界注 = 就地机械修正（测试件段注释随正））。**无未解 🔴。**

**批准 = 本代理代签**（行权记录在册）。**实施 = 五舱同拍派发**（各 ≤15 件 · 同设计 token）：舱1 核 ∥ 舱2 CLI ∥ 舱3 桌面 ∥ 舱4 VSC ∥ 舱5 服务端；舱6 消解（文档面已落 ∥ 测试折入各舱）。

**批准日期**：2026-10-09（自动跑完授权下）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（桌面舱 fix 轮已落（`active` 复选 ∥ 参 ∥ 词键净删——零残留；读数 8/8 ∥ 6/6；10-07 修正稿待收位 ∥ M604 残留待路由）；核侧舱未落项 2 项仍待裁（见核侧块））



**§5 实施记录（eng-coder · 2026-10-09——initial 轮）**

**交付摘要**：服务端舱 A6 落盘——`SERVER_PRESETS` 20 键逐条去 `model`（每键只 `{ baseURL }`）；`expandProviderEntry` 的 `models` 缺省 = `[]`（条目自备照旧覆盖——覆盖语义不变）；头注/表注/展开注随正。端点与控制台经实读确认**零改**（父侧裁定 B：`gateway/provider-admin.mjs:275-283` 保留 `{ preset, name, baseURL, models: entry.models }`——响应零 `model` 键；`public/views-providers-modals.mjs:78-83`/`:152`/`:207` 空表 + 空清单即新行为——无「空」失真）。`thincoder-server/README.md` 预设句随正（**out-of-list**——sweep 载点 `README.md:56`「models = [预设默认模型]」残留句，交付报告在册）。新增批内件 `docs/batches/2026-10-09-provider-default-model-purge-server.test.mjs`（5 腿 = A6 判据）。

**改动清单（含净行差）**：
- `thincoder-server/src/ops/presets.mjs` —— **50 ⇒ 51 行**（净 +1）：头注 `:3`（形句去 `model`）∥ 表注 `:11` ∥ 表 20 键 `:13-32`（逐键去 `, model: "…"`——行数不变）∥ 展开注 `:35-37`（`models` 零缺省 + 勾选句）∥ `:49` `models: entry.models !== undefined ? entry.models : []`。
- `docs/batches/2026-10-09-provider-default-model-purge-server.test.mjs` —— 新建 **181 行**：腿① 表键面（20 键 ∥ 逐条 `"model" in p === false`）`:108` ∥ 腿② 展开缺省（全 20 预设 + 载入面同判）`:120` ∥ 腿③ 覆盖照旧 `:131` ∥ 腿④ N12 新形（空清单 ∥ 勾选后。`picked` 字面量 `:141`）`:140` ∥ 腿⑤ 端点半形状（401 ∥ 20 家 ∥ 零 `model` 键 ∧ `models === []` ∥ 零 `"model":` 字面——`"models":[]` 不误报）`:160`。
- `thincoder-server/README.md` —— **244 ⇒ 246 行**（净 +2）：预设句块 `:55-58`（预设例 ⇒ 覆盖句 ∥ `models` 无预设缺省 + 勾选路径句）。

**机检读数（红绿两轮 + 静态检查）**：
- 红轮（源改落地、他批随正件未落时——证据）：`2026-10-06-server-presets.test.mjs` = **4/8 红**（`:127` 键集 `["baseURL","model"]` vs `["baseURL"]`；`:143` `["deepseek-flash"]` vs `[]`；`:176` models 逐值；`:300` glm）∥ `2026-10-06-console-providers.test.mjs` ⑨ = 红（`:467` `models.length > 0`），其余 **8/9** 绿。
- 绿轮（父侧落地后——验收命令）：`node --test docs/batches/2026-10-06-server-presets.test.mjs docs/batches/2026-10-09-provider-default-model-purge-server.test.mjs` ⇒ **13 tests ∥ 13 pass ∥ 0 fail**；新件单跑 **5/5**；`2026-10-06-console-providers.test.mjs` 复核 **9/9**。
- 静态：`node --check` 三档 Syntax OK（写入面）∥ `node scripts/doc-check.mjs` ⇒ **EXIT 0**。
- 红线复核：服务端全树 `默认模型`/`预设默认` grep **零命中**；`models[]` 勾选集概念零触（端点/控制台/写面零改——实读）；`config.example.json` 零改（预设形条目本零 `model`）。

**决策透明表**：

| # | 决策点 | 决定 | 依据 |
|---|---|---|---|
| 1 | 端点/控制台面 | 零改（保留 `models: []`） | 父侧裁定 B（`API.md:54` 样本漏 `models` = 漏笔——设计侧已派修）+ 实施实读确认无「空」失真 |
| 2 | README 修订（out-of-list） | 改 | sweep 载点 `README.md:56` 残留句；批 A7 零残留口径——交付报告在册 |
| 3 | 他批两测试件随正 | 父侧落地（本舱零写） | 跨批写闸拒（'belongs to a different batch'——未绕、不重试）；逐处清单已上抛；父侧落地后本舱复跑 |
| 4 | 新件入 `prepublishOnly` | **未入**（留父侧收口裁） | 设计 §2.4 未列 `thincoder-server/package.json`；代码评审域外注①同项（先例 = 逐批入链——若收口以 `npm run prepublishOnly` 作门，须补） |
| 5 | 测试取值方式 | `picked` 字面量（不取核表 `model`） | A1 核表同日去 `model`——测试不得跨表取值（`2026-10-06` 件同法） |

**审计与代码评审轮次与终态**：
- 内部审计（explore，只读）轮次 1：**DEVIATIONS（2 低）**——① README out-of-list（在册——内容与设计同口径）∥ ② `OPS.md:42`/`:213`/`:249` 行数读数「50」vs 现档实读 **51**（行数回填归 §5/§6）。**无未披露越界 ∥ 无未落项 ∥ 无静默简化**。fix round = **零**（两条均报告面）。
- 内部代码评审（advisor code，sync）轮次 1：**VERDICT pass**——0🔴 ∥ 0🟡 ∥ 2🔵：① 腿③ `:134` 显式空数组断言无判别力（与缺省同值 `[]`；覆盖语义由 `:132-133` 判）——评审明示「保留零风险」，本舱决定**保留 + 记账** ∥ ② `OPS.md:42`/`:213` 行数读数漂移——回填登记。域外注：`prepublishOnly` 未含本批件（上表 #4）∥ 批档 §6 空段 = 父侧收口面（本段落写即消 §5 侧）。fix round = **零改**（产品码评审后零改）。
- **终态 = clean**（审计/评审零阻断项；🔵 两条均入阵面登记）。

### 舱3 桌面 · 实施记录（eng-coder · 2026-10-09）

**范围** = 批档 §2.1 表 **A3 ∥ A4**（桌面舱）；台账 #1122。

**落盘改动（12 件 + 批内件 1 件，行数为现盘实读）**：
1. `thincoder-desktop/src/main/providers.mjs`（324 ⇒ 302）——A3 主面：`provider:save` 载荷去 `model` ∥ `active`；`backfillDefaultModel` 整件删；自定形必填步收为 `baseURL → format`（调核 `customFieldsError({ baseURL, format })`——核侧新签名，见下披露）；`provider:list` 行去 `model` ∥ 顶层增 `defaultModel`（`loadConfig` 单源直取，缺 ∥ 非串 ∥ 空串 ⇒ `null`）；`presetChoices` 投影去 `model`（三键 `{ name, desc, baseURL }`）。
2. `src/main/settings.mjs`（297）——`advisorSpecModel` 去「advisor 渠条目 `model`」腿（保留 `advisor.model ?? defaultModel 模型段`）。
3. `renderer/mount-settings-reads.mjs`（211）——`activeModel(receipt)` 改**复合串直读**：有效（首个冒号位置 >0 且不落尾）⇒ `{ provider: 段前, current: 全串 }`，否则双 `null`（无回落到行 ∥ 首渠）；`settings.defaultModel` 切片同源落值。
4. `renderer/mount-settings-exits.mjs`（310）——`submitChannel` 载荷去 `model` ∥ `active`（形 = IPC.md §2 `provider:save` 行）。
5. `renderer/mount-settings-segments-providers.mjs`（161）——探针 `draft` 去 `model` 键（`providers.draft` 回填机制不动）。
6. `renderer/views/settings-controls.mjs`（197）——删 `MODEL_CANDIDATE_LIST_ID` ∥ `candidateListNode` ∥ model 输入件 ∥ 预设 `(model)` 后缀；`presetInfoWord` 收为 `baseURL` 单段；渠道校验行（`fetchRowNode`）保留；`active` 复选条件渲染保留（设计字面）。
7. `renderer/views/settings-sections-providers.mjs`（210）——`subLineWord` 收为 `baseURL` 单段；`providerAddBody` 去 `modelCandidates` 入参。
8. `renderer/views/settings.mjs`（437）——`advisorTargetOf` 去渠条目腿。
9. `renderer/views/onboarding.mjs`（161）——步 1 注随正（`activeDefault: true` 保留渲染）。
10. `renderer/composer-sync.mjs`（328）——`providerNotice` 按载荷 `face.model` 在场分两字面（`data-notice="provider-fallback"` 锚不动）。
11. `renderer/i18n-views.mjs`（411）∥ 12. `renderer/i18n.mjs`（429）——新键 `composer.send.noDefaultModelFallbackUnset`（en/zh 同增）+ 键数链续链（实读 `VIEWS_DICT` 149 ∥ `HOST_DICT` 323，含本批 +1）。
13. `docs/batches/2026-10-09-provider-default-model-purge-desktop.test.mjs`（168）——批内单测件 T1–T7（T5 = 平 node 桩测三径：正控（复合串 ⇒ 两读数 + 按渠取数）∥ 缺档（⇒ 双 `null` + `model:catalog` 全渠扇出）∥ 畸形两式）。

**决策透明表（裁断 ∥ 依据 ∥ 披露）**：
- **fallback 未设置变体的基础半句**取「默认模型未设置」（去「或无效」）∥ 裁量 ∥ COMPOSER.md §2 只钉**澄清半句**（「— 渠道可用、模型未定」逐字）；基础半句依 VSC 同构 = `docs/vsc/design/WEBVIEW.md:203`「默认模型未设置 — 渠道已就绪、模型未定」（无「或无效」）；EN 同构 = `Default model missing — channel available, model not chosen`。**设计句未显式写基础半句** ⇒ 请父侧确认（如需别形，改两值即可，键不变）。
- **两读数畸形串口径**（无冒号 ∥ 段空 ⇒ 双 `null` ⇒ `loadModels(null)` ⇒ `model:catalog` 全渠扇出）∥ 裁量 ∥ 与 SETTINGS.md §2.15「缺 ∥ 不可解析 ⇒ 激活渠道 `null` ⇒ 全渠扇出」自洽。边界点明：合法串指向**不在册渠** ⇒ provider 段照读 ⇒ `model:list(ghost)` 响亮失败（不静默回落——批旨口径；批前经 `activeProvider` 回落首渠，**语义变化点**）。
- **向导步 1「设为当前渠道」复选保留渲染、其值已无写路**（`active` 参退场）∥ 守设计字面 + 披露 ∥ SETTINGS.md §2.16 项 5 明写「保留 `activeDefault: true`」（向导面 = 本端独有流程）；控件现为 inert（勾 ∥ 不勾同果）⇒ 已列审计/评审 🟡，**待父侧裁定**：退控件 ∥ 补写路 ∥ 登记接受。
- **`provider:list` 回执顶层增 `defaultModel`** ∥ 父侧本会话已批 ∥ IPC.md §2 行未列该键 = 已知漂移（父侧收；本舱未自改文档）。
- **核侧零动** ∥ 父侧裁定（`provider-flows.mjs` 归舱1 #19）∥ 本舱对 `thincoder-core/**` 零写（已核：零命中）；`customFieldsError({ baseURL, format })` 按核新签名调用，拒因链由舱1 覆盖。
- **批内件含源扫断言**（视图族含 `/rc/*` 浏览器专属导入 ⇒ 平 node 不可装载）∥ 裁量 ∥ UI 构件断言取源码面；两读数取真桩测（`mount-settings-reads.mjs` 零导入 ⇒ 可装载）。

**审计 ∥ 代码评审轮次与终态**：
- 发散审计（explore 只读）**1 轮**：DEVIATIONS（唯一 1 条低 = IPC.md:289 `presets` 键列缺 `desc`，S7 期遗留、档面物，非本舱实现差异；审计无执行面 ⇒ 其静态核对批内件断言，实跑记录见下）。
- 代码评审（advisor）**1 轮**：**VERDICT pass**（0 🔴；2 🟡 + 5 🔵）。🟡① = 向导复选 inert（父裁项，见上）；🟡② = IPC.md:289 行面与实装不同形（父侧收册）。🔵 = IPC 注 8① 行号漂移 ∥ `onboarding.mjs:55` 注释内字面 `\n` ∥ 批内件 T2 扫描判据字面依赖 ∥ `fetchModels` 钮词未随语义收窄（设计保留词键）∥ `settings.defaultModel` 切片写而不读（批前既存）。
- **fix round = 1 轮**：`onboarding.mjs` 注释字面 `\n` 折真换行（唯一代码面项）；其余 🟡/🔵 为设计 ∥ 文档面，未自改（父侧裁定项）。
- **终态：clean**（0 🔴；🟡 皆为父侧裁定 ∥ 文档面，无阻塞项）。

**验证**：`cd d:\teamcode\thincoder; node --test docs/batches/2026-10-09-provider-default-model-purge-desktop.test.mjs` ⇒ **7/7 pass**（T1–T7；注释修复后复跑同绿）。仓级套件**未跑**（= 父侧收口单跑，本舱零跑）。

**漂移（本舱触碰面，供父侧/设计侧收）**：IPC.md §2 `provider:list` 行 ∥ 预设键列（`:289`）未含顶层 `defaultModel` ∥ `desc`；注 8①（`:320-321`）∥ 注 3（`:245`）行号滞后于现盘。设计 §2.4 表列桌面 8 件、实触 12 件（+`mount-settings-segments-providers.mjs` ∥ `composer-sync.mjs` ∥ `i18n-views.mjs` ∥ `i18n.mjs`——皆父侧 12 件清单内、各有设计落点）——本段即「实施回填」依据。

### 舱4 VSC · 实施记录（eng-coder · 2026-10-09）

**范围** = 批档 §2.1 表 **A5**（VSC 横幅两字面）+ 父侧实施期域扩展（自定形添加链「不携模型」∥ 显示面 ∥ 顺扫）；本舱对 `thincoder-core/**` 零写。

**交付摘要**：A5 两字面坐实——`webview/ui.js` fallback 键选按载荷 `model` 在场分（在场 ⇒ `banner.defaultModelFallback` ∥ 缺 ⇒ 新键 `banner.defaultModelFallbackNoModel`），`data-banner-key` 随键同分；四字面与 `docs/vsc/design/WEBVIEW.md` §4.8 :202-203 机检逐字相等（含破折号两侧空格）。域扩展三项落盘：① 自定形添加链「不携模型」逐端面——弹窗退 `#pa-model` 输入件 + 候选 datalist + `model` 必填门（守卫只剩 baseURL）、`addProvider` 载荷 `custom` 零 `model` 键、「拉取」钮收为渠道校验（只落状态行，不喂候选）；② 显示面——渠道行副行 ∥ 预设 detail ∥ 预设下拉 ∥ 快照投影全部改 `baseURL`，两死键净删；③ 顺扫——`presets.mjs` ∥ `panel-turn-stages.mjs` ∥ `turn-model.mjs` ∥ `vision-channel.mjs` ∥ `settings-state.js` 注释/注解随正（零行为改）。

**落盘改动（12 件 + 批内件 1 件）**：
1. `thincoder-vscode/webview/ui.js`——`showBanner` 键选三支 + fallback 两字面分支 + docstring/注随正。
2. `thincoder-vscode/locales/zh.json` ∥ 3. `en.json`——各 +1 键（`banner.defaultModelFallbackNoModel`）∥ 各 −2 死键（`settings.noDefaultModel` ∥ `settings.modelRequired`——全域零引用后净删）；两表 **293 键**全等。
4. `thincoder-vscode/webview/settings-provider-dialog.js`——model 件/候选/必填门退场 ∥ 预设信息行 = `baseURL` ∥ 选项 label 去 model 尾缀 ∥ 探果只落状态行。
5. `thincoder-vscode/webview/settings-providers.js`——渠道行副行 = `baseURL` 段 + 不可用标（`sub` 聚合，零前导分隔符）。
6. `thincoder-vscode/webview/onboarding.js`——预设下拉去 model 尾缀。
7. `thincoder-vscode/webview/settings-state.js`——`providerStatus` 类型注记随正（补 `baseURL` ∥ presets 形）。
8. `thincoder-vscode/src/extension/settings.mjs`——快照随正：渠道行去 `model` ∥ custom 去 `model` ∥ 预设投影去 `model` ∥ `deleteProviderKey` 判据去 `!entry.model` ∥ 注释随正（providerState.model 面零改——设计字面）。
9. `thincoder-vscode/src/extension/presets.mjs` ∥ 10. `panel-turn-stages.mjs` ∥ 11. `turn-model.mjs` ∥ 12. `vision-channel.mjs`——注释随正（无行为改；`vision-channel.mjs` 沿革归因收正 = parity-b4 批）。
13. `docs/batches/2026-10-09-provider-default-model-purge-vsc.test.mjs`——批内件 **9 腿**（T1 键选矩阵 3 态×2 语 ∥ T2 逐字+零 CJK ∥ T3 两向负控 ∥ T4 键集/闭集 ∥ T5 i18n 晚到 ∥ T6 自定形链（弹窗驱动：零 model 件 ∥ 载荷深等 ∥ 守卫负控 ∥ 探针载荷）∥ T7 显示面（渠道行 ∥ 下拉，负控：载荷带旧字段也不渲）∥ T8 源面闭合 + 死键净删）。

**机检读数**：`cd d:\teamcode\thincoder; node --test docs/batches/2026-10-09-provider-default-model-purge-vsc.test.mjs` ⇒ **9 tests ∥ 9 pass ∥ 0 fail**；四字面与 `WEBVIEW.md:202-203` 逐字 = node 提取机检**四句全等**；两表键集全等（各 293）；全档 `node --check` Syntax OK。仓级套件**未跑**（= 父侧收口单跑）。

**决策透明表**：

| # | 决策点 | 决定 | 依据 |
|---|---|---|---|
| 1 | 第二字面键名 | 新键 `banner.defaultModelFallbackNoModel` | 父侧任务书；设计档 §4.8 未列该键名 ⇒ 已列漂移项（见下） |
| 2 | 在场判据 | 真值判（非空串；`null`/`""` = 缺） | 父侧口径（与 CLI 先例同式） |
| 3 | `presets[].model` 快照投影 | 终态删（先例：先保形后随消费面同拍退场） | 消费面（onboarding ∥ 弹窗）本批同改 `baseURL` ⇒ 投影退场零破损 |
| 4 | `settings-panel-write.mjs` | 零改 | 实读该档零渠道单值模型载点（批档 §2.4 行面即此结论） |
| 5 | 两死键净删 | 删（两表各 −2） | 全域 grep 零引用（无效表达净删） |
| 6 | 「拉取模型」钮词 | 保留（行为收为渠道校验） | 设计未裁词面改；父侧域扩展只退字段 |
| 7 | 域扩展越出原单 | 实施 + 披露 | 父侧实施期域扩展指令（自定形链 ∥ 显示面 ∥ 顺扫） |

**审计 ∥ 代码评审轮次与终态**：
- 发散审计（explore 只读）**1 轮**：未发现实现面偏差；1 条 🟡 = 记录面（§5 未落——本段落账即消）+ R1「未声明残留」（= 弹窗 model 必填门/载荷，父侧域扩展随单覆盖）+ R3/R4 注记（显示族残留 → 域扩展覆盖；`settings-panel-write.mjs` 空改动面核实）。
- 代码评审（advisor，sync）**1 轮**：**changes-required**——**1 🔴**：`docs/vsc/design/SETTINGS.md` 仍立法「弹窗含 `#pa-model` + model 必填门 + `settings.modelRequired`」（`:15`/`:485`/`:496`/`:522-523`/`:725-726`/`:740`），与已收正的核设计（`docs/core/design/PROVIDER.md:296`：「**添加表单不设 model 输入件**」）+ 实装互斥 ⇒ **设计文档面（非本舱笔）**；3 🟡（视觉判源登记待收 ∥ A5 在场支真载荷不可达之设计观察 ∥ §5 落账）+ 4 🔵（§4.8 键名缺口 ∥ `vision-channel.mjs` 死壳/沿革归因 ∥ `prov-model` 类名残留 ∥ `settings-state.js` 类型注记）。
- **fix round = 1 轮**：🔵 三条自修（沿革归因收正 ∥ `prov-model` 两处类名注记 ∥ 类型注记补 `baseURL`）+ §5 落账（本段）；🔴 与两条 🟡 = 设计/文档面非本舱笔（上抛）；🔵 §4.8 键名 = 设计面（上抛）。自修后批内件复跑 **9/9 绿**。
- **终态：stalled（1 🔴 待在父侧文档面解决）**——本舱代码面零阻断项；🔴 解决即闭合。

**漂移（本舱触碰面，供父侧/设计侧收）**：
1. `docs/vsc/design/SETTINGS.md`——`:15` 矩阵字段序 ∥ `:485` 开框重置句 ∥ `:495-498` 字段序/语义依据 ∥ `:522-523` #1031 修法 + 守卫句 ∥ `:526` #1033 词表现值句 ∥ `:725` U-S14 ∥ `:726` U-S15 ∥ `:727` U-S16：全部仍含 `#pa-model`/`settings.modelRequired`/`settings.noDefaultModel`，需按「添加表单不设 model 输入件」翻转 + 变更记录一行。
2. `docs/vsc/design/WEBVIEW.md` §4.8——未列第二字面键名 `banner.defaultModelFallbackNoModel`（`data-banner-key` 取值闭集不闭）；建议补键名。
3. `docs/core/design/PROVIDER.md:359`——指 VSC `provider-flows.mjs`（`addProviderFlow :106`）：该档 39 行且无该函数（#1054 净删；核真身 = `thincoder-core/provider-flows.mjs:137`）——指针双错（域外注，无级）。
4. 视觉链（`docs/core/design/PROVIDER.md:322` ∥ 需求 `:134` F-IDG-1）——判源退场后核件 `findVisionChannel` 恒 `null`，语义悬空待登记（核/设计面，非本舱）。

**上抛**：[上抛·待裁] 漂移 1（🔴——VSC 设计档翻转 = 父侧/设计侧笔）；[上抛·知会] 漂移 2/3/4 与「A5 在场支真载荷不可达」设计观察。

**§5 实施记录（eng-coder · 舱2 CLI · 2026-10-09）**

**范围** = 批档 §2.1 A2（CLI 舱）：渠行显示 ∥ 预置列表 ∥ 向导种子 ∥ advisor 菜单的「渠道模型」读数与回落全退场（渠行显示回退 = `baseURL`）；探针脚本入参改显式 `provider:model`。验收 = 批内件 8 例全绿 + 各档 `node --check`。设计 token 经 spawn 绑定生效（本舱不复述字面值）。

**逐档改动（坐标 = 终形）**：

| 档 | 改动 |
|---|---|
| `thincoder-cli/src/tui/model-picker.mjs` | 删 `defaultModelLabel`（原 :48-51，ctx 注入同步去 :30）；L1 渠行模型段只随会话槽值（:117），显示回退 = note `baseURL`（:132）；`pickModelForSlot` 渠行 = baseURL（:274） |
| `thincoder-cli/src/tui/provider-admin.mjs` | 预设行去 `(${p.model ?? ""})`（:46）；custom 分支删 model 问句与 `cfg.model`（:64）；预设落条去 `model: preset.model`（:89）；删渠标签 = baseURL（:120）；级联清理注释括注随正（:219） |
| `thincoder-cli/src/tui/cmd-config.mjs` | 默认模型子菜单渠行 `${p.model ?? "(no default model)"}` ⇒ `${p.baseURL}`（:310）；`reloadConfig` 删 `keep.model` 回落（:82——链收为「槽 → defaultModel 属渠段 → 空 ⇒ 明示未设置」）；:64-66 注释随正 |
| `thincoder-cli/src/tui/wizard.mjs` | items 去 model（:27/:32）；`WIZARD_STEPS` 删 model 步 ∥ `WIZARD_NEXT` baseURL→format（:75）；摘要删 `Model:`（:96-99）；`finishWizard` 零 `raw.defaultModel` 播种、零 active*/provider 预置、`providerRec` 零 model（:180/:198-210）；尾提示改「选定即成为默认模型」（:237） |
| `thincoder-cli/src/tui/cmd-advisor.mjs` | 删「Default model」条目与 `m === p.model` 去重行（:245-252）；**`getEffectiveModel` 修为 `cfg.model \|\| agent.provider?.model`**（:213——M3③ 父解析模型单档；审计发现渠级死读，已修）；`buildThinkingEntries` 同源（:261） |
| `thincoder-cli/src/tui/cmd-submodel.mjs` | **仅注释随正**（:29 值形枚举 ∥ :31 复合值句）；槽位语义代码零动（父侧钉死面） |
| `thincoder-cli/src/cli/setup-wizard.mjs` | 渠道条目零 model（:93）；model 问句 = 顶层 `defaultModel` 显式选定（:55/:101）；返回对象仍携 `model` = 运行时 provider 形（command-interactive ∥ distill ∥ acp/login 消费面零动） |
| `thincoder-cli/test/smoke-qwen-thinking.mjs` | 入参改显式 `<provider:model>`（:2/:38）；新导出 `parseSmokeTarget`（:16-19——委托核 `parseModelRef`；供批内件直测）；选路零 `prov.model` 读 |
| `docs/batches/2026-10-09-provider-default-model-purge-cli.test.mjs`（新建） | T1..T8（见测试读数） |

**决策透明表**：

| 项 | 判断 | 依据/理由 |
|---|---|---|
| `setup-wizard.mjs`（超 §2.4 表列） | 纳入交付（披露） | 渠道零播种后 model 问句若只喂渠道，首跑 chat 必断（`assertProviderModel`）——改为「默认模型显式选定」，与 TUI wizard 尾 picker 同判据 |
| model-picker 槽级 `providerConfig.model` 死读（:210） | **保留**（父侧钉死「保留并报告」） | 槽位面红线零改；载入即删 ⇒ 恒 undefined（行为已死）——R3「零读写」字面未达，在案 |
| cmd-advisor :59/:165 ∥ render-frame:54 ∥ startup:240 ∥ agent-turn:279 ∥ command-interactive:47 | 零动（仅报告） | 运行时 provider 读数（非渠道条目） |
| 探针入参 | 显式 `provider:model`（首冒号分割） | MODEL-SPECS.md:90/:410 |
| `providerSpec(p)` L1 ctx 标（model-picker:125） | 零动（仅报告） | 核 `providerSpec` 读 `provider.model`——载入已删 ⇒ 非会话渠道 ctx 标落默认 spec（核舱面） |

**审计与代码评审轮次与终态**：
- 内部差异审计（explore 只读）1 轮：2 🟡——cmd-advisor `getEffectiveModel` 渠级死读 = **已修**；model-picker:210 死读 = 判保留（钉死面，证据如述）。
- advisor 代码评审轮 1：**changes-required**（1 🔴 `design/PROVIDER.md:300` M10 仍写 `sessionModel ?? dm.model ?? keep.model` ∥ 1 🟡 A2「fail-fast 用例」零交付 ∥ 2 🔵 注释未随正）。
- fix 轮（因子上限 5，实用 1）：🟡 ⇒ 补 T8；🔵×2 ⇒ 注释随正；🔴 ⇒ **设计档面、非本舱写域——上抛父侧路由**（本舱实装 ∥ 批内件锁为正确面，不得为迁就档面改码）。
- advisor 代码评审轮 2（仅核 fix 声明）：**pass**（3 fix 全 Fixed；前轮 🔴 按对象声明排除/Accepted；无新 🔴）。
- **终端状态 = clean**（本舱代码面收敛；唯一在案项 = `design/PROVIDER.md:300` 一行翻转，父侧归属）。

**测试读数**：`node --test docs/batches/2026-10-09-provider-default-model-purge-cli.test.mjs` ⇒ **8 例全绿**（T1 源扫描 ∥ T2 预设行源锁+首屏实读 ∥ T3 向导产物桩测 ∥ T4 探针三例 ∥ T5 L1 渠行行为 ∥ T6 /config 渠行+reloadConfig 源锁 ∥ T7 advisor 回落源锁 ∥ T8 两无 fail-fast）；9 件 `node --check` 全 OK。repo 套件未跑（父侧收口统一跑）。

**超 §2.4 表列触档（披露）**：provider-admin.mjs ∥ wizard.mjs ∥ cmd-advisor.mjs ∥ cmd-submodel.mjs ∥ setup-wizard.mjs（+ 本舱批内件）——原因见上表；逐件核无夹带。

**观察（父侧路由）**：① `design/PROVIDER.md:300`（M10「CLI 对位」）仍引 `keep.model`（上抛）；② 核侧孪生残留：`provider/errors.mjs:99` 文案仍指已清字段 ∥ `model-ref.mjs:89-95`（`resolveChannelModel` ②档死读，R3 机检会命中，§2.3 五舱未列此档）∥ `advisor/run.mjs:38` 渠级死读；③ CLI 树 `test/smoke-responses.mjs` ∥ `smoke-responses-chain.mjs` 仍直读渠级 model（两档仅收 `--name`，清除批后取不到 model）；④ `docs/cli/design/TUI-COMMANDS.md:73` 例行仍含渠级模型段（未翻转档——只报告不改）。

### 实施记录（eng-coder · 核侧舱：件①②③ + #20 路由件④⑤）· 2026-10-09

**交付摘要**：9 源件 + 1 批内件（14 tests）落盘；复跑读数 = `node --test docs/batches/2026-10-04-opencode-go-preset.test.mjs docs/batches/2026-10-09-provider-default-model-purge-core.test.mjs`（仓库根 `thincoder/`）⇒ **tests 20 ∥ pass 20 ∥ fail 0**（14 + 6）。

**文件 → file:line 读数**：
- `thincoder-core/config.mjs:342` —— 载入归一「一律删」：`if (p.model !== undefined) delete p.model`（零回落；档头 schema 句 ∥ `:223/:232/:242` 清洗提示串 ∥ `:38` 注释随正——`("provider:model" | model)`）。
- `thincoder-core/config-io.mjs:154` —— resolveProviders 无条件 `delete p.model`；`:239-248` custom 分支双退（`:247` `entry = { name, baseURL }`——必填判 ∥ 落键同去 model）；`:221-224` 档注随正。
- `thincoder-core/config-presets.mjs:17-53` —— 全表 24 键逐条无 `model`；`presetToEntry`（`:57-62`）不产键。
- `thincoder-core/agent-tools/subagent-async.mjs:164-177` —— 首冒号分割（`:164`）∥ `:171` 空 mname 拒 ∥ `:177` 裸渠名拒（文案逐字「渠道无默认模型，请用 provider:model」）；`:148/:160` 保留分支（null ∥ "default"）；裸模型名换型保留。
- `thincoder-core/provider-flows.mjs:64-70` —— `customFieldsError` 两拒因（baseURL ∥ format）；`:150` 预设 detail = `baseURL`；`:151` custom 项描述去 model（随正披露项）；`:159-184` 自定径恰三问（零 model 问句）；`:215` 删渠列表 description = `baseURL`（随正披露项）。
- `thincoder-core/config-migrate.mjs:46-52` —— ② 段一律删（`model`/`models`，幂等）；`:30-44` ① 段零动；`seedModel`（`:57-61`）非死码保留（① 段消费）。`migrateCore:110` 写键 = **未落项**（见下）。
- `thincoder-core/vision-reader.mjs:34-36` —— `findVisionChannel` 判源退场 ⇒ 恒 `null`（签名保留；零 `p.model` 读）；`:31-33` 注释写现行语义（零「待恢复」许诺）；死导入 ∥ W8 静态边注随正。
- `thincoder-core/model-ref.mjs:91-95` —— ②档 `entry.model` 读退场（§6.19：不回退渠道单值）；`:86` ∥ `:108` ∥ `:19` ∥ `:23`（档头计数 四步→三步）注释随正；`:135-136` 消费点自洽（实读确认，零改）。
- `thincoder-core/provider/errors.mjs:101` —— 拒因串收正（零 `providers[].model` 指引，改「default model (provider:model) ∥ session slot」）；`:91-97` 档注随正。
- `thincoder-core/advisor/run.mjs:33-37` —— 模型面 = 父解析单档（`agent.provider?.model`——渠级死读退场；与 CLI `cmd-advisor` 同族）。
- `docs/batches/2026-10-09-provider-default-model-purge-core.test.mjs` —— 14 tests（`:69/:92/:104/:117/:128/:137/:150/:159/:165/:201/:221/:234/:250/:261`）；夹具 `withTmpConfig` = `return await fn(cfg)` + 缝内落条护栏。
- `docs/batches/2026-10-04-opencode-go-preset.test.mjs` —— 随正全稿由我备（`.thincoder/tmp/2026-10-09-purge-batch/`，在位验证 6/6）→ **父侧覆盖**（跨批写门被拒，不绕门）。

**决策透明表**：
| # | 决策 | 理由 |
|---|---|---|
| D1 | 裸渠名拒文案保持现行（无 markdown 反引号） | 父侧裁（设计 `PROVIDER.md:291`「可派生」一字由设计侧收正——我零动） |
| D2 | `provider-flows.mjs:151/:215` 两处描述随正（父侧裁清单外） | 同「渠级模型显示退场」族（M3③ 显示回退 = `baseURL`）；文件域内、随批披露 |
| D3 | 批内件 `withTmpConfig` 白修：async 回调须 await（原 `return fn(cfg)` ⇒ finally 先跑、配置动作漏出缝外）+ 缝内落条护栏 | 父侧红修路由；漏出曾实写真实配置（测试渠 `c2`——仓外清理归父侧，一行实办在册） |
| D4 | 10-04 件随正稿先落 `.thincoder/tmp/`、不绕跨批门 | 机械门禁 + 跨批写纪律；父侧覆盖落地 |
| D5 | 未落项 2 项（`config-migrate.mjs:110` ∥ `config.mjs:255/:257`）不擅改 | 消费面 = VSC extension（舱4）/ 顺扫裁量未授权——终报列明待裁 |

**审计与代码评审轮次与终态**：
- 分歧审计（explore · 轮 1）：六项验收逐条 ✅；R1-R7（③类漂移 6 ∥ 记录面 1）上抛父侧——R2（`model-ref`）经父侧扩域已收正（落盘），advisor ∥ errors 两处经 #20 路由落地（件④⑤）。
- advisor 代码评审（轮 1）：**VERDICT: pass**（无 🔴；🟡×2 ∥ 🔵×2 + 域外注记）。响应表：
  - 🟡 `config-migrate.mjs:109-110`（migrateCore 重建写 `model: meta.model`——R3 字面未达）→ **未落项·待裁**（一行改除 ∥ 登记；消费面 = `thincoder-vscode/src/extension/migrate-settings.mjs`）。
  - 🟡 `vision-reader.mjs:34-36`（恒 null 悬空）→ **已登记维持**（需求 `PROVIDER.md:138` + 台账 #1125；设计侧收口）。
  - 🔵 `model-ref.mjs:23`（计数 四步）→ **已随正**（三步）。
  - 🔵 `config.mjs:255/:257`（`activeProvider` 措辞 ∥ 兜底 `model: ""`）→ **未落项·待裁**（零行为影响，顺扫裁量）。
- fix rounds：① 红修（`withTmpConfig` await + 护栏）② `model-ref` 收正 ③ #20 两件 + 计数随正——共 3 轮（≤5 上限内）。
- **终态 = clean**（advisor pass，零 must-fix 未决；未落项 = 待父侧裁量项，已披露）。

**未落项（待父侧裁）**：
1. `thincoder-core/config-migrate.mjs:109-110` —— migrateCore 重建条目写渠道 `model`（R3 字面未达；建议 `meta.model` 仅作重建判据门、不落键）。
2. `thincoder-core/config.mjs:255`（报错串措辞 `activeProvider`）∥ `:257`（兜底对象 `model: ""`）。
3. 旧批件断言（sweep 在册；本批语义收正后互斥）：`docs/batches/2026-10-03-provider-invalid-unify.test.mjs:146/:151-152`（渠单值转口断言）∥ `docs/batches/2026-10-04-issue-fix-round1.b.test.mjs:361` 等——复跑将红，随正面归父侧路由。
4. `thincoder-core/session-lifecycle.mjs:396`（`entry.model` 读残留）∥ `:175-176` 注释——不在本舱声明面，请父侧路由。
5. `thincoder-core/CHANGELOG.md:77` 仍述「模型面 … → 渠道单值 → null」（历史记录语料——未追改，报父侧知悉）。

**披露**：`c2` 仓外实写（真实配置）已由父侧一行实办清理（我未碰仓外）；本仓内零越域写；`.thincoder/tmp/2026-10-09-purge-batch/` 暂存件保留（供父侧复核）。

**§5 实施记录（eng-coder · 2026-10-09——实施期 fix 轮（舱3 桌面收正））**

**任务书** = 批档 §2 收口前设计侧收正块第 3 项（`SETTINGS.md:31 ∥ :207 ∥ :208` 三处同拍：「向导步 1 `activeDefault` 复选随 2026-10-09 清除批退场（`active` 参退场 ⇒ 死控——无 active 写路；等价路径 = 模型段「采用」）」+「表单构建器该复选条件渲染随同退场——设置弹窗 ∥ 向导全径零节点」）。round = fix（点修——勿全域重探）。

**交付摘要**：复选件 ∥ `active` 参链 ∥ 相关写路 ∥ 词键全链净删（零残留）；批内件断言随正（T3 翻转 + T8 新增）；10-07 parity 件修正稿入 `.thincoder/tmp/2026-10-09-purge-batch/`（待父侧收位）。

**逐号落点（号 → 改动 file:line；坐标 = 终形）**：

1. `thincoder-desktop/renderer/views/onboarding.mjs:55-64` —— 步 1 `channelBody` 去 `activeDefault: true`；档注随正（`:55-56`）。
2. `thincoder-desktop/renderer/views/settings-controls.mjs:146` —— 原 ⑦ 激活渠复选块（label + input ∥ 条件渲染 ∥ 参）净删；步号续排（原 ⑧⑨ ⇒ ⑦⑧）；档注四处随正（`:17 ∥ :22 ∥ :72-75 ∥ :141`）。
3. `thincoder-desktop/renderer/mount-settings-exits.mjs:41` —— 档注随正（原「向导步 1 复选**保留渲染**〔设计字面 = §2.16 项 5〕」被本轮裁定取代）；**out-of-list**（注释面；该档代码面清除批即已零 `active`——批档 `:291` 在册）。
4. `thincoder-desktop/renderer/i18n-settings.mjs` —— `settings.providers.activeToggle` 两语净删（零消费者）；档头计数 63 ⇒ **62** + 链注（`:5`）。**out-of-list**——依据 = 任务「零残留」+ `SETTINGS.md` §2.16 项 9 教义「无消费者，随实现净删」+ 同批 VSC 死键净删先例（先例误引收正：`modelLabel` 非死键——消费面活于 `settings-sections-models.mjs:141 ∥ :176`）。
5. `thincoder-desktop/renderer/i18n.mjs:113-115`（链注续写）∥ `:143`（`settings.*` 计数）——`HOST_DICT` 323 ⇒ **322**。**out-of-list**。
6. `docs/batches/2026-10-09-provider-default-model-purge-desktop.test.mjs` —— T3 尾行翻转（`activeToggle` 消费 ⇒ false）+ **新增 T8**（`activeDefault` 全树零引用 ∥ 节点签名三式（for ∥ id ∥ name）零 ∥ 词键两语缺席 ∥ 向导表单正控）。
7. `.thincoder/tmp/2026-10-09-purge-batch/2026-10-07-provider-config-parity-desktop.test.mjs`（修正稿 · 同名 · 待父侧收位）——D2 三簇随正：① 自定形节序去 `model`（purge 遗留红——原 `:137` 直跑即红）；② 预设信息行 `baseURL` 单段（purge 遗留红——原 `:152-153`，被 `:137` 首红掩盖）；③ 零 `active` 件（本轮）。**从 tmp 直跑成立**（档内 `:24-25` 双候选路径适配 depth 3；`test/rc-resolve.mjs` ∥ 实装取件按 `DESKTOP` 双候选解析——判据 = 现盘实装，无原位依赖）。

**机检读数（复跑）**：
- 验收命令：`cd d:\teamcode\thincoder; node --test docs/batches/2026-10-09-provider-default-model-purge-desktop.test.mjs` ⇒ **8/8 pass ∥ 0 fail**。
- tmp 修正稿：`node --test .thincoder/tmp/2026-10-09-purge-batch/2026-10-07-provider-config-parity-desktop.test.mjs` ⇒ **6/6 pass ∥ 0 fail**。
- `node --check` 7 档全 rc=0；残留复核：`activeDefault` 全舱（`src` + `renderer`）零命中 ∥ `activeToggle` 消费面零命中 ∥ 实读 `SETTINGS_DICT` 62/62 ∥ `HOST_DICT` 322/322（键集两语相等）。
- 仓级套件**未跑**（= 父侧收口单跑）。

**决策透明表**：

| # | 决策点 | 决定 | 依据 |
|---|---|---|---|
| 1 | 词键 `activeToggle` 处置 | **净删**（随件——初判留表，经发散审计复核收正） | 任务「零残留」+ `SETTINGS.md` §2.16 项 9 教义 + 同批 VSC 死键先例；留表 = 死字面残留 |
| 2 | `mount-settings-exits.mjs` 注入（out-of-list） | 改注释一句 | 原句被本轮裁定取代——留则成假陈述（注释=行为描述） |
| 3 | i18n 两档计数（out-of-list） | 63 ⇒ 62 ∥ 323 ⇒ 322 | D3 计数与清单同动；链注沿档内既有格式续写（记录面） |
| 4 | 10-07 parity 件 | tmp 修正稿（不绕跨批写门） | 先例 = 舱1 10-04 件同法（批档 `:274 ∥ :421`；父侧收位） |
| 5 | M604 回归件 `:517 ∥ :525`（本轮退场 ⇒ 两断言必红） | **未动** | 他批件、出任务书射程；该件 purge 批已红（`:287` `[name="model"]`）⇒ 随正稿路由归父侧 |

**审计与代码评审轮次与终态**：
- 发散审计（explore 只读）**1 轮**：四类偏差零发现；登记面 = 词键留表构成死字面残留（⇒ 本 fix 轮收正）；附注 = §5 舱3 原段现文滞后（本段落账即消）∥ `SETTINGS.md:31` 与 `:203/:206/:208` 两处表述不一致（设计档面——报父侧路由）。
- 代码评审（advisor · sync）**1 轮**：**VERDICT pass**（0 🔴）——🟡×3（M604 残留未扫 ∥ 10-07 归档原件待收位 ∥ §5 舱3 原段滞后）+ 🔵×3（i18n 机检指针悬空 ∥ i18n 行数相对 A4 护栏 432 > 420 ∥ T8 注释指针不可考）。
- **fix round = 1 轮**：T8 注释不可考指针净删（唯一测试面项）；复跑 8/8。
- **终态 = clean**（0 🔴；🟡/🔵 皆报告面 ∥ 他批件路由项 ∥ 设计档面——无本舱未决阻断项）。

**被取代项（防重开）**：§5 舱3 原段 `:293 ∥ :296 ∥ :298 ∥ :304`（「`active` 复选条件渲染保留（设计字面）」∥「步 1 注随正（`activeDefault: true` 保留渲染）」∥「实读 `HOST_DICT` 323」∥「复选保留渲染…待父侧裁定」）⇒ 以本 fix 轮块为准；同段验证读数 7/7 ⇒ **8/8**。

**未落项（待父侧/路由）**：
1. `docs/batches/2026-10-07-provider-config-parity-desktop.test.mjs` 归档原件仍钉退场件（`:158 ∥ :160 ∥ :162`）——修正稿在 tmp——**待父侧收位**（换位后原件转绿）。
2. `docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs:517 ∥ :525`——**未动**（他批件、出射程；purge 批已另红 `:287`）——建议路由随正稿。
3. 他批记录面仍述「向导 `activeDefault` 保留」（`docs/batches/2026-10-07-provider-config-parity.md:150 ∥ :276` ∥ `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md:176-177`）——记录层留档可零改；防重开可补指针。
4. 既存红档簇（**非本轮所致**，供收口参考）：`2026-10-04-desktop-channel-tier-retire.test.mjs:172-173`（期望 59 ∥ 309）∥ `2026-10-05-attach-file-support.test.mjs:363-364`（期望 314）∥ `2026-09-29-i18n-split.test.mjs:58 ∥ :94 ∥ :96`；旁注：本轮净删使 `SETTINGS_DICT` = 62 与 i18n-split `:58` 锚相符——该腿**由红转绿**。
5. 设计面计数回填目标随动：`docs/desktop/design/UI.md:502`「键族 60 ⇒ 63；实施后回填」的后填目标 ⇒ **63 ⇒ 62**（净 −1）；`docs/desktop/design/SHELL.md:100` 等现文已滞——归设计侧回填轮（本舱零触设计档）。

**零触面**：设计档 ∥ 需求档 ∥ 核 ∥ CLI ∥ VSC ∥ 服务端——零写；他批档零写（tmp 暂存件除外）。**零新语义**（全为随正 ∥ 登记 ∥ 裁定落地）。

**实施（eng-coder · fix 轮 · 2026-10-09）**

**任务**（§2 收口 fix 轮 + 父侧两次裁定）：① 三核修；② 他批断言随正备稿（裁：六件 + 追加 ① 件 = **七件**；`structure-split-2` 不并入）；③ 仅备稿 tmp、不触原位、零夹带、零新语义。

**① 三核修（产品代码，已落原位）**

| # | 文件 | 改动 | 验证 |
|---|---|---|---|
| 1 | `thincoder-core/config-migrate.mjs:109-110`（+ docstring :78-80） | 孤儿重建门 = `!meta?.baseURL` 单判（原 `|| !meta?.model`）；重建 `{ name, baseURL }`（零 `model` 键） | 批内件「残留收口①」4 场景 + 源面零 `meta.model` 读锁 |
| 2 | `thincoder-core/config.mjs:257` | `findProvider` 兜底对象去 `model: ""`（:255 文案零改） | 「残留收口②」 |
| 3 | `thincoder-core/session-lifecycle.mjs:389-402`（+ import :23 ∥ 注释 :174-176 ∥ docstring :378-388） | `sessionReading` 模型面走现行链：`slotModel ?? resolveChannelModel(entry, defaultModel ?? null)`（原读残留 `entry.model`） | 「残留收口③」（四档链 + 源面零读锁） |
| 3b | `thincoder-desktop/src/main/session-slots.mjs:178`（**任务书 files 外——披露**） | 唯一消费点入参补 `defaultModel: config.defaultModel`（链第二档入参来源；缺 ⇒ 该档死）；:169-173 docstring 一行随正 | 源面入参锁（批内件） |
| 4 | `docs/batches/2026-10-09-provider-default-model-purge-core.test.mjs`（+3 用例 ∥ +2 头注行） | 残留收口①②③ 断言 | **实跑 17/0** |

**② 七件随正备稿（`.thincoder/tmp/2026-10-09-purge-batch/` 同名；原位未触，待父侧转正）**

| # | 件 | 实跑 | 验证位 |
|---|---|---|---|
| 六-① | `2026-10-03-provider-invalid-unify.test.mjs` | **5/5** | 备稿目录直跑（cwd 锚） |
| 六-② | `2026-09-29-provider-config-family.test.mjs` | **13/13** | 同上 |
| 六-③ | `2026-10-04-session-carryover-cli-vsc.test.mjs` | **11/11** | `.thincoder/tmp/<同名>` 运行副本（两级 `import.meta.url` 锚；字节哈希 = 备稿） |
| 六-④ | `2026-10-04-issue-fix-round1.b.test.mjs` | **17/17** | 同上 |
| 六-⑤ | `2026-09-29-desktop-carryover-c1.test.mjs` | **2/9**（余红存量） | 同上 |
| 六-⑥ | `2026-09-29-parity-b10-ui-w2.test.mjs` | **13/13** | 同上 |
| 裁-① | `2026-10-07-provider-config-parity-vsc.test.mjs` | **13/13** | 同上（+ harness 支持副本，字节哈希 = 原档） |

- 改动面 = 本批语义面随正（model 面 ∥ 相关计数锁 ∥ 引用面），逐处已在件内头注/题名标注；**⑥⑦ 含跨批点修**（父侧裁定 ②「可达点修并入」）：⑥ 通道计数锁 45⇒48 + 三档头「四十八项」、fetch 钮断言改查表单件树面（`settingsModalTree` 添加弹窗体）、假 DOM `querySelectorAll` 面、行面 main/sub 导航；⑦ 全件随正（`pa-model` ∥ `modelRequired` ∥ `noDefaultModel` ∥ 候选项面）。
- **⑤ 余红存量（非本批；父侧裁定只标注）**：2 绿（T-659a/b）∥ 7 红——① 三例「两形在场」＝ 10-07 弹窗批（两形常显表单退场 ⇒ 表单入 `settingsModalTree` 弹窗、挂 `document.body`；假 DOM 无 body/modal 宿主）；② 两例「编辑态件」＝ 10-07 宿主无关读（源 `document.querySelectorAll("[data-provider-key-input]")`；测试台 `querySelectorAll: () => []`）；③ M-652d ∥ M-652e 不达（d 例偶发进程 OOM 崩——原档复跑同崩，渲染链零点本批核件；e 例另含 10-07 单骨漂移锁 `add:custom` ⇒ 现盘 `add:provider`）。全量重基超随正射程——归 10-07 弹窗批存量（父侧已记账）。
- `2026-09-29-structure-split-2.test.mjs` = 父侧裁「不并入」（台账 #1130）：零动；读数 = 5 例 4 红（A 行数 ∥ B sha256 ∥ C 导出集 ∥ D ENOENT `chat-digest.mjs`）；引点本身绿。

**③ 审计与评审（轮次与终态）**

- **分歧审计**（explore 只读 · 1 轮）：`VERDICT: 有分歧`（仅低——四类中「未实现验收点 ∥ 静默降级/半实现 ∥ 越清单/夹带」= 零）。低项：a) 文档引文漂移 ×1——`docs/core/design/SESSION.md:875/:876/:885` ∥ `docs/desktop/design/IPC.md:221` ∥ `docs/desktop/design/UI.md:159` 五处仍两参形（`{ providers, fallback }`），本批应报（设计面归 eng-designer，未自改）；b) 存量设计↔实装张力——`SESSION.md:882/:890`「在册且持 key」vs 实装按名命中（2026-09-28 起存量，非本轮）；c) ⑤ 头注行号引用精度（本单已收正为用例名制）+ ⑤ 计数账（复核：全量跑实为 2/7；OOM 崩时 2/5 + 2 例不达）；d) `MODEL-SPECS.md:661` P-1 记 25（他批设计轮）vs 现盘 24——若他批产品码先落需同怕随正。
- **自修**（1 轮）：⑤ 头注改用例名制 + 实跑读数收正（2/7 + OOM 偶态注记）。
- **代码评审**（advisor type=code）：**未跑**——父侧预算收束令（「报告先行、未落项列清、勿求全」）。
- **终态 = `clean`**（四类零发现；低项 = 报告面 ∥ 存量面，均已披露）。

**④ 未落项**

① advisor code 评审（预算收束）；② 文档引文漂移 5 处随正（设计面）；③ ⑤ 件全量重基（父侧裁不做）；④ 七件备稿转正落 `docs/batches/`（父侧收口动作——写门拒本座直落）。

**⑤ 验证支撑副本（非交付物）**：`.thincoder/tmp/` 下 ③④⑤⑥⑦ 五件运行副本 + `2026-10-07-…-vsc-harness.mjs` 支持副本（均字节哈希 = 备稿/原档）。

## §6 验证与收口（父代理）

**状态：验证通过 ⇒ 收口（2026-10-09）**。角色表：§1 主 agent ∥ §2 eng-designer ∥ §3 评审子代理 ∥ §4 主 agent（代签）∥ §5 eng-coder ∥ §6 主 agent。**暂缓批复核：无**。**前批挂空核对：无**（本批未锚前批未收口行）。

**测试矩阵（父侧亲跑 · 仓库根 `thincoder/`）**：
- 五舱批内件：`-core` 17 ∥ `-cli` 8 ∥ `-desktop` 7 ∥ `-vsc` 9 ∥ `-server` 5（含合并终形）——全绿。
- 跨批随正 **14 件**（随正覆盖/适配）：M604 ∥ parity-desktop ∥ parity-vsc ∥ parity-cli ∥ carryover-c1 ∥ parity-b10-ui-w2 ∥ provider-invalid-unify ∥ issue-fix-round1.b ∥ session-carryover-cli-vsc ∥ core-carryover ∥ provider-config-family ∥ server-presets ∥ console-providers ∥ opencode-go-preset。
- 全量三跑合计 **295 测（288 绿 ∥ 7 红）**——7 红全部 = `carryover-c1` 存量（10-07 弹窗批：表单入 `settingsModalTree` ∥ 假 DOM 无宿主——件内注记在案；重基归 #1108，本批不抬）。
- `node scripts/doc-check.mjs` ⇒ **EXIT 0**（锚 0 ∥ 行宽 0 ∥ 行数面差异 0——163 行比对）。
- 父侧直接执行在册（engineering-tools 面 · 可 revert）：随正覆盖 6 件 ∥ 父侧适配 5 处（`provider-config-family` 5 处 ∥ `core-carryover` 638-1/638-2 重写 ∥ `parity-cli` C1 去退场字段 ∥ `session-lifecycle` 注释随正 ∥ 文档 5 处引文随正——#34 轮）。

**代码评审（advisor · 父侧代跑）**：**pass**（🔴0 ∥ 🟡1——`session-lifecycle:80-86` 假注释当场直改 ∥ 🔵3——hasKey 端差挂 #1135 ∥ `config.mjs` 措辞挂 #1136 ∥ 逐字锁裁非问题）。越界注两条已闭：`core-carryover` 漏扫已修（8/8）∥ 设计引文 5 处随正已落。

**真机面（ECS 10.0.0.5 · 父侧亲跑）**：提交 `3846c43f`（产品+测试 69 档 · +2181/−912；双推 origin ∥ github）⇒ 机上 `git pull --ff-only` 至 `3846c43f` ⇒ 镜像重建 **`2756325800df`** ⇒ `docker compose up -d` 重起 ⇒ **Up (healthy)**；`/healthz` = `{"status":"ok","version":"0.1.0","uptime":20,"db":"ok"}`；镜像内 `src/ops/presets.mjs` 实测 = `gemini-openai` 命中 2 ∥ **`model:` 命中 0** ∥ `baseURL` 26——服务端面零真源零模型键坐实。

**收口清单**：批档冻结（本节）∥ 设计档 11 档翻转 + 需求档 4 档（已入 docs 提交）∥ 提交面 = `3846c43f`（产品+测试）+ docs 提交（批档 + 设计/需求回填）∥ 台账 **#1122 归批 → 已核销**（证据 = 本节）∥ 交接（不阻本批）：#1128/#1129 = server-config 批在途（代理舱在飞）∥ #1135/#1136 新挂 ∥ #1108 卷内重基待办。

**核销面**：`#1122` 已核销（本批全链终）。
